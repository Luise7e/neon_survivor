/* ===================================
   PIXI PLAYER - Player entity with PixiJS rendering
   Extends PixiEntity base class
   ================================== */

(function() {
    'use strict';

    class PixiPlayer extends PixiEntity {
        constructor(config = {}) {
            super({
                ...config,
                layer: 'foreground',
                zIndex: 100,
                glowColor: config.color || 0xff00ff,
                glowStrength: 3
            });

            // Player-specific properties
            this.radius = config.radius || 32;
            this.color = config.color || 0xff00ff;
            this.speed = config.speed || 300;
            this.health = config.health || 100;
            this.maxHealth = config.maxHealth || 100;
            
            // Input
            this.moveX = 0;
            this.moveY = 0;

            // Create sprite
            this.init();
        }

        init() {
            // Generate player texture
            const texture = TextureGenerator.createPlayerSprite(this.radius, this.color);
            this.createSprite(texture);

            console.log('✅ PixiPlayer created at', this.x, this.y);
        }

        // Update player movement
        updateMovement(deltaTime, input = { x: 0, y: 0 }) {
            if (!this.alive) return;

            // Update velocity based on input
            this.moveX = input.x;
            this.moveY = input.y;

            // Normalize diagonal movement
            const length = Math.sqrt(this.moveX * this.moveX + this.moveY * this.moveY);
            if (length > 0) {
                this.vx = (this.moveX / length) * this.speed;
                this.vy = (this.moveY / length) * this.speed;
            } else {
                this.vx = 0;
                this.vy = 0;
            }

            // Rotate to face movement direction
            if (length > 0) {
                this.rotation = Math.atan2(this.moveY, this.moveX);
            }

            // Update base entity
            this.update(deltaTime);
        }

        // Take damage
        takeDamage(amount) {
            if (!this.alive) return;

            this.health = Math.max(0, this.health - amount);
            
            // Flash red
            this.flash(0xff0000, 0.1);

            // Death
            if (this.health <= 0) {
                this.die();
            }

            return this.health;
        }

        // Heal
        heal(amount) {
            this.health = Math.min(this.maxHealth, this.health + amount);
            
            // Flash green
            this.flash(0x00ff00, 0.15);

            return this.health;
        }

        // Death animation
        die() {
            this.alive = false;
            
            // Fade out
            if (this.sprite) {
                const fadeOut = () => {
                    this.alpha -= 0.05;
                    this.setAlpha(this.alpha);

                    if (this.alpha > 0) {
                        requestAnimationFrame(fadeOut);
                    } else {
                        this.destroy();
                    }
                };
                fadeOut();
            }

            console.log('💀 Player died');
        }

        // Respawn
        respawn(x, y) {
            this.x = x;
            this.y = y;
            this.health = this.maxHealth;
            this.alive = true;
            this.active = true;
            this.alpha = 1;
            this.vx = 0;
            this.vy = 0;

            if (!this.sprite) {
                this.init();
            } else {
                this.sprite.visible = true;
                this.setAlpha(1);
            }

            console.log('🔄 Player respawned at', x, y);
        }

        // Get health percentage
        getHealthPercent() {
            return (this.health / this.maxHealth) * 100;
        }
    }

    // Export to global scope
    window.PixiPlayer = PixiPlayer;

})();
