# 차량 시나리오 실행 범위와 레이싱–추리 통합 설계

## 1. 제품 정체성

TRACKBACK은 `실도로형 Incident Time Attack + 증거 기반 차량 고장 추리`다.

플레이어의 역할은 화면마다 직업이 바뀌는 것이 아니라 하나의 판타지로 묶는다.

> 고양이 드라이버와 함께 차량을 운전하고, 이상을 체감하고, 정비사처럼 원인 후보를 좁히고, 검증 엔지니어처럼 시험으로 증명한 뒤, 수리한 차량으로 같은 레이스에 복귀한다.

학습은 별도 강의가 아니라 이 행동의 결과로 일어나야 한다. 레이스 중에는 운전, 조사 중에는 현재 질문 하나, 기술 상세에서는 원문과 provenance에 집중한다.

## 2. C와 WebAssembly

- **C**는 차량 SW 계산을 작성한 소스 언어다.
- **WebAssembly(WASM)**는 그 C 코드를 브라우저에서도 실행할 수 있게 컴파일한 실행 형식이다.
- TRACKBACK에서 `C`와 `WASM`은 서로 다른 두 로직이 아니다. 같은 C 로직을 브라우저에서 실행하는 전달 방식이 WASM이다.
- 플레이어 UI에서는 `실제 차량 SW 계산`으로 부르고, 기술 상세에만 `C source → WebAssembly`를 표시한다.
- 이 코드는 TRACKBACK 실행 로직이며, 공개 근거 없이 GV70 OEM ECU 내부 로직이라고 주장하지 않는다.

## 3. 현재 실행 범위

Canonical Logical Function은 총 74개다.

| 구분 | 수 | 의미 |
|---|---:|---|
| 독립 계산 + Expected 검증 | 10 | 입력을 바꾸어 반복 실행하고 명시적 판정 기준과 비교 가능 |
| 차량 시나리오 전용 기능 계산 | 46 | 실제 Rapier 차량 경로 또는 출처가 표시된 TRACKBACK 교육 모델에서 계산됨 |
| 기존 host/runtime 부분 관측 | 18 | 완전한 독립 모델 대신 실제 host/runtime 경계 상태를 같은 시간축에 기록 |
| 차량 시나리오에서 관찰 가능 | 74 / 74 | 독립 계산 10개를 포함한 모든 canonical Logical Function이 1/60초 시나리오 기록에 등장 |
| 실행 모델 없음 | 0 | 현재 registry의 Logical Function 중 시나리오 관측조차 불가능한 항목은 없음 |

부분 관측은 완전한 독립 모델이나 PASS/FAIL oracle이 아니다. UI와 evidence에는 `OBSERVED_PARTIAL / HOST_RUNTIME_OBSERVATION`으로 보존한다.

이 숫자는 “74개 모두 독립 PASS/FAIL 가능”을 뜻하지 않는다. 독립 Expected/oracle이 있는 것은 10개다. 나머지는 시나리오 기능 계산 또는 실제 host/runtime 부분 관측이며 결과는 `OBSERVED`로 남긴다.

Vehicle State의 `LF-VS-MODE/FAULT`와 Energy의 `LF-EN-READY/LIMIT/MON`은 `TRACKBACK_EXECUTION_MODEL / SIMULATION_ASSUMPTION`으로 추가했다. Energy unavailable/invalid는 실제 scenario propulsion permission과 차량 반응에 연결된다. `LF-EN-LIMIT`는 constraint candidate를 계산·기록하지만 canonical allocation 위치가 OPEN이므로 최종 명령에는 아직 적용하지 않는다.

Fault의 `LF-FM-DETECT/DIAG/REACT/REC`는 기존 fault-injection telemetry와 interface comparison을 입력으로 하는 TRACKBACK 교육용 lifecycle이다. 실제 OEM DTC가 아니며, 반응은 request로 기록하되 production safety policy처럼 차량에 강제 적용하지 않는다.

`LF-GEAR-REACT`는 기존 C Gear 결과의 거부/invalid 상태를 분류하며 실제 변속기 진단을 대체하지 않는다. `LF-SEN-QUALITY`는 Rapier 및 host runtime 관측값의 finite/valid 상태만 평가하며 실제 센서 품질이나 redundancy를 주장하지 않는다.

