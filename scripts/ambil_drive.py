"""Unduh semua file patroli SMART (zip per ST) dari folder Google Drive publik.

Tidak memerlukan API key: daftar file dibaca dari tampilan folder tersemat (embeddedfolderview),
lalu tiap file diunduh lewat tautan unduhan publik. Folder harus dibagikan "siapa saja yang memiliki link".

Pemakaian: python scripts/ambil_drive.py <folder_id> <folder_tujuan>
"""
import html
import re
import sys
import time
import urllib.request
from pathlib import Path

UA = {"User-Agent": "Mozilla/5.0 (dashboard-smart-tambora)"}


def get(url, tries=4):
    for i in range(tries):
        try:
            with urllib.request.urlopen(urllib.request.Request(url, headers=UA), timeout=120) as r:
                return r.read(), r.headers.get_content_type()
        except Exception as e:  # jaringan Drive kadang putus; coba lagi
            if i == tries - 1:
                raise
            print(f"  ulangi ({e})", file=sys.stderr)
            time.sleep(2 ** (i + 1))


def daftar_file(folder_id):
    page, _ = get(f"https://drive.google.com/embeddedfolderview?id={folder_id}")
    page = page.decode("utf-8", "replace")
    files = re.findall(r'/file/d/([A-Za-z0-9_-]+).*?flip-entry-title">([^<]*)<', page, re.S)
    return [(fid, html.unescape(name).strip()) for fid, name in files]


def unduh(fid):
    data, ctype = get(f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t")
    if ctype == "text/html":
        # File besar: Drive menampilkan halaman konfirmasi pemindaian virus; ambil token uuid-nya.
        page = data.decode("utf-8", "replace")
        uuid = re.search(r'name="uuid" value="([^"]+)"', page)
        if not uuid:
            raise RuntimeError("Drive mengembalikan halaman HTML, bukan file (cek izin berbagi folder)")
        data, ctype = get(f"https://drive.usercontent.google.com/download?id={fid}&export=download&confirm=t&uuid={uuid.group(1)}")
    return data


def main():
    folder_id, out = sys.argv[1], Path(sys.argv[2])
    out.mkdir(parents=True, exist_ok=True)
    files = daftar_file(folder_id)
    if not files:
        sys.exit("Folder kosong atau tidak bisa dibaca. Pastikan dibagikan ke 'siapa saja yang memiliki link'.")
    for fid, name in files:
        safe = re.sub(r"[^A-Za-z0-9._-]+", "_", name) or fid
        print(f"unduh {name}")
        (out / safe).write_bytes(unduh(fid))
    print(f"{len(files)} file diunduh ke {out}")


if __name__ == "__main__":
    main()
