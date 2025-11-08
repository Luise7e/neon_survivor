# 🎮 MANIFIESTO DEL PROGRAMADOR DE VIDEOJUEGOS PROFESIONAL

> **Basado en el análisis del proyecto Neon Survivor Arena**  
> **Autor Original:** Luis Castellano Guzmán  
> **Versión:** 1.0 | **Fecha:** Noviembre 2025  
> **Propósito:** Plantilla maestra para desarrollo de videojuegos con IA

---

## 📋 RESUMEN EJECUTIVO

Este manifiesto define los principios, patrones y metodologías extraídos del desarrollo profesiona un juego móvil HTML5 híbrido para Android con más de 7,000 líneas de código, integración Firebase, monetización AdMob y arquitectura escalable.

**Stack Tecnológico:**
- **Frontend:** HTML5 Canvas, CSS3 (Grid/Flexbox), JavaScript Vanilla (ES6+)
- **Backend:** Firebase (Auth, Firestore, Cloud Functions)
- **Plataforma:** Android (WebView híbrido), Web (PWA)
- **Build System:** Gradle 8.x, PowerShell automation
- **Monetización:** AdMob (Interstitial + Rewarded Ads)
- **Control de Versiones:** Git (implícito)

**Métricas del Proyecto:**
- 5,520 líneas de HTML/CSS (index.html)
- 2,861 líneas de JavaScript puro (game.js)
- 588 líneas de Java (MainActivity.java)
- Arquitectura modular con separación de responsabilidades
- Zero frameworks externos (motor de juego custom)

---

## 🏗️ PARTE I: ARQUITECTURA Y STACK TÉCNICO

### 1.1 Filosofía de Stack: Minimalismo Funcional

**Principio Core:** "Menos dependencias, más control"

```javascript
// ❌ ANTI-PATRÓN: Dependencia de frameworks pesados
import Unity from 'unity-engine';
import Phaser from 'phaser';
import React from 'react';

// ✅ PATRÓN CORRECTO: Vanilla JS con APIs nativas
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
```

**Justificación:**
- **Control Total:** Cada línea de código es tuya, sin magia oculta
- **Performance:** Sin overhead de frameworks, rendering directo a Canvas
- **Portabilidad:** HTML5 puro funciona en web, Android, iOS (Cordova)
- **Mantenibilidad:** Sin breaking changes de dependencias externas

### 1.2 Estructura de Proyecto: Separación de Responsabilidades

```
proyecto/
├── android/                          # Wrapper nativo (solo si es híbrido)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── assets/              # Recursos del juego (HTML5)
│   │   │   │   ├── index.html       # UI completa (5,520 líneas)
│   │   │   │   ├── game.js          # Motor de juego (2,861 líneas)
│   │   │   │   ├── js/              # Módulos JavaScript
│   │   │   │   │   ├── config.js    # Configuración global
│   │   │   │   │   ├── firebase-handler.js  # Backend integration
│   │   │   │   │   └── ui-manager.js        # UI state management
│   │   │   │   ├── css/             # Estilos modulares
│   │   │   │   │   ├── global.css
│   │   │   │   │   ├── mobile-controls.css
│   │   │   │   │   └── game-ui.css
│   │   │   │   └── settings-icons/ # Assets (imágenes, sprites)
│   │   │   ├── java/                # Código nativo (solo puente)
│   │   │   │   └── MainActivity.java  # WebView + AdMob + Vibration
│   │   │   └── AndroidManifest.xml  # Permisos y configuración
│   │   └── build.gradle             # Build config + firma
│   └── build_native_aab.ps1         # Script de compilación automatizado
├── PROJECT_CONTEXT.md               # Documentación técnica CRÍTICA
└── MANIFEST.md                      # Este documento (plantilla base)
```

**Regla de Oro:** 
- `index.html` = UI + Estilo + Lógica de Presentación
- `game.js` = Motor de juego + Física + Rendering
- `MainActivity.java` = Puente nativo (solo si híbrido)
- `config.js` = Configuración centralizada
- Módulos JS adicionales = Separación por dominio (Firebase, UI, etc.)

### 1.3 Tecnologías Core y Razones de Elección

| Tecnología | Uso | Justificación |
|-----------|-----|---------------|
| **HTML5 Canvas** | Rendering de juego | Performance nativa, control total del píxel |
| **CSS Grid/Flexbox** | Layout responsivo | Adaptación automática a cualquier pantalla |
| **JavaScript Vanilla** | Lógica del juego | Sin overhead, máxima portabilidad |
| **Firebase Auth** | Login social | Google Sign-In + Guest Mode out-of-the-box |
| **Cloud Firestore** | Base de datos | Real-time, escalable, sin servidor |
| **AdMob** | Monetización | Integración nativa Android, alta eCPM |
| **Gradle** | Build automation | Estándar de Android, flexible |
| **PowerShell** | Scripts de build | Automatización completa del pipeline |

**Anti-Patrón Detectado:**
```javascript
// ❌ EVITAR: Usar jQuery para manipulación DOM en juegos
$('#player').css('left', playerX + 'px');

// ✅ CORRECTO: Manipulación directa del Canvas
ctx.drawImage(playerSprite, playerX, playerY, playerWidth, playerHeight);
```

### 1.4 Patrón de Configuración Centralizada

**Archivo:** `js/config.js`

```javascript
/* ===================================
   GLOBAL CONFIGURATION
   ================================== */

// Firebase Configuration. Para futuros proyectos, crea datos ficticios para el test inicial y pide que se completen a la hora de crear el proyecto
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCUwlvMjqBljR68JlBYGzJwvttWg2AvEdM",
    authDomain: "neon-survivor-fdb4c.firebaseapp.com",
    projectId: "neon-survivor-fdb4c",
    storageBucket: "neon-survivor-fdb4c.appspot.com",
    messagingSenderId: "843900625599",
    appId: "1:843900625599:web:222c0618acc6c2112a1c0a",
    measurementId: "G-YVZY35ZYSW"
};

// Game Settings
const GAME_SETTINGS = {
    admobReady: false,
    lastBossWaveCompleted: 0,
    currentUser: null,
    maxLevelReached: 1,
    isGuestMode: false
};

// Z-Index Hierarchy (CRÍTICO para Canvas games)
const Z_INDEX = {
    CANVAS: 1,
    HUD: 1000,
    MOBILE_CONTROLS: 500,
    MENUS: 8000,
    MODALS: 9000,
    LOADING_SCREEN: 9500,
    CUSTOM_CURSOR: 10000
};

// Export to global scope
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.GAME_SETTINGS = GAME_SETTINGS;
window.Z_INDEX = Z_INDEX;
```

