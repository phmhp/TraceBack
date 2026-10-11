# TRACKBACK — Correction Design Gate G0 (no runtime behavior change)

당신은 TRACKBACK의 source-truth/capability 정합성 교정 담당자다. 프로젝트 root에서 수행하라.

## Source
- docs/reference_vehicle/ (기존 canonical 설계 입력 경로)
- 사용자 제공한 `*_REVIEWED_v0.2.md`, `00_AUDIT_REVIEW_DECISIONS_KO.md`, `*_REVIEWED.csv`
- docs/reference-vehicle/audit/ 의 역사적 5개 감사 보고서
- 현재 src/c/tests 및 product reconciliation baseline

먼저 모든 source 문서와 실제 코드가 최신인지 확인하라. 작업 전 `git status`와 예상 변경 파일 목록을 보고하라.

## 이 Gate에서 수행할 일
1. 74 LF runtime coverage(5/27/42 기준)를 **실제 코드와 재검토**하고 architecture metadata에 design vs runtime role을 분리하는 최소 변경안을 설계한다.
2. 실행 Trackback_VMC는 `Propulsion Torque Generation`으로 사용자 표시/할당만 좁게 설명하고, 미래 `MOTION_COORDINATION`은 design-only 상태로 분리한다. production C function 이름과 ABI는 건드리지 않는다.
3. VehicleReady (host physics presence)와 PropulsionEnable (host true 입력; publish semantic 별도)을 actual vehicle state와 구분해 문서·표시 모델을 정리한다. new ECU state machine을 발명하지 않는다.
4. 21 approved requirement statement와 calibration REVIEW_REQUIRED를 다차원 status로 표현할 계획을 세운다. 기존 approval을 허위 human approval로 표현하지 않는다.
5. TC-001~005 placeholder는 unresolved로 표기하고, TC-011/012 CI automation vs player workbench 능력을 분리한다. 자동으로 상세 TC를 만들어내지 않는다.
6. Interface registry structural edges와 actual runtime transfer, injected boundary pair, source/dest observation을 분리한다. eDrive→DriveAdapter clone pair를 별도 CAN sender/receiver sample이라 하지 않는다.
7. docs/reference_vehicle와 docs/reference-vehicle 경로는 중복 생성/이동/삭제하지 말고 canonical migration plan만 제안한다.

## 엄격한 금지
- Brake override 정책 이동/변경, UI 전체 재설계, C/WASM logic rename, Fault Injection logic 변경, 시험 oracle/CASE truth 변경, 새 domain/신호/TC 생성 금지.
- 테스트에서 생성/갱신되는 evidence JSON 등 상태 변경 위험을 분석한 후 안전한 test selection을 제안하라. 사용자의 명시적 승인 없이 evidence artifacts 재생성 금지.
- 결함 정정과 미래 기능 구현을 혼동하지 마라.

## 출력
A. 코드 대조 검사 결과(각 소스 file/line)
B. 이 Gate에서 바꿔도 되는 문서/metadata 변경 목록
C. 실제 동작 변경이 수반되는 별도 Gate G1 변경 목록
D. 예상 test 및 회귀 영향
E. user approval decisions

먼저 PLAN/DIFF PREVIEW를 내고 STOP. 사용자 승인 전 자동 코드 변경하지 마라.
