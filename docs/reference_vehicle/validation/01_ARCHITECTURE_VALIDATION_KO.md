# TRACKBACK Phase 07.6 차량 아키텍처 의미 검증

## 1. 판정 범위와 한계

이 보고서는 canonical Phase 01–07 문서와 현재 runtime source를 대조해 논리 일관성, 교육용 차량제어 reference로서의 방어 가능성, 시험 가능성을 반례 중심으로 검증한다. OEM correctness, 양산 적합성, 기능안전 승인을 주장하지 않는다. Referential integrity의 orphan/dangling/duplicate 0건은 입력 전제일 뿐 공학적 타당성의 증거가 아니다.

검증 중 canonical 문서, runtime, C/WASM, Ground Truth, calibration, UI, registry, test, physics, fault injection, case는 수정하지 않았다.

## 2. 결론

- LF 판정: `VALIDATED 10`, `VALID_WITH_OPEN_DECISION 19`, `REWORK_REQUIRED 20`, `UNVERIFIED 25`.
- Architecture issues: `P0 15`, `P1 18`, `P2 5`.
- 48개 cross-domain scenario를 NORMAL, BOUNDARY, CONFLICT, INVALID, DEGRADED, FAULT/RECOVERY 조건으로 적용했다.
- 공통 schema를 불안정하게 만드는 authority conflict는 10개다.
- 현재 architecture는 좁은 추진/gear/host-plant 실행 경로에서는 일관되지만, 완성된 whole-vehicle control architecture로 freeze할 수 없다.

## 3. 74 LF 검증 해석

`VALIDATED`는 현재 문서 범위에서 책임·입출력·상태·관측 의미가 한 가지 답을 만든다는 뜻이다. `VALID_WITH_OPEN_DECISION`은 공통 schema를 깨지 않는 제한/owner/calibration 결정이 남았다는 뜻이다. `REWORK_REQUIRED`는 realistic conflict에서 둘 이상의 final owner 또는 불명확한 request abstraction이 생긴다는 뜻이다. `UNVERIFIED`는 repository 근거만으로 입력·상태·fault·oracle 계약을 검증할 수 없다는 뜻이다. 구현 상태와 이 판정은 독립이다.

상세 74행 판정은 `02_FUNCTION_VALIDATION_MATRIX.csv`에 있다.

## 4. 핵심 P0 문제

1. 최종 longitudinal authority 및 actuator allocation owner가 정의되지 않았다.
2. ABS 역할이 request source, constraint, actuator modulation 중 하나로 고정되지 않았다.
3. Brake blending과 최종 brake command owner가 없다.
4. TCS, energy, eDrive torque limit의 적용 순서와 결합 규칙이 없다.
5. Steering/LKA/ESC 공통 request abstraction(angle/torque/curvature)이 없다.
6. Driver–LKA–ESC lateral authority가 없다.
7. ACC/AEB/LKA output이 vehicle-motion request인지 actuator request/command인지 혼재한다.
8. AEB와 driver accelerator/ACC의 override policy가 승인되지 않았다.
9. Fault reaction의 authority와 diagnostic confirmation 전제가 정의되지 않았다.
10. Detection, confirmation, clear, rearm, recovered를 잇는 diagnostic lifecycle이 없다.
11. Energy readiness, regen availability, brake blending 사이 ownership이 순환할 수 있다.
12. 62개 SWR의 software owner가 TBD여서 allocation을 freeze할 수 없다.
13. Command와 actual feedback이 없는 도메인에서 closed-loop requirement/oracle을 만들 수 없다.
14. Safety-related branch에 Item/HARA 근거가 없으므로 safety authority를 부여할 수 없다.
15. CASE 후보의 repair/replay oracle이 대부분 미구현/미승인이다.

## 5. 주요 P1/P2 문제

P1은 host readiness와 vehicle readiness 분리, gear accepted/applied/engaged 구분, plant truth와 estimate 분리, signal age/freshness, 60 Hz와 미래 multi-rate 경계, simulation calibration 승인 범위, replay snapshot 완전성 등을 포함한다. P2는 design-only case/oracle backlog, 일부 prose의 복합 의무, provenance ID 미정규화, 외부 plant fidelity validation, future coverage instrumentation 등이다.

## 6. 영역별 공학 confidence

