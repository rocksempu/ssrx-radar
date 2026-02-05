const webpush = require("web-push");

let SUBSCRIPTIONS = [];

exports.handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};

  // salvar inscrição do usuário
  if (body.type === "subscribe") {
    SUBSCRIPTIONS.push(body.sub);
    return {
      statusCode: 200,
      body: "subscribed"
    };
  }

  // enviar push para todos
  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);

    webpush.setVapidDetails(
      "mailto:admin@ssrx-radar",
      process.env.VAPID_PUBLIC_KEY,
      process.env.VAPID_PRIVATE_KEY
    );

    for (const sub of SUBSCRIPTIONS) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (e) {}
    }

    return { statusCode: 200, body: "sent" };
  }

  return { statusCode: 200, body: "noop" };
};
