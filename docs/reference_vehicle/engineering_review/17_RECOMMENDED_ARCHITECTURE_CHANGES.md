# 권고 아키텍처 변경안

이 문서는 correction proposal이며 구현 승인이 아니다. 현재 runtime behavior는 모든 Tier에서 기본적으로 유지할 수 있다.

## TIER 0 — Common architecture blocker

### C0-1 Typed control semantics와 unique final owner

- 문제: demand/request/constraint/command/allocation이 여러 도메인에서 혼재하고 final longitudinal owner가 없다.
- 현재: host adapter가 brake-over-drive를 실행하고 design-only Motion Coordination이 폭넓게 기술됨.
- 권고: typed request/constraint/selection/allocation relations와 final-command owner uniqueness rule을 정의한다.
- 영향 Function: LF-MC-REQ/AUTH/LON/ALLOC, LF-PROP-*, LF-BRK-*.
- 영향 Signal: PropulsionRequest, DriveTorqueRequest, EDriveCommand, BrakeDemand/Command 후보.
- 영향 Requirement/Test/Case: 관련 SYSR/SWR 1차 재분해; authority decision-table TC; multi-source case.
- 위험: generic abstraction이 현재 narrow semantics를 덮을 수 있음.
- Runtime 변경: 불필요. host policy를 explicit legacy/runtime allocation으로 유지.
- Revalidation: 48 scenarios 중 longitudinal/authority 세트와 current regression.

## TIER 1 — Control authority / state ownership

### C1-1 Braking chain 재구성

- 현재: acquisition/demand/coordination/blend/command가 있으나 owner와 order가 없음.
- 권고: total demand, stability modulation, regen/friction allocation, final command를 분리하고 ABS role은 외부 review 전 OPEN으로 유지.
- 영향: Braking, Stability, Energy, Motion; brake signals/requirements/tests/cases.
- 위험: 과도한 universal architecture 가정.
- Runtime: temporary adapter 그대로 유지 가능.
- Revalidation: driver/AEB/ABS/regen conflict scenarios.

### C1-2 Lateral control contract

- 현재: normalized steering input과 physical angle, future LKA/ESC request가 혼재.
- 권고: physical quantity와 authority option을 external review로 확정; 확정 전 generic request 금지.
- 영향: Steering, Stability, ADAS, Motion.
- 위험: EPS/SbW architecture 종속.
- Runtime: current arcade angle path 유지.
- Revalidation: driver/LKA/ESC counterexamples.

### C1-3 Vehicle State와 domain availability

- 현재: host readiness/enable assumption과 future vehicle state가 병렬.
- 권고: vehicle operational state, domain availability, drive permission, degraded/recovery authorization을 orthogonal concepts로 분리.
- 영향: Vehicle State, Gear, Propulsion, Braking, Steering, ADAS, Energy, Diagnostics.
- Runtime: host assumptions 유지.
- Revalidation: impossible-combination/state-transition review.

### C1-4 Constraint aggregation

- 현재: TCS/Energy/Fault/eDrive/speed constraints order 미정.
- 권고: provenance/validity/direction/rate/hysteresis를 가진 independent constraint set과 effective-envelope owner 정의.
- Runtime: current sequential C path는 legacy execution ordering으로 보존.
- Revalidation: commutativity/order counterexamples 및 invalid fallback.

## TIER 2 — Signal/interface semantics

### C2-1 Semantic kinds

- 문제: 30개 signal issue.
- 권고: DEMAND, REQUEST, CONSTRAINT, SETPOINT, COMMAND, ACTUAL, FEEDBACK, STATE, STATUS, VALIDITY, QUALITY, AVAILABILITY, PERMISSION, GROUND_TRUTH, ESTIMATE를 explicit enum으로 둔다.
- 영향: 111 signals와 49 interfaces.
- 위험: 잘못된 자동 migration.
- Runtime: symbol rename 불필요; alias/provenance mapping 사용.
- Revalidation: unit/owner/source/destination/time basis lint.

### C2-2 Logical/transport/observation interface 분리

- 현재: structural edge와 runtime transfer/endpoint pair가 같은 catalog에 축으로 존재.
- 권고: logical interface identity는 유지하고 transport mapping과 observation point를 별도 relation/entity로 둔다.
- Runtime: eDrive same-tick pair를 narrow instrumentation으로 유지.
- Revalidation: CAN/non-CAN claim gate.

## TIER 3 — Requirement model corrections

### C3-1 Level/owner/decomposition gate

- 문제: 62 SW_OWNER_TBD, 34 refinement, 42 unverifiable.
- 권고: FR=need, SYSR=system behavior, SWR=allocated software contract, SIMR=simulation environment contract로 lint한다. SWR owner 없이 approval 금지.
- 영향: 180 requirements/222 traces/74 TCs/34 cases.
- Runtime: 없음.
- Revalidation: paired SYSR/SWR semantic-delta review.

### C3-2 Calibration/timing/safety provenance

- 권고: statement, calibration, implementation, verification, safety lifecycle status를 독립 유지.
- Revalidation: numeric/timing/CAN/safety claim scan.

## TIER 4 — Verification / fault-case corrections

### C4-1 Test architecture entities

- 권고: TestEnvironment, Harness, Stub, MeasurementPoint, ExpectedSource, ExecutionRun, CoverageArtifact를 추가한다.
- 영향: Phase 06 catalogs/evidence.
- Runtime: 기존 runner 유지.
- Revalidation: PASS/FAIL oracle gate.

### C4-2 Minimal diagnostic lifecycle

- 권고: observed, pending, confirmed, reaction-active, clearable, rearmed/recovered를 test injection과 분리.
- 영향: Fault LF, requirements, TC, cases.
- Runtime: current FI unchanged.
- Revalidation: injection-end ≠ recovery counterexample.

### C4-3 Case maturation

- 권고: 33 AI_DRAFT를 architecture grounding/activation/first deviation/repair/replay/oracle 기준으로 개별 review.
- Runtime: promotion 전 불필요.
- Revalidation: hidden-truth leak와 stimulus-removal repair 금지.

## TIER 5 — Future-domain maturation

ABS/TCS/ESC, ADAS, Energy, Occupant Safety, CAN/network, multi-rate scheduler, safety lifecycle은 external/domain evidence가 있을 때만 구체화한다. Common schema는 `OPEN/DESIGN_ONLY`를 표현해야 하지만 future policy를 현재 truth로 채우지 않는다.
