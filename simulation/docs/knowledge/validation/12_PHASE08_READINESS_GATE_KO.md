# Phase 08 Readiness Gate

## 판정: NOT_READY

## Gate 결과

| READY 조건 | 결과 | 근거 |
|---|---|---|
| unresolved P0 architecture contradiction 없음 | FAIL | 15개 P0가 남아 있음 |
| every final control command has explicit owner | FAIL | brake, lateral, ADAS, stability, fault reaction final owner 미정 |
| hierarchy/allocation/data-flow 관계 분리 | PASS | canonical 개념과 interface 축은 분리됨 |
| 필요한 signal meaning 명확 | FAIL | semantic issue 30개; steering/feedback/host-state 중심 |
| architecture redesign가 필요한 invalid trace 없음 | CONDITIONAL | structural dangling 0이나 authority 결정 후 relation 재설계 필요 |
| registry 입력 requirement level 유효 | FAIL | 62 owner-blocked, 34 refinement, 42 unverifiable |
| hidden truth와 player evidence 분리 | PASS | visibility policy와 CASE-PT-001 경계가 명확 |

## Phase 08 전에 닫아야 할 최소 P0

1. longitudinal final authority와 drive/brake actuator allocation.
2. ABS/TCS/ESC 역할과 constraint/application 순서.
3. brake blending 및 final brake command owner.
4. lateral request abstraction과 Driver/LKA/ESC authority.
5. ACC/AEB/LKA output contract 및 AEB priority.
6. energy constraint/regen/brake interaction.
7. fault confirmation/reaction/recovery lifecycle과 authority.
8. 62 `SW_OWNER_TBD` 중 공통 schema에 들어갈 항목의 allocation.

## 지금 허용되는 작업

- validation 결과 리뷰와 owner decision workshop.
- DESIGN_ONLY entity의 provenance/status vocabulary 보완 계획.
- schema prototype을 코드/registry에 적용하지 않는 문서 수준 검토.

## 아직 허용되지 않는 freeze

- unresolved request types를 하나의 generic request로 합치는 것.
- host adapter policy를 Motion Coordination 구현으로 등록하는 것.
- design-only CAN/sensor/timing/safety capability를 runtime truth로 등록하는 것.
- 180 requirement와 34 case를 일괄 canonical-approved로 승격하는 것.

## 재평가 기준

P0 decisions가 승인되고 LF/signal/requirement/case matrices가 갱신된 뒤 동일한 48개 scenario와 18개 counterexample을 다시 적용한다. 모든 final command가 단일 owner와 typed constraint provenance를 갖고, registry 대상 requirement가 유효한 level/owner/verification disposition을 가지면 `READY_WITH_CONSTRAINTS` 또는 `READY`를 재평가할 수 있다.
