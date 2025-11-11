// ===================================
// NEON SURVIVOR ARENA - MOBILE EDITION
// Mobile: Dual Joystick Controls (Wild Rift Style)
// ===================================

// ===================================
// ADMOB INTEGRATION (Native Android)
// ===================================
let admobReady = false;
let lastBossWaveCompleted = 0;

// Sistema de bonus x3 por anuncio
let adBonusState = {
    active: false,        // Si el bonus x3 está activo (anuncio visto pero puede usarse múltiples veces)
    canWatch: true,       // Si puede ver un anuncio (solo 1 por wave)
    isLoading: false,     // Si el anuncio se está cargando (previene clics múltiples)
    usesRemaining: 0      // Cuántas veces más se puede usar el bonus en esta wave
};

// Estado para el anuncio de continue
let continueAdState = {
    isLoading: false      // Si el anuncio de continue se está cargando
};

// Función llamada desde Android cuando AdMob está listo
function onAdMobReady() {
    admobReady = true;
    //console.log('✅ AdMob Native Android Ready');

}

// Exponer el estado del bonus para el UI
window.adBonusState = adBonusState;

// ===================================
// HAPTIC FEEDBACK (Vibration)
// ===================================
function vibrateButton(duration = 50) {
    try {
        // Intentar vibración nativa de Android
        if (typeof Android !== 'undefined' && typeof Android.vibrate === 'function') {
            Android.vibrate(duration);
            return;
        }

        // Fallback a Vibration API del navegador
        if ('vibrate' in navigator) {
            navigator.vibrate(duration);
            return;
        }

        // Si no hay vibración disponible, no hacer nada (desarrollo/testing)
    } catch (error) {
        console.error('❌ Error triggering vibration:', error);
    }
}
window.vibrateButton = vibrateButton;

// Función para determinar si se debe mostrar anuncio en este wave
function shouldShowAdForWave(wave) {

    // Después del nivel 10: cada 2 niveles O después de boss (múltiplos de 5)
    if (wave > 10) {
        // Boss waves (múltiplos de 5)
        if (wave % 5 === 0) {
            return true;
        }
        // Cada 3 niveles (11, 14, 17, 20, etc.)
        if ((wave - 10) % 3 === 1) {
            return true;
        }
    }

    return false;
}

// Función para mostrar anuncio intersticial
async function showInterstitialAd() {
    if (typeof Android !== 'undefined') {
        try {
            //console.log('📺 Showing AdMob Native Interstitial Ad...');
            Android.showInterstitial();
        } catch (error) {
            console.error('❌ Error showing interstitial ad:', error);
        }
    } else {
        //console.log('⚠️ AdMob not available (running in browser)');
    }
}

// Función para activar bonus x3 después de ver anuncio
function activateTripleBonus() {
    //console.log('📺 activateTripleBonus called - current state:', JSON.stringify(adBonusState));

    if (adBonusState.active) {
        //console.log('⚠️ Bonus x3 already active - consume it first');
        showNotification('❌ Use current bonus first!');
        return false;
    }

    if (!adBonusState.canWatch) {
        //console.log('⚠️ Cannot watch ad - bonus already pending');
        showNotification('⚠️ Bonus already pending!');
        return false;
    }

    if (adBonusState.isLoading) {
        //console.log('⚠️ Ad already loading - please wait');
        showNotification('⏳ Loading ad...');
        return false;
    }

    if (typeof Android !== 'undefined' && typeof Android.showRewardedAd === 'function') {
        try {
            // Verificar si hay anuncio disponible antes de marcar como loading
            if (typeof Android.isRewardedAdReady === 'function' && !Android.isRewardedAdReady()) {
                console.warn('⚠️ No rewarded ad available');
                showNotification('❌ No ad available right now');
                return false;
            }

            //console.log('📺 Calling Android.showRewardedAd()...');
            adBonusState.isLoading = true; // Prevenir clics múltiples
            showNotification('⏳ Loading ad...');

            Android.showRewardedAd(); // Usar anuncio con recompensa
            //console.log('✅ Android.showRewardedAd() called successfully');

            // Timeout de seguridad: si no hay respuesta en 3 segundos, resetear estado
            setTimeout(() => {
                if (adBonusState.isLoading) {
                    console.warn('⚠️ Ad load timeout - resetting loading state');
                    adBonusState.isLoading = false;
                    showNotification('❌ Ad not available, try again');
                }
            }, 3000); // Reducido de 10s a 3s

            // El callback onAdRewarded() será llamado desde Android cuando termine el anuncio
            return true;
        } catch (error) {
            console.error('❌ Error showing rewarded ad:', error);
            adBonusState.isLoading = false;
            showNotification('❌ Error loading ad');
            return false;
        }
    } else {
        // Modo prueba en navegador
        //console.log('⚠️ AdMob not available (Android object not found) - Activating bonus for testing');
        //console.log('   - typeof Android:', typeof Android);
        if (typeof Android !== 'undefined') {
            //console.log('   - typeof Android.showRewardedAd:', typeof Android.showRewardedAd);
        }
        onAdRewarded();
        return true;
    }
}

// Callback llamado desde Android cuando el usuario completa el anuncio con recompensa
function onAdRewarded() {
    //console.log('🎁 onAdRewarded called!');
    //console.log('   - State BEFORE:', JSON.stringify(adBonusState));

    adBonusState.active = true;
    adBonusState.canWatch = false; // No puede ver otro anuncio en esta wave
    adBonusState.isLoading = false; // Resetear estado de loading
    adBonusState.usesRemaining = 999; // Usos ilimitados durante esta wave

    //console.log('   - State AFTER:', JSON.stringify(adBonusState));

    // Notificar al usuario
    if (typeof showNotification === 'function') {
        showNotification('🎁 x3 BONUS ACTIVE FOR THIS WAVE!');
    }

    // Actualizar el UI del modal si está abierto
    //console.log('   - Updating upgrade modal UI...');
    if (typeof window.updateUpgradeModalBonusUI === 'function') {
        window.updateUpgradeModalBonusUI();
        //console.log('   - ✅ UI updated');
    } else {
        console.warn('   - ⚠️ updateUpgradeModalBonusUI not available');
    }

    // Re-renderizar la tabla para mostrar los valores con bonus
    //console.log('   - Re-rendering upgrades grid...');
    if (typeof window.renderUpgradesGrid === 'function') {
        window.renderUpgradesGrid();
        //console.log('   - ✅ Grid re-rendered');
    } else {
        console.warn('   - ⚠️ renderUpgradesGrid not available');
    }

    //console.log('🎁 onAdRewarded complete!');
}

// Callback llamado desde Android si el anuncio falla o se cancela
function onAdFailed() {
    console.warn('❌ onAdFailed called - ad was not completed');
    adBonusState.isLoading = false; // Resetear estado de loading
    showNotification('❌ Ad not completed');
}

// Exponer funciones globalmente
window.activateTripleBonus = activateTripleBonus;
window.onAdRewarded = onAdRewarded;
window.onAdFailed = onAdFailed;
// Device Detection
const DeviceDetector = {
    isMobile: false,
    isTablet: false,
    isTouch: false,
    pixelRatio: 1,

    detect() {
        this.isTouch = 'ontouchstart' in window || navigator.maxTouchPoints > 0;
        this.isMobile = /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent);
        this.isTablet = /(tablet|ipad|playbook|silk)|(android(?!.*mobile))/i.test(navigator.userAgent);
        this.pixelRatio = window.devicePixelRatio || 1;


        return this.isMobile || this.isTablet || this.isTouch;
    },

    getQualitySettings() {
        if (this.isMobile && !this.isTablet) {
            return {
                maxParticles: 80,
                maxEnemies: 40,
                shadowBlur: 15,
                effectsMultiplier: 0.6,
                trailLength: 6
            };
        } else if (this.isTablet) {
            return {
                maxParticles: 120,
                maxEnemies: 60,
                shadowBlur: 20,
                effectsMultiplier: 0.8,
                trailLength: 8
            };
        } else {
            return {
                maxParticles: 250,
                maxEnemies: 120,
                shadowBlur: 30,
                effectsMultiplier: 1,
                trailLength: 12
            };
        }
    }
};

const isMobileDevice = DeviceDetector.detect();
const qualitySettings = DeviceDetector.getQualitySettings();



// Canvas Setup
let canvas;
let ctx;

// ===================================
// RESPONSIVE SCALING SYSTEM
// ===================================
const ViewportScale = {
    baseWidth: 1920,  // Referencia para escritorio
    baseHeight: 1080,
    scale: 1,
    playerSize: 20,
    bulletSize: 5,
    enemySize: 18,
    cameraZoom: 2.0,  // Factor de zoom de cámara (2.0 = ver el doble de mapa)

    update() {
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        // Calcular escala basada en el ancho de la pantalla
        this.scale = Math.min(screenWidth / this.baseWidth, screenHeight / this.baseHeight);

        // Tamaños adaptativos (% del viewport)
        if (isMobileDevice) {
            this.playerSize = screenWidth * 0.04; // DUPLICADO: 4% del ancho de pantalla (antes 2%)
            this.bulletSize = screenWidth * 0.01; // 1% del ancho (sin cambios en balas)
            this.enemySize = screenWidth * 0.04; // DUPLICADO: 4% del ancho (antes 2%)
        } else {
            this.playerSize = screenWidth * 0.05; // DUPLICADO: 5% del ancho (antes 2.5%)
            this.bulletSize = screenWidth * 0.008; // 0.8% del ancho (sin cambios)
            this.enemySize = screenWidth * 0.06; // DUPLICADO: 6% del ancho (antes 3%)
        }

    },

    // Control de altura de cámara
    getCameraZoom() {
        return this.cameraZoom;
    },

    setCameraZoom(zoom) {
        this.cameraZoom = Math.max(1.0, Math.min(4.0, zoom)); // Entre 1.0 y 4.0
        console.log('📷 Camera Zoom changed to:', this.cameraZoom);
    }
};

function resizeCanvas() {
    if (!canvas || !ctx) {
        console.warn('⚠️ resizeCanvas called but canvas or ctx is null');
        return; // Safety check
    }

    // CRITICAL FIX: Usar DPR para pantallas de alta resolución (Retina, etc.)
    const dpr = window.devicePixelRatio || 1;

    // Tamaño físico en píxeles (alta resolución)
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;

    // Tamaño lógico en CSS (tamaño visual)
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';

    // Escalar el contexto para que las coordenadas lógicas funcionen correctamente
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    // Configurar calidad de renderizado
    ctx.imageSmoothingEnabled = true;
    ctx.imageSmoothingQuality = 'high';

    ViewportScale.update(); // Actualizar escalas
    updateGameAreaLimits(); // Actualizar límites del área de juego
    updateMinimapPosition(); // Actualizar posición del minimapa según orientación

}

function updateMinimapPosition() {
    const minimapCanvas = document.getElementById('minimapCanvas');
    if (!minimapCanvas) return;

    const isPortrait = window.innerHeight > window.innerWidth;

    if (isPortrait) {
        // Modo vertical: esquina superior derecha
        minimapCanvas.style.top = '18px';
        minimapCanvas.style.right = '18px';
        minimapCanvas.style.bottom = 'auto';
        minimapCanvas.style.left = 'auto';
        minimapCanvas.style.transform = 'none';
    } else {
        // Modo horizontal: centrado en la parte inferior entre joysticks
        minimapCanvas.style.top = 'auto';
        minimapCanvas.style.right = 'auto';
        minimapCanvas.style.bottom = '20px';
        minimapCanvas.style.left = '50%';
        minimapCanvas.style.transform = 'translateX(-50%)';
    }
}

// El listener de resize se agregará después de inicializar el canvas

// Function to initialize canvas event listeners
function initializeCanvasEvents() {
    if (!canvas) return;

}

// Game State
const gameState = {
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    isCountdown: false,
    wave: 1,
    score: 0,
    kills: 0,
    enemiesPerWave: 5,
    enemiesToSpawn: 5,
    totalEnemiesInWave: 5, // Total para mostrar en HUD
    lastEnemySpawn: 0,
    enemySpawnRate: 1000,
    difficultyMultiplier: 1,
    mapType: 'maze', // Tipo de mapa seleccionado
    // Sistema de experiencia
    experience: 0,
    experienceThisWave: {
        normal: 0,
        fast: 0,
        heavy: 0,
        superheavy: 0,
        explosive: 0,
        boss: 0,
        total: 0
    }
};

// Player
const player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    get radius() { return ViewportScale.playerSize; }, // Dinámico
    health: 100,
    maxHealth: 100,
    get speed() {
        const baseSpeed = (playerStats.movementSpeed.baseValue) * ViewportScale.scale;
        return baseSpeed * (playerStats.movementSpeed.currentValue / playerStats.movementSpeed.baseValue);
    }, // Velocidad proporcional con mejora
    color: '#5EF067',
    angle: 0,
    aimX: 0,
    aimY: 0,
    shootCooldown: 0,
    lastShootTime: 0,
    lastRegenTime: Date.now(),
    moving: false
};

// Sistema de habilidades del jugador (upgrades)
const playerStats = {
    movementSpeed: {
        level: 0,
        baseValue: 25, // AUMENTADO: 150% más rápido (10 × 2.5 = 25)
        currentValue: 25,
        increment: 0.025, // 2.5% por nivel
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Move faster on the arena"
    },
    fireRate: {
        level: 0,
        baseValue: 1000, // ms entre disparos
        currentValue: 1000,
        increment: -0.025, // -5% (reduce cooldown)
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Shoot more frequently"
    },
    resilience: {
        level: 0,
        baseValue: 1.0, // Multiplicador de daño recibido (1.0 = 100%)
        currentValue: 1.0,
        increment: -0.05, // -5% daño recibido
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Take less damage from enemies"
    },
    bulletDamage: {
        level: 0,
        baseValue: 10,
        currentValue: 10,
        increment: 0.05, // +5% daño
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Your shots deal more damage"
    },
    maxHealth: {
        level: 0,
        baseValue: 100,
        currentValue: 100,
        increment: 0.025, // +2.5% salud máxima
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Increases your maximum HP"
    },
    pickupMagnet: {
        level: 0,
        baseValue: 50, // Radio de recolección
        currentValue: 50,
        increment: 0.05, // +5% radio
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Increases range to collect pickups"
    },
    criticalChance: {
        level: 0,
        baseValue: 0, // 0% inicial
        currentValue: 0,
        increment: 0.02, // +2% por nivel (no es 5% porque sería muy fuerte)
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Chance to deal double damage"
    },
    regeneration: {
        level: 0,
        baseValue: 0, // HP/segundo
        currentValue: 0,
        increment: 0.25, // +0.5 HP/s por nivel (valor fijo, no porcentaje)
        cost: function() { return Math.round(10 * Math.pow(1.2, this.level) + ((this.level + 1) * (this.level + 1) * 2)); },
        description: "Recover health per second"
    }
};

// Snapshot de habilidades para el sistema de deshacer
let statsSnapshot = null;

// PC shooting logic stub
function playerShoot(x, y) {
    // Implement shooting logic here if not present
    // Example: create a bullet towards (x, y)
    // ...existing code...
}

// Límites del área de juego (HUD height)
var gameAreaTop = 0;

function updateGameAreaLimits() {
    const hudElement = document.getElementById('gameHUD');
    if (hudElement) {
        gameAreaTop = hudElement.offsetHeight;
    } else {
        gameAreaTop = isMobileDevice ? 50 : 60; // Fallback
    }
}

// Arrays
let enemies = [];
let bullets = [];
let abilityPickups = [];
let particles = [];
let damageNumbers = []; // Números de daño flotantes (Fase 5)
let collectedAbility = null;
let lastHealthDamageTime = 0; // Para controlar el sonido de daño

// Expose gameState globally for pause button logic
window.gameState = gameState;

// Mostrar mejor puntuación en el perfil si está logado
window.showUserBestScore = function(bestScore) {
    const bestScoreDiv = document.getElementById('userBestScore');
    const bestScoreValue = document.getElementById('bestScoreValue');
    if (window.isGuestMode) {
        bestScoreDiv.style.display = 'none';
    } else {
        bestScoreDiv.style.display = 'block';
        bestScoreValue.textContent = bestScore ? bestScore.toLocaleString() : '0';
    }
};

// Audio Context para efectos de sonido
let audioContext;
let hasInteracted = false;

