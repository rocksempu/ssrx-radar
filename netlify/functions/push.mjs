import { getStore } from "@netlify/blobs";
import webpush from "web-push";

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
  // ============================
  if (body.type === "subscribe") {
    const sub = body.sub;

    // evita duplicar inscrição do mesmo navegador
    const key = sub.endpoint.split("/").pop();

    await store.set(key, JSON.stringify(sub));

    return new Response("subscribed");
  }

  // ============================
  // ENVIAR PUSH + AUTO LIMPEZA
  // ============================
  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);

    const list = await store.list();

    for (const item of list.blobs) {
      try {
        const raw = await store.get(item.key);
        const sub = JSON.parse(raw);

        await webpush.sendNotification(sub, payload);
      } catch (err) {
        // inscrição morreu -> remove do blob
        await store.delete(item.key);
      }
    }

    return new Response("sent");
  }

  return new Response("noop");
};
