# 🎮 PLAN DE MIGRACIÓN A MECÁNICAS ESTILO BRAWL STARS

## 📊 ANÁLISIS DE MECÁNICAS DE BRAWL STARS

### 1. Sistema de Controles
**Joysticks Dinámicos Invisibles:**
- **Mitad Izquierda de Pantalla**: Movimiento
  - El joystick aparece donde el jugador toca
  - Permanece visible mientras el dedo está presionado
  - Desaparece al soltar
  - Radio de acción limitado desde el punto de toque inicial

- **Mitad Derecha de Pantalla**: Disparo
  - Similar al de movimiento, aparece al tocar
  - Dirección de disparo según la dirección del joystick
  - **Auto-aim**: Tap rápido dispara al enemigo más cercano
  - **Manual aim**: Mantener y arrastrar para apuntar manualmente
  - Indicador visual de dirección y rango

### 2. Sistema de Munición
**Balas Limitadas con Recarga:**
- **3 balas por defecto** (varía según personaje)
- **Recarga automática**: ~1 segundo por bala
- **Recarga completa**: ~3 segundos desde vacío
- **UI de munición**: Barras circulares debajo del personaje
- **Limitación táctica**: No disparo infinito, gestión de recursos

### 3. Sistema de Disparo
**Tipos de Ataque:**
- **Ataque Principal**:
  - Consume 1 bala
  - Diferentes patrones: proyectil único, ráfaga, cono, láser
  - Daño y rango varía por personaje
  - Velocidad de proyectil varía

- **Super/Ultimate**:
  - Se carga causando daño
  - Barra de carga visible
  - Efecto especial poderoso
  - Puede cambiar el curso de la batalla

### 4. Feedback Visual
**Indicadores en Pantalla:**
- **Rango de ataque**: Círculo semi-transparente
- **Dirección de disparo**: Flecha o línea indicadora
- **Área de efecto**: Para habilidades AoE
- **Números de daño**: Flotantes sobre enemigos
- **Hit markers**: Feedback visual de impacto
- **Shake de pantalla**: En eventos importantes

### 5. Sistema de Apuntado
**Auto-aim vs Manual:**
- **Auto-aim** (tap rápido):
  - Automático al enemigo más cercano
  - Ideal para combate rápido
  - Menor precisión en grupos

- **Manual aim** (drag):
  - Control total de dirección
  - Permite lead shots (anticipar movimiento)
  - Mejor para enemigos a distancia
  - Requiere más habilidad

---

## 🚀 PLAN DE IMPLEMENTACIÓN POR FASES

### ✅ **FASE 0: Preparación y Limpieza**
**Duración Estimada**: 30 minutos
**Tareas**:
- [ ] Documentar el sistema actual de controles
- [ ] Identificar código a refactorizar
- [ ] Crear backup del sistema actual
- [ ] Preparar estructura para nuevos archivos

---

### 🎯 **FASE 1: Joysticks Dinámicos Invisibles**
**Duración Estimada**: 2-3 horas

#### 1.1 Diseño del Sistema
```javascript
// Estructura de datos para joystick dinámico
DynamicJoystick {
    isActive: boolean,          // Si está visible/activo
    startX, startY: number,     // Punto inicial de toque
    currentX, currentY: number, // Posición actual del dedo
    maxRadius: number,          // Radio máximo del joystick
    side: 'left' | 'right',     // Lado de la pantalla
    angle: number,              // Ángulo de dirección
    strength: number            // Fuerza (0-1)
}
```

#### 1.2 Detección de Zonas
- División de pantalla en dos mitades verticales
- Detección de toque inicial
- Spawning del joystick visual en el punto de toque
- Tracking del movimiento del dedo

#### 1.3 Renderizado Visual
- Círculo base semi-transparente
- Círculo stick que sigue al dedo
- Animaciones de aparición/desaparición
- Efectos neon coherentes con el estilo del juego

#### 1.4 Integración con Movimiento
- Conversión de ángulo/fuerza a velocidad
- Suavizado de movimiento
- Mantener sistema de colisiones actual

**Archivos a Modificar**:
- `game.js`: Eliminar joysticks fijos, agregar sistema dinámico
- `index.html`: Remover elementos de joystick del DOM
- Nuevo archivo: `dynamic-joystick.js`