function initAudio() {
    if (!audioContext && !hasInteracted) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        hasInteracted = true;
    }
}

// Sonido de daño al jugador (synth retro-futurista)
function playDamageSound() {
    if (!audioContext) return;

    const now = audioContext.currentTime;
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.type = 'sawtooth';
    oscillator.frequency.setValueAtTime(150, now);
    oscillator.frequency.exponentialRampToValueAtTime(50, now + 0.2);

    gainNode.gain.setValueAtTime(0.3, now);
    gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.2);

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.start(now);
    oscillator.stop(now + 0.2);
}

// Vibración en móvil
function vibrateDevice(duration = 100) {
    if (navigator.vibrate) {
        navigator.vibrate(duration);
    }
}

// Actualizar icono del botón de habilidad en móvil
function updateAbilityButton() {
    if (!isMobileDevice) return;

    const abilityBtn = document.getElementById('abilityBtn');
    if (!abilityBtn) return;

    if (collectedAbility) {
        abilityBtn.textContent = collectedAbility.icon;
        abilityBtn.classList.remove('inactive');
    } else {
        abilityBtn.textContent = '⚡';
        abilityBtn.classList.add('inactive');
    }

    // Add event listener for ability button
    const abilityHandler = (e) => {
        e.preventDefault();
        initAudio();
        vibrateButton(50); // ✅ Vibración al pulsar ability
        if (collectedAbility && gameState.isPlaying) {
            useAbility();
        }
    };
    abilityBtn.addEventListener('touchstart', abilityHandler);
    abilityBtn.addEventListener('click', abilityHandler);
}

// Input Handling
const input = {
    touch: {
        shoot: false,
        ability: false
    }
};

// ===================================
// MOBILE CONTROLS - WILD RIFT STYLE
// ===================================

let mobileControlsInitialized = false;

function initializeMobileControls() {


    if (!isMobileDevice || mobileControlsInitialized) {

        return;
    }



    const mobileControlsEl = document.getElementById('mobileControls');
    const platformMobile = document.querySelector('.platform-specific.mobile');



    if (mobileControlsEl) {
        mobileControlsEl.classList.add('active');
        //console.log('📱 mobileControls activated');
    }
    if (platformMobile) {
        platformMobile.classList.add('active');
        //console.log('📱 platformMobile activated');
    }

    // Joystick - FIXED: Solo la base captura eventos
    const joystickBase = document.getElementById('joystickBase');
    const joystickStick = document.getElementById('joystickStick');



    if (!joystickBase || !joystickStick) {
        console.error('❌ Joystick elements not found!');
        return;
    }

    // FORZAR pointer-events en joystick base
    joystickBase.style.pointerEvents = 'all';
    joystickStick.style.pointerEvents = 'none';
    //console.log('✅ Joystick pointer-events set: base=all, stick=none');

    let joystickTouchId = null;

    joystickBase.addEventListener('touchstart', (e) => {
        e.preventDefault();
        e.stopPropagation();
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        const rect = joystickBase.getBoundingClientRect();
        input.joystick.centerX = rect.left + rect.width / 2;
        input.joystick.centerY = rect.top + rect.height / 2;
        input.joystick.active = true;
        joystickStick.classList.add('active');
        handleJoystickMove(touch);
    }, { passive: false });

    document.addEventListener('touchmove', (e) => {
        if (!input.joystick.active) return;
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                e.preventDefault();
                handleJoystickMove(touch);
                break;
            }
        }
    }, { passive: false });

    document.addEventListener('touchend', (e) => {
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                e.preventDefault();
                input.joystick.active = false;
                input.joystick.x = 0;
                input.joystick.y = 0;
                joystickStick.style.left = '50%';
                joystickStick.style.top = '50%';
                joystickStick.classList.remove('active');
                joystickTouchId = null;
                break;
            }
        }
    });

    document.addEventListener('touchcancel', (e) => {
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                input.joystick.active = false;
                input.joystick.x = 0;
                input.joystick.y = 0;
                joystickStick.style.left = '50%';
                joystickStick.style.top = '50%';
                joystickStick.classList.remove('active');
                joystickTouchId = null;
                break;
            }
        }
    });

    function handleJoystickMove(touch) {
        const deltaX = touch.clientX - input.joystick.centerX;
        const deltaY = touch.clientY - input.joystick.centerY;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 50);
        const angle = Math.atan2(deltaY, deltaX);
        input.joystick.x = Math.cos(angle) * distance / 50;
        input.joystick.y = Math.sin(angle) * distance / 50;
        joystickStick.style.left = `calc(50% + ${Math.cos(angle) * distance}px)`;
        joystickStick.style.top = `calc(50% + ${Math.sin(angle) * distance}px)`;
    }

    // ===================================
    // SHOOT JOYSTICK (Right Side) - Dual Joystick Mode
    // ===================================
    const shootJoystickBase = document.getElementById('shootJoystickBase');
    const shootJoystickStick = document.getElementById('shootJoystickStick');
    let shootJoystickTouchId = null;

    //console.log('📱 Shoot Joystick Elements:');
    //console.log('   - shootJoystickBase:', shootJoystickBase ? '✅ Found' : '❌ NOT FOUND');
    //console.log('   - shootJoystickStick:', shootJoystickStick ? '✅ Found' : '❌ NOT FOUND');

    if (shootJoystickBase) {
        //console.log('📱 Setting up shoot joystick event listeners...');

        // FORZAR pointer-events en shoot joystick base
        shootJoystickBase.style.pointerEvents = 'all';
        if (shootJoystickStick) {
            shootJoystickStick.style.pointerEvents = 'none';
        }
        //console.log('✅ Shoot joystick pointer-events set: base=all, stick=none');
        shootJoystickBase.addEventListener('touchstart', (e) => {
            e.preventDefault();
            e.stopPropagation();
            const touch = e.changedTouches[0];
            shootJoystickTouchId = touch.identifier;
            const rect = shootJoystickBase.getBoundingClientRect();
            input.shootJoystick.centerX = rect.left + rect.width / 2;
            input.shootJoystick.centerY = rect.top + rect.height / 2;
            input.shootJoystick.active = true;
            shootJoystickStick.classList.add('active');
            handleShootJoystickMove(touch);
        }, { passive: false });

        document.addEventListener('touchmove', (e) => {
            if (!input.shootJoystick.active) return;
            for (let touch of e.changedTouches) {
                if (touch.identifier === shootJoystickTouchId) {
                    e.preventDefault();
                    handleShootJoystickMove(touch);
                    break;
                }
            }
        }, { passive: false });

        document.addEventListener('touchend', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === shootJoystickTouchId) {
                    e.preventDefault();
                    input.shootJoystick.active = false;
                    input.shootJoystick.x = 0;
                    input.shootJoystick.y = 0;
                    shootJoystickStick.style.left = '50%';
                    shootJoystickStick.style.top = '50%';
                    shootJoystickStick.classList.remove('active');
                    shootJoystickTouchId = null;
                    break;
                }
            }
        });

        document.addEventListener('touchcancel', (e) => {
            for (let touch of e.changedTouches) {
                if (touch.identifier === shootJoystickTouchId) {
                    input.shootJoystick.active = false;
                    input.shootJoystick.x = 0;
                    input.shootJoystick.y = 0;
                    shootJoystickStick.style.left = '50%';
                    shootJoystickStick.style.top = '50%';
                    shootJoystickStick.classList.remove('active');
                    shootJoystickTouchId = null;
                    break;
                }
            }
        });
    }

    function handleShootJoystickMove(touch) {
        const deltaX = touch.clientX - input.shootJoystick.centerX;
        const deltaY = touch.clientY - input.shootJoystick.centerY;
        const distance = Math.min(Math.sqrt(deltaX * deltaX + deltaY * deltaY), 50);
        const angle = Math.atan2(deltaY, deltaX);

        input.shootJoystick.x = Math.cos(angle) * distance / 50;
        input.shootJoystick.y = Math.sin(angle) * distance / 50;
        input.shootJoystick.angle = angle;

        shootJoystickStick.style.left = `calc(50% + ${Math.cos(angle) * distance}px)`;
        shootJoystickStick.style.top = `calc(50% + ${Math.sin(angle) * distance}px)`;
    }

    // ===================================
    // ===================================
    // ===================================
    // ABILITY BUTTON
    // ===================================

    // Ability Button (Small - Dual Joystick Mode)
    const abilityBtnSmall = document.getElementById('abilityBtnSmall');
    if (abilityBtnSmall) {
        const abilityHandler = (e) => {
            e.preventDefault();
            initAudio();
            vibrateButton(50); // ✅ Vibración al pulsar ability
            if (collectedAbility && gameState.isPlaying) {
                useAbility();
            }
        };
        abilityBtnSmall.addEventListener('touchstart', abilityHandler);
        abilityBtnSmall.addEventListener('click', abilityHandler);
    }

    // Pause button
    const pauseBtnMobile = document.getElementById('pauseBtnMobile');
    //console.log('🔍 Pause button mobile found in initMobileControls:', pauseBtnMobile);
    if (pauseBtnMobile) {
        const pauseHandler = function(e) {
            e.preventDefault();
            e.stopPropagation();
            vibrateButton(50); // ✅ Vibración al pulsar pause
            //console.log('⏸️ Pause button activated! Game state:', gameState.isPlaying, gameState.isGameOver);
            if (gameState.isPlaying && !gameState.isGameOver) {
                gameState.isPaused = true;
                const pauseOverlay = document.getElementById('pauseOverlay');
                //console.log('📱 Pause overlay:', pauseOverlay);
                if (pauseOverlay) {
                    pauseOverlay.style.display = 'flex';
                    //console.log('✅ Pause overlay displayed');
                }

                // Reset page to 1 when opening pause menu
                if (typeof window.currentStatsPage !== 'undefined') {
                    window.currentStatsPage = 1;
                }

                // Update pause stats
                if (typeof window.updatePauseStats === 'function') {
                    window.updatePauseStats();
                    //console.log('📊 Pause stats updated');
                }
            }
        };

        pauseBtnMobile.addEventListener('touchstart', pauseHandler, { passive: false });
        pauseBtnMobile.addEventListener('click', pauseHandler);
        //console.log('✅ Pause button event listeners registered (touch + click)');
    }

    // Inicializar audio en primer touch
    window.addEventListener('touchstart', () => {
        initAudio();
    }, { once: true });

    mobileControlsInitialized = true;
    //console.log('✅ Mobile controls initialized successfully');
}

// ===================================
// ABILITIES
// ===================================

const ABILITIES = {
    fireball: {
        id: 'fireball',
        name: 'Fireball Storm',
        icon: '🔥',
        execute: () => {
            for (let i = 0; i < 8; i++) {
                const angle = (Math.PI * 2 / 8) * i;
                bullets.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(angle) * 12 * ViewportScale.scale,
                    vy: Math.sin(angle) * 12 * ViewportScale.scale,
                    radius: ViewportScale.bulletSize * 2, // RESPONSIVE FIREBALL
                    damage: 70,
                    color: '#ff4400',
                    trail: [],
                    glow: true
                });
            }
            createParticles(player.x, player.y, 40, '#ff4400');
        }
    },
    lightning: {
        id: 'lightning',
        name: 'Chain Lightning',
        icon: '⚡',
        execute: () => {
            enemies.sort((a, b) => {
                const distA = Math.hypot(a.x - player.x, a.y - player.y);
                const distB = Math.hypot(b.x - player.x, b.y - player.y);
                return distA - distB;
            }).slice(0, 8).forEach(enemy => {
                enemy.health -= 90;
                createParticles(enemy.x, enemy.y, 30, '#ffff00');
                createLightningEffect(player.x, player.y, enemy.x, enemy.y);
            });
        }
    },
    heal: {
        id: 'heal',
        name: 'Vital Surge',
        icon: '❤️',
        execute: () => {
            player.health = Math.min(player.maxHealth, player.health + 70);
            createParticles(player.x, player.y, 50, '#ff00ff');
            createHealRing(player.x, player.y);
        }
    },
    freeze: {
        id: 'freeze',
        name: 'Frost Nova',
        icon: '❄️',
        execute: () => {
            enemies.forEach(enemy => {
                enemy.originalSpeed = enemy.speed;
                enemy.speed *= 0.2;
                enemy.frozen = true;
            });
            createParticles(player.x, player.y, 60, '#00ddff');
            setTimeout(() => {
                enemies.forEach(enemy => {
                    if (enemy.frozen && enemy.originalSpeed) {
                        enemy.speed = enemy.originalSpeed;
                        enemy.frozen = false;
                    }
                });
            }, 4000);
        }
    },
    bomb: {
        id: 'bomb',
        name: 'Neon Blast',
        icon: '💣',
        execute: () => {
            const radius = 280;
            enemies.forEach(enemy => {
                const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
                if (dist < radius) {
                    enemy.health -= 140;
                    createParticles(enemy.x, enemy.y, 25, '#ff8800');
                }
            });
            createExplosion(player.x, player.y, radius);
        }
    }
};

function useAbility() {
    if (!collectedAbility) return;

    collectedAbility.execute();
    showNotification(`${collectedAbility.icon} ${collectedAbility.name}!`);
    collectedAbility = null;
    updateAbilityButton();
}

// ===================================
// VISUAL EFFECTS
// ===================================

function createParticles(x, y, count, color) {
    const maxCount = Math.min(count, qualitySettings.maxParticles / 3);
    for (let i = 0; i < maxCount; i++) {
        const angle = Math.random() * Math.PI * 2;
        const speed = Math.random() * 7 + 3;
        particles.push({
            x: x,
            y: y,
            vx: Math.cos(angle) * speed,
            vy: Math.sin(angle) * speed,
            radius: Math.random() * 5 + 2,
            color: color,
            life: 1,
            maxLife: 1
        });
    }
}

// FASE 5: Crear número de daño flotante (Brawl Stars style)
function createDamageNumber(x, y, damage, isCritical = false) {
    damageNumbers.push({
        x: x,
        y: y,
        damage: Math.round(damage),
        isCritical: isCritical,
        life: 1.0,
        maxLife: 1.0,
        vy: -2, // Velocidad inicial hacia arriba
        vx: (Math.random() - 0.5) * 1.5, // Pequeño movimiento horizontal aleatorio
        scale: isCritical ? 1.5 : 1.0,
        rotation: (Math.random() - 0.5) * 0.2
    });
}

function createLightningEffect(x1, y1, x2, y2) {
    particles.push({
        type: 'lightning',
        x1, y1, x2, y2,
        life: 0.3,
        maxLife: 0.3,
        color: '#ffff00'
    });
}

function createHealRing(x, y) {
    particles.push({
        type: 'ring',
        x, y,
        radius: 0,
        maxRadius: 100,
        life: 1,
        maxLife: 1,
        color: '#ff00ff'
    });
}

function createExplosion(x, y, radius) {
    particles.push({
        type: 'explosion',
        x, y,
        radius: 0,
        maxRadius: radius,
        life: 1,
        maxLife: 1,
        color: '#ff8800'
    });
}

// ===================================
// GAME FUNCTIONS
// ===================================

// Tipos de enemigos
const ENEMY_TYPES = {
    BASIC: {
        name: 'Basic',
        icon: '⬤', // Círculo básico magenta
        color: '#ff00ff', // Magenta
        sizeMultiplier: 1,
        speedMultiplier: 1,
        healthMultiplier: 1,
        spawnChance: 0.50,
        abilityDropChance: 0.05
    },
    FAST: {
        name: 'Fast',
        icon: '◆', // Rombo rápido cian
        color: '#00ffff', // Cian
        sizeMultiplier: 0.5,
        speedMultiplier: 1.15,
        healthMultiplier: 0.5,
        spawnChance: 0.15,
        abilityDropChance: 0.10
    },
    HEAVY: {
        name: 'Heavy',
        icon: '⬢', // Hexágono pesado naranja
        color: '#ff8800', // Naranja
        sizeMultiplier: 1.25,
        speedMultiplier: 0.85,
        healthMultiplier: 1.25,
        spawnChance: 0.15,
        abilityDropChance: 0.10
    },
    SUPERHEAVY: {
        name: 'SuperHeavy',
        icon: '⬣', // Hexágono grueso rojo
        color: '#ff0055', // Rojo-Rosa
        sizeMultiplier: 1.35,
        speedMultiplier: 0.75,
        healthMultiplier: 1.35,
        spawnChance: 0.10,
        abilityDropChance: 0.13
    },
    EXPLOSIVE: {
        name: 'Explosive',
        icon: '✦', // Estrella explosiva amarilla
        color: '#ffff00', // Amarillo
        sizeMultiplier: 1,
        speedMultiplier: 1,
        healthMultiplier: 1,
        spawnChance: 0.10,
        abilityDropChance: 0.05,
        explosive: true
    },
    BOSS: {
        name: 'Boss',
        icon: '◈', // Diamante especial violeta
        color: '#8800ff', // Violeta
        sizeMultiplier: 2.2,
        speedMultiplier: 0.8,
        healthMultiplier: 5,
        spawnChance: 0,
        abilityDropChance: 1.0,
        isBoss: true
    }
};

