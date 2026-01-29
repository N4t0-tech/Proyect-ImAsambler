/**
 * @fileoverview Definiciones de instrucciones del PIC16F84A
 * Fuente única de verdad para compilador y simulador
 */

/**
 * Conjunto de instrucciones del PIC16F84A
 * Cada instrucción incluye: opcode, operandos, descripción y categoría
 */
const PIC_INSTRUCTIONS = {
  // ═══════════════════════════════════════════════════════════════
  // OPERACIONES ORIENTADAS A BYTES CON REGISTROS
  // ═══════════════════════════════════════════════════════════════
  ADDWF: {
    opcode: 0x0700,
    operands: 2,
    category: 'byte',
    description: 'Sumar W y f',
    syntax: 'ADDWF f,d',
    flags: ['C', 'DC', 'Z']
  },
  ANDWF: {
    opcode: 0x0500,
    operands: 2,
    category: 'byte',
    description: 'AND lógico entre W y f',
    syntax: 'ANDWF f,d',
    flags: ['Z']
  },
  CLRF: {
    opcode: 0x0180,
    operands: 1,
    category: 'byte',
    description: 'Limpiar registro f (poner en 0)',
    syntax: 'CLRF f',
    flags: ['Z']
  },
  CLRW: {
    opcode: 0x0100,
    operands: 0,
    category: 'byte',
    description: 'Limpiar registro W (poner en 0)',
    syntax: 'CLRW',
    flags: ['Z']
  },
  COMF: {
    opcode: 0x0900,
    operands: 2,
    category: 'byte',
    description: 'Complementar f (invertir bits)',
    syntax: 'COMF f,d',
    flags: ['Z']
  },
  DECF: {
    opcode: 0x0300,
    operands: 2,
    category: 'byte',
    description: 'Decrementar f (restar 1)',
    syntax: 'DECF f,d',
    flags: ['Z']
  },
  DECFSZ: {
    opcode: 0x0b00,
    operands: 2,
    category: 'byte',
    description: 'Decrementar f, saltar si es 0',
    syntax: 'DECFSZ f,d',
    flags: []
  },
  INCF: {
    opcode: 0x0a00,
    operands: 2,
    category: 'byte',
    description: 'Incrementar f (sumar 1)',
    syntax: 'INCF f,d',
    flags: ['Z']
  },
  INCFSZ: {
    opcode: 0x0f00,
    operands: 2,
    category: 'byte',
    description: 'Incrementar f, saltar si es 0',
    syntax: 'INCFSZ f,d',
    flags: []
  },
  IORWF: {
    opcode: 0x0400,
    operands: 2,
    category: 'byte',
    description: 'OR inclusivo entre W y f',
    syntax: 'IORWF f,d',
    flags: ['Z']
  },
  MOVF: {
    opcode: 0x0800,
    operands: 2,
    category: 'byte',
    description: 'Mover f a destino',
    syntax: 'MOVF f,d',
    flags: ['Z']
  },
  MOVWF: {
    opcode: 0x0080,
    operands: 1,
    category: 'byte',
    description: 'Mover W al registro f',
    syntax: 'MOVWF f',
    flags: []
  },
  NOP: {
    opcode: 0x0000,
    operands: 0,
    category: 'byte',
    description: 'No operación (no hace nada)',
    syntax: 'NOP',
    flags: []
  },
  RLF: {
    opcode: 0x0d00,
    operands: 2,
    category: 'byte',
    description: 'Rotar f a la izquierda a través del carry',
    syntax: 'RLF f,d',
    flags: ['C']
  },
  RRF: {
    opcode: 0x0c00,
    operands: 2,
    category: 'byte',
    description: 'Rotar f a la derecha a través del carry',
    syntax: 'RRF f,d',
    flags: ['C']
  },
  SUBWF: {
    opcode: 0x0200,
    operands: 2,
    category: 'byte',
    description: 'Restar W de f',
    syntax: 'SUBWF f,d',
    flags: ['C', 'DC', 'Z']
  },
  SWAPF: {
    opcode: 0x0e00,
    operands: 2,
    category: 'byte',
    description: 'Intercambiar nibbles en f',
    syntax: 'SWAPF f,d',
    flags: [] // SWAPF no afecta flags según datasheet
  },
  XORWF: {
    opcode: 0x0600,
    operands: 2,
    category: 'byte',
    description: 'XOR exclusivo entre W y f',
    syntax: 'XORWF f,d',
    flags: ['Z']
  },

  // ═══════════════════════════════════════════════════════════════
  // OPERACIONES ORIENTADAS A BITS
  // ═══════════════════════════════════════════════════════════════
  BCF: {
    opcode: 0x1000,
    operands: 2,
    category: 'bit',
    description: 'Limpiar bit en f (poner en 0)',
    syntax: 'BCF f,b',
    flags: []
  },
  BSF: {
    opcode: 0x1400,
    operands: 2,
    category: 'bit',
    description: 'Establecer bit en f (poner en 1)',
    syntax: 'BSF f,b',
    flags: []
  },
  BTFSC: {
    opcode: 0x1800,
    operands: 2,
    category: 'bit',
    description: 'Probar bit en f, saltar si está en 0',
    syntax: 'BTFSC f,b',
    flags: []
  },
  BTFSS: {
    opcode: 0x1c00,
    operands: 2,
    category: 'bit',
    description: 'Probar bit en f, saltar si está en 1',
    syntax: 'BTFSS f,b',
    flags: []
  },

  // ═══════════════════════════════════════════════════════════════
  // OPERACIONES CON LITERALES Y CONTROL
  // ═══════════════════════════════════════════════════════════════
  ADDLW: {
    opcode: 0x3e00,
    operands: 1,
    category: 'literal',
    description: 'Sumar literal a W',
    syntax: 'ADDLW k',
    flags: ['C', 'DC', 'Z']
  },
  ANDLW: {
    opcode: 0x3900,
    operands: 1,
    category: 'literal',
    description: 'AND lógico entre literal y W',
    syntax: 'ANDLW k',
    flags: ['Z']
  },
  CALL: {
    opcode: 0x2000,
    operands: 1,
    category: 'control',
    description: 'Llamar subrutina',
    syntax: 'CALL k',
    flags: []
  },
  CLRWDT: {
    opcode: 0x0064,
    operands: 0,
    category: 'control',
    description: 'Limpiar temporizador watchdog',
    syntax: 'CLRWDT',
    flags: ['TO', 'PD']
  },
  GOTO: {
    opcode: 0x2800,
    operands: 1,
    category: 'control',
    description: 'Saltar a dirección',
    syntax: 'GOTO k',
    flags: []
  },
  IORLW: {
    opcode: 0x3800,
    operands: 1,
    category: 'literal',
    description: 'OR inclusivo entre literal y W',
    syntax: 'IORLW k',
    flags: ['Z']
  },
  MOVLW: {
    opcode: 0x3000,
    operands: 1,
    category: 'literal',
    description: 'Mover literal a W',
    syntax: 'MOVLW k',
    flags: []
  },
  RETFIE: {
    opcode: 0x0009,
    operands: 0,
    category: 'control',
    description: 'Retornar de interrupción',
    syntax: 'RETFIE',
    flags: []
  },
  RETLW: {
    opcode: 0x3400,
    operands: 1,
    category: 'control',
    description: 'Retornar con literal en W',
    syntax: 'RETLW k',
    flags: []
  },
  RETURN: {
    opcode: 0x0008,
    operands: 0,
    category: 'control',
    description: 'Retornar de subrutina',
    syntax: 'RETURN',
    flags: []
  },
  SLEEP: {
    opcode: 0x0063,
    operands: 0,
    category: 'control',
    description: 'Entrar en modo de bajo consumo',
    syntax: 'SLEEP',
    flags: ['TO', 'PD']
  },
  SUBLW: {
    opcode: 0x3c00,
    operands: 1,
    category: 'literal',
    description: 'Restar W del literal',
    syntax: 'SUBLW k',
    flags: ['C', 'DC', 'Z']
  },
  XORLW: {
    opcode: 0x3a00,
    operands: 1,
    category: 'literal',
    description: 'XOR exclusivo entre literal y W',
    syntax: 'XORLW k',
    flags: ['Z']
  }
};

