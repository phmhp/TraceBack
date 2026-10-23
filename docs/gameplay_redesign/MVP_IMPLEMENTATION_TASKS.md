# TRACKBACK Gameplay MVP — Corrected Implementation Tasks

## 1. Scope and non-regression gate

This backlog implements the corrected design in `MVP_GAMEPLAY_REDESIGN.md`. Before any implementation task is accepted:

- preserve every `IMPLEMENTED` item in `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`;
- preserve Reference Vehicle Registry and canonical Reference Vehicle truth;
- preserve CASE-PT-001 signals, requirements, fault truth, evidence, and runtime behavior;
- reuse the current global gameplay phase conventions rather than introducing a competing local phase machine;
- do not fabricate telemetry, expected values, test results, repair success, or vehicle behavior;
- do not create a new architecture dashboard or a fifth investigation page;
- do not hide existing engineering information behind new toggles.

## 2. P0 backlog

### P0-1 — Natural race opening

**Goal:** The player enters a race, not a fault-reproduction tutorial.

**Work**

- Present only mission objective, route, controls, and ordinary driving feedback.
- Remove player-facing instructions to hold the accelerator, avoid braking, enter a reproduction zone, or intentionally trigger CASE-PT-001.
- Keep technical clues and root-cause terms out of the pre-incident HUD.
- Trigger the incident only through the existing real runtime conditions.

**Acceptance**

- A first-time player can begin driving without knowing the case truth.
- No UI click awards or scripts the incident independently of the runtime.

### P0-2 — Incident capture and race-time continuity

**Goal:** Preserve current pause/lock semantics while making the incident part of the race.

**Work**

- Enter incident presentation only after the existing trace reports valid capture.
- Keep simulation/physics paused while current runtime locking requires it.
- Add a separate monotonic `incidentElapsedMs` owned by gameplay state, not the engineering runtime.
- Start it after capture; pause it only for system-controlled transitions; stop it after verified repair or terminal abandonment.
- Label captured vehicle imagery as an incident frame, not a live viewport.
- Define the result formula explicitly, for example `missionElapsed = drivingElapsed + incidentElapsed + configuredPenalties`, without changing simulation timestamps.
- Persist enough context to resume the same mission safely and prevent duplicate incident activation.

**Acceptance**

- Investigation never advances hidden vehicle physics.
- Investigation creates a visible time consequence.
- Simulation timestamps and captured trace remain unchanged.
- Retry and resume cannot double-count time or reactivate the same incident.

**Implementation decisions required**

- Monotonic clock source and browser-background behavior.
- Safe return pose and velocity policy.
- Exact final-time composition/display label.

### P0-3 — Rapid Diagnosis over existing Pages 1–4

**Goal:** Improve pacing without replacing engineering capability.

**Work**

- Keep Pages 1–4 and all implemented investigation tools.
- Add a lightweight reasoning progression: `PHENOMENON → FAULT_PATH → PROOF`.
- Page 1 asks what was requested, what conditions applied, and what response occurred.
- Page 2 asks where the first meaningful divergence appears along the existing path.
- Pages 3–4 ask which controlled evidence supports the hypothesis and how far the evidence permits the conclusion.
- Store progression in shared investigation/gameplay state so page navigation cannot desynchronize it.

**Acceptance**

- All existing evidence, notes, requirements, functions, interfaces, experiments, and formal evidence remain reachable.
- A correct guess without sufficient evidence cannot pass the conclusion gate.

### P0-4 — Correct Reference Vehicle UI integration in place

**Goal:** Use canonical architecture to improve existing content, not add content volume.

**Work**

- Remove the separate `WHOLE VEHICLE · REFERENCE ARCHITECTURE` presentation from the intended gameplay layout.
- Keep one existing investigation map as the primary structure surface.
- Feed canonical Registry IDs, names, lifecycle/scope labels, relationships, and requirement/interface links into existing nodes and Inspector details.
- Allow domain context inside the same map so players understand how functions connect within propulsion, braking, steering, and other supported domains.
- Preserve current CASE path prominence; keep unrelated whole-vehicle context as background.
- Do not create a new parallel architecture panel, tab, or lesson.

