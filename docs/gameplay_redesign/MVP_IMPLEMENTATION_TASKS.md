# TRACKBACK Gameplay MVP — Implementation Tasks

## 0. 실행 원칙

이 문서는 `MVP_GAMEPLAY_REDESIGN.md`를 구현 가능한 작은 작업으로 나눈 계획이다. 이 작업에서는 아래 항목을 실제 수정하지 않는다.

- VehicleSW, C/WASM, Rapier 및 차량 물리
- Reference Vehicle canonical data와 CASE-PT-001 canonical truth
- 기존 test oracle과 evidence semantics
- `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`

각 구현 PR은 reconciliation matrix의 모든 `IMPLEMENTED` 항목을 regression checklist로 사용해야 한다. 아래 P0가 끝나기 전 P1/P2를 섞지 않는다.

## P0 — 한 개의 완결된 CASE-PT-001 루프

P0는 새 기능을 넓히지 않고 이미 구현된 런타임과 조사 도구를 하나의 이해 가능한 흐름으로 연결한다.

### P0-1. Gameplay presentation contract 추가

**목표**

canonical truth를 복제하지 않는 UI 전용 참조 계약을 만든다.

**작업**

- `EvidenceGate`, `Suspect`, `EvidenceReference`, `FocusTarget`, `DrivingObjective`, `RepairReplayStep` 타입을 추가한다.
- CASE-PT-001 gameplay config에는 안정 ID와 현재 runtime event/reference만 둔다.
- requirement text, expected value, root truth, checkpoint 좌표는 복사하지 않는다.
- 중앙 `GamePhase`를 그대로 사용하고 새 로컬 phase state machine을 만들지 않는다.

**예상 파일**

- 신규 `src/runtime/gameplay/CaseGameplayDefinition.ts`
- 신규 `src/runtime/gameplay/cases/casePt001Gameplay.ts`
- 필요 시 `src/runtime/investigation/InvestigationSession.ts`의 presentation state 연동부

**수용 기준**

- gameplay config를 제거해도 engineering runtime 결과는 바뀌지 않는다.
- config가 CASE-PT-001 canonical truth의 사본을 포함하지 않는다.

**테스트**

- canonical/reference ID resolution
- 잘못된 evidence reference 거부
- gameplay state가 `GamePhase`와 경쟁하지 않음

### P0-2. 사고 전 Driving Objective 표현

**목표**

현재 실제 incident trigger를 바꾸지 않고 플레이어가 무엇을 해야 하는지 이해시킨다.

**작업**

- race 시작 시 `D → 경로 추종 → 직선 가속 유지 → 반응 관찰`의 compact objective를 표시한다.
- 현재 route 위에 가속 반응 확인 구간의 presentation marker를 붙인다.
- objective 완료는 `PropulsionCase`의 실제 incident/capture event에서만 온다.
- incident capture 전 임의 pause, fake speed curve, UI 클릭 완료를 추가하지 않는다.
- 기존 incident dialogue와 겹치는 reaction title은 렌더하지 않는다.

**예상 파일**

- `src/ui/screens/RaceScreen.tsx`
- `src/ui/components/RaceHUD.tsx`
- `src/ui/components/IncidentDialogue.tsx`
- gameplay config 파일

**수용 기준**

- 실제 운전 없이는 사건과 Gate 1이 시작되지 않는다.
- 기존 fault behavior와 trace가 동일하다.

**테스트**

- UI objective가 incident state를 직접 변경하지 않음
- capture valid 이후에만 investigation entry 가능
- incident overlay에서 중복 cat-driver title 없음

### P0-3. 세 Evidence Gate를 기존 증거에 연결

**목표**

페이지 방문이 아니라 저장된 실제 증거로 조사 진행을 만든다.

**작업**

- Gate 1 `PHENOMENON`: 저장된 incident evidence로 완료한다.
- Gate 2 `FAULT_PATH`: last-known-normal, first-known-abnormal 및 해당 boundary evidence가 있어야 완료한다.
- Gate 3 `PROOF`: 기존 evidence-sufficiency assessment 결과로 완료한다.
- gate 상태는 `LOCKED`, `AVAILABLE`, `SATISFIED`만 사용한다.
- Page 4 conclusion form은 세 gate 완료 후 활성화한다.
- assisted path는 같은 실제 evidence 생성 경로를 사용하고 별도 status만 기록한다.

