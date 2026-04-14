# Specification Analysis Report: Feature 006 — Individual BGM & SFX Audio Controls

**Feature**: `006-audio-controls-screens`  
**Date**: 2026-04-12  
**Artifacts Analyzed**: `spec.md`, `plan.md`, `data-model.md`, `research.md`, `tasks.md`, `game.js`  
**Constitution Checked**: `.specify/memory/constitution.md` v1.0.0  

---

## Findings Table

| ID  | Category              | Severity | Location(s)                                   | Summary                                                                                                                                                               | Recommendation                                                                                                                                         |
|-----|-----------------------|----------|-----------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------------------------------------------------------------------------------------------------------------------------|
| C1  | Constitution          | CRITICAL | spec.md Assumptions, plan.md §Constitution Check, research.md Q6 | Constitution Principle III ("Child-Friendly UX") is explicitly **NON-NEGOTIABLE** and mandates buttons ≥ 48×48 px with a clear text label. All four new buttons are emoji-only at 22 px font with no text label and no accessible tap target. Plan/research label this an "accepted deviation per feature 005 precedent," but the constitution does not permit informal precedent overrides of NON-NEGOTIABLE principles. | Either (a) amend the constitution via the governance process to carve out supplemental HUD audio controls, or (b) redesign buttons to include a visible text label and meet the 48×48 px minimum. A silent deviation does not satisfy a NON-NEGOTIABLE principle. |
| C2  | Constitution          | CRITICAL | constitution.md §Design Standards, tasks.md T001–T006, T008–T009 | Design Standards state "All interactive elements MUST be keyboard-focusable." Phaser `text` objects with `.setInteractive()` are **mouse/pointer only** — they are unreachable by `Tab` or keyboard navigation. No task addresses keyboard accessibility for the four new buttons. Same pre-existing gap on `muteTxt` (feature 005) now expands to four elements. | Add a task to wire `pointerdown`-equivalent keyboard logic (e.g., Phaser `key.on('down', ...)`) or acknowledge and amend the constitution as part of a formal accessibility decision. |
| H1  | Implementation Defect | HIGH     | tasks.md T001                                 | T001 describes inserting the new helpers "after the existing `setSfxMutePref` function block." `setSfxMutePref` **does not yet exist** — it is the function being created by T001. The correct anchor is the existing `setMutePref()` function (game.js line 220). An implementor following the task description exactly will search for a non-existent symbol and have no reliable insertion point. | Fix T001 wording to read: "after the existing `setMutePref()` function block (game.js ~line 220, key `snakeMuted`)." |
| H2  | Implementation Defect | HIGH     | plan.md Change 2 (SFX button pointerdown)     | The `sfxBtn` `pointerdown` handler calls `setSfxMutePref(!isSfxMuted())` and then immediately reads `isSfxMuted()` again to set the icon text. If the `setSfxMutePref` write fails silently (the `catch (e) {}` swallows errors), the second read returns the **old** value, leaving the button icon in the wrong (pre-toggle) state — a silent icon desync on storage failure. The same pattern exists in the LegendScene SFX button. | Capture the new state in a local variable before the two locale operations: `const newMuted = !isSfxMuted(); setSfxMutePref(newMuted); sfxBtn.setText(newMuted ? '🔕' : '🔔');` — eliminates the double-read risk entirely. Matches the `bgmBtn` pattern which already uses `const nowMuted = !isMuted()`. |
| H3  | Plan–Spec Alignment   | HIGH     | plan.md Change 6, spec.md FR-010, US2 AC-3    | The plan states LegendScene buttons "write to localStorage only — no interaction with any Phaser sound object." This is architecturally correct per research Q2, but the spec's FR-010 says changes "MUST be immediately reflected on the Game screen when the player navigates back." The implementation only applies preferences on the **next** `GameScene.create()` call. The phrase "immediately" in FR-010 is ambiguous: it could be read as "without a full page reload" (satisfied) or as "real-time sync across active scenes" (not satisfied, and architecturally impossible without `scene.launch()`). No task documents or tests the "navigate back → verify state" path explicitly. | Clarify FR-010 wording to read "reflected when the player returns to the Game screen (i.e., on the next `GameScene.create()` call, without requiring a page reload)." Add this as an explicit acceptance check in T006 or T009. |
| M1  | Task Quality          | MEDIUM   | tasks.md T007                                 | T007 is a verification-only task with no code output: "add a code comment noting persistence is handled by helper reads in `create()` if both are already present." A task that may produce zero observable change is untestable and its "Checkpoint" cannot be objectively verified by CI or a reviewer. | Either (a) promote T007's acceptance criterion into T009's smoke-test checklist and delete T007 as a standalone task, or (b) make it a mandatory code comment with required phrasing so it has a concrete, verifiable output. |
| M2  | Spec Ambiguity        | MEDIUM   | spec.md Edge Cases §3                         | Edge case: "When a new game round starts after the player muted SFX on the Legend screen, the SFX muted preference MUST be respected from the first tick." This is satisfied architecturally (isSfxMuted() is read at each `sound.play()` call), but no task explicitly validates this specific cross-screen-then-play scenario. T009's smoke test does not mention starting a new round immediately after a Legend screen preference change. | Add a sub-step to T009: "After toggling SFX on the Legend screen, start a new game and verify no SFX plays on the first food contact." |
| M3  | Data Model Gap        | MEDIUM   | data-model.md §State Transitions, plan.md Change 2 | The data model's State Transitions note that `GameScene.tick()` contains a BGM cold-start recovery path guarded by `!isMuted()`. After Change 3 replaces `this.sound.setMute()` with `this.music.setMute()`, the tick guard becomes "the SOLE fallback for starting BGM when AudioContext was locked." The data model explicitly warns this guard MUST be preserved. However, no task confirms that the tick guard is untouched (it's not part of any edit), and T002 touches the same `create()` function area. | Add a checkpoint note to T002: "Confirm the `tick()` BGM cold-start guard at `if (!this.musicStarted && !isMuted())` (game.js ~line 478) is NOT modified by this change." |
| M4  | Spec Completeness     | MEDIUM   | spec.md §Assumptions                          | The spec assumes "The Legend screen (`LegendScene`) already exists in the codebase (feature 003 delivered it)" but assigns no verification step to confirm that `LegendScene.create()` has the assumed structure (title text, `entries` array) before insertion. The plan's Change 6 inserts code after a specific title block. If feature 003 refactored LegendScene between then and now, the anchor point is wrong. | Add a pre-implementation verification note in T006: "Verify LegendScene.create() contains the 'Legenda' title `this.add.text()` block and the `entries` array before inserting buttons." (This is confirmed against current game.js; the check is an implementation-time safeguard.) |
| L1  | Task Precision        | LOW      | tasks.md T008                                 | T008 is a visual layout check with the criterion "confirm no element origins collide." Origin points are mathematical center/anchor points, not bounding boxes. Two objects with non-overlapping bounding boxes can have colliding origin points, and vice versa. The wording is imprecise. | Reword to: "Confirm that `bestTxt` right edge (≈ `CANVAS_W - 100`) and `bgmBtn` left edge (≈ `CANVAS_W - 90`) have at least 6 px gap, and `sfxBtn` right edge (≈ `CANVAS_W - 22`) is within the canvas." |
| L2  | Terminology Drift     | LOW      | spec.md vs plan.md / data-model.md            | spec.md uses "icon buttons" throughout. plan.md and data-model.md use "text buttons" (Phaser `this.add.text()` objects styled as buttons). These are functionally the same implementation but the terminology differs, which could mislead future contributors into thinking image-based icons were considered. | Standardize on "emoji text button" or "Phaser text button" across all artifacts. |
| L3  | Task Completeness     | LOW      | tasks.md T009                                 | T009's independent test ("play through a full round... toggle BGM and SFX independently on both Game and Legend screens") does not specify testing the **Legend → Game → play** sequence (mute SFX on Legend, start game, confirm SFX muted from first tick). This overlaps with M2. | Combine with M2 recommendation: add the cross-screen scenario explicitly to T009. |
| L4  | Plan Truncation       | LOW      | plan.md Change 6                              | The plan's Change 6 text is cut off mid-sentence at "// SFX toggle button (top-right, same row as title)" — the `lgSfxBtn` code block is missing from the plan file. The data-model fills the gap (positions, labels, reads/writes are defined there) but the plan itself is incomplete. | Complete the `lgSfxBtn` code block in plan.md Change 6 to match the data-model specification and the `lgBgmBtn` pattern. |

