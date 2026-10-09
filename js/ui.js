/* สุขนคร — ui.js : หน้าจอทั้งหมด (เรนเดอร์ HTML + จัดการคลิก) */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, C = SK.clamp;
  var UI = (SK.UI = { screen: 'title', tab: 'map', loc: null, jtab: 'log', create: { name: '', avatar: '🧑', path: 'newcomer', goal: 'balanced' }, mdl: null, ftab: 0 });
  var fm = SK.fmt, mon = SK.money;

  function esc(t) { return String(t == null ? '' : t).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function $(sel, root) { return (root || document).querySelector(sel); }
  function S() { return SK.S; }
  UI.esc = esc;

  // ======================================================================
  //  ส่วนประกอบเล็กๆ
  // ======================================================================
  function bar(label, icon, val, cls) {
    var v = Math.round(val);
    return '<div class="bar ' + cls + '" title="' + label + ' ' + v + '"><span class="bi">' + icon + '</span><div class="bt"><i style="width:' + C(v, 0, 100) + '%"></i></div><b>' + v + '</b></div>';
  }
  function chip(txt, cls) { return '<span class="chip ' + (cls || '') + '">' + txt + '</span>'; }
  function metricBar(k, val, delta) {
    var m = SK.METRICS[k], v = Math.round(val);
    var tone = v >= 75 ? 'good' : v >= 55 ? 'ok' : v >= 40 ? 'warn' : 'bad';
    var arrow = delta > 0.6 ? '<em class="up">▲</em>' : delta < -0.6 ? '<em class="down">▼</em>' : '';
    return '<div class="metric ' + tone + '"><div class="mh"><span>' + m.icon + ' ' + m.name + '</span><b>' + v + arrow + '</b></div><div class="bt"><i style="width:' + C(v, 0, 100) + '%"></i></div></div>';
  }
  function relLevel(v) { return v >= 85 ? 'คนสำคัญ' : v >= 60 ? 'เพื่อนสนิท' : v >= 35 ? 'เพื่อน' : v >= 12 ? 'คนรู้จัก' : 'คนแปลกหน้า'; }

  // ======================================================================
  //  ท้องฟ้า / เส้นขอบฟ้าของเมือง (SVG)
  // ======================================================================
  var BLD = [[8, 26, 42], [38, 22, 64], [64, 30, 50], [98, 20, 78], [122, 28, 56], [154, 24, 90], [182, 30, 60], [216, 22, 70], [242, 28, 46], [274, 24, 82], [302, 30, 58], [336, 22, 66], [362, 30, 48]];
  UI.skyline = function (s) {
    var slot = s.slot, env = s.city.m.environment, skies = [['#bfe3ff', '#fff1d1'], ['#74c4f5', '#e4f5ff'], ['#f4a67a', '#7d6fae']];
    var sk = skies[slot], sunX = [44, 200, 352][slot], sunY = [34, 24, 36][slot];
    var evening = slot === 2, scale = C(s.city.pop / SK.BASE_POP, 0.85, 1.4);
    var out = '<svg viewBox="0 0 400 130" preserveAspectRatio="xMidYMax slice" class="sky" role="img" aria-label="ภาพเมืองสุขนคร"><defs><linearGradient id="sg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + sk[0] + '"/><stop offset="1" stop-color="' + sk[1] + '"/></linearGradient></defs>';
    out += '<rect width="400" height="130" fill="url(#sg)"/>';
    out += '<circle cx="' + sunX + '" cy="' + sunY + '" r="' + (evening ? 15 : 13) + '" fill="' + (evening ? '#ffd0a0' : '#fff2a8') + '" opacity=".95"/>';
    out += '<ellipse cx="' + (110 + slot * 40) + '" cy="30" rx="26" ry="7" fill="#fff" opacity=".7"/><ellipse cx="' + (280 - slot * 30) + '" cy="46" rx="30" ry="8" fill="#fff" opacity=".55"/>';
    BLD.forEach(function (b, i) {
      var h = b[2] * (0.8 + (scale - 0.85) * 0.5), y = 112 - h;
      out += '<rect x="' + b[0] + '" y="' + y + '" width="' + b[1] + '" height="' + h + '" rx="2" class="bld b' + (i % 3) + '"/>';
      for (var wy = y + 8; wy < 104; wy += 11) for (var wx = b[0] + 5; wx < b[0] + b[1] - 5; wx += 8) {
        var lit = evening && ((wx + wy + i) % 3 !== 0);
        out += '<rect x="' + wx + '" y="' + wy + '" width="3.5" height="5" rx="1" fill="' + (lit ? '#ffe9a6' : '#ffffff') + '" opacity="' + (lit ? 0.95 : 0.35) + '"/>';
      }
    });
    out += '<rect y="108" width="400" height="22" class="gnd"/>';
    var trees = Math.round(C(env / 8, 2, 12));
    for (var t = 0; t < trees; t++) {
      var tx = 14 + t * (372 / trees) + (t % 2) * 6;
      out += '<rect x="' + (tx - 1) + '" y="106" width="3" height="10" fill="#6b4f35"/><circle cx="' + tx + '" cy="102" r="7.5" class="tree"/>';
    }
    out += '<rect width="400" height="130" fill="#8d8d8d" opacity="' + (C((75 - env) / 120, 0, 0.35)).toFixed(2) + '"/>';
    return out + '</svg>';
  };

  // ======================================================================
  //  HUD
  // ======================================================================
  UI.hud = function () {
    var s = S(), info = SK.dayInfo(s.day), dt = info.date;
    var slots = '';
    for (var i = 0; i < 3; i++) slots += '<i class="sl ' + (i < s.slot ? 'past' : i === s.slot ? 'now' : '') + '" title="' + SK.SLOTS[i] + '">' + SK.SLOT_ICON[i] + '</i>';
    var tag = info.holiday ? chip('🎌 ' + info.holiday, 'hol') : (info.weekend ? chip('วันหยุด', 'hol') : '');
    var sick = s.sick ? chip('🤒 ป่วย ' + s.sick.kind, 'bad') : '';
    return '<header class="hud"><div class="hud-top"><button class="date" data-act="tab" data-v="me" aria-label="ดูข้อมูลตัวละคร">' +
      '<span class="av">' + esc(s.avatar) + '</span><span><b>' + SK.DOW[dt.dow] + ' ' + dt.d + ' ' + SK.MONTHS_S[dt.m] + ' ' + dt.be + '</b><small>อายุ ' + Math.floor(s.age || 0) + ' • วันที่ ' + (s.day + 1) + ' • ' + (s.weather ? s.weather.icon + ' ' + s.weather.name : 'ฤดู' + info.season) + ' ' + tag + sick + '</small></span></button>' +
      '<div class="slots" aria-label="ช่วงเวลา">' + slots + '<small>' + (s.slot < 3 ? SK.SLOTS[s.slot] : '') + '</small></div></div>' +
      '<div class="hud-money"><span class="m1">💵 <b>' + fm(s.cash) + '</b></span><span class="m2">🏦 <b>' + fm(s.bank) + '</b></span><span class="m3">' + (G.totalDebt() > 0 ? '🧾 หนี้ <b>' + fm(G.totalDebt()) + '</b>' : '✅ ไม่มีหนี้') + '</span></div>' +
      '<div class="hud-bars">' + bar('พลังงาน', '⚡', s.energy, 'en') + bar('อิ่ม', '🍚', s.sat, 'sa') + bar('สุขภาพ', '❤️', s.health, 'he') + bar('อารมณ์', '😊', s.mood, 'mo') + '</div></header>';
  };

  // ======================================================================
  //  แท็บ: เมือง (แผนที่)
  // ======================================================================
  UI.hints = function () {
    var s = S(), h = [], info = SK.dayInfo(s.day), dt = info.date;
    if (s.sat < 40) h.push(['🍚', 'หิวแล้ว — กินอาหารที่ทำไว้ หรือซื้อข้าวแกงที่ตลาด', 'bad']);
    if (s.energy < 25) h.push(['⚡', 'พลังงานต่ำ ควรพักผ่อน', 'bad']);
    if (s.sick) h.push(['🤒', 'ป่วยอยู่ — ไปโรงพยาบาลชุมชนจะหายเร็วขึ้น', 'bad']);
    if (!s.job && !s.business) h.push(['💼', 'ยังไม่มีรายได้ประจำ — แวะศูนย์จัดหางาน', 'warn']);
    if (s.arrears.rent > 0) h.push(['🏚️', 'ค้างค่าเช่า ' + mon(s.arrears.rent) + ' — รีบจัดการ หรือขอความช่วยเหลือที่ศูนย์พัฒนาสังคม', 'bad']);
    if (s.ballot && !s.ballot.mine) h.push(['🗳️', 'ประชามติเดือน' + s.ballot.label + 'ยังไม่ได้โหวต (ที่ว่าการเมือง ช่วงเช้า–บ่ายวันทำการ)', 'info']);
    var left = dt.dim - dt.d + 1;
    if (left <= 4) h.push(['📅', 'อีก ' + left + ' วันถึงวันที่ 1 — ค่าเช่า ค่าน้ำไฟ และงวดผ่อนจะถูกหักอัตโนมัติ (เตรียม ' + mon(G.rentOf(s.home.type) + G.billsOf()) + ' ขึ้นไป)', 'info']);
    if (s.groceries < 3 && s.meals < 2) h.push(['🥬', 'วัตถุดิบและอาหารที่ทำไว้ใกล้หมด', 'warn']);
    if (s.business && Math.abs(s.business.cashbox) > 800) h.push(['🏪', 'กิจการมีเงินสะสม ' + mon(s.business.cashbox) + ' รอเก็บ', 'info']);
    if (s.job && !info.off && !s.today.worked && !s.today.leave && !s.sick) h.push(['⏰', 'วันนี้ยังไม่ได้เข้างาน', 'warn']);
    if (s.love && s.love.stage !== 'single' && s.love.bond < 35) h.unshift(['💔', SK.NPCS[s.love.id].name + 'รู้สึกห่างเหิน — ใช้เวลาด้วยกันที่บ้านบ้างนะ', 'bad']);
    if (s.love && s.love.child && s.love.child.bond < 35) h.push(['🧸', s.love.child.name + 'คิดถึงคุณ — เล่นกับลูกที่บ้าน', 'warn']);
    if (s.fam && s.fam.bond < 30) h.push(['📱', 'ไม่ได้ติดต่อพ่อแม่นานแล้ว — โทรหาที่บ้านได้จากบ้านของฉัน', 'warn']);
    if (s.weather && s.weather.k === 'storm') h.push(['⛈️', 'พายุฝนฟ้าคะนอง กิจกรรมกลางแจ้งงดชั่วคราว', 'info']);
    if (s.ballot && s.ballot.kind === 'election' && !s.ballot.mine) h.unshift(['🗳️', 'เดือนนี้มีเลือกตั้งสภาเมือง! ไปใช้สิทธิ์ที่ที่ว่าการเมือง', 'info']);
    return h.slice(0, 5);
  };

  UI.viewMap = function () {
    var s = S(), out = '<div class="skywrap">' + UI.skyline(s) + '<div class="skytxt"><b>สุขนคร</b><span>ประชากร ' + fm(s.city.pop) + ' คน • คะแนนเมือง ' + Math.round(G.cityScore()) + '</span></div></div>';
    var hs = UI.hints();
    if (hs.length) out += '<div class="hints">' + hs.map(function (x) { return '<div class="hint ' + x[2] + '"><span>' + x[0] + '</span><p>' + esc(x[1]) + '</p></div>'; }).join('') + '</div>';
    out += '<div class="quick"><button class="btn pri" data-act="run" data-v="1">▶ ทำตามกิจวัตร 1 วัน</button><div class="sec"><button class="btn" data-act="run" data-v="7">⏩ 7 วัน</button><button class="btn" data-act="run" data-v="30">⏭ 30 วัน</button><button class="btn" data-act="routine">⚙️ กิจวัตร</button><button class="btn" data-act="sleep">🌙 จบวัน</button></div></div>';
    SK.ZONES.forEach(function (z) {
      var locs = SK.LOCS.filter(function (l) { return l.zone === z; });
      out += '<section class="zone"><h3>' + z + '</h3><div class="locgrid">';
      locs.forEach(function (l) {
        var closed = G.closedReason(l.id), np = G.npcsAt(l.id), badge = '';
        if (l.id === 'jobs' && s.openings.length && !s.job) badge = chip(s.openings.length + ' ตำแหน่ง', 'info');
        if (l.id === 'townhall' && s.ballot && !s.ballot.mine) badge = chip('โหวต!', 'info');
        if (l.id === 'work' && !s.job) badge = chip('ยังไม่มีงาน', '');
        if (l.id === 'work' && s.job && !s.today.worked && !SK.dayInfo(s.day).off) badge = chip('ถึงเวลาทำงาน', 'info');
        if (l.id === 'biz' && s.business && Math.abs(s.business.cashbox) > 800) badge = chip('มีเงินรอเก็บ', 'info');
        out += '<button class="loc' + (closed ? ' closed' : '') + (s.at === l.id ? ' here' : '') + '" data-act="loc" data-v="' + l.id + '"><span class="li">' + SK.locIcon(l.id, s) + '</span><b>' + esc(SK.locName(l.id, s)) + '</b>' +
          '<small>' + (closed ? '🔒 ' + closed : esc(l.desc)) + '</small><span class="lnp">' + np.map(function (id) { return SK.NPCS[id].icon; }).join('') + '</span>' + badge + '</button>';
      });
      out += '</div></section>';
    });
    return out;
  };

  // ======================================================================
  //  แท็บ: สถานที่
  // ======================================================================
  function actionRow(a, locId, why) {
    var meta = [];
    if (a.slots > 0) meta.push('⏱ ' + a.slots + ' ช่วง');
    if (a.cost > 0) meta.push('฿' + fm(a.cost));
    if (a.energy > 0) meta.push('⚡ −' + Math.round(a.energy));
    if (a.energy < 0) meta.push('⚡ +' + Math.round(-a.energy));
    return '<button class="act' + (why ? ' off' : '') + '" data-act="do" data-loc="' + locId + '" data-key="' + esc(a.key) + '"' + (why ? ' aria-disabled="true"' : '') + '>' +
      '<span class="ai">' + a.icon + '</span><span class="at"><b>' + esc(a.name) + '</b><small>' + esc(a.desc) + '</small>' +
      (why ? '<em>' + esc(why) + '</em>' : '') + '</span><span class="am">' + meta.map(function (m) { return '<i>' + m + '</i>'; }).join('') + '</span></button>';
  }

  UI.viewLoc = function (id) {
    var s = S(), loc = SK.LOC[id], acts = SK.getActions(id), out = '';
    var closed = G.closedReason(id);
    out += '<div class="lochead"><button class="back" data-act="back">← แผนที่</button><div><h2>' + SK.locIcon(id, s) + ' ' + esc(SK.locName(id, s)) + '</h2><p>' + esc(loc.desc) + '</p></div></div>';
    if (closed) out += '<div class="hint warn"><span>🔒</span><p>' + closed + ' — บริการเคาน์เตอร์ใช้ไม่ได้ในตอนนี้ (ตู้ ATM ยังใช้ได้)</p></div>';
    if (id === 'work' && s.job) {
      var j = s.job, T = SK.TRACKS[j.track];
      out += '<div class="card jobcard"><b>' + T.icon + ' ' + T.titles[j.level] + '</b><small>' + esc(j.company) + ' • ค่าแรง ' + mon(G.wageOf(j)) + '/กะ • ผลงาน ' + Math.round(j.perf) + '/100 • เข้างาน ' + j.shifts + ' กะ • ขาดงาน ' + j.absences + ' • วันลาเหลือ ' + j.leaveLeft + '</small><div class="mini"><i style="width:' + C(j.shiftsAtLevel / G.promoNeed(j).shifts * 100, 0, 100) + '%"></i></div><small>ความคืบหน้าสู่การเลื่อนตำแหน่ง ' + Math.min(j.shiftsAtLevel, G.promoNeed(j).shifts) + '/' + G.promoNeed(j).shifts + ' กะ</small></div>';
    }
    if (id === 'bank') {
      out += '<div class="card"><b>🏦 ภาพรวมการเงิน</b><div class="kv"><span>เงินสด</span><b>' + mon(s.cash) + '</b><span>เงินฝาก</span><b>' + mon(s.bank) + '</b><span>กองทุน</span><b>' + mon(G.fundValue()) + '</b><span>หนี้</span><b>' + mon(G.totalDebt()) + '</b><span>คะแนนเครดิต</span><b>' + Math.round(s.credit) + '/100</b></div></div>';
    }
    if (id === 'townhall' && s.ballot) {
      out += '<div class="card"><b>🗳️ ประชามติเดือน' + s.ballot.label + '</b><small>ชาวเมืองทุกคนลงคะแนนได้ 1 เสียง ผลประกาศต้นเดือนหน้า โครงการที่ชนะจะใช้งบเมืองและเริ่มดำเนินการทันที</small></div>';
    }
    var i = 0, lastGroup = null, openGroup = false;
    while (i < acts.length) {
      var a = acts[i];
      if (a.group !== lastGroup) {
        if (openGroup) out += '</div></section>';
        lastGroup = a.group;
        if (a.npc) {
          var n = SK.NPCS[a.npc], r = G.relObj(a.npc);
          out += '<section class="grp npcg"><div class="npc"><span class="nav">' + n.icon + '</span><div><b>' + n.name + '</b> <small>' + n.role + ' • ' + Math.floor(G.npcAge(a.npc)) + ' ปี</small><div class="rel"><div class="bt"><i style="width:' + C(r.v, 0, 100) + '%"></i></div><span>' + relLevel(r.v) + ' ' + Math.round(r.v) + '</span></div><small class="perk ' + (s.perks[n.perk.id] ? 'on' : '') + '">' + (s.perks[n.perk.id] ? '⭐ ' : '🔒 สนิท ' + n.perk.at + ' ปลดล็อก: ') + n.perk.text + '</small></div></div><div class="actlist">';
        } else {
          out += '<section class="grp"><h4>' + esc(a.group) + '</h4><div class="actlist">';
        }
        openGroup = true;
      }
      out += actionRow(a, id, G.whyNot(id, a));
      i++;
    }
    if (openGroup) out += '</div></section>';
    if (!acts.length) out += '<p class="empty">ยังไม่มีกิจกรรมที่นี่</p>';
    return out;
  };

  // ======================================================================
  //  แท็บ: ฉัน
  // ======================================================================
  UI.viewMe = function () {
    var s = S(), H = SK.HOUSING[s.home.type], out = '';
    var path = SK.PATHS[s.path], goal = SK.GOALS[s.goal];
    out += '<div class="card prof"><div class="pav">' + esc(s.avatar) + '</div><div><h2>' + esc(s.name) + '</h2><p>' + path.icon + ' ' + path.name + ' • เป้าหมาย: ' + goal.icon + ' ' + goal.name + '</p><p class="muted">อายุ ' + Math.floor(s.age || 0) + ' ปี (' + G.lifeStageOf(s.age || 0) + ')' + (s.retired ? ' • เกษียณแล้ว' : '') + ((s.stats.generation || 1) > 1 ? ' • รุ่นที่ ' + s.stats.generation : '') + ' • วุฒิ: ' + SK.EDU[s.edu] + ' • แต้มพลเมือง ' + Math.round(s.civic) + '</p></div></div>';
    out += '<div class="card"><h3>สภาพร่างกายและจิตใจ</h3><div class="bars2">' + bar('พลังงาน', '⚡', s.energy, 'en') + bar('อิ่ม', '🍚', s.sat, 'sa') + bar('สุขภาพ', '❤️', s.health, 'he') + bar('อารมณ์', '😊', s.mood, 'mo') + bar('ความฟิต', '💪', s.fitness, 'fi') + bar('อาหารสมดุล', '🥗', s.diet, 'di') + '</div>' +
      '<p class="muted">กล่องอาหารที่ทำไว้ ' + s.meals + ' • วัตถุดิบ ' + s.groceries + ' ชุด • ของฝาก ' + s.gifts + (s.pet ? ' • 🐱 เลี้ยงแมว' : '') + '</p></div>';
    out += '<div class="card"><h3>ทักษะ</h3>' + Object.keys(SK.SKILLS).map(function (k) { return '<div class="skill"><span>' + SK.SKILLS[k].icon + ' ' + SK.SKILLS[k].name + '</span><div class="bt"><i style="width:' + s.skills[k] + '%"></i></div><b>' + Math.floor(s.skills[k]) + '</b></div>'; }).join('');
    out += '<p class="muted">ใบรับรอง: ' + (s.certs.length ? s.certs.map(function (c) { return SK.CERTS[c]; }).join(', ') : 'ยังไม่มี') + '</p>';
    var prog = SK.COURSES.filter(function (c) { return (s.courses[c.id] || 0) > 0 && !SK.H.courseDone(s, c); });
    if (prog.length) out += '<p class="muted">กำลังเรียน: ' + prog.map(function (c) { return c.name + ' (' + s.courses[c.id] + '/' + c.sessions + ')'; }).join(' • ') + '</p>';
    out += '</div>';
    out += '<div class="card"><h3>งาน กิจการ และที่อยู่</h3>';
    if (s.job) { var T = SK.TRACKS[s.job.track]; out += '<p>' + T.icon + ' <b>' + T.titles[s.job.level] + '</b> ที่ ' + esc(s.job.company) + ' — ' + mon(G.wageOf(s.job)) + '/กะ</p>'; } else out += '<p>💼 ยังไม่มีงานประจำ</p>';
    if (s.business) { var B = SK.BIZ[s.business.type]; out += '<p>' + B.icon + ' <b>' + B.name + '</b> ระดับ ' + s.business.level + ' • คุณภาพ ' + Math.round(s.business.quality) + ' • พนักงาน ' + s.business.staff + ' • เงินสะสม ' + mon(s.business.cashbox) + '</p>'; }
    out += '<p>' + H.icon + ' <b>' + H.name + '</b>' + (SK.RENT_KEYS.indexOf(s.home.type) >= 0 ? ' — ค่าเช่า ' + mon(G.rentOf(s.home.type)) + '/เดือน' : '') + '</p>';
    var mode = { walk: '🚶 เดินเท้า', bike: '🚲 จักรยาน', bus: '🚌 รถเมล์/รถไฟฟ้า', car: '🚗 รถยนต์' }[G.effMode()];
    out += '<p>การเดินทาง: ' + mode + '</p>';
    var invs = SK.ITEMS.filter(function (it) { return s.inv[it.id]; });
    out += '<p>ของใช้: ' + (invs.length ? invs.map(function (it) { return it.icon + ' ' + it.name; }).join(' • ') : 'ยังไม่มี') + '</p></div>';
    if (s.fam) {
      var L = s.love;
      out += '<div class="card"><h3>ครอบครัว</h3><div class="skill"><span>👨‍👩‍👧 พ่อแม่</span><div class="bt"><i style="width:' + s.fam.bond + '%"></i></div><b>' + Math.round(s.fam.bond) + '</b></div>';
      if (L.stage !== 'single') out += '<div class="skill"><span>' + (L.stage === 'married' ? '💍 ' : '💞 ') + SK.NPCS[L.id].name + '</span><div class="bt"><i style="width:' + L.bond + '%"></i></div><b>' + Math.round(L.bond) + '</b></div>';
      if (L.child) out += '<div class="skill"><span>👶 ' + esc(L.child.name) + ' (' + Math.floor(G.childAge(s)) + ' ขวบ • ' + G.childStage(s) + ')</span><div class="bt"><i style="width:' + L.child.bond + '%"></i></div><b>' + Math.round(L.child.bond) + '</b></div>';
      if (L.babyDue >= 0) out += '<p class="muted">🤰 กำลังจะมีลูกในอีก ' + Math.max(0, L.babyDue - s.day) + ' วัน</p>';
      out += '<p class="muted">' + (L.stage === 'single' ? 'โสด — คนที่คบหาได้: ' + SK.NPC_KEYS.filter(function (id) { return SK.NPCS[id].dateable; }).map(function (id) { return SK.NPCS[id].icon + ' ' + SK.NPCS[id].name; }).join(', ') + ' • สนิท 40 ชวนเดทได้' : L.stage === 'married' ? 'แต่งงานแล้ว ' + (s.day - L.since) + ' วัน' : 'คบกันมา ' + (s.day - L.since) + ' วัน') + '</p>';
      (G.grownKids ? G.grownKids() : []).forEach(function (id) { out += '<div class="skill"><span>🎓 ' + SK.NPCS[id].name + ' (' + Math.floor(G.npcAge(id)) + ')</span><div class="bt"><i style="width:' + G.rel(id) + '%"></i></div><b>' + Math.round(G.rel(id)) + '</b></div>'; });
      if (s.job && s.job.boss) out += '<p class="muted">ที่ทำงาน: หัวหน้า ' + esc(s.job.boss.name) + ' (' + Math.round(s.job.boss.rel) + ') • เพื่อนร่วมงาน ' + esc(s.job.mate.name) + ' (' + Math.round(s.job.mate.rel) + ')</p>';
      out += '</div>';
    }
    out += '<div class="card"><h3>เพื่อนและคนรู้จัก</h3>';
    var any = false;
    SK.NPC_KEYS.forEach(function (id) {
      var n = SK.NPCS[id], r = s.rel[id];
      if (!r || r.v <= 0) return;
      any = true;
      if (s.pop2 && s.pop2.gone[id]) return;
      out += '<div class="skill"><span>' + n.icon + ' ' + n.name + ' <small>' + Math.floor(G.npcAge(id)) + '</small></span><div class="bt"><i style="width:' + r.v + '%"></i></div><b>' + Math.round(r.v) + '</b></div>';
    });
    if (!any) out += '<p class="muted">ยังไม่ได้ผูกมิตรกับใคร — ลองไปคุยกับผู้คนในที่ต่างๆ ดูสิ</p>';
    var seenP = {}, perks = SK.NPC_KEYS.filter(function (id) { var pid = SK.NPCS[id].perk.id; if (!s.perks[pid] || seenP[pid] || G.rel(id) < SK.NPCS[id].perk.at) return false; seenP[pid] = 1; return true; });
    if (perks.length) out += '<p class="muted">สิทธิพิเศษ: ' + perks.map(function (id) { return SK.NPCS[id].icon + ' ' + SK.NPCS[id].perk.text; }).join(' • ') + '</p>';
    out += '</div>';
    return out;
  };

  // ======================================================================
  //  แท็บ: เงิน
  // ======================================================================
  UI.viewFin = function () {
    var s = S(), out = '';
    var nw = G.netWorth();
    out += '<div class="card hero"><small>ทรัพย์สินสุทธิ</small><h2>' + mon(nw) + '</h2><div class="kv"><span>เงินสด</span><b>' + mon(s.cash) + '</b><span>เงินฝาก</span><b>' + mon(s.bank) + '</b><span>กองทุน (' + s.fundUnits.toFixed(1) + ' หน่วย)</span><b>' + mon(G.fundValue()) + '</b><span>กองทุนสำรองเลี้ยงชีพ</span><b>' + mon(s.pension ? s.pension.bal : 0) + '</b><span>หนี้สินรวม</span><b>' + mon(G.totalDebt()) + '</b><span>ประกันสุขภาพ</span><b>' + (s.ins && s.ins.health ? '✔ คุ้มครอง' : '—') + '</b><span>สลากที่ถืออยู่</span><b>' + (s.lotto ? s.lotto.tickets : 0) + ' ใบ</b><span>คะแนนเครดิต</span><b>' + Math.round(s.credit) + '/100</b></div></div>';
    var rentDue = G.rentOf(s.home.type), bills = G.billsOf() + (s.pet ? 450 : 0) + (s.inv.car ? 1200 : 0) + (s.home.type === 'own' ? 400 : 0) + (s.ins && s.ins.health ? 450 : 0) + (s.love && s.love.child ? G.childCost() : 0) + (s.love && s.love.stage === 'married' ? 3000 : 0);
    var loanSum = 0; s.loans.forEach(function (l) { loanSum += l.monthly; });
    out += '<div class="card"><h3>ภาระประจำเดือน (หักวันที่ 1)</h3><div class="kv"><span>ค่าเช่า</span><b>' + mon(rentDue) + '</b><span>น้ำ ไฟ ประกัน ครอบครัว ฯลฯ</span><b>' + mon(bills) + '</b><span>ผ่อนชำระหนี้</span><b>' + mon(loanSum) + '</b><span><strong>รวมประมาณ</strong></span><b>' + mon(rentDue + bills + loanSum) + '</b></div>' +
      (s.arrears.rent > 0 ? '<p class="warnline">⚠️ ค้างค่าเช่า ' + mon(s.arrears.rent) + '</p>' : '') + '<p class="muted">เงินเดือนจ่ายทุกวันจันทร์ สำหรับกะที่ทำในสัปดาห์ก่อน (ยอดรอจ่าย ' + mon(s.weekPay) + ')</p></div>';
    if (s.loans.length) {
      out += '<div class="card"><h3>หนี้สิน</h3>' + s.loans.map(function (l) { return '<div class="loan"><b>' + esc(l.name) + '</b><span>คงเหลือ ' + mon(l.principal) + ' • ดอกเบี้ย ' + l.rate + '% • งวดละ ' + mon(l.monthly) + ' • เหลือ ' + Math.max(0, l.months) + ' งวด</span></div>'; }).join('') + '</div>';
    }
    out += '<div class="card"><h3>สรุปรายเดือน</h3>';
    var cur = { label: 'เดือนนี้ (ยังไม่จบ)', inc: s.month.inc, exp: s.month.exp };
    out += stmtHTML(cur, true);
    s.statements.slice(0, 4).forEach(function (st) { out += stmtHTML(st, false); });
    if (!s.statements.length) out += '<p class="muted">ใบสรุปเดือนจะปรากฏเมื่อครบเดือนแรก</p>';
    return out + '</div>';
  };
  function stmtHTML(st, open) {
    var inc = 0, exp = 0, k;
    for (k in st.inc) inc += st.inc[k];
    for (k in st.exp) exp += st.exp[k];
    var rows = '';
    Object.keys(st.inc).forEach(function (k) { rows += '<tr><td>' + esc(k) + '</td><td class="pos">+' + fm(st.inc[k]) + '</td></tr>'; });
    Object.keys(st.exp).sort(function (a, b) { return st.exp[b] - st.exp[a]; }).forEach(function (k) { rows += '<tr><td>' + esc(k) + '</td><td class="neg">−' + fm(st.exp[k]) + '</td></tr>'; });
    return '<details class="stmt"' + (open ? ' open' : '') + '><summary><b>' + esc(st.label) + '</b><span class="' + (inc - exp >= 0 ? 'pos' : 'neg') + '">' + (inc - exp >= 0 ? '+' : '−') + fm(Math.abs(inc - exp)) + '</span></summary><table>' + (rows || '<tr><td>—</td><td></td></tr>') + '<tr class="tot"><td>รายรับรวม / รายจ่ายรวม</td><td>' + fm(inc) + ' / ' + fm(exp) + '</td></tr></table></details>';
  }

  // ======================================================================
  //  แท็บ: สถิติเมือง
  // ======================================================================
  UI.viewCity = function () {
    var s = S(), c = s.city, out = '';
    var past = c.hist.length > 3 ? c.hist[Math.max(0, c.hist.length - 5)] : null;
    out += '<div class="card hero"><small>คะแนนเมืองโดยรวม</small><h2>' + Math.round(G.cityScore()) + '<span>/100</span></h2><div class="kv"><span>ประชากร</span><b>' + fm(c.pop) + ' คน</b><span>งบคงคลังเมือง</span><b>' + fm(c.treasury) + ' ล้านบาท</b><span>โครงการที่ทำแล้ว</span><b>' + c.policies.length + ' โครงการ</b></div>' + (c.treasury < 0 ? '<p class="warnline">⚠️ งบเมืองติดลบ บริการสาธารณะกำลังชะลอและความไว้วางใจตกลง</p>' : '') + '</div>';
    out += '<div class="card"><h3>ตัวชี้วัดชีวิตเมือง</h3><div class="metrics">' + SK.MKEYS.map(function (k) { return metricBar(k, c.m[k], past ? c.m[k] - past.m[k] : 0); }).join('') + '</div><p class="muted">ทุกตัวชี้วัดส่งผลถึงกัน เช่น งานดี→เศรษฐกิจดี→งบเมืองเพิ่ม→บริการสาธารณะดีขึ้น งานและการใช้ชีวิตของคุณก็ส่งผลต่อเมืองนี้ด้วย</p></div>';
    out += '<div class="card"><h3>ระดับงบประมาณ (0–4)</h3><div class="budget">' + SK.MKEYS.map(function (k) { return '<span>' + SK.METRICS[k].icon + ' ' + SK.METRICS[k].name + ' <b>' + c.budget[k] + '</b></span>'; }).join('') + '</div><p class="muted">เปลี่ยนได้ผ่านประชามติ (ข้อเสนอ "เพิ่มงบ" ปรากฏเมื่อเมืองมีเงินเหลือ)</p></div>';
    var l = c.ledger;
    out += '<div class="card"><h3>ผลงานของคุณต่อเมือง</h3><div class="kv"><span>ภาษีที่คุณจ่าย</span><b>' + mon(l.taxPaid) + '</b><span>จากการทำงาน</span><b>+' + (l.work || 0).toFixed(1) + ' แต้ม</b><span>จากงานอาสา</span><b>+' + (l.volunteer || 0).toFixed(1) + ' แต้ม</b><span>จากการบริจาค</span><b>+' + (l.donated || 0).toFixed(1) + ' แต้ม</b><span>แต้มพลเมือง</span><b>' + Math.round(s.civic) + '</b></div></div>';
    if (c.policies.length) out += '<div class="card"><h3>โครงการของเมือง</h3>' + c.policies.map(function (id) { var p = SK.POLICY[id]; return '<p>' + p.icon + ' ' + p.name + '</p>'; }).join('') + '</div>';
    if (s.ballot) out += '<div class="card"><h3>' + (s.ballot.kind === 'election' ? '🗳️ เลือกตั้งสภาเมือง' : 'ประชามติเดือน' + s.ballot.label) + '</h3>' + s.ballot.opts.map(function (id) { var p = SK.POLICY[id]; return '<p>' + p.icon + ' <b>' + p.name + '</b><br><small>' + p.text + (p.election ? '' : ' • งบ ' + p.cost + ' ล้านบาท') + '</small></p>'; }).join('') + '<p class="muted">' + (s.ballot.mine ? '✔ คุณโหวตแล้ว' : 'ไปโหวตได้ที่ที่ว่าการเมือง') + '</p></div>';
    return out;
  };

  // ======================================================================
  //  แท็บ: บันทึก / ข่าว / ความสำเร็จ
  // ======================================================================
  UI.viewJournal = function () {
    var s = S(), out = '<div class="seg"><button class="' + (UI.jtab === 'log' ? 'on' : '') + '" data-act="jtab" data-v="log">บันทึกชีวิต</button><button class="' + (UI.jtab === 'news' ? 'on' : '') + '" data-act="jtab" data-v="news">ข่าวเมือง</button><button class="' + (UI.jtab === 'ach' ? 'on' : '') + '" data-act="jtab" data-v="ach">ความสำเร็จ ' + Object.keys(s.ach).length + '/' + SK.ACHIEVEMENTS.length + '</button></div>';
    function when(d) { var dt = SK.dateOf(d); return dt.d + ' ' + SK.MONTHS_S[dt.m]; }
    if (UI.jtab === 'log') {
      out += '<ul class="feed">' + s.log.slice(0, 80).map(function (e) { return '<li class="' + e.tone + '"><time>' + when(e.d) + '</time><span>' + esc(e.m) + '</span></li>'; }).join('') + '</ul>';
    } else if (UI.jtab === 'news') {
      out += '<ul class="feed">' + s.news.slice(0, 60).map(function (e) { return '<li class="' + e.k + '"><time>' + when(e.d) + '</time><span>' + (e.k === 'me' ? '👤 ' : '📰 ') + esc(e.m) + '</span></li>'; }).join('') + '</ul>';
    } else {
      out += '<div class="achgrid">' + SK.ACHIEVEMENTS.map(function (a) { var got = s.ach[a.id] != null; return '<div class="ach ' + (got ? 'got' : '') + '"><span>' + (got ? a.icon : '🔒') + '</span><b>' + a.name + '</b><small>' + a.desc + '</small></div>'; }).join('') + '</div>';
    }
    return out;
  };

  // ======================================================================
  //  แท็บ: เมนู
  // ======================================================================
  UI.viewMenu = function () {
    var s = S();
    return '<div class="card"><h3>กิจวัตรและการเล่น</h3><button class="btn wide" data-act="routine">⚙️ ตั้งกิจวัตรประจำวัน</button>' +
      '<label class="chk"><input type="checkbox" data-act="autoev" ' + (s.flags.autoEv ? 'checked' : '') + '> ให้ระบบตัดสินใจเหตุการณ์ทั่วไปแทนอัตโนมัติ (ใช้ตอนรันกิจวัตรหลายวัน)</label>' +
      '<label class="rsel"><span>⏳ ความเร็วอายุ</span><select data-act="agerate">' + [[1, 'ตามจริง (1 ปีเกม = 1 ปี)'], [5, 'เร็ว (1 ปีเกม = 5 ปี) — แนะนำ'], [10, 'เร็วมาก (1 ปีเกม = 10 ปี)']].map(function (o) { return '<option value="' + o[0] + '"' + (s.ageRate === o[0] ? ' selected' : '') + '>' + o[1] + '</option>'; }).join('') + '</select></label>' +
      '<button class="btn wide" data-act="help">📖 วิธีเล่น</button></div>' +
      '<div class="card"><h3>บันทึกเกม</h3><p class="muted">เกมบันทึกอัตโนมัติทุกวัน ในเบราว์เซอร์ของคุณ</p><button class="btn wide" data-act="savenow">💾 บันทึกตอนนี้</button><button class="btn wide" data-act="export">📤 ส่งออกไฟล์เซฟ</button><button class="btn wide" data-act="import">📥 นำเข้าไฟล์เซฟ</button></div>' +
      '<div class="card"><h3>อื่นๆ</h3><button class="btn wide" data-act="yearsum">🏁 ดูคะแนนและเกรดตอนนี้</button><button class="btn wide danger" data-act="newgame">🔄 เริ่มเกมใหม่ (ลบเซฟเดิม)</button><p class="muted">สุขนคร v2.2 • เกมเมืองอุดมคติในโลกปัจจุบัน • ตัวละครและเหตุการณ์ทั้งหมดเป็นเรื่องสมมติ</p></div>';
  };

  // ======================================================================
  //  หน้าเริ่มเกม / สร้างตัวละคร
  // ======================================================================
  UI.viewTitle = function () {
    var fake = { slot: 1, city: { m: { environment: 78 }, pop: SK.BASE_POP } };
    return '<main class="title"><div class="skywrap big">' + UI.skyline(fake) + '</div><div class="tcard"><h1>สุขนคร</h1><p class="tag">เกมใช้ชีวิตในเมืองอุดมคติ ที่ทุกวงจรเชื่อมถึงกัน</p>' +
      '<p class="desc">คุณคือชาวเมืองคนหนึ่งในโลกปัจจุบัน ทำงาน ออม เรียนรู้ ดูแลสุขภาพ ผูกมิตร และร่วมโหวตอนาคตเมือง — ทุกการกระทำของคุณส่งผลต่อเมืองทั้งเมือง</p>' +
      '<button class="btn pri big" data-act="newcreate">✨ เริ่มชีวิตใหม่</button>' +
      (G.hasSave() ? '<button class="btn big" data-act="continue">▶ เล่นต่อจากที่บันทึกไว้</button>' : '') +
      '<button class="btn ghost" data-act="help">📖 วิธีเล่น</button><button class="btn ghost" data-act="import">📥 นำเข้าไฟล์เซฟ</button>' +
      '<small class="foot">เล่นฟรี ทำงานในเบราว์เซอร์ ไม่เก็บข้อมูลส่วนตัว • ข้อมูลเซฟอยู่ในเครื่องคุณเท่านั้น</small></div></main>';
  };
  UI.viewCreate = function () {
    var c = UI.create, out = '<main class="create"><div class="tcard"><h2>สร้างตัวละครของคุณ</h2>' +
      '<label class="fld">ชื่อ<input id="cname" maxlength="20" placeholder="เช่น ใบบัว" value="' + esc(c.name) + '"></label>' +
      '<div class="fld">หน้าตา<div class="avs">' + SK.AVATARS.map(function (a) { return '<button class="avb ' + (c.avatar === a ? 'on' : '') + '" data-act="cav" data-v="' + a + '">' + a + '</button>'; }).join('') + '</div></div>' +
      '<div class="fld">ที่มาของคุณ<div class="opts">' + Object.keys(SK.PATHS).map(function (k) { var p = SK.PATHS[k]; return '<button class="opt ' + (c.path === k ? 'on' : '') + '" data-act="cpath" data-v="' + k + '"><span>' + p.icon + '</span><b>' + p.name + '</b><small>' + p.desc + '</small></button>'; }).join('') + '</div></div>' +
      '<div class="fld">เป้าหมายชีวิต (มีผลต่อคะแนนสุดท้าย)<div class="opts">' + Object.keys(SK.GOALS).map(function (k) { var p = SK.GOALS[k]; return '<button class="opt ' + (c.goal === k ? 'on' : '') + '" data-act="cgoal" data-v="' + k + '"><span>' + p.icon + '</span><b>' + p.name + '</b><small>' + p.desc + '</small></button>'; }).join('') + '</div></div>' +
      '<button class="btn pri big" data-act="start">🏙️ เข้าสู่สุขนคร</button><button class="btn ghost" data-act="totitle">← กลับ</button></div></main>';
    return out;
  };

  // ======================================================================
  //  เรนเดอร์หลัก
  // ======================================================================
  UI.render = function () {
    var root = $('#app'), keepScroll = window.scrollY, html = '';
    if (UI.screen === 'title') html = UI.viewTitle();
    else if (UI.screen === 'create') html = UI.viewCreate();
    else {
      var body = '';
      if (UI.tab === 'map') body = UI.loc ? UI.viewLoc(UI.loc) : UI.viewMap();
      else if (UI.tab === 'me') body = UI.viewMe();
      else if (UI.tab === 'fin') body = UI.viewFin();
      else if (UI.tab === 'city') body = UI.viewCity();
      else if (UI.tab === 'journal') body = UI.viewJournal();
      else body = UI.viewMenu();
      var tabs = [['map', '🗺️', 'เมือง'], ['me', '👤', 'ฉัน'], ['fin', '💰', 'เงิน'], ['city', '📊', 'สถิติเมือง'], ['journal', '📜', 'บันทึก'], ['menu', '☰', 'เมนู']];
      html = UI.hud() + '<main class="view" id="view">' + body + '</main><nav class="tabs" aria-label="เมนูหลัก">' + tabs.map(function (t) { return '<button class="' + (UI.tab === t[0] ? 'on' : '') + '" data-act="tab" data-v="' + t[0] + '"><i>' + t[1] + '</i><span>' + t[2] + '</span></button>'; }).join('') + '</nav>';
    }
    root.innerHTML = html;
    window.scrollTo(0, UI._resetScroll ? 0 : keepScroll);
    UI._resetScroll = false;
  };

  // ======================================================================
  //  Toast / Modal
  // ======================================================================
  UI.toast = function (msg, tone) {
    var box = $('#toasts');
    if (!box) return;
    var el = document.createElement('div');
    el.className = 'toast ' + (tone || 'n');
    el.textContent = msg;
    box.appendChild(el);
    while (box.children.length > 3) box.removeChild(box.firstChild);
    setTimeout(function () { el.classList.add('out'); setTimeout(function () { if (el.parentNode) el.parentNode.removeChild(el); }, 400); }, 3800);
  };
  UI.showMsgs = function (res) {
    var ms = G.msgs.slice(-3);
    if (!ms.length && res && res.msg) ms = [{ m: res.msg, tone: 'n' }];
    if (!ms.length && res && !res.ok) ms = [{ m: res.msg, tone: 'bad' }];
    ms.forEach(function (x) { if (x.m) UI.toast(x.m, x.tone); });
  };
  UI.modal = function (html, cls) {
    var m = $('#modal');
    m.className = 'modal show ' + (cls || '');
    m.innerHTML = '<div class="sheet" role="dialog" aria-modal="true">' + html + '</div>';
    UI.mdl = cls || 'x';
    var f = m.querySelector('button, input');
    if (f) f.focus({ preventScroll: true });
  };
  UI.closeModal = function () {
    var m = $('#modal');
    m.className = 'modal'; m.innerHTML = ''; UI.mdl = null;
  };
  UI.confirm = function (msg, yes) {
    UI._yes = yes;
    UI.modal('<h3>ยืนยัน</h3><p>' + esc(msg) + '</p><div class="row"><button class="btn" data-act="mclose">ยกเลิก</button><button class="btn pri" data-act="myes">ตกลง</button></div>', 'confirm');
  };

  UI.eventModal = function () {
    var v = G.eventView();
    if (!v) return;
    UI.modal('<div class="evh"><span>' + v.icon + '</span><h3>' + esc(v.title) + '</h3></div><p class="evt">' + esc(v.text) + '</p><div class="evc">' +
      v.choices.map(function (c) { return '<button class="choice' + (c.disabled ? ' off' : '') + '" data-act="evc" data-i="' + c.i + '"' + (c.disabled ? ' aria-disabled="true"' : '') + '><b>' + esc(c.label) + '</b>' + (c.cost ? '<i>฿' + fm(c.cost) + '</i>' : '') + (c.disabled ? '<em>' + esc(c.reason) + '</em>' : '') + '</button>'; }).join('') + '</div>', 'event');
  };

  UI.statementModal = function () {
    var s = S(), st = s.statements[0];
    if (!st) return;
    var rows = '', k;
    Object.keys(st.inc).forEach(function (k) { rows += '<tr><td>' + esc(k) + '</td><td class="pos">+' + fm(st.inc[k]) + '</td></tr>'; });
    Object.keys(st.exp).sort(function (a, b) { return st.exp[b] - st.exp[a]; }).forEach(function (k) { rows += '<tr><td>' + esc(k) + '</td><td class="neg">−' + fm(st.exp[k]) + '</td></tr>'; });
    UI.modal('<h3>🧾 สรุปเดือน' + esc(st.label) + '</h3><table class="stable">' + rows + '<tr class="tot"><td>สุทธิ</td><td class="' + (st.net >= 0 ? 'pos' : 'neg') + '">' + (st.net >= 0 ? '+' : '−') + fm(Math.abs(st.net)) + '</td></tr></table>' +
      (st.warn.length ? '<div class="hint bad"><span>⚠️</span><p>' + st.warn.map(esc).join('<br>') + '</p></div>' : '') +
      '<p class="muted">ยอดคงเหลือ: เงินสด ' + mon(s.cash) + ' • เงินฝาก ' + mon(s.bank) + '</p>' +
      '<div class="row"><button class="btn pri" data-act="mclose">รับทราบ</button></div>', 'stmt');
  };

  UI.scoreHTML = function () {
    var r = G.scores(), s = S();
    var rows = [['wealth', '💰 ความมั่งคั่ง'], ['wellbeing', '🌿 ความสุขและสุขภาพ'], ['knowledge', '📖 ความรู้'], ['social', '🫂 มิตรภาพ'], ['civic', '🏛️ พลเมืองดี'], ['city', '🏙️ ความสุขของเมือง']];
    return '<div class="grade g' + r.grade + '"><span>' + r.grade + '</span><small>คะแนนรวม ' + Math.round(r.total) + '/100</small></div><div class="scores">' + rows.map(function (x) { return '<div class="skill"><span>' + x[1] + '</span><div class="bt"><i style="width:' + Math.round(r[x[0]]) + '%"></i></div><b>' + Math.round(r[x[0]]) + '</b></div>'; }).join('') + '</div>' +
      '<p class="muted">ทรัพย์สินสุทธิ ' + mon(G.netWorth()) + ' • วุฒิ ' + SK.EDU[s.edu] + ' • ความสำเร็จ ' + Object.keys(s.ach).length + '/' + SK.ACHIEVEMENTS.length + ' • แต้มพลเมือง ' + Math.round(s.civic) + '</p>';
  };
  UI.yearModal = function (final) {
    var s = S();
    UI.modal('<h3>🎊 ' + (final ? 'ครบหนึ่งปีในสุขนคร!' : 'คะแนนชีวิตของคุณตอนนี้') + '</h3><p>' + (final ? 'เวลาผ่านไปหนึ่งปีเต็มแล้ว นี่คือผลลัพธ์ชีวิตของ ' + esc(s.name) + ' และเมืองที่คุณช่วยกันสร้าง' : 'ภาพรวมจนถึงวันนี้') + '</p>' + UI.scoreHTML() +
      '<div class="row">' + (final ? '<button class="btn pri" data-act="yearcont">▶ เล่นต่อปีที่ 2</button><button class="btn" data-act="newgame">เริ่มเกมใหม่</button>' : '<button class="btn pri" data-act="mclose">ปิด</button>') + '</div>', 'year');
  };

  UI.endModal = function () {
    var s = S();
    UI.modal('<h3>🌅 เรื่องราวของ ' + esc(s.name) + '</h3><p>ใช้ชีวิตในสุขนครจนอายุ ' + Math.floor(s.age || 0) + ' ปี' + ((s.stats.generation || 1) > 1 ? ' (รุ่นที่ ' + s.stats.generation + ' ของครอบครัว)' : '') + '</p>' + UI.scoreHTML() +
      '<div class="row"><button class="btn" data-act="mclose">ดูเมืองต่อ</button><button class="btn pri" data-act="newgame">เริ่มชีวิตใหม่</button></div>', 'year');
  };

  UI.routineModal = function () {
    var s = S(), r = s.routine;
    function sel(kind, i) { return '<label class="rsel"><span>' + SK.SLOT_ICON[i] + ' ' + SK.SLOTS[i] + '</span><select data-act="rsel" data-k="' + kind + '" data-i="' + i + '">' + SK.ROUTINE_OPTS.map(function (o) { return '<option value="' + o.id + '"' + (r[kind][i] === o.id ? ' selected' : '') + '>' + o.name + '</option>'; }).join('') + '</select></label>'; }
    var courses = SK.COURSES.filter(function (c) { return !SK.H.courseDone(s, c) && !SK.H.courseReqMiss(s, c).length; });
    UI.modal('<h3>⚙️ ตั้งกิจวัตรประจำวัน</h3><p class="muted">ใช้กับปุ่ม "ทำตามกิจวัตร" เมื่ออยากข้ามวันไปเร็วๆ ระบบจะกินข้าว พักผ่อน และทำสิ่งที่ตั้งไว้ให้ และหยุดเมื่อมีเหตุการณ์ให้ตัดสินใจ (การไปทำงานเต็มวันใช้ 2 ช่วง)</p>' +
      '<h4>วันทำงาน (จันทร์–ศุกร์)</h4>' + [0, 1, 2].map(function (i) { return sel('wd', i); }).join('') +
      '<h4>วันหยุด (เสาร์–อาทิตย์/วันหยุดนักขัตฤกษ์)</h4>' + [0, 1, 2].map(function (i) { return sel('we', i); }).join('') +
      '<h4>คอร์สที่อยากให้เรียนเป็นหลัก</h4><label class="rsel"><span>🎓 คอร์ส</span><select data-act="rcourse"><option value="">เลือกอัตโนมัติ</option>' + courses.map(function (c) { return '<option value="' + c.id + '"' + (s.flags.focusCourse === c.id ? ' selected' : '') + '>' + c.name + '</option>'; }).join('') + '</select></label>' +
      '<div class="row"><button class="btn pri" data-act="mclose">เสร็จสิ้น</button></div>', 'routine');
  };

  UI.helpModal = function () {
    UI.modal('<h3>📖 วิธีเล่นสุขนคร</h3><div class="help"><p><b>เป้าหมาย:</b> ใช้ชีวิตหนึ่งปีในเมืองอุดมคติ ให้ได้ทั้งฐานะ สุขภาพ ความรู้ มิตรภาพ และช่วยให้เมืองดีขึ้น</p>' +
      '<p><b>เวลา:</b> หนึ่งวันมี 3 ช่วง (เช้า บ่าย เย็น) แต่ละกิจกรรมใช้เวลา 0–2 ช่วง พอหมดวันจะนอนหลับโดยอัตโนมัติ</p>' +
      '<p><b>พื้นฐานชีวิต:</b> ดู ⚡พลังงาน 🍚ความอิ่ม ❤️สุขภาพ 😊อารมณ์ ให้สมดุล กินข้าววันละ ~3 มื้อ นอนให้พอ</p>' +
      '<p><b>เงิน:</b> เงินเดือนเข้าทุกวันจันทร์ ค่าเช่า/บิล/งวดผ่อนถูกหักวันที่ 1 ของเดือน อย่าให้เงินหมด!</p>' +
      '<p><b>งาน:</b> ไปศูนย์จัดหางานเพื่อสมัคร ต้องมีวุฒิ/ทักษะ/ใบรับรองตามตำแหน่ง เรียนที่วิทยาลัยชุมชนหรือฝึกเองที่ห้องสมุดเพื่อเลื่อนขั้น</p>' +
      '<p><b>เมือง:</b> ตัวชี้วัดของเมืองเชื่อมโยงกันและเปลี่ยนไปตามนโยบายที่ชาวเมืองโหวตทุกเดือน การทำงาน อาสา บริจาค และโหวตของคุณช่วยดันเมืองให้ดีขึ้น</p>' +
      '<p><b>ครอบครัวและความรัก:</b> โทรหาพ่อแม่จากบ้าน สนิทกับไผ่ ใบเฟิร์น หรือปลื้มจนชวนเดท คบหา แต่งงาน และมีลูกได้ ความสัมพันธ์ต้องดูแลสม่ำเสมอ</p>' +
      '<p><b>ชีวิตจริง:</b> อากาศเปลี่ยนทุกวัน มีหัวหน้าและเพื่อนร่วมงาน ประกันสุขภาพ กองทุนสำรองเลี้ยงชีพ สลาก ยื่นภาษีช่วง ม.ค.–มี.ค. และเลือกตั้งสภาเมืองทุกพฤศจิกายน</p>' +
      '<p><b>อายุและรุ่นต่อรุ่น:</b> ทุกคนแก่ตัวลง (ตั้งความเร็วได้ในเมนู) ชาวเมืองเรียนจบ แต่งงาน ย้ายเข้า-ออก และมีผู้สืบทอด ลูกโตตามวัยจนเป็นผู้ใหญ่ อายุ 55 เกษียณรับบำนาญได้ ถึงบั้นปลายเลือกเล่นต่อเป็นลูกได้</p>' +
      '<p><b>พูดคุย:</b> กด "พูดคุย" กับใครก็ได้แล้วเลือกหัวข้อ ถามชีวิต คุยเรื่องเมือง ขอคำแนะนำ ฟังเรื่องซุบซิบ และเมื่อสนิทจะได้ฟังเรื่องส่วนตัวของเขาทีละตอน</p>' +
      '<p><b>โลกที่มีชีวิต:</b> ชาวเมืองเป็นเพื่อนหรือทะเลาะกันเอง ร้านค้าเปิดปิดตามเศรษฐกิจ ราคาสินค้าขึ้นทุกปี ระวังโรคเรื้อรังและภาวะหมดไฟ ฝึกงานอดิเรกไปประกวดได้ และลงสมัครสภาเมือง/นายกฯ ได้ช่วง ก.ย.–ต.ค.</p>' +
      '<p><b>เล่นเร็ว:</b> กดปุ่ม "ทำตามกิจวัตร" เพื่อข้ามหลายวัน ระบบจะหยุดเมื่อมีเหตุการณ์ให้ตัดสินใจ</p>' +
      '<p><b>เซฟ:</b> บันทึกอัตโนมัติในเบราว์เซอร์ ส่งออกไฟล์เก็บไว้ได้จากเมนู</p></div><div class="row"><button class="btn pri" data-act="mclose">เข้าใจแล้ว</button></div>', 'help');
  };

  UI.importModal = function () {
    UI.modal('<h3>📥 นำเข้าไฟล์เซฟ</h3><p class="muted">วางข้อความเซฟที่ส่งออกไว้ลงในช่องด้านล่าง</p><textarea id="impbox" rows="6" placeholder="วางข้อความ JSON ที่นี่"></textarea><div class="row"><button class="btn" data-act="mclose">ยกเลิก</button><button class="btn pri" data-act="doimport">นำเข้า</button></div>', 'import');
  };
  UI.exportModal = function () {
    UI.modal('<h3>📤 ส่งออกไฟล์เซฟ</h3><p class="muted">คัดลอกข้อความนี้เก็บไว้ หรือกดดาวน์โหลดเป็นไฟล์</p><textarea id="expbox" rows="6" readonly>' + esc(G.exportJSON()) + '</textarea><div class="row"><button class="btn" data-act="mclose">ปิด</button><button class="btn" data-act="copyexp">คัดลอก</button><button class="btn pri" data-act="dlexp">ดาวน์โหลด</button></div>', 'export');
  };

  // ป๊อปอัปที่ต้องแสดงหลังมีการเปลี่ยนแปลง
  UI.popups = function () {
    var s = S();
    if (!s || UI.screen !== 'game') return;
    if (s.pendingEvent) { UI.eventModal(); return; }
    if (s.flags.newStatement) { s.flags.newStatement = false; UI.statementModal(); return; }
    if (s.flags.yearEnd && !s.flags.yearSeen) { UI.yearModal(true); return; }
    if (s.ended && !UI._endSeen) { UI._endSeen = true; UI.endModal(); return; }
  };

  UI.after = function (res) {
    UI.showMsgs(res);
    UI.render();
    if (UI.mdl === 'event' && !S().pendingEvent) UI.closeModal();
    if (!UI.mdl) UI.popups();
  };

  // ======================================================================
  //  จัดการเหตุการณ์คลิก
  // ======================================================================
  function startGame(fromLoad) {
    UI.screen = 'game'; UI.tab = 'map'; UI.loc = null; UI._resetScroll = true;
    UI.render(); UI.popups();
  }

  UI.onClick = function (e) {
    var t = e.target.closest('[data-act]');
    if (!t) return;
    var act = t.getAttribute('data-act'), v = t.getAttribute('data-v'), s = S();
    if (t.tagName === 'INPUT' || t.tagName === 'SELECT') return;
    switch (act) {
      case 'newcreate': UI.screen = 'create'; UI.render(); break;
      case 'totitle': UI.screen = 'title'; UI.render(); break;
      case 'cav': UI.create.name = ($('#cname') || {}).value || UI.create.name; UI.create.avatar = v; UI.render(); break;
      case 'cpath': UI.create.name = ($('#cname') || {}).value || UI.create.name; UI.create.path = v; UI.render(); break;
      case 'cgoal': UI.create.name = ($('#cname') || {}).value || UI.create.name; UI.create.goal = v; UI.render(); break;
      case 'start': {
        var nm = (($('#cname') || {}).value || UI.create.name || '').trim() || 'ชาวสุขนคร';
        G.newState({ name: nm, avatar: UI.create.avatar, path: UI.create.path, goal: UI.create.goal });
        G.save(); startGame();
        UI.helpModal();
        break;
      }
      case 'continue': if (G.load()) startGame(); else UI.toast('ไม่พบเซฟ', 'bad'); break;
      case 'tab': UI.tab = v; UI.loc = null; UI._resetScroll = true; UI.render(); break;
      case 'jtab': UI.jtab = v; UI.render(); break;
      case 'loc': UI.loc = v; UI._resetScroll = true; UI.render(); break;
      case 'back': UI.loc = null; UI._resetScroll = true; UI.render(); break;
      case 'do': {
        var locId = t.getAttribute('data-loc'), key = t.getAttribute('data-key');
        var a = SK.findAction(locId, key);
        if (!a) { UI.render(); break; }
        var why = G.whyNot(locId, a);
        if (why) { UI.toast(why, 'bad'); break; }
        var exec = function () {
          var res = G.perform(locId, key);
          if (res.ui) { UI.tab = res.ui; UI.loc = null; UI._resetScroll = true; UI.render(); return; }
          UI.after(res);
        };
        if (a.confirm) UI.confirm(a.confirm, exec); else exec();
        break;
      }
      case 'run': {
        var days = parseInt(v, 10), d0 = s.day;
        var r = SK.R.run(days);
        var why2 = { event: 'หยุดเพราะมีเหตุการณ์ให้ตัดสินใจ', month: 'หยุดเพื่อดูสรุปรายเดือน', year: 'ครบหนึ่งปีแล้ว!', health: 'หยุดเพราะสุขภาพต่ำ ควรพักผ่อนและดูแลตัวเอง' }[r.reason] || '';
        UI.toast('⏩ ผ่านไป ' + (s.day - d0) + ' วัน' + (why2 ? ' — ' + why2 : ''), r.reason === 'health' ? 'bad' : 'good');
        UI.after({ ok: true, msg: '' });
        break;
      }
      case 'sleep': UI.confirm('จบวันนี้และเข้านอนเลยไหม? (ช่วงเวลาที่เหลือจะถูกข้ามไป)', function () { G.msgs = []; G.sleepNow(); UI.after({ ok: true, msg: '' }); }); break;
      case 'routine': UI.routineModal(); break;
      case 'help': UI.helpModal(); break;
      case 'mclose': UI.closeModal(); UI.popups(); break;
      case 'myes': { var f = UI._yes; UI.closeModal(); if (f) f(); break; }
      case 'evc': {
        var res2 = G.resolveEvent(parseInt(t.getAttribute('data-i'), 10));
        if (!res2.ok) { UI.toast(res2.msg || 'ทำไม่ได้', 'bad'); break; }
        UI.closeModal(); UI.after(res2); break;
      }
      case 'savenow': UI.toast(G.save() ? '💾 บันทึกเกมแล้ว' : 'บันทึกไม่สำเร็จ (เบราว์เซอร์ปิดการเก็บข้อมูล?)', G.save() ? 'good' : 'bad'); break;
      case 'export': UI.exportModal(); break;
      case 'import': UI.importModal(); break;
      case 'doimport': {
        var raw = ($('#impbox') || {}).value || '';
        if (G.importJSON(raw.trim())) { G.save(); UI.closeModal(); startGame(); UI.toast('นำเข้าเซฟสำเร็จ', 'good'); } else UI.toast('ข้อมูลเซฟไม่ถูกต้อง', 'bad');
        break;
      }
      case 'copyexp': { var b = $('#expbox'); b.select(); try { document.execCommand('copy'); UI.toast('คัดลอกแล้ว', 'good'); } catch (er) {} break; }
      case 'dlexp': {
        var blob = new Blob([G.exportJSON()], { type: 'application/json' }), a2 = document.createElement('a');
        a2.href = URL.createObjectURL(blob); a2.download = 'sooksan-save.json'; document.body.appendChild(a2); a2.click(); document.body.removeChild(a2);
        break;
      }
      case 'yearsum': UI.yearModal(false); break;
      case 'yearcont': s.flags.yearSeen = true; UI.closeModal(); UI.render(); break;
      case 'newgame': UI.confirm('เริ่มเกมใหม่ทั้งหมด? เซฟเดิมจะถูกลบ', function () { G.wipe(); UI.screen = 'title'; UI.create = { name: '', avatar: '🧑', path: 'newcomer', goal: 'balanced' }; UI.render(); }); break;
    }
  };

  UI.onChange = function (e) {
    var t = e.target, act = t.getAttribute && t.getAttribute('data-act'), s = S();
    if (!act) return;
    if (act === 'rsel') { s.routine[t.getAttribute('data-k')][parseInt(t.getAttribute('data-i'), 10)] = t.value; G.save(); }
    else if (act === 'rcourse') { s.flags.focusCourse = t.value || null; G.save(); }
    else if (act === 'autoev') { s.flags.autoEv = !!t.checked; G.save(); }
    else if (act === 'agerate') { s.ageRate = parseInt(t.value, 10) || 5; G.save(); UI.toast('ตั้งความเร็วอายุแล้ว', 'good'); }
  };

  UI.init = function () {
    var app = $('#app'), modal = $('#modal');
    app.addEventListener('click', UI.onClick);
    modal.addEventListener('click', function (e) { if (e.target === modal && UI.mdl && UI.mdl !== 'event' && UI.mdl !== 'year') { UI.closeModal(); UI.popups(); } else UI.onClick(e); });
    app.addEventListener('change', UI.onChange);
    modal.addEventListener('change', UI.onChange);
    document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && UI.mdl && UI.mdl !== 'event' && UI.mdl !== 'year') { UI.closeModal(); UI.popups(); } });
    UI.render();
  };
})();
