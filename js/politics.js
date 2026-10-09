/* สุขนคร — politics.js : ลงสมัครการเมืองท้องถิ่น
   สมาชิกสภาเมือง → นายกเทศมนตรี • หาเสียง • ประชุมสภา ยื่นญัตติ • นายกฯ ปรับงบและอนุมัติโครงการเอง • คะแนนนิยม */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, B = SK.B, C = SK.clamp;
  function S() { return SK.S; }
  function money(n) { return SK.money(n); }
  function A(o) { var d = { slots: 0, cost: 0, energy: 0, group: '', desc: '', icon: '•', check: null, run: null }; for (var k in o) d[k] = o[k]; return d; }
  function wrap(loc, extra) { var orig = B[loc]; B[loc] = function (s) { return extra(s, orig(s)); }; }
  function cpi() { var s = S(); return s.econ ? s.econ.cpi : 1; }
  var ROLE = { council: 'สมาชิกสภาเมือง', mayor: 'นายกเทศมนตรี' };

  G.ensurePol = function (s) { s = s || S(); if (!s.pol) s.pol = { cand: null, office: null, approval: 55, motions: -99, terms: 0 }; return s; };
  function inWindow(s) { var m = SK.dateOf(s.day).m; return m === 8 || m === 9; }
  G.isMayor = function () { var s = S(); return !!(s.pol && s.pol.office && s.pol.office.role === 'mayor'); };

  wrap('townhall', function (s, list) {
    G.ensurePol(s);
    var P = s.pol, out = [];
    var gC = '🗳️ ลงสมัครรับเลือกตั้ง (เปิดรับสมัคร ก.ย.–ต.ค. • เลือกตั้ง พ.ย.)';
    if (!P.cand && !(P.office && P.office.role === 'mayor')) {
      var target = P.office && P.office.role === 'council' ? 'mayor' : 'council';
      var dep = Math.round((target === 'mayor' ? 20000 : 5000) * cpi());
      out.push(A({
        key: 'run:' + target, group: gC, icon: target === 'mayor' ? '🏛️' : '🎙️', name: 'ลงสมัคร' + ROLE[target] + ' (เงินประกัน ' + money(dep) + ')',
        desc: target === 'mayor' ? 'ต้องเป็นสมาชิกสภามาแล้ว และแต้มพลเมือง 150+' : 'อายุ 25+ อยู่ในเมือง 180 วัน และแต้มพลเมือง 60+', slots: 1, cost: dep, energy: 5,
        check: function (s) {
          if (!inWindow(s)) return 'เปิดรับสมัครช่วงกันยายน–ตุลาคม';
          if ((s.age || 30) < 25) return 'อายุไม่ถึง 25 ปี';
          if (target === 'council' && (s.civic < 60 || s.day < 180)) return 'ต้องมีแต้มพลเมือง 60 และอยู่ในเมืองอย่างน้อย 180 วัน';
          if (target === 'mayor' && s.civic < 150) return 'ต้องมีแต้มพลเมือง 150';
          return null;
        },
        run: function (s) {
          P.cand = { office: target, score: 0, deposit: dep, opp: SK.rint(target === 'mayor' ? 60 : 40, target === 'mayor' ? 90 : 70) };
          G.news(s.name + ' ลงสมัคร' + ROLE[target] + 'สุขนคร', 'me');
          return 'สมัครเรียบร้อย! ออกไปหาเสียงที่ตลาดและศูนย์วัฒนธรรมก่อนวันเลือกตั้งเดือนพฤศจิกายน';
        }
      }));
    }
    if (P.cand) {
      out.push(A({ key: 'poll', group: gC, icon: '📊', name: 'ดูโพลล่าสุด (' + ROLE[P.cand.office] + ')', desc: 'ประเมินคะแนนนิยมเทียบคู่แข่ง', slots: 0,
        run: function (s) { var me = G.candPower(); return 'โพลชี้ว่าคุณได้ราว ' + Math.round(me / (me + P.cand.opp) * 100) + '% เทียบกับคู่แข่งหลัก ' + (me > P.cand.opp ? '— นำอยู่!' : '— ยังตามหลัง ต้องหาเสียงเพิ่ม'); } }));
    }
    if (P.office) {
      var gO = '🏛️ หน้าที่' + ROLE[P.office.role] + ' (คะแนนนิยม ' + Math.round(P.approval) + '%)';
      out.push(A({
        key: 'council:meet', group: gO, icon: '🪑', name: P.office.role === 'mayor' ? 'ประชุมคณะผู้บริหารและฟังเสียงประชาชน' : 'เข้าประชุมสภาเมือง', desc: 'หน้าที่ประจำ • ควรทำอย่างน้อยเดือนละ 2 ครั้ง', slots: 1, energy: 10,
        run: function (s) { P.office.meets = (P.office.meets || 0) + 1; P.approval = C(P.approval + 1, 0, 100); G.nudge('trust', 0.3, 'volunteer'); s.civic += 2; G.skill('mgmt', 0.6); return SK.pick(['อภิปรายเรื่องงบประมาณจนได้ข้อสรุป', 'ซักถามความคืบหน้าโครงการของเมือง', 'รับฟังข้อร้องเรียนของประชาชนกว่ายี่สิบเรื่อง']); }
      }));
      if (P.office.role === 'council') {
        SK.MKEYS.slice().sort(function (a, b) { return s.city.m[a] - s.city.m[b]; }).slice(0, 3).forEach(function (m) {
          out.push(A({
            key: 'motion:' + m, group: gO, icon: SK.METRICS[m].icon, name: 'ยื่นญัตติเพิ่มงบ' + SK.METRICS[m].name + ' (ระดับ ' + s.city.budget[m] + ')', desc: 'เดือนละครั้ง • ผ่านหรือไม่ขึ้นกับคะแนนนิยมและงบคงคลัง', slots: 1, energy: 8,
            check: function (s) { return s.day - P.motions < 28 ? 'ยื่นญัตติได้เดือนละครั้ง' : s.city.budget[m] >= 4 ? 'งบด้านนี้เต็มแล้ว' : null; },
            run: function (s) {
              P.motions = s.day;
              var p = C(0.3 + P.approval / 200 + (s.city.treasury > 200 ? 0.15 : -0.1), 0.1, 0.9);
              if (SK.chance(p)) { s.city.budget[m]++; s.civic += 5; P.approval = C(P.approval + 3, 0, 100); G.news('สภาเมืองผ่านญัตติของ' + s.name + ' เพิ่มงบ' + SK.METRICS[m].name, 'city'); return '✅ ญัตติผ่าน! งบ' + SK.METRICS[m].name + 'เพิ่มเป็นระดับ ' + s.city.budget[m]; }
              P.approval = C(P.approval - 1, 0, 100); return 'ญัตติไม่ผ่านสภา ต้องรวบรวมเสียงสนับสนุนมากกว่านี้';
            }
          }));
        });
      } else {
        SK.MKEYS.forEach(function (m) {
          out.push(A({
            key: 'bud+:' + m, group: '💰 ปรับงบประมาณเมือง (นายกฯ) — งบคงคลัง ' + Math.round(s.city.treasury) + ' ล้าน', icon: SK.METRICS[m].icon, name: 'เพิ่มงบ' + SK.METRICS[m].name + ' (' + s.city.budget[m] + '→' + (s.city.budget[m] + 1) + ')', desc: 'ใช้งบเพิ่มวันละ 1 ล้าน • ตัวชี้วัดนี้ดีขึ้นระยะยาว', slots: 0,
            check: function (s) { return s.city.budget[m] >= 4 ? 'สูงสุดแล้ว' : null; },
            run: function (s) { s.city.budget[m]++; return 'เพิ่มงบ' + SK.METRICS[m].name + 'แล้ว'; }
          }));
          out.push(A({
            key: 'bud-:' + m, group: '💰 ปรับงบประมาณเมือง (นายกฯ) — งบคงคลัง ' + Math.round(s.city.treasury) + ' ล้าน', icon: '➖', name: 'ลดงบ' + SK.METRICS[m].name + ' (' + s.city.budget[m] + '→' + (s.city.budget[m] - 1) + ')', desc: 'ประหยัดงบวันละ 1 ล้าน • ตัวชี้วัดนี้จะค่อยๆ ลดลง', slots: 0,
            check: function (s) { return s.city.budget[m] <= 0 ? 'ต่ำสุดแล้ว' : null; },
            run: function (s) { s.city.budget[m]--; P.approval = C(P.approval - 1.5, 0, 100); return 'ลดงบ' + SK.METRICS[m].name + 'แล้ว'; }
          }));
        });
        SK.POLICIES.filter(function (p) { return !p.election && !p.budget && s.city.policies.indexOf(p.id) < 0; }).slice(0, 6).forEach(function (p) {
          out.push(A({
            key: 'approve:' + p.id, group: '📜 อนุมัติโครงการ (นายกฯ เดือนละ 1 โครงการ)', icon: p.icon, name: p.name + ' • ' + p.cost + ' ล้านบาท', desc: p.text, slots: 1, energy: 6,
            check: function (s) { return s.day - (P.office.approved || -99) < 28 ? 'อนุมัติได้เดือนละ 1 โครงการ' : s.city.treasury < p.cost ? 'งบคงคลังไม่พอ' : null; },
            run: function (s) { P.office.approved = s.day; G.adoptPolicy(p); P.approval = C(P.approval + 2, 0, 100); return 'ลงนามอนุมัติโครงการ ' + p.name + ' แล้ว'; }
          }));
        });
      }
    }
    return out.concat(list);
  });
  // หาเสียง
  ['market', 'culture', 'park'].forEach(function (loc) {
    wrap(loc, function (s, list) {
      G.ensurePol(s);
      if (!s.pol.cand) return list;
      list.unshift(A({
        key: 'campaign', group: '📣 หาเสียงเลือกตั้ง', icon: '📣', name: 'ลงพื้นที่หาเสียง พบปะประชาชน', desc: 'คะแนนหาเสียงตอนนี้ ' + Math.round(s.pol.cand.score) + ' • ทักษะบริการช่วยได้มาก', slots: 1, energy: 18, cost: 200,
        run: function (s) { var g = 3 + s.skills.service / 20 + s.skills.mgmt / 40 + SK.range(0, 3); s.pol.cand.score += g; s.civic += 1; G.mod('mood', 3); return SK.pick(['จับมือแม่ค้าทั้งตลาด ได้ฟังปัญหาจริง', 'ปราศรัยสั้นๆ มีคนหยุดฟังเยอะ', 'แจกใบปลิวนโยบายและรับฟังข้อเสนอ']) + ' (+' + g.toFixed(1) + ')'; }
      }));
      return list;
    });
  });

  G.candPower = function () {
    var s = S(), c = s.pol.cand;
    var endorse = SK.NPC_KEYS.filter(function (id) { return G.rel(id) >= 50; }).length * 3;
    var base = c.score + endorse + s.civic / 8 + (c.office === 'mayor' ? s.pol.approval / 3 : 0);
    if (s.city.m.trust < 50) base *= 0.9;
    return base;
  };
  var oResolve = G.resolveBallot;
  G.resolveBallot = function () {
    var s = S(), b = s.ballot;
    G.ensurePol(s);
    var wasElection = b && b.kind === 'election';
    oResolve();
    if (!wasElection) return;
    var P = s.pol;
    // นายกฯ ที่ไม่ได้ลงสมัครใหม่ → ครบวาระ
    if (P.office && P.office.role === 'mayor' && !P.cand) {
      var re = P.approval + SK.rint(-10, 10) > 55;
      if (re) { P.terms++; G.news(s.name + ' ได้รับเลือกเป็นนายกเทศมนตรีอีกสมัย (คะแนนนิยม ' + Math.round(P.approval) + '%)', 'city'); G.log('🎉 ชาวเมืองเลือกคุณเป็นนายกฯ อีกสมัย!', 'good'); }
      else { G.leaveOffice('แพ้การเลือกตั้งนายกฯ สมัยใหม่'); }
      return;
    }
    if (P.office && P.office.role === 'council' && !P.cand) { G.leaveOffice('ครบวาระสมาชิกสภาเมือง'); return; }
    if (!P.cand) return;
    var c = P.cand, me = G.candPower() + SK.range(-8, 8);
    if (me > c.opp) {
      G.earn(c.deposit, 'คืนเงินประกันการสมัคร');
      P.office = { role: c.office, since: s.day, meets: 0 }; P.terms++; P.approval = 55 + Math.min(20, (me - c.opp) / 2);
      if (c.office === 'mayor') {
        if (s.job) { s.job = null; G.log('💼 ลาออกจากงานประจำเพื่อทำหน้าที่นายกเทศมนตรีเต็มเวลา', 'n'); }
        s.pop2.mod.mayor = s.pop2.mod.mayor || {}; s.pop2.mod.mayor.role = 'อดีตนายกเทศมนตรี'; s.pop2.mod.mayor.sched = { wd: ['park', 'culture', 'temple'], we: ['temple', 'park', 'culture'] };
        G.syncNPCs(s);
      }
      G.news('🎉 ' + s.name + ' ชนะเลือกตั้ง เป็น' + ROLE[c.office] + 'สุขนคร', 'city');
      G.log('🎉 ชนะการเลือกตั้ง! คุณคือ' + ROLE[c.office] + 'คนใหม่ของสุขนคร', 'good');
      G.mod('mood', 25); s.civic += 15;
    } else {
      G.news(s.name + ' แพ้การเลือกตั้ง' + ROLE[c.office] + 'อย่างสูสี', 'city');
      G.log('😔 แพ้การเลือกตั้งครั้งนี้ ' + (me > c.opp * 0.8 ? 'อย่างสูสี' : '') + ' เงินประกันไม่ได้คืน ปีหน้าลองใหม่ได้', 'bad');
      if (P.office && P.office.role === 'council') G.leaveOffice('ครบวาระสมาชิกสภาเมือง');
      G.mod('mood', -10);
    }
    P.cand = null;
  };
  G.leaveOffice = function (why) {
    var s = S(), P = s.pol;
    if (!P.office) return;
    if (P.office.role === 'mayor' && s.pop2.mod.mayor) { delete s.pop2.mod.mayor.role; delete s.pop2.mod.mayor.sched; G.syncNPCs(s); }
    G.log('🏛️ ' + why + ' ขอบคุณที่รับใช้ชาวเมือง', 'n');
    G.news(s.name + ' ' + why, 'city');
    P.office = null;
  };
  var oMonthly = G.lifeMonthly;
  G.lifeMonthly = function (items) {
    oMonthly(items);
    var s = S(); G.ensurePol(s);
    var P = s.pol;
    if (!P.office) return;
    var pay = Math.round((P.office.role === 'mayor' ? 45000 : 15000) * cpi());
    G.earn(pay, 'ค่าตอบแทน' + ROLE[P.office.role], true);
    var meets = P.office.meets || 0;
    P.approval = C(P.approval + (meets >= 2 ? 1 : -4) + (P.office.role === 'mayor' ? (G.cityScore() - 72) * 0.8 + (s.city.treasury < 0 ? -6 : 0.5) : 0) + SK.range(-2, 2), 0, 100);
    P.office.meets = 0;
    if (meets < 2) items.push('⚠️ เข้าประชุมน้อยเกินไป คะแนนนิยมลดลง');
  };
  // เหตุการณ์นายกฯ เดินตลาด ไม่เกิดตอนเราเป็นนายกฯ เอง
  if (SK.EV.mayorwalk) { var ow = SK.EV.mayorwalk.w; SK.EV.mayorwalk.w = function (s, c, i) { return G.isMayor() ? 0 : ow(s, c, i); }; }
  var oNew = G.newState; G.newState = function (o) { var s = oNew(o); G.ensurePol(s); return s; };
  var oImp = G.importJSON; G.importJSON = function (r) { var ok = oImp(r); if (ok) G.ensurePol(SK.S); return ok; };

  SK.ACHIEVEMENTS.push(
    { id: 'councilor', icon: '🎙️', name: 'ผู้แทนประชาชน', desc: 'ได้รับเลือกเป็นสมาชิกสภาเมือง', test: function (s) { return s.pol && s.pol.terms > 0; } },
    { id: 'mayorach', icon: '🏛️', name: 'ท่านนายกฯ', desc: 'ได้เป็นนายกเทศมนตรีสุขนคร', test: function (s) { return s.pol && s.pol.office && s.pol.office.role === 'mayor'; } }
  );
})();
