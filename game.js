// ===================================
// NEON SURVIVOR ARENA - MOBA EDITION
// PC: Right-click move, Left-click shoot
// Mobile: Wild Rift style (Landscape)
// ===================================

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
}

resizeCanvas();
window.addEventListener('resize', resizeCanvas);

// Prevent context menu
if (!isMobileDevice) {
    canvas.addEventListener('contextmenu', (e) => {
        e.preventDefault();
        return false;
    });

    canvas.addEventListener('mousedown', (e) => {
        e.preventDefault();
    });
}

// Game State
const gameState = {
    isPlaying: false,
    isGameOver: false,
    isPaused: false,
    wave: 1,
    score: 0,
    kills: 0,
    enemiesPerWave: 5,
    enemiesToSpawn: 5,
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
    speed: isMobileDevice ? 6 : 5,
    color: '#00ffff',
    angle: 0,
    aimX: 0,
    aimY: 0,
    shootCooldown: 0,
    lastShootTime: 0,
    moving: false
};

// Arrays
let enemies = [];
let bullets = [];
let abilityPickups = [];
let particles = [];
let collectedAbility = null;

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
    touch: {
        shoot: false,
        ability: false
    }
};

// ===================================
// MOBILE CONTROLS - WILD RIFT STYLE
// ===================================

