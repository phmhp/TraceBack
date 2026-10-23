# Signal / Interface 코드 감사

## 1. Catalog 현황

`docs/reference_vehicle/04_SIGNAL_CANDIDATE_CATALOG.csv`에는 111개 항목이 있다.

| sourceStatus | 수 | 코드 구현 의미 |
|---|---:|---|
| `CODEX_REPORTED` | 11 | 과거 코드 보고 기반 후보. 본 감사에서 재검증 필요 |
| `SRC_DRAFT` | 22 | 참조 초안. 실행 근거 아님 |
| `PROPOSED` | 78 | 제안. 실행 근거 아님 |

종류는 physical/logical signal 98, telemetry/event 11, calibration 2다. `docs/reference_vehicle/04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:55-62`도 producer/consumer 표가 실제 port 존재를 뜻하지 않는다고 명시한다.

`04_INTERFACE_BOUNDARY_CANDIDATES.csv`에는 49개 관계가 있다.

| designStatus | 수 | 판정 |
|---|---:|---|
| `CODEX_REPORTED` | 7 | 연결은 재검증되었으나 telemetry 수준은 서로 다름 |
| `SRC_DRAFT` | 6 | `DESIGN_ONLY` |
| `PROPOSED` | 36 | `DESIGN_ONLY` |

따라서 **111 signal 후보나 49 boundary 후보를 현재 runtime catalog로 부르면 안 된다.** 현재 `Architecture.ts`의 14개 edge도 registry 선언이며, 실제 instrumentation은 별도로 확인해야 한다.

## 2. 실제 runtime signal 계약

아래는 실행 경로에서 실제로 읽고 쓰는 주요 signal이다. 범위는 source clamp, C contract, calibration 중 실제 적용 근거가 있는 것만 썼다.

| Signal | 실제 producer → consumer | 표현/타입 | 단위·범위 | clock/validity | 판정 |
|---|---|---|---|---|---|
| `AcceleratorPedalPosition` | `DriverInputRuntime` → C input | `number/double` | ratio, live `[0,1]` | 60 Hz sample, 별도 validity | `VERIFIED` |
| `AcceleratorPedalValidity` | host state → Propulsion | enum | `VALID/INVALID` | live 경로는 항상 VALID | `PARTIAL` |
| `Brake` | `DriverInputRuntime` → Drive/Brake adapters | number | ratio `[0,1]` | 60 Hz, validity 없음 | `VERIFIED` |
| `Steering` | `DriverInputRuntime` → Steering adapter | number | ratio `[-1,1]` | 60 Hz, validity 없음 | `VERIFIED` |
| `GearRequest` | `DriverInputRuntime` → GearLogic | enum | P/R/N/D | 60 Hz, 별도 validity | `VERIFIED` |
| `GearRequestValidity` | host state → GearLogic | enum | VALID/INVALID | live는 항상 VALID | `PARTIAL` |
| `VehicleReady` | `SimulationRuntime` → Propulsion | boolean | physics 존재 여부 | 60 Hz | `CONTRADICTION`: vehicle state가 아닌 host resource 상태 |
| `PropulsionEnable` | `SimulationRuntime` → Propulsion | boolean | runtime step에서 항상 true | 60 Hz | `CONTRADICTION`: permission owner 없음 |
| `GearState` | GearLogic → Propulsion/host | enum | P/R/N/D | 60 Hz, previous state 보존 | `VERIFIED` |
| `GearStateValidity` | GearLogic → Propulsion/host | enum | VALID/INVALID | request validity 전달 | `VERIFIED` |
| `TransitionAccepted` | GearLogic → host | boolean | true/false | 60 Hz | `VERIFIED` |
| `PropulsionState` | C core → host | enum | PROP_ENABLED/DISABLED | 60 Hz | `PARTIAL`: 2상태 |
| `PropulsionRequest` | Propulsion → VMC | struct | magnitude ratio `[0,1]`, direction, validity | 동일 C step | `VERIFIED` |
| `DriveTorqueRequest` | VMC → eDrive | struct | magnitude Nm ≥0, direction, validity | 동일 C step | `VERIFIED` |
| `EDriveCommand` | eDrive → DriveAdapter | struct | magnitude Nm, FWD max 180/R max 130, direction, validity | 동일 tick; FI 가능 | `VERIFIED` |
| `driveForce` | DriveAdapter → Rapier | number | signed N; nominal `Nm×10`, brake 시 0 | 60 Hz | `VERIFIED` |
| `brakeForce` | BrakeAdapter → Rapier | number | N, `[0,6500]` | 60 Hz | `VERIFIED`지만 임시 경로 |
| `steering` | SteeringAdapter → Rapier | number | rad, `ratio×0.42/(1+speed×0.07)` | 60 Hz | `VERIFIED`지만 임시 경로 |
| `VehicleSpeed` | Rapier truth → VMC/SteeringAdapter | number | m/s, 3D magnitude ≥0 | 다음 60 Hz SW tick | `VERIFIED` |
| `LongitudinalVelocity` | Rapier truth → GearLogic/telemetry | number | signed m/s, forward-axis projection | 다음 60 Hz SW tick | `VERIFIED` |
| `LongitudinalAcceleration` | SimulationRuntime finite difference | number | m/s² | physics step 후 계산 | `VERIFIED` |
| `Position` | Rapier truth → telemetry/game | vector | m | physics step 후 | `VERIFIED` |

