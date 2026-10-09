/* สุขนคร — Service worker
   • เก็บไฟล์เกมไว้เล่นออฟไลน์
   • เมื่อมีเวอร์ชันใหม่ จะดาวน์โหลดไว้ก่อนแล้ว "รอ" ให้ผู้เล่นกดปุ่มอัปเดตในเกม
   ★ ทุกครั้งที่แก้ไฟล์เกม ให้เปลี่ยน VERSION ด้านล่าง (เช่น v2.2.0 → v2.2.1) ผู้เล่นจะเห็นแจ้งเตือนอัปเดต */
const VERSION = 'sooksan-v2.2.0';
const FILES = ['./', 'index.html', 'style.css', 'manifest.webmanifest', 'icon.svg', 'icon-192.png', 'icon-512.png',
  'js/util.js', 'js/data.js', 'js/npcs.js', 'js/game.js', 'js/actions.js', 'js/events.js', 'js/routine.js',
  'js/life.js', 'js/aging.js', 'js/world.js', 'js/kids.js', 'js/politics.js', 'js/events2.js',
  'js/dialogue_data.js', 'js/dialogue_more.js', 'js/dialogue_more2.js', 'js/dialogue.js',
  'js/ui.js', 'js/ui_extra.js', 'js/main.js'];

self.addEventListener('install', e => {
  // โหลดไฟล์ใหม่จากเซิร์ฟเวอร์จริง (ไม่ใช้แคชของเบราว์เซอร์)
  e.waitUntil(caches.open(VERSION).then(c => c.addAll(FILES.map(f => new Request(f, { cache: 'reload' })))));
});
self.addEventListener('message', e => {
  if (e.data === 'SKIP_WAITING') self.skipWaiting();
  if (e.data === 'GET_VERSION' && e.source) e.source.postMessage({ type: 'VERSION', v: VERSION });
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== VERSION && k.indexOf('sooksan-') === 0).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
self.addEventListener('fetch', e => {
  const req = e.request;
  if (req.method !== 'GET' || new URL(req.url).origin !== location.origin) return;
  // ใช้ไฟล์ชุดเดียวกันทั้งเกมจากแคชของเวอร์ชันนี้ (ป้องกันไฟล์เก่าใหม่ปนกัน)
  e.respondWith(caches.open(VERSION).then(c => c.match(req, { ignoreSearch: true }).then(hit => hit || fetch(req).then(res => {
    if (res && res.ok) c.put(req, res.clone());
    return res;
  }).catch(() => c.match('index.html')))));
});
