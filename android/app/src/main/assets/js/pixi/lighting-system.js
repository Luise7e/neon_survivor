/**
 * Lighting System for PixiJS
 * Provides dynamic lighting effects including spotlight, point lights, and ambient lighting
 */
(function(global) {
    'use strict';

    // Light source types
    var LIGHT_TYPES = {
        SPOTLIGHT: 'spotlight',
        POINT: 'point',
        AMBIENT: 'ambient'
    };

    /**
     * Individual light source
     */
    function LightSource(config) {
        this.id = Math.random().toString(36).substr(2, 9);
        this.type = config.type || LIGHT_TYPES.POINT;
        this.x = config.x || 0;
        this.y = config.y || 0;
        this.radius = config.radius || 200;
        this.intensity = config.intensity || 1.0;
        this.color = config.color || 0xFFFFFF;
        this.falloff = config.falloff || 1.0; // How quickly light fades
        this.pulseSpeed = config.pulseSpeed || 0;
        this.pulseAmount = config.pulseAmount || 0;
        this.flickerAmount = config.flickerAmount || 0;
        this.active = true;
        
        // Internal state
        this.baseIntensity = this.intensity;
        this.pulseTime = Math.random() * Math.PI * 2;
        this.nextFlickerTime = 0;
        
        // Create visual representation (glow sprite)
        this.sprite = null;
        this.createSprite();
    }

    LightSource.prototype.createSprite = function() {
        var PIXI = global.PIXI;
        if (!PIXI || !PIXI.Graphics) {
            console.warn('LightSource: PIXI Graphics not available');
            return;
        }

        // Create radial gradient effect using Graphics
        var graphics = new PIXI.Graphics();
        var size = this.radius * 2;
        
        // Extract RGB from hex color
        var r = (this.color >> 16) & 0xFF;
        var g = (this.color >> 8) & 0xFF;
        var b = this.color & 0xFF;
        
        // Draw multiple concentric circles with decreasing alpha for gradient effect
        var steps = 20;
        for (var i = steps; i > 0; i--) {
            var alpha = (i / steps) * this.intensity * 0.3;
            var currentRadius = (i / steps) * this.radius;
            
            graphics.circle(0, 0, currentRadius);
            graphics.fill({ 
                color: this.color, 
                alpha: alpha 
            });
        }

        // Generate texture from graphics
        var renderer = global.RendererAdapter ? global.RendererAdapter.instance : null;
        var pixiRenderer = renderer && renderer.pixiReady && renderer.app ? renderer.app.renderer : null;
        if (!pixiRenderer) {
            console.warn('LightSource: PixiJS renderer not ready, using Graphics directly');
            this.sprite = graphics;
            return;
        }

        var texture = pixiRenderer.generateTexture(graphics);
        this.sprite = new PIXI.Sprite(texture);
        this.sprite.anchor.set(0.5, 0.5);
        // Defensive: fallback to NORMAL if ADD is undefined
        var blendModes = PIXI.BLEND_MODES || {};
        this.sprite.blendMode = blendModes.ADD !== undefined ? blendModes.ADD : blendModes.NORMAL || 0;
        graphics.destroy();
    };

    LightSource.prototype.update = function(deltaTime) {
        if (!this.active) return;

        // Pulse effect
        if (this.pulseSpeed > 0) {
            this.pulseTime += deltaTime * this.pulseSpeed;
            var pulseFactor = 1.0 + Math.sin(this.pulseTime) * this.pulseAmount;
            this.intensity = this.baseIntensity * pulseFactor;
        }

        // Flicker effect
        if (this.flickerAmount > 0) {
            this.nextFlickerTime -= deltaTime;
            if (this.nextFlickerTime <= 0) {
                var flicker = 1.0 - Math.random() * this.flickerAmount;
                this.intensity = this.baseIntensity * flicker;
                this.nextFlickerTime = 0.05 + Math.random() * 0.1;
            }
        }

        // Update sprite
        if (this.sprite) {
            this.sprite.x = this.x;
            this.sprite.y = this.y;
            this.sprite.alpha = this.intensity;
            this.sprite.scale.set(this.radius / 100); // Base scale
        }
    };

    LightSource.prototype.setPosition = function(x, y) {
        this.x = x;
        this.y = y;
    };

    LightSource.prototype.destroy = function() {
        if (this.sprite) {
            this.sprite.destroy({ texture: true, baseTexture: true });
            this.sprite = null;
        }
    };

    /**
     * Lighting System Manager
     */
    function LightingSystem(scene) {
        this.scene = scene;
        this.lights = [];
        this.lightPool = [];
        this.maxLights = 20;
        
        // Ambient lighting
        this.ambientColor = 0x404060;
        this.ambientIntensity = 0.3;
        
        // Light container
        this.lightContainer = null;
        this.overlayContainer = null;
        
        // Player spotlight
        this.playerSpotlight = null;
        
        this.initialize();
    }

    LightingSystem.prototype.initialize = function() {
        var PIXI = global.PIXI;
        if (!PIXI || !PIXI.Container) {
            console.error('LightingSystem: PIXI not available');
            return;
        }

        // Create light container
    this.lightContainer = new PIXI.Container();
    var blendModes = PIXI.BLEND_MODES || {};
    this.lightContainer.blendMode = blendModes.ADD !== undefined ? blendModes.ADD : blendModes.NORMAL || 0;
        
        // Create overlay for darkness (subtract mode)
        this.overlayContainer = new PIXI.Container();
        
        // Add to scene
        if (this.scene && this.scene.layerManager) {
            this.scene.layerManager.addToLayer('effects', this.lightContainer);
            this.scene.layerManager.addToLayer('ui', this.overlayContainer);
        }

        // Create darkness overlay
        this.createDarknessOverlay();
        
        // Create player spotlight
        this.createPlayerSpotlight();

        console.log('LightingSystem initialized');
    };

    LightingSystem.prototype.createDarknessOverlay = function() {
        var PIXI = global.PIXI;
        if (!PIXI || !PIXI.Graphics) return;

        var graphics = new PIXI.Graphics();
        graphics.rect(0, 0, this.scene.width, this.scene.height);
        graphics.fill({ 
            color: this.ambientColor, 
            alpha: 1.0 - this.ambientIntensity 
        });

        this.overlayContainer.addChild(graphics);
    };

    LightingSystem.prototype.createPlayerSpotlight = function() {
        this.playerSpotlight = this.createLight({
            type: LIGHT_TYPES.SPOTLIGHT,
            radius: 400,
            intensity: 0.8,
            color: 0xFFFFAA,
            falloff: 0.8,
            pulseSpeed: 2,
            pulseAmount: 0.1
        });
    };

    LightingSystem.prototype.createLight = function(config) {
        var light;
        
        // Try to get from pool
        if (this.lightPool.length > 0) {
            light = this.lightPool.pop();
            // Reset properties
            light.type = config.type || LIGHT_TYPES.POINT;
            light.x = config.x || 0;
            light.y = config.y || 0;
            light.radius = config.radius || 200;
            light.intensity = config.intensity || 1.0;
            light.baseIntensity = light.intensity;
            light.color = config.color || 0xFFFFFF;
            light.falloff = config.falloff || 1.0;
            light.pulseSpeed = config.pulseSpeed || 0;
            light.pulseAmount = config.pulseAmount || 0;
            light.flickerAmount = config.flickerAmount || 0;
            light.active = true;
            light.pulseTime = Math.random() * Math.PI * 2;
            
            // Recreate sprite with new config
            if (light.sprite) {
                light.sprite.destroy({ texture: true, baseTexture: true });
            }
            light.createSprite();
        } else {
            light = new LightSource(config);
        }

        this.lights.push(light);
        
        if (light.sprite && this.lightContainer) {
            this.lightContainer.addChild(light.sprite);
        }

        return light;
    };

    LightingSystem.prototype.removeLight = function(light) {
        var index = this.lights.indexOf(light);
        if (index > -1) {
            this.lights.splice(index, 1);
            light.active = false;
            
            if (light.sprite && this.lightContainer) {
                this.lightContainer.removeChild(light.sprite);
            }
            
            // Return to pool
            if (this.lightPool.length < this.maxLights) {
                this.lightPool.push(light);
            } else {
                light.destroy();
            }
        }
    };

    LightingSystem.prototype.update = function(deltaTime) {
        // Update player spotlight position
        if (this.playerSpotlight && this.scene && this.scene.player) {
            this.playerSpotlight.setPosition(
                this.scene.player.x,
                this.scene.player.y
            );
        }

        // Update all lights
        for (var i = 0; i < this.lights.length; i++) {
            this.lights[i].update(deltaTime);
        }
    };

    LightingSystem.prototype.setAmbientLight = function(color, intensity) {
        this.ambientColor = color;
        this.ambientIntensity = intensity;
        
        // Update darkness overlay
        if (this.overlayContainer && this.overlayContainer.children.length > 0) {
            var overlay = this.overlayContainer.children[0];
            overlay.alpha = 1.0 - intensity;
            overlay.tint = color;
        }
    };

    /**
     * Create explosion light effect
     */
    LightingSystem.prototype.createExplosionLight = function(x, y) {
        var light = this.createLight({
            type: LIGHT_TYPES.POINT,
            x: x,
            y: y,
            radius: 300,
            intensity: 1.5,
            color: 0xFFAA00,
            falloff: 1.5
        });

        // Animate light fade out
        var self = this;
        var elapsed = 0;
        var duration = 0.5;
        
        var fadeOut = function(dt) {
            elapsed += dt;
            var progress = elapsed / duration;
            
            if (progress >= 1.0) {
                self.removeLight(light);
            } else {
                light.intensity = light.baseIntensity * (1.0 - progress);
                light.radius = 300 * (1.0 + progress * 0.5);
                requestAnimationFrame(function() { fadeOut(0.016); });
            }
        };
        
        fadeOut(0);
        
        return light;
    };

    /**
     * Create trail light for bullets
     */
    LightingSystem.prototype.createTrailLight = function(x, y, color) {
        var light = this.createLight({
            type: LIGHT_TYPES.POINT,
            x: x,
            y: y,
            radius: 80,
            intensity: 0.6,
            color: color || 0x00FFFF,
            falloff: 1.0
        });

        // Fade out quickly
        var self = this;
        var elapsed = 0;
        var duration = 0.2;
        
        var fadeOut = function(dt) {
            elapsed += dt;
            var progress = elapsed / duration;
            
            if (progress >= 1.0) {
                self.removeLight(light);
            } else {
                light.intensity = light.baseIntensity * (1.0 - progress);
                requestAnimationFrame(function() { fadeOut(0.016); });
            }
        };
        
        fadeOut(0);
        
        return light;
    };

    LightingSystem.prototype.destroy = function() {
        // Destroy all lights
        for (var i = 0; i < this.lights.length; i++) {
            this.lights[i].destroy();
        }
        this.lights = [];

        // Destroy pooled lights
        for (var j = 0; j < this.lightPool.length; j++) {
            this.lightPool[j].destroy();
        }
        this.lightPool = [];

        // Destroy containers
        if (this.lightContainer) {
            this.lightContainer.destroy({ children: true });
            this.lightContainer = null;
        }
        if (this.overlayContainer) {
            this.overlayContainer.destroy({ children: true });
            this.overlayContainer = null;
        }

        this.playerSpotlight = null;
    };

    // Export to global scope
    global.LightSource = LightSource;
    global.LightingSystem = LightingSystem;
    global.LIGHT_TYPES = LIGHT_TYPES;

})(window);
