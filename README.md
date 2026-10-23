주제 : 고장 난 고양이 운전자의 차를 함께 조사하고, 실제 차량 검증 방식으로 원인을 찾고, 수리해서 다시 달리게 해주는 아기자기한 자동차 검증 어드벤처

cf)
- 요구사항 기반 사고는 전 과정에 걸쳐 쓰되, 계층별로 노출 시점을 다르게
- 실제 디버깅에서는 증상, 로그, 신호, 상태, 인터페이스, 코드/모델, 환경 등을 통해 원인을 좁히고, 요구사항은 특히 “이 동작이 정말 이상한가?”, “원래 무엇을 해야 하는가?”를 판단하는 기준 -> 증상 기반 조사 + 아키텍처 기반 localization + 요구사항 기반 판단 + 시험 기반 검증
fault case
```
Case A: Signal mismatch
Case B: Invalid State
Case C: Interface fault
Case D: Requirement violation
Case E: Timing fault
```

<플레이어의 추론 흐름>
```
무슨 일이 생겼지?
↓
그때 내가 뭘 요청했지?
↓
차는 실제로 어떻게 반응했지?
↓
그 반응을 만드는 바로 앞 단계는 뭐지?
↓
거기 들어간 값은 정상인가?
↓
나온 값은 정상인가?
↓
입력까지 정상인데 출력부터 이상한가?
↓
그 값이 왜 이상하다고 말할 수 있지?
↓
그럼 이 기능을 의심해볼 수 있나?
↓
의심이 맞다면 다른 조건에서도 같은 문제가 보여야 하나?
↓
시험해보자
↓
시험 결과가 내 가설을 얼마나 지지하지?
↓
내가 확보한 근거로 어디까지 결론낼 수 있지?
```

```
┌──────────────────────────┐
│          DRIVE           │
│        주행 / 미션        │
└────────────┬─────────────┘
             ↓
        차량 이상 발생
             ↓
┌──────────────────────────┐
│        INVESTIGATE       │
│        사건 조사          │
└────────────┬─────────────┘
             ↓
┌──────────────────────────┐
│          VERIFY          │
│        가설 시험          │
└────────────┬─────────────┘
             ↓
┌──────────────────────────┐
│          REPAIR          │
│      수정 / 조치 선택      │
└────────────┬─────────────┘
             ↓
┌──────────────────────────┐
│       DRIVE AGAIN        │
│       재주행 검증         │
└────────────┬─────────────┘
             ↓
      성공 / 다음 사건
```



<개념>
실제 디버깅에서는 증상, 로그, 신호, 상태, 인터페이스, 코드/모델, 환경 등을 통해 원인을 좁힘 
ㄴ 검증에서는?
* 요구사항은 '이 동작이 정말 이상한가? 원래 무엇을 해야하는가?' 를 판단하는 기준으로 중요 
증상 기반 조사 + 아키텍처 기반 localization + 요구사항 기반 판단 + 시험 기반 검증


요구사항의 계층적 구조
계층성
traceability
allocation
verification link
ID uniqueness



<게임 진행 루프>
@ 고양이 운전자 + 정비소 + 차량 검증 세계관
주행 [Drive : 고양이와 주행 미션]
→ 고장 발생 [Fault : 차량 이상 + 캐릭터 반응 -> Talk : 짧은 대화로 현재 문제 전달]
→ 고양이 반응/사건 접수 [Mission : 조사 목표 전달]
→ 단서 수집/조사 [Investigation Tool : Page 1~4]
→ 가설 [Clue Found : 단서 + 캐릭터 반응 + 노트 갱신]
→ 시험 [Hypothesis / Test]
→ 결론/성공 및 실패 피드백 [Case Success, Failed]
→ 수리 [PIT Repair : 엔지니어 고양이 수리]
→ 재주행 검증 [Re-Drive : 같은 구간 재주행 / 정상화 확인]
→ 보상 [Reward : 코인/스티커/배지]

* 단, 실제 검증/진단 흐름은 좀 더 넓은 범위
```
고장 현상 확인
 ↓
차량 기능 관점에서 문제 영역 추정
 ↓
아키텍처 구조 확인
 ↓
요구사항 확인
 ↓
입력/상태/출력 관계 확인
 ↓
인터페이스 영향 확인
 ↓
신호 분석
 ↓
시험으로 가설 검증
 ↓
결론
```



<캐릭터 역할 분리>
- 운전자 고양이 : 플레이어의 아바타 (주행 드라이버)
- 엔지니어 고양이 : 기술 정보 전달 담당 (원인 조사 가이드, 피트크루 수리)
- 조사 노트 / 시스템 : 정확한 기술 정보 담당 

<플레이어 문제풀이 흐름>
* 행동에 대한 피드백이 필요 
읽기
→ 선택
→ 발견
→ 반응
→ 다음 목표

