# Implementation Plan: Audio — Background Music & Sound Effects

**Branch**: `005-audio-music-sfx` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/005-audio-music-sfx/spec.md`

## Summary

Add background music (looping CC0 chiptune), per-food-type SFX on eating events, and a collision SFX on game-over — all managed via Phaser 4's built-in sound manager (`this.sound`). A compact mute icon button is added to the GameScene HUD; the mute preference is persisted in `localStorage` under `snakeMuted`. Audio files are self-hosted in a new `audio/` directory from Kenney.nl (CC0). All changes are confined to `game.js` plus the new `audio/` directory.

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+  
**Primary Dependencies**: Phaser 4.0.0 (local `lib/phaser.min.js`) — built-in sound manager wraps Web Audio API  
**Storage**: `window.localStorage` — key `snakeMuted`, string `'true'`/`'false'`; existing keys untouched  
**Testing**: Manual browser test; `npm run lint`  
**Target Platform**: Modern evergreen browsers (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+), file:// protocol  
**Project Type**: Browser-based single-file game  
**Performance Goals**: 60 fps game loop unaffected; `this.sound.play()` is non-blocking (fire-and-forget)  
**Constraints**: Offline-capable (all assets bundled locally); zero new npm/CDN dependencies; CC0/CC-BY license only  
**Scale/Scope**: Modifications to `game.js`; 7 new audio files in `audio/`; 6 targeted code change locations

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Browser-Native, Zero Dependencies | ✅ PASS | Phaser's sound manager is already a bundled dependency; no new libraries added; all assets self-hosted |
| II. Game-Loop Integrity | ✅ PASS | `this.sound.play()` is non-blocking; called inside `applyFoodEffect()` / `gameOver()` which are already within tick; no game state mutated outside tick |
| III. Child-Friendly UX | ✅ PASS | Mute button uses emoji icon (🔊/🔇) that children recognise; HUD spatial constraint limits size to 40×32 px (documented exception); sounds are child-safe and non-violent |
| IV. Responsive Single-File Delivery | ✅ PASS | All changes in `game.js`; audio files in `audio/` served as static siblings; no build step needed |
| V. Gameplay Simplicity & Clean Separation | ✅ PASS | Audio is additive; no game rules, physics, or scoring modified; no new game objects |

**Post-Design Re-check**: All principles still pass after Phase 1 design. HUD button size (40×32 px) is a documented spatial constraint exception — the HUD is 40 px tall; a full 48×48 px button would overflow.

## Project Structure

### Documentation (this feature)

```text
specs/005-audio-music-sfx/
├── plan.md         ← this file
├── research.md     ← Phase 0 complete
├── data-model.md   ← Phase 1 complete
└── tasks.md        ← Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
game.js             ← all code changes here (single-file architecture)
audio/              ← new directory; 7 self-hosted audio files (CC0)
  bgm.ogg
  bgm.mp3
  sfx_eat_standard.ogg   sfx_eat_standard.mp3
  sfx_eat_penta.ogg      sfx_eat_penta.mp3
  sfx_eat_rush.ogg       sfx_eat_rush.mp3
  sfx_eat_star.ogg       sfx_eat_star.mp3
  sfx_eat_bomb.ogg       sfx_eat_bomb.mp3
  sfx_collision.ogg      sfx_collision.mp3
index.html          ← no changes
style.css           ← no changes
lib/
  phaser.min.js     ← no changes
```

**Structure Decision**: Single-file game — all feature logic lives in `game.js` alongside the existing scenes and helpers. A new top-level `audio/` directory holds the asset files.

## Complexity Tracking

> No unjustified constitution violations — section not needed.

---

## Implementation Blueprint

### Change 1 — Module-level helpers (new code)

**Location**: After the existing `savePersonalBest()` helper (~line 218), before `EventCardManager`.

**What**: Add two module-level functions for mute preference I/O:

```javascript
// --- Mute Preference (localStorage) ---
function isMuted() {
  try { return localStorage.getItem('snakeMuted') === 'true'; }
  catch (e) { return false; }
}

