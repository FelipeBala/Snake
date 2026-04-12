# Tasks: Snake Web Game

**Input**: Design documents from `specs/001-snake-web-game/`
**Prerequisites**: plan.md ✅, spec.md ✅ | research.md: N/A | data-model.md: N/A | contracts/: N/A
**Tests**: Not requested — no test tasks included.

## Format: `[ID] [P?] [Story] Description with file path`

- **[P]**: Can run in parallel (independent methods or files, no unmet dependencies)
- **[Story]**: US1=Play a Full Game Round, US2=Track Score & Personal Best, US3=Start Screen
- All source code lives at the repository root (`index.html`, `style.css`, `game.js`, `lib/`)

---

## Phase 1: Setup (Shared Infrastructure)

**Purpose**: Project shell — download dependency, wire HTML entry point, global CSS.

- [x] T001 ~~Download Phaser~~ — Phaser 4.0.0 (`lib/phaser.min.js` and `lib/phaser.js`) already present at repository root/lib/; no action needed
- [x] T002 [P] Create `index.html` — `lang="pt-BR"`, viewport meta, charset UTF-8, `<title>🐍 Snake!</title>`, `<link rel="stylesheet" href="style.css">`, `<script src="lib/phaser.min.js">`, `<script src="game.js">` (no defer — Phaser must be global before game.js runs)
- [x] T003 [P] Create `style.css` — body background `linear-gradient(135deg, #1a1a2e 0%, #16213e 50%, #0f3460 100%)`, `display:flex; align-items:center; justify-content:center; min-height:100vh; margin:0; overflow:hidden`; target `canvas` with `border-radius:12px; box-shadow:0 0 40px rgba(0,230,118,0.3); max-width:100%; display:block`

---

## Phase 2: Foundational (Blocking Prerequisites)

**Purpose**: Shared constants, direction helpers, and reusable button factory that ALL Phaser Scenes
depend on. No Scene implementation can begin until this phase is complete.

**⚠️ CRITICAL**: No user story work can begin until Phase 2 is complete.

- [x] T004 Create `game.js` and write the shared constants block at the top: `CELL=28`, `COLS=20`, `ROWS=20`, `CANVAS_W=560`, `CANVAS_H=600`, `HUD_H=40`, `TICK_BASE=150`, `TICK_MIN=80`, `TICK_STEP=5`, `SCORE_PER_SPEEDUP=5`; color palette: `C_BG=0x1a1a2e`, `C_HUD_BG=0x0f3460`, `C_GRID_A=0x16213e`, `C_GRID_B=0x1a1a2e`, `C_SNAKE_HEAD=0x00e676`, `C_SNAKE_BODY=0x00c853`, `C_FOOD=0xffeb3b` in `game.js`
- [x] T005 [P] `game.js` — write `const DIRS` object (`UP:{x:0,y:-1}`, `DOWN:{x:0,y:1}`, `LEFT:{x:-1,y:0}`, `RIGHT:{x:1,y:0}`) and `const OPPOSITES` map (`UP→DOWN`, `DOWN→UP`, `LEFT→RIGHT`, `RIGHT→LEFT`) in `game.js`
- [x] T006 [P] `game.js` — write `function makeButton(scene, cx, cy, label, bgColor, textColor='#ffffff', w=200, h=64)`: create `gfx = scene.add.graphics()`; `gfx.fillStyle(bgColor,1)`; `gfx.fillRoundedRect(cx-w/2, cy-h/2, w, h, 16)`; call `gfx.setInteractive(new Phaser.Geom.Rectangle(cx-w/2, cy-h/2, w, h), Phaser.Geom.Rectangle.Contains)` to define explicit hit area (required for Graphics objects in Phaser 4); `scene.input.setHitArea([gfx])` is not needed with this form; add `scene.add.text(cx, cy, label, {font:'bold 24px "Trebuchet MS", Arial', fill:textColor}).setOrigin(0.5)`; bind `pointerover` tween (scale 1.07), `pointerout` tween (scale 1.0), `pointerdown` tween (scale 0.93) via `scene.tweens.add`; return `{gfx, txt}` in `game.js`

**Checkpoint**: Phase 2 complete — all Scenes can now be developed (in parallel or sequentially).

