/* สุขนคร — events.js : เหตุการณ์สุ่มในเมือง + การตัดสินใจของผู้เล่น */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, C = SK.clamp;
  function S() { return SK.S; }
  function money(n) { return SK.money(n); }

  // ch(ป้ายปุ่ม, ฟังก์ชันผลลัพธ์, ตัวเลือกเสริม {cost, req, slots, energy, hint})
  function ch(label, run, o) { o = o || {}; return { label: label, run: run, cost: o.cost || 0, req: o.req || null, hint: o.hint || '' }; }
  function inMonths(s, arr) { return arr.indexOf(SK.dateOf(s.day).m) >= 0; }
  function renting(s) { return SK.RENT_KEYS.indexOf(s.home.type) >= 0; }
  function randNpc() { return SK.pick(SK.NPC_KEYS); }
  function needSlot(n) { return function (s) { return G.remaining() < n ? 'เวลาในวันนี้ไม่พอ' : null; }; }

  SK.EVENTS = [
    // ---------------- พิเศษ (ถูกเรียกโดยระบบ ไม่สุ่มตามน้ำหนัก) ----------------
    {
      id: 'sick', icon: '🤒', special: true, def: 1,
      init: function (s) { return { kind: SK.pick(['ไข้หวัดธรรมดา', 'ไข้หวัดใหญ่', 'ท้องเสียเฉียบพลัน', 'ปวดหัวไมเกรน']) }; },
      title: 'ไม่ค่อยสบายเลย', text: function (s, x) { return 'ตื่นขึ้นมาแล้วรู้สึกไม่ไหว… ดูเหมือนจะเป็น' + x.kind + ' จะรับมืออย่างไรดี?'; },
      choices: [
        ch('ซื้อยากินเองและพักผ่อน (฿60)', function (s, x) { s.sick = { days: 3, kind: x.kind }; return 'กินยาและพักผ่อน คาดว่าอีก 3 วันน่าจะหาย'; }, { cost: 60 }),
        ch('ไปพบแพทย์ที่โรงพยาบาลชุมชน (ใช้เวลา 1 ช่วง)', function (s, x) { s.sick = { days: 1, kind: x.kind }; G.advance(1); return 'หมอตรวจและจ่ายยา พรุ่งนี้น่าจะดีขึ้น'; }, { cost: 30, hint: s_free() }),
        ch('นอนพักเฉยๆ ไม่ใช้เงิน', function (s, x) { s.sick = { days: 5, kind: x.kind }; return 'นอนพักอย่างเดียว อาจใช้เวลา 5 วันกว่าจะหาย'; })
      ]
    },
    {
      id: 'holiday', icon: '🎌', special: true, def: 1,
      init: function (s) { return { name: SK.dayInfo(s.day).holiday }; },
      title: function (s, x) { return 'วันนี้ ' + x.name; },
      text: function (s, x) { return 'ทั้งเมืองหยุดทำการ ตลาดและร้านค้าบางแห่งยังเปิด มีกิจกรรมเฉลิมฉลองตามจุดต่างๆ จะใช้วันนี้อย่างไร?'; },
      choices: [
        ch('ไปร่วมงานเฉลิมฉลองกับคนในชุมชน (฿150)', function (s) {
          G.mod('mood', 16); var id = randNpc(); G.addRel(id, 3); G.nudge('culture', 0.3, 'volunteer'); G.advance(1);
          return 'สนุกกับงานเฉลิมฉลองและได้เจอ' + SK.NPCS[id].name + ' ความสัมพันธ์ดีขึ้น';
        }, { cost: 150, req: needSlot(1) }),
        ch('พักผ่อนอยู่บ้าน', function (s) { G.mod('mood', 4); G.mod('energy', 10); return 'วันหยุดแสนสบาย'; }),
        ch('รับงานพิเศษช่วงวันหยุด', function (s) {
          var p = Math.round(SK.range(300, 420) * (0.8 + s.city.m.economy / 250)); G.earn(p, 'งานเสริม', true); G.mod('energy', -15); G.advance(1);
          return 'ทำงานพิเศษในวันหยุด ได้ค่าตอบแทน ' + money(p);
        }, { req: function (s) { return G.remaining() < 1 ? 'เวลาไม่พอ' : (s.energy < 20 ? 'พลังงานไม่พอ' : null); } })
      ]
    },

    // ---------------- ฤดูกาลและสิ่งแวดล้อม ----------------
    {
      id: 'flood', icon: '🌧️', cd: 40,
      w: function (s, c) { return inMonths(s, [7, 8, 9]) ? 2.4 * (1 + (70 - c.m.environment) / 90) : 0; },
      init: function (s) { G.shock('transport', -4 * (1.2 - s.city.m.environment / 150)); G.shock('environment', -1.5); G.news('ฝนตกหนัก น้ำท่วมขังหลายจุด การจราจรติดขัด', 'city'); return {}; },
      title: 'ฝนตกหนัก น้ำท่วมขังในย่าน', text: function () { return 'ฝนตกหนักทั้งคืน ถนนหลายสายน้ำท่วมขัง ชุมชนกำลังช่วยกันเก็บกวาดและยกของขึ้นที่สูง'; }, def: 2,
      choices: [
        ch('อาสาช่วยขนกระสอบทรายและเก็บกวาด (ใช้ 1 ช่วง)', function (s) { G.mod('energy', -18); G.nudge('transport', 0.7, 'volunteer'); G.nudge('environment', 0.3, 'volunteer'); s.civic += 4; s.stats.volunteer++; G.mod('mood', 3); G.advance(1); return 'ช่วยกันจนน้ำลด เพื่อนบ้านขอบคุณมาก (+4 แต้มพลเมือง)'; }, { req: function (s) { return G.remaining() < 1 ? 'เวลาไม่พอ' : s.energy < 20 ? 'พลังงานไม่พอ' : null; } }),
        ch('ไปทำงานตามปกติ ระวังลื่น', function (s) { G.mod('energy', -8); return 'ฝ่าน้ำท่วมขังไปทำงาน เปียกปอนเล็กน้อย'; }),
        ch('อยู่บ้านรอดูสถานการณ์', function (s) { G.mod('mood', -2); return 'อยู่บ้านดูข่าว รอให้น้ำลด'; })
      ]
    },
    {
      id: 'pm25', icon: '😷', cd: 45,
      w: function (s, c) { return inMonths(s, [11, 0, 1, 2]) ? 2.2 * (1 + (65 - c.m.environment) / 80) : 0; },
      init: function (s) { G.shock('health', -1.5); G.shock('environment', -1); G.news('ค่าฝุ่น PM2.5 สูงเกินมาตรฐานในหลายพื้นที่', 'city'); return {}; },
      title: 'ฝุ่น PM2.5 พุ่งสูง', text: function () { return 'ท้องฟ้าสีเทาขุ่น แอปเตือนค่าฝุ่นสูงมาก ชาวเมืองแนะนำให้สวมหน้ากากและลดกิจกรรมกลางแจ้ง'; }, def: 0,
      choices: [
        ch('ซื้อหน้ากาก N95 และใส่ตลอดวัน (฿90)', function () { return 'ใส่หน้ากากอย่างเคร่งครัด ไม่มีอาการผิดปกติ'; }, { cost: 90 }),
        ch('อยู่ในอาคารเปิดเครื่องฟอกอากาศชุมชน', function (s) { G.mod('mood', -2); return 'หลบฝุ่นในห้องสมุดและศูนย์ชุมชน อารมณ์เสียเล็กน้อย'; }),
        ch('ไม่ได้ป้องกันอะไร', function (s) { G.mod('health', -3); G.mod('mood', -2); return 'ไอและแสบคอตลอดวัน'; })
      ]
    },
    {
      id: 'dengue', icon: '🦟', cd: 50,
      w: function (s, c) { return inMonths(s, [5, 6, 7, 8, 9]) ? 1.8 : 0; },
      init: function (s) { G.shock('health', -3); G.news('พบผู้ป่วยไข้เลือดออกเพิ่ม เมืองรณรงค์ทำลายแหล่งเพาะพันธุ์ยุง', 'city'); return {}; },
      title: 'ไข้เลือดออกระบาด', text: function () { return 'ช่วงหน้าฝน ยุงลายชุกชุม มีผู้ป่วยไข้เลือดออกเพิ่มขึ้นในหลายย่าน เทศบาลชวนทุกบ้านร่วมกำจัดแหล่งน้ำขัง'; }, def: 1,
      choices: [
        ch('ร่วมรณรงค์ทำลายแหล่งยุงในชุมชน (ใช้ 1 ช่วง)', function (s) { G.mod('energy', -12); G.nudge('health', 0.8, 'volunteer'); s.civic += 4; s.stats.volunteer++; G.advance(1); return 'ช่วยกันคว่ำภาชนะและเก็บขยะ ยุงลดลงเห็นได้ชัด (+4 แต้มพลเมือง)'; }, { req: needSlot(1) }),
        ch('ซื้อสเปรย์กันยุงและมุ้ง (฿80)', function () { return 'ป้องกันตัวเองได้ดี'; }, { cost: 80 }),
        ch('ไม่ทำอะไรเป็นพิเศษ', function (s) { if (SK.chance(0.14) && !s.sick) { s.sick = { days: 6, kind: 'ไข้เลือดออก' }; return '😷 ติดไข้เลือดออก ต้องพักหลายวัน'; } return 'โชคดีที่ไม่เป็นอะไร'; })
      ]
    },
    {
      id: 'heat', icon: '🥵', cd: 35,
      w: function (s) { return inMonths(s, [2, 3, 4]) ? 2.2 : 0; },
      init: function (s) { G.news('คลื่นความร้อนปกคลุมเมือง อุณหภูมิสูงสุดเกิน 40 องศา', 'city'); return {}; },
      title: 'อากาศร้อนจัด', text: function () { return 'แดดแผดเผาตั้งแต่เช้า อุณหภูมิทะลุ 40 องศา จะรับมืออย่างไรดี?'; }, def: 0,
      choices: [
        ch('ซื้อน้ำแข็งและน้ำเย็นไว้ดื่ม (฿40)', function (s) { G.mod('energy', -2); return 'ดื่มน้ำเยอะๆ ทนร้อนได้สบาย'; }, { cost: 40 }),
        ch('หลบในห้องแอร์ / ห้องสมุด', function (s) { G.mod('energy', s.inv.ac ? 0 : -4); return s.inv.ac ? 'อยู่ในห้องแอร์สบายๆ' : 'หลบแดดในห้องสมุด'; }),
        ch('ลุยตามปกติ', function (s) { G.mod('energy', -12); G.mod('health', -1); G.mod('mood', -3); return 'ร้อนจนเหนื่อยเกินคาด'; })
      ]
    },

    // ---------------- เศรษฐกิจและงาน ----------------
    {
      id: 'factory', icon: '🏭', cd: 60,
      w: function (s, c) { return 1.0 + (70 - c.m.economy) / 40; },
      init: function (s) { G.shock('jobs', -4); G.shock('economy', -2); G.news('โรงงานขนาดกลางปรับโครงสร้าง ลดคนงานราว 300 ตำแหน่ง', 'city'); return {}; },
      title: 'โรงงานปรับโครงสร้าง', text: function () { return 'ข่าวด่วน: โรงงานแห่งหนึ่งลดกำลังการผลิตและเลิกจ้างพนักงานกว่า 300 คน เมืองเปิดคอร์สปรับทักษะเร่งด่วนฟรี'; }, def: 0,
      choices: [
        ch('เข้าคอร์สปรับทักษะฟรี (ใช้ 1 ช่วง)', function (s) { var k = SK.pick(Object.keys(SK.SKILLS)); G.skill(k, 2.5); G.advance(1); return 'เรียนคอร์สเร่งด่วน ทักษะ' + SK.SKILLS[k].name + 'เพิ่มขึ้น'; }, { req: needSlot(1) }),
        ch('รับทราบข่าว', function () { return 'อ่านข่าวแล้วเป็นห่วงเพื่อนร่วมเมือง'; })
      ]
    },
    {
      id: 'layoff', icon: '📉', cd: 90,
      w: function (s, c) { return s.job && c.m.jobs < 66 ? (66 - c.m.jobs) / 5 : 0; },
      init: function (s) {
        var keep = SK.chance(0.5 + ((s.job && s.job.boss ? s.job.boss.rel : 50) - 50) / 200);
        if (!keep) G.loseJob('ถูกเลิกจ้างจากการปรับโครงสร้างองค์กร');
        return { keep: keep };
      },
      title: 'บริษัทปรับโครงสร้าง', def: 0,
      text: function (s, x) { return x.keep ? 'บริษัทประกาศลดคน แต่ผลงานของคุณดีพอที่จะได้อยู่ต่อ ทุกคนในทีมถอนหายใจโล่ง' : 'คุณถูกเลิกจ้างจากการปรับโครงสร้างองค์กร แต่เมืองมีมาตรการช่วยเหลือ ไปที่ศูนย์จัดหางานเพื่อรับสิทธิ์และสมัครงานใหม่ได้เลย'; },
      choices: [ch('ตั้งสติและวางแผนต่อ', function (s, x) { if (!x.keep) { G.skill('mgmt', 0.5); } return x.keep ? 'ทุ่มเทต่อไป' : 'หายใจลึกๆ แล้วเริ่มวางแผนหางานใหม่'; })]
    },
    {
      id: 'newco', icon: '🏢', cd: 70,
      w: function (s, c) { return 0.9 + (c.m.economy - 60) / 60; },
      init: function (s) { G.shock('jobs', 5); G.shock('economy', 3); G.news('บริษัทเทคโนโลยีเปิดสำนักงานใหม่ในเมือง จ้างงานกว่า 500 ตำแหน่ง', 'city'); for (var i = 0; i < 2; i++) { var tk = SK.pick(SK.TRACK_KEYS); s.openings.push({ track: tk, level: 0, company: SK.pick(SK.TRACKS[tk].companies), wageMult: 1.1 }); } return {}; },
      title: 'บริษัทใหม่เปิดในเมือง', text: function () { return 'ข่าวดี! บริษัทแห่งใหม่เปิดสาขาในสุขนคร เปิดรับสมัครงานหลายตำแหน่ง และจัดงานเปิดตัวให้ชาวเมืองเข้าร่วมได้'; }, def: 0,
      choices: [
        ch('ไปงานเปิดตัวหาคอนเนกชัน (ใช้ 1 ช่วง)', function (s) { s.bonusUntil = s.day + 14; G.skill('service', 0.5); G.advance(1); return 'ได้นามบัตรหลายใบ โอกาสผ่านสัมภาษณ์สูงขึ้น 14 วัน'; }, { req: needSlot(1) }),
        ch('ข้ามไปก่อน', function () { return 'ข้อมูลตำแหน่งใหม่ถูกลงที่ศูนย์จัดหางานแล้ว'; })
      ]
    },
    {
      id: 'jobfair', icon: '📋', cd: 60,
      w: function (s) { return s.job ? 0.4 : 1.6; },
      init: function (s) { return {}; },
      title: 'งานมหกรรมหางานประจำปี', text: function () { return 'ศูนย์จัดหางานจัดงานมหกรรมหางาน มีนายจ้างหลายสิบแห่งมารับสมัครและให้คำปรึกษา'; }, def: 0,
      choices: [
        ch('ไปร่วมงาน (ใช้ 1 ช่วง)', function (s) { s.bonusUntil = s.day + 14; G.genOpenings(); G.skill('service', 0.6); G.advance(1); return 'ได้ข้อมูลตำแหน่งงานใหม่ๆ และเทคนิคสัมภาษณ์ โอกาสผ่านสัมภาษณ์เพิ่มขึ้น'; }, { req: needSlot(1) }),
        ch('ไม่ไปครั้งนี้', function () { return 'ปล่อยผ่านไป'; })
      ]
    },
    {
      id: 'referral', icon: '🤝', cd: 80,
      w: function (s) { return !s.job && G.rel('cafe') >= 15 ? 2 : 0; },
      init: function (s) { s.referralUntil = s.day + 14; return {}; },
      title: function () { return SK.nn('cafe') + 'ฝากงานให้'; }, text: function () { return SK.nn('cafe') + 'กระซิบว่า "เพื่อนเปิดร้านใหม่กำลังหาคน ไปสมัครเลยนะ เดี๋ยวฝากชื่อไว้ให้" โอกาสสมัครงานบริการของคุณสูงขึ้นพิเศษ 14 วัน'; }, def: 0,
      choices: [ch(function () { return 'ขอบคุณ' + SK.nn('cafe') + 'มาก!'; }, function (s) { G.addRel('cafe', 2); G.mod('mood', 5); return 'ได้ความช่วยเหลือจากน้ำใจเพื่อนบ้าน'; })]
    },
    {
      id: 'scholar', icon: '🎓', cd: 120,
      w: function (s) { return s.edu < 4 ? 0.9 : 0; },
      init: function () { return {}; },
      title: 'ทุนการศึกษาชุมชน', text: function () { return 'วิทยาลัยชุมชนเปิดรับสมัครทุนเรียนต่อ ผู้ได้รับทุนจะเรียนฟรี 6 ครั้ง การสมัครต้องเขียนเรียงความสั้นๆ'; }, def: 0,
      choices: [
        ch('สมัครทุน (ใช้ 1 ช่วง)', function (s) { G.advance(1); var p = 0.45 + s.skills.mgmt / 250 + (s.perks.bookworm ? 0.15 : 0); if (SK.chance(p)) { s.voucher += 6; return '🎉 ได้รับทุน! เรียนฟรี 6 ครั้ง'; } return 'ครั้งนี้ยังไม่ได้ทุน แต่ได้ฝึกเขียนเรียงความ'; }, { req: needSlot(1) }),
        ch('ไม่สมัคร', function () { return 'ปล่อยผ่านไป'; })
      ]
    },
    {
      id: 'crash', icon: '📉', cd: 90,
      w: function (s, c) { return 0.8 + (70 - c.m.economy) / 40; },
      init: function (s) { s.city.fundPrice *= 0.88; G.shock('economy', -2); G.news('ตลาดทุนผันผวนหนัก กองทุนรวมในเมืองปรับตัวลดลงเกือบ 12%', 'city'); return {}; },
      title: 'ตลาดการเงินผันผวน', text: function (s) { return 'ราคากองทุนตกลงเกือบ 12% ในวันเดียว ข่าวทีวีเต็มไปด้วยความตื่นตระหนก' + (s.fundUnits > 0 ? ' คุณมีกองทุนอยู่ ' + s.fundUnits.toFixed(1) + ' หน่วย' : ''); }, def: 0,
      choices: [
        ch('ใจเย็นๆ ถือต่อ', function (s) { G.skill('mgmt', 0.4); return 'ไม่ตกใจ ถือต่อระยะยาว'; }),
        ch('ซื้อเพิ่มตอนราคาถูก (฿5,000)', function (s) { var p = s.city.fundPrice; G.take(5000); s.fundUnits += 5000 / p; s.fundCost += 5000; return 'ซื้อกองทุนเพิ่มที่ราคาต่ำ ' + (5000 / p).toFixed(1) + ' หน่วย'; }, { req: function (s) { return G.total() < 5000 ? 'เงินไม่พอ' : null; } }),
        ch('ขายทั้งหมดเพื่อตัดขาดทุน', function (s) { var v = G.fundValue(); if (v <= 0) return 'ไม่มีกองทุนให้ขาย'; s.cash += Math.round(v); s.fundUnits = 0; s.fundCost = 0; return 'ขายกองทุนทั้งหมดได้ ' + money(v); })
      ]
    },
    {
      id: 'boom', icon: '📈', cd: 80,
      w: function (s, c) { return 0.8 + (c.m.economy - 60) / 40; },
      init: function (s) { s.city.fundPrice *= 1.07; G.shock('economy', 1.5); G.news('ดัชนีกองทุนในเมืองขึ้นแรงเกือบ 7% ในวันเดียว', 'city'); return {}; },
      title: 'ตลาดการเงินคึกคัก', text: function () { return 'ราคากองทุนปรับขึ้นแรงเกือบ 7% นักลงทุนยิ้มแย้ม'; }, def: 1,
      choices: [
        ch('ขายครึ่งหนึ่งเพื่อล็อกกำไร', function (s) { if (s.fundUnits <= 0) return 'ยังไม่มีกองทุนให้ขาย'; var u = s.fundUnits / 2, p = u * s.city.fundPrice, cst = s.fundCost / 2; s.fundUnits -= u; s.fundCost -= cst; if (p > cst) s.stats.fundGain += p - cst; s.cash += Math.round(p); return 'ขายได้ ' + money(p); }),
        ch('ถือต่อ', function () { return 'ถือต่อระยะยาว'; })
      ]
    },

    // ---------------- ที่อยู่อาศัยและชีวิตประจำวัน ----------------
    {
      id: 'rentup', icon: '🏷️', cd: 100,
      w: function (s, c) { return renting(s) && s.home.rentMult < 1.25 ? 1.4 * (1 - c.m.housing / 110) + 0.3 : 0; },
      init: function () { return {}; },
      title: function () { return SK.nn('landlord') + 'แจ้งขึ้นค่าเช่า'; }, text: function (s) { return SK.nn('landlord') + 'มาเคาะประตู "ช่วงนี้ค่าครองชีพขึ้น ขอปรับค่าเช่าขึ้น 8% นะ" ค่าเช่าปัจจุบัน ' + money(G.rentOf(s.home.type)) + '/เดือน'; }, def: 1,
      choices: [
        ch('ขอต่อรองอย่างสุภาพ', function (s) { var p = 0.35 + G.rel('landlord') / 150; if (SK.chance(p)) { G.addRel('landlord', 1); return SK.nn('landlord') + 'ใจอ่อน ยังคงค่าเช่าเดิม ขอบคุณที่เข้าใจกัน'; } s.home.rentMult *= 1.08; return 'ต่อรองไม่สำเร็จ ค่าเช่าขึ้น 8%'; }),
        ch('ยอมรับ', function (s) { s.home.rentMult *= 1.08; G.addRel('landlord', 1); return 'ตกลงตามที่' + SK.nn('landlord') + 'ขอ ค่าเช่าขึ้น 8%'; })
      ]
    },
    {
      id: 'outage', icon: '🔌', cd: 40,
      w: function () { return 0.9; },
      init: function () { return {}; },
      title: 'ไฟดับทั้งซอย', text: function () { return 'ไฟฟ้าดับกะทันหันตั้งแต่เช้า เพื่อนบ้านออกมายืนหน้าบ้านกันทั้งซอย การไฟฟ้าแจ้งว่าจะซ่อมให้เสร็จภายในบ่าย'; }, def: 0,
      choices: [
        ch('นั่งคุยกับเพื่อนบ้านระหว่างรอ (ใช้ 1 ช่วง)', function (s) { G.addRel('landlord', 2); G.mod('mood', 5); G.advance(1); return 'ได้รู้จักเพื่อนบ้านมากขึ้นเยอะ'; }, { req: needSlot(1) }),
        ch('ใช้เวลาอ่านหนังสือเงียบๆ', function (s) { G.skill('mgmt', 0.4); G.mod('mood', -1); return 'อ่านหนังสือจนไฟมา'; })
      ]
    },
    {
      id: 'theft', icon: '🕵️', cd: 45,
      w: function (s, c) { return (s.flags.safeUntil || 0) >= s.day ? 0.2 : (s.perks.protect ? 0.2 : 1.4 * (1 + (80 - c.m.safety) / 50)); },
      init: function (s) { var amt = Math.min(SK.rint(300, 1500), Math.max(0, Math.floor(s.cash))); s.cash -= amt; G.shock('safety', -0.5); return { amt: amt }; },
      title: 'กระเป๋าสตางค์หาย', text: function (s, x) { return x.amt > 0 ? 'ขณะเดินในตลาดแออัด ถูกล้วงกระเป๋าไป ' + money(x.amt) + ' ตำรวจชุมชนแนะนำให้แจ้งความ' : 'มีคนพยายามล้วงกระเป๋า แต่โชคดีที่ไม่มีเงินสดติดตัวมากนัก ตำรวจชุมชนแนะนำให้แจ้งความไว้'; }, def: 0,
      choices: [
        ch('แจ้งความ (ใช้ 1 ช่วง)', function (s, x) { G.advance(1); G.addRel('police', 1.5); var p = s.city.m.safety / 100 + (s.perks.protect ? 0.3 : 0.05); if (x.amt > 0 && SK.chance(p)) { var back = Math.round(x.amt * 0.6); s.cash += back; return 'ตำรวจติดตามจนได้เงินคืนบางส่วน ' + money(back); } return 'แจ้งความเรียบร้อย ตำรวจเพิ่มเวรเดินตรวจในย่านนี้'; }, { req: needSlot(1) }),
        ch('ปล่อยผ่านไป', function () { G.mod('mood', -3); return 'ได้บทเรียนราคาแพง ระวังตัวมากขึ้น'; })
      ]
    },
    {
      id: 'lucky', icon: '🍀', cd: 25,
      w: function () { return 0.9; },
      init: function () { return { amt: SK.rint(300, 900) }; },
      title: 'โชคเล็กๆ', text: function (s, x) { return SK.pick(['ค้นกระเป๋าเสื้อตัวเก่าเจอแบงก์ที่ลืมไว้', 'ได้รับเงินคืนค่าส่วนต่างสาธารณูปโภค', 'เพื่อนคืนเงินที่ยืมไปนานแล้ว', 'ถูกรางวัลเล็กๆ จากสลากออมทรัพย์']) + ' เป็นเงิน ' + money(x.amt); }, def: 0,
      choices: [ch('ดีใจจัง!', function (s, x) { G.earn(x.amt, 'โชคดี'); G.mod('mood', 6); return 'ได้รับ ' + money(x.amt); })]
    },
    {
      id: 'dinner', icon: '🍲', cd: 30,
      w: function () { return 1.0; },
      init: function () { return {}; },
      title: 'เพื่อนบ้านชวนกินข้าว', text: function () { return SK.nn('landlord') + 'กับเพื่อนบ้านทำแกงใหญ่ๆ ชวนไปกินข้าวร่วมกันที่ลานหน้าซอย "มาเถอะ ข้าวเหลือเยอะ"'; }, def: 0,
      choices: [
        ch('ไปร่วมวง (ใช้ 1 ช่วง)', function (s) { H_eat(46, 72); G.mod('mood', 8); G.addRel('landlord', 4); G.advance(1); return 'อิ่มท้องอิ่มใจ ได้ทั้งอาหารและเพื่อน'; }, { req: needSlot(1) }),
        ch('ขอบคุณและปฏิเสธ', function (s) { G.mod('mood', -1); return 'ขอบคุณที่ชวน ไว้คราวหน้านะ'; })
      ]
    },
    {
      id: 'cat', icon: '🐱', cd: 150,
      w: function (s) { return !s.pet && SK.HOUSING[s.home.type].comfort >= 2 ? 0.8 : 0; },
      init: function () { return {}; },
      title: 'แมวจรหน้าบ้าน', text: function () { return 'แมวตัวเล็กผอมๆ นั่งมองคุณอยู่หน้าประตูห้อง ท่าทางอยากมีบ้าน (ค่าเลี้ยงประมาณ ฿450/เดือน)'; }, def: 1,
      choices: [
        ch('รับเลี้ยงไว้ (฿300 ค่าวัคซีน)', function (s) { s.pet = true; G.mod('mood', 12); return 'ได้เพื่อนตัวเล็กมาอยู่ด้วยแล้ว 🐱'; }, { cost: 300 }),
        ch('ส่งต่อศูนย์พักพิงสัตว์ของเมือง', function (s) { s.civic += 1; G.mod('mood', 2); return 'ส่งน้องแมวให้ศูนย์ดูแลต่อ'; })
      ]
    },

    // ---------------- สังคม / ชุมชน ----------------
    {
      id: 'festival', icon: '🎆', cd: 60,
      w: function (s, c) { return 0.8 + (c.m.culture - 60) / 50; },
      init: function (s) { G.shock('culture', 4); G.shock('economy', 1); G.news('เทศกาลอาหารและดนตรีของเมืองเปิดฉาก คึกคักทั้งสุดสัปดาห์', 'city'); return {}; },
      title: 'เทศกาลอาหารและดนตรี', text: function () { return 'ลานกลางเมืองเต็มไปด้วยเสียงดนตรีและกลิ่นอาหารหอมๆ ทั้งเมืองออกมาสนุกกันอย่างคึกคัก'; }, def: 2,
      choices: [
        ch('ไปเที่ยวงาน (฿200)', function (s) { G.mod('mood', 20); var id = randNpc(); G.addRel(id, 3); G.advance(1); return 'สนุกสุดๆ และได้เจอ' + SK.NPCS[id].name; }, { cost: 200, req: needSlot(1) }),
        ch('ไปขายของในงาน (ใช้ 1 ช่วง)', function (s) { var p = Math.round(SK.range(450, 800)); G.earn(p, 'งานเสริม', true); G.mod('energy', -18); G.skill('service', 0.8); G.advance(1); return 'ขายของจนเหนื่อยแต่คุ้ม ได้ ' + money(p); }, { req: function (s) { return G.remaining() < 1 ? 'เวลาไม่พอ' : s.energy < 20 ? 'พลังงานไม่พอ' : null; } }),
        ch('อยู่บ้านพักผ่อน', function (s) { G.mod('mood', 2); return 'ฟังเสียงเทศกาลไกลๆ จากหน้าต่าง'; })
      ]
    },
    {
      id: 'elder', icon: '👵', cd: 50,
      w: function () { return 0.9; },
      init: function () { return {}; },
      title: 'ผู้สูงอายุหกล้มข้างทาง', text: function () { return 'ระหว่างทาง เห็นคุณยายท่านหนึ่งหกล้มข้างทางเท้า ข้าวของกระจาย ผู้คนผ่านไปมา'; }, def: 0,
      choices: [
        ch('เข้าไปช่วยประคองและดูแล (ใช้ 1 ช่วง)', function (s) { s.civic += 4; G.mod('mood', 8); G.skill('care', 0.8); G.advance(1); return 'คุณยายปลอดภัยและขอบคุณมาก (+4 แต้มพลเมือง)'; }, { req: needSlot(1) }),
        ch('โทรเรียกรถพยาบาลแล้วอยู่เป็นเพื่อนสักพัก', function (s) { s.civic += 2; G.mod('mood', 3); return 'รถพยาบาลมาถึงภายในไม่กี่นาที'; }),
        ch('เดินผ่านไป', function (s) { G.mod('mood', -4); return 'ตลอดวันยังคิดถึงภาพนั้น…'; })
      ]
    },
    {
      id: 'wallet', icon: '👛', cd: 60,
      w: function () { return 0.7; },
      init: function () { return {}; },
      title: 'เก็บกระเป๋าสตางค์ได้', text: function () { return 'เจอกระเป๋าสตางค์ใบหนึ่งตกอยู่ข้างม้านั่ง มีบัตรประชาชนและเงินสดประมาณ ฿800'; }, def: 0,
      choices: [
        ch('นำไปคืนที่สถานีตำรวจ', function (s) { s.civic += 3; G.mod('mood', 6); G.addRel('police', 2); if (SK.chance(0.5)) { G.earn(200, 'ของขวัญและรางวัล'); return 'เจ้าของมารับด้วยน้ำตาคลอและให้รางวัล ฿200'; } return 'เจ้าของมารับและขอบคุณมาก (+3 แต้มพลเมือง)'; }),
        ch('เก็บเงินไว้เอง', function (s) { G.earn(800, 'โชคดี'); s.civic -= 2; G.mod('mood', -6); return 'ได้เงินมาแต่รู้สึกผิดตลอดวัน'; })
      ]
    },
    {
      id: 'cleanup', icon: '🧹', cd: 40,
      w: function (s) { return SK.dayInfo(s.day).off ? 1.8 : 0.3; },
      init: function () { return {}; },
      title: 'วันทำความสะอาดชุมชน (Big Cleaning Day)', text: function () { return SK.nn('student') + 'และอาสาสมัครชวนทั้งย่านออกมาเก็บขยะ ปลูกต้นไม้ และทาสีรั้ววัด'; }, def: 0,
      choices: [
        ch('ร่วมกิจกรรม (ใช้ 1 ช่วง)', function (s) { G.mod('energy', -14); G.nudge('environment', 0.7, 'volunteer'); s.civic += 4; s.stats.volunteer++; G.mod('mood', 5); G.addRel('student', 2); G.advance(1); return 'ย่านสะอาดขึ้นมาก (+4 แต้มพลเมือง)'; }, { req: function (s) { return G.remaining() < 1 ? 'เวลาไม่พอ' : s.energy < 16 ? 'พลังงานไม่พอ' : null; } }),
        ch('ไม่สะดวกครั้งนี้', function () { return 'ขอบคุณที่ชวน ไว้คราวหน้า'; })
      ]
    },
    {
      id: 'mayorwalk', icon: '🧑‍💼', cd: 60,
      w: function () { return 0.7; },
      init: function () { return {}; },
      title: 'นายกฯ เดินตลาด', text: function () { return 'ท่านนายกเทศมนตรี' + SK.nn('mayor') + 'เดินทักทายชาวบ้านที่ตลาด และเปิดโอกาสให้ทุกคนบอกปัญหาที่อยากให้แก้'; }, def: 0,
      choices: [
        ch('เข้าไปเสนอความเห็น (ใช้ 1 ช่วง)', function (s) { var m = SK.MKEYS.slice().sort(function (a, b) { return s.city.m[a] - s.city.m[b]; })[0]; G.nudge('trust', 0.3, 'volunteer'); G.addRel('mayor', 3); s.civic += 3; s.city.pending.push({ m: m, per: 2 / 20, d: 20 }); G.advance(1); return 'ท่านนายกจดข้อเสนอเรื่อง' + SK.METRICS[m].name + 'ไว้ และสัญญาว่าจะดำเนินการ'; }, { req: needSlot(1) }),
        ch('ยิ้มทักทายแล้วเดินต่อ', function (s) { G.mod('mood', 2); return 'ทักทายกันสั้นๆ'; })
      ]
    },
    {
      id: 'sportsday', icon: '🏅', cd: 80,
      w: function () { return 0.6; },
      init: function (s) { G.shock('culture', 1.5); return {}; },
      title: 'วันกีฬาชุมชน', text: function () { return 'สนามกีฬากลางเมืองจัดแข่งขันกีฬาสีมิตรภาพระหว่างย่าน ใครจะมาร่วมสนุกก็ได้'; }, def: 0,
      choices: [
        ch('ลงแข่งกับเพื่อนบ้าน (ใช้ 1 ช่วง)', function (s) { G.mod('fitness', 3); G.mod('mood', 12); G.mod('energy', -20); G.addRel('coach', 2); G.advance(1); return 'ได้ออกกำลังกายและเสียงหัวเราะเต็มสนาม'; }, { req: function (s) { return G.remaining() < 1 ? 'เวลาไม่พอ' : s.energy < 22 ? 'พลังงานไม่พอ' : null; } }),
        ch('ไปเชียร์ข้างสนาม', function (s) { G.mod('mood', 6); return 'เชียร์เพื่อนๆ จนเสียงแหบ'; })
      ]
    },
    {
      id: 'openclass', icon: '📚', cd: 50,
      w: function () { return 0.8; },
      init: function () { return {}; },
      title: 'วิทยาลัยเปิดห้องเรียนฟรี', text: function () { return 'วิทยาลัยชุมชนเปิดห้องเรียนตัวอย่างฟรี หัวข้อประจำสัปดาห์น่าสนใจทีเดียว'; }, def: 0,
      choices: [
        ch('เข้าร่วมเรียน (ใช้ 1 ช่วง)', function (s) { var k = SK.pick(Object.keys(SK.SKILLS)); G.skill(k, 2); G.advance(1); return 'ได้ความรู้ใหม่ ทักษะ' + SK.SKILLS[k].name + 'เพิ่มขึ้น'; }, { req: needSlot(1) }),
        ch('ข้ามไป', function () { return 'ไม่ได้ไปครั้งนี้'; })
      ]
    },
    {
      id: 'scam', icon: '🎭', cd: 70,
      w: function (s) { return G.total() > 5000 ? ((s.flags.safeUntil || 0) >= s.day ? 0.4 : 1.2) : 0; },
      init: function () { return {}; },
      title: 'ข้อเสนอลงทุนผลตอบแทนสูงมาก', text: function () { return 'มีข้อความเข้ามาชวนลงทุน "รับผลตอบแทน 30% ต่อเดือน ไม่มีความเสี่ยง" พร้อมรูปรถหรูและรีวิวจากคนมากมาย'; }, def: 1,
      choices: [
        ch('ลองลงทุน ฿5,000', function (s) { if (s.skills.mgmt >= 45 && SK.chance(0.5)) { return 'ตรวจสอบเพิ่มและถอยทัน (ไม่ได้ลงทุน)'; } s.credit = Math.max(0, s.credit - 1); G.mod('mood', -8); return '😞 ถูกหลอก! เงิน ฿5,000 หายไปพร้อมกับบัญชีที่ถูกปิด'; }, { cost: 5000 }),
        ch('ปฏิเสธและแจ้งตำรวจ', function (s) { s.civic += 3; G.nudge('safety', 0.2, 'volunteer'); G.addRel('police', 1.5); return 'แจ้งเบาะแสให้ตำรวจ ช่วยเตือนคนอื่นๆ ได้ด้วย'; }),
        ch(function () { return 'ปรึกษา' + SK.nn('banker') + 'ที่ธนาคาร (ใช้ 1 ช่วง)'; }, function (s) { G.skill('mgmt', 1); G.addRel('banker', 3); G.advance(1); return SK.nn('banker') + 'ยืนยันว่านี่คือแชร์ลูกโซ่ และสอนวิธีสังเกตมิจฉาชีพ'; }, { req: needSlot(1) })
      ]
    },
    {
      id: 'fire', icon: '🔥', cd: 90,
      w: function (s, c) { return 0.6 + (80 - c.m.safety) / 80; },
      init: function (s) { G.shock('safety', -1); G.news('เกิดเหตุเพลิงไหม้ร้านค้าในตลาด ดับเพลิงควบคุมได้ภายใน 1 ชั่วโมง', 'city'); return {}; },
      title: 'ไฟไหม้ในตลาด', text: function () { return 'ควันสีดำพวยพุ่งจากร้านค้าแห่งหนึ่งในตลาด รถดับเพลิงกำลังมา ผู้คนช่วยกันขนของออก'; }, def: 1,
      choices: [
        ch('ช่วยขนของและอพยพผู้คน (ใช้ 1 ช่วง)', function (s) { G.mod('energy', -20); s.civic += 6; G.nudge('safety', 0.6, 'volunteer'); G.mod('mood', 4); s.stats.volunteer++; G.advance(1); return 'ช่วยกันจนทุกคนปลอดภัย (+6 แต้มพลเมือง)'; }, { req: function (s) { return G.remaining() < 1 ? 'เวลาไม่พอ' : s.energy < 24 ? 'พลังงานไม่พอ' : null; } }),
        ch('บริจาคช่วยเหลือร้านค้า ฿500', function (s) { s.civic += 3; G.mod('mood', 3); return 'ร่วมบริจาคช่วยพ่อค้าแม่ค้าที่ได้รับความเสียหาย'; }, { cost: 500 }),
        ch('ถอยออกมายืนดูห่างๆ', function () { return 'อยู่ห่างๆ เพื่อความปลอดภัย'; })
      ]
    },
    {
      id: 'roadwork', icon: '🚧', cd: 40,
      w: function () { return 0.9; },
      init: function (s) { G.shock('transport', -3); G.news('ขุดถนนวางท่อใหม่ในย่านใจกลางเมือง การจราจรติดขัด', 'city'); return {}; },
      title: 'ขุดถนนปรับปรุงท่อ', text: function () { return 'ถนนสายหลักถูกขุดปิดช่องจราจรเพื่อวางท่อใหม่ การเดินทางวันนี้อาจล่าช้า'; }, def: 0,
      choices: [
        ch('อ้อมทางไปสบายๆ', function (s) { G.mod('energy', -5); return 'อ้อมไปอีกสองซอย เหนื่อยเล็กน้อย'; }),
        ch('ใช้เวลาว่างหยุดมองต้นไม้ริมทาง', function (s) { G.mod('mood', 2); return 'ถือโอกาสเดินช้าลงและมองเมือง'; })
      ]
    }
  ];
  SK.EV = {};
  SK.EVENTS.forEach(function (e) { SK.EV[e.id] = e; });

  function s_free() { return ''; }
  function H_eat(sat, q) { SK.H.eat(sat, q, 0); }

  // ======================================================================
  //  สุ่มเหตุการณ์ประจำวัน / ตัดสินใจ
  // ======================================================================
  G.rollEvent = function (info) {
    var s = S();
    if (s.pendingEvent) return;
    // 1) ป่วย
    if (!s.sick) {
      var p = 0.012 + (100 - s.health) / 100 * 0.04 + (info.season !== 'ร้อน' ? 0.008 : 0) - (s.city.m.health - 60) / 100 * 0.01;
      if (s.day <= s.immuneUntil) p *= 0.4;
      if (SK.chance(Math.max(0.003, p))) { G.startEvent('sick'); return; }
    }
    // 2) วันหยุด
    var hk = info.holiday ? info.holiday + info.date.y : null;
    if (hk && s.flags.holName !== hk) { s.flags.holName = hk; s.flags.holDay = s.day; G.startEvent('holiday'); return; }
    // 3) สุ่ม (วันเทศกาลที่มีน้ำหนักสูงจะเกิดแน่นอน)
    var cands = [], total = 0, maxW = 0;
    SK.EVENTS.forEach(function (ev) {
      if (ev.special) return;
      if (s.evCool[ev.id] && s.evCool[ev.id] > s.day) return;
      var w = ev.w(s, s.city, info);
      if (w > 0) { cands.push([ev, w]); total += w; if (w > maxW) maxW = w; }
    });
    if (!cands.length) return;
    if (maxW < 20 && !SK.chance(0.30)) return;
    var r = SK.rand() * total, pick = cands[0][0];
    for (var i = 0; i < cands.length; i++) { r -= cands[i][1]; if (r <= 0) { pick = cands[i][0]; break; } }
    if (maxW >= 20) cands.forEach(function (c) { if (c[1] === maxW) pick = c[0]; });
    s.evCool[pick.id] = s.day + (pick.cd || 30);
    G.startEvent(pick.id);
  };

  G.startEvent = function (id, given) {
    var s = S(), ev = SK.EV[id];
    var ctx = given || (ev.init ? ev.init(s) : {});
    s.pendingEvent = { id: id, ctx: ctx || {} };
    if (s.flags.autoEv && ev.def != null) G.autoResolve();
  };

  G.eventView = function () {
    var s = S(), pe = s.pendingEvent;
    if (!pe) return null;
    var ev = SK.EV[pe.id], x = pe.ctx;
    return {
      id: pe.id, icon: ev.icon,
      title: typeof ev.title === 'function' ? ev.title(s, x) : ev.title,
      text: ev.text(s, x),
      choices: ev.choices.map(function (c, i) {
        var req = c.req ? c.req(s, x) : null;
        if (!req && c.cost > 0 && !G.canPay(c.cost)) req = 'เงินไม่พอ';
        return { i: i, label: typeof c.label === 'function' ? c.label(s) : c.label, cost: c.cost, disabled: !!req, reason: req || '' };
      })
    };
  };

  G.resolveEvent = function (i) {
    var s = S(), pe = s.pendingEvent;
    G.msgs = [];
    if (!pe) return { ok: false, msg: '' };
    var ev = SK.EV[pe.id], c = ev.choices[i];
    if (!c) return { ok: false, msg: '' };
    var req = c.req ? c.req(s, pe.ctx) : null;
    if (req) return { ok: false, msg: req };
    if (c.cost > 0) { if (!G.canPay(c.cost)) return { ok: false, msg: 'เงินไม่พอ' }; G.pay(c.cost, 'เหตุการณ์ในเมือง'); }
    s.pendingEvent = null;
    var msg = c.run(s, pe.ctx);
    if (msg) G.log(ev.icon + ' ' + msg, 'n');
    G.checkAch();
    return { ok: true, msg: msg };
  };

  G.autoResolve = function () {
    var s = S(), pe = s.pendingEvent;
    if (!pe) return;
    var ev = SK.EV[pe.id], order = [ev.def != null ? ev.def : 0];
    for (var i = 0; i < ev.choices.length; i++) if (order.indexOf(i) < 0) order.push(i);
    for (var j = 0; j < order.length; j++) {
      var r = G.resolveEvent(order[j]);
      if (r.ok) return;
    }
    s.pendingEvent = null;
  };
})();
