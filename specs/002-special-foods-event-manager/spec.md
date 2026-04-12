# Feature Specification: Special Foods & Event Card Manager

**Feature Branch**: `002-special-foods-event-manager`
**Created**: 2026-04-11
**Status**: Draft
**Input**: User description: "Adicione novos elementos e eventos ao jogo: 6 novos tipos de comida especial e um gerenciador de eventos baseado em cartões."

## Clarifications

### Session 2026-04-11

- Q: Como o FOOD-STAR se movimenta pelo mapa? → A: Caminhada direcional — escolhe uma direção aleatória, avança célula por célula; muda de direção só quando bloqueado; se todos os 4 lados bloqueados, teleporta para célula vazia aleatória.
- Q: Quantos pontos FOOD-DOUBLE e FOOD-PENTA devem conceder ao score? → A: Score proporcional ao crescimento — FOOD-DOUBLE = +2 pontos, FOOD-PENTA = +5 pontos, FOOD-BOMB = +10 pontos (risco compensado com recompensa).
- Q: O jogador consegue ver o cartão ativo e quais comidas ainda faltam consumir? → A: Sim — o HUD deve exibir um indicador visual do cartão atual com ícones e contagem das comidas restantes.
- Q: Se o speedup por score disparar durante o boost do FOOD-RUSH, qual tick delay é restaurado ao fim dos 5 segundos? → A: O delay base armazenado é atualizado durante o boost; ao expirar, o jogador mantém o progresso de velocidade ganho pelo score (não volta ao delay anterior ao Rush).

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Encounter Special Foods During Gameplay (Priority: P1)

A player is in the middle of a round when the map shows a food item that looks different from the standard yellow pellet. Depending on which type they eat, something dramatic happens: the snake grows faster, shrinks, speeds up dangerously, a golden star starts moving, or the tail shatters into obstacles. Each special food is visually distinctive so the player can decide whether to chase it or avoid it.

**Why this priority**: The six new food types are the core mechanic of this feature. Without them, the event card system has nothing to work with. This is the minimum viable slice — even without the card manager, special foods alone transform the game experience.

**Independent Test**: Temporarily place one of each food type at fixed positions on the map. Verify the snake collides with each and the correct effect fires: +2 body, +5 body, -5 body (capped at 1), -5 body + 1.5× speed for 5 seconds, +10 score (no growth), tail-to-obstacles. Visual distinction must be immediately obvious.

**Acceptance Scenarios**:

1. **Given** a FOOD-DOUBLE (teal diamond) on the map, **When** the snake's head reaches it, **Then** the snake grows by exactly 2 segments and the score increments by 2.
2. **Given** a FOOD-PENTA (golden star, rare) on the map, **When** the snake eats it, **Then** the snake grows by exactly 5 segments and the score increments by 5.
3. **Given** a FOOD-TRIM (orange pill) on the map and the snake has ≥ 6 segments, **When** the snake eats it, **Then** the snake loses exactly 5 tail segments; score unchanged.
4. **Given** a FOOD-TRIM on the map and the snake has ≤ 5 segments, **When** the snake eats it, **Then** the snake is reduced to 1 segment (minimum); score unchanged.
5. **Given** a FOOD-RUSH (purple lightning bolt) on the map, **When** the snake eats it, **Then** the snake loses 5 segments (capped at 1) AND the tick rate becomes 1.5× faster for exactly 5 seconds, after which the original tick rate resumes.
6. **Given** a FOOD-STAR (white blinking star) moving directionally on the grid at half the current snake tick rate, **When** the snake eats it, **Then** the score increases by 10 and the snake does NOT grow; FOOD-STAR is removed.
7. **Given** a FOOD-BOMB (dark red skull) on the map and the snake has ≥ 6 segments, **When** the snake eats it, **Then** the last 5 tail segments are removed from the snake and placed on the grid as permanent obstacle tiles; score increments by 10.
8. **Given** a FOOD-BOMB and the snake has ≤ 5 segments, **When** the snake eats it, **Then** all segments except the head become obstacle tiles; the snake continues with 1 segment; score increments by 10.
9. **Given** an obstacle tile on the grid, **When** the snake's head enters that cell, **Then** the game registers a collision (same as wall collision) and triggers game over.
10. **Given** a FOOD-RUSH is active (speed boosted), **When** another FOOD-RUSH is eaten, **Then** the 5-second boost timer resets (no stacking — duration refreshes).

