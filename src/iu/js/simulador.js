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

    readOnly: false, // importante
    automaticLayout: true,

    fontSize: 14,
    fontFamily: "Consolas, 'Courier New', monospace",

    minimap: { enabled: false },
    scrollBeyondLastLine: false,
  });

  editor.focus(); // FUERZA foco
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

function play() {
  if (!isPlaying) {
    isPlaying = true;
    playInterval = setInterval(() => {
      if (currentLine < lines.length) {
        console.log("Ejecutando línea:", lines[currentLine]);
        currentLine++;
        updateInputs();
      } else {
        stop();
      }
    }, 1000);
  }
}

function pause() {
  if (isPlaying) {
    clearInterval(playInterval);
    isPlaying = false;
  }
}

function step() {
  if (currentLine < lines.length) {
    console.log("Ejecutando línea:", lines[currentLine]);
    currentLine++;
    updateInputs();
  }
}

function stop() {
  clearInterval(playInterval);
  isPlaying = false;
  currentLine = 0;
  updateInputs();
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
  currentLine = 0;
  updateInputs();
  console.log("Código cargado para simulación:", lines);
});

document.getElementById("btnIndex").addEventListener("click", function () {
    window.location.href = "index.html";
});


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
