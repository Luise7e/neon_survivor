# 🔐 KEYSTORE OFICIAL - NEON SURVIVOR

## ⚠️ INFORMACIÓN CRÍTICA

**Este es el ÚNICO keystore que debe usarse para firmar la aplicación.**

### 📍 Ubicación
```
c:\Users\LuisCastellanoGuzman\neon_survivor\keystore
```

### 🔑 Credenciales
- **Alias**: `neon-survivor`
- **Store Password**: `NeonSurvivor2025!`
- **Key Password**: `NeonSurvivor2025!`
- **Algorithm**: RSA 2048 bits
- **Validity**: 10,000 días (27.4 años)
- **Signature**: SHA256withRSA

### 🆔 Huellas Digitales (Fingerprints)

#### SHA1 (para Firebase Console)
```
F0:2D:95:F9:34:15:CC:BA:C6:94:D2:8B:D0:24:D0:66:3E:2C:01:61
```

#### SHA256
```
28:CC:55:CF:3D:DF:B7:02:3C:56:2B:09:C5:8F:89:D5:B9:AF:C7:9F:6A:E6:91:C2:13:B3:66:23:9C:C2:28:EF
```

### 📋 Información del Certificado
```
Distinguished Name (DN):
CN=Neon Survivor
OU=Game Dev
O=Luise7e
L=Unknown
ST=Unknown
C=ES
```

### 🚀 Uso en Build

El script `android/build_native_apk.ps1` está configurado para usar automáticamente este keystore:

```powershell
$Keystore = Join-Path $ProjectRoot "keystore"
```

### ⚙️ Configuración Firebase

**IMPORTANTE**: Este SHA1 debe estar registrado en Firebase Console para que Google Sign-In funcione:

1. Ve a: https://console.firebase.google.com/
2. Selecciona proyecto: **neon-survivor-fe41c**
3. Ve a: **Project Settings** → **General** → **Your apps**
4. Selecciona la app Android: `com.luise7e.neonsurvivor`
5. En **SHA certificate fingerprints**, agrega:
   ```
   F0:2D:95:F9:34:15:CC:BA:C6:94:D2:8B:D0:24:D0:66:3E:2C:01:61
   ```
6. Descarga el nuevo `google-services.json`
7. Reemplázalo en: `android/app/google-services.json`

### 🛡️ Seguridad

- ❌ **NO subir este keystore a Git** (ya está en `.gitignore`)
- ❌ **NO compartir las contraseñas públicamente**
- ❌ **NO crear keystores nuevos** sin autorización
- ✅ **Hacer backup en ubicación segura**
- ✅ **Usar SIEMPRE este keystore para releases**

### 🔄 Verificar Keystore

Para verificar el keystore en cualquier momento:

```powershell
keytool -list -v -keystore keystore -storepass "NeonSurvivor2025!"
```

### 📅 Creación
- **Fecha**: 31 de Octubre de 2025
- **Válido hasta**: ~2052

---

## 🚨 REGLAS IMPORTANTES

1. **ESTE ES EL KEYSTORE OFICIAL** - No crear otros
2. **SIEMPRE usar este keystore** para firmar APKs de producción
3. **El SHA1 de este keystore** debe estar en Firebase Console
4. **Si se pierde este keystore**, NO se podrán publicar updates en Play Store
5. **Hacer backup regular** de este archivo

---

*Última actualización: 31/10/2025*
