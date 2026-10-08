# 74 Function 코드 커버리지 매트릭스

## 1. 읽는 법

이 표는 `docs/reference_vehicle/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md`의 16개 영역/74개 LF를 현재 실행 코드에 하나씩 대조한 결과다. LF는 문서가 명시하듯 임시 논리 ID이며 SWC, Runnable, ECU와 1:1이 아니다 (`:55`, `:693`).

- `VERIFIED`: 설계 역할의 핵심 계산/적용이 실제 runtime 경로에서 실행됨
- `PARTIAL`: 일부 입력·계산·관찰만 존재하거나 임시 adapter가 대신함
- `DESIGN_ONLY`: 문서/후보 registry 외 실행 근거 없음
- `CONTRADICTION`: 동일 책임에 대해 구현과 설계가 양립할 수 없는 주장
- `UNVERIFIED`: 자료만으로 결론 불가

`실제 할당`은 현재 code owner다. 빈칸을 억지로 adapter나 UI에 할당하지 않았다.

## 2. 요약

| 판정 | 개수 | 의미 |
|---|---:|---|
| `VERIFIED` | 5 | pedal interpretation, eDrive limit, simulation clock, drive actuation, plant motion |
| `PARTIAL` | 27 | 좁은 기능 또는 임시 host adapter/telemetry만 존재 |
| `DESIGN_ONLY` | 42 | 실행 함수·포트·호출 경로 없음 |
| `CONTRADICTION` | 0 | LF별 표보다 cross-artifact 문제 등록부에서 관리 |
| `UNVERIFIED` | 0 | 구현 부재가 확인된 것은 `DESIGN_ONLY`로 판정 |
| 합계 | **74** | 참조 LF 전수 |

이 수치는 “5개만 코드가 있다”는 뜻이 아니라, 74개 참조 역할 중 **설계 역할의 핵심을 현재 코드에서 직접 확인한 항목**이 5개라는 뜻이다. 실제 source에는 adapter, UI, investigation runtime 등 LF 체계 밖의 구현도 있다.

## 3. 전수 매트릭스

