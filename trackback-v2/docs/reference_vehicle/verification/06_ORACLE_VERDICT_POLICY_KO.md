# Phase 06 — Oracle / Verdict Policy

> Document: 06_ORACLE_VERDICT_POLICY_KO  
> Version: 0.3  
> Status: REVIEWED_DRAFT  
> Canonical: YES  
> Last Reviewed: 2026-10-10  
> Runtime Baseline: vehicle scenarios without executable expected behavior remain OBSERVED  
> Scope: oracle authority and verdict semantics

> 상태: ENGINEERING_PROPOSAL / NOT APPROVED

v0.3에서 `ExpectedSource`와 `MeasurementPoint`는 별도 entity다. `ExecutionRun`이 값을 관측했다는 사실만으로 verdict가 생기지 않는다. Architecture가 `OPEN`, `DESIGN_ONLY`, `EXTERNAL_VALIDATION_REQUIRED`인 경우 candidate TC는 보존하되 자동 `PASS/FAIL`을 금지한다. `HOST_DRIVE_BRAKE_ARBITRATION_POLICY` characterisation은 Reference Motion Coordination oracle이 아니다.

## 1. Oracle 종류

| Oracle | 사용 조건 | Verdict |
|---|---|---|
| `EXACT_VALUE` | 독립 계산식/승인 reference와 tolerance 존재 | PASS/FAIL 가능 |
| `RANGE` | 승인된 min/max 또는 limit | PASS/FAIL 가능 |
| `RELATIONSHIP` | `output <= limit`, monotonic relation 등 승인된 관계식 | PASS/FAIL 가능 |
| `STATE_TRANSITION` | 승인된 state/transition table | PASS/FAIL 가능 |
| `INTERFACE_EQUALITY` | 비교 가능한 양단과 전달 정책이 정의됨 | 좁은 interface verdict 가능 |
| `REGRESSION_BASELINE` | 현재 TRACKBACK 구현 보존 목적, provenance 명시 | regression 범위 PASS/FAIL만 가능 |
| `REFERENCE_CRITERION` | 문서상 참고 기준이나 runner와 자동 연결 안 됨 | 자동 verdict 금지 |
| `NONE` | expected 없음 | OBSERVED |

## 2. 금지 규칙

- requirement가 `DRAFT_NOT_APPROVED`인데 그 문장만으로 engineering PASS/FAIL을 만들지 않는다.
- `REVIEW_REQUIRED` calibration을 OEM/engineering-approved 값으로 표현하지 않는다.
- vehicle scenario의 눈에 보이는 움직임을 expected trajectory로 승격하지 않는다.
- fault injection 결과의 mismatch를 ECU fault detection 또는 root cause 확정으로 표현하지 않는다.
- canonical game-case answer와 independent diagnostic algorithm을 동일시하지 않는다.

## 3. 독립성

Implementation과 Oracle이 같은 함수를 그대로 호출하면 독립 Oracle이 아니다. 같은 calibration set을 공유하더라도 알고리즘은 분리할 수 있지만, 그 경우 Evidence에 calibration provenance/status를 기록해야 한다.

## 4. Tolerance

Tolerance는 floating-point이기 때문에 임의의 `1e-6`을 붙이는 방식으로 결정하지 않는다. 요구사항 resolution, data type/quantization, 계산 단계, physical/model uncertainty 중 어떤 이유로 tolerance가 필요한지 명시해야 한다. 근거가 없으면 `OPEN`이다.

## 5. OBSERVED의 의미

`OBSERVED`는 실패나 미실행이 아니다. Runner는 실제로 실행됐지만 승인된 verdict criterion이 없다는 뜻이다. 차량 scenario는 현재 이 상태를 정상적으로 지원해야 한다.