---

## Phase 3: User Story 1 — Play a Full Game Round (Priority: P1) 🎯 MVP

**Goal**: A player can open the game, play a full round using arrow keys/WASD, watch the snake
grow when food is eaten, trigger game over on wall or self collision, and see the Game Over screen.

**Independent Test**: Open `index.html` via `file://`, press Space/Enter (or click Play), use arrow
keys to eat ≥ 3 food items confirming snake grows, then steer into the right wall — Game Over screen
must appear with the correct score and a "JOGAR NOVAMENTE" button.

### Implementation for User Story 1

- [x] T007 [US1] `game.js` — `class GameScene extends Phaser.Scene { constructor() { super('GameScene') } }`, implement `create(data)`: initialize `this.state = { snake:[{x:12,y:10},{x:11,y:10},{x:10,y:10}], dir:DIRS.RIGHT, nextDir:DIRS.RIGHT, food:null, score:0, personalBest:data?.personalBest??0, growing:false, tickDelay:TICK_BASE, tickRef:null }`; create `this.gfx = this.add.graphics()`; create `this.cursors = this.input.keyboard.createCursorKeys()`; create `this.wasd = this.input.keyboard.addKeys('W,A,S,D')`; call `this.spawnFood()`; set `this.state.tickRef = this.time.addEvent({delay:TICK_BASE, callback:this.tick, callbackScope:this, loop:true})` in `game.js`
- [x] T008 [US1] `game.js` — `GameScene.update()`: on each frame read `Phaser.Input.Keyboard.JustDown` for each of the 8 keys (4 arrows + 4 wasd); map to candidate direction from `DIRS`; if candidate is not `OPPOSITES[state.dir]`, set `state.nextDir = candidate` in `game.js`
- [x] T009 [US1] `game.js` — `GameScene.tick()`: `state.dir = state.nextDir`; compute `newHead={x:state.snake[0].x+state.dir.x, y:state.snake[0].y+state.dir.y}`; wall check `(newHead.x<0||newHead.x>=COLS||newHead.y<0||newHead.y>=ROWS)` → call `this.gameOver()`; self check `state.snake.some(s=>s.x===newHead.x&&s.y===newHead.y)` → call `this.gameOver()`; food check → `state.score++, state.growing=true`, call `this.spawnFood()`, `this.updateSpeed()`; if `!state.growing` call `state.snake.pop()`; `state.snake.unshift(newHead)`; **then immediately** `state.growing = false` (reset so only one extra segment is added per tick, not every tick); win check `state.snake.length===COLS*ROWS` → `this.gameWon()`; call `this.redraw()` in `game.js`
- [x] T010 [P] [US1] `game.js` — `GameScene.spawnFood()`: build array of all `{x,y}` cells with `x∈[0,COLS)` and `y∈[0,ROWS)` not occupied by any snake segment; pick one at random; store as `state.food`; call `this.redraw()` in `game.js`
- [x] T011 [P] [US1] `game.js` — `GameScene.redraw()`: `this.gfx.clear()`; draw HUD bar: `fillStyle(C_HUD_BG,1)` + `fillRect(0,0,CANVAS_W,HUD_H)`; draw grid: for each cell `(c,r)` use `fillStyle((c+r)%2===0?C_GRID_A:C_GRID_B,1)` + `fillRect(c*CELL, HUD_H+r*CELL, CELL, CELL)`; draw food: `fillStyle(C_FOOD,1)` + `fillRoundedRect(food.x*CELL+3, HUD_H+food.y*CELL+3, CELL-6, CELL-6, 6)`; draw snake body segments (skip head): `fillStyle(C_SNAKE_BODY,1)` + `fillRoundedRect(sx*CELL+2, HUD_H+sy*CELL+2, CELL-4, CELL-4, 4)`; draw head: `fillStyle(C_SNAKE_HEAD,1)` + `fillRoundedRect(head.x*CELL+1, HUD_H+head.y*CELL+1, CELL-2, CELL-2, 6)` in `game.js`
- [x] T012 [US1] `game.js` — `GameScene.updateSpeed()`: if `state.score > 0 && state.score % SCORE_PER_SPEEDUP === 0`, compute `newDelay = Math.max(TICK_MIN, state.tickDelay - TICK_STEP)`; if `newDelay !== state.tickDelay`, set `state.tickDelay = newDelay`, call `state.tickRef.remove(false)`, reassign `state.tickRef = this.time.addEvent({delay:newDelay, callback:this.tick, callbackScope:this, loop:true})` in `game.js`
- [x] T013 [US1] `game.js` — `GameScene.gameOver()`: call `state.tickRef.remove(false)`; add full-canvas semi-transparent red rect `(0,0,CANVAS_W,CANVAS_H)` via new `this.add.rectangle` at alpha 0; tween it alpha 0→0.4→0 over 700ms; after 850ms delay call `this.scene.start('GameOverScene', {score:state.score, personalBest:Math.max(state.score,state.personalBest), won:false})` in `game.js`
- [x] T014 [US1] `game.js` — `GameScene.gameWon()`: same structure as `gameOver()` but use gold tween color and pass `{score:state.score, personalBest:Math.max(state.score,state.personalBest), won:true}` to `GameOverScene` in `game.js`
- [x] T015 [US1] `game.js` — `class GameOverScene extends Phaser.Scene { constructor() { super('GameOverScene') } }`; implement `create(data)`: draw dark overlay `this.add.rectangle(CANVAS_W/2, CANVAS_H/2, CANVAS_W, CANVAS_H, 0x000000, 0.82)`; add title text: `data.won ? '🏆 VOCÊ VENCEU!' : '💥 FIM DE JOGO!'` centered at `(CANVAS_W/2, CANVAS_H*0.28)` font `bold 48px "Trebuchet MS"` color `data.won?'#ffd700':'#ff5252'`; add "Pontuação: X" text at `(CANVAS_W/2, CANVAS_H*0.45)` font `bold 32px` white; create `makeButton` play-again button `"🎮 JOGAR NOVAMENTE"` (green, 260×64px) at `(CANVAS_W/2, CANVAS_H*0.72)` → `pointerup` calls `this.scene.start('GameScene', {personalBest:data.personalBest})`; add Space+Enter shortcuts → same action in `game.js`

