# TRACKBACK 차량 아키텍처·코드 감사

감사 기준일: 2026-10-07  
감사 성격: 독립 정적 감사, 코드·실행 모델·요구사항·Ground Truth 변경 없음

## 1. 결론

현재 TRACKBACK은 **74개 차량 논리 기능이 구현된 차량 제어 플랫폼이 아니다.** 실제 실행 가능한 범위는 다음의 단일 추진 슬라이스와 임시 제동·조향 경로다.

```text
DriverInputRuntime
  ├─> GearLogic(C)
  ├─> PropulsionFunction(C) -> VMC(C) -> eDrive(C)
  │                              │          │
  │                              └─speed    └─> DriveAdapter(TS) -> Rapier Plant
  ├─> TemporaryBrakeAdapter(TS) -----------------------------> Rapier Plant
  └─> TemporarySteeringAdapter(TS, speed feedback) ----------> Rapier Plant
                                                        │
                  LongitudinalVelocity / VehicleSpeed <-┘ (다음 fixed tick 입력)
```

이 슬라이스 자체는 코드상 실제로 연결되어 있고, 애플리케이션은 C를 WASM으로 실행한다. 그러나 참조 설계의 Vehicle State/Mode, 독립 Brake/Steering SW, Stability, ADAS, Motion Coordination, Energy, Occupant, Fault Management, Communication, Scheduler는 대부분 `DESIGN_ONLY`다. `VMC`라는 실행 함수는 전체 Vehicle Motion Coordination이 아니라 추진 요청과 속력으로 토크를 만드는 좁은 함수다. 이 구분은 코드에도 명시되어 있다 (`src/registries/investigation/Architecture.ts:46`, `:50`).

가장 중요한 위험은 다음 네 가지다.

1. **P0 — 제어권 충돌:** 제동 입력이 있으면 `DriveAdapter`가 추진력을 즉시 0으로 만든다. 이 정책은 Motion Coordination/Arbitration이 아니라 adapter에 숨겨져 있다 (`src/runtime/control/EDriveToVehiclePhysicsAdapter.ts:5-8`).
2. **P0 — 상태·허용권 부재:** 실행 중 `vehicleReady`는 physics 존재 여부, `propulsionEnable`은 상수 `true`로 주입된다 (`src/runtime/SimulationRuntime.ts:323-331`). 독립 Vehicle State/Mode 기능이 없다.
3. **P0 — 승인 의미 충돌:** 요구사항은 `APPROVED`이나 실제 오라클이 사용하는 보정값은 `SIMULATION_ASSUMPTION` 및 `REVIEW_REQUIRED`다 (`src/data/ground-truth/PropulsionGroundTruth.ts:3-7`, `src/data/calibration/TrackbackSimulationCalibration.ts:1-5`). 이는 TRACKBACK 내부 모델 기준과 자동차 공학 승인 기준을 혼동하게 한다.
4. **P1 — 시간 의미 혼합:** 모든 C 기능과 Rapier가 1/60 s의 같은 loop에서 순차 실행된다. 별도 Runnable/Task scheduler, 10 ms/20 ms 주기, 네트워크 지연은 없다 (`src/core/SimulationClock.ts:1-2`, `src/runtime/SimulationRuntime.ts:316-374`).

## 2. 판정 정의와 근거 우선순위

| 판정 | 본 감사에서의 의미 |
|---|---|
| `VERIFIED` | 현재 소스의 실제 호출 경로 또는 동일 production 함수 호출로 확인됨 |
| `PARTIAL` | 일부 역할만 실행되거나 관찰 가능하지만 설계된 책임 전체는 아님 |
| `DESIGN_ONLY` | 참조 설계/후보 catalog에만 있고 실행 호출 경로가 없음 |
| `CONTRADICTION` | 코드·요구사항·catalog의 두 근거가 같은 사실에 대해 충돌함 |
| `UNVERIFIED` | 자료만으로 생산자·단위·범위·시간 또는 실행 여부를 확정할 수 없음 |

근거 우선순위는 (1) 실제 runtime 호출, (2) C/WASM production 함수, (3) 포트·타입·테스트 코드, (4) registry/Ground Truth, (5) 참조 설계 순이다. 테스트 통과 여부는 해당 assertion만 확인하며 차량 공학적 타당성이나 양산 적합성을 증명하지 않는다.

