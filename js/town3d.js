/* สุขนคร — town3d.js : เมือง 3 มิติแบบ Doom (raycaster) เดินสำรวจได้
   • ตึกสูงต่ำต่างกัน ท้องฟ้า ดวงอาทิตย์ เมฆ แม่น้ำ สะพาน ถนน ทางเท้า ต้นไม้ รถ และผู้คน
   • มองขึ้น/ลงได้ (ลากนิ้ว/เมาส์) ปรับความละเอียดตามขนาดจอ
   • ตัวละคร/รถ/ต้นไม้เป็นพิกเซลอาร์ตที่แปลงมาจากอิโมจิ (ไม่ต้องมีไฟล์ภาพ)
   • เดินชนประตูตึก (หรือกดปุ่ม "เข้า") = เปิดเมนูสถานที่เดิมของเกม ไม่แตะตรรกะเกมเลย
   ส่วนแกนเอนจิน (T.buildCity / T.renderFrame) ไม่พึ่ง DOM จึงทดสอบใน Node ได้ */
(function () {
  var root = typeof window !== 'undefined' ? window : globalThis;
  var SK = (root.SK = root.SK || {});
  var T = (SK.Town = {});
  var HAS_DOM = typeof document !== 'undefined';

  function clamp(v, a, b) { return v < a ? a : v > b ? b : v; }
  function hash2(x, y) {
    var h = (Math.imul(x | 0, 374761393) + Math.imul(y | 0, 668265263)) | 0;
    h = Math.imul(h ^ (h >>> 13), 1274126177);
    return ((h ^ (h >>> 16)) >>> 0) / 4294967296;
  }
  function pack(r, g, b) { return (255 << 24) | ((b & 255) << 16) | ((g & 255) << 8) | (r & 255); }

  // ======================================================================
  //  1) ผังเมือง  48 × 54 ช่อง (1 ช่อง ≈ 3 เมตร)
  //     ถนนใหญ่ 2 แนวนอน + 2 แนวตั้ง, แม่น้ำพาดกลาง มีสะพาน 2 แห่ง
  // ======================================================================
  var MW = 48, MH = 54;
  var HB = [[10, 12], [24, 26]], VB = [[15, 17], [31, 33]];
  var COLS = [[1, 14], [18, 30], [34, 46]], ROWS = [[1, 9], [13, 23], [27, 37], [41, 51]];
  function inBand(v, bands) { for (var i = 0; i < bands.length; i++) if (v >= bands[i][0] && v <= bands[i][1]) return bands[i]; return null; }

  // ข้อมูลสถานที่: h = ความสูง (หน่วย ≈ 3 ม.), st = ลายอาคาร, c = สีผนัง
  var LOCINFO = {
    home: { h: 2.4, st: 0, c: [240, 200, 150] }, housing: { h: 3.4, st: 0, c: [214, 184, 140] },
    market: { h: 2.0, st: 2, c: [255, 196, 110] }, mall: { h: 4.6, st: 2, c: [232, 128, 156] }, cafe: { h: 2.2, st: 2, c: [204, 146, 104] },
    work: { h: 9, st: 1, c: [150, 178, 208] }, jobs: { h: 3, st: 3, c: [196, 206, 152] }, biz: { h: 3, st: 2, c: [250, 172, 104] },
    bank: { h: 5, st: 3, c: [214, 208, 232] },
    hospital: { h: 6, st: 3, c: [246, 249, 251] }, school: { h: 4, st: 3, c: [250, 226, 134] }, library: { h: 3.4, st: 3, c: [192, 162, 132] },
    townhall: { h: 5.2, st: 3, c: [238, 230, 206] }, social: { h: 3, st: 0, c: [184, 222, 204] }, police: { h: 3.6, st: 3, c: [152, 172, 222] },
    park: { park: true }, gym: { h: 3, st: 1, c: [172, 230, 172] }, temple: { h: 4.2, st: 3, c: [250, 216, 122] },
    culture: { h: 4, st: 3, c: [212, 152, 200] }, station: { h: 3.6, st: 1, c: [172, 182, 192] }
  };
  var ZONE_COL = { 'ที่อยู่อาศัย': [233, 168, 90], 'การค้า': [236, 110, 90], 'การงาน': [90, 130, 210], 'การเงิน': [140, 110, 200], 'บริการสาธารณะ': [60, 170, 190], 'สีเขียวและสุขภาพ': [70, 170, 90], 'ชุมชน': [210, 150, 60] };
  // ช่องละ: back = แถวหลัง (ประตูหันขึ้นเหนือ), front = แถวหน้า (ประตูหันลงใต้) • [สถานที่|null, น้ำหนักความกว้าง]
  var LAYOUT = {
    '0,0': { back: [[null, 1], [null, 1], [null, 1]], front: [['home', 1], [null, 1], ['housing', 1]] },
    '1,0': { back: [[null, 1], [null, 1], [null, 1]], front: [['market', 1.4], [null, 1]] },
    '2,0': { back: [[null, 1], [null, 1], [null, 1]], front: [['mall', 1.8], [null, 1]] },
    '0,1': { back: [['work', 1.3], [null, 1], ['biz', 1]], front: [['jobs', 1], [null, 1], [null, 1]] },
    '1,1': { back: [['cafe', 1.2], [null, 1]], front: [[null, 1], [null, 1], [null, 1]] },
    '2,1': { back: [[null, 1], [null, 1], [null, 1]], front: [['bank', 1.4], [null, 1]] },
    '0,2': { back: [['hospital', 1.4], [null, 1], [null, 1]], front: [['school', 1.2], [null, 1], [null, 1]] },
    '1,2': { back: [['library', 1.2], [null, 1]], front: [['townhall', 1.4], [null, 1]] },
    '2,2': { back: [['social', 1.2], [null, 1], [null, 1]], front: [['police', 1.3], [null, 1]] },
    '0,3': { back: [['park', 2.3], ['gym', 1]], front: [['temple', 1.2], [null, 1], [null, 1]] },
    '1,3': { back: [['culture', 1.5], [null, 1]], front: [[null, 1], [null, 1], [null, 1]] },
    '2,3': { back: [[null, 1], [null, 1], [null, 1]], front: [['station', 1.6], [null, 1]] }
  };
  var HR = { '0,0': [1.8, 3.2], '1,0': [2, 4.5], '2,0': [2.4, 5.5], '0,1': [3, 10.5], '1,1': [2.4, 6], '2,1': [3, 8], '0,2': [2.4, 5], '1,2': [2.4, 5], '2,2': [2.4, 4.6], '0,3': [1.8, 3.4], '1,3': [2, 4.2], '2,3': [2, 4.2] };
  var PAL = [[236, 223, 196], [214, 170, 140], [190, 200, 210], [225, 205, 160], [168, 182, 160], [200, 160, 170], [150, 160, 175], [240, 236, 228], [205, 190, 170], [184, 150, 120]];
  var ACC = [[200, 70, 60], [50, 150, 150], [235, 190, 60], [80, 150, 80], [60, 80, 150], [230, 130, 50]];

  var CITY = null, EDGEB = [];
  for (var ei = 0; ei < 8; ei++) {
    var ec = PAL[(ei * 3 + 1) % PAL.length];
    EDGEB.push({ edge: true, h: 6 + ei * 1.3, c: [ec[0] * 0.78, ec[1] * 0.8, ec[2] * 0.86], acc: ACC[ei % ACC.length], st: ei % 3 === 0 ? 3 : 1, door: null });
  }
  T.buildCity = function () {
    var tile = new Uint8Array(MW * MH), bmap = new Int16Array(MW * MH);
    var blds = [{ edge: true, h: 9, c: [118, 124, 138], acc: [90, 95, 110], st: 1, door: null }];
    var locs = {}, trees = [], doorLoc = {}, x, y;
    for (y = 0; y < MH; y++) for (x = 0; x < MW; x++) {
      var t = 0;
      if (y >= 38 && y <= 40) t = inBand(x, VB) ? 4 : 3;
      tile[y * MW + x] = t;
      if (x === 0 || x === MW - 1 || y === 0 || y >= 52) bmap[y * MW + x] = 1;
    }
    function place(loc, bx, by, w, d, face, ci, ri) {
      var info = loc ? LOCINFO[loc] : null, xx, yy;
      if (info && info.park) {
        for (yy = by; yy < by + d; yy++) for (xx = bx; xx < bx + w; xx++) tile[yy * MW + xx] = 2;
        var fx = bx + (w >> 1), fy = by + (d >> 1);
        locs[loc] = { id: loc, front: { x: fx, y: fy }, park: true, rect: [bx, by, w, d] };
        for (var k = 0; k < 16; k++) {
          var tx = bx + 0.5 + hash2(k, bx) * (w - 1), ty = by + 0.5 + hash2(k + 50, by) * (d - 1);
          if (Math.abs(tx - fx - 0.5) < 1.1 && Math.abs(ty - fy - 0.5) < 1.1) continue;
          trees.push({ x: tx, y: ty, r: 0.2, k: k % 3 });
        }
        return;
      }
      var sd = bx * 31 + by * 17 + ci * 5 + ri * 3, hr = HR[ci + ',' + ri], rr = hash2(sd, 7);
      var h = info ? info.h : hr[0] + (hr[1] - hr[0]) * Math.pow(rr, 1.6);
      var st = info ? info.st : (h >= 6 ? 1 : [0, 0, 2, 3][Math.floor(hash2(sd, 11) * 4)]);
      var b = { x: bx, y: by, w: w, d: d, h: h, st: st, c: info ? info.c : PAL[Math.floor(hash2(sd, 3) * PAL.length)], acc: ACC[Math.floor(hash2(sd, 5) * ACC.length)], loc: loc || null };
      blds.push(b);
      var id = blds.length;
      for (yy = by; yy < by + d; yy++) for (xx = bx; xx < bx + w; xx++) bmap[yy * MW + xx] = id;
      var dx = bx + (w >> 1), dy = face === 'S' ? by + d - 1 : by;
      b.door = { x: dx, y: dy, face: face };
      b.front = { x: dx, y: face === 'S' ? dy + 1 : dy - 1 };
      if (loc) { locs[loc] = { id: loc, b: b, front: b.front, door: b.door }; doorLoc[dy * MW + dx] = loc; }
    }
    function row(items, rx0, rx1, ry0, ry1, face, ci, ri) {
      var n = items.length, avail = (rx1 - rx0 + 1) - (n - 1), sw = 0, i, cx = rx0;
      for (i = 0; i < n; i++) sw += items[i][1];
      for (i = 0; i < n; i++) {
        var w = i === n - 1 ? rx1 - cx + 1 : Math.max(3, Math.round(avail * items[i][1] / sw));
        place(items[i][0], cx, ry0, w, ry1 - ry0 + 1, face, ci, ri);
        cx += w + 1;
      }
    }
    COLS.forEach(function (cc, ci) {
      ROWS.forEach(function (rr, ri) {
        var x0 = cc[0], x1 = cc[1], y0 = rr[0], y1 = rr[1], xx, yy;
        for (yy = y0; yy <= y1; yy++) for (xx = x0; xx <= x1; xx++) tile[yy * MW + xx] = (xx === x0 || xx === x1 || yy === y0 || yy === y1) ? 1 : 5;
        var D = y1 - y0 - 1, db = (D - 1) >> 1, df = D - 1 - db, sp = LAYOUT[ci + ',' + ri];
        row(sp.back, x0 + 1, x1 - 1, y0 + 1, y0 + db, 'N', ci, ri);
        row(sp.front, x0 + 1, x1 - 1, y1 - df, y1 - 1, 'S', ci, ri);
      });
    });
    // ต้นไม้ริมทางเท้า (ไม่วางหน้าประตู)
    var fronts = Object.keys(locs).map(function (k) { return locs[k].front; });
    blds.forEach(function (b) { if (b.front) fronts.push(b.front); });
    function tryTree(px, py, q) {
      if (hash2(px * 3 + q, py * 7) > 0.7) return;
      for (var f = 0; f < fronts.length; f++) if (Math.abs(fronts[f].x - px) <= 1 && Math.abs(fronts[f].y - py) <= 1) return;
      if (tile[py * MW + px] !== 1) return;
      trees.push({ x: px + 0.5, y: py + 0.5, r: 0.2, k: (px + py) % 3 });
    }
    COLS.forEach(function (cc) {
      ROWS.forEach(function (rr) {
        var i;
        for (i = cc[0] + 2; i < cc[1] - 1; i += 4) { tryTree(i, rr[0], 0); tryTree(i, rr[1], 1); }
        for (i = rr[0] + 2; i < rr[1] - 1; i += 4) { tryTree(cc[0], i, 2); tryTree(cc[1], i, 3); }
      });
    });
    var isH = new Int8Array(MH), isV = new Int8Array(MW), hs = new Float32Array(MH), vs = new Float32Array(MW), hc = new Float32Array(MH), vc = new Float32Array(MW);
    for (y = 0; y < MH; y++) { var hb = inBand(y, HB); if (hb) { isH[y] = 1; hs[y] = hb[0]; hc[y] = (hb[0] + hb[1] + 1) / 2; } }
    for (x = 0; x < MW; x++) { var vb = inBand(x, VB); if (vb) { isV[x] = 1; vs[x] = vb[0]; vc[x] = (vb[0] + vb[1] + 1) / 2; } }
    CITY = { tile: tile, bmap: bmap, blds: blds, locs: locs, trees: trees, doorLoc: doorLoc, isH: isH, isV: isV, hs: hs, vs: vs, hc: hc, vc: vc };
    // ดัชนีต้นไม้ต่อช่อง (ไว้ชนแบบวงกลม)
    CITY.treeAt = {};
    trees.forEach(function (t2) { var k = (t2.y | 0) * MW + (t2.x | 0); (CITY.treeAt[k] = CITY.treeAt[k] || []).push(t2); });
    return CITY;
  };
  T.MW = MW; T.MH = MH;

  T.solid = function (x, y) {
    var ix = Math.floor(x), iy = Math.floor(y);
    if (ix < 0 || iy < 0 || ix >= MW || iy >= MH) return true;
    var i = iy * MW + ix;
    return CITY.bmap[i] > 0 || CITY.tile[i] === 3;
  };

  // ======================================================================
  //  2) บรรยากาศตามช่วงเวลา/อากาศ
  // ======================================================================
  var SKY = [
    { top: [110, 170, 235], hor: [255, 228, 196], fog: [238, 224, 208], amb: [0.94, 0.97, 1.0], sunAz: 0.0, sunEl: 0.38, sun: [255, 236, 190], lit: false },
    { top: [58, 148, 236], hor: [198, 230, 255], fog: [214, 232, 246], amb: [1, 1, 1], sunAz: -1.2, sunEl: 1.05, sun: [255, 252, 226], lit: false },
    { top: [84, 72, 150], hor: [252, 164, 112], fog: [220, 150, 126], amb: [1.0, 0.84, 0.74], sunAz: 3.14159, sunEl: 0.1, sun: [255, 200, 130], lit: true }
  ];
  function mix3(a, b, t) { return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t]; }
  T.envFor = function (slot, wk, bike) {
    var b = SKY[clamp(slot | 0, 0, 2)];
    var e = { top: b.top, hor: b.hor, fog: b.fog, amb: b.amb.slice(), sunAz: b.sunAz, sunEl: b.sunEl, sun: b.sun, lit: b.lit, cloudThr: 0.6, sunOn: true, rain: false, fogStart: 14, fogEnd: 38, bike: !!bike };
    var gray = [150, 156, 166];
    if (wk === 'rain' || wk === 'storm') {
      e.top = mix3(b.top, [96, 104, 118], 0.78); e.hor = mix3(b.hor, gray, 0.75); e.fog = mix3(b.fog, gray, 0.7);
      e.amb = [e.amb[0] * 0.8, e.amb[1] * 0.82, e.amb[2] * 0.86]; e.cloudThr = -1; e.sunOn = false; e.rain = true; e.fogStart = 8; e.fogEnd = 28; e.lit = e.lit || wk === 'storm';
    } else if (wk === 'cloud') {
      e.top = mix3(b.top, gray, 0.4); e.hor = mix3(b.hor, gray, 0.3); e.cloudThr = 0.3; e.sunOn = false; e.amb = [e.amb[0] * 0.94, e.amb[1] * 0.95, e.amb[2] * 0.97];
    } else if (wk === 'haze') {
      e.top = mix3(b.top, [190, 176, 150], 0.55); e.hor = mix3(b.hor, [214, 200, 174], 0.7); e.fog = mix3(b.fog, [208, 194, 168], 0.8); e.fogStart = 5; e.fogEnd = 22; e.cloudThr = 0.5; e.sunOn = false;
    } else if (wk === 'hot') {
      e.amb = [e.amb[0], e.amb[1] * 0.98, e.amb[2] * 0.9]; e.cloudThr = 0.75;
    } else if (wk === 'cool') e.cloudThr = 0.5;
    return e;
  };

  // เมฆ: เท็กซ์เจอร์ค่าสุ่มแบบเรียบ (วนรอบทิศ)
  var CLW = 256, CLH = 48, CLOUD = (function () {
    var g = new Float32Array(16 * 8), i, out = new Uint8Array(CLW * CLH);
    for (i = 0; i < g.length; i++) g[i] = hash2(i, 77);
    function vn(u, v) {
      var iu = Math.floor(u), iv = Math.floor(v), fu = u - iu, fv = v - iv;
      fu = fu * fu * (3 - 2 * fu); fv = fv * fv * (3 - 2 * fv);
      function gg(a, b) { return g[(((b % 8) + 8) % 8) * 16 + (((a % 16) + 16) % 16)]; }
      var a = gg(iu, iv) + (gg(iu + 1, iv) - gg(iu, iv)) * fu, c = gg(iu, iv + 1) + (gg(iu + 1, iv + 1) - gg(iu, iv + 1)) * fu;
      return a + (c - a) * fv;
    }
    for (var yy = 0; yy < CLH; yy++) for (var xx = 0; xx < CLW; xx++) {
      var n = vn(xx / CLW * 16, yy / CLH * 3.2) * 0.62 + vn(xx / CLW * 32, yy / CLH * 6.4) * 0.38;
      out[yy * CLW + xx] = clamp(n * 255, 0, 255);
    }
    return out;
  })();

  // ======================================================================
  //  3) เรนเดอร์
  // ======================================================================
  var cr = 0, cg = 0, cb = 0, TIME = 0, ENV = null;
  function floorPix(fx, fy) {
    var ix = Math.floor(fx), iy = Math.floor(fy);
    if (ix < 0 || iy < 0 || ix >= MW || iy >= MH) { cr = 70; cg = 72; cb = 78; return; }
    var tl = CITY.tile[iy * MW + ix], ux = fx - ix, uy = fy - iy, n;
    if (tl === 1) {
      if (ux < 0.07 || uy < 0.07) { cr = 148; cg = 146; cb = 140; } else { n = ((ix + iy) & 1) ? 8 : 0; cr = 198 - n; cg = 194 - n; cb = 186 - n; }
    } else if (tl === 2) {
      n = hash2((fx * 5) | 0, (fy * 5) | 0); cr = (80 + n * 26) | 0; cg = (150 + n * 30) | 0; cb = (74 + n * 18) | 0;
      if (n > 0.93) { cr = 230; cg = 200; cb = 90; }
    } else if (tl === 3) {
      n = Math.sin(fx * 3.1 + TIME * 1.4) * Math.sin(fy * 2.3 - TIME * 1.1);
      cr = (62 + n * 14) | 0; cg = (136 + n * 16) | 0; cb = (198 + n * 10) | 0;
      if (n > 0.86) { cr = 150; cg = 205; cb = 240; }
    } else if (tl === 5) {
      n = hash2((fx * 6) | 0, (fy * 6) | 0) * 14; cr = (164 + n) | 0; cg = (156 + n) | 0; cb = (146 + n) | 0;
    } else {
      n = hash2((fx * 7) | 0, (fy * 7) | 0) * 8; cr = (64 + n) | 0; cg = (66 + n) | 0; cb = (72 + n) | 0;
      var hr = CITY.isH[iy], vr = CITY.isV[ix];
      if (hr && !vr) {
        if (Math.abs(fy - CITY.hc[iy]) < 0.05 && ((fx * 1.6) % 1) < 0.55) { cr = 232; cg = 206; cb = 90; }
        else if (ENV.bike && (fy - CITY.hs[iy] < 0.4 || fy - CITY.hs[iy] > 2.6)) { cr = 70; cg = 160; cb = 110; }
      } else if (vr && !hr) {
        if (Math.abs(fx - CITY.vc[ix]) < 0.05 && ((fy * 1.6) % 1) < 0.55) { cr = 232; cg = 206; cb = 90; }
        else if (ENV.bike && (fx - CITY.vs[ix] < 0.4 || fx - CITY.vs[ix] > 2.6)) { cr = 70; cg = 160; cb = 110; }
        if (tl === 4 && (fx - CITY.vs[ix] < 0.12 || fx - CITY.vs[ix] > 2.88)) { cr = 120; cg = 98; cb = 76; }
      } else if (hr && vr) {
        // ทางม้าลายที่ปากสี่แยก
        var lx = ix - CITY.vs[ix], ly = iy - CITY.hs[iy];
        if (((ux * 7) | 0) % 2 === 0 && ((ly === 0 && uy < 0.16) || (ly === 2 && uy > 0.84))) { cr = 205; cg = 205; cb = 200; }
        else if (((uy * 7) | 0) % 2 === 0 && ((lx === 0 && ux < 0.16) || (lx === 2 && ux > 0.84))) { cr = 205; cg = 205; cb = 200; }
      }
    }
  }
  var WSH = [0.74, 0.9, 0.84, 0.97];  // W E N S
  function glass(hsh, vf) {
    if (ENV.lit && hsh < 0.58) { cr = 255; cg = (200 + hsh * 60) | 0; cb = 104; }
    else if (!ENV.lit && hsh > 0.84) { cr = 226; cg = 208; cb = 182; }
    else { var g = 0.8 + vf * 0.35; cr = (ENV.top[0] * 0.35 + 96) * g; cg = (ENV.top[1] * 0.3 + 120) * g; cb = (ENV.top[2] * 0.25 + 150) * g; }
  }
  function wallBase(b, mx, my, isDoor, u, v) {
    var c = b.c; cr = c[0]; cg = c[1]; cb = c[2];
    var fl = Math.floor(v), vf = v - fl, st = b.st, hsh;
    if (v < 0.13) { cr *= 0.7; cg *= 0.7; cb *= 0.7; return; }
    if (b.h - v < 0.09) { cr *= 0.72; cg *= 0.72; cb *= 0.74; return; }
    if (isDoor) {
      if (v < 0.74 && u > 0.27 && u < 0.73) {
        if (u > 0.31 && u < 0.69 && v > 0.04 && v < 0.7) { if (ENV.lit) { cr = 255; cg = 214; cb = 130; } else { cr = 112; cg = 78; cb = 52; if (u > 0.47 && u < 0.53) { cr = 80; cg = 54; cb = 36; } } }
        else { cr = 240; cg = 238; cb = 232; }
        return;
      }
      if (v >= 0.78 && v < 0.95 && u > 0.18 && u < 0.82) { var a = b.acc; if (((u * 9) | 0) & 1) { cr = a[0]; cg = a[1]; cb = a[2]; } else { cr = 244; cg = 240; cb = 232; } return; }
    }
    if (st === 2 && v < 1) {
      if (v >= 0.78) { var a2 = b.acc; if (((u * 6) | 0) & 1) { cr = a2[0]; cg = a2[1]; cb = a2[2]; } else { cr = 244; cg = 240; cb = 232; } }
      else if (u > 0.06 && u < 0.94 && v > 0.14) glass(hash2(mx * 13, my * 7 + ((u * 3) | 0)), vf);
      return;
    }
    hsh = hash2(mx * 13 + fl * 5, my * 7 + (u > 0.5 ? 1 : 0));
    if (st === 1) {
      if (vf > 0.2 && vf < 0.84 && u > 0.04 && u < 0.96) {
        if (u > 0.47 && u < 0.53) { cr = 236; cg = 238; cb = 240; } else glass(hash2(mx * 11 + fl * 3, my * 5 + ((u * 2) | 0)), vf);
      } else if (vf <= 0.2) { cr *= 0.86; cg *= 0.86; cb *= 0.88; }
      return;
    }
    if (st === 3) {
      if (u < 0.1 || u > 0.9) { cr = Math.min(255, cr * 1.07); cg = Math.min(255, cg * 1.07); cb = Math.min(255, cb * 1.07); return; }
      if (u > 0.22 && u < 0.78 && vf > 0.22 && vf < 0.84) {
        if (u < 0.26 || u > 0.74 || vf < 0.26 || vf > 0.8) { cr = 246; cg = 244; cb = 238; } else glass(hash2(mx * 9 + fl, my * 3), vf);
      } else if (vf < 0.06) { cr *= 0.88; cg *= 0.88; cb *= 0.9; }
      return;
    }
    var wu = (u * 2) % 1;
    if (wu > 0.2 && wu < 0.8 && vf > 0.26 && vf < 0.84) {
      if (wu < 0.26 || wu > 0.74 || vf < 0.3 || vf > 0.8) { cr = 246; cg = 244; cb = 238; } else glass(hsh, vf);
    }
  }

  var W = 0, H = 0, RDX = null, RDY = null, COLAZ = null, POOL = [];
  T.renderFrame = function (buf, depth, w, h, cam, env, sprites, time) {
    ENV = env; TIME = time || 0;
    var eye = cam.eye, th = Math.tan(cam.hfov / 2), f = (w / 2) / th;
    if (W !== w) { W = w; RDX = new Float32Array(w); RDY = new Float32Array(w); COLAZ = new Float32Array(w); }
    H = h;
    var dirX = Math.cos(cam.ang), dirY = Math.sin(cam.ang), plX = -dirY * th, plY = dirX * th;
    var hz = Math.round(h / 2 + Math.tan(cam.pitch) * f);
    var x, y, i, camX;
    for (x = 0; x < w; x++) {
      camX = 2 * x / w - 1 + 1 / w; RDX[x] = dirX + plX * camX; RDY[x] = dirY + plY * camX;
      COLAZ[x] = cam.ang + Math.atan((x + 0.5 - w / 2) / f);
    }
    depth.fill(1e9);
    var fogP = pack(env.fog[0], env.fog[1], env.fog[2]), fR = env.fog[0], fG = env.fog[1], fB = env.fog[2];
    var aR = env.amb[0], aG = env.amb[1], aB = env.amb[2], fs = env.fogStart, fe = env.fogEnd, fr = 1 / (fe - fs);
    // ---- ท้องฟ้า ----
    var skyEnd = Math.min(h, Math.max(0, hz));
    var top = env.top, hor = env.hor, cthr = env.cloudThr;
    var sunPx = -1, sunPy = 0, sunR = 0;
    if (env.sunOn) {
      var dAz = env.sunAz - cam.ang; dAz = Math.atan2(Math.sin(dAz), Math.cos(dAz));
      if (Math.abs(dAz) < 1.3) { sunPx = w / 2 + Math.tan(dAz) * f; sunPy = hz - Math.tan(env.sunEl) / Math.cos(dAz) * f; sunR = f * 0.055; }
    }
    for (y = 0; y < skyEnd; y++) {
      var gt = clamp((hz - y) / (f * 1.25), 0, 1);
      gt = Math.round(Math.pow(gt, 0.7) * 9) / 9;
      var sr = hor[0] + (top[0] - hor[0]) * gt, sg = hor[1] + (top[1] - hor[1]) * gt, sb = hor[2] + (top[2] - hor[2]) * gt;
      var el = Math.atan2(hz - y, f), cy = Math.floor((el - 0.05) / 0.95 * CLH);
      var doCloud = cy >= 0 && cy < CLH;
      for (x = 0; x < w; x++) {
        var r = sr, g = sg, b = sb;
        if (doCloud) {
          var az = COLAZ[x] / 6.2831853; az -= Math.floor(az);
          var cv = CLOUD[cy * CLW + ((az * CLW) | 0)] / 255;
          var k = (cv - 0.5 - (cthr > 0 ? (cthr - 0.5) : -0.5)) * 6;
          if (cthr < 0) k = 0.55 + (cv - 0.5) * 0.6;
          k = clamp(k, 0, 1);
          if (k > 0) { k = Math.round(k * 4) / 4; var sh = 238 - (cthr < 0 ? 70 : 0) - (1 - cy / CLH) * 10; r += (sh * aR - r) * k * 0.85; g += (sh * aG - g) * k * 0.85; b += (sh * aB - b) * k * 0.85; }
        }
        if (sunPx >= 0) {
          var ddx = x - sunPx, ddy = y - sunPy, dd = Math.sqrt(ddx * ddx + ddy * ddy);
          if (dd < sunR) { r = env.sun[0]; g = env.sun[1]; b = env.sun[2]; }
          else if (dd < sunR * 2.6) { var gl = (1 - (dd - sunR) / (sunR * 1.6)) * 0.45; r += (env.sun[0] - r) * gl; g += (env.sun[1] - g) * gl; b += (env.sun[2] - b) * gl; }
        }
        buf[y * w + x] = pack(r, g, b);
      }
    }
    // ---- พื้น ----
    var maxD = 40;
    for (y = Math.max(0, hz); y < h; y++) {
      var dy = y - hz + 0.5, rd = eye * f / dy, ft = clamp((rd - fs) * fr, 0, 1), row = y * w;
      if (rd > maxD) { for (x = 0; x < w; x++) { buf[row + x] = fogP; depth[row + x] = rd; } continue; }
      for (x = 0; x < w; x++) {
        floorPix(cam.x + RDX[x] * rd, cam.y + RDY[x] * rd);
        var rr = cr * aR, gg2 = cg * aG, bb = cb * aB;
        rr += (fR - rr) * ft; gg2 += (fG - gg2) * ft; bb += (fB - bb) * ft;
        buf[row + x] = pack(rr, gg2, bb); depth[row + x] = rd;
      }
    }
    // ---- ผนังอาคาร (หน้าไปหลัง) ----
    var BM = CITY.bmap, BL = CITY.blds, cx = cam.x, cyy = cam.y;
    for (x = 0; x < w; x++) {
      var rdx = RDX[x], rdy = RDY[x];
      var mapX = Math.floor(cx), mapY = Math.floor(cyy);
      var ddX = rdx === 0 ? 1e30 : Math.abs(1 / rdx), ddY = rdy === 0 ? 1e30 : Math.abs(1 / rdy);
      var stepX, stepY, sdx, sdy;
      if (rdx < 0) { stepX = -1; sdx = (cx - mapX) * ddX; } else { stepX = 1; sdx = (mapX + 1 - cx) * ddX; }
      if (rdy < 0) { stepY = -1; sdy = (cyy - mapY) * ddY; } else { stepY = 1; sdy = (mapY + 1 - cyy) * ddY; }
      var inside = 0, occ = h, side = 0, steps = 0;
      while (steps++ < 100 && occ > 0) {
        if (sdx < sdy) { sdx += ddX; mapX += stepX; side = 0; } else { sdy += ddY; mapY += stepY; side = 1; }
        if (mapX < 0 || mapY < 0 || mapX >= MW || mapY >= MH) break;
        var bi = BM[mapY * MW + mapX];
        if (bi === 0) { inside = 0; continue; }
        if (bi === inside) continue;
        inside = bi;
        var perp = side === 0 ? sdx - ddX : sdy - ddY;
        if (perp > maxD) break;
        if (perp < 0.04) perp = 0.04;
        var bd = BL[bi - 1], face, u;
        if (bd.edge) bd = EDGEB[(hash2(mapX * 3, mapY * 5) * 8) | 0];
        if (side === 0) { face = stepX > 0 ? 0 : 1; u = cyy + perp * rdy; } else { face = stepY > 0 ? 2 : 3; u = cx + perp * rdx; }
        u -= Math.floor(u);
        var sTop = hz - (bd.h - eye) * f / perp, sBot = hz + eye * f / perp;
        var y0 = Math.max(0, Math.ceil(sTop)), y1 = Math.min(occ, Math.floor(sBot));
        if (y1 > y0) {
          var isDoor = !!(bd.door && bd.door.x === mapX && bd.door.y === mapY && ((bd.door.face === 'S' && face === 3) || (bd.door.face === 'N' && face === 2)));
          var shd = WSH[face], ft2 = clamp((perp - fs) * fr, 0, 1), dv = perp / f, vv = eye + (hz - y0 - 0.5) * dv;
          var mr = aR * shd, mg = aG * shd, mb = aB * shd;
          for (y = y0; y < y1; y++, vv -= dv) {
            wallBase(bd, mapX, mapY, isDoor, u, vv);
            var wr = cr * mr, wg = cg * mg, wb = cb * mb;
            wr += (fR - wr) * ft2; wg += (fG - wg) * ft2; wb += (fB - wb) * ft2;
            var pi = y * w + x; buf[pi] = pack(wr, wg, wb); depth[pi] = perp;
          }
        }
        if (y0 < occ) occ = y0;
      }
    }
    // ---- สไปรต์ (ไกล → ใกล้) ----
    var inv = 1 / (plX * dirY - dirX * plY), n = 0, si;
    for (si = 0; si < sprites.length; si++) {
      var sp = sprites[si], dx = sp.x - cx, dyy = sp.y - cyy;
      var tx = inv * (dirY * dx - dirX * dyy), ty = inv * (-plY * dx + plX * dyy);
      if (ty < 0.25 || ty > maxD) continue;
      var sxm = (w / 2) * (1 + tx / ty), shh = f * sp.h / ty, sww = shh * (sp.asp || 1);
      if (sxm + sww / 2 < 0 || sxm - sww / 2 > w) continue;
      var slot = POOL[n]; if (!slot) slot = POOL[n] = { sp: null, ty: 0, sx: 0, sh: 0, sw: 0 };
      slot.sp = sp; slot.ty = ty; slot.sx = sxm; slot.sh = shh; slot.sw = sww; n++;
    }
    for (var qa = 1; qa < n; qa++) { var qk = POOL[qa], qj = qa - 1; while (qj >= 0 && POOL[qj].ty < qk.ty) { POOL[qj + 1] = POOL[qj]; qj--; } POOL[qj + 1] = qk; }
    for (si = 0; si < n; si++) {
      var it = POOL[si], s2 = it.sp, tex = s2.tex, bot = hz + (eye - (s2.z || 0)) * f / it.ty, topY = bot - it.sh, left = it.sx - it.sw / 2;
      var xa = Math.max(0, Math.floor(left)), xb = Math.min(w, Math.ceil(left + it.sw)), ya = Math.max(0, Math.floor(topY)), yb = Math.min(h, Math.ceil(bot));
      var ft3 = clamp((it.ty - fs) * fr, 0, 1), bob = s2.emit ? 1 : 0;
      var tw = tex.w, th2 = tex.h, px = tex.px;
      for (y = ya; y < yb; y++) {
        var ty2 = Math.floor((y - topY) / it.sh * th2); if (ty2 < 0 || ty2 >= th2) continue;
        for (x = xa; x < xb; x++) {
          var tx2 = Math.floor((x - left) / it.sw * tw); if (tx2 < 0 || tx2 >= tw) continue;
          var c = px[ty2 * tw + tx2];
          if ((c >>> 24) < 128) continue;
          var pi2 = y * w + x;
          if (depth[pi2] <= it.ty) continue;
          var qr = c & 255, qg = (c >> 8) & 255, qb = (c >> 16) & 255;
          if (!bob) { qr *= aR; qg *= aG; qb *= aB; }
          qr += (fR - qr) * ft3; qg += (fG - qg) * ft3; qb += (fB - qb) * ft3;
          buf[pi2] = pack(qr, qg, qb);
        }
      }
    }
    // ---- ฝน ----
    if (env.rain) {
      var nd = Math.floor(w * h * 0.0035);
      for (i = 0; i < nd; i++) {
        var rx = (Math.random() * w) | 0, ry = (Math.random() * (h - 4)) | 0;
        for (var q = 0; q < 3; q++) buf[(ry + q) * w + rx] = pack(196, 210, 230);
      }
    }
  };
  T.hash2 = hash2;
  T.pack = pack;

  // ======================================================================
  //  4) สไปรต์พิกเซลอาร์ตจากอิโมจิ
  // ======================================================================
  var SPR = {};
  function placeholderSprite(key, size) {
    var n = 0, i; for (i = 0; i < key.length; i++) n = (n * 31 + key.charCodeAt(i)) | 0;
    var col = pack(80 + (Math.abs(n) % 150), 90 + (Math.abs(n >> 3) % 140), 80 + (Math.abs(n >> 6) % 150)), px = new Uint32Array(size * size), cx = size / 2;
    for (var y = 0; y < size; y++) for (var x = 0; x < size; x++) { var dx = (x - cx + 0.5) / cx, dy = (y - cx * 0.9) / (cx * 0.9); if (dx * dx + dy * dy < 0.8) px[y * size + x] = col; }
    return { w: size, h: size, px: px };
  }
  function toPixelArt(ctx, size, outline) {
    var d = ctx.getImageData(0, 0, size, size).data, px = new Uint32Array(size * size), i, x, y;
    for (i = 0; i < size * size; i++) {
      var a = d[i * 4 + 3];
      if (a < 110) continue;
      var r = Math.round(d[i * 4] / 51) * 51, g = Math.round(d[i * 4 + 1] / 51) * 51, b = Math.round(d[i * 4 + 2] / 51) * 51;
      px[i] = pack(r, g, b);
    }
    if (outline) {
      var out = new Uint32Array(px);
      for (y = 0; y < size; y++) for (x = 0; x < size; x++) {
        if (px[y * size + x]) continue;
        if ((x > 0 && px[y * size + x - 1]) || (x < size - 1 && px[y * size + x + 1]) || (y > 0 && px[(y - 1) * size + x]) || (y < size - 1 && px[(y + 1) * size + x])) out[y * size + x] = pack(34, 28, 46);
      }
      px = out;
    }
    return { w: size, h: size, px: px };
  }
  T.emojiSprite = function (ch, size) {
    size = size || 24;
    var key = ch + '|' + size;
    if (SPR[key]) return SPR[key];
    var s;
    if (!HAS_DOM) s = placeholderSprite(key, size);
    else {
      try {
        var c = document.createElement('canvas'); c.width = c.height = size;
        var ctx = c.getContext('2d', { willReadFrequently: true });
        ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.font = Math.floor(size * 0.8) + 'px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
        ctx.fillText(ch, size / 2, size / 2 + size * 0.06);
        s = toPixelArt(ctx, size, true);
      } catch (e) { s = placeholderSprite(key, size); }
    }
    return (SPR[key] = s);
  };
  // ป้ายหน้าตึก: กรอบสี + อิโมจิสถานที่ + จำนวนคนข้างใน
  T.signSprite = function (icon, zoneCol, count, closed) {
    var key = 'sign|' + icon + '|' + (zoneCol || []).join(',') + '|' + count + '|' + (closed ? 1 : 0);
    if (SPR[key]) return SPR[key];
    var size = 26, s;
    if (!HAS_DOM) { s = placeholderSprite(key, size); }
    else {
      var c = document.createElement('canvas'); c.width = c.height = size;
      var ctx = c.getContext('2d', { willReadFrequently: true });
      var col = closed ? [120, 120, 126] : (zoneCol || [90, 130, 210]);
      ctx.fillStyle = 'rgb(' + col.join(',') + ')'; ctx.fillRect(1, 3, size - 2, size - 8);
      ctx.fillStyle = closed ? '#cfd2d8' : '#fffdf6'; ctx.fillRect(3, 5, size - 6, size - 12);
      ctx.fillStyle = 'rgb(' + col.join(',') + ')'; ctx.fillRect(size / 2 - 1, size - 5, 2, 5);
      ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = '13px "Apple Color Emoji","Segoe UI Emoji","Noto Color Emoji",sans-serif';
      ctx.globalAlpha = closed ? 0.5 : 1; ctx.fillText(icon, size / 2, 10.5); ctx.globalAlpha = 1;
      if (count > 0) {
        ctx.fillStyle = '#ff7a1a'; ctx.beginPath(); ctx.arc(size - 6, 5, 5, 0, 6.3); ctx.fill();
        ctx.fillStyle = '#fff'; ctx.font = 'bold 8px sans-serif'; ctx.fillText(String(Math.min(count, 9)), size - 6, 5.5);
      }
      s = toPixelArt(ctx, size, true);
    }
    return (SPR[key] = s);
  };
  var TREES = ['🌳', '🌲', '🌴'], PEDS = ['🧑', '👩', '👨', '👴', '👵', '👧', '👦', '🚶', '🏃', '🚴'], CARS = ['🚗', '🚕', '🚌', '🚙', '🛵'];

  // ======================================================================
  //  5) โลกที่เคลื่อนไหว (คนเดิน รถ) + สถานะผู้เล่น
  // ======================================================================
  var cam = { x: 8.5, y: 11.5, ang: 0, pitch: 0, eye: 0.55, hfov: 1.2 };
  var peds = [], cars = [], npcSprites = [], signSprites = [], staticSprites = [], envKey = '', env = null;
  T.cam = cam;
  function rng(n) { return Math.random() * n; }

  T.initWorld = function (npcPed) {
    peds = []; cars = []; sprDirty = true;
    var n = npcPed || 18, tries = 0;
    while (peds.length < n && tries++ < 400) {
      var x = 1 + rng(MW - 2), y = 1 + rng(MH - 2);
      if (T.solid(x, y)) continue;
      var pt = T.emojiSprite(PEDS[(rng(PEDS.length)) | 0], 24);
      peds.push({ x: x, y: y, a: rng(6.28), sp: 0.5 + rng(0.7), t: rng(3), tex: pt, spr: { x: x, y: y, z: 0, h: 0.62, asp: 1, tex: pt } });
    }
    // รถบนถนน: 2 เลนต่อถนน
    function addCar(ax, b, k, len) {
      var ct = T.emojiSprite(CARS[(rng(CARS.length)) | 0], 24), c = { dir: k % 2 ? 1 : -1, ax: ax, lane: k % 2 ? b[0] + 0.55 : b[1] + 0.45, p: 1 + rng(len - 2), sp: 2 + rng(2), tex: ct, spr: { x: 0, y: 0, z: 0, h: 0.62, asp: 1.2, tex: ct } };
      cars.push(c); placeCar(c);
    }
    HB.forEach(function (b) { for (var k = 0; k < 3; k++) addCar('x', b, k, MW); });
    VB.forEach(function (b) { for (var k = 0; k < 4; k++) addCar('y', b, k, MH); });
  };
  function placeCar(c) { if (c.ax === 'x') { c.spr.x = c.p; c.spr.y = c.lane; } else { c.spr.x = c.lane; c.spr.y = c.p; } }
  function stepWorld(dt) {
    var i, p;
    for (i = 0; i < peds.length; i++) {
      p = peds[i]; p.t -= dt;
      var nx = p.x + Math.cos(p.a) * p.sp * dt, ny = p.y + Math.sin(p.a) * p.sp * dt;
      if (p.t < 0 || T.solid(nx, ny)) { p.a += (Math.random() - 0.5) * 3.2 + (T.solid(nx, ny) ? 2.4 : 0); p.t = 1.5 + rng(4); }
      else { p.x = nx; p.y = ny; p.spr.x = nx; p.spr.y = ny; }
    }
    for (i = 0; i < cars.length; i++) {
      p = cars[i]; p.p += p.dir * p.sp * dt;
      var lim = p.ax === 'x' ? MW - 1 : MH - 2;
      if (p.p > lim) p.p = 1; else if (p.p < 1) p.p = lim;
      placeCar(p);
    }
  }
  var allSprites = [], sprDirty = true;
  function worldSprites() {
    if (sprDirty) {
      var i; allSprites = staticSprites.concat(npcSprites, signSprites);
      for (i = 0; i < peds.length; i++) allSprites.push(peds[i].spr);
      for (i = 0; i < cars.length; i++) allSprites.push(cars[i].spr);
      sprDirty = false;
    }
    return allSprites;
  }

  // ย้ายผู้เล่นแบบเลื่อนไถลตามกำแพง + ชนต้นไม้
  function tryMove(nx, ny) {
    var r = 0.22, hitDoor = null;
    function blocked(x, y) {
      var cs = [[x - r, y - r], [x + r, y - r], [x - r, y + r], [x + r, y + r]];
      for (var i = 0; i < 4; i++) {
        if (T.solid(cs[i][0], cs[i][1])) {
          var k = Math.floor(cs[i][1]) * MW + Math.floor(cs[i][0]);
          if (CITY.doorLoc[k]) hitDoor = CITY.doorLoc[k];
          return true;
        }
      }
      var gx = Math.floor(x), gy = Math.floor(y);
      for (var oy = -1; oy <= 1; oy++) for (var ox = -1; ox <= 1; ox++) {
        var ts = CITY.treeAt[(gy + oy) * MW + gx + ox];
        if (ts) for (var j = 0; j < ts.length; j++) { var dx = x - ts[j].x, dy = y - ts[j].y; if (dx * dx + dy * dy < (r + ts[j].r) * (r + ts[j].r)) return true; }
      }
      return false;
    }
    if (!blocked(nx, cam.y)) cam.x = nx;
    if (!blocked(cam.x, ny)) cam.y = ny;
    return hitDoor;
  }

  // ปรับสภาพแวดล้อมเมื่อช่วงเวลา/อากาศ/ผู้คนเปลี่ยน
  var curLocs = [];
  function refresh(S, G, force) {
    var slot = S ? Math.min(S.slot || 0, 2) : 1, wk = S && S.weather ? S.weather.k : 'clear';
    var bike = !!(S && S.city && (S.city.policies || []).indexOf('bikelane') >= 0);
    var key = [slot, wk, bike ? 1 : 0, S ? S.day : 0].join('|');
    if (key === envKey && !force) return;
    envKey = key; env = T.envFor(slot, wk, bike);
    npcSprites = []; signSprites = [];
    var ids = Object.keys(CITY.locs);
    ids.forEach(function (id) {
      var L = CITY.locs[id], info = SK.LOC && SK.LOC[id], here = [];
      try { here = G && G.npcsAt ? G.npcsAt(id) : []; } catch (e) { here = []; }
      var closed = false; try { closed = !!(G && G.closedReason && G.closedReason(id)); } catch (e) { closed = false; }
      var icon = info ? (SK.locIcon ? SK.locIcon(id, S) : info.icon) : '📍', zc = info ? ZONE_COL[info.zone] : null;
      var spr = T.signSprite(icon, zc, here.length, closed);
      if (L.park) signSprites.push({ x: L.front.x + 0.5, y: L.front.y + 0.5, z: 1.2, h: 0.8, asp: 1, tex: spr, emit: 1 });
      else {
        var d = L.door, sy = d.face === 'S' ? d.y + 1.18 : d.y - 0.18;
        signSprites.push({ x: d.x + 0.5, y: sy, z: 1.02, h: 0.62, asp: 1, tex: spr, emit: 1 });
      }
      L.here = here;
      here.forEach(function (nid, k) {
        var np = SK.NPCS && SK.NPCS[nid]; if (!np) return;
        var off = (k - (here.length - 1) / 2) * 0.6;
        var px = L.front.x + 0.5 + off, py = L.front.y + 0.5 + (L.park ? 0.9 : 0);
        if (L.door && L.door.face === 'N') py = L.front.y + 0.5;
        npcSprites.push({ x: px, y: py, z: 0, h: 0.66, asp: 1, tex: T.emojiSprite(np.icon || '🧑', 24) });
      });
    });
    sprDirty = true;
    var pop = S && S.city ? S.city.pop : 85000, want = Math.round(clamp(14 + ((pop - (SK.BASE_POP || 85000)) / 3000), 12, 30));
    if (peds.length !== want) T.initWorld(want);
  }
  T.refresh = refresh;

  // ======================================================================
  //  6) ส่วนเชื่อม DOM / ควบคุม / เชื่อมเข้าเกม
  // ======================================================================
  if (!HAS_DOM) return;

  var wrap = null, canvas = null, ctx2 = null, img = null, buf32 = null, depth = null, mini = null, mctx = null, miniBase = null;
  var promptEl = null, helpEl = null, joyEl = null, knobEl = null, fsBtn = null, hudEl = null;
  var fs = false, wantFs = false, fsReal = false, hudKey = '';
  var running = false, raf = 0, lastT = 0, cw = 0, ch = 0, shownLoc = '', coolUntil = 0, helpShown = false, lastMini = 0, nearLoc = null;
  var keys = {}, joy = { id: -1, ox: 0, oy: 0, x: 0, y: 0 }, look = { id: -1, x: 0, y: 0 }, sizeKey = '';
  var aim = { ang: 0, pitch: 0 }, vF = 0, vS = 0, qscale = 1, renderEma = 6, qCool = 0, qUp = 0, fpsEl = null, fpsAcc = 0, fpsN = 0, fpsT = 0;

  function esc(s) { return SK.UI && SK.UI.esc ? SK.UI.esc(s) : String(s).replace(/[&<>"]/g, function (m) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[m]; }); }

  function build() {
    if (wrap) return;
    if (!CITY) T.buildCity();
    wrap = document.createElement('div');
    wrap.className = 't3-wrap'; wrap.setAttribute('role', 'application'); wrap.setAttribute('aria-label', 'เมืองสุขนคร มุมมองบุคคลที่หนึ่ง ใช้ปุ่ม WASD หรือลากเพื่อมอง'); wrap.tabIndex = 0;
    canvas = document.createElement('canvas'); canvas.className = 't3-cv';
    ctx2 = canvas.getContext('2d', { alpha: false, desynchronized: true });
    promptEl = document.createElement('div'); promptEl.className = 't3-prompt';
    helpEl = document.createElement('div'); helpEl.className = 't3-help'; helpEl.textContent = 'ลากนิ้วเพื่อมองรอบ/ขึ้น/ลง • จอยฝั่งซ้ายเพื่อเดิน • เดินชนประตูเพื่อเข้าไป';
    joyEl = document.createElement('div'); joyEl.className = 't3-joy'; knobEl = document.createElement('i'); joyEl.appendChild(knobEl);
    mini = document.createElement('canvas'); mini.className = 't3-mini'; mini.width = MW * 2; mini.height = MH * 2; mctx = mini.getContext('2d');
    fsBtn = document.createElement('button'); fsBtn.type = 'button'; fsBtn.className = 't3-fs'; fsBtn.textContent = '⛶ เต็มจอ'; fsBtn.setAttribute('aria-label', 'เต็มจอ');
    fsBtn.addEventListener('click', function (e) { e.stopPropagation(); setFs(!fs, true); });
    hudEl = document.createElement('div'); hudEl.className = 't3-hud';
    try { if (/fps/.test(location.hash) || localStorage.getItem('sooksan_t3fps') === '1') { fpsEl = document.createElement('div'); fpsEl.className = 't3-fps'; wrap.appendChild(fpsEl); } } catch (e) {}
    wrap.appendChild(canvas); wrap.appendChild(mini); wrap.appendChild(helpEl); wrap.appendChild(promptEl); wrap.appendChild(joyEl); wrap.appendChild(fsBtn); wrap.appendChild(hudEl);
    // แผนที่ย่อ (พื้นผิวคงที่)
    miniBase = document.createElement('canvas'); miniBase.width = MW * 2; miniBase.height = MH * 2;
    var bc = miniBase.getContext('2d'), tc = ['#6b6e76', '#cfcac0', '#7fb86e', '#6fa8dc', '#6b6e76', '#bdb4a6'];
    for (var y = 0; y < MH; y++) for (var x = 0; x < MW; x++) {
      var b = CITY.bmap[y * MW + x];
      bc.fillStyle = b ? (b === 1 ? '#555a66' : 'rgb(' + CITY.blds[b - 1].c.join(',') + ')') : tc[CITY.tile[y * MW + x]];
      bc.fillRect(x * 2, y * 2, 2, 2);
    }
    mini.addEventListener('click', function (e) { wrap.classList.toggle('t3-bigmap'); e.stopPropagation(); });
    bindInput();
  }

  function bindInput() {
    function isUi(e) { return e.target.closest && (e.target.closest('button') || e.target.closest('.t3-mini')); }
    wrap.addEventListener('pointerdown', function (e) {
      if (isUi(e)) return;
      var rc = wrap.getBoundingClientRect(), lx = e.clientX - rc.left;
      if (e.pointerType !== 'mouse' && lx < rc.width * 0.5 && joy.id < 0) {
        joy.id = e.pointerId; joy.ox = e.clientX; joy.oy = e.clientY; joy.x = joy.y = 0;
        joyEl.style.left = (e.clientX - rc.left) + 'px'; joyEl.style.top = (e.clientY - rc.top) + 'px'; joyEl.classList.add('on'); knobEl.style.transform = 'translate(0,0)';
      } else if (look.id < 0) { look.id = e.pointerId; look.x = e.clientX; look.y = e.clientY; }
      else return;
      try { wrap.setPointerCapture(e.pointerId); } catch (er) {}
      hideHelp(); wrap.focus({ preventScroll: true });
    });
    wrap.addEventListener('pointermove', function (e) {
      if (e.pointerId === joy.id) {
        var dx = e.clientX - joy.ox, dy = e.clientY - joy.oy, R = 46, d = Math.sqrt(dx * dx + dy * dy);
        if (d > R) { dx = dx / d * R; dy = dy / d * R; }
        joy.x = dx / R; joy.y = dy / R; knobEl.style.transform = 'translate(' + dx + 'px,' + dy + 'px)';
      } else if (e.pointerId === look.id) {
        var k = 1.25 * cam.hfov / Math.max(1, cw || 360);
        aim.ang += (e.clientX - look.x) * k; aim.pitch = clamp(aim.pitch - (e.clientY - look.y) * k, -0.62, 0.9);
        look.x = e.clientX; look.y = e.clientY;
      }
    });
    function up(e) {
      if (e.pointerId === joy.id) { joy.id = -1; joy.x = joy.y = 0; joyEl.classList.remove('on'); }
      if (e.pointerId === look.id) look.id = -1;
    }
    wrap.addEventListener('pointerup', up); wrap.addEventListener('pointercancel', up);
    window.addEventListener('keydown', function (e) {
      if (!running || (SK.UI && SK.UI.mdl)) return;
      var tg = e.target && e.target.tagName; if (tg === 'INPUT' || tg === 'TEXTAREA' || tg === 'SELECT') return;
      var k = String(e.key || '').toLowerCase();
      if (k === 'escape' && fs) { setFs(false, true); return; }
      if (['w', 'a', 's', 'd', 'q', 'e', 'r', 'f', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].indexOf(k) >= 0) { keys[k] = true; hideHelp(); e.preventDefault(); }
      if (k === 'enter' && nearLoc) enter(nearLoc);
    });
    window.addEventListener('keyup', function (e) { delete keys[String(e.key || '').toLowerCase()]; });
    window.addEventListener('blur', function () { keys = {}; });
    window.addEventListener('resize', function () { if (running) fit(); });
    window.addEventListener('orientationchange', function () { setTimeout(function () { if (running) fit(); }, 250); });
    if (window.visualViewport) window.visualViewport.addEventListener('resize', function () { if (running) fit(); });
    var onFsChange = function () {
      if (fs && fsReal && !(document.fullscreenElement || document.webkitFullscreenElement)) { fsReal = false; setFs(false, true); }
    };
    document.addEventListener('fullscreenchange', onFsChange); document.addEventListener('webkitfullscreenchange', onFsChange);
  }
  function hideHelp() { if (!helpShown && helpEl) { helpShown = true; helpEl.classList.add('off'); try { localStorage.setItem('sooksan_t3help', '1'); } catch (e) {} } }

  function fit() {
    var host = wrap.parentNode; if (!host) return;
    if (fs) {
      var v = window.visualViewport, vw = Math.round(v && v.width ? v.width : window.innerWidth), vh = Math.round(v && v.height ? v.height : window.innerHeight);
      wrap.style.width = vw + 'px'; wrap.style.height = vh + 'px'; cw = vw; ch = vh;
    } else {
      wrap.style.width = ''; wrap.style.height = '';
      var nav = document.querySelector('nav.tabs'), top = host.getBoundingClientRect().top, bottom = nav ? nav.getBoundingClientRect().top : window.innerHeight;
      var hh = Math.max(280, Math.floor(bottom - top - 10));
      host.style.height = hh + 'px';
      cw = host.clientWidth; ch = hh;
    }
    var base = Math.min(cw / 2, 400), iw = Math.round(clamp(base * qscale, Math.min(140, base), 400));
    qscale = clamp(iw / base, 0.3, 1);
    var ih = Math.max(90, Math.round(iw * ch / Math.max(1, cw)));
    var k = iw + 'x' + ih;
    if (k !== sizeKey) {
      sizeKey = k; canvas.width = iw; canvas.height = ih;
      img = ctx2.createImageData(iw, ih); buf32 = new Uint32Array(img.data.buffer); depth = new Float32Array(iw * ih);
    }
    cam.hfov = (iw >= ih ? 72 : 66) * Math.PI / 180;
  }

  // ---- โหมดเต็มจอ: ครอบทั้งหน้าจอ (ใช้ได้ทุกเครื่อง) + ขอเต็มจอจริง/ล็อกแนวนอนเมื่อเครื่องรองรับ ----
  function leaveReal() {
    try { if (document.fullscreenElement || document.webkitFullscreenElement) { var ex = document.exitFullscreen || document.webkitExitFullscreen; var pr = ex.call(document); if (pr && pr.catch) pr.catch(function () {}); } } catch (e) {}
    try { if (window.screen && screen.orientation && screen.orientation.unlock) screen.orientation.unlock(); } catch (e) {}
    fsReal = false;
  }
  function updateHud() {
    if (!hudEl) return;
    var S = SK.S; if (!S) { hudEl.textContent = ''; return; }
    var sl = Math.min(S.slot || 0, 2);
    hudEl.textContent = (SK.SLOT_ICON ? SK.SLOT_ICON[sl] : '') + ' ' + (SK.SLOTS ? SK.SLOTS[sl] : '') + (S.weather && S.weather.icon ? ' • ' + S.weather.icon : '') + ' • 💵 ' + (SK.fmt ? SK.fmt(S.cash) : S.cash);
  }
  function setFs(on, user) {
    on = !!on;
    if (on === fs) { if (on) fit(); return; }
    fs = on; wrap.classList.toggle('t3-full', on);
    document.documentElement.classList.toggle('t3-lock', on);
    fsBtn.textContent = on ? '✕ ออก' : '⛶ เต็มจอ'; fsBtn.setAttribute('aria-label', on ? 'ออกจากโหมดเต็มจอ' : 'เต็มจอ');
    if (user) wantFs = on;
    if (on) {
      if (user) {
        try {
          var rq = wrap.requestFullscreen || wrap.webkitRequestFullscreen;
          if (rq) {
            var pr = rq.call(wrap);
            var ok = function () { fsReal = true; try { if (window.screen && screen.orientation && screen.orientation.lock) screen.orientation.lock('landscape').catch(function () {}); } catch (e) {} };
            if (pr && pr.then) pr.then(ok).catch(function () {}); else ok();
          }
        } catch (e) {}
      }
    } else leaveReal();
    fit(); updateHud(); hideHelp();
  }
  // ออกจากหน้าเมืองเดิน (เข้าตึก/เปลี่ยนแท็บ): คืนหน้าจอปกติ แต่จำไว้ว่าผู้เล่นอยากเล่นเต็มจอ
  function detachFs() {
    if (!fs) return;
    fsReal = false; leaveReal(); fs = false;
    if (wrap) { wrap.classList.remove('t3-full'); wrap.style.width = ''; wrap.style.height = ''; }
    if (fsBtn) fsBtn.textContent = '⛶ เต็มจอ';
    document.documentElement.classList.remove('t3-lock');
  }
  T.setFullscreen = function (on) { if (wrap) setFs(on, true); };

  function enter(id) {
    if (!id || performance.now() < coolUntil) return;
    coolUntil = performance.now() + 900;
    stop();
    SK.UI.loc = id; SK.UI._resetScroll = true; SK.UI.render();
  }

  function spawnAt(id) {
    var L = CITY.locs[id] || CITY.locs.home; if (!L) return;
    cam.x = L.front.x + 0.5; cam.y = L.front.y + 0.5; cam.pitch = 0; cam.eye = 0.55; vF = vS = 0;
    if (L.door) cam.ang = L.door.face === 'S' ? -Math.PI / 2 : Math.PI / 2;
    else cam.ang = Math.PI / 2;
    // เริ่มห่างจากประตูเล็กน้อยให้เห็นหน้าตึก
    var bx = cam.x - Math.cos(cam.ang) * 1.6, by = cam.y - Math.sin(cam.ang) * 1.6;
    if (!T.solid(bx, by)) { cam.x = bx; cam.y = by; }
    aim.ang = cam.ang; aim.pitch = cam.pitch;
  }

  T.teleport = function (x, y, ang, pitch) { cam.x = x; cam.y = y; cam.ang = ang; cam.pitch = pitch || 0; aim.ang = cam.ang; aim.pitch = cam.pitch; vF = vS = 0; };
  var movePhase = 0, lastAt = null, spawned = false;
  function frame(t) {
    if (!running) return;
    raf = requestAnimationFrame(frame);
    var dt = Math.min(0.05, (t - lastT) / 1000 || 0.016); lastT = t;
    if (document.hidden || (SK.UI && SK.UI.mdl)) return;
    var S = SK.S, G = SK.G;
    refresh(S, G);
    if (fs && envKey !== hudKey) { hudKey = envKey; updateHud(); }
    var fwd = 0, str = 0, turn = 0, lk = 0;
    if (keys.w || keys.arrowup) fwd += 1; if (keys.s || keys.arrowdown) fwd -= 1;
    if (keys.d) str += 1; if (keys.a) str -= 1;
    if (keys.arrowright || keys.e) turn += 1; if (keys.arrowleft || keys.q) turn -= 1;
    if (keys.r) lk += 1; if (keys.f) lk -= 1;
    if (joy.id >= 0) { fwd += -joy.y; str += joy.x; }
    aim.ang += turn * 1.9 * dt; aim.pitch = clamp(aim.pitch + lk * 1.3 * dt, -0.62, 0.9);
    // ทำให้การหัน/เดินนุ่มนวล: เลื่อนเข้าหาเป้าหมายแบบไม่ขึ้นกับเฟรมเรต
    var sm = 1 - Math.exp(-dt * 26);
    cam.ang += (aim.ang - cam.ang) * sm; cam.pitch += (aim.pitch - cam.pitch) * sm;
    var mv0 = Math.sqrt(fwd * fwd + str * str); if (mv0 > 1) { fwd /= mv0; str /= mv0; }
    var ka = 1 - Math.exp(-dt * 16); vF += (fwd - vF) * ka; vS += (str - vS) * ka;
    var mv = Math.sqrt(vF * vF + vS * vS);
    if (mv > 0.02) {
      var sp = 3.4 * dt, ca = Math.cos(cam.ang), sa = Math.sin(cam.ang);
      var door = tryMove(cam.x + (ca * vF - sa * vS) * sp, cam.y + (sa * vF + ca * vS) * sp);
      if (door && vF > 0.3) enter(door);
      movePhase += dt * 9 * mv;
    }
    cam.eye = 0.55 + (mv > 0.02 ? Math.sin(movePhase) * 0.012 : 0);
    stepWorld(dt);
    // ปุ่มเข้าสถานที่ใกล้ที่สุด
    var best = null, bd = 2.6, ids = Object.keys(CITY.locs);
    for (var i = 0; i < ids.length; i++) {
      var L = CITY.locs[ids[i]], dx = L.front.x + 0.5 - cam.x, dy = L.front.y + 0.5 - cam.y, d = Math.sqrt(dx * dx + dy * dy);
      if (d < bd) { bd = d; best = ids[i]; }
    }
    nearLoc = best;
    var pk = (best || '') + '|' + envKey;
    if (pk !== shownLoc) {
      shownLoc = pk;
      if (best) {
        var info = SK.LOC[best], here = (CITY.locs[best].here || []).map(function (n) { return SK.NPCS[n] ? SK.NPCS[n].icon + ' ' + SK.NPCS[n].name : ''; }).filter(Boolean);
        var cl = ''; try { cl = SK.G.closedReason(best) || ''; } catch (e) {}
        promptEl.innerHTML = '<button type="button" class="t3-enter" data-act="loc" data-v="' + best + '"><span>' + esc(SK.locIcon ? SK.locIcon(best, S) : info.icon) + '</span><b>เข้า ' + esc(SK.locName ? SK.locName(best, S) : info.name) + '</b>' +
          (cl ? '<small>' + esc(cl) + '</small>' : '') + (here.length ? '<small>อยู่ที่นี่: ' + esc(here.slice(0, 3).join(' • ')) + '</small>' : '') + '</button>';
        promptEl.classList.add('on');
      } else { promptEl.classList.remove('on'); }
    }
    if (!buf32) return;
    var r0 = performance.now();
    T.renderFrame(buf32, depth, canvas.width, canvas.height, cam, env, worldSprites(), t / 1000);
    ctx2.putImageData(img, 0, 0);
    var rm = performance.now() - r0; renderEma = renderEma * 0.92 + rm * 0.08;
    // ปรับความละเอียดอัตโนมัติ: เครื่องช้า → ลดความละเอียดลงเพื่อให้ลื่น, เครื่องแรง → คืนความละเอียด
    if (qCool > 0) qCool--;
    if (renderEma > 11 && qCool === 0 && canvas.width > Math.min(140, cw / 2) + 1) { qscale = qscale * 0.86; qCool = 40; qUp = 0; fit(); }
    else if (renderEma < 4.5 && qscale < 1) { if (++qUp > 150) { qscale = Math.min(1, qscale * 1.12); qUp = 0; qCool = 40; fit(); } }
    else qUp = 0;
    if (fpsEl) { fpsAcc += dt; fpsN++; if (fpsAcc > 0.5) { fpsEl.textContent = Math.round(fpsN / fpsAcc) + ' fps • ' + canvas.width + 'x' + canvas.height + ' • ' + renderEma.toFixed(1) + ' ms'; fpsAcc = 0; fpsN = 0; } }
    if (t - lastMini > 200) { lastMini = t; drawMini(); }
  }

  function drawMini() {
    mctx.drawImage(miniBase, 0, 0);
    Object.keys(CITY.locs).forEach(function (id) {
      var L = CITY.locs[id], info = SK.LOC[id], zc = info ? ZONE_COL[info.zone] : [200, 60, 60];
      mctx.fillStyle = id === nearLoc ? '#fff' : 'rgb(' + zc.join(',') + ')';
      mctx.fillRect(L.front.x * 2 - 1, L.front.y * 2 - 1, 4, 4);
      mctx.strokeStyle = '#222'; mctx.lineWidth = 0.7; mctx.strokeRect(L.front.x * 2 - 1, L.front.y * 2 - 1, 4, 4);
    });
    var px = cam.x * 2, py = cam.y * 2;
    mctx.fillStyle = '#ff2a2a'; mctx.beginPath();
    mctx.moveTo(px + Math.cos(cam.ang) * 5, py + Math.sin(cam.ang) * 5);
    mctx.lineTo(px + Math.cos(cam.ang + 2.5) * 3.6, py + Math.sin(cam.ang + 2.5) * 3.6);
    mctx.lineTo(px + Math.cos(cam.ang - 2.5) * 3.6, py + Math.sin(cam.ang - 2.5) * 3.6);
    mctx.closePath(); mctx.fill();
  }

  function stop() {
    running = false; if (raf) cancelAnimationFrame(raf); raf = 0;
    keys = {}; joy.id = -1; joy.x = joy.y = 0; look.id = -1; if (joyEl) joyEl.classList.remove('on');
  }
  T.stop = stop;

  T.mount = function (host) {
    build();
    if (wrap.parentNode !== host) host.appendChild(wrap);
    var S = SK.S;
    try { helpShown = localStorage.getItem('sooksan_t3help') === '1'; } catch (e) {}
    helpEl.classList.toggle('off', helpShown);
    if (wantFs && !fs) setFs(true, false); else fit();
    updateHud();
    if (!spawned || (S && S.at && S.at !== lastAt && CITY.locs[S.at])) { spawnAt(S && S.at ? S.at : 'home'); spawned = true; }
    lastAt = S ? S.at : null;
    coolUntil = performance.now() + 700;
    shownLoc = ''; envKey = '';
    if (!running) { running = true; lastT = performance.now(); raf = requestAnimationFrame(frame); }
  };

  // ---- เชื่อมเข้า UI.render: ต่อโหมด 'town' ----
  function hook() {
    var UI = SK.UI; if (!UI || UI.__t3) return; UI.__t3 = true;
    var oRender = UI.render;
    UI.render = function () {
      oRender.apply(this, arguments);
      try {
        var host = document.getElementById('town3d');
        if (host && UI.screen === 'game' && UI.tab === 'map' && !UI.loc && UI.mapMode === 'town') T.mount(host);
        else { if (running) stop(); if (wrap) { detachFs(); if (wrap.parentNode) wrap.parentNode.removeChild(wrap); } }
      } catch (e) { if (root.console) console.error('town3d', e); }
    };
  }
  T.hook = hook;
  hook();
})();
