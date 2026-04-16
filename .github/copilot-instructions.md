# Snake Development Guidelines

Auto-generated from all feature plans. Last updated: 2026-04-14

## Active Technologies
- Vanilla JavaScript ES6+ + Phaser 4.0.0 (local `lib/phaser.min.js`) (004-disable-special-foods-toggle)
- `window.localStorage` — key `snakeSpecialFoodsEnabled`, string `'true'`/`'false'` (004-disable-special-foods-toggle)
- Vanilla JavaScript ES6+ + Phaser 4.0.0 (local `lib/phaser.min.js`) — built-in sound manager wraps Web Audio API (005-audio-music-sfx)
- `window.localStorage` — key `snakeMuted`, string `'true'`/`'false'`; existing keys untouched (005-audio-music-sfx)
- `window.localStorage` — keys `snakeMuted` (BGM, existing) and `snakeSfxMuted` (SFX, new) (006-audio-controls-screens)
- Vanilla JavaScript ES6+ + Phaser 4.0.0 (local, `lib/phaser.min.js`) — built-in sound manager wraps Web Audio API (006-audio-controls-screens)
- Vanilla JavaScript ES6+ + Phaser 4.0.0 (local `lib/phaser.min.js`) — Tweens API, Graphics API, `this.time.now` (006-audio-controls-screens)
- N/A (no persistence needed) (006-audio-controls-screens)

- Vanilla JavaScript ES6+ (unchanged) + Phaser 4.0.0 (local `lib/phaser.min.js`) — unchanged (001-snake-web-game)

## Project Structure

```text
src/
tests/
```

## Commands

npm test; npm run lint

## Code Style

Vanilla JavaScript ES6+ (unchanged): Follow standard conventions

## Recent Changes
- 006-audio-controls-screens: Added Vanilla JavaScript ES6+ + Phaser 4.0.0 (local `lib/phaser.min.js`) — Tweens API, Graphics API, `this.time.now`
- 006-audio-controls-screens: Added Vanilla JavaScript ES6+ + Phaser 4.0.0 (local, `lib/phaser.min.js`) — built-in sound manager wraps Web Audio API
- 006-audio-controls-screens: Added Vanilla JavaScript ES6+ + Phaser 4.0.0 (local `lib/phaser.min.js`) — built-in sound manager


<!-- MANUAL ADDITIONS START -->
<!-- MANUAL ADDITIONS END -->
