/* ===================================
   MAP SYSTEM - Procedural Map Generation
   Inspired by Brawl Stars & League of Legends
   ================================== */

(function() {
    'use strict';

    // ===================================
    // CONSTANTS & CONFIGURATION
    // ===================================

    const TILE_SIZE = 64; // pixels per tile
    const MAP_WIDTH = 35; // tiles (aumentado para más espacio)
    const MAP_HEIGHT = 35; // tiles

    // Tile types
    const TILE_TYPES = {
        EMPTY: 0,           // Vacío (fondo oscuro)
        FLOOR: 1,           // Suelo transitable
        WALL: 2,            // Muro indestructible
        WALL_DESTRUCTIBLE: 3, // Muro destructible (futuro)
        BUSH: 4,            // Cobertura (mecánica Brawl Stars)
        SPAWN_PLAYER: 5,    // Zona de spawn del jugador
        SPAWN_ENEMY: 6,     // Zona de spawn de enemigos
        SPAWN_POWERUP: 7,   // Zona de spawn de power-ups
        DECORATION: 8,      // Decoración visual (no colisionable)
        OBJECTIVE: 9        // Zona de objetivo
    };

    // Visual style - Neon coherente con el juego
    const VISUAL_STYLE = {
        // Colores base
        bg: '#0a0a1a',              // Fondo oscuro
        floorBase: '#1a1a2e',       // Suelo base
        floorAccent: '#2a2a4e',     // Suelo acento
        wallBase: '#00ffff',        // Paredes cyan neon
        wallGlow: '#00ccff',        // Resplandor paredes
        bushBase: '#00ff88',        // Bush verde neon
        bushGlow: '#00cc66',        // Resplandor bush
        spawnPlayer: '#00ff00',     // Spawn jugador
        spawnEnemy: '#ff0044',      // Spawn enemigos
        spawnPowerup: '#ffff00',    // Spawn power-ups
        decoration: '#8800ff',      // Decoración morada

        // Efectos
        glowIntensity: 15,          // Blur para glow
        wallThickness: 4,           // Grosor de líneas
        animationSpeed: 0.002       // Velocidad animaciones
    };

    // Collision flags
    const COLLISION_FLAGS = {
        [TILE_TYPES.EMPTY]: false,
        [TILE_TYPES.FLOOR]: false,
        [TILE_TYPES.WALL]: true,
        [TILE_TYPES.WALL_DESTRUCTIBLE]: true,
        [TILE_TYPES.BUSH]: false, // Walkable but provides cover
        [TILE_TYPES.SPAWN_PLAYER]: false,
        [TILE_TYPES.SPAWN_ENEMY]: false,
        [TILE_TYPES.SPAWN_POWERUP]: false,
        [TILE_TYPES.DECORATION]: false, // No collision, solo visual
        [TILE_TYPES.OBJECTIVE]: false
    };

    // ===================================
    // MAP SYSTEM CLASS
    // ===================================

    class MapSystem {
        /**
         * Vuela la cámara hacia una posición objetivo (sin interpolación)
         * @param {number} targetX - Coordenada X destino
         * @param {number} targetY - Coordenada Y destino
         * @param {number} canvasWidth
         * @param {number} canvasHeight
         */
        flyCameraTo(targetX, targetY, canvasWidth, canvasHeight) {
            this.camera.x = targetX - canvasWidth / 2;
            this.camera.y = targetY - canvasHeight / 2;
            // Clamp camera to map bounds
            const maxX = this.width * this.tileSize - canvasWidth;
            const maxY = this.height * this.tileSize - canvasHeight;
            this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
            this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
        }

        /**
         * Pathfinding A* entre dos puntos tile
         * Devuelve array de tiles [{x, y}, ...] desde start hasta goal evitando paredes
         */
        findPathAStar(startTile, goalTile) {
            const openSet = [];
            const closedSet = new Set();
            const cameFrom = {};
            const gScore = {};
            const fScore = {};

            function tileKey(x, y) { return x + ',' + y; }

            openSet.push(startTile);
            gScore[tileKey(startTile.x, startTile.y)] = 0;
            fScore[tileKey(startTile.x, startTile.y)] = Math.abs(goalTile.x - startTile.x) + Math.abs(goalTile.y - startTile.y);

            while (openSet.length > 0) {
                // Seleccionar el nodo con menor fScore
                let currentIdx = 0;
                let minF = fScore[tileKey(openSet[0].x, openSet[0].y)] || Infinity;
                for (let i = 1; i < openSet.length; i++) {
                    const score = fScore[tileKey(openSet[i].x, openSet[i].y)] || Infinity;
                    if (score < minF) {
                        minF = score;
                        currentIdx = i;
                    }
                }
                const current = openSet.splice(currentIdx, 1)[0];
                const currentKey = tileKey(current.x, current.y);

                if (current.x === goalTile.x && current.y === goalTile.y) {
                    // Reconstruir el camino
                    const path = [goalTile];
                    let k = currentKey;
                    while (cameFrom[k]) {
                        path.unshift(cameFrom[k]);
                        k = tileKey(cameFrom[k].x, cameFrom[k].y);
                    }
                    return path;
                }

                closedSet.add(currentKey);

                // Vecinos (4 direcciones)
                const neighbors = [
                    { x: current.x, y: current.y - 1 },
                    { x: current.x + 1, y: current.y },
                    { x: current.x, y: current.y + 1 },
                    { x: current.x - 1, y: current.y }
                ];
                for (const neighbor of neighbors) {
                    const nKey = tileKey(neighbor.x, neighbor.y);
                    if (neighbor.x < 0 || neighbor.x >= this.width || neighbor.y < 0 || neighbor.y >= this.height) continue;
                    if (!this.isWalkable(neighbor.x, neighbor.y)) continue;
                    if (closedSet.has(nKey)) continue;

                    const tentativeG = (gScore[currentKey] || Infinity) + 1;
                    if (openSet.find(n => n.x === neighbor.x && n.y === neighbor.y) === undefined) {
                        openSet.push(neighbor);
                    } else if (tentativeG >= (gScore[nKey] || Infinity)) {
                        continue;
                    }

                    cameFrom[nKey] = current;
                    gScore[nKey] = tentativeG;
                    fScore[nKey] = tentativeG + Math.abs(goalTile.x - neighbor.x) + Math.abs(goalTile.y - neighbor.y);
                }
            }
            // No hay camino
            return [];
        }
        constructor() {
            console.log('🗺️ MapSystem constructor llamado');
            console.log('   - IsometricTileRenderer disponible:', typeof window.IsometricTileRenderer);
            console.log('   - IsometricEntityRenderer disponible:', typeof window.IsometricEntityRenderer);

            this.width = MAP_WIDTH;
            this.height = MAP_HEIGHT;
            this.tileSize = TILE_SIZE;

            // Map grid: 2D array of tile types
            this.grid = [];

            // Special zones storage
            this.zones = {
                playerSpawns: [],
                enemySpawns: [],
                powerupSpawns: [],
                bushes: [],
                objectives: [],
                decorations: []
            };

            // Camera
            this.camera = {
                x: 0,
                y: 0,
                targetX: 0,
                targetY: 0,
                smoothing: 0.1 // Camera interpolation factor
            };

            // Visual offset for centering
            this.offsetX = 0;
            this.offsetY = 0;

            // Animation time for visual effects
            this.animationTime = 0;

            this.initialized = false;

            // Inicializar renderizador isométrico si está disponible
            this.isometricRenderer = null;
            if (typeof window.IsometricTileRenderer !== 'undefined') {
                this.isometricRenderer = new window.IsometricTileRenderer();
                console.log('✅ IsometricTileRenderer integrado en MapSystem');
            } else {
                console.warn('⚠️ IsometricTileRenderer no disponible - window.IsometricTileRenderer es:', typeof window.IsometricTileRenderer);
            }

            console.log('✅ MapSystem constructor completado - isometricRenderer:', !!this.isometricRenderer);
        }

        // ===================================
        // INITIALIZATION
        // ===================================

        init(canvas) {
            console.log('🗺️ MapSystem.init() llamado', {
                canvas: !!canvas,
                canvasWidth: canvas?.width,
                canvasHeight: canvas?.height,
                IsometricTileRenderer: typeof IsometricTileRenderer,
                IsometricEntityRenderer: typeof IsometricEntityRenderer
            });

            this.canvas = canvas;
            this.ctx = canvas.getContext('2d');

            // Calculate viewport offset to center map
            this.offsetX = (canvas.width - (this.width * this.tileSize)) / 2;
            this.offsetY = (canvas.height - (this.height * this.tileSize)) / 2;

            // Initialize empty grid
            this.grid = Array(this.height).fill(null).map(() =>
                Array(this.width).fill(TILE_TYPES.EMPTY)
            );

            this.initialized = true;
            console.log('✅ MapSystem initialized:', this.width, 'x', this.height);
        }

        // ===================================
        // MAP GENERATION
        // ===================================

        generateMap(options = {}) {
            const {
                algorithm = 'maze', // Solo maze disponible
                wallDensity = 0.3,
                roomCount = 6,
                minRoomSize = 5,
                maxRoomSize = 10
            } = options;

            //console.log('🗺️ Generating map with algorithm:', algorithm);

            // Clear existing map
            this.clearMap();

            // Generate maze (único algoritmo disponible)
            this._generateMaze();

            // Post-processing
            this._addBorder();
            this._placeSpawnZones();
            this._placeBushes();
            this._placeDecorations();

            const isValid = this._validateMap();

            if (!isValid) {
                console.warn('⚠️ Map failed validation, but continuing anyway...');
            }

            console.log('✅ Map generated successfully');
            console.log(`   - Player spawns: ${this.zones.playerSpawns.length}`);
            console.log(`   - Enemy spawns: ${this.zones.enemySpawns.length}`);
            console.log(`   - Power-up zones: ${this.zones.powerupSpawns.length}`);
            console.log(`   - Bush tiles: ${this.zones.bushes.length}`);
            console.log(`   - Decorations: ${this.zones.decorations.length}`);
        }

        clearMap() {
            this.grid = Array(this.height).fill(null).map(() =>
                Array(this.width).fill(TILE_TYPES.FLOOR)
            );
            this.zones = {
                playerSpawns: [],
                enemySpawns: [],
                powerupSpawns: [],
                bushes: [],
                objectives: [],
                decorations: []
            };
        }

        // ===================================
        // GENERATION ALGORITHMS
        // ===================================

        _generateMaze() {
            // ============================================
            // GENERADOR DE LABERINTO MEJORADO
            // ============================================
            // CARACTERÍSTICAS:
            // - Pasillos con ancho mínimo de 3 tiles
            // - Plaza central despejada (6x6 tiles mínimo)
            // - Rutas conectadas entre todas las zonas
            // - Muros exteriores sólidos
            // ============================================

            // Inicializar grid completo con paredes
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    this.grid[y][x] = TILE_TYPES.WALL;
                }
            }

            // ============================================
            // 1. CREAR PLAZA CENTRAL (6x6 tiles mínimo)
            // ============================================
            const centerX = Math.floor(this.width / 2);
            const centerY = Math.floor(this.height / 2);
            const plazaSize = 8; // 8x8 tiles para la plaza
            const plazaStartX = centerX - Math.floor(plazaSize / 2);
            const plazaStartY = centerY - Math.floor(plazaSize / 2);

            // Despejar plaza central
            for (let y = plazaStartY; y < plazaStartY + plazaSize; y++) {
                for (let x = plazaStartX; x < plazaStartX + plazaSize; x++) {
                    if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                        this.grid[y][x] = TILE_TYPES.FLOOR;
                    }
                }
            }

            // Marcar plaza como zona especial
            this.zones.objectives.push({ x: centerX, y: centerY });

            // ============================================
            // 2. GENERAR PASILLOS ANCHOS (3 tiles mínimo)
            // Usando algoritmo de carving con paso de 4 tiles
            // ============================================
            const corridorWidth = 3; // Ancho de pasillos
            const step = 6; // Distancia entre centros de pasillos (4 + 2 de pared)

            // Crear grid de nodos para el laberinto (más espaciado)
            const nodesX = [];
            const nodesY = [];

            for (let x = 3; x < this.width - 3; x += step) {
                nodesX.push(x);
            }
            for (let y = 3; y < this.height - 3; y += step) {
                nodesY.push(y);
            }

            // Generar laberinto usando DFS en nodos espaciados
            const visited = new Set();
            const stack = [];

            // Empezar cerca de la plaza central
            let startNodeX = nodesX[Math.floor(nodesX.length / 2)];
            let startNodeY = nodesY[Math.floor(nodesY.length / 2)];

            stack.push([startNodeX, startNodeY]);
            visited.add(`${startNodeX},${startNodeY}`);

            const directions = [
                [0, -step], // North
                [step, 0],  // East
                [0, step],  // South
                [-step, 0]  // West
            ];

            while (stack.length > 0) {
                const [x, y] = stack[stack.length - 1];

                // Carvar pasillo ancho en posición actual
                this._carveWideCorridor(x, y, corridorWidth);

                // Shuffle directions para más aleatoriedad
                const shuffled = directions
                    .map(d => ({ dir: d, sort: Math.random() }))
                    .sort((a, b) => a.sort - b.sort)
                    .map(d => d.dir);

                let foundNeighbor = false;

                for (const [dx, dy] of shuffled) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 3 && nx < this.width - 3 &&
                        ny >= 3 && ny < this.height - 3 &&
                        !visited.has(`${nx},${ny}`)) {

                        // Carvar camino entre nodos (pasillo ancho)
                        this._carvePathBetweenNodes(x, y, nx, ny, corridorWidth);

                        visited.add(`${nx},${ny}`);
                        stack.push([nx, ny]);
                        foundNeighbor = true;
                        break;
                    }
                }

                if (!foundNeighbor) {
                    stack.pop();
                }
            }

            // ============================================
            // 3. CONECTAR TODO CON LA PLAZA CENTRAL
            // ============================================
            // Crear pasillos radiales desde la plaza a los bordes
            const radialPaths = 4;
            for (let i = 0; i < radialPaths; i++) {
                const angle = (Math.PI * 2 / radialPaths) * i;
                const endX = centerX + Math.floor(Math.cos(angle) * this.width * 0.4);
                const endY = centerY + Math.floor(Math.sin(angle) * this.height * 0.4);

                this._carvePathBetweenNodes(centerX, centerY, endX, endY, corridorWidth);
            }

            // ============================================
            // 4. AÑADIR ABERTURAS ADICIONALES
            // Para hacer el laberinto menos perfecto y más interesante
            // ============================================
            this._addRandomOpenings(0.15);

            // ============================================
            // 5. ASEGURAR MUROS EXTERIORES SÓLIDOS
            // ============================================
            for (let x = 0; x < this.width; x++) {
                this.grid[0][x] = TILE_TYPES.WALL;
                this.grid[this.height - 1][x] = TILE_TYPES.WALL;
            }
            for (let y = 0; y < this.height; y++) {
                this.grid[y][0] = TILE_TYPES.WALL;
                this.grid[y][this.width - 1] = TILE_TYPES.WALL;
            }
        }

        /**
         * Carvar un pasillo ancho centrado en (x, y)
         * @param {number} x - Coordenada X del centro
         * @param {number} y - Coordenada Y del centro
         * @param {number} width - Ancho del pasillo (debe ser impar)
         * @private
         */
        _carveWideCorridor(x, y, width) {
            const halfWidth = Math.floor(width / 2);

            for (let dy = -halfWidth; dy <= halfWidth; dy++) {
                for (let dx = -halfWidth; dx <= halfWidth; dx++) {
                    const nx = x + dx;
                    const ny = y + dy;

                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                        this.grid[ny][nx] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

        /**
         * Carvar un camino ancho entre dos puntos
         * @param {number} x1 - X inicial
         * @param {number} y1 - Y inicial
         * @param {number} x2 - X final
         * @param {number} y2 - Y final
         * @param {number} width - Ancho del camino
         * @private
         */
        _carvePathBetweenNodes(x1, y1, x2, y2, width) {
            const halfWidth = Math.floor(width / 2);

            // Camino en L: primero horizontal, luego vertical
            // Horizontal
            const minX = Math.min(x1, x2);
            const maxX = Math.max(x1, x2);
            for (let x = minX; x <= maxX; x++) {
                for (let dy = -halfWidth; dy <= halfWidth; dy++) {
                    const ny = y1 + dy;
                    if (x >= 0 && x < this.width && ny >= 0 && ny < this.height) {
                        this.grid[ny][x] = TILE_TYPES.FLOOR;
                    }
                }
            }

            // Vertical
            const minY = Math.min(y1, y2);
            const maxY = Math.max(y1, y2);
            for (let y = minY; y <= maxY; y++) {
                for (let dx = -halfWidth; dx <= halfWidth; dx++) {
                    const nx = x2 + dx;
                    if (nx >= 0 && nx < this.width && y >= 0 && y < this.height) {
                        this.grid[y][nx] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

        _generateRooms(roomCount, minSize, maxSize) {
            // BSP-style room generation con mejor conexión
            const rooms = [];

            // Generar habitaciones
            for (let i = 0; i < roomCount * 2; i++) { // Intentar más veces
                if (rooms.length >= roomCount) break;

                const w = minSize + Math.floor(Math.random() * (maxSize - minSize));
                const h = minSize + Math.floor(Math.random() * (maxSize - minSize));
                const x = 2 + Math.floor(Math.random() * (this.width - w - 4));
                const y = 2 + Math.floor(Math.random() * (this.height - h - 4));

                // Check overlap con margen de seguridad
                let overlap = false;
                for (const room of rooms) {
                    if (!(x + w + 1 < room.x || x > room.x + room.w + 1 ||
                          y + h + 1 < room.y || y > room.y + room.h + 1)) {
                        overlap = true;
                        break;
                    }
                }

                if (!overlap) {
                    rooms.push({ x, y, w, h });
                    this._carveRoom(x, y, w, h);
                }
            }

            // Conectar todas las habitaciones con corredores
            for (let i = 0; i < rooms.length - 1; i++) {
                this._connectRooms(rooms[i], rooms[i + 1]);
            }

            // Conectar primera y última habitación para crear ciclos
            if (rooms.length > 2) {
                this._connectRooms(rooms[0], rooms[rooms.length - 1]);
            }

            // Añadir algunas conexiones adicionales aleatorias
            for (let i = 0; i < Math.floor(rooms.length / 2); i++) {
                const r1 = rooms[Math.floor(Math.random() * rooms.length)];
                const r2 = rooms[Math.floor(Math.random() * rooms.length)];
                if (r1 !== r2) {
                    this._connectRooms(r1, r2);
                }
            }

            // Marcar habitaciones grandes como áreas especiales
            for (const room of rooms) {
                if (room.w >= 7 && room.h >= 7) {
                    const cx = Math.floor(room.x + room.w / 2);
                    const cy = Math.floor(room.y + room.h / 2);
                    this.zones.objectives.push({ x: cx, y: cy });
                }
            }
        }

        _generateCellular(wallDensity) {
            // Cellular automata for organic cave-like maps

            // Initialize with random walls
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    this.grid[y][x] = Math.random() < wallDensity ? TILE_TYPES.WALL : TILE_TYPES.FLOOR;
                }
            }

            // Cellular automata iterations
            for (let iter = 0; iter < 4; iter++) {
                const newGrid = JSON.parse(JSON.stringify(this.grid));

                for (let y = 1; y < this.height - 1; y++) {
                    for (let x = 1; x < this.width - 1; x++) {
                        const wallCount = this._countNeighborWalls(x, y);

                        if (wallCount > 4) {
                            newGrid[y][x] = TILE_TYPES.WALL;
                        } else if (wallCount < 4) {
                            newGrid[y][x] = TILE_TYPES.FLOOR;
                        }
                    }
                }

                this.grid = newGrid;
            }
        }

        // ===================================
        // HELPER METHODS
        // ===================================

        _carveRoom(x, y, w, h) {
            for (let ry = y; ry < y + h; ry++) {
                for (let rx = x; rx < x + w; rx++) {
                    if (rx >= 0 && rx < this.width && ry >= 0 && ry < this.height) {
                        this.grid[ry][rx] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

        _connectRooms(room1, room2) {
            const cx1 = Math.floor(room1.x + room1.w / 2);
            const cy1 = Math.floor(room1.y + room1.h / 2);
            const cx2 = Math.floor(room2.x + room2.w / 2);
            const cy2 = Math.floor(room2.y + room2.h / 2);

            // Horizontal corridor
            for (let x = Math.min(cx1, cx2); x <= Math.max(cx1, cx2); x++) {
                this.grid[cy1][x] = TILE_TYPES.FLOOR;
            }

            // Vertical corridor
            for (let y = Math.min(cy1, cy2); y <= Math.max(cy1, cy2); y++) {
                this.grid[y][cx2] = TILE_TYPES.FLOOR;
            }
        }

        _countNeighborWalls(x, y) {
            let count = 0;
            for (let dy = -1; dy <= 1; dy++) {
                for (let dx = -1; dx <= 1; dx++) {
                    if (dx === 0 && dy === 0) continue;
                    const nx = x + dx;
                    const ny = y + dy;
                    if (nx < 0 || nx >= this.width || ny < 0 || ny >= this.height) {
                        count++;
                    } else if (this.grid[ny][nx] === TILE_TYPES.WALL) {
                        count++;
                    }
                }
            }
            return count;
        }

        _addRandomOpenings(density = 0.1) {
            // Añadir aberturas aleatorias en paredes para hacer el laberinto menos perfecto
            const openings = Math.floor(this.width * this.height * density);

            for (let i = 0; i < openings; i++) {
                const x = 2 + Math.floor(Math.random() * (this.width - 4));
                const y = 2 + Math.floor(Math.random() * (this.height - 4));

                if (this.grid[y][x] === TILE_TYPES.WALL) {
                    // Solo abrir si tiene vecinos floor
                    const neighbors = [
                        this.grid[y-1]?.[x],
                        this.grid[y+1]?.[x],
                        this.grid[y]?.[x-1],
                        this.grid[y]?.[x+1]
                    ];

                    const floorNeighbors = neighbors.filter(n => n === TILE_TYPES.FLOOR).length;
                    if (floorNeighbors >= 2) {
                        this.grid[y][x] = TILE_TYPES.FLOOR;
                    }
                }
            }
        }

        _addBorder() {
            // Add indestructible wall border
            for (let x = 0; x < this.width; x++) {
                this.grid[0][x] = TILE_TYPES.WALL;
                this.grid[this.height - 1][x] = TILE_TYPES.WALL;
            }
            for (let y = 0; y < this.height; y++) {
                this.grid[y][0] = TILE_TYPES.WALL;
                this.grid[y][this.width - 1] = TILE_TYPES.WALL;
            }
        }

        _placeSpawnZones() {
            // Find center for player spawn
            const centerX = Math.floor(this.width / 2);
            const centerY = Math.floor(this.height / 2);

            // Find nearest floor tile to center
            let playerSpawn = this._findNearestFloor(centerX, centerY);
            if (playerSpawn) {
                this.zones.playerSpawns.push(playerSpawn);

                // Marcar área segura alrededor del spawn del jugador
                for (let dy = -2; dy <= 2; dy++) {
                    for (let dx = -2; dx <= 2; dx++) {
                        const x = playerSpawn.x + dx;
                        const y = playerSpawn.y + dy;
                        if (x >= 0 && x < this.width && y >= 0 && y < this.height) {
                            if (this.grid[y][x] === TILE_TYPES.WALL) {
                                this.grid[y][x] = TILE_TYPES.FLOOR;
                            }
                        }
                    }
                }
            }

            // Enemy spawns en los bordes del mapa (más distribuidos)
            const edgeSpawns = [
                // Esquinas
                { x: 5, y: 5 },
                { x: this.width - 6, y: 5 },
                { x: 5, y: this.height - 6 },
                { x: this.width - 6, y: this.height - 6 },
                // Lados
                { x: Math.floor(this.width / 2), y: 5 },
                { x: Math.floor(this.width / 2), y: this.height - 6 },
                { x: 5, y: Math.floor(this.height / 2) },
                { x: this.width - 6, y: Math.floor(this.height / 2) }
            ];

            for (const point of edgeSpawns) {
                const spawn = this._findNearestFloor(point.x, point.y, 15);
                if (spawn) {
                    this.zones.enemySpawns.push(spawn);
                }
            }

            // Power-up spawns en habitaciones o áreas abiertas
            this._placePowerupSpawns();
        }

        _placeBushes() {
            // Colocar bushes en clusters estratégicos (mecánica Brawl Stars)
            const bushClusters = 8 + Math.floor(Math.random() * 5);

            for (let i = 0; i < bushClusters; i++) {
                // Buscar posición aleatoria en el mapa
                const centerX = 3 + Math.floor(Math.random() * (this.width - 6));
                const centerY = 3 + Math.floor(Math.random() * (this.height - 6));

                // Verificar que sea área floor
                if (this.grid[centerY][centerX] !== TILE_TYPES.FLOOR) continue;

                // Crear cluster irregular (2x2 a 4x4)
                const clusterSize = 2 + Math.floor(Math.random() * 3);

                for (let dy = 0; dy < clusterSize; dy++) {
                    for (let dx = 0; dx < clusterSize; dx++) {
                        const bx = centerX + dx;
                        const by = centerY + dy;

                        // Probabilidad de colocar bush en esta posición (cluster irregular)
                        if (Math.random() > 0.3 &&
                            bx < this.width && by < this.height &&
                            this.grid[by][bx] === TILE_TYPES.FLOOR) {
                            this.grid[by][bx] = TILE_TYPES.BUSH;
                            this.zones.bushes.push({ x: bx, y: by });
                        }
                    }
                }
            }
        }

        _placePowerupSpawns() {
            // Colocar zonas de power-up en áreas abiertas del mapa
            const powerupCount = 5 + Math.floor(Math.random() * 5);

            for (let i = 0; i < powerupCount; i++) {
                const x = 5 + Math.floor(Math.random() * (this.width - 10));
                const y = 5 + Math.floor(Math.random() * (this.height - 10));

                // Verificar que sea floor y esté en área abierta (no muchos muros cerca)
                if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                    const wallCount = this._countNeighborWalls(x, y);
                    if (wallCount < 4) { // Área relativamente abierta
                        this.zones.powerupSpawns.push({ x, y });
                    }
                }
            }
        }

        _placeDecorations() {
            // Decoraciones visuales procedurales (no colisionables)
            const decorationCount = Math.floor(this.width * this.height * 0.05);

            for (let i = 0; i < decorationCount; i++) {
                const x = 1 + Math.floor(Math.random() * (this.width - 2));
                const y = 1 + Math.floor(Math.random() * (this.height - 2));

                if (this.grid[y][x] === TILE_TYPES.FLOOR && Math.random() > 0.7) {
                    this.zones.decorations.push({
                        x,
                        y,
                        type: Math.floor(Math.random() * 3), // 0: circle, 1: line, 2: glow
                        size: 0.3 + Math.random() * 0.5
                    });
                }
            }
        }

        _findNearestFloor(startX, startY, maxRadius = 10) {
            // BFS to find nearest floor tile
            const queue = [[startX, startY, 0]];
            const visited = new Set([`${startX},${startY}`]);

            while (queue.length > 0) {
                const [x, y, dist] = queue.shift();

                if (this.grid[y] && this.grid[y][x] === TILE_TYPES.FLOOR) {
                        // Verificar que el área alrededor esté libre de paredes
                        let free = true;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = x + dx;
                                const ny = y + dy;
                                if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                                    if (this.grid[ny][nx] === TILE_TYPES.WALL || this.grid[ny][nx] === TILE_TYPES.WALL_DESTRUCTIBLE) {
                                        free = false;
                                    }
                                }
                            }
                        }
                        if (free) {
                            return { x, y };
                        }
                }

                if (dist >= maxRadius) continue;
            }
            return null;
        }

        /**
         * Devuelve una posición de spawn inteligente para enemigos
         * Evita paredes y busca espacio libre alrededor
         */
        getSmartEnemySpawnPosition() {
            // Priorizar spawns con espacio libre alrededor
            const candidates = [];
            for (const spawn of this.zones.enemySpawns) {
                let free = true;
                for (let dy = -1; dy <= 1; dy++) {
                    for (let dx = -1; dx <= 1; dx++) {
                        if (dx === 0 && dy === 0) continue;
                        const nx = spawn.x + dx;
                        const ny = spawn.y + dy;
                        if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height) {
                            if (this.grid[ny][nx] === TILE_TYPES.WALL || this.grid[ny][nx] === TILE_TYPES.WALL_DESTRUCTIBLE) {
                                free = false;
                            }
                        }
                    }
                }
                if (free) {
                    candidates.push(spawn);
                }
            }
            if (candidates.length > 0) {
                const spawn = candidates[Math.floor(Math.random() * candidates.length)];
                return this.tileToWorld(spawn.x, spawn.y);
            }
            // Si no hay candidatos, buscar en todo el mapa
            for (let y = 1; y < this.height - 1; y++) {
                for (let x = 1; x < this.width - 1; x++) {
                    if (this.grid[y][x] === TILE_TYPES.FLOOR) {
                        let free = true;
                        for (let dy = -1; dy <= 1; dy++) {
                            for (let dx = -1; dx <= 1; dx++) {
                                if (dx === 0 && dy === 0) continue;
                                const nx = x + dx;
                                const ny = y + dy;
                                if (this.grid[ny][nx] === TILE_TYPES.WALL || this.grid[ny][nx] === TILE_TYPES.WALL_DESTRUCTIBLE) {
                                    free = false;
                                }
                            }
                        }
                        if (free) {
                            return this.tileToWorld(x, y);
                        }
                    }
                }
            }
            // Fallback: primer spawn
            if (this.zones.enemySpawns.length > 0) {
                const spawn = this.zones.enemySpawns[0];
                return this.tileToWorld(spawn.x, spawn.y);
            }
            return { x: 100, y: 100 };
        }

            // ...existing code...

        _validateMap() {
            // Validar que todas las áreas floor estén conectadas (flood fill)
            if (this.zones.playerSpawns.length === 0) {
                console.warn('⚠️ No player spawn found!');
                return false;
            }

            const startTile = this.zones.playerSpawns[0];
            const visited = new Set();
            const queue = [[startTile.x, startTile.y]];
            visited.add(`${startTile.x},${startTile.y}`);

            let floorTilesReachable = 0;
            let totalFloorTiles = 0;

            // Contar tiles floor totales
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    if (!COLLISION_FLAGS[this.grid[y][x]]) {
                        totalFloorTiles++;
                    }
                }
            }

            // Flood fill desde spawn del jugador
            while (queue.length > 0) {
                const [x, y] = queue.shift();
                floorTilesReachable++;

                const neighbors = [
                    [x, y - 1], [x + 1, y], [x, y + 1], [x - 1, y]
                ];

                for (const [nx, ny] of neighbors) {
                    const key = `${nx},${ny}`;
                    if (nx >= 0 && nx < this.width && ny >= 0 && ny < this.height &&
                        !visited.has(key) && !COLLISION_FLAGS[this.grid[ny][nx]]) {
                        visited.add(key);
                        queue.push([nx, ny]);
                    }
                }
            }

            const connectivity = floorTilesReachable / totalFloorTiles;
            console.log(`🔍 Map connectivity: ${(connectivity * 100).toFixed(1)}% (${floorTilesReachable}/${totalFloorTiles} tiles)`);

            if (connectivity < 0.8) {
                console.warn('⚠️ Map has disconnected areas! Consider regenerating.');
                return false;
            }

            console.log('✅ Map validation passed');
            return true;
        }

        // ===================================
        // COORDINATE CONVERSION
        // ===================================

        worldToTile(worldX, worldY) {
            return {
                x: Math.floor(worldX / this.tileSize),
                y: Math.floor(worldY / this.tileSize)
            };
        }

        tileToWorld(tileX, tileY) {
            return {
                x: tileX * this.tileSize + this.tileSize / 2,
                y: tileY * this.tileSize + this.tileSize / 2
            };
        }

        // ===================================
        // COLLISION DETECTION
        // ===================================

        isWalkable(tileX, tileY) {
            if (tileX < 0 || tileX >= this.width || tileY < 0 || tileY >= this.height) {
                return false;
            }
            const tileType = this.grid[tileY][tileX];
            return !COLLISION_FLAGS[tileType];
        }

        checkCollision(x, y, radius) {
            // Circle-tile collision
            const minTileX = Math.floor((x - radius) / this.tileSize);
            const maxTileX = Math.floor((x + radius) / this.tileSize);
            const minTileY = Math.floor((y - radius) / this.tileSize);
            const maxTileY = Math.floor((y + radius) / this.tileSize);

            for (let ty = minTileY; ty <= maxTileY; ty++) {
                for (let tx = minTileX; tx <= maxTileX; tx++) {
                    if (!this.isWalkable(tx, ty)) {
                        // Check circle-rectangle collision
                        const tileWorldX = tx * this.tileSize;
                        const tileWorldY = ty * this.tileSize;

                        if (this._circleRectCollision(x, y, radius,
                            tileWorldX, tileWorldY, this.tileSize, this.tileSize)) {
                            return { collision: true, tileX: tx, tileY: ty };
                        }
                    }
                }
            }

            return { collision: false };
        }

        _circleRectCollision(cx, cy, radius, rx, ry, rw, rh) {
            // Find closest point on rectangle to circle center
            const closestX = Math.max(rx, Math.min(cx, rx + rw));
            const closestY = Math.max(ry, Math.min(cy, ry + rh));

            const distX = cx - closestX;
            const distY = cy - closestY;

            return (distX * distX + distY * distY) < (radius * radius);
        }

        /**
         * Move with collision detection and sliding
         * Permite movimiento suave a lo largo de paredes (sliding)
         * @param {number} x - Current X position
         * @param {number} y - Current Y position
         * @param {number} vx - Velocity X
         * @param {number} vy - Velocity Y
         * @param {number} radius - Entity collision radius
         * @returns {Object} New position {x, y}
         */
        moveWithCollision(x, y, vx, vy, radius) {
            // Intentar movimiento en X primero (sliding collision)
            let nextX = x + vx;
            let nextY = y;

            const collisionX = this.checkCollision(nextX, nextY, radius);
            if (collisionX.collision) {
                nextX = x; // Cancelar movimiento en X si hay colisión
            }

            // Intentar movimiento en Y
            nextY = y + vy;
            const collisionY = this.checkCollision(nextX, nextY, radius);
            if (collisionY.collision) {
                nextY = y; // Cancelar movimiento en Y si hay colisión
            }

            // Clamp to map bounds
            const mapWidth = this.width * this.tileSize;
            const mapHeight = this.height * this.tileSize;
            nextX = Math.max(radius, Math.min(mapWidth - radius, nextX));
            nextY = Math.max(radius, Math.min(mapHeight - radius, nextY));

            return { x: nextX, y: nextY };
        }

        /**
         * Raycast for bullet collision
         * Usa DDA (Digital Differential Analyzer) algorithm
         * @param {number} x1 - Start X
         * @param {number} y1 - Start Y
         * @param {number} x2 - End X
         * @param {number} y2 - End Y
         * @returns {Object} Hit result {hit: boolean, x, y, tileX, tileY}
         */
        raycast(x1, y1, x2, y2) {
            const dx = x2 - x1;
            const dy = y2 - y1;
            const steps = Math.max(Math.abs(dx), Math.abs(dy));

            if (steps === 0) {
                return { hit: false };
            }

            const xInc = dx / steps;
            const yInc = dy / steps;

            let x = x1;
            let y = y1;

            for (let i = 0; i <= steps; i++) {
                const tile = this.worldToTile(x, y);
                if (!this.isWalkable(tile.x, tile.y)) {
                    return {
                        hit: true,
                        x,
                        y,
                        tileX: tile.x,
                        tileY: tile.y
                    };
                }
                x += xInc;
                y += yInc;
            }

            return { hit: false };
        }

        /**
         * Pushback entities that are stuck inside walls
         * Empuja gradualmente las entidades fuera de las paredes
         * @param {number} x - Current X position
         * @param {number} y - Current Y position
         * @param {number} radius - Entity collision radius
         * @returns {Object} Corrected position {x, y, pushed: boolean}
         */
        pushbackFromWalls(x, y, radius) {
            const collision = this.checkCollision(x, y, radius);

            if (!collision.collision) {
                return { x, y, pushed: false };
            }

            // Find the nearest walkable position
            const maxSearchRadius = radius * 4;
            const step = this.tileSize / 4;
            let bestX = x;
            let bestY = y;
            let minDist = Infinity;

            for (let dy = -maxSearchRadius; dy <= maxSearchRadius; dy += step) {
                for (let dx = -maxSearchRadius; dx <= maxSearchRadius; dx += step) {
                    const dist = Math.sqrt(dx * dx + dy * dy);

                    if (dist > maxSearchRadius) continue;

                    const testX = x + dx;
                    const testY = y + dy;
                    const testCollision = this.checkCollision(testX, testY, radius);

                    if (!testCollision.collision) {
                        if (dist < minDist) {
                            minDist = dist;
                            bestX = testX;
                            bestY = testY;
                        }
                    }
                }
            }

            // Si no se encontró una posición válida, retornar la posición original
            if (minDist === Infinity) {
                return { x, y, pushed: false };
            }

            // Apply gradual pushback (25% per frame)
            const pushStrength = 0.25;
            const newX = x + (bestX - x) * pushStrength;
            const newY = y + (bestY - y) * pushStrength;

            return { x: newX, y: newY, pushed: true };
        }

        // ===================================
        // CAMERA SYSTEM
        // ===================================

        updateCamera(targetX, targetY, canvasWidth, canvasHeight, fastMode = false, zoom = 1.0) {
            // Aplicar zoom al tamaño del canvas (ver más mapa = mayor área de cámara)
            const zoomedWidth = canvasWidth * zoom;
            const zoomedHeight = canvasHeight * zoom;

            // Smooth camera follow
            this.camera.targetX = targetX - zoomedWidth / 2;
            this.camera.targetY = targetY - zoomedHeight / 2;

            // Use faster smoothing when using minimap
            const smoothing = fastMode ? 0.3 : this.camera.smoothing;
            this.camera.x += (this.camera.targetX - this.camera.x) * smoothing;
            this.camera.y += (this.camera.targetY - this.camera.y) * smoothing;

            // Clamp camera to map bounds (con zoom aplicado)
            const maxX = this.width * this.tileSize - zoomedWidth;
            const maxY = this.height * this.tileSize - zoomedHeight;

            this.camera.x = Math.max(0, Math.min(maxX, this.camera.x));
            this.camera.y = Math.max(0, Math.min(maxY, this.camera.y));
        }

        // ===================================
        // MINIMAP RENDERING
        // ===================================

        renderMinimap(ctx, minimapWidth, minimapHeight, player, enemies = []) {
            if (!this.initialized) {
                console.warn('⚠️ renderMinimap called but MapSystem not initialized');
                return;
            }


            // Clear minimap
            ctx.clearRect(0, 0, minimapWidth, minimapHeight);

            // Background
            ctx.fillStyle = 'rgba(10, 10, 26, 0.95)';
            ctx.fillRect(0, 0, minimapWidth, minimapHeight);

            // Calculate scale
            const scaleX = minimapWidth / this.width;
            const scaleY = minimapHeight / this.height;
            const tileW = scaleX;
            const tileH = scaleY;

            // Render map tiles
            for (let y = 0; y < this.height; y++) {
                for (let x = 0; x < this.width; x++) {
                    const tileType = this.grid[y][x];
                    const screenX = x * scaleX;
                    const screenY = y * scaleY;

                    switch (tileType) {
                        case TILE_TYPES.WALL:
                        case TILE_TYPES.WALL_DESTRUCTIBLE:
                            // Paredes cyan neon
                            ctx.fillStyle = VISUAL_STYLE.wallBase;
                            ctx.globalAlpha = 0.6;
                            ctx.fillRect(screenX, screenY, tileW, tileH);
                            break;

                        case TILE_TYPES.BUSH:
                            // Bushes verde
                            ctx.fillStyle = VISUAL_STYLE.bushBase;
                            ctx.globalAlpha = 0.4;
                            ctx.fillRect(screenX, screenY, tileW, tileH);
                            break;

                        case TILE_TYPES.FLOOR:
                            // Suelo muy sutil
                            ctx.fillStyle = VISUAL_STYLE.floorAccent;
                            ctx.globalAlpha = 0.15;
                            ctx.fillRect(screenX, screenY, tileW, tileH);
                            break;
                    }
                }
            }

            ctx.globalAlpha = 1.0;

            // Render spawn zones con animación pulsante
            const pulse = Math.sin(this.animationTime * 5) * 0.3 + 0.7;

            // Enemy spawns (pequeños círculos rojos)
            ctx.fillStyle = VISUAL_STYLE.spawnEnemy;
            ctx.globalAlpha = pulse * 0.5;
            for (const spawn of this.zones.enemySpawns) {
                const x = spawn.x * scaleX;
                const y = spawn.y * scaleY;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(2, scaleX * 0.8), 0, Math.PI * 2);
                ctx.fill();
            }

            // Player spawn (círculo verde)
            ctx.fillStyle = VISUAL_STYLE.spawnPlayer;
            ctx.globalAlpha = pulse * 0.6;
            for (const spawn of this.zones.playerSpawns) {
                const x = spawn.x * scaleX;
                const y = spawn.y * scaleY;
                ctx.beginPath();
                ctx.arc(x, y, Math.max(3, scaleX * 1.2), 0, Math.PI * 2);
                ctx.fill();
            }

            ctx.globalAlpha = 1.0;

            // Render enemies (puntos magenta/rojo)
            if (enemies && enemies.length > 0) {
                ctx.shadowBlur = 8;
                ctx.shadowColor = '#ff00ff';
                ctx.fillStyle = '#ff00ff';

                for (const enemy of enemies) {
                    if (!enemy || enemy.health <= 0) continue;

                    const enemyTile = this.worldToTile(enemy.x, enemy.y);
                    const x = enemyTile.x * scaleX;
                    const y = enemyTile.y * scaleY;

                    // Render path (línea discontinua) SOLO si está siguiendo el path
                    if (enemy.isFollowingPath && enemy.path && enemy.path.length > 1) {
                        ctx.save();
                        ctx.strokeStyle = '#ff00ff';
                        ctx.setLineDash([3, 4]);
                        ctx.lineWidth = 2;
                        ctx.globalAlpha = 0.7;
                        ctx.beginPath();
                        for (let i = 0; i < enemy.path.length; i++) {
                            const px = enemy.path[i].x * scaleX;
                            const py = enemy.path[i].y * scaleY;
                            if (i === 0) {
                                ctx.moveTo(px, py);
                            } else {
                                ctx.lineTo(px, py);
                            }
                        }
                        ctx.stroke();
                        ctx.setLineDash([]);
                        ctx.globalAlpha = 1.0;
                        ctx.restore();
                    }

                    ctx.beginPath();
                    ctx.arc(x, y, Math.max(2, scaleX * 0.6), 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.shadowBlur = 0;
            }

            // Render player (punto cyan brillante)
            if (player) {
                const playerTile = this.worldToTile(player.x, player.y);
                const x = playerTile.x * scaleX;
                const y = playerTile.y * scaleY;

                // Glow exterior
                ctx.shadowBlur = 12;
                ctx.shadowColor = '#00ffff';
                ctx.fillStyle = '#00ffff';
                ctx.beginPath();
                ctx.arc(x, y, Math.max(4, scaleX * 1.5), 0, Math.PI * 2);
                ctx.fill();

                // Centro blanco
                ctx.shadowBlur = 0;
                ctx.fillStyle = '#ffffff';
                ctx.beginPath();
                ctx.arc(x, y, Math.max(2, scaleX * 0.8), 0, Math.PI * 2);
                ctx.fill();
            }

            // Render viewport rect (zona visible en el mapa principal)
            if (window.minimapViewportRect) {
                const vp = window.minimapViewportRect;
                ctx.strokeStyle = '#ffff00';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.8;
                ctx.setLineDash([4, 4]);
                ctx.strokeRect(vp.x, vp.y, vp.width, vp.height);
                ctx.setLineDash([]);

                // Fondo semi-transparente del viewport
                ctx.fillStyle = 'rgba(255, 255, 0, 0.1)';
                ctx.fillRect(vp.x, vp.y, vp.width, vp.height);
                ctx.globalAlpha = 1.0;
            }

            // Border neon
            ctx.strokeStyle = VISUAL_STYLE.wallBase;
            ctx.lineWidth = 2;
            ctx.globalAlpha = 0.8;
            ctx.strokeRect(0, 0, minimapWidth, minimapHeight);
            ctx.globalAlpha = 1.0;
        }

        // ===================================
        // RENDERING
        // ===================================

        render(ctx, cameraX = 0, cameraY = 0) {
            console.log("🗺️ MapSystem.render() llamado", {
                initialized: this.initialized,
                isometricRenderer: !!this.isometricRenderer,
                gridSize: this.grid ? `${this.grid.length}x${this.grid[0]?.length}` : 'null',
                camera: { x: cameraX, y: cameraY }
            });

            if (!this.initialized) {
                console.warn('⚠️ MapSystem.render() called but not initialized');
                return;
            }

            // MODO ISOMÉTRICO - Delegar todo el renderizado al IsometricTileRenderer
            if (this.isometricRenderer) {
                const camera = { x: cameraX, y: cameraY };
                // CRÍTICO: Pasar tileSize para conversión correcta de coordenadas
                console.log("🎨 Llamando a isometricRenderer.render()");
                this.isometricRenderer.render(ctx, this.grid, camera, this.tileSize);
                return;
            }

            // FALLBACK: Renderizado 2D plano (solo si no hay renderizador isométrico)
            console.warn('⚠️ Usando fallback 2D - IsometricTileRenderer no disponible');

            // Actualizar tiempo de animación
            this.animationTime += VISUAL_STYLE.animationSpeed;

            // Obtener zoom de cámara
            let zoom = 1.0;
            if (typeof window.ViewportScale !== 'undefined' && typeof window.ViewportScale.getCameraZoom === 'function') {
                zoom = window.ViewportScale.getCameraZoom();
            }

            // Calcular el área visible ajustando por el zoom de cámara
            const viewportWidth = this.canvas.width * zoom;
            const viewportHeight = this.canvas.height * zoom;

            const startTileX = Math.max(0, Math.floor(cameraX / this.tileSize) - 1);
            const endTileX = Math.min(this.width, Math.ceil((cameraX + viewportWidth) / this.tileSize) + 1);
            const startTileY = Math.max(0, Math.floor(cameraY / this.tileSize) - 1);
            const endTileY = Math.min(this.height, Math.ceil((cameraY + viewportHeight) / this.tileSize) + 1);

            // Render floor tiles primero
            for (let y = startTileY; y < endTileY; y++) {
                for (let x = startTileX; x < endTileX; x++) {
                    const tileType = this.grid[y][x];
                    const screenX = x * this.tileSize - cameraX;
                    const screenY = y * this.tileSize - cameraY;

                    if (tileType === TILE_TYPES.FLOOR || tileType === TILE_TYPES.BUSH) {
                        this._renderFloorTile(ctx, screenX, screenY, tileType, x, y);
                    }
                }
            }

            // Render decorations
            this._renderDecorations(ctx, cameraX, cameraY);

            // Render walls (simple 2D fallback, no depth sorting)
            for (let y = startTileY; y < endTileY; y++) {
                for (let x = startTileX; x < endTileX; x++) {
                    const tileType = this.grid[y][x];
                    const screenX = x * this.tileSize - cameraX;
                    const screenY = y * this.tileSize - cameraY;

                    if (tileType === TILE_TYPES.WALL || tileType === TILE_TYPES.WALL_DESTRUCTIBLE) {
                        this._renderWallTile(ctx, screenX, screenY, tileType, x, y);
                    }
                }
            }

            // Render spawn zones (debug/visual)
            this._renderSpawnZones(ctx, cameraX, cameraY);
        }

        renderFloorsOnly(ctx, cameraX = 0, cameraY = 0) {
            if (!this.initialized || !this.isometricRenderer) return;
            const camera = { x: cameraX, y: cameraY };
            this.isometricRenderer.renderFloorsOnly(ctx, this.grid, camera, this.tileSize);
        }

        renderWallsOnly(ctx, cameraX = 0, cameraY = 0) {
            if (!this.initialized || !this.isometricRenderer) return;
            const camera = { x: cameraX, y: cameraY };
            this.isometricRenderer.renderWallsOnly(ctx, this.grid, camera, this.tileSize);
        }

        // Obtiene objetos estáticos (muros y arbustos) con su profundidad para depth sorting
        getStaticObjectsForDepthSorting() {
            if (!this.initialized || !this.grid) return [];
            const objects = [];
            const mapHeight = this.grid.length;
            const mapWidth = this.grid[0] ? this.grid[0].length : 0;

            for (let y = 0; y < mapHeight; y++) {
                for (let x = 0; x < mapWidth; x++) {
                    const tileType = this.grid[y][x];
                    // Muros (2,3) y Arbustos (4)
                    if (tileType === 2 || tileType === 3 || tileType === 4) {
                        const worldY = (y + 0.5) * this.tileSize; // Centro del tile
                        objects.push({
                            type: tileType === 4 ? 'bush' : 'wall',
                            tileType: tileType,
                            tileX: x,
                            tileY: y,
                            worldY: worldY,
                            depth: worldY
                        });
                    }
                }
            }
            return objects;
        }

        // Renderiza un objeto estático individual (muro o arbusto)
        renderStaticObject(ctx, obj, cameraX, cameraY) {
            if (!this.isometricRenderer) return;
            const camera = { x: cameraX, y: cameraY };
            this.isometricRenderer.renderSingleStaticObject(ctx, this.grid, obj.tileX, obj.tileY, obj.tileType, camera, this.tileSize);
        }

        _renderFloorTile(ctx, x, y, tileType, tileX, tileY) {
            const size = this.tileSize;

            if (tileType === TILE_TYPES.FLOOR) {
                // Suelo con gradiente sutil
                const gradient = ctx.createRadialGradient(
                    x + size / 2, y + size / 2, 0,
                    x + size / 2, y + size / 2, size / 2
                );

                // Animación de color basada en posición
                const colorShift = Math.sin(this.animationTime + tileX * 0.1 + tileY * 0.1) * 10;
                const r = 26 + colorShift;
                const g = 26 + colorShift;
                const b = 78 + colorShift;

                gradient.addColorStop(0, `rgba(${r + 10}, ${g + 10}, ${b + 10}, 1)`);
                gradient.addColorStop(1, `rgba(${r}, ${g}, ${b}, 1)`);

                ctx.fillStyle = gradient;
                ctx.fillRect(x, y, size, size);

                // Líneas decorativas sutiles
                if (Math.random() > 0.95) {
                    ctx.strokeStyle = 'rgba(0, 255, 255, 0.05)';
                    ctx.lineWidth = 1;
                    ctx.beginPath();
                    ctx.moveTo(x, y + size / 2);
                    ctx.lineTo(x + size, y + size / 2);
                    ctx.stroke();
                }
            } else if (tileType === TILE_TYPES.BUSH) {
                // Bush con efecto neon verde
                ctx.fillStyle = VISUAL_STYLE.floorBase;
                ctx.fillRect(x, y, size, size);

                // Glow verde
                ctx.save();
                ctx.shadowBlur = VISUAL_STYLE.glowIntensity;
                ctx.shadowColor = VISUAL_STYLE.bushGlow;

                // Cluster de círculos para simular vegetación
                const bushDensity = 5 + Math.floor(Math.random() * 3);
                for (let i = 0; i < bushDensity; i++) {
                    const offsetX = Math.random() * size;
                    const offsetY = Math.random() * size;
                    const radius = 8 + Math.random() * 12;

                    const pulse = Math.sin(this.animationTime * 2 + tileX + tileY) * 0.2 + 0.8;
                    ctx.globalAlpha = 0.3 + Math.random() * 0.3;
                    ctx.fillStyle = VISUAL_STYLE.bushBase;
                    ctx.beginPath();
                    ctx.arc(x + offsetX, y + offsetY, radius * pulse, 0, Math.PI * 2);
                    ctx.fill();
                }

                ctx.restore();
            }
        }

        _renderWallTile(ctx, x, y, tileType, tileX, tileY) {
            const size = this.tileSize;

            // Detectar vecinos para renderizado inteligente
            const neighbors = {
                N: this.grid[tileY - 1]?.[tileX] === TILE_TYPES.WALL,
                E: this.grid[tileY]?.[tileX + 1] === TILE_TYPES.WALL,
                S: this.grid[tileY + 1]?.[tileX] === TILE_TYPES.WALL,
                W: this.grid[tileY]?.[tileX - 1] === TILE_TYPES.WALL
            };

            // RENDERIZADO 2D PLANO FALLBACK (para cuando no hay IsometricTileRenderer)
            ctx.save();

            // Base oscura
            ctx.fillStyle = VISUAL_STYLE.floorBase;
            ctx.fillRect(x, y, size, size);

            // Borde neon cyan brillante
            ctx.shadowBlur = VISUAL_STYLE.glowIntensity * 1.5;
            ctx.shadowColor = VISUAL_STYLE.wallGlow;
            ctx.strokeStyle = VISUAL_STYLE.wallBase;
            ctx.lineWidth = VISUAL_STYLE.wallThickness;

            // Animación de brillo
            const glowPulse = Math.sin(this.animationTime * 3 + tileX * 0.3 + tileY * 0.3) * 0.2 + 0.8;
            ctx.globalAlpha = glowPulse;

            // Renderizar bordes según vecinos
            ctx.beginPath();
            if (!neighbors.N) {
                ctx.moveTo(x, y);
                ctx.lineTo(x + size, y);
            }
            if (!neighbors.E) {
                ctx.moveTo(x + size, y);
                ctx.lineTo(x + size, y + size);
            }
            if (!neighbors.S) {
                ctx.moveTo(x + size, y + size);
                ctx.lineTo(x, y + size);
            }
            if (!neighbors.W) {
                ctx.moveTo(x, y + size);
                ctx.lineTo(x, y);
            }
            ctx.stroke();

            // Esquinas redondeadas en bordes exteriores
            if (!neighbors.N && !neighbors.W) {
                ctx.beginPath();
                ctx.arc(x + 5, y + 5, 5, Math.PI, Math.PI * 1.5);
                ctx.stroke();
            }
            if (!neighbors.N && !neighbors.E) {
                ctx.beginPath();
                ctx.arc(x + size - 5, y + 5, 5, Math.PI * 1.5, 0);
                ctx.stroke();
            }
            if (!neighbors.S && !neighbors.E) {
                ctx.beginPath();
                ctx.arc(x + size - 5, y + size - 5, 5, 0, Math.PI * 0.5);
                ctx.stroke();
            }
            if (!neighbors.S && !neighbors.W) {
                ctx.beginPath();
                ctx.arc(x + 5, y + size - 5, 5, Math.PI * 0.5, Math.PI);
                ctx.stroke();
            }

            ctx.restore();
        }

        _renderDecorations(ctx, cameraX, cameraY) {
            ctx.save();

            for (const deco of this.zones.decorations) {
                const screenX = deco.x * this.tileSize - cameraX + this.tileSize / 2;
                const screenY = deco.y * this.tileSize - cameraY + this.tileSize / 2;

                // Solo renderizar si está visible
                if (screenX < -50 || screenX > this.canvas.width + 50 ||
                    screenY < -50 || screenY > this.canvas.height + 50) continue;

                const pulse = Math.sin(this.animationTime * 2 + deco.x + deco.y) * 0.3 + 0.7;

                ctx.shadowBlur = 10;
                ctx.shadowColor = VISUAL_STYLE.decoration;
                ctx.globalAlpha = 0.2 + Math.random() * 0.2;

                switch (deco.type) {
                    case 0: { // Circle
                        let size = this.tileSize * (deco.size ?? 1) * pulse;
                        if (!isFinite(size) || size <= 0) size = Math.max(this.tileSize * 0.5, 10);
                        ctx.fillStyle = VISUAL_STYLE.decoration;
                        ctx.beginPath();
                        ctx.arc(screenX, screenY, size / 2, 0, Math.PI * 2);
                        ctx.fill();
                        break;
                    }
                    case 1: { // Line
                        let size = this.tileSize * (deco.size ?? 1) * pulse;
                        if (!isFinite(size) || size <= 0) size = Math.max(this.tileSize * 0.5, 10);
                        ctx.strokeStyle = VISUAL_STYLE.decoration;
                        ctx.lineWidth = 2;
                        ctx.beginPath();
                        ctx.moveTo(screenX - size, screenY);
                        ctx.lineTo(screenX + size, screenY);
                        ctx.stroke();
                        break;
                    }
                    case 2: { // Glow point
                        let size = this.tileSize * (deco.size ?? 1) * pulse;
                        if (!isFinite(size) || size <= 0) size = Math.max(this.tileSize * 0.5, 10);
                        if (isFinite(screenX) && isFinite(screenY) && isFinite(size) && size > 0) {
                            const gradient = ctx.createRadialGradient(screenX, screenY, 0, screenX, screenY, size);
                            gradient.addColorStop(0, VISUAL_STYLE.decoration);
                            gradient.addColorStop(1, 'transparent');
                            ctx.fillStyle = gradient;
                            ctx.fillRect(screenX - size, screenY - size, size * 2, size * 2);
                        }
                        break;
                    }
                }
            }

            ctx.restore();
        }

        _renderSpawnZones(ctx, cameraX, cameraY) {
            ctx.save();

            const pulse = Math.sin(this.animationTime * 5) * 0.3 + 0.7;

            // Player spawn (verde)
            for (const spawn of this.zones.playerSpawns) {
                const x = spawn.x * this.tileSize - cameraX + this.tileSize / 2;
                const y = spawn.y * this.tileSize - cameraY + this.tileSize / 2;

                ctx.shadowBlur = 20;
                ctx.shadowColor = VISUAL_STYLE.spawnPlayer;
                ctx.strokeStyle = VISUAL_STYLE.spawnPlayer;
                ctx.lineWidth = 3;
                ctx.globalAlpha = pulse * 0.5;

                ctx.beginPath();
                ctx.arc(x, y, this.tileSize * 0.8, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Enemy spawns (rojo) - solo renderizar los visibles
            ctx.shadowColor = VISUAL_STYLE.spawnEnemy;
            ctx.strokeStyle = VISUAL_STYLE.spawnEnemy;
            ctx.globalAlpha = pulse * 0.3;

            for (const spawn of this.zones.enemySpawns) {
                const x = spawn.x * this.tileSize - cameraX + this.tileSize / 2;
                const y = spawn.y * this.tileSize - cameraY + this.tileSize / 2;

                if (x < -100 || x > this.canvas.width + 100 ||
                    y < -100 || y > this.canvas.height + 100) continue;

                ctx.beginPath();
                ctx.arc(x, y, this.tileSize * 0.6, 0, Math.PI * 2);
                ctx.stroke();
            }

            // Power-up zones (amarillo)
            ctx.shadowColor = VISUAL_STYLE.spawnPowerup;
            ctx.strokeStyle = VISUAL_STYLE.spawnPowerup;
            ctx.globalAlpha = pulse * 0.4;

            for (const spawn of this.zones.powerupSpawns) {
                const x = spawn.x * this.tileSize - cameraX + this.tileSize / 2;
                const y = spawn.y * this.tileSize - cameraY + this.tileSize / 2;

                if (x < -100 || x > this.canvas.width + 100 ||
                    y < -100 || y > this.canvas.height + 100) continue;

                ctx.beginPath();
                ctx.arc(x, y, this.tileSize * 0.4, 0, Math.PI * 2);
                ctx.stroke();
            }

            ctx.restore();
        }

        // ===================================
        // SPAWN HELPERS
        // ===================================

        getPlayerSpawnPosition() {
            if (this.zones.playerSpawns.length > 0) {
                const spawn = this.zones.playerSpawns[0];
                return this.tileToWorld(spawn.x, spawn.y);
            }
            return { x: this.width * this.tileSize / 2, y: this.height * this.tileSize / 2 };
        }

        getRandomEnemySpawnPosition() {
            if (this.zones.enemySpawns.length > 0) {
                const spawn = this.zones.enemySpawns[Math.floor(Math.random() * this.zones.enemySpawns.length)];
                return this.tileToWorld(spawn.x, spawn.y);
            }
            return { x: 100, y: 100 };
        }

        isInBush(x, y) {
            const tile = this.worldToTile(x, y);
            return this.grid[tile.y] && this.grid[tile.y][tile.x] === TILE_TYPES.BUSH;
        }
    }

    // ===================================
    // EXPORT TO GLOBAL SCOPE
    // ===================================

    window.MapSystem = MapSystem;
    window.TILE_TYPES = TILE_TYPES;
    window.VISUAL_STYLE = VISUAL_STYLE;


})();
