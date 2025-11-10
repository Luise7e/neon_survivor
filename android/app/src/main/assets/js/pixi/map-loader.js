/**
 * Map Loader - Sistema de carga dinámica de mapas
 * Carga JSON de mapas y genera arenas proceduralmente
 */
(function(global) {
    'use strict';

    /**
     * Map Loader
     * Handles loading and parsing of map JSON files
     */
    function MapLoader() {
        this.maps = new Map();
        this.currentMap = null;
        this.loadedMaps = [];
    }

    /**
     * Load a map from JSON file
     */
    MapLoader.prototype.loadMap = function(mapPath) {
        var self = this;
        
        return fetch(mapPath)
            .then(function(response) {
                if (!response.ok) {
                    throw new Error('Failed to load map: ' + mapPath);
                }
                return response.json();
            })
            .then(function(mapData) {
                self.maps.set(mapData.id, mapData);
                self.loadedMaps.push(mapData.id);
                console.log('✅ Map loaded:', mapData.name);
                return mapData;
            })
            .catch(function(error) {
                console.error('❌ Error loading map:', error);
                throw error;
            });
    };

    /**
     * Load multiple maps
     */
    MapLoader.prototype.loadMaps = function(mapPaths) {
        var promises = mapPaths.map(function(path) {
            return this.loadMap(path);
        }, this);
        
        return Promise.all(promises);
    };

    /**
     * Get a loaded map by ID
     */
    MapLoader.prototype.getMap = function(mapId) {
        return this.maps.get(mapId);
    };

    /**
     * Get all loaded maps
     */
    MapLoader.prototype.getAllMaps = function() {
        var mapList = [];
        this.maps.forEach(function(map) {
            mapList.push(map);
        });
        return mapList;
    };

    /**
     * Set current active map
     */
    MapLoader.prototype.setCurrentMap = function(mapId) {
        var map = this.maps.get(mapId);
        if (map) {
            this.currentMap = map;
            console.log('🗺️ Current map set to:', map.name);
            return map;
        }
        console.warn('⚠️ Map not found:', mapId);
        return null;
    };

    /**
     * Get random map
     */
    MapLoader.prototype.getRandomMap = function() {
        var mapArray = this.getAllMaps();
        if (mapArray.length === 0) return null;
        
        var randomIndex = Math.floor(Math.random() * mapArray.length);
        return mapArray[randomIndex];
    };

    /**
     * Map Builder
     * Constructs PixiJS scene from map data
     */
    function MapBuilder(scene) {
        this.scene = scene;
    }

    /**
     * Build map in scene
     */
    MapBuilder.prototype.buildMap = function(mapData) {
        if (!this.scene) {
            console.error('❌ MapBuilder: No scene provided');
            return false;
        }

        console.log('🏗️ Building map:', mapData.name);

        // Clear existing map
        this.clearMap();

        // Build layers
        this.buildBackground(mapData);
        this.buildTiles(mapData);
        this.buildWalls(mapData);
        this.buildObstacles(mapData);
        this.applyEffects(mapData);

        // Setup collision map
        this.buildCollisionMap(mapData);

        console.log('✅ Map built successfully:', mapData.name);
        return true;
    };

    /**
     * Build background layer
     */
    MapBuilder.prototype.buildBackground = function(mapData) {
        var PIXI = global.PIXI;
        var TextureGenerator = global.TextureGenerator;
        
        if (!PIXI || !TextureGenerator) {
            console.warn('⚠️ PIXI or TextureGenerator not available');
            return;
        }

        var bgConfig = mapData.background || {};
        var texture = null;

        switch (bgConfig.type) {
            case 'neon-grid':
                texture = TextureGenerator.createNeonGrid(
                    mapData.width,
                    mapData.height,
                    this.hexToNumber(mapData.theme.grid),
                    bgConfig.gridSize || 64
                );
                break;
            case 'void':
                texture = TextureGenerator.createVoidBackground(
                    mapData.width,
                    mapData.height
                );
                break;
            default:
                texture = TextureGenerator.createNeonGrid(
                    mapData.width,
                    mapData.height
                );
        }

        if (texture) {
            var sprite = new PIXI.Sprite(texture);
            this.scene.layerManager.addToLayer('background', sprite, 0);
            
            // Apply blur if enabled
            if (mapData.effects && mapData.effects.blur && mapData.effects.blur.enabled) {
                var blurFilter = new PIXI.filters.BlurFilter();
                blurFilter.blur = mapData.effects.blur.background || 1.5;
                sprite.filters = [blurFilter];
            }
        }
    };

    /**
     * Build tiles layer
     */
    MapBuilder.prototype.buildTiles = function(mapData) {
        var PIXI = global.PIXI;
        var TextureGenerator = global.TextureGenerator;
        
        if (!PIXI || !TextureGenerator) return;

        var texture = TextureGenerator.createArenaTiles(
            mapData.width,
            mapData.height,
            this.hexToNumber(mapData.theme.primary)
        );

        if (texture) {
            var sprite = new PIXI.Sprite(texture);
            this.scene.layerManager.addToLayer('midground', sprite, 0);
        }
    };

    /**
     * Build walls
     */
    MapBuilder.prototype.buildWalls = function(mapData) {
        var PIXI = global.PIXI;
        var TextureGenerator = global.TextureGenerator;
        
        if (!PIXI || !TextureGenerator) return;

        var texture = TextureGenerator.createNeonWalls(
            mapData.width,
            mapData.height,
            this.hexToNumber(mapData.theme.walls)
        );

        if (texture) {
            var sprite = new PIXI.Sprite(texture);
            this.scene.layerManager.addToLayer('foreground', sprite, 0);
            
            // Apply glow if enabled
            if (mapData.effects && mapData.effects.glow && mapData.effects.glow.enabled) {
                if (PIXI.filters && PIXI.filters.GlowFilter) {
                    var glowConfig = mapData.effects.glow;
                    var glowFilter = new PIXI.filters.GlowFilter({
                        distance: glowConfig.distance || 15,
                        outerStrength: glowConfig.outerStrength || 2,
                        quality: glowConfig.quality || 0.5,
                        color: this.hexToNumber(mapData.theme.walls)
                    });
                    sprite.filters = [glowFilter];
                }
            }
        }
    };

    /**
     * Build obstacles
     */
    MapBuilder.prototype.buildObstacles = function(mapData) {
        var PIXI = global.PIXI;
        if (!PIXI || !PIXI.Graphics) return;

        var obstacles = mapData.obstacles || [];
        
        for (var i = 0; i < obstacles.length; i++) {
            var obstacle = obstacles[i];
            var graphics = this.createObstacleGraphics(obstacle);
            
            if (graphics) {
                this.scene.layerManager.addToLayer('foreground', graphics, 1);
            }
        }
    };

    /**
     * Create obstacle graphics
     */
    MapBuilder.prototype.createObstacleGraphics = function(obstacle) {
        var PIXI = global.PIXI;
        if (!PIXI || !PIXI.Graphics) return null;

        var graphics = new PIXI.Graphics();
        var color = this.hexToNumber(obstacle.color || '#ffffff');
        var alpha = obstacle.alpha || 1.0;

        switch (obstacle.type) {
            case 'rect':
                graphics.rect(obstacle.x, obstacle.y, obstacle.width, obstacle.height);
                graphics.fill({ color: color, alpha: alpha });
                graphics.stroke({ width: 2, color: color });
                break;
                
            case 'circle':
                graphics.circle(obstacle.x, obstacle.y, obstacle.radius);
                graphics.fill({ color: color, alpha: alpha });
                graphics.stroke({ width: 2, color: color });
                break;
                
            case 'polygon':
                if (obstacle.points && obstacle.points.length > 0) {
                    graphics.moveTo(obstacle.points[0].x, obstacle.points[0].y);
                    for (var i = 1; i < obstacle.points.length; i++) {
                        graphics.lineTo(obstacle.points[i].x, obstacle.points[i].y);
                    }
                    graphics.closePath();
                    graphics.fill({ color: color, alpha: alpha });
                    graphics.stroke({ width: 2, color: color });
                }
                break;
        }

        // Apply glow if specified
        if (obstacle.glow && PIXI.filters && PIXI.filters.GlowFilter) {
            var glowFilter = new PIXI.filters.GlowFilter({
                distance: 15 * obstacle.glow,
                outerStrength: 2 * obstacle.glow,
                color: color
            });
            graphics.filters = [glowFilter];
        }

        return graphics;
    };

    /**
     * Build collision map
     */
    MapBuilder.prototype.buildCollisionMap = function(mapData) {
        if (!this.scene || !this.scene.collisionMap) return;

        var collisions = [];

        // Add walls
        var walls = mapData.walls || [];
        for (var i = 0; i < walls.length; i++) {
            collisions.push(walls[i]);
        }

        // Add obstacles
        var obstacles = mapData.obstacles || [];
        for (var j = 0; j < obstacles.length; j++) {
            collisions.push(obstacles[j]);
        }

        this.scene.collisionMap.loadFromJSON({ collisions: collisions });
    };

    /**
     * Apply effects
     */
    MapBuilder.prototype.applyEffects = function(mapData) {
        // Effects are applied during layer building
        // This method can be extended for additional effects
        
        if (mapData.effects && mapData.effects.particles && mapData.effects.particles.ambient) {
            console.log('🎆 Ambient particles enabled:', mapData.effects.particles.type);
        }
    };

    /**
     * Clear current map
     */
    MapBuilder.prototype.clearMap = function() {
        if (!this.scene || !this.scene.layerManager) return;

        // Clear all layers
        var layers = ['background', 'midground', 'foreground', 'entities', 'effects', 'ui'];
        for (var i = 0; i < layers.length; i++) {
            var layer = this.scene.layerManager.getLayer(layers[i]);
            if (layer) {
                layer.removeChildren();
            }
        }

        console.log('🧹 Map cleared');
    };

    /**
     * Get spawn points
     */
    MapBuilder.prototype.getSpawnPoints = function(mapData) {
        return mapData.spawnPoints || {
            player: { x: 1120, y: 1120 },
            enemies: []
        };
    };

    /**
     * Convert hex string to number
     */
    MapBuilder.prototype.hexToNumber = function(hexString) {
        if (typeof hexString === 'number') return hexString;
        if (!hexString) return 0xffffff;
        
        var hex = hexString.replace('#', '');
        return parseInt(hex, 16);
    };

    // Export to global scope
    global.MapLoader = MapLoader;
    global.MapBuilder = MapBuilder;

})(window);

