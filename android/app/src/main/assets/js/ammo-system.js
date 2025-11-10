/**
 * BRAWL STARS - AMMO & RELOAD SYSTEM
 * Sistema de munición y recarga automática tipo Brawl Stars
 */

class AmmoSystem {
    constructor() {
        // Configuración de munición
        this.maxAmmo = 3;           // Máximo de balas
        this.currentAmmo = 3;       // Balas actuales
        this.reloadTime = 1000;     // 1 segundo por bala
        this.lastReloadTime = 0;    // Timestamp de última recarga
        this.isReloading = false;   // Flag de recarga en progreso

        // Visual settings
        this.bulletSpacing = 12;    // Espaciado entre bullets
        this.bulletRadius = 8;      // Radio de cada bullet UI
        this.yOffset = 60;          // Offset desde el jugador
    }

    /**
     * Actualiza el sistema de recarga
     */
    update(currentTime) {
        // Si ya tenemos munición completa, no hacer nada
        if (this.currentAmmo >= this.maxAmmo) {
            this.isReloading = false;
            return;
        }

        // Calcular tiempo desde última recarga
        const timeSinceLastReload = currentTime - this.lastReloadTime;

        // Si pasó el tiempo de recarga, agregar una bala
        if (timeSinceLastReload >= this.reloadTime) {
            this.currentAmmo++;
            this.lastReloadTime = currentTime;

            // FASE 5: Efecto visual de recarga completada
            this.justReloaded = true;
            setTimeout(() => { this.justReloaded = false; }, 200);

            // Si completamos la recarga, limpiar flag
            if (this.currentAmmo >= this.maxAmmo) {
                this.isReloading = false;
            }
        }
    }

    /**
     * Intenta disparar una bala
     * @returns {boolean} true si se pudo disparar, false si no hay munición
     */
    tryShoot() {
        if (this.currentAmmo > 0) {
            this.currentAmmo--;

            // Iniciar recarga si disparamos la primera bala
            if (this.currentAmmo < this.maxAmmo && !this.isReloading) {
                this.isReloading = true;
                this.lastReloadTime = performance.now();
            }

            return true;
        }
        return false;
    }

    /**
     * Obtiene el progreso de recarga de la siguiente bala (0.0 - 1.0)
     */
    getReloadProgress(currentTime) {
        if (this.currentAmmo >= this.maxAmmo) {
            return 1.0;
        }

        const timeSinceLastReload = currentTime - this.lastReloadTime;
        return Math.min(1.0, timeSinceLastReload / this.reloadTime);
    }

    /**
     * Renderiza el UI de munición debajo del jugador
     * @param {CanvasRenderingContext2D} ctx
     * @param {number} playerX - Posición X del jugador en screen space
     * @param {number} playerY - Posición Y del jugador en screen space
     * @param {number} zoom - Nivel de zoom actual
     */
    render(ctx, playerX, playerY, zoom) {
        const currentTime = performance.now();
        const reloadProgress = this.getReloadProgress(currentTime);

        // Calcular posición centrada debajo del jugador
        const totalWidth = (this.maxAmmo - 1) * this.bulletSpacing;
        const startX = playerX - totalWidth / 2;
        const y = playerY + this.yOffset;

        // Renderizar cada slot de munición
        for (let i = 0; i < this.maxAmmo; i++) {
            const x = startX + i * this.bulletSpacing;
            const isFilled = i < this.currentAmmo;
            const isReloading = i === this.currentAmmo && this.currentAmmo < this.maxAmmo;

            // Estado de la bala
            let fillColor, strokeColor, glowIntensity;

            if (isFilled) {
                // Bala disponible - Verde neón brillante
                fillColor = '#00ff88';
                strokeColor = '#00ff88';
                glowIntensity = 0.8;
            } else if (isReloading) {
                // Bala recargándose - Amarillo con progreso
                fillColor = '#ffaa00';
                strokeColor = '#ffaa00';
                glowIntensity = 0.5;
            } else {
                // Slot vacío - Gris apagado
                fillColor = '#333333';
                strokeColor = '#666666';
                glowIntensity = 0.1;
            }

            ctx.save();

            // Glow effect
            if (glowIntensity > 0.3) {
                ctx.shadowColor = fillColor;
                ctx.shadowBlur = 15 * glowIntensity;
            }

            // Círculo de fondo (siempre completo)
            ctx.beginPath();
            ctx.arc(x, y, this.bulletRadius, 0, Math.PI * 2);
            ctx.fillStyle = '#111111';
            ctx.fill();

            // Borde
            ctx.strokeStyle = strokeColor;
            ctx.lineWidth = 2;
            ctx.stroke();

            // Fill - si está recargando, mostrar progreso circular
            if (isReloading && reloadProgress < 1.0) {
                // Progreso circular (clockwise desde arriba)
                ctx.beginPath();
                ctx.arc(
                    x, y,
                    this.bulletRadius - 2,
                    -Math.PI / 2,
                    -Math.PI / 2 + (Math.PI * 2 * reloadProgress)
                );
                ctx.lineTo(x, y);
                ctx.closePath();
                ctx.fillStyle = fillColor;
                ctx.fill();
            } else if (isFilled) {
                // Bala completa
                ctx.beginPath();
                ctx.arc(x, y, this.bulletRadius - 2, 0, Math.PI * 2);
                ctx.fillStyle = fillColor;
                ctx.fill();

                // FASE 5: Efecto de pulso cuando acaba de recargar
                if (this.justReloaded && i === this.currentAmmo - 1) {
                    const pulseRadius = this.bulletRadius + Math.sin(Date.now() * 0.05) * 3;
                    ctx.globalAlpha = 0.5;
                    ctx.strokeStyle = fillColor;
                    ctx.lineWidth = 3;
                    ctx.beginPath();
                    ctx.arc(x, y, pulseRadius, 0, Math.PI * 2);
                    ctx.stroke();
                    ctx.globalAlpha = 1;
                }
            }

            ctx.restore();
        }

        // Texto de debug (opcional)
        if (false) { // Cambiar a true para debug
            ctx.save();
            ctx.fillStyle = '#ffffff';
            ctx.font = '10px monospace';
            ctx.textAlign = 'center';
            ctx.fillText(
                `${this.currentAmmo}/${this.maxAmmo}`,
                playerX,
                y + 20
            );
            ctx.restore();
        }
    }

    /**
     * Recarga completa instantánea (para power-ups)
     */
    instantReload() {
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;
    }

    /**
     * Resetea el sistema (para inicio de partida)
     */
    reset() {
        this.currentAmmo = this.maxAmmo;
        this.isReloading = false;
        this.lastReloadTime = 0;
    }

    /**
     * Verifica si puede disparar
     */
    canShoot() {
        return this.currentAmmo > 0;
    }

    /**
     * Obtiene información de estado para debugging
     */
    getStatus() {
        return {
            current: this.currentAmmo,
            max: this.maxAmmo,
            isReloading: this.isReloading,
            reloadProgress: this.getReloadProgress(performance.now())
        };
    }
}

// Exportar para uso global
if (typeof window !== 'undefined') {
    window.AmmoSystem = AmmoSystem;
}
