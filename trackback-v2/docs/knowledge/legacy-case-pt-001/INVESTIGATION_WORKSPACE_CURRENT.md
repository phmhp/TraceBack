> CURRENT UPDATE: 고장 캡처 후 CAPTURED/SUBMITTED 상태는 주행과 레이스 시간을 잠근다. 수정 검증 후 RESOLVED에서만 주행을 재개한다. 기존의 미해결 주행 허용 설명은 대체되었다.
> START는 설정 단계 없이 카운트다운으로 진입한다. 고장 전 F9 진입은 차단한다.
> 주행 경로 중심선에서 20m 초과 이탈 시 레이스 재시작이 필요하다. 이는 게임 경계 규칙이며 ADAS/에어백 모델은 없다.
> 화면: 왼쪽 주행 기록 + 서류 목록, 오른쪽 문서. 단서 메모판을 조사 현황 연결도로 대체하였다. 요구사항은 구성요소별 범위가 기본이다.

# CURRENT — Investigation Workspace (CASE-PT-001)

Status: CURRENT implementation, 2026-09-21. This document describes the current prototype, not a production ECU architecture.

## Canonical sources and precedence

1. Executed C/WASM: `c/vehicle_sw/` source and `src/runtime/c/generated/vehicle-sw.wasm` (actual paths/provenance in build manifest).
2. Runtime contracts: `src/data/ground-truth/PropulsionGroundTruth.ts`.
3. Author verdict: `src/runtime/investigation/CaseDefinition.ts`.
4. UI: `src/ui/investigation/InvestigationWorkspace.tsx`.
5. Documents: this file describes current behavior; prior case documents remain historical.

Canonical logical node metadata: `src/registries/investigation/Architecture.ts`. Legacy XRayNodeRegistry and CaseGuide adapt this registry. ECU, CAN, RTE, BSW and OS Task simulation do not exist.

## Design implemented

Reference View distinguishes logical areas (Vehicle State / Mode, Gear, Propulsion, Brake, Steering, Vehicle Motion, Plant) from the actual incident path. Gear is selection/state logic, not physical actuation. Vehicle Dynamics is Rapier Plant. VehicleState, Brake, Steering, VehicleMotion are REFERENCE_ONLY. Actual Brake/Steering TS adapters are separately described.

Current executed path: DriverInput → GearLogic → PropulsionFunction → VMC → eDrive → TS drive adapter → Rapier. VehicleSpeed / LongitudinalVelocity feed the next SW call. VMC currently maps request and speed to torque; it does not arbitrate motion domains. eDrive is a torque-limit SW model, not an inverter/motor electrical model.

The five numbered wizard tabs are replaced by a case workspace: Incident Report, Architecture, Recorded Data / SW Trace, Requirements & Tests, Test Bench, Analysis Board, Root Cause Report. Every tool is freely navigable. Contextual questions depend on collected evidence, not tool completion. The previous screen remains in source as a legacy implementation, not the active App route.

## Models

- CaseDefinition: identity, symptom, guided mode, incidentPath, trace IDs, RootCauseDefinition and evidenceRules.
- FailureType: six extensible categories; cause labels are metadata, not six implemented faults.
- Evidence: id/type/title/source/component/requirement IDs/TC IDs/reference/discovered/selectedForReport/status. Frame and run references avoid copying large recordings into each card.
- BoundaryObservation: inputs/expected/actual/status/note.
- RootCauseReport: faultLocation/failureType/detailedCause/evidenceIds.
- EvidenceAssessment: sufficient/reasons/ratios/supportingRunIds.
- ExperimentRun retains C result rows, plus testCaseId and assertionScope=MAGNITUDE.

Evidence is discovered only by explicit boundary inspection, requirement/TC selection or adding an executed experiment. Submitted evidence is immutable alongside the first diagnosis. Analysis Board sorts observed/reference, matching and mismatching artifacts. MATCH means the inspected output and instant only, not complete component validation.

## Investigation and verdict

1. Capture live C/Rapier frames; driving continues. Explicit X-RAY entry pauses for investigation.
2. Incident Report displays recorded demand and plant response, not invented normal-car values.
3. Inspect components and time cursor. The local oracle uses actual upstream inputs, not a parallel healthy vehicle. Gear requires the previous continuous frame; the first captured frame cannot establish prior gear. Plant has observations but no normal-trajectory oracle.
4. Open related TC and SYSR → SWR → TC trace. Runtime FR is not fabricated.
5. Independent C experiments: VMC / eDrive; one magnitude per run; advanced speed (VMC), direction, validity. Bench supports samples related to TC009/010A/010B, not full execution of every displayed TC. INVALID probes lie outside valid baseline TC preconditions.
6. Add artifacts to the board, select them and submit location/type/detail/evidence. Requirements are derived from selected TC/test-result trace; no memorized requirement ID submission.
7. Correct answer remains eDrive / Logic-Calculation / Incorrect Scaling; C fault remains normal clamp ×0.5. This is not calibration corruption.
8. Evidence sufficiency requires selected recorded eDrive mismatch under VALID directional input plus at least two distinct positive non-saturated inputs in the same direction, from selected C experiment results. Actual/expected must be within 0.01 of 0.5 and the ratio spread <=0.01. Numeric comparison tolerance is 1e-6 Nm. Zero, duplicate, invalid and saturated samples do not establish the pattern.
9. First diagnosis correctness and sufficiency are independent. After feedback, even an incorrect or insufficient first answer may learn through corrective action tests. Original score remains in report.
10. Repair variant 0 must pass selected input rechecks and 18 existing regression checks. Wrong variants 2/3 remain available and fail boundary checks. RESOLVED selects normal runtime variant. Unresolved return keeps the fault.
11. Finish does not require resolution. Debrief distinguishes FINISH LINE REACHED / UNRESOLVED from MISSION COMPLETE / RESOLVED, and shows first RCA, evidence sufficiency and actual repair results.

