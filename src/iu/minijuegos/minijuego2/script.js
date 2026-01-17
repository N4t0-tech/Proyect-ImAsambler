document.addEventListener("DOMContentLoaded", function () {
  const modeBinary = document.getElementById("modeBinary");
  const modeError = document.getElementById("modeError");
  const binarySection = document.getElementById("binarySection");
  const errorSection = document.getElementById("errorSection");

  const portbValue = document.getElementById("portbValue");
  const portbMode = document.getElementById("portbMode");
  const leds = document.getElementById("leds");
  const ledPreview = document.getElementById("ledPreview");
  const newByteBtn = document.getElementById("newByte");
  const checkBinaryBtn = document.getElementById("checkBinary"); // Keep reference for future use
  const binaryResult = document.getElementById("binaryResult");

  const asmCode = document.getElementById("asmCode");
  const showHintBtn = document.getElementById("showHint");
  const checkAsmBtn = document.getElementById("checkAsm");
  const asmResult = document.getElementById("asmResult");
  const hintArea = document.getElementById("hintArea");

  let currentBits = "00000000";

  modeBinary.addEventListener("click", () => switchMode("binary"));
  modeError.addEventListener("click", () => switchMode("error"));

  newByteBtn.addEventListener("click", () => {
    setNewByte();
    binaryResult.textContent = "";
  });
  // checkBinaryBtn.addEventListener("click", checkBinary); // Remove listener for button

  showHintBtn.addEventListener("click", showAsmHint);
  checkAsmBtn.addEventListener("click", checkAsm);

  function switchMode(mode) {
    modeBinary.classList.remove("active");
    modeError.classList.remove("active");
    binarySection.classList.add("hidden");
    errorSection.classList.add("hidden");
    if (mode === "binary") {
      modeBinary.classList.add("active");
      binarySection.classList.remove("hidden");
    } else {
      modeError.classList.add("active");
      errorSection.classList.remove("hidden");
    }
  }

  function generateRandomByte() {
    let n = Math.floor(Math.random() * 256);
    return n.toString(2).padStart(8, "0");
  }

  function renderLeds(bits) {
    leds.innerHTML = "";
    for (let i = 7; i >= 0; i--) {
      const b = bits[7 - i];
      const btn = document.createElement("button");
      btn.className = "led";
      btn.dataset.index = i;
      btn.dataset.bit = b;
      btn.innerText = i;
      btn.addEventListener("click", () => {
        btn.classList.toggle("on");
        updatePreviewOverall();
      });
      leds.appendChild(btn);
    }
  }

  function updatePreviewOverall() {
    if (!ledPreview) return;
    const label = document.querySelector(".led-label");
    const buttons = Array.from(document.querySelectorAll("#leds .led"));
    const selected = buttons
      .map((b) => (b.classList.contains("on") ? "1" : "0"))
      .reverse()
      .join("");
    const expected = currentBits.split("").reverse().join("");
    const expectedCount = (expected.match(/1/g) || []).length;
    let correctOn = 0;
    let wrongOn = 0;
    for (let i = 0; i < 8; i++) {
      if (expected[i] === "1" && selected[i] === "1") correctOn++;
      if (expected[i] === "0" && selected[i] === "1") wrongOn++;
    }
    const fraction = expectedCount > 0 ? correctOn / expectedCount : 0;
    const percent = Math.round(fraction * 100);

    // aplicar degradado proporcional: verde -> oscuro
    if (percent > 0) {
      ledPreview.style.background = `linear-gradient(90deg, #1a7f37 ${percent}%, #102030 ${percent}%)`;
      ledPreview.classList.remove("off");
      ledPreview.classList.add("on");
    } else {
      // estado apagado
      ledPreview.style.background = "";
      ledPreview.classList.remove("on");
      ledPreview.classList.add("off");
    }

    if (label)
      label.textContent =
        expectedCount > 0
          ? `Acertados: ${correctOn}/${expectedCount}`
          : "Indicador";

    // Comprobación automática: cuando el número de seleccionados alcance el número esperado
    const selectedCount = (selected.match(/1/g) || []).length;
    if (selectedCount === expectedCount) {
      checkBinary();
    }
    // si hay al menos un error (selección donde debería ser 0), mostrar rojo completo
    if (wrongOn > 0) {
      ledPreview.style.background = "#b12a2a";
      ledPreview.classList.remove("off");
      ledPreview.classList.add("on");
      if (label) label.textContent = `Errores: ${wrongOn}`;
    } else {
      // aplicar degradado proporcional: verde -> oscuro según aciertos
      if (percent > 0) {
        ledPreview.style.background = `linear-gradient(90deg, #1a7f37 ${percent}%, #102030 ${percent}%)`;
        ledPreview.classList.remove("off");
        ledPreview.classList.add("on");
      } else {
        // estado apagado
        ledPreview.style.background = "";
        ledPreview.classList.remove("on");
        ledPreview.classList.add("off");
      }
      if (label)
        label.textContent =
          expectedCount > 0
            ? `Acertados: ${correctOn}/${expectedCount}`
            : "Indicador";
    }
  }

  function setNewByte() {
    currentBits = generateRandomByte();
    // elegir modo de pista: 60% binario, 20% hex, 20% decimal
    const r = Math.random();
    let mode = "bin";
    if (r < 0.6) mode = "bin";
    else if (r < 0.8) mode = "hex";
    else mode = "dec";
    if (mode === "bin") {
      portbValue.textContent = currentBits;
      if (portbMode) portbMode.textContent = "BIN";
    } else if (mode === "hex") {
      const v = parseInt(currentBits, 2);
      portbValue.textContent =
        "0x" + v.toString(16).padStart(2, "0").toUpperCase();
      if (portbMode) portbMode.textContent = "HEX";
    } else {
      const v = parseInt(currentBits, 2);
      portbValue.textContent = v.toString(10);
      if (portbMode) portbMode.textContent = "DEC";
    }
    renderLeds(currentBits);
  }

  function checkBinary() {
    const buttons = Array.from(document.querySelectorAll("#leds .led"));
    const selected = buttons
      .map((b) => (b.classList.contains("on") ? "1" : "0"))
      .reverse()
      .join("");
    const expected = currentBits.split("").reverse().join("");
    const selectedCount = (selected.match(/1/g) || []).length;
    const expectedCount = (currentBits.match(/1/g) || []).length;
    if (selected === expected) {
      binaryResult.textContent = `Correcto — ${expectedCount} LEDs encendidos.`;
      binaryResult.className = "result success";
    } else {
      binaryResult.textContent = `Error. Deben estar encendidos ${expectedCount}. Revisa las posiciones.`;
      binaryResult.className = "result fail";
    }
  }

  // Código assembler: carga ejemplo con error
  const initialAsm = `bsf STATUS, RP0\nclrf TRISB\nbcf STATUS, RP0\n\nmovlw b'00000001'\nmovwf TRISB      ; ERROR AQUÍ\n\nbsf PORTB,0\nend`;
  asmCode.value = initialAsm;

  function showAsmHint() {
    hintArea.classList.remove("hidden");
    hintArea.textContent =
      'Pista: evita usar "movwf TRISB". TRISB debe ajustarse en el banco correcto (usa CLRF TRISB en banco 1 después de BSF STATUS, RP0).';
  }

  function checkAsm() {
    const code = asmCode.value.toUpperCase();
    const hasBSF = code.includes("BSF STATUS");
    const hasCLRF = code.includes("CLRF TRISB");
    const hasBCF = code.includes("BCF STATUS");
    const hasMOVWFTRISB = code.includes("MOVWF TRISB");
    const idxBSF = code.indexOf("BSF STATUS");
    const idxCLRF = code.indexOf("CLRF TRISB");
    const idxBCF = code.indexOf("BCF STATUS");
    if (!hasBSF || !hasCLRF || !hasBCF) {
      asmResult.textContent =
        "Falta la secuencia correcta de bank switching o CLRF TRISB.";
      asmResult.className = "result fail";
      return;
    }
    if (hasMOVWFTRISB) {
      asmResult.textContent =
        "Error detectado: no uses MOVWF TRISB. Usa CLRF TRISB en banco 1.";
      asmResult.className = "result fail";
      return;
    }
    if (!(idxBSF < idxCLRF && idxCLRF < idxBCF)) {
      asmResult.textContent =
        "El orden de instrucciones para cambiar de banco y configurar TRISB parece incorrecto.";
      asmResult.className = "result fail";
      return;
    }
    asmResult.textContent = "Código corregido — correcto.";
    asmResult.className = "result success";
  }

  // inicializar
  setNewByte();
});
