# Architecture & Runtime Contradiction Register

## 1. 우선순위

- **P0:** Ground Truth 또는 제어권을 잘못 해석하면 이후 기능·시험·게임 판정 전체가 오염됨
- **P1:** traceability, interface, timing, verification 의미가 잘못 전달되거나 확장 구현을 방해함
- **P2:** 현재 좁은 범위에서는 동작하지만 이름·단위·문서 품질이 오해를 유발함

권고는 `유지`, `수정`, `보류`로 구분한다. “수정”은 후속 작업 권고이며 이번 감사에서 실제 소스는 수정하지 않았다.

## 2. 등록부

### ARC-001 — 74개 참조 Function과 실제 실행 Function의 혼동

- **우선순위 / 판정 / 권고:** P0 / `CONTRADICTION` / **수정**
- **코드 근거:** 실행 architecture는 DriverInput, GearLogic, PropulsionFunction, VMC, eDrive, adapters, VehiclePhysics로 제한된다 (`src/registries/investigation/Architecture.ts:41-54`). C 실제 순서는 네 함수다 (`c/vehicle_sw/core.c:7-12`).
- **관련 설계 문장:** 74 LF는 실제 구현 완료 문서가 아니다 (`docs/reference_vehicle/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md:693`). Domain/Function/SWC/Runnable/ECU는 서로 다른 엔티티다 (`docs/reference_vehicle/01_REFERENCE_ARCHITECTURE_KO.md:18-19`).
- **원인:** reference coverage와 runtime capability를 같은 탐색 구조에서 보여줄 수 있으나 capability qualifier가 빠지면 설계 노드가 실행 노드처럼 보인다.
- **수정 방향:** 74 LF마다 본 감사의 capability 상태를 canonical metadata로 관리하고 `DESIGN_ONLY`에는 실행·시험 버튼을 주지 않는다. 기존 추진 실행 구조는 유지한다.

### ARC-002 — 실행 `VMC`와 Vehicle Motion Coordination의 명칭·책임 충돌

- **우선순위 / 판정 / 권고:** P0 / `CONTRADICTION` / **수정**
- **코드 근거:** `Trackback_VMC`는 propulsion request와 speed만 받아 선형 torque를 계산한다 (`c/vehicle_sw/vmc.c:3-13`). registry도 전체 coordination이 아니라고 명시한다 (`Architecture.ts:46`, `:50`).
- **관련 설계 문장:** Motion Coordination은 요구 우선순위/배분 공통 기능 그룹이다 (`01_REFERENCE_ARCHITECTURE_KO.md:72`).
- **원인:** 기존 함수 이름을 넓은 도메인 약어와 재사용했다.
- **수정 방향:** 실행 함수의 표시/논리 역할을 `Propulsion Torque Generation`으로 고정하고, 참조 `MOTION_COORDINATION`과 별도 identity를 유지한다. C symbol rename은 호환성 검토 후 별도 결정한다.

### ARC-003 — 제동 우선권이 DriveAdapter에 숨겨짐

- **우선순위 / 판정 / 권고:** P0 / `CONTRADICTION` / **수정**
- **코드 근거:** brake가 active면 eDrive command가 valid여도 `driveForce=0`이다 (`src/runtime/control/EDriveToVehiclePhysicsAdapter.ts:5-8`). Brake force 생성은 다른 temporary adapter다 (`TemporaryBrakeSteeringAdapters.ts:5-7`).
- **관련 설계 문장:** reference는 `LF-MC-AUTH`, `LF-MC-ALLOC`, `LF-BRK-COORD`를 별도 책임으로 두며, 기존 audit는 brake/VMC dual owner를 OPEN으로 둔다 (`docs/reference_vehicle/PHASE03_DESIGN_AUDIT_KO.md`, A14).
- **원인:** 과거 arcade driving 안전/감각 정책이 propulsion-to-plant adapter에 결합됐다.
- **수정 방향:** 당장 동작은 유지하되 명시적 arbitration policy와 owner를 정의하고 adapter는 결정된 command 변환만 수행하게 한다. Brake SW가 생기기 전에는 host policy임을 표시한다.

### ARC-004 — VehicleReady/PropulsionEnable의 가상 제어권

