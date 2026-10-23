# Hierarchy and Scope Review

## 계층 원칙

`Vehicle → Domain/Logical Area → Function → Subfunction`은 책임 hierarchy다. `Function → SWC → Runnable → Task/ECU`는 allocation/deployment다. Interface/Signal은 data contract, Requirement/Test/Case/Evidence는 lifecycle trace, Plant는 controlled physical model이다. 이들을 하나의 parent-child tree로 합치면 안 된다.

현재 가장 큰 혼합은 16 areas가 application control domains, platform services, sensing infrastructure, physical plant를 같은 수준으로 제시하는 점이다. taxonomy로는 허용되지만 Phase 08은 `areaKind`를 두어 구분해야 한다.

## 16 areas 판정

| Area | Classification | 이유 |
|---|---|---|
| Driver & Environment | SPLIT_CANDIDATE | Driver intent와 environment truth/provider는 ownership과 verification 방식이 다름 |
| Vehicle State / Mode | KEEP_WITH_RESTRUCTURE | 공통 permission/availability에 필수지만 owner와 orthogonal state가 미정 |
| Gear | KEEP | 좁고 cohesive하며 실행/참조 경계가 명확함 |
| Propulsion | KEEP | request/torque/command 책임이 비교적 cohesive함 |
| Braking | KEEP_WITH_RESTRUCTURE | demand, blending, stability modulation, final command를 재구성해야 함 |
| Steering | KEEP_WITH_RESTRUCTURE | input interpretation와 EPS/lateral request abstraction을 분리해야 함 |
| Stability | KEEP_WITH_RESTRUCTURE | ABS/TCS/ESC는 유지 가능하나 common sensing/coordination 관계 미정 |
| Motion Coordination | KEEP_WITH_RESTRUCTURE | 필요하지만 authority/constraint/allocation으로 scope 제한 필요 |
| ADAS | KEEP | optional advanced request sources로 유효; direct actuator owner가 되어서는 안 됨 |
| Sensing / Estimation | KEEP_WITH_RESTRUCTURE | plant truth/sensor/estimate/quality를 명시적으로 분리해야 함 |
| Power / Energy | KEEP_WITH_RESTRUCTURE | state/availability/constraints 제공자로 scope 제한 필요 |
| Occupant Safety | QUESTIONABLE_SCOPE | reference breadth에는 유효하나 current gameplay/control baseline과 결합 근거가 약함 |
| Fault Management / Diagnostics | SPLIT_CANDIDATE | monitoring/application reaction/platform diagnostic memory/test injection이 혼재할 위험 |
| Communication | RENAME_RECOMMENDED | `Communication / Data Transport Services`로 logical interface와 transport를 구분하는 편이 명확 |
| Execution / Platform | RENAME_RECOMMENDED | `Execution Platform Services`로 application function과 분리 |
| Actuation / Plant | SPLIT_CANDIDATE | actuator adaptation/feedback와 physical plant는 다른 layer |

## 불필요하거나 과도한 hierarchy

- 모든 design-only capability를 독립 LF로 두면 74 LF가 과도하게 fragment될 수 있다. 그러나 추적/교육 목적상 유지 가능하며 `functionKind`로 controller, monitor, manager, service, plant adapter를 구분해야 한다.
- Fault Injection, player evidence, case assessment는 vehicle hierarchy가 아니라 verification/game layer다.
- Plant Motion과 Plant Environment는 software Function이 아니라 plant model capability다. 같은 ID namespace를 유지하더라도 entity type을 분리해야 한다.

## 누락 hierarchy

- Component/SWC, Runnable, Task, ECU/Execution Node의 machine-readable allocation layer.
- Logical Port와 transport mapping 사이의 explicit boundary.
- Controller command와 actuator feedback 사이의 observation layer.
- Test Environment, Harness, Stub, Measurement Point, Execution Run entity.

## 권고

16 areas를 즉시 삭제/병합하지 말고 taxonomy를 보존하되 `APPLICATION_CONTROL`, `STATE_COORDINATION`, `SENSING_SERVICE`, `PLATFORM_SERVICE`, `ACTUATION_BOUNDARY`, `PLANT_MODEL`, `OPTIONAL_ADVANCED` 같은 area kind를 도입한다. 이는 runtime 변경 없이 common schema의 abstraction 혼합을 막는다.
