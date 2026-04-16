# Data Model: Turbo Visual Effects

**Feature**: 007-turbo-visual-effects  
**Date**: 2026-04-14

---

## Runtime State Changes

No new fields added to `state` object. All additions are transient scene-level render objects.

### Existing `state` fields used (read-only access from render code)

| Field | Type | Notes |
|-------|------|-------|
| `state.rushActive` | `boolean` | Existing. Drives body tint branch in `redraw()`. |
| `state.snake[]` | `{x,y}[]` | Existing. `shrinkSnake()` splice return captured for ghost spawn. |

---

## New Methods

### `spawnGhosts(segments: {x, y}[]) : void`

Called from `shrinkSnake()` immediately after splice. Creates one Phaser Rectangle per segment and tweens it.

```
segments  — array of { x, y } grid coordinates of removed segments
```

**Visual properties per rectangle:**

| Property | Value |
|----------|-------|
| Position | `x * CELL + CELL/2`, `HUD_H + y * CELL + CELL/2` |
| Size | `CELL - 4` × `CELL - 4` (24 × 24 px) |
| Fill colour | `C_SNAKE_BODY` (0x00c853) |
| Initial alpha | `1.0` |
| Target alpha | `0.0` |
| Duration | `500` ms |
| Easing | `Phaser.Math.Easing.Sine.Out` |
| On complete | `rect.destroy()` |
| Depth | `1` (above grid/obstacles, below HUD) |

---

## Modified Methods

### `shrinkSnake(n: number) : void` (modified)

| Before | After |
|--------|-------|
| Discards splice return value | Captures splice return → passes to `spawnGhosts()` |

### `redraw() : void` (modified — snake rendering block only)

| Condition | Body colour | Body alpha | Head colour |
|-----------|-------------|-----------|-------------|
| `!state.rushActive` | `C_SNAKE_BODY` (0x00c853) | `1.0` | `C_SNAKE_HEAD` (0x00e676) |
| `state.rushActive` | `0xaa00ff` (RUSH purple) | `0.7 + 0.3 * \|sin(time.now / 160)\|` | `0xcc44ff` |

---

## Constants (no new constants required)

Existing constants reused:

| Constant | Value | Used by |
|----------|-------|---------|
| `RUSH_BOOST_DURATION` | `5000` ms | Existing — unchanged |
| `C_SNAKE_BODY` | `0x00c853` | Ghost segment colour |
| `CELL` | `28` | Ghost size and position |
| `HUD_H` | `40` | Ghost Y offset |
| `FOOD_COLORS.RUSH` | `0xaa00ff` | Reused as boost body colour |

---

## No Files Created or Deleted

All changes in `game.js`. No new files, no new localStorage keys, no new assets.