- **우선순위 / 판정 / 권고:** P0 / `CONTRADICTION` / **수정**
- **코드 근거:** `vehicleReady = physics !== null`, `propulsionEnable = true`로 매 tick 주입된다 (`src/runtime/SimulationRuntime.ts:323-331`). publish 시 enable은 `clock.running && !error`로 다시 계산되어 SW input과 telemetry 의미도 다르다 (`:390-404`).
- **관련 설계 문장:** Vehicle State/Mode는 상태·허용을 관리하는 공통 기능 그룹이다 (`01_REFERENCE_ARCHITECTURE_KO.md:72`).
- **원인:** host lifecycle을 vehicle availability로 대용했다.
- **수정 방향:** 현재는 `HOST_SIMULATION_READY`, `HOST_PROPULSION_ENABLE_ASSUMPTION`으로 의미를 제한하고, 독립 Vehicle State/Permission을 구현하기 전에는 vehicle controller state로 표현하지 않는다.

### GT-001 — APPROVED 요구사항과 REVIEW_REQUIRED calibration의 승인 의미 충돌

- **우선순위 / 판정 / 권고:** P0 / `CONTRADICTION` / **수정**
- **코드 근거:** 모든 requirement type은 `status:'APPROVED'`, `provenance:'TRACKBACK_MODEL'`이다 (`src/data/ground-truth/PropulsionGroundTruth.ts:3-7`). 계산/expected는 `SIMULATION_ASSUMPTION`, `REVIEW_REQUIRED` calibration을 사용한다 (`src/data/calibration/TrackbackSimulationCalibration.ts:1-5`, `src/runtime/case/CaseExperiment.ts:18-30`).
- **관련 설계 문장:** 후보/OPEN 문제를 문서 작성만으로 해결한 것으로 간주하지 않는다 (`docs/reference_vehicle/04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:7`).
- **원인:** requirement 문장 승인, game calibration 선택, 공학적 calibration 승인 상태가 하나의 “approved” 인상으로 합쳐졌다.
- **수정 방향:** `TRACKBACK_MODEL_APPROVED`와 calibration review를 분리하고, TC 결과에 사용 calibration status를 표시한다. 양산/OEM 승인 주장은 금지한다.

### GT-002 — SYSR-PROP-009 allocation이 VMC와 eDrive 책임을 동시에 포함

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드 근거:** requirement는 VMC에 할당되었지만 “방향별 한계”까지 요구하고, linked SWR은 VMC와 eDrive 둘 다다 (`PropulsionGroundTruth.ts:23`, `:31-32`). 실제 limit owner는 eDrive다 (`c/vehicle_sw/edrive.c:3-10`).
- **관련 설계 문장:** Function과 SWC/Port는 별개이며 할당은 다대다일 수 있다 (`01_REFERENCE_ARCHITECTURE_KO.md:19`).
- **원인:** system requirement의 end-to-end 문장을 단일 component allocation field에 넣었다.
- **수정 방향:** system requirement allocation을 multi-owner/chain으로 표현하거나 VMC generation과 eDrive limitation acceptance를 분리한다.

### GT-003 — TC-001~005는 링크되지만 canonical test detail이 없음

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드 근거:** requirement가 TC-001~005를 링크한다 (`PropulsionGroundTruth.ts:14-17`)지만 `propulsionTests`는 TC-006A부터 시작한다 (`:37-49`). registry는 누락 시 `{id}` placeholder를 만든다 (`src/registries/investigation/Trace.ts:28-36`). 별도 test file에는 assertion이 있다 (`tests/propulsion-normal.test.mjs:27-38`).
- **관련 설계 문장:** reference와 executable TC를 구분해야 한다 (`PHASE03_DESIGN_AUDIT_KO.md`, A21).
- **원인:** automated-test metadata와 UI canonical Ground Truth가 이원화됐다.
- **수정 방향:** canonical TC detail을 한 owner에 합치고 automation link를 별도 field로 둔다. placeholder를 완전한 TC처럼 표시하지 않는다.

### GT-004 — TC-011/012의 자동화 존재와 Workbench `REFERENCE_ONLY` 혼동

- **우선순위 / 판정 / 권고:** P1 / `PARTIAL` / **유지 + 문서 수정**
- **코드 근거:** real Rapier test가 TC-011/012를 실행한다 (`tests/vehicle-physics.test.mjs:40`), UI execution map은 009/010A/010B만 executable이다 (`Trace.ts:22-35`).
- **관련 설계 문장:** runtime capability를 UNAVAILABLE/STRUCTURAL/OBSERVABLE/EXECUTABLE/COMPARABLE로 구분한다 (`04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:55-56`).
- **원인:** repository CI automation과 player workbench runner가 다른 capability인데 같은 “실행 가능” 용어를 쓴다.
- **수정 방향:** `AUTOMATED_REPOSITORY_TEST`와 `PLAYER_WORKBENCH_EXECUTABLE`을 별도 필드로 유지한다. 현 workbench 제한은 유지한다.

