// Variables globales
let currentCode = '';
let currentHex = '';
let currentErrors = [];

// Categorías de instrucciones
const INSTRUCTION_CATEGORIES = {
    'Operaciones con archivos': [
        'ADDWF', 'ANDWF', 'CLRF', 'CLRW', 'COMF', 'DECF', 'DECFSZ', 
        'INCF', 'INCFSZ', 'IORWF', 'MOVF', 'MOVWF', 'RLF', 'RRF', 
        'SUBWF', 'SWAPF', 'XORWF'
    ],
    'Operaciones con bits': [
        'BCF', 'BSF', 'BTFSC', 'BTFSS'
    ],
    'Literales y control': [
        'ADDLW', 'ANDLW', 'CALL', 'CLRWDT', 'GOTO', 'IORLW', 
        'MOVLW', 'RETFIE', 'RETLW', 'RETURN', 'SLEEP', 'SUBLW', 'XORLW'
    ],
    'Otras': ['NOP']
};

// Elementos del DOM
const codeEditor = document.getElementById('codeEditor');
const lineNumbers = document.getElementById('lineNumbers');
const syntaxHighlight = document.getElementById('syntaxHighlight');
const compileBtn = document.getElementById('compileBtn');
const hexOutput = document.getElementById('hexOutput');
const errorsList = document.getElementById('errorsList');
const errorCount = document.getElementById('errorCount');
const copyBtn = document.getElementById('copyBtn');
const downloadBtn = document.getElementById('downloadBtn');
const searchInput = document.getElementById('searchInput');
const instructionsList = document.getElementById('instructionsList');

// Inicialización
document.addEventListener('DOMContentLoaded', () => {
    updateLineNumbers();
    updateSyntaxHighlight();
    renderInstructions();
    setupEventListeners();
});

// Event Listeners
function setupEventListeners() {
    // Editor de código
    codeEditor.addEventListener('input', () => {
        updateLineNumbers();
        updateSyntaxHighlight();
        syncScroll();
    });

    codeEditor.addEventListener('scroll', syncScroll);

    // Botón compilar
    compileBtn.addEventListener('click', handleCompile);

    // Tabs principales
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchTab(e.target.dataset.tab);
        });
    });

    // Tabs de instrucciones
    document.querySelectorAll('.instruction-tab').forEach(btn => {
        btn.addEventListener('click', (e) => {
            switchInstructionTab(e.target.dataset.instructionTab);
        });
    });

    // Botones de acción
    copyBtn.addEventListener('click', handleCopy);
    downloadBtn.addEventListener('click', handleDownload);

    // Búsqueda
    searchInput.addEventListener('input', handleSearch);
}

// Actualizar números de línea
function updateLineNumbers() {
    const lines = codeEditor.value.split('\n');
    lineNumbers.innerHTML = lines.map((_, i) => `<div>${i + 1}</div>`).join('');
}

// Resaltado de sintaxis
function updateSyntaxHighlight() {
    const code = codeEditor.value;
    const lines = code.split('\n');
    
    const highlighted = lines.map(line => {
        return highlightLine(line);
    }).join('\n');
    
    syntaxHighlight.innerHTML = highlighted;
}

function highlightLine(line) {
    const commentIndex = line.indexOf(';');
    let codePart = line;
    let commentPart = '';
    
    if (commentIndex !== -1) {
        codePart = line.substring(0, commentIndex);
        commentPart = line.substring(commentIndex);
    }
    
    // Highlight instructions (first word)
    const words = codePart.trim().split(/\s+/);
    if (words.length > 0 && words[0]) {
        const instruction = words[0].toUpperCase();
        const isDirective = ['ORG', 'END', 'EQU'].includes(instruction);
        const instructionClass = isDirective ? 'directive' : 'instruction';
        
        let result = `<span class="${instructionClass}">${words[0]}</span>`;
        if (words.length > 1) {
            result += `<span class="operand"> ${words.slice(1).join(' ')}</span>`;
        }
        if (commentPart) {
            result += `<span class="comment">${commentPart}</span>`;
        }
        return result;
    }
    
    return commentPart ? `<span class="comment">${commentPart}</span>` : line;
}

// Sincronizar scroll
function syncScroll() {
    syntaxHighlight.scrollTop = codeEditor.scrollTop;
    syntaxHighlight.scrollLeft = codeEditor.scrollLeft;
}

