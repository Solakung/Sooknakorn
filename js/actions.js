/* สุขนคร — actions.js : กิจกรรมทั้งหมดในแต่ละสถานที่ + ระบบดำเนินการ (perform) */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, C = SK.clamp;
  var H = (SK.H = {});
  var B = (SK.B = {}); // ตัวสร้างรายการกิจกรรมของแต่ละสถานที่

  function A(o) {
    var d = { slots: 0, cost: 0, energy: 0, group: '', desc: '', icon: '•', check: null, run: null };
    for (var k in o) d[k] = o[k];
    return d;
  }
  function S() { return SK.S; }
  function money(n) { return SK.money(n); }

  // ----------------------------------------------------------------------
  //  ตัวช่วยกลาง
  // ----------------------------------------------------------------------
  G.take = function (n) { // หักเงินที่ไม่ใช่ค่าใช้จ่าย (ฝาก/ลงทุน/โปะหนี้)
    var s = S(); n = Math.round(n);
    var fc = Math.min(Math.max(s.cash, 0), n); s.cash -= fc;
    var rest = n - fc;
    if (rest > 0) { s.bank -= rest; if (s.bank < 0) { s.cash += s.bank; s.bank = 0; } }
  };

  H.eat = function (sat, quality, mood) {
    var s = S();
    s.sat = C(s.sat + sat, 0, 100);
    s.diet = C(s.diet * 0.8 + quality * 0.2, 0, 100);
    s.today.meals++;
    if (mood) G.mod('mood', mood);
  };

  H.volunteer = function (metric, label, opts) {
    opts = opts || {};
    return A({
      key: 'vol:' + metric + (opts.tag || ''), group: 'อาสาสมัคร', icon: opts.icon || '🌻', name: label,
      desc: 'ช่วยเมืองเป็น ' + SK.METRICS[metric].icon + ' ' + SK.METRICS[metric].name + ' • ได้แต้มพลเมือง',
      slots: 1, energy: 14,
      run: function (s) {
        var amt = 0.4 + (s.certs.indexOf('firstaid') >= 0 ? 0.05 : 0);
        G.nudge(metric, amt, 'volunteer');
        s.civic += 3; s.stats.volunteer++;
        G.mod('mood', 3);
        if (opts.skill) G.skill(opts.skill, 0.5);
        if (opts.sat) G.mod('sat', opts.sat);
        if (opts.npc) G.addRel(opts.npc, 1.5);
        return label + ' เสร็จแล้ว รู้สึกภูมิใจที่ได้ช่วยเมือง (+3 แต้มพลเมือง)';
      }
    });
  };

  // ซื้อ/เรียน/ทำกิจกรรม: สร้างรายการฝึกทักษะด้วยตนเอง
  H.selfStudy = function (where) {
    var s = S(), out = [];
    Object.keys(SK.SKILLS).forEach(function (k) {
      var sk = SK.SKILLS[k];
      out.push(A({
        key: 'study:' + k, group: where === 'library' ? 'อ่านและฝึกทักษะ (เงียบสงบ ได้ผลดีกว่า)' : 'ฝึกทักษะด้วยตัวเอง',
        icon: sk.icon, name: 'ฝึก' + sk.name + ' (' + Math.floor(s.skills[k]) + ')',
        desc: where === 'library' ? 'อ่านและทดลองทำ ได้ทักษะประมาณ +1.6' : 'ดูคลิปและอ่านหนังสือ ได้ทักษะประมาณ +1.0',
        slots: 1, energy: where === 'library' ? 6 : 9,
        check: function (s) {
          if (k === 'digital' && where !== 'library' && !s.inv.computer) return 'ต้องมีโน้ตบุ๊ก (หรือไปฝึกที่ห้องสมุด)';
          if (s.skills[k] >= 100) return 'ทักษะเต็มแล้ว';
          return null;
        },
        run: function (s) {
          var g = where === 'library' ? 1.6 : 1.0;
          if (where === 'library' && s.perks.bookworm) g *= 1.5;
          G.skill(k, g);
          G.mod('mood', 1);
          return 'ฝึก' + sk.name + 'ไปอีกนิด ทักษะตอนนี้ ' + Math.floor(s.skills[k]);
        }
      }));
    });
    return out;
  };

  // ----------------------------------------------------------------------
  //  NPC ที่อยู่ในสถานที่
  // ----------------------------------------------------------------------
  G.npcsAt = function (locId) {
    var s = S(), info = SK.dayInfo(s.day), out = [];
    SK.NPC_KEYS.forEach(function (id) {
      var n = SK.NPCS[id], arr = info.off ? n.sched.we : n.sched.wd;
      if (arr[s.slot] === locId) out.push(id);
    });
    return out;
  };

  function npcActions(locId) {
    var s = S(), L = [];
    G.npcsAt(locId).forEach(function (id) {
      var n = SK.NPCS[id], r = G.relObj(id), g = 'npc:' + id;
      L.push(A({
        key: 'talk:' + id, group: g, npc: id, icon: '💬', name: 'พูดคุยกับ' + n.name,
        desc: 'เพิ่มความสนิท • ' + (r.last === s.day ? 'วันนี้คุยแล้ว (ได้น้อยลง)' : 'ฟังเรื่องราวและคำแนะนำ'),
        slots: 1, energy: 3,
        run: function (s) {
          var g2 = (r.last === s.day) ? 1.5 : 4 + SK.rint(0, 2) + (s.mood > 60 ? 1 : 0);
          r.last = s.day;
          G.addRel(id, g2);
          G.mod('mood', 3);
          return n.icon + ' ' + n.name + ': "' + SK.pick(n.lines) + '"';
        }
      }));
      L.push(A({
        key: 'meal:' + id, group: g, npc: id, icon: '🍜', name: 'ชวน' + n.name + 'ไปกินข้าว',
        desc: 'อิ่มท้อง อารมณ์ดี เพิ่มความสนิทมาก', slots: 1, cost: 120, energy: 2,
        check: function (s) { return (s.day - r.meal < 3) ? 'เพิ่งไปกินด้วยกันเมื่อไม่นานมานี้' : null; },
        run: function (s) {
          r.meal = s.day; H.eat(34, 60, 4); G.addRel(id, 8);
          return 'กินข้าวกับ' + n.name + 'อย่างอบอุ่น คุยกันสนุกจนลืมเวลา';
        }
      }));
      L.push(A({
        key: 'gift:' + id, group: g, npc: id, icon: '🎁', name: 'มอบ' + n.gift + 'เป็นของขวัญ',
        desc: 'ใช้ของฝาก 1 ชิ้น (มี ' + s.gifts + ') • ซื้อได้ที่ตลาด', slots: 0,
        check: function (s) {
          if (s.gifts <= 0) return 'ไม่มีของฝาก (ซื้อที่ตลาด)';
          if (s.day - r.gift < 7) return 'ให้ของขวัญไปแล้วในสัปดาห์นี้';
          return null;
        },
        run: function (s) { s.gifts--; r.gift = s.day; G.addRel(id, 7); return n.name + 'ดีใจมากที่ได้รับ' + n.gift; }
      }));
    });
    return L;
  }

  // ----------------------------------------------------------------------
  //  บ้าน
  // ----------------------------------------------------------------------
  B.home = function (s) {
    var L = [], comfort = SK.HOUSING[s.home.type].comfort, cap = G.fridgeCap();
    L.push(A({
      key: 'rest', group: 'พักผ่อน', icon: '🛋️', name: 'พักผ่อน / งีบ', desc: 'พลังงานกลับมา +' + (22 + comfort * 2),
      slots: 1, energy: -(22 + comfort * 2 + (s.day <= s.tidyUntil ? 3 : 0)),
      run: function () { G.mod('mood', 2); return 'งีบหลับสบายๆ รู้สึกสดชื่นขึ้น'; }
    }));
    L.push(A({
      key: 'entertain', group: 'พักผ่อน', icon: s.inv.tv ? '📺' : '🎮', name: 'ดูหนัง / เล่นเกม / ฟังเพลง',
      desc: 'อารมณ์ดีขึ้น' + (s.inv.tv ? ' (มีทีวี: ดีขึ้นอีก)' : ''), slots: 1, energy: -3,
      run: function () { G.mod('mood', s.inv.tv ? 16 : 10); return 'ผ่อนคลายกับความบันเทิงที่ชอบ'; }
    }));
    if (s.inv.guitar) L.push(A({
      key: 'guitar', group: 'พักผ่อน', icon: '🎸', name: 'เล่นกีตาร์', desc: 'งานอดิเรกที่ผ่อนคลาย', slots: 1, energy: -2,
      run: function () { G.mod('mood', 13); G.mod('energy', 0); return 'ดีดกีตาร์เบาๆ ใจเบาสบาย'; }
    }));
    L.push(A({
      key: 'clean', group: 'งานบ้าน', icon: '🧹', name: 'ทำความสะอาดห้อง / ซักผ้า',
      desc: 'ห้องสะอาด นอนหลับดีขึ้นอีก 4 วัน', slots: 1, energy: s.inv.washer ? 6 : 10,
      run: function (s) { s.tidyUntil = s.day + 4; G.mod('mood', 3); return 'ห้องสะอาดเอี่ยม นอนหลับสบายขึ้นอีกหลายวัน'; }
    }));
    L.push(A({
      key: 'cook', group: 'อาหาร', icon: '🍳', name: 'ทำกับข้าวเตรียมไว้ (ใช้วัตถุดิบ 3 ชุด → ได้ 6 กล่อง)',
      desc: 'มีอยู่ ' + s.groceries + ' ชุด • เก็บได้สูงสุด ' + cap + ' กล่อง', slots: 1, energy: 6,
      check: function (s) {
        if (s.groceries < 3) return 'ต้องมีวัตถุดิบ 3 ชุด (ซื้อที่ตลาดสด)';
        if (s.meals >= cap) return 'ตู้เก็บอาหารเต็มแล้ว';
        return null;
      },
      run: function (s) {
        s.groceries -= 3; var before = s.meals; s.meals = Math.min(cap, s.meals + 6);
        G.mod('mood', 3);
        return 'ทำกับข้าวเสร็จ ได้อาหารเพิ่ม ' + (s.meals - before) + ' กล่อง (รวม ' + s.meals + ')';
      }
    }));
    L.push(A({
      key: 'eat', group: 'อาหาร', icon: '🍱', name: 'กินอาหารที่ทำไว้', desc: 'มี ' + s.meals + ' กล่อง • อิ่ม +34 • คุณภาพดี',
      slots: 0,
      check: function (s) { if (s.meals <= 0) return 'ไม่มีอาหารที่ทำไว้'; if (s.sat > 82) return 'ยังอิ่มอยู่'; return null; },
      run: function (s) { s.meals--; H.eat(34, 80, 1); G.mod('health', 0.3); return 'อิ่มอร่อยกับอาหารฝีมือตัวเอง'; }
    }));
    H.selfStudy('home').forEach(function (a) { L.push(a); });
    if (s.inv.computer) L.push(A({
      key: 'freelance', group: 'งานเสริม', icon: '👩‍💻', name: 'รับงานฟรีแลนซ์ออนไลน์',
      desc: 'ต้องมีทักษะดิจิทัล ≥ 25 • ค่าตอบแทน ≈ ฿' + Math.round(250 + s.skills.digital * 5), slots: 1, energy: 12,
      check: function (s) { return s.skills.digital < 25 ? 'ต้องมีทักษะดิจิทัล 25 ขึ้นไป' : null; },
      run: function (s) {
        var pay = Math.round((250 + s.skills.digital * 5) * (0.75 + s.city.m.economy / 200) * SK.range(0.85, 1.2));
        G.earn(pay, 'งานฟรีแลนซ์', true); G.skill('digital', 0.5);
        return 'ส่งงานฟรีแลนซ์เสร็จ ได้ค่าตอบแทน ' + money(pay);
      }
    }));
    if (s.pet) L.push(A({
      key: 'pet', group: 'พักผ่อน', icon: '🐱', name: 'เล่นกับแมวที่เลี้ยง', desc: 'อารมณ์ดีขึ้นทันที', slots: 0,
      check: function (s) { return s.flags.petDay === s.day ? 'วันนี้เล่นกับแมวแล้ว' : null; },
      run: function (s) { s.flags.petDay = s.day; G.mod('mood', 6); return 'แมวขดอยู่บนตักและส่งเสียงครืดคราด'; }
    }));
    L.push(A({
      key: 'sleep', group: 'ปิดวัน', icon: '🌙', name: 'เข้านอน (ข้ามเวลาที่เหลือของวัน)', desc: 'จบวันนี้และไปเริ่มวันพรุ่งนี้',
      slots: 3 - s.slot, energy: 0, confirm: false,
      run: function () { return 'ราตรีสวัสดิ์ 🌙'; }
    }));
    return npcActions('home').concat(L);
  };

  // ----------------------------------------------------------------------
  //  สำนักงานที่อยู่อาศัย
  // ----------------------------------------------------------------------
  B.housing = function (s) {
    var L = [], cur = s.home.type;
    SK.RENT_KEYS.forEach(function (t) {
      var Ht = SK.HOUSING[t], rent = G.rentOf(t), isCur = cur === t;
      L.push(A({
        key: 'move:' + t, group: 'ย้ายที่อยู่ (เช่า)', icon: Ht.icon, name: Ht.name + ' — ' + money(rent) + '/เดือน',
        desc: Ht.desc + ' • ความสบาย ' + Ht.comfort + '/4 • มัดจำ+ค่าย้าย ' + money(rent + 300) + (isCur ? ' • (ที่พักปัจจุบัน)' : ''),
        slots: 1, cost: isCur ? 0 : rent + 300, energy: 8,
        check: function (s) {
          if (isCur) return 'อาศัยอยู่ที่นี่แล้ว';
          if (s.arrears.rent > 0) return 'ต้องชำระค่าเช่าค้างก่อน';
          if (cur === 'own') return 'ขายบ้านตัวเองก่อนจึงจะย้ายไปเช่าได้';
          return null;
        },
        run: function (s) {
          s.home = { type: t, rentMult: 1, since: s.day, subsidy: false };
          return 'ย้ายเข้า' + Ht.name + 'เรียบร้อย';
        }
      }));
    });
    var O = SK.HOUSING.own, fees = 5000;
    L.push(A({
      key: 'buy', group: 'บ้านมั่นคง (โครงการรัฐ)', icon: O.icon, name: 'ซื้อบ้านมั่นคง ราคา ' + money(O.price),
      desc: 'ดาวน์ ' + money(O.down) + ' + ค่าธรรมเนียม ' + money(fees) + ' • ผ่อนประมาณ ' + money(G.monthlyPayment(O.price - O.down, G.loanRate(O.rate), O.months)) + '/เดือน นาน 25 ปี',
      slots: 1, cost: O.down + fees, energy: 6,
      check: function (s) {
        if (cur === 'own') return 'เป็นเจ้าของบ้านอยู่แล้ว';
        if (!s.job && !s.business) return 'ต้องมีรายได้ประจำหรือกิจการ';
        if (s.credit < 40) return 'คะแนนเครดิตต่ำเกินไป (ต้อง ≥ 40)';
        if (G.totalDebt() > 250000) return 'ภาระหนี้สูงเกินไป';
        if (s.arrears.rent > 0) return 'ต้องชำระค่าเช่าค้างก่อน';
        return null;
      },
      run: function (s) {
        s.home = { type: 'own', rentMult: 1, since: s.day, subsidy: false };
        G.addLoan('สินเชื่อบ้านมั่นคง', O.price - O.down, G.loanRate(O.rate), O.months, 'home');
        G.news(s.name + ' ได้เป็นเจ้าของบ้านมั่นคงหลังแรก 🏡', 'me');
        return '🏡 ยินดีด้วย! คุณเป็นเจ้าของบ้านแล้ว';
      }
    }));
    if (cur === 'own') L.push(A({
      key: 'sell', group: 'บ้านมั่นคง (โครงการรัฐ)', icon: '🏷️', name: 'ขายบ้านและกลับไปเช่า', desc: 'ขายที่ 95% ของราคา หักยอดสินเชื่อคงเหลือ',
      slots: 1, confirm: 'ยืนยันขายบ้านของคุณ?',
      run: function (s) {
        var loans = s.loans.filter(function (l) { return l.type === 'home'; }), debt = 0;
        loans.forEach(function (l) { debt += l.principal; });
        s.loans = s.loans.filter(function (l) { return l.type !== 'home'; });
        var net = Math.round(O.price * 0.95 - debt);
        s.cash += net;
        s.home = { type: 'room', rentMult: 1, since: s.day, subsidy: false };
        return 'ขายบ้านเรียบร้อย ได้เงินสุทธิ ' + money(net) + ' และย้ายกลับไปเช่าห้อง';
      }
    }));
    L.push(A({
      key: 'subsidy', group: 'สิทธิประโยชน์', icon: '📝', name: 'ขอเงินอุดหนุนค่าเช่า (ลด 20%)',
      desc: 'สำหรับผู้มีรายได้ต่ำกว่า ฿14,000/เดือน', slots: 1,
      check: function (s) {
        if (s.home.subsidy) return 'ได้รับสิทธิ์อยู่แล้ว';
        if (SK.RENT_KEYS.indexOf(s.home.type) < 0) return 'ใช้ได้กับที่พักเช่าเท่านั้น';
        if (s.lastWeekly * 4.33 > 14000) return 'รายได้เกินเกณฑ์';
        return null;
      },
      run: function (s) { s.home.subsidy = true; return 'ได้รับสิทธิ์อุดหนุนค่าเช่า ลดลง 20% ทุกเดือน'; }
    }));
    return npcActions('housing').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ตลาดสด
  // ----------------------------------------------------------------------
  B.market = function (s) {
    var L = [], u = G.foodUnit(), sp = G.streetPrice(), cap = G.groceryCap();
    L.push(A({
      key: 'groc', group: 'วัตถุดิบ', icon: '🥬', name: 'ซื้อวัตถุดิบ 3 ชุด', desc: 'ชุดละ ' + money(u) + ' • มีอยู่ ' + s.groceries + '/' + cap,
      slots: 0, cost: u * 3,
      check: function (s) { return s.groceries + 3 > cap ? 'ตู้เก็บของเต็ม' : null; },
      run: function (s) { s.groceries += 3; return 'ซื้อวัตถุดิบสดมา 3 ชุด'; }
    }));
    L.push(A({
      key: 'street', group: 'กินที่ตลาด', icon: '🍛', name: 'ข้าวแกง / อาหารริมทาง', desc: 'อิ่ม +34 • คุณภาพปานกลาง • ไม่เสียเวลา',
      slots: 0, cost: sp, check: function (s) { return s.sat > 82 ? 'ยังอิ่มอยู่' : null; },
      run: function () { H.eat(34, 50, 1); return 'อิ่มอร่อยกับข้าวแกงร้อนๆ'; }
    }));
    L.push(A({
      key: 'salad', group: 'กินที่ตลาด', icon: '🥗', name: 'สลัดผักและผลไม้สด', desc: 'อิ่ม +28 • คุณภาพสูง ดีต่อสุขภาพ',
      slots: 0, cost: Math.round(sp * 1.5), check: function (s) { return s.sat > 85 ? 'ยังอิ่มอยู่' : null; },
      run: function () { H.eat(28, 92, 1); G.mod('health', 0.8); return 'สดชื่นกับผักผลไม้ปลอดสาร'; }
    }));
    L.push(A({
      key: 'gift', group: 'ของฝาก', icon: '🎁', name: 'ซื้อของฝากสำหรับเพื่อนบ้าน', desc: 'ใช้เป็นของขวัญให้คนในเมือง • มี ' + s.gifts + ' ชิ้น',
      slots: 0, cost: 150, check: function (s) { return s.gifts >= 5 ? 'ถือของฝากเต็มแล้ว' : null; },
      run: function (s) { s.gifts++; return 'เลือกของฝากน่ารักๆ ไว้ 1 ชิ้น'; }
    }));
    L.push(A({
      key: 'stall', group: 'งานเสริม', icon: '🧺', name: 'ช่วย' + SK.nn('auntie') + 'ขายของ (พาร์ตไทม์)', desc: 'ได้ ≈ ฿' + Math.round(210 * (0.8 + s.city.m.economy / 250)) + ' • ฝึกทักษะบริการ', slots: 1, energy: 14,
      run: function (s) {
        var pay = Math.round(SK.range(170, 260) * (0.8 + s.city.m.economy / 250));
        G.earn(pay, 'งานเสริม', true); G.skill('service', 0.6); G.addRel('auntie', 1.5);
        return 'ช่วยขายของจนเหนื่อยแต่สนุก ได้ ' + money(pay);
      }
    }));
    return npcActions('market').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ห้างสรรพสินค้า
  // ----------------------------------------------------------------------
  B.mall = function (s) {
    var L = [];
    SK.ITEMS.forEach(function (it) {
      var owned = !!s.inv[it.id];
      if (it.financed) {
        var f = it.financed, rate = G.loanRate(f.rate), mp = G.monthlyPayment(it.price - f.down, rate, f.months);
        L.push(A({
          key: 'buy:' + it.id, group: 'ของใช้และยานพาหนะ', icon: it.icon, name: it.name + (owned ? ' (มีแล้ว)' : ''),
          desc: it.desc + ' • ดาวน์ ' + money(f.down) + ' ผ่อน ' + money(mp) + '/เดือน + ประกัน/ค่าบำรุง ฿1,200',
          slots: 1, cost: owned ? 0 : f.down, energy: 4,
          check: function (s) {
            if (owned) return 'มีแล้ว';
            if (s.certs.indexOf(it.needCert) < 0) return 'ต้องมี' + SK.CERTS[it.needCert] + ' (เรียนที่วิทยาลัยชุมชน)';
            if (s.credit < 40) return 'เครดิตไม่ผ่านเกณฑ์ (≥ 40)';
            if (!s.job && !s.business) return 'ต้องมีรายได้ประจำ';
            return null;
          },
          run: function (s) {
            s.inv[it.id] = true; G.addLoan('ผ่อน' + it.name, it.price - f.down, rate, f.months, 'car');
            G.mod('mood', 8); G.news(s.name + ' ออกรถคันแรก 🚗', 'me');
            return 'ออกรถเรียบร้อย! ไปเปลี่ยนวิธีเดินทางได้ที่สถานีขนส่ง';
          }
        }));
      } else {
        L.push(A({
          key: 'buy:' + it.id, group: 'ของใช้และยานพาหนะ', icon: it.icon, name: it.name + (owned ? ' (มีแล้ว)' : ''),
          desc: it.desc, slots: 0, cost: owned ? 0 : it.price,
          check: function (s) { return owned ? 'มีแล้ว' : null; },
          run: function (s) { s.inv[it.id] = true; G.mod('mood', 5); return 'ซื้อ' + it.name + 'แล้ว ' + it.icon; }
        }));
      }
    });
    L.push(A({
      key: 'clothes', group: 'ดูแลตัวเอง', icon: '👕', name: 'ซื้อเสื้อผ้าและตัดผมใหม่', desc: 'อารมณ์ดี ดูดีขึ้นตลอด 60 วัน', slots: 1, cost: 900, energy: 6,
      run: function (s) { s.dressedUntil = s.day + 60; G.mod('mood', 9); return 'ลุคใหม่! มั่นใจขึ้นเยอะ'; }
    }));
    L.push(A({
      key: 'cinema', group: 'บันเทิง', icon: '🎬', name: 'ดูหนังโรงภาพยนตร์', desc: 'อารมณ์ดีมาก', slots: 1, cost: 220, energy: -2,
      run: function () { G.mod('mood', 16); return 'ดูหนังสนุกมาก ใจฟู'; }
    }));
    L.push(A({
      key: 'pet', group: 'ดูแลตัวเอง', icon: '🐱', name: 'รับแมวจรไปเลี้ยง', desc: 'อารมณ์ดีขึ้นทุกวัน (ค่าเลี้ยง ฿450/เดือน)', slots: 1, cost: 600,
      check: function (s) { return s.pet ? 'เลี้ยงอยู่แล้ว' : (s.home.type === 'dorm' || s.home.type === 'shelter') ? 'ที่พักปัจจุบันเลี้ยงสัตว์ไม่ได้' : null; },
      run: function (s) { s.pet = true; G.mod('mood', 12); return 'ได้เพื่อนตัวเล็กมาอยู่ด้วยแล้ว 🐱'; }
    }));
    return npcActions('mall').concat(L);
  };

  // ----------------------------------------------------------------------
  //  คาเฟ่
  // ----------------------------------------------------------------------
  B.cafe = function (s) {
    var L = [], cp = s.perks.cafeReferral ? 45 : 90;
    L.push(A({
      key: 'coffee', group: 'เครื่องดื่มและอาหาร', icon: '☕', name: 'กาแฟและขนม', desc: 'พลังงาน +8 • อารมณ์ดี • อิ่มนิดหน่อย',
      slots: 0, cost: cp, check: function (s) { return s.flags.coffeeDay === s.day && s.flags.coffeeSlot === s.slot ? 'ดื่มไปแล้วในช่วงนี้' : null; },
      run: function (s) { s.flags.coffeeDay = s.day; s.flags.coffeeSlot = s.slot; G.mod('energy', 8); G.mod('mood', 4); G.mod('sat', 8); return 'จิบกาแฟหอมๆ ตื่นตัวขึ้น'; }
    }));
    L.push(A({
      key: 'lunch', group: 'เครื่องดื่มและอาหาร', icon: '🥪', name: 'อาหารมื้อหลักที่คาเฟ่', desc: 'อิ่ม +46 • คุณภาพปานกลาง',
      slots: 0, cost: 160, check: function (s) { return s.sat > 80 ? 'ยังอิ่มอยู่' : null; },
      run: function () { H.eat(46, 62, 3); return 'มื้ออร่อยในบรรยากาศดี'; }
    }));
    L.push(A({
      key: 'relax', group: 'พักใจ', icon: '📖', name: 'นั่งอ่านหนังสือ / มองผู้คน', desc: 'อารมณ์ดีขึ้น มีโอกาสได้เจอคนใหม่',
      slots: 1, cost: 90, energy: -3,
      run: function (s) { G.mod('mood', 8); if (SK.chance(0.4)) G.addRel('cafe', 1); return 'นั่งชิลล์ในคาเฟ่จนใจสงบ'; }
    }));
    L.push(A({
      key: 'part', group: 'งานเสริม', icon: '🧑‍🍳', name: 'ช่วยงานร้านกาแฟ (พาร์ตไทม์)', desc: 'ได้ ≈ ฿' + Math.round(240 * (0.8 + s.city.m.economy / 250)) + ' • ฝึกทักษะบริการ', slots: 1, energy: 16,
      run: function (s) {
        var pay = Math.round(SK.range(200, 280) * (0.8 + s.city.m.economy / 250));
        G.earn(pay, 'งานเสริม', true); G.skill('service', 0.7); G.addRel('cafe', 1.5);
        return 'ช่วยชงกาแฟและเสิร์ฟทั้งวัน ได้ ' + money(pay);
      }
    }));
    return npcActions('cafe').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ที่ทำงาน
  // ----------------------------------------------------------------------
  function workday(s) { return !SK.dayInfo(s.day).off; }
  B.work = function (s) {
    var j = s.job, L = [];
    if (!j) {
      L.push(A({ key: 'nojob', group: 'งานประจำ', icon: '🔍', name: 'ยังไม่มีงานประจำ', desc: 'ไปที่ศูนย์จัดหางานเพื่อสมัครงาน', check: function () { return 'ไปสมัครงานที่ศูนย์จัดหางาน'; }, run: function () { return ''; } }));
      return L;
    }
    var T = SK.TRACKS[j.track], w = G.wageOf(j), info = SK.dayInfo(s.day);
    function baseCheck(s) {
      if (s.sick) return 'ป่วยอยู่ พักผ่อนก่อน';
      if (T.weekdaysOnly && info.off) return 'ที่ทำงานปิดในวันหยุด';
      if (s.today.worked) return 'วันนี้เข้างานไปแล้ว';
      return null;
    }
    function doWork(s, f, slotsLabel) {
      var pay = Math.round(w * f);
      s.weekPay += pay; j.shifts++; j.shiftsAtLevel++; s.stats.shifts++;
      s.today.worked = true;
      j.perf = C(j.perf + (s.energy < 30 ? -2 : (f < 1 ? 0.6 : 1.8)), 0, 100);
      G.mod('mood', T.mood * f);
      G.skill(T.skill, 0.3 * f);
      for (var m in T.effect) G.nudge(m, T.effect[m] * f, 'work');
      return 'ทำงาน' + slotsLabel + 'เสร็จ ค่าแรง ' + money(pay) + ' (จ่ายทุกวันจันทร์)';
    }
    L.push(A({
      key: 'shift', group: T.titles[j.level] + ' • ' + j.company, icon: T.icon, name: 'เข้ากะเต็มวัน (เช้า–บ่าย)', desc: 'ค่าแรง ' + money(w) + ' • เหนื่อย ' + T.energy,
      slots: 2, energy: T.energy,
      check: function (s) { var r = baseCheck(s); if (r) return r; if (s.slot > 1) return 'เวลาไม่พอสำหรับกะเต็ม'; return null; },
      run: function (s) { return doWork(s, 1, 'เต็มวัน'); }
    }));
    L.push(A({
      key: 'half', group: T.titles[j.level] + ' • ' + j.company, icon: '🕐', name: 'ทำงานครึ่งวัน', desc: 'ค่าแรง ' + money(w * 0.55) + ' • เหนื่อย ' + Math.round(T.energy * 0.55),
      slots: 1, energy: Math.round(T.energy * 0.55), check: baseCheck,
      run: function (s) { return doWork(s, 0.55, 'ครึ่งวัน'); }
    }));
    L.push(A({
      key: 'ot', group: T.titles[j.level] + ' • ' + j.company, icon: '🌙', name: 'ทำโอทีช่วงเย็น', desc: 'ค่าแรง ' + money(w * 0.6) + ' • เหนื่อยมาก 24', slots: 1, energy: 24,
      check: function (s) {
        if (s.sick) return 'ป่วยอยู่';
        if (!s.today.worked) return 'ต้องเข้างานตามปกติก่อน';
        if (s.today.ot) return 'ทำโอทีไปแล้ววันนี้';
        return null;
      },
      run: function (s) { s.today.ot = true; var p = Math.round(w * 0.6); s.weekPay += p; j.perf = C(j.perf + 0.8, 0, 100); G.mod('mood', -3); return 'ทำโอทีเพิ่ม ได้อีก ' + money(p); }
    }));
    L.push(A({
      key: 'leave', group: 'การลาและตำแหน่ง', icon: '🏖️', name: 'ลาพักร้อน (เหลือ ' + j.leaveLeft + ' วัน)', desc: 'ไม่ถูกนับว่าขาดงาน • อารมณ์ดีขึ้น', slots: 0,
      check: function (s) {
        if (j.leaveLeft <= 0) return 'วันลาหมดแล้ว';
        if (!workday(s)) return 'วันนี้เป็นวันหยุดอยู่แล้ว';
        if (s.today.worked || s.today.leave) return 'ไม่จำเป็นต้องลา';
        return null;
      },
      run: function (s) { j.leaveLeft--; s.today.leave = true; G.mod('mood', 8); return 'แจ้งลาพักร้อนวันนี้เรียบร้อย พักให้เต็มที่!'; }
    }));
    var nxt = j.level + 1;
    L.push(A({
      key: 'promote', group: 'การลาและตำแหน่ง', icon: '📈', name: j.level >= 2 ? 'ตำแหน่งสูงสุดของสายงานนี้แล้ว' : 'ขอเลื่อนเป็น ' + T.titles[nxt],
      desc: j.level >= 2 ? '' : 'ต้องทำงานในตำแหน่ง ' + j.shiftsAtLevel + '/' + G.promoNeed(j).shifts + ' กะ • ผลงาน ' + Math.round(j.perf) + '/' + G.promoNeed(j).perf + ' • ค่าแรงใหม่ ' + money(T.wage[nxt] * j.wageMult), slots: 0,
      check: function (s) {
        if (j.level >= 2) return 'อยู่ตำแหน่งสูงสุดแล้ว';
        var need = G.promoNeed(j);
        if (j.shiftsAtLevel < need.shifts) return 'ต้องทำงานให้ครบ ' + need.shifts + ' กะ (ตอนนี้ ' + j.shiftsAtLevel + ')';
        if (j.perf < need.perf) return 'ผลงานยังไม่ถึงเกณฑ์ (' + need.perf + ')';
        var r = G.meetsReq(j.track, nxt);
        if (!r.ok) return 'ยังขาด: ' + r.miss.join(', ');
        return null;
      },
      run: function (s) {
        j.level = nxt; j.shiftsAtLevel = 0; j.perf = 55; s.stats.promotions++; G.mod('mood', 15);
        G.news(s.name + ' ได้เลื่อนตำแหน่งเป็น' + T.titles[nxt] + ' 🎉', 'me');
        return '🎉 ได้เลื่อนตำแหน่งเป็น' + T.titles[nxt] + '!';
      }
    }));
    L.push(A({
      key: 'resign', group: 'การลาและตำแหน่ง', icon: '🚪', name: 'ลาออกจากงาน', desc: 'ออกจากงานประจำ (เงินเดือนที่ค้างยังได้รับ)', slots: 0, confirm: 'ยืนยันลาออกจากงาน?',
      run: function (s) { s.job = null; s.unemp = { claims: 0, last: -99 }; s.stats.workStreak = 0; return 'ยื่นใบลาออกเรียบร้อย ขอให้โชคดีกับก้าวต่อไป'; }
    }));
    return L;
  };

  // ----------------------------------------------------------------------
  //  ศูนย์จัดหางาน
  // ----------------------------------------------------------------------
  function reqText(track, level) {
    var R = SK.TRACKS[track].req[level], p = [];
    p.push('วุฒิ ' + SK.EDU[R.edu]);
    for (var k in R.skills) p.push(SK.SKILLS[k].name + ' ' + R.skills[k]);
    if (R.cert) p.push(SK.CERTS[R.cert]);
    return p.join(' • ');
  }
  H.reqText = reqText;
  B.jobs = function (s) {
    var L = [];
    s.openings.forEach(function (op, idx) {
      var T = SK.TRACKS[op.track], w = Math.round(T.wage[op.level] * op.wageMult);
      var r = G.meetsReq(op.track, op.level);
      var chance = Math.round(G.hireChance(op.track, op.level) * 100);
      L.push(A({
        key: 'apply:' + idx, group: 'ตำแหน่งที่เปิดรับสัปดาห์นี้', icon: T.icon, name: T.titles[op.level] + ' — ' + op.company,
        desc: 'ค่าแรง ' + money(w) + '/กะ • ต้องการ: ' + reqText(op.track, op.level) + (r.ok ? ' • โอกาสผ่าน ~' + chance + '%' : ''),
        slots: 1, energy: 5,
        check: function (s) {
          if (s.job) return 'มีงานประจำอยู่แล้ว (ลาออกก่อนจึงจะสมัครใหม่)';
          if (!r.ok) return 'ยังขาด: ' + r.miss.join(', ');
          return null;
        },
        run: function (s) {
          s.openings.splice(idx, 1);
          if (SK.chance(G.hireChance(op.track, op.level))) { G.hire(op); return '🎉 ผ่านการสัมภาษณ์! ได้ทำงานที่ ' + op.company; }
          G.mod('mood', -3);
          return 'ผลสัมภาษณ์ยังไม่ผ่านรอบนี้ ตำแหน่งนี้เต็มแล้ว ลองสมัครที่อื่นต่อ';
        }
      }));
    });
    var claimAmt = Math.round(C((s.lastWage || s.lastWeekly || 3000) * 0.5, 1200, 4500));
    L.push(A({
      key: 'claim', group: 'สิทธิประโยชน์', icon: '🛟', name: 'ขอรับเงินทดแทนกรณีว่างงาน', desc: 'ต้องจ่ายประกันสังคมครบ 13 สัปดาห์ • สัปดาห์ละครั้ง • ได้ ≈ ' + money(claimAmt),
      slots: 1,
      check: function (s) {
        if (s.job) return 'ยังมีงานประจำอยู่';
        if (s.unemp.claims <= 0) return s.ssWeeks < 13 ? 'ยังส่งประกันสังคมไม่ครบ 13 สัปดาห์' : 'ใช้สิทธิ์ครบแล้ว';
        if (s.day - s.unemp.last < 7) return 'เพิ่งรับสิทธิ์ไปในสัปดาห์นี้';
        return null;
      },
      run: function (s) { s.unemp.claims--; s.unemp.last = s.day; G.earn(claimAmt, 'เงินทดแทนว่างงาน'); return 'ได้รับเงินทดแทนว่างงาน ' + money(claimAmt) + ' (เหลือสิทธิ์ ' + s.unemp.claims + ' ครั้ง)'; }
    }));
    L.push(A({
      key: 'resume', group: 'พัฒนาตัวเอง', icon: '📄', name: 'เวิร์กช็อปเรซูเม่และเตรียมสัมภาษณ์', desc: 'โอกาสผ่านสัมภาษณ์ +10% นาน 14 วัน • ฟรี', slots: 1, energy: 6,
      run: function (s) { s.bonusUntil = s.day + 14; G.skill('service', 0.5); return 'ได้เทคนิคสัมภาษณ์ใหม่ๆ เพียบ มั่นใจขึ้นมาก'; }
    }));
    return npcActions('jobs').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ศูนย์ SME / กิจการ
  // ----------------------------------------------------------------------
  B.biz = function (s) {
    var L = [], b = s.business;
    if (!b) {
      Object.keys(SK.BIZ).forEach(function (k) {
        var T = SK.BIZ[k];
        L.push(A({
          key: 'open:' + k, group: 'เปิดกิจการ', icon: T.icon, name: 'เปิด' + T.name, desc: 'ทุน ' + money(T.capital) + ' • ใช้ทักษะ' + SK.SKILLS[T.skill].name + ' • ต้องดูแลสม่ำเสมอ',
          slots: 1, cost: T.capital, energy: 10,
          check: function (s) { return s.skills[T.skill] < 15 ? 'ควรมีทักษะ' + SK.SKILLS[T.skill].name + ' อย่างน้อย 15' : null; },
          run: function (s) {
            s.business = { type: k, level: 1, quality: 60, staff: 0, cashbox: 0, profit: 0, mkUntil: -1, last: s.day };
            s.stats.bizOpened = true; G.mod('mood', 12);
            G.news(s.name + ' เปิด' + T.name + ' 🎊', 'me');
            return 'เปิดกิจการ' + T.name + 'สำเร็จ! แวะมาดูแลและเก็บรายได้บ่อยๆ';
          }
        }));
      });
      L.push(A({
        key: 'info', group: 'คำปรึกษา', icon: '💡', name: 'ปรึกษาที่ปรึกษา SME', desc: 'ฟรี • ได้ความรู้การจัดการ', slots: 1, energy: 4,
        run: function (s) { G.skill('mgmt', 1); return 'ที่ปรึกษาเตือนว่า: กิจการดีต้องดูแลคุณภาพและสต็อกทุกสัปดาห์ และอย่าลืมสำรองเงินไว้ 1 เดือน'; }
      }));
      return L;
    }
    var T = SK.BIZ[b.type], upgCost = Math.round(T.capital * (b.level === 1 ? 0.6 : 1));
    L.push(A({
      key: 'manage', group: 'กิจการ: ' + T.name + ' (ระดับ ' + b.level + ')', icon: '🛠️', name: 'ดูแลกิจการ (คุณภาพ ' + Math.round(b.quality) + ')', desc: 'คุณภาพ +10 • ฝึกการจัดการ', slots: 1, energy: 16,
      run: function (s) { b.quality = C(b.quality + 10, 0, 100); b.last = s.day; G.skill('mgmt', 0.6); G.skill(T.skill, 0.4); return 'ปรับปรุงร้านและดูแลลูกค้า คุณภาพกิจการดีขึ้น'; }
    }));
    L.push(A({
      key: 'collect', group: 'กิจการ: ' + T.name + ' (ระดับ ' + b.level + ')', icon: '💰', name: 'เก็บรายได้จากกิจการ (สะสม ' + money(b.cashbox) + ')', desc: 'ถ้าติดลบ จะหักจากกระเป๋าตัวเอง', slots: 0,
      check: function () { return Math.abs(b.cashbox) < 1 ? 'ยังไม่มีเงินสะสม' : null; },
      run: function (s) {
        var v = Math.round(b.cashbox); b.cashbox = 0;
        if (v >= 0) { G.earn(v, 'กำไรกิจการ', true); return 'เก็บกำไรกิจการ ' + money(v); }
        G.pay(-v, 'ขาดทุนกิจการ'); return 'กิจการขาดทุน ต้องเติมเงิน ' + money(-v);
      }
    }));
    L.push(A({
      key: 'hire', group: 'ขยายกิจการ', icon: '🧑‍🤝‍🧑', name: 'จ้างพนักงาน (ปัจจุบัน ' + b.staff + '/3)', desc: 'ค่าจ้าง ฿250/วัน • รายได้ +35% • คุณภาพเสื่อมช้าลง', slots: 1, cost: 1500,
      check: function () { return b.staff >= 3 ? 'พนักงานเต็มแล้ว' : null; },
      run: function () { b.staff++; return 'จ้างพนักงานเพิ่ม 1 คน'; }
    }));
    L.push(A({
      key: 'fire', group: 'ขยายกิจการ', icon: '👋', name: 'ลดพนักงาน 1 คน', desc: 'ลดค่าใช้จ่ายรายวัน', slots: 0,
      check: function () { return b.staff <= 0 ? 'ไม่มีพนักงาน' : null; },
      run: function () { b.staff--; return 'ลดพนักงานลง 1 คน'; }
    }));
    L.push(A({
      key: 'upgrade', group: 'ขยายกิจการ', icon: '🏗️', name: 'ขยายกิจการเป็นระดับ ' + (b.level + 1), desc: 'รายได้ +25% ต่อระดับ ค่าใช้จ่ายคงที่ +30%', slots: 1, cost: upgCost,
      check: function () { return b.level >= 3 ? 'ระดับสูงสุดแล้ว' : null; },
      run: function () { b.level++; return 'ขยายกิจการสำเร็จ!'; }
    }));
    L.push(A({
      key: 'market', group: 'ขยายกิจการ', icon: '📣', name: 'ทำการตลาด 14 วัน', desc: 'รายได้ +20% นาน 14 วัน', slots: 1, cost: 1000,
      check: function (s) { return b.mkUntil > s.day ? 'กำลังทำการตลาดอยู่' : null; },
      run: function (s) { b.mkUntil = s.day + 14; return 'โปรโมตร้านผ่านโซเชียลและป้ายชุมชน'; }
    }));
    L.push(A({
      key: 'close', group: 'อื่นๆ', icon: '🔒', name: 'ปิดกิจการ', desc: 'ได้เงินคืน 50% ของทุน × ระดับ', slots: 0, confirm: 'ยืนยันปิดกิจการ?',
      run: function (s) {
        var refund = Math.round(T.capital * 0.5 * b.level + b.cashbox); s.business = null;
        if (refund > 0) G.earn(refund, 'ปิดกิจการ'); else G.pay(-refund, 'ขาดทุนกิจการ');
        return 'ปิดกิจการและได้เงินคืนสุทธิ ' + money(refund);
      }
    }));
    return L;
  };

  // ----------------------------------------------------------------------
  //  ธนาคาร
  // ----------------------------------------------------------------------
  B.bank = function (s) {
    var L = [], price = s.city.fundPrice, f = s.fundUnits;
    [1000, 5000, 20000].forEach(function (a) {
      L.push(A({
        key: 'dep:' + a, group: 'บัญชีออมทรัพย์ (ดอกเบี้ย 1.5%/ปี)', icon: '⬇️', name: 'ฝากเงิน ' + money(a), desc: 'เงินสดในมือ ' + money(s.cash), atm: true,
        check: function (s) { return s.cash < a ? 'เงินสดไม่พอ' : null; },
        run: function (s) { s.cash -= a; s.bank += a; return 'ฝากเงิน ' + money(a) + ' เรียบร้อย'; }
      }));
    });
    L.push(A({
      key: 'depall', group: 'บัญชีออมทรัพย์ (ดอกเบี้ย 1.5%/ปี)', icon: '⏬', name: 'ฝากเงินสดส่วนที่เกิน ฿1,500', desc: 'เก็บเงินสดไว้ใช้ ฿1,500', atm: true,
      check: function (s) { return s.cash <= 1500 ? 'เงินสดไม่เกิน ฿1,500' : null; },
      run: function (s) { var a = Math.floor(s.cash - 1500); s.cash -= a; s.bank += a; return 'ฝากเงิน ' + money(a); }
    }));
    [1000, 5000, 20000].forEach(function (a) {
      L.push(A({
        key: 'wd:' + a, group: 'บัญชีออมทรัพย์ (ดอกเบี้ย 1.5%/ปี)', icon: '⬆️', name: 'ถอนเงิน ' + money(a), desc: 'เงินฝาก ' + money(s.bank), atm: true,
        check: function (s) { return s.bank < a ? 'เงินฝากไม่พอ' : null; },
        run: function (s) { s.bank -= a; s.cash += a; return 'ถอนเงิน ' + money(a); }
      }));
    });
    [5000, 20000].forEach(function (a) {
      L.push(A({
        key: 'fbuy:' + a, group: 'กองทุนรวมดัชนีเมือง (ราคา ' + price.toFixed(1) + ' • มี ' + f.toFixed(1) + ' หน่วย)', icon: '📊', name: 'ซื้อกองทุน ' + money(a),
        desc: 'ผันผวนตามเศรษฐกิจเมือง • ระยะยาวมักได้ผลตอบแทนดีกว่าเงินฝาก', slots: 0,
        check: function (s) { return G.total() < a ? 'เงินไม่พอ' : null; },
        run: function (s) { G.take(a); s.fundUnits += a / price; s.fundCost += a; return 'ซื้อกองทุน ' + (a / price).toFixed(1) + ' หน่วย'; }
      }));
    });
    [0.5, 1].forEach(function (frac) {
      L.push(A({
        key: 'fsell:' + frac, group: 'กองทุนรวมดัชนีเมือง (ราคา ' + price.toFixed(1) + ' • มี ' + f.toFixed(1) + ' หน่วย)', icon: '💹', name: frac === 1 ? 'ขายกองทุนทั้งหมด (≈ ' + money(f * price) + ')' : 'ขายกองทุนครึ่งหนึ่ง (≈ ' + money(f * price / 2) + ')',
        desc: 'ต้นทุนเฉลี่ย ' + (f > 0 ? (s.fundCost / f).toFixed(1) : '-'), slots: 0,
        check: function (s) { return s.fundUnits <= 0.01 ? 'ยังไม่มีกองทุน' : null; },
        run: function (s) {
          var units = s.fundUnits * frac, proceeds = units * price, costPart = s.fundCost * frac;
          s.fundUnits -= units; s.fundCost -= costPart;
          var gain = proceeds - costPart; if (gain > 0) s.stats.fundGain += gain;
          s.cash += Math.round(proceeds);
          return 'ขายกองทุนได้ ' + money(proceeds) + (gain >= 0 ? ' (กำไร ' + money(gain) + ')' : ' (ขาดทุน ' + money(-gain) + ')');
        }
      }));
    });
    var limit = 60000 + (s.job ? 80000 : 0) + (s.business ? 40000 : 0);
    [[20000, 'personal', 12, 36, 'สินเชื่อส่วนบุคคล'], [50000, 'personal', 12, 36, 'สินเชื่อส่วนบุคคล']].forEach(function (c) {
      var rate = G.loanRate(c[2]), mp = G.monthlyPayment(c[0], rate, c[3]);
      L.push(A({
        key: 'loan:' + c[0], group: 'สินเชื่อ', icon: '🏧', name: 'กู้ ' + c[4] + ' ' + money(c[0]), desc: 'ดอกเบี้ย ' + rate + '%/ปี • ผ่อน ' + c[3] + ' เดือน ≈ ' + money(mp) + '/เดือน • วงเงินรวมสูงสุด ' + money(limit), slots: 1, energy: 4,
        check: function (s) {
          if (s.credit < 35) return 'คะแนนเครดิตต่ำเกินไป (ต้อง ≥ 35)';
          if (G.totalDebt() + c[0] > limit) return 'เกินวงเงินที่อนุมัติ';
          return null;
        },
        run: function (s) { s.cash += c[0]; G.addLoan(c[4], c[0], rate, c[3], 'personal'); return 'อนุมัติเงินกู้ ' + money(c[0]) + ' ผ่อนเดือนละ ' + money(mp); }
      }));
    });
    L.push(A({
      key: 'micro', group: 'สินเชื่อ', icon: '🌱', name: 'กู้สินเชื่อชุมชนดอกเบี้ยต่ำ ฿20,000', desc: 'ดอกเบี้ย 5%/ปี • ผ่อน 24 เดือน • สำหรับคนมีแต้มพลเมือง ≥ 10', slots: 1, energy: 4,
      check: function (s) {
        if (s.civic < 10) return 'ต้องมีแต้มพลเมืองอย่างน้อย 10';
        if (s.credit < 30) return 'เครดิตต่ำเกินไป';
        if (s.loans.some(function (l) { return l.type === 'micro'; })) return 'มีสินเชื่อชุมชนอยู่แล้ว';
        return null;
      },
      run: function (s) { s.cash += 20000; G.addLoan('สินเชื่อชุมชน', 20000, 5, 24, 'micro'); return 'ได้รับสินเชื่อชุมชน ฿20,000'; }
    }));
    s.loans.forEach(function (l) {
      L.push(A({
        key: 'pay5k:' + l.id, group: 'ชำระหนี้: ' + l.name + ' (คงเหลือ ' + money(l.principal) + ')', icon: '↩️', name: 'โปะหนี้ ' + l.name + ' ฿5,000', desc: 'ลดต้นเงินและดอกเบี้ยที่ต้องจ่าย', slots: 0,
        check: function (s) { return G.total() < 5000 ? 'เงินไม่พอ' : l.principal < 5000 ? 'ยอดคงเหลือน้อยกว่า ฿5,000 (ใช้ปิดหนี้)' : null; },
        run: function (s) { G.take(5000); l.principal -= 5000; s.credit = Math.min(100, s.credit + 1); return 'โปะหนี้เพิ่ม ฿5,000'; }
      }));
      L.push(A({
        key: 'payoff:' + l.id, group: 'ชำระหนี้: ' + l.name + ' (คงเหลือ ' + money(l.principal) + ')', icon: '✅', name: 'ปิดหนี้ ' + l.name + ' ทั้งก้อน (' + money(l.principal) + ')', desc: 'จบภาระหนี้ก้อนนี้', slots: 0,
        check: function (s) { return G.total() < Math.ceil(l.principal) ? 'เงินไม่พอ' : null; },
        run: function (s) {
          G.take(Math.ceil(l.principal)); s.loans = s.loans.filter(function (x) { return x !== l; }); s.credit = Math.min(100, s.credit + 4);
          return '🎊 ปิดหนี้ ' + l.name + ' เรียบร้อย';
        }
      }));
    });
    L.push(A({
      key: 'advice', group: 'คำปรึกษา', icon: '🧑‍💼', name: 'ปรึกษาที่ปรึกษาการเงินชุมชน', desc: 'ฟรี • ได้ความรู้ด้านการจัดการเงิน', slots: 1, energy: 3,
      run: function (s) {
        G.skill('mgmt', 0.9);
        var tips = ['ลองกันเงินออมอย่างน้อย 20% ของรายได้ทุกเดือน', 'หนี้ดอกเบี้ยสูงควรปิดก่อนไปลงทุน', 'เก็บเงินสำรองฉุกเฉิน 3 เดือนไว้ก่อนเสมอ', 'กองทุนผันผวนได้ ลงทุนเฉพาะเงินที่ไม่ต้องใช้ใน 1 ปี'];
        return 'คำแนะนำ: ' + SK.pick(tips);
      }
    }));
    return npcActions('bank').concat(L);
  };

  // ----------------------------------------------------------------------
  //  โรงพยาบาล
  // ----------------------------------------------------------------------
  B.hospital = function (s) {
    var L = [], free = s.perks.doctorFriend;
    var needCheck = (s.day - (s.flags.lastCheckup == null ? -999 : s.flags.lastCheckup)) >= 180;
    L.push(A({
      key: 'checkup', group: 'บริการสุขภาพ', icon: '🩺', name: 'ตรวจสุขภาพประจำปี', desc: 'สุขภาพ +4 • ภูมิคุ้มกัน 60 วัน • ' + (free || needCheck ? 'ฟรี (สิทธิ์บัตรสุขภาพ)' : '฿150'),
      slots: 1, cost: free || needCheck ? 0 : 150, energy: 3,
      run: function (s) { s.flags.lastCheckup = s.day; G.mod('health', free ? 6 : 4); s.immuneUntil = Math.max(s.immuneUntil, s.day + 60); return 'ผลตรวจโดยรวมดี หมอแนะนำให้ออกกำลังกายและนอนให้พอ'; }
    }));
    L.push(A({
      key: 'clinic', group: 'บริการสุขภาพ', icon: '💊', name: 'พบแพทย์รักษาอาการป่วย', desc: 'หายเร็วขึ้น • ' + (free ? 'ฟรี' : '฿30'), slots: 1, cost: free ? 0 : 30,
      check: function (s) { return s.sick ? null : 'ไม่ได้ป่วย'; },
      run: function (s) { s.sick.days = Math.min(s.sick.days, 1); G.mod('mood', 2); return 'หมอตรวจและจ่ายยา พรุ่งนี้น่าจะดีขึ้น'; }
    }));
    L.push(A({
      key: 'vaccine', group: 'บริการสุขภาพ', icon: '💉', name: 'ฉีดวัคซีนป้องกันโรคตามฤดูกาล', desc: 'ลดโอกาสป่วย 120 วัน • ฟรีตามสิทธิ์', slots: 1, energy: 2,
      check: function (s) { return s.immuneUntil - s.day > 90 ? 'ยังมีภูมิคุ้มกันอยู่' : null; },
      run: function (s) { s.immuneUntil = s.day + 120; return 'ฉีดวัคซีนเรียบร้อย'; }
    }));
    L.push(A({
      key: 'mental', group: 'บริการสุขภาพ', icon: '🧠', name: 'ปรึกษานักจิตวิทยาชุมชน', desc: 'อารมณ์ดีขึ้นมาก • ฟรี', slots: 1,
      check: function (s) { return s.flags.mentalDay != null && s.day - s.flags.mentalDay < 3 ? 'เพิ่งปรึกษาไปเมื่อเร็วๆ นี้' : null; },
      run: function (s) { s.flags.mentalDay = s.day; G.mod('mood', 18); return 'ได้ระบายและได้เครื่องมือจัดการความเครียด ใจโล่งขึ้นมาก'; }
    }));
    L.push(A({
      key: 'blood', group: 'ทำดีให้เมือง', icon: '🩸', name: 'บริจาคเลือด', desc: 'ได้แต้มพลเมือง • ทำได้ทุก 56 วัน', slots: 1, energy: 10,
      check: function (s) { return s.flags.bloodDay != null && s.day - s.flags.bloodDay < 56 ? 'บริจาคได้ทุก 56 วัน' : s.health < 60 ? 'สุขภาพยังไม่พร้อม' : null; },
      run: function (s) { s.flags.bloodDay = s.day; s.civic += 5; s.stats.volunteer++; G.mod('mood', 6); G.nudge('health', 0.2, 'volunteer'); G.addRel('doctor', 2); return 'บริจาคเลือดช่วยชีวิตได้ถึง 3 คน 🩸 (+5 แต้มพลเมือง)'; }
    }));
    L.push(H.volunteer('health', 'อาสาช่วยดูแลผู้ป่วยและผู้สูงอายุ', { icon: '🫶', skill: 'care', npc: 'doctor' }));
    return npcActions('hospital').concat(L);
  };

  // ----------------------------------------------------------------------
  //  วิทยาลัยชุมชน
  // ----------------------------------------------------------------------
  function courseDone(s, c) {
    if (c.cert && s.certs.indexOf(c.cert) >= 0) return true;
    if (c.edu && s.edu >= c.edu) return true;
    return !c.cert && !c.edu && (s.courses[c.id] || 0) >= c.sessions;
  }
  H.courseDone = courseDone;
  H.courseReqMiss = function (s, c) {
    var miss = [];
    if (c.req) {
      if (c.req.edu != null && s.edu < c.req.edu) miss.push('วุฒิ ' + SK.EDU[c.req.edu]);
      if (c.req.cert && s.certs.indexOf(c.req.cert) < 0) miss.push(SK.CERTS[c.req.cert]);
      if (c.req.skills) for (var k in c.req.skills) if (s.skills[k] < c.req.skills[k]) miss.push(SK.SKILLS[k].name + ' ' + c.req.skills[k]);
    }
    return miss;
  };
  B.school = function (s) {
    var L = [];
    SK.COURSES.forEach(function (c) {
      var prog = s.courses[c.id] || 0, done = courseDone(s, c), fee = s.voucher > 0 ? 0 : G.tuition(c.fee);
      var miss = H.courseReqMiss(s, c);
      L.push(A({
        key: 'course:' + c.id, group: 'หลักสูตร', icon: c.icon, name: c.name + (done ? ' ✔ จบแล้ว' : ''),
        desc: c.desc + ' • ความคืบหน้า ' + Math.min(prog, c.sessions) + '/' + c.sessions + ' ครั้ง • ค่าเรียน ' + (fee > 0 ? money(fee) + '/ครั้ง' : 'ฟรี'),
        slots: 1, cost: done ? 0 : fee, energy: 10,
        check: function (s) { if (done) return 'เรียนจบหลักสูตรนี้แล้ว'; if (miss.length) return 'ยังขาด: ' + miss.join(', '); return null; },
        run: function (s) {
          if (s.voucher > 0) { s.voucher--; }
          s.courses[c.id] = (s.courses[c.id] || 0) + 1;
          var extra = '';
          if (s.perks.studyBuddy && SK.chance(0.25) && s.courses[c.id] < c.sessions) { s.courses[c.id]++; extra = ' (' + SK.nn('student') + 'ช่วยติว ได้ความก้าวหน้าเพิ่ม!)'; }
          G.mod('mood', 1);
          if (s.courses[c.id] >= c.sessions) {
            var res = [];
            if (c.skill) for (var k in c.skill) { G.skill(k, c.skill[k]); res.push(SK.SKILLS[k].name + ' +' + c.skill[k]); }
            if (c.cert) { if (s.certs.indexOf(c.cert) < 0) s.certs.push(c.cert); res.push('ได้ใบรับรอง' + SK.CERTS[c.cert]); }
            if (c.edu && s.edu < c.edu) { s.edu = c.edu; res.push('วุฒิ ' + SK.EDU[c.edu]); }
            G.news(s.name + ' เรียนจบหลักสูตร "' + c.name + '"', 'me'); s.civic += 2;
            return '🎓 เรียนจบ "' + c.name + '"! ' + res.join(' • ');
          }
          return 'เข้าเรียน "' + c.name + '" ครั้งที่ ' + s.courses[c.id] + '/' + c.sessions + extra;
        }
      }));
    });
    L.push(H.volunteer('education', 'ช่วยติวหนังสือเด็กๆ นอกเวลา', { icon: '📚', skill: 'care', npc: 'student' }));
    return npcActions('school').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ห้องสมุด
  // ----------------------------------------------------------------------
  B.library = function (s) {
    var L = H.selfStudy('library');
    L.push(A({
      key: 'tutor', group: 'งานเสริม', icon: '🧑‍🏫', name: 'ติวหนังสือให้นักเรียน (รับค่าตอบแทน)', desc: 'ต้องมีวุฒิปริญญาตรี • ≈ ฿380', slots: 1, energy: 12,
      check: function (s) { return s.edu < 3 ? 'ต้องมีวุฒิปริญญาตรี' : null; },
      run: function (s) { var p = Math.round(SK.range(320, 440) * (0.8 + s.city.m.education / 250)); G.earn(p, 'งานเสริม', true); G.skill('care', 0.6); G.nudge('education', 0.1, 'work'); return 'ติวนักเรียนจนเข้าใจ ได้ค่าตอบแทน ' + money(p); }
    }));
    L.push(H.volunteer('education', 'ช่วยจัดหนังสือและเปิดกิจกรรมอ่านให้เด็ก', { icon: '📖', npc: 'librarian' }));
    return npcActions('library').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ที่ว่าการเมือง
  // ----------------------------------------------------------------------
  B.townhall = function (s) {
    var L = [], b = s.ballot, c = s.city;
    var lead = null;
    if (s.perks.insider && b) {
      var sc = G.ballotScores(), bv = -1e9;
      for (var id in sc) if (sc[id] > bv) { bv = sc[id]; lead = id; }
    }
    if (b) {
      b.opts.concat(b.kind === 'election' ? [] : ['save']).forEach(function (id) {
        var p = id === 'save' ? null : SK.POLICY[id];
        L.push(A({
          key: 'vote:' + id, group: (b.kind === 'election' ? '🗳️ เลือกตั้งสภาเมืองประจำปี (เลือกได้ 1 กลุ่ม — ประกาศผลต้นเดือนหน้า)' : 'ประชามติประจำเดือน' + b.label + ' (เลือกได้ 1 ข้อ — ผลจะประกาศต้นเดือนหน้า)'),
          icon: p ? p.icon : '🏦', name: p ? p.name + ' • งบ ' + p.cost + ' ล้านบาท' : 'ไม่เริ่มโครงการใหม่ เก็บงบไว้ก่อน',
          desc: (p ? p.text + ' • ผล: ' + p.eff.map(function (e) { return SK.METRICS[e[0]].name + (e[1] > 0 ? ' +' : ' ') + e[1]; }).join(', ') : 'ประหยัดงบ เหมาะเมื่อเมืองขาดดุล') + (s.perks.insider && lead === id ? ' • 📰 แพรวาบอกว่าตอนนี้นำอยู่' : '') + (b.mine === id ? ' • ✔ คุณโหวตข้อนี้' : ''),
          slots: 1, energy: 3,
          check: function (s) { return b.mine ? (b.mine === id ? 'คุณโหวตข้อนี้ไปแล้ว' : 'เดือนนี้คุณโหวตไปแล้ว') : null; },
          run: function (s) { G.vote(id); return 'ลงคะแนนเรียบร้อย ขอบคุณที่ใช้สิทธิ์ของพลเมือง 🗳️ (+3 แต้มพลเมือง)'; }
        }));
      });
    }
    L.push(A({
      key: 'hearing', group: 'ร่วมพัฒนาเมือง', icon: '🎙️', name: 'ร่วมประชุมประชาคมรับฟังความเห็น', desc: 'ได้แต้มพลเมือง ความไว้วางใจต่อเมืองสูงขึ้นเล็กน้อย', slots: 1, energy: 5,
      check: function (s) { return s.flags.hearDay != null && s.day - s.flags.hearDay < 3 ? 'เพิ่งเข้าร่วมไป' : null; },
      run: function (s) { s.flags.hearDay = s.day; s.civic += 2; G.nudge('trust', 0.2, 'volunteer'); G.mod('mood', 2); G.addRel('mayor', 1); return 'ร่วมแสดงความเห็นในประชาคม เสียงของคุณถูกบันทึกไว้'; }
    }));
    var low = SK.MKEYS.slice().sort(function (a, b2) { return c.m[a] - c.m[b2]; }).slice(0, 3);
    low.forEach(function (m) {
      L.push(A({
        key: 'petition:' + m, group: 'ยื่นข้อเสนอต่อเมือง (สัปดาห์ละครั้ง)', icon: SK.METRICS[m].icon, name: 'เสนอให้ปรับปรุง "' + SK.METRICS[m].name + '" (ตอนนี้ ' + Math.round(c.m[m]) + ')',
        desc: 'ถ้าเรื่องถูกรับไว้ ตัวชี้วัดนี้จะค่อยๆ ดีขึ้น +3 ภายใน 20 วัน', slots: 1, energy: 5,
        check: function (s) { return s.flags.petDay2 != null && s.day - s.flags.petDay2 < 7 ? 'ยื่นได้สัปดาห์ละครั้ง' : null; },
        run: function (s) {
          s.flags.petDay2 = s.day; s.civic += 3;
          var p = 0.45 + c.m.trust / 250 + (s.perks.mayorEar ? 0.25 : 0);
          if (SK.chance(p)) { c.pending.push({ m: m, per: 3 / 20, d: 20 }); G.addRel('mayor', 2); return '✅ เทศบาลรับข้อเสนอเรื่อง' + SK.METRICS[m].name + 'ไว้ดำเนินการ'; }
          G.mod('mood', -2); return 'เรื่องถูกรับไว้เพื่อพิจารณา แต่ยังไม่มีการดำเนินการในตอนนี้';
        }
      }));
    });
    [1000, 5000].forEach(function (a) {
      var m = low[0];
      L.push(A({
        key: 'donate:' + a, group: 'บริจาคให้เมือง', icon: '🎁', name: 'บริจาค ' + money(a) + ' เข้ากองทุนเมือง', desc: 'ช่วยพัฒนา ' + SK.METRICS[m].icon + ' ' + SK.METRICS[m].name + ' (ตัวชี้วัดที่อ่อนที่สุด) • +' + Math.round(a / 200) + ' แต้มพลเมือง',
        slots: 0, cost: a, cat: 'บริจาค',
        run: function (s) { G.nudge(m, 0.25 * a / 1000, 'donated'); c.treasury += a / 100000; s.civic += Math.round(a / 200); s.stats.donated += a; G.mod('mood', 5); return 'ขอบคุณสำหรับน้ำใจ เงินบริจาคถูกใช้พัฒนา' + SK.METRICS[m].name; }
      }));
    });
    L.push(A({
      key: 'dash', group: 'ข้อมูลเมือง', icon: '📊', name: 'ดูแดชบอร์ดข้อมูลเมืองแบบเปิดเผย', desc: 'งบประมาณ ตัวชี้วัด โครงการที่กำลังทำ', ui: 'city'
    }));
    L.push(H.volunteer('trust', 'ช่วยงานเอกสารและต้อนรับประชาชน', { icon: '🗂️', skill: 'mgmt', npc: 'mayor' }));
    return npcActions('townhall').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ศูนย์พัฒนาสังคม
  // ----------------------------------------------------------------------
  B.social = function (s) {
    var L = [];
    L.push(A({
      key: 'foodbank', group: 'ช่วยเหลือเร่งด่วน', icon: '🍚', name: 'รับอาหารจากธนาคารอาหาร', desc: 'อาหาร 2 กล่อง • สำหรับผู้มีเงินน้อยหรือหิว • เปิด 24 ชม.', slots: 0, atm: true,
      check: function (s) { return s.flags.fbDay === s.day ? 'วันนี้รับไปแล้ว' : (G.total() >= 500 && s.sat > 40) ? 'ใช้สิทธิ์สำหรับผู้เดือดร้อนเท่านั้น' : null; },
      run: function (s) { s.flags.fbDay = s.day; s.meals = Math.min(G.fridgeCap(), s.meals + 2); return 'ได้รับอาหาร 2 กล่อง ขอบคุณน้ำใจจากชุมชน'; }
    }));
    L.push(A({
      key: 'emerg', group: 'ช่วยเหลือเร่งด่วน', icon: '🆘', name: 'ขอเงินช่วยเหลือฉุกเฉิน ฿3,000 (ไม่มีดอกเบี้ย)', desc: 'สำหรับผู้มีเงินไม่ถึง ฿600 • ผ่อน 6 เดือน • ขอได้ 30 วันครั้ง', slots: 1,
      check: function (s) { return G.total() >= 600 ? 'ใช้สิทธิ์เมื่อเงินเหลือน้อยกว่า ฿600' : (s.flags.emergDay != null && s.day - s.flags.emergDay < 30) ? 'ขอได้ทุก 30 วัน' : null; },
      run: function (s) { s.flags.emergDay = s.day; s.cash += 3000; G.addLoan('เงินช่วยเหลือฉุกเฉิน', 3000, 0, 6, 'emerg'); return 'ได้รับเงินช่วยเหลือ ฿3,000 ผ่อนชำระ 6 เดือนแบบไม่มีดอกเบี้ย'; }
    }));
    L.push(A({
      key: 'welfare', group: 'สวัสดิการ', icon: '💳', name: 'รับเงินสวัสดิการผู้มีรายได้น้อย ฿500', desc: 'สำหรับรายได้ต่ำกว่า ฿14,000/เดือน • เดือนละครั้ง', slots: 1,
      check: function (s) {
        if (s.lastWeekly * 4.33 > 14000 && s.job) return 'รายได้เกินเกณฑ์';
        if (s.flags.welfDay != null && s.day - s.flags.welfDay < 30) return 'รับได้เดือนละครั้ง';
        return null;
      },
      run: function (s) { s.flags.welfDay = s.day; G.earn(500, 'สวัสดิการ'); return 'ได้รับเงินสวัสดิการ ฿500'; }
    }));
    L.push(A({
      key: 'shelter', group: 'ที่พัก', icon: '⛺', name: 'ขอเข้าพักที่พักพิงชั่วคราว', desc: 'ฟรี แต่เรียบง่าย • สำหรับผู้เดือดร้อนจริงๆ', slots: 1, confirm: 'ที่พักพิงมีความสบายต่ำ ยืนยันขอเข้าพัก?',
      check: function (s) { return s.home.type === 'shelter' ? 'อาศัยอยู่แล้ว' : (G.total() > 3000 ? 'ใช้สิทธิ์เมื่อเงินไม่ถึง ฿3,000' : null); },
      run: function (s) { s.home = { type: 'shelter', rentMult: 1, since: s.day, subsidy: false }; s.arrears.rent = 0; s.arrears.rentMonths = 0; return 'ย้ายเข้าที่พักพิงชั่วคราวแล้ว ตั้งหลักให้ได้นะ สู้ๆ'; }
    }));
    L.push(A({
      key: 'counsel', group: 'คำปรึกษา', icon: '💬', name: 'ปรึกษานักสังคมสงเคราะห์เรื่องงานและชีวิต', desc: 'ฟรี • อารมณ์ดีขึ้น มีแนวทางข้างหน้า', slots: 1,
      run: function (s) { G.mod('mood', 10); G.skill('mgmt', 0.5); return 'นักสังคมสงเคราะห์ช่วยวางแผนชีวิตทีละขั้น ไม่ต้องเร่งรีบ'; }
    }));
    L.push(H.volunteer('culture', 'ช่วยทำอาหารที่ครัวชุมชน', { icon: '🍲', sat: 25, tag: '_kitchen' }));
    return npcActions('social').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ตำรวจ-ดับเพลิง
  // ----------------------------------------------------------------------
  B.police = function (s) {
    var L = [];
    L.push(A({
      key: 'advice', group: 'ความปลอดภัย', icon: '🔐', name: 'ขอคำแนะนำความปลอดภัยและเข้าอบรมป้องกันภัย', desc: 'ลดโอกาสถูกขโมยและหลอกลวง 30 วัน', slots: 1,
      run: function (s) { s.flags.safeUntil = s.day + 30; G.skill('mgmt', 0.4); G.mod('mood', 2); return 'ได้รับคำแนะนำเรื่องล็อกบ้านและมิจฉาชีพ ปลอดภัยขึ้นเยอะ'; }
    }));
    L.push(H.volunteer('safety', 'เป็นอาสาสมัครเฝ้าระวังเหตุในชุมชน', { icon: '🦺', npc: 'police' }));
    return npcActions('police').concat(L);
  };

  // ----------------------------------------------------------------------
  //  สวนสาธารณะ
  // ----------------------------------------------------------------------
  B.park = function (s) {
    var L = [], envBonus = (s.city.m.environment - 60) / 100;
    L.push(A({
      key: 'walk', group: 'ออกกำลังและผ่อนคลาย', icon: '🚶', name: 'เดินเล่นริมน้ำ', desc: 'อารมณ์ดีขึ้น เบาๆ ฟิตขึ้นนิดหน่อย', slots: 1, energy: 6,
      run: function (s) { G.mod('mood', 9 + envBonus * 4); G.mod('fitness', 0.8); G.mod('health', 0.5); if (SK.chance(0.3)) G.addRel('student', 1); return 'เดินเล่นรับลมริมน้ำ ใจโล่งขึ้นมาก'; }
    }));
    L.push(A({
      key: 'jog', group: 'ออกกำลังและผ่อนคลาย', icon: '🏃', name: 'วิ่งจ็อกกิ้ง', desc: 'ฟิตขึ้นชัดเจน', slots: 1, energy: 18,
      run: function (s) { G.mod('fitness', 1.6 * (s.perks.trainer ? 1.3 : 1)); G.mod('mood', 5); G.mod('health', 0.8); return 'วิ่งได้สบายๆ ร่างกายสดชื่น'; }
    }));
    L.push(A({
      key: 'yoga', group: 'ออกกำลังและผ่อนคลาย', icon: '🧘‍♀️', name: 'โยคะกลางสวน (คลาสฟรี)', desc: 'อารมณ์ดีขึ้นมาก ผ่อนคลาย', slots: 1, energy: 4,
      run: function (s) { G.mod('mood', 11); G.mod('fitness', 0.5); G.mod('health', 1); return 'ยืดเส้นยืดสายและหายใจลึกๆ ท่ามกลางสายลม'; }
    }));
    L.push(H.volunteer('environment', 'ปลูกต้นไม้และเก็บขยะริมน้ำ', { icon: '🌱', npc: 'student' }));
    return npcActions('park').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ฟิตเนส
  // ----------------------------------------------------------------------
  B.gym = function (s) {
    var L = [], pass = s.day <= s.gymUntil, mult = s.perks.trainer ? 1.3 : 1;
    L.push(A({
      key: 'workout', group: 'ออกกำลังกาย', icon: '🏋️', name: 'เล่นเวท / คาร์ดิโอ', desc: 'ฟิตขึ้นมาก • ' + (pass ? 'ฟรี (สมาชิกรายเดือน)' : '฿80'), slots: 1, cost: pass ? 0 : 80, energy: 20,
      run: function (s) { G.mod('fitness', 2.2 * mult); G.mod('mood', 4); G.mod('health', 0.8); return 'เหงื่อท่วมแต่รู้สึกดีมาก'; }
    }));
    L.push(A({
      key: 'class', group: 'ออกกำลังกาย', icon: '🤸', name: 'คลาสกลุ่ม (แอโรบิก/มวยไทย)', desc: 'ฟิต+สนุก+ได้เพื่อน • ' + (pass ? 'ฟรี' : '฿60'), slots: 1, cost: pass ? 0 : 60, energy: 17,
      run: function (s) { G.mod('fitness', 1.7 * mult); G.mod('mood', 8); G.addRel('coach', 1.5); return 'ออกกำลังกายกลุ่มสนุกมาก'; }
    }));
    L.push(A({
      key: 'pass', group: 'สมาชิก', icon: '🎫', name: 'สมาชิกรายเดือน ฿600 (30 วัน)', desc: 'ใช้ฟิตเนสฟรีไม่จำกัด', slots: 0, cost: 600,
      check: function (s) { return s.day + 30 <= s.gymUntil ? 'สมาชิกยังไม่หมด' : null; },
      run: function (s) { s.gymUntil = Math.max(s.gymUntil, s.day) + 30; return 'ต่ออายุสมาชิกฟิตเนส 30 วัน'; }
    }));
    return npcActions('gym').concat(L);
  };

  // ----------------------------------------------------------------------
  //  วัด
  // ----------------------------------------------------------------------
  B.temple = function (s) {
    var L = [];
    L.push(A({
      key: 'meditate', group: 'สงบใจ', icon: '🧘', name: 'นั่งสมาธิ', desc: 'อารมณ์ดีขึ้นมาก ได้พลังงานเล็กน้อย', slots: 1, energy: -6,
      run: function (s) { G.mod('mood', s.perks.calm ? 18 : 13); G.addRel('monk', 1.5); return 'ใจสงบนิ่ง ความกังวลค่อยๆ จางลง'; }
    }));
    L.push(A({
      key: 'merit', group: 'สงบใจ', icon: '🪷', name: 'ทำบุญ / ตักบาตร', desc: 'อิ่มใจ ได้แต้มพลเมือง', slots: 0, cost: 100, cat: 'ทำบุญและบริจาค',
      check: function (s) { return s.flags.meritDay === s.day ? 'วันนี้ทำบุญไปแล้ว' : null; },
      run: function (s) { s.flags.meritDay = s.day; G.mod('mood', 5); s.civic += 1; G.addRel('monk', 1); return 'ทำบุญแล้วสบายใจ'; }
    }));
    L.push(H.volunteer('culture', 'ช่วยครัวชุมชนของวัด', { icon: '🍲', sat: 25, npc: 'monk', tag: '_temple' }));
    return npcActions('temple').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ศูนย์วัฒนธรรม
  // ----------------------------------------------------------------------
  B.culture = function (s) {
    var L = [];
    L.push(A({
      key: 'event', group: 'กิจกรรม', icon: '🎶', name: 'ร่วมกิจกรรมชุมชน / ดนตรีสด', desc: 'อารมณ์ดีมาก ได้พบผู้คน', slots: 1, cost: 40, energy: 5,
      run: function (s) { G.mod('mood', 15); G.nudge('culture', 0.1, 'volunteer'); SK.NPC_KEYS.forEach(function () {}); return 'ฟังดนตรีสดและพูดคุยกับเพื่อนบ้านจนค่ำ'; }
    }));
    L.push(A({
      key: 'workshop', group: 'กิจกรรม', icon: '🎨', name: 'เวิร์กช็อปงานฝีมือ', desc: 'ฝึกทักษะงานช่าง +1.2 • อารมณ์ดี', slots: 1, cost: 150, energy: 8,
      run: function (s) { G.skill('craft', 1.2); G.mod('mood', 8); return 'ลงมือทำงานฝีมือชิ้นเล็กๆ ภูมิใจมาก'; }
    }));
    L.push(H.volunteer('culture', 'ช่วยจัดงานเทศกาลของชุมชน', { icon: '🎪', npc: 'reporter' }));
    return npcActions('culture').concat(L);
  };

  // ----------------------------------------------------------------------
  //  สถานีขนส่ง
  // ----------------------------------------------------------------------
  B.station = function (s) {
    var L = [];
    var modes = [
      ['walk', '🚶', 'เดินเท้า', 'ฟรี เหนื่อยเล็กน้อย'],
      ['bike', '🚲', 'จักรยาน', 'ฟรี ได้ออกกำลัง (ต้องมีจักรยาน)'],
      ['bus', '🚌', 'รถเมล์/รถไฟฟ้า', 'เที่ยวละ ฿14 หรือใช้บัตรรายเดือน'],
      ['car', '🚗', 'รถยนต์ส่วนตัว', 'สะดวกสุด ค่าน้ำมันเที่ยวละ ฿38 (ต้องมีรถ)']
    ];
    modes.forEach(function (m) {
      L.push(A({
        key: 'mode:' + m[0], group: 'วิธีเดินทางประจำของคุณ (ตอนนี้: ' + m[2] + ')', icon: m[1], name: 'เลือก' + m[2], desc: m[3], slots: 0,
        check: function (s) {
          if (s.mode === m[0]) return 'ใช้อยู่แล้ว';
          if (m[0] === 'bike' && !s.inv.bike) return 'ยังไม่มีจักรยาน (ซื้อที่ห้าง)';
          if (m[0] === 'car' && !s.inv.car) return 'ยังไม่มีรถ (ซื้อที่ห้าง)';
          return null;
        },
        run: function (s) { s.mode = m[0]; return 'เปลี่ยนวิธีเดินทางเป็น' + m[2]; }
      }));
    });
    L.push(A({
      key: 'pass', group: 'บัตรโดยสาร', icon: '🎟️', name: 'บัตรโดยสารรายเดือน ฿600 (30 วัน)', desc: 'ขึ้นรถเมล์/รถไฟฟ้าไม่จำกัด' + (s.passUntil >= s.day ? ' • เหลือ ' + (s.passUntil - s.day) + ' วัน' : ''), slots: 0, cost: 600,
      check: function (s) { return s.passUntil - s.day > 14 ? 'บัตรยังเหลือมากกว่า 14 วัน' : null; },
      run: function (s) { s.passUntil = Math.max(s.passUntil, s.day) + 30; return 'ซื้อบัตรโดยสารรายเดือนแล้ว'; }
    }));
    L.push(A({
      key: 'rider', group: 'งานเสริม', icon: '🛵', name: 'รับงานไรเดอร์ส่งของ', desc: 'ต้องใช้จักรยานหรือรถยนต์ • ≈ ฿' + Math.round(230 * (0.8 + s.city.m.economy / 250) * (s.perks.riderTips ? 1.15 : 1)), slots: 1, energy: 20,
      check: function (s) { return (s.mode === 'bike' && s.inv.bike) || (s.mode === 'car' && s.inv.car) ? null : 'ต้องตั้งวิธีเดินทางเป็นจักรยานหรือรถยนต์'; },
      run: function (s) {
        var pay = Math.round(SK.range(170, 290) * (0.8 + s.city.m.economy / 250) * (s.perks.riderTips ? 1.15 : 1));
        if (s.mode === 'car') { pay -= 55; }
        G.earn(pay, 'งานไรเดอร์', true); G.mod('fitness', s.mode === 'bike' ? 0.8 : 0.1); G.addRel('rider', 1);
        return 'ส่งของจนครบรอบ ได้ค่าตอบแทน ' + money(pay);
      }
    }));
    L.push(H.volunteer('transport', 'ช่วยแนะนำการเดินทางและดูแลผู้โดยสารสูงอายุ', { icon: '🧑‍🦯' }));
    return npcActions('station').concat(L);
  };

  // ----------------------------------------------------------------------
  //  ค่าเดินทาง + ตัวรันกิจกรรม
  // ----------------------------------------------------------------------
  G.effMode = function () {
    var s = S(), m = s.mode;
    if (m === 'bike' && !s.inv.bike) m = 'walk';
    if (m === 'car' && !s.inv.car) m = 'walk';
    return m;
  };
  G.travelCost = function () {
    var s = S(), m = G.effMode(), f = 1.5 - s.city.m.transport / 100, pass = s.passUntil >= s.day;
    if (m === 'walk') return { money: 0, energy: 4 * f };
    if (m === 'bike') return { money: 0, energy: 3 * f };
    if (m === 'bus') return { money: pass ? 0 : 14, energy: 1.5 * f };
    return { money: 38, energy: 0.6 };
  };

  SK.getActions = function (locId, s) {
    s = s || S();
    var fn = B[locId];
    return fn ? fn(s) : [];
  };
  SK.findAction = function (locId, key) {
    var acts = SK.getActions(locId);
    for (var i = 0; i < acts.length; i++) if (acts[i].key === key) return acts[i];
    return null;
  };

  G.closedReason = function (locId) {
    var s = S(), loc = SK.LOC[locId], info = SK.dayInfo(s.day);
    if (!loc || !loc.gov) return null;
    if (info.off) return 'ปิดทำการวันหยุด';
    if (s.slot >= 2) return 'ปิดทำการช่วงเย็น';
    return null;
  };

  G.whyNot = function (locId, a) {
    var s = S();
    if (s.pendingEvent) return 'มีเหตุการณ์ที่ต้องตัดสินใจก่อน';
    if (a.ui) return null;
    if (a.slots > G.remaining()) return 'เวลาในวันนี้ไม่พอ';
    if (a.energy > 0 && s.energy < a.energy) return 'พลังงานไม่พอ (ต้องการ ' + Math.round(a.energy) + ')';
    if (SK.LOC[locId].gov && !a.atm) {
      var cr = G.closedReason(locId);
      if (cr) return cr;
    }
    if (a.check) { var r = a.check(s); if (r) return r; }
    if (a.cost > 0) {
      var need = a.cost;
      if (a.slots > 0 && locId !== 'home' && s.at !== locId) need += G.travelCost().money;
      if (!G.canPay(need)) return 'เงินไม่พอ (ต้องการ ' + SK.money(need) + ')';
    }
    return null;
  };

  G.perform = function (locId, key) {
    var s = S(), a = SK.findAction(locId, key);
    G.msgs = [];
    if (!a) return { ok: false, msg: 'ไม่พบกิจกรรมนี้' };
    var why = G.whyNot(locId, a);
    if (why) return { ok: false, msg: why };
    if (a.ui) return { ok: true, msg: '', ui: a.ui };
    var prefix = '';
    if (a.slots > 0 && locId !== 'home' && s.at !== locId) {
      var tc = G.travelCost();
      if (tc.money > 0) G.pay(tc.money, 'ค่าเดินทาง');
      G.mod('energy', -tc.energy);
      if (G.effMode() === 'bike') G.mod('fitness', 0.15);
      if (G.effMode() === 'bus' && s.city.m.transport < 45 && SK.chance(0.35)) { G.mod('energy', -3); prefix = '(รถติดสะสม เสียพลังงานเพิ่ม) '; }
      s.at = locId;
    } else if (a.slots > 0 && locId === 'home') { s.at = 'home'; }
    if (a.cost > 0) G.pay(a.cost, a.cat || SK.catOf(locId));
    if (a.energy) G.mod('energy', -a.energy);
    var r = a.run(s);
    var msg = prefix + (typeof r === 'string' ? r : (r && r.m) || '');
    if (msg) G.log(msg, (r && r.tone) || 'n');
    if (a.slots > 0) G.advance(a.slots);
    return { ok: true, msg: msg };
  };

  SK.catOf = function (locId) {
    var m = { market: 'อาหารและของใช้', cafe: 'อาหารและของใช้', mall: 'ซื้อของใช้', school: 'ค่าเรียน', gym: 'ฟิตเนสและสุขภาพ', hospital: 'ค่ารักษาพยาบาล', housing: 'ค่าที่พัก', station: 'ค่าเดินทาง', culture: 'บันเทิงและกิจกรรม', biz: 'ลงทุนกิจการ' };
    return m[locId] || 'ใช้จ่ายทั่วไป';
  };
  SK.locName = function (id, s) {
    s = s || S();
    if (id === 'work') return s.job ? SK.TRACKS[s.job.track].titles[s.job.level] : 'ที่ทำงาน';
    if (id === 'biz' && s.business) return SK.BIZ[s.business.type].name + 'ของฉัน';
    return SK.LOC[id].name;
  };
  SK.locIcon = function (id, s) {
    s = s || S();
    if (id === 'work' && s.job) return SK.TRACKS[s.job.track].icon;
    if (id === 'biz' && s.business) return SK.BIZ[s.business.type].icon;
    return SK.LOC[id].icon;
  };
})();
