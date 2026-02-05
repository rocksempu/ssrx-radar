import { getStore } from "@netlify/blobs";
import webpush from "web-push";

export default async (req, context) => {
  const store = getStore("subscriptions");

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const body = req.body ? JSON.parse(req.body) : {};

  // salvar inscrição
  if (body.type === "subscribe") {
    const id = crypto.randomUUID();
    await store.set(id, JSON.stringify(body.sub));
    return new Response("subscribed");
  }

  // enviar push
  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);

    for await (const { key, value } of store.list()) {
      const sub = JSON.parse(value);
      try {
        await webpush.sendNotification(sub, payload);
      } catch (e) {}
    }

    return new Response("sent");
  }

  return new Response("noop");
};
