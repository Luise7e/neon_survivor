/* ===================================
   ARENA SCENE - Main scene controller
   Integrates Renderer, Layers, Camera, and Collision
   ================================== */

(function() {
    'use strict';


    class ArenaScene {
        constructor(config = {}) {
            this.config = config;
            // Initialize renderer
            this.renderer = new RendererAdapter({
                mode: config.mode || 'pixi',
                width: config.width || 800,
                height: config.height || 600,
                parent: config.parent,
                canvas: config.canvas,
                ctx: config.ctx,
                backgroundColor: 0x0a0a1a
            });
            // Managers
            this.layerManager = null;
            this.camera = null;
            this.collisionMap = null;
        }

        async initAsync() {
            // Wait for PixiJS renderer to be ready
            while (!this.renderer.pixiReady) {
                await new Promise(resolve => setTimeout(resolve, 10));
            }
            // Create layer manager
            this.layerManager = new LayerManager(this.renderer);
            // Create camera
            this.camera = new CameraController({
                viewportWidth: this.config.width || 800,
                viewportHeight: this.config.height || 600,
                smoothing: 0.1
            });
            // Create collision map
            this.collisionMap = new CollisionMap({
                tileSize: 64,
                mapWidth: 35,
                mapHeight: 35
            });
            // Set parallax speeds for depth effect
            this.layerManager.setParallax('background', 0.3);
            this.layerManager.setParallax('midground', 0.6);
            this.layerManager.setParallax('foreground', 1.0);
            this.layerManager.setParallax('effects', 1.0);
            this.layerManager.setParallax('ui', 0); // UI stays fixed
            console.log('✅ ArenaScene initialized (async)');
        }

        // Update scene (call every frame)
        update(playerX, playerY) {
            if (!this.renderer.pixiReady) return;

            // Update camera to follow player
            this.camera.setTarget(playerX, playerY);
            this.camera.update();

            // Update parallax
            const cameraPos = this.camera.getTopLeft();
            this.layerManager.updateParallax(cameraPos.x, cameraPos.y);
        }

        // Load map from JSON
        async loadMap(mapPath) {
            try {
                const response = await fetch(mapPath);
                const mapData = await response.json();

                console.log('📦 Loading map:', mapData.name);

                // Load collision data
                this.collisionMap.loadFromJSON(mapData);

                // Load visual layers (textures, sprites, etc.)
                if (mapData.layers) {
                    for (const layerConfig of mapData.layers) {
                        await this.loadLayer(layerConfig);
                    }
                }

                console.log('✅ Map loaded successfully');
                return mapData;

            } catch (error) {
                console.error('❌ Error loading map:', error);
                return null;
            }
        }

        // Load a single layer (background, midground, etc.)
        async loadLayer(layerConfig) {
            if (!layerConfig.texture) return;

            try {
                const texture = await PIXI.Assets.load(layerConfig.texture);
                const sprite = new PIXI.Sprite(texture);
                
                // Set parallax speed
                if (layerConfig.parallax !== undefined) {
                    this.layerManager.setParallax(layerConfig.name, layerConfig.parallax);
                }

                // Add to layer
                this.layerManager.addToLayer(layerConfig.name, sprite);

                console.log('✅ Layer loaded:', layerConfig.name);

            } catch (error) {
                console.error('❌ Error loading layer texture:', layerConfig.texture, error);
            }
        }

        // Resize scene
        resize(width, height) {
            this.renderer.resize(width, height);
            if (this.camera) {
                this.camera.resize(width, height);
            }
        }

        // Destroy scene
        destroy() {
            if (this.layerManager) this.layerManager.destroy();
            if (this.renderer) this.renderer.destroy();
        }
    }

    // Export to global scope
    window.ArenaScene = ArenaScene;

})();
