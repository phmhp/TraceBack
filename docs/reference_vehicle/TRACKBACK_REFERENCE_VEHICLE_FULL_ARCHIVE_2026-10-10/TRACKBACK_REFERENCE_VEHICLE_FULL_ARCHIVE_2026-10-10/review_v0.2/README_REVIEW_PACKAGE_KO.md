# TRACKBACK Phase 01~04 — 감사 반영 패키지 (2026-10-07)

## 성격

**제안된 정정 문서**이며 원본 코드 또는 승인된 Ground Truth를 바꾼 패치가 아닙니다. 최신 C/TS 프로젝트 소스를 이 세션에서 직접 받은 것이 아니라 Codex의 정적 보고를 근거로 했으므로, `CODE_AUDIT_REPORTED` 사실과 독립 구현 검증 완료를 혼동하지 말아야 합니다.

- `00_AUDIT_REVIEW_DECISIONS_KO.md`: 전체 22개 쟁점 재판정, 실제 path, 승인 필요한 결정, 안전/테스트 한계
- `01_..._REVIEWED_v0.2.md`: 차량 전체 Reference Architecture는 유지하고 구현 슬라이스/host assumptions 분리
- `02_..._REVIEWED_v0.2.md`: 74 LF `5 VERIFIED / 27 PARTIAL / 42 DESIGN_ONLY` 기준선
- `03_..._REVIEWED_v0.2.md`: 2-state Propulsion/Gear/physics/Brake priority와 Reference state 분리
- `04_..._REVIEWED_v0.2.md`: 신호/경계 실제 단위, 전달 관찰, timestamps, test/oracle 승인 축
- `04_*_REVIEWED.csv`: 원본 111+49 항목/ID를 유지하고 감사 열을 추가한 검토판
- `CODEX_G0_RECONCILIATION_PROMPT_KO.md`: 코드를 수정하기 전에 로컬 Codex에 전달할 Gate G0 승인-대기형 Plan 프롬프트

## 활용 순서

1. **기존** `docs/reference_vehicle/`의 원본을 backup 또는 commit. 이 패키지 문서를 `docs/reference_vehicle/review/`에 복사해 검토한다.
2. Reviewed v0.2에는 기존 문서 **본문을 삭제하지 않고** 상단에 정적 감사 보충/정정 우선 순위를 삽입했다. 원본의 `SRC_DRAFT`, `PROPOSED`, `CODEX_REPORTED` 라벨 자체는 역사적인 provenance로 남겼으므로, 상세 문장 충돌 시 **상단 v0.2 감사 섹션을 우선**한다.
3. P0 정책 결정(특히 brake-over-drive, readiness, calibration status)을 명시적으로 승인하기 전에는 원본 canonical registry에 덮어쓰지 않는다.
4. 필요한 경우 Codex로 `CODEX_G0...`를 실행해 **PLAN만** 받고, 코드 수정은 별도로 승인한다.

## 보존/주의

- 원본 74 LF, 111 Signal 후보, 49 boundary 후보, 기 작성된 세부 설명·Requirement ID를 보존한다.
- CSV에서 producer/range/shape를 소스 보고에 따라 일부 고쳤지만, 새 필드 `codeAuditConclusion`은 **감사 보고 기반**이지 코드 직접 실행 검증이 아니다.
- 새 Canonical Signal ID나 실제 CAN mapping을 만들어 승인한 것은 아니다.
- 별도 리뷰 후 Phase 05 Requirements를 시작할 것을 권고한다.
