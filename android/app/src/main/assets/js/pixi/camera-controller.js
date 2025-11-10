/* ===================================
   CAMERA CONTROLLER - Smooth camera with lerp and bounds
   ================================== */

(function() {
    'use strict';

    class CameraController {
        constructor(config = {}) {
            this.x = config.x || 0;
            this.y = config.y || 0;
            this.targetX = this.x;
            this.targetY = this.y;
            
            // Camera settings
            this.smoothing = config.smoothing || 0.1; // Lerp factor (0-1)
            this.bounds = config.bounds || null; // { minX, maxX, minY, maxY }
            
            // Viewport size
            this.viewportWidth = config.viewportWidth || 800;
            this.viewportHeight = config.viewportHeight || 600;
            
            // Shake offset (applied by CameraEffects)
            this.shakeX = 0;
            this.shakeY = 0;
        }

        // Set camera target (usually player position)
        setTarget(x, y) {
            this.targetX = x;
            this.targetY = y;
        }

        // Update camera (call every frame)
        update() {
            // Smooth lerp towards target
            this.x += (this.targetX - this.x) * this.smoothing;
            this.y += (this.targetY - this.y) * this.smoothing;

            // Apply bounds if set
            if (this.bounds) {
                const halfWidth = this.viewportWidth / 2;
                const halfHeight = this.viewportHeight / 2;

                this.x = Math.max(this.bounds.minX + halfWidth, Math.min(this.bounds.maxX - halfWidth, this.x));
                this.y = Math.max(this.bounds.minY + halfHeight, Math.min(this.bounds.maxY - halfHeight, this.y));
            }
        }

        // Set bounds
        setBounds(minX, maxX, minY, maxY) {
            this.bounds = { minX, maxX, minY, maxY };
        }

        // Get top-left corner (for rendering)
        getTopLeft() {
            return {
                x: this.x - this.viewportWidth / 2 + this.shakeX,
                y: this.y - this.viewportHeight / 2 + this.shakeY
            };
        }

        // Resize viewport
        resize(width, height) {
            this.viewportWidth = width;
            this.viewportHeight = height;
        }
    }

    // Export to global scope
    window.CameraController = CameraController;

})();