**Principio:** Toda configuración debe ser:
1. Centralizada en un solo archivo
2. Exportada al scope global (`window`)
3. Documentada con comentarios inline
4. Accesible desde cualquier módulo

---

## 🎯 PARTE II: PRINCIPIOS DE DISEÑO Y ARQUITECTURA

### 2.1 Mobile-First: La Regla de Oro del Responsive Design

**Declaración de Principio:**
> "Si no usas unidades relativas (vw/vh/clamp), estás cometiendo un error."

**Patrón Obligatorio:**
```css
/* ❌ PROHIBIDO: Valores fijos en píxeles */
.menu-button {
    width: 200px;
    height: 60px;
    font-size: 18px;
    padding: 10px 20px;
}

/* ✅ OBLIGATORIO: Valores responsivos con clamp() */
.menu-button {
    width: clamp(150px, 30vw, 250px);
    height: clamp(50px, 10vh, 80px);
    font-size: clamp(14px, 3vw, 20px);
    padding: clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px);
}
```

**Fórmula de clamp():**
```
clamp(mínimo_píxeles, valor_ideal_viewport, máximo_píxeles)

Ejemplo:
clamp(320px, 90vw, 500px)
      ↑       ↑       ↑
    Móvil  Ideal  Desktop
   pequeño      (tablet/PC)
```

**Test de Pantallas Obligatorio:**
- 360x640 (Android básico)
- 414x896 (iPhone estándar)
- 768x1024 (Tablet)

### 2.2 Z-Index: La Jerarquía Visual es Sagrada

**CRÍTICO:** El 90% de bugs de "elementos invisibles" vienen de z-index mal configurado.

**Jerarquía Establecida:**
```
Layer 1-10:       Canvas y rendering de juego
Layer 100-1000:   HUD y controles in-game
Layer 3000-5000:  Notificaciones y wave indicators
Layer 6000-7000:  Modales de juego (pause, upgrade)
Layer 8000-8999:  Pantallas de menú (main menu, settings)
Layer 9000-9999:  Modales de sistema (auth, avatares)
Layer 10000+:     Elementos siempre visibles (cursor custom)
```

**Regla de Implementación:**
```css
/* Canvas SIEMPRE debe tener z-index explícito */
#gameCanvas {
    position: absolute;
    z-index: 1; /* NUNCA auto, NUNCA omitir */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* Menús deben cubrir canvas cuando activos */
.start-menu {
    z-index: 8000; /* Nunca 10000+, causa conflictos */
}

/* Modales encima de menús */
.modal-overlay {
    z-index: 9000; /* Nunca 999999, imposible de mantener */
}
```

**Script de Verificación (ejecutar antes de cada build):**
```javascript
function verifyZIndexHierarchy() {
    const elements = {
        canvas: document.getElementById('gameCanvas'),
        hud: document.getElementById('gameHUD'),
        controls: document.getElementById('mobileControls'),
        menu: document.getElementById('startMenu'),
        modal: document.getElementById('userOptionsModal')
    };

    const zIndexes = {};
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            zIndexes[key] = parseInt(window.getComputedStyle(elements[key]).zIndex) || 0;
        }
    });

    console.log('=== Z-Index Hierarchy ===');
    Object.entries(zIndexes)
        .sort((a, b) => a[1] - b[1])
        .forEach(([name, z]) => console.log(`${name}: ${z}`));

    // Validaciones críticas
    if (zIndexes.canvas !== 1) console.error('⚠️ Canvas z-index debe ser 1');
    if (zIndexes.menu <= zIndexes.canvas) console.error('⚠️ Menu debe estar encima del canvas');
}

// Ejecutar en consola antes de compilar
verifyZIndexHierarchy();
```

### 2.3 Game Loop: La Arquitectura del Motor

**Patrón Establecido:**
```javascript
// ===================================
// GAME LOOP - Arquitectura Core
// ===================================

let lastTime = 0;
let deltaTime = 0;
const FPS_TARGET = 60;
const FRAME_TIME = 1000 / FPS_TARGET;

function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);

    // 1. Calcular deltaTime (tiempo transcurrido)
    deltaTime = currentTime - lastTime;
    lastTime = currentTime;

    // 2. Update (lógica del juego)
    if (gameState.isPlaying && !gameState.isPaused) {
        updatePlayer(deltaTime);
        updateEnemies(deltaTime);
        updateBullets(deltaTime);
        updateParticles(deltaTime);
        checkCollisions();
    }

    // 3. Render (dibuja en canvas)
    render();
}

// Iniciar loop
requestAnimationFrame(gameLoop);
```

**Separación de Update vs Render:**
```javascript
// ❌ ANTI-PATRÓN: Mezclar lógica y rendering
function updateEnemy(enemy) {
    enemy.x += enemy.speed;
    ctx.drawImage(enemySprite, enemy.x, enemy.y); // MAL
}

// ✅ CORRECTO: Separar responsabilidades
function updateEnemy(enemy, deltaTime) {
    // Solo lógica (física, IA, estado)
    enemy.x += enemy.speed * (deltaTime / 16.67);
    enemy.y += enemy.velocity.y * (deltaTime / 16.67);
}

function renderEnemy(enemy) {
    // Solo rendering (dibuja en canvas)
    ctx.drawImage(enemySprite, enemy.x, enemy.y, enemy.width, enemy.height);
}
```

### 2.4 Sistema de Estados: Gestión del Juego

**Estado Global Centralizado:**
```javascript
const gameState = {
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    isCountdown: false,
    wave: 1,
    score: 0,
    kills: 0,
    experience: 0,
    experienceThisWave: {
        BASIC: 0,
        FAST: 0,
        HEAVY: 0,
        SUPERHEAVY: 0,
        EXPLOSIVE: 0,
        BOSS: 0
    }
};
```

**Patrón de Transición de Estados:**
```javascript
// Función única de cambio de estado (evita inconsistencias)
function setGameState(newState) {
    const oldState = { ...gameState };
    Object.assign(gameState, newState);
    
    // Logging para debug
    console.log('🔄 State change:', oldState, '→', gameState);
    
    // Trigger side effects
    if (gameState.isPaused !== oldState.isPaused) {
        togglePauseUI(gameState.isPaused);
    }
}

// Uso:
setGameState({ isPaused: true, isPlaying: false });
```

