/* ===================================
   GLOBAL CONFIGURATION
   ================================== */

// Firebase Configuration
const FIREBASE_CONFIG = {
    apiKey: "AIzaSyCUwlvMjqBljR68JlBYGzJwvttWg2AvEdM",
    authDomain: "neon-survivor-fdb4c.firebaseapp.com",
    projectId: "neon-survivor-fdb4c",
    storageBucket: "neon-survivor-fdb4c.appspot.com",
    messagingSenderId: "843900625599",
    appId: "1:843900625599:web:222c0618acc6c2112a1c0a",
    measurementId: "G-YVZY35ZYSW"
};

// Avatar System Configuration
const AVATAR_CONFIG = {
    charsets: [
        { id: 'chars_01', file: 'settings-icons/charsets/chars_01.png', cols: 6, rows: 8, unlocked: false },
        { id: 'chars_02', file: 'settings-icons/charsets/chars_02.png', cols: 6, rows: 8, unlocked: true }
    ],
    tileSize: 64
};

// Game Settings
const GAME_SETTINGS = {
    // AdMob settings
    admobReady: false,
    lastBossWaveCompleted: 0,

    // User settings
    currentUser: null,
    maxLevelReached: 1,
    isGuestMode: false,
    gameStartTime: null,

    // Avatar settings
    selectedAvatarIndex: null,
    currentAvatarData: null
};

// Z-Index Hierarchy (from PROJECT_CONTEXT.md)
const Z_INDEX = {
    CANVAS: 1,
    HUD: 1000,
    MOBILE_CONTROLS: 500,
    SETTINGS_BUTTON: 3000,
    MENUS: 8000,
    MODALS: 9000,
    LOADING_SCREEN: 9500,
    CUSTOM_CURSOR: 10000
};

// Export configurations to global scope
window.FIREBASE_CONFIG = FIREBASE_CONFIG;
window.AVATAR_CONFIG = AVATAR_CONFIG;
window.GAME_SETTINGS = GAME_SETTINGS;
window.Z_INDEX = Z_INDEX;

console.log('✅ Config loaded');