| 영역 | LF | 판정 | 실제 할당·근거 | 차이와 권고 |
|---|---|---|---|---|
| A Driver/Environment | `LF-DRV-ACQ` | `PARTIAL` | `DriverInputRuntime` 입력·slew·clamp (`src/runtime/driver/DriverInputRuntime.ts:7-38`) | keyboard/game input만 있음. timestamp/센서 acquisition 없음. 현 범위 유지 |
| A | `LF-DRV-VALID` | `PARTIAL` | setter clamp, 기본 validity (`DriverInputRuntime.ts:16-18`, `:41`, `:52-57`) | live invalid/freshness/quality 경로 없음. 계약 명시 후 보완 |
| A | `LF-ENV-STATE` | `PARTIAL` | map surface/route가 Rapier에 공급 (`src/physics/rapier/RapierVehiclePhysics.ts:20-35`, `:72-80`) | road surface는 있으나 object/lane/traffic state 없음. ADAS 전까지 보류 |
| B Vehicle State | `LF-VS-INIT` | `PARTIAL` | runtime reset, physics 존재 기반 ready (`src/runtime/SimulationRuntime.ts:328`, `:403`) | 독립 init state machine 없음. host 상태로 명시 |
| B | `LF-VS-MODE` | `DESIGN_ONLY` | 실행 owner 없음 | Drive/Service/Degraded mode 없음. 신규 상태 설계 전 보류 |
| B | `LF-VS-PERM` | `PARTIAL` | `vehicleReady && propulsionEnable` gate (`c/vehicle_sw/core.c:9`, `c/vehicle_sw/propulsion.c:9`) | permission 계산 owner 없이 host가 true 주입. P0 수정 |
| B | `LF-VS-FAULT` | `DESIGN_ONLY` | 실행 owner 없음 | case variant/FI를 vehicle fault state로 간주 금지 |
| C Gear | `LF-GEAR-ACQ` | `PARTIAL` | `GearRequest`, validity input (`VehicleSwPort.ts:8-9`) | live validity는 항상 VALID. acquisition 상태 없음 |
| C | `LF-GEAR-STATE` | `PARTIAL` | previous gear 보존 및 applied state (`c/vehicle_sw/gear.c:3-13`) | pending/transition/reject reason/actuator feedback 없음 |
| C | `LF-GEAR-INTERLOCK` | `PARTIAL` | D↔R speed interlock (`c/vehicle_sw/gear.c:7-11`) | brake/park/other transition 조건 없음. TRACKBACK 좁은 계약으로 제한 |
| C | `LF-GEAR-REACT` | `DESIGN_ONLY` | 실행 owner 없음 | invalid request 보존은 input handling이며 fault reaction 아님 |
| D Propulsion | `LF-PROP-STA` | `PARTIAL` | `PROP_ENABLED`/`PROP_DISABLED` (`src/runtime/c/WasmVehicleSw.ts:49-52`) | 설계 OFF/READY/ACTIVE/DEGRADED 대신 2상태만 존재 |
| D | `LF-PROP-ACQ` | `PARTIAL` | pedal/gear validity와 availability gate (`c/vehicle_sw/propulsion.c:3-10`) | timeout/status aggregation 없음 |
| D | `LF-PROP-INTERP` | `VERIFIED` | finite 처리, `[0,1]` clamp, direction 선택 (`c/vehicle_sw/propulsion.c:10-15`) | 선형 game pedal map임을 유지 |
| D | `LF-PROP-GEN` | `PARTIAL` | 실행 `VMC`의 속력 기반 torque map (`c/vehicle_sw/vmc.c:3-13`) | driver/stability/energy arbitration 없는 단일 요청 계산. 이름/할당 정정 |
| D | `LF-PROP-LIM` | `PARTIAL` | eDrive directional saturation (`c/vehicle_sw/edrive.c:3-10`) | `ArbitratedTorque`/energy/thermal limit 없음 |
| D | `LF-PROP-OUT` | `PARTIAL` | `EDriveCommand` 출력과 adapter 전달 (`VehicleSwPort.ts:21-22`, `SimulationRuntime.ts:347-352`) | 별도 final command ownership/feedback 없음 |
| D | `LF-PROP-MON` | `DESIGN_ONLY` | `RUNTIME_LAYERS.MONITORING = NOT AVAILABLE` (`VehicleSwPort.ts:40-48`) | UI expected 비교를 독립 monitor로 해석 금지 |
| D | `LF-PROP-REACT` | `DESIGN_ONLY` | 실행 owner 없음 | injected defect는 반응 로직이 아님 |
| D | `LF-PROP-REC` | `DESIGN_ONLY` | 실행 owner 없음 | FI `RESTORED`는 path restore일 뿐 recovery guard 아님 |
| D | `LF-PROP-EDRV` | `VERIFIED` | C eDrive 방향별 limit (`c/vehicle_sw/edrive.c:3-10`) | 전기 machine/inverter 기능까지 확대 금지 |
| E Braking | `LF-BRK-ACQ` | `PARTIAL` | driver brake ratio (`DriverInputRuntime.ts:17`, `SimulationRuntime.ts:353`) | driver source 하나뿐, validity 없음 |
| E | `LF-BRK-STATE` | `DESIGN_ONLY` | 실행 owner 없음 | BrakeAvailable/Degraded 없음 |
| E | `LF-BRK-DEMAND` | `DESIGN_ONLY` | logical demand owner 없음 | `ratio×6500 N` adapter를 demand function으로 승격 금지 |
| E | `LF-BRK-COORD` | `DESIGN_ONLY` | 실행 owner 없음 | brake-vs-drive priority는 adapter에 숨겨짐 |
| E | `LF-BRK-BLEND` | `DESIGN_ONLY` | 실행 owner 없음 | regen/friction split 없음 |
| E | `LF-BRK-CMD` | `PARTIAL` | temporary TS force mapping (`TemporaryBrakeSteeringAdapters.ts:4-7`) | 독립 Brake SW/actuator command가 아님. 임시 경로 표기 유지 |
| E | `LF-BRK-FDBK` | `DESIGN_ONLY` | 실행 owner 없음 | pressure/torque/deceleration feedback 없음 |
| F Steering | `LF-STR-ACQ` | `PARTIAL` | driver normalized steering (`DriverInputRuntime.ts:18`) | sensor validity/assist source 없음 |
| F | `LF-STR-STATE` | `DESIGN_ONLY` | 실행 owner 없음 | EPS state/mode 없음 |
| F | `LF-STR-DEMAND` | `PARTIAL` | speed-dependent angle mapping (`TemporaryBrakeSteeringAdapters.ts:8-10`) | 임시 host 계산, request shape 계약 없음 |
| F | `LF-STR-COORD` | `DESIGN_ONLY` | 실행 owner 없음 | driver/LKA/stability arbitration 없음 |
| F | `LF-STR-ACT` | `PARTIAL` | Rapier front-wheel steering apply (`RapierVehiclePhysics.ts:70-80`) | EPS control/feedback가 아니라 plant application |
| F | `LF-STR-MON` | `DESIGN_ONLY` | 실행 owner 없음 | tracking monitor 없음 |
| G Stability | `LF-STB-ABS` | `DESIGN_ONLY` | wheel slip signal 없음 | wheel-state model 전까지 보류 |
| G | `LF-STB-TCS` | `DESIGN_ONLY` | wheel slip/torque intervention 없음 | 보류 |
| G | `LF-STB-ESC` | `DESIGN_ONLY` | yaw/lateral estimate 없음 | 보류 |
| G | `LF-STB-COORD` | `DESIGN_ONLY` | 실행 owner 없음 | ABS/TCS/ESC authority 정책 선행 필요 |
| H ADAS | `LF-ADAS-COMMON` | `DESIGN_ONLY` | perception/ADAS state 없음 | episode 기능과 vehicle control 구현 구분 |
| H | `LF-ADAS-ACC` | `DESIGN_ONLY` | object range/relative speed 없음 | 보류 |
| H | `LF-ADAS-AEB` | `DESIGN_ONLY` | threat criterion/brake request 없음 | safety claim 금지 |
| H | `LF-ADAS-LKA` | `DESIGN_ONLY` | lane offset/heading 없음 | 보류 |
| I Motion Coordination | `LF-MC-REQ` | `DESIGN_ONLY` | multi-source request envelope 없음 | 실행 `VMC`와 동일시 금지 |
| I | `LF-MC-AUTH` | `DESIGN_ONLY` | authority owner 없음 | brake suppression 정책을 이 기능으로 이동/명시 필요 |
| I | `LF-MC-LON` | `PARTIAL` | 실행 `VMC`가 propulsion request 하나를 torque로 변환 (`c/vehicle_sw/vmc.c:3-13`) | coordination/arbitration은 없음. 명칭 분리 권고 |
| I | `LF-MC-LAT` | `DESIGN_ONLY` | lateral coordinator 없음 | 보류 |
| I | `LF-MC-ALLOC` | `DESIGN_ONLY` | actuator allocation 없음 | drive/brake split 없음 |
| I | `LF-MC-MON` | `DESIGN_ONLY` | monitor 없음 | 보류 |
| J Sensing | `LF-SEN-MOTION` | `PARTIAL` | Rapier truth speed/velocity/acceleration/pose (`RapierVehiclePhysics.ts:86-98`, `SimulationRuntime.ts:364-371`) | 센서/추정/quality가 아닌 plant truth |
| J | `LF-SEN-ACT` | `PARTIAL` | command telemetry와 eDrive endpoint telemetry (`FaultInjection.ts:109-133`) | actual torque/brake/steering feedback 없음 |
| J | `LF-SEN-QUALITY` | `DESIGN_ONLY` | freshness/quality owner 없음 | validity enum만으로 대체 금지 |
| K Energy | `LF-EN-READY` | `DESIGN_ONLY` | HV/battery ready 없음 | vehicleReady와 동일시 금지 |
| K | `LF-EN-LIMIT` | `DESIGN_ONLY` | energy/thermal torque limit 없음 | eDrive fixed limit와 동일시 금지 |
| K | `LF-EN-MON` | `DESIGN_ONLY` | voltage/current/SOC/temp 없음 | 보류 |
| L Occupant | `LF-OCC-IMPACT` | `DESIGN_ONLY` | crash sensor/impact classification 없음 | game collision과 동일시 금지 |
| L | `LF-OCC-DECIDE` | `DESIGN_ONLY` | protection decision 없음 | safety claim 금지 |
| L | `LF-OCC-DEPLOY` | `DESIGN_ONLY` | restraint actuator 없음 | 보류 |
| M Fault | `LF-FM-OBS` | `PARTIAL` | injected original/delivered endpoint 기록 (`FaultInjection.ts:95-133`) | diagnostic observation이 아니라 test instrumentation |
| M | `LF-FM-DETECT` | `DESIGN_ONLY` | detection/confirmation 없음 | expected 비교 UI와 분리 |
| M | `LF-FM-REACT` | `DESIGN_ONLY` | safe/degraded reaction 없음 | case mutation은 fault 자체 |
| M | `LF-FM-REC` | `DESIGN_ONLY` | domain recovery guard 없음 | `RESTORED` label 제한 |
| M | `LF-FM-DIAG` | `DESIGN_ONLY` | DTC/status lifecycle 없음 | 보류 |
| N Communication | `LF-COM-PORT` | `PARTIAL` | direct calls, eDrive boundary source/destination capture (`SimulationRuntime.ts:336-352`) | transfer queue/copy/latency는 없음 |
| N | `LF-COM-NET` | `DESIGN_ONLY` | CAN/virtual network 없음 | 10 ms CAN 주장 금지 |
| N | `LF-COM-SUP` | `DESIGN_ONLY` | timeout/alive counter 없음 | 보류 |
| O Execution | `LF-EXE-CLOCK` | `VERIFIED` | fixed `1/60 s` clock (`SimulationClock.ts:1-39`) | simulation clock으로 한정 |
| O | `LF-EXE-SCHED` | `DESIGN_ONLY` | SW task scheduler 없음 | C chain은 함수 호출 순서일 뿐 runnable schedule 아님 |
| O | `LF-EXE-SUP` | `DESIGN_ONLY` | deadline/jitter/WCET monitor 없음 (`VehicleSwPort.ts:44-48`) | 보류 |
| O | `LF-EXE-RECORD` | `PARTIAL` | incident ring, scenario samples, reset/replay (`PropulsionCase.ts:75-101`, `VehicleScenario.ts:40-60`) | 전체 state/queue/injector snapshot이나 deterministic replay 보증 없음 |
| P Actuation/Plant | `LF-ACT-DRIVE` | `VERIFIED` | torque+direction→signed force와 Rapier wheel apply (`EDriveToVehiclePhysicsAdapter.ts:4-8`, `RapierVehiclePhysics.ts:70-84`) | arcade conversion임을 유지 |
| P | `LF-ACT-BRAKE` | `PARTIAL` | fixed force와 wheel brake impulse apply (`TemporaryBrakeSteeringAdapters.ts:5-7`, `RapierVehiclePhysics.ts:76-77`) | actuator dynamics/feedback 없음 |
| P | `LF-ACT-STEER` | `PARTIAL` | front wheel angle apply (`TemporaryBrakeSteeringAdapters.ts:8-10`, `RapierVehiclePhysics.ts:78`) | EPS actuator/feedback 없음 |
| P | `LF-PLANT-MOTION` | `VERIFIED` | Rapier vehicle state (`RapierVehiclePhysics.ts:70-98`) | validated real-vehicle plant가 아닌 arcade model |
| P | `LF-PLANT-ENV` | `PARTIAL` | surface friction/static colliders/map (`RapierVehiclePhysics.ts:20-35`, `:72-80`) | traffic/weather/perception truth 없음 |

