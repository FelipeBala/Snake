# Specification Analysis Report: Feature 006 — Individual BGM & SFX Audio Controls

**Feature**: `006-audio-controls-screens`
**Date**: 2026-04-14
**Artifacts Analyzed**: `spec.md`, `plan.md`, `data-model.md`, `research.md`, `tasks.md`, `game.js`
**Iteration**: 3 (post-implementation)

---

## 1. Tasks Completion Status

| Task | Marked | Code Evidence | Actual Status |
|------|--------|---------------|---------------|
| T001 — Add `isSfxMuted()` / `setSfxMutePref()` | ✅ | Lines 226–234: both helpers with try/catch fail-open | ✅ CONFIRMED |
| T002 — `this.sound.setMute()` → `this.music.setMute()` | ✅ | Line 480: init; Line 436: handler | ✅ CONFIRMED |
| T003 — `bgmBtn` + `sfxBtn` in `GameScene` | ✅ | Lines 424–461: two buttons, correct x positions | ✅ CONFIRMED |
| T004 — `if (!isSfxMuted())` on 5 `sfx_eat_*` calls | ✅ | Lines 722–726: all 5 food types guarded | ✅ CONFIRMED |
| T005 — `if (!isSfxMuted())` on `sfx_collision` | ✅ | Line 855: guard present | ✅ CONFIRMED |
| T006 — `lgBgmBtn` + `lgSfxBtn` in `LegendScene` | ✅ | Lines 1075–1107: both buttons, localStorage-only | ✅ CONFIRMED |
| T007 — Confirm persistence comment | ✅ | Lines 478–480: comment present | ✅ CONFIRMED |
| T008 — Manual HUD layout visual verification | ⬜ | Manual browser check required | ⏳ PENDING |
| T009 — Manual smoke test | ⬜ | Manual browser check required | ⏳ PENDING |

**7/9 tasks implemented and confirmed. 2 pending = manual-only verification.**

---

## 2. Requirements Coverage

| Requirement | Status | Implementation Notes |
|-------------|--------|----------------------|
| FR-001: GameScene — two buttons top-right | ✅ | `bgmBtn` at `CANVAS_W-76`, `sfxBtn` at `CANVAS_W-36`, `y = HUD_H/2` |
| FR-002: LegendScene — two buttons, same style | ✅ | `lgBgmBtn` + `lgSfxBtn`, matching x positions, `y = 18` |
| FR-003: BGM button toggles music only | ✅ | `this.music.setMute()` only — decoupled from SFX |
| FR-004: SFX button toggles SFX only | ✅ | All 6 `sound.play()` call sites guarded with `if (!isSfxMuted())` |
| FR-005: Icons reflect current state | ✅ | `setText()` called on every toggle in both scenes |
| FR-006: BGM pref persisted | ✅ | `snakeMuted` key; existing helpers reused |
| FR-007: SFX pref persisted | ✅ | `snakeSfxMuted` key; new helpers added |
| FR-008: Both prefs fully independent | ✅ | Separate keys, no cross-writes anywhere |
| FR-009: Default unmuted = no storage write | ✅ | Absent key returns `false`; never writes on first load |
| FR-010: Legend changes reflect in Game without reload | ✅ | Applied via `localStorage` read in `GameScene.create()` on `scene.start()` |
| FR-011: Buttons fit in HUD height | ✅ (unverified visually) | `y = HUD_H/2` consistent with existing elements — T008 verifies |
| FR-012: LegendScene top-right convention | ✅ | Same x values as GameScene; `y = 18` matches title row |

**12/12 functional requirements implemented. 0 orphaned tasks.**

---

## 3. Success Criteria

| SC | Met? | Notes |
|----|------|-------|
| SC-001: BGM silenced, SFX audible | ✅ | `this.music.setMute(true)` + no global mute |
| SC-002: SFX silenced, BGM plays | ✅ | Guards at all call sites, `this.music` untouched |
| SC-003: Legend changes reflected in Game | ✅ | `GameScene.create()` reads localStorage on `scene.start()` |
| SC-004: Reload restores both prefs | ✅ | Both flags read from localStorage in `create()` |
| SC-005: HUD elements not displaced | ✅ (T008 unverified) | `bestTxt` at `CANVAS_W-100` unchanged |
| SC-006: Both buttons visible on both screens | ✅ | Confirmed in code |

