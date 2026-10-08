// Pengaturan dashboard. Ubah file ini saja bila sumber data berganti.
window.SMART_CONFIG = {
  // Tautan CSV dari Google Sheets (File > Bagikan > Publikasikan ke web > pilih sheet > CSV).
  // Kosongkan untuk memakai file data/data.csv di repositori.
  SHEET_CSV_URL: "https://docs.google.com/spreadsheets/d/e/2PACX-1vTZqgHUgDRXs14VKsKvcj45GBZqFA08PC5U_76BVrR0upSuDcIIGISAhgi6M5f5CjPhuw1lWAb6ekao/pub?output=csv",

  // File cadangan bila Google Sheets tidak bisa dibaca.
  FALLBACK_CSV: "data/data.csv",

  // Nama kolom resor yang akan ditambahkan di spreadsheet (tidak peka huruf besar/kecil).
  RESOR_COLUMNS: ["Resor", "Resort", "Nama Resor"],

  // Daftar resor resmi, berurutan, dikelompokkan per SPTN. Nama di spreadsheet dicocokkan tanpa peduli
  // huruf besar/kecil dan boleh tanpa kata "Resor" (misalnya "Piong" = "Resor Piong").
  RESOR_LIST: [
    { sptn: "SPTN Wilayah I Kore", resor: ["Resor Piong", "Resor Oi Katupa", "Resor Kawinda Toi"] },
    { sptn: "SPTN Wilayah II Pekat", resor: ["Resor Doroncanga", "Resor Doropeti", "Resor Pancasila"] },
  ],

  // Kolom yang dikosongkan demi privasi pelaku, hanya pada kategori yang disebut.
  SEMBUNYIKAN: {
    "Aktivitas Manusia": ["Nama pelaku", "Nama pelaku indikatif", "Nama kelompok", "Kode Tanda Ternak"],
  },

  // Label untuk baris yang kolom resornya masih kosong.
  RESOR_KOSONG: "Resor belum diisi",

  NAMA_KAWASAN: "Taman Nasional Gunung Tambora",
};
