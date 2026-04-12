# Feature Specification: Legend Screen

**Feature Branch**: `003-legend-screen`
**Created**: 2026-04-12
**Status**: Draft
**Input**: User description: "Coloque uma tela antes do jogo iniciar com a legenda dos icones e descrição."

## Clarifications

### Session 2026-04-12

- Q: Where does the "Legenda" button appear on the MenuScene relative to the existing JOGAR button? → A: Below JOGAR, stacked vertically — JOGAR stays at y≈58%, Legenda button at y≈72%.
- Q: Should the LegendScene list entries in a single column or two columns? → A: Single column — icon on the left, name and description stacked on the right, 8 rows total.
- Q: What is the exact label for the legend button (FR-001 says "Legenda" or "?")? → A: "Legenda" (full word label, not "?").

## User Scenarios & Testing *(mandatory)*

### User Story 1 — View Food Legend Before Playing (Priority: P1)

A child opens the game for the first time and sees the menu. Before pressing "Jogar", they tap a clearly labelled "?" or "Legenda" button. A full-screen legend appears showing every food type available in the game: its icon (in the same color and shape used during gameplay), its name, and one short sentence describing what happens when the snake eats it. The child reads through the list, understands that the dark red circle means "be careful", and goes back to the menu feeling confident. On subsequent sessions they can skip the legend entirely — it is always available but never forced.

**Why this priority**: The legend is the entire feature. Without it no other story makes sense. A child audience unfamiliar with the food icons needs this reference before their first game to make informed decisions (chase or avoid). All other enhancements below are polish on top of this core.

**Independent Test**: Open `index.html`, reach the MenuScene. Click the legend button. Verify that all 7 food types appear with their correct in-game icon, a readable name, and a short description. Press Back and arrive back at the MenuScene. The game itself is never launched during this test.

**Acceptance Scenarios**:

1. **Given** the MenuScene is showing, **When** the player presses the legend button, **Then** the LegendScene opens and is the only active screen.
2. **Given** the LegendScene is open, **When** it renders, **Then** all 7 food types are listed: Normal (amarelo), Duplo (ciano), Penta (dourado), Aparo (laranja), Turbo (roxo), Estrela (branco), Bomba (vermelho escuro).
3. **Given** the LegendScene is open, **When** it renders, **Then** each entry shows: (a) the food icon at the size and color used in gameplay, (b) the food name, (c) one sentence describing its effect.
4. **Given** the LegendScene is open, **When** the player presses the "Voltar" button or the Escape key, **Then** they return to the MenuScene without starting a game.
5. **Given** the legend button exists on the MenuScene, **When** it is measured, **Then** it is at minimum 48×48 px and has a visible label, consistent with all other menu buttons.
6. **Given** the player has seen the legend before and starts a new session, **When** the MenuScene loads, **Then** the legend is NOT shown automatically — it is opt-in only.

---

### User Story 2 — View Obstacle Legend Entry (Priority: P2)

In addition to the 7 food types, the player encounters dark slate tiles (obstacles created by FOOD-BOMB) during gameplay. A child confused by the grid turning dark gets no in-game explanation. The legend includes one additional entry for Obstáculos explaining they block movement and cause instant game over on collision.

**Why this priority**: Obstacles are a direct consequence of a food type (FOOD-BOMB) and are visually confusing without context. However, the game is fully learnable without this entry — the player will discover obstacles in-game. It ranks below P1 because the food icons are the primary confusion point.

**Independent Test**: Open the LegendScene. Verify a separate entry for "Obstáculo" appears after the food entries, showing the dark slate tile color/style, the name, and a description explaining it blocks the snake's path.

**Acceptance Scenarios**:

1. **Given** the LegendScene is open, **When** it renders, **Then** an "Obstáculo" entry appears after the food type entries.
2. **Given** the obstacle entry, **When** it renders, **Then** it shows the correct dark-slate tile color, the label "Obstáculo", and a description: "Criado pela Bomba. Bloqueie o caminho — colisão termina o jogo."

---

### Edge Cases

