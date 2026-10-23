# TRACKBACK Architecture Correction Report

> Version: 0.3  
> Status: REVIEWED_DRAFT  
> Canonical: NO — canonical v0.3 audit evidence  
> Date: 2026-10-10  
> Scope: Reference Vehicle documentation/catalog correction only

## 1. 결과

Independent Engineering Review의 공통 architecture blocker였던 **final longitudinal control authority / actuator allocation ownership 미정**을 reference design 수준에서 해소했다.

- Vehicle-level longitudinal authority, request selection reason, feasible target 및 drive-vs-brake allocation: Reference Motion Coordination (`LF-MC-AUTH`, `LF-MC-LON`, `LF-MC-ALLOC`).
- Propulsion-domain processing/final command: Propulsion (`LF-PROP-*`).
- Braking-domain total/allocated demand: `LF-BRK-COORD`.
- Regen/friction allocation: `LF-BRK-BLEND`, Energy는 constraint provider.
- 유일한 logical final braking-domain command: `LF-BRK-CMD`.
- Low-level actuator application: 각 `LF-ACT-*` boundary.

`HOST_DRIVE_BRAKE_ARBITRATION_POLICY`는 계속 `CURRENT_RUNTIME_POLICY`이며 새 Reference Motion Coordination의 구현 증거가 아니다. runtime, C/WASM, TypeScript runtime, Rapier, UI, tests, registry, calibration 및 playable behavior는 변경하지 않았다.

## 2. 원 문제와 교정 결정

| 원 문제 | v0.3 교정 결정 | 남은 상태 |
|---|---|---|
| 16개 area가 같은 hierarchy type처럼 보임 | 기존 area identity를 유지하고 11종 `areaKind` 부여; Driver/Environment 및 Actuation/Plant 내부 entity kind 분리 | 상세 allocation은 Phase 08 schema에서 표현 |
| 74 LF role이 암묵적 | 모든 LF를 `functionKind`로 분류; Occupant 3개는 evidence 부족으로 `OPEN` | LF ID 증감 없음 |
| Vehicle-level 최종 종방향 authority 미정 | Reference Motion Coordination이 typed request/constraint 수집, authority/selection, feasible target, domain allocation 소유 | exact target quantity와 priority는 OPEN |
| Motion Coordination이 god VMC가 될 위험 | pedal interpretation, torque map, brake blend 내부, ABS modulation, EPS, energy estimation, ADAS perception, plant physics를 명시적으로 제외 | 없음 |
| constraint가 scalar minimum처럼 해석될 위험 | provenance/type/value/shape/validity/direction/activation/rate/hysteresis/state/priority/time basis를 보존하는 `ConstraintSet`과 `EffectiveControlEnvelope` 도입 | domain-specific combination policy OPEN |
| brake demand/blending/final command owner 중복 | `LF-BRK-COORD` → `LF-BRK-BLEND` → `LF-BRK-CMD` 책임 분리, MC allocation과 domain command 분리 | ABS placement와 blending algorithm 외부 검증 필요 |
| steering/lateral quantity 혼합 | `CURVATURE_REQUEST`, `YAW_RATE_REQUEST`, `STEERING_ANGLE_REQUEST`, `STEERING_TORQUE_REQUEST` option을 typed metadata로 표현 | `LATERAL_REFERENCE_QUANTITY = OPEN_EXTERNAL_VALIDATION_REQUIRED` |
| ADAS output level 혼합 | `controlOutputKind` 도입; motion/safety-priority request를 표현하고 direct actuator request는 기본 미승인 | AEB/driver/ACC priority OPEN |
| VehicleReady/DriveEnable/availability 혼합 | availability, permission, initialization, operational/degraded/recovery contracts 분리 | current host assumptions는 그대로 |
| fault injection과 diagnostic lifecycle 혼합 | injected/observed/detection pending/confirmed/reaction/clear/recovery authorization 분리 | production mapping 외부 검증 필요 |
| truth/measurement/estimate 혼합 | `GROUND_TRUTH`, `FEEDBACK`, `ESTIMATE`, `QUALITY`, `VALIDITY` 분리 | future sensing 구현은 DESIGN_ONLY |
| logical interface와 runtime/network evidence 혼합 | logical/runtime/transport/observation/comparison 필드 분리 | eDrive pair만 same-tick comparable |
| SWR owner 없는 승인 위험 | `SW_OWNER_TBD` SWR의 approval/freeze를 막는 owner gate 추가 | 62개 owner는 의도적으로 TBD 유지 |
| 정상 요구와 safety lifecycle 혼합 | `NORMAL_FUNCTIONAL_REQUIREMENT`와 `SAFETY_REQUIREMENT` branch 분리 | HARA/SG/ASIL/FSR/TSR 미승인 유지 |

## 3. 수정한 canonical 파일

### Navigation / architecture

- `README.md`
- `MANIFEST.md`
- `architecture/01_REFERENCE_ARCHITECTURE_KO.md`
- `architecture/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md`
- `architecture/03_INTERNAL_LOGIC_STATE_MACHINE_KO.md`

### Signals / interfaces

- `interfaces/04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md`
- `interfaces/04_SIGNAL_CATALOG.csv`
- `interfaces/04_INTERFACE_CATALOG.csv`

### Requirements / safety

- `requirements/05_REQUIREMENTS_ENGINEERING_KO.md`
- `requirements/05_REQUIREMENT_CATALOG.csv`
- `requirements/05_OPEN_DECISIONS.csv`
- `requirements/05_SAFETY_TRACE_GATE_KO.md`

`05_TRACEABILITY.csv`는 ID와 relation direction이 변하지 않아 수정하지 않았다.

### Verification