if (isMobileDevice) {
    console.log('📱 Initializing Wild Rift controls...');
    document.getElementById('mobileControls').classList.add('active');
    document.querySelector('.platform-specific.mobile').classList.add('active');

    // Joystick
    const joystickContainer = document.getElementById('joystickContainer');
    const joystickStick = document.getElementById('joystickStick');
    let joystickTouchId = null;

    joystickContainer.addEventListener('touchstart', (e) => {
        e.preventDefault();
        const touch = e.changedTouches[0];
        joystickTouchId = touch.identifier;
        const rect = joystickContainer.getBoundingClientRect();
        input.joystick.centerX = rect.left + rect.width / 2;
        input.joystick.centerY = rect.top + rect.height / 2;
        input.joystick.active = true;
        joystickStick.classList.add('active');
        handleJoystickMove(touch);
    });

    window.addEventListener('touchmove', (e) => {
        if (!input.joystick.active) return;
        for (let touch of e.changedTouches) {
            if (touch.identifier === joystickTouchId) {
                e.preventDefault();
                handleJoystickMove(touch);
                break;
            }
        }
    }, { passive: false });

    window.addEventListener('touchend', (e) => {
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

    // Disparo tocando cualquier punto de la pantalla (excepto joystick y botón de habilidad)
    window.addEventListener('touchstart', (e) => {
        for (let touch of e.changedTouches) {
            // Ignorar si el toque es en el joystick o el botón de habilidad
            const target = touch.target;
            if (
                target.closest &&
                (target.closest('#joystickContainer') || target.closest('#abilityBtn'))
            ) {
                continue;
            }
            // Disparar hacia el punto tocado
            if (gameState.isPlaying) {
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
                        radius: 7,
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
    // Ability Button
    const abilityBtn = document.getElementById('abilityBtn');
    abilityBtn.addEventListener('touchstart', (e) => {
        e.preventDefault();
        if (collectedAbility && gameState.isPlaying) {
            useAbility();
        }
    });
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
                    radius: 14,
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

function spawnEnemy() {
    const side = Math.floor(Math.random() * 4);
    let x, y;

    switch(side) {
        case 0: x = Math.random() * window.innerWidth; y = -40; break;
        case 1: x = window.innerWidth + 40; y = Math.random() * window.innerHeight; break;
        case 2: x = Math.random() * window.innerWidth; y = window.innerHeight + 40; break;
        case 3: x = -40; y = Math.random() * window.innerHeight; break;
    }

    const radius = isMobileDevice ? 20 : 17 + Math.random() * 6;

    enemies.push({
        x: x,
        y: y,
        radius: radius,
        health: 55 + gameState.wave * 15,
        maxHealth: 55 + gameState.wave * 15,
        speed: (1.2 + gameState.wave * 0.09) * gameState.difficultyMultiplier,
        color: `hsl(${Math.random() * 60 + 270}, 100%, ${50 + Math.random() * 15}%)`,
        damage: 12 + gameState.wave * 3
    });
}

function spawnAbilityPickup(x, y) {
    const abilities = Object.values(ABILITIES);
    const ability = abilities[Math.floor(Math.random() * abilities.length)];

    abilityPickups.push({
        x: x,
        y: y,
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

function nextWave() {
    gameState.wave++;
    gameState.enemiesPerWave = Math.floor(gameState.enemiesPerWave * 2.25);
    gameState.enemiesToSpawn = Math.min(gameState.enemiesPerWave, qualitySettings.maxEnemies);
    gameState.enemySpawnRate = Math.max(350, 1000 - gameState.wave * 45);

    const indicator = document.getElementById('waveIndicator');
    indicator.innerHTML = `<div>WAVE ${gameState.wave}</div>`;
    indicator.style.display = 'block';

    setTimeout(() => {
        indicator.style.display = 'none';
    }, 2700);

    updateHUD();
}

function updateHUD() {
    document.getElementById('waveDisplay').textContent = gameState.wave;
    document.getElementById('scoreDisplay').textContent = gameState.score.toLocaleString();
    document.getElementById('killsDisplay').textContent = gameState.kills;

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

function update() {
    if (!gameState.isPlaying || gameState.isGameOver) return;

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
    player.y = Math.max(player.radius, Math.min(screenHeight - player.radius, player.y));

    // SHOOTING
    if (!isMobileDevice) {
        player.angle = Math.atan2(player.aimY - player.y, player.aimX - player.x);
        if (input.mouse.leftDown && now - player.lastShootTime > 90) {
            bullets.push({
                x: player.x,
                y: player.y,
                vx: Math.cos(player.angle) * 14,
                vy: Math.sin(player.angle) * 14,
                radius: 6,
                damage: 35,
                color: '#00ffff',
                trail: [],
                glow: true
            });
            player.lastShootTime = now;
        }
    }

    // Spawn enemies
    if (gameState.enemiesToSpawn > 0 && now - gameState.lastEnemySpawn > gameState.enemySpawnRate) {
        spawnEnemy();
        gameState.enemiesToSpawn--;
        gameState.lastEnemySpawn = now;
    }

    if (enemies.length === 0 && gameState.enemiesToSpawn === 0) {
        nextWave();
    }

    // Update enemies
    enemies.forEach(enemy => {
        const dx = player.x - enemy.x;
        const dy = player.y - enemy.y;
        const dist = Math.sqrt(dx * dx + dy * dy);

        if (dist > 0) {
            enemy.x += (dx / dist) * enemy.speed;
            enemy.y += (dy / dist) * enemy.speed;
        }

        if (dist < enemy.radius + player.radius) {
            player.health -= enemy.damage * 0.012;
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

        return !hit;
    });

    // Remove dead enemies
    enemies = enemies.filter(enemy => {
        if (enemy.health <= 0) {
            gameState.kills++;
            gameState.score += 100 * gameState.wave;
            createParticles(enemy.x, enemy.y, isMobileDevice ? 25 : 35, enemy.color);

            if (Math.random() < 0.22) {
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

    // Grid
    ctx.strokeStyle = 'rgba(0, 255, 255, 0.04)';
    ctx.lineWidth = 1;
    const gridSize = isMobileDevice ? 70 : 55;
    for (let x = 0; x < screenWidth; x += gridSize) {
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, screenHeight);
        ctx.stroke();
    }
    for (let y = 0; y < screenHeight; y += gridSize) {
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
        ctx.shadowColor = enemy.color;
        ctx.shadowBlur = qualitySettings.shadowBlur * 1.5;
        ctx.fillStyle = enemy.color;
        ctx.beginPath();
        ctx.arc(enemy.x, enemy.y, enemy.radius, 0, Math.PI * 2);
        ctx.fill();

        // Health bar
        const healthPercent = enemy.health / enemy.maxHealth;
        ctx.shadowBlur = 0;
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 14, enemy.radius * 2, 6);
        const healthColor = healthPercent > 0.5 ? '#00ff00' : healthPercent > 0.25 ? '#ffff00' : '#ff0000';
        ctx.fillStyle = healthColor;
        ctx.shadowColor = healthColor;
        ctx.shadowBlur = 8;
        ctx.fillRect(enemy.x - enemy.radius, enemy.y - enemy.radius - 14, enemy.radius * 2 * healthPercent, 6);
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
    update();
    render();
    requestAnimationFrame(gameLoop);
}

// ===================================
// START GAME
// ===================================

setTimeout(() => {
    document.getElementById('loadingScreen').style.display = 'none';
    document.getElementById('gameHUD').classList.add('active');
    gameState.isPlaying = true;
    gameState.lastEnemySpawn = Date.now();
    player.lastShootTime = Date.now();
    updateHUD();

    console.log('🎮 Game Started!');
    console.log('Device:', isMobileDevice ? '📱 Mobile/Tablet' : '🖥️ PC');
    console.log('Controls:', isMobileDevice ? 'Wild Rift Style' : 'MOBA (Right-click move, Left-click shoot)');
    console.log('Quality:', qualitySettings);
}, 3000);

gameLoop();