function setMutePref(muted) {
  try { localStorage.setItem('snakeMuted', String(muted)); }
  catch (e) { /* best-effort; ignore storage errors */ }
}
```

**Why**: Same safe-default pattern as all existing localStorage helpers. Centralises I/O. Default = unmuted (false) when key is absent.

---

### Change 2 — GameScene.preload() (new method)

**Location**: New method added to `GameScene`, before `create()`.

**What**:

```javascript
preload() {
  this.load.audio('bgm',              ['audio/bgm.ogg',              'audio/bgm.mp3']);
  this.load.audio('sfx_eat_standard', ['audio/sfx_eat_standard.ogg', 'audio/sfx_eat_standard.mp3']);
  this.load.audio('sfx_eat_penta',    ['audio/sfx_eat_penta.ogg',    'audio/sfx_eat_penta.mp3']);
  this.load.audio('sfx_eat_rush',     ['audio/sfx_eat_rush.ogg',     'audio/sfx_eat_rush.mp3']);
  this.load.audio('sfx_eat_star',     ['audio/sfx_eat_star.ogg',     'audio/sfx_eat_star.mp3']);
  this.load.audio('sfx_eat_bomb',     ['audio/sfx_eat_bomb.ogg',     'audio/sfx_eat_bomb.mp3']);
  this.load.audio('sfx_collision',    ['audio/sfx_collision.ogg',    'audio/sfx_collision.mp3']);
}
```

**Why**: Phaser calls `preload()` automatically before `create()`, ensuring all audio is loaded before the scene starts. The two-format array `['...ogg', '...mp3']` lets Phaser pick the best supported format per browser.

---

### Change 3 — HUD mute button + music init in GameScene.create()

**Location**: After `bestTxt` is created (~line 380), within the HUD setup block.

**What** (two sub-changes):

**3a — Reposition bestTxt** (shift left to make room for mute button):

Current: `x = CANVAS_W - 12` → New: `x = CANVAS_W - 100`

**3b — Add mute button and init music** right after `bestTxt`:

```javascript
// --- Mute button ---
const muteTxt = this.add.text(CANVAS_W - 52, HUD_H / 2, isMuted() ? '🔇' : '🔊', {
  fontSize: '22px',
  color: '#ffffff',
})
  .setOrigin(0.5)
  .setInteractive({ useHandCursor: true })
  .on('pointerdown', () => {
    const nowMuted = !isMuted();
    setMutePref(nowMuted);
    this.sound.setMute(nowMuted);
    muteTxt.setText(nowMuted ? '🔇' : '🔊');
  });

// --- Background music ---
this.music = this.sound.add('bgm', { loop: true, volume: 0.5 });
this.sound.setMute(isMuted());
this.musicStarted = false;
// Autoplay policy: defer first play until after user interaction (Phaser unlocked event)
this.sound.once('unlocked', () => {
  if (!this.musicStarted) {
    this.music.play();
    this.musicStarted = true;
  }
});
// If AudioContext is already running (page reloaded with interaction), play immediately
if (this.sound.context && this.sound.context.state === 'running' && !this.musicStarted) {
  this.music.play();
  this.musicStarted = true;
}
```

**Why**: Reusing native Phaser features — `setInteractive` on a text object and `sound.setMute()` for global toggle. `musicStarted` guard prevents double-play. `unlocked` handles the browser autoplay policy without user-visible friction.

---

### Change 4 — Per-food SFX in applyFoodEffect()

**Location**: Inside each `case` of the `switch (food.type)` block in `applyFoodEffect()` (~lines 559–563).

**What**: Add one `this.sound.play(...)` call per case:

```javascript
case FOOD_TYPES.STANDARD:
  state.growthRemaining++;
  state.score++;
  this.sound.play('sfx_eat_standard', { volume: 0.7 });
  break;

case FOOD_TYPES.PENTA:
  this.growSnake(5);
  state.score += 5;
  this.sound.play('sfx_eat_penta', { volume: 0.8 });
  break;

case FOOD_TYPES.RUSH:
  this.shrinkSnake(5);
  this.activateRush();
  this.sound.play('sfx_eat_rush', { volume: 0.7 });
  break;

case FOOD_TYPES.STAR:
  state.score += 10;
  this.sound.play('sfx_eat_star', { volume: 0.8 });
  break;

case FOOD_TYPES.BOMB:
  this.bombEffect();
  this.sound.play('sfx_eat_bomb', { volume: 0.9 });
  break;
```

**Why**: Each SFX call is a single non-blocking line inserted after (or alongside) the existing effect logic. No game-state mutation risk. No new branching or state tracking needed.

---

### Change 5 — Collision SFX + music stop in gameOver() and _cleanupRound()

**Location**: 
- `gameOver()` — first actionable line (before `tickRef.remove()` call or immediately after)
- `_cleanupRound()` — at the end

**What**:

In `gameOver()`, add at the top of the method body:
```javascript
this.sound.play('sfx_collision', { volume: 1.0 });
```

In `_cleanupRound()`, add at the end:
```javascript
if (this.music) {
  this.music.stop();
  this.musicStarted = false;
}
```

**Why**: Collision SFX fires *immediately* when the game-over event fires — the thud is the auditory feedback for the collision. Music is stopped in `_cleanupRound()` because that method is the shared cleanup path for both `gameOver()` and `gameWon()`. The guard `if (this.music)` prevents errors if the scene restarts before audio loads.

---

## Residual Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| Phaser 4 sound API differs from Phaser 3 (`BaseSound` methods) | Low | Verify `this.sound.add()`, `play()`, `stop()`, `setMute()` in Phaser 4 changelog before implementing |
| `'unlocked'` event not emitted in some Phaser 4 builds | Low | Fallback: `context.state === 'running'` check already in Change 3 blueprint |
| Audio files not loaded on `file://` protocol (CORS/local restrictions) | Low for target (Chrome allows local audio) | Test under file:// before delivery; document that a local server (e.g. VS Code Live Server) may be needed for some browsers |
| `this.musicStarted` not reset if scene re-created (not restarted) — could cause double-play | Low | Guard `if (!this.musicStarted)` in both code paths handles it |
| OGG not supported in Safari < 11 | Very low (Safari 14+ targeted) | MP3 fallback in `load.audio()` array handles it |
