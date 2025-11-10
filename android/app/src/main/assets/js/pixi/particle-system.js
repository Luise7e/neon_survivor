/* ===================================
   PARTICLE SYSTEM - Sistema de partículas eficiente
   Explosiones, trails, efectos visuales con pooling
   ================================== */

(function() {
    'use strict';

    class Particle {
        constructor() {
            this.x = 0;
            this.y = 0;
            this.vx = 0;
            this.vy = 0;
            this.life = 1;
            this.maxLife = 1;
            this.size = 4;
            this.color = 0xffffff;
            this.alpha = 1;
            this.rotation = 0;
            this.rotationSpeed = 0;
            this.gravity = 0;
            this.friction = 0.98;
            this.alive = false;
        }

        reset(config = {}) {
            this.x = config.x || 0;
            this.y = config.y || 0;
            this.vx = config.vx || 0;
            this.vy = config.vy || 0;
            this.life = config.life || 1;
            this.maxLife = config.life || 1;
            this.size = config.size || 4;
            this.color = config.color || 0xffffff;
            this.alpha = 1;
            this.rotation = config.rotation || 0;
            this.rotationSpeed = config.rotationSpeed || 0;
            this.gravity = config.gravity || 0;
            this.friction = config.friction || 0.98;
            this.alive = true;
        }

        update(deltaTime) {
            if (!this.alive) return;

            // Update position
            this.x += this.vx * deltaTime;
            this.y += this.vy * deltaTime;

            // Apply gravity
            this.vy += this.gravity * deltaTime;

            // Apply friction
            this.vx *= this.friction;
            this.vy *= this.friction;

            // Update rotation
            this.rotation += this.rotationSpeed * deltaTime;

            // Update life
            this.life -= deltaTime;
            if (this.life <= 0) {
                this.alive = false;
                return;
            }

            // Fade out
            this.alpha = this.life / this.maxLife;
        }
    }

    class ParticleEmitter {
        constructor(config = {}) {
            this.x = config.x || 0;
            this.y = config.y || 0;
            this.maxParticles = config.maxParticles || 100;
            this.particles = [];
            this.graphics = new PIXI.Graphics();
            this.active = true;

            // Emitter properties
            this.emissionRate = config.emissionRate || 10; // particles per second
            this.emissionTimer = 0;
            this.burstMode = config.burstMode || false;

            // Default particle config
            this.particleConfig = {
                life: config.life || 1,
                size: config.size || 4,
                color: config.color || 0xffffff,
                speed: config.speed || 100,
                spread: config.spread || Math.PI * 2, // Full circle
                direction: config.direction || 0,
                gravity: config.gravity || 0,
                friction: config.friction || 0.98,
                rotationSpeed: config.rotationSpeed || 0
            };

            // Create particle pool
            for (let i = 0; i < this.maxParticles; i++) {
                this.particles.push(new Particle());
            }
        }

        emit(count = 1, x = null, y = null) {
            const emitX = x !== null ? x : this.x;
            const emitY = y !== null ? y : this.y;

            for (let i = 0; i < count; i++) {
                // Find available particle
                const particle = this.particles.find(p => !p.alive);
                if (!particle) break;

                // Calculate velocity
                const angle = this.particleConfig.direction + 
                             (Math.random() - 0.5) * this.particleConfig.spread;
                const speed = this.particleConfig.speed * (0.5 + Math.random() * 0.5);

                particle.reset({
                    x: emitX,
                    y: emitY,
                    vx: Math.cos(angle) * speed,
                    vy: Math.sin(angle) * speed,
                    life: this.particleConfig.life * (0.8 + Math.random() * 0.4),
                    size: this.particleConfig.size * (0.8 + Math.random() * 0.4),
                    color: this.particleConfig.color,
                    gravity: this.particleConfig.gravity,
                    friction: this.particleConfig.friction,
                    rotationSpeed: this.particleConfig.rotationSpeed
                });
            }
        }

        update(deltaTime) {
            if (!this.active) return;

            // Continuous emission
            if (!this.burstMode && this.emissionRate > 0) {
                this.emissionTimer += deltaTime;
                const emissionInterval = 1 / this.emissionRate;

                while (this.emissionTimer >= emissionInterval) {
                    this.emit(1);
                    this.emissionTimer -= emissionInterval;
                }
            }

            // Update all particles
            for (const particle of this.particles) {
                if (particle.alive) {
                    particle.update(deltaTime);
                }
            }
        }

        render() {
            this.graphics.clear();

            for (const particle of this.particles) {
                if (!particle.alive) continue;

                this.graphics.circle(particle.x, particle.y, particle.size);
                this.graphics.fill({ 
                    color: particle.color, 
                    alpha: particle.alpha 
                });
            }
        }

        setPosition(x, y) {
            this.x = x;
            this.y = y;
        }

        burst(count) {
            this.emit(count);
        }

        getAliveCount() {
            return this.particles.filter(p => p.alive).length;
        }

        clear() {
            this.particles.forEach(p => p.alive = false);
        }

        destroy() {
            this.active = false;
            this.clear();
            if (this.graphics) {
                this.graphics.destroy();
            }
        }
    }

    class ParticleSystem {
        /**
         * Returns the total number of active (alive) particles in all emitters
         */
        getActiveParticleCount() {
            return this.emitters.reduce((sum, emitter) => sum + emitter.getAliveCount(), 0);
        }
        constructor(scene) {
            this.scene = scene;
            this.emitters = [];
            this.container = new PIXI.Container();
            this.container.label = 'particles';
            
            // Add to effects layer
            if (scene && scene.layerManager) {
                scene.layerManager.addToLayer('effects', this.container, 200);
            }
        }

        // Create explosion effect
        createExplosion(x, y, config = {}) {
            const emitter = new ParticleEmitter({
                x: x,
                y: y,
                maxParticles: config.particleCount || 30,
                burstMode: true,
                life: config.life || 0.5,
                size: config.size || 6,
                color: config.color || 0xff6600,
                speed: config.speed || 200,
                spread: Math.PI * 2,
                gravity: config.gravity || 100,
                friction: 0.95
            });

            emitter.burst(config.particleCount || 30);
            this.container.addChild(emitter.graphics);
            this.emitters.push(emitter);

            // Auto-remove after particles die
            setTimeout(() => {
                this.removeEmitter(emitter);
            }, (config.life || 0.5) * 1000 + 100);

            return emitter;
        }

        // Create trail effect
        createTrail(x, y, config = {}) {
            const emitter = new ParticleEmitter({
                x: x,
                y: y,
                maxParticles: config.maxParticles || 50,
                emissionRate: config.emissionRate || 30,
                burstMode: false,
                life: config.life || 0.3,
                size: config.size || 3,
                color: config.color || 0x00ffff,
                speed: config.speed || 20,
                spread: config.spread || Math.PI / 4,
                direction: config.direction || Math.PI,
                gravity: 0,
                friction: 0.9
            });

            this.container.addChild(emitter.graphics);
            this.emitters.push(emitter);

            return emitter;
        }

        // Create impact effect
        createImpact(x, y, config = {}) {
            const emitter = new ParticleEmitter({
                x: x,
                y: y,
                maxParticles: config.particleCount || 20,
                burstMode: true,
                life: config.life || 0.3,
                size: config.size || 4,
                color: config.color || 0xffffff,
                speed: config.speed || 150,
                spread: Math.PI,
                direction: config.direction || 0,
                gravity: 0,
                friction: 0.92
            });

            emitter.burst(config.particleCount || 20);
            this.container.addChild(emitter.graphics);
            this.emitters.push(emitter);

            setTimeout(() => {
                this.removeEmitter(emitter);
            }, (config.life || 0.3) * 1000 + 100);

            return emitter;
        }

        // Create heal effect
        createHealEffect(x, y, config = {}) {
            const emitter = new ParticleEmitter({
                x: x,
                y: y,
                maxParticles: 20,
                burstMode: true,
                life: 0.8,
                size: 5,
                color: 0x00ff00,
                speed: 80,
                spread: Math.PI * 2,
                gravity: -50, // Float up
                friction: 0.98
            });

            emitter.burst(20);
            this.container.addChild(emitter.graphics);
            this.emitters.push(emitter);

            setTimeout(() => {
                this.removeEmitter(emitter);
            }, 900);

            return emitter;
        }

        update(deltaTime) {
            // Update all emitters
            for (let i = this.emitters.length - 1; i >= 0; i--) {
                const emitter = this.emitters[i];
                emitter.update(deltaTime);
                emitter.render();

                // Remove inactive burst emitters with no alive particles
                if (emitter.burstMode && emitter.getAliveCount() === 0 && !emitter.active) {
                    this.removeEmitter(emitter);
                }
            }
        }

        removeEmitter(emitter) {
            const index = this.emitters.indexOf(emitter);
            if (index !== -1) {
                this.emitters.splice(index, 1);
                if (emitter.graphics && emitter.graphics.parent) {
                    this.container.removeChild(emitter.graphics);
                }
                emitter.destroy();
            }
        }

        clearAll() {
            for (const emitter of this.emitters) {
                emitter.destroy();
                if (emitter.graphics && emitter.graphics.parent) {
                    this.container.removeChild(emitter.graphics);
                }
            }
            this.emitters = [];
        }

        getStats() {
            const totalParticles = this.emitters.reduce((sum, e) => sum + e.getAliveCount(), 0);
            return {
                emitters: this.emitters.length,
                particles: totalParticles
            };
        }

        destroy() {
            this.clearAll();
            if (this.container) {
                this.container.destroy({ children: true });
            }
        }
    }

    // Export to global scope
    window.Particle = Particle;
    window.ParticleEmitter = ParticleEmitter;
    window.ParticleSystem = ParticleSystem;

})();
