TRACKBACK 통합 요구사항 명세서 v2.0

1. 프로젝트 정의

서비스명: TRACKBACK

서비스 소개:
차량을 직접 주행하면서 예고 없이 발생하는 기능 이상을 분석하고, 원인을 진단한 뒤 동일 조건에서 재검증하여 제한시간 내 결승선까지 완주하는 차량 SW 고장 추적 레이싱 게임.

수행 목적:
- 차량 기능 및 제어 Architecture에 대한 배경지식 습득
- 차량 기능, SW, 통신, Actuator 간 동작 흐름 이해
- ISO 26262의 Safety Requirement 및 Verification 개념 학습
- 시뮬레이션 환경에서의 검증 구조 고찰
- AI를 활용한 실제 Safety Case 분석 및 Test Scenario 확장 실험

TRACKBACK은 실제 ISO 26262 Compliance 또는 실제 차량 검증 Tool을 목적으로 하지 않는다.

프로젝트에서 구현되는 차량, ECU, Signal, Requirement 및 Test Case는 공개 정보를 참고하여 설계한 Reference Model이다.


2. 핵심 게임 루프

SESSION SETUP
→ RACE
→ UNKNOWN FAULT
→ VEHICLE SYMPTOM
→ BLACK BOX LOCK
→ X-RAY ENGINEERING MODE
→ INVESTIGATION
→ ROOT CAUSE SELECTION
→ CORRECTIVE ACTION
→ VERIFICATION REPLAY
→ PASS / FAIL
→ RACE RESUME
→ FINISH
→ VERIFICATION DEBRIEF

사용자는 Race 시작 전에 어떤 Fault가 발생할지 알 수 없다.

Session Setup에서 선택 가능한 정보:

- Race Length
- Incident Count
- Difficulty

선택 불가능:

- Fault Domain
- Fault Type
- 관련 Controller
- Root Cause


3. Fault 발생 방식

Fault는 항상 정확히 동일한 시간에 발생시키지 않는다.

기본적으로 다음 조건을 조합한다.

- Minimum Stable Time
- Scenario Time Window
- Vehicle State
- Hidden Trigger Zone
- Scenario Condition

예:

SimulationTime > 8 s
AND VehicleSpeed > 35 km/h
AND TriggerZone entered
→ Fault Activation 가능

권장 Fault Window:
8~25초

Multiple Incident Mode에서는 이전 Case가 종료된 이후 일정 Cooldown을 둔다.


4. Fault Notification

Fault 발생 시 플레이어에게 Root Cause를 직접 알려주지 않는다.

표시 예:

VEHICLE ANOMALY DETECTED
BLACK BOX RECORDING

표시하지 않는 정보:

CAN TIMEOUT
EPS FAILURE
VMC ERROR
BRAKE ECU FAULT

Fault Alarm은 실제 차량 Warning Lamp를 모사하는 것이 아니라 TRACKBACK Game System의 Incident Notification으로 취급한다.


5. 정보 출처 분류

모든 Case Data는 네 종류의 Provenance를 가진다.

REAL-WORLD SOURCE

- NHTSA Recall
- Part 573 Report
- NHTSA Investigation
- NHTSA Complaint
- Manufacturer Communication / TSB

STANDARD REFERENCE

- ISO 26262
- AUTOSAR
- 공개 Vehicle Signal/Architecture Specification
- 공개 자동차 부품사 기술문서

TRACKBACK MODEL

- Reference Vehicle Architecture
- Virtual Controller
- Virtual CAN-FD
- Signal
- Calibration
- Safety Requirement
- Fault Mechanism
- Test Case
- Verification Oracle

SIMULATION EVIDENCE

- Vehicle State
- Controller State
- Signal
- CAN Event
- Timeline
- Test Result

각 데이터에는 필요 시 다음 메타정보를 추가한다.

generationMethod:
- MANUAL
- AI_ASSISTED

실제 공개 자료에서 확인되지 않는 정보는 반드시 TRACKBACK MODEL로 분류한다.


6. NHTSA 활용 원칙

NHTSA는 실제 차량 Safety Issue를 찾기 위한 출발점으로 사용한다.

