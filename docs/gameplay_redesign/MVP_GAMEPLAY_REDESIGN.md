# TRACKBACK Gameplay MVP Redesign

## 0. 문서 목적과 변경 경계

이 문서는 현재 구현된 CASE-PT-001을 하나의 짧고 완결된 플레이 루프로 정리하기 위한 설계 문서다. 구현 문서가 아니며 런타임, C/WASM, Rapier, Reference Vehicle canonical data, CASE-PT-001 canonical truth, 테스트 및 `PRODUCT_REQUIREMENTS_RECONCILIATION.md`를 변경하지 않는다.

설계의 절대 조건은 다음과 같다.

- `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`의 모든 `IMPLEMENTED` 항목을 그대로 보존한다.
- 기존의 현상 확인, 구조 추적, Function Inspector, Signal Monitor, Interface 분석, Requirements, Verification Workbench, Fault Injection, Notes, Bookmarks, History, formal Verification Evidence를 제거하거나 의미를 바꾸지 않는다.
- 차량 동작과 검증 결과는 현재 VehicleSW, C/WASM, Rapier 및 저장된 실제 관찰에서만 가져온다.
- 차량 시나리오에 oracle이 없으면 `OBSERVED`로 표현하며 `PASS` 또는 whole-vehicle verification으로 승격하지 않는다.
- 게임 계층은 canonical engineering truth를 복사하지 않고 안정 ID와 실제 증거 참조만 보유한다.
- 새 고장, 새 차량 신호, 새 기준값, 새 물리 거동을 만들지 않는다.

## 1. 현재 상태 감사

### 1.1 검사한 실제 구현

현재 브라우저 실행 화면과 다음 구현 경로를 함께 대조했다.

- 중앙화된 게임 상태: `src/ui/state/navigation.ts`
- 애플리케이션 및 런타임 전환: `src/app/GameApplication.tsx`
- 주행 화면과 HUD: `src/ui/screens/RaceScreen.tsx`, `src/ui/components/RaceHUD.tsx`
- 사고 안내: `src/ui/components/IncidentDialogue.tsx`
- CASE-PT-001 정의와 실제 증거 규칙: `src/cases/propulsion/CaseDefinition.ts`, `src/cases/propulsion/PropulsionCase.ts`
- 조사 Pages 1–4와 통합 워크벤치 렌더 경로
- 회복 주행, 체크포인트, 타이머, 결과 보고서 렌더 경로

### 1.2 현재 자산의 판정

| 영역 | 현재 판정 | MVP에서의 처리 |
|---|---|---|
| 중앙 gameplay phase 상태 머신 | IMPLEMENTED | 그대로 재사용한다. 별도 로컬 phase machine을 만들지 않는다. |
| 실제 고장 발생과 incident capture | IMPLEMENTED | 현재 캡처 완료 이벤트를 게이트 진입 조건으로 사용한다. |
| Pages 1–4 조사 구조 | IMPLEMENTED | 역할을 명확히 하되 기능과 증거 의미는 유지한다. |
| Function/Signal/Interface/Requirement 조사 | IMPLEMENTED | Page 2의 추론 도구로 유지한다. |
| C/WASM component experiment | IMPLEMENTED | Proof gate의 실제 실행 근거로 사용한다. |
| 실제 vehicle scenario replay | IMPLEMENTED | 관찰과 component verdict를 구분해 유지한다. |
| evidence sufficiency 평가 | IMPLEMENTED | Proof gate가 기존 평가보다 약해지지 않도록 직접 연결한다. |
| repair variant와 실제 regression | IMPLEMENTED | Resolve 단계에서 재사용한다. |
| recovery drive, ordered checkpoints, timer, personal best | IMPLEMENTED | 수리 효과를 체감하는 최종 주행으로 재사용한다. |
| cat reaction과 짧은 피드백 | PARTIAL | 기존 반응을 이벤트에 연결하되 신규 아트 파이프라인은 만들지 않는다. |
| 조사 중 명확한 deduction progression | PARTIAL | 정확히 세 개의 evidence gate로 정리한다. |
| suspect 상태 요약 | MISSING | canonical ID를 참조하는 작은 UI 계층만 추가한다. |
| page focus guidance | PARTIAL | 숨김 대신 우선순위와 포커스 이동을 추가한다. |

