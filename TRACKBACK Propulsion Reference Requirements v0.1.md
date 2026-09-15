# Propulsion 요구사항 — Reference Normal Flow

## 전체 정상 흐름

```text
Vehicle / Gear State
        ↓
1. State Management
        ↓
2. Request Acquisition
        ↓
3. Request Interpretation
        ↓
4. Torque Generation
        ↓
RequestedDriveTorque

        ↓
[Motion Arbitration]
        ↓
ArbitratedDriveTorque

        ↓
5. Torque Limitation
        ↓
6. Command Output
        ↓
eDrive
        ↓
ActualDriveTorque
        ↓
Vehicle Acceleration

병렬 경로:
7. Monitoring
        ↓
8. Fault Reaction
        ↓
9. Recovery
```

---

# 1. State Management

## FR-PROP-STA-001

**Type:** `STATE_MODE`

Propulsion 기능은 차량이 구동 가능한 상태일 때 구동 요구를 처리할 준비 상태로 전환되어야 한다.

### SYS-PROP-STA-001

```text
IF
VehicleReady == TRUE
AND GearState == DRIVE
AND DriveEnable == TRUE,

Propulsion Control SHALL enter
PROP_READY state.
```

### SWR-PROP-STA-001

```text
IF
VehicleReady == TRUE
AND GearState == DRIVE
AND DriveEnable == TRUE,

PropulsionStateManager_SWC SHALL set
PropulsionOperatingState = PROP_READY.
```

### TC-SWR-PROP-STA-001-01

```text
Precondition
PropulsionOperatingState = PROP_OFF

Input
VehicleReady = TRUE
GearState = DRIVE
DriveEnable = TRUE

Expected
PropulsionOperatingState = PROP_READY
```

---

## FR-PROP-STA-002

**Type:** `STATE_MODE`

Propulsion 기능은 유효한 구동 요구가 존재할 때 실제 구동 명령을 생성할 수 있는 활성 상태로 전환되어야 한다.

### SYS-PROP-STA-002

```text
IF
PropulsionOperatingState == PROP_READY
AND DriverDriveRequestValid == TRUE
AND DriverDriveDemand > 0,

Propulsion Control SHALL enter
PROP_ACTIVE state.
```

### SWR-PROP-STA-002

```text
IF
PropulsionOperatingState == PROP_READY
AND DriverDriveRequestValid == TRUE
AND DriverDriveDemand > 0,

PropulsionStateManager_SWC SHALL set
PropulsionOperatingState = PROP_ACTIVE.
```

### TC-SWR-PROP-STA-002-01

```text
Precondition
PropulsionOperatingState = PROP_READY

Input
DriverDriveRequestValid = TRUE
DriverDriveDemand = 0.2

Expected
PropulsionOperatingState = PROP_ACTIVE
```

---

# 2. Request Acquisition

## FR-PROP-IN-001

**Type:** `INPUT_VALIDITY`

Propulsion 기능은 유효하지 않은 가속페달 입력을 구동 요구 생성에 사용해서는 안 된다.

### SYS-PROP-IN-001

```text
IF
AcceleratorPedalValid == FALSE,

Propulsion Control SHALL NOT use
AcceleratorPedalPosition
for drive request generation.
```

### SWR-PROP-IN-001

```text
IF
AcceleratorPedalValid == FALSE,

PedalInterpreter_SWC SHALL set
DriverDriveRequestValid = FALSE.
```

### TC-SWR-PROP-IN-001-01

```text
Input
AcceleratorPedalPosition = 20 %
AcceleratorPedalValid = FALSE

Expected
DriverDriveRequestValid = FALSE
```

---

## FR-PROP-IN-002

**Type:** `INPUT_VALIDITY`

Propulsion 기능은 유효한 가속페달 입력을 운전자 구동 요구 해석에 사용할 수 있어야 한다.

### SYS-PROP-IN-002

```text
IF
AcceleratorPedalValid == TRUE,

Propulsion Control SHALL accept
AcceleratorPedalPosition
as a valid driver propulsion input.
```

### SWR-PROP-IN-002

```text
IF
AcceleratorPedalValid == TRUE,

PedalInterpreter_SWC SHALL set
DriverDriveRequestValid = TRUE.
```

### TC-SWR-PROP-IN-002-01

```text
Input
AcceleratorPedalPosition = 20 %
AcceleratorPedalValid = TRUE

Expected
DriverDriveRequestValid = TRUE
```

---

# 3. Request Interpretation

여기서는 아직 Nm를 만들지 않는다.

```text
AcceleratorPedalPosition
        ↓
"운전자가 얼마나 가속하려 하는가?"
        ↓
DriverDriveDemand
```

