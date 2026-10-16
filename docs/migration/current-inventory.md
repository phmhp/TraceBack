# TRACKBACK 현재 구현 인벤토리

> 작성일: 2026-10-15  
> 범위: 읽기 전용 저장소 분석. 이 문서는 구현 변경이나 실차 적합성 승인을 의미하지 않는다.

## 1. 판정 전제

- 이 문서에서 **구현됨**은 현재 저장소에서 실행 경로 또는 테스트 근거가 확인된다는 뜻이다.
- `docs/reference_vehicle/`의 내용은 저장소 내부의 canonical reference design이지만 상태는 `REVIEWED_DRAFT`다. OEM 양산차 아키텍처, ECU 배치, CAN/CAN-FD 사양, DTC 또는 승인 calibration 근거가 아니다.
- `src/data/ground-truth/PropulsionGroundTruth.ts`의 `APPROVED`는 `provenance: TRACKBACK_MODEL` 범위의 프로젝트 내부 승인이다. 제네시스 GV70 실차 승인으로 해석하면 안 된다.
- `docs/reference/JKEV_2027_ko_KR.pdf`는 운전자 취급설명서이므로 운전자에게 보이는 기능·조건·경고·조치는 근거가 될 수 있지만, 내부 SW/ECU/네트워크 구현을 증명하지 않는다.

## 2. 디렉터리와 기술 스택

| 영역 | 역할 | 주요 경로 |
|---|---|---|
| Web application | React 19 UI와 composition root | `src/main.tsx`, `src/app/GameApplication.tsx`, `src/ui/` |
| 상태 관리 | 저빈도 게임 흐름, HUD 상태 | `src/ui/state/navigation.ts`, `src/ui/state/incidentRace.ts`, `src/ui/state/raceHud.ts`, `src/ui/state/recoveryHud.ts` |
| 시뮬레이션 런타임 | 60 Hz fixed-step, 입력→SW→어댑터→물리 조정 | `src/runtime/SimulationRuntime.ts`, `src/core/SimulationClock.ts` |
| 차량 SW | C11 reference SW를 WASM으로 실행 | `c/vehicle_sw/`, `src/runtime/c/WasmVehicleSw.ts`, `src/runtime/c/VehicleSwPort.ts` |
| 물리 | Rapier3D ray-cast vehicle | `src/physics/rapier/RapierVehiclePhysics.ts`, `src/physics/RapierWorld.tsx` |
| 그래픽 | React Three Fiber/Three.js 차량·도로·환경 | `src/graphics/`, `src/app/GameViewport.tsx` |
| 맵/환경 | JSON 지도, 노면, 경로·체크포인트 | `src/data/maps/`, `src/data/surfaces/`, `src/world/`, `src/registries/MapRegistry.ts` |
| 사건/조사 | CASE-PT-001, evidence, 가설, 검증, 수리 | `src/runtime/case/`, `src/runtime/investigation/`, `src/ui/investigation/` |
| 현재 실행 모델 | 좁은 추진 체인용 요구사항·신호·인터페이스 | `src/data/ground-truth/PropulsionGroundTruth.ts`, `src/registries/investigation/Architecture.ts`, `src/registries/investigation/Trace.ts` |
| 참조 차량 모델 | 16개 Area/74개 logical function의 설계 레지스트리 | `docs/reference_vehicle/`, `src/referenceVehicle/` |
| 빌드 | Vite 7, TypeScript 5.9, Zig 0.14.1 C→WASM | `package.json`, `vite.config.ts`, `tsconfig*.json`, `scripts/build-c-runtime.mjs` |
| 검증 | Node test runner 기반 회귀·통합 시험 | `tests/*.test.mjs`, `docs/evidence/*.json` |

주요 패키지는 React, Zustand, Three.js, React Three Fiber, Rapier3D, Vite, TypeScript다. `package.json`의 검증 명령은 `check:registry`, `typecheck`, `lint`, `test`, `build`다.

