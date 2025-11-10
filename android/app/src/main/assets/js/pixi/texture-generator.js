/* ===================================
   TEXTURE GENERATOR - Generador de texturas procedurales
   Para testing sin necesidad de imágenes externas
   ================================== */

(function() {
    'use strict';

    class TextureGenerator {
        
        // Generar textura de fondo con grid neon
        static createNeonGrid(width = 2240, height = 2240, color = 0x00ffff) {
            const graphics = new PIXI.Graphics();
            // Fondo oscuro
            graphics.rect(0, 0, width, height);
            graphics.fill({ color: 0x0a0a1a, alpha: 1 });

            // Grid
            const gridSize = 64;
            graphics.setStrokeStyle({ width: 1, color: color, alpha: 0.3 });
            for (let x = 0; x <= width; x += gridSize) {
                graphics.moveTo(x, 0);
                graphics.lineTo(x, height);
            }
            for (let y = 0; y <= height; y += gridSize) {
                graphics.moveTo(0, y);
                graphics.lineTo(width, y);
            }
            graphics.stroke();
            
            // Convertir a texture
            const texture = PIXI.RenderTexture.create({ width, height });
            // Usar el renderer global de PixiJS
            const renderer = window.RendererAdapter && window.RendererAdapter.instance && window.RendererAdapter.instance.app ? window.RendererAdapter.instance.app.renderer : null;
            if (renderer) {
                renderer.render({ container: graphics, target: texture });
            }
            return texture;
        }

        // Generar tiles de arena
        static createArenaTiles(width = 2240, height = 2240) {
            const graphics = new PIXI.Graphics();
            // Suelo base
            graphics.rect(0, 0, width, height);
            graphics.fill({ color: 0x1a1a2e, alpha: 1 });
            
            // Tiles con patrón
            const tileSize = 64;
            for (let y = 0; y < height; y += tileSize) {
                for (let x = 0; x < width; x += tileSize) {
                    // Alternar color ligeramente
                    const variation = (x + y) % (tileSize * 2) === 0 ? 0x2a2a4e : 0x1a1a2e;
                    graphics.rect(x, y, tileSize, tileSize);
                    graphics.fill({ color: variation, alpha: 1 });
                    
                    // Borde sutil
                    graphics.rect(x, y, tileSize, tileSize);
                    graphics.stroke({ width: 1, color: 0x3a3a6e, alpha: 0.3 });
                }
            }
            const texture = PIXI.RenderTexture.create({ width, height });
            const renderer = window.RendererAdapter && window.RendererAdapter.instance && window.RendererAdapter.instance.app ? window.RendererAdapter.instance.app.renderer : null;
            if (renderer) {
                renderer.render({ container: graphics, target: texture });
            }
            return texture;
        }

        // Generar paredes neon
        static createNeonWalls(width = 2240, height = 2240) {
            const graphics = new PIXI.Graphics();
            // Transparente (solo paredes)
            graphics.rect(0, 0, width, height);
            graphics.fill({ color: 0x000000, alpha: 0 });
            
            const wallThickness = 64;
            // Paredes exteriores con glow
            graphics.rect(wallThickness/2, wallThickness/2, width - wallThickness, height - wallThickness);
            graphics.stroke({ width: wallThickness, color: 0x00ffff, alpha: 1 });
            
            // Obstáculos centrales
            graphics.rect(width/2 - 160, height/2 - 160, 320, 320);
            graphics.fill({ color: 0x00ffff, alpha: 0.8 });
            
            const texture = PIXI.RenderTexture.create({ width, height });
            const renderer = window.RendererAdapter && window.RendererAdapter.instance && window.RendererAdapter.instance.app ? window.RendererAdapter.instance.app.renderer : null;
            if (renderer) {
                renderer.render({ container: graphics, target: texture });
            }
            return texture;
        }

        // Generar sprite de jugador circular
        static createPlayerSprite(radius = 32, color = 0xff00ff) {
            const graphics = new PIXI.Graphics();
            
            // Glow exterior
            graphics.circle(radius, radius, radius * 1.5);
            graphics.fill({ color: color, alpha: 0.3 });

            // Cuerpo principal
            graphics.circle(radius, radius, radius);
            graphics.fill({ color: color, alpha: 1 });

            // Punto central
            graphics.circle(radius, radius, radius * 0.3);
            graphics.fill({ color: 0xffffff, alpha: 1 });

            const texture = PIXI.RenderTexture.create({ width: radius * 3, height: radius * 3 });
            const renderer = window.RendererAdapter && window.RendererAdapter.instance && window.RendererAdapter.instance.app ? window.RendererAdapter.instance.app.renderer : null;
            
            if (renderer) {
                renderer.render({ container: graphics, target: texture });
            } else {
                console.warn('⚠️ Renderer not available for player texture');
            }

            return texture;
        }

        // Generar sprite de enemigo
        static createEnemySprite(radius = 28, color = 0xff0044) {
            const graphics = new PIXI.Graphics();
            
            // Glow
            graphics.circle(radius, radius, radius * 1.5);
            graphics.fill({ color: color, alpha: 0.3 });

            // Cuerpo
            graphics.circle(radius, radius, radius);
            graphics.fill({ color: color, alpha: 1 });

            const texture = PIXI.RenderTexture.create({ width: radius * 3, height: radius * 3 });
            const renderer = window.RendererAdapter && window.RendererAdapter.instance && window.RendererAdapter.instance.app ? window.RendererAdapter.instance.app.renderer : null;
            
            if (renderer) {
                renderer.render({ container: graphics, target: texture });
            } else {
                console.warn('⚠️ Renderer not available for enemy texture');
            }

            return texture;
        }

        // Generar sprite de bala
        static createBulletSprite(radius = 8, color = 0x00ffff) {
            const graphics = new PIXI.Graphics();
            
            // Trail
            graphics.circle(radius, radius, radius * 2);
            graphics.fill({ color: color, alpha: 0.5 });

            // Bala
            graphics.circle(radius, radius, radius);
            graphics.fill({ color: color, alpha: 1 });

            // Centro brillante
            graphics.circle(radius, radius, radius * 0.5);
            graphics.fill({ color: 0xffffff, alpha: 1 });

            const texture = PIXI.RenderTexture.create({ width: radius * 4, height: radius * 4 });
            const renderer = window.RendererAdapter && window.RendererAdapter.instance && window.RendererAdapter.instance.app ? window.RendererAdapter.instance.app.renderer : null;
            
            if (renderer) {
                renderer.render({ container: graphics, target: texture });
            } else {
                console.warn('⚠️ Renderer not available for bullet texture');
            }

            return texture;
        }
    }

    // Export to global scope
    window.TextureGenerator = TextureGenerator;

})();
