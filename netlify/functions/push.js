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

  if (body.type === "subscribe") {
    const id = crypto.randomUUID();
    await store.set(id, JSON.stringify(body.sub));
    return new Response("subscribed");
  }

  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);

    for await (const { value } of store.list()) {
      const sub = JSON.parse(value);
      try {
        await webpush.sendNotification(sub, payload);
      } catch {}
    }

    return new Response("sent");
  }

  return new Response("noop");
};
