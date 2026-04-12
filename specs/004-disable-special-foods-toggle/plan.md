# Implementation Plan: Disable Special Foods Toggle

**Branch**: `004-disable-special-foods-toggle` | **Date**: 2026-04-12 | **Spec**: [spec.md](spec.md)  
**Input**: Feature specification from `/specs/004-disable-special-foods-toggle/spec.md`

## Summary

Add a toggle button to the existing `LegendScene` that lets the player disable all special food types (everything except STANDARD). When disabled, `fetchNextCard()` returns a single STANDARD food slot, all non-STANDARD legend rows are dimmed to alpha 0.35, and the preference is persisted in `localStorage` across browser sessions. Two new module-level helpers (`isSpecialFoodsEnabled`, `setSpecialFoodsEnabled`) provide safe default-on I/O to localStorage. All changes are confined to `game.js`.

## Technical Context

**Language/Version**: Vanilla JavaScript ES6+  
**Primary Dependencies**: Phaser 4.0.0 (local `lib/phaser.min.js`)  
**Storage**: `window.localStorage` — key `snakeSpecialFoodsEnabled`, string `'true'`/`'false'`  
**Testing**: Manual browser test; `npm run lint`  
**Target Platform**: Modern evergreen browsers (Chrome 90+, Firefox 88+, Edge 90+, Safari 14+), file:// protocol  
**Project Type**: Browser-based single-file game  
**Performance Goals**: 60 fps game loop unaffected; localStorage read is negligible (once per card activation)  
**Constraints**: Single static file delivery; offline-capable; zero new dependencies  
**Scale/Scope**: One file (`game.js`); 4 targeted code changes

## Constitution Check

*GATE: Must pass before Phase 0 research. Re-check after Phase 1 design.*

| Principle | Status | Notes |
|-----------|--------|-------|
| I. Browser-Native, Zero Dependencies | ✅ PASS | `localStorage` is a native browser API; no new dependencies |
| II. Game-Loop Integrity | ✅ PASS | `isSpecialFoodsEnabled()` is called in `fetchNextCard()` (card generation time, outside the tick loop); game loop state is not mutated outside tick |
| III. Child-Friendly UX | ✅ PASS | Toggle button will be ≥48 px, brightly coloured, with clear label. Alpha-dimmed rows remain readable (not zero opacity). |
| IV. Responsive Single-File Delivery | ✅ PASS | All changes in `game.js`; no build step added |
| V. Gameplay Simplicity & Clean Separation | ✅ PASS | Game rules unchanged; only the set of eligible food types is filtered |

**Post-Design Re-check**: All principles still pass after Phase 1 design. No violations.

## Project Structure

### Documentation (this feature)

```text
specs/004-disable-special-foods-toggle/
├── plan.md         ← this file
├── research.md     ← Phase 0 complete
├── data-model.md   ← Phase 1 complete
└── tasks.md        ← Phase 2 output (created by /speckit.tasks)
```

### Source Code (repository root)

```text
game.js             ← all changes here (single-file architecture)
index.html          ← no changes
style.css           ← no changes
lib/
  phaser.min.js     ← no changes
```

**Structure Decision**: Single-file game — all feature logic lives in `game.js` alongside the existing scenes and helpers.

## Complexity Tracking

> No constitution violations — section not needed.

## Implementation Blueprint

### Change 1 — Module-level helpers (new code, before existing constants or after them)

**Location**: Top of `game.js`, before `EventCardManager` class (~line 260).

**What**: Add two module-level functions:

```javascript
// --- Special Foods Preference (localStorage) ---
function isSpecialFoodsEnabled() {
  try { return localStorage.getItem('snakeSpecialFoodsEnabled') !== 'false'; }
  catch (e) { return true; }
}

function setSpecialFoodsEnabled(enabled) {
  try { localStorage.setItem('snakeSpecialFoodsEnabled', String(enabled)); }
  catch (e) { /* best-effort; ignore storage errors */ }
}
```

**Why**: Centralises all storage I/O; safe-defaults on error; readable everywhere in `game.js` without passing parameters.

---

### Change 2 — fetchNextCard() guard (modify existing function ~line 271)

**Location**: First line inside `fetchNextCard(telemetry)`.

**What**: Add early-return for the disabled path:

```javascript
function fetchNextCard(telemetry) {
  if (!isSpecialFoodsEnabled()) {
    return { slots: [FOOD_TYPES.STANDARD] };
  }
  // ... rest of existing logic unchanged ...
}
```

**Why**: Single authoritative guard. Card size = 1 and type = STANDARD automatically. Zero impact on the enabled path.

---

### Change 3 — Toggle button in LegendScene.create() (modify existing scene ~line 1270+)

**Location**: Inside `LegendScene.create(data)`, after the last row is drawn and before the "Jogar" button (or after the last separator, whichever comes last).

**What**:

```javascript
// Toggle button
const specialEnabled = isSpecialFoodsEnabled();
const toggleLabel = specialEnabled
  ? 'Desabilitar Comidas Especiais'
  : 'Habilitar Comidas Especiais';
const toggleColor = specialEnabled ? 0xe53935 : 0x43a047;

makeButton(this, cx, toggleY, toggleLabel, toggleColor, () => {
  setSpecialFoodsEnabled(!specialEnabled);
  this.scene.restart();
});
```

Where `toggleY` is positioned below the last legend row with adequate padding (≥ 16 px below last separator).

**Why**: Reuses existing `makeButton()` helper (already used in this scene). `scene.restart()` re-enters `create()` cheaply, reflecting updated preference without additional state management.

---

### Change 4 — Visual dimming for disabled rows in LegendScene.create() (modify existing rendering loop ~line 1235)

**Location**: Inside the loop or inline code that draws each food row in `LegendScene.create()`.

**What**: After creating each row's `iconGfx`, `nameText`, and `descText` objects, apply alpha if special foods are disabled and the row is not STANDARD or OBSTACLE:

```javascript
const specialEnabled = isSpecialFoodsEnabled(); // computed once before the loop

// Per row (inside loop or after each row block):
if (!specialEnabled && foodType !== FOOD_TYPES.STANDARD) {
  iconGfx.setAlpha(0.35);
  nameText.setAlpha(0.35);
  descText.setAlpha(0.35);
}
```

**Why**: `setAlpha()` is a standard Phaser display object method. No new draw calls. Only special-food rows are dimmed; Normal and Obstacle rows stay fully opaque.

---

## Residual Risks

| Risk | Likelihood | Mitigation |
|------|-----------|-----------|
| `makeButton()` helper API differs from what research assumes | Low | Read actual `makeButton` signature in `game.js` before implementing |
| LegendScene `create()` uses inline row rendering (not a loop) — requires per-row alpha calls | Low (confirmed by exploration: 6 rows drawn inline) | Apply alpha call after each non-STANDARD row block individually |
| `localStorage` blocked (strict private-browsing mode) | Very low for target audience | Handled by try/catch in helpers; defaults to enabled |
| `scene.restart()` drops scene `data` — if LegendScene receives `data` from caller it must re-pass it | Low | Verify if LegendScene uses `data`; pass it through restart if needed |
