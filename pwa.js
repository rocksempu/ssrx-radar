if ("serviceWorker" in navigator) {
  navigator.serviceWorker.register("sw.js");
}

Notification.requestPermission();

function notificar(titulo, corpo) {
  if (Notification.permission === "granted") {
    new Notification(titulo, { body: corpo });
  }
}

function ehMarco(tipo) {
  const marcos = ["Inscrições","Pareamento","Resultado","Preparação","Trégua"];
  return marcos.includes(tipo);
}

setInterval(() => {
  const eventos = JSON.parse(localStorage.getItem("ssrx_eventos"));
  const dias = ["domingo","segunda","terca","quarta","quinta","sexta","sabado"];
  const hoje = dias[new Date().getDay()];
  const agora = new Date();
  const agoraMin = agora.getHours()*60 + agora.getMinutes();

  (eventos[hoje] || []).forEach(e => {
    const [h,m] = e.hora.split(":").map(Number);
    const inicio = h*60 + m;
    const marco = ehMarco(e.tipo);

    // 15 min antes
    if (inicio - agoraMin === 15) {
      notificar("SSRX Radar", `${e.evento} (${e.tipo}) começa em 15 min`);
    }

    // Momento exato
    if (agoraMin === inicio) {
      if (marco) {
        notificar("SSRX Radar", `${e.evento} (${e.tipo}) AGORA`);
      } else {
        notificar("SSRX Radar", `${e.evento} (${e.tipo}) começou agora!`);
      }
    }

  });

}, 60000);