- `verification/06_TEST_VERIFICATION_ENGINEERING_KO.md`
- `verification/06_TEST_CASE_CATALOG.csv`
- `verification/06_REQUIREMENT_VERIFICATION_MATRIX.csv`
- `verification/06_VERIFICATION_CAPABILITY.csv`
- `verification/06_ORACLE_VERDICT_POLICY_KO.md`

`06_REQUIREMENT_TC_TRACEABILITY.csv`는 endpoint ID가 변하지 않아 수정하지 않았다.

### Cases

- `cases/07_FAULT_CASE_ENGINEERING_KO.md`
- `cases/07_CASE_CATALOG.csv`
- `cases/07_CASE_EVIDENCE_VISIBILITY_POLICY_KO.md`
- `cases/07_REPAIR_REPLAY_ORACLE_POLICY_KO.md`

Fault family, stimulus 및 case trace ID/relation은 그대로여서 해당 CSV는 수정하지 않았다.

## 4. Catalog 변경 및 ID 보존

| Entity | 수 | ID 변경 | 주요 v0.3 metadata/교정 |
|---|---:|---:|---|
| Area | 16 | 0 | `areaKind`, Actuation/Plant 내부 entity kind 분리 |
| LF | 74 | 추가 0 / 삭제 0 / rename 0 | 74개 모두 `functionKind`; Occupant 3개 `OPEN` |
| Signal | 111 | 추가 0 / 삭제 0 / rename 0 | `semanticKind`, validity/runtime/reference/external validation, output/quantity kind, producer/consumer/unit review |
| Interface | 49 | 추가 0 / 삭제 0 / rename 0 | logical/runtime/transport/observation/comparison 분리; `IFC-DESIGN-033`을 domain allocation으로 교정 |
| Requirement | 180 | 추가 0 / 삭제 0 / rename 0 | 148개 architecture-affected metadata review, 53개 statement 교정, 5개 maturity axis 및 owner gate |
| Reference LF TC | 74 | 추가 0 / 삭제 0 / rename 0 | architecture/Phase 08 gate metadata; runner 추가 없음 |
| Case | 34 | 추가 0 / 삭제 0 / rename 0 | architecture compatibility metadata; 승인 상태 유지 |

새 engineering decision ID는 `CANON-MC-LONGITUDINAL-AUTHORITY`, `CANON-BRAKING-COMMAND-OWNERS`, `CANON-CONSTRAINT-MODEL`, `CANON-LATERAL-REFERENCE-QUANTITY`, `CANON-SWR-OWNER-GATE`다. 기존 entity ID를 대체하지 않는다.

## 5. 신호 및 인터페이스 교정 요약

111개 신호 모두 15종 canonical `semanticKind` 중 하나를 가진다. `VehicleReady=AVAILABILITY`, `DriveEnable=PERMISSION`, `PropulsionRequest/DriveTorqueRequest=REQUEST`, `EDriveCommand/DriveForce/BrakeCommand/BrakeForce=COMMAND`, Rapier vehicle motion=`GROUND_TRUTH`로 명시했다. 33개 신호는 상세 domain 의미가 `EXTERNAL_VALIDATION_REQUIRED`, 12개는 정확한 physical quantity가 `OPEN`이다. 95개는 여전히 reference `DESIGN_ONLY`다.

49개 interface는 모두 relation semantics를 재검토했다. 현재 runtime transfer 7개, endpoint observation 1개, 비교 가능 pair 1개다. `IFC-DESIGN-005`만 `INSTRUMENTED_SAME_TICK_ENDPOINT_PAIR`이며 CAN/ECU/network 검증 claim은 없다. 16개 interface가 상세 domain/transport 외부 검증 대상이다.

## 6. Requirement 및 Case 영향

- Requirement 총수 180 유지.
- Architecture 영향 review 148개; stable Propulsion/Gear 32개는 baseline 보존.
- 책임/의무가 실제로 바뀐 statement 53개를 교정.
- `SW_OWNER_TBD`: 62개 유지. 모두 `BLOCKED_BY_OPEN_DECISION`; 임의 owner 없음.
- `safetyLifecycleStatus`: `PENDING_NOT_APPROVED` 유지.
- `CASE-PT-001`: `COMPATIBLE_CURRENT_CANONICAL` 및 기존 approval 유지.
- 나머지 33개: 전부 `AI_DRAFT` 유지; `BLOCKED_BY_DOMAIN_DESIGN` 19, `BLOCKED_BY_ORACLE` 13, `BLOCKED_BY_IMPLEMENTATION` 1.

## 7. 미해결 및 외부 검증 의존성

다음은 이번 교정에서 의도적으로 닫지 않았다.

1. ABS/TCS/ESC detailed placement 및 algorithm.
2. Brake blending architecture와 actuator-specific mapping.
3. EPS/SbW 및 steering authority/driver override.
4. Lateral reference physical quantity.
5. ADAS feature output priority, 특히 AEB 대 driver/ACC.
6. Energy/regen constraint와 physical capability model.
7. Production diagnostic lifecycle/DTC/UDS mapping.
8. Multi-rate ECU scheduler/rate transition/timing.
9. Stability/ADAS용 plant fidelity와 sensor model.
10. Functional safety lifecycle evidence.
11. Occupant protection architecture.

이들은 `OPEN`, `DESIGN_ONLY`, `EXTERNAL_VALIDATION_REQUIRED`로 표현되며 승인된 canonical behavior가 아니다.

## 8. Product/runtime 보존 확인

`docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`의 IMPLEMENTED 항목을 변경하지 않았다. `src/`, `c/`, `tests/`, runtime behavior, WASM, Rapier, UI, registries, Ground Truth, calibration numeric values, fault injection, playable case behavior 변경 수는 **0**이다.

