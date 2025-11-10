/* ===================================
   SPRITE POOL - Efficient sprite reuse system
   Reduces memory allocation and GC pressure
   ================================== */

(function() {
    'use strict';

    class SpritePool {
        constructor(config = {}) {
            this.config = config;
            this.pools = {}; // { entityType: { available: [], active: [] } }
            this.maxSize = config.maxSize || 1000;
            this.textureCache = {}; // Cache textures by key
        }

        // Create a pool for a specific entity type
        createPool(type, initialSize = 0) {
            if (this.pools[type]) {
                console.warn('⚠️ Pool already exists:', type);
                return;
            }

            this.pools[type] = {
                available: [],
                active: [],
                totalCreated: 0
            };

            console.log(`✅ Pool created for ${type} (initial size: ${initialSize})`);
        }

        // Get an entity from the pool (or create new)
        acquire(type, EntityClass, config = {}) {
            // Ensure pool exists
            if (!this.pools[type]) {
                this.createPool(type);
            }

            const pool = this.pools[type];
            let entity = null;

            // Reuse from available pool
            if (pool.available.length > 0) {
                entity = pool.available.pop();
                entity.reset(config);
            } else {
                // Create new entity
                if (pool.totalCreated >= this.maxSize) {
                    console.warn(`⚠️ Pool limit reached for ${type}: ${this.maxSize}`);
                    return null;
                }

                entity = new EntityClass(config);
                pool.totalCreated++;
            }

            // Move to active pool
            pool.active.push(entity);

            return entity;
        }

        // Return entity to pool
        release(type, entity) {
            if (!this.pools[type]) {
                console.warn('⚠️ Pool does not exist:', type);
                return;
            }

            const pool = this.pools[type];
            const index = pool.active.indexOf(entity);

            if (index === -1) {
                console.warn('⚠️ Entity not in active pool:', type);
                return;
            }

            // Remove from active
            pool.active.splice(index, 1);

            // Hide sprite but don't destroy
            if (entity.sprite) {
                entity.sprite.visible = false;
            }

            // Add to available
            pool.available.push(entity);
        }

        // Release all active entities of a type
        releaseAll(type) {
            if (!this.pools[type]) return;

            const pool = this.pools[type];
            
            while (pool.active.length > 0) {
                const entity = pool.active.pop();
                if (entity.sprite) {
                    entity.sprite.visible = false;
                }
                pool.available.push(entity);
            }
        }

        // Get pool stats
        getStats(type) {
            if (!this.pools[type]) return null;

            const pool = this.pools[type];
            return {
                type: type,
                available: pool.available.length,
                active: pool.active.length,
                total: pool.totalCreated,
                utilization: pool.totalCreated > 0 
                    ? (pool.active.length / pool.totalCreated * 100).toFixed(1) + '%'
                    : '0%'
            };
        }

        // Get all pool stats
        getAllStats() {
            const stats = {};
            for (const type in this.pools) {
                stats[type] = this.getStats(type);
            }
            return stats;
        }

        // Cache a texture
        cacheTexture(key, texture) {
            this.textureCache[key] = texture;
        }

        // Get cached texture
        getTexture(key) {
            return this.textureCache[key] || null;
        }

        // Clear a specific pool
        clearPool(type) {
            if (!this.pools[type]) return;

            const pool = this.pools[type];

            // Destroy all entities
            [...pool.active, ...pool.available].forEach(entity => {
                if (entity && entity.destroy) {
                    entity.destroy();
                }
            });

            delete this.pools[type];
            console.log(`✅ Pool cleared: ${type}`);
        }

        // Clear all pools
        clearAll() {
            for (const type in this.pools) {
                this.clearPool(type);
            }
            this.textureCache = {};
            console.log('✅ All pools cleared');
        }

        // Destroy pool system
        destroy() {
            this.clearAll();
            this.pools = {};
        }
    }

    // Export to global scope
    window.SpritePool = SpritePool;

})();