코드 근거: port shape (`src/runtime/c/VehicleSwPort.ts:5-23`), source clamp (`src/runtime/driver/DriverInputRuntime.ts:16-18`), C chain (`c/vehicle_sw/core.c:7-12`), adapter (`src/runtime/control/EDriveToVehiclePhysicsAdapter.ts:4-8`, `TemporaryBrakeSteeringAdapters.ts:4-10`), plant feedback (`src/physics/rapier/RapierVehiclePhysics.ts:86-98`).

### 2.1 타입·범위의 중요한 예외

1. `VehicleSwPort.validateInput`은 accelerator가 number인지만 확인하고 finite/`[0,1]`는 확인하지 않는다 (`src/runtime/c/VehicleSwPort.ts:53-58`). C는 non-finite를 0, finite out-of-range를 clamp한다 (`c/vehicle_sw/propulsion.c:10-14`). 따라서 live source range와 public port acceptance가 다르다. `PARTIAL` 계약이다.
2. `VehicleSpeed`의 workbench 입력 범위 0..60 m/s는 vehicle signal의 일반 valid range가 아니라 시험 UI 범위다 (`src/runtime/investigation/Verification.ts:133-135`).
3. `DriveTorqueRequest`의 0..600 Nm도 eDrive component test 입력 범위이지 VMC 출력 범위가 아니다.
4. `EDriveCommand`는 코드상 `magnitudeNm`로 확정된다 (`src/domain/propulsion/PropulsionTypes.ts`, `src/runtime/c/WasmVehicleSw.ts:54-55`). candidate catalog의 “Nm 재확인” warning은 현재 source 기준 stale이다.
5. `Direction`은 signedness가 아니라 별도 enum이다. signed force는 adapter에서만 생긴다 (`EDriveToVehiclePhysicsAdapter.ts:4-8`).
6. Rapier `VehicleSpeed`는 sensor estimate가 아니라 plant truth다. `LF-SEN-MOTION` 구현으로 완전 동일시할 수 없다.

## 3. 11개 CODEX_REPORTED signal 재판정

| Catalog 항목 | 판정 | 현재 코드 결론 |
|---|---|---|
| `DriverInputRuntime.accelerator` | `VERIFIED` | source `[0,1]`; 전달 후 C가 재-clamp. accelerator FI 시 raw와 delivered가 다름 |
| `DriverInputRuntime.brake` | `VERIFIED` | direct host path; Brake SW 수신 아님 |
| `DriverInputRuntime.steering` | `VERIFIED` | normalized ratio; wheel angle이 아님 |
| `PropulsionRequest` | `VERIFIED` | producer는 `Trackback_Propulsion`; catalog의 producer `OPEN`은 수정 필요 |
| `VehicleSpeed` | `VERIFIED` | Rapier 3D magnitude; producer는 plant truth |
| `DriveTorqueRequest` | `VERIFIED` | `Trackback_VMC` output, Nm magnitude + direction + validity |
| `EDriveCommand` | `VERIFIED` | `Trackback_EDriveCase` output, Nm; directional output limit 180/130 Nm |
| `DriveForce` | `VERIFIED` | signed N; torque와 직접 값 비교 금지 |
| `BrakeForce` | `VERIFIED` | N, temporary adapter output; nominal 0..6500 |
| `Direction` | `VERIFIED` | NONE/FORWARD/REVERSE, request struct field |
| `Validity` | `PARTIAL` | VALID/INVALID 존재. timeout/diagnostic quality 증명은 아님 |

## 4. 실제 interface 연결

`src/registries/investigation/Architecture.ts:60-74`는 14개 edge를 선언한다. 실제 연결·관찰 수준은 다음과 같다.

