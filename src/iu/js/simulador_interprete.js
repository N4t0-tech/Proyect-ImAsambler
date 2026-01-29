/**
 * @fileoverview Intérprete del PIC16F84A para el simulador
 * Usa las utilidades compartidas de core/utils.js y core/pic-state.js
 */

// ═══════════════════════════════════════════════════════════════
// HELPERS - Usa el core si está disponible, sino fallback local
// ═══════════════════════════════════════════════════════════════

// parseValue: convierte token numérico a entero (0xNN, NNh, 0b..., decimal)
const parseValue = typeof PICUtils !== 'undefined'
  ? PICUtils.parseValue
  : function(token) {
      if (token === undefined || token === null) return 0;
      const s = token.toString().trim();
      if (s.startsWith("0x") || s.startsWith("0X")) return parseInt(s.substring(2), 16);
      if (s.startsWith("0b") || s.startsWith("0B")) return parseInt(s.substring(2), 2);
      if (/^[0-9A-Fa-f]+h$/i.test(s)) return parseInt(s.slice(0, -1), 16);
      return parseInt(s, 10);
    };

// normalizeReg: normaliza registro a formato "0xNN"
const normalizeReg = typeof PICUtils !== 'undefined'
  ? PICUtils.normalizeReg
  : function(token) {
      if (token === undefined || token === null) return token;
      const s = token.toString().trim();
      const n = parseValue(s);
      if (!isNaN(n)) return "0x" + (n & 0xff).toString(16).toUpperCase().padStart(2, "0");
      return s.toUpperCase();
    };

// ═══════════════════════════════════════════════════════════════
// ESTADO DEL PIC - Usa PICState del core o estado local
// ═══════════════════════════════════════════════════════════════

const PIC_STATE = typeof PICState !== 'undefined'
  ? PICState.state
  : { PC: 0, W: 0, registers: {}, stack: [] };

// ═══════════════════════════════════════════════════════════════
// FUNCIONES DE FLAGS
// ═══════════════════════════════════════════════════════════════

function getStatus(state) {
  return state.registers["0x03"] || state.registers["STATUS"] || 0;
}

function writeStatus(state, val) {
  state.registers["0x03"] = val & 0xff;
  state.registers["STATUS"] = val & 0xff;
}

function setFlag(state, bit, enabled) {
  const cur = getStatus(state);
  const next = enabled ? cur | (1 << bit) : cur & ~(1 << bit);
  writeStatus(state, next);
}

function getFlag(state, bit) {
  return !!(getStatus(state) & (1 << bit));
}

function setZeroFlag(state, val) {
  setFlag(state, 2, (val & 0xff) === 0);
}

function updateFlagsAdd(state, a, b, resultFull) {
  setFlag(state, 0, resultFull > 0xff);           // C: carry
  setFlag(state, 1, (a & 0x0f) + (b & 0x0f) > 0x0f); // DC: digit carry
  setZeroFlag(state, resultFull & 0xff);          // Z: zero
}

function updateFlagsSub(state, a, b, resultFull) {
  setFlag(state, 0, (a & 0xff) >= (b & 0xff));    // C: no borrow
  setFlag(state, 1, (a & 0x0f) >= (b & 0x0f));    // DC: no digit borrow
  setZeroFlag(state, resultFull & 0xff);          // Z: zero
}

function parseLine(line) {
  const clean = line.split(";")[0].trim();
  if (!clean) return null;
  const tokens = clean.replace(/,/g, " ").split(/\s+/);
  return { instruction: tokens[0].toUpperCase(), operands: tokens.slice(1) };
}

const INSTRUCTIONS = {
  // Byte/file operations
  ADDWF: {
    // ADDWF f,d : W + f -> d (F o W). Ej: ADDWF 0x20,F
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const oldW = st.W & 0xff;
      const full = cur + oldW;
      const val = full & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      updateFlagsAdd(st, cur, oldW, full);
    },
  },
  ANDWF: {
    // ANDWF f,d : W & f -> d. Ej: ANDWF 0x20,W
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = cur & st.W & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setZeroFlag(st, val);
    },
  },
  CLRF: {
    // CLRF f : f = 0. Ej: CLRF 0x05
    operands: 1,
    execute: ([f], st) => {
      const k = normalizeReg(f);
      st.registers[k] = 0;
      setZeroFlag(st, 0);
    },
  },
  CLRW: {
    // CLRW : W = 0
    operands: 0,
    execute: (_, st) => {
      st.W = 0;
      setZeroFlag(st, 0);
    },
  },
  COMF: {
    // COMF f,d : complemento a 1 de f -> d. Ej: COMF 0x20,W
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = ~cur & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setZeroFlag(st, val);
    },
  },
  DECF: {
    // DECF f,d : f - 1 -> d. Ej: DECF 0x20,F
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = (cur - 1) & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setZeroFlag(st, val);
    },
  },
  DECFSZ: {
    // DECFSZ f,d : decrementa; si resultado = 0 salta siguiente
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = (cur - 1) & 0xff;
      st.registers[k] = val;
      if (val === 0) st.PC++;
      setZeroFlag(st, val);
    },
  },
  INCF: {
    // INCF f,d : f + 1 -> d. Ej: INCF 0x20,W
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = (cur + 1) & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setZeroFlag(st, val);
    },
  },
  INCFSZ: {
    // INCFSZ f,d : incrementa; si resultado = 0 salta siguiente
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = (cur + 1) & 0xff;
      st.registers[k] = val;
      if (val === 0) st.PC++;
      setZeroFlag(st, val);
    },
  },
  IORWF: {
    // IORWF f,d : W | f -> d. Ej: IORWF 0x20,F
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = (cur | st.W) & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setZeroFlag(st, val);
    },
  },
  MOVF: {
    // MOVF f,d : mueve f -> d. Ej: MOVF 0x20,W
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = cur;
      else st.W = cur;
      setZeroFlag(st, cur);
    },
  },
  MOVWF: {
    // MOVWF f : W -> f. Ej: MOVWF 0x20
    // Nota: no modifica la bandera Z en este intérprete.
    operands: 1,
    execute: ([f], st) => {
      const k = normalizeReg(f);
      st.registers[k] = st.W & 0xff;
    },
  },
  // NOP : no hace nada; solo avanza PC
  NOP: { operands: 0, execute: () => {} },
  RLF: {
    // RLF f,d : rota left f -> d, rota a través de Carry (bit0 de STATUS)
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const oldCarry = getFlag(st, 0) ? 1 : 0;
      const newCarry = (cur & 0x80) >> 7;
      const val = ((cur << 1) & 0xff) | oldCarry;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setFlag(st, 0, !!newCarry);
      setZeroFlag(st, val);
    },
  },
  RRF: {
    // RRF f,d : rota right f -> d, rota a través de Carry (bit0 de STATUS)
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const oldCarry = getFlag(st, 0) ? 1 : 0;
      const newCarry = cur & 0x01;
      const val = ((oldCarry << 7) & 0xff) | (cur >> 1);
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setFlag(st, 0, !!newCarry);
      setZeroFlag(st, val);
    },
  },
  SUBWF: {
    // SUBWF f,d : f - W -> d. Ej: SUBWF 0x20,W
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const oldW = st.W & 0xff;
      const full = cur - oldW;
      const val = full & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      updateFlagsSub(st, cur, oldW, full);
    },
  },
  SWAPF: {
    // SWAPF f,d : intercambia nibbles alto/bajo. Ej: SWAPF 0x20,F
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const v = st.registers[k] || 0;
      const val = (((v & 0x0f) << 4) | ((v & 0xf0) >> 4)) & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setZeroFlag(st, val);
    },
  },
  XORWF: {
    // XORWF f,d : W ^ f -> d. Ej: XORWF 0x20,W
    operands: 2,
    execute: ([f, d], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      const val = (cur ^ st.W) & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      setZeroFlag(st, val);
    },
  },

  // Bit ops
  // Nota: las operaciones sobre bits no ajustan banderas (Z no afectada aquí)
  BCF: {
    // BCF f,b : limpia bit b de f. Ej: BCF 0x05,2
    operands: 2,
    execute: ([f, b], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      st.registers[k] = cur & ~(1 << Number(b)) & 0xff;
    },
  },
  BSF: {
    // BSF f,b : setea bit b de f. Ej: BSF 0x05,3
    operands: 2,
    execute: ([f, b], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      st.registers[k] = (cur | (1 << Number(b))) & 0xff;
    },
  },
  BTFSC: {
    // BTFSC f,b : si bit = 0 salta siguiente instrucción
    operands: 2,
    execute: ([f, b], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      if ((cur & (1 << Number(b))) === 0) st.PC++;
    },
  },
  BTFSS: {
    // BTFSS f,b : si bit = 1 salta siguiente instrucción
    operands: 2,
    execute: ([f, b], st) => {
      const k = normalizeReg(f);
      const cur = st.registers[k] || 0;
      if ((cur & (1 << Number(b))) !== 0) st.PC++;
    },
  },

  // Literal ops
  ADDLW: {
    // ADDLW k : W + k -> W. Ej: ADDLW 0x10
    operands: 1,
    execute: ([k], st) => {
      const v = parseValue(k) & 0xff;
      const oldW = st.W & 0xff;
      const full = oldW + v;
      st.W = full & 0xff;
      updateFlagsAdd(st, oldW, v, full);
    },
  },
  ANDLW: {
    // ANDLW k : W & k -> W
    operands: 1,
    execute: ([k], st) => {
      st.W = st.W & parseValue(k) & 0xff;
      setZeroFlag(st, st.W);
    },
  },
  IORLW: {
    // IORLW k : W | k -> W
    operands: 1,
    execute: ([k], st) => {
      st.W = (st.W | parseValue(k)) & 0xff;
      setZeroFlag(st, st.W);
    },
  },
  XORLW: {
    // XORLW k : W ^ k -> W
    operands: 1,
    execute: ([k], st) => {
      st.W = (st.W ^ parseValue(k)) & 0xff;
      setZeroFlag(st, st.W);
    },
  },
  SUBLW: {
    // SUBLW k : k - W -> W
    operands: 1,
    execute: ([k], st) => {
      const v = parseValue(k) & 0xff;
      const oldW = st.W & 0xff;
      const full = v - oldW;
      st.W = full & 0xff;
      updateFlagsSub(st, v, oldW, full);
    },
  },
  MOVLW: {
    // MOVLW k : carga literal k en W. Ej: MOVLW 0x55
    operands: 1,
    execute: ([k], st) => {
      st.W = parseValue(k) & 0xff;
    },
  },
  RETLW: {
    // RETLW k : carga literal en W y retorna (pop)
    operands: 1,
    execute: ([k], st) => {
      st.W = parseValue(k) & 0xff;
      st.PC = st.stack.length ? st.stack.pop() : 0;
    },
  },

  // Flow / control
  CALL: {
    // CALL k : push PC, PC = k. Ej: CALL 0x10
    operands: 1,
    execute: ([k], st) => {
      st.stack.push(st.PC);
      st.PC = parseValue(k);
    },
  },
  GOTO: {
    // GOTO k : PC = k. Ej: GOTO 0x20
    operands: 1,
    execute: ([k], st) => {
      st.PC = parseValue(k);
    },
  },
  RETURN: {
    // RETURN : pop PC
    operands: 0,
    execute: (_, st) => {
      st.PC = st.stack.length ? st.stack.pop() : 0;
    },
  },
  // RETFIE : Return from interrupt -> comportado como RETURN (pop PC)
  RETFIE: {
    operands: 0,
    execute: (_, st) => {
      st.PC = st.stack.length ? st.stack.pop() : 0;
    },
  },
  // CLRWDT : Clear watchdog timer (no modelado)
  CLRWDT: { operands: 0, execute: () => {} },
  // SLEEP : entra en modo sleep (no modelado)
  SLEEP: { operands: 0, execute: () => {} },
};

function validateLine(line, lineNumber) {
  const parsed = parseLine(line);
  if (!parsed) return null;
  const { instruction, operands } = parsed;
  const def = INSTRUCTIONS[instruction];
  if (!def)
    return {
      line: lineNumber,
      error: `Instrucción desconocida: ${instruction}`,
    };
  if (operands.length !== def.operands)
    return {
      line: lineNumber,
      error: `${instruction} espera ${def.operands} operando(s)`,
    };
  return { ok: true };
}

window.PICInterpreter = {
  // API del intérprete usada por la UI:
  // - reset(): reinicia estado (PC, W, registros, pila)
  // - validate(lines): valida cada línea y devuelve errores
  // - step(line): ejecuta una línea y actualiza PC
  // - getState(): devuelve copia del estado
  reset() {
    PIC_STATE.PC = 0;
    PIC_STATE.W = 0;
    PIC_STATE.registers = {};
    PIC_STATE.stack = [];
  },
  validate(lines) {
    const errors = [];
    lines.forEach((line, i) => {
      const r = validateLine(line, i + 1);
      if (r?.error) errors.push(r);
    });
    return errors;
  },
  // Ejecuta una línea. Las instrucciones pueden modificar PIC_STATE.PC
  // directamente (por ejemplo GOTO/CALL/BTFSS/DECFSZ). Si la línea es vacía
  // o desconocida, simplemente avanza PC.
  step(line) {
    const parsed = parseLine(line);
    if (!parsed) {
      PIC_STATE.PC++;
      return;
    }
    const def = INSTRUCTIONS[parsed.instruction];
    if (!def) {
      PIC_STATE.PC++;
      return;
    }
    def.execute(parsed.operands, PIC_STATE);
    PIC_STATE.PC++;
  },
  getState() {
    return JSON.parse(JSON.stringify(PIC_STATE));
  },
};
