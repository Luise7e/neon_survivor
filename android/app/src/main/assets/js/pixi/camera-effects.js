/* ===================================
   CAMERA EFFECTS - Screen shake, zoom, y efectos de cámara
   ================================== */

(function() {
    'use strict';

    class CameraEffects {
        constructor(camera) {
            this.camera = camera;
            
            // Shake effect
            this.shakeIntensity = 0;
            this.shakeDuration = 0;
            this.shakeTimer = 0;
            this.shakeOffsetX = 0;
            this.shakeOffsetY = 0;
            
            // Zoom effect
            this.baseZoom = 1.0;
            this.targetZoom = 1.0;
            this.currentZoom = 1.0;
            this.zoomSpeed = 5;
            
            // Flash effect
            this.flashActive = false;
            this.flashColor = 0xffffff;
            this.flashAlpha = 0;
            this.flashDuration = 0;
            this.flashTimer = 0;
            this.flashOverlay = null;
            
            // Slow motion
            this.timeScale = 1.0;
            this.targetTimeScale = 1.0;
            this.timeScaleSpeed = 3;
        }

        // Initialize flash overlay
        initFlashOverlay(width, height, parent) {
            if (this.flashOverlay) return;

            const graphics = new PIXI.Graphics();
            graphics.rect(0, 0, width, height);
            graphics.fill({ color: 0xffffff, alpha: 1 });

            this.flashOverlay = new PIXI.Sprite(
                PIXI.RenderTexture.create({ width, height })
            );
            
            const renderer = window.RendererAdapter?.instance?.app?.renderer;
            if (renderer) {
                renderer.render({ 
                    container: graphics, 
                    target: this.flashOverlay.texture 
                });
            }

            this.flashOverlay.alpha = 0;
            this.flashOverlay.tint = this.flashColor;
            
            if (parent) {
                parent.addChild(this.flashOverlay);
            }
        }

        // Screen shake
        shake(intensity = 10, duration = 0.3) {
            this.shakeIntensity = intensity;
            this.shakeDuration = duration;
            this.shakeTimer = 0;
        }

        // Zoom effect
        setZoom(zoom, smooth = true) {
            this.targetZoom = zoom;
            if (!smooth) {
                this.currentZoom = zoom;
            }
        }

        // Reset zoom
        resetZoom(smooth = true) {
            this.setZoom(this.baseZoom, smooth);
        }

        // Flash effect
        flash(color = 0xffffff, duration = 0.15, intensity = 0.5) {
            this.flashColor = color;
            this.flashDuration = duration;
            this.flashTimer = 0;
            this.flashAlpha = intensity;
            this.flashActive = true;

            if (this.flashOverlay) {
                this.flashOverlay.tint = color;
            }
        }

        // Slow motion
        setTimeScale(scale, smooth = true) {
            this.targetTimeScale = Math.max(0.1, Math.min(2.0, scale));
            if (!smooth) {
                this.timeScale = this.targetTimeScale;
            }
        }

        // Hit pause (brief freeze)
        hitPause(duration = 0.05) {
            this.setTimeScale(0.1, false);
            setTimeout(() => {
                this.setTimeScale(1.0, true);
            }, duration * 1000);
        }

        // Update effects
        update(deltaTime) {
            const realDelta = deltaTime;
            const scaledDelta = deltaTime * this.timeScale;

            // Update shake
            if (this.shakeTimer < this.shakeDuration) {
                this.shakeTimer += realDelta;
                const progress = this.shakeTimer / this.shakeDuration;
                const currentIntensity = this.shakeIntensity * (1 - progress);

                this.shakeOffsetX = (Math.random() - 0.5) * currentIntensity * 2;
                this.shakeOffsetY = (Math.random() - 0.5) * currentIntensity * 2;
            } else {
                this.shakeOffsetX = 0;
                this.shakeOffsetY = 0;
            }

            // Apply shake to camera
            if (this.camera) {
                this.camera.shakeX = this.shakeOffsetX;
                this.camera.shakeY = this.shakeOffsetY;
            }

            // Update zoom
            if (Math.abs(this.currentZoom - this.targetZoom) > 0.001) {
                const zoomDiff = this.targetZoom - this.currentZoom;
                this.currentZoom += zoomDiff * this.zoomSpeed * realDelta;
            } else {
                this.currentZoom = this.targetZoom;
            }

            // Update flash
            if (this.flashActive) {
                this.flashTimer += realDelta;
                const flashProgress = this.flashTimer / this.flashDuration;

                if (flashProgress >= 1) {
                    this.flashActive = false;
                    if (this.flashOverlay) {
                        this.flashOverlay.alpha = 0;
                    }
                } else {
                    const alpha = this.flashAlpha * (1 - flashProgress);
                    if (this.flashOverlay) {
                        this.flashOverlay.alpha = alpha;
                    }
                }
            }

            // Update time scale
            if (Math.abs(this.timeScale - this.targetTimeScale) > 0.01) {
                const scaleDiff = this.targetTimeScale - this.timeScale;
                this.timeScale += scaleDiff * this.timeScaleSpeed * realDelta;
            } else {
                this.timeScale = this.targetTimeScale;
            }

            return scaledDelta;
        }

        // Get current zoom
        getZoom() {
            return this.currentZoom;
        }

        // Get time scale
        getTimeScale() {
            return this.timeScale;
        }

        // Trauma effect (procedural shake)
        addTrauma(amount) {
            const traumaIntensity = amount * 20;
            const traumaDuration = amount * 0.5;
            this.shake(traumaIntensity, traumaDuration);
        }

        // Destroy
        destroy() {
            if (this.flashOverlay) {
                if (this.flashOverlay.parent) {
                    this.flashOverlay.parent.removeChild(this.flashOverlay);
                }
                this.flashOverlay.destroy();
                this.flashOverlay = null;
            }
        }
    }

    // Export to global scope
    window.CameraEffects = CameraEffects;

})();
