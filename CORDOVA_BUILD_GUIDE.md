# Guía de Compilación de Neon Survivor para Android

**Proyecto:** Neon Survivor Arena
**Fecha de Creación:** 20 de Octubre de 2025
**Plataforma:** Apache Cordova 14.0.1 para Android
**Estado:** ✅ Funcional

---

## 📋 Tabla de Contenidos

1. [Resumen del Proyecto](#resumen-del-proyecto)
2. [Requisitos del Sistema](#requisitos-del-sistema)
3. [Problemas Encontrados y Soluciones](#problemas-encontrados-y-soluciones)
4. [Proceso de Compilación Exitoso](#proceso-de-compilación-exitoso)
5. [Estructura del Proyecto](#estructura-del-proyecto)
6. [Comandos Útiles](#comandos-útiles)
7. [Troubleshooting](#troubleshooting)

---

## 🎮 Resumen del Proyecto

Neon Survivor Arena es un juego web HTML5 que ha sido portado a Android usando Apache Cordova. El juego incluye:

- **Motor:** HTML5 Canvas + JavaScript ES6+
- **Controles Móviles:** Joystick virtual y botón de habilidad
- **Mecánica de Disparo:** Tap-to-shoot (tocar en cualquier parte de la pantalla)
- **Responsive Design:** Se adapta a diferentes tamaños de pantalla

### Modificaciones Realizadas

1. **Eliminación del botón de disparo móvil:** Se removió el botón dedicado de disparo
2. **Implementación de tap-to-shoot:** El jugador dispara tocando cualquier lugar de la pantalla
3. **Preservación del botón de habilidad:** Se mantuvo el botón de habilidad especial

---

## 💻 Requisitos del Sistema

### Software Necesario

| Herramienta | Versión | Ruta de Instalación |
|-------------|---------|---------------------|
| **Java JDK** | 17 | `C:\Program Files\Java\jdk-17` |
| **Android SDK** | Latest | `C:\Users\LuisCastellanoGuzman\AppData\Local\Android\sdk` |
| **Android Build Tools** | 35.0.0 y 36.1.0 | `%ANDROID_HOME%\build-tools\` |
| **Gradle** | 8.13 / 9.1.0 | Incluido en Cordova |
| **Node.js** | Latest LTS | Sistema |
| **Cordova CLI** | Latest | `npm install -g cordova` |
| **Apache Cordova Android** | 14.0.1 | Gestionado por Cordova |

### Configuración de Variables de Entorno

```powershell
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "C:\Users\LuisCastellanoGuzman\AppData\Local\Android\sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\35.0.0;$env:PATH"
```

---

## 🐛 Problemas Encontrados y Soluciones

### **Problema 1: Incompatibilidad de Versión de JDK**

**Error:**
```
Unsupported class file major version 69
```

**Causa:**
Gradle 8.13 no es compatible con JDK 25 (class file major version 69). Cordova Android 14.0.1 requiere JDK 17.

**Solución:**
1. Instalar JDK 17
2. Configurar `gradle.properties`:
   ```properties
   org.gradle.java.home=C:\\Program Files\\Java\\jdk-17
   ```
3. Establecer `JAVA_HOME` antes de cada compilación:
   ```powershell
   $env:JAVA_HOME="C:\Program Files\Java\jdk-17"
   ```

**Archivos Modificados:**
- `neon-survivor/platforms/android/gradle.properties`

---

### **Problema 2: Build Tools No Encontradas**

**Error:**
```
No installed build tools found. Install the Android build tools version 35.0.0 or higher.
```

**Causa:**
Cordova buscaba específicamente la versión 35.0.0 de build-tools, pero solo estaba instalada la 36.1.0.

**Solución Temporal:**
```powershell
# Copiar la versión 36.1.0 como 35.0.0
Copy-Item "$env:ANDROID_HOME\build-tools\36.1.0" "$env:ANDROID_HOME\build-tools\35.0.0" -Recurse
```

**Solución Permanente:**
- Actualizar `cdv-gradle-config.json` para usar la versión correcta:
  ```json
  {
    "MIN_BUILD_TOOLS_VERSION": "36.0.0",
    "COMPILE_SDK_VERSION": 35
  }
  ```

**Archivos Modificados:**
- `neon-survivor/platforms/android/cdv-gradle-config.json`

---

### **Problema 3: Error de Manifest XML Parse**

**Error:**
```
ParseError at [row,col]:[12,60]
Message: The prefix "android" for element "android:gradlePluginVersion" is not bound.
```

**Causa:**
Sintaxis XML inválida en `config.xml`. Se intentó usar `<edit-config>` con atributos no soportados.

**Solución:**
Eliminar el bloque `<edit-config>` problemático del `config.xml`:

```xml
<!-- ELIMINAR ESTO -->
<edit-config file="app/build.gradle" target="/*" mode="overwrite">
    <preference name="android-targetSdkVersion" value="35" />
    <preference name="android-minSdkVersion" value="24" />
</edit-config>
```

Usar en su lugar solo las preferencias estándar:
```xml
<preference name="android-targetSdkVersion" value="35" />
<preference name="android-minSdkVersion" value="24" />
```

**Archivos Modificados:**
- `neon-survivor/config.xml`

---

### **Problema 4: Error de Instalación - No Certificates**

**Error:**
```
INSTALL_PARSE_FAILED_NO_CERTIFICATES: Scanning Failed.: no signature found in package of version 2 or newer
```

**Causa:**
Usar `jarsigner` solo genera firmas v1 (JAR signing), pero Android 7.0+ requiere firmas v2/v3 (APK Signature Scheme).

**Solución Incorrecta:**
```powershell
# ❌ NO USAR - Solo genera firma v1
jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 \
  -keystore my-release-key.keystore app-release.apk my-key-alias
```

**Solución Correcta:**
```powershell
# ✅ USAR - Genera firmas v2 y v3
apksigner sign --ks my-release-key.keystore \
  --ks-key-alias my-key-alias \
  --ks-pass pass:password123 \
  --key-pass pass:password123 \
  --out NeonSurvivor-FINAL.apk \
  app-release-unsigned.apk
```

**Verificación:**
```powershell
apksigner verify --verbose NeonSurvivor-FINAL.apk
```

**Salida Esperada:**
```
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): true
```

---

### **Problema 5: Error de Instalación - Manifest Malformed**

**Error:**
```
error -124 INSTALL_PARSE_FAILED_MANIFEST_MALFORMED
Targeting R+ (version 30 and above) requires the resources.arsc of installed APKs to be stored uncompressed
```

**Causa:**
El `targetSdkVersion` no estaba configurado correctamente para Android 11+ (API 30+).

**Solución:**
1. Asegurar que `config.xml` tenga:
   ```xml
   <preference name="android-targetSdkVersion" value="35" />
   ```

2. Regenerar la plataforma Android:
   ```powershell
   cordova platform remove android
   cordova platform add android
   ```

3. Verificar que `AndroidManifest.xml` generado tenga:
   ```xml
   <uses-sdk android:minSdkVersion="24" android:targetSdkVersion="35" />
   ```

**Archivos Modificados:**
- `neon-survivor/config.xml`
- `neon-survivor/platforms/android/app/src/main/AndroidManifest.xml` (generado automáticamente)

---

## ✅ Proceso de Compilación Exitoso

### Paso 1: Preparar el Entorno

```powershell
# Establecer variables de entorno
$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "C:\Users\LuisCastellanoGuzman\AppData\Local\Android\sdk"
$env:PATH = "C:\Program Files (x86)\Gradle\bin;$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:PATH"

# Navegar al proyecto Cordova
cd c:\Users\LuisCastellanoGuzman\neon_survivor\neon-survivor
```

### Paso 2: Limpiar y Regenerar Plataforma (Si es necesario)

```powershell
# Solo si hay problemas con configuración anterior
cordova platform remove android
cordova platform add android
```

### Paso 3: Compilar APK Sin Firmar

```powershell
# Compilar directamente con Gradle
cd platforms\android
cmd /c gradlew.bat assembleRelease
```

**Salida esperada:**
```
BUILD SUCCESSFUL in 8s
82 actionable tasks: 30 executed, 52 up-to-date
```

**APK generado en:**
```
platforms\android\app\build\outputs\apk\release\app-release-unsigned.apk
```

### Paso 4: Firmar el APK

```powershell
# Navegar a la carpeta del APK
cd platforms\android\app\build\outputs\apk\release

# Firmar con apksigner (NO con jarsigner)
$env:ANDROID_HOME = "C:\Users\LuisCastellanoGuzman\AppData\Local\Android\sdk"
& "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" sign `
  --ks "C:\Users\LuisCastellanoGuzman\neon_survivor\my-release-key.keystore" `
  --ks-key-alias my-key-alias `
  --ks-pass pass:password123 `
  --key-pass pass:password123 `
  --out "C:\Users\LuisCastellanoGuzman\neon_survivor\NeonSurvivor-FINAL.apk" `
  app-release-unsigned.apk
```

### Paso 5: Verificar la Firma

```powershell
& "$env:ANDROID_HOME\build-tools\35.0.0\apksigner.bat" verify --verbose `
  "C:\Users\LuisCastellanoGuzman\neon_survivor\NeonSurvivor-FINAL.apk"
```

**Salida esperada:**
```
Verifies
Verified using v2 scheme (APK Signature Scheme v2): true
Verified using v3 scheme (APK Signature Scheme v3): true
Number of signers: 1
```

### Paso 6: Instalar en Dispositivo/Emulador

```powershell
# Opción 1: Instalar con adb
adb install C:\Users\LuisCastellanoGuzman\neon_survivor\NeonSurvivor-FINAL.apk

# Opción 2: Arrastrar el APK al emulador de Android Studio
```

---

## 📁 Estructura del Proyecto

```
neon_survivor/
├── neon-survivor/                          # Proyecto Cordova
│   ├── config.xml                          # Configuración de Cordova
│   ├── package.json                        # Dependencias Node.js
│   ├── platforms/
│   │   └── android/                        # Plataforma Android generada
│   │       ├── gradle.properties           # Configuración de Gradle (JDK)
│   │       ├── cdv-gradle-config.json      # Versiones de build tools
│   │       └── app/
│   │           └── build/
│   │               └── outputs/
│   │                   └── apk/
│   │                       └── release/
│   │                           └── app-release-unsigned.apk
│   ├── www/                                # Archivos web del juego
│   │   ├── index.html                      # Página principal
│   │   ├── game.js                         # Lógica del juego
│   │   ├── css/
│   │   │   └── index.css                   # Estilos móviles
│   │   └── js/
│   │       └── index.js                    # Inicialización Cordova
│   └── plugins/                            # Plugins de Cordova
│
├── my-release-key.keystore                 # Keystore para firmar APKs
├── NeonSurvivor-v4.apk                     # APK final firmado (USAR ESTE)
├── CORDOVA_BUILD_GUIDE.md                  # Este documento
└── README.md                               # Documentación original

```

---

## 🔧 Comandos Útiles

### Gestión de Plataforma

```powershell
# Listar plataformas instaladas
cordova platform list

# Agregar plataforma Android
cordova platform add android

# Remover plataforma Android
cordova platform remove android

# Actualizar plataforma Android
cordova platform update android
```

### Compilación

```powershell
# Debug build (sin firmar)
cordova build android

# Release build (requiere firma)
cordova build android --release

# Compilación directa con Gradle
cd platforms\android
gradlew.bat assembleRelease
gradlew.bat assembleDebug
```

### Firma de APKs

```powershell
# Crear keystore (solo primera vez)
keytool -genkey -v -keystore my-release-key.keystore `
  -alias my-key-alias `
  -keyalg RSA `
  -keysize 2048 `
  -validity 10000

# Firmar APK con apksigner
apksigner sign --ks my-release-key.keystore `
  --ks-key-alias my-key-alias `
  --out signed.apk unsigned.apk

# Verificar firma
apksigner verify --verbose signed.apk
```

### Instalación y Testing

```powershell
# Listar dispositivos conectados
adb devices

# Instalar APK
adb install path\to\app.apk

# Reinstalar APK (mantiene datos)
adb install -r path\to\app.apk

# Desinstalar app
adb uninstall com.tuempresa.neonsurvivor

# Ver logs en tiempo real
adb logcat
```

---

## 🔍 Troubleshooting

### El build falla con error de JDK

**Síntoma:**
```
Unsupported class file major version XX
```

**Solución:**
1. Verificar versión de Java:
   ```powershell
   java -version
   ```
2. Asegurar que `JAVA_HOME` apunta a JDK 17:
   ```powershell
   $env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
   ```
3. Verificar `gradle.properties` tiene la línea correcta

### El APK no se instala: "INSTALL_PARSE_FAILED"

**Solución:**
- ✅ Usar `apksigner` en lugar de `jarsigner`
- ✅ Verificar que las firmas v2/v3 estén presentes
- ✅ Asegurar que `targetSdkVersion` sea 35 o superior

### Build Tools no encontradas

**Solución:**
1. Instalar build-tools 35.0.0:
   ```powershell
   sdkmanager "build-tools;35.0.0"
   ```
2. O copiar versión más nueva como 35.0.0

### Error "cordova: command not found"

**Solución:**
```powershell
npm install -g cordova
```

### Gradle Daemon usa mucha memoria

**Solución:**
Agregar a `gradle.properties`:
```properties
org.gradle.jvmargs=-Xmx2048m -XX:MaxMetaspaceSize=512m
org.gradle.daemon=true
org.gradle.parallel=true
```

---

## 📝 Notas Adicionales

### Información del Keystore

- **Ubicación:** `C:\Users\LuisCastellanoGuzman\neon_survivor\my-release-key.keystore`
- **Alias:** `my-key-alias`
- **Contraseña:** `password123`
- **Validez:** 28 años (hasta 2053-03-07)
- **Algoritmo:** SHA256withRSA (2048-bit)

### Configuración del Proyecto

**config.xml - Preferencias Clave:**
```xml
<preference name="android-targetSdkVersion" value="35" />
<preference name="android-minSdkVersion" value="24" />
```

**Package ID:**
```xml
<widget id="com.tuempresa.neonsurvivor" version="1.0.0">
```

### Versiones Compatibles Verificadas

| Componente | Versión | Estado |
|------------|---------|--------|
| Cordova CLI | 14.0.1 | ✅ Funciona |
| cordova-android | 14.0.1 | ✅ Funciona |
| JDK | 17 | ✅ Funciona |
| JDK | 25 | ❌ No compatible |
| Gradle | 8.13 | ✅ Funciona |
| Android SDK | 35 | ✅ Funciona |
| Build Tools | 35.0.0 | ✅ Funciona |
| Build Tools | 36.1.0 | ✅ Funciona |

---

## 🎯 Checklist para Futuras Compilaciones

Antes de compilar, verificar:

- [ ] `JAVA_HOME` apunta a JDK 17
- [ ] `ANDROID_HOME` está configurado correctamente
- [ ] Build tools 35.0.0 están instalados
- [ ] `config.xml` tiene `targetSdkVersion` correcto
- [ ] `gradle.properties` tiene `org.gradle.java.home` configurado
- [ ] Keystore está disponible y accesible

Para compilar:

- [ ] Limpiar plataforma si hay cambios de configuración
- [ ] Compilar con `gradlew.bat assembleRelease`
- [ ] Firmar con `apksigner` (NO jarsigner)
- [ ] Verificar firma con `apksigner verify`
- [ ] Probar instalación en emulador

---

## 📞 Contacto y Recursos

### Documentación Oficial

- [Apache Cordova Docs](https://cordova.apache.org/docs/en/latest/)
- [Cordova Android Platform Guide](https://cordova.apache.org/docs/en/latest/guide/platforms/android/)
- [Android Developer Guides](https://developer.android.com/guide)

### Comandos de Ayuda

```powershell
cordova --help
cordova build --help
apksigner --help
```

---

**Última actualización:** 20 de Octubre de 2025
**Autor:** GitHub Copilot
**Versión del Documento:** 1.0
