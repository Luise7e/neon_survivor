# 🎮 Neon Survivor Arena - Estructura Modular

## 📁 Nueva Arquitectura del Proyecto

```
android/app/src/main/assets/
├── index.html                    # Archivo HTML único (Single Page App)
├── manifest.json                 # PWA configuration
│
├── css/                          # 🎨 Estilos modulares
│   ├── global.css               # Estilos globales, reset, cursor, botones base
│   ├── mobile-controls.css      # Joysticks, botones de acción, controles táctiles
│   ├── game-ui.css              # HUD, health bar, loading screen
│   ├── start-menu.css           # (Pendiente) Menú de inicio, login, perfil
│   ├── level-selector.css       # (Pendiente) Selector de niveles
│   ├── stats.css                # (Pendiente) Página de estadísticas
│   ├── settings.css             # (Pendiente) Menú de configuración
│   └── modals.css               # (Pendiente) Modales (pausa, game over, upgrades)
│
├── js/                           # 📜 JavaScript modular
│   ├── config.js                # Configuración global (Firebase, Avatar, Z-Index)
│   ├── ui-manager.js            # Sistema de navegación entre pantallas
│   ├── firebase-handler.js      # Autenticación y Firestore
│   ├── level-selector.js        # (Pendiente) Lógica del selector de niveles
│   ├── stats-manager.js         # (Pendiente) Gestión de estadísticas
│   ├── settings-manager.js      # (Pendiente) Gestión de configuración
│   ├── avatar-system.js         # (Pendiente) Sistema de avatares
│   └── admob-handler.js         # (Pendiente) Integración con AdMob
│
├── game.js                       # Motor del juego (canvas, física, enemies, player)
│
└── assets/                       # 🖼️ Recursos multimedia
    ├── settings-icons/
    │   └── charsets/
    └── (sprites, images, fonts...)
```

---

## 🚀 Ventajas de la Modularización

### ✅ **Código Organizado**
- Cada archivo tiene una **responsabilidad única**
- Fácil ubicar y modificar funcionalidades específicas
- Reduce la complejidad del mantenimiento

### ✅ **Debugging Simplificado**
- Errores localizados por archivo
- Logs organizados por módulo
- Stack traces más claros

### ✅ **Colaboración Eficiente**
- Múltiples desarrolladores pueden trabajar simultáneamente
- Menos conflictos de merge en Git
- Code reviews más focalizados

### ✅ **Rendimiento Optimizado**
- CSS dividido por secciones (carga más rápida)
- JavaScript modular (mejor cache del navegador)
- Single Page App (sin recargas entre pantallas)

### ✅ **Estado Persistente**
- Variables globales mantienen estado del juego
- Canvas único sin destrucción/reconstrucción
- Sesión de Firebase permanece activa

---

## 🎯 Sistema de Navegación

### **UIManager.js**

Centraliza toda la navegación entre pantallas:

```javascript
// Mostrar menú de inicio
UIManager.showStartMenu();

// Mostrar selector de niveles
UIManager.showLevelSelector();

// Mostrar estadísticas
UIManager.showStats();

// Mostrar configuración
UIManager.showSettings();

// Mostrar modal
UIManager.showModal('pauseModal');

// Ocultar modal
UIManager.hideModal('pauseModal');
```

### **Clases de Pantallas en HTML**

Todas las secciones principales tienen la clase `.screen`:

```html
<div id="startMenu" class="screen">...</div>
<div id="levelSelector" class="screen hidden">...</div>
<div id="statsPage" class="screen hidden">...</div>
<div id="settingsMenu" class="screen hidden">...</div>
```

El `UIManager` simplemente:
1. Oculta todas con `.hidden`
2. Muestra la solicitada removiendo `.hidden`

---

## 🔧 Configuración Global

### **config.js**

Todas las configuraciones centralizadas:

```javascript
// Firebase
FIREBASE_CONFIG = { apiKey, authDomain, projectId, ... }

// Avatar System
AVATAR_CONFIG = { charsets, tileSize }

// Game Settings
GAME_SETTINGS = {
    currentUser,
    maxLevelReached,
    isGuestMode,
    admobReady
}

// Z-Index Hierarchy
Z_INDEX = {
    CANVAS: 1,
    HUD: 1000,
    MOBILE_CONTROLS: 500,
    MENUS: 8000,
    MODALS: 9000,
    LOADING_SCREEN: 9500,
    CUSTOM_CURSOR: 10000
}
```

---

## 🔐 Firebase Handler

### **firebase-handler.js**

Maneja toda la lógica de autenticación y base de datos:

```javascript
// Inicializar Firebase
firebaseHandler.init();

// Sign in con Google
firebaseHandler.signInWithGoogle();

// Sign in como invitado
firebaseHandler.signInAsGuest();

// Sign out
firebaseHandler.signOut();

// Guardar estadísticas
firebaseHandler.saveGameStats({ kills: 50 });

// Actualizar nivel máximo
firebaseHandler.updateMaxLevel(5);
```

---

## 📋 Próximos Pasos (Pendientes)

