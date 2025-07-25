const novaTarefaBtn = document.getElementById("novaTarefaBtn");
const modal = document.getElementById("modal");
const salvarBtn = document.getElementById("salvarBtn");
const cancelarBtn = document.getElementById("cancelarBtn");
const tarefaInput = document.getElementById("tarefaInput");
const horaInput = document.getElementById("horaInput");
const diaSelect = document.getElementById("diaSelect");
const modalTitulo = document.getElementById("modalTitulo");
const toggleTema = document.getElementById("toggleTema");
const buscarInput = document.getElementById("buscarInput");
const dias = document.querySelectorAll(".dia");

let modoEdicao = false;
let tarefaAtual = null;

novaTarefaBtn.addEventListener("click", () => abrirModal());
cancelarBtn.addEventListener("click", fecharModal);

salvarBtn.addEventListener("click", () => {
  const texto = tarefaInput.value.trim();
  const hora = horaInput.value;
  const dia = diaSelect.value;

  if (!texto || !hora) return;

  if (modoEdicao && tarefaAtual) {
    tarefaAtual.querySelector("strong").textContent = texto;
    tarefaAtual.querySelector("small").textContent = hora;
    tarefaAtual.dataset.hora = hora;
    tarefaAtual = null;
  } else {
    criarTarefa(texto, hora, dia);
  }

  salvarTarefas();
  fecharModal();
});

function abrirModal(tarefa = null, dia = "segunda") {
  modal.classList.remove("hidden");
  tarefaInput.value = tarefa ? tarefa.querySelector("strong").textContent : "";
  horaInput.value = tarefa ? tarefa.dataset.hora : "";
  diaSelect.value = dia;
  modoEdicao = !!tarefa;
  tarefaAtual = tarefa;
  modalTitulo.textContent = modoEdicao ? "Editar Tarefa" : "Adicionar Tarefa";
}

function fecharModal() {
  modal.classList.add("hidden");
  modoEdicao = false;
  tarefaAtual = null;
}

function criarTarefa(texto, hora, dia, id = Date.now()) {
  const tarefa = document.createElement("div");
  tarefa.classList.add("tarefa");
  tarefa.setAttribute("draggable", "true");
  tarefa.dataset.id = id;
  tarefa.dataset.hora = hora;

  tarefa.innerHTML = `<strong>${texto}</strong><small>${hora}</small>`;
  adicionarBotaoRemover(tarefa);

  tarefa.addEventListener("dragstart", (e) => {
    e.dataTransfer.setData("text/plain", id);
  });

  tarefa.addEventListener("dblclick", () => abrirModal(tarefa, dia));

  const coluna = document.querySelector(`.dia[data-dia="${dia}"]`);
  coluna.appendChild(tarefa);
  ordenarTarefas(coluna);

  agendarLembrete(texto, hora);
}

function adicionarBotaoRemover(tarefa) {
  const btn = document.createElement("button");
  btn.textContent = "🗑";
  btn.title = "Excluir";
  btn.onclick = () => {
    tarefa.remove();
    salvarTarefas();
  };
  tarefa.appendChild(btn);
}

dias.forEach(dia => {
  dia.addEventListener("dragover", e => e.preventDefault());
  dia.addEventListener("drop", e => {
    e.preventDefault();
    const id = e.dataTransfer.getData("text/plain");
    const tarefa = document.querySelector(`.tarefa[data-id="${id}"]`);
    dia.appendChild(tarefa);
    ordenarTarefas(dia);
    salvarTarefas();
  });
});

function salvarTarefas() {
  const dados = {};
  dias.forEach(dia => {
    const nome = dia.dataset.dia;
    const tarefas = [...dia.querySelectorAll(".tarefa")].map(t => ({
      id: t.dataset.id,
      texto: t.querySelector("strong").textContent,
      hora: t.dataset.hora
    }));
    dados[nome] = tarefas;
  });
  localStorage.setItem("agenda", JSON.stringify(dados));
}

function carregarTarefas() {
  const dados = JSON.parse(localStorage.getItem("agenda"));
  if (!dados) return;

  Object.keys(dados).forEach(dia => {
    dados[dia].forEach(tarefa => {
      criarTarefa(tarefa.texto, tarefa.hora, dia, tarefa.id);
    });
  });
}

// Ordenar por horário
function ordenarTarefas(coluna) {
  const tarefas = [...coluna.querySelectorAll(".tarefa")];
  tarefas.sort((a, b) => a.dataset.hora.localeCompare(b.dataset.hora));
  tarefas.forEach(t => coluna.appendChild(t));
}

// Tema escuro
toggleTema.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("tema") === "dark") {
  document.body.classList.add("dark");
}

// Busca de tarefas
buscarInput.addEventListener("input", () => {
  const termo = buscarInput.value.toLowerCase();
  document.querySelectorAll(".tarefa").forEach(tarefa => {
    const texto = tarefa.querySelector("strong").textContent.toLowerCase();
    tarefa.style.display = texto.includes(termo) ? "block" : "none";
  });
});

// Notificação
function agendarLembrete(texto, hora) {
  if (!("Notification" in window)) return;

  Notification.requestPermission().then(permissao => {
    if (permissao !== "granted") return;

    const agora = new Date();
    const [h, m] = hora.split(":");
    const alvo = new Date();
    alvo.setHours(+h, +m, 0, 0);

    const diff = alvo - agora;

    if (diff > 0 && diff < 86400000) {
      setTimeout(() => {
        new Notification("Lembrete de Tarefa", {
          body: `${hora} - ${texto}`,
        });
      }, diff);
    }
  });
}

carregarTarefas();
