/* Colin OS Service Worker — 离线缓存：App 外壳 / 数据 JSON / 组件 / 卡片 UI */
const VERSION = "colin-os-v2";
const CORE = [
  "/",
  "/index.html",
  "/manifest.json",
  "/colin-os/app.js",
  "/colin-os/styles.css",
  "/colin-os/icons/icon-192.png",
  "/colin-os/icons/icon-512.png",
  "/colin-os/icons/icon-maskable-512.png",
  "/colin-os/icons/apple-touch-icon.png",
  "/colin-os/icons/favicon-32.png",
  "/components/widgets/mental-model-latticework.js",
  "/data/books-grid-35-v3.json",
  "/data/mental-models-200-v7-tiered.json",
  "/data/principles-grid-186-v3.json",
  "/data/pillar-essays-data.json",
  "/assets/qrcode-placeholder.png"
];

self.addEventListener("install", function (e) {
  e.waitUntil(
    caches.open(VERSION).then(function (c) {
      return Promise.all(CORE.map(function (u) {
        return c.add(new Request(u, { cache: "reload" })).catch(function () {});
      }));
    }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (e) {
  e.waitUntil(
    caches.keys().then(function (keys) {
      return Promise.all(keys.filter(function (k) { return k !== VERSION; }).map(function (k) { return caches.delete(k); }));
    }).then(function () { return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function (e) {
  var req = e.request;
  if (req.method !== "GET") return;
  var url = new URL(req.url);
  if (url.origin !== location.origin) return; // 第三方（统计/字体）不拦截

  // 页面导航：网络优先，失败回退缓存外壳（离线可开 App）
  if (req.mode === "navigate") {
    e.respondWith(
      fetch(req).then(function (r) {
        var cp = r.clone(); caches.open(VERSION).then(function (c) { c.put("/index.html", cp); });
        return r;
      }).catch(function () {
        return caches.match("/index.html").then(function (r) { return r || caches.match("/"); });
      })
    );
    return;
  }

  // 数据 JSON：Stale-While-Revalidate（离线秒开，有网静默更新）
  if (url.pathname.startsWith("/data/")) {
    e.respondWith(
      caches.open(VERSION).then(function (c) {
        return c.match(req).then(function (cached) {
          var net = fetch(req).then(function (r) {
            if (r && r.ok) c.put(req, r.clone());
            return r;
          }).catch(function () { return cached; });
          return cached || net;
        });
      })
    );
    return;
  }

  // 其余同源静态资源：缓存优先，回退网络
  e.respondWith(
    caches.match(req).then(function (cached) {
      if (cached) return cached;
      return fetch(req).then(function (r) {
        if (r && r.ok && (url.pathname.startsWith("/colin-os/") || url.pathname.startsWith("/components/") || url.pathname.startsWith("/assets/") || url.pathname.startsWith("/img/"))) {
          var cp = r.clone();
          caches.open(VERSION).then(function (c) { c.put(req, cp); });
        }
        return r;
      }).catch(function () { return cached; });
    })
  );
});
