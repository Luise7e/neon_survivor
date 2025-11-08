# 🗺️ SISTEMA DE MAPEADO PROCEDURAL - ROADMAP

## 📌 Resumen Ejecutivo

Sistema de generación procedural de mapas inspirado en **Brawl Stars** y **League of Legends**, diseñado para crear laberintos dinámicos con mecánicas de colisión, spawning inteligente y control de cámara fluido.

---

## 🗺️ **Plan Faseado: Sistema de Mapeado Procedural (Sin Tilesets, Visual 100% JS)**

### ✅ **FASE 1: Estructura y Lógica del Mapa + Renderizado Visual JS** (COMPLETADA)

**Implementado:**
- ✅ Estructura de datos del mapa (35x35 tiles, configurable)
- ✅ 10 tipos de tiles diferentes (FLOOR, WALL, BUSH, SPAWN zones, DECORATION, etc.)
- ✅ 3 algoritmos de generación procedural mejorados:
  - **Maze**: Recursive backtracker con shuffle de direcciones y aberturas aleatorias
  - **Rooms**: BSP con múltiples conexiones y ciclos, marca habitaciones grandes como objetivos
  - **Cellular**: Automata celular para cuevas orgánicas
- ✅ Sistema de zonas:
  - Spawn de jugador (centro, área segura 5x5)
  - Spawn de enemigos (8 puntos: esquinas + lados)
  - Spawn de power-ups (5-10 zonas en áreas abiertas)
  - Bushes (8-13 clusters irregulares 2x4 tiles)
  - Decoraciones procedurales (5% del mapa)
- ✅ Validación de conectividad con flood fill (>80% de tiles conectados)
- ✅ **Renderizado visual 100% JavaScript** (sin tilesets):
  - Floor: Gradiente radial con animación de color
  - Walls: Bordes neon cyan con glow, detección de vecinos, esquinas redondeadas
  - Bushes: Clusters de círculos verdes con pulse animado
  - Decorations: Círculos, líneas y glows morados
  - Spawn zones: Círculos pulsantes (verde jugador, rojo enemigos, amarillo power-ups)
- ✅ Sistema de animación basado en tiempo (`animationTime`)
- ✅ Culling optimizado (solo renderiza tiles visibles + margen)

**Características técnicas:**
```javascript
// Configuración
TILE_SIZE: 64px
MAP_WIDTH: 35 tiles (2240px total)
MAP_HEIGHT: 35 tiles
Total area: 2240x2240 pixels

// Estilo visual neon coherente
VISUAL_STYLE = {
    bg: '#0a0a1a',           // Fondo oscuro
    floorBase: '#1a1a2e',    // Suelo
    wallBase: '#00ffff',     // Paredes cyan neon
    bushBase: '#00ff88',     // Bush verde neon
    glowIntensity: 15,       // Blur effect
    wallThickness: 4,
    animationSpeed: 0.002
}
```

**Mejoras sobre versión anterior:**
- Mapas más grandes (30→35 tiles) para mayor espacio de juego
- Algoritmos mejorados con más variedad y aleatoriedad
- Validación de conectividad funcional
- Renderizado visual completamente neon (coherente con el juego)
- Decoraciones procedurales para ambiente
- Más zonas de spawn (4→8 enemy spawns)
- Bushes con clusters irregulares
- Animaciones sutiles en todos los elementos

---

### ✅ **FASE 2: Minimap Visual y Selector de Tipo de Mapa** (COMPLETADA)

**Implementado:**
- ✅ **Minimapa visual en tiempo real**:
  - Canvas dedicado 180x180px en esquina superior derecha
  - Renderizado esquemático del mapa completo
  - Indicadores de jugador (punto verde), enemigos (puntos rojos)
  - Zonas de spawn visualizadas (círculos pulsantes)
  - Bushes y decoraciones representadas
  - Opacidad 0.92, visible solo durante gameplay
  - Integrado en `renderMinimap()` de MapSystem

