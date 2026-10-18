# TRACKBACK V2 1주 구현 계획

> **2026-10-18 이전 설계 기록:** `src/v2` in-place 구조는 폐기했다. 현재 구현·일정 source of truth는 독립 최상위 프로젝트 `trackback-v2/`와 `trackback-v2/docs/PRODUCT_ARCHITECTURE.md`다.

> 범위: Episode 01 수직 슬라이스 하나를 완성한다. 새 엔진, 새 맵 전체, 다중 episode, 상점은 만들지 않는다.

## 1. 구현 전략

V2는 별도 UI 경계에서 시작한다.

```text
src/v2/
  app/
  episode/
  screens/
  components/
  styles/
  adapters/
```

`src/v2`는 다음만 직접 import할 수 있다.

- `src/runtime`
- `src/physics`
- `src/world`
- `src/graphics` 중 캔버스/차량/환경 renderer
- `src/referenceVehicle` query
- `src/data/maps`, calibration, case definition

기존 `src/ui/investigation` 컴포넌트와 CSS는 import하지 않는다. 필요한 의미 로직은 adapter 또는 작은 순수 함수로 이동한다.

## 2. 최소 도메인 계약

### Episode state

```ts
type EpisodePhase =
  | 'BRIEF'
  | 'DRIVE'
  | 'INCIDENT_RECAP'
  | 'CLUE_PHENOMENON'
  | 'CLUE_BOUNDARY'
  | 'CLUE_PROOF'
  | 'REPORT'
  | 'REPAIR'
  | 'REDRIVE'
  | 'RESULT'
```

한 store가 phase, current mission, selected clue, active Driving Event만 소유한다. raw telemetry와 physics state는 기존 runtime에 남긴다.

### DriveSessionPort

```ts
interface DriveSessionPort {
  start(): void
  pause(): void
  resetToSafeSpawn(): void
  readHud(): DriveHudSnapshot
  subscribeIncident(listener: (incident: IncidentSnapshot) => void): () => void
}
```

### EpisodeCasePort

```ts
interface EpisodeCasePort {
  readIncident(): IncidentSnapshot
  compare(signalId: string, frameId: number): SignalComparison
  saveClue(clue: ClueDraft): void
  runTest(request: TestRequest): Promise<TestResult>
  submit(report: RootCauseReport): DiagnosisResult
  runRepair(repairId: string): RepairResult
}
```

기존 `SimulationRuntime`과 `PropulsionCase`는 adapter가 감싼다. 첫 주에는 내부 클래스를 대규모 분해하지 않는다.

## 3. 재사용 매트릭스

| 자산 | 조치 |
|---|---|
| Rapier vehicle/runtime | 그대로 재사용 |
| Pangyo map/route | 그대로 재사용, 한 구간만 Episode 01 mission으로 지정 |
| RaceViewport/vehicle/cat renderer | 스타일만 조정해 재사용 |
| Propulsion fault capture | 재사용, Driving Event ID/context 연결 추가 |
| evidence/assessment/test/repair | 재사용 |
| recovery challenge | 재사용, Before/After 표현 추가 |
| Reference Registry | subgraph query만 재사용 |
| 현재 InvestigationWorkspace | 사용하지 않음 |
| 현재 Page 1~4 JSX | 행동·문구 참고만 하고 새 화면 작성 |
| 대형 legacy CSS | import 금지 |

## 4. Day-by-day

### Day 1 — 기준선과 경계

- registry drift 수정 전 diff 확인 및 canonical source 확정
- V2 entry와 feature flag 추가
- `EpisodePhase` state machine
- `DriveSessionPort`, `EpisodeCasePort` adapter
- V2 token: color, spacing, radius, type scale, z-index
- desktop 기준 1280×720, 1440×900 visual test fixture

완료 기준:

- 기존 앱과 V2 앱을 선택 실행 가능
- 기존 203개 통과 테스트가 감소하지 않음
- stale registry test 해결

### Day 2 — 주행 미션

- Job Brief
- 단일 route objective
- Driving Event A/B/C data
- HUD를 목적지, speed, delta, minimap으로 축소
- 기존 canvas 하단에 steering/pedal/gear/DRIVE READY cockpit overlay
- route departure의 즉시 retry UX
- incident에 active Driving Event context 저장

완료 기준:

- 고장 전 60~90초 주행 목표가 이해됨
- Event C에서만 propulsion incident가 의미 있게 드러남

### Day 3 — Incident Recap + Clue 1

- 6초 incident replay/loop
- 요청/조건/반응 3카드
- Driver Request 장면에서 사건 당시 steering/pedal/gear 입력 확인
- 운전자 고양이 2문장
- phenomenon evidence 저장
- clue board 1/3

완료 기준:

- 전체 기술 표 없이 증상을 설명 가능
- 사건 frame ID와 Driving Event ID가 clue에 남음

### Day 4 — Clue 2

- Episode 01 전용 5-node Vehicle X-Ray subgraph
- Domain → Function → Logic 단계 중 현재 필요한 수준만 펼치는 zoom
- signal actual/expected 비교
- Last Known Normal / First Known Abnormal 선택
- requirement easy text와 source badge
- 전체 차량 지도는 optional detail

완료 기준:

- 정상과 이상 evidence가 각각 한 장 저장됨
- 빈 탭, context mismatch, 접힌 요소의 고정 높이 없음

### Day 5 — Clue 3 + Report

- 45/90 Nm 구분 시험 preset
- 실행 전 예상 문장
- 실행 countdown과 결과
- FAIL 의미 설명
- location/type/evidence 3장 보고서
- wrong answer는 한 개의 다음 행동 제안

완료 기준:

