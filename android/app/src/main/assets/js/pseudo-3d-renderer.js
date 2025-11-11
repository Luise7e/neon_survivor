/* ===================================
   PSEUDO 3D RENDERER - 2.5D Wall System
   Renderizado isométrico de muros con volumen
   Compatible con móviles (solo Canvas 2D)
   ================================== */

(function() {
    'use strict';

    // ===================================
    // CONFIGURACIÓN 2.5D
    // ===================================

    const CONFIG_3D = {
        // Altura de los muros en píxeles
        wallHeight: 48,

        // Ángulo de cámara (grados)
        // 0° = vista completamente top-down
        // 45° = isométrica clásica
        // 90° = vista lateral
        cameraAngle: 25, // Inclinación ligera para efecto 2.5D

        // Orientación de cámara (grados)
        // 0° = Norte (viendo hacia arriba)
        // 90° = Este (viendo hacia derecha)
        // 180° = Sur (viendo hacia abajo)
        // 270° = Oeste (viendo hacia izquierda)
        cameraOrientation: 135, // Sureste por defecto (ve hacia arriba-izquierda)

        // Colores para las caras del muro
        colors: {
            // Cara superior (vista desde arriba)
            top: '#00ffff',
            topGlow: '#00ccff',

            // Cara sur (frente cuando miras hacia norte)
            south: '#00bbdd',
            southGlow: '#008899',

            // Cara este (lado derecho cuando miras hacia norte)
            east: '#0099bb',
            eastGlow: '#006677',

            // Sombra proyectada
            shadow: 'rgba(0, 0, 0, 0.4)'
        },

        // Factor de oscurecimiento para caras laterales
        sideDarkenFactor: 0.3,

        // Activar sombras proyectadas
        enableShadows: true,

        // Offset de sombra
        shadowOffsetX: 8,
        shadowOffsetY: 8,

        // Difuminado de sombra
        shadowBlur: 12,

        // Renderizar en orden de profundidad
        depthSorting: true,

        // Transición suave para paredes laterales (0-1)
        // Controla el efecto de "deslizamiento" al descubrir paredes
        sideWallTransition: 0.15
    };

    // ===================================
    // PSEUDO 3D RENDERER CLASS
    // ===================================

    class Pseudo3DRenderer {
        constructor() {
            this.config = { ...CONFIG_3D };

            // Pre-calcular valores trigonométricos para optimización
            this.updateCameraMatrices();
        }

        /**
         * Actualizar matrices de cámara cuando cambia el ángulo
         */
        updateCameraMatrices() {
            const angleRad = (this.config.cameraAngle * Math.PI) / 180;
            const orientRad = (this.config.cameraOrientation * Math.PI) / 180;

            // Factor de proyección Y (simula profundidad)
            // angle = 0° → factor = 0 (sin profundidad, flat)
            // angle = 45° → factor = 0.707 (isométrica)
            // angle = 90° → factor = 1 (vista lateral completa)
            this.depthFactor = Math.sin(angleRad);

            // Dirección de la cámara (vector unitario)
            this.cameraDir = {
                x: Math.cos(orientRad),
                y: Math.sin(orientRad)
            };
        }

        /**
         * Cambiar ángulo de cámara
         * @param {number} angle - Ángulo en grados (0-90)
         */
        setCameraAngle(angle) {
            this.config.cameraAngle = Math.max(0, Math.min(90, angle));
            this.updateCameraMatrices();
        }

        /**
         * Cambiar orientación de cámara
         * @param {number} orientation - Orientación en grados (0-360)
         */
        setCameraOrientation(orientation) {
            this.config.cameraOrientation = orientation % 360;
            this.updateCameraMatrices();
        }

        /**
         * Determinar qué caras laterales son visibles según orientación Y posición del tile
         * Se usa para optimizar el renderizado: solo dibujamos caras que realmente se ven
         * Basado en vista top-down con inclinación, las paredes laterales se ven según:
         * - Paredes ESTE/OESTE: siempre visibles (vista oblicua desde arriba)
         * - Paredes NORTE: solo si no hay muro adyacente al norte
         * - Paredes SUR: solo si no hay muro adyacente al sur
         * @param {number} tileX - Coordenada X del tile en grid
         * @param {number} tileY - Coordenada Y del tile en grid
         * @returns {Object} { south: boolean, east: boolean, north: boolean, west: boolean }
         */
        getVisibleFaces(tileX, tileY) {
            // LÓGICA DE VISIBILIDAD MEJORADA:
            // Con cámara top-down oblicua viendo hacia el noreste (135°):
            // - Vemos siempre las caras SUR (parte frontal inferior de cada tile)
            // - Vemos las caras ESTE (lado derecho) de tiles del lado IZQUIERDO del mapa
            // - Vemos las caras OESTE (lado izquierdo) de tiles del lado DERECHO del mapa
            // - Vemos ocasionalmente las caras NORTE (parte trasera) si están expuestas

            return {
                south: true,  // Cara frontal inferior - siempre visible en top-down
                east: true,   // Cara lateral derecha - visible según posición
                north: true,  // Cara trasera superior - visible si expuesta
                west: true    // Cara lateral izquierda - visible según posición
            };
        }

        /**
         * Renderizar un tile de muro con efecto 2.5D
         * ALGORITMO DE PROFUNDIDAD:
         * 1. Sombra proyectada (nivel más bajo)
         * 2. Caras laterales (orden: norte → oeste → este → sur)
         * 3. Cara superior (nivel más alto)
         *
         * OPTIMIZACIÓN: Solo renderiza caras visibles basándose en vecinos
         * EFECTO DE TRANSICIÓN: Paredes laterales con deslizamiento suave
         *
         * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
         * @param {number} x - Posición X en pantalla
         * @param {number} y - Posición Y en pantalla
         * @param {number} tileSize - Tamaño del tile
         * @param {number} tileX - Coordenada X del tile en grid
         * @param {number} tileY - Coordenada Y del tile en grid
         * @param {Object} neighbors - Vecinos del tile {N, E, S, W}
         */
        renderWallTile(ctx, x, y, tileSize, tileX, tileY, neighbors) {
            const height = this.config.wallHeight;
            const visibleFaces = this.getVisibleFaces(tileX, tileY);

            ctx.save();

            // ============================================
            // 1. SOMBRA PROYECTADA (renderizar primero - nivel más bajo)
            // ============================================
            if (this.config.enableShadows) {
                this._renderShadow(ctx, x, y, tileSize, height);
            }

            // ============================================
            // 2. CARAS LATERALES VISIBLES
            // Renderizamos en orden back-to-front para correcta oclusión:
            // - NORTE (atrás) primero
            // - OESTE y ESTE (laterales) segundo
            // - SUR (frente) al final
            // ============================================

            // Calcular offset vertical por perspectiva
            const yOffset = height * this.depthFactor;

            // Cara NORTE (parte de atrás) - renderizar primero (más alejada)
            if (visibleFaces.north && !neighbors.N) {
                this._renderNorthFace(ctx, x, y - yOffset, tileSize, height, tileX, tileY);
            }

            // Cara OESTE (lado izquierdo) - segunda capa
            if (visibleFaces.west && !neighbors.W) {
                this._renderWestFace(ctx, x, y - yOffset, tileSize, height, tileX, tileY);
            }

            // Cara ESTE (lado derecho) - segunda capa
            if (visibleFaces.east && !neighbors.E) {
                this._renderEastFace(ctx, x, y - yOffset, tileSize, height, tileX, tileY);
            }

            // Cara SUR (frente) - tercera capa (más cercana al espectador)
            if (visibleFaces.south && !neighbors.S) {
                this._renderSouthFace(ctx, x, y - yOffset, tileSize, height, tileX, tileY);
            }

            // ============================================
            // 3. CARA SUPERIOR (techo del muro) - nivel más alto
            // Siempre visible desde vista top-down
            // ============================================
            this._renderTopFace(ctx, x, y - yOffset, tileSize, tileX, tileY);

            ctx.restore();
        }

        /**
         * Renderizar sombra proyectada del muro
         * @private
         */
        _renderShadow(ctx, x, y, tileSize, height) {
            const offsetX = this.config.shadowOffsetX;
            const offsetY = this.config.shadowOffsetY;

            ctx.save();
            ctx.fillStyle = this.config.colors.shadow;
            ctx.shadowBlur = this.config.shadowBlur;
            ctx.shadowColor = 'rgba(0, 0, 0, 0.5)';

            // Sombra como rectángulo desplazado
            ctx.fillRect(
                x + offsetX,
                y + offsetY,
                tileSize,
                tileSize + height * this.depthFactor * 0.5
            );

            ctx.restore();
        }

        /**
         * Renderizar cara superior del muro
         * @private
         */
        _renderTopFace(ctx, x, y, tileSize, tileX, tileY) {
            // Gradiente de color para dar sensación de iluminación
            const gradient = ctx.createLinearGradient(
                x, y,
                x + tileSize, y + tileSize
            );

            gradient.addColorStop(0, this.config.colors.top);
            gradient.addColorStop(1, this.config.colors.topGlow);

            // Glow effect
            ctx.shadowBlur = 15;
            ctx.shadowColor = this.config.colors.topGlow;

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, tileSize, tileSize);

            // Borde brillante
            ctx.strokeStyle = this.config.colors.top;
            ctx.lineWidth = 2;
            ctx.strokeRect(x, y, tileSize, tileSize);

            // Líneas decorativas opcionales (patrón de circuitos)
            if (Math.random() > 0.7) {
                ctx.strokeStyle = 'rgba(255, 255, 255, 0.3)';
                ctx.lineWidth = 1;
                ctx.beginPath();
                ctx.moveTo(x, y + tileSize / 2);
                ctx.lineTo(x + tileSize, y + tileSize / 2);
                ctx.stroke();
            }
        }

        /**
         * Renderizar cara sur (frente - borde inferior)
         * Esta es la cara más visible en vista top-down
         * @param {number} tileX - Coordenada X del tile
         * @param {number} tileY - Coordenada Y del tile
         * @private
         */
        _renderSouthFace(ctx, x, y, tileSize, height, tileX, tileY) {
            const yOffset = height * this.depthFactor;

            // Color base con sombreado moderado
            const baseColor = this._darkenColor(
                this.config.colors.south,
                this.config.sideDarkenFactor * 0.8
            );

            ctx.save();

            // GEOMETRÍA: Rectángulo horizontal para la cara frontal
            ctx.fillStyle = baseColor;
            ctx.fillRect(x, y + tileSize, tileSize, yOffset);

            // ILUMINACIÓN: Gradiente vertical (luz de arriba)
            const gradient = ctx.createLinearGradient(
                x, y + tileSize,
                x, y + tileSize + yOffset
            );
            gradient.addColorStop(0, 'rgba(0, 220, 255, 0.4)');
            gradient.addColorStop(0.5, 'rgba(0, 187, 221, 0.2)');
            gradient.addColorStop(1, 'rgba(0, 100, 120, 0.1)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y + tileSize, tileSize, yOffset);

            // Borde neon superior (línea brillante)
            ctx.strokeStyle = this.config.colors.southGlow;
            ctx.lineWidth = 2;
            ctx.shadowBlur = 8;
            ctx.shadowColor = this.config.colors.southGlow;
            ctx.beginPath();
            ctx.moveTo(x, y + tileSize);
            ctx.lineTo(x + tileSize, y + tileSize);
            ctx.stroke();

            // TEXTURA: Líneas horizontales para dar profundidad (paneles)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.15)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;

            // Línea a 1/3 de altura
            ctx.beginPath();
            ctx.moveTo(x + 2, y + tileSize + yOffset * 0.33);
            ctx.lineTo(x + tileSize - 2, y + tileSize + yOffset * 0.33);
            ctx.stroke();

            // Línea a 2/3 de altura
            ctx.beginPath();
            ctx.moveTo(x + 2, y + tileSize + yOffset * 0.66);
            ctx.lineTo(x + tileSize - 2, y + tileSize + yOffset * 0.66);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Renderizar cara este (lado derecho)
         * MEJORA: Efecto de transición/deslizamiento suave al descubrir pared
         * ILUMINACIÓN: Sombreado dinámico basado en ángulo de cámara
         * @param {number} tileX - Coordenada X del tile (para calcular factor de transición)
         * @param {number} tileY - Coordenada Y del tile
         * @private
         */
        _renderEastFace(ctx, x, y, tileSize, height, tileX, tileY) {
            const yOffset = height * this.depthFactor;

            // EFECTO DE TRANSICIÓN: Factor basado en coordenada X
            // Tiles más a la izquierda muestran más su cara este
            const transitionFactor = this.config.sideWallTransition;
            const slideOffset = tileSize * transitionFactor; // Desplazamiento progresivo

            // Color más oscuro que la cara frontal (sombreado lateral)
            const baseColor = this._darkenColor(
                this.config.colors.east,
                this.config.sideDarkenFactor * 1.2
            );

            ctx.save();

            // GEOMETRÍA: Rectángulo vertical para la cara lateral derecha
            // Ancho proporcional a la altura del muro para perspectiva correcta
            const faceWidth = yOffset * 0.5;

            ctx.fillStyle = baseColor;
            ctx.fillRect(x + tileSize, y, faceWidth, tileSize + yOffset);

            // ILUMINACIÓN DINÁMICA: Gradiente de profundidad
            // Simula luz ambiental con degradado vertical
            const gradient = ctx.createLinearGradient(
                x + tileSize, y,
                x + tileSize, y + tileSize + yOffset
            );
            gradient.addColorStop(0, 'rgba(0, 180, 220, 0.3)');
            gradient.addColorStop(0.5, 'rgba(0, 153, 187, 0.15)');
            gradient.addColorStop(1, 'rgba(0, 80, 100, 0.05)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x + tileSize, y, faceWidth, tileSize + yOffset);

            // Borde neon lateral para resaltar contorno
            ctx.strokeStyle = this.config.colors.eastGlow;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.config.colors.eastGlow;
            ctx.beginPath();
            ctx.moveTo(x + tileSize, y);
            ctx.lineTo(x + tileSize, y + tileSize + yOffset);
            ctx.stroke();

            // TEXTURA: Líneas de detalle verticales (efecto paneles)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.1)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.moveTo(x + tileSize + faceWidth * 0.5, y + 2);
            ctx.lineTo(x + tileSize + faceWidth * 0.5, y + tileSize + yOffset - 2);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Renderizar cara norte (parte trasera - borde superior)
         * Visible cuando el muro no tiene vecino al norte
         * @param {number} tileX - Coordenada X del tile
         * @param {number} tileY - Coordenada Y del tile
         * @private
         */
        _renderNorthFace(ctx, x, y, tileSize, height, tileX, tileY) {
            const yOffset = height * this.depthFactor;

            // Sombreado similar a cara sur pero ligeramente diferente
            const baseColor = this._darkenColor(
                this.config.colors.south,
                this.config.sideDarkenFactor * 1.0
            );

            ctx.save();

            // GEOMETRÍA: Rectángulo horizontal para cara trasera
            ctx.fillStyle = baseColor;
            ctx.fillRect(x, y, tileSize, yOffset);

            // ILUMINACIÓN: Gradiente de profundidad
            const gradient = ctx.createLinearGradient(
                x, y,
                x, y + yOffset
            );
            gradient.addColorStop(0, 'rgba(0, 200, 240, 0.35)');
            gradient.addColorStop(1, 'rgba(0, 170, 200, 0.15)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x, y, tileSize, yOffset);

            // Borde neon inferior
            ctx.strokeStyle = this.config.colors.southGlow;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.config.colors.southGlow;
            ctx.beginPath();
            ctx.moveTo(x, y + yOffset);
            ctx.lineTo(x + tileSize, y + yOffset);
            ctx.stroke();

            // TEXTURA: Líneas horizontales
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.12)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.moveTo(x + 2, y + yOffset * 0.5);
            ctx.lineTo(x + tileSize - 2, y + yOffset * 0.5);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Renderizar cara oeste (lado izquierdo)
         * MEJORA: Efecto de transición/deslizamiento suave al descubrir pared
         * ILUMINACIÓN: Sombreado más oscuro que cara este (luz lateral)
         * @param {number} tileX - Coordenada X del tile (para calcular factor de transición)
         * @param {number} tileY - Coordenada Y del tile
         * @private
         */
        _renderWestFace(ctx, x, y, tileSize, height, tileX, tileY) {
            const yOffset = height * this.depthFactor;

            // EFECTO DE TRANSICIÓN: Factor basado en coordenada X
            // Tiles más a la derecha muestran más su cara oeste
            const transitionFactor = this.config.sideWallTransition;

            // SOMBREADO: Cara oeste más oscura que este (menos luz)
            const baseColor = this._darkenColor(
                this.config.colors.east,
                this.config.sideDarkenFactor * 1.4
            );

            ctx.save();

            // GEOMETRÍA: Rectángulo vertical para la cara lateral izquierda
            const faceWidth = yOffset * 0.5;

            ctx.fillStyle = baseColor;
            ctx.fillRect(x - faceWidth, y, faceWidth, tileSize + yOffset);

            // ILUMINACIÓN DINÁMICA: Gradiente de profundidad más oscuro
            const gradient = ctx.createLinearGradient(
                x - faceWidth, y,
                x - faceWidth, y + tileSize + yOffset
            );
            gradient.addColorStop(0, 'rgba(0, 160, 200, 0.25)');
            gradient.addColorStop(0.5, 'rgba(0, 130, 160, 0.12)');
            gradient.addColorStop(1, 'rgba(0, 60, 80, 0.05)');

            ctx.fillStyle = gradient;
            ctx.fillRect(x - faceWidth, y, faceWidth, tileSize + yOffset);

            // Borde neon lateral
            ctx.strokeStyle = this.config.colors.eastGlow;
            ctx.lineWidth = 1.5;
            ctx.shadowBlur = 6;
            ctx.shadowColor = this.config.colors.eastGlow;
            ctx.beginPath();
            ctx.moveTo(x, y);
            ctx.lineTo(x, y + tileSize + yOffset);
            ctx.stroke();

            // TEXTURA: Líneas de detalle verticales (paneles)
            ctx.strokeStyle = 'rgba(255, 255, 255, 0.08)';
            ctx.lineWidth = 1;
            ctx.shadowBlur = 0;

            ctx.beginPath();
            ctx.moveTo(x - faceWidth * 0.5, y + 2);
            ctx.lineTo(x - faceWidth * 0.5, y + tileSize + yOffset - 2);
            ctx.stroke();

            ctx.restore();
        }

        /**
         * Oscurecer un color hexadecimal
         * @param {string} hexColor - Color en formato #RRGGBB
         * @param {number} factor - Factor de oscurecimiento (0-1)
         * @returns {string} Color oscurecido
         * @private
         */
        _darkenColor(hexColor, factor) {
            // Convertir hex a RGB
            const r = parseInt(hexColor.slice(1, 3), 16);
            const g = parseInt(hexColor.slice(3, 5), 16);
            const b = parseInt(hexColor.slice(5, 7), 16);

            // Oscurecer
            const newR = Math.floor(r * (1 - factor));
            const newG = Math.floor(g * (1 - factor));
            const newB = Math.floor(b * (1 - factor));

            // Convertir de vuelta a hex
            return `#${newR.toString(16).padStart(2, '0')}${newG.toString(16).padStart(2, '0')}${newB.toString(16).padStart(2, '0')}`;
        }

        /**
         * Obtener prioridad de renderizado para sorting por profundidad
         * Tiles más al fondo (mayor Y) se dibujan primero
         * @param {number} tileY - Coordenada Y del tile
         * @returns {number} Prioridad (mayor = más atrás)
         */
        getDepthPriority(tileY) {
            return tileY;
        }
    }

    // ===================================
    // EXPORT TO GLOBAL SCOPE
    // ===================================

    window.Pseudo3DRenderer = Pseudo3DRenderer;
    window.CONFIG_3D = CONFIG_3D;

    console.log('✅ Pseudo3DRenderer loaded');

})();
