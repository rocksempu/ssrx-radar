async function enablePush() {
  if (!("serviceWorker" in navigator)) {
    alert("Seu navegador não suporta Service Worker");
    return;
  }

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: "BE_VCtBlAYJe2avtB_5_PFxROofwUwLtJ5y7HUOoyuUWkSxrb-_dmjtdkx3iSbKvdTviruWRfUyYLPZ_C4YKFwY"
  });

  await fetch("/.netlify/functions/push", {
    method: "POST",
    body: JSON.stringify({
      type: "subscribe",
      sub: sub
    })
  });

  alert("🔔 Alertas ativados!");
}
