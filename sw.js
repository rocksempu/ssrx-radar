self.addEventListener("install", () => {
  self.skipWaiting();
});

self.addEventListener("activate", () => {
  console.log("SSRX Radar ativo");
  return self.clients.claim();
});

// 🔔 TRATAMENTO REAL DE PUSH (o que estava faltando)
self.addEventListener("push", event => {
  if (!event.data) return;

  let data;
  try {
    data = event.data.json();
  } catch {
    data = { title: "SSRX Radar", body: event.data.text() };
  }

  const options = {
    body: data.body,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: Date.now().toString(), // força sempre aparecer
    renotify: true,
    requireInteraction: false
  };

  event.waitUntil(
    self.registration.showNotification(data.title || "SSRX Radar", options)
  );
});