Braking의 demand/coordination/blend/state/feedback은 현재 실행 경로를 `DRIVER_ONLY + FRICTION_ONLY + OBSERVED_ONLY`로 명시적으로 분해한다. Steering coordination/state/monitor도 `DRIVER_ONLY + TRACKBACK_MANUAL_STEERING + OBSERVED_ONLY` 범위다. ABS·회생제동·유압·EPS·LKA·승인 yaw oracle은 구현됐다고 주장하지 않는다.

Motion Coordination 5개는 현재 존재하는 운전자 추진·제동·수동 조향 채널, brake 입력 시 drive adapter 억제 정책, 실제 physics command allocation을 실행·기록한다. 다른 제어원과 ADAS arbitration을 포함하는 전체 Reference Motion Coordination 구현은 아니다.

Execution 2개는 TRACKBACK host의 실제 1/60초 fixed-step release/completion/timing supervision이다. ECU RTOS·AUTOSAR task가 아니다. Communication 2개는 eDrive command를 실제 경로에서 복제·전달하는 same-tick direct-port bus이며 CAN-FD·Ethernet·OEM network가 아니다.

Propulsion monitor/reaction/recovery는 현재 propulsion request→torque request→eDrive command와 TRACKBACK fault lifecycle을 같은 tick에서 관찰한다. 승인 deviation oracle이 없어 monitor는 OBSERVED_ONLY이며, inhibit 반응은 production safety policy가 아니라 적용되지 않은 request로 기록한다.

Stability 4개는 Rapier ray-cast wheel의 실제 contact/rotation/impulse와 chassis yaw rate를 입력으로 한다. 기본 레이스는 monitor-only로 기존 물리를 보존한다. 차량 시나리오 opt-in에서만 TRACKBACK global brake/drive scale을 적용한다. ESC는 개별 휠 제어가 없어 yaw deviation 관찰만 하며 OEM ABS/TCS/ESC가 아니다.

Occupant 3개는 시나리오 전방에 실제 Rapier collider를 배치하고 chassis contact/impulse를 관찰한다. 보호 판단·명령은 opt-in TRACKBACK demo이며 `any non-ground contact`라는 교육용 기준만 사용한다. OEM crash severity threshold, airbag/pretensioner, 물리 restraint나 injury 모델은 구현하지 않는다.

ADAS 4개는 실제 Rapier kinematic lead vehicle의 상대거리·상대속도와 현재 configured route의 횡방향/heading 오차를 입력으로 한다. 앞차는 화면에도 같은 물리 pose로 그려지고 실제 충돌할 수 있다. 기본 상태는 관찰 전용이며, 시나리오에서 명시적으로 opt-in한 경우에만 TRACKBACK ACC drive scale, AEB brake override, LKA steering correction을 적용한다. 이는 `SIMULATION_ASSUMPTION / TRACKBACK_EXECUTION_MODEL`이며 GV70 OEM perception·ACC·AEB·LKA 로직이나 승인 성능 수치가 아니다.

## 4. 구현 순서

모델 수를 늘리기보다 서로의 입력이 되는 기반부터 순차 구현한다.

1. **상태·에너지·고장 기반**: Vehicle State, Energy, Fault, Gear reaction
2. **제동·조향 coordination**: demand, coordination, state, feedback, monitor
3. **Motion Coordination**: request, authority, lateral, allocation, monitor
4. **Stability**: ABS/TCS/ESC와 coordination
5. **Execution·Communication**: scheduler, supervision, network freshness
6. **ADAS**: 실제 차선, 앞차, 상대거리, 충돌위험 환경 모델 이후 ACC/AEB/LKA — 완료(교육용 opt-in 모델)
7. **Occupant**: 실제 collision telemetry 이후 impact observation — 완료(교육용 opt-in 판단, 물리 restraint 제외)

각 모델은 다음을 갖기 전에는 Page 3의 실행 대상으로 승격하지 않는다.

- 입력/출력 계약과 단위
- 정상 상태와 제한 상태
- 초기화·상태 전이·복구 규칙
- source authority: `OWNER_MANUAL_FACT`, `TRACKBACK_EXECUTION_MODEL / SIMULATION_ASSUMPTION`, `UNVERIFIED_INTERNAL`
- 차량 시나리오 연결
- 독립 runner
- Expected/oracle의 출처
- 정상·비정상·경계·복구 테스트

## 5. 한 판의 범용 구조

