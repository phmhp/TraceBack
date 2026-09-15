# TRACKBACK Live X-Ray Debugging Experience Plan v0.1

- Status: `REVIEW_REQUIRED`
- Scope: Live X-Ray 정보 구조, 조사 흐름, 기록/Replay 기반 설계
- Runtime implementation: 후속 단계

## 1. 학습 목표

플레이어가 처음부터 고장 제어기를 맞히게 하지 않는다. 차량의 관찰 가능한 이상 현상을 발견한 뒤, 시간에 맞춰 기록된 신호와 기능 관계를 좁혀 원인을 입증하게 한다.

Live X-Ray는 다음 세 모드를 명확히 구분한다.

1. **실시간 감시**: 차량 증상과 주요 신호를 관찰한다.
2. **사건 조사**: 이상 시점을 고정하고 전후 신호를 비교한다.
3. **수정 검증**: 같은 입력과 초기 조건으로 Replay하여 기대 동작 회복을 확인한다.

## 2. 도메인 고장을 알아차리는 방법

플레이어는 먼저 부품이 아니라 **차량 수준의 기대 동작 위반**을 본다. 시나리오는 정답을 노출하지 않는 `Symptom Contract`를 가진다.

예시:

- D, 유효한 가속 입력, 정지 근처라는 조건인데 응답 시간 안에 전진 가속이 없다.
- 브레이크 입력이 0인데 제동 요청이 지속된다.
- 조향 입력 방향과 Yaw 응답 방향이 다르다.
- GearState가 D인데 실제 종방향 속도가 지속해서 음수다.

계약 위반 시 타임라인에 **이상 현상 마커**만 표시한다. 원인 Component와 위반 Requirement는 플레이어가 찾아야 한다.

## 3. 조사 흐름

1. 이상 현상 인지
2. 발생 시점 고정
3. 기준 구간과 이상 구간의 신호 비교
4. 최초 이상 신호가 시작된 제어 기능 탐색
5. 연결된 상위 요구사항과 기대 동작 확인
6. 원인 가설 구성
7. 시간 정보가 포함된 증거 Signal 2~4개 선택
8. 원인 제출
9. 수정 적용 후 동일 조건 Replay 검증

각 단계는 상단 진행 표시로 보여주되, 사용자가 자유롭게 이전 단계로 돌아갈 수 있게 한다.

## 4. 통합 제어기 Architecture

```text
Vehicle Integrated Control
├─ Driver Interface
├─ Gear Control
├─ Propulsion Control
│  ├─ PropulsionFunction
│  ├─ VMC
│  └─ eDrive
├─ Brake Control
├─ Steering Control
└─ Vehicle Dynamics
```

첫 화면에는 도메인 블록만 보여준다. 블록을 선택하면 내부 기능과 해당 입력/출력 포트가 펼쳐진다. 신호 흐름은 왼쪽에서 오른쪽으로 고정하며 선택 때문에 카드 위치가 움직이지 않게 한다.

선택 연계:

```text
Architecture block
ㄴ input/output signal
   ㄴ allocated SWR
      ㄴ parent SYSR
         ㄴ linked Test Case
```

`Runtime 구조`는 큰 고정 패널이 아니라 Architecture의 선택 상세로 제공한다.

## 5. 화면 배치

기존 3열 배치는 폐기하고 다음 고정 Dock 구조를 사용한다.

```text
┌ Header: 사건 상태 / 조사 단계 / LIVE·FREEZE / 주행 복귀 ┐
├ Vehicle PiP ┬ Architecture Canvas ┬ Context Inspector ┤
│ + Symptom   │ 기능 블록과 신호선 │ Signal/Req/Evidence│
├─────────────┴─────────────────────┴───────────────────┤
│ Signal Scope: 선택 신호 2~6개의 동기화 그래프             │
├───────────────────────────────────────────────────────┤
│ Timeline: 재생/정지/프레임 이동/마커/구간 선택/Live Edge   │
└───────────────────────────────────────────────────────┘
```

- PiP는 예약된 Dock 안에 두어 다른 정보를 가리지 않는다.
- Timeline은 항상 하단에 고정한다.
- Context Inspector만 내부 스크롤한다.
- 화면 폭이 좁으면 Inspector를 Drawer로 전환하고 Timeline은 유지한다.
- 선택으로 레이아웃을 재계산하지 않고 색, 테두리, 연결선만 강조한다.

## 6. 신호 표시

### Digital Watch

현재값은 검은 모니터 배경 위 적색 7-segment 숫자로 표시한다. `DSEG7 Classic` 같은 라이선스 미확인 폰트에 의존하지 않고 CSS/SVG segment로 구현한다.

- 값: 7-segment 또는 고정폭 숫자
- 단위와 신호명: Noto Sans KR
- Boolean/Validity/Gear: 고정 폭 상태 셀
- 변경값: 400 ms amber pulse
- 최초 이상값: red outline와 타임라인 marker
- Expected/Actual: 같은 자릿수로 좌우 비교

