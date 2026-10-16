# TRACKBACK 근거 기반 재설계·마이그레이션 계획

> 상태: 제안 전용 — 구현 미승인  
> 작성일: 2026-10-15  
> 이 문서에 따라 코드나 데이터를 변경하려면 별도 사용자 승인이 필요하다.

## 1. 목표 상태

최종 구조는 한 항목에 여러 truth를 섞지 않고 다음 네 층을 분리한다.

1. `OWNER_MANUAL_FACT`: 취급설명서가 직접 말하는 기능, 조건, 경고, 운전자 조치
2. `TRACKBACK_RUNTIME_FACT`: 현재 코드에서 실제 실행·관찰·시험 가능한 동작
3. `SIMULATION_ASSUMPTION`: 게임을 위해 선택한 물리·timing·threshold·fault model
4. `UNVERIFIED_INTERNAL`: ECU, bus, CAN ID, DTC, 내부 신호·알고리즘 등 아직 근거가 없는 항목

각 case는 이 층들을 명시적으로 참조하고, `OWNER_MANUAL_FACT`를 `TRACKBACK_RUNTIME_FACT` 또는 OEM 내부 설계로 자동 승격하지 않는다.

## 2. 변경 전 필수 Gate

### Gate A — 문서 식별

- 사용자가 의도한 “2026년형 Genesis GV70”과 `JKEV_2027_ko_KR.pdf`의 정확한 모델/연식/시장/개정판 관계를 확인한다.
- 현재 PDF는 Copyright 2026, 모든 모델/기본·옵션 사양 포함, 이미지·메뉴·기능이 차량 사양과 다를 수 있다는 고지를 포함한다.
- 정확한 적용 차량이 확인되기 전에는 모든 manual fact에 `applicability: MODEL_OR_OPTION_DEPENDENT`를 허용한다.

### Gate B — 기존 기능 보존

- `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`의 IMPLEMENTED 항목을 회귀 방지 기준으로 동결한다.
- CASE-PT-001, C/WASM, Rapier, current oracle, repair variants를 baseline으로 기록한다.
- `npm run check:registry`, `npm run typecheck`, `npm run lint`, `npm test`, `npm run build`의 사전 결과를 저장한다.

### Gate C — Case 승인

새 case마다 아래가 모두 있어야 구현을 시작한다.

- manual-backed driver observation
- 명시적인 simulation assumption
- executable fault path
- player-visible evidence plan
- independent or explicitly scoped oracle
- wrong diagnosis/repair behavior
- repair verification and regression set

## 3. 권장 데이터 계약

향후 설계 시 다음 개념을 기존 registry/evidence 구조에 추가하는 방안을 검토한다. 이번 작업에서는 구현하지 않는다.

```text
SourceRecord
  id
  documentId
  edition/applicability
  manualPage
  pdfPage
  claim
  factScope
  limitations

ClaimBinding
  subjectId
  sourceRecordIds[]
  classification: VERIFIED | CONSISTENT | ASSUMED | CONFLICT | UNKNOWN
  claimScope: DRIVER_OBSERVABLE | SIMULATION | INTERNAL_ARCHITECTURE

SimulationAssumption
  id
  purpose
  value/model
  notAnOemSpecification: true
  validationPlan
  reviewStatus
```

기존 `EvidenceReference`에는 runtime frame/run/scenario reference를 유지하고, source citation은 별도 reference type으로 추가하는 것이 안전하다. 문헌 근거와 실행 근거는 같은 타입의 PASS 증거로 합치지 않는다.

## 4. 영역별 개선안

| 관점 | 개선 방향 | 기존 코드 영향 | 필요한 근거 | 위험도 | 우선순위 |
|---|---|---|---|---|---|
| 1. 시스템 아키텍처 | 74 LF를 실차 구성도가 아니라 TRACKBACK logical reference로 명확히 라벨링; manual user-function view와 연결 | Registry/UI adapter/문서에 영향, C/WASM 없음 | owner manual + 승인된 별도 내부 문서가 있으면 추가 | 중 | P0 |
| 2. ECU·기능 책임 | ECU를 임의 생성하지 않고 owner를 `UNKNOWN`/`LOGICAL_OWNER`로 유지 | reference schema/UI terminology | OEM service/architecture 자료 없이는 확정 불가 | 높음 | P0 |
| 3. 인터페이스·신호 | runtime function-call signal, reference signal, driver display를 구분; CAN ID/period는 OPEN | signal catalog, adapter, inspector | interface spec/service data | 높음 | P0 |
| 4. 요구사항·상태 전이 | manual fact에서 driver-observable requirement를 만들고 내부 requirement와 분리 | requirement catalog/trace/test basis | source-register page claim | 중 | P0 |
| 5. 고장 인과 | symptom→possible condition→game fault model→repair oracle 4단계로 case authoring | case catalog, runtime case, UI copy | manual + executable model + approved oracle | 높음 | P0 |
| 6. 진단·추론 | 현상→정상/제한/고장 구분→boundary→proof 흐름 유지; root cause는 evidence 전 숨김 | existing Page 1–4와 clue system 보강 | runtime evidence plan | 중 | P1 |
| 7. 테스트·검증 | requirement를 test basis로, BVA/동등분할/FI를 input 설계기법으로 사용; oracle 없으면 OBSERVED | Verification metadata/UI/test catalog | requirement source + executable oracle | 중 | P0 |