`DriverDriveDemand`는 TRACKBACK Reference Model에서는 `0.0 ~ 1.0`의 정규화된 운전자 요구로 정의한다.

## FR-PROP-REQ-001

**Type:** `BEHAVIOR`

Propulsion 기능은 유효한 가속페달 입력을 운전자의 구동 요구로 해석해야 한다.

### SYS-PROP-REQ-001

```text
IF
DriverDriveRequestValid == TRUE,

Propulsion Control SHALL convert
AcceleratorPedalPosition
into DriverDriveDemand
according to the defined pedal mapping.
```

### SWR-PROP-REQ-001

```text
IF
DriverDriveRequestValid == TRUE,

PedalInterpreter_SWC SHALL calculate

DriverDriveDemand =
PedalDemandMap(AcceleratorPedalPosition).
```

### TC-SWR-PROP-REQ-001-01

Reference Calibration에서 다음을 정의했다고 가정한다.

```text
AcceleratorPedalPosition = 20 %
→ DriverDriveDemand = 0.20
```

따라서:

```text
Precondition
DriverDriveRequestValid = TRUE

Input
AcceleratorPedalPosition = 20 %

Expected
DriverDriveDemand = 0.20
```

---

# 4. Torque Generation

여기서 처음으로 **운전자 의도를 물리적인 구동 토크 요구로 변환**한다.

```text
DriverDriveDemand
VehicleSpeed
DriveMode
        ↓
Torque Generation
        ↓
RequestedDriveTorque [Nm]
```

## FR-PROP-GEN-001

**Type:** `BEHAVIOR`

Propulsion 기능은 운전자의 유효한 구동 요구에 대응하는 구동 토크 요구를 생성해야 한다.

### SYS-PROP-GEN-001

```text
IF
PropulsionOperatingState == PROP_ACTIVE
AND DriverDriveRequestValid == TRUE,

Propulsion Control SHALL calculate
RequestedDriveTorque
from the current driver drive demand
and applicable vehicle state.
```

### SWR-PROP-GEN-001

```text
IF
PropulsionOperatingState == PROP_ACTIVE
AND DriverDriveRequestValid == TRUE,

DriveRequestManager_SWC SHALL calculate

RequestedDriveTorque =
DriveTorqueMap(
    DriverDriveDemand,
    VehicleSpeed
).
```

### TC-SWR-PROP-GEN-001-01

TRACKBACK Reference Calibration에서 다음 관계를 정의했다고 가정한다.

```text
DriverDriveDemand = 0.20
VehicleSpeed = 30 km/h

→ RequestedDriveTorque = 120 Nm
```

TC:

```text
Precondition
PropulsionOperatingState = PROP_ACTIVE
DriverDriveRequestValid = TRUE

Input
DriverDriveDemand = 0.20
VehicleSpeed = 30 km/h

Expected
RequestedDriveTorque = 120 Nm
```

---

# Vehicle Motion Arbitration Boundary

여기서 Propulsion이 생성한:

```text
RequestedDriveTorque
```

는 바로 eDrive로 가지 않는다.

Vehicle Motion 영역의 별도 기능인 `Motion Arbitration`을 거친다고 가정한다.

```text
Driver Requested Torque ─────┐
                             │
ADAS Request ────────────────┤
                             ↓
                    Motion Arbitration
                             ↑
Stability Constraint ────────┤
                             │
Safety Constraint ───────────┘

                             ↓
                  ArbitratedDriveTorque
```

정상 시나리오에서 다른 기능의 개입이 없다면:

```text
RequestedDriveTorque
=
ArbitratedDriveTorque
```

로 볼 수 있다.

---

# 5. Torque Limitation

## FR-PROP-LIM-001

**Type:** `OUTPUT_LIMIT`

Propulsion 기능은 현재 차량 및 구동계 상태에서 허용 가능한 범위를 초과하는 구동 토크 명령을 생성해서는 안 된다.

### SYS-PROP-LIM-001

```text
IF
ArbitratedDriveTorque >
MaxAllowedDriveTorque,

Propulsion Control SHALL limit
the drive torque request
to MaxAllowedDriveTorque.
```

### SWR-PROP-LIM-001

```text
IF
ArbitratedDriveTorque >
MaxAllowedDriveTorque,

TorqueLimiter_SWC SHALL set

LimitedDriveTorque =
MaxAllowedDriveTorque.
```

### TC-SWR-PROP-LIM-001-01

```text
Precondition
PropulsionOperatingState = PROP_ACTIVE

Input
ArbitratedDriveTorque = 350 Nm
MaxAllowedDriveTorque = 300 Nm

Expected
LimitedDriveTorque = 300 Nm
```

### Boundary Test 후보

```text
299.9 Nm
300.0 Nm
300.1 Nm
```

