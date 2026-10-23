# GV70 Manual-Aligned Guided Gameplay P0 Report

Completion gate: **GV70_GUIDED_GAMEPLAY_P0_READY_WITH_OPEN_DECISIONS**

The vertical slice is implemented and all automated regression gates pass. The remaining decisions are the model-year applicability of the repository's `JKEV_2027_ko_KR.pdf` to a product described as 2026 GV70, and a complete human browser playthrough on the target Windows display.

## 1. 사용한 GV70 공식 Source

- `docs/reference/JKEV_2027_ko_KR.pdf`
- 594 PDF pages
- SHA-256: `423397DE234E387B36B8C8AA027C1C1D34317C93BD9A78CF7DF219ED10E35D65`
- Repository filename identifies this as the 2027 Korean manual. Applicability to a 2026 model year remains OPEN.

## 2. Manual Fact 목록

- `GV70-OM-READY` — owner manual p.143 / PDF p.151: the READY indication tells the driver that the vehicle can be driven; an off or flashing indication can signal a condition to check.
- `GV70-OM-SHIFT-DIRECTION` — owner manual p.327 / PDF p.335: the vehicle should be brought to a complete stop before changing between forward and reverse directions.
- These are driver-visible facts only. They do not establish an OEM ECU partition, CAN ID, internal signal name, control period, DTC, threshold, or algorithm.

## 3. Simulation Assumption 목록

- `CAL-GEAR-DIR-CHANGE-MAX-SPEED = 0.5 m/s` is a TRACKBACK gameplay calibration and is explicitly labeled `SIMULATION_ASSUMPTION`.
- Existing VMC/eDrive torque maps, response windows, input ranges, keyboard response, and physics conversion remain TRACKBACK calibrations. None is presented as GV70 OEM calibration.
- The Pangyo cone work zone is a deterministic gameplay environment treatment, not a claim about a real GV70 test route.

## 4. Unverified Internal 목록

- GV70 ECU topology and software allocation
- CAN/LIN/Ethernet bus IDs, message IDs, payload definitions, and timing
- Internal OEM signal names, state-machine details, DTCs, thresholds, monitors, and diagnostic algorithms
- Mapping between the TRACKBACK Reference Vehicle Registry and an OEM production implementation
- These remain `UNVERIFIED_INTERNAL` and are not exposed as verified GV70 facts.

## 5. 추가된 Execution Model

- Page 3 now exposes `GearLogic` beside VMC and eDrive as an independently executable C/WASM component test target.
- The seam calls the same compiled C `step` path used by the live runtime after initializing a chosen previous gear.
- Inputs: previous gear, requested gear, request validity, and longitudinal velocity.
- Output/oracle subject: `GearState` plus transition acceptance.
- Registered tests `TC-PROP-NORMAL-013` and `TC-PROP-NORMAL-014` are now marked executable.

## 6. 실행 모델 선정 이유

- GearLogic already existed in the live C/WASM runtime, its requirements and test cases already existed, and its behavior is useful for normal/abnormal requirement-based test design.
- Exposing it required no invented OEM subsystem and no change to vehicle dynamics, fault injection, CASE-PT-001 root truth, or C source.
- It adds a state/interlock example, complementing the magnitude calculations already covered by VMC/eDrive.

## 7. Oracle 범위

- The executable oracle covers the TRACKBACK requirement `SWR-GEAR-001` and its configured simulation threshold.
- The owner manual supports only the complete-stop driving principle.
- PASS/FAIL applies to this component execution under the selected test conditions. It is not a whole-vehicle verdict and not proof of GV70 OEM conformance.
- Vehicle scenarios without a registered oracle remain OBSERVED.

## 8. Fault/Evidence 지원

- GearLogic runs can be stored as `TEST_RESULT` evidence with `GearState` as the monitored output.
- CASE-PT-001 proof sufficiency is unchanged: only evidence satisfying its existing eDrive rules can unlock the root cause.
- Upstream GearLogic PASS evidence may eliminate a candidate but cannot become CASE-PT-001 root-cause proof.

