async function enablePush() {
  if (!("serviceWorker" in navigator)) {
    alert("Seu navegador não suporta Service Worker");
    return;
  }

  // 🔥 deviceId persistente (não é dado pessoal - LGPD safe)
  const deviceId =
    localStorage.getItem("ssrx_device_id") ||
    crypto.randomUUID();

  localStorage.setItem("ssrx_device_id", deviceId);

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "BE_VCtBlAYJe2avtB_5_PFxROofwUwLtJ5y7HUOoyuUWkSxrb-_dmjtdkx3iSbKvdTviruWRfUyYLPZ_C4YKFwY"
  });

  await fetch("/.netlify/functions/push", {
    method: "POST",
    body: JSON.stringify({
      type: "subscribe",
      sub: sub,
      deviceId: deviceId   // 👈 ESSA É A MÁGICA
    })
  });

  alert("🔔 Alertas ativados!");
}
