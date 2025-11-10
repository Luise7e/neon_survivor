/* ===================================
   LAYER MANAGER - Multi-layer system with zIndex control
   Manages background, midground, foreground, effects, and UI layers
   ================================== */

(function() {
    'use strict';

    class LayerManager {
        constructor(renderer) {
            this.renderer = renderer;
            this.layers = {};
            this.layerOrder = ['background', 'midground', 'foreground', 'effects', 'ui'];
            
            this.init();
        }

        init() {
            // Create default layers
            this.createLayer('background', 0);
            this.createLayer('midground', 1);
            this.createLayer('foreground', 2);
            this.createLayer('effects', 3);
            this.createLayer('ui', 4);

            console.log('✅ LayerManager initialized with', Object.keys(this.layers).length, 'layers');
        }

        // Create a new layer
        createLayer(name, zIndex) {
            if (!this.renderer || !this.renderer.pixiReady) {
                console.warn('⚠️ PixiJS not ready, cannot create layer:', name);
                return null;
            }

            const container = new PIXI.Container();
            container.label = name; // v8: use label instead of name
            container.zIndex = zIndex;
            container.sortableChildren = true; // Enable sorting within the layer

            this.layers[name] = {
                container: container,
                zIndex: zIndex,
                parallaxSpeed: 1.0, // Default: no parallax
                visible: true
            };

            // Add to stage
            this.renderer.addToStage(container);

            return container;
        }

        // Get a layer by name
        getLayer(name) {
            return this.layers[name] ? this.layers[name].container : null;
        }

        // Add a sprite/object to a specific layer
        addToLayer(layerName, displayObject, zIndex = 0) {
            const layer = this.layers[layerName];
            if (!layer) {
                console.warn('⚠️ Layer not found:', layerName);
                return;
            }

            displayObject.zIndex = zIndex;
            layer.container.addChild(displayObject);
        }

        // Remove from layer
        removeFromLayer(layerName, displayObject) {
            const layer = this.layers[layerName];
            if (!layer) {
                console.warn('⚠️ Layer not found:', layerName);
                return;
            }

            layer.container.removeChild(displayObject);
        }

        // Set parallax speed for a layer
        setParallax(layerName, speed) {
            const layer = this.layers[layerName];
            if (!layer) {
                console.warn('⚠️ Layer not found:', layerName);
                return;
            }

            layer.parallaxSpeed = speed;
        }

        // Update parallax based on camera position
        updateParallax(cameraX, cameraY) {
            for (const name in this.layers) {
                const layer = this.layers[name];
                if (layer.parallaxSpeed !== 1.0) {
                    // Apply parallax offset
                    layer.container.x = -cameraX * layer.parallaxSpeed;
                    layer.container.y = -cameraY * layer.parallaxSpeed;
                }
            }
        }

        // Show/hide layer
        setLayerVisibility(layerName, visible) {
            const layer = this.layers[layerName];
            if (!layer) {
                console.warn('⚠️ Layer not found:', layerName);
                return;
            }

            layer.visible = visible;
            layer.container.visible = visible;
        }

        // Clear a layer
        clearLayer(layerName) {
            const layer = this.layers[layerName];
            if (!layer) {
                console.warn('⚠️ Layer not found:', layerName);
                return;
            }

            layer.container.removeChildren();
        }

        // Clear all layers
        clearAll() {
            for (const name in this.layers) {
                this.clearLayer(name);
            }
        }

        // Destroy
        destroy() {
            for (const name in this.layers) {
                const layer = this.layers[name];
                layer.container.destroy({ children: true });
            }
            this.layers = {};
        }
    }

    // Export to global scope
    window.LayerManager = LayerManager;

})();
