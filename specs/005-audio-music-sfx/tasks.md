# Tasks: Audio — Background Music & Sound Effects

**Input**: Design documents from `/specs/005-audio-music-sfx/`
**Prerequisites**: plan.md ✅ | spec.md ✅ | research.md ✅ | data-model.md ✅

**Branch**: `005-audio-music-sfx`  
**Total tasks**: 16  
**Tests**: Not requested — not included

---

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files / no dependency on incomplete tasks)
- **[Story]**: User story label — US1, US2, US3
- File paths are relative to the repository root

---

## Phase 1: Setup (Audio Assets)

**Purpose**: Download and place all CC0 audio files so every subsequent task has real assets to work with.

- [ ] T001 Download CC0 audio assets from Kenney.nl and place in `audio/` directory at repo root (7 files: `bgm.ogg`, `bgm.mp3`, `sfx_eat_standard.ogg/.mp3`, `sfx_eat_penta.ogg/.mp3`, `sfx_eat_rush.ogg/.mp3`, `sfx_eat_star.ogg/.mp3`, `sfx_eat_bomb.ogg/.mp3`, `sfx_collision.ogg/.mp3`)

**Checkpoint**: `audio/` directory exists with all 14 files (7 OGG + 7 MP3)

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Module-level helpers and GameScene asset loading — MUST be complete before any user story.

**⚠️ CRITICAL**: No user story work can begin until this phase is complete.

- [X] T002 Add `isMuted()` and `setMutePref(muted)` localStorage helpers to `game.js` after the existing `savePersonalBest()` function (follow the same try/catch pattern; default = `false` = unmuted; key = `'snakeMuted'`)
- [X] T003 Add `preload()` method to `GameScene` in `game.js` (before `create()`), loading all 7 audio keys: `bgm`, `sfx_eat_standard`, `sfx_eat_penta`, `sfx_eat_rush`, `sfx_eat_star`, `sfx_eat_bomb`, `sfx_collision` — each with `['audio/<key>.ogg', 'audio/<key>.mp3']` format array

**Checkpoint**: `isMuted()` returns false by default; `GameScene.preload()` registers all 7 audio keys with Phaser's loader

---

## Phase 3: User Story 1 — Background Music During Gameplay (Priority: P1) 🎯 MVP

**Goal**: Looping background music starts with the first game tick, stops on game end, and respects a persisted mute preference with a HUD toggle button.

**Independent Test**: Open `index.html`, start a game. Verify music begins within 1 second of round start, loops without audible gaps, and stops on game over. Click mute — music stops immediately, button updates, preference persists after reload. Verify muted state on reload suppresses auto-play.

- [X] T004 [US1] Reposition `bestTxt` in `GameScene.create()` in `game.js` from `x = CANVAS_W - 12` to `x = CANVAS_W - 100` to make room for the mute button
- [X] T005 [US1] Add mute icon button (`🔊`/`🔇`) to the HUD in `GameScene.create()` in `game.js` at `x = CANVAS_W - 52`, `y = HUD_H / 2` — interactive text object that calls `setMutePref()`, `this.sound.setMute()`, and updates its own label on click
- [X] T006 [US1] Initialize background music in `GameScene.create()` in `game.js`: create the Phaser sound instance with `this.sound.add('bgm', { loop: true, volume: 0.5 })`, apply `this.sound.setMute(isMuted())`, set `this.musicStarted = false`
- [X] T007 [US1] Handle browser autoplay policy in `GameScene.create()` in `game.js`: register `this.sound.once('unlocked', ...)` listener to start music after user interaction; also check `this.sound.context.state === 'running'` for the reload-with-existing-interaction case
- [X] T008 [US1] Start music on first game tick: in `GameScene.tick()` (or inside `GameScene.create()` where the tick interval is set up) in `game.js`, call `this.music.play()` guarded by `!this.musicStarted` and set `this.musicStarted = true`
- [X] T009 [US1] Stop music on game end: in `GameScene._cleanupRound()` in `game.js`, add `if (this.music) { this.music.stop(); this.musicStarted = false; }`

**Checkpoint**: US1 fully functional — music plays, loops, stops on game over, mute persists across reloads.

---

## Phase 4: User Story 2 — Food Sound Effects (Priority: P2)

