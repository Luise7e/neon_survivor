# NEON SURVIVOR ARENA - Project Context Document

## 📋 Project Overview

**Project Name:** Neon Survivor Arena
**Version:** 4.0.1 (Build: 24OCT-1800)
**Type:** HTML5 Mobile Game wrapped in Android APK
**Genre:** Battle Royale / Wave-based Survival
**Platform:** Android (primary), Web Browser (secondary)
**Technology Stack:** HTML5, CSS3, JavaScript (Vanilla), Firebase, Gradle

---

## 🎯 Project Purpose

Neon Survivor Arena is a mobile-first battle royale game with neon aesthetics where players survive waves of enemies using dual-joystick controls. The game features:
- Wave-based progression system
- Upgrade/leveling mechanics
- Firebase authentication and cloud storage
- Real-time ranking system
- Adaptive difficulty scaling
- Responsive UI for multiple screen sizes

---

## 📁 Project Structure

```
android/
├── app/
│   ├── build.gradle                    # App-level build configuration
│   ├── proguard-rules.pro             # Code obfuscation rules
│   ├── src/
│   │   └── main/
│   │       ├── AndroidManifest.xml    # Android app manifest
│   │       └── assets/
│   │           ├── index.html         # Main game UI (4567 lines)
│   │           ├── game.js            # Game engine logic (2322 lines)
│   │           ├── manifest.json      # PWA manifest
│   │           └── guest_user_logo.png # Guest user avatar
│   └── build/                          # Build artifacts (auto-generated)
├── gradle/
│   └── wrapper/
│       └── gradle-wrapper.properties  # Gradle wrapper config
├── build.gradle                        # Project-level build config
├── settings.gradle                     # Project settings
├── gradle.properties                   # Gradle properties
├── local.properties                    # Local SDK paths
├── gradlew.bat                        # Gradle wrapper (Windows)
├── build_native_apk.ps1               # PowerShell build script
└── KEYSTORE_INFO.md                   # Keystore documentation (NEW)
```

---

## 🔐 Official Keystore (CRITICAL)

**⚠️ IMPORTANT: This project uses a SINGLE official keystore for ALL builds. NEVER create new keystores without explicit permission.**

### Keystore Information
- **Location:** `android/key_store/keystore` (dentro de la carpeta android)
- **Alias:** `neon-survivor`
- **Store Password:** `NeonSurvivor2025!`
- **Key Password:** `NeonSurvivor2025!`
- **Algorithm:** RSA 2048 bits, SHA256withRSA
- **Validity:** 10,000 days (~27.4 years)

### Fingerprints
```
SHA1: F0:2D:95:F9:34:15:CC:BA:C6:94:D2:8B:D0:24:D0:66:3E:2C:01:61
SHA256: 28:CC:55:CF:3D:DF:B7:02:3C:56:2B:09:C5:8F:89:D5:B9:AF:C7:9F:6A:E6:91:C2:13:B3:66:23:9C:C2:28:EF
```

### Rules
1. ✅ **ALWAYS use this keystore** for all APK builds (debug, release, production)
2. ❌ **NEVER create new keystores** without explicit user permission
3. ✅ **ALWAYS backup** this keystore before major changes
4. ✅ **Firebase Console** must have the SHA1 fingerprint registered
5. ✅ **Verify fingerprint** with: `keytool -list -v -keystore keystore -storepass NeonSurvivor2025!`

### Firebase Configuration
**This SHA1 MUST be registered in Firebase Console:**
```
F0:2D:95:F9:34:15:CC:BA:C6:94:D2:8B:D0:24:D0:66:3E:2C:01:61
```

**Steps to update Firebase:**
1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Select project: `neon-survivor-fe41c`
3. Go to: Settings → General → Your apps → Android app (`com.luise7e.neonsurvivor`)
4. Add the SHA1 fingerprint above
5. Download the new `google-services.json`
6. Replace `android/app/google-services.json` with the new file
7. Rebuild the APK

**For complete keystore documentation, see:** `KEYSTORE_INFO.md`

---

## 🛠️ Technology Stack

### Frontend
- **HTML5 Canvas:** Game rendering
- **CSS3:** Responsive UI with gradients, animations, and neon effects
- **JavaScript (ES6+):** Game logic, no frameworks
- **Google Fonts:** Orbitron, Rajdhani

### Backend & Services
- **Firebase Authentication:** Google Sign-In + Guest mode
- **Cloud Firestore:** User data, game progress, rankings
- **Firebase Hosting:** (Optional) Web deployment

### Build Tools
- **Gradle 8.x:** Android build system
- **Android SDK:** Target API level defined in build.gradle
- **apksigner:** APK signing tool
- **keytool:** Keystore generation

### Key Libraries
- Firebase SDK 9.23.0 (compat mode)
- No external game frameworks (pure canvas rendering)

---

## 🎮 Game Architecture

### Core Components

#### 1. **Device Detection System** (`game.js`)
```javascript
const DeviceDetector = {
    isMobile: boolean,
    isTablet: boolean,
    isTouch: boolean,
    pixelRatio: number
}
```
- Detects device type via user agent and touch capabilities
- Adjusts quality settings automatically
- Determines control scheme (mobile vs desktop)

#### 2. **Viewport Scaling System** (`game.js`)
```javascript
const ViewportScale = {
    baseWidth: 1920,
    baseHeight: 1080,
    scale: computed,
    playerSize: computed,
    bulletSize: computed,
    enemySize: computed
}
```
- **CRITICAL:** All game object sizes are computed dynamically based on viewport
- Uses percentage-based scaling (e.g., `screenWidth * 0.02`)
- Updates on window resize events

#### 3. **Game State Management** (`game.js`)
```javascript
const gameState = {
    isPlaying: boolean,
    isGameOver: boolean,
    isPaused: boolean,
    isCountdown: boolean,
    wave: number,
    score: number,
    kills: number,
    experience: number,
    experienceThisWave: object
}
```