**예상 파일**

- `src/runtime/investigation/InvestigationSession.ts`
- `src/ui/investigation/InvestigationWorkspace.tsx`
- `src/ui/investigation/shell/InvestigationSidebar.tsx`
- `src/ui/investigation/pages/Page1Phenomenon.tsx`
- `src/ui/investigation/pages/Page2Tracking.tsx`
- `src/ui/investigation/pages/Page3Verification.tsx`
- `src/ui/investigation/pages/Page4Conclusion.tsx`

**수용 기준**

- 페이지를 차례로 열기만 해서는 conclusion이 열리지 않는다.
- 기존 `PropulsionCase.assessEvidence`보다 약한 기준으로 Proof가 완료되지 않는다.
- formal evidence와 note는 계속 분리된다.

**테스트**

- page visit만으로 gate 미완료
- incident evidence가 없으면 Phenomenon 미완료
- boundary pair/evidence가 없으면 Fault Path 미완료
- 서로 다른 두 유효·비포화 formal test 근거가 없으면 Proof 미완료
- assisted completion 별도 기록

### P0-4. Suspect Summary와 deduction rail

**목표**

Page 2를 `LAST KNOWN NORMAL → UNKNOWN REGION → FIRST KNOWN ABNORMAL` 추론으로 읽게 한다.

**작업**

- GearLogic, PropulsionFunction, VMC, eDrive, downstream application/response의 5개 후보를 표시한다.
- 상태는 `POSSIBLE`, `ELIMINATED`, `SUPPORTED`만 사용한다.
- 모든 상태 변경에 실제 `EvidenceReference`를 요구한다.
- domain 선택 시 domain 설명과 내부 function flow를 보여준다.
- 전체 architecture는 유지하고 active path만 강조한다.
- current function/signal/path는 하나의 둥근 외곽과 직선 세로 구분선으로 합친다.

**예상 파일**

- `src/ui/investigation/pages/Page2Tracking.tsx`
- `src/ui/investigation/page2/ViewAFlow.tsx`
- `src/ui/investigation/page2/FunctionInspector.tsx`
- `src/ui/investigation/page2/Page2ContextBar.tsx`
- 관련 Page 2 styles

**수용 기준**

- 후보 상태가 root truth를 선공개하지 않는다.
- actual-only vehicle speed만으로 downstream 후보를 제거할 수 없다.
- 기존 Signal, Interface, Requirement 도구가 그대로 접근 가능하다.

**테스트**

- evidence 없는 상태 변경 거부
- 허용 상태 외 값 거부
- canonical active path와 suspect reference 일치

### P0-5. Page 3를 한 개의 검증 workflow로 정리

**목표**

Component와 Vehicle mode를 제거하지 않으면서 `조건 → 실행 → 저장 → 차량 적용 관찰` 순서로 만든다.

**작업**

- 중복되는 workbench/method/technique 제목과 설명만 제거한다.
- compact context rail을 workbench 바로 위로 이동한다.
- component experiment를 Proof의 primary focus로 둔다.
- vehicle scenario는 다음 단계로 연결하고 oracle 부재 시 `OBSERVED`를 유지한다.
- Test Design Technique 설명은 선택 항목 옆에 한 번만 표시한다.
- 입력 control의 key 변경 때 component 전체를 remount하지 않도록 안정 key/state ownership을 점검한다.
- focus 이동 시 viewport가 sticky nav 또는 하단 bar 밖으로 넘지 않게 container clipping과 z-index를 정리한다.

**예상 파일**

- `src/ui/investigation/pages/Page3Verification.tsx`
- `src/ui/investigation/verification/ComponentExperimentWorkbench.tsx`
- `src/ui/investigation/verification/VehicleScenarioWorkbench.tsx`
- 관련 investigation styles

**수용 기준**

- C/WASM experiment와 vehicle scenario 실행 의미가 바뀌지 않는다.
- component `PASS`가 whole-vehicle `PASS`로 보이지 않는다.
- 한글자 입력, 의도치 않은 scroll jump, viewport overflow가 없다.

**테스트**