**Goal**: Each of the 5 food types produces a distinct non-blocking SFX when consumed; sounds respect the global mute toggle.

**Independent Test**: Mute music, start a game. Eat one of each food type. Verify each produces a distinct audible sound. Verify no sounds play when muted. Eat foods rapidly — verify overlap causes no errors.

- [X] T010 [US2] Add `this.sound.play('sfx_eat_standard', { volume: 0.7 })` to the `FOOD_TYPES.STANDARD` case in `GameScene.applyFoodEffect()` in `game.js`
- [X] T011 [P] [US2] Add `this.sound.play('sfx_eat_penta', { volume: 0.8 })` to the `FOOD_TYPES.PENTA` case in `GameScene.applyFoodEffect()` in `game.js`
- [X] T012 [P] [US2] Add `this.sound.play('sfx_eat_rush', { volume: 0.7 })` to the `FOOD_TYPES.RUSH` case in `GameScene.applyFoodEffect()` in `game.js`
- [X] T013 [P] [US2] Add `this.sound.play('sfx_eat_star', { volume: 0.8 })` to the `FOOD_TYPES.STAR` case in `GameScene.applyFoodEffect()` in `game.js`
- [X] T014 [P] [US2] Add `this.sound.play('sfx_eat_bomb', { volume: 0.9 })` to the `FOOD_TYPES.BOMB` case in `GameScene.applyFoodEffect()` in `game.js`

**Checkpoint**: US2 fully functional — all 5 food types have distinct SFX, mute toggle silences all food SFX.

---

## Phase 5: User Story 3 — Collision Sound Effect (Priority: P3)

**Goal**: A single crash/thud sound plays immediately when the snake collides (wall, self, obstacle), simultaneous with the red-flash visual, and respects the mute toggle.

**Independent Test**: Start a game, steer into a wall. Verify collision sound plays at the exact moment of impact (same frame as the red flash). Repeat with self-collision and obstacle. Verify no sound plays when muted.

- [X] T015 [US3] Add `this.sound.play('sfx_collision', { volume: 1.0 })` as the first statement inside `GameScene.gameOver()` in `game.js` (before the red flash tween and before `_cleanupRound()`)

**Checkpoint**: US3 fully functional — collision sound plays on all 3 collision types, simultaneous with red flash, silenced when muted.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Final validation across all user stories.

- [ ] T016 [P] Manual smoke test: open `index.html` in browser with DevTools → Console open; play through a full round (all food types, intentional collision); verify no console errors related to audio; verify all 3 user stories pass their independent tests; verify offline play (disable network in DevTools → reload → confirm audio still loads)

**Checkpoint**: Feature complete — all 3 user stories pass, no audio-related console errors, offline verified.

---

## Dependencies

```
T001 (assets) → T003 (preload) → T006–T009 (US1 music)
                               → T010–T014 (US2 SFX)
                               → T015 (US3 collision)
T002 (helpers) → T005 (mute button)
              → T006 (music init applies isMuted())
T001 → T016 (smoke test requires all assets present)
```

**Story completion order**: US1 (T004–T009) → US2 (T010–T014) → US3 (T015) → Polish (T016)

**US2 tasks T011–T014** are marked [P] — they edit the same switch block but different `case` arms, so they can be applied in a single multi-replace call.

---

## Parallel Execution Examples

**All US2 SFX (T010–T014)** can be applied in one `multi_replace_string_in_file` call — each targets a different `case` in the same switch block.

**T009 and T015** are independent (different methods: `_cleanupRound()` vs `gameOver()`) — can be applied in the same multi-replace call.

---

## Implementation Strategy

**MVP Scope (US1 only)**: Complete T001–T009. Music plays, mute persists, game is fully functional. Deliver and verify before starting US2.

**Increment 2 (US2)**: Add T010–T014 on top of verified US1. Each case arm is a one-liner — low risk.

**Increment 3 (US3)**: Add T015. Single insertion in `gameOver()` — lowest risk task in the feature.

**Suggested delivery order**: T001 → T002 → T003 → T004 → T005 → T006 → T007 → T008 → T009 → [US1 checkpoint] → T010–T014 → [US2 checkpoint] → T015 → [US3 checkpoint] → T016