현재 제품은 필요한 기술 기능 대부분을 이미 갖고 있다. MVP의 핵심 결손은 기능의 수가 아니라, 플레이어가 지금 무엇을 밝혀야 하고 어떤 근거로 다음 단계가 열렸는지를 이해시키는 연결 구조다.

## 2. 단순화된 핵심 루프

MVP의 전체 흐름은 다음 네 단계로 보인다.

1. **DRIVE — 이상을 직접 겪는다.** 현재 트랙의 안내 구간을 주행하고, 직선 가속 확인 구간에서 차량 반응 저하를 경험한다. 실제 incident trace가 유효하게 캡처된 뒤 조사실로 이동한다.
2. **INVESTIGATE — 어디까지 정상인지 좁힌다.** Page 1에서 현상을 증거로 고정하고, Page 2에서 출력에서 입력 방향으로 추적하여 마지막 정상 지점과 최초 이상 지점을 찾는다.
3. **VERIFY — 후보를 구분하는 시험을 한다.** Page 3에서 기존 C/WASM component experiment를 서로 다른 유효 입력으로 실행하고 formal evidence로 저장한다.
4. **RESOLVE — 결론, 수리, 재현 주행으로 닫는다.** Page 4에서 충분한 근거가 있을 때만 원인 결론을 제출하고, 실제 repair variant를 검증한 뒤 동일한 관련 조건을 포함하는 회복 주행과 체크포인트를 완주한다.

플레이어가 보는 짧은 표현은 다음과 같다.

> 주행에서 이상 발견 → 현상 확정 → 이상이 시작된 구간 추적 → 시험으로 입증 → 수리 → 같은 조건에서 다시 주행 → 사건 해결

## 3. CASE-PT-001의 구체적인 주행 목표

### 3.1 사고 전 목표

사용자에게는 아래 세 문장만 제공한다.

1. `D` 상태로 표시된 경로를 따라간다.
2. 직선의 **가속 반응 확인 구간**에서 브레이크를 밟지 않고 가속을 일정하게 유지한다.
3. 차량이 입력만큼 반응하는지 관찰한다.

내부 완료 조건은 새 기준을 만들지 않고 현재 CASE-PT-001 incident trigger와 캡처 상태를 그대로 사용한다. 현재 런타임이 요구하는 정상 노출, 지원되는 주행 상태, 가속·제동·조향·속도 조건 및 캡처 시간을 만족했을 때만 `FAULT_EVENT`로 전환한다. 화면의 구간 표시는 그 조건을 이해시키는 게임 표현일 뿐, 클릭이나 가짜 타이머로 사건을 발생시키지 않는다.

### 3.2 회복 주행 목표

수리 검증 성공 후에는 다음을 수행한다.

1. 짧은 카운트다운 뒤 실제 repaired runtime으로 출발한다.
2. 출발 직후 동일한 **가속 반응 확인 구간**을 통과한다.
3. 현재 구현된 4개의 ordered checkpoint를 순서대로 통과한다.
4. 모든 checkpoint 이후 실제 finish trigger를 통과한다.

component regression의 `PASS`와 차량 주행 관찰을 별도로 보여준다. 동일 조건의 vehicle observation에 공식 expected trajectory가 없으면 전후 관찰은 `OBSERVED`로만 표기한다. 회복 주행의 성공은 올바른 순서의 checkpoint와 finish crossing을 의미하며, 그 자체를 whole-vehicle certification으로 표현하지 않는다.

## 4. 정확히 세 개의 Evidence Gate

페이지를 열거나 탭을 클릭하는 것만으로는 어느 게이트도 완료되지 않는다.

### Gate 1 — PHENOMENON

- 플레이어 질문: **무엇이 잘못되었나?**
- 위치: Page 1
- 요구 행동:
  - 실제 incident interval과 차량 반응을 확인한다.
  - 현재 제공되는 incident observation을 formal evidence로 저장한다.
  - 현상을 `D 상태에서 가속 입력 대비 차량 가속 반응이 약함`의 관찰 수준으로 확정한다.
