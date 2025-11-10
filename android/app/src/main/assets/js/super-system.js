/**
 * BRAWL STARS - SUPER/ULTIMATE SYSTEM
 * Sistema de habilidad especial que se carga con daño infligido
 */

class SuperSystem {
    constructor() {
        // Configuración de carga
        this.maxCharge = 1000;      // Daño total necesario para cargar el super
        this.currentCharge = 0;     // Carga actual
        this.isReady = false;       // Si el super está listo para usar
        this.isActive = false;      // Si el super está siendo usado
        this.cooldown = 0;          // Tiempo de cooldown después de usar
        this.maxCooldown = 2000;    // 2 segundos de cooldown

        // Visual settings
        this.barWidth = 200;        // Ancho de la barra
        this.barHeight = 20;        // Alto de la barra
        this.yOffset = -80;         // Offset desde el jugador
    }

    /**
     * Añade carga al super basado en el daño infligido
     * @param {number} damage - Daño infligido
     */
    addCharge(damage) {
        if (this.isReady) return; // Ya está cargado

        this.currentCharge = Math.min(this.maxCharge, this.currentCharge + damage);

        if (this.currentCharge >= this.maxCharge) {
            this.isReady = true;
            this.currentCharge = this.maxCharge;
            console.log('⚡ SUPER READY!');
        }
    }

    /**
     * Actualiza el sistema (cooldown)
     * @param {number} deltaTime - Tiempo transcurrido en ms
     */
    update(deltaTime) {
        if (this.cooldown > 0) {
            this.cooldown = Math.max(0, this.cooldown - deltaTime);
        }
    }

    /**
     * Intenta activar el super
     * @returns {boolean} - true si se activó correctamente
     */
    tryActivate() {
        if (!this.isReady || this.cooldown > 0) {
            return false;
        }

        this.isReady = false;
        this.isActive = true;
        this.currentCharge = 0;
        this.cooldown = this.maxCooldown;

        console.log('💥 SUPER ACTIVATED!');
        return true;
    }

    /**
     * Obtiene el progreso de carga (0.0 - 1.0)
     */
    getChargeProgress() {
        return this.currentCharge / this.maxCharge;
    }

    /**
     * Renderiza la barra de super debajo del jugador
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} playerX - Posición X del jugador en screen space
     * @param {number} playerY - Posición Y del jugador en screen space
     */
    render(ctx, playerX, playerY) {
        const progress = this.getChargeProgress();
        const x = playerX - this.barWidth / 2;
        const y = playerY + this.yOffset;

        // Background bar (oscuro)
        ctx.fillStyle = '#111111';
        ctx.strokeStyle = '#333333';
        ctx.lineWidth = 2;
        ctx.fillRect(x, y, this.barWidth, this.barHeight);
        ctx.strokeRect(x, y, this.barWidth, this.barHeight);

        // Progress bar (amarillo/dorado con glow)
        if (progress > 0) {
            const progressWidth = this.barWidth * progress;

            // Glow effect
            ctx.shadowColor = this.isReady ? '#ffff00' : '#ff9900';
            ctx.shadowBlur = this.isReady ? 20 : 10;

            // Gradient fill
            const gradient = ctx.createLinearGradient(x, y, x, y + this.barHeight);
            if (this.isReady) {
                gradient.addColorStop(0, '#ffff00');
                gradient.addColorStop(1, '#ffaa00');
            } else {
                gradient.addColorStop(0, '#ff9900');
                gradient.addColorStop(1, '#ff6600');
            }

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, progressWidth, this.barHeight);

            ctx.shadowBlur = 0;
        }

        // Ready indicator (animación pulsante)
        if (this.isReady) {
            const pulse = Math.sin(Date.now() * 0.008) * 0.3 + 0.7;
            ctx.globalAlpha = pulse;

            // Outer glow
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 25;
            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.strokeRect(x - 2, y - 2, this.barWidth + 4, this.barHeight + 4);

            ctx.globalAlpha = 1;
            ctx.shadowBlur = 0;
        }

        // Texto de estado
        ctx.save();
        ctx.fillStyle = '#ffffff';
        ctx.font = 'bold 12px Orbitron';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        if (this.isReady) {
            ctx.shadowColor = '#ffff00';
            ctx.shadowBlur = 10;
            ctx.fillText('⚡ SUPER READY ⚡', playerX, y + this.barHeight / 2);
        } else if (this.cooldown > 0) {
            const cooldownSec = Math.ceil(this.cooldown / 1000);
            ctx.fillText(`Cooldown: ${cooldownSec}s`, playerX, y + this.barHeight / 2);
        } else {
            ctx.fillText(`${Math.floor(progress * 100)}%`, playerX, y + this.barHeight / 2);
        }

        ctx.shadowBlur = 0;
        ctx.restore();
    }

    /**
     * Resetea el sistema (para inicio de partida)
     */
    reset() {
        this.currentCharge = 0;
        this.isReady = false;
        this.isActive = false;
        this.cooldown = 0;
    }

    /**
     * Verifica si puede activar el super
     */
    canActivate() {
        return this.isReady && this.cooldown === 0;
    }

    /**
     * Obtiene información de estado para debugging
     */
    getStatus() {
        return {
            charge: this.currentCharge,
            maxCharge: this.maxCharge,
            progress: this.getChargeProgress(),
            isReady: this.isReady,
            isActive: this.isActive,
            cooldown: this.cooldown
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.SuperSystem = SuperSystem;
}