#### 4. **Player Stats System** (`game.js`)
```javascript
const playerStats = {
    movementSpeed: { level, baseValue, currentValue, increment, cost() },
    fireRate: { ... },
    resilience: { ... },
    bulletDamage: { ... },
    maxHealth: { ... },
    pickupMagnet: { ... },
    criticalChance: { ... },
    regeneration: { ... }
}
```
- **Compound growth:** Most stats use `baseValue * Math.pow(1 + increment, level)`
- **Cost scaling:** `10 * Math.pow(1.2, level) + (level+1)^2 * 2`
- **Snapshot system:** Allows undo of upgrades before accepting

#### 5. **Enemy Type System** (`game.js`)
```javascript
const ENEMY_TYPES = {
    BASIC: { sizeMultiplier: 1, speedMultiplier: 1, healthMultiplier: 1, spawnChance: 0.50 },
    FAST: { sizeMultiplier: 0.5, speedMultiplier: 1.15, healthMultiplier: 0.5, spawnChance: 0.15 },
    HEAVY: { sizeMultiplier: 1.25, speedMultiplier: 0.85, healthMultiplier: 1.25, spawnChance: 0.15 },
    SUPERHEAVY: { sizeMultiplier: 1.35, speedMultiplier: 0.75, healthMultiplier: 1.35, spawnChance: 0.10 },
    EXPLOSIVE: { sizeMultiplier: 1, speedMultiplier: 1, healthMultiplier: 1, spawnChance: 0.10, explosive: true },
    BOSS: { sizeMultiplier: 2.2, speedMultiplier: 0.8, healthMultiplier: 5, isBoss: true }
}
```
- **Boss waves:** Every 5 waves (multiples of 5)
- **XP scaling:** Different enemies grant different XP amounts multiplied by wave number

---

## 🎨 UI/UX Design Patterns

### Responsive CSS Architecture

#### **CRITICAL LESSON:** Always use viewport units, never fixed pixels
```css
/* ❌ WRONG - Fixed sizes don't scale */
width: 120px;
height: 120px;
font-size: 36px;

/* ✅ CORRECT - Responsive scaling */
width: clamp(100px, 18vw, 140px);
height: clamp(100px, 18vw, 140px);
font-size: clamp(28px, 5vw, 42px);
```

#### **CSS Units Guide:**
- `vw` - Viewport width percentage (1vw = 1% of screen width)
- `vh` - Viewport height percentage (1vh = 1% of screen height)
- `clamp(min, ideal, max)` - Responsive with boundaries
- `%` - Percentage of parent element

#### **Z-Index Hierarchy: Complete Guide (UPDATED v4.0.1)**

**CRITICAL:** Z-index management is essential for proper game rendering. The canvas must be visible but overlays must appear above it.

**Current Hierarchy (After Bug Fix - October 31, 2025):**
```
Layer 0-10: Game Rendering
├─ z-index: 1       - #gameCanvas (game rendering layer)
└─ Comments: Canvas MUST have explicit z-index to render above body background

Layer 100-1000: In-Game UI
├─ z-index: 500     - .mobile-controls (joysticks, buttons)
└─ z-index: 1000    - .hud (health bar, wave, score, kills)

Layer 3000-5000: In-Game Notifications
├─ z-index: 3000    - .wave-indicator (wave announcements)
├─ z-index: 5000    - .notification (pickups, events)
└─ z-index: 5000    - .wave-countdown (countdown before wave)

Layer 6000-7000: Game State Modals
├─ z-index: 6000    - .game-over (game over screen)
├─ z-index: 6500    - #pauseOverlay (pause menu with stats)
└─ z-index: 7000    - .upgrade-modal (level up screen)

Layer 8000-8999: Menu Screens
├─ z-index: 8000    - .start-menu (main menu/login)
├─ z-index: 8001    - .level-selector (wave selection)
├─ z-index: 8001    - .stats-page (rankings and stats)
├─ z-index: 8002    - .settings-menu (settings overlay)
└─ z-index: 8002    - .close-level-selector (close button)

Layer 9000-9999: System Modals
├─ z-index: 9000    - .modal-overlay (user options modal)
├─ z-index: 9001    - .avatar-modal-overlay (avatar selection)
└─ z-index: 9500    - .loading-screen (initial load screen)

Layer 10000+: Always On Top
└─ z-index: 10000   - .custom-cursor (PC cursor override)
```

**CRITICAL BUG FIX (October 31, 2025):**
- **Problem:** Player and enemies were invisible despite game running
- **Root Cause:** Start Menu had `z-index: 10000`, blocking canvas (`z-index: 1`)
- **Solution:** Restructured entire z-index hierarchy with logical separation
- **Files Modified:** `index.html` (11 z-index values changed)

**Z-Index Rules & Best Practices:**

1. **Never Overlap Functional Layers**
   - Game rendering (1-10)
   - UI elements (100-1000)
   - Notifications (3000-5000)
   - Modals (6000-9999)
   - System overlays (10000+)

2. **Canvas Z-Index Requirements**
   ```css
   #gameCanvas {
       position: absolute;
       z-index: 1; /* MANDATORY - without this, canvas renders behind everything */
       top: 0;
       left: 0;
       width: 100%;
       height: 100%;
   }
   ```

3. **Hidden Elements Keep Z-Index**
   - Elements with `display: none` or `.hidden` class still occupy z-index space
   - Use proper class toggles: `.start-menu.hidden { display: none; }`
   - Inline styles with z-index can override CSS (avoid when possible)

4. **Modal Stacking Context**
   - Each modal should be 1-10 units higher than the previous layer
   - User modals (9000+) should always be above menu screens (8000-8999)
   - Loading screen (9500) should cover everything except cursor

5. **Debugging Z-Index Issues**
   ```javascript
   // Console command to check z-index of all elements
   document.querySelectorAll('*').forEach(el => {
       const z = window.getComputedStyle(el).zIndex;
       if (z !== 'auto') console.log(el.id || el.className, ':', z);
   });
   ```

**Common Z-Index Anti-Patterns to Avoid:**

❌ **Using Extreme Values**
```css
/* WRONG - Makes hierarchy management impossible */
.modal { z-index: 999999; }
.another-modal { z-index: 9999999; }
```

❌ **Inline Z-Index Overrides**
```html
<!-- WRONG - Hard to manage and override -->
<div style="z-index: 9500;"></div>
```

