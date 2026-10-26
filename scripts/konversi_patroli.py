"""Ubah file patroli SMART (zip/XML per ST) menjadi data siap pakai dashboard.

Keluaran (di folder data/):
  patroli-observasi.csv   satu baris per observasi, judul kolom sama seperti ekspor query SMART Desktop
  patroli-ringkasan.csv   satu baris per leg patroli (ST, mandat, tanggal, anggota, panjang jalur)
  jalur-patroli.geojson   jalur (track) tiap leg patroli, disederhanakan agar ringan dimuat di browser

Nama kategori, atribut, dan pilihan diambil dari data model SMART (datamodel.xml). Tanpa data model,
kode SMART dipakai apa adanya. Resor ditentukan dari posisi titik terhadap assets/resor.geojson.

Pemakaian: python scripts/konversi_patroli.py <folder_zip> <datamodel.xml> <kamus-smart.json> <folder_keluaran>
"""
import csv
import io
import json
import math
import re
import struct
import sys
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parent.parent
NS = "{http://www.smartconservationsoftware.org/xml/1.3/patrol}"

# Nama resor di resor.geojson -> nama resmi di config.js
RESOR_RESMI = {
    "doroncanga": "Resor Doroncanga", "pancasila": "Resor Pancasila", "doropeti": "Resor Doropeti",
    "kawindatoi": "Resor Kawinda Toi", "oikatupa": "Resor Oi Katupa", "piong": "Resor Piong",
}


def kunci(s):
    return re.sub(r"[^a-z0-9]", "", str(s or "").lower())


# ---------------- data model ----------------

def nama_dari(el, bahasa="in"):
    """Ambil label dari anak <names>/<name> (atribut value/language_code), utamakan bahasa Indonesia."""
    pilihan = []
    for ch in el:
        tag = ch.tag.split("}")[-1].lower()
        if tag in ("names", "name") and ch.get("value"):
            pilihan.append((ch.get("language_code") or ch.get("languageCode") or "", ch.get("value")))
    for lang, v in pilihan:
        if lang == bahasa:
            return v
    return pilihan[0][1] if pilihan else None


class DataModel:
    def __init__(self, path=None, kamus=None):
        self.kategori = {}   # "aktivitasmanusia.pelaku." -> ["Aktivitas Manusia", "Pelaku"]
        self.atribut = {}    # "jenissatwa" -> "Jenis satwa"
        self.item = {}       # ("jenissatwa", "burung.cikukua...") -> "Cikukua ... - Philemon buceroides"
        # Kamus hasil scripts/belajar_kamus.py dipakai sebagai dasar; datamodel.xml (bila ada) menimpanya.
        if kamus and Path(kamus).exists():
            k = json.loads(Path(kamus).read_text(encoding="utf-8"))
            self.kategori.update(k.get("kategori", {}))
            self.atribut.update(k.get("atribut", {}))
            self.item.update({(a, i): v for a, d in k.get("item", {}).items() for i, v in d.items()})
        if path and Path(path).exists():
            self._baca(ET.parse(path).getroot())

    def _baca(self, root):
        def tag(e):
            return e.tag.split("}")[-1].lower()

        # Atribut: daftar (list) atau pohon (tree); kunci item pohon ditulis lengkap "induk.anak."
        for at in root.iter():
            if tag(at) != "attribute" or not at.get("key"):
                continue
            akey = at.get("key")
            self.atribut[akey] = nama_dari(at) or akey

            def jalan(el, jalur):
                for ch in el:
                    t = tag(ch)
                    if t in ("item", "node") and ch.get("key"):
                        if t == "node":
                            p = jalur + ch.get("key") + "."
                            self.item[(akey, p)] = nama_dari(ch) or ch.get("key")
                            jalan(ch, p)
                        else:
                            self.item[(akey, ch.get("key"))] = nama_dari(ch) or ch.get("key")
                    elif t in ("list", "tree", "children"):
                        jalan(ch, jalur)
            jalan(at, "")

        def kat(el, jalur, label):
            for ch in el:
                if tag(ch) == "category" and ch.get("key"):
                    p = jalur + ch.get("key") + "."
                    lb = label + [nama_dari(ch) or ch.get("key")]
                    self.kategori[p] = lb
                    kat(ch, p, lb)
                elif tag(ch) == "categories":
                    kat(ch, jalur, label)
        kat(root, "", [])

    def nama_kategori(self, key):
        if key in self.kategori:
            return self.kategori[key]
        return [s for s in key.split(".") if s]

    def nama_atribut(self, key):
        return self.atribut.get(key, key)

    def nama_item(self, akey, ikey):
        # Kode yang belum dikenal: pakai potongan terakhirnya, misalnya "burung.cikukua." -> "cikukua"
        return self.item.get((akey, ikey)) or ([s for s in ikey.split(".") if s] or [ikey])[-1]