---

### User Story 2 — Event Card Manager Structures the Challenge (Priority: P2)

Instead of foods appearing randomly one at a time, the event card manager decides which combination of foods appears on the map. An event card might say "place 1 FOOD-DOUBLE and 1 FOOD-RUSH". Both must be eaten before the next card is revealed. The manager keeps 10 cards queued ahead; each consumed card is instantly replaced so the queue never runs dry. This creates a structured, varied rhythm: some cards are generous, some are punishing, and the rarity system ensures rare combinations appear infrequently.

**Why this priority**: The event card manager transforms a collection of food types into a coherent system with pacing and strategy. Without it, foods spawn individually and the game feels incremental rather than event-driven.

**Independent Test**: Watch the game for 10 full card cycles. Verify: (a) all foods defined in the current card appear simultaneously on the map; (b) a new card is not drawn until every food from the current card is consumed; (c) rare foods (FOOD-PENTA, FOOD-BOMB, FOOD-STAR) appear noticeably less often than common foods across 50+ cards.

**Acceptance Scenarios**:

1. **Given** the game starts, **When** the first card is drawn, **Then** all foods defined by that card appear on the map in empty cells simultaneously.
2. **Given** a card with multiple foods on the map, **When** the last food on the card is consumed, **Then** the next card's foods appear on the map within one tick.
3. **Given** the card queue has 10 cards, **When** one card is fully consumed, **Then** a new card is immediately generated and appended to the back of the queue (queue stays at 10).
4. **Given** 50 randomly generated cards, **When** examining their contents, **Then** the frequency of FOOD-PENTA and FOOD-BOMB is noticeably lower than FOOD-DOUBLE and FOOD-TRIM.
5. **Given** a card that places FOOD-STAR on the map, **When** the FOOD-STAR moves into a cell occupied by a snake segment, **Then** FOOD-STAR rebounds to a random empty cell without being consumed.
6. **Given** a card that places FOOD-STAR, **When** the FOOD-STAR moves into a cell that is an obstacle, **Then** FOOD-STAR rebounds to a random empty cell.
7. **Given** the map has insufficient empty cells for all foods in the next card, **When** the card is drawn, **Then** foods are placed only in available empty cells; any food that cannot be placed is skipped for that card.

---

### User Story 3 — Telemetry Architecture Ready for Server Integration (Priority: P3)

The event manager records a history of the last 10 consumed cards including: card composition, time taken to consume it, snake length at the time of consumption, and cumulative score. This data structure is ready to be sent to a future server that will return server-generated card sequences instead of random local ones. For now, a clear local interface exists that a future server adapter can plug into with no gameplay logic changes.

**Why this priority**: No player-facing functionality — this is forward compatibility work. The game is fully functional without it; it simply future-proofs the event system for adaptive difficulty and analytics.

**Independent Test**: After completing 10+ cards, inspect the in-memory telemetry object. Verify it contains the last 10 consumed cards with correct card composition, duration, snake length at consumption time, and cumulative score. Verify a mock `fetchNextCard(telemetry)` function exists and is called (currently returning a locally generated card).

**Acceptance Scenarios**:

1. **Given** a card is fully consumed, **When** the event manager processes it, **Then** a telemetry record is appended with: card contents, elapsed time since card draw (in seconds), snake length at consumption, current score.
2. **Given** the telemetry history has 10+ records, **When** a new card is consumed, **Then** the oldest record is discarded (rolling window of 10).
3. **Given** a `fetchNextCard(telemetry)` adapter function exists, **When** the event manager needs a new card, **Then** it calls `fetchNextCard(telemetry)` which currently returns a locally generated card (future: server response).
4. **Given** a future server adapter replaces `fetchNextCard`, **When** it is swapped in, **Then** no other gameplay code changes are required.

