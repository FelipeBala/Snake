# Feature Specification: Individual BGM & SFX Audio Controls on Game and Legend Screens

**Feature Branch**: `006-audio-controls-screens`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "Coloque na tela de Legenda a opção no canto superior direito (igual a tela de jogo) de desativar o audio de background (clicando no icone) e de desativar o sfx (clicando no icone). Coloque na tela de jogo a opção de desativar o sfx igual a tela de Legenda."

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Separate BGM and SFX Controls on the Game Screen (Priority: P1)

A player wants to be able to mute the background music independently from the sound effects during gameplay. Currently the Game screen has a single mute button that silences all audio. This story replaces it with two separate icon buttons: one for BGM and one for SFX, both visible in the top-right corner of the HUD.

**Why this priority**: The Game screen is always active during play. Giving the player independent control over BGM and SFX (e.g., keeping music off but SFX on for feedback) is the core value of this feature.

**Independent Test**: Open the game, start a round. Verify there are two audio icon buttons in the HUD top-right (BGM and SFX). Click the BGM button — music stops, icon updates, SFX still plays when eating food. Click the SFX button — food and collision sounds stop, music still plays. Verify both can be toggled independently without affecting each other.

**Acceptance Scenarios**:

1. **Given** the game is running and both audio channels are on, **When** the player clicks the BGM icon, **Then** background music stops immediately, the BGM icon reflects the muted state, and food/collision sounds continue to play normally.
2. **Given** the game is running and both audio channels are on, **When** the player clicks the SFX icon, **Then** food and collision sounds are silenced, the SFX icon reflects the muted state, and background music continues uninterrupted.
3. **Given** BGM is muted and SFX is active, **When** the player clicks the BGM icon again, **Then** background music resumes, and SFX state is unchanged.
4. **Given** SFX is muted, **When** the snake eats food or collides with a wall, **Then** no sound effect plays.

---

### User Story 2 - BGM and SFX Controls on the Legend Screen (Priority: P2)

A player browsing the Legend screen wants the same audio controls available there, in the top-right corner — matching the Game screen layout. This allows the player to adjust audio preferences before or after a round without needing to be in the game.

**Why this priority**: The Legend screen is a pause/reference screen. Audio control there is a convenience feature that matches the visual contract established by US1, but it is not blocking — gameplay is unaffected without it.

**Independent Test**: Open the Legend screen. Verify BGM and SFX icon buttons appear in the top-right corner. Click each button and verify the icon updates and the corresponding audio channel responds (music stops/resumes, SFX icon state changes). Verify the Game screen reflects the same state when navigating back.

**Acceptance Scenarios**:

1. **Given** the Legend screen is open and BGM is playing, **When** the player clicks the BGM icon, **Then** background music stops and the icon shows the muted state.
2. **Given** the Legend screen is open, **When** the player clicks the SFX icon, **Then** the SFX icon updates to the muted state, and when returning to the game, food/collision sounds are silenced.
3. **Given** the player muted BGM on the Legend screen, **When** the player navigates back to the game, **Then** the BGM button on the Game screen also shows the muted state and music remains off.

---

### User Story 3 - Preferences Persist Across Sessions (Priority: P3)

A player who prefers playing with music off but SFX on expects those choices to be saved and restored automatically the next time they open the game — without needing to reconfigure every session.

**Why this priority**: Persistence is a quality-of-life concern. The feature delivers value without it (US1 and US2 are functional with in-session state only), but persistence completes the experience.

**Independent Test**: Set BGM to muted and SFX to active in the game. Close the browser tab. Re-open `index.html`. Verify that the BGM button shows the muted state, music does not auto-play, and food SFX work normally.

**Acceptance Scenarios**:

1. **Given** the player muted BGM and left SFX active, **When** the browser is closed and reopened, **Then** BGM remains muted and SFX remains active without any user action.
2. **Given** the player muted SFX and left BGM active, **When** the browser is closed and reopened, **Then** SFX remains muted and background music plays automatically.
3. **Given** no preference has been saved (first visit), **When** the game loads, **Then** both BGM and SFX are active by default.

