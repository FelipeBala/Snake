# Research: Disable Special Foods Toggle

**Phase**: 0 — Pre-Design Research  
**Feature**: 004-disable-special-foods-toggle  
**Date**: 2026-04-12

---

## 1. LegendScene Integration Point

### Decision
Add the toggle button inside `LegendScene.create()`, positioned below the last legend entry row (after the OBSTACLE row). Use the existing `makeButton()` helper already used by MenuScene and LegendScene itself.

### Rationale
`LegendScene.create()` [line 1220] builds all UI from scratch on each entry. Adding the button there ensures it is always kept in sync with the preference state at render time and re-renders whenever the player revisits the scene. No additional lifecycle hooks are needed.

### Alternatives Considered
- Adding the toggle to `MenuScene`: rejected — the user story and FR-001 explicitly require it to be in the LegendScene.
- A persistent overlay component: over-engineered; the single-file architecture doesn't justify a new abstraction for one button.

---

## 2. Preference Persistence

### Decision
Use `window.localStorage` with key `'snakeSpecialFoodsEnabled'`. Value is the string `'false'` when special foods are disabled; the key is absent (null) or any other value when enabled. This follows localStorage's string-only convention.

Read helper:
```javascript
function isSpecialFoodsEnabled() {
  try { return localStorage.getItem('snakeSpecialFoodsEnabled') !== 'false'; }
  catch (e) { return true; } // Safe default: enabled
}
```

Write helper:
```javascript
function setSpecialFoodsEnabled(enabled) {
  try { localStorage.setItem('snakeSpecialFoodsEnabled', enabled ? 'true' : 'false'); }
  catch (e) { /* Silently ignore — preference is best-effort. */ }
}
```

### Rationale
`localStorage` is available in all target browsers (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+) without any dependency. The try/catch handles the edge case where storage is blocked (private browsing on certain browsers, or storage quota exceeded). Defaulting to `true` (enabled) on any error satisfies FR-007.

### Alternatives Considered
- `sessionStorage`: rejected — does not survive browser close/reopen; fails SC-004.
- Cookie: rejected — requires extra serialisation, unnecessary for a simple boolean.
- In-memory module variable: rejected — resets on page reload; fails SC-004.

---

## 3. Food Type Filtering in fetchNextCard()

### Decision
Modify `fetchNextCard(telemetry)` [line 271-297] to check `isSpecialFoodsEnabled()` at the top of the function. When special foods are disabled:

1. **Card size** is forced to 1 (skip the CARD_SIZE_WEIGHTS wheel entirely).
2. **Food type** for every slot is forced to STANDARD (skip `_weightedPick(RARITY_WEIGHTS)`).
3. The existing per-card PENTA/BOMB constraints become irrelevant and are skipped.

```javascript
function fetchNextCard(telemetry) {
  if (!isSpecialFoodsEnabled()) {
    return { slots: [FOOD_TYPES.STANDARD] };
  }
  // ... existing logic unchanged ...
}
```

### Rationale
`fetchNextCard` is a module-level generator function, not a class method with state. It is the single authoritative source for what a card contains and is called exclusively by `EventCardManager.appendNewCard()`. A single guard at the entry point is the minimal, least-invasive change. Reading localStorage once per card generation is infrequent (a new card is generated only after the previous one is fully consumed) and has negligible performance impact.

### Alternatives Considered
- Filtering food types inside `_weightedPick` via a modified weights map: works but couples the weight map to runtime state; harder to reason about when reviewing the spawning logic.
- Modifying `EventCardManager.activateCard()`: downstream of card generation; would still require card re-generation or filtering, adding complexity.
- Passing the preference as a parameter through `appendNewCard()` → `fetchNextCard()`: cleaner in theory but requires threading the preference through multiple call sites with no benefit since `isSpecialFoodsEnabled()` is a pure side-effect-free read.

---

## 4. Card Size Cap (Quantity = 1)

### Decision
Force `cardSize = 1` inside `fetchNextCard()` whenever special foods are disabled (covered in decision #3 above — the early return `{ slots: [FOOD_TYPES.STANDARD] }` produces exactly 1 slot). No separate cap mechanism is needed.

### Rationale
The early return in `fetchNextCard()` produces a card with exactly one STANDARD food (`slots` array length = 1). `EventCardManager.activateCard()` iterates `card.slots` and spawns one food per slot, so the cap is enforced naturally. No changes needed in `activateCard()`.

### Alternatives Considered
- Clamping `activeCard.remaining` to 1 in `activateCard()`: would still allow multiple different food types in the slot array; only the count would be capped, not the types. Wrong approach.
- CARD_SIZE_WEIGHTS as a constant changed at runtime: mutating module-level constants is fragile and affects all concurrent calls.

---

## 5. Visual Distinction for Disabled Entries

### Decision
When special foods are disabled, render all non-STANDARD rows in `LegendScene.create()` at `alpha = 0.35` using Phaser's `setAlpha()` on the text objects and the icon graphics object. A small locked icon text (🚫 or strikethrough) is appended to each disabled food name.

Specifically, after drawing each legend row, check `isSpecialFoodsEnabled()` and conditionally call:
```javascript
iconGfx.setAlpha(0.35);
nameText.setAlpha(0.35);
descText.setAlpha(0.35);
```

### Rationale
Phaser's display objects all support `setAlpha()`. This approach requires no new draw logic, no additional graphics objects, and satisfies FR-010 (immediate update on toggle without scene reload) because the toggle button calls `this.scene.restart()` to re-enter `create()` with the updated preference — the cheapest full refresh approach in a Phaser scene.

### Alternatives Considered
- Live alpha update without scene restart: would require keeping references to every row's objects in scene scope and updating them on click. More code, more fragile. Since `LegendScene` is entered cheaply from within a Phaser game with no load phase, a restart is indistinguishable from a live update to the user.
- Strikethrough: Phaser 4 text does not have native strikethrough; emulating it with a drawn line is significantly more code. Reduced alpha is simpler and still clearly communicates "inactive".

---

## 6. Preference Data Flow to GameScene

### Decision
`GameScene` (and therefore `EventCardManager` and `fetchNextCard`) reads the preference directly from localStorage via `isSpecialFoodsEnabled()` at card-generation time. No scene `data` parameter passing is needed.

### Rationale
`fetchNextCard()` is a module-level function in the same file. The `isSpecialFoodsEnabled()` helper is also module-level and directly readable from any function in `game.js`. There is no cross-file or cross-origin boundary to navigate. This avoids adding a new `data` field to the GameScene start call, which would require updating every scene that starts GameScene (LegendScene line 1263, GameOverScene line 997).

### Alternatives Considered
- Passing preference via scene data `{ specialFoodsEnabled: ... }`: adds coupling and requires changes in 2 existing call sites with no benefit.

---

## Summary of Resolved Unknowns

| Unknown | Resolution |
|---------|-----------|
| Persistence mechanism | `localStorage` key `snakeSpecialFoodsEnabled` with try/catch guard |
| Toggle UI placement | Inside `LegendScene.create()`, below last legend row using `makeButton()` |
| Food filtering touch point | Single guard in `fetchNextCard()` returning `{ slots: [STANDARD] }` |
| Card size cap | Implicit via the 1-slot return from `fetchNextCard()` |
| Visual distinction | `setAlpha(0.35)` on non-STANDARD row objects + scene restart on toggle |
| Preference data flow | Module-level `isSpecialFoodsEnabled()` read inline; no scene data passing |