기본 Pipeline:

NHTSA Source
→ AI Classification
→ Human Review
→ Reference Case Authoring
→ Case Ground Truth Approval
→ Local Case Dataset

NHTSA에서 가져올 수 있는 실제 정보:

- Vehicle
- Component
- Observed Defect
- Consequence
- Remedy
- 공개된 경우 Failure Mechanism

NHTSA만으로 실제 차량의 다음 정보를 추정하여 사실로 표현하지 않는다.

- 실제 ECU Architecture
- 실제 CAN Signal
- 실제 SWC/Runnable
- 실제 SSR
- 실제 Safety Goal
- 실제 ASIL


7. AI 기반 Reference Case Authoring

AI는 Case 작성 단계에서 다음 작업을 보조할 수 있다.

- Real-world Case 요약
- Vehicle Domain 분류
- Malfunctioning Behavior 후보 도출
- Reference Operating Situation 생성
- Illustrative HARA 초안
- SG/FSR/TSR/SSR 초안
- Reference Architecture Path Mapping
- Fault Mechanism 후보
- Test Case 후보
- Scenario Variant 생성
- 데이터 정합성 검사

AI 출력은 바로 Ground Truth가 되지 않는다.

절차:

AI DRAFT
→ Schema Validation
→ Human Review
→ Headless Simulation Validation
→ APPROVED GROUND TRUTH


8. ASIL 처리

NHTSA Case에 실제 ASIL을 직접 부여하지 않는다.

필요하면 TRACKBACK Reference Vehicle에 대해 Illustrative HARA를 수행할 수 있다.

예:

Assumed Operating Situation:
고속도로 주행 중 Steering Assist 상실

Candidate:
Severity
Exposure
Controllability

AI는 Candidate 평가와 근거를 작성할 수 있다.

최종 UI에는 다음과 같이 표시한다.

TRACKBACK REFERENCE HARA

또는 MVP에서는:

ASIL:
NOT CLAIMED

로 표시한다.

실제 OEM ASIL이라고 표현하지 않는다.


9. Reference Vehicle Architecture

TRACKBACK은 특정 OEM 차량을 복제하지 않는다.

Reference Architecture:

Environment / Traffic
↓
Environment State Provider
↓
Driver Input / Driving Functions
↓
Vehicle Motion Controller
↓
Communication
↓
Actuator Controller
↓
Physical Actuator
↓
Vehicle Physics
↓
Vehicle State Feedback


10. Driver Input

- Accelerator Pedal
- Brake Pedal
- Steering Wheel
- Gear Selector

EPB Input은 EPB Case 구현 시 추가한다.


11. Environment State Provider

실제 Camera/Radar Sensor Model 또는 Perception AI는 구현하지 않는다.

Traffic/Environment Ground Truth를 이용하여 Driving Function에 필요한 추상 정보를 생성한다.

예:

ObjectValid
ObjectPosition
Distance
RelativeVelocity
RelativeAcceleration
InPath
LaneOffset

AEB/ACC/LKA 기능을 사용하지 않는 Case에서는 해당 정보가 필요하지 않을 수 있다.


12. Driving / Vehicle Function 계층

Driver Vehicle Function:

- Propulsion
- Braking
- Steering
- Gear

ADAS / Driving Function:

- AEB
- ACC
- LKA

Vehicle Dynamics Function:

- ESC
- ABS
- TCS

향후:

- EPB
- Brake Blending
- Lane Change
- Additional ADAS


13. Vehicle Motion Controller

VMC 주요 논리 역할:

- Vehicle State Management
- Motion Request Management
- Request Arbitration
- Longitudinal Control
- Lateral Control
- Actuator Allocation
- Safety Monitoring

모든 실제 차량이 동일한 중앙집중형 VMC Architecture를 사용한다고 주장하지 않는다.

TRACKBACK Reference Architecture의 논리 구조로 사용한다.


14. Communication

MVP에서는 Motion CAN-FD라는 가상 Network를 사용한다.

주요 Node:

- VMC
- Brake Controller
- EPS
- eDrive
- Transmission Controller

필요 시:

