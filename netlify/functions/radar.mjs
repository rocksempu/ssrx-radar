export const config = {
  schedule: "*/1 * * * *"
};

import { getStore } from "@netlify/blobs";
import webpush from "web-push";

function horaParaMin(hora) {
  const [h, m] = hora.split(":").map(Number);
  return h * 60 + m;
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
  const store = getStore("subscriptions");

  webpush.setVapidDetails(
    "mailto:admin@ssrx-radar",
    process.env.VAPID_PUBLIC_KEY,
    process.env.VAPID_PRIVATE_KEY
  );

  // carrega events.json do site
  const resp = await fetch("https://ssrx-radar.netlify.app/events.json");
  const eventos = await resp.json();

  const hoje = diaHoje();
  const lista = eventos[hoje] || [];
  const agoraMin = minutosAgora();

  for (const e of lista) {
    const inicio = horaParaMin(e.hora);

    // janela de 15 minutos antes
    if (inicio - agoraMin <= 15 && inicio - agoraMin > 0) {

      const payload = JSON.stringify({
        title: "⏰ SSRX Radar",
        body: `${e.evento} (${e.tipo}) abre em instantes!`
      });

      // ✅ API correta do Blobs (iterator)
      for await (const item of store.list()) {
        try {
          const sub = JSON.parse(await store.get(item.key));
          await webpush.sendNotification(sub, payload);
        } catch (err) {
          // se falhar, ignora (subscription inválida)
        }
      }
    }
  }

  return new Response("ok");
};
