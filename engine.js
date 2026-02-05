const PUSH_KEY = "ssrx_push_enviados";

async function dispararPush(evento, hoje) {
  try {
    await fetch("/.netlify/functions/push", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "broadcast",
        payload: {
          title: "⏰ SSRX Radar",
          body: `${evento.evento} (${evento.tipo}) abre em instantes!`
        }
      })
    });

    const enviados = JSON.parse(localStorage.getItem(PUSH_KEY) || "[]");
    const id = `${hoje}-${evento.evento}-${evento.tipo}-${evento.hora}`;
    enviados.push(id);
    localStorage.setItem(PUSH_KEY, JSON.stringify(enviados));

  } catch (e) {
    console.error("Erro ao disparar push", e);
  }
}

async function carregarEventos() {
  const resp = await fetch("events.json");
  return await resp.json();
}

function diaHoje() {
  const dias = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
  return dias[new Date().getDay()];
}

function minutosAgora() {
  const agora = new Date();
  return agora.getHours() * 60 + agora.getMinutes();
}

function horaParaMin(hora) {
  const [h,m] = hora.split(":").map(Number);
  return h*60 + m;
}

function ehMarco(tipo) {
  const marcos = ["Inscrições","Pareamento","Resultado","Preparação","Trégua"];
  return marcos.includes(tipo);
}

async function classificar() {
  const eventos = await carregarEventos();
  const hoje = diaHoje();
  const lista = eventos[hoje] || [];

  const agoraDiv = document.getElementById("agora");
  const breveDiv = document.getElementById("breve");
  const hojeDiv = document.getElementById("hoje");
  const perdidosDiv = document.getElementById("perdidos");

  agoraDiv.innerHTML = "";
  breveDiv.innerHTML = "";
  hojeDiv.innerHTML = "";
  perdidosDiv.innerHTML = "";

  const agoraMin = minutosAgora();
  const enviados = JSON.parse(localStorage.getItem(PUSH_KEY) || "[]");

  lista.forEach(e => {
    const inicio = horaParaMin(e.hora);
    const marco = ehMarco(e.tipo);

    const el = document.createElement("div");
    el.className = "evento";
    el.innerHTML = `${e.hora} - <b>${e.evento}</b> (${e.tipo})`;

    const idEvento = `${hoje}-${e.evento}-${e.tipo}-${e.hora}`;

    if (marco) {
      if (agoraMin === inicio) {
        agoraDiv.appendChild(el);
      } else if (inicio - agoraMin <= 15 && inicio - agoraMin > 0) {
        breveDiv.appendChild(el);

        if (!enviados.includes(idEvento)) {
          dispararPush(e, hoje);
        }

      } else if (agoraMin < inicio) {
        hojeDiv.appendChild(el);
      } else {
        perdidosDiv.appendChild(el);
      }
    } else {
      const fim = inicio + e.duracao;

      if (agoraMin >= inicio && agoraMin <= fim) {
        agoraDiv.appendChild(el);
      } else if (inicio - agoraMin <= 15 && inicio - agoraMin > 0) {
        breveDiv.appendChild(el);

        if (!enviados.includes(idEvento)) {
          dispararPush(e, hoje);
        }

      } else if (agoraMin < inicio) {
        hojeDiv.appendChild(el);
      } else {
        perdidosDiv.appendChild(el);
      }
    }
  });
}

setInterval(classificar, 60000);
classificar();
