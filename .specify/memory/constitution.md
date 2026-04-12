<!--
  SYNC IMPACT REPORT
  ==================
  Version change: (unversioned template) → 1.0.0
  Principles defined:
    - I. Browser-Native, Zero Dependencies (NEW)
    - II. Game-Loop Integrity (NEW)
    - III. Child-Friendly UX (NEW)
    - IV. Responsive Single-File Delivery (NEW)
    - V. Gameplay Simplicity & Clean Separation (NEW)
  Added sections:
    - Technology Stack & Platform (NEW)
    - Design Standards (NEW)
  Removed sections:
    - None (first population of template)
  Templates requiring updates:
    - .specify/templates/plan-template.md  ✅ reviewed — compatible, no changes required
    - .specify/templates/spec-template.md  ✅ reviewed — compatible, no changes required
    - .specify/templates/tasks-template.md ✅ reviewed — compatible, no changes required
  Deferred items:
    - None
-->

# Snake Web Game Constitution

## Core Principles

### I. Browser-Native, Zero Dependencies

The game MUST run entirely in the browser using only HTML5, CSS3, and vanilla JavaScript (ES6+).
No external frameworks, npm packages, bundlers, CDN-hosted libraries, or server-side logic are
permitted. Every feature MUST be implementable without adding third-party dependencies. Game frameworks like Phaser are allowed.

**Rationale**: Eliminates build-tooling friction, ensures portability, and keeps the project
approachable for contributors at all skill levels. A single static-file deployment MUST always be
possible.

### II. Game-Loop Integrity (NON-NEGOTIABLE)

The core game loop MUST be deterministic and driven by a single authoritative tick (via
`requestAnimationFrame` with a delta/accumulator or `setInterval`). Snake movement, collision
detection, and food spawning MUST all occur within one tick. Outside of the game loop, no code MAY
mutate game state. Player input MUST be buffered and consumed at tick time only — never mid-tick.

**Rationale**: Prevents race conditions, ensures reproducible behavior, and makes gameplay fair and
debuggable.

### III. Child-Friendly UX (NON-NEGOTIABLE)

All UI elements MUST be designed for children aged 8–14:
- Buttons MUST be at minimum 48×48 px, brightly colored, and include a clear text label.
- Font sizes MUST be no smaller than 18 px for body labels and 24 px for headings.
- Colors MUST be vibrant and meet WCAG AA contrast ratio (≥ 4.5:1 for text).
- Buttons MUST have visible hover/press animations to reward interaction.
- The current score MUST always be visible during active gameplay.
- Start and Game Over screens MUST be engaging, friendly, and non-threatening.
- No violent, disturbing, or age-inappropriate imagery is permitted.

**Rationale**: The primary audience is children. Inaccessible or dull UX causes abandonment;
joyful, high-contrast design is a first-class requirement.

### IV. Responsive Single-File Delivery

The game MUST be fully playable by opening `index.html` directly in a browser (file:// protocol)
with no build step or internet connection required. CSS and JS MAY be inline or sibling static
files. The canvas MUST adapt to desktop (≥ 1024 px) and tablet (≥ 768 px) viewport widths without
horizontal scrolling.

**Rationale**: Maximizes accessibility for players and contributors alike. Zero setup barrier is
non-negotiable for a child-targeted game.

### V. Gameplay Simplicity & Clean Separation

Core gameplay rules are fixed and NON-NEGOTIABLE:
- The snake moves continuously in the last-input direction.
- Arrow keys AND WASD MUST both control direction; opposite-direction reversal MUST be ignored.
- Eating food increases snake length by exactly one segment and increments the score.
- Any collision with the snake's own body OR a wall/obstacle ends the game immediately.
- Obstacles MAY be added as enhancements but are not required for the base game.

Game state (positions, score, direction, speed) MUST be cleanly separated from rendering logic so
that new gameplay elements can be added without rewriting the renderer.

**Rationale**: Clear rules preserve the Snake identity; separation of concerns ensures the codebase
remains maintainable as features grow.

## Technology Stack & Platform

- **Rendering**: HTML5 `<canvas>` API — grid-based cells drawn as filled rectangles.
- **Language**: Vanilla JavaScript ES6+ (no transpilation, no TypeScript required).
- **Styling**: CSS3 — flexbox layout, CSS custom properties for theming, keyframe animations for
  button feedback and visual effects.
- **Target browsers**: Modern evergreen browsers — Chrome 90+, Firefox 88+, Edge 90+, Safari 14+.
- **Deployment**: Static files only. No backend, no database, no authentication required.
- **Fonts**: System font stack or a single rounded web font (e.g., "Nunito" or "Fredoka One") for
  child-friendly aesthetics; self-hosted or loaded from a trusted CDN.
- **Sound**: Optional enhancement; if added, MUST default to muted and respect browser autoplay
  policies.

## Design Standards

- **Color palette**: Bright greens for the snake body, warm yellow/orange for food, vivid blues or
  purples for UI backgrounds, high-contrast white for text on dark backgrounds.
- **Grid cell size**: 20×20 px minimum on desktop; scales proportionally on smaller viewports.
- **Buttons**: Rounded corners (border-radius ≥ 12 px), drop-shadow, bold labels, scale/color
  transition on `:hover` and `:active`. Minimum tap target 48×48 px.
- **Score display**: Fixed position above the canvas, ≥ 28 px font, updates in real time each tick.
- **Screens**: A Start screen and a Game Over screen MUST both display the current score (and
  personal best where feasible) plus a prominent "Play" / "Play Again" button.
- **Accessibility**: All interactive elements MUST be keyboard-focusable; avoid relying solely on
  color to convey state.

## Governance

This constitution supersedes all ad-hoc implementation decisions for the Snake Web Game project.
Amendments MUST:
1. Include a documented rationale for the change.
2. Increment the version number following semantic versioning (MAJOR.MINOR.PATCH):
   - **MAJOR**: Removal or incompatible redefinition of a core principle.
   - **MINOR**: New principle, new section, or material expansion of guidance.
   - **PATCH**: Clarification, wording fix, or non-semantic refinement.
3. Trigger a review of all dependent spec, plan, and tasks documents for consistency.

Compliance: Every spec and plan document produced for this project MUST include a
"Constitution Check" section confirming compliance with all five Core Principles before
implementation work begins.

**Version**: 1.0.0 | **Ratified**: 2026-04-11 | **Last Amended**: 2026-04-11