### SIG-001 — accelerator source 범위와 SW port acceptance 불일치

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드 근거:** live setter는 `[0,1]` clamp (`DriverInputRuntime.ts:16`), `validateInput`은 number만 확인 (`VehicleSwPort.ts:53-58`), C는 non-finite→0 및 clamp (`propulsion.c:10-14`).
- **관련 설계 문장:** signal contract에는 data type, range, validity가 필요하다 (`04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:41-55`).
- **원인:** source validation과 component robustness 정책이 한 signal contract로 문서화되지 않았다.
- **수정 방향:** port가 reject할 범위와 function이 saturate할 범위를 분리하고 direct WASM call 계약에 명시한다.

### SIG-002 — EDriveCommand catalog 단위·한계가 OPEN으로 남음

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드 근거:** TS type field는 `magnitudeNm`, calibration은 180/130 Nm이며 C가 이를 적용한다 (`WasmVehicleSw.ts:54-55`, `TrackbackSimulationCalibration.ts:18-19`, `edrive.c:6-9`).
- **관련 설계 문장:** command/force/torque 단위 구분이 우선 해결 항목이다 (`04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:7`).
- **원인:** Phase 04 candidate catalog가 이후 코드 사실을 반영하지 못했다.
- **수정 방향:** source-verified catalog revision에서 unit/range를 갱신하고 calibration provenance 경고는 유지한다.

### SIG-003 — registry edge와 실제 관측 interface의 혼동

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드 근거:** `runtimeConnections`는 선언 edge를 flatten한다 (`Architecture.ts:200`). 독립 endpoint telemetry는 eDrive→DriveAdapter에만 있다 (`FaultInjection.ts:109-133`).
- **관련 설계 문장:** 독립 endpoint가 없으면 interface 비교를 주장할 수 없고 후보 producer/consumer가 port 존재를 뜻하지 않는다 (`04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:62`, 기존 audit A11).
- **원인:** 구조 registry와 runtime observation capability를 같은 연결 개념으로 사용했다.
- **수정 방향:** `STRUCTURAL_EDGE`, `RUNTIME_TRANSFER`, `ENDPOINT_OBSERVABLE`, `COMPARABLE`을 분리한다.

### TIM-001 — 60 Hz physics loop를 SW task 주기로 확대 해석할 위험

- **우선순위 / 판정 / 권고:** P1 / `PARTIAL` / **유지 + 제한 명시**
- **코드 근거:** fixed timestep은 1/60 s (`SimulationClock.ts:1-2`), 전체 C step과 physics가 매 tick 한 번 실행된다 (`SimulationRuntime.ts:316-374`). platform layer는 unavailable이다 (`VehicleSwPort.ts:40-48`).
- **관련 설계 문장:** 1/60 s는 current physics이고 10/20 ms는 미래 논리 예시다 (`01_REFERENCE_ARCHITECTURE_KO.md:152`, `04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:15`).
- **원인:** deterministic loop가 ECU scheduler처럼 보일 수 있다.
- **수정 방향:** 현재 loop 유지. 모든 표시에서 `SIM_FIXED_STEP_60HZ`로 한정하고 runnable period/deadline claim을 금지한다.

### TIM-002 — scenario sample과 fault/interface timestamp가 한 tick 어긋남

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드 근거:** `tickTime`은 step 전 (`SimulationRuntime.ts:317`), injection은 그 시간을 기록 (`:321`, `:349`), sample은 clock step 후 시간으로 기록 (`:363-374`).
- **관련 설계 문장:** multi-rate/time events는 typed fault boundary와 분리해야 한다 (`01_REFERENCE_ARCHITECTURE_KO.md:152`; `04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:480-491`).
- **원인:** pre-step event와 post-step observation을 하나의 sample에 담으면서 time basis 필드를 나누지 않았다.
- **수정 방향:** `tickStartTime`, `tickEndTime`, event timestamp, observation timestamp를 분리하거나 모두 tick ID로 결합한다.

### PHY-001 — torque-to-force가 차량 동역학 변환처럼 보일 위험

