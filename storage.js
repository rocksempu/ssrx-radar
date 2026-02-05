const STORAGE_KEY = "ssrx_eventos";

function getEventos() {
  return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {};
}

function salvarEventos(data) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
  renderLista();
}

function addEvento() {
  const dia = document.getElementById("dia").value;
  const evento = document.getElementById("evento").value;
  const fase = document.getElementById("fase").value;
  const hora = document.getElementById("hora").value;
  const duracao = parseInt(document.getElementById("duracao").value);

  if (!evento || !hora || !duracao) {
    alert("Preencha os campos obrigatórios!");
    return;
  }

  const dados = getEventos();

  if (!dados[dia]) dados[dia] = [];

  dados[dia].push({ evento, fase, hora, duracao });

  salvarEventos(dados);

  document.querySelectorAll("input").forEach(i => i.value = "");
}

function renderLista() {
  const lista = document.getElementById("lista");
  const dados = getEventos();

  lista.innerHTML = "";

  Object.keys(dados).forEach(dia => {
    const h3 = document.createElement("h3");
    h3.textContent = dia.toUpperCase();
    lista.appendChild(h3);

    dados[dia].forEach((e, i) => {
      const div = document.createElement("div");
      div.className = "evento";
      div.innerHTML = `
        ${e.hora} - <b>${e.evento}</b> (${e.fase}) - ${e.duracao}min
        <button onclick="remover('${dia}', ${i})">❌</button>
      `;
      lista.appendChild(div);
    });
  });
}

function remover(dia, index) {
  const dados = getEventos();
  dados[dia].splice(index, 1);
  salvarEventos(dados);
}

function exportar() {
  const dados = getEventos();
  const blob = new Blob([JSON.stringify(dados, null, 2)], {type: "application/json"});
  const url = URL.createObjectURL(blob);

  const a = document.createElement("a");
  a.href = url;
  a.download = "events.json";
  a.click();
}

function importar(event) {
  const file = event.target.files[0];
  const reader = new FileReader();

  reader.onload = function(e) {
    localStorage.setItem(STORAGE_KEY, e.target.result);
    renderLista();
  };

  reader.readAsText(file);
}

renderLista();
