> LEGACY — 이전 설계/계약 기록입니다. 현재 X-RAY 구현 범위와 canonical source는 docs/cases/INVESTIGATION_WORKSPACE_CURRENT.md를 참조하십시오. 원문은 이 아래에 보존합니다.

# TRACKBACK Propulsion Normal Flow Ground Truth Approval Package v0.2

> **Package status: `REVIEW_REQUIRED`**  
> **Decision state: `READY_FOR_USER_APPROVAL`**  
> 이 문서는 AI-assisted approval candidate이다. 사용자 승인 전에는 `APPROVED` Ground Truth가 아니며 Runtime 입력으로 사용할 수 없다.

```yaml
schemaVersion: "0.2"
packageId: "GT-PROP-NORMAL-0.2"
status: REVIEW_REQUIRED
decisionState: READY_FOR_USER_APPROVAL
provenance: TRACKBACK_MODEL
generationMethod: AI_ASSISTED
runtimeEligibility: false
supersedesAfterApproval: "GT-PROP-NORMAL-0.1"
calibrationProfile: "TRACKBACK_SIMULATION_CALIBRATION_v0.1"
```

## 1. Scope and evidence

이 패키지는 TRACKBACK Reference Vehicle의 정상 Propulsion 흐름만 정의한다. CAN, Fault, monitoring/reaction/recovery, X-Ray, Black Box, Replay, 실제 모터·인버터·변속기 내부 모델은 범위 밖이다. 이번 변경은 문서만 추가하며 Runtime 코드를 변경하지 않는다.

검토 근거는 `Requirement.md`, v0.1 Ground Truth, Propulsion Reference Requirements v0.1, 최신 Repository Requirement Alignment Audit, 현재 Repository Runtime이다. 요청된 `docs/TRACKBACK_CURRENT_CONTEXT.md`와 루트 `AGENTS.md`는 저장소에 존재하지 않아 근거로 사용할 수 없었다.

## 2. Change Log

| Decision | Before (v0.1) | After (v0.2) | Reason |
|---|---|---|---|
| Function output | 선택 대기 중인 Motion Request | `PropulsionRequest(magnitude, direction, validity)` 확정 | 기능 의도와 물리량 분리 |
| State model | 2/3-state 선택 대기 | `PROP_DISABLED`, `PROP_ENABLED`만 사용 | 활동 여부는 magnitude로 관찰 |
| P/N semantics | validity 선택 대기 | VALID + 0 + NONE | 정상 억제와 입력 오류 분리 |
| P semantics | parking behavior 불명확 | propulsion 억제만 의미 | 주차 잠금 물리 모델 제외 |
| Initial gear | P/D 후보 | GearRequest D, GearState D | 현 Race start/restart 계약 유지 |
| Gear ownership | request/state 혼용 가능 | GearRequest → Gear Logic → GearState | 운전자 요청과 실제 상태 분리 |
| Direction change | 미정 | 설정값 이하에서만 D↔R 반영 | 수치 없는 검증 가능 계약 |
| Torque sign | signed 후보 | logical layer는 magnitude + direction | 부호 변환 지점을 physics 경계로 제한 |
| Speed | 의미 혼용 | VehicleSpeed와 LongitudinalVelocity 분리 | HUD와 방향 검증 분리 |
| Component allocation | 세분화 후보 | 5개 최소 경계 고정 | 근거 없는 SWC 증식 방지 |
| Calibration | requirement 내 숫자 후보 | 별도 profile의 ID만 참조 | Requirement와 튜닝 값 분리 |
| Tests | TC-001..012 초안 | 전 항목 재검토, P/N·limit 분리 및 interlock 추가 | 결정 사항 완전 검증 |

## A. Architecture Boundary

```text
DriverInput
  AcceleratorPedalPosition, AcceleratorPedalValidity, GearRequest, GearRequestValidity
        │                         │
        │                         ▼
        │                    Gear Logic (contract only; not implemented in this phase)
        │                         │ GearState, GearStateValidity
        ▼                         ▼
PropulsionFunction ◄── VehicleReady, PropulsionEnable
        │ PropulsionRequest { magnitude 0..1, direction, validity }
        ▼
VMC
        │ DriveTorqueRequestMagnitude, DriveDirection, DriveTorqueRequestValidity
        ▼
eDrive
        │ EDriveTorqueCommandMagnitude, EDriveDirection, EDriveCommandValidity
        ▼
VehiclePhysics (the only logical-direction → signed-physical-command boundary)
        │ VehicleSpeed, LongitudinalVelocity, VehicleLongitudinalAcceleration
        └────────────────────────────── feedback
```

- DriverInput은 의도만 제공한다. `GearRequest`는 actual gear가 아니다.
- Gear Logic은 request를 actual `GearState`로 변환하는 별도 계약이다. 이번 단계에서는 Runtime을 구현하지 않는다.
- PropulsionFunction은 정상 입력의 유효성, enable, actual gear를 해석하며 torque/force를 출력하지 않는다.
- VMC는 정규화 요구를 calibration 기반 torque magnitude와 direction으로 변환한다.
- eDrive는 방향별 허용 범위로 magnitude를 제한한다.
- VehiclePhysics만 direction을 signed force/torque로 변환한다.
- 허용 component는 DriverInput, PropulsionFunction, VMC, eDrive, VehiclePhysics이다.

## B. State Model

| State | Entry condition | Exit condition | Allowed input | Expected request | Invalid handling | Observable |
|---|---|---|---|---|---|---|
| `PROP_DISABLED` | `!VehicleReady || !PropulsionEnable` | 두 값 모두 TRUE | 입력 수신 가능, 추진 처리 억제 | VALID, 0, NONE if inputs are valid | accelerator/gear validity INVALID이면 INVALID, 0, NONE | PropulsionState + request tuple |
| `PROP_ENABLED` | `VehicleReady && PropulsionEnable` | 둘 중 하나 FALSE | valid accelerator와 actual gear | 아래 gear 표 적용 | accelerator/gear validity INVALID이면 INVALID, 0, NONE | PropulsionState + request tuple |

`PROP_ACTIVE`는 없다. 실제 추진 요구는 `PROP_ENABLED && magnitude > 0`으로 관찰한다.

| GearState | Validity | magnitude | direction | Meaning |
|---|---|---:|---|---|
| P | VALID | 0 | NONE | Valid but Propulsion-Inhibited; parking lock/brake 아님 |
| N | VALID | 0 | NONE | Valid but Propulsion-Inhibited |
| D | VALID | pedal-map result | FORWARD when result > 0; NONE at zero | forward propulsion allowed |
| R | VALID | pedal-map result | REVERSE when result > 0; NONE at zero | reverse propulsion allowed |

Race start/restart 초기값은 `GearRequest=D`, `GearState=D`이다. D↔R 요청은 `abs(LongitudinalVelocity) <= GearDirectionChangeMaxSpeed`일 때만 actual state에 반영할 수 있다. 조건을 만족하지 않으면 GearState는 이전 유효 상태를 유지한다.

## C. Signal Dictionary

공통 metadata: `schemaVersion=0.2`, `provenance=TRACKBACK_MODEL`, `approvalStatus=REVIEW_REQUIRED`.

| ID | Signal | Type/unit | Producer → Consumer | Range | Initial | Invalid representation |
|---|---|---|---|---|---|---|
| SIG-DRV-ACC-POS | AcceleratorPedalPosition | real/% | DriverInput → PropulsionFunction | 0..100 | 0 | companion validity INVALID |
| SIG-DRV-ACC-VAL | AcceleratorPedalValidity | enum | DriverInput → PropulsionFunction | VALID/INVALID | INVALID until initialized | INVALID |
| SIG-DRV-GEAR-REQ | GearRequest | enum | DriverInput → Gear Logic | P/R/N/D | D | companion validity INVALID |
| SIG-DRV-GEAR-REQ-VAL | GearRequestValidity | enum | DriverInput → Gear Logic | VALID/INVALID | VALID | INVALID |
| SIG-VEH-GEAR-STATE | GearState | enum | Gear Logic → PropulsionFunction | P/R/N/D | D | last valid state + invalid companion |
| SIG-VEH-GEAR-STATE-VAL | GearStateValidity | enum | Gear Logic → PropulsionFunction | VALID/INVALID | VALID | INVALID |
| SIG-VEH-READY | VehicleReady | boolean | Vehicle state owner → PropulsionFunction | FALSE/TRUE | FALSE | FALSE |
| SIG-PROP-ENABLE | PropulsionEnable | boolean | Session/state owner → PropulsionFunction | FALSE/TRUE | FALSE | FALSE |
| SIG-PROP-STATE | PropulsionState | enum | PropulsionFunction → VMC/evidence | PROP_DISABLED/PROP_ENABLED | PROP_DISABLED | PROP_DISABLED |
| SIG-PROP-REQ-MAG | PropulsionRequestMagnitude | real/1 | PropulsionFunction → VMC | 0..1 | 0 | 0 |
| SIG-PROP-REQ-DIR | PropulsionRequestDirection | enum | PropulsionFunction → VMC | NONE/FORWARD/REVERSE | NONE | NONE |
| SIG-PROP-REQ-VAL | PropulsionRequestValidity | enum | PropulsionFunction → VMC | VALID/INVALID | INVALID | INVALID |
| SIG-VEH-SPEED | VehicleSpeed | real/m/s | VehiclePhysics → HUD/VMC/evidence | >=0 | 0 | unavailable + validity metadata |
| SIG-VEH-LONG-VEL | LongitudinalVelocity | real/m/s | VehiclePhysics → Gear Logic/VMC/evidence | signed; forward +, reverse - | 0 | unavailable + validity metadata |
| SIG-VMC-TQ-MAG | DriveTorqueRequestMagnitude | real/Nm | VMC → eDrive | >=0, calibration-defined | 0 | 0 + INVALID |
| SIG-VMC-DIR | DriveDirection | enum | VMC → eDrive | NONE/FORWARD/REVERSE | NONE | NONE |
| SIG-VMC-REQ-VAL | DriveTorqueRequestValidity | enum | VMC → eDrive | VALID/INVALID | INVALID | INVALID |
| SIG-EDR-TQ-MAG | EDriveTorqueCommandMagnitude | real/Nm | eDrive → VehiclePhysics | >=0, direction limit | 0 | 0 + INVALID |
| SIG-EDR-DIR | EDriveDirection | enum | eDrive → VehiclePhysics | NONE/FORWARD/REVERSE | NONE | NONE |
| SIG-EDR-CMD-VAL | EDriveCommandValidity | enum | eDrive → VehiclePhysics | VALID/INVALID | INVALID | INVALID |
| SIG-VEH-LONG-ACC | VehicleLongitudinalAcceleration | real/m/s² | VehiclePhysics → evidence | signed | 0 | unavailable + validity metadata |

## D. System Requirements

모든 requirement status는 `REVIEW_REQUIRED`이다.

- **SYSR-PROP-001 — Function availability:** IF VehicleReady and PropulsionEnable are TRUE, the vehicle shall expose PROP_ENABLED; otherwise it shall expose PROP_DISABLED and shall not produce a non-zero propulsion request.
- **SYSR-PROP-002 — Invalid input rejection:** WHEN accelerator input validity or actual gear validity is INVALID, the vehicle shall expose an INVALID propulsion request with magnitude 0 and direction NONE.
- **SYSR-PROP-003 — Valid request magnitude:** IF propulsion is enabled and actual gear permits propulsion, a valid accelerator input shall produce a VALID request magnitude equal to the approved pedal-map result and bounded to 0..1.
- **SYSR-PROP-004 — Zero accelerator:** WHEN a valid accelerator input is 0%, the vehicle shall request magnitude 0 and direction NONE without implying brake, coast-drag, or regeneration behavior.
- **SYSR-PROP-005 — P behavior:** WHEN actual GearState is P and inputs are valid, the vehicle shall expose VALID, magnitude 0, direction NONE; no parking lock, pawl, parking brake, or vehicle-hold behavior is specified.
- **SYSR-PROP-006 — N behavior:** WHEN actual GearState is N and inputs are valid, the vehicle shall expose VALID, magnitude 0, direction NONE.
- **SYSR-PROP-007 — D behavior:** WHEN actual GearState is D and a valid non-zero accelerator request exists while propulsion is enabled, the vehicle shall request FORWARD propulsion.
- **SYSR-PROP-008 — R behavior:** WHEN actual GearState is R and a valid non-zero accelerator request exists while propulsion is enabled, the vehicle shall request REVERSE propulsion.
- **SYSR-GEAR-001 — Direction-change interlock:** A D↔R GearRequest shall be reflected in actual GearState only when `abs(LongitudinalVelocity) <= GearDirectionChangeMaxSpeed`; otherwise the previous valid GearState shall be retained.
- **SYSR-PROP-009 — Bounded actuation:** A valid propulsion request shall result in a direction-consistent eDrive command whose non-negative magnitude does not exceed the approved direction-specific limit.
- **SYSR-PROP-010 — Observable response:** On an approved response-test segment, a valid non-zero command shall produce finite longitudinal feedback in the commanded direction within `PropulsionResponseWindow`.
- **SYSR-PROP-011 — Speed semantics:** VehicleSpeed shall be non-negative, while LongitudinalVelocity shall be positive for forward motion, negative for reverse motion, and zero at rest within the approved tolerance.

## E. Software Requirements

- **SWR-PROP-001 (PropulsionFunction):** Calculate PROP_DISABLED/PROP_ENABLED from VehicleReady and PropulsionEnable each update and prevent a non-zero request while disabled. Allocates SYSR-PROP-001.
- **SWR-PROP-002 (PropulsionFunction):** If AcceleratorPedalValidity or GearStateValidity is INVALID, emit `{0,NONE,INVALID}`. Allocates SYSR-PROP-002.
- **SWR-PROP-003 (PropulsionFunction):** For valid enabled input, apply `CAL-PROP-PEDAL-MAP` and clamp magnitude to 0..1. Allocates SYSR-PROP-003 and SYSR-PROP-004.
- **SWR-PROP-004 (PropulsionFunction):** Select output from actual GearState: P/N→`{0,NONE,VALID}`, D→FORWARD, R→REVERSE; at zero magnitude emit NONE. Allocates SYSR-PROP-004..008.
- **SWR-GEAR-001 (Gear Logic contract):** Initialize GearRequest/GearState to D at Race start/restart; accept D↔R only at or below `CAL-GEAR-DIR-CHANGE-MAX-SPEED`, otherwise retain the previous GearState. Allocates SYSR-GEAR-001.
- **SWR-VMC-001 (VMC):** Convert a VALID normalized request using the direction-specific approved VMC map into non-negative DriveTorqueRequestMagnitude while preserving direction and validity; invalid/zero input yields `{0,NONE,INVALID}` or `{0,NONE,VALID}` respectively. Allocates SYSR-PROP-009.
- **SWR-EDR-001 (eDrive):** Clamp valid torque magnitude to the approved limit for its direction and preserve direction/validity. Allocates SYSR-PROP-009.
- **SWR-PHY-001 (VehiclePhysics):** At the final adapter boundary only, convert FORWARD/REVERSE into positive/negative physical actuation and publish finite signed longitudinal feedback. Allocates SYSR-PROP-010 and SYSR-PROP-011.
- **SWR-PHY-002 (VehiclePhysics):** Publish `VehicleSpeed=abs(LongitudinalVelocity)` in consistent m/s units within the approved observation tolerance. Allocates SYSR-PROP-011.

## F. Requirement Trace

| System requirement | Software allocation | Verification |
|---|---|---|
| SYSR-PROP-001 | SWR-PROP-001 | TC-001, TC-002 |
| SYSR-PROP-002 | SWR-PROP-002 | TC-003 |
| SYSR-PROP-003 | SWR-PROP-003 | TC-005 |
| SYSR-PROP-004 | SWR-PROP-003, SWR-PROP-004 | TC-004 |
| SYSR-PROP-005 | SWR-PROP-004 | TC-006A |
| SYSR-PROP-006 | SWR-PROP-004 | TC-006B |
| SYSR-PROP-007 | SWR-PROP-004 | TC-007, TC-011 |
| SYSR-PROP-008 | SWR-PROP-004 | TC-008, TC-012 |
| SYSR-GEAR-001 | SWR-GEAR-001 | TC-013, TC-014 |
| SYSR-PROP-009 | SWR-VMC-001, SWR-EDR-001 | TC-009, TC-010A, TC-010B |
| SYSR-PROP-010 | SWR-PHY-001 | TC-011, TC-012 |
| SYSR-PROP-011 | SWR-PHY-001, SWR-PHY-002 | TC-011, TC-012 |

## G. Normal Test Cases

| TC ID | v0.1 decision | Linked requirement | Level / object | Precondition | Stimulus | Observation | Expected result | Why it verifies |
|---|---|---|---|---|---|---|---|---|
| TC-PROP-NORMAL-001 | REVISE | SYSR-PROP-001 | SW component / PropulsionFunction | valid inputs | Ready FALSE or Enable FALSE, pedal >0 | state + tuple | DISABLED, VALID, 0, NONE | 정상 disabled gating 확인 |
| TC-PROP-NORMAL-002 | KEEP | SYSR-PROP-001 | SW component / PropulsionFunction | valid inputs | Ready TRUE and Enable TRUE | state | ENABLED | enable 조건 확인 |
| TC-PROP-NORMAL-003 | REVISE | SYSR-PROP-002 | SW component / PropulsionFunction | enabled, D | invalid accelerator; repeat invalid gear state | tuple | INVALID, 0, NONE | invalid propagation 확인 |
| TC-PROP-NORMAL-004 | REVISE | SYSR-PROP-004 | SW component / PropulsionFunction | enabled, D, valid | pedal 0% | tuple | VALID, 0, NONE | zero semantics 확인 |
| TC-PROP-NORMAL-005 | KEEP | SYSR-PROP-003 | SW component / PropulsionFunction | approved map loaded | map boundary/sample inputs | magnitude | map result, 0..1 | calibration conformance 확인 |
| TC-PROP-NORMAL-006A | SPLIT | SYSR-PROP-005 | SW component / PropulsionFunction | enabled, valid, P | pedal >0 | tuple | VALID, 0, NONE | P 정상 억제 확인 |
| TC-PROP-NORMAL-006B | SPLIT | SYSR-PROP-006 | SW component / PropulsionFunction | enabled, valid, N | pedal >0 | tuple | VALID, 0, NONE | N 정상 억제 확인 |
| TC-PROP-NORMAL-007 | KEEP | SYSR-PROP-007 | SW component / PropulsionFunction | enabled, valid, D | pedal >0 | tuple | VALID, >0, FORWARD | D 방향 확인 |
| TC-PROP-NORMAL-008 | KEEP | SYSR-PROP-008 | SW component / PropulsionFunction | enabled, valid, R | pedal >0 | tuple | VALID, >0, REVERSE | R 방향 확인 |
| TC-PROP-NORMAL-009 | REVISE | SYSR-PROP-009 | SW integration / Propulsion→VMC | approved maps | magnitude/direction samples | VMC tuple | non-negative calibrated magnitude, preserved direction/validity | unsigned VMC contract 확인 |
| TC-PROP-NORMAL-010A | SPLIT | SYSR-PROP-009 | SW component / eDrive | forward limit loaded | below/at/above forward limit | eDrive tuple | magnitude bounded by forward limit | forward limiting 확인 |
| TC-PROP-NORMAL-010B | SPLIT | SYSR-PROP-009 | SW component / eDrive | reverse limit loaded | below/at/above reverse limit | eDrive tuple | magnitude bounded by reverse limit | reverse limiting 확인 |
| TC-PROP-NORMAL-011 | REVISE | SYSR-PROP-007/010/011 | System simulation / chain | rest, flat dry route, D | valid forward command for response window | speed, velocity, accel | finite; velocity/accel forward; speed >=0 | end-to-end forward response 확인 |
| TC-PROP-NORMAL-012 | REVISE | SYSR-PROP-008/010/011 | System simulation / chain | rest, reverse clearance, R | valid reverse command | speed, velocity, accel | finite; velocity/accel reverse; speed >=0 | end-to-end reverse response 확인 |
| TC-PROP-NORMAL-013 | NEW | SYSR-GEAR-001 | SW component / Gear Logic contract | D or R, valid | opposite request with abs velocity at/below configured maximum | GearState | requested opposite state accepted | permitted transition 확인 |
| TC-PROP-NORMAL-014 | NEW | SYSR-GEAR-001 | SW component / Gear Logic contract | D or R, valid | opposite request with abs velocity above configured maximum | GearState | previous valid state retained | unsafe direction change 억제 확인 |

TC-001..010은 map 없이 headless fixture로 검증할 수 있다. TC-011은 flat/low-grade dry straight와 forward clearance, TC-012는 같은 조건과 reverse clearance가 필요하다. TC-013/014는 실제 threshold 숫자가 아니라 승인 calibration의 경계값을 test data로 참조한다.

## H. Calibration References

값은 이 문서에서 정하지 않으며 `TRACKBACK_SIMULATION_CALIBRATION_v0.1`에서 승인한다.

| Calibration ID | Purpose | Unit/value | Provenance/status |
|---|---|---|---|
| CAL-PROP-PEDAL-MAP | pedal % → normalized magnitude | TBD map | TRACKBACK_MODEL / REVIEW_REQUIRED |
| CAL-GEAR-DIR-CHANGE-MAX-SPEED | D↔R actual-state 반영 최대 절대 속도 | TBD m/s | TRACKBACK_MODEL / REVIEW_REQUIRED |
| CAL-VMC-FWD-TQ-MAP | forward request/speed → torque magnitude | TBD Nm map | TRACKBACK_MODEL / REVIEW_REQUIRED |
| CAL-VMC-REV-TQ-MAP | reverse request/speed → torque magnitude | TBD Nm map | TRACKBACK_MODEL / REVIEW_REQUIRED |
| CAL-EDR-MAX-FWD-TQ | forward command maximum | TBD Nm | TRACKBACK_MODEL / REVIEW_REQUIRED |
| CAL-EDR-MAX-REV-TQ | reverse command maximum | TBD Nm | TRACKBACK_MODEL / REVIEW_REQUIRED |
| SIM-PROP-TORQUE-TO-FORCE | eDrive command → Rapier actuation | TBD | SIMULATION_ASSUMPTION / REVIEW_REQUIRED |
| SIM-PROP-RESPONSE-WINDOW | response observation window | TBD s | SIMULATION_ASSUMPTION / REVIEW_REQUIRED |
| SIM-PROP-MIN-RESPONSE-ACCEL | observable response threshold | TBD m/s² | SIMULATION_ASSUMPTION / REVIEW_REQUIRED |
| SIM-PROP-ZERO-SPEED-TOLERANCE | rest/zero velocity comparison tolerance | TBD m/s | SIMULATION_ASSUMPTION / REVIEW_REQUIRED |

## I. Remaining Open Decisions

1. 위 calibration ID들의 실제 값과 표본점은 별도 calibration profile에서 사용자 승인이 필요하다. 이는 수치 기반 physics acceptance test를 막지만, 본 architecture/schema와 logical component 구현 계약의 승인을 막지는 않는다.
2. Repository에 없는 `docs/TRACKBACK_CURRENT_CONTEXT.md`의 복구 또는 공식 폐기 여부는 project documentation 정합성 작업에서 결정해야 한다. 본 패키지 내용의 승인 blocker는 아니다.
3. Gear Logic Runtime 구현 시 input sampling 시점과 rejected request의 UI 표시 방식은 별도 Gear package에서 정한다. 본 패키지는 actual state 유지와 validity 계약까지만 고정한다.

## 3. Deferred normal-requirement violations

Enable/gating violation, invalid input acceptance, pedal-map deviation, zero-input non-zero request, gear direction mismatch, VMC conversion mismatch, eDrive limit violation, command/response direction mismatch는 향후 Fault 후보일 뿐이다. Fault definition, trigger, root cause, correction, X-Ray, Replay, Oracle Runtime은 이 Ground Truth에 포함하지 않는다.

## 4. Completion Gate

| Criterion | Result |
|---|---|
| Propulsion Function boundary clear | PASS |
| DriverInput / GearRequest / GearState separated | PASS |
| P/R/N/D normal semantics clear | PASS |
| VehicleSpeed / LongitudinalVelocity separated | PASS |
| Direction / magnitude semantics clear | PASS |
| SYSR / SWR role duplication removed | PASS |
| Every requirement testable | PASS |
| Every requirement traced to tests | PASS |
| Calibration separated from requirements | PASS |
| No unapproved numeric value embedded | PASS |
| Fault not mixed into normal Ground Truth | PASS |

**Gate result: `READY_FOR_USER_APPROVAL`**

사용자가 승인하기 전까지 `status=REVIEW_REQUIRED`, `runtimeEligibility=false`를 유지한다. 승인 후에만 status/schema loader 및 Propulsion Vertical Slice Runtime 구현 단계로 이동한다.

