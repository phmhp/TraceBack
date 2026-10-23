# Phase 07 — Fault Case Engineering

> 상태: **DRAFT / Human Review Required**
>
> 목적: Phase 01~06에서 정의한 참조 차량 아키텍처, 기능, 신호, 요구사항, TC를 실제 TRACKBACK 게임 Case Ground Truth 구조로 연결한다.
>
> 이 문서는 실제 OEM 고장 데이터베이스나 ISO 26262 승인 산출물이 아니다. 외부 NHTSA/OEM 공개자료를 이번 Phase에서 새로 사용하지 않았으며, 신규 Case 후보의 root cause provenance는 `TRACKBACK_MODEL`이다.

---

## 1. Phase 07의 핵심 원칙

TRACKBACK의 Case는 단순히 "고장 하나"가 아니다.

```text
정상 Requirement / Function
        ↓
Scenario Precondition
        ↓
Fault Stimulus
        ↓
Software Defect / Configuration Defect
        ↓
Fault Activation
        ↓
First Observable Deviation
        ↓
Propagation Path
        ↓
Vehicle Symptom
        ↓
Player Investigation Evidence
        ↓
Root Cause Selection
        ↓
Corrective Action
        ↓
Same Snapshot / Same Driver Input / Same Stimulus Replay
        ↓
Approved Oracle
        ↓
PASS / FAIL 또는 OBSERVED
```

반드시 다음을 분리한다.

- **Fault Stimulus**: SW/System reaction을 평가하기 위해 가해지는 비정상 사건
- **Software Defect**: 플레이어가 찾아야 하는 잘못된 logic/configuration
- **Observable Symptom**: 운전자/차량에서 관찰되는 결과
- **Root Cause**: 승인된 Case Ground Truth의 원인
- **Corrective Action**: defect를 수정하는 조치
- **Verification Oracle**: corrected replay의 판정 규칙

`Fault Injection을 제거했다 = 수리 성공`으로 처리하지 않는다.

---

## 2. 현재 산출물 규모

- Fault Family: **20개**
- Base Case 후보: **34개**
- Case→LF/Requirement/TC trace: **112개**
- 현재 Runtime과 일부라도 접점이 있는 Case 후보: **11개**
- Scenario Stimulus 후보: **8개**

Case 후보 분포:

| Primary Domain | Case 수 |
|---|---:|
| PROPULSION | 5 |
| BRAKING | 4 |
| ADAS | 4 |
| STABILITY | 4 |
| COMMUNICATION | 3 |
| EXECUTION | 3 |
| GEAR | 3 |
| STEERING | 3 |
| ENERGY | 2 |
| OCCUPANT | 2 |
| VEHICLE_STATE | 1 |

> Case 수는 구현 완료 수가 아니다. `AI_DRAFT` 또는 `REFERENCE_ONLY` Case가 포함된다.

---

## 3. 승인 상태와 Runtime Capability

### 3.1 Case 승인 상태

- `EXISTING_CANONICAL_GAME_CASE`: 현재 코드에 canonical game truth가 존재하는 Case. 현재는 `CASE-PT-001`만 해당.
- `AI_DRAFT`: 아키텍처/요구사항/TC에 기반하여 제안된 Case. Ground Truth가 아님.
- `APPROVED_BASE_CASE`: 향후 Human Review + consistency check + headless validation을 통과한 뒤에만 사용.

### 3.2 Runtime Capability

Case가 설계되었다는 것과 지금 게임에서 실행할 수 있다는 것은 별개다.

현재 코드 감사에서 확인된 실제 fault/instrumentation 능력은 대략 다음에 한정된다.

```text
Accelerator delivered override
eDrive command override
eDrive update drop / previous delivered hold
existing eDrive educational code variant
eDrive→DriveAdapter source/destination instrumentation
C/WASM propulsion component execution
Rapier vehicle response
```

따라서 ABS, ESC, AEB, LKA, Energy, Occupant Protection, Watchdog Case는 현재 `DESIGN_ONLY`다.

---