- ESC-related Controller
- EPB
- Suspension


15. Actuator Controller

- Brake Controller
- EPS Controller
- eDrive / Powertrain Controller
- Transmission Controller

향후:

- EPB Controller
- Suspension Controller


16. Physical Actuator

- Friction Brake
- Steering Motor / Rack
- Electric Motor / Engine
- Transmission Mechanism

물리 결과는 Rapier Vehicle Physics로 연결한다.


17. Vehicle Motion 외 Safety 영역

TRACKBACK에서 Safety 관련 기능을 이해하기 위한 논리 Domain:

Vehicle Motion Safety
- Braking
- Steering
- Stability
- Propulsion

ADAS / Active Safety
- AEB
- ACC
- LKA

Occupant Safety
- Airbag
- Pretensioner

Powertrain / Energy Safety
- Unintended Torque
- Energy Management 관련 Fault

ECU / Platform Supervision
- Task Supervision
- Alive Monitoring
- Watchdog
- Reset
- Safe Reaction

이는 ISO 26262에서 공식적으로 정한 차량 Domain 분류라고 주장하지 않는다.


18. MCU / Watchdog 확장 Architecture

향후 Platform Safety Case로 다음 구조를 사용할 수 있다.

Application Task
↓
Execution / Alive Monitoring
↓
Watchdog Supervisor
↓
MCU Watchdog
↓
Reset / Defined Safe Reaction

Watchdog Case는 Vehicle Motion Case 이후 구현한다.

실제 특정 MCU Watchdog Peripheral을 복제하지 않는다.


19. Environment Model

Environment와 Vehicle, Traffic Actor는 독립 모델로 관리한다.

Environment:

- Road Geometry
- Lane
- Start / Finish
- Road Friction
- Scenario Trigger Zone
- 필요 시 Weather State

Scenario Trigger Zone은 사용자에게 표시되는 Test Zone이 아니다.

Fault 발생 및 Replay 조건을 재현하기 위한 내부 Trigger 영역이다.


20. Ego Vehicle Model

최소 State:

- Position
- Rotation
- Linear Velocity
- Angular Velocity
- Speed
- Acceleration
- Heading
- Steering
- Gear
- Accelerator
- Brake

필요에 따라:

- Yaw Rate
- Wheel State
- Actual Torque
- Actual Deceleration


21. Traffic Actor Model

- Position
- Rotation
- Speed
- Acceleration
- Lane
- Behavior State
- Target Trajectory

지원 행동:

- Constant Speed
- Braking
- Emergency Braking
- Cut-in
- Lane Change

모든 Case에 Traffic Actor가 필요한 것은 아니다.


22. 주요 Function Flow

Acceleration:

Accelerator Pedal / ACC
→ Acceleration or Torque Request
→ VMC
→ eDrive
→ Drive Torque
→ Vehicle Acceleration

Braking:

Brake Pedal / AEB / ESC
→ Deceleration Request
→ VMC
→ Brake / eDrive Allocation
→ Brake Controller / eDrive
→ Brake Torque
→ Vehicle Deceleration

Steering:

Steering Wheel / LKA
→ Steering Request
→ VMC
→ EPS
→ Steering Motor
→ Wheel Angle
→ Vehicle Yaw

Gear:

Gear Selector
→ Gear Request
→ State / Interlock Validation
→ Transmission or eDrive
→ Gear State

Stability:

Steering / Vehicle State
→ ESC
→ Stability Decision
→ Brake / Torque Intervention
→ Vehicle Stabilization

Airbag:

Impact
→ Crash Sensor
→ Airbag Control Unit
→ Crash Evaluation
→ Deployment Decision
→ Airbag / Pretensioner


23. Physics Engine

Physics Engine:

Rapier 3D

React Integration:

@react-three/rapier

Rendering:

Three.js
React Three Fiber

Vehicle:

Dynamic Raycast Vehicle

Game Physics Timestep:

60 Hz fixed timestep

1 / 60 second

60Hz는 TRACKBACK의 게임 Physics 설계값이며 ISO 26262 또는 일반 차량 검증 환경의 표준 주기가 아니다.

Rapier 담당:

