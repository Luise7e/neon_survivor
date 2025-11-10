# 🎮 FASE 2: Sistema de Entidades PixiJS

## ✅ COMPLETADO - Sistema Completo de Entidades

### 📦 Archivos Creados

#### 1. **pixi-entity.js** - Clase Base
Clase base para todas las entidades del juego con funcionalidad común:

**Características:**
- ✅ Gestión de sprites (creación, actualización, destrucción)
- ✅ Sistema de posición, velocidad y rotación
- ✅ Lifecycle completo (init, update, destroy, reset)
- ✅ Efectos visuales (flash, pulse, tint, alpha)
- ✅ Sistema de filtros (glow automático)
- ✅ Detección de colisiones básica
- ✅ Pool-ready (método reset)

**Métodos principales:**
```javascript
createSprite(texture)      // Crear sprite con configuración
update(deltaTime)           // Actualizar posición y visual
setPosition(x, y)          // Cambiar posición
setVelocity(vx, vy)        // Cambiar velocidad
flash(color, duration)     // Efecto de flash
pulse(scale, duration)     // Efecto de pulso
destroy()                  // Destruir entidad
reset(config)              // Resetear para pool
```

---

#### 2. **sprite-pool.js** - Sistema de Pool
Gestión eficiente de sprites para reducir GC y mejorar rendimiento:

**Características:**
- ✅ Pools separados por tipo de entidad
- ✅ Reutilización automática de sprites
- ✅ Límite configurable de entidades
- ✅ Stats en tiempo real
- ✅ Cache de texturas

**Métodos principales:**
```javascript
createPool(type, size)               // Crear pool
acquire(type, EntityClass, config)   // Obtener entidad
release(type, entity)                // Devolver al pool
getStats(type)                       // Obtener estadísticas
clearAll()                           // Limpiar todos los pools
```

**Ejemplo de uso:**
```javascript
const pool = new SpritePool({ maxSize: 500 });
pool.createPool('enemy', 10);
pool.createPool('bullet', 50);

// Obtener enemigo del pool
const enemy = pool.acquire('enemy', PixiEnemy, { x: 100, y: 100 });

// Devolver al pool cuando muere
pool.release('enemy', enemy);
```

---

#### 3. **pixi-player.js** - Jugador
Entidad del jugador con controles y sistema de vida:

**Características:**
- ✅ Extends PixiEntity
- ✅ Sistema de movimiento normalizado
- ✅ Sistema de salud (health/maxHealth)
- ✅ Rotación hacia dirección de movimiento
- ✅ Efectos de daño (flash rojo)
- ✅ Efectos de curación (flash verde)
- ✅ Animación de muerte (fade out)
- ✅ Sistema de respawn
- ✅ Glow effect personalizado

**Propiedades:**
```javascript
{
    radius: 32,
    color: 0xff00ff,
    speed: 300,
    health: 100,
    maxHealth: 100,
    glowStrength: 3
}
```

**Métodos:**
```javascript
updateMovement(deltaTime, input)  // Actualizar con input {x, y}
takeDamage(amount)                // Recibir daño
heal(amount)                      // Curarse
die()                            // Morir con animación
respawn(x, y)                    // Reaparecer
getHealthPercent()               // Porcentaje de vida
```

---

#### 4. **pixi-enemy.js** - Enemigos
Entidad de enemigo con IA de persecución:

**Características:**
- ✅ Extends PixiEntity
- ✅ AI de persecución al jugador
- ✅ Rangos configurables (chase, attack)
- ✅ Tipos de enemigo (normal, fast, tank)
- ✅ Sistema de salud
- ✅ Efectos de daño (flash blanco)
- ✅ Animación de muerte (scale + fade)
- ✅ Colores dinámicos por tipo

**Tipos de enemigo:**
```javascript
{
    normal: { health: 50,  speed: 150, color: 0xff0044 },
    fast:   { health: 30,  speed: 250, color: 0x00ff44 },
    tank:   { health: 100, speed: 100, color: 0x4400ff }
}
```

