import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export default async (event) => {
  const store = getStore("subscriptions");

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const body = JSON.parse(event.body);

  // ============================
  // SALVAR INSCRIÇÃO (sem duplicar)
  // ============================
  if (body.type === "subscribe") {
    const sub = body.sub;

    const key = sub.endpoint.split("/").pop();
    await store.set(key, JSON.stringify(sub));

    return {
      statusCode: 200,
      body: "subscribed"
    };
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
        const sub = JSON.parse(raw);

        await webpush.sendNotification(sub, payload);
      } catch (err) {
        // remove subscriptions mortas
        if (err.statusCode === 410 || err.statusCode === 404) {
          await store.delete(item.key);
        }
      }
    }

    return {
      statusCode: 200,
      body: "sent"
    };
  }

  return {
    statusCode: 200,
    body: "noop"
  };
};