---

### Edge Cases

- What happens if the player rapidly clicks both toggle buttons? Each toggle must respond independently without interfering with the other.
- What happens if the browser blocks audio autoplay (AudioContext locked)? BGM must respect the muted preference when it does unlock, and SFX buttons must still display the correct state.
- What happens when a new game round starts after the player muted SFX on the Legend screen? The SFX muted preference must be respected from the first tick.
- What if localStorage is unavailable (private browsing, storage full)? Both toggles must degrade gracefully: in-session state works, no error is thrown, next reload defaults to both active (fail-open).

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The Game screen MUST display two separate audio icon buttons in the HUD top-right corner: one for BGM and one for SFX.
- **FR-002**: The Legend screen MUST display two separate audio icon buttons in its top-right corner: one for BGM and one for SFX, using the same visual style as the Game screen.
- **FR-003**: Clicking the BGM button MUST toggle background music on/off without affecting SFX playback.
- **FR-004**: Clicking the SFX button MUST toggle all food and collision sound effects on/off without affecting BGM playback.
- **FR-005**: Each button icon MUST visually reflect the current state (active vs. muted) at all times.
- **FR-006**: BGM mute preference MUST be persisted to browser storage and restored on the next page load.
- **FR-007**: SFX mute preference MUST be persisted to browser storage and restored on the next page load.
- **FR-008**: Both preferences MUST be persisted independently (muting BGM does not affect the stored SFX preference and vice versa).
- **FR-009**: When both BGM and SFX are active by default (no stored preference), this default MUST be treated as "unmuted" without writing to storage.
- **FR-010**: Changes made on the Legend screen MUST be immediately reflected on the Game screen when the player navigates back, without requiring a page reload.
- **FR-011**: The two buttons on the Game screen MUST fit within the existing HUD height (top bar) without overlapping existing HUD elements (score, personal best).
- **FR-012**: The two buttons on the Legend screen MUST be positioned consistently with the top-right corner convention established in the Game screen.

### Key Entities

- **BGM Preference**: A persisted boolean flag indicating whether background music is muted. Default: unmuted. Storage key: distinct from SFX preference.
- **SFX Preference**: A persisted boolean flag indicating whether all sound effects (food, collision) are muted. Default: unmuted. Storage key: distinct from BGM preference.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: A player can silence only the background music while food and collision SFX remain audible — verified in under 5 seconds of interaction.
- **SC-002**: A player can silence only the SFX while background music continues playing — verified in under 5 seconds of interaction.
- **SC-003**: Audio preference changes made on the Legend screen are reflected immediately when returning to the Game screen (zero re-configuration needed).
- **SC-004**: On page reload, both audio preferences are restored to their last saved state with no user action required.
- **SC-005**: No existing HUD elements (score, personal best text) are displaced or obscured by the new control buttons.
- **SC-006**: Both audio control buttons are visible and interactive on both the Game screen and the Legend screen.

## Assumptions

- The Legend screen (`LegendScene`) already exists in the codebase (feature 003 delivered it).
- The Game screen already has a single combined audio mute button from feature 005: this existing button will be repurposed as the BGM-only toggle, and a new SFX toggle will be added alongside it.
- The existing `snakeMuted` localStorage key (feature 005) will be reused as the BGM preference key; a new key will be introduced for SFX without modifying existing keys.
- Icons will use emoji characters consistent with the existing mute button approach (no image assets required).
- The Game screen HUD has sufficient horizontal space to accommodate two icon buttons replacing the current single button, given the `bestTxt` repositioning already done in feature 005.
- The Legend screen layout can accommodate two icon buttons in its top-right corner without redesigning the existing legend content.
- Both screens share the same browser session, so a localStorage write on one screen is immediately readable by the other without page reload.
- Mobile / touch support is out of scope; the buttons target mouse/pointer input only (consistent with current game controls).
