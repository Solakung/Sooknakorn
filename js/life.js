/* สุขนคร — life.js : ชีวิตจริงเพิ่มเติม
   ครอบครัว (พ่อแม่ คนรัก แต่งงาน ลูก) • หัวหน้าและเพื่อนร่วมงาน • สภาพอากาศรายวัน
   ประกันสุขภาพ • กองทุนสำรองเลี้ยงชีพ • ท่องเที่ยว • สลากกินแบ่ง • โซเชียล • ยื่นภาษีประจำปี */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, H = SK.H, B = SK.B, C = SK.clamp;
  function S() { return SK.S; }
  function money(n) { return SK.money(n); }
  function A(o) {
    var d = { slots: 0, cost: 0, energy: 0, group: '', desc: '', icon: '•', check: null, run: null };
    for (var k in o) d[k] = o[k];
    return d;
  }
  function wrap(loc, extra) {
    var orig = B[loc];
    B[loc] = function (s) { return extra(s, orig(s)); };
  }

  // ======================================================================
  //  ตัวละครโสด (คบหาเป็นแฟนได้)
  // ======================================================================
  var SINGLES = {
    phai: {
      name: 'ไผ่', icon: '🧑‍🎨', role: 'นักออกแบบอิสระ', dateable: true, sched: { wd: ['cafe', 'library', 'culture'], we: ['culture', 'park', 'cafe'] },
      gift: 'สมุดสเก็ตช์', perk: { id: 'muse', at: 50, text: 'มีแรงบันดาลใจ อารมณ์ดีขึ้นทุกวัน' },
      lines: ['ฉันชอบมุมเมืองตอนแสงเย็นที่สุดเลย', 'กำลังออกแบบป้ายให้ตลาดนัดชุมชนอยู่ ช่วยดูหน่อยสิ', 'งานฟรีแลนซ์ก็ดีนะ แต่บางทีก็เหงาเหมือนกัน', 'ถ้ามีเวลาว่าง ไปนั่งวาดรูปริมน้ำด้วยกันไหม'],
      story: [
        { text: 'ไผ่เปิดสมุดสเก็ตช์ให้ดู มีรูปวาดเมืองสุขนครในมุมที่คุณไม่เคยสังเกต', reward: { mood: 8 } },
        { text: 'ไผ่บอกว่าคุยกับคุณแล้วได้ไอเดียใหม่ๆ ตลอด คุณเองก็รู้สึกมีพลังขึ้น', reward: { perk: 'muse' } },
        { text: 'ไผ่วาดภาพเหมือนของคุณมอบให้ ภาพนั้นอบอุ่นจนพูดไม่ออก', reward: { mood: 15 } }
      ]
    },
    fern: {
      name: 'ใบเฟิร์น', icon: '🧑‍🔬', role: 'นักวิจัยสิ่งแวดล้อม', dateable: true, sched: { wd: ['library', 'park', 'gym'], we: ['park', 'market', 'temple'] },
      gift: 'ต้นไม้กระถางเล็ก', perk: { id: 'greenTips', at: 50, text: 'ค่าน้ำค่าไฟลด 10%' },
      lines: ['รู้ไหม ต้นไม้ใหญ่ต้นเดียวลดอุณหภูมิรอบตัวได้หลายองศา', 'ฉันกำลังวัดคุณภาพน้ำในคลองอยู่ ดีขึ้นกว่าปีที่แล้วเยอะ', 'บางทีก็อยากหนีงานไปเดินป่าสักอาทิตย์', 'ปิดไฟตอนไม่ใช้ ช่วยโลกได้จริงนะ'],
      story: [
        { text: 'ใบเฟิร์นพาไปดูหิ่งห้อยที่ริมคลองซึ่งกลับมาหลังฟื้นฟูแม่น้ำ', reward: { mood: 10 } },
        { text: 'ใบเฟิร์นสอนวิธีประหยัดพลังงานในห้อง ใช้ได้ผลจริงจนบิลลดลง', reward: { perk: 'greenTips' } },
        { text: 'ใบเฟิร์นชวนเขียนบทความเรื่องเมืองสีเขียวด้วยกัน ได้รับคำชมจากทั้งเมือง', reward: { civic: 10, mood: 10 } }
      ]
    },
    pluem: {
      name: 'ปลื้ม', icon: '🧑‍🍳', role: 'เชฟร้านข้าวแกงในตลาด', dateable: true, sched: { wd: ['market', 'market', 'cafe'], we: ['market', 'culture', 'park'] },
      gift: 'เครื่องเทศหายาก', perk: { id: 'chefMeal', at: 50, text: 'ได้กินข้าวฟรีที่ร้านปลื้มวันละมื้อ' },
      lines: ['แกงเขียวหวานวันนี้ตำพริกแกงเองนะ ลองชิมสิ', 'ตื่นตีสี่ทุกวันเพื่อไปเลือกวัตถุดิบ เหนื่อยแต่ชอบ', 'อาหารดีๆ ทำให้คนยิ้มได้ ฉันเชื่อแบบนั้น', 'สักวันอยากเปิดร้านของตัวเองริมน้ำ'],
      story: [
        { text: 'ปลื้มสอนสูตรแกงลับประจำร้าน ฝีมือทำอาหารของคุณดีขึ้นมาก', reward: { skill: { service: 2 }, mood: 6 } },
        { text: 'ปลื้มบอกว่า "มากินที่ร้านได้ทุกวัน ไม่ต้องจ่ายหรอก"', reward: { perk: 'chefMeal' } },
        { text: 'ปลื้มทำอาหารพิเศษฉลองวันเกิดให้คุณโดยไม่บอกล่วงหน้า', reward: { mood: 18 } }
      ]
    }
  };
  for (var k in SINGLES) { SK.NPCS[k] = SINGLES[k]; SK.NPC_KEYS.push(k); }

  var NAMES = ['ต้น', 'แนน', 'บอส', 'มายด์', 'กอล์ฟ', 'ฝน', 'เจมส์', 'แพร', 'โอม', 'ปุ๊ก', 'เอิร์ธ', 'นุ่น', 'เก่ง', 'จูน', 'พี่เล็ก', 'พี่หน่อย', 'พี่ตุ่ย', 'พี่วิทย์'];
  var KIDS = ['น้องข้าวหอม', 'น้องภูผา', 'น้องใบข้าว', 'น้องทะเล', 'น้องมะลิ', 'น้องดิน'];

  // ======================================================================
  //  สถานะเพิ่มเติม (รองรับเซฟเวอร์ชันเก่า)
  // ======================================================================
  G.ensureLife = function (s) {
    s = s || S();
    if (!s.fam) s.fam = { bond: 60, call: -99, visit: -99, sent: 0 };
    if (!s.love) s.love = { stage: 'single', id: null, bond: 0, dates: 0, since: -1, lastDate: -99, cool: -99, child: null, babyDue: -1 };
    if (!s.ins) s.ins = { health: false };
    if (!s.pension) s.pension = { bal: 0, rate: 0 };
    if (!s.lotto) s.lotto = { tickets: 0, spent: 0, won: 0 };
    if (!s.tax) s.tax = { year: SK.dateOf(s.day).y, cur: 0, prev: 0, filed: -1 };
    if (!s.weather) s.weather = G.rollWeather(SK.dayInfo(s.day));
    if (s.job && !s.job.boss) G.makeColleagues(s.job);
    SK.NPC_KEYS.forEach(function () {});
    return s;
  };

  // ======================================================================
  //  สภาพอากาศ
  // ======================================================================
  var WX = {
    clear: { name: 'แจ่มใส', icon: '🌤️' }, hot: { name: 'ร้อนจัด', icon: '🥵' }, cloud: { name: 'ครึ้มฟ้า', icon: '☁️' },
    rain: { name: 'ฝนตก', icon: '🌧️' }, storm: { name: 'พายุฝนฟ้าคะนอง', icon: '⛈️' }, cool: { name: 'เย็นสบาย', icon: '🍃' }, haze: { name: 'หมอกควัน', icon: '🌫️' }
  };
  SK.WX = WX;
  G.rollWeather = function (info) {
    var r = Math.random(), s = S();
    if (s && s.seed != null) r = SK.rand();
    var k;
    if (info.season === 'ร้อน') k = r < 0.45 ? 'hot' : r < 0.8 ? 'clear' : r < 0.93 ? 'rain' : 'storm';
    else if (info.season === 'ฝน') k = r < 0.4 ? 'rain' : r < 0.55 ? 'storm' : r < 0.8 ? 'cloud' : 'clear';
    else {
      var hazeP = s ? C((75 - s.city.m.environment) / 60, 0.05, 0.4) : 0.15;
      k = r < hazeP ? 'haze' : r < 0.7 ? 'cool' : 'clear';
    }
    return { k: k, name: WX[k].name, icon: WX[k].icon };
  };
  var origTravel = G.travelCost;
  G.travelCost = function () {
    var s = S(), t = origTravel(), m = G.effMode(), w = s.weather ? s.weather.k : 'clear';
    if ((m === 'walk' || m === 'bike') && (w === 'rain' || w === 'storm')) t.energy += w === 'storm' ? 5 : 3;
    if ((m === 'walk' || m === 'bike') && w === 'hot') t.energy += 2;
    return t;
  };
  // กิจกรรมกลางแจ้งทำไม่ได้ตอนพายุ
  var OUTDOOR = { park: ['walk', 'jog', 'yoga', 'vol:environment'], station: ['rider'] };
  Object.keys(OUTDOOR).forEach(function (loc) {
    wrap(loc, function (s, list) {
      list.forEach(function (a) {
        if (OUTDOOR[loc].indexOf(a.key) < 0) return;
        var oc = a.check, orun = a.run;
        a.check = function (s2) { if (s2.weather && s2.weather.k === 'storm') return 'พายุฝนฟ้าคะนอง ทำกิจกรรมกลางแจ้งไม่ได้'; return oc ? oc(s2) : null; };
        if (a.key === 'rider') a.run = function (s2) {
          var before = s2.cash, msg = orun(s2);
          if (s2.weather && s2.weather.k === 'rain') { var extra = Math.round((s2.cash - before) * 0.25); if (extra > 0) { G.earn(extra, 'งานไรเดอร์', true); msg += ' + ค่าส่งช่วงฝนตก ' + money(extra); } }
          return msg;
        };
        if (a.key === 'walk' || a.key === 'yoga') a.run = function (s2) { var m = orun(s2); if (s2.weather && s2.weather.k === 'haze') { G.mod('health', -1); m += ' (หมอกควันทำให้แสบคอนิดหน่อย)'; } return m; };
      });
      return list;
    });
  });

  // ======================================================================
  //  หัวหน้าและเพื่อนร่วมงาน
  // ======================================================================
  G.makeColleagues = function (job) {
    var a = SK.pick(NAMES), b = SK.pick(NAMES);
    if (a === b) b = NAMES[(NAMES.indexOf(a) + 3) % NAMES.length];
    job.boss = { name: a.indexOf('พี่') === 0 ? a : 'คุณ' + a, rel: 30, adv: -99 };
    job.mate = { name: b, rel: 30, chat: -99, lunch: -99 };
  };
  var origHire = G.hire;
  G.hire = function (op) { origHire(op); G.makeColleagues(S().job); };
  G.promoNeed = function (j) {
    var boss = j.boss ? j.boss.rel : 30;
    return { shifts: Math.max(26, 40 - Math.floor(boss / 10) * 2), perf: boss >= 70 ? 55 : 60 };
  };
  wrap('work', function (s, list) {
    var j = s.job;
    if (!j) return list;
    if (!j.boss) G.makeColleagues(j);
    var g = 'คนในที่ทำงาน — หัวหน้า ' + j.boss.name + ' (' + Math.round(j.boss.rel) + ') • เพื่อนร่วมงาน ' + j.mate.name + ' (' + Math.round(j.mate.rel) + ')';
    list.push(A({
      key: 'mate', group: g, icon: '☕', name: 'พักเบรกคุยกับ' + j.mate.name, desc: 'เพื่อนร่วมงานที่ดีทำให้งานไม่เครียด', slots: 0,
      check: function (s) { return !s.today.worked ? 'ต้องเข้างานวันนี้ก่อน' : j.mate.chat === s.day ? 'วันนี้คุยไปแล้ว' : null; },
      run: function (s) { j.mate.chat = s.day; j.mate.rel = C(j.mate.rel + 5, 0, 100); G.mod('mood', 5); return j.mate.name + ': "' + SK.pick(['งานโปรเจกต์ใหม่ยากชะมัด แต่สู้ๆ', 'เมื่อวานหัวหน้าชมงานเราด้วยนะ', 'เย็นนี้ฝนน่าจะตก อย่าลืมร่ม', 'เดือนนี้ใครเกิดบ้าง เดี๋ยวซื้อเค้กกัน']) + '"'; }
    }));
    list.push(A({
      key: 'lunch', group: g, icon: '🍱', name: 'กินข้าวเที่ยงกับทีม', desc: 'อิ่ม +34 • สนิทกับทีมและหัวหน้า', slots: 0, cost: 120,
      check: function (s) { return !s.today.worked ? 'ต้องเข้างานวันนี้ก่อน' : j.mate.lunch === s.day ? 'วันนี้กินด้วยกันแล้ว' : s.sat > 82 ? 'ยังอิ่มอยู่' : null; },
      run: function (s) { j.mate.lunch = s.day; H.eat(34, 58, 3); j.mate.rel = C(j.mate.rel + 3, 0, 100); j.boss.rel = C(j.boss.rel + 2, 0, 100); return 'มื้อเที่ยงกับทีมสนุกดี ได้ข่าววงในหลายเรื่อง'; }
    }));
    list.push(A({
      key: 'boss', group: g, icon: '🧭', name: 'ขอคำแนะนำจาก' + j.boss.name, desc: 'หัวหน้าที่สนิทช่วยให้เลื่อนตำแหน่งเร็วขึ้น • สัปดาห์ละครั้ง', slots: 0,
      check: function (s) { return !s.today.worked ? 'ต้องเข้างานวันนี้ก่อน' : s.day - j.boss.adv < 7 ? 'ขอคำแนะนำได้สัปดาห์ละครั้ง' : null; },
      run: function (s) { j.boss.adv = s.day; j.boss.rel = C(j.boss.rel + 5, 0, 100); G.skill(SK.TRACKS[j.track].skill, 0.8); j.perf = C(j.perf + 1, 0, 100); return j.boss.name + 'ให้คำแนะนำเรื่องงานที่ใช้ได้จริง ผลงานดีขึ้น'; }
    }));
    return list;
  });
  // ทำงานต่อเนื่องหัวหน้าก็เห็น
  var origAdvance = null;

  // ======================================================================
  //  ครอบครัว: พ่อแม่
  // ======================================================================
  wrap('home', function (s, list) {
    var f = s.fam, L = s.love, out = [];
    out.push(A({
      key: 'callfam', group: 'ครอบครัว 👨‍👩‍👧 (ความผูกพันกับพ่อแม่ ' + Math.round(f.bond) + ')', icon: '📱', name: 'วิดีโอคอลหาพ่อแม่ที่ต่างจังหวัด', desc: 'พ่อแม่ดีใจ คุณก็อุ่นใจ • วันละครั้ง', slots: 0,
      check: function (s) { return s.fam.call === s.day ? 'วันนี้โทรไปแล้ว' : null; },
      run: function (s) { s.fam.call = s.day; s.fam.bond = C(s.fam.bond + 3, 0, 100); G.mod('mood', 4); return SK.pick(['แม่ถามว่ากินข้าวหรือยัง', 'พ่ออวดว่าปลูกมะม่วงออกลูกดก', 'แม่บอกให้รักษาสุขภาพด้วย', 'พ่อแม่ยิ้มกว้างที่เห็นหน้าคุณ']) + ' 💛'; }
    }));
    out.push(A({
      key: 'sendfam', group: 'ครอบครัว 👨‍👩‍👧 (ความผูกพันกับพ่อแม่ ' + Math.round(f.bond) + ')', icon: '💸', name: 'โอนเงินช่วยพ่อแม่ ฿2,000', desc: 'กตัญญู ความผูกพันเพิ่มขึ้นมาก • เดือนละครั้ง', slots: 0, cost: 2000, cat: 'ส่งเงินให้ครอบครัว',
      check: function (s) { return s.day - (s.fam.sentDay == null ? -99 : s.fam.sentDay) < 25 ? 'ส่งไปแล้วเดือนนี้' : null; },
      run: function (s) { s.fam.sentDay = s.day; s.fam.sent += 2000; s.fam.bond = C(s.fam.bond + 8, 0, 100); G.mod('mood', 4); return 'โอนเงินให้ที่บ้านแล้ว แม่ส่งสติกเกอร์ขอบคุณมาเต็มจอ'; }
    }));
    // คนรัก
    if (L.stage !== 'single' && L.id) {
      var n = SK.NPCS[L.id], gl = (L.stage === 'married' ? '💍 คู่ชีวิต: ' : '💞 คนรัก: ') + n.icon + ' ' + n.name + ' (ความผูกพัน ' + Math.round(L.bond) + ')';
      out.push(A({
        key: 'love:time', group: gl, icon: '🫶', name: 'ใช้เวลาด้วยกันที่บ้าน', desc: 'ทำกับข้าว ดูหนัง คุยเรื่องวันนี้ • อารมณ์ดีมาก', slots: 1, energy: -4,
        run: function (s) { s.love.bond = C(s.love.bond + 6, 0, 100); G.mod('mood', 12); return SK.pick(['ทำอาหารเย็นด้วยกันแล้วหัวเราะกันทั้งคืน', 'นั่งดูหนังเรื่องโปรดซบไหล่กัน', 'เล่าเรื่องวันนี้ให้กันฟังจนดึก', 'วางแผนอนาคตด้วยกันอย่างตื่นเต้น']); }
      }));
      out.push(A({
        key: 'love:date', group: gl, icon: '🌃', name: 'ออกเดทนอกบ้าน (ร้านอาหาร/ดูหนัง)', desc: 'ความผูกพันเพิ่มมาก', slots: 1, cost: 550, energy: 5, cat: 'คนรักและครอบครัว',
        run: function (s) { s.love.bond = C(s.love.bond + 10, 0, 100); G.mod('mood', 16); return 'เดทค่ำคืนนี้พิเศษสุดๆ ✨'; }
      }));
      if (L.stage === 'dating') {
        out.push(A({
          key: 'love:wed1', group: gl, icon: '💍', name: 'ขอแต่งงาน — จัดงานเรียบง่าย ฿20,000', desc: 'คบกัน 60 วันขึ้นไป และความผูกพัน ≥ 80 • คู่สมรสช่วยแบ่งเบาค่าใช้จ่าย', slots: 1, cost: 20000, cat: 'คนรักและครอบครัว',
          check: function (s) { return s.day - s.love.since < 60 ? 'คบกันอีกสักพัก (ครบ 60 วัน)' : s.love.bond < 80 ? 'ความผูกพันยังไม่ถึง 80' : null; },
          run: function (s) { return G.marry(false); }
        }));
        out.push(A({
          key: 'love:wed2', group: gl, icon: '💒', name: 'ขอแต่งงาน — จัดงานใหญ่ ฿80,000', desc: 'งานแต่งในฝัน เชิญคนทั้งชุมชน', slots: 1, cost: 80000, cat: 'คนรักและครอบครัว',
          check: function (s) { return s.day - s.love.since < 60 ? 'คบกันอีกสักพัก (ครบ 60 วัน)' : s.love.bond < 80 ? 'ความผูกพันยังไม่ถึง 80' : null; },
          run: function (s) { return G.marry(true); }
        }));
      }
      if (L.stage === 'married' && !L.child && L.babyDue < 0) {
        out.push(A({
          key: 'love:baby', group: gl, icon: '👶', name: 'วางแผนมีลูกด้วยกัน', desc: 'ค่าเลี้ยงดูราว ฿7,000/เดือน • ความสุขที่ไม่มีอะไรเทียบได้', slots: 0, confirm: 'ลูกคือความรับผิดชอบระยะยาว (ค่าใช้จ่ายราว ฿7,000/เดือน) ตกลงวางแผนมีลูก?',
          check: function (s) { return s.day - s.love.since < 30 ? 'แต่งงานกันมาอย่างน้อย 30 วันก่อน' : s.love.bond < 70 ? 'ความผูกพันควรถึง 70' : null; },
          run: function (s) { s.love.babyDue = s.day + 45; G.mod('mood', 10); return '🤰 ข่าวดี! ครอบครัวกำลังจะมีสมาชิกใหม่ในอีกประมาณ 45 วัน'; }
        }));
      }
    }
    {
      if (L.child) {
        out.push(A({
          key: 'kid:play', group: '👶 ลูก: ' + L.child.name + ' (ความผูกพัน ' + Math.round(L.child.bond) + ')', icon: '🧸', name: 'เล่นกับลูก / อ่านนิทาน / สอนการบ้าน', desc: 'ลูกมีความสุข คุณก็มีความสุข', slots: 1, energy: 6,
          run: function (s) { s.love.child.bond = C(s.love.child.bond + 8, 0, 100); s.love.bond = C(s.love.bond + 2, 0, 100); G.mod('mood', 12); G.skill('care', 0.4); return SK.pick([L.child.name + 'หัวเราะเสียงดังตอนเล่นจ๊ะเอ๋', 'อ่านนิทานจนลูกหลับปุ๋ย', L.child.name + 'วาดรูปครอบครัวให้ดู มีคุณยืนยิ้มอยู่ตรงกลาง', 'สอนลูกนับเลขจนนับได้ถึงสิบ']); }
        }));
      }
    }
    var scrollAct = (A({
      key: 'scroll', group: 'พักผ่อน', icon: '📱', name: 'เล่นโซเชียล / ดูคลิปสั้น', desc: 'ผ่อนคลายได้ แต่ถ้าเล่นนานเกินไปจะรู้สึกแย่', slots: 1, energy: -2,
      run: function (s) {
        s.flags.scrollDay = s.flags.scrollDay === s.day ? s.day : s.day;
        s.flags.scrollN = (s.flags.scrollD === s.day ? (s.flags.scrollN || 0) : 0) + 1; s.flags.scrollD = s.day;
        if (s.flags.scrollN >= 2) { G.mod('mood', -3); return 'ไถฟีดเพลินจนลืมเวลา… รู้สึกเหนื่อยใจและเสียดายเวลานิดๆ'; }
        G.mod('mood', 6); return SK.pick(['เจอคลิปแมวตลกจนขำออกมาดังๆ', 'เพื่อนเก่าโพสต์รูปงานแต่ง กดไลก์ให้แล้ว', 'อ่านข่าวเมืองในเพจชุมชน', 'ดูคลิปสอนทำอาหารใหม่ๆ']);
      }
    }));
    var ei = -1; list.forEach(function (a, i) { if (a.key === 'entertain') ei = i; });
    if (ei >= 0) list.splice(ei + 1, 0, scrollAct); else list.push(scrollAct);
    return out.concat(list);
  });

  G.marry = function (big) {
    var s = S(), L = s.love, n = SK.NPCS[L.id];
    L.stage = 'married'; L.since = s.day; L.bond = C(L.bond + (big ? 15 : 8), 0, 100);
    G.mod('mood', big ? 30 : 22); s.fam.bond = C(s.fam.bond + 15, 0, 100);
    if (big) { G.nudge('culture', 0.5, 'volunteer'); SK.NPC_KEYS.forEach(function (id) { if (G.rel(id) >= 30) G.addRel(id, 2); }); }
    G.news(s.name + ' และ' + n.name + ' แต่งงานกันแล้ว 💍', 'me');
    return '💍 แต่งงานกับ' + n.name + 'แล้ว! ' + (big ? 'งานใหญ่ทั้งชุมชนมาร่วมยินดี' : 'งานเล็กอบอุ่นท่ามกลางคนที่รัก');
  };

  // ======================================================================
  //  ความรัก: ปุ่มบน NPC โสด
  // ======================================================================
  var origNpcWrap = function (loc) {
    wrap(loc, function (s, list) {
      var L = s.love, extra = [];
      G.npcsAt(loc).forEach(function (id) {
        var n = SK.NPCS[id];
        if (!n.dateable) return;
        var r = G.relObj(id), g = 'npc:' + id;
        if (L.stage === 'single') {
          extra.push(A({
            key: 'date:' + id, group: g, npc: id, icon: '🌹', name: 'ชวน' + n.name + 'ไปเดท', desc: 'ต้องสนิท 40 ขึ้นไป • เดทครั้งที่ ' + ((r.dates || 0) + 1), slots: 1, cost: 350, energy: 4, cat: 'คนรักและครอบครัว',
            check: function (s) { return r.v < 40 ? 'ยังสนิทกันไม่พอ (ต้อง 40)' : s.day - (r.lastDate == null ? -99 : r.lastDate) < 3 ? 'เพิ่งเดทกันไป' : null; },
            run: function (s) { r.dates = (r.dates || 0) + 1; r.lastDate = s.day; G.addRel(id, 7); G.mod('mood', 12); return SK.pick(['เดินเล่นริมน้ำตอนพระอาทิตย์ตก คุยกันไม่หยุด', 'ไปนั่งร้านอาหารเล็กๆ ที่' + n.name + 'ชอบ', 'ดูดนตรีสดด้วยกันจนดึก', 'ไปตลาดนัดกลางคืนชิมของอร่อย']) + ' 💓'; }
          }));
          extra.push(A({
            key: 'confess:' + id, group: g, npc: id, icon: '💌', name: 'สารภาพความรู้สึก ขอเป็นแฟน', desc: 'ต้องสนิท 75 และเดทกันมาแล้ว 4 ครั้ง', slots: 0,
            check: function (s) { return r.v < 75 ? 'ยังสนิทไม่พอ (ต้อง 75)' : (r.dates || 0) < 4 ? 'ควรเดทกันก่อนอย่างน้อย 4 ครั้ง' : s.day < (r.cool || -99) ? 'ให้เวลาอีกฝ่ายสักพัก' : null; },
            run: function (s) {
              var p = C(0.45 + (r.v - 75) / 50 + (s.mood - 50) / 400 + (s.day <= s.dressedUntil ? 0.05 : 0), 0.2, 0.95);
              if (SK.chance(p)) {
                s.love = { stage: 'dating', id: id, bond: 70, dates: r.dates, since: s.day, lastDate: s.day, cool: -99, child: null, babyDue: -1 };
                G.mod('mood', 25); G.news(s.name + ' กับ' + n.name + ' เริ่มคบหากันแล้ว 💞', 'me');
                return '💞 ' + n.name + 'ยิ้มเขินแล้วพยักหน้า "เราก็รู้สึกเหมือนกัน"';
              }
              r.cool = s.day + 14; r.v = Math.max(0, r.v - 8); G.mod('mood', -12);
              return n.name + 'ขอเวลาคิดก่อน… ยังไม่พร้อมตอนนี้';
            }
          }));
        }
      });
      // แทรกปุ่มต่อจากกลุ่มของ NPC
      extra.forEach(function (a) {
        var idx = -1;
        for (var i = 0; i < list.length; i++) if (list[i].group === a.group) idx = i;
        if (idx >= 0) list.splice(idx + 1, 0, a); else list.unshift(a);
      });
      return list;
    });
  };
  ['cafe', 'library', 'culture', 'park', 'gym', 'market', 'temple'].forEach(origNpcWrap);

  // ======================================================================
  //  ตลาด: ข้าวฟรีจากปลื้ม + สลากกินแบ่ง
  // ======================================================================
  wrap('market', function (s, list) {
    if (s.perks.chefMeal) list.unshift(A({
      key: 'chefmeal', group: 'กินที่ตลาด', icon: '🍛', name: 'กินข้าวแกงร้านปลื้ม (ฟรี)', desc: 'อิ่ม +40 • คุณภาพดี • วันละมื้อ', slots: 0,
      check: function (s) { return s.flags.chefDay === s.day ? 'วันนี้กินไปแล้ว' : s.sat > 82 ? 'ยังอิ่มอยู่' : null; },
      run: function (s) { s.flags.chefDay = s.day; H.eat(40, 75, 3); G.addRel('pluem', 1); return 'ปลื้มตักแกงให้พิเศษ อร่อยมาก'; }
    }));
    var dt = SK.dateOf(s.day), next = dt.d < 16 ? '16 ' + SK.MONTHS_S[dt.m] : '1 ' + SK.MONTHS_S[(dt.m + 1) % 12];
    list.push(A({
      key: 'lotto', group: 'สลากกินแบ่ง', icon: '🎫', name: 'ซื้อสลากกินแบ่ง 1 ใบ ฿80', desc: 'ออกรางวัลงวด ' + next + ' • ถืออยู่ ' + s.lotto.tickets + ' ใบ • ซื้อไปแล้วรวม ' + money(s.lotto.spent) + ' ถูกรางวัลรวม ' + money(s.lotto.won), slots: 0, cost: 80, cat: 'สลากกินแบ่ง',
      check: function (s) { return s.lotto.tickets >= 10 ? 'ซื้อได้สูงสุด 10 ใบต่องวด' : null; },
      run: function (s) { s.lotto.tickets++; s.lotto.spent += 80; return 'ได้เลขสวยมาหนึ่งใบ ขอให้โชคดี 🍀'; }
    }));
    return list;
  });
  G.drawLotto = function () {
    var s = S(), t = s.lotto.tickets;
    if (!t) return;
    var win = 0, big = false;
    for (var i = 0; i < t; i++) {
      var r = SK.rand();
      if (r < 0.000001) { win += 6000000; big = true; } else if (r < 0.002) win += 4000; else if (r < 0.012) win += 2000;
    }
    s.lotto.tickets = 0;
    if (win > 0) {
      s.lotto.won += win; G.earn(win, 'ถูกสลาก'); G.mod('mood', big ? 40 : 10);
      G.log('🎉 ถูกสลากกินแบ่ง ' + money(win) + '!', 'good');
      if (big) G.news(s.name + ' ถูกรางวัลที่ 1 สลากกินแบ่ง! 🎉', 'me');
    } else G.log('🎫 สลากงวดนี้ไม่ถูกรางวัล (' + t + ' ใบ)', 'n');
  };

  // ======================================================================
  //  ธนาคาร: ประกันสุขภาพ + กองทุนสำรองเลี้ยงชีพ
  // ======================================================================
  wrap('bank', function (s, list) {
    var g1 = 'ประกันสุขภาพ (' + (s.ins.health ? 'คุ้มครองอยู่ • ฿450/เดือน' : 'ยังไม่มี') + ')';
    list.push(A({
      key: 'ins:on', group: g1, icon: '🛡️', name: 'สมัครประกันสุขภาพ ฿450/เดือน', desc: 'คุ้มครองค่ารักษาเจ็บป่วยร้ายแรงและอุบัติเหตุ (ไม่ต้องจ่ายเองเป็นหมื่น)', slots: 0,
      check: function (s) { return s.ins.health ? 'มีประกันอยู่แล้ว' : null; },
      run: function (s) { s.ins.health = true; return 'สมัครประกันสุขภาพเรียบร้อย เบี้ยจะหักทุกวันที่ 1'; }
    }));
    list.push(A({
      key: 'ins:off', group: g1, icon: '✂️', name: 'ยกเลิกประกันสุขภาพ', desc: 'ประหยัดเบี้ยประกัน แต่ถ้าป่วยหนักต้องจ่ายเอง', slots: 0, confirm: 'ยกเลิกประกันสุขภาพ?',
      check: function (s) { return !s.ins.health ? 'ยังไม่มีประกัน' : null; },
      run: function (s) { s.ins.health = false; return 'ยกเลิกประกันแล้ว'; }
    }));
    var g2 = 'กองทุนสำรองเลี้ยงชีพ (ยอดสะสม ' + money(s.pension.bal) + ' • หักเงินเดือน ' + s.pension.rate + '%)';
    [0, 3, 5, 10].forEach(function (r) {
      list.push(A({
        key: 'pvd:' + r, group: g2, icon: r ? '🏦' : '⏸️', name: r ? 'ออมเข้ากองทุน ' + r + '% ของเงินเดือน' : 'หยุดออมเข้ากองทุน', desc: r ? 'นายจ้างสมทบให้เพิ่มสูงสุด 3% • ผลตอบแทน ~3.5%/ปี • ถอนได้เมื่อออกจากงาน' : 'เงินเดือนเข้ากระเป๋าเต็มจำนวน', slots: 0,
        check: function (s) { return s.pension.rate === r ? 'ตั้งไว้แบบนี้อยู่แล้ว' : (!s.job && r > 0) ? 'ต้องมีงานประจำ' : null; },
        run: function (s) { s.pension.rate = r; return r ? 'ตั้งออมเข้ากองทุนสำรองเลี้ยงชีพ ' + r + '% แล้ว' : 'หยุดออมเข้ากองทุนแล้ว'; }
      }));
    });
    list.push(A({
      key: 'pvd:out', group: g2, icon: '💼', name: 'ถอนเงินกองทุนสำรองเลี้ยงชีพทั้งหมด', desc: 'ทำได้เมื่อไม่มีงานประจำ', slots: 0, confirm: 'ถอนเงินกองทุนทั้งหมด? (ควรเก็บไว้ใช้ยามเกษียณ)',
      check: function (s) { return s.job ? 'ถอนได้เมื่อออกจากงานแล้ว' : s.pension.bal < 1 ? 'ไม่มียอดสะสม' : null; },
      run: function (s) { var v = Math.round(s.pension.bal); s.pension.bal = 0; s.cash += v; return 'ถอนกองทุนได้ ' + money(v); }
    }));
    return list;
  });
  var origWeekly = G.weeklyPay;
  G.weeklyPay = function () {
    var s = S(), gross = Math.round(s.weekPay), taxBefore = s.stats.taxPaid;
    origWeekly();
    if (s.tax) s.tax.cur += s.stats.taxPaid - taxBefore;
    if (gross > 0 && s.pension && s.pension.rate > 0 && s.job) {
      var c = Math.round(gross * s.pension.rate / 100), m = Math.round(gross * Math.min(3, s.pension.rate) / 100);
      s.cash -= c; s.pension.bal += c + m;
      s.month.exp['ออมกองทุนสำรองเลี้ยงชีพ'] = (s.month.exp['ออมกองทุนสำรองเลี้ยงชีพ'] || 0) + c;
    }
  };
  var origNW = G.netWorth;
  G.netWorth = function () { var s = S(); return origNW() + Math.round((s.pension && s.pension.bal) || 0); };

  // ======================================================================
  //  ที่ว่าการ: ยื่นภาษีประจำปี
  // ======================================================================
  wrap('townhall', function (s, list) {
    var dt = SK.dateOf(s.day);
    list.push(A({
      key: 'taxfile', group: 'ภาษีประจำปี', icon: '📑', name: 'ยื่นแบบภาษีเงินได้ประจำปี (ม.ค.–มี.ค.)', desc: 'ภาษีที่ถูกหักไว้ปีก่อน ' + money(s.tax.prev) + ' • ยื่นแล้วอาจได้เงินคืนจากค่าลดหย่อน', slots: 1, energy: 3,
      check: function (s) { return dt.m > 2 ? 'ยื่นได้ช่วงมกราคม–มีนาคม' : s.tax.filed === dt.y ? 'ยื่นปีนี้แล้ว' : null; },
      run: function (s) {
        s.tax.filed = dt.y; s.civic += 2;
        var refund = Math.round(s.tax.prev * 0.25 + Math.min(s.pension.bal * 0.02, 3000) + (s.ins.health ? 400 : 0) + (s.love.child ? 1500 : 0));
        if (s.tax.prev <= 0) refund = 0;
        if (refund > 0) { G.earn(refund, 'เงินคืนภาษี'); return 'ยื่นภาษีเรียบร้อย ได้เงินคืนจากค่าลดหย่อน ' + money(refund); }
        return 'ยื่นภาษีเรียบร้อย ไม่มีภาษีค้างจ่าย (+2 แต้มพลเมือง)';
      }
    }));
    return list;
  });

  // ======================================================================
  //  สถานีขนส่ง: ท่องเที่ยว และกลับบ้านต่างจังหวัด
  // ======================================================================
  wrap('station', function (s, list) {
    var withLove = s.love.stage !== 'single';
    function dayOff(s) { var i = SK.dayInfo(s.day); return i.off || s.today.leave || !s.job; }
    list.push(A({
      key: 'trip', group: 'ท่องเที่ยวและครอบครัว', icon: '🏖️', name: 'ทริปเที่ยวทะเล/ภูเขาหนึ่งวัน' + (withLove ? ' (ไปกับคนรัก)' : ''), desc: 'ใช้ทั้งวัน • อารมณ์ดีขึ้นมาก ได้พักใจจริงๆ • ต้องเป็นวันหยุดหรือลางาน', slots: 3, cost: withLove ? 3200 : 1800, energy: 10, cat: 'ท่องเที่ยว',
      check: function (s) { return s.slot !== 0 ? 'ต้องออกเดินทางตั้งแต่เช้า' : !dayOff(s) ? 'วันนี้ต้องทำงาน (ลาพักร้อนก่อนได้)' : null; },
      run: function (s) {
        G.mod('mood', 32); G.mod('fitness', 1.5); s.stats.workStreak = 0;
        if (withLove) s.love.bond = C(s.love.bond + 14, 0, 100);
        return SK.pick(['ดูพระอาทิตย์ตกริมทะเล ลืมเรื่องเหนื่อยไปหมด', 'เดินป่าขึ้นจุดชมวิว ทะเลหมอกสวยมาก', 'นั่งรถไฟเที่ยวเมืองเก่า ชิมของอร่อยตลอดทาง']) + (withLove ? ' กับ' + SK.NPCS[s.love.id].name + ' 💞' : '');
      }
    }));
    list.push(A({
      key: 'visitfam', group: 'ท่องเที่ยวและครอบครัว', icon: '🏡', name: 'กลับบ้านต่างจังหวัดไปเยี่ยมพ่อแม่', desc: 'ใช้ทั้งวัน • ความผูกพันกับครอบครัวเพิ่มมาก • ต้องเป็นวันหยุดหรือลางาน', slots: 3, cost: 900, energy: 8, cat: 'ท่องเที่ยว',
      check: function (s) { return s.slot !== 0 ? 'ต้องออกเดินทางตั้งแต่เช้า' : !dayOff(s) ? 'วันนี้ต้องทำงาน (ลาพักร้อนก่อนได้)' : null; },
      run: function (s) { s.fam.visit = s.day; s.fam.bond = C(s.fam.bond + 22, 0, 100); G.mod('mood', 24); H.eat(60, 85, 0); return 'แม่ทำกับข้าวจานโปรดรอไว้ พ่อพาไปดูสวน อิ่มทั้งท้องทั้งใจ 💛'; }
    }));
    return list;
  });

  // ======================================================================
  //  วงจรรายวัน / รายเดือน
  // ======================================================================
  G.lifeMood = function () {
    var s = S(), m = 0;
    if (!s.fam) return 0;
    if (s.fam.bond < 25) m -= 4; else if (s.fam.bond > 70) m += 2;
    if (s.love.stage !== 'single') m += s.love.bond > 60 ? 5 : s.love.bond < 30 ? -6 : 1;
    if (s.love.child) m += s.love.child.bond > 40 ? 4 : -3;
    if (s.perks.muse) m += 2;
    if (s.weather && s.weather.k === 'cool') m += 1;
    if (s.weather && (s.weather.k === 'storm' || s.weather.k === 'haze')) m -= 1;
    return m;
  };
  G.lifeNight = function () {
    var s = S();
    G.ensureLife(s);
    s.fam.bond = C(s.fam.bond - 0.15, 0, 100);
    if (s.love.stage !== 'single') s.love.bond = C(s.love.bond - (s.love.stage === 'married' ? 0.45 : 0.6), 0, 100);
    if (s.love.child) s.love.child.bond = C(s.love.child.bond - 0.5, 0, 100);
    if (s.weather && s.weather.k === 'haze' && s.city.m.environment < 70) G.mod('health', -0.4);
    if (s.job && s.job.boss && s.today.worked && s.job.perf > 70) s.job.boss.rel = C(s.job.boss.rel + 0.25, 0, 100);
    if (s.job && s.job.boss && !s.today.worked && !SK.dayInfo(s.day).off && !s.today.leave && !s.sick) s.job.boss.rel = C(s.job.boss.rel - 3, 0, 100);
  };
  G.lifeNewDay = function (ni) {
    var s = S();
    G.ensureLife(s);
    s.weather = G.rollWeather(ni);
    if (ni.date.d === 1 || ni.date.d === 16) G.drawLotto();
    if (ni.date.m === 0 && ni.date.d === 1 || s.tax.year !== ni.date.y) { s.tax.prev = s.tax.cur; s.tax.cur = 0; s.tax.year = ni.date.y; }
    if (s.pendingEvent) return;
    if (s.love.babyDue >= 0 && s.day >= s.love.babyDue) { G.startEvent('baby'); return; }
    if (s.love.stage !== 'single' && s.love.bond < 15) { G.startEvent('breakup'); return; }
  };
  G.lifeMonthly = function (items) {
    var s = S();
    G.ensureLife(s);
    if (s.ins.health) { var o = G.payOrOwe(450, 'ประกันสุขภาพ'); if (o > 0) { s.ins.health = false; items.push('⚠️ จ่ายเบี้ยประกันไม่ได้ ประกันถูกยกเลิก'); } }
    if (s.pension.bal > 0) s.pension.bal *= 1 + 0.035 / 12;
    if (s.love.stage === 'married') {
      var inc = SK.rint(6500, 9500);
      G.earn(inc, 'คู่สมรสช่วยค่าใช้จ่ายบ้าน');
      G.payOrOwe(3000, 'ค่าใช้จ่ายครอบครัว');
    }
    if (s.love.child) {
      var kid = G.childCost ? G.childCost() : 4500 + (s.job ? 2500 : 0);
      var ok = G.payOrOwe(kid, 'ค่าเลี้ยงดูบุตร' + (s.job ? ' + เนอร์สเซอรี่' : ''));
      if (ok > 0) items.push('⚠️ ค่าเลี้ยงดูลูกไม่พอ ' + money(ok));
    }
  };
  var origBills = G.billsOf;
  G.billsOf = function () { var b = origBills(); return S().perks.greenTips ? Math.round(b * 0.9) : b; };
  G.familyScore = function () {
    var s = S();
    if (!s.fam) return 50;
    var v = s.fam.bond * 0.45;
    if (s.love.stage !== 'single') v += s.love.bond * (s.love.stage === 'married' ? 0.4 : 0.3) + (s.love.stage === 'married' ? 10 : 0);
    if (s.love.child) v += s.love.child.bond * 0.15;
    return C(v, 0, 100);
  };

  // ======================================================================
  //  เหตุการณ์ชีวิตจริงเพิ่มเติม
  // ======================================================================
  function needSlot(n) { return function () { return G.remaining() < n ? 'เวลาในวันนี้ไม่พอ' : null; }; }
  var EV = [
    {
      id: 'baby', icon: '👶', special: true, def: 0,
      init: function (s) { return { name: SK.pick(KIDS) }; },
      title: 'ยินดีต้อนรับสมาชิกใหม่!', text: function (s, x) { return 'วันนี้' + x.name + 'ลืมตาดูโลกแล้ว ทั้งครอบครัวน้ำตาซึมด้วยความสุข' + (s.job ? ' ที่ทำงานให้วันลาเลี้ยงลูกเพิ่ม 10 วัน' : ''); },
      choices: [{ label: 'กอดลูกไว้แน่นๆ', cost: 0, run: function (s, x) {
        s.love.child = { name: x.name, born: s.day, bond: 70 }; s.love.babyDue = -1; s.love.bond = C(s.love.bond + 10, 0, 100);
        if (s.job) s.job.leaveLeft += 10; G.mod('mood', 30); s.fam.bond = C(s.fam.bond + 20, 0, 100);
        G.news('ยินดีกับ' + s.name + ' ต้อนรับ' + x.name + 'สมาชิกใหม่ของครอบครัว 👶', 'me');
        return 'ครอบครัวของคุณสมบูรณ์ขึ้นอีกขั้น 💛';
      } }]
    },
    {
      id: 'breakup', icon: '💔', special: true, def: 0,
      init: function (s) { return { name: SK.NPCS[s.love.id].name, married: s.love.stage === 'married' }; },
      title: 'ความสัมพันธ์มาถึงทางแยก', text: function (s, x) { return x.name + 'บอกว่ารู้สึกห่างเหินเพราะไม่ค่อยได้ใช้เวลาด้วยกัน ' + (x.married ? 'และขอแยกทางกัน' : 'และขอเลิกกัน'); },
      choices: [
        { label: 'ขอโอกาสอีกครั้ง สัญญาว่าจะใส่ใจมากขึ้น', cost: 0, run: function (s) { if (SK.chance(0.45)) { s.love.bond = 40; G.mod('mood', -4); return 'อีกฝ่ายยอมให้โอกาส… ต้องใส่ใจกันมากกว่านี้'; } return G.breakUp(); } },
        { label: 'ยอมรับและแยกทางกันด้วยดี', cost: 0, run: function () { return G.breakUp(); } }
      ]
    },
    {
      id: 'parentsick', icon: '🏥', cd: 150,
      w: function (s) { return 0.5; },
      init: function () { return {}; },
      title: 'พ่อไม่สบายที่ต่างจังหวัด', text: function () { return 'แม่โทรมาด้วยน้ำเสียงกังวล พ่อต้องเข้าโรงพยาบาลด้วยอาการความดันสูง หมอบอกว่าไม่อันตรายแต่ต้องพักหลายวัน'; }, def: 1,
      choices: [
        { label: 'ส่งเงินช่วยค่าใช้จ่าย ฿5,000', cost: 5000, run: function (s) { s.fam.bond = C(s.fam.bond + 12, 0, 100); return 'แม่ขอบคุณมาก พ่ออาการดีขึ้นเรื่อยๆ'; } },
        { label: 'โทรไปให้กำลังใจทุกวัน', cost: 0, run: function (s) { s.fam.bond = C(s.fam.bond + 5, 0, 100); G.mod('mood', -4); return 'คุยกับพ่อทุกคืนจนพ่อหายดี'; } },
        { label: 'ลากลับไปดูแล 1 วัน (฿900)', cost: 900, req: function (s) { return s.job && s.job.leaveLeft <= 0 && !SK.dayInfo(s.day).off ? 'ไม่มีวันลาเหลือ' : G.remaining() < 3 ? 'ต้องเป็นตอนเช้า' : null; }, run: function (s) { if (s.job && !SK.dayInfo(s.day).off) { s.job.leaveLeft--; s.today.leave = true; } s.fam.bond = C(s.fam.bond + 20, 0, 100); G.mod('mood', 6); G.advance(3); return 'ได้อยู่ข้างเตียงพ่อทั้งวัน พ่อดีใจจนอาการดีขึ้นเห็นได้ชัด'; } }
      ]
    },
    {
      id: 'wedinvite', icon: '💌', cd: 90,
      w: function () { return 0.6; },
      init: function () { return { who: SK.pick(['เพื่อนสมัยมัธยม', 'ลูกพี่ลูกน้อง', 'เพื่อนร่วมงานเก่า']) }; },
      title: 'การ์ดเชิญงานแต่ง', text: function (s, x) { return x.who + 'ส่งการ์ดเชิญงานแต่งงานมา งานจัดในเมืองสุดสัปดาห์นี้'; }, def: 0,
      choices: [
        { label: 'ไปร่วมงานและใส่ซอง ฿1,000', cost: 1000, run: function (s) { G.mod('mood', 10); s.fam.bond = C(s.fam.bond + 2, 0, 100); return 'ได้เจอเพื่อนเก่าหลายคน สนุกมาก'; } },
        { label: 'ฝากซอง ฿500 ไปแทน', cost: 500, run: function () { G.mod('mood', 1); return 'ฝากซองพร้อมคำอวยพร'; } },
        { label: 'ส่งข้อความอวยพร', cost: 0, run: function () { G.mod('mood', -2); return 'ส่งสติกเกอร์อวยพรไป'; } }
      ]
    },
    {
      id: 'ticket', icon: '🚔', cd: 60,
      w: function (s) { return G.effMode() === 'car' ? 1.2 : 0; },
      init: function () { return {}; },
      title: 'ใบสั่งจราจร', text: function () { return 'กล้องจับความเร็วส่งใบสั่งมาที่บ้าน: ขับเร็วเกินกำหนดในเขตโรงเรียน ค่าปรับ ฿500'; }, def: 0,
      choices: [
        { label: 'จ่ายค่าปรับออนไลน์', cost: 500, run: function (s) { s.civic += 1; return 'จ่ายค่าปรับเรียบร้อย จะขับช้าลงในเขตชุมชน'; } },
        { label: 'เพิกเฉยไว้ก่อน', cost: 0, run: function (s) { s.credit = Math.max(0, s.credit - 4); s.civic -= 2; return 'ค่าปรับค้าง ถูกบันทึกในระบบ เครดิตลดลง'; } }
      ]
    },
    {
      id: 'repair', icon: '🔧', cd: 70,
      w: function (s) { return s.home.type === 'shelter' ? 0 : 0.8; },
      init: function () { return {}; },
      title: 'น้ำรั่วในห้อง', text: function (s) { return 'ท่อใต้ซิงก์แตก น้ำไหลนองพื้น ' + (s.home.type === 'own' ? 'บ้านของคุณเองต้องจัดการซ่อมเอง' : 'แจ้งเจ้าของได้แต่ต้องรอช่าง'); }, def: 0,
      choices: [
        { label: 'ซ่อมเองตามคลิป (ใช้ทักษะงานช่าง)', cost: 0, req: needSlot(1), run: function (s) { G.advance(1); if (s.skills.craft >= 25 || SK.chance(0.5)) { G.skill('craft', 1); return 'ซ่อมเสร็จ! ภูมิใจในฝีมือตัวเอง'; } G.pay(800, 'ซ่อมแซมบ้าน'); return 'ซ่อมไม่สำเร็จ สุดท้ายต้องเรียกช่าง เสียค่าช่าง ฿800'; } },
        { label: 'เรียกช่าง (฿800)', cost: 800, run: function (s) { return 'ช่างมาซ่อมให้ภายในชั่วโมง'; } },
        { label: 'แจ้งเจ้าของห้องให้จัดการ', cost: 0, req: function (s) { return s.home.type === 'own' ? 'เป็นบ้านของคุณเอง' : null; }, run: function (s) { G.mod('mood', -3); G.addRel('landlord', 1); return SK.nn('landlord') + 'ส่งช่างมาให้ในวันถัดมา ต้องทนน้ำซึมไปหนึ่งคืน'; } }
      ]
    },
    {
      id: 'serious', icon: '🚑', cd: 200,
      w: function (s) { return 0.35 + (s.health < 50 ? 0.5 : 0); },
      init: function (s) { var k = SK.pick(['ไส้ติ่งอักเสบ', 'กระดูกข้อมือร้าวจากการลื่นล้ม', 'ติดเชื้อทางเดินปัสสาวะรุนแรง']); return { kind: k, bill: SK.rint(9000, 16000) }; },
      title: 'เจ็บป่วยต้องรักษาในโรงพยาบาล', text: function (s, x) { return 'คุณต้องเข้ารับการรักษา' + x.kind + ' ค่ารักษาส่วนเกินสิทธิ์ประมาณ ' + money(x.bill) + (s.ins.health ? ' — แต่คุณมีประกันสุขภาพ ✔' : ''); }, def: 0,
      choices: [{ label: 'เข้ารับการรักษา', cost: 0, run: function (s, x) {
        s.sick = { days: 3, kind: x.kind }; G.mod('mood', -6);
        if (s.job) { s.today.leave = true; }
        if (s.ins.health) return 'ประกันจ่ายค่ารักษาทั้งหมด คุณจ่ายเพียง ฿0 พักฟื้น 3 วัน';
        var o = G.payOrOwe(x.bill, 'ค่ารักษาพยาบาล'); if (o > 0) G.addLoan('ค่ารักษาพยาบาลผ่อนชำระ', o, 0, 12, 'medical');
        return 'จ่ายค่ารักษา ' + money(x.bill) + (o > 0 ? ' (ส่วนที่ขาด ' + money(o) + ' ผ่อน 12 เดือน)' : '') + ' — ประกันสุขภาพช่วยเรื่องนี้ได้นะ';
      } }]
    },
    {
      id: 'accident', icon: '🤕', cd: 120,
      w: function (s) { var m = G.effMode(); return (m === 'bike' || m === 'walk') && s.weather && (s.weather.k === 'rain' || s.weather.k === 'storm') ? 0.9 : 0.15; },
      init: function () { return {}; },
      title: 'ลื่นล้มระหว่างทาง', text: function () { return 'ถนนเปียกลื่น คุณล้มลงข้อเท้าแพลง เจ็บพอสมควร'; }, def: 0,
      choices: [
        { label: 'ไปคลินิกทำแผล (฿' + 200 + ')', cost: 200, run: function (s) { G.mod('health', -3); G.mod('energy', -10); return 'หมอพันผ้าให้ เดินกะเผลกสองสามวัน'; } },
        { label: 'ปฐมพยาบาลเอง', cost: 0, run: function (s) { if (s.certs.indexOf('firstaid') >= 0) { G.mod('health', -2); return 'ใช้ความรู้ปฐมพยาบาลดูแลตัวเองได้ดี'; } G.mod('health', -7); G.mod('energy', -12); return 'ปวดบวมกว่าที่คิด…'; } }
      ]
    },
    {
      id: 'reunion', icon: '🎒', cd: 120,
      w: function () { return 0.5; },
      init: function () { return {}; },
      title: 'งานเลี้ยงรุ่น', text: function () { return 'กลุ่มไลน์เพื่อนสมัยเรียนนัดเลี้ยงรุ่นที่ร้านอาหารในเมือง หลายคนไม่ได้เจอกันเป็นสิบปี'; }, def: 1,
      choices: [
        { label: 'ไปร่วมงาน (฿600 • ใช้ 1 ช่วง)', cost: 600, req: needSlot(1), run: function (s) { G.mod('mood', 15); G.advance(1); if (SK.chance(0.35)) { s.bonusUntil = s.day + 14; return 'สนุกมาก แถมเพื่อนบอกว่าบริษัทกำลังรับคน ฝากชื่อให้ด้วย'; } return 'คุยกันจนร้านจะปิด ความทรงจำเก่าๆ กลับมาหมด'; } },
        { label: 'ไม่สะดวก ไว้คราวหน้า', cost: 0, run: function () { return 'ส่งรูปเก่ามาแชร์ในกลุ่มแทน'; } }
      ]
    },
    {
      id: 'bossbday', icon: '🎂', cd: 120,
      w: function (s) { return s.job ? 0.6 : 0; },
      init: function () { return {}; },
      title: 'วันเกิดหัวหน้า', text: function (s) { return 'ทีมนัดกันเซอร์ไพรส์วันเกิด' + (s.job && s.job.boss ? s.job.boss.name : 'หัวหน้า') + ' ช่วยกันออกค่าเค้กคนละ ฿150'; }, def: 0,
      choices: [
        { label: 'ร่วมด้วย ฿150', cost: 150, run: function (s) { if (s.job && s.job.boss) { s.job.boss.rel = C(s.job.boss.rel + 6, 0, 100); s.job.mate.rel = C(s.job.mate.rel + 3, 0, 100); } G.mod('mood', 5); return 'หัวหน้าซึ้งใจมาก บรรยากาศทีมดีขึ้น'; } },
        { label: 'ขอผ่าน', cost: 0, run: function (s) { if (s.job && s.job.mate) s.job.mate.rel = C(s.job.mate.rel - 3, 0, 100); return 'เพื่อนร่วมงานมองหน้านิดหน่อย'; } }
      ]
    }
  ];
  EV.forEach(function (e) { SK.EVENTS.push(e); SK.EV[e.id] = e; });
  G.breakUp = function () {
    var s = S(), L = s.love, id = L.id, wasMarried = L.stage === 'married';
    var r = G.relObj(id); r.v = Math.max(0, r.v - 35); r.cool = s.day + 60;
    var child = L.child;
    s.love = { stage: 'single', id: null, bond: 0, dates: 0, since: -1, lastDate: -99, cool: -99, child: child, babyDue: -1 };
    if (wasMarried) { G.pay(Math.min(15000, G.total()), 'ค่าใช้จ่ายครอบครัว'); }
    G.mod('mood', -25);
    G.news(s.name + ' กับ' + SK.NPCS[id].name + ' แยกทางกัน', 'me');
    return wasMarried ? 'จดทะเบียนหย่าด้วยดี เสียค่าใช้จ่ายราว ฿15,000 หัวใจยังต้องใช้เวลา' : 'เลิกกันด้วยดี… หัวใจยังต้องใช้เวลา';
  };

  // ======================================================================
  //  กิจวัตร: ตัวเลือก "ครอบครัว/คนรัก"
  // ======================================================================
  SK.ROUTINE_OPTS.splice(7, 0, { id: 'family', name: 'เวลาครอบครัว / คนรัก' });
  var R = SK.R, origExec = R.exec, origAuto = R.auto;
  function tryDo(loc, key) { return G.perform(loc, key).ok; }
  R.exec = function (opt) {
    var s = S();
    if (opt === 'family') {
      G.ensureLife(s);
      tryDo('home', 'callfam');
      if (s.love.child && s.love.child.bond < s.love.bond && tryDo('home', 'kid:play')) return true;
      if (s.love.stage !== 'single' && tryDo('home', 'love:time')) return true;
      if (s.love.child && tryDo('home', 'kid:play')) return true;
      return origExec('social');
    }
    return origExec(opt);
  };
  R.auto = function () {
    var s = S();
    G.ensureLife(s);
    if (s.fam.call !== s.day && s.fam.bond < 60) tryDo('home', 'callfam');
    if (s.love.stage !== 'single' && s.love.bond < 50 && s.energy > 20 && tryDo('home', 'love:time')) return true;
    if (s.love.child && s.love.child.bond < 50 && s.energy > 25 && tryDo('home', 'kid:play')) return true;
    return origAuto();
  };

  // ======================================================================
  //  เชื่อมกับการสร้างเกมใหม่ / โหลดเซฟ
  // ======================================================================
  var origNew = G.newState;
  G.newState = function (o) { var s = origNew(o); G.ensureLife(s); return s; };
  var origImport = G.importJSON;
  G.importJSON = function (raw) { var ok = origImport(raw); if (ok) G.ensureLife(SK.S); return ok; };

  // ความสำเร็จใหม่
  SK.ACHIEVEMENTS.push(
    { id: 'love', icon: '💞', name: 'มีคนข้างกาย', desc: 'เริ่มคบหากับใครสักคน', test: function (s) { return s.love && s.love.stage !== 'single'; } },
    { id: 'married', icon: '💍', name: 'คู่ชีวิต', desc: 'แต่งงาน', test: function (s) { return s.love && s.love.stage === 'married'; } },
    { id: 'parent', icon: '👶', name: 'พ่อแม่มือใหม่', desc: 'มีลูก', test: function (s) { return s.love && !!s.love.child; } },
    { id: 'filial', icon: '🏡', name: 'ลูกกตัญญู', desc: 'ความผูกพันกับพ่อแม่ถึง 90', test: function (s) { return s.fam && s.fam.bond >= 90; } },
    { id: 'retire', icon: '🏦', name: 'วางแผนเกษียณ', desc: 'กองทุนสำรองเลี้ยงชีพ 30,000 บาท', test: function (s) { return s.pension && s.pension.bal >= 30000; } },
    { id: 'teamplayer', icon: '🤝', name: 'ทีมเวิร์ก', desc: 'สนิทกับหัวหน้าถึง 80', test: function (s) { return s.job && s.job.boss && s.job.boss.rel >= 80; } }
  );
})();