## 3. 현재 게임 진행 흐름

실제 조합은 다음과 같다.

1. `GameApplication`이 Pangyo 2 지도, WASM 차량 SW, `SimulationRuntime`, `PropulsionCase`, `RecoveryChallenge`를 조합한다.
2. `navigation.ts`가 `MAIN → SESSION_SETUP → PRE_RACE → NORMAL_DRIVE`를 관리한다.
3. 플레이어 입력은 `KeyboardInputAdapter`와 `DriverInputRuntime`을 거친다.
4. 런타임은 매 fixed step에 C/WASM의 Gear → Propulsion → VMC → eDrive 순서를 실행한다.
5. CASE-PT-001 활성 조건과 사건 프레임 캡처가 충족되면 `FAULT_EVENT`로 전환하고 런타임/물리를 정지한다.
6. 조사실은 Page 1 현상, Page 2 경계 추적, Page 3 검증, Page 4 결론·수리로 구성된다.
7. 수리 회귀시험이 통과하면 countdown 후 `RECOVERY_DRIVE`를 시작한다.
8. ordered checkpoint와 finish를 통과하면 `MISSION_FINISH → MISSION_RESULT`로 이동한다.
9. Debrief는 주행, 진단, 수리를 분리해 표시하고 retry/clean rematch를 제공한다.

관련 파일: `src/app/GameApplication.tsx`, `src/ui/state/navigation.ts`, `src/runtime/SimulationRuntime.ts`, `src/ui/screens/RaceScreen.tsx`, `src/ui/investigation/InvestigationWorkspace.tsx`, `src/ui/screens/DebriefScreen.tsx`.

## 4. 실제 실행 차량 기능과 책임

| 실행 객체 | 현재 책임 | 구현 경로 | 실차 사실 상태 |
|---|---|---|---|
| DriverInput | 키 입력을 가속/제동/조향/기어 요청으로 변환하고 slew/clamp 적용 | `src/input/keyboard/`, `src/runtime/driver/DriverInputRuntime.ts` | 게임 입력 모델 |
| GearLogic | 요청 유효성과 D↔R 속도 interlock으로 GearState 결정 | `c/vehicle_sw/gear.c` | 내부 알고리즘은 프로젝트 가정 |
| PropulsionFunction | ready/enable/gear/페달에 따라 정규화된 추진 요청 생성 | `c/vehicle_sw/propulsion.c` | 프로젝트 모델 |
| VMC | 정규화 요청과 속력으로 토크 요구 계산 | `c/vehicle_sw/vmc.c` | 명칭·계산식 모두 프로젝트 모델 |
| eDrive | 방향별 토크 limit 및 CASE variant 적용 | `c/vehicle_sw/edrive.c` | 명칭·limit·결함 모두 프로젝트 모델 |
| DriveAdapter | 토크 명령을 signed force로 변환; brake active면 drive force 0 | `src/runtime/control/EDriveToVehiclePhysicsAdapter.ts` | arcade simulation adapter |
| BrakeAdapter | brake ratio를 6500 N scale로 변환 | `src/runtime/control/TemporaryBrakeSteeringAdapters.ts` | 임시 simulation path |
| SteeringAdapter | steering ratio를 속도 의존 steering angle로 변환 | 같은 파일 | 임시 simulation path |
| VehiclePhysics | 힘/제동/조향을 Rapier vehicle에 적용하고 속도·자세 산출 | `src/physics/rapier/RapierVehiclePhysics.ts` | 게임 물리 |

`c/vehicle_sw/trackback.h`는 이 코드를 “handwritten, not certified/generated ECU code”라고 명시한다. 현재 저장소에는 실차 ECU 구성, ECU 간 배치, runnable schedule, CAN ID, UDS/DTC 구현이 없다.

## 5. Reference Vehicle Registry

`scripts/build-reference-vehicle-registry.mjs`는 아래 canonical draft 문서에서 `src/referenceVehicle/generated/reference-vehicle-registry.json`을 재생성한다.

