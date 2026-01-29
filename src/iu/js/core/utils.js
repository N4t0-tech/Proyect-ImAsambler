/**
 * @fileoverview Utilidades compartidas para ImAsembler
 * Funciones de parsing y normalización usadas por el compilador y simulador
 */

/**
 * Parsea un valor numérico en diferentes formatos
 * @param {string|number} token - Valor a parsear
 * @returns {number} Valor numérico parseado
 * @example
 * parseValue('0x10')    // 16 (hexadecimal con prefijo 0x)
 * parseValue('10h')     // 16 (hexadecimal con sufijo h)
 * parseValue('0b1010')  // 10 (binario)
 * parseValue('16')      // 16 (decimal)
 */
function parseValue(token) {
  if (token === undefined || token === null) return 0;

  const s = token.toString().trim().replace(/,/g, '');

  // Hexadecimal con prefijo 0x
  if (s.startsWith('0x') || s.startsWith('0X')) {
    return parseInt(s.substring(2), 16);
  }

  // Binario con prefijo 0b
  if (s.startsWith('0b') || s.startsWith('0B')) {
    return parseInt(s.substring(2), 2);
  }

  // Hexadecimal con sufijo h
  if (/^[0-9A-Fa-f]+h$/i.test(s)) {
    return parseInt(s.slice(0, -1), 16);
  }

  // Decimal
  return parseInt(s, 10) || 0;
}

/**
 * Normaliza un registro a formato "0xNN"
 * @param {string|number} token - Registro a normalizar
 * @returns {string} Registro normalizado en formato "0xNN"
 * @example
 * normalizeReg('05')    // "0x05"
 * normalizeReg('0x20')  // "0x20"
 * normalizeReg('PORTB') // "PORTB"
 */
function normalizeReg(token) {
  if (token === undefined || token === null) return token;

  const s = token.toString().trim();
  const n = parseValue(s);

  if (!isNaN(n)) {
    return '0x' + (n & 0xff).toString(16).toUpperCase().padStart(2, '0');
  }

  return s.toUpperCase();
}

/**
 * Parsea el destino de una operación (F o W)
 * @param {string} dest - Destino ('F', 'W', '0', '1')
 * @returns {number} 1 para F (archivo), 0 para W
 */
function parseDestination(dest) {
  if (!dest) return 0; // Default: W

  const d = dest.toString().trim().toUpperCase().replace(/,/g, '');

  if (d === 'F' || d === '1') return 1;
  if (d === 'W' || d === '0') return 0;

  return parseInt(d, 10) || 0;
}

/**
 * Formatea un número a hexadecimal con padding
 * @param {number} value - Valor a formatear
 * @param {number} digits - Número de dígitos (default: 2)
 * @returns {string} Valor formateado en hex
 */
function toHex(value, digits = 2) {
  return (value & ((1 << (digits * 4)) - 1))
    .toString(16)
    .toUpperCase()
    .padStart(digits, '0');
}

/**
 * Convierte un número a representación binaria con padding
 * @param {number} value - Valor a convertir
 * @param {number} bits - Número de bits (default: 8)
 * @returns {string} Representación binaria
 */
function toBinary(value, bits = 8) {
  return (value & ((1 << bits) - 1)).toString(2).padStart(bits, '0');
}

// Exportar para uso en navegador (global) y módulos
if (typeof window !== 'undefined') {
  window.PICUtils = {
    parseValue,
    normalizeReg,
    parseDestination,
    toHex,
    toBinary
  };
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    parseValue,
    normalizeReg,
    parseDestination,
    toHex,
    toBinary
  };
}
