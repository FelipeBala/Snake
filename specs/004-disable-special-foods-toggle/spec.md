# Feature Specification: Disable Special Foods Toggle

**Feature Branch**: `004-disable-special-foods-toggle`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "No menu de legenda, permita clicar em um botão e desabilitar todas as comidas exceto a Normal no jogo. Caso o usuário clique para desabilitar as comidas especiais, todos os cards devem ser de tamanho 1 (uma comida por vez). Lembre da decisão do usuário ao reiniciar o jogo."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Disable Special Foods from the Legend Screen (Priority: P1)

A player opens the LegendScene before starting a game. They see a clearly labelled toggle button (e.g., "Desabilitar Comidas Especiais" / "Habilitar Comidas Especiais") near the bottom of the legend. The player clicks it to disable all special food types. The button updates its label to reflect the current state. The player presses "Voltar" and starts a game — only Normal food appears throughout the entire round. Cards (food event slots) are each limited to 1 food at a time. The next time they open the game, the special foods are still disabled and the toggle reflects that state without them having to set it again.

**Why this priority**: This is the entire feature. All other stories are consequences of this core toggle action.

**Independent Test**: Open `index.html`, navigate to the LegendScene, click the toggle button to disable special foods. Start a game and verify that only Normal food spawns. Restart the browser and verify the disabled state is remembered.

**Acceptance Scenarios**:

1. **Given** the LegendScene is open, **When** it renders for the first time, **Then** a visible toggle button labelled "Desabilitar Comidas Especiais" is present and special foods are enabled by default.
2. **Given** the LegendScene is open and special foods are enabled, **When** the player clicks the toggle button, **Then** the button label changes to "Habilitar Comidas Especiais" and special foods are marked as disabled.
3. **Given** the LegendScene is open and special foods are disabled, **When** the player clicks the toggle button, **Then** the button label changes back to "Desabilitar Comidas Especiais" and special foods are marked as enabled.
4. **Given** special foods are disabled and a game round begins, **When** food spawns, **Then** only Normal food type appears — no Duplo, Penta, Aparo, Turbo, Estrela, or Bomba foods spawn.
5. **Given** special foods are enabled and a game round begins, **When** food spawns, **Then** all food types may appear according to their regular probability rules.
6. **Given** the player has disabled special foods and the browser/tab is closed and reopened, **When** the LegendScene loads, **Then** the toggle reflects the disabled state already — no extra action required from the player.
7. **Given** the player has disabled special foods, **When** a game round begins, **Then** all food event card slots are capped at a maximum quantity of 1 food at a time.
8. **Given** special foods are enabled (default), **When** a game round begins, **Then** food event card sizes follow their normal configured values (unchanged from current behaviour).

---

### User Story 2 — Visual Feedback on Disabled Entries in the Legend (Priority: P2)

When special foods are disabled, the player can still see all legend entries in the LegendScene, but the disabled food entries are visually distinguished (e.g., greyed out or with a strikethrough label) so the player understands which foods will not appear in their next game.

**Why this priority**: The toggle already changes gameplay behaviour (P1). Visual feedback in the legend is a quality-of-life improvement that makes the current state immediately obvious without starting a game. It enhances understandability but is not required for the feature to work.

**Independent Test**: Disable special foods via the toggle. Without leaving the LegendScene, verify that all non-Normal food entries appear visually distinct from the Normal entry (e.g., greyed out or with reduced opacity).

**Acceptance Scenarios**:

1. **Given** special foods are disabled, **When** the LegendScene renders, **Then** all food entries except Normal are displayed with reduced opacity or a visual indicator showing they are inactive.
2. **Given** special foods are enabled, **When** the LegendScene renders, **Then** all food entries appear at full opacity/normal style.
3. **Given** the player toggles special foods off and then on again within the same LegendScene session, **When** the toggle is clicked back to enabled, **Then** all entries return to their normal visual style immediately.

---

### Edge Cases

- If the stored preference value is corrupted or unreadable, the system defaults to special foods **enabled** (safe default).
- The toggle does not affect the legend display structure — all entries remain listed; only their visual state and gameplay behaviour change.
- The card size cap of 1 applies **only** when special foods are disabled; re-enabling restores card sizes to their normal values immediately for the next game session.
- The obstacle entry in the legend (FOOD-BOMB tiles) is unaffected by the toggle — it is informational only.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The LegendScene MUST include a toggle button that enables or disables all special food types (all types except Normal / STANDARD).
- **FR-002**: The toggle button MUST display a label that reflects the current state: "Desabilitar Comidas Especiais" when special foods are enabled, and "Habilitar Comidas Especiais" when special foods are disabled.
- **FR-003**: When special foods are disabled, the game MUST spawn only Normal (STANDARD) food during any game round.
- **FR-004**: When special foods are disabled, every food event card's maximum quantity MUST be capped at 1 food item at a time.
- **FR-005**: When special foods are enabled (default), food spawning and card quantities MUST follow their normal configured rules — no change to existing behaviour.
- **FR-006**: The player's preference (enabled / disabled) MUST be persisted across browser sessions so it is remembered after the page is closed and reopened.
- **FR-007**: If the stored preference is absent, corrupted, or unreadable, the system MUST default to special foods **enabled**.
- **FR-008**: The toggle button MUST meet the minimum 48×48 px touch/click target size defined in the project constitution (Principle III).
- **FR-009**: When special foods are disabled, the LegendScene MUST visually distinguish the non-Normal food entries (e.g., reduced opacity) from the Normal entry.
- **FR-010**: The visual distinction (FR-009) MUST update immediately when the toggle is clicked, without requiring a page reload or scene transition.
- **FR-011**: The card size cap of 1 (FR-004) MUST apply from the moment a new game round starts after the preference is set; it does not retroactively change an in-progress round.

### Key Entities

- **SpecialFoodsPreference**: A persisted boolean value representing whether special foods are enabled (true, default) or disabled (false). Stored client-side across sessions.
- **FoodCard / EventCard**: A slot in the active food event system that limits how many of a given food type can exist simultaneously. Quantity is capped at 1 when special foods are disabled.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: The toggle button is reachable from the LegendScene in 1 click — no sub-menu or additional navigation required.
- **SC-002**: After toggling special foods off and starting a game, 0 special food items spawn throughout the entire round in 100% of rounds tested.
- **SC-003**: After toggling special foods off, each food card slot contains at most 1 food item at a time in 100% of rounds tested.
- **SC-004**: The player's preference survives a full browser close-and-reopen cycle — verified by closing the tab, reopening `index.html`, and confirming the toggle reflects the previously saved state.
- **SC-005**: Re-enabling special foods restores normal food spawning and card quantities in the immediately following game round, with no residual capping.
- **SC-006**: The visual distinction for disabled food entries in the legend is visible without any interaction, immediately after opening the LegendScene when special foods are disabled.

## Assumptions

- The existing LegendScene (feature 003-legend-screen) is already implemented and available as the base for this feature.
- The food spawning system reads food type configuration at the start of each round, making it straightforward to filter out special food types at that point.
- Food event cards (from feature 002-special-foods-event-manager) already have a configurable quantity/size parameter that can be capped to 1.
- Client-side persistent storage (e.g., browser localStorage) is acceptable for saving the preference — no server-side persistence is required.
- "Normal food" refers exclusively to the STANDARD food type (amarelo). All other types (Duplo, Penta, Aparo, Turbo, Estrela, Bomba) are considered "special" for the purposes of this feature.
- The toggle is available exclusively in the LegendScene in this iteration; it is not accessible from within an active game round.
