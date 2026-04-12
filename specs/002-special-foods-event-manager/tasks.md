# Tasks: Special Foods & Event Card Manager

**Input**: Design documents from `specs/002-special-foods-event-manager/`
**Prerequisites**: plan.md ✅, spec.md ✅, research.md ✅, data-model.md ✅
**Tests**: Not requested — no test tasks included.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (independent methods or files, no unmet dependencies)
- **[Story]**: US1=Special Foods, US2=Event Card Manager, US3=Telemetry Architecture
- All changes live in a single file: `game.js`

---

## Phase 1: Setup (Foundational Constants & Drawing Utilities)

**Purpose**: Add all new constants and standalone drawing helpers to `game.js`. These block every user story — no scene code can be written until this phase is complete.

**⚠️ CRITICAL**: All subsequent phases depend on Phase 1 being complete.

- [x] T001 `game.js` — Add new constants after existing color palette: `CARD_STRIP_H = 32`; change the `CANVAS_H` line to `const CANVAS_H = HUD_H + ROWS * CELL + CARD_STRIP_H` (40+560+32=632); add `RUSH_BOOST_DURATION = 5000`, `RUSH_SPEED_FACTOR = 1.5`, `STAR_SPEED_FACTOR = 2` in `game.js`

- [x] T002 [P] `game.js` — Add `const FOOD_TYPES = { STANDARD:'STANDARD', DOUBLE:'DOUBLE', PENTA:'PENTA', TRIM:'TRIM', RUSH:'RUSH', STAR:'STAR', BOMB:'BOMB' }` and `const FOOD_COLORS = { STANDARD:0xffeb3b, DOUBLE:0x00bcd4, PENTA:0xffc400, TRIM:0xff6d00, RUSH:0xaa00ff, STAR:0xffffff, BOMB:0xb71c1c }` and `const C_OBSTACLE = 0x455a64` in `game.js`

- [x] T003 [P] `game.js` — Add `const RARITY_WEIGHTS = { STANDARD:70, DOUBLE:12, TRIM:7, RUSH:6, STAR:3, PENTA:1, BOMB:1 }` and `const CARD_SIZE_WEIGHTS = [{size:1,w:70},{size:2,w:18},{size:3,w:9},{size:4,w:3}]` in `game.js`

- [x] T004 `game.js` — Write `function drawFoodShape(gfx, food, cx, cy)`: switch on `food.type`; STANDARD → `gfx.fillStyle(FOOD_COLORS.STANDARD,1); gfx.fillRoundedRect(cx-11,cy-11,22,22,5)`; DOUBLE → 4-point diamond via `gfx.fillPoints([{x:cx,y:cy-12},{x:cx+12,y:cy},{x:cx,y:cy+12},{x:cx-12,y:cy}],true,true)`; PENTA → 10-pt alternating-radius star (`r_outer=12, r_inner=5.5`, 5 spokes × 2 verts each via `fillPoints`); TRIM → `gfx.fillRoundedRect(cx-12,cy-5,24,10,5)`; RUSH → `gfx.fillTriangle(cx,cy-12, cx+10,cy+8, cx-10,cy+8)`; STAR → 4-pt star (8 verts, `r_outer=11, r_inner=5`); BOMB → `gfx.fillCircle(cx,cy,10)` + two crosshair lines via `gfx.lineBetween`; always call `gfx.fillStyle(FOOD_COLORS[food.type],1)` before drawing in `game.js`

- [x] T005 [P] `game.js` — Write `function drawObstacle(gfx, obs)`: `const cx=obs.x*CELL+CELL/2, cy=HUD_H+obs.y*CELL+CELL/2`; `gfx.fillStyle(C_OBSTACLE,1); gfx.fillRect(obs.x*CELL, HUD_H+obs.y*CELL, CELL, CELL)`; `gfx.lineStyle(2,0x263238,1); gfx.lineBetween(obs.x*CELL+4, HUD_H+obs.y*CELL+4, obs.x*CELL+CELL-4, HUD_H+obs.y*CELL+CELL-4); gfx.lineBetween(obs.x*CELL+CELL-4, HUD_H+obs.y*CELL+4, obs.x*CELL+4, HUD_H+obs.y*CELL+CELL-4)` in `game.js`