# ---------------- geometri ----------------

def baca_wkb(hexs):
    """WKB/EWKB (LineString atau MultiLineString, boleh Z/M) -> daftar garis [[lon, lat], ...]."""
    b = bytes.fromhex(hexs)
    pos = 0

    def geom():
        nonlocal pos
        bo = "<" if b[pos] == 1 else ">"
        pos += 1
        (t,) = struct.unpack_from(bo + "I", b, pos)
        pos += 4
        z, m = bool(t & 0x80000000), bool(t & 0x40000000)
        if t & 0x20000000:
            pos += 4
        t &= 0x0FFFFFFF
        if t >= 1000:  # gaya ISO: 1002 = LineString Z
            z, m, t = z or t // 1000 in (1, 3), m or t // 1000 in (2, 3), t % 1000
        dim = 2 + z + m
        if t == 2:
            (n,) = struct.unpack_from(bo + "I", b, pos)
            pos += 4
            pts = [struct.unpack_from(bo + "d" * dim, b, pos + i * 8 * dim)[:2] for i in range(n)]
            pos += 8 * dim * n
            return [[list(p) for p in pts]]
        if t == 5:
            (n,) = struct.unpack_from(bo + "I", b, pos)
            pos += 4
            out = []
            for _ in range(n):
                out += geom()
            return out
        raise ValueError(f"tipe WKB {t} tidak didukung")
    return geom()


def jarak_m(a, b):
    R = 6371008.8
    la1, la2 = math.radians(a[1]), math.radians(b[1])
    dla, dlo = la2 - la1, math.radians(b[0] - a[0])
    h = math.sin(dla / 2) ** 2 + math.cos(la1) * math.cos(la2) * math.sin(dlo / 2) ** 2
    return 2 * R * math.asin(math.sqrt(h))


def sederhanakan(pts, tol=0.00004):
    """Douglas-Peucker (toleransi derajat, ~4 m) agar GeoJSON jalur tetap kecil."""
    if len(pts) < 3:
        return pts
    keep = [False] * len(pts)
    keep[0] = keep[-1] = True
    stack = [(0, len(pts) - 1)]
    while stack:
        i, j = stack.pop()
        (x1, y1), (x2, y2) = pts[i], pts[j]
        dx, dy = x2 - x1, y2 - y1
        L = dx * dx + dy * dy
        best, k = -1, -1
        for n in range(i + 1, j):
            x, y = pts[n]
            if L == 0:
                d = (x - x1) ** 2 + (y - y1) ** 2
            else:
                t = max(0, min(1, ((x - x1) * dx + (y - y1) * dy) / L))
                d = (x - x1 - t * dx) ** 2 + (y - y1 - t * dy) ** 2
            if d > best:
                best, k = d, n
        if best > tol * tol:
            keep[k] = True
            stack += [(i, k), (k, j)]
    return [[round(p[0], 6), round(p[1], 6)] for p, k in zip(pts, keep) if k]


class Resor:
    def __init__(self, path):
        self.poli = []
        g = json.loads(Path(path).read_text(encoding="utf-8"))
        for f in g["features"]:
            nama = f["properties"].get("NAME") or f["properties"].get("Nama") or ""
            k = kunci(re.sub(r"^\s*(resort|resor)\s+", "", nama, flags=re.I))
            nama = RESOR_RESMI.get(k, nama)
            geo = f["geometry"]
            polys = geo["coordinates"] if geo["type"] == "MultiPolygon" else [geo["coordinates"]]
            for p in polys:
                xs = [c[0] for c in p[0]]
                ys = [c[1] for c in p[0]]
                self.poli.append((nama, p, (min(xs), min(ys), max(xs), max(ys))))

    @staticmethod
    def _dalam(x, y, ring):
        ada = False
        j = len(ring) - 1
        for i in range(len(ring)):
            xi, yi = ring[i][0], ring[i][1]
            xj, yj = ring[j][0], ring[j][1]
            if (yi > y) != (yj > y) and x < (xj - xi) * (y - yi) / (yj - yi) + xi:
                ada = not ada
            j = i
        return ada

    def cari(self, x, y, maks_m=3000):
        if x is None or y is None:
            return ""
        for nama, p, bb in self.poli:
            if bb[0] <= x <= bb[2] and bb[1] <= y <= bb[3] and self._dalam(x, y, p[0]) \
                    and not any(self._dalam(x, y, h) for h in p[1:]):
                return nama
        # Titik di luar batas (misalnya di desa penyangga): resor terdekat bila masih dalam maks_m meter.
        best, jarak = "", maks_m
        for nama, p, bb in self.poli:
            if not (bb[0] - 0.03 <= x <= bb[2] + 0.03 and bb[1] - 0.03 <= y <= bb[3] + 0.03):
                continue
            for c in p[0]:
                d = jarak_m((x, y), c)
                if d < jarak:
                    best, jarak = nama, d
        return best