### 1. **Extraer CSS Restante**
- [ ] `start-menu.css` - Menú de inicio completo
- [ ] `level-selector.css` - Selector de niveles
- [ ] `stats.css` - Página de estadísticas
- [ ] `settings.css` - Menú de configuración
- [ ] `modals.css` - Todos los modales (pausa, game over, upgrades)

### 2. **Crear Módulos JavaScript Adicionales**
- [ ] `level-selector.js` - Lógica del selector
- [ ] `stats-manager.js` - Cálculo y visualización de stats
- [ ] `settings-manager.js` - Configuración de calidad, audio, controles
- [ ] `avatar-system.js` - Sistema de selección de avatares
- [ ] `admob-handler.js` - Integración con AdMob nativo

### 3. **Refactorizar game.js**
- [ ] Separar en módulos más pequeños:
  - `player.js` - Lógica del jugador
  - `enemies.js` - Sistema de enemigos
  - `weapons.js` - Sistema de armas y disparos
  - `physics.js` - Motor de física y colisiones
  - `particles.js` - Sistema de partículas
  - `abilities.js` - Sistema de habilidades

---

## 🛠️ Cómo Agregar un Nuevo Módulo

### 1. **Crear el archivo CSS/JS**
```bash
# CSS
touch css/nuevo-componente.css

# JavaScript
touch js/nuevo-modulo.js
```

### 2. **Agregar referencia en index.html**
```html
<!-- En <head> para CSS -->
<link rel="stylesheet" href="css/nuevo-componente.css">

<!-- Antes de </body> para JavaScript -->
<script src="js/nuevo-modulo.js"></script>
```

### 3. **Seguir convenciones**
```javascript
// Estructura de módulo JS
class NuevoModulo {
    constructor() {
        // Inicialización
    }

    metodo() {
        // Lógica
    }
}

// Hacer globalmente accesible
window.nuevoModulo = new NuevoModulo();

console.log('✅ NuevoModulo loaded');
```

---

## 🎨 Convenciones de Código

### **CSS**
- Usar BEM naming: `.block__element--modifier`
- Agrupar por componente, no por propiedad
- Comentar secciones con `/* === TITULO === */`
- Usar `clamp()` para responsive design

### **JavaScript**
- Clases con PascalCase: `FirebaseHandler`
- Métodos con camelCase: `showStartMenu()`
- Constantes con UPPER_SNAKE_CASE: `FIREBASE_CONFIG`
- Siempre documentar con JSDoc:
```javascript
/**
 * Description of function
 * @param {string} param - Description
 * @returns {boolean} - Description
 */
```

### **Logs de Consola**
- ✅ Éxito: `console.log('✅ Action completed')`
- ❌ Error: `console.error('❌ Error description')`
- ⚠️ Warning: `console.warn('⚠️ Warning message')`
- 📱 Info: `console.log('📱 Information')`

---

## 🐛 Debugging

### **Ver todos los módulos cargados**
```javascript
// En consola del navegador
console.log('Config:', window.FIREBASE_CONFIG);
console.log('UI Manager:', window.UIManager);
console.log('Firebase Handler:', window.firebaseHandler);
```

### **Verificar orden de carga**
Revisar consola al cargar la página:
```
✅ Config loaded
✅ UI Manager loaded
✅ Firebase Handler loaded
✅ Firebase initialized
✅ All modules loaded successfully
```

---

## 📊 Estado Actual

### **Completado** ✅
- Estructura de carpetas CSS y JS
- `global.css` - Estilos base
- `mobile-controls.css` - Controles móviles
- `game-ui.css` - HUD y loading screen
- `config.js` - Configuración global
- `ui-manager.js` - Sistema de navegación
- `firebase-handler.js` - Autenticación y Firestore
- Integración en `index.html`
- Compilación y firma exitosa
- **Version: v5.0.0 MODULAR**

### **En Progreso** 🔄
- Extracción de CSS restante del index.html
- Creación de módulos JavaScript adicionales
- Refactorización de game.js

### **Pendiente** ⏳
- Testing exhaustivo de todos los módulos
- Optimización de carga de recursos
- Documentación de cada módulo
- Implementación de lazy loading

---

## 🚦 Testing

### **Probar navegación**
```javascript
// En consola del navegador
UIManager.showStartMenu();      // Debe mostrar menú de inicio
UIManager.showLevelSelector();  // Debe mostrar selector de niveles
UIManager.showStats();          // Debe mostrar estadísticas
```

### **Probar Firebase**
```javascript
// Sign in
firebaseHandler.signInAsGuest();

// Verificar estado
console.log(firebaseHandler.isGuestMode);  // true
console.log(firebaseHandler.maxLevelReached);  // 1
```

---

## 📚 Referencias

- [Firebase Web SDK](https://firebase.google.com/docs/web/setup)
- [Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [CSS BEM Methodology](http://getbem.com/)
- [JavaScript Modules](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Modules)

---

**Fecha de creación:** 31 de Octubre, 2025
**Versión actual:** v5.0.0 MODULAR
**Última actualización:** Estructura base implementada