❌ **No Separation Between Layers**
```css
/* WRONG - Causes conflicts when adding elements */
.menu { z-index: 100; }
.modal { z-index: 101; }
.another-modal { z-index: 102; }
```

✅ **Correct Approach**
```css
/* RIGHT - Clear separation and room for growth */
.menu { z-index: 8000; }
.modal { z-index: 9000; }
.system-modal { z-index: 9500; }
```

**Z-Index Change History:**

**v4.0.1 - October 31, 2025 (Critical Bug Fix)**
| Element | Old Value | New Value | Reason |
|---------|-----------|-----------|--------|
| .start-menu | 10000 | 8000 | Was blocking canvas |
| .level-selector | 10001 | 8001 | Logical grouping with menus |
| .close-level-selector | 10002 | 8002 | Above menu screens |
| .stats-page | 10001 | 8001 | Grouped with menu screens |
| .settings-menu | 10002 | 8002 | Above menu screens |
| .upgrade-modal | 10000 | 7000 | Game modal layer |
| .modal-overlay (user) | 999999 | 9000 | System modal layer |
| .avatar-modal-overlay | 9999999 | 9001 | Above user modal |
| #pauseOverlay (inline) | 9500 | 6500 | Game modal layer |
| .game-over | 9000 | 6000 | Game modal layer |
| .loading-screen | 10000 | 9500 | System loading layer |

**Testing Z-Index Hierarchy:**
```javascript
// Add this to console to verify canvas is visible
const canvas = document.getElementById('gameCanvas');
const canvasZ = window.getComputedStyle(canvas).zIndex;
const startMenu = document.getElementById('startMenu');
const menuZ = window.getComputedStyle(startMenu).zIndex;

console.log('Canvas z-index:', canvasZ); // Should be "1"
console.log('Menu z-index:', menuZ);     // Should be "8000"
console.log('Menu visible:', startMenu.classList.contains('hidden') ? 'NO' : 'YES');

if (parseInt(menuZ) > parseInt(canvasZ) && !startMenu.classList.contains('hidden')) {
    console.error('⚠️ PROBLEM: Menu is blocking canvas!');
}
```

### Control Systems

#### **Dual Joystick Mode (Wild Rift Style)**
- **Left Joystick:** Movement (8-directional)
- **Right Joystick:** Aim and auto-fire
- **Small buttons above joysticks:** Pause (left), Ability (right)
- **Touch areas:** Base elements capture events, stick elements are `pointer-events: none`

#### **Joystick Implementation Pattern:**
```javascript
// Container: pointer-events: none
// Base: pointer-events: all (captures touches)
// Stick: pointer-events: none (visual only)

let touchId = null;
base.addEventListener('touchstart', (e) => {
    touchId = e.changedTouches[0].identifier;
    // Calculate center and activate
});

document.addEventListener('touchmove', (e) => {
    // Find touch by identifier
    // Calculate delta from center
    // Clamp to max distance (50px)
    // Update stick position and input values
});

document.addEventListener('touchend', (e) => {
    // Reset position when touch released
    touchId = null;
});
```

---

## 🔥 Firebase Integration

### Configuration
```javascript
const firebaseConfig = {
    apiKey: "AIzaSyCUwlvMjqBljR68JlBYGzJwvttWg2AvEdM",
    authDomain: "neon-survivor-fdb4c.firebaseapp.com",
    projectId: "neon-survivor-fdb4c",
    storageBucket: "neon-survivor-fdb4c.appspot.com",
    messagingSenderId: "843900625599",
    appId: "1:843900625599:web:222c0618acc6c2112a1c0a",
    measurementId: "G-YVZY35ZYSW"
};
```

### Collections Structure

#### **usuarios** (User profiles)
```javascript
{
    uid: string,
    nombre: string,
    email: string,
    foto: string,
    fechaRegistro: Timestamp,
    ultimaConexion: Timestamp,
    maxLevelReached: number,
    // Optional demographics
    edad: number,
    sexo: string,
    region: string,
    pais: string,
    continente: string
}
```

#### **usuarios/{uid}/partidas** (User game sessions - subcollection)
```javascript
{
    score: number,
    wave: number,
    kills: number,
    fecha: Timestamp,
    duracion: number, // milliseconds
    endType: "FINISHED" | "ABORTED"
}
```

#### **ranking** (Global leaderboard)
```javascript
{
    userId: string,
    userName: string,
    score: number,
    wave: number,
    kills: number,
    fecha: Timestamp,
    duracion: number,
    endType: string
}
```

### Required Firestore Indexes
For ranking queries, create composite indexes:
1. `(fecha DESC, score DESC)` - Daily/Monthly rankings
2. `(score DESC)` - All-time rankings

### Guest Mode
- **Flag:** `window.isGuestMode = true/false`
- **Restrictions:** No cloud save, no rankings, more ads
- **Avatar:** `guest_user_logo.png` (local asset)
- **Login prompt:** Displayed in settings and stats pages

---

## 📱 Android Build Process

### Prerequisites
1. **Android SDK** installed (via Android Studio)
2. **Java JDK 11+**
3. **Gradle** (wrapper included)
4. **Keystore file** for APK signing

### Build Commands

#### **Debug Build:**
```powershell
.\gradlew assembleDebug
# Output: app\build\outputs\apk\debug\app-debug.apk
```

#### **Release Build (unsigned):**
```powershell
.\gradlew assembleRelease
# Output: app\build\outputs\apk\release\app-release-unsigned.apk
```

#### **Generate Keystore:**
```powershell
keytool -genkeypair -v -keystore mi_keystore.jks -alias mi_alias -keyalg RSA -keysize 2048 -validity 10000
```

#### **Sign APK with apksigner:**
```powershell
apksigner sign --ks mi_keystore.jks --ks-key-alias mi_alias --ks-pass pass:PASSWORD --key-pass pass:PASSWORD --out app-release-signed.apk app-release-unsigned.apk
```

#### **Verify Signature:**
```powershell
apksigner verify --verbose app-release-signed.apk
```

### Automated Build Script
Use `build_native_apk.ps1` for complete build + sign pipeline:
```powershell
.\build_native_apk.ps1
```