```text
PRE-RACE BRIEF
  → COUNTDOWN
  → REAL-WORLD DRIVING EVENT
  → ACTUAL SYMPTOM
  → INCIDENT CAPTURE
  → PHENOMENON
  → EXPECTED vs ACTUAL
  → LAST NORMAL / FIRST ABNORMAL
  → SUSPECTS
  → DISCRIMINATING TEST
  → PROOF
  → REPAIR / REGRESSION
  → SAME-RACE RETURN
  → COMPARABLE DRIVING EVENT
  → FINISH / DEBRIEF
```

고정하는 것은 도구 순서가 아니라 추론 원칙이다. Architecture, Interface, Signal, Requirement, Workbench는 질문에 따라 꺼내 쓰는 도구다.

## 6. 레이스 환경의 존재 조건

트랙 요소는 아래 역할 중 하나 이상을 가져야 한다.

- Route: 경로를 이해시킴
- Driving Decision: 정지·가속·감속·조향·차선 변경 판단을 만듦
- Vehicle Function Context: 특정 기능을 자연스럽게 사용하게 함
- Game Pressure: sector time, delta, 안전 주행에 영향을 줌
- Incident Context: 증상이 왜 그 순간 드러났는지 설명함
- Evidence Context: 사건 당시 환경·입력·차량 반응으로 기록됨

역할이 없는 거대한 체크포인트 링과 장식용 콘은 사용하지 않는다. Checkpoint 판정은 보이지 않는 trigger로 유지하고, 길찾기는 도로·차선·표지·간결한 HUD가 담당한다. 콘은 실제 차선 폐쇄나 공사 구간을 전달할 때만 사용한다.

## 7. 재사용 가능한 Driving Event

| Event | 운전 판단 | 사용하는 기능 | 조사에 남길 Context | 선행 구현 |
|---|---|---|---|---|
| 신호 교차로 | 정지 후 출발 | Braking, Gear, Propulsion | signal phase, stop-line, input, response | 실제 state machine과 위반 판정 |
| 완만한 오르막 | 가속량 조정 | Propulsion, Energy | grade, speed, demand | 도로 grade/force 영향 |
| 실제 차선 축소 | 조향·감속 | Steering, Braking | lane geometry, steering, collision | collider가 있는 barrier/vehicle |
| 정차 차량 | 회피 또는 정지 | Steering, Braking | relative pose, collision | 물리 collider |
| Lead vehicle 감속 | 거리 유지 | Braking, 향후 ACC/AEB | relative speed/distance | deterministic vehicle actor |
| Merge / Cut-in | 감속·회피 | Braking, Steering, 향후 ADAS | event phase, TTC 후보값 | scripted deterministic actor |
| 곡선 | 진입 속도·조향 | Steering, Stability | curvature, steering, yaw | road curvature context |
| 저마찰 구간 | 가감속 억제 | Stability, Braking | surface/friction | tire/slip 모델 후 사용 |
| 주차·회차 | D/R 전환 | Gear, Vehicle State | gear request/state, speed | gear state machine |

NPC 차량은 장식 mesh가 아니라 Rapier collider를 가진 실제 world actor여야 한다. Script는 사건 재현성을 위한 것이며 충돌 반응은 물리적으로 발생해야 한다. 다만 충돌 자체를 차량 고장의 정답으로 자동 연결하지 않는다.

## 8. 다양한 Case를 위한 Recipe

공통 shell은 유지하지만 Case별 조사 graph는 다르게 구성한다.

- Propulsion: 현상 → longitudinal path → request/command boundary → component proof
- Braking: 감속 기대 → brake request/force/actual motion → actuator 또는 control 후보 → proof
- Steering: path deviation → steering request/angle/yaw → coordination 또는 plant 후보 → proof
- Gear/State: requested state → permission/interlock → transition → resulting state
- Communication: sender → transmitted endpoint → freshness/validity → receiver
- Actuation/Plant: command → applied force/angle → actual vehicle response
- Energy: ready/limit → requested output → available output → restriction cause
- ADAS: environment object/lane → availability → request → driver/actuator authority → response

모든 Recipe는 최소한 `현상`, `Expected/Actual`, `경계`, `가설`, `구분 시험`, `증명`, `수리 후 재주행`을 담되, 정확히 세 개 Key나 고정된 탭 순서를 강요하지 않는다.

## 9. Graphic-first 조사 표현

EV의 내부를 기계 부품 애니메이션으로 꾸며내지 않는다. 대신 **의도·정보·제어·에너지·차량 반응의 흐름**을 시각화한다.

