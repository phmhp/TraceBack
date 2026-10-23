# 2026-10-10 Canonicalization Validation

## Scope and method

Validated the canonical Phase 01–07 catalogs under `docs/reference_vehicle/` against the 74-LF review baseline and current repository source. CSVs were parsed with PowerShell. Primary keys and typed trace endpoints were checked without modifying runtime or test files.

## Inventory and capability baseline

| Entity/catalog | Count | Duplicate primary IDs |
|---|---:|---:|
| Logical Function | 74 | 0 |
| Signal | 111 | 0 |
| Interface | 49 | 0 |
| Requirement | 180 | 0 |
| Reference LF TestCase | 74 | 0 |
| Case | 34 | 0 |

Capability counts remain **VERIFIED 5 / PARTIAL 27 / DESIGN_ONLY 42**. No function was upgraded because a canonical document now exists.

## Trace integrity

| Validation | Result |
|---|---:|
| Orphan LF without requirement trace | 0 |
| Orphan requirement in Phase 05 trace graph | 0 |
| Orphan TC without requirement-TC trace | 0 |
| Orphan case without case trace | 0 |
| Dangling Phase 05 trace endpoints | 0 |
| Dangling requirement-TC endpoints | 0 |
| Dangling case/LF/requirement/TC endpoints | 0 |
| Invalid trace directions detected by canonical column contracts | 0 |

These zeroes indicate structural referential integrity, not approval, execution, or oracle sufficiency.

## Semantic conflict checks

- Conflicting producer identities: 0 duplicate signal identities detected. Multi-producer candidates remain explicit text and require Phase 08 typed cardinality validation.
- Conflicting consumer identities: 0 duplicate signal identities detected. Multiple consumers are permitted fan-out, not automatically conflicts.
- Conflicting units: 0 same-ID multi-unit conflicts detected. Steering demand ratio and physical wheel angle remain separate semantic concepts.
- Conflicting capability states: 0 duplicate-ID contradictions detected in canonical catalogs. Runtime status and design status remain separate axes.
- Comparable interfaces: exactly 1, `IFC-DESIGN-005`, classified `INSTRUMENTED_SAME_TICK_ENDPOINT_PAIR`.
- Unresolved ownership: 62 requirement candidates use `SW_OWNER_TBD`; 74 LF decision rows remain `OPEN`. These are visible design debt, not dangling references.

## Approved semantic decisions applied

1. `Trackback_VMC` is documented as Propulsion Torque Generation; full Motion Coordination stays DESIGN_ONLY.
2. Brake suppression of drive is `HOST_DRIVE_BRAKE_ARBITRATION_POLICY`.
3. Readiness/enable runtime values are host assumptions.
4. Only the eDrive → DriveAdapter pair is endpoint-observable/comparable, with same-tick/non-network limits.
5. Requirement, calibration, implementation, and verification status are independent.
6. Reviewed CSV duplicate audit columns were normalized. All paired values matched; no conflict was discarded.
7. `docs/reference_vehicle/` is the sole canonical root.
8. Korean is the canonical engineering-document language.

## Test and safety gates

- FR/SYSR/SWR/SIMR remain distinct.
- No HARA, Safety Goal, FSR, TSR, or ASIL was manufactured or approved.
- Reference TC, repository test, player-workbench executable, observation-only, and interface-comparable semantics remain distinct.
- Pairwise remains an input-generation technique, not an oracle.
- Vehicle scenarios without executable expected behavior remain `OBSERVED`.
- CASE-PT-001 remains the approved canonical game case; 33 candidates remain `AI_DRAFT`.

## Link and file checks

- Canonical Markdown references to renamed Phase 04–07 working filenames were updated.
- README and MANIFEST agree on the 26 canonical files.
- No `integration/` directory was created.
- Archive and root-level superseded material remain non-canonical and are tracked in `OPEN_CLEANUP_ITEMS.md`.

## Result

The documentation tree is structurally ready to begin Phase 08 schema work. Phase 08 must still implement typed relation validation, provenance IDs, cardinality rules, and hidden-truth query enforcement before any runtime registry adoption.