/**
 * Categorías de instrucciones para UI
 */
const PIC_INSTRUCTION_CATEGORIES = {
  'Operaciones con archivos': [
    'ADDWF', 'ANDWF', 'CLRF', 'CLRW', 'COMF', 'DECF', 'DECFSZ',
    'INCF', 'INCFSZ', 'IORWF', 'MOVF', 'MOVWF', 'RLF', 'RRF',
    'SUBWF', 'SWAPF', 'XORWF'
  ],
  'Operaciones con bits': ['BCF', 'BSF', 'BTFSC', 'BTFSS'],
  'Literales y control': [
    'ADDLW', 'ANDLW', 'CALL', 'CLRWDT', 'GOTO', 'IORLW',
    'MOVLW', 'RETFIE', 'RETLW', 'RETURN', 'SLEEP', 'SUBLW', 'XORLW'
  ],
  'Otras': ['NOP']
};

/**
 * Registros especiales (SFR) del PIC16F84A
 */
const PIC_SFR = {
  // Banco 0
  INDF:   { address: 0x00, description: 'Registro indirecto' },
  TMR0:   { address: 0x01, description: 'Timer0' },
  PCL:    { address: 0x02, description: 'Program Counter (low)' },
  STATUS: { address: 0x03, description: 'Registro de estado' },
  FSR:    { address: 0x04, description: 'Puntero indirecto' },
  PORTA:  { address: 0x05, description: 'Puerto A' },
  PORTB:  { address: 0x06, description: 'Puerto B' },
  EEDATA: { address: 0x08, description: 'Dato EEPROM' },
  EEADR:  { address: 0x09, description: 'Dirección EEPROM' },
  PCLATH: { address: 0x0a, description: 'Program Counter (high latch)' },
  INTCON: { address: 0x0b, description: 'Control de interrupciones' },
  // Banco 1
  OPTION_REG: { address: 0x81, description: 'Registro OPTION' },
  TRISA:  { address: 0x85, description: 'Dirección Puerto A' },
  TRISB:  { address: 0x86, description: 'Dirección Puerto B' },
  EECON1: { address: 0x88, description: 'Control EEPROM 1' },
  EECON2: { address: 0x89, description: 'Control EEPROM 2' }
};

/**
 * Bits del registro STATUS
 */
const PIC_STATUS_BITS = {
  C:    0,  // Carry
  DC:   1,  // Digit Carry
  Z:    2,  // Zero
  PD:   3,  // Power Down
  TO:   4,  // Time Out
  RP0:  5,  // Bank Select bit 0
  RP1:  6,  // Bank Select bit 1
  IRP:  7   // Indirect Register Bank Select
};

// Exportar para uso en navegador (global) y módulos
if (typeof window !== 'undefined') {
  window.PIC_INSTRUCTIONS = PIC_INSTRUCTIONS;
  window.PIC_INSTRUCTION_CATEGORIES = PIC_INSTRUCTION_CATEGORIES;
  window.PIC_SFR = PIC_SFR;
  window.PIC_STATUS_BITS = PIC_STATUS_BITS;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    PIC_INSTRUCTIONS,
    PIC_INSTRUCTION_CATEGORIES,
    PIC_SFR,
    PIC_STATUS_BITS
  };
}