---

### 🎯 **FASE 2: Sistema de Munición y Recarga**
**Duración Estimada**: 1-2 horas

#### 2.1 Sistema de Munición
```javascript
AmmoSystem {
    maxAmmo: 3,              // Balas máximas
    currentAmmo: 3,          // Balas actuales
    reloadTime: 1000,        // ms por bala
    lastReloadTime: 0,       // Timestamp última recarga
    isReloading: boolean     // Estado de recarga
}
```

#### 2.2 Lógica de Recarga
- Auto-recarga cuando no está disparando
- Timer individual por bala
- Interrupción de recarga al disparar
- Sonido/feedback de recarga completa

#### 2.3 UI de Munición
- 3 barras circulares debajo del jugador
- Animación de recarga (llenar barra)
- Colores: Verde (llena), Amarillo (recargando), Gris (vacía)
- Escala con el zoom de cámara

#### 2.4 Restricciones de Disparo
- Verificar munición antes de disparar
- Cooldown mínimo entre disparos
- No permitir disparo sin munición

**Archivos a Modificar**:
- `game.js`: Sistema de munición, UI de balas
- `player` object: Agregar propiedades de munición

---

### 🎯 **FASE 3: Sistema de Disparo Mejorado**
**Duración Estimada**: 3-4 horas

#### 3.1 Auto-aim
```javascript
AutoAim {
    maxRange: 500,              // Rango máximo de auto-aim
    targetPriority: 'closest',  // Prioridad de objetivo

    findTarget() {
        // Buscar enemigo más cercano en rango
        // Ignorar enemigos en bushes (stealth)
        // Retornar ángulo hacia el objetivo
    }
}
```

#### 3.2 Manual Aim
- Drag del joystick derecho
- Indicador visual de dirección
- Círculo de rango de ataque
- Predicción de trayectoria

#### 3.3 Tipos de Proyectiles
```javascript
ProjectileTypes {
    SINGLE: {
        count: 1,
        spread: 0,
        speed: 12,
        damage: 50
    },
    TRIPLE: {
        count: 3,
        spread: 15,  // grados
        speed: 10,
        damage: 30
    },
    SHOTGUN: {
        count: 6,
        spread: 25,
        speed: 8,
        damage: 15
    }
}
```

#### 3.4 Mejoras Gráficas
- Proyectiles más grandes y visibles
- Trails mejorados
- Efectos de impacto
- Partículas de disparo

**Archivos a Modificar**:
- `game.js`: Lógica de disparo, auto-aim
- Nuevo archivo: `shooting-system.js`
- Nuevo archivo: `projectile-types.js`

---

### 🎯 **FASE 4: Sistema de Super/Ultimate**
**Duración Estimada**: 2-3 horas

#### 4.1 Carga de Super
```javascript
SuperSystem {
    maxCharge: 1000,        // Puntos para cargar
    currentCharge: 0,       // Carga actual
    chargePerDamage: 10,    // Carga por punto de daño
    isReady: boolean,       // Si está disponible

    addCharge(damage) {
        this.currentCharge += damage * this.chargePerDamage;
        if (this.currentCharge >= this.maxCharge) {
            this.isReady = true;
        }
    }
}
```

#### 4.2 UI de Super
- Barra circular alrededor del jugador
- Animación de carga progresiva
- Efecto de brillo cuando está lista
- Botón de activación (o gesto)

#### 4.3 Tipos de Super
```javascript
SuperAbilities {
    MEGA_SHOT: {
        damage: 200,
        range: 800,
        effect: 'massive_projectile'
    },
    DASH: {
        distance: 300,
        invulnerable: true,
        duration: 500
    },
    TURRET: {
        duration: 10000,
        damage: 30,
        fireRate: 500
    },
    HEAL_ZONE: {
        radius: 200,
        healPerSec: 100,
        duration: 5000
    }
}
```

#### 4.4 Activación
- Botón dedicado en UI
- Gesto de 2 dedos (opcional)
- Feedback visual masivo
- Sonido épico

**Archivos a Modificar**:
- `game.js`: Sistema de Super
- Nuevo archivo: `super-abilities.js`

---

