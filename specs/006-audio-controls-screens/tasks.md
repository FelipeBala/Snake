# Tasks: Individual BGM & SFX Audio Controls on Game and Legend Screens

**Input**: Design documents from `/specs/006-audio-controls-screens/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Branch**: `006-audio-controls-screens`
**Total tasks**: 9 (7 implementation + 2 manual verification)
**Tasks per user story**: US1 → 3 tasks | US2 → 1 task | US3 → 1 task (verification)
**Parallel opportunities**: T004+T005 (different call sites), T008+T009 (manual)
**Tests**: Not requested — not included

---

## Phase 1: Setup

**Purpose**: Introduce the new SFX helper functions at module scope — all subsequent tasks depend on these.

- [x] T001 Add `isSfxMuted()` and `setSfxMutePref()` localStorage helpers in `game.js` after the existing `setMutePref()` function block (key `snakeSfxMuted`; same try/catch fail-open pattern as `isMuted()` / `setMutePref()`)

**Checkpoint**: Both `isSfxMuted()` and `setSfxMutePref()` are defined at module scope; absent key returns `false` (fail-open).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Replace global `this.sound.setMute()` with per-instance `this.music.setMute()` to decouple BGM from SFX. **Must complete before US1 or US2.**

**⚠️ CRITICAL**: Without this fix the old global mute suppresses all audio, making independent SFX control impossible.

- [x] T002 Replace `this.sound.setMute(isMuted())` with `this.music.setMute(isMuted())` in `GameScene.create()` in `game.js` (BGM init block, after `this.music = this.sound.add('bgm', ...)`)

**Checkpoint**: Only `this.music` is muted/unmuted based on the BGM preference; the Phaser global sound manager is no longer touched.

---

## Phase 3: User Story 1 — Independent BGM & SFX Controls on the Game Screen (Priority: P1) 🎯 MVP

**Goal**: Replace the single mute button in the Game screen HUD with two independent icon buttons — `bgmBtn` (🔊/🔇) and `sfxBtn` (🔔/🔕) — each controlling only its own audio channel.

**Independent Test**: Start a game. Verify two icon buttons appear HUD top-right. Click BGM — music stops, SFX on food still plays. Click SFX — food/collision sounds stop, music continues. Toggle each back — verify independent restoration. Check DevTools console for zero errors.

- [x] T003 [US1] Replace the existing `muteTxt` block in `GameScene.create()` in `game.js` with two buttons: `bgmBtn` at `x = CANVAS_W - 76` (calls `setMutePref()` + `this.music.setMute()`) and `sfxBtn` at `x = CANVAS_W - 36` (calls `setSfxMutePref()` only)
- [x] T004 [P] [US1] Add `if (!isSfxMuted())` guard to each of the 5 `this.sound.play('sfx_eat_*', ...)` calls in `GameScene.applyFoodEffect()` in `game.js`
- [x] T005 [P] [US1] Wrap `this.sound.play('sfx_collision', { volume: 1.0 })` with `if (!isSfxMuted())` in `GameScene.gameOver()` in `game.js`

**Checkpoint**: BGM and SFX toggle independently on the Game screen; both channels respect their mute state from the first tick; no console errors.

---

## Phase 4: User Story 2 — BGM & SFX Controls on the Legend Screen (Priority: P2)

**Goal**: Add matching `lgBgmBtn` (🔊/🔇) and `lgSfxBtn` (🔔/🔕) buttons to the Legend screen top-right corner at the same x positions as the Game screen. Buttons write to `localStorage` only — `GameScene` (owner of `this.music`) is not active while `LegendScene` runs.

**Independent Test**: Open the Legend screen. Verify two icon buttons appear top-right. Click each — icon updates. Navigate to the game — Game screen buttons reflect the state set on the Legend screen. Music and SFX behaviour matches.

- [x] T006 [US2] Add `lgBgmBtn` and `lgSfxBtn` text buttons to `LegendScene.create()` in `game.js` after the "Legenda" title block — positioned at `(CANVAS_W - 76, 18)` and `(CANVAS_W - 36, 18)` respectively; buttons write to `snakeMuted` / `snakeSfxMuted` only (no Phaser sound API calls)

**Checkpoint**: Both buttons visible on the Legend screen; icon state matches localStorage; Game screen reflects changes on next start.

---

## Phase 5: User Story 3 — Preferences Persist Across Sessions (Priority: P3)

**Goal**: Confirm (no additional code beyond T001–T006) that both `snakeMuted` and `snakeSfxMuted` survive browser close/reopen and are read correctly on the next `GameScene.create()` and `LegendScene.create()`.

**Independent Test**: Mute BGM, leave SFX active, close browser, reopen `index.html` — BGM button shows muted, music silent, SFX audible. Then mute SFX, reopen — SFX button shows muted, food sounds silent, music plays.

- [x] T007 [P] [US3] Confirm `isMuted()` initialises `bgmBtn` label + `this.music.setMute()` and `isSfxMuted()` initialises `sfxBtn` label in `GameScene.create()` in `game.js` — no code change required if T001–T006 are correct; add inline comment noting persistence is handled by localStorage reads in `create()`

**Checkpoint**: Both preferences survive page reload; button labels and audio behaviour correct on cold start.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final visual and functional validation across all three user stories.

- [ ] T008 [P] Verify HUD layout in browser: confirm `scoreTxt` (left), `bestTxt` (right-edge at `CANVAS_W - 100`), `bgmBtn` (`CANVAS_W - 76`), and `sfxBtn` (`CANVAS_W - 36`) do not overlap — check element origins visually in `game.js`
- [ ] T009 [P] Manual smoke test: open `index.html` with DevTools Console open; play a full round touching all food types and a deliberate wall collision; toggle BGM and SFX independently on both Game and Legend screens; verify no console errors; reload and verify persistence for both preferences

**Checkpoint**: Feature complete — all 3 user stories pass independent tests; no console errors; HUD and Legend screen layout clean.

---

## Dependencies

```
T001 (helpers) ──► T002 (BGM init fix)
               ├── T003 (GameScene buttons)
               ├── T004 [P] (SFX guards in applyFoodEffect)
               ├── T005 [P] (SFX guard in gameOver)
               ├── T006 (LegendScene buttons)
               └── T007 [P] (persistence confirmation)

T002 must complete before T003 (global mute must be removed first)
T003, T004, T005 are independent of each other (different code sites)
T006 is independent of T003–T005
T008, T009 depend on all prior tasks
```

**Story completion order**: Setup (T001) → Foundational (T002) → US1 (T003–T005) → US2 (T006) → US3 (T007) → Polish (T008–T009)

---

## Parallel Execution

**T004 + T005**: Different call sites in `game.js` (`applyFoodEffect()` vs `gameOver()`) — apply in a single `multi_replace_string_in_file` call alongside T003 once T001 and T002 are done.

**T008 + T009**: Both are manual browser checks — perform simultaneously.

---

## Implementation Strategy

**MVP (US1 only)**: Complete T001 → T002 → T003 → T004 → T005. Game screen has fully independent BGM/SFX controls. Verify before starting US2.

**Increment 2 (US2)**: T006 — single insert in `LegendScene.create()`. No sound API involved; lowest risk task.

**Increment 3 (US3)**: T007 — confirmation only. If T001–T006 are correct, persistence is free: `localStorage` reads on every `create()` call handle it automatically. T007 adds a comment and marks complete with no code change.

**Suggested MVP scope**: US1 (T001–T005) delivers the primary user value on its own.