// Seleccionar tipo de enemigo basado en probabilidades
function selectEnemyType() {
    const rand = Math.random();
    let cumulative = 0;

    for (const [key, type] of Object.entries(ENEMY_TYPES)) {
        cumulative += type.spawnChance;
        if (rand <= cumulative) {
            return { key, ...type };
        }
    }

    return { key: 'BASIC', ...ENEMY_TYPES.BASIC };
}

function getSpawnPosition() {
    // Si existe MapSystem, usar spawn inteligente en el mapa procedural
    if (window.gameMapSystem && typeof window.gameMapSystem.getSmartEnemySpawnPosition === 'function') {
        return window.gameMapSystem.getSmartEnemySpawnPosition();
    }
    // Fallback clásico: spawn fuera de pantalla
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;
    switch(side) {
        case 0:
            x = Math.random() * screenWidth;
            y = -60;
            break;
        case 1:
            x = screenWidth + 40;
            y = gameAreaTop + Math.random() * (screenHeight - gameAreaTop);
            break;
        case 2:
            x = Math.random() * screenWidth;
            y = screenHeight + 40;
            break;
        case 3:
            x = -40;
            y = gameAreaTop + Math.random() * (screenHeight - gameAreaTop);
            break;
    }
    return { x, y };
}

function spawnEnemy() {
    const enemyType = selectEnemyType();
    const position = getSpawnPosition();

    const radius = ViewportScale.enemySize * enemyType.sizeMultiplier; // RESPONSIVE
    const baseHealth = 55 + gameState.wave * 15;
    const baseSpeed = (5 + gameState.wave) * gameState.difficultyMultiplier * ViewportScale.scale;

    const enemy = {
        x: position.x,
        y: position.y,
        radius: radius,
        health: baseHealth * enemyType.healthMultiplier,
        maxHealth: baseHealth * enemyType.healthMultiplier,
        speed: baseSpeed * enemyType.speedMultiplier,
        color: enemyType.color,
        damage: 12 + gameState.wave * 3,
        type: enemyType.key,
        abilityDropChance: enemyType.abilityDropChance,
        explosive: enemyType.explosive || false
    };

    enemies.push(enemy);
}

// Jefes finales
let bosses = [];

function spawnBoss() {
    const position = getSpawnPosition();
    const bossesInWave = Math.floor(gameState.wave / 10) + 1;

    const radius = ViewportScale.enemySize * 2.2 + (gameState.wave * ViewportScale.scale); // RESPONSIVE BOSS
    const baseHealth = 500 + gameState.wave * 150;
    const baseSpeed = (0.8 + gameState.wave * 0.03) * gameState.difficultyMultiplier * ViewportScale.scale;

    const boss = {
        x: position.x,
        y: position.y,
        radius: radius,
        health: baseHealth,
        maxHealth: baseHealth,
        speed: baseSpeed,
        color: '#8800ff', // Violeta
        damage: 5 + gameState.wave * 5,
        type: 'BOSS',
        isBoss: true,
        shootCooldown: 0,
        lastShootTime: 0,
        shootRate: 3000 - (gameState.wave * 50),
        collectedAbility: null,
        abilityDropChance: 1.0,
        aimX: 0,
        aimY: 0
    };

    bosses.push(boss);
    enemies.push(boss);

    showNotification(`⚠️ BOSS WAVE ${gameState.wave} ⚠️`);
}

function handleExplosion(x, y, radius) {
    const explosionRadius = radius * 2;

    enemies.forEach(enemy => {
        const dx = enemy.x - x;
        const dy = enemy.y - y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < explosionRadius && dist > 0) {
            enemy.health -= enemy.maxHealth * 0.10;
            createParticles(enemy.x, enemy.y, 15, '#ffff00');
        }
    });

    createExplosion(x, y, explosionRadius);
}

function spawnAbilityPickup(x, y) {
    const abilities = Object.values(ABILITIES);
    const ability = abilities[Math.floor(Math.random() * abilities.length)];

    // Asegurar que el pickup aparece dentro del área de juego válida
    const clampedY = Math.max(gameAreaTop + 30, Math.min(window.innerHeight - 30, y));

    abilityPickups.push({
        x: x,
        y: clampedY,
        radius: ViewportScale.playerSize * 1.4, // RESPONSIVE ABILITY SIZE
        ability: ability,
        rotation: 0,
        life: 18,
        pulse: 0
    });
}

// ===================================
// SISTEMA DE EXPERIENCIA
// ===================================

// ===================================
// AUTO-AIM SYSTEM (Brawl Stars style)
// ===================================

/**
 * Encuentra el enemigo más cercano dentro del rango de auto-aim
 * @param {number} maxRange - Rango máximo de auto-aim en píxeles
 * @returns {Object|null} - Enemigo más cercano o null
 */
function findClosestEnemy(maxRange = 600) {
    if (!enemies || enemies.length === 0) return null;

    let closestEnemy = null;
    let closestDistance = maxRange;

    for (const enemy of enemies) {
        const dx = enemy.x - player.x;
        const dy = enemy.y - player.y;
        const distance = Math.sqrt(dx * dx + dy * dy);

        if (distance < closestDistance) {
            closestDistance = distance;
            closestEnemy = enemy;
        }
    }

    return closestEnemy;
}

/**
 * Calcula el ángulo hacia un objetivo con predicción de movimiento
 * @param {Object} target - Enemigo objetivo
 * @returns {number} - Ángulo en radianes
 */
function calculateAimAngle(target) {
    if (!target) return player.angle;

    // Predicción simple de movimiento
    const bulletSpeed = 14 * ViewportScale.scale;
    const dx = target.x - player.x;
    const dy = target.y - player.y;
    const distance = Math.sqrt(dx * dx + dy * dy);

    // Tiempo estimado de llegada de la bala
    const timeToHit = distance / bulletSpeed;

    // Posición predicha del enemigo
    const predictedX = target.x + (target.vx || 0) * timeToHit;
    const predictedY = target.y + (target.vy || 0) * timeToHit;

    // Ángulo hacia la posición predicha
    const finalDx = predictedX - player.x;
    const finalDy = predictedY - player.y;

    return Math.atan2(finalDy, finalDx);
}

/**
 * Determina el ángulo de disparo (auto-aim o manual)
 * @param {number} joystickAngle - Ángulo del joystick
 * @param {boolean} useAutoAim - Si debe usar auto-aim
 * @returns {number} - Ángulo final de disparo
 */
function getShootingAngle(joystickAngle, useAutoAim = true) {
    if (!useAutoAim) {
        return joystickAngle;
    }

    // Buscar enemigo más cercano
    const closestEnemy = findClosestEnemy(600);

    if (closestEnemy) {
        // Auto-aim al enemigo más cercano
        return calculateAimAngle(closestEnemy);
    } else {
        // Sin enemigos cercanos, usar ángulo del joystick
        return joystickAngle;
    }
}

// Crear bala del jugador con mejoras aplicadas
function createPlayerBullet(angle) {
    const baseDamage = 35;
    let finalDamage = baseDamage * (playerStats.bulletDamage.currentValue / playerStats.bulletDamage.baseValue);

    // Critical hit chance
    const isCritical = Math.random() < playerStats.criticalChance.currentValue;
    if (isCritical) {
        finalDamage *= 2;
    }

    console.log('🔫 CREATING BULLET:', {
        angle: angle,
        damage: Math.round(finalDamage),
        isCritical: isCritical,
        playerX: player.x,
        playerY: player.y
    });

    bullets.push({
        x: player.x,
        y: player.y,
        vx: Math.cos(angle) * 35 * ViewportScale.scale, // AUMENTADO: 150% más rápido (14 × 2.5 = 35)
        vy: Math.sin(angle) * 35 * ViewportScale.scale, // AUMENTADO: 150% más rápido (14 × 2.5 = 35)
        radius: ViewportScale.bulletSize,
        damage: Math.round(finalDamage),
        color: isCritical ? '#ff00ff' : '#00ffff', // Críticos en magenta
        trail: [],
        glow: true,
        isCritical: isCritical
    });

    console.log('📊 Total bullets:', bullets.length);
}

// Obtener cooldown de disparo actual
function getShootCooldown() {
    const cooldown = Math.max(50, playerStats.fireRate.currentValue);
    // //console.log('🎯 Shoot cooldown:', cooldown, 'ms'); // Debug log
    return cooldown;
}

// Otorgar experiencia al matar un enemigo
function grantExperience(enemy) {
    let xpAmount = 0;
    let enemyType = 'normal';

    if (enemy.isBoss) {
        xpAmount = 100 * gameState.wave;
        enemyType = 'boss';
    } else if (enemy.type === 'SUPERHEAVY') {
        xpAmount = 30 * gameState.wave;
        enemyType = 'superheavy';
    } else if (enemy.type === 'HEAVY') {
        xpAmount = 20 * gameState.wave;
        enemyType = 'heavy';
    } else if (enemy.type === 'FAST') {
        xpAmount = 15 * gameState.wave;
        enemyType = 'fast';
    } else if (enemy.type === 'EXPLOSIVE') {
        xpAmount = 25 * gameState.wave;
        enemyType = 'explosive';
    } else {
        xpAmount = 10 * gameState.wave;
        enemyType = 'normal';
    }

    gameState.experience += xpAmount;
    gameState.experienceThisWave[enemyType] += xpAmount;
    gameState.experienceThisWave.total += xpAmount;
}

// Resetear el tracking de XP de la oleada
function resetWaveExperience() {
    gameState.experienceThisWave = {
        normal: 0,
        fast: 0,
        heavy: 0,
        superheavy: 0,
        explosive: 0,
        boss: 0,
        total: 0
    };
}

// Mejorar una habilidad
function upgradePlayerStat(statName) {
    const stat = playerStats[statName];
    if (!stat) return false;

    const cost = stat.cost();
    if (gameState.experience < cost) {
        showNotification('❌ Not enough experience!');
        return false;
    }

    // Gastar experiencia
    gameState.experience -= cost;

    // Determinar el multiplicador de potencia del bonus
    const bonusMultiplier = adBonusState.active ? 3 : 1;

    // Guardar el valor actual antes de modificar
    const currentValueBeforeUpgrade = stat.currentValue;

    // Subir solo 1 nivel
    stat.level++;

    // Calcular nuevo valor aplicando el incremento las veces del multiplicador
    if (statName === 'regeneration') {
        // Regeneración es valor fijo, no porcentaje
        // Aplicar el incremento multiplicado por el bonus
        stat.currentValue = stat.baseValue + (stat.increment * bonusMultiplier);

        // Si hay bonus, añadir 2 incrementos más
        if (bonusMultiplier === 3) {
            stat.currentValue += stat.increment * 2;
        }
    } else if (statName === 'criticalChance') {
        // Critical chance también es valor fijo (porcentaje)
        stat.currentValue = Math.min(stat.baseValue + (stat.increment * bonusMultiplier), 1.0);

        // Si hay bonus, añadir 2 incrementos más
        if (bonusMultiplier === 3) {
            stat.currentValue += stat.increment * 2;
        }
    } else {
        // Otros stats: incremento compuesto
        //if (bonusMultiplier === 3) {
        //    // Con bonus: aplicar el incremento 3 veces desde el valor ACTUAL (antes de subir nivel)
        //    // Esto mantiene la progresión basada en el valor, no en el nivel
        //    stat.currentValue = currentValueBeforeUpgrade * Math.pow(1 + stat.increment, 3);
        //} else {
        //    // Sin bonus: calcular valor normal basado en el nivel
        //    stat.currentValue = stat.baseValue * Math.pow(1 + stat.increment, stat.level);
        //}
        stat.currentValue = currentValueBeforeUpgrade * Math.pow(1 + stat.increment, bonusMultiplier);
    }

    // Si se usó el bonus x3, notificar pero NO desactivarlo
    if (adBonusState.active) {
        // Decrementar usos (aunque está en 999, es para futura implementación)
        if (adBonusState.usesRemaining > 0) {
            adBonusState.usesRemaining--;
        }

        showNotification('🎁 x3 BONUS APPLIED! Still active for more upgrades');
        //console.log('✨ Bonus used - Remaining uses:', adBonusState.usesRemaining);

        // NO desactivar el bonus - se mantiene activo para más upgrades
        // adBonusState.active = false; // ❌ ELIMINADO
        // adBonusState.canWatch = true; // ❌ ELIMINADO

        // Actualizar UI del modal (pero bonus sigue activo)
        if (typeof window.updateUpgradeModalBonusUI === 'function') {
            window.updateUpgradeModalBonusUI();
        }
    }

    // Aplicar mejora al jugador
    applyStatUpgrade(statName);

    return true;
}// Aplicar mejora al gameplay
function applyStatUpgrade(statName) {
    switch(statName) {
        case 'movementSpeed':
            // Se aplica automáticamente vía getter en player.speed
            break;
        case 'fireRate':
            // Se aplica en la lógica de disparo
            break;
        case 'maxHealth':
            const healthPercent = player.health / player.maxHealth;
            player.maxHealth = Math.round(playerStats.maxHealth.currentValue);
            player.health = Math.round(player.maxHealth * healthPercent); // Mantener porcentaje
            break;
        case 'resilience':
        case 'bulletDamage':
        case 'pickupMagnet':
        case 'criticalChance':
        case 'regeneration':
            // Se aplican en sus respectivas lógicas
            break;
    }
}

// Crear snapshot del estado de habilidades
function createStatsSnapshot() {
    statsSnapshot = {
        experience: gameState.experience,
        stats: {}
    };

    for (let statName in playerStats) {
        statsSnapshot.stats[statName] = {
            level: playerStats[statName].level,
            currentValue: playerStats[statName].currentValue
        };
    }

    // Guardar también salud máxima del jugador
    statsSnapshot.playerMaxHealth = player.maxHealth;
    statsSnapshot.playerHealth = player.health;
}

// Restaurar snapshot (deshacer cambios)
function restoreStatsSnapshot() {
    if (!statsSnapshot) return;

    gameState.experience = statsSnapshot.experience;

    for (let statName in statsSnapshot.stats) {
        playerStats[statName].level = statsSnapshot.stats[statName].level;
        playerStats[statName].currentValue = statsSnapshot.stats[statName].currentValue;
    }

    // Restaurar salud del jugador
    player.maxHealth = statsSnapshot.playerMaxHealth;
    player.health = statsSnapshot.playerHealth;

    showNotification('Changes reverted');
}

// ===================================
// NOTIFICACIONES Y UI
// ===================================

function showNotification(text) {
    const notif = document.getElementById('notification');
    notif.textContent = text;
    notif.style.display = 'block';

    setTimeout(() => {
        notif.style.display = 'none';
    }, 2200);
}

function showWaveCountdown(callback) {
    gameState.isCountdown = true;

    // Limpiar cualquier enemigo residual que pueda quedar
    enemies = [];
    bullets = bullets.filter(b => !b.fromBoss); // Limpiar balas de jefes

    const countdownEl = document.getElementById('waveCountdown');
    const countdownNumber = document.getElementById('countdownNumber');
    const countdownTitle = document.getElementById('countdownTitle');

    const isBossWave = gameState.wave % 5 === 0;
    countdownTitle.innerHTML = isBossWave ?
        `⚡ BOSS WAVE ${gameState.wave} ⚡` :
        `WAVE ${gameState.wave}`;

    countdownEl.style.display = 'block';

    let count = 5;
    countdownNumber.textContent = count;

    const interval = setInterval(() => {
        count--;
        if (count > 0) {
            countdownNumber.textContent = count;
            // Reiniciar animación
            countdownNumber.style.animation = 'none';
            setTimeout(() => {
                countdownNumber.style.animation = 'countdown-pulse 1s ease-in-out';
            }, 10);
        } else {
            clearInterval(interval);
            countdownEl.style.display = 'none';
            gameState.isCountdown = false;
            //console.log('⏰ Countdown finished! isCountdown:', gameState.isCountdown, 'enemiesToSpawn:', gameState.enemiesToSpawn);
            if (callback) callback();
        }
    }, 1000);
}

