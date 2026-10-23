# TRACKBACK V2 제품·UX 청사진

> **2026-10-18 이전 설계 기록:** 독립 프로젝트 전환에 따라 현재 source of truth는 `trackback-v2/docs/PRODUCT_ARCHITECTURE.md`다. 이 문서는 기존 프로토타입 분석과 설계 결정의 이력으로만 유지한다.

> 목표: 현재 프로토타입의 기술 자산과 시각 언어를 살리되, 하나의 사건을 재미있고 납득 가능한 게임 루프로 재구성한다.

## 1. 제품 정의

TRACKBACK V2는 **실도로형 검증 주행 중 차량 이상을 체감하고, 사건 기록에서 단서를 찾아 가설을 시험하고, 수리 후 같은 구간을 다시 달려 정상화를 확인하는 차량 검증 어드벤처**다.

플레이어 판타지는 하나다.

> 고양이 드라이버의 검증 파트너가 되어, 주행 미션을 완수하고 차의 이상을 조사해 다시 안전하게 달리게 한다.

교육은 별도 강의가 아니라 다음 행동의 결과로 발생한다.

```text
운전해서 기능 사용
→ 이상을 체감
→ 사건 장면 비교
→ 정상/이상 경계 발견
→ 가설을 구분하는 시험
→ 수리
→ 같은 조건 재주행
```

### "현재 UI 유지"의 범위

유지할 것은 기존 조사실의 게시판형 정보 배치가 아니라 TRACKBACK의 시각 언어다.

- 유지: 베이지·민트 계열 색감, 둥근 카드, 종이·스탬프 질감, 고양이 운전자와 정비소, 차량·맵 렌더링, 친근한 문장 톤
- 재설계: 상시 3열 패널, Page 1~4 탭, 모든 단서와 기술 정보를 한 화면에 노출하는 방식
- 새 원칙: **한 장면에 질문 하나, 판단 하나, 기본 CTA 하나**
- 주행 장면은 운전자 시점의 감각을 강화하되 1주 MVP에서는 새 3D 실내 모델을 만들지 않는다. 기존 주행 카메라 위에 steering/pedal/gear 입력을 보여주는 cockpit overlay를 얹는다.

즉, 외형의 정체성은 이어가고 정보 구조는 사건 중심으로 다시 만든다.

## 2. 재미 설계에서 가져올 패턴

### 지그재그 배달형 미니게임에서 가져올 것

- 지도 위에 명확한 목적지가 있다.
- 조향·제동이 목적 달성을 위한 수단이다.
- 정적 장애물과 동적 차량이 경로 선택을 만든다.
- 빠르기와 안전 운전을 동시에 점수화한다.
- TRACKBACK 적용: "검증 장비/로그를 다음 시험 지점에 전달" 또는 "지정 검증 구간 통과"라는 짧은 주행 계약을 준다.

### KartRider 계열에서 가져올 것

- 짧은 트랙, 명확한 순위/시간, 반복해서 더 잘할 수 있는 조작 숙련
- Speed와 Item처럼 서로 다른 재미 규칙을 분리
- TRACKBACK 적용: 경쟁 아이템은 넣지 않고, sector/PB/clean run으로 숙련을 만든다. 고장 사건은 모든 주행에 난입하는 랜덤 방해가 아니라 episode에서 설계된 단 한 번의 변곡점으로 사용한다.
- 공식 소개에서도 Time Attack, Item Mode, Speed Mode를 서로 다른 진입 난이도와 숙련 규칙으로 구분한다: https://pdf.irpocket.com/C3659/BbNL/gfXW/NGyg.pdf

### Mario Kart에서 가져올 것

- 즉시 읽히는 코스, 강한 위치 피드백, 실패 후 빠른 복귀, 초보자 보조
- TRACKBACK 적용: 도로·차선·표지로 경로를 읽게 하고, 경로 이탈 시 긴 메뉴 대신 즉시 safe reset을 제안한다. 첫 episode에는 steering assist/속도 제한을 선택적으로 제공한다.
- 아이템과 Battle Mode처럼 변형 규칙을 별도 모드로 둔다는 점만 참고한다. 캐릭터·아이템·시각 정체성은 복제하지 않는다: https://mariokart8.nintendo.com/

### Crazy Taxi에서 가져올 것

- 목적지와 제한 시간이 운전을 단순 이동이 아니라 임무로 바꾼다.
- 좋은 수행이 다음 플레이 시간을 벌어주는 명확한 보상 고리가 있다.
- TRACKBACK 적용: 검증 구간 도착, 안전 점수, target time을 결합하되 조사 시간은 별도 기록한다. 조사 때문에 engineering verdict가 바뀌지 않도록 분리한다.