- 완료 근거:
  - 저장된 CASE-PT-001 incident evidence reference
  - canonical requirement의 존재 확인. requirement 자체를 actual verdict로 오해하지 않는다.
- 완료되지 않는 행동: Page 1 진입, 운전자 진술만 읽기, 요구사항 제목만 열기.

### Gate 2 — FAULT PATH

- 플레이어 질문: **정상 흐름이 어디에서 처음 달라졌나?**
- 위치: Page 2
- 요구 행동:
  - 실제 active path를 따라 출력에서 입력 방향으로 조사한다.
  - 최소 한 개의 정상 경계와 그 다음 이상 경계를 근거와 함께 선택한다.
  - `LAST KNOWN NORMAL → UNKNOWN REGION → FIRST KNOWN ABNORMAL`을 명시한다.
- CASE-PT-001의 정답 구조:
  - `LAST KNOWN NORMAL`: eDrive 이전에 전달되는 정상 명령 경계. UI는 현재 실제 boundary observation과 canonical signal ID를 통해 표기한다.
  - `UNKNOWN REGION`: eDrive 처리 구간.
  - `FIRST KNOWN ABNORMAL`: eDrive 출력 측에서 최초로 확인된 반복 가능한 차이.
- 완료 근거:
  - 선택된 두 boundary evidence reference
  - 선택한 구간과 모순되지 않는 active-path reference
- 완료되지 않는 행동: 아키텍처 박스 클릭, function 이름 선택, Signal Monitor 열기만 수행.

`LAST KNOWN NORMAL`과 `FIRST KNOWN ABNORMAL`의 구체적 표시명은 런타임이 반환하는 현재 boundary identity를 사용한다. 이 문서에 별도 수치나 복제된 진실 데이터를 두지 않는다.

### Gate 3 — PROOF

- 플레이어 질문: **어떤 시험이 이 후보를 다른 후보와 구분하는가?**
- 위치: Page 3
- 요구 행동:
  - 기존 eDrive C/WASM component experiment를 지원되는 유효·비포화 조건에서 실행한다.
  - 서로 다른 두 입력점의 결과를 formal evidence로 저장한다.
  - 두 입력에서 반복되는 동일한 비율 패턴을 확인한다.
- 완료 근거:
  - 기존 `PropulsionCase` evidence-sufficiency 평가가 충분하다고 판정한 formal evidence set
  - Expected/Actual 비교가 실제 component oracle에서 나온 경우에만 component verdict 사용
- 완료되지 않는 행동: 하나의 시험만 실행, 저장하지 않은 결과, vehicle viewport 관찰, Fault Injection 선택만 수행.

세 게이트가 모두 완료되어야 Page 4의 root-cause conclusion이 활성화된다. assisted solution은 동일한 실제 시험을 수행하되 해결 경로를 `ASSISTED`로 별도 기록한다.

## 5. Suspect System

### 5.1 상태 계약

후보는 다음 세 상태만 가진다.

- `POSSIBLE`: 현재 근거로 배제되지 않음
- `ELIMINATED`: 실제 저장 근거가 후보와 모순됨
- `SUPPORTED`: 현재 근거가 후보를 지지함

확률, 신뢰도 퍼센트, 색으로 암시되는 숨은 정답은 사용하지 않는다. 상태 변화에는 반드시 `EvidenceReference`가 연결되어야 한다.

### 5.2 CASE-PT-001 후보 요약

UI에는 세부 함수 목록을 과도하게 펼치지 않고 다음 5개 조사 후보를 보여준다.

