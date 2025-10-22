// ===================================
// NEON SURVIVOR ARENA - MOBA EDITION
// PC: Right-click move, Left-click shoot
// Mobile: Wild Rift style (Landscape)
// ===================================

// ===================================
// ADMOB INTEGRATION (AdMob Plus)
// ===================================
let admobReady = false;
let lastBossWaveCompleted = 0;
let interstitialAd = null;

// Inicializar AdMob cuando el dispositivo esté listo
document.addEventListener('deviceready', async function() {
    if (window.admob) {
        console.log('📱 AdMob Plus Plugin Ready');

        try {
            // Inicializar AdMob Plus
            await window.admob.start();

            // Crear el anuncio intersticial
            interstitialAd = new window.admob.InterstitialAd({
                //real cambiar en prod adUnitId: 'ca-app-pub-4698386674302808/7423787962'
                adUnitId: 'ca-app-pub-3940256099942544/1033173712'
            });

            // Cargar el primer anuncio
            await interstitialAd.load();

            admobReady = true;
            console.log('✅ AdMob Plus Configured and Interstitial Loaded');

            // Escuchar cuando el anuncio se cierre para cargar el siguiente
            document.addEventListener('admob.interstitial.dismiss', async () => {
                console.log('📺 Interstitial ad dismissed, loading next one...');
                await interstitialAd.load();
            });

        } catch (error) {
            console.error('❌ Error initializing AdMob Plus:', error);
        }
    } else {
        console.log('⚠️ AdMob Plus plugin not found - running in web mode');
    }
}, false);

// Función para determinar si se debe mostrar anuncio en este wave
function shouldShowAdForWave(wave) {
    // Anuncios en niveles específicos: 5, 7, 10
    if (wave === 5 || wave === 7 || wave === 10) {
        return true;
    }
    
    // Después del nivel 10: cada 2 niveles O después de boss (múltiplos de 5)
    if (wave > 10) {
        // Boss waves (múltiplos de 5)
        if (wave % 5 === 0) {
            return true;
        }
        // Cada 2 niveles (11, 13, 14, 16, 17, 19, etc.)
        if ((wave - 10) % 2 === 1) {
            return true;
        }
    }
    
    return false;
}

// Función para mostrar anuncio intersticial
async function showInterstitialAd() {
    if (admobReady && interstitialAd) {
        try {
            console.log('📺 Showing AdMob Interstitial Ad...');
            await interstitialAd.show();
        } catch (error) {
            console.error('❌ Error showing interstitial ad:', error);
        }
    } else {
        console.log('⚠️ AdMob not ready or not available');
    }
}

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

        console.log('🎮 Device Detection:', {
            mobile: this.isMobile,
            tablet: this.isTablet,
            touch: this.isTouch,
            pixelRatio: this.pixelRatio
        });

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
const canvas = document.getElementById('gameCanvas');
const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });

function resizeCanvas() {
    const dpr = Math.min(DeviceDetector.pixelRatio, 2);
    canvas.width = window.innerWidth * dpr;
    canvas.height = window.innerHeight * dpr;
    canvas.style.width = window.innerWidth + 'px';
    canvas.style.height = window.innerHeight + 'px';
    ctx.scale(dpr, dpr);
    updateGameAreaLimits(); // Actualizar límites del área de juego
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Prevent context menu
if (!isMobileDevice) {
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    // PC Controls: Left click = shoot, Right click = move
    canvas.addEventListener('mousedown', (e) => {
        if (gameState.isPaused || gameState.isGameOver) return;
        const rect = canvas.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left);
        const mouseY = (e.clientY - rect.top);
        if (e.button === 0) { // Left click: shoot
            input.mouse.x = mouseX;
            input.mouse.y = mouseY;
            input.mouse.leftDown = true;
            player.aimX = mouseX;
            player.aimY = mouseY;
            // Trigger shoot logic (if implemented)
            playerShoot(mouseX, mouseY);
        } else if (e.button === 2) { // Right click: move
            input.mouse.x = mouseX;
            input.mouse.y = mouseY;
            input.mouse.rightDown = true;
            player.targetX = mouseX;
            player.targetY = mouseY;
            player.moving = true;
        }
    });

    canvas.addEventListener('mouseup', (e) => {
        if (e.button === 0) input.mouse.leftDown = false;
        if (e.button === 2) input.mouse.rightDown = false;
    });
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
    difficultyMultiplier: 1
};

