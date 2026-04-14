---
description: "Task list for feature 007-turbo-visual-effects"
---

# Tasks: Turbo Visual Effects

**Input**: Design documents from `/specs/007-turbo-visual-effects/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅

**Organization**: Two user stories — segment fade-out (US1) and boost-state visual (US2). Both are changes to `game.js` only. They are independent at the code level and can be implemented and verified separately.

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different files or fully independent within the same file)
- **[Story]**: Which user story this task belongs to

---

## Phase 1: Setup

**Purpose**: Confirm codebase anchor points before modifying.

- [X] T001 Locate and read the `shrinkSnake()` method and `applyFoodEffect()` RUSH case in `game.js` to confirm exact splice location for ghost hook
- [X] T002 Locate the snake body/head rendering block inside `redraw()` in `game.js` to confirm exact insertion point for rush tint branch

---

## Phase 2: Foundational

**Purpose**: No shared infrastructure changes needed — both user stories are self-contained rendering additions. This feature has no foundational phase beyond Setup.

**Checkpoint**: Setup tasks complete → proceed to US1 and US2 which can be implemented in parallel.

---

## Phase 3: User Story 1 — Segment Fade-Out Animation (Priority: P1) 🎯 MVP

**Goal**: When the snake eats Turbo food, the removed tail segments visibly dissolve at their grid positions instead of disappearing instantly.

**Independent Test**:
1. Load the game in a browser and grow the snake to at least 8 segments.
2. Position the snake to eat a Turbo (purple lightning bolt) food item.
3. Observe: 5 ghost rectangles (green, matching body colour) must appear at the tail positions and fade to invisible within ~500 ms.
4. Confirm the ghosts do not affect movement, collision, or score.
5. Eat two Turbo items in quick succession — both ghost waves must animate concurrently.

- [X] T003 [US1] Add `spawnGhosts(segments)` method to `GameScene` in `game.js`: for each `{x, y}` in segments, call `this.add.rectangle(x * CELL + CELL/2, HUD_H + y * CELL + CELL/2, CELL - 4, CELL - 4, C_SNAKE_BODY)`, set depth to 1, then add tween `{ targets: rect, alpha: 0, duration: 500, ease: 'Sine.Out', onComplete: () => rect.destroy() }`
- [X] T004 [US1] Modify `shrinkSnake(n)` in `game.js`: assign the return value of `state.snake.splice(...)` to a `removed` variable, then call `this.spawnGhosts(removed)` immediately after the splice (only when `remove > 0`)

---

## Phase 4: User Story 2 — Boost-State Body Visual (Priority: P2)

**Goal**: While the speed boost is active, the snake body pulses purple, giving the player an immediate and continuous visual cue that the snake is accelerated.

**Independent Test**:
1. Load the game and eat a Turbo food item.
2. Observe: the entire snake body (all segments and head) must immediately switch from green to purple.
3. The purple must visibly pulse (brighten and dim rhythmically) every ~0.3 seconds while the boost lasts.
4. After 5 seconds the snake must revert to normal green — no purple tint remains.
5. Eat a second Turbo while boosted — the purple visual must continue without interruption; the 5-second timer resets.

- [X] T005 [US2] In `redraw()` in `game.js`, replace the static snake-body and snake-head `fillStyle` calls with a branch on `state.rushActive`: when `true`, use `gfx.fillStyle(0xaa00ff, 0.7 + 0.3 * Math.abs(Math.sin(this.time.now / 160)))` for body segments and `gfx.fillStyle(0xcc44ff, 1)` for the head; when `false`, use the existing `C_SNAKE_BODY` and `C_SNAKE_HEAD` values unchanged

---

## Phase 5: Polish & Cross-Cutting Concerns

**Goal**: Verify both effects work correctly together and across edge cases.

**Independent Test**: Run all four scenarios from spec.md in sequence.

- [ ] T006 [P] Manual browser test — Scenario 1: eat Turbo with long snake; confirm ghost fade AND purple pulse both activate simultaneously at the moment of consumption
- [ ] T007 [P] Manual browser test — Scenario 2: eat Turbo with snake of length 3 (fewer than 5 segments); confirm 2 ghosts appear, speed visual activates, no crash
- [ ] T008 [P] Manual browser test — Scenario 3: eat two Turbo items back-to-back within 5 seconds; confirm concurrent ghost waves and uninterrupted purple pulse
- [ ] T009 [P] Manual browser test — Scenario 4: verify purple tint ends cleanly at exactly 5 seconds after last Turbo consumed (no residual tint); confirm normal green resumes

---

## Dependencies

```
T001 → T004 (must know shrinkSnake location before modifying it)
T002 → T005 (must know redraw() snake block before modifying it)
T003 → T004 (spawnGhosts must exist before shrinkSnake calls it)
T004, T005 → T006, T007, T008, T009 (manual tests require both effects implemented)
```

## Parallel Execution

- **T001 and T002** can run in parallel (reading different methods).
- **T003 and T005** can run in parallel after setup (different methods in game.js with no shared edits).
- **T006, T007, T008, T009** can all run in parallel (independent browser tests).

## MVP Scope

**Minimum viable**: T001 → T003 → T004 (US1 only — ghost fade-out).  
US1 alone delivers the most critical feedback (snake visibly shrinking). US2 (purple pulse) can be added immediately after with T002 → T005.

## Implementation Strategy

1. Complete T001 + T002 (read-only orientation).
2. Implement T003 (`spawnGhosts` method) — additive, no existing code changed.
3. Implement T004 (modify `shrinkSnake`) — one-line capture + one call.
4. Implement T005 (modify `redraw()` snake render block) — branch addition only.
5. Run T006–T009 in parallel for full scenario validation.

Total implementation changes: ~15 lines across 3 locations in `game.js`.
