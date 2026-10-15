# TRACKBACK Gameplay P0 Implementation Report

## Completion gate

`GAMEPLAY_P0_READY_WITH_POLISH_NEEDED`

CASE-PT-001 now completes the intended P0 loop with real runtime incident capture, evidence-gated rapid diagnosis, actual C/WASM proof and repair verification, safe recovery driving, ordered checkpoints, finish, result separation, and retry. P1 presentation and racing polish remain intentionally deferred.

## 1. Implemented core loop

The playable loop is now:

`COUNTDOWN / RACE` → actual CASE-PT-001 incident → generic incident notification → gameplay `INCIDENT TIME LOSS` → `PHENOMENON` clue → `FAULT BOUNDARY` clue → `PROOF` clue → evidence-supported conclusion → actual repair regression → `CONTROL RESTORED` countdown → same-session recovery drive → ordered checkpoints → finish → `CASE CLOSED` result.

The central navigation phase remains the lifecycle owner. No competing page-local gameplay state machine was added.

## 2. Race changes

- Existing countdown, map route, position-based checkpoints, finish trigger, runtime clock, controls, camera, collisions, and local personal-best persistence are reused.
- Race HUD stays compact. Recovery HUD shows the next checkpoint and current progress without exposing engineering internals.
- Total race presentation combines the pre-incident driving portion, explicit gameplay incident loss, and recovery driving while keeping those parts separately visible in the result.
- A verified repair starts the recovery flow automatically rather than requiring a long report/menu detour.
- Recovery begins from the map's existing safe physics spawn. The submitted incident state is preserved, so the same incident is not re-armed.

## 3. Incident handling

- Incident begins only after the existing runtime CASE-PT-001 condition has activated and a valid trace is captured.
- The player-facing notice is deliberately generic: `VEHICLE ISSUE · 출력 반응 이상`.
- Root location, scaling mechanism, failure type, and answer signal are not exposed by the incident notification.
- The captured incident continues to lock SimulationClock/physics as before. No fake continued vehicle movement is shown.
- `INCIDENT TIME LOSS` is a separate gameplay clock and is explicitly labelled as a gameplay penalty; it never mutates telemetry or SimulationClock.

## 4. Rapid Diagnosis

- Existing Pages 1–4 and their investigation tools remain available.
- A compact clue rail connects the existing workspace into `PHENOMENON → FAULT BOUNDARY → PROOF → REPAIR`.
- Page visits, tab clicks, elapsed time, and selecting the root function alone do not unlock clues.
- The current question changes according to the first unresolved evidence clue.
- Existing Function, Signal, Interface, Requirement, and Workbench views remain the investigation surface; no new large clue page was added.
- Reference Vehicle logical functions that map to executable runtime components now retain canonical structure context while reopening the existing signal/interface/requirement tool shapes for evidence collection.

## 5. Focus Guidance

- The workspace applies `PRIMARY_FOCUS`, `CONTEXT`, and `BACKGROUND` presentation according to the active clue.
- Background material remains visible, clickable, and keyboard-accessible.
- The current-question block and clue slots explain what evidence is needed without revealing the root cause.
- Unlock feedback is a short gameplay notification, not an engineering PASS/FAIL claim.

## 6. Beginner terminology support

- Existing technical identifiers are preserved.
- Short Korean meanings explain request, command, actual value, validity, and the CASE-relevant signals close to where they are used.
- Reference Vehicle identifiers are presented as traceable engineering IDs rather than unexplained gameplay answers.
- No separate glossary page was introduced.

## 7. Hint

- Each clue provides three staged hints: direction, narrowed area/function, and strong boundary/signal guidance.
- Hint levels 1–2 do not mark the run assisted.
- Hint level 3 records `ASSISTED` through gameplay state.
- Reading signals, interfaces, requirements, function explanations, and terminology remains penalty-free.
- Hint penalties remain configurable; no arbitrary time value was embedded into engineering logic.

## 8. Evidence gate

### PHENOMENON CLUE

Unlocks only after the actual incident `INCIDENT_FRAME` evidence is explicitly collected.

### FAULT BOUNDARY CLUE

Unlocks only after the player collects and explicitly assigns:

- a `MATCH` signal/boundary EvidenceReference as `LAST KNOWN NORMAL`; and
- a `MISMATCH` signal/boundary EvidenceReference as `FIRST KNOWN ABNORMAL`.

For the browser-verified route these were `DriveTorqueRequest` and `EDriveCommand` from the same captured trace.

### PROOF CLUE

Uses the existing evidence-sufficiency assessment. It requires saved formal `COMPONENT_MODEL_TEST` evidence and does not upgrade Reference-only or vehicle `OBSERVED` evidence to formal proof.

### Root-cause lock and suspects

- Root-cause submission stays locked until all three clues are unlocked.
- Suspect states are limited to `POSSIBLE`, `ELIMINATED`, and `SUPPORTED`.
- Suspect transitions are derived from collected EvidenceReferences and the current case path; the clue UI itself does not manufacture engineering truth.

