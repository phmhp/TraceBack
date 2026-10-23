# Maintainability and Extensibility Review

## 확장 가능성

Typed Domain/Function/Signal/Requirement/Test/Case identity와 provenance 축은 새로운 기능을 추가하기 좋은 기반이다. 그러나 page-specific data와 runtime registry로 직접 연결하기 전에 allocation, request semantics, visibility, oracle authority를 graph 관계로 고정해야 한다.

## 확장별 요구

- New Domain: `areaKind`, scope, owner boundary, dependency 방향 필요.
- New Function: responsibility, typed inputs/outputs, state/authority, validation status 필요.
- New SW Component/Runnable/Task: Function과 분리된 allocation/deployment entity 필요.
- New sensor/actuator: truth/sensor/estimate/command/actual 및 unit/time/quality 계약 필요.
- CAN/Ethernet: logical interface를 유지하고 별도 transport/message mapping을 추가해야 함.
- Safety requirement: normal requirement와 다른 lifecycle/approval trace 필요.
- Test environment/method: runner, harness, stub, measurement, oracle capability 필요.
- Fault case: canonical truth, player visibility, defect/propagation/repair/replay/oracle 분리 필요.

## Phase 08 fragility risks

1. Generic `request` entity가 incompatible physical meanings를 숨김.
2. Function hierarchy와 SWC/runtime allocation을 같은 edge로 저장함.
3. Structural interface를 endpoint telemetry로 자동 승격함.
4. owner TBD를 빈 문자열로 처리해 implicit owner를 만듦.
5. design-only timing/CAN/sensor/safety를 capability로 노출함.
6. page query가 hidden case truth를 직접 읽음.
7. candidate requirement/TC/case를 lifecycle 없이 canonical로 import함.

## 외부 검증 대상

ABS/TCS/ESC placement, brake blending, steering abstraction, EPS authority, ADAS request model, torque coordination, Vehicle State ownership, diagnostic recovery, energy/regen, multi-rate execution, plant fidelity, safety architecture는 repository 단독으로 확정할 수 없다. 이들은 schema에서 OPEN으로 표현 가능하지만 affected registry behavior로 freeze하면 안 된다.

## 결론

Architecture는 확장 가능한 방향이지만 current common-control contracts를 먼저 교정해야 한다. 기존 ID를 바꾸기보다 entity type/relation/status를 보강하는 migration이 안전하다.