| 후보 | 초기 상태 | 상태를 바꾸는 실제 근거 |
|---|---|---|
| 운전 상태/입력 해석 (`GearLogic`) | POSSIBLE | 지원되는 D 상태와 입력 해석에 대한 저장된 boundary/incident evidence가 일치할 때 ELIMINATED |
| 추진 요청 생성 (`PropulsionFunction`) | POSSIBLE | canonical requirement와 실제 요청 경계의 비교가 정상 흐름을 지지할 때 ELIMINATED |
| 토크 요청 계산 (`VMC`) | POSSIBLE | 실제 component/boundary 결과가 eDrive 입력까지 정상임을 지지할 때 ELIMINATED |
| 구동 명령 계산 (`eDrive`) | POSSIBLE | 서로 다른 유효 입력에서 동일한 반복 차이가 formal evidence로 확인되면 SUPPORTED |
| 하류 적용/차량 반응 (`DriveAdapter` / `VehiclePhysics`) | POSSIBLE | 현재 지원되는 동일 tick transfer/boundary 증거로 배제할 수 있을 때만 ELIMINATED. 차량 속도 관찰만으로는 제거하지 않음 |

상태 변경은 자동 정답 노출이 아니라 플레이어의 근거 선택에 대한 일관성 검사다. 아직 검증하지 않은 후보는 끝까지 `POSSIBLE`로 남을 수 있다.

## 6. Pages 1–4의 역할

### Page 1 — Incident / PHENOMENON

- 해야 할 일: 운전자 진술, 사건 조건, 실제 반응, incident trace를 읽고 현상을 관찰 문장으로 고정한다.
- 주요 산출물: incident evidence 1개, PHENOMENON gate 완료.
- 하지 않는 일: 내부 원인 추정, component 시험, PASS/FAIL 선언.

### Page 2 — Investigate / FAULT PATH

- 해야 할 일: 전체 구조 속 active path를 유지한 채 function, signal, interface, requirement를 이용해 마지막 정상과 최초 이상을 찾는다.
- 주요 산출물: boundary evidence, suspect 상태 변화, FAULT PATH gate 완료.
- 하지 않는 일: 전체 구조를 숨기거나 정답 함수만 강조, interface가 지원하지 않는 verdict 생성.

### Page 3 — Verify / PROOF

- 해야 할 일: 이미 좁힌 후보를 구분하는 component experiment를 설계·실행·저장하고, 필요하면 vehicle scenario로 적용 후 반응을 관찰한다.
- 주요 산출물: formal component evidence, PROOF gate 완료.
- 하지 않는 일: test method와 design technique 혼동, 하나의 입력으로 일반화, component PASS를 whole vehicle PASS로 표현.

### Page 4 — Resolve

- 해야 할 일: 세 게이트의 근거를 보고 root location과 failure type을 제출하고, 실제 repair variant를 선택·검증한 뒤 recovery drive로 이동한다.
- 주요 산출물: diagnosis status, repair verification result, recovery replay result.
- 하지 않는 일: 근거가 부족한 상태에서 정확한 내부 메커니즘 단정, 실패 repair를 건강한 variant로 자동 전환.

## 7. Focus Guidance UX

### 7.1 원칙

사용자가 모든 engineering context에 계속 접근할 수 있도록 유지하면서, 현재 질문에 필요한 순서만 명확하게 한다.

- `PRIMARY_FOCUS`: 현재 게이트를 완료하는 직접 행동. 정상 대비, 최소한의 강조 테두리와 짧은 동사형 안내를 사용한다.
- `CONTEXT`: 판단에 필요한 주변 정보. 그대로 읽고 조작할 수 있지만 시각적 대비를 한 단계 낮춘다.
- `BACKGROUND`: 현재 답변에는 직접 필요하지 않은 정보. 더 낮은 대비를 적용하되 숨기거나 비활성화하지 않는다.

포커스 이동 시 해당 요소가 고정 header와 하단 bar에 가리지 않도록 `scrollIntoView` 후 안전 여백을 둔다. 자동으로 연속 진행하지 않는다. 사용자가 `다음`을 눌러 한 단계씩 이동한다. red-pencil annotation을 사용한다면 현재 target 위에만 그리며, 도움말 패널을 제외한 최상위 UI layer에 배치하고 다음 단계에서 제거한다.

### 7.2 Current Question

항상 한 문장만 표시한다.

- Page 1: `입력에 비해 실제 차량 반응이 어떻게 달랐나요?`
- Page 2: `마지막 정상 출력과 최초 이상 출력은 어디인가요?`
- Page 3: `이 후보를 다른 후보와 구분하려면 어떤 두 조건을 비교해야 하나요?`
- Page 4: `수집한 근거가 어느 원인 위치와 문제 유형을 지지하나요?`

