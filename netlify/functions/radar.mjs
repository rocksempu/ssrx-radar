export const config = {
  schedule: "*/1 * * * *"
};

import { getStore } from "@netlify/blobs";
import webpush from "web-push";

function horaParaMin(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

function agoraBrasil() {
  return new Date(
    new Date().toLocaleString("en-US", {
      timeZone: "America/Sao_Paulo"
    })
  );
}

function minutosAgoraBrasil() {
  const agora = agoraBrasil();
  return agora.getHours() * 60 + agora.getMinutes();
}

function diaHojeBrasil() {
  const dias = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
  return dias[agoraBrasil().getDay()];
}

export default async () => {
  const store = getStore({
    name: "subscriptions",
    siteID: process.env.SITE_ID,
    token: process.env.NETLIFY_API_TOKEN
  });

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  const resp = await fetch("https://ssrx-radar.netlify.app/events.json");
  const eventos = await resp.json();

  const hoje = diaHojeBrasil();
  const lista = eventos[hoje] || [];
  const agoraMin = minutosAgoraBrasil();

  const { blobs } = await store.list();

  for (const e of lista) {
    const inicio = horaParaMin(e.hora);
    const diff = inicio - agoraMin;

    if (diff <= 15 && diff > 0) {
      const idEvento = `${hoje}-${e.evento}-${e.tipo}-${e.hora}`;

      const jaEnviado = await store.get(`sent-${idEvento}`);
      if (jaEnviado) continue;

      const payload = JSON.stringify({
        title: "⏰ SSRX Radar",
        body: `${e.evento} (${e.tipo}) abre em instantes!`
      });

      // 🔥 envia para todas subscriptions válidas
      for (const b of blobs) {
        if (b.key.startsWith("sent-")) continue;

        try {
          const sub = JSON.parse(await store.get(b.key));
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          if (err.statusCode === 410 || err.statusCode === 404) {
            await store.delete(b.key);
          }
        }
      }

      // 🔥 marca que já enviou SOMENTE depois de enviar para todos
      await store.set(`sent-${idEvento}`, "ok");
    }
  }

  return new Response("ok");
};
