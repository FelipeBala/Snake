# Implementation Plan: Individual BGM & SFX Audio Controls on Game and Legend Screens

**Branch**: `006-audio-controls-screens` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/006-audio-controls-screens/spec.md`

## Summary

Replace the single combined mute button in the Game screen HUD with two independent icon buttons — one for BGM (🔊/🔇) and one for SFX (🔔/🔕) — and add the same two buttons to the Legend screen. Each button controls only its respective audio channel and persists its state to `localStorage` independently. No new assets or dependencies are introduced; all changes are confined to `game.js`.

Technical approach: per-instance BGM muting via `this.music.setMute()` (replacing global `this.sound.setMute()`), plus `if (!isSfxMuted())` guards at every `sound.play('sfx_*')` call site. Legend screen buttons write to `localStorage` only — they do not access the Phaser sound manager because `GameScene` (which owns `this.music`) is never concurrently active with `LegendScene`.

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+  
**Primary Dependencies**: Phaser 4.0.0 (local, `lib/phaser.min.js`) — built-in sound manager wraps Web Audio API  
**Storage**: `window.localStorage` — keys `snakeMuted` (BGM, existing) and `snakeSfxMuted` (SFX, new)  
**Testing**: Manual browser smoke test (no automated test framework)  
**Target Platform**: Browser (desktop primary; mobile out of scope for this feature)  
**Project Type**: Single-file browser game  
**Performance Goals**: No change to rendering or game-loop throughput; audio calls are infrequent (at most once per tick)  
**Constraints**: All changes in `game.js` only; no new files; no new network requests; backward-compatible with the existing `snakeMuted` key  
**Scale/Scope**: 6 targeted edits to `game.js`; 2 new `localStorage` helper functions

## Constitution Check

*Evaluated against project principles identified in prior features.*

| Principle | Status | Notes |
|-----------|--------|-------|
| Browser-Native, Zero Dependencies | ✅ Pass | No new dependencies; `localStorage` + Phaser sound API only |
| Game-Loop Integrity | ✅ Pass | Button handlers are UI event callbacks, not tick-time mutations |
| Child-Friendly UX | ⚠️ Accepted deviation | Emoji-only buttons are < 48×48 px. Documented as accepted per feature 005 precedent; buttons are supplemental HUD accessories, not primary game interactions |
| Single-File Delivery | ✅ Pass | No new assets or network requests |
| Gameplay Simplicity | ✅ Pass | No game-loop or state-model changes |

**Complexity justification for ⚠️**: Emoji audio controls are identical in style to the existing feature 005 mute button. Adding text labels would require HUD layout redesign outside this feature's scope. Accepted deviation is consistent with the established pattern.

## Project Structure

### Documentation (this feature)

```text
specs/006-audio-controls-screens/
├── plan.md        # This file
├── research.md    # Phase 0 — design questions resolved
├── data-model.md  # Phase 1 — entities, localStorage keys, UI element layout
└── tasks.md       # Phase 2 — 9 tasks (T001–T009) across 6 phases
```

### Source Code (repository root)

```text
game.js            # All changes — 6 edits, 2 new helper functions
```

No new files. No structural changes to the repository.

**Structure Decision**: Single-file vanilla JS game. All feature code lives in `game.js` alongside existing scenes and helpers.

## Phase 0 — Research

All design questions resolved in [`research.md`](research.md). Key decisions:

- **BGM control**: Replace `this.sound.setMute()` (global) with `this.music.setMute()` (instance-only) to decouple BGM from SFX.
- **SFX control**: Guard every `sound.play('sfx_*')` call with `if (!isSfxMuted())` — stateless reads at the call site; no in-memory flag needed.
- **LegendScene**: Writes to `localStorage` only; does not touch `this.music` (owned by `GameScene`, which is not active during `LegendScene`).
- **localStorage key**: New `snakeSfxMuted` key; existing `snakeMuted` unchanged for backward compatibility.
- **HUD layout**: Two buttons at `CANVAS_W - 76` (BGM) and `CANVAS_W - 36` (SFX); `bestTxt` stays at `CANVAS_W - 100`.

## Phase 1 — Design

Full entity definitions, state transitions, and UI element layout documented in [`data-model.md`](data-model.md). Summary:

### New localStorage key

| Key | Type | Default | Description |
|-----|------|---------|-------------|
| `snakeSfxMuted` | `'true'` \| `'false'` \| absent | absent → `false` | SFX muted preference. Absent = unmuted (fail-open). |

### New helper functions (module scope in `game.js`)

```js
function isSfxMuted()           // reads snakeSfxMuted → boolean; try/catch fail-open
function setSfxMutePref(muted)  // writes snakeSfxMuted; try/catch fail-open
```

### UI elements added

| Screen | Element | x | y | Icon |
|--------|---------|---|---|------|
| GameScene HUD | `bgmBtn` (replaces `muteTxt`) | `CANVAS_W - 76` | `HUD_H / 2` | 🔊 / 🔇 |
| GameScene HUD | `sfxBtn` (new) | `CANVAS_W - 36` | `HUD_H / 2` | 🔔 / 🔕 |
| LegendScene | `lgBgmBtn` | `CANVAS_W - 76` | 18 | 🔊 / 🔇 |
| LegendScene | `lgSfxBtn` | `CANVAS_W - 36` | 18 | 🔔 / 🔕 |

### Edits to `game.js`

| # | Location | Change |
|---|----------|--------|
| 1 | Module scope (after `setMutePref`) | Add `isSfxMuted()` and `setSfxMutePref()` |
| 2 | `GameScene.create()` — BGM init | `this.sound.setMute()` → `this.music.setMute()` |
| 3 | `GameScene.create()` — HUD buttons | Replace `muteTxt` block with `bgmBtn` + `sfxBtn` |
| 4 | `GameScene.applyFoodEffect()` | Wrap 5 `sound.play('sfx_eat_*')` calls with `if (!isSfxMuted())` |
| 5 | `GameScene.gameOver()` | Wrap `sound.play('sfx_collision')` with `if (!isSfxMuted())` |
| 6 | `LegendScene.create()` | Add `lgBgmBtn` + `lgSfxBtn` after the title block |
