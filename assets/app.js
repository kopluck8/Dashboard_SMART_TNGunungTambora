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

  const S = { all: [], rows: [], hasResor: false, demo: false, resor: "", from: "", to: "", source: "" };
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
  function splitSpecies(s) {
    const p = s.split(" - ").map((x) => x.trim());
    if (p.length >= 3) return { lokal: p[0], indo: p[1], latin: p.slice(2).join(" - ") };
    if (p.length === 2) return { lokal: p[0], indo: "", latin: p[1] };
    return { lokal: "", indo: s, latin: "" };
  }
  function speciesName(s) { const p = splitSpecies(s); return p.indo || p.lokal || p.latin; }

  function parseDate(s) {
    s = String(s || "").trim();
    let m = /^([A-Za-z]{3})[a-z]*\.?\s+(\d{1,2}),?\s+(\d{4})/.exec(s);
    if (m && m[1] in EN) return new Date(+m[3], EN[m[1]], +m[2]);
    m = /^(\d{4})-(\d{1,2})-(\d{1,2})/.exec(s); if (m) return new Date(+m[1], m[2] - 1, +m[3]);
    m = /^(\d{1,2})\/(\d{1,2})\/(\d{4})/.exec(s); if (m) return new Date(+m[3], m[2] - 1, +m[1]);
    const d = new Date(s); return isNaN(d) ? null : d;
  }

  /* ---------------- data ---------------- */
  function loadCSV(url) {
    return new Promise((res, rej) => Papa.parse(url, {
      download: true, header: true, skipEmptyLines: true,
      complete: (r) => (r.data.length ? res(r.data) : rej(new Error("kosong"))), error: rej,
    }));
  }
  async function load() {
    if (C.SHEET_CSV_URL) {
      try { const d = await loadCSV(C.SHEET_CSV_URL); S.source = "Google Sheets"; return d; }
      catch (e) { console.warn("Google Sheets tidak terbaca, memakai file cadangan", e); }
    }
    const d = await loadCSV(C.FALLBACK_CSV); S.source = C.FALLBACK_CSV; return d;
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
    const rc = cols.find((c) => C.RESOR_COLUMNS.some((x) => x.toLowerCase() === c.trim().toLowerCase()));
    S.hasResor = !!rc;
    const rows = raw.filter((r) => (r["Observation Category 0"] || "").trim()).map((r) => {
      const d = parseDate(r["Waypoint Date"]);
      for (const f of C.SEMBUNYIKAN?.[r["Observation Category 0"].trim()] || []) if (f in r) r[f] = "";
      return {
        r, d,
        ym: d ? d.getFullYear() + "-" + pad(d.getMonth() + 1) : "",
        day: d ? d.getFullYear() + "-" + pad(d.getMonth() + 1) + "-" + pad(d.getDate()) : "",
        c0: r["Observation Category 0"].trim(),
        c1: (r["Observation Category 1"] || "").trim(),
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
    const title = cat ? cat.short : "Dashboard Kawasan";
    const lede = cat ? cat.desc : "Rekap seluruh observasi SMART Patrol di " + C.NAMA_KAWASAN + ", dari tingkat kawasan hingga per resor.";
    const counts = Object.fromEntries(countBy(S.all, (x) => x.c0));
    const tabs = [`<a href="index.html"${!cat ? ' aria-current="page"' : ""}>Dashboard Kawasan</a>`]
      .concat(M.map((c) => `<a href="${c.slug}.html"${cat === c ? ' aria-current="page"' : ""}>${esc(c.short)}<span class="count">${fmt(counts[c.name] || 0)}</span></a>`));
    document.title = title + " · Data SMART Patrol";
    $("#band").innerHTML = `${contours()}<div class="band-inner">
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
    $("#f-meta").textContent = fmt(S.rows.length) + " observasi · sumber: " + S.source;
    render();
  }

  /* ---------------- components ---------------- */
  function kpis(items) {
    return `<div class="kpis">${items.map((k) => `<div class="kpi ${k.tone || ""}"><span class="v">${k.v}</span><span class="l">${esc(k.l)}</span>${k.n ? `<span class="n">${esc(k.n)}</span>` : ""}</div>`).join("")}</div>`;
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
    if (rest.length) h += `<div class="missing">+ ${rest.length} nilai lain (${fmt(rest.reduce((a, e) => a + e[1], 0))} observasi)</div>`;
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
  function singleMonthly(el, months, values, label) {
    el.innerHTML = `<div class="chart" style="height:260px"><canvas></canvas></div>`;
    charts.push(new Chart($("canvas", el), {
      type: "bar",
      data: { labels: months.map(ymLabel), datasets: [{ label, data: values, backgroundColor: css("--accent"), borderRadius: { topLeft: 4, topRight: 4 }, maxBarThickness: 46 }] },
      options: { maintainAspectRatio: false, animation: false, plugins: { legend: { display: false } },
        scales: { x: { grid: { display: false } }, y: { beginAtZero: true, ticks: { precision: 0 }, grid: { color: css("--line") }, border: { display: false } } } },
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
    L.control.layers({ "Citra satelit": sat, "Peta jalan": osm }).addTo(map);
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
    const head = `<tr><th>Wilayah / resor</th>${keys.map((k) => `<th class="num">${esc(k)}</th>`).join("")}<th class="num">Total</th><th class="num">Hari patroli</th></tr>`;
    const line = (name, rr, cls, key) => `<tr class="click ${cls}" data-resor="${esc(key)}" tabindex="0" title="Klik untuk menampilkan ${esc(name)} saja"><td>${esc(name)}</td>${keys.map((k) => `<td class="num">${fmt(rr.filter((x) => keyOf(x) === k).length) || "–"}</td>`).join("")}<td class="num"><b>${fmt(rr.length)}</b></td><td class="num">${fmt(uniq(rr.map((x) => x.day))) || "–"}</td></tr>`;
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
    const foot = `<tr><td>${esc(label)}</td>${keys.map((k) => `<td class="num">${fmt(tot((x) => keyOf(x) === k))}</td>`).join("")}<td class="num">${fmt(rows.length)}</td><td class="num">${fmt(uniq(rows.map((x) => x.day)))}</td></tr>`;
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

  function flagRows(rows) {
    return rows.filter((x) => val(x, "Pelanggaran") === "Ya" || val(x, "Perlu tindak lanjut") === "Ya" || BAD_KONDISI.test(val(x, "Kondisi")));
  }
  function flagPills(x) {
    const p = [];
    if (val(x, "Pelanggaran") === "Ya") p.push('<span class="pill crit">Pelanggaran</span>');
    if (val(x, "Perlu tindak lanjut") === "Ya") p.push('<span class="pill warn">Perlu tindak lanjut</span>');
    if (BAD_KONDISI.test(val(x, "Kondisi"))) p.push(`<span class="pill warn">${esc(val(x, "Kondisi"))}</span>`);
    return p.join(" ");
  }

  /* ---------------- halaman kawasan ---------------- */
  function renderKawasan() {
    const rows = S.rows;
    const months = monthRange(rows);
    const sp = (f) => uniq(rows.map((x) => val(x, f)).filter((v) => v && !NO_SPECIES.test(v)));
    const pel = rows.filter((x) => val(x, "Pelanggaran") === "Ya").length;
    const tl = rows.filter((x) => val(x, "Perlu tindak lanjut") === "Ya").length;
    const scope = scopeLabel();
    const c0counts = Object.fromEntries(countBy(rows, (x) => x.c0));
    const maxC = Math.max(1, ...Object.values(c0counts));
    const catKeys = Object.keys(CAT_COLOR).filter((k) => c0counts[k]).sort((a, b) => c0counts[b] - c0counts[a]);
    const keyC0 = (x) => (CAT_COLOR[x.c0] ? x.c0 : OTHER);
    const keysC0 = catKeys.concat(rows.some((x) => !CAT_COLOR[x.c0]) ? [OTHER] : []);
    const colC0 = (k) => (k === OTHER ? css("--faint") : catColor(k));

    $("#content").innerHTML = `
      ${kpis([
        { v: fmt(rows.length), l: "Observasi tercatat", n: scope },
        { v: fmt(uniq(rows.map((x) => x.grp))), l: "Titik temuan (waypoint)" },
        { v: fmt(uniq(rows.map((x) => x.day))), l: "Hari patroli", n: months.length ? ymLabel(months[0]) + " – " + ymLabel(months[months.length - 1]) : "" },
        { v: fmt(sp("Jenis satwa")), l: "Jenis satwa tercatat" },
        { v: fmt(sp("Jenis tumbuhan")), l: "Jenis tumbuhan tercatat" },
        { v: fmt(pel), l: "Temuan pelanggaran", tone: pel ? "crit" : "" },
        { v: fmt(tl), l: "Perlu tindak lanjut", tone: tl ? "warn" : "" },
      ])}
      <section class="panel"><h2>Kategori temuan</h2><p class="sub">Jumlah observasi per kategori 0 pada ${esc(scope)}. Klik kartu untuk membuka rekap rinci kategori tersebut.</p>
        <div class="cats">${M.map((c) => {
          const n = c0counts[c.name] || 0;
          const top = countBy(rows.filter((x) => x.c0 === c.name), (x) => x.c1 || val(x, "Tipe temuan"))[0];
          return `<a class="cat" href="${c.slug}.html"><span class="t">${esc(c.short)}</span><span class="v">${fmt(n)}</span><span class="bar"><b style="width:${(n / maxC) * 100}%"></b></span><span class="d">${top ? "Terbanyak: " + esc(top[0]) + " (" + fmt(top[1]) + ")" : "Belum ada observasi"}</span></a>`;
        }).join("")}</div></section>
      <div class="grid-2">
        <section class="panel"><h2>Observasi per bulan</h2><p class="sub">Disusun menurut kategori 0.</p><div id="ch-trend"></div></section>
        <section class="panel"><h2>Hari patroli per bulan</h2><p class="sub">Jumlah tanggal berbeda yang memiliki minimal satu observasi.</p><div id="ch-days"></div></section>
      </div>
      <section class="panel" id="resor"><h2>Rekap per resor</h2><p class="sub">Klik baris resor untuk mengerucutkan seluruh dashboard ke resor tersebut. Pilih “Seluruh kawasan” di atas untuk kembali ke tingkat kawasan.</p>
        ${resorNotice()}<div style="height:12px"></div>${resorTable(rows, keysC0.map((k) => (k === OTHER ? OTHER : M.find((m) => m.name === k)?.short || k)), (x) => { const k = keyC0(x); return k === OTHER ? OTHER : M.find((m) => m.name === k)?.short || k; }, "Total " + scope)}
        <div id="ch-resor" style="margin-top:18px"></div></section>
      <section class="panel"><h2>Peta sebaran temuan</h2><p class="sub">Setiap titik adalah satu waypoint; klik titik untuk melihat isinya.</p><div id="map-all"></div></section>
      <section class="panel"><h2>Perlu perhatian</h2><p class="sub">Temuan dengan pelanggaran, perlu tindak lanjut, atau kondisi rusak/roboh.</p><div id="t-flag"></div></section>`;

    stackedMonthly($("#ch-trend"), rows, keyC0, keysC0, colC0);
    singleMonthly($("#ch-days"), months, months.map((m) => uniq(rows.filter((x) => x.ym === m).map((x) => x.day))), "Hari patroli");
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
  function renderKategori(cat) {
    const all = S.rows.filter((x) => x.c0 === cat.name);
    const hasSubs = cat.subs.length > 0;
    const groupField = hasSubs ? null : "Tipe temuan";
    const keyOf = (x) => (hasSubs ? x.c1 || "(tanpa sub-kategori)" : val(x, groupField) || "(kosong)");
    // Urutan dan warna kelompok tetap: urutan data model, atau frekuensi pada seluruh data (tidak ikut filter).
    const keys = hasSubs ? cat.subs.map((s) => s.name) : countBy(S.all.filter((x) => x.c0 === cat.name), keyOf).map((e) => e[0]);
    const colorOf = (k) => { const i = keys.indexOf(k); return i >= 0 && i < 7 ? sc(i + 1) : css("--faint"); };
    const fieldsAll = [...new Set(cat.fields.concat(...cat.subs.map((s) => s.fields)))];
    const present = new Set(Object.keys(S.all[0]?.r || {}));
    const months = monthRange(all);

    const kp = [
      { v: fmt(all.length), l: "Observasi", n: scopeLabel() },
      { v: fmt(uniq(all.map((x) => x.grp))), l: "Titik temuan (waypoint)" },
      { v: fmt(uniq(all.map((x) => x.day))), l: "Hari patroli dengan temuan", n: months.length ? ymLabel(months[0]) + " – " + ymLabel(months[months.length - 1]) : "" },
    ];
    if (hasSubs) kp.push({ v: uniq(all.map((x) => x.c1).filter(Boolean)) + " / " + cat.subs.length, l: "Sub-kategori tercatat", n: "dari data model" });
    for (const f of fieldsAll) if (SPECIES.has(f)) kp.push({ v: fmt(uniq(all.map((x) => val(x, f)).filter((v) => v && !NO_SPECIES.test(v)))), l: f + " berbeda" });
    if (fieldsAll.includes("Status") && all.some((x) => val(x, "Status") === "Dilindungi")) kp.push({ v: fmt(all.filter((x) => val(x, "Status") === "Dilindungi").length), l: "Perjumpaan satwa dilindungi" });
    if (fieldsAll.includes("Kondisi tumbuhan")) { const n = all.filter((x) => /mati|sakit|tumbang/i.test(val(x, "Kondisi tumbuhan"))).length; kp.push({ v: fmt(n), l: "Tumbuhan sakit/mati/tumbang", tone: n ? "warn" : "" }); }
    if (fieldsAll.includes("Pelanggaran")) { const n = all.filter((x) => val(x, "Pelanggaran") === "Ya").length; kp.push({ v: fmt(n), l: "Pelanggaran", tone: n ? "crit" : "" }); }
    if (fieldsAll.includes("Kondisi")) { const n = all.filter((x) => BAD_KONDISI.test(val(x, "Kondisi"))).length; kp.push({ v: fmt(n), l: "Kondisi rusak/roboh", tone: n ? "warn" : "" }); }
    if (fieldsAll.includes("Perlu tindak lanjut")) { const n = all.filter((x) => val(x, "Perlu tindak lanjut") === "Ya").length; kp.push({ v: fmt(n), l: "Perlu tindak lanjut", tone: n ? "warn" : "" }); }

    const comp = countBy(all, keyOf);
    const compAll = hasSubs ? keys.map((k) => [k, all.filter((x) => x.c1 === k).length]).sort((a, b) => b[1] - a[1]) : comp;
    const speciesField = fieldsAll.find((f) => SPECIES.has(f) && all.some((x) => val(x, f)));

    $("#content").innerHTML = `
      ${kpis(kp)}
      ${all.length ? "" : `<div class="notice"><strong>Belum ada observasi</strong> untuk kategori ini pada filter yang dipilih. Struktur halaman tetap ditampilkan sesuai data model.</div>`}
      <div class="grid-2">
        <section class="panel"><h2>Komposisi ${hasSubs ? "sub-kategori" : "tipe temuan"}</h2><p class="sub">${hasSubs ? "Semua sub-kategori pada data model, termasuk yang belum pernah tercatat." : "Dikelompokkan menurut isian Tipe temuan."}</p>
          ${hbars(compAll, { color: colorOf })}</section>
        <section class="panel"><h2>Observasi per bulan</h2><p class="sub">Disusun menurut ${hasSubs ? "sub-kategori" : "tipe temuan"}.</p><div id="ch-trend"></div></section>
      </div>
      ${speciesField ? `<section class="panel"><h2>Daftar ${speciesField.toLowerCase()}</h2><p class="sub">Diurutkan dari yang paling sering dijumpai. Nama mengikuti daftar SMART: lokal, Indonesia, ilmiah.</p><div id="t-species"></div></section>` : ""}
      <section class="panel"><h2>Rincian isian data model</h2><p class="sub">Ringkasan setiap atribut yang diisi di SMART untuk ${hasSubs ? "tiap sub-kategori" : "kategori ini"}.</p><div id="attrs"></div></section>
      <section class="panel"><h2>Peta sebaran</h2><p class="sub">Warna titik mengikuti ${hasSubs ? "sub-kategori" : "tipe temuan"}; klik titik untuk melihat isinya.</p><div id="map-cat"></div></section>
      <section class="panel" id="resor"><h2>Rekap per resor</h2><p class="sub">Klik baris resor untuk menyaring halaman ini.</p>${resorNotice()}<div style="height:12px"></div>
        ${resorTable(all, keys.filter((k) => all.some((x) => keyOf(x) === k)), keyOf, "Total")}</section>
      <section class="panel"><h2>Tabel rincian observasi</h2><p class="sub">Seluruh baris pada kategori ini, terbaru di atas.</p><div id="t-detail"></div></section>`;

    const trendKeys = keys.filter((k) => all.some((x) => keyOf(x) === k));
    stackedMonthly($("#ch-trend"), all, keyOf, trendKeys, colorOf);
    if (speciesField) speciesTable($("#t-species"), all, speciesField);
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

  function speciesTable(el, rows, field) {
    const m = new Map();
    for (const x of rows) {
      const s = val(x, field); if (!s) continue;
      if (!m.has(s)) m.set(s, { n: 0, ind: 0, hasInd: false, extra: new Map(), days: new Set() });
      const o = m.get(s); o.n++; o.days.add(x.day);
      const j = num(val(x, "Jumlah")); if (j != null && /ekor|individu|^$/i.test(val(x, "Satuan"))) { o.ind += j; o.hasInd = true; }
      const e = val(x, "Status") || val(x, "Kondisi tumbuhan"); if (e) o.extra.set(e, (o.extra.get(e) || 0) + 1);
    }
    const list = [...m.entries()].sort((a, b) => b[1].n - a[1].n);
    const anyInd = list.some(([, o]) => o.hasInd);
    const extraName = field === "Jenis satwa" ? "Status" : "Kondisi";
    detailTable(el, list, [
      { h: "#", f: (e) => String(list.indexOf(e) + 1), num: true },
      { h: "Nama Indonesia", f: (e) => (NO_SPECIES.test(e[0]) ? "Belum ada di daftar" : splitSpecies(e[0]).indo) },
      { h: "Nama lokal", f: (e) => splitSpecies(e[0]).lokal },
      { h: "Nama ilmiah", f: (e) => splitSpecies(e[0]).latin, html: (v) => `<span class="latin">${esc(v)}</span>` },
      { h: "Observasi", f: (e) => fmt(e[1].n), num: true },
      ...(anyInd ? [{ h: "Individu", f: (e) => (e[1].hasInd ? fmt(e[1].ind) : "–"), num: true }] : []),
      { h: "Hari dijumpai", f: (e) => fmt(e[1].days.size), num: true },
      { h: extraName, f: (e) => [...e[1].extra.entries()].sort((a, b) => b[1] - a[1]).map(([k, v]) => k + " " + v).join(", ") },
    ]);
  }

  function attrPanels(el, cat, all, present) {
    const groups = cat.subs.length ? cat.subs.map((s) => ({ name: s.name, fields: s.fields, rows: all.filter((x) => x.c1 === s.name) })) : [{ name: null, fields: cat.fields, rows: all }];
    const withData = groups.filter((g) => g.rows.length);
    const empty = groups.filter((g) => !g.rows.length).map((g) => g.name).filter(Boolean);
    let h = withData.map((g) => {
      const head = g.name ? `<div class="subhead"><h3>${esc(g.name)}</h3><span class="missing">${fmt(g.rows.length)} observasi · ${fmt(uniq(g.rows.map((x) => x.grp)))} titik</span></div>` : "";
      const cells = g.fields.filter((f) => f !== "Satuan").map((f) => attrCell(f, g.rows, present, g.fields.includes("Satuan"))).join("");
      return head + `<div class="attrs" style="margin-top:12px">${cells}</div>`;
    }).join("");
    if (empty.length) h += `<div class="subhead"><h3>Belum tercatat</h3><span class="missing">${empty.map(esc).join(" · ")}</span></div>`;
    el.innerHTML = h || '<div class="empty">Belum ada data.</div>';
  }
  function attrCell(f, rows, present, hasSatuan) {
    if (rows[0] && isHidden(rows[0].c0, f)) return `<div class="attr"><h4>${esc(f)}</h4><div class="missing">Disembunyikan untuk menjaga privasi.</div></div>`;
    if (!present.has(f)) return `<div class="attr"><h4>${esc(f)}</h4><div class="missing">Kolom ini belum ada di ekspor CSV.</div></div>`;
    const vals = rows.map((x) => val(x, f)).filter(Boolean);
    const n = `<span class="n"> · ${fmt(vals.length)} dari ${fmt(rows.length)} terisi</span>`;
    if (!vals.length) return `<div class="attr"><h4>${esc(f)}${n}</h4><div class="missing">Belum pernah diisi.</div></div>`;
    if (NUM.has(f)) {
      const parts = [];
      const by = new Map();
      for (const x of rows) { const v = num(val(x, f)); if (v == null) continue; const u = hasSatuan && f === "Jumlah" ? val(x, "Satuan") || "tanpa satuan" : ""; if (!by.has(u)) by.set(u, []); by.get(u).push(v); }
      for (const [u, arr] of by) {
        const sum = arr.reduce((a, b) => a + b, 0);
        const sumTxt = /azimuth/i.test(f) ? "" : `Total <b>${fmt(sum, 2)}${u ? " " + esc(u) : ""}</b> · `;
        parts.push(`<div class="stat-line"><span>${sumTxt}rata-rata <b>${fmt(sum / arr.length, 1)}</b> · rentang <b>${fmt(Math.min(...arr), 2)}–${fmt(Math.max(...arr), 2)}</b>${u ? " (" + fmt(arr.length) + " isian)" : ""}</span></div>`);
      }
      return `<div class="attr"><h4>${esc(f)}${n}</h4>${parts.join("")}</div>`;
    }
    if (TEXT.has(f)) {
      const top = countBy(rows, (x) => val(x, f)).slice(0, 4);
      return `<div class="attr"><h4>${esc(f)}${n}</h4><div class="missing" style="margin-bottom:4px">Isian teks bebas; contoh terbanyak:</div>${hbars(top, { label: (k) => esc(k.length > 70 ? k.slice(0, 70) + "…" : k) })}</div>`;
    }
    const e = countBy(rows, (x) => val(x, f));
    const label = SPECIES.has(f) ? (k) => (NO_SPECIES.test(k) ? "Belum ada di daftar" : `${esc(speciesName(k))} <span class="latin">${esc(splitSpecies(k).latin)}</span>`) : null;
    return `<div class="attr"><h4>${esc(f)}${n}</h4>${hbars(e, { limit: 8, label })}</div>`;
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
    const months = monthRange(S.all);
    S.from = months[0] || ""; S.to = months[months.length - 1] || "";
    chrome();
    filterBar();
    update();
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    if (mq.addEventListener) mq.addEventListener("change", render);
  }
  init();
})();
