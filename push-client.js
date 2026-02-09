async function enablePush() {
  if (!("serviceWorker" in navigator)) {
    alert("Seu navegador não suporta Service Worker");
    return;
  }

  // 🔐 ID persistente do device (LGPD safe)
  const deviceId =
    localStorage.getItem("ssrx_device_id") ||
    crypto.randomUUID();

  localStorage.setItem("ssrx_device_id", deviceId);

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey:
      "BE_VCtBlAYJe2avtB_5_PFxROofwUwLtJ5y7HUOoyuUWkSxrb-_dmjtdkx3iSbKvdTviruWRfUyYLPZ_C4YKFwY"
  });

  await fetch("/.netlify/functions/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "subscribe",
      sub: sub,
      deviceId: deviceId
    })
  });

  alert("🔔 Alertas ativados!");
}
