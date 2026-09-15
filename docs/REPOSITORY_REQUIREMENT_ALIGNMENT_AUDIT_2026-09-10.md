# TRACKBACK Repository / Requirement 정합성 Audit

작성일: 2026-09-10  
범위: 현재 Repository와 `Requirement.md`의 정합성 점검. 미래 기능 구현 및 미승인 Ground Truth 생성은 제외한다.

## 전제 및 문서 상태

- 요청에서 필수로 지정한 `TRACKBACK_CURRENT_CONTEXT.md`는 Repository에 없다.
- `AGENTS.md`도 Repository에 없다.
- 대신 `00_TRACEBACK_MASTER.md`, `README.md`, Phase 보고서가 있으나 최신 상태를 완전히 반영하지 않는다. 예를 들어 `README.md`는 Green Valley 맵 한 개라고 설명하지만 Runtime은 Pangyo2 맵을 기본으로 사용한다.
- `Requirement.md` 63절은 `Serverless LLM Proxy`와 제한된 Runtime AI를 포함하지만 이번 Audit의 최신 방향은 Runtime 외부 LLM을 전면 금지한다. 최신 방향을 우선 적용해야 한다.
- `TRACKBACK Propulsion Reference Requirements v0.1.md`는 상세한 요구사항 후보를 담고 있으나 승인 상태, provenance, calibration 승인 여부가 명시되지 않았다. 승인된 Runtime Ground Truth로 취급할 수 없다.

## A. 현재 실제 Architecture

### Driving Runtime

```text
Keyboard DOM Event
→ KeyboardMapping
→ KeyboardInputAdapter
→ DriverInputRuntime / DriverInputState
→ SimulationRuntime (60 Hz fixed tick owner)
→ writeSimpleVehiclePhysicsCommand
→ VehiclePhysicsCommand
→ RapierVehiclePhysics
→ Rapier DynamicRayCastVehicleController
→ VehicleState feedback
→ RaceTelemetry (약 10 Hz UI publish)
```

실제 연결 파일:

- 키 해석: `src/input/keyboard/KeyboardMapping.ts`
- Browser adapter와 Esc lifecycle: `src/input/keyboard/KeyboardInputAdapter.ts`
- 입력 상태: `src/runtime/driver/DriverInputRuntime.ts`
- 고정 Tick 및 orchestration: `src/runtime/SimulationRuntime.ts`
- 임시 제어 해석: `src/runtime/control/SimpleVehicleControlAdapter.ts`
- Engine 독립 물리 명령 계약: `src/domain/vehicle/VehiclePhysicsPort.ts`
- Rapier 적용 및 feedback: `src/physics/rapier/RapierVehiclePhysics.ts`

책임 배치:

| 책임 | 현재 위치 |
|---|---|
| Accelerator interpretation | `SimpleVehicleControlAdapter`의 `input.accelerator * 1800 * speedFactor` |
| Brake interpretation | 동일 adapter의 brake priority와 `* 6500` |
| Steering interpretation | 동일 adapter의 속도 기반 steering 감소식 |
| Gear | `DriverInputRuntime`; 항상 D로 강제 |
| Drive force 계산 | `SimpleVehicleControlAdapter` |
| Brake force 계산 | `SimpleVehicleControlAdapter` |
| Steering angle 계산 | `SimpleVehicleControlAdapter` |
| Wheel/physics 적용 | `RapierVehiclePhysics.step` |
| Vehicle state feedback | `RapierVehiclePhysics.readState` → `SimulationRuntime` |

향후 `DriverInput → VMC → eDrive → VehiclePhysics` 전환 시 `SimulationRuntime`의 `writeSimpleVehiclePhysicsCommand` 호출 지점을 orchestration boundary로 사용하면 된다. `VehiclePhysicsPort`는 유지하고, 임시 adapter를 승인된 Function/VMC/eDrive Runtime 출력으로 대체하는 것이 최소 변경 경로다.

### Game Flow

`src/ui/state/navigation.ts`의 저주파 상태 머신이 다음 상태를 정의한다.

```text
MAIN → SESSION_SETUP → RACE_COUNTDOWN → RACE_NORMAL
RACE_NORMAL ↔ PAUSE_MENU
RACE_NORMAL → FINISH → DEBRIEF
Debug query session: RACE_NORMAL/PAUSE_MENU → XRAY_MODE → RACE_NORMAL
```