**Métodos:**
```javascript
updateAI(deltaTime)              // Actualizar IA
takeDamage(amount)               // Recibir daño
die()                           // Morir con animación
setColorByType(type)            // Cambiar color según tipo
getHealthPercent()              // Porcentaje de vida
```

---

#### 5. **pixi-bullet.js** - Proyectiles
Entidad de bala con efecto de trail:

**Características:**
- ✅ Extends PixiEntity
- ✅ Sistema de trail visual
- ✅ Auto-destrucción con timer (2s default)
- ✅ Fade out al final de vida
- ✅ Efectos de impacto (explosión)
- ✅ Detección de colisiones
- ✅ Pool-optimized

**Propiedades:**
```javascript
{
    radius: 8,
    color: 0x00ffff,
    damage: 25,
    speed: 600,
    lifetime: 2.0,
    trailLength: 5,
    trailOpacity: 0.5
}
```

**Métodos:**
```javascript
shoot(x, y, angle, speed)        // Disparar bala
hit()                           // Impactar con animación
checkCollision(entity, radius)  // Verificar colisión
renderTrail(graphics)           // Renderizar trail (opcional)
```

---

#### 6. **pixi-test-entities.html** - Test Suite Interactivo

Suite de pruebas completa con controles interactivos:

**Características:**
- ✅ Entorno completo con parallax
- ✅ Player controlable con WASD
- ✅ Click para disparar
- ✅ Spawn de enemigos automático
- ✅ Detección de colisiones
- ✅ UI con stats en tiempo real
- ✅ Botones de control

**Controles:**
```
WASD / Flechas  → Mover jugador
Click Mouse     → Disparar
Botón "Spawn"   → Crear enemigo
Botón "Damage"  → Dañar jugador
Botón "Heal"    → Curar jugador
Botón "Clear"   → Eliminar enemigos
```

**Stats mostradas:**
- FPS
- Health del jugador (HP y %)
- Enemigos vivos
- Balas activas
- Pool statistics

---

## 🎯 Cómo Usar el Sistema

### 1. Setup Básico
```javascript
// Crear escena
const scene = new ArenaScene({ 
    width: window.innerWidth, 
    height: window.innerHeight 
});
await scene.initAsync();

// Crear pool (opcional pero recomendado)
const pool = new SpritePool({ maxSize: 500 });
pool.createPool('enemy', 10);
pool.createPool('bullet', 50);
```

### 2. Crear Player
```javascript
const player = new PixiPlayer({
    x: 1120,
    y: 1120,
    radius: 32,
    color: 0xff00ff,
    speed: 300,
    scene: scene
});
```

### 3. Crear Enemigos
```javascript
const enemy = new PixiEnemy({
    x: 500,
    y: 500,
    color: 0xff0044,
    health: 50,
    speed: 150,
    target: player,  // Perseguir al jugador
    scene: scene
});
```

### 4. Disparar Balas
```javascript
const bullet = new PixiBullet({
    color: 0x00ffff,
    damage: 25,
    speed: 600,
    owner: player,
    scene: scene
});

const angle = Math.atan2(targetY - player.y, targetX - player.x);
bullet.shoot(player.x, player.y, angle);
```

### 5. Game Loop
```javascript
function gameLoop() {
    const deltaTime = /* calcular delta */;

    // Actualizar player
    player.updateMovement(deltaTime, input);

    // Actualizar enemigos
    enemies.forEach(enemy => {
        enemy.updateAI(deltaTime);
    });

    // Actualizar balas
    bullets.forEach(bullet => {
        bullet.update(deltaTime);
        
        // Colisiones
        enemies.forEach(enemy => {
            if (bullet.checkCollision(enemy)) {
                enemy.takeDamage(bullet.damage);
                bullet.hit();
            }
        });
    });

    // Actualizar cámara
    scene.update(player.x, player.y);

    requestAnimationFrame(gameLoop);
}
```