---

## 4. Findings

| ID | Severity | Location | Summary | Actionable in code? |
|----|----------|----------|---------|---------------------|
| I1 | LOW | `game.js` ~line 424 | `bgmBtn`/`sfxBtn` created before `this.music` is assigned. Safe (clicks arrive post-`create()`), but lacked explanatory comment. **Fixed in this iteration.** | ✅ Fixed |
| I2 | MEDIUM | `spec.md` FR-010 | "Immediately reflected" wording is ambiguous vs implementation's `create()` re-read pattern. | ❌ Spec artifact |
| I3 | INFO | `plan.md`, `game.js` | Prior deferred H2 (SFX double-read) resolved by implementation using `const nowSfxMuted = !isSfxMuted()` pattern. | ✅ None needed |
| I4 | LOW | `tasks.md` T001 | T001 anchor references unborn `setSfxMutePref` instead of `setMutePref`. Cosmetic, no runtime impact. | ❌ Tasks artifact |
| I5 | MEDIUM | `spec.md` edge case | Rapid-click: no debounce. Low practical risk — Phaser serializes pointer events. | ✅ None needed |
| I6 | HIGH | `game.js`, constitution | Emoji buttons < 48×48px (Principle III). Accepted deviation documented in `plan.md`. | ✅ Documented deviation |
| I7 | HIGH | `game.js`, constitution | Pointer-only buttons (Principle: keyboard-focusable). Requires design decision: keyboard shortcuts vs constitution amendment. | ❌ Requires design decision |
| I8 | INFO | `data-model.md`, `game.js` | Origin `(0.5, 0.5)` vs `.setOrigin(0.5)` — exact Phaser match. | ✅ None needed |
| I9 | LOW | `spec.md` US2 AC1 | AC1 says "music stops" on Legend screen click — semantically correct but misleading (music already stopped). | ❌ Spec artifact |
| I10 | LOW | `plan.md` change order | Edit #2 before Edit #3 ordering concern — not an issue in practice. | ❌ Plan cosmetic |
| I11 | INFO | `game.js` `gameWon()` | No SFX in `gameWon()`. Confirmed in scope — no win SFX was designed. | ✅ None needed |
| I12 | LOW | `tasks.md` T007 | Confirmation-only task; cosmetically better as checklist item under T009. | ❌ Tasks cosmetic |

---

## 5. Consistency Summary

| Axis | Status |
|------|--------|
| `snakeMuted` / `snakeSfxMuted` keys | ✅ Consistent across all artifacts |
| Button x-positions (`CANVAS_W-76` / `CANVAS_W-36`) | ✅ Consistent: plan, data-model, game.js |
| `bestTxt` position unchanged | ✅ Consistent |
| LegendScene writes localStorage only | ✅ Consistent: research, plan, data-model, implementation |
| BGM via `this.music.setMute()` (instance) | ✅ Consistent |
| SFX via `if (!isSfxMuted())` guards (all 6 sites) | ✅ Consistent |
| Fail-open on localStorage error | ✅ Consistent: all 4 helpers have try/catch |
| Init order comment (I1) | ✅ Fixed — comment added |

---

## 6. Remaining Actionable Findings

| ID | Severity | Resolution Required |
|----|----------|---------------------|
| I7 | HIGH | Human decision: add keyboard shortcuts (`M`/`X`) for BGM/SFX OR amend constitution to exclude supplemental HUD controls from keyboard-focusable requirement |
| I2 | MEDIUM | Human edit: clarify FR-010 "immediately reflected" in `spec.md` |
| I9 | LOW | Human edit: clarify US2 AC1 wording in `spec.md` |
| I4, I10, I12 | LOW | Cosmetic cleanup of `tasks.md` and `plan.md` |

**Net new implementation gaps**: None.
**Status**: CLEAN for implementation. Deferred items are documentation/design decisions only.

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
