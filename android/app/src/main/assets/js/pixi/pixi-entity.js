/* ===================================
   PIXI ENTITY - Base class for all game entities
   Provides sprite management, lifecycle, and common functionality
   ================================== */

(function() {
    'use strict';

    class PixiEntity {
        constructor(config = {}) {
            this.config = config;
            
            // Game state
            this.x = config.x || 0;
            this.y = config.y || 0;
            this.vx = 0;
            this.vy = 0;
            this.rotation = 0;
            this.scale = config.scale || 1;
            this.alive = true;
            this.active = true;
            
            // Visual
            this.sprite = null;
            this.layer = config.layer || 'foreground';
            this.zIndex = config.zIndex || 0;
            this.tint = config.tint || 0xffffff;
            this.alpha = config.alpha || 1;
            
            // Effects
            this.filters = [];
            this.glowColor = config.glowColor || null;
            this.glowStrength = config.glowStrength || 2;
            
            // Lifecycle
            this.age = 0;
            this.maxAge = config.maxAge || Infinity;
            
            // Reference to scene
            this.scene = config.scene || null;
        }

        // Initialize sprite (override in subclasses)
        createSprite(texture) {
            if (!texture) {
                console.warn('⚠️ PixiEntity: No texture provided');
                return null;
            }

            this.sprite = new PIXI.Sprite(texture);
            this.sprite.anchor.set(0.5);
            this.sprite.x = this.x;
            this.sprite.y = this.y;
            this.sprite.rotation = this.rotation;
            this.sprite.scale.set(this.scale);
            this.sprite.tint = this.tint;
            this.sprite.alpha = this.alpha;
            this.sprite.zIndex = this.zIndex;

            // Apply glow effect if specified
            if (this.glowColor && PIXI.filters && PIXI.filters.GlowFilter) {
                const glow = new PIXI.filters.GlowFilter({
                    distance: 15,
                    outerStrength: this.glowStrength,
                    color: this.glowColor,
                    quality: 0.5
                });
                this.filters.push(glow);
                this.sprite.filters = this.filters;
            }

            // Add to scene
            if (this.scene && this.scene.layerManager) {
                this.scene.layerManager.addToLayer(this.layer, this.sprite, this.zIndex);
                console.log(`✅ Sprite added to layer '${this.layer}' at (${this.x}, ${this.y})`);
            } else {
                console.warn(`⚠️ Cannot add sprite to layer: scene or layerManager not available`);
            }

            return this.sprite;
        }

        // Update entity (call every frame)
        update(deltaTime) {
            if (!this.alive || !this.active) return;

            // Update age
            this.age += deltaTime;
            if (this.age >= this.maxAge) {
                this.destroy();
                return;
            }

            // Update position
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;

            // Sync sprite
            if (this.sprite) {
                this.sprite.x = this.x;
                this.sprite.y = this.y;
                this.sprite.rotation = this.rotation;
                this.sprite.scale.set(this.scale);
                this.sprite.tint = this.tint;
                this.sprite.alpha = this.alpha;
            }
        }

        // Set position
        setPosition(x, y) {
            this.x = x;
            this.y = y;
            if (this.sprite) {
                this.sprite.x = x;
                this.sprite.y = y;
            }
        }

        // Set velocity
        setVelocity(vx, vy) {
            this.vx = vx;
            this.vy = vy;
        }

        // Set rotation
        setRotation(angle) {
            this.rotation = angle;
            if (this.sprite) {
                this.sprite.rotation = angle;
            }
        }

        // Set scale
        setScale(scale) {
            this.scale = scale;
            if (this.sprite) {
                this.sprite.scale.set(scale);
            }
        }

        // Set tint color
        setTint(color) {
            this.tint = color;
            if (this.sprite) {
                this.sprite.tint = color;
            }
        }

        // Set alpha
        setAlpha(alpha) {
            this.alpha = alpha;
            if (this.sprite) {
                this.sprite.alpha = alpha;
            }
        }

        // Flash effect (damage, pickup, etc.)
        flash(color = 0xffffff, duration = 0.1) {
            if (!this.sprite) return;

            const originalTint = this.tint;
            this.setTint(color);

            setTimeout(() => {
                this.setTint(originalTint);
            }, duration * 1000);
        }

        // Pulse effect (scale animation)
        pulse(targetScale = 1.2, duration = 0.3) {
            if (!this.sprite) return;

            const originalScale = this.scale;
            const startTime = Date.now();
            const animate = () => {
                const elapsed = (Date.now() - startTime) / 1000;
                const progress = Math.min(elapsed / duration, 1);
                
                // Ease in-out
                const eased = progress < 0.5 
                    ? 2 * progress * progress 
                    : 1 - Math.pow(-2 * progress + 2, 2) / 2;

                const currentScale = originalScale + (targetScale - originalScale) * Math.sin(eased * Math.PI);
                this.setScale(currentScale);

                if (progress < 1) {
                    requestAnimationFrame(animate);
                } else {
                    this.setScale(originalScale);
                }
            };
            animate();
        }

        // Check if point is inside entity (simple circle collision)
        containsPoint(x, y, radius = 32) {
            const dx = this.x - x;
            const dy = this.y - y;
            return Math.sqrt(dx * dx + dy * dy) < radius;
        }

        // Get distance to another entity
        distanceTo(other) {
            const dx = this.x - other.x;
            const dy = this.y - other.y;
            return Math.sqrt(dx * dx + dy * dy);
        }

        // Destroy entity
        destroy() {
            this.alive = false;
            this.active = false;

            if (this.sprite) {
                // Remove from layer
                if (this.scene && this.scene.layerManager) {
                    this.scene.layerManager.removeFromLayer(this.layer, this.sprite);
                }

                // Destroy sprite
                this.sprite.destroy({ children: true });
                this.sprite = null;
            }
        }

        // Reset for pooling
        reset(config = {}) {
            this.x = config.x || 0;
            this.y = config.y || 0;
            this.vx = 0;
            this.vy = 0;
            this.rotation = 0;
            this.scale = config.scale || 1;
            this.alive = true;
            this.active = true;
            this.age = 0;
            this.tint = config.tint || 0xffffff;
            this.alpha = config.alpha || 1;

            if (this.sprite) {
                this.sprite.visible = true;
                this.sprite.alpha = this.alpha;
                this.sprite.tint = this.tint;
            }
        }
    }

    // Export to global scope
    window.PixiEntity = PixiEntity;

})();
