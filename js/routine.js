/* สุขนคร — routine.js : กิจวัตรอัตโนมัติ (เล่นเร็วหลายวัน) */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, C = SK.clamp;
  var R = (SK.R = {});
  function S() { return SK.S; }

  function tryDo(loc, key) {
    var r = G.perform(loc, key);
    return r.ok;
  }

  // ย่านที่อาสาได้ตามตัวชี้วัด
  var VOL = {
    environment: ['park', 'vol:environment'], health: ['hospital', 'vol:health'], education: ['school', 'vol:education'],
    safety: ['police', 'vol:safety'], culture: ['culture', 'vol:culture'], trust: ['townhall', 'vol:trust'], transport: ['station', 'vol:transport']
  };

  R.studyOne = function () {
    var s = S(), pick = null;
    // คอร์สที่กำลังเรียน/เลือกไว้
    var cand = [];
    SK.COURSES.forEach(function (c) {
      if (SK.H.courseDone(s, c)) return;
      if (SK.H.courseReqMiss(s, c).length) return;
      var prog = s.courses[c.id] || 0;
      cand.push({ c: c, prog: prog, focus: s.flags.focusCourse === c.id });
    });
    cand.sort(function (a, b) { return (b.focus - a.focus) || (b.prog - a.prog); });
    if (cand.length && (cand[0].focus || cand[0].prog > 0)) pick = cand[0].c;
    if (pick && tryDo('school', 'course:' + pick.id)) return true;
    // ฝึกทักษะที่ต่ำสุดที่เกี่ยวกับงาน
    var key = null;
    if (s.job) key = SK.TRACKS[s.job.track].skill;
    if (!key || s.skills[key] >= 100) {
      key = Object.keys(s.skills).sort(function (a, b) { return s.skills[a] - s.skills[b]; })[0];
    }
    return tryDo('library', 'study:' + key) || tryDo('home', 'study:' + key);
  };

  R.exec = function (opt) {
    var s = S(), info = SK.dayInfo(s.day);
    switch (opt) {
      case 'work':
        if (!s.job) return R.exec('auto');
        if (tryDo('work', 'shift')) return true;
        if (s.slot === 2 && tryDo('work', 'ot')) return true;
        if (tryDo('work', 'half')) return true;
        return false;
      case 'half':
        return s.job ? tryDo('work', 'half') : false;
      case 'study':
        return R.studyOne();
      case 'cook':
        if (s.groceries < 3 && s.meals < 4) tryDo('market', 'groc');
        return tryDo('home', 'cook') || tryDo('home', 'rest');
      case 'gym':
        return tryDo('gym', 'workout') || tryDo('park', 'jog') || tryDo('park', 'walk');
      case 'social': {
        var ids = SK.NPC_KEYS.filter(function (id) { return G.rel(id) < 98; });
        var pool = [];
        ids.forEach(function (id) {
          var n = SK.NPCS[id], arr = info.off ? n.sched.we : n.sched.wd, loc = arr[s.slot];
          pool.push([id, loc, 100 - G.rel(id)]);
        });
        var tot = pool.reduce(function (a, b) { return a + b[2]; }, 0), r = SK.rand() * tot, chosen = pool[0];
        for (var i = 0; i < pool.length; i++) { r -= pool[i][2]; if (r <= 0) { chosen = pool[i]; break; } }
        if (chosen && tryDo(chosen[1], 'talk:' + chosen[0])) return true;
        return tryDo('park', 'walk') || tryDo('home', 'rest');
      }
      case 'volunteer': {
        var low = Object.keys(VOL).sort(function (a, b) { return s.city.m[a] - s.city.m[b]; });
        for (var j = 0; j < low.length; j++) { var v = VOL[low[j]]; if (tryDo(v[0], v[1])) return true; }
        return tryDo('park', 'vol:environment');
      }
      case 'gig':
        if (s.inv.computer && s.skills.digital >= 25 && tryDo('home', 'freelance')) return true;
        if (((s.mode === 'bike' && s.inv.bike) || (s.mode === 'car' && s.inv.car)) && tryDo('station', 'rider')) return true;
        return tryDo('cafe', 'part') || tryDo('market', 'stall');
      case 'biz':
        if (!s.business) return false;
        if (s.business.cashbox > 1 || s.business.cashbox < -1) tryDo('biz', 'collect');
        return tryDo('biz', 'manage');
      case 'rest':
        return tryDo('home', 'rest');
      case 'auto':
      default:
        return R.auto();
    }
  };

  R.auto = function () {
    var s = S();
    if (s.energy < 32) return tryDo('home', 'rest');
    if (s.sick) return tryDo('hospital', 'clinic') || tryDo('home', 'rest');
    if (s.meals < 2 && s.meals < G.fridgeCap() - 5) {
      if (s.groceries < 3) tryDo('market', 'groc');
      if (s.groceries >= 3 && tryDo('home', 'cook')) return true;
    }
    if (s.business && (s.business.quality < 55)) { if (tryDo('biz', 'manage')) return true; }
    if (s.mood < 40) return tryDo('park', 'yoga') || tryDo('home', 'entertain');
    // เรียนต่อถ้ากำลังเรียนอยู่
    var learning = SK.COURSES.some(function (c) { return (s.courses[c.id] || 0) > 0 && !SK.H.courseDone(s, c); });
    if (learning && s.energy > 45 && G.total() > 600 && R.studyOne()) return true;
    if (!s.job && s.energy > 40) {
      // หางาน
      if (s.openings.length) {
        for (var i = 0; i < s.openings.length; i++) {
          var op = s.openings[i];
          if (G.meetsReq(op.track, op.level).ok && tryDo('jobs', 'apply:' + i)) return true;
        }
      }
      if (G.total() < 3000 && (tryDo('cafe', 'part') || tryDo('market', 'stall'))) return true;
    }
    if (s.fitness < 40 && s.energy > 45) return tryDo('park', 'jog') || tryDo('park', 'walk');
    if (G.total() < 2500 && s.energy > 40 && (R.exec('gig'))) return true;
    var r = SK.rand();
    if (r < 0.25) return R.exec('volunteer');
    if (r < 0.5) return R.exec('social');
    if (r < 0.7) return tryDo('park', 'walk');
    if (r < 0.85) return R.studyOne();
    return tryDo('home', 'rest');
  };

  R.prepare = function () {
    var s = S();
    // อาหาร
    var guard = 0;
    while (s.sat < 62 && guard++ < 3) {
      if (s.meals > 0 && tryDo('home', 'eat')) continue;
      if (G.total() >= G.streetPrice() && tryDo('market', 'street')) continue;
      if (s.pendingEvent) break;
      tryDo('social', 'foodbank');
      break;
    }
    // ชำระค่าเดินทางรายเดือนอัตโนมัติ
    if (s.mode === 'bus' && s.passUntil - s.day < 1 && G.total() > 2500) tryDo('station', 'pass');
    if (s.business && Math.abs(s.business.cashbox) > 3000) tryDo('biz', 'collect');
  };

  R.runDay = function () {
    var s = S(), startDay = s.day, guard = 0;
    while (s.day === startDay && !s.pendingEvent && guard++ < 14) {
      R.prepare();
      if (s.day !== startDay) break;
      var info = SK.dayInfo(s.day), plan = info.off ? s.routine.we : s.routine.wd;
      var opt = plan[s.slot] || 'auto';
      var ok = false;
      if (s.energy < 14) ok = tryDo('home', 'rest'); else ok = R.exec(opt);
      if (!ok && s.day === startDay) ok = tryDo('home', 'rest');
      if (!ok && s.day === startDay && !s.pendingEvent) { G.sleepNow(); }
    }
    return s.day !== startDay;
  };

  // รันกิจวัตรหลายวัน หยุดเมื่อมีเหตุการณ์/สรุปเดือน/สุขภาพแย่/ครบปี
  R.run = function (days) {
    var s = S(), done = 0, reason = null;
    G.msgs = [];
    s.flags.newStatement = false;
    for (var i = 0; i < days; i++) {
      R.runDay();
      done++;
      if (s.pendingEvent) { reason = 'event'; break; }
      if (s.flags.newStatement) { reason = 'month'; break; }
      if (s.flags.yearEnd && !s.flags.yearSeen) { reason = 'year'; break; }
      if (s.health < 22) { reason = 'health'; break; }
    }
    G.save();
    return { days: done, reason: reason };
  };
})();
