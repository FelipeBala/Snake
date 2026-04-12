# Research: Special Foods & Event Card Manager

**Feature**: 002-special-foods-event-manager
**Date**: 2026-04-11
**Status**: Complete — no NEEDS CLARIFICATION items remain

---

## Phaser 4.0.0 API Findings

### Custom Polygon Drawing

| Method | Available | Signature |
|--------|-----------|-----------|
| `gfx.fillTriangle(x0,y0,x1,y1,x2,y2)` | ✅ | Fill 3-point triangle |
| `gfx.fillPoints(points, closeShape, closePath)` | ✅ | Fill polygon from `Phaser.Math.Vector2[]` |
| `gfx.strokePoints(points, closeShape, closePath)` | ✅ | Stroke polygon — same signature |
| `gfx.fillCircle(x, y, radius)` | ✅ | Filled circle |
| `gfx.strokeLineShape(line)` | ✅ | Draw a Phaser.Geom.Line |

**Decision**: Use `fillPoints` with computed vertices for diamond (4-pt) and 5-point star (10-pt alternating inner/outer radii). Use `fillTriangle` for the RUSH lightning shape. Use `fillCircle` + `strokeLineShape` for BOMB.

### Tween on Graphics Objects

`this.tweens.add({ targets: graphicsObj, alpha: {from:1, to:0.2}, duration:400, yoyo:true, repeat:-1 })` works correctly on `Phaser.GameObjects.Graphics`. FOOD-STAR blink uses this pattern.

### Timer Cancellation Safety

`timerEvent.remove(false)` marks for removal but may dispatch once more on the current frame. **Mitigation**: use a integer generation counter on state (`state.tickGen`). Each timer callback validates its captured gen matches `state.tickGen`; if not, it is a stale timer and returns immediately without modifying state.

### `delayedCall` for FOOD-RUSH countdown

`this.time.delayedCall(5000, callback)` returns a `Phaser.Time.TimerEvent`. Cancelable via `.remove(true)` (suppresses callback) or `.remove(false)` (fires once). Store in `state.rushTimerRef` and cancel on FOOD-RUSH re-eat (reset) and on `gameOver` / `gameWon`.

### Random Integer

`Phaser.Math.Between(min, max)` is available. Use `Math.floor(Math.random() * arr.length)` for array picks (already used in codebase).

---

## Architecture Decisions

### Decision 1: Single `state.foods[]` replaces `state.food`

- **What**: Replace `state.food: {x,y}` with `state.foods: FoodItem[]`  
- **Rationale**: Multiple foods are simultaneously on the map per event card (up to 4). A single reference cannot represent this.  
- **Alternative**: Kept `state.food` for STANDARD and added a separate `state.specialFoods[]`. Rejected — two arrays create inconsistent collision logic.

### Decision 2: `state.growthRemaining` replaces boolean `growing` flag

- **What**: Integer counter. Each tick, if `growthRemaining > 0`: skip `snake.pop()` AND decrement. Else pop.  
- **Rationale**: FOOD-DOUBLE (+2), FOOD-PENTA (+5) require multi-segment growth over consecutive ticks. A boolean can only represent +1.  
- **Alternative**: Immediately splice N segments onto the snake tail. Rejected — violates Constitution II (state must change in single tick increments via the game loop, not bulk mutations).

### Decision 3: `CARD_STRIP_H = 32` appended below grid

- **What**: `CANVAS_H` increases from 600 → 632. A 32px strip at `y=600` shows current card's remaining food icons. HUD_H (top, 40px) and all grid offsets are unchanged.  
- **Rationale**: Minimizes diff to existing rendering code. Existing `gfx.fillRect` grid loops reference `HUD_H` — none of those constants change.  
- **Alternative**: Extend HUD to 80px, push grid down. Rejected — changes all grid Y coordinate math.

### Decision 4: `state.baseDelay` + `state.tickDelay` separation

- **What**: `baseDelay` = score-adjusted authoritative speed. `tickDelay` = currently running timer delay (may differ during FOOD-RUSH boost). Score-speedup always updates `baseDelay`; if RUSH active, it does not recreate the tick timer (keeps the boosted speed). On RUSH expiry, restores `baseDelay`.  
- **Rationale**: Matches spec clarification: players keep earned speed progress through the boost.

### Decision 5: `fetchNextCard(telemetry)` — top-level function

- **What**: A standalone function at the top of `game.js` (before any class). The `EventCardManager` calls it and passes the current telemetry history. No gameplay code calls it directly.  
- **Rationale**: Swapping this one function for a `fetch()`-based server call is the only change needed per FR-017.

### Decision 6: FOOD-STAR timer generation counter

- **What**: Each food item in `state.foods` gets a `gen` integer (same as `state.tickGen` at creation time). The star movement callback checks `food.gen === state.tickGen` before moving. Star timers are also stored on the food object as `food.starTimer`.  
- **Rationale**: Prevents stale star timers from firing after card transition or game-over.

---

## Rarity Weight Table (confirmed from spec assumptions)

| Food Type | Weight | % of slots |
|-----------|--------|-----------|
| STANDARD  | 70     | 70%        |
| DOUBLE    | 12     | 12%        |
| TRIM      | 7      | 7%         |
| RUSH      | 6      | 6%         |
| STAR      | 3      | 3%         |
| PENTA     | 1      | 1%         |
| BOMB      | 1      | 1%         |
| **Total** | **100**| **100%**  |

**Card size distribution** (favoring single-food cards):
| Foods per card | Weight |
|----------------|--------|
| 1 | 70% |
| 2 | 18% |
| 3 | 9%  |
| 4 | 3%  |

**Constraint**: Maximum 1 PENTA or BOMB per card regardless of random roll outcome.

---

## Visual Identity Table

| Type | Hex Color | Shape | Notes |
|------|-----------|-------|-------|
| STANDARD | `0xffeb3b` |\u2591 Rounded square | Existing |
| DOUBLE | `0x00bcd4` | \u25c6 Diamond (4-pt polygon) | Teal |
| PENTA | `0xffc400` | \u2605 5-point star (10-pt polygon) | Gold |
| TRIM | `0xff6d00` | \u2b1c Wide flat pill (fillRoundedRect w>h) | Orange |
| RUSH | `0xaa00ff` | \u25b2 Up-pointing triangle (fillTriangle) | Purple |
| STAR | `0xffffff` | \u2726 4-point star + alpha tween | White blinking |
| BOMB | `0xb71c1c` | \u25cf Circle + X lines | Dark red |
| OBSTACLE | `0x455a64` | \u25a0 Square + X lines (strokePoints) | Dark slate |