**Checkpoint**: Phase 1 complete. All constants and rendering helpers are available.

---

## Phase 2: Foundational (Card Generation & EventCardManager)

**Purpose**: `fetchNextCard` and `EventCardManager` are needed by GameScene before any special food logic can run. Must complete before Phase 3+.

**⚠️ CRITICAL**: GameScene refactor (Phase 4) cannot begin until `EventCardManager` is defined.

- [x] T006 `game.js` — Write `function fetchNextCard(telemetry)` — the sole server-integration seam; place it at the top of `game.js` before any class definition: (1) pick card size via `CARD_SIZE_WEIGHTS` cumulative wheel; (2) for each slot pick type via `RARITY_WEIGHTS` cumulative wheel using `Math.random()`; (3) enforce max-1-PENTA and max-1-BOMB per card: if a second one is drawn, reroll that slot until a non-PENTA/non-BOMB type is selected; (4) return `{ slots }` in `game.js`

- [x] T007 `game.js` — Write `class EventCardManager`: `constructor(scene)` stores `this.scene=scene; this.queue=[]; this.activeCard=null; this.telemetry=[]` in `game.js`

- [x] T008 `game.js` — `EventCardManager.getFreeCells()`: return all `{x,y}` with `x∈[0,COLS)` and `y∈[0,ROWS)` not occupied by any `scene.state.snake` segment, any `scene.state.obstacles` cell, or any existing `scene.state.foods` item in `game.js`

- [x] T009 [P] `game.js` — `EventCardManager.recordTelemetry()`: push `{ cardSlots:[...this.activeCard.slots], timeToConsume:parseFloat(((Date.now()-this.activeCard.drawnAt)/1000).toFixed(2)), snakeLength:this.scene.state.snake.length, score:this.scene.state.score }` to `this.telemetry`; if `this.telemetry.length > 10` call `this.telemetry.shift()` in `game.js`

- [x] T010 [P] `game.js` — `EventCardManager.appendNewCard()`: call `fetchNextCard(this.telemetry)`, push result to `this.queue` in `game.js`

- [x] T011 `game.js` — `EventCardManager.activateCard()`: `const cardDef = this.queue.shift()`; call `this.getFreeCells()` into `free`; for each slot in `cardDef.slots`: if `free.length > 0` pick a random cell with `Phaser.Math.Between(0, free.length-1)`, create `{ type:slot, x, y, starDir:null, starTimer:null, gen:0 }`, push to `this.scene.state.foods`, remove that cell from `free`; if type === STAR call `this.scene.createStarTimer(food)`; set `this.activeCard = { slots:[...cardDef.slots], remaining:(foods placed count), drawnAt:Date.now() }`; call `this.appendNewCard()`; call `this.scene.updateCardStrip()`; call `this.scene.redraw()` in `game.js`

- [x] T012 `game.js` — `EventCardManager.onFoodConsumed(food)`: `this.activeCard.remaining--`; call `this.scene.updateCardStrip()`; if `this.activeCard.remaining <= 0`: call `this.recordTelemetry()` then call `this.activateCard()` in `game.js`

- [x] T013 [P] `game.js` — `EventCardManager.init()`: fill queue with 10 cards by calling `this.appendNewCard()` 10 times; then call `this.activateCard()` in `game.js`

- [x] T014 [P] `game.js` — `EventCardManager.destroy()`: for each food in `this.scene.state.foods`: if `food.starTimer` exists call `food.starTimer.remove(true)`; set `food.starTimer = null`; set `this.activeCard = null` in `game.js`

**Checkpoint**: Phase 2 complete. `fetchNextCard` and `EventCardManager` are fully defined and self-consistent.

---

## Phase 3: User Story 1 — Special Food Effects (Priority: P1) 🎯 MVP

**Goal**: When the snake eats any of the 7 food types, the correct game effect fires. This is the minimum viable feature increment.