| Registry edge | 실제 전달 | 독립 양단 telemetry | 판정 |
|---|---|---|---|
| DriverInput→GearLogic | host state를 WASM input slot으로 복사 | 없음 | 연결 `VERIFIED`, 진단 `PARTIAL` |
| DriverInput→PropulsionFunction | host accelerator/validity를 WASM input으로 복사 | accelerator FI에서 original/delivered 기록 | 연결 `VERIFIED`, 제한 telemetry `PARTIAL` |
| GearLogic→PropulsionFunction | 같은 C step의 struct 내부 전달 | 없음 | 연결 `VERIFIED` |
| PropulsionFunction→VMC | 같은 C step 함수 인자 | 없음 | 연결 `VERIFIED` |
| VMC→eDrive | 같은 C step 함수 인자 | 없음 | 연결 `VERIFIED` |
| eDrive→DriveAdapter | C output을 TS adapter 입력으로 전달 | source/destination 객체와 delivery flag | `VERIFIED` |
| DriveAdapter→VehiclePhysics | `VehiclePhysicsCommand.driveForce` | command 기록만 | 연결 `VERIFIED`, 양단 `PARTIAL` |
| DriverInput→BrakeAdapter | direct TS call | 없음 | `VERIFIED`, 임시 path |
| DriverInput→SteeringAdapter | direct TS call | 없음 | `VERIFIED`, 임시 path |
| BrakeAdapter→VehiclePhysics | command field | 없음 | `VERIFIED`, 임시 path |
| SteeringAdapter→VehiclePhysics | command field | 없음 | `VERIFIED`, 임시 path |
| VehiclePhysics→GearLogic | 이전 tick state를 C input slot으로 복사 | 없음 | `VERIFIED` |
| VehiclePhysics→VMC | 이전 tick speed를 C input slot으로 복사 | 없음 | `VERIFIED` |
| VehiclePhysics→SteeringAdapter | 이전 tick speed direct read | 없음 | `VERIFIED` |

`runtimeConnections`는 이 registry를 그대로 flatten할 뿐 runtime introspection 결과가 아니다 (`src/registries/investigation/Architecture.ts:200`). 따라서 UI의 “연결됨”은 코드 registry 관계를 뜻하며 bus/network endpoint 검증을 뜻하지 않는다.

### 4.1 eDrive interface comparison의 정확한 의미

`FaultInjectionRuntime.applyEDriveCommand`는 한 함수 안에서 source command를 clone하고 override/drop을 적용해 destination command를 만든다 (`src/runtime/scenario/FaultInjection.ts:109-133`).

- source와 destination 값은 별도 객체로 기록된다: `VERIFIED`.
- 같은 fixed tick에서 비교된다: `VERIFIED`.
- network copy, async receive, delay, queue, timeout, alive counter: `DESIGN_ONLY`.
- mismatch는 injection 때문에 만들어질 수 있으며 ECU detection 결과가 아니다.
- `DROP_UPDATE`는 이전 delivered command를 hold한다. 실제 network receive buffer 모델은 아니다.

## 5. 실제로 연결되지 않은 참조 interface

다음 42개는 candidate CSV에 있으나 현재 실행 연결이 아니다.

| 그룹 | Candidate ID | 코드 판정 | 주요 누락 |
|---|---|---|---|
| Propulsion logical draft | `IFC-DESIGN-002`, `003`, `010`–`013` | `DESIGN_ONLY` | DriverDriveDemand alias, DriveEnable owner, monitor/recovery |
| Gear/Brake | `014`–`019` | `DESIGN_ONLY` | applied gear path, brake validity/deceleration/coordination/blend/command |
| Steering | `020`–`023` | `DESIGN_ONLY` | demand shape, coordination, EPS command |
| Stability/ADAS | `024`–`027`, `036`–`040` | `DESIGN_ONLY` | request arbitration, object/lane/wheel-slip/yaw sensing |
| Motion Coordination | `028`–`033` | `DESIGN_ONLY` | request envelope, authority, longitudinal/lateral coordination, allocation |
| Energy | `034`–`035` | `DESIGN_ONLY` | drive/regen energy limits |
| Fault | `041`–`042` | `DESIGN_ONLY` | detection status, reaction constraint |
| Communication/Execution | `043`–`047` | `DESIGN_ONLY` 또는 recorder 일부 `PARTIAL` | endpoint service, network, scheduler event, tick metadata, recorder contract |
| Occupant safety | `048`–`049` | `DESIGN_ONLY` | impact sensor, decision, deployment |

CODEX_REPORTED 7개 boundary의 재판정:

| ID | 관계 | 판정 |
|---|---|---|
| `IFC-DESIGN-001` | Driver accelerator→Propulsion acquisition | `VERIFIED` 연결, producer naming 재정렬 필요 |
| `004` | Propulsion generation/VMC→eDrive | `VERIFIED` direct C call, 독립 endpoint 없음 |
| `005` | eDrive→DriveAdapter | `VERIFIED`, 유일한 full endpoint telemetry 경계 |
| `006` | DriveAdapter→Plant | `VERIFIED`, torque→force 변환 경계 |
| `007` | Driver brake→actuation | `VERIFIED`, direct physics path이며 Brake SW 아님 |
| `008` | Driver steering→actuation | `VERIFIED`, direct physics path이며 EPS SW 아님 |
| `009` | Plant→motion sensing | plant truth 연결 `VERIFIED`, sensor model은 `DESIGN_ONLY` |

## 6. 시간·동기화 감사

| 데이터 | 생산 시각 | 소비/기록 시각 | 판정 |
|---|---|---|---|
| C input/output | tick 시작 `t`의 plant feedback으로 같은 call 실행 | snapshot `executionTime=t` | `VERIFIED` |
| adapter command | C output 직후 | 같은 tick Rapier step | `VERIFIED` |
| Rapier feedback | `[t,t+dt]` step 후 | 다음 C tick 입력 | `VERIFIED` sampled loop |
| scenario sample | clock step 후 `t+dt` | post-physics values | `VERIFIED` |
| fault/interface telemetry | injection 시 `t` | `t+dt` sample에 포함 | `CONTRADICTION`: 한 sample 내 timestamp basis 불일치 |
| HUD telemetry | 매 6 tick 또는 이벤트 | raw DriverInput + latest SW/plant | `PARTIAL`: 실행/관찰 주기와 다름 |

특히 accelerator FI 중 HUD의 `accelerator`는 raw driver value이고, C가 받은 값은 `vehicleSw.input.acceleratorPedalPosition`이다 (`src/runtime/SimulationRuntime.ts:321-325`, `:390-403`). UI/분석 도구는 두 값을 명시적으로 구분해야 한다.

## 7. Producer·Consumer·단위·범위 결함

| ID | 우선순위 | 판정 | 결함 | 근거와 수정 방향 |
|---|---|---|---|---|
| SIG-01 | P0 | `CONTRADICTION` | `VehicleReady`/`PropulsionEnable`가 vehicle permission 신호처럼 보이나 host 상수/리소스 상태다 | `SimulationRuntime.ts:328-329`; producer를 host assumption으로 명시하거나 독립 state owner 구현 |
| SIG-02 | P1 | `CONTRADICTION` | accelerator port acceptance와 source range가 다르다 | `VehicleSwPort.ts:53-58`, `propulsion.c:10-14`; port contract에 clamp 또는 reject 정책 명시 |
| SIG-03 | P1 | `CONTRADICTION` | sample time과 endpoint time이 한 tick 다를 수 있다 | `SimulationRuntime.ts:317`, `:363-374`; pre/post tick time fields 분리 |
| SIG-04 | P1 | `PARTIAL` | catalog의 `PropulsionRequest` producer가 OPEN | 실제 `Trackback_Propulsion`로 갱신하되 LF mapping은 승인 필요 |
| SIG-05 | P1 | `PARTIAL` | `EDriveCommand` unit/range warning이 stale | 코드상 Nm 및 180/130 limit. calibration provenance는 별도 경고 유지 |
| SIG-06 | P1 | `PARTIAL` | 14 registry edge 중 한 경계만 독립 양단 telemetry | UI에서 “registered edge”와 “observed endpoint” capability 분리 |
| SIG-07 | P1 | `CONTRADICTION` | brake가 drive force를 0으로 하는 priority가 interface adapter에 숨음 | `EDriveToVehiclePhysicsAdapter.ts:5-8`; authority 계약으로 승격 |
| SIG-08 | P2 | `PARTIAL` | steering ratio와 steering rad가 모두 `steering` 이름으로 노출 | normalized input vs wheel-angle command technical name 분리 |
| SIG-09 | P2 | `PARTIAL` | speedKmh monitor와 VehicleSpeed m/s가 병존 | unit-bearing canonical ID 또는 명시적 conversion metadata 필요 |
| SIG-10 | P2 | `UNVERIFIED` | 실제 wheel force/torque feedback과 actuator actual 값 없음 | command와 actual을 구분하고 actual은 구현 전 unavailable 처리 |

## 8. 결론

현재 신호 경로는 추진 슬라이스와 arcade plant 안에서는 추적 가능하다. 그러나 111개 candidate signal/49개 candidate boundary는 미래 설계를 포함한 조사 catalog이고, 실행 interface contract가 아니다. 다음 semantic pass에서는 catalog 행마다 최소한 `sourceStatus`, `runtimeCapability`, producer owner, unit, range, clock basis, endpoint observability를 함께 표시해야 한다. 단, 본 감사에서는 catalog나 코드를 변경하지 않았다.
