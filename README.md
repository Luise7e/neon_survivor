
# 🕹️ NEON SURVIVOR ARENA - Universal Edition

> **Battle royale roguelike optimizado para PC, móvil y Android APK**

![Platform](https://img.shields.io/badge/Platform-Universal-00ffff)
![Status](https://img.shields.io/badge/Status-Production-00ff00)
![Version](https://img.shields.io/badge/Version-2.0.0-ff00ff)

---

## 🚀 Compilación y Publicación Android

### Proceso Real de Compilación (Cordova 14.0.1)

1. **Configura variables de entorno:**
  ```powershell
  $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
  $env:ANDROID_HOME = "C:\Users\LuisCastellanoGuzman\AppData\Local\Android\sdk"
  $env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\35.0.0;$env:PATH"
  ```
2. **Navega al proyecto Cordova:**
  ```powershell
  cd c:\Users\LuisCastellanoGuzman\neon_survivor\neon-survivor
  ```
3. **Regenera la plataforma Android si hay cambios:**
  ```powershell
  cordova platform remove android
  cordova platform add android
  ```
4. **Compila el APK sin firmar:**
  ```powershell
  cd platforms\android
  cmd /c gradlew.bat assembleRelease
  ```
5. **Firma el APK con apksigner (NO jarsigner):**
  ```powershell
  cd app\build\outputs\apk\release
  & "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" sign `
    --ks "C:\Users\LuisCastellanoGuzman\neon_survivor\my-release-key.keystore" `
    --ks-key-alias my-key-alias `
    --ks-pass pass:password123 `
    --key-pass pass:password123 `
    --out "C:\Users\LuisCastellanoGuzman\neon_survivor\NeonSurvivor-v5.apk" `
    app-release-unsigned.apk
  ```
6. **Verifica la firma:**
  ```powershell
  & "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" verify --verbose "C:\Users\LuisCastellanoGuzman\neon_survivor\NeonSurvivor-v5.apk"
  ```
7. **Instala en emulador/dispositivo:**
  ```powershell
  adb install C:\Users\LuisCastellanoGuzman\neon_survivor\NeonSurvivor-v5.apk
  ```

---

## 🛠️ Scripts Automáticos

- **build_android.ps1**: Script PowerShell para compilar, firmar y verificar el APK automáticamente.
- **build_android.bat**: Script por lotes para automatizar todo el proceso en Windows.

Ambos scripts generan el APK final en:
```
c:\Users\LuisCastellanoGuzman\neon_survivor\NeonSurvivor-v5.apk
```

---

## 🐞 Problemas Resueltos y Lecciones Aprendidas

- Usar **JDK 17** (NO versiones superiores)
- Instalar **build-tools 35.0.0** (o copiar versión superior como 35.0.0)
- Eliminar bloques `<edit-config>` problemáticos en `config.xml`
- Usar **apksigner** para firmas v2/v3 (NO jarsigner)
- Regenerar plataforma tras cambios en configuración
- Documentar contraseñas y rutas de keystore

Ver historial completo en `BUILD_HISTORY.md` y guía detallada en `CORDOVA_BUILD_GUIDE.md`.

---

## 📦 Estructura del Proyecto

```
neon_survivor/
├── neon-survivor/                          # Proyecto Cordova
│   ├── config.xml                          # Configuración de Cordova
│   ├── platforms/
│   │   └── android/
│   │       └── app/
│   │           └── build/
│   │               └── outputs/
│   │                   └── apk/
│   │                       └── release/
│   │                           └── app-release-unsigned.apk
│   ├── www/                                # Archivos web del juego
│   │   ├── index.html                      # Página principal
│   │   ├── game.js                         # Lógica del juego
│   └── plugins/                            # Plugins de Cordova
├── my-release-key.keystore                 # Keystore para firmar APKs
├── NeonSurvivor-v5.apk                     # APK final firmado
├── build_android.ps1                       # Script PowerShell
├── build_android.bat                       # Script por lotes
├── CORDOVA_BUILD_GUIDE.md                  # Guía completa
├── QUICK_BUILD.md                          # Guía rápida
├── BUILD_HISTORY.md                        # Historial de compilaciones
└── README.md                               # Documentación principal
```

---

## 🎮 Características del Juego

- **Motor:** HTML5 Canvas + JavaScript ES6+
- **Controles:** WASD/mouse (PC), joystick virtual/tap-to-shoot (móvil)
- **Responsive:** UI adaptativa para cualquier pantalla
- **Dificultad progresiva:** Enemigos y oleadas escalables
- **Efectos visuales:** Estética neon cyberpunk
- **PWA Ready:** Instalación en dispositivos móviles

---

## 📋 Checklist de Testing

- [x] Chrome/Edge/Firefox (PC)
- [x] Chrome/Safari (Android/iOS)
- [x] Emulador Android
- [x] Instalación APK en dispositivo real
- [x] Controles táctiles y rendimiento

---

## 👤 Autor

**Luis Castellano Guzman**

---

## 📄 Licencia

Proyecto open-source para uso personal y comercial.

---

**⚡ Sobrevive al apocalipsis neon en cualquier dispositivo! ⚡**