/* ===================================
   DYNAMIC JOYSTICK SYSTEM - Brawl Stars Style
   Invisible joysticks that appear on touch
   ================================== */

(function() {
    'use strict';

    // ===================================
    // JOYSTICK CLASS
    // ===================================

    class DynamicJoystick {
        constructor(side, maxRadius = 80) {
            this.side = side; // 'left' or 'right'
            this.maxRadius = maxRadius;
            this.baseRadius = 60;
            this.stickRadius = 25;

            // State
            this.isActive = false;
            this.startX = 0;
            this.startY = 0;
            this.currentX = 0;
            this.currentY = 0;

            // Output values
            this.angle = 0;
            this.strength = 0; // 0 to 1
            this.deltaX = 0;
            this.deltaY = 0;

            // Visual
            this.opacity = 0;
            this.fadeSpeed = 0.1;

            // Touch tracking
            this.touchId = null;
        }

        /**
         * Activate joystick at touch position
         */
        activate(x, y, touchId) {
            this.isActive = true;
            this.startX = x;
            this.startY = y;
            this.currentX = x;
            this.currentY = y;
            this.touchId = touchId;
            this.opacity = 0;
        }

        /**
         * Update joystick position
         */
        update(x, y) {
            if (!this.isActive) return;

            this.currentX = x;
            this.currentY = y;

            // Calculate delta from start position
            const dx = this.currentX - this.startX;
            const dy = this.currentY - this.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);

            // Clamp to max radius
            if (distance > this.maxRadius) {
                const ratio = this.maxRadius / distance;
                this.currentX = this.startX + dx * ratio;
                this.currentY = this.startY + dy * ratio;
            }

            // Calculate angle and strength
            this.angle = Math.atan2(dy, dx);
            this.strength = Math.min(distance / this.maxRadius, 1.0);

            // Calculate normalized delta (-1 to 1)
            this.deltaX = (this.currentX - this.startX) / this.maxRadius;
            this.deltaY = (this.currentY - this.startY) / this.maxRadius;

            // Fade in
            if (this.opacity < 1) {
                this.opacity = Math.min(1, this.opacity + this.fadeSpeed);
            }
        }

        /**
         * Deactivate joystick
         */
        deactivate() {
            this.isActive = false;
            this.touchId = null;
            this.strength = 0;
            this.deltaX = 0;
            this.deltaY = 0;
        }

        /**
         * Fade out animation
         */
        fadeOut() {
            if (this.opacity > 0) {
                this.opacity = Math.max(0, this.opacity - this.fadeSpeed * 2);
            }
        }

        /**
         * Render joystick
         */
        render(ctx, cameraZoom = 1) {
            if (this.opacity <= 0) return;

            // Los joysticks están en coordenadas de canvas (UI), no de mundo
            // No necesitan transformación de zoom

            ctx.save();
            ctx.globalAlpha = this.opacity * 0.6;

            // Base circle
            const baseColor = this.side === 'left' ? '#00ffff' : '#ff00ff';

            // Outer glow
            ctx.shadowBlur = 20;
            ctx.shadowColor = baseColor;
            ctx.strokeStyle = baseColor;
            ctx.lineWidth = 3;
            ctx.beginPath();
            ctx.arc(this.startX, this.startY, this.baseRadius, 0, Math.PI * 2);
            ctx.stroke();

            // Inner circle
            ctx.globalAlpha = this.opacity * 0.3;
            ctx.fillStyle = baseColor;
            ctx.beginPath();
            ctx.arc(this.startX, this.startY, this.baseRadius * 0.8, 0, Math.PI * 2);
            ctx.fill();

            // Stick
            if (this.isActive) {
                ctx.globalAlpha = this.opacity * 0.8;
                ctx.shadowBlur = 15;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(this.currentX, this.currentY, this.stickRadius, 0, Math.PI * 2);
                ctx.fill();

                // Direction line
                if (this.strength > 0.1) {
                    ctx.globalAlpha = this.opacity * 0.5;
                    ctx.strokeStyle = '#ffffff';
                    ctx.lineWidth = 2;
                    ctx.beginPath();
                    ctx.moveTo(this.startX, this.startY);
                    ctx.lineTo(this.currentX, this.currentY);
                    ctx.stroke();
                }
            }

            ctx.shadowBlur = 0;
            ctx.restore();
        }

        /**
         * Check if touch is in joystick area
         */
        containsTouch(x, y) {
            if (!this.isActive) return false;
            const dx = x - this.startX;
            const dy = y - this.startY;
            const distance = Math.sqrt(dx * dx + dy * dy);
            return distance <= this.maxRadius * 1.5; // Slightly larger hit area
        }
    }

    // ===================================
    // JOYSTICK MANAGER
    // ===================================

    class JoystickManager {
        constructor(canvas) {
            this.canvas = canvas;
            this.leftJoystick = new DynamicJoystick('left');
            this.rightJoystick = new DynamicJoystick('right');

            // Active touches
            this.touches = new Map();

            // Initialize event listeners
            this.initEventListeners();
        }

        /**
         * Initialize touch and mouse event listeners
         */
        initEventListeners() {
            // Touch events
            this.canvas.addEventListener('touchstart', this.handleTouchStart.bind(this), { passive: false });
            this.canvas.addEventListener('touchmove', this.handleTouchMove.bind(this), { passive: false });
            this.canvas.addEventListener('touchend', this.handleTouchEnd.bind(this), { passive: false });
            this.canvas.addEventListener('touchcancel', this.handleTouchEnd.bind(this), { passive: false });

            // Mouse events (for testing on PC)
            this.canvas.addEventListener('mousedown', this.handleMouseDown.bind(this));
            this.canvas.addEventListener('mousemove', this.handleMouseMove.bind(this));
            this.canvas.addEventListener('mouseup', this.handleMouseUp.bind(this));
            this.canvas.addEventListener('mouseleave', this.handleMouseUp.bind(this));
        }

        /**
         * Handle touch start
         */
        handleTouchStart(e) {
            e.preventDefault();

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                // FIXED: Usar rect.width (CSS width) en lugar de canvas.width (physical pixels)
                const midpoint = rect.width / 2;
                const isLeftSide = x < midpoint;

                console.log(`🎮 Touch ${i}:`, {
                    x: x.toFixed(1),
                    y: y.toFixed(1),
                    rectWidth: rect.width,
                    midpoint: midpoint,
                    percentX: (x / rect.width * 100).toFixed(1) + '%',
                    isLeftSide: isLeftSide
                });

                // Activate appropriate joystick
                if (isLeftSide && !this.leftJoystick.isActive) {
                    console.log('   ✅ ACTIVATING LEFT JOYSTICK');
                    this.leftJoystick.activate(x, y, touch.identifier);
                    this.touches.set(touch.identifier, 'left');
                } else if (!isLeftSide && !this.rightJoystick.isActive) {
                    console.log('   ✅ ACTIVATING RIGHT JOYSTICK');
                    this.rightJoystick.activate(x, y, touch.identifier);
                    this.touches.set(touch.identifier, 'right');
                }
            }
        }

        /**
         * Handle touch move
         */
        handleTouchMove(e) {
            e.preventDefault();

            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const side = this.touches.get(touch.identifier);

                if (!side) continue;

                const rect = this.canvas.getBoundingClientRect();
                const x = touch.clientX - rect.left;
                const y = touch.clientY - rect.top;

                if (side === 'left') {
                    this.leftJoystick.update(x, y);
                } else {
                    this.rightJoystick.update(x, y);
                }
            }
        }

        /**
         * Handle touch end
         */
        handleTouchEnd(e) {
            e.preventDefault();
            for (let i = 0; i < e.changedTouches.length; i++) {
                const touch = e.changedTouches[i];
                const side = this.touches.get(touch.identifier);
                if (!side) continue;
                if (side === 'left') {
                    this.leftJoystick.deactivate();
                } else {
                    // Guardar info para disparo en game.js
                    window._joystickRightJustReleased = true;
                    window._joystickRightLastStrength = this.rightJoystick.strength;
                    window._joystickRightLastAngle = this.rightJoystick.angle;
                    this.rightJoystick.deactivate();
                }
                this.touches.delete(touch.identifier);
            }
        }

        /**
         * Handle mouse down (for PC testing)
         */
        handleMouseDown(e) {
            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            const isLeftSide = x < this.canvas.width / 2;

            if (isLeftSide && !this.leftJoystick.isActive) {
                this.leftJoystick.activate(x, y, 'mouse');
                this.touches.set('mouse-left', 'left');
            } else if (!isLeftSide && !this.rightJoystick.isActive) {
                this.rightJoystick.activate(x, y, 'mouse');
                this.touches.set('mouse-right', 'right');
            }
        }

        /**
         * Handle mouse move
         */
        handleMouseMove(e) {
            if (!this.leftJoystick.isActive && !this.rightJoystick.isActive) return;

            const rect = this.canvas.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;

            if (this.leftJoystick.isActive && this.leftJoystick.touchId === 'mouse') {
                this.leftJoystick.update(x, y);
            }
            if (this.rightJoystick.isActive && this.rightJoystick.touchId === 'mouse') {
                this.rightJoystick.update(x, y);
            }
        }

        /**
         * Handle mouse up
         */
        handleMouseUp(e) {
            if (this.leftJoystick.isActive && this.leftJoystick.touchId === 'mouse') {
                this.leftJoystick.deactivate();
                this.touches.delete('mouse-left');
            }
            if (this.rightJoystick.isActive && this.rightJoystick.touchId === 'mouse') {
                this.rightJoystick.deactivate();
                this.touches.delete('mouse-right');
            }
        }

        /**
         * Update joystick fade animations
         */
        update() {
            if (!this.leftJoystick.isActive) {
                this.leftJoystick.fadeOut();
            }
            if (!this.rightJoystick.isActive) {
                this.rightJoystick.fadeOut();
            }
        }

        /**
         * Render both joysticks
         */
        render(ctx, cameraZoom = 1) {
            this.leftJoystick.render(ctx, cameraZoom);
            this.rightJoystick.render(ctx, cameraZoom);
        }

        /**
         * Get movement input (from left joystick)
         */
        getMovementInput() {
            return {
                x: this.leftJoystick.deltaX,
                y: this.leftJoystick.deltaY,
                angle: this.leftJoystick.angle,
                strength: this.leftJoystick.strength,
                isActive: this.leftJoystick.isActive
            };
        }

        /**
         * Get shooting input (from right joystick)
         */
        getShootingInput() {
            return {
                x: this.rightJoystick.deltaX,
                y: this.rightJoystick.deltaY,
                angle: this.rightJoystick.angle,
                strength: this.rightJoystick.strength,
                isActive: this.rightJoystick.isActive
            };
        }

        /**
         * Reset all joysticks
         */
        reset() {
            this.leftJoystick.deactivate();
            this.rightJoystick.deactivate();
            this.touches.clear();
        }
    }

    // ===================================
    // EXPORT TO GLOBAL SCOPE
    // ===================================

    window.DynamicJoystick = DynamicJoystick;
    window.JoystickManager = JoystickManager;

    console.log('✅ Dynamic Joystick System loaded');

})();
