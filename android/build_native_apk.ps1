# ============================================
# Script de Build para Android Nativo
# Neon Survivor - APK Firmado
# ============================================

Write-Host "`n========================================" -ForegroundColor Cyan
Write-Host "  NEON SURVIVOR - ANDROID NATIVE BUILD" -ForegroundColor Cyan
Write-Host "========================================`n" -ForegroundColor Cyan

# === Configuración ===
$ProjectRoot = "c:\Users\LuisCastellanoGuzman\neon_survivor"
$AndroidDir = Join-Path $ProjectRoot "android"
$Keystore = Join-Path $AndroidDir "key_store\keystore"  # KEYSTORE OFICIAL - NO CAMBIAR
$ApkSigner = "C:\Users\LuisCastellanoGuzman\AppData\Local\Android\sdk\build-tools\35.0.0\apksigner.bat"

$env:JAVA_HOME = "C:\Program Files\Java\jdk-17"
$env:ANDROID_HOME = "C:\Users\LuisCastellanoGuzman\AppData\Local\Android\sdk"
$env:PATH = "$env:JAVA_HOME\bin;$env:ANDROID_HOME\platform-tools;$env:ANDROID_HOME\build-tools\35.0.0;$env:PATH"

Set-Location $AndroidDir

# === Paso 1: Limpiar build anterior ===
Write-Host "[1/5] 🧹 Limpiando builds anteriores..." -ForegroundColor Yellow
if (Test-Path "app\build") {
    Remove-Item -Recurse -Force "app\build"
}
if (Test-Path "build") {
    Remove-Item -Recurse -Force "build"
}

# === Paso 2: Descargar Gradle Wrapper si no existe ===
if (-not (Test-Path "gradlew.bat")) {
    Write-Host "[2/5] 📥 Descargando Gradle Wrapper..." -ForegroundColor Yellow

    # Crear gradlew.bat
    @'
@rem
@rem Copyright 2015 the original author or authors.
@rem
@rem Licensed under the Apache License, Version 2.0 (the "License");
@rem you may not use this file except in compliance with the License.
@rem You may obtain a copy of the License at
@rem
@rem      https://www.apache.org/licenses/LICENSE-2.0
@rem
@rem Unless required by applicable law or agreed to in writing, software
@rem distributed under the License is distributed on an "AS IS" BASIS,
@rem WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
@rem See the License for the specific language governing permissions and
@rem limitations under the License.
@rem

@if "%DEBUG%" == "" @echo off
@rem ##########################################################################
@rem
@rem  Gradle startup script for Windows
@rem
@rem ##########################################################################

@rem Set local scope for the variables with windows NT shell
if "%OS%"=="Windows_NT" setlocal

set DIRNAME=%~dp0
if "%DIRNAME%" == "" set DIRNAME=.
set APP_BASE_NAME=%~n0
set APP_HOME=%DIRNAME%

@rem Resolve any "." and ".." in APP_HOME to make it shorter.
for %%i in ("%APP_HOME%") do set APP_HOME=%%~fi

@rem Add default JVM options here. You can also use JAVA_OPTS and GRADLE_OPTS to pass JVM options to this script.
set DEFAULT_JVM_OPTS="-Xmx64m" "-Xms64m"

@rem Find java.exe
if defined JAVA_HOME goto findJavaFromJavaHome

set JAVA_EXE=java.exe
%JAVA_EXE% -version >NUL 2>&1
if "%ERRORLEVEL%" == "0" goto execute

echo.
echo ERROR: JAVA_HOME is not set and no 'java' command could be found in your PATH.
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:findJavaFromJavaHome
set JAVA_HOME=%JAVA_HOME:"=%
set JAVA_EXE=%JAVA_HOME%/bin/java.exe

if exist "%JAVA_EXE%" goto execute

echo.
echo ERROR: JAVA_HOME is set to an invalid directory: %JAVA_HOME%
echo.
echo Please set the JAVA_HOME variable in your environment to match the
echo location of your Java installation.

goto fail

:execute
@rem Setup the command line

set CLASSPATH=%APP_HOME%\gradle\wrapper\gradle-wrapper.jar


@rem Execute Gradle
"%JAVA_EXE%" %DEFAULT_JVM_OPTS% %JAVA_OPTS% %GRADLE_OPTS% "-Dorg.gradle.appname=%APP_BASE_NAME%" -classpath "%CLASSPATH%" org.gradle.wrapper.GradleWrapperMain %*

:end
@rem End local scope for the variables with windows NT shell
if "%ERRORLEVEL%"=="0" goto mainEnd

:fail
rem Set variable GRADLE_EXIT_CONSOLE if you need the _script_ return code instead of
rem the _cmd.exe /c_ return code!
if  not "" == "%GRADLE_EXIT_CONSOLE%" exit 1
exit /b 1

:mainEnd
if "%OS%"=="Windows_NT" endlocal

:omega
'@ | Out-File -FilePath "gradlew.bat" -Encoding ASCII

    # Descargar gradle-wrapper.jar
    New-Item -ItemType Directory -Force -Path "gradle\wrapper" | Out-Null
    Invoke-WebRequest -Uri "https://raw.githubusercontent.com/gradle/gradle/master/gradle/wrapper/gradle-wrapper.jar" -OutFile "gradle\wrapper\gradle-wrapper.jar"
} else {
    Write-Host "[2/5] ✅ Gradle Wrapper ya existe" -ForegroundColor Green
}

