/* สุขนคร — ui_extra.js : หน้าจอส่วนขยาย
   แผนที่เมืองแบบภาพ • หน้าต่างบทสนทนา • ข้อมูลสุขภาพ/งานอดิเรก/ลูก/ตำแหน่งการเมือง • เศรษฐกิจและร้านค้า */
(function () {
  var SK = window.SK, G = SK.G, UI = SK.UI, C = SK.clamp;
  var esc = UI.esc, fm = SK.fmt, mon = SK.money;
  function S() { return SK.S; }
  UI.mapMode = 'map';
  try { UI.mapMode = localStorage.getItem('sooksan_mapmode') || 'map'; } catch (e) {}

  // ======================================================================
  //  แผนที่เมืองแบบภาพ (SVG)
  // ======================================================================
  var POS = {
    home: [62, 78], housing: [146, 70], market: [236, 64], mall: [318, 74], cafe: [276, 140],
    work: [58, 182], jobs: [136, 176], biz: [98, 232], bank: [312, 214],
    hospital: [48, 318], school: [124, 304], library: [198, 318], townhall: [272, 300], social: [338, 330], police: [168, 368],
    park: [64, 444], gym: [138, 476], temple: [62, 520], culture: [266, 456], station: [334, 510]
  };
  var ZONES = [
    ['ที่อยู่อาศัย', 18, 30, 175, 95, '#e9dcc4'], ['การค้า', 200, 26, 165, 150, '#f3d9c6'], ['การงาน', 16, 140, 175, 145, '#dfe3ef'],
    ['การเงิน', 262, 176, 103, 82, '#e6e0f2'], ['บริการสาธารณะ', 14, 270, 352, 160, '#d9ebf0'], ['สีเขียวและสุขภาพ', 14, 410, 180, 140, '#cfe8cf'], ['ชุมชน', 212, 418, 154, 132, '#f0e3c4']
  ];
  function rnd(i) { var x = Math.sin(i * 12.9898) * 43758.5453; return x - Math.floor(x); }
  UI.cityMap = function () {
    var s = S(), out = '<svg viewBox="0 0 380 560" class="citymap" role="img" aria-label="แผนที่เมืองสุขนคร">';
    out += '<rect width="380" height="560" rx="18" class="mapbg"/>';
    // แม่น้ำ
    out += '<path d="M0 395 C 70 380, 120 420, 190 410 S 300 380, 380 400 L380 418 C 300 400, 250 432, 190 428 S 70 400, 0 414 Z" class="river"/>';
    ZONES.forEach(function (z) { out += '<rect x="' + z[1] + '" y="' + z[2] + '" width="' + z[3] + '" height="' + z[4] + '" rx="14" fill="' + z[5] + '" class="zonebg"/><text x="' + (z[1] + 8) + '" y="' + (z[2] + 14) + '" class="zonelbl">' + z[0] + '</text>'; });
    // ถนน
    out += '<path d="M190 0 V560 M0 262 H380 M0 136 H380" class="road"/>';
    if ((s.city.policies || []).indexOf('metro') >= 0) out += '<path d="M10 548 L370 20" class="metro"/>';
    if ((s.city.policies || []).indexOf('bikelane') >= 0) out += '<path d="M0 266 H380 M194 0 V560" class="bike"/>';
    // อาคาร (เพิ่มตามประชากรและโครงการ)
    var nb = Math.round(C(10 + (s.city.policies || []).length * 2 + (s.city.pop - SK.BASE_POP) / 1500, 8, 60));
    for (var i = 0; i < nb; i++) {
      var bx = 20 + rnd(i + 1) * 340, by = 30 + rnd(i + 99) * 500, w = 6 + rnd(i + 7) * 8, h = 6 + rnd(i + 13) * 10;
      var near = Object.keys(POS).some(function (k) { return Math.abs(POS[k][0] - bx) < 30 && Math.abs(POS[k][1] - by) < 30; });
      if (near || (by > 380 && by < 432)) continue;
      out += '<rect x="' + bx.toFixed(0) + '" y="' + by.toFixed(0) + '" width="' + w.toFixed(0) + '" height="' + h.toFixed(0) + '" rx="1.5" class="mbld"/>';
    }
    var trees = Math.round(C(s.city.m.environment / 6, 4, 18));
    for (var t = 0; t < trees; t++) { var tx = 20 + rnd(t + 300) * 340, ty = 420 + rnd(t + 500) * 130; out += '<circle cx="' + tx.toFixed(0) + '" cy="' + ty.toFixed(0) + '" r="5" class="mtree"/>'; }
    // สถานที่
    Object.keys(POS).forEach(function (id) {
      var p = POS[id], closed = G.closedReason(id), np = G.npcsAt(id).length, here = s.at === id;
      out += '<g class="mloc' + (closed ? ' closed' : '') + (here ? ' here' : '') + '" data-act="loc" data-v="' + id + '" tabindex="0" role="button" aria-label="' + esc(SK.locName(id, s)) + '">';
      out += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="21" class="mdot"/>';
      out += '<text x="' + p[0] + '" y="' + (p[1] + 7) + '" class="micon">' + SK.locIcon(id, s) + '</text>';
      out += '<text x="' + p[0] + '" y="' + (p[1] + 33) + '" class="mname">' + esc(SK.locName(id, s)).slice(0, 16) + '</text>';
      if (np) out += '<circle cx="' + (p[0] + 17) + '" cy="' + (p[1] - 15) + '" r="8" class="mbadge"/><text x="' + (p[0] + 17) + '" y="' + (p[1] - 11.5) + '" class="mbadget">' + np + '</text>';
      if (here) out += '<text x="' + (p[0] - 20) + '" y="' + (p[1] - 13) + '" class="mme">' + esc(s.avatar) + '</text>';
      out += '</g>';
    });
    return out + '</svg>';
  };
  var oMap = UI.viewMap;
  UI.viewMap = function () {
    var html = oMap();
    var tog = '<div class="seg maptog"><button class="' + (UI.mapMode === 'town' ? 'on' : '') + '" data-act="mapmode" data-v="town">🧭 เดินเมือง</button><button class="' + (UI.mapMode === 'map' ? 'on' : '') + '" data-act="mapmode" data-v="map">🗺️ แผนที่</button><button class="' + (UI.mapMode === 'list' ? 'on' : '') + '" data-act="mapmode" data-v="list">📋 รายการ</button></div>';
    var cut = html.indexOf('<section class="zone">');
    if (cut < 0) return html + tog;
    var head = html.slice(0, cut), list = html.slice(cut);
    if (UI.mapMode === 'town' && SK.Town) return head + tog + '<div class="town3d" id="town3d"></div><p class="muted t3note">เดินชนประตูตึกหรือกด "เข้า" เพื่อเข้าสถานที่ • แตะแผนที่ย่อเพื่อขยาย</p>';
    if (UI.mapMode === 'map') return head + tog + '<div class="mapwrap">' + UI.cityMap() + '<p class="muted">แตะสถานที่เพื่อเข้าไป • ตัวเลขสีส้ม = จำนวนคนที่อยู่ตอนนี้</p></div>';
    return head + tog + list;
  };

  // ======================================================================
  //  หน้าต่างบทสนทนา
  // ======================================================================
  UI.dlg = null;
  UI.dlgModal = function (o) {
    UI.dlg = { o: o, used: {}, lines: [{ who: 'npc', t: o.greet }], n: 0 };
    UI.dlgRender();
  };
  UI.dlgRender = function () {
    var d = UI.dlg, o = d.o, rl = ['คนแปลกหน้า/คนรู้จัก', 'เพื่อน', 'คนสนิท'][o.tier];
    var html = '<div class="dlgh"><span class="nav">' + o.icon + '</span><div><b>' + esc(o.name) + '</b><small>' + esc(o.role) + ' • ' + o.age + ' ปี • ' + rl + ' (' + Math.round(G.rel(o.id)) + ')</small></div></div><div class="dlgbody">';
    d.lines.forEach(function (l) { html += '<p class="bub ' + l.who + '">' + esc(l.t) + '</p>'; });
    html += '</div><div class="dlgtopics">';
    if (d.n < 3) o.topics.forEach(function (tp) {
      var used = d.used[tp.k];
      html += '<button class="choice' + (used || tp.locked ? ' off' : '') + '" data-act="dlgtopic" data-k="' + tp.k + '"' + (used || tp.locked ? ' aria-disabled="true"' : '') + '><b>' + tp.label + '</b></button>';
    });
    else html += '<p class="muted">คุยกันมาพอสมควรแล้ว</p>';
    html += '</div><div class="row"><button class="btn pri" data-act="dlgclose">👋 บอกลา</button></div>';
    UI.modal(html, 'dlg');
    var b = document.querySelector('.dlgbody'); if (b) b.scrollTop = b.scrollHeight;
  };

  // ======================================================================
  //  ส่วนเสริมหน้า "ฉัน" และ "สถิติเมือง"
  // ======================================================================
  function bar(label, val, color) { var v = Math.round(val); return '<div class="skill"><span>' + label + '</span><div class="bt"><i style="width:' + C(v, 0, 100) + '%;' + (color ? 'background:' + color : '') + '"></i></div><b>' + v + '</b></div>'; }
  var oMe = UI.viewMe;
  UI.viewMe = function () {
    var s = S(), html = oMe(), extra = '';
    if (s.pol && (s.pol.office || s.pol.cand)) extra += '<div class="card"><h3>🏛️ บทบาททางการเมือง</h3><p>' + (s.pol.office ? '<b>' + (s.pol.office.role === 'mayor' ? 'นายกเทศมนตรี' : 'สมาชิกสภาเมือง') + '</b> • คะแนนนิยม ' + Math.round(s.pol.approval) + '%' : '') + (s.pol.cand ? ' • กำลังลงสมัคร' + (s.pol.cand.office === 'mayor' ? 'นายกฯ' : 'สมาชิกสภา') + ' (คะแนนหาเสียง ' + Math.round(s.pol.cand.score) + ')' : '') + '</p></div>';
    if (s.hlth) {
      var h = s.hlth, dx = [];
      if (h.dx.diab) dx.push('เบาหวานชนิดที่ 2'); if (h.dx.hyp) dx.push('ความดันโลหิตสูง');
      extra += '<div class="card"><h3>🩺 สุขภาพระยะยาว</h3>' + bar('🔥 ภาวะหมดไฟ', h.burn, h.burn >= 70 ? 'var(--bad)' : 'var(--amber)') +
        '<p class="muted">' + (dx.length ? 'โรคประจำตัว: ' + dx.join(', ') + ' • ตรวจติดตามล่าสุด ' + (s.day - h.follow) + ' วันก่อน (ควรทุก 90 วัน)' : 'ยังไม่มีโรคประจำตัว — ตรวจสุขภาพประจำปีช่วยให้รู้ความเสี่ยงก่อน') + ' • เพดานสุขภาพตามวัยและโรค ' + Math.round(G.healthCap(s)) + '</p></div>';
    }
    if (s.hobby) {
      extra += '<div class="card"><h3>🎯 งานอดิเรก</h3>' + Object.keys(SK.HOBBIES).map(function (k) { return bar(SK.HOBBIES[k][0] + ' ' + SK.HOBBIES[k][1], s.hobby[k]); }).join('') +
        '<p class="muted">ประกวดประจำเดือนทุกวันที่ 20 (เมื่อฝีมือถึง 15)' + (s.hobby.titles.length ? ' • รางวัล: ' + s.hobby.titles.join(', ') : '') + '</p></div>';
    }
    var c = s.love && s.love.child;
    if (c && c.st) {
      extra += '<div class="card"><h3>🧒 ' + esc(c.name) + ' — ' + esc(c.trait) + '</h3>' + Object.keys(SK.KID_ST).map(function (k) { return bar(SK.KID_ST[k].icon + ' ' + SK.KID_ST[k].name + (c.talent === k ? ' ⭐' : ''), c.st[k]); }).join('') +
        '<p class="muted">' + (c.school ? 'โรงเรียน: ' + { public: 'เทศบาล', bilingual: 'สองภาษา', arts: 'กีฬาและศิลปะ' }[c.school] : 'ยังไม่เข้าโรงเรียน') + (c.track ? ' • สาย' + { sci: 'สามัญ', voc: 'อาชีพ', tal: 'กีฬา-ศิลปะ' }[c.track] : '') + ' • ค่าใช้จ่ายลูก ' + mon(G.childCost()) + '/เดือน • ⭐ = ความถนัด</p></div>';
    }
    var at = html.lastIndexOf('<div class="card"><h3>เพื่อนและคนรู้จัก');
    return at >= 0 ? html.slice(0, at) + extra + html.slice(at) : html + extra;
  };
  var oCity = UI.viewCity;
  UI.viewCity = function () {
    var s = S(), html = oCity(), extra = '';
    if (s.econ) {
      extra += '<div class="card"><h3>📊 ค่าครองชีพ</h3><div class="kv"><span>ดัชนีราคาสินค้า</span><b>' + (s.econ.cpi * 100).toFixed(1) + '</b><span>ดัชนีค่าแรง</span><b>' + (s.econ.wage * 100).toFixed(1) + '</b><span>ดัชนีราคาที่อยู่อาศัย</span><b>' + (s.econ.house * 100).toFixed(1) + '</b><span>เงินเฟ้อปีล่าสุด</span><b>' + (s.econ.last * 100).toFixed(1) + '%</b></div><p class="muted">เริ่มต้น = 100 • ปรับทุกต้นปีตามเศรษฐกิจ การจ้างงาน และความหนาแน่นของเมือง</p></div>';
    }
    if (s.shops) {
      extra += '<div class="card"><h3>🛍️ ร้านค้าของชาวเมือง (' + s.shops.length + ' ร้าน)</h3>' + s.shops.map(function (x) { return '<p>' + x.icon + ' <b>' + esc(x.name) + '</b> <small>' + SK.LOC[x.loc].name + (x.owner && SK.NPCS[x.owner] ? ' • ของ' + SK.NPCS[x.owner].name : '') + ' • ' + (x.health > 70 ? 'ขายดี' : x.health < 30 ? 'กำลังลำบาก' : 'พอไปได้') + '</small></p>'; }).join('') + '</div>';
    }
    if (s.pop2) {
      var gone = Object.keys(s.pop2.gone).length, gen = Object.keys(s.pop2.gen).length;
      extra += '<div class="card"><h3>👥 ชาวเมืองที่คุณรู้จัก</h3><div class="kv"><span>อาศัยอยู่ตอนนี้</span><b>' + SK.NPC_KEYS.length + ' คน</b><span>ย้ายเข้ามาใหม่ (รวม)</span><b>' + gen + ' คน</b><span>ย้ายออก/จากไป</span><b>' + gone + ' คน</b><span>เด็กที่เกิดในเมือง (ยังไม่โต)</span><b>' + s.pop2.babies.length + ' คน</b></div></div>';
    }
    return html + extra;
  };

  // ======================================================================
  //  การคลิก / ลำดับป๊อปอัป
  // ======================================================================
  var oAfter = UI.after;
  UI.after = function (res) {
    var d = G.pendingDlg; G.pendingDlg = null;
    if (d) { G.msgs = []; UI.render(); UI.dlgModal(d); return; }
    oAfter(res);
  };
  var oClick = UI.onClick;
  UI.onClick = function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (!t) return;
    var act = t.getAttribute('data-act');
    if (act === 'mapmode') { UI.mapMode = t.getAttribute('data-v'); try { localStorage.setItem('sooksan_mapmode', UI.mapMode); } catch (er) {} UI.render(); return; }
    if (act === 'dlgtopic') {
      var d = UI.dlg, k = t.getAttribute('data-k');
      if (!d || d.used[k] || t.getAttribute('aria-disabled')) return;
      var tp = d.o.topics.filter(function (x) { return x.k === k; })[0];
      d.used[k] = true; d.n++;
      d.lines.push({ who: 'me', t: tp.label.replace(/^\S+\s/, '') });
      d.lines.push({ who: 'npc', t: G.dlgTopic(d.o.id, k) });
      d.o.tier = G.dlgTier(d.o.id);
      UI.dlgRender(); return;
    }
    if (act === 'dlgclose') { UI.dlg = null; UI.closeModal(); G.dlgClose(); G.save(); UI.render(); UI.popups(); return; }
    oClick(e);
  };
  document.addEventListener('keydown', function (e) {
    if ((e.key === 'Enter' || e.key === ' ') && e.target && e.target.classList && e.target.classList.contains('mloc')) { e.preventDefault(); UI.onClick({ target: e.target }); }
  });
})();

