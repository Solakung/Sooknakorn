/* สุขนคร — kids.js : การศึกษาและนิสัยของลูก
   ลูกเกิดมาพร้อมความถนัดและนิสัย • กิจกรรมกับลูกหลายแบบปั้นความสามารถ 5 ด้าน
   เลือกโรงเรียนตอน 6 ขวบ และสายการเรียนตอน 12 ขวบ • อาชีพตอนโตมาจากสิ่งที่ปั้น */
(function () {
  var SK = (window.SK = window.SK || {});
  var G = SK.G, B = SK.B, C = SK.clamp;
  function S() { return SK.S; }
  function A(o) { var d = { slots: 0, cost: 0, energy: 0, group: '', desc: '', icon: '•', check: null, run: null }; for (var k in o) d[k] = o[k]; return d; }

  var ST = {
    aca: { name: 'วิชาการ', icon: '📚' }, spo: { name: 'กีฬา', icon: '⚽' }, art: { name: 'ศิลปะ', icon: '🎨' },
    cra: { name: 'ประดิษฐ์/ช่าง', icon: '🔧' }, car: { name: 'ใส่ใจผู้อื่น', icon: '💗' }
  };
  SK.KID_ST = ST;
  var TRAITS = ['ขี้อายแต่ช่างสังเกต', 'ช่างพูดช่างเจรจา', 'ดื้อนิดๆ แต่มุ่งมั่น', 'ใจดีกับทุกคน', 'อยากรู้อยากเห็นทุกเรื่อง', 'ร่าเริงไม่อยู่นิ่ง'];
  var SCHOOLS = {
    public: { name: 'โรงเรียนเทศบาลใกล้บ้าน (ฟรี)', fee: 0, boost: { aca: 1, car: 0.5 } },
    bilingual: { name: 'โรงเรียนสองภาษา', fee: 6000, boost: { aca: 2.2, art: 0.3 } },
    arts: { name: 'โรงเรียนกีฬาและศิลปะ', fee: 3000, boost: { spo: 1.5, art: 1.5 } }
  };
  var TRACKS = {
    sci: { name: 'สายสามัญ (วิทย์-คณิต/ภาษา)', fee: 0, boost: { aca: 1.8 } },
    voc: { name: 'สายอาชีพ ปวช.', fee: 0, boost: { cra: 2, car: 0.3 } },
    tal: { name: 'สายกีฬา-ศิลปะ', fee: 1500, boost: { spo: 1.2, art: 1.2 } }
  };

  G.ensureKid = function (c) {
    if (!c) return c;
    if (!c.st) {
      var keys = Object.keys(ST);
      c.st = {}; keys.forEach(function (k) { c.st[k] = SK.rint(2, 8); });
      c.talent = SK.pick(keys); c.st[c.talent] += 6;
      c.trait = SK.pick(TRAITS);
      c.school = null; c.track = null;
    }
    return c;
  };
  G.kidTop = function (c) { return Object.keys(ST).sort(function (a, b) { return c.st[b] - c.st[a]; }); };
  G.kidArch = function (c) {
    G.ensureKid(c);
    var t = G.kidTop(c);
    var map = { aca: c.st.car > c.st.cra ? 'teacher' : 'coder', spo: 'athlete', art: 'artist', cra: 'mechanic', car: 'nurse' };
    if (t[0] === 'aca' && c.st.aca > 60 && SK.chance(0.4)) return 'office';
    return map[t[0]];
  };
  var oCost = G.childCost;
  G.childCost = function () {
    var s = S(), c = s.love && s.love.child, x = oCost();
    if (c) { if (c.school && SCHOOLS[c.school]) x += SCHOOLS[c.school].fee; if (c.track && TRACKS[c.track]) x += TRACKS[c.track].fee; }
    return Math.round(x * (s.econ ? s.econ.cpi : 1));
  };

  // กิจกรรมกับลูกตามวัย
  var ACTS = [
    ['aca', 'kid:study', '📚', 'ติวหนังสือ / อ่านหนังสือด้วยกัน', ['ช่วยลูกทำโจทย์คณิตจนเข้าใจ', 'อ่านสารานุกรมเด็กด้วยกัน ลูกถามไม่หยุด', 'ลูกสะกดคำยากได้เป็นครั้งแรก']],
    ['spo', 'kid:sport', '⚽', 'พาลูกไปเล่นกีฬาที่สวน', ['เตะบอลกันจนเหงื่อท่วม', 'ลูกว่ายน้ำได้ไกลขึ้นอีกห้าเมตร', 'สอนลูกปั่นจักรยานจนไม่ต้องมีล้อช่วย']],
    ['art', 'kid:art', '🎨', 'วาดรูป ร้องเพลง เล่นดนตรีกับลูก', ['ลูกวาดรูปบ้านเราติดตู้เย็น', 'ร้องเพลงคู่กันจนเพื่อนบ้านปรบมือ', 'ลูกแต่งนิทานเองแล้วเล่าให้ฟัง']],
    ['cra', 'kid:make', '🔧', 'ประดิษฐ์ของ / ซ่อมของเล่นด้วยกัน', ['ต่อหุ่นยนต์กล่องกระดาษสำเร็จ', 'ซ่อมจักรยานคันเก่าด้วยกัน', 'ลูกประกอบโมเดลเองได้ทั้งตัว']],
    ['car', 'kid:care', '💗', 'พาลูกไปทำจิตอาสา / ดูแลสัตว์', ['พาลูกไปเยี่ยมบ้านพักคนชรา ลูกเล่านิทานให้คุณยายฟัง', 'ช่วยกันให้อาหารแมวจรในซอย', 'ลูกแบ่งขนมให้เพื่อนที่ไม่มี']]
  ];
  var oHome = B.home;
  B.home = function (s) {
    var list = oHome(s), c = s.love && s.love.child;
    if (!c) return list;
    G.ensureKid(c);
    var age = G.childAge(s);
    if (age < 3) return list;
    var g = '🧒 ปั้นความสามารถลูก (' + c.trait + ' • ถนัด' + ST[c.talent].name + ')';
    ACTS.forEach(function (x) {
      list.push(A({
        key: x[1], group: g, icon: x[2], name: x[3] + ' (' + ST[x[0]].name + ' ' + Math.floor(c.st[x[0]]) + ')', desc: 'เพิ่มความผูกพันและความสามารถด้าน' + ST[x[0]].name + (c.talent === x[0] ? ' • ลูกถนัดด้านนี้ พัฒนาเร็ว' : ''), slots: 1, energy: 7,
        check: function (s) { return s.flags['kidAct' + x[0]] === s.day ? 'วันนี้ทำกิจกรรมนี้กับลูกแล้ว' : null; },
        run: function (s) {
          s.flags['kidAct' + x[0]] = s.day;
          c.st[x[0]] = C(c.st[x[0]] + 2 + (c.talent === x[0] ? 1.5 : 0), 0, 100);
          c.bond = C(c.bond + 5, 0, 100); s.love.bond = C(s.love.bond + 1, 0, 100); G.mod('mood', 9);
          return SK.pick(x[4]);
        }
      }));
    });
    return list;
  };

  // รายเดือน: โรงเรียนช่วยพัฒนา + เหตุการณ์เลือกโรงเรียน
  var oMonthly = G.lifeMonthly;
  G.lifeMonthly = function (items) {
    oMonthly(items);
    var s = S(), c = s.love && s.love.child;
    if (!c) return;
    G.ensureKid(c);
    var age = G.childAge(s), f = s.ageRate / 5;
    Object.keys(ST).forEach(function (k) { c.st[k] = C(c.st[k] + 0.3 * f, 0, 100); });
    var sc = c.school && SCHOOLS[c.school], tr = c.track && TRACKS[c.track];
    [sc, tr].forEach(function (x) { if (x) for (var k in x.boost) c.st[k] = C(c.st[k] + x.boost[k] * f, 0, 100); });
  };
  var oNewDay = G.lifeNewDay;
  G.lifeNewDay = function (ni) {
    oNewDay(ni);
    var s = S(), c = s.love && s.love.child;
    if (!c || s.pendingEvent || s.ended) return;
    G.ensureKid(c);
    var age = G.childAge(s);
    if (age >= 6 && !c.school) G.startEvent('kidschool');
    else if (age >= 12 && !c.track) G.startEvent('kidtrack');
  };

  function schoolEv(id, title, text, table, field) {
    return {
      id: id, icon: '🏫', special: true, def: 0,
      init: function () { return {}; },
      title: title,
      text: function (s) { var c = s.love.child; G.ensureKid(c); var t = G.kidTop(c); return text(c) + ' ตอนนี้' + c.name + 'เด่นด้าน' + ST[t[0]].name + 'และ' + ST[t[1]].name; },
      choices: Object.keys(table).map(function (k) {
        var x = table[k];
        return { label: x.name + (x.fee ? ' (+฿' + SK.fmt(x.fee) + '/เดือน)' : ''), cost: 0, run: function (s) { s.love.child[field] = k; G.mod('mood', 4); return 'เลือก' + x.name + 'ให้' + s.love.child.name + 'แล้ว'; } };
      })
    };
  }
  [schoolEv('kidschool', 'ถึงเวลาเลือกโรงเรียนประถม', function (c) { return c.name + 'อายุ 6 ขวบแล้ว ต้องเลือกโรงเรียนประถม (' + c.trait + ')'; }, SCHOOLS, 'school'),
   schoolEv('kidtrack', 'เลือกสายการเรียนมัธยม', function (c) { return c.name + 'ขึ้นมัธยมแล้ว ถึงเวลาเลือกสายการเรียนที่เหมาะ'; }, TRACKS, 'track')
  ].forEach(function (e) { SK.EVENTS.push(e); SK.EV[e.id] = e; });

  // ลูกที่เกิดใหม่ได้ความถนัดทันที
  var oResolve = G.resolveEvent;
  G.resolveEvent = function (i) {
    var r = oResolve(i), s = S();
    if (s.love && s.love.child) G.ensureKid(s.love.child);
    return r;
  };
})();
