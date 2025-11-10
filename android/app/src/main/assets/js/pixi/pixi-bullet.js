/* ===================================
   PIXI BULLET - Bullet entity with PixiJS rendering
   Extends PixiEntity base class, includes trail effect
   ================================== */

(function() {
    'use strict';

    class PixiBullet extends PixiEntity {
        constructor(config = {}) {
            super({
                ...config,
                layer: 'foreground',
                zIndex: 75,
                glowColor: config.color || 0x00ffff,
                glowStrength: 3,
                maxAge: config.lifetime || 2.0 // Auto-destroy after 2 seconds
            });

            // Bullet-specific properties
            this.radius = config.radius || 8;
            this.color = config.color || 0x00ffff;
            this.damage = config.damage || 25;
            this.speed = config.speed || 600;
            
            // Owner (player or enemy)
            this.owner = config.owner || null;
            
            // Trail effect
            this.trail = [];
            this.trailLength = config.trailLength || 5;
            this.trailOpacity = config.trailOpacity || 0.5;

            // Create sprite
            this.init();
        }

        init() {
            // Generate bullet texture
            const texture = TextureGenerator.createBulletSprite(this.radius, this.color);
            this.createSprite(texture);
        }

        // Shoot bullet in direction
        shoot(x, y, angle, speed = null) {
            this.setPosition(x, y);
            this.setRotation(angle);

            const bulletSpeed = speed || this.speed;
            this.vx = Math.cos(angle) * bulletSpeed;
            this.vy = Math.sin(angle) * bulletSpeed;

            this.alive = true;
            this.active = true;
            this.age = 0;

            if (this.sprite) {
                this.sprite.visible = true;
            }
        }

        // Update bullet with trail
        update(deltaTime) {
            if (!this.alive) return;

            // Add current position to trail
            if (this.age > 0 && this.trail.length < this.trailLength) {
                this.trail.push({
                    x: this.x,
                    y: this.y,
                    alpha: this.trailOpacity
                });
            }

            // Fade trail
            this.trail = this.trail.map(point => ({
                ...point,
                alpha: point.alpha * 0.9
            })).filter(point => point.alpha > 0.05);

            // Update base entity
            super.update(deltaTime);

            // Fade out near end of life
            if (this.maxAge - this.age < 0.3) {
                this.alpha = (this.maxAge - this.age) / 0.3;
                this.setAlpha(this.alpha);
            }
        }

        // Hit target
        hit() {
            this.alive = false;
            
            // Quick explosion effect
            if (this.sprite) {
                const startTime = Date.now();
                const duration = 0.15;

                const animate = () => {
                    const elapsed = (Date.now() - startTime) / 1000;
                    const progress = Math.min(elapsed / duration, 1);

                    this.scale = 1 + progress * 2;
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

        // Check collision with entity
        checkCollision(entity, hitRadius = null) {
            if (!this.alive || !entity.alive) return false;

            const radius = hitRadius || (this.radius + entity.radius);
            return this.distanceTo(entity) < radius;
        }

        // Reset for pooling
        reset(config = {}) {
            super.reset(config);
            
            this.radius = config.radius || 8;
            this.color = config.color || 0x00ffff;
            this.damage = config.damage || 25;
            this.speed = config.speed || 600;
            this.owner = config.owner || null;
            this.trail = [];
            this.maxAge = config.lifetime || 2.0;
        }

        // Render trail (call this in game loop if needed)
        renderTrail(graphics) {
            if (!graphics || this.trail.length === 0) return;

            graphics.clear();

            for (let i = 0; i < this.trail.length; i++) {
                const point = this.trail[i];
                const size = this.radius * (1 - i / this.trail.length);
                
                graphics.circle(point.x, point.y, size);
                graphics.fill({ color: this.color, alpha: point.alpha });
            }
        }
    }

    // Export to global scope
    window.PixiBullet = PixiBullet;

})();