- 다문자 입력 유지
- 기법 선택 후 scroll position 안정
- component result 저장 후 formal evidence 생성
- no-oracle vehicle run은 `OBSERVED`

### P0-6. Current Question과 Focus Guidance

**목표**

현재 행동 하나를 명확히 하되 모든 조사 도구를 계속 사용할 수 있게 한다.

**작업**

- page별 current question을 한 문장으로 표시한다.
- 각 target에 `PRIMARY_FOCUS`, `CONTEXT`, `BACKGROUND`를 적용한다.
- background는 dim 처리만 하고 pointer/keyboard interaction을 막지 않는다.
- `다음`을 눌러야만 안내가 이동하는 step-driven guidance로 만든다.
- scroll target에 header/footer safe inset을 적용한다.
- annotation overlay는 현재 target 위, 도움말 panel 아래의 전용 layer를 사용한다.
- 같은 질문을 반복하는 mission hint는 중복일 때만 제거한다.

**예상 파일**

- `src/ui/investigation/shell/InvestigationMissionLayer.tsx`
- `src/ui/investigation/InvestigationWorkspace.tsx`
- 각 Page의 target annotation
- 관련 styles

**수용 기준**

- 안내가 자동으로 후루룩 진행되지 않는다.
- 포커스 target이 실제 viewport 안에 보인다.
- dim 상태에서도 모든 engineering tool이 조작 가능하다.
- guided solution은 `ASSISTED`로 남는다.

**테스트**

- next/previous focus step
- focus scroll safe area
- keyboard 접근
- overlay cleanup과 z-index
- assisted 상태 보존

### P0-7. Resolve, Repair, Replay 연결

**목표**

충분한 결론에서 실제 수리와 회복 주행까지 자연스럽게 연결한다.

**작업**

- Page 4에 세 gate evidence summary를 보여준다.
- conclusion은 기존 root location/failure type과 evidence assessment를 사용한다.
- 결과 도장은 보고서의 작은 상태 인장으로 변경하고 `PASS`, `FAIL`, `EVIDENCE INCOMPLETE`를 구분한다.
- 실제 repair variants와 regression을 그대로 사용한다.
- successful repair만 recovery countdown을 연다.
- recovery 시작에 동일 가속 확인 objective를 짧게 표시한다.
- 현재 4 checkpoint, finish, timer, personal best를 유지한다.
- replay 결과에서 component verification과 vehicle observation을 분리한다.

**예상 파일**

- `src/ui/investigation/pages/Page4Conclusion.tsx`
- repair-selection/verification 관련 현재 component
- `src/ui/screens/RaceScreen.tsx`
- `src/ui/components/RaceHUD.tsx`
- `src/ui/screens/DebriefScreen.tsx`

**수용 기준**

- failed repair가 healthy runtime을 활성화하지 않는다.
- incident가 recovery에서 재발하지 않는다.
- investigation 시간은 recovery time에 포함되지 않는다.
- finish는 ordered checkpoint 없이는 인정되지 않는다.

**테스트**

- successful/failed repair 분기
- recovery variant 적용
- incident non-recurrence
- checkpoint order/duplicate/finish rejection
- timer reset/stop/personal best scope

### P0-8. 회귀 검증과 실제 브라우저 playthrough

**자동 검증**

- 기존 typecheck, lint, unit/integration test, production build
- reconciliation matrix의 `IMPLEMENTED` 항목별 회귀 test 또는 명시적 manual check
- 기존 VehicleSW/C/WASM tests 결과 불변
- evidence semantics snapshot 불변

**필수 수동 경로**

1. 실제 주행으로 incident 유발
2. Phenomenon gate 완료
3. Fault Path gate 완료
4. 두 component experiment로 Proof gate 완료
5. independent diagnosis 제출
6. failed repair 한 번과 retry 확인
7. successful repair regression 확인
8. recovery countdown, 가속 확인 구간, 4 checkpoint, finish
9. result에서 진단/검증/관찰/주행 결과 분리 확인
10. recovery retry에서 clock/checkpoint reset과 personal best 확인
11. assisted path 전체 완주 확인

**출시 차단 조건**

- reconciliation matrix의 어떤 `IMPLEMENTED` 항목도 손실됨
- vehicle observation을 `PASS`로 오표기
- page visit만으로 gate 완료
- root truth 조기 노출
- failed repair의 silent recovery
- local phase state와 global `GamePhase` 불일치

