/* mêtis CEO · service worker mínimo: solo avisos al celular (Web Push). No guarda páginas en caché. */
self.addEventListener("install", () => self.skipWaiting());
self.addEventListener("activate", (e) => e.waitUntil(self.clients.claim()));

self.addEventListener("push", (e) => {
  let m = { title: "mêtis CEO", body: "Tienes un asunto pendiente.", url: "/", tag: "metis" };
  try { if (e.data) m = Object.assign(m, e.data.json()); } catch (_) { /* aviso sin datos: texto genérico */ }
  e.waitUntil(self.registration.showNotification(m.title, { body: m.body, tag: m.tag, icon: "/brand/app-icono-192.png", badge: "/brand/app-icono-192.png", data: { url: m.url } }));
});

self.addEventListener("notificationclick", (e) => {
  e.notification.close();
  const url = (e.notification.data && e.notification.data.url) || "/";
  e.waitUntil((async () => {
    const all = await self.clients.matchAll({ type: "window", includeUncontrolled: true });
    for (const c of all) { if ("focus" in c) { await c.focus(); if ("navigate" in c) { try { await c.navigate(url); } catch (_) { /* otra pestaña */ } } return; } }
    await self.clients.openWindow(url);
  })());
});