# ---------------- patroli ----------------

def angka(v):
    try:
        f = float(v)
        return int(f) if f.is_integer() else f
    except (TypeError, ValueError):
        return v


def baca_patroli(xml_bytes, nama_file, dm, resor):
    root = ET.fromstring(xml_bytes)
    st = root.get("id") or nama_file
    teks = lambda el, t: (el.find(NS + t).get("value") if el.find(NS + t) is not None else "")
    sptn, tim = teks(root, "station"), teks(root, "team")
    obs, legs = [], []
    for leg in root.findall(NS + "legs"):
        anggota = leg.findall(NS + "members")
        ketua = [f'{m.get("givenName", "")} {m.get("familyName", "")}'.strip() for m in anggota if m.get("isLeader") == "true"]
        hari = leg.findall(NS + "days")
        n_wp = 0
        for day in hari:
            tgl = day.get("date", "")
            for wp in day.findall(NS + "waypoints"):
                n_wp += 1
                x, y = angka(wp.get("x")), angka(wp.get("y"))
                kom = (wp.findtext(NS + "comment") or "").strip()
                rs = resor.cari(x, y) if isinstance(x, (int, float)) else ""
                for gi, grp in enumerate(wp.findall(NS + "groups")):
                    gid = f"{st}|{leg.get('id')}|{tgl}|{wp.get('id')}|{gi}"
                    for o in grp.findall(NS + "observations"):
                        kat = dm.nama_kategori(o.get("categoryKey", ""))
                        row = {
                            "Source": "Patrol", "Waypoint ID": wp.get("id"), "Waypoint Date": tgl,
                            "Waypoint Time": wp.get("time", ""), "X": x, "Y": y, "Comment": kom,
                            "Observation Category 0": kat[0] if kat else "",
                            "Observation Category 1": kat[1] if len(kat) > 1 else "",
                            "Observation Group": gid, "Resor": rs, "ST": st, "SPTN": sptn,
                            "Foto": len(o.findall(NS + "attachments")),
                        }
                        for a in o.findall(NS + "attributes"):
                            ak = a.get("attributeKey")
                            nama = dm.nama_atribut(ak)
                            items = [dm.nama_item(ak, i.text) for i in a.findall(NS + "itemKey") if i.text]
                            if items:
                                row[nama] = ", ".join(items)
                            elif a.find(NS + "dValue") is not None:
                                row[nama] = angka(a.findtext(NS + "dValue"))
                            elif a.find(NS + "bValue") is not None:
                                row[nama] = "Ya" if a.findtext(NS + "bValue") == "true" else "Tidak"
                            else:
                                row[nama] = (a.findtext(NS + "sValue") or "").strip()
                        obs.append(row)
        garis = []
        for tr in leg.iter(NS + "track"):
            if tr.get("geom"):
                garis += [g for g in baca_wkb(tr.get("geom")) if len(g) > 1]
        panjang = sum(jarak_m(g[i], g[i + 1]) for g in garis for i in range(len(g) - 1))
        semua = [p for g in garis for p in g]
        # Resor jalur = resor yang paling banyak dilalui titik jalur
        hitung = {}
        for p in semua[:: max(1, len(semua) // 200)]:
            r = resor.cari(p[0], p[1])
            if r:
                hitung[r] = hitung.get(r, 0) + 1
        rs = max(hitung, key=hitung.get) if hitung else ""
        info = {
            "ST": st, "Leg": leg.get("id"), "Tanggal mulai": leg.get("startDate", ""),
            "Tanggal selesai": leg.get("endDate", ""), "Hari patroli": len(hari),
            "Mandat": teks(leg, "mandate"), "Transportasi": teks(leg, "transportType"),
            "SPTN": sptn, "Tim": tim, "Resor": rs, "Ketua": ", ".join(ketua), "Jumlah anggota": len(anggota),
            "Anggota": ", ".join(f'{m.get("givenName", "")} {m.get("familyName", "")}'.strip() for m in anggota),
            "Jumlah waypoint": n_wp, "Panjang jalur (km)": round(panjang / 1000, 2), "File": nama_file,
        }
        legs.append(info)
        if garis:
            g2 = [sederhanakan(g) for g in garis]
            legs[-1]["_geom"] = ({"type": "LineString", "coordinates": g2[0]} if len(g2) == 1
                                 else {"type": "MultiLineString", "coordinates": g2})
    return obs, legs


def baca_folder(folder):
    """Hasilkan (nama_file, isi_xml) dari setiap zip/xml di folder."""
    for f in sorted(Path(folder).iterdir()):
        if f.suffix.lower() == ".zip":
            with zipfile.ZipFile(f) as z:
                for n in z.namelist():
                    if n.lower().endswith(".xml") and "/" not in n.strip("/"):
                        yield f.name, z.read(n)
        elif f.suffix.lower() == ".xml":
            yield f.name, f.read_bytes()


def tulis_csv(path, rows, depan):
    kolom = list(depan) + sorted({k for r in rows for k in r if k not in depan and not k.startswith("_")})
    with open(path, "w", newline="", encoding="utf-8") as fh:
        w = csv.DictWriter(fh, fieldnames=kolom, extrasaction="ignore")
        w.writeheader()
        w.writerows(rows)


def main():
    folder, dm_path, kamus, out = sys.argv[1], sys.argv[2], sys.argv[3], Path(sys.argv[4])
    out.mkdir(parents=True, exist_ok=True)
    dm = DataModel(dm_path, kamus)
    if not Path(dm_path).exists():
        print("Catatan: datamodel.xml belum ada, nama diambil dari kamus-smart.json", file=sys.stderr)
    resor = Resor(ROOT / "assets" / "resor.geojson")
    semua_obs, semua_leg, lihat_obs, lihat_leg = [], [], set(), set()
    for nama, isi in baca_folder(folder):
        obs, legs = baca_patroli(isi, nama, dm, resor)
        for r in obs:
            # Waypoint yang sama bisa ikut di lebih dari satu file ST: buang duplikat berdasarkan isi.
            sig = json.dumps({k: v for k, v in r.items() if k not in ("Observation Group", "ST", "Waypoint ID")}, sort_keys=True, default=str)
            if sig not in lihat_obs:
                lihat_obs.add(sig)
                semua_obs.append(r)
        for lg in legs:
            sig = (lg["ST"], lg["Leg"], lg["Tanggal mulai"])
            if sig not in lihat_leg:
                lihat_leg.add(sig)
                semua_leg.append(lg)
        print(f"{nama}: {len(obs)} observasi, {len(legs)} leg")
    semua_obs.sort(key=lambda r: (r["Waypoint Date"], r["Waypoint Time"]))
    semua_leg.sort(key=lambda r: (r["Tanggal mulai"], r["ST"], r["Leg"]))
    inti = ["Source", "Waypoint ID", "Waypoint Date", "Waypoint Time", "X", "Y", "Comment",
            "Observation Category 0", "Observation Category 1", "Observation Group", "Resor", "SPTN", "ST", "Foto"]
    tulis_csv(out / "patroli-observasi.csv", semua_obs, inti)
    tulis_csv(out / "patroli-ringkasan.csv", semua_leg, [k for k in semua_leg[0] if not k.startswith("_")] if semua_leg else [])
    fitur = [{"type": "Feature", "properties": {k: v for k, v in lg.items() if k not in ("_geom", "Anggota", "File")},
              "geometry": lg["_geom"]} for lg in semua_leg if "_geom" in lg]
    (out / "jalur-patroli.geojson").write_text(
        json.dumps({"type": "FeatureCollection", "features": fitur}, ensure_ascii=False, separators=(",", ":")), encoding="utf-8")
    print(f"Total: {len(semua_obs)} observasi, {len(semua_leg)} leg, {len(fitur)} jalur")


if __name__ == "__main__":
    main()