- ✅ **Selector de tipo de mapa en menú**:
  - Modal neon con 6 tipos de mapas disponibles:
    - **Maze** 🌀: Laberintos complejos con callejones
    - **Rooms** 🏛️: Cámaras conectadas con chokepoints
    - **Cellular** 🌿: Estructuras orgánicas tipo cuevas
    - **Arena** ⚔️: Campo de batalla abierto central
    - **Symmetrical** 🔷: Layout espejo balanceado
    - **Jungla** 🌳: Vegetación densa con claros
  - UI con cards seleccionables, iconos, descripciones
  - Estilos neon coherentes con el juego
  - Botones de acción (Cancel/Start Game)
  - Sistema de selección visual (highlight en verde)

- ✅ **Integración completa con gameplay**:
  - `gameState.mapType` almacena tipo seleccionado
  - `startGameFromMenu(startLevel, mapType)` acepta parámetro
  - `MapSystem` inicializado al comenzar partida
  - Generación de mapa con algoritmo seleccionado
  - Player spawn en posición correcta del mapa
  - Renderizado del mapa en gameLoop
  - Minimapa actualizado cada frame
  - Colisiones funcionando con tiles del mapa

**Archivos modificados:**
- `index.html`:
  - CSS para `.map-selector-modal` y cards de tipos
  - HTML del modal selector con 6 tipos de mapas
  - Event handlers para selección y confirmación
  - Integración con `startGameBtn`
- `game.js`:
  - `gameState.mapType` añadido
  - `startGameFromMenu()` acepta `mapType`
  - Inicialización de `window.gameMapSystem`
  - Renderizado de mapa en `render()`
  - Renderizado de minimapa en `render()`
  - Player spawn desde `getPlayerSpawnPosition()`
- `map-system.js`:
  - `renderMinimap()` implementado (ya estaba de Fase 1)

**Funcionalidades técnicas:**
```javascript
// Flujo de selección de mapa
1. Usuario click en "START GAME"
2. Modal se abre con 6 opciones
3. Usuario selecciona tipo (ej: "Cellular")
4. Click en "Start Game"
5. Modal se cierra
6. startGame(1, 'cellular') llamado
7. MapSystem inicializado con algorithm: 'cellular'
8. Mapa generado y renderizado
9. Minimapa actualizado en tiempo real
```

**Características UI:**
- Grid responsive (auto-fit, minmax 250px)
- Hover effects con transform y glow
- Selección visual con border verde y glow
- Animaciones: fadeIn modal, slideUp content
- Mobile-friendly (clamp para tamaños)
- Iconos emoji para cada tipo de mapa
- Descripciones tácticas de cada tipo

---

### ✅ **FASE 3: Colisiones y Física Avanzada** (COMPLETADA)

**Implementado:**
- ✅ **Sliding collision system**:
  - Método `moveWithCollision(x, y, vx, vy, radius)` en MapSystem
  - Movimiento independiente en ejes X e Y para deslizamiento suave
  - Integrado con movimiento del jugador (joystick y mouse)
  - Integrado con movimiento de enemigos
  - Clamp automático a límites del mapa

- ✅ **Raycast para proyectiles**:
  - Método `raycast(x1, y1, x2, y2)` usando DDA algorithm
  - Detección de colisión de balas con paredes
  - Destrucción automática de balas al impactar paredes
  - Efectos de partículas en impacto

- ✅ **Sistema de pushback**:
  - Método `pushbackFromWalls(x, y, radius)` para corregir solapamiento
  - Búsqueda de posición walkable más cercana
  - Pushback gradual (25% por frame) para movimiento suave
  - Previene que entidades queden atrapadas en paredes

**Características técnicas:**
```javascript
// Sliding collision - Movimiento suave en paredes
const newPos = mapSystem.moveWithCollision(x, y, vx, vy, radius);
// Intenta X primero, luego Y independientemente
// Permite "deslizarse" a lo largo de paredes

// Raycast - Detección de colisión de balas
const hit = mapSystem.raycast(x1, y1, x2, y2);
if (hit.hit) {
    // Bala impactó pared en hit.x, hit.y
    // Tile impactado en hit.tileX, hit.tileY
}

// Pushback - Corrección de solapamiento
const corrected = mapSystem.pushbackFromWalls(x, y, radius);
if (corrected.pushed) {
    // Entidad estaba atrapada, ahora en corrected.x, corrected.y
}
```