- **우선순위 / 판정 / 권고:** P1 / `PARTIAL` / **유지 + 명칭 수정**
- **코드 근거:** 고정 `10 N/Nm`를 곱한다 (`TrackbackSimulationCalibration.ts:20`, `EDriveToVehiclePhysicsAdapter.ts:5-8`). wheel radius/gear ratio/driveline efficiency가 없다.
- **관련 설계 문장:** EDriveCommand, DriveForce, ActualDriveTorque를 분리하고 직접 비교 금지 (`PHASE03_DESIGN_AUDIT_KO.md`, A03; candidate `IFC-DESIGN-006`).
- **원인:** prior 1800 N game tuning을 보존하기 위한 adapter calibration이다.
- **수정 방향:** arcade conversion은 유지하되 `SIM_TORQUE_TO_FORCE_GAIN`으로 표시하고 실제 powertrain conversion이라고 설명하지 않는다.

### PHY-002 — Stability/ADAS용 sensing이 없는 plant

- **우선순위 / 판정 / 권고:** P1 / `DESIGN_ONLY` / **보류**
- **코드 근거:** public `VehicleState`는 pose, velocity, speed, longitudinal acceleration, gear뿐이다 (`src/domain/vehicle/VehicleState.ts:7-16`). wheel speed/slip/yaw estimate interface가 없다.
- **관련 설계 문장:** ABS/TCS/ESC에는 wheel/slip/yaw가 필요하며 부재가 audit A17에 등록돼 있다 (`PHASE03_DESIGN_AUDIT_KO.md`).
- **원인:** 현재 plant는 propulsion episode와 arcade handling 범위로 설계됐다.
- **수정 방향:** 현재 범위 유지. Stability/ADAS를 실행 가능으로 올리기 전에 sensor/estimator contract와 plant observability부터 설계한다.

### FLT-001 — Fault injection과 diagnostic fault state의 혼동

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드 근거:** injection은 두 point의 override/drop이며 recovery state는 injector 상태다 (`FaultInjection.ts:4-8`, `:62-71`, `:95-133`). monitor/platform layer는 unavailable이다 (`VehicleSwPort.ts:40-48`).
- **관련 설계 문장:** 주입된 고장과 ECU 검출은 다르며 관측→검출/확인→반응→recovery guard가 필요하다 (`01_REFERENCE_ARCHITECTURE_KO.md:119`, `02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md:636`).
- **원인:** 시험 도구의 상태명이 차량 fault lifecycle처럼 읽힐 수 있다.
- **수정 방향:** `INJECTOR_RESTORED`로 의미를 한정하고 diagnostic detection/reaction/recovery capability는 unavailable로 표시한다.

### FLT-002 — case root cause는 oracle 비교이지 독립 진단 결과가 아님

- **우선순위 / 판정 / 권고:** P1 / `PARTIAL` / **유지 + 공개 범위 제한**
- **코드 근거:** canonical root cause가 source에 고정돼 있고 제출 값을 직접 비교한다 (`CaseDefinition.ts:17-23`, `PropulsionCase.ts:176-187`). 충분성도 동일 eDrive variant의 0.5 ratio pattern으로 판정한다 (`Assessment.ts:4-20`).
- **관련 설계 문장:** hidden case truth와 visible action을 구분하고 injection/detection을 동일시하지 않는다 (`01_REFERENCE_ARCHITECTURE_KO.md:119`).
- **원인:** 게임 판정을 위해 정답 오라클이 필요하다.
- **수정 방향:** 게임 oracle은 유지하되 evidence view/engineering export에는 `CANONICAL_GAME_CASE_ORACLE`로 표기하고 일반 진단 알고리즘이라고 주장하지 않는다.

### VER-001 — Expected oracle가 production calibration과 같은 provenance에 의존

- **우선순위 / 판정 / 권고:** P1 / `PARTIAL` / **수정**
- **코드 근거:** TS oracle은 C 구현과 별도 함수지만 C instance의 calibration array를 읽는다 (`CaseExperiment.ts:18-30`).
- **관련 설계 문장:** reference 기능과 실제 executable 기능을 구분하고 tests가 공학 타당성을 자동 증명하지 않는다 (`TRACKBACK_CODE_AUDIT_REQUEST_KO.md`, 검증 원칙).
- **원인:** deterministic teaching test를 위해 같은 parameter set을 공유한다.
- **수정 방향:** algorithm oracle 독립성은 유지하되 calibration oracle provenance와 승인 상태를 시험 결과에 포함한다.

### VER-002 — Vehicle scenario의 requirement criterion이 verdict oracle이 아님