---

## FR-PROP-LIM-002

**Type:** `OUTPUT_LIMIT`

허용 가능한 구동 범위 내의 구동 요구는 불필요하게 제한되어서는 안 된다.

### SYS-PROP-LIM-002

```text
IF
ArbitratedDriveTorque <=
MaxAllowedDriveTorque,

Propulsion Control SHALL maintain
the requested drive torque.
```

### SWR-PROP-LIM-002

```text
IF
ArbitratedDriveTorque <=
MaxAllowedDriveTorque,

TorqueLimiter_SWC SHALL set

LimitedDriveTorque =
ArbitratedDriveTorque.
```

### TC-SWR-PROP-LIM-002-01

```text
Input
ArbitratedDriveTorque = 200 Nm
MaxAllowedDriveTorque = 300 Nm

Expected
LimitedDriveTorque = 200 Nm
```

---

# 6. Command Output

이 단계부터는:

```text
"현재 허용된 토크"
```

를 실제 하위 eDrive 기능에 전달한다.

## FR-PROP-OUT-001

**Type:** `INTERFACE`

Propulsion 기능은 최종적으로 결정된 유효한 구동 토크 명령을 하위 구동계에 전달해야 한다.

### SYS-PROP-OUT-001

```text
IF
PropulsionOperatingState == PROP_ACTIVE
AND PropulsionRequestValid == TRUE,

Propulsion Control SHALL provide
LimitedDriveTorque
as the commanded drive torque
to the eDrive function.
```

### SWR-PROP-OUT-001

```text
IF
PropulsionOperatingState == PROP_ACTIVE
AND PropulsionRequestValid == TRUE,

PropulsionCommandManager_SWC SHALL set

DriveTorqueCommand =
LimitedDriveTorque

AND

DriveTorqueCommandValid = TRUE.
```

### TC-SWR-PROP-OUT-001-01

```text
Precondition
PropulsionOperatingState = PROP_ACTIVE
PropulsionRequestValid = TRUE

Input
LimitedDriveTorque = 120 Nm

Expected
DriveTorqueCommand = 120 Nm
DriveTorqueCommandValid = TRUE
```

---

# 여기까지가 정상 Main Path

```text
Vehicle Ready
        ↓
PROP_READY
        ↓
Valid Pedal
        ↓
DriverDriveDemand
        ↓
RequestedDriveTorque
        ↓
Motion Arbitration
        ↓
ArbitratedDriveTorque
        ↓
Torque Limitation
        ↓
LimitedDriveTorque
        ↓
DriveTorqueCommand
        ↓
eDrive
        ↓
Vehicle Acceleration
```

여기까지가 **Normal Functional Path**이다.

이 아래부터는 정상 기능 옆에서 동작하는 **Supervision / Safety Path**에 가깝다.

---

# 7. Monitoring

가장 먼저 복잡한 E-GAS 구조를 재현하지 않고, TRACKBACK Reference Model에서는 **명령 경로의 일관성 감시**부터 정의한다.

## FR-PROP-MON-001

**Type:** `MONITORING`

Propulsion 기능은 최종 구동 토크 명령이 허용된 구동 토크와 일관된지 감시해야 한다.

### SYS-PROP-MON-001

```text
WHILE
PropulsionOperatingState == PROP_ACTIVE,

Propulsion Control SHALL monitor
the deviation between
LimitedDriveTorque
and DriveTorqueCommand.
```

정상 조건:

```text
ABS(
DriveTorqueCommand
-
LimitedDriveTorque
)
<= CommandTorqueTolerance
```

### SWR-PROP-MON-001

```text
WHILE
PropulsionOperatingState == PROP_ACTIVE,

PropulsionMonitor_SWC SHALL calculate

CommandTorqueDeviation =
ABS(
    DriveTorqueCommand
    -
    LimitedDriveTorque
).
```

그리고:

```text
IF
CommandTorqueDeviation
<= CommandTorqueTolerance,

PropulsionMonitor_SWC SHALL maintain
PropulsionFaultStatus = NO_FAULT.
```

### TC-SWR-PROP-MON-001-01

```text
Precondition
PropulsionOperatingState = PROP_ACTIVE

Input
LimitedDriveTorque = 120 Nm
DriveTorqueCommand = 120 Nm

Expected
CommandTorqueDeviation = 0 Nm
PropulsionFaultStatus = NO_FAULT
```

---

# 8. Fault Reaction

여기부터는 정상 시나리오가 아니라 **Fault Scenario**이다.

## FR-PROP-REA-001

**Type:** `FAULT_REACTION`

Propulsion 기능은 안전 관련 구동 이상이 검출된 경우 정상 구동 상태를 계속 유지해서는 안 되며, 정의된 제한 동작 상태로 전환해야 한다.

