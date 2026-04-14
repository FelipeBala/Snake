# Research: Turbo Visual Effects

**Feature**: 007-turbo-visual-effects  
**Date**: 2026-04-14

---

## Q1 — Render loop architecture: can ghosts animate per frame?

**Decision**: Use `this.add.rectangle()` (Phaser GameObject) per removed segment + Phaser Tween (alpha 1→0, 500 ms, `Sine.Out`), destroyed on complete.

**Rationale**: `redraw()` clears `this.gfx` on every tick — not suitable for cross-tick animations. Phaser Rectangle objects are independent GameObjects animated by the Tween Manager each frame at 60 fps with no extra update loop code.

**Alternatives considered**:
- Secondary Graphics object redrawn in `update()` — workable but requires manual alpha tracking per segment and manual redraw geometry.
- DOM/CSS overlay — not applicable (canvas-based game).

---

## Q2 — Speed-state visual: how to signal boost on snake body?

**Decision**: In `redraw()`, branch on `state.rushActive`. During rush, body uses `0xaa00ff` (RUSH food colour, already defined) with alpha `0.7 + 0.3 * Math.abs(Math.sin(this.time.now / 160))` — a 3 Hz pulse between 0.7 and 1.0. Head uses `0xcc44ff`. On expiry, normal `C_SNAKE_BODY` / `C_SNAKE_HEAD` restore automatically.

**Rationale**: Inline sine via `this.time.now` (Phaser's monotonic scene clock) costs zero extra objects or timers, is deterministic, and produces smooth per-frame variation because `redraw()` reads `this.time.now` at call time.

**Alternatives considered**:
- `gfx.strokeRoundedRect` glow outline — adds visual noise near food items and obstacles.
- Separate Tween on a tint value — more complex wiring with no benefit over inline sine.
- HUD countdown timer — out of scope per spec.

---

## Q3 — Capturing removed segments from `shrinkSnake()`

**Decision**: `Array.prototype.splice()` returns the removed elements. Assign the return value and pass to `spawnGhosts()`. One-line change.

**Rationale**: The removed segment coordinates `{ x, y }` are exactly what is needed to position the ghost rectangles. No additional data structure required.

---

## Q4 — Ghost segment appearance

**Decision**: `CELL - 4` (24 × 24 px) Phaser Rectangle, rounded corners via Phaser's built-in stroke is not available on Rectangle — use plain Rectangle which already renders as round enough at this scale. Colour `C_SNAKE_BODY` (0x00c853). Alpha tween 1→0 over 500 ms.

**Rationale**: Matching body segment size and colour creates the strongest visual association with the snake. 500 ms is long enough to be noticed but short enough not to clutter the board.

---

## Q5 — Concurrent ghost sets (back-to-back Turbo)

**Decision**: No special handling needed. Each `this.add.rectangle()` is an independent scene object; concurrent tweens coexist without conflict.

---

## Q6 — Ghost cleanup on game-over / scene stop

**Decision**: No explicit cleanup needed. Phaser automatically destroys all scene GameObjects when the scene stops or restarts, including mid-tween rectangles. Tween `onComplete` callbacks fire or are garbage-collected safely.

---

## All NEEDS CLARIFICATION resolved — ready for Phase 1.
