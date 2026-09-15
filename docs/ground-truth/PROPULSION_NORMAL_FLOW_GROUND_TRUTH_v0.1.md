# TRACKBACK Propulsion Normal Flow Ground Truth Approval Package v0.1

> **Package status: REVIEW_REQUIRED**  
> 이 문서는 AI-assisted approval candidate다. 사용자/Human Review 전에는 `APPROVED` Ground Truth가 아니며 Runtime에서 사용할 수 없다.

## 1. Scope

이 패키지는 특정 OEM 구현이 아닌 **TRACKBACK Reference Vehicle**의 정상 Propulsion 흐름을 정의한다.

```text
Driver Input
→ Propulsion Function
→ Vehicle Motion Controller Boundary
→ eDrive Boundary
→ Vehicle Physics
→ Vehicle State Feedback
```

포함 범위:

- 정상 입력, enable, P/R/N/D actual gear state에 따른 propulsion request
- 논리 요청과 actuator/physics command의 책임 분리
- 정상 출력 제한과 관찰 가능성
- deterministic oracle로 변환 가능한 Normal Test Case 후보

제외 범위:

- Gear interlock와 변속 dynamics
- CAN/message timing
- Fault, monitoring/fault reaction/recovery
- X-Ray, Black Box, Replay
- 실제 motor/inverter/gearbox 모델
- OEM calibration 또는 Safety compliance 주장

## 2. Reference Architecture

```text
┌────────────────────┐
│ Driver Input       │
│ accelerator        │
│ gearRequest        │
└─────────┬──────────┘
          │ driver intent
          ▼
┌────────────────────┐       VehicleReady / PropulsionEnable
│ Propulsion Function│◀─────────────────────────────────────
│ validity + gating  │◀──────────── Actual GearState
│ magnitude/direction│
└─────────┬──────────┘
          │ Propulsion Motion Request
          ▼
┌────────────────────┐
│ VMC Boundary       │
│ request conversion │
└─────────┬──────────┘
          │ DriveTorqueRequest [Nm]
          ▼
┌────────────────────┐
│ eDrive Boundary    │
│ limit + command    │
└─────────┬──────────┘
          │ EDriveTorqueCommand [Nm]
          ▼
┌────────────────────┐
│ Vehicle Physics    │
│ physical actuation │
└─────────┬──────────┘
          │ VehicleSpeed / LongitudinalAcceleration
          └────────────────────────────── feedback
```

### Output abstraction decision

| Option | 내용 | 평가 |
|---|---|---|
| A | Propulsion Function이 `DriveTorqueRequest [Nm]`를 직접 출력 | Function이 actuator-domain calibration을 소유하게 되어 VMC 책임과 겹침 |
| B | Propulsion Function이 정규화된 `Propulsion Motion Request`를 출력 | Driver intent/function semantics와 actuator allocation을 분리 가능 |

**Recommended: Option B.** Motion Request는 `magnitude`, `direction`, `valid`의 논리 bundle이다. VMC Boundary가 승인 calibration을 사용해 `DriveTorqueRequest [Nm]`로 변환한다.

상태: **REVIEW_REQUIRED**.

## 3. Responsibility Boundary

### DriverInput

- 운전자 의도인 accelerator와 gearRequest를 제공한다.
- force, torque, steering angle 또는 vehicle response를 계산하지 않는다.
- `gearRequest`는 요청이며 실제 `GearState`가 아니다.

### Gear State Provider Boundary

- Gear Selector 요청과 별개로 실제 적용된 `GearState`를 제공한다.
- 이번 패키지는 provider 구현, interlock, transition delay를 정의하지 않는다.
- 현재 Runtime의 fixed D는 임시 구현이며 이 boundary의 완성으로 간주하지 않는다.

### Propulsion Function

- accelerator validity, vehicle readiness, propulsion enable과 actual gear state를 해석한다.
- 정규화된 propulsion request magnitude/direction/valid를 생성한다.
- physical force/torque를 직접 계산하지 않는다.

### VMC Boundary

- Propulsion Motion Request를 logical actuator request인 `DriveTorqueRequest [Nm]`로 변환한다.
- 이번 범위에서는 ADAS/Stability arbitration이나 multi-actuator allocation을 정의하지 않는다.
- mapping/calibration은 Requirement와 분리한다.

