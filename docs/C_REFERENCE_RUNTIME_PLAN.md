# C Reference Vehicle SW migration plan

Status: IMPLEMENTATION PLAN — existing normal Ground Truth v0.3 semantics preserved.

## A. Current boundary

SimulationRuntime owns the fixed simulation step. DriverInput feeds GearLogic → PropulsionFunction → VMC → eDrive; the TS adapter converts torque to force and Rapier advances the Plant. Brake inhibition and temporary steering/brake adapters remain outside this migration.

## B. Minimum C components and concepts

Domain: POWERTRAIN / PROPULSION. Function: Propulsion. Logical SW components: Gear Logic, Propulsion Function, VMC, eDrive. Execution units: C functions called sequentially once per fixed simulation step. Computing platform: browser WebAssembly reference environment, not an ECU. Plant: Rapier Vehicle Physics, not a SW component. VMC is not a domain.

## C. Input/output contract

All physical scalars use C double (IEEE-754 binary64), matching JS number. Enumerations are explicit at the ABI. Each step consumes one complete input; no implicit browser reads.

| Input | Type / unit / range | Initial | Validity | Owner |
|---|---|---|---|---|
| acceleratorPedalPosition | double / ratio / 0..1 | 0 | acceleratorPedalValidity; finite out-of-range saturates, nonfinite maps to zero per baseline | DriverInput |
| acceleratorPedalValidity | enum VALID/INVALID | VALID | explicit | DriverInput |
| gearRequest | enum P/R/N/D | D | gearRequestValidity | Session initializes; DriverInput requests |
| gearRequestValidity | enum VALID/INVALID | VALID | explicit | DriverInput |
| vehicleReady | boolean | false | valid boolean required | Simulation adapter |
| propulsionEnable | boolean | false | valid boolean required | Simulation adapter |
| longitudinalVelocity | double / m/s / signed finite | 0 | finite boundary contract | Plant |
| vehicleSpeed | double / m/s / nonnegative finite | 0 | finite boundary contract | Plant vector magnitude |

Outputs: actual gear, gear validity, transitionAccepted; propulsion state; propulsion request magnitude/direction/validity; VMC torque magnitude/direction/validity; eDrive command magnitude/direction/validity. Direction NONE/FORWARD/REVERSE is separate from nonnegative magnitude. Speed magnitude is not abs(longitudinalVelocity).

| Output | Type / unit / range | Owner |
|---|---|---|
| gearState | Gear enum P/R/N/D | Gear Logic; previous accepted gear retained |
| gearStateValidity | VALID/INVALID enum | Gear Logic |
| transitionAccepted | boolean | Gear Logic |
| propulsionEnabled / propulsionState | boolean in C, PROP_ENABLED/PROP_DISABLED at TS boundary | Propulsion Function |
| propulsion.magnitude | double / ratio / 0..1 | Propulsion Function |
| propulsion.direction / validity | NONE/FORWARD/REVERSE; VALID/INVALID | Propulsion Function |
| driveTorque.magnitude | double / Nm / nonnegative | VMC |
| driveTorque.direction / validity | direction and validity enums | VMC |
| eDrive.magnitude | double / Nm / 0..directional limit | eDrive |
| eDrive.direction / validity | direction and validity enums | eDrive |

Before the first step the host displays initial D, disabled and zero-valid outputs, explicitly NOT SAMPLED (not C execution evidence). Reset invalidates the previous snapshot. The C API output is defined after Step; Init/Reset initialize Context only.

## D. State and calibration ownership

Only Gear Logic owns previous-cycle gear. Explicit C Context enables isolated instances. Init/Reset receive InitialGearState=D from Session configuration; this is an initial condition, not a Gear requirement. Other three components are combinational. C Calibration is copied at initialization from the existing versioned simulation calibration; no hidden constants or per-frame calibration mutation. Keyboard response and torque-to-force remain TS/Plant adapter calibration. Reset clears snapshots and counters, preserving calibration.

## E. WASM boundary

C public API: Trackback_Init(Context*, Calibration*, initialGear), Trackback_Reset(Context*, initialGear), Trackback_Step(Context*, Input*, Output*). Small WASM bridge owns one context per WebAssembly instance and exposes fixed-size typed buffers with ABI version/length checks. No framework, malloc, WASI, external runtime calls, or network at runtime except fetching the locally shipped asset. Game bootstrap must load C/WASM successfully; no silent TS fallback. TS reference backend remains explicitly selectable for tests only.

## F. Verification