- RigidBody
- Collision
- Wheel / Road Contact
- Engine Force
- Brake Force
- Steering
- Suspension
- Vehicle Movement

Rapier 미담당:

- Software Requirement 판단
- CAN Supervision
- SW State
- Verification Oracle
- PASS / FAIL


24. Simulation Time Architecture

Physics와 SW/CAN Timing을 분리한다.

Physics:

60Hz

Software / Communication:

Simulation Time 기반 Scheduler

예:

VMC Task:
10ms

Brake Controller:
10ms

AEB:
20ms

CAN Message:
10ms

Timeout:
30ms

Logical SW Timing은 Physics Frame Rate에 직접 종속하지 않는다.

TRACKBACK은 이를 실제 실시간 ECU Timing Verification이라고 표현하지 않는다.


25. Runtime Execution

권장 흐름:

Simulation Clock Update
→ Driver Input / Replay Input
→ Traffic Update
→ Environment State Update
→ Due Driving Functions
→ Due VMC
→ CAN Scheduler
→ Due Actuator Controller
→ Physics Command
→ Rapier Physics Step
→ Vehicle State Feedback
→ Fault Injection
→ Verification Observation
→ Black Box Logging
→ UI Publish

Fault Injection 위치는 Fault Type에 따라 별도로 정의한다.


26. Virtual CAN-FD Model

Static Message Definition:

- id
- name
- sender
- receivers
- cycleMs

Signal Definition:

- name
- factor
- offset
- unit
- min
- max
- invalidValue

Supervision:

- timeoutMs
- missingReaction

Runtime Evidence:

- timestamp
- currentValue
- lastRxTime
- status

MVP에서는 Raw Bit Packing 또는 실제 DBC 전체 구현을 필수로 하지 않는다.


27. Fault Taxonomy

INPUT / STATE Fault:

- Invalid
- Stuck
- Out of Range

FUNCTION LOGIC Fault:

- Wrong Threshold
- Wrong State Transition
- Missing Monitoring

VMC Fault:

- Wrong Priority
- Wrong Arbitration
- Wrong Allocation

COMMUNICATION Fault:

- Missing Message
- Timeout
- Scaling Mismatch

ACTUATOR CONTROL Fault:

- Incorrect Reaction
- Saturation
- Command Rejection

PLATFORM Fault:

- Task Stall
- Watchdog Timeout
- Reset

PHYSICAL Fault:

- Low Friction
- Physical Actuator Degradation

Physical Fault는 주로 Scenario Stimulus로 사용하며 UI Fix 대상은 원칙적으로 SW/Calibration Fault로 제한한다.


28. Fault Stimulus와 Software Defect

Fault Stimulus:

SW 또는 System Reaction을 평가하기 위해 주어지는 입력 또는 비정상 사건.

예:

- CAN Message Drop
- Signal Invalid
- Lead Vehicle Emergency Brake
- Low Friction

Software Defect:

플레이어가 찾아야 하는 잘못된 SW Logic / Configuration.

예:

- Wrong Scaling
- Wrong Timeout Reaction
- Wrong Priority
- Wrong State Transition

예:

Stimulus:
BrakeRequest Message Loss 80ms

Defect:
Timeout 시 INVALIDATE_ONLY

Expected Corrective Action:
DEGRADED_BRAKING

Verification Replay에서도 Stimulus는 동일하게 유지한다.


29. ISO 26262 활용

TRACKBACK은 ISO 26262 Compliance Tool이 아니다.

Reference Process:

Malfunctioning Behavior
→ Operating Situation
→ Hazardous Event
→ Safety Goal
→ FSR
→ TSR
→ SSR/SWR
→ Software Component
→ Test Case
→ Verification Result

ISO 26262 개념을 사용하여:

- 고장의 Safety 의미를 구조화
- Requirement Trace 구성
- Verification Target 이해
- Test Method 선정

을 수행한다.


30. Requirement Trace

SG:
최상위 Safety Goal

FSR:
SG를 만족하기 위한 Functional Safety Requirement

TSR:
System Architecture에 Allocation되는 Technical Safety Requirement

