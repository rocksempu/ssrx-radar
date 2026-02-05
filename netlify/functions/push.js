const fs = require("fs");
const path = require("path");
const webpush = require("web-push");

const filePath = path.join(process.cwd(), "subscriptions.json");

function lerSubs() {
  return JSON.parse(fs.readFileSync(filePath, "utf8"));
}

function salvarSubs(subs) {
  fs.writeFileSync(filePath, JSON.stringify(subs, null, 2));
}

exports.handler = async (event) => {
  const body = event.body ? JSON.parse(event.body) : {};

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  // salvar inscrição do usuário
  if (body.type === "subscribe") {
    const subs = lerSubs();
    subs.push(body.sub);
    salvarSubs(subs);

    return {
      statusCode: 200,
      body: "subscribed"
    };
  }

  // enviar push para todos
  if (body.type === "broadcast") {
    const subs = lerSubs();
    const payload = JSON.stringify(body.payload);

    for (const sub of subs) {
      try {
        await webpush.sendNotification(sub, payload);
      } catch (e) {}
    }

    return { statusCode: 200, body: "sent" };
  }

  return { statusCode: 200, body: "noop" };
};