## 9. Guided Investigation V2 변경

- Added a minimal `InvestigationRecipe` presentation contract for CASE-PT-001.
- The recipe supplies steps, one current question, recommended tools, focus targets, evidence-based objectives, hint levels, and score values.
- The common clue rail derives its labels/tool guidance from recipe data rather than embedding a fixed displayed sequence.
- Existing Function, Signal, Interface, Requirement, Workbench, Evidence, Repair, and race systems remain the source of behavior.

## 10. Graphic-first 변경

- The existing diagram-first Page 2 flow remains primary and is now explicitly labeled as a TRACKBACK logical education architecture, not a GV70 internal architecture.
- Page 3 remains a two-column workbench: condition/test design on the left, vehicle/component observation on the right.
- GearLogic presents state choices and a speed boundary rather than a prose-only explanation.
- Technical provenance is progressively disclosed near the test instead of appearing as another large investigation panel.

## 11. Clue/Objective/Score

- Recipe clue progression remains evidence-gated: PHENOMENON, FAULT BOUNDARY, and PROOF.
- Objective points are configured in the recipe and computed once from unique completed objective IDs, preventing repeated-click farming.
- Hints reduce the displayed gameplay score by a recipe-configured amount; reading Signals, Interfaces, Requirements, function descriptions, or terminology remains penalty-free.
- Root cause stays locked until all required clues satisfy the existing evidence rules.

## 12. Race 변경

- Existing countdown, race timer, incident, checkpoint/sector recovery, PB, clean-rematch, and debrief systems are preserved.
- The opening race now displays the next checkpoint target and first sector context.
- The instrument cluster exposes READY/NOT READY as a driver-visible indicator with owner-manual provenance.
- Recovery still uses ordered checkpoints, sector splits/deltas, separate PB scopes, and the existing finish rules.

## 13. Environment 변경

- Removed the eight non-collidable decorative cones because they changed neither route choice, collision, incident context, nor evidence.
- Removed visible checkpoint rings; ordered checkpoint triggers and sector logic remain intact.
- Vehicle Scenario now supports a deterministic Rapier lead vehicle and collision obstacle. The lead vehicle is rendered from the same physical pose and can collide with the player vehicle.
- These actors are explicit scenario inputs, not decorative traffic AI or fake sensor claims.

## 14. Repair → Race Return

- Existing evidence gate, diagnosis, real repair variants, failed repair path, regression verification, safe recovery spawn, short countdown, ordered checkpoint continuation, finish, and debrief remain intact.
- The implementation does not teleport to an arbitrary hazard or silently switch to a healthy variant.

## 15. CASE-PT-001 전체 정상 시나리오

1. Countdown and race objective appear.
2. The player drives through the cone work-zone context toward the route objective.
3. The existing runtime conditions naturally activate the actual CASE-PT-001 incident.
4. A valid trace is captured; physical simulation stops and gameplay incident loss starts.
5. The player records the incident observation to earn the phenomenon clue.
6. The player uses structure/signal/interface evidence to mark Last Known Normal and First Known Abnormal.
7. The player forms a hypothesis and gathers sufficient formal C/WASM component evidence.
8. Root cause unlocks only after the proof clue.
9. A supported diagnosis enables repair selection.
10. Successful repair and regression verification restore control.
11. A short countdown returns the player to the same case race at the safe recovery spawn.
12. Ordered checkpoints, sectors, finish, diagnosis results, and resolution results are shown separately.

## 16. Failure paths

- Page/tab visits alone do not unlock clues.
- A signal click without saved evidence does not advance the recipe.
- Missing one boundary, reference-only evidence, vehicle OBSERVED evidence, or an insufficient component sample does not unlock proof.
- Wrong diagnosis remains recorded and does not masquerade as supported.
- Wrong repair variants show real regression failures and do not auto-heal.
- GearLogic evidence cannot satisfy the eDrive-specific CASE-PT-001 proof rule.

## 17. 새 Case 확장 방식