```text
운전자 의도 → 기능 요청 → 조정/제한 → 실행 명령 → 힘/각도 → 차량 반응
```

표현 규칙:

- 회색: 배경/미확인
- 파랑: 현재 조사 초점
- 초록: Evidence로 확인된 정상
- 주황: 아직 모르는 경계
- 빨강: Evidence로 확인된 최초 이상
- 점선: Expected
- 실선: Actual
- 움직이는 pulse: 현재 tick의 데이터 흐름

화면 깊이:

1. **게임 요약**: 운전자 입력과 차량 반응, 현재 질문 한 줄
2. **추리 근거**: 관련 path, boundary, signal, Expected/Actual
3. **기술 상세**: canonical ID, source, requirement 원문, provenance, 실행 제한

Incident 직전 2–3초를 scrub할 수 있게 하고, 같은 타임라인에서 `Last Normal → First Abnormal`로 이동한다. 단서를 얻을 때만 5–10초 분량의 짧은 그래픽 설명을 보여주며 긴 강의를 재생하지 않는다.

## 10. 정비사와 학생 역할의 결합

두 역할을 동시에 긴 텍스트로 요구하면 과부하다. 행동 층을 나누면 함께 성립한다.

- **정비사 행동**: 증상 확인, 후보 제거, 수리 선택
- **검증 엔지니어 행동**: Expected/Actual, boundary, 재현 시험, regression
- **학생의 보상**: 방금 사용한 기능 원리가 짧은 그래픽과 쉬운 용어로 정리됨

학습 정보는 진행을 막는 시험지가 아니라 플레이를 더 잘하게 하는 보상이어야 한다. 기술 상세를 읽는 행위에는 시간 penalty를 추가하지 않고, 타임어택 압력은 별도의 Incident Time Loss로만 표현한다.

## 11. 점수와 결과

- Driving: race time, sector, checkpoint, collision/route result
- Investigation: evidence completeness, hints, diagnosis duration, independent/assisted
- Resolution: diagnosis support, repair regression, recovery completion

세 점수는 섞지 않는다. 운전을 못했다고 engineering 판단이 실패하거나, 정답을 맞혔다고 레이스 기록이 좋아지지 않는다.

## 12. 구현 P0/P1/P2

### P0

- 실제 차량 시나리오 관측 범위의 정직한 표시
- 의미 없는 checkpoint geometry 제거, route trigger 유지
- 신호 교차로 또는 실제 차선 축소 중 하나를 state/collision/evidence까지 완성
- Incident context를 trace에 기록
- Graphic-first 현상/경계/증명
- repair 후 같은 race 복귀와 비교 가능한 후반 주행 구간

### P1

- 물리 collider가 있는 deterministic lead vehicle의 Race Event/Case Recipe 통합(시나리오 Workbench 기반은 완료)
- scripted merge/cut-in
- sector delta, clean rematch, fault/repaired comparison
- incident/recovery/new-best 고양이 반응

### P2

- 복수 traffic variation
- 공개 요구사항/승인 oracle을 확보한 ADAS 독립 검증(현재는 TRACKBACK 시나리오 관찰·데모만 지원)
- tire/slip 모델 기반 low-friction
- source가 확보된 TPMS/lighting/energy Case

실제 고장 빈도는 취급설명서만으로 판단하지 않는다. 빈도 순위를 주장하려면 정비·field 데이터가 별도로 필요하다.

## 13. 2026-10-16 구현 갱신

- 이전 “42개 미구현” 목록은 중간 상태였으며 현재는 모두 차량 시나리오 관찰 경로가 있다.
- Page 3에서 74개 canonical Logical Function을 Area별로 선택할 수 있다.
- 독립 Expected/PASS·FAIL 계산기는 별도 그룹으로 유지하며, oracle이 없는 기능은 OBSERVED로만 표시한다.
- 첫 본편 Driving Event `EVENT-STOPPED-VEHICLE-001`을 repair 후 recovery race에 연결했다.
- 정차 차량은 실제 Rapier collider와 동일 pose의 visual actor이며, 안전 통과 또는 실제 contact를 판정한다.
- 충돌 시 `+3.0 s`는 race/sector/PB에만 반영되고 engineering verdict에는 영향을 주지 않는다.
- 후속 상세 설계는 `docs/gameplay_redesign/RACING_AND_INVESTIGATION_IMPLEMENTATION_BLUEPRINT.md`를 따른다.
