# TRACKBACK 레이싱–고장 추리 구현 청사진

## 1. 제품 한 줄 정의

TRACKBACK은 실도로형 Time Attack 중 발생한 차량 이상을 실제 주행 기록으로 조사하고, 가설을 시험·수리한 뒤 같은 레이스에 복귀하는 차량 SW 추리 게임이다.

플레이어는 상황에 따라 고양이 드라이버, 정비사, 차량 구조 학습자, 검증 엔지니어의 행동을 차례로 수행한다. 한 화면에서 네 역할을 동시에 요구하지 않는다.

## 2. 현재 구현을 두 부분으로 구분

### 레이싱 게임

- Countdown, 실제 Rapier 차량, keyboard input, route departure 판정
- 실제 CASE-PT-001 runtime fault와 incident capture
- incident 시 차량/SimulationClock 정지
- 수리 후 safe spawn, recovery countdown, ordered checkpoint, sector, PB, finish
- clean rematch와 case recovery 기록 분리
- 화면에 보이지 않는 checkpoint trigger와 간결한 HUD
- 실제 collider를 가진 scenario lead vehicle/collision obstacle
- 첫 본편 Driving Event: 수리 후 정차 차량 회피

### 고장 원인 조사실

- Page 1: 실제 incident observation
- Page 2: Function / Signal / Interface / Requirement 도구
- Page 3: 독립 계산과 전체 차량 시나리오 관찰
- Page 4: Evidence를 고른 결론과 repair
- PHENOMENON / BOUNDARY / PROOF clue gate
- Last Known Normal / First Known Abnormal
- 실제 C/WebAssembly 및 TRACKBACK 실행 모델 Workbench
- wrong diagnosis, failed repair, regression, safe race return

현재 문제는 두 시스템이 없는 것이 아니라, 레이스 context가 조사 질문과 충분히 시각적으로 이어지지 않고 조사 도구가 현재 질문보다 먼저 보인다는 점이다.

## 3. 완성 목표 플레이 흐름

```text
PRE-RACE BRIEF
→ COUNTDOWN
→ DRIVING EVENT
→ 실제 차량 기능 사용
→ FAULT가 있으면 증상 체감
→ INCIDENT CAPTURE
→ 사건 장면 3초 요약
→ 현상 단서
→ 정상/이상 경계
→ 후보 축소
→ 구분 시험
→ 증명
→ 수리
→ REGRESSION
→ 같은 레이스 복귀
→ 비교 가능한 Driving Event
→ FINISH
→ DRIVING / INVESTIGATION / RESOLUTION 결과
```

## 4. 맵 설계

맵은 한 번의 주행에서 여러 기능을 자연스럽게 사용하게 하는 실도로형 route로 구성한다.

1. 출발·저속 도심: Countdown, 차선 적응
2. 신호 교차로: 정지, 출발, 초기 가속
3. 직선·완만한 경사: propulsion/energy demand
4. 곡선: steering/stability
5. 정차 차량 또는 차선 축소: braking/steering decision
6. 앞차 감속: relative distance, braking, 향후 ACC/AEB
7. 수리 후 비교 구간: incident 당시와 유사한 기능을 다시 사용
8. finish 접근: 마지막 sector와 PB 피드백

거대한 checkpoint ring은 사용하지 않는다. Route는 도로·차선·방향표지·미니맵이 전달하고 checkpoint는 내부 trigger로만 남긴다.

## 5. Driving Event 계약

환경 오브젝트가 아니라 다음 계약을 가진 사건 단위로 구현한다.

```text
Environment state
→ Player decision
→ Vehicle function usage
→ Physical result
→ Gameplay result
→ Incident/Evidence context
```

각 Event는 다음 필드를 갖는다.

- stable event ID/type
- 활성화 조건과 재현 가능한 seed
- 실제 world actor/collider
- 플레이어에게 보여줄 한 줄 목표
- 성공/충돌/위반 조건
- 순수 gameplay penalty/reward
- 사용한 차량 기능
- incident에 저장할 environment context
- engineering verdict와 분리된 결과

## 6. 첫 구현 Driving Event

`EVENT-STOPPED-VEHICLE-001`

- 활성화: verified repair 후 recovery race 시작
- 환경: 전방 24 m, 차로 한쪽에 정차 차량
- actor: 화면 mesh와 동일 pose를 쓰는 Rapier kinematic collider
- 판단: 감속 후 안전한 여유 공간으로 조향
- 사용 기능: Braking, Steering, Vehicle Dynamics
- 성공: actor를 안전하게 지나 4 m 이상 앞섬
- 실패: 실제 collider contact
- 결과: 충돌 시 물리 반응 + race/sector/PB에 `+3.0 s`
- 비결과: engineering PASS/FAIL, root cause, repair correctness에는 영향을 주지 않음

이 Event를 일반화한 뒤 Lead Brake, Merge, Cut-in에 같은 lifecycle을 재사용한다.

## 7. 우선 구현할 Event 순서

1. 정차 차량 회피 — 실제 collision과 braking/steering 판단
2. 신호 교차로 — red/green state, stop line, 위반과 출발 타이밍
3. Lead vehicle 감속 — 상대거리와 closing speed
4. 차선 축소/공사 — 실제 barrier와 lane path
5. 완만한 경사 — propulsion/energy context
6. 곡선 진입 — speed/steering/yaw context
7. Scripted merge/cut-in — deterministic traffic actor
8. low-friction — tire/slip 근거가 충분할 때만

보행자·복잡한 교통 AI·무작위 공격 운전은 현재 범위에서 구현하지 않는다.

## 8. 레이스 규칙