// Player
const player = {
    x: window.innerWidth / 2,
    y: window.innerHeight / 2,
    targetX: window.innerWidth / 2,
    targetY: window.innerHeight / 2,
    radius: isMobileDevice ? 20 : 18,
    health: 100,
    maxHealth: 100,
    speed: isMobileDevice ? 4 : 3,
    color: '#00ffff',
    angle: 0,
    aimX: 0,
    aimY: 0,
    shootCooldown: 0,
    lastShootTime: 0,
    moving: false
};

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
let collectedAbility = null;
let lastHealthDamageTime = 0; // Para controlar el sonido de daño

// Expose gameState globally for pause button logic
window.gameState = gameState;

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
}

// Input Handling
const input = {
    mouse: {
        x: window.innerWidth / 2,
        y: window.innerHeight / 2,
        leftDown: false,
        rightDown: false
    },
    joystick: {
        active: false,
        x: 0,
        y: 0,
        centerX: 0,
        centerY: 0
    },
    shootJoystick: {
        active: false,
        x: 0,
        y: 0,
        angle: 0,
        centerX: 0,
        centerY: 0
    },
    touch: {
        shoot: false,
        ability: false
    }
};

// Control Mode Configuration
let controlMode = localStorage.getItem('controlMode') || 'joystick'; // 'tap' or 'joystick'

// Function to set control mode (called from settings)
window.setControlMode = function(mode) {
    controlMode = mode;
    updateControlVisibility();
};

function updateControlVisibility() {
    const shootJoystickContainer = document.getElementById('shootJoystickContainer');
    const actionButtons = document.getElementById('actionButtons');
    const abilityBtnSmall = document.getElementById('abilityBtnSmall');

    console.log('🎮 Control Mode:', controlMode);
    console.log('🕹️ Shoot Joystick:', shootJoystickContainer ? 'Found' : 'NOT FOUND');
    console.log('🔘 Action Buttons:', actionButtons ? 'Found' : 'NOT FOUND');
    console.log('⚡ Small Ability Btn:', abilityBtnSmall ? 'Found' : 'NOT FOUND');

    if (controlMode === 'joystick') {
        // Dual joystick mode
        if (shootJoystickContainer) shootJoystickContainer.style.display = 'block';
        if (actionButtons) actionButtons.style.display = 'none';
        if (abilityBtnSmall) abilityBtnSmall.style.display = 'flex';
        console.log('✅ Dual Joystick Mode Activated');
    } else {
        // Tap mode
        if (shootJoystickContainer) shootJoystickContainer.style.display = 'none';
        if (actionButtons) actionButtons.style.display = 'flex';
        if (abilityBtnSmall) abilityBtnSmall.style.display = 'none';
        console.log('✅ Tap to Shoot Mode Activated');
    }
}

// ===================================
// MOBILE CONTROLS - WILD RIFT STYLE
// ===================================