### 2.5 Escalado de Viewport: Adaptación Dinámica

**CRÍTICO:** Todos los tamaños de objetos deben escalar con la pantalla.

```javascript
// ===================================
// VIEWPORT SCALING SYSTEM
// ===================================

const ViewportScale = {
    baseWidth: 1920,
    baseHeight: 1080,
    
    get scale() {
        return Math.min(
            canvas.width / this.baseWidth,
            canvas.height / this.baseHeight
        );
    },
    
    // Tamaños escalados dinámicamente
    get playerSize() { return canvas.width * 0.02; },
    get bulletSize() { return canvas.width * 0.008; },
    get enemySize() { return canvas.width * 0.025; }
};

// Uso en render:
function renderPlayer() {
    ctx.drawImage(
        playerSprite,
        player.x,
        player.y,
        ViewportScale.playerSize,
        ViewportScale.playerSize
    );
}
```

**Regla:** Nunca uses constantes fijas para tamaños. Siempre porcentaje del viewport.

---

## 💻 PARTE III: BUENAS PRÁCTICAS Y FILOSOFÍA DE DESARROLLO

### 3.1 Comentarios: Documentación como Código

**Patrón de Comentarios Seccionales:**
```javascript
// ===================================
// TÍTULO DE SECCIÓN PRINCIPAL
// ===================================

// Subsección: Descripción detallada
function functionName() {
    // Comentario inline para lógica compleja
    const result = complexCalculation();
    
    // ❌ EVITAR: Comentarios obvios
    // player.x += 1; // Incrementar x
    
    // ✅ CORRECTO: Comentarios explicativos
    // Normalizar velocidad según deltaTime para 60 FPS
    player.x += player.speed * (deltaTime / 16.67);
}
```

**Niveles de Comentarios:**
1. **Seccional (`===`)**: Divide archivo en bloques lógicos (AdMob, Firebase, Game Loop)
2. **Funcional**: Explica propósito de función compleja
3. **Inline**: Solo para lógica no obvia (cálculos matemáticos, hacks temporales)

### 3.2 Nomenclatura: Convenciones Estrictas

**Variables y Funciones:**
```javascript
// camelCase para variables y funciones
const playerHealth = 100;
function calculateDamage(enemy) { }

// UPPER_SNAKE_CASE para constantes verdaderas
const MAX_ENEMIES = 120;
const ENEMY_TYPES = { BASIC: {...}, FAST: {...} };

// PascalCase para constructores/clases
class EnemyFactory { }
const DeviceDetector = { };
```

**Nombres Descriptivos:**
```javascript
// ❌ EVITAR: Nombres crípticos
let x = 10;
function calc(a, b) { }

// ✅ CORRECTO: Nombres auto-documentados
let maxHealthUpgradeLevel = 10;
function calculateUpgradeCost(statName, currentLevel) { }
```

### 3.3 Modularización: Separación por Dominio

**Estructura de Módulos:**
```
js/
├── config.js           # Configuración global (Firebase, AdMob IDs)
├── firebase-handler.js # Todo lo relacionado con Firebase
├── ui-manager.js       # Gestión de UI (menús, modales)
└── game.js             # Motor de juego (física, rendering)
```

**Patrón de Exportación:**
```javascript
// config.js
const FIREBASE_CONFIG = { /* ... */ };
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
console.log('✅ Config loaded');

// firebase-handler.js
(function() {
    const auth = firebase.auth();
    const db = firebase.firestore();
    
    window.firebaseHandler = {
        signInWithGoogle: () => { /* ... */ },
        signOut: () => { /* ... */ },
        saveGameData: (data) => { /* ... */ }
    };
    
    console.log('✅ Firebase handler loaded');
})();
```

**Regla:** Cada módulo debe:
1. Tener una única responsabilidad (SRP)
2. Exportar interfaz pública a `window`
3. Loguear confirmación de carga
4. No depender de orden de carga (self-contained)

### 3.4 Performance: Optimización desde el Diseño

**Detección de Dispositivo:**
```javascript
const DeviceDetector = {
    isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    isTablet: /iPad|Android.*(?!Mobile)/i.test(navigator.userAgent),
    
    getQualitySettings() {
        if (this.isMobile && !this.isTablet) {
            return { maxParticles: 80, maxEnemies: 40, shadowBlur: 15 };
        } else if (this.isTablet) {
            return { maxParticles: 120, maxEnemies: 60, shadowBlur: 20 };
        } else {
            return { maxParticles: 250, maxEnemies: 120, shadowBlur: 30 };
        }
    }
};
```

**Object Pooling (Partículas):**
```javascript
// ❌ ANTI-PATRÓN: Crear/destruir objetos constantemente
function spawnParticle() {
    particles.push({ x: 0, y: 0, life: 1.0 });
}

// ✅ CORRECTO: Limitar cantidad y reutilizar
function spawnParticle() {
    if (particles.length >= qualitySettings.maxParticles) {
        particles.shift(); // Remover más viejo
    }
    particles.push({ x: 0, y: 0, life: 1.0 });
}
```

**Canvas Optimization:**
```javascript
// Configuración de canvas para máxima performance
const ctx = canvas.getContext('2d', {
    alpha: false,        // Sin transparencia = más rápido
    desynchronized: true // No esperar sincronización con pantalla
});

// Limitar pixel ratio para evitar over-rendering
canvas.width = window.innerWidth * Math.min(window.devicePixelRatio, 2);
canvas.height = window.innerHeight * Math.min(window.devicePixelRatio, 2);
```

### 3.5 Testing: Validación Multi-Dispositivo

**Checklist de Testing Obligatorio:**

**Funcionalidad Básica:**
- [ ] Canvas visible (ejecutar `verifyZIndexHierarchy()`)
- [ ] Controles táctiles responden
- [ ] Progresión de waves funciona
- [ ] Sistema de upgrades operativo
- [ ] Firebase auth (Google + Guest)
- [ ] Rankings se muestran correctamente

**Responsive Design:**
- [ ] 360x640 (Android básico): Todo encaja sin scroll
- [ ] 414x896 (iPhone estándar): Elementos legibles
- [ ] 768x1024 (Tablet): UI optimizada
- [ ] Fuentes escaladas (min 14px, usar clamp)
- [ ] Botones táctiles (min 44x44px)

