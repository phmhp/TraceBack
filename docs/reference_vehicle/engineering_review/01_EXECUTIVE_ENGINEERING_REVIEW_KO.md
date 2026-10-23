# 독립 공학 아키텍처 리뷰 — Executive

## 최종 Engineering Gate

**NOT_ENGINEERING_READY**

Reference Vehicle의 분해 원칙과 narrow propulsion runtime 경계는 기술적으로 방어 가능하다. 그러나 공통 longitudinal authority와 핵심 state ownership이 아직 freeze 가능한 contract가 아니며, 이를 그대로 Phase 08 registry truth로 만들면 알려진 구조적 ambiguity를 고착한다. 전면 폐기 대상은 아니고 **PROCEED_TO_CORRECTION**이 적절하다.

## 가장 강한 5개 부분

1. Logical Function과 runtime implementation status를 분리한 74-LF 모델.
2. PropulsionRequest → DriveTorqueRequest → EDriveCommand → force → plant response의 semantic separation.
3. Gear request/validity/interlock/applied state의 좁지만 실행 가능한 경계.
4. OBSERVED, PASS/FAIL, root-cause proof와 player evidence를 분리한 verification/case 정책.
5. Direct call/WASM, plant truth, host assumptions, fault injection을 CAN/sensor/diagnostic logic으로 과장하지 않는 non-claim 규칙.

## 가장 약한 10개 부분

1. final longitudinal authority와 allocation owner 부재.
2. Brake demand/coordination/blending/final command chain의 미정의.
3. ABS 역할의 request/constraint/modulation 혼재.
4. TCS/Energy/Fault/eDrive limit aggregation 규칙 부재.
5. steering/lateral request 물리량 미정.
6. Driver/LKA/ESC authority 부재.
7. ACC/AEB/LKA output abstraction 혼재.
8. Vehicle State/permission/degraded/recovery owner 미정.
9. diagnostic confirmation/reaction/recovery lifecycle 부재.
10. 62 SW_OWNER_TBD와 138개 requirement maturity issue.

## 누락된 essential function

Minimum-drivable runtime은 현재 가능하나 Reference Vehicle v1에는 다음 최소 개념이 명시적으로 필요하다: final longitudinal authority/constraint aggregation, total brake demand/final brake command ownership, reset/initialization ownership, domain availability aggregation. Actuator feedback, command tracking, data freshness, diagnostic lifecycle은 practical/educational base에 필요하지만 현재 runtime 구현은 요구하지 않는다.

## 30개 Critical Question 답변

| # | 답변 |
|---:|---|
| 1 | 16 areas는 폭넓은 reference taxonomy로는 좋지만 controller/domain/platform/plant가 같은 층에 있어 restructuring이 필요하다. |
| 2 | Current minimum-drivable path는 존재한다. Reference freeze에는 total brake/final authority/reset ownership이 부족하다. |
| 3 | Practical base에는 actuator feedback, constraint aggregation, domain availability, data freshness가 부족하다. |
| 4 | Communication과 Execution은 vehicle function보다는 platform concern이며 Actuation/Plant는 physical boundary다. 동일 hierarchy level이라는 오해를 막아야 한다. |
| 5 | Motion Coordination 필요성은 타당하나 input/output contract가 under-defined다. |
| 6 | 모든 cross-domain 정책을 수용하면 god VMC 위험이 높다. authority/constraint selection/allocation만 담당해야 한다. |
| 7 | Vehicle State/Mode는 불충분하다. host readiness 외 owner/state/permission/degraded/recovery가 없다. |
| 8 | Gear는 교육용 좁은 scope에는 충분하다. physical engagement/actuator fault는 unavailable로 남겨야 한다. |
| 9 | Propulsion core는 current runtime에 맞춰져 있으나 request/command 경계는 재사용 가능하다. calibration/state 확장은 열어둬야 한다. |
| 10 | Braking은 충분히 정의되지 않았다. temporary adapter는 controller architecture가 아니다. |
| 11 | ABS conceptual level은 미정이다. wheel-level modulation과 high-level constraint를 구분해야 한다. |
| 12 | Brake blending ownership은 현재 방어 불가다. |
| 13 | Steering은 host control로는 충분하지만 reference controller로는 불충분하다. |
| 14 | Lateral request abstraction은 미정이며 generic steering request로 freeze하면 안 된다. |
| 15 | Stability는 논리적으로 통합 가능하지만 sensing/role/allocation 결정이 선행돼야 한다. |
| 16 | ADAS는 typed motion request/constraint 경계를 통하면 통합 가능하다. direct actuator bypass는 금지해야 한다. |
| 17 | Energy/Power를 별도 area로 두는 것은 타당하지만 command owner가 아니라 availability/constraint provider로 제한하는 편이 방어 가능하다. |
| 18 | 현재 regen/brake/energy ownership에는 cycle 위험이 있다. execution phase 또는 feed-forward constraint contract가 필요하다. |
| 19 | Fault/Diagnostics scope는 필요하지만 test injection, monitor, diagnostic, reaction, recovery, platform memory를 분리해야 한다. |
| 20 | Communication/Execution은 적절한 관심사지만 platform/service layer로 명시해야 한다. |
| 21 | Plant boundary는 current propulsion cases에는 충분하고 ABS/ESC/AEB/LKA에는 wheel/object/lane/actuator feedback이 부족하다. |
| 22 | semantic vocabulary는 좋은 출발이나 30개 signal issue가 남아 충분하지 않다. |
| 23 | FR/SYSR/SWR/SIMR 구분은 사용 가능하지만 owner/allocation과 decomposition quality가 부족하다. |
| 24 | Safety trace 방향은 개념적으로 맞고 현재 미승인 표기도 정직하다. schema concepts는 아직 불완전하다. |
| 25 | Verification policy는 실제 embedded-SW 원칙에 가깝지만 runner/environment/harness/stub/coverage artifact 모델이 더 필요하다. |
| 26 | 의미 있는 진단 gameplay를 지원할 수 있다. 최소 diagnostic lifecycle과 command/actual observation이 보강돼야 한다. |
| 27 | 숙련 엔지니어는 brake/stability/ADAS authority, state ownership, SW_OWNER_TBD를 먼저 비판할 가능성이 높다. |
| 28 | arcade torque-to-force, perfect plant truth, two-state propulsion, temporary brake/steer는 의도된 교육적 단순화다. |
| 29 | Phase 08 freeze 전 final authority, typed request/constraint/allocation, lateral abstraction, vehicle-state ownership을 해결해야 한다. |
| 30 | ABS/ADAS/Energy/Occupant/CAN/safety의 내부 정책은 DESIGN_ONLY+OPEN으로 schema에 표현 가능하다. canonical behavior로 freeze만 하지 않으면 된다. |

## P0 재분류

15개 P0는 `CORE 1 / DOMAIN 10 / REQUIREMENT 1 / VERIFICATION_ORACLE 1 / SAFETY 1 / IMPLEMENTATION_GAP_ONLY 1`로 재분류했다. Schema design 자체를 모두 막지는 않지만, 12개는 affected registry freeze를 막는다.