### BeamNG.drive에서 가져올 것

- 실제 물리와 AI traffic이 같은 공간에서 시나리오를 만든다.
- freeroam 안에서 mission을 시작하고, 난이도별 scenario를 제공한다.
- TRACKBACK 적용: 정차 차량, lead brake, 신호 교차로를 장식이 아닌 collider와 state machine을 가진 Driving Event로 만든다.
- BeamNG의 공식 문서는 다중 차량 AI/traffic과 freeroam mission 구조를 별도 gameplay system으로 설명한다: https://www.beamng.com/game/support/portal/gameplay/ai-traffic/ , https://www.beamng.com/game/news/patch/beamng-drive-v0-24/

## 3. V2 핵심 루프

```text
1. JOB CARD
   오늘의 검증 주행 목적과 보상
2. DRIVE
   60~90초, 2~3개 Driving Event
3. INCIDENT
   기능 사용 중 실제 증상 발생
4. RECAP
   사건 전 3초 / 사건 후 3초, 입력·환경·반응
5. CLUE 1 — PHENOMENON
   무엇이 실제로 일어났나
6. CLUE 2 — BOUNDARY
   어디까지 정상이고 어디부터 다른가
7. CLUE 3 — PROOF
   어떤 시험이 두 가설을 구분하는가
8. REPORT
   위치 + 유형 + 근거 3장
9. REPAIR
   짧은 수리 연출과 회귀시험
10. RE-DRIVE
    같은 구간, Before ghost와 동일 목표
11. RESULT
    주행 / 조사 / 수리 결과를 분리 표시
```

한 episode의 목표 시간은 첫 플레이 8~12분이다. 레이스 2분, 조사 4~7분, 수리·재주행 2분을 기준으로 한다.

## 4. Episode 01 — 힘이 안 나와!

### 주행 미션

고양이 운전자가 판교 검증 루프의 세 지점에 테스트 로그를 전달한다.

- Event A: 출발 게이트 — 저속 차선 유지
- Event B: 곡선 진입 — 속도와 조향 균형
- Event C: 가속 확인 구간 — 제한 시간 안에 다음 marker 도달
- 사건: Event C에서 accelerator input은 있지만 차량 가속이 기대보다 약해 target delta가 벌어진다.

현재 CASE-PT-001의 scaling fault는 Event C에서만 체감되도록 연결한다. "그냥 달리다 5초 후 고장"이 아니라 "가속 성능을 써야 하는 임무에서 성능 부족이 드러남"으로 바꾼다.

### 사건 리캡

기본 화면에는 세 줄만 표시한다.

```text
운전자 요청     가속 페달 62%
당시 조건       D · DRIVE READY · 완만한 직선
차량 반응       속도 증가가 작아 목표 지점 +2.4초 지연
```

버튼은 `사건 장면 다시 보기`와 `첫 단서 기록` 두 개다. 전체 신호 표와 기술 ID는 펼치기로 숨긴다.

### 조사 퍼즐

#### Clue 1 — 현상

질문: "운전자가 요청하지 않은 것인가, 차량이 충분히 반응하지 않은 것인가?"

- 선택 가능한 카드: accelerator input, gear/ready, speed response
- 정답 행동: 요청과 실제 반응을 함께 evidence로 저장
- 학습: 증상은 root cause가 아니라 조사의 출발점

#### Clue 2 — 경계

질문: "어디까지 정상이고 어디부터 달라졌나요?"

- 기본 subgraph만 노출: Driver Input → Propulsion Request → Torque Request → eDrive Command → Vehicle Response
- 전체 74개 기능 지도는 `전체 차량 지도` 보조 메뉴로 이동
- 플레이어는 Last Known Normal과 First Known Abnormal을 각각 한 장 선택
- normal evidence도 clue board에 남긴다.

#### Clue 3 — 증명

질문: "입력이 달라도 같은 비율로 작아지는지 확인하면 어떤 가설을 구분할 수 있을까요?"

- 기본값: 45 Nm, 90 Nm 두 입력
- player-facing 선택: `같은 조건에서 입력만 바꾸기`
- 기술 상세: Requirement Analysis, precondition, monitor, oracle
- 결과: 두 FAIL이 같은 ratio를 보이면 incorrect scaling 가설을 지지
- 문구: "이 시험은 eDrive 출력이 기준을 위반함을 보여줍니다. 코드 원인을 직접 증명하지는 않습니다."

### 수리와 재주행