### 🎯 **FASE 5: Mejoras Gráficas y Feedback**
**Duración Estimada**: 2-3 horas

#### 5.1 Indicadores de Rango
- Círculo de rango de ataque (semi-transparente)
- Se muestra al apuntar manualmente
- Color según si hay enemigos en rango

#### 5.2 Números de Daño Flotantes
```javascript
DamageNumber {
    value: number,
    x, y: number,
    color: string,
    velocity: {x, y},
    life: 1000,        // ms
    scale: 1.5,        // Tamaño inicial

    update(dt) {
        this.y -= this.velocity.y * dt;
        this.life -= dt;
        this.scale -= 0.001 * dt;
    }
}
```

#### 5.3 Hit Markers
- Flash blanco en impacto
- Partículas en punto de impacto
- Sonido de impacto
- Shake de entidad impactada

#### 5.4 Efectos de Disparo
- Muzzle flash en el cañón
- Retroceso visual del personaje
- Partículas de casquillos (opcional)
- Trail mejorado de proyectiles

#### 5.5 Área de Efecto Visual
- Para Super y habilidades AoE
- Círculo pulsante
- Partículas en el borde
- Indicador de duración

**Archivos a Modificar**:
- `game.js`: Feedback visual, números de daño
- Nuevo archivo: `visual-feedback.js`

---

### 🎯 **FASE 6: Testing y Refinamiento**
**Duración Estimada**: 2-3 horas

#### 6.1 Testing de Controles
- Sensibilidad de joysticks
- Área de detección
- Respuesta en diferentes tamaños de pantalla
- Pruebas en dispositivo real

#### 6.2 Balance de Munición
- Tiempo de recarga óptimo
- Número de balas
- Damage por proyectil
- Velocidad de proyectiles

#### 6.3 Testing de Auto-aim
- Precisión del targeting
- Rango efectivo
- Prioridad de objetivos
- Edge cases (enemigos en bushes)

#### 6.4 Testing de Super
- Tiempo de carga
- Balance de poder
- Feedback visual/audio
- Usabilidad del botón

#### 6.5 Performance
- FPS con nuevos efectos
- Optimización de partículas
- Renderizado eficiente
- Memory leaks

---

### 🎯 **FASE EXTRA: Limpieza y Refactorización Final**
**Duración Estimada**: 2-3 horas

#### 7.1 Eliminar Controles Antiguos
**HTML (`index.html`)**:
- [ ] Eliminar `<div id="joystickContainer">` y su contenido
- [ ] Eliminar `<div id="shootJoystickContainer">` y su contenido
- [ ] Limpiar CSS relacionado con `.joystick-base`, `.joystick-stick`
- [ ] Eliminar clases `.joystick-container`, `.shoot-joystick-container`

**JavaScript (`game.js`)**:
- [ ] Eliminar objeto `input.joystick` (legacy)
- [ ] Eliminar objeto `input.shootJoystick` (legacy)
- [ ] Eliminar función `initializeMobileControls()` completa
- [ ] Eliminar todos los event listeners de joysticks fijos:
  - `joystickBase` touchstart/touchmove/touchend
  - `shootJoystickBase` touchstart/touchmove/touchend
- [ ] Eliminar variables:
  - `mobileControlsInitialized`
  - `joystickBase`, `joystickStick`
  - `shootJoystickBase`, `shootJoystickStick`

#### 7.2 Limpiar Código Duplicado
- [ ] Unificar sistema de input (solo dynamic joysticks)
- [ ] Eliminar bloques de código comentados
- [ ] Eliminar console.log obsoletos
- [ ] Remover fallbacks al sistema antiguo en:
  - Movimiento del jugador
  - Sistema de disparo
  - Actualización de cursor de aim

#### 7.3 Optimizar Estructura
```javascript
// ANTES (con fallbacks)
if (joystickManager) {
    const moveInput = joystickManager.getMovementInput();
    // ...
} else if (input.joystick.active) {
    // fallback antiguo
}

// DESPUÉS (limpio)
if (joystickManager) {
    const moveInput = joystickManager.getMovementInput();
    // ...
}
```

#### 7.4 Refactorizar CSS
- [ ] Eliminar estilos de joysticks fijos
- [ ] Consolidar estilos de mobile-controls
- [ ] Optimizar media queries
- [ ] Limpiar clases no utilizadas

