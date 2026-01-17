document.addEventListener("DOMContentLoaded", () => {
  // Nivel 1 elementos
  const asmEl = document.getElementById("asm");
  const checkBtn = document.getElementById("check");
  const hintBtn = document.getElementById("hint");
  const hintText = document.getElementById("hintText");
  const output = document.getElementById("output");
  const led = document.getElementById("led");
  const prevBtn = document.getElementById("prev");
  const nextBtn = document.getElementById("next");
  let level2 = document.getElementById("level2");
  // asegurar que Nivel 2 esté oculto al cargar la página
  if (level2) level2.classList.add("hidden");

  function showMessage(text, ok) {
    if (!output) return;
    output.textContent = text;
    output.style.borderColor = ok
      ? "rgba(16,185,129,0.18)"
      : "rgba(255,80,80,0.12)";
  }

  function validateASM(code) {
    const hasTRISB =
      /TRISB/i.test(code) &&
      (/clrf\s+TRISB/i.test(code) || /movwf\s+TRISB/i.test(code));
    const setsRB0 =
      /bsf\s+PORTB\s*,\s*0/i.test(code) ||
      /bsf\s+PORTB,0/i.test(code) ||
      /PORTB\s*=\s*1/i.test(code);
    return { hasTRISB, setsRB0 };
  }

  function lightLED(on) {
    if (!led) return;
    led.classList.toggle("on", on);
    led.classList.toggle("off", !on);
  }

  // Mantener 'Siguiente' deshabilitado hasta que la verificación sea correcta.
  // Si el usuario modifica el código después de verificar, volver a deshabilitar.
  if (asmEl && nextBtn) {
    asmEl.addEventListener("input", () => {
      nextBtn.disabled = true;
      nextBtn.classList.remove("enabled");
    });
  }

  // Manejo del botón Verificar (Nivel 1)
  if (checkBtn && asmEl) {
    checkBtn.addEventListener("click", () => {
      const code = asmEl.value || "";
      const res = validateASM(code);

      if (!res.hasTRISB && !res.setsRB0) {
        lightLED(false);
        showMessage(
          "Falta configurar TRISB y no se encuentra la instrucción para encender RB0.",
          false
        );
        return;
      }

      if (!res.hasTRISB) {
        lightLED(false);
        showMessage(
          "Debes configurar TRISB para poner PORTB como salida (ej: clrf TRISB).",
          false
        );
        return;
      }

      if (!res.setsRB0) {
        lightLED(false);
        showMessage(
          "Falta la instrucción que enciende RB0 (ej: bsf PORTB, 0).",
          false
        );
        return;
      }

      // Correcto
      lightLED(true);
      showMessage(
        "¡Correcto! RB0 está configurado y encendido. ¡Has ganado!",
        true
      );

      // Habilitar siguiente y guardar progreso
      if (nextBtn) {
        nextBtn.disabled = false;
        nextBtn.classList.add("enabled");
      }
      try {
        sessionStorage.setItem("minijuego1_completed", "1");
      } catch (e) {}
    });
  }

  // Hint
  if (hintBtn && hintText) {
    hintBtn.addEventListener("click", () =>
      hintText.classList.toggle("hidden")
    );
  }

  // Navegación anterior
  if (prevBtn) {
    prevBtn.addEventListener("click", () => {
      location.href = "../../screens/minijuegos.html";
    });
  }

  // Navegación siguiente: si existe sección level2, mostrarla, sino navegar fuera
  if (nextBtn) {
    nextBtn.addEventListener("click", () => {
      if (nextBtn.disabled) return;
      const level2 = document.getElementById("level2");
      if (level2) {
        level2.classList.remove("hidden");
        level2.scrollIntoView({ behavior: "smooth" });
        return;
      }
      location.href = "../minijuego2/minijuego2.html";
    });
  }

  // --- Nivel 2 (si está presente en la página) ---
  // 'level2' ya fue obtenida arriba y forzada a ocultarse; obtener refs a sus elementos
  const asm2 = document.getElementById("asm2");
  const check2 = document.getElementById("check2");
  const hint2 = document.getElementById("hint2");
  const hintText2 = document.getElementById("hintText2");
  const output2 = document.getElementById("output2");
  const led2 = document.getElementById("led2");

  function showMessage2(text, ok) {
    if (output2) {
      output2.textContent = text;
      output2.style.borderColor = ok
        ? "rgba(255,215,0,0.18)"
        : "rgba(255,80,80,0.12)";
    }
  }
  function validateASM2(code) {
    const hasTRISB =
      /TRISB/i.test(code) &&
      (/clrf\s+TRISB/i.test(code) || /movwf\s+TRISB/i.test(code));
    const setsRB1 =
      /bsf\s+PORTB\s*,\s*1/i.test(code) ||
      /bsf\s+PORTB,1/i.test(code) ||
      /PORTB\s*=\s*2/i.test(code);
    return { hasTRISB, setsRB1 };
  }
  function lightLED2(on) {
    if (!led2) return;
    led2.classList.toggle("on", on);
    led2.classList.toggle("off", !on);
  }

  if (check2 && asm2) {
    check2.addEventListener("click", () => {
      const code = asm2.value || "";
      const res = validateASM2(code);
      if (!res.hasTRISB && !res.setsRB1) {
        lightLED2(false);
        showMessage2(
          "Falta configurar TRISB y la instrucción para encender RB1.",
          false
        );
        return;
      }
      if (!res.hasTRISB) {
        lightLED2(false);
        showMessage2(
          "Debes configurar TRISB para salida (ej: clrf TRISB).",
          false
        );
        return;
      }
      if (!res.setsRB1) {
        lightLED2(false);
        showMessage2(
          "Falta la instrucción que enciende RB1 (ej: bsf PORTB, 1).",
          false
        );
        return;
      }
      lightLED2(true);
      showMessage2("¡Nivel 2 completado! RB1 encendido.", true);
      try {
        sessionStorage.setItem("minijuego2_completed", "1");
      } catch (e) {}
    });
  }
  if (hint2 && hintText2)
    hint2.addEventListener("click", () => hintText2.classList.toggle("hidden"));
});