---

### Edge Cases

- Snake length reaches 0 after shrink effects: minimum length is always 1 (the head); segments beyond 1 are what shrink.
- FOOD-STAR spawns in a cell that becomes an obstacle (FOOD-BOMB activation): FOOD-STAR moves to a new empty cell.
- FOOD-RUSH activated while another FOOD-RUSH timer is still running: timer resets to 5 seconds (no stacking).
- All grid cells are occupied by obstacles + snake: no empty cell to spawn food → skip that food for the current card.
- FOOD-STAR's movement path leads it to collide with the snake or an obstacle on every adjacent cell: FOOD-STAR moves to a random empty cell anywhere on the grid.
- A card is drawn when the snake length is exactly 1: FOOD-BOMB and FOOD-TRIM effects reduce to zero removed segments; head is preserved.
- Event card containing only FOOD-STAR: card is not complete until FOOD-STAR is caught (it can move indefinitely).

## Requirements *(mandatory)*

### Functional Requirements

#### Special Food Types

- **FR-001**: The game MUST support 6 special food types in addition to the standard food: FOOD-DOUBLE, FOOD-PENTA, FOOD-TRIM, FOOD-RUSH, FOOD-STAR, and FOOD-BOMB.
- **FR-002**: FOOD-DOUBLE MUST grow the snake by exactly 2 segments and increment the score by 2 when consumed (score proportional to growth).
- **FR-003**: FOOD-PENTA MUST grow the snake by exactly 5 segments and increment the score by 5 when consumed; it MUST appear noticeably rarer than FOOD-DOUBLE (score proportional to growth).
- **FR-004**: FOOD-TRIM MUST remove the 5 rearmost tail segments (or reduce to 1 segment if fewer than 6 exist); score is unchanged.
- **FR-005**: FOOD-RUSH MUST remove 5 tail segments (capped at minimum 1 segment) AND increase the snake's tick rate by 1.5× for exactly 5 seconds; after 5 seconds the tick rate resumes to the current score-speed-adjusted base delay (if the score-based speedup fired during the boost, the player keeps that progress); consuming a second FOOD-RUSH while boosted resets the 5-second timer without altering the stored base delay.
- **FR-006**: FOOD-STAR MUST be worth 10 score points and MUST NOT grow the snake; FOOD-STAR MUST move directionally across the grid — it picks a direction and advances one cell at a time at half the current snake tick rate; when the next cell in its current direction is blocked (snake body, obstacle, or wall), FOOD-STAR picks a new random valid direction; if all four directions are blocked, it teleports to a random empty cell.
- **FR-007**: FOOD-BOMB MUST remove the last 5 tail segments (capped at snake length − 1), place each removed segment's cell as a permanent obstacle tile for the remainder of the round, and increment the score by 10; the snake's head is never removed.
- **FR-008**: Obstacle tiles created by FOOD-BOMB MUST trigger game over on snake head collision, identical to wall collision.
- **FR-009**: Each food type MUST be visually distinct from all others and from the standard food, using a unique color and shape combination that a child aged 8–14 can distinguish at a glance.

#### Event Card Manager

- **FR-010**: The event card manager MUST maintain a queue of exactly 10 pending event cards at all times during an active game round.
- **FR-010a**: The HUD MUST display a visual indicator of the current active card showing which food types remain to be consumed (e.g., small food icons with a count); this helps child players understand what to chase and anticipate the next card.
- **FR-011**: Each event card MUST define a list of food items (type + quantity) to place simultaneously on the map in empty cells.
- **FR-012**: A new event card MUST NOT become active until ALL food items from the current card have been consumed by the snake.
- **FR-013**: When a card is consumed, the manager MUST immediately generate and append a new card to the back of the queue so the queue stays at 10.
- **FR-014**: Card generation MUST use a weighted-rarity system: common foods (FOOD-DOUBLE, FOOD-TRIM, standard) are included frequently; uncommon foods (FOOD-RUSH, FOOD-STAR) appear moderately; rare foods (FOOD-PENTA, FOOD-BOMB) appear infrequently.
- **FR-015**: The standard food (original yellow pellet) MUST remain available and may appear in event cards.