---

## Coverage Summary Table

| Requirement Key | Has Task? | Task IDs            | Notes                                              |
|-----------------|-----------|---------------------|----------------------------------------------------|
| FR-001          | ✅        | T003                | Game screen two-button HUD                         |
| FR-002          | ✅        | T006                | Legend screen two-button insert                    |
| FR-003          | ✅        | T002, T003          | BGM toggle: instance-level `music.setMute()`       |
| FR-004          | ✅        | T004, T005          | SFX guards in `applyFoodEffect` and `gameOver()`   |
| FR-005          | ✅        | T003, T006          | Icon text updated on toggle in each scene          |
| FR-006          | ✅        | T001, T003, T007    | `snakeMuted` persisted; read in `create()`         |
| FR-007          | ✅        | T001, T004, T005, T007 | `snakeSfxMuted` persisted; guard at play sites  |
| FR-008          | ✅        | T001                | Two independent keys; invariant documented in DM   |
| FR-009          | ✅        | T001, T007          | Helper returns `false` when key absent (fail-open) |
| FR-010          | ✅⚠️      | T006, T007          | Satisfied via `create()` re-read; "immediately" ambiguous — see H3 |
| FR-011          | ✅        | T008                | Visual layout verify                               |
| FR-012          | ✅        | T006                | Same `x` positions as Game screen used             |
| SC-001          | ✅        | T003, T004          | Independent BGM/SFX toggle on Game screen          |
| SC-002          | ✅        | T003, T004, T005    | Independent SFX/BGM toggle on Game screen          |
| SC-003          | ✅⚠️      | T006, T007          | See H3 — "immediately" needs clarification         |
| SC-004          | ✅        | T001, T007          | Both prefs survive reload                          |
| SC-005          | ✅        | T008                | HUD layout check                                   |
| SC-006          | ✅        | T003, T006          | Both buttons on both screens                       |