- Functions: `docs/reference_vehicle/architecture/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md`
- Signals/interfaces: `docs/reference_vehicle/interfaces/04_SIGNAL_CATALOG.csv`, `04_INTERFACE_CATALOG.csv`
- Requirements/trace: `docs/reference_vehicle/requirements/05_REQUIREMENT_CATALOG.csv`, `05_TRACEABILITY.csv`
- Tests: `docs/reference_vehicle/verification/06_TEST_CASE_CATALOG.csv`, `06_REQUIREMENT_TC_TRACEABILITY.csv`
- Cases: `docs/reference_vehicle/cases/07_CASE_CATALOG.csv`, `07_CASE_REQUIREMENT_TC_TRACEABILITY.csv`

현재 레지스트리 수량은 Area 16, Logical Function 74, Signal 111, Interface 50, Requirement 180, Test Case 74, Case 34이며 unresolved reference 17건이 남아 있다. `docs/reference_vehicle/README.md`의 기능 구현 범위는 `VERIFIED 5 / PARTIAL 27 / DESIGN_ONLY 42`다. 74개 TC는 실행 가능한 TC 74개가 아니라 대부분 future reference test specification이다.

## 6. 인터페이스와 신호

### 실행 경로

`src/registries/investigation/Architecture.ts`는 현재 관찰 가능한 좁은 체인을 정의한다.

`DriverInput → GearLogic → PropulsionFunction → VMC → eDrive → DriveAdapter → VehiclePhysics`

핵심 실행 신호는 `AcceleratorPedalPosition`, `GearRequest`, `GearState`, `PropulsionRequest`, `DriveTorqueRequest`, `EDriveCommand`, `driveForce`, `VehicleSpeed`, `LongitudinalVelocity` 등이다. actual reader와 일부 oracle reader도 같은 파일에 연결되어 있다.

### 참조 설계

111개 signal과 50개 logical interface는 설계 레지스트리 항목이다. 예를 들어 `IFC-DESIGN-050`은 reference Propulsion request boundary이며 `NO_CURRENT_RUNTIME_TRANSFER`, `NO_TRANSPORT_MAPPING`, `NOT_COMPARABLE`로 명시된다. 이 항목들을 실제 ECU 포트나 CAN frame으로 표시하면 안 된다.

`src/communication/README.md`는 현재 CAN-FD 또는 실제 signal delivery를 구현하지 않는다고 명시한다. 실행 가능한 양단 비교는 현재 `eDrive → DriveAdapter` same-tick instrumentation에 한정된다.

## 7. 요구사항과 상태 전이

### 현재 실행 요구사항

- `src/data/ground-truth/PropulsionGroundTruth.ts`에 TRACKBACK_MODEL provenance의 시스템/소프트웨어 요구사항 21개와 대표 TC가 있다.
- `src/registries/investigation/Trace.ts`가 component↔requirement↔test 연결과 Page 2 선택 정합성을 제공한다.
- 수치 calibration은 `src/data/calibration/TrackbackSimulationCalibration.ts`에 있고 전부 `SIMULATION_ASSUMPTION`/`REVIEW_REQUIRED`다.

### 상태 전이

- 게임: `src/ui/state/navigation.ts`의 `GamePhase`.
- 사건: `PropulsionCase`의 `DRIVING → CAPTURED → SUBMITTED → RESOLVED`.
- 조사 세션: `InvestigationSession.ts`의 Page/View/Selection/History/Action/Boundary/Hint 상태.
- 차량 시나리오: `PRECONDITION → STIMULUS → OBSERVATION → RESULT`; 승인 oracle이 없으면 결과는 `OBSERVED`.
- 회복 레이스: `LOCKED → READY → RUNNING → FINISHED`.

## 8. Fault Injection과 Fault Detection

