// Status perlindungan dan Daftar Merah IUCN per nama ilmiah. Dipakai menggantikan kolom "Status" dari SMART.
//
// dilindungi: true bila tercantum di Lampiran Permen LHK P.106/MENLHK/SETJEN/KUM.1/12/2018
//   (daftar jenis TSL dilindungi yang berlaku; Permen LHK No. 18 Tahun 2024 merujuk ke daftar ini dan tidak memuat daftar jenis sendiri).
// iucn: kategori IUCN Red List — CR Kritis, EN Genting, VU Rentan, NT Hampir Terancam, LC Risiko Rendah,
//   DD Kurang Data, NE Belum Dievaluasi.
//
// Untuk jenis baru: tambahkan satu baris dengan nama ilmiah persis seperti di SMART (bagian ketiga "Lokal - Indonesia - Ilmiah").
// Jenis yang belum ada di sini tampil sebagai "Belum dicek".
window.SMART_STATUS = {
  // Burung
  "Anthus rufulus": { dilindungi: false, iucn: "LC" },
  "Artamus leucoryn": { dilindungi: false, iucn: "LC" },
  "Cacomantis variolosus": { dilindungi: false, iucn: "LC" },
  "Caloenas nicobarica": { dilindungi: true, iucn: "NT" },
  "Caridonax fulgidus": { dilindungi: true, iucn: "LC" },
  "Centropus bengalensis": { dilindungi: false, iucn: "LC" },
  "Chalcophaps indica": { dilindungi: false, iucn: "LC" },
  "Cinnyris jugularis": { dilindungi: false, iucn: "LC" },
  "Circaetus gallicus": { dilindungi: true, iucn: "LC" },
  "Cisticola juncidis": { dilindungi: false, iucn: "LC" },
  "Collocalia sumbawae": { dilindungi: false, iucn: "LC" },
  "Corvus macrorhynchos": { dilindungi: false, iucn: "LC" },
  "Dicaeum igniferum": { dilindungi: false, iucn: "LC" },
  "Dicrurus densus": { dilindungi: false, iucn: "LC" },
  "Eurystomus orientalis": { dilindungi: false, iucn: "LC" },
  "Gallus varius": { dilindungi: false, iucn: "LC" },
  "Geoffroyus geoffroyi": { dilindungi: true, iucn: "LC" },
  "Haliastur indus": { dilindungi: true, iucn: "LC" },
  "Heleia dohertyi": { dilindungi: false, iucn: "LC" },
  "Heleia wallacei": { dilindungi: true, iucn: "LC" },
  "Hypothymis azurea": { dilindungi: false, iucn: "LC" },
  "Lichmera indistincta": { dilindungi: false, iucn: "LC" },
  "Macropygia emiliana": { dilindungi: false, iucn: "LC" },
  "Megapodius reinwardt": { dilindungi: true, iucn: "LC" },
  "Merops ornatus": { dilindungi: false, iucn: "LC" },
  "Merops philippinus": { dilindungi: false, iucn: "LC" },
  "Nisaetus floris": { dilindungi: true, iucn: "CR" },
  "Oriolus chinensis": { dilindungi: false, iucn: "LC" },
  "Parus cinereus": { dilindungi: false, iucn: "LC" },
  "Pericrocotus lansbergei": { dilindungi: false, iucn: "LC" },
  "Pernis ptilorhynchus": { dilindungi: true, iucn: "LC" },
  "Philemon buceroides": { dilindungi: false, iucn: "LC" },
  "Pycnonotus aurigaster": { dilindungi: false, iucn: "LC" },
  "Rhipidura diluta": { dilindungi: false, iucn: "LC" },
  "Spilopelia chinensis": { dilindungi: false, iucn: "LC" },
  "Streptopelia bitorquata": { dilindungi: false, iucn: "LC" },
  "Taeniopygia guttata": { dilindungi: false, iucn: "LC" },
  "Todiramphus chloris": { dilindungi: false, iucn: "LC" },
  "Zosterops melanurus": { dilindungi: false, iucn: "VU" },
  // Mamalia
  "Macaca fascicularis": { dilindungi: false, iucn: "EN" },
  "Rusa timorensis": { dilindungi: true, iucn: "VU" },
  "Sus scrofa": { dilindungi: false, iucn: "LC" },
  // Reptil
  "Ahaetulla prasina": { dilindungi: false, iucn: "LC" },
  // Serangga
  "Ideopsis juventa": { dilindungi: false, iucn: "NE" },
};
