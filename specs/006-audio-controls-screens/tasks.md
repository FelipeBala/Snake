# Tasks: Individual BGM & SFX Audio Controls on Game and Legend Screens

**Input**: Design documents from `/specs/006-audio-controls-screens/`  
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Branch**: `006-audio-controls-screens`  
**Total tasks**: 9  
**Tests**: Not requested — not included

---

## Format: `[ID] [P?] [Story?] Description`

- **[P]**: Can run in parallel (different files / no dependency on incomplete tasks)
- **[Story]**: User story label — US1, US2, US3
- File paths are relative to the repository root

---

## Phase 1: Setup

**Purpose**: Introduce the new SFX helper functions that all subsequent tasks depend on.

- [X] T001 Add `isSfxMuted()` and `setSfxMutePref()` localStorage helpers in `game.js` after the existing `setSfxMutePref` function block (key `snakeSfxMuted`; same try/catch pattern as `isMuted()` / `setMutePref()`)

**Checkpoint**: Both `isSfxMuted()` and `setSfxMutePref()` are defined at module scope and return the correct boolean for the `snakeSfxMuted` localStorage key; absent key returns `false` (fail-open).

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Fix the BGM init so `this.sound.setMute()` (global) is replaced with `this.music.setMute()` (instance-only). This decouples BGM muting from SFX — required before splitting controls.

**⚠️ CRITICAL**: US1 and US2 cannot be fully implemented until this fix is in place, because the old global `sound.setMute()` would suppress SFX regardless of the SFX toggle state.

- [X] T002 Replace `this.sound.setMute(isMuted())` with `this.music.setMute(isMuted())` in `GameScene.create()` in `game.js` (the BGM init block after `this.music = this.sound.add('bgm', ...)`)

**Checkpoint**: Toggling global mute on the Phaser sound manager no longer occurs during BGM init; only the `this.music` instance is muted/unmuted based on the BGM preference.

---

## Phase 3: User Story 1 — Independent BGM & SFX Controls on the Game Screen (Priority: P1) 🎯 MVP

**Goal**: Replace the single combined mute button in the Game screen HUD with two independent buttons: `bgmBtn` (🔊/🔇) and `sfxBtn` (🔔/🔕). Each controls only its own audio channel. SFX channels are guarded at their play-call sites.

**Independent Test**: Start a game. Verify two icon buttons appear in the HUD top-right. Click BGM — music stops, SFX on food still plays. Click SFX — food/collision sounds stop, music continues. Toggle each back — verify independent restoration. Verify no JavaScript errors in DevTools console.

- [X] T003 [US1] Replace the existing `muteTxt` block in `GameScene.create()` in `game.js` with two separate buttons: `bgmBtn` at `x = CANVAS_W - 76` (calls `setMutePref()` + `this.music.setMute()`) and `sfxBtn` at `x = CANVAS_W - 36` (calls `setSfxMutePref()` only)
- [X] T004 [P] [US1] Add `if (!isSfxMuted())` guard to each of the 5 `this.sound.play('sfx_eat_*', ...)` calls in `GameScene.applyFoodEffect()` in `game.js`
- [X] T005 [P] [US1] Replace `this.sound.play('sfx_collision', { volume: 1.0 })` with `if (!isSfxMuted()) this.sound.play('sfx_collision', { volume: 1.0 })` in `GameScene.gameOver()` in `game.js`

**Checkpoint**: US1 fully functional — BGM and SFX toggle independently on Game screen; both channels respect mute state immediately; no console errors.

---

## Phase 4: User Story 2 — BGM & SFX Controls on the Legend Screen (Priority: P2)

**Goal**: Add matching `lgBgmBtn` (🔊/🔇) and `lgSfxBtn` (🔔/🔕) buttons to the Legend screen top-right corner (same x positions as Game screen, `y = 18`). Buttons write to localStorage only — no interaction with the Phaser sound manager needed.

**Independent Test**: Open the Legend screen. Verify two icon buttons appear in the top-right corner. Click each and verify the icon updates. Navigate to the game and verify the Game screen buttons match the state set on the Legend screen. Verify music and SFX behaviour matches.

