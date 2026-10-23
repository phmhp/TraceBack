# Runtime vs Reference Vehicle Model Gap

## Current executable chain

```text
DriverInputRuntime
  -> GearLogic (C/WASM)
  -> Propulsion (C/WASM)
  -> Trackback_VMC [Propulsion Torque Generation] (C/WASM)
  -> eDrive directional saturation / teaching case variant (C/WASM)
  -> optional fault injection at supported boundary
  -> EDriveToVehiclePhysicsAdapter
  -> Temporary Brake + Steering adapters
  -> Rapier plant
  -> plant state sampled for the next fixed tick
```

The fixed simulation timestep is 1/60 s. There is no independent runnable scheduler, CAN stack, ECU deployment, sensor-estimation pipeline, or full vehicle-motion arbitration implementation.

## Runtime role map

| Reference area | Current executable evidence | Canonical runtime status | Principal gap |
|---|---|---|---|
| Driver & Environment | Keyboard/input runtime with normalized accelerator, brake, steering, gear request | PARTIAL | No production input devices/environment sensing |
| Vehicle State / Mode | Host readiness/enable assumptions and race lifecycle | PARTIAL | No Vehicle State Manager ownership/state machine |
| Gear | C GearLogic with validity and D/R speed interlock | VERIFIED within simulation contract | No actuator/park/brake interlock model |
| Propulsion | C state/request logic and pedal/direction handling | VERIFIED within simulation contract | Host-owned readiness and review-required calibration |
| Braking | Temporary normalized-input-to-force adapter; drive suppression policy | PARTIAL host adapter | No Brake Controller/ABS/regeneration arbitration |
| Steering | Temporary demand-to-wheel-angle adapter | PARTIAL host adapter | No EPS/SbW controller or feedback |
| Stability | Rapier dynamics only | DESIGN_ONLY controller domain | No wheel-slip/yaw sensing or ESC |
| Motion Coordination | Single propulsion torque map named VMC | DESIGN_ONLY as whole function; narrow helper executes | No multi-request arbitration, authority, allocation |
| ADAS | No current controller | DESIGN_ONLY | No perception/ODD/ADAS actuation path |
| Sensing / Estimation | Rapier plant values directly available | DESIGN_ONLY as sensor/estimator | Ground truth is not sensor output |
| Power / Energy | Directional torque limits only | PARTIAL reference constraint at most | No battery/HV/thermal/energy state |
| Occupant Safety | None | DESIGN_ONLY | No restraint/impact logic |
| Fault Management / Diagnostics | FaultInjectionRuntime and game case assessment | PARTIAL test stimulus/game logic | No detection, confirmation, DTC, reaction, ECU recovery |
| Communication | TS calls and C/WASM ABI | PARTIAL direct software boundary | No CAN messaging, timing, queues, timeout supervision |
| Execution / Platform | Fixed simulation loop and WASM module | PARTIAL simulation platform | No ECU tasks/OS/deadline monitoring |
| Actuation / Plant | Adapter commands and Rapier vehicle physics | PARTIAL | Arcade torque-to-force gain; no physical actuator/torque feedback |

## Critical semantic boundaries

### VMC

`Trackback_VMC(request, speed, calibration)` selects a direction-specific maximum/zero-speed map and emits a non-negative torque request. It does not arbitrate brake, steering, stability, ADAS, or multiple authorities. Runtime/UI semantic role must be **Propulsion Torque Generation**. The logical Vehicle Motion Coordination function stays DESIGN_ONLY.

### eDrive and plant

`EDriveCommand` is a direction, validity, and magnitude command. It is not actual shaft torque. The adapter signs and multiplies the magnitude by the simulation `10 N/Nm` gain to make a force command. Rapier then produces motion. No actual torque measurement exists.

### Brake and steering

The brake adapter applies up to 6500 N and the steering adapter converts normalized demand into a speed-shaped wheel angle. These are temporary host adapters. They do not establish implemented Brake Controller or EPS functions.

### Lifecycle inputs

`VehicleReady` is presently tied to host physics availability and `PropulsionEnable` is a host lifecycle assumption. They are valid runtime inputs but not evidence of an implemented Vehicle State Manager output.

### Fault semantics

Fault injection changes a supported input/boundary during a window and can restore the original path. This proves stimulus application and restoration telemetry only. It does not prove in-ECU detection, confirmation, reaction, DTC storage, or recovery.

### Verification semantics

- Component C/WASM paths can produce PASS/FAIL only where the registered expected criterion is executable.
- Vehicle scenario execution is real and deterministic within its supported subset, but currently returns `OBSERVED` without a vehicle-level oracle.
- Pairwise/equivalence/boundary/error-guessing are design techniques, not oracle authority.
- A failed criterion does not independently prove the root cause or a whole-vehicle failure.

## Reference timing/status policy

| Claim | Status |
|---|---|
| 60 Hz software/physics simulation step | CURRENT_RUNTIME_EVIDENCE |
| 10 ms VMC / 20 ms AEB / 10 ms CAN | DESIGN_ONLY_REFERENCE_EXAMPLE |
| CAN signal transfer | NOT_IMPLEMENTED |
| Independent endpoint capture | Narrowly supported only for the audited eDrive-to-adapter educational boundary; not hardware/network instrumentation |
| Rapier pose/speed | PLANT_GROUND_TRUTH |
| Sensor/estimator output | NOT_IMPLEMENTED |

## Calibration boundary

The calibration profile explicitly says `SIMULATION_ASSUMPTION` and `REVIEW_REQUIRED`. Values can support deterministic game regression, but they are not OEM, production, or approved vehicle calibration.