**Performance:**
- [ ] 60 FPS en dispositivo mid-range
- [ ] Memoria < 200MB durante gameplay
- [ ] Sin memory leaks (profile con DevTools)
- [ ] Batería: consumo moderado durante juego

**Script de Test Automatizado:**
```javascript
// Ejecutar en consola para validación rápida
function runDeviceTests() {
    console.log('=== DEVICE TESTS ===');
    
    // Test 1: Canvas visibility
    const canvas = document.getElementById('gameCanvas');
    const canvasZ = parseInt(window.getComputedStyle(canvas).zIndex);
    console.log(canvasZ === 1 ? '✅' : '❌', 'Canvas z-index:', canvasZ);
    
    // Test 2: Responsive sizing
    const menu = document.getElementById('startMenu');
    const menuHeight = menu.offsetHeight;
    console.log(menuHeight <= window.innerHeight ? '✅' : '❌', 'Menu fits viewport:', menuHeight, '/', window.innerHeight);
    
    // Test 3: Touch controls
    const controls = document.getElementById('mobileControls');
    console.log(controls ? '✅' : '❌', 'Mobile controls present');
    
    // Test 4: Firebase connection
    console.log(typeof firebase !== 'undefined' ? '✅' : '❌', 'Firebase loaded');
}

runDeviceTests();
```

---

## 🤖 PARTE IV: COLABORACIÓN CON IA (GITHUB COPILOT)

### 4.1 Metodología de Trabajo con IA

**Filosofía:**
> "La IA es un senior developer que necesita contexto claro para generar código de calidad."

**Flujo de Trabajo:**
1. **Definir problema claramente** (comentario descriptivo)
2. **Proveer contexto** (mostrar código relacionado)
3. **Revisar sugerencia crítica** (nunca aceptar ciegamente)
4. **Iterar y refinar** (ajustar prompt si resultado incorrecto)

**Ejemplo de Prompt Efectivo:**
```javascript
// CONTEXTO: Tengo un sistema de upgrade con costos escalados
// PROBLEMA: Necesito función para calcular costo del siguiente nivel
// REQUISITO: Debe usar crecimiento exponencial (base 1.2) + componente cuadrático
// FORMATO: Retornar número entero redondeado hacia arriba

function calculateUpgradeCost(currentLevel) {
    // [Copilot genera aquí]
}
```

**Resultado Esperado:**
```javascript
function calculateUpgradeCost(currentLevel) {
    const baseCost = 10;
    const exponentialFactor = Math.pow(1.2, currentLevel);
    const quadraticFactor = Math.pow(currentLevel + 1, 2) * 2;
    return Math.ceil(baseCost * exponentialFactor + quadraticFactor);
}
```

### 4.2 Patrones de Comentarios para IA

**Comentarios de Contexto:**
```javascript
// ===================================
// ENEMY SPAWNING SYSTEM
// Context: Este sistema gestiona la aparición de enemigos según el wave actual
// Scaling: Cantidad y dificultad aumentan exponencialmente con el wave
// Types: 6 tipos de enemigos (BASIC, FAST, HEAVY, SUPERHEAVY, EXPLOSIVE, BOSS)
// Boss waves: Cada 5 waves (múltiplos de 5)
// ===================================

function spawnEnemiesForWave(waveNumber) {
    // Copilot tiene todo el contexto necesario para generar lógica correcta
}
```

**Comentarios de Restricciones:**
```javascript
// CONSTRAINT: Esta función DEBE usar ViewportScale.enemySize para tamaño
// CONSTRAINT: Posición inicial SIEMPRE fuera del canvas (spawn off-screen)
// CONSTRAINT: Velocidad escalada por wave (más rápido en waves altos)
function createEnemy(type, wave) {
    // [Código generado respetará restricciones]
}
```

### 4.3 Revisión de Código Generado por IA

**Checklist de Validación:**

**Corrección Funcional:**
- [ ] ¿El código hace lo que debe hacer?
- [ ] ¿Maneja casos edge (null, undefined, 0)?
- [ ] ¿Usa las variables correctas del scope?

**Adherencia a Patrones:**
- [ ] ¿Usa nomenclatura establecida (camelCase, UPPER_SNAKE_CASE)?
- [ ] ¿Respeta separación de responsabilidades?
- [ ] ¿Usa unidades responsivas (clamp/vw/vh) para UI?

**Performance:**
- [ ] ¿Evita operaciones costosas en el game loop?
- [ ] ¿Reutiliza objetos en lugar de crear nuevos?
- [ ] ¿Usa métodos eficientes (filter vs splice iterativo)?

**Ejemplo de Revisión:**
```javascript
// ❌ CÓDIGO GENERADO POR IA (PROBLEMÁTICO)
function updateEnemies() {
    enemies.forEach((enemy, index) => {
        enemy.x += 2; // Velocidad fija (no escala con deltaTime)
        ctx.drawImage(enemySprite, enemy.x, enemy.y, 50, 50); // Tamaño fijo (no responsivo)
        if (enemy.health <= 0) {
            enemies.splice(index, 1); // splice en forEach (bug)
        }
    });
}

// ✅ CÓDIGO CORREGIDO (TRAS REVISIÓN)
function updateEnemies(deltaTime) {
    // Filtrar enemigos muertos (correcto)
    enemies = enemies.filter(enemy => enemy.health > 0);
    
    // Actualizar posición (escalado con deltaTime)
    enemies.forEach(enemy => {
        enemy.x += enemy.speed * (deltaTime / 16.67);
    });
}

function renderEnemies() {
    // Renderizar separado de update (arquitectura correcta)
    enemies.forEach(enemy => {
        ctx.drawImage(
            enemySprite,
            enemy.x,
            enemy.y,
            ViewportScale.enemySize, // Tamaño responsivo
            ViewportScale.enemySize
        );
    });
}
```

### 4.4 Documentación Interna para IA

**Archivo: PROJECT_CONTEXT.md (CRÍTICO)**

Este archivo es la "memoria" del proyecto. Debe contener:

1. **Arquitectura del Proyecto**
   - Estructura de carpetas
   - Responsabilidad de cada archivo
   - Flujo de datos entre módulos

2. **Decisiones de Diseño**
   - Por qué se eligió Canvas sobre SVG
   - Por qué vanilla JS en lugar de framework
   - Por qué Firebase y no backend custom

3. **Problemas Resueltos y Soluciones**
   - Bug de z-index (canvas invisible)
   - Bug de responsive (elementos no escalaban)
   - Bug de touch events (joystick no respondía)

