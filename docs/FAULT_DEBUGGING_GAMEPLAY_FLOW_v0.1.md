# TRACKBACK Fault Debugging Gameplay Flow v0.1

- Status: `REVIEW_REQUIRED`
- Scope: Application SW, Communication/Timing, Monitoring/Platform 고장 조사 흐름
- Runtime Fault implementation: 포함하지 않음

## 1. 기본 원칙

플레이어는 처음부터 고장 Component를 선택하지 않는다. 다음 세 범위를 순서대로 좁힌다.

```text
차량 현상
→ Domain
→ 최초 이상 Signal을 생성한 Component
→ 위반 Requirement
→ Root Cause
```

도메인 점등은 해당 도메인의 신호가 실제로 활동했음을 뜻한다. 점등 자체는 고장 판정이 아니다. 고장 위치는 입력은 정상인데 출력이 최초로 기대 범위를 벗어난 경계를 찾아 판별한다.

## 2. X-Ray 조사 단계

### 1. 이상 현상 인지

운전 화면에서 사용자가 체감 가능한 현상을 제시한다.

- 가속 응답 부족 또는 과도
- 브레이크가 늦게 적용됨
- 간헐적인 토크 단절
- 특정 시간 이후 제어 기능 정지

화면에는 현상만 알리고 원인 Domain은 노출하지 않는다.

### 2. 발생 시점 고정

현상 인지 버튼 또는 자동 Symptom Contract가 Timeline에 `OBSERVED` Marker를 만든다. 사용자는 해당 시점을 Freeze한다.

### 3. 활동 Domain 확인

신호 변화가 있었던 Domain이 점등된다.

```text
Driver Interface
Gear Control
Propulsion Control
Brake Control
Steering Control
Vehicle Dynamics
Communication
Platform Supervision
```

점등된 Domain이 많으면 현상과 직접 관련된 출력부터 선택한다. 예를 들어 가속 문제는 Vehicle Dynamics의 종방향 응답에서 시작해 Propulsion 방향으로 역추적한다.

### 4. 전후 신호 비교

Timeline에 A/B Cursor를 둔다.

- A: 정상 구간
- B: 현상 직전 또는 현상 발생 구간

Signal Monitor는 `A 값 / B 값 / Delta / Validity / Timestamp`를 보여준다.

### 5. 최초 이상 경계 탐색

신호 흐름을 출력에서 입력 방향으로 거슬러 올라간다.

```text
Vehicle Response 이상
← Actuator Command 확인
← Control Request 확인
← Arbitration/Function Output 확인
← Driver/External Input 확인
```

입력이 기대 범위 안인데 출력이 처음 어긋난 Component가 원인 후보가 된다. 결과 신호만 고르는 답안은 충분한 근거가 아니다.

### 6. Requirement 확인

선택 Component와 Signal에 연결된 Requirement에서 다음 조건을 비교한다.

- Precondition: 요구사항이 적용되는 전제
- Trigger: 동작을 시작시키는 조건
- Expected Output/Range: 기대 출력과 범위
- Timing: 응답 시간, 주기, timeout
- Persistence: 몇 cycle 동안 유지해야 하는가
- Recovery Condition: 정상 복귀 조건
- Inhibit/Fallback: 동작 금지 또는 대체 동작

### 7. 원인 가설과 증거 구성

```text
원인 Component
위반 Requirement
최초 이상 시각
원인 입력 Signal
잘못된 출력 Signal
차량 결과 Signal
예상 정상 동작
```

Signal 증거는 2~4개만 선택한다. 가능한 구성은 `원인 입력 1 + 잘못된 출력 1 + 차량 결과 1`이다.

### 8. 원인 제출

답안은 구조화된 Investigation Report로 제출한다.

```text
Domain
Root Cause Component
Violated Requirement
First Divergence Timestamp
Evidence Signals
Expected Behavior
Corrective Action
```

### 9. 수정 후 Replay 검증

같은 초기 상태, 입력, calibration, fixed timestep으로 재생한다. 수정 전/후 신호와 차량 결과를 같은 Timeline에서 비교한다.

## 3. 고장 계층별 조사 차이

### Application SW

흐름:

```text
차량 응답 이상
→ Function/VMC/eDrive 입출력 비교
→ 최초 잘못된 계산 또는 Arbitration 확인
→ Functional Requirement 확인
```

CASE-01 eDrive Scaling Mismatch:

```text
DriveTorqueRequest 정상
→ EDriveTorqueCommand 크기만 비정상
→ Vehicle acceleration 비정상
```

CASE-02 VMC Arbitration Error:

```text
Propulsion/Brake 요청 정상
→ VMC 선택 결과 비정상
→ eDrive 또는 Brake command 비정상
```

### Communication / Timing

값만 보지 않고 `Age, Cycle, Sequence, Validity, Deadline`을 함께 본다.

CASE-03 Brake Message Timeout:

```text
Driver brake input 정상
→ 송신 request 정상
→ 수신 timestamp/age 증가
→ timeout 발생
→ receiver fallback 확인
```

필요 증거:

- Sender value와 transmit timestamp
- Receiver value와 receive timestamp
- Message age/sequence counter
- Timeout Requirement와 fallback output

CASE-04 VMC Task Overrun:

```text
입력 Signal 정상
→ Task start 지연 또는 execution time 초과
→ output publication deadline miss
→ downstream command stale
```

필요 증거:

- Task activation/start/end timestamp
- execution time와 deadline
- output update timestamp
- downstream signal age

CAN 화면만 따로 보게 하지 않는다. Runtime Flow의 Component 사이 연결선을 선택하면 Interface 상세에서 message, sender, receiver, cycle, age, counter, validity를 보여준다.

### Monitoring / Platform

제어 기능과 이를 감시하는 기능을 두 Lane으로 나란히 본다.

```text
FUNCTION: expected output → actual control output
MONITOR: observed value → threshold/debounce → reaction
PLATFORM: task/alive/watchdog state → reset or degradation
```

CASE-05 Level-2 Monitor Threshold Error:

```text
제어 출력은 정상
→ Monitor threshold/calibration이 잘못됨
→ false detection 또는 missed detection
→ 잘못된 degradation 발생
```

CASE-06 Watchdog / Alive Supervision Failure:

```text
Task 또는 alive event
→ supervision window
→ alive counter 평가
→ watchdog/fault reaction
```

여기서는 `Task가 실제로 멈췄는가`와 `Supervisor가 정상 Task를 잘못 판정했는가`를 분리해야 한다.

## 4. TRACE32식 사고와 게임 UI 대응

```text
Watch       → 관심 Signal 고정
Trace       → 실행 중 기록된 시간 순서 확인
Trigger     → 특정 값/조건이 처음 발생한 위치 표시
Break       → 해당 시점의 상태 고정
Step        → 한 tick씩 전후 이동
Task View   → Scheduler/Task 실행 상태 확인
Offline     → 사건 기록을 저장하고 Replay 분석
```

플레이어는 무작위로 패널을 훑지 않고 다음 질문을 반복한다.

1. 현상과 직접 연결된 출력은 무엇인가?
2. 이 값은 어느 Component가 만들었는가?
3. 그 Component의 입력은 정상이었는가?
4. 최초로 정상 범위를 벗어난 tick은 언제인가?
5. 값 문제인가, 전달 문제인가, 실행 시점 문제인가, 감시 판단 문제인가?

## 5. 정보 공개 순서

### 처음 보이는 정보

- 차량 현상
- Domain 활동 상태
- 주요 차량 Signal
- Timeline 사건 Marker

### Domain 선택 후

- 관련 Component Flow
- Component 입출력
- 연결 Interface

### Signal 선택 후

- A/B 비교
- Source/Destination
- 관련 Requirement

### Requirement 선택 후

- Precondition/Trigger/Expected/Timing/Recovery
- 연결 Test Case

### 제출 단계

- Evidence Basket
- Root Cause Report
- Corrective Replay

이 순서로 화면 정보량을 제한한다.

## 6. 구현 단계

1. Domain Registry와 활동 상태 표시
2. Fixed-tick Black Box Recorder와 Timeline A/B Cursor
3. Signal Source/Destination 및 Interface Registry
4. Requirement 조건 구조화
5. Application SW Case
6. Communication/Timing Case
7. Monitoring/Platform Case
8. Evidence 제출과 Replay 채점

