/* ===================================
   PIXI ENEMY - Enemy entity with PixiJS rendering
   Extends PixiEntity base class
   ================================== */

(function() {
    'use strict';

    class PixiEnemy extends PixiEntity {
        constructor(config = {}) {
            super({
                ...config,
                layer: 'foreground',
                zIndex: 50,
                glowColor: config.color || 0xff0044,
                glowStrength: 2
            });

            // Enemy-specific properties
            this.radius = config.radius || 28;
            this.color = config.color || 0xff0044;
            this.speed = config.speed || 150;
            this.health = config.health || 50;
            this.maxHealth = config.maxHealth || 50;
            this.damage = config.damage || 10;
            
            // AI behavior
            this.target = config.target || null; // Reference to player
            this.chaseRange = config.chaseRange || 500;
            this.attackRange = config.attackRange || 50;

            // Create sprite
            this.init();
        }

        init() {
            // Generate enemy texture
            const texture = TextureGenerator.createEnemySprite(this.radius, this.color);
            this.createSprite(texture);
        }

        // Update enemy AI
        updateAI(deltaTime) {
            if (!this.alive || !this.target) return;

            const dx = this.target.x - this.x;
            const dy = this.target.y - this.y;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Chase player if in range
            if (distance < this.chaseRange && distance > this.attackRange) {
                // Move towards player
                this.vx = (dx / distance) * this.speed;
                this.vy = (dy / distance) * this.speed;

                // Rotate to face player
                this.rotation = Math.atan2(dy, dx);
            } else {
                // Stop if too close or too far
                this.vx = 0;
                this.vy = 0;
            }

            // Update base entity
            this.update(deltaTime);
        }

        // Take damage
        takeDamage(amount) {
            if (!this.alive) return false;

            this.health = Math.max(0, this.health - amount);
            
            // Flash white
            this.flash(0xffffff, 0.08);

            // Death
            if (this.health <= 0) {
                this.die();
                return true; // Killed
            }

            return false; // Still alive
        }

        // Death animation
        die() {
            this.alive = false;
            
            // Scale down and fade out
            if (this.sprite) {
                const startTime = Date.now();
                const duration = 0.3;

                const animate = () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const progress = Math.min(elapsed / duration, 1);

                    this.scale = 1 - progress;
                    this.alpha = 1 - progress;
                    this.setScale(this.scale);
                    this.setAlpha(this.alpha);

                    if (progress < 1) {
                        requestAnimationFrame(animate);
                    } else {
                        this.destroy();
                    }
                };
                animate();
            }
        }

        // Get health percentage
        getHealthPercent() {
            return (this.health / this.maxHealth) * 100;
        }

        // Set color based on enemy type
        setColorByType(type) {
            const colors = {
                'normal': 0xff0044,
                'fast': 0x00ff44,
                'tank': 0x4400ff,
                'boss': 0xffaa00
            };

            this.color = colors[type] || 0xff0044;
            this.glowColor = this.color;

            // Update sprite tint
            this.setTint(this.color);

            // Update glow filter color
            if (this.sprite && this.sprite.filters) {
                const glowFilter = this.sprite.filters.find(f => f instanceof PIXI.filters.GlowFilter);
                if (glowFilter) {
                    glowFilter.color = this.color;
                }
            }
        }
    }

    // Export to global scope
    window.PixiEnemy = PixiEnemy;

})();