**Independent Test**: Temporarily hardcode a card with one of each food type in `fetchNextCard` during testing. Eat DOUBLE → +2 growth, +2 score; PENTA → +5 growth, +5 score; TRIM → −5 segments (min 1), score unchanged; RUSH → −5 segments, game noticeably faster for 5 s; STAR → +10 score, no growth; BOMB → last 5 segments turn into dark obstacle tiles, +10 score.

### Implementation for User Story 1

- [x] T015 [US1] `game.js` — Write helper `GameScene.restartTick(delay)`: `this.state.tickGen++`; if `this.state.tickRef` call `this.state.tickRef.remove(false)`; `this.state.tickDelay = delay`; `this.state.tickRef = this.time.addEvent({ delay, callback:this.tick, callbackScope:this, loop:true })` in `game.js`

- [x] T016 [US1] `game.js` — Write `GameScene.growSnake(n)`: `this.state.growthRemaining += n` in `game.js`

- [x] T017 [US1] `game.js` — Write `GameScene.shrinkSnake(n)`: `const remove = Math.min(n, this.state.snake.length - 1)`; call `this.state.snake.splice(this.state.snake.length - remove, remove)` in `game.js`

- [x] T018 [US1] `game.js` — Write `GameScene.bombEffect()`: `const remove = Math.min(5, this.state.snake.length - 1)`; `const tail = this.state.snake.splice(this.state.snake.length - remove, remove)`; for each segment in tail push `{ x:seg.x, y:seg.y }` to `this.state.obstacles`; call `this.state.score += 10`; call `this.updateHUD()` in `game.js`

- [x] T019 [US1] `game.js` — Write `GameScene.rushExpired()`: `this.state.rushActive = false`; `this.state.rushTimerRef = null`; call `this.restartTick(this.state.baseDelay)` in `game.js`

- [x] T020 [US1] `game.js` — Write `GameScene.activateRush()`: `const boosted = Math.max(TICK_MIN, Math.floor(this.state.baseDelay / RUSH_SPEED_FACTOR))`; call `this.restartTick(boosted)`; if `this.state.rushTimerRef` call `this.state.rushTimerRef.remove(true)`; `this.state.rushActive = true`; `this.state.rushTimerRef = this.time.delayedCall(RUSH_BOOST_DURATION, this.rushExpired, [], this)` in `game.js`

- [x] T021 [US1] `game.js` — Write `GameScene.applyFoodEffect(food)`: switch on `food.type`: STANDARD → `this.state.growthRemaining++; this.state.score++`; DOUBLE → `this.growSnake(2); this.state.score += 2`; PENTA → `this.growSnake(5); this.state.score += 5`; TRIM → `this.shrinkSnake(5)`; RUSH → `this.shrinkSnake(5); this.activateRush()`; STAR → `this.state.score += 10`; BOMB → `this.bombEffect()`; call `this.updateHUD()` after each in `game.js`

**Checkpoint**: US1 complete. All 7 food effects fire correctly. FOOD-STAR movement covered in next phase.

---

## Phase 4: User Story 1 (continued) — FOOD-STAR Movement (Priority: P1)

**Goal**: FOOD-STAR moves directionally across the grid autonomously at half the snake's tick rate.

**Independent Test**: Place a card containing only FOOD-STAR and watch it move across the grid cell by cell, changing direction when it hits a wall, snake body, or obstacle. Intercept it — score +10, no body growth. Let it reach a corner with all adjacent cells blocked — it teleports to a random empty cell.

### Implementation for User Story 1 (STAR sub-system)

- [x] T022 [US1] `game.js` — Write `GameScene.cancelAllStarTimers()`: for each food in `this.state.foods`: if `food.starTimer` call `food.starTimer.remove(true)` and set `food.starTimer = null` in `game.js`

- [x] T023 [US1] `game.js` — Write `GameScene.moveStar(food, capturedGen)`: if `capturedGen !== this.state.tickGen` return immediately (stale gen-guard); build candidate directions array `[food.starDir, ...Object.values(DIRS).filter(d => d !== food.starDir)]`; for each candidate: compute `nx = food.x + dir.x, ny = food.y + dir.y`; if within bounds AND not a snake cell AND not an obstacle AND not another food cell: set `food.starDir = dir; food.x = nx; food.y = ny`; call `this.redraw()`; return; if all 4 blocked: pick random cell from `this.cardManager.getFreeCells()`; if found: `food.x = cell.x; food.y = cell.y`; call `this.redraw()` in `game.js`

