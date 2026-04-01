function getOrCreateDeviceId() {
  let id = localStorage.getItem("ssrx_device_id");
  if (!id) {
    id = crypto.randomUUID();
    localStorage.setItem("ssrx_device_id", id);
  }
  return id;
}

function refreshDeviceIdDisplay() {
  const el = document.getElementById("deviceIdDisplay");
  if (el) {
    el.textContent = localStorage.getItem("ssrx_device_id") || "—";
  }
}

async function copyDeviceId() {
  const id = localStorage.getItem("ssrx_device_id");
  if (!id) {
    alert("Ative os alertas primeiro para gerar um ID neste aparelho.");
    return;
  }
  try {
    await navigator.clipboard.writeText(id);
    alert("ID copiado.");
  } catch {
    prompt("Copie o ID:", id);
  }
}

async function enablePush() {
  if (!("serviceWorker" in navigator)) {
    alert("Seu navegador não suporta Service Worker");
    return;
  }

  const deviceId = getOrCreateDeviceId();
  refreshDeviceIdDisplay();

  const reg = await navigator.serviceWorker.ready;

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey:
      "BE_VCtBlAYJe2avtB_5_PFxROofwUwLtJ5y7HUOoyuUWkSxrb-_dmjtdkx3iSbKvdTviruWRfUyYLPZ_C4YKFwY",
  });

  await fetch("/.netlify/functions/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "subscribe",
      sub: sub,
      deviceId: deviceId,
    }),
  });

  alert(
    "Alertas ativados!\n\nID deste aparelho (use para suporte ou remover cadastro):\n" +
      deviceId
  );
}

async function removeMyPushSubscription() {
  const deviceId = localStorage.getItem("ssrx_device_id");
  if (!deviceId) {
    alert("Nenhum ID neste aparelho. Nada a remover.");
    return;
  }

  if (
    !confirm(
      "Remover seu cadastro de notificações neste aparelho?\n(O servidor deixa de enviar push para este ID.)"
    )
  ) {
    return;
  }

  await fetch("/.netlify/functions/push", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      type: "unsubscribe_device",
      deviceId: deviceId,
    }),
  });

  if ("serviceWorker" in navigator) {
    const reg = await navigator.serviceWorker.ready;
    const sub = await reg.pushManager.getSubscription();
    if (sub) {
      await sub.unsubscribe();
    }
  }

  alert("Cadastro removido. Você pode ativar de novo quando quiser.");
  refreshDeviceIdDisplay();
}

document.addEventListener("DOMContentLoaded", refreshDeviceIdDisplay);
