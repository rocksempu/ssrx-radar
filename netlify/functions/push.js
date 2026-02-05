const { getStore } = require("@netlify/blobs");
const webpush = require("web-push");
const crypto = require("crypto");

exports.handler = async (event) => {
  const store = getStore("subscriptions");

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const body = event.body ? JSON.parse(event.body) : {};

  // salvar inscrição
  if (body.type === "subscribe") {
    const id = crypto.randomUUID();
    await store.set(id, JSON.stringify(body.sub));

    return {
      statusCode: 200,
      body: "subscribed"
    };
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
