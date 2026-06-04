/* ── Agenda Semanal — script.js ─────────────────────────────────────────── */

const $ = id => document.getElementById(id);
const $$ = sel => document.querySelectorAll(sel);

// ── DOM refs ────────────────────────────────────────────────────────────────
const novaTarefaBtn = $("novaTarefaBtn");
const modal         = $("modal");
const modalBackdrop = modal.querySelector(".modal-backdrop");
const salvarBtn     = $("salvarBtn");
const cancelarBtn   = $("cancelarBtn");
const tarefaInput   = $("tarefaInput");
const horaInput     = $("horaInput");
const diaSelect     = $("diaSelect");
const modalTitulo   = $("modalTitulo");
const toggleTema    = $("toggleTema");
const buscarInput   = $("buscarInput");
const dias          = $$(".dia");
const toast         = $("toast");

let modoEdicao  = false;
let tarefaAtual = null;
let toastTimer  = null;

// ── Datas ───────────────────────────────────────────────────────────────────
function getSegundaFeira() {
  const hoje = new Date();
  const diaSemana = hoje.getDay(); // 0=dom, 1=seg...
  const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
  const seg = new Date(hoje);
  seg.setDate(hoje.getDate() + diff);
  seg.setHours(0, 0, 0, 0);
  return seg;
}

function initDatas() {
  const seg = getSegundaFeira();
  const options = { day: "numeric", month: "long" };
  const dom = new Date(seg);
  dom.setDate(seg.getDate() + 6);

  $("semanaRange").textContent =
    seg.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }) +
    " – " +
    dom.toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" });

  $("dataAtual").textContent =
    new Date().toLocaleDateString("pt-BR", { weekday: "long", day: "numeric", month: "long", year: "numeric" });

  $$(".dia-data").forEach(el => {
    const offset = parseInt(el.dataset.offset);
    const d = new Date(seg);
    d.setDate(seg.getDate() + offset);
    el.textContent = d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" });
  });

  // Destacar hoje
  const hoje = new Date();
  hoje.setHours(0, 0, 0, 0);
  const diasMap = ["domingo", "segunda", "terca", "quarta", "quinta", "sexta", "sabado"];
  const diaHoje = diasMap[new Date().getDay()];
  const colHoje = document.querySelector(`.dia[data-dia="${diaHoje}"]`);
  if (colHoje) colHoje.classList.add("hoje");
}

// ── Toast ────────────────────────────────────────────────────────────────────
function showToast(msg, duration = 2500) {
  clearTimeout(toastTimer);
  toast.textContent = msg;
  toast.classList.remove("hidden");
  toastTimer = setTimeout(() => toast.classList.add("hidden"), duration);
}

// ── Modal ────────────────────────────────────────────────────────────────────
novaTarefaBtn.addEventListener("click", () => abrirModal());
cancelarBtn.addEventListener("click", fecharModal);
modalBackdrop.addEventListener("click", fecharModal);

document.addEventListener("keydown", e => {
  if (e.key === "Escape" && !modal.classList.contains("hidden")) fecharModal();
  if (e.key === "/" && document.activeElement !== buscarInput) {
    e.preventDefault();
    buscarInput.focus();
  }
});

salvarBtn.addEventListener("click", salvarTarefa);
tarefaInput.addEventListener("keydown", e => { if (e.key === "Enter") salvarTarefa(); });

function salvarTarefa() {
  const texto = tarefaInput.value.trim();
  const hora  = horaInput.value;
  const dia   = diaSelect.value;
  const prioridade = document.querySelector("input[name='prioridade']:checked")?.value || "media";

  if (!texto) { tarefaInput.focus(); return; }
  if (!hora)  { horaInput.focus();   return; }

  if (modoEdicao && tarefaAtual) {
    tarefaAtual.querySelector(".tarefa-texto").textContent = texto;
    tarefaAtual.querySelector(".tarefa-hora").innerHTML = clockSVG() + hora;
    tarefaAtual.dataset.hora = hora;
    tarefaAtual.dataset.prioridade = prioridade;
    tarefaAtual.className = `tarefa prioridade-${prioridade}` + (tarefaAtual.dataset.concluida === "true" ? " concluida" : "");
    tarefaAtual = null;
    showToast("✏️ Tarefa atualizada");
  } else {
    criarTarefa(texto, hora, dia, Date.now(), prioridade);
    showToast("✅ Tarefa adicionada");
  }

  salvarTarefas();
  fecharModal();
}