## 4. Fault Family Catalog

Fault taxonomy는 재사용 가능한 **고장 종류**다. Case와 1:1이 아니다.

### INPUT / STATE
- Invalid
- Stuck
- Out of Range

### FUNCTION LOGIC
- Wrong Threshold
- Wrong State Transition
- Missing Monitoring

### MOTION COORDINATION
- Wrong Priority
- Wrong Arbitration
- Wrong Allocation

### COMMUNICATION
- Missing Message / Update
- Timeout
- Scaling Mismatch

### ACTUATOR CONTROL
- Incorrect Reaction
- Saturation
- Command Rejection

### PLATFORM
- Task Stall
- Watchdog Timeout
- Reset

### PHYSICAL
- Low Friction
- Physical Actuator Degradation

Physical fault는 기본적으로 **Scenario Stimulus**이며, 플레이어가 SW repair로 없애는 Root Cause로 사용하지 않는다.

상세 정의는 `07_FAULT_FAMILY_CATALOG.csv`를 사용한다.

---

## 5. 기존 Case `CASE-PT-001` 기준선

현재 코드 감사에서 확인된 기존 canonical Case는 다음처럼 해석한다.

```text
Domain
  PROPULSION

Target
  eDrive

Fault/Defect
  educational incorrect scaling code variant

Normal path
  Propulsion → Trackback_VMC → eDrive → DriveAdapter → Rapier

Observed symptom
  동일 요구 대비 eDrive command 및 차량 구동 반응 저하

Root Cause provenance
  TRACKBACK_MODEL

Repair
  defect code variant를 baseline 동작과 맞는 후보로 교체

Replay
  동일 driver/scenario/fault stimulus 조건에서 다시 실행

Oracle
  기존 canonical game-case / component evidence 범위 내 deterministic rule
```

이 Case를 실제 차량의 공개 root cause라고 표현하면 안 된다.

---

## 6. 신규 Case 후보 설계

### 6.1 Propulsion

후보:
- Accelerator delivered value stuck
- Speed-dependent torque generation map/threshold defect
- Directional torque-limit defect
- Missing output mismatch monitoring

Propulsion Case는 현재 실행 경로와 가장 가까우나, **현재 런타임에 stimulus가 존재하는 것과 repair 가능한 code defect가 존재하는 것은 구분**한다.

### 6.2 Gear

후보:
- D↔R interlock threshold defect
- Invalid Gear Request acceptance
- Requested Gear / Applied Gear state confusion

현재 GearLogic은 좁은 D↔R interlock만 가지므로 일반 차량의 완전한 gear safety logic으로 확대하지 않는다.

### 6.3 Braking

후보:
- Brake-over-Drive priority defect
- Brake command scaling defect
- Missing brake-response feedback monitoring
- Regen/Friction allocation defect

현재 brake 경로는 independent Brake SW가 아니라 temporary host adapter이므로 `Brake ECU defect`처럼 표시하지 않는다.

### 6.4 Steering

후보:
- steering gain/speed compensation defect
- stale/stuck steering request
- Driver vs LKA authority defect

현재 steering은 EPS SW가 아니라 temporary host mapping + Rapier steering application이다.

### 6.5 Stability

후보:
- ABS slip threshold
- TCS torque reduction
- ESC yaw interpretation
- Stability intervention priority

모두 현재 `DESIGN_ONLY`. Wheel speed/slip/yaw sensing이 선행되어야 한다.

### 6.6 ADAS

후보:
- AEB threat threshold/timing
- ACC relative-speed scaling/sign
- LKA lane-offset sign
- invalid perception acceptance

Perception truth/sensor contract가 없으므로 실행 Case로 승격하지 않는다.

### 6.7 Communication

후보:
- eDrive update drop/hold
- eDrive scaling mismatch
- timeout reaction defect

첫 두 개는 현재 Fault Injection seam을 사용할 수 있지만 **실제 CAN/network failure가 아니다**. Timeout Case는 supervision/timing model이 생긴 뒤 실행 가능하다.