- 목적: 빠르고 안전하게 ordered route를 완주
- Driving score: race/sector time, checkpoint, collision, route result
- Investigation score: evidence completeness, hint, diagnosis time
- Resolution score: supported diagnosis, repair regression, recovery
- 세 결과는 서로의 PASS/FAIL을 바꾸지 않는다.
- Fault는 UI 버튼이 아니라 실제 case runtime 조건으로만 발생한다.
- Incident capture 후 physics 정지는 사실대로 유지하고 별도 Incident Time Loss를 증가시킨다.
- collision/time penalty는 gameplay 기록에만 반영한다.
- 수리 성공 직후 긴 보고서보다 recovery countdown을 우선한다.

## 9. 고장 전과 고장 후

### 고장 전

- 플레이어는 원인을 모른 채 일반적인 실도로 목표만 받는다.
- Event는 차량 기능을 자연스럽게 사용하게 한다.
- HUD는 time, sector, checkpoint, 현재 도로 상황만 표시한다.
- engineering signal/root location은 보여주지 않는다.

### 고장 발생

- 메시지보다 차량 반응을 먼저 체감하게 한다.
- `VEHICLE ISSUE · 출력 반응 이상`처럼 운전자 수준 증상만 표시한다.
- 사건 당시 Driver Input, Vehicle State, command, motion, environment/event context를 저장한다.

### 수리 후

- safe spawn과 짧은 countdown으로 같은 race에 복귀한다.
- incident와 같은 기능을 다시 쓰는 비교 구간을 제공한다.
- repaired response를 직접 느끼고, 추가 Driving Event로 운전 재미를 이어간다.

## 10. 조사실을 게임처럼 만드는 방식

추천 방식은 고정 객관식도 자유 문서 탐색도 아닌 `Guided Investigation Cards + 자유 도구` 혼합이다.

화면 상단에는 한 번에 카드 하나만 둔다.

```text
CARD 1 · 방금 무슨 일이 있었나요?
목표: 입력이 있었는지, 차량 반응이 부족했는지 확인
[사건 장면 보기] [관찰 기록]
```

```text
CARD 2 · 정상은 어디까지 전달됐나요?
목표: Last Known Normal 하나를 evidence로 지정
[기능 지도] [신호]
```

```text
CARD 3 · 어디부터 달라졌나요?
목표: First Known Abnormal 하나를 evidence로 지정
[신호] [Interface] [Requirement]
```

```text
CARD 4 · 남은 후보를 어떻게 구분할까요?
목표: 시험 조건과 관찰 출력을 선택
[Workbench]
```

카드는 질문과 소목표만 제시한다. 기존 Function/Signal/Interface/Requirement/Workbench는 버리지 않고 카드가 추천하는 자유 도구로 유지한다.

## 11. 퀴즈 사용 원칙

퀴즈는 진행을 대신하지 않고 플레이어 판단을 확인하는 데만 쓴다.

- 좋은 문제: “입력은 있었지만 반응이 작았다”를 실제 trace 두 개로 선택
- 좋은 문제: Last Normal/First Abnormal evidence를 각각 고르기
- 좋은 문제: 남은 두 가설을 구분할 monitor 고르기
- 나쁜 문제: “고장 원인은 eDrive인가?”를 초기에 객관식으로 묻기
- 나쁜 문제: Page 방문이나 탭 클릭만으로 정답 처리
- 나쁜 문제: 기술 용어 암기

틀리면 정답 공개보다 왜 현재 evidence로 판단할 수 없는지 알려주고 다시 도구로 돌아가게 한다.

## 12. 정보 계층

1. 게임 언어: `구동 요청`, `실행 명령`, `실제 차량 반응`
2. 추리 근거: `DriveTorqueRequest`, `EDriveCommand`, 값·유효성·출처
3. 기술 상세: canonical ID, requirement 원문, provenance, interface, approval 상태

영문 변수명은 삭제하지 않는다. 기본 카드에서는 한글 이름을 먼저 보이고 기술 이름은 보조로 둔다.

예:

```text
구동 토크 요청
DriveTorqueRequest
구동계에 요구하는 토크
```

## 13. Page 3 정책

- 74개 canonical Function 모두 차량 시나리오 대상으로 선택 가능
- 해당 기능의 실제 시나리오 observation과 제한을 표시
- 독립 Expected/PASS·FAIL이 가능한 계산기는 별도 그룹으로 유지
- oracle이 없는 기능은 `OBSERVED`만 제공
- candidate requirement가 DRAFT_NOT_APPROVED이면 승인 oracle처럼 사용하지 않음
- 한 시나리오에 74개 observation이 기록되어도 기본 화면에는 선택 기능과 관련 monitor만 우선 표시

## 14. 단계별 구현 로드맵

### Racing P0.1

- 정차 차량 회피 Event 완료
- Event HUD, collision penalty, actual collider/renderer 완료
- 의미 없는 cone/checkpoint geometry 제거 완료

### Racing P0.2

- 신호 교차로 state machine과 stop-line rule
- IncidentFrame에 DrivingEvent context 저장
- 고장 전/수리 후 비교 Event pair

### Racing P1

- Lead Brake, Merge/Cut-in
- sector delta와 Event별 clean result
- Fault run vs repaired run comparison
- cat reaction/audio feedback

### Investigation V2

- Guided Investigation Card shell
- incident mini replay/scrubber
- evidence 선택형 짧은 질문
- 관련 도구 spotlight와 자유 탐색 병행
- progressive Korean terminology

EV 로직 애니메이션/그래픽은 이번 단계에서 구현하지 않는다. Card/정보 계층을 먼저 안정화한 뒤 별도 작업으로 진행한다.
