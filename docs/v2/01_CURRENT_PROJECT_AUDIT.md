# TRACKBACK 현재 프로젝트 감사 보고서

> 작성일: 2026-10-18  
> 목적: 현재 저장소를 프로토타입으로 평가하고, V2에서 보존·재작성·격리할 범위를 결정한다.  
> 제품 방향 기준: `docs/TRACKBACK_GAMIFICATION_REDESIGN_v1.md`

## 1. 결론

현재 TRACKBACK은 실패한 프로젝트가 아니다. 차량 주행, C/WASM 실행, 사건 기록, 근거 수집, 가설 시험, 수리 회귀시험, 재주행까지 이어지는 기술적 수직 슬라이스가 이미 있다. 특히 "실제 실행 기록에 연결된 증거"와 "정답 여부와 근거 충분성을 분리한 판정"은 V2의 가장 중요한 자산이다.

문제는 제품 경험이 이 기술 구조를 그대로 노출한다는 점이다. 플레이어는 한 화면에서 레이서, 차량 구조 학습자, 검증 엔지니어, 보고서 작성자 역할을 동시에 요구받는다. 화면은 예쁘지만 현재 질문보다 전체 도구와 기술 정보가 먼저 보이며, 레이싱에서 생긴 사건이 조사 질문으로 자연스럽게 번역되지 않는다.

V2는 엔진을 다시 만드는 프로젝트가 아니라 다음 원칙으로 진행한다.

1. 현재 simulation/runtime/evidence/test 자산은 재사용한다.
2. 기존 UI와 진행 상태를 V2 화면에서 직접 재사용하지 않는다.
3. 한 번에 질문 하나, 행동 하나, 피드백 하나만 보여준다.
4. 레이싱 사건과 조사 단서는 같은 Driving Event ID와 Incident Snapshot을 공유한다.
5. 매뉴얼 사실, TRACKBACK 실행 사실, 시뮬레이션 가정, 설계 전용 정보를 시각적으로 구분한다.

## 2. 실행·검증 상태

### 실행 확인

- 개발 서버: `http://127.0.0.1:5173/`
- 실행 흐름: 시작 화면 → 레이스 → 실제 가속 입력 → 추진 반응 저하 사건 → 조사실 Page 1~4
- 사건 발생 조건은 UI 버튼이 아니라 `PropulsionCase.beforeStep()`의 실제 입력·속도·시간 조건이다.
- 사건 이후 주행 기록이 캡처되고 SimulationClock/physics가 정지한다.

### 자동 검증 결과

- `npm run build`: 성공
- `npm run lint`: 성공
- `npm test`: 204개 중 203개 성공, 1개 실패
- 실패 항목: generated reference vehicle registry가 canonical source와 drift 상태
- `npm run check:registry`: 실패, `src/referenceVehicle/generated/reference-vehicle-registry.json`이 stale
- production build 경고: `index` 약 2.77 MB, `RapierWorld` 약 2.27 MB로 큰 번들 청크 존재
- 설치 시 `npm audit` 기준 high severity 2건 보고됨. 자동 수정 전에 영향 범위를 검토해야 한다.

### 저장소 규모

- `src`: 207개 파일, 약 3.82 MB
- `tests`: 36개 파일
- `docs`: 254개 파일, 약 47.65 MB
- CSS: 약 15,000줄 이상
- 가장 큰 UI CSS: `investigation-layout.css` 약 3,886줄, `styles.css` 약 4,249줄, `case-file.css` 약 3,377줄
- 정확히 같은 내용의 문서 중복: 32개 그룹, 88개 파일, 약 1.49 MB의 중복 데이터

## 3. 현재 사용자 흐름과 페이지별 구성

