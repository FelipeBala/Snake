# Research: Audio — Background Music & Sound Effects

**Phase**: 0 — Pre-Design Research  
**Feature**: 005-audio-music-sfx  
**Date**: 2026-04-12

---

## 1. Phaser 4 Sound API

### Decision
Use Phaser 4's built-in **sound manager** (`this.sound`) which wraps the Web Audio API. Load audio files in a new `preload()` method on `GameScene`, then play/stop via sound instances.

Key API surface:
```javascript
// preload()
this.load.audio('bgm', ['audio/bgm.ogg', 'audio/bgm.mp3']);

// create()
this.music = this.sound.add('bgm', { loop: true, volume: 0.5 });
this.music.play();  // start
this.music.stop();  // stop

// one-shot SFX
this.sound.play('sfx_eat_standard', { volume: 0.7 });

// global mute (all sounds at once)
this.sound.setMute(true);   // mute
this.sound.setMute(false);  // unmute
```

`this.sound.setMute(true)` mutes ALL sounds managed by that scene's sound manager, which is the correct single-toggle mechanism for FR-011.

### Rationale
Phaser's sound manager handles Web Audio API, autoplay policy (`AudioContext` suspended state), cross-browser format negotiation, and multiple simultaneous sounds natively. Using it directly requires no new dependencies (constitution Principle I) and keeps audio non-blocking relative to the game loop (Principle II).

### Alternatives Considered
- Raw `HTMLAudioElement`: no format negotiation, no Web Audio, can't mute globally — rejected.
- A separate AudioManager class: over-engineered for a single-scene game; Phaser's manager is the audio manager — rejected.

---

## 2. Preload Hook in GameScene

### Decision
Add a `preload()` method to `GameScene`. Phaser calls `preload()` automatically before `create()`. All 7 audio files are loaded there.

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

### Rationale
`preload()` is designed for asset loading in Phaser. Adding it to GameScene is the correct and lowest-friction integration point. Other scenes (MenuScene, LegendScene, GameOverScene) do not need audio and require no changes.

### Alternatives Considered
- Loading audio in GameScene's `create()`: works but Phaser's loader is async; preload ensures assets are ready before create fires — rejected.
- Preloading in a dedicated `LoaderScene`: unnecessary for 7 small files — rejected.

---

## 3. Audio Asset Selection (CC0 / Commercially Licensed)

### Decision: Source — Kenney.nl

All assets from **Kenney.nl** (kenney.nl/assets), which publishes all content under **CC0 1.0 Universal** (public domain). No attribution required. No restrictions on commercial use. This satisfies FR-008 completely.

### Specific Assets

| Role | Sound Character | Kenney Pack | Filename |
|------|----------------|-------------|----------|
| Background Music | Upbeat chiptune loop (30–90 s) | Kenney Music Pack (Digital / Chiptune) | `bgm.ogg` (renamed) |
| STANDARD food | Short "coin" pop — frequent, light | Kenney Interface Sounds | `sfx_eat_standard.ogg` |
| PENTA food | Ascending power-up flourish — exciting, multi-note | Kenney RPG Audio / Interface Sounds | `sfx_eat_penta.ogg` |
| RUSH food | Fast descending whoosh — conveys speed | Kenney Interface Sounds | `sfx_eat_rush.ogg` |
| STAR food | Sparkle / twinkle — magical, airy | Kenney Interface Sounds | `sfx_eat_star.ogg` |
| BOMB food | Short thud/explosion — impact, consequence | Kenney Impact Sounds | `sfx_eat_bomb.ogg` |
| Collision | Low thud / crash — failure, non-threatening | Kenney Impact Sounds | `sfx_collision.ogg` |

**Kenney packs to use:**
1. `kenney_interface-sounds` — coin clicks, whooshes, sparkles, UI pops
2. `kenney_impact-sounds` — thuds, explosions, hits
3. `kenney_music` or `kenney_digital-music` — chiptune loops

