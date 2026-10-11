# Control Logic Review

## Current VMC

`Trackback_VMC`를 Propulsion Torque Generation으로 제한한 것은 정확하다. 함수는 하나의 propulsion request와 speed를 torque map에 적용할 뿐 request arbitration, authority, brake/steering coordination, actuator allocation을 하지 않는다.

Reference Motion Coordination 자체는 필요하다. 다만 다음만 담당하도록 제한해야 한다.

- typed motion demands와 constraints 수집;
- authority/selection reason 산출;
- mutually exclusive 또는 constrained target 결정;
- actuator-domain allocation 결과와 provenance 제공.

Pedal interpretation, brake blending 내부 알고리즘, ABS wheel modulation, EPS control, energy state estimation, ADAS perception까지 넣으면 god VMC가 된다.

## Longitudinal control

현재 Driver accelerator → propulsion → torque → eDrive path는 coherent하다. Driver brake는 host adapter에서 torque generation 이후 drive force를 0으로 만든다. 이는 동작은 결정적이지만 architectural arbitration 위치로는 약하다.

Reference design에는 서로 다른 type이 필요하다.

- `LongitudinalMotionRequest`: driver/ACC가 원하는 vehicle-level motion.
- `EmergencyDecelerationRequest`: AEB처럼 authority 조건을 가진 request 후보.
- `DriveTorqueRequest`: propulsion-domain output.
- `BrakeDemand`: braking-domain target.
- `TorqueConstraint` / `BrakeConstraint`: TCS/Energy/Fault/actuator capability가 제공하는 limit.
- `ActuatorAllocation`: final drive/brake/steering assignment.

이는 필드를 채우기 위한 추가가 아니라 request와 constraint를 priority/order-dependent 변환으로 섞지 않기 위해 필요하다. 명칭과 정확한 물리량은 domain review 전 OPEN이다.

## Constraint aggregation

TCS, Energy, Fault, eDrive, speed-dependent limits는 일반적으로 independent constraints로 수집하고 effective feasible envelope를 산출하는 구조가 order dependence를 줄인다. 그러나 모든 constraint가 단순 min/max는 아니다. 상태 전이, invalid fallback, hysteresis, direction, rate limit가 있을 수 있으므로 generic scalar minimum으로 고정해서는 안 된다.

## Lateral control

현재 normalized driver input과 road-wheel angle command는 game host path다. LKA/ESC를 추가할 때 generic `SteeringRequest` 하나로 angle, torque, curvature, yaw-rate를 표현하면 안 된다. 가능한 reference options는:

1. vehicle-level curvature/yaw request 후 steering allocation;
2. EPS torque/angle request arbitration;
3. driver mechanical path를 유지하고 overlay assist torque를 적용.

세 option 모두 plausibility가 있어 repository만으로 하나를 선택할 수 없다.

## ADAS outputs

가장 방어 가능한 기본 방향은 ACC/AEB/LKA가 direct actuator command가 아니라 typed vehicle-motion request 또는 constraint를 내고, authority/coordination을 거치는 것이다. 다만 AEB가 brake controller에 직접 safety-priority request를 내는 architecture도 가능하다. Reference Vehicle은 하나를 승인하기 전 option과 unresolved decision을 명시해야 한다.

## Braking / Stability / Energy

ABS는 high-level brake source와 동일하지 않다. wheel-level modulation일 가능성이 높지만 정확한 placement는 외부 brake architecture 검토가 필요하다. Regen blending은 total brake objective와 actuator capability 사이에 있어야 하며 Energy는 availability/limits를 제공해야 한다. Energy가 final brake/drive command를 소유하면 cycle과 dual authority 위험이 커진다.

## 결론

현재 control model은 minimum propulsion case에는 충분하고 multi-source whole-vehicle control에는 부족하다. runtime 변경 없이 reference contracts를 먼저 재설계해야 한다.
