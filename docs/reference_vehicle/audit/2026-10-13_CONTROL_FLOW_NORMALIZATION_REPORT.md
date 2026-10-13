# TRACKBACK Control-flow Normalization Report

> Date: 2026-10-13  
> Canonical baseline: Reference Vehicle v0.3 → v0.3.1  
> Status: REVIEWED_DRAFT  
> Scope: canonical documentation/catalog normalization only  
> Runtime behavior changed: NO  
> Phase 08 started: NO

## 1. Outcome

The control-flow model is normalized to a single reference direction:

```text
request sources
→ acquisition / interpretation
→ LF-MC-REQ
→ LF-MC-AUTH
→ LF-MC-LON / LF-MC-LAT
→ LF-MC-ALLOC
→ Propulsion / Braking / Steering domain coordination
→ final domain command
→ actuation boundary
→ plant
```

Final gate: **NORMALIZED_READY_WITH_OPEN_DOMAIN_DECISIONS**.

Recommendation: **PROCEED_TO_PHASE08_WITH_OPEN_DOMAIN_DECISIONS**.

This result does not approve unresolved physical quantities, policies, calibrations, safety claims, or executable behavior. It establishes coherent reference direction and ownership for later schema work.

## 2. Baseline and resulting counts

| Entity | Before | After | Reason |
|---|---:|---:|---|
| Areas | 16 | 16 | no hierarchy deletion |
| Logical Functions | 74 | 74 | all LF IDs preserved |
| Signals | 111 | 111 | affected signal semantics normalized in place |
| Interfaces | 49 | 50 | added missing `IFC-DESIGN-050` Propulsion request → Motion Coordination logical boundary |
| Requirements | 180 | 180 | affected candidate requirements revised in place |
| Reference LF test cases | 74 | 74 | no executable or reference TC invented |
| Cases | 34 | 34 | no case semantics changed |

Capability baseline remains **VERIFIED 5 / PARTIAL 27 / DESIGN_ONLY 42**. The 62 `SW_OWNER_TBD` requirement candidates remain unassigned.

## 3. Trackback_VMC allocation

`Trackback_VMC` is allocated only to the current Propulsion path: `LF-PROP-GEN` plus local propulsion attenuation represented inside that narrow runtime path. It is not allocated to `LF-MC-REQ`, `LF-MC-AUTH`, `LF-MC-LON`, `LF-MC-LAT`, or `LF-MC-ALLOC`.

The actual runtime remains:

```text
DriverInput
→ Gear C/WASM
→ Propulsion C/WASM
→ Trackback_VMC
→ eDrive C/WASM
→ host adapters
→ Rapier plant
```

Temporary host brake and steering paths remain separate. `HOST_DRIVE_BRAKE_ARBITRATION_POLICY`, `HOST_SIMULATION_READY`, and `HOST_PROPULSION_ENABLE_ASSUMPTION` remain current-runtime policy/assumptions, not evidence of reference Motion Coordination or Vehicle State implementations.

## 4. Normalized domain paths

### 4.1 Longitudinal

```text
Driver/ACC/AEB/Propulsion/Stability/Fault sources
→ typed request or constraint
→ LF-MC-REQ
→ LF-MC-AUTH
→ LF-MC-LON
→ LF-MC-ALLOC
→ Propulsion and/or Braking domain
→ domain command
→ actuation boundary
→ plant
```

`RequestedDriveTorque` now has an explicit logical boundary (`IFC-DESIGN-050`) from `LF-PROP-GEN` to `LF-MC-REQ`. `CoordinatedLongitudinalRequest` goes only to `LF-MC-ALLOC`. Legacy `ArbitratedDriveTorque` is retained as a post-allocation Propulsion-domain candidate and is not treated as a raw authority output.

### 4.2 Braking

```text
driver brake → LF-BRK-ACQ → LF-BRK-DEMAND ┐
AEB request ──────────────────────────────┼→ LF-MC-REQ → AUTH → LON → ALLOC
stability/fault constraint ───────────────┘
→ LF-BRK-COORD → LF-BRK-BLEND → LF-BRK-CMD
→ LF-ACT-BRAKE → plant
```

`BrakeDemand`, `AllocatedBrakeDemand` (`SelectedBrakingRequest` compatibility name), `FinalBrakeCommand`, and `BrakeForce` are distinct. `LF-BRK-COORD` is post-allocation domain coordination and cannot repeat vehicle-level authority. `RegenTorqueRequested` no longer points back to `LF-MC-ALLOC`; its downstream actuator mapping stays OPEN. ABS wheel-level placement remains externally unresolved.

### 4.3 Lateral

```text
driver steering → LF-STR-ACQ → LF-STR-DEMAND ┐
LKA request ─────────────────────────────────┼→ LF-MC-REQ → AUTH → LAT → ALLOC
typed ESC request/constraint ────────────────┘
→ LF-STR-COORD → LF-STR-ACT → LF-ACT-STEER → plant
```

Driver, LKA, and ESC no longer have duplicate direct routes into the Steering domain. `LF-STR-COORD` is post-allocation domain coordination. The exact lateral quantity (`CURVATURE_REQUEST`, `YAW_RATE_REQUEST`, `STEERING_ANGLE_REQUEST`, or `STEERING_TORQUE_REQUEST`) remains `OPEN_EXTERNAL_VALIDATION_REQUIRED`.

## 5. Constraint and advanced-function semantics