미래 상태 `FAULT_DETECTED`, `INCIDENT_RECORDING`, `INCIDENT_FREEZE`, `ROOT_CAUSE_SELECTION`, `CORRECTIVE_ACTION`, `VERIFICATION_REPLAY`, `VERIFICATION_PASS/FAIL`, `RACE_RESUME`는 enum에만 존재하며 Runtime transition/logic은 없다.

- MAIN: 구현됨.
- SESSION_SETUP: 실제 `SessionConfig` 선택/확정 및 Runtime 주입 구현됨.
- COUNTDOWN: 3/2/1/GO와 4초 후 Runtime 시작 구현됨.
- RACE: 구현됨.
- PAUSE: Esc, 입력 neutral, clock/physics pause, Continue 구현됨.
- RESTART: 확인창 후 동일 `SessionConfig`, 차량/입력/clock/finish 초기화, countdown 재진입.
- QUIT: 확인창 후 Main 이동 및 Runtime reset.
- X-Ray: Component가 존재하나 명시적으로 Placeholder. Production HUD 진입 버튼은 없다. URL에 `?debug`가 있는 개발 세션에서만 F9 진입 가능하며 진입 시 Runtime pause.
- DEBRIEF: 정상 완주 보고서 shell은 구현됐지만 Fault/Requirement/Oracle 데이터는 `NOT ASSIGNED/NOT EXECUTED`로 명시한다.

### Map / World

```text
MapDefinition
├ ImportedBaseMap (roads/connectors/buildings/metadata)
├ RoadProfileRegistry
├ SurfaceRegistry / SurfaceSystem
├ Environment zones / presentation environment
├ RouteDefinition (ordered route/start/finish/checkpoints)
├ Spawn points
├ Actor spawn points
├ Scenario trigger zones
└ capabilities
```

Pangyo2 기본 맵 실측:

- Imported roads 199, buildings 189, connectors 204.
- Road profile: Highway 6-lane 35, Urban 4-lane 11, Residential 2-lane 122, Mountain 2-lane 29, Open Test 1, Dirt 1.
- 선택 RaceRoute: 약 650.2 m, 417 points, checkpoint 4.
- Actor spawn 0, Scenario trigger 0, explicit surface zone 0.
- Imported road elevation 범위 0–2.1 m이나 현재 물리 ground는 평면이다.

Minimap, start/finish marker, finish trigger는 모두 `minimapConfig.routeId`로 선택된 동일 `RouteDefinition`을 사용한다. Checkpoint는 같은 Route에 있으나 progress/runtime 판정에는 아직 사용되지 않는다. 별도 hardcoded minimap route는 없다.

## B. Requirement.md와 실제 코드 사이의 주요 Gap

1. `Requirement.md`의 VMC, eDrive, controller scheduler, CAN-FD, Fault, Verification, Black Box, Replay는 구현되지 않았다.
2. 요구 Ego state 중 acceleration, heading, steering, gear가 `VehicleState`에 없다. Gear/accelerator/brake/steering은 별도 `DriverInputState` 또는 telemetry에만 있다.
3. Requirement/Test/Signal/Architecture Ground Truth용 schema, loader, approved dataset이 없다.
4. Runtime execution은 Physics tick 안에서 input→temporary adapter→physics만 실행한다. software/communication timing scheduler가 없다.
5. Traffic actor 정의 타입은 있으나 Pangyo 데이터와 Runtime behavior가 없다.
6. Scenario capability는 문자열 목록에 불과하며 capability 조건, 구간 index, query/validation이 없다.
7. Debrief shell은 있으나 actual evidence, incident result, trace, before/after verification이 없다.
8. Requirement의 Runtime AI/Serverless 항목은 최신 “Runtime AI 금지” 방향과 충돌한다.
9. 개발 순서 문서와 실제 Phase 명칭이 어긋난다. Requirement는 Phase 4를 VMC/eDrive로 정의하지만 Repository Phase 4/4.1은 Map/Presentation에 사용됐다.

## C. Critical Blocker

