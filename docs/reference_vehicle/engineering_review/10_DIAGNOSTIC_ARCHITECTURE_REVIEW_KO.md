# Diagnostic Architecture Review

## 필요한 분리

| Concept | Recommended placement |
|---|---|
| Fault Injection | Test environment/instrumentation |
| Error Observation | Application monitor 또는 measurement service |
| Monitoring | Domain-local monitor; threshold/time contract 포함 |
| Fault Detection | Diagnostic/application logic |
| Debounce / Confirmation | Diagnostic lifecycle service 또는 domain-specific diagnostic |
| Fault Memory / DTC-like record | Optional platform diagnostic service |
| Reaction | Domain control authority가 소비하는 typed constraint/request |
| Degraded State | Vehicle/domain availability state |
| Recovery Guard | Diagnostic + domain + Vehicle State의 staged authorization |
| Recovered State | Domain state; injector RESTORED와 별개 |
| Test Instrumentation | Production diagnostic hierarchy 밖 |

## 현재 maturity

현재 FaultInjectionRuntime은 stimulus window, delivered value, original-path restoration을 기록하는 좋은 educational seam이다. Case assessment는 game truth와 player evidence를 분리한다. 그러나 monitor threshold, debounce, confirmation, fault memory, reaction owner, recovery guard가 없다.

Fault/Diagnostics를 하나의 Domain으로 유지할 수 있지만 내부를 최소 세 responsibility group으로 나누는 편이 좋다.

1. Domain monitoring/detection.
2. Diagnostic lifecycle/status/memory.
3. Cross-domain reaction/recovery coordination.

Full UDS/DEM 구현은 현재 교육 범위에 필수적이지 않다. `pending → confirmed → reaction active → clearable → rearmed/recovered` 정도의 최소 lifecycle만 있어도 realistic diagnostic reasoning gameplay가 크게 개선된다.

## Gameplay suitability

강한 diagnostic case는 injector 자체가 정답이 아니라 first deviation, propagation, monitor observation, confirmation 조건, reaction, repair/replay를 추적하게 해야 한다. 현재 33 AI_DRAFT 대부분은 이 lifecycle과 oracle 부족으로 즉시 canonical truth가 될 수 없다.

## 결론

Diagnostic architecture는 **RESTRUCTURE_RECOMMENDED**다. 현재 injection/assessment 구현은 보존하고 production-like claims 없이 reference lifecycle을 보강해야 한다.
