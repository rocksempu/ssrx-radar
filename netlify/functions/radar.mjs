export const config = {
  schedule: "*/1 * * * *"
};

import { getStore } from "@netlify/blobs";
import webpush from "web-push";

function horaParaMin(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
}

// 🔥 força horário do Brasil (GMT-3) dentro da Netlify
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

  // 🔥 obrigatório para scheduled function
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

  // 🔥 API correta do Blobs
  const { blobs } = await store.list();

  for (const e of lista) {
    const inicio = horaParaMin(e.hora);
    const diff = inicio - agoraMin;

    // janela de 15 minutos
    if (diff <= 15 && diff > 0) {

      const payload = JSON.stringify({
        title: "⏰ SSRX Radar",
        body: `${e.evento} (${e.tipo}) abre em instantes!`
      });

      for (const b of blobs) {
        try {
          const sub = JSON.parse(await store.get(b.key));
          await webpush.sendNotification(sub, payload);
        } catch {}
      }
    }
  }

  return new Response("ok");
};
