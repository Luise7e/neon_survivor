/* ===================================
   ISOMETRIC TRANSFORM MODULE
   Conversión entre coordenadas cartesianas e isométricas
   ================================== */

(function() {
    'use strict';

    // ===================================
    // CONFIGURACIÓN ISOMÉTRICA
    // ===================================

    const ISOMETRIC_CONFIG = {
        // Tamaño del tile isométrico (en píxeles de pantalla)
        tileWidth: 64,   // Ancho del diamante isométrico
        tileHeight: 32,  // Alto del diamante isométrico

        // Ratio isométrico estándar (2:1)
        ratio: 2,

        // Offset para centrar el mapa
        offsetX: 0,
        offsetY: 0
    };

    // ===================================
    // TRANSFORMACIONES DE COORDENADAS
    // ===================================

    /**
     * Convierte coordenadas del mapa (cartesianas) a coordenadas de pantalla (isométricas)
     * @param {number} x - Coordenada X del mapa (en tiles)
     * @param {number} y - Coordenada Y del mapa (en tiles)
     * @returns {{x: number, y: number}} - Coordenadas de pantalla en píxeles
     */
    function mapToIso(x, y) {
        const isoX = (x - y) * (ISOMETRIC_CONFIG.tileWidth / 2);
        const isoY = (x + y) * (ISOMETRIC_CONFIG.tileHeight / 2);

        return {
            x: isoX + ISOMETRIC_CONFIG.offsetX,
            y: isoY + ISOMETRIC_CONFIG.offsetY
        };
    }

    /**
     * Convierte coordenadas de pantalla (isométricas) a coordenadas del mapa (cartesianas)
     * @param {number} screenX - Coordenada X de pantalla en píxeles
     * @param {number} screenY - Coordenada Y de pantalla en píxeles
     * @returns {{x: number, y: number}} - Coordenadas del mapa en tiles
     */
    function isoToMap(screenX, screenY) {
        // Ajustar por offset
        const x = screenX - ISOMETRIC_CONFIG.offsetX;
        const y = screenY - ISOMETRIC_CONFIG.offsetY;

        // Fórmula inversa de proyección isométrica
        const mapX = (x / (ISOMETRIC_CONFIG.tileWidth / 2) + y / (ISOMETRIC_CONFIG.tileHeight / 2)) / 2;
        const mapY = (y / (ISOMETRIC_CONFIG.tileHeight / 2) - x / (ISOMETRIC_CONFIG.tileWidth / 2)) / 2;

        return {
            x: mapX,
            y: mapY
        };
    }

    /**
     * Convierte coordenadas del mundo (píxeles) a coordenadas isométricas de pantalla
     * Útil para entidades que se mueven en píxeles, no en tiles
     * @param {number} worldX - Coordenada X del mundo en píxeles
     * @param {number} worldY - Coordenada Y del mundo en píxeles
     * @param {number} tileSize - Tamaño del tile en el mundo (64 por defecto)
     * @returns {{x: number, y: number}} - Coordenadas de pantalla isométricas
     */
    function worldToIso(worldX, worldY, tileSize = 64) {
        // Convertir píxeles del mundo a tiles
        const mapX = worldX / tileSize;
        const mapY = worldY / tileSize;

        // Convertir tiles a isométrico
        return mapToIso(mapX, mapY);
    }

    /**
     * Convierte coordenadas isométricas de pantalla a coordenadas del mundo (píxeles)
     * @param {number} isoX - Coordenada X isométrica
     * @param {number} isoY - Coordenada Y isométrica
     * @param {number} tileSize - Tamaño del tile en el mundo (64 por defecto)
     * @returns {{x: number, y: number}} - Coordenadas del mundo en píxeles
     */
    function isoToWorld(isoX, isoY, tileSize = 64) {
        // Convertir isométrico a tiles
        const map = isoToMap(isoX, isoY);

        // Convertir tiles a píxeles del mundo
        return {
            x: map.x * tileSize,
            y: map.y * tileSize
        };
    }

    /**
     * Calcula el orden de profundidad (depth) para sorting isométrico
     * En isométrico, tiles/entidades más atrás (mayor x+y) se dibujan primero
     * @param {number} x - Coordenada X del mapa (en tiles)
     * @param {number} y - Coordenada Y del mapa (en tiles)
     * @returns {number} - Valor de profundidad para sorting
     */
    function getDepth(x, y) {
        return x + y;
    }

    /**
     * Actualiza el offset para centrar el mapa en la pantalla
     * @param {number} mapWidth - Ancho del mapa en tiles
     * @param {number} mapHeight - Alto del mapa en tiles
     * @param {number} canvasWidth - Ancho del canvas
     * @param {number} canvasHeight - Alto del canvas
     */
    function centerMap(mapWidth, mapHeight, canvasWidth, canvasHeight) {
        // Calcular posición del centro del mapa en coordenadas isométricas
        const centerMap = mapToIso(mapWidth / 2, mapHeight / 2);

        // Centrar en el canvas
        ISOMETRIC_CONFIG.offsetX = canvasWidth / 2;
        ISOMETRIC_CONFIG.offsetY = canvasHeight / 4; // Más arriba para ver mejor
    }

    /**
     * Actualiza el tamaño de los tiles isométricos (para zoom/escala)
     * @param {number} tileWidth - Nuevo ancho del tile
     * @param {number} tileHeight - Nuevo alto del tile
     */
    function setTileSize(tileWidth, tileHeight = null) {
        ISOMETRIC_CONFIG.tileWidth = tileWidth;
        ISOMETRIC_CONFIG.tileHeight = tileHeight || (tileWidth / 2); // Mantener ratio 2:1
    }

    /**
     * Obtiene los vértices de un tile isométrico en coordenadas de pantalla
     * @param {number} mapX - Coordenada X del mapa (en tiles)
     * @param {number} mapY - Coordenada Y del mapa (en tiles)
     * @returns {Array<{x: number, y: number}>} - Array de 4 vértices (top, right, bottom, left)
     */
    function getTileVertices(mapX, mapY) {
        const center = mapToIso(mapX, mapY);
        const halfWidth = ISOMETRIC_CONFIG.tileWidth / 2;
        const halfHeight = ISOMETRIC_CONFIG.tileHeight / 2;

        return [
            { x: center.x, y: center.y - halfHeight },           // Top
            { x: center.x + halfWidth, y: center.y },            // Right
            { x: center.x, y: center.y + halfHeight },           // Bottom
            { x: center.x - halfWidth, y: center.y }             // Left
        ];
    }

    /**
     * Comprueba si un punto (en coordenadas de pantalla) está dentro de un tile isométrico
     * @param {number} pointX - Coordenada X del punto en pantalla
     * @param {number} pointY - Coordenada Y del punto en pantalla
     * @param {number} mapX - Coordenada X del tile en el mapa
     * @param {number} mapY - Coordenada Y del tile en el mapa
     * @returns {boolean} - True si el punto está dentro del tile
     */
    function isPointInTile(pointX, pointY, mapX, mapY) {
        const vertices = getTileVertices(mapX, mapY);

        // Algoritmo de ray casting para detectar punto en polígono
        let inside = false;
        for (let i = 0, j = vertices.length - 1; i < vertices.length; j = i++) {
            const xi = vertices[i].x, yi = vertices[i].y;
            const xj = vertices[j].x, yj = vertices[j].y;

            const intersect = ((yi > pointY) !== (yj > pointY))
                && (pointX < (xj - xi) * (pointY - yi) / (yj - yi) + xi);

            if (intersect) inside = !inside;
        }

        return inside;
    }

    /**
     * Obtiene el tile del mapa en el que se encuentra un punto de pantalla
     * @param {number} screenX - Coordenada X de pantalla
     * @param {number} screenY - Coordenada Y de pantalla
     * @returns {{x: number, y: number}} - Coordenadas del tile (redondeadas)
     */
    function getTileAtScreenPos(screenX, screenY) {
        const map = isoToMap(screenX, screenY);
        return {
            x: Math.floor(map.x),
            y: Math.floor(map.y)
        };
    }

    // ===================================
    // FUNCIONES DE UTILIDAD
    // ===================================

    /**
     * Calcula la distancia isométrica entre dos puntos del mapa
     * @param {number} x1 - X del primer punto (tiles)
     * @param {number} y1 - Y del primer punto (tiles)
     * @param {number} x2 - X del segundo punto (tiles)
     * @param {number} y2 - Y del segundo punto (tiles)
     * @returns {number} - Distancia en tiles
     */
    function getIsometricDistance(x1, y1, x2, y2) {
        // Distancia Manhattan (más apropiada para isométrico)
        return Math.abs(x2 - x1) + Math.abs(y2 - y1);
    }

    /**
     * Interpola entre dos posiciones isométricas
     * @param {number} x1 - X inicial
     * @param {number} y1 - Y inicial
     * @param {number} x2 - X final
     * @param {number} y2 - Y final
     * @param {number} t - Factor de interpolación (0-1)
     * @returns {{x: number, y: number}} - Posición interpolada
     */
    function lerpIso(x1, y1, x2, y2, t) {
        const pos1 = mapToIso(x1, y1);
        const pos2 = mapToIso(x2, y2);

        return {
            x: pos1.x + (pos2.x - pos1.x) * t,
            y: pos1.y + (pos2.y - pos1.y) * t
        };
    }

    /**
     * Convierte una dirección de pantalla (joystick) a dirección del mundo
     * Esto permite que el movimiento del joystick sea intuitivo en vista isométrica
     * @param {number} screenDirX - Dirección X en pantalla (-1 a 1)
     * @param {number} screenDirY - Dirección Y en pantalla (-1 a 1)
     * @returns {{x: number, y: number}} - Dirección en coordenadas del mundo (normalizada)
     */
    function screenDirectionToWorld(screenDirX, screenDirY) {
        // En vista isométrica, necesitamos rotar las direcciones 45 grados
        // para que el movimiento sea intuitivo:
        // - Arriba en pantalla (0, -1) → Arriba-Derecha en mundo (1, -1)
        // - Derecha en pantalla (1, 0) → Abajo-Derecha en mundo (1, 1)
        // - Abajo en pantalla (0, 1) → Abajo-Izquierda en mundo (-1, 1)
        // - Izquierda en pantalla (-1, 0) → Arriba-Izquierda en mundo (-1, -1)

        // Matriz de rotación isométrica (45 grados)
        // Usamos la transformación inversa de la proyección isométrica
        const worldX = screenDirX + screenDirY;
        const worldY = screenDirY - screenDirX;

        // Normalizar el vector resultante para mantener la velocidad consistente
        const length = Math.sqrt(worldX * worldX + worldY * worldY);

        if (length === 0) {
            return { x: 0, y: 0 };
        }

        return {
            x: worldX / length,
            y: worldY / length
        };
    }

    // ===================================
    // EXPORTAR API PÚBLICA
    // ===================================

    const IsometricTransform = {
        // Configuración
        config: ISOMETRIC_CONFIG,

        // Transformaciones principales
        mapToIso,
        isoToMap,
        worldToIso,
        isoToWorld,

        // Profundidad y sorting
        getDepth,

        // Utilidades de tiles
        getTileVertices,
        isPointInTile,
        getTileAtScreenPos,

        // Configuración
        centerMap,
        setTileSize,

        // Utilidades matemáticas
        getIsometricDistance,
        lerpIso,

        // Transformación de entrada (joystick/teclado)
        screenDirectionToWorld
    };

    // Exponer globalmente
    if (typeof window !== 'undefined') {
        window.IsometricTransform = IsometricTransform;
    }

    // Exponer para módulos CommonJS/Node
    if (typeof module !== 'undefined' && module.exports) {
        module.exports = IsometricTransform;
    }

})();