function abrirModal(tarefa = null, dia = "segunda") {
  modal.classList.remove("hidden");
  tarefaInput.value = tarefa ? tarefa.querySelector(".tarefa-texto").textContent : "";
  horaInput.value   = tarefa ? tarefa.dataset.hora : "";
  diaSelect.value   = dia;
  modoEdicao  = !!tarefa;
  tarefaAtual = tarefa;
  modalTitulo.textContent = modoEdicao ? "Editar Tarefa" : "Nova Tarefa";

  const prioridade = tarefa ? (tarefa.dataset.prioridade || "media") : "media";
  const radioEl = document.querySelector(`input[name='prioridade'][value='${prioridade}']`);
  if (radioEl) radioEl.checked = true;

  setTimeout(() => tarefaInput.focus(), 80);
}

function fecharModal() {
  modal.classList.add("hidden");
  modoEdicao  = false;
  tarefaAtual = null;
}

// ── Criar tarefa ─────────────────────────────────────────────────────────────
function clockSVG() {
  return `<svg viewBox="0 0 20 20" fill="none"><circle cx="10" cy="10" r="7" stroke="currentColor" stroke-width="1.5"/><path d="M10 7v3.5l2.5 1.5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/></svg>`;
}

function criarTarefa(texto, hora, dia, id = Date.now(), prioridade = "media", concluida = false) {
  const tarefa = document.createElement("div");
  tarefa.classList.add("tarefa", `prioridade-${prioridade}`);
  if (concluida) tarefa.classList.add("concluida");
  tarefa.setAttribute("draggable", "true");
  tarefa.dataset.id = id;
  tarefa.dataset.hora = hora;
  tarefa.dataset.prioridade = prioridade;
  tarefa.dataset.concluida = concluida;

  tarefa.innerHTML = `
    <div class="tarefa-inner">
      <div class="tarefa-check" title="Concluir"></div>
      <div class="tarefa-body">
        <div class="tarefa-texto">${escapeHtml(texto)}</div>
        <div class="tarefa-hora">${clockSVG()}${hora}</div>
      </div>
      <div class="tarefa-actions">
        <button class="tarefa-btn btn-edit" title="Editar">
          <svg viewBox="0 0 20 20" fill="none"><path d="M13.586 3.586a2 2 0 112.828 2.828l-9.9 9.9-3.9.9.9-3.9 9.9-9.9-2.072 2.072z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
        <button class="tarefa-btn btn-delete" title="Excluir">
          <svg viewBox="0 0 20 20" fill="none"><path d="M6 4h8M8 4V3h4v1M4 6h12l-1.5 11H5.5L4 6z" stroke="currentColor" stroke-width="1.3" stroke-linecap="round" stroke-linejoin="round"/></svg>
        </button>
      </div>
    </div>
  `;

  // Concluir
  tarefa.querySelector(".tarefa-check").addEventListener("click", e => {
    e.stopPropagation();
    const isConcluida = tarefa.classList.toggle("concluida");
    tarefa.dataset.concluida = isConcluida;
    salvarTarefas();
  });

  // Editar
  tarefa.querySelector(".btn-edit").addEventListener("click", e => {
    e.stopPropagation();
    abrirModal(tarefa, dia);
  });

  // Excluir
  tarefa.querySelector(".btn-delete").addEventListener("click", e => {
    e.stopPropagation();
    tarefa.style.animation = "taskOut 0.2s ease forwards";
    setTimeout(() => {
      tarefa.remove();
      atualizarContadores();
      salvarTarefas();
    }, 180);
    showToast("🗑️ Tarefa removida");
  });

  // Drag
  tarefa.addEventListener("dragstart", e => {
    e.dataTransfer.setData("text/plain", id);
    tarefa.style.opacity = "0.5";
  });
  tarefa.addEventListener("dragend", () => {
    tarefa.style.opacity = "";
  });

  // Duplo clique para editar
  tarefa.addEventListener("dblclick", () => abrirModal(tarefa, dia));

  const coluna = document.querySelector(`.dia[data-dia="${dia}"] .tarefas-lista`);
  if (coluna) {
    coluna.appendChild(tarefa);
    ordenarTarefas(coluna);
    atualizarEmptyState(coluna.closest(".dia"));
    atualizarContadores();
    agendarLembrete(texto, hora);
  }
}

function escapeHtml(str) {
  return str.replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");
}

// ── Drag & Drop ───────────────────────────────────────────────────────────────
dias.forEach(dia => {
  const lista = dia.querySelector(".tarefas-lista");

  dia.addEventListener("dragover", e => {
    e.preventDefault();
    dia.classList.add("drag-over");
  });

  dia.addEventListener("dragleave", e => {
    if (!dia.contains(e.relatedTarget)) dia.classList.remove("drag-over");
  });

  dia.addEventListener("drop", e => {
    e.preventDefault();
    dia.classList.remove("drag-over");
    const id = e.dataTransfer.getData("text/plain");
    const tarefa = document.querySelector(`.tarefa[data-id="${id}"]`);
    if (!tarefa) return;
    lista.appendChild(tarefa);
    ordenarTarefas(lista);
    atualizarEmptyState(dia);
    // Update original column empty state
    dias.forEach(d => atualizarEmptyState(d));
    atualizarContadores();
    salvarTarefas();
  });
});