**Archivos modificados:**
- `map-system.js`:
  - `moveWithCollision()` implementado
  - `raycast()` implementado con DDA algorithm
  - `pushbackFromWalls()` implementado
- `game.js`:
  - `updatePlayerMovement()` usa moveWithCollision()
  - `update()` usa moveWithCollision() para joystick
  - Enemigos usan moveWithCollision()
  - Balas usan raycast() para detectar paredes

**Mejoras sobre versión anterior:**
- Movimiento fluido sin atasco en esquinas
- Enemigos navegan correctamente por el mapa
- Balas no atraviesan paredes
- Sistema robusto de corrección de posición
- No hay "teleporting" al chocar con paredes

---

## 🚧 FASE 4: SISTEMA DE CÁMARA AVANZADO (PRÓXIMA)

### Objetivos:
1. **Camera shake**: Efectos de impacto, explosiones
2. **Look-ahead**: Cámara anticipa movimiento del jugador
3. **Zoom dinámico**: Alejar en combates masivos, acercar en pasillos
4. **Cinematic mode**: Transiciones suaves entre zonas
5. **Deadzone**: Área central donde el jugador se mueve sin mover cámara

### Implementación camera shake:
```javascript
applyShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
}

updateCamera(targetX, targetY, canvasWidth, canvasHeight, deltaTime) {
    // ... código existente ...

    // Camera shake
    if (this.shakeTime < this.shakeDuration) {
        const progress = this.shakeTime / this.shakeDuration;
        const decay = 1 - progress;
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity * decay;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity * decay;
        this.camera.x += shakeX;
        this.camera.y += shakeY;
        this.shakeTime += deltaTime;
    }
}
```

---

## � FASE 5: MECÁNICAS AVANZADAS (PENDIENTE)

### Objetivos:
1. **Validación de conectividad**: Flood fill para verificar que todo el mapa es accesible
2. **Parámetros avanzados**:
   - Densidad de paredes ajustable
   - Tamaño mínimo/máximo de habitaciones
   - Número de corredores
   - Complejidad del laberinto
3. **Post-procesamiento**:
   - Suavizado de esquinas
   - Añadir decoración procedural
   - Variaciones de paredes (damaged, cracked)
4. **Semillas (seeds)**: Reproducibilidad de mapas

### Código propuesto:
```javascript
generateMap({
    algorithm: 'maze',
    seed: 12345,            // NEW: Semilla para reproducir mapas
    wallDensity: 0.4,       // 0.0 - 1.0
    complexity: 0.7,        // 0.0 - 1.0 (más complejo = más ramificaciones)
    symmetry: false,        // NEW: Simetría espejo (Brawl Stars)
    openAreas: 3,           // NEW: Número de áreas abiertas grandes
    corridorWidth: 1,       // NEW: Ancho de pasillos (1-3 tiles)
    validate: true          // NEW: Validar conectividad
})
```

### Mecánicas inspiradas en Brawl Stars:
- **Mapas simétricos**: Importante para PvP balanceado
- **Zonas centrales abiertas**: Para combates 3v3
- **Bushes estratégicos**: Posicionados en clusters, no random

---

## 🎨 FASE 3: RENDERIZADO VISUAL AVANZADO

### Objetivos:
1. **Tileset artístico**: Reemplazar colores sólidos por sprites
2. **Autotiling**: Detectar vecinos y elegir sprite correcto (corners, edges, T-junctions)
3. **Capas de profundidad**:
   - Background layer (suelo decorativo)
   - Ground layer (tiles jugables)
   - Decoration layer (objetos no colisionables)
   - Foreground layer (paredes, árboles)
