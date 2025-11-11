/* ===================================
   ISOMETRIC TILE RENDERER
   Renderizado de tiles en proyección isométrica
   Compatible con estética neon del juego
   ================================== */

(function() {
    'use strict';

    // ===================================
    // CONFIGURACIÓN DE RENDERIZADO
    // ===================================

    const RENDER_CONFIG = {
        // Altura de muros en píxeles (efecto 3D)
        wallHeight: 40,

        // Colores neon coherentes con el juego
        colors: {
            // Fondo vacío
            empty: '#0a0a1a',

            // Suelo
            floor: '#1a1a2e',
            floorAccent: '#2a2a4e',
            floorGlow: 'rgba(0, 255, 255, 0.1)',

            // Muros
            wallTop: '#00ffff',
            wallSide: '#00aacc',
            wallSideAlt: '#008899',
            wallGlow: '#00ccff',

            // Arbustos
            bush: '#00ff88',
            bushGlow: '#00cc66',

            // Spawns
            spawnPlayer: '#00ff00',
            spawnEnemy: '#ff0044',
            spawnPowerup: '#ffff00',

            // Decoración
            decoration: '#8800ff',

            // Sombras
            shadow: 'rgba(0, 0, 0, 0.3)'
        },

        // Efectos visuales
        enableGlow: true,
        glowIntensity: 10,
        enableShadows: true,
        shadowBlur: 8,

        // Animaciones
        animationSpeed: 0.001,

        // Grid de referencia (debug)
        showGrid: false,
        gridColor: 'rgba(255, 255, 255, 0.1)'
    };

    // Tile types (debe coincidir con map-system.js)
    const TILE_TYPES = {
        EMPTY: 0,
        FLOOR: 1,
        WALL: 2,
        WALL_DESTRUCTIBLE: 3,
        BUSH: 4,
        SPAWN_PLAYER: 5,
        SPAWN_ENEMY: 6,
        SPAWN_POWERUP: 7,
        DECORATION: 8,
        OBJECTIVE: 9
    };

    // ===================================
    // ISOMETRIC TILE RENDERER CLASS
    // ===================================

    class IsometricTileRenderer {
        constructor() {
            this.config = { ...RENDER_CONFIG };
            this.animationTime = 0;

            // Cache de tiles para optimización
            this.tileCache = new Map();

            // Texturas
            this.textures = {
                paredDerecha: null,
                paredIzquierda: null,
                arbusto: null,
                cesped: null
            };

            // Cargar texturas
            this.loadTextures();
        }

        loadTextures() {
            const basePath = 'graficos/escenario/basico/';

            // Cargar pared derecha
            const imgParedDerecha = new Image();
            imgParedDerecha.src = basePath + 'pared_derecha.png';
            imgParedDerecha.onload = () => {
                this.textures.paredDerecha = imgParedDerecha;
                console.log('✅ Textura pared_derecha cargada');
            };
            imgParedDerecha.onerror = () => {
                console.warn('⚠️ No se pudo cargar pared_derecha.png');
            };

            // Cargar pared izquierda
            const imgParedIzquierda = new Image();
            imgParedIzquierda.src = basePath + 'pared_izquierda.png';
            imgParedIzquierda.onload = () => {
                this.textures.paredIzquierda = imgParedIzquierda;
                console.log('✅ Textura pared_izquierda cargada');
            };
            imgParedIzquierda.onerror = () => {
                console.warn('⚠️ No se pudo cargar pared_izquierda.png');
            };

            // Cargar arbusto
            const imgArbusto = new Image();
            imgArbusto.src = basePath + 'arbusto.png';
            imgArbusto.onload = () => {
                this.textures.arbusto = imgArbusto;
                console.log('✅ Textura arbusto cargada');
            };
            imgArbusto.onerror = () => {
                console.warn('⚠️ No se pudo cargar arbusto.png');
            };

            // Cargar césped
            const imgCesped = new Image();
            imgCesped.src = basePath + 'cesped.png';
            imgCesped.onload = () => {
                this.textures.cesped = imgCesped;
                console.log('✅ Textura cesped cargada');
            };
            imgCesped.onerror = () => {
                console.warn('⚠️ No se pudo cargar cesped.png');
            };
        }

        // Dibuja la base circular del arbusto (junto al suelo)
        _drawBushBase(ctx, screenX, screenY) {
            const vertices = this._getTileVerticesScreen(screenX, screenY);
            const centerX = (vertices[0].x + vertices[2].x) / 2;
            const centerY = (vertices[0].y + vertices[2].y) / 2;
            const radius = window.IsometricTransform.config.tileWidth / 3;
            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.fillStyle = this.config.colors.bush;
            ctx.beginPath();
            ctx.arc(0, 0, radius, 0, Math.PI * 2);
            ctx.fill();
            if (this.config.enableGlow) {
                ctx.shadowBlur = this.config.glowIntensity;
                ctx.shadowColor = this.config.colors.bushGlow;
                ctx.strokeStyle = this.config.colors.bushGlow;
                ctx.lineWidth = 2;
                ctx.stroke();
            }
            ctx.restore();
        }

        // Dibuja las hojas volumétricas del arbusto (junto a los muros)
        _drawBushLeaves(ctx, screenX, screenY) {
            const vertices = this._getTileVerticesScreen(screenX, screenY);
            const centerX = (vertices[0].x + vertices[2].x) / 2;
            const centerY = (vertices[0].y + vertices[2].y) / 2;
            const wallHeight = this.config.wallHeight;
            const bushHeight = wallHeight * 0.5;
            const radiusX = window.IsometricTransform.config.tileWidth / 2.5;
            const radiusY = bushHeight;

            // Si tenemos textura de arbusto, usarla
            if (this.textures.arbusto && this.textures.arbusto.complete) {
                ctx.save();
                ctx.translate(centerX, centerY - bushHeight);
                ctx.globalAlpha = 0.95;

                // Dibujar la textura centrada
                const imgWidth = radiusX * 2;
                const imgHeight = bushHeight * 2;
                ctx.drawImage(
                    this.textures.arbusto,
                    -imgWidth / 2,
                    -imgHeight / 2,
                    imgWidth,
                    imgHeight
                );

                ctx.restore();
            } else {
                // Fallback: forma elíptica con color
                ctx.save();
                ctx.translate(centerX, centerY - bushHeight);
                ctx.scale(1, 0.7);
                ctx.fillStyle = this.config.colors.bush;
                ctx.globalAlpha = 0.95;
                ctx.beginPath();
                ctx.ellipse(0, 0, radiusX, radiusY, 0, 0, Math.PI * 2);
                ctx.fill();

                if (this.config.enableGlow) {
                    ctx.shadowBlur = this.config.glowIntensity * 1.2;
                    ctx.shadowColor = this.config.colors.bushGlow;
                    ctx.strokeStyle = this.config.colors.bushGlow;
                    ctx.lineWidth = 2;
                    ctx.stroke();
                }
                ctx.restore();
            }

            // Partículas flotantes para efecto visual (solo si no hay textura)
            if (!this.textures.arbusto || !this.textures.arbusto.complete) {
                const numParticles = 5;
                for (let i = 0; i < numParticles; i++) {
                    const angle = (Math.PI * 2 / numParticles) * i + this.animationTime;
                    const dist = radiusX * 0.8;
                    const px = centerX + Math.cos(angle) * dist;
                    const py = centerY - bushHeight + Math.sin(angle) * radiusY * 0.7 - Math.abs(Math.sin(this.animationTime * 3 + i)) * 6;
                    ctx.fillStyle = this.config.colors.bushGlow;
                    ctx.globalAlpha = 0.5 + Math.sin(this.animationTime * 2 + i) * 0.3;
                    ctx.beginPath();
                    ctx.arc(px, py, 3, 0, Math.PI * 2);
                    ctx.fill();
                    ctx.globalAlpha = 1.0;
                }
            }
            }

        /**
         * Renderiza el mapa completo en proyección isométrica
         * @param {CanvasRenderingContext2D} ctx - Contexto de canvas
         * @param {Array<Array<number>>} mapData - Datos del mapa (matriz de tiles)
         * @param {Object} camera - Objeto de cámara en coordenadas CARTESIANAS del mundo {x, y}

        /**
         * Renderiza solo los suelos (FLOOR, BUSH, SPAWN zones, DECORATION, OBJECTIVE)
         */
        renderFloorsOnly(ctx, mapData, camera, tileSize = 64) {
            if (!mapData || !window.IsometricTransform) return;
            const transform = window.IsometricTransform;
            const mapHeight = mapData.length;
            const mapWidth = mapData[0] ? mapData[0].length : 0;
            const cameraTileX = camera.x / tileSize;
            const cameraTileY = camera.y / tileSize;
            const cameraIso = transform.mapToIso(cameraTileX, cameraTileY);
            const renderQueue = [];
            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {
                    const tileType = mapData[y][x];
                    // Only floor-like tiles
                    if ([1,4,5,6,7,8,9].includes(tileType)) {
                        const isoPos = transform.mapToIso(x, y);
                        const depth = transform.getDepth(x, y);
                        const screenX = isoPos.x - cameraIso.x + (ctx.canvas.width / 2);
                        const screenY = isoPos.y - cameraIso.y + (ctx.canvas.height / 2);
                        renderQueue.push({x, y, screenX, screenY, tileType, depth});
                    }
                }
            }
            renderQueue.sort((a, b) => a.depth - b.depth);
            for (const tile of renderQueue) {
                if (tile.tileType === 4) {
                    this._drawBushBase(ctx, tile.screenX, tile.screenY);
                } else {
                    this._renderTile(ctx, tile.tileType, tile.screenX, tile.screenY, tile.x, tile.y);
                }
            }
        }

        /**
         * Renderiza solo los muros (WALL, WALL_DESTRUCTIBLE)
         */
        renderWallsOnly(ctx, mapData, camera, tileSize = 64) {
            if (!mapData || !window.IsometricTransform) return;
            const transform = window.IsometricTransform;
            const mapHeight = mapData.length;
            const mapWidth = mapData[0] ? mapData[0].length : 0;
            const cameraTileX = camera.x / tileSize;
            const cameraTileY = camera.y / tileSize;
            const cameraIso = transform.mapToIso(cameraTileX, cameraTileY);
            const renderQueue = [];
            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {
                    const tileType = mapData[y][x];
                    if (tileType === 2 || tileType === 3) {
                        const isoPos = transform.mapToIso(x, y);
                        const depth = transform.getDepth(x, y);
                        const screenX = isoPos.x - cameraIso.x + (ctx.canvas.width / 2);
                        const screenY = isoPos.y - cameraIso.y + (ctx.canvas.height / 2);
                        renderQueue.push({x, y, screenX, screenY, tileType, depth});
                    }
                }
            }
            renderQueue.sort((a, b) => a.depth - b.depth);
            for (const tile of renderQueue) {
                if (tile.tileType === 4) {
                    this._drawBushLeaves(ctx, tile.screenX, tile.screenY);
                } else {
                    this._renderTile(ctx, tile.tileType, tile.screenX, tile.screenY, tile.x, tile.y);
                }
            }
        }

        /**
         * Renderiza un objeto estático individual (muro o arbusto)
         */
        renderSingleStaticObject(ctx, mapData, tileX, tileY, tileType, camera, tileSize = 64) {
            if (!mapData || !window.IsometricTransform) return;
            const transform = window.IsometricTransform;
            const cameraTileX = camera.x / tileSize;
            const cameraTileY = camera.y / tileSize;
            const cameraIso = transform.mapToIso(cameraTileX, cameraTileY);
            const isoPos = transform.mapToIso(tileX, tileY);
            const screenX = isoPos.x - cameraIso.x + (ctx.canvas.width / 2);
            const screenY = isoPos.y - cameraIso.y + (ctx.canvas.height / 2);

            // Renderizar según el tipo
            if (tileType === 4) {
                // Arbusto: solo hojas volumétricas
                this._drawBushLeaves(ctx, screenX, screenY);
            } else if (tileType === 2 || tileType === 3) {
                // Muro
                this._renderTile(ctx, tileType, screenX, screenY, tileX, tileY);
            }
        }

        /**
         * Calcula los tiles visibles en pantalla (viewport culling)
         * @private
         */
        _getVisibleTiles(mapWidth, mapHeight, camera, canvasWidth, canvasHeight) {
            // Agregar margen para asegurar que no se cortan tiles en los bordes
            const margin = 2;

            const transform = window.IsometricTransform;

            // Convertir las esquinas del viewport a coordenadas de mapa
            const topLeft = transform.getTileAtScreenPos(camera.x - margin * transform.config.tileWidth,
                                                         camera.y - margin * transform.config.tileHeight);
            const bottomRight = transform.getTileAtScreenPos(camera.x + canvasWidth + margin * transform.config.tileWidth,
                                                             camera.y + canvasHeight + margin * transform.config.tileHeight);

            return {
                minX: Math.max(0, Math.floor(topLeft.x) - margin),
                minY: Math.max(0, Math.floor(topLeft.y) - margin),
                maxX: Math.min(mapWidth - 1, Math.ceil(bottomRight.x) + margin),
                maxY: Math.min(mapHeight - 1, Math.ceil(bottomRight.y) + margin)
            };
        }

        /**
         * Renderiza un tile individual
         * @private
         */
        _renderTile(ctx, tileType, screenX, screenY, mapX, mapY) {
            switch (tileType) {
                case TILE_TYPES.EMPTY:
                    this._drawEmpty(ctx, screenX, screenY);
                    break;

                case TILE_TYPES.FLOOR:
                    this._drawFloor(ctx, screenX, screenY, mapX, mapY);
                    break;

                case TILE_TYPES.WALL:
                case TILE_TYPES.WALL_DESTRUCTIBLE:
                    this._drawWall(ctx, screenX, screenY, mapX, mapY, tileType === TILE_TYPES.WALL_DESTRUCTIBLE);
                    break;

                case TILE_TYPES.BUSH:
                    this._drawFloor(ctx, screenX, screenY, mapX, mapY); // Fondo
                    this._drawBush(ctx, screenX, screenY);
                    break;

                case TILE_TYPES.SPAWN_PLAYER:
                    this._drawFloor(ctx, screenX, screenY, mapX, mapY);
                    this._drawSpawnZone(ctx, screenX, screenY, this.config.colors.spawnPlayer);
                    break;

                case TILE_TYPES.SPAWN_ENEMY:
                    this._drawFloor(ctx, screenX, screenY, mapX, mapY);
                    this._drawSpawnZone(ctx, screenX, screenY, this.config.colors.spawnEnemy);
                    break;

                case TILE_TYPES.SPAWN_POWERUP:
                    this._drawFloor(ctx, screenX, screenY, mapX, mapY);
                    this._drawSpawnZone(ctx, screenX, screenY, this.config.colors.spawnPowerup);
                    break;

                case TILE_TYPES.DECORATION:
                    this._drawFloor(ctx, screenX, screenY, mapX, mapY);
                    this._drawDecoration(ctx, screenX, screenY);
                    break;

                case TILE_TYPES.OBJECTIVE:
                    this._drawFloor(ctx, screenX, screenY, mapX, mapY);
                    this._drawObjective(ctx, screenX, screenY);
                    break;
            }
        }

        /**
         * Dibuja un tile vacío (fondo oscuro)
         * @private
         */
        _drawEmpty(ctx, screenX, screenY) {
                    const transform = window.IsometricTransform;
                    const vertices = this._getTileVerticesScreen(screenX, screenY);

                    ctx.fillStyle = this.config.colors.empty;
                    ctx.beginPath();
                    ctx.moveTo(vertices[0].x, vertices[0].y);
                    for (let i = 1; i < vertices.length; i++) {
                        ctx.lineTo(vertices[i].x, vertices[i].y);
                    }
                    ctx.closePath();
                    ctx.fill();
                }

                /**
                 * Dibuja un tile de suelo transitable
                 * @private
                 */
                _drawFloor(ctx, screenX, screenY, mapX, mapY) {
                    const vertices = this._getTileVerticesScreen(screenX, screenY);

                    // Si tenemos textura de césped, usarla
                    if (this.textures.cesped && this.textures.cesped.complete) {
                        ctx.save();
                        ctx.beginPath();
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let i = 1; i < vertices.length; i++) {
                            ctx.lineTo(vertices[i].x, vertices[i].y);
                        }
                        ctx.closePath();
                        ctx.clip();

                        // Calcular el tamaño del rombo isométrico
                        const tileWidth = window.IsometricTransform.config.tileWidth;
                        const tileHeight = window.IsometricTransform.config.tileHeight;

                        // Dibujar la textura ajustada al rombo
                        ctx.drawImage(
                            this.textures.cesped,
                            screenX - tileWidth / 2,
                            screenY - tileHeight / 2,
                            tileWidth,
                            tileHeight
                        );

                        ctx.restore();

                        // Borde sutil
                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
                        ctx.lineWidth = 1;
                        ctx.beginPath();
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let i = 1; i < vertices.length; i++) {
                            ctx.lineTo(vertices[i].x, vertices[i].y);
                        }
                        ctx.closePath();
                        ctx.stroke();
                    } else {
                        // Fallback: colores sólidos
                        const isDark = (mapX + mapY) % 2 === 0;
                        const baseColor = isDark ? this.config.colors.floor : this.config.colors.floorAccent;

                        ctx.fillStyle = baseColor;
                        ctx.beginPath();
                        ctx.moveTo(vertices[0].x, vertices[0].y);
                        for (let i = 1; i < vertices.length; i++) {
                            ctx.lineTo(vertices[i].x, vertices[i].y);
                        }
                        ctx.closePath();
                        ctx.fill();

                        if (this.config.enableGlow) {
                            const pulseIntensity = 0.5 + Math.sin(this.animationTime + mapX + mapY) * 0.5;
                            ctx.fillStyle = this.config.colors.floorGlow;
                            ctx.globalAlpha = 0.1 * pulseIntensity;
                            ctx.fill();
                            //ctx.globalAlpha = 1.0;
                        }

                        ctx.strokeStyle = 'rgba(0, 255, 255, 0.15)';
                        ctx.lineWidth = 1;
                        ctx.stroke();
                    }
                }

                /**
                 * Dibuja un muro con volumen isométrico
                 * @private
                 */
               _drawWall(ctx, screenX, screenY, mapX, mapY, isDestructible = false) {
            const vertices = this._getTileVerticesScreen(screenX, screenY);
            const height = this.config.wallHeight;

        // Cara sur-oeste (paredIzquierda)
        if (this.textures.paredIzquierda && this.textures.paredIzquierda.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(vertices[3].x, vertices[3].y);
            ctx.lineTo(vertices[3].x, vertices[3].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y);
            ctx.closePath();
            ctx.clip();

            // Medidas destino en el canvas (paralelogramo de la pared)
            const destX = vertices[3].x;
            const destY = vertices[3].y - height;
            const destWidth = Math.abs(vertices[2].x - vertices[3].x);
            const destHeight = height;

            // Medidas originales de la textura
            const srcWidth = this.textures.paredIzquierda.naturalWidth;
            const srcHeight = this.textures.paredIzquierda.naturalHeight;

            // Dibujar la textura adaptada al muro (escala y recorte)
                    // Transformar el contexto para distorsionar la textura
                    const dx = vertices[2].x - vertices[3].x;
                    const dy = vertices[2].y - vertices[3].y;
                    ctx.setTransform(
                        dx / this.textures.paredIzquierda.naturalWidth, // escala X
                        dy / this.textures.paredIzquierda.naturalWidth, // inclinación Y
                        0, // inclinación X
                        height / this.textures.paredIzquierda.naturalHeight, // escala Y
                        vertices[3].x, // origen X
                        vertices[3].y - height // origen Y
                    );
                    ctx.drawImage(this.textures.paredIzquierda, 0, 0);
            ctx.restore();
        } else {
            ctx.fillStyle = this.config.colors.wallSideAlt;
            ctx.beginPath();
            ctx.moveTo(vertices[3].x, vertices[3].y);
            ctx.lineTo(vertices[3].x, vertices[3].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y);
            ctx.closePath();
            ctx.fill();
        }

        // Cara sur-este (paredDerecha)
        if (this.textures.paredDerecha && this.textures.paredDerecha.complete) {
            ctx.save();
            ctx.beginPath();
            ctx.moveTo(vertices[1].x, vertices[1].y);
            ctx.lineTo(vertices[1].x, vertices[1].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y);
            ctx.closePath();
            ctx.clip();

            // Medidas destino en el canvas (paralelogramo de la pared)
            const destX = vertices[1].x;
            const destY = vertices[1].y - height;
            const destWidth = Math.abs(vertices[2].x - vertices[1].x);
            const destHeight = height;

            // Medidas originales de la textura
            const srcWidth = this.textures.paredDerecha.naturalWidth;
            const srcHeight = this.textures.paredDerecha.naturalHeight;

            // Dibujar la textura adaptada al muro (escala y recorte)
                    // Calcular vectores de transformación
                    const dx = vertices[2].x - vertices[1].x;
                    const dy = vertices[2].y - vertices[1].y;
                    ctx.setTransform(
                        dx / this.textures.paredDerecha.naturalWidth,
                        dy / this.textures.paredDerecha.naturalWidth,
                        0,
                        height / this.textures.paredDerecha.naturalHeight,
                        vertices[1].x,
                        vertices[1].y - height
                    );
                    ctx.drawImage(this.textures.paredDerecha, 0, 0);
            ctx.restore();
        } else {
            ctx.fillStyle = this.config.colors.wallSide;
            ctx.beginPath();
            ctx.moveTo(vertices[1].x, vertices[1].y);
            ctx.lineTo(vertices[1].x, vertices[1].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y);
            ctx.closePath();
            ctx.fill();
        }

            // Cara superior (top) - negro provisional
            ctx.fillStyle = '#000000';
            //ctx.globalAlpha = 0.4
            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y - height);
            ctx.lineTo(vertices[1].x, vertices[1].y - height);
            ctx.lineTo(vertices[2].x, vertices[2].y - height);
            ctx.lineTo(vertices[3].x, vertices[3].y - height);
            ctx.closePath();
            ctx.fill();

            // Indicador de muro destructible
            if (isDestructible) {
                const centerX = (vertices[0].x + vertices[2].x) / 2;
                const centerY = (vertices[0].y + vertices[2].y) / 2 - height;

                ctx.fillStyle = '#ffaa00';
                ctx.globalAlpha = 0.6 + Math.sin(this.animationTime * 2) * 0.4;
                ctx.beginPath();
                ctx.arc(centerX, centerY, 4, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }
        /**
         * Dibuja un arbusto (cover)
         * @private
         */
        _drawBush(ctx, screenX, screenY) {
            const vertices = this._getTileVerticesScreen(screenX, screenY);
            const centerX = (vertices[0].x + vertices[2].x) / 2;
            const centerY = (vertices[0].y + vertices[2].y) / 2;

            // Forma del arbusto (óvalo isométrico)
            const radiusX = window.IsometricTransform.config.tileWidth / 3;
            const radiusY = window.IsometricTransform.config.tileHeight / 3;

            ctx.save();
            ctx.translate(centerX, centerY);
            ctx.scale(1, 0.5); // Aplastar para efecto isométrico

            // Base del arbusto
            ctx.fillStyle = this.config.colors.bush;
            ctx.beginPath();
            ctx.arc(0, 0, radiusX, 0, Math.PI * 2);
            ctx.fill();

            // Glow
            if (this.config.enableGlow) {
                ctx.shadowBlur = this.config.glowIntensity;
                ctx.shadowColor = this.config.colors.bushGlow;
                ctx.strokeStyle = this.config.colors.bushGlow;
                ctx.lineWidth = 2;
                ctx.stroke();
            }

            ctx.restore();

            // Partículas flotantes para efecto visual
            const numParticles = 3;
            for (let i = 0; i < numParticles; i++) {
                const angle = (Math.PI * 2 / numParticles) * i + this.animationTime;
                const dist = radiusX * 0.7;
                const px = centerX + Math.cos(angle) * dist;
                const py = centerY + Math.sin(angle) * dist * 0.5 - Math.abs(Math.sin(this.animationTime * 3 + i)) * 5;

                ctx.fillStyle = this.config.colors.bushGlow;
                ctx.globalAlpha = 0.4 + Math.sin(this.animationTime * 2 + i) * 0.3;
                ctx.beginPath();
                ctx.arc(px, py, 2, 0, Math.PI * 2);
                ctx.fill();
                ctx.globalAlpha = 1.0;
            }
        }

        /**
         * Dibuja una zona de spawn
         * @private
         */
        _drawSpawnZone(ctx, screenX, screenY, color) {
            const vertices = this._getTileVerticesScreen(screenX, screenY);

            // Pulso de animación
            const pulse = 0.3 + Math.sin(this.animationTime * 3) * 0.3;

            ctx.strokeStyle = color;
            ctx.lineWidth = 3;
            ctx.globalAlpha = pulse;

            if (this.config.enableGlow) {
                ctx.shadowBlur = 15;
                ctx.shadowColor = color;
            }

            ctx.beginPath();
            ctx.moveTo(vertices[0].x, vertices[0].y);
            for (let i = 1; i < vertices.length; i++) {
                ctx.lineTo(vertices[i].x, vertices[i].y);
            }
            ctx.closePath();
            ctx.stroke();

            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }

        /**
         * Dibuja decoración
         * @private
         */
        _drawDecoration(ctx, screenX, screenY) {
            const vertices = this._getTileVerticesScreen(screenX, screenY);
            const centerX = (vertices[0].x + vertices[2].x) / 2;
            const centerY = (vertices[0].y + vertices[2].y) / 2;

            // Estrella decorativa animada
            const numPoints = 6;
            const outerRadius = 12;
            const innerRadius = 6;
            const rotation = this.animationTime;

            ctx.fillStyle = this.config.colors.decoration;
            ctx.beginPath();

            for (let i = 0; i < numPoints * 2; i++) {
                const radius = i % 2 === 0 ? outerRadius : innerRadius;
                const angle = (Math.PI / numPoints) * i + rotation;
                const x = centerX + Math.cos(angle) * radius;
                const y = centerY + Math.sin(angle) * radius * 0.5; // Aplastar para isométrico

                if (i === 0) {
                    ctx.moveTo(x, y);
                } else {
                    ctx.lineTo(x, y);
                }
            }

            ctx.closePath();
            ctx.fill();

            if (this.config.enableGlow) {
                ctx.shadowBlur = 10;
                ctx.shadowColor = this.config.colors.decoration;
                ctx.stroke();
            }
        }

        /**
         * Dibuja objetivo
         * @private
         */
        _drawObjective(ctx, screenX, screenY) {
            const vertices = this._getTileVerticesScreen(screenX, screenY);
            const centerX = (vertices[0].x + vertices[2].x) / 2;
            const centerY = (vertices[0].y + vertices[2].y) / 2;

            // Círculo pulsante
            const pulse = 15 + Math.sin(this.animationTime * 2) * 5;

            ctx.strokeStyle = '#ffff00';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.7;

            if (this.config.enableGlow) {
                ctx.shadowBlur = 20;
                ctx.shadowColor = '#ffff00';
            }

            ctx.beginPath();
            ctx.arc(centerX, centerY, pulse, 0, Math.PI * 2);
            ctx.stroke();

            ctx.globalAlpha = 1.0;
            ctx.shadowBlur = 0;
        }

        /**
         * Dibuja el grid de debug
         * @private
         */
        _renderGrid(ctx, mapWidth, mapHeight, camera) {
            const transform = window.IsometricTransform;

            ctx.strokeStyle = this.config.gridColor;
            ctx.lineWidth = 1;

            for (let y = 0; y <= mapHeight; y++) {
                for (let x = 0; x <= mapWidth; x++) {
                    const pos = transform.mapToIso(x, y);
                    const screenX = pos.x - camera.x;
                    const screenY = pos.y - camera.y;

                    // Dibujar punto en cada vértice
                    ctx.fillStyle = this.config.gridColor;
                    ctx.beginPath();
                    ctx.arc(screenX, screenY, 2, 0, Math.PI * 2);
                    ctx.fill();
                }
            }
        }

        /**
         * Obtiene los vértices del tile en coordenadas de pantalla
         * @private
         */
        _getTileVerticesScreen(screenX, screenY) {
            const transform = window.IsometricTransform;
            const halfWidth = transform.config.tileWidth / 2;
            const halfHeight = transform.config.tileHeight / 2;

            return [
                { x: screenX, y: screenY - halfHeight },           // Top
                { x: screenX + halfWidth, y: screenY },            // Right
                { x: screenX, y: screenY + halfHeight },           // Bottom
                { x: screenX - halfWidth, y: screenY }             // Left
            ];
        }

        /**
         * Activa/desactiva el grid de debug
         */
        toggleGrid() {
            this.config.showGrid = !this.config.showGrid;
        }

        /**
         * Actualiza la configuración de colores
         */
        setColors(newColors) {
            Object.assign(this.config.colors, newColors);
        }

        /**
         * Actualiza la altura de los muros
         */
        setWallHeight(height) {
            this.config.wallHeight = height;
        }
    }

    // ===================================
    // EXPORTAR API PÚBLICA
    // ===================================

    // Exponer globalmente
    if (typeof window !== 'undefined') {
        window.IsometricTileRenderer = IsometricTileRenderer;
    }

    // Exponer para módulos CommonJS/Node
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IsometricTileRenderer;
    }

})();