TC001–008 gating/invalid/pedal/gear-direction, TC009 mapping, TC010A/B saturation, TC013/014 interlock execute against C. TC011/012 require C + TS adapter + Rapier from near-stationary state and the configured response window. Independent expected-value assertions complement TS/C migration equivalence (not model/code back-to-back verification). Record requirement IDs, test object, inputs, expected/actual and verdict. Repeat existing regression tests.

## G. X-Ray snapshot

Language-independent snapshot includes implementation source, ABI/build identity, step number, simulation time, actual consumed inputs, actual outputs and calibration reference. Capture before Plant step so inputs and outputs are from the same invocation. Current Plant telemetry is separately identified as post-step. No fabricated monitoring expected values. X-Ray reads the snapshot rather than recomputing control results or presenting current keyboard values as previously consumed inputs.

## H. Future interfaces

Monitoring consumes immutable timestamped functional snapshots and independent expectations; future result includes consistency, reason, reaction and requirement reference. Platform consumes scheduler execution events with taskId, scheduled/actual simulation time, period, count and completion. Neither exists yet: NOT AVAILABLE. Future scheduling must use simulation time; current 1/60 s invocation is not a 10 ms ECU task nor WCET measurement. Fault scenarios, CAN, watchdog, alive counters and monitor verdicts are not added in this migration.

## I. Files

Add c/vehicle_sw (header, four component sources, core, WASM bridge), scripts/build-c-runtime.mjs, src/runtime/c (contract, legacy backend, WASM adapter and local binary), migration tests/evidence and this architecture document. Update SimulationRuntime, main/GameApplication composition, X-Ray source/terminology, package scripts and .gitignore. Preserve README, Ground Truth and existing TS component implementations.

## J. Risks and decisions

- The baseline interlock applies to direct D↔R changes only (N transitions retain baseline behavior); no unapproved new policy.
- Ground Truth metadata and prose contain stale review wording; migration does not alter approval or calibration status.
- Torque-to-force and braking are reference Plant adapter behavior, not motor electrical/inverter control.
- Finite physical inputs and positive map speed calibration are enforced at the adapter; malformed boundary data stops the session instead of corrupting physics.
- Race elapsed time freezes at finish; separate fixed-step execution time continues for core evidence.
- Wasm binary and sources require build provenance and repeatable rebuild checks.
- C/WASM is host software execution, not embedded-target/HIL verification. No generated-code certification claim.

No conflict with normal Ground Truth was identified in the four-component migration boundary. Proceed with implementation and evidence before retiring the TS reference.

## Build and review procedure

Compiler: [official Zig 0.14.1 download](https://ziglang.org/download/), using its Clang C frontend and WASM linker. Windows archive SHA-256: `554f5378228923ffd558eac35e21af020c73789d87afeabf4bfd16f2e6feed2c` (verified against the official release index). Extract under `.tools/zig-x86_64-windows-0.14.1`, or set TRACKBACK_ZIG to a Zig 0.14.1 executable. No system PATH change is needed.

1. `npm run build:c` compiles all C components, writes the local WASM and ABI/source/binary hashes in generated/build.json.
2. `npm test` runs existing regressions plus C tests and writes docs/evidence/c-*.json. Source hashes normalize CRLF to LF for checkout portability. A stale source/binary pair fails the provenance test.
3. `npm run typecheck`, `npm run lint`, `npm run build` verify the host and produce the offline-serving bundle.
4. Serve dist from a local HTTP server. WASM has zero host imports and no remote dependency; its only browser load is the bundled local asset. These tests do not certify HIL or offline availability of unrelated future external resources.

Generated WASM and evidence are versioned artifacts so a demo machine does not need a compiler. After a C change, rebuild and rerun tests before distributing. X-Ray explicitly labels stored bench evidence, its binary match, and live snapshot source. A stored PASS is never a live monitor verdict.

## Subsequent phases (not implemented here)

1. Simulation-time logical scheduler with independent SW release periods and Physics tick; events describe scheduled time, actual time and completion. No browser frame timing as ECU timing.
2. Independent Functional Monitor with expectations derived from requirements, not a copy of faulty control output. Introduce Application SW eDrive scaling case and Monitor threshold/detection case separately.
3. Platform supervision: task stall → missing completion/alive → timeout → Platform Fault Manager → explicit reaction. Add the VMC task stall case after the scheduler exists.
4. Then assess Brake, Steering and communication models with producer/consumer timestamps and freshness. Distinguish software defect, stimulus, communication, execution, monitoring, configuration and Plant/environment faults. Do not implement every cause as normal-path numeric tampering.

Investigation remains symptom → event time → consumed input/output comparison → first divergent responsibility → requirement/TC evidence → hypothesis → controlled rerun. Timeline/history, fault injection and editable test stimuli remain future work.