1. **현재 맥락 문서 부재:** `TRACKBACK_CURRENT_CONTEXT.md`가 없어 승인 상태, 현재 Phase, 다음 Phase 경계를 단일 Source로 확인할 수 없다.
2. **Ground Truth 승인 상태 부재:** Propulsion 문서는 상세하지만 DRAFT/REVIEWED/APPROVED 상태 및 승인자가 없다. 숫자 calibration(예: 120 Nm, 300 Nm, 50 Nm)을 Runtime 값으로 사용할 근거가 없다.
3. **Architecture/Signal 계약 부재:** VMC/eDrive vertical slice 전에 Component responsibility, I/O, unit, validity, state ownership을 승인해야 한다.
4. **Requirement schema 부재:** 문서 텍스트를 Runtime에서 직접 참조할 수 없고 trace/test/oracle의 식별자 무결성을 검증할 방법이 없다.
5. **Scenario-addressable map 구간 부재:** 시각적 geometry는 있으나 trigger/capability segment/actor spawn이 없어 Case가 필요한 환경을 deterministic하게 선택할 수 없다.

## D. 지금 수정해야 하는 Foundation 문제

이번 Audit에서는 수정하지 않는다. 다음 구현 전 정리할 Foundation은 다음과 같다.

1. `TRACKBACK_CURRENT_CONTEXT.md`를 만들고 실제 Phase, 승인 데이터, 구현/미구현, 다음 Task를 기록한다.
2. `Requirement.md`에서 Runtime AI/Serverless 방향을 Authoring-only AI + approved local dataset으로 정정한다.
3. 모든 authoring data에 `status`, `provenance`, `generationMethod`, `schemaVersion`을 요구하는 승인 경계를 정의한다.
4. `VehicleState`와 Driver/Function state의 소유권을 명확히 한다. Gear State를 Driver request와 분리할 boundary가 필요하다.
5. Map capability를 단순 문자열에서 검증 가능한 구간/조건으로 연결할 설계를 정한다.
6. README와 Phase 문서를 현재 Pangyo 기본 맵 및 실제 Game Flow에 맞춘다.

## E. Requirement 확정 이후 구현해야 하는 기능

- Propulsion FunctionDefinition 및 Normal Behavior Runtime.
- VMC/eDrive 경계와 상태/명령 계약.
- 승인 Signal Dictionary 및 추후 CAN scheduler.
- deterministic Requirement/Test Oracle.
- Fault stimulus와 software defect 분리 모델.
- Case/ScenarioVariant loader와 headless validation.
- timestamped RuntimeEvidence, Black Box ring buffer, snapshot replay.
- evidence-driven X-Ray와 root cause/corrective action workflow.
- Traffic Runtime 및 scenario actor behavior.

## F. 후반 Polish로 미뤄도 되는 기능

- X-Ray shell의 node animation, light pulse, frosted vehicle shell.
- AI hint/debrief 문장 authoring 및 표현 개선.
- Pit stop/verified spare vehicle 연출.
- 추가 particle/audio/camera 연출.
- 실제 DBC bit packing, advanced traffic visual, 추가 그래픽 디테일.

## G. Gear 기능 준비 상태

| 점검 항목 | 결과 |
|---|---|
| 1. DriverInputState에 Gear 존재 | **YES** — `P/R/N/D` union과 `gear` field 존재 |
| 2. Vehicle Runtime에 Gear State 존재 | **NO** — `VehicleState`에는 gear 없음 |
| 3. 상수 D Hardcode | **YES** — `FIXED_PHASE_3_GEAR = 'D'`, 다른 set 요청도 D로 강제 |
| 4. VehiclePhysics가 Gear 참조 | **NO** — Physics command에는 drive/brake/steering만 존재 |
| 5. Reverse Motion | **NO** |
| 6. Neutral 개념 | **PARTIAL** — 입력 neutral reset은 있으나 Gear N propulsion state는 없음 |
| 7. Gear HUD | **NO** — telemetry에는 gear가 있지만 현재 `RaceHUD`가 표시하지 않음 |
| 8. Start/Restart 초기화 | **YES** — `DriverInputRuntime.reset()`이 명시적으로 D 설정 |
| 9. 삽입 Boundary | **GOOD** — DriverInput `setGear` API와 `SimpleVehicleControlAdapter` 교체 지점. 다만 GearRequest와 actual GearState 계약을 새로 정의해야 함 |

