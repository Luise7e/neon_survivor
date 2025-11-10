/**
 * Performance Manager - Sistema de optimización y detección de dispositivos
 * Ajusta calidad automáticamente según hardware y FPS
 */
(function(global) {
    'use strict';

    /**
     * Device Detection
     */
    function DeviceDetector() {
        this.isMobile = this.detectMobile();
        this.isLowEnd = false;
        this.tier = 'high'; // 'low', 'medium', 'high'
        this.gpu = this.detectGPU();
        this.ram = this.detectRAM();
        
        this.detect();
    }

    DeviceDetector.prototype.detectMobile = function() {
        var ua = navigator.userAgent || navigator.vendor || window.opera;
        return /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini/i.test(ua.toLowerCase());
    };

    DeviceDetector.prototype.detectGPU = function() {
        var canvas = document.createElement('canvas');
        var gl = canvas.getContext('webgl') || canvas.getContext('experimental-webgl');
        
        if (!gl) return 'unknown';
        
        var debugInfo = gl.getExtension('WEBGL_debug_renderer_info');
        if (debugInfo) {
            var renderer = gl.getParameter(debugInfo.UNMASKED_RENDERER_WEBGL);
            return renderer;
        }
        
        return 'unknown';
    };

    DeviceDetector.prototype.detectRAM = function() {
        // navigator.deviceMemory es experimental pero útil
        if (navigator.deviceMemory) {
            return navigator.deviceMemory; // GB
        }
        return 4; // Default assumption
    };

    DeviceDetector.prototype.detect = function() {
        // Detección basada en características
        var score = 0;
        
        // RAM
        if (this.ram >= 8) score += 3;
        else if (this.ram >= 4) score += 2;
        else score += 1;
        
        // Mobile penalty
        if (this.isMobile) score -= 1;
        
        // GPU detection (basic heuristics)
        var gpuLower = this.gpu.toLowerCase();
        if (gpuLower.includes('mali') || gpuLower.includes('adreno 3') || gpuLower.includes('adreno 4')) {
            score -= 1;
        } else if (gpuLower.includes('adreno 6') || gpuLower.includes('adreno 7')) {
            score += 1;
        }
        
        // Assign tier
        if (score <= 2) {
            this.tier = 'low';
            this.isLowEnd = true;
        } else if (score <= 4) {
            this.tier = 'medium';
        } else {
            this.tier = 'high';
        }
        
        console.log('🔍 Device detected:', {
            mobile: this.isMobile,
            tier: this.tier,
            gpu: this.gpu,
            ram: this.ram + 'GB'
        });
    };

    /**
     * Quality Settings per Tier
     */
    var QUALITY_PRESETS = {
        low: {
            resolution: 0.75,
            particleCount: 25,
            glowQuality: 0.2,
            glowDistance: 8,
            glowStrength: 1.0,
            blurQuality: 1,
            shadowsEnabled: false,
            depthEnabled: false,
            lightingEnabled: false,
            maxEnemies: 20,
            maxBullets: 30,
            targetFPS: 30
        },
        medium: {
            resolution: 1.0,
            particleCount: 50,
            glowQuality: 0.4,
            glowDistance: 12,
            glowStrength: 1.5,
            blurQuality: 2,
            shadowsEnabled: true,
            depthEnabled: true,
            lightingEnabled: false,
            maxEnemies: 40,
            maxBullets: 60,
            targetFPS: 45
        },
        high: {
            resolution: 1.0,
            particleCount: 150,
            glowQuality: 0.6,
            glowDistance: 15,
            glowStrength: 2.0,
            blurQuality: 4,
            shadowsEnabled: true,
            depthEnabled: true,
            lightingEnabled: true,
            maxEnemies: 100,
            maxBullets: 150,
            targetFPS: 60
        }
    };

    /**
     * Performance Manager
     */
    function PerformanceManager(scene) {
        this.scene = scene;
        this.deviceDetector = new DeviceDetector();
        this.currentQuality = this.deviceDetector.tier;
        this.settings = QUALITY_PRESETS[this.currentQuality];
        
        // FPS tracking
        this.fpsHistory = [];
        this.fpsHistorySize = 60; // 1 segundo a 60fps
        this.averageFPS = 60;
        this.lowFPSCount = 0;
        this.adaptiveEnabled = true;
        
        // Stats
        this.drawCalls = 0;
        this.entities = 0;
        this.particles = 0;
        
        console.log('⚡ PerformanceManager initialized with quality:', this.currentQuality);
    }

    /**
     * Update FPS tracking
     */
    PerformanceManager.prototype.updateFPS = function(deltaTime) {
        var fps = 1 / deltaTime;
        
        this.fpsHistory.push(fps);
        if (this.fpsHistory.length > this.fpsHistorySize) {
            this.fpsHistory.shift();
        }
        
        // Calculate average
        var sum = 0;
        for (var i = 0; i < this.fpsHistory.length; i++) {
            sum += this.fpsHistory[i];
        }
        this.averageFPS = sum / this.fpsHistory.length;
        
        // Detect low FPS
        if (this.averageFPS < this.settings.targetFPS - 10) {
            this.lowFPSCount++;
        } else {
            this.lowFPSCount = 0;
        }
        
        // Adaptive quality adjustment
        if (this.adaptiveEnabled && this.lowFPSCount > 120) { // 2 segundos de FPS bajo
            this.downgradeQuality();
            this.lowFPSCount = 0;
        }
    };

    /**
     * Downgrade quality tier
     */
    PerformanceManager.prototype.downgradeQuality = function() {
        if (this.currentQuality === 'high') {
            this.setQuality('medium');
            console.warn('⚠️ Performance: Downgrading to MEDIUM quality');
        } else if (this.currentQuality === 'medium') {
            this.setQuality('low');
            console.warn('⚠️ Performance: Downgrading to LOW quality');
        }
    };

    /**
     * Set quality tier
     */
    PerformanceManager.prototype.setQuality = function(tier) {
        if (!QUALITY_PRESETS[tier]) {
            console.error('❌ Invalid quality tier:', tier);
            return;
        }
        
        this.currentQuality = tier;
        this.settings = QUALITY_PRESETS[tier];
        
        console.log('🎨 Quality set to:', tier, this.settings);
        
        // Apply settings to scene
        this.applyQualitySettings();
    };

    /**
     * Apply quality settings to scene
     */
    PerformanceManager.prototype.applyQualitySettings = function() {
        if (!this.scene) return;
        
        // Apply resolution
        if (this.scene.renderer && this.scene.renderer.app) {
            this.scene.renderer.app.renderer.resolution = this.settings.resolution;
        }
        
        // Apply to particle system
        if (global.ParticleSystem && this.scene.particleSystem) {
            this.scene.particleSystem.maxParticles = this.settings.particleCount;
        }
        
        // Apply to depth manager
        if (global.DepthManager && this.scene.depthManager) {
            this.scene.depthManager.enabled = this.settings.depthEnabled;
        }
        
        // Apply to lighting system
        if (global.LightingSystem && this.scene.lightingSystem) {
            if (this.scene.lightingSystem.lightContainer) {
                this.scene.lightingSystem.lightContainer.visible = this.settings.lightingEnabled;
            }
            if (this.scene.lightingSystem.overlayContainer) {
                this.scene.lightingSystem.overlayContainer.visible = this.settings.lightingEnabled;
            }
        }
        
        console.log('✅ Quality settings applied');
    };

    /**
     * Get quality settings
     */
    PerformanceManager.prototype.getSettings = function() {
        return this.settings;
    };

    /**
     * Update stats
     */
    PerformanceManager.prototype.updateStats = function(stats) {
        this.drawCalls = stats.drawCalls || 0;
        this.entities = stats.entities || 0;
        this.particles = stats.particles || 0;
    };

    /**
     * Get stats
     */
    PerformanceManager.prototype.getStats = function() {
        return {
            fps: Math.round(this.averageFPS),
            quality: this.currentQuality,
            drawCalls: this.drawCalls,
            entities: this.entities,
            particles: this.particles,
            tier: this.deviceDetector.tier,
            mobile: this.deviceDetector.isMobile,
            gpu: this.deviceDetector.gpu,
            ram: this.deviceDetector.ram
        };
    };

    /**
     * Enable/disable adaptive quality
     */
    PerformanceManager.prototype.setAdaptive = function(enabled) {
        this.adaptiveEnabled = enabled;
        console.log('🔧 Adaptive quality:', enabled ? 'enabled' : 'disabled');
    };

    /**
     * Memory Manager
     */
    function MemoryManager() {
        this.textures = [];
        this.sprites = [];
        this.maxTextures = 100;
        this.maxSprites = 500;
    }

    /**
     * Register texture
     */
    MemoryManager.prototype.registerTexture = function(texture) {
        this.textures.push(texture);
        
        if (this.textures.length > this.maxTextures) {
            this.cleanupTextures();
        }
    };

    /**
     * Cleanup old textures
     */
    MemoryManager.prototype.cleanupTextures = function() {
        var removed = 0;
        for (var i = this.textures.length - 1; i >= 0; i--) {
            var texture = this.textures[i];
            if (texture && texture.destroyed) {
                this.textures.splice(i, 1);
                removed++;
            }
        }
        
        if (removed > 0) {
            console.log('🧹 Cleaned up', removed, 'destroyed textures');
        }
    };

    /**
     * Force cleanup
     */
    MemoryManager.prototype.forceCleanup = function() {
        // Destroy unused textures
        for (var i = 0; i < this.textures.length; i++) {
            var texture = this.textures[i];
            if (texture && !texture.destroyed) {
                texture.destroy(true);
            }
        }
        this.textures = [];
        
        console.log('🧹 Force cleanup completed');
    };

    /**
     * Get memory stats
     */
    MemoryManager.prototype.getStats = function() {
        return {
            textures: this.textures.length,
            sprites: this.sprites.length
        };
    };

    // Export to global scope
    global.DeviceDetector = DeviceDetector;
    global.PerformanceManager = PerformanceManager;
    global.MemoryManager = MemoryManager;
    global.QUALITY_PRESETS = QUALITY_PRESETS;

})(window);