- If the screen can only fit some entries without scrolling: all 8 entries (7 foods + obstacle) must be visible simultaneously; reduce vertical spacing before introducing any scrolling mechanism.
- If `LegendScene` is opened while a game round is already in progress (e.g., accessed via future in-game pause): legend must not interfere with game state. For this feature the legend is only reachable from the MenuScene.
- Icon rendering must use the same drawing logic as gameplay (a shared helper), not static images, so icons automatically stay in sync if colors or shapes change.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The MenuScene MUST include a "Legenda" button visible before the player starts a game. The button is placed below the "Jogar" button (Jogar at y≈58%, Legenda at y≈72% of canvas height).
- **FR-002**: Pressing the legend button MUST navigate to a dedicated LegendScene.
- **FR-003**: The LegendScene MUST display all 7 food types defined in the game (STANDARD, DOUBLE, PENTA, TRIM, RUSH, STAR, BOMB) each with: an icon rendered using the same drawing function as gameplay, a short name, and a one-sentence effect description in Portuguese. Entries are laid out in a single column — icon on the left, name and description stacked on the right — one row per food type.
- **FR-004**: The LegendScene MUST include one additional entry for obstacles (FOOD-BOMB tiles) with the same structure: icon, name, description.
- **FR-005**: The LegendScene MUST provide a "Voltar" (Back) button and respond to the Escape key; both MUST return the player to the MenuScene.
- **FR-006**: The legend button on the MenuScene MUST meet the minimum 48×48 px size requirement defined in the project constitution (Principle III).
- **FR-007**: The legend MUST NOT be shown automatically on game load; it is always opt-in.
- **FR-008**: Icons in the legend MUST be rendered using the shared `drawFoodShape` helper function (or an equivalent call) so they visually match the in-game food icons.
- **FR-009**: All text in the LegendScene MUST use a minimum font size of 18 px for descriptions and 22 px for food names, per constitution Principle III.
- **FR-010**: The LegendScene MUST be reachable exclusively from the MenuScene in this feature iteration.

### Key Entities

- **LegendEntry**: One row in the legend — food type key, display name (Portuguese), short description (Portuguese), icon draw call.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A child aged 8–14 can locate the legend button on the MenuScene without assistance and open it within 10 seconds of seeing the menu.
- **SC-002**: All 8 legend entries (7 foods + obstacle) are visible on a single screen without scrolling on a 560×632 canvas.
- **SC-003**: Each icon in the legend is visually identical in color and shape to the same food type appearing during gameplay.
- **SC-004**: The player can return from the legend to the menu in one action (button press or Escape key) with no visible delay.
- **SC-005**: The legend button does not obscure or displace the "Jogar" button — both must be simultaneously visible on the MenuScene.

## Assumptions

- The existing `drawFoodShape(gfx, food, cx, cy)` function is available globally in `game.js` and can be called from `LegendScene.create()` by passing a fake food object `{ type: 'STANDARD', visible: true }`.
- All food names and descriptions are in Portuguese, matching the rest of the UI.
- The legend is a read-only screen — no interactivity beyond Back/Escape.
- No animation is required for legend icons (static render), except FOOD-STAR's blinking is suppressed in the legend (rendered as `visible: true` always).
- The canvas size (560×632) is already fixed; the legend layout must fit within this constraint.
- Obstacle icon is drawn with a flat `fillRect` + dark color, not via `drawFoodShape` (obstacles are not FoodItems), to match the actual in-game appearance and reuse `drawObstacle`.

## Food Legend Content (Portuguese)

| Type | Nome | Descrição |
|------|------|-----------|
| STANDARD | Normal | Cresce 1 segmento e vale 1 ponto. |
| DOUBLE | Duplo | Cresce 2 segmentos e vale 2 pontos. |
| PENTA | Penta | Cresce 5 segmentos e vale 5 pontos — raro! |
| TRIM | Aparo | Corta 5 segmentos da cauda. Sem pontos. |
| RUSH | Turbo | Corta 5 segmentos e acelera por 5 segundos. |
| STAR | Estrela | Move-se sozinha. Vale 10 pontos. Não cresce. |
| BOMB | Bomba | Vira 5 segmentos em obstáculos. Vale 10 pontos. |
| *(obstacle)* | Obstáculo | Criado pela Bomba. Colisão termina o jogo. |
