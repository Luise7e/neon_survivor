// Clean, self-contained MapMode implementation
// Features:
// - Load TMX/XML maps (CSV encoding) from assets
// - Load tileset image (tilesheet_complete_2X.png defaults)
// - Tile-based rendering with camera and collisions
// - Player object with movement, shooting and a 'super' ability
// - Two virtual joysticks: left = movement, right = aim/shoot
// - Simple bullets and obstacle collision
// Notes/assumptions:
// - TMX <data> must be CSV encoded. base64/compressed not supported here.
// - Tile size assumed 64x64 and tilesheet columns 54 for the provided tilesheet.

(function () {
    const TILE_SIZE = 64;
    const TILESET_COLUMNS = 54; // tilesheet_complete_2X.png
    const DEFAULT_TILESET = 'maps/shooter/Tilesheet/tilesheet_complete_2X.png';

    function clamp(v, a, b) { return Math.max(a, Math.min(b, v)); }

    const MapMode = {
        canvas: null,
        ctx: null,
        tilesetImg: null,
        map: {
            width: 0,
            height: 0,
            layers: [],
            collision: null,
        },
        camera: { x: 0, y: 0, w: 800, h: 600 },
        player: null,
        bullets: [],
        joysticks: {},
        isActive: false,

        init(canvas, ctx, options = {}) {
            this.canvas = canvas;
            this.ctx = ctx;
            this.options = options;
            this.camera.w = canvas.width;
            this.camera.h = canvas.height;
            this.bullets = [];
            this.isActive = false;
            this._ensurePlayer();
            return this.loadTileset(options.tileset || DEFAULT_TILESET).then(() => this);
        },

        _ensurePlayer() {
            if (!this.player) {
                this.player = {
                    x: 200,
                    y: 200,
                    radius: 18,
                    speed: 200, // px/s
                    angle: 0,
                    hp: 100,
                    fireRate: 6, // bullets per second
                    fireCooldown: 0,
                    superReady: true,
                };
            }
        },

        loadTileset(path) {
            return new Promise((resolve, reject) => {
                const img = new Image();
                img.onload = () => {
                    this.tilesetImg = img;
                    console.log('✅ Tileset loaded:', img.width, 'x', img.height);
                    resolve(img);
                };
                img.onerror = (e) => {
                    console.error('Failed to load tileset', path, e);
                    reject(e);
                };
                img.src = path;
            });
        },

        loadMapFromXML(xmlPath) {
                            // Fetch TMX (XML exported by Tiled). Only CSV layer data supported currently.
                            return fetch(xmlPath).then(r => r.text()).then(async text => {
                                const parser = new DOMParser();
                                const doc = parser.parseFromString(text, 'application/xml');
                                const mapNode = doc.querySelector('map');
                                if (!mapNode) throw new Error('No <map> node found in ' + xmlPath);

                                const width = parseInt(mapNode.getAttribute('width'), 10);
                                const height = parseInt(mapNode.getAttribute('height'), 10);
                                this.map.width = width;
                                this.map.height = height;
                                this.map.layers = [];
                                this.map.collision = new Array(height).fill(0).map(() => new Array(width).fill(0));

                                // --- Tileset externo (.tsx) ---
                                        let tilesetImgPath = DEFAULT_TILESET;
                                        let firstgid = 1;
                                        const tilesetNode = doc.querySelector('tileset');
                                        if (tilesetNode) {
                                            firstgid = parseInt(tilesetNode.getAttribute('firstgid') || '1', 10);
                                            const tsxSrc = tilesetNode.getAttribute('source');
                                            if (tsxSrc) {
                                                            // Normalizar ruta relativa usando URL API
                                                                        let tmxBase = xmlPath.substring(0, xmlPath.lastIndexOf('/') + 1);
                                                                        // Si la ruta ya es relativa, simplemente la concatenamos
                                                                        let tsxPath = tmxBase + tsxSrc.replace(/^\.\//, '').replace(/\\/g, '/');
                                                                        // Normalizar ../ en la ruta
                                                                        while (tsxPath.indexOf('../') !== -1) {
                                                                            tsxPath = tsxPath.replace(/[^/]+\/\.\.\//, '');
                                                                        }
                                                if (!tsxSrc.endsWith('.tsx')) {
                                                    // Si es tileset embebido, buscar <image>
                                                    const imageNode = tilesetNode.querySelector('image');
                                                    if (imageNode) tilesetImgPath = imageNode.getAttribute('source');
                                                } else {
                                                    // Cargar el archivo .tsx y extraer la ruta de la imagen
                                                    const tsxText = await fetch(tsxPath).then(r => r.text());
                                                    const tsxDoc = parser.parseFromString(tsxText, 'application/xml');
                                                    const imageNode = tsxDoc.querySelector('image');
                                                    if (imageNode) {
                                                        let imgSrc = imageNode.getAttribute('source');
                                                        // Normalizar ruta relativa a la carpeta del .tsx
                                                        let tsxBase = tsxPath.substring(0, tsxPath.lastIndexOf('/') + 1);
                                                        while (imgSrc.startsWith('../')) {
                                                            imgSrc = imgSrc.substring(3);
                                                            tsxBase = tsxBase.replace(/[^/]+\/$/, '');
                                                        }
                                                        if (imgSrc && !imgSrc.startsWith('http') && !imgSrc.startsWith('/')) {
                                                            imgSrc = tsxBase + imgSrc;
                                                        }
                                                        tilesetImgPath = imgSrc;
                                                    }
                                                }
                                            }
                                        }
                                // Cargar el tileset correcto
                                await this.loadTileset(tilesetImgPath);

                                const layerNodes = doc.querySelectorAll('layer');
                                layerNodes.forEach((layerNode) => {
                                    const dataNode = layerNode.querySelector('data');
                                    if (!dataNode) return;
                                    const encoding = dataNode.getAttribute('encoding') || 'csv';
                                    let tiles = [];
                                    if (encoding === 'csv') {
                                        // Corregido: generar tiles[y][x] con y < height, x < width
                                        const csv = dataNode.textContent.trim();
                                        const flat = csv.split(/\s*,\s*/).map(s => parseInt(s, 10) || 0);
                                        for (let y = 0; y < height; y++) {
                                            const row = [];
                                            for (let x = 0; x < width; x++) {
                                                const idx = y * width + x;
                                                const gid = flat[idx] || 0;
                                                // Soporte para firstgid (por si hay varios tilesets)
                                                row.push(gid === 0 ? -1 : gid - firstgid);
                                            }
                                            tiles.push(row);
                                        }
                                    } else {
                                        throw new Error('Unsupported layer encoding: ' + encoding + ' (only CSV supported)');
                                    }
                                    this.map.layers.push({ name: layerNode.getAttribute('name') || 'layer', tiles });
                                });

                const objLayer = doc.querySelector('objectgroup');
                if (objLayer) {
                    const playerSpawn = objLayer.querySelector('[name="player"]');
                    if (playerSpawn) {
                        const x = parseFloat(playerSpawn.getAttribute('x')) || 0;
                        const y = parseFloat(playerSpawn.getAttribute('y')) || 0;
                        this.player.x = x + TILE_SIZE / 2;
                        this.player.y = y + TILE_SIZE / 2;
                    }
                }

                const collisionLayer = this.map.layers.find(l => /collision|obstacle|obstacles/i.test(l.name));
                if (collisionLayer) {
                    for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) {
                        const gid = collisionLayer.tiles[y][x];
                        if (gid >= 0) this.map.collision[y][x] = 1;
                    }
                }

                console.log('✅ Map loaded:', xmlPath, width, 'x', height, 'layers:', this.map.layers.length);
                return this;
            });
        },

        start() {
            this.isActive = true;
            this._setupInput();
            this._centerCameraOnPlayer();
            console.log('Map Mode started');
        },

        stop() {
            this.isActive = false;
            this._teardownInput();
            console.log('Map Mode stopped');
        },

        update(dt) {
            if (!this.isActive) return;
            const js = this.joysticks.left;
            if (js && js.active) {
                const vx = js.dx * this.player.speed;
                const vy = js.dy * this.player.speed;
                const newX = this.player.x + vx * dt;
                const newY = this.player.y + vy * dt;
                const resolved = this._moveWithCollision(this.player.x, this.player.y, newX, newY, this.player.radius);
                this.player.x = resolved.x;
                this.player.y = resolved.y;
            }

            const rjs = this.joysticks.right;
            this.player.fireCooldown = Math.max(0, this.player.fireCooldown - dt);
            if (rjs && rjs.active) {
                this.player.angle = Math.atan2(rjs.dy, rjs.dx);
                if (this.player.fireCooldown <= 0) {
                    this._fireBullet(this.player.x, this.player.y, this.player.angle);
                    this.player.fireCooldown = 1 / this.player.fireRate;
                }
            }

            for (let i = this.bullets.length - 1; i >= 0; i--) {
                const b = this.bullets[i];
                b.x += Math.cos(b.angle) * b.speed * dt;
                b.y += Math.sin(b.angle) * b.speed * dt;
                if (b.x < 0 || b.y < 0 || b.x > this.map.width * TILE_SIZE || b.y > this.map.height * TILE_SIZE) {
                    this.bullets.splice(i, 1);
                    continue;
                }
                const tx = Math.floor(b.x / TILE_SIZE);
                const ty = Math.floor(b.y / TILE_SIZE);
                if (this.map.collision[ty] && this.map.collision[ty][tx]) {
                    this.bullets.splice(i, 1);
                }
            }

            this._centerCameraOnPlayer();
        },

        render() {
            if (!this.isActive || !this.ctx || !this.canvas) return;
            const ctx = this.ctx;
            ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
            this._renderMap(ctx);
            this._renderBullets(ctx);
            this._renderPlayer(ctx);
            this._renderHUD(ctx);
        },

        _renderMap(ctx) {
            if (!this.map.layers.length || !this.tilesetImg) return;
            const startCol = Math.floor(this.camera.x / TILE_SIZE);
            const endCol = Math.floor((this.camera.x + this.camera.w) / TILE_SIZE);
            const startRow = Math.floor(this.camera.y / TILE_SIZE);
            const endRow = Math.floor((this.camera.y + this.camera.h) / TILE_SIZE);

            // Debug: imprimir dimensiones y capas solo una vez
            if (!this._mapRenderLogged) {
                console.log('[MapMode] _renderMap capas:', this.map.layers.length, 'map:', this.map.width, 'x', this.map.height);
                for (let l = 0; l < this.map.layers.length; l++) {
                    const layer = this.map.layers[l];
                    console.log(`[MapMode] Layer ${l} (${layer.name || 'unnamed'}) size:`, layer.tiles.length, 'x', (layer.tiles[0] ? layer.tiles[0].length : 0));
                }
                this._mapRenderLogged = true;
            }

            for (let l = 0; l < this.map.layers.length; l++) {
                const layer = this.map.layers[l];
                const maxY = layer.tiles.length;
                const maxX = layer.tiles[0] ? layer.tiles[0].length : 0;
                for (let y = Math.max(0, startRow); y <= Math.min(endRow, maxY - 1); y++) {
                    for (let x = Math.max(0, startCol); x <= Math.min(endCol, maxX - 1); x++) {
                        let gid = -1;
                        try {
                            gid = layer.tiles[y][x];
                        } catch (e) {
                            // Solo loguear el primer error
                            if (!this._tileErrorLogged) {
                                console.error(`[MapMode] Error accediendo a tiles[${y}][${x}] en capa ${l}:`, e);
                                this._tileErrorLogged = true;
                            }
                            continue;
                        }
                        if (y === startRow && x === startCol && l === 0 && !this._firstGidLogged) {
                            console.log(`[MapMode] Primer gid visible:`, gid);
                            this._firstGidLogged = true;
                        }
                        if (gid < 0) continue;
                        const sx = (gid % TILESET_COLUMNS) * TILE_SIZE;
                        const sy = Math.floor(gid / TILESET_COLUMNS) * TILE_SIZE;
                        const dx = x * TILE_SIZE - this.camera.x;
                        const dy = y * TILE_SIZE - this.camera.y;
                        ctx.drawImage(this.tilesetImg, sx, sy, TILE_SIZE, TILE_SIZE, Math.round(dx), Math.round(dy), TILE_SIZE, TILE_SIZE);
                    }
                }
            }
        },

        _renderPlayer(ctx) {
            const p = this.player;
            const sx = p.x - this.camera.x;
            const sy = p.y - this.camera.y;
            ctx.save();
            ctx.translate(sx, sy);
            ctx.rotate(p.angle);
            ctx.fillStyle = '#2b9';
            ctx.beginPath(); ctx.arc(0, 0, p.radius, 0, Math.PI * 2); ctx.fill();
            ctx.fillStyle = '#1a6';
            ctx.fillRect(0, -6, p.radius + 12, 12);
            ctx.restore();
        },

        _renderBullets(ctx) {
            ctx.fillStyle = '#ffeb3b';
            for (const b of this.bullets) {
                const bx = b.x - this.camera.x;
                const by = b.y - this.camera.y;
                ctx.beginPath(); ctx.arc(bx, by, 5, 0, Math.PI * 2); ctx.fill();
            }
        },

        _renderHUD(ctx) {
            const left = this.joysticks.left;
            const right = this.joysticks.right;
            ctx.save();
            ctx.globalAlpha = 0.5;
            if (left) {
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(80, this.canvas.height - 80, 48, 0, Math.PI * 2); ctx.fill();
            }
            if (right) {
                ctx.fillStyle = '#000';
                ctx.beginPath(); ctx.arc(this.canvas.width - 80, this.canvas.height - 80, 48, 0, Math.PI * 2); ctx.fill();
            }
            ctx.restore();
        },

        _fireBullet(x, y, angle) {
            this.bullets.push({ x: x, y: y, angle: angle, speed: 600 });
        },

        _moveWithCollision(ox, oy, nx, ny, radius) {
            const tx = Math.floor(nx / TILE_SIZE);
            const ty = Math.floor(ny / TILE_SIZE);
            if (this.map.collision[ty] && this.map.collision[ty][tx]) {
                return { x: ox, y: oy };
            }
            return { x: nx, y: ny };
        },

        _centerCameraOnPlayer() {
            const p = this.player;
            this.camera.x = Math.round(p.x - this.camera.w / 2);
            this.camera.y = Math.round(p.y - this.camera.h / 2);
            this.camera.x = clamp(this.camera.x, 0, Math.max(0, this.map.width * TILE_SIZE - this.camera.w));
            this.camera.y = clamp(this.camera.y, 0, Math.max(0, this.map.height * TILE_SIZE - this.camera.h));
        },

        _setupInput() {
            this._teardownInput();
            const root = document.createElement('div');
            root.id = 'mapmode-input-overlay';
            Object.assign(root.style, { position: 'absolute', left: '0', top: '0', width: '100%', height: '100%', pointerEvents: 'none' });
            const leftZone = document.createElement('div');
            Object.assign(leftZone.style, { position: 'absolute', left: '12px', bottom: '12px', width: '220px', height: '220px', borderRadius: '110px', pointerEvents: 'auto' });
            root.appendChild(leftZone);
            const rightZone = document.createElement('div');
            Object.assign(rightZone.style, { position: 'absolute', right: '12px', bottom: '12px', width: '220px', height: '220px', borderRadius: '110px', pointerEvents: 'auto' });
            root.appendChild(rightZone);
            const abilityBtn = document.createElement('button');
            abilityBtn.textContent = 'SUPER';
            Object.assign(abilityBtn.style, { position: 'absolute', right: '12px', bottom: '250px', width: '80px', height: '80px', borderRadius: '40px', pointerEvents: 'auto' });
            root.appendChild(abilityBtn);
            const container = this.canvas.parentElement || document.body;
            container.appendChild(root);
            this._overlayRoot = root;

            const makeJoystick = (zone) => {
                const state = { active: false, startX: 0, startY: 0, dx: 0, dy: 0, cx: 0, cy: 0 };
                const onDown = (e) => {
                    e.preventDefault();
                    const rect = zone.getBoundingClientRect();
                    const px = e.clientX - rect.left;
                    const py = e.clientY - rect.top;
                    state.active = true;
                    state.startX = px; state.startY = py;
                    state.cx = rect.left + px; state.cy = rect.top + py;
                    state.dx = 0; state.dy = 0;
                };
                const onMove = (e) => {
                    if (!state.active) return;
                    const rect = zone.getBoundingClientRect();
                    const px = e.clientX - rect.left;
                    const py = e.clientY - rect.top;
                    const vx = px - state.startX;
                    const vy = py - state.startY;
                    state.dx = clamp(vx / 70, -1, 1);
                    state.dy = clamp(vy / 70, -1, 1);
                };
                const onUp = (e) => { state.active = false; state.dx = 0; state.dy = 0; };
                zone.addEventListener('pointerdown', onDown);
                window.addEventListener('pointermove', onMove);
                window.addEventListener('pointerup', onUp);
                return state;
            };

            this.joysticks.left = makeJoystick(leftZone);
            this.joysticks.right = makeJoystick(rightZone);

            abilityBtn.addEventListener('click', (e) => {
                if (this.player.superReady) {
                    this._useSuper();
                }
            });
        },

        _teardownInput() {
            if (this._overlayRoot && this._overlayRoot.parentElement) {
                this._overlayRoot.parentElement.removeChild(this._overlayRoot);
            }
            this._overlayRoot = null;
            this.joysticks = {};
        },

        _useSuper() {
            this.player.superReady = false;
            const originalSpeed = this.player.speed;
            this.player.speed = originalSpeed * 1.8;
            setTimeout(() => { this.player.speed = originalSpeed; this.player.superReady = true; }, 4000);
            for (let i = 0; i < 12; i++) {
                const angle = (i / 12) * Math.PI * 2;
                this._fireBullet(this.player.x, this.player.y, angle);
            }
        },

        loadMap(mapArray) {
            this.map.width = mapArray.width;
            this.map.height = mapArray.height;
            this.map.layers = mapArray.layers;
            this.map.collision = new Array(this.map.height).fill(0).map(() => new Array(this.map.width).fill(0));
            const collisionLayer = this.map.layers.find(l => /collision|obstacle|obstacles/i.test(l.name));
            if (collisionLayer) for (let y = 0; y < this.map.height; y++) for (let x = 0; x < this.map.width; x++) {
                if (collisionLayer.tiles[y][x] >= 0) this.map.collision[y][x] = 1;
            }
            this._centerCameraOnPlayer();
            return this;
        }
    };

    window.MapMode = MapMode;
})();