<페이지 구성>
# 게임요소 페이지 구성 대체 아이디어 (확정X)
| 기존 | 게임화 역할 |
|---|---|
| Page 1 | 사건 보고서 |
| 기능 흐름 | 조사 지도 |
| Signal Monitor | 신호 탐지기 |
| Interface | 연결 추적 도구 |
| Requirement | 정비 매뉴얼 |
| Evidence | 조사 노트 / 단서 |
| Page 3 | 시험실 |
| Page 4 | 사건 보고서 제출 |
| 3D viewport | 사건 기록 / 시험 반응 |
| timeline | 블랙박스 기록 |
| repair runtime | 피트 수리 |
| normal race | 재주행 검증 | 



1. <fault event>
- 고양이 운전자의 주행 (인트로 주행)
- 문제 발생 

2. <Investigation mission layer>
<page1> # 사건 브리핑 카드 
* 목표 : 무슨 현상이 발생했는지 확인하세요.
- 현상 요약 (사건 요약-case 번호, 한줄 설명, 운전자 진술)
- 입력 / 상태 / 반응 (실제 관측된 현상-요청,결과,발생조건)
- 조사 범위 안내 (차량 반응까지 연결되는 흐름-driver input -> vehicle state and mode -> control function -> actuation -> vehicle response)
- 상세 관측 정보 (input, state, ouput, signal, timestamp)

<page2> 정비소 조사 데스크 
* 조사 노트 : 단서를 저장 [조사 노트에 붙이기]
```
┌──────────────────┐
│ 🔎 단서 #03       │
│                  │
│ EDriveCommand    │
│ 기대값과 차이 발견 │
└──────────────────┘
```
<page2.1> # 기능 흐름 
* 목표 : 차량 반응에 관련된 기능 경로를 찾으세요.
- 전체 아키텍처 구조 
- 현재 선택 기능
- 인접 기능 

<page2.2> # 신호 모니터링
* 목표 : 입력은 정상인데 출력부터 달라지는 지점을 찾으세요.
- 현재 기능
- 상태/입력/출력 그룹
- 현재 선택 신호 그래프

<page2.3> # 인터페이스
- source /signal / destination
- 지원 여부 / 상세 구조 정보 

<page2.4> # 요구사항 -> 정비 매뉴얼 / 기술 책 
* 목표 : 원래 어떤 동작이 나와야 하는지 확인하세요.
@ 고양이가 책장에서 매뉴얼을 꺼내는 애니메이션으로 인트로 구성  
- 이 기능이 어떻게 동작해야하는지 설명 
- when / what (및 where / how verified / trace tree / tc)
cf) - 조건
- 기대 동작
- 계층/부모·자식
- 할당 기능
- 관련 검증 관계

현상
→ 아키텍처
→ 상태/입력/출력
→ Requirement
→ 가설

<page3> # 테스트
* 목표 : 가설이 맞는지 시험하세요.
@ 실험실 느낌으로 구성(Preconditions, Input, Expected, Actual, TC -> 작은 시험대)
- 현재 가설
- 입력/조건
- 실행
- 결과 
- linked requirement / tc metadata / 해석 
cf) 도메인 선택
기법 선택
기능 선택
신호 선택
입력 profile 선택
expected 설정
관찰대상 선택    형식은 너무 복잡해서 기각 -> 가설 컨텍스트를 먼저 가져오고, 방법을 선택한 다음 필요한 설정만 노출
-> CONSTANT
STEP
RAMP_UP
RAMP_DOWN
PULSE
SEQUENCE
```
가설을 세운다
↓
검증 방법을 고른다
↓
테스트 설계기법을 고른다
↓
입력 조건을 만든다
↓
Expected 기준을 정한다
↓
시험한다
↓
결과를 해석한다
↓
필요하면 추가 시험한다

가 되는 거야.
```


<page4> # 결론 제출 
* 목표 : 근거를 바탕으로 결론을 제출하세요.
@ 사건 보고서 작성으로 구성 (원인 위치, 문제 유형, 단서 선택 -> 결론 작성 후 보고서 제출) 

3. <result feedback>
- 정답(Success), 오답(Fail->원인 단서 찾아서 해결해나가는 흐름 보여주기) 
@ 도장 찍기 -> 피트크루 엔지니어 고양이 호출 후 차량 수리 -> REPAIRED! -> 운전자 고양이 재주행  

4. <repair & replay>
- 정답 시 엔지니어 고양이 수리 화면 애니메이션 
- 재주행
- 성공 시 보상 




<구현 예정>
Phase 1 — Investigation Core
거의 완료


Phase 2 — General-purpose Test Workbench
Phase 3 — Advanced Verification Runtime
Phase 4 — Gameplay / Visual Experience Audit
Phase 5 — Character / Cozy Interaction
Phase 6 — Repair + Re-drive
Phase 7 — Reward / Progression

<Typography Token>