/* ---------- สถานที่: แท็บหมวด + ซ่อนปุ่มที่ยังทำไม่ได้ (เหมาะกับมือถือ) ---------- */
(function () {
  var SK = window.SK, G = SK.G, UI = SK.UI;
  UI.locTab = {}; UI.showLocked = false;
  var CATS = [
    ['people', '👥 ผู้คน'], ['main', '⭐ กิจกรรม'], ['buy', '🛒 ซื้อ/กิน'], ['money', '💼 งานและเงิน'], ['civic', '🏛️ ชุมชน']
  ];
  var RX = {
    buy: /กิน|อาหาร|วัตถุดิบ|ของฝาก|ร้านค้า|เครื่องดื่ม|ของใช้|สลาก|บันเทิง|ดูแลตัวเอง|สมาชิก|บัตรโดยสาร/,
    money: /งานเสริม|กิจการ|บัญชี|กองทุน|สินเชื่อ|ชำระหนี้|ประกัน|ตำแหน่ง|การลา|สิทธิประโยชน์|เกษียณ|ขยาย|พัฒนาตัวเอง|ที่พัก|ย้ายที่อยู่|บ้านมั่นคง|วิธีเดินทาง/,
    civic: /ประชามติ|เลือกตั้ง|ลงสมัคร|หน้าที่|งบประมาณ|อนุมัติ|ข้อเสนอ|บริจาค|ร่วมพัฒนา|กฎหมาย|ภาษี|อาสาสมัคร|ข้อมูลเมือง|หาเสียง/
  };
  function catOf(a) {
    if (a.npc || /^npc:/.test(a.group) || /คนในที่ทำงาน|คนรัก|คู่ชีวิต|ลูก|ครอบครัว/.test(a.group)) return 'people';
    if (RX.civic.test(a.group)) return 'civic';
    if (RX.money.test(a.group)) return 'money';
    if (RX.buy.test(a.group)) return 'buy';
    return 'main';
  }
  UI.catOf = catOf;
  var oLoc = UI.viewLoc;
  UI.viewLoc = function (id) {
    var all = SK.getActions(id), by = {};
    all.forEach(function (a) { var c = catOf(a); (by[c] = by[c] || []).push(a); });
    var keys = CATS.filter(function (c) { return by[c[0]]; });
    var useTabs = all.length > 7 && keys.length > 1;
    var tab = null, list = all;
    if (useTabs) {
      tab = UI.locTab[id];
      if (!tab || !by[tab]) {
        var pref = ['main', 'buy', 'money', 'civic', 'people'], best = -1;
        pref.forEach(function (k) { if (!by[k]) return; var n = by[k].filter(function (a) { return !G.whyNot(id, a); }).length * (k === 'people' ? 0.5 : 1); if (n > best) { best = n; tab = k; } });
        if (!tab) tab = keys[0][0];
      }
      list = by[tab];
    }
    var lockedN = list.filter(function (a) { return G.whyNot(id, a); }).length;
    var shown = UI.showLocked ? list : list.filter(function (a) { return !G.whyNot(id, a); });
    if (!shown.length) shown = list;
    var og = SK.getActions;
    SK.getActions = function (l, s) { return l === id ? shown : og(l, s); };
    var html;
    try { html = oLoc(id); } finally { SK.getActions = og; }
    if (useTabs) {
      var bar = '<div class="loctabs" role="tablist">' + keys.map(function (c) {
        var n = by[c[0]].filter(function (a) { return !G.whyNot(id, a); }).length;
        return '<button role="tab" class="' + (c[0] === tab ? 'on' : '') + '" data-act="loctab" data-loc="' + id + '" data-v="' + c[0] + '">' + c[1] + (n ? ' <i>' + n + '</i>' : '') + '</button>';
      }).join('') + '</div>';
      var cut = html.indexOf('</p></div></div>');
      html = cut >= 0 ? html.slice(0, cut + 16) + bar + html.slice(cut + 16) : bar + html;
    }
    if (lockedN && shown !== list) html += '<button class="btn wide ghost lockt" data-act="showlocked">🔒 ดูอีก ' + lockedN + ' อย่างที่ยังทำไม่ได้ (พร้อมเงื่อนไข)</button>';
    else if (UI.showLocked && lockedN) html += '<button class="btn wide ghost lockt" data-act="showlocked">ซ่อนอย่างที่ยังทำไม่ได้</button>';
    return html;
  };
  var oClick = UI.onClick;
  UI.onClick = function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (t && t.getAttribute('data-act') === 'loctab') { UI.locTab[t.getAttribute('data-loc')] = t.getAttribute('data-v'); UI.render(); return; }
    if (t && t.getAttribute('data-act') === 'showlocked') { UI.showLocked = !UI.showLocked; UI.render(); return; }
    if (t && (t.getAttribute('data-act') === 'loc' || t.getAttribute('data-act') === 'back')) UI.showLocked = false;
    oClick(e);
  };
})();