## 5. 단계별 실행 순서

### Phase 0 — Baseline 봉인

**목표:** 기존 기능과 truth를 잃지 않고 변경 기준점을 만든다.

- reconciliation matrix와 현재 자동 검증 결과를 snapshot한다.
- `CASE-PT-001`의 활성 조건, frame capture, evidence rule, repair regressions를 보존 대상으로 기록한다.
- generated registry는 generator/source와 함께 관리하고 JSON을 수동 수정하지 않는다.

**산출물:** baseline report, test log.  
**코드 영향:** 없음.  
**위험:** 낮음.

### Phase 1 — Source provenance 도입

**목표:** 모든 새 사실이 어느 문서의 어느 page에서 왔는지 추적한다.

- `source-register.md`의 레코드를 기계 판독 가능한 schema로 옮길지 결정한다.
- claim scope와 applicability를 정의한다.
- 매뉴얼 개정판이 바뀌어도 ID가 안정적으로 유지되게 한다.

**선행 승인:** 모델/연식/시장판 확인.  
**코드 영향:** data schema/registry generator 가능.  
**위험:** 중.

### Phase 2 — 용어와 truth namespace 정리

**목표:** “실차 사실”, “현재 실행”, “설계 후보”를 UI/문서에서 즉시 구분한다.

- `TRACKBACK_MODEL` 요구사항과 `OWNER_MANUAL_FACT` 요구사항을 별도 namespace로 둔다.
- `VMC`, `eDrive`, `EDriveCommand`에 “TRACKBACK simulation term” 표기를 적용한다.
- `DESIGN_ONLY`, `PARTIAL`, `VERIFIED`, `OBSERVED`, `PASS/FAIL`의 표시 규칙을 통일한다.
- `GroundTruth` 명칭은 파일을 즉시 바꾸지 말고 UI/문서 표시 범위부터 명확히 한다.

**코드 영향:** presentation/metadata 중심.  
**위험:** 중; 참조 ID 변경은 금지.  
**우선순위:** P0.

### Phase 3 — 첫 manual-backed Case 선정

**권장 첫 대상:** TPMS.

이유:

- 저압과 시스템 이상이 서로 다른 경고 패턴을 가진다.
- 운전자 관측 정보가 명확하다.
- “증상과 시스템 고장을 구분”하는 추리 목표가 좋다.
- brake/ADAS보다 물리 안전 동작을 덜 가정하고도 구현할 수 있다.

다만 구현 전 아래를 결정해야 한다.

- pressure state를 실제 tyre dynamics로 만들지, scenario state로 제한할지
- 저압 warning threshold를 어떻게 설정할지. OEM 수치가 없으면 명백한 simulation assumption이어야 한다.
- TPMS fault와 tyre low pressure를 별도 root cause로 어떻게 구분할지
- repair가 공기 보충인지 sensor/wheel 점검인지
- warning lamp blink timing을 매뉴얼 표현 이상으로 과도하게 정밀화하지 않을 방법

**코드 영향:** new case/data/runtime observation; 기존 propulsion은 비변경.  
**위험:** 중.  
**우선순위:** P0 pilot.

### Phase 4 — Case evidence 설계

각 case에 다음 evidence contract를 먼저 작성한다.

1. Phenomenon: 운전자 표시/차량 반응 actual
2. Context: 동작 조건과 제한 조건
3. Last Known Normal: 정상 관측 또는 정상 전달 경계
4. First Known Abnormal: 최초 편차 또는 상태 변화
5. Proof: independent criterion이 있는 executable test
6. Repair: wrong repair가 실패하고 correct repair가 회귀 통과

문헌 사실은 test expected의 출처가 될 수 있지만, 내부 signal expected를 자동 제공하지 않는다. 예를 들어 “TPMS fault lamp가 깜빡인 뒤 켜짐”은 cluster observation expected가 될 수 있지만 CAN frame expected는 아니다.

### Phase 5 — 요구사항과 상태 전이

- driver-observable requirement를 먼저 작성한다.
- 상태는 `NORMAL`, `LIMITED/UNAVAILABLE`, `FAULT`를 구분한다.
- sensor obstruction과 actual fault, power-down protection과 service fault, tyre low pressure와 TPMS malfunction을 분리한다.
- 문서에 없는 timer/debounce/hysteresis는 `SIM-*` assumption으로 둔다.

**코드 영향:** requirement catalog, trace, tests.  
**위험:** 중.

### Phase 6 — 인터페이스·신호 최소 모델

