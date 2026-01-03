require.config({
  paths: {
    vs: "https://cdnjs.cloudflare.com/ajax/libs/monaco-editor/0.45.0/min/vs",
  },
});

require(["vs/editor/editor.main"], function () {
  const editor = monaco.editor.create(document.getElementById("editor"), {
    value: "; Código PIC16F84A\n",
    language: "plaintext",
    theme: "vs",

    readOnly: false,
    automaticLayout: true,

    fontSize: 14,
    fontFamily: "Consolas, 'Courier New', monospace",

    minimap: { enabled: false },
    scrollBeyondLastLine: false,
  });

  editor.focus();
  window.editor = editor;
});

let currentLine = 0;
let lines = [];
let isPlaying = false;
let playInterval;

function updateInputs() {
  const lastInput = document.getElementById("lastIntr");
  const nextInput = document.getElementById("nextIntr");

  lastInput.value = currentLine > 0 ? lines[currentLine - 1] : "";
  nextInput.value = currentLine < lines.length ? lines[currentLine] : "";
}
function executeCurrentLine() {
  if (currentLine >= lines.length) {
    stop();
    return;
  }

  PICInterpreter.step(lines[currentLine]);

  const state = PICInterpreter.getState();
  syncSFR(state);

  currentLine++;
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
  updateInputs();
}


function step() {
  executeCurrentLine();
}




document.getElementById("btnLimpiar").addEventListener("click", () => {
  editor.setValue("");
  lines = [];
  currentLine = 0;
  updateInputs();
});


document.getElementById("btnSimular").addEventListener("click", () => {
  const codigo = editor.getValue();
  lines = codigo.split("\n");

  // 1. Resetear intérprete
  PICInterpreter.reset();

  // 2. Validar código
  const errors = PICInterpreter.validate(lines);
  if (errors.length > 0) {
    console.error("Errores de compilación:", errors);
    alert(
      errors
        .map(e => `Línea ${e.line}: ${e.error}`)
        .join("\n")
    );
    return;
  }

  // 3. Inicializar simulación
  currentLine = 0;
  updateInputs();

  console.log("Código válido. Listo para simular.");
});






document.getElementById("btnIndex").addEventListener("click", function () {
    window.location.href = "index.html";
});


document.querySelectorAll(".sfr-row").forEach(row => {
    const hexSpan = row.querySelector("span:nth-child(3)");
    const bitSpans = row.querySelectorAll(".bits span");

    if (!hexSpan || bitSpans.length !== 8) return;

    // Leer hexadecimal
    const hexValue = hexSpan.textContent.trim();

    // Convertir HEX → BIN (8 bits)
    const bin = parseInt(hexValue, 16)
        .toString(2)
        .padStart(8, "0");

    // Asignar cada bit
    bitSpans.forEach((bitSpan, index) => {
        bitSpan.textContent = bin[index];

        // Opcional: estilos visuales
        bitSpan.classList.toggle("bit-on", bin[index] === "1");
        bitSpan.classList.toggle("bit-off", bin[index] === "0");
    });
});


function updateSFRRow(row, value) {
  const hexSpan = row.querySelector("span:nth-child(3)");
  const bitSpans = row.querySelectorAll(".bits span");

  const hex = value.toString(16).toUpperCase().padStart(2, "0");
  hexSpan.textContent = hex;

  const bin = value.toString(2).padStart(8, "0");

  bitSpans.forEach((bitSpan, i) => {
    bitSpan.textContent = bin[i];
    bitSpan.classList.toggle("active", bin[i] === "1");
  });
}

function syncSFR(state) {
  document.querySelectorAll(".sfr-row").forEach(row => {
    const nameSpan = row.querySelector("span:nth-child(2)");
    if (!nameSpan) return;

    const regName = nameSpan.textContent.trim();
    const value = state.registers[regName];

    if (value !== undefined) {
      updateSFRRow(row, value);
    }
  });
}



document.querySelector(".play").addEventListener("click", play);
document.querySelector(".pause").addEventListener("click", pause);
document.querySelector(".step").addEventListener("click", step);
document.querySelector(".stop").addEventListener("click", stop);

// PC
document.getElementById("pcBin").value = pc.toString(2).padStart(13, "0");

// W
document.querySelectorAll(".binary-view span").forEach((bit, i) => {
  bit.classList.toggle("active", w & (1 << (7 - i)));
});