### 6.8 Vehicle State / Energy / Occupant / Platform

후보:
- Host Ready를 Vehicle Ready로 오인
- Energy torque limit 미반영
- Energy availability gating 오류
- Impact classification threshold
- protection deployment decision 누락
- Task stall
- Watchdog reaction
- reset/replay state restoration defect

현재 대부분 reference-only다.

전체 Case 목록은 `07_CASE_CANDIDATES.csv`를 기준으로 한다.

---

## 7. Player-visible Evidence와 Hidden Ground Truth

Case는 플레이어가 시작 전에 Root Cause를 알 수 없다는 원칙을 유지한다.

### Player-visible 가능

- Incident symptom
- Driver input
- Vehicle state / measured plant state
- 공개 가능한 Function state
- 실제 관찰 가능한 input/output
- signal value / unit / validity
- structural architecture
- approved requirement/test context
- black-box timeline
- player가 직접 실행한 verification 결과

### 기본 Hidden

- Correct Root Cause
- Software Defect의 정확한 코드 위치
- Corrective Action 정답
- hidden fault activation metadata
- canonical assessment answer
- repair 정답 여부
- 아직 수행하지 않은 test의 결과

### 조건부 Discoverable

- injection seam
- 특정 component의 내부 signal
- source/destination mismatch
- 관련 requirement
- candidate fault family

게임 진행/도구 사용에 따라 드러날 수 있지만 초기 Incident 화면에서 자동 공개하지 않는다.

---

## 8. Case Evidence Chain

Case마다 다음 evidence chain을 최소로 갖도록 한다.

```text
E0 Scenario/Precondition
E1 Driver or Environment Stimulus
E2 Fault Activation Event
E3 First Observable Deviation
E4 Upstream Component Evidence
E5 Interface Evidence
E6 Downstream Command
E7 Plant/Vehicle Response
E8 Requirement/Test Evidence
E9 Repair Replay Evidence
```

모든 Case에서 E0~E9가 실제 데이터로 존재할 필요는 없다. 없는 항목은 `UNAVAILABLE`로 명시하며 가짜 telemetry를 만들지 않는다.

---

## 9. Repair 정책

Corrective Action은 다음 중 하나로 분류한다.

- `LOGIC_FIX`
- `STATE_TRANSITION_FIX`
- `THRESHOLD_OR_CALIBRATION_FIX`
- `SCALING_OR_UNIT_FIX`
- `ARBITRATION_POLICY_FIX`
- `TIMEOUT_REACTION_FIX`
- `MONITORING_FIX`
- `INTERFACE_CONTRACT_FIX`
- `RESET_RECOVERY_FIX`

다음은 repair로 인정하지 않는다.

- Fault Injection off
- Low-friction surface 제거
- lead vehicle event 제거
- Scenario trigger 제거
- Expected/Oracle을 실제 결과에 맞춰 변경
- Case root cause를 변경

---

## 10. Corrected Replay 계약

Repair 후에는 가능한 한 다음을 고정한다.

```text
same Base Case
same Scenario Variant
same initial snapshot
same recorded driver input
same environment actors
same fault stimulus
same trigger policy
ONLY defect/corrective action differs
```

Fault stimulus는 defect 수정 후에도 유지되어야 한다. 그래야 "고장을 없애버린 것"과 "같은 고장 자극에 SW가 올바르게 대응한 것"을 구분할 수 있다.

현재 runtime이 전체 simulation state/queue를 완전하게 snapshot한다는 근거는 없으므로, 완전 deterministic replay를 이미 보장한다고 표현하지 않는다.

---

## 11. Oracle / Verdict 정책

### Deterministic Oracle이 있는 경우
`PASS` / `FAIL` 가능.

### Requirement criterion은 있으나 executable oracle이 없는 경우
`OBSERVED`.

### Design-only Case
실행 Verdict 없음.

### Interface Case
source/destination equality 또는 approved transform처럼 **실행 가능한 좁은 criterion**이 있을 때만 그 criterion에 대한 PASS/FAIL을 낸다.

