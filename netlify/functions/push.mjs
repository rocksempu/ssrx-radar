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

  // salvar inscrição
  if (body.type === "subscribe") {
    const id = crypto.randomUUID();
    await store.set(id, JSON.stringify(body.sub));
    return new Response("subscribed");
  }

  // enviar push
  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);

    const { blobs } = await store.list();

    for (const b of blobs) {
      const sub = JSON.parse(await store.get(b.key));
      try {
        await webpush.sendNotification(sub, payload);
      } catch (e) {}
    }

    return new Response("sent");
  }

  return new Response("noop");
};