**What it does:**
1. Cleans previous build artifacts
2. Builds release APK
3. Signs with keystore
4. Verifies signature
5. Outputs to project root

---

## 🐛 Common Issues & Solutions

### Issue 1: Canvas Not Visible (Enemies/Player Invisible) ⚠️ CRITICAL
**Symptom:** Game loads, controls work, but no visual elements on canvas (player and enemies invisible)
**Cause:** Menu elements with high z-index values (10000+) blocking canvas (z-index: 1)
**Root Cause Analysis:**
- Start Menu: `z-index: 10000` was covering entire viewport
- Even with `.hidden` class (display: none), the base z-index hierarchy was wrong
- When menu becomes visible again, it blocks canvas
**Complete Solution (Applied October 31, 2025):**
```css
/* 1. Ensure canvas has explicit z-index */
#gameCanvas {
    position: absolute;
    z-index: 1; /* MANDATORY - Base layer for game rendering */
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
}

/* 2. Reduce all menu z-index values to logical layers */
.start-menu { z-index: 8000; /* Was 10000 */ }
.level-selector { z-index: 8001; /* Was 10001 */ }
.stats-page { z-index: 8001; /* Was 10001 */ }
.settings-menu { z-index: 8002; /* Was 10002 */ }

/* 3. Game modals in separate layer */
.game-over { z-index: 6000; /* Was 9000 */ }
#pauseOverlay { z-index: 6500; /* Was 9500 inline */ }
.upgrade-modal { z-index: 7000; /* Was 10000 */ }

/* 4. System modals above menus */
.modal-overlay { z-index: 9000; /* Was 999999 */ }
.avatar-modal-overlay { z-index: 9001; /* Was 9999999 */ }
.loading-screen { z-index: 9500; /* Was 10000 */ }
```
**Verification Steps:**
```javascript
// Run in browser console to verify fix
const canvas = document.getElementById('gameCanvas');
const menu = document.getElementById('startMenu');
const canvasZ = parseInt(window.getComputedStyle(canvas).zIndex);
const menuZ = parseInt(window.getComputedStyle(menu).zIndex);

console.log('Canvas z-index:', canvasZ); // Should be 1
console.log('Menu z-index:', menuZ);     // Should be 8000
console.log('Canvas visible:', canvasZ < menuZ && menu.classList.contains('hidden') ? 'YES' : 'BLOCKED');
```
**Lessons Learned:**
- Z-index values should follow a logical hierarchy (1-10000 range)
- Menu screens (8000-8999) must be below system modals (9000+)
- Canvas (1) must be the lowest layer but still explicit
- Avoid extreme values like 999999 - they make debugging impossible
- Always test visibility by checking z-index relationships, not just display property

### Issue 2: Controls Don't Scale on Different Screens
**Symptom:** Buttons/joysticks too small or too large on some devices
**Cause:** Fixed pixel sizes instead of responsive units
**Solution:** Use `clamp()` and viewport units
```css
/* Before */
width: 120px;

/* After */
width: clamp(100px, 18vw, 140px);
```

### Issue 3: Pause Overlay Doesn't Show
**Symptom:** Clicking pause button doesn't display overlay
**Cause:** Event listeners not attached or gameState.isPaused not set
**Solution:** Ensure mobile controls are initialized:
```javascript
initializeMobileControls(); // Called in startGameFromMenu
```

### Issue 4: Touch Events Not Working
**Symptom:** Joysticks don't respond to touch
**Cause:** `pointer-events: none` on wrong element
**Solution:**
```css
.joystick-container { pointer-events: none; }
.joystick-base { pointer-events: all; } /* Only base captures */
.joystick-stick { pointer-events: none; }
```

### Issue 5: Firebase Index Missing
**Symptom:** "Index required" error in console
**Cause:** Firestore composite queries need indexes
**Solution:** Click the link in error message to create index in Firebase console

### Issue 6: Game Doesn't Start After Wave Complete
**Symptom:** Stuck on upgrade modal or blank screen
**Cause:** `showUpgradeModal` not defined or modal logic broken
**Solution:** Check browser console for errors, ensure `window.showUpgradeModal` is registered

### Issue 7: Z-Index Conflicts Between UI Elements
**Symptom:** Modals appear behind menus, or multiple overlays conflict
**Cause:** Overlapping z-index ranges or inline style overrides
**Solution:** Follow the established z-index hierarchy (see UI/UX Design Patterns section)
**Debugging:**
```javascript
// Find all elements with z-index
Array.from(document.querySelectorAll('*'))
    .filter(el => window.getComputedStyle(el).zIndex !== 'auto')
    .map(el => ({
        element: el.id || el.className,
        zIndex: window.getComputedStyle(el).zIndex,
        display: window.getComputedStyle(el).display
    }))
    .sort((a, b) => parseInt(a.zIndex) - parseInt(b.zIndex))
    .forEach(item => console.log(item));
```

### Issue 8: Menu Screens Not Fitting on Small Devices
**Symptom:** Menus require scrolling on mobile devices
**Cause:** Fixed pixel sizes or improper use of viewport units
**Solution (Applied October 31, 2025):**
```css
/* Use clamp() for all container sizes */
.level-selector {
    width: clamp(320px, 90vw, 500px);
    height: clamp(500px, 75vh, 700px);
    /* NOT: width: 500px; height: 700px; */
}

/* Use grid with auto-fit for item grids */
.level-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: clamp(8px, 2vw, 15px);
}

/* Font sizes with clamp */
h2 {
    font-size: clamp(20px, 4vw, 28px);
    /* NOT: font-size: 28px; */
}
```
**Vertical Format Optimization Checklist:**
- [ ] All containers use `clamp(min, ideal, max)` for dimensions
- [ ] Grid systems use `repeat(auto-fit, minmax())` or fixed columns (3x3)
- [ ] Pagination implemented for long lists (9 items per page max)
- [ ] Font sizes scale with viewport (clamp for typography)
- [ ] Buttons and controls use percentage-based sizing
- [ ] Test on 360x640, 414x896, and 768x1024 viewports

