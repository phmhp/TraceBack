# V2 실행 상태 — 품질 보존 기준

## 정정

이전 저충실도 prototype은 정보 구조를 빠르게 시험했지만 제품 요구를 충족하지 못했다.

- 3D/Rapier/C-WASM simulation 품질을 제거했다.
- 기존 architecture/signal/interface/requirement/test/evidence 깊이를 5개 node와 고정 답으로 과도하게 줄였다.
- 선택이 가설을 구분하지 않고 다음 버튼 역할을 했다.
- 12V case를 full runtime 없이 UI 문장으로만 흉내 냈다.
- 그 상태를 구현 완료처럼 표현했다.

따라서 production entry와 독립 제출 폴더에서 제거했다. 원본 저장소의 `docs/v2/lowfi-prototype-source`에 설계 실패 이력으로만 보존한다.

## 현재 완료된 것

| 항목 | 상태 | 검증 |
|---|---|---|
| 독립 최상위 프로젝트 | 완료 | 상위 source import 0개 |
| 원본 3D/Rapier simulation | 복원 | build + browser drive 확인 |
| C/WASM vehicle software | 복원 | binary provenance tests |
| Pangyo map/route/collider | 복원 | world/route tests |
| incident/evidence/experiment/repair/re-drive | 복원 | automated tests |
| canonical registry | 복원 | 539 entities / 2,195 relations, drift check |
| architecture/requirement/interface/test/case 문서 | 선별 포함 | `docs/reference_vehicle`, `docs/knowledge` |
| owner manual | 포함 | authoring source, runtime bundle 제외 |
| 저충실도 UI production 제거 | 완료 | fidelity boundary test |
| 검증 의뢰 → 3D 시험 주행 연결 | 완료 | main → setup → race state test + browser 확인 |
| 원인을 숨긴 mission contract | 완료 | symptom/route/observation contract test |
| 고장 순간 cockpit recap | 완료 | live incident frame의 조향·페달·기어·속력 사용 |
| 조사 chapter 의미 기반 해금 | 완료 | 사건 근거 → 경계 근거 → 구분 시험 충분성 → 결론 |
| 조사실 한 화면 정보량 재구성 | 완료 | 카드 덱 기본값, 한 장면·한 질문·한 판단 |
| 전체 아키텍처 맥락 보존 | 완료 | Scene 2~4에서 6단계 전체 흐름 고정 표시 |
| 전문 정보 progressive disclosure | 완료 | 기존 workspace를 `전문 도구 열기`에 보존 |

## 아직 완료되지 않은 것

| 설계 항목 | 현재 상태 | 완료 조건 |
|---|---|---|
| 재미있는 driving mission | 검증 목적은 연결, challenge 깊이는 기존 checkpoint/event 수준 | risk/reward·동적/정적 장애물·sector feedback이 사건 조건과 연결 |
| cockpit/driver POV | 미구현 | 원본 3D 품질 위에서 실제 입력과 계기 정보를 표시 |
| 장면형 investigation chapter | 기본 카드 덱 구현 완료 | episode/case별 데이터 authoring과 고급 난이도 guidance fading 확장 |
| 추리 난이도 | 의미 행동 gate는 있으나 UX가 복잡함 | 경쟁 가설 2~3개, 정보 비용, 구분 시험, 오답의 설명력이 gameplay에 반영 |
| 차량 X-Ray zoom | 전체 정보는 존재 | Domain → Function → Logic → Trace 단계 확대와 사건 경로 강조 |
| 빈도 1위 12V full case | UI concept만 존재 | runtime model, incident capture, evidence, oracle, repair regression, re-drive 모두 실행 |
| Case 02 propulsion 재구성 | mission brief와 failure recap 연결 완료 | 시험 구간 scoring·경쟁 가설·조사 chapter까지 결합 |

## 정보 축소 금지 규칙

화면에서 기본 노출을 줄일 수는 있지만 아래 정보는 삭제하지 않는다.

1. raw incident frames와 run identity
2. Actual / Expected / oracle source
3. producer / consumer / interface boundary
4. requirement / precondition / test trace
5. normal evidence와 abnormal evidence
6. hypothesis와 alternative explanation
7. fixed conditions / changed input / observed output
8. test limitation과 conclusion scope
9. repair regression result
10. physical re-drive result

기본 장면은 이 중 현재 질문에 필요한 것만 보여주며, `근거 펼치기`와 `전문가 모드`에서 전체 깊이에 접근하게 한다.

## 다음 구현 순서

1. 기존 investigation tools를 삭제하지 않고 question-driven scene shell로 감싸기
2. 경쟁 가설과 evidence budget 도입
3. 시험 실행 전 prediction을 필수화하고 시험 후 explanation update
4. 가속 시험 구간의 재현 품질·안전 주행 scoring 추가
5. repair 후 same-event re-drive에서 before/after trace와 조작 체감 동시 제공
6. 이 구조가 검증된 뒤 12V full-fidelity case authoring
