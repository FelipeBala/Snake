# Feature Specification: Audio — Background Music & Sound Effects

**Feature Branch**: `005-audio-music-sfx`  
**Created**: 2026-04-12  
**Status**: Draft  
**Input**: User description: "Coloque uma música de fundo no jogo e efeitos especiais de audio/game ao comer as comidas e ao colidir com a parede ou com o corpo da cobra. Tudo precisa ser licenças open-source com direito a uso comercial. Analise quais fazem mais sentido em cada situação."

## User Scenarios & Testing *(mandatory)*

### User Story 1 — Background Music During Gameplay (Priority: P1)

A child starts a game round. Within one second, a looping background track begins playing — upbeat, energetic, and appropriate for an action puzzle game aimed at children 8-14. The music loops seamlessly without any audible gap. If the player closes the browser mid-game and reopens it, the music starts again with the next game. The music is never forced on the player — a clearly visible mute button in the HUD lets them silence it instantly, and the game remembers their preference for future sessions.

**Why this priority**: Background music is the highest-impact audio element — it sets the emotional tone for the entire game, improves engagement, and is independently deliverable without any SFX work.

**Independent Test**: Open `index.html`, start a game. Verify music begins within 1 second of the round starting, loops without gaps, and stops when the game ends. Click the mute button — verify music stops immediately and the button updates. Reload the page — verify mute state is remembered.

**Acceptance Scenarios**:

1. **Given** a game round starts, **When** the first game tick fires, **Then** background music begins playing in a loop.
2. **Given** music is playing, **When** the snake collides and the game ends, **Then** music stops immediately.
3. **Given** music is playing, **When** the player clicks the mute button, **Then** music stops, the button changes to an "unmute" indicator, and the mute preference is saved.
4. **Given** the player muted music in a previous session, **When** the game loads, **Then** music does not auto-play — muted state is restored from saved preference.
5. **Given** music is muted, **When** the player clicks the unmute button, **Then** music resumes and the unmute preference is saved.
6. **Given** the game reaches the Game Over screen, **When** it renders, **Then** background music is silent.

---

### User Story 2 — Food Sound Effects (Priority: P2)

While playing, every food the snake eats produces a distinct audio feedback sound. The effect varies by food type to reinforce the visual and gameplay difference between food types — collecting a rare Penta food should feel noticeably more exciting than picking up a Normal food. All sounds are short (under 1 second) so they never block gameplay.

**Why this priority**: Food SFX directly reinforce gameplay feedback — they help children understand cause and effect (eat this → hear that). Each food type already has a distinct visual; audio should match. Deliverable independently from background music.

**Independent Test**: With music muted (to isolate), start a game. Eat one food of each available type. Verify each type triggers a distinct, clearly audible sound. Verify the sound does not delay or interrupt snake movement.

**Acceptance Scenarios**:

1. **Given** the snake eats a Normal (STANDARD) food, **When** the food is consumed, **Then** a short pleasant "pop" or "coin" sound plays.
2. **Given** the snake eats a Penta food, **When** the food is consumed, **Then** a more elaborate ascending "power-up" sound plays, noticeably different and more exciting than Normal.
3. **Given** the snake eats a Turbo (RUSH) food, **When** the food is consumed, **Then** a fast "whoosh" or speed-up sound plays, conveying velocity.
4. **Given** the snake eats a Estrela (STAR) food, **When** the food is consumed, **Then** a sparkle or twinkle sound plays, conveying rarity and magic.
5. **Given** the snake eats a Bomba (BOMB) food, **When** the food is consumed, **Then** a short explosion or impact sound plays, conveying danger/consequence.
6. **Given** the player has muted audio, **When** any food is eaten, **Then** no sound plays.
7. **Given** multiple foods are eaten in rapid succession, **When** sounds overlap, **Then** all can play simultaneously without errors or silence.

---

### User Story 3 — Collision Sound Effect (Priority: P3)

When the snake collides with a wall, its own body, or an obstacle tile, a distinct crash/impact sound plays to reinforce the game-over moment. The sound is brief and clearly communicates failure without being startling or frightening for children.

**Why this priority**: Collision feedback completes the audio loop. It is the least complex (single trigger, single sound), but has the lowest urgency because the visual red-flash already communicates game over. Delivered independently after US1 and US2.

**Independent Test**: Start a game, steer the snake into a wall. Verify a collision sound plays immediately at the moment of impact. Repeat with self-collision and obstacle collision. Verify no sound plays when muted.

**Acceptance Scenarios**:

1. **Given** the snake hits a wall, **When** the collision is detected, **Then** a "crash" or "thud" sound plays immediately.
2. **Given** the snake hits its own body, **When** the collision is detected, **Then** the same collision sound plays.
3. **Given** the snake hits an obstacle tile, **When** the collision is detected, **Then** the same collision sound plays.
4. **Given** the player has muted audio, **When** a collision occurs, **Then** no collision sound plays.
5. **Given** the collision sound plays, **When** the game-over visual transition starts, **Then** the sound and red flash happen simultaneously (not sequenced).

