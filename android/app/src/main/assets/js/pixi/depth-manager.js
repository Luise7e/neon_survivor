/* ===================================
   DEPTH MANAGER - Sistema de profundidad 2.5D
   Escala dinámica, z-sorting, sombras proyectadas
   ================================== */

(function() {
    'use strict';

    class DepthManager {
        constructor(config = {}) {
            this.config = config;
            
            // Depth range (Y coordinates)
            this.minY = config.minY || 0;
            this.maxY = config.maxY || 2240;
            
            // Scale range
            this.minScale = config.minScale || 0.6;
            this.maxScale = config.maxScale || 1.2;
            
            // Shadow settings
            this.shadowEnabled = config.shadowEnabled !== false;
            this.shadowColor = config.shadowColor || 0x000000;
            this.shadowAlpha = config.shadowAlpha || 0.3;
            this.shadowOffsetY = config.shadowOffsetY || 5;
            
            // Entities to manage
            this.entities = [];
            
            // Shadow container
            this.shadowContainer = null;
            this.shadows = new Map(); // entity -> shadow sprite
        }

        // Initialize shadow container
        initShadows(scene) {
            if (!this.shadowEnabled || !scene || !scene.layerManager) return;

            this.shadowContainer = new PIXI.Container();
            this.shadowContainer.label = 'shadows';
            this.shadowContainer.alpha = this.shadowAlpha;
            
            // Add shadows below entities
            scene.layerManager.addToLayer('midground', this.shadowContainer, 5);
        }

        // Register entity for depth management
        registerEntity(entity) {
            if (!this.entities.includes(entity)) {
                this.entities.push(entity);

                // Create shadow if enabled
                if (this.shadowEnabled && this.shadowContainer && entity.sprite) {
                    this.createShadow(entity);
                }
            }
        }

        // Unregister entity
        unregisterEntity(entity) {
            const index = this.entities.indexOf(entity);
            if (index !== -1) {
                this.entities.splice(index, 1);

                // Remove shadow
                this.removeShadow(entity);
            }
        }

        // Create shadow for entity
        createShadow(entity) {
            if (!entity.sprite || this.shadows.has(entity)) return;

            // Create shadow sprite (ellipse)
            const graphics = new PIXI.Graphics();
            const radius = entity.radius || 16;
            
            graphics.ellipse(0, 0, radius * 0.8, radius * 0.4);
            graphics.fill({ color: this.shadowColor, alpha: 1 });

            const texture = PIXI.RenderTexture.create({ 
                width: radius * 2, 
                height: radius 
            });
            
            const renderer = window.RendererAdapter?.instance?.app?.renderer;
            if (renderer) {
                renderer.render({ container: graphics, target: texture });
            }

            const shadow = new PIXI.Sprite(texture);
            shadow.anchor.set(0.5);
            shadow.tint = this.shadowColor;

            this.shadowContainer.addChild(shadow);
            this.shadows.set(entity, shadow);
        }

        // Remove shadow
        removeShadow(entity) {
            const shadow = this.shadows.get(entity);
            if (shadow) {
                this.shadowContainer.removeChild(shadow);
                shadow.destroy();
                this.shadows.delete(entity);
            }
        }

        // Calculate scale based on Y position
        calculateScale(y) {
            const normalizedY = (y - this.minY) / (this.maxY - this.minY);
            const clampedY = Math.max(0, Math.min(1, normalizedY));
            return this.minScale + (this.maxScale - this.minScale) * clampedY;
        }

        // Calculate z-index based on Y position
        calculateZIndex(y) {
            return Math.floor(y);
        }

        // Update all entities
        update() {
            for (const entity of this.entities) {
                if (!entity.sprite || !entity.alive) continue;

                // Calculate depth scale
                const depthScale = this.calculateScale(entity.y);
                
                // Apply scale (preserve base scale)
                const baseScale = entity.scale || 1;
                entity.sprite.scale.set(baseScale * depthScale);

                // Update z-index for proper sorting
                const zIndex = this.calculateZIndex(entity.y);
                entity.sprite.zIndex = zIndex;

                // Update shadow
                const shadow = this.shadows.get(entity);
                if (shadow) {
                    shadow.x = entity.x;
                    shadow.y = entity.y + this.shadowOffsetY * depthScale;
                    shadow.scale.set(depthScale);
                    
                    // Shadow alpha based on depth (closer = darker)
                    shadow.alpha = 0.2 + (depthScale - this.minScale) / (this.maxScale - this.minScale) * 0.3;
                }
            }
        }

        // Clear all entities
        clear() {
            // Remove all shadows
            for (const [entity, shadow] of this.shadows) {
                if (shadow.parent) {
                    this.shadowContainer.removeChild(shadow);
                }
                shadow.destroy();
            }
            this.shadows.clear();
            this.entities = [];
        }

        // Destroy
        destroy() {
            this.clear();
            if (this.shadowContainer) {
                this.shadowContainer.destroy({ children: true });
                this.shadowContainer = null;
            }
        }

        // Get stats
        getStats() {
            return {
                entities: this.entities.length,
                shadows: this.shadows.size
            };
        }
    }

    // Export to global scope
    window.DepthManager = DepthManager;

})();
