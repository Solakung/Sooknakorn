/* สุขนคร — data.js : ตารางข้อมูลเนื้อหาของเกม */
(function () {
  var SK = (window.SK = window.SK || {});

  // ---------- ตัวชี้วัดเมือง ----------
  SK.METRICS = {
    economy: { name: 'เศรษฐกิจ', icon: '📈' },
    jobs: { name: 'การจ้างงาน', icon: '💼' },
    housing: { name: 'ที่อยู่อาศัย', icon: '🏘️' },
    health: { name: 'สาธารณสุข', icon: '🏥' },
    education: { name: 'การศึกษา', icon: '🎓' },
    transport: { name: 'การเดินทาง', icon: '🚌' },
    environment: { name: 'สิ่งแวดล้อม', icon: '🌳' },
    safety: { name: 'ความปลอดภัย', icon: '🛡️' },
    culture: { name: 'วัฒนธรรมและชุมชน', icon: '🎭' },
    trust: { name: 'ธรรมาภิบาล', icon: '🏛️' }
  };
  SK.MKEYS = Object.keys(SK.METRICS);

  // น้ำหนักความสัมพันธ์: ตัวชี้วัดแต่ละตัวถูกดึงไปหาค่าเป้าหมายที่ขึ้นกับตัวอื่น (วงจรเมือง)
  SK.WEIGHTS = {
    economy: { jobs: 0.30, education: 0.12, transport: 0.12, trust: 0.10, safety: 0.08, culture: 0.05 },
    jobs: { economy: 0.40, education: 0.14, transport: 0.08, housing: 0.05, trust: 0.05 },
    housing: { economy: 0.15, transport: 0.12, jobs: 0.10, trust: 0.08, environment: 0.05 },
    health: { environment: 0.20, economy: 0.10, education: 0.10, housing: 0.08, safety: 0.05, culture: 0.05, transport: 0.05 },
    education: { economy: 0.12, culture: 0.10, trust: 0.08, jobs: 0.05, health: 0.05 },
    transport: { economy: 0.12, trust: 0.08, environment: 0.05 },
    environment: { transport: 0.12, trust: 0.08, culture: 0.05, education: 0.05, health: 0.02 },
    safety: { economy: 0.12, jobs: 0.12, culture: 0.08, trust: 0.12, housing: 0.05, education: 0.05 },
    culture: { economy: 0.08, education: 0.12, environment: 0.05, safety: 0.05, trust: 0.05, housing: 0.03 },
    trust: { economy: 0.08, safety: 0.08, culture: 0.05, transport: 0.03, health: 0.05, jobs: 0.05 }
  };
  SK.BASE_POP = 85000;

  // ---------- สถานที่ ----------
  // gov = ราชการ/ธนาคาร: ปิดวันหยุดและช่วงเย็น
  SK.LOCS = [
    { id: 'home', name: 'บ้านของฉัน', icon: '🏠', zone: 'ที่อยู่อาศัย', desc: 'พักผ่อน ทำกับข้าว ฝึกทักษะ' },
    { id: 'housing', name: 'สำนักงานที่อยู่อาศัย', icon: '🏘️', zone: 'ที่อยู่อาศัย', desc: 'ย้ายบ้าน เช่า ซื้อบ้านมั่นคง', gov: true },
    { id: 'market', name: 'ตลาดสดชุมชน', icon: '🧺', zone: 'การค้า', desc: 'วัตถุดิบ อาหารริมทาง ของฝาก' },
    { id: 'mall', name: 'ห้างสรรพสินค้า', icon: '🛍️', zone: 'การค้า', desc: 'เฟอร์นิเจอร์ เครื่องใช้ไฟฟ้า ชุดทำงาน' },
    { id: 'cafe', name: 'คาเฟ่หัวมุม', icon: '☕', zone: 'การค้า', desc: 'กาแฟ พบปะผู้คน งานพาร์ตไทม์' },
    { id: 'work', name: 'ที่ทำงาน', icon: '💼', zone: 'การงาน', desc: 'เข้างาน ขอเลื่อนตำแหน่ง' },
    { id: 'jobs', name: 'ศูนย์จัดหางาน', icon: '🧾', zone: 'การงาน', desc: 'หางาน สมัครงาน เงินทดแทนว่างงาน', gov: true },
    { id: 'biz', name: 'ศูนย์ SME และกิจการ', icon: '🏪', zone: 'การงาน', desc: 'เปิดและบริหารกิจการของตัวเอง' },
    { id: 'bank', name: 'ธนาคารชุมชน', icon: '🏦', zone: 'การเงิน', desc: 'ออม กู้ ลงทุนกองทุน', gov: true },
    { id: 'hospital', name: 'โรงพยาบาลชุมชน', icon: '🏥', zone: 'บริการสาธารณะ', desc: 'ตรวจสุขภาพ รักษา วัคซีน' },
    { id: 'school', name: 'วิทยาลัยชุมชน', icon: '🎓', zone: 'บริการสาธารณะ', desc: 'หลักสูตรอาชีพ ปริญญา ใบอนุญาต' },
    { id: 'library', name: 'ห้องสมุดเมือง', icon: '📚', zone: 'บริการสาธารณะ', desc: 'อ่านหนังสือฟรี คอมพิวเตอร์สาธารณะ' },
    { id: 'townhall', name: 'ที่ว่าการเมือง', icon: '🏛️', zone: 'บริการสาธารณะ', desc: 'ประชามติ ข้อเสนอ บริจาค', gov: true },
    { id: 'social', name: 'ศูนย์พัฒนาสังคม', icon: '🤝', zone: 'บริการสาธารณะ', desc: 'สวัสดิการ ธนาคารอาหาร ที่พักพิง', gov: true },
    { id: 'police', name: 'สถานีตำรวจ–ดับเพลิง', icon: '🚓', zone: 'บริการสาธารณะ', desc: 'ความปลอดภัย อาสาสมัครเฝ้าระวัง' },
    { id: 'park', name: 'สวนสาธารณะริมน้ำ', icon: '🌳', zone: 'สีเขียวและสุขภาพ', desc: 'เดินเล่น โยคะ ปลูกต้นไม้' },
    { id: 'gym', name: 'ฟิตเนสชุมชน', icon: '🏋️', zone: 'สีเขียวและสุขภาพ', desc: 'ออกกำลังกาย คลาสกลุ่ม' },
    { id: 'temple', name: 'วัดและศาสนสถาน', icon: '🛕', zone: 'สีเขียวและสุขภาพ', desc: 'สงบใจ ทำบุญ ครัวชุมชน' },
    { id: 'culture', name: 'ศูนย์วัฒนธรรม', icon: '🎭', zone: 'ชุมชน', desc: 'ดนตรี งานฝีมือ กิจกรรมเมือง' },
    { id: 'station', name: 'สถานีขนส่งรวม', icon: '🚉', zone: 'ชุมชน', desc: 'เลือกวิธีเดินทาง บัตรโดยสาร งานไรเดอร์' }
  ];
  SK.LOC = {};
  SK.LOCS.forEach(function (l) { SK.LOC[l.id] = l; });
  SK.ZONES = ['ที่อยู่อาศัย', 'การค้า', 'การงาน', 'การเงิน', 'บริการสาธารณะ', 'สีเขียวและสุขภาพ', 'ชุมชน'];

  // ---------- ทักษะ / การศึกษา ----------
  SK.SKILLS = {
    service: { name: 'บริการ', icon: '🛎️' },
    digital: { name: 'ดิจิทัล', icon: '💻' },
    craft: { name: 'งานช่าง', icon: '🔧' },
    care: { name: 'ดูแลผู้อื่น', icon: '🩺' },
    mgmt: { name: 'การจัดการ', icon: '📋' }
  };
  SK.EDU = ['ม.ต้น', 'ม.ปลาย/ปวช.', 'ปวส./อนุปริญญา', 'ปริญญาตรี', 'ปริญญาโท'];
  SK.CERTS = {
    firstaid: 'ปฐมพยาบาลและกู้ชีพ', nurse_assist: 'ผู้ช่วยพยาบาล', nurse_pro: 'พยาบาลวิชาชีพ',
    electrician: 'ช่างไฟฟ้าและซ่อมบำรุง', license: 'ใบขับขี่รถยนต์', teacher_license: 'ใบประกอบวิชาชีพครู', urbanfarm: 'เกษตรเมืองสีเขียว'
  };

  // ---------- สายอาชีพ ----------
  // wage = ค่าแรงต่อกะเต็มวัน (บาท) ของตำแหน่ง 1/2/3
  SK.TRACKS = {
    cafe: {
      name: 'งานบริการ ร้านกาแฟ–ร้านอาหาร', icon: '☕', skill: 'service', weekdaysOnly: false, energy: 34, mood: -1,
      wage: [480, 640, 840], titles: ['พนักงานเสิร์ฟ/บาริสต้า', 'หัวหน้ากะ', 'ผู้จัดการร้าน'],
      req: [{ edu: 0, skills: {} }, { edu: 1, skills: { service: 30 } }, { edu: 1, skills: { service: 55, mgmt: 25 } }],
      effect: { culture: 0.03, economy: 0.015 }, companies: ['คาเฟ่ใต้ต้นจามจุรี', 'ครัวบ้านริมคลอง', 'ร้านข้าวต้มเจ๊กเส็ง', 'เบเกอรี่ลมหนาว']
    },
    office: {
      name: 'งานออฟฟิศ', icon: '🗂️', skill: 'mgmt', weekdaysOnly: true, energy: 30, mood: -2,
      wage: [760, 980, 1350], titles: ['เจ้าหน้าที่ธุรการ', 'นักวิเคราะห์/ผู้ประสานงาน', 'ผู้จัดการแผนก'],
      req: [{ edu: 2, skills: { mgmt: 10 } }, { edu: 3, skills: { mgmt: 35, digital: 20 } }, { edu: 3, skills: { mgmt: 60, service: 25 } }],
      effect: { economy: 0.04 }, companies: ['บริษัท สุขนครโลจิสติกส์', 'สำนักงานบัญชีมั่นคง', 'บริษัท ริมน้ำพัฒนา', 'ศูนย์ประสานงานการค้า']
    },
    dev: {
      name: 'งานดิจิทัลและซอฟต์แวร์', icon: '💻', skill: 'digital', weekdaysOnly: true, energy: 30, mood: -1,
      wage: [900, 1350, 1900], titles: ['ผู้ช่วยโปรแกรมเมอร์', 'โปรแกรมเมอร์', 'ซีเนียร์/หัวหน้าทีม'],
      req: [{ edu: 1, skills: { digital: 30 } }, { edu: 2, skills: { digital: 50 } }, { edu: 3, skills: { digital: 75, mgmt: 25 } }],
      effect: { economy: 0.05, education: 0.01 }, companies: ['สตาร์ทอัพ เมฆาดิจิทัล', 'ดาต้าลิงก์ สุขนคร', 'ซอฟต์แวร์ใบบัว', 'ศูนย์นวัตกรรมเมือง']
    },
    nurse: {
      name: 'งานสาธารณสุข', icon: '🩺', skill: 'care', weekdaysOnly: false, energy: 42, mood: 2,
      wage: [640, 1050, 1450], titles: ['ผู้ช่วยพยาบาล', 'พยาบาลวิชาชีพ', 'หัวหน้าหอผู้ป่วย'],
      req: [{ edu: 1, skills: { care: 20 }, cert: 'nurse_assist' }, { edu: 3, skills: { care: 45 }, cert: 'nurse_pro' }, { edu: 3, skills: { care: 70, mgmt: 30 }, cert: 'nurse_pro' }],
      effect: { health: 0.07 }, companies: ['โรงพยาบาลชุมชนสุขนคร', 'คลินิกใกล้บ้าน', 'ศูนย์ดูแลผู้สูงอายุสุขใจ']
    },
    teacher: {
      name: 'งานการศึกษา', icon: '🧑‍🏫', skill: 'care', weekdaysOnly: true, energy: 32, mood: 1,
      wage: [620, 980, 1400], titles: ['ผู้ช่วยสอน', 'ครู/อาจารย์', 'หัวหน้าหมวด/ครูใหญ่'],
      req: [{ edu: 2, skills: { care: 10 } }, { edu: 3, skills: { care: 30 }, cert: 'teacher_license' }, { edu: 3, skills: { care: 50, mgmt: 35 }, cert: 'teacher_license' }],
      effect: { education: 0.07 }, companies: ['โรงเรียนเทศบาลสุขนคร', 'วิทยาลัยชุมชน', 'ศูนย์เรียนรู้ตลอดชีวิต']
    },
    tech: {
      name: 'งานช่างเทคนิค', icon: '🔧', skill: 'craft', weekdaysOnly: false, energy: 44, mood: -1,
      wage: [680, 960, 1300], titles: ['ผู้ช่วยช่าง', 'ช่างเทคนิค', 'หัวหน้าช่าง'],
      req: [{ edu: 1, skills: { craft: 20 } }, { edu: 2, skills: { craft: 45 }, cert: 'electrician' }, { edu: 2, skills: { craft: 70, mgmt: 25 }, cert: 'electrician' }],
      effect: { transport: 0.03, safety: 0.02, economy: 0.02 }, companies: ['การไฟฟ้าชุมชน', 'บริษัท ช่างสุขนคร', 'ศูนย์ซ่อมบำรุงรถไฟฟ้า']
    },
    farm: {
      name: 'เกษตรเมืองและฟาร์มผัก', icon: '🥬', skill: 'craft', weekdaysOnly: false, energy: 40, mood: 1,
      wage: [520, 700, 950], titles: ['คนงานฟาร์มเมือง', 'ผู้ดูแลแปลง', 'ผู้จัดการฟาร์ม'],
      req: [{ edu: 0, skills: {} }, { edu: 1, skills: { craft: 25 } }, { edu: 2, skills: { craft: 45, mgmt: 20 } }],
      effect: { environment: 0.05, health: 0.01 }, companies: ['ฟาร์มผักดาดฟ้า', 'สวนผักริมคลอง', 'วิสาหกิจชุมชนผักปลอดภัย']
    },
    civil: {
      name: 'งานเทศบาลและภาครัฐ', icon: '🏛️', skill: 'mgmt', weekdaysOnly: true, energy: 26, mood: 0,
      wage: [700, 900, 1200], titles: ['เจ้าหน้าที่ปฏิบัติงาน', 'นักวิชาการ', 'หัวหน้าฝ่าย'],
      req: [{ edu: 2, skills: { mgmt: 15 } }, { edu: 3, skills: { mgmt: 35, service: 20 } }, { edu: 3, skills: { mgmt: 60, service: 30 } }],
      effect: { trust: 0.06 }, companies: ['เทศบาลนครสุขนคร', 'สำนักงานเขต', 'การประปาและการไฟฟ้า']
    }
  };
  SK.TRACK_KEYS = Object.keys(SK.TRACKS);

  // ---------- หลักสูตร ----------
  // fee = ค่าเรียนต่อครั้ง (ปรับตามงบการศึกษาของเมือง)
  SK.COURSES = [
    { id: 'service101', name: 'ทักษะบริการลูกค้ามืออาชีพ', icon: '🛎️', sessions: 8, fee: 120, skill: { service: 16 }, desc: 'พูดจา รับมือลูกค้า ทำงานเป็นทีม' },
    { id: 'digital101', name: 'ดิจิทัลพื้นฐานและงานเอกสาร', icon: '🖥️', sessions: 8, fee: 100, skill: { digital: 16 }, desc: 'สเปรดชีต อีเมล เครื่องมือออนไลน์' },
    { id: 'mgmt101', name: 'การบริหารจัดการเบื้องต้น', icon: '📋', sessions: 10, fee: 150, skill: { mgmt: 16 }, desc: 'วางแผน บริหารเวลา บัญชีเบื้องต้น' },
    { id: 'firstaid', name: 'ปฐมพยาบาลและกู้ชีพ', icon: '🚑', sessions: 3, fee: 0, skill: { care: 6 }, cert: 'firstaid', desc: 'ช่วยชีวิตได้ ฟรีสำหรับชาวเมือง' },
    { id: 'driving', name: 'เรียนขับรถยนต์', icon: '🚗', sessions: 5, fee: 500, cert: 'license', desc: 'สอบใบขับขี่เพื่อซื้อรถ' },
    { id: 'urbanfarm', name: 'เกษตรเมืองสีเขียว', icon: '🌱', sessions: 8, fee: 100, skill: { craft: 12 }, cert: 'urbanfarm', desc: 'ปลูกผักในพื้นที่จำกัด ลดขยะอาหาร' },
    { id: 'nurse_assist', name: 'ผู้ช่วยพยาบาล (ประกาศนียบัตร)', icon: '💉', sessions: 12, fee: 200, skill: { care: 22 }, cert: 'nurse_assist', req: { edu: 1 }, desc: 'เริ่มงานสายสาธารณสุข' },
    { id: 'electrician', name: 'ช่างไฟฟ้าและซ่อมบำรุง', icon: '⚡', sessions: 14, fee: 250, skill: { craft: 24 }, cert: 'electrician', req: { edu: 1 }, desc: 'ใบรับรองช่างระดับกลาง' },
    { id: 'coding', name: 'Coding Bootcamp', icon: '⌨️', sessions: 18, fee: 300, skill: { digital: 30 }, req: { edu: 1 }, desc: 'เขียนโปรแกรมเชิงปฏิบัติ' },
    { id: 'edu2', name: 'ปวส./อนุปริญญา (เรียนภาคค่ำ–เสาร์อาทิตย์)', icon: '📘', sessions: 20, fee: 180, edu: 2, req: { edu: 1 }, desc: 'ยกระดับวุฒิการศึกษา' },
    { id: 'edu3', name: 'ปริญญาตรี (หลักสูตรต่อเนื่อง)', icon: '🎓', sessions: 30, fee: 300, edu: 3, skill: { mgmt: 10, digital: 8 }, req: { edu: 2 }, desc: 'เปิดประตูสู่งานระดับวิชาชีพ' },
    { id: 'edu4', name: 'ปริญญาโท', icon: '🏅', sessions: 30, fee: 450, edu: 4, skill: { mgmt: 12 }, req: { edu: 3 }, desc: 'ผู้เชี่ยวชาญเฉพาะด้าน' },
    { id: 'nurse_pro', name: 'พยาบาลวิชาชีพ (ต่อเนื่อง)', icon: '👩‍⚕️', sessions: 28, fee: 350, skill: { care: 22 }, cert: 'nurse_pro', edu: 3, req: { edu: 2, cert: 'nurse_assist', skills: { care: 30 } }, desc: 'วุฒิปริญญาตรีสายพยาบาล' },
    { id: 'teacher', name: 'ใบประกอบวิชาชีพครู', icon: '🍎', sessions: 12, fee: 250, skill: { care: 12 }, cert: 'teacher_license', req: { edu: 3 }, desc: 'ใบอนุญาตสอนในระบบ' }
  ];

  // ---------- ที่อยู่อาศัย ----------
  SK.HOUSING = {
    shelter: { name: 'ที่พักพิงชั่วคราวของเมือง', icon: '⛺', rent: 0, comfort: 0, desc: 'ฟรี แต่เรียบง่ายมาก' },
    dorm: { name: 'ห้องเช่ารวม (หอพักชุมชน)', icon: '🛏️', rent: 2600, comfort: 1, desc: 'ประหยัด ใช้ห้องน้ำรวม' },
    room: { name: 'ห้องเช่าเดี่ยว', icon: '🚪', rent: 4500, comfort: 2, desc: 'ห้องส่วนตัวพร้อมห้องน้ำ' },
    apt: { name: 'อพาร์ตเมนต์ 1 ห้องนอน', icon: '🏢', rent: 8500, comfort: 3, desc: 'กว้างขวาง มีครัวเล็ก' },
    condo: { name: 'คอนโดใกล้รถไฟฟ้า', icon: '🌆', rent: 15000, comfort: 4, desc: 'สะดวกสบายที่สุด' },
    own: { name: 'บ้านมั่นคงของตัวเอง', icon: '🏡', rent: 0, comfort: 3, desc: 'บ้านเอื้ออาทร ผ่อน 25 ปี', price: 650000, down: 32500, rate: 3.5, months: 300 }
  };
  SK.RENT_KEYS = ['dorm', 'room', 'apt', 'condo'];

  // ---------- ของใช้ ----------
  SK.ITEMS = [
    { id: 'bike', name: 'จักรยาน', icon: '🚲', price: 3200, desc: 'เดินทางฟรี ได้ออกกำลังกาย' },
    { id: 'fridge', name: 'ตู้เย็น', icon: '🧊', price: 7500, desc: 'เก็บอาหารที่ทำไว้ได้ 12 กล่อง' },
    { id: 'washer', name: 'เครื่องซักผ้า', icon: '🧺', price: 6800, desc: 'ชีวิตสะดวกขึ้น อารมณ์ดีขึ้นทุกวัน' },
    { id: 'computer', name: 'โน้ตบุ๊ก', icon: '💻', price: 24000, desc: 'ฝึกดิจิทัลที่บ้าน รับงานฟรีแลนซ์ได้' },
    { id: 'ac', name: 'เครื่องปรับอากาศ', icon: '❄️', price: 13500, desc: 'นอนหลับดีขึ้น (ค่าไฟเพิ่ม)' },
    { id: 'tv', name: 'ทีวีและระบบเสียง', icon: '📺', price: 9000, desc: 'พักผ่อนที่บ้านได้ผลดีขึ้น' },
    { id: 'guitar', name: 'กีตาร์', icon: '🎸', price: 3500, desc: 'งานอดิเรกที่ช่วยผ่อนคลายได้ทุกวัน' },
    { id: 'suit', name: 'ชุดทำงานและชุดสัมภาษณ์', icon: '👔', price: 2200, desc: 'เพิ่มโอกาสผ่านสัมภาษณ์งาน' },
    { id: 'car', name: 'รถยนต์มือสอง (ผ่อนได้)', icon: '🚗', price: 185000, desc: 'ต้องมีใบขับขี่ ผ่อน 48 เดือน', financed: { down: 37000, rate: 7, months: 48 }, needCert: 'license' }
  ];

  // ---------- กิจการ ----------
  SK.BIZ = {
    coffee: { name: 'ร้านกาแฟเล็กๆ', icon: '☕', capital: 60000, rev: 950, fixed: 480, skill: 'service' },
    food: { name: 'ร้านอาหารตามสั่ง', icon: '🍜', capital: 90000, rev: 1500, fixed: 800, skill: 'service' },
    online: { name: 'ร้านค้าออนไลน์', icon: '📦', capital: 40000, rev: 700, fixed: 280, skill: 'digital' },
    farm: { name: 'ฟาร์มผักไฮโดรโปนิกส์', icon: '🥬', capital: 75000, rev: 1150, fixed: 620, skill: 'craft' }
  };

  // ---------- เส้นทางเริ่มต้น / เป้าหมายชีวิต ----------
  SK.PATHS = {
    grad: { name: 'บัณฑิตจบใหม่', icon: '🎓', desc: 'วุฒิปริญญาตรี ทักษะดิจิทัลดี แต่เงินน้อยและมีหนี้ กยศ.', edu: 3, skills: { digital: 24, mgmt: 18, service: 8 }, cash: 8000, loan: { name: 'กยศ.', principal: 60000, rate: 1, months: 120 } },
    newcomer: { name: 'ผู้ย้ายถิ่นเริ่มชีวิตใหม่', icon: '🧳', desc: 'มีเงินติดตัวพอสมควร ทักษะบริการดี แต่ยังไม่มีคอนเนกชัน', edu: 1, skills: { service: 22, craft: 8 }, cash: 24000 },
    artisan: { name: 'ช่างฝีมือ', icon: '🛠️', desc: 'มือถึง ร่างกายแข็งแรง วุฒิ ปวช.', edu: 1, skills: { craft: 34, service: 6 }, cash: 12000, fitness: 62 },
    caregiver: { name: 'ผู้ดูแลมากประสบการณ์', icon: '🫶', desc: 'ผ่านการอบรมผู้ช่วยพยาบาลแล้ว ใจดี คนรักมาก', edu: 1, skills: { care: 30 }, cash: 10000, cert: ['nurse_assist', 'firstaid'], mood: 70 },
    founder: { name: 'นักฝันสายธุรกิจ', icon: '🚀', desc: 'ทุนตั้งต้นสูงแต่มีหนี้ก้อนหนึ่ง วุฒิ ปวส.', edu: 2, skills: { mgmt: 24, service: 18 }, cash: 38000, loan: { name: 'หนี้ธุรกิจเดิม', principal: 30000, rate: 8, months: 36 } }
  };
  SK.GOALS = {
    balanced: { name: 'ชีวิตสมดุล', icon: '⚖️', desc: 'ทุกด้านสำคัญเท่ากัน', w: { wealth: 1, wellbeing: 1, knowledge: 1, social: 1, civic: 1, city: 1 } },
    wealth: { name: 'มั่งคั่ง', icon: '💰', desc: 'สร้างทรัพย์สินให้มากที่สุด', w: { wealth: 2.4, wellbeing: 1, knowledge: 0.8, social: 0.6, civic: 0.5, city: 0.7 } },
    healthy: { name: 'สุขภาพและความสุข', icon: '🌿', desc: 'ใช้ชีวิตอย่างมีสุข', w: { wealth: 0.6, wellbeing: 2.4, knowledge: 0.8, social: 1.3, civic: 0.6, city: 0.8 } },
    scholar: { name: 'ผู้รอบรู้', icon: '📖', desc: 'เรียนรู้ทักษะและวุฒิการศึกษา', w: { wealth: 0.7, wellbeing: 0.9, knowledge: 2.5, social: 0.8, civic: 0.7, city: 0.7 } },
    leader: { name: 'ผู้นำชุมชน', icon: '🏛️', desc: 'ช่วยพัฒนาเมืองและสังคม', w: { wealth: 0.5, wellbeing: 0.8, knowledge: 0.8, social: 1.4, civic: 2.4, city: 1.8 } }
  };
  SK.AVATARS = ['🧑', '👩', '👨', '🧑‍🦱', '👩‍🦰', '👨‍🦳', '🧕', '🧑‍🦯'];

  // ---------- นโยบายที่เสนอประชามติ ----------
  // eff: [ตัวชี้วัด, ค่าที่เพิ่ม, จำนวนวันที่ค่อยๆ เห็นผล]  mods = ปรับค่าเป้าหมายถาวร
  SK.POLICIES = [
    { id: 'bikelane', icon: '🚲', name: 'เลนจักรยานและทางเท้าทั่วเมือง', cost: 40, eff: [['transport', 7, 45], ['environment', 3, 60], ['health', 2, 60]], mods: { transport: 1.5 }, text: 'ปรับถนนสายหลักเป็นเลนจักรยานที่ปลอดภัย' },
    { id: 'solar', icon: '☀️', name: 'โซลาร์รูฟบนอาคารสาธารณะ', cost: 55, eff: [['environment', 6, 60]], mods: { environment: 2 }, bills: -0.08, text: 'ลดค่าไฟของคนทั้งเมืองและลดมลพิษ' },
    { id: 'healthcenter', icon: '🏥', name: 'ศูนย์สุขภาพชุมชนทุกย่าน', cost: 50, eff: [['health', 8, 60]], mods: { health: 2 }, text: 'ตรวจสุขภาพใกล้บ้าน ค่ารักษาถูกลง' },
    { id: 'housing2', icon: '🏘️', name: 'บ้านมั่นคงเฟส 2', cost: 70, eff: [['housing', 8, 75]], mods: { housing: 2 }, text: 'เพิ่มบ้านราคาเข้าถึงได้' },
    { id: 'skills', icon: '🛠️', name: 'ศูนย์ฝึกอาชีพฟรี', cost: 35, eff: [['education', 6, 45], ['jobs', 4, 60]], mods: { education: 1.5 }, tuition: -0.25, text: 'ลดค่าเรียนหลักสูตรอาชีพทั่วเมือง' },
    { id: 'taxcut', icon: '💸', name: 'ลดภาษีท้องถิ่นชั่วคราว', cost: 25, eff: [['economy', 4, 30], ['trust', 3, 30]], text: 'ผู้ประกอบการและครัวเรือนมีเงินเหลือมากขึ้น' },
    { id: 'market', icon: '🛒', name: 'ตลาดนัดชุมชนทุกสัปดาห์', cost: 20, eff: [['culture', 5, 30], ['economy', 2, 30]], mods: { culture: 1 }, foodPrice: -0.05, text: 'พื้นที่ขายของให้คนตัวเล็ก' },
    { id: 'cctv', icon: '💡', name: 'ไฟส่องสว่างและกล้องวงจรปิด', cost: 30, eff: [['safety', 6, 30], ['trust', -2, 30]], mods: { safety: 1.5 }, text: 'ปลอดภัยขึ้น แต่ถูกวิจารณ์เรื่องความเป็นส่วนตัว' },
    { id: 'metro', icon: '🚇', name: 'รถไฟฟ้าสายใหม่', cost: 120, eff: [['transport', 10, 90], ['economy', 3, 90], ['environment', 2, 90]], mods: { transport: 3 }, text: 'โครงการใหญ่ ใช้เวลาแต่คุ้มระยะยาว' },
    { id: 'industry', icon: '🏭', name: 'นิคมอุตสาหกรรมสะอาด', cost: 60, eff: [['jobs', 8, 60], ['economy', 5, 60], ['environment', -4, 60]], text: 'งานเพิ่มขึ้นมาก แต่ต้องแลกกับสิ่งแวดล้อม' },
    { id: 'river', icon: '🌊', name: 'ฟื้นฟูแม่น้ำและสวนริมน้ำ', cost: 45, eff: [['environment', 6, 60], ['culture', 3, 60], ['health', 2, 60]], mods: { environment: 1.5 }, text: 'พื้นที่สีเขียวใหม่ของเมือง' },
    { id: 'festival', icon: '🎆', name: 'เทศกาลอาหารและดนตรีประจำปี', cost: 18, eff: [['culture', 6, 20], ['economy', 2, 20]], text: 'ทั้งเมืองสนุกพร้อมกัน' },
    { id: 'wifi', icon: '📶', name: 'ห้องสมุดดิจิทัลและ Wi-Fi สาธารณะ', cost: 28, eff: [['education', 5, 45], ['jobs', 2, 45]], mods: { education: 1 }, text: 'เข้าถึงความรู้ได้เท่าเทียม' },
    { id: 'onestop', icon: '🗂️', name: 'ระบบบริการรัฐดิจิทัลแบบ One-Stop', cost: 32, eff: [['trust', 7, 45]], mods: { trust: 1.5 }, text: 'เอกสารทุกอย่างเสร็จที่เดียว โปร่งใสตรวจสอบได้' },
    { id: 'elder', icon: '👵', name: 'ศูนย์ดูแลผู้สูงอายุชุมชน', cost: 38, eff: [['health', 4, 45], ['culture', 3, 45], ['safety', 1, 45]], mods: { health: 1 }, text: 'ผู้สูงวัยมีคนดูแล ชุมชนอบอุ่น' },
    { id: 'recycle', icon: '♻️', name: 'ระบบคัดแยกและรีไซเคิลขยะ', cost: 30, eff: [['environment', 6, 45], ['economy', 1, 45]], mods: { environment: 1.5 }, text: 'ลดขยะฝังกลบ สร้างงานใหม่' },
    { id: 'startup', icon: '🚀', name: 'กองทุนสนับสนุนธุรกิจเริ่มต้น', cost: 42, eff: [['economy', 5, 60], ['jobs', 5, 60]], mods: { jobs: 1 }, text: 'ช่วยคนตัวเล็กเริ่มกิจการ' }
  ];
  // ข้อเสนอเพิ่มงบประจำ (ขึ้นเมื่อเมืองมีเงินเหลือ) — ใช้เป็นที่ใช้เงินระยะยาว
  SK.MKEYS.forEach(function (m) {
    SK.POLICIES.push({ id: 'budget_' + m, budget: m, icon: '💰', name: 'เพิ่มงบประจำปีด้าน' + SK.METRICS[m].name, cost: 12, eff: [[m, 3, 30]], text: 'เพิ่มงบประมาณประจำ 1 ระดับ (ใช้เงินเพิ่มทุกวัน แต่ผลดีถาวร)' });
  });
  // กลุ่มการเมืองท้องถิ่น (เลือกตั้งสภาเมืองทุกเดือนพฤศจิกายน)
  SK.POLICIES.push(
    { id: 'party_growth', election: true, icon: '🏗️', name: 'กลุ่มสุขนครก้าวหน้า', cost: 0, eff: [['economy', 5, 60], ['jobs', 5, 60], ['environment', -3, 60]], mods: { economy: 1.5, jobs: 1.5, environment: -1 }, text: 'ดึงการลงทุน สร้างงาน ขยายเมือง' },
    { id: 'party_green', election: true, icon: '🌿', name: 'กลุ่มเมืองเขียว', cost: 0, eff: [['environment', 6, 60], ['health', 3, 60], ['economy', -1, 60]], mods: { environment: 2, health: 1 }, text: 'พลังงานสะอาด พื้นที่สีเขียว อากาศดี' },
    { id: 'party_care', election: true, icon: '🤝', name: 'กลุ่มคนเท่ากัน', cost: 0, eff: [['housing', 4, 60], ['health', 3, 60], ['trust', 2, 60]], mods: { housing: 1.5, trust: 1 }, text: 'บ้านราคาเข้าถึงได้ สวัสดิการถ้วนหน้า' }
  );
  SK.POLICY = {};
  SK.POLICIES.forEach(function (p) { SK.POLICY[p.id] = p; });

  // ---------- ความสำเร็จ ----------
  SK.ACHIEVEMENTS = [
    { id: 'firstjob', icon: '🎒', name: 'งานแรก', desc: 'ได้งานประจำเป็นครั้งแรก', test: function (s) { return !!s.stats.hired; } },
    { id: 'shift50', icon: '⏱️', name: 'มืออาชีพ', desc: 'เข้างานครบ 50 กะ', test: function (s) { return s.stats.shifts >= 50; } },
    { id: 'promo', icon: '📈', name: 'ก้าวหน้า', desc: 'ได้เลื่อนตำแหน่ง', test: function (s) { return s.stats.promotions >= 1; } },
    { id: 'saver', icon: '🐷', name: 'นักออม', desc: 'มีเงินเก็บรวม 50,000 บาท', test: function (s) { return s.cash + s.bank >= 50000; } },
    { id: 'rich', icon: '💎', name: 'ฐานะมั่นคง', desc: 'ทรัพย์สินสุทธิ 300,000 บาท', test: function (s) { return SK.G.netWorth() >= 300000; } },
    { id: 'debtfree', icon: '🕊️', name: 'ปลอดหนี้', desc: 'ชำระหนี้ที่มีทั้งหมดจนหมด', test: function (s) { return s.stats.hadDebt && s.loans.length === 0; } },
    { id: 'degree', icon: '🎓', name: 'บัณฑิต', desc: 'มีวุฒิปริญญาตรี', test: function (s) { return s.edu >= 3; } },
    { id: 'expert', icon: '🧠', name: 'ผู้เชี่ยวชาญ', desc: 'ทักษะใดทักษะหนึ่งถึง 80', test: function (s) { return Object.keys(s.skills).some(function (k) { return s.skills[k] >= 80; }); } },
    { id: 'friend', icon: '🫂', name: 'มิตรแท้', desc: 'ความสัมพันธ์กับใครสักคนถึง 75', test: function (s) { return Object.keys(s.rel).some(function (k) { return s.rel[k].v >= 75; }); } },
    { id: 'social5', icon: '🎉', name: 'คนรู้จักทั่วเมือง', desc: 'สนิทกับ 5 คนขึ้นไป (50+)', test: function (s) { return Object.keys(s.rel).filter(function (k) { return s.rel[k].v >= 50; }).length >= 5; } },
    { id: 'vol20', icon: '🌻', name: 'จิตอาสา', desc: 'ทำงานอาสา 20 ครั้ง', test: function (s) { return s.stats.volunteer >= 20; } },
    { id: 'voter', icon: '🗳️', name: 'พลเมืองตื่นรู้', desc: 'ลงคะแนนประชามติ 6 ครั้ง', test: function (s) { return s.stats.votes >= 6; } },
    { id: 'donor', icon: '🎁', name: 'ผู้ให้', desc: 'บริจาคให้เมืองรวม 5,000 บาท', test: function (s) { return s.stats.donated >= 5000; } },
    { id: 'fit', icon: '💪', name: 'ฟิตสุดๆ', desc: 'ความฟิตถึง 80', test: function (s) { return s.fitness >= 80; } },
    { id: 'healthy', icon: '❤️', name: 'แข็งแรงดี', desc: 'สุขภาพถึง 95', test: function (s) { return s.health >= 95; } },
    { id: 'homeowner', icon: '🏡', name: 'เจ้าของบ้าน', desc: 'ซื้อบ้านมั่นคงเป็นของตัวเอง', test: function (s) { return s.home.type === 'own'; } },
    { id: 'owner', icon: '🏪', name: 'เถ้าแก่', desc: 'เปิดกิจการของตัวเอง', test: function (s) { return s.stats.bizOpened; } },
    { id: 'profit', icon: '🧾', name: 'กำไรงาม', desc: 'กิจการทำกำไรสะสม 20,000 บาท', test: function (s) { return s.stats.bizProfit >= 20000; } },
    { id: 'investor', icon: '📊', name: 'นักลงทุน', desc: 'ขายกองทุนได้กำไร', test: function (s) { return s.stats.fundGain >= 1000; } },
    { id: 'driver', icon: '🚗', name: 'ออกรถ', desc: 'ซื้อรถยนต์คันแรก', test: function (s) { return !!s.inv.car; } },
    { id: 'civic200', icon: '🏅', name: 'พลเมืองดีเด่น', desc: 'แต้มพลเมืองถึง 150', test: function (s) { return s.civic >= 150; } },
    { id: 'greencity', icon: '🌳', name: 'เมืองสีเขียว', desc: 'สิ่งแวดล้อมเมืองถึง 85', test: function (s) { return s.city.m.environment >= 85; } },
    { id: 'day100', icon: '📅', name: '100 วันแรก', desc: 'ใช้ชีวิตในสุขนครครบ 100 วัน', test: function (s) { return s.day >= 100; } },
    { id: 'year1', icon: '🎊', name: 'หนึ่งปีเต็ม', desc: 'ครบหนึ่งปีในสุขนคร', test: function (s) { return s.day >= 365; } }
  ];

  // ---------- ตัวเลือกกิจวัตร ----------
  SK.ROUTINE_OPTS = [
    { id: 'auto', name: 'อัตโนมัติ (ตามความเหมาะสม)' },
    { id: 'work', name: 'ไปทำงานเต็มวัน' },
    { id: 'half', name: 'ทำงานครึ่งวัน' },
    { id: 'study', name: 'เรียน / ฝึกทักษะ' },
    { id: 'cook', name: 'ทำกับข้าว / ซื้อของ' },
    { id: 'gym', name: 'ออกกำลังกาย' },
    { id: 'social', name: 'พบปะเพื่อน' },
    { id: 'volunteer', name: 'อาสาสมัคร' },
    { id: 'gig', name: 'งานเสริม (ไรเดอร์/ฟรีแลนซ์)' },
    { id: 'biz', name: 'ดูแลกิจการ' },
    { id: 'rest', name: 'พักผ่อน' }
  ];
})();