- Add one small recipe record containing case-specific questions, objectives, evidence semantics, hints, focus targets, scoring, driving context, and repair mapping.
- Reuse the generic clue rail and existing investigation tools.
- Add an executable capability only when implementation and an honest oracle both exist; otherwise leave it Reference/OBSERVED.
- The data shape supports different step order and clue count without introducing a framework DSL.

## 18. files created

- `src/data/Gv70OwnerManual.ts`
- `src/runtime/investigation/InvestigationRecipe.ts`
- `docs/gameplay_redesign/GV70_MANUAL_ALIGNED_GAMEPLAY_P0_REPORT.md`

## 19. files modified

- `src/app/GameApplication.tsx`
- `src/data/maps/map-pangyo2.json`
- `src/registries/investigation/Trace.ts`
- `src/runtime/c/WasmVehicleSw.ts`
- `src/runtime/case/CaseExperiment.ts`
- `src/runtime/case/PropulsionCase.ts`
- `src/runtime/investigation/GameplayInvestigation.ts`
- `src/runtime/investigation/InvestigationSession.ts`
- `src/runtime/investigation/Verification.ts`
- `src/ui/components/RaceHUD.tsx`
- `src/ui/investigation/InvestigationWorkspace.tsx`
- `src/ui/investigation/investigation-layout.css`
- `src/ui/investigation/pages/Page1Phenomenon.tsx`
- `src/ui/investigation/pages/Page3Verification.tsx`
- `src/ui/investigation/pages/page2/ViewAFlow.tsx`
- `src/ui/investigation/shell/InvestigationClueRail.tsx`
- `src/ui/screens/RaceScreen.tsx`
- `src/ui/styles.css`
- `tests/case-gameplay.test.mjs`
- `tests/verification-workbench.test.mjs`

## 20. automated validation

- `npm run check:registry` — PASS, 539 entities / 2195 relations, no drift.
- `npm run typecheck` — PASS.
- `npm run lint` — PASS.
- `npm test` — PASS, 199/199.
- `npm run build` — PASS. Vite reports the pre-existing large-chunk advisory.
- Focused tests cover GearLogic accepted/rejected boundary behavior, evidence metadata, registered capability boundaries, CASE-PT-001 proof isolation, repair/recovery, route/checkpoints/sectors, and generated registry integrity.

## 21. browser playthrough

- Latest Vite server started at `http://127.0.0.1:5174/` because an older process already occupied 5173.
- HTTP smoke check: PASS (`200`, title `TRACKBACK`).
- The Computer Use skill was inspected, but its required `node_repl` bridge was not exposed in this session, so a complete human-equivalent click/drive playthrough could not be executed automatically.
- Automated runtime/R3F integration covers natural incident capture, stopped incident state, evidence gates, failed/successful repair, safe recovery, ordered checkpoints, sectors, finish, scenario lead rendering, physical collision, ADAS intervention, and result semantics.
- Manual visual confirmation is still recommended for responsive Page 3 layout, focus lighting, and the entire mouse/keyboard progression.

## 22. remaining risks

- Confirm whether the 2027-named manual is contractually applicable to the intended 2026 GV70 target.
- Run a full visible browser playthrough at target resolutions and input devices.
- Consider bundle code splitting separately; the build passes but Vite reports chunks over 500 kB.
- Auto Hold/TPMS and any new Case still require their own source classification, explicit TRACKBACK contracts, independent oracles, and test evidence before being presented as executable.
- All 74 canonical Logical Functions are now vehicle-scenario observable, but only 10 have independent Expected/PASS·FAIL runners; do not collapse these claims.

## Protected truth and behavior

- `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md` was not modified.
- Reference Vehicle canonical data was not modified.
- CASE-PT-001 root location, failure class, evidence sufficiency, fault injection semantics, and repair semantics were not modified.
- C source, CASE truth, and existing vehicle calibration semantics were not modified. Rapier adapter changes add telemetry and explicit scenario actors; default race behavior is unchanged unless a scenario opts in.