- [x] T024 [US1] `game.js` — Write `GameScene.createStarTimer(food)`: `food.gen = this.state.tickGen`; pick random initial direction with `const dirs = Object.values(DIRS); food.starDir = dirs[Math.floor(Math.random() * dirs.length)]`; `food.starTimer = this.time.addEvent({ delay: this.state.baseDelay * STAR_SPEED_FACTOR, callback: () => this.moveStar(food, food.gen), loop: true })` in `game.js`

**Checkpoint (US1 full)**: All 7 food types + FOOD-STAR movement complete. Playable MVP increment.

---

## Phase 5: User Story 2 — Event Card Manager Integration (Priority: P2)

**Goal**: Replace standalone food spawn with the card manager. All foods come from event cards. Multiple foods can be on the map simultaneously. Card strip shows remaining foods.

**Independent Test**: Play for 10 full card cycles. Verify: all foods in a card appear simultaneously; new foods don't appear until every food in the current card is consumed; card strip icons update correctly; rare foods appear less often; after 50+ cards FOOD-PENTA and FOOD-BOMB each appear in fewer than 15% of cards.

### Implementation for User Story 2

- [x] T025 [US2] `game.js` — Update `GameScene.create(data)`: replace `food: null, growing: false, tickDelay: TICK_BASE, tickRef: null` fields in `this.state` with `foods: [], obstacles: [], growthRemaining: 0, baseDelay: TICK_BASE, tickDelay: TICK_BASE, tickRef: null, tickGen: 0, rushActive: false, rushTimerRef: null`; remove the `this.spawnFood()` call; add after gfx creation: `this.cardStripGfx = this.add.graphics()`; `this.cardStripTexts = []`; add `this.cardManager = new EventCardManager(this)`; call `this.cardManager.init()` (this places first card's foods and calls redraw internally) in `game.js`

- [x] T026 [US2] `game.js` — Update `GameScene.tick()`: (a) add obstacle collision check after wall check: `if (state.obstacles.some(o => o.x === newHead.x && o.y === newHead.y)) { this.gameOver(); return; }`; (b) replace the single `food` collision block with a `state.foods` loop: `for (let i = state.foods.length - 1; i >= 0; i--) { const f = state.foods[i]; if (f.x === newHead.x && f.y === newHead.y) { if (f.starTimer) f.starTimer.remove(true); state.foods.splice(i, 1); this.applyFoodEffect(f); this.cardManager.onFoodConsumed(f); break; } }`; (c) replace `if (!state.growing) state.snake.pop()` / `state.growing = false` with `if (state.growthRemaining > 0) { state.growthRemaining--; } else { state.snake.pop(); }` in `game.js`

- [x] T027 [US2] `game.js` — Update `GameScene.updateSpeed()`: replace `state.tickDelay - TICK_STEP` pattern with `const newBase = Math.max(TICK_MIN, state.baseDelay - TICK_STEP)`; set `state.baseDelay = newBase`; only call `this.restartTick(newBase)` when `!state.rushActive`; after restartTick (or in all paths), for each STAR food in `state.foods`: `food.gen = state.tickGen` (update gen so moveStar callbacks stay valid) in `game.js`

- [x] T028 [US2] `game.js` — Write `GameScene.updateCardStrip()`: `this.cardStripGfx.clear()`; destroy all `this.cardStripTexts` and reset to `[]`; draw strip background `fillStyle(C_HUD_BG,1); fillRect(0, HUD_H+ROWS*CELL, CANVAS_W, CARD_STRIP_H)`; if `!this.cardManager.activeCard` return; count remaining slots by type using a Map; render each: starting at `x=8`, for each type+count: draw a 12×12 mini food square/icon using `fillStyle(FOOD_COLORS[type],1)` + `fillRect`; add a Phaser Text `"×N"` at `(x+14, HUD_H+ROWS*CELL+10)` font `"14px Arial" color '#ffffff'`; push each text to `this.cardStripTexts`; advance `x += 42` in `game.js`

- [x] T029 [US2] `game.js` — Update `GameScene.gameOver()`: before the existing `state.tickRef.remove(false)` line, add: `this.cancelAllStarTimers()`; `if (state.rushTimerRef) { state.rushTimerRef.remove(true); state.rushTimerRef = null; }`; `if (this.cardManager) { this.cardManager.destroy(); this.cardManager = null; }`; `this.cardStripTexts.forEach(t => t.destroy()); this.cardStripTexts = []`; `this.cardStripGfx.clear()` in `game.js`

- [x] T030 [P] [US2] `game.js` — Update `GameScene.gameWon()`: apply identical cleanup as T029 (cancelAllStarTimers, rushTimerRef, cardManager.destroy, cardStripTexts cleanup) before the existing flash tween in `game.js`

**Checkpoint**: US2 complete. Full event card loop working. Card strip visible and updates correctly.

---

## Phase 6: User Story 3 — Telemetry Architecture (Priority: P3)

**Goal**: Telemetry history is populated after each consumed card. `fetchNextCard(telemetry)` is already in place — this phase verifies the data flows correctly.

**Independent Test**: Open browser DevTools. Play 10+ cards to completion. Type `game.scene.getScene('GameScene').cardManager.telemetry` in the console — should return an array of ≤ 10 objects each with `cardSlots`, `timeToConsume`, `snakeLength`, and `score`. Verify oldest records drop off after 10 entries.

### Implementation for User Story 3

- [x] T031 [US3] `game.js` — Add a `window.debugTelemetry` accessor for easy DevTools inspection: after `new Phaser.Game(config)`, add `game.events.on('ready', () => { window.debugCardManager = () => { const gs = game.scene.getScene('GameScene'); return gs && gs.cardManager ? { telemetry: gs.cardManager.telemetry, queue: gs.cardManager.queue.length, activeCard: gs.cardManager.activeCard } : null; }; })` where `game` is the result of `new Phaser.Game(config)` stored in a `const game` variable in `game.js`

**Checkpoint**: US3 complete. Telemetry inspectable via `window.debugCardManager()` in the browser console.

---

## Phase 7: Rendering Update (Depends on Phase 1 + Phase 5)

**Purpose**: Update `redraw()` to use the new multi-food and obstacle drawing systems.

- [x] T032 `game.js` — Update `GameScene.redraw()`: (a) remove the old single-food draw block (`if (state.food) { ... }`); (b) add after grid drawing: `state.obstacles.forEach(obs => drawObstacle(this.gfx, obs))`; (c) add: `state.foods.forEach(food => { const cx = food.x*CELL + CELL/2; const cy = HUD_H + food.y*CELL + CELL/2; drawFoodShape(this.gfx, food, cx, cy); })` in `game.js`

---

## Phase 8: Polish & Cleanup

- [x] T033 [P] `game.js` — Remove the now-dead `GameScene.spawnFood()` method (was responsible for single-food spawning; replaced by `EventCardManager.activateCard()`); verify no other code references it in `game.js`

- [x] T034 [P] `game.js` — Validate FOOD-STAR blink tween: in `GameScene.createStarTimer(food)`, after creating the food, add: `food.blinkTween = this.tweens.add({ targets: this.gfx, alpha: { from:1, to:1 }, duration:1 })` — STAR uses its own approach; instead add a self-contained alpha tween on a dedicated Graphics object for the star icon: since `gfx` is a shared canvas, implement STAR blinking by toggling `food.visible = !food.visible` each STAR timer tick and conditionally drawing it in `drawFoodShape` (skip draw if `food.visible === false`) in `game.js`

- [x] T035 [P] End-to-end browser verification: open `index.html` via `file://` in Chrome and walk through all 14 verification scenarios from `plan.md`; confirm canvas is 560×632; card strip updates; all 7 food types are visually distinct; obstacle tiles block the snake; FOOD-RUSH boosts speed then restores; `window.debugCardManager()` shows correct telemetry; fix any rendering or logic discrepancies found in `game.js`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Phase 1** (Setup): No dependencies — start immediately
- **Phase 2** (Card Generation): Depends on Phase 1 — **BLOCKS Phase 5**
- **Phase 3** (US1 Food Effects): Depends on Phase 1 — independent of Phase 2
- **Phase 4** (US1 STAR Movement): Depends on Phase 3 — cannot precede T022–T024
- **Phase 5** (US2 Integration): Depends on Phase 1 + Phase 2 + Phase 3 — core wiring
- **Phase 6** (US3 Telemetry): Depends on Phase 5 — verifies existing flow
- **Phase 7** (Rendering): Depends on Phase 1 + Phase 5
- **Phase 8** (Polish): Depends on all above

### User Story Dependencies

- **US1 (P1)**: Phases 1, 3, 4 in sequence
- **US2 (P2)**: Phases 1, 2, 5, 7 — augments US1 once effects are defined
- **US3 (P3)**: Phase 5 must complete; US3 = T031 only

### Within US1 (Phases 3 + 4)

- T015 `restartTick` → required by T019 + T020 (RUSH)
- T016 `growSnake` ‖ T017 `shrinkSnake` ‖ T018 `bombEffect` [P] — all independent methods
- T021 `applyFoodEffect` depends on T016 + T017 + T018 + T019 + T020
- T022 `cancelAllStarTimers` ‖ T023 `moveStar` ‖ T024 `createStarTimer` [P] — within Phase 4

### Parallel Opportunities

**Phase 1**: T002 ‖ T003 (FOOD_TYPES/FOOD_COLORS and weights are independent constant blocks); T004 ‖ T005 (drawFoodShape and drawObstacle after T001–T003)

**Phase 2**: T009 ‖ T010 ‖ T013 ‖ T014 [P] — all EventCardManager methods after T007+T008

**Phase 3**: T016 ‖ T017 ‖ T018 [P] — growSnake, shrinkSnake, bombEffect are independent

**Phase 4**: T022 ‖ T023 ‖ T024 [P] — all STAR sub-methods are independent of each other

**Phase 5**: T029 ‖ T030 [P] — gameOver and gameWon cleanup are symmetric and independent

---

## Parallel Execution Examples

### User Story 1 (Phases 3 + 4)

```text
Sequential backbone:
T015 (restartTick) → T019 (rushExpired) → T020 (activateRush) → T021 (applyFoodEffect)

Parallel alongside T015:
T016 (growSnake)         ← independent helper
T017 (shrinkSnake)       ← independent helper
T018 (bombEffect)        ← independent helper

Phase 4 (after T021):
T022 ‖ T023 ‖ T024       ← all STAR methods, independent of each other
```

### User Story 2 (Phase 5)

```text
Sequential backbone:
T025 (create refactor) → T026 (tick refactor) → T027 (updateSpeed) → T032 (redraw)

Parallel where possible:
T028 (updateCardStrip)   ← separate method, can be written alongside T026
T029 ‖ T030              ← gameOver / gameWon symmetric cleanup
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Constants + drawing helpers (T001–T005)
2. Complete Phase 2: fetchNextCard + EventCardManager (T006–T014) — needed even for US1 testing
3. Complete Phase 3: Food effects (T015–T021)
4. Complete Phase 4: FOOD-STAR movement (T022–T024)
5. Partial Phase 5: T025 + T026 + T032 (minimum wiring to run the game)
6. ✅ **STOP and VALIDATE**: open `index.html`, eat all food types, verify effects fire correctly

### Incremental Delivery

1. **Foundation** (T001–T005) → Constants + drawing available
2. **Card Engine** (T006–T014) → fetchNextCard and EventCardManager defined
3. **US1** (T015–T024) → All 7 food effects + STAR movement
4. **US2** (T025–T032) → Full card loop wired into GameScene; card strip visible
5. **US3** (T031) → Telemetry inspectable in console
6. **Polish** (T033–T035) → Remove dead code, STAR blink, end-to-end walkthrough
