/* ===================================
   COLLISION MAP - Simple zone-based collision system
   Configurable via JSON
   ================================== */

(function() {
    'use strict';

    class CollisionMap {
        constructor(config = {}) {
            this.zones = []; // Array of collision zones
            this.tileSize = config.tileSize || 64;
            this.mapWidth = config.mapWidth || 35;
            this.mapHeight = config.mapHeight || 35;
            
            // Grid-based collision map (for fast lookups)
            this.grid = this.createGrid();
        }

        createGrid() {
            const grid = [];
            for (let y = 0; y < this.mapHeight; y++) {
                grid[y] = [];
                for (let x = 0; x < this.mapWidth; x++) {
                    grid[y][x] = 0; // 0 = walkable, 1 = wall
                }
            }
            return grid;
        }

        // Add collision zone from JSON
        addZone(zone) {
            this.zones.push(zone);

            // Update grid if zone is rectangular
            if (zone.type === 'rect') {
                const startX = Math.floor(zone.x / this.tileSize);
                const startY = Math.floor(zone.y / this.tileSize);
                const endX = Math.floor((zone.x + zone.width) / this.tileSize);
                const endY = Math.floor((zone.y + zone.height) / this.tileSize);

                for (let y = startY; y <= endY && y < this.mapHeight; y++) {
                    for (let x = startX; x <= endX && x < this.mapWidth; x++) {
                        this.grid[y][x] = 1;
                    }
                }
            }
        }

        // Check if a point collides with any zone
        isPointColliding(x, y) {
            const gridX = Math.floor(x / this.tileSize);
            const gridY = Math.floor(y / this.tileSize);

            if (gridX < 0 || gridX >= this.mapWidth || gridY < 0 || gridY >= this.mapHeight) {
                return true; // Out of bounds
            }

            return this.grid[gridY][gridX] === 1;
        }

        // Check if a circle collides with any zone
        isCircleColliding(x, y, radius) {
            // Check center
            if (this.isPointColliding(x, y)) return true;

            // Check cardinal directions
            if (this.isPointColliding(x + radius, y)) return true;
            if (this.isPointColliding(x - radius, y)) return true;
            if (this.isPointColliding(x, y + radius)) return true;
            if (this.isPointColliding(x, y - radius)) return true;

            return false;
        }

        // Load from JSON configuration
        loadFromJSON(mapData) {
            if (mapData.collisions) {
                for (const zone of mapData.collisions) {
                    this.addZone(zone);
                }
            }
            console.log('✅ Collision map loaded:', this.zones.length, 'zones');
        }

        // Clear all zones
        clear() {
            this.zones = [];
            this.grid = this.createGrid();
        }
    }

    // Export to global scope
    window.CollisionMap = CollisionMap;

})();