- game case가 요구하는 최소 signal만 정의한다.
- driver-visible display state, simulated sensor state, control state를 서로 다른 타입으로 둔다.
- 실제 bus가 없으면 `logical interface`로만 표현한다.
- CAN ID, frame byte, ECU address, UDS service/DTC는 승인 자료가 생길 때까지 생성하지 않는다.

**코드 영향:** registry/interface adapter.  
**위험:** 높음.

### Phase 7 — 실행 모델과 oracle

- normal model과 fault variant를 분리한다.
- calibration은 `SIMULATION_ASSUMPTION`으로 중앙 관리한다.
- component oracle, interface comparison, vehicle observation을 구분한다.
- vehicle trajectory expected가 없으면 `OBSERVED`를 유지한다.
- repair는 동일 precondition/stimulus로 재실행하고 unrelated regression도 확인한다.

**코드 영향:** runtime/C/WASM 또는 TS model, tests.  
**위험:** 높음. 이 단계 전 사용자 승인 필수.

### Phase 8 — 기존 조사 UI 통합

- 새 대형 페이지를 만들지 않고 기존 Page 1–4에 source-backed context를 추가한다.
- 한 번에 하나의 current question과 PRIMARY_FOCUS를 유지한다.
- 용어 tooltip은 “manual fact”와 “TRACKBACK simulation term”을 구분한다.
- Reference-only 항목에 실행/PASS 버튼을 제공하지 않는다.

**코드 영향:** `src/ui/investigation/` 중심.  
**위험:** 중.

### Phase 9 — 검증과 출시 Gate

자동 검증:

```text
npm run check:registry
npm run typecheck
npm run lint
npm test
npm run build
```

Case별 검증:

- source citation 누락 없음
- manual fact와 assumption 혼합 없음
- normal/limited/fault 구분
- false-positive/false-negative path
- evidence 없이 root cause unlock 불가
- wrong diagnosis와 wrong repair 실패
- correct repair 후 회귀 PASS
- 기존 CASE-PT-001 동일 동작
- reconciliation IMPLEMENTED 항목 회귀 없음
- browser playthrough와 접근성/레이아웃 확인

## 6. 기능별 권장 순서

1. TPMS 저압 vs TPMS 시스템 이상
2. 센서 가림 vs 운전자 보조 실제 이상
3. 12 V 충전 계통 경고
4. LED 전조등 이상
5. Auto Hold 상태/이상
6. 회생 제동/브레이크 이상
7. FCA/AEB 등 복합 운전자 보조 — 환경 actor와 안전 검증 기반이 준비된 뒤

배터리 방전으로 시동 불가 case는 “12 V 방전”, “고전압 SOC 부족”, “키 인식 실패”, “제동 스위치 퓨즈”가 서로 다른 원인일 수 있으므로 하나의 generic battery case로 합치지 않는다.

## 7. 변경 위험 관리

| 위험 | 방지책 |
|---|---|
| manual fact가 ECU truth로 승격 | claim scope 검증과 code review checklist |
| candidate registry가 실행 가능으로 보임 | capability gate와 UI badge 강제 |
| 수치가 OEM calibration처럼 보임 | `SIM-*`, provenance, review status 필수 |
| 기존 CASE-PT-001 회귀 | baseline tests와 fixed case IDs 유지 |
| generated JSON 직접 수정 | generator source만 변경, `check:registry` 필수 |
| evidence 의미 약화 | 기존 formal sufficiency 이하로 gate 완화 금지 |
| sensor obstruction을 fault로 오판 | LIMITED/UNAVAILABLE과 FAULT 상태 분리 |
| safety feature의 위험한 실제 시험 유도 | 시뮬레이션 전용 고지, 사람/사물 대상 시험 금지 문구 반영 |

## 8. 다음 승인 요청 시 제시할 선택지

분석 이후 첫 구현 승인을 요청할 때는 다음 중 하나만 선택하는 것이 좋다.

- **A. Provenance-only foundation:** source schema/label/UI 표시만 추가하고 gameplay는 변경하지 않음.
- **B. TPMS case design package:** 코드 없이 requirement/state/evidence/oracle 설계만 작성.
- **C. TPMS vertical slice implementation:** A와 B 승인 후 최소 runtime/UI/test를 구현.

현재 권고는 **A → B → C**다. 바로 다수 case를 구현하면 근거와 simulation assumption이 다시 섞일 위험이 크다.

## 9. 최종 권장 수정 순서

```text
문서 식별 확인
→ baseline/reconciliation 봉인
→ source provenance schema
→ truth namespace와 UI 라벨
→ TPMS case 설계
→ 요구사항/상태/evidence/oracle 승인
→ 최소 실행 모델
→ 기존 Page 1–4 통합
→ 자동 회귀 + browser playthrough
→ 다음 case로 반복
```

## 10. 승인 대기 상태

이 계획은 분석 산출물이다. 소스코드, C/WASM, Rapier, canonical vehicle data, case data, tests에는 변경을 시작하지 않는다. 사용자가 우선순위와 첫 승인 범위(A/B/C)를 선택한 뒤 별도 작업으로 진행한다.