| 영역 | Confidence | 근거 |
|---|---|---|
| Driver & Environment | PLAUSIBLE_REFERENCE_DESIGN | normalized input 경계는 명확하나 freshness/environment coverage 미완 |
| Vehicle State | INSUFFICIENTLY_DEFINED | host assumptions 외 real owner/state transition 없음 |
| Gear | INTERNALLY_COHERENT | request/transition/applied state의 좁은 실행 의미는 일관됨; physical engagement 없음 |
| Propulsion | INTERNALLY_COHERENT | request→torque generation→eDrive command가 분리됨; calibration/actual torque는 제한 |
| Braking | INSUFFICIENTLY_DEFINED | temporary adapter 외 demand/coordination/blending/feedback owner 미정 |
| Steering | REQUIRES_EXTERNAL_ENGINEERING_VALIDATION | host angle mapping은 있으나 EPS/lateral authority abstraction 미정 |
| Stability | INSUFFICIENTLY_DEFINED | ABS/TCS/ESC 역할·센서·actuator allocation 미정 |
| Motion Coordination | INSUFFICIENTLY_DEFINED | full authority/arbitration/allocation 미구현·미결정 |
| ADAS | INSUFFICIENTLY_DEFINED | perception/ODD/output request type/priority 미정 |
| Sensing / Estimation | PLAUSIBLE_REFERENCE_DESIGN | plant truth 분리는 타당하나 estimator/quality contract 없음 |
| Power / Energy | INSUFFICIENTLY_DEFINED | HV/energy/regen capability와 ownership 미정 |
| Occupant Safety | REQUIRES_EXTERNAL_ENGINEERING_VALIDATION | repository로 crash/restraint/safety validity 판단 불가 |
| Fault Management / Diagnostics | INSUFFICIENTLY_DEFINED | injection은 있으나 diagnostic lifecycle 없음 |
| Communication | PLAUSIBLE_REFERENCE_DESIGN | direct/WASM vs CAN 비주장은 타당; future network는 미정 |
| Execution / Platform | PLAUSIBLE_REFERENCE_DESIGN | 60 Hz loop는 명확; future scheduler/supervision 미정 |
| Actuation / Plant | REQUIRES_EXTERNAL_ENGINEERING_VALIDATION | educational simulation으로 일관되나 physical fidelity 근거 부족 |

## 7. 신호·인터페이스 의미

111개 신호 중 13개는 현재 범위에서 validated, 68개는 의미가 분명한 design-only, 7개는 open decision, 23개는 semantic rework가 필요하다. 문제의 중심은 owner가 `OPEN`인 신호, 물리량이 `OPEN`인 steering/braking 신호, host field가 vehicle state처럼 읽히는 이름, actual feedback 부재다.

49개 인터페이스는 structural/runtime/observable/comparable을 분리하면 일관된다. 오직 `IFC-DESIGN-005`만 `INSTRUMENTED_SAME_TICK_ENDPOINT_PAIR`이며 narrow comparable이다. 이는 CAN, 독립 ECU, asynchronous endpoint evidence가 아니다.

## 8. 요구사항과 시험 가능성

180개 후보 중 `GOOD_DRAFT 42`, `NEEDS_REFINEMENT 34`, `BLOCKED_BY_OPEN_DECISION 62`, `UNVERIFIABLE 42`다. 문제 138개는 문장이 모두 잘못됐다는 뜻이 아니라 registry freeze 전에 owner, condition, 단일 의무, observable, oracle 중 하나 이상을 보완해야 한다는 뜻이다.

TC 존재는 testability 증거가 아니다. 각 검증에는 controlled input, monitor point, executable expected, tolerance rationale, time basis, evidence provenance가 필요하다. 현재 구분은 다음처럼 유지한다.

- `REFERENCE_TC`: 설계 slot.
- `AUTOMATED_REPOSITORY_TEST`: repository runner 증거.
- `PLAYER_WORKBENCH_EXECUTABLE`: capability-gated player 실행.
- `OBSERVATION_ONLY`: 실행되지만 verdict authority 없음.
- `INTERFACE_COMPARABLE`: 제한된 양단 비교.

Pairwise는 input generation이고 oracle이 아니다. Coverage instrumentation 결과가 없으므로 statement/branch/MC/DC coverage를 주장하지 않는다.

## 9. Fault와 safety

Fault Stimulus → Activation → Deviation → Diagnostic Observation → Detection → Confirmation → Reaction → Recovery Guard → Recovered State를 분리해야 한다. 현재 Fault Injection은 stimulus/application/restoration evidence이며 diagnostic logic이 아니다.

기존 문서에는 HARA 완료, ASIL 부여, Safety Goal/FSR/TSR/SW Safety Requirement 승인 근거가 없다. normal functional trace와 safety trace는 분리되어야 하며 safety branch는 OPEN이다.

## 10. Case 검증

34개 case 중 CASE-PT-001만 `CASE_VALID_DRAFT`로 판정했다. 22개는 unimplemented function, 2개는 oracle, 9개는 case engineering detail로 차단된다. AI_DRAFT는 승격하지 않았다. Repair는 stimulus 제거가 아니라 defect 수정이어야 하며, replay는 initial state/input/environment/fault stimulus/observation/oracle invariants를 보존해야 한다.

## 11. 최종 판단

현재 canonical model은 교육용 설계 corpus로 가치가 있고 좁은 runtime slice도 방어 가능하다. 그러나 whole-vehicle authority와 request abstraction의 P0 결정을 내리지 않은 채 Phase 08 unified registry로 freeze하면 ambiguity가 machine-readable truth로 고착된다. 따라서 readiness는 `NOT_READY`다.
