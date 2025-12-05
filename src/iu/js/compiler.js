// Compilador ASM para PIC16F84A

const INSTRUCTION_SET = {
    // Operaciones con archivos de registro orientadas a bytes
    'ADDWF': { opcode: 0x0700, operands: 2, description: 'Sumar W y f' },
    'ANDWF': { opcode: 0x0500, operands: 2, description: 'AND lógico entre W y f' },
    'CLRF': { opcode: 0x0180, operands: 1, description: 'Limpiar registro f (poner en 0)' },
    'CLRW': { opcode: 0x0100, operands: 0, description: 'Limpiar registro W (poner en 0)' },
    'COMF': { opcode: 0x0900, operands: 2, description: 'Complementar f (invertir bits)' },
    'DECF': { opcode: 0x0300, operands: 2, description: 'Decrementar f (restar 1)' },
    'DECFSZ': { opcode: 0x0B00, operands: 2, description: 'Decrementar f, saltar si es 0' },
    'INCF': { opcode: 0x0A00, operands: 2, description: 'Incrementar f (sumar 1)' },
    'INCFSZ': { opcode: 0x0F00, operands: 2, description: 'Incrementar f, saltar si es 0' },
    'IORWF': { opcode: 0x0400, operands: 2, description: 'OR inclusivo entre W y f' },
    'MOVF': { opcode: 0x0800, operands: 2, description: 'Mover f a destino' },
    'MOVWF': { opcode: 0x0080, operands: 1, description: 'Mover W al registro f' },
    'NOP': { opcode: 0x0000, operands: 0, description: 'No operación (no hace nada)' },
    'RLF': { opcode: 0x0D00, operands: 2, description: 'Rotar f a la izquierda a través del carry' },
    'RRF': { opcode: 0x0C00, operands: 2, description: 'Rotar f a la derecha a través del carry' },
    'SUBWF': { opcode: 0x0200, operands: 2, description: 'Restar W de f' },
    'SWAPF': { opcode: 0x0E00, operands: 2, description: 'Intercambiar nibbles en f' },
    'XORWF': { opcode: 0x0600, operands: 2, description: 'XOR exclusivo entre W y f' },
    
    // Operaciones con bits
    'BCF': { opcode: 0x1000, operands: 2, description: 'Limpiar bit en f (poner en 0)' },
    'BSF': { opcode: 0x1400, operands: 2, description: 'Establecer bit en f (poner en 1)' },
    'BTFSC': { opcode: 0x1800, operands: 2, description: 'Probar bit en f, saltar si está en 0' },
    'BTFSS': { opcode: 0x1C00, operands: 2, description: 'Probar bit en f, saltar si está en 1' },
    
    // Operaciones con literales y control
    'ADDLW': { opcode: 0x3E00, operands: 1, description: 'Sumar literal a W' },
    'ANDLW': { opcode: 0x3900, operands: 1, description: 'AND lógico entre literal y W' },
    'CALL': { opcode: 0x2000, operands: 1, description: 'Llamar subrutina' },
    'CLRWDT': { opcode: 0x0064, operands: 0, description: 'Limpiar temporizador watchdog' },
    'GOTO': { opcode: 0x2800, operands: 1, description: 'Saltar a dirección' },
    'IORLW': { opcode: 0x3800, operands: 1, description: 'OR inclusivo entre literal y W' },
    'MOVLW': { opcode: 0x3000, operands: 1, description: 'Mover literal a W' },
    'RETFIE': { opcode: 0x0009, operands: 0, description: 'Retornar de interrupción' },
    'RETLW': { opcode: 0x3400, operands: 1, description: 'Retornar con literal en W' },
    'RETURN': { opcode: 0x0008, operands: 0, description: 'Retornar de subrutina' },
    'SLEEP': { opcode: 0x0063, operands: 0, description: 'Entrar en modo de bajo consumo' },
    'SUBLW': { opcode: 0x3C00, operands: 1, description: 'Restar W del literal' },
    'XORLW': { opcode: 0x3A00, operands: 1, description: 'XOR exclusivo entre literal y W' }
};

