# Phase 01–07 Consistency Audit

## Executive result

The 16-domain / 74-logical-function reference model is internally useful, but it is not an implementation inventory. The archived baseline of **5 VERIFIED / 27 PARTIAL / 42 DESIGN_ONLY** is reproduced from the 74-row LF review matrix and remains consistent with the current narrow propulsion slice. The audit found **7 P0, 12 P1, and 8 P2** issues. P0 means canonicalization must not publish the affected claim; it does not mean the current game runtime is broken.

No runtime, Ground Truth, registry, UI, test, case, or calibration file was changed.

## P0 — publication blockers (7)

| ID | Broken chain / conflict | Evidence | Required disposition |
|---|---|---|---|
| P0-01 | Logical `Vehicle Motion Coordination` is conflated with executable `Trackback_VMC` | Current C function only maps one propulsion request plus speed into a torque request | Display runtime role as **Propulsion Torque Generation**; keep full arbitration/authority/allocation LF DESIGN_ONLY |
| P0-02 | `EDriveCommand` can be read as actual drive torque | C output is a command; adapter converts it to signed force; Rapier has no actual torque feedback | Separate command, requested torque, actuation command, and physical response entities/signals |
| P0-03 | Temporary brake/steering adapters can be mistaken for Brake Controller/EPS | They directly map normalized host input to force/angle and contain no controller state/diagnostics | Mark as host/temporary adapters; Brake Controller and EPS remain DESIGN_ONLY |
| P0-04 | `VehicleReady` / `PropulsionEnable` ownership is overstated | `SimulationRuntime` derives readiness from physics attachment and supplies enable as a host assumption | Assign `HOST_ASSUMPTION`; do not claim Vehicle State Manager output |
| P0-05 | Reviewed signal/interface CSV schema is malformed | Four audit headers occur twice in each reviewed CSV | Normalize losslessly before import; preserve both values until equality is proven |
| P0-06 | Candidate requirements/tests/cases can be mistaken for approved/executable artifacts | 180 requirements are candidates; 74 LF TCs are draft and have no approved candidate oracle; 33 cases are AI drafts | Carry lifecycle, approval, capability, and provenance on every entity and edge |
| P0-07 | Archive reconciliation/workbench snapshots could overwrite current product truth | Both snapshots differ from current repository files | Current repository documents are authoritative; archive copies are SUPERSEDED |

## P1 — semantic/trace correction required (12)

| ID | Finding | Correction |
|---|---|---|
| P1-01 | Hierarchy, allocation, data flow, runtime call, trace, verification, and propagation are mixed in prose/diagrams | Use typed relations; never infer one relation from another |
| P1-02 | 111 signal candidates include design signals without current producers/readers | Add lifecycle and observed-at runtime ownership; reject stale producer/consumer claims |
| P1-03 | 49 interface candidates are not 49 independently measurable boundaries | Add endpoint observability and comparison capability per interface |
| P1-04 | Direct TS/C calls may be described beside CAN examples | Tag current transport `DIRECT_CALL`/`WASM_ABI`; CAN remains reference-only |
| P1-05 | 10 ms VMC, 20 ms AEB, and 10 ms CAN examples are not runtime timing | Separate reference timing from observed 1/60 s simulation period |
| P1-06 | Rapier state can be consumed as if it were sensor/estimator output | Model Rapier values as `PLANT_GROUND_TRUTH`; sensing/estimation stays DESIGN_ONLY |
| P1-07 | Fault injection lifecycle may be confused with detection, confirmation, reaction, or ECU recovery | Model five distinct stages; `RESTORED` means injection path restoration only |
| P1-08 | SYSR and SWR candidates include near-paraphrases without a clear abstraction/allocation delta | Flag clone pairs for decomposition review; do not auto-delete or approve |
| P1-09 | Requirement→TC candidates can look like verification evidence | Separate `VERIFIED_BY` design link from `ExecutionEvidence` and verdict authority |
| P1-10 | Pairwise and other design techniques can be confused with oracle types | Technique and Oracle remain separate entities/fields |
| P1-11 | Current interface endpoint pair is captured in one runtime path, not independent sender/receiver instrumentation | Limit verdict to narrow educational boundary comparison |
| P1-12 | CASE-PT-001 and AI-draft cases coexist in one catalog | Maintain explicit lifecycle and hidden-truth partition; only CASE-PT-001 is canonical game truth |