- repair choice는 세 개를 유지하되 쉬운 결과 예측을 먼저 보여준다.
- 올바른 수리 후 기존 regression suite를 실행한다.
- 같은 Event C safe spawn에서 재주행한다.
- 좌측에 Before ghost 또는 before speed trace, 우측에 current trace를 작게 표시한다.
- 성공 기준: 같은 입력 구간에서 target checkpoint delta 개선 + regression PASS

## 5. 화면 구조

### Screen A — Job Brief

- episode 제목
- 오늘의 주행 목적 한 문장
- 예상 사건 수는 노출하지 않음
- 조작법 3개
- 보상: badge/sticker preview
- CTA: `검증 주행 시작`

### Screen B — Drive HUD

기본 노출은 다섯 개로 제한한다.

1. 현재 목적지/Driving Event
2. route arrow/minimap
3. speed
4. sector time 또는 target delta
5. 사건과 관련 없는 안전 피드백

accelerator/brake/steering raw 값, manual page, provenance는 개발 HUD 또는 pause detail로 이동한다.

### Screen C — Incident Recap

- 3D/canvas 또는 6초 loop
- 운전자 의견
- 요청/조건/반응 세 카드
- 사건 위치와 Driving Event
- CTA 1개: `기록을 들고 정비소로`

### Screen D — Investigation Chapter

조사실은 게시판형 workspace가 아니라 사건을 한 장면씩 푸는 추리 chapter로 바꾼다. 상단의 Page 1~4 탭도 없앤다. 진행 중인 질문에 맞춰 도구가 등장하고, 답하면 다음 장면으로 전환된다.

```text
사건 재생: 무슨 일이 있었나?
→ 입력 확인: 운전자는 무엇을 요청했나?
→ 경로 추적: 그 요청은 차 안에서 어디로 갔나?
→ 경계 찾기: 어디까지 정상이고 어디부터 달랐나?
→ 검증 설계: 어떤 시험이 가설을 가르나?
```

- 사건 재생: 운전자 시야/차량 장면과 요청·조건·반응만 표시
- 입력 확인: steering wheel, accelerator, brake, gear를 시각 계기로 표시
- 경로 추적: Episode 01에 필요한 5개 node만 화면 중앙에 표시
- 경계 찾기: 선택한 두 node의 Actual/Expected만 비교
- 검증 설계: 조건·변경 입력·관찰 출력·예상 결과만 표시
- 단서 보드는 항상 열려 있지 않고 우측 상단의 `단서 2/3` 버튼으로 펼친다.
- 전체 차량 구조와 기술 ID는 `차량 X-Ray` 선택 메뉴로 분리한다.

첫 회차는 guided mode로 순서를 안내한다. Episode 01을 완료하면 같은 도구를 자유롭게 오가는 investigator mode를 해금할 수 있다. 이는 실무 사고과정을 가르치면서도 고정된 Page 순서를 제품 규칙으로 굳히지 않기 위함이다.

### Screen E — Hypothesis Lab

기본 화면은 다섯 블록만 쓴다.

```text
가설
조건
변경할 입력
관찰할 출력
[시험 실행]
```

설계 기법은 플레이어 행동으로 표현한다.

| 플레이어 문구 | 기술 표현 |
|---|---|
| 같은 구간의 대표값 비교 | Equivalence Class |
| 경계 바로 안/밖 비교 | Boundary Value |
| 실제 사건 조건 재현 | Requirements-based / Reproduction |
| 의심 지점에 오류 넣기 | Fault Injection |

### Screen F — Report / Repair / Re-drive

- root cause location
- failure type
- clue 3장
- 제출
- 수리 컷신 5~8초
- regression result 요약
- same-event re-drive

## 6. 정보 계층

### Layer 1 — 게임 언어

- 가속 요청
- 구동 명령
- 실제 차량 반응
- 센서가 가려짐
- 경고가 계속됨

### Layer 2 — 조사 근거

- signal name
- Actual / Expected
- timestamp
- producer / consumer
- requirement condition

### Layer 3 — 기술 상세

- canonical ID
- C/WASM source
- source path/row
- approval/provenance
- interface capability

기본 화면의 판단에 필요하지 않은 정보는 Layer 2 또는 3에 둔다.

## 6-1. 자동차 도메인 학습 구조

자동차 구조는 거대한 아키텍처 한 장을 먼저 보여주지 않는다. 현재 사건에서 출발해 세 단계로 확대한다.

1. **Domain** — Driver/Environment, Sensing/State, Propulsion, Braking, Steering, ADAS, Motion, Vehicle Plant
2. **Function** — 예: Accelerator Input → Propulsion Function → Vehicle Motion Coordination → eDrive → Vehicle Dynamics
3. **Logic** — precondition → input → decision/calculation → output → physical response

