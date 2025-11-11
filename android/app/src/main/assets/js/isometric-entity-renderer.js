/* ===================================
   ISOMETRIC ENTITY RENDERER
   Funciones helper para renderizar entidades en coordenadas isométricas
   ================================== */

(function() {
    'use strict';

    /**
     * Convierte posición del mundo (píxeles cartesianos) a posición isométrica de pantalla
     * @param {number} worldX - Coordenada X del mundo en píxeles
     * @param {number} worldY - Coordenada Y del mundo en píxeles
     * @param {number} cameraX - Offset X de cámara en píxeles del mundo (cartesiano)
     * @param {number} cameraY - Offset Y de cámara en píxeles del mundo (cartesiano)
     * @param {number} canvasWidth - Ancho del canvas
     * @param {number} canvasHeight - Alto del canvas
     * @param {number} tileSize - Tamaño del tile en el mundo (default 64)
     * @returns {{x: number, y: number}} - Coordenadas isométricas de pantalla
     */
    function worldToIsoScreen(worldX, worldY, cameraX, cameraY, canvasWidth, canvasHeight, tileSize = 64) {
        if (!window.IsometricTransform) {
            // Fallback: renderizado 2D normal
            return {
                x: worldX - cameraX,
                y: worldY - cameraY
            };
        }

        // Convertir posición del mundo (píxeles) a tiles
        const entityTileX = worldX / tileSize;
        const entityTileY = worldY / tileSize;

        // Convertir cámara del mundo (píxeles) a tiles
        const cameraTileX = cameraX / tileSize;
        const cameraTileY = cameraY / tileSize;

        // Convertir ambas posiciones a isométrico
        const entityIso = window.IsometricTransform.mapToIso(entityTileX, entityTileY);
        const cameraIso = window.IsometricTransform.mapToIso(cameraTileX, cameraTileY);

        // Calcular posición en pantalla (centrada)
        return {
            x: entityIso.x - cameraIso.x + (canvasWidth / 2),
            y: entityIso.y - cameraIso.y + (canvasHeight / 2)
        };
    }

    /**
     * Renderiza al jugador en coordenadas isométricas
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} player - Objeto del jugador
     * @param {number} cameraX - Offset X de cámara (coordenadas cartesianas del mundo)
     * @param {number} cameraY - Offset Y de cámara (coordenadas cartesianas del mundo)
     */
    function renderPlayerIsometric(ctx, player, cameraX, cameraY) {
        const screenPos = worldToIsoScreen(
            player.x, player.y,
            cameraX, cameraY,
            ctx.canvas.width, ctx.canvas.height
        );

        // Guardar estado del contexto
        ctx.save();

        // Sombra proyectada isométrica
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 15;
        ctx.shadowOffsetX = 8;
        ctx.shadowOffsetY = 8;

        // Cuerpo principal (esfera neon)
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, player.radius, 0, Math.PI * 2);

        // Gradiente radial para efecto 3D
        const grad = ctx.createRadialGradient(
            screenPos.x - player.radius * 0.4,
            screenPos.y - player.radius * 0.4,
            player.radius * 0.2,
            screenPos.x,
            screenPos.y,
            player.radius
        );
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.45, player.color);
        grad.addColorStop(1, '#222');

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.98;
        ctx.fill();

        // Resetear sombra
        ctx.shadowBlur = 0;
        ctx.shadowOffsetX = 0;
        ctx.shadowOffsetY = 0;

        // Brillo superior (highlight)
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(
            screenPos.x - player.radius * 0.35,
            screenPos.y - player.radius * 0.35,
            player.radius * 0.35,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Borde externo neon
        ctx.globalAlpha = 0.5;
        ctx.strokeStyle = player.color;
        ctx.lineWidth = 3;
        ctx.shadowBlur = 15;
        ctx.shadowColor = player.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, player.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Restaurar estado
        ctx.restore();
    }

    /**
     * Renderiza un enemigo en coordenadas isométricas
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} enemy - Objeto del enemigo
     * @param {number} cameraX - Offset X de cámara (coordenadas cartesianas del mundo)
     * @param {number} cameraY - Offset Y de cámara (coordenadas cartesianas del mundo)
     */
    function renderEnemyIsometric(ctx, enemy, cameraX, cameraY) {
        const screenPos = worldToIsoScreen(
            enemy.x, enemy.y,
            cameraX, cameraY,
            ctx.canvas.width, ctx.canvas.height
        );

        ctx.save();

        // Sombra
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = enemy.isBoss ? 45 : 22;

        // Cuerpo principal
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, enemy.radius, 0, Math.PI * 2);

        // Gradiente radial
        const grad = ctx.createRadialGradient(
            screenPos.x - enemy.radius * 0.4,
            screenPos.y - enemy.radius * 0.4,
            enemy.radius * 0.2,
            screenPos.x,
            screenPos.y,
            enemy.radius
        );
        grad.addColorStop(0, '#fff');
        grad.addColorStop(0.45, enemy.color);
        grad.addColorStop(1, '#222');

        ctx.fillStyle = grad;
        ctx.globalAlpha = 0.98;
        ctx.fill();

        // Resetear sombra
        ctx.shadowBlur = 0;

        // Brillo superior
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(
            screenPos.x - enemy.radius * 0.35,
            screenPos.y - enemy.radius * 0.35,
            enemy.radius * 0.35,
            0,
            Math.PI * 2
        );
        ctx.fillStyle = '#fff';
        ctx.fill();

        // Borde neon
        ctx.globalAlpha = 0.6;
        ctx.strokeStyle = enemy.color;
        ctx.lineWidth = enemy.isBoss ? 4 : 2.5;
        ctx.shadowBlur = enemy.isBoss ? 25 : 12;
        ctx.shadowColor = enemy.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, enemy.radius, 0, Math.PI * 2);
        ctx.stroke();

        // Barra de vida para bosses
        if (enemy.isBoss) {
            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;

            const barWidth = enemy.radius * 2.5;
            const barHeight = 8;
            const barY = screenPos.y - enemy.radius - 20;

            // Fondo de la barra
            ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
            ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);

            // Barra de vida
            const healthPercent = Math.max(0, enemy.health / enemy.maxHealth);
            const healthColor = healthPercent > 0.5 ? '#00ff00' :
                               healthPercent > 0.25 ? '#ffaa00' : '#ff0000';

            ctx.fillStyle = healthColor;
            ctx.fillRect(screenPos.x - barWidth / 2, barY, barWidth * healthPercent, barHeight);

            // Borde de la barra
            ctx.strokeStyle = healthColor;
            ctx.lineWidth = 2;
            ctx.strokeRect(screenPos.x - barWidth / 2, barY, barWidth, barHeight);
        }

        ctx.restore();
    }

    /**
     * Renderiza una bala en coordenadas isométricas
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} bullet - Objeto de la bala
     * @param {number} cameraX - Offset X de cámara
     * @param {number} cameraY - Offset Y de cámara
     */
    function renderBulletIsometric(ctx, bullet, cameraX, cameraY) {
        const screenPos = worldToIsoScreen(
            bullet.x, bullet.y,
            cameraX, cameraY,
            ctx.canvas.width, ctx.canvas.height
        );

        ctx.save();

        // Trail (estela)
        if (bullet.trail && bullet.trail.length > 1) {
            ctx.strokeStyle = bullet.color;
            ctx.lineWidth = bullet.radius * 0.8;
            ctx.globalAlpha = 0.3;
            ctx.shadowBlur = 8;
            ctx.shadowColor = bullet.color;

            ctx.beginPath();
            const firstTrailPos = worldToIsoScreen(
                bullet.trail[0].x, bullet.trail[0].y,
                cameraX, cameraY,
                ctx.canvas.width, ctx.canvas.height
            );
            ctx.moveTo(firstTrailPos.x, firstTrailPos.y);

            for (let i = 1; i < bullet.trail.length; i++) {
                const trailPos = worldToIsoScreen(
                    bullet.trail[i].x, bullet.trail[i].y,
                    cameraX, cameraY,
                    ctx.canvas.width, ctx.canvas.height
                );
                ctx.lineTo(trailPos.x, trailPos.y);
            }
            ctx.stroke();
        }

        // Bala principal
        ctx.globalAlpha = 0.9;
        ctx.shadowBlur = bullet.glow ? 15 : 10;
        ctx.shadowColor = bullet.color;

        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Núcleo brillante
        ctx.globalAlpha = 0.6;
        ctx.fillStyle = '#fff';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, bullet.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Indicador de crítico
        if (bullet.isCritical) {
            ctx.globalAlpha = 0.8;
            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 2;
            ctx.shadowBlur = 20;
            ctx.shadowColor = '#ff00ff';
            ctx.beginPath();
            ctx.arc(screenPos.x, screenPos.y, bullet.radius * 1.5, 0, Math.PI * 2);
            ctx.stroke();
        }

        ctx.restore();
    }

    /**
     * Renderiza un pickup de habilidad en coordenadas isométricas
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} pickup - Objeto del pickup
     * @param {number} cameraX - Offset X de cámara
     * @param {number} cameraY - Offset Y de cámara
     */
    function renderAbilityPickupIsometric(ctx, pickup, cameraX, cameraY) {
        const screenPos = worldToIsoScreen(
            pickup.x, pickup.y,
            cameraX, cameraY,
            ctx.canvas.width, ctx.canvas.height
        );

        ctx.save();

        // Animación de pulso
        const pulseScale = 1 + Math.sin(pickup.pulse) * 0.15;
        const radius = pickup.radius * pulseScale;

        // Anillo exterior pulsante
        ctx.globalAlpha = 0.3;
        ctx.strokeStyle = '#ffff00';
        ctx.lineWidth = 3;
        ctx.shadowBlur = 20;
        ctx.shadowColor = '#ffff00';
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius * 1.8, 0, Math.PI * 2);
        ctx.stroke();

        // Cuerpo del pickup
        ctx.globalAlpha = 0.8;
        ctx.fillStyle = '#ffff00';
        ctx.shadowBlur = 25;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, radius, 0, Math.PI * 2);
        ctx.fill();

        // Icono de habilidad
        ctx.globalAlpha = 1.0;
        ctx.shadowBlur = 0;
        ctx.fillStyle = '#000';
        ctx.font = `${radius * 1.2}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pickup.ability.icon, screenPos.x, screenPos.y);

        ctx.restore();
    }

    /**
     * Renderiza una partícula en coordenadas isométricas
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} particle - Objeto de partícula
     * @param {number} cameraX - Offset X de cámara
     * @param {number} cameraY - Offset Y de cámara
     */
    function renderParticleIsometric(ctx, particle, cameraX, cameraY) {
        const screenPos = worldToIsoScreen(
            particle.x, particle.y,
            cameraX, cameraY,
            ctx.canvas.width, ctx.canvas.height
        );

        ctx.save();
        ctx.globalAlpha = particle.life / particle.maxLife;
        ctx.fillStyle = particle.color;
        ctx.shadowBlur = 10;
        ctx.shadowColor = particle.color;
        ctx.beginPath();
        ctx.arc(screenPos.x, screenPos.y, particle.radius, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
    }

    /**
     * Renderiza un número de daño flotante en coordenadas isométricas
     * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
     * @param {Object} damageNum - Objeto de número de daño
     * @param {number} cameraX - Offset X de cámara
     * @param {number} cameraY - Offset Y de cámara
     */
    function renderDamageNumberIsometric(ctx, damageNum, cameraX, cameraY) {
        const screenPos = worldToIsoScreen(
            damageNum.x, damageNum.y,
            cameraX, cameraY,
            ctx.canvas.width, ctx.canvas.height
        );

        ctx.save();
        ctx.globalAlpha = damageNum.life;

        // Configurar fuente según si es crítico
        const fontSize = damageNum.isCritical ? 28 * damageNum.scale : 20 * damageNum.scale;
        ctx.font = `bold ${fontSize}px Arial`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Color según tipo de daño
        const color = damageNum.isCritical ? '#ff00ff' : '#ffffff';

        // Borde negro
        ctx.strokeStyle = '#000';
        ctx.lineWidth = 4;
        ctx.strokeText(damageNum.damage.toString(), screenPos.x, screenPos.y);

        // Texto principal
        ctx.fillStyle = color;
        ctx.shadowBlur = damageNum.isCritical ? 15 : 8;
        ctx.shadowColor = color;
        ctx.fillText(damageNum.damage.toString(), screenPos.x, screenPos.y);

        ctx.restore();
    }

    // ===================================
    // EXPORTAR API PÚBLICA
    // ===================================

    const IsometricEntityRenderer = {
        worldToIsoScreen,
        renderPlayerIsometric,
        renderEnemyIsometric,
        renderBulletIsometric,
        renderAbilityPickupIsometric,
        renderParticleIsometric,
        renderDamageNumberIsometric
    };

    // Exponer globalmente
    if (typeof window !== 'undefined') {
        window.IsometricEntityRenderer = IsometricEntityRenderer;
    }

    // Exponer para módulos CommonJS/Node
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IsometricEntityRenderer;
    }

})();
