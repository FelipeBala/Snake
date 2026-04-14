# Research: Individual BGM & SFX Audio Controls

**Feature**: 006-audio-controls-screens  
**Date**: 2026-04-12

---

## Q1: How is the current unified mute wired in GameScene?

**Decision**: Replace `this.sound.setMute()` (global, affects all audio) with per-layer control.  
**Rationale**: `this.sound.setMute()` is a single global toggle on Phaser's sound manager and cannot distinguish BGM from SFX. Splitting into `this.music.setMute(isMuted())` for BGM and `if (!isSfxMuted())` guards on every `this.sound.play('sfx_*')` call cleanly separates concerns without adding new APIs.  
**Alternatives considered**: Using per-sound `volume` (set to 0 when muted) — rejected because it conflates muting with volume; toggling a CSS/JS flag on the parent scene — not applicable in Phaser 4.

---

## Q2: Can LegendScene access or stop the BGM `this.music` object?

**Decision**: LegendScene **does not** need to touch `this.music`. It only reads/writes localStorage preference keys.  
**Rationale**: `this.scene.start('GameScene')` fully restarts GameScene, which re-reads both preference keys via `isMuted()` and `isSfxMuted()` in `create()`. `_cleanupRound()` already stops music on scene teardown. So a LegendScene button write to localStorage is automatically respected when GameScene next starts.  
**Alternatives considered**: `this.scene.get('GameScene').music.setMute()` — rejected because GameScene is never concurrently active with LegendScene (scenes use `start()` not `launch()`).

---

## Q3: What localStorage key to use for SFX preference?

**Decision**: `snakeSfxMuted` — a new standalone key.  
**Rationale**: `snakeMuted` is already the BGM key (introduced in feature 005). Reusing it for "all audio" and splitting retroactively would break existing saved preferences. A separate key preserves backward compatibility: players who previously muted BGM retain that preference after the update.  
**Alternatives considered**: Replacing `snakeMuted` with a serialised JSON object — rejected as over-engineering for two boolean flags; would also break backward-compatibility.

---

## Q4: HUD layout — can two buttons fit to the right of `bestTxt`?

**Decision**: BGM button at `x = CANVAS_W - 76`, SFX button at `x = CANVAS_W - 36`. `bestTxt` remains at `x = CANVAS_W - 100` (unchanged from feature 005). 

**Rationale**:
- `bestTxt` has `setOrigin(1, 0.5)` at `x = CANVAS_W - 100`, so its right edge is at `CANVAS_W - 100`. Available strip: 100 px.
- Two emoji characters at 22 px bold each occupy ≈28 px width. Centers at `CANVAS_W - 76` and `CANVAS_W - 36` place them 40 px apart with ≈8 px margin from the `bestTxt` right edge and ≈8 px from the canvas right edge.  
**Alternatives considered**: Moving `bestTxt` further left — rejected because SC-005 prohibits displacing existing HUD elements.

---

## Q5: Where do the LegendScene buttons go?

**Decision**: Top-right corner at `y = 18` (same row as the "Legenda" title), `x = CANVAS_W - 76` (BGM) and `x = CANVAS_W - 36` (SFX).  
**Rationale**: The LegendScene title sits at `CANVAS_W / 2, 18` (28 px bold). The right side of that row is empty. Using the same `y = 18` vertically aligns the buttons with the title baseline. Using the same `x` positions as the Game screen HUD establishes consistent visual placement across screens (spec FR-002, SC-006).  
**Alternatives considered**: A dedicated second row below the title — rejected as it crowds the already-dense entries list.

---

## Q6: Constitution compliance check

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Browser-Native, Zero Dependencies | ✅ Pass | No new dependencies; localStorage + Phaser sound API only |
| II. Game-Loop Integrity | ✅ Pass | Button handlers are UI event callbacks, not tick-time mutations |
| III. Child-Friendly UX | ⚠️ Review | Emoji-only buttons lack text labels (< 48×48 px per constitution). Documented as accepted deviation per feature 005 precedent; buttons are supplemental controls, not primary game interactions. |
| IV. Single-File Delivery | ✅ Pass | No new assets or network requests |
| V. Gameplay Simplicity | ✅ Pass | No game-loop or state-model changes |

**Resolution for III**: Per feature 005 precedent, emoji audio controls are treated as supplemental HUD accessories. They do not gate gameplay. This deviation is accepted and carried forward unchanged.