if (isMobileDevice) {
    console.log('📱 Initializing Wild Rift controls...');
    document.getElementById('mobileControls').classList.add('active');
    document.querySelector('.platform-specific.mobile').classList.add('active');

    // Joystick - FIXED: Solo la base captura eventos
    const joystickBase = document.getElementById('joystickBase');
    const joystickStick = document.getElementById('joystickStick');
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

    if (shootJoystickBase) {
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
    // TAP TO SHOOT MODE (Original)
    // ===================================
    // Disparo tocando cualquier punto de la pantalla (excepto joystick, botón de pausa y botón de habilidad)
    window.addEventListener('touchstart', (e) => {
        // Solo funciona en modo tap
        if (controlMode !== 'tap') return;

        for (let touch of e.changedTouches) {
            // Ignorar si el toque es en los controles
            const target = touch.target;
            if (
                target.closest &&
                (target.closest('#joystickContainer') ||
                 target.closest('#abilityBtn') ||
                 target.closest('#pauseBtnMobile'))
            ) {
                continue;
            }
            // Disparar hacia el punto tocado
            if (gameState.isPlaying && !gameState.isPaused && !gameState.isCountdown) {
                const tapX = touch.clientX;
                const tapY = touch.clientY;
                const angle = Math.atan2(tapY - player.y, tapX - player.x);
                player.angle = angle;
                // Control de cadencia de disparo
                if (Date.now() - player.lastShootTime > 120) {
                    bullets.push({
                        x: player.x,
                        y: player.y,
                        vx: Math.cos(angle) * 14,
                        vy: Math.sin(angle) * 14,
                        radius: 5.25,
                        damage: 35,
                        color: '#00ffff',
                        trail: [],
                        glow: true
                    });
                    player.lastShootTime = Date.now();
                }
            }
        }
    });

    // Ability Button (Large - Tap Mode)
    const abilityBtn = document.getElementById('abilityBtn');
    abilityBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        initAudio(); // Inicializar audio en primera interacción
        if (collectedAbility && gameState.isPlaying) {
            useAbility();
        }
    });

    // Ability Button (Small - Dual Joystick Mode)
    const abilityBtnSmall = document.getElementById('abilityBtnSmall');
    if (abilityBtnSmall) {
        abilityBtnSmall.addEventListener('touchstart', (e) => {
            e.preventDefault();
            initAudio();
            if (collectedAbility && gameState.isPlaying) {
                useAbility();
            }
        });
    }

    // Inicializar audio en primer touch
    window.addEventListener('touchstart', () => {
        initAudio();
    }, { once: true });

    // Apply control mode visibility on load
    updateControlVisibility();

    // ...fin controles móviles...
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
                    vx: Math.cos(angle) * 12,
                    vy: Math.sin(angle) * 12,
                    radius: 10.5,
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
        color: '#ff00ff', // Magenta
        sizeMultiplier: 1,
        speedMultiplier: 1,
        healthMultiplier: 1,
        spawnChance: 0.50,
        abilityDropChance: 0.05
    },
    FAST: {
        name: 'Fast',
        color: '#00ffff', // Cian
        sizeMultiplier: 0.5,
        speedMultiplier: 1.15,
        healthMultiplier: 0.5,
        spawnChance: 0.15,
        abilityDropChance: 0.10
    },
    HEAVY: {
        name: 'Heavy',
        color: '#ff8800', // Naranja
        sizeMultiplier: 1.25,
        speedMultiplier: 0.85,
        healthMultiplier: 1.25,
        spawnChance: 0.15,
        abilityDropChance: 0.10
    },
    SUPERHEAVY: {
        name: 'SuperHeavy',
        color: '#ff0055', // Rojo-Rosa
        sizeMultiplier: 1.35,
        speedMultiplier: 0.75,
        healthMultiplier: 1.35,
        spawnChance: 0.10,
        abilityDropChance: 0.13
    },
    EXPLOSIVE: {
        name: 'Explosive',
        color: '#ffff00', // Amarillo
        sizeMultiplier: 1,
        speedMultiplier: 1,
        healthMultiplier: 1,
        spawnChance: 0.10,
        abilityDropChance: 0.05,
        explosive: true
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
    const side = Math.floor(Math.random() * 4);
    let x, y;
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    switch(side) {
        case 0: x = Math.random() * screenWidth; y = gameAreaTop - 40; break;
        case 1: x = screenWidth + 40; y = gameAreaTop + Math.random() * (screenHeight - gameAreaTop); break;
        case 2: x = Math.random() * screenWidth; y = screenHeight + 40; break;
        case 3: x = -40; y = gameAreaTop + Math.random() * (screenHeight - gameAreaTop); break;
    }

    return { x, y };
}