4. **Convenciones Establecidas**
   - Nomenclatura de variables
   - Estructura de comentarios
   - Patrón de z-index hierarchy

**Ejemplo de Sección:**
```markdown
## 🐛 Common Issues & Solutions

### Issue 1: Canvas Not Visible (Enemies/Player Invisible)
**Symptom:** Game loads, controls work, but no visual elements on canvas
**Cause:** Menu elements with high z-index blocking canvas (z-index: 1)
**Solution:**
```css
#gameCanvas {
    z-index: 1; /* MANDATORY - without this, canvas renders behind everything */
}
.start-menu {
    z-index: 8000; /* Was 10000 - reduced to logical layer */
}
```
**Lesson Learned:** Always verify z-index hierarchy before each build.
```

**Uso:** Cuando IA necesita generar código relacionado con UI, referencia PROJECT_CONTEXT.md para evitar repetir bugs pasados.

---

## 🚀 PARTE V: EXPORTABILIDAD Y ADAPTACIÓN

### 5.1 De HTML5 a Unity: Guía de Traducción

**Mapeo de Conceptos:**

| HTML5/Canvas | Unity | Notas |
|--------------|-------|-------|
| `canvas.getContext('2d')` | `SpriteRenderer` | Rendering 2D |
| `requestAnimationFrame` | `Update()` / `FixedUpdate()` | Game loop |
| `ctx.drawImage(sprite, x, y)` | `transform.position = new Vector2(x, y)` | Posicionamiento |
| `addEventListener('click')` | `OnMouseDown()` | Input handling |
| `localStorage` | `PlayerPrefs` | Persistencia local |
| Firebase Firestore | Unity Gaming Services / Playfab | Backend |
| CSS Grid/Flexbox | Canvas + Anchors | UI Layout |

**Ejemplo de Conversión (Enemy Update):**

**HTML5:**
```javascript
function updateEnemy(enemy, deltaTime) {
    enemy.x += enemy.velocity.x * (deltaTime / 16.67);
    enemy.y += enemy.velocity.y * (deltaTime / 16.67);
    
    // Colisión con player
    const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
    if (dist < enemy.size + player.size) {
        player.health -= enemy.damage;
    }
}
```

