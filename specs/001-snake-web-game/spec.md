# Feature Specification: Snake Web Game

**Feature Branch**: `001-snake-web-game`  
**Created**: 2026-04-11  
**Status**: Draft  
**Input**: User description: "Crie um jogo web no estilo Snake onde o usuário controla através das setas e das teclas awsd do teclado a cobra pelo mapa. No mapa aparecem comidas. No momento que a cobra come a comida, ela se alonga e fica mais comprida. Se a cobra bater nela mesmo ou se bater num obstáculo o jogo acaba. O design do jogo deve ser clean e atraente para crianças de 8 a 14 anos. Com botões bem chamativos."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Play a Full Game Round (Priority: P1)

A player opens the game in a browser, sees the Start screen with a vibrant "Play" button, clicks
it, and controls the snake using arrow keys or WASD to eat food items that appear on the map.
Each food item eaten makes the snake one segment longer and increases the score. The round ends
when the snake collides with itself or a wall boundary. A Game Over screen appears showing the
final score and a "Play Again" button.

**Why this priority**: This is the complete core game loop — without it, there is no game.
Every other feature depends on this flow being stable and fun to play.

**Independent Test**: Open `index.html` in a browser, click "Play", use arrow keys to eat at
least five food items and verify score increments, then steer into the wall to confirm the
Game Over screen shows the correct final score and "Play Again" button.

**Acceptance Scenarios**:

1. **Given** the Start screen is displayed, **When** the player clicks "Play", **Then** the
   game canvas activates and the snake begins moving immediately.
2. **Given** the snake's head position overlaps with a food tile, **When** the game tick
   processes, **Then** a new food item appears at a random empty tile, the snake grows by one
   segment, and the score increments by 1.
3. **Given** the snake is moving, **When** the player presses an arrow key or WASD key,
   **Then** the snake changes direction at the next tick (opposite-direction input is ignored).
4. **Given** the snake head moves into its own body, **When** the game tick processes,
   **Then** movement stops, all input is ignored, and the Game Over screen is shown.
5. **Given** the snake head reaches the map boundary (wall), **When** the game tick processes,
   **Then** movement stops, all input is ignored, and the Game Over screen is shown.
6. **Given** the Game Over screen is displayed, **When** the player clicks "Play Again",
   **Then** the game resets to its initial state and presents the Start screen (or begins a
   new round immediately).

---

### User Story 2 - Track Score and Personal Best (Priority: P2)

As a player, I want to see my current score while playing and my personal best score at the
end of a round, so I am motivated to keep improving.

**Why this priority**: Score tracking dramatically increases replay motivation for children and
is low-cost to implement. It does not block the core game loop.

**Independent Test**: Play and eat 5 items (score = 5), reach Game Over, verify the Game Over
screen displays "5". Play again, eat 3 items, verify personal best still shows "5".

**Acceptance Scenarios**:

1. **Given** active gameplay, **When** the snake eats food, **Then** the score counter
   visible on screen increments in real time.
2. **Given** the Game Over screen appears, **When** the player's score is viewed, **Then**
   both the current round score and the all-time personal best (for the session) are clearly
   displayed.
3. **Given** a new personal best is achieved, **When** the Game Over screen appears,
   **Then** a congratulatory message highlights the new record.

---

### User Story 3 - Start Screen & Replayability (Priority: P3)

As a child player, I want a cheerful, visually engaging start screen with clear instructions
so I know how to play without reading a manual.

**Why this priority**: Good onboarding reduces abandonment. Children aged 8–14 need clear
affordances. However, the game works without it (US1 covers core play).

**Independent Test**: Open `index.html` with no prior interaction; verify a Start screen is
visible with the game title, brief control instructions (arrow keys + WASD), and a brightly
colored "Play" button that is obvious without reading detailed text.

**Acceptance Scenarios**:

1. **Given** the page loads, **When** no action is taken, **Then** the Start screen displays
   the game title, a short control hint, and a prominent "Play" button.
2. **Given** the Start screen is shown, **When** the player presses the Space bar or Enter
   key, **Then** the game begins (keyboard shortcut for quick restart).
3. **Given** the Game Over screen is shown, **When** the player presses Space or Enter,
   **Then** a new round starts immediately.

---

### Edge Cases

- What happens if the snake fills the entire map (no empty tile for food)? The game should
  detect this and display a "You Win!" victory state rather than attempting to place food
  infinitely.
- What happens if the player presses two direction keys between one tick? Only the most
  recent valid (non-opposite) direction is applied; extra inputs during a tick are discarded.
- What happens if the browser window is resized mid-game? The canvas preserves its defined
  internal game resolution; layout adjusts via CSS but the game state is unaffected.
