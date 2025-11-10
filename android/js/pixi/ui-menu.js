/**
 * @fileoverview Sistema de UI interactiva con menús, botones y paneles
 * Soporte para touch events y keyboard navigation
 */

(function(window) {
    'use strict';

    // ============================================================================
    // UI BUTTON
    // ============================================================================

    /**
     * Botón interactivo con estilo neon
     * @constructor
     * @param {Object} config - Configuración del botón
     */
    function UIButton(config) {
        PIXI.Container.call(this);
        
        this.config = config || {};
        this.width = this.config.width || 200;
        this.height = this.config.height || 50;
        this.text = this.config.text || 'BUTTON';
        this.neonColor = this.config.neonColor || 0x00FFFF;
        this.callback = this.config.onClick || null;
        
        this.isHovered = false;
        this.isPressed = false;
        this.enabled = true;
        
        this.init();
        this.setupInteraction();
    }

    UIButton.prototype = Object.create(PIXI.Container.prototype);
    UIButton.prototype.constructor = UIButton;

    UIButton.prototype.init = function() {
        // Fondo
        this.background = new PIXI.Graphics();
        this.addChild(this.background);
        
        // Borde
        this.border = new PIXI.Graphics();
        this.addChild(this.border);
        
        // Texto
        this.label = new PIXI.Text(this.text, {
            fontFamily: 'Arial',
            fontSize: 18,
            fill: 0xFFFFFF,
            fontWeight: 'bold'
        });
        this.label.anchor.set(0.5);
        this.label.position.set(this.width / 2, this.height / 2);
        this.addChild(this.label);
        
        this.updateGraphics();
    };

    UIButton.prototype.setupInteraction = function() {
        this.eventMode = 'static';
        this.cursor = 'pointer';
        
        this.on('pointerover', this.onPointerOver.bind(this));
        this.on('pointerout', this.onPointerOut.bind(this));
        this.on('pointerdown', this.onPointerDown.bind(this));
        this.on('pointerup', this.onPointerUp.bind(this));
        this.on('pointerupoutside', this.onPointerUp.bind(this));
    };

    UIButton.prototype.onPointerOver = function() {
        if (!this.enabled) return;
        this.isHovered = true;
        this.updateGraphics();
    };

    UIButton.prototype.onPointerOut = function() {
        if (!this.enabled) return;
        this.isHovered = false;
        this.isPressed = false;
        this.updateGraphics();
    };

    UIButton.prototype.onPointerDown = function() {
        if (!this.enabled) return;
        this.isPressed = true;
        this.updateGraphics();
    };

    UIButton.prototype.onPointerUp = function() {
        if (!this.enabled) return;
        
        if (this.isPressed && this.isHovered && this.callback) {
            this.callback();
        }
        
        this.isPressed = false;
        this.updateGraphics();
    };

    UIButton.prototype.updateGraphics = function() {
        var bgAlpha = 0.3;
        var borderWidth = 2;
        var scale = 1;
        
        if (!this.enabled) {
            bgAlpha = 0.1;
            this.label.alpha = 0.5;
        } else if (this.isPressed) {
            bgAlpha = 0.6;
            scale = 0.95;
        } else if (this.isHovered) {
            bgAlpha = 0.5;
            borderWidth = 3;
        } else {
            this.label.alpha = 1;
        }
        
        // Fondo
        this.background.clear();
        this.background.beginFill(this.neonColor, bgAlpha);
        this.background.drawRoundedRect(0, 0, this.width, this.height, 8);
        this.background.endFill();
        
        // Borde
        this.border.clear();
        this.border.lineStyle(borderWidth, this.neonColor, 1);
        this.border.drawRoundedRect(0, 0, this.width, this.height, 8);
        
        // Aplicar glow si está hover
        if (this.isHovered && PIXI.GlowFilter) {
            var glow = new PIXI.GlowFilter({
                distance: 10,
                outerStrength: 2,
                innerStrength: 1,
                color: this.neonColor,
                quality: 0.5
            });
            this.border.filters = [glow];
        } else {
            this.border.filters = [];
        }
        
        this.scale.set(scale);
    };

    UIButton.prototype.setEnabled = function(enabled) {
        this.enabled = enabled;
        this.eventMode = enabled ? 'static' : 'none';
        this.cursor = enabled ? 'pointer' : 'default';
        this.updateGraphics();
    };

    UIButton.prototype.setText = function(text) {
        this.text = text;
        this.label.text = text;
    };

    // ============================================================================
    // UI PANEL
    // ============================================================================

    /**
     * Panel con fondo y borde
     * @constructor
     * @param {Object} config - Configuración del panel
     */
    function UIPanel(config) {
        PIXI.Container.call(this);
        
        this.config = config || {};
        this.panelWidth = this.config.width || 400;
        this.panelHeight = this.config.height || 300;
        this.neonColor = this.config.neonColor || 0x00FFFF;
        this.title = this.config.title || '';
        
        this.init();
    }

    UIPanel.prototype = Object.create(PIXI.Container.prototype);
    UIPanel.prototype.constructor = UIPanel;

    UIPanel.prototype.init = function() {
        // Fondo semi-transparente
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, 0.8);
        this.background.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
        this.background.endFill();
        this.addChild(this.background);
        
        // Borde con glow
        this.border = new PIXI.Graphics();
        this.border.lineStyle(3, this.neonColor, 1);
        this.border.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
        this.addChild(this.border);
        
        if (PIXI.GlowFilter) {
            var glow = new PIXI.GlowFilter({
                distance: 12,
                outerStrength: 1.5,
                innerStrength: 0.5,
                color: this.neonColor,
                quality: 0.5
            });
            this.border.filters = [glow];
        }
        
        // Título
        if (this.title) {
            this.titleBar = new PIXI.Graphics();
            this.titleBar.beginFill(this.neonColor, 0.3);
            this.titleBar.drawRoundedRect(0, 0, this.panelWidth, 40, 12);
            this.titleBar.endFill();
            this.addChild(this.titleBar);
            
            this.titleText = new PIXI.Text(this.title, {
                fontFamily: 'Arial',
                fontSize: 20,
                fill: 0xFFFFFF,
                fontWeight: 'bold',
                dropShadow: true,
                dropShadowColor: this.neonColor,
                dropShadowBlur: 6,
                dropShadowDistance: 0
            });
            this.titleText.anchor.set(0.5);
            this.titleText.position.set(this.panelWidth / 2, 20);
            this.addChild(this.titleText);
        }
        
        // Contenedor para contenido
        this.content = new PIXI.Container();
        this.content.position.set(20, this.title ? 60 : 20);
        this.addChild(this.content);
    };

    UIPanel.prototype.addContent = function(child) {
        this.content.addChild(child);
    };

    UIPanel.prototype.clearContent = function() {
        this.content.removeChildren();
    };

    UIPanel.prototype.getContent = function() {
        return this.content;
    };

    // ============================================================================
    // UI MENU
    // ============================================================================

    /**
     * Menú con múltiples opciones
     * @constructor
     * @param {Object} config - Configuración del menú
     */
    function UIMenu(config) {
        UIPanel.call(this, config);
        
        this.options = this.config.options || [];
        this.buttonSpacing = this.config.buttonSpacing || 60;
        this.buttons = [];
        this.selectedIndex = 0;
        
        this.createButtons();
        this.setupKeyboard();
    }

    UIMenu.prototype = Object.create(UIPanel.prototype);
    UIMenu.prototype.constructor = UIMenu;

    UIMenu.prototype.createButtons = function() {
        for (var i = 0; i < this.options.length; i++) {
            var option = this.options[i];
            var button = new UIButton({
                width: this.panelWidth - 40,
                height: 50,
                text: option.text || 'Option ' + (i + 1),
                neonColor: option.color || this.neonColor,
                onClick: option.onClick || null
            });
            
            button.position.set(0, i * this.buttonSpacing);
            this.content.addChild(button);
            this.buttons.push(button);
        }
        
        // Ajustar altura del panel según número de botones
        var contentHeight = this.options.length * this.buttonSpacing + 40;
        if (contentHeight > this.panelHeight - 100) {
            this.panelHeight = contentHeight + 100;
            this.background.clear();
            this.background.beginFill(0x000000, 0.8);
            this.background.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
            this.background.endFill();
            
            this.border.clear();
            this.border.lineStyle(3, this.neonColor, 1);
            this.border.drawRoundedRect(0, 0, this.panelWidth, this.panelHeight, 12);
        }
    };

    UIMenu.prototype.setupKeyboard = function() {
        this.keyHandler = this.handleKeyDown.bind(this);
    };

    UIMenu.prototype.handleKeyDown = function(e) {
        if (!this.visible) return;
        
        switch(e.key) {
            case 'ArrowUp':
            case 'w':
            case 'W':
                this.selectPrevious();
                e.preventDefault();
                break;
            
            case 'ArrowDown':
            case 's':
            case 'S':
                this.selectNext();
                e.preventDefault();
                break;
            
            case 'Enter':
            case ' ':
                this.activateSelected();
                e.preventDefault();
                break;
        }
    };

    UIMenu.prototype.selectNext = function() {
        this.selectedIndex = (this.selectedIndex + 1) % this.buttons.length;
        this.updateSelection();
    };

    UIMenu.prototype.selectPrevious = function() {
        this.selectedIndex = (this.selectedIndex - 1 + this.buttons.length) % this.buttons.length;
        this.updateSelection();
    };

    UIMenu.prototype.updateSelection = function() {
        for (var i = 0; i < this.buttons.length; i++) {
            if (i === this.selectedIndex) {
                this.buttons[i].isHovered = true;
            } else {
                this.buttons[i].isHovered = false;
            }
            this.buttons[i].updateGraphics();
        }
    };

    UIMenu.prototype.activateSelected = function() {
        if (this.buttons[this.selectedIndex]) {
            this.buttons[this.selectedIndex].onPointerUp();
        }
    };

    UIMenu.prototype.enable = function() {
        this.visible = true;
        window.addEventListener('keydown', this.keyHandler);
    };

    UIMenu.prototype.disable = function() {
        this.visible = false;
        window.removeEventListener('keydown', this.keyHandler);
    };

    UIMenu.prototype.destroy = function() {
        this.disable();
        UIPanel.prototype.destroy.call(this, { children: true });
    };

    // ============================================================================
    // UI OVERLAY
    // ============================================================================

    /**
     * Overlay oscuro de pantalla completa
     * @constructor
     * @param {Object} config - Configuración del overlay
     */
    function UIOverlay(config) {
        PIXI.Container.call(this);
        
        this.config = config || {};
        this.screenWidth = this.config.width || 800;
        this.screenHeight = this.config.height || 600;
        this.alpha = this.config.alpha || 0.7;
        
        this.init();
    }

    UIOverlay.prototype = Object.create(PIXI.Container.prototype);
    UIOverlay.prototype.constructor = UIOverlay;

    UIOverlay.prototype.init = function() {
        this.background = new PIXI.Graphics();
        this.background.beginFill(0x000000, this.alpha);
        this.background.drawRect(0, 0, this.screenWidth, this.screenHeight);
        this.background.endFill();
        this.addChild(this.background);
        
        // Hacer clickeable para cerrar si está configurado
        if (this.config.closeOnClick) {
            this.background.eventMode = 'static';
            this.background.cursor = 'pointer';
            this.background.on('pointerdown', function() {
                if (this.config.onClose) {
                    this.config.onClose();
                }
            }.bind(this));
        }
    };

    UIOverlay.prototype.resize = function(width, height) {
        this.screenWidth = width;
        this.screenHeight = height;
        
        this.background.clear();
        this.background.beginFill(0x000000, this.alpha);
        this.background.drawRect(0, 0, this.screenWidth, this.screenHeight);
        this.background.endFill();
    };

    // ============================================================================
    // UI MANAGER
    // ============================================================================

    /**
     * Gestor de UI
     * @constructor
     * @param {PIXI.Application} app - Aplicación PixiJS
     */
    function UIManager(app) {
        this.app = app;
        this.container = new PIXI.Container();
        this.container.name = 'UILayer';
        this.container.zIndex = 1100; // Encima del HUD
        
        this.menus = {};
        this.activeMenu = null;
        this.overlay = null;
    }

    UIManager.prototype.createMenu = function(id, config) {
        var menu = new UIMenu(config);
        menu.visible = false;
        this.menus[id] = menu;
        this.container.addChild(menu);
        
        // Centrar menú
        menu.position.set(
            (this.app.screen.width - menu.panelWidth) / 2,
            (this.app.screen.height - menu.panelHeight) / 2
        );
        
        return menu;
    };

    UIManager.prototype.showMenu = function(id) {
        this.hideActiveMenu();
        
        if (this.menus[id]) {
            // Mostrar overlay
            if (!this.overlay) {
                this.overlay = new UIOverlay({
                    width: this.app.screen.width,
                    height: this.app.screen.height
                });
                this.container.addChildAt(this.overlay, 0);
            }
            this.overlay.visible = true;
            
            // Mostrar menú
            this.menus[id].enable();
            this.activeMenu = id;
        }
    };

    UIManager.prototype.hideMenu = function(id) {
        if (this.menus[id]) {
            this.menus[id].disable();
        }
        
        if (this.activeMenu === id) {
            this.activeMenu = null;
            if (this.overlay) {
                this.overlay.visible = false;
            }
        }
    };

    UIManager.prototype.hideActiveMenu = function() {
        if (this.activeMenu) {
            this.hideMenu(this.activeMenu);
        }
    };

    UIManager.prototype.toggleMenu = function(id) {
        if (this.activeMenu === id) {
            this.hideMenu(id);
        } else {
            this.showMenu(id);
        }
    };

    UIManager.prototype.getContainer = function() {
        return this.container;
    };

    UIManager.prototype.destroy = function() {
        for (var id in this.menus) {
            this.menus[id].destroy();
        }
        
        if (this.overlay) {
            this.overlay.destroy();
        }
        
        this.container.destroy({ children: true });
    };

    // ============================================================================
    // EXPORTS
    // ============================================================================

    window.UIButton = UIButton;
    window.UIPanel = UIPanel;
    window.UIMenu = UIMenu;
    window.UIOverlay = UIOverlay;
    window.UIManager = UIManager;

})(window);