- [X] T006 [US2] Add `lgBgmBtn` and `lgSfxBtn` text buttons to `LegendScene.create()` in `game.js` after the "Legenda" title block and before the `entries` array — positioned at `(CANVAS_W - 76, 18)` and `(CANVAS_W - 36, 18)` respectively; buttons write to `snakeMuted` / `snakeSfxMuted` only (no sound API calls)

**Checkpoint**: US2 fully functional — both buttons visible on Legend screen; icon state matches localStorage; Game screen reflects Legend screen changes on next start.

---

## Phase 5: User Story 3 — Preferences Persist Across Sessions (Priority: P3)

**Goal**: Verify (no additional code needed beyond T001–T006) that both `snakeMuted` and `snakeSfxMuted` keys survive browser close/reopen and are correctly read on the next `GameScene.create()` and `LegendScene.create()` calls.

**Independent Test**: Mute BGM, leave SFX active. Close browser. Reopen `index.html`. Verify BGM button shows muted, music does not auto-play, food SFX works. Then mute SFX, reopen — verify SFX button shows muted, food sounds are silent, music plays.

- [X] T007 [P] [US3] Verify persistence: confirm `isMuted()` is called in `GameScene.create()` to initialise `bgmBtn` label and `this.music.setMute()`, and `isSfxMuted()` is called to initialise `sfxBtn` label — no code change required if T001–T006 are correctly implemented; add a code comment noting persistence is handled by helper reads in `create()` if both are already present

**Checkpoint**: US3 fully functional — both preferences survive page reload; button labels and audio behaviour correct on cold start.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all user stories.

- [ ] T008 [P] Verify HUD layout: confirm `scoreTxt` (left-aligned), `bestTxt` (right-edge at `CANVAS_W - 100`), `bgmBtn` (at `CANVAS_W - 76`), and `sfxBtn` (at `CANVAS_W - 36`) do not overlap — check visually in the browser and confirm no element origins collide
- [ ] T009 [P] Manual smoke test: open `index.html` in browser with DevTools → Console open; play through a full round interacting with all food types and a deliberate collision; toggle BGM and SFX independently on both Game and Legend screens; verify no console errors; reload and verify persistence

**Checkpoint**: Feature complete — all 3 user stories pass their independent tests; no console errors; HUD and Legend screen layout clean.

---

## Dependencies

```
T001 (helpers) → T002 (BGM init fix)
             → T003 (GameScene BGM+SFX buttons)
             → T004 (SFX guards in applyFoodEffect)
             → T005 (SFX guard in gameOver)
             → T006 (LegendScene buttons)
             → T007 (persistence verification)

T002 must complete before T003 (BGM init must not use global sound.setMute before split buttons exist)
T003, T004, T005 are independent of each other (different code locations)
T006 is independent of T003–T005
T008, T009 depend on all prior tasks
```

**Story completion order**: Setup (T001) → Foundational (T002) → US1 (T003–T005) → US2 (T006) → US3 (T007) → Polish (T008–T009)

---

## Parallel Execution Examples

**T004 and T005** are independent (`applyFoodEffect()` vs `gameOver()`) — can be applied in a single `multi_replace_string_in_file` call together with T003 after T001 and T002 complete.

**T008 and T009** are both manual verification tasks — can be performed simultaneously.

---

## Implementation Strategy

**MVP Scope (US1 only)**: Complete T001 → T002 → T003 → T004 → T005. Game screen has fully split BGM/SFX controls. Deliver and verify before starting US2.

**Increment 2 (US2)**: Add T006 (single insert in LegendScene). Lowest risk — no sound API involved.

**Increment 3 (US3)**: T007 is a verification task — no code change expected if T001–T006 are correct.

**Note on T007**: This is a confirmation task. If `isMuted()` and `isSfxMuted()` are already correctly called in `create()` (as required by T003 and T006), persistence is free — localStorage reads on every `create()` call handle it automatically. T007 produces a code comment only if no gap is found.