**Unity (C#):**
```csharp
void Update() {
    // Movement (Time.deltaTime reemplaza deltaTime / 16.67)
    transform.position += velocity * Time.deltaTime;
    
    // Collision con player
    float dist = Vector2.Distance(transform.position, player.transform.position);
    if (dist < (enemySize + playerSize)) {
        player.TakeDamage(damage);
    }
}
```

### 5.2 De HTML5 a Godot: Guía de Traducción

**Mapeo de Conceptos:**

| HTML5/Canvas | Godot | Notas |
|--------------|-------|-------|
| `canvas.getContext('2d')` | `Sprite2D` | Rendering 2D |
| `requestAnimationFrame` | `_process(delta)` | Game loop |
| `ctx.drawImage(sprite, x, y)` | `position = Vector2(x, y)` | Posicionamiento |
| `addEventListener('click')` | `_input(event)` | Input handling |
| `localStorage` | `ConfigFile` | Persistencia local |
| Firebase Firestore | Nakama / Custom backend | Backend |
| CSS Grid/Flexbox | Control nodes (VBox/HBox) | UI Layout |

**Ejemplo de Conversión (Player Movement):**

**HTML5:**
```javascript
function updatePlayer(deltaTime) {
    if (keys.w) player.y -= player.speed * (deltaTime / 16.67);
    if (keys.s) player.y += player.speed * (deltaTime / 16.67);
    if (keys.a) player.x -= player.speed * (deltaTime / 16.67);
    if (keys.d) player.x += player.speed * (deltaTime / 16.67);
}
```

**Godot (GDScript):**
```gdscript
func _process(delta):
    var velocity = Vector2.ZERO
    
    if Input.is_action_pressed("ui_up"):
        velocity.y -= 1
    if Input.is_action_pressed("ui_down"):
        velocity.y += 1
    if Input.is_action_pressed("ui_left"):
        velocity.x -= 1
    if Input.is_action_pressed("ui_right"):
        velocity.x += 1
    
    velocity = velocity.normalized()
    position += velocity * speed * delta
```

### 5.3 Multiplataforma: Estrategia de Portabilidad

**Principios de Código Portable:**

1. **Separar Lógica de Rendering**
   ```javascript
   // ✅ PORTABLE: Lógica pura
   function calculateDamage(attack, defense) {
       return Math.max(1, attack - defense * 0.5);
   }
   
   // ❌ NO PORTABLE: Mezclado con rendering
   function calculateDamage(attack, defense) {
       const damage = Math.max(1, attack - defense * 0.5);
       ctx.fillText('-' + damage, enemy.x, enemy.y); // Acoplado a Canvas
       return damage;
   }
   ```

2. **Abstraer Platform-Specific Code**
   ```javascript
   // Capa de abstracción para vibración
   const HapticFeedback = {
       vibrate(duration) {
           if (typeof Android !== 'undefined') {
               Android.vibrate(duration);
           } else if ('vibrate' in navigator) {
               navigator.vibrate(duration);
           } else {
               console.log('Vibration not supported');
           }
       }
   };
   ```

3. **Usar JSON para Data Structures**
   ```javascript
   // ✅ EXPORTABLE: JSON puro (portable a cualquier lenguaje)
   const ENEMY_TYPES = {
       "BASIC": {
           "sizeMultiplier": 1,
           "speedMultiplier": 1,
           "healthMultiplier": 1,
           "spawnChance": 0.50
       }
   };
   
   // Unity C#:
   // var enemyTypes = JsonUtility.FromJson<EnemyTypes>(jsonString);
   
   // Godot GDScript:
   // var enemy_types = JSON.parse(json_string)
   ```

### 5.4 Template Base: Proyecto Nuevo Desde Cero

**Estructura Inicial Recomendada:**

```
nuevo-proyecto/
├── src/
│   ├── index.html          # Entry point
│   ├── main.js             # Game loop + initialization
│   ├── config.js           # Configuración global
│   ├── systems/            # Sistemas del juego
│   │   ├── input.js        # Input handling
│   │   ├── physics.js      # Física y colisiones
│   │   ├── renderer.js     # Rendering
│   │   └── audio.js        # Audio manager
│   ├── entities/           # Entidades del juego
│   │   ├── player.js
│   │   ├── enemy.js
│   │   └── bullet.js
│   ├── ui/                 # UI components
│   │   ├── menu.js
│   │   ├── hud.js
│   │   └── modal.js
│   └── assets/             # Recursos
│       ├── sprites/
│       ├── sounds/
│       └── fonts/
├── PROJECT_CONTEXT.md      # Documentación técnica
├── MANIFEST.md             # Este documento
└── README.md               # Documentación pública
```

**Template de main.js:**
```javascript
/* ===================================
   NUEVO PROYECTO - MAIN ENTRY POINT
   ================================== */

// Import configuración
import { GAME_CONFIG } from './config.js';
import { InputSystem } from './systems/input.js';
import { PhysicsSystem } from './systems/physics.js';
import { Renderer } from './systems/renderer.js';

// State management
const gameState = {
    isPlaying: false,
    isPaused: false,
    score: 0
};

// Canvas setup
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

// Systems initialization
const input = new InputSystem();
const physics = new PhysicsSystem();
const renderer = new Renderer(ctx);

// Game loop
let lastTime = 0;
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (gameState.isPlaying && !gameState.isPaused) {
        input.update();
        physics.update(deltaTime);
    }
    
    renderer.render();
}

// Start
window.addEventListener('load', () => {
    console.log('🎮 Game initialized');
    requestAnimationFrame(gameLoop);
});
```

---

## 📚 PARTE VI: PLANTILLA BASE DE COMPORTAMIENTO DEL MODELO

### 6.1 Prompt de Inicialización para IA

**Copiar y pegar al inicio de cada sesión:**

```
Eres un programador profesional de videojuegos especializado en desarrollo mobile-first con HTML5/JavaScript y arquitecturas híbridas Android.

STACK TECNOLÓGICO:
- Frontend: HTML5 Canvas, CSS3 (Grid/Flexbox), JavaScript Vanilla (ES6+)
- Backend: Firebase (Auth, Firestore)
- Build: Gradle, PowerShell automation
- Plataforma: Android WebView híbrido

PRINCIPIOS OBLIGATORIOS:
1. Mobile-First: Todo tamaño debe usar clamp(min, ideal_vw/vh, max)
2. Z-Index Hierarchy: Canvas z-index: 1, UI 500-1000, Menus 8000-8999, Modals 9000+
3. Separation of Concerns: Update separado de Render
4. Performance: Object pooling, limit particles, optimize canvas
5. Responsive: Test 360x640, 414x896, 768x1024

CONVENCIONES DE CÓDIGO:
- Variables/funciones: camelCase
- Constantes: UPPER_SNAKE_CASE
- Comentarios seccionales: // ===================================
- Export global: window.moduleName = { }
- Validación: Ejecutar verifyZIndexHierarchy() antes de cada build

ARQUITECTURA:
- index.html: UI completa (HTML + CSS inline + Firebase integration)
- game.js: Motor de juego puro (game loop, physics, rendering)
- config.js: Configuración centralizada (Firebase, AdMob, Z-Index hierarchy)
- modules/: Separación por dominio (firebase-handler.js, ui-manager.js)

FLUJO DE TRABAJO:
1. Leer PROJECT_CONTEXT.md para contexto del proyecto
2. Escribir comentarios descriptivos antes de código
3. Usar ViewportScale para tamaños dinámicos
4. Separar update() y render()
5. Validar z-index y responsive design
6. Documentar decisiones en PROJECT_CONTEXT.md

ANTI-PATRONES A EVITAR:
- ❌ Usar píxeles fijos (width: 200px)
- ❌ Mezclar lógica y rendering
- ❌ Z-index extremos (999999)
- ❌ Dependencias de frameworks pesados
- ❌ Omitir z-index en canvas

CUANDO GENERES CÓDIGO:
1. Pregunta si necesitas más contexto
2. Genera código siguiendo convenciones establecidas
3. Incluye comentarios explicativos
4. Valida que sea responsive (usa clamp)
5. Verifica z-index si tocas UI

¿Entendido? Responde "Listo para desarrollar" si estás preparado.
```

### 6.2 Prompts Específicos por Tarea

**Para Crear un Nuevo Sistema:**
```
TAREA: Crear sistema de [nombre del sistema]
CONTEXTO: [Explicar propósito y cómo se integra]
REQUISITOS:
- Debe exportarse a window.[nombre]
- Debe seguir separación update/render
- Debe usar ViewportScale para tamaños
- Debe incluir comentarios seccionales

EJEMPLO DE ESTRUCTURA:
// ===================================
// [NOMBRE DEL SISTEMA]
// ===================================

const [NombreSistema] = {
    init() { },
    update(deltaTime) { },
    render() { }
};

window.[NombreSistema] = [NombreSistema];
```

**Para Debuggear Z-Index:**
```
PROBLEMA: [Describir problema visual]
SOSPECHA: Conflicto de z-index

ACCIONES:
1. Genera script de verificación de z-index
2. Lista todos los elementos con z-index en el área problemática
3. Sugiere nueva jerarquía siguiendo:
   - Canvas: 1
   - HUD: 1000
   - Menus: 8000-8999
   - Modals: 9000+
4. Genera CSS corregido
```

**Para Hacer Responsive:**
```
PROBLEMA: Elemento no se adapta a diferentes pantallas
ELEMENTO: [ID o clase del elemento]

ACCIONES:
1. Analiza CSS actual
2. Identifica valores fijos (px)
3. Convierte a clamp(min, vw/vh, max)
4. Test en 360x640, 414x896, 768x1024
5. Genera CSS corregido
```

### 6.3 Checklist de Entrega de Código

**Antes de considerar una tarea completada:**

**Funcionalidad:**
- [ ] El código hace lo que se pidió
- [ ] Maneja casos edge (null, undefined, 0)
- [ ] No hay errores en consola

**Arquitectura:**
- [ ] Sigue separación de responsabilidades
- [ ] Se integra correctamente con sistema existente
- [ ] Usa módulos establecidos (no duplica lógica)

**Convenciones:**
- [ ] Nomenclatura correcta (camelCase, UPPER_SNAKE_CASE)
- [ ] Comentarios seccionales presentes
- [ ] Exportación a window si es módulo

**Responsive:**
- [ ] Usa clamp() para tamaños
- [ ] No hay valores fijos en píxeles
- [ ] Testeado en 3 tamaños de pantalla

**Performance:**
- [ ] No hay operaciones costosas en game loop
- [ ] Usa object pooling si aplica
- [ ] Limita cantidad de objetos (partículas, enemigos)

**Documentación:**
- [ ] Comentarios explicativos en lógica compleja
- [ ] Actualizado PROJECT_CONTEXT.md si es cambio mayor
- [ ] Agregada entrada en "Common Issues" si resuelve bug

---

## 🎓 PARTE VII: LECCIONES APRENDIDAS Y FILOSOFÍA

### 7.1 Los 10 Mandamientos del Desarrollo de Videojuegos

1. **Mobile-First es Obligatorio**
   > "Si funciona en 360x640, funcionará en cualquier pantalla."

2. **Z-Index es Sagrado**
   > "Canvas debe ser 1. Menús 8000-8999. Modals 9000+. Sin excepciones."

3. **Separar Update de Render**
   > "La lógica del juego no debe saber cómo se dibuja."

4. **Todo Tamaño es Relativo**
   > "clamp(min, vw/vh, max) es tu mejor amigo."

5. **Performance desde el Diseño**
   > "No optimices después. Diseña eficiente desde el inicio."

6. **La Documentación es Código**
   > "PROJECT_CONTEXT.md es tan importante como game.js."

7. **Test en Dispositivo Real**
   > "El emulador miente. Solo el dispositivo dice la verdad."

8. **La IA es tu Co-Piloto, no tu Piloto**
   > "Revisa crítica cada línea generada por IA."

9. **Vanilla es Poder**
   > "Menos dependencias = más control = mejor performance."

10. **El Usuario es Móvil**
    > "Diseña para dedos, no para mouse. Touch-first siempre."

### 7.2 Errores Comunes y Cómo Evitarlos

**Error #1: "Mi juego no se ve en el dispositivo"**
- **Causa:** Z-index del canvas mal configurado
- **Solución:** `#gameCanvas { z-index: 1; }` siempre explícito
- **Prevención:** Ejecutar `verifyZIndexHierarchy()` antes de build

**Error #2: "Los controles son muy pequeños/grandes"**
- **Causa:** Tamaños fijos en píxeles
- **Solución:** Usar `clamp(min, porcentaje, max)`
- **Prevención:** Nunca usar `px` para UI móvil

**Error #3: "El juego va lento en móviles"**
- **Causa:** Demasiados objetos/partículas
- **Solución:** Limitar según `DeviceDetector.getQualitySettings()`
- **Prevención:** Diseñar con límites desde el inicio

**Error #4: "Los menús no caben en pantalla"**
- **Causa:** Alturas fijas, no uso de viewport height
- **Solución:** `height: clamp(500px, 75vh, 700px)`
- **Prevención:** Diseñar verticalmente, paginar contenido

**Error #5: "Firebase no guarda datos"**
- **Causa:** Reglas de seguridad mal configuradas
- **Solución:** Configurar Firestore Rules correctamente
- **Prevención:** Testear auth antes de integrar saves

### 7.3 Filosofía de Desarrollo: "El Código es Conversación"

**Con el Usuario:**
- Cada frame es una promesa de fluidez (60 FPS)
- Cada botón es una invitación a interactuar (feedback visual/haptic)
- Cada pantalla es una experiencia (diseño responsive)

**Con el Equipo:**
- Comentarios claros = menos preguntas
- Nombres descriptivos = autodocumentación
- Arquitectura limpia = fácil onboarding

**Con la IA:**
- Contexto detallado = código de calidad
- Restricciones explícitas = menos iteraciones
- Revisión crítica = aprendizaje mutuo

**Con el Futuro Yo:**
- PROJECT_CONTEXT.md = memoria del proyecto
- Decisiones documentadas = evitar repetir errores
- Código limpio = mantenimiento sin dolor

---

## 🚀 PARTE VIII: GUÍA DE IMPLEMENTACIÓN RÁPIDA

### 8.1 Checklist: Nuevo Proyecto Desde Cero (4 Horas)

**Hora 1: Setup y Arquitectura**
- [ ] Crear estructura de carpetas (src/, assets/, systems/, entities/)
- [ ] Configurar canvas y game loop básico
- [ ] Implementar input system (teclado/touch)
- [ ] Setup viewport scaling system

**Hora 2: Gameplay Core**
- [ ] Crear player entity (movement + render)
- [ ] Crear enemy entity (spawn + AI básica)
- [ ] Implementar collision detection
- [ ] Sistema de puntuación básico

**Hora 3: UI y Polish**
- [ ] HUD (score, health)
- [ ] Menú principal (start button)
- [ ] Game over screen
- [ ] Responsive design (clamp todas las medidas)

**Hora 4: Testing y Deploy**
- [ ] Test en 3 tamaños de pantalla
- [ ] Verificar z-index hierarchy
- [ ] Performance profiling
- [ ] Build APK (si Android)

### 8.2 Snippet Library: Código Reutilizable

**Game Loop Base:**
```javascript
let lastTime = 0;
function gameLoop(currentTime) {
    requestAnimationFrame(gameLoop);
    const deltaTime = currentTime - lastTime;
    lastTime = currentTime;
    
    if (gameState.isPlaying && !gameState.isPaused) {
        updateGame(deltaTime);
    }
    renderGame();
}
requestAnimationFrame(gameLoop);
```

**Viewport Scaling:**
```javascript
const ViewportScale = {
    baseWidth: 1920,
    baseHeight: 1080,
    get scale() {
        return Math.min(
            canvas.width / this.baseWidth,
            canvas.height / this.baseHeight
        );
    },
    scaleValue(value) { return value * this.scale; }
};
```

**Collision Detection (Circle):**
```javascript
function checkCollision(entity1, entity2) {
    const dx = entity1.x - entity2.x;
    const dy = entity1.y - entity2.y;
    const distance = Math.sqrt(dx * dx + dy * dy);
    return distance < (entity1.radius + entity2.radius);
}
```

**Device Detection:**
```javascript
const DeviceDetector = {
    isMobile: /Android|iPhone|iPad|iPod/i.test(navigator.userAgent),
    isTablet: /iPad|Android.*(?!Mobile)/i.test(navigator.userAgent),
    isTouch: 'ontouchstart' in window,
    
    getQualitySettings() {
        if (this.isMobile && !this.isTablet) {
            return { maxParticles: 80, maxEnemies: 40 };
        }
        return { maxParticles: 250, maxEnemies: 120 };
    }
};
```

**Responsive Button (CSS):**
```css
.game-button {
    width: clamp(150px, 30vw, 250px);
    height: clamp(50px, 10vh, 80px);
    font-size: clamp(14px, 3vw, 20px);
    padding: clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px);
    border: 2px solid #00ffff;
    background: linear-gradient(135deg, rgba(0,255,255,0.1), rgba(255,0,255,0.1));
    color: #00ffff;
    cursor: pointer;
    transition: all 0.3s ease;
}

.game-button:hover {
    background: linear-gradient(135deg, rgba(0,255,255,0.2), rgba(255,0,255,0.2));
    box-shadow: 0 0 20px rgba(0,255,255,0.5);
}
```

**Z-Index Verification:**
```javascript
function verifyZIndexHierarchy() {
    const elements = {
        canvas: document.getElementById('gameCanvas'),
        hud: document.getElementById('gameHUD'),
        menu: document.getElementById('startMenu')
    };
    
    Object.entries(elements).forEach(([name, el]) => {
        if (el) {
            const z = window.getComputedStyle(el).zIndex;
            console.log(`${name}: ${z}`);
        }
    });
}
```

### 8.3 Troubleshooting: Guía Rápida

| Síntoma | Causa Probable | Solución |
|---------|----------------|----------|
| Canvas no visible | Z-index incorrecto | Canvas z-index: 1, verificar hierarchy |
| Controles no responden | pointer-events: none mal aplicado | Base: all, Stick: none |
| UI no escala | Valores fijos en px | Convertir todo a clamp() |
| Lag en móvil | Demasiados objetos | Limitar por DeviceDetector |
| Firebase no guarda | Rules no configuradas | Configurar Firestore Security Rules |
| Botones muy pequeños | Sin min en clamp() | clamp(44px, 8vw, 80px) mínimo |

---

## 📖 CONCLUSIÓN Y LLAMADO A LA ACCIÓN

Este manifiesto es el resultado de analizar más de 10,000 líneas de código profesional de Neon Survivor Arena. No es teoría, es práctica validada en producción.

**Para Desarrolladores:**
- Usa este documento como checklist en cada proyecto
- Adapta los patrones a tu stack (Unity, Godot, Unreal)
- Comparte y mejora este manifiesto (contribuye con tus aprendizajes)

**Para Modelos de IA:**
- Este es tu "manual de programador senior"
- Referencia este documento cuando generes código de juegos
- Valida tu output contra estos principios antes de entregarlo

**Para Equipos:**
- Establezcan este estándar como baseline
- Documenten sus propios aprendizajes en PROJECT_CONTEXT.md
- Revisen código contra este manifiesto en code reviews

---

## 📚 RECURSOS Y REFERENCIAS

**Documentación Oficial:**
- [MDN Web Docs - Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [Firebase Documentation](https://firebase.google.com/docs)
- [CSS clamp() Function](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [Android WebView Guide](https://developer.android.com/develop/ui/views/layout/webapps/webview)

**Herramientas Esenciales:**
- **Chrome DevTools:** Profiling, responsive mode, console debugging
- **Android Studio:** Build APK, device emulator, logcat
- **VS Code + Extensions:** Live Server, ESLint, GitLens
- **Firebase Console:** Firestore, Auth, Hosting management

**Proyecto de Referencia:**
- **Neon Survivor Arena:** [Incluir link si es público]
- **PROJECT_CONTEXT.md:** Documento técnico completo del proyecto

---

## 📄 LICENCIA Y ATRIBUCIÓN

**Autor Original:** Luis Castellano Guzmán  
**Proyecto Base:** Neon Survivor Arena  
**Versión del Manifiesto:** 1.0  
**Fecha de Creación:** Noviembre 2025  

**Licencia:** Creative Commons Attribution 4.0 International (CC BY 4.0)

Eres libre de:
- **Compartir:** Copiar y redistribuir este documento
- **Adaptar:** Remezclar, transformar y construir sobre este material

Bajo los siguientes términos:
- **Atribución:** Debes dar crédito apropiado al autor original

---

## 🎯 VERSIÓN Y CHANGELOG

**v1.0 (Noviembre 2025):**
- ✅ Primera versión completa del manifiesto
- ✅ Basado en análisis de Neon Survivor Arena (10,000+ líneas)
- ✅ Incluye patrones, anti-patrones y filosofía de desarrollo
- ✅ Guías de traducción a Unity y Godot
- ✅ Prompt base para inicialización de IA
- ✅ Snippet library y troubleshooting guide

**Próximas Versiones Planeadas:**
- v1.1: Guía de testing automatizado (Jest, Cypress)
- v1.2: Patrones de multiplayer (WebSockets, Firebase Realtime)
- v1.3: Monetización avanzada (IAP, Subscriptions)

---

## 🙏 AGRADECIMIENTOS

A GitHub Copilot, por ser el co-piloto que transformó la forma de desarrollar videojuegos.

A la comunidad de desarrollo de juegos, por compartir conocimiento y elevar el estándar de la industria.

A todos los que usen este manifiesto para crear experiencias increíbles.

---

**FIN DEL MANIFIESTO**

*"El mejor código es el que otros pueden entender, mantener y mejorar."*

---

## 🔖 ÍNDICE RÁPIDO

1. [Resumen Ejecutivo](#-resumen-ejecutivo)
2. [Arquitectura y Stack](#️-parte-i-arquitectura-y-stack-técnico)
3. [Principios de Diseño](#-parte-ii-principios-de-diseño-y-arquitectura)
4. [Buenas Prácticas](#-parte-iii-buenas-prácticas-y-filosofía-de-desarrollo)
5. [Colaboración con IA](#-parte-iv-colaboración-con-ia-github-copilot)
6. [Exportabilidad](#-parte-v-exportabilidad-y-adaptación)
7. [Plantilla de Comportamiento](#-parte-vi-plantilla-base-de-comportamiento-del-modelo)
8. [Filosofía y Lecciones](#-parte-vii-lecciones-aprendidas-y-filosofía)
9. [Implementación Rápida](#-parte-viii-guía-de-implementación-rápida)

---

**Versión del Documento:** 1.0  
**Última Actualización:** Noviembre 2025  
**Mantenido por:** Luis Castellano Guzmán  
**Contacto:** [Agregar si aplica]

*Este documento es un trabajo vivo. Si encuentras mejoras, errores o tienes sugerencias, contribuye al proyecto.*