Interlock threshold, P/R/N/D 동작, reverse enable은 승인 Requirement 전 구현하면 안 된다.

## H. Map Scenario Capability 준비 상태

판정은 “geometry가 보인다”보다 Case가 deterministic하게 선택/검증할 수 있는가를 기준으로 했다.

| Capability | 판정 | 근거/제한 |
|---|---|---|
| LONG_STRAIGHT | PARTIAL | 직선 도로는 있으나 최소 길이 계산/index가 없음 |
| CURVE | SUPPORTED | 선언 capability와 연속 곡선 Route/road geometry 존재 |
| S_CURVE | PARTIAL | Route에 좌/우 곡률 변화는 있으나 S-curve 구간 선언/검증 없음 |
| INTERSECTION | SUPPORTED | Imported connectors와 junction mesh, capability 선언 존재; scenario trigger는 없음 |
| MULTI_LANE | SUPPORTED | 2/4/6 lane profile 존재 |
| URBAN_ROAD | SUPPORTED | residential/secondary/service network와 buildings 존재 |
| HIGHWAY | SUPPORTED | 35개 Highway 6-lane road와 HIGH_SPEED capability 존재 |
| UPHILL | MISSING | 일부 visual Y 값만 있고 평면 physics ground라 주행 경사로 검증 불가 |
| DOWNHILL | MISSING | 동일 |
| LOW_GRIP | MISSING | Pangyo explicit low-grip zone 없음 |
| DIRT_GRAVEL | PARTIAL | default gravel 및 dirt road 1개가 있으나 선택 Route/trigger capability로 연결 안 됨 |
| LEAD_VEHICLE_ALLOWED | MISSING | actor spawn/runtime 없음 |
| CROSS_TRAFFIC_ALLOWED | MISSING | actor spawn/runtime 없음 |
| HIGH_SPEED_ALLOWED | PARTIAL | 도로/capability는 있으나 안전한 scenario segment constraints 없음 |

추가 점검:

| 항목 | 결과 |
|---|---|
| Building/Obstacle collider | Building 189개 collider 생성. Footprint polygon 대신 AABB라 정밀도는 PARTIAL |
| Road/Building overlap | Import 단계 검증 없음 |
| Start/Finish | 동일 RouteDefinition 사용, 시각 marker와 finish trigger 구현 |
| Checkpoint | 4개 데이터 존재, Runtime progress 판정 없음 |
| Lane count 다양성 | 1/2/4/6 lane profile 존재 |
| Elevation | visual data 일부 존재, drivable physics elevation 없음 |
| Sidewalk | profile 기반 visual 존재, semantic/collider 없음 |
| Crosswalk | connector 표본에 visual 생성, source semantic/전수 배치 아님 |
| Traffic light | connector 표본 visual만 존재, signal state/runtime 없음 |
| Guardrail | 일부 highway visual/collider 존재; 전체 network/semantic coverage는 제한적 |
| Minimap/route 일치 | 동일 orderedPoints 사용 |
| RaceRoute single source | 대체로 YES. Finish detection/markers/minimap이 동일 선택 Route를 참조 |

## I. X-Ray Data 준비 상태

| Layer/Data | 상태 | 근거 |
|---|---|---|
| VEHICLE / Vehicle State | PARTIAL | pose, velocity, angular velocity, speed 존재; acceleration/heading/actual gear 등 부족 |
| VEHICLE / Driver Input | READY | accelerator/brake/steering/fixed gear와 timestamp 없는 live state 존재 |
| FUNCTION / Function State | MISSING | Function Runtime 없음 |
| FUNCTION / Motion Request | MISSING | 물리 force command만 있고 승인된 motion request가 아님 |
| FUNCTION / State Transition | MISSING | Game flow state만 존재 |
| SOFTWARE / Component Input | MISSING | VMC/eDrive component 없음 |
| SOFTWARE / Component Output | MISSING | 동일 |
| SOFTWARE / Internal State | MISSING | 동일 |
| COMMUNICATION / Message | MISSING | reserved README만 존재 |
| COMMUNICATION / Signal | PLACEHOLDER | 빈 definitions 위치만 존재 |
| COMMUNICATION / Timestamp/Validity/Timeout | MISSING | scheduler/evidence 없음 |
| REQUIREMENT / ID/Trace/Allocation | PLACEHOLDER | Markdown 후보만 있고 Runtime schema/dataset 없음 |
| TEST / Precondition~Verdict | PLACEHOLDER | Markdown 후보는 있으나 approved executable oracle 없음 |
| TIMELINE / Runtime Evidence | MISSING | ring buffer/timestamp snapshot 없음 |