중복되는 mission hint, page subtitle, guided tooltip이 같은 질문을 반복하면 하나만 유지하고 나머지는 `REMOVE_ONLY_IF_DUPLICATE`로 처리한다.

## 8. 실제 UI 요소 감사 및 처리 분류

| 현재 요소 | 분류 | 설계 처리 |
|---|---|---|
| 상단 Pages 1–4 navigation | KEEP_AND_HIGHLIGHT | 현재 page뿐 아니라 해당 gate 상태를 작은 완료 표식으로 보여준다. |
| 좌측 조사 패널 접기/펼치기 | KEEP | 접근성과 작업 공간을 모두 보존한다. |
| 사건 요약/진행/메모/근거 패널 | SIMPLIFY_LAYOUT | 진행도를 세 gate로 바꾸고 기존 notes/evidence 기능은 유지한다. |
| 중복 Mission 힌트/현재 질문 | REMOVE_ONLY_IF_DUPLICATE | 한 화면에 같은 질문은 한 번만 표시한다. |
| Page 1 사건 제목·증상·운전자 진술 | KEEP | 관찰 맥락으로 유지한다. |
| Page 1 canonical requirement | KEEP_AND_HIGHLIGHT | 기준과 실제 관찰이 다름을 라벨로 명확히 한다. |
| Page 1 vehicle-response 표/trace | KEEP_AND_HIGHLIGHT | Gate 1의 직접 근거로 올린다. |
| Page 1 긴 metadata/trace detail | DIM_WHEN_NOT_RELEVANT | 기본 정보는 보이게 두고 긴 개발자 상세만 명시적 확장 영역으로 둔다. |
| Page 2 전체 architecture/context map | KEEP | 전체 맥락은 항상 접근 가능하다. |
| Page 2 active path | KEEP_AND_HIGHLIGHT | 현재 조사 지점과 upstream/downstream을 강조한다. |
| Page 2 domain cards | KEEP_AND_HIGHLIGHT | domain을 선택 가능하게 하고 역할과 내부 function 흐름을 함께 보여준다. |
| Page 2 current function/signal/path summary | SIMPLIFY_LAYOUT | 하나의 둥근 외곽 컨테이너와 직선 세로 구분선으로 합친다. |
| Function Inspector | KEEP_AND_HIGHLIGHT | 후보 상태와 boundary 근거 연결의 중심 도구로 사용한다. |
| Signal Monitor | KEEP_AND_HIGHLIGHT | signal identity와 관찰 범위를 그대로 보존한다. |
| Interface analysis | KEEP | 지원 여부와 comparable semantics를 유지한다. |
| Requirements view | KEEP | meaning/pedigree/map을 유지한다. |
| 조사와 무관한 전체 map branch | DIM_WHEN_NOT_RELEVANT | 숨기지 않고 낮은 대비로 유지한다. |
| Page 3 현재 범위/가설 카드 | MOVE_WITHIN_PAGE | 한 줄 compact context rail로 워크벤치 바로 위에 둔다. |
| 통합 검증 워크벤치의 중복 제목/설명 | REMOVE_ONLY_IF_DUPLICATE | method/technique 의미는 유지하되 같은 설명을 두 번 렌더하지 않는다. |
| Component/Model Test | KEEP_AND_HIGHLIGHT | Proof gate의 기본 실행 경로다. |
| Vehicle Scenario | KEEP | component 이후의 적용/관찰 단계로 한 흐름에 배치한다. |
| 동시에 펼쳐진 두 대형 workbench | SIMPLIFY_LAYOUT | `조건 → 실행 → 결과 저장 → 차량 적용 관찰`의 한 workflow로 재배치한다. 요약은 항상 남긴다. |
| Test Design Technique 설명 | MOVE_WITHIN_PAGE | 선택한 기법의 짧은 설명만 조건 편집 옆에 표시한다. |
| Time profile/monitor 조건 | KEEP | 용어 설명과 적용 결과를 인접 배치한다. |
| 차량 viewport | MOVE_WITHIN_PAGE | page container 안에서 clip하고 sticky header/footer보다 낮은 layer를 보장한다. |
| Page 4 evidence/conclusion form | KEEP_AND_HIGHLIGHT | 세 gate 완료 뒤 활성화한다. |
| 자동으로 모든 evidence를 결론 근거로 묶는 표현 | SIMPLIFY_LAYOUT | gate와 연결된 관련 formal evidence를 명시적으로 요약한다. |
| 결과 도장 | SIMPLIFY_LAYOUT | 보고서 우측 상단의 작은 상태 인장으로 줄이고 결과 문구를 직접 쓴다. |
| 포기하고 해설 보기 | KEEP | assisted 상태를 기록하는 사용자가 넘기는 단계형 안내로 유지한다. |
| recovery timer/checkpoint/minimap/HUD | KEEP | 현재 주행에 필요한 정보만 유지한다. |
| recovery cat reaction | KEEP | 실제 checkpoint/fault/finish 이벤트에 연결한다. |
| debrief report | SIMPLIFY_LAYOUT | Driving/Investigation/Resolution의 세 결과와 실제 근거 범위를 읽기 쉽게 정리한다. |

