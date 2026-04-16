# Implementation Plan: Turbo Visual Effects

**Branch**: `007-turbo-visual-effects` | **Date**: 2026-04-14 | **Spec**: [spec.md](spec.md)
**Input**: Feature specification from `/specs/007-turbo-visual-effects/spec.md`

## Summary

When the snake eats Turbo (RUSH) food, two purely visual effects activate:

1. **Boosted-state body tint** — the snake body switches to a purple (RUSH-colour) palette with a sinusoidal alpha pulse for the full 5-second boost, reverting to normal green on expiry.
2. **Segment fade-out** — the 5 tail segments removed by `shrinkSnake()` are captured before deletion, spawned as temporary Phaser Rectangle game objects at their grid positions, and tweened from alpha 1 → 0 over 500 ms before being destroyed.

Both effects require zero changes to game logic — only the rendering pipeline (`redraw()`) and `shrinkSnake()` are touched.

---

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+  
**Primary Dependencies**: Phaser 4.0.0 (local `lib/phaser.min.js`) — Tweens API, Graphics API, `this.time.now`  
**Storage**: N/A (no persistence needed)  
**Testing**: Manual browser verification  
**Target Platform**: Desktop browser + mobile browser  
**Project Type**: Web game (single HTML file)  
**Performance Goals**: 60 fps — ghost segment tweens must not cause frame drops  
**Constraints**: All changes confined to `game.js`; no new files; no new dependencies  
**Scale/Scope**: Two rendering additions to one scene (`GameScene`)

---

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Browser-Native, Zero Dependencies | ✅ PASS | Phaser tweens are already in use. No new external code. |
| II. Game-Loop Integrity | ✅ PASS | Ghost rects are purely cosmetic. No game-state mutation occurs outside the tick. `shrinkSnake()` mutation still happens inside `applyFoodEffect()` → `tick()`. |
| III. Child-Friendly UX | ✅ PASS | Purple pulse and ghost fade are vivid and clear. No disturbing imagery. |
| IV. Responsive Single-File Delivery | ✅ PASS | All changes in `game.js`. Works on file:// with no build step. |
| V. Gameplay Simplicity & Clean Separation | ✅ PASS | No changes to game rules, snake length logic, or boost duration. Only rendering. |

**Gate result: ALL PASS — proceed to Phase 0.**

---

## Project Structure

### Documentation (this feature)

```text
specs/007-turbo-visual-effects/
├── plan.md       ← this file
├── research.md   ← Phase 0 output
├── data-model.md ← Phase 1 output
└── tasks.md      ← /speckit.tasks output (not created here)
```

### Source Code

```text
game.js   ← all changes (single-file project)
```

No new files. No new directories.

---

## Phase 0 — Research

### Q1: How does the render loop work — can it support per-frame ghost animation?

**Finding**: `redraw()` is called once per game tick (not every frame). Phaser's `update()` method runs every frame (~60 fps). Ghost fade needs per-frame smoothness, so ghost objects must live outside `this.gfx` (which is cleared on every tick) and be animated by Phaser independently.

**Decision**: Use `this.add.rectangle()` (Phaser GameObject) per ghost segment, placed at the grid position. Launch a Phaser tween on each rectangle tweening its `alpha` from 1 to 0 over 500 ms with `onComplete: destroy`. This uses Phaser's built-in tween system and requires no custom update loop.

**Alternatives considered**:
- A secondary `Graphics` object redrawn in `update()` — workable but more code; Phaser Tweens are simpler.
- CSS animation / DOM overlay — rejected, game uses canvas.

### Q2: How to visually signal boost state during redraw?

**Finding**: `redraw()` has direct access to `state.rushActive`. The snake body is drawn with `gfx.fillStyle(C_SNAKE_BODY, …)`. Adding a branch on `state.rushActive` to use a different color is trivial.

**Decision**: 
- Body color during rush: `0xaa00ff` (matches RUSH food color, already defined in `FOOD_COLORS`).
- Head color during rush: `0xcc44ff` (lighter purple).
- Pulsing alpha: `0.7 + 0.3 * Math.abs(Math.sin(this.time.now / 160))` applied to `fillStyle` alpha arg — gives a smooth 0.7–1.0 pulse at ~3 Hz without adding any timers.