**Acceptance**

- Registry content appears by updating existing map/Inspector content.
- No duplicate architecture overview competes with the active case path.
- Canonical source attribution remains inspectable.

### P0-5 — Evidence-backed suspect states

**Goal:** Turn narrowing the fault path into a reasoning mechanic rather than multiple-choice trivia.

**Work**

- Add `POSSIBLE`, `ELIMINATED`, and `SUPPORTED` state to the existing hypothesis/progress area.
- Require a link to an observation, signal, interface, requirement, or verification result for every transition.
- Record the evidence ID and the player-facing reason.
- Prevent clicking a node alone from supporting or eliminating it.
- Keep `SUPPORTED` scoped; do not equate it with whole-vehicle certification.

**Acceptance**

- Every suspect transition is auditable.
- Random guessing cannot create formal evidence.
- Assisted transitions are separately labelled.

### P0-6 — One verification design and execution flow

**Goal:** Remove Page 3 duplication and put the actual test decision first.

**Work**

- Render Test Design Technique in one place only.
- Remove the duplicated technique picker/explanation from the second vehicle-scenario section.
- Present one ordered flow: basis → preconditions → stimulus → monitors → expected/oracle → run → observe → interpret.
- Explain the distinction between component execution and vehicle scenario observation at the point of use.
- Keep real C/WASM/component results and vehicle runtime observations separate in data and verdict scope.
- Ensure stable component identity while editing test values so focus and scroll do not reset per keystroke.
- Clip simulation media inside its owning card below navigation and above persistent playback controls.

**Acceptance**

- Test technique appears once.
- Input fields accept continuous typing without remount/focus loss or unexpected scroll.
- No empty placeholder card remains after content removal.
- Vehicle media cannot escape its container or overlap global chrome.

### P0-7 — Player-paced focus guidance

**Goal:** Teach verification thinking while keeping the information landscape visible.

**Work**

- Add a short current reasoning question near existing content rather than creating a modal course.
- Use `PRIMARY_FOCUS`, `CONTEXT`, and `BACKGROUND` presentation states.
- Scroll the exact target fully into view before annotation.
- Draw a restrained, hand-marked red-pencil ellipse around the precise control/evidence.
- Dim only unrelated regions and keep the help card away from the target.
- Move the tutorial cursor to the real tab/control and show the click before navigation.
- Advance only through explicit `다음`, `이전`, `해설 종료` controls.
- Centralize cleanup for dimming, blur, cursor, mark, focus, timers, and scroll locks.

**Acceptance**

- Existing information remains visible and selectable.
- The guide explains why to inspect something, not the hidden answer.
- No overlay state survives exit, route change, unmount, or replay.

### P0-8 — Conclusion and evidence gate

**Goal:** Keep diagnosis, evidence sufficiency, and verification verdict distinct.

**Work**

- Validate selected location, failure type, and evidence scope separately.
- Keep formal Verification Evidence separate from supporting Investigation Notes.
- Replace ambiguous result language with an explicit report verdict and a concise list of missing evidence when incomplete.
- Present the result as a compact investigation report; keep stamps small and secondary.
- Allow retry or assisted solution without dead-ending the session.

**Acceptance**

- Correct location/type with inadequate evidence is reported as incomplete, not PASS.
- PASS/FAIL applies only to the exact test/verdict scope that produced it.

### P0-9 — Executable repair and return to the same race

**Goal:** Make the diagnosis affect play.

**Work**

- Enumerate only runtime-backed repair variants.
- Apply the selected actual variant and run real repair verification.
- Do not treat button selection as repair success.
- On success, restore the current mission using the selected safe-return policy and a short countdown.
- Preserve controls, Rapier behavior, real vehicle path, camera, checkpoint order, and finish contract.
- On failed repair, show the real result and allow another attempt without silently restoring health.

**Acceptance**

- Successful repair changes/selects executable behavior.
- Failed repair cannot unlock healthy recovery driving.
- The captured incident cannot recur accidentally.