참조 설계 자체도 이 한계를 명시한다. `docs/reference_vehicle/01_REFERENCE_ARCHITECTURE_KO.md:18-19`는 Domain, Function, SWC, Runnable, ECU, Plant가 서로 다른 다대다 엔티티라고 규정하고, `docs/reference_vehicle/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md:693`은 74개 기능 구현 완료 문서가 아니라고 명시한다.

### 2.1 기존 감사 문서 사용 원칙

- `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`는 요구사항 조정 당시의 pre/post matrix로 참고했다. 그 문서의 과거 “독립 endpoint 없음” 주장은 이후 Phase 3A 코드와 맞지 않으므로 현재 사실로 사용하지 않았다.
- `docs/VERIFICATION_WORKBENCH_CAPABILITY_AUDIT.md`의 Phase 3A capability는 현재 `Verification.ts`, `FaultInjection.ts`, `SimulationRuntime.ts`에서 다시 확인했다.
- `docs/REPOSITORY_REQUIREMENT_ALIGNMENT_AUDIT_2026-09-10.md`는 `SimpleVehicleControlAdapter`, 고정 D 등 당시 architecture를 기록한다. 현재 C/WASM/Gear/eDrive 경로로 대체됐으므로 역사 자료로만 사용했다.
- `docs/reference_vehicle/PHASE03_DESIGN_AUDIT_KO.md`는 설계 위험 목록으로만 사용했고, 각 항목은 현재 코드에서 재검증한 경우에만 본 감사 판정에 반영했다.

## 3. 실제 실행 아키텍처

### 3.1 애플리케이션과 C/WASM

- 애플리케이션은 WASM 모듈을 로드하고 `WasmVehicleSw`를 `SimulationRuntime`에 주입한다 (`src/main.tsx:9`, `src/app/GameApplication.tsx:13`, `:22-28`). `LegacyVehicleSw`는 runtime 생성자의 fallback/reference일 뿐 정상 앱 경로의 실행 근거가 아니다.
- WASM ABI는 입력 8개, 출력 13개, 보정 7개 slot을 검증한다 (`src/runtime/c/WasmVehicleSw.ts:29-39`).
- 감사 시점에 `src/runtime/c/generated/build.json`의 SHA-256을 read-only로 재계산한 결과, 생성된 `vehicle-sw.wasm`의 binary hash와 7개 C/header source 결합 hash가 모두 일치했다. 따라서 감사한 C source와 앱이 로드하는 generated binary의 정합성은 `VERIFIED`다.
- 각 SW step은 `GearLogic → Propulsion → VMC → eDrive`의 고정 순서다 (`c/vehicle_sw/core.c:7-12`). SWC/Runnable scheduler나 네트워크 전송은 없다.
- component test seam은 production C 함수와 같은 `Trackback_VMC`/`Trackback_EDriveCase`를 호출한다 (`c/vehicle_sw/wasm_bridge.c:31-38`, `src/runtime/c/WasmVehicleSw.ts:67-74`). 따라서 이 두 함수의 계산 결과 검증은 `VERIFIED`지만, 전체 ECU 통합·타이밍 검증으로 확대 해석할 수 없다.

### 3.2 추진·토크 경계

1. `PropulsionFunction`은 validity를 먼저 확인하고, disabled/P/N을 정상 0 요청으로 처리한 뒤 pedal을 `[0,1]`로 제한한다 (`c/vehicle_sw/propulsion.c:3-15`).
2. `VMC`는 방향별 최대 토크와 zero-torque speed를 이용한 선형 감쇠로 `DriveTorqueRequest`를 만든다 (`c/vehicle_sw/vmc.c:3-13`). 이것은 다중 요청 arbitration이 아니다.
3. `eDrive`는 방향별 torque limit로 magnitude를 포화한다 (`c/vehicle_sw/edrive.c:3-10`). 모터/인버터/열/전압/전류 모델은 없다.
4. `DriveAdapter`가 direction을 signed force로 변환하고 `10 N/Nm`를 적용한다 (`src/runtime/control/EDriveToVehiclePhysicsAdapter.ts:4-8`, `src/data/calibration/TrackbackSimulationCalibration.ts:20`). 이 값은 arcade 물리 보정이며 wheel torque, gear ratio, wheel radius를 통한 물리 변환이 아니다.
5. brake가 0보다 크면 adapter가 drive force를 0으로 만든다. 이는 현재 실제 arbitration owner이지만 74 LF의 `LF-MC-AUTH`, `LF-MC-ALLOC`, `LF-BRK-COORD`에는 구현으로 할당되지 않는다.

