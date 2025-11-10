# 🧪 TESTING PIXIJS - INSTRUCCIONES

## 🚀 PROBAR EL SISTEMA PIXIJS

### Opción 1: Test Independiente (Recomendado)

1. **Abrir archivo de test:**
   ```
   android/app/src/main/assets/pixi-test.html
   ```

2. **Abrir en navegador:**
   - Hacer doble clic en `pixi-test.html`
   - O usar Live Server en VS Code

3. **Verificar resultados:**
   - ✅ Panel verde superior izquierdo con "Todos los tests pasados"
   - ✅ Fondo con grid neon animado
   - ✅ Sprite circular moviéndose en círculo
   - ✅ Efectos de glow neon visibles
   - ✅ FPS > 55

4. **Consola del navegador debe mostrar:**
   ```
   ✅ Test 1: PixiJS loaded
   ✅ Test 2: ArenaScene created
   ✅ Test 3: Textures generated
   ✅ Test 4: Layers configured
   ✅ Test 5: Effects applied
   ✅ Test 6: Player sprite added
   ✅ Test 7: Collision map loaded
   ✅ RendererAdapter initialized in pixi mode
   ✅ LayerManager initialized with 5 layers
   ✅ ArenaScene initialized
   ```

---

### Opción 2: Integración en el Juego

1. **Editar game.js:**

   Buscar la función de inicialización del canvas (aproximadamente línea 3500):

   ```javascript
   function initCanvas() {
       canvas = document.getElementById('gameCanvas');
       // ... código existente ...
       
       // AÑADIR AL FINAL:
       initPixiRenderer(); // <-- Añadir esta línea
   }
   ```

2. **Añadir función de inicialización PixiJS:**

   Copiar el código de `js/pixi/integration-example.js` al final de `game.js`:

   ```javascript
   // ============================================
   // PIXIJS INTEGRATION
   // ============================================
   let arenaScene = null;
   let pixiEnabled = false;

   function initPixiRenderer() {
       if (typeof PIXI === 'undefined') {
           console.warn('⚠️ PixiJS not loaded');
           return;
       }

       try {
           const canvas = document.getElementById('gameCanvas');
           const parent = canvas.parentElement;

           arenaScene = new ArenaScene({
               mode: 'pixi',
               width: screenWidth,
               height: screenHeight,
               parent: parent
           });

           // Generar texturas de prueba
           const bgTexture = TextureGenerator.createNeonGrid(2240, 2240, 0x00ffff);
           const bgSprite = new PIXI.Sprite(bgTexture);
           arenaScene.layerManager.addToLayer('background', bgSprite, 0);
           arenaScene.layerManager.setParallax('background', 0.3);

           pixiEnabled = true;
           console.log('✅ PixiJS Renderer initialized');

       } catch (error) {
           console.error('❌ Error initializing PixiJS:', error);
       }
   }
   ```

3. **Actualizar game loop:**

   Buscar la función `gameLoop()` y añadir:

   ```javascript
   function gameLoop() {
       // ... código existente ...

       // AÑADIR ANTES DEL requestAnimationFrame:
       if (pixiEnabled && arenaScene) {
           arenaScene.update(player.x, player.y);
       }

       requestAnimationFrame(gameLoop);
   }
   ```

4. **Abrir index.html y jugar:**
   - Verificar en consola: "✅ PixiJS Renderer initialized"
   - El fondo debe mostrar grid neon
   - El parallax debe activarse al mover al jugador

---

## 🔍 QUÉ BUSCAR

### ✅ Señales de Éxito

- **Consola limpia:** Sin errores rojos
- **FPS alto:** > 55 FPS en móvil, 60 en desktop
- **Parallax visible:** Fondo se mueve más lento que jugador
- **Efectos neon:** Glow visible en paredes y sprites
- **Memoria estable:** No crece con el tiempo

### ❌ Problemas Comunes

#### Error: "PIXI is not defined"
**Solución:** PixiJS CDN no cargó. Verificar conexión a internet.

#### Error: "Cannot read property 'addChild' of undefined"
**Solución:** ArenaScene no inicializado correctamente. Verificar orden de carga de scripts.

#### FPS bajo (< 30)
**Solución:** Reducir calidad de filtros:
```javascript
glowFilter.quality = 0.3; // En lugar de 0.5
```