### P0-10 — Finish and result separation

**Goal:** Close one cohesive race result.

**Work**

- Require ordered position-based checkpoints before finish.
- Show driving elapsed, incident time loss, configured penalties, and composed mission result transparently.
- Report diagnostic status, evidence sufficiency, assisted status, repair verification, checkpoint validity, finish time, and personal best as distinct fields.
- Scope personal best by track, mission, mode, and relevant rules/version.
- Keep the result compact and provide retry, diagnostic summary, and real next action only.

**Acceptance**

- Diagnostic achievement and driving achievement are not merged.
- Incompatible modes cannot share a personal best.
- No nonexistent next mission is advertised.

### P0-11 — Regression and browser validation

**Automated validation**

- Existing reconciliation/canonical checks.
- Existing C/WASM, vehicle, evidence, and Registry tests unchanged.
- Phase transition tests.
- Incident time is independent of simulation time and composes once.
- Resume does not reactivate the incident.
- Suspect transitions require evidence.
- Assisted state remains distinct.
- Failed repair does not restore health; successful repair enables return.
- Ordered checkpoints, duplicate rejection, finish rejection, retry reset, and personal-best scoping.
- Focus-guide cleanup and stable form identity.

**Manual browser playthrough**

1. Start a new race without technical clue leakage.
2. Drive normally and trigger the real incident.
3. Confirm real response, valid capture, and visible incident-time loss.
4. Complete PHENOMENON, FAULT PATH, and PROOF using existing tools.
5. Confirm there is no separate whole-vehicle architecture panel.
6. Confirm Test Design Technique appears once.
7. Confirm guide scrolling, exact annotation, manual next, and cleanup.
8. Submit incomplete, incorrect, assisted, and supported paths as available.
9. Select and verify a real repair.
10. Return to the same race, drive, pass ordered checkpoints, and finish.
11. Verify separated result fields and retry/reset behavior.

## 3. P1 backlog

- Tune time penalties and targets from recorded playtests.
- Add optional `CLEAN REMATCH` using the verified repair and a separately scoped best time.
- Expand event-driven cat reactions and repair-shop confirmation using existing original assets.
- Evaluate real degraded/limp continuity behind a capability gate; do not ship it until runtime behavior and incident capture remain valid.
- Improve domain-level map explanations where canonical Registry coverage supports them.

## 4. P2 backlog

- Add missions only from canonical, executable cases.
- Add environment/route variation only where real simulation and asset contracts support it.
- Expand configurable medal and cosmetic-reward foundations without mixing them with engineering truth.
- Improve future map content while keeping mission rules and checkpoints data-driven.

## 5. Deferred or prohibited for this MVP

- New vehicle fault cases or invented signals.
- Fake live degradation or telemetry during investigation.
- Complete map replacement.
- Large character-animation pipeline, shop/garage, or online leaderboard.
- Separate whole-vehicle architecture dashboard.
- New investigation page or broad UI rewrite.
- Duplicated technique, evidence, or verification panels.
- Automatic tutorial playback that rushes without player confirmation.

## 6. Known decisions and risks

| Decision/risk | Required resolution |
| --- | --- |
| Incident timer source | Choose a monotonic gameplay clock and define background-tab behavior. |
| Result composition | Decide exact formula and transparent labels; never alter simulation trace time. |
| Safe return pose | Define map-valid pose, orientation, and velocity policy. |
| Penalty values | Keep configurable and tune through playtests. |
| Clean-rematch PB | Store under a separate mode/rules version. |
| Live limp mode | Defer until executable vehicle behavior and trace integrity are proven. |
| Existing dirty Reference UI changes | Correct only during a separately authorized implementation pass; this design task does not edit `src/`. |

## 7. Definition of done

P0 is complete only after the full CASE-PT-001 browser playthrough succeeds and automated regressions confirm that every previously implemented engineering capability remains. Compilation alone is insufficient. Any regression against `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md` blocks release.

Design gate: `GAMEPLAY_MVP_CORRECTED_WITH_IMPLEMENTATION_DECISIONS`.
