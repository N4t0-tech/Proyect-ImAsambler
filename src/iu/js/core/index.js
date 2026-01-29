/**
 * @fileoverview Punto de entrada del módulo core de ImAsembler
 * Exporta todas las utilidades y definiciones compartidas
 *
 * Uso en HTML:
 *   <script src="js/core/utils.js"></script>
 *   <script src="js/core/instructions.js"></script>
 *   <script src="js/core/pic-state.js"></script>
 *
 * Esto expondrá:
 *   - window.PICUtils (parseValue, normalizeReg, etc.)
 *   - window.PIC_INSTRUCTIONS (definiciones de instrucciones)
 *   - window.PIC_INSTRUCTION_CATEGORIES (categorías para UI)
 *   - window.PIC_SFR (registros especiales)
 *   - window.PIC_STATUS_BITS (bits del STATUS)
 *   - window.PICState (gestión de estado)
 */

// Este archivo sirve como documentación del módulo core
// Los archivos individuales se cargan directamente en HTML

console.log('ImAsembler Core v2.0 loaded');
console.log('Available modules: PICUtils, PIC_INSTRUCTIONS, PICState');
