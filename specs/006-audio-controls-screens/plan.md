# Implementation Plan: Individual BGM & SFX Audio Controls on Game and Legend Screens

**Branch**: `006-audio-controls-screens` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-audio-controls-screens/spec.md`

## Summary

Feature 005 introduced a single combined audio mute button in the Game screen HUD. Feature 006 splits that into two independent channels — BGM and SFX — each with its own toggle button. The same two buttons are added to the Legend screen's top-right corner. A new `snakeSfxMuted` localStorage key tracks SFX preference independently from the existing `snakeMuted` (BGM) key. All changes are confined to `game.js` (6 targeted edits, no new files).

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+  
**Primary Dependencies**: Phaser 4.0.0 (local `lib/phaser.min.js`) — built-in sound manager  
**Storage**: `window.localStorage` — keys `snakeMuted` (BGM, existing) and `snakeSfxMuted` (SFX, new)  
**Testing**: Not applicable — no automated test suite in this project  
**Target Platform**: Modern evergreen browsers (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+); file:// protocol  
**Project Type**: Browser game — single static file deployment  
**Performance Goals**: 60 fps game loop unaffected; button response < 1 frame  
**Constraints**: Offline-capable; no new asset files; no new dependencies; HUD elements must not overlap  
**Scale/Scope**: 2 scenes modified (`GameScene`, `LegendScene`), 6 code changes in `game.js`

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Justification |
|-----------|--------|---------------|
| I. Browser-Native, Zero Dependencies | ✅ Pass | localStorage + Phaser sound API; no new deps |
| II. Game-Loop Integrity | ✅ Pass | Button handlers are UI callbacks, not tick mutations |
| III. Child-Friendly UX | ⚠️ Accepted deviation | Emoji-only buttons (≈28 px, no text label) — same deviation as feature 005 precedent; supplemental HUD controls, not primary game interactions |
| IV. Single-File Delivery | ✅ Pass | No new assets or network requests |
| V. Gameplay Simplicity | ✅ Pass | No game-loop or game-state changes |

**Post-design re-check**: No new violations introduced by data-model or UI layout decisions.

## Project Structure

### Documentation (this feature)

```text
specs/006-audio-controls-screens/
├── plan.md        ← this file
├── research.md    ← Phase 0 output
├── data-model.md  ← Phase 1 output
└── tasks.md       ← Phase 2 output (/speckit.tasks — not created here)
```

### Source Code

```text
game.js    ← sole modified file; all 6 changes are in-place edits
audio/     ← unchanged (assets from feature 005)
```

No new files. No new directories.

## Complexity Tracking

> No constitution violations requiring justification beyond the accepted emoji-button deviation (carried from feature 005).

---

## Blueprint

All changes are in `game.js`. Changes are listed in implementation order (dependency-safe top-to-bottom sequence).

---

### Change 1 — Add `isSfxMuted()` and `setSfxMutePref()` helpers

**Location**: Immediately after `setMutePref()` (currently after line ~225)  
**Type**: Insert

```javascript
function isSfxMuted() {
  try { return localStorage.getItem('snakeSfxMuted') === 'true'; }
  catch (e) { return false; }
}

function setSfxMutePref(muted) {
  try { localStorage.setItem('snakeSfxMuted', String(muted)); }
  catch (e) { /* best-effort; ignore storage errors */ }
}
```

**Rationale**: Follows the exact same try/catch pattern as `isMuted()` / `setMutePref()`. New key `snakeSfxMuted` is independent of `snakeMuted`.

---

### Change 2 — Replace the single mute button in `GameScene.create()` with BGM + SFX buttons

**Location**: The existing `muteTxt` block in `GameScene.create()` (the `// T003 — mute toggle button in HUD` block)  
**Type**: Replace

Replace the existing combined `muteTxt` block with two separate buttons:

```javascript
    // BGM toggle button
    const bgmBtn = this.add.text(CANVAS_W - 76, HUD_H / 2, isMuted() ? '🔇' : '🔊', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => bgmBtn.setScale(1.15))
      .on('pointerout',  () => bgmBtn.setScale(1.0))
      .on('pointerdown', () => {
        bgmBtn.setScale(0.9);
        const nowMuted = !isMuted();
        setMutePref(nowMuted);
        this.music.setMute(nowMuted);
        bgmBtn.setText(nowMuted ? '🔇' : '🔊');
      })
      .on('pointerup', () => bgmBtn.setScale(1.0));

    // SFX toggle button
    const sfxBtn = this.add.text(CANVAS_W - 36, HUD_H / 2, isSfxMuted() ? '🔕' : '🔔', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => sfxBtn.setScale(1.15))
      .on('pointerout',  () => sfxBtn.setScale(1.0))
      .on('pointerdown', () => {
        sfxBtn.setScale(0.9);
        setSfxMutePref(!isSfxMuted());
        sfxBtn.setText(isSfxMuted() ? '🔕' : '🔔');
      })
      .on('pointerup', () => sfxBtn.setScale(1.0));
```

