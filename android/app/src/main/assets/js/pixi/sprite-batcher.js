/**
 * Sprite Batcher - Reduce draw calls agrupando sprites similares
 * Usa PIXI.ParticleContainer para sprites estáticos
 */
(function(global) {
    'use strict';

    /**
     * Sprite Batcher
     */
    function SpriteBatcher(scene) {
        this.scene = scene;
        this.batches = {};
        this.enabled = true;
        
        // Stats
        this.drawCallsSaved = 0;
    }

    /**
     * Create batch container for sprite type
     */
    SpriteBatcher.prototype.createBatch = function(type, maxSize, properties) {
        var PIXI = global.PIXI;
        if (!PIXI || !PIXI.ParticleContainer) {
            console.warn('⚠️ PIXI.ParticleContainer not available');
            return null;
        }
        
        // ParticleContainer es más eficiente para muchos sprites similares
        var container = new PIXI.ParticleContainer(maxSize || 1000, properties || {
            scale: true,
            position: true,
            rotation: true,
            uvs: false,
            alpha: true,
            tint: true
        });
        
        this.batches[type] = container;
        
        if (this.scene && this.scene.layerManager) {
            this.scene.layerManager.addToLayer('entities', container, 0);
        }
        
        console.log('📦 Batch created for:', type);
        return container;
    };

    /**
     * Get batch for type
     */
    SpriteBatcher.prototype.getBatch = function(type) {
        return this.batches[type];
    };

    /**
     * Add sprite to batch
     */
    SpriteBatcher.prototype.addToBatch = function(type, sprite) {
        if (!this.enabled) return false;
        
        var batch = this.batches[type];
        if (!batch) {
            console.warn('⚠️ Batch not found for type:', type);
            return false;
        }
        
        batch.addChild(sprite);
        this.drawCallsSaved++;
        return true;
    };

    /**
     * Remove sprite from batch
     */
    SpriteBatcher.prototype.removeFromBatch = function(type, sprite) {
        var batch = this.batches[type];
        if (!batch) return false;
        
        batch.removeChild(sprite);
        return true;
    };

    /**
     * Clear batch
     */
    SpriteBatcher.prototype.clearBatch = function(type) {
        var batch = this.batches[type];
        if (!batch) return;
        
        batch.removeChildren();
    };

    /**
     * Clear all batches
     */
    SpriteBatcher.prototype.clearAll = function() {
        for (var type in this.batches) {
            this.clearBatch(type);
        }
    };

    /**
     * Destroy batch
     */
    SpriteBatcher.prototype.destroyBatch = function(type) {
        var batch = this.batches[type];
        if (!batch) return;
        
        batch.destroy({ children: true });
        delete this.batches[type];
    };

    /**
     * Destroy all batches
     */
    SpriteBatcher.prototype.destroyAll = function() {
        for (var type in this.batches) {
            this.destroyBatch(type);
        }
        this.batches = {};
    };

    /**
     * Get stats
     */
    SpriteBatcher.prototype.getStats = function() {
        var totalSprites = 0;
        var batchCount = 0;
        
        for (var type in this.batches) {
            batchCount++;
            totalSprites += this.batches[type].children.length;
        }
        
        return {
            batches: batchCount,
            sprites: totalSprites,
            drawCallsSaved: this.drawCallsSaved
        };
    };

    /**
     * Enable/disable batching
     */
    SpriteBatcher.prototype.setEnabled = function(enabled) {
        this.enabled = enabled;
        console.log('📦 Sprite batching:', enabled ? 'enabled' : 'disabled');
    };

    // Export to global scope
    global.SpriteBatcher = SpriteBatcher;

})(window);