function nextWave() {
    gameState.wave++;
    gameState.enemiesPerWave = Math.floor(gameState.enemiesPerWave * 1.30);
    gameState.enemiesToSpawn = Math.min(gameState.enemiesPerWave, qualitySettings.maxEnemies);
    gameState.enemySpawnRate = Math.max(350, 1000 - gameState.wave * 45);

    // Resetear el estado del bonus x3 para la nueva oleada
    adBonusState.active = false;
    adBonusState.canWatch = true;
    adBonusState.usesRemaining = 0;
    //console.log('🔄 Bonus state reset for new wave:', JSON.stringify(adBonusState));

    // Wave de jefe (múltiplos de 5)
    const isBossWave = gameState.wave % 5 === 0;

    if (isBossWave) {
        // Limpiar cualquier enemigo residual antes de spawnear bosses
        enemies = [];
        const numBosses = Math.floor(gameState.wave / 10) + 1;
        gameState.enemiesToSpawn = 0; // No regular enemies in boss wave
        gameState.totalEnemiesInWave = numBosses;
    } else {
        gameState.totalEnemiesInWave = gameState.enemiesToSpawn;
    }

    updateHUD();

    // Mostrar cuenta regresiva antes de iniciar la wave
    showWaveCountdown(() => {
        // Después de la cuenta regresiva, iniciar la wave
        if (isBossWave) {
            const numBosses = Math.floor(gameState.wave / 10) + 1;

            // Spawnear jefes
            for (let i = 0; i < numBosses; i++) {
                setTimeout(() => spawnBoss(), i * 2000);
            }

            // Spawnear habilidades aleatorias en waves de jefe
            const numAbilities = 3 + Math.floor(gameState.wave / 10);
            for (let i = 0; i < numAbilities; i++) {
                setTimeout(() => {
                    const x = Math.random() * (window.innerWidth - 100) + 50;
                    const y = Math.random() * (window.innerHeight - gameAreaTop - 100) + gameAreaTop + 50;
                    spawnAbilityPickup(x, y);
                }, i * 3000 + 2000);
            }
        }

        // Mostrar indicador de wave brevemente
        const indicator = document.getElementById('waveIndicator');
        indicator.innerHTML = isBossWave ?
            `<div>⚡ BOSS WAVE ${gameState.wave} ⚡</div>` :
            `<div>WAVE ${gameState.wave}</div>`;
        indicator.style.display = 'block';

        setTimeout(() => {
            indicator.style.display = 'none';
        }, 2000);
    });
}

// Función para iniciar countdown de siguiente oleada (llamada desde modal de upgrades)
window.startNextWaveCountdown = function() {
    nextWave();
};

function updateHUD() {
    document.getElementById('waveDisplay').textContent = gameState.wave;
    document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
    document.getElementById('killsDisplay').textContent = gameState.kills;

    // Mostrar enemigos restantes/total
    const remainingEnemies = enemies.length + gameState.enemiesToSpawn;
    document.getElementById('enemiesDisplay').textContent = `${remainingEnemies}/${gameState.totalEnemiesInWave}`;

    const healthPercent = Math.max(0, (player.health / player.maxHealth) * 100);
    document.getElementById('healthBar').style.width = healthPercent + '%';
    document.getElementById('healthText').textContent = Math.max(0, Math.floor(player.health));
}

function gameOver() {
    gameState.isGameOver = true;
    gameState.isPlaying = false;

    document.getElementById('finalWave').textContent = gameState.wave;
    document.getElementById('finalScore').textContent = gameState.score.toLocaleString();

    // Actualizar tabla de stats en Game Over
    if (typeof window.updateGameOverStats === 'function') {
        window.updateGameOverStats();
    }

    document.getElementById('gameOver').classList.add('active');

    // Guardar partida solo una vez
    if (!gameState.partidaGuardada && window.guardarPartida && typeof window.guardarPartida === 'function') {
        window.guardarPartida(gameState.score, gameState.wave, gameState.kills);
        gameState.partidaGuardada = true;
    }
}

// Función para continuar la partida después de ver anuncio
function continueGameAfterAd() {
    //console.log('🎮 Continue game after ad');

    // Restaurar 25% de vida
    player.health = player.maxHealth * 0.25;

    // Limpiar enemigos cercanos (dar al jugador un respiro)
    const playerRadius = 200;
    enemies = enemies.filter(enemy => {
        const dist = Math.hypot(enemy.x - player.x, enemy.y - player.y);
        return dist > playerRadius;
    });

    // Limpiar balas enemigas
    bullets = bullets.filter(bullet => !bullet.fromBoss);

    // Reactivar el juego
    gameState.isGameOver = false;
    gameState.isPlaying = true;
    gameState.isPaused = false;

    // Cerrar pantalla de Game Over
    document.getElementById('gameOver').classList.remove('active');

    // Actualizar HUD
    updateHUD();

    // Notificar al usuario
    showNotification('💚 Restored 25% HP - Keep fighting!');
}

// Función para activar continue después de ver anuncio
function showAdForContinue() {
    if (continueAdState.isLoading) {
        //console.log('⚠️ Continue ad already loading - please wait');
        showNotification('⏳ Loading ad...');
        return false;
    }

    if (typeof Android !== 'undefined') {
        try {
            // Verificar si hay anuncio disponible antes de marcar como loading
            if (typeof Android.isRewardedAdReady === 'function' && !Android.isRewardedAdReady()) {
                console.warn('⚠️ No rewarded ad available for continue');
                showNotification('❌ No ad available right now');
                return false;
            }

            //console.log('📺 Showing Ad for Continue Game...');
            continueAdState.isLoading = true;
            showNotification('⏳ Loading ad...');

            Android.showRewardedAdForContinue();

            // Timeout de seguridad: si no hay respuesta en 3 segundos, resetear estado
            setTimeout(() => {
                if (continueAdState.isLoading) {
                    console.warn('⚠️ Continue ad load timeout - resetting loading state');
                    continueAdState.isLoading = false;
                    showNotification('❌ Ad not available, try again');
                }
            }, 3000); // Reducido de 10s a 3s

            // El callback será window.onAdRewardedContinue()
            return true;
        } catch (error) {
            console.error('❌ Error showing rewarded ad:', error);
            continueAdState.isLoading = false;
            return false;
        }
    } else {
        // Modo prueba en navegador
        //console.log('⚠️ AdMob not available (running in browser) - Continue for testing');
        onAdRewardedContinue();
        return true;
    }
}

// Callback llamado desde Android cuando se completa el anuncio de continue
function onAdRewardedContinue() {
    //console.log('🎁 Ad watched! Continuing game...');
    continueAdState.isLoading = false; // Resetear estado de loading
    continueGameAfterAd();
}

// Callback llamado desde Android si el anuncio de continue falla
function onAdFailedContinue() {
    console.warn('❌ Continue ad failed or was cancelled');
    continueAdState.isLoading = false;
    showNotification('❌ Ad not completed');
}

// Exponer funciones globalmente
window.continueGameAfterAd = continueGameAfterAd;
window.showAdForContinue = showAdForContinue;
window.onAdRewardedContinue = onAdRewardedContinue;
window.onAdFailedContinue = onAdFailedContinue;

// ===================================
// GAME LOGIC
// ===================================

function findNearestEnemy() {
    if (enemies.length === 0) return null;

    let nearest = enemies[0];
    let minDist = Math.hypot(nearest.x - player.x, nearest.y - player.y);

    for (let i = 1; i < enemies.length; i++) {
        const dist = Math.hypot(enemies[i].x - player.x, enemies[i].y - player.y);
        if (dist < minDist) {
            minDist = dist;
            nearest = enemies[i];
        }
    }

    return nearest;
}

// Update player movement only (for countdown mode)
function updatePlayerMovement() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Calculate velocity
    let vx = 0;
    let vy = 0;

    // MOVE PLAYER
    if (joystickManager) {
        const moveInput = joystickManager.getMovementInput();
        if (moveInput.isActive) {
            // Movimiento directo en coordenadas del mundo (cartesiano)
            // La proyección isométrica solo afecta el renderizado, no la física
            vx = moveInput.x * player.speed;
            vy = moveInput.y * player.speed;
        }
    }

    // Apply movement with collision detection
    if (window.gameMapSystem) {
        // Use sliding collision system
        const newPos = window.gameMapSystem.moveWithCollision(
            player.x, player.y, vx, vy, player.radius
        );
        player.x = newPos.x;
        player.y = newPos.y;
    } else {
        // Fallback: simple bounds clamping
        player.x += vx;
        player.y += vy;
        player.x = Math.max(player.radius, Math.min(screenWidth - player.radius, player.x));
        player.y = Math.max(gameAreaTop + player.radius, Math.min(screenHeight - player.radius, player.y));

        // Actualizar última posición
        player.lastX = player.x;
        player.lastY = player.y;
    }
}

// Update ability pickups only (for countdown mode)
function updateAbilityPickups() {
    abilityPickups = abilityPickups.filter(pickup => {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const magnetRadius = (pickup.radius + player.radius) * (playerStats.pickupMagnet.currentValue / playerStats.pickupMagnet.baseValue);
        if (dist < magnetRadius) {
            collectedAbility = pickup.ability;
            updateAbilityButton();
            showNotification(`${pickup.ability.icon} ${pickup.ability.name} - ${isMobileDevice ? 'Tap Ability' : 'Press SPACE'}`);
            return false;
        }

        pickup.rotation += 0.06;
        pickup.pulse += 0.1;
        pickup.life -= 0.014;

        return pickup.life > 0;
    });
}

// Update only visual effects and pickups during countdown
function updateVisualsDuranteCountdown() {
    // Update ability pickups (sin recoger por enemigos)
    abilityPickups = abilityPickups.filter(pickup => {
        pickup.rotation += 0.06;
        pickup.pulse += 0.1;
        pickup.life -= 0.014;
        return pickup.life > 0;
    });

    // Update particles
    particles = particles.filter(p => {
        if (p.type === 'lightning') {
            p.life -= 0.05;
            return p.life > 0;
        } else if (p.type === 'ring') {
            p.radius = p.maxRadius * (1 - p.life);
            p.life -= 0.02;
            return p.life > 0;
        } else if (p.type === 'explosion') {
            p.radius = p.maxRadius * (1 - p.life);
            p.life -= 0.015;
            return p.life > 0;
        } else {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= 0.018;
            return p.life > 0;
        }
    });

    if (particles.length > qualitySettings.maxParticles) {
        particles = particles.slice(-qualitySettings.maxParticles);
    }
}