## P2 — maintainability/provenance debt (8)

| ID | Finding | Correction |
|---|---|---|
| P2-01 | Exact duplicate Codex prompt exists | Keep one archival copy after migration approval |
| P2-02 | DOT and SVG can appear as peer authorities | Register DOT as source and SVG as generated rendering |
| P2-03 | English and Korean phase documents have no declared translation synchronization rule | Record language, translation-of, and last-reviewed provenance |
| P2-04 | Phase handoff READMEs are mixed with engineering data | Move their content into MANIFEST provenance, retaining originals as history |
| P2-05 | Historical audit paths and line references can become stale | Store commit/hash/as-of metadata; refresh evidence rather than silently editing history |
| P2-06 | Candidate calibration values and engineering approval are separate but inconsistently surfaced | Use calibration provenance/status fields on oracle and evidence records |
| P2-07 | Legacy test IDs and current repository test identities require crosswalks | Preserve explicit alias/crosswalk relations; never merge by similar text alone |
| P2-08 | No single canonical graph currently validates referential integrity across all phases | Add Phase 08 graph validator and generated reports |

## Orphan and conflict checks

| Check | Result |
|---|---|
| Duplicate primary IDs | None inside the principal requirement, LF-TC, and case catalogs |
| Orphan Functions | All 74 have a Phase 05 review row and Phase 06 candidate TC, but 42 are intentionally DESIGN_ONLY; linkage is not implementation |
| Orphan Signals | Candidate catalog contains non-runtime signals; canonical import must mark them DESIGN_ONLY rather than invent producers |
| Orphan Requirements | Candidate trace rows exist broadly, but approval and executable-verification authority are absent for many/all; semantic orphaning remains |
| Orphan TCs | Every LF has a candidate TC, yet all 74 are `DRAFT_NOT_APPROVED` and lack an approved candidate oracle |
| Orphan Cases | Candidate trace exists, but most cases have no approved oracle/runtime; keep as AI drafts |
| Conflicting owner | Readiness/enable, brake-over-drive, VMC scope, and some signal ownership require explicit owner decisions |
| Conflicting unit | Steering demand ratio versus wheel angle radians must be distinct signals; command torque versus force must remain distinct |
| Conflicting runtime status | Solved by entity-level lifecycle/capability metadata, not by collapsing to one `implemented` flag |
| Circular dependency | No executable runtime call cycle found; feedback from Plant to next-tick Gear/VMC is a timed feedback edge, not an instantaneous call cycle |
| Invalid trace direction | Candidate files use several source-oriented links; canonical graph must validate direction against the relation type |

## Safety, timing, communication, and sensing claims

- No approved Item Definition, HARA, hazardous-event analysis, Safety Goal, FSR, TSR, SW safety requirement, or ASIL classification exists in the archive. None may be generated or approved by canonicalization.
- The evidenced scheduler is the simulation's fixed 60 Hz loop. Other periods are reference examples only.
- Current data transfer is TypeScript calls and a C/WASM ABI, not an implemented CAN network.
- Rapier supplies plant state/ground truth. There is no implemented vehicle sensor or estimator chain supporting production-style sensing claims.

## Product invariants

The canonical graph must preserve all post-reconciliation `IMPLEMENTED` behaviors, including honest Actual-only observations, capability-gated methods, OBSERVED without an oracle, notes versus formal evidence, evidence-bounded conclusions, visible trace pedigree, Pages 1–4 roles, and hidden root-cause truth. Canonicalization must not alter those implemented semantics.
