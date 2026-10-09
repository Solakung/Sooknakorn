/* สุขนคร — dialogue.js : ระบบบทสนทนา (ใช้บทที่เขียนไว้ล่วงหน้าใน dialogue_data.js)
   กด "พูดคุย" → คำทักทายตามบริบท → เลือกหัวข้อได้ 3 หัวข้อต่อครั้ง */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, C = SK.clamp;
  function S() { return SK.S; }
  G.pendingDlg = null;
  G.afterDlg = null;

  var ARCH_SKILL = { office: 'mgmt', teacher: 'care', nurse: 'care', coder: 'digital', artist: 'craft', baker: 'service', mechanic: 'craft', elder: 'care', athlete: 'service', green: 'craft', clerk: 'mgmt' };

  G.dlgSet = function (id) {
    var n = SK.NPCS[id], base = SK.DLG[id];
    if (n.kid) return { kind: 'kid', greet: [SK.DLG_KID.greet, SK.DLG_KID.greet, SK.DLG_KID.greet], life: [SK.DLG_KID.life, SK.DLG_KID.life], deep: SK.DLG_KID.deep, advice: (SK.DLG_ARCH[n.arch] || SK.DLG_ARCH.office).advice, skill: ARCH_SKILL[n.arch] || 'mgmt', fun: SK.DLG_KID.fun };
    if (base && !n.successorOf) return base;
    var g = SK.DLG_GENERIC;
    if (base && n.successorOf) {
      var lines = (n.lines || []).concat(g.greet);
      return { kind: 'succ', greet: [lines, lines, lines], life: [g.life.concat(n.lines || []), g.life], advice: base.advice, deep: g.deep, city: base.city, skill: base.skill, fun: g.fun };
    }
    var a = SK.DLG_ARCH[n.arch];
    if (a) return { kind: 'arch', greet: [a.greet, a.greet.concat(g.greet), a.greet.concat(g.greet)], life: [a.life, a.life.concat(n.lines || [])], advice: a.advice, deep: a.deep.concat(g.deep.slice(2)), skill: ARCH_SKILL[n.arch] || 'mgmt', fun: (a.fun || []).concat(g.fun || []) };
    return { kind: 'gen', greet: [g.greet, g.greet, g.greet], life: [g.life, g.life], advice: ['ดูแลตัวเองดีๆ นะ'], deep: g.deep, skill: 'service', fun: g.fun };
  };
  G.dlgTier = function (id) { var v = G.rel(id); return v >= 60 ? 2 : v >= 25 ? 1 : 0; };
  function fill(t, id) { var s = S(); return String(t).replace(/\{p\}/g, s.name).replace(/\{n\}/g, SK.nn(id)); }
  function pickCtx(s, id) {
    var X = SK.DLG_CTX, c = [], info = SK.dayInfo(s.day), n = SK.NPCS[id];
    if (s.pol && s.pol.office) c.push(s.pol.office.role === 'mayor' ? X.mayor : X.council);
    if (s.love && s.love.stage === 'married' && s.day - s.love.since < 30) c.push(X.married);
    if (s.love && s.love.child && s.day - s.love.child.born < 30) c.push(X.baby);
    if (s.log.some(function (l) { return s.day - l.d < 14 && /ได้เลื่อนตำแหน่ง/.test(l.m); })) c.push(X.promoted);
    if (s.log.some(function (l) { return s.day - l.d < 20 && /ชนะเลิศ/.test(l.m); })) c.push(X.champion);
    if (s.sick) c.push(X.sick); else if (s.mood < 35) c.push(X.sad); else if (s.energy < 25) c.push(X.tired);
    if (info.holiday) c.push(X.holiday.map(function (t) { return t.replace('{h}', info.holiday); }));
    if (n.gen && s.day - (n.since || 0) < 30 && !n.kid) c.push(X.newcomer);
    if (s.shops && s.shops.some(function (x) { return x.owner === id && s.day - x.since < 30; })) c.push(X.shopOwner);
    if ((s.age || 0) >= 60 && SK.chance(0.3)) c.push(X.oldAge);
    if (s.weather && X[s.weather.k]) c.push(X[s.weather.k]);
    c.push(s.slot === 0 ? X.morning : s.slot === 2 ? X.evening : []);
    c = c.filter(function (x) { return x && x.length; });
    if (!c.length) return null;
    return SK.chance(0.5) ? c[0] : SK.pick(c);
  }

  G.dlgOpen = function (id) {
    var s = S(), n = SK.NPCS[id], set = G.dlgSet(id), tier = G.dlgTier(id);
    var greet = fill(SK.pick(set.greet[tier] || set.greet[0]), id);
    var ctx = pickCtx(s, id);
    if (ctx && SK.chance(0.4)) greet = fill(SK.pick(ctx), id) + ' ' + greet;
    var r = G.relObj(id), topics = [
      { k: 'life', label: '💬 ช่วงนี้เป็นยังไงบ้าง' },
      { k: 'city', label: '🏙️ คิดยังไงกับเมืองช่วงนี้' },
      { k: 'advice', label: '💡 ขอคำแนะนำหน่อย' },
      { k: 'news', label: '🗣️ มีข่าวอะไรในเมืองบ้าง' },
      { k: 'fun', label: '😄 มีเรื่องสนุกๆ เล่าไหม' }
    ];
    topics.push(tier >= 2 ? { k: 'deep', label: '🫂 เล่าเรื่องของตัวเองให้ฟังหน่อย' } : { k: 'deep', label: '🔒 เรื่องส่วนตัว (สนิท 60 ขึ้นไป)', locked: true });
    if (n.dateable && s.love && s.love.stage === 'single' && r.v >= 40 && set.flirt) topics.push({ k: 'flirt', label: '💓 ชวนคุยเรื่องหัวใจ' });
    if (s.love && s.love.id === id) topics.push({ k: 'love', label: '💞 คุยกันแบบคนรัก' });
    return { id: id, name: n.name, icon: n.icon, role: n.role, age: Math.floor(G.npcAge ? G.npcAge(id) : 30), tier: tier, rel: Math.round(r.v), greet: greet, topics: topics };
  };

  function once(id, k) {
    var s = S(), r = G.relObj(id);
    r.dt = r.dt || {};
    if (r.dt[k] === s.day) return false;
    r.dt[k] = s.day; return true;
  }
  G.dlgTopic = function (id, k) {
    var s = S(), n = SK.NPCS[id], set = G.dlgSet(id), tier = G.dlgTier(id), r = G.relObj(id), t = '';
    if (k === 'life') {
      t = SK.pick(tier >= 2 && set.life[1] ? set.life[0].concat(set.life[1]) : set.life[0]);
      if (once(id, k)) G.addRel(id, 0.7);
    } else if (k === 'city') {
      var keys = SK.MKEYS.slice().sort(function (a, b) { return s.city.m[a] - s.city.m[b]; });
      var low = s.city.m[keys[0]] < 62, m = low ? keys[0] : keys[keys.length - 1];
      var pool = set.city ? (low ? set.city.low : set.city.high) : (low ? ['ช่วงนี้{m}ไม่ค่อยดีนะ หวังว่าจะดีขึ้นเร็วๆ', 'เรื่อง{m}น่าห่วงจริงๆ'] : ['ฉันว่า{m}ดีขึ้นเยอะเลยนะ', 'เมืองเราเก่งเรื่อง{m}จริงๆ']);
      t = SK.pick(pool).replace(/\{m\}/g, SK.METRICS[m].name) + ' (' + SK.METRICS[m].icon + ' ' + Math.round(s.city.m[m]) + ')';
      if (once(id, k)) G.addRel(id, 0.4);
    } else if (k === 'advice') {
      t = SK.pick(set.advice);
      if (once(id, k)) { G.skill(set.skill || 'mgmt', 0.4); t += ' (ได้ความรู้ +' + SK.SKILLS[set.skill || 'mgmt'].name + ')'; }
    } else if (k === 'news') {
      var gt = G.gossipTarget ? G.gossipTarget(id) : null;
      if (gt && once(id, 'gossip') && SK.chance(0.6)) {
        G.afterDlg = { ev: 'gossip', ctx: gt };
        t = 'เออ… มีเรื่องจะเล่าเกี่ยวกับ' + SK.nn(gt.b) + ' (เล่าต่อหลังคุยจบ)';
      } else {
        var cn = s.news.filter(function (x) { return x.k === 'city' && s.day - x.d < 45; });
        t = cn.length ? 'ได้ยินไหม ' + SK.pick(cn.slice(0, 8)).m : 'ช่วงนี้เงียบๆ นะ ไม่ค่อยมีข่าวอะไร';
      }
    } else if (k === 'deep') {
      if (tier < 2) return 'ยังไม่สนิทพอจะเล่าเรื่องส่วนตัวนะ ไว้วันหลัง';
      r.deep = r.deep || 0;
      if (r.deep < set.deep.length) { t = set.deep[r.deep]; r.deep++; G.addRel(id, 2); G.mod('mood', 2); t += ' (' + r.deep + '/' + set.deep.length + ')'; }
      else { t = SK.pick(['ขอบคุณที่ฟังเรื่องของฉันมาตลอดนะ', 'คุยกับเธอแล้วสบายใจทุกครั้ง', 'ฉันเล่าให้เธอฟังหมดแล้ว ไม่เคยเล่าให้ใครฟังขนาดนี้มาก่อน']); if (once(id, k)) G.addRel(id, 0.8); }
    } else if (k === 'fun') {
      t = SK.pick(set.fun && set.fun.length ? set.fun : (SK.DLG_GENERIC.fun || ['วันนี้ยังไม่มีเรื่องตลกเลย ไว้คราวหน้านะ']));
      if (once(id, k)) { G.addRel(id, 0.6); G.mod('mood', 3); }
    } else if (k === 'flirt') {
      t = SK.pick(set.flirt || ['…เขินนะ']);
      if (once(id, k)) { G.addRel(id, 2); G.mod('mood', 4); }
    } else if (k === 'love') {
      t = SK.pick(['วันนี้คิดถึงทั้งวันเลย', 'กลับบ้านไปกินข้าวด้วยกันนะ', 'ขอบคุณที่อยู่ข้างกันเสมอ', 'ไม่ว่าจะเหนื่อยแค่ไหน เห็นหน้ากันก็หายหมด', 'อยากแก่ไปด้วยกันแบบนี้']);
      if (once(id, k)) { s.love.bond = C(s.love.bond + 3, 0, 100); G.mod('mood', 5); }
    }
    return fill(t, id);
  };

  // ปุ่ม "พูดคุย" → เปิดบทสนทนา
  var oGet = SK.getActions;
  SK.getActions = function (locId, s) {
    var list = oGet(locId, s);
    list.forEach(function (a) {
      if (!/^talk:/.test(a.key)) return;
      var id = a.key.slice(5), orun = a.run;
      a.name = 'พูดคุยกับ' + SK.nn(id);
      a.desc = 'เปิดบทสนทนา เลือกหัวข้อคุยได้ • ' + a.desc.replace(/^เพิ่มความสนิท • /, '');
      a.run = function (st) {
        orun(st);
        var o = G.dlgOpen(id);
        G.pendingDlg = o;
        return SK.NPCS[id].icon + ' ' + SK.nn(id) + ': "' + o.greet + '"';
      };
    });
    return list;
  };
  // ระบบกิจวัตรไม่ต้องเปิดหน้าต่างคุย
  var oRun = SK.R.run;
  SK.R.run = function (d) { var r = oRun(d); G.pendingDlg = null; G.afterDlg = null; return r; };
  G.dlgClose = function () {
    var a = G.afterDlg; G.afterDlg = null;
    if (a && !S().pendingEvent) G.startEvent(a.ev, a.ctx);
  };
})();
