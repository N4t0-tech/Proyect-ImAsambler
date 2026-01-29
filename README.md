# ImAsembler v2.0

**Plataforma interactiva para aprender ensamblador del microcontrolador PIC16F84A**

Aplicación de escritorio desarrollada con **Electron**, que incluye minijuegos educativos, simulador visual y compilador ASM.

---

## Novedades en v2.0

### Arquitectura Refactorizada

La versión 2.0 introduce una arquitectura modular con código compartido:

```
src/iu/js/
├── core/                    # Módulos compartidos (NUEVO)
│   ├── utils.js            # Utilidades de parsing y formateo
│   ├── instructions.js     # Definiciones de instrucciones PIC16F84A
│   ├── pic-state.js        # Estado centralizado del microcontrolador
│   └── index.js            # Punto de entrada del core
├── compiler.js             # Compilador ASM (usa core)
├── compiler_script.js      # UI del compilador
├── simulador.js            # UI del simulador
└── simulador_interprete.js # Intérprete (usa core)
```

### Beneficios de la Nueva Arquitectura

| Antes | Ahora |
|-------|-------|
| Código duplicado entre compilador y simulador | Funciones compartidas en `core/` |
| Definiciones de instrucciones duplicadas | Fuente única en `instructions.js` |
| Estado disperso | Estado centralizado en `pic-state.js` |
| Difícil mantenimiento | Módulos claros y documentados |

---

## Descripción del Proyecto

**ImAsembler** es una aplicación interactiva diseñada para transformar el aprendizaje del ensamblador del microcontrolador **PIC16F84A**, volviéndolo accesible, dinámico y motivador.

### Características Principales

- **Compilador ASM**: 37 instrucciones del PIC16F84A con compilación a hexadecimal
- **Simulador Visual**: Ejecución paso a paso con visualización de registros y memoria
- **Minijuegos Educativos**: 3 niveles progresivos para aprender jugando
- **Documentación Integrada**: Guía completa del PIC16F84A

---

## Estructura del Proyecto

```
Proyect-ImAsambler/
├── main.js                     # Punto de entrada Electron
├── package.json                # Dependencias
├── README.md                   # Este archivo
└── src/
    └── iu/
        ├── screens/            # Páginas HTML
        │   ├── index.html          # Página principal
        │   ├── compiler_index.html # Compilador
        │   ├── simulador_index.html# Simulador
        │   ├── minijuegos.html     # Menú de minijuegos
        │   └── doc.html            # Documentación
        ├── js/
        │   ├── core/               # Módulos compartidos
        │   │   ├── utils.js        # parseValue, normalizeReg, etc.
        │   │   ├── instructions.js # PIC_INSTRUCTIONS, PIC_SFR
        │   │   └── pic-state.js    # PIC_STATE, flags, stack
        │   ├── compiler.js         # Lógica de compilación
        │   ├── compiler_script.js  # UI del compilador
        │   ├── simulador.js        # UI del simulador
        │   └── simulador_interprete.js # Intérprete de instrucciones
        ├── css/                # Estilos
        └── minijuegos/         # 3 minijuegos educativos
            ├── minijuego1/     # Control de LEDs
            ├── minijuego2/     # Detección de errores
            └── minijuego3/     # Secuenciador LED
```

---

## Módulos del Core

### `core/utils.js`

Utilidades compartidas para parsing y formateo:

```javascript
// Parsear valores numéricos en diferentes formatos
PICUtils.parseValue('0x10')    // 16 (hex con prefijo)
PICUtils.parseValue('10h')     // 16 (hex con sufijo)
PICUtils.parseValue('0b1010')  // 10 (binario)
PICUtils.parseValue('16')      // 16 (decimal)

// Normalizar registros
PICUtils.normalizeReg('05')    // "0x05"
PICUtils.normalizeReg('0x20')  // "0x20"

// Parsear destino de operaciones
PICUtils.parseDestination('F') // 1
PICUtils.parseDestination('W') // 0
```

### `core/instructions.js`

Definiciones completas de las 37 instrucciones del PIC16F84A:

```javascript
PIC_INSTRUCTIONS.MOVLW
// { opcode: 0x3000, operands: 1, category: 'literal',
//   description: 'Mover literal a W', syntax: 'MOVLW k', flags: [] }

PIC_INSTRUCTION_CATEGORIES
// Categorías para UI: 'Operaciones con archivos', 'Operaciones con bits', etc.

PIC_SFR
// Registros especiales: STATUS, PORTA, PORTB, TMR0, etc.

PIC_STATUS_BITS
// { C: 0, DC: 1, Z: 2, PD: 3, TO: 4, RP0: 5, RP1: 6, IRP: 7 }
```

### `core/pic-state.js`

Estado centralizado del microcontrolador:

```javascript
PICState.state     // { PC, W, registers, stack, running, halted }
PICState.reset()   // Reiniciar estado
PICState.getState() // Obtener copia del estado

// Gestión de flags
PICState.setFlag(bit, enabled)
PICState.getFlag(bit)
PICState.setZeroFlag(val)
PICState.updateFlagsAdd(a, b, result)
PICState.updateFlagsSub(a, b, result)

// Stack
PICState.stackPush(address)
PICState.stackPop()
```

---

## Tecnologías

| Tecnología | Versión | Uso |
|------------|---------|-----|
| Electron | 39.2.4 | Framework de escritorio |
| JavaScript | ES6+ | Lógica de aplicación |
| Monaco Editor | 0.45.0 | Editor de código |
| Font Awesome | 6.5.0 | Iconos |
| HTML5/CSS3 | - | Interfaz de usuario |

---

## Instalación y Ejecución

```bash
# Clonar el repositorio
git clone https://github.com/tu-usuario/Proyect-ImAsambler.git
cd Proyect-ImAsambler

# Instalar dependencias
npm install

# Ejecutar en modo desarrollo
npm start
```

---

## Instrucciones Soportadas

### Operaciones con Bytes (17)
`ADDWF` `ANDWF` `CLRF` `CLRW` `COMF` `DECF` `DECFSZ` `INCF` `INCFSZ` `IORWF` `MOVF` `MOVWF` `NOP` `RLF` `RRF` `SUBWF` `SWAPF` `XORWF`

### Operaciones con Bits (4)
`BCF` `BSF` `BTFSC` `BTFSS`

### Literales y Control (13)
`ADDLW` `ANDLW` `CALL` `CLRWDT` `GOTO` `IORLW` `MOVLW` `RETFIE` `RETLW` `RETURN` `SLEEP` `SUBLW` `XORLW`

---

## Guía de Desarrollo

### Agregar una Nueva Instrucción

1. Agregar definición en `core/instructions.js`:
```javascript
NUEVA_INST: {
  opcode: 0xXXXX,
  operands: N,
  category: 'byte|bit|literal|control',
  description: 'Descripción',
  syntax: 'NUEVA_INST operandos',
  flags: ['C', 'DC', 'Z'] // flags afectados
}
```

2. Agregar implementación en `simulador_interprete.js`:
```javascript
NUEVA_INST: {
  operands: N,
  execute: ([op1, op2], st) => {
    // Lógica de ejecución
  }
}
```

### Usar Módulos del Core

```html
<!-- En tu archivo HTML -->
<script src="../js/core/utils.js"></script>
<script src="../js/core/instructions.js"></script>
<script src="../js/core/pic-state.js"></script>
```

```javascript
// En tu archivo JS
const valor = PICUtils.parseValue('0xFF');
const instrucciones = PIC_INSTRUCTIONS;
PICState.reset();
```

---

## Colaboración

1. Crear una rama nueva desde `main`
2. Hacer commits descriptivos
3. Abrir un Pull Request
4. Esperar revisión del equipo

### Convenciones de Código

- Usar JSDoc para documentar funciones
- Seguir el patrón de módulos existente
- Mantener fallbacks para compatibilidad

---

## Roadmap

### v2.1 (Próxima)
- [ ] Breakpoints en el simulador
- [ ] Soporte para etiquetas (labels) en compilador
- [ ] Velocidad de ejecución ajustable

### v2.2
- [ ] Exportar formato Intel HEX real
- [ ] Más minijuegos
- [ ] Visualización de LEDs virtuales

---

## Licencia

Este proyecto es de uso educativo.

---

## Créditos

Desarrollado como herramienta educativa para el aprendizaje de microcontroladores PIC.
