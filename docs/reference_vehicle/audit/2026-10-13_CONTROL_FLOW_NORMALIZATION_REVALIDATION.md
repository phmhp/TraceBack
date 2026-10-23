# TRACKBACK Control-flow Normalization Revalidation

> Date: 2026-10-13  
> Target: canonical Reference Vehicle v0.3.1  
> Result: NORMALIZED_READY_WITH_OPEN_DOMAIN_DECISIONS  
> Runtime execution tests required: NO — documentation/catalog-only pass

## 1. Mechanical integrity

| Check | Result |
|---|---|
| CSV parse | PASS — signal/interface/requirement catalogs parsed successfully |
| Signal count | PASS — 111 |
| Interface count | PASS — 50 |
| Requirement count | PASS — 180 |
| Reference test-case count | PASS — 74 |
| Case count | PASS — 34 |
| Duplicate signal names | PASS — 0 |
| Duplicate interface IDs | PASS — 0 |
| Duplicate requirement IDs | PASS — 0 |
| LF IDs | PASS — 74 unique IDs |
| Dangling interface LF endpoints | PASS — 0 |
| Dangling signal LF endpoints | PASS — 0 |
| Orphan interface signal endpoints | PASS — 0 |
| Empty signal producer/consumer fields | PASS — 0 (explicit `OPEN` is retained where unresolved) |
| `IFC-DESIGN-050` uniqueness | PASS — exactly 1 |
| README/MANIFEST counts | PASS — 16 / 74 / 111 / 50 / 180 / 74 / 34 |
| Broken Markdown links in changed canonical Markdown | PASS — 0 |
| Canonical changed-doc version | PASS — v0.3.1 / REVIEWED_DRAFT / Canonical YES |
| Runtime files changed by this pass | PASS — 0 |

The two pre-existing modifications under `src/ui/` are outside this pass and were preserved without editing. `docs/codex_tasks/` is task input and was not modified.

## 2. Directional graph checks

Expected reference order:

```text
REQUEST/CONSTRAINT
→ ACQUISITION/INTERPRETATION
→ MC REQUEST
→ AUTHORITY
→ COORDINATION
→ ALLOCATION
→ DOMAIN COORDINATION/PROCESSING
→ FINAL DOMAIN COMMAND
→ ACTUATION BOUNDARY
→ PLANT
```

Results:

- Request-source bypasses into downstream domain coordination: **0**.
- Post-domain outputs returning into MC authority/allocation: **0**.
- Direct ADAS actuator ownership: **0**.
- Duplicate Stability delivery to both MC and downstream domain: **0**.
- Accidental request/constraint/authority/allocation/command cycles: **0**.
- Legitimate observation/feedback loops: retained and classified outside the authority-cycle check.

Before/after control-flow counts:

| Metric | Before | After |
|---|---:|---:|
| Authority bypass/direction inversion relations | 9 | 0 |
| Accidental coordination cycles | 2 | 0 |

## 3. Fifteen-scenario reasoning revalidation

| # | Scenario | Expected route / guard | Result |
|---:|---|---|---|
| 1 | Driver acceleration | Propulsion interpretation → `RequestedDriveTorque` → MC request/authority/lon/allocation → Propulsion domain | PASS |
| 2 | Driver braking | Brake acquisition/demand → `RequestedDeceleration` → MC → Braking domain → blend/command | PASS |
| 3 | Simultaneous accelerator and brake | Both typed requests meet once at MC authority; no implicit domain arbitration claim | PASS, policy OPEN |
| 4 | ACC longitudinal request | `AccLongitudinalRequest` → MC request/authority/lon/allocation | PASS |
| 5 | AEB request | `AebBrakeRequest` → MC request/authority/lon/allocation → Braking domain; no Brake-acquisition bypass | PASS, priority OPEN |
| 6 | Driver steering | Steering acquisition/demand → `RequestedSteeringAction` → MC request/authority/lat/allocation → Steering domain | PASS |
| 7 | LKA assistance | `LkaAssistRequest` → MC request/authority/lat/allocation; no direct Steering coordinator route | PASS, quantity OPEN |
| 8 | ESC lateral/vehicle-motion correction | ESC → Stability aggregation → typed MC request/constraint; no duplicate MC delivery | PASS, exact placement OPEN |
| 9 | TCS torque constraint | TCS → Stability aggregation → MC constraint path; no direct MC-LON duplicate | PASS, policy OPEN |
| 10 | ABS intervention | ABS → Stability aggregation; no direct final Brake command bypass | PASS, wheel placement OPEN |
| 11 | Energy drive torque constraint | `LF-EN-LIMIT` → `LF-MC-LON` before allocation; no direct Propulsion limitation bypass | PASS |
| 12 | Regen capability constraint | `RegenTorqueLimit` → Braking blend only; Energy does not own blending/final command | PASS, algorithm OPEN |
| 13 | Fault reaction constraint | Fault reaction → Vehicle State reporting plus typed MC constraint, with distinct purposes | PASS, safe reaction OPEN |
| 14 | Current runtime Propulsion execution | Propulsion C → Trackback_VMC → eDrive → adapter → Rapier; no reference MC implementation claim | PASS |
| 15 | Repair/investigation/replay semantics | No runtime, evidence, oracle, or reconciliation artifact changed | PASS |

## 4. Semantic boundary checks

- `Trackback_VMC` is not mapped to the Motion Coordination area or its five core request/authority/coordination/allocation functions.
- `Motion Coordination.areaKind` is `CONTROL_COORDINATION`; Vehicle State remains `STATE_COORDINATION`.
- `BrakeDemand`, `AllocatedBrakeDemand`, `FinalBrakeCommand`, and `BrakeForce` remain distinguishable.
- Request, constraint, allocation, domain command, actual value, feedback, availability, state, and observation are not collapsed.
- `VehicleReady` and `PropulsionEnable` retain host-assumption/current-runtime semantics.
- Actuation boundary and plant remain distinct.
- Only eDrive → DriveAdapter remains currently comparable as an instrumented same-tick endpoint pair.

## 5. Regression and scope checks

- `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`: unchanged.
- Implemented runtime/product behaviors in the reconciliation matrix: preserved.
- Runtime behavior: unchanged.
- C/WASM behavior and calibration: unchanged.
- Tests and executable oracles: unchanged.
- AI draft cases: not promoted.
- Phase 08: not started.
- Git commit: not created.

## 6. Open-decision treatment

The revalidation intentionally does not close the 11 external-domain topic groups listed in the normalization report. `OPEN_EXTERNAL_VALIDATION_REQUIRED`, `EXTERNAL_VALIDATION_REQUIRED`, `DRAFT_NOT_APPROVED`, `DESIGN_ONLY`, and `SW_OWNER_TBD` gates remain effective. The 66 open decision rows in the decision catalog remain open.

## 7. Final decision

**Final gate:** `NORMALIZED_READY_WITH_OPEN_DOMAIN_DECISIONS`

**Next-phase recommendation:** `PROCEED_TO_PHASE08_WITH_OPEN_DOMAIN_DECISIONS`

This recommendation authorizes only a later, explicit Phase 08 schema/registry task. Phase 08 was not begun in this pass.