---

### Edge Cases

- If the browser blocks autoplay (common on first visit), music must not throw an error — the game must continue silently and offer the mute/unmute button for the player to manually start audio.
- If an audio file fails to load (network issue, missing file), the game must continue without audio — no error dialogs, no broken gameplay.
- Sound effects that play while music is muted must also be muted — a single mute toggle controls all audio.
- If the player tabs away and returns while music is playing, the browser may pause audio — the game adapts gracefully and does not forcibly restart music on tab focus.
- The collision sound and the game-over red-flash visual must be triggered at the same code point (not sequenced) so they feel simultaneous.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: The game MUST play a looping background music track during active gameplay (from the first game tick until the game ends).
- **FR-002**: Background music MUST stop immediately when the game ends (collision or win).
- **FR-003**: A mute/unmute toggle MUST be visible in the HUD at all times during gameplay, meeting the minimum 48×48 px tap target (per constitution Principle III).
- **FR-004**: The mute state (muted / unmuted) MUST be persisted across browser sessions using client-side storage.
- **FR-005**: When the game loads in a muted state (saved preference), background music MUST NOT auto-play.
- **FR-006**: The game MUST play a distinct short sound effect when the snake eats each food type: a different sound for STANDARD, PENTA, RUSH, STAR, and BOMB.
- **FR-007**: The game MUST play a collision sound when the snake hits a wall, its own body, or an obstacle tile.
- **FR-008**: All audio assets (music track and all SFX) MUST be licensed under an open-source license that permits free commercial use (e.g., CC0, CC BY, CC BY-SA, MIT, or equivalent).
- **FR-009**: All audio assets MUST be bundled with the game (no CDN or network dependency at runtime) so the game works offline (per constitution Principle IV).
- **FR-010**: If any audio asset fails to load or the browser blocks autoplay, the game MUST continue to function normally — gameplay is never blocked by audio errors.
- **FR-011**: A single mute toggle MUST silence all audio simultaneously — background music AND all sound effects.
- **FR-012**: Sound effects MUST play without delaying or interrupting snake movement — audio is always non-blocking relative to the game loop (constitution Principle II).
- **FR-013**: Multiple food sound effects MAY overlap if eaten in rapid succession — overlapping audio must not cause errors.
- **FR-014**: All sound effects MUST be short (perception duration under 1.5 seconds each) so they do not dominate the audio mix.

### Key Entities

- **AudioManager**: Coordinates all game audio — background music playback, SFX playback, mute state, and persistence. Single point of control.
- **MutePreference**: A persisted boolean value (muted / unmuted) stored client-side. Restored on page load.
- **SoundEffect**: A mapping from game event (food type eaten, collision) to an audio asset, with distinct assets per food type.

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Background music begins playing within 1 second of the first game tick in 100% of unmuted game sessions tested.
- **SC-002**: Music stops within 100 ms of game-end detection in 100% of rounds tested.
- **SC-003**: Each of the 5 food types produces a perceptibly distinct audio feedback on consumption — verified by listening with music muted.
- **SC-004**: The mute toggle responds within 1 interaction (single click/tap) and the updated preference persists after browser close and reopen.
- **SC-005**: The collision sound and the game-over red-flash are perceived as simultaneous — no perceptible delay between them.
- **SC-006**: The game loads and plays fully offline (no internet connection) with all audio assets available — verified by disabling network in DevTools.
- **SC-007**: No JavaScript console errors appear related to audio in 100% of tested game sessions, including when autoplay is blocked by the browser.

## Assumptions

- All audio files will be self-hosted in a dedicated `audio/` directory at the project root, keeping the single-file-adjacent delivery model intact.
- Audio file format: MP3 (universal browser support) with OGG fallback if needed — both are supported by the Web Audio API and HTML5 `<audio>`. Phaser 4 handles format negotiation automatically.
- The background music track is a single looping file, not dynamically generated. Duration should be 30–120 seconds before looping.
- Phaser 4's built-in sound manager (`this.sound`) is used — it wraps the Web Audio API and handles autoplay policy gracefully.
- The mute button is placed in the existing HUD bar (top of the game canvas, 40px height) to avoid adding visual complexity elsewhere.
- "Commercial use" license means the game (and any future commercial distribution) may use the assets without royalty payments or attribution requirements beyond what the license states.
- Audio sources such as OpenGameArt.org (CC0/CC-BY), Freesound.org (CC0), and Kenney.nl (CC0) are the primary candidate sources — all offer commercially usable assets.
- Sound effects from Kenney's asset packs are the preferred first-choice source due to their consistent CC0 license, game-appropriate style, and proven reliability.
