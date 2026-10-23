# TRACKBACK verification workbench capability audit

> Audited: 2026-10-02 · Vehicle Scenario foundation updated  
> Scope: current repository/runtime only

## Executable runtime today

The investigation workbench executes isolated C/WASM component functions and a separate configurable vehicle-scenario mode connected to the live `SimulationRuntime`/Rapier path. Component and vehicle execution remain distinct.

| Target | Runner | Changeable stimulus/conditions | Observable output | Oracle |
|---|---|---|---|---|
| `VMC` | `verifyVmc` C/WASM | `PropulsionRequest` 0–1, `VehicleSpeed` 0–60 m/s, direction, validity | `DriveTorqueRequest` magnitude | independent requirement oracle |
| `eDrive` | `verifyEDrive` C/WASM | `DriveTorqueRequest` 0–600 Nm, direction, validity | `EDriveCommand` magnitude | independent requirement oracle |

Existing executable TCs are `TC-PROP-NORMAL-009`, `TC-PROP-NORMAL-010A`, and `TC-PROP-NORMAL-010B`. Other canonical TCs remain reference-only.

## Supported target and method matrix

- Representable target types: domain scope, function, signal, interface boundary, state/mode, actuation/plant, timing/execution.
- Executable target type today: `FUNCTION` only, for `VMC` and `eDrive`.
- Supported methods for those executable targets:
  - requirements-based test;
  - input variation;
  - boundary value analysis from registered runtime ranges and calibration limits;
  - state-condition test using the currently supported direction/validity conditions.
- Executable stimulus profile: `CONSTANT` only, one static value per run.
- Repeated runs: supported.
- Arbitrary values inside the registered numeric range: supported.

## Unsupported capabilities

- Interface comparison: no independent source-output and destination-input telemetry.
- Fault injection: no override, corruption, delay, missing-update, timeout, duration, or recovery hook exists.
- Timing/execution test: the component test API has no schedulable stimulus or execution-event observation.
- Back-to-back comparison: no independent second executable model is connected to the workbench.
- Time profiles (`STEP`, ramps, pulse, sequence): the runner accepts one static scalar per execution.
- Actuation/plant target: Page 3 does not configure the Rapier plant or actuator boundary.
- Vehicle scenario simulation: the live vehicle runtime consumes driver input, but the Page 3 component experiment configuration is not connected to that runtime. The vehicle viewport must therefore not portray workbench results as a driven scenario.
- Independent multi-signal monitoring: runtime snapshots contain several signals, but each current component verifier formally returns one monitored magnitude. The workbench does not claim synchronized arbitrary multi-signal monitoring.

## Evidence semantics

- Page 1/2 saved observations and requirements are Investigation Notes. They preserve return context where available.
- Page 3 stored results are Verification Evidence and preserve target type, target, method, origin, preconditions, constant stimulus, monitor, expected criterion, actual result, verdict, run index, and variation group.
- Page 4 uses Verification Evidence for current-case sufficiency. Investigation Notes are optional supporting context and do not substitute for missing formal runs.

## Vehicle Scenario runtime foundation

Page 3 now has a separate `VEHICLE_SCENARIO_TEST` execution mode. It resets and drives the existing `SimulationRuntime`; its viewport motion is the actual Rapier result rather than component-result playback.

### Real controllable scenario inputs

- `DriverInputRuntime.accelerator` (`0..1`)
- `DriverInputRuntime.brake` (`0..1`)
- `DriverInputRuntime.steering` (`-1..1`)
- gear `D` as an explicit supported precondition

The scheduler executes `CONSTANT`, `STEP`, and `LINEAR_RAMP` profiles on the runtime's fixed `1/60 s` tick. Scenario duration is restricted to `1..12 s`; the current UI uses a four-second reset-at-rest scenario.

### Synchronized monitors

All selected values are sampled after the same physics tick:

- driver input: accelerator, brake, steering;
- connected software: gear state, propulsion request, drive torque request, eDrive command;
- actuation: drive force, brake force;
- plant response: speed, longitudinal velocity/acceleration, X/Z position.

`ACTUATION_PLANT / VehiclePhysics` is therefore partially executable in Vehicle Scenario mode. Arbitrary internal or interface-endpoint signals are still not claimed.

### Reset, replay, and determinism

- `RESET`, `RUN`, and `REPLAY` use the same scenario definition and fixed-step scheduler.
- Reset recreates the configured Rapier spawn and clears driver/SW state without deleting the captured investigation case.
- Automated Rapier replay tests reproduce the monitored result for the tested scenario.
- Perfect cross-device determinism is not claimed; browser scheduling and physics-engine/platform differences remain outside the evidence guarantee.

### Evidence and oracle boundary

Vehicle runs are saved with origin `VEHICLE_SCENARIO_TEST`, scenario definition, timing, monitors, samples, interpretation, and replay context. Without a valid vehicle-level criterion they remain `OBSERVED`; no Expected trajectory or automatic PASS/FAIL is invented.

### Still unsupported

- independent producer/consumer interface endpoint telemetry;
- fault injection and timing-fault hooks;
- arbitrary scenario state override beyond supported driver inputs and gear precondition;
- whole-vehicle Expected trajectory generation;
- a second runner for back-to-back comparison.

Candidate future fault-injection seam: introduce a typed interception layer between `VehicleSwPort.step()` output and `writeEDrivePhysicsCommand()`, plus a separate driver-input interception layer before `VehicleSwInput` construction. Each injection would require a canonical point ID, activation window, original/injected value telemetry, and explicit reset semantics. No injection behavior is implemented in this phase.

This audit is the capability boundary for the current pass. Unsupported methods should not appear as normal selectable workbench options.
