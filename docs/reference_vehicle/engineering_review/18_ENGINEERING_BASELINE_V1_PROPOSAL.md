# TRACKBACK Reference Vehicle Engineering Baseline v1.0 제안

## A. BASELINE-FROZEN CORE

- 16-area taxonomy와 area-kind 구분 원칙.
- Domain/Function/Subfunction과 Component/Runnable/Task/ECU 분리.
- Hierarchy, allocation, data flow, runtime call, trace, verification, propagation 관계 분리.
- Gear narrow reference semantics.
- PropulsionRequest → Propulsion Torque Generation → DriveTorqueRequest → eDrive command → adapter command → plant response 구분.
- `Trackback_VMC`는 Propulsion Torque Generation이며 full Motion Coordination이 아님.
- 60 Hz current runtime baseline과 direct TS/WASM transport.
- Plant truth ≠ sensor/estimate; command ≠ actual.
- Fault Injection ≠ diagnostic detection/recovery.
- OBSERVED/PASS/FAIL/root-cause proof 분리.
- CASE-PT-001 truth와 player-visible evidence 분리.

## B. BASELINE-WITH-OPEN-DECISION

- Vehicle State/Mode identity와 domain availability 필요성; exact transitions/owner는 OPEN.
- Motion Coordination identity; authority/constraint/allocation policy는 correction 전 OPEN.
- Braking/Steering/Stability/Energy domains; internal control architecture는 OPEN.
- Logical interface와 future transport mapping model.
- Test environment/harness/measurement/expected-source entity needs.
- Calibration provenance/status; value approval는 OPEN.

## C. FUTURE DESIGN ONLY

- ABS/TCS/ESC algorithms and placement.
- ACC/AEB/LKA feature/ODD/perception/output policy.
- Battery/HV/thermal/regen model.
- EPS/SbW authority and lateral request selection.
- CAN/Ethernet message mappings and supervision.
- Multi-rate runnables/tasks/scheduler/deadlines.
- Occupant restraint logic.
- Full production diagnostic services.

## D. SAFETY ANALYSIS PENDING

- Item Definition, Hazard, Operational Situation, Hazardous Event.
- Safety Goal, FSR, TSR, HW/SW safety requirements.
- Safe state, FTTI, ASIL, independence/decomposition.
- Safety verification and confirmation evidence.

이 항목은 formal analysis 전 approval 금지다.

## E. IMPLEMENTATION GAP

- Real Vehicle State Manager.
- Brake/Steering/Stability controllers.
- Motion authority/allocation runtime.
- Sensor/estimator and actuator feedback.
- Energy model.
- Diagnostic lifecycle/reaction/recovery.
- Network/multi-rate execution platform.

Implementation gap은 reference concept invalid를 의미하지 않는다.

## v1.0 Freeze 조건

Baseline-frozen core는 즉시 유지할 수 있다. 그러나 v1.0 전체 registry freeze 전에 Tier 0 및 common Tier 1 contract, SWR owner gate, critical signal semantic kinds를 승인해야 한다. Future Design Only는 OPEN 상태로 포함할 수 있으나 executable/canonical behavior로 승인해서는 안 된다.