SSR/SWR:
Software에 Allocation되는 Safety Requirement

예:

SG
├ FSR-1
│ ├ TSR-1
│ │ ├ SSR-1
│ │ └ SSR-2
│ └ TSR-2
└ FSR-2
  └ TSR-3
    └ SSR-3

TRACKBACK의 SSR Verification PASS를 Safety Goal의 완전한 달성으로 표현하지 않는다.

UI:

SG STATUS
TRACE ONLY
NOT VALIDATED BY TRACKBACK


31. TRACKBACK Verification 범위

TRACKBACK은 실제 MIL/SIL/PIL/HIL을 수행했다고 표현하지 않는다.

실제 수행하는 것은:

- Virtual Software Simulation
- Virtual Interface Test
- Virtual Communication Test
- Simulation-based Requirement Verification
- Virtual SW Integration Test

Reference Verification Method:

- Requirements-based Test
- Interface Test
- Boundary Test
- Fault Injection

Model-Code Back-to-Back은 실제 비교 대상 Model과 Code가 있는 경우에만 향후 고려한다.

Structural Coverage 계산은 구현하지 않는다.


32. Test Case 최소 구조

TC Definition:

- TC ID
- Test Object
- Requirement ID
- Precondition
- Stimulus
- Observation
- Expected Result
- Verdict Rule

Initial Condition은 Precondition에 포함한다.

Stimulus Type:

NORMAL
FAULT_INJECTION

Software Defect는 TC가 아니라 Case Ground Truth에서 관리한다.

Fix Option도 TC가 아니라 Game Case Data에서 관리한다.

Actual Result는 Runtime Evidence로 생성한다.


33. X-Ray Engineering Mode

X-Ray는 정답 화면이 아니라 Investigation Workspace다.

중앙:

Logical Vehicle Architecture

좌측:

Node / Signal Inspector

우측:

Requirement / Test Context

하단:

Black Box Timeline

사용자가 확인할 핵심 정보:

- Vehicle Symptom
- Driver Input
- Function State
- Component Input
- Component Output
- Signal Value
- Unit
- Validity
- Timing
- Interface
- Requirement
- Expected Behavior
- Actual Behavior


34. X-Ray Layer

VEHICLE

- Ego State
- Driver Input
- Traffic

FUNCTION

- Driving Function State
- Motion Request
- State Transition

SOFTWARE

- Component
- Input
- Output
- Internal State

COMMUNICATION

- Message
- Signal
- Timestamp
- Timeout
- Scaling
- Validity

REQUIREMENT

- SSR
- TSR
- FSR
- SG

TEST

- Precondition
- Stimulus
- Observation
- Expected
- Actual
- Verdict


35. Timeline

Timeline은 Fault Run의 실제 Evidence를 보여준다.

정상 Waveform을 자동으로 나란히 표시하지 않는다.

Event:

- Driver Input
- Function Activation
- Motion Request
- CAN TX
- CAN RX
- Controller State
- Actuator Request
- Vehicle Response
- Fault
- Collision

Timeline Scrub 시 동일 Timestamp의 모든 State를 재현한다.


36. Investigation 난이도

Fault Node를 자동으로 빨간색 표시하지 않는다.

잘못된 Signal을 자동으로 표시하지 않는다.

사용자는:

Requirement
+
Signal Definition
+
Input/Output Flow
+
Timeline

을 비교하여 원인을 판단한다.

AI Hint 사용 시 Debug Time Penalty를 추가할 수 있다.


37. Fix 방식

MVP의 Fix는 자유 Coding이 아니다.

플레이어는:

1. Root Cause 선택
2. Corrective Action 선택

을 수행한다.

지원 UI:

- Dropdown
- Radio
- Toggle
- 제한된 Numeric Option

연속적인 Calibration 숫자를 추측하게 하는 것은 핵심 게임 방식으로 사용하지 않는다.

예:

ROOT CAUSE

VMC Logic
CAN Interface
eDrive Scaling
Physics

CORRECTIVE ACTION

Restore Scaling
Increase Timeout
Change Priority
Activate Degraded Reaction


38. Verification Oracle

