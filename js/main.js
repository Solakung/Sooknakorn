/* สุขนคร — main.js : จุดเริ่มต้น + ระบบแจ้งเตือนอัปเดต */
(function () {
  var SK = window.SK;
  SK.appVersion = null;

  function showUpdate(worker) {
    SK.updateWorker = worker;
    var el = document.getElementById('updbar');
    if (!el) { el = document.createElement('div'); el.id = 'updbar'; el.setAttribute('role', 'status'); document.body.appendChild(el); }
    el.innerHTML = '<span>✨ สุขนครมีเวอร์ชันใหม่!</span><button id="updbtn" type="button">อัปเดตเลย</button><button id="updlater" type="button" aria-label="ไว้ทีหลัง">✕</button>';
    el.className = 'show';
    document.getElementById('updbtn').onclick = function () {
      try { if (SK.S && SK.G) SK.G.save(); } catch (e) {}
      SK.updating = true;
      this.textContent = 'กำลังอัปเดต…'; this.disabled = true;
      worker.postMessage('SKIP_WAITING');
      setTimeout(function () { location.reload(); }, 4000); // สำรอง ถ้าไม่ได้รับสัญญาณ
    };
    document.getElementById('updlater').onclick = function () { el.className = ''; };
  }
  SK.showUpdate = showUpdate;

  // ตรวจหาอัปเดตเอง (ปุ่มในเมนู) → cb('found' | 'installing' | 'latest' | 'nosw' | 'error')
  SK.checkUpdate = function (cb) {
    var reg = SK.swReg;
    if (!reg) { if (cb) cb('nosw'); return; }
    reg.update().then(function () {
      if (reg.waiting && navigator.serviceWorker.controller) { showUpdate(reg.waiting); if (cb) cb('found'); }
      else if (reg.installing) { if (cb) cb('installing'); }
      else if (cb) cb('latest');
    }).catch(function () { if (cb) cb('error'); });
  };

  function registerSW() {
    if (!('serviceWorker' in navigator) || location.protocol.indexOf('http') !== 0) return;
    var reloading = false;
    var hadController = !!navigator.serviceWorker.controller; // เปิดครั้งแรก = ไม่มี → ห้ามรีโหลดเอง
    navigator.serviceWorker.addEventListener('controllerchange', function () {
      if (reloading || !(hadController || SK.updating)) return;
      try { if (SK.S && SK.G) SK.G.save(); } catch (e) {}
      reloading = true; location.reload();
    });
    navigator.serviceWorker.addEventListener('message', function (e) {
      if (e.data && e.data.type === 'VERSION') { SK.appVersion = e.data.v; if (SK.UI && SK.UI.tab === 'menu' && SK.UI.screen === 'game') SK.UI.render(); }
    });
    navigator.serviceWorker.register('sw.js', { updateViaCache: 'none' }).then(function (reg) {
      SK.swReg = reg;
      if (reg.waiting && navigator.serviceWorker.controller) showUpdate(reg.waiting);
      reg.addEventListener('updatefound', function () {
        var w = reg.installing;
        if (!w) return;
        w.addEventListener('statechange', function () {
          if (w.state === 'installed' && navigator.serviceWorker.controller) showUpdate(w);
        });
      });
      // ตรวจหาเวอร์ชันใหม่: ทุก 30 นาที และทุกครั้งที่กลับมาเปิดแอป
      setInterval(function () { reg.update().catch(function () {}); }, 30 * 60 * 1000);
      document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') reg.update().catch(function () {}); });
    }).catch(function () {});
    if (navigator.serviceWorker.controller) navigator.serviceWorker.controller.postMessage('GET_VERSION');
    navigator.serviceWorker.ready.then(function (r) { if (r.active) r.active.postMessage('GET_VERSION'); });
  }

  function boot() { SK.UI.init(); registerSW(); }
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', boot); else boot();
})();