### Issue 9: Touch Events Not Registering on Overlays
**Symptom:** Can't interact with buttons when modal is open
**Cause:** `pointer-events: none` on wrong element or z-index blocking
**Solution:**
```css
/* Modal container should capture events */
.modal-overlay {
    pointer-events: all;
    z-index: 9000; /* Must be higher than content behind it */
}

/* Content inside modal should also be interactive */
.modal-content {
    pointer-events: all;
}

/* Only visual decorations should ignore events */
.modal-backdrop-blur {
    pointer-events: none;
}
```

---

## 🎯 Performance Optimization

### Quality Settings by Device
```javascript
const qualitySettings = DeviceDetector.getQualitySettings();
// Mobile: { maxParticles: 80, maxEnemies: 40, shadowBlur: 15 }
// Tablet: { maxParticles: 120, maxEnemies: 60, shadowBlur: 20 }
// Desktop: { maxParticles: 250, maxEnemies: 120, shadowBlur: 30 }
```

### Canvas Rendering Optimizations
1. **Device Pixel Ratio:** Clamped to max 2x to prevent over-rendering
2. **Context Options:** `{ alpha: false, desynchronized: true }`
3. **Particle Pooling:** Old particles removed when exceeding max count
4. **Trail Length:** Scaled by quality settings (6-12 points)

### Memory Management
- Arrays filtered regularly (bullets, particles, enemies)
- Dead objects removed immediately
- No memory leaks from event listeners (proper cleanup)

---

## 🚀 Deployment Checklist

### Pre-Build
- [ ] Update version number in HTML (`v4.0.1`)
- [ ] Update build number in `game.js` console log
- [ ] Test on multiple screen sizes (360x640, 414x896, 768x1024)
- [ ] Test touch controls on real device
- [ ] Verify Firebase connection
- [ ] Check all z-index values (run verification script)
- [ ] Verify all menus fit without scrolling
- [ ] Test canvas visibility (player and enemies visible)
- [ ] Confirm no inline z-index overrides
- [ ] Check console for errors and warnings

### Build
- [ ] Clean previous builds: `.\gradlew clean`
- [ ] Generate release APK: `.\gradlew assembleRelease`
- [ ] Sign APK with keystore
- [ ] Verify signature: `apksigner verify --verbose`
- [ ] Test on physical Android device
- [ ] Verify APK size (should be < 10MB)
- [ ] Check for ProGuard errors (if enabled)

### Post-Deploy
- [ ] Monitor Firebase usage
- [ ] Check crash reports
- [ ] Review player feedback
- [ ] Update ranking indexes if needed
- [ ] Monitor z-index related bug reports
- [ ] Track performance metrics (FPS, memory)
- [ ] Verify responsive design on user devices
- [ ] Document any new issues in PROJECT_CONTEXT.md

### Z-Index Specific Checks (Added October 31, 2025)
- [ ] Run `verifyZIndexHierarchy()` in browser console
- [ ] Visually confirm canvas renders game elements
- [ ] Check that menus don't block canvas when hidden
- [ ] Verify modal stacking (user modal > menu > canvas)
- [ ] Test loading screen covers everything initially
- [ ] Confirm pause overlay appears above game but below system modals
- [ ] Validate no extreme z-index values (> 10000 except cursor)

---

## 📊 Analytics & Metrics

### Key Metrics to Track
- **User Retention:** Daily/Weekly active users
- **Wave Progression:** Average wave reached per session
- **Session Duration:** Average playtime
- **Monetization:** Ad views per session (guest vs registered)
- **Conversion Rate:** Guest → Registered users

### Firebase Analytics Events (Recommended)
```javascript
firebase.analytics().logEvent('wave_completed', { wave: number });
firebase.analytics().logEvent('game_over', { score: number, wave: number });
firebase.analytics().logEvent('upgrade_purchased', { stat: string, level: number });
```

---

## 🔐 Security Considerations

### Firebase Rules (Example)
```javascript
// Firestore Security Rules
service cloud.firestore {
  match /databases/{database}/documents {
    match /usuarios/{userId} {
      allow read, write: if request.auth != null && request.auth.uid == userId;
    }
    match /ranking/{docId} {
      allow read: if true;
      allow write: if request.auth != null;
    }
  }
}
```

### APK Signing
- **Never commit keystore files** to version control
- Store passwords securely (environment variables or secure vault)
- Use different keys for debug vs release builds
- Keep keystore backup in safe location

---

## 🎨 Design System

### Color Palette
```css
/* Primary Colors */
--neon-cyan: #00ffff;
--neon-magenta: #ff00ff;
--neon-yellow: #ffff00;
--neon-red: #ff0055;
--neon-green: #00ff00;

/* Background Colors */
--bg-dark: #0a0033;
--bg-darker: #000000;
--bg-overlay: rgba(0, 0, 0, 0.95);

/* UI Colors */
--ui-cyan-glow: rgba(0, 255, 255, 0.3);
--ui-magenta-glow: rgba(255, 0, 255, 0.3);
```

### Typography
- **Primary Font:** Orbitron (headings, numbers, UI)
- **Secondary Font:** Rajdhani (body text, descriptions)
- **Font Sizes:** Always use `clamp()` for responsiveness

### Animation Patterns
```css
/* Glow pulse */
@keyframes glow-pulse {
    0%, 100% { box-shadow: 0 0 20px rgba(0, 255, 255, 0.5); }
    50% { box-shadow: 0 0 40px rgba(0, 255, 255, 1); }
}

/* Gradient shift */
@keyframes gradient-shift {
    0%, 100% { background-position: 0% 50%; }
    50% { background-position: 100% 50%; }
}
```

---

## 📚 Code Conventions

### JavaScript
- **Naming:** camelCase for variables/functions, PascalCase for constructors
- **Constants:** UPPER_SNAKE_CASE for true constants
- **Globals:** Use `window.` prefix for intentionally global functions
- **Comments:** Sectional comments with `===` separators

### CSS
- **Class Naming:** kebab-case (e.g., `.joystick-container`)
- **BEM Pattern:** Used for complex components
- **Media Queries:** Mobile-first approach (design for mobile, enhance for desktop)