4. **Efectos visuales**:
   - Sombras paralelas (fake 3D)
   - Fog of War (opcional, estilo LoL)
   - Partículas ambientales (hojas, polvo)
   - Animaciones de tiles (agua, fuego)

### Recursos necesarios:
- Tileset 64x64px (compatible con existente `tilesheet_complete_2X.png`)
- Configuración de autotiling (Tiled Editor compatible)
- Sprites para bushes, decoración, objetivos

### Pseudocódigo autotiling:
```javascript
_getAutoTile(x, y) {
    const neighbors = {
        N: this.grid[y-1]?.[x] === WALL,
        E: this.grid[y]?.[x+1] === WALL,
        S: this.grid[y+1]?.[x] === WALL,
        W: this.grid[y]?.[x-1] === WALL,
        NE: this.grid[y-1]?.[x+1] === WALL,
        SE: this.grid[y+1]?.[x+1] === WALL,
        SW: this.grid[y+1]?.[x-1] === WALL,
        NW: this.grid[y-1]?.[x-1] === WALL
    };

    // Lógica para elegir tile correcto basado en vecinos
    // Ejemplo: esquina NE = !N && E && !S && !W
    return tileIndex;
}
```

---

## 📷 FASE 4: SISTEMA DE CÁMARA PRO

### Ya implementado:
- ✅ Smooth follow con interpolación (`camera.smoothing = 0.1`)
- ✅ Clamp a bordes del mapa
- ✅ Offset de renderizado

### Mejoras propuestas:
1. **Camera shake**: Efectos de impacto, explosiones
2. **Look-ahead**: Cámara anticipa movimiento del jugador
3. **Zoom dinámico**: Alejar en combates masivos, acercar en pasillos
4. **Cinematic mode**: Transiciones suaves entre zonas
5. **Deadzone**: Área central donde el jugador se mueve sin mover cámara

### Implementación camera shake:
```javascript
applyShake(intensity, duration) {
    this.shakeIntensity = intensity;
    this.shakeDuration = duration;
    this.shakeTime = 0;
}

updateCamera(targetX, targetY, canvasWidth, canvasHeight, deltaTime) {
    // ... código existente ...

    // Camera shake
    if (this.shakeTime < this.shakeDuration) {
        const progress = this.shakeTime / this.shakeDuration;
        const decay = 1 - progress;
        const shakeX = (Math.random() - 0.5) * this.shakeIntensity * decay;
        const shakeY = (Math.random() - 0.5) * this.shakeIntensity * decay;
        this.camera.x += shakeX;
        this.camera.y += shakeY;
        this.shakeTime += deltaTime;
    }
}
```

---

## 💥 FASE 5: MECÁNICAS AVANZADAS (PENDIENTE)

### Objetivos:
1. **Area of Effect**: Detección de entidades en radio
2. **Pathfinding**: A* para IA de enemigos
3. **Spawn inteligente**: Enemigos lejos del jugador, sin línea de visión
4. **Bush mechanics**: Invisibilidad, reducción de velocidad
5. **Zonas de poder**: Power-ups, objetivos, checkpoints

---

## 🎯 FASE 6: ZONAS ESPECIALES Y SPAWNING (PENDIENTE)

### Ya implementado:
- ✅ `zones.playerSpawns` (centro del mapa)
- ✅ `zones.enemySpawns` (4 esquinas)
- ✅ `zones.bushes` (clusters 2x2 aleatorios)
- ✅ `getPlayerSpawnPosition()`
- ✅ `getRandomEnemySpawnPosition()`
- ✅ `isInBush(x, y)` (mecánica cobertura)

### Mejoras propuestas:
1. **Spawn waves inteligente**:
   - Enemigos spawneados lejos del jugador
   - Nunca en línea de visión directa
   - Más spawns en oleadas avanzadas
2. **Zonas de poder** (Brawl Stars):
   - Power-up spawn cada X segundos
   - Zona objetivo (Gem Grab, Brawl Ball)
   - Spawn de boss en centro
3. **Bush mechanics**:
   - Invisibilidad (enemigos no te detectan)
   - Reducción de velocidad al entrar/salir
   - Revelar al disparar