`차량 X-Ray`의 기본 동작은 다음과 같다.

- 현재 사건의 경로만 선명하게, 이웃은 흐리게, 나머지 domain은 접어서 표시한다.
- node 선택 시 Domain → Function → Logic으로 zoom한다.
- 현재 선택 node의 producer, consumer, input, output을 화살표 위에 표시한다.
- Actual과 Expected의 차이는 최초로 달라진 경계에서만 강조한다.
- 각 단계에 `이 단서가 중요한 이유`를 한 문장으로 보여준다.
- `전체 차량 지도`는 학습용 자유 탐색 화면이며 사건 해결의 필수 단계가 아니다.

검증 실무 사고는 다음 trace로 학습시킨다.

```text
증상·환경
→ 재현 조건과 사건 기록
→ 관련 차량 domain 좁히기
→ function chain 추적
→ input/state/output 비교
→ requirement로 Expected 설정
→ 경쟁 가설 만들기
→ 가설을 구분하는 test
→ evidence 기반 결론
→ 수정 후 regression과 동일 조건 재검증
```

이 구조는 단순 자동차 백과가 아니다. 플레이어가 왜 그 architecture를 보고, 왜 그 signal을 비교하고, 왜 그 test를 실행하는지 사건 안에서 납득시키는 것이 목적이다.

## 7. `docs/reference` 활용 원칙

참고 PDF는 운전자 관측 사실과 사용 조건의 근거다. ECU 구조, CAN ID, DTC, 내부 신호명을 만들어내는 근거로 사용하지 않는다.

### Source badge

| Badge | 의미 | 예 |
|---|---|---|
| OWNER MANUAL FACT | 매뉴얼이 직접 설명한 운전자 관측 사실 | DRIVE READY, 기어 표시, TPMS 점등 패턴 |
| TRACKBACK RUNTIME FACT | 현재 코드가 실제 실행·기록한 값 | AcceleratorPedalPosition, EDriveCommand, Rapier speed |
| SIMULATION ASSUMPTION | 게임을 위해 만든 수치·모델 | 180/130 Nm, 0.5 m/s interlock threshold |
| DESIGN ONLY | 실행·oracle이 없는 reference 설계 | 다수 canonical logical function |

### 매뉴얼 기반 episode 후보

1. TPMS 저압 vs TPMS 시스템 이상
   - 저압: 경고등 지속 + 개별 타이어 위치/압력
   - 시스템 이상: 경고등 약 1분 점멸 후 지속 + 위치 표시 소실 가능
   - 환경 오인 후보: 저온, 전파 간섭, 체인, 외부 전자기기
   - 장점: 관찰 패턴으로 원인을 구분하는 초보 친화 퍼즐
2. 센서 가림 vs 실제 ADAS 고장
   - 눈·비·안개·오염으로 일시 제한될 수 있고, 오염 제거 후 복구 가능
   - "경고가 곧 부품 고장"이라는 오개념을 교정
3. 회생 제동 제한 조건
   - SOC 100%, SCC, terrain/DBC, 미끄러운 노면, 경사 등 조건 분기
   - 구현 난도가 높아 P1 이후
4. DRIVE READY / power-down
   - 표시가 꺼짐/점멸, 출력 제한, 저SOC·온도·구동계 보호를 분리

### Case authoring 필수 필드

```text
sourceClaims[]
  sourceType
  document
  manualPage / pdfPage
  claim

runtimeModel
  executedComponents
  observations
  limitations

assumptions[]
oracle
  source
  criterion
  tolerance

gameplay
  drivingEvent
  playerDecision
  failureExperience
  repairExperience
```

## 8. 범위 밖

- OEM ECU/CAN/DTC 재현 주장
- 실제 운전자 보조 성능 또는 안전 시험 대체
- 보행자 대상 FCA/AEB 시험
- 대규모 open-world traffic AI
- 멀티플레이/아이템전
- 74개 기능 전체를 한 episode에 노출
- 모바일 운전 조작 완성
- 코인 상점과 대규모 꾸미기 시스템

## 9. 성공 기준

- 첫 플레이어가 30초 안에 현재 목표를 말할 수 있다.
- 사건 발생 이유를 "가속을 써야 하는 구간에서 출력 부족이 드러났다"고 설명할 수 있다.
- 조사 각 단계에서 기본 CTA가 하나다.
- root cause 제출 전 단서가 정확히 3장 보인다.
- 재주행에서 Before/After 차이를 직접 체감한다.
- 기술 상세를 한 번도 열지 않아도 episode를 완료할 수 있다.
- 기술 상세를 열면 모든 claim의 provenance를 확인할 수 있다.