결론: X-Ray UI의 추가 구현은 지금 적절하지 않다. 현재 skeleton을 유지하고, 승인 Requirement schema와 timestamped RuntimeEvidence가 준비된 뒤 evidence-driven UI로 구현해야 한다.

## J. Runtime AI 의존 여부

- `src`, `package.json`, `package-lock.json`, `vite.config.ts`에서 LLM SDK, API key, runtime `fetch`, Serverless proxy interface를 찾지 못했다.
- 현재 Runtime AI 의존은 **없다**.
- 문서상 잔존 위치는 `Requirement.md` 36/44/49/63절의 AI Hint, Runtime AI, Serverless LLM Proxy다.
- 이번 Audit에서는 지시대로 삭제하지 않았다. 최신 정책으로 문서를 개정할 필요가 있다.

목표 boundary는 다음으로 고정해야 한다.

```text
Authoring AI output (DRAFT)
→ schema validation
→ human review
→ headless simulation validation
→ APPROVED local dataset
→ offline deterministic Runtime
```

## K. Requirement-first Verification에 아직 필요한 Ground Truth

1. Reference Vehicle Architecture와 component responsibility.
2. Propulsion normal states, I/O, units, validity와 ownership.
3. Gear Request와 actual Gear State의 분리 및 enable semantics.
4. VMC/eDrive logical boundary와 VehiclePhysics에 전달할 command 의미.
5. 승인 Signal Dictionary와 calibration/range provenance.
6. Requirement ID hierarchy와 allocation 규칙.
7. executable TestCase/VerdictRule 표현식의 허용 연산과 tolerance.
8. Fault stimulus, software defect, symptom, corrective action의 승인 관계.
9. Case/ScenarioVariant의 immutable ground truth와 가변 parameter 범위.
10. RuntimeEvidence sample schema, timestamp domain, recording 주기.
11. Map capability 조건과 deterministic segment selection 규칙.
12. 각 데이터의 approval status와 version compatibility 정책.

현재 Data Model 존재 여부:

| Model | 상태 |
|---|---|
| FunctionDefinition | MISSING |
| SignalDefinition | MISSING (빈 reserved directory) |
| RequirementDefinition | MISSING (Markdown 후보만 존재) |
| RequirementTrace | MISSING |
| TestCaseDefinition | MISSING (Markdown 후보만 존재) |
| VerdictRule / Oracle | MISSING |
| FaultDefinition | MISSING (빈 reserved directory) |
| CaseDefinition | MISSING |
| ScenarioVariant | MISSING |
| RuntimeEvidence | PARTIAL 개념 — live telemetry만 존재하며 기록 schema는 없음 |

최소 schema 제안은 `DatasetEnvelope`, `FunctionDefinition`, `SignalDefinition`, `RequirementDefinition/Trace`, `TestCaseDefinition` 순서다. 모든 참조 ID와 단위는 loader에서 검증하고, DRAFT 데이터는 Runtime loader가 거부해야 한다.

## L. 다음 개발 Task 하나

**다음 Task: Propulsion Normal Flow Ground Truth Approval Package를 확정한다.**

범위:

1. `TRACKBACK Propulsion Reference Requirements v0.1.md`의 항목을 검토해 DRAFT/APPROVED 상태를 명시한다.
2. Reference Architecture에서 `DriverInput → Propulsion Function → VMC boundary → eDrive boundary → VehiclePhysics`의 책임과 I/O를 확정한다.
3. Signal 이름, unit, range, initial/invalid, ownership을 승인한다.
4. 숫자 calibration 예시와 Runtime 승인값을 분리한다.
5. Normal behavior test cases만 승인한다. Fault/CAN/Black Box/X-Ray는 포함하지 않는다.
6. 승인 결과가 확정된 뒤 다음 구현에서 schema/loader와 Propulsion vertical slice를 만든다.

이 Task가 끝나기 전에는 VMC/eDrive, Fault, X-Ray data, Oracle 구현을 시작하지 않는 것이 안전하다.