PASS/FAIL은 LLM이 판단하지 않는다.

Approved Test Oracle이 Runtime State를 판정한다.

예:

Requirement:

Message expiration 시 Controller는 DEGRADED_BRAKING으로 전이한다.

Oracle:

TimeoutDetected == TRUE
AND BrakeMode == DEGRADED_BRAKING

조건 만족:

PASS

그 외:

FAIL


39. Black Box

Ring Buffer 기반으로 기록한다.

기본:

Pre-Incident:
10s

Post-Incident:
2s

기록:

- Vehicle State
- Traffic State
- Driver Input
- Function State
- VMC State
- Actuator State
- Communication State
- Fault State
- Requirement Observation


40. Replay Snapshot

기본 Snapshot:

Fault T-3초

저장:

Vehicle Physics State
Traffic State
Driver Input
Controller State
CAN State
Scenario State
Random Seed

VERIFY:

Snapshot Restore
→ Corrective Action 적용
→ Recorded Driver Input Replay
→ 동일 Traffic Behavior
→ 동일 Fault Stimulus
→ Oracle Evaluation

Replay 중 새로운 Driver Input을 허용하지 않는다.


41. Race / Debug Timer

Race Timer:

Driving 중 진행
X-Ray 중 Pause

Debug Timer:

X-Ray 진입 시 시작

Debug Fail Penalty는 기술 기준이 아니다.

설정값:

debugFailPenaltySec

초기값은 TBD로 두고 Play Test 후 결정한다.

Debug Time 종료 시:

DEBUG FAILED
→ Retry 또는 Case Skip 선택

Retry:
재분석

Case Skip:
Verified Spare Vehicle로 교체
→ 큰 Race Penalty
→ Case = MISSED
→ Race Resume

즉 검증에 실패한 차량을 그대로 Race에 복귀시키지 않는다.


42. Vehicle Replacement

F1 Pit Stop과 유사한 연출을 사용할 수 있다.

PASS:

현재 차량 Fix 완료
→ Race Resume

FAIL / Skip:

차량 Pit 이동
→ Verified Spare Vehicle 교체
→ Race Time Penalty
→ Case Result = MISSED
→ Race Resume

전시 시 사용자가 특정 Case에서 막혀 전체 게임을 끝내지 못하는 것을 방지한다.


43. Driving Control

MVP:

↑ Accelerator
↓ Brake
← Steering Left
→ Steering Right
Esc Pause

Gear는 기본 D로 시작한다.

Gear Case 구현 시 별도 Gear Control을 활성화한다.

EPB Control은 EPB Case 구현 시 활성화한다.

Camera Change는 MVP에서 제외한다.


44. Engineering Control

Mouse Click:
Node / Signal 선택

Space:
Timeline Play / Pause

← / →:
Timeline 이동

Tab:
Layer 전환

H:
AI Hint

Orbit / Zoom은 MVP 필수 기능이 아니다.

Node 선택 시 Camera Auto-focus를 우선 사용한다.


45. Case와 Player Session 구분

Case는 플레이어가 선택하지 않는다.

Case는 내부 Ground Truth Package다.

예:

CASE-BRK-001

Scenario Engine은:

Base Case
→ Scenario Variant
→ Run

순서로 구성한다.


46. AI 기반 Scenario 증대

Base Case의 Root Cause는 Approved Ground Truth로 유지한다.

AI는 허용 범위 내에서 Scenario Variant를 생성할 수 있다.

예:

Base Case:
Brake Timeout Reaction Defect

Variant A:
Speed 43 km/h
Trigger 13.2s

Variant B:
Speed 57 km/h
Trigger 19.4s

Variant C:
Speed 49 km/h
Trigger 16.1s

변경 가능 Parameter에는 Range를 정의한다.

AI Variant는 Headless Validation을 통과해야 한다.


47. Case와 Track 분리

특정 Function과 특정 Track을 1:1로 연결하지 않는다.

하나의 복합 Proving Ground를 사용한다.

구간:

- Straight
- Curve
- Intersection
- Two-lane Road
- Hill
- Open Area

Case는 특정 Track 이름 대신 필요한 조건만 정의한다.