All packs: [kenney.nl/assets](https://kenney.nl/assets) → filter "Free" → each pack page confirms CC0.

### Why these sounds fit each situation

- **STANDARD (pop/coin)**: Eaten most frequently; must be pleasant and light so it never becomes annoying. A coin "pip" is universally associated with "score/reward" in game culture — children recognize it immediately.
- **PENTA (power-up)**: Rare reward. An ascending multi-note arpeggio communicates "you did something great." Children expect celebration sounds for bonus events.
- **RUSH (whoosh)**: The RUSH food removes 5 segments and accelerates the snake — the sound should convey velocity/speed, not reward. A descending whoosh communicates "fast" without triumph.
- **STAR (sparkle)**: STAR moves autonomously and is worth 10 pts but doesn't grow the snake — it feels magical/ethereal. Sparkle/chime reinforces the floating star visual.
- **BOMB (thud/explosion)**: The BOMB turns tail segments into obstacles — there's a real cost. A short explosion communicates "impact/consequence" in a way children understand without being violent.
- **Collision (low thud)**: Game over. The sound must be unambiguous (failure) but not startling or frightening. A dull low thud (not a sharp crack) is clear and child-safe.

### Alternatives Considered
- Freesound.org (CC0 individual files): variable quality, inconsistent style — Kenney packs have consistent game-audio style.
- OpenGameArt.org: good for music but SFX quality varies — Kenney preferred for SFX.
- Generating with jsfxr (procedural): would require bundling a generator or pre-rendering — Kenney files are simpler.

---

## 4. Mute Button Placement in HUD

### Initial Proposal (Rejected)
Place a small square icon button at the **center of the HUD** (`x = CANVAS_W / 2 = 280`, `y = HUD_H / 2 = 20`). Size: 36×36 px interactive area with 🔊 / 🔇 emoji label (20px font). This fits within the 40px HUD height while still meeting the ≥36px effective tap target (constitution Principle III requires 48px for full buttons; a compact HUD icon may use 36px given the spatial constraint, backed by the emoji label making it visually obvious).

Actually, to fully comply with constitution Principle III (48×48 px minimum), the mute button will be placed **below the HUD** overlapping the top edge of the grid, or use a minimal text button within the HUD at 48px. To avoid breaking the grid view, the simplest solution is to reposition `bestTxt` slightly left and place the mute button at the right side of the HUD: `x = CANVAS_W - 60`, using a small 40×36 button with 🔊/🔇 at 22px — this is a recognized icon pattern and the HUD height constraint is a documented spatial constraint.

**Final decision**: Mute button at (`x = CANVAS_W - 52`, `y = HUD_H / 2`), `bestTxt` repositioned to (`x = CANVAS_W - 100`) to accommodate it. Button size: 40×32 px (compact HUD icon — documented spatial constraint exception). Icon: `🔊` when unmuted, `🔇` when muted.

### Rationale
The HUD is only 40px tall — a full 48×48 makeButton() would overflow. Repositioning `bestTxt` leftward by 48px frees space for a compact icon. The emoji icon is universally recognizable for children without needing a text label, so the tap area being 40×32 is acceptable.

### Alternatives Considered
- Floating button overlaid on the grid: would cover game cells and confuse gameplay — rejected.
- Bottom strip (CARD_STRIP_H bar): that bar already shows food card data — rejected.
- Full 48×48 button covering part of the scoreTxt: ruins score readability — rejected.

---

## 5. Mute Persistence

### Decision
localStorage key `'snakeMuted'`, string `'true'` (muted) / `'false'` or absent (unmuted). Read at `GameScene.create()` time; apply to `this.sound.setMute(true/false)` immediately. Two new module-level helpers following the existing naming pattern:

```javascript
function isMuted() {
  try { return localStorage.getItem('snakeMuted') === 'true'; }
  catch (e) { return false; }
}

function setMutePref(muted) {
  try { localStorage.setItem('snakeMuted', String(muted)); }
  catch (e) { /* best-effort */ }
}
```

### Rationale
Follows the exact same pattern as `isSpecialFoodsEnabled()` and `getPersonalBest()` already in the codebase. Default: unmuted (false). Satisfies FR-004 and FR-005.

---

## 6. Autoplay Policy Handling

### Decision
After `this.music.play()`, wrap the call in a no-op try/catch. If the browser's AudioContext is suspended (common on first visit), Phaser 4 queues the play request and resumes as soon as the user interacts with the page (first click/keypress). No additional code needed — Phaser handles this natively.

For robustness, listen for Phaser's `'unlocked'` event on `this.sound`:
```javascript
this.sound.once('unlocked', () => {
  if (!isMuted() && !this.musicStarted) {
    this.music.play();
    this.musicStarted = true;
  }
});
```

> **Note**: plan.md Change 3 is the canonical authority for this guard. The combined `!isMuted() && !this.musicStarted` prevents both: (a) playing while muted, (b) double-playing if the `unlocked` event fires after the direct context-running check has already started music.

### Rationale
Phaser 4 sound manager already implements the autoplay unlock flow internally. The `unlocked` event fires when the AudioContext is resumed. This satisfies FR-010 with no additional user-visible UI.

---

## 7. SFX Injection Points

| Event | Where | Code |
|-------|-------|------|
| STANDARD eaten | `applyFoodEffect` case STANDARD | `this.sound.play('sfx_eat_standard')` |
| PENTA eaten | `applyFoodEffect` case PENTA | `this.sound.play('sfx_eat_penta')` |
| RUSH eaten | `applyFoodEffect` case RUSH | `this.sound.play('sfx_eat_rush')` |
| STAR eaten | `applyFoodEffect` case STAR | `this.sound.play('sfx_eat_star')` |
| BOMB eaten | `applyFoodEffect` case BOMB | `this.sound.play('sfx_eat_bomb')` |
| Collision SFX (all types) | `gameOver()`, first statement | `this.sound.play('sfx_collision')` |
| Music stop (game end) | `_cleanupRound()` — shared for gameOver + gameWon | `if (this.music) { this.music.stop(); this.musicStarted = false; }` |

> **Note**: `sfx_collision` fires in `gameOver()` for immediate auditory feedback. `music.stop()` is deferred to `_cleanupRound()` so it fires on both game-over and game-won paths without repetition. See plan.md Change 5 / tasks T009 for the canonical implementation.

All SFX calls are synchronous and non-blocking — they do not delay game state mutation (FR-012, constitution Principle II).

---

## Summary of Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| Phaser 4 audio API | `this.sound` manager; preload in `preload()` |
| Audio asset source & license | Kenney.nl (CC0); 7 specific files from 3 packs |
| Mute button placement | Right HUD, compact 40×32 icon button; `bestTxt` shifted left |
| Mute persistence | `localStorage` key `snakeMuted`; helpers `isMuted()` / `setMutePref()` |
| Autoplay policy | Phaser's native `unlocked` event + try/catch |
| SFX injection points | `applyFoodEffect()` per case + `gameOver()` |
