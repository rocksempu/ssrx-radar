const STORAGE_KEY = "ssrx_eventos";

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

function classificar() {
  const eventos = JSON.parse(localStorage.getItem(STORAGE_KEY));
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

  lista.forEach(e => {
    const inicio = horaParaMin(e.hora);
    const marco = ehMarco(e.tipo);

    const el = document.createElement("div");
    el.className = "evento";
    el.innerHTML = `${e.hora} - <b>${e.evento}</b> (${e.tipo})`;

    if (marco) {
      // Evento de ponto único
      if (agoraMin === inicio) {
        agoraDiv.appendChild(el);
      } else if (inicio - agoraMin <= 15 && inicio - agoraMin > 0) {
        breveDiv.appendChild(el);
      } else if (agoraMin < inicio) {
        hojeDiv.appendChild(el);
      } else {
        perdidosDiv.appendChild(el);
      }
    } else {
      // Evento de duração
      const fim = inicio + e.duracao;

      if (agoraMin >= inicio && agoraMin <= fim) {
        agoraDiv.appendChild(el);
      } else if (inicio - agoraMin <= 15 && inicio - agoraMin > 0) {
        breveDiv.appendChild(el);
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
