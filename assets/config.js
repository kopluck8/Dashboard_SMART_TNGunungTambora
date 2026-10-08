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

  // Kolom yang dikosongkan demi privasi, per kategori 0. Saat ini semua dibuka (keputusan 8 Okt 2026);
  // isi lagi bila nanti diperlukan, misalnya: "Aktivitas Manusia": ["Nama pelaku", "Nama pelaku indikatif"].
  SEMBUNYIKAN: {},

  // Tampilan awal hanya menampilkan tahun ini; tahun lain tetap bisa dipilih di filter bulan.
  TAHUN_AWAL: 2026,

  // Capaian yang dihitung manual, dari tab Google Sheets terpisah yang dipublikasikan sebagai CSV.
  // Tiap tab cukup 2 kolom: kolom tahun (misalnya "Capaian Grid Tahun") dan kolom jumlah (misalnya "Jumlah Capaian").
  // Bila keduanya ada di satu tab, pakai tautan yang sama dan isi "kolom" dengan judul kolom jumlahnya.
  CAPAIAN: [
    { label: "Capaian grid pengelolaan", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkWQwy3ECs2IrsYkBhm6d_tlrciI4K9h_VIK2OFO1hwxv7HOxA_DMjpanBFQ7nJNSIx0Aowbcs1L8g/pub?gid=0&single=true&output=csv", kolom: "" },
    { label: "ST terlaksana", url: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkWQwy3ECs2IrsYkBhm6d_tlrciI4K9h_VIK2OFO1hwxv7HOxA_DMjpanBFQ7nJNSIx0Aowbcs1L8g/pub?gid=865057924&single=true&output=csv", kolom: "" },
    { label: "Capaian coverage area", url: "", kolom: "https://docs.google.com/spreadsheets/d/e/2PACX-1vQkWQwy3ECs2IrsYkBhm6d_tlrciI4K9h_VIK2OFO1hwxv7HOxA_DMjpanBFQ7nJNSIx0Aowbcs1L8g/pub?gid=1595502604&single=true&output=csv", satuan: "ha", desimal: 2 },
  ],

  // Layer peta tambahan (GeoJSON di folder assets). Dimuat hanya saat dicentang di peta.
  LAYER_PETA: [
    { file: "assets/tambora.geojson", label: "Batas kawasan", warna: "#f2f2f2", tebal: 2.5 },
    { file: "assets/resor.geojson", label: "Batas resor", warna: "#ffd166", tebal: 2, putus: true },
    { file: "assets/grid.geojson", label: "Grid pengelolaan", warna: "#9ad1c4", tebal: 0.8 },
    { file: "assets/jalur.geojson", label: "Jalur", warna: "#ff8c42", tebal: 2 },
  ],

  // Logo di kepala halaman (disembunyikan otomatis bila file belum ada).
  LOGO: "assets/logo.png",

  // Nama sumber data yang ditampilkan di halaman.
  SUMBER: "Rekap Data SMART Patrol TNGT",

  // Nama tampilan untuk sub-kategori/kolom tertentu (nama asli SMART di kiri).
  ALIAS: { "Pelaku": "Masyarakat", "Nama pelaku": "Nama Masyarakat" },

  // Sub-kategori yang kolom Jumlah-nya hanya dihitung bila satuannya hektar.
  JUMLAH_HEKTAR_SAJA: ["Kebakaran Hutan dan Lahan"],

  // Label untuk baris yang kolom resornya masih kosong.
  RESOR_KOSONG: "Resor belum diisi",

  NAMA_KAWASAN: "Taman Nasional Gunung Tambora",
};
