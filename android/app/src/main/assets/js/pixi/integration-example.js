/* ===================================
   PIXI INTEGRATION EXAMPLE
   Ejemplo de cómo integrar PixiJS en game.js
   ================================== */

/*

// ============================================
// PASO 1: Declarar variable global para ArenaScene
// ============================================
let arenaScene = null;
let pixiEnabled = false;

// ============================================
// PASO 2: Inicializar PixiJS después de Canvas
// ============================================
function initPixiRenderer() {
    // Verificar si PixiJS está cargado
    if (typeof PIXI === 'undefined') {
        console.warn('⚠️ PixiJS not loaded, falling back to Canvas mode');
        pixiEnabled = false;
        return;
    }

    try {
        const canvas = document.getElementById('gameCanvas');
        const parent = canvas.parentElement;

        // Crear escena PixiJS
        arenaScene = new ArenaScene({
            mode: 'pixi', // 'canvas' | 'pixi' | 'hybrid'
            width: screenWidth,
            height: screenHeight,
            parent: parent,
            canvas: canvas,
            ctx: ctx
        });

        // Cargar mapa de ejemplo
        MapLoader.load('maps/arena_neon_example.json', arenaScene)
            .then(mapData => {
                console.log('✅ PixiJS Map loaded:', mapData.name);
                pixiEnabled = true;
            })
            .catch(error => {
                console.error('❌ Error loading PixiJS map:', error);
                pixiEnabled = false;
            });

        console.log('✅ PixiJS Renderer initialized');

    } catch (error) {
        console.error('❌ Error initializing PixiJS:', error);
        pixiEnabled = false;
    }
}

// ============================================
// PASO 3: Llamar después de initCanvas()
// ============================================
// En la función de inicio del juego:
//
// initCanvas();
// if (typeof PIXI !== 'undefined') {
//     initPixiRenderer();
// }

// ============================================
// PASO 4: Actualizar en el game loop
// ============================================
function gameLoop() {
    const now = Date.now();
    const deltaTime = (now - lastTime) / 1000;
    lastTime = now;

    // Limpiar canvas (modo Canvas legacy)
    ctx.clearRect(0, 0, screenWidth, screenHeight);

    // Actualizar escena PixiJS
    if (pixiEnabled && arenaScene) {
        arenaScene.update(player.x, player.y);
    }

    // ... resto del código de renderizado ...

    requestAnimationFrame(gameLoop);
}

// ============================================
// PASO 5: Añadir sprites a capas PixiJS
// ============================================
function addPlayerSpriteToPixi() {
    if (!pixiEnabled || !arenaScene) return;

    // Crear sprite del jugador
    const playerTexture = PIXI.Texture.from('player.png'); // Crear textura desde imagen
    const playerSprite = new PIXI.Sprite(playerTexture);
    
    playerSprite.anchor.set(0.5); // Centro del sprite
    playerSprite.x = player.x;
    playerSprite.y = player.y;
    playerSprite.width = player.radius * 2;
    playerSprite.height = player.radius * 2;

    // Aplicar efecto neon
    const glowFilter = new PIXI.filters.GlowFilter({
        distance: 15,
        outerStrength: 2,
        color: 0x00ffff
    });
    playerSprite.filters = [glowFilter];

    // Añadir a capa foreground
    arenaScene.layerManager.addToLayer('foreground', playerSprite);

    // Guardar referencia
    player.pixiSprite = playerSprite;
}

// ============================================
// PASO 6: Actualizar posición de sprites
// ============================================
function updatePlayerSprite() {
    if (!pixiEnabled || !player.pixiSprite) return;

    player.pixiSprite.x = player.x;
    player.pixiSprite.y = player.y;
    player.pixiSprite.rotation = player.angle || 0;
    
    // Z-sorting automático (más abajo = más adelante)
    player.pixiSprite.zIndex = player.y;
}

// ============================================
// PASO 7: Resize handler
// ============================================
window.addEventListener('resize', () => {
    if (pixiEnabled && arenaScene) {
        arenaScene.resize(window.innerWidth, window.innerHeight);
    }
});

// ============================================
// PASO 8: Cleanup al salir del juego
// ============================================
function cleanupPixi() {
    if (arenaScene) {
        arenaScene.destroy();
        arenaScene = null;
    }
    pixiEnabled = false;
}

*/

// ============================================
// NOTAS ADICIONALES
// ============================================

/*
MIGRACIÓN PROGRESIVA:

1. FASE 1 (ACTUAL): 
   - PixiJS cargado pero no usado
   - Canvas funciona normalmente
   - Módulos PixiJS disponibles

2. FASE 2:
   - Activar PixiJS para fondos y mapas
   - Mantener entidades en Canvas
   - Híbrido Canvas + PixiJS

3. FASE 3:
   - Migrar entidades a PixiJS Sprites
   - Aplicar efectos neon
   - Mantener UI en Canvas

4. FASE 4 (COMPLETA):
   - Todo en PixiJS
   - Canvas solo como fallback
   - Máximo rendimiento

VERIFICAR INTEGRACIÓN:
- Abrir consola del navegador
- Debe mostrar: "✅ PixiJS Renderer initialized"
- Debe cargar: "✅ PixiJS Map loaded: Neon Brawl Arena - Example"
- No debe haber errores de carga de módulos
*/