`4/8/16 bit 느낌`은 장식으로만 쓰지 않는다. 정수 신호에는 실제 데이터 타입과 `HEX / DEC / BIN` 보기 전환을 제공하고, 연속 물리량은 단위가 있는 decimal로 표시한다.

### Signal Scope

- 모든 그래프는 같은 time cursor를 공유한다.
- 현재값, cursor값, 정상 기준값, delta를 구분한다.
- 원시 신호와 파생 신호를 표시로 구별한다.
- 선택한 시점과 0.5~2초 전 기준 시점을 A/B cursor로 비교한다.

## 7. TRACE32 사고방식의 적용

TRACE32의 기능을 그대로 복제하지 않고 학습 목적에 맞게 대응시킨다.

| TRACE32 개념 | Live X-Ray 대응 |
|---|---|
| Run / Break / Step | LIVE / 시점 고정 / 1 tick 이동 |
| Trace buffer | 시간 순서가 보존된 Runtime Recorder |
| Variable Watch | 고정한 Signal Watch |
| Trace timing/chart | 동기화 Signal Scope와 사건 Timeline |
| Data breakpoint/trigger | 조건 기반 이상 현상 Marker |
| Program flow | 제어 기능 실행 및 신호 전달 흐름 |
| Symbol/source context | Component·Requirement·Test 연결 정보 |
| Offline trace analysis | 저장된 사건을 로드해 조사하는 Replay |

핵심 학습은 `멈춰서 현재값 하나 보기`가 아니라 다음 질문을 순서대로 묻는 것이다.

1. 정상에서 처음 달라진 값은 무엇인가?
2. 그 값은 어느 Component가 만들었는가?
3. 입력은 정상이었고 출력부터 틀렸는가?
4. Requirement가 기대한 전이와 실제 전이는 어떻게 다른가?
5. 선택한 증거가 같은 원인 가설을 지지하는가?

## 8. Runtime Recorder와 Replay

현재 UI 발행용 10 Hz Telemetry는 관찰에는 충분하지만 최초 이상 tick과 결정적 Replay 근거로는 부족하다. 별도 `XRayRecorder`가 fixed physics tick에서 다음을 기록해야 한다.

- simulation tick/time
- driver input과 validity
- 각 기능 블록의 input/output
- vehicle state
- state transition/event
- scenario marker
- calibration, map, build, requirement baseline version

기록은 메모리 ring buffer로 시작하고, 사건 전후 구간을 고정한다. 결정적 Replay에는 초기 snapshot, 입력 event stream, fixed timestep, calibration/version이 함께 필요하다. UI에서 과거로 이동할 때 실제 Live Runtime을 뒤로 돌리지 않고 기록 frame을 읽는다.

## 9. 원인 제출

제출서는 다음 필드를 모두 요구한다.

- 원인 Component
- 위반된 Requirement
- 최초 이상 발생 시점
- 근거 Signal 2~4개와 선택 시각
- 예상 정상 동작
- 수정 방법

증거는 사용자가 그래프나 Watch에서 `증거로 고정`한 항목만 제출할 수 있다. 제출 후 평가는 다음을 구분한다.

- 현상은 맞지만 Component가 틀림
- Component는 맞지만 최초 발생 시점이 틀림
- Requirement 연결이 틀림
- 증거가 원인보다 결과 신호에만 치우침
- 수정 후 Replay에서 기대 동작이 회복되지 않음

첫 제출 전에는 정답 Component를 시각적으로 강조하지 않는다. 시간 제한은 사건 조사 시간에만 적용하고 화면 탐색이나 일시정지 때문에 불공정하게 소모되지 않도록 시나리오별 정책으로 둔다.

## 10. 구현 순서

### XR-1 Investigation Foundation

- fixed-tick recorder와 ring buffer
- 항상 보이는 Timeline, cursor, LIVE/FREEZE, frame step
- PiP Dock과 고정 레이아웃
- 7-segment Watch와 synchronized Scope

### XR-2 Architecture and Traceability

- 통합 제어기 Architecture graph
- Component → Signal → SWR → SYSR → TC 계층 탐색
- 최초 차이 계산과 A/B cursor

### XR-3 Investigation Game Loop

- symptom contract와 사건 marker
- hypothesis/evidence basket
- 구조화 원인 제출과 채점

### XR-4 Corrective Replay

- 수정 선택 또는 calibration/logic patch 적용
- 같은 초기 조건·입력의 Replay
- Before/After 비교와 검증 보고서

## 11. 이번 승인에서 결정할 항목

- Timeline의 기본 보존 시간과 기록 주기
- 시나리오별 자동 이상 마커 허용 범위
- 답안 시간 제한의 시작/정지 정책
- 수정 방법을 선택지로 줄지, Component patch로 체험하게 할지
- Replay를 완전 결정적으로 요구할지, 신호 재생 중심으로 시작할지

