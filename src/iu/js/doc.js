// script.js
document.addEventListener('DOMContentLoaded', function() {
    // Mostrar la sección de introducción por defecto
    showSection('intro');
    
    // Configurar el interruptor de tema
    setupThemeToggle();
    
    // Añadir evento a botones del menú
    setupMenuButtons();
});

function showSection(sectionId) {
    // Ocultar todas las secciones
    const sections = document.querySelectorAll('.section');
    sections.forEach(section => {
        section.classList.remove('active');
    });
    
    // Mostrar la sección seleccionada
    const activeSection = document.getElementById(sectionId);
    if (activeSection) {
        activeSection.classList.add('active');
    }
    
    // Actualizar botones del menú
    const buttons = document.querySelectorAll('.menu-btn');
    buttons.forEach(button => {
        if (button.onclick.toString().includes(sectionId)) {
            button.classList.add('active');
        } else {
            button.classList.remove('active');
        }
    });
    
    // Scroll suave hacia arriba
    window.scrollTo({ top: 0, behavior: 'smooth' });
}

function setupThemeToggle() {
    const themeCheckbox = document.getElementById('theme-checkbox');
    
    // Verificar preferencia guardada
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
        document.body.classList.add('dark-mode');
        themeCheckbox.checked = true;
    }
    
    // Cambiar tema cuando se cambia el interruptor
    themeCheckbox.addEventListener('change', function() {
        if (this.checked) {
            document.body.classList.add('dark-mode');
            localStorage.setItem('theme', 'dark');
        } else {
            document.body.classList.remove('dark-mode');
            localStorage.setItem('theme', 'light');
        }
    });
}

function setupMenuButtons() {
    // Ya están configurados en el HTML con onclick
    // Pero podemos añadir lógica adicional si es necesario
}

// Ejemplo de simulación simple (para demostración)
function simularPIC() {
    console.log("Simulación básica de PIC16F84A");
    
    // Estado del microcontrolador
    const estado = {
        W: 0,
        PC: 0,
        PORTA: 0,
        PORTB: 0,
        STATUS: 0,
        memoria: new Array(68).fill(0)
    };
    
    // Instrucciones de ejemplo
    const programa = [
        {inst: "MOVLW", val: 5},     // W = 5
        {inst: "MOVWF", dir: 0x06},  // PORTB = W
        {inst: "INCF", dir: 0x06},   // PORTB = PORTB + 1
        {inst: "GOTO", dir: 1}       // Volver a la instrucción 1
    ];
    
    console.log("Estado inicial:", estado);
    console.log("Programa cargado:", programa);
}