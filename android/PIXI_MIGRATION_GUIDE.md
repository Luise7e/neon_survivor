# 🗺️ MIGRACIÓN A PIXIJS - GUÍA DE INTEGRACIÓN

## 📦 Módulos Creados

### Fase 1 - Estructura Base ✅

1. **renderer-adapter.js** - Adaptador híbrido Canvas/PixiJS
2. **layer-manager.js** - Sistema de capas con zIndex y parallax
3. **camera-controller.js** - Cámara suave con lerp y límites
4. **collision-map.js** - Colisiones por zonas configurables
5. **arena-scene.js** - Controlador principal de escena
6. **map-loader.js** - Cargador de mapas JSON

### Fase 2-5 - Funcionalidades Implementadas ✅

- ✅ Sistema de capas (background, midground, foreground, effects, ui)
- ✅ Parallax dinámico (velocidades configurables por capa)
- ✅ Efectos neon (GlowFilter, BlurFilter)
- ✅ Colisiones por zonas JSON
- ✅ Carga de mapas desde JSON

---

## 🚀 INTEGRACIÓN EN index.html

### 1. Añadir PixiJS CDN

```html
<!-- Antes de cerrar </head> -->
<script src="https://cdn.jsdelivr.net/npm/pixi.js@7.x/dist/pixi.min.js"></script>
```

### 2. Cargar módulos PixiJS

```html
<!-- Después de map-system.js -->
<script src="js/pixi/renderer-adapter.js"></script>
<script src="js/pixi/layer-manager.js"></script>
<script src="js/pixi/camera-controller.js"></script>
<script src="js/pixi/collision-map.js"></script>
<script src="js/pixi/arena-scene.js"></script>
<script src="js/pixi/map-loader.js"></script>
```

### 3. Inicializar en game.js

```javascript
// En la función de inicialización del juego
let arenaScene = null;

function initPixiRenderer() {
    const canvas = document.getElementById('gameCanvas');
    const parent = canvas.parentElement;
    
    arenaScene = new ArenaScene({
        mode: 'pixi', // 'canvas' | 'pixi' | 'hybrid'
        width: screenWidth,
        height: screenHeight,
        parent: parent
    });
    
    // Cargar mapa
    MapLoader.load('maps/arena_neon_example.json', arenaScene)
        .then(mapData => {
            console.log('✅ Map loaded:', mapData.name);
        });
}

// Llamar después de initCanvas()
if (typeof PIXI !== 'undefined') {
    initPixiRenderer();
}
```

### 4. Actualizar en el game loop

```javascript
function gameLoop() {
    // ... código existente ...
    
    // Actualizar escena PixiJS
    if (arenaScene) {
        arenaScene.update(player.x, player.y);
    }
    
    // ... resto del código ...
}
```

---

## 🎨 EFECTOS VISUALES NEON

### GlowFilter (Resplandor)

```javascript
const glowFilter = new PIXI.filters.GlowFilter({
    distance: 15,
    outerStrength: 2,
    innerStrength: 1,
    color: 0x00ffff, // Cyan neon
    quality: 0.5
});

sprite.filters = [glowFilter];
```

### ColorMatrixFilter (Ajustes de color)

```javascript
const colorMatrix = new PIXI.filters.ColorMatrixFilter();
colorMatrix.brightness(1.2, false);
colorMatrix.contrast(1.1, false);

sprite.filters = [colorMatrix];
```

### BlurFilter (Profundidad)

```javascript
const blurFilter = new PIXI.filters.BlurFilter();
blurFilter.blur = 2; // Más blur = más lejos

backgroundLayer.filters = [blurFilter];
```

---

## 📐 PERSPECTIVA 2.5D SIMULADA

### Escala por distancia Y

```javascript
// Mientras más abajo (mayor Y), más grande
function updateEntityScale(entity) {
    const baseScale = 1.0;
    const depthFactor = 0.0002; // Ajustar según necesidad
    
    entity.scale.set(baseScale + (entity.y * depthFactor));
}
```

### Z-sorting automático

```javascript
// En cada frame, ordenar entidades por posición Y
entities.forEach(entity => {
    entity.zIndex = entity.y;
});
```

---

## 🗺️ CREAR NUEVOS MAPAS

### Estructura JSON

```json
{
  "name": "Mi Arena",
  "layers": [
    {
      "name": "background",
      "texture": "textures/mi_fondo.png",
      "parallax": 0.3
    }
  ],
  "collisions": [
    {
      "type": "rect",
      "x": 100,
      "y": 200,
      "width": 64,
      "height": 128
    }
  ],
  "effects": {
    "neonGlow": true,
    "blur": true
  }
}
```

### Cargar mapa

```javascript
MapLoader.load('maps/mi_arena.json', arenaScene);
```

---

## ⚡ OPTIMIZACIÓN MÓVIL

### 1. Reducir calidad de filtros

```javascript
glowFilter.quality = 0.3; // En lugar de 0.5
```

### 2. Usar texturas comprimidas

- Formato: **PNG comprimido** o **WebP**
- Tamaño: **Potencias de 2** (512x512, 1024x1024)
- Atlas: Usar **TexturePacker** para sprites

### 3. Limitar partículas

```javascript
const maxParticles = isMobile ? 50 : 200;
```

### 4. Desactivar capas innecesarias

```javascript
arenaScene.layerManager.setLayerVisibility('effects', false);
```

---

## 🎯 PRÓXIMOS PASOS

### Fase 6 - Entidades PixiJS

- Convertir player, enemies, bullets a PIXI.Sprite
- Aplicar efectos neon a entidades
- Z-sorting automático

### Fase 7 - Partículas

- Integrar **@pixi/particle-emitter**
- Efectos eléctricos, explosiones neon

### Fase 8 - UI Overlay

- HUD en capa UI fija (sin parallax)
- Minimapa con PixiJS Graphics

---

## 📊 RENDIMIENTO ESPERADO

| Métrica | Canvas Actual | PixiJS Optimizado |
|---------|---------------|-------------------|
| FPS (móvil) | 30-45 | 55-60 |
| Draw calls | ~100 | ~20 |
| Memoria | ~120 MB | ~80 MB |

---

## 🐛 DEBUG

### Ver capas activas

```javascript
console.log(arenaScene.layerManager.layers);
```

### Ver posición de cámara

```javascript
console.log(arenaScene.camera.x, arenaScene.camera.y);
```

### Ver colisiones

```javascript
console.log(arenaScene.collisionMap.grid);
```

---

## 📝 EJEMPLO COMPLETO

```javascript
// Inicializar escena
const scene = new ArenaScene({
    mode: 'pixi',
    width: 800,
    height: 600,
    parent: document.getElementById('gameContainer')
});

// Cargar mapa
await MapLoader.load('maps/arena_neon.json', scene);

// Añadir sprite a capa
const sprite = PIXI.Sprite.from('player.png');
scene.layerManager.addToLayer('foreground', sprite);

// Aplicar efecto neon
sprite.filters = [new PIXI.filters.GlowFilter({ color: 0xff00ff })];

// Game loop
function update() {
    scene.update(player.x, player.y);
    requestAnimationFrame(update);
}
update();
```

---

**¡Migración lista para comenzar!** 🚀
