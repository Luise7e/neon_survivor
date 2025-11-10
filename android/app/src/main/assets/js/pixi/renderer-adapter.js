/* ===================================
   RENDERER ADAPTER - Hybrid Canvas/PixiJS
   Allows progressive migration without breaking existing code
   ================================== */

(function() {
    'use strict';

    class RendererAdapter {
        constructor(config = {}) {
            this.mode = config.mode || 'canvas'; // 'canvas' | 'pixi' | 'hybrid'
            this.width = config.width || 600;
            this.height = config.height || 600;
            this.parent = config.parent || document.body;
            this.backgroundColor = config.backgroundColor || 0x0a0a1a;
            
            // Canvas fallback (legacy)
            this.canvas = config.canvas || null;
            this.ctx = config.ctx || null;
            
            // PixiJS app
            this.app = null;
            this.pixiReady = false;
            
            // Set global instance
            RendererAdapter.instance = this;
            
            this.init();
        }

        init() {
            if (this.mode === 'pixi' || this.mode === 'hybrid') {
                this.initPixi();
            }
            
            console.log(`✅ RendererAdapter initialized in ${this.mode} mode`);
        }

        initPixi() {
            try {
                // Check if PixiJS is loaded
                if (typeof PIXI === 'undefined') {
                    console.warn('⚠️ PixiJS not loaded, falling back to Canvas');
                    this.mode = 'canvas';
                    return;
                }

                // PixiJS v8: use Application constructor, then await init()
                this.app = new PIXI.Application();
                this.app.stage.sortableChildren = true;
                this.app.init({
                    width: this.width,
                    height: this.height,
                    backgroundColor: this.backgroundColor,
                    antialias: true,
                    resolution: window.devicePixelRatio || 1,
                    autoDensity: true,
                    powerPreference: 'high-performance'
                }).then(() => {
                    if (this.parent && this.app.canvas) {
                        this.parent.appendChild(this.app.canvas);
                    }
                    this.pixiReady = true;
                    console.log('✅ PixiJS renderer initialized');
                }).catch(error => {
                    console.error('❌ Error initializing PixiJS:', error);
                    this.mode = 'canvas';
                    this.pixiReady = false;
                });
            } catch (error) {
                console.error('❌ Error initializing PixiJS:', error);
                this.mode = 'canvas';
                this.pixiReady = false;
            }
        }

        // Add a display object (sprite, container, etc.) to the stage
        addToStage(displayObject) {
            if (this.pixiReady && this.app) {
                this.app.stage.addChild(displayObject);
            }
        }

        // Remove from stage
        removeFromStage(displayObject) {
            if (this.pixiReady && this.app) {
                this.app.stage.removeChild(displayObject);
            }
        }

        // Get renderer (for advanced usage)
        getRenderer() {
            return this.pixiReady ? this.app.renderer : null;
        }

        // Get stage (for adding children)
        getStage() {
            return this.pixiReady ? this.app.stage : null;
        }

        // Resize handler
        resize(width, height) {
            this.width = width;
            this.height = height;

            if (this.pixiReady && this.app) {
                this.app.renderer.resize(width, height);
            }

            if (this.canvas) {
                this.canvas.width = width;
                this.canvas.height = height;
            }
        }

        // Destroy
        destroy() {
            if (this.pixiReady && this.app) {
                this.app.destroy(true, { children: true, texture: true, baseTexture: true });
                this.pixiReady = false;
            }
        }
    }

    // Export to global scope
    window.RendererAdapter = RendererAdapter;

})();