## 4. 실제 Function→SWC/Runtime 할당

| 실행 단위 | 언어/owner | 대응 LF | 호출 주기 | 비고 |
|---|---|---|---|---|
| `DriverInputRuntime` | TypeScript host | `LF-DRV-ACQ`, 일부 `LF-DRV-VALID` | 60 Hz fixed tick마다 advance/read | DOM/keyboard 입력 자체는 render/input event 기반 |
| `Trackback_GearLogic` | C/WASM | `LF-GEAR-STATE`, 일부 interlock | 60 Hz | 별도 runnable 아님 |
| `Trackback_Propulsion` | C/WASM | propulsion acquire/interp/state 일부 | 60 Hz | 두 상태 enable만 보유 |
| `Trackback_VMC` | C/WASM | `LF-PROP-GEN`, `LF-MC-LON`의 좁은 일부 | 60 Hz | 전체 Motion Coordination 아님 |
| `Trackback_EDriveCase` | C/WASM | `LF-PROP-EDRV`, limit/output 일부 | 60 Hz | case variant mutation 포함 |
| `writeEDrivePhysicsCommand` | TypeScript host adapter | `LF-ACT-DRIVE` | 60 Hz | 숨은 brake priority 포함 |
| temporary brake/steering adapters | TypeScript host | actuator 경로 일부 | 60 Hz | 독립 controller 아님 |
| `RapierVehiclePhysics` | TypeScript/Rapier | plant/actuation 일부 | 60 Hz | 4-wheel raycast arcade plant |
| investigation/workbench | TypeScript | `LF-FM-OBS`, `LF-EXE-RECORD`, `LF-COM-PORT` 일부 | 사건/시험별 | 차량 ECU 기능이 아닌 test/game infrastructure |