### eDrive Boundary

- `DriveTorqueRequest`를 받아 configured allowable range 안의 `EDriveTorqueCommand`를 생성한다.
- 실제 motor, inverter, current control을 복제하지 않는다.

### VehiclePhysics

- 최종 actuation command를 simulation parameter에 따라 Rapier용 physical command로 변환·적용한다.
- Requirement, gear request, validity, PASS/FAIL을 판단하지 않는다.
- Vehicle state feedback을 측정 가능한 simulation state로 제공한다.

## 4. State Model

### 후보 비교

| Option | State | 평가 |
|---|---|---|
| A | DISABLED / READY / ACTIVE | accelerator가 0보다 큰지에 따라 ACTIVE를 추가하나 output만으로 같은 사실을 관찰 가능 |
| B | DISABLED / ENABLED | 최소 상태. 입력 magnitude와 direction으로 inactive/active request를 표현 |

**Recommended: Option B**이며 명칭은 `PROP_DISABLED`, `PROP_ENABLED`를 제안한다. 상태명은 사용자 승인 전 `REVIEW_REQUIRED`다.

| State | Entry condition | Exit condition | Allowed input | Expected output | Invalid transition | Observable state |
|---|---|---|---|---|---|---|
| PROP_DISABLED | `VehicleReady == FALSE` 또는 `PropulsionEnable == FALSE` | 두 값이 모두 TRUE | 입력은 수신 가능하나 propulsion 처리에 사용하지 않음 | request magnitude 0, direction NONE, valid FALSE | 직접 ACTIVE 개념 없음 | `PropulsionOperatingState` |
| PROP_ENABLED | `VehicleReady == TRUE` 그리고 `PropulsionEnable == TRUE` | 둘 중 하나가 FALSE | valid accelerator, actual GearState | gear/input 조건에 따른 request | 별도 intermediate state 없음 | `PropulsionOperatingState` |

Gear P/N에서도 Function 자체는 ENABLED일 수 있지만 propulsion request는 비활성이다. 이를 state proliferation 없이 output gating으로 표현한다.

## 5. Signal Dictionary

공통 metadata: `schemaVersion: 0.1`, `provenance: TRACKBACK_MODEL`, `generationMethod: AI_ASSISTED`, `approvalStatus: REVIEW_REQUIRED`.

| signalId / name | 의미 | unit/type | producer → consumer | range | initial | invalid |
|---|---|---|---|---|---|---|
| SIG-DRV-ACC-POS / AcceleratorPedalPosition | 운전자 accelerator 입력 | `%` | DriverInput → Propulsion | 0..100 | 0 | companion validity 사용 |
| SIG-DRV-ACC-VALID / AcceleratorPedalValid | accelerator 입력 유효성 | boolean | DriverInput Adapter → Propulsion | FALSE/TRUE | FALSE until initialized | FALSE |
| SIG-DRV-GEAR-REQ / GearRequest | 운전자가 요청한 gear | enum P/R/N/D | DriverInput → Gear State Provider | P,R,N,D | P 후보 | unsupported enum |
| SIG-VEH-GEAR-STATE / GearState | 실제 적용된 gear | enum P/R/N/D | Gear State Provider → Propulsion | P,R,N,D | P 후보 | 별도 validity 필요 여부 NEEDS_DECISION |
| SIG-VEH-READY / VehicleReady | 차량이 기능 처리를 허용할 준비 상태 | boolean | Vehicle State Manager → Propulsion | FALSE/TRUE | FALSE | FALSE |
| SIG-PROP-ENABLE / PropulsionEnable | propulsion 기능 enable | boolean | Vehicle State Manager → Propulsion | FALSE/TRUE | FALSE | FALSE |
| SIG-PROP-STATE / PropulsionOperatingState | 최소 function state | enum | Propulsion → VMC/UI Evidence | DISABLED/ENABLED | DISABLED | DISABLED |
| SIG-PROP-REQ-MAG / PropulsionRequestMagnitude | 정규화된 구동 요구 크기 | dimensionless | Propulsion → VMC | 0..1 | 0 | 0 + valid FALSE |
| SIG-PROP-REQ-DIR / PropulsionRequestDirection | 요청 구동 방향 | enum | Propulsion → VMC | NONE/FORWARD/REVERSE | NONE | NONE |
| SIG-PROP-REQ-VALID / PropulsionRequestValid | motion request 유효성 | boolean | Propulsion → VMC | FALSE/TRUE | FALSE | FALSE |
| SIG-VMC-DRV-TQ-REQ / DriveTorqueRequest | VMC가 eDrive에 요청하는 torque | Nm | VMC → eDrive | calibration-defined | 0 | validity companion NEEDS_DECISION |
| SIG-EDR-TQ-CMD / EDriveTorqueCommand | eDrive logical actuation command | Nm | eDrive → VehiclePhysics adapter | calibration-defined | 0 | validity companion NEEDS_DECISION |
| SIG-VEH-SPEED / VehicleSpeed | vehicle longitudinal speed magnitude 또는 signed speed | m/s | VehiclePhysics → Propulsion/VMC/Evidence | simulation-defined | 0 | NEEDS_DECISION |
| SIG-VEH-LONG-ACC / VehicleLongitudinalAcceleration | vehicle longitudinal response | m/s² | VehiclePhysics → Evidence | simulation-defined | 0 | NEEDS_DECISION |

