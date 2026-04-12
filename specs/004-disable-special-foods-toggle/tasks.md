# Tasks: Disable Special Foods Toggle

**Input**: Design documents from `/specs/004-disable-special-foods-toggle/`  
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅  
**File under change**: `game.js` (all 4 changes in this single file)  
**Tests**: Not requested — manual browser verification only

## Format: `[ID] [P?] [Story] Description`

- **[P]**: Can run in parallel (different logical areas of the file, no data dependency)
- **[Story]**: Which user story this task belongs to
- All file paths refer to `game.js` at the repository root

---

## Phase 1: Setup

**Purpose**: Confirm working baseline before any changes are made.

- [X] T001 Verify `game.js` opens correctly in browser (`index.html`) — LegendScene accessible, food spawning works, no console errors

**Checkpoint**: Baseline confirmed — implementation can begin.

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Add the two module-level helpers that every other task depends on.

⚠️ **CRITICAL**: Tasks T003 and T004 MUST be complete before any user story work begins — they are called by both the LegendScene toggle (US1) and `fetchNextCard()` (US1), and by the dimming logic (US2).

- [X] T002 Add `isSpecialFoodsEnabled()` helper function in `game.js` (module-level, before `EventCardManager` class ~line 260) — reads `localStorage` key `snakeSpecialFoodsEnabled`, returns `true` on missing/error/any value except string `'false'`
- [X] T003 Add `setSpecialFoodsEnabled(enabled)` helper function in `game.js` (immediately after T002) — writes `String(enabled)` to `localStorage` key `snakeSpecialFoodsEnabled`, silently ignores storage errors via try/catch
- [ ] T004 Verify in browser console that `isSpecialFoodsEnabled()` returns `true` by default, returns `false` after `setSpecialFoodsEnabled(false)`, and returns `true` again after `setSpecialFoodsEnabled(true)`

**Checkpoint**: Helpers verified — user story implementation can now begin.

---

## Phase 3: User Story 1 — Disable Special Foods Toggle (Priority: P1) 🎯 MVP

**Goal**: Toggle button in LegendScene persists the special-foods preference to localStorage, and `fetchNextCard()` enforces it so only Normal food (+ card size 1) spawns when disabled.

**Independent Test**: Open `index.html` → Legenda → click "Desabilitar Comidas Especiais" → Voltar → Jogar. Play a full round and confirm only Normal (yellow) food appears. Close the browser, reopen — confirm the toggle still shows "Habilitar Comidas Especiais" (disabled state remembered).

### Implementation for User Story 1

- [X] T005 [US1] Add early-return guard to `fetchNextCard()` in `game.js` (~line 271): `if (!isSpecialFoodsEnabled()) return { slots: [FOOD_TYPES.STANDARD] };` — place as first statement inside the function body, before any existing logic
- [X] T006 [P] [US1] Add toggle button to `LegendScene.create()` in `game.js` — after the last legend row/separator, call `makeButton()` with: label `'Desabilitar Comidas Especiais'` (when enabled) or `'Habilitar Comidas Especiais'` (when disabled), color `0xe53935` (enabled) or `0x43a047` (disabled); on click call `setSpecialFoodsEnabled(!isSpecialFoodsEnabled())` then `this.scene.restart()`
- [ ] T007 [US1] Verify toggle button meets minimum 48 px height (per constitution Principle III) — inspect via browser DevTools or Phaser scene debugger
- [ ] T008 [US1] Test US1 acceptance scenarios in browser:
  - Toggle starts at "Desabilitar Comidas Especiais" on first load
  - Clicking it switches label to "Habilitar Comidas Especiais"
  - Starting a game after disabling — confirm zero special foods spawn in a full round
  - Closing and reopening browser — confirm disabled state is remembered by inspecting the toggle label

**Checkpoint**: User Story 1 is fully functional and independently testable. MVP is complete.

---

## Phase 4: User Story 2 — Visual Feedback for Disabled Entries (Priority: P2)

**Goal**: When special foods are disabled, all non-STANDARD food rows in the LegendScene appear dimmed (alpha 0.35) so the player immediately sees which foods are inactive.

**Independent Test**: With special foods disabled, open the LegendScene. Verify Normal row is full-opacity and all other food rows (Penta, Turbo, Estrela, Bomba) are visibly dimmed. Re-enable; verify all rows return to full opacity — no page reload needed (scene restarts on toggle click).

### Implementation for User Story 2