| 단계 | 현재 구성 | 플레이어가 해야 하는 일 | 평가 |
|---|---|---|---|
| Main | 3D 배경, Track Back 로고, START | 시작 | 감성적 첫인상은 좋지만 설정 화면을 건너뛰고 바로 레이스로 진입한다. |
| Race | WebGL canvas, 차량/고양이, 경로, 미니맵, 타이머, 속도·기어 HUD, 목표 카드 | 조향·가속·제동, 경로 유지 | 현재 가장 즉시 이해되는 화면이다. 목표와 사건 맥락은 약하다. |
| Fault Event | 배경 blur, 차량 이상 문구, 2단계 대화 | 이상을 인지하고 조사실로 이동 | 장면 전환은 명확하지만 "왜 지금 고장이 의미 있었는가"가 부족하다. |
| Page 1 | 사건 보고서, 운전자 의견, 입력/상태/반응, 차량 장면, timeline, mission/clue rail | 증상과 당시 조건 확인 | 정보의 출처가 실제 incident frame인 점이 강점이다. 한 화면의 경쟁 요소가 너무 많다. |
| Page 2 - 구조 | 전체 차량 도메인 → 기능 → 내부 확대 | 관련 기능 경로 선택 | 74개 reference function을 보여주는 장점이 있으나 첫 사건에 과도하다. |
| Page 2 - 연결 | Source → Signal → Destination | 값이 전달 중 달라졌는지 판단 | 개념은 좋지만 선택 전 빈 화면과 실행 가능성/설계 정보가 혼재한다. |
| Page 2 - 신호 | 상태/입력/출력 그룹, Actual/Expected timeline, 선택 시점 | Last Normal / First Abnormal 찾기 | 교육·추리의 핵심이며 V2에서 가장 우선 보존할 도구다. |
| Page 2 - 기준 | 쉬운 요구사항, 기술 원문, 조건, linked TC, requirement map | 왜 이상인지 기준 확보 | provenance와 기준 연결은 강점이지만 접힌 맵이 큰 빈 공간을 만든다. |
| Page 3 | 가설, 테스트 설계 기법, precondition/stimulus/monitor/oracle, live vehicle scenario | 가설을 구분하는 시험 실행 | 검증 워크벤치로는 풍부하지만 초심자에게 설정값이 너무 많고 현재 가설 문맥이 흔들린다. |
| Page 4 | 원인 위치, 문제 유형, 근거 선택, 제출, repair regression | 근거로 결론 제출 | 정답과 근거 충분성을 분리한 구조가 훌륭하다. 잠김 이유와 다음 행동이 약하다. |
| Repair/Re-drive | C/WASM 회귀시험, safe spawn, recovery countdown, checkpoint/sector/PB | 수리 확인 후 같은 레이스 복귀 | 기술적으로 구현되어 있으나 조사실과 감정적 연결이 약하다. |

## 4. 좋은 점

### 제품·학습

- 증상 → 구조 → 신호 → 기준 → 가설 → 시험 → 결론 → 수리 → 재주행이라는 검증 사고의 뼈대가 있다.
- 정상 신호도 범위를 줄이는 근거라는 올바른 조사 관점을 갖는다.
- FAIL을 곧바로 root cause로 취급하지 않고 요구사항 위반 근거로 제한한다.
- 기술 용어 옆에 쉬운 한글 의미를 두려는 방향이 일관된다.
- 고양이 운전자, 정비소, 부드러운 색과 재질감은 차가운 검증 도메인의 진입 장벽을 낮춘다.

### 기술

- C 소스와 WASM 실행 경로, Rapier physics, 1/60초 fixed step이 분리돼 있다.
- 사건 frame, evidence, experiment run, diagnosis, repair run이 ID로 추적된다.
- 정답 판정과 evidence sufficiency가 분리되어 있다.
- runtime fact와 reference design을 구분하려는 provenance 정책이 이미 존재한다.
- 회귀시험이 방향 한계, invalid, P/N/D/R, disabled, D↔R interlock까지 재확인한다.
- 자동화 테스트 범위가 넓고 핵심 도메인 규칙은 비교적 잘 보호된다.

### 기대 효과

- 차량 SW/검증 입문자가 "관찰값"과 "판정 기준"을 구분하는 법을 배울 수 있다.
- 요구사항–신호–시험–결론 traceability를 문서가 아니라 행동으로 체험할 수 있다.
- 교육, 사내 온보딩, 시스템 사고 훈련, 직무 소개용 인터랙티브 데모로 발전할 수 있다.
- 비개발 직군에도 고장 원인 분석이 단순 부품 교체가 아니라 가설과 근거의 축적임을 설명할 수 있다.

## 5. 나쁜 점과 원인

### 레이싱과 조사가 분리돼 보임

- 초기 레이스의 목표는 단순 체크포인트 통과다. 이 목표가 고장을 의미 있게 만드는 차량 기능 사용과 연결되지 않는다.
- 사건 직전 "무슨 환경·판단·기능을 사용했는가"가 조사실 첫 질문에 그대로 이어지지 않는다.
- 수리 후 재주행은 구현돼 있지만 Before/After를 같은 구간·같은 목표·같은 지표로 비교하는 표현이 약하다.

### 정보량이 지나침

- 조사실 상단 단계, 좌측 clue rail, 사건 preview, 조사 메모, 본문, 하단 timeline이 동시에 주의를 요구한다.
- Page 2의 74개 기능 지도는 전문가용 전체성은 좋지만 첫 에피소드의 현재 질문을 압도한다.
- Page 3는 테스트 basis, 설계 기법, 조건, 입력, monitor, oracle, 실행 모드를 한 번에 보여준다.
- 기술 정보가 "필요할 때 펼치는 두 번째 레이어"가 아니라 기본 레이아웃의 크기를 결정한다.

### UI/UX 결함