/* ---------- เมนู: เวอร์ชันและตรวจหาอัปเดต ---------- */
(function () {
  var SK = window.SK, UI = SK.UI;
  var oMenu = UI.viewMenu;
  UI.viewMenu = function () {
    var v = SK.appVersion ? SK.appVersion.replace('sooksan-', '') : 'v2.2';
    return '<div class="card"><h3>🔄 เวอร์ชันเกม</h3><p class="muted">ตอนนี้ใช้ ' + v + ' • เกมตรวจหาเวอร์ชันใหม่อัตโนมัติทุกครั้งที่เปิด ถ้ามีจะขึ้นแถบให้กด "อัปเดตเลย" (เซฟไม่หาย)</p><button class="btn wide" data-act="checkupd">🔍 ตรวจหาอัปเดตตอนนี้</button></div>' + oMenu();
  };
  var oClick = UI.onClick;
  UI.onClick = function (e) {
    var t = e.target.closest ? e.target.closest('[data-act]') : null;
    if (t && t.getAttribute('data-act') === 'checkupd') {
      UI.toast('กำลังตรวจหาอัปเดต…', 'n');
      SK.checkUpdate(function (r) {
        UI.toast({ found: '✨ พบเวอร์ชันใหม่! กด "อัปเดตเลย" ที่แถบด้านล่าง', installing: '⬇️ กำลังดาวน์โหลดเวอร์ชันใหม่ อีกสักครู่จะขึ้นปุ่มอัปเดต', latest: '✅ ใช้เวอร์ชันล่าสุดอยู่แล้ว', nosw: 'ตรวจอัปเดตได้เมื่อเปิดเกมผ่านเว็บไซต์ (GitHub Pages)', error: 'ตรวจหาอัปเดตไม่สำเร็จ ลองเชื่อมต่ออินเทอร์เน็ตใหม่' }[r] || r, r === 'error' ? 'bad' : 'good');
      });
      return;
    }
    oClick(e);
  };
})();