## P1 — 이해도와 피드백 개선

P0 이후 실제 playtest에서 혼란이 확인된 부분만 추가한다.

1. Domain/function flow의 가벼운 애니메이션과 범례
2. 저장 근거를 클릭하면 원본 source로 돌아가는 suspect evidence drawer
3. checkpoint/fault/repair/finish에 기존 cat asset 기반의 짧은 reaction 보강
4. reduced-motion 대응을 포함한 작은 camera/HUD feedback
5. 결과 보고서의 Driving/Investigation/Resolution 3축 시각화
6. 실제 playtest 데이터에 근거한 configurable medal-tier 초안
7. 화면 크기별 Page 3 workflow와 vehicle viewport 반응형 보강

P1에서도 신규 차량 사실, 신호, expected trajectory 또는 물리 변경은 허용하지 않는다.

## P2 — 다음 콘텐츠를 위한 기반

1. 동일 계약을 사용하는 두 번째 case/mission authoring 검증
2. map geometry와 분리된 objective/checkpoint presentation authoring tool
3. 작은 repair-shop transition과 재사용 가능한 cat reaction event vocabulary
4. sticker/cosmetic reward의 저장 모델만 설계
5. mission version과 rule version을 포함한 best-time migration 정책
6. 접근성 playtest와 입력 장치별 control guidance

P2는 다음 실제 case와 canonical data가 승인되기 전 새 episode를 만들지 않는다.

## 기존 기능 재사용 목록

- 중앙 `GamePhase`와 navigation transition
- CASE-PT-001 incident trigger, trace capture, evidence rules
- current route, Rapier vehicle, camera, controls
- Function Inspector, Signal Monitor, Interface, Requirements
- Notes, bookmarks, history, source return
- C/WASM component experiment와 expected/actual verdict
- Vehicle Scenario 및 no-oracle `OBSERVED` semantics
- actual repair variants와 regression
- recovery countdown, ordered checkpoints, finish, timer, personal best
- current cat assets/reaction hooks
- debrief/report shell

## 주요 구현 위험과 대응

| 위험 | 대응 |
|---|---|
| 새 gate가 기존 evidence sufficiency보다 약해짐 | Proof 완료를 기존 assessment 결과에 직접 연결한다. |
| gameplay config가 canonical truth 사본이 됨 | ID/reference만 저장하고 값과 설명은 runtime/catalog에서 조회한다. |
| suspect UI가 정답을 선공개함 | 초기 상태는 모두 POSSIBLE, 모든 전이에 evidence reference 요구. |
| dim 처리로 도구 접근성이 사라짐 | opacity/contrast만 변경하고 pointer, keyboard, screen-reader 접근 유지. |
| Page 3 재배치 중 component/vehicle 의미가 섞임 | verdict scope 라벨과 저장 evidence kind를 유지한다. |
| vehicle observation이 인증처럼 보임 | oracle 없이는 항상 `OBSERVED`, component PASS와 별도 섹션. |
| 로컬 UI 단계와 global phase 불일치 | 새 phase machine 금지, 기존 navigation store 이벤트만 사용. |
| recovery에서 incident 재발 또는 timer 오염 | 현재 resolved variant와 recovery clock contract를 regression test. |
| 입력 remount/scroll jump 재발 | stable key, local draft state, explicit scroll action만 허용. |
| 기존 dirty worktree 변경과 충돌 | 작업 시작 전/후 diff를 비교하고 관련 파일만 좁게 수정. |
| reconciliation regression | matrix 항목별 자동/수동 release checklist를 P0 완료 조건으로 지정. |

## 완료 정의

P0는 CASE-PT-001에서 다음 한 문장이 실제로 성립할 때만 완료다.

> 플레이어가 차량 이상을 직접 겪고, 세 개의 실제 근거 게이트로 원인 구간을 좁혀 입증하고, 실제 repair를 검증한 뒤 repaired runtime으로 같은 관련 조건과 ordered checkpoint를 완주하여 결과를 분리된 의미로 확인한다.

컴파일 성공만으로 완료를 선언하지 않는다. 브라우저 end-to-end playthrough와 reconciliation 회귀 점검 결과를 함께 기록해야 한다.