- 좁은 뷰포트에서 시작·레이스 화면에 수평 스크롤이 생긴다.
- 모바일 조사실 헤더에서 TRACKBACK 로고와 단계 아이콘이 겹치거나 잘린다.
- 접힌 `requirement-mind-map`에 `height: clamp(360px,58vh,620px)`가 적용돼, 접힌 상태에서도 큰 빈 공간이 생기고 핵심 요구사항이 약 1,000px 아래로 밀린다.
- Page 2에서 기능을 선택하기 전에 연결/신호/기준 탭을 눌러도 이동되며, 빈 상태 설명만 반복된다. 선행 조건이 있는 탭은 disabled 또는 context-preserving redirect가 필요하다.
- Page 3에서 현재 가설 대상은 `LF-PLANT-MOTION`인데 test basis는 `SWR-EDR-001`로 보이는 상태가 재현됐다. 선택 context와 기본 hypothesis 생성이 분리돼 있다.
- 내부 스크롤 영역과 탭 전환이 결합되어 새 탭의 핵심 내용이 화면 밖에서 시작할 수 있다.
- 일부 HUD와 작은 기술 문구는 큰 화면에서도 대비·크기가 낮아 읽기 어렵다.

### 코드·규칙 구조

- `InvestigationWorkspace.tsx`가 시간 제한, 대화, mission, clue toast, guided review, navigation, evidence, scenario, page orchestration을 한 컴포넌트에서 소유한다.
- `PropulsionCase.ts`도 사건 수집, 근거 생성, 실험, 보고서, repair regression을 한 클래스에 집중한다.
- 여러 세대의 UI CSS가 누적되어 같은 selector를 후반부 override로 수정한다. 실제 결과를 예측하기 어렵다.
- navigation store, case state, investigation UI state, incident race state, HUD state가 분리돼 있으나 상위 episode state machine이 없어 문맥 불일치가 생긴다.
- `GroundTruth` 명칭은 실제 OEM truth로 오해할 수 있다. 실제 provenance는 TRACKBACK_MODEL이다.

### 문서·파일 구조

- architecture, reference_vehicle, nested full archive, phase package에 동일 문서가 2~4번 존재한다.
- 완료 보고서, 구현 요청, 감사 보고서, 현재 기준 문서가 같은 깊이에 섞여 source of truth를 찾기 어렵다.
- `markdown.md`는 0바이트다.
- `visual-check.html/tsx`는 별도 검사 진입점처럼 보이지만 package script와 연결되지 않는다.
- 생성 registry가 canonical source보다 stale하여 문서/코드 기준선이 이미 어긋나 있다.

## 6. V2 보존·재작성·격리 판정

### 그대로 보존

- `src/runtime`, `src/physics`, `src/world`, `src/input`
- C/WASM build와 provenance 검증
- `PropulsionCase`의 실행 결과와 evidence semantics
- `Assessment`, `SignalComparison`, `Boundary`, `Verification`
- map/route loader와 Rapier 기반 차량 주행
- recovery challenge, checkpoint, sector, PB
- reference vehicle registry와 생성 스크립트(먼저 drift 수정)
- 현재 자동화 테스트

### 인터페이스를 좁혀 재사용

- `PropulsionCase`는 V2용 `EpisodeCasePort` 뒤에 둔다.
- `SimulationRuntime`은 `DriveSessionPort` 뒤에 둔다.
- reference registry는 현재 episode에서 허용된 subgraph만 query한다.
- manual data는 `SourceClaim` adapter로 제공한다.

### 새로 작성

- V2 episode state machine
- V2 화면 shell, HUD, mission card, incident recap, clue board, hypothesis/test, repair/re-drive comparison
- V2 디자인 토큰과 소수의 CSS module
- page transition 시 selection/scroll reset 규칙
- source badge와 "쉬운 설명 → 기술 상세" disclosure

### 격리 후 삭제 후보

- `src/ui/investigation`의 기존 화면과 대형 CSS는 V2에서 import 금지
- 중복 문서와 nested archive는 canonical manifest 작성 후 `docs/archive` 또는 Git history로 이동
- 0바이트/미연결 검사 파일은 사용 여부 확인 후 제거
- Phase별 완료 보고서는 `docs/archive/reports/YYYY-MM-DD`로 이동

삭제는 V2 수직 슬라이스가 기존 회귀 테스트를 통과한 뒤 별도 변경으로 수행한다.

## 7. 즉시 처리할 P0

1. registry drift 원인 확인 및 재생성 diff 검토
2. V2에서 사용할 canonical 문서 목록 1개 작성
3. source badge 네 종류 고정
4. V2 episode state machine과 현재 runtime 사이 port 정의
5. 모바일을 이번 1주 범위에서 지원할지 결정. 권장 범위는 desktop-first 1280px 이상이며, 768px 이하는 읽기 전용/지원 예정 메시지다.