예:

requiredTrackCapabilities:

- minimumStraightDistance
- curveAvailable
- leadVehicleAvailable

Scenario Engine이 조건을 만족하는 구간을 선택한다.


48. Headless Validation

Scenario Variant는 실행 전 자동 Validation을 수행한다.

검사:

- Spawn 가능
- Parameter Range 유효
- Fault Trigger 가능
- Symptom 발생 가능
- Before 상태 FAIL
- Correct Fix 후 PASS
- Replay Snapshot 생성 가능
- Runtime Error 없음

AI Validation만으로 물리적/안전적 타당성을 보증하지 않는다.


49. AI 역할 구분

AUTHORING AI:

가능:

- NHTSA 분석
- Domain Mapping
- HARA Candidate
- Requirement Draft
- Fault Candidate
- Test Case Draft
- Scenario Variant
- Consistency Review

Human Approval 필요.


RUNTIME AI:

가능:

- Hint
- Debrief
- Narrative
- 승인 범위 내 Scenario Variation


RUNTIME AI 금지:

- Approved Root Cause 변경
- Oracle 변경
- PASS/FAIL 결정
- Reference Architecture 즉석 변경


50. Architecture Ground Truth

개발 전에 직접 확정:

- Reference Vehicle Architecture
- Component Responsibility
- Controller
- Actuator
- Interface
- Platform/Supervision Boundary


51. Function Flow Ground Truth

직접 정의:

- Propulsion
- Brake
- Steering
- Gear
- Stability
- AEB
- Airbag

향후:

- Watchdog / ECU Supervision


52. Signal Dictionary

필수:

- Signal Name
- Meaning
- Unit
- Sender
- Receiver
- Min
- Max
- Initial
- Invalid

Communication Signal이면 추가:

- Factor
- Offset
- Cycle
- Timeout


53. Requirement Data

Case별 최소:

- SG
- FSR
- TSR
- SSR
- Trace

ASIL은 실제 Case 등급으로 단정하지 않는다.


54. Fault Catalog

각 Fault Family:

- Fault ID
- Domain
- Fault Class
- Injection Point
- Trigger
- Observable Symptom
- Related Component
- Related Requirement
- Possible Corrective Action


55. Test Oracle Data

각 Case:

- Requirement
- Test Object
- Precondition
- Stimulus
- Observation
- Expected Result
- Verdict Rule


56. Case Ground Truth

Base Case에는 다음을 저장한다.

- Source
- Vehicle Domain
- Scenario Constraints
- Architecture Path
- Requirement Trace
- Software Defect
- Stimulus
- Correct Root Cause
- Corrective Action
- Test Oracle
- Allowed Variant Range


57. 그래픽 컨셉

“엔지니어의 동물의 숲”

환경:

- Warm
- Pastel
- Natural

차량:

- Low-poly
- Rounded
- Toy-like
- Matte Plastic

Engineering UI:

- Neon Pastel
- 높은 시인성
- Cyberpunk 과다 사용 금지


58. Track

상상 속 자동차 Proving Ground.

하나의 복합 Track에 여러 Road Geometry를 구성한다.

특정 Fault가 특정 장소임을 사용자에게 암시하지 않는다.

Hidden Scenario Trigger는 Rendering과 분리한다.


59. Race HUD

우측 하단:

- Speed
- Accelerator
- Brake

상단:

- Race Timer
- Driving Function State

좌측 상단:

- 간단한 Control Guide

Incident:

VEHICLE ANOMALY DETECTED

를 표시한다.


60. X-Ray Visual

Vehicle Shell:

- Transparent
- Frosted
- Bubble-like

Logical Node:

- VMC
- Brake
- EPS
- eDrive
- Driving Function
- Communication

실제 ECU Packaging 위치를 의미하지 않는다.

Signal Connection은 Light Pulse로 표현한다.


61. Verification PASS 연출

VERIFICATION PASSED

→ Light Pulse
→ Confetti
→ Logical Node 정상화
→ Vehicle Shell 복구
→ Race Camera 복귀
→ Race Timer Resume


62. Verification Debrief

Race 종료 후 Report:

Observed Symptom
→ Malfunction
→ Safety Context
→ SG
→ FSR
→ TSR
→ SSR
→ Test Object
→ Stimulus
→ Root Cause
→ Corrective Action
→ Before Result
→ After Result

Safety Goal:

TRACE ONLY
NOT VALIDATED BY TRACKBACK

Footer:

TRACKBACK Reference Safety / Verification Data.
This report is not an ISO 26262 compliance assessment.


63. 기술 스택

Frontend:
React
TypeScript
Vite

3D:
Three.js
React Three Fiber

Physics:
Rapier 3D
@react-three/rapier

State:
Zustand — UI State only

High-frequency Simulation:
Pure TypeScript Runtime

UI:
HTML
Tailwind CSS

Animation:
Framer Motion

Black Box:
Ring Buffer

AI:
Serverless LLM Proxy

Case:
Local Approved Base Case JSON
+
Validated Scenario Variant


64. Runtime State Architecture

High-frequency Runtime:

SimulationRuntime
├ VehicleRuntime
├ TrafficRuntime
├ FunctionRuntime
├ ControllerRuntime
├ SchedulerRuntime
├ CanRuntime
├ FaultRuntime
├ VerificationRuntime
└ BlackBoxRuntime

React/Zustand는 매 Physics Tick의 State 저장소로 사용하지 않는다.

UI State는 약 10Hz 수준으로 Publish한다.


65. 개발 전 반드시 정의할 여섯 가지

TRACKBACK 개발의 핵심 Ground Truth:

1. Architecture
2. Function Flow
3. Signal
4. Requirement
5. Fault
6. Test Oracle

이 여섯 항목은 Coding Agent에게 자유 생성시키지 않는다.

Authoring AI는 Draft를 만들 수 있지만 개발에 사용하기 전 Human Approval을 거친다.


66. 개발 순서

Phase 1:
UI Skeleton

Phase 2:
Simulation Clock + Rapier Vehicle

Phase 3:
Driver Input

Phase 4:
VMC + eDrive Acceleration Vertical Slice

Phase 5:
Virtual Communication

Phase 6:
첫 Fault / Defect

Phase 7:
X-Ray Runtime Data

Phase 8:
Requirement / Test Oracle

Phase 9:
Root Cause / Corrective Action UI

Phase 10:
Black Box

Phase 11:
Snapshot Replay

Phase 12:
Race / Debug Game Logic

Phase 13:
Brake

Phase 14:
Steering

Phase 15:
AEB / VMC Integration

Phase 16:
Scenario Variant Generation

Phase 17:
NHTSA Case Authoring Pipeline

Phase 18:
AI Hint / Debrief

Phase 19:
Graphics Polish

향후:

ESC
Airbag
Gear
EPB
Watchdog / ECU Supervision


67. 최종 프로젝트 정의

TRACKBACK은 고장 정답을 객관식으로 맞히는 게임이 아니다.

사용자는 차량을 직접 주행하다 예고 없이 발생한 이상 거동을 경험한다.

Black Box와 X-Ray Engineering Mode에서 Vehicle, Function, Software, Communication, Requirement, Test 정보를 분석하고 Root Cause를 추론한다.

Corrective Action을 선택한 뒤 Fault 이전 Snapshot으로 Simulation State를 되돌린다.

동일 Driver Input, 동일 Scenario, 동일 Fault Stimulus로 다시 실행하고 Approved Verification Oracle을 통해 Requirement 만족 여부를 판단한다.

PASS한 경우 Race를 재개한다.

실패한 경우 재분석하거나 Penalty를 받고 Verified Spare Vehicle로 교체하여 Race를 계속할 수 있다.

실제 NHTSA Safety Case는 게임 Case의 출발점으로 활용하되 공개 자료에서 확인되지 않는 Architecture, Signal, Requirement, ASIL 및 Root Cause는 실제 차량 정보처럼 표현하지 않는다.

AI는 Case Authoring 및 Scenario Variation을 적극적으로 보조할 수 있지만, 승인된 Ground Truth와 Runtime PASS/FAIL 판정은 Deterministic Logic으로 관리한다.