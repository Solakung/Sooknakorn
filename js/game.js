/* สุขนคร — game.js : แกนเกม (เวลา เศรษฐกิจ เมือง งาน หนี้ ประชามติ เซฟ) */
(function () {
  var SK = (window.SK = window.SK || {});
  var C = SK.clamp;
  var G = (SK.G = {});
  G.SAVE_KEY = 'sooksan_city_save_v1';
  G.msgs = []; // ข้อความผลลัพธ์ล่าสุด (ให้ UI แสดง)

  // ======================================================================
  //  สร้างเกมใหม่
  // ======================================================================
  G.newState = function (o) {
    o = o || {};
    var path = SK.PATHS[o.path || 'newcomer'];
    var s = {
      v: 1, seed: o.seed != null ? o.seed : (Math.floor(Math.random() * 2147483647) + 1),
      day: 0, slot: 0, at: 'home',
      name: o.name || 'ฉัน', avatar: o.avatar || '🧑', path: o.path || 'newcomer', goal: o.goal || 'balanced',
      cash: path.cash, bank: 0, fundUnits: 0, fundCost: 0, loans: [], credit: 70,
      energy: 80, sat: 70, health: 85, mood: path.mood || 65, fitness: path.fitness || 45, diet: 55,
      skills: { service: 0, digital: 0, craft: 0, care: 0, mgmt: 0 }, edu: path.edu, certs: (path.cert || []).slice(), courses: {}, voucher: 0,
      job: null, openings: [], weekPay: 0, ssWeeks: 0, lastWeekly: 0, unemp: { claims: 0, last: -99 },
      home: { type: 'room', rentMult: 1, since: 0, subsidy: false },
      arrears: { rent: 0, rentMonths: 0, loans: 0 },
      groceries: 2, meals: 2, gifts: 1, inv: {}, mode: 'walk', passUntil: -1, gymUntil: -1,
      rel: {}, perks: {}, civic: 0, business: null,
      sick: null, immuneUntil: -1, tidyUntil: -1, dressedUntil: -1, bonusUntil: -1, referralUntil: -1, pet: false,
      today: { worked: false, leave: false, ot: false, meals: 0, start: 0 },
      month: { inc: {}, exp: {} }, otherIncome: 0, statements: [],
      log: [], news: [], pendingEvent: null, evCool: {}, ballot: null, flags: {}, tips: {},
      routine: { wd: ['work', 'work', 'auto'], we: ['auto', 'social', 'rest'] },
      stats: { shifts: 0, promotions: 0, volunteer: 0, votes: 0, donated: 0, hired: 0, bizOpened: false, bizProfit: 0, fundGain: 0, hadDebt: false, workStreak: 0, taxPaid: 0, daysIll: 0, absences: 0 },
      ach: {}, wb: [], ended: false,
      city: {
        m: { economy: 74, jobs: 71, housing: 68, health: 76, education: 78, transport: 70, environment: 73, safety: 80, culture: 75, trust: 72 },
        pop: SK.BASE_POP, treasury: 300, budget: {}, mods: {}, pending: [], policies: [], revMods: [],
        fundPrice: 100, foodMod: 0, billMod: 0, tuitionMod: 0, hist: [], ledger: { taxPaid: 0, volunteer: 0, donated: 0, work: 0 }
      }
    };
    SK.MKEYS.forEach(function (k) { s.city.budget[k] = 2; s.city.mods[k] = 0; });
    for (var k in path.skills) s.skills[k] = path.skills[k];
    SK.S = s;
    if (path.loan) {
      G.addLoan(path.loan.name, path.loan.principal, path.loan.rate, path.loan.months, 'start');
    }
    G.genOpenings();
    G.newBallot();
    G.log('ยินดีต้อนรับสู่สุขนคร! วันแรกของ' + s.name + ' เริ่มขึ้นแล้ว 🌅', 'good');
    G.news('ชาวสุขนครต้อนรับ ' + s.name + ' เข้าสู่เมือง — ' + path.name, 'city');
    return s;
  };

  // ======================================================================
  //  ตัวช่วยพื้นฐาน
  // ======================================================================
  G.log = function (msg, tone) {
    var s = SK.S;
    s.log.unshift({ d: s.day, t: s.slot, m: msg, tone: tone || 'n' });
    if (s.log.length > 160) s.log.length = 160;
    G.msgs.push({ m: msg, tone: tone || 'n' });
  };
  G.news = function (msg, kind) {
    var s = SK.S;
    s.news.unshift({ d: s.day, m: msg, k: kind || 'city' });
    if (s.news.length > 90) s.news.length = 90;
  };
  G.mod = function (k, d) { var s = SK.S; s[k] = C(s[k] + d, 0, 100); };
  G.skill = function (k, d) { var s = SK.S; s.skills[k] = C(s.skills[k] + d, 0, 100); };
  G.shock = function (metric, amt) { var m = SK.S.city.m; m[metric] = C(m[metric] + amt, 0, 100); };
  G.nudge = function (metric, amt, who) {
    G.shock(metric, amt);
    if (who) SK.S.city.ledger[who] = (SK.S.city.ledger[who] || 0) + Math.abs(amt);
  };
  G.perk = function (id) { return !!SK.S.perks[id]; };
  G.total = function () { return SK.S.cash + SK.S.bank; };
  G.canPay = function (n) { return G.total() >= n; };
  G.pay = function (n, cat) {
    var s = SK.S; n = Math.round(n); if (n <= 0) return;
    s.month.exp[cat || 'อื่นๆ'] = (s.month.exp[cat || 'อื่นๆ'] || 0) + n;
    var fromCash = Math.min(Math.max(s.cash, 0), n);
    s.cash -= fromCash;
    var rest = n - fromCash;
    if (rest > 0) { s.bank -= rest; if (s.bank < 0) { s.cash += s.bank; s.bank = 0; } }
  };
  G.earn = function (n, cat, taxable) {
    var s = SK.S; n = Math.round(n); if (n === 0) return;
    s.cash += n;
    s.month.inc[cat || 'อื่นๆ'] = (s.month.inc[cat || 'อื่นๆ'] || 0) + n;
    if (taxable) s.otherIncome += n;
  };
  G.isSick = function () { return !!SK.S.sick; };

  G.rentFactor = function () { return 1.35 - SK.S.city.m.housing / 100 * 0.7; };
  G.rentOf = function (type) {
    var s = SK.S, H = SK.HOUSING[type];
    if (!H || !H.rent) return 0;
    var r = H.rent * G.rentFactor() * s.home.rentMult;
    if (s.perks.rentDiscount) r *= 0.9;
    if (s.home.subsidy) r *= 0.8;
    return Math.round(r);
  };
  G.foodUnit = function () {
    var s = SK.S, c = s.city;
    var p = 55 * (1.2 - c.m.economy / 250) * (1 + c.foodMod);
    if (s.perks.groceryDiscount) p *= 0.85;
    return Math.max(25, Math.round(p));
  };
  G.streetPrice = function () { var c = SK.S.city; return Math.round(65 * (1.15 - c.m.economy / 300) * (1 + c.foodMod)); };
  G.tuition = function (fee) {
    var s = SK.S;
    var f = fee * (1.3 - s.city.m.education / 150) * (1 + s.city.tuitionMod);
    if (s.perks.bookworm) f *= 0.95;
    return Math.max(0, Math.round(f));
  };
  G.fridgeCap = function () { return SK.S.inv.fridge ? 12 : 6; };
  G.groceryCap = function () { return SK.S.inv.fridge ? 12 : 8; };

  // ความสัมพันธ์ / รางวัล
  G.rel = function (id) { var r = SK.S.rel[id]; return r ? r.v : 0; };
  G.relObj = function (id) {
    var s = SK.S;
    if (!s.rel[id]) s.rel[id] = { v: 0, last: -99, gift: -99, meal: -99, story: 0 };
    return s.rel[id];
  };
  G.reward = function (r) {
    var s = SK.S;
    if (!r) return;
    if (r.cash) G.earn(r.cash, 'ของขวัญและรางวัล');
    if (r.skill) for (var k in r.skill) G.skill(k, r.skill[k]);
    if (r.mood) G.mod('mood', r.mood);
    if (r.civic) s.civic += r.civic;
    if (r.perk) s.perks[r.perk] = true;
  };
  G.addRel = function (id, d) {
    var s = SK.S, npc = SK.NPCS[id], r = G.relObj(id);
    r.v = C(r.v + d, 0, 100);
    var thresholds = [25, 50, 75];
    while (r.story < 3 && r.v >= thresholds[r.story]) {
      var st = npc.story[r.story];
      r.story++;
      G.log('💬 ' + npc.icon + ' ' + npc.name + ': ' + st.text, 'story');
      G.reward(st.reward);
    }
    if (r.v >= npc.perk.at && !s.perks[npc.perk.id]) {
      s.perks[npc.perk.id] = true;
      G.log('⭐ ปลดล็อกสิทธิพิเศษจาก' + npc.name + ': ' + npc.perk.text, 'good');
    }
  };

  // ======================================================================
  //  เวลา
  // ======================================================================
  G.remaining = function () { return 3 - SK.S.slot; };

  G.passSlot = function () {
    var s = SK.S;
    s.slot++;
    s.sat = C(s.sat - 18, 0, 100);
    if (s.sat <= 0) { G.mod('health', -2); G.mod('mood', -3); G.mod('energy', -5); }
    else if (s.sat < 20) { G.mod('mood', -1.5); G.mod('energy', -1.5); }
  };
  G.advance = function (n) {
    var s = SK.S;
    for (var i = 0; i < n; i++) { if (s.slot < 3) G.passSlot(); }
    if (s.slot >= 3) G.endDay();
  };
  G.sleepNow = function () {
    var s = SK.S;
    var n = 3 - s.slot;
    if (n < 0) n = 0;
    s.flags.slept = true;
    G.advance(Math.max(n, 1));
  };

  G.sleepQuality = function () {
    var s = SK.S;
    var q = 60 + SK.HOUSING[s.home.type].comfort * 3;
    if (s.inv.ac) q += 5;
    if (s.day <= s.tidyUntil) q += 3;
    if (s.perks.calm) q += 4;
    if (s.sick) q -= 14;
    if (s.sat < 25) q -= 10;
    if (s.mood < 30) q -= 6;
    return q;
  };

  // ======================================================================
  //  จบวัน → กลางคืน → วันใหม่
  // ======================================================================
  G.endDay = function () {
    var s = SK.S, info = SK.dayInfo(s.day);

    // --- ตรวจการเข้างาน ---
    if (s.job) {
      var workday = !info.off;
      if (workday && !s.today.worked && !s.today.leave && !s.sick) {
        s.job.absences++; s.stats.absences++;
        G.log('⚠️ วันนี้ไม่ได้เข้างาน (ขาดงาน ' + s.job.absences + ' ครั้ง)', 'bad');
        if (s.job.absences >= 6) {
          G.loseJob('ถูกให้ออกเพราะขาดงานบ่อย');
        } else if (s.job.absences === 3) {
          G.news('คุณได้รับหนังสือเตือนเรื่องการขาดงาน', 'me');
          G.log('📄 หัวหน้าเตือนเรื่องการขาดงาน ระวังจะถูกให้ออก', 'bad');
        }
      }
    }
    s.stats.workStreak = s.today.worked ? s.stats.workStreak + 1 : 0;

    // --- นอนหลับและฟื้นตัว ---
    s.sat = C(s.sat - 10, 0, 100);
    var gain = G.sleepQuality();
    s.energy = C(s.energy + gain, 0, 100);
    var dh = 0.6 + (s.diet - 55) / 60 + (s.fitness - 40) / 80 + (s.city.m.environment - 60) / 80;
    if (s.sat < 20) dh -= 3;
    if (s.energy < 20) dh -= 1.5;
    if (s.sick) dh -= 1.2;
    if (s.mood < 25) dh -= 1;
    if (s.perks.doctorFriend) dh += 0.3;
    if (s.city.m.health > 70) dh += 0.2;
    s.health = C(s.health + dh, 0, 100);
    // อารมณ์
    var mt = 55 + SK.HOUSING[s.home.type].comfort * 2 + (s.sat > 50 ? 3 : -8) + (s.energy > 50 ? 3 : -4);
    mt += (s.city.m.culture - 60) / 10 + (s.pet ? 3 : 0) + (s.inv.washer ? 2 : 0) + (s.perks.calm ? 3 : 0) + (s.sick ? -6 : 0);
    mt += Object.keys(s.rel).filter(function (k) { return s.rel[k].v >= 50; }).length * 1.2;
    if (s.arrears.rent > 0 || s.arrears.loans > 0) mt -= 12;
    if (s.stats.workStreak > 6) mt -= (s.stats.workStreak - 6) * 2;
    if (s.cash + s.bank < 200) mt -= 6;
    if (G.lifeMood) mt += G.lifeMood();
    s.mood = C(s.mood + (mt - s.mood) * 0.22, 0, 100);
    // ฟิตเนสลดลงช้าๆ ถ้าไม่ได้ออก
    s.fitness = C(s.fitness - 0.12, 0, 100);
    if (s.mode === 'bike' && s.inv.bike) s.fitness = C(s.fitness + 0.1, 0, 100);
    // คุณภาพอาหารเฉลี่ยถดถอยเข้าหา 50 ถ้าไม่ได้กิน
    s.diet = C(s.diet + (50 - s.diet) * 0.03, 0, 100);

    // --- ป่วย ---
    if (s.sick) {
      s.sick.days--; s.stats.daysIll++;
      if (s.sick.days <= 0) { G.log('😊 หายป่วยแล้ว!', 'good'); s.sick = null; }
    }
    if (s.health <= 5) G.hospitalize();

    // --- ระบบรายวัน ---
    G.bizDaily();
    G.cityStep();
    G.fundStep();
    s.wb.push(Math.round((s.health + s.mood + Math.min(s.energy + 20, 100) + s.fitness) / 4));
    if (s.wb.length > 45) s.wb.shift();

    // --- วันใหม่ ---
    if (G.lifeNight) G.lifeNight();
    s.day++; s.slot = 0; s.at = 'home';
    s.today = { worked: false, leave: false, ot: false, meals: 0, start: s.day };
    var ni = SK.dayInfo(s.day);
    if (s.credit < 100) s.credit = Math.min(100, s.credit + 0.05);
    if (ni.date.dow === 1) { G.weeklyPay(); G.genOpenings(); G.weeklyPerks(); }
    if (ni.date.d === 1) G.monthly();
    if (G.lifeNewDay) G.lifeNewDay(ni);
    G.checkAch();
    G.rollEvent(ni);
    if (s.day % 7 === 0) G.snapshotCity();
    if (s.day === 365 && !s.flags.yearShown) { s.flags.yearShown = true; s.flags.yearEnd = true; }
    G.save();
  };

  G.hospitalize = function () {
    var s = SK.S;
    G.pay(Math.min(300, G.total()), 'ค่ารักษาพยาบาล');
    s.health = 45; s.energy = Math.max(s.energy, 50); s.sat = Math.max(s.sat, 50); s.sick = null;
    G.mod('mood', -10);
    G.log('🚑 คุณหมดสติและถูกนำส่งโรงพยาบาล ได้รับการรักษาจนปลอดภัย ควรดูแลตัวเองมากขึ้น', 'bad');
    G.news(s.name + ' เข้ารับการรักษาที่โรงพยาบาลชุมชนเพราะหักโหมเกินไป', 'me');
  };

  G.loseJob = function (why) {
    var s = SK.S, j = s.job;
    if (!j) return;
    var T = SK.TRACKS[j.track];
    G.log('💼 ' + why + ' (' + T.titles[j.level] + ')', 'bad');
    G.news(s.name + ' ' + why, 'me');
    G.mod('mood', -10);
    s.lastWage = G.wageOf(j) * 5;
    s.job = null;
    s.unemp = { claims: s.ssWeeks >= 13 ? 12 : 0, last: -99 };
    s.stats.workStreak = 0;
  };

  // ======================================================================
  //  งาน
  // ======================================================================
  G.wageOf = function (job) { return Math.round(SK.TRACKS[job.track].wage[job.level] * job.wageMult); };
  G.meetsReq = function (track, level) {
    var s = SK.S, R = SK.TRACKS[track].req[level], miss = [];
    if (s.edu < R.edu) miss.push('วุฒิ ' + SK.EDU[R.edu]);
    for (var k in R.skills) if (s.skills[k] < R.skills[k]) miss.push(SK.SKILLS[k].name + ' ' + R.skills[k]);
    if (R.cert && s.certs.indexOf(R.cert) < 0) miss.push('ใบรับรอง' + SK.CERTS[R.cert]);
    return { ok: miss.length === 0, miss: miss };
  };
  G.genOpenings = function () {
    var s = SK.S, jm = s.city.m.jobs, list = [];
    var n = Math.max(3, Math.round(4 + (jm - 55) / 7) + SK.rint(0, 2));
    function add(track, level) {
      var T = SK.TRACKS[track];
      list.push({ track: track, level: level, company: SK.pick(T.companies), wageMult: Math.round(SK.range(0.92, 1.12) * 100) / 100 });
    }
    add('cafe', 0); add('farm', 0);
    for (var i = list.length; i < n; i++) {
      var tk = SK.pick(SK.TRACK_KEYS);
      var r = SK.rand(), lv = 0;
      if (r > 0.80) lv = 1;
      if (r > (jm > 70 ? 0.93 : 0.97)) lv = 2;
      add(tk, lv);
    }
    s.openings = list;
  };
  G.hireChance = function (track, level) {
    var s = SK.S;
    var p = 0.62 + (s.city.m.jobs - 60) / 200;
    if (s.day <= s.dressedUntil) p += 0.04;
    if (s.inv.suit) p += 0.07;
    if (s.day <= s.bonusUntil) p += 0.1;
    if (s.day <= s.referralUntil || s.perks.cafeReferral) { if (track === 'cafe') p += 0.25; else p += 0.05; }
    return C(p, 0.25, 0.95);
  };
  G.hire = function (op) {
    var s = SK.S;
    s.job = { track: op.track, level: op.level, wageMult: op.wageMult, company: op.company, shifts: 0, shiftsAtLevel: 0, perf: 55, absences: 0, leaveLeft: 8, since: s.day };
    s.stats.hired++;
    var T = SK.TRACKS[op.track];
    G.log('🎉 ได้งานใหม่! ' + T.titles[op.level] + ' ที่ ' + op.company, 'good');
    G.news(s.name + ' เริ่มงานใหม่เป็น' + T.titles[op.level], 'me');
  };

  // รายได้รายสัปดาห์ (จันทร์เช้า)
  G.weeklyPay = function () {
    var s = SK.S, gross = Math.round(s.weekPay);
    if (gross <= 0) return;
    var mEq = gross * 4.33;
    var tax = (0.05 * C(mEq - 25000, 0, 20000) + 0.10 * Math.max(0, mEq - 45000)) / 4.33;
    var ss = Math.min(gross * 0.03, 173);
    tax = Math.round(tax); ss = Math.round(ss);
    s.cash += gross - tax - ss;
    s.month.inc['เงินเดือน/ค่าแรง'] = (s.month.inc['เงินเดือน/ค่าแรง'] || 0) + gross;
    if (tax + ss > 0) s.month.exp['ภาษีและประกันสังคม'] = (s.month.exp['ภาษีและประกันสังคม'] || 0) + tax + ss;
    s.lastWeekly = gross; s.ssWeeks++;
    s.stats.taxPaid += tax; s.city.ledger.taxPaid += tax;
    s.weekPay = 0;
    G.log('💵 เงินเดือนประจำสัปดาห์เข้าแล้ว ฿' + SK.fmt(gross - tax - ss) + (tax + ss > 0 ? ' (หักภาษี/ประกันสังคม ฿' + SK.fmt(tax + ss) + ')' : ''), 'good');
  };
  G.weeklyPerks = function () {
    var s = SK.S;
    if (s.perks.freeVeg) { s.groceries = Math.min(G.groceryCap(), s.groceries + 2); G.log('🥬 ' + SK.nn('farmer') + 'ฝากผักสดมาให้ 2 ชุด', 'good'); }
  };

  // ======================================================================
  //  การเงิน: หนี้ / กองทุน / รายเดือน
  // ======================================================================
  G.monthlyPayment = function (principal, rate, months) {
    var r = rate / 100 / 12;
    if (r <= 0) return principal / months;
    return principal * r / (1 - Math.pow(1 + r, -months));
  };
  G.addLoan = function (name, principal, rate, months, type) {
    var s = SK.S;
    s.loans.push({ id: s.day + '-' + s.loans.length + '-' + Math.floor(SK.rand() * 1000), name: name, principal: principal, rate: rate, months: months, monthly: Math.round(G.monthlyPayment(principal, rate, months)), type: type || 'personal' });
    s.stats.hadDebt = true;
  };
  G.totalDebt = function () { var t = 0; SK.S.loans.forEach(function (l) { t += l.principal; }); return t; };
  G.loanRate = function (base) { var r = base; if (SK.S.perks.loanRate) r -= 3; if (SK.S.credit < 40) r += 3; return Math.max(0, r); };
  G.fundValue = function () { return SK.S.fundUnits * SK.S.city.fundPrice; };

  G.fundStep = function () {
    var c = SK.S.city;
    var n = (SK.rand() + SK.rand() + SK.rand() - 1.5) / 1.5; // ~ N(0,0.8)
    var drift = (c.m.economy - 60) / 60 * 0.0004 + 0.00012;
    c.fundPrice = Math.max(20, c.fundPrice * (1 + drift + 0.008 * n));
  };

  G.billsOf = function () {
    var s = SK.S, H = SK.HOUSING[s.home.type], info = SK.dayInfo(s.day);
    if (s.home.type === 'shelter') return 0;
    var b = 500 + H.comfort * 160 + (s.inv.ac ? 350 : 0) + (s.inv.computer ? 60 : 0) + 400;
    if (info.season === 'ร้อน') b *= (s.inv.ac ? 1.3 : 1.1);
    b *= 1 + s.city.billMod;
    return Math.round(b);
  };

  // จ่ายหรือค้างชำระ → คืนจำนวนที่ค้าง
  G.payOrOwe = function (amt, cat) {
    var avail = G.total();
    amt = Math.round(amt);
    if (amt <= 0) return 0;
    var pay = Math.min(avail, amt);
    if (pay > 0) G.pay(pay, cat);
    return amt - pay;
  };

  G.monthly = function () {
    var s = SK.S, c = s.city, H = SK.HOUSING[s.home.type];
    var items = [];
    // 1. ภาษีรายได้อื่น (ฟรีแลนซ์/กิจการ)
    if (s.otherIncome > 0) {
      var ot = Math.round(0.05 * Math.max(0, s.otherIncome - 20000));
      if (ot > 0) { var o1 = G.payOrOwe(ot, 'ภาษีและประกันสังคม'); s.stats.taxPaid += ot - o1; c.ledger.taxPaid += ot - o1; items.push('ภาษีรายได้อื่น ' + SK.money(ot)); }
      s.otherIncome = 0;
    }
    // 2. ค่าเช่า
    var rent = G.rentOf(s.home.type);
    if (rent > 0) {
      var due = rent + s.arrears.rent;
      var owe = G.payOrOwe(due, 'ค่าเช่าบ้าน');
      if (owe > 0) {
        s.arrears.rent = owe; s.arrears.rentMonths++;
        s.credit = Math.max(0, s.credit - 6);
        items.push('⚠️ ค้างค่าเช่า ' + SK.money(owe));
        if (s.arrears.rentMonths === 1) G.log('📮 ได้รับใบแจ้งค้างค่าเช่า ติดต่อศูนย์พัฒนาสังคมได้ถ้าลำบาก', 'bad');
        if (s.arrears.rentMonths >= 3) { G.evict(); }
      } else { s.arrears.rent = 0; s.arrears.rentMonths = 0; }
    }
    // 3. ค่าสาธารณูปโภค + สัตว์เลี้ยง + รถ
    var bills = G.billsOf() + (s.pet ? 450 : 0) + (s.inv.car ? 1200 : 0) + (s.home.type === 'own' ? 400 : 0);
    if (bills > 0) {
      var ob = G.payOrOwe(bills, 'ค่าน้ำ ไฟ อินเทอร์เน็ตและอื่นๆ');
      if (ob > 0) { s.credit = Math.max(0, s.credit - 3); items.push('⚠️ ค้างค่าสาธารณูปโภค ' + SK.money(ob)); }
    }
    // 4. เงินกู้
    var paidLoans = 0, missed = false;
    for (var i = s.loans.length - 1; i >= 0; i--) {
      var L = s.loans[i];
      var interest = L.principal * L.rate / 100 / 12;
      var pay = Math.min(L.monthly, L.principal + interest);
      var o = G.payOrOwe(pay, 'ผ่อนชำระหนี้');
      var paid = pay - o;
      paidLoans += paid;
      if (o > 0) { missed = true; L.principal += o * 0.02; }
      L.principal = Math.max(0, L.principal - Math.max(0, paid - interest) + (paid < interest ? interest - paid : 0));
      L.months--;
      if (L.principal < 1 || L.months <= -6) {
        G.log('🎊 ผ่อน' + L.name + 'หมดแล้ว!', 'good');
        s.loans.splice(i, 1);
      }
    }
    if (missed) { s.credit = Math.max(0, s.credit - 8); items.push('⚠️ ผ่อนหนี้ไม่ครบ เครดิตลดลง'); s.arrears.loans = 1; }
    else { s.arrears.loans = 0; if (s.loans.length) s.credit = Math.min(100, s.credit + 1.5); }
    if (G.lifeMonthly) G.lifeMonthly(items);
    // 5. ดอกเบี้ยเงินฝาก
    if (s.bank > 0) { var di = Math.round(s.bank * 0.015 / 12); if (di > 0) G.earn(di, 'ดอกเบี้ยเงินฝาก'); }
    // 6. ใบแจ้งสรุปเดือน
    var inc = 0, exp = 0;
    for (var k in s.month.inc) inc += s.month.inc[k];
    for (var k2 in s.month.exp) exp += s.month.exp[k2];
    var prev = SK.dateOf(s.day - 1);
    var st = { label: SK.MONTHS[prev.m] + ' ' + prev.be, inc: s.month.inc, exp: s.month.exp, incT: inc, expT: exp, net: inc - exp, cash: s.cash, bank: s.bank, warn: items };
    s.statements.unshift(st);
    if (s.statements.length > 12) s.statements.length = 12;
    s.month = { inc: {}, exp: {} };
    s.flags.newStatement = true;
    s.ballotResultNote = null;
    G.resolveBallot();
    G.newBallot();
    c.revMods = c.revMods.filter(function (r) { r.d -= 30; return r.d > 0; });
    G.log('🧾 สรุปรายรับ–รายจ่ายเดือน' + SK.MONTHS[prev.m] + ' พร้อมแล้ว ดูได้ที่แท็บ "เงิน"', 'n');
  };

  G.evict = function () {
    var s = SK.S;
    s.home = { type: 'shelter', rentMult: 1, since: s.day, subsidy: false };
    s.arrears.rent = 0; s.arrears.rentMonths = 0;
    s.credit = Math.max(0, s.credit - 10);
    G.log('🏚️ คุณถูกบอกเลิกสัญญาเช่า เมืองจัดที่พักพิงชั่วคราวให้ในระหว่างตั้งหลัก', 'bad');
    G.news(s.name + ' ย้ายเข้าที่พักพิงชั่วคราวของเมืองหลังค้างค่าเช่า', 'me');
  };

  // ======================================================================
  //  กิจการ
  // ======================================================================
  G.bizDaily = function () {
    var s = SK.S, b = s.business;
    if (!b) return;
    var T = SK.BIZ[b.type], info = SK.dayInfo(s.day), m = s.city.m.economy;
    b.quality = C(b.quality - (1.4 - b.staff * 0.35), 0, 100);
    var rev = T.rev * (0.6 + m / 200) * (0.5 + b.quality / 200) * (1 + 0.35 * b.staff) * (1 + 0.25 * (b.level - 1));
    rev *= info.off ? 1.15 : 1;
    rev *= (s.day <= b.mkUntil) ? 1.2 : 1;
    rev *= 0.85 + SK.rand() * 0.3;
    var cost = T.fixed * (1 + 0.3 * (b.level - 1)) + b.staff * 250;
    var net = rev - cost;
    b.cashbox += net; b.profit += net;
    if (net > 0) s.stats.bizProfit += net;
    if (b.cashbox < -15000) {
      G.log('📉 กิจการ' + T.name + 'ขาดทุนสะสมหนักและต้องปิดตัว', 'bad');
      G.news(s.name + ' ปิดกิจการ' + T.name + ' เพราะขาดทุน', 'me');
      s.business = null; G.mod('mood', -12);
    }
  };

  // ======================================================================
  //  เมือง
  // ======================================================================
  G.cityScore = function () {
    var m = SK.S.city.m, t = 0;
    SK.MKEYS.forEach(function (k) { t += m[k]; });
    return t / SK.MKEYS.length;
  };
  G.cityStep = function () {
    var s = SK.S, c = s.city, m = c.m;
    // ผลที่ค่อยๆ ปรากฏจากนโยบาย/เหตุการณ์
    c.pending = c.pending.filter(function (p) { m[p.m] = C(m[p.m] + p.per, 0, 100); p.d--; return p.d > 0; });
    var season = SK.dayInfo(s.day).season;
    var popPress = (c.pop - SK.BASE_POP) / SK.BASE_POP;
    var broke = c.treasury < 0;
    var next = {};
    SK.MKEYS.forEach(function (k) {
      var w = SK.WEIGHTS[k], W = 0, sum = 0;
      for (var j in w) { W += w[j]; sum += w[j] * m[j]; }
      var lvl = (c.budget[k] || 0) - (broke ? 1 : 0);
      var t = (1 - W) * 72 + sum + 6 * (lvl - 2) + (c.mods[k] || 0);
      if (k === 'housing') t -= popPress * 25;
      if (k === 'transport') { t -= popPress * 20; if (season === 'ฝน') t -= 2; }
      if (k === 'environment') { t -= popPress * 15; }
      if (k === 'health' && season !== 'ร้อน') t -= 1;
      if (k === 'trust' && broke) t -= 12;
      next[k] = t;
    });
    SK.MKEYS.forEach(function (k) {
      m[k] = C(m[k] + (next[k] - m[k]) * 0.04 + (SK.rand() - 0.5) * 0.3, 0, 100);
    });
    // งบประมาณ
    var rev = 20 * (c.pop / SK.BASE_POP) * (0.55 + m.economy / 200 + m.trust / 500);
    c.revMods.forEach(function (r) { rev *= (1 + r.amt); });
    var exp = 0;
    SK.MKEYS.forEach(function (k) { exp += c.budget[k] || 0; });
    c.treasury = C(c.treasury + rev - exp, -300, 2500);
    // ประชากร
    var avg = G.cityScore();
    c.pop = Math.max(40000, c.pop * (1 + 0.00008 * (avg - 55) / 10 + (SK.rand() - 0.5) * 0.00002));
  };
  G.snapshotCity = function () {
    var c = SK.S.city, snap = { d: SK.S.day, m: {} };
    SK.MKEYS.forEach(function (k) { snap.m[k] = Math.round(c.m[k] * 10) / 10; });
    snap.t = Math.round(c.treasury); snap.p = Math.round(c.pop);
    c.hist.push(snap);
    if (c.hist.length > 60) c.hist.shift();
  };

  // ---------- ประชามติ ----------
  G.newBallot = function () {
    var s = SK.S, c = s.city, pool = SK.POLICIES.filter(function (p) {
      if (p.election) return false;
      if (p.budget) return c.treasury > 500 && (c.budget[p.budget] || 0) < 4;
      return c.policies.indexOf(p.id) < 0 || p.id === 'festival';
    });
    var opts = [];
    for (var i = 0; i < 3 && pool.length; i++) {
      var idx = Math.floor(SK.rand() * pool.length);
      opts.push(pool[idx].id); pool.splice(idx, 1);
    }
    var dt = SK.dateOf(s.day);
    var kind = 'policy';
    if (dt.m === 10) { kind = 'election'; opts = SK.POLICIES.filter(function (p) { return p.election; }).map(function (p) { return p.id; }); }
    s.ballot = { key: dt.key, label: SK.MONTHS[dt.m], opts: opts, mine: null, kind: kind };
  };
  G.vote = function (pid) {
    var s = SK.S;
    s.ballot.mine = pid; s.stats.votes++; s.civic += 3;
  };
  G.ballotScores = function () {
    var s = SK.S, c = s.city, b = s.ballot, out = {};
    var all = b.opts.concat(b.kind === 'election' ? [] : ['save']);
    all.forEach(function (id) {
      var sc;
      if (id === 'save') {
        sc = 0.6 + (c.treasury < 150 ? 2 : 0) + (c.treasury < 0 ? 3 : 0);
      } else {
        var p = SK.POLICY[id]; sc = 0;
        p.eff.forEach(function (e) { var need = (100 - c.m[e[0]]) / 50; sc += e[1] > 0 ? e[1] * need : e[1] * 0.6 * (c.m[e[0]] / 70); });
        sc -= p.cost / 60 * (c.treasury < 100 ? 1.5 : 0.6);
        sc *= 0.5;
      }
      if (b.mine === id) sc += 1.5 + s.civic / 80 + (s.perks.mayorEar ? 1 : 0);
      out[id] = sc;
    });
    return out;
  };
  G.resolveBallot = function () {
    var s = SK.S, c = s.city, b = s.ballot;
    if (!b) return;
    var sc = G.ballotScores(), best = null, bv = -1e9;
    for (var id in sc) { var v = sc[id] + SK.rand() * 1.2; if (v > bv) { bv = v; best = id; } }
    if (best === 'save') {
      c.treasury += 8;
      G.news('ประชามติเดือน' + b.label + ': ชาวเมืองเลือก "ออมงบไว้ก่อน" ไม่เริ่มโครงการใหม่', 'city');
      return;
    }
    var p = SK.POLICY[best];
    if (p.election) {
      G.adoptPolicy(p);
      G.news('ผลเลือกตั้งสภาเมือง: ' + p.icon + ' ' + p.name + ' ได้เสียงข้างมาก', 'city');
      G.log('🗳️ ผลเลือกตั้งสภาเมือง: ' + p.name + ' ชนะ' + (b.mine === best ? ' (ตรงกับที่คุณเลือก 🎉)' : ''), b.mine === best ? 'good' : 'n');
      return;
    }
    if (c.treasury < p.cost * 0.5) {
      G.news('โครงการ "' + p.name + '" ชนะประชามติแต่งบไม่พอ จึงถูกเลื่อนออกไป', 'city');
      G.shock('trust', -2);
      return;
    }
    G.adoptPolicy(p);
    var mine = b.mine === best ? ' (ตรงกับที่คุณโหวต 🎉)' : '';
    G.log('🗳️ ผลประชามติเดือน' + b.label + ': ' + p.icon + ' ' + p.name + ' ชนะ' + mine, b.mine === best ? 'good' : 'n');
  };
  G.adoptPolicy = function (p) {
    var c = SK.S.city;
    c.treasury -= p.cost;
    if (p.budget) c.budget[p.budget] = Math.min(4, (c.budget[p.budget] || 0) + 1);
    else if (!p.election && c.policies.indexOf(p.id) < 0) c.policies.push(p.id);
    p.eff.forEach(function (e) { c.pending.push({ m: e[0], per: e[1] / e[2], d: e[2] }); });
    if (p.mods) for (var k in p.mods) c.mods[k] = (c.mods[k] || 0) + p.mods[k];
    if (p.bills) c.billMod += p.bills;
    if (p.tuition) c.tuitionMod += p.tuition;
    if (p.foodPrice) c.foodMod += p.foodPrice;
    if (p.id === 'taxcut') c.revMods.push({ amt: -0.12, d: 90 });
    G.news('เมืองเริ่มโครงการ ' + p.icon + ' ' + p.name + ' (งบ ' + p.cost + ' ล้านบาท)', 'city');
  };

  // ======================================================================
  //  ความสำเร็จ / คะแนน
  // ======================================================================
  G.netWorth = function () {
    var s = SK.S, v = s.cash + s.bank + G.fundValue() - G.totalDebt() - (s.arrears.rent || 0);
    if (s.home.type === 'own') v += SK.HOUSING.own.price * 0.95;
    if (s.inv.car) v += SK.ITEMS[SK.ITEMS.length - 1].price * 0.6;
    if (s.business) v += SK.BIZ[s.business.type].capital * 0.5 * s.business.level + Math.max(0, s.business.cashbox);
    return Math.round(v);
  };
  G.checkAch = function () {
    var s = SK.S;
    SK.ACHIEVEMENTS.forEach(function (a) {
      if (!s.ach[a.id]) {
        var ok = false;
        try { ok = a.test(s); } catch (e) { ok = false; }
        if (ok) {
          s.ach[a.id] = s.day;
          G.log('🏆 ความสำเร็จใหม่: ' + a.icon + ' ' + a.name + ' — ' + a.desc, 'good');
          G.news(s.name + ' ปลดล็อกความสำเร็จ "' + a.name + '"', 'me');
          s.civic += 2;
        }
      }
    });
  };
  G.scores = function () {
    var s = SK.S, r = {};
    r.wealth = C(G.netWorth() / 5000, 0, 100);
    var wb = s.wb.length ? s.wb.reduce(function (a, b) { return a + b; }, 0) / s.wb.length : (s.health + s.mood) / 2;
    r.wellbeing = C(wb, 0, 100);
    var avgSkill = 0; for (var k in s.skills) avgSkill += s.skills[k];
    avgSkill /= 5;
    r.knowledge = C(s.edu * 14 + avgSkill * 0.9 + s.certs.length * 2, 0, 100);
    var rels = Object.keys(s.rel).map(function (k) { return s.rel[k].v; }).sort(function (a, b) { return b - a; }).slice(0, 5);
    r.social = C(rels.reduce(function (a, b) { return a + b; }, 0) / 5, 0, 100);
    r.civic = C(s.civic / 1.5, 0, 100);
    r.city = C(G.cityScore(), 0, 100);
    if (G.familyScore) r.social = C(r.social * 0.7 + G.familyScore() * 0.3, 0, 100);
    var w = SK.GOALS[s.goal].w, tot = 0, ws = 0;
    for (var key in r) { tot += r[key] * w[key]; ws += w[key]; }
    r.total = tot / ws;
    r.grade = r.total >= 80 ? 'S' : r.total >= 68 ? 'A' : r.total >= 56 ? 'B' : r.total >= 44 ? 'C' : 'D';
    return r;
  };

  // ======================================================================
  //  เซฟ / โหลด
  // ======================================================================
  G.save = function () {
    try {
      if (typeof localStorage === 'undefined') return false;
      localStorage.setItem(G.SAVE_KEY, JSON.stringify(SK.S));
      return true;
    } catch (e) { return false; }
  };
  G.hasSave = function () {
    try { return typeof localStorage !== 'undefined' && !!localStorage.getItem(G.SAVE_KEY); } catch (e) { return false; }
  };
  G.load = function () {
    try {
      var raw = localStorage.getItem(G.SAVE_KEY);
      if (!raw) return false;
      return G.importJSON(raw);
    } catch (e) { return false; }
  };
  G.importJSON = function (raw) {
    try {
      var s = JSON.parse(raw);
      if (!s || s.v !== 1 || !s.city || typeof s.day !== 'number') return false;
      SK.S = s; return true;
    } catch (e) { return false; }
  };
  G.exportJSON = function () { return JSON.stringify(SK.S); };
  G.wipe = function () { try { localStorage.removeItem(G.SAVE_KEY); } catch (e) {} };
})();