## 5. 중복·책임 충돌

1. **`VMC` 이름 중복:** 실행 C 함수는 propulsion torque map이고, 참조 `MOTION_COORDINATION`은 다중 요청 수집·authority·배분을 뜻한다. 역할이 겹치지 않는데 이름이 겹친다.
2. **토크 제한 중복 인상:** VMC map의 최대 토크와 eDrive limit가 같은 180/130 Nm이어서 정상 기본 조건에서는 eDrive saturation의 독립 효과가 거의 드러나지 않는다 (`TrackbackSimulationCalibration.ts:16-19`). 서로 다른 책임이지만 calibration이 같아 중복처럼 보인다.
3. **제동 authority 분산:** 추진 차단은 DriveAdapter, brake force는 TemporaryBrakeAdapter가 소유한다. priority와 actuation이 다른 owner에 분산돼 있다.
4. **VehicleReady/Enable owner 부재:** Vehicle State/Mode가 아니라 SimulationRuntime이 생성한다.
5. **Sensing과 plant truth 혼동:** VehicleSpeed/LongitudinalVelocity는 sensor/estimator 출력이 아니라 Rapier truth다.
6. **Fault management와 시험 instrumentation 혼동:** fault injection, expected comparison, case answer oracle는 ECU monitoring/detection/reaction이 아니다.

