const INSTRUCTIONS = {
  MOVLW: {
    operands: 1,
    validate: ([k]) => {
      const value = parseInt(k, 16);
      return !isNaN(value) && value >= 0x00 && value <= 0xFF;
    },
    execute: ([k], state) => {
      state.W = parseInt(k, 16);
    },
    error: "MOVLW requiere un literal hexadecimal (00–FF)"
  },

  MOVWF: {
    operands: 1,
    validate: ([f]) => true,
    execute: ([f], state) => {
      state.registers[f] = state.W;
    },
    error: "MOVWF requiere un registro válido"
  },

BSF: {
  operands: 2,
  validate: ([f, b]) => {
    const bit = Number(b);
    return bit >= 0 && bit <= 7;
  },
  execute: ([f, b], state) => {
    if (state.registers[f] === undefined) {
      state.registers[f] = 0;
    }
    state.registers[f] |= (1 << b);
  },
  error: "BSF requiere registro y bit (0–7)"
},


  BCF: {
  operands: 2,
  validate: ([f, b]) => {
    const bit = Number(b);
    return bit >= 0 && bit <= 7;
  },
  execute: ([f, b], state) => {
    if (state.registers[f] === undefined) {
      state.registers[f] = 0;
    }
    state.registers[f] &= ~(1 << b);
  },
  error: "BCF requiere registro y bit (0–7)"
}
};
const PIC_STATE = {
  PC: 0,
  W: 0,
  registers: {}
};
function parseLine(line) {
  const clean = line.split(";")[0].trim();
  if (!clean) return null;

  const tokens = clean
    .replace(",", " ")
    .split(/\s+/);

  return {
    instruction: tokens[0].toUpperCase(),
    operands: tokens.slice(1)
  };
}
function validateLine(line, lineNumber) {
  const parsed = parseLine(line);
  if (!parsed) return null;

  const { instruction, operands } = parsed;
  const def = INSTRUCTIONS[instruction];

  if (!def) {
    return {
      line: lineNumber,
      error: `Instrucción desconocida: ${instruction}`
    };
  }

  if (operands.length !== def.operands) {
    return {
      line: lineNumber,
      error: `${instruction} espera ${def.operands} operando(s)`
    };
  }

  if (!def.validate(operands)) {
    return {
      line: lineNumber,
      error: def.error
    };
  }

  return { ok: true };
}
window.PICInterpreter = {
  reset() {
    PIC_STATE.PC = 0;
    PIC_STATE.W = 0;
    PIC_STATE.registers = {};
  },

  validate(lines) {
    const errors = [];

    lines.forEach((line, i) => {
      const result = validateLine(line, i + 1);
      if (result?.error) errors.push(result);
    });

    return errors;
  },

  step(line) {
    const parsed = parseLine(line);
    if (!parsed) {
      PIC_STATE.PC++;
      return;
    }

    const def = INSTRUCTIONS[parsed.instruction];
    def.execute(parsed.operands, PIC_STATE);
    PIC_STATE.PC++;
  },

  getState() {
    return JSON.parse(JSON.stringify(PIC_STATE));
  }
};
