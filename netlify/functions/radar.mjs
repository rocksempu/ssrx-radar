export const config = {
  schedule: "*/1 * * * *"
};

import { getStore } from "@netlify/blobs";
import webpush from "web-push";

function horaParaMin(hora) {
  const [h,m] = hora.split(":").map(Number);
  return h*60 + m;
}

function minutosAgora() {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

function diaHoje() {
  const dias = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
  return dias[new Date().getDay()];
}

export default async () => {

  // 🔥 OBRIGATÓRIO para scheduled function
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

  const hoje = diaHoje();
  const lista = eventos[hoje] || [];
  const agoraMin = minutosAgora();

  const { blobs } = await store.list();

  for (const e of lista) {
    const inicio = horaParaMin(e.hora);

    if (inicio - agoraMin <= 15 && inicio - agoraMin > 0) {

      const payload = JSON.stringify({
        title: "⏰ SSRX Radar",
        body: `${e.evento} (${e.tipo}) abre em instantes!`
      });

      for (const b of blobs) {
        const sub = JSON.parse(await store.get(b.key));
        try {
          await webpush.sendNotification(sub, payload);
        } catch {}
      }
    }
  }

  return new Response("ok");
};
