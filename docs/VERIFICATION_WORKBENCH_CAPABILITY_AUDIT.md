# TRACKBACK verification workbench capability audit

> Audited: 2026-10-02 · Phase 3A implemented and verified  
> Scope: current repository/runtime only

## Current capability

TRACKBACK currently has two real execution paths. They share investigation context, but they do not share a runner or an oracle.

| Execution mode | Executable target | Runner | Stimulus | Observation | Oracle / result meaning |
|---|---|---|---|---|---|
| Component Verification | `FUNCTION / VMC`, `FUNCTION / eDrive` | isolated C/WASM verifier | one `CONSTANT` scalar plus supported direction/validity conditions | one component output magnitude | independent requirement oracle; genuine `PASS`/`FAIL` |
| Vehicle Scenario | `ACTUATION_PLANT / VehiclePhysics` | live `SimulationRuntime` + Rapier | driver accelerator, brake, and steering as `CONSTANT`, `STEP`, or `LINEAR_RAMP`; gear `D` precondition | synchronized driver, SW, actuation, and plant values | no vehicle-level oracle by default; result is `OBSERVED` |
| Interface Comparison | `INTERFACE_BOUNDARY / eDrive->DriveAdapter` | live `SimulationRuntime` + Rapier | the same supported driver scenario stimuli | independent cloned `eDrive.output.EDriveCommand` and `DriveAdapter.input.EDriveCommand` on each fixed tick | `MATCH` / `MISMATCH` / `UNAVAILABLE`; overall run remains `OBSERVED` |
| Fault Injection | `ACTUATION_PLANT / VehiclePhysics` or audited eDrive boundary | live `SimulationRuntime` + Rapier with typed interceptor | normal scenario stimulus plus a separate activation window | original/delivered value, delivery occurrence, recovery, endpoint and vehicle telemetry | no automatic root-cause or vehicle verdict; overall run remains `OBSERVED` |

The component path supports requirements-based tests, input variation, boundary-value analysis from registered ranges/calibrations, and the implemented direction/validity state conditions. Existing executable component TCs are `TC-PROP-NORMAL-009`, `TC-PROP-NORMAL-010A`, and `TC-PROP-NORMAL-010B`; other canonical TCs remain reference-only.

The vehicle path uses a fixed `1/60 s` scenario clock, duration `1..12 s`, reset-at-rest initialization, explicit lifecycle markers, selected monitors, and a replay that re-executes the same scenario definition. Its live viewport is the actual Rapier result. Perfect cross-device physics determinism is not claimed.

### Current evidence boundary

- Page 1/2 saves Investigation Notes. These may support reasoning, but they do not substitute for a Page 3 run.
- Page 3 component runs save Verification Evidence with target, method, conditions, stimulus, monitor, expected criterion, actual result, verdict, run index, and variation group.
- Page 3 Vehicle Scenario runs save Verification Evidence with definition, fixed-step timing, monitors, samples, interpretation, and replay context. Without a genuine criterion their verdict remains `OBSERVED`.
- Page 4 may use both layers, but formal verification sufficiency comes from Page 3 evidence.

### Current unsupported capability after Phase 3A

- no endpoint telemetry on interfaces other than `eDrive->DriveAdapter`;
- no injected faults other than driver accelerator `OVERRIDE_VALUE` and eDrive boundary `OVERRIDE_VALUE` / `DROP_UPDATE`;
- no timing-verification oracle, deadline assertion, jitter judgment, or timeout fault;
- no back-to-back runner or independent second model;
- no arbitrary internal state override;
- no automatic vehicle-level `PASS`/`FAIL` without a supplied independent criterion.

The implemented methods are capability-gated by canonical target and injection point. The remaining capabilities must not appear as ordinary selectable methods until their runtime support exists.

## Phase 3A injection-seam audit

The following are real interception points in `SimulationRuntime.advance()`. They are not inferred network/CAN paths.

### Seam A — driver output to software input

Canonical point: `DRIVER_INPUT.ACCELERATOR_PEDAL`

Runtime order:

1. `DriverInputRuntime.advance()` updates the physical driver control state.
2. `DriverInputRuntime.getState()` returns the original accelerator value.
3. `VehicleSwInput` is constructed for `VehicleSwRuntime.step()`.

An interceptor between steps 2 and 3 can retain the original driver value, deliver a substituted accelerator value to software, run on the same fixed tick, and restore the unmodified path after its activation window. The normal scenario scheduler remains the stimulus source; the interceptor is a separate fault layer.

### Seam B — eDrive producer output to DriveAdapter consumer input

Canonical point: `INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND`

Canonical boundary: `eDrive->DriveAdapter`

Runtime order:

1. `VehicleSwRuntime.step()` produces `EDriveCommand` from the eDrive function.
2. `SimulationRuntime` hands that command to `writeEDrivePhysicsCommand()`.
3. The DriveAdapter writes the resulting force command consumed by the physics runtime.

This is a genuine in-process software interface boundary. Phase 3A may clone and record the producer output as the source endpoint, independently clone and record the object delivered to `writeEDrivePhysicsCommand()` as the destination endpoint, and compare the two values from the same fixed tick. Source and destination telemetry must never be two reads of the same shared object.

The safe initial faults at this boundary are:

- `OVERRIDE_VALUE`: replace the command magnitude while retaining the source command for provenance;
- `DROP_UPDATE`: withhold the current update and retain the last delivered command.

Both require explicit `RESTORE_ORIGINAL_PATH` recovery, and reset/replay must clear retained interceptor state.

### Seam C — DriveAdapter command to Rapier plant

`writeEDrivePhysicsCommand()` mutates `VehiclePhysicsCommand`, which is then consumed by `VehiclePhysicsRuntime.step()`. This is a real actuation seam, but Phase 3A does not need to expose a third injection point. It remains audited for a later capability decision.

## Phase 3A comparison and timing rules

- Endpoint comparison is same-fixed-tick equality of the canonical command fields. Its state is only `MATCH`, `MISMATCH`, or `UNAVAILABLE`.
- `MATCH` means the observed producer and consumer values are equal at that boundary. `MISMATCH` means they differ. Neither state identifies a root cause by itself.
- Scenario and fault events may carry fixed-step timestamps as provenance. This is timing telemetry only; it is not Timing Verification.
- Fault activation windows, original values, delivered values, delivery occurrence, injection point/type, timestamps, and recovery transitions must be stored with the run.
- Replay must execute the saved scenario and saved injection definition again. It must not replay a cached trajectory.

## Historical limitations (no longer current)

Earlier audits described Page 3 as `FUNCTION`-only, `CONSTANT`-only, disconnected from Rapier, unable to schedule time profiles, and unable to observe synchronized vehicle signals. Those statements described the repository before the Vehicle Scenario foundation was implemented. They are retained here only as history and must not be treated as current capability.

## Phase boundary

Phase 3A is limited to the two audited interception points, one genuine interface boundary, value/drop injection where supported, recovery/replay provenance, and local Page 2/Page 3 exposure. It does not add full Timing Verification, back-to-back comparison, new episodes, broad gameplay redesign, repair/re-drive, rewards, audio, or final character animation.
