# Verification Practice Review

## 올바른 구분

- Requirements-based testing은 requirement에서 condition/input/output/criterion을 도출한다.
- Equivalence/Boundary/Decision-table/State-transition/Pairwise는 test design technique다.
- Oracle은 expected/verdict authority이며 technique와 별개다.
- Fault injection은 stimulus technique이지 detection proof가 아니다.
- Repository automated test와 player workbench execution은 runner/evidence가 다르다.
- Interface registry edge는 endpoint comparison이 아니다.
- Observed vehicle behavior는 executable expected가 없으면 `OBSERVED`다.

## 보강이 필요한 개념

| Concept | Current maturity | Required clarification |
|---|---|---|
| Test Environment | PARTIAL | component runner/vehicle scenario/repository runner identity |
| Harness | PARTIAL | C/WASM seam과 TS/plant setup의 명시적 entity |
| Stub/Mock | WEAK | controlled dependency와 fidelity/provenance |
| Measurement Point | PARTIAL | semantic signal + observed-at endpoint + timestamp |
| Calibration | PARTIAL | statement approval과 별도 status/provenance |
| Expected Source | PARTIAL | independent calculation/reference/regression/game truth 구분 |
| Tolerance | WEAK | numeric resolution/uncertainty/requirement 근거 |
| Execution Run | PARTIAL | build/hash/config/time/result artifact |
| Structural Coverage | MISSING | instrumentation 없이는 claim 금지 |
| MIL/SIL/HIL | MISSING | execution representation/hardware boundary 정의 필요 |
| Back-to-back | MISSING | 비교 대상 두 representation과 equivalence rule 필요 |

MIL과 SIL은 단순히 서로 다른 UI mode가 아니다. HIL은 실제/representative hardware I/O boundary가 필요하다. B2B는 두 개의 정의된 실행 representation과 비교 tolerance가 있어야 한다. Statement/branch/MC/DC는 instrumented coverage artifact가 있어야 한다.

## Architecture testability

Gear/Propulsion/eDrive/Clock/current adapter/plant regression은 비교적 명확하다. Brake coordination, blending, Stability, Motion authority, ADAS, diagnostics는 unit boundary와 oracle이 불명확해 reference TC가 있어도 실행 가능하지 않다. `12_TEST_ARCHITECTURE_REVIEW.csv`에 representative boundary를 기록했다.

## 결론

Verification policy의 방향은 **STRONG_REFERENCE_STRUCTURE**에 가깝다. 실무 수준으로 가려면 environment/harness/stub/measurement/expected-source/coverage entities를 Phase 08 schema에 추가해야 한다.
