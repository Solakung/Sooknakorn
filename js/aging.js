/* สุขนคร — aging.js : อายุและวงจรประชากร
   • ทุกคนมีอายุ (ปรับความเร็วได้: 1 ปีในเกม = 1/5/10 ปีของชีวิต)
   • NPC เรียนจบ แต่งงาน มีลูก ย้ายออก เกษียณ และจากไป — บทบาทสำคัญมีผู้สืบทอด
   • คนใหม่ย้ายเข้าเมืองตามความน่าอยู่ เด็กที่เกิดในเมืองโตขึ้นเป็นชาวเมืองคนใหม่
   • ลูกของผู้เล่นโตตามช่วงวัย พอเป็นผู้ใหญ่ก็ออกไปมีชีวิตของตัวเอง
   • ผู้เล่นแก่ตัว เกษียณ รับบำนาญ และเมื่อถึงบั้นปลายเลือกเล่นต่อเป็นลูกได้ */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, B = SK.B, H = SK.H, C = SK.clamp;
  function S() { return SK.S; }
  function money(n) { return SK.money(n); }
  function A(o) {
    var d = { slots: 0, cost: 0, energy: 0, group: '', desc: '', icon: '•', check: null, run: null };
    for (var k in o) d[k] = o[k];
    return d;
  }
  function clone(o) { return JSON.parse(JSON.stringify(o)); }
  function wrap(loc, extra) { var orig = B[loc]; B[loc] = function (s) { return extra(s, orig(s)); }; }

  // ======================================================================
  //  ข้อมูลพื้นฐาน
  // ======================================================================
  var BASE_KEYS = SK.NPC_KEYS.slice();
  var BASE = {};
  BASE_KEYS.forEach(function (id) { BASE[id] = clone(SK.NPCS[id]); });
  var BASE_AGE = { landlord: 68, auntie: 62, doctor: 45, librarian: 50, mayor: 56, cafe: 42, rider: 33, reporter: 29, police: 47, student: 20, farmer: 71, coach: 31, banker: 36, monk: 39, phai: 27, fern: 29, pluem: 28 };
  var PATH_AGE = { grad: 23, newcomer: 27, artisan: 30, caregiver: 35, founder: 29 };
  var PERK_TEXT = {};
  BASE_KEYS.forEach(function (id) { PERK_TEXT[BASE[id].perk.id] = BASE[id].perk.text; });
  PERK_TEXT.kidSupport = 'ส่งเงินช่วยพ่อแม่เดือนละ ฿2,000';

  var NICK = ['บัว', 'ข้าวปั้น', 'มะปราง', 'ภูมิ', 'ต้นกล้า', 'น้ำฝน', 'แก้ม', 'ปาล์ม', 'ฟิวส์', 'ใบตอง', 'ขิม', 'ซัน', 'มิ้นท์', 'กาย', 'อิง', 'ปั้น', 'ฝ้าย', 'ตะวัน', 'พลอย', 'นนท์', 'หมอก', 'จิน', 'เพลง', 'ดาว', 'โอ๊ค', 'เมฆ', 'ธาร', 'ไอซ์', 'กิ่ง', 'ชบา', 'ภู', 'วาริน', 'ก้อย', 'เต้ย', 'แป้ง', 'นิว', 'เอย', 'ต่อ', 'ข้าวกล้อง', 'น้ำใส'];
  var BABY = ['ข้าวหอม', 'ภูผา', 'ใบข้าว', 'ทะเล', 'มะลิ', 'ดิน', 'ฟ้าใส', 'ต้นข้าว', 'น้ำหวาน', 'ขุนเขา', 'ส้มโอ', 'ลมหนาว'];
  var ICON_ADULT = ['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦱', '👨‍🦱', '🧔', '👱', '👩‍🦰', '🧑‍🦰'];
  var ICON_OLD = ['👴', '👵', '🧓'];

  // แม่แบบชาวเมืองที่ย้ายเข้ามาใหม่
  var ARCH = {
    office: { role: 'พนักงานบริษัทที่ย้ายมาทำงาน', sched: { wd: ['cafe', 'market', 'gym'], we: ['park', 'mall', 'cafe'] }, gift: 'ขนมนำเข้า', perk: 'cafeReferral', track: 'office',
      lines: ['เพิ่งย้ายมาเดือนก่อน เมืองนี้เดินทางสะดวกกว่าที่เคยอยู่เยอะ', 'ทำงานออฟฟิศก็เหนื่อยนะ แต่ที่นี่มีสวนให้พักใจ', 'แนะนำร้านอร่อยแถวนี้หน่อยสิ', 'วันหยุดชอบมาเดินห้างดูของ'] },
    teacher: { role: 'ครูโรงเรียนเทศบาล', sched: { wd: ['school', 'school', 'library'], we: ['library', 'park', 'temple'] }, gift: 'ปากกาสวยๆ', perk: 'bookworm', track: 'teacher',
      lines: ['เด็กๆ ที่นี่ใฝ่รู้มากเลย', 'ตรวจการบ้านจนดึกทุกคืน แต่ก็มีความสุข', 'ห้องสมุดเมืองนี้ดีที่สุดเท่าที่เคยเห็น', 'อยากให้ทุกคนได้เรียนฟรีจนจบ'] },
    nurse: { role: 'พยาบาลจบใหม่', icon: '🧑‍⚕️', sched: { wd: ['hospital', 'hospital', 'cafe'], we: ['hospital', 'park', 'market'] }, gift: 'ชาสมุนไพร', perk: 'doctorFriend', track: 'nurse',
      lines: ['เวรดึกเมื่อคืนวุ่นมาก แต่ทุกคนปลอดภัย', 'ดื่มน้ำเยอะๆ นะ อากาศร้อน', 'ที่นี่มีศูนย์สุขภาพใกล้บ้าน ดีจริงๆ', 'อยากเรียนต่อเฉพาะทางสักวัน'] },
    coder: { role: 'โปรแกรมเมอร์ทำงานทางไกล', icon: '🧑‍💻', sched: { wd: ['cafe', 'library', 'cafe'], we: ['cafe', 'park', 'culture'] }, gift: 'สติกเกอร์โน้ตบุ๊ก', perk: 'studyBuddy', track: 'dev',
      lines: ['Wi-Fi สาธารณะที่นี่แรงมาก ทำงานได้ทุกที่', 'กำลังทำแอปให้ร้านค้าชุมชนอยู่', 'อยากลองเขียนโค้ดไหม เดี๋ยวสอนให้', 'กาแฟแก้วที่สามของวันแล้ว…'] },
    artist: { role: 'ศิลปินเปิดสตูดิโอเล็กๆ', icon: '🧑‍🎨', sched: { wd: ['culture', 'culture', 'cafe'], we: ['culture', 'park', 'market'] }, gift: 'สีน้ำ', perk: 'muse',
      lines: ['แสงที่ริมน้ำตอนเย็นสวยจนอยากวาดทุกวัน', 'เดือนหน้าจะจัดนิทรรศการเล็กๆ มาดูนะ', 'ศิลปะทำให้เมืองมีหัวใจ', 'ลองวาดอะไรเล่นๆ ด้วยกันไหม'] },
    baker: { role: 'เจ้าของร้านขนมเปิดใหม่', icon: '🧁', sched: { wd: ['market', 'market', 'cafe'], we: ['market', 'market', 'culture'] }, gift: 'แป้งอย่างดี', perk: 'groceryDiscount', track: 'cafe',
      lines: ['ขนมปังเพิ่งออกจากเตา หอมไหม', 'เปิดร้านเองเหนื่อยแต่สนุก', 'ลูกค้าประจำคือกำลังใจ', 'ตลาดนี้มีวัตถุดิบดีมาก'] },
    mechanic: { role: 'ช่างซ่อมรถประจำย่าน', icon: '🧑‍🔧', sched: { wd: ['station', 'station', 'market'], we: ['station', 'gym', 'park'] }, gift: 'น้ำมันหล่อลื่น', perk: 'riderTips', track: 'tech',
      lines: ['รถมีเสียงแปลกๆ แวะมาให้ดูได้นะ', 'จักรยานต้องเติมลมยางทุกสัปดาห์', 'ทำงานช่างต้องใจเย็น', 'เมืองนี้รถติดน้อยลงเยอะตั้งแต่มีเลนจักรยาน'] },
    elder: { role: 'ผู้สูงวัยย้ายมาอยู่กับลูกหลาน', old: true, sched: { wd: ['temple', 'park', 'home'], we: ['temple', 'market', 'park'] }, gift: 'ดอกมะลิ', perk: 'calm',
      lines: ['สมัยก่อนเมืองนี้ยังเป็นทุ่งนาอยู่เลย', 'ออกกำลังกายเบาๆ ทุกเช้า อายุยืน', 'ลูกหลานพามาอยู่ด้วย เหงาน้อยลงเยอะ', 'ใจเย็นๆ ทุกอย่างมีทางออก'] },
    athlete: { role: 'นักกีฬาเยาวชนทีมเมือง', icon: '🏃', sched: { wd: ['gym', 'park', 'gym'], we: ['park', 'gym', 'culture'] }, gift: 'เครื่องดื่มเกลือแร่', perk: 'trainer',
      lines: ['ซ้อมหนักเพื่อแข่งระดับจังหวัด', 'วิ่งด้วยกันไหม เดี๋ยวคุมจังหวะให้', 'พักผ่อนก็สำคัญพอๆ กับซ้อม', 'อยากติดทีมชาติสักวัน'] },
    green: { role: 'อาสาสมัครสิ่งแวดล้อม', icon: '🌱', sched: { wd: ['park', 'park', 'library'], we: ['park', 'market', 'park'] }, gift: 'เมล็ดพันธุ์', perk: 'greenTips', track: 'farm',
      lines: ['วันนี้เก็บขยะริมน้ำได้สองถุงใหญ่', 'ปิดไฟตอนออกจากห้องด้วยนะ', 'ต้นไม้ที่ปลูกเดือนก่อนแตกใบแล้ว', 'เมืองเขียวได้ เพราะทุกคนช่วยกัน'] },
    clerk: { role: 'เจ้าหน้าที่เทศบาลคนใหม่', icon: '🧑‍💼', sched: { wd: ['townhall', 'townhall', 'cafe'], we: ['park', 'culture', 'market'] }, gift: 'สมุดบันทึก', perk: 'mayorEar', track: 'civil',
      lines: ['เอกสารเดี๋ยวนี้ยื่นออนไลน์ได้หมดแล้ว', 'อยากให้ทุกคนมาร่วมประชาคมเยอะๆ', 'งานราชการไม่ได้น่าเบื่ออย่างที่คิดนะ', 'มีข้อเสนออะไรบอกได้ เดี๋ยวช่วยส่งเรื่อง'] }
  };
  var ARCH_KEYS = Object.keys(ARCH);

  // บทพูดของผู้สืบทอดบทบาทหลัก
  var SUCC = {
    landlord: { rel: 'ลูก', lines: ['พ่อฝากให้ดูแลหอนี้ต่อ จะตั้งใจทำให้ดีที่สุด', 'ซ่อมหลังคาเสร็จแล้วนะ ฝนตกไม่รั่วแล้ว', 'ค่าเช่ายังเท่าเดิมนะ ไม่ต้องห่วง', 'มีอะไรเสียบอกได้เลย'] },
    auntie: { rel: 'ลูก', lines: ['สูตรแกงของแม่ ยังทำเหมือนเดิมทุกอย่าง', 'ผักวันนี้สดมาก เพิ่งมาจากสวน', 'ลูกค้าเก่าของแม่ยังแวะมาทุกวันเลย', 'ซื้อเยอะแถมให้นะ'] },
    farmer: { rel: 'หลาน', lines: ['ตาสอนให้ปลูกผักตั้งแต่ยังเด็ก', 'แปลงผักดาดฟ้าขยายเพิ่มอีกสองตึกแล้ว', 'ดินดีน้ำดี ผักก็ดี', 'มาช่วยเก็บผักกันไหม'] },
    cafe: { rel: 'ลูก', lines: ['ร้านนี้แม่สร้างมากับมือ จะรักษาไว้ให้ดี', 'ลองเมนูใหม่หน่อยไหม', 'ลูกค้าประจำคือครอบครัวของร้าน', 'วันนี้ชงให้พิเศษเลย'] }
  };
  // คำนำหน้าชื่อตามบทบาท และเหตุผลการลาที่เหมาะกับบทบาท
  var ROLE_PREFIX = { monk: 'หลวงพี่', doctor: 'หมอ', librarian: 'ครู', police: 'สารวัตร', coach: 'โค้ช', mayor: 'คุณ' };
  var ROLE_WHY = { monk: 'ย้ายไปจำพรรษาที่วัดต่างจังหวัด' };
  var SUCC_GENERIC = ['เพิ่งรับตำแหน่งต่อ ยังต้องเรียนรู้อีกเยอะ', 'คนเก่าฝากฝังทุกคนในย่านนี้ไว้กับเรา', 'มีอะไรให้ช่วยบอกได้เลยนะ', 'ที่นี่คนใจดีกันทุกคน อยู่แล้วสบายใจ'];

  // ======================================================================
  //  สถานะ + ซิงก์รายชื่อ NPC
  // ======================================================================
  G.ensureAging = function (s) {
    s = s || S();
    if (s.age == null) s.age = PATH_AGE[s.path] || 27;
    if (!s.ageRate) s.ageRate = 5;
    if (!s.pop2) {
      s.pop2 = { age: {}, gen: {}, gone: {}, mod: {}, married: {}, babies: [], kids: [], next: 1 };
      BASE_KEYS.forEach(function (id) { s.pop2.age[id] = BASE_AGE[id] || 35; });
    }
    if (s.love && s.love.child && s.love.child.ageAt0 == null) s.love.child.ageAt0 = 0;
    return s;
  };
  G.syncNPCs = function (s) {
    s = s || S();
    var P = s.pop2;
    Object.keys(SK.NPCS).forEach(function (id) { if (!BASE[id]) delete SK.NPCS[id]; });
    BASE_KEYS.forEach(function (id) {
      var d = clone(BASE[id]);
      if (P.mod[id]) for (var k in P.mod[id]) d[k] = P.mod[id][k];
      SK.NPCS[id] = d;
    });
    for (var gid in P.gen) SK.NPCS[gid] = P.gen[gid];
    SK.NPC_KEYS.length = 0;
    Object.keys(SK.NPCS).forEach(function (id) { if (!P.gone[id]) SK.NPC_KEYS.push(id); });
  };
  G.npcAge = function (id) { var s = S(); return s.pop2 && s.pop2.age[id] != null ? s.pop2.age[id] : 35; };
  G.aliveNPCs = function () { return SK.NPC_KEYS.slice(); };

  function usedNames() { var u = {}; Object.keys(SK.NPCS).forEach(function (id) { u[SK.NPCS[id].name] = 1; }); return u; }
  G.genName = function (age) {
    var u = usedNames(), base, nm, tries = 0;
    do {
      base = SK.pick(NICK);
      nm = age < 20 ? 'น้อง' + base : age < 35 ? base : age < 55 ? 'พี่' + base : SK.pick(['ลุง', 'ป้า', 'ตา', 'ยาย']) + base;
    } while (u[nm] && tries++ < 40);
    return nm;
  };
  function ageIcon(age, arch) {
    if (age < 18) return SK.pick(['🧒', '👦', '👧']);
    if (age >= 58 || (arch && arch.old)) return SK.pick(ICON_OLD);
    return (arch && arch.icon && SK.chance(0.5)) ? arch.icon : SK.pick(ICON_ADULT);
  }
  function genStory(nm, perkId, extra) {
    return [
      { text: nm + 'เล่าเรื่องชีวิตก่อนมาอยู่สุขนครให้ฟัง คุณรู้สึกสนิทใจขึ้นมาก', reward: { mood: 6 } },
      { text: nm + 'บอกว่า "มีอะไรให้ช่วยบอกได้เลยนะ" (' + (PERK_TEXT[perkId] || 'มีน้ำใจให้กันเสมอ') + ')', reward: { perk: perkId } },
      { text: extra || nm + 'ชวนไปกินข้าวกับกลุ่มเพื่อน ได้รู้จักคนใหม่ๆ อีกเพียบ', reward: { mood: 12, civic: 3 } }
    ];
  }

  // สร้างชาวเมืองใหม่
  G.genNPC = function (o) {
    var s = S(), P = s.pop2;
    o = o || {};
    var key = o.arch || SK.pick(ARCH_KEYS), Ar = ARCH[key];
    var age = o.age != null ? o.age : (Ar.old ? SK.rint(62, 78) : SK.rint(22, 46));
    var nm = o.name || G.genName(age);
    var id = 'g' + (P.next++);
    var dateable = o.dateable != null ? o.dateable : (age >= 22 && age <= 40 && !Ar.old && SK.chance(0.5));
    var def = {
      name: nm, icon: o.icon || ageIcon(age, Ar), role: o.role || Ar.role, sched: clone(o.sched || Ar.sched), gift: Ar.gift,
      perk: { id: o.perk || Ar.perk, at: 50, text: PERK_TEXT[o.perk || Ar.perk] }, lines: Ar.lines.slice(), story: genStory(nm, o.perk || Ar.perk, o.story3),
      dateable: dateable, gen: true, arch: key, since: s.day
    };
    if (o.extra) for (var k in o.extra) def[k] = o.extra[k];
    P.gen[id] = def; P.age[id] = age;
    SK.NPCS[id] = def; SK.NPC_KEYS.push(id);
    return id;
  };

  // ตรวจสิทธิพิเศษใหม่ (เมื่อมีคนย้ายออก สิทธิ์ที่ได้จากเขาจะหายไป)
  G.recalcPerks = function () {
    var s = S(), keep = {};
    SK.NPC_KEYS.forEach(function (id) {
      var n = SK.NPCS[id], r = s.rel[id];
      if (n.perk && r && r.v >= n.perk.at) keep[n.perk.id] = true;
    });
    Object.keys(s.perks).forEach(function (p) { if (!keep[p]) delete s.perks[p]; });
  };

  // ======================================================================
  //  วงจรชีวิตของ NPC
  // ======================================================================
  function farewellMood(id, passed) {
    var s = S(), r = s.rel[id];
    if (r && r.v >= 50) { G.mod('mood', passed ? -12 : -5); return true; }
    return false;
  }
  G.npcLeave = function (id, why) {
    var s = S(), P = s.pop2, n = SK.NPCS[id], age = Math.floor(G.npcAge(id));
    var passed = why === 'passed';
    if (ROLE_WHY[id] && !passed) why = 'custom';
    var txt = why === 'custom' ? n.name + ' ' + ROLE_WHY[id] : passed ? n.name + ' (' + age + ' ปี) จากไปอย่างสงบ ท่ามกลางลูกหลานและเพื่อนบ้าน' :
      why === 'retire' ? n.name + ' เกษียณและย้ายไปอยู่กับลูกหลานต่างจังหวัด' :
      n.name + ' ย้ายออกจากสุขนครไปเริ่มชีวิตใหม่ที่เมืองอื่น';
    var close = farewellMood(id, passed);
    if (BASE[id] && !BASE[id].dateable) {
      // บทบาทหลักของเมือง → มีผู้สืบทอด
      var sc = SUCC[id], nage = id === 'mayor' ? SK.rint(44, 58) : SK.rint(28, 46);
      var nm = ROLE_PREFIX[id] ? ROLE_PREFIX[id] + SK.pick(NICK) : G.genName(nage), role = (BASE[id].role);
      var mod = {
        name: nm, icon: ageIcon(nage, null), role: role + (sc ? ' (รุ่น' + sc.rel + ')' : ''), lines: (sc ? sc.lines : SUCC_GENERIC).slice(),
        story: genStory(nm, BASE[id].perk.id, nm + 'ชวนไปร่วมงานรำลึกถึง' + n.name + ' ทั้งชุมชนมาพร้อมหน้า อบอุ่นมาก'), successorOf: n.name
      };
      if (id === 'student') { mod.role = 'นักศึกษาจิตอาสา'; nage = SK.rint(18, 20); mod.name = G.genName(nage); mod.icon = '🧑‍🎓'; mod.story = genStory(mod.name, BASE[id].perk.id); }
      P.mod[id] = mod; P.age[id] = nage;
      delete s.rel[id];
      G.syncNPCs(s);
      G.news(txt + ' — ' + mod.name + (sc ? ' ' + sc.rel + 'ของ' + n.name : '') + ' รับหน้าที่' + BASE[id].role + 'ต่อ', 'city');
      G.log((passed ? '🕯️ ' : '👋 ') + txt + (close ? ' คุณใจหายมาก' : '') + ' • ' + mod.name + 'มารับช่วงต่อ', close ? 'bad' : 'n');
    } else {
      P.gone[id] = { name: n.name, why: why, day: s.day };
      G.syncNPCs(s);
      G.news(txt, 'city');
      G.log((passed ? '🕯️ ' : '👋 ') + txt + (close ? ' คุณคิดถึงเขามาก' : ''), close ? 'bad' : 'n');
    }
    G.recalcPerks();
  };

  G.npcGraduate = function (id) {
    var s = S(), P = s.pop2, n = SK.NPCS[id];
    var key = SK.pick(['teacher', 'nurse', 'coder', 'clerk', 'green', 'office']), Ar = ARCH[key];
    var role = Ar.role.replace('ที่ย้ายมาทำงาน', '').replace('จบใหม่', '').replace('คนใหม่', '') + ' (เพิ่งเรียนจบ)';
    if (BASE[id]) { P.mod[id] = P.mod[id] || {}; P.mod[id].role = role; P.mod[id].sched = clone(Ar.sched); P.mod[id].grad = true; G.syncNPCs(s); }
    else { n.role = role; n.sched = clone(Ar.sched); n.grad = true; n.arch = key; }
    G.news(n.name + ' เรียนจบแล้ว เริ่มทำงานเป็น' + role.replace(' (เพิ่งเรียนจบ)', ''), 'city');
    if (G.rel(id) >= 30) { G.log('🎓 ' + n.name + 'เรียนจบแล้ว! ชวนคุณไปถ่ายรูปรับปริญญา', 'good'); G.mod('mood', 4); }
  };

  function yearlyToMonth(py, f) { return 1 - Math.pow(1 - C(py, 0, 0.999), f); }

  G.popMonthly = function (items) {
    var s = S(), P = s.pop2, f = s.ageRate / 12, partner = s.love && s.love.id;
    // 1) แต่ละคน
    G.aliveNPCs().forEach(function (id) {
      if (P.gone[id]) return;
      var n = SK.NPCS[id], a = G.npcAge(id);
      if (!n) return;
      if (/นักศึกษา|นักเรียน/.test(n.role) && a >= 22 && !n.grad) { G.npcGraduate(id); return; }
      if (id === partner) return;
      var py;
      if (n.kid && a < 68) py = 0; else if (a >= 90) py = 0.5; else if (a >= 68) py = 0.035 * (a - 65); else py = (n.gen || n.dateable) ? 0.025 : (n.kid ? 0.01 : 0.006);
      if (SK.chance(yearlyToMonth(py, f))) {
        var why = a >= 72 && SK.chance(0.6) ? 'passed' : a >= 60 ? 'retire' : 'move';
        G.npcLeave(id, why);
        return;
      }
      if (a >= 24 && a <= 42 && !P.married[id] && SK.chance(yearlyToMonth(0.07, f))) {
        P.married[id] = s.day;
        G.news(n.name + ' แต่งงานแล้ว 💐 ชาวเมืองร่วมยินดี', 'city');
        if (G.rel(id) >= 30) { G.log('💌 ' + n.name + 'ส่งการ์ดแต่งงานมาให้คุณ', 'good'); G.mod('mood', 3); }
        if (n.dateable && id !== partner) { n.dateable = false; if (P.gen[id]) P.gen[id].dateable = false; else { P.mod[id] = P.mod[id] || {}; P.mod[id].dateable = false; } }
      } else if (P.married[id] && a >= 24 && a <= 43 && SK.chance(yearlyToMonth(0.08, f)) && P.babies.length < 6) {
        var bn = 'น้อง' + SK.pick(BABY);
        P.babies.push({ name: bn, parent: id, pname: n.name, born: s.day });
        G.news('ยินดีกับครอบครัว' + n.name + ' ต้อนรับ' + bn + ' 👶', 'city');
        if (G.rel(id) >= 30) G.log('👶 ' + n.name + 'มีลูกแล้ว ชื่อ' + bn, 'good');
      }
    });
    // 2) เด็กที่เกิดในเมืองโตเป็นผู้ใหญ่
    P.babies = P.babies.filter(function (b) {
      var age = (s.day - b.born) / 365 * s.ageRate;
      if (age < 18) return true;
      var nm = b.name.replace(/^น้อง/, '');
      if (usedNames()[nm]) nm = G.genName(19);
      var key = SK.pick(['coder', 'athlete', 'green', 'artist', 'office', 'nurse']);
      var id = G.genNPC({ arch: key, age: 18 + (age - 18), name: nm, extra: { parentName: b.pname } });
      SK.NPCS[id].role = 'นักศึกษา (ลูกของ' + b.pname + ')';
      SK.NPCS[id].sched = { wd: ['school', 'library', 'park'], we: ['park', 'culture', 'cafe'] };
      SK.NPCS[id].icon = '🧑‍🎓';
      G.news(nm + ' ลูกของ' + b.pname + ' โตเป็นผู้ใหญ่แล้ว เริ่มเรียนที่วิทยาลัยชุมชน', 'city');
      return false;
    });
    // 3) คนย้ายเข้าเมือง (ยิ่งเมืองน่าอยู่ ยิ่งมีคนมา)
    var count = G.aliveNPCs().length, target = 20;
    var pm = C((0.08 + (count < target ? 0.32 : 0) + (G.cityScore() - 70) / 150) * Math.max(1, f), 0, 0.9);
    var arrivals = count < target - 4 ? 2 : 1;
    for (var i = 0; i < arrivals; i++) {
      if (!SK.chance(pm) || G.aliveNPCs().length >= 26) continue;
      var singles = G.aliveNPCs().filter(function (id) { var a = G.npcAge(id); return SK.NPCS[id].dateable && id !== partner && a >= 21 && a <= 45; }).length;
      var opts = singles < 2 ? { dateable: true, age: SK.rint(23, 36), arch: SK.pick(['office', 'teacher', 'nurse', 'coder', 'artist', 'baker', 'mechanic', 'green']) } : {};
      var nid = G.genNPC(opts), nn = SK.NPCS[nid];
      G.news('ชาวเมืองใหม่: ' + nn.icon + ' ' + nn.name + ' (' + nn.role + ') ย้ายเข้ามาอยู่สุขนคร', 'city');
      G.log('🧳 มีเพื่อนบ้านใหม่ย้ายเข้ามา: ' + nn.icon + ' ' + nn.name + ' — ' + nn.role + (nn.dateable ? ' (โสด)' : ''), 'n');
    }
  };

  // ======================================================================
  //  ลูกของผู้เล่นตามช่วงวัย
  // ======================================================================
  var STAGES = [[0, 'วัยทารก'], [3, 'วัยอนุบาล'], [6, 'วัยประถม'], [12, 'วัยรุ่น (มัธยม)'], [18, 'ผู้ใหญ่']];
  G.childAge = function (s) { s = s || S(); var c = s.love && s.love.child; return c ? (s.day - c.born) / 365 * s.ageRate : 0; };
  G.childStage = function (s) { var a = G.childAge(s), st = STAGES[0]; STAGES.forEach(function (x) { if (a >= x[0]) st = x; }); return st[1]; };
  G.childCost = function () {
    var s = S(), a = G.childAge(s);
    if (a < 3) return 4500 + (s.job ? 2500 : 0);
    if (a < 6) return 3000 + 1500;
    if (a < 12) return 3500;
    return 5000;
  };
  var KID_ACT = {
    'วัยทารก': ['อุ้ม เล่น และกล่อมลูกนอน', ['ลูกยิ้มให้เป็นครั้งแรก', 'กล่อมจนลูกหลับปุ๋ยบนอก', 'ลูกจับนิ้วไว้แน่นไม่ยอมปล่อย']],
    'วัยอนุบาล': ['เล่นกับลูก / อ่านนิทานก่อนนอน', ['อ่านนิทานจนลูกหลับ', 'ลูกเล่าเรื่องเพื่อนที่โรงเรียนอนุบาลไม่หยุด', 'ต่อตัวต่อเป็นปราสาทใหญ่ด้วยกัน']],
    'วัยประถม': ['สอนการบ้าน / พาลูกไปเที่ยวสวน', ['สอนเลขจนลูกทำเองได้', 'ปั่นจักรยานเล่นริมน้ำกับลูก', 'ลูกเอาเหรียญรางวัลจากโรงเรียนมาอวด']],
    'วัยรุ่น (มัธยม)': ['คุยเปิดใจกับลูกวัยรุ่น / ไปส่งเรียน', ['ลูกปรึกษาเรื่องเพื่อนและความฝัน', 'ไปดูลูกแข่งกีฬาโรงเรียน', 'ลูกชวนวางแผนเลือกคณะเรียนต่อ']]
  };
  wrap('home', function (s, list) {
    list.forEach(function (a) {
      if (a.key !== 'kid:play') return;
      var st = G.childStage(s), k = KID_ACT[st] || KID_ACT['วัยประถม'], orun = a.run;
      a.name = k[0] + ' (' + st + ' • ' + Math.floor(G.childAge(s)) + ' ขวบ)';
      a.run = function (s2) { orun(s2); return SK.pick(k[1]); };
    });
    return list;
  });
  G.childMilestone = function () {
    var s = S(), c = s.love && s.love.child;
    if (!c) return;
    var st = G.childStage(s);
    if (st === 'ผู้ใหญ่') { G.childGrown(); return; }
    if (c.stage !== st) {
      var first = c.stage == null; c.stage = st;
      if (first) return;
      var msg = { 'วัยอนุบาล': 'เข้าโรงเรียนอนุบาลวันแรก ร้องไห้นิดหน่อยแต่ก็เข้มแข็ง', 'วัยประถม': 'เข้าเรียน ป.1 แล้ว แบกกระเป๋าใบใหญ่กว่าตัว', 'วัยรุ่น (มัธยม)': 'ขึ้นมัธยมแล้ว เริ่มมีโลกของตัวเอง' }[st];
      if (msg) { G.log('🎒 ' + c.name + msg, 'good'); G.news(c.name + ' ลูกของ' + s.name + ' ' + msg, 'me'); G.mod('mood', 6); }
    }
  };
  G.childGrown = function () {
    var s = S(), c = s.love.child, nm = c.name.replace(/^น้อง/, '');
    if (usedNames()[nm]) nm = nm + ' ' + s.name;
    var key = G.kidArch ? G.kidArch(c) : SK.pick(['office', 'teacher', 'nurse', 'coder', 'green', 'clerk']);
    var id = G.genNPC({ arch: key, age: 18.5, name: nm, perk: 'kidSupport', dateable: false, icon: SK.pick(ICON_ADULT),
      story3: nm + 'กอดคุณแน่นแล้วบอกว่า "ขอบคุณที่เลี้ยงหนูมาอย่างดีที่สุด"', extra: { kid: true, parentName: s.name } });
    var n = SK.NPCS[id];
    n.role = 'ลูกของคุณ — ' + ARCH[key].role.replace('ที่ย้ายมาทำงาน', '').replace('คนใหม่', '');
    n.sched = { wd: ARCH[key].sched.wd.slice(), we: ['home', ARCH[key].sched.we[1], 'home'] };
    n.lines = ['คิดถึงข้าวฝีมือที่บ้านจัง', 'งานแรกเหนื่อยแต่สนุกมาก', 'วันหยุดจะกลับมากินข้าวด้วยนะ', 'ดูแลสุขภาพด้วยนะ อย่าทำงานหนักเกิน'];
    s.rel[id] = { v: C(c.bond, 20, 100), last: -99, gift: -99, meal: -99, story: c.bond >= 75 ? 3 : c.bond >= 50 ? 2 : c.bond >= 25 ? 1 : 0 };
    if (c.bond >= 50) s.perks.kidSupport = true;
    s.pop2.kids.push(id);
    s.love.child = null;
    G.mod('mood', 10);
    G.log('🎓 ' + nm + 'โตเป็นผู้ใหญ่แล้ว! ย้ายออกไปทำงานและใช้ชีวิตของตัวเอง แต่จะกลับมาเยี่ยมบ้านทุกวันหยุด', 'good');
    G.news(nm + ' ลูกของ' + s.name + ' โตเป็นผู้ใหญ่ เริ่มต้นชีวิตการทำงาน', 'me');
  };

  // ======================================================================
  //  ผู้เล่นแก่ตัว เกษียณ บำนาญ
  // ======================================================================
  G.healthCap = function (s) { var a = s.age || 30; return C(100 - Math.max(0, a - 50) * 0.9 + Math.max(0, s.fitness - 50) * 0.15, 35, 100); };
  var origMod = G.mod;
  G.mod = function (k, d) {
    origMod(k, d);
    var s = S();
    if (k === 'health' && d > 0 && s && s.age > 50) { var cap = G.healthCap(s); if (s.health > cap) s.health = Math.max(cap, s.health - d); }
  };
  G.lifeStageOf = function (a) { return a < 25 ? 'วัยเริ่มต้น' : a < 40 ? 'วัยสร้างตัว' : a < 60 ? 'วัยกลางคน' : a < 75 ? 'วัยเกษียณ' : 'วัยชรา'; };
  var origSleep = G.sleepQuality;
  G.sleepQuality = function () { var s = S(); return origSleep() - Math.max(0, ((s.age || 30) - 55) * 0.35); };
  var origHireChance = G.hireChance;
  G.hireChance = function (t, l) { var s = S(); return C(origHireChance(t, l) - Math.max(0, ((s.age || 30) - 50) * 0.012), 0.15, 0.95); };

  var origNight = G.lifeNight;
  G.lifeNight = function () {
    origNight();
    var s = S();
    G.ensureAging(s);
    var d = s.ageRate / 365;
    s.age += d;
    Object.keys(s.pop2.age).forEach(function (id) { s.pop2.age[id] += d; });
    if (s.age > 45) G.mod('health', -(s.age - 45) * 0.025);
    var cap = G.healthCap(s);
    if (s.health > cap) s.health = Math.max(cap, s.health - 1.5);
    if (s.age > 40) G.mod('fitness', -(s.age - 40) * 0.003);
  };
  var origMonthly = G.lifeMonthly;
  G.lifeMonthly = function (items) {
    var s = S();
    G.ensureAging(s);
    origMonthly(items);
    if (s.retired) {
      var pen = C(Math.round(s.ssWeeks * 14), 1500, 7500);
      G.earn(pen, 'บำนาญประกันสังคม');
    }
    if (s.age >= 60) G.earn(s.age >= 90 ? 1000 : s.age >= 80 ? 800 : s.age >= 70 ? 700 : 600, 'เบี้ยยังชีพผู้สูงอายุ');
    s.pop2.kids.forEach(function (id) {
      if (s.pop2.gone[id]) return;
      if (G.rel(id) >= 50) G.earn(2000, 'ลูกส่งเงินมาให้');
    });
    G.childMilestone();
    G.popMonthly(items);
  };

  wrap('jobs', function (s, list) {
    list.push(A({
      key: 'retire', group: 'เกษียณอายุ', icon: '🌅', name: 'เกษียณอายุจากงานประจำ', desc: 'อายุ 55 ปีขึ้นไป • รับบำนาญประกันสังคมทุกเดือน และถอนกองทุนสำรองเลี้ยงชีพได้', slots: 0,
      confirm: 'เกษียณจากงานประจำ? (ยังทำงานเสริมและกิจการได้ตามปกติ)',
      check: function (s) { return (s.age || 0) < 55 ? 'อายุยังไม่ถึง 55 ปี (ตอนนี้ ' + Math.floor(s.age) + ')' : s.retired ? 'เกษียณแล้ว' : null; },
      run: function (s) {
        s.retired = true; s.job = null; s.stats.workStreak = 0; G.mod('mood', 15);
        G.news(s.name + ' เกษียณอายุหลังทำงานมาหลายสิบปี 🌅', 'me');
        return '🌅 เกษียณแล้ว! จากนี้รับบำนาญเดือนละ ' + money(C(Math.round(s.ssWeeks * 14), 1500, 7500)) + ' ถอนกองทุนสำรองเลี้ยงชีพได้ที่ธนาคาร';
      }
    }));
    return list;
  });

  // ======================================================================
  //  บั้นปลายชีวิตและการส่งต่อรุ่น
  // ======================================================================
  G.grownKids = function () { var s = S(); return (s.pop2 ? s.pop2.kids : []).filter(function (id) { return !s.pop2.gone[id] && SK.NPCS[id]; }); };
  var origNewDay = G.lifeNewDay;
  G.lifeNewDay = function (ni) {
    origNewDay(ni);
    var s = S();
    if (s.pendingEvent || s.ended || (s.age || 0) < 76) return;
    var py = (s.age >= 98) ? 1 : 0.02 * (s.age - 74) * (1.6 - s.health / 100);
    if (SK.chance(1 - Math.pow(1 - C(py, 0, 0.999), s.ageRate / 365))) G.startEvent('farewell');
  };
  var FAREWELL = {
    id: 'farewell', icon: '🌅', special: true,
    init: function (s) { return { age: Math.floor(s.age) }; },
    title: 'บทสุดท้ายของเรื่องราว',
    text: function (s, x) {
      var kids = G.grownKids();
      return 'เช้าวันหนึ่งที่อากาศสดใส ' + s.name + ' ในวัย ' + x.age + ' ปี หลับไปอย่างสงบที่บ้าน ท่ามกลางคนที่รัก ชีวิตในสุขนครที่ผ่านมาเต็มไปด้วยความทรงจำ' +
        (kids.length ? ' เรื่องราวของครอบครัวยังไม่จบ — ลูกพร้อมจะเดินต่อในเมืองที่คุณช่วยกันสร้าง' : '');
    },
    choices: []
  };
  SK.EVENTS.push(FAREWELL); SK.EV.farewell = FAREWELL;
  var origView = G.eventView;
  G.eventView = function () {
    var s = S();
    if (s.pendingEvent && s.pendingEvent.id === 'farewell') {
      var kids = G.grownKids().slice(0, 3);
      FAREWELL.choices = kids.map(function (id) {
        return { label: 'เล่นต่อเป็น ' + SK.NPCS[id].icon + ' ' + SK.NPCS[id].name + ' (อายุ ' + Math.floor(G.npcAge(id)) + ')', cost: 0, run: function () { return G.inherit(id); } };
      }).concat([{ label: 'ปิดฉากเรื่องราว ดูสรุปชีวิต', cost: 0, run: function (s2) { s2.ended = true; G.save(); return 'เรื่องราวของ' + s2.name + 'จบลงอย่างงดงาม'; } }]);
    }
    return origView();
  };
  var origResolve = G.resolveEvent;
  G.resolveEvent = function (i) {
    var s = S();
    if (s.pendingEvent && s.pendingEvent.id === 'farewell') G.eventView();
    return origResolve(i);
  };

  G.inherit = function (kidId) {
    var old = S(), def = SK.NPCS[kidId], age = G.npcAge(kidId);
    var liquid = old.cash + old.bank + G.fundValue() + (old.pension ? old.pension.bal : 0);
    var nonHomeDebt = 0; old.loans.forEach(function (l) { if (l.type !== 'home') nonHomeDebt += l.principal; });
    var inherit = Math.max(0, Math.round((liquid - nonHomeDebt) * 0.85));
    var ns = G.newState({ name: def.name, avatar: def.icon, path: 'newcomer', goal: old.goal, seed: old.seed });
    ['day', 'city', 'news', 'ach', 'ageRate', 'pop2', 'ballot', 'weather', 'evCool', 'seed'].forEach(function (k) { ns[k] = old[k]; });
    ns.slot = 0; ns.age = age; ns.cash = inherit; ns.edu = SK.chance(0.6) ? 3 : 2;
    var A0 = ARCH[def.arch] || ARCH.office;
    ns.skills[(A0.track && SK.TRACKS[A0.track]) ? SK.TRACKS[A0.track].skill : 'service'] = SK.rint(28, 40);
    if (old.home.type === 'own') { ns.home = old.home; ns.loans = old.loans.filter(function (l) { return l.type === 'home'; }); }
    Object.keys(old.rel).forEach(function (id) { if (id !== kidId) ns.rel[id] = { v: Math.round(old.rel[id].v * 0.5), last: -99, gift: -99, meal: -99, story: 0 }; });
    ns.fam.bond = old.love && old.love.stage === 'married' ? Math.max(60, old.love.bond) : 50;
    ns.stats.generation = (old.stats.generation || 1) + 1;
    ns.flags.yearShown = true; ns.flags.yearSeen = true;
    ns.pop2.kids = ns.pop2.kids.filter(function (id) { return id !== kidId; });
    delete ns.pop2.gen[kidId]; delete ns.pop2.age[kidId];
    ns.civic = Math.round(old.civic * 0.2);
    ns.today.start = ns.day;
    SK.S = ns;
    G.syncNPCs(ns);
    if (A0.track) {
      var tr = A0.track, lv = G.meetsReq(tr, 0).ok ? 0 : null;
      if (lv === 0) G.hire({ track: tr, level: 0, company: SK.pick(SK.TRACKS[tr].companies), wageMult: 1.05 });
    }
    G.genOpenings(); G.recalcPerks();
    ns.log = [];
    G.log('🌱 บทใหม่เริ่มต้น: ' + def.name + ' สานต่อเรื่องราวของ' + old.name + ' ได้รับมรดก ' + money(inherit) + (ns.home.type === 'own' ? ' และบ้านของครอบครัว' : ''), 'good');
    G.news(def.name + ' สานต่อเรื่องราวครอบครัวของ' + old.name + ' (รุ่นที่ ' + ns.stats.generation + ')', 'me');
    G.save();
    return 'ส่งต่อเรื่องราวให้' + def.name + 'แล้ว';
  };

  // ห้ามทำกิจกรรมเมื่อเรื่องจบ
  var origWhy = G.whyNot;
  G.whyNot = function (loc, a) { return S().ended ? 'เรื่องราวจบลงแล้ว — เริ่มเกมใหม่ได้จากเมนู' : origWhy(loc, a); };
  var origRun = SK.R.run;
  SK.R.run = function (days) {
    var s = S();
    if (s.ended) return { days: 0, reason: 'ended' };
    var r = origRun(days);
    if (S().ended && !r.reason) r.reason = 'ended';
    return r;
  };

  // ======================================================================
  //  เชื่อมกับเกมใหม่ / โหลดเซฟ
  // ======================================================================
  var origNew = G.newState;
  G.newState = function (o) {
    var s = origNew(o);
    G.ensureAging(s); G.syncNPCs(s);
    return s;
  };
  var origImport = G.importJSON;
  G.importJSON = function (raw) {
    var ok = origImport(raw);
    if (ok) { G.ensureAging(SK.S); G.syncNPCs(SK.S); }
    return ok;
  };

  SK.ACHIEVEMENTS.push(
    { id: 'grownkid', icon: '🎓', name: 'ส่งลูกถึงฝั่ง', desc: 'เลี้ยงลูกจนเป็นผู้ใหญ่', test: function (s) { return s.pop2 && s.pop2.kids.length > 0; } },
    { id: 'senior', icon: '🧓', name: 'วัยเก๋า', desc: 'มีอายุถึง 60 ปี', test: function (s) { return (s.age || 0) >= 60; } },
    { id: 'retired', icon: '🌅', name: 'เกษียณสุข', desc: 'เกษียณอายุจากงานประจำ', test: function (s) { return !!s.retired; } },
    { id: 'legacy', icon: '🌳', name: 'สืบทอดรุ่นสู่รุ่น', desc: 'เล่นต่อในฐานะลูก', test: function (s) { return (s.stats.generation || 1) >= 2; } },
    { id: 'welcome', icon: '🧳', name: 'เจ้าบ้านใจดี', desc: 'สนิทกับชาวเมืองที่ย้ายมาใหม่ถึง 50', test: function (s) { return Object.keys(s.rel).some(function (id) { return id.charAt(0) === 'g' && /^g\d+$/.test(id) && s.rel[id].v >= 50 && SK.NPCS[id] && !SK.NPCS[id].kid; }); } }
  );
})();