**Checkpoint**: US1 complete — open `index.html`, play a round, hit a wall, see Game Over. No MenuScene yet; may need to temporarily add `new Phaser.Game({..., scene:[GameScene, GameOverScene]})` at bottom of `game.js` to test independently (will be replaced in US3).

---

## Phase 4: User Story 2 — Track Score and Personal Best (Priority: P2)

**Goal**: The player sees their current score while playing, and the Game Over screen shows both
the final score and the session's personal best. A new-record celebration appears when appropriate.

**Independent Test**: Play two rounds — eat 5 food in round 1 (verify HUD shows 5), hit wall, Game
Over shows "Pontuação: 5" and "Melhor: 5". In round 2 eat 3 food, verify Game Over shows
"Pontuação: 3" and "Melhor: 5" (personal best preserved). Eat 7 food in round 3 — "🏆 Novo Recorde!" appears.

### Implementation for User Story 2

- [x] T016 [P] [US2] `game.js` — In `GameScene.create()` add HUD text objects after `this.gfx` creation: `this.scoreTxt = this.add.text(12, HUD_H/2, 'Pontos: 0', {fontFamily:'"Trebuchet MS",Arial', fontSize:'22px', fontStyle:'bold', color:'#ffffff'}).setOrigin(0, 0.5)`; `this.bestTxt = this.add.text(CANVAS_W-12, HUD_H/2, 'Melhor: 0', {fontFamily:'"Trebuchet MS",Arial', fontSize:'22px', fontStyle:'bold', color:'#ffeb3b'}).setOrigin(1, 0.5)` in `game.js`
- [x] T017 [US2] `game.js` — `GameScene.updateHUD()`: `this.scoreTxt.setText('Pontos: '+state.score)`; `this.bestTxt.setText('Melhor: '+state.personalBest)`; call `this.updateHUD()` at end of `create()` and inside `tick()` after food collision block in `game.js`
- [x] T018 [US2] `game.js` — Thread `personalBest` through all scene transitions: `GameScene.create(data)` reads `state.personalBest = data?.personalBest ?? 0` (update existing init from T007); `gameOver()` + `gameWon()` pass `personalBest: Math.max(state.score, state.personalBest)` (update calls from T013/T014); `GameOverScene` passes `{personalBest: data.personalBest}` when starting new `GameScene` (update Play Again button from T015) in `game.js`
- [x] T019 [P] [US2] `game.js` — `GameOverScene.create(data)` — add personal best section below score text: `this.add.text(CANVAS_W/2, CANVAS_H*0.54, 'Melhor: '+data.personalBest, {fontFamily:'"Trebuchet MS",Arial', fontSize:'26px', fontStyle:'bold', color:'#00e676'}).setOrigin(0.5)`; if `data.score > 0 && data.score >= data.personalBest` add `this.add.text(CANVAS_W/2, CANVAS_H*0.63, '🏆 Novo Recorde!', {fontSize:'26px', fontStyle:'bold', color:'#ffd700'}).setOrigin(0.5)` with repeating yoyo scale tween `{scale:{from:1, to:1.15}, duration:600, yoyo:true, repeat:-1}` in `game.js`

