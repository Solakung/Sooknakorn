/* สุขนคร — world.js : โลกที่มีชีวิตและชีวิตที่ลึกขึ้น
   1) NPC มีความสัมพันธ์กันเอง + ข่าวซุบซิบ + เพื่อนของเพื่อน
   2) ร้านค้าของชาวเมืองเปิด/ปิด/ขยายตามเศรษฐกิจ
   3) เงินเฟ้อ ค่าแรง และราคาที่อยู่อาศัยขยับทุกปี
   5) โรคเรื้อรัง (เบาหวาน ความดัน) และภาวะหมดไฟ
   7) งานอดิเรกที่เก่งขึ้นได้ + การแข่งขันประจำเดือน
   8) ข้อพิพาท การไกล่เกลี่ย ศาล และหน้าที่พลเมืองร่วมพิจารณาคดี */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, B = SK.B, H = SK.H, C = SK.clamp;
  function S() { return SK.S; }
  function money(n) { return SK.money(n); }
  function A(o) { var d = { slots: 0, cost: 0, energy: 0, group: '', desc: '', icon: '•', check: null, run: null }; for (var k in o) d[k] = o[k]; return d; }
  function wrap(loc, extra) { var orig = B[loc]; B[loc] = function (s) { return extra(s, orig(s)); }; }
  function wrapRun(list, key, after) {
    list.forEach(function (a) { if (a.key === key) { var o = a.run; a.run = function (s) { var m = o(s); var x = after(s); return x ? (x.charAt(0) === '!' ? x.slice(1) : m + ' ' + x) : m; }; } });
  }
  function needSlot(n) { return function () { return G.remaining() < n ? 'เวลาในวันนี้ไม่พอ' : null; }; }

  // ======================================================================
  //  สถานะ
  // ======================================================================
  var SHOP_TYPES = {
    food: { loc: 'market', icon: '🍲', names: ['ร้านข้าวมันไก่', 'ร้านก๋วยเตี๋ยวเรือ', 'ร้านส้มตำ', 'ครัวคุณยาย', 'ร้านข้าวต้มโต้รุ่ง', 'ร้านโจ๊กหน้าตลาด'], cost: 70, verb: 'กิน' },
    cafe: { loc: 'cafe', icon: '🧋', names: ['ร้านชาไข่มุก', 'คาเฟ่แมว', 'ร้านขนมไทย', 'โรงคั่วกาแฟเล็กๆ', 'ร้านไอศกรีมโฮมเมด'], cost: 85, verb: 'แวะ' },
    retail: { loc: 'mall', icon: '🛍️', names: ['ร้านหนังสือ', 'ร้านต้นไม้', 'ร้านของเล่นไม้', 'ร้านเสื้อผ้ามือสอง', 'ร้านเครื่องเขียน'], cost: 250, verb: 'ช้อป' },
    service: { loc: 'station', icon: '✂️', names: ['ร้านตัดผม', 'ร้านซ่อมมือถือ', 'ร้านซักรีด', 'ร้านนวดแผนไทย'], cost: 150, verb: 'ใช้บริการ' }
  };
  var PAIR_SEED = { 'auntie|farmer': 60, 'auntie|pluem': 55, 'doctor|student': 40, 'landlord|monk': 50, 'cafe|reporter': 45, 'mayor|police': 40, 'cafe|rider': 35, 'coach|doctor': 30, 'mayor|reporter': -20, 'banker|mayor': 20, 'librarian|student': 50, 'fern|farmer': 45, 'cafe|phai': 40, 'auntie|cafe': -15 };
  function pk(a, b) { return a < b ? a + '|' + b : b + '|' + a; }

  G.ensureWorld = function (s) {
    s = s || S();
    var y = SK.dateOf(s.day).y;
    if (!s.soc) s.soc = { p: {}, rumor: null };
    if (!s.econ) s.econ = { cpi: 1, wage: 1, house: 1, y: y, last: 0, hist: [] };
    if (!s.hlth) s.hlth = { diabR: 10, hypR: 10, dx: {}, follow: -99, good: { diab: 0, hyp: 0 }, burn: 15, burnWarned: -99 };
    if (!s.hobby) s.hobby = { music: 0, sport: 0, cook: 0, art: 0, wins: 0, titles: [] };
    if (!s.legal) s.legal = { cases: 0, won: 0, jury: 0 };
    if (!s.shops) { s.shops = []; for (var i = 0; i < 7; i++) G.openShop(true); }
    return s;
  };

  // ======================================================================
  //  1) ความสัมพันธ์ระหว่าง NPC
  // ======================================================================
  G.pair = function (a, b) {
    var s = S(), k = pk(a, b);
    if (s.soc.p[k] == null) {
      var seed = PAIR_SEED[k];
      if (seed == null) { var h = 0; for (var i = 0; i < k.length; i++) h = (h * 31 + k.charCodeAt(i)) | 0; seed = (Math.abs(h) % 41) - 10; }
      s.soc.p[k] = seed;
    }
    return s.soc.p[k];
  };
  G.setPair = function (a, b, v) { S().soc.p[pk(a, b)] = C(v, -100, 100); };
  G.friendsOf = function (id, min) {
    return SK.NPC_KEYS.filter(function (o) { return o !== id && G.pair(id, o) >= (min || 60); });
  };
  var origAddRel = G.addRel, inSoc = false;
  G.addRel = function (id, d) {
    origAddRel(id, d);
    if (inSoc || !SK.NPCS[id] || d <= 0 || !S().soc) return;
    inSoc = true;
    try {
      SK.NPC_KEYS.forEach(function (o) {
        if (o === id) return;
        var p = G.pair(id, o);
        if (p >= 60) origAddRel(o, d * 0.15);
        else if (p <= -50) origAddRel(o, -d * 0.1);
      });
    } finally { inSoc = false; }
  };
  G.socialMonthly = function () {
    var s = S(), keys = SK.NPC_KEYS.slice();
    if (keys.length < 2) return;
    for (var i = 0; i < 7; i++) {
      var a = SK.pick(keys), b = SK.pick(keys);
      if (a === b) continue;
      var before = G.pair(a, b), after = C(before + SK.rint(-9, 10), -100, 100);
      G.setPair(a, b, after);
      var na = SK.NPCS[a], nb = SK.NPCS[b];
      if (before < 70 && after >= 70) G.news(na.name + ' กับ' + nb.name + ' กลายเป็นเพื่อนสนิทกัน', 'city');
      if (before > -50 && after <= -50) {
        G.news(na.name + ' กับ' + nb.name + ' มีปากเสียงกันเรื่อง' + SK.pick(['ที่จอดรถ', 'เสียงดัง', 'หนี้ที่ยืมกันไป', 'การแข่งขันทางการค้า', 'ความเห็นการเมือง']), 'city');
        if (G.rel(a) >= 30 || G.rel(b) >= 30) G.log('😠 ได้ยินมาว่า' + na.name + 'กับ' + nb.name + 'ทะเลาะกัน — ไปช่วยไกล่เกลี่ยได้ที่ที่ว่าการเมือง', 'n');
      }
      // คู่รักในหมู่ NPC
      var ag = G.npcAge(a), bg = G.npcAge(b);
      if (after >= 85 && na.dateable && nb.dateable && ag >= 22 && bg >= 22 && ag <= 45 && bg <= 45 && s.love.id !== a && s.love.id !== b && SK.chance(0.5)) {
        na.dateable = false; nb.dateable = false;
        [a, b].forEach(function (id) { if (s.pop2.gen[id]) s.pop2.gen[id].dateable = false; else { s.pop2.mod[id] = s.pop2.mod[id] || {}; s.pop2.mod[id].dateable = false; } });
        s.pop2.married[a] = s.day; s.pop2.married[b] = s.day;
        G.news(na.name + ' กับ' + nb.name + ' ประกาศแต่งงานกัน 💐', 'city');
      }
    }
    // ข่าวลือไปถึงหูอีกฝ่าย
    var r = s.soc.rumor;
    if (r && SK.NPCS[r.about]) {
      if (SK.chance(0.45)) {
        var n = SK.NPCS[r.about];
        if (r.side === 'against') { origAddRel(r.about, -8); G.log('🗣️ ' + n.name + 'รู้ว่าคุณเห็นด้วยกับคำนินทาเรื่องเขา ความสัมพันธ์แย่ลง', 'bad'); }
        else { G.addRel(r.about, 5); G.log('🗣️ ' + n.name + 'ได้ยินว่าคุณเคยปกป้องเขา เขาซึ้งใจมาก', 'good'); }
      }
      s.soc.rumor = null;
    }
  };
  // หาเรื่องซุบซิบที่ NPC คนหนึ่งมีต่ออีกคน (ใช้ในระบบบทสนทนา)
  G.gossipTarget = function (a) {
    var others = SK.NPC_KEYS.filter(function (o) { return o !== a; });
    if (!others.length) return null;
    others.sort(function (x, y) { return Math.abs(G.pair(a, y)) - Math.abs(G.pair(a, x)); });
    var b = others[0];
    return Math.abs(G.pair(a, b)) >= 25 ? { a: a, b: b, v: G.pair(a, b) } : null;
  };

  // ======================================================================
  //  2) ร้านค้าของชาวเมือง
  // ======================================================================
  G.openShop = function (seed) {
    var s = S(), t = SK.pick(Object.keys(SHOP_TYPES)), T = SHOP_TYPES[t];
    var used = {}; s.shops.forEach(function (x) { used[x.name] = 1; });
    var owners = SK.NPC_KEYS.filter(function (id) { var a = G.npcAge ? G.npcAge(id) : 35; return a >= 22 && a <= 65 && ['mayor', 'police', 'doctor', 'monk', 'librarian', 'banker', 'student'].indexOf(id) < 0 && !/นายก|ตำรวจ|แพทย์|พระ|เจ้าหน้าที่เทศบาล/.test(SK.NPCS[id].role) && id !== (s.love && s.love.id) && !s.shops.some(function (x) { return x.owner === id; }); });
    var owner = owners.length && SK.chance(0.45) ? SK.pick(owners) : null;
    var base = SK.pick(T.names), name = owner ? base + SK.NPCS[owner].name.replace(/^(พี่|น้อง|ลุง|ป้า|ตา|ยาย|คุณ|หมอ|ครู|โค้ช|สารวัตร|หลวงพี่)/, '') : base + SK.pick(['สุขใจ', 'ริมน้ำ', 'หัวมุม', 'ลมเย็น', 'ใบบุญ', 'ตะวันยิ้ม', 'บ้านสวน']);
    if (used[name]) name = name + ' สาขา 2';
    var shop = { id: 'sh' + s.day + '_' + s.shops.length + '_' + SK.rint(0, 999), name: name, t: t, loc: T.loc, icon: T.icon, owner: owner, health: seed ? SK.rint(45, 80) : 55, since: s.day, visits: 0, visitDay: -1 };
    s.shops.push(shop);
    if (!seed) {
      G.news('ร้านใหม่เปิด: ' + shop.icon + ' ' + shop.name + (owner ? ' ของ' + SK.NPCS[owner].name : '') + ' ที่' + SK.LOC[shop.loc].name, 'city');
      G.nudge('jobs', 0.2); G.nudge('economy', 0.15);
      if (owner && G.rel(owner) >= 30) G.log('🎊 ' + SK.NPCS[owner].name + 'เปิดร้านใหม่ "' + shop.name + '" แวะไปอุดหนุนกันนะ', 'good');
    }
    return shop;
  };
  G.shopsMonthly = function () {
    var s = S(), m = s.city.m;
    s.shops = s.shops.filter(function (sh) {
      if (sh.owner && (!SK.NPCS[sh.owner] || (s.pop2 && s.pop2.gone[sh.owner]))) sh.owner = null;
      var comp = s.shops.filter(function (o) { return o.t === sh.t; }).length - 1;
      sh.health = C(sh.health + (m.economy - 66) / 4 + SK.rint(-6, 6) - comp * 1.5 + sh.visits * 2, 0, 100);
      sh.visits = 0;
      if (sh.health < 12) {
        G.news(sh.icon + ' ' + sh.name + ' ปิดกิจการ' + (m.economy < 60 ? 'จากพิษเศรษฐกิจ' : 'เพราะลูกค้าน้อย'), 'city');
        G.nudge('jobs', -0.2);
        if (sh.owner && G.rel(sh.owner) >= 30) G.log('😔 ร้านของ' + SK.NPCS[sh.owner].name + 'ต้องปิดตัว', 'bad');
        return false;
      }
      if (sh.health > 92 && SK.chance(0.3)) { sh.health = 70; G.news(sh.icon + ' ' + sh.name + ' ขายดีจนเปิดสาขาเพิ่ม', 'city'); G.nudge('economy', 0.2); }
      return true;
    });
    var p = C(0.18 + (m.economy - 65) / 100, 0.03, 0.5);
    if (s.shops.length < 14 && SK.chance(p)) G.openShop(false);
  };
  // อุดหนุนร้านในย่าน
  Object.keys(SHOP_TYPES).forEach(function (t) {
    var T = SHOP_TYPES[t];
    if (B[T.loc].__shops) return;
    wrap(T.loc, function (s, list) {
      if (!s.shops) return list;
      s.shops.filter(function (sh) { return sh.loc === T.loc; }).forEach(function (sh) {
        var TT = SHOP_TYPES[sh.t];
        list.push(A({
          key: 'shop:' + sh.id, group: 'ร้านค้าในย่าน (ของชาวเมือง)', icon: sh.icon, name: TT.verb + 'ที่ ' + sh.name + (sh.owner ? ' (ร้านของ' + SK.NPCS[sh.owner].name + ')' : ''),
          desc: 'กิจการท้องถิ่น ' + (sh.health > 70 ? 'ขายดี' : sh.health < 30 ? 'ลูกค้าบางตา' : 'พอไปได้') + ' • อุดหนุนช่วยให้ร้านอยู่รอด', slots: 0, cost: TT.cost,
          check: function (s) { return sh.visitDay === s.day ? 'วันนี้อุดหนุนไปแล้ว' : (sh.t === 'food' && s.sat > 82) ? 'ยังอิ่มอยู่' : null; },
          run: function (s) {
            sh.visitDay = s.day; sh.visits++; sh.health = C(sh.health + 2, 0, 100);
            if (sh.owner) G.addRel(sh.owner, 1.5);
            if (sh.t === 'food') { H.eat(36, 60, 2); return 'อร่อยมาก! ' + sh.name + 'จะต้องกลับมาอีก'; }
            if (sh.t === 'cafe') { G.mod('energy', 6); G.mod('mood', 5); G.mod('sat', 8); return 'บรรยากาศดี เมนูเด็ดสมคำร่ำลือ'; }
            if (sh.t === 'retail') { G.mod('mood', 8); return 'ได้ของถูกใจกลับบ้าน'; }
            G.mod('mood', 6); s.tidyUntil = Math.max(s.tidyUntil, s.day + 2); return 'บริการดีมาก รู้สึกสดชื่นขึ้น';
          }
        }));
      });
      return list;
    });
    B[T.loc].__shops = true;
  });
  // ร้านเดียวกันแย่งลูกค้ากิจการของผู้เล่น / ร้านค้าเปิดรับพนักงาน
  var origBiz = G.bizDaily;
  G.bizDaily = function () {
    var s = S(), b = s.business, before = b ? b.cashbox : 0;
    origBiz();
    b = s.business;
    if (!b || !s.shops) return;
    var map = { coffee: 'cafe', food: 'food', online: 'retail', farm: null }, t = map[b.type];
    var delta = b.cashbox - before;
    var n = t ? s.shops.filter(function (x) { return x.t === t; }).length : 0;
    if (delta > 0) b.cashbox -= delta * 0.05 * n;
    if (s.econ) b.cashbox += (b.cashbox - before) * (s.econ.cpi - 1);
  };
  var origOpen = G.genOpenings;
  G.genOpenings = function () {
    origOpen();
    var s = S();
    if (!s.shops) return;
    s.openings.forEach(function (op) {
      if (op.track === 'cafe' && SK.chance(0.5)) {
        var c = s.shops.filter(function (x) { return x.t === 'food' || x.t === 'cafe'; });
        if (c.length) op.company = SK.pick(c).name;
      }
    });
  };

  // ======================================================================
  //  3) เงินเฟ้อ ค่าแรง ราคาบ้าน
  // ======================================================================
  function cpi() { var s = S(); return s && s.econ ? s.econ.cpi : 1; }
  ['foodUnit', 'streetPrice', 'tuition', 'billsOf'].forEach(function (f) {
    var o = G[f]; G[f] = function () { return Math.round(o.apply(null, arguments) * cpi()); };
  });
  var oRent = G.rentOf; G.rentOf = function (t) { var s = S(); return Math.round(oRent(t) * (s && s.econ ? s.econ.house : 1)); };
  var oWage = G.wageOf; G.wageOf = function (j) { var s = S(); return Math.round(oWage(j) * (s && s.econ ? s.econ.wage : 1)); };
  var NO_SCALE = /^(dep|depall|wd|fbuy|fsell|loan|micro|pay5k|payoff|donate|move|buy$|course|groc|street|salad|pvd|ins|vote|open:|upgrade|close|sendfam|love:wed|shop:)/;
  var origGet = SK.getActions;
  SK.getActions = function (locId, s) {
    var list = origGet(locId, s), c = cpi();
    if (c !== 1) list.forEach(function (a) { if (a.cost > 0 && !NO_SCALE.test(a.key)) a.cost = Math.round(a.cost * c); });
    return list;
  };
  G.econYearly = function (y) {
    var s = S(), e = s.econ, m = s.city.m;
    var press = (s.city.pop - SK.BASE_POP) / SK.BASE_POP;
    var infl = C(0.018 + (m.economy - 70) / 800 + (SK.rand() - 0.5) * 0.012 + (s.city.treasury < 0 ? 0.01 : 0), -0.005, 0.06);
    e.cpi *= 1 + infl;
    e.wage *= 1 + infl + (m.jobs - 70) / 1500;
    e.house *= 1 + infl + (60 - m.housing) / 1000 + press * 0.02;
    e.last = infl; e.y = y;
    e.hist.push({ y: y - 1, infl: Math.round(infl * 1000) / 10 });
    if (e.hist.length > 30) e.hist.shift();
    G.news('สรุปเศรษฐกิจปี ' + (y - 1 + 543) + ': เงินเฟ้อ ' + (infl * 100).toFixed(1) + '% • ค่าแรงเฉลี่ยปรับขึ้นตาม • ราคาที่อยู่อาศัย' + (e.house > e.cpi ? 'ขึ้นเร็วกว่าราคาสินค้า' : 'ทรงตัว'), 'city');
    G.log('📊 ปีใหม่ ราคาสินค้าปรับขึ้น ' + (infl * 100).toFixed(1) + '% ค่าแรงก็ปรับขึ้นตาม', 'n');
  };

  // ======================================================================
  //  5) โรคเรื้อรัง และภาวะหมดไฟ
  // ======================================================================
  G.chronicPenalty = function (s) {
    var h = s.hlth; if (!h) return 0;
    var p = 0;
    ['diab', 'hyp'].forEach(function (k) {
      if (h.dx[k]) p += (s.day - h.follow > 90) ? 10 : 4;
      else if ((k === 'diab' ? h.diabR : h.hypR) >= 80) p += 6;
    });
    return p;
  };
  var oCap = G.healthCap;
  G.healthCap = function (s) { return C(oCap(s) - G.chronicPenalty(s), 30, 100); };
  var oMod = G.mod;
  G.mod = function (k, d) {
    oMod(k, d);
    var s = S();
    if (k === 'health' && d > 0 && s && s.hlth) { var cap = G.healthCap(s); if (s.health > cap) s.health = Math.max(cap, s.health - d); }
  };
  G.healthMonthly = function () {
    var s = S(), h = s.hlth, age = s.age || 30;
    h.diabR = C(h.diabR + (58 - s.diet) / 4 + (45 - s.fitness) / 6 + Math.max(0, age - 35) / 6, 0, 100);
    h.hypR = C(h.hypR + (50 - s.mood) / 5 + (45 - s.fitness) / 8 + Math.max(0, age - 40) / 5 + (h.burn - 50) / 10, 0, 100);
    if (h.dx.diab) { G.payOrOwe(Math.round(120 * cpi()), 'ยาและการรักษาต่อเนื่อง'); h.good.diab = (s.diet > 70 && s.fitness > 60) ? h.good.diab + 1 : 0; if (h.good.diab >= 6) { h.dx.diab = false; h.diabR = 30; G.log('🎉 หมอบอกว่าเบาหวานอยู่ในระยะสงบแล้ว เพราะคุณดูแลอาหารและออกกำลังกายสม่ำเสมอ', 'good'); } }
    if (h.dx.hyp) { G.payOrOwe(Math.round(120 * cpi()), 'ยาและการรักษาต่อเนื่อง'); h.good.hyp = (s.mood > 65 && s.fitness > 55 && h.burn < 30) ? h.good.hyp + 1 : 0; if (h.good.hyp >= 6) { h.dx.hyp = false; h.hypR = 30; G.log('🎉 ความดันกลับมาปกติแล้ว ไม่ต้องกินยาต่อ', 'good'); } }
  };
  G.burnDaily = function () {
    var s = S(), h = s.hlth, info = SK.dayInfo(s.day);
    var d = (s.today.worked ? 1.2 : 0) + (s.today.ot ? 1.6 : 0) + (s.stats.workStreak > 6 ? 1.5 : 0) + (s.mood < 40 ? 0.8 : 0);
    if (!s.today.worked && (info.off || !s.job)) d -= 2.5;
    if (s.today.leave) d -= 4;
    if (s.perks.calm) d -= 0.3;
    h.burn = C(h.burn + d, 0, 100);
  };
  wrap('hospital', function (s, list) {
    var h = s.hlth;
    wrapRun(list, 'checkup', function (s) {
      var msg = [];
      if (!h.dx.diab && h.diabR >= 60) { h.dx.diab = true; h.follow = s.day; G.news(s.name + ' ตรวจพบภาวะเบาหวานชนิดที่ 2 และเริ่มรักษา', 'me'); msg.push('⚠️ ผลน้ำตาลในเลือดสูง: เป็นเบาหวานชนิดที่ 2 ต้องคุมอาหาร ออกกำลังกาย และมาตรวจติดตามทุก 3 เดือน'); }
      else if (!h.dx.diab && h.diabR >= 40) msg.push('หมอเตือนว่าเริ่มเสี่ยงเบาหวาน ควรลดหวานและขยับตัวมากขึ้น');
      if (!h.dx.hyp && h.hypR >= 60) { h.dx.hyp = true; h.follow = s.day; G.news(s.name + ' ตรวจพบความดันโลหิตสูงและเริ่มรักษา', 'me'); msg.push('⚠️ ความดันสูง: ต้องกินยา ลดเค็ม พักผ่อน และตรวจติดตามทุก 3 เดือน'); }
      else if (!h.dx.hyp && h.hypR >= 40) msg.push('ความดันเริ่มสูง ควรจัดการความเครียดและนอนให้พอ');
      if (h.burn >= 70) msg.push('หมอสังเกตว่าคุณมีภาวะหมดไฟ ควรลาพักและคุยกับนักจิตวิทยา');
      return (h.dx.diab || h.dx.hyp) && msg.length && /⚠️/.test(msg.join('')) ? '!' + msg.join(' ') : msg.join(' ');
    });
    wrapRun(list, 'mental', function (s) { h.burn = C(h.burn - 15, 0, 100); return '(ภาวะหมดไฟลดลง)'; });
    if (h.dx.diab || h.dx.hyp) {
      list.unshift(A({
        key: 'follow', group: 'บริการสุขภาพ', icon: '📋', name: 'ตรวจติดตามโรคเรื้อรัง' + (h.dx.diab ? ' • เบาหวาน' : '') + (h.dx.hyp ? ' • ความดัน' : ''), desc: 'ควรมาทุก 3 เดือน (ครั้งล่าสุด ' + (h.follow < 0 ? '-' : (s.day - h.follow) + ' วันก่อน') + ') • ค่าบริการตามสิทธิ์', slots: 1, cost: 30,
        run: function (s) { h.follow = s.day; G.mod('health', 3); return 'หมอปรับยาและให้คำแนะนำ อาการอยู่ในเกณฑ์ควบคุมได้'; }
      }));
    }
    return list;
  });
  wrap('station', function (s, list) { wrapRun(list, 'trip', function (s) { s.hlth.burn = C(s.hlth.burn - 22, 0, 100); return ''; }); return list; });
  wrap('work', function (s, list) {
    if (s.hlth && s.hlth.burn >= 70) wrapRun(list, 'shift', function (s) { if (s.job) s.job.perf = C(s.job.perf - 1.5, 0, 100); return '(หมดไฟจนงานไม่ค่อยเดิน)'; });
    return list;
  });
  var oMood = G.lifeMood;
  G.lifeMood = function () { var s = S(), m = oMood(); if (s.hlth) { if (s.hlth.burn >= 70) m -= 8; else if (s.hlth.burn >= 50) m -= 3; } return m; };

  // ======================================================================
  //  7) งานอดิเรก + การแข่งขัน
  // ======================================================================
  var HOB = { music: ['🎵', 'ดนตรี'], sport: ['🏅', 'กีฬา'], cook: ['🍳', 'ทำอาหาร'], art: ['🎨', 'ศิลปะ'] };
  SK.HOBBIES = HOB;
  function hob(k, d) { var s = S(); s.hobby[k] = C(s.hobby[k] + d, 0, 100); return ''; }
  wrap('home', function (s, list) {
    wrapRun(list, 'guitar', function () { return hob('music', 0.8); });
    wrapRun(list, 'cook', function () { return hob('cook', 0.15); });
    list.push(A({
      key: 'hob:cook', group: 'งานอดิเรก', icon: '🍳', name: 'ทดลองทำเมนูใหม่ (ฝีมือทำอาหาร ' + Math.floor(s.hobby.cook) + ')', desc: 'ใช้วัตถุดิบ 1 ชุด • ได้กินด้วย', slots: 1, energy: 6,
      check: function (s) { return s.groceries < 1 ? 'ต้องมีวัตถุดิบ 1 ชุด' : null; },
      run: function (s) { s.groceries--; hob('cook', 2.5); H.eat(22, 75, 5); return SK.pick(['ลองทำผัดไทยสูตรใหม่ อร่อยกว่าที่คิด', 'อบขนมปังครั้งแรก ฟูสวย', 'ทำแกงมัสมั่นจากสูตรยาย หอมทั้งบ้าน']); }
    }));
    return list;
  });
  wrap('culture', function (s, list) {
    wrapRun(list, 'workshop', function () { return hob('art', 0.8); });
    list.push(A({
      key: 'hob:music', group: 'งานอดิเรก', icon: '🎵', name: 'ซ้อมดนตรีกับวงชุมชน (ดนตรี ' + Math.floor(s.hobby.music) + ')', desc: 'ได้เพื่อนและฝีมือ', slots: 1, cost: 50, energy: 8,
      run: function (s) { hob('music', 2.5); G.mod('mood', 8); return 'ซ้อมเพลงใหม่กับวงจนเข้าขา'; }
    }));
    list.push(A({
      key: 'hob:art', group: 'งานอดิเรก', icon: '🎨', name: 'วาดรูป / ปั้นดินที่สตูดิโอชุมชน (ศิลปะ ' + Math.floor(s.hobby.art) + ')', desc: 'ผ่อนคลาย ฝึกฝีมือ', slots: 1, cost: 80, energy: 6,
      run: function (s) { hob('art', 2.5); G.mod('mood', 9); return 'ผลงานชิ้นใหม่ออกมาสวยเกินคาด'; }
    }));
    return list;
  });
  wrap('gym', function (s, list) {
    wrapRun(list, 'workout', function () { return hob('sport', 0.4); });
    wrapRun(list, 'class', function () { return hob('sport', 0.4); });
    list.push(A({
      key: 'hob:sport', group: 'งานอดิเรก', icon: '🏅', name: 'ซ้อมกีฬาเพื่อลงแข่ง (กีฬา ' + Math.floor(s.hobby.sport) + ')', desc: 'ฟิตขึ้นและเก่งขึ้น', slots: 1, energy: 22,
      run: function (s) { hob('sport', 2.5); G.mod('fitness', 1.5); return 'ซ้อมหนักแต่คุ้ม รู้สึกพร้อมแข่ง'; }
    }));
    return list;
  });
  wrap('park', function (s, list) { wrapRun(list, 'jog', function () { return hob('sport', 0.3); }); return list; });

  // ======================================================================
  //  8) กฎหมายและความยุติธรรม (ที่ว่าการ)
  // ======================================================================
  wrap('townhall', function (s, list) {
    list.push(A({
      key: 'legalclinic', group: 'กฎหมายและความยุติธรรม', icon: '⚖️', name: 'ปรึกษาคลินิกกฎหมายประชาชน (ฟรี)', desc: 'สัญญาเช่า หนี้ ข้อพิพาท สิทธิแรงงาน', slots: 1, energy: 3,
      run: function (s) { G.skill('mgmt', 0.8); return 'คำแนะนำ: ' + SK.pick(['สัญญาเช่าต้องระบุเงื่อนไขคืนเงินมัดจำให้ชัด', 'ถูกเลิกจ้างโดยไม่มีความผิด มีสิทธิ์ได้ค่าชดเชยตามอายุงาน', 'ข้อพิพาทเล็กๆ ไกล่เกลี่ยก่อนฟ้อง ประหยัดทั้งเงินและเวลา', 'เก็บหลักฐานการโอนเงินไว้ทุกครั้ง']); }
    }));
    var fights = [];
    for (var k in s.soc.p) if (s.soc.p[k] <= -50) { var ab = k.split('|'); if (SK.NPC_KEYS.indexOf(ab[0]) >= 0 && SK.NPC_KEYS.indexOf(ab[1]) >= 0) fights.push(ab); }
    fights.slice(0, 3).forEach(function (ab) {
      var na = SK.NPCS[ab[0]], nb = SK.NPCS[ab[1]];
      list.push(A({
        key: 'mediate:' + ab[0] + '|' + ab[1], group: 'กฎหมายและความยุติธรรม', icon: '🤝', name: 'ช่วยไกล่เกลี่ย ' + na.name + ' กับ ' + nb.name, desc: 'ทั้งสองมีปัญหากันอยู่ • ถ้าสำเร็จได้ใจทั้งสองฝ่ายและแต้มพลเมือง', slots: 1, energy: 8,
        run: function (s) {
          var p = C(0.45 + (G.rel(ab[0]) + G.rel(ab[1])) / 400 + s.skills.mgmt / 300 + s.skills.service / 400, 0.2, 0.92);
          if (SK.chance(p)) { G.setPair(ab[0], ab[1], G.pair(ab[0], ab[1]) + 50); s.civic += 4; G.addRel(ab[0], 3); G.addRel(ab[1], 3); G.news(na.name + ' กับ' + nb.name + ' คืนดีกันหลังได้รับการไกล่เกลี่ย', 'city'); return '✅ ไกล่เกลี่ยสำเร็จ ทั้งสองจับมือคืนดีกัน'; }
          G.setPair(ab[0], ab[1], G.pair(ab[0], ab[1]) + 12); G.mod('mood', -2); return 'คุยกันได้บ้าง แต่ยังไม่ยอมกันง่ายๆ ไว้ลองใหม่';
        }
      }));
    });
    return list;
  });

  // ======================================================================
  //  เหตุการณ์ใหม่
  // ======================================================================
  var EV = [
    {
      id: 'gossip', icon: '🗣️', special: true, def: 2,
      init: function () { return {}; },
      title: 'เรื่องเล่าระหว่างพูดคุย',
      text: function (s, x) {
        var a = SK.NPCS[x.a], b = SK.NPCS[x.b];
        if (!a || !b) return 'คุยเรื่องทั่วไปกันสนุกสนาน';
        return x.v < 0 ? a.name + 'บ่นเรื่อง' + b.name + 'ว่า "' + SK.pick(['พูดอะไรไม่เคยรักษาคำพูดเลย', 'ชอบจอดรถขวางหน้าร้านฉันทุกวัน', 'ยืมเงินไปแล้วเงียบหาย', 'ทำตัวเหมือนรู้ทุกเรื่อง']) + '"'
          : a.name + 'ชม' + b.name + 'ไม่หยุด "' + SK.pick(['เป็นคนจริงใจที่สุดในย่านนี้', 'ช่วยฉันไว้ตอนลำบาก', 'ทำงานเก่งมาก', 'ใจดีกับทุกคน']) + '"';
      },
      choices: [
        { label: function (s) { var x = s.pendingEvent.ctx; return x.v < 0 ? 'เห็นด้วยกับ' + SK.nn(x.a) : 'ฝากคำชมไปถึง' + SK.nn(x.b); }, cost: 0, run: function (s, x) {
          if (x.v < 0) { G.addRel(x.a, 3); s.soc.rumor = { about: x.b, by: x.a, side: 'against', day: s.day }; return SK.nn(x.a) + 'ดูพอใจที่คุณเข้าใจ'; }
          G.addRel(x.b, 3); G.addRel(x.a, 1); return 'ฝากคำชมไปแล้ว ' + SK.nn(x.b) + 'ยิ้มแก้มปริ';
        } },
        { label: function (s) { var x = s.pendingEvent.ctx; return x.v < 0 ? 'ปกป้อง' + SK.nn(x.b) + 'อย่างสุภาพ' : 'เล่าเรื่องดีๆ ของ' + SK.nn(x.b) + 'เพิ่ม'; }, cost: 0, run: function (s, x) {
          if (x.v < 0) { G.addRel(x.a, -2); s.soc.rumor = { about: x.b, by: x.a, side: 'defend', day: s.day }; G.setPair(x.a, x.b, G.pair(x.a, x.b) + 6); return SK.nn(x.a) + 'ฟังแล้วนิ่งคิด อาจจะมองอีกฝ่ายดีขึ้นบ้าง'; }
          G.setPair(x.a, x.b, G.pair(x.a, x.b) + 5); G.addRel(x.a, 2); return 'บรรยากาศอบอุ่นดี';
        } },
        { label: 'เปลี่ยนเรื่องคุย', cost: 0, run: function () { return 'คุยเรื่องอื่นต่อจนเพลิน'; } }
      ]
    },
    {
      id: 'contest', icon: '🏆', special: true, def: 1,
      init: function (s) { var best = Object.keys(HOB).sort(function (a, b) { return s.hobby[b] - s.hobby[a]; })[0]; return { h: best }; },
      title: function (s, x) { return 'ประกวด' + HOB[x.h][1] + 'ประจำเดือนของเมือง'; },
      text: function (s, x) { return 'ศูนย์วัฒนธรรมจัดการแข่งขัน' + HOB[x.h][1] + 'ประจำเดือน ฝีมือ' + HOB[x.h][1] + 'ของคุณตอนนี้ ' + Math.floor(s.hobby[x.h]) + ' ค่าสมัคร ฿200'; },
      choices: [
        { label: 'ลงแข่ง (ใช้ 1 ช่วง)', cost: 200, req: needSlot(1), run: function (s, x) {
          G.advance(1);
          var sc = s.hobby[x.h] + SK.rint(0, 40) + (s.mood > 70 ? 5 : 0), h = HOB[x.h];
          if (sc > 110) { var p1 = Math.round(5000 * cpi()); G.earn(p1, 'รางวัลการแข่งขัน'); s.hobby.wins++; s.hobby.titles.push(h[1] + ' ' + SK.dateOf(s.day).be); s.civic += 5; G.mod('mood', 25); G.news(s.name + ' คว้าแชมป์ประกวด' + h[1] + 'ประจำเดือน 🏆', 'me'); return '🏆 ชนะเลิศ! ได้รางวัล ' + money(p1); }
          if (sc > 90) { var p2 = Math.round(2000 * cpi()); G.earn(p2, 'รางวัลการแข่งขัน'); G.mod('mood', 15); s.civic += 2; return '🥈 รองชนะเลิศ ได้รางวัล ' + money(p2); }
          if (sc > 70) { var p3 = Math.round(1000 * cpi()); G.earn(p3, 'รางวัลการแข่งขัน'); G.mod('mood', 10); return '🥉 อันดับสาม ได้รางวัล ' + money(p3); }
          G.mod('mood', 4); return 'ไม่ติดอันดับครั้งนี้ แต่ได้ประสบการณ์และเพื่อนใหม่';
        } },
        { label: 'ไปเชียร์อย่างเดียว', cost: 0, run: function (s) { G.mod('mood', 4); return 'เชียร์เพื่อนๆ จนเสียงแหบ'; } }
      ]
    },
    {
      id: 'burnout', icon: '🥀', special: true, def: 0,
      init: function () { return {}; },
      title: 'ภาวะหมดไฟ',
      text: function () { return 'ช่วงนี้ตื่นมาแล้วไม่อยากไปทำงาน เหนื่อยตลอดเวลาแม้จะนอนพอ ทำอะไรก็ไม่มีความสุข ร่างกายกำลังส่งสัญญาณเตือน'; },
      choices: [
        { label: 'ลาพักร้อน 1 วัน และพักจริงจัง', cost: 0, req: function (s) { return s.job && s.job.leaveLeft <= 0 ? 'วันลาหมดแล้ว' : null; }, run: function (s) { if (s.job && !SK.dayInfo(s.day).off) { s.job.leaveLeft--; s.today.leave = true; } s.hlth.burn = C(s.hlth.burn - 20, 0, 100); G.mod('mood', 10); return 'ปิดมือถือ นอนยาว อ่านหนังสือ ใจเริ่มกลับมา'; } },
        { label: 'นัดคุยกับนักจิตวิทยาชุมชน (ฟรี)', cost: 0, req: needSlot(1), run: function (s) { G.advance(1); s.hlth.burn = C(s.hlth.burn - 18, 0, 100); G.mod('mood', 12); return 'ได้วิธีจัดการงานและขีดเส้นแบ่งเวลาชีวิต'; } },
        { label: 'ฝืนทำต่อไป', cost: 0, run: function (s) { G.mod('health', -3); return 'ฝืนต่อไปอีกวัน… ระวังจะพังนะ'; } }
      ]
    },
    {
      id: 'symptom', icon: '🩺', cd: 60,
      w: function (s) { return s.hlth && ((s.hlth.diabR >= 75 && !s.hlth.dx.diab) || (s.hlth.hypR >= 75 && !s.hlth.dx.hyp)) ? 2 : 0; },
      init: function () { return {}; },
      title: 'ร่างกายส่งสัญญาณ', text: function (s) { return s.hlth.diabR >= 75 && !s.hlth.dx.diab ? 'ช่วงนี้กระหายน้ำบ่อย ปัสสาวะบ่อย และเพลียง่ายผิดปกติ' : 'ปวดหัวท้ายทอยบ่อย บางครั้งเวียนหัวตอนลุกขึ้นยืน'; }, def: 0,
      choices: [
        { label: 'ไปตรวจสุขภาพที่โรงพยาบาล (ใช้ 1 ช่วง)', cost: 0, req: needSlot(1), run: function (s) { G.advance(1); var h = s.hlth, out = []; if (h.diabR >= 60) { h.dx.diab = true; out.push('เบาหวานชนิดที่ 2'); } if (h.hypR >= 60) { h.dx.hyp = true; out.push('ความดันโลหิตสูง'); } h.follow = s.day; return out.length ? 'ตรวจพบ' + out.join(' และ ') + ' เริ่มรักษาตั้งแต่เนิ่นๆ ควบคุมได้' : 'ผลตรวจยังปกติ แต่ควรดูแลตัวเองมากขึ้น'; } },
        { label: 'คงไม่เป็นอะไรหรอก', cost: 0, run: function (s) { G.mod('health', -2); return 'ปล่อยไว้ก่อน… อาการยังไม่หายไปไหน'; } }
      ]
    },
    {
      id: 'dispute', icon: '⚖️', cd: 90,
      w: function () { return 0.5; },
      init: function (s) {
        var c = SK.NPC_KEYS.filter(function (id) { return G.rel(id) < 40; });
        return { n: c.length ? SK.pick(c) : SK.pick(SK.NPC_KEYS), issue: SK.pick(['เสียงดังตอนดึก', 'จอดรถขวางหน้าบ้าน', 'กิ่งไม้ล้ำเขตมาบังหน้าต่าง', 'น้ำจากแอร์หยดใส่ระเบียง']) };
      },
      title: 'ข้อพิพาทกับเพื่อนบ้าน', text: function (s, x) { return 'มีปัญหากับ' + SK.nn(x.n) + 'เรื่อง' + x.issue + ' เป็นแบบนี้มาหลายสัปดาห์แล้ว'; }, def: 1,
      choices: [
        { label: 'เดินไปคุยกันตรงๆ อย่างสุภาพ', cost: 0, run: function (s, x) { var p = 0.45 + G.rel(x.n) / 150 + s.skills.service / 300; if (SK.chance(p)) { G.addRel(x.n, 4); return 'คุยกันรู้เรื่อง ตกลงกันได้ด้วยดี'; } G.addRel(x.n, -5); G.mod('mood', -4); return 'คุยกันไม่ลงตัว บรรยากาศตึงเครียด'; } },
        { label: 'ยื่นเรื่องศูนย์ไกล่เกลี่ยชุมชน (ใช้ 1 ช่วง)', cost: 0, req: needSlot(1), run: function (s, x) { G.advance(1); s.civic += 2; if (SK.chance(0.8)) { G.addRel(x.n, 2); return 'ผู้ไกล่เกลี่ยช่วยหาจุดร่วม ทั้งสองฝ่ายพอใจ'; } return 'ไกล่เกลี่ยไม่สำเร็จ แนะนำให้ลองคุยใหม่อีกครั้ง'; } },
        { label: 'ฟ้องศาลแพ่ง (ค่าธรรมเนียมและทนาย ฿3,000)', cost: 3000, run: function (s, x) { s.legal.cases++; G.addRel(x.n, -20); if (SK.chance(0.6)) { s.legal.won++; G.earn(5000, 'ค่าเสียหายตามคำพิพากษา'); return '⚖️ ศาลตัดสินให้คุณชนะ ได้ค่าเสียหาย ฿5,000 แต่ความสัมพันธ์ก็พังไปแล้ว'; } G.mod('mood', -8); return '⚖️ ศาลยกฟ้องเพราะหลักฐานไม่พอ เสียทั้งเงินและเพื่อนบ้าน'; } }
      ]
    },
    {
      id: 'jury', icon: '🏛️', cd: 150,
      w: function (s) { return (s.age || 30) >= 25 ? 0.35 : 0; },
      init: function () { return {}; },
      title: 'หมายเรียกร่วมพิจารณาคดี', text: function () { return 'ศาลจังหวัดสุ่มเลือกคุณเป็นพลเมืองผู้ร่วมพิจารณาคดี (คล้ายลูกขุน) หนึ่งวัน ได้ค่าตอบแทน ฿500 และนายจ้างต้องให้ลาโดยไม่ถือว่าขาดงาน'; }, def: 0,
      choices: [
        { label: 'รับหน้าที่ (ใช้ 2 ช่วง)', cost: 0, req: needSlot(2), run: function (s) { s.today.leave = true; G.advance(2); G.earn(500, 'ค่าตอบแทนหน้าที่พลเมือง'); s.civic += 6; s.legal.jury++; G.skill('mgmt', 1); return 'ได้เห็นกระบวนการยุติธรรมจริงๆ และร่วมตัดสินอย่างรอบคอบ (+6 แต้มพลเมือง)'; } },
        { label: 'ขอเลื่อนเพราะติดธุระจำเป็น', cost: 0, run: function () { return 'ศาลอนุญาตให้เลื่อนไปรอบหน้า'; } }
      ]
    }
  ];
  EV.forEach(function (e) { SK.EVENTS.push(e); SK.EV[e.id] = e; });

  // ======================================================================
  //  วงจรเวลา
  // ======================================================================
  var oNight = G.lifeNight;
  G.lifeNight = function () {
    oNight();
    var s = S(); G.ensureWorld(s);
    G.burnDaily();
    var h = s.hlth;
    if (!h.dx.diab && h.diabR >= 80) G.mod('health', -0.3);
    if (!h.dx.hyp && h.hypR >= 80) G.mod('health', -0.3);
    if ((h.dx.diab || h.dx.hyp) && s.day - h.follow > 90) G.mod('health', -0.4);
  };
  var oNewDay = G.lifeNewDay;
  G.lifeNewDay = function (ni) {
    oNewDay(ni);
    var s = S(); G.ensureWorld(s);
    if (s.econ.y !== ni.date.y) G.econYearly(ni.date.y);
    if (s.pendingEvent || s.ended) return;
    if (s.hlth.burn >= 75 && s.day - s.hlth.burnWarned > 30) { s.hlth.burnWarned = s.day; G.startEvent('burnout'); return; }
    if (ni.date.d === 20 && Object.keys(HOB).some(function (k) { return s.hobby[k] >= 15; })) G.startEvent('contest');
  };
  var oMonthly = G.lifeMonthly;
  G.lifeMonthly = function (items) {
    oMonthly(items);
    var s = S(); G.ensureWorld(s);
    G.healthMonthly(); G.shopsMonthly(); G.socialMonthly();
  };
  var oNew = G.newState;
  G.newState = function (o) { var s = oNew(o); G.ensureWorld(s); return s; };
  var oImp = G.importJSON;
  G.importJSON = function (raw) { var ok = oImp(raw); if (ok) G.ensureWorld(SK.S); return ok; };

  SK.ACHIEVEMENTS.push(
    { id: 'champ', icon: '🏆', name: 'แชมป์ประจำเมือง', desc: 'ชนะเลิศการประกวดงานอดิเรก', test: function (s) { return s.hobby && s.hobby.wins > 0; } },
    { id: 'peace', icon: '🕊️', name: 'นักไกล่เกลี่ย', desc: 'ช่วยให้ชาวเมืองที่ทะเลาะกันคืนดี', test: function (s) { return s.news.some(function (n) { return /คืนดีกันหลังได้รับการไกล่เกลี่ย/.test(n.m); }); } },
    { id: 'remission', icon: '💚', name: 'เอาชนะโรค', desc: 'ทำให้โรคเรื้อรังเข้าสู่ระยะสงบ', test: function (s) { return s.log.some(function (l) { return /ระยะสงบ|ความดันกลับมาปกติ/.test(l.m); }); } },
    { id: 'localhero', icon: '🛒', name: 'อุดหนุนคนท้องถิ่น', desc: 'สนิทกับเจ้าของร้านในย่านถึง 60', test: function (s) { return (s.shops || []).some(function (x) { return x.owner && G.rel(x.owner) >= 60; }); } }
  );
})();