function spawnEnemy() {
    const enemyType = selectEnemyType();
    const position = getSpawnPosition();

    const baseRadius = isMobileDevice ? 20 : 18;
    const radius = baseRadius * enemyType.sizeMultiplier;
    const baseHealth = 55 + gameState.wave * 15;
    const baseSpeed = (0.5 + gameState.wave * 0.09) * gameState.difficultyMultiplier;

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

    const baseRadius = isMobileDevice ? 45 : 40;
    const radius = baseRadius + (gameState.wave * 2);
    const baseHealth = 500 + gameState.wave * 150;
    const baseSpeed = (0.8 + gameState.wave * 0.03) * gameState.difficultyMultiplier;

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
        radius: isMobileDevice ? 28 : 24,
        ability: ability,
        rotation: 0,
        life: 18,
        pulse: 0
    });
}

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
            if (callback) callback();
        }
    }, 1000);
}

function nextWave() {
    gameState.wave++;
    gameState.enemiesPerWave = Math.floor(gameState.enemiesPerWave * 1.30);
    gameState.enemiesToSpawn = Math.min(gameState.enemiesPerWave, qualitySettings.maxEnemies);
    gameState.enemySpawnRate = Math.max(350, 1000 - gameState.wave * 45);

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
    document.getElementById('finalKills').textContent = gameState.kills;
    document.getElementById('finalScore').textContent = gameState.score.toLocaleString();
    document.getElementById('gameOver').classList.add('active');

    // Guardar partida solo una vez
    if (!gameState.partidaGuardada && window.guardarPartida && typeof window.guardarPartida === 'function') {
        window.guardarPartida(gameState.score, gameState.wave, gameState.kills);
        gameState.partidaGuardada = true;
    }
}

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

    // MOVE PLAYER
    if (isMobileDevice) {
        if (input.joystick.active) {
            player.x += input.joystick.x * player.speed;
            player.y += input.joystick.y * player.speed;
        }
    } else {
        if (player.moving) {
            const dx = player.targetX - player.x;
            const dy = player.targetY - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 8) {
                player.x += (dx / dist) * player.speed;
                player.y += (dy / dist) * player.speed;
            } else {
                player.moving = false;
            }
        }
    }

    player.x = Math.max(player.radius, Math.min(screenWidth - player.radius, player.x));
    player.y = Math.max(gameAreaTop + player.radius, Math.min(screenHeight - player.radius, player.y));
}