function update() {
    if (!gameState.isPlaying || gameState.isGameOver || gameState.isPaused) return;

    const now = Date.now();
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // UPDATE AMMO SYSTEM (Brawl Stars reload)
    if (ammoSystem) {
        ammoSystem.update(performance.now());
    }

    // UPDATE SUPER SYSTEM (Brawl Stars super/ultimate)
    if (superSystem) {
        const deltaTime = 16; // Aproximado a 60fps
        superSystem.update(deltaTime);
    }

    // HEALTH REGENERATION
    if (player.health < player.maxHealth && playerStats.regeneration.currentValue > 0) {
        if (!player.lastRegenTime) player.lastRegenTime = now;
        const timeSinceLastRegen = (now - player.lastRegenTime) / 1000; // Convert to seconds
        const regenAmount = playerStats.regeneration.currentValue * timeSinceLastRegen;
        player.health = Math.min(player.maxHealth, player.health + regenAmount);
        player.lastRegenTime = now;
        if (regenAmount > 0.1) { // Update HUD if significant regen occurred
            updateHUD();
        }
    }

    // MOVE PLAYER - Mobile (Dynamic Joystick) and PC (Keyboard)
    let vx = 0;
    let vy = 0;

    // Get input from dynamic joystick if available
    if (joystickManager) {
        const moveInput = joystickManager.getMovementInput();
        if (moveInput.isActive) {
            // TRANSFORMACIÓN ISOMÉTRICA: Convertir entrada de pantalla a espacio del mundo
            // En vista isométrica, necesitamos rotar las direcciones para que sean intuitivas
            if (typeof IsometricTransform !== 'undefined' && typeof IsometricTransform.screenDirectionToWorld === 'function') {
                // Usar transformación isométrica si está disponible
                const worldDir = IsometricTransform.screenDirectionToWorld(moveInput.x, moveInput.y);
                vx = worldDir.x * player.speed;
                vy = worldDir.y * player.speed;
            } else {
                // Fallback: movimiento cartesiano directo (modo 2D plano)
                vx = moveInput.x * player.speed;
                vy = moveInput.y * player.speed;
            }
        }
    }

    // Apply movement with collision detection
    if (window.gameMapSystem) {
        // Use sliding collision system
        const newPos = window.gameMapSystem.moveWithCollision(
            player.x, player.y, vx, vy, player.radius
        );
        player.x = newPos.x;
        player.y = newPos.y;
    } else {
        // Fallback: simple bounds clamping
        player.x += vx;
        player.y += vy;
        player.x = Math.max(player.radius, Math.min(screenWidth - player.radius, player.x));
        player.y = Math.max(gameAreaTop + player.radius, Math.min(screenHeight - player.radius, player.y));
    }

    // SHOOTING - Mobile (Dynamic Joystick) and PC (Mouse)
    if (joystickManager) {
        // Detectar si el joystick derecho acaba de ser soltado
        if (window._joystickRightJustReleased) {
            console.log('🎯 JOYSTICK RIGHT RELEASED:', {
                strength: window._joystickRightLastStrength,
                angle: window._joystickRightLastAngle,
                isDrag: window._joystickRightLastStrength > 0.25
            });

            // Si fue drag (strength > 0.25), disparar en esa dirección
            if (window._joystickRightLastStrength > 0.25) {
                const shootAngle = window._joystickRightLastAngle;
                player.angle = shootAngle;
                console.log('   → Disparo manual en ángulo:', shootAngle);
                if (now - player.lastShootTime >= getShootCooldown()) {
                    if (ammoSystem && ammoSystem.canShoot()) {
                        if (ammoSystem.tryShoot()) {
                            console.log('   ✅ Disparando (con ammo system)');
                            createPlayerBullet(shootAngle);
                            player.lastShootTime = now;
                        } else {
                            console.log('   ❌ tryShoot falló');
                        }
                    } else if (!ammoSystem) {
                        console.log('   ✅ Disparando (sin ammo system)');
                        createPlayerBullet(shootAngle);
                        player.lastShootTime = now;
                    }
                } else {

                                       console.log('   ⏱️ Cooldown activo');
                }
            } else {
                // Tap corto: disparo automático (auto-aim si hay objetivo, si no, en la última dirección de movimiento)
                let shootAngle;
                const targetEnemy = findClosestEnemy(600);
                if (targetEnemy) {
                    shootAngle = calculateAimAngle(targetEnemy);
                    console.log('   → Auto-aim a enemigo en ángulo:', shootAngle);
                } else {
                    // Sin enemigo: disparar en la última dirección de movimiento
                    const moveInput = joystickManager.getMovementInput();
                    shootAngle = moveInput.isActive ? moveInput.angle : player.angle;
                    console.log('   → Disparo en última dirección:', shootAngle);
                }
                player.angle = shootAngle;
                if (now - player.lastShootTime >= getShootCooldown()) {
                    if (ammoSystem && ammoSystem.canShoot()) {
                        if (ammoSystem.tryShoot()) {
                            console.log('   ✅ Disparando auto-aim (con ammo)');
                            createPlayerBullet(shootAngle);
                            player.lastShootTime = now;
                        } else {
                            console.log('   ❌ tryShoot falló (auto-aim)');
                        }
                    } else if (!ammoSystem) {
                        console.log('   ✅ Disparando auto-aim (sin ammo)');
                        createPlayerBullet(shootAngle);
                        player.lastShootTime = now;
                    }
                } else {
                    console.log('   ⏱️ Cooldown activo (auto-aim)');
                }
            }
            window._joystickRightJustReleased = false;
        }
    }

    // Spawn enemies (skip in boss wave and countdown)
    const isBossWave = gameState.wave % 5 === 0;



    if (!gameState.isCountdown && !isBossWave && gameState.enemiesToSpawn > 0 && now - gameState.lastEnemySpawn > gameState.enemySpawnRate) {
        //console.log('✅ Spawning enemy! Remaining:', gameState.enemiesToSpawn - 1);
        spawnEnemy();
        gameState.enemiesToSpawn--;
        gameState.lastEnemySpawn = now;
    }

    if (!gameState.isCountdown && enemies.length === 0 && gameState.enemiesToSpawn === 0) {
        // Oleada completada - mostrar modal de upgrades

        // Verificar si debemos mostrar anuncio en este nivel
        const shouldShowAd = shouldShowAdForWave(gameState.wave);

        if (shouldShowAd && gameState.wave !== lastBossWaveCompleted) {
            lastBossWaveCompleted = gameState.wave;
            // Mostrar anuncio intersticial
            showInterstitialAd();
        }

        // Pausar el juego y mostrar modal de upgrades
        gameState.isPaused = true;

        // Pequeña pausa para que el jugador vea que la oleada terminó
        let attempts = 0;
        const checkModal = () => {
            attempts++;
            //console.log(`🔍 Checking for showUpgradeModal (attempt ${attempts})...`);
            if (typeof window.showUpgradeModal === 'function') {
                //console.log('✅ showUpgradeModal found, calling it...');
                window.showUpgradeModal();
            } else if (attempts < 50) { // Check for up to 5 seconds
                //console.log('⏳ showUpgradeModal not ready yet, retrying...');
                setTimeout(checkModal, 100);
            } else {
                // Fallback si el modal no está disponible
                console.warn('Upgrade modal not available after 5 seconds, continuing...');
                gameState.isPaused = false;
                nextWave();
            }
        };
        setTimeout(checkModal, 1000);
    }    // Update enemies
    enemies.forEach(enemy => {
        if (window.gameMapSystem) {
            const enemyTile = window.gameMapSystem.worldToTile(enemy.x, enemy.y);
            const playerTile = window.gameMapSystem.worldToTile(player.x, player.y);
            // Si el jugador está en bush, modo random walk
            if (window.gameMapSystem.isInBush(player.x, player.y)) {
                if (!enemy.randomWalk) {
                    enemy.randomWalk = {
                        lastDir: null,
                        targetTile: enemyTile
                    };
                }
                // Si llegó al tile objetivo o no tiene objetivo
                if (!enemy.randomWalk.targetTile || (enemyTile.x === enemy.randomWalk.targetTile.x && enemyTile.y === enemy.randomWalk.targetTile.y)) {
                    // Buscar intersección
                    const dirs = [
                        { x: 0, y: -1 }, // N
                        { x: 1, y: 0 },  // E
                        { x: 0, y: 1 },  // S
                        { x: -1, y: 0 }   // W
                    ];
                    const validDirs = [];
                    for (const dir of dirs) {
                        const nx = enemyTile.x + dir.x;
                        const ny = enemyTile.y + dir.y;
                        if (window.gameMapSystem.isWalkable(nx, ny)) {
                            // Evitar la dirección de la que venía
                            if (!enemy.randomWalk.lastDir || dir.x !== -enemy.randomWalk.lastDir.x || dir.y !== -enemy.randomWalk.lastDir.y) {
                                validDirs.push(dir);
                            }
                        }
                    }
                    // Si solo hay una dirección disponible, tomarla aunque sea la que venía
                    let chosenDir = null;
                    if (validDirs.length === 1) {
                        chosenDir = validDirs[0];
                    } else if (validDirs.length > 1) {
                        chosenDir = validDirs[Math.floor(Math.random() * validDirs.length)];
                    } else {
                        // Si no hay ninguna dirección válida, retroceder por la que venía
                        if (enemy.randomWalk.lastDir) {
                            chosenDir = { x: -enemy.randomWalk.lastDir.x, y: -enemy.randomWalk.lastDir.y };
                        }
                    }
                    if (chosenDir) {
                        enemy.randomWalk.lastDir = chosenDir;
                        enemy.randomWalk.targetTile = {
                            x: enemyTile.x + chosenDir.x,
                            y: enemyTile.y + chosenDir.y
                        };
                    }
                }
                // Mover hacia el tile objetivo
                const target = enemy.randomWalk.targetTile;
                const targetWorld = window.gameMapSystem.tileToWorld(target.x, target.y);
                const dx = targetWorld.x - enemy.x;
                const dy = targetWorld.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist > 2) {
                    const vx = (dx / dist) * enemy.speed;
                    const vy = (dy / dist) * enemy.speed;
                    const newPos = window.gameMapSystem.moveWithCollision(
                        enemy.x, enemy.y, vx, vy, enemy.radius
                    );
                    enemy.x = newPos.x;
                    enemy.y = newPos.y;
                }
            } else {
                // Pathfinding A*
                if (!enemy.path || enemy.path.length === 0 || (enemy.pathTargetX !== playerTile.x || enemy.pathTargetY !== playerTile.y)) {
                    enemy.path = window.gameMapSystem.findPathAStar(enemyTile, playerTile);
                    enemy.pathStep = 0;
                    enemy.pathTargetX = playerTile.x;
                    enemy.pathTargetY = playerTile.y;
                }
                // Seguir el path SOLO si existe y está activo
                enemy.isFollowingPath = false;
                if (enemy.path && enemy.path.length > 1 && enemy.pathStep < enemy.path.length) {
                    const nextTile = enemy.path[enemy.pathStep + 1] || enemy.path[enemy.pathStep];
                    const nextWorld = window.gameMapSystem.tileToWorld(nextTile.x, nextTile.y);
                    const dx = nextWorld.x - enemy.x;
                    const dy = nextWorld.y - enemy.y;
                    const dist = Math.sqrt(dx * dx + dy * dy);
                    if (dist > 2) {
                        const vx = (dx / dist) * enemy.speed;
                        const vy = (dy / dist) * enemy.speed;
                        const newPos = window.gameMapSystem.moveWithCollision(
                            enemy.x, enemy.y, vx, vy, enemy.radius
                        );
                        enemy.x = newPos.x;
                        enemy.y = newPos.y;
                        enemy.isFollowingPath = true;
                        // Si el enemigo está suficientemente cerca del tile objetivo, avanzar al siguiente paso
                        if (Math.abs(enemy.x - nextWorld.x) < 4 && Math.abs(enemy.y - nextWorld.y) < 4) {
                            enemy.pathStep++;
                        }
                    }
                }
                // Limpiar modo random walk si sale del bush
                if (enemy.randomWalk) delete enemy.randomWalk;
            }
        } else {
            // Fallback: movimiento directo sin pathfinding
            const dx = player.x - enemy.x;
            const dy = player.y - enemy.y;
            const dist = Math.sqrt(dx * dx + dy * dy);
            if (dist > 0) {
                const vx = (dx / dist) * enemy.speed;
                const vy = (dy / dist) * enemy.speed;
                enemy.x += vx;
                enemy.y += vy;
            }
        }

        // Comportamiento de jefes
        if (enemy.isBoss) {
            enemy.aimX = player.x;
            enemy.aimY = player.y;

            // Disparo del jefe
            if (now - enemy.lastShootTime > enemy.shootRate) {
                const angle = Math.atan2(player.y - enemy.y, player.x - enemy.x);
                bullets.push({
                    x: enemy.x,
                    y: enemy.y,
                    vx: Math.cos(angle) * 10 * ViewportScale.scale,
                    vy: Math.sin(angle) * 10 * ViewportScale.scale,
                    radius: ViewportScale.bulletSize * 0.75, // RESPONSIVE BOSS BULLET
                    damage: 10 + gameState.wave * 2,
                    color: '#8800ff',
                    trail: [],
                    glow: true,
                    fromBoss: true
                });
                enemy.lastShootTime = now;
            }

            // Jefe recoge habilidades
            abilityPickups.forEach((pickup, index) => {
                const pickupDist = Math.sqrt(
                    Math.pow(enemy.x - pickup.x, 2) +
                    Math.pow(enemy.y - pickup.y, 2)
                );
                if (pickupDist < enemy.radius + pickup.radius) {
                    enemy.collectedAbility = pickup.ability;
                    abilityPickups.splice(index, 1);
                }
            });

            // Jefe usa habilidades inteligentemente
            if (enemy.collectedAbility && enemy.health < enemy.maxHealth * 0.5) {
                if (enemy.collectedAbility.id === 'heal') {
                    enemy.health = Math.min(enemy.maxHealth, enemy.health + 100);
                    createParticles(enemy.x, enemy.y, 40, '#ff00ff');
                    enemy.collectedAbility = null;
                } else if (enemy.collectedAbility.id === 'fireball') {
                    for (let i = 0; i < 6; i++) {
                        const angle = (Math.PI * 2 / 6) * i;
                        bullets.push({
                            x: enemy.x,
                            y: enemy.y,
                            vx: Math.cos(angle) * 11 * ViewportScale.scale,
                            vy: Math.sin(angle) * 11 * ViewportScale.scale,
                            radius: ViewportScale.bulletSize * 2.2, // RESPONSIVE BOSS FIREBALL
                            damage: 60,
                            color: '#ff4400',
                            trail: [],
                            glow: true,
                            fromBoss: true
                        });
                    }
                    createParticles(enemy.x, enemy.y, 35, '#ff4400');
                    enemy.collectedAbility = null;
                }
            }
        }

        // Colisión con el jugador - DAÑO CON FEEDBACK
        const distToPlayer = Math.sqrt((enemy.x - player.x) * (enemy.x - player.x) + (enemy.y - player.y) * (enemy.y - player.y));
        if (distToPlayer < enemy.radius + player.radius) {
            const currentTime = Date.now();
            const oldHealth = player.health;
            const baseDamage = enemy.damage * 0.012;
            const actualDamage = baseDamage * (playerStats.resilience.baseValue / playerStats.resilience.currentValue);
            player.health -= actualDamage;

            // Reproducir sonido y vibración solo si ha pasado tiempo suficiente
            if (currentTime - lastHealthDamageTime > 200 && player.health < oldHealth) {
                playDamageSound();
                vibrateDevice(50);
                lastHealthDamageTime = currentTime;
            }

            updateHUD(); // Actualizar barra de vida inmediatamente

            if (player.health <= 0) {
                gameOver();
            }
        }
    });

    // Update bullets
    if (bullets.length > 0) {
        console.log('🔄 Updating', bullets.length, 'bullets');
    }
    bullets = bullets.filter(bullet => {
        const oldX = bullet.x;
        const oldY = bullet.y;

        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        // Check wall collision with raycast
        if (window.gameMapSystem) {
            const raycastResult = window.gameMapSystem.raycast(oldX, oldY, bullet.x, bullet.y);
            if (raycastResult.hit) {
                // Bullet hit a wall, destroy it
                console.log('💥 BULLET HIT WALL:', {
                    bulletPos: {x: bullet.x, y: bullet.y},
                    hitPos: {x: raycastResult.x, y: raycastResult.y},
                    traveled: Math.sqrt((bullet.x - oldX)**2 + (bullet.y - oldY)**2)
                });
                createParticles(raycastResult.x, raycastResult.y, 8, bullet.color);
                return false;
            }
        }

        bullet.trail.push({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > qualitySettings.trailLength) bullet.trail.shift();

        // Check if bullet is out of world bounds (not screen bounds!)
        const worldWidth = window.gameMapSystem ? window.gameMapSystem.width * window.gameMapSystem.tileSize : 2400;
        const worldHeight = window.gameMapSystem ? window.gameMapSystem.height * window.gameMapSystem.tileSize : 2400;

        if (bullet.x < -200 || bullet.x > worldWidth + 200 ||
            bullet.y < -200 || bullet.y > worldHeight + 200) {
            console.log('🌌 BULLET OUT OF WORLD BOUNDS:', {x: bullet.x, y: bullet.y, worldWidth, worldHeight});
            return false;
        }

        let hit = false;

        // Balas del jefe dañan al jugador
        if (bullet.fromBoss) {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + bullet.radius) {
                const actualDamage = bullet.damage * (playerStats.resilience.baseValue / playerStats.resilience.currentValue);
                player.health -= actualDamage;
                hit = true;
                createParticles(player.x, player.y, 15, bullet.color);
                playDamageSound();
                vibrateDevice(50);
                updateHUD();

                if (player.health <= 0) {
                    gameOver();
                }
            }
        } else {
            // Balas del jugador dañan enemigos
            enemies.forEach(enemy => {
                const dx = bullet.x - enemy.x;
                const dy = bullet.y - enemy.y;
                const dist = Math.sqrt(dx * dx + dy * dy);

                if (dist < enemy.radius + bullet.radius) {
                    enemy.health -= bullet.damage;
                    hit = true;

                    console.log('🎯 BULLET HIT ENEMY!', {damage: bullet.damage, enemyHealth: enemy.health});

                    // Cargar super con el daño infligido
                    if (superSystem) {
                        superSystem.addCharge(bullet.damage);
                    }

                    // FASE 5: Mostrar número de daño flotante
                    createDamageNumber(enemy.x, enemy.y, bullet.damage, bullet.isCritical);

                    // IMPROVED IMPACT EFFECTS (Brawl Stars style)
                    // Más partículas para críticos
                    const particleCount = bullet.isCritical ? 20 : 12;
                    createParticles(enemy.x, enemy.y, particleCount, bullet.color);

                    // Partículas adicionales en dirección del impacto
                    const impactAngle = Math.atan2(dy, dx);
                    for (let i = 0; i < 5; i++) {
                        particles.push({
                            x: bullet.x,
                            y: bullet.y,
                            vx: Math.cos(impactAngle + (Math.random() - 0.5) * 0.5) * 8,
                            vy: Math.sin(impactAngle + (Math.random() - 0.5) * 0.5) * 8,
                            radius: 3 + Math.random() * 2,
                            color: bullet.color,
                            life: 1,
                            gravity: 0.1
                        });
                    }
                }
            });
        }

        return !hit;
    });

    // Remove dead enemies
    enemies = enemies.filter(enemy => {
        if (enemy.health <= 0) {
            gameState.kills++;

            // Sistema de experiencia - otorgar XP según tipo y oleada
            grantExperience(enemy);

            // Score según tipo de enemigo
            let scoreBonus = 100;
            if (enemy.isBoss) {
                scoreBonus = 1000 * gameState.wave;
                showNotification('🏆 BOSS DEFEATED! 🏆');
                // Eliminar de array de jefes
                const bossIndex = bosses.indexOf(enemy);
                if (bossIndex > -1) bosses.splice(bossIndex, 1);
            } else if (enemy.type === 'SUPERHEAVY') {
                scoreBonus = 250;
            } else if (enemy.type === 'HEAVY') {
                scoreBonus = 180;
            } else if (enemy.type === 'FAST') {
                scoreBonus = 120;
            } else if (enemy.type === 'EXPLOSIVE') {
                scoreBonus = 150;
            }

            gameState.score += scoreBonus * gameState.wave;
            createParticles(enemy.x, enemy.y, isMobileDevice ? 25 : 35, enemy.color);

            // Explosión si es explosivo
            if (enemy.explosive) {
                handleExplosion(enemy.x, enemy.y, enemy.radius);
            }

            // Drop de habilidad según tipo
            if (Math.random() < enemy.abilityDropChance) {
                spawnAbilityPickup(enemy.x, enemy.y);
            }

            updateHUD();
            return false;
        }
        return true;
    });

    // Update ability pickups
    abilityPickups = abilityPickups.filter(pickup => {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        const magnetRadius = (pickup.radius + player.radius) * (playerStats.pickupMagnet.currentValue / playerStats.pickupMagnet.baseValue);
        if (dist < magnetRadius) {
            collectedAbility = pickup.ability;
            updateAbilityButton();
            showNotification(`${pickup.ability.icon} ${pickup.ability.name} - ${isMobileDevice ? 'Tap Ability' : 'Press SPACE'}`);
            return false;
        }

        pickup.rotation += 0.06;
        pickup.pulse += 0.1;
        pickup.life -= 0.014;

        return pickup.life > 0;
    });

    // Update particles
    particles = particles.filter(p => {
        if (p.type === 'lightning') {
            p.life -= 0.05;
            return p.life > 0;
        } else if (p.type === 'ring') {
            p.radius = p.maxRadius * (1 - p.life);
            p.life -= 0.02;
            return p.life > 0;
        } else if (p.type === 'explosion') {
            p.radius = p.maxRadius * (1 - p.life);
            p.life -= 0.015;
            return p.life > 0;
        } else {
            p.x += p.vx;
            p.y += p.vy;
            p.vx *= 0.96;
            p.vy *= 0.96;
            p.life -= 0.018;
            return p.life > 0;
        }
    });

    if (particles.length > qualitySettings.maxParticles) {
        particles = particles.slice(-qualitySettings.maxParticles);
    }

    // FASE 5: Update damage numbers (números de daño flotantes)
    damageNumbers = damageNumbers.filter(dn => {
        dn.x += dn.vx;
        dn.y += dn.vy;
        dn.vy -= 0.08; // Gravedad inversa (suben)
        dn.vx *= 0.95; // Fricción horizontal
        dn.life -= 0.02;
        dn.scale *= 0.98; // Reducir tamaño gradualmente
        return dn.life > 0;
    });
}

