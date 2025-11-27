# ImAsembler

**Plataforma interactiva para aprender ensamblador del microcontrolador PIC16F84A**
Aplicación desarrollada con **Electron**, minijuegos educativos, animaciones y simulaciones visuales.

---

## 📌 **Descripción del proyecto**

**ImAsembler** es una aplicación interactiva diseñada para transformar el aprendizaje del ensamblador del microcontrolador **PIC16F84A**, volviéndolo accesible, dinámico y motivador.

El proyecto busca reemplazar el enfoque tradicional —técnico, árido y abstracto— con una experiencia pedagógica moderna basada en:

* Minijuegos educativos
* Simulaciones visuales
* Animaciones interactivas
* Feedback inmediato
* Representaciones dinámicas del hardware

La idea principal es que los estudiantes comprendan cómo funcionan las instrucciones ensamblador **viendo** cómo afectan al microcontrolador en tiempo real.

Está dirigido a estudiantes de:

* Programación
* Electrónica
* Sistemas embebidos
* Arquitectura computacional

---

## 🎮 **Características principales**

### 🔧 **Simulador visual del PIC16F84A**

Incluye representaciones animadas de:

* Registros del microcontrolador
* Memoria RAM y bancos
* SFR (Special Function Registers)
* Puertos de entrada/salida
* Timer
* Stack

Y muestra cómo cada instrucción modifica estos componentes.

---

### 🎮 **Minijuegos educativos**

Minijuegos basados en instrucciones reales del PIC, como:

* `MOVLW`
* `BTFSC`
* `CALL`
* `GOTO`
* `INCF`, `DECF`
* Etc.

Los juegos son progresivos y ayudan a entender:

* Lógica de flujo
* Operaciones bit a bit
* Saltos condicionales
* Manipulación de registros

---

### 🔍 **Retos y niveles**

Incluyen:

* Problemas guiados
* Misiones donde el estudiante debe completar código ASM
* Pruebas de ejecución paso a paso
* Retos avanzados basados en ciclos del procesador

---

### ⚙️ **Feedback inmediato**

Cada vez que se ejecuta una instrucción:

* Cambia el estado del registro W
* Se actualizan los bits del registro STATUS
* Se animan los puertos
* Se modifica la RAM
* Se visualiza el flujo del programa

Esto facilita entender el **impacto directo** de cada instrucción.

---

### 📚 **Contenido pedagógico integrado**

Explicaciones integradas sobre:

* Qué hace cada instrucción
* Cómo se estructura el PIC16F84A
* Cómo funciona el pipeline
* Cómo se representa la memoria
* Ejemplos prácticos

El objetivo es que no dependas de manuales complejos.

---

## 👥 **Equipo de trabajo**

El proyecto está diseñado para un equipo de hasta **10 personas**, distribuidas en los siguientes roles:

### 1. **Líder Técnico / Arquitecto**

* Define arquitectura general
* Diseña el emulador del PIC
* Apoya al frontend y a los minijuegos

### 2. **Programador Backend (Simulador)**

* Implementa CPU PIC (ciclo de instrucción)
* RAM, SFR, timers y puertos
* Interprete de instrucciones ASM
* Ensamblador simplificado

### 3. **Programador Frontend**

* UI del editor ASM
* Visualización de registros, puertos y memoria
* Animaciones
* Integración con React / Canvas / WebGL

### 4. **Diseñador de Juegos / UX**

* Diseña minijuegos
* Niveles, objetivos y tutoriales
* Arte del chip, bancos y animaciones

### 5. **QA / Documentación / Integración**

* Pruebas unitarias y funcionales
* Documentación y manuales de usuario
* Pipeline de builds y empaquetado con Electron

---

## 🎯 **Objetivo del proyecto**

Entregar una plataforma funcional que incluya:

✔️ Simulador del PIC16F84A simplificado
✔️ Editor de código ensamblador (ASM)
✔️ Visualización gráfica de:

* Registros
* Memoria
* Bancos
* Puertos

✔️ **2–3 minijuegos** totalmente funcionales
✔️ Versión web preliminar
✔️ Empaquetado básico como aplicación de escritorio con Electron

---

## 🚀 **Cómo ejecutar el proyecto**

Una vez clonado:

```bash
npm install
npm start
```

---

## 🤝 **Cómo colaborar**

1. Crear una rama nueva
2. Hacer commits descriptivos
3. Subir los cambios
4. Abrir un Pull Request
5. Esperar revisión del equipo

