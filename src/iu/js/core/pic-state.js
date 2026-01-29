/**
 * @fileoverview Estado centralizado del PIC16F84A
 * Gestiona el estado del microcontrolador para el simulador
 */

/**
 * Estado del microcontrolador PIC16F84A
 * @type {Object}
 */
const PIC_STATE = {
  PC: 0,           // Program Counter
  W: 0,            // Registro de trabajo (Working register)
  registers: {},   // Memoria de registros (GPR + SFR)
  stack: [],       // Stack de 8 niveles para CALL/RETURN
  running: false,  // Estado de ejecución
  halted: false    // Estado de halt (SLEEP)
};

/**
 * Constantes del PIC16F84A
 */
const PIC_CONSTANTS = {
  STACK_SIZE: 8,       // Niveles de stack
  RAM_SIZE: 68,        // Bytes de RAM (0x0C - 0x4F)
  PROGRAM_SIZE: 1024,  // Palabras de programa
  EEPROM_SIZE: 64      // Bytes de EEPROM
};

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE GESTIÓN DE ESTADO
// ═══════════════════════════════════════════════════════════════

/**
 * Reinicia el estado del PIC a valores iniciales
 */
function resetState() {
  PIC_STATE.PC = 0;
  PIC_STATE.W = 0;
  PIC_STATE.registers = {};
  PIC_STATE.stack = [];
  PIC_STATE.running = false;
  PIC_STATE.halted = false;

  // Inicializar registros especiales con valores por defecto
  PIC_STATE.registers['0x03'] = 0x18; // STATUS: TO=1, PD=1
  PIC_STATE.registers['STATUS'] = 0x18;
}

/**
 * Obtiene una copia del estado actual
 * @returns {Object} Copia profunda del estado
 */
function getState() {
  return JSON.parse(JSON.stringify(PIC_STATE));
}

/**
 * Obtiene el valor del registro STATUS
 * @returns {number} Valor del STATUS
 */
function getStatus() {
  return PIC_STATE.registers['0x03'] || PIC_STATE.registers['STATUS'] || 0;
}

/**
 * Escribe en el registro STATUS
 * @param {number} val - Valor a escribir
 */
function writeStatus(val) {
  PIC_STATE.registers['0x03'] = val & 0xff;
  PIC_STATE.registers['STATUS'] = val & 0xff;
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE GESTIÓN DE FLAGS
// ═══════════════════════════════════════════════════════════════

/**
 * Establece o limpia un flag en STATUS
 * @param {number} bit - Número de bit (0=C, 1=DC, 2=Z, etc.)
 * @param {boolean} enabled - true para establecer, false para limpiar
 */
function setFlag(bit, enabled) {
  const cur = getStatus();
  const next = enabled ? cur | (1 << bit) : cur & ~(1 << bit);
  writeStatus(next);
}

/**
 * Obtiene el valor de un flag
 * @param {number} bit - Número de bit
 * @returns {boolean} Estado del flag
 */
function getFlag(bit) {
  return !!(getStatus() & (1 << bit));
}

/**
 * Actualiza el flag Zero basado en un valor
 * @param {number} val - Valor a evaluar
 */
function setZeroFlag(val) {
  setFlag(2, (val & 0xff) === 0);
}

/**
 * Actualiza flags después de una suma
 * @param {number} a - Primer operando
 * @param {number} b - Segundo operando
 * @param {number} result - Resultado completo (puede exceder 8 bits)
 */
function updateFlagsAdd(a, b, result) {
  // C: carry out of bit7
  setFlag(0, result > 0xff);
  // DC: carry from bit3
  setFlag(1, (a & 0x0f) + (b & 0x0f) > 0x0f);
  // Z: result is zero
  setZeroFlag(result & 0xff);
}

/**
 * Actualiza flags después de una resta
 * @param {number} a - Minuendo
 * @param {number} b - Sustraendo
 * @param {number} result - Resultado
 */
function updateFlagsSub(a, b, result) {
  // C: set if no borrow (a >= b)
  setFlag(0, (a & 0xff) >= (b & 0xff));
  // DC: set if no borrow from bit4
  setFlag(1, (a & 0x0f) >= (b & 0x0f));
  // Z: result is zero
  setZeroFlag(result & 0xff);
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE STACK
// ═══════════════════════════════════════════════════════════════

/**
 * Push al stack (para CALL)
 * @param {number} address - Dirección de retorno
 * @returns {boolean} true si fue exitoso, false si stack overflow
 */
function stackPush(address) {
  if (PIC_STATE.stack.length >= PIC_CONSTANTS.STACK_SIZE) {
    console.warn('Stack overflow');
    return false;
  }
  PIC_STATE.stack.push(address);
  return true;
}

/**
 * Pop del stack (para RETURN)
 * @returns {number} Dirección de retorno o 0 si stack vacío
 */
function stackPop() {
  if (PIC_STATE.stack.length === 0) {
    console.warn('Stack underflow');
    return 0;
  }
  return PIC_STATE.stack.pop();
}

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE REGISTROS
// ═══════════════════════════════════════════════════════════════

/**
 * Lee un registro
 * @param {string} key - Clave del registro (formato "0xNN")
 * @returns {number} Valor del registro
 */
function readRegister(key) {
  return PIC_STATE.registers[key] || 0;
}

/**
 * Escribe en un registro
 * @param {string} key - Clave del registro
 * @param {number} value - Valor a escribir
 */
function writeRegister(key, value) {
  PIC_STATE.registers[key] = value & 0xff;
}

// Exportar para uso en navegador (global) y módulos
if (typeof window !== 'undefined') {
  window.PICState = {
    state: PIC_STATE,
    constants: PIC_CONSTANTS,
    reset: resetState,
    getState,
    getStatus,
    writeStatus,
    setFlag,
    getFlag,
    setZeroFlag,
    updateFlagsAdd,
    updateFlagsSub,
    stackPush,
    stackPop,
    readRegister,
    writeRegister
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PIC_STATE,
    PIC_CONSTANTS,
    resetState,
    getState,
    getStatus,
    writeStatus,
    setFlag,
    getFlag,
    setZeroFlag,
    updateFlagsAdd,
    updateFlagsSub,
    stackPush,
    stackPop,
    readRegister,
    writeRegister
  };
}
