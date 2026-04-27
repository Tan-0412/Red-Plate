// service-worker.js — Red Plate PWA
const CACHE_NAME = 'redplate-v1';

// ไฟล์ที่ cache เมื่อติดตั้ง
const PRECACHE = [
  './',
  './index.html',
  './manifest.json',
  './icon-192.png',
  './icon-512.png',
];

// ══════════════════════════════
//  INSTALL — cache ไฟล์หลัก
// ══════════════════════════════
self.addEventListener('install', event => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(PRECACHE);
    })
  );
  self.skipWaiting();
});

// ══════════════════════════════
//  ACTIVATE — ลบ cache เก่า
// ══════════════════════════════
self.addEventListener('activate', event => {
  event.waitUntil(
    caches.keys().then(keys =>
      Promise.all(
        keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k))
      )
    )
  );
  self.clients.claim();
});

// ══════════════════════════════
//  FETCH — Network first, cache fallback
// ══════════════════════════════
self.addEventListener('fetch', event => {
  // ข้าม Google Sheets API — ต้องการ network เสมอ
  if (event.request.url.includes('script.google.com') ||
      event.request.url.includes('googleapis.com')) {
    return;
  }

  event.respondWith(
    fetch(event.request)
      .then(response => {
        // cache response ใหม่
        if (response && response.status === 200) {
          const clone = response.clone();
          caches.open(CACHE_NAME).then(cache => cache.put(event.request, clone));
        }
        return response;
      })
      .catch(() => {
        // offline → ใช้ cache
        return caches.match(event.request).then(cached => {
          if (cached) return cached;
          // fallback หน้าหลัก
          return caches.match('./index.html');
        });
      })
  );
});
