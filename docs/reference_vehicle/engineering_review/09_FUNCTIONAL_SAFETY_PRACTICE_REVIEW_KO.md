# Functional Safety Practice Review

## 비준수 선언

이 리뷰는 ISO 26262-inspired workflow 관점의 구조 검토이며 compliance, ASIL, safety approval을 주장하지 않는다. Repository에는 승인된 Item Definition, HARA, S/E/C rationale, Hazardous Event, Safety Goal, FSR, TSR, HW/SW Safety Requirement가 없다.

## Normal과 Safety trace

현재 FR/SYSR/SWR/SIMR은 normal functional/reference requirements다. 고장 가능성이나 fault case가 존재한다는 사실만으로 safety requirement가 되지 않는다. Future schema는 safety trace를 별도 lifecycle/approval branch로 모델링해야 한다.

| Safety concept | Current capability | Review |
|---|---|---|
| Item / Function Scope | PARTIALLY_SUPPORTED | Domain/Function scope는 있으나 formal Item boundary/ODD/interface 없음 |
| Hazard | MISSING_CONCEPT | Fault/Symptom과 Hazard를 동일시하면 안 됨 |
| Operational Situation | PARTIALLY_SUPPORTED | Scenario/environment 후보는 있으나 safety situation evidence 아님 |
| Hazardous Event | MISSING_CONCEPT | Hazard+operational situation 결합 및 approval 없음 |
| Safety Goal | MISSING_CONCEPT | 생성/승인 금지 상태가 올바름 |
| FSR | MISSING_CONCEPT | normal SYSR과 분리 필요 |
| TSR | MISSING_CONCEPT | allocation/decomposition/independence 정보 없음 |
| HW/SW Safety Requirement | MISSING_CONCEPT | current SWR는 safety requirement가 아님 |
| Safety Mechanism | PARTIALLY_SUPPORTED | monitor/fault reaction 후보는 있지만 safety mechanism claim 불가 |
| Safety Verification Evidence | PARTIALLY_SUPPORTED | generic Evidence/Test는 있으나 independence/authority 없음 |
| Safe State | MISSING_CONCEPT | degraded/zero torque 예시를 safe state로 승인할 수 없음 |
| FTTI / reaction time | MISSING_CONCEPT | 10/20 ms 예시는 근거가 아님 |
| Independence/decomposition | MISSING_CONCEPT | allocation/ASIL decomposition 근거 없음 |

## Learner 오해 위험

`05_SAFETY_TRACE_GATE_KO.md`는 현재 상태를 정확히 경고한다. 다만 requirement/case catalogs에서 safety-related language를 볼 때 normal candidate와 safety-approved requirement를 혼동할 수 있다. Phase 08은 `safetyLifecycleStatus`, `sourceHazardousEventId`, `approvalEvidenceId`가 없으면 safety relation을 생성하지 못하게 해야 한다.

## 결론

Normal functional architecture correction은 safety analysis와 독립적으로 진행할 수 있다. Safety branch의 engineering maturity는 **PENDING / NOT APPROVED**다.
