"""Susun kamus kode SMART -> nama (data/kamus-smart.json) dengan mencocokkan file patroli XML dengan
ekspor query SMART (data/data.csv) yang sudah berisi nama. Dipakai bila datamodel.xml belum tersedia;
kode yang belum pernah muncul di data.csv tetap tampil sebagai kode sampai kamus/datamodel diperbarui.

Pemakaian: python scripts/belajar_kamus.py <folder_zip> data/data.csv data/kamus-smart.json
"""
import collections
import csv
import datetime
import json
import sys

import konversi_patroli as kp

INTI = {"Source", "Waypoint ID", "Waypoint Date", "Waypoint Time", "X", "Y", "Comment", "Last Modified",
        "Last Modified By", "Observation Category 0", "Observation Category 1", "Observation Group"}
# Kode atribut yang namanya tidak bisa ditebak dari judul kolom
ATRIBUT_MANUAL = {"azimuth": "Azimuth (derajat)", "klasifikasi1te": "Klasifikasi 1", "klasifikasi2te": "Klasifikasi 2",
                  "jeniswisata": "Jenis Kegiatan Wisata"}


class Mentah(kp.DataModel):
    def nama_kategori(self, k): return [k]
    def nama_atribut(self, k): return k
    def nama_item(self, a, i): return "\x00" + i


def kunci_wp(tgl, jam, x, y):
    return (tgl + " " + jam, round(float(x), 5), round(float(y), 5))


def main():
    folder, csv_path, out = sys.argv[1:4]
    resor = kp.Resor(kp.ROOT / "assets" / "resor.geojson")
    A = collections.defaultdict(list)
    for nama, isi in kp.baca_folder(folder):
        for r in kp.baca_patroli(isi, nama, Mentah(), resor)[0]:
            A[kunci_wp(r["Waypoint Date"], r["Waypoint Time"], r["X"], r["Y"])].append(r)
    B = collections.defaultdict(list)
    rows = list(csv.DictReader(open(csv_path, encoding="utf-8-sig")))
    for r in rows:
        d = datetime.datetime.strptime(r["Waypoint Date"] + " " + r["Waypoint Time"], "%b %d, %Y %I:%M:%S %p")
        B[kunci_wp(d.strftime("%Y-%m-%d"), d.strftime("%H:%M:%S"), r["X"], r["Y"])].append(r)
    kolom = [c for c in rows[0] if c not in INTI]
    atribut = dict(ATRIBUT_MANUAL)
    kat = collections.defaultdict(collections.Counter)
    item = collections.defaultdict(lambda: collections.defaultdict(collections.Counter))
    for k, xs in A.items():
        ys = B.get(k)
        if not ys or len(xs) != 1 or len(ys) != 1:
            continue
        x, y = xs[0], ys[0]
        kat[x["Observation Category 0"]][(y["Observation Category 0"], y["Observation Category 1"])] += 1
        for ak, v in x.items():
            if not isinstance(v, str) or not v.startswith("\x00"):
                continue
            nama = atribut.get(ak) or next((c for c in kolom if kp.kunci(c) == ak), None)
            if not nama:
                continue
            atribut[ak] = nama
            kode = v.split(", \x00")
            if len(kode) == 1 and y.get(nama, "").strip():
                item[ak][kode[0][1:]][y[nama].strip()] += 1
    for r in A.values():
        for x in r:
            for ak in x:
                if ak not in atribut:
                    nama = next((c for c in kolom if kp.kunci(c) == ak), None)
                    if nama:
                        atribut[ak] = nama
    hasil = {
        "kategori": {k: list(c.most_common(1)[0][0]) for k, c in sorted(kat.items())},
        "atribut": dict(sorted(atribut.items())),
        "item": {a: {i: c.most_common(1)[0][0] for i, c in sorted(v.items())} for a, v in sorted(item.items())},
    }
    with open(out, "w", encoding="utf-8") as fh:
        json.dump(hasil, fh, ensure_ascii=False, indent=1)
    print(f"{len(hasil['kategori'])} kategori, {len(hasil['atribut'])} atribut, {sum(map(len, hasil['item'].values()))} pilihan")


if __name__ == "__main__":
    main()