- [X] T009 [US2] In `LegendScene.create()` in `game.js`, compute `const specialEnabled = isSpecialFoodsEnabled();` once, before the rows are drawn
- [X] T010 [US2] After each non-STANDARD, non-OBSTACLE legend row is created (icon graphics + name text + desc text), apply `setAlpha(0.35)` to all three objects when `!specialEnabled` — apply individually for PENTA, RUSH, STAR, BOMB rows; leave STANDARD and OBSTACLE rows at default alpha (1.0)
- [ ] T011 [US2] Test US2 acceptance scenarios in browser:
  - Disable special foods → LegendScene renders with dimmed non-Normal rows
  - Re-enable special foods → all rows return to full opacity (toggle triggers scene restart)
  - Obstacle row stays fully opaque in both states

**Checkpoint**: User Stories 1 and 2 are both independently functional.

---

## Phase 5: Polish & Cross-Cutting Concerns

**Purpose**: Verify integration, lint, and edge cases.

- [ ] T012 [P] Run `npm run lint` in the repository root — fix any lint errors introduced by the new functions or scene changes in `game.js`
- [ ] T013 Verify edge-case: clear `localStorage` in DevTools, reload — confirm toggle shows "Desabilitar Comidas Especiais" (default enabled state, SC-001 and FR-007)
- [ ] T014 Verify edge-case: set `localStorage.setItem('snakeSpecialFoodsEnabled', 'corrupt')` in console, reload — confirm toggle shows "Desabilitar Comidas Especiais" (safe default, FR-007)
- [ ] T015 Verify re-enable path (SC-005): disable → play a round (only Normal food) → return to Legenda → re-enable → start a new round — confirm special foods reappear and card sizes are no longer capped at 1
- [ ] T016 Verify `scene.restart()` does not break if LegendScene was entered with `data` from a previous scene — inspect call sites (`LegendScene` started from MenuScene ~line 1077 and GameOverScene ~line 997) and confirm no required `data` fields are lost on restart

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1 (Setup)**: No dependencies — start immediately
- **Phase 2 (Foundational)**: Depends on Phase 1 — **BLOCKS** Phases 3 and 4
- **Phase 3 (US1)**: Depends on Phase 2 — no dependency on Phase 4
- **Phase 4 (US2)**: Depends on Phase 2 — can run in parallel with Phase 3 after T009 (reads `isSpecialFoodsEnabled` already available from Phase 2)
- **Phase 5 (Polish)**: Depends on Phases 3 and 4

### User Story Dependencies

- **US1 (P1)**: Requires T002–T004 (helpers). T005 and T006 can be written in parallel (different areas of `game.js`).
- **US2 (P2)**: Requires T002 (`isSpecialFoodsEnabled`). Can be developed in parallel with US1 after Phase 2 is done.

### Within User Story 1

```
T002 → T003 → T004 (helpers verified)
                  ↓
          T005 (fetchNextCard guard)
          T006 (toggle button) ← parallel with T005
                  ↓
          T007 (size check) → T008 (browser tests)
```

### Within User Story 2

```
T004 complete (isSpecialFoodsEnabled available)
      ↓
T009 (compute specialEnabled in create())
      ↓
T010 (apply setAlpha per row) → T011 (browser tests)
```

---

## Parallel Execution Examples

| Parallel Group | Tasks | Condition |
|---------------|-------|-----------|
| Core helpers | T002, T003 | Can be written together (adjacent functions) |
| US1 core changes | T005, T006 | Different parts of `game.js` (fetchNextCard vs LegendScene); no dependency between them |
| US1 + US2 implementation | T005–T007 and T009–T010 | After Phase 2 complete; all touch different locations in `game.js` |
| Polish checks | T012, T013, T014 | After Phase 3 + 4 complete; all read-only verifications |

---

## Implementation Strategy

**MVP Scope**: Phase 1 + Phase 2 + Phase 3 (US1) = fully working toggle with persistence and food filtering in ~4 edits to `game.js`.

**Delivery order**:
1. Phase 1 — Baseline check (5 min)
2. Phase 2 — Add helpers, verify in console (10 min)
3. Phase 3 — fetchNextCard guard + toggle button (20 min) ← **MVP done after this**
4. Phase 4 — Visual dimming (15 min)
5. Phase 5 — Lint + edge-case tests (10 min)

**Total estimated edits to game.js**: 4 targeted changes (helpers block, fetchNextCard guard, toggle button, alpha dimming loop).