## 6. 상태 전이 판정

| 상태/전이 | 판정 | 근거 | 누락 |
|---|---|---|---|
| Gear previous state | `VERIFIED` | `gear.c:3-13` | pending, reason, actuator applied state |
| D↔R moving reject | `VERIFIED` | `gear.c:7-11` | brake condition과 other transitions |
| Propulsion enabled/disabled | `PARTIAL` | `core.c:9`, `WasmVehicleSw.ts:50` | OFF/READY/ACTIVE/DEGRADED |
| Case DRIVING→CAPTURED | `VERIFIED` | `PropulsionCase.ts:62-85` | 차량 domain state가 아닌 game case state |
| Case SUBMITTED/RESOLVED | `VERIFIED` | `PropulsionCase.ts:176-242` | 차량 ECU recovery state가 아님 |
| Fault NORMAL/INJECTING/RESTORED | `PARTIAL` | `FaultInjection.ts:8`, `:95-133` | detection/confirmation/recovery guard 없음 |

## 7. 판정 유지 조건

이 매트릭스는 현재 코드에 대한 snapshot이다. 향후 LF를 `VERIFIED`로 올리려면 단순 UI 노드나 catalog 행이 아니라 다음 세 근거가 함께 필요하다.

1. 명시적 runtime owner와 실제 호출 경로
2. 입력/출력/상태/시간 계약
3. 요구사항에서 독립된 검증 또는 명시된 TRACKBACK-model oracle

자동 테스트 하나가 존재하거나 registry에 `IMPLEMENTED`가 적혀 있다는 사실만으로 판정을 올리지 않는다.
