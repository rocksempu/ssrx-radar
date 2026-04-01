import { getStore } from "@netlify/blobs";
import webpush from "web-push";

/** Legado: JSON do PushSubscription. Novo: { subscription, deviceId?, createdAt? } */
function parseStoredSubscription(raw) {
  const parsed = JSON.parse(raw);
  if (!parsed || typeof parsed !== "object") {
    throw new Error("invalid");
  }
  if (parsed.subscription && parsed.subscription.endpoint) {
    return { subscription: parsed.subscription };
  }
  if (parsed.endpoint) {
    return { subscription: parsed };
  }
  throw new Error("invalid");
}

export default async (req) => {
  const store = getStore("subscriptions");

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const body = await req.json();

  // ============================
  // SALVAR INSCRIÇÃO (sem duplicar)
  // Grava deviceId + data para identificar no Netlify Blobs (sem dado pessoal).
  // ============================
  if (body.type === "subscribe") {
    const sub = body.sub;

    const key = sub.endpoint.split("/").pop();

    const record = {
      subscription: sub,
      deviceId:
        typeof body.deviceId === "string" && body.deviceId.trim()
          ? body.deviceId.trim()
          : null,
      createdAt: new Date().toISOString(),
    };

    await store.set(key, JSON.stringify(record));

    return new Response("subscribed");
  }

  // ============================
  // REMOVER INSCRIÇÃO PELO deviceId (mesmo ID mostrado no celular)
  // ============================
  if (body.type === "unsubscribe_device") {
    const target =
      typeof body.deviceId === "string" ? body.deviceId.trim() : "";
    if (!target) {
      return new Response(JSON.stringify({ error: "deviceId obrigatorio" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const list = await store.list();
    let removed = 0;

    for (const item of list.blobs) {
      if (item.key.startsWith("sent-")) continue;
      try {
        const raw = await store.get(item.key);
        const parsed = JSON.parse(raw);
        if (parsed && parsed.deviceId === target) {
          await store.delete(item.key);
          removed++;
        }
      } catch {}
    }

    return new Response(JSON.stringify({ ok: true, removed }), {
      headers: { "Content-Type": "application/json" },
    });
  }

  // ============================
  // ENVIAR PUSH + AUTO LIMPEZA
  // ============================
  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);

    const list = await store.list();

    for (const item of list.blobs) {
      if (item.key.startsWith("sent-")) continue;
      try {
        const raw = await store.get(item.key);
        const { subscription } = parseStoredSubscription(raw);

        await webpush.sendNotification(subscription, payload);
      } catch (err) {
        await store.delete(item.key);
      }
    }

    return new Response("sent");
  }

  return new Response("noop");
};