## 9. CASE-PT-001 17-step Playthrough

1. 플레이어가 CASE-PT-001을 시작하고 `가속 반응 확인`이라는 짧은 목표를 본다.
2. `D` 상태로 현재 경로를 따라 차량을 직접 조작한다.
3. 표시된 직선 확인 구간에서 브레이크 없이 가속을 일정하게 유지한다.
4. 실제 faulted runtime에서 차량 반응 저하가 발생한다.
5. 유효한 incident trace가 캡처된 뒤 짧은 incident dialogue가 나타난다.
6. 플레이어가 조사실 Page 1로 이동한다.
7. 운전자 진술, 사건 조건, 실제 차량 반응을 보고 incident observation을 저장하여 PHENOMENON gate를 완료한다.
8. Page 2에서 domain과 active path를 확인하고 출력에서 입력 방향으로 추적한다.
9. Function Inspector, Signal Monitor, Interface/Requirement 정보를 사용해 후보를 `POSSIBLE` 또는 `ELIMINATED`로 정리한다.
10. 마지막 정상 경계와 최초 이상 경계를 실제 evidence reference와 함께 선택하여 FAULT PATH gate를 완료한다.
11. Page 3에서 좁혀진 eDrive 후보에 대해 지원되는 첫 번째 유효·비포화 입력의 C/WASM component experiment를 실행하고 저장한다.
12. 서로 다른 두 번째 유효·비포화 입력을 실행하고 저장한다.
13. 기존 evidence-sufficiency 평가가 반복 패턴을 확인하면 PROOF gate가 완료되고 eDrive 후보가 `SUPPORTED`가 된다.
14. Page 4에서 근거 범위를 확인하고 root location과 failure type을 제출한다. 부족하거나 틀리면 해당 gate로 돌아갈 수 있다.
15. 실제 repair variant를 선택하고 기존 C/WASM regression을 실행한다. 실패하면 `RETRY_REPAIR`, 성공하면 recovery countdown으로 이동한다.
16. repaired runtime으로 동일한 가속 확인 조건을 다시 경험한 뒤, 현재 4개 checkpoint를 순서대로 지나 finish trigger를 통과한다.
17. 결과 보고서에서 diagnosis 독립/assisted 상태, repair verification, observed recovery, checkpoint/finish time/personal best를 분리해 확인하고 재도전하거나 요약으로 돌아간다.

## 10. 최소 데이터 계약

아래는 설계상 필요한 최소 개념이다. 정확한 필드명은 구현 시 현재 저장소 convention에 맞추되 의미를 확장하지 않는다.