| 구분 | 현재 구현 | 경로 | 제한 |
|---|---|---|---|
| CASE software defect | eDrive 정상 clamp 결과에 variant 1에서 0.5 배율 적용 | `c/vehicle_sw/edrive.c`, `src/runtime/case/PropulsionCase.ts` | 교육용 code variant; 실차 결함 아님 |
| Scenario FI | accelerator 또는 eDrive→DriveAdapter 경계에 override/drop-update | `src/runtime/scenario/FaultInjection.ts` | 원본/전달/복구 관측용 |
| Vehicle scenario | precondition/stimulus/monitor/window 실행 | `src/runtime/scenario/VehicleScenario.ts`, `SimulationRuntime.ts` | 기본 verdict `OBSERVED` |
| Fault detection | 별도 ECU monitor/DTC lifecycle 없음 | reserved README 및 reference design | FI 적용을 ECU fault detection으로 간주 금지 |

CASE-PT-001은 D, ready/enable valid, accelerator ≥ 0.2, brake ≤ 0.01, |steering| ≤ 0.35, speed ≥ 0.3 m/s 조건을 연속 0.75 s 만족하고 정상 노출 5 s가 지난 뒤 fault variant를 활성화한다. 활성화 후 2 s 뒤 최대 420개 frame을 캡처한다. 이 시간과 문턱값은 실차가 아니라 게임 조건이다.

## 9. 고장 원인 추리 시나리오

현재 완성된 실행 Case는 `CASE-PT-001 · 가속 반응 저하` 하나다.

- 정의: `src/runtime/investigation/CaseDefinition.ts`
- 실행/증거/정답/수리: `src/runtime/case/PropulsionCase.ts`
- C 결함: `c/vehicle_sw/edrive.c`
- Root cause: `eDrive / LOGIC_CALCULATION / INCORRECT_SCALING`
- 충분성: 같은 방향의 서로 다른 양의 비포화 입력 2개 이상에서 actual/expected 비율이 0.5±0.01로 반복
- Repair variants: 정상 variant 0, 두 배 보상 variant 2, limit 제거 variant 3
- 성공 조건: 선택한 사건 근거 + formal C/WASM test evidence + 정답 분류 + 회귀시험 전체 통과

Reference Registry의 나머지 33개 case는 실행 case가 아니다. 개별 `implementationStatus`, `approvalStatus`, `oracleCapability`를 확인해야 한다.

## 10. 플레이어 관측 정보

| 단계 | 표시/조작 정보 | 구현 경로 |
|---|---|---|
| Race | race time, speed, gear, accelerator/brake/steering, minimap | `RaceHUD.tsx`, `Minimap.tsx` |
| Incident | 일반 증상 대화와 조사실 진입 | `IncidentDialogue.tsx` |
| Page 1 | 운전자 진술, 입력, 운행 상태, 실제 반응, 사건 timeline | `Page1Phenomenon.tsx`, `InvestigationPresentationModel.ts` |
| Page 2 | 기능 흐름, signal actual/expected, interface, requirement/test basis | `Page2Tracking.tsx`, `page2/ViewAFlow.tsx`~`ViewDStandards.tsx` |
| Page 3 | 요구사항 기반 TC 설계, VMC/eDrive 독립 계산, vehicle scenario 관찰 | `Page3Verification.tsx`, `VehicleScenarioWorkbench.tsx` |
| Page 4 | root cause/failure type 제출, evidence gate, repair regression | `Page4Conclusion.tsx` |
| Debrief | driving/diagnosis/resolution, hint/assisted, incident loss, sector/PB | `DebriefScreen.tsx` |

Clue는 `PHENOMENON`, `FAULT_BOUNDARY`, `PROOF` 세 개다. Page 방문이나 탭 클릭이 아니라 저장된 evidence ID, MATCH/MISMATCH boundary 선택, formal test sufficiency로 해금된다. 관련 로직은 `GameplayInvestigation.ts`와 `InvestigationSession.ts`다.

## 11. 정답 판정과 점수