판정: 계산 경로 자체는 `VERIFIED`; 일반 자동차 공학의 완전한 propulsion/torque control 구조라는 주장은 `CONTRADICTION`이다.

### 3.3 Gear와 상태 전이

- `GearLogic`은 유효한 요청에 대해 D↔R 반대 방향 전환만 `abs(longitudinalVelocity) <= 0.5 m/s` 조건으로 막는다 (`c/vehicle_sw/gear.c:3-13`, `src/data/calibration/TrackbackSimulationCalibration.ts:15`).
- P/N↔D/R 전이는 속력, 브레이크, park pawl, actuator feedback 조건 없이 승인된다.
- invalid 요청이면 이전 gear를 유지하면서 `GearStateValidity`는 invalid가 된다. pending/transitioning/rejected reason 상태는 없다.
- live `DriverInputRuntime`은 gear validity를 항상 `VALID`로 설정하며 invalid를 발생시키는 사용자 경로가 없다 (`src/runtime/driver/DriverInputRuntime.ts:41`, `:52-57`). invalid 경로는 component input에서만 시험 가능하다.

판정: TRACKBACK의 좁은 `SWR-GEAR-001`은 `VERIFIED`; 참조 설계의 완전한 gear state/interlock/reaction은 `PARTIAL`이다. 일반 차량의 변속 안전 조건으로 인정할 수 없다.

### 3.4 제동·조향·Motion Coordination

- Brake SW는 없다. `brake ratio × 6500 N`이 바로 plant command가 된다 (`src/runtime/control/TemporaryBrakeSteeringAdapters.ts:4-7`). ABS, blending, pressure/torque feedback이 없다.
- Steering SW/EPS는 없다. normalized steering과 speed로 `0.42/(1+speed×0.07)` rad를 계산한다 (`src/runtime/control/TemporaryBrakeSteeringAdapters.ts:8-10`). steering torque, rack position, yaw target이 없다.
- Stability와 ADAS 신호에 필요한 wheel speed/slip, yaw-rate sensor, lane/object perception이 없다.
- 따라서 참조 설계의 Motion Coordination request collection, authority, longitudinal/lateral coordination, allocation, monitor는 실행되지 않는다. 실행 함수 이름 `VMC`를 이 설계 영역과 동일시하면 안 된다.

판정: 물리 입력 adapter는 `PARTIAL`; Brake/Steering/Stability/ADAS/통합 Motion Coordination은 `DESIGN_ONLY`다.

### 3.5 Rapier Vehicle Physics

- 공개 command는 total wheel drive/brake force(N)와 front steering(rad)이다 (`src/domain/vehicle/VehiclePhysicsPort.ts:3-8`).
- drive force는 4개 wheel에 균등 분배된다. brake force는 Rapier API에 맞춰 impulse로 바뀌고, steering은 앞 두 wheel에만 적용된다 (`src/physics/rapier/RapierVehiclePhysics.ts:70-84`).
- `VehicleSpeed`는 3D velocity vector magnitude이고 `LongitudinalVelocity`는 vehicle forward-axis projection이다 (`src/physics/rapier/RapierVehiclePhysics.ts:86-98`). 이 구분은 `SYSR-PROP-011`과 일치한다.
- chassis pitch/roll은 arcade 안정화를 위해 잠겨 있다 (`src/physics/rapier/RapierVehiclePhysics.ts:46-47`). wheel speed/slip, tire force, motor speed, brake temperature는 외부 signal로 제공되지 않는다.

판정: TRACKBACK arcade plant와 해당 state 정의는 `VERIFIED`; 실차 동역학 또는 stability-controller plant 적합성은 `UNVERIFIED`다.

### 3.6 실행 주기와 데이터 순서

한 fixed tick의 실제 순서는 다음과 같다 (`src/runtime/SimulationRuntime.ts:316-374`).

```text
t의 scenario 입력 적용
→ DriverInput slew
→ Driver accelerator fault injection
→ 이전 plant state로 C/WASM 전체 step
→ eDrive interface fault injection/endpoint 기록
→ drive/brake/steering adapter
→ Rapier step(1/60 s)
→ clock 증가
→ 새 plant state/acceleration 계산
→ incident 또는 scenario sample 기록
```

