# Dashboard Data SMART Patrol · TN Gunung Tambora

Situs statis (HTML + JavaScript, tanpa server) untuk GitHub Pages. Semua angka, grafik, peta, dan tabel dihitung langsung di browser dari data SMART, jadi memperbarui data cukup dengan memperbarui spreadsheet.

## Halaman

| File | Isi |
|---|---|
| `index.html` | Overview kawasan: ringkasan, kategori, tren bulanan, rekap per SPTN dan resor (bisa diklik untuk mengerucut ke satu SPTN atau resor), peta, daftar temuan yang perlu perhatian |
| `aktivitas-manusia.html` | Kategori 0: Aktivitas Manusia |
| `satwa-liar.html` | Kategori 0: Satwa Liar |
| `tumbuhan.html` | Kategori 0: Tumbuhan |
| `spesies-invasif.html` | Kategori 0: Spesies invasif |
| `fitur.html` | Kategori 0: Fitur |
| `ground-check.html` | Kategori 0: Ground Check |
| `pengelolaan.html` | Kategori 0: Pengelolaan |
| `penyuluhan.html` | Kategori 0: Penyuluhan dan Pemberdayaan Masyarakat |
| `jalur-pendakian.html` | Kategori 0: Penjagaan Jalur Pendakian dan ODTWA |

Setiap halaman kategori berisi: angka ringkas, komposisi sub-kategori (sesuai data model, termasuk yang belum pernah tercatat), tren bulanan, daftar jenis (satwa/tumbuhan), rincian setiap atribut data model, peta sebaran, rekap per resor, dan tabel rincian yang bisa dicari.

Tambahkan `?embed=1` di akhir alamat untuk menyembunyikan kepala halaman saat disematkan di Google Sites, misalnya `https://<akun>.github.io/<repo>/tumbuhan.html?embed=1`.

## Sumber data

1. Impor CSV ekspor SMART Desktop ke Google Sheets. Judul kolom boleh memakai spasi atau garis bawah. Data tahun lalu boleh digabung di sheet yang sama; tampilan awal hanya menampilkan tahun `TAHUN_AWAL` (2026), tahun lain bisa dipilih di filter bulan.
2. Tambahkan kolom **Resor** berisi nama resor tiap baris. Nama yang dikenali (boleh tanpa kata "Resor", huruf besar/kecil bebas):
   - SPTN Wilayah I Kore: Resor Piong, Resor Oi Katupa, Resor Kawinda Toi
   - SPTN Wilayah II Pekat: Resor Doroncanga, Resor Doropeti, Resor Pancasila

   Baris yang kosong tampil sebagai "Resor belum diisi". Daftar dan urutan resor diatur di `RESOR_LIST` pada `assets/config.js`.
3. File > Bagikan > Publikasikan ke web > pilih sheet tersebut > format **CSV** > Publikasikan. Salin tautannya.
4. Tempel tautan itu ke `SHEET_CSV_URL` di `assets/config.js`.

Bila tautan kosong atau tidak bisa dibaca, dashboard memakai `data/data.csv`.

## Privasi

Saat ini semua nama (masyarakat, pelaku indikatif, kelompok, kode ternak) ditampilkan, sesuai keputusan 8 Oktober 2026. Bila nanti perlu disembunyikan lagi, isi `SEMBUNYIKAN` di `assets/config.js`, misalnya `"Aktivitas Manusia": ["Nama pelaku", "Nama pelaku indikatif"]`. Ingat bahwa CSV yang dipublikasikan dari Google Sheets tetap bisa dibuka siapa saja yang tahu tautannya.

## Capaian grid, ST terlaksana, dan coverage area

1. Di spreadsheet yang sama, buat tab baru, misalnya `Capaian Grid`, berisi 2 kolom: `Capaian Grid Tahun` dan `Jumlah Capaian`. Satu baris per tahun (contoh: `2026 | 87`).
2. Buat tab `ST Terlaksana` dengan pola yang sama: `Tahun` dan `Jumlah ST`.
3. Buat tab `Capaian Coverage Area` dengan pola yang sama: `Tahun` dan `Luas (ha)`. Angka desimal boleh memakai koma atau titik.
4. Publikasikan masing-masing tab ke web sebagai CSV, lalu tempel tautannya di `CAPAIAN` pada `assets/config.js`.

Angka yang tampil di Overview adalah jumlah untuk tahun yang tercakup filter bulan.

## Layer peta

Letakkan file berikut di folder `assets/`: `tambora.geojson` (batas kawasan), `resor.geojson` (batas resor), `grid.geojson` (grid pengelolaan), `jalur.geojson` (jalur). Layer ini tidak dimuat sampai dicentang di tombol layer peta, jadi halaman tetap ringan. Gunakan koordinat WGS84 (EPSG:4326). Nama file, label, dan warna bisa diubah di `LAYER_PETA` pada `assets/config.js`.

## Logo

Simpan logo sebagai `assets/logo.png`. Bila file belum ada, kepala halaman tampil tanpa logo.

## Status perlindungan dan IUCN

Kolom Status dari SMART tidak dipakai. Status diambil dari `assets/status-spesies.js` berdasarkan nama ilmiah: perlindungan menurut Lampiran Permen LHK P.106/MENLHK/SETJEN/KUM.1/12/2018, dan kategori Daftar Merah IUCN. Jenis baru yang belum ada di file itu tampil sebagai "Belum dicek"; tambahkan satu baris untuk jenis tersebut.

## Struktur

- `assets/app.js`: semua logika olah data dan tampilan
- `assets/model.js`: kategori, sub-kategori, dan atribut dari `datamodel.xml` SMART
- `assets/config.js`: tautan data, resor, capaian, layer peta, logo
- `assets/status-spesies.js`: status perlindungan dan IUCN per jenis
- `assets/style.css`: tampilan
- `assets/vendor/`: Chart.js 4.4.1, PapaParse 5.4.1, Leaflet 1.9.4 (disimpan lokal agar tidak bergantung pada CDN)

## Memasang di GitHub Pages

1. Buat repositori baru di akun GitHub-mu, lalu unggah seluruh isi folder ini (bukan foldernya) ke cabang `main`.
2. Buka Settings > Pages, pilih Source "Deploy from a branch", cabang `main`, folder `/ (root)`, lalu Save.
3. Setelah beberapa menit, situs tersedia di `https://<akun>.github.io/<nama-repo>/`.
4. Di Google Sites: Sisipkan > Sematkan > Menurut URL, lalu tempel alamat halaman yang diinginkan dengan akhiran `?embed=1`.
