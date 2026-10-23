# TRACKBACK — Phase 03 감사 + Phase 04 설계 패키지

## 결과 범위

- **문서 감사:** 제공된 Phase 01~03 및 기초 명세/기능안전 Case 작성 규칙을 비교해 모순·근거 부족·미정책·실행 가능성 과장을 찾아낸 1차 감사. 실제 코드 검증 아님.
- **Phase 04:** 16개 영역/74개 LF 기준으로 111개 참고/후보 Signal·Event·Calibration 항목, 49개 경계 관계 후보, 시간·단위·유효성·Producer/Consumer·Interface 비교 계약을 정리.
- 모든 신규 항목은 Ground Truth 미승인. 기존 `Architecture.ts`, `Trace.ts`, `PropulsionGroundTruth.ts`를 자동 수정하지 않음.

## 파일을 읽을 순서

1. `PHASE03_DESIGN_AUDIT_KO.md` — 가장 먼저 P0/A01~A28를 이해한다.
2. `04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md` — 본문을 읽으며 16개 영역별 신호·경계·후속 검증 기법을 확인한다.
3. `04_SIGNAL_CANDIDATE_CATALOG.csv` — Excel 등에서 sourceStatus, 생산자/소비자, clock, catalogKind 등을 필터한다.
4. `04_INTERFACE_BOUNDARY_CANDIDATES.csv` — 각 도메인 사이의 자료 전송/변환 후보를 검토한다.
5. `TRACKBACK_CODE_AUDIT_REQUEST_KO.md` — 실제 소스와 대조하기 위해 Codex/Antigravity에게 전달한다.

## 20개 파일 업로드 제한 대책

- **지금까지 이 대화에 첨부한 Phase 01~03 문서들은 이미 접근 가능하므로 재업로드할 필요가 없다.** 앞으로는 `PHASE04_DRAFT_AND_AUDIT_KO.zip` 한 파일을 보관하면 여러 자료를 하나로 관리할 수 있다.
- 로컬 소스가 필요할 경우 `PROJECT_CODE_SNAPSHOT.zip` 한 개를 따로 만들어 업로드하거나, Codex가 로컬에서 `TRACKBACK_CODE_AUDIT_REQUEST_KO.md`대로 코드를 감사한 **산출물 3개만** 전달한다.
- ZIP에는 `src/`, C/WASM src·headers·binding, `docs/`, `tests/`, `package.json`, lockfile, runtime/calibration config만 포함. `.git/`, `node_modules/`, `dist/`, 빌드 캐시, 비밀키·API tokens, 고객사 기밀, 개인정보는 제외한다. 공유 권한 확인 없이 소스를 업로드하지 않는다.
- 원본 파일을 하나의 초대형 Markdown으로 무조건 합치면 오히려 변경 추적과 citation 근거가 나빠진다. **문서별 고유 ID와 ZIP + manifest로 관리**하는 편이 적절하다.

## 승인 규칙

- `DOCUMENT_CONFIRMED`는 '그 문서에 등장'이지 기술적으로 올바른 값 보증이 아님.
- `CODEX_REPORTED`는 아직 `CODE_VERIFIED`가 아님.
- `PROPOSED` 신호/관계는 실제 코드 경로, 필요성, 타입, 단위, 완결된 guard 검토 전 canonical signal로 추가하면 안 됨.
- `OPEN` 값에 임의 정상 Expected/timeout/ASIL/고장 위치·회복 전이 채우지 않음.

## 이번 결과에 대한 정확한 완료 판정

- Phase 03 설계 **문서 감사 1차 완료, 저장소 코드 감사 미완료**.
- Phase 04 Signal/Interface **후보 설계 초안 완료, approved registry 구축 및 실행코드 반영 미완료**.
- Phase 05 Requirements 작성은 P0 설계 결정을 먼저 처리하고, 인증 수준의 기능안전 주장을 하지 않는 조건에서 진행한다.