`GearRequest ≠ GearState`, `AcceleratorPedalPosition ≠ PropulsionRequestMagnitude`, `DriveTorqueRequest ≠ EDriveTorqueCommand ≠ physical wheel force`를 유지한다.

CAN factor/offset/cycle/timeout은 포함하지 않는다.

## 6. Calibration / Simulation Parameter

아래 항목은 Requirement가 아니며 모두 **NEEDS_DECISION / REVIEW_REQUIRED**다.

| parameterId | 종류 | 목적 | value/unit | provenance | 처리 |
|---|---|---|---|---|---|
| CAL-PROP-PEDAL-MAP | Calibration | pedal % → request magnitude | TBD | TRACKBACK_MODEL | 승인 map 필요 |
| CAL-VMC-FWD-TQ-MAP | Calibration | forward magnitude/speed → torque request | TBD Nm | TRACKBACK_MODEL | 숫자 확정 금지 |
| CAL-VMC-REV-TQ-MAP | Calibration | reverse magnitude/speed → torque request | TBD Nm | TRACKBACK_MODEL | forward와 별도 검토 |
| CAL-EDR-MAX-FWD-TQ | Calibration | forward allowable command limit | TBD Nm | TRACKBACK_MODEL | 승인 필요 |
| CAL-EDR-MAX-REV-TQ | Calibration | reverse allowable command limit | TBD Nm | TRACKBACK_MODEL | 승인 필요 |
| SIM-TQ-TO-FORCE | Simulation Parameter | logical torque → Rapier drive force | TBD | SIMULATION_ASSUMPTION | physics tuning과 분리 |
| SIM-RESPONSE-WINDOW | Simulation Parameter | response observation time window | TBD s | SIMULATION_ASSUMPTION | test 안정성 검증 필요 |
| SIM-MIN-OBS-ACC | Simulation Parameter | 방향 관찰 최소 acceleration | TBD m/s² | SIMULATION_ASSUMPTION | vehicle model 기반 결정 |

기존 v0.1의 20%, 0.20, 120 Nm, 200 Nm, 300 Nm, 350 Nm, 50 Nm, tolerance는 **Example Value**일 뿐 승인 calibration이 아니다. Approval dataset으로 이관하지 않는다.

## 7. Functional / System Requirements

공통 metadata: `schemaVersion: 0.1`, `status: REVIEW_REQUIRED`, `provenance: TRACKBACK_MODEL`, `generationMethod: AI_ASSISTED`.

### SYS-PROP-EN-001 — Function enable

IF `VehicleReady == TRUE` AND `PropulsionEnable == TRUE`, THEN Propulsion Function shall expose `PropulsionOperatingState == PROP_ENABLED`; otherwise it shall expose `PROP_DISABLED` and no valid propulsion request.

Observable: state, request valid, magnitude, direction.

### SYS-PROP-IN-001 — Invalid accelerator rejection

WHEN `AcceleratorPedalValid == FALSE`, THEN Propulsion Function shall output `PropulsionRequestValid == FALSE`, magnitude 0 and direction NONE regardless of pedal position.

### SYS-PROP-REQ-001 — Valid accelerator processing

IF Propulsion is ENABLED and the actual GearState permits propulsion, WHEN a valid accelerator position is supplied, THEN request magnitude shall equal the result of the approved `CAL-PROP-PEDAL-MAP` and remain within 0..1.

The requirement does not define the map shape or numeric torque.

### SYS-PROP-ZERO-001 — Zero accelerator

IF Propulsion is ENABLED, WHEN valid accelerator position is 0%, THEN request magnitude shall be 0. This requirement does not specify coast drag or regenerative braking.

### SYS-PROP-GEAR-001 — P/N gating

IF actual GearState is P or N, THEN propulsion request shall be invalid for actuation or have magnitude 0 and direction NONE.

Open semantic: choose one canonical representation (`valid FALSE` versus `valid TRUE + zero/NONE`). Recommended is **valid TRUE + zero/NONE** for a healthy but gated normal state.

### SYS-PROP-GEAR-002 — D direction

IF actual GearState is D and other enable/valid conditions are satisfied, WHEN accelerator request magnitude is greater than 0, THEN direction shall be FORWARD and request shall be valid.

### SYS-PROP-GEAR-003 — R direction

IF actual GearState is R and other enable/valid conditions are satisfied, WHEN accelerator request magnitude is greater than 0, THEN direction shall be REVERSE and request shall be valid.

This defines logical direction only, not shifting rules or gearbox dynamics.

### SYS-PROP-VMC-001 — Motion request conversion

WHEN VMC receives a valid Propulsion Motion Request, THEN it shall produce a `DriveTorqueRequest` consistent with request magnitude, direction, vehicle state and the approved VMC torque map.

Consistency is verified against the approved calibration, not a hardcoded example.

### SYS-PROP-LIM-001 — eDrive command limitation

WHEN eDrive receives a valid `DriveTorqueRequest`, THEN `EDriveTorqueCommand` shall remain within the configured allowable torque range for the requested direction.

### SYS-PROP-OBS-001 — Vehicle response observability

WHEN a non-zero valid eDrive torque command is applied on an approved flat/low-grade test segment from a defined initial state, THEN VehiclePhysics shall expose speed and longitudinal acceleration sufficient to determine response direction within an approved observation window.

This is an observability requirement, not a precise vehicle dynamics performance requirement.

## 8. Allocated Software Requirements

Allocation names below are logical boundaries, not OEM SWC names.

| requirementId | allocation | requirement |
|---|---|---|
| SWR-PROP-STATE-001 | Propulsion Logic | Calculate and expose DISABLED/ENABLED from VehicleReady and PropulsionEnable; disabled output is zero/NONE/invalid. |
| SWR-PROP-VALID-001 | Propulsion Logic | Reject invalid accelerator input and output zero/NONE/invalid. |
| SWR-PROP-MAP-001 | Propulsion Logic | Apply the approved pedal map and clamp normalized magnitude to 0..1. |
| SWR-PROP-ZERO-001 | Propulsion Logic | For valid 0% accelerator, output magnitude 0 without inventing brake/coast behavior. |
| SWR-PROP-GEAR-001 | Propulsion Logic | Derive NONE/FORWARD/REVERSE gating from actual GearState, not GearRequest. |
| SWR-VMC-PROP-001 | VMC Logical Boundary | Convert valid magnitude/direction and relevant vehicle state using approved torque calibration into DriveTorqueRequest. |
| SWR-EDR-LIM-001 | eDrive Logical Boundary | Bound EDriveTorqueCommand to direction-specific configured allowable range. |
| SWR-PHY-OBS-001 | VehiclePhysics Adapter | Publish speed and longitudinal acceleration in defined units for system-simulation observation. |

Component names such as `PedalInterpreter_SWC`, `DriveRequestManager_SWC`, `TorqueLimiter_SWC`, `PropulsionCommandManager_SWC` are not approved and are omitted.

## 9. Requirement Trace

```text
SYS-PROP-EN-001      → SWR-PROP-STATE-001
SYS-PROP-IN-001      → SWR-PROP-VALID-001
SYS-PROP-REQ-001     → SWR-PROP-MAP-001
SYS-PROP-ZERO-001    → SWR-PROP-ZERO-001
SYS-PROP-GEAR-001/2/3→ SWR-PROP-GEAR-001
SYS-PROP-VMC-001     → SWR-VMC-PROP-001
SYS-PROP-LIM-001     → SWR-EDR-LIM-001
SYS-PROP-OBS-001     → SWR-PHY-OBS-001
```

Normal requirements에는 SG/FSR/TSR을 강제로 생성하지 않는다. Safety trace는 향후 승인된 hazardous event가 있을 때 별도로 연결한다.

## 10. Normal Test Cases

모든 Test Case metadata: `schemaVersion: 0.1`, `approvalStatus: REVIEW_REQUIRED`, `provenance: TRACKBACK_MODEL`, `generationMethod: AI_ASSISTED`.

### TC-PROP-NORMAL-001 — Disabled gating

- requirementId: SYS-PROP-EN-001
- verificationLevel: SW_COMPONENT
- testObject: Propulsion Logic
- preconditions: reset state
- stimulus: VehicleReady FALSE 또는 PropulsionEnable FALSE, valid accelerator > 0
- observations: state, request valid/magnitude/direction
- expectedResult: DISABLED, FALSE, 0, NONE
- verdictRuleCandidate: exact enum/boolean/zero comparison

### TC-PROP-NORMAL-002 — Enabled state

- requirementId: SYS-PROP-EN-001
- verificationLevel: SW_COMPONENT
- stimulus: VehicleReady TRUE, PropulsionEnable TRUE
- expectedResult: PropulsionOperatingState ENABLED

### TC-PROP-NORMAL-003 — Invalid accelerator

- requirementId: SYS-PROP-IN-001
- verificationLevel: SW_COMPONENT
- preconditions: ENABLED, GearState D
- stimulus: accelerator position > 0, validity FALSE
- expectedResult: request FALSE/0/NONE

### TC-PROP-NORMAL-004 — Zero accelerator

- requirementId: SYS-PROP-ZERO-001
- verificationLevel: SW_COMPONENT
- preconditions: ENABLED, actual GearState D, accelerator valid
- stimulus: accelerator 0%
- expectedResult: magnitude 0

### TC-PROP-NORMAL-005 — Pedal map conformance

- requirementId: SYS-PROP-REQ-001
- verificationLevel: SW_COMPONENT
- preconditions: ENABLED, actual GearState D, approved pedal map loaded
- stimulus: approved boundary/sample pedal positions
- expectedResult: magnitude equals map result and lies in 0..1
- open: samples cannot be fixed before map approval

### TC-PROP-NORMAL-006 — P/N gating

- requirementId: SYS-PROP-GEAR-001
- verificationLevel: SW_COMPONENT
- stimulus: repeat with actual GearState P and N, valid accelerator > 0
- expectedResult: magnitude 0, direction NONE; validity semantic pending decision

### TC-PROP-NORMAL-007 — D forward request

- requirementId: SYS-PROP-GEAR-002
- verificationLevel: SW_COMPONENT
- stimulus: actual GearState D, valid non-zero accelerator
- expectedResult: valid request, magnitude > 0, direction FORWARD

### TC-PROP-NORMAL-008 — R reverse request

- requirementId: SYS-PROP-GEAR-003
- verificationLevel: SW_COMPONENT
- stimulus: actual GearState R, valid non-zero accelerator
- expectedResult: valid request, magnitude > 0, direction REVERSE

### TC-PROP-NORMAL-009 — VMC conversion conformance

- requirementId: SYS-PROP-VMC-001
- verificationLevel: SW_INTEGRATION
- testObject: Propulsion→VMC boundary
- stimulus: approved magnitude/direction/vehicle-state samples
- expectedResult: DriveTorqueRequest equals approved calibration result with correct direction semantic

### TC-PROP-NORMAL-010 — eDrive output limitation

- requirementId: SYS-PROP-LIM-001
- verificationLevel: SW_COMPONENT
- testObject: eDrive logical boundary
- stimulus: requests below, at and above configured forward/reverse limits
- expectedResult: command remains inside applicable configured range

### TC-PROP-NORMAL-011 — Forward vehicle response

- requirementId: SYS-PROP-OBS-001
- verificationLevel: SYSTEM_SIMULATION
- preconditions: approved flat segment, rest, D, no brake, dry surface
- stimulus: approved positive forward command for approved observation window
- expectedResult: observed longitudinal response direction is FORWARD and finite

### TC-PROP-NORMAL-012 — Reverse vehicle response

- requirementId: SYS-PROP-OBS-001 and SYS-PROP-GEAR-003
- verificationLevel: SYSTEM_SIMULATION
- preconditions: approved reverse-clearance segment, rest, R, no brake
- stimulus: approved reverse command
- expectedResult: observed longitudinal response direction is REVERSE and finite

Fault injection은 포함하지 않는다.

## 11. Requirement-Test Mapping

| Requirement | Test | 연결 근거 |
|---|---|---|
| SYS-PROP-EN-001 | TC-001, TC-002 | enable 입력 조합에 따른 observable state/output gating을 직접 검사한다. |
| SYS-PROP-IN-001 | TC-003 | invalid accelerator가 actuation request로 전파되지 않는지 검사한다. |
| SYS-PROP-REQ-001 | TC-005 | 승인 pedal map과 실제 normalized output을 같은 입력점에서 비교한다. |
| SYS-PROP-ZERO-001 | TC-004 | valid zero input의 request magnitude가 0인지 관찰한다. |
| SYS-PROP-GEAR-001 | TC-006 | P/N 각각에서 direction과 magnitude gating을 검사한다. |
| SYS-PROP-GEAR-002 | TC-007 | D 상태가 forward logical request를 생성하는지 검사한다. |
| SYS-PROP-GEAR-003 | TC-008, TC-012 | R logical direction과 최종 simulation response 방향을 단계별로 검사한다. |
| SYS-PROP-VMC-001 | TC-009 | Propulsion output과 calibration-derived torque request의 일관성을 검사한다. |
| SYS-PROP-LIM-001 | TC-010 | boundary/over-range stimulus에서 command bound를 직접 검사한다. |
| SYS-PROP-OBS-001 | TC-011, TC-012 | forward/reverse command가 관찰 가능한 동일 방향 response를 만드는지 검사한다. |

## 12. Map Capability Needs

| Test | required capability | 이유 |
|---|---|---|
| TC-001..010 | NONE / headless component fixture | map과 무관한 logical test |
| TC-011 | LONG_STRAIGHT, FLAT_OR_LOW_GRADE, DRY_ASPHALT, FORWARD_CLEARANCE | 물리 response 방향을 장애물/경사 영향 없이 관찰 |
| TC-012 | LONG_STRAIGHT, FLAT_OR_LOW_GRADE, DRY_ASPHALT, REVERSE_CLEARANCE | reverse response 안전 여유 확보 |

`HIGH_SPEED_ALLOWED`는 현재 Normal Flow 필수 capability가 아니다. speed threshold/derating test가 승인될 때 추가한다. Scenario Trigger Zone은 이번 단계에서 구현하지 않는다.

## 13. Approval Metadata

```yaml
schemaVersion: "0.1"
packageId: "GT-PROP-NORMAL-0.1"
status: REVIEW_REQUIRED
provenance: TRACKBACK_MODEL
generationMethod: AI_ASSISTED
reviewNotes:
  - "Human approval required before Runtime use"
  - "No OEM architecture or calibration claim"
  - "All numeric torque/timing values remain TBD"
runtimeEligibility: false
```

Runtime loader의 향후 정책은 `status == APPROVED`이고 호환 `schemaVersion`인 데이터만 허용해야 한다.

## 14. Open Decisions

### OD-01 Output abstraction

- Option A: Propulsion Function outputs torque [Nm]
- Option B: Propulsion Function outputs normalized magnitude/direction/valid
- **Recommended: B** — VMC allocation과 function intent를 분리한다.

### OD-02 State model

- Option A: DISABLED/READY/ACTIVE
- Option B: DISABLED/ENABLED
- **Recommended: B** — ACTIVE는 magnitude로 충분히 관찰 가능하다.

### OD-03 P/N validity semantic

- Option A: `valid FALSE`, magnitude 0, NONE
- Option B: `valid TRUE`, magnitude 0, NONE
- **Recommended: B** — healthy normal gating과 invalid input을 구분한다.

### OD-04 Gear initial state

- Option A: P
- Option B: N
- Option C: 현재 MVP 호환 D
- **Recommended: P for domain reset, explicit D session initialization**. 단, 변경 전 Game Flow/Gear Requirement 승인이 필요하다.

### OD-05 Torque sign

- Option A: signed Nm, reverse negative
- Option B: non-negative magnitude + direction enum
- **Recommended: B at Propulsion/VMC request boundary**. eDrive/physics adapter의 signed convention은 별도 계약으로 정한다.

### OD-06 VehicleSpeed semantic

- Option A: unsigned speed magnitude
- Option B: signed longitudinal speed
- **Recommended: 둘을 분리** (`VehicleSpeedMagnitude`, `VehicleLongitudinalVelocity`). 현재 package signal 명칭은 승인 시 정리 필요.

### OD-07 Numeric calibration

Pedal map, torque maps/limits, response window/tolerance는 전부 **NEEDS_DECISION**. Headless physics characterization 후 제안하고 Human Review한다.

### OD-08 Logical component allocation

Propulsion Logic 내부를 State Manager/Pedal Interpreter/Request Manager 등 여러 SWC로 나눌지 **NEEDS_DECISION**. 현재는 단일 logical boundary를 권장한다.

## 15. Rejected / Deferred Items

### 기존 v0.1 분류

| 기존 항목 | 판정 | 이유/처리 |
|---|---|---|
| FR/SYS/SWR-PROP-STA-001 | REVISE | enable 개념 유지, GearState 조건은 output gating과 분리; 특정 SWC 제거 |
| FR/SYS/SWR-PROP-STA-002 | REMOVE/MERGE | READY/ACTIVE 분리가 과도하며 request magnitude와 중복 |
| FR/SYS/SWR-PROP-IN-001 | REVISE | invalid 결과를 observable valid/zero/NONE으로 명확화 |
| FR/SYS/SWR-PROP-IN-002 | REMOVE/MERGE | IN-001과 valid processing requirement에 흡수 |
| FR/SYS/SWR-PROP-REQ-001 | REVISE | map을 calibration으로 분리하고 numeric 예시 제거 |
| FR/SYS/SWR-PROP-GEN-001 | REVISE | torque generation을 Propulsion 내부에서 VMC boundary로 이동 |
| FR/SYS/SWR-PROP-LIM-001 | REVISE | limit 책임을 eDrive logical boundary에 allocation, 숫자 제거 |
| FR/SYS/SWR-PROP-LIM-002 | REMOVE/MERGE | LIM-001의 range conformance에 포함되는 중복 정상 case |
| FR/SYS/SWR-PROP-OUT-001 | REVISE | Propulsion→VMC motion request와 VMC→eDrive torque request를 분리 |
| FR/SYS/SWR-PROP-MON-001 | DEFER | monitoring은 Normal main path 승인 후 별도 supervision package |
| FR/SYS/SWR-PROP-REA-001/002 | DEFER | Fault reaction package 범위 |
| FR/SYS/SWR-PROP-REC-001 | DEFER | Fault recovery package 범위 |

### 명시적 Deferred

- eDrive scaling defect, CAN timeout, wrong threshold
- Fault injection, root cause option, corrective action
- X-Ray evidence, Black Box, snapshot/replay
- SG/FSR/TSR/SSR Safety trace
- AI Runtime hint/debrief
- HIL/HW-SW Integration 주장

### 향후 Requirement에서 파생 가능한 Fault Family 후보

아래는 구현/승인된 Fault가 아니라 Normal Requirement violation의 분류 후보일 뿐이다.

- Enable/gating violation
- Invalid input acceptance
- Pedal mapping deviation
- Zero-input non-zero request
- Gear direction/gating mismatch
- VMC request conversion mismatch
- eDrive output limit violation
- Command/vehicle response direction mismatch

각 후보는 Approved Normal Ground Truth 이후 별도 Fault Package에서만 구체화한다.

---

## Approval Gate

현재 결론: **다음 Runtime 구현 Phase로 넘어가면 안 된다.**

최소 승인 필요 항목:

1. OD-01 output abstraction
2. OD-02 state model
3. OD-03 P/N validity semantic
4. OD-04 reset/session gear state
5. OD-05 torque direction convention
6. OD-06 speed feedback semantic
7. Signal/Requirement/Test 목록의 승인 또는 수정

승인 후 문서 status를 `APPROVED`, `runtimeEligibility: true`로 변경하고 schema/loader 구현을 다음 Phase로 시작한다.