### File Organization
- **index.html:** All HTML, CSS, and Firebase integration
- **game.js:** Pure game logic, no DOM manipulation for UI
- **Separation of Concerns:** Game engine doesn't know about menus

---

## 🧪 Testing Strategy

### Manual Testing Checklist
**Basic Functionality:**
- [ ] Touch controls respond correctly
- [ ] Canvas renders enemies and player (verify z-index)
- [ ] Wave progression works
- [ ] Upgrade modal appears and functions
- [ ] Pause/resume works
- [ ] Firebase auth (Google + Guest)
- [ ] Rankings display correctly
- [ ] Settings save and apply

**Z-Index & Visibility Tests (CRITICAL):**
- [ ] Canvas is visible when game starts
- [ ] Player character visible and animating
- [ ] Enemies spawn and are visible
- [ ] HUD displays above canvas
- [ ] Menus cover canvas when active
- [ ] Modals appear above menus
- [ ] Loading screen covers everything
- [ ] No z-index conflicts (run debug script)

**Responsive Design Tests:**
- [ ] All menus fit without scrolling on 360x640 screen
- [ ] All menus fit without scrolling on 414x896 screen
- [ ] All menus fit without scrolling on 768x1024 screen
- [ ] Font sizes scale appropriately
- [ ] Buttons are touchable (min 44x44px)
- [ ] Grid layouts maintain 3x3 structure
- [ ] Pagination works correctly

**Vertical Format Tests (Added October 31, 2025):**
- [ ] Start menu fits in viewport (no scroll)
- [ ] Level selector shows 3x3 grid (9 levels per page)
- [ ] Stats page fits without scrolling
- [ ] Settings menu fits without scrolling
- [ ] Upgrade modal fits without scrolling
- [ ] Pause overlay fits without scrolling
- [ ] All text readable at minimum viewport (360px width)

### Device Testing Matrix
**Screen Sizes:**
- **Small:** 360x640 (Samsung Galaxy S5, older devices)
- **Medium:** 414x896 (iPhone 11, standard modern phones)
- **Large:** 768x1024 (tablets, phablets)

**Android Versions:**
- **Minimum:** 8.0 (Oreo)
- **Recommended:** 10.0+ (Android 10+)
- **Target:** Latest stable version

**Browsers (for web version):**
- Chrome Mobile (primary)
- Firefox Mobile (secondary)
- Samsung Internet (test compatibility)

### Automated Testing (Future Enhancement)
```javascript
// Unit tests for z-index hierarchy
describe('Z-Index Hierarchy', () => {
    test('Canvas z-index is 1', () => {
        const canvas = document.getElementById('gameCanvas');
        expect(window.getComputedStyle(canvas).zIndex).toBe('1');
    });

    test('Menus are above canvas', () => {
        const menu = document.getElementById('startMenu');
        const canvas = document.getElementById('gameCanvas');
        const menuZ = parseInt(window.getComputedStyle(menu).zIndex);
        const canvasZ = parseInt(window.getComputedStyle(canvas).zIndex);
        expect(menuZ).toBeGreaterThan(canvasZ);
    });

    test('Modals are above menus', () => {
        const modal = document.getElementById('userOptionsModal');
        const menu = document.getElementById('startMenu');
        const modalZ = parseInt(window.getComputedStyle(modal).zIndex);
        const menuZ = parseInt(window.getComputedStyle(menu).zIndex);
        expect(modalZ).toBeGreaterThan(menuZ);
    });
});

// Visual regression tests
describe('Responsive Design', () => {
    test('Menu fits in small viewport', () => {
        window.resizeTo(360, 640);
        const menu = document.getElementById('startMenu');
        expect(menu.scrollHeight).toBeLessThanOrEqual(640);
    });
});
```

### Z-Index Verification Script (Run Before Build)
```javascript
// Copy-paste into browser console to verify z-index hierarchy
function verifyZIndexHierarchy() {
    const elements = {
        canvas: document.getElementById('gameCanvas'),
        controls: document.getElementById('mobileControls'),
        hud: document.getElementById('gameHUD'),
        startMenu: document.getElementById('startMenu'),
        levelSelector: document.getElementById('levelSelector'),
        statsPage: document.getElementById('statsPage'),
        settingsMenu: document.getElementById('settingsMenu'),
        upgradeModal: document.getElementById('upgradeModal'),
        pauseOverlay: document.getElementById('pauseOverlay'),
        gameOver: document.getElementById('gameOver'),
        userModal: document.getElementById('userOptionsModal'),
        avatarModal: document.getElementById('avatarSelectionModal'),
        loadingScreen: document.getElementById('loadingScreen')
    };

    const zIndexes = {};
    Object.keys(elements).forEach(key => {
        if (elements[key]) {
            zIndexes[key] = parseInt(window.getComputedStyle(elements[key]).zIndex) || 0;
        }
    });

    console.log('=== Z-Index Hierarchy ===');
    Object.entries(zIndexes)
        .sort((a, b) => a[1] - b[1])
        .forEach(([name, z]) => {
            const status = z === 1 || (z >= 500 && z <= 10000) ? '✅' : '⚠️';
            console.log(`${status} ${name}: ${z}`);
        });

    // Verify critical relationships
    const issues = [];
    if (zIndexes.canvas !== 1) issues.push('Canvas z-index should be 1');
    if (zIndexes.startMenu <= zIndexes.canvas) issues.push('Start menu must be above canvas');
    if (zIndexes.userModal <= zIndexes.startMenu) issues.push('User modal must be above start menu');

    if (issues.length > 0) {
        console.error('⚠️ Z-Index Issues Found:');
        issues.forEach(issue => console.error('  - ' + issue));
    } else {
        console.log('✅ All z-index values correct!');
    }

    return zIndexes;
}

// Run verification
verifyZIndexHierarchy();
```

### Performance Testing
**Metrics to Monitor:**
- FPS during gameplay (target: 60fps on mid-range devices)
- Memory usage (should not exceed 200MB)
- Battery consumption (background: minimal, gameplay: moderate)
- Load time (target: < 3 seconds on 4G)

