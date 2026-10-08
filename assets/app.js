/* Dashboard Data SMART Patrol — satu skrip untuk semua halaman.
   <body data-page="kawasan"> untuk dashboard kawasan, atau data-page="<slug kategori>" dari model.js. */
(function () {
  "use strict";
  const C = window.SMART_CONFIG;
  const M = window.SMART_MODEL;
  const PAGE = document.body.dataset.page || "kawasan";

  // Jenis isian, dipakai untuk memilih cara meringkas tiap atribut data model.
  const NUM = new Set(["Jumlah", "Jumlah partisipan", "Jarak ke satwa (m)", "Azimuth (derajat)", "Jumlah pelaku", "Umur",
    "Jumlah Wisatawan", "Jumlah Perempuan", "Jumlah Laki - Laki", "Jumlah Sampah"]);
  // Angka yang cukup ditampilkan rentangnya (tidak dijumlah), dan yang ditampilkan rata-ratanya.
  const NUM_RANGE = new Set(["Umur", "Azimuth (derajat)"]);
  const NUM_AVG = new Set(["Jarak ke satwa (m)"]);
  // Kolom berisi nama orang/kelompok: ditampilkan sebagai tabel lengkap, bukan grafik.
  const PERSON = new Set(["Nama pelaku", "Nama Masyarakat", "Nama pelaku indikatif", "Nama kelompok", "Nama Pewaris"]);
  const SPECIES = new Set(["Jenis satwa", "Jenis tumbuhan"]);
  const TEXT = new Set(["Keterangan", "Nama pelaku", "Nama kelompok", "Nama Masyarakat", "Alamat", "Asal", "Lokasi",
    "Kode Tanda Ternak", "Nama pelaku indikatif", "Vegetasi Terdampak", "Isi media informasi", "No. pal", "Nama Sekolah",
    "Nama Budaya", "Nama Pewaris", "Nama desa", "Nama Kelompok Binaan", "Hasil Pembinaan", "Hasil Monev",
    "Tanggal tindak lanjut", "Tanda aktifitas"]);
  const NO_SPECIES = /^belum ada di list$/i;
  const BAD_KONDISI = /rusak|roboh|mati|sakit|tumbang|terluka|hilang|terhapus/i;

  // Warna tetap per kategori 0 (warna mengikuti kategori, bukan peringkatnya).
  const CAT_COLOR = { "Ground Check": 1, "Satwa Liar": 2, "Tumbuhan": 3, "Fitur": 4,
    "Penyuluhan dan Pemberdayaan Masyarakat": 7, "Aktivitas Manusia": 8 };
  const OTHER = "Lainnya";

  const EN = { Jan: 0, Feb: 1, Mar: 2, Apr: 3, May: 4, Jun: 5, Jul: 6, Aug: 7, Sep: 8, Oct: 9, Nov: 10, Dec: 11 };
  const BULAN = ["Jan", "Feb", "Mar", "Apr", "Mei", "Jun", "Jul", "Agu", "Sep", "Okt", "Nov", "Des"];

  const S = { all: [], rows: [], hasResor: false, demo: false, resor: "", from: "", to: "", source: "", capaian: [] };
  const ALIAS = C.ALIAS || {};
  const alias = (n) => ALIAS[n] || n;
  const STATUS = window.SMART_STATUS || {};
  const IUCN = { CR: "Kritis (CR)", EN: "Genting (EN)", VU: "Rentan (VU)", NT: "Hampir terancam (NT)", LC: "Risiko rendah (LC)", DD: "Kurang data (DD)", NE: "Belum dievaluasi (NE)" };
  const charts = [];
  let maps = [];

  const $ = (sel, el = document) => el.querySelector(sel);
  const fmt = (n, d = 0) => Number(n).toLocaleString("id-ID", { maximumFractionDigits: d });
  const css = (v) => getComputedStyle(document.documentElement).getPropertyValue(v).trim();
  const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
  const pad = (n) => String(n).padStart(2, "0");
  const ymLabel = (ym) => { const [y, m] = ym.split("-"); return BULAN[+m - 1] + " " + y; };
  const dLabel = (d) => d ? d.getDate() + " " + BULAN[d.getMonth()] + " " + d.getFullYear() : "–";
  const uniq = (arr) => new Set(arr).size;
  const val = (row, f) => String(row.r[f] ?? "").trim();
  const sc = (i) => css("--s" + i);
  const catColor = (c0) => CAT_COLOR[c0] ? sc(CAT_COLOR[c0]) : css("--faint");

  function countBy(rows, fn) {
    const m = new Map();
    for (const r of rows) { const k = fn(r); if (k === "" || k == null) continue; m.set(k, (m.get(k) || 0) + 1); }
    return [...m.entries()].sort((a, b) => b[1] - a[1]);
  }
  function num(s) { const n = parseFloat(String(s).replace(",", ".")); return isFinite(n) ? n : null; }
  // Angka dari tab capaian: menerima format Indonesia (1.234,5) maupun Inggris (1,234.5).
  function numCapaian(s) {
    let t = String(s == null ? "" : s).replace(/[^\d.,-]/g, "");
    const d = t.lastIndexOf("."), c = t.lastIndexOf(",");
    if (d >= 0 && c >= 0) t = d > c ? t.replace(/,/g, "") : t.replace(/\./g, "").replace(",", ".");
    else if (c >= 0) t = (t.match(/,/g).length > 1 ? t.replace(/,/g, "") : t.replace(",", "."));
    else if (d >= 0 && t.match(/\./g).length > 1) t = t.replace(/\./g, "");
    return num(t);
  }
  function splitSpecies(s) {
    // Format SMART "Lokal - Indonesia - Ilmiah"; bagian boleh kosong ("Katowi - - Palaquium amboinense").
    // Dua bagian dibaca sebagai "Indonesia - Ilmiah". Tanda hubung di dalam kata (Kirik-kirik) tidak memisah.
    const p = s.split(/\s*-\s+/).map((x) => x.trim());
    if (p.length >= 3) return { lokal: p[0], indo: p[1], latin: p.slice(2).join(" - ") };
    if (p.length === 2) return { lokal: "", indo: p[0], latin: p[1] };
    return { lokal: "", indo: s, latin: "" };
  }
  function speciesName(s) { const p = splitSpecies(s); return p.indo || p.lokal || p.latin; }

  function parseDate(s) {
    s = String(s || "").trim();
    let m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(s);
    if (m && m[1] in EN) return new Date(+m[3], EN[m[1]], +m[2]);
    m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s); if (m) return new Date(+m[1], m[2] - 1, +m[3]);
    // Tanggal yang sudah diubah Google Sheets: dd/mm/yyyy (lokal Indonesia) atau m/d/yyyy (lokal AS).
    m = /^(\d{1,2})[\/.-](\d{1,2})[\/.-](\d{4})/.exec(s);
    if (m) { let [dd, mm] = [+m[1], +m[2]]; if (mm > 12 && dd <= 12) [dd, mm] = [mm, dd]; return new Date(+m[3], mm - 1, dd); }
    const d = new Date(s); return isNaN(d) ? null : d;
  }

  /* ---------------- data ---------------- */
  // Nama kolom yang dipakai dashboard; judul kolom di sheet dicocokkan tanpa peduli huruf besar/kecil dan spasi.
  const CORE = ["Waypoint ID", "Waypoint Date", "Waypoint Time", "X", "Y", "Observation Category 0", "Observation Category 1", "Observation Group"];
  // Kunci pencocokan: huruf kecil tanpa spasi/tanda baca, sehingga "Observation_Category_0", "Azimuth__derajat_"
  // atau "No__pal" (judul kolom yang sudah diubah Google Sheets/SMART) tetap dikenali.
  const hkey = (h) => String(h || "").toLowerCase().replace(/[^a-z0-9]/g, "");
  const KNOWN = new Map(CORE.concat(...M.map((c) => c.fields.concat(...c.subs.map((s) => s.fields)))).map((h) => [hkey(h), alias(h)]));
  for (const c of M) { c.fields = c.fields.map(alias); for (const s of c.subs) { s.name = alias(s.name); s.fields = s.fields.map(alias); } }
  const cleanHead = (h) => String(h || "").replace(/^\uFEFF/, "").replace(/\s+/g, " ").trim();
  function loadCSV(url) {
    return new Promise((res, rej) => Papa.parse(url, {
      download: true, header: false, skipEmptyLines: "greedy",
      complete: (r) => {
        const grid = r.data;
        // Baris judul boleh tidak di baris pertama (misalnya ada judul tabel di atasnya).
        const hi = grid.slice(0, 15).findIndex((row) => row.some((c) => hkey(c) === "observationcategory0"));
        if (hi < 0) {
          const e = new Error("kolom tidak dikenali");
          e.diag = { rows: grid.length, head: (grid[0] || []).slice(0, 6).map(cleanHead) };
          return rej(e);
        }
        const head = grid[hi].map((h) => { const c = cleanHead(h); return KNOWN.get(hkey(c)) || c; });
        const data = grid.slice(hi + 1).map((row) => Object.fromEntries(head.map((h, i) => [h, row[i] ?? ""])));
        const n = data.filter((x) => String(x["Observation Category 0"] || "").trim()).length;
        if (!n) { const e = new Error("tidak ada baris berisi"); e.diag = { rows: data.length, head: head.slice(0, 6) }; return rej(e); }
        res(data);
      },
      error: rej,
    }));
  }
  function loadCapaian(item) {
    if (!item.url) return Promise.resolve({ ...item, data: null });
    return new Promise((res) => Papa.parse(item.url, {
      download: true, header: false, skipEmptyLines: "greedy",
      complete: (r) => {
        const g = r.data; if (!g.length) return res({ ...item, data: null, err: true });
        const head = g[0].map(hkey);
        let yc = head.findIndex((h) => h.includes("tahun")); if (yc < 0) yc = 0;
        let vc = item.kolom ? head.indexOf(hkey(item.kolom)) : -1;
        if (vc < 0) vc = head.findIndex((h, i) => i !== yc);
        const data = {};
        for (const row of g.slice(1)) { const y = parseInt(row[yc], 10), v = numCapaian(row[vc]); if (y && v != null) data[y] = (data[y] || 0) + v; }
        res({ ...item, data });
      },
      error: () => res({ ...item, data: null, err: true }),
    }));
  }
  async function load() {
    S.capaian = await Promise.all((C.CAPAIAN || []).map(loadCapaian));
    if (C.SHEET_CSV_URL) {
      try { const d = await loadCSV(C.SHEET_CSV_URL); S.source = "Google Sheets"; return d; }
      catch (e) { console.warn("Google Sheets tidak terbaca, memakai file cadangan", e); S.sheetError = e; }
    }
    const d = await loadCSV(C.FALLBACK_CSV); S.source = C.FALLBACK_CSV; return d;
  }
  function sheetNotice() {
    const e = S.sheetError;
    if (!e) return "";
    const d = e.diag;
    const why = !d ? "Tautan tidak bisa dibuka. Pastikan sheet sudah dipublikasikan ke web dalam format CSV dan tautannya diakhiri <code>output=csv</code>."
      : d.rows <= 1 && !d.head.filter(Boolean).length ? "Sheet yang dipublikasikan kosong. Kemungkinan tab yang dipilih saat publikasi bukan tab data, atau rumus di tab Publik menghasilkan error."
      : `Sheet terbaca (${fmt(d.rows)} baris), tetapi kolom <b>Observation Category 0</b> tidak ditemukan atau kosong. Kolom pertama yang terbaca: <code>${d.head.map(esc).join(" | ") || "(kosong)"}</code>.`;
    return `<div class="notice"><strong>Data Google Sheets belum terbaca, sementara memakai data cadangan.</strong> ${why}</div>`;
  }
  const RESOR_CANON = new Map();
  const SPTN_OF = new Map();
  for (const g of C.RESOR_LIST || []) for (const r of g.resor) {
    SPTN_OF.set(r, g.sptn);
    RESOR_CANON.set(r.toLowerCase(), r);
    RESOR_CANON.set(r.toLowerCase().replace(/^resor\s+/, ""), r);
  }
  function canonResor(v) {
    const k = String(v || "").trim().toLowerCase().replace(/\s+/g, " ");
    if (!k) return C.RESOR_KOSONG;
    return RESOR_CANON.get(k) || RESOR_CANON.get(k.replace(/^(resor|resort)\s+/, "")) || String(v).trim();
  }
  const isHidden = (c0, f) => (C.SEMBUNYIKAN?.[c0] || []).includes(f);
  function normalize(raw) {
    const cols = Object.keys(raw[0] || {});
    const rc = cols.find((c) => C.RESOR_COLUMNS.some((x) => hkey(x) === hkey(c)));
    S.hasResor = !!rc;
    const rows = raw.filter((r) => (r["Observation Category 0"] || "").trim()).map((r) => {
      const d = parseDate(r["Waypoint Date"]);
      for (const f of C.SEMBUNYIKAN?.[r["Observation Category 0"].trim()] || []) if (f in r) r[f] = "";
      return {
        r, d,
        ym: d ? d.getFullYear() + "-" + pad(d.getMonth() + 1) : "",
        day: d ? d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) : "",
        c0: r["Observation Category 0"].trim(),
        c1: alias((r["Observation Category 1"] || "").trim()),
        lon: num(r.X), lat: num(r.Y),
        realResor: rc ? canonResor(r[rc]) : C.RESOR_KOSONG,
        grp: r["Observation Group"] || r["Waypoint ID"] + "|" + r["Waypoint Date"],
      };
    });
    // Contoh pembagian resor (bukan data asli): tiga pita bujur barat-timur, hanya untuk pratinjau tampilan.
    const lons = rows.map((x) => x.lon).filter((x) => x != null).sort((a, b) => a - b);
    const qs = [1, 2, 3, 4, 5].map((i) => lons[Math.floor((i * lons.length) / 6)]);
    for (const x of rows) x.demoResor = x.lon == null ? C.RESOR_KOSONG : "Contoh Resor " + (qs.filter((q) => x.lon >= q).length + 1);
    rows.sort((a, b) => (b.d || 0) - (a.d || 0));
    return rows;
  }
  const resorOf = (x) => (S.demo ? x.demoResor : x.realResor);
  const DEMO_GROUPS = [
    { sptn: "Contoh SPTN I", resor: ["Contoh Resor 1", "Contoh Resor 2", "Contoh Resor 3"] },
    { sptn: "Contoh SPTN II", resor: ["Contoh Resor 4", "Contoh Resor 5", "Contoh Resor 6"] },
  ];
  const resorGroups = () => (S.demo ? DEMO_GROUPS : C.RESOR_LIST || []);
  const sptnOf = (rs) => { for (const g of resorGroups()) if (g.resor.includes(rs)) return g.sptn; return ""; };
  const matchScope = (x) => !S.resor || (S.resor.startsWith("sptn:") ? sptnOf(resorOf(x)) === S.resor.slice(5) : resorOf(x) === S.resor);
  const scopeLabel = () => (!S.resor ? "seluruh kawasan" : S.resor.startsWith("sptn:") ? S.resor.slice(5) : S.resor);
  function applyFilter() {
    S.rows = S.all.filter((x) => matchScope(x) && (!S.from || x.ym >= S.from) && (!S.to || x.ym <= S.to));
  }
  function monthRange(rows) {
    const ys = rows.map((x) => x.ym).filter(Boolean).sort();
    if (!ys.length) return [];
    const out = []; let [y, m] = ys[0].split("-").map(Number); const [ye, me] = ys[ys.length - 1].split("-").map(Number);
    while (y < ye || (y === ye && m <= me)) { out.push(y + "-" + pad(m)); m++; if (m > 12) { m = 1; y++; } }
    return out;
  }

  /* ---------------- chrome ---------------- */
  function contours() {
    // Garis kontur kaldera bergaya (dekoratif), digambar sekali.
    let p = "";
    for (let i = 1; i <= 11; i++) {
      const rx = 30 + i * 22, ry = 18 + i * 13, pts = [];
      for (let a = 0; a <= 64; a++) {
        const t = (a / 64) * Math.PI * 2, w = 1 + 0.06 * Math.sin(t * 3 + i) + 0.04 * Math.cos(t * 5 - i * 0.7);
        pts.push((280 + Math.cos(t) * rx * w).toFixed(1) + "," + (180 + Math.sin(t) * ry * w).toFixed(1));
      }
      p += `<polyline points="${pts.join(" ")}" fill="none" stroke="currentColor" stroke-width="${i % 4 === 0 ? 1.4 : 0.7}"/>`;
    }
    return `<svg class="contours" viewBox="0 0 560 360" aria-hidden="true">${p}</svg>`;
  }
  function chrome() {
    const cat = M.find((c) => c.slug === PAGE);
    const title = cat ? cat.short : "Overview Kawasan";
    const lede = cat ? cat.desc : "Rekap seluruh observasi SMART Patrol di " + C.NAMA_KAWASAN + ".";
    const counts = Object.fromEntries(countBy(S.all, (x) => x.c0));
    const tabs = [`<a href="index.html"${!cat ? ' aria-current="page"' : ""}>Overview Kawasan</a>`]
      .concat(M.map((c) => `<a href="${c.slug}.html"${cat === c ? ' aria-current="page"' : ""}>${esc(c.short)}<span class="count">${fmt(counts[c.name] || 0)}</span></a>`));
    document.title = title + " · Data SMART Patrol";
    $("#band").innerHTML = `${contours()}<div class="band-inner">
      ${C.LOGO ? `<img class="logo" src="${esc(C.LOGO)}" alt="" onerror="this.remove()">` : ""}
      <p class="eyebrow">${esc(C.NAMA_KAWASAN)} · Data SMART Patrol</p>
      <h1>${esc(title)}</h1><p class="lede">${esc(lede)}</p>
      <nav class="tabs" aria-label="Halaman">${tabs.join("")}</nav></div>`;
  }
  function filterBar() {
    const groups = resorGroups();
    const known = new Set(groups.flatMap((g) => g.resor));
    const extra = countBy(S.all, resorOf).map((x) => x[0]).filter((r) => !known.has(r)).sort();
    const months = monthRange(S.all);
    const opt = (v, l, sel) => `<option value="${esc(v)}"${sel ? " selected" : ""}>${esc(l)}</option>`;
    $("#filters").innerHTML = `
      <label for="f-resor">Wilayah / resor<select id="f-resor">${opt("", "Seluruh kawasan", !S.resor)}${groups.map((g) => `<optgroup label="${esc(g.sptn)}">${opt("sptn:" + g.sptn, "Semua resor " + g.sptn, S.resor === "sptn:" + g.sptn)}${g.resor.map((r) => opt(r, r, r === S.resor)).join("")}</optgroup>`).join("")}${extra.length ? `<optgroup label="Lainnya">${extra.map((r) => opt(r, r, r === S.resor)).join("")}</optgroup>` : ""}</select></label>
      <label for="f-from">Dari bulan<select id="f-from">${months.map((m) => opt(m, ymLabel(m), m === S.from)).join("")}</select></label>
      <label for="f-to">Sampai bulan<select id="f-to">${months.map((m) => opt(m, ymLabel(m), m === S.to)).join("")}</select></label>
      ${S.hasResor ? "" : `<button type="button" class="btn${S.demo ? " on" : ""}" id="f-demo" title="Membagi titik ke tiga contoh resor berdasarkan bujur, hanya untuk melihat tampilan">${S.demo ? "Matikan contoh resor" : "Lihat contoh pembagian resor"}</button>`}
      <span class="meta" id="f-meta"></span>`;
    $("#f-resor").onchange = (e) => { S.resor = e.target.value; update(); };
    $("#f-from").onchange = (e) => { S.from = e.target.value; if (S.to < S.from) S.to = S.from; update(true); };
    $("#f-to").onchange = (e) => { S.to = e.target.value; if (S.from > S.to) S.from = S.to; update(true); };
    const demo = $("#f-demo");
    if (demo) demo.onclick = () => { S.demo = !S.demo; S.resor = ""; update(true); };
  }
  function update(rebuildFilters) {
    applyFilter();
    if (rebuildFilters) filterBar();
    $("#f-meta").textContent = fmt(S.rows.length) + " observasi · " + (C.SUMBER || S.source);
    render();
  }

  /* ---------------- components ---------------- */
  function kpis(items) {
    return `<div class="kpis">${items.map((k) => `<div class="kpi ${k.tone || ""}"><span class="v${String(k.v).length > 6 ? " long" : ""}">${k.v}</span><span class="l">${esc(k.l)}</span>${k.n ? `<span class="n">${esc(k.n)}</span>` : ""}</div>`).join("")}</div>`;
  }
  function hbars(entries, opts = {}) {
    const max = Math.max(1, ...entries.map((e) => e[1]));
    const limit = opts.limit || entries.length;
    const shown = entries.slice(0, limit), rest = entries.slice(limit);
    const total = opts.total || entries.reduce((a, e) => a + e[1], 0);
    let h = shown.map(([k, v]) => {
      const label = opts.label ? opts.label(k) : esc(k);
      return `<div class="hbar" title="${esc(k)}: ${fmt(v)} (${fmt((v / total) * 100, 1)}%)"><div class="lab"><span>${label}</span><div class="track"><b style="width:${(v / max) * 100}%;${opts.color ? "background:" + opts.color(k) : ""}"></b></div></div><span class="val">${fmt(v)}</span></div>`;
    }).join("");
    if (rest.length) {
      const row = ([k, v]) => `<div class="hbar" title="${esc(k)}: ${fmt(v)}"><div class="lab"><span>${opts.label ? opts.label(k) : esc(k)}</span><div class="track"><b style="width:${(v / max) * 100}%;${opts.color ? "background:" + opts.color(k) : ""}"></b></div></div><span class="val">${fmt(v)}</span></div>`;
      h += `<details class="more"><summary>Tampilkan ${rest.length} isian lainnya</summary><div class="hbars">${rest.map(row).join("")}</div></details>`;
    }
    return `<div class="hbars">${h || '<div class="empty">Belum ada data.</div>'}</div>`;
  }
  function legend(items) {
    return `<div class="legend">${items.map(([l, c]) => `<span><i style="background:${c}"></i>${esc(l)}</span>`).join("")}</div>`;
  }
  function stackedMonthly(el, rows, keyOf, keys, colorOf) {
    const months = monthRange(rows);
    if (!months.length) { el.innerHTML = '<div class="empty">Belum ada data pada periode ini.</div>'; return; }
    el.innerHTML = legend(keys.map((k) => [k, colorOf(k)])) + `<div class="chart" style="height:260px"><canvas></canvas></div>`;
    const idx = Object.fromEntries(months.map((m, i) => [m, i]));
    const data = keys.map(() => months.map(() => 0));
    for (const r of rows) { const k = keyOf(r), i = keys.indexOf(k); if (i >= 0 && r.ym in idx) data[i][idx[r.ym]]++; }
    charts.push(new Chart($("canvas", el), {
      type: "bar",
      data: { labels: months.map(ymLabel), datasets: keys.map((k, i) => ({ label: k, data: data[i], backgroundColor: colorOf(k), borderColor: css("--paper"), borderWidth: { top: 2 }, borderSkipped: "bottom", maxBarThickness: 46 })) },
      options: {
        maintainAspectRatio: false, animation: false,
        plugins: { legend: { display: false }, tooltip: { mode: "index", intersect: false, filter: (i) => i.raw > 0 } },
        scales: { x: { stacked: true, grid: { display: false } }, y: { stacked: true, beginAtZero: true, ticks: { precision: 0 }, grid: { color: css("--line") }, border: { display: false } } },
      },
    }));
  }
  function renderMap(el, rows, colorOf, keyOf, keys) {
    const groups = new Map();
    for (const r of rows) {
      if (r.lat == null || r.lon == null || (!r.lat && !r.lon)) continue;
      if (!groups.has(r.grp)) groups.set(r.grp, []);
      groups.get(r.grp).push(r);
    }
    el.innerHTML = legend(keys.map((k) => [k, colorOf(k)])) + `<div class="map"></div>`;
    if (!groups.size) { $(".map", el).innerHTML = '<div class="empty" style="padding:20px">Tidak ada koordinat pada periode ini.</div>'; return; }
    const map = L.map($(".map", el), { scrollWheelZoom: false, preferCanvas: true });
    maps.push(map);
    const sat = L.tileLayer("https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}", { maxZoom: 18, attribution: "Citra: Esri" });
    const osm = L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", { maxZoom: 18, attribution: "© OpenStreetMap" });
    sat.addTo(map);
    // Layer GeoJSON tambahan: kosong sampai dicentang, baru dimuat saat itu supaya halaman tetap ringan.
    const overlays = {};
    for (const ly of C.LAYER_PETA || []) {
      const group = L.layerGroup();
      group.cfg = ly;
      overlays[ly.label] = group;
    }
    map.on("overlayadd", (e) => {
      const g = e.layer; if (!g.cfg || g.loaded) return;
      g.loaded = true;
      const st = { color: g.cfg.warna, weight: g.cfg.tebal || 1.5, fill: false, dashArray: g.cfg.putus ? "6 4" : null };
      fetch(g.cfg.file).then((r) => { if (!r.ok) throw new Error(r.status); return r.json(); })
        .then((gj) => L.geoJSON(gj, {
          style: () => st,
          onEachFeature: (f, l) => { const p = f.properties || {}; const keys = Object.keys(p).slice(0, 4); if (keys.length) l.bindTooltip(keys.map((k) => esc(k) + ": " + esc(p[k])).join("<br>"), { sticky: true }); },
        }).addTo(g))
        .catch(() => { g.loaded = false; L.popup().setLatLng(map.getCenter()).setContent("File " + esc(g.cfg.file) + " belum ada di repositori.").openOn(map); });
    });
    L.control.layers({ "Citra satelit": sat, "Peta jalan": osm }, overlays).addTo(map);
    const b = [];
    for (const g of groups.values()) {
      const f = g[0];
      b.push([f.lat, f.lon]);
      const lines = g.slice(0, 6).map((x) => `${esc(x.c0)}${x.c1 ? " › " + esc(x.c1) : ""}${detailHint(x)}`).join("<br>");
      L.circleMarker([f.lat, f.lon], { radius: 5, weight: 1, color: "#ffffff", fillColor: colorOf(keyOf(f)), fillOpacity: 0.9 })
        .bindPopup(`<b>${dLabel(f.d)}</b> · WP ${esc(f.r["Waypoint ID"])} · ${esc(resorOf(f))}<br>${lines}${g.length > 6 ? "<br>+" + (g.length - 6) + " lainnya" : ""}`)
        .addTo(map);
    }
    map.fitBounds(b, { padding: [24, 24], maxZoom: 14 });
  }
  function detailHint(x) {
    const sp = val(x, "Jenis satwa") || val(x, "Jenis tumbuhan");
    if (sp) return ": " + esc(speciesName(sp));
    const f = ["Tipe temuan", "Kondisi", "Klasifikasi 4", "Klasifikasi 02", "Jenis kegiatan"].map((k) => val(x, k)).find(Boolean);
    return f ? ": " + esc(f) : "";
  }

  function detailTable(el, rows, cols) {
    const st = { q: "", page: 0, per: 25 };
    el.innerHTML = `<div class="table-tools"><input class="search" type="search" id="t-search-${el.id}" placeholder="Cari di tabel (jenis, lokasi, keterangan…)" aria-label="Cari di tabel"><span class="missing" data-n></span></div>
      <div class="table-wrap"><table><thead><tr>${cols.map((c) => `<th class="${c.num ? "num" : ""}">${esc(c.h)}</th>`).join("")}</tr></thead><tbody></tbody></table></div>
      <div class="pager"><button type="button" class="btn" data-prev>‹ Sebelumnya</button><span data-p></span><button type="button" class="btn" data-next>Berikutnya ›</button></div>`;
    const cells = rows.map((r) => cols.map((c) => c.f(r)));
    const hay = cells.map((cs) => cs.join(" ").toLowerCase());
    const draw = () => {
      const q = st.q.toLowerCase();
      const idx = cells.map((_, i) => i).filter((i) => !q || hay[i].includes(q));
      const pages = Math.max(1, Math.ceil(idx.length / st.per));
      st.page = Math.min(st.page, pages - 1);
      $("tbody", el).innerHTML = idx.slice(st.page * st.per, (st.page + 1) * st.per).map((i) =>
        `<tr>${cells[i].map((v, j) => `<td class="${cols[j].num ? "num" : ""}">${cols[j].html ? cols[j].html(v) : esc(v)}</td>`).join("")}</tr>`).join("")
        || `<tr><td colspan="${cols.length}" class="empty">Tidak ada baris yang cocok.</td></tr>`;
      $("[data-n]", el).textContent = fmt(idx.length) + " baris";
      $("[data-p]", el).textContent = "Halaman " + (st.page + 1) + " dari " + pages;
      $("[data-prev]", el).disabled = st.page === 0;
      $("[data-next]", el).disabled = st.page >= pages - 1;
    };
    $(".search", el).oninput = (e) => { st.q = e.target.value; st.page = 0; draw(); };
    $("[data-prev]", el).onclick = () => { st.page--; draw(); };
    $("[data-next]", el).onclick = () => { st.page++; draw(); };
    draw();
  }

  function resorTable(rows, keys, keyOf, label) {
    const tot = (fn) => rows.filter(fn).length;
    const head = `<tr><th>Wilayah / resor</th>${keys.map((k) => `<th class="num">${esc(k)}</th>`).join("")}<th class="num">Total</th></tr>`;
    const line = (name, rr, cls, key) => `<tr class="click ${cls}" data-resor="${esc(key)}" tabindex="0" title="Klik untuk menampilkan ${esc(name)} saja"><td>${esc(name)}</td>${keys.map((k) => `<td class="num">${fmt(rr.filter((x) => keyOf(x) === k).length) || "–"}</td>`).join("")}<td class="num"><b>${fmt(rr.length)}</b></td></tr>`;
    const groups = resorGroups();
    const known = new Set(groups.flatMap((g) => g.resor));
    let body = "";
    for (const g of groups) {
      if (S.resor && S.resor !== "sptn:" + g.sptn && !g.resor.includes(S.resor)) continue;
      const gr = rows.filter((x) => g.resor.includes(resorOf(x)));
      body += line(g.sptn, gr, "sptn", "sptn:" + g.sptn);
      for (const rs of g.resor) if (!S.resor || S.resor === rs || S.resor === "sptn:" + g.sptn) body += line("\u2003" + rs, rows.filter((x) => resorOf(x) === rs), "", rs);
    }
    for (const [rs] of countBy(rows.filter((x) => !known.has(resorOf(x))), resorOf)) body += line(rs, rows.filter((x) => resorOf(x) === rs), "", rs);
    const foot = `<tr><td>${esc(label)}</td>${keys.map((k) => `<td class="num">${fmt(tot((x) => keyOf(x) === k))}</td>`).join("")}<td class="num">${fmt(rows.length)}</td></tr>`;
    return `<div class="table-wrap"><table><thead>${head}</thead><tbody>${body}</tbody><tfoot>${foot}</tfoot></table></div>`;
  }
  function wireResorRows(root) {
    root.querySelectorAll("tr[data-resor]").forEach((tr) => {
      const go = () => { S.resor = tr.dataset.resor; update(true); window.scrollTo({ top: 0, behavior: "smooth" }); };
      tr.onclick = go; tr.onkeydown = (e) => { if (e.key === "Enter") go(); };
    });
  }
  function resorNotice() {
    if (S.hasResor) return "";
    if (S.demo) return `<div class="notice"><strong>Mode contoh.</strong> Pembagian “Contoh Resor 1–6” di bawah dibuat otomatis dari posisi bujur titik, hanya untuk memperlihatkan tampilan. Ini bukan batas resor sebenarnya; nama resor asli akan muncul setelah kolom Resor diisi.</div>`;
    return `<div class="notice"><strong>Kolom resor belum ada.</strong> Setelah kolom <b>Resor</b> ditambahkan di spreadsheet, tabel ini otomatis terbagi ke SPTN Wilayah I Kore (Piong, Oi Katupa, Kawinda Toi) dan SPTN Wilayah II Pekat (Doroncanga, Doropeti, Pancasila) dan pilihan resor di atas bisa dipakai untuk menyaring seluruh halaman. Tekan “Lihat contoh pembagian resor” untuk melihat gambarannya.</div>`;
  }

  // Aktivitas Manusia: yang diperhatikan hanya status pelanggaran / bukan pelanggaran (tindak lanjut tidak direkap).
  // Kategori lain: perlu tindak lanjut atau kondisi rusak.
  const isAM = (x) => x.c0 === "Aktivitas Manusia";
  const tindakLanjut = (x) => !isAM(x) && val(x, "Perlu tindak lanjut") === "Ya";
  function flagRows(rows) {
    return rows.filter((x) => (isAM(x) ? !!val(x, "Pelanggaran") : tindakLanjut(x) || BAD_KONDISI.test(val(x, "Kondisi"))));
  }
  function flagPills(x) {
    const p = [];
    if (isAM(x)) p.push(val(x, "Pelanggaran") === "Ya" ? '<span class="pill crit">Pelanggaran</span>' : '<span class="pill">Bukan pelanggaran</span>');
    if (tindakLanjut(x)) p.push('<span class="pill warn">Perlu tindak lanjut</span>');
    if (BAD_KONDISI.test(val(x, "Kondisi"))) p.push(`<span class="pill warn">${esc(val(x, "Kondisi"))}</span>`);
    return p.join(" ");
  }

  /* ---------------- halaman kawasan ---------------- */
  function periodLabel() {
    return S.from && S.to ? (S.from === S.to ? ymLabel(S.from) : ymLabel(S.from) + " – " + ymLabel(S.to)) : "";
  }
  function capaianKpis() {
    const y0 = +S.from.slice(0, 4), y1 = +S.to.slice(0, 4);
    return S.capaian.map((c) => {
      if (!c.url) return { v: "–", l: c.label, n: "Tautan belum diatur di config.js" };
      if (!c.data) return { v: "–", l: c.label, n: "Sheet capaian tidak terbaca" };
      const ys = Object.keys(c.data).map(Number).filter((y) => y >= y0 && y <= y1);
      if (!ys.length) return { v: "–", l: c.label, n: "Belum ada data tahun " + (y0 === y1 ? y0 : y0 + "–" + y1) };
      const sum = ys.reduce((a, y) => a + c.data[y], 0);
      return { v: fmt(sum, c.desimal || 0), l: c.label + (c.satuan ? " (" + c.satuan + ")" : ""), n: "Tahun " + ys.sort().join(", ") + " · tingkat kawasan" };
    });
  }
  // Ringkasan yang paling relevan untuk tiap kategori 0 di kartu Overview.
  function cardInfo(c, rr) {
    if (!rr.length) return "Belum ada observasi";
    const top = (fn, pre) => { const t = countBy(rr, fn)[0]; return t ? pre + ": " + esc(t[0]) + " (" + fmt(t[1]) + ")" : ""; };
    const spTop = (f, pre) => top((x) => { const v = val(x, f); return v && !NO_SPECIES.test(v) ? speciesName(v) : ""; }, pre);
    switch (c.name) {
      case "Aktivitas Manusia": {
        const ya = rr.filter((x) => val(x, "Pelanggaran") === "Ya").length;
        const bukan = rr.filter((x) => /^bukan/i.test(val(x, "Pelanggaran"))).length;
        return `Pelanggaran: <b class="crit-t">${fmt(ya)}</b> · Bukan pelanggaran: <b>${fmt(bukan)}</b>`;
      }
      case "Satwa Liar": return spTop("Jenis satwa", "Paling sering ditemukan");
      case "Tumbuhan": return spTop("Jenis tumbuhan", "Paling sering ditemukan");
      case "Spesies invasif": return spTop("Jenis tumbuhan", "Paling sering ditemukan");
      case "Fitur": return top((x) => x.c1, "Paling sering dijumpai");
      case "Ground Check": {
        const eko = top((x) => (x.c1 === "Tipe Ekosistem" ? val(x, "Klasifikasi 4") : ""), "Ekosistem dominan");
        const tut = top((x) => (x.c1 === "Tutupan Lahan" ? val(x, "Klasifikasi 02") : ""), "Tutupan lahan dominan");
        return [eko, tut].filter(Boolean).join("<br>");
      }
      case "Penyuluhan dan Pemberdayaan Masyarakat": return top((x) => x.c1, "Kegiatan tersering");
      case "Pengelolaan": return top((x) => val(x, "Jenis kegiatan") || x.c1, "Kegiatan tersering");
      case "Penjagaan Jalur Pendakian dan ODTWA": return top((x) => val(x, "Jenis Kegiatan Wisata") || x.c1, "Kegiatan tersering");
      default: return top((x) => x.c1 || val(x, "Tipe temuan"), "Tersering");
    }
  }
  function renderKawasan() {
    const rows = S.rows;
    const sp = (f) => uniq(rows.map((x) => val(x, f)).filter((v) => v && !NO_SPECIES.test(v)));
    const am = rows.filter(isAM);
    const pel = am.filter((x) => val(x, "Pelanggaran") === "Ya").length;
    const tl = rows.filter(tindakLanjut).length;
    const scope = scopeLabel();
    const c0counts = Object.fromEntries(countBy(rows, (x) => x.c0));
    const maxC = Math.max(1, ...Object.values(c0counts));
    const catKeys = Object.keys(CAT_COLOR).filter((k) => c0counts[k]).sort((a, b) => c0counts[b] - c0counts[a]);
    const keyC0 = (x) => (CAT_COLOR[x.c0] ? x.c0 : OTHER);
    const keysC0 = catKeys.concat(rows.some((x) => !CAT_COLOR[x.c0]) ? [OTHER] : []);
    const colC0 = (k) => (k === OTHER ? css("--faint") : catColor(k));

    $("#content").innerHTML = `
      ${kpis([
        { v: fmt(rows.length), l: "Observasi tercatat", n: scope + " · " + periodLabel() },
        { v: fmt(uniq(rows.map((x) => x.grp))), l: "Titik temuan (waypoint)" },
        ...capaianKpis(),
        { v: fmt(sp("Jenis satwa")), l: "Jenis satwa tercatat" },
        { v: fmt(sp("Jenis tumbuhan")), l: "Jenis tumbuhan tercatat" },
        { v: fmt(pel), l: "Temuan pelanggaran", tone: pel ? "crit" : "", n: "Aktivitas Manusia" },
        { v: fmt(tl), l: "Perlu tindak lanjut", tone: tl ? "warn" : "", n: "Selain Aktivitas Manusia" },
      ])}
      <section class="panel"><h2>Kategori temuan</h2><p class="sub">Jumlah observasi per kategori 0 pada ${esc(scope)}. Klik kartu untuk membuka rekap rinci kategori tersebut.</p>
        <div class="cats">${M.map((c) => {
          const rr = rows.filter((x) => x.c0 === c.name);
          return `<a class="cat" href="${c.slug}.html"><span class="t">${esc(c.short)}</span><span class="v">${fmt(rr.length)}</span><span class="bar"><b style="width:${(rr.length / maxC) * 100}%"></b></span><span class="d">${cardInfo(c, rr)}</span></a>`;
        }).join("")}</div></section>
      <section class="panel"><h2>Observasi per bulan</h2><p class="sub">Disusun menurut kategori 0.</p><div id="ch-trend"></div></section>
      <section class="panel" id="resor"><h2>Rekap per resor</h2><p class="sub">Klik baris resor untuk mengerucutkan seluruh dashboard ke resor tersebut. Pilih “Seluruh kawasan” di atas untuk kembali ke tingkat kawasan.</p>
        ${resorNotice()}<div style="height:12px"></div>${resorTable(rows, keysC0.map((k) => (k === OTHER ? OTHER : M.find((m) => m.name === k)?.short || k)), (x) => { const k = keyC0(x); return k === OTHER ? OTHER : M.find((m) => m.name === k)?.short || k; }, "Total " + scope)}
        <div id="ch-resor" style="margin-top:18px"></div></section>
      <section class="panel"><h2>Peta sebaran temuan</h2><p class="sub">Setiap titik adalah satu waypoint; klik titik untuk melihat isinya. Layer batas kawasan, resor, grid, dan jalur bisa dinyalakan dari tombol layer di pojok kanan atas peta.</p><div id="map-all"></div></section>
      <section class="panel"><h2>Perlu perhatian</h2><p class="sub">Aktivitas Manusia menurut status pelanggaran; kategori lain yang perlu tindak lanjut atau kondisinya rusak/roboh.</p><div id="t-flag"></div></section>`;

    stackedMonthly($("#ch-trend"), rows, keyC0, keysC0, colC0);
    const order = resorGroups().flatMap((g) => g.resor);
    const rs = order.map((r) => [r, rows.filter((x) => resorOf(x) === r).length]).filter((e) => !S.resor || e[1]);
    const rsColor = (r) => { const i = order.indexOf(r); return i >= 0 ? sc(i + 1) : css("--faint"); };
    $("#ch-resor").innerHTML = rows.some((x) => order.includes(resorOf(x))) ? "<h3>Total observasi per resor</h3>" + hbars(rs, { color: rsColor }) : "";
    wireResorRows($("#resor"));
    renderMap($("#map-all"), rows, colC0, keyC0, keysC0);
    const fr = flagRows(rows);
    detailTable($("#t-flag"), fr, [
      { h: "Tanggal", f: (x) => dLabel(x.d) },
      { h: "Resor", f: resorOf },
      { h: "Kategori", f: (x) => x.c0 + (x.c1 ? " › " + x.c1 : "") },
      { h: "Tipe temuan", f: (x) => val(x, "Tipe temuan") },
      { h: "Status", f: (x) => flagPills(x), html: (v) => v },
      { h: "Tindakan", f: (x) => val(x, "Tindakan") },
      { h: "Keterangan", f: (x) => val(x, "Keterangan") },
    ]);
  }

  /* ---------------- halaman kategori ---------------- */
  const latinOf = (s) => splitSpecies(s).latin.replace(/\s+/g, " ").trim();
  const statusOf = (s) => STATUS[latinOf(s)] || STATUS[latinOf(s).split(" ").slice(0, 2).join(" ")] || null;
  const lindungLabel = (st) => (!st ? "Belum dicek" : st.dilindungi ? "Dilindungi" : "Tidak dilindungi");
  const iucnLabel = (st) => (!st || !st.iucn ? "Belum dicek" : IUCN[st.iucn] || st.iucn);

  function renderKategori(cat) {
    const all = S.rows.filter((x) => x.c0 === cat.name);
    const am = cat.name === "Aktivitas Manusia";
    const hasSubs = cat.subs.length > 0;
    const groupField = hasSubs ? null : "Tipe temuan";
    const keyOf = (x) => (hasSubs ? x.c1 || "(tanpa sub-kategori)" : val(x, groupField) || "(kosong)");
    // Urutan dan warna kelompok tetap: urutan data model, atau frekuensi pada seluruh data (tidak ikut filter).
    const keys = hasSubs ? cat.subs.map((s) => s.name) : countBy(S.all.filter((x) => x.c0 === cat.name), keyOf).map((e) => e[0]);
    const colorOf = (k) => { const i = keys.indexOf(k); return i >= 0 && i < 7 ? sc(i + 1) : css("--faint"); };
    const fieldsAll = [...new Set(cat.fields.concat(...cat.subs.map((s) => s.fields)))];
    const present = new Set(Object.keys(S.all[0]?.r || {}));
    const spFields = fieldsAll.filter((f) => SPECIES.has(f) && all.some((x) => val(x, f)));
    const spCount = (f) => uniq(all.map((x) => val(x, f)).filter((v) => v && !NO_SPECIES.test(v)));

    const kp = [
      { v: fmt(all.length), l: "Observasi", n: scopeLabel() + " · " + periodLabel() },
      { v: fmt(uniq(all.map((x) => x.grp))), l: "Titik temuan (waypoint)" },
    ];
    if (hasSubs) kp.push({ v: uniq(all.map((x) => x.c1).filter(Boolean)) + " / " + cat.subs.length, l: "Sub-kategori tercatat", n: "dari data model" });
    for (const f of fieldsAll.filter((f) => SPECIES.has(f))) {
      const what = f === "Jenis satwa" ? "Jenis satwa" : "Jenis tumbuhan";
      if (am || all.some((x) => val(x, f))) kp.push({ v: fmt(spCount(f)), l: what + (am ? " terdampak" : " tercatat") });
    }
    if (cat.name === "Satwa Liar") {
      const prot = all.filter((x) => statusOf(val(x, "Jenis satwa"))?.dilindungi);
      kp.push({ v: fmt(uniq(prot.map((x) => val(x, "Jenis satwa")))), l: "Jenis satwa dilindungi", n: fmt(prot.length) + " perjumpaan · P.106/2018" });
      const thr = all.filter((x) => ["CR", "EN", "VU"].includes(statusOf(val(x, "Jenis satwa"))?.iucn));
      kp.push({ v: fmt(uniq(thr.map((x) => val(x, "Jenis satwa")))), l: "Jenis terancam IUCN", n: "CR, EN, VU", tone: thr.length ? "warn" : "" });
    }
    if (fieldsAll.includes("Kondisi tumbuhan")) { const n = all.filter((x) => /mati|sakit|tumbang/i.test(val(x, "Kondisi tumbuhan"))).length; kp.push({ v: fmt(n), l: "Tumbuhan sakit/mati/tumbang", tone: n ? "warn" : "" }); }
    if (fieldsAll.includes("Pelanggaran")) {
      const n = all.filter((x) => val(x, "Pelanggaran") === "Ya").length;
      kp.push({ v: fmt(n), l: "Pelanggaran", tone: n ? "crit" : "" });
      kp.push({ v: fmt(all.filter((x) => /^bukan/i.test(val(x, "Pelanggaran"))).length), l: "Bukan pelanggaran" });
    }
    if (fieldsAll.includes("Kondisi")) { const n = all.filter((x) => BAD_KONDISI.test(val(x, "Kondisi"))).length; kp.push({ v: fmt(n), l: "Kondisi rusak/roboh", tone: n ? "warn" : "" }); }
    if (!am && fieldsAll.includes("Perlu tindak lanjut")) { const n = all.filter((x) => val(x, "Perlu tindak lanjut") === "Ya").length; kp.push({ v: fmt(n), l: "Perlu tindak lanjut", tone: n ? "warn" : "" }); }

    const comp = countBy(all, keyOf);
    const compAll = hasSubs ? keys.map((k) => [k, all.filter((x) => x.c1 === k).length]).sort((a, b) => b[1] - a[1]) : comp;
    const unlisted = cat.name === "Tumbuhan" && all.some((x) => NO_SPECIES.test(val(x, "Jenis tumbuhan")));

    let speciesHtml = "";
    if (am) {
      speciesHtml = `<section class="panel"><h2>Spesies Terdampak Aktivitas Manusia</h2><p class="sub">Jenis tumbuhan dan satwa yang tercatat pada temuan Aktivitas Manusia.</p>
        <div class="grid-2"><div><h3>Jenis tumbuhan terdampak</h3><div id="t-sp-tumbuhan"></div></div><div><h3>Jenis satwa terdampak</h3><div id="t-sp-satwa"></div></div></div></section>`;
    } else if (spFields.length) {
      speciesHtml = spFields.map((f) => `<section class="panel"><h2>Daftar ${f.toLowerCase()}</h2><p class="sub">Diurutkan dari yang paling sering dijumpai. Nama mengikuti daftar SMART: lokal, Indonesia, ilmiah.${f === "Jenis satwa" ? " Status perlindungan menurut Permen LHK P.106/2018; status IUCN menurut Daftar Merah IUCN." : ""}</p><div id="t-sp-${f === "Jenis satwa" ? "satwa" : "tumbuhan"}"></div></section>`).join("");
    }
    if (unlisted) speciesHtml += `<section class="panel"><h2>Daftar Jenis Yang Belum Masuk Daftar</h2><p class="sub">Observasi dengan Jenis tumbuhan “Belum Ada di List”, dikelompokkan menurut nama yang ditulis di kolom Keterangan.</p><div id="t-unlisted"></div></section>`;

    $("#content").innerHTML = `
      ${kpis(kp)}
      ${all.length ? "" : `<div class="notice"><strong>Belum ada observasi</strong> untuk kategori ini pada filter yang dipilih. Struktur halaman tetap ditampilkan sesuai data model.</div>`}
      <div class="grid-2">
        <section class="panel"><h2>Komposisi ${hasSubs ? "sub-kategori" : "tipe temuan"}</h2><p class="sub">${hasSubs ? "Semua sub-kategori pada data model, termasuk yang belum pernah tercatat." : "Dikelompokkan menurut isian Tipe temuan."}</p>
          ${hbars(compAll, { color: colorOf })}</section>
        <section class="panel"><h2>Observasi per bulan</h2><p class="sub">Disusun menurut ${hasSubs ? "sub-kategori" : "tipe temuan"}.</p><div id="ch-trend"></div></section>
      </div>
      ${speciesHtml}
      <section class="panel"><h2>Rincian Temuan ${esc(cat.short)}${hasSubs ? " Kategori 1" : ""}</h2><p class="sub">Ringkasan setiap isian SMART ${hasSubs ? "untuk tiap kategori 1" : "pada kategori ini"}.</p><div id="attrs"></div></section>
      <section class="panel"><h2>Peta sebaran</h2><p class="sub">Warna titik mengikuti ${hasSubs ? "sub-kategori" : "tipe temuan"}; klik titik untuk melihat isinya.</p><div id="map-cat"></div></section>
      <section class="panel" id="resor"><h2>Rekap per resor</h2><p class="sub">Klik baris resor untuk menyaring halaman ini.</p>${resorNotice()}<div style="height:12px"></div>
        ${resorTable(all, keys.filter((k) => all.some((x) => keyOf(x) === k)), keyOf, "Total")}</section>
      <section class="panel"><h2>Tabel rincian observasi</h2><p class="sub">Seluruh baris pada kategori ini, terbaru di atas.</p><div id="t-detail"></div></section>`;

    const trendKeys = keys.filter((k) => all.some((x) => keyOf(x) === k));
    stackedMonthly($("#ch-trend"), all, keyOf, trendKeys, colorOf);
    if ($("#t-sp-satwa")) speciesTable($("#t-sp-satwa"), all, "Jenis satwa", am);
    if ($("#t-sp-tumbuhan")) speciesTable($("#t-sp-tumbuhan"), all, "Jenis tumbuhan", am);
    if (unlisted) unlistedTable($("#t-unlisted"), all.filter((x) => NO_SPECIES.test(val(x, "Jenis tumbuhan"))));
    attrPanels($("#attrs"), cat, all, present);
    renderMap($("#map-cat"), all, colorOf, keyOf, trendKeys);
    wireResorRows($("#resor"));
    const shown = fieldsAll.filter((f) => present.has(f) && all.some((x) => val(x, f)));
    detailTable($("#t-detail"), all, [
      { h: "Tanggal", f: (x) => dLabel(x.d) },
      { h: "Jam", f: (x) => val(x, "Waypoint Time") },
      { h: "WP", f: (x) => val(x, "Waypoint ID"), num: true },
      { h: "Resor", f: resorOf },
      ...(hasSubs ? [{ h: "Sub-kategori", f: (x) => x.c1 }] : []),
      ...shown.map((f) => ({ h: f, f: (x) => val(x, f), num: NUM.has(f) })),
      { h: "Koordinat", f: (x) => (x.lat != null ? x.lat.toFixed(5) + ", " + x.lon.toFixed(5) : "") },
    ]);
  }

  function speciesTable(el, rows, field, compact) {
    const m = new Map();
    for (const x of rows) {
      const s = val(x, field); if (!s) continue;
      if (!m.has(s)) m.set(s, { n: 0, ind: 0, hasInd: false, kondisi: new Map() });
      const o = m.get(s); o.n++;
      const j = num(val(x, "Jumlah")); if (j != null && /ekor|individu|^$/i.test(val(x, "Satuan"))) { o.ind += j; o.hasInd = true; }
      const k = val(x, "Kondisi tumbuhan"); if (k) o.kondisi.set(k, (o.kondisi.get(k) || 0) + 1);
    }
    const list = [...m.entries()].sort((a, b) => b[1].n - a[1].n);
    if (!list.length) { el.innerHTML = '<div class="empty">Tidak ada jenis yang tercatat.</div>'; return; }
    const anyInd = list.some(([, o]) => o.hasInd);
    const satwa = field === "Jenis satwa";
    const pill = (v, cls) => `<span class="pill ${cls}">${esc(v)}</span>`;
    detailTable(el, list, [
      { h: "#", f: (e) => String(list.indexOf(e) + 1), num: true },
      { h: "Nama Indonesia", f: (e) => (NO_SPECIES.test(e[0]) ? "Belum ada di daftar" : splitSpecies(e[0]).indo) },
      ...(compact ? [] : [{ h: "Nama lokal", f: (e) => splitSpecies(e[0]).lokal }]),
      { h: "Nama ilmiah", f: (e) => splitSpecies(e[0]).latin, html: (v) => `<span class="latin">${esc(v)}</span>` },
      { h: "Observasi", f: (e) => fmt(e[1].n), num: true },
      ...(anyInd && !compact ? [{ h: "Individu", f: (e) => (e[1].hasInd ? fmt(e[1].ind) : "–"), num: true }] : []),
      ...(satwa && !compact ? [
        { h: "Perlindungan", f: (e) => (NO_SPECIES.test(e[0]) || !splitSpecies(e[0]).latin ? "" : lindungLabel(statusOf(e[0]))), html: (v) => (v ? pill(v, v === "Dilindungi" ? "crit" : v === "Belum dicek" ? "warn" : "") : "") },
        { h: "IUCN", f: (e) => (NO_SPECIES.test(e[0]) || !splitSpecies(e[0]).latin ? "" : iucnLabel(statusOf(e[0]))), html: (v) => (v ? pill(v, /CR|EN|VU/.test(v) ? "crit" : /NT/.test(v) ? "warn" : v === "Belum dicek" ? "warn" : "") : "") },
      ] : []),
      ...(!satwa && !compact ? [{ h: "Kondisi", f: (e) => [...e[1].kondisi.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join(", ") }] : []),
    ]);
  }

  function unlistedTable(el, rows) {
    const m = new Map();
    for (const x of rows) {
      const k = val(x, "Keterangan") || "(keterangan kosong)";
      if (!m.has(k)) m.set(k, { n: 0, last: null, resor: new Set() });
      const o = m.get(k); o.n++; o.resor.add(resorOf(x)); if (!o.last || (x.d && x.d > o.last)) o.last = x.d;
    }
    const list = [...m.entries()].sort((a, b) => b[1].n - a[1].n);
    detailTable(el, list, [
      { h: "Nama / keterangan yang ditulis", f: (e) => e[0] },
      { h: "Observasi", f: (e) => fmt(e[1].n), num: true },
      { h: "Terakhir dijumpai", f: (e) => dLabel(e[1].last) },
      { h: "Resor", f: (e) => [...e[1].resor].join(", ") },
    ]);
  }

  function attrPanels(el, cat, all, present) {
    const groups = cat.subs.length ? cat.subs.map((s) => ({ name: s.name, fields: s.fields, rows: all.filter((x) => x.c1 === s.name) })) : [{ name: null, fields: cat.fields, rows: all }];
    const withData = groups.filter((g) => g.rows.length);
    const empty = groups.filter((g) => !g.rows.length).map((g) => g.name).filter(Boolean);
    let h = withData.map((g) => {
      const head = g.name ? `<div class="subhead"><h3>${esc(g.name)}</h3><span class="missing">${fmt(g.rows.length)} observasi · ${fmt(uniq(g.rows.map((x) => x.grp)))} titik</span></div>` : "";
      const cells = g.fields.filter((f) => f !== "Satuan").map((f) => attrCell(f, g.rows, present, g.fields.includes("Satuan"), g.name)).join("");
      return `<div class="subblock">${head}<div class="attrs">${cells}</div></div>`;
    }).join("");
    if (empty.length) h += `<div class="subblock empty-subs"><h3>Belum tercatat</h3><span class="missing">${empty.map(esc).join(" · ")}</span></div>`;
    el.innerHTML = `<div class="subblocks">${h || '<div class="empty">Belum ada data.</div>'}</div>`;
    el.querySelectorAll("[data-person]").forEach((box) => {
      const g = withData.find((x) => x.name === (box.dataset.sub || null)) || withData[0];
      personTable(box, g.rows, box.dataset.person);
    });
  }
  function personTable(el, rows, f) {
    const m = new Map();
    for (const x of rows) {
      const k = val(x, f); if (!k) continue;
      if (!m.has(k)) m.set(k, { n: 0, last: null, resor: new Set(), ket: new Set() });
      const o = m.get(k); o.n++; o.resor.add(resorOf(x)); if (!o.last || (x.d && x.d > o.last)) o.last = x.d;
      const kt = val(x, "Keterangan") || val(x, "Tipe temuan"); if (kt) o.ket.add(kt);
    }
    const list = [...m.entries()].sort((a, b) => b[1].n - a[1].n);
    detailTable(el, list, [
      { h: f, f: (e) => e[0] },
      { h: "Catatan", f: (e) => fmt(e[1].n), num: true },
      { h: "Terakhir", f: (e) => dLabel(e[1].last) },
      { h: "Resor", f: (e) => [...e[1].resor].join(", ") },
      { h: "Keterangan", f: (e) => [...e[1].ket].slice(0, 3).join("; ") },
    ]);
  }
  function attrCell(f, rows, present, hasSatuan, sub) {
    if (rows[0] && isHidden(rows[0].c0, f)) return `<div class="attr"><h4>${esc(f)}</h4><div class="missing">Disembunyikan untuk menjaga privasi.</div></div>`;
    // Kolom Status satwa dari SMART tidak dipakai; diganti status resmi dari status-spesies.js.
    if (f === "Status" && rows[0]?.c0 === "Satwa Liar") {
      const sp = rows.map((x) => val(x, "Jenis satwa")).filter((v) => v && !NO_SPECIES.test(v) && splitSpecies(v).latin);
      return `<div class="attr"><h4>Status perlindungan <span class="n">· P.106/2018 · ${fmt(sp.length)} perjumpaan</span></h4>${hbars(countBy(sp, (s) => lindungLabel(statusOf(s))))}</div>
        <div class="attr"><h4>Status IUCN <span class="n">· Daftar Merah IUCN</span></h4>${hbars(countBy(sp, (s) => iucnLabel(statusOf(s))))}</div>`;
    }
    if (!present.has(f)) return `<div class="attr"><h4>${esc(f)}</h4><div class="missing">Kolom ini belum ada di ekspor CSV.</div></div>`;
    const vals = rows.map((x) => val(x, f)).filter(Boolean);
    const n = `<span class="n"> · ${fmt(vals.length)} dari ${fmt(rows.length)} terisi</span>`;
    if (!vals.length) return `<div class="attr"><h4>${esc(f)}${n}</h4><div class="missing">Belum pernah diisi.</div></div>`;
    if (PERSON.has(f)) return `<div class="attr wide"><h4>${esc(f)}${n}</h4><div data-person="${esc(f)}" data-sub="${esc(sub || "")}"></div></div>`;
    if (NUM.has(f)) {
      const parts = [];
      const by = new Map();
      const hektarOnly = f === "Jumlah" && (C.JUMLAH_HEKTAR_SAJA || []).includes(sub);
      for (const x of rows) {
        const v = num(val(x, f)); if (v == null) continue;
        const u = hasSatuan && f === "Jumlah" ? val(x, "Satuan") || "tanpa satuan" : "";
        if (hektarOnly && !/hektar|ha\b/i.test(u)) continue;
        if (!by.has(u)) by.set(u, []); by.get(u).push(v);
      }
      if (!by.size) return `<div class="attr"><h4>${esc(f)}${hektarOnly ? " (hektar)" : ""}</h4><div class="missing">Belum ada isian${hektarOnly ? " dengan satuan hektar" : ""}.</div></div>`;
      for (const [u, arr] of by) {
        const sum = arr.reduce((a, b) => a + b, 0), lo = Math.min(...arr), hi = Math.max(...arr);
        const range = `rentang <b>${fmt(lo, 2)}${lo === hi ? "" : "–" + fmt(hi, 2)}</b>`;
        let line;
        if (NUM_RANGE.has(f)) line = range;
        else if (NUM_AVG.has(f)) line = `rata-rata <b>${fmt(sum / arr.length, 1)}</b> · ${range}`;
        else line = `Total <b>${fmt(sum, 2)}${u ? " " + esc(u) : ""}</b> · ${range}`;
        parts.push(`<div class="stat-line"><span>${line}${u ? " (" + fmt(arr.length) + " isian)" : ""}</span></div>`);
      }
      return `<div class="attr"><h4>${esc(f)}${hektarOnly ? " (hektar)" : ""}${n}</h4>${parts.join("")}</div>`;
    }
    if (TEXT.has(f)) {
      const all = countBy(rows, (x) => val(x, f));
      // Nomor pal dan kode ternak selalu ditampilkan semua; teks lain 10 teratas lalu sisanya bisa dibuka.
      const lim = /^(No\. pal|Kode Tanda Ternak)$/.test(f) ? all.length : 10;
      return `<div class="attr"><h4>${esc(f)}${n}</h4>${hbars(all, { limit: lim, label: (k) => esc(k.length > 90 ? k.slice(0, 90) + "…" : k) })}</div>`;
    }
    const e = countBy(rows, (x) => val(x, f));
    const label = SPECIES.has(f) ? (k) => (NO_SPECIES.test(k) ? "Belum ada di daftar" : `${esc(speciesName(k))} <span class="latin">${esc(splitSpecies(k).latin)}</span>`) : null;
    return `<div class="attr"><h4>${esc(f)}${n}</h4>${hbars(e, { limit: 10, label })}</div>`;
  }

  /* ---------------- render ---------------- */
  function render() {
    while (charts.length) charts.pop().destroy();
    maps.forEach((m) => m.remove()); maps = [];
    Chart.defaults.font.family = css("--f-body");
    Chart.defaults.color = css("--muted");
    Chart.defaults.borderColor = css("--line");
    const cat = M.find((c) => c.slug === PAGE);
    if (cat) renderKategori(cat); else renderKawasan();
    if (S.sheetError) $("#content").insertAdjacentHTML("afterbegin", sheetNotice());
  }

  async function init() {
    const q = new URLSearchParams(location.search);
    if (q.has("embed") || location.hash === "#embed") document.body.classList.add("embed");
    try {
      S.all = normalize(await load());
    } catch (e) {
      $("#content").innerHTML = `<div class="notice"><strong>Data tidak dapat dimuat.</strong> Periksa tautan Google Sheets di assets/config.js atau file ${esc(C.FALLBACK_CSV)}.</div>`;
      return;
    }
    // Tampilan awal: hanya tahun TAHUN_AWAL (atau tahun terbaru bila tahun itu belum ada datanya).
    const months = monthRange(S.all);
    const years = [...new Set(months.map((m) => m.slice(0, 4)))];
    const y = years.includes(String(C.TAHUN_AWAL)) ? String(C.TAHUN_AWAL) : years[years.length - 1];
    const inYear = months.filter((m) => m.startsWith(y));
    S.from = inYear[0] || ""; S.to = inYear[inYear.length - 1] || "";
    chrome();
    filterBar();
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", render);
  }
  init();
})();
