require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  const savedCode = localStorage.getItem("pic_code") || "; Código PIC16F84A\n";
  const editor = monaco.editor.create(document.getElementById("editor"), {
    value: savedCode,
    language: "plaintext",
    theme: "vs",

    readOnly: false,
    automaticLayout: true,

    fontSize: 14,
    fontFamily: "Consolas, 'Courier New', monospace",

    minimap: { enabled: false },
    scrollBeyondLastLine: false,
  });

  editor.onDidChangeModelContent(() => {
    localStorage.setItem("pic_code", editor.getValue());
  });

  editor.focus();
  window.editor = editor;
});

let currentLine = 0;
let lines = [];
let isPlaying = false;
let playInterval;

function showError(msg) {
  const panel = document.getElementById("errorPanel");
  if (!panel) return;
  panel.textContent = msg;
  panel.style.display = "block";
}

function hideError() {
  const panel = document.getElementById("errorPanel");
  if (panel) panel.style.display = "none";
}

function updateInputs() {
  const lastInput = document.getElementById("lastIntr");
  const nextInput = document.getElementById("nextIntr");

  lastInput.value = currentLine > 0 ? lines[currentLine - 1] : "";
  nextInput.value = currentLine < lines.length ? lines[currentLine] : "";
}

function updatePC(state) {
  let st = state;
  if (!st)
    st = window.PICInterpreter?.getState
      ? window.PICInterpreter.getState()
      : null;
  if (!st || st.PC === undefined) return;

  const el = document.getElementById("pcBin");
  if (!el) return;
  const pc = st.PC;
  el.value = pc.toString(2).padStart(11, "0");

  const lastInput = document.getElementById("lastIntr");
  const nextInput = document.getElementById("nextIntr");
  if (lastInput) lastInput.value = pc > 0 ? lines[pc - 1] : "";
  if (nextInput) nextInput.value = pc < lines.length ? lines[pc] : "";
}

function updateW(state) {
  if (state.W === undefined) return;

  const bits = state.W.toString(2).padStart(8, "0");
  document.querySelectorAll(".binary-view span").forEach((bit, i) => {
    const b = bits[i];
    bit.textContent = b; // mostrar 0/1 en W register
    bit.classList.toggle("active", b === "1");
  });
}

function executeCurrentLine() {
  const state = window.PICInterpreter?.getState
    ? window.PICInterpreter.getState()
    : null;
  const pc = state?.PC ?? currentLine;
  if (pc >= lines.length) {
    stop();
    return;
  }

  // Ejecutar la línea indicada por PC
  window.PICInterpreter.step(lines[pc]);

  const newState = window.PICInterpreter.getState();

  if (newState.stackError) {
    stop();
    showError("Error de stack: " + newState.stackError);
    return;
  }

  syncSFR(newState);
  updatePC(newState);
  updateW(newState);

  currentLine = newState.PC ?? pc + 1;
  updateInputs();
}
function play() {
  if (isPlaying) return;

  isPlaying = true;
  playInterval = setInterval(() => {
    executeCurrentLine();
  }, 700); // velocidad (ms)
}

function pause() {
  if (!isPlaying) return;
  clearInterval(playInterval);
  isPlaying = false;
}

function stop() {
  clearInterval(playInterval);
  isPlaying = false;
  currentLine = 0;
  if (window.PICInterpreter) PICInterpreter.reset();
  updateInputs();
}

function step() {
  executeCurrentLine();
}

document.getElementById("btnLimpiar").addEventListener("click", () => {
  if (window.editor) window.editor.setValue("");
  lines = [];
  currentLine = 0;
  updateInputs();
});

document.getElementById("btnSimular").addEventListener("click", () => {
  const codigo = window.editor ? window.editor.getValue() : "";
  lines = codigo.split("\n");

  // 1. Resetear intérprete
  PICInterpreter.reset();

  // 2. Validar código
  const errors = PICInterpreter.validate(lines);
  if (errors.length > 0) {
    showError(errors.map((e) => `Línea ${e.line}: ${e.error}`).join("\n"));
    return;
  }

  // 3. Inicializar simulación
  hideError();
  currentLine = 0;
  updateInputs();
});

document.getElementById("btnIndex").addEventListener("click", function () {
  window.location.href = "index.html";
});

document.querySelectorAll(".sfr-row").forEach((row) => {
  const hexSpan = row.querySelector("span:nth-child(3)");
  const bitSpans = row.querySelectorAll(".bits span");

  if (!hexSpan || bitSpans.length !== 8) return;

  // Leer hexadecimal
  const hexValue = hexSpan.textContent.trim();

  // Convertir HEX → BIN (8 bits)
  const bin = parseInt(hexValue, 16).toString(2).padStart(8, "0");

  // Asignar cada bit (mostrar texto solo si es 1)
  bitSpans.forEach((bitSpan, index) => {
    const b = bin[index];
    bitSpan.textContent = b === "1" ? "1" : "";

    // Estilos visuales: clase activa cuando es 1
    bitSpan.classList.toggle("active", b === "1");
  });
});

function updateSFRRow(row, value) {
  const hexSpan = row.querySelector("span:nth-child(3)");
  const bitSpans = row.querySelectorAll(".bits span");

  const hex = value.toString(16).toUpperCase().padStart(2, "0");
  hexSpan.textContent = hex;

  const bin = value.toString(2).padStart(8, "0");
  bitSpans.forEach((bitSpan, i) => {
    const b = bin[i];
    bitSpan.textContent = b === "1" ? "1" : "";
    bitSpan.classList.toggle("active", b === "1");
  });
}

function syncSFR(state) {
  document.querySelectorAll(".sfr-row").forEach((row) => {
    const addrSpan = row.querySelector("span:nth-child(1)");
    if (!addrSpan) return;

    // Addr text like "05h" or "00h" or "0Ah"
    const addrText = addrSpan.textContent.trim().replace(/h$/i, "");
    const addrNum = parseInt(addrText, 16);
    if (isNaN(addrNum)) return;

    const key = "0x" + addrNum.toString(16).toUpperCase().padStart(2, "0");
    const value = state.registers[key];

    if (value !== undefined) {
      updateSFRRow(row, value);
    }
  });

  document.querySelectorAll(".gpr-row").forEach((row) => {
    const spans = row.querySelectorAll("span");
    if (spans.length < 2) return;

    const addrText = spans[0].textContent.trim().replace(/h$/i, "");
    const addrNum = parseInt(addrText, 16);
    if (isNaN(addrNum)) return;

    const key = "0x" + addrNum.toString(16).toUpperCase().padStart(2, "0");
    const value = state.registers[key];

    if (value !== undefined) {
      spans[1].textContent = value.toString(16).toUpperCase().padStart(2, "0");
    }
  });
}

document.querySelector(".play").addEventListener("click", play);
document.querySelector(".pause").addEventListener("click", pause);
document.querySelector(".step").addEventListener("click", step);
document.querySelector(".stop").addEventListener("click", stop);
