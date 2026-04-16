# 🐍 Snake!

[![Play Now](https://img.shields.io/badge/▶%20Play%20Now-snake.opengarage.net-00e676?style=for-the-badge&logo=googlechrome&logoColor=white)](http://snake.opengarage.net/)

<a href="http://snake.opengarage.net/" target="_blank">
  <img src="https://img.shields.io/badge/status-online-brightgreen" alt="Game Status" />
</a>

> **[🎮 Play now at snake.opengarage.net](http://snake.opengarage.net/)**

---

## About

A classic **Snake** reimagined with special foods, visual and sound effects, speed progression, and multi-language support. Play directly in the browser — desktop or mobile.

---

## How to Play

### Objective

Guide the snake to eat as much food as possible without hitting walls, obstacles, or itself. Each food eaten makes the snake grow and increases your score. **Fill the entire grid to win!**

### Controls

| Platform | Control |
|----------|---------|
| ⌨️ Keyboard | Arrow keys **↑ ↓ ← →** or **W A S D** |
| 📱 Mobile | **Swipe** in the desired direction |
| ▶️ Start | **SPACE** or **ENTER** |
| ↩️ Menu | **ESC** (from the legend screen) |

---

## Food Types

| Icon | Name | Effect | Points |
|:----:|------|--------|:------:|
| 🟡 | **Normal** | Grows 1 segment | +1 |
| 🟠 | **Penta** | Grows 5 segments (rare!) | +5 |
| 🟣 | **Turbo** | Cuts 5 segments and speeds up for 5s (stackable) | — |
| ⚪ | **Star** | Moves autonomously across the grid. No growth | +10 |
| 🔴 | **Bomb** | Turns 5 tail segments into permanent obstacles | +10 |
| ⬛ | **Obstacle** | Created by Bomb. Collision ends the game | — |

### Stackable Turbo

Eating multiple **Turbo** foods while the effect is active **stacks the speed** (1.5× per layer) and **resets the 5-second timer**.

---

## Features

### 🎵 Audio
- **Background music** — can be muted independently
- **Sound effects** — unique sound for each food type and collision
- Audio controls accessible on the legend screen (🔊/🔇 and 🔔/🔕)

### 🌍 Languages
The game supports **10 languages**: Português, English, Español, Deutsch, Français, Русский, 日本語, 中文, हिन्दी, العربية.

Select your language on the Legend screen.

### ⚡ Speed Progression
- The snake speeds up every **5 points** scored
- Minimum speed is capped to keep the game playable

### 🎛️ Special Foods Toggle
Special foods (Penta, Turbo, Star, Bomb) can be **disabled** on the Legend screen, keeping only Normal food for a classic experience.

### 📱 Mobile
- Full swipe gesture support
- Responsive canvas with automatic scaling
- Compatible with iPhone (notch/safe areas) and Android

---

## Tech Stack

| | |
|---|---|
| **Engine** | [Phaser 4.0.0](https://phaser.io/) |
| **Language** | Vanilla JavaScript ES6+ |
| **Audio** | Web Audio API (via Phaser) — OGG + MP3 |
| **Persistence** | `localStorage` (personal best, preferences) |

---

## Run Locally

Serve the static files with any HTTP server:

```bash
# Python
python -m http.server 8000

# Node.js
npx serve .
```

Open `http://localhost:8000` in your browser.

---

## Project Structure

```
├── index.html          # Main page
├── style.css           # Styles
├── game.js             # Game code (scenes, logic, i18n)
├── audio/              # Music and sound effects (MP3 + OGG)
├── lib/                # Phaser 4.0.0 (local)
└── specs/              # Feature specifications
```

---

<p align="center">
  Made with 💚 — <a href="http://snake.opengarage.net/">Play now</a>
</p>
