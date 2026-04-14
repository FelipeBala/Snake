# Feature Specification: Turbo Visual Effects

**Feature ID**: 007-turbo-visual-effects
**Status**: Ready for Implementation
**Created**: 2026-04-14

---

## Summary

When the snake eats a Turbo food item, two clear visual effects must play:

1. **Speed indicator** — the snake body displays a visible visual cue that communicates "accelerated state" for the full duration of the speed boost.
2. **Segment fade-out** — the body segments lost when eating Turbo (5 segments are removed) animate away with a fade/dissolve effect rather than disappearing instantly, making it immediately clear to the player that the snake shrank.

---

## Problem Statement

Currently, when the snake eats the Turbo food:
- The snake immediately loses 5 body segments with no animation — players can miss this or feel confused about why the snake got shorter.
- There is no visual feedback on the snake itself indicating it is in a speed boost state — players must infer speed from movement alone.

Both effects make the Turbo food feel abrupt and harder to understand instinctively.

---

## User Scenarios & Testing

### Scenario 1 — Player eats Turbo food
**Given** the snake is moving normally and eats a Turbo food item,
**When** the food is consumed,
**Then**:
- The 5 tail segments that are removed must animate away visibly (fade out over a short duration).
- The snake body immediately enters a visually distinct "boosted" state.
- The boosted visual persists for the entire duration of the speed boost (5 seconds).
- When the boost ends, the snake body returns to its normal visual appearance.

### Scenario 2 — Snake too short to lose 5 segments
**Given** the snake has fewer than 5 segments when it eats Turbo,
**When** the food is consumed,
**Then**:
- However many segments exist are removed (current behaviour), and those segments fade out visibly.
- The speed boost and its visual effect still apply normally.

### Scenario 3 — Multiple Turbo foods consumed back-to-back
**Given** the player eats a second Turbo food while already in boosted state,
**When** the second food is consumed,
**Then**:
- Another wave of segment fade-outs plays for the newly removed segments.
- The boost duration resets/extends (existing behaviour) and the speed visual continues uninterrupted.

### Scenario 4 — Player observes and understands feedback
**Given** a new player sees the Turbo food consumed for the first time,
**When** the effects play,
**Then** the player can clearly perceive: (a) the snake got shorter, (b) the snake is now moving faster.

---

## Functional Requirements

### Speed Indicator (Boosted State Visual)

| ID  | Requirement |
|-----|-------------|
| FR1 | While the speed boost is active, the snake body must display a visual effect distinct from its normal appearance. |
| FR2 | The visual effect must be perceivable even during fast movement (e.g., colour tint, trailing glow, pulsing outline, or particle trail). |
| FR3 | The visual effect must apply to all existing and newly grown body segments during the boost. |
| FR4 | The visual effect must stop immediately when the boost timer expires and the snake returns to normal speed. |
| FR5 | The speed visual must not obscure the snake's direction or make it harder to see obstacles and food. |

### Segment Fade-Out Animation

| ID  | Requirement |
|-----|-------------|
| FR6 | When segments are removed by Turbo, each removed segment must animate with a fade-out effect at the position it occupied on the grid. |
| FR7 | The fade-out animation must complete within 0.5 seconds and must not block gameplay. |
| FR8 | Fading segments must not interact with gameplay (no collision, no blocking). |
| FR9 | The fade-out must be visually consistent with the snake's body colour/style so the player associates the ghost with the snake. |
| FR10 | If the snake eats Turbo again before a previous fade-out animation completes, both animations can run concurrently. |

---

## Success Criteria

| ID  | Criterion |
|-----|-----------|
| SC1 | Players can identify at a glance that the snake is in a speed boost state without looking at any timer or counter. |
| SC2 | Players notice the snake shrank immediately upon eating Turbo — no visual inspection of segment count required. |
| SC3 | The fade-out animation completes within 0.5 seconds and does not cause any visible stutter or frame drops. |
| SC4 | The boosted visual is active for the full boost duration and absent at all other times. |
| SC5 | The effects work correctly when Turbo is consumed multiple times in quick succession. |

---

## Scope

**In scope:**
- Visual effect on the snake body while boosted (colour tint, glow, outline, trail, or combination).
- Fade-out animation for removed segments at their last grid position.
- Effect on all scenes where gameplay occurs (GameScene only).

**Out of scope:**
- Sound effects for the Turbo food (already handled by the audio system).
- Changes to Turbo game logic (segment count removed, speed value, boost duration).
- Visual changes to the Turbo food item itself.
- HUD timer or countdown for the boost.

---

## Assumptions

- The Phaser game engine's built-in graphics and tween system will be used for both effects.
- "5 segments removed" refers to the existing Turbo mechanic — this spec does not change that number.
- The snake body is drawn via the existing `redraw()` method and `this.gfx` Graphics object in `game.js`.
- The boost duration is 5 seconds (existing value) — no change required.
- The speed visual should work on both desktop and mobile without additional configuration.

---

## Dependencies

- Existing Turbo (`RUSH`) food consumption logic in `GameScene`.
- Existing snake rendering pipeline (`drawSnake()` or equivalent).
- Phaser tweens / graphics API for fade-out animations.
- No new assets required (effects are programmatic).