// ── Ordenar e contadores ──────────────────────────────────────────────────────
function ordenarTarefas(lista) {
  const tarefas = [...lista.querySelectorAll(".tarefa")];
  tarefas.sort((a, b) => a.dataset.hora.localeCompare(b.dataset.hora));
  tarefas.forEach(t => lista.appendChild(t));
}

function atualizarContadores() {
  dias.forEach(dia => {
    const count = dia.querySelectorAll(".tarefa").length;
    const el = dia.querySelector(".tarefa-count");
    el.textContent = count;
    el.classList.toggle("has-tasks", count > 0);
  });
}

function atualizarEmptyState(diaEl) {
  const lista = diaEl.querySelector(".tarefas-lista");
  const existente = lista.querySelector(".empty-state");
  const temTarefas = lista.querySelectorAll(".tarefa").length > 0;

  if (!temTarefas && !existente) {
    const empty = document.createElement("div");
    empty.className = "empty-state";
    empty.innerHTML = `
      <svg viewBox="0 0 24 24" fill="none">
        <rect x="3" y="4" width="18" height="16" rx="2" stroke="currentColor" stroke-width="1.5"/>
        <path d="M8 10h8M8 14h5" stroke="currentColor" stroke-width="1.5" stroke-linecap="round"/>
      </svg>
      <span>Sem tarefas</span>
    `;
    lista.appendChild(empty);
  } else if (temTarefas && existente) {
    existente.remove();
  }
}

// ── Persistência ──────────────────────────────────────────────────────────────
function salvarTarefas() {
  const dados = {};
  dias.forEach(dia => {
    const nome = dia.dataset.dia;
    dados[nome] = [...dia.querySelectorAll(".tarefa")].map(t => ({
      id:         t.dataset.id,
      texto:      t.querySelector(".tarefa-texto").textContent,
      hora:       t.dataset.hora,
      prioridade: t.dataset.prioridade || "media",
      concluida:  t.dataset.concluida === "true"
    }));
  });
  localStorage.setItem("agenda_v2", JSON.stringify(dados));
}

function carregarTarefas() {
  // Tenta versão nova, cai para antiga se não existir
  const raw = localStorage.getItem("agenda_v2") || localStorage.getItem("agenda");
  if (!raw) return;
  const dados = JSON.parse(raw);
  Object.keys(dados).forEach(dia => {
    dados[dia].forEach(t => {
      criarTarefa(t.texto, t.hora, dia, t.id, t.prioridade || "media", t.concluida || false);
    });
  });
}

// ── Tema ───────────────────────────────────────────────────────────────────────
toggleTema.addEventListener("click", () => {
  document.body.classList.toggle("dark");
  localStorage.setItem("tema", document.body.classList.contains("dark") ? "dark" : "light");
});

if (localStorage.getItem("tema") === "dark") document.body.classList.add("dark");

// ── Busca ─────────────────────────────────────────────────────────────────────
buscarInput.addEventListener("input", () => {
  const termo = buscarInput.value.toLowerCase().trim();
  $$(".tarefa").forEach(t => {
    const texto = t.querySelector(".tarefa-texto").textContent.toLowerCase();
    const visivel = !termo || texto.includes(termo);
    t.style.display = visivel ? "" : "none";
  });
});

// ── Notificação ───────────────────────────────────────────────────────────────
function agendarLembrete(texto, hora) {
  if (!("Notification" in window)) return;
  Notification.requestPermission().then(p => {
    if (p !== "granted") return;
    const [h, m] = hora.split(":").map(Number);
    const alvo = new Date();
    alvo.setHours(h, m, 0, 0);
    const diff = alvo - Date.now();
    if (diff > 0 && diff < 86400000) {
      setTimeout(() => {
        new Notification("⏰ Lembrete de Tarefa", {
          body: `${hora} — ${texto}`,
          icon: "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 32 32'%3E%3Crect width='32' height='32' rx='8' fill='%23c84b2f'/%3E%3C/svg%3E"
        });
      }, diff);
    }
  });
}

// ── Estilo taskOut ─────────────────────────────────────────────────────────────
const style = document.createElement("style");
style.textContent = `
  @keyframes taskOut {
    to { opacity: 0; transform: scale(0.85); max-height: 0; margin: 0; padding: 0; }
  }
`;
document.head.appendChild(style);

// ── Init ───────────────────────────────────────────────────────────────────────
initDatas();
carregarTarefas();

// Empty states iniciais
dias.forEach(dia => atualizarEmptyState(dia));
atualizarContadores();