```ts
type EvidenceGateId = 'PHENOMENON' | 'FAULT_PATH' | 'PROOF'
type EvidenceGateStatus = 'LOCKED' | 'AVAILABLE' | 'SATISFIED'
type SuspectStatus = 'POSSIBLE' | 'ELIMINATED' | 'SUPPORTED'
type FocusPriority = 'PRIMARY_FOCUS' | 'CONTEXT' | 'BACKGROUND'

interface EvidenceReference {
  evidenceId: string
  sourceKind: 'INCIDENT' | 'BOUNDARY' | 'SIGNAL' | 'INTERFACE' | 'REQUIREMENT' | 'COMPONENT_TEST' | 'VEHICLE_SCENARIO'
  canonicalId?: string
}

interface EvidenceGate {
  id: EvidenceGateId
  status: EvidenceGateStatus
  evidenceRefs: EvidenceReference[]
}

interface Suspect {
  id: string
  architectureRefs: string[]
  status: SuspectStatus
  evidenceRefs: EvidenceReference[]
}

interface FocusTarget {
  page: 1 | 2 | 3 | 4
  targetId: string
  priority: FocusPriority
}

interface DrivingObjective {
  id: string
  caseId: 'CASE-PT-001'
  eventRef: string
  presentation: { label: string; shortHint: string }
}

interface RepairReplayStep {
  objectiveId: string
  repairRunId: string
  observationRefs: EvidenceReference[]
}
```

`eventRef`, `canonicalId`, `architectureRefs`는 현재 런타임과 canonical catalog의 ID를 참조한다. gameplay definition 안에 requirement text, expected 수치, root truth 또는 checkpoint 좌표를 복사하지 않는다.

## 11. 점수와 결과 표현

MVP는 하나의 혼합 점수를 만들지 않는다.

- **DRIVING**: ordered checkpoint와 valid finish, time/personal best
- **INVESTIGATION**: 세 evidence gate 완료 여부, independent/assisted 구분
- **RESOLUTION**: diagnosis status와 실제 repair verification result

정확한 가중치, 등급 임계값, 경제/보상 수치는 이번 MVP에서 정의하지 않는다. 결과 화면은 component `PASS`, vehicle `OBSERVED`, diagnostic conclusion의 evidence sufficiency를 각각 별도 줄에 표시한다.

## 12. 빠른 실패 복구

- 잘못된 diagnosis: 관련 gate와 모순되는 evidence를 표시하고 해당 page로 돌아간다. 저장된 notes/evidence는 유지한다.
- 부족한 evidence: PROOF 또는 FAULT PATH에서 아직 필요한 행동 한 가지만 안내한다.
- 잘못된 repair: 실제 failed regression을 보여주고 다른 repair 선택으로 돌아간다. healthy variant로 자동 전환하지 않는다.
- assisted solution: 기존 guided solution이 실제 시험을 수행하도록 유지하고 `ASSISTED`로 기록한다.
- recovery retry: repaired vehicle state는 유지하고 recovery clock, checkpoint state, finish state만 초기화한다.
- investigation duration: driving/recovery race time에 포함하지 않는다.

## 13. 명시적으로 연기하는 범위

- 새 vehicle fault case와 새 episode
- map 전체 교체 또는 geometry 재설계
- 임의의 차량 물리/조향/가속 튜닝
- 완전한 3D facial animation과 신규 대규모 art pipeline
- 피트 크루 고양이의 복잡한 수리 시네마틱
- garage, store, inventory, cosmetic economy
- online leaderboard와 서버 계정
- medal threshold의 최종 수치와 보상 밸런싱
- adaptive hint AI, 확률 기반 suspect ranking
- Phase 08 또는 Reference Vehicle 범위 확장

## 14. 성공 기준

MVP 설계가 구현되었을 때 다음을 모두 만족해야 한다.

1. 현재 CASE-PT-001의 실제 fault와 trace를 사용한다.
2. 세 gate는 실제 행동과 저장된 evidence로만 완료된다.
3. root cause는 gate 완료 전 노출되지 않는다.
4. Page 1–4의 기존 engineering capability가 그대로 접근 가능하다.
5. component verdict와 vehicle observation이 섞이지 않는다.
6. repair는 실제 variant와 regression을 사용한다.
7. recovery는 실제 repaired runtime, ordered checkpoints, finish trigger를 사용한다.
8. assisted, failed diagnosis, failed repair, retry 경로가 막히지 않는다.
9. investigation 시간은 driving time에 포함되지 않는다.
10. reconciliation matrix의 모든 `IMPLEMENTED` 항목에 회귀가 없다.

