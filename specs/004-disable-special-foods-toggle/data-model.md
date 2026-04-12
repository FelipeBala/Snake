# Data Model: Disable Special Foods Toggle

**Phase**: 1 — Design  
**Feature**: 004-disable-special-foods-toggle  
**Date**: 2026-04-12

---

## Entities

### SpecialFoodsPreference

A persisted client-side boolean preference controlling whether special food types are active in gameplay.

| Field | Type | Storage | Description |
|-------|------|---------|-------------|
| `snakeSpecialFoodsEnabled` | string `'true'` \| `'false'` | `localStorage` | Serialised boolean. Absent key or unrecognised value → treated as `true` (default). |

**Access pattern**: Read-on-demand by `isSpecialFoodsEnabled()` at card-generation time. Written once per toggle click by `setSpecialFoodsEnabled(enabled)`.

**Default**: `true` (special foods enabled). Applied when the key is null, missing, or unparseable.

**Validation rule**: Only the exact string `'false'` disables special foods; everything else (including `null`, `undefined`, `'0'`, `''`) is treated as enabled.

---

### FoodCard (existing, extended)

Represents a single card issued by the spawning system, containing 1–4 food type slots.

| Field | Type | Description |
|-------|------|-------------|
| `slots` | `string[]` | Array of `FOOD_TYPES` values. Length 1–4 normally; **length forced to 1 and content forced to STANDARD when special foods are disabled.** |

**State transition** (new branch):
```
fetchNextCard() called
  ├─ isSpecialFoodsEnabled() === false
  │    └─ return { slots: ['STANDARD'] }   // Disabled path (new)
  └─ isSpecialFoodsEnabled() === true
       └─ existing rarity + size wheel     // Enabled path (unchanged)
```

**Invariants preserved**:
- `slots.length` is always ≥ 1.
- When disabled, every element in `slots` is `FOOD_TYPES.STANDARD`.
- No mutations to `RARITY_WEIGHTS` or `CARD_SIZE_WEIGHTS` constants at runtime.

---

### LegendRow (existing, extended)

One rendered row in the LegendScene representing a food type or obstacle.

| Field | Type | Description |
|-------|------|-------------|
| `foodType` | `string` | Key from `FOOD_TYPES` (or `'OBSTACLE'`). |
| `iconGfx` | Phaser.GameObjects.Graphics | Icon rendered via `drawFoodShape()`. |
| `nameText` | Phaser.GameObjects.Text | Food name label (22 px bold). |
| `descText` | Phaser.GameObjects.Text | Effect description (18 px). |
| `alpha` | `number` | `1.0` when enabled; `0.35` when this food type is special and special foods are disabled. |

**State transition** (new visual rule):
```
LegendScene.create() called
  ├─ isSpecialFoodsEnabled() === true  → all rows alpha = 1.0
  └─ isSpecialFoodsEnabled() === false → STANDARD row alpha = 1.0
                                          all other food rows alpha = 0.35
                                          OBSTACLE row alpha = 1.0 (unaffected)
```

---

### ToggleButton (new UI element, no persistent state of its own)

A Phaser button added to LegendScene reflecting and controlling `SpecialFoodsPreference`.

| Property | Value when special foods enabled | Value when special foods disabled |
|----------|-----------------------------------|------------------------------------|
| Label text | `'Desabilitar Comidas Especiais'` | `'Habilitar Comidas Especiais'` |
| Button color | Red-ish warning (`0xe53935`) | Green-ish confirm (`0x43a047`) |
| Min size | 48 px height × full label width | 48 px height × full label width |
| On click | Calls `setSpecialFoodsEnabled(false)`, restarts scene | Calls `setSpecialFoodsEnabled(true)`, restarts scene |

---

## Helper Functions (new module-level additions to game.js)

```
isSpecialFoodsEnabled() → boolean
  Reads localStorage key 'snakeSpecialFoodsEnabled'.
  Returns true (default) on null, error, or any value other than 'false'.

setSpecialFoodsEnabled(enabled: boolean) → void
  Writes 'true' or 'false' to localStorage key 'snakeSpecialFoodsEnabled'.
  Silently ignores storage errors (privacy mode, quota exceeded).
```

---

## Validation Rules

| Rule | Description |
|------|-------------|
| Safe default | `isSpecialFoodsEnabled()` returns `true` on any exception or unexpected value. |
| No constant mutation | `RARITY_WEIGHTS` and `CARD_SIZE_WEIGHTS` are never modified at runtime. |
| Card min size | `slots.length` is always ≥ 1 in all code paths. |
| Alpha bounds | Row alpha is either `1.0` (fully opaque) or `0.35` (dimmed); never 0 (invisible). |
| Obstacle unaffected | The OBSTACLE legend row is always rendered at full opacity regardless of preference. |

---

## State Transitions Summary

```
[Page load]
     ↓
isSpecialFoodsEnabled() ─ reads localStorage ─▶ true (default) or false

[Player opens LegendScene]
     ↓
Render rows with alpha per preference
Render toggle button with label per preference

[Player clicks toggle]
     ↓
setSpecialFoodsEnabled(!current)
     ↓
this.scene.restart()   ← re-enters create(), reflects new state

[Player starts game (via Jogar button in LegendScene)]
     ↓
EventCardManager.init() → appendNewCard() → fetchNextCard()
     ↓
isSpecialFoodsEnabled() checked per card
     ↓
false → { slots: ['STANDARD'] }
true  → { slots: [rarity-picked types, 1-4 slots] }
```
