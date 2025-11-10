/**
 * Culling System - Optimización de renderizado
 * Solo renderiza objetos visibles en cámara
 */
(function(global) {
    'use strict';

    /**
     * Culling Manager
     */
    function CullingManager(camera, viewport) {
        this.camera = camera;
        this.viewportWidth = viewport.width;
        this.viewportHeight = viewport.height;
        this.margin = 100; // Margen extra para evitar pop-in
        this.enabled = true;
        
        // Stats
        this.totalObjects = 0;
        this.visibleObjects = 0;
        this.culledObjects = 0;
    }

    /**
     * Check if object is visible
     */
    CullingManager.prototype.isVisible = function(x, y, radius) {
        if (!this.enabled) return true;
        
        var cameraX = this.camera.x;
        var cameraY = this.camera.y;
        
        var left = cameraX - this.viewportWidth / 2 - this.margin;
        var right = cameraX + this.viewportWidth / 2 + this.margin;
        var top = cameraY - this.viewportHeight / 2 - this.margin;
        var bottom = cameraY + this.viewportHeight / 2 + this.margin;
        
        return (
            x + radius >= left &&
            x - radius <= right &&
            y + radius >= top &&
            y - radius <= bottom
        );
    };

    /**
     * Cull sprite (hide if not visible)
     */
    CullingManager.prototype.cullSprite = function(sprite, x, y, radius) {
        if (!sprite) return false;
        
        var visible = this.isVisible(x, y, radius || 32);
        sprite.visible = visible;
        
        this.totalObjects++;
        if (visible) {
            this.visibleObjects++;
        } else {
            this.culledObjects++;
        }
        
        return visible;
    };

    /**
     * Cull array of entities
     */
    CullingManager.prototype.cullEntities = function(entities) {
        for (var i = 0; i < entities.length; i++) {
            var entity = entities[i];
            if (entity && entity.sprite && entity.alive) {
                this.cullSprite(entity.sprite, entity.x, entity.y, entity.radius);
            }
        }
    };

    /**
     * Reset stats
     */
    CullingManager.prototype.resetStats = function() {
        this.totalObjects = 0;
        this.visibleObjects = 0;
        this.culledObjects = 0;
    };

    /**
     * Get stats
     */
    CullingManager.prototype.getStats = function() {
        return {
            total: this.totalObjects,
            visible: this.visibleObjects,
            culled: this.culledObjects,
            cullRate: this.totalObjects > 0 ? 
                Math.round((this.culledObjects / this.totalObjects) * 100) : 0
        };
    };

    /**
     * Update viewport
     */
    CullingManager.prototype.updateViewport = function(width, height) {
        this.viewportWidth = width;
        this.viewportHeight = height;
    };

    /**
     * Enable/disable culling
     */
    CullingManager.prototype.setEnabled = function(enabled) {
        this.enabled = enabled;
        console.log('👁️ Culling:', enabled ? 'enabled' : 'disabled');
    };

    // Export to global scope
    global.CullingManager = CullingManager;

})(window);
