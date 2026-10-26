/* Penulis file unduhan: Excel (lewat SheetJS, dimuat saat dibutuhkan) dan shapefile (ditulis sendiri, dibungkus JSZip).
   Dipakai oleh halaman unduh.html melalui window.SMART_EXPORT. */
(function () {
  "use strict";

  function loadScript(src) {
    return new Promise((res, rej) => {
      if (document.querySelector(`script[data-src="${src}"]`)) return res();
      const s = document.createElement("script");
      s.src = src; s.dataset.src = src; s.onload = res; s.onerror = () => rej(new Error("Gagal memuat " + src));
      document.head.appendChild(s);
    });
  }
  function save(blob, name) {
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob); a.download = name;
    document.body.appendChild(a); a.click(); a.remove();
    setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  }

  // Nama sheet Excel: maks 31 karakter, tanpa : \ / ? * [ ], dan unik.
  function sheetName(name, used) {
    let base = String(name).replace(/[:\\/?*[\]]/g, " ").trim().slice(0, 31) || "Data", n = base, i = 2;
    while (used.has(n.toLowerCase())) n = base.slice(0, 28) + " " + i++;
    used.add(n.toLowerCase());
    return n;
  }

  // layers: [{ name, cols: [nama kolom], rows: [[nilai...]] }], info: [[label, isi]]
  async function xlsx(layers, info, filename) {
    await loadScript("assets/vendor/xlsx.mini.min.js");
    const wb = XLSX.utils.book_new(), used = new Set();
    for (const ly of layers) {
      const ws = XLSX.utils.aoa_to_sheet([ly.cols].concat(ly.rows));
      ws["!cols"] = ly.cols.map((c, j) => ({ wch: Math.min(48, Math.max(c.length, ...ly.rows.slice(0, 200).map((r) => String(r[j] ?? "").length)) + 2) }));
      ws["!autofilter"] = { ref: XLSX.utils.encode_range({ s: { r: 0, c: 0 }, e: { r: ly.rows.length, c: ly.cols.length - 1 } }) };
      XLSX.utils.book_append_sheet(wb, ws, sheetName(ly.name, used));
    }
    const wi = XLSX.utils.aoa_to_sheet([["Keterangan unduhan", ""]].concat(info));
    wi["!cols"] = [{ wch: 26 }, { wch: 70 }];
    XLSX.utils.book_append_sheet(wb, wi, sheetName("Info", used));
    const out = XLSX.write(wb, { bookType: "xlsx", type: "array", compression: true });
    save(new Blob([out], { type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" }), filename);
  }

  /* ---------------- shapefile ---------------- */
  // Teks DBF ditulis sebagai Latin-1 (dengan file .cpg); karakter di luar itu diganti "?".
  const latin1 = (s) => String(s ?? "").replace(/[^\x00-\xff]/g, "?");

  // Nama kolom DBF: maks 10 karakter huruf/angka/garis bawah, unik.
  function dbfNames(cols) {
    const used = new Set();
    return cols.map((c) => {
      let b = latin1(c).normalize("NFD").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "").slice(0, 10) || "F";
      let n = b, i = 2;
      while (used.has(n.toUpperCase())) { const s = String(i++); n = b.slice(0, 10 - s.length) + s; }
      used.add(n.toUpperCase());
      return n;
    });
  }

  function dbf(cols, rows, types) {
    const names = dbfNames(cols);
    const fields = cols.map((c, j) => {
      if (types[j] === "N") {
        const strs = rows.map((r) => (r[j] == null || r[j] === "" ? "" : String(+r[j])));
        const dec = Math.min(8, Math.max(0, ...strs.map((s) => (s.split(".")[1] || "").length)));
        const len = Math.min(19, Math.max(3, ...strs.map((s) => (+s).toFixed(dec).length)));
        return { name: names[j], type: "N", len, dec };
      }
      return { name: names[j], type: "C", len: Math.min(254, Math.max(1, ...rows.map((r) => latin1(r[j]).length))), dec: 0 };
    });
    const recLen = 1 + fields.reduce((a, f) => a + f.len, 0);
    const headLen = 32 + fields.length * 32 + 1;
    const buf = new ArrayBuffer(headLen + recLen * rows.length + 1), v = new DataView(buf), now = new Date();
    v.setUint8(0, 3); v.setUint8(1, now.getFullYear() - 1900); v.setUint8(2, now.getMonth() + 1); v.setUint8(3, now.getDate());
    v.setUint32(4, rows.length, true); v.setUint16(8, headLen, true); v.setUint16(10, recLen, true);
    fields.forEach((f, i) => {
      const o = 32 + i * 32;
      for (let k = 0; k < f.name.length; k++) v.setUint8(o + k, f.name.charCodeAt(k));
      v.setUint8(o + 11, f.type.charCodeAt(0)); v.setUint8(o + 16, f.len); v.setUint8(o + 17, f.dec);
    });
    v.setUint8(headLen - 1, 0x0d);
    let o = headLen;
    for (const r of rows) {
      v.setUint8(o++, 0x20);
      fields.forEach((f, j) => {
        let s;
        if (f.type === "N") s = r[j] == null || r[j] === "" || !isFinite(+r[j]) ? "" : (+r[j]).toFixed(f.dec);
        else s = latin1(r[j]).slice(0, f.len);
        s = f.type === "N" ? s.padStart(f.len, " ") : s.padEnd(f.len, " ");
        for (let k = 0; k < f.len; k++) v.setUint8(o++, s.charCodeAt(k));
      });
    }
    v.setUint8(o, 0x1a);
    return { buf, names };
  }

  // geoms: titik [lon, lat] (type 1) atau garis [[[lon, lat], ...], ...] berisi beberapa bagian (type 3).
  function shp(type, geoms) {
    const recs = geoms.map((g) => type === 1 ? 20 : 44 + 4 * g.length + 16 * g.reduce((a, p) => a + p.length, 0));
    const shpLen = 100 + recs.reduce((a, l) => a + 8 + l, 0), shxLen = 100 + 8 * geoms.length;
    const sb = new ArrayBuffer(shpLen), xb = new ArrayBuffer(shxLen), s = new DataView(sb), x = new DataView(xb);
    const pts = type === 1 ? geoms : geoms.flat(2);
    let bx = [Infinity, Infinity, -Infinity, -Infinity];
    for (const p of pts) bx = [Math.min(bx[0], p[0]), Math.min(bx[1], p[1]), Math.max(bx[2], p[0]), Math.max(bx[3], p[1])];
    if (!pts.length) bx = [0, 0, 0, 0];
    for (const [v, len] of [[s, shpLen], [x, shxLen]]) {
      v.setInt32(0, 9994); v.setInt32(24, len / 2); v.setInt32(28, 1000, true); v.setInt32(32, type, true);
      bx.forEach((b, i) => v.setFloat64(36 + i * 8, b, true));
    }
    let o = 100;
    geoms.forEach((g, i) => {
      x.setInt32(100 + i * 8, o / 2); x.setInt32(104 + i * 8, recs[i] / 2);
      s.setInt32(o, i + 1); s.setInt32(o + 4, recs[i] / 2); o += 8;
      s.setInt32(o, type, true);
      if (type === 1) { s.setFloat64(o + 4, g[0], true); s.setFloat64(o + 12, g[1], true); o += 20; return; }
      const p = g.flat();
      const b = p.reduce((m, q) => [Math.min(m[0], q[0]), Math.min(m[1], q[1]), Math.max(m[2], q[0]), Math.max(m[3], q[1])], [Infinity, Infinity, -Infinity, -Infinity]);
      b.forEach((v, k) => s.setFloat64(o + 4 + k * 8, v, true));
      s.setInt32(o + 36, g.length, true); s.setInt32(o + 40, p.length, true);
      let start = 0, q = o + 44;
      for (const part of g) { s.setInt32(q, start, true); q += 4; start += part.length; }
      for (const pt of p) { s.setFloat64(q, pt[0], true); s.setFloat64(q + 8, pt[1], true); q += 16; }
      o = q;
    });
    return { shp: sb, shx: xb };
  }

  const WGS84 = 'GEOGCS["GCS_WGS_1984",DATUM["D_WGS_1984",SPHEROID["WGS_1984",6378137.0,298.257223563]],PRIMEM["Greenwich",0.0],UNIT["Degree",0.0174532925199433]]';

  // layers: [{ name, type: 1|3, cols, types: ["C"|"N"...], rows, geoms }]
  async function shpZip(layers, info, filename) {
    const zip = new JSZip();
    const kamus = [["Layer", "Kolom shapefile", "Nama kolom lengkap"]];
    const usedFiles = new Set();
    for (const ly of layers) {
      if (!ly.rows.length) continue;
      let base = latin1(ly.name).normalize("NFD").replace(/[^A-Za-z0-9]+/g, "_").replace(/^_+|_+$/g, "") || "data", f = base, i = 2;
      while (usedFiles.has(f.toLowerCase())) f = base + "_" + i++;
      usedFiles.add(f.toLowerCase());
      const g = shp(ly.type, ly.geoms), d = dbf(ly.cols, ly.rows, ly.types);
      zip.file(f + ".shp", g.shp); zip.file(f + ".shx", g.shx); zip.file(f + ".dbf", d.buf);
      zip.file(f + ".prj", WGS84); zip.file(f + ".cpg", "ISO-8859-1");
      d.names.forEach((n, j) => kamus.push([f, n, ly.cols[j]]));
    }
    const csv = (rows) => "﻿" + rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\r\n");
    zip.file("kamus_kolom.csv", csv(kamus));
    zip.file("keterangan.txt", info.map(([a, b]) => a + ": " + b).join("\r\n"));
    save(await zip.generateAsync({ type: "blob", compression: "DEFLATE" }), filename);
  }

  window.SMART_EXPORT = { xlsx, shpZip };
})();