- **우선순위 / 판정 / 권고:** P1 / `PARTIAL` / **유지 + 표시 수정**
- **코드 근거:** capability는 `supportsExpectedOracle:false` (`Verification.ts:94-110`, `:138-153`). scenario definition은 requirement description을 저장할 수 있으나 실제 run은 대체로 `OBSERVED`다 (`VehicleScenario.ts:25-37`, `:48-60`).
- **관련 설계 문장:** Rapier 관찰만으로 expected vehicle trajectory를 만들 수 없다 (`PHASE03_DESIGN_AUDIT_KO.md`, A25).
- **원인:** 기준 참고와 자동 판정을 같은 workbench form에 넣었다.
- **수정 방향:** `REFERENCE_CRITERION`과 `EXECUTABLE_ORACLE`을 분리하며 현재 vehicle scenario는 observation-only로 유지한다.

### DOC-001 — 참조 설계 경로와 요청 산출물 경로 불일치

- **우선순위 / 판정 / 권고:** P1 / `CONTRADICTION` / **수정**
- **코드/파일 근거:** 실제 입력은 `docs/reference_vehicle/`; 요청 산출물은 `docs/reference-vehicle/audit/`. 현재 두 tree 모두 Git 추적 상태가 불명확하며 source tree는 감사 시작 시 untracked였다.
- **관련 설계 문장:** `AGENTS.md`는 별도 `docs/TRACKBACK_GAMIFICATION_REDESIGN_v1.md`를 product baseline으로 지정한다.
- **원인:** underscore/hyphen naming이 병존한다.
- **수정 방향:** 이번 산출물은 요청 path를 유지한다. 후속 승인 작업에서 canonical path와 migration/redirect 정책을 정하고 중복 source-of-truth를 제거한다.

### UI-001 — signal 이름 `steering`이 ratio와 rad command에 중복 사용

- **우선순위 / 판정 / 권고:** P2 / `PARTIAL` / **수정**
- **코드 근거:** driver input은 `[-1,1]` ratio (`DriverInputRuntime.ts:18`), physics command는 rad (`VehiclePhysicsPort.ts:3-8`), registry edge는 둘 다 `Steering/steering`으로 표시 (`Architecture.ts:69-71`).
- **관련 설계 문장:** 단위·signedness·precision을 signal contract에 포함한다 (`04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md:41-55`).
- **원인:** UI-friendly name과 technical ID를 혼용했다.
- **수정 방향:** `SteeringDemandNormalized`와 `FrontWheelSteeringAngleRad`로 semantic ID를 분리하고 label은 별도 유지한다.

### UI-002 — raw accelerator와 delivered accelerator의 관찰 위치 혼동

- **우선순위 / 판정 / 권고:** P2 / `PARTIAL` / **수정**
- **코드 근거:** HUD `accelerator`는 raw input (`SimulationRuntime.ts:390-397`), C 입력은 FI 적용 후 `swSnapshot.input`에 있다 (`:321-342`).
- **관련 설계 문장:** Source와 Destination 독립 endpoint를 비교해야 한다 (`04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md`, interface comparison contract).
- **원인:** player-facing telemetry와 SW-delivered input의 이름이 같다.
- **수정 방향:** UI/exports에 `DriverSourceAccelerator`와 `VehicleSwReceivedAccelerator`를 구분한다.

## 3. 우선순위 집계

| 우선순위 | 항목 | 즉시 의미 |
|---|---|---|
| P0 | ARC-001~004, GT-001 | 구현 범위·제어권·Ground Truth 승인 의미부터 고정 |
| P1 | GT-002~004, SIG-001~003, TIM-001~002, PHY-001~002, FLT-001~002, VER-001~002, DOC-001 | traceability·시간·interface·oracle 계약 교정 |
| P2 | UI-001~002 | semantic naming 정리 |

## 4. 보존해야 할 검증된 사실

문제 등록이 현재 구현 전체를 부정하는 것은 아니다. 다음은 그대로 유지할 수 있다.

- C/WASM의 실제 호출 경로와 ABI 검증
- Propulsion validity/inhibit/direction 처리
- VMC의 현재 선형 torque-map 계산 자체
- eDrive의 방향별 saturation
- signed physical actuation 경계가 adapter 한 곳에 있다는 구조
- VehicleSpeed magnitude와 LongitudinalVelocity projection의 구분
- deterministic 60 Hz simulation step
- component test에서 production C 함수를 직접 호출하는 seam
- FAIL을 root cause 확정으로 표현하지 않는 evidence 문구

다만 위 사실의 범위를 넘어 full vehicle controller, ECU scheduler, diagnostic manager, production calibration으로 확대 주장하면 안 된다.