---

## Constitution Alignment Issues

| Principle | Status | Finding ID | Detail |
|-----------|--------|------------|--------|
| I. Browser-Native, Zero Dependencies | ✅ Pass | — | localStorage + Phaser sound API; no new deps |
| II. Game-Loop Integrity | ✅ Pass | — | Button handlers are UI callbacks, not tick mutations |
| III. Child-Friendly UX | ❌ **VIOLATION** | C1, C2 | NON-NEGOTIABLE: buttons < 48×48 px, no text labels, not keyboard-focusable |
| IV. Responsive Single-File Delivery | ✅ Pass | — | No new assets or network requests |
| V. Gameplay Simplicity & Clean Separation | ✅ Pass | — | No game-loop or state-model changes |

**Constitution verdict**: 3 of 5 principles pass. Principle III has **two NON-NEGOTIABLE violations** that require explicit resolution before implementation.

---

## Unmapped Tasks

None. All 9 tasks (T001–T009) map to at least one functional requirement or success criterion.

---

## Metrics

| Metric | Value |
|--------|-------|
| Total Functional Requirements | 12 (FR-001 – FR-012) |
| Total Success Criteria | 6 (SC-001 – SC-006) |
| Total Tasks | 9 (T001 – T009) |
| Requirements Coverage (≥1 task) | 100% (12/12 FRs, 6/6 SCs) |
| Ambiguity Count | 1 (FR-010 "immediately") |
| Duplication Count | 0 |
| Critical Issues | 2 (C1, C2) |
| High Issues | 3 (H1, H2, H3) |
| Medium Issues | 4 (M1, M2, M3, M4) |
| Low Issues | 4 (L1, L2, L3, L4) |
| **Total Findings** | **13** |

---

## Implementation Readiness Assessment

The feature is **architecturally sound and internally consistent** across spec, plan, data-model, and research. The six code changes are well-scoped to `game.js` with no new files or dependencies. The 100% FR/SC coverage by tasks is a genuine strength.

**Blockers before `/speckit.implement`**:
1. **C1 and C2** (Constitution Principle III violations) — NON-NEGOTIABLE. The project constitution cannot be informally overridden. Either the constitution must be amended via its governance process, or the button design must change. This is the sole hard blocker.
2. **H1** — T001 anchor function name is wrong. Fix before implementation to avoid implementor confusion.
3. **H2** — SFX button double-read pattern is a latent icon-desync bug. Fix in the plan before coding.

**Safe to proceed on** (if CRITICAL issues are accepted as-is or resolved):  
H3 (ambiguity only, no broken behavior), M1–M4, L1–L4.

---

## Next Actions

1. **Resolve C1 and C2 first**: Either open a constitution amendment PR (Governance §MINOR) to add a carve-out for supplemental emoji HUD controls and a keyboard-accessibility exception for mouse-only games, **or** redesign the four buttons to include visible text labels and ≥48×48 px tap targets.
2. **Fix H1**: Edit tasks.md T001 — replace `setSfxMutePref` with `setMutePref()` as the insertion anchor.
3. **Fix H2**: Edit plan.md Change 2 (`sfxBtn` handler) and Change 6 (`lgSfxBtn` handler) to use a captured local variable instead of double `isSfxMuted()` reads.
4. **Clarify H3**: Edit spec.md FR-010 to be explicit that "immediately reflected" means "on the next scene start, without page reload."
5. **After CRITICAL resolution**: Run `/speckit.implement` — all tasks are precise enough for implementation.

---

Would you like me to suggest concrete remediation edits for the top issues (C1, C2, H1, H2, H3)?