### SYS-PROP-REA-001

```text
IF
PropulsionFaultStatus == FAULT_CONFIRMED,

Propulsion Control SHALL enter
PROP_DEGRADED state

AND SHALL limit
the drive torque command
to DegradedTorqueLimit.
```

### SWR-PROP-REA-001

```text
IF
PropulsionFaultStatus == FAULT_CONFIRMED,

PropulsionStateManager_SWC SHALL set
PropulsionOperatingState = PROP_DEGRADED.
```

별도의 출력 SW Requirement:

### SWR-PROP-REA-002

```text
IF
PropulsionOperatingState == PROP_DEGRADED,

PropulsionCommandManager_SWC SHALL ensure

DriveTorqueCommand <=
DegradedTorqueLimit.
```

### TC-SWR-PROP-REA-001-01

```text
Precondition
PropulsionOperatingState = PROP_ACTIVE

Input
PropulsionFaultStatus = FAULT_CONFIRMED

Expected
PropulsionOperatingState = PROP_DEGRADED
```

### TC-SWR-PROP-REA-002-01

```text
Precondition
PropulsionOperatingState = PROP_DEGRADED

Input
RequestedDriveTorque = 200 Nm
DegradedTorqueLimit = 50 Nm

Expected
DriveTorqueCommand <= 50 Nm
```

`50 Nm`는 실제 차량값이 아니라 Reference TC 예시이다.

---

# 9. Recovery

Fault가 사라진 순간 바로 `PROP_ACTIVE`로 돌아가면 위험할 수 있다.

그래서 Recovery는:

```text
Fault clear
↓
Recovery Condition 확인
↓
PROP_READY
↓
정상 입력 재확인
↓
PROP_ACTIVE
```

로 두는 편이 자연스럽다.

## FR-PROP-REC-001

**Type:** `RECOVERY`

Propulsion 기능은 이상 원인이 제거되고 정의된 복귀 조건이 만족된 경우 제한 상태에서 정상 구동 준비 상태로 복귀할 수 있어야 한다.

### SYS-PROP-REC-001

```text
IF
PropulsionOperatingState == PROP_DEGRADED
AND PropulsionFaultStatus == NO_FAULT
AND RecoveryConditionsSatisfied == TRUE,

Propulsion Control SHALL transition
to PROP_READY.
```

### SWR-PROP-REC-001

```text
IF
PropulsionOperatingState == PROP_DEGRADED
AND PropulsionFaultStatus == NO_FAULT
AND RecoveryConditionsSatisfied == TRUE,

PropulsionStateManager_SWC SHALL set
PropulsionOperatingState = PROP_READY.
```

### TC-SWR-PROP-REC-001-01

```text
Precondition
PropulsionOperatingState = PROP_DEGRADED

Input
PropulsionFaultStatus = NO_FAULT
RecoveryConditionsSatisfied = TRUE

Expected
PropulsionOperatingState = PROP_READY
```

---

# 전체 Requirement Trace

```text
PROPULSION

State Management
├ FR-PROP-STA-001
│  └ SYS-PROP-STA-001
│     └ SWR-PROP-STA-001
└ FR-PROP-STA-002
   └ SYS-PROP-STA-002
      └ SWR-PROP-STA-002

Request Acquisition
├ FR-PROP-IN-001
│  └ SYS-PROP-IN-001
│     └ SWR-PROP-IN-001
└ FR-PROP-IN-002
   └ SYS-PROP-IN-002
      └ SWR-PROP-IN-002

Request Interpretation
└ FR-PROP-REQ-001
   └ SYS-PROP-REQ-001
      └ SWR-PROP-REQ-001

Torque Generation
└ FR-PROP-GEN-001
   └ SYS-PROP-GEN-001
      └ SWR-PROP-GEN-001

[Motion Arbitration]

Torque Limitation
├ FR-PROP-LIM-001
│  └ SYS-PROP-LIM-001
│     └ SWR-PROP-LIM-001
└ FR-PROP-LIM-002
   └ SYS-PROP-LIM-002
      └ SWR-PROP-LIM-002

Command Output
└ FR-PROP-OUT-001
   └ SYS-PROP-OUT-001
      └ SWR-PROP-OUT-001

Monitoring
└ FR-PROP-MON-001
   └ SYS-PROP-MON-001
      └ SWR-PROP-MON-001

Fault Reaction
└ FR-PROP-REA-001
   └ SYS-PROP-REA-001
      ├ SWR-PROP-REA-001
      └ SWR-PROP-REA-002

Recovery
└ FR-PROP-REC-001
   └ SYS-PROP-REC-001
      └ SWR-PROP-REC-001
```