**Rationale**: BGM button now calls `this.music.setMute()` (instance-level) instead of `this.sound.setMute()` (global). SFX button writes only to localStorage; the guard is applied at each `sound.play()` call site.

---

### Change 3 — Fix BGM init: replace global `sound.setMute()` with `music.setMute()`

**Location**: `GameScene.create()` — the line `this.sound.setMute(isMuted());`  
**Type**: Replace one line

```javascript
    this.music.setMute(isMuted());
```

**Rationale**: The old `this.sound.setMute(isMuted())` applied a global mute that would also silence SFX. Using the instance-level `this.music.setMute()` restricts the BGM preference to the BGM track only.

---

### Change 4 — Add `isSfxMuted()` guards to all SFX `sound.play()` calls in `applyFoodEffect()`

**Location**: The 5 `case` arms in `GameScene.applyFoodEffect()` switch  
**Type**: Replace (each `this.sound.play('sfx_eat_*', ...)` becomes conditional)

```javascript
    switch (food.type) {
      case FOOD_TYPES.STANDARD: state.growthRemaining++; state.score++;    if (!isSfxMuted()) this.sound.play('sfx_eat_standard', { volume: 0.7 }); break;
      case FOOD_TYPES.PENTA:    this.growSnake(5);       state.score += 5; if (!isSfxMuted()) this.sound.play('sfx_eat_penta',    { volume: 0.8 }); break;
      case FOOD_TYPES.RUSH:     this.shrinkSnake(5);  this.activateRush();  if (!isSfxMuted()) this.sound.play('sfx_eat_rush',     { volume: 0.8 }); break;
      case FOOD_TYPES.STAR:     state.score += 10;                          if (!isSfxMuted()) this.sound.play('sfx_eat_star',     { volume: 0.8 }); break;
      case FOOD_TYPES.BOMB:     this.bombEffect();                          if (!isSfxMuted()) this.sound.play('sfx_eat_bomb',     { volume: 0.9 }); break;
    }
```

---

### Change 5 — Add `isSfxMuted()` guard to collision SFX in `gameOver()`

**Location**: First statement in `GameScene.gameOver()`  
**Type**: Replace one line

```javascript
    if (!isSfxMuted()) this.sound.play('sfx_collision', { volume: 1.0 });
```

---

### Change 6 — Add BGM + SFX buttons to `LegendScene.create()`

**Location**: `LegendScene.create()` — after the "Legenda" title `this.add.text()` block and before the entry definitions  
**Type**: Insert

```javascript
    // BGM toggle button (top-right, same row as title)
    const lgBgmBtn = this.add.text(CANVAS_W - 76, 18, isMuted() ? '🔇' : '🔊', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => lgBgmBtn.setScale(1.15))
      .on('pointerout',  () => lgBgmBtn.setScale(1.0))
      .on('pointerdown', () => {
        lgBgmBtn.setScale(0.9);
        setMutePref(!isMuted());
        lgBgmBtn.setText(isMuted() ? '🔇' : '🔊');
      })
      .on('pointerup', () => lgBgmBtn.setScale(1.0));

    // SFX toggle button (top-right, same row as title)
    const lgSfxBtn = this.add.text(CANVAS_W - 36, 18, isSfxMuted() ? '🔕' : '🔔', {
      fontFamily: '"Trebuchet MS", Arial',
      fontSize:   '22px',
      color:      '#ffffff'
    }).setOrigin(0.5)
      .setInteractive({ useHandCursor: true })
      .on('pointerover', () => lgSfxBtn.setScale(1.15))
      .on('pointerout',  () => lgSfxBtn.setScale(1.0))
      .on('pointerdown', () => {
        lgSfxBtn.setScale(0.9);
        setSfxMutePref(!isSfxMuted());
        lgSfxBtn.setText(isSfxMuted() ? '🔕' : '🔔');
      })
      .on('pointerup', () => lgSfxBtn.setScale(1.0));
```

**Rationale**: LegendScene has no active `this.music` (GameScene is not running simultaneously). Buttons write to localStorage only; preferences are read by GameScene on the next `create()` call. No interaction with the Phaser sound manager is needed here.

---

## Dependency Order

```
Change 1 (helpers) → Change 2 (GameScene BGM+SFX buttons)
                   → Change 3 (fix sound.setMute → music.setMute)
                   → Change 4 (SFX guards in applyFoodEffect)
                   → Change 5 (SFX guard in gameOver)
                   → Change 6 (LegendScene buttons)
```

Changes 3–6 all depend on Change 1 (new helpers). Changes 3–6 are independent of each other and can be applied in any order after Change 1.