**Checkpoint**: US1 + US2 both independently functional. Score and personal best display correctly across rounds.

---

## Phase 5: User Story 3 — Start Screen & Replayability (Priority: P3)

**Goal**: A cheerful, child-friendly start screen greets the player with the game title, control
instructions, personal best (if > 0), and a prominent JOGAR button. Space/Enter also starts the game.

**Independent Test**: Open `index.html` — Start screen must appear with title, instructions, and
green JOGAR button without any clicks. Press Space → game starts. Play a round, die, press Space
on Game Over → new round starts. Die again → return to Game Over; click JOGAR NOVAMENTE → new
round; personal best must persist through all transitions.

### Implementation for User Story 3

- [x] T020 [US3] `game.js` — `class MenuScene extends Phaser.Scene { constructor() { super('MenuScene') } }`; implement `create(data)`: store `this.personalBest = data?.personalBest ?? 0`; draw full-canvas dark background rect `(0,0,CANVAS_W,CANVAS_H)` with `fillStyle(C_BG,1)`; add title `🐍 SNAKE!` centered at `(CANVAS_W/2, CANVAS_H*0.28)` font `bold 72px "Trebuchet MS"` color `#00e676`; add repeating yoyo tween on title `{scale:{from:1,to:1.06}, duration:1100, yoyo:true, repeat:-1}` in `game.js`
- [x] T021 [US3] `game.js` — `MenuScene.create()` continued: add instructions text `"Use  ↑↓←→  ou  W A S D"` centered at `(CANVAS_W/2, CANVAS_H*0.46)` font `20px "Trebuchet MS"` color `#cccccc`; add JOGAR button via `makeButton(this, CANVAS_W/2, CANVAS_H*0.60, '🎮  JOGAR', 0x00c853, '#ffffff', 220, 64)` and bind `pointerup` on the graphics object → `this.scene.start('GameScene', {personalBest:this.personalBest})` in `game.js`
- [x] T022 [P] [US3] `game.js` — `MenuScene.create()` continued: add keyboard shortcuts `this.input.keyboard.on('keydown-SPACE', ...)` and `this.input.keyboard.on('keydown-ENTER', ...)` both triggering `this.scene.start('GameScene', {personalBest:this.personalBest})` in `game.js`
- [x] T023 [P] [US3] `game.js` — `MenuScene.create()` continued: if `this.personalBest > 0` add text `"⭐ Melhor: "+this.personalBest` centered at `(CANVAS_W/2, CANVAS_H*0.75)` font `bold 22px "Trebuchet MS"` color `#ffeb3b`; `MenuScene` must receive `personalBest` from `GameOverScene` when restarting (`GameOverScene` Play Again button already handles this via T015+T018) in `game.js`
- [x] T024 [US3] `game.js` — Write final lines of `game.js`: `const config = { type: Phaser.AUTO, width: CANVAS_W, height: CANVAS_H, backgroundColor: '#1a1a2e', parent: document.body, scene: [MenuScene, GameScene, GameOverScene] }; new Phaser.Game(config);` — remove any temporary bootstrap code added during US1 checkpoint in `game.js`

**Checkpoint**: All three user stories fully functional. Full play loop: MenuScene → GameScene → GameOverScene → GameScene. Personal best persists across rounds.

