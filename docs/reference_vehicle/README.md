# TRACKBACK Reference Vehicle

> Document: README  
> Version: 0.3  
> Status: REVIEWED_DRAFT  
> Canonical: YES  
> Last Reviewed: 2026-10-10  
> Runtime Baseline: current repository, 60 Hz narrow propulsion slice  
> Scope: canonical navigation and contribution policy

## 무엇인가

Reference Vehicle은 TRACKBACK에서 차량 기능, 신호, 인터페이스, 요구사항, 시험, fault case를 일관된 용어와 추적 구조로 설명하기 위한 논리 공학 모델이다. 16개 영역과 74개 Logical Function(LF)을 포함한다.

v0.3은 Independent Engineering Review의 공통 blocker를 교정한 `REVIEWED_DRAFT`다. 차량 수준 종방향 요구의 최종 authority/selection 및 drive-vs-brake allocation은 `LF-MC-AUTH`와 `LF-MC-ALLOC`을 포함하는 Reference Motion Coordination이 소유한다. Propulsion과 Braking은 각 도메인 처리 및 최종 도메인 명령을 소유한다. 이 계약은 참조 설계이며 현재 runtime 구현을 주장하지 않는다.

`HOST_DRIVE_BRAKE_ARBITRATION_POLICY`, `HOST_SIMULATION_READY`, `HOST_PROPULSION_ENABLE_ASSUMPTION`은 `CURRENT_RUNTIME_POLICY` 또는 host assumption이다. Reference Motion Coordination/Vehicle State 구현 증거로 승격하지 않는다.

16개 영역은 Driver & Environment, Vehicle State / Mode, Gear, Propulsion, Braking, Steering, Stability, Motion Coordination, ADAS, Sensing / Estimation, Power / Energy, Occupant Safety, Fault Management / Diagnostics, Communication, Execution / Platform, Actuation / Plant다.

각 영역은 `areaKind`를 갖는다. `Actuation / Plant`는 기존 영역 ID를 유지하되 내부 entity kind를 `ACTUATION_BOUNDARY`와 `PLANT_MODEL`로 분리한다. 신호는 `semanticKind`, 인터페이스는 logical/runtime/transport/observation/comparison 관계를 각각 기록한다.

## 무엇이 아닌가

- 74개 LF 전부가 현재 runtime에 구현됐다는 목록이 아니다.
- OEM/양산 차량 아키텍처, 승인된 calibration, ISO 26262 적합성 또는 ASIL 근거가 아니다.
- 설계용 timing/CAN/sensor 예시를 현재 runtime capability로 선언하는 문서가 아니다.
- AI가 만든 case 후보를 자동으로 canonical game truth로 승격하는 장치가 아니다.

현재 baseline은 **VERIFIED 5 / PARTIAL 27 / DESIGN_ONLY 42**다. `DESIGN_ONLY`는 잘못된 설계라는 뜻이 아니라 현재 runtime baseline에 해당 동작이 구현되지 않았다는 뜻이다.

## Runtime과 Reference Model의 경계

현재 실행 경로는 DriverInput → Gear C/WASM → Propulsion C/WASM → `Trackback_VMC` → eDrive C/WASM → host adapters → Rapier plant의 60 Hz fixed loop다.

- `Trackback_VMC`의 semantic role은 **Propulsion Torque Generation**이다. 전체 Vehicle Motion Coordination은 DESIGN_ONLY다.
- brake 우선 정책은 `HOST_DRIVE_BRAKE_ARBITRATION_POLICY`다.
- 현재 `VehicleReady`와 `PropulsionEnable`은 각각 `HOST_SIMULATION_READY`, `HOST_PROPULSION_ENABLE_ASSUMPTION` 의미의 host assumption이다.
- `EDriveCommand`는 command이며 actual physical torque가 아니다.
- eDrive → DriveAdapter만 `INSTRUMENTED_SAME_TICK_ENDPOINT_PAIR`로 분류한다. CAN/독립 ECU/asynchronous endpoint 검증이 아니다.
- Rapier 값은 plant ground truth이며 sensor/estimator 출력이 아니다.
- simulation calibration은 `SIMULATION_ASSUMPTION / REVIEW_REQUIRED`다.

## Phase 01–07 구성

- `architecture/`: Phase 01–03, 16개 영역과 74 LF, 내부 로직/상태 모델.
- `interfaces/`: Phase 04, Signal/Interface 후보와 현재 관측 가능성.
- `requirements/`: Phase 05, FR/SYSR/SWR/SIMR와 trace/open decision/safety gate.
- `verification/`: Phase 06, reference TC, verification strategy, capability, oracle policy.
- `cases/`: Phase 07, fault/case/evidence/repair/replay 정책과 AI draft 후보.
- `audit/`: 근거와 역사적 snapshot. 현재 차량 정의 자체가 아니다.
- `canonicalization_audit/`: 2026-10-10 적용 전 감사와 Phase 08 제안.

## 상태와 provenance

- `APPROVED`, `REVIEW_REQUIRED`, `DRAFT_NOT_APPROVED`, `AI_DRAFT`는 서로 바꿔 쓸 수 없다.
- `requirementStatementStatus`, `calibrationStatus`, `implementationStatus`, `verificationStatus`는 독립 축이다.
- `REFERENCE_TC`, `AUTOMATED_REPOSITORY_TEST`, `PLAYER_WORKBENCH_EXECUTABLE`, `OBSERVATION_ONLY`, `INTERFACE_COMPARABLE`를 구분한다.
- 승인된 executable oracle이 없는 vehicle scenario는 `OBSERVED`다.
- Fault Stimulus, Software Defect, Activation, First Observable Deviation, Propagation, Vehicle Symptom, Evidence, Root Cause, Corrective Action, Replay, Oracle은 각각 별도 개념이다.

## 항목 추가 절차

1. Domain/Function/Subfunction을 추가할 때 hierarchy와 runtime allocation을 별도 기록한다.
2. Signal은 semantic identity, unit, producer, consumer, time basis, runtime observation status를 정의한다.
3. Interface는 `STRUCTURAL_EDGE`, `RUNTIME_TRANSFER`, `ENDPOINT_OBSERVABLE`, `COMPARABLE`을 각각 판단한다.
4. Requirement는 FR/SYSR/SWR/SIMR level, statement status, owner, source를 기록한다. 안전 lifecycle artifact는 근거 없이 만들지 않는다.
5. TestCase는 kind, method, design technique, runner capability, oracle, verdict authority를 분리한다.
6. Case는 approval/visibility/provenance를 기록한다. AI 후보는 독립 승인 전까지 `AI_DRAFT`다.
7. 모든 변경은 ID uniqueness, dangling reference, status, visibility, oracle gate를 검증한다.

Phase 08은 이 문서를 바탕으로 typed JSON entity registry, typed relation registry, TypeScript validation을 도입한다. 이 pass에는 runtime registry를 구현하지 않는다.