```
DISPLAY / LOGO
별도

PAGE TITLE
24px

PAGE LEAD / MAIN QUESTION
16px

SECTION TITLE
14px / semibold

BODY
13px

SECONDARY BODY
12px

TECHNICAL ID
12px / monospace or technical font

CAPTION / META
11px

BUTTON
12px

TOOLTIP
11px
```



TODO
* 요구사항에 따라 사용되는 신호명 -> 이게 아키텍처적으로 어떻게 구성되는지, 다른 도메인까지는 어떻게 영향이 가는지 등도 다시 확인하기 
* 도메인 관련 개념 정의해야할 게 뭔지 추출하기 (아키텍처, 인터페이스, 기능, 요구사항 등)
* 게임적 동기 / 감정적 피드백 / 루프 완결감 보완
* 아키텍처 지도를 기반으로 한 gui 구성 

cf) 3. 가설검증(테스트) 프롬프트
```
Page 2에서 Investigation Context를 가져온다.

Investigation Context:
- current domain/scope
- hypothesis target type
- hypothesis target
- observed reason
- relevant signals/interfaces/states
- relevant requirements

↓

현재 가설에 사용할 수 있는
SUPPORTED VERIFICATION METHODS를 제시한다.

↓

선택한 방법에 따라
필요한 설정 UI만 나타낸다.

↓

Requirement가 적용 가능하면
precondition / Expected / valid criterion을
시험 설정 후보로 가져온다.

↓

플레이어가
Stimulus / Fault / Boundary / State Condition / Monitor
중 해당 방법에서 필요한 항목을 설정한다.

↓

실행 가능한 runtime에 맞춰 Simulation/Test를 수행한다.


taget type : FUNCTION
SIGNAL
INTERFACE
STATE_MODE
ACTUATION_PLANT
TIMING_EXECUTION
```


<tc 도출 핵심 기법 및 게임 적용 범위>
```
| 분류 | 의미 | TRACKBACK에서의 활용 |
|---|---|---|
| **Requirements Analysis** | 요구사항을 분석해 테스트 조건·Expected를 도출 | 요구사항 기반 테스트 |
| **Equivalence Class Analysis** | 같은 동작이 예상되는 입력 영역을 동등 클래스로 나눔 | 대표값 선택 |
| **Boundary Value Analysis** | 경계와 경계 인접값을 시험 | min/max 및 경계 오류 탐색 |
| **Error Guessing** | 경험/지식을 기반으로 오류 가능 조건을 시험 | 의심 조건 직접 구성 |



검증 목적 / 검증 방법
- Requirements-based Test
- Interface Test
- Fault Injection
- Back-to-Back

테스트 설계 기법
- Requirements Analysis
- Equivalence Class
- Boundary Value
- Error Guessing
```


<범용 test workbench>
```
1. 무엇을 검증할 것인가?
2. 어떤 방법으로 검증할 것인가?
3. 테스트 입력을 어떻게 설계할 것인가?
4. 무엇을 관찰할 것인가?
5. 무엇을 기준으로 판정할 것인가?
6. 실행
7. 결과 해석


1. target
DOMAIN_SCOPE
FUNCTION
SIGNAL
INTERFACE
STATE_MODE
ACTUATION_PLANT
TIMING_EXECUTION

2. verification method
Requirements-based Test
Interface Test
Fault Injection
Back-to-Back Comparison
State/Transition Test

3. test design technique
어떤 방식으로 테스트 조건을 만들까요?

○ Requirement Analysis
○ Equivalence Class
○ Boundary Value
○ Error Guessing
```

<workbench 최종 구조>
```
┌─────────────────────────────────────────────┐
│ TEST WORKBENCH                              │
│                                             │
│ Investigation Context                       │
│ Scope      Propulsion                       │
│ Target     eDrive                           │
│ Hypothesis 정상 입력에서 출력이 작게 생성됨 │
├─────────────────────────────────────────────┤
│ 1. Verification Method                      │
│ [Requirements] [Input Variation] [Boundary] │
├─────────────────────────────────────────────┤
│ 2. Test Design Technique                    │
│ [Requirement Analysis]                      │
│ [Equivalence Class]                         │
│ [Boundary Value]                            │
│ [Error Guessing]                            │
├─────────────────────────────────────────────┤
│ 3. Preconditions                            │
│ VehicleReady = TRUE                         │
│ Direction = FORWARD                         │
├─────────────────────────────────────────────┤
│ 4. Stimulus                                 │
│ DriveTorqueRequest                          │
│ [ STEP ]  90 → 50                           │
├─────────────────────────────────────────────┤
│ 5. Monitor                                  │
│ EDriveCommand                               │
├─────────────────────────────────────────────┤
│ 6. Oracle / Expected Basis                  │
│ SWR-PROP-...                                │
├─────────────────────────────────────────────┤
│               [ RUN TEST ]                  │
└─────────────────────────────────────────────┘
```