- 모든 SW 함수도 사실상 60 Hz다. 참조 문서의 10 ms VMC, 20 ms AEB, 10 ms CAN은 미래 예시이며 실제 주기가 아니다 (`docs/reference_vehicle/01_REFERENCE_ARCHITECTURE_KO.md:152`).
- browser stall catch-up은 최대 6 tick이고 frame delta는 0.1 s로 제한된다 (`src/runtime/SimulationRuntime.ts:314-316`). 이 정책은 real-time deadline supervision이 아니다.
- HUD publish는 6 tick마다라 대략 10 Hz지만 SW 실행 주기와 별개다 (`src/runtime/SimulationRuntime.ts:383-386`).
- sample은 clock 증가 후 `t+dt`로 기록되나 fault/interface telemetry는 tick 시작 `t`를 사용한다 (`src/runtime/SimulationRuntime.ts:317`, `:321`, `:349`, `:363-374`). 같은 sample 내부 시간 기준이 한 tick 어긋날 수 있다.

판정: 단일 fixed-step 실행은 `VERIFIED`; multi-rate logical scheduler/platform supervision은 `DESIGN_ONLY`; sample/endpoint 시간 의미는 `CONTRADICTION`이다.

## 4. Fault Case와 Verification Workbench

### 4.1 실제 고장 모델

- case variant 1은 정상 eDrive limit 결과에 0.5를 곱한다 (`c/vehicle_sw/edrive.c:13-20`). CASE-PT-001의 canonical root cause는 `eDrive / LOGIC_CALCULATION / INCORRECT_SCALING`이다 (`src/runtime/investigation/CaseDefinition.ts:17-23`).
- variant는 교육용 defect이며 ECU가 검출한 DTC/fault state가 아니다. 참조 설계도 “주입 시각=ECU 검출 시각 아님”이라고 경고한다 (`docs/reference_vehicle/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md:503`).
- runtime fault injection은 accelerator override와 eDrive→DriveAdapter의 override/drop 두 지점뿐이다 (`src/runtime/scenario/FaultInjection.ts:4-6`, `:62-71`). recovery `RESTORED`는 전달 경로 복원이지 도메인 fault recovery가 아니다.

### 4.2 Workbench 능력

- C/WASM component execution target은 VMC와 eDrive뿐이며 constant stimulus, expected oracle를 지원한다 (`src/runtime/investigation/Verification.ts:75-92`, `:133-136`).
- vehicle scenario 실행 target은 `eDrive->DriveAdapter`와 `VehiclePhysics`뿐이다. time profile/replay/fault injection은 지원하지만 expected trajectory oracle는 지원하지 않는다 (`src/runtime/investigation/Verification.ts:94-110`, `:138-153`).
- interface comparison은 eDrive→DriveAdapter만 same-tick source/destination을 별도 객체로 기록한다. 실제 transport latency, queue, sampling, network를 모델링하지 않는다.
- `FAIL`은 해당 expected 위반이며 root cause 확정이 아니라는 해석이 코드에 보존되어 있다 (`src/runtime/case/PropulsionCase.ts:149-155`).
- 최종 진단 정답은 canonical case definition과 직접 비교한다 (`src/runtime/case/PropulsionCase.ts:176-187`). 이는 게임 판정 오라클이지 독립 진단 알고리즘이 아니다.

판정: 선언된 좁은 workbench 능력은 `VERIFIED`; 일반 목적 verification platform이라는 표현은 `PARTIAL`이다.

## 5. 요구사항·TC Ground Truth

- 21개 요구사항은 모두 `status: APPROVED`, `provenance: TRACKBACK_MODEL`이다 (`src/data/ground-truth/PropulsionGroundTruth.ts:3-7`, `:13-34`). 이는 TRACKBACK reference-model 내부 상태로만 해석해야 한다.
- `SYSR-PROP-009`는 VMC에 할당되었지만 문장은 eDrive의 방향별 limit까지 포함하고, linked SWR은 VMC와 eDrive 둘 다다 (`src/data/ground-truth/PropulsionGroundTruth.ts:23`, `:31-32`). 시스템 요구사항 allocation이 단일 owner와 실제 책임 범위를 일치시키지 못한다.
- 요구사항은 TC-001~005를 링크하지만 `propulsionTests`의 상세 정의는 TC-006A부터 시작한다 (`src/data/ground-truth/PropulsionGroundTruth.ts:14-17`, `:37-49`). registry는 누락 항목을 ID만 가진 reference placeholder로 만든다 (`src/registries/investigation/Trace.ts:28-36`).
- TC-011/012는 실제 repository 자동 테스트에서 C+adapter+Rapier로 실행되지만, UI workbench registry에서는 `REFERENCE_ONLY`다 (`tests/vehicle-physics.test.mjs:40`, `src/registries/investigation/Trace.ts:22-35`). 이는 “자동화 존재”와 “player workbench 실행 능력”의 차이이며 문서에서 분리해야 한다.
- 테스트 expected는 production C와 다른 TS oracle 함수를 사용하지만 같은 calibration array에 의존한다 (`src/runtime/case/CaseExperiment.ts:18-30`). 구현 복제 위험은 줄였으나 calibration 승인 독립성은 없다.

