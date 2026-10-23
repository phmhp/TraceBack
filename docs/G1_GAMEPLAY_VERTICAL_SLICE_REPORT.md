# TRACKBACK G1 gameplay vertical slice

Date: 2026-10-08

## A. Existing loop audit

| Area | Pre-G1 status | Finding |
|---|---|---|
| Driving controls / Rapier / camera | IMPLEMENTED | Fixed-step runtime, keyboard input, Rapier physics and follow camera were already connected. |
| Real fault behavior and capture | IMPLEMENTED | `PropulsionCase` activates C variant 1, records real fixed-step frames, then locks driving. |
| Investigation Pages 1–4 | IMPLEMENTED | Evidence, hypothesis, Requirement map, component/scenario verification and conclusion semantics were preserved. |
| Repair variants and verification | PARTIAL | Real variants 0/2/3 and C/WASM regression existed, but repair was optional in the main Page 4 path. |
| Re-drive | PARTIAL | A resolved case returned the C runtime to variant 0, but there was no distinct recovery mission. |
| Finish | PARTIAL | Position-based finish existed, but it did not require ordered checkpoints. |
| Timer / best time | MISSING | Only the whole simulation clock existed; no recovery-only clock or scoped record existed. |
| Character reaction | PARTIAL | 3D cat celebration and investigation reaction vocabulary existed; driving-event reaction HUD was missing. |
| Result / progression | PARTIAL | A debrief existed but no recovery result, record or separated driving achievement. |

## B. Shared gameplay state

The navigation store now names the G1 phases explicitly: `PRE_RACE`, `NORMAL_DRIVE`, `FAULT_EVENT`, `INVESTIGATION`, `DIAGNOSIS_RESULT`, `REPAIR_SELECTION`, `REPAIR_VERIFICATION`, `RETRY_REPAIR`, `ASSISTED_SOLUTION`, `RECOVERY_COUNTDOWN`, `RECOVERY_DRIVE`, `MISSION_FINISH`, and `MISSION_RESULT`.

The store owns low-frequency phase/navigation state. `SimulationRuntime` remains the fixed-step engineering owner. `RecoveryChallenge` owns only gameplay timer/checkpoint/record mechanics and reports snapshots to the HUD store. Investigation time cannot advance the recovery clock because `RecoveryChallenge.advance` is called only while its status is `RUNNING`.

## C. Repair/runtime integration

- Existing `PropulsionCase.runRepair(0|2|3)` is reused unchanged as the authority for repair verification.
- Recovery stays locked until every row in a real repair regression run passes.
- Variants 2 and 3 remain failed repairs and do not unlock recovery.
- Variant 0 restores the real C path; `PropulsionCase.vehicleScenarioVariant()` stays normal after resolution, preventing incident recurrence.
- Assisted walkthrough now runs a real two-input C experiment, records evidence and a supported diagnosis, but does not repair the vehicle. The player still chooses and verifies a repair.

## D–F. Recovery mission, track contract, timer and best time

- `TrackDefinition`, `RaceMissionDefinition`, `CheckpointDefinition`, and `FinishTrigger` contracts are in `RecoveryChallenge.ts`.
- The G1 mission derives CP_1–CP_4 positions from `map-pangyo2.json` route point indices. No checkpoint world coordinate is copied into React code.
- Checkpoints are awarded from real vehicle position, in order, once each.
- Finish is rejected until all checkpoints are collected.
- The recovery clock starts at the explicit recovery start after countdown and freezes at valid finish.
- Personal best uses a local key scoped by track ID/version + mission ID/version + rules version.
- Medal thresholds are supported by the mission contract but intentionally unset until playtesting. G1 shows completion rather than invented tiers.

## G–I. Character, feedback, scoring and result

- The incident dialog shows a short surprised-cat reaction.
- Recovery start, checkpoint and finish update a compact cat reaction portrait from gameplay events.
- Checkpoints have lightweight route markers and HUD pop feedback.
- Finish keeps the existing celebration and adds a result hero.
- Diagnostic achievement and driving achievement are separate sections. Assisted/independent status, evidence sufficiency and repair verdict are not merged into driving time.

## J. Assisted and retry paths

- Assisted solution remains distinct and still requires executable repair verification.
- Failed repair shows a failed regression verdict and remains retryable.
- Successful repair unlocks recovery.
- Result screen can retry the recovery time attack with the repaired vehicle; timer/checkpoints reset and the existing personal best remains.

## K. Principal files changed

- `src/runtime/gameplay/RecoveryChallenge.ts`
- `src/runtime/SimulationRuntime.ts`
- `src/runtime/case/PropulsionCase.ts`
- `src/ui/state/navigation.ts`
- `src/ui/state/recoveryHud.ts`
- `src/app/GameApplication.tsx`
- `src/ui/investigation/InvestigationWorkspace.tsx`
- `src/ui/investigation/pages/Page4Conclusion.tsx`
- `src/ui/components/RaceHUD.tsx`
- `src/ui/components/IncidentDialogue.tsx`
- `src/graphics/world/RaceRouteMarkers.tsx`
- `src/ui/screens/RaceScreen.tsx`
- `src/ui/screens/DebriefScreen.tsx`
- `src/ui/styles.css`
- `tests/recovery-challenge.test.mjs`
- `tests/game-flow.test.mjs`
- `tests/case-gameplay.test.mjs`

## L. Automated verification

- TypeScript: PASS
- ESLint: PASS
- Full automated test suite: PASS, 130/130
- Production build: PASS
- Existing large Vite chunk warnings remain non-blocking.
- Node test output includes an existing Rapier initialization deprecation warning.

Regression coverage includes shared phase transitions, recovery lock, real failed/successful repair, assisted distinction, ordered checkpoints, duplicate prevention, missing-checkpoint finish rejection, timer reset, personal-best persistence/scope, and existing investigation/C/WASM/Rapier behavior.

## M. Browser playthrough

Not completed in this pass. The desktop browser automation kernel repeatedly failed before a tab snapshot with `windows sandbox failed: helper_unknown_error: setup refresh had errors`. Compilation and automated simulation tests are not presented as a substitute for the requested manual playthrough.

Manual verification still required:

1. Drive until the real incident appears.
2. Complete independent and assisted investigation paths.
3. Observe failed repair and successful repair UI.
4. Drive through CP_1–CP_4 and finish.
5. Retry and confirm visible reset/personal-best behavior.
6. Inspect HUD placement and checkpoint marker readability at common viewport sizes.

## N. Remaining limitations

- G1 uses the existing Pangyo sample route; no map redesign was attempted.
- Checkpoint crossing is a real position-radius test. Directional gate planes can be added during the future map pass if reverse crossing becomes exploitable.
- Cat reactions use a compact 2D HUD/emoji presentation because the current 3D cat model only exposes celebration arm/body animation.
- No audio asset pipeline was added; feedback is visual and reduced-motion aware.
- Medal thresholds are deliberately unconfigured pending actual playtest timing.
- No next mission, online leaderboard, garage or store is fabricated.

## O. Recommended next phase

Run the manual playthrough and record representative recovery times first. Then tune checkpoint radii and camera/HUD readability, configure evidence-based medal thresholds per mission, and replace placeholder reaction glyphs with TRACKBACK-owned cat portrait assets without changing the gameplay contracts.