- ACC is a typed longitudinal `MOTION_REQUEST` to Motion Coordination.
- AEB is a safety-priority request whose priority/override policy remains open; it does not directly enter Brake Acquisition.
- LKA is a typed lateral `MOTION_REQUEST` to Motion Coordination; it does not directly own Steering coordination or actuation.
- ABS/TCS/ESC outputs are collected through `LF-STB-COORD` as typed request/constraint data. Their detailed wheel/domain placement remains open.
- Energy drive capability is a cross-domain constraint consumed before allocation. Regen capability remains a Braking blend constraint. No universal `min()` policy is approved.
- Fault reaction data has two explicitly distinct uses: state/degraded reporting to Vehicle State and typed control constraint consumption by Motion Coordination.

## 6. Authority bypass and cycle resolution

The pre-normalization audit identified **9** authority-bypass or direction-inversion relations:

1. `RequestedDeceleration` to Braking coordination before Motion authority.
2. `SelectedBrakingRequest` back into longitudinal coordination.
3. `RegenTorqueRequested` back into allocation.
4. `RequestedSteeringAction` directly into Steering coordination.
5. `SelectedSteeringRequest` from Steering coordination back into lateral coordination.
6. `StabilityConstraintRequest` duplicated to Braking coordination.
7. `AebBrakeRequest` duplicated to Brake acquisition.
8. `LkaAssistRequest` duplicated to Steering coordination.
9. `EnergyDriveTorqueLimit` duplicated directly to Propulsion limitation.

After normalization: **0 authority bypasses** under this definition.

The pre-normalization graph contained **2 accidental coordination cycles**: Braking-domain output returning to Motion Coordination and regen blend returning to allocation. After normalization: **0 accidental control-flow cycles**. State observation and feedback loops remain legitimate and are not counted as authority cycles.

## 7. Interface classification

All 50 interface rows separately retain logical, runtime-transfer, transport, observation, and comparison axes. Only `IFC-DESIGN-005` eDrive → DriveAdapter remains `INSTRUMENTED_SAME_TICK_ENDPOINT_PAIR`. No new CAN, ECU, asynchronous timing, or executable comparison capability is claimed.

`IFC-DESIGN-050` is `REFERENCE_REQUEST_PATH / DESIGN_ONLY / NO_CURRENT_RUNTIME_TRANSFER / NO_TRANSPORT_MAPPING / NO_ENDPOINT_OBSERVATION / NOT_COMPARABLE`.

## 8. Affected requirements

Requirement IDs and counts were preserved. Only affected candidate text/architecture decisions were refined for:

- post-allocation Braking coordination;
- post-allocation Steering coordination;
- Stability aggregation into Motion Coordination;
- LKA typed request routing;
- Energy drive/regen constraint routing.

No `DRAFT_NOT_APPROVED` item was promoted, no oracle was invented, and no `SW_OWNER_TBD` owner was assigned. Existing approved runtime/product behavior in `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md` was not modified.

## 9. Open external-domain decisions

The following **11** topic groups remain open and explicitly block stronger claims:

1. ABS/TCS/ESC detailed placement and intervention policy.
2. Brake blending and regen/friction allocation algorithm.
3. EPS authority and driver-override policy.
4. Exact lateral reference quantity and conversions.
5. ADAS request priority, cancellation, and safety policy.
6. Energy/thermal/regen constraint policy and invalid defaults.
7. Production diagnostics, detection, reaction, clear, and recovery policy.
8. Multi-rate execution, scheduling, transport, and timeout semantics.
9. Plant fidelity, actuator dynamics, and calibration validity.
10. Functional-safety lifecycle/HARA/SG/FSR/TSR/ASIL decisions.
11. Occupant-protection architecture and deployment policy.

These remain `EXTERNAL_VALIDATION_REQUIRED` or open candidate decisions. The catalog still contains 66 `OPEN` decision rows overall; this report groups the control-flow-relevant external topics into the 11 required domains above.

## 10. Files changed in this pass

- `docs/reference_vehicle/README.md`
- `docs/reference_vehicle/MANIFEST.md`
- `docs/reference_vehicle/architecture/01_REFERENCE_ARCHITECTURE_KO.md`
- `docs/reference_vehicle/architecture/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md`
- `docs/reference_vehicle/architecture/03_INTERNAL_LOGIC_STATE_MACHINE_KO.md`
- `docs/reference_vehicle/interfaces/04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md`
- `docs/reference_vehicle/interfaces/04_SIGNAL_CATALOG.csv`
- `docs/reference_vehicle/interfaces/04_INTERFACE_CATALOG.csv`
- `docs/reference_vehicle/requirements/05_REQUIREMENTS_ENGINEERING_KO.md`
- `docs/reference_vehicle/requirements/05_REQUIREMENT_CATALOG.csv`
- `docs/reference_vehicle/audit/2026-10-13_CONTROL_FLOW_NORMALIZATION_REPORT.md`
- `docs/reference_vehicle/audit/2026-10-13_CONTROL_FLOW_NORMALIZATION_REVALIDATION.md`

Runtime files changed by this pass: **0**. No file under `src/`, `c/`, or `tests/` was modified by this pass. Pre-existing unrelated working-tree changes are not part of this normalization.

## 11. Release decision

The v0.3.1 canonical reference model is directionally coherent and ready for a later Phase 08 schema pass while preserving all runtime and product reconciliation behavior. It is not externally validated vehicle-domain design and must not be presented as such.

