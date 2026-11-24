// Notch's service worker: an offline page, nothing more. Pages and records always come from
// the network and are never stored on the device, since they hold a child's health data.
const CACHE = "notch-offline-v1";
const OFFLINE = "/offline";

async function cacheOfflinePage() {
  const cache = await caches.open(CACHE);
  // Without cookies: the cached copy is the signed-out page, with no family data in it.
  const response = await fetch(OFFLINE, { credentials: "omit" });
  if (!response.ok) return;
  const html = await response.clone().text();
  await cache.put(OFFLINE, response);
  // Its stylesheets too, so the page keeps its look offline.
  const styles = [...html.matchAll(/href="(\/_next\/static\/[^"]+\.css)"/g)].map((m) => m[1]);
  await Promise.all(styles.map((href) => cache.add(href).catch(() => undefined)));
}

self.addEventListener("install", (event) => {
  event.waitUntil(cacheOfflinePage().then(() => self.skipWaiting()));
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  if (request.method !== "GET") return;
  if (request.mode === "navigate") {
    event.respondWith(fetch(request).catch(() => caches.match(OFFLINE)));
    return;
  }
  // Only the offline page's own stylesheets are served from the cache, and only offline.
  const url = new URL(request.url);
  if (url.origin === self.location.origin && url.pathname.startsWith("/_next/static/")) {
    event.respondWith(
      fetch(request).catch(() => caches.match(request).then((hit) => hit ?? Response.error())),
    );
  }
});