**Testing Tools:**
- Chrome DevTools Performance tab
- Android Profiler (Memory, CPU, Energy)
- Firebase Performance Monitoring

---

## 🔄 Version History

### v4.0.1 (Build 24OCT-1800 / Updated 31OCT-2025)
- **CRITICAL BUG FIX:** Fixed invisible player/enemies by restructuring z-index hierarchy
- Fixed canvas z-index issue (11 z-index values corrected across index.html)
- Converted all controls to responsive units (clamp/vw/vh)
- Improved dual joystick system with proper touch event handling
- Enhanced pause overlay with detailed wave stats
- Optimized Firebase queries for ranking system
- Implemented 3x3 pagination for level selector (eliminates scrolling)
- Vertical format optimization for all menus (no scroll required)
- Normalized z-index values from extreme ranges (999999) to logical layers (1-10000)

**Z-Index Restructuring Details:**
- Menu screens: Reduced from 10000-10002 to 8000-8002
- Game modals: Moved to 6000-7000 layer
- System modals: Normalized from 999999/9999999 to 9000-9001
- Loading screen: Adjusted to 9500 (highest priority except cursor)
- Canvas: Explicitly set to z-index: 1 (base rendering layer)

**Files Modified:**
- `index.html`: 11 z-index corrections with inline documentation
- UI remains fully responsive across all screen sizes
- All vertical format optimizations preserved

### v4.0.0
- Complete rewrite with dual joystick controls
- Firebase integration for cloud saves
- Ranking system (daily/monthly/all-time)
- Guest mode support
- Responsive UI overhaul

---

## 🤝 Contribution Guidelines

### Adding New Features
1. **Check compatibility** with mobile touch controls
2. **Use responsive units** for all UI elements
3. **Test on real devices**, not just emulator
4. **Update this document** with new patterns/solutions
5. **Maintain z-index hierarchy**

### Code Style
- Consistent indentation (4 spaces)
- Comments for complex logic
- Descriptive variable names
- Avoid jQuery or heavy frameworks

---

## 📞 Support & Resources

