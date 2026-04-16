# Data Model: Individual BGM & SFX Audio Controls

**Feature**: 006-audio-controls-screens  
**Date**: 2026-04-12

---

## Persistent State (localStorage)

| Key | Type | Default | Since | Description |
|-----|------|---------|-------|-------------|
| `snakeMuted` | `'true'` \| `'false'` \| absent | absent → `false` | BGM muted preference. Absent = unmuted. Introduced in feature 005 — **unchanged**. |
| `snakeSfxMuted` | `'true'` \| `'false'` \| absent | absent → `false` | SFX muted preference. Absent = unmuted. **New in feature 006**. |

**Invariant**: The two keys are fully independent. Writing one MUST NOT affect the other.  
**Backward compatibility**: Existing sessions with `snakeMuted = 'true'` continue to boot with BGM muted. `snakeSfxMuted` absent on first load → SFX active (fail-open).

---

## In-Memory State (GameScene instance)

| Field | Type | Default | Description |
|-------|------|---------|-------------|
| `this.music` | `Phaser.Sound.BaseSound` | Created in `create()` | BGM sound instance. Muted via `this.music.setMute(isMuted())`. |
| `this.musicStarted` | `boolean` | `false` | Guards autoplay policy handling. Unchanged from feature 005. |

No new in-memory fields are added. SFX mute is stateless at the call site: `isSfxMuted()` is read directly from localStorage at each `sound.play()` invocation. Stateless reads are preferred over an in-memory flag because SFX events are infrequent (at most once per tick) and direct localStorage reads keep the mutation contract simple — the helper's try/catch provides the same fail-open safety as an in-memory flag would.

---

## Helper Functions (module scope)

### Existing (feature 005) — BGM

```js
function isMuted()          // reads snakeMuted; returns boolean
function setMutePref(muted) // writes snakeMuted
```

### New (feature 006) — SFX

```js
function isSfxMuted()           // reads snakeSfxMuted; returns boolean
function setSfxMutePref(muted)  // writes snakeSfxMuted
```

Both follow the **same try/catch pattern** as `isMuted()` / `setMutePref()`: fail-open on storage errors.

---

## UI Elements

### GameScene HUD (top-right strip, y = HUD_H / 2 = 20)

| Element | x | Origin | Label | Reads | Writes |
|---------|---|--------|-------|-------|--------|
| `bgmBtn` (was `muteTxt`) | `CANVAS_W - 76` | `(0.5, 0.5)` | `🔊` / `🔇` | `isMuted()` | `setMutePref()` + `this.music.setMute()` |
| `sfxBtn` (new) | `CANVAS_W - 36` | `(0.5, 0.5)` | `🔔` / `🔕` | `isSfxMuted()` | `setSfxMutePref()` |

`bestTxt` stays at `CANVAS_W - 100` (unchanged).

### LegendScene title row (y = 18)

| Element | x | Origin | Label | Reads | Writes |
|---------|---|--------|-------|-------|--------|
| BGM button | `CANVAS_W - 76` | `(0.5, 0.5)` | `🔊` / `🔇` | `isMuted()` | `setMutePref()` |
| SFX button | `CANVAS_W - 36` | `(0.5, 0.5)` | `🔔` / `🔕` | `isSfxMuted()` | `setSfxMutePref()` |

LegendScene buttons write to localStorage only. They do not interact with any Phaser sound object because GameScene (which owns `this.music`) is not active while LegendScene is running.

---

## State Transitions

```
[Page load]
  → read snakeMuted      → isMuted()     → apply to this.music.setMute()
  → read snakeSfxMuted   → isSfxMuted()  → applied lazily at each SFX play() call

[BGM button click (GameScene)]
  → toggle snakeMuted
  → this.music.setMute(isMuted())
  → bgmBtn label update

[SFX button click (GameScene)]
  → toggle snakeSfxMuted
  → sfxBtn label update
  (SFX silence takes effect at next sound.play() call, which checks isSfxMuted())

[BGM or SFX button click (LegendScene)]
  → toggle respective key in localStorage
  → button label update
  (Effective on next GameScene start)

[GameScene._cleanupRound()]
  → this.music.stop(); this.musicStarted = false;
  (SFX: no teardown needed — stateless guard)

[GameScene.tick() — BGM cold-start recovery path]
  → if (!this.musicStarted && !isMuted()) this.music.play(); this.musicStarted = true;
  IMPORTANT: After feature 006 switches from this.sound.setMute() (global) to this.music.setMute()
  (instance-level), this tick guard becomes the SOLE fallback for starting BGM when the browser's
  AudioContext was locked on page load. If tick() is modified in a future feature, this guard MUST
  be preserved or the muted-then-unmuted cold-start scenario silently breaks.
```
