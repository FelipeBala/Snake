# Data Model: Audio — Background Music & Sound Effects

**Phase**: 1 — Design  
**Feature**: 005-audio-music-sfx

---

## Entities

### 1. `MutePreference` (localStorage)

Persisted user preference for the global mute state.

| Field | Storage | Type | Default |
|-------|---------|------|---------|
| `snakeMuted` | `localStorage` | `'true'` \| `'false'` \| absent | absent (= unmuted) |

**Access helpers** (module-level, same pattern as existing helpers):

```javascript
/**
 * Returns true if the user has previously muted the game.
 * Defaults to false (unmuted) when localStorage key is absent.
 */
function isMuted() {
  try { return localStorage.getItem('snakeMuted') === 'true'; }
  catch (e) { return false; }
}

/**
 * Persists the mute preference.
 * @param {boolean} muted
 */
function setMutePref(muted) {
  try { localStorage.setItem('snakeMuted', String(muted)); }
  catch (e) { /* best-effort — silently ignore storage errors */ }
}
```

**State**: no in-memory state beyond the localStorage value — the runtime truth is `this.sound.mute` (Phaser).

---

### 2. `SoundEffect` (preloaded audio files)

> **Terminology note**: Corresponds to the `SoundEffect` entity defined in spec.md Key Entities — *"A mapping from game event (food type eaten, collision) to an audio asset, with distinct assets per food type."* Renamed from the earlier internal label `SoundAsset` to align with spec.md vocabulary.

All 7 audio files loaded by `GameScene.preload()`.

| Phaser Key | File Path (OGG preferred) | Role | Source | License |
|------------|--------------------------|------|--------|---------|
| `bgm` | `audio/bgm.ogg` | Background music loop | Kenney Music Pack | CC0 |
| `sfx_eat_standard` | `audio/sfx_eat_standard.ogg` | STANDARD food eaten | Kenney Interface Sounds | CC0 |
| `sfx_eat_penta` | `audio/sfx_eat_penta.ogg` | PENTA food eaten | Kenney Interface Sounds | CC0 |
| `sfx_eat_rush` | `audio/sfx_eat_rush.ogg` | RUSH food eaten | Kenney Interface Sounds | CC0 |
| `sfx_eat_star` | `audio/sfx_eat_star.ogg` | STAR food eaten | Kenney Interface Sounds | CC0 |
| `sfx_eat_bomb` | `audio/sfx_eat_bomb.ogg` | BOMB food eaten | Kenney Impact Sounds | CC0 |
| `sfx_collision` | `audio/sfx_collision.ogg` | Snake collision (game over) | Kenney Impact Sounds | CC0 |

Each asset is also referenced with an MP3 fallback: `['audio/<key>.ogg', 'audio/<key>.mp3']` (Phaser picks the first supported format).

**File organization:**
```
audio/
  bgm.ogg
  bgm.mp3
  sfx_eat_standard.ogg
  sfx_eat_standard.mp3
  sfx_eat_penta.ogg
  sfx_eat_penta.mp3
  sfx_eat_rush.ogg
  sfx_eat_rush.mp3
  sfx_eat_star.ogg
  sfx_eat_star.mp3
  sfx_eat_bomb.ogg
  sfx_eat_bomb.mp3
  sfx_collision.ogg
  sfx_collision.mp3
```

---

### 3. `MusicPlayer` (runtime Phaser sound instance)

> **Terminology note**: Corresponds to the `AudioManager` concept in spec.md Key Entities. No custom class is created — this entity represents the runtime state (`this.music`, `this.musicStarted`) held on the `GameScene` instance, delegating all audio control to Phaser's built-in `this.sound` manager.

Runtime state tracked on `GameScene` instance.

| Property | Type | Description |
|----------|------|-------------|
| `this.music` | `Phaser.Sound.BaseSound` | Background music sound instance; created in `create()` with `{ loop: true, volume: 0.5 }` |
| `this.musicStarted` | `boolean` | Guards against calling `music.play()` twice; set to `true` after first play |

**Lifecycle:**

```
GameScene.preload()     → load all audio keys
GameScene.create()      → this.music = this.sound.add('bgm', { loop: true, volume: 0.5 })
                          apply saved isMuted() via this.sound.setMute()
                          register sound.once('unlocked', ...) listener
tick() — first call     → this.music.play()  [deferred to after user interaction for autoplay policy]
_cleanupRound()         → this.music.stop()
```

---

### 4. `MuteButton` (in-game HUD widget)

A compact interactive text object in the GameScene HUD.

| Property | Value |
|----------|-------|
| Position | `x = CANVAS_W - 52`, `y = HUD_H / 2 = 20` |
| Size (interactive area) | 40 × 32 px |
| Label (unmuted) | `'🔊'` |
| Label (muted) | `'🔇'` |
| Font size | 22px |
| Background fill | `0x1a1a2e` (matches HUD) |
| Border | none (icon-only) |

**Interaction:**
1. User clicks/taps mute button
2. `currentMuted = !isMuted()`
3. `setMutePref(currentMuted)`
4. `this.sound.setMute(currentMuted)`
5. Button label toggles

When `bestTxt` is present at `x = CANVAS_W - 12 = 548`, it is repositioned to `x = CANVAS_W - 100 = 460` to avoid overlap with the mute button.

---

## SFX Trigger Map

Diagram of when each sound fires:

```
User presses arrow key / button
       │
       ▼
   tick() called each interval
       │
       ├─ snake head = food tile
       │       │
       │       ▼
       │   applyFoodEffect(food)
       │       │
       │       ├─ STANDARD   → play('sfx_eat_standard')
       │       ├─ PENTA      → play('sfx_eat_penta')
       │       ├─ RUSH       → play('sfx_eat_rush')
       │       ├─ STAR       → play('sfx_eat_star')
       │       └─ BOMB       → play('sfx_eat_bomb')
       │
       └─ snake head = wall | obstacle | self
               │
               ▼
           gameOver()
               │
               ├─ play('sfx_collision')   ← fires immediately in gameOver()
               └─ ...red flash, transition, etc.
                       │
                       ▼
               _cleanupRound()            ← shared path for gameOver + gameWon
                       │
                       └─ music.stop()   ← plan.md Change 5 / tasks T009
```

---

## Mute Persistence State Machine

```
Initial Load
     │
     ▼
localStorage.getItem('snakeMuted')
     │
     ├── === 'true'  → isMuted() = true  → sound.setMute(true)  → 🔇
     └── else        → isMuted() = false → sound.setMute(false) → 🔊
           │
           ▼
     User clicks mute button
           │
           ├── was unmuted → setMutePref(true)  → sound.setMute(true)  → 🔇
           └── was muted   → setMutePref(false) → sound.setMute(false) → 🔊
```

---

## Integration Points (game.js)

| Location | Change | Details |
|----------|--------|---------|
| Module top (after existing helpers) | Add helpers | `isMuted()`, `setMutePref()` |
| `GameScene` (new method) | Add `preload()` | 7 `this.load.audio(...)` calls |
| `GameScene.create()` | HUD: add mute button, reposition `bestTxt` | After `scoreTxt` / `bestTxt` lines |
| `GameScene.create()` | Music init + autoplay | `this.music = this.sound.add('bgm', ...)` + `unlocked` listener |
| `GameScene.applyFoodEffect()` | Per-case SFX | `this.sound.play(...)` in each switch case |
| `GameScene.gameOver()` | Collision SFX + music stop | Before red flash, or in `_cleanupRound()` |
| `GameScene._cleanupRound()` | Music stop guard | `if (this.music) this.music.stop()` |