#### Telemetry & Future Server Integration

- **FR-016**: The event manager MUST maintain a rolling telemetry history of the last 10 consumed cards; each record MUST include: card composition, time to consume (seconds), snake length at consumption, cumulative score.
- **FR-017**: Card generation MUST be delegated to a `fetchNextCard(telemetry)` function; currently this function returns a locally generated card; replacing its implementation MUST require no changes to event management or gameplay logic.
- **FR-018**: The telemetry data structure MUST be serializable (no circular references, no DOM objects) so it can be sent to a server in the future with no transformation.

### Key Entities

- **FoodItem**: A food instance on the map — type (STANDARD | DOUBLE | PENTA | TRIM | RUSH | STAR | BOMB), grid position, and for FOOD-STAR: an autonomous movement timer.
- **EventCard**: A list of FoodItem definitions (type + count); tracks how many foods remain unconsumed.
- **CardQueue**: An ordered list of up to 10 EventCard objects; always replenished to 10 after each consumption.
- **TelemetryRecord**: Card composition, time-to-consume (seconds), snake length at consumption, cumulative score at consumption.
- **CardHUDIndicator**: A display element showing the remaining food types and counts from the active card; updates in real time as each food is consumed.
- **TelemetryHistory**: Rolling list of the last 10 TelemetryRecord objects.
- **Obstacle**: A permanent grid cell that triggers game over on head collision; stores its grid position; rendered distinctly from food and snake.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A child playing the game can identify each food type visually without reading any tooltip — the color and shape alone communicate the food type within 1–2 glances.
- **SC-002**: No two consecutive 10-card sequences feel identical — at least 3 distinct card compositions appear across every 10-card run.
- **SC-003**: FOOD-STAR is catchable in normal gameplay: because it moves directionally (not randomly), the player can predict its path and intercept it in under 10 snake moves from a reasonable starting position at base tick speed.
- **SC-004**: The transition between event cards introduces zero perceptible delay — new foods appear on the same tick that the last food of the previous card is consumed.
- **SC-005**: Rare foods (FOOD-PENTA, FOOD-BOMB) appear in no more than 15% of generated cards across a session of 50+ cards.
- **SC-006**: The telemetry history object is correctly populated with all required fields after every card consumption, verifiable by inspection in the browser console.
- **SC-007**: Swapping out the `fetchNextCard` implementation requires changes to exactly one function — no other file or gameplay logic is touched.

## Assumptions

- Obstacles created by FOOD-BOMB persist for the full duration of the round; they are cleared when a new game round starts.
- FOOD-RUSH speed boost interacts with the existing tick-based speed-up system non-destructively: the stored "pre-boost" base delay is updated whenever a score-based speedup fires during the boost; when the boost expires the player's earned speed progress is preserved (the tick restores to the current score-speed-adjusted delay, not the delay from when Rush was eaten).
- FOOD-STAR moves on a separate timer independent of the snake tick; it does not interact with score-based speed-up.
- A card may have more than one food of the same type (e.g., two FOOD-DOUBLE items simultaneously on the map).
- The minimum number of foods per card is 1; the maximum is 4 (to avoid overcrowding the map with special effects).
- No touch/mobile support in this feature iteration (consistent with base game assumptions).
- Personal best and score mechanics from the base game remain unchanged.
- Standard food (original yellow pellet) continues to appear via the event card system; the standalone single-food random spawn from the base game is replaced by the event card manager.
- Sound effects are out of scope for this feature.
- The rarity weights (used for card generation) are: STANDARD=70%, FOOD-DOUBLE=12%, FOOD-TRIM=7%, FOOD-RUSH=6%, FOOD-STAR=3%, FOOD-PENTA=1%, FOOD-BOMB=1%.
