(function () {
  const KEY = "ima_editor_content_v1";
  const editor = document.getElementById("codeEditor");
  const status = document.getElementById("saveStatus");
  const btnSave = document.getElementById("btnSave");
  const btnClear = document.getElementById("btnClear");
  const btnVolver = document.getElementById("btnVolver");

  function setStatus(text) {
    if (status) status.textContent = "Estado: " + text;
  }

  // Cargar contenido guardado
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
        } catch (e) {
          setStatus("error al guardar");
        }
      }, 700);
    });
  }
})();