**Alternatives considered**:
- Outline/stroke glow effect — `gfx.strokeRoundedRect` could add a purple outline, but results in visual clutter near food/obstacles.
- Separate tween on a color property — more complex; inline sine is simpler and deterministic.

### Q3: Does `shrinkSnake()` know which segments were removed?

**Finding**: Current `shrinkSnake(n)`:
```javascript
shrinkSnake(n) {
  const remove = Math.min(n, this.state.snake.length - 1);
  if (remove > 0) this.state.snake.splice(this.state.snake.length - remove, remove);
}
```
The splice return value is the removed segments array. Currently discarded.

**Decision**: Capture the return value of `splice()` and spawn ghost rectangles from it. One-line change to `shrinkSnake()` + a `spawnGhosts()` helper method.

### Q4: What size and color should ghost segments use?

**Decision**: Match the body segment style exactly — `CELL - 4` square (24×24 px), rounded 4 px corners, color `C_SNAKE_BODY` (0x00c853). This makes the player associate the ghost directly with their snake. Alpha tweens 1→0 over 500 ms using `Phaser.Math.Easing.Sine.Out` for a natural fade.

### Q5: Any concerns about concurrent ghost sets (back-to-back Turbo)?

**Finding**: Each `this.add.rectangle()` is an independent GameObject. Multiple concurrent tween sets work without issue. Phaser destroys each on tween completion. No extra bookkeeping needed.

### Q6: Ghost segments during game-over — do they need cleanup?

**Finding**: Phaser destroys all scene GameObjects when the scene stops, so ghosts that are mid-tween are cleaned up automatically. No explicit cleanup needed.

---

## Phase 1 — Design

### Data Model Changes

No new persistent state. One transient runtime addition:

| Item | Type | Location | Purpose |
|------|------|----------|---------|
| `ghostRects` | Phaser Rectangle[] (implicit, not stored) | Spawned and destroyed by tween | Visual-only fade-out of removed segments |

`state` object — no new fields required. `state.rushActive` (existing) drives the body tint.

### Ghost Spawn Helper — `spawnGhosts(segments)`

```
spawnGhosts(segments):
  for each { x, y } in segments:
    rect = this.add.rectangle(
      x * CELL + CELL/2,
      HUD_H + y * CELL + CELL/2,
      CELL - 4,
      CELL - 4,
      C_SNAKE_BODY
    )
    rect.setDepth(1)   // above grid, below HUD
    this.tweens.add({
      targets:  rect,
      alpha:    0,
      duration: 500,
      ease:     'Sine.Out',
      onComplete: () => rect.destroy()
    })
```

### Modified `shrinkSnake(n)`

```
shrinkSnake(n):
  remove = Math.min(n, state.snake.length - 1)
  if remove > 0:
    removed = state.snake.splice(state.snake.length - remove, remove)  // capture return
    this.spawnGhosts(removed)
```

### Modified Body Rendering in `redraw()`

```
if state.rushActive:
  pulse = 0.7 + 0.3 * Math.abs(Math.sin(this.time.now / 160))
  gfx.fillStyle(0xaa00ff, pulse)   // purple body, pulsing alpha
  ... draw body segments ...
  gfx.fillStyle(0xcc44ff, 1)       // lighter purple head
  ... draw head ...
else:
  gfx.fillStyle(C_SNAKE_BODY, 1)   // normal green body
  ... draw body segments ...
  gfx.fillStyle(C_SNAKE_HEAD, 1)   // normal green head
  ... draw head ...
```

### Interface Contracts

This is an internal single-file game — no external API contracts apply.

### Agent Context

No new technologies. Phaser Tweens API usage is existing pattern.

---

## Constitution Check — Post-Design

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Browser-Native, Zero Dependencies | ✅ PASS | Phaser Rectangle + Tweens already in use elsewhere. |
| II. Game-Loop Integrity | ✅ PASS | `spawnGhosts()` is called from inside `applyFoodEffect()` → `tick()`. Tween callbacks only destroy visual objects — no state mutation. |
| III. Child-Friendly UX | ✅ PASS | Purple pulse is vivid; green ghost fade is clear. |
| IV. Responsive Single-File Delivery | ✅ PASS | Changes confined to `game.js`. |
| V. Gameplay Simplicity & Clean Separation | ✅ PASS | Zero changes to game rules. |

**Final gate: ALL PASS. Ready for `/speckit.tasks`.**