### Documentation
- [Firebase Docs](https://firebase.google.com/docs)
- [HTML5 Canvas API](https://developer.mozilla.org/en-US/docs/Web/API/Canvas_API)
- [CSS clamp()](https://developer.mozilla.org/en-US/docs/Web/CSS/clamp)
- [Android Gradle Plugin](https://developer.android.com/studio/releases/gradle-plugin)

### Tools
- **Android Studio:** Full IDE with emulator
- **VS Code:** Lightweight editor with extensions
- **Chrome DevTools:** Mobile device simulation
- **Firebase Console:** Database and auth management

---

## 🎓 Key Learnings & Best Practices

### 1. **Always Think Responsive First**
Every single pixel value should be questioned. Use viewport units and clamp() religiously.

### 2. **Z-Index is Critical for Canvas Games**
Canvas elements need explicit z-index to appear above background but below UI.

### 3. **Mobile Touch Events are Different**
- Use `touchstart`, `touchmove`, `touchend`
- Track touches by `identifier`
- Prevent default to avoid scroll/zoom
- Use `pointer-events` wisely

### 4. **Game Loop Must Be Clean**
Separate concerns:
- Update logic (physics, collision)
- Render logic (draw to canvas)
- UI logic (menus, modals)

### 5. **Firebase Firestore Needs Planning**
- Structure collections logically
- Use subcollections for user-specific data
- Create composite indexes before querying
- Limit queries to prevent overload

### 6. **Testing on Real Devices is Mandatory**
Emulators don't catch touch issues, performance problems, or screen size quirks.

### 7. **Performance Matters on Mobile**
- Limit particle count
- Optimize canvas rendering
- Use requestAnimationFrame
- Clean up unused objects

### 8. **User Experience Details**
- Smooth animations (CSS transitions)
- Haptic feedback (vibration)
- Visual feedback on interactions
- Clear visual hierarchy

### 9. **Z-Index Management is Non-Negotiable**
In HTML5 canvas games, z-index hierarchy determines what users actually see. A single wrong value can make the entire game invisible.
- **Always use logical layers** (1-10, 100-1000, etc.)
- **Document z-index values** in CSS comments
- **Test visibility** after any z-index change
- **Avoid inline styles** with z-index (they override CSS)
- **Never use extreme values** (999999) - they create maintenance nightmares

**Critical Z-Index Rule for Canvas Games:**
```css
/* Canvas must have explicit z-index to render above body */
#gameCanvas {
    z-index: 1; /* Base layer - all other UI builds on top */
}

/* Menu screens must be high enough to cover game but not system modals */
.menu { z-index: 8000; /* Above game (1), below modals (9000+) */ }
```

### 10. **Responsive Design for Mobile Games**
Every pixel value is a potential bug on different screen sizes.
- **Think in percentages and viewport units**, not pixels
- **Use clamp() religiously** for all sizing
- **Test on actual devices**, not just Chrome DevTools
- **Design for vertical format first** (most mobile users)
- **Implement pagination** for long lists (avoid scrolling in game menus)

**Mobile-First Sizing Pattern:**
```css
/* ❌ WRONG - Fixed sizes */
.container { width: 500px; height: 700px; }
.button { font-size: 18px; padding: 10px 20px; }

/* ✅ CORRECT - Responsive scaling */
.container {
    width: clamp(320px, 90vw, 500px);
    height: clamp(500px, 75vh, 700px);
}
.button {
    font-size: clamp(14px, 3vw, 18px);
    padding: clamp(8px, 2vw, 12px) clamp(16px, 4vw, 24px);
}
```

### 11. **Vertical Format Optimization Strategy**
Implemented October 31, 2025 to eliminate all scrolling from game menus.

**Requirements:**
- All menus must fit in viewport without scroll
- Touch targets must be large enough (min 44x44px)
- Text must be readable (min 14px, max 3-4 lines)
- Grid layouts should be 3x3 maximum per page

**Implementation:**
1. **Container Heights:** Use `clamp(min, 75vh, max)` to ensure viewport fit
2. **Content Pagination:** Max 9 items per page (3x3 grid)
3. **Font Scaling:** Use `clamp()` with vw units for dynamic sizing
4. **Gap Management:** Use `clamp(8px, 2vw, 15px)` for grid gaps
5. **Button Heights:** Use percentage of container, not fixed pixels

**Example - Level Selector (3x3 Pagination):**
```css
.level-selector {
    height: clamp(500px, 75vh, 700px); /* Fits in viewport */
}

.level-grid {
    display: grid;
    grid-template-columns: repeat(3, 1fr); /* 3 columns */
    grid-template-rows: repeat(3, 1fr);     /* 3 rows */
    gap: clamp(8px, 2vw, 15px);
}

.level-item {
    aspect-ratio: 1; /* Square items */
    font-size: clamp(16px, 3vw, 22px);
}
```

**Pagination Logic:**
```javascript
const levelsPerPage = 9; // 3x3 grid
const totalPages = Math.ceil(maxLevel / levelsPerPage);
const startIdx = (currentPage - 1) * levelsPerPage + 1;
const endIdx = Math.min(startIdx + levelsPerPage - 1, maxLevel);
```

---

## 🔮 Future Enhancements

### Potential Features
- [ ] **Power-ups:** Temporary boosts during gameplay
- [ ] **Achievements System:** Unlock badges and rewards
- [ ] **Daily Challenges:** Special wave configurations
- [ ] **Multiplayer Mode:** Co-op or competitive
- [ ] **Skin System:** Customizable player/enemy appearances
- [ ] **Sound Effects:** Full audio implementation
- [ ] **Background Music:** Dynamic soundtrack
- [ ] **Offline Mode:** Play without internet
- [ ] **Social Sharing:** Share scores on social media
- [ ] **Localization:** Multiple language support

### Technical Improvements
- [ ] **WebGL Rendering:** Better performance for effects
- [ ] **Service Worker:** Progressive Web App features
- [ ] **Asset Preloading:** Faster initial load
- [ ] **Code Splitting:** Lazy load non-critical code
- [ ] **Automated Testing:** Jest/Cypress integration
- [ ] **CI/CD Pipeline:** Automated builds and deployment

---

## 📄 License & Credits

### Project Information
- **Created:** 2024-2025
- **Language:** JavaScript, HTML5, CSS3
- **Platform:** Android
- **Status:** Active Development

### Third-Party Assets
- **Firebase:** Backend services (Google LLC)
- **Google Fonts:** Orbitron, Rajdhani fonts
- **Icons:** Custom SVG icons (inline)

---

## 🏁 Final Notes for Future Developers

This project demonstrates a complete mobile game built with vanilla web technologies and wrapped as an Android app. The key to success is understanding the mobile-first approach and respecting the constraints of touch interfaces.

**Most Important Lessons:**
1. **Canvas z-index must be set explicitly** - Without it, game renders behind everything
2. **All sizes must be responsive** (vw/vh/clamp) - Fixed pixels break on different screens
3. **Touch events require careful identifier tracking** - Mobile touch is not mouse events
4. **Firebase queries need proper indexes** - Composite queries fail without indexes
5. **Performance optimization is non-negotiable** on mobile - Limit particles, enemies, effects
6. **Z-index hierarchy must be logical** - Use layers (1-10, 100-1000, etc.), never extreme values
7. **Vertical format requires pagination** - 3x3 grids max, no scrolling in game menus
8. **Always test on real devices** - Emulators miss touch issues and performance problems

**Critical Files:**
- `index.html` (5520 lines): All HTML, CSS, Firebase integration, UI logic
- `game.js` (2322 lines): Pure game engine, canvas rendering, physics
- `build_native_apk.ps1`: Automated Android build pipeline
- `PROJECT_CONTEXT.md`: This document - READ BEFORE CODING

**Z-Index Debugging Commands:**
```javascript
// Check canvas visibility
const canvas = document.getElementById('gameCanvas');
const menu = document.getElementById('startMenu');
console.log('Canvas z-index:', window.getComputedStyle(canvas).zIndex);
console.log('Menu z-index:', window.getComputedStyle(menu).zIndex);
console.log('Menu hidden:', menu.classList.contains('hidden'));

// List all z-index values
document.querySelectorAll('*').forEach(el => {
    const z = window.getComputedStyle(el).zIndex;
    if (z !== 'auto') console.log((el.id || el.className).substring(0, 30), ':', z);
});
```

**Responsive Design Quick Test:**
```javascript
// Test if all sizes are responsive
const elements = document.querySelectorAll('.start-menu, .level-selector, .stats-page, .settings-menu');
elements.forEach(el => {
    const computed = window.getComputedStyle(el);
    console.log(el.className, {
        width: computed.width,
        height: computed.height,
        fontSize: computed.fontSize,
        padding: computed.padding
    });
});
```

**When in doubt:**
- Test on real device (not just emulator)
- Check the console for errors
- Verify z-index hierarchy (canvas should be 1, menus 8000-8999)
- Ensure responsive units are used (clamp/vw/vh, not px)
- Review this document (especially "Common Issues & Solutions")
- Check that all menus fit without scroll (75vh max height)

**Performance Checklist:**
- [ ] Canvas has `z-index: 1` explicitly set
- [ ] All UI uses clamp() for responsive sizing
- [ ] Mobile controls use pointer-events correctly
- [ ] Firebase queries have proper indexes
- [ ] Particle count limited by device type
- [ ] No memory leaks from event listeners
- [ ] Z-index values follow logical hierarchy (1-10000)
- [ ] All menus fit in viewport without scrolling

**Before Building APK:**
1. Run z-index verification script (see above)
2. Test on multiple screen sizes (360x640, 414x896, 768x1024)
3. Verify all menus fit without scroll
4. Check Firebase connection
5. Test touch controls on real device
6. Verify version numbers updated

**Good luck building amazing mobile games! 🚀**

**Remember:** The biggest bugs come from z-index conflicts and non-responsive sizing. Master these two, and you'll avoid 90% of mobile game UI issues.

---

*Document Version: 2.0 (Major Update)*
*Last Updated: October 31, 2025*
*Major Changes: Z-index hierarchy restructure, vertical format optimization, comprehensive debugging guides*
*Maintained by: Development Team*
