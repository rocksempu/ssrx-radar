import { getStore } from "@netlify/blobs";
import webpush from "web-push";

const DIAS_EXPIRACAO = 15;

export default async (event) => {
  const store = getStore("subscriptions");

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const body = JSON.parse(event.body);

  // =====================================================
  // SALVAR INSCRIÇÃO (INTELIGENTE / SEM DUPLICAR DEVICE)
  // =====================================================
  if (body.type === "subscribe") {
    const sub = body.sub;

    const endpointKey = sub.endpoint.split("/").pop();
    const deviceId = body.deviceId; // vem do client

    const list = await store.list();

    // verifica se já existe esse device salvo
    for (const item of list.blobs) {
      if (item.key.startsWith("sent-")) continue;

      const raw = await store.get(item.key);
      const data = JSON.parse(raw);

      if (data.deviceId === deviceId) {
        // mesmo aparelho reinstalou → atualiza a inscrição
        await store.set(endpointKey, JSON.stringify({
          sub,
          deviceId,
          lastSeen: Date.now()
        }));

        await store.delete(item.key);
        return { statusCode: 200, body: "updated" };
      }
    }

    // novo device
    await store.set(endpointKey, JSON.stringify({
      sub,
      deviceId,
      lastSeen: Date.now()
    }));

    return { statusCode: 200, body: "subscribed" };
  }

  // =====================================================
  // ENVIAR PUSH + AUTO LIMPEZA DE MORTOS E ABANDONADOS
  // =====================================================
  if (body.type === "broadcast") {
    const payload = JSON.stringify(body.payload);
    const list = await store.list();

    for (const item of list.blobs) {
      if (item.key.startsWith("sent-")) continue;

      try {
        const raw = await store.get(item.key);
        const data = JSON.parse(raw);

        // remove devices abandonados há muitos dias
        const diasSemVida = (Date.now() - data.lastSeen) / 86400000;
        if (diasSemVida > DIAS_EXPIRACAO) {
          await store.delete(item.key);
          continue;
        }

        await webpush.sendNotification(data.sub, payload);

        // atualiza sinal de vida
        data.lastSeen = Date.now();
        await store.set(item.key, JSON.stringify(data));

      } catch (err) {
        if (err.statusCode === 410 || err.statusCode === 404) {
          await store.delete(item.key);
        }
      }
    }

    return { statusCode: 200, body: "sent" };
  }

  return { statusCode: 200, body: "noop" };
};
