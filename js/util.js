/* สุขนคร — util.js : เครื่องมือพื้นฐาน (สุ่มแบบ seed, วันที่, ฟอร์แมตตัวเลข) */
(function () {
  var SK = (window.SK = window.SK || {});

  SK.S = null; // สถานะเกมปัจจุบัน

  SK.clamp = function (v, a, b) { return Math.max(a, Math.min(b, v)); };
  SK.fmt = function (n) { return Math.round(n).toLocaleString('en-US'); };
  SK.money = function (n) { return (n < 0 ? '-' : '') + '฿' + SK.fmt(Math.abs(n)); };
  SK.pct = function (n) { return Math.round(n) + '%'; };

  // สุ่มแบบ mulberry32 เก็บ seed ไว้ในสถานะเกม (เซฟ/โหลดแล้วผลสุ่มต่อเนื่อง)
  SK.rand = function () {
    var s = SK.S;
    s.seed = (s.seed + 0x6D2B79F5) | 0;
    var t = Math.imul(s.seed ^ (s.seed >>> 15), 1 | s.seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  SK.rint = function (a, b) { return a + Math.floor(SK.rand() * (b - a + 1)); };
  SK.range = function (a, b) { return a + SK.rand() * (b - a); };
  SK.pick = function (arr) { return arr[Math.floor(SK.rand() * arr.length)]; };
  SK.chance = function (p) { return SK.rand() < p; };

  // ---------- ปฏิทิน ----------
  SK.START = Date.UTC(2027, 0, 4); // เริ่มเกมวันจันทร์ที่ 4 ม.ค. 2027 (พ.ศ. 2570)
  SK.MONTHS = ['มกราคม', 'กุมภาพันธ์', 'มีนาคม', 'เมษายน', 'พฤษภาคม', 'มิถุนายน', 'กรกฎาคม', 'สิงหาคม', 'กันยายน', 'ตุลาคม', 'พฤศจิกายน', 'ธันวาคม'];
  SK.MONTHS_S = ['ม.ค.', 'ก.พ.', 'มี.ค.', 'เม.ย.', 'พ.ค.', 'มิ.ย.', 'ก.ค.', 'ส.ค.', 'ก.ย.', 'ต.ค.', 'พ.ย.', 'ธ.ค.'];
  SK.DOW = ['อาทิตย์', 'จันทร์', 'อังคาร', 'พุธ', 'พฤหัสบดี', 'ศุกร์', 'เสาร์'];
  SK.DOW_S = ['อา.', 'จ.', 'อ.', 'พ.', 'พฤ.', 'ศ.', 'ส.'];
  SK.SLOTS = ['เช้า', 'บ่าย', 'เย็น'];
  SK.SLOT_ICON = ['🌅', '☀️', '🌇'];

  SK.HOLIDAYS = {
    '0-1': 'วันขึ้นปีใหม่', '3-13': 'วันสงกรานต์', '3-14': 'วันสงกรานต์', '3-15': 'วันสงกรานต์',
    '4-1': 'วันแรงงานแห่งชาติ', '7-12': 'วันแม่แห่งชาติ', '9-23': 'วันปิยมหาราช',
    '10-13': 'วันลอยกระทง', '11-5': 'วันพ่อแห่งชาติ', '11-10': 'วันรัฐธรรมนูญ', '11-31': 'วันสิ้นปี'
  };

  var _cache = {};
  SK.dateOf = function (day) {
    if (_cache[day]) return _cache[day];
    var d = new Date(SK.START + day * 86400000);
    var m = d.getUTCMonth(), dd = d.getUTCDate(), y = d.getUTCFullYear();
    var o = {
      y: y, m: m, d: dd, dow: d.getUTCDay(), be: y + 543,
      key: y + '-' + m,
      dim: new Date(Date.UTC(y, m + 1, 0)).getUTCDate()
    };
    _cache[day] = o;
    return o;
  };
  SK.seasonOf = function (m) {
    if (m >= 2 && m <= 4) return 'ร้อน';
    if (m >= 5 && m <= 9) return 'ฝน';
    return 'หนาว';
  };
  SK.dayInfo = function (day) {
    var dt = SK.dateOf(day);
    var hol = SK.HOLIDAYS[dt.m + '-' + dt.d] || null;
    var weekend = dt.dow === 0 || dt.dow === 6;
    return { date: dt, holiday: hol, weekend: weekend, off: weekend || !!hol, season: SK.seasonOf(dt.m) };
  };
  SK.dateStr = function (day, short) {
    var dt = SK.dateOf(day);
    return SK.DOW[dt.dow] + ' ' + dt.d + ' ' + (short ? SK.MONTHS_S[dt.m] : SK.MONTHS[dt.m]) + ' ' + dt.be;
  };
})();