- 기술 상세를 펼치지 않아도 시험 가능
- 기존 assessment와 diagnosis contract 사용

### Day 6 — Repair + Re-drive

- repair choice
- 기존 regression suite 실행
- 5~8초 수리 연출
- 같은 Event C safe spawn
- Before/After speed response 또는 ghost
- Result: Driving / Investigation / Resolution 분리

완료 기준:

- 수리 성공이 regression과 re-drive 둘 다로 확인됨
- 플레이어가 "정말 고쳐졌다"를 조작으로 체감

### Day 7 — QA·정리

- keyboard-only flow
- 1280×720, 1440×900, 1920×1080
- 최소 768px에서 읽기 전용 fallback
- build/lint/test/check:registry
- bundle 분석과 lazy loading
- 문서 canonical manifest
- legacy 삭제 후보 목록만 확정하고 실제 대량 삭제는 다음 변경으로 분리

완료 기준:

- Episode 01 처음부터 끝까지 3회 연속 완료
- 치명 UI overflow/blank state 없음
- 신규 V2 E2E smoke test

## 5. 우선순위

### 반드시 포함

- 주행 목적과 incident context 연결
- incident recap
- clue 3장
- 간소화된 test preset
- 기존 repair regression
- 같은 구간 re-drive
- source badge
- 데스크톱 UI 안정화

### 시간이 남으면

- 고양이 reaction 4상태
- clue/stamp/repair 효과음
- Before ghost
- sticker 1개
- 초보 steering assist

### 제외

- 신호등 state machine 신규 구현
- 복수 dynamic traffic AI
- 새 차량 모델
- 다중 episode
- 로그인/서버 저장
- 코인 상점
- 모바일 운전 조작
- 전 reference function UI

## 6. QA 체크리스트

### 흐름

- [ ] START 후 목표가 바로 보인다.
- [ ] 고장이 Driving Event 중에만 발생한다.
- [ ] incident recap에서 요청/조건/반응을 구분한다.
- [ ] clue는 도구 방문이 아니라 의미 행동으로 획득한다.
- [ ] report 제출 전 3개 clue가 보인다.
- [ ] repair 후 같은 조건으로 재주행한다.

### 정보

- [ ] 기본 화면에 현재 판단에 필요한 정보만 있다.
- [ ] technical ID는 쉬운 이름보다 시각적으로 뒤에 있다.
- [ ] OWNER MANUAL FACT와 SIMULATION ASSUMPTION을 혼동하지 않는다.
- [ ] FAIL이 root cause 확정으로 표현되지 않는다.

### UI

- [ ] 화면당 primary CTA는 1개다.
- [ ] 탭 전환 시 main scroll이 top으로 이동한다.
- [ ] collapsed details는 콘텐츠 높이를 점유하지 않는다.
- [ ] 1280px에서 수평 스크롤이 없다.
- [ ] keyboard focus가 보인다.
- [ ] canvas가 dialog/control을 덮지 않는다.

### 기술

- [ ] `npm run build`
- [ ] `npm run lint`
- [ ] `npm test`
- [ ] `npm run check:registry`
- [ ] 신규 V2 state transition test
- [ ] EpisodeCase adapter contract test
- [ ] incident → clue → report → repair → re-drive integration test

## 7. 문서·파일 정리 계획

### canonical manifest

`docs/CANONICAL_SOURCES.md`를 만들고 다음만 active 기준으로 지정한다.

- 제품 방향: `TRACKBACK_GAMIFICATION_REDESIGN_v1.md`
- V2 방향: `docs/v2/02_PRODUCT_AND_UX_BLUEPRINT.md`
- 조사·교육 상세: `docs/v2/04_INVESTIGATION_LEARNING_FLOW.md`
- V2 일정: `docs/v2/03_ONE_WEEK_IMPLEMENTATION_PLAN.md`
- reference vehicle canonical root
- case schema/case definition
- source PDF inventory

### archive 원칙

- 완료 보고서와 과거 prompt는 날짜별 archive
- zip/full archive는 repository 밖 release artifact 또는 Git LFS 검토
- 동일 hash 문서는 canonical 1개만 남기고 나머지는 link manifest로 대체
- 생성물은 생성 스크립트와 `--check`를 CI에 연결
- 실제 삭제는 별도 PR에서 수행하며 삭제 전 link/reference scan 실시

## 8. 리스크와 대응

| 리스크 | 대응 |
|---|---|
| V2를 만들며 엔진까지 다시 작성 | port 뒤에서 기존 runtime을 재사용한다. |
| 1주 안에 맵/traffic까지 확대 | 기존 route와 한 개 Driving Event pair만 사용한다. |
| 예쁜 UI를 다시 복잡하게 만듦 | 화면당 질문 1, CTA 1, clue 최대 3을 acceptance criterion으로 둔다. |
| 매뉴얼을 OEM 내부 사양으로 과해석 | source badge와 claim-level citation을 필수화한다. |
| legacy와 V2 상태가 섞임 | V2 entry에서 legacy UI import를 lint rule 또는 dependency test로 금지한다. |
| registry drift 반복 | `check:registry`를 기본 test/CI gate에 포함한다. |

## 9. 첫 구현 종료 시 산출물

- 완주 가능한 Episode 01 V2
- 사건 전/후 비교 가능한 driving result
- 세 종류 clue와 report
- repair regression + re-drive
- source/provenance 표기
- 신규 V2 테스트
- canonical docs manifest
- legacy deletion candidate report

이 범위를 넘기지 않으면 1주 안에 "기능이 많은 프로토타입"에서 "한 판이 완결되는 진짜 게임"으로 전환할 수 있다.

