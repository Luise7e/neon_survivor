/**
 * @fileoverview Sistema de texto flotante para mostrar daño, power-ups y mensajes
 * Incluye animaciones fade-out y float-up con easing
 */

(function(window) {
    'use strict';

    /**
     * Texto flotante individual
     * @constructor
     * @param {string} text - Texto a mostrar
     * @param {Object} config - Configuración del texto
     */
    function FloatingText(text, config) {
        PIXI.Container.call(this);
        
        this.config = config || {};
        this.lifetime = this.config.lifetime || 1.5; // segundos
        this.age = 0;
        this.velocity = this.config.velocity || { x: 0, y: -50 };
        this.acceleration = this.config.acceleration || { x: 0, y: -20 };
        this.fadeStart = this.config.fadeStart || 0.5; // Empezar fade después de 50% del lifetime
        
        this.init(text);
    }

    FloatingText.prototype = Object.create(PIXI.Container.prototype);
    FloatingText.prototype.constructor = FloatingText;

    FloatingText.prototype.init = function(text) {
        // Estilo del texto según tipo
        var style = this.getTextStyle();
        
        this.textSprite = new PIXI.Text(text, style);
        this.textSprite.anchor.set(0.5);
        this.addChild(this.textSprite);
        
        // Escala inicial (animación de entrada)
        this.scale.set(0.5);
    };

    FloatingText.prototype.getTextStyle = function() {
        var type = this.config.type || 'default';
        var baseStyle = {
            fontFamily: 'Arial',
            fontWeight: 'bold',
            stroke: 0x000000,
            strokeThickness: 4,
            dropShadow: true,
            dropShadowBlur: 4,
            dropShadowDistance: 2
        };
        
        switch(type) {
            case 'damage':
                return Object.assign({}, baseStyle, {
                    fontSize: this.config.fontSize || 24,
                    fill: this.config.color || 0xFF0000,
                    dropShadowColor: 0xFF0000
                });
            
            case 'heal':
                return Object.assign({}, baseStyle, {
                    fontSize: this.config.fontSize || 20,
                    fill: this.config.color || 0x00FF00,
                    dropShadowColor: 0x00FF00
                });
            
            case 'powerup':
                return Object.assign({}, baseStyle, {
                    fontSize: this.config.fontSize || 18,
                    fill: this.config.color || 0xFFFF00,
                    dropShadowColor: 0xFFFF00
                });
            
            case 'critical':
                return Object.assign({}, baseStyle, {
                    fontSize: this.config.fontSize || 32,
                    fill: [0xFF0000, 0xFFFF00], // Gradiente
                    dropShadowColor: 0xFF0000,
                    strokeThickness: 5
                });
            
            case 'message':
                return Object.assign({}, baseStyle, {
                    fontSize: this.config.fontSize || 16,
                    fill: this.config.color || 0xFFFFFF,
                    dropShadowColor: 0x00FFFF
                });
            
            default:
                return Object.assign({}, baseStyle, {
                    fontSize: this.config.fontSize || 18,
                    fill: this.config.color || 0xFFFFFF,
                    dropShadowColor: 0x000000
                });
        }
    };

    FloatingText.prototype.update = function(deltaTime) {
        this.age += deltaTime;
        
        // Animación de entrada (pop-in)
        if (this.age < 0.1) {
            var entryProgress = this.age / 0.1;
            var scale = this.easeOutBack(entryProgress) * 1.2;
            this.scale.set(scale);
        } else if (this.scale.x > 1) {
            // Volver a escala normal
            this.scale.set(Math.max(1, this.scale.x - deltaTime * 2));
        }
        
        // Movimiento
        this.velocity.x += this.acceleration.x * deltaTime;
        this.velocity.y += this.acceleration.y * deltaTime;
        
        this.x += this.velocity.x * deltaTime;
        this.y += this.velocity.y * deltaTime;
        
        // Fade out
        var fadeProgress = (this.age - this.fadeStart * this.lifetime) / (this.lifetime * (1 - this.fadeStart));
        if (fadeProgress > 0) {
            this.alpha = 1 - Math.min(1, fadeProgress);
        }
        
        // Wiggle para críticos
        if (this.config.type === 'critical') {
            this.textSprite.rotation = Math.sin(this.age * 20) * 0.1;
        }
        
        return this.age < this.lifetime;
    };

    FloatingText.prototype.easeOutBack = function(x) {
        var c1 = 1.70158;
        var c3 = c1 + 1;
        return 1 + c3 * Math.pow(x - 1, 3) + c1 * Math.pow(x - 1, 2);
    };

    // ============================================================================
    // FLOATING TEXT MANAGER
    // ============================================================================

    /**
     * Gestor de textos flotantes
     * @constructor
     * @param {PIXI.Container} parent - Contenedor padre
     */
    function FloatingTextManager(parent) {
        this.parent = parent;
        this.container = new PIXI.Container();
        this.container.name = 'FloatingTextLayer';
        this.container.zIndex = 900; // Debajo del HUD pero encima de entidades
        
        this.texts = [];
        
        if (parent) {
            parent.addChild(this.container);
        }
    }

    /**
     * Crear texto flotante de daño
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} damage - Cantidad de daño
     * @param {boolean} critical - Si es crítico
     */
    FloatingTextManager.prototype.showDamage = function(x, y, damage, critical) {
        var config = {
            type: critical ? 'critical' : 'damage',
            lifetime: critical ? 2 : 1.5,
            velocity: {
                x: (Math.random() - 0.5) * 40,
                y: critical ? -80 : -60
            }
        };
        
        var text = critical ? damage + '!' : '-' + damage;
        this.createText(text, x, y, config);
    };

    /**
     * Crear texto flotante de curación
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {number} amount - Cantidad curada
     */
    FloatingTextManager.prototype.showHeal = function(x, y, amount) {
        var config = {
            type: 'heal',
            lifetime: 1.5,
            velocity: { x: 0, y: -40 }
        };
        
        this.createText('+' + amount, x, y, config);
    };

    /**
     * Crear texto flotante de power-up
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {string} message - Mensaje del power-up
     */
    FloatingTextManager.prototype.showPowerUp = function(x, y, message) {
        var config = {
            type: 'powerup',
            lifetime: 2,
            velocity: { x: 0, y: -30 },
            acceleration: { x: 0, y: 10 }
        };
        
        this.createText(message, x, y, config);
    };

    /**
     * Crear texto flotante de mensaje
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {string} message - Mensaje
     * @param {Object} customConfig - Configuración personalizada
     */
    FloatingTextManager.prototype.showMessage = function(x, y, message, customConfig) {
        var config = Object.assign({
            type: 'message',
            lifetime: 2,
            velocity: { x: 0, y: -25 }
        }, customConfig || {});
        
        this.createText(message, x, y, config);
    };

    /**
     * Crear texto flotante genérico
     * @param {string} text - Texto
     * @param {number} x - Posición X
     * @param {number} y - Posición Y
     * @param {Object} config - Configuración
     */
    FloatingTextManager.prototype.createText = function(text, x, y, config) {
        var floatingText = new FloatingText(text, config);
        floatingText.position.set(x, y);
        
        this.container.addChild(floatingText);
        this.texts.push(floatingText);
        
        return floatingText;
    };

    /**
     * Actualizar todos los textos flotantes
     * @param {number} deltaTime - Delta time
     */
    FloatingTextManager.prototype.update = function(deltaTime) {
        for (var i = this.texts.length - 1; i >= 0; i--) {
            var text = this.texts[i];
            var alive = text.update(deltaTime);
            
            if (!alive) {
                this.container.removeChild(text);
                text.destroy();
                this.texts.splice(i, 1);
            }
        }
    };

    /**
     * Limpiar todos los textos
     */
    FloatingTextManager.prototype.clear = function() {
        for (var i = 0; i < this.texts.length; i++) {
            this.texts[i].destroy();
        }
        this.texts = [];
        this.container.removeChildren();
    };

    /**
     * Obtener contenedor
     */
    FloatingTextManager.prototype.getContainer = function() {
        return this.container;
    };

    /**
     * Limpiar recursos
     */
    FloatingTextManager.prototype.destroy = function() {
        this.clear();
        this.container.destroy({ children: true });
    };

    // ============================================================================
    // PRESETS RÁPIDOS
    // ============================================================================

    FloatingTextManager.prototype.presets = {
        /**
         * Texto de combo
         */
        combo: function(manager, x, y, comboCount) {
            manager.createText('x' + comboCount + ' COMBO!', x, y, {
                type: 'message',
                color: 0xFF00FF,
                fontSize: 20 + comboCount * 2,
                lifetime: 1.5,
                velocity: { x: 0, y: -50 },
                acceleration: { x: 0, y: -30 }
            });
        },
        
        /**
         * Texto de nivel subido
         */
        levelUp: function(manager, x, y, level) {
            manager.createText('LEVEL ' + level + '!', x, y, {
                type: 'powerup',
                fontSize: 28,
                lifetime: 2.5,
                velocity: { x: 0, y: -40 },
                acceleration: { x: 0, y: -10 }
            });
        },
        
        /**
         * Texto de oleada completada
         */
        waveComplete: function(manager, x, y, wave) {
            manager.createText('WAVE ' + wave + ' COMPLETE!', x, y, {
                type: 'message',
                color: 0x00FF00,
                fontSize: 24,
                lifetime: 3,
                velocity: { x: 0, y: -20 }
            });
        },
        
        /**
         * Texto de headshot
         */
        headshot: function(manager, x, y) {
            manager.createText('HEADSHOT!', x, y, {
                type: 'critical',
                fontSize: 28,
                lifetime: 2,
                velocity: { x: 0, y: -70 }
            });
        },
        
        /**
         * Texto de multikill
         */
        multiKill: function(manager, x, y, kills) {
            var messages = {
                2: 'DOUBLE KILL!',
                3: 'TRIPLE KILL!',
                4: 'MEGA KILL!',
                5: 'ULTRA KILL!',
                6: 'MONSTER KILL!'
            };
            
            var message = messages[kills] || kills + ' KILLS!';
            
            manager.createText(message, x, y, {
                type: 'critical',
                fontSize: 24 + kills * 2,
                lifetime: 2 + kills * 0.2,
                velocity: { x: 0, y: -60 }
            });
        }
    };

    // ============================================================================
    // EXPORTS
    // ============================================================================

    window.FloatingText = FloatingText;
    window.FloatingTextManager = FloatingTextManager;

})(window);