## Recording versus testing

Recorded Incident Playback displays saved plant pose and signals. It is not full state restoration/re-execution. STANDARD_TEST fallback executes actual C with fixed inputs but has no plant/video data. Test Bench executes a new isolated C instance and does not drive the shown vehicle.

## Known document/model gaps

- Older case SPEC/player/author JSON and UI v1/v2/v3 designs describe earlier wizard stages and activation timing. They are LEGACY; the CaseDefinition is the active answer source. Current activation needs accumulated qualifying exposure 5 s, continuous qualification 0.75 s and 2 s post-trigger capture.
- Ground Truth v0.1/v0.2 are LEGACY. v0.3 is the historical contract baseline; its approval text is preserved. UI ground-truth metadata and calibration approval statuses were not reapproved by this refactor.
- Runtime includes 21 requirements (12 SYSR / 9 SWR), 16 referenced TC IDs but 11 detailed TC objects. Missing TC detail is labeled; no text is invented. Root-level FR/SYS/SWR catalogs are separate design trace, not runtime links.
- SWR-EDR-001 wording about limiting/preserving does not itself state the exact clamp equation for below-limit inputs. Bench uses the existing C/ground-truth normal clamp contract. SYSR-PROP-009 boundedness alone cannot establish that a half-sized command is wrong. The requirement statements were not silently rewritten.
- All six Failure Types are selectable taxonomy; only the existing calculation fault and repair variants execute.
- Reference-only nodes are not C components. WheelSpeed/YawRate are future reference signals, not stored data.
- Case state and first verdict are in-memory; JSON export is available. No persistent server assessment or anti-cheat boundary exists.

## Extension boundary

A Brake / Steering / VehicleState case needs actual control behavior and capture signals, reviewed SYSR/SWR/TC definitions, component test API/oracle, a case definition and case-specific evidence rules, a trigger/repair/regression implementation, and registry/path links. Current PropulsionCase remains the concrete orchestrator; the reusable metadata does not constitute a generic multi-case runtime scheduler.

## Educational scope

Host-based C/WASM functional simulation. Local component boundary checks and requirement-based experiments support fault localization. No real ECU timing, network fault injection, memory/register debugger or HIL is claimed. The guided fault is deterministic; the magnitude-focused experiment and explicit ratio sufficiency are intentionally limited to CASE-PT-001.


## Validation and change manifest

Validation on 2026-09-21:
- `npm test`: 64/64 PASS, including C provenance/equivalence, actual C+Rapier capture and resume, new evidence sufficiency and report tests, R3F camera/physics lifecycle.
- `npm run typecheck`, `npm run lint`, `npm run build`: PASS. Vite retains its large-chunk warning; Rapier prints its existing deprecated-init warning.
- Browser: actual captured frame, local eDrive mismatch, independent 45/90 Nm experiments, selected boundary/test artifacts, correct=true and evidenceSufficient=true, corrective action PASS and RESOLVED verified. Reference/trace map and document layout visually inspected at the existing viewport.
- The entire race course was not manually driven through Finish in one browser validation session. Finish lifecycle is covered by automated runtime tests; Debrief is wired to the live CaseContext.
- Existing R3F test still expected old camera offset (7,3.1). Updated to current no-speed-reader offset (9,4.3), retaining the mixed-frame-rate invariant. Camera implementation was not changed.

Approval metadata caveat: v0.3 says APPROVED/runtimeEligibility=true while also retaining READY_FOR_USER_APPROVAL and pre-approval wording. Calibration source remains REVIEW_REQUIRED. These pre-existing status contradictions are reported, not resolved by inventing user approval.

New files:
- src/registries/investigation/Architecture.ts
- src/registries/investigation/Trace.ts
- src/runtime/investigation/CaseDefinition.ts
- src/runtime/investigation/Evidence.ts
- src/runtime/investigation/Boundary.ts
- src/runtime/investigation/Assessment.ts
- src/ui/investigation/InvestigationWorkspace.tsx
- src/ui/investigation/ArchitectureExplorer.tsx
- src/ui/investigation/RequirementsExplorer.tsx
- src/ui/investigation/TestBench.tsx
- src/ui/investigation/AnalysisReport.tsx
- src/ui/investigation/workspace.css
- tests/investigation-workspace.test.mjs
- docs/cases/INVESTIGATION_WORKSPACE_CURRENT.md

Existing files changed in this redesign:
- src/runtime/case/PropulsionCase.ts
- src/ui/App.tsx
- src/ui/screens/CaseGuide.tsx
- src/ui/screens/RaceScreen.tsx
- src/ui/screens/DebriefScreen.tsx
- src/ui/xray/XRayNodeRegistry.ts
- tests/case-gameplay.test.mjs
- tests/r3f-integration.test.mjs
- docs/cases/CASE-PT-001_SPEC.md
- docs/cases/CASE-PT-001_PLAYER_FLOW_DESIGN.md
- docs/cases/CASE-PT-001_XRAY_USABILITY_v2.md
- docs/cases/CASE-PT-001_INTERACTION_v3.md
- docs/cases/CASE-PT-001.author-only.json
- docs/cases/CASE-PT-001.player.json
- docs/ground-truth/PROPULSION_NORMAL_FLOW_GROUND_TRUTH_v0.1.md
- docs/ground-truth/PROPULSION_NORMAL_FLOW_GROUND_TRUTH_v0.2.md

Other pre-existing uncommitted runtime/UI/map-interaction changes were retained. C/WASM binaries, C source, Rapier behavior and the fault activation/capture implementation were not changed by this redesign.