# === Paso 3: Compilar APK Release sin firmar ===
Write-Host "`n[3/5] 🔨 Compilando APK Release..." -ForegroundColor Yellow

& ".\gradlew.bat" clean assembleRelease

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ ERROR: La compilación falló" -ForegroundColor Red
    exit 1
}

# === Paso 4: Verificar APK generado ===
$UnsignedApk = "app\build\outputs\apk\release\app-release-unsigned.apk"

if (-not (Test-Path $UnsignedApk)) {
    Write-Host "`n❌ ERROR: No se encontró el APK compilado" -ForegroundColor Red
    exit 1
}

Write-Host "`n✅ APK compilado exitosamente" -ForegroundColor Green

# === Paso 5: Firmar APK ===
Write-Host "`n[4/5] 🔐 Firmando APK con apksigner..." -ForegroundColor Yellow

$OutputApk = Join-Path $ProjectRoot "NeonSurvivor-Native-v1-SIGNED.apk"

& $ApkSigner sign `
    --ks $Keystore `
    --ks-key-alias neon-survivor `
    --ks-pass pass:NeonSurvivor2025! `
    --key-pass pass:NeonSurvivor2025! `
    --out $OutputApk `
    $UnsignedApk

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ ERROR: La firma del APK falló" -ForegroundColor Red
    exit 1
}

# === Paso 6: Verificar firma ===
Write-Host "`n[5/5] ✅ Verificando firma del APK..." -ForegroundColor Yellow

& $ApkSigner verify --verbose $OutputApk

if ($LASTEXITCODE -ne 0) {
    Write-Host "`n❌ ERROR: La verificación de firma falló" -ForegroundColor Red
    exit 1
}

# === Resumen ===
Write-Host "`n========================================" -ForegroundColor Green
Write-Host "  ✅ APK GENERADO EXITOSAMENTE!" -ForegroundColor Green
Write-Host "========================================" -ForegroundColor Green

$ApkInfo = Get-Item $OutputApk
Write-Host "`n📱 Información del APK:"
Write-Host "   Archivo: $($ApkInfo.Name)" -ForegroundColor Cyan
Write-Host "   Tamaño: $([math]::Round($ApkInfo.Length/1MB, 2)) MB" -ForegroundColor Cyan
Write-Host "   Ubicación: $($ApkInfo.FullName)" -ForegroundColor Cyan
Write-Host "   Tipo: Android Nativo (WebView)" -ForegroundColor Cyan
Write-Host "   Estado: FIRMADO (v2/v3) ✅" -ForegroundColor Green

Write-Host "`n📲 Para instalar en dispositivo:" -ForegroundColor Yellow
Write-Host "   adb install `"$($ApkInfo.Name)`"`n" -ForegroundColor Cyan

Set-Location $ProjectRoot
