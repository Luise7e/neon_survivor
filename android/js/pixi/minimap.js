/**
 * @fileoverview Sistema de minimapa con renderTexture
 * Vista top-down del mapa con posiciones de jugador y enemigos
 */

(function(window) {
    'use strict';

    /**
     * Minimapa con vista del mapa y entidades
     * @constructor
     * @param {Object} config - Configuración del minimapa
     */
    function Minimap(config) {
        PIXI.Container.call(this);
        
        this.config = config || {};
        this.size = this.config.size || 150;
        this.mapWidth = this.config.mapWidth || 2240;
        this.mapHeight = this.config.mapHeight || 2240;
        this.zoom = this.config.zoom || 1;
        this.neonColor = this.config.neonColor || 0x00FFFF;
        
        // Referencias a entidades
        this.player = null;
        this.enemies = [];
        this.walls = [];
        
        // Contenedor para el minimapa
        this.mapContainer = new PIXI.Container();
        
        this.init();
    }

    Minimap.prototype = Object.create(PIXI.Container.prototype);
    Minimap.prototype.constructor = Minimap;

    Minimap.prototype.init = function() {
        // Fondo del minimapa
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, 0.7);
        this.background.drawRoundedRect(0, 0, this.size, this.size, 8);
        this.background.endFill();
        this.addChild(this.background);
        
        // Borde con glow
        this.border = new PIXI.Graphics();
        this.border.lineStyle(2, this.neonColor, 1);
        this.border.drawRoundedRect(0, 0, this.size, this.size, 8);
        this.addChild(this.border);
        
        // Aplicar glow filter al borde
        if (PIXI.GlowFilter) {
            var glow = new PIXI.GlowFilter({
                distance: 8,
                outerStrength: 1,
                innerStrength: 0.5,
                color: this.neonColor,
                quality: 0.5
            });
            this.border.filters = [glow];
        }
        
        // Máscara para el contenido del minimapa
        this.mask = new PIXI.Graphics();
        this.mask.beginFill(0xFFFFFF);
        this.mask.drawRoundedRect(2, 2, this.size - 4, this.size - 4, 6);
        this.mask.endFill();
        this.addChild(this.mask);
        
        // Contenedor del mapa (se escala y centra)
        this.mapContainer.mask = this.mask;
        this.addChild(this.mapContainer);
        
        // Capa de fondo del mapa
        this.mapBackground = new PIXI.Graphics();
        this.mapContainer.addChild(this.mapBackground);
        
        // Capa de paredes
        this.wallsLayer = new PIXI.Container();
        this.mapContainer.addChild(this.wallsLayer);
        
        // Capa de entidades
        this.entitiesLayer = new PIXI.Container();
        this.mapContainer.addChild(this.entitiesLayer);
        
        // Icono del jugador
        this.playerIcon = new PIXI.Graphics();
        this.playerIcon.beginFill(0x00FF00);
        this.playerIcon.drawCircle(0, 0, 4);
        this.playerIcon.endFill();
        this.playerIcon.lineStyle(1, 0xFFFFFF);
        this.playerIcon.drawCircle(0, 0, 4);
        this.entitiesLayer.addChild(this.playerIcon);
        
        // Pool de iconos de enemigos
        this.enemyIcons = [];
        
        this.updateScale();
    };

    /**
     * Actualizar escala del minimapa
     */
    Minimap.prototype.updateScale = function() {
        var scaleX = (this.size - 4) / this.mapWidth;
        var scaleY = (this.size - 4) / this.mapHeight;
        this.scale = Math.min(scaleX, scaleY) * this.zoom;
        
        this.mapContainer.scale.set(this.scale);
        this.mapContainer.position.set(2, 2);
    };

    /**
     * Configurar referencia al jugador
     * @param {Object} player - Objeto del jugador con x, y
     */
    Minimap.prototype.setPlayer = function(player) {
        this.player = player;
    };

    /**
     * Configurar array de enemigos
     * @param {Array} enemies - Array de enemigos con x, y
     */
    Minimap.prototype.setEnemies = function(enemies) {
        this.enemies = enemies || [];
    };

    /**
     * Configurar paredes del mapa
     * @param {Array} walls - Array de objetos con x, y, width, height
     */
    Minimap.prototype.setWalls = function(walls) {
        this.walls = walls || [];
        this.renderWalls();
    };

    /**
     * Renderizar fondo del mapa
     * @param {number} color - Color del fondo
     */
    Minimap.prototype.setMapBackground = function(color) {
        this.mapBackground.clear();
        this.mapBackground.beginFill(color || 0x111111, 0.8);
        this.mapBackground.drawRect(0, 0, this.mapWidth, this.mapHeight);
        this.mapBackground.endFill();
    };

    /**
     * Renderizar paredes en el minimapa
     */
    Minimap.prototype.renderWalls = function() {
        this.wallsLayer.removeChildren();
        
        for (var i = 0; i < this.walls.length; i++) {
            var wall = this.walls[i];
            var wallGraphic = new PIXI.Graphics();
            
            if (wall.isCircle) {
                wallGraphic.beginFill(0xFF0000, 0.6);
                wallGraphic.drawCircle(wall.x, wall.y, wall.radius);
                wallGraphic.endFill();
            } else if (wall.points) {
                // Polígono
                wallGraphic.beginFill(0xFF0000, 0.6);
                wallGraphic.drawPolygon(wall.points);
                wallGraphic.endFill();
            } else {
                // Rectángulo
                wallGraphic.beginFill(0xFF0000, 0.6);
                wallGraphic.drawRect(wall.x, wall.y, wall.width, wall.height);
                wallGraphic.endFill();
            }
            
            this.wallsLayer.addChild(wallGraphic);
        }
    };

    /**
     * Obtener o crear icono de enemigo
     * @param {number} index - Índice del enemigo
     * @returns {PIXI.Graphics}
     */
    Minimap.prototype.getEnemyIcon = function(index) {
        if (!this.enemyIcons[index]) {
            var icon = new PIXI.Graphics();
            icon.beginFill(0xFF0000);
            icon.drawCircle(0, 0, 3);
            icon.endFill();
            this.entitiesLayer.addChild(icon);
            this.enemyIcons[index] = icon;
        }
        return this.enemyIcons[index];
    };

    /**
     * Actualizar minimapa
     * @param {number} deltaTime - Delta time
     */
    Minimap.prototype.update = function(deltaTime) {
        // Actualizar posición del jugador
        if (this.player) {
            this.playerIcon.position.set(this.player.x, this.player.y);
            this.playerIcon.visible = true;
        } else {
            this.playerIcon.visible = false;
        }
        
        // Actualizar enemigos
        for (var i = 0; i < this.enemies.length; i++) {
            var enemy = this.enemies[i];
            if (enemy && enemy.active !== false) {
                var icon = this.getEnemyIcon(i);
                icon.position.set(enemy.x, enemy.y);
                icon.visible = true;
            } else if (this.enemyIcons[i]) {
                this.enemyIcons[i].visible = false;
            }
        }
        
        // Ocultar iconos sobrantes
        for (var j = this.enemies.length; j < this.enemyIcons.length; j++) {
            if (this.enemyIcons[j]) {
                this.enemyIcons[j].visible = false;
            }
        }
        
        // Centrar mapa en el jugador (opcional)
        if (this.config.followPlayer && this.player) {
            var centerX = (this.size - 4) / 2;
            var centerY = (this.size - 4) / 2;
            
            this.mapContainer.pivot.set(this.player.x, this.player.y);
            this.mapContainer.position.set(centerX + 2, centerY + 2);
        }
    };

    /**
     * Cambiar zoom del minimapa
     * @param {number} zoom - Factor de zoom
     */
    Minimap.prototype.setZoom = function(zoom) {
        this.zoom = zoom;
        this.updateScale();
    };

    /**
     * Activar/desactivar seguimiento del jugador
     * @param {boolean} follow - Si debe seguir al jugador
     */
    Minimap.prototype.setFollowPlayer = function(follow) {
        this.config.followPlayer = follow;
        
        if (!follow) {
            // Resetear posición
            this.mapContainer.pivot.set(0, 0);
            this.mapContainer.position.set(2, 2);
        }
    };

    /**
     * Limpiar recursos
     */
    Minimap.prototype.destroy = function() {
        for (var i = 0; i < this.enemyIcons.length; i++) {
            if (this.enemyIcons[i]) {
                this.enemyIcons[i].destroy();
            }
        }
        
        PIXI.Container.prototype.destroy.call(this, { children: true });
    };

    // ============================================================================
    // EXPORTS
    // ============================================================================

    window.Minimap = Minimap;

})(window);
