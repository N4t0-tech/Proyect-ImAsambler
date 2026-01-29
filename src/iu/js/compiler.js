/**
 * @fileoverview Compilador ASM para PIC16F84A
 * Usa las definiciones compartidas de core/instructions.js
 */

// Alias para compatibilidad con código existente
// PIC_INSTRUCTIONS se carga desde core/instructions.js
const INSTRUCTION_SET = typeof PIC_INSTRUCTIONS !== 'undefined' ? PIC_INSTRUCTIONS : {};

// Usa PICUtils.parseValue del core si está disponible
function parseNumber(str) {
    if (typeof PICUtils !== 'undefined') {
        return PICUtils.parseValue(str);
    }
    // Fallback para compatibilidad
    if (!str) return 0;
    str = str.toString().trim().replace(/,/g, '');
    if (str.startsWith('0x') || str.startsWith('0X')) return parseInt(str.substring(2), 16);
    if (str.startsWith('0b') || str.startsWith('0B')) return parseInt(str.substring(2), 2);
    if (/^[0-9A-Fa-f]+h$/i.test(str)) return parseInt(str.slice(0, -1), 16);
    return parseInt(str, 10) || 0;
}

function parseOperand(operand) {
    if (!operand) {
        throw new Error('Falta operando');
    }
    
    operand = operand.trim().replace(/,/g, '');
    return parseNumber(operand);
}

// Usa PICUtils.parseDestination del core si está disponible
function parseDestination(dest) {
    if (typeof PICUtils !== 'undefined') {
        return PICUtils.parseDestination(dest);
    }
    // Fallback
    if (!dest) return 0;
    const d = dest.toString().trim().toUpperCase().replace(/,/g, '');
    if (d === 'F' || d === '1') return 1;
    if (d === 'W' || d === '0') return 0;
    return parseInt(d, 10) || 0;
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