판정: 실행된 assertion과 trace link는 `PARTIAL`; Ground Truth 전체의 독립 승인·공학 타당성은 `UNVERIFIED`다.

## 6. 의존 관계와 제어권

### 실제 runtime

- C 내부 호출은 acyclic이다.
- plant feedback은 다음 tick의 GearLogic/VMC/SteeringAdapter 입력이므로 same-tick algebraic loop는 없다.
- 명시적 순환은 폐루프 제어가 아니라 sampled plant feedback이다.
- 실제 이중 제어권은 brake input의 추진 차단 정책과 brake force 생성이 서로 다른 adapter에 분산된 점이다. 추진 차단 owner가 `DriveAdapter`, 감속 force owner가 `TemporaryBrakeAdapter`다.

### 참조 설계

- 제안된 Motion Coordination↔Steering, Energy limit↔regeneration, Stability/ADAS request 관계는 후보 신호만 있으며 실행 dependency가 아니다.
- 따라서 참조 설계의 잠재 순환을 현재 코드의 순환으로 보고하면 안 된다. 반대로 현재 코드가 acyclic하다는 이유로 향후 coordination 설계의 cycle/priority 문제가 해결됐다고 볼 수도 없다.

## 7. TRACKBACK 모델과 일반 자동차 공학의 경계

| 항목 | TRACKBACK에서 확인된 것 | 일반 자동차 공학 관점의 미확인 사항 |
|---|---|---|
| 추진 | normalized pedal→토크→directional saturation | driver demand shaping, motor/inverter/thermal/energy constraints |
| Gear | D↔R speed interlock | brake interlock, park lock, actuator feedback, transition state |
| 제동 | ratio→fixed force, drive suppression | brake-by-wire, hydraulic dynamics, blending, ABS/ESC authority |
| 조향 | ratio+speed→wheel angle | EPS torque control, rack/road-wheel feedback, safety degradation |
| Plant | Rapier raycast vehicle, signed longitudinal response | validated tire model, wheel slip/yaw sensor model, parameter provenance |
| Timing | deterministic 60 Hz game tick | runnable periods, deadline/jitter/WCET, bus timing |
| Fault | educational mutation and two injection points | detection/confirmation, DTC, safe state, recovery guard |
| Safety | 없음 | HARA/ASIL/safety mechanism/independence |

본 감사는 일반 자동차 공학 지식을 위 표의 “미확인” 경계 설명에만 사용했다. TRACKBACK 참조 문서에 없는 양산 ECU/안전 구조를 현재 제품 요구사항으로 새로 요구하지 않는다.

## 8. 감사 한계

- 본 감사는 정적 소스·설계 대조다. 이번 작업에서 테스트를 재실행하지 않았으며 기존 테스트 파일의 assertion과 실행 경로만 검토했다. 단, generated WASM의 binary/source hash는 read-only로 재검산했다.
- 외부 OEM calibration, HARA, CAN database, ARXML, SIL/HIL 결과가 repository에 없으므로 차량 공학 적합성은 검증할 수 없다.
- `docs/reference_vehicle/`는 현재 Git 기준 untracked 입력이며, 사용자가 지정한 `docs/reference-vehicle/`와 경로가 다르다. 본 산출물은 요청 경로에 작성했지만 source-of-truth 경로 통합은 별도 변경 승인 후 수행해야 한다.
- 상세 74 LF 판정은 `02_FUNCTION_COVERAGE_MATRIX.md`, signal/interface 판정은 `03_SIGNAL_INTERFACE_AUDIT.md`, 문제 등록은 `04_CONTRADICTION_REGISTER.md`, 수정 순서는 `05_RECOMMENDED_CORRECTIONS.md`에 있다.