- 정답 분류는 `CaseDefinition.rootCause`와 제출한 location/failure type/detailed cause를 비교한다.
- 근거 충분성은 정답 여부와 별도로 `Assessment.ts`가 평가한다.
- Suspect 상태는 `POSSIBLE / ELIMINATED / SUPPORTED`이며 evidence reference로 계산된다.
- repair 성공은 C/WASM 재현 입력, 방향 한계, INVALID, P/N/D/R, disabled, D↔R interlock 회귀시험 전체 통과로 판정한다.
- 일반적인 숫자 점수 경제는 없다.
- gameplay 평가는 incident time loss, diagnosis duration, hint/assisted, checkpoint/sector, PB, clean rematch 기록으로 제공된다.
- medal threshold는 현재 설정되지 않아 완주 시 `COMPLETE`만 표시한다.

## 12. 저장 구조와 객체 참조 관계

```text
GameApplication
 ├─ SimulationRuntime ── VehicleSwPort ── C/WASM
 │        ├─ VehiclePhysicsPort ── RapierVehiclePhysics
 │        ├─ PropulsionCase
 │        ├─ FaultInjectionRuntime
 │        └─ RecoveryChallenge
 ├─ navigation Zustand store
 └─ UI contexts / HUD stores

PropulsionCase
 ├─ CaseDefinition
 ├─ IncidentFrame[]
 ├─ Evidence[] ── frameId/runId/scenarioId/requirementId/testCaseId
 ├─ ExperimentRun[]
 ├─ Diagnosis / RootCauseReport
 └─ Repair ExperimentRun[]

ReferenceVehicleRegistry
 ├─ canonical entity IDs
 └─ typed relations and source path/row provenance
```

- runtime/조사/진단 데이터는 브라우저 메모리에만 있다.
- 영속 저장은 `RecoveryChallenge`가 `window.localStorage`에 mode별 total/sector best time을 저장하는 범위뿐이다.
- 사건 보고서는 `PropulsionCase.report()`로 구성 가능하지만 자동 영속 저장소는 없다.
- `docs/evidence/*.json`은 테스트 실행이 생성하는 repository evidence다.

## 13. 현 상태의 핵심 한계

1. 취급설명서와 직접 연결된 source/evidence ID가 runtime 요구사항·case에 없다.
2. 프로젝트 내부 용어와 OEM 실차 내부 구조의 관계는 검증되지 않았다.
3. ECU, 네트워크, CAN ID, DTC, production threshold/timing은 확인되지 않았다.
4. 실제 실행은 좁은 Propulsion slice이며 Braking/Steering/ADAS/Energy 등의 reference design 대부분은 실행 불가다.
5. `GroundTruth`라는 이름은 범위를 모르면 실차 truth로 오해될 수 있으나 실제 provenance는 TRACKBACK_MODEL이다.
6. CASE-PT-001의 symptom은 실제 차량에서 가능한 현상과 모순되지는 않지만, eDrive 0.5 scaling이라는 원인은 매뉴얼로 검증할 수 없다.
7. 사용자 문맥은 “2026년형 GV70”이지만 파일명은 `JKEV_2027_ko_KR.pdf`다. 문서 자체는 Copyright 2026과 전 차종/사양 차이 고지를 포함한다. 정확한 모델·연식·시장판 식별은 마이그레이션 전 별도 확인이 필요하다.

## 14. 분석 결론

현재 프로젝트는 **작동하는 교육용 추진 결함 추리 게임**과 **넓지만 대부분 draft/design-only인 reference vehicle model**을 함께 보유한다. 전자는 실행 근거가 강하지만 실차 근거가 아니고, 후자는 설계 범위가 넓지만 OEM 내부 사양 근거가 아니다. 재설계의 첫 단계는 어느 쪽도 삭제하는 것이 아니라 각 항목에 `OWNER_MANUAL_FACT`, `TRACKBACK_RUNTIME_FACT`, `SIMULATION_ASSUMPTION`, `UNVERIFIED_INTERNAL` 출처를 명시하는 것이다.