- What happens if the player presses Escape or navigates away mid-game? The game pauses or
  the state is simply lost on navigation (no autosave required in v1).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST run entirely in the browser by opening a single HTML file with
  no installation, build step, or internet connection required.
- **FR-002**: The snake MUST be controlled by both arrow keys (↑ ↓ ← →) and WASD keys
  simultaneously — both input methods MUST work at all times during a game round.
- **FR-003**: Pressing a direction key opposite to the snake's current direction MUST be
  silently ignored (no self-reversal).
- **FR-004**: The snake MUST move at a steady, automatic pace determined by a regular game
  tick; the player does not need to hold a key to keep moving.
- **FR-005**: When the snake's head occupies the same cell as a food item, the snake MUST
  grow by exactly one tail segment.
- **FR-006**: After food is consumed, a new food item MUST appear immediately at a randomly
  chosen empty (non-snake) cell.
- **FR-007**: The score MUST increment by 1 each time food is consumed and MUST be visible
  at all times during active gameplay.
- **FR-008**: The game MUST end (and show the Game Over screen) when the snake's head
  collides with the snake's own body OR with the map boundary wall.
- **FR-009**: The Game Over screen MUST display the final score, the session personal best,
  and a clearly labeled "Play Again" button.
- **FR-010**: The Start screen MUST display the game title, brief control instructions
  (arrow keys and WASD), and a clearly labeled "Play" button.
- **FR-011**: All buttons MUST be visually distinct (bright color, large, rounded), easily
  tappable/clickable for children, and provide visible feedback on hover and click.
- **FR-012**: The game canvas MUST adapt to desktop (≥ 1024 px) and tablet (≥ 768 px)
  viewport widths without horizontal scrolling.
- **FR-013**: Speed MUST increase slightly as the score grows, providing a progressive
  difficulty curve.
- **FR-014**: The personal best score MUST persist for the duration of the browser session
  (resets on page reload — no backend storage required).

### Key Entities

- **Snake**: An ordered sequence of grid cells representing the snake's body. The first cell
  is the head. The snake grows at the tail when food is consumed. Attributes: list of
  cell coordinates, current direction.
- **Food Item**: A single grid cell containing a food symbol. Attributes: cell coordinates.
  One food item exists on the map at any time.
- **Game Board**: A fixed-size rectangular grid of cells. Attributes: number of columns,
  number of rows. Cells can be empty, contain the snake, or contain food.
- **Score**: An integer counter tracking food items consumed in the current round.
- **Personal Best**: An integer tracking the highest score achieved in the current session.
- **Game State**: One of: `start`, `playing`, `game-over`. Governs which screen is shown and
  whether input and ticking are active.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A first-time player aged 8–14 can understand how to start the game and begin
  playing within 30 seconds of opening the page, without reading any external instructions.
- **SC-002**: The snake responds to a direction key press within one game tick (no input
  lag perceptible to the player at default speed).
- **SC-003**: Food item placement after consumption appears instantaneous to the player
  (within the same game tick as consumption).
- **SC-004**: The game runs smoothly at the configured tick rate on any modern evergreen
  browser without visible stuttering or dropped frames.
- **SC-005**: All button labels and score text are legible at arm's length on a 768 px-wide
  screen (font size ≥ 18 px body, ≥ 24 px headings, WCAG AA contrast ratio ≥ 4.5:1).
- **SC-006**: A new round can be started from the Game Over screen in one click or one key
  press (Space/Enter), with zero loading delay.
- **SC-007**: The personal best score is correctly maintained across multiple rounds within
  the same browser session.

## Assumptions

- **No mobile/touch support in v1**: The game targets desktop and tablet keyboard users;
  on-screen touch controls (virtual joystick/buttons) are out of scope for the initial
  release.
- **Single food item**: Only one food item appears on the map at a time. Multiple simultaneous
  foods are not required.
- **Boundary = walls**: The game board is enclosed by walls; crossing any edge is a collision
  and ends the game. Wrap-around (toroidal) movement is not supported.
- **No obstacle tiles beyond walls in v1**: The user description mentions obstacles as a
  possible end condition. For v1, only the four boundary walls act as obstacles. Internal
  obstacle tiles are deferred to a future enhancement.
- **No sound in v1**: Audio feedback is out of scope for the initial release.
- **No score persistence across sessions**: `localStorage` or backend storage is not required;
  personal best resets on page reload.
- **Snake starts at length 3**: The snake begins with a head and two body segments at a
  default position, moving right.
- **Target browsers**: Modern evergreen browsers (Chrome 90+, Firefox 88+, Edge 90+,
  Safari 14+). No Internet Explorer support.