// ===================================
// RENDER
// ===================================

function render() {
    if (frameCount === 1 || frameCount % 300 === 0) {
        console.log('🎨 Render() llamado - Frame:', frameCount);
    }

    if (!ctx || !canvas) {
        console.error('❌ RENDER ERROR: ctx or canvas is null!', { ctx: !!ctx, canvas: !!canvas });
        return;
    }

    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // DEBUG: Verificar estado del canvas SIEMPRE al inicio
    // ...log eliminado...

    // Ensure globalAlpha is 1 before starting
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
    ctx.shadowColor = 'transparent';

    // Clear with gradient
    const gradient = ctx.createRadialGradient(
        screenWidth / 2, screenHeight / 2, 0,
        screenWidth / 2, screenHeight / 2, screenWidth / 2
    );
    gradient.addColorStop(0, '#101049ff');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Reset context state after clearing
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // ===================================
    // SISTEMA DE TRANSFORMACIÓN GLOBAL CON ZOOM
    // ===================================

    // Calcular offset de cámara desde el MapSystem
    let cameraX = window.gameMapSystem?.camera.x || (player.x - screenWidth / 2);
    let cameraY = window.gameMapSystem?.camera.y || (player.y - screenHeight / 2);

    // Obtener zoom de cámara
    const cameraZoom = ViewportScale.getCameraZoom();
    const zoomScale = 1 / cameraZoom;

    // Aplicar transformación global: zoom + offset de cámara
    ctx.save();
    ctx.scale(zoomScale, zoomScale);

    // Renderizado con depth sorting isométrico: mapa, muros y entidades se dibujan en orden de profundidad
    if (window.gameMapSystem && typeof window.gameMapSystem.render === 'function') {
        // Actualizar cámara del MapSystem con zoom
        if (window.minimapCameraActive) {
            window.gameMapSystem.updateCamera(
                window.minimapCameraTarget.x,
                window.minimapCameraTarget.y,
                screenWidth,
                screenHeight,
                true,
                cameraZoom
            );
        } else {
            window.gameMapSystem.updateCamera(
                player.x,
                player.y,
                screenWidth,
                screenHeight,
                false,
                cameraZoom
            );
        }

        const cameraX = window.gameMapSystem.camera.x;
        const cameraY = window.gameMapSystem.camera.y;

        // ============================================

        // DEPTH SORTING ISOMÉTRICO
        // ============================================

        // Renderizar mapa completo primero (suelos y fondo)
        console.log("DIAGNÓSTICO FASE 2: renderer isométrico", window.gameMapSystem.isometricRenderer);
        if (!window.gameMapSystem.isometricRenderer) {
            console.error("ERROR: El renderer isométrico no está disponible");
        }
        console.log("DIAGNÓSTICO FASE 3: llamando a gameMapSystem.render");
        window.gameMapSystem.render(ctx, cameraX, cameraY);

        // Crear lista de entidades con profundidad para depth sorting
        const drawables = [];

        // Añadir jugador
        drawables.push({
            type: 'player',
            depth: player.y + player.radius, // Profundidad basada en Y
            data: player
        });

        // Añadir enemigos
        enemies.forEach((enemy, index) => {
            drawables.push({
                type: 'enemy',
                depth: enemy.y + enemy.radius,
                data: enemy,
                id: index
            });
        });

        // ORDENAR POR PROFUNDIDAD (menor Y = más atrás = renderizar primero)
        drawables.sort((a, b) => a.depth - b.depth);

        // RENDERIZAR ENTIDADES EN ORDEN
        drawables.forEach(drawable => {
            if (drawable.type === 'player') {
                // Renderizar jugador isométrico
                if (typeof IsometricEntityRenderer !== 'undefined' && typeof IsometricEntityRenderer.renderPlayerIsometric === 'function') {
                    IsometricEntityRenderer.renderPlayerIsometric(ctx, drawable.data, cameraX, cameraY);
                } else {
                    // Fallback 2D
                    renderPlayer2D(ctx, drawable.data, cameraX, cameraY);
                }
            } else if (drawable.type === 'enemy') {
                // Renderizar enemigo isométrico
                if (typeof IsometricEntityRenderer !== 'undefined' && typeof IsometricEntityRenderer.renderEnemyIsometric === 'function') {
                    IsometricEntityRenderer.renderEnemyIsometric(ctx, drawable.data, cameraX, cameraY);
                } else {
                    // Fallback 2D
                    renderEnemy2D(ctx, drawable.data, cameraX, cameraY);
                }
            }
        });
    }
// Función para renderizar un enemigo en 2D (fallback)
function renderEnemy2D(ctx, enemy, cameraX, cameraY) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(enemy.x - cameraX, enemy.y - cameraY, enemy.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
        enemy.x - cameraX - enemy.radius * 0.4,
        enemy.y - cameraY - enemy.radius * 0.4,
        enemy.radius * 0.2,
        enemy.x - cameraX,
        enemy.y - cameraY,
        enemy.radius
    );
    grad.addColorStop(0, '#fff');
    grad.addColorStop(0.45, enemy.color);
    grad.addColorStop(1, '#222');
    ctx.fillStyle = grad;
    ctx.shadowColor = enemy.color;
    ctx.shadowBlur = enemy.isBoss ? qualitySettings.shadowBlur * 3 : qualitySettings.shadowBlur * 1.5;
    ctx.globalAlpha = 0.98;
    ctx.fill();
    ctx.globalAlpha = 0.18;
    ctx.beginPath();
    ctx.arc(enemy.x - cameraX - enemy.radius * 0.35, enemy.y - cameraY - enemy.radius * 0.35, enemy.radius * 0.32, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
}

// Función para renderizar el jugador en 2D (fallback)
function renderPlayer2D(ctx, player, cameraX, cameraY) {
    ctx.save();
    ctx.beginPath();
    ctx.arc(player.x - cameraX, player.y - cameraY, player.radius, 0, Math.PI * 2);
    const grad = ctx.createRadialGradient(
        player.x - cameraX - player.radius * 0.4,
        player.y - cameraY - player.radius * 0.4,
        player.radius * 0.2,
        player.x - cameraX,
        player.y - cameraY,
        player.radius
    );
    grad.addColorStop(0, '#B8FFD6');
    grad.addColorStop(0.45, player.color);
    grad.addColorStop(1, '#1B6B3C');
    ctx.fillStyle = grad;
    ctx.shadowColor = player.color;
    ctx.shadowBlur = qualitySettings.shadowBlur * 2;
    ctx.globalAlpha = 0.98;
    ctx.fill();
    ctx.globalAlpha = 0.25;
    ctx.beginPath();
    ctx.arc(player.x - cameraX - player.radius * 0.35, player.y - cameraY - player.radius * 0.35, player.radius * 0.35, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.globalAlpha = 1.0;
    ctx.restore();
}

    // Render special particles y normal particles
    particles.forEach(p => {
        // Usar renderizado isométrico si está disponible
        if (typeof IsometricEntityRenderer !== 'undefined' && typeof IsometricEntityRenderer.renderParticleIsometric === 'function') {
            IsometricEntityRenderer.renderParticleIsometric(ctx, p, cameraX, cameraY);
            return; // Ya renderizado
        }

        // Fallback: Renderizado cartesiano (2D plano)
        if (p.type === 'lightning') {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 4;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(p.x1 - cameraX, p.y1 - cameraY);
            ctx.lineTo(p.x2 - cameraX, p.y2 - cameraY);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (p.type === 'ring') {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(p.x - cameraX, p.y - cameraY, p.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (p.type === 'explosion') {
            ctx.globalAlpha = (p.life / p.maxLife) * 0.4;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(p.x - cameraX, p.y - cameraY, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        } else {
            // Partículas normales
            const alpha = p.life / p.maxLife;
            ctx.globalAlpha = alpha;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 0.5;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x - cameraX, p.y - cameraY, p.radius, 0, Math.PI * 2);
            ctx.fill();
        }
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // FASE 5: Render damage numbers (números de daño flotantes)
    damageNumbers.forEach(dn => {
        // Usar renderizado isométrico si está disponible
        if (typeof IsometricEntityRenderer !== 'undefined' && typeof IsometricEntityRenderer.renderDamageNumberIsometric === 'function') {
            IsometricEntityRenderer.renderDamageNumberIsometric(ctx, dn, cameraX, cameraY);
            return; // Ya renderizado
        }

        // Fallback: Renderizado cartesiano (2D plano)
        ctx.save();
        ctx.translate(dn.x - cameraX, dn.y - cameraY);
        ctx.rotate(dn.rotation);
        ctx.scale(dn.scale, dn.scale);

        const alpha = dn.life;
        ctx.globalAlpha = alpha;

        // Sombra para legibilidad
        ctx.shadowColor = '#000000';
        ctx.shadowBlur = 8;
        ctx.lineWidth = 4;
        ctx.strokeStyle = '#000000';

        // Texto del daño
        const fontSize = dn.isCritical ? 28 : 20;
        ctx.font = `bold ${fontSize}px Orbitron`;
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';

        // Contorno negro
        ctx.strokeText(dn.damage.toString(), 0, 0);

        // Color según tipo
        ctx.shadowBlur = dn.isCritical ? 15 : 8;
        ctx.shadowColor = dn.isCritical ? '#ff00ff' : '#ffff00';
        ctx.fillStyle = dn.isCritical ? '#ff00ff' : '#ffffff';
        ctx.fillText(dn.damage.toString(), 0, 0);

        ctx.restore();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Render ability pickups
    abilityPickups.forEach(pickup => {
        // Usar renderizado isométrico si está disponible
        if (typeof IsometricEntityRenderer !== 'undefined' && typeof IsometricEntityRenderer.renderAbilityPickupIsometric === 'function') {
            IsometricEntityRenderer.renderAbilityPickupIsometric(ctx, pickup, cameraX, cameraY);
            return; // Ya renderizado
        }

        // Fallback: Renderizado cartesiano (2D plano)
        ctx.save();
        ctx.translate(pickup.x - cameraX, pickup.y - cameraY);
        ctx.rotate(pickup.rotation);

        const pulseSize = Math.sin(pickup.pulse) * 5;
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = qualitySettings.shadowBlur * 2;
        ctx.fillStyle = 'rgba(255, 0, 255, 0.3)';
        ctx.beginPath();
        ctx.arc(0, 0, pickup.radius + 10 + pulseSize, 0, Math.PI * 2);
        ctx.fill();

        ctx.font = `bold ${isMobileDevice ? 40 : 35}px Orbitron`;
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText(pickup.ability.icon, 0, 0);
        ctx.restore();
    });

    // Render bullets (IMPROVED - Brawl Stars style con proyección isométrica)
    bullets.forEach(bullet => {
        // Usar renderizado isométrico si está disponible
        if (typeof IsometricEntityRenderer !== 'undefined' && typeof IsometricEntityRenderer.renderBulletIsometric === 'function') {
            IsometricEntityRenderer.renderBulletIsometric(ctx, bullet, cameraX, cameraY);
            return; // Ya renderizado
        }

        // Fallback: Renderizado cartesiano (2D plano)
        // Trail effect (estela)
        bullet.trail.forEach((point, i) => {
            const alpha = i / bullet.trail.length;
            ctx.globalAlpha = alpha * 0.6;
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 0.5;
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(point.x - cameraX, point.y - cameraY, bullet.radius * alpha * 0.8, 0, Math.PI * 2);
            ctx.fill();
        });

        // Outer glow (resplandor exterior)
        ctx.globalAlpha = 0.4;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = qualitySettings.shadowBlur * 2;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x - cameraX, bullet.y - cameraY, bullet.radius * 1.8, 0, Math.PI * 2);
        ctx.fill();

        // Main bullet body (cuerpo principal)
        ctx.globalAlpha = 1;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = qualitySettings.shadowBlur * 1.5;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x - cameraX, bullet.y - cameraY, bullet.radius, 0, Math.PI * 2);
        ctx.fill();

        // Inner core (núcleo brillante)
        ctx.shadowBlur = 0;
        ctx.fillStyle = bullet.isCritical ? '#ffffff' : '#ffffff';
        ctx.globalAlpha = bullet.isCritical ? 0.9 : 0.7;
        ctx.beginPath();
        ctx.arc(bullet.x - cameraX, bullet.y - cameraY, bullet.radius * 0.5, 0, Math.PI * 2);
        ctx.fill();

        // Critical indicator (indicador de crítico)
        if (bullet.isCritical) {
            ctx.globalAlpha = 0.6;
            const pulseSize = Math.sin(Date.now() * 0.02) * 2;
            ctx.strokeStyle = bullet.color;
            ctx.lineWidth = 2;
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 2;
            ctx.beginPath();
            ctx.arc(bullet.x - cameraX, bullet.y - cameraY, bullet.radius + pulseSize + 3, 0, Math.PI * 2);
            ctx.stroke();
        }
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Render enemies como esferas isométricas
    enemies.forEach((enemy, idx) => {
        // Calcular posición en pantalla (isométrica o cartesiana)
        let enemyScreenX, enemyScreenY;

        if (typeof IsometricTransform !== 'undefined' && typeof IsometricTransform.worldToIso === 'function') {
            const isoPos = IsometricTransform.worldToIso(enemy.x, enemy.y);
            const cameraIso = IsometricTransform.worldToIso(cameraX, cameraY);
            enemyScreenX = isoPos.x - cameraIso.x + ctx.canvas.width / 2;
            enemyScreenY = isoPos.y - cameraIso.y + ctx.canvas.height / 2;
        } else {
            enemyScreenX = enemy.x - cameraX;
            enemyScreenY = enemy.y - cameraY;
        }

        // Usar renderizado isométrico si está disponible
        if (typeof IsometricEntityRenderer !== 'undefined' && typeof IsometricEntityRenderer.renderEnemyIsometric === 'function') {
            IsometricEntityRenderer.renderEnemyIsometric(ctx, enemy, cameraX, cameraY);
            return; // Ya renderizado, saltar al siguiente enemigo
        }

        // Fallback: Renderizado cartesiano (2D plano)
        // Efectos especiales según tipo
        if (enemy.explosive) {
            const pulseSize = Math.sin(Date.now() * 0.008) * 3;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 2.5;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(enemyScreenX, enemyScreenY, enemy.radius + pulseSize + 10, 0, Math.PI * 2);
            ctx.fillStyle = enemy.color;
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (enemy.isBoss) {
            const rotation = Date.now() * 0.002;
            ctx.strokeStyle = enemy.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 3;
            ctx.beginPath();
            ctx.arc(enemyScreenX, enemyScreenY, enemy.radius + 15, rotation, rotation + Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(enemyScreenX, enemyScreenY, enemy.radius + 15, rotation + Math.PI, rotation + Math.PI * 2);
            ctx.stroke();
        }

        // Cuerpo del enemigo como esfera 3D
        ctx.save();
        ctx.beginPath();
        ctx.arc(enemyScreenX, enemyScreenY, enemy.radius, 0, Math.PI * 2);
        // Gradiente radial para efecto de esfera
        const grad = ctx.createRadialGradient(
            enemyScreenX - enemy.radius * 0.4,
            enemyScreenY - enemy.radius * 0.4,
            enemy.radius * 0.2,
            enemyScreenX,
            enemyScreenY,
            enemy.radius
        );
        grad.addColorStop(0, '#fff'); // Brillo central
        grad.addColorStop(0.45, enemy.color);
        grad.addColorStop(1, '#222'); // Sombra exterior
        ctx.fillStyle = grad;
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = enemy.isBoss ? qualitySettings.shadowBlur * 3 : qualitySettings.shadowBlur * 1.5;
        ctx.globalAlpha = 0.98;
        ctx.fill();
        // Reflejo superior izquierdo
        ctx.globalAlpha = 0.18;
        ctx.beginPath();
        ctx.arc(enemyScreenX - enemy.radius * 0.35, enemyScreenY - enemy.radius * 0.35, enemy.radius * 0.32, 0, Math.PI * 2);
        ctx.fillStyle = '#fff';
        ctx.fill();
        ctx.globalAlpha = 1.0;
        ctx.restore();

        // Indicador de tipo en el centro
        if (enemy.type === 'FAST') {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${enemy.radius * 0.8}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('»', enemyScreenX, enemyScreenY);
        } else if (enemy.explosive) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${enemy.radius * 0.7}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💥', enemyScreenX, enemyScreenY);
        } else if (enemy.isBoss) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${enemy.radius * 0.4}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', enemyScreenX, enemyScreenY);
        }

        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.shadowBlur = 0;
        const barHeight = enemy.isBoss ? 10 : 6;
        const barOffset = enemy.isBoss ? 20 : 14;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(enemyScreenX - enemy.radius, enemyScreenY - enemy.radius - barOffset, enemy.radius * 2, barHeight);
        const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.shadowColor = healthColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(enemyScreenX - enemy.radius, enemyScreenY - enemy.radius - barOffset, enemy.radius * 2 * healthPercent, barHeight);
        ctx.shadowBlur = 0;
    });

    // Auto-aim indicator (línea de mira hacia enemigo objetivo)
    if (joystickManager && joystickManager.getShootingInput().isActive) {
        const shootInput = joystickManager.getShootingInput();

        // Calcular posición del jugador en pantalla (isométrica)
        let aimPlayerScreenX, aimPlayerScreenY;
        if (typeof IsometricTransform !== 'undefined' && typeof IsometricTransform.worldToIso === 'function') {
            const isoPos = IsometricTransform.worldToIso(player.x, player.y);
            const cameraIso = IsometricTransform.worldToIso(cameraX, cameraY);
            aimPlayerScreenX = isoPos.x - cameraIso.x + ctx.canvas.width / 2;
            aimPlayerScreenY = isoPos.y - cameraIso.y + ctx.canvas.height / 2;
        } else {
            aimPlayerScreenX = player.x - cameraX;
            aimPlayerScreenY = player.y - cameraY;
        }

        // Si hay desplazamiento significativo, mostrar indicador de dirección manual
        if (shootInput.strength > 0.25) {
            // Calcular punto final en mundo
            const lineLength = 150;
            const endWorldX = player.x + Math.cos(shootInput.angle) * lineLength;
            const endWorldY = player.y + Math.sin(shootInput.angle) * lineLength;

            // Convertir punto final a coordenadas de pantalla
            let endScreenX, endScreenY;
            if (typeof IsometricTransform !== 'undefined' && typeof IsometricTransform.worldToIso === 'function') {
                const endIso = IsometricTransform.worldToIso(endWorldX, endWorldY);
                const cameraIso = IsometricTransform.worldToIso(cameraX, cameraY);
                endScreenX = endIso.x - cameraIso.x + ctx.canvas.width / 2;
                endScreenY = endIso.y - cameraIso.y + ctx.canvas.height / 2;
            } else {
                endScreenX = endWorldX - cameraX;
                endScreenY = endWorldY - cameraY;
            }

            ctx.strokeStyle = '#ff00ff';
            ctx.lineWidth = 3;
            ctx.globalAlpha = 0.6;
            ctx.setLineDash([10, 5]);
            ctx.shadowColor = '#ff00ff';
            ctx.shadowBlur = 10;
            ctx.beginPath();
            ctx.moveTo(aimPlayerScreenX, aimPlayerScreenY);
            ctx.lineTo(endScreenX, endScreenY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Punta de flecha
            const arrowSize = 12;
            ctx.fillStyle = '#ff00ff';
            ctx.globalAlpha = 0.8;
            ctx.beginPath();
            ctx.moveTo(endScreenX, endScreenY);
            ctx.lineTo(
                endScreenX - Math.cos(shootInput.angle - 0.5) * arrowSize,
                endScreenY - Math.sin(shootInput.angle - 0.5) * arrowSize
            );
            ctx.lineTo(
                endScreenX - Math.cos(shootInput.angle + 0.5) * arrowSize,
                endScreenY - Math.sin(shootInput.angle + 0.5) * arrowSize
            );
            ctx.closePath();
            ctx.fill();
        } else {
            // Tap sin arrastre: mostrar auto-aim si hay objetivo
            const targetEnemy = findClosestEnemy(600);
            if (targetEnemy) {
                // Línea de mira desde el jugador al enemigo
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 2;
                ctx.globalAlpha = 0.3;
                ctx.setLineDash([5, 5]);
                ctx.beginPath();
                ctx.moveTo(player.x - cameraX, player.y - cameraY);
                ctx.lineTo(targetEnemy.x - cameraX, targetEnemy.y - cameraY);
                ctx.stroke();
                ctx.setLineDash([]);

                // Indicador en el enemigo objetivo
                ctx.strokeStyle = '#ff00ff';
                ctx.lineWidth = 3;
                ctx.globalAlpha = 0.6 + Math.sin(Date.now() * 0.01) * 0.2;
                ctx.beginPath();
                ctx.arc(targetEnemy.x - cameraX, targetEnemy.y - cameraY, targetEnemy.radius + 8, 0, Math.PI * 2);
                ctx.stroke();

                ctx.globalAlpha = 1;
            }
        }
    }

    // ===================================
    // RENDERIZADO DE JUGADOR Y ENEMIGOS
    // Ya se renderiza en el sistema de depth sorting anterior
    // ===================================

    // Player direction indicator
    let playerScreenX, playerScreenY;

    // Calcular posición en pantalla (isométrica o cartesiana)
    if (typeof IsometricTransform !== 'undefined' && typeof IsometricTransform.worldToIso === 'function') {
        const isoPos = IsometricTransform.worldToIso(player.x, player.y);
        const cameraIso = IsometricTransform.worldToIso(cameraX, cameraY);
        playerScreenX = isoPos.x - cameraIso.x + ctx.canvas.width / 2;
        playerScreenY = isoPos.y - cameraIso.y + ctx.canvas.height / 2;
    } else {
        playerScreenX = player.x - cameraX;
        playerScreenY = player.y - cameraY;
    }

    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(playerScreenX, playerScreenY);
    ctx.lineTo(
        playerScreenX + Math.cos(player.angle) * (player.radius + 15),
        playerScreenY + Math.sin(player.angle) * (player.radius + 15)
    );
    ctx.stroke();
    ctx.shadowBlur = 0;

    // ===================================
    // BARRAS DE VIDA Y SUPER (debajo del jugador, estilo Brawl Stars)
    // ===================================
    const barWidth = player.radius * 3; // MÁS ANCHO - más visible
    const barHeight = 10; // MÁS ALTO - más visible (era 6)
    const barSpacing = 4; // Más espacio entre barras

    // BARRA DE SUPER (abajo)
    const superBarY = playerScreenY + player.radius + 20;

    // Fondo de la barra de super (más oscuro y visible)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(
        playerScreenX - barWidth / 2,
        superBarY,
        barWidth,
        barHeight
    );

    // Borde de la barra de super (más grueso)
    ctx.strokeStyle = '#00ffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        playerScreenX - barWidth / 2,
        superBarY,
        barWidth,
        barHeight
    );

    // Relleno de la barra de super (amarillo brillante cuando cargada)
    if (superSystem) {
        const superPercent = superSystem.charge / superSystem.maxCharge;
        const superColor = superPercent >= 1 ? '#ffff00' : '#00ffff';
        const superGlow = superPercent >= 1 ? 20 : 8;

        ctx.fillStyle = superColor;
        ctx.shadowColor = superColor;
        ctx.shadowBlur = superGlow;
        ctx.fillRect(
            playerScreenX - barWidth / 2 + 2,
            superBarY + 2,
            (barWidth - 4) * superPercent,
            barHeight - 4
        );
        ctx.shadowBlur = 0;
    }

    // BARRA DE VIDA (encima de la barra de super)
    const healthBarY = superBarY - barHeight - barSpacing;

    // Fondo de la barra de vida (más oscuro y visible)
    ctx.fillStyle = 'rgba(0, 0, 0, 0.85)';
    ctx.fillRect(
        playerScreenX - barWidth / 2,
        healthBarY,
        barWidth,
        barHeight
    );

    // Borde de la barra de vida (más grueso)
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.strokeRect(
        playerScreenX - barWidth / 2,
        healthBarY,
        barWidth,
        barHeight
    );

    // Marcas de regla cada 100 HP (más visibles)
    const maxHealth = player.maxHealth || 100;
    const marksCount = Math.floor(maxHealth / 100);
    ctx.strokeStyle = 'rgba(255, 255, 255, 0.6)';
    ctx.lineWidth = 2;
    for (let i = 1; i <= marksCount; i++) {
        const markX = playerScreenX - barWidth / 2 + (barWidth * (i * 100 / maxHealth));
        ctx.beginPath();
        ctx.moveTo(markX, healthBarY);
        ctx.lineTo(markX, healthBarY + barHeight);
        ctx.stroke();
    }

    // Relleno de la barra de vida con colores según porcentaje
    const healthPercent = player.health / maxHealth;
    let healthColor;
    if (healthPercent < 0.33) {
        healthColor = '#ff0000'; // Rojo < 33%
    } else if (healthPercent < 0.66) {
        healthColor = '#ff8800'; // Naranja < 66%
    } else {
        healthColor = '#00ff00'; // Verde >= 66%
    }

    ctx.fillStyle = healthColor;
    ctx.shadowColor = healthColor;
    ctx.shadowBlur = 10; // Más brillo
    ctx.fillRect(
        playerScreenX - barWidth / 2 + 2,
        healthBarY + 2,
        (barWidth - 4) * Math.max(0, healthPercent),
        barHeight - 4
    );
    ctx.shadowBlur = 0;

    // Restaurar transformación de zoom
    ctx.restore();

    // ===================================
    // UI ELEMENTS (sin transformación de zoom)
    // ===================================

    // Overlay oscuro sobre área del HUD para delimitar zona de juego
    if (gameAreaTop > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, screenWidth, gameAreaTop);
    }

    // Grid (solo en área de juego) - renderizado sin zoom
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = isMobileDevice ? 70 : 55;
    for (let x = 0; x < screenWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, gameAreaTop);
        ctx.lineTo(x, screenHeight);
        ctx.stroke();
    }
    for (let y = gameAreaTop; y < screenHeight; y += gridSize) {
        ctx.beginPath();
        ctx.moveTo(0, y);
        ctx.lineTo(screenWidth, y);
        ctx.stroke();
    }

    // Show collected ability (PC only)
    if (collectedAbility && !isMobileDevice) {
        ctx.font = 'bold 50px Orbitron';
        ctx.fillStyle = '#ffffff';
        ctx.textAlign = 'center';
        ctx.shadowColor = '#ff00ff';
        ctx.shadowBlur = 30;
        ctx.fillText(collectedAbility.icon, screenWidth / 2, 70);
        ctx.font = '18px Orbitron';
        ctx.fillText(`${collectedAbility.name} - Press SPACE`, screenWidth / 2, 105);
        ctx.shadowBlur = 0;
    }

    // Renderizar minimapa si está disponible
    if (window.gameMapSystem && typeof window.gameMapSystem.renderMinimap === 'function') {
        const minimapCanvas = document.getElementById('minimapCanvas');
        if (minimapCanvas) {
            const minimapCtx = minimapCanvas.getContext('2d');
            if (minimapCtx) {
                // Detectar si hay personajes u enemigos debajo del minimapa
                const isPortrait = window.innerHeight > window.innerWidth;
                const minimapRect = minimapCanvas.getBoundingClientRect();
                let hasCharacterUnder = false;

                // Obtener zoom para ajustar coordenadas
                const zoomScale = 1 / ViewportScale.cameraZoom;

                // Verificar jugador (coordenadas en espacio de pantalla con zoom aplicado)
                const playerScreenX = (player.x - cameraX) * zoomScale;
                const playerScreenY = (player.y - cameraY) * zoomScale;
                if (playerScreenX >= minimapRect.left && playerScreenX <= minimapRect.right &&
                    playerScreenY >= minimapRect.top && playerScreenY <= minimapRect.bottom) {
                    hasCharacterUnder = true;
                }

                // Verificar enemigos
                if (!hasCharacterUnder) {
                    for (const enemy of enemies) {
                        const enemyScreenX = (enemy.x - cameraX) * zoomScale;
                        const enemyScreenY = (enemy.y - cameraY) * zoomScale;
                        if (enemyScreenX >= minimapRect.left && enemyScreenX <= minimapRect.right &&
                            enemyScreenY >= minimapRect.top && enemyScreenY <= minimapRect.bottom) {
                            hasCharacterUnder = true;
                            break;
                        }
                    }
                }

                // Actualizar opacidad según detección
                minimapCanvas.style.opacity = gameState.isPlaying ? (hasCharacterUnder ? '0.25' : '0.80') : '0';

                // Calcular viewport rect para minimapa
                // El viewport muestra el área visible en el mapa con el zoom aplicado
                const scaleX = minimapCanvas.width / window.gameMapSystem.width;
                const scaleY = minimapCanvas.height / window.gameMapSystem.height;

                // Tamaño del viewport en tiles (ajustado por zoom)
                const viewportWidthInTiles = (screenWidth * cameraZoom) / window.gameMapSystem.tileSize;
                const viewportHeightInTiles = (screenHeight * cameraZoom) / window.gameMapSystem.tileSize;

                // Posición de la cámara en tiles
                const cameraTileX = window.gameMapSystem.camera.x / window.gameMapSystem.tileSize;
                const cameraTileY = window.gameMapSystem.camera.y / window.gameMapSystem.tileSize;

                window.minimapViewportRect = {
                    x: cameraTileX * scaleX,
                    y: cameraTileY * scaleY,
                    width: viewportWidthInTiles * scaleX,
                    height: viewportHeightInTiles * scaleY
                };

                // Renderizar minimapa con dimensiones correctas
                window.gameMapSystem.renderMinimap(
                    minimapCtx,
                    minimapCanvas.width,
                    minimapCanvas.height,
                    player,
                    enemies
                );
            }
        }
    }

    // Render Dynamic Joysticks (Brawl Stars style)
    if (joystickManager && gameState.isPlaying && !gameState.isPaused) {
        joystickManager.update();
        joystickManager.render(ctx, ViewportScale.getCameraZoom());
    }

    // Render Ammo UI (Brawl Stars style bullets below player)
    if (ammoSystem && gameState.isPlaying && !gameState.isPaused) {
        // Calcular posición del jugador en screen space (centrada)
        const screenCenterX = canvas.width / 2;
        const screenCenterY = canvas.height / 2;

        ammoSystem.render(ctx, screenCenterX, screenCenterY, ViewportScale.getCameraZoom());
    }

    // Render Super UI - DESHABILITADO: Ahora se renderiza debajo del jugador
    // if (superSystem && gameState.isPlaying && !gameState.isPaused) {
    //     const screenCenterX = canvas.width / 2;
    //     const screenCenterY = canvas.height / 2;
    //
    //     superSystem.render(ctx, screenCenterX, screenCenterY);
    // }

    // Reset all context state at end of render for next frame
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;
}

// ===================================
// AIM CURSOR FOR MOBILE (Shows shooting direction)
// ===================================

const aimCursor = document.getElementById('aimCursor');
const MIN_CURSOR_DISTANCE = 80; // Distancia mínima desde el jugador
const MAX_CURSOR_DISTANCE = 300; // Distancia máxima desde el jugador

function updateAimCursor() {
    if (!isMobileDevice || !aimCursor) {
        if (!aimCursor) console.warn('⚠️ aimCursor element not found');
        return;
    }

    // Solo mostrar cuando el joystick de disparo esté activo
    if (input.shootJoystick.active && gameState.isPlaying && !gameState.isPaused && !gameState.isGameOver) {
        //console.log('🎯 Aim cursor should be visible - shootJoystick active');
        const angle = input.shootJoystick.angle;

        // Calcular distancia base
        let targetDistance = MAX_CURSOR_DISTANCE;

        // Buscar el enemigo más cercano en la dirección de disparo
        let closestEnemyDistance = MAX_CURSOR_DISTANCE;
        for (let enemy of enemies) {
            const dx = enemy.x - player.x;
            const dy = enemy.y - player.y;
            const enemyAngle = Math.atan2(dy, dx);
            const enemyDistance = Math.sqrt(dx * dx + dy * dy);

            // Verificar si el enemigo está en la dirección del disparo (tolerancia de ±30°)
            const angleDiff = Math.abs(enemyAngle - angle);
            const normalizedAngleDiff = Math.min(angleDiff, Math.PI * 2 - angleDiff);

            if (normalizedAngleDiff < Math.PI / 6 && enemyDistance < closestEnemyDistance) {
                closestEnemyDistance = enemyDistance;
            }
        }

        // Usar la distancia del enemigo más cercano o la máxima
        targetDistance = Math.min(closestEnemyDistance - 20, MAX_CURSOR_DISTANCE);

        // Asegurar distancia mínima
        targetDistance = Math.max(targetDistance, MIN_CURSOR_DISTANCE);

        // Verificar límites de la pantalla
        const screenWidth = window.innerWidth;
        const screenHeight = window.innerHeight;

        let cursorX = player.x + Math.cos(angle) * targetDistance;
        let cursorY = player.y + Math.sin(angle) * targetDistance;

        // Ajustar si el cursor se sale de la pantalla
        const margin = 40; // Margen desde el borde
        if (cursorX < margin) {
            const ratio = (margin - player.x) / (cursorX - player.x);
            cursorX = margin;
            cursorY = player.y + (cursorY - player.y) * ratio;
            targetDistance = Math.sqrt(Math.pow(cursorX - player.x, 2) + Math.pow(cursorY - player.y, 2));
        }
        if (cursorX > screenWidth - margin) {
            const ratio = (screenWidth - margin - player.x) / (cursorX - player.x);
            cursorX = screenWidth - margin;
            cursorY = player.y + (cursorY - player.y) * ratio;
            targetDistance = Math.sqrt(Math.pow(cursorX - player.x, 2) + Math.pow(cursorY - player.y, 2));
        }
        if (cursorY < gameAreaTop + margin) {
            const ratio = (gameAreaTop + margin - player.y) / (cursorY - player.y);
            cursorY = gameAreaTop + margin;
            cursorX = player.x + (cursorX - player.x) * ratio;
            cursorY = gameAreaTop + margin;
            cursorX = player.x + (cursorX - player.x) * ratio;
            targetDistance = Math.sqrt(Math.pow(cursorX - player.x, 2) + Math.pow(cursorY - player.y, 2));
        }
        if (cursorY > screenHeight - margin) {
            const ratio = (screenHeight - margin - player.y) / (cursorY - player.y);
            cursorY = screenHeight - margin;
            cursorX = player.x + (cursorX - player.x) * ratio;
            targetDistance = Math.sqrt(Math.pow(cursorX - player.x, 2) + Math.pow(cursorY - player.y, 2));
        }

        // Asegurar que no sea menor que la distancia mínima tras ajuste
        if (targetDistance < MIN_CURSOR_DISTANCE) {
            const scale = MIN_CURSOR_DISTANCE / targetDistance;
            cursorX = player.x + (cursorX - player.x) * scale;
            cursorY = player.y + (cursorY - player.y) * scale;
        }

        // Posicionar el cursor
        aimCursor.style.left = cursorX + 'px';
        aimCursor.style.top = cursorY + 'px';
        aimCursor.classList.add('active');


    } else {
        // Ocultar cursor cuando no se está disparando
        aimCursor.classList.remove('active');
    }
}

// ===================================
// GAME LOOP
// ===================================

let frameCount = 0;
function gameLoop() {
    frameCount++;
    if (frameCount === 1 || frameCount % 300 === 0) {
        console.log('🎮 Game Loop ejecutándose - Frame:', frameCount);
    }

    // Si Map Mode está activo, usar su lógica
    if (window.MapMode && window.MapMode.isActive) {
        const currentTime = performance.now();
        const deltaTime = currentTime - (window.lastFrameTime || currentTime);
        window.lastFrameTime = currentTime;

        window.MapMode.update(deltaTime);
        window.MapMode.render();
        requestAnimationFrame(gameLoop);
        return;
    }

    // Lógica del juego original
    if (!gameState.isPaused) {
        if (gameState.isCountdown) {
            // Durante countdown: permitir movimiento del jugador y recoger items
            updatePlayerMovement();
            updateVisualsDuranteCountdown();
        } else {
            updateVisualsDuranteCountdown(); // Animaciones y efectos
            update();
        }
    }
    render();
    requestAnimationFrame(gameLoop);
}

// Función para resetear completamente el estado del juego
function resetGameState() {
    console.log('🔄 Resetting game state...');

    // Reset game state
    gameState.isPlaying = false;
    gameState.isGameOver = false;
    gameState.isPaused = false;
    gameState.isCountdown = false;
    gameState.score = 0;
    gameState.kills = 0;
    gameState.partidaGuardada = false;

    // Reset experience system
    gameState.experience = 0;
    resetWaveExperience();

    //console.log('✅ Game state flags reset - isPaused:', gameState.isPaused, 'isPlaying:', gameState.isPlaying);

    // Reset player
    player.health = 100;
    player.maxHealth = 100;
    player.x = window.innerWidth / 2;
    player.y = window.innerHeight / 2;
    player.targetX = player.x;
    player.targetY = player.y;
    player.moving = false;
    player.angle = 0;
    player.aimX = 0;
    player.aimY = 0;
    player.shootCooldown = 0;

    // Reset player stats (habilidades)
    for (let statName in playerStats) {
        playerStats[statName].level = 0;
        playerStats[statName].currentValue = playerStats[statName].baseValue;
    }

    // Clear all arrays
    enemies = [];
    bullets = [];
    particles = [];
    damageNumbers = []; // FASE 5: Limpiar números de daño
    abilityPickups = [];
    collectedAbility = null;

    // Hide game over screen
    document.getElementById('gameOver').classList.remove('active');

    // Reset HUD opacity
    document.getElementById('gameHUD').style.opacity = '1';

    // Reset snapshot
    statsSnapshot = null;

    // Reset Ammo System
    if (ammoSystem) {
        ammoSystem.reset();
    }

    // Reset Super System
    if (superSystem) {
        superSystem.reset();
    }

    //console.log('🔄 Game state reset complete');
}

// Exportar funciones y objetos globalmente
window.resetGameState = resetGameState;
window.gameState = gameState;
window.playerStats = playerStats;
window.upgradePlayerStat = upgradePlayerStat;
window.createStatsSnapshot = createStatsSnapshot;
window.restoreStatsSnapshot = restoreStatsSnapshot;
window.grantExperience = grantExperience;
window.resetWaveExperience = resetWaveExperience;
window.ENEMY_TYPES = ENEMY_TYPES;

// Dynamic Joystick Manager (Brawl Stars style)
let joystickManager = null;

// Ammo System (Brawl Stars style)
let ammoSystem = null;

// Super System (Brawl Stars style)
let superSystem = null;

// Función para iniciar el juego desde el menú con un nivel específico
window.startGameFromMenu = function(startLevel, mapType = 'maze') {
    console.log('🎮 ===== INICIANDO JUEGO =====');
    console.log('🎮 Starting game from menu, level:', startLevel, 'mapType:', mapType);

    // Initialize canvas if not done
    if (!canvas) {
        console.log('📺 Canvas no inicializado, inicializando...');
        canvas = document.getElementById('gameCanvas');
        if (!canvas) {
            console.error('❌ Canvas not found!');
            return;
        }
        console.log('✅ Canvas encontrado:', canvas);
        // Use minimal options for better Android WebView compatibility
        ctx = canvas.getContext('2d', {
            alpha: false,
            desynchronized: false // Better compatibility with Android WebView
        });

        if (!ctx) {
            console.error('❌ Canvas context could not be created!');
            return;
        }
        console.log('✅ Contexto 2D creado correctamente');

        // Configurar calidad de renderizado inicial
        ctx.imageSmoothingEnabled = true;
        ctx.imageSmoothingQuality = 'high';

        // Initialize Dynamic Joystick System
        if (typeof JoystickManager !== 'undefined' && !joystickManager) {
            joystickManager = new JoystickManager(canvas);
            console.log('✅ Dynamic Joystick Manager initialized');
        }

        // Initialize Ammo System
        if (typeof AmmoSystem !== 'undefined' && !ammoSystem) {
            ammoSystem = new AmmoSystem();
            console.log('✅ Ammo System initialized');
        }

        // Initialize Super System
        if (typeof SuperSystem !== 'undefined' && !superSystem) {
            superSystem = new SuperSystem();
            console.log('✅ Super System initialized');
        }

        // Verificar que el canvas sea visible
        const canvasStyle = window.getComputedStyle(canvas);


        // CRITICAL: Asegurar que el canvas sea visible
        canvas.style.display = 'block';
        canvas.style.opacity = '1';
        canvas.style.visibility = 'visible';

        // Initialize canvas events
        initializeCanvasEvents();

        // Initialize canvas size
        resizeCanvas();

        // Add resize listener after canvas is initialized
        window.addEventListener('resize', resizeCanvas);

        console.log('✅ Canvas completamente inicializado');
    } else {
        console.log('✅ Canvas ya estaba inicializado');
    }

    // Reset completo del estado del juego
    resetGameState();

    gameState.wave = startLevel - 1; // Se ajusta porque nextWave() incrementa
    gameState.mapType = mapType; // Establecer tipo de mapa seleccionado
    gameState.enemiesPerWave = Math.floor(5 * Math.pow(2.25, startLevel - 1));
    gameState.enemiesToSpawn = Math.min(gameState.enemiesPerWave, qualitySettings.maxEnemies);
    gameState.totalEnemiesInWave = gameState.enemiesToSpawn;

    document.getElementById('gameHUD').classList.add('active');
    gameState.isPlaying = true;
    gameState.isPaused = false; // Asegurar que NO está pausado
    gameState.isGameOver = false; // Asegurar que NO está en game over
    gameState.lastEnemySpawn = Date.now();
    player.lastShootTime = Date.now();
    updateGameAreaLimits();

    console.log('🎮 Game flags set - isPlaying:', gameState.isPlaying, 'isPaused:', gameState.isPaused, 'isGameOver:', gameState.isGameOver);

    // Inicializar sistema de mapas procedurales
    if (typeof MapSystem !== 'undefined') {
        console.log('🗺️ Initializing procedural map system...');
        window.gameMapSystem = new MapSystem();
        window.gameMapSystem.init(canvas);

        console.log("DIAGNÓSTICO FASE 4: canvas", canvas, "width:", canvas.width, "height:", canvas.height);
        if (canvas.width === 0 || canvas.height === 0) {
            console.error("ERROR: El canvas tiene tamaño cero");
        }

        window.gameMapSystem.generateMap({ algorithm: mapType });
        console.log("DIAGNÓSTICO FASE 1: grid generado", window.gameMapSystem.grid);
        if (!window.gameMapSystem.grid || window.gameMapSystem.grid.length === 0) {
            console.error("ERROR: El grid no se ha generado correctamente");
        } else {
            console.log(`✅ Grid generado correctamente: ${window.gameMapSystem.grid.length}x${window.gameMapSystem.grid[0].length}`);
        }

        // Verificar renderer isométrico
        if (!window.gameMapSystem.isometricRenderer) {
            console.error("❌ ERROR: El renderer isométrico no está disponible");
        } else {
            console.log("✅ IsometricRenderer disponible en MapSystem");
        }

        // Configurar sistema isométrico
        if (typeof IsometricTransform !== 'undefined') {
            console.log('✅ Configurando sistema isométrico...');
            // Centrar el mapa en el canvas
            IsometricTransform.centerMap(
                window.gameMapSystem.width,
                window.gameMapSystem.height,
                canvas.width,
                canvas.height
            );
            console.log('✅ Sistema isométrico configurado');
        }

        // Posicionar jugador en spawn del mapa
        const spawnPos = window.gameMapSystem.getPlayerSpawnPosition();
        console.log('🎮 SPAWN INICIAL:', {x: spawnPos.x, y: spawnPos.y});
        player.x = spawnPos.x;
        player.y = spawnPos.y;
        player.targetX = player.x;
        player.targetY = player.y;
        player.lastX = player.x; // Guardar última posición válida
        player.lastY = player.y;

        console.log('✅ Map system initialized with type:', mapType);
        console.log('   - Player spawn:', spawnPos);
    } else {
        console.warn('⚠️ MapSystem not loaded, using default positioning');
        // Reposicionar jugador en el centro del área de juego válida
        const centerX = window.innerWidth / 2;
        const centerY = (window.innerHeight + gameAreaTop) / 2;
        console.log('🎮 SPAWN INICIAL (fallback):', {x: centerX, y: centerY});
        player.x = centerX;
        player.y = centerY;
        player.targetX = player.x;
        player.targetY = player.y;
        player.lastX = player.x; // Guardar última posición válida
        player.lastY = player.y;
    }

    updateHUD();
    nextWave(); // Inicia la primera wave

    console.log('🎮 === GAME START DEBUG INFO ===');
    console.log('   - Canvas:', canvas ? 'EXISTS' : 'NULL');
    console.log('   - Canvas width:', canvas ? canvas.width : 'N/A');
    console.log('   - Canvas height:', canvas ? canvas.height : 'N/A');
    console.log('   - Canvas DPR:', window.devicePixelRatio);
    console.log('   - Quality settings:', qualitySettings);
    console.log('   - Context:', ctx ? 'EXISTS' : 'NULL');
    console.log('   - MapSystem:', window.gameMapSystem ? 'EXISTS' : 'NULL');
    console.log('   - IsometricRenderer:', window.gameMapSystem?.isometricRenderer ? 'EXISTS' : 'NULL');
    console.log('   - Player:', player);
    console.log('   - Enemies count:', enemies.length);
    console.log('   - Bullets count:', bullets.length);
    console.log('   - Viewport scale:', ViewportScale);
    console.log('   - isMobileDevice:', isMobileDevice);
    console.log('🎮 ===============================');

    console.log('🎮 Iniciando game loop...');
    gameLoop();

    // Ensure both joysticks are visible on mobile
    if (isMobileDevice) {
        console.log('📱 Ensuring joysticks are visible...');
    let shootJoystickContainer = document.getElementById('shootJoystickContainer');
        const joystickContainer = document.getElementById('joystickContainer');

        console.log('   - shootJoystickContainer:', shootJoystickContainer ? '✅ Found' : '❌ NOT FOUND');
        console.log('   - joystickContainer:', joystickContainer ? '✅ Found' : '❌ NOT FOUND');

        if (shootJoystickContainer) {
            shootJoystickContainer.style.display = 'block';
            console.log('   - shootJoystickContainer display set to block');
            console.log('   - Computed style:', window.getComputedStyle(shootJoystickContainer).display);
        }
        if (joystickContainer) {
            joystickContainer.style.display = 'block';
            console.log('   - joystickContainer display set to block');
            console.log('   - Computed style:', window.getComputedStyle(joystickContainer).display);
        }
    }

    console.log('🎮 Game Started!');
    console.log('Device:', isMobileDevice ? '📱 Mobile' : '🖥️ PC');
    console.log('Controls: Dual Joystick (Wild Rift Style)');
    console.log('Quality:', qualitySettings);
    console.log('Game Area Top:', gameAreaTop);

    // Diagnóstico de calidad gráfica
    console.log('🎨 GRAPHICS QUALITY DIAGNOSTIC:');
    console.log('   - Device Pixel Ratio (DPR):', window.devicePixelRatio);
    console.log('   - Canvas Physical Size:', canvas.width, 'x', canvas.height);
    console.log('   - Canvas CSS Size:', canvas.style.width, 'x', canvas.style.height);
    console.log('   - Window Size:', window.innerWidth, 'x', window.innerHeight);
    console.log('   - imageSmoothingEnabled:', ctx.imageSmoothingEnabled);
    console.log('   - imageSmoothingQuality:', ctx.imageSmoothingQuality);
    console.log('   - Alpha channel:', ctx.getContextAttributes().alpha);
    console.log('   - Desynchronized:', ctx.getContextAttributes().desynchronized);
    console.log('   - Quality multiplier:', qualitySettings.effectsMultiplier);
    console.log('🎮 ===== JUEGO INICIADO EXITOSAMENTE =====');
}