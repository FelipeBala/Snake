# Data Model: Special Foods & Event Card Manager

**Feature**: 002-special-foods-event-manager
**Date**: 2026-04-11

---

## Entities

### FoodItem

A food instance currently placed on the grid.

| Field | Type | Description |
|-------|------|-------------|
| `type` | `string` (FOOD_TYPES enum) | One of: STANDARD, DOUBLE, PENTA, TRIM, RUSH, STAR, BOMB |
| `x` | `number` | Grid column (0–COLS-1) |
| `y` | `number` | Grid row (0–ROWS-1) |
| `starDir` | `object \| null` | Direction `{x,y}` for STAR movement; null for all other types |
| `starTimer` | `TimerEvent \| null` | Phaser timer driving STAR movement; null for all other types |
| `gen` | `number` | Generation counter snapshot at creation; used to detect stale timers |

**State location**: `state.foods: FoodItem[]` (replaces `state.food`)

---

### EventCardDefinition

A card in the queue — defines what to spawn (not yet placed on grid).

| Field | Type | Description |
|-------|------|-------------|
| `slots` | `string[]` | Array of food type strings, length 1–4 |

---

### ActiveCard

The currently active card (foods already placed on grid).

| Field | Type | Description |
|-------|------|-------------|
| `slots` | `string[]` | Original food types from the definition |
| `remaining` | `number` | Count of foods not yet consumed |
| `drawnAt` | `number` | `Date.now()` timestamp when card was activated |

**State location**: `cardManager.activeCard`

---

### TelemetryRecord

One entry per consumed card, kept in a rolling window of 10.

| Field | Type | Description |
|-------|------|-------------|
| `cardSlots` | `string[]` | Copy of `activeCard.slots` |
| `timeToConsume` | `number` | Seconds from `drawnAt` to last food consumed |
| `snakeLength` | `number` | `state.snake.length` at moment of last consumption |
| `score` | `number` | `state.score` at moment of last consumption |

**State location**: `cardManager.telemetry: TelemetryRecord[]` (max length 10)

---

### Obstacle

A permanent blocked cell created by FOOD-BOMB.

| Field | Type | Description |
|-------|------|-------------|
| `x` | `number` | Grid column |
| `y` | `number` | Grid row |

**State location**: `state.obstacles: Obstacle[]`
**Lifecycle**: Created when FOOD-BOMB is consumed. Cleared when a new round starts (fresh `create(data)` call).

---

## State Schema (GameScene)

Full updated `this.state` object for GameScene:

```js
this.state = {
  // Snake
  snake:            [{x, y}, ...],   // head at index 0
  dir:              DIRS.RIGHT,
  nextDir:          DIRS.RIGHT,
  growthRemaining:  0,               // segments still to add (replaces boolean 'growing')

  // Foods
  foods:            [],              // FoodItem[] — replaces single state.food

  // Obstacles
  obstacles:        [],              // Obstacle[] — cells from FOOD-BOMB

  // Score
  score:            0,
  personalBest:     0,

  // Tick timing
  baseDelay:        TICK_BASE,       // score-adjusted authoritative delay
  tickDelay:        TICK_BASE,       // currently running delay (may differ during RUSH boost)
  tickRef:          null,            // Phaser.Time.TimerEvent — main game loop
  tickGen:          0,               // generation counter; increment on every tick restart

  // FOOD-RUSH boost
  rushActive:       false,
  rushTimerRef:     null,            // Phaser.Time.TimerEvent — 5-second countdown
}
```

---

## EventCardManager (class)

Attached to `GameScene` as `this.cardManager`.

| Member | Type | Description |
|--------|------|-------------|
| `scene` | `GameScene` | Back-reference for accessing state and Phaser APIs |
| `queue` | `EventCardDefinition[]` | 10 pending cards not yet active |
| `activeCard` | `ActiveCard \| null` | Card currently being consumed |
| `telemetry` | `TelemetryRecord[]` | Rolling window, max 10 |

**Method summary:**

| Method | Description |
|--------|-------------|
| `init()` | Pre-fill queue with 10 cards via `fetchNextCard`; activate first card |
| `activateCard()` | Pop front of queue; place foods on free cells; set `activeCard`; call `scene.redraw()` |
| `onFoodConsumed(food)` | Decrement remaining; if 0 → `recordTelemetry()` → `appendNewCard()` → `activateCard()` |
| `recordTelemetry()` | Push TelemetryRecord; shift oldest if history length > 10 |
| `appendNewCard()` | Call `fetchNextCard(this.telemetry)`, push result to `queue` |
| `getFreeCells()` | All grid cells not occupied by snake segments, obstacles, or current foods |
| `destroy()` | Cancel all pending timers on FOOD-STAR foods in current foods list |

---

## `fetchNextCard(telemetry)` — Adapter Function

Top-level function in `game.js`. Sole contact point for future server integration.

**Input**: `TelemetryRecord[]` (current telemetry history)
**Output**: `EventCardDefinition` — `{ slots: string[] }`

**Local algorithm:**
1. Pick card size using card-size weights (1→40%, 2→35%, 3→18%, 4→7%)
2. For each slot, pick food type using RARITY_WEIGHTS via cumulative probability wheel
3. Enforce constraint: at most 1 PENTA and at most 1 BOMB per card (reroll each if exceeded)
4. Return `{ slots }`

---

## FOOD_TYPES Enum

```js
const FOOD_TYPES = {
  STANDARD: 'STANDARD',
  DOUBLE:   'DOUBLE',
  PENTA:    'PENTA',
  TRIM:     'TRIM',
  RUSH:     'RUSH',
  STAR:     'STAR',
  BOMB:     'BOMB'
};
```

---

## New Constants

```js
const CARD_STRIP_H  = 32;                    // px — card indicator strip below grid
const CANVAS_H      = HUD_H + ROWS*CELL + CARD_STRIP_H;  // 40 + 560 + 32 = 632

const FOOD_COLORS = {
  STANDARD: 0xffeb3b,   // yellow
  DOUBLE:   0x00bcd4,   // teal
  PENTA:    0xffc400,   // gold
  TRIM:     0xff6d00,   // orange
  RUSH:     0xaa00ff,   // purple
  STAR:     0xffffff,   // white
  BOMB:     0xb71c1c    // dark red
};

const C_OBSTACLE    = 0x455a64;  // dark slate gray

const RARITY_WEIGHTS = {
  STANDARD: 70, DOUBLE: 12, TRIM: 7,
  RUSH: 6, STAR: 3, PENTA: 1, BOMB: 1
};

const CARD_SIZE_WEIGHTS = [
  { size: 1, weight: 70 },
  { size: 2, weight: 18 },
  { size: 3, weight: 9  },
  { size: 4, weight: 3  }
];

const RUSH_BOOST_DURATION = 5000;   // ms
const RUSH_SPEED_FACTOR   = 1.5;    // divisor for tick delay during boost
const STAR_SPEED_FACTOR   = 2;      // FOOD-STAR moves at 1/2 snake speed (delay × 2)
```
