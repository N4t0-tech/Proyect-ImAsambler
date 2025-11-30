(function () {
  const KEY = "ima_editor_content_v1";
  const editor = document.getElementById("codeEditor");
  const status = document.getElementById("saveStatus");
  const btnSave = document.getElementById("btnSave");
  const btnClear = document.getElementById("btnClear");
  const btnVolver = document.getElementById("btnVolver");
  const btnConvert = document.getElementById("btnConvert");
  // Elementos del modal de confirmación (si existen)
  const confirmModal = document.getElementById("confirmModal");
  const confirmMessage = document.getElementById("confirmMessage");
  const btnConfirmYes = document.getElementById("btnConfirmYes");
  const btnConfirmNo = document.getElementById("btnConfirmNo");
  // Referencia al área del convertidor en el HTML (id `codigoArea`)
  const convertidorArea = document.getElementById("codigoArea");

  function setStatus(text) {
    if (status) status.textContent = "Estado: " + text;
  }

  // Renderiza contenido en el área del convertidor (escapa HTML)
  function renderConvertidor(content) {
    if (!convertidorArea) return;
    if (!content) {
      convertidorArea.innerHTML =
        '<div style="color:#c9d1d9;opacity:0.85">Convertidor vacío</div>';
      return;
    }
    // Escapar HTML para mostrar texto tal cual
    const escaped = String(content)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;");
    convertidorArea.innerHTML =
      '<pre style="white-space:pre-wrap;font-family:monospace;color:#ffffff;margin:0;">' +
      escaped +
      "</pre>";
  }

  // Cargar contenido guardado (no mostrar en convertidor hasta confirmar)
  try {
    const saved = localStorage.getItem(KEY);
    if (saved && editor) editor.value = saved;
  } catch (e) {
    console.warn("localStorage no disponible", e);
  }

  // Guardado manual
  if (btnSave) {
    btnSave.addEventListener("click", function () {
      try {
        localStorage.setItem(KEY, editor.value);
        setStatus("guardado");
        // No mostrar automáticamente: la conversión requiere confirmación
        // (solo guardamos el contenido)
      } catch (e) {
        setStatus("error al guardar");
      }
    });
  }

  // Limpiar editor
  if (btnClear) {
    btnClear.addEventListener("click", function () {
      if (!editor) return;
      editor.value = "";
      try {
        localStorage.removeItem(KEY);
      } catch (e) {}
      setStatus("limpio");
      // Limpiar área del convertidor
      renderConvertidor("");
    });
  }

  // Función que abre el modal de confirmación y devuelve una Promise
  function openConfirm(message) {
    return new Promise((resolve) => {
      if (!confirmModal || !btnConfirmYes || !btnConfirmNo || !confirmMessage) {
        // Fallback a window.confirm si no hay modal
        resolve(window.confirm(message));
        return;
      }
      confirmMessage.textContent = message;
      confirmModal.classList.remove("hidden");
      confirmModal.setAttribute("aria-hidden", "false");
      // Handlers
      function cleanup(result) {
        confirmModal.classList.add("hidden");
        confirmModal.setAttribute("aria-hidden", "true");
        btnConfirmYes.removeEventListener("click", yesHandler);
        btnConfirmNo.removeEventListener("click", noHandler);
        document.removeEventListener("keydown", escHandler);
        resolve(result);
      }
      function yesHandler() {
        cleanup(true);
      }
      function noHandler() {
        cleanup(false);
      }
      function escHandler(e) {
        if (e.key === "Escape") cleanup(false);
      }
      btnConfirmYes.addEventListener("click", yesHandler);
      btnConfirmNo.addEventListener("click", noHandler);
      document.addEventListener("keydown", escHandler);
      // Click en overlay cancela
      const overlay = confirmModal.querySelector(".modal-overlay");
      if (overlay) overlay.addEventListener("click", noHandler, { once: true });
      // Autofocus en botón confirmar
      try {
        btnConfirmYes.focus();
      } catch (e) {}
    });
  }

  // Convertir: confirmar con modal antes de mostrar el código
  if (btnConvert) {
    btnConvert.addEventListener("click", function () {
      const confirmMsg = "¿Seguro que quiere convertir?";
      openConfirm(confirmMsg).then((confirmed) => {
        if (confirmed) {
          // Guardar antes de convertir (silencioso)
          try {
            if (editor) localStorage.setItem(KEY, editor.value);
          } catch (e) {}
          renderConvertidor(editor ? editor.value : "");
          setStatus("convertido");
        } else {
          setStatus("cancelado");
        }
      });
    });
  }

  // Volver a index
  if (btnVolver) {
    btnVolver.addEventListener("click", function () {
      window.location.href = "index.html";
    });
  }

  // Autoguardado (debounce)
  let timer = null;
  if (editor) {
    editor.addEventListener("input", function () {
      setStatus("guardando...");
      if (timer) clearTimeout(timer);
      timer = setTimeout(function () {
        try {
          localStorage.setItem(KEY, editor.value);
          setStatus("guardado");
          // Autoguardado: solo guarda, no actualiza la vista del convertidor
        } catch (e) {
          setStatus("error al guardar");
        }
      }, 700);
    });
  }
})();
