import { getStore } from "@netlify/blobs";
import webpush from "web-push";

const DIAS_EXPIRACAO = 15;

export default async (req) => {
  const store = getStore("subscriptions");

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const body = await req.json();

  // ============================
  // SALVAR INSCRIÇÃO INTELIGENTE
  // ============================
  if (body.type === "subscribe") {
    const { sub, deviceId } = body;
    const key = sub.endpoint.split("/").pop();

    const list = await store.list();

    // remove registro antigo do mesmo device
    for (const item of list.blobs) {
      const raw = await store.get(item.key);
      const data = JSON.parse(raw);

      if (data.deviceId === deviceId) {
        await store.delete(item.key);
      }
    }

    await store.set(
      key,
      JSON.stringify({
        sub,
        deviceId,
        lastSeen: Date.now()
      })
    );

    return new Response("subscribed");
  }

  // ============================
  // ENVIAR PUSH + LIMPEZA AUTOMÁTICA
  // ============================
  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);
    const list = await store.list();

    for (const item of list.blobs) {
      try {
        const raw = await store.get(item.key);
        const data = JSON.parse(raw);

        // remove devices abandonados
        const dias = (Date.now() - data.lastSeen) / 86400000;
        if (dias > DIAS_EXPIRACAO) {
          await store.delete(item.key);
          continue;
        }

        await webpush.sendNotification(data.sub, payload);

        data.lastSeen = Date.now();
        await store.set(item.key, JSON.stringify(data));

      } catch (err) {
        await store.delete(item.key);
      }
    }

    return new Response("sent");
  }

  return new Response("noop");
};
