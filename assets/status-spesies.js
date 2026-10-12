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
  // Tambahan 12 Okt 2026. Perlindungan dicek ke Lampiran P.92/2018 (isi daftar sama dengan P.106/2018 untuk jenis-jenis ini).
  "Accipiter fasciatus": { dilindungi: true, iucn: "LC" },
  "Accipiter soloensis": { dilindungi: true, iucn: "LC" },
  "Accipiter sylvestris": { dilindungi: true, iucn: "LC" },
  "Aerodramus vanikorensis": { dilindungi: false, iucn: "LC" },
  "Anthreptes malacensis": { dilindungi: false, iucn: "LC" },
  "Aplonis minor": { dilindungi: false, iucn: "LC" },
  "Artamus leucorhynchus": { dilindungi: false, iucn: "LC" },
  "Butorides striata": { dilindungi: false, iucn: "LC" },
  "Cacomantis merulinus": { dilindungi: false, iucn: "LC" },
  "Chalcites lucidus": { dilindungi: false, iucn: "LC" },
  "Collocalia esculenta": { dilindungi: false, iucn: "LC" },
  "Ducula aenea": { dilindungi: false, iucn: "NT" },
  "Edolisoma dohertyi": { dilindungi: false, iucn: "LC" },
  "Elanus caeruleus": { dilindungi: true, iucn: "LC" },
  "Eurystomus azureus": { dilindungi: false, iucn: "NT" },
  "Falco cenchroides": { dilindungi: true, iucn: "LC" },
  "Falco longipennis": { dilindungi: true, iucn: "LC" },
  "Falco moluccensis": { dilindungi: true, iucn: "LC" },
  "Geopelia maugeus": { dilindungi: false, iucn: "LC" },
  "Geopelia striata": { dilindungi: false, iucn: "LC" },
  "Gracula religiosa": { dilindungi: true, iucn: "LC" },
  "Haliaeetus leucogaster": { dilindungi: true, iucn: "LC" },
  "Hirundo rustica": { dilindungi: false, iucn: "LC" },
  "Lalage sueurii": { dilindungi: false, iucn: "LC" },
  "Lonchura leucogastroides": { dilindungi: false, iucn: "LC" },
  "Lophotriorchis kienerii": { dilindungi: true, iucn: "NT" },
  "Nectarinia jugularis": { dilindungi: false, iucn: "LC" }, // = Cinnyris jugularis
  "Oriolus phaeochromus": { dilindungi: false, iucn: "LC" },
  "Otus silvicola": { dilindungi: false, iucn: "LC" },
  "Pachycephala fulvotincta": { dilindungi: false, iucn: "LC" },
  "Pachycephala pectoralis": { dilindungi: false, iucn: "LC" },
  "Philemon buceroides": { dilindungi: false, iucn: "LC" },
  "Phylloscopus borealis": { dilindungi: false, iucn: "LC" },
  "Picoides moluccensis": { dilindungi: false, iucn: "LC" },
  "Pitta concinna": { dilindungi: true, iucn: "LC" }, // tercantum sebagai Pitta elegans (paok laus) di lampiran
  "Ptilinopus melanospilus": { dilindungi: false, iucn: "LC" },
  "Pycnonotus aurigaster": { dilindungi: false, iucn: "LC" },
  "Saxicola caprata": { dilindungi: false, iucn: "LC" },
  "Streptopelia chinensis": { dilindungi: false, iucn: "LC" }, // = Spilopelia chinensis
  "Trichoglossus forsteni": { dilindungi: true, iucn: "EN" },
  "Zosterops chloris": { dilindungi: false, iucn: "LC" },
  "Zosterops consobrinorum": { dilindungi: false, iucn: "LC" },
  "Zosterops japonicus": { dilindungi: false, iucn: "LC" },
  // Nama ilmiah yang tertulis keliru di SMART (nama Inggris atau salah ketik). Sebaiknya diperbaiki di data model SMART;
  // sementara dipetakan ke status jenis yang dimaksud.
  "Apionus minor": { dilindungi: false, iucn: "LC" }, // Aplonis minor
  "Arctic Warbler": { dilindungi: false, iucn: "LC" }, // Phylloscopus borealis
  "Australian Hobby": { dilindungi: true, iucn: "LC" }, // Falco longipennis
  "Grey-capped Emerald Dove": { dilindungi: false, iucn: "LC" }, // Chalcophaps indica
  "Helmeted Friarbird": { dilindungi: false, iucn: "LC" }, // Philemon buceroides
  "Pied Bushchat": { dilindungi: false, iucn: "LC" }, // Saxicola caprata
  "Sooty-headed Bulbul": { dilindungi: false, iucn: "LC" }, // Pycnonotus aurigaster
  "Zitting Cisticola": { dilindungi: false, iucn: "LC" }, // Cisticola juncidis
  // Mamalia
  "Macaca fascicularis": { dilindungi: false, iucn: "EN" },
  "Rusa timorensis": { dilindungi: true, iucn: "VU" },
  "Sus scrofa": { dilindungi: false, iucn: "LC" },
  // Reptil
  "Ahaetulla prasina": { dilindungi: false, iucn: "LC" },
  "Varanus spp": { dilindungi: false, iucn: "NE" }, // tingkat marga; biawak di Sumbawa umumnya Varanus salvator (tidak dilindungi, LC)
  // Serangga
  "Ideopsis juventa": { dilindungi: false, iucn: "NE" },
  "Apis dorsata": { dilindungi: false, iucn: "NE" },
  "Cicadidae": { dilindungi: false, iucn: "NE" }, // tingkat suku
};