function parseNumber(str) {
    if (!str) return 0;
    
    str = str.trim().replace(/,/g, '');
    
    // Hexadecimal
    if (str.startsWith('0x') || str.startsWith('0X')) {
        return parseInt(str.substring(2), 16);
    }
    
    // Binary
    if (str.startsWith('0b') || str.startsWith('0B')) {
        return parseInt(str.substring(2), 2);
    }
    
    // Hexadecimal with H suffix
    if (str.endsWith('h') || str.endsWith('H')) {
        return parseInt(str.substring(0, str.length - 1), 16);
    }
    
    // Decimal
    return parseInt(str, 10);
}

function parseOperand(operand) {
    if (!operand) {
        throw new Error('Falta operando');
    }
    
    operand = operand.trim().replace(/,/g, '');
    return parseNumber(operand);
}

function parseDestination(dest) {
    if (!dest) return 0; // Default to W
    
    dest = dest.trim().toUpperCase().replace(/,/g, '');
    
    if (dest === 'F' || dest === '1') return 1;
    if (dest === 'W' || dest === '0') return 0;
    
    return parseInt(dest, 10);
}

function formatHexLine(address, machineCode) {
    const addr = address.toString(16).toUpperCase().padStart(4, '0');
    const code = machineCode.toString(16).toUpperCase().padStart(4, '0');
    return `${addr}: ${code}`;
}

function generateIntelHex(hexLines) {
    if (hexLines.length === 0) {
        return '';
    }
    
    let output = '; Código Hexadecimal Generado\n';
    output += '; Formato: DIRECCIÓN: CÓDIGO\n';
    output += ';\n';
    
    for (const line of hexLines) {
        output += line + '\n';
    }
    
    output += '\n; Fin del programa';
    
    return output;
}

function compileASM(asmCode) {
    const errors = [];
    const hexLines = [];
    let address = 0x0000;
    
    const lines = asmCode.split('\n');
    
    for (let i = 0; i < lines.length; i++) {
        const lineNumber = i + 1;
        let line = lines[i].trim();
        
        // Remove comments
        const commentIndex = line.indexOf(';');
        if (commentIndex !== -1) {
            line = line.substring(0, commentIndex).trim();
        }
        
        // Skip empty lines
        if (!line) continue;
        
        // Parse line
        const parts = line.split(/\s+/);
        const instruction = parts[0].toUpperCase();
        
        // Handle directives
        if (instruction === 'ORG') {
            address = parseNumber(parts[1]);
            continue;
        }
        
        if (instruction === 'END') {
            break;
        }
        
        // Compile instruction
        const instrDef = INSTRUCTION_SET[instruction];
        
        if (!instrDef) {
            errors.push(`Línea ${lineNumber}: Instrucción desconocida "${instruction}"`);
            continue;
        }
        
        try {
            let machineCode = instrDef.opcode;
            
            if (instrDef.operands >= 1) {
                const operand1 = parseOperand(parts[1]);
                
                if (instruction === 'GOTO' || instruction === 'CALL') {
                    // 11-bit address
                    machineCode |= (operand1 & 0x7FF);
                } else if (instruction.startsWith('MOVLW') || instruction.startsWith('ADDLW') || 
                           instruction.startsWith('SUBLW') || instruction.startsWith('ANDLW') ||
                           instruction.startsWith('IORLW') || instruction.startsWith('XORLW') ||
                           instruction.startsWith('RETLW')) {
                    // 8-bit literal
                    machineCode |= (operand1 & 0xFF);
                } else if (instruction.startsWith('BCF') || instruction.startsWith('BSF') ||
                           instruction.startsWith('BTFSC') || instruction.startsWith('BTFSS')) {
                    // Bit operations: bit number and file address
                    const bitNum = parseOperand(parts[2]);
                    machineCode |= ((bitNum & 0x07) << 7) | (operand1 & 0x7F);
                } else {
                    // File register operations
                    machineCode |= (operand1 & 0x7F);
                    
                    if (instrDef.operands === 2) {
                        const dest = parseDestination(parts[2]);
                        machineCode |= (dest << 7);
                    }
                }
            }
            
            hexLines.push(formatHexLine(address, machineCode));
            address++;
            
        } catch (error) {
            errors.push(`Línea ${lineNumber}: ${error.message}`);
        }
    }
    
    // Generate Intel HEX format
    const hex = generateIntelHex(hexLines);
    
    return { hex, errors };
}