---

## Phase 6: Polish & Cross-Cutting Concerns

**Purpose**: Verify responsive layout, end-to-end acceptance scenario walkthrough.

- [x] T025 [P] `style.css` — audit responsive rules: ensure `canvas` has `max-width:100%` and no parent container causes horizontal overflow at 768 px viewport; add `box-sizing:border-box` and `* { margin:0; padding:0 }` reset if missing; confirm green glow `box-shadow` is visible on the canvas in `style.css`
- [ ] T026 [P] End-to-end browser verification: open `index.html` via `file://` in Chrome and manually walk through all 11 scenarios from `plan.md` Verification Checklist — WASD, arrow keys, food growth, wall collision, self collision, personal best, new record celebration, win state (fill grid), 768px viewport; note and fix any discrepancies found in `game.js` or `style.css`

---

## Dependencies & Execution Order

### Phase Dependencies

- **Setup (Phase 1)**: No dependencies — can start immediately
- **Foundational (Phase 2)**: Depends on Phase 1 — **BLOCKS all user stories**
- **US1 (Phase 3)**: Depends on Phase 2 — no other story dependencies
- **US2 (Phase 4)**: Depends on Phase 2 — **extends US1 code** (HUD, score chain)
- **US3 (Phase 5)**: Depends on Phase 2 — **extends US1+US2** (MenuScene receives personalBest)
- **Polish (Phase 6)**: Depends on all stories complete

### User Story Dependencies

- **US1 (P1)**: Independent after Phase 2
- **US2 (P2)**: Independent after Phase 2; augments GameScene and GameOverScene created in US1
- **US3 (P3)**: Independent after Phase 2; augments the scene chain created in US1+US2

### Within US1 (Phase 3)

- T007 → T008 → T009 (sequential: setup → input → tick)
- T010, T011 [P] can be written alongside T008/T009 (separate methods, no mutual dependency)
- T012 depends on T009 (tick calls updateSpeed)
- T013, T014 depend on T009 (tick calls gameOver/gameWon)
- T015 depends on T013 (GameOverScene receives data from gameOver)

### Parallel Opportunities (per phase)

**Phase 1**: T002 ‖ T003 (index.html and style.css are independent files)

**Phase 2**: T005 ‖ T006 (DIRS object and makeButton are independent; both append to game.js after T004)

**Phase 3 / US1**: T010 ‖ T011 (spawnFood and redraw are independent methods within GameScene)

**Phase 4 / US2**: T016 ‖ T019 (HUD texts in GameScene and personal best UI in GameOverScene touch different scenes)

**Phase 5 / US3**: T022 ‖ T023 (keyboard shortcuts and personal best display are independent additions within MenuScene.create())

**Phase 6**: T025 ‖ T026 (CSS audit and full play-test are independent)

---

## Parallel Example: User Story 1

```text
# Sequential backbone:
T007 → T008 → T009 → T012 → T013 → T014 → T015

# Can start alongside T008/T009 once T007 is done:
T010 (spawnFood)    ← independent method
T011 (redraw)       ← independent method
```

## Parallel Example: User Story 2

```text
# Can run in parallel once US1 is done:
T016 (HUD text objects in GameScene.create)
T019 (personal best UI in GameOverScene.create)

# Sequential (T016 must exist before T017):
T016 → T017 → T018
```

---

## Implementation Strategy

### MVP First (User Story 1 Only)

1. Complete Phase 1: Setup (T001–T003)
2. Complete Phase 2: Foundational (T004–T006) — **CRITICAL GATE**
3. Complete Phase 3: US1 (T007–T015)
4. ✅ **STOP and VALIDATE**: open `index.html`, eat food, hit wall, verify Game Over screen
5. Game is playable — ship as MVP if desired

### Incremental Delivery

1. **Foundation** (T001–T006) → `index.html` loads Phaser, `style.css` sets dark theme
2. **US1** (T007–T015) → Core Snake game loop fully playable
3. **US2** (T016–T019) → Score tracking and personal best add motivation to replay
4. **US3** (T020–T024) → Polished start screen creates professional first impression
5. **Polish** (T025–T026) → Responsive layout verification and acceptance testing