---

## 🔧 Integración con Canvas Existente

Para migrar tu juego actual a PixiJS:

### Paso 1: Reemplazar player
```javascript
// Antes (Canvas)
const player = {
    x: 100, y: 100,
    vx: 0, vy: 0,
    radius: 32
};

// Después (PixiJS)
const player = new PixiPlayer({
    x: 100, 
    y: 100,
    radius: 32,
    scene: arenaScene
});
```

### Paso 2: Reemplazar enemies array
```javascript
// Antes (Canvas)
const enemies = [];
enemies.push({ x: 200, y: 200, health: 50 });

// Después (PixiJS)
const enemies = [];
const enemy = new PixiEnemy({
    x: 200, 
    y: 200,
    health: 50,
    target: player,
    scene: arenaScene
});
enemies.push(enemy);
```

### Paso 3: Actualizar game loop
```javascript
// Antes (Canvas)
function update() {
    player.x += player.vx * dt;
    player.y += player.vy * dt;
}

// Después (PixiJS)
function update() {
    player.updateMovement(deltaTime, input);
    // El sprite se actualiza automáticamente
}
```

---

## 📊 Ventajas del Sistema

### Performance
- ✅ WebGL rendering (mucho más rápido que Canvas)
- ✅ Sprite pooling (reduce GC)
- ✅ Batching automático de PixiJS
- ✅ Culling fuera de pantalla

### Visual
- ✅ Efectos avanzados (glow, blur, filters)
- ✅ Animaciones smooth
- ✅ Rotación y escala sin pérdida de calidad
- ✅ Efectos de partículas futuros

### Código
- ✅ OOP con herencia clara
- ✅ Código reutilizable
- ✅ Fácil de extender
- ✅ Lifecycle bien definido

---

## 🧪 Testing

### Abrir Test Suite
```bash
# Abrir en navegador
app/src/main/assets/pixi-test-entities.html
```

### Tests Incluidos
1. ✅ PixiJS carga correctamente
2. ✅ ArenaScene inicializa async
3. ✅ Entorno con parallax funciona
4. ✅ Sprite pool crea pools
5. ✅ Player crea y renderiza
6. ✅ Enemigos spawn y persiguen
7. ✅ Input WASD funciona
8. ✅ Disparos con click
9. ✅ Colisiones detectadas
10. ✅ Efectos visuales (glow, flash)

### Validaciones
- [ ] FPS > 55 con 20+ enemigos
- [ ] Sin memory leaks después de 5 min
- [ ] Colisiones precisas
- [ ] Efectos visibles y smooth

---

## 🚀 Próximos Pasos (FASE 3)

- [ ] Sistema de partículas avanzado
- [ ] Efectos de profundidad 2.5D (escala por Y)
- [ ] Sombras proyectadas
- [ ] Efectos de cámara (shake, zoom)
- [ ] Iluminación dinámica
- [ ] Slow motion temporal

---

## 📝 Notas Técnicas

### Compatibilidad
- PixiJS v8.x
- Todos los módulos usan v8 API
- Sin deprecation warnings críticas

### Dependencias
```javascript
// Orden de carga
1. pixi-bundle.dist.js
2. renderer-adapter.js
3. layer-manager.js
4. camera-controller.js
5. collision-map.js
6. arena-scene.js
7. texture-generator.js
8. pixi-entity.js         ← BASE
9. sprite-pool.js         ← POOL
10. pixi-player.js        ← ENTITIES
11. pixi-enemy.js
12. pixi-bullet.js
```

### Memoria
- Sprite pool evita crear/destruir constantemente
- Texturas cacheadas automáticamente
- Filtros compartidos cuando sea posible
- Límite de 500 entidades por defecto (configurable)

---

**Estado:** ✅ FASE 2 COMPLETADA  
**Fecha:** 2025-11-10  
**Siguiente:** FASE 3 - Efectos Avanzados
