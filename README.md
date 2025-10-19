# 🎮 NEON SURVIVOR ARENA - Universal Edition

> **Epic battle royale roguelike optimized for PC, mobile, and tablet**

![Platform](https://img.shields.io/badge/Platform-Universal-00ffff)
![Status](https://img.shields.io/badge/Status-Production-00ff00)
![Version](https://img.shields.io/badge/Version-2.0.0-ff00ff)

---

## 🌟 Features

### 🎯 Universal Adaptive Gameplay
- **Automatic device detection** - Seamlessly adapts to PC, mobile, and tablet
- **Optimized controls** for each platform:
  - 🖱️ **PC**: WASD movement, mouse aiming/shooting, SPACE for abilities
  - 📱 **Mobile/Tablet**: Virtual joystick, touch buttons, optimized UI
- **Responsive UI** that scales beautifully on any screen size
- **Performance optimization** based on device capabilities

### ⚡ Core Game Mechanics
- **Wave-based survival** with exponential difficulty (2.25x multiplier)
- **5 unique abilities** as collectible power-ups:
  - 🔥 **Fireball Storm** - 8-directional projectile burst
  - ⚡ **Chain Lightning** - Damages 7 nearest enemies
  - ❤️ **Vital Surge** - Restores 60 HP
  - ❄️ **Frost Nova** - Slows all enemies for 3.5s
  - 💣 **Neon Blast** - 250-radius AOE explosion
- **Smart enemy spawning** from outside map boundaries
- **Dynamic particle system** with quality-based rendering
- **Progressive difficulty** that scales with player performance

### 🎨 Visual Design (Inspired by Vampire Survivors)
- **Neon cyberpunk aesthetic** with vibrant gradients
- **Adaptive shadow effects** based on device performance
- **Smooth animations** and visual feedback
- **Professional HUD** with health bars, wave counter, score, and kills
- **Minimalistic pixel-perfect controls** for mobile

---

## 🚀 Quick Start

### Play Immediately
1. Open `index.html` in any modern browser
2. Game automatically detects your device and adapts controls
3. Survive as long as you can!

### Test on Mobile (Desktop Browser)
1. Press `Ctrl + Shift + M` (Chrome/Edge) or `Ctrl + Shift + M` (Firefox)
2. Select a mobile device from the dropdown
3. Refresh the page - virtual controls will appear!

---

## 🎮 Controls

### 💻 PC Controls
| Action | Control |
|--------|---------|
| Move | `W` `A` `S` `D` or Arrow Keys |
| Aim | Mouse Movement |
| Shoot | Hold Left Mouse Button |
| Use Ability | `SPACE` (when collected) |

### 📱 Mobile/Tablet Controls
| Action | Control |
|--------|---------|
| Move | Virtual Joystick (left side) |
| Shoot | 🎯 Shoot Button (right side) |
| Use Ability | ⚡ Ability Button (right side) |

---

## 📦 Project Structure

```
snake/
├── index.html          # Main game HTML (universal UI)
├── game.js             # Core game engine with device detection
├── manifest.json       # PWA manifest for installation
├── README.md           # This file
├── backup/             # Automatic backups
│   └── neon-survivor-backup-*.html
└── .github/
    └── copilot-instructions.md
```

---

## 🛠️ Technology Stack

- **HTML5 Canvas** - High-performance 2D rendering
- **Vanilla JavaScript ES6+** - No dependencies, pure performance
- **CSS3** - Advanced gradients, animations, and responsive design
- **PWA Ready** - Installable on mobile devices
- **Touch Events API** - Native mobile gesture support
- **Device Pixel Ratio** - Crisp rendering on high-DPI screens

---

## 📊 Performance Optimization

### Device-Specific Settings

| Setting | Mobile | Tablet | PC |
|---------|--------|--------|-----|
| Max Particles | 50 | 100 | 200 |
| Max Enemies | 30 | 50 | 100 |
| Shadow Blur | 10px | 15px | 25px |
| Effects Multiplier | 0.5x | 0.75x | 1.0x |
| Pixel Ratio Cap | 2x | 2x | 2x |

### Optimizations Applied
- ✅ Adaptive particle count
- ✅ Efficient collision detection
- ✅ Canvas scaling with device pixel ratio
- ✅ Object pooling for bullets and particles
- ✅ RequestAnimationFrame for smooth 60 FPS
- ✅ Touch event optimization (passive listeners)

---

## 🎯 Game Progression

### Wave System
- **Starting enemies**: 5
- **Growth formula**: `enemies = floor(previous × 2.25)`
- **Spawn rate**: Increases with each wave
- **Enemy stats**: Health and damage scale with wave number

### Scoring
- **Base points**: 100 per kill
- **Wave multiplier**: `score = 100 × current_wave`
- **Survival bonus**: Time-based score accumulation

---

## 📱 Publishing to App Stores

### Google Play (Android)
```bash
# Install Cordova
npm install -g cordova

# Create project
cordova create neon-survivor com.yourcompany.neonsurvivor NeonSurvivor
cd neon-survivor

# Copy game files to www/
cp ../index.html ../game.js ../manifest.json www/

# Add Android platform
cordova platform add android

# Build APK
cordova build android --release

# APK location: platforms/android/app/build/outputs/apk/release/
```

### App Store (iOS)
```bash
# Requires macOS with Xcode
cordova platform add ios
cordova build ios --release

# Open in Xcode for signing and submission
open platforms/ios/NeonSurvivor.xcworkspace
```

---

## 🧪 Testing Checklist

- [ ] Desktop Chrome (Windows/Mac)
- [ ] Desktop Firefox
- [ ] Desktop Edge
- [ ] Mobile Chrome (Android)
- [ ] Mobile Safari (iOS)
- [ ] Tablet (iPad/Android)
- [ ] Different screen orientations
- [ ] Touch gesture responsiveness
- [ ] Performance on low-end devices

---

## 🎨 Design Inspiration

This game draws visual and gameplay inspiration from:
- **Vampire Survivors** - Minimalistic roguelike mechanics
- **Brotato** - Wave-based survival
- **Magic Survival** - Auto-attack systems
- **Holocure** - Ability pickup systems

With a unique **neon cyberpunk aesthetic** and **universal platform support**.

---

## 🐛 Known Issues & Roadmap

### Current Version (2.0.0)
- ✅ Universal device detection
- ✅ Adaptive controls (PC + Mobile)
- ✅ Performance optimization
- ✅ PWA manifest

### Planned Features (2.1.0)
- [ ] Sound effects and background music
- [ ] More abilities (15 total)
- [ ] Character selection
- [ ] Permanent upgrades between runs
- [ ] Leaderboard system
- [ ] Vibration/haptic feedback on mobile

---

## 📄 License

This project is open-source and available for personal and commercial use.

---

## 👤 Author

**Luis Castellano Guzman**

---

## 🙏 Acknowledgments

- Inspired by the roguelike/survivor genre
- Visual design influenced by cyberpunk aesthetics
- Community feedback and testing

---

**⚡ Survive the neon apocalypse on any device! ⚡**