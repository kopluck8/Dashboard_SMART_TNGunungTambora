# Dashboard Data SMART Patrol · TN Gunung Tambora

Situs statis (HTML + JavaScript, tanpa server) untuk GitHub Pages. Semua angka, grafik, peta, dan tabel dihitung langsung di browser dari data SMART, jadi memperbarui data cukup dengan memperbarui spreadsheet.

## Halaman

| File | Isi |
|---|---|
| `index.html` | Dashboard kawasan: ringkasan, kategori, tren bulanan, rekap per SPTN dan resor (bisa diklik untuk mengerucut ke satu SPTN atau resor), peta, daftar temuan yang perlu perhatian |
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

1. Impor CSV ekspor SMART Desktop ke Google Sheets (biarkan nama kolom seperti aslinya). Format kolom `Waypoint Date` sebaiknya tetap teks seperti `Jul 23, 2026`.
2. Tambahkan kolom **Resor** berisi nama resor tiap baris. Nama yang dikenali (boleh tanpa kata "Resor", huruf besar/kecil bebas):
   - SPTN Wilayah I Kore: Resor Piong, Resor Oi Katupa, Resor Kawinda Toi
   - SPTN Wilayah II Pekat: Resor Doroncanga, Resor Doropeti, Resor Pancasila

   Baris yang kosong tampil sebagai "Resor belum diisi". Daftar dan urutan resor diatur di `RESOR_LIST` pada `assets/config.js`.
3. File > Bagikan > Publikasikan ke web > pilih sheet tersebut > format **CSV** > Publikasikan. Salin tautannya.
4. Tempel tautan itu ke `SHEET_CSV_URL` di `assets/config.js`.

Bila tautan kosong atau tidak bisa dibaca, dashboard memakai `data/data.csv`.

## Privasi nama pelaku

Pada kategori Aktivitas Manusia, kolom `Nama pelaku`, `Nama pelaku indikatif`, `Nama kelompok`, dan `Kode Tanda Ternak` dikosongkan oleh dashboard dan sudah dikosongkan di `data/data.csv`. Daftarnya diatur di `SEMBUNYIKAN` pada `assets/config.js`.

Namun CSV yang dipublikasikan dari Google Sheets bisa dibuka siapa saja yang tahu tautannya. Karena itu, **jangan publikasikan sheet data mentah**. Buat tab baru (misalnya `Publik`), isi sel A1 dengan rumus di bawah, lalu publikasikan tab `Publik` saja. Ganti `Data` dengan nama tab data mentahmu.

```
=LET(d, Data!A1:BF, h, INDEX(d, 1), k, MATCH("Observation Category 0", h, 0),
  MAKEARRAY(ROWS(d), COLUMNS(d), LAMBDA(r, c,
    IF(AND(r > 1, INDEX(d, r, k) = "Aktivitas Manusia",
           OR(INDEX(h, c) = {"Nama pelaku", "Nama pelaku indikatif", "Nama kelompok", "Kode Tanda Ternak"})),
       "", INDEX(d, r, c)))))
```

Tab `Publik` ikut berubah setiap kali tab data diperbarui.

## Struktur

- `assets/app.js`: semua logika olah data dan tampilan
- `assets/model.js`: kategori, sub-kategori, dan atribut dari `datamodel.xml` SMART
- `assets/config.js`: tautan data dan nama kolom resor
- `assets/style.css`: tampilan
- `assets/vendor/`: Chart.js 4.4.1, PapaParse 5.4.1, Leaflet 1.9.4 (disimpan lokal agar tidak bergantung pada CDN)

## Memasang di GitHub Pages

1. Buat repositori baru di akun GitHub-mu, lalu unggah seluruh isi folder ini (bukan foldernya) ke cabang `main`.
2. Buka Settings > Pages, pilih Source "Deploy from a branch", cabang `main`, folder `/ (root)`, lalu Save.
3. Setelah beberapa menit, situs tersedia di `https://<akun>.github.io/<nama-repo>/`.
4. Di Google Sites: Sisipkan > Sematkan > Menurut URL, lalu tempel alamat halaman yang diinginkan dengan akhiran `?embed=1`.