4. **Checkpoints**: Zonas de curación/resupply

### Sistema de spawning avanzado:
```javascript
getSmartEnemySpawnPosition(playerX, playerY) {
    const validSpawns = this.zones.enemySpawns.filter(spawn => {
        const spawnWorld = this.tileToWorld(spawn.x, spawn.y);
        const dist = Math.hypot(spawnWorld.x - playerX, spawnWorld.y - playerY);

        // Mínimo 500px de distancia
        if (dist < 500) return false;

        // No en línea de visión
        const raycast = this.raycast(playerX, playerY, spawnWorld.x, spawnWorld.y);
        if (!raycast.hit) return false; // Línea de visión clara = descartado

        return true;
    });

    if (validSpawns.length === 0) {
        return this.getRandomEnemySpawnPosition(); // Fallback
    }

    const randomSpawn = validSpawns[Math.floor(Math.random() * validSpawns.length)];
    return this.tileToWorld(randomSpawn.x, randomSpawn.y);
}
```

---

## 🎮 FASE 7: INTEGRACIÓN CON GAMEPLAY (PENDIENTE)## 📊 BENCHMARKS Y OPTIMIZACIÓN

### Rendimiento objetivo:
- **60 FPS** en dispositivos móviles de gama media
- **Generación de mapa**: < 100ms
- **Renderizado**: < 16ms por frame

### Optimizaciones críticas:
1. **Culling agresivo**: Solo renderizar tiles visibles (ya implementado)
2. **Object pooling**: Reutilizar arrays de tiles
3. **Canvas layering**: Renderizar mapa en canvas offscreen, solo actualizarlo cuando cambie
4. **Tile batching**: Dibujar múltiples tiles en una sola llamada `drawImage`
5. **Spatial hashing**: Para detección de colisiones masivas

### Canvas offscreen:
```javascript
_preRenderMap() {
    // Crear canvas en memoria
    this.mapCanvas = document.createElement('canvas');
    this.mapCanvas.width = this.width * this.tileSize;
    this.mapCanvas.height = this.height * this.tileSize;
    const ctx = this.mapCanvas.getContext('2d');

    // Renderizar mapa completo una sola vez
    for (let y = 0; y < this.height; y++) {
        for (let x = 0; x < this.width; x++) {
            const tileType = this.grid[y][x];
            ctx.fillStyle = TILE_COLORS[tileType];
            ctx.fillRect(x * this.tileSize, y * this.tileSize, this.tileSize, this.tileSize);
        }
    }
}

render(ctx, cameraX, cameraY) {
    // Dibujar porción visible del mapa pre-renderizado
    ctx.drawImage(
        this.mapCanvas,
        cameraX, cameraY, canvas.width, canvas.height, // source rect
        0, 0, canvas.width, canvas.height // dest rect
    );
}
```

---

## 🛠️ HERRAMIENTAS DE DEBUG

### Ya disponible:
- ✅ Colores visuales para cada tipo de tile
- ✅ Grid lines en renderizado
- ✅ Zonas de spawn destacadas

### Mejoras propuestas:
1. **Toggle debug overlay** (tecla F3):
   - Mostrar grid de tiles
   - Highlight tiles colisionables
   - Mostrar zonas de spawn
   - FPS counter
   - Coordenadas del jugador
2. **Map editor in-game**:
   - Click para cambiar tipo de tile
   - Guardar/cargar mapas custom
3. **Pathfinding visualization**:
   - Ver rutas calculadas de enemigos
   - Heatmap de distancias

---

## 🎯 PRÓXIMOS PASOS INMEDIATOS

