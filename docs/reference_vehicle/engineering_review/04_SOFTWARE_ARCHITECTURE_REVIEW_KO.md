# Software Architecture Review

## 강점

- current C/WASM component seam과 TypeScript host/adapter/plant 경계가 추적 가능하다.
- request, torque request, eDrive command, force command, plant response를 동일 signal로 alias하지 않는 방향이 옳다.
- reference function과 runtime implementation status를 분리한다.
- test injection과 production diagnostic을 구분한다.

## 구조 문제

### Function / Component / Runnable / Task

Function은 무엇을 해야 하는지, Component는 누가 소유하는지, Runnable은 실행 가능한 entry point, Task/Scheduler는 언제 어떤 순서로 실행하는지 나타내야 한다. 현재 documents는 이 개념을 설명하지만 canonical machine model에는 allocation entity가 없다. `Trackback_VMC` C symbol을 logical Motion Coordination과 동일시하지 않은 결정은 정확하다.

### Application / Platform

Communication과 Execution은 application vehicle function처럼 보이면 안 된다. logical interface는 transport와 독립이고, network supervision/scheduler/watchdog는 platform service다. 60 Hz SimulationClock은 task scheduler의 대체물이 아니다.

### Controller / Plant

EDrive adapter와 temporary brake/steering adapter가 policy와 physical conversion을 함께 가진다. current runtime에는 정직하지만 reference architecture에서는 command ownership, unit conversion, plant application을 분리해야 한다. Rapier truth는 sensor/estimate가 아니다.

### Production monitoring / Test instrumentation

eDrive same-tick pair와 FaultInjectionRuntime은 observability/test seam이다. controller monitor, diagnostic detector, network receiver와 동일 component로 배치하면 안 된다.

## Coupling과 cycle

- Energy→torque constraint→regen blend→energy state가 동일 logical step에서 되먹임되면 algebraic/cyclic ownership 위험이 있다.
- Stability가 torque와 brake를 동시에 요청하고 Motion Coordination이 Stability 상태를 다시 요구하면 cycle이 생길 수 있다.
- Vehicle State가 domain availability를 집계하면서 각 domain이 Vehicle State permission을 input으로 요구할 때 initialization ordering이 필요하다.

## Testability/replaceability

Propulsion/Gear/C seam은 대체와 component test가 가능하다. Braking/Stability/Motion/ADAS는 request type과 owner가 없어 unit boundary를 정의하기 어렵다. Phase 08은 component allocation을 강제하기보다 unresolved allocation을 표현하되 final-command owner uniqueness validation을 제공해야 한다.

## 결론

공통 software architecture vocabulary는 방어 가능하지만 allocation/deployment model이 부족하다. current runtime은 유지할 수 있으며 correction은 우선 documentation/schema semantics에서 가능하다.