#### Pantalla negra
**Solución:** Texturas no cargadas. Usar `TextureGenerator` para generar texturas procedurales.

---

## 📊 MÉTRICAS DE RENDIMIENTO

### Abrir DevTools (F12)

1. **Performance Tab:**
   - Iniciar grabación
   - Mover jugador durante 5 segundos
   - Detener grabación
   - Verificar: FPS constante, sin bajones

2. **Memory Tab:**
   - Tomar snapshot inicial
   - Jugar 1 minuto
   - Tomar snapshot final
   - Verificar: Diferencia < 10 MB

3. **Console Tab:**
   - Ejecutar: `console.log(arenaScene)`
   - Verificar estructura completa

---

## 🎨 PROBAR EFECTOS VISUALES

### Test de Parallax
```javascript
// En consola del navegador:
arenaScene.layerManager.setParallax('background', 0.1); // Muy lento
arenaScene.layerManager.setParallax('background', 0.9); // Casi igual
```

### Test de Glow
```javascript
// Aumentar intensidad:
const layer = arenaScene.layerManager.getLayer('foreground');
const glow = new PIXI.filters.GlowFilter({ distance: 30, outerStrength: 4 });
layer.filters = [glow];
```

### Test de Blur
```javascript
// Desenfocar fondo:
const bg = arenaScene.layerManager.getLayer('background');
const blur = new PIXI.filters.BlurFilter();
blur.blur = 5;
bg.filters = [blur];
```

---

## 🐛 DEBUG AVANZADO

### Mostrar bounds de colisión
```javascript
// Crear graphics overlay
const graphics = new PIXI.Graphics();
arenaScene.collisionMap.zones.forEach(zone => {
    graphics.lineStyle(2, 0xff0000, 0.5);
    graphics.drawRect(zone.x, zone.y, zone.width, zone.height);
});
arenaScene.layerManager.addToLayer('effects', graphics);
```

### Mostrar posición de cámara
```javascript
setInterval(() => {
    console.log('Camera:', arenaScene.camera.x, arenaScene.camera.y);
}, 1000);
```

### Ver todas las capas
```javascript
Object.keys(arenaScene.layerManager.layers).forEach(name => {
    const layer = arenaScene.layerManager.layers[name];
    console.log(name, '- Children:', layer.container.children.length);
});
```

---

## 📱 TESTING EN MÓVIL

### Android (usando APK)

1. **Compilar con PixiJS:**
   ```bash
   cd android
   .\gradlew assembleDebug
   ```

2. **Instalar en dispositivo:**
   ```bash
   adb install app/build/outputs/apk/debug/app-debug.apk
   ```

3. **Monitorear logs:**
   ```bash
   adb logcat | findstr "PixiJS"
   ```

4. **Verificar:**
   - FPS > 55 constante
   - Sin lag al mover joystick
   - Efectos visibles
   - Sin crashes

### Chrome Remote Debugging

1. **Conectar dispositivo Android**
2. **Abrir chrome://inspect en PC**
3. **Inspeccionar WebView del juego**
4. **Ver consola y performance**

---

## ✅ CHECKLIST DE VALIDACIÓN

- [ ] PixiJS carga sin errores
- [ ] ArenaScene se crea correctamente
- [ ] Capas visibles (background, midground, foreground)
- [ ] Parallax funciona al mover jugador
- [ ] Efectos neon (glow) visibles
- [ ] FPS > 55 en móvil, 60 en desktop
- [ ] Memoria estable (< 100 MB)
- [ ] Sin errores en consola
- [ ] Colisiones funcionan
- [ ] Resize funciona (cambiar tamaño de ventana)

---

## 🎯 PRÓXIMO PASO

Una vez validado el sistema PixiJS:

1. **Crear texturas PNG reales** (sustituir procedurales)
2. **Migrar entidades** (player, enemies, bullets a PIXI.Sprite)
3. **Optimizar filtros** según dispositivo
4. **Añadir partículas** con @pixi/particle-emitter

---

## 📞 SOPORTE

Si encuentras problemas:

1. **Revisar consola del navegador** (F12)
2. **Verificar orden de carga** de scripts en index.html
3. **Comprobar que PixiJS CDN** esté accesible
4. **Probar pixi-test.html** primero (test aislado)

---

**¡Listo para probar!** 🚀