// Update ability pickups only (for countdown mode)
function updateAbilityPickups() {
    abilityPickups = abilityPickups.filter(pickup => {
        const dx = player.x - pickup.x;
        const dy = player.y - pickup.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist < pickup.radius + player.radius) {
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
function updateVisualsDuringCountdown() {
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

    // MOVE PLAYER
    if (isMobileDevice) {
        if (input.joystick.active) {
            player.x += input.joystick.x * player.speed;
            player.y += input.joystick.y * player.speed;
        }
    } else {
        if (player.moving) {
            const dx = player.targetX - player.x;
            const dy = player.targetY - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist > 8) {
                player.x += (dx / dist) * player.speed;
                player.y += (dy / dist) * player.speed;
            } else {
                player.moving = false;
            }
        }
    }

    player.x = Math.max(player.radius, Math.min(screenWidth - player.radius, player.x));
    player.y = Math.max(gameAreaTop + player.radius, Math.min(screenHeight - player.radius, player.y));

    // SHOOTING
    if (!isMobileDevice) {
        // PC: Mouse shooting
        player.angle = Math.atan2(player.aimY - player.y, player.aimX - player.x);
        if (input.mouse.leftDown && now - player.lastShootTime > 90) {
            bullets.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(player.angle) * 14,
                vy: Math.sin(player.angle) * 14,
                radius: 4.5,
                damage: 35,
                color: '#00ffff',
                trail: [],
                glow: true
            });
            player.lastShootTime = now;
        }
    } else {
        // Mobile: Dual Joystick Mode - Auto shoot while aiming
        if (controlMode === 'joystick' && input.shootJoystick.active) {
            player.angle = input.shootJoystick.angle;

            // Auto-shoot while joystick is active
            if (now - player.lastShootTime > 120) {
                bullets.push({
                    x: player.x,
                    y: player.y,
                    vx: Math.cos(player.angle) * 14,
                    vy: Math.sin(player.angle) * 14,
                    radius: 5.25,
                    damage: 35,
                    color: '#00ffff',
                    trail: [],
                    glow: true
                });
                player.lastShootTime = now;
            }
        }
        // Tap mode shooting is handled in touchstart event
    }

    // Spawn enemies (skip in boss wave and countdown)
    const isBossWave = gameState.wave % 5 === 0;
    if (!gameState.isCountdown && !isBossWave && gameState.enemiesToSpawn > 0 && now - gameState.lastEnemySpawn > gameState.enemySpawnRate) {
        spawnEnemy();
        gameState.enemiesToSpawn--;
        gameState.lastEnemySpawn = now;
    }

    if (!gameState.isCountdown && enemies.length === 0 && gameState.enemiesToSpawn === 0) {
        // Verificar si debemos mostrar anuncio en este nivel
        const shouldShowAd = shouldShowAdForWave(gameState.wave);
        
        if (shouldShowAd && gameState.wave !== lastBossWaveCompleted) {
            console.log(`🎉 Wave ${gameState.wave} completed! Showing ad...`);
            lastBossWaveCompleted = gameState.wave;
            
            // Mostrar anuncio intersticial
            showInterstitialAd();
            
            // Pequeña pausa antes de continuar a la siguiente wave
            setTimeout(() => {
                nextWave();
            }, 500);
        } else {
            nextWave();
        }
    }    // Update enemies
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
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
                    vx: Math.cos(angle) * 10,
                    vy: Math.sin(angle) * 10,
                    radius: 8,
                    damage: 20 + gameState.wave * 2,
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
                            vx: Math.cos(angle) * 11,
                            vy: Math.sin(angle) * 11,
                            radius: 12,
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
        if (dist < enemy.radius + player.radius) {
            const currentTime = Date.now();
            const oldHealth = player.health;
            player.health -= enemy.damage * 0.012;

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
    bullets = bullets.filter(bullet => {
        bullet.x += bullet.vx;
        bullet.y += bullet.vy;

        bullet.trail.push({ x: bullet.x, y: bullet.y });
        if (bullet.trail.length > qualitySettings.trailLength) bullet.trail.shift();

        if (bullet.x < -50 || bullet.x > screenWidth + 50 ||
            bullet.y < -50 || bullet.y > screenHeight + 50) {
            return false;
        }

        let hit = false;

        // Balas del jefe dañan al jugador
        if (bullet.fromBoss) {
            const dx = bullet.x - player.x;
            const dy = bullet.y - player.y;
            const dist = Math.sqrt(dx * dx + dy * dy);

            if (dist < player.radius + bullet.radius) {
                player.health -= bullet.damage;
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
                    createParticles(enemy.x, enemy.y, 10, bullet.color);
                }
            });
        }

        return !hit;
    });

    // Remove dead enemies
    enemies = enemies.filter(enemy => {
        if (enemy.health <= 0) {
            gameState.kills++;

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

        if (dist < pickup.radius + player.radius) {
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
}

// ===================================
// RENDER
// ===================================

function render() {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Clear with gradient
    const gradient = ctx.createRadialGradient(
        screenWidth / 2, screenHeight / 2, 0,
        screenWidth / 2, screenHeight / 2, screenWidth / 2
    );
    gradient.addColorStop(0, '#0f0f2e');
    gradient.addColorStop(1, '#000000');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, screenWidth, screenHeight);

    // Overlay oscuro sobre área del HUD para delimitar zona de juego
    if (gameAreaTop > 0) {
        ctx.fillStyle = 'rgba(0, 0, 0, 0.8)';
        ctx.fillRect(0, 0, screenWidth, gameAreaTop);
    }

    // Grid (solo en área de juego)
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

    // Render special particles
    particles.forEach(p => {
        if (p.type === 'lightning') {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 4;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 20;
            ctx.beginPath();
            ctx.moveTo(p.x1, p.y1);
            ctx.lineTo(p.x2, p.y2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (p.type === 'ring') {
            ctx.globalAlpha = p.life / p.maxLife;
            ctx.strokeStyle = p.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 15;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.stroke();
            ctx.shadowBlur = 0;
        } else if (p.type === 'explosion') {
            ctx.globalAlpha = (p.life / p.maxLife) * 0.4;
            ctx.fillStyle = p.color;
            ctx.shadowColor = p.color;
            ctx.shadowBlur = 30;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
            ctx.fill();
            ctx.shadowBlur = 0;
        }
    });
    ctx.globalAlpha = 1;

    // Render normal particles
    particles.forEach(p => {
        if (p.type) return;
        const alpha = p.life / p.maxLife;
        ctx.globalAlpha = alpha;
        ctx.shadowColor = p.color;
        ctx.shadowBlur = qualitySettings.shadowBlur * 0.5;
        ctx.fillStyle = p.color;
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.globalAlpha = 1;
    ctx.shadowBlur = 0;

    // Render ability pickups
    abilityPickups.forEach(pickup => {
        ctx.save();
        ctx.translate(pickup.x, pickup.y);
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

    // Render bullets
    bullets.forEach(bullet => {
        bullet.trail.forEach((point, i) => {
            const alpha = i / bullet.trail.length;
            ctx.globalAlpha = alpha * 0.7;
            ctx.shadowColor = bullet.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 0.8;
            ctx.fillStyle = bullet.color;
            ctx.beginPath();
            ctx.arc(point.x, point.y, bullet.radius * alpha, 0, Math.PI * 2);
            ctx.fill();
        });

        ctx.globalAlpha = 1;
        ctx.shadowColor = bullet.color;
        ctx.shadowBlur = qualitySettings.shadowBlur * 1.2;
        ctx.fillStyle = bullet.color;
        ctx.beginPath();
        ctx.arc(bullet.x, bullet.y, bullet.radius, 0, Math.PI * 2);
        ctx.fill();
    });
    ctx.shadowBlur = 0;

    // Render enemies
    enemies.forEach(enemy => {
        // Efectos especiales según tipo
        if (enemy.explosive) {
            // Pulso para explosivos
            const pulseSize = Math.sin(Date.now() * 0.008) * 3;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 2.5;
            ctx.fillStyle = enemy.color;
            ctx.globalAlpha = 0.3;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + pulseSize + 10, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }

        if (enemy.isBoss) {
            // Anillo giratorio para jefes
            const rotation = Date.now() * 0.002;
            ctx.strokeStyle = enemy.color;
            ctx.lineWidth = 3;
            ctx.shadowColor = enemy.color;
            ctx.shadowBlur = qualitySettings.shadowBlur * 3;
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + 15, rotation, rotation + Math.PI);
            ctx.stroke();
            ctx.beginPath();
            ctx.arc(enemy.x, enemy.y, enemy.radius + 15, rotation + Math.PI, rotation + Math.PI * 2);
            ctx.stroke();
        }

        // Cuerpo del enemigo
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = enemy.isBoss ? qualitySettings.shadowBlur * 3 : qualitySettings.shadowBlur * 1.5;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Indicador de tipo en el centro
        if (enemy.type === 'FAST') {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${enemy.radius * 0.8}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('»', enemy.x, enemy.y);
        } else if (enemy.explosive) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#000000';
            ctx.font = `bold ${enemy.radius * 0.7}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('💥', enemy.x, enemy.y);
        } else if (enemy.isBoss) {
            ctx.shadowBlur = 0;
            ctx.fillStyle = '#ffffff';
            ctx.font = `bold ${enemy.radius * 0.4}px Orbitron`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.fillText('👑', enemy.x, enemy.y);
        }

        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.shadowBlur = 0;
        const barHeight = enemy.isBoss ? 10 : 6;
        const barOffset = enemy.isBoss ? 20 : 14;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - barOffset, enemy.radius * 2, barHeight);
        const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.shadowColor = healthColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - barOffset, enemy.radius * 2 * healthPercent, barHeight);
        ctx.shadowBlur = 0;
    });

    // Render player
    ctx.shadowColor = player.color;
    ctx.shadowBlur = qualitySettings.shadowBlur * 2;
    ctx.fillStyle = player.color;
    ctx.beginPath();
    ctx.arc(player.x, player.y, player.radius, 0, Math.PI * 2);
    ctx.fill();

    // Player direction indicator
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 4;
    ctx.shadowBlur = 15;
    ctx.shadowColor = '#ffffff';
    ctx.beginPath();
    ctx.moveTo(player.x, player.y);
    ctx.lineTo(
        player.x + Math.cos(player.angle) * (player.radius + 15),
        player.y + Math.sin(player.angle) * (player.radius + 15)
    );
    ctx.stroke();
    ctx.shadowBlur = 0;

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
}

// ===================================
// GAME LOOP
// ===================================

function gameLoop() {
    if (!gameState.isPaused) {
        if (gameState.isCountdown) {
            // Durante countdown: permitir movimiento del jugador y recoger items
            updatePlayerMovement();
            updateVisualsDuringCountdown();
        } else {
            updateVisualsDuringCountdown(); // Animaciones y efectos
            update();
        }
        render();
    } else {
        // Solo renderiza el frame actual para mostrar el overlay de pausa
        render();
    }

    // Actualizar contador de enemigos en tiempo real (restantes/total)
    if (gameState.isPlaying && !gameState.isCountdown) {
        const remainingEnemies = enemies.length + gameState.enemiesToSpawn;
        document.getElementById('enemiesDisplay').textContent = `${remainingEnemies}/${gameState.totalEnemiesInWave}`;
    }

    requestAnimationFrame(gameLoop);
}

// ===================================
// START GAME
// ===================================

// Función para iniciar el juego desde el menú con un nivel específico
window.startGameFromMenu = function(startLevel) {
    gameState.wave = startLevel - 1; // Se ajusta porque nextWave() incrementa
    gameState.enemiesPerWave = Math.floor(5 * Math.pow(2.25, startLevel - 1));
    gameState.enemiesToSpawn = Math.min(gameState.enemiesPerWave, qualitySettings.maxEnemies);
    gameState.totalEnemiesInWave = gameState.enemiesToSpawn;

    document.getElementById('gameHUD').classList.add('active');
    gameState.isPlaying = true;
    gameState.lastEnemySpawn = Date.now();
    player.lastShootTime = Date.now();
    updateGameAreaLimits();

    // Reposicionar jugador en el centro del área de juego válida
    player.x = window.innerWidth / 2;
    player.y = (window.innerHeight + gameAreaTop) / 2;
    player.targetX = player.x;
    player.targetY = player.y;

    updateHUD();
    nextWave(); // Inicia la primera wave
    gameLoop();

    console.log('🎮 Game Started!');
    console.log('Device:', isMobileDevice ? '📱 Mobile' : '🖥️ PC');
    console.log('Controls:', isMobileDevice ? 'Joystick + Touch' : 'MOBA (Right-click move, Left-click shoot)');
    console.log('Quality:', qualitySettings);
    console.log('Game Area Top:', gameAreaTop);
};

setTimeout(() => {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('gameHUD').classList.add('active');
    gameState.isPlaying = true;
    gameState.lastEnemySpawn = Date.now();
    player.lastShootTime = Date.now();
    gameState.totalEnemiesInWave = gameState.enemiesToSpawn; // Inicializar total
    updateGameAreaLimits(); // Actualizar límites del área de juego

    // Reposicionar jugador en el centro del área de juego válida
    player.x = window.innerWidth / 2;
    player.y = (window.innerHeight + gameAreaTop) / 2;
    player.targetX = player.x;
    player.targetY = player.y;

    updateHUD();

    console.log('🎮 Game Started!');
    console.log('Device:', isMobileDevice ? '📱 Mobile/Tablet' : '🖥️ PC');
    console.log('Controls:', isMobileDevice ? 'Wild Rift Style' : 'MOBA (Right-click move, Left-click shoot)');
    console.log('Quality:', qualitySettings);
    console.log('Game Area Top:', gameAreaTop);
}, 3000);

gameLoop();