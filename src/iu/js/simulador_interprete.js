// Helpers:
// parseValue(token): convierte un token numérico a entero. Acepta 0xNN, NNh, 0b..., o decimal.
// normalizeReg(token): normaliza un operando de registro a la clave "0xNN".
// setZeroFlag(state,val): ajusta el bit Z en STATUS/0x03 según si val == 0.
//
// Mapeo hacia la UI del simulador:
// - Si una instrucción cambia `PIC_STATE.W`, la UI leerá `getState().W` y actualizará
//   el `W Register` (bits y color).
// - Si una instrucción escribe en `PIC_STATE.registers['0xNN']`, la UI actualizará
//   la fila SFR correspondiente vía `syncSFR()`.
// - Las banderas se almacenan en `STATUS` y `0x03`; `setZeroFlag` actualiza ambas.
// - Cambios en `PIC_STATE.PC` indican a la UI qué línea ejecutar/mostrar como siguiente.

function parseValue(token) {
  if (token === undefined || token === null) return 0;
  const s = token.toString().trim();
  if (s.startsWith("0x") || s.startsWith("0X"))
    return parseInt(s.substring(2), 16);
  if (s.startsWith("0b") || s.startsWith("0B"))
    return parseInt(s.substring(2), 2);
  if (/^[bB]'([01]+)'$/.test(s))
    return parseInt(s.slice(2, -1), 2);
  if (/^[0-9A-Fa-f]+h$/i.test(s)) return parseInt(s.slice(0, -1), 16);
  return parseInt(s, 10);
}

const SFR_MAP = {
  INDF: "0x00", TMR0: "0x01", PCL: "0x02", STATUS: "0x03",
  FSR: "0x04", PORTA: "0x05", PORTB: "0x06", EEDATA: "0x08",
  EEADR: "0x09", PCLATH: "0x0A", INTCON: "0x0B",
  OPTION_REG: "0x81", TRISA: "0x85", TRISB: "0x86",
  EECON1: "0x88", EECON2: "0x89",
};

function normalizeReg(token) {
  if (token === undefined || token === null) return token;
  const s = token.toString().trim();
  const n = parseValue(s);
  if (!isNaN(n))
    return "0x" + (n & 0xff).toString(16).toUpperCase().padStart(2, "0");
  const upper = s.toUpperCase();
  return SFR_MAP[upper] || upper;
}

const BANK1_MAP = { 0x01: 0x81, 0x05: 0x85, 0x06: 0x86, 0x08: 0x88, 0x09: 0x89 };

function effectiveReg(token, state) {
  const key = normalizeReg(token);
  if (key && key.startsWith("0x")) {
    const addr = parseInt(key.slice(2), 16);
    // INDF (0x00): acceso indirecto — usa la dirección apuntada por FSR (0x04)
    if (addr === 0x00) {
      const fsr = state.registers["0x04"] || 0;
      return "0x" + (fsr & 0xff).toString(16).toUpperCase().padStart(2, "0");
    }
    // Bank 1: si RP0 (bit5 de STATUS) está activo, redirigir al banco 1
    if (getFlag(state, 5) && BANK1_MAP[addr] !== undefined) {
      return "0x" + BANK1_MAP[addr].toString(16).toUpperCase().padStart(2, "0");
    }
  }
  return key;
}

function setZeroFlag(state, val) {
  // Ajusta el bit Z (bit 2) en STATUS/0x03 si `val` es cero.
  // El intérprete mantiene STATUS tanto en "0x03" como en "STATUS" por compatibilidad con UI.
  const bit = 1 << 2; // Z flag in STATUS (bit 2)
  const cur = state.registers["0x03"] || state.registers["STATUS"] || 0;
  const newVal = (val & 0xff) === 0 ? cur | bit : cur & ~bit;
  // store back in both possible keys for compatibility
  state.registers["0x03"] = newVal;
  state.registers["STATUS"] = newVal;
}

// Helpers para flags C (bit0) y DC (bit1)
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
  const cur = getStatus(state);
  return !!(cur & (1 << bit));
}

function updateFlagsAdd(state, a, b, resultFull) {
  // a + b = resultFull (may exceed 8 bits)
  const result = resultFull & 0xff;
  // C: carry out of bit7
  setFlag(state, 0, resultFull > 0xff);
  // DC: carry from bit3
  setFlag(state, 1, (a & 0x0f) + (b & 0x0f) > 0x0f);
  setZeroFlag(state, result);
}

function updateFlagsSub(state, a, b, resultFull) {
  // a - b = resultFull (signed or with borrow); for C flag: set if no borrow (a >= b)
  const result = resultFull & 0xff;
  setFlag(state, 0, (a & 0xff) >= (b & 0xff));
  // DC: borrow from bit4 -> set if (a_low >= b_low)
  setFlag(state, 1, (a & 0x0f) >= (b & 0x0f));
  setZeroFlag(state, result);
}

const PIC_STATE = {
  PC: 0,
  W: 0,
  registers: {},
  stack: [],
};

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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
      const cur = st.registers[k] || 0;
      const val = (cur - 1) & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      if (val === 0) st.PC++;
      setZeroFlag(st, val);
    },
  },
  INCF: {
    // INCF f,d : f + 1 -> d. Ej: INCF 0x20,W
    operands: 2,
    execute: ([f, d], st) => {
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
      const cur = st.registers[k] || 0;
      const val = (cur + 1) & 0xff;
      const destF = d && (d.toUpperCase() === "F" || d === "1");
      if (destF) st.registers[k] = val;
      else st.W = val;
      if (val === 0) st.PC++;
      setZeroFlag(st, val);
    },
  },
  IORWF: {
    // IORWF f,d : W | f -> d. Ej: IORWF 0x20,F
    operands: 2,
    execute: ([f, d], st) => {
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
      st.registers[k] = st.W & 0xff;
    },
  },
  // NOP : no hace nada; solo avanza PC
  NOP: { operands: 0, execute: () => {} },
  RLF: {
    // RLF f,d : rota left f -> d, rota a través de Carry (bit0 de STATUS)
    operands: 2,
    execute: ([f, d], st) => {
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
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
      const k = effectiveReg(f, st);
      const cur = st.registers[k] || 0;
      st.registers[k] = cur & ~(1 << Number(b)) & 0xff;
    },
  },
  BSF: {
    // BSF f,b : setea bit b de f. Ej: BSF 0x05,3
    operands: 2,
    execute: ([f, b], st) => {
      const k = effectiveReg(f, st);
      const cur = st.registers[k] || 0;
      st.registers[k] = (cur | (1 << Number(b))) & 0xff;
    },
  },
  BTFSC: {
    // BTFSC f,b : si bit = 0 salta siguiente instrucción
    operands: 2,
    execute: ([f, b], st) => {
      const k = effectiveReg(f, st);
      const cur = st.registers[k] || 0;
      if ((cur & (1 << Number(b))) === 0) st.PC++;
    },
  },
  BTFSS: {
    // BTFSS f,b : si bit = 1 salta siguiente instrucción
    operands: 2,
    execute: ([f, b], st) => {
      const k = effectiveReg(f, st);
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
    jumps: true,
    execute: ([k], st) => {
      st.W = parseValue(k) & 0xff;
      if (!st.stack.length) {
        st.stackError = "Stack underflow: RETLW sin CALL previo";
        st.PC = 0;
        return;
      }
      st.PC = st.stack.pop();
    },
  },

  // Flow / control
  CALL: {
    // CALL k : push PC+1 (dirección de retorno), PC = k. Ej: CALL 0x10
    operands: 1,
    jumps: true,
    execute: ([k], st) => {
      if (st.stack.length >= 8) {
        st.stackError = "Stack overflow: se superaron los 8 niveles del PIC16F84A";
        return;
      }
      st.stack.push(st.PC + 1);
      st.PC = parseValue(k);
    },
  },
  GOTO: {
    // GOTO k : PC = k. Ej: GOTO 0x20
    operands: 1,
    jumps: true,
    execute: ([k], st) => {
      st.PC = parseValue(k);
    },
  },
  RETURN: {
    // RETURN : pop PC (dirección de retorno guardada por CALL)
    operands: 0,
    jumps: true,
    execute: (_, st) => {
      if (!st.stack.length) {
        st.stackError = "Stack underflow: RETURN sin CALL previo";
        st.PC = 0;
        return;
      }
      st.PC = st.stack.pop();
    },
  },
  RETFIE: {
    // RETFIE : retorno de interrupción (comportado como RETURN)
    operands: 0,
    jumps: true,
    execute: (_, st) => {
      if (!st.stack.length) {
        st.stackError = "Stack underflow: RETFIE sin CALL previo";
        st.PC = 0;
        return;
      }
      st.PC = st.stack.pop();
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
  let { instruction, operands } = parsed;
  // Strip label prefix if present (e.g. "inicio:" or inline "inicio: MOVLW")
  if (instruction.endsWith(":")) {
    if (operands.length === 0) return null; // label-only line
    instruction = operands.shift().toUpperCase();
  }
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
    PIC_STATE.stackError = null;
  },
  validate(lines) {
    const errors = [];
    lines.forEach((line, i) => {
      const r = validateLine(line, i + 1);
      if (r?.error) errors.push(r);
    });
    return errors;
  },
  // Ejecuta una línea. Instrucciones con `jumps: true` (GOTO, CALL, RETURN, etc.)
  // controlan PC directamente y no reciben el PC++ automático.
  // Instrucciones de skip (BTFSC/BTFSS/DECFSZ/INCFSZ) hacen PC++ interno
  // para el salto y reciben el PC++ externo para avanzar normalmente.
  step(line) {
    const parsed = parseLine(line);
    if (!parsed) {
      PIC_STATE.PC++;
      return;
    }
    let { instruction, operands } = parsed;
    // Manejar labels inline (ej: "inicio: MOVLW 0x55")
    if (instruction.endsWith(':')) {
      if (operands.length === 0) { PIC_STATE.PC++; return; }
      instruction = operands.shift().toUpperCase();
    }
    const def = INSTRUCTIONS[instruction];
    if (!def) {
      PIC_STATE.PC++;
      return;
    }
    PIC_STATE.stackError = null;
    def.execute(operands, PIC_STATE);
    if (!def.jumps) PIC_STATE.PC++;
  },
  getState() {
    return JSON.parse(JSON.stringify(PIC_STATE));
  },
};