// Compilar código
function handleCompile() {
    const code = codeEditor.value;
    const result = compileASM(code);
    
    currentHex = result.hex;
    currentErrors = result.errors;
    
    // Actualizar salida hexadecimal
    hexOutput.textContent = result.hex || '// La salida hexadecimal aparecerá aquí después de compilar';
    
    // Actualizar errores
    updateErrors();
    
    // Habilitar/deshabilitar botones
    const hasOutput = result.hex.length > 0;
    copyBtn.disabled = !hasOutput;
    downloadBtn.disabled = !hasOutput;
    
    // Mostrar notificación
    if (result.errors.length === 0 && hasOutput) {
        showToast('✓ Compilación exitosa', 'success');
    } else if (result.errors.length > 0) {
        showToast(`⚠ ${result.errors.length} error(es) encontrado(s)`, 'error');
    }
}

// Actualizar lista de errores
function updateErrors() {
    errorCount.textContent = currentErrors.length;
    
    if (currentErrors.length === 0) {
        errorsList.innerHTML = '<p class="success-message">✓ No hay errores</p>';
    } else {
        errorsList.innerHTML = currentErrors.map(error => `
            <div class="error-item">
                <span class="error-bullet">•</span>
                <span>${error}</span>
            </div>
        `).join('');
    }
}

// Cambiar tabs principales
function switchTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.tab === tabName);
    });
    
    // Mostrar contenido
    document.getElementById('hexTab').classList.toggle('active', tabName === 'hex');
    document.getElementById('errorsTab').classList.toggle('active', tabName === 'errors');
}

// Cambiar tabs de instrucciones
function switchInstructionTab(tabName) {
    // Actualizar botones
    document.querySelectorAll('.instruction-tab').forEach(btn => {
        btn.classList.toggle('active', btn.dataset.instructionTab === tabName);
    });
    
    // Mostrar contenido
    document.getElementById('allInstructionsTab').classList.toggle('active', tabName === 'all');
    document.getElementById('quickRefTab').classList.toggle('active', tabName === 'quick');
}

// Copiar al portapapeles
function handleCopy() {
    navigator.clipboard.writeText(currentHex).then(() => {
        showToast('✓ Código copiado al portapapeles', 'success');
    }).catch(() => {
        showToast('✗ Error al copiar', 'error');
    });
}

// Descargar archivo
function handleDownload() {
    const blob = new Blob([currentHex], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'output.hex';
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    showToast('✓ Archivo descargado', 'success');
}

// Renderizar lista de instrucciones
function renderInstructions(filter = '') {
    const container = instructionsList;
    container.innerHTML = '';
    
    if (filter) {
        // Mostrar resultados filtrados
        const filtered = Object.entries(INSTRUCTION_SET).filter(([name]) =>
            name.toLowerCase().includes(filter.toLowerCase())
        );
        
        filtered.forEach(([name, info]) => {
            container.appendChild(createInstructionCard(name, info));
        });
        
        if (filtered.length === 0) {
            container.innerHTML = '<p style="color: #64748b; text-align: center; padding: 2rem;">No se encontraron instrucciones</p>';
        }
    } else {
        // Mostrar por categorías
        Object.entries(INSTRUCTION_CATEGORIES).forEach(([category, instructions]) => {
            const section = document.createElement('div');
            section.className = 'category-section';
            
            const title = document.createElement('h3');
            title.className = 'category-title';
            title.textContent = category;
            section.appendChild(title);
            
            instructions.forEach(name => {
                const info = INSTRUCTION_SET[name];
                if (info) {
                    section.appendChild(createInstructionCard(name, info));
                }
            });
            
            container.appendChild(section);
        });
    }
}

// Crear tarjeta de instrucción
function createInstructionCard(name, info) {
    const card = document.createElement('div');
    card.className = 'instruction-card';
    
    card.innerHTML = `
        <div class="instruction-header">
            <span class="instruction-name">${name}</span>
            <span class="instruction-opcode">0x${info.opcode.toString(16).toUpperCase().padStart(4, '0')}</span>
        </div>
        <p class="instruction-desc">${info.description}</p>
        <p class="instruction-operands">Operandos: ${info.operands}</p>
    `;
    
    return card;
}

// Búsqueda de instrucciones
function handleSearch(e) {
    const filter = e.target.value;
    renderInstructions(filter);
}

// Mostrar notificación toast
function showToast(message, type = 'success') {
    const toast = document.getElementById('toast');
    toast.textContent = message;
    toast.className = `toast ${type}`;
    toast.classList.add('show');
    
    setTimeout(() => {
        toast.classList.remove('show');
    }, 3000);
}
