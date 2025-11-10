/**
 * @fileoverview Sistema de HUD en PixiJS con componentes visuales estilo neon
 * Incluye barras de salud, munición, super, contador de oleadas
 */

(function(window) {
    'use strict';

    // ============================================================================
    // BASE HUD COMPONENT
    // ============================================================================

    /**
     * Componente base para elementos HUD
     * @constructor
     * @param {Object} config - Configuración del componente
     */
    function HUDComponent(config) {
        PIXI.Container.call(this);
        
        this.config = config || {};
        this.neonColor = this.config.neonColor || 0x00FFFF;
        this.glowIntensity = this.config.glowIntensity || 0.8;
        this.animationSpeed = this.config.animationSpeed || 0.1;
        
        this.init();
    }

    HUDComponent.prototype = Object.create(PIXI.Container.prototype);
    HUDComponent.prototype.constructor = HUDComponent;

    HUDComponent.prototype.init = function() {
        // Override en subclases
    };

    HUDComponent.prototype.update = function(deltaTime) {
        // Override en subclases
    };

    HUDComponent.prototype.applyGlowFilter = function(graphics) {
        if (!PIXI.GlowFilter) return;
        
        var glow = new PIXI.GlowFilter({
            distance: 10,
            outerStrength: this.glowIntensity,
            innerStrength: 0.5,
            color: this.neonColor,
            quality: 0.5
        });
        
        graphics.filters = [glow];
    };

    // ============================================================================
    // HEALTH BAR
    // ============================================================================

    /**
     * Barra de vida con estilo neon
     * @constructor
     * @param {Object} config - width, height, maxHealth, neonColor
     */
    function HealthBar(config) {
        HUDComponent.call(this, config);
        
        this.width = config.width || 200;
        this.height = config.height || 20;
        this.maxHealth = config.maxHealth || 100;
        this.currentHealth = this.maxHealth;
        this.targetHealth = this.maxHealth;
    }

    HealthBar.prototype = Object.create(HUDComponent.prototype);
    HealthBar.prototype.constructor = HealthBar;

    HealthBar.prototype.init = function() {
        // Fondo oscuro
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, 0.6);
        this.background.drawRoundedRect(0, 0, this.width, this.height, 5);
        this.background.endFill();
        this.addChild(this.background);
        
        // Barra de daño (rojo oscuro)
        this.damageBar = new PIXI.Graphics();
        this.addChild(this.damageBar);
        
        // Barra principal de vida
        this.healthBar = new PIXI.Graphics();
        this.addChild(this.healthBar);
        
        // Borde con glow
        this.border = new PIXI.Graphics();
        this.border.lineStyle(2, this.neonColor, 1);
        this.border.drawRoundedRect(0, 0, this.width, this.height, 5);
        this.applyGlowFilter(this.border);
        this.addChild(this.border);
        
        // Texto de vida
        this.healthText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 12,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: this.neonColor,
            dropShadowBlur: 4,
            dropShadowDistance: 0
        });
        this.healthText.anchor.set(0.5);
        this.healthText.position.set(this.width / 2, this.height / 2);
        this.addChild(this.healthText);
        
        this.updateGraphics();
    };

    HealthBar.prototype.setHealth = function(value) {
        this.targetHealth = Math.max(0, Math.min(value, this.maxHealth));
    };

    HealthBar.prototype.update = function(deltaTime) {
        // Smooth health transition
        if (this.currentHealth !== this.targetHealth) {
            var diff = this.targetHealth - this.currentHealth;
            this.currentHealth += diff * this.animationSpeed;
            
            if (Math.abs(diff) < 0.5) {
                this.currentHealth = this.targetHealth;
            }
            
            this.updateGraphics();
        }
    };

    HealthBar.prototype.updateGraphics = function() {
        var percentage = this.currentHealth / this.maxHealth;
        var barWidth = (this.width - 4) * percentage;
        
        // Barra de daño (se queda atrás del valor actual)
        this.damageBar.clear();
        this.damageBar.beginFill(0xFF0000, 0.5);
        this.damageBar.drawRoundedRect(2, 2, this.width - 4, this.height - 4, 3);
        this.damageBar.endFill();
        
        // Color según porcentaje de vida
        var color = 0x00FF00; // Verde
        if (percentage < 0.3) {
            color = 0xFF0000; // Rojo
        } else if (percentage < 0.6) {
            color = 0xFFFF00; // Amarillo
        }
        
        // Barra principal
        this.healthBar.clear();
        this.healthBar.beginFill(color, 0.8);
        this.healthBar.drawRoundedRect(2, 2, barWidth, this.height - 4, 3);
        this.healthBar.endFill();
        
        // Texto
        this.healthText.text = Math.ceil(this.currentHealth) + ' / ' + this.maxHealth;
    };

    // ============================================================================
    // AMMO COUNTER
    // ============================================================================

    /**
     * Contador de munición
     * @constructor
     * @param {Object} config - size, maxAmmo, neonColor
     */
    function AmmoCounter(config) {
        HUDComponent.call(this, config);
        
        this.size = config.size || 40;
        this.maxAmmo = config.maxAmmo || 30;
        this.currentAmmo = this.maxAmmo;
    }

    AmmoCounter.prototype = Object.create(HUDComponent.prototype);
    AmmoCounter.prototype.constructor = AmmoCounter;

    AmmoCounter.prototype.init = function() {
        // Icono de bala
        this.bulletIcon = new PIXI.Graphics();
        this.bulletIcon.beginFill(this.neonColor, 0.8);
        this.bulletIcon.drawRect(0, 0, 8, 20);
        this.bulletIcon.endFill();
        this.bulletIcon.position.set(0, this.size / 2 - 10);
        this.applyGlowFilter(this.bulletIcon);
        this.addChild(this.bulletIcon);
        
        // Texto de munición
        this.ammoText = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 24,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: this.neonColor,
            dropShadowBlur: 6,
            dropShadowDistance: 0
        });
        this.ammoText.anchor.set(0, 0.5);
        this.ammoText.position.set(15, this.size / 2);
        this.addChild(this.ammoText);
        
        this.updateGraphics();
    };

    AmmoCounter.prototype.setAmmo = function(value) {
        this.currentAmmo = Math.max(0, Math.min(value, this.maxAmmo));
        this.updateGraphics();
    };

    AmmoCounter.prototype.updateGraphics = function() {
        this.ammoText.text = this.currentAmmo + ' / ' + this.maxAmmo;
        
        // Cambiar color si está bajo
        if (this.currentAmmo === 0) {
            this.ammoText.style.fill = 0xFF0000;
            this.ammoText.style.dropShadowColor = 0xFF0000;
        } else if (this.currentAmmo < this.maxAmmo * 0.3) {
            this.ammoText.style.fill = 0xFFFF00;
            this.ammoText.style.dropShadowColor = 0xFFFF00;
        } else {
            this.ammoText.style.fill = 0xFFFFFF;
            this.ammoText.style.dropShadowColor = this.neonColor;
        }
    };

    // ============================================================================
    // SUPER BAR
    // ============================================================================

    /**
     * Barra de habilidad especial
     * @constructor
     * @param {Object} config - width, height, neonColor
     */
    function SuperBar(config) {
        HUDComponent.call(this, config);
        
        this.width = config.width || 150;
        this.height = config.height || 15;
        this.maxCharge = 100;
        this.currentCharge = 0;
        this.targetCharge = 0;
        this.pulseTime = 0;
    }

    SuperBar.prototype = Object.create(HUDComponent.prototype);
    SuperBar.prototype.constructor = SuperBar;

    SuperBar.prototype.init = function() {
        // Fondo
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, 0.6);
        this.background.drawRoundedRect(0, 0, this.width, this.height, 5);
        this.background.endFill();
        this.addChild(this.background);
        
        // Barra de carga
        this.chargeBar = new PIXI.Graphics();
        this.addChild(this.chargeBar);
        
        // Borde
        this.border = new PIXI.Graphics();
        this.border.lineStyle(2, this.neonColor, 1);
        this.border.drawRoundedRect(0, 0, this.width, this.height, 5);
        this.applyGlowFilter(this.border);
        this.addChild(this.border);
        
        // Label
        this.label = new PIXI.Text('SUPER', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: this.neonColor,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: this.neonColor,
            dropShadowBlur: 4,
            dropShadowDistance: 0
        });
        this.label.anchor.set(0.5);
        this.label.position.set(this.width / 2, this.height / 2);
        this.addChild(this.label);
        
        this.updateGraphics();
    };

    SuperBar.prototype.setCharge = function(value) {
        this.targetCharge = Math.max(0, Math.min(value, this.maxCharge));
    };

    SuperBar.prototype.update = function(deltaTime) {
        // Smooth charge transition
        if (this.currentCharge !== this.targetCharge) {
            var diff = this.targetCharge - this.currentCharge;
            this.currentCharge += diff * this.animationSpeed;
            
            if (Math.abs(diff) < 0.5) {
                this.currentCharge = this.targetCharge;
            }
            
            this.updateGraphics();
        }
        
        // Pulse cuando está completo
        if (this.currentCharge >= this.maxCharge) {
            this.pulseTime += deltaTime;
            var pulse = Math.sin(this.pulseTime * 5) * 0.3 + 0.7;
            this.border.alpha = pulse;
            this.label.alpha = pulse;
        } else {
            this.border.alpha = 1;
            this.label.alpha = 1;
            this.pulseTime = 0;
        }
    };

    SuperBar.prototype.updateGraphics = function() {
        var percentage = this.currentCharge / this.maxCharge;
        var barWidth = (this.width - 4) * percentage;
        
        this.chargeBar.clear();
        this.chargeBar.beginFill(this.neonColor, 0.8);
        this.chargeBar.drawRoundedRect(2, 2, barWidth, this.height - 4, 3);
        this.chargeBar.endFill();
        
        // Texto de porcentaje
        if (this.currentCharge >= this.maxCharge) {
            this.label.text = 'READY!';
        } else {
            this.label.text = Math.floor(percentage * 100) + '%';
        }
    };

    // ============================================================================
    // WAVE COUNTER
    // ============================================================================

    /**
     * Contador de oleadas
     * @constructor
     * @param {Object} config - size, neonColor
     */
    function WaveCounter(config) {
        HUDComponent.call(this, config);
        
        this.size = config.size || 60;
        this.currentWave = 1;
        this.enemiesLeft = 0;
    }

    WaveCounter.prototype = Object.create(HUDComponent.prototype);
    WaveCounter.prototype.constructor = WaveCounter;

    WaveCounter.prototype.init = function() {
        // Fondo circular
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, 0.7);
        this.background.drawCircle(this.size / 2, this.size / 2, this.size / 2);
        this.background.endFill();
        this.addChild(this.background);
        
        // Borde con glow
        this.border = new PIXI.Graphics();
        this.border.lineStyle(3, this.neonColor, 1);
        this.border.drawCircle(this.size / 2, this.size / 2, this.size / 2 - 2);
        this.applyGlowFilter(this.border);
        this.addChild(this.border);
        
        // Label WAVE
        this.waveLabel = new PIXI.Text('WAVE', {
            fontFamily: 'Arial',
            fontSize: 10,
            fill: this.neonColor,
            fontWeight: 'bold'
        });
        this.waveLabel.anchor.set(0.5);
        this.waveLabel.position.set(this.size / 2, this.size / 2 - 10);
        this.addChild(this.waveLabel);
        
        // Número de oleada
        this.waveNumber = new PIXI.Text('', {
            fontFamily: 'Arial',
            fontSize: 20,
            fill: 0xFFFFFF,
            fontWeight: 'bold',
            dropShadow: true,
            dropShadowColor: this.neonColor,
            dropShadowBlur: 6,
            dropShadowDistance: 0
        });
        this.waveNumber.anchor.set(0.5);
        this.waveNumber.position.set(this.size / 2, this.size / 2 + 8);
        this.addChild(this.waveNumber);
        
        this.updateGraphics();
    };

    WaveCounter.prototype.setWave = function(wave, enemiesLeft) {
        this.currentWave = wave;
        this.enemiesLeft = enemiesLeft || 0;
        this.updateGraphics();
    };

    WaveCounter.prototype.updateGraphics = function() {
        this.waveNumber.text = this.currentWave;
        
        if (this.enemiesLeft > 0) {
            this.waveLabel.text = this.enemiesLeft + ' LEFT';
        } else {
            this.waveLabel.text = 'WAVE';
        }
    };

    // ============================================================================
    // HUD MANAGER
    // ============================================================================

    /**
     * Gestor principal del HUD
     * @constructor
     * @param {PIXI.Application} app - Aplicación PixiJS
     * @param {Object} config - Configuración del HUD
     */
    function HUDManager(app, config) {
        this.app = app;
        this.config = config || {};
        
        this.container = new PIXI.Container();
        this.container.name = 'HUD';
        this.container.zIndex = 1000; // Siempre encima
        
        this.components = {};
        
        this.init();
    }

    HUDManager.prototype.init = function() {
        // Crear componentes HUD
        var margin = 20;
        var screenWidth = this.app.screen.width;
        var screenHeight = this.app.screen.height;
        
        // Health bar (arriba izquierda)
        this.components.healthBar = new HealthBar({
            width: 200,
            height: 20,
            maxHealth: 100,
            neonColor: 0x00FF88
        });
        this.components.healthBar.position.set(margin, margin);
        this.container.addChild(this.components.healthBar);
        
        // Ammo counter (abajo derecha)
        this.components.ammoCounter = new AmmoCounter({
            size: 40,
            maxAmmo: 30,
            neonColor: 0x00FFFF
        });
        this.components.ammoCounter.position.set(screenWidth - 150, screenHeight - 60);
        this.container.addChild(this.components.ammoCounter);
        
        // Super bar (abajo centro)
        this.components.superBar = new SuperBar({
            width: 200,
            height: 15,
            neonColor: 0xFF00FF
        });
        this.components.superBar.position.set(screenWidth / 2 - 100, screenHeight - 40);
        this.container.addChild(this.components.superBar);
        
        // Wave counter (arriba derecha)
        this.components.waveCounter = new WaveCounter({
            size: 60,
            neonColor: 0xFFFF00
        });
        this.components.waveCounter.position.set(screenWidth - 80, margin);
        this.container.addChild(this.components.waveCounter);
    };

    HUDManager.prototype.update = function(deltaTime) {
        // Actualizar todos los componentes
        for (var key in this.components) {
            if (this.components[key].update) {
                this.components[key].update(deltaTime);
            }
        }
    };

    HUDManager.prototype.setHealth = function(value) {
        if (this.components.healthBar) {
            this.components.healthBar.setHealth(value);
        }
    };

    HUDManager.prototype.setAmmo = function(current, max) {
        if (this.components.ammoCounter) {
            if (max !== undefined) {
                this.components.ammoCounter.maxAmmo = max;
            }
            this.components.ammoCounter.setAmmo(current);
        }
    };

    HUDManager.prototype.setSuper = function(value) {
        if (this.components.superBar) {
            this.components.superBar.setCharge(value);
        }
    };

    HUDManager.prototype.setWave = function(wave, enemiesLeft) {
        if (this.components.waveCounter) {
            this.components.waveCounter.setWave(wave, enemiesLeft);
        }
    };

    HUDManager.prototype.getContainer = function() {
        return this.container;
    };

    HUDManager.prototype.destroy = function() {
        for (var key in this.components) {
            if (this.components[key].destroy) {
                this.components[key].destroy();
            }
        }
        this.container.destroy({ children: true });
    };

    // ============================================================================
    // EXPORTS
    // ============================================================================

    window.HUDComponent = HUDComponent;
    window.HealthBar = HealthBar;
    window.AmmoCounter = AmmoCounter;
    window.SuperBar = SuperBar;
    window.WaveCounter = WaveCounter;
    window.HUDManager = HUDManager;

})(window);
