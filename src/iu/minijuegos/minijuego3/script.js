document.addEventListener("DOMContentLoaded", () => {
  const asmEl = document.getElementById("asm");
  const checkBtn = document.getElementById("check");
  const hintBtn = document.getElementById("hint");
  const hintText = document.getElementById("hintText");
  const output = document.getElementById("output");
  const prevBtn = document.getElementById("prev");

  const roulette = document.getElementById("roulette");
  const slots = Array.from(document.querySelectorAll(".roulette .slot"));
  const pressBtn = document.getElementById("pressBtn");
  const stopBtn = document.getElementById("stopBtn");

  let intervalId = null;
  let current = 0;

  function showMessage(text, ok) {
    if (!output) return;
    output.textContent = text;
    output.style.borderColor = ok
      ? "rgba(16,185,129,0.18)"
      : "rgba(255,80,80,0.12)";
  }

  function clearSlots() {
    slots.forEach((s) => s.classList.remove("on"));
  }

  function step() {
    clearSlots();
    // posiciones de la ruleta: 0..7 (en sentido horario)
    const idx = current % 8;
    // mapear índice al orden visual de los slots (cronológico alrededor del centro)
    const visualOrder = [0, 1, 2, 4, 7, 6, 5, 3];
    const slotIndex = visualOrder[idx];
    const s = slots[slotIndex];
    if (s) s.classList.add("on");
    current++;
  }

  function startRotation() {
    if (intervalId) return;
    showMessage("Ruleta en marcha — presiona el botón para detener.", true);
    pressBtn.style.display = "inline-block";
    stopBtn.style.display = "inline-block";
    current = 0;
    step();
    intervalId = setInterval(step, 180);
  }

  function stopRotation() {
    if (intervalId) {
      clearInterval(intervalId);
      intervalId = null;
      showMessage("La ruleta se detuvo. LED final encendido.", true);
      pressBtn.style.display = "none";
    }
  }

  function validateASM(code) {
    const up = code.toUpperCase();
    const hasTRISB =
      /TRISB/.test(up) &&
      (/CLRF\s+TRISB/.test(up) ||
        /MOVWF\s+TRISB/.test(up) ||
        /MOVWF\s+TRISB/.test(up));
    const hasRotate =
      /RLF\s+PORTB/i.test(up) ||
      /RRF\s+PORTB/i.test(up) ||
      /RLF\s+PORTB,1/i.test(up);
    const hasCheckButton =
      /BTFSS\s+PORTA\s*,\s*0/i.test(up) || /BTFSC\s+PORTA\s*,\s*0/i.test(up);
    return { hasTRISB, hasRotate, hasCheckButton };
  }

  // Manejo del botón Verificar
  if (checkBtn && asmEl) {
    checkBtn.addEventListener("click", () => {
      const code = asmEl.value || "";
      const res = validateASM(code);

      if (!res.hasTRISB && !res.hasRotate && !res.hasCheckButton) {
        clearSlots();
        showMessage(
          "Falta configuración de TRISB, rotación de PORTB y comprobación del botón.",
          false
        );
        return;
      }
      if (!res.hasTRISB) {
        showMessage(
          "Debes configurar TRISB para salida (ej: clrf TRISB).",
          false
        );
        return;
      }
      if (!res.hasRotate) {
        showMessage(
          "Falta la instrucción para rotar PORTB (ej: rlf PORTB,1).",
          false
        );
        return;
      }
      if (!res.hasCheckButton) {
        showMessage(
          "Falta la comprobación del botón (ej: btfss PORTA,0).",
          false
        );
        return;
      }

      // Si pasa todas las validaciones, iniciar simulación
      startRotation();
      try {
        sessionStorage.setItem("minijuego3_completed", "1");
      } catch (e) {}
    });
  }

  if (hintBtn && hintText) {
    hintBtn.addEventListener("click", () =>
      hintText.classList.toggle("hidden")
    );
  }

  if (prevBtn)
    prevBtn.addEventListener("click", () => {
      location.href = "../../screens/minijuegos.html";
    });

  // Simular pulsación del botón físico RA0
  if (pressBtn) {
    pressBtn.addEventListener("click", () => {
      // Al pulsar, la ruleta debe detenerse (simula que btfss detectó el estado)
      stopRotation();
    });
  }

  if (stopBtn) {
    stopBtn.addEventListener("click", () => {
      stopRotation();
    });
  }
});