#### 7.5 Documentar Cambios
- [ ] Actualizar comentarios en el código
- [ ] Documentar nuevas funciones
- [ ] Crear guía de uso del nuevo sistema
- [ ] Actualizar README si existe

#### 7.6 Testing Final
- [ ] Probar en Android físico
- [ ] Verificar que no haya referencias al sistema antiguo
- [ ] Comprobar que no hay errores en consola
- [ ] Validar que el tamaño del bundle se redujo
- [ ] Probar todos los modos de juego

**Archivos a Limpiar**:
- `game.js`: ~200-300 líneas menos
- `index.html`: ~50-100 líneas menos
- Reducción estimada: 5-10% del código total

---

## 📁 ESTRUCTURA DE ARCHIVOS PROPUESTA

```
assets/
├── js/
│   ├── map-system.js           (existente)
│   ├── dynamic-joystick.js     (nuevo)
│   ├── shooting-system.js      (nuevo)
│   ├── projectile-types.js     (nuevo)
│   ├── super-abilities.js      (nuevo)
│   └── visual-feedback.js      (nuevo)
├── game.js                     (modificar)
└── index.html                  (modificar)
```

---

## 🎨 CONSIDERACIONES DE DISEÑO

### Consistencia Visual
- Mantener estilo neon/cyberpunk actual
- Colores: Cyan (#00ffff), Magenta (#ff00ff), Verde (#00ff00)
- Efectos de glow y bloom
- Transiciones suaves

### UX/UI
- Controles intuitivos y responsivos
- Feedback inmediato en todas las acciones
- No obstruir la vista del jugador
- Adaptarse a diferentes tamaños de pantalla

### Performance
- Mantener 60 FPS estable
- Optimizar partículas y efectos
- Pool de objetos para proyectiles
- Limitar efectos en dispositivos lentos

---

## ⏱️ ESTIMACIÓN TOTAL

| Fase | Duración Estimada |
|------|-------------------|
| FASE 0: Preparación | 30 min |
| FASE 1: Joysticks Dinámicos | 2-3 horas |
| FASE 2: Munición y Recarga | 1-2 horas |
| FASE 3: Sistema de Disparo | 3-4 horas |
| FASE 4: Super/Ultimate | 2-3 horas |
| FASE 5: Mejoras Gráficas | 2-3 horas |
| FASE 6: Testing | 2-3 horas |
| **TOTAL** | **13-18 horas** |

---

## 🎯 PRIORIDADES

### Alta Prioridad (Must Have)
1. ✅ Joysticks dinámicos invisibles
2. ✅ Sistema de munición con 3 balas
3. ✅ Auto-aim básico
4. ✅ Recarga automática
5. ✅ UI de munición visible

### Media Prioridad (Should Have)
1. Manual aim con indicador
2. Números de daño flotantes
3. Sistema de Super básico
4. Mejores efectos de proyectiles
5. Hit markers

### Baja Prioridad (Nice to Have)
1. Múltiples tipos de Super
2. Efectos avanzados de partículas
3. Shake de pantalla
4. Sonidos personalizados
5. Animaciones de personaje

---

## 🔄 MIGRACIÓN GRADUAL

**Estrategia recomendada**: Implementar fase por fase manteniendo el juego jugable

1. **Semana 1**: FASE 1-2 (Controles + Munición)
2. **Semana 2**: FASE 3-4 (Disparo + Super)
3. **Semana 3**: FASE 5-6 (Gráficos + Testing)

**Rollback**: Mantener sistema anterior disponible por si hay problemas

---

## 📝 NOTAS ADICIONALES

### Diferencias con Brawl Stars
- Neon Survivor es más arcade/survival
- Mantenemos progresión de oleadas
- Enemigos no son jugadores (PvE vs PvP)
- Adaptamos mecánicas, no copiamos 1:1

### Mejoras Únicas
- Integración con sistema de oleadas
- Compatibilidad con mapas procedurales
- Pathfinding de enemigos mejorado
- Sistema de upgrades entre oleadas

---

**Creado**: 8 de Noviembre, 2025
**Última Actualización**: 8 de Noviembre, 2025