## 9. Repair

- Existing executable repair variants are reused.
- Correct diagnosis and sufficient evidence remain separate conditions.
- Repair verification uses the existing real C/WASM regression execution.
- A failed repair remains failed and does not silently select the healthy variant.
- Successful verification unlocks recovery only after every regression row passes.

## 10. Race return

- Successful repair produces `REPAIR VERIFIED → CONTROL RESTORED` and a short recovery countdown.
- Recovery uses the real DriverInput, C/WASM, Rapier, camera, and collision path.
- The safe-spawn reset clears stale motion/error state while preserving the submitted incident and verified repair.
- Recovery challenge progress is reset to checkpoint 0 and the incident cannot recur.

## 11. Result screen

The final report separates:

- `DRIVING`: valid finish, ordered checkpoints, driving time, recovery best;
- `DIAGNOSIS`: diagnosis duration, independent/assisted path, hint level, selected evidence sufficiency;
- `RESOLUTION`: diagnosis result and repair regression result.

Incident loss is displayed independently from driving telemetry. The recovery rematch resets time/checkpoints while retaining the compatible scoped personal best.

## 12. Deferred from P0

- Sector split/delta presentation
- Expanded cat reaction choreography
- Richer incident camera/audio treatment
- Clean-rematch presentation polish
- Fault-run ghost
- Medal thresholds, pending real playtest tuning
- New fault cases and new ABS/ADAS runtime behavior
- AI rivals, items, nitro, shop, open world, large map replacement, and score economy

## 13. Automated tests

Final validation on 2026-10-15:

- `npm run check:registry` — PASS; 539 entities / 2195 relations, no drift.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — PASS; 157/157.
- `npm run build` — PASS; Vite production build completed.

Added P0 coverage verifies evidence-only clue unlocks, explicit boundary assignment, formal proof sufficiency, root-cause gating, staged assisted hints, the separate monotonic incident-loss clock, automatic race return, and safe recovery respawn without incident reset. Existing tests continue to cover wrong diagnosis, failed repairs, assisted resolution, ordered checkpoint rejection/duplication, finish gating, timer reset, scoped personal best, C/WASM behavior, and Rapier behavior.

The build retains the existing large-chunk warning for the main/Rapier bundles; it is not a P0 functional failure.

## 14. Browser playthrough

An isolated local Chromium session was used because the desktop browser-automation helper was unavailable. The session used the running localhost app and did not attach to a user browser profile.

Verified end-to-end:

1. Started a new race and completed countdown.
2. Drove through real DriverInput acceleration/braking until the existing CASE-PT-001 runtime condition captured at 13.683 s.
3. Confirmed generic incident copy and valid trace capture before investigation.
4. Confirmed separate `INCIDENT TIME LOSS` accumulation.
5. Collected the actual phenomenon observation.
6. Collected and assigned `DriveTorqueRequest` MATCH as last normal and `EDriveCommand` MISMATCH as first abnormal.
7. Confirmed the boundary clue and evidence-based eDrive hypothesis flow.
8. Ran two distinct real eDrive component inputs (90 Nm and 120 Nm), stored both formal results, and unlocked PROOF.
9. Submitted `eDrive / 논리·계산` only after root-cause unlock.
10. Ran the existing repair regression and observed 20/20 PASS.
11. Returned automatically to a safe recovery start with `CONTROL RESTORED`, 0/4 checkpoints, and real controls.
12. Drove through the actual DriverInputRuntime (no teleport or checkpoint UI clicks), crossed CP_1–CP_4 in order, and triggered the real finish region.
13. Confirmed `CASE CLOSED`, valid finish, 4/4 checkpoints, independent/no-hint diagnosis, supported conclusion, and separated result categories.
14. Selected recovery rematch and confirmed 0/4 reset, zero speed/start state, and compatible personal-best retention.

Observed result values for this validation session included 4/4 checkpoints, 20/20 repair PASS, `CORRECT · SUPPORTED`, and `NO HINT`. Timing values are playthrough-specific and are not canonical engineering data.

## 15. Known issues / polish needs

- P1 visual/audio incident treatment and expanded cat reactions are not included.
- Sector delta and fault-run ghost remain deferred.
- The investigation remains information-dense on small viewports; the focus system improves priority but further layout polish is appropriate.
- Production bundles still produce Vite's existing large-chunk warning.
- Existing local dirty changes and untracked Reference/UI design artifacts were preserved; no automatic commit was made.

## Regression statement

- `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md` was not modified.
- Reference Vehicle canonical data and registry truth were not modified by Gameplay P0.
- CASE-PT-001 canonical root truth was not modified.
- C/WASM source/semantics, Rapier physics, calibration, oracle semantics, and fault-injection semantics were not modified.
- Runtime lifecycle orchestration changed only to add gameplay incident timing and to use the existing safe physics spawn for verified recovery.
- All automated reconciliation-related and existing vehicle/investigation tests passed.