### Tareas priorizadas:
1. ✅ **Probar la demo**: Click en "MAP TEST" en menú principal
2. ✅ **Validar los 3 algoritmos**: Maze, Rooms, Cellular
3. ✅ **Selector de tipo de mapa**: UI completa con 6 opciones
4. ✅ **Minimapa en tiempo real**: Canvas dedicado con indicadores
5. ✅ **Integración con gameplay**: MapSystem funcional en partida
6. ✅ **Sliding collision**: Movimiento suave del jugador y enemigos
7. ✅ **Raycast para balas**: Proyectiles chocan con paredes
8. ✅ **Pushback system**: Prevención de solapamiento con paredes
9. **Camera shake** en impactos (Fase 4 - SIGUIENTE)
10. **Spawn inteligente de enemigos** usando zonas del mapa (Fase 5 - PENDIENTE)

### Testing checklist:
- [x] Mapa generado correctamente
- [x] Selector de tipo funcional
- [x] MapSystem inicializado en gameplay
- [x] Minimapa renderizado en tiempo real
- [x] Player spawn en posición correcta
- [x] Jugador respeta colisiones del mapa
- [x] Enemigos respetan colisiones del mapa
- [x] Balas chocan con paredes y se destruyen
- [x] Movimiento fluido sin atasco en esquinas
- [ ] Cámara sigue al jugador suavemente
- [ ] Camera shake en explosiones/impactos
- [ ] Bushes detectados correctamente (mecánica invisibilidad)
- [ ] Spawn zones inteligente para enemigos
- [ ] Rendimiento estable (60 FPS)

---

## 📚 REFERENCIAS DE INSPIRACIÓN

### Brawl Stars:
- **Tamaño de mapas**: 20x20 a 40x40 tiles
- **Simetría**: Mapas espejo para balance PvP
- **Bushes**: Cobertura para emboscadas
- **Zonas especiales**: Gemas, spawns de power-ups
- **Paredes**: Destructibles/indestructibles diferenciadas visualmente

### League of Legends:
- **Fog of War**: Visibilidad limitada (opcional para survivor mode)
- **Jungla**: Caminos entre carriles con neutral monsters
- **Bases**: Spawns en esquinas opuestas
- **River**: Zona neutral central
- **Brush**: Bushes para ocultación

### Adaptación a Neon Survivor:
- Mapa más pequeño (30x30 tiles óptimo para horde survival)
- Sin simetría necesaria (PvE, no PvP)
- Laberinto con habitaciones interconectadas
- Spawn central de jugador, perimetral de enemigos
- Bushes para estrategia (atacar y esconderse)

---

## ✅ CONCLUSIÓN

El sistema de mapeado está en **FASE 3 COMPLETADA** con fundamentos sólidos y mecánicas avanzadas:
- ✅ Generación procedural funcional (6 algoritmos: maze, rooms, cellular, arena, symmetrical, jungla)
- ✅ Renderizado visual 100% JavaScript con estilo neon coherente
- ✅ Minimapa en tiempo real con indicadores de jugador y enemigos
- ✅ Selector de tipo de mapa en menú con UI neon moderna
- ✅ Integración completa con gameplay principal
- ✅ Sistema de zonas (spawn player, enemies, power-ups, bushes)
- ✅ **Colisiones avanzadas con sliding**
- ✅ **Raycast para proyectiles**
- ✅ **Sistema de pushback anti-atasco**
- ✅ Demo interactiva disponible en "MAP TEST"

**Características destacadas:**
- 6 tipos de mapas procedurales diferentes con mecánicas únicas
- Minimapa esquemático actualizado en tiempo real
- UI de selección intuitiva y visualmente atractiva
- Sistema modular y extensible
- Renderizado optimizado con culling
- Validación de conectividad (flood fill)
- **Movimiento fluido sin atasco en paredes**
- **Balas respetan colisiones del mapa**
- **Enemigos navegan correctamente por el laberinto**

**Siguiente milestone**:
1. Camera shake para impactos y explosiones (Fase 4)
2. Look-ahead y zoom dinámico
3. Spawn inteligente de enemigos (Fase 5)
4. Mecánica de bushes (invisibilidad)
5. Pathfinding A* para IA

---

**Última actualización**: 2025-11-08
**Autor**: GitHub Copilot
**Estado**: ✅ Fase 1-3 Completas | 🚧 Fase 4-7 Planificadas