`FAIL`은 Root Cause 확정이 아니다.

---

## 12. Safety Trace Gate

현재 Phase 05에서 SG/FSR/TSR/ASIL을 실제 Case에 대해 승인하지 않았다.

따라서 신규 Case는 기본적으로:

```text
safetyTraceStatus = PENDING_HARA_NOT_APPROVED
```

이다.

Case 승인 전에 필요하면 다음을 별도로 수행한다.

```text
Vehicle Function
→ Malfunctioning Behavior
→ Operating Situation
→ Hazardous Event
→ Illustrative HARA Candidate
→ Safety Goal Candidate
→ FSR Candidate
→ TSR Candidate
→ SW Safety Requirement Candidate
```

HARA 없이 Root Cause에서 Safety Goal을 직접 만들지 않는다.

---

## 13. Real-world Reference Case와의 관계

이번 Phase 07에는 외부 공개 사건을 새로 조사하지 않았다.

따라서 신규 후보는 모두:

```text
rootCauseProvenance = TRACKBACK_MODEL
```

로 둔다.

향후 NHTSA/Recall/Complaint 등을 사용하는 경우에는:

```text
SOURCE FACT
≠ TRACKBACK RECONSTRUCTION
```

을 유지해야 한다.

공개 자료에 ECU architecture, signal, SWR, ASIL, root cause가 없다면 실제 정보처럼 채우지 않는다.

---

## 14. Scenario Variation

Base Case의 root cause와 oracle은 고정하고, 승인된 범위에서만 variation한다.

가능한 후보:
- initial speed
- trigger time
- trigger position
- driver input magnitude
- lead vehicle speed/distance
- surface parameter
- activation window

단, min/max/default 수치는 현재 공학 근거가 없는 경우 `OPEN`으로 유지한다.

Variant마다 Headless Validation이 필요하다.

---

## 15. Headless Validation Gate

`APPROVED_BASE_CASE` 후보는 최소 다음을 통과해야 한다.

1. Spawn/initialization 가능
2. Scenario parameter range 유효
3. Fault activation 가능
4. Fault run에서 symptom/evidence 발생
5. Before repair에서 intended criterion 위반 또는 intended observation 발생
6. Correct repair 후 approved criterion 만족
7. Same stimulus replay 가능
8. Snapshot/recording 정상 생성
9. Runtime error 없음
10. Hidden Ground Truth가 player-visible 초기 UI에 노출되지 않음

단, 이 검증은 실제 차량의 물리적/안전적 타당성을 보증하지 않는다.

---

## 16. Phase 08로 넘길 데이터 경계

Phase 08에서는 다음을 실제 공통 데이터 모델/registry에 연결하면 된다.

```text
FaultFamily
CaseDefinition
ScenarioConstraint
FaultStimulus
SoftwareDefect
ArchitecturePath
RequirementTrace
TestOracle
EvidenceDefinition
CorrectiveAction
ReplayContract
VisibilityPolicy
CapabilityStatus
Provenance
```

`07_CASE_SCHEMA_DRAFT.json`은 이 통합을 위한 초안이지 현재 코드에 바로 강제할 schema가 아니다.

---

## 17. Phase 07 완료 조건

이번 Phase에서 완료한 것:

- Fault taxonomy를 machine-readable catalog로 구조화
- 현재/미래 case 후보 34개 정의
- Fault Stimulus와 Defect 분리
- Case→LF→Requirement→TC trace 생성
- Evidence visibility 정책 정의
- Repair/Replay/Oracle 정책 정의
- 현재 runtime capability와 reference-only case 분리
- Safety Trace gate 정의
- Case authoring approval checklist 정의
- Phase 08용 Case schema 초안 작성

아직 하지 않은 것:

- 34개 Case의 Ground Truth 승인
- 모든 Case의 deterministic oracle 구현
- 외부 NHTSA/Recall source 기반 Case 작성
- DESIGN_ONLY controller 구현
- Scenario Variation 숫자 승인
- Headless validation 실행
