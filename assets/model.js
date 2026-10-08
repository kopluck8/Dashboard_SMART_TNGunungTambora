// Dibangkitkan dari datamodel.xml SMART (kategori aktif saja).
window.SMART_MODEL = [
 {
  "slug": "aktivitas-manusia",
  "name": "Aktivitas Manusia",
  "short": "Aktivitas Manusia",
  "desc": "Temuan aktivitas manusia di dalam kawasan: pelaku, kebakaran, pembalakan, perburuan, penggunaan kawasan, HHBK, penambangan, alat kerja, akses jalan, dan penggembalaan ternak.",
  "fields": [],
  "subs": [
   {
    "name": "Pelaku",
    "fields": [
     "Pelaku melarikan diri",
     "Nama pelaku",
     "Asal",
     "Jenis kelamin",
     "Umur",
     "Jumlah pelaku",
     "Pelanggaran",
     "Tipe temuan",
     "Jumlah",
     "Satuan",
     "Tindakan",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Kebakaran Hutan dan Lahan",
    "fields": [
     "Pelanggaran",
     "Tipe temuan",
     "Jumlah",
     "Satuan",
     "Penyebab Kebakaran",
     "Vegetasi Terdampak",
     "Tindakan",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Pembalakan",
    "fields": [
     "Pelanggaran",
     "Tipe temuan",
     "Jenis tumbuhan",
     "Jumlah",
     "Satuan",
     "Usia temuan",
     "Keaktifan",
     "Tindakan",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Perburuan Satwa",
    "fields": [
     "Pelanggaran",
     "Tipe temuan",
     "Jumlah",
     "Satuan",
     "Usia temuan",
     "Keaktifan",
     "Tindakan",
     "Nama pelaku indikatif",
     "Jenis satwa",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Penggunaan Kawasan",
    "fields": [
     "Pelanggaran",
     "Nama kelompok",
     "Tipe temuan",
     "Jumlah",
     "Satuan",
     "Jenis satwa",
     "Usia temuan",
     "Keaktifan",
     "Modus penggunaan kawasan",
     "Tindakan",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Pengambilan HHBK",
    "fields": [
     "Pelanggaran",
     "Tipe temuan",
     "Jumlah",
     "Satuan",
     "Keterangan"
    ]
   },
   {
    "name": "Penambangan dan Pengeboran",
    "fields": [
     "Pelanggaran",
     "Tipe temuan",
     "Metode penambangan",
     "Jumlah",
     "Satuan",
     "Usia temuan",
     "Keaktifan",
     "Tindakan",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Alat Kerja dan Transportasi",
    "fields": [
     "Pelanggaran",
     "Tipe temuan",
     "Jumlah",
     "Satuan",
     "Usia temuan",
     "Keaktifan",
     "Tindakan",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Pembuatan Akses Jalan",
    "fields": [
     "Pelanggaran",
     "Tipe temuan",
     "Jumlah",
     "Satuan",
     "Tanda aktifitas",
     "Usia temuan",
     "Keaktifan",
     "Tindakan",
     "Perlu tindak lanjut",
     "Keterangan"
    ]
   },
   {
    "name": "Pengembalaan Ternak",
    "fields": [
     "Nama kelompok",
     "Jenis kelamin",
     "Asal",
     "Lokasi",
     "Kode Tanda Ternak",
     "Alamat"
    ]
   }
  ]
 },
 {
  "slug": "satwa-liar",
  "name": "Satwa Liar",
  "short": "Satwa Liar",
  "desc": "Perjumpaan langsung, tanda keberadaan, dan temuan satwa mati selama patroli.",
  "fields": [],
  "subs": [
   {
    "name": "Perjumpaan Satwa",
    "fields": [
     "Jenis satwa",
     "Jenis kelamin satwa",
     "Kondisi satwa",
     "Umur satwa",
     "Jumlah",
     "Satuan",
     "Keterangan",
     "Status",
     "Jarak ke satwa (m)",
     "Azimuth (derajat)"
    ]
   },
   {
    "name": "Tanda Satwa",
    "fields": [
     "Jenis satwa",
     "Tipe temuan",
     "Usia temuan",
     "Keterangan"
    ]
   },
   {
    "name": "Satwa Mati",
    "fields": [
     "Jenis satwa",
     "Jenis kelamin satwa",
     "Jumlah",
     "Kondisi satwa mati",
     "Tanda pada satwa mati",
     "Keutuhan bangkai",
     "Indikasi penyebab kematian",
     "Keterangan"
    ]
   }
  ]
 },
 {
  "slug": "tumbuhan",
  "name": "Tumbuhan",
  "short": "Tumbuhan",
  "desc": "Inventarisasi jenis tumbuhan yang dijumpai, tipe temuan, dan kondisinya.",
  "fields": [
   "Tipe temuan",
   "Jenis tumbuhan",
   "Kondisi tumbuhan",
   "Keterangan"
  ],
  "subs": []
 },
 {
  "slug": "spesies-invasif",
  "name": "Spesies invasif",
  "short": "Spesies Invasif",
  "desc": "Temuan jenis tumbuhan invasif beserta jumlah dan satuannya.",
  "fields": [
   "Tipe temuan",
   "Jenis tumbuhan",
   "Jumlah",
   "Satuan"
  ],
  "subs": []
 },
 {
  "slug": "fitur",
  "name": "Fitur",
  "short": "Fitur",
  "desc": "Kondisi pal batas, media informasi, sarana prasarana, dan fitur alami di kawasan.",
  "fields": [],
  "subs": [
   {
    "name": "Pal Batas",
    "fields": [
     "No. pal",
     "Tipe temuan",
     "Kondisi",
     "Perlu tindak lanjut",
     "Keterangan",
     "Status tindak lanjut",
     "Tanggal tindak lanjut"
    ]
   },
   {
    "name": "Media Informasi",
    "fields": [
     "Tipe temuan",
     "Kondisi",
     "Perlu tindak lanjut",
     "Keterangan",
     "Status tindak lanjut",
     "Tanggal tindak lanjut"
    ]
   },
   {
    "name": "Fitur Alami",
    "fields": [
     "Tipe temuan",
     "Perlu tindak lanjut",
     "Keterangan",
     "Status tindak lanjut",
     "Tanggal tindak lanjut"
    ]
   }
  ]
 },
 {
  "slug": "ground-check",
  "name": "Ground Check",
  "short": "Ground Check",
  "desc": "Pengecekan lapangan tipe ekosistem dan tutupan lahan.",
  "fields": [],
  "subs": [
   {
    "name": "Tipe Ekosistem",
    "fields": [
     "Klasifikasi 1",
     "Klasifikasi 2",
     "Klasifikasi 3",
     "Klasifikasi 4"
    ]
   },
   {
    "name": "Tutupan Lahan",
    "fields": [
     "Klasifikasi 01",
     "Klasifikasi 02",
     "Keterangan"
    ]
   }
  ]
 },
 {
  "slug": "pengelolaan",
  "name": "Pengelolaan",
  "short": "Pengelolaan",
  "desc": "Kegiatan pengelolaan, termasuk perawatan media informasi.",
  "fields": [],
  "subs": [
   {
    "name": "Pengelolaan Media informasi",
    "fields": [
     "Lokasi",
     "Jenis kegiatan",
     "Tipe temuan",
     "Isi media informasi",
     "Keterangan"
    ]
   }
  ]
 },
 {
  "slug": "penyuluhan",
  "name": "Penyuluhan dan Pemberdayaan Masyarakat",
  "short": "Penyuluhan",
  "desc": "Sosialisasi, anjangsana, Tambora Goes To School, potensi sosial budaya, serta pendampingan dan monev kelompok binaan.",
  "fields": [],
  "subs": [
   {
    "name": "Sosialisasi",
    "fields": [
     "Jenis kegiatan",
     "Nama kelompok",
     "Alamat",
     "Jumlah partisipan",
     "Satuan",
     "Keterangan"
    ]
   },
   {
    "name": "Anjangsana",
    "fields": [
     "Jenis kegiatan",
     "Nama Masyarakat",
     "Keterangan"
    ]
   },
   {
    "name": "Tambora Goes To School",
    "fields": [
     "Nama Sekolah",
     "Alamat",
     "Jenis kegiatan",
     "Jumlah partisipan",
     "Satuan",
     "Keterangan"
    ]
   },
   {
    "name": "Identifikasi Potensi Sosial Budaya",
    "fields": [
     "Jenis kegiatan",
     "Nama Budaya",
     "Jenis Budaya",
     "Nama Pewaris",
     "Nama desa",
     "Keterangan"
    ]
   },
   {
    "name": "Pendampingan Kelompok Binaan",
    "fields": [
     "Jenis kegiatan",
     "Nama Kelompok Binaan",
     "Jenis Usaha Kelompok Binaan",
     "Hasil Pembinaan",
     "Status Kelompok Binaan",
     "Keterangan"
    ]
   },
   {
    "name": "Monev Kelompok Binaan",
    "fields": [
     "Jenis kegiatan",
     "Nama Kelompok Binaan",
     "Jenis Usaha Kelompok Binaan",
     "Hasil Monev",
     "Status Kelompok Binaan",
     "Keterangan"
    ]
   }
  ]
 },
 {
  "slug": "jalur-pendakian",
  "name": "Penjagaan Jalur Pendakian dan ODTWA",
  "short": "Jalur Pendakian & ODTWA",
  "desc": "Pelayanan pengunjung wisata dan penanganan sampah pengunjung di jalur pendakian dan ODTWA.",
  "fields": [],
  "subs": [
   {
    "name": "Pelayanan Pengunjung Wisata",
    "fields": [
     "Jenis Kegiatan Wisata",
     "Asal Wisatawan",
     "Alamat",
     "Jumlah Wisatawan",
     "Jumlah Perempuan",
     "Jumlah Laki - Laki"
    ]
   },
   {
    "name": "Penanganan Sampah Pengunjung",
    "fields": [
     "Jenis Kegiatan Wisata",
     "Jumlah Sampah",
     "Satuan"
    ]
   }
  ]
 }
];
