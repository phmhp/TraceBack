# Canonicalization Implementation Plan

This is a future plan only. It does not authorize changes to runtime, Ground Truth, registries, UI, tests, cases, or existing archive files.

## Stage 0 — decisions and freeze

- **Change files:** future `README.md`, `MANIFEST.md`, `provenance/decisions.csv`.
- **Reason:** settle authority, ownership, and unresolved policy before migration.
- **Preserve:** every post-reconciliation `IMPLEMENTED` behavior; existing Pages 1–4, runtime semantics, CASE-PT-001 truth, and archive files.
- **Risk:** a premature approval can turn design candidates into false truth.
- **Regression:** documentation link scan and reconciliation-invariant checklist.
- **Done when:** decisions below have named owners/status and archive hashes are recorded.

## Stage 1 — lossless canonical document merge

- **Change files:** `architecture/*.md`, `interfaces/04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md`, `requirements/*.md`, `verification/*.md`, `cases/*.md`.
- **Reason:** consolidate reviewed corrections without discarding detailed phase content.
- **Preserve:** 16 domains, 74 LFs, entity/relation distinctions, design-only content, language provenance, safety/oracle/visibility guardrails.
- **Risk:** simplifying prose can erase assumptions or turn examples into requirements.
- **Regression:** section/content mapping from every source file; review against matrix.
- **Done when:** each merged section cites provenance and declares lifecycle/runtime status.

## Stage 2 — normalize catalogs

- **Change files:** canonical Signal, Interface, Requirement, Traceability, TC, Capability, Fault, Case, Scenario, and Decision CSVs.
- **Reason:** remove duplicate audit headers and establish stable IDs/status axes.
- **Preserve:** all 111 signals, 49 interfaces, 180 requirements, 74 LF TCs, 34 cases, legacy IDs/crosswalks, and unresolved values.
- **Risk:** CSV import may silently lose the second same-named column or reinterpret empty values.
- **Regression:** row counts, key uniqueness, field-level before/after diff, encoding check.
- **Done when:** normalization is lossless and no candidate is auto-approved.

## Stage 3 — build typed graph and provenance registry

- **Change files:** `graph/schema.json`, `graph/entities.json`, `graph/relations.json`, `provenance/sources.csv`, `provenance/decisions.csv`.
- **Reason:** enable one queryable model instead of page-specific duplication.
- **Preserve:** hierarchy versus allocation; data flow versus runtime call; trace versus execution evidence; hidden truth boundaries.
- **Risk:** relation flattening, ID collision, accidental inference of implementation.
- **Regression:** schema validation, unique IDs, legal edge endpoints, orphan report, cycle classification, provenance completeness.
- **Done when:** every imported row maps to an entity/edge or an explicit exclusion record.

## Stage 4 — current-runtime overlay

- **Change files:** graph runtime-owner/capability/provenance data only; no runtime source in this stage.
- **Reason:** bind current source evidence to reference entities without conflation.
- **Preserve:** VMC label limited to Propulsion Torque Generation; command/request/actual separation; temporary adapter labels; 60 Hz timing; direct-call/WASM transport; Rapier ground-truth semantics.
- **Risk:** current source facts can be projected too broadly onto design functions.
- **Regression:** source-symbol existence checks and comparison with `04_RUNTIME_REFERENCE_MODEL_GAP.md`.
- **Done when:** every runtime status claim has an as-of source citation and unsupported claims are rejected.

## Stage 5 — capability, oracle, and evidence gates

- **Change files:** canonical verification catalogs and graph validation rules.
- **Reason:** prevent candidate test designs and observation-only runs from producing unauthorized verdicts.
- **Preserve:** current component test semantics, vehicle `OBSERVED`, FAIL/root-cause separation, technique/oracle distinction, calibration provenance.
- **Risk:** reducing workbench capabilities or leaking hidden case data through expected values.
- **Regression:** capability matrix tests, oracle-required verdict tests, hidden-truth visibility tests, existing workbench regression suite.
- **Done when:** PASS/FAIL requires an executable authorized oracle and every evidence item names its runner/provenance.

## Stage 6 — optional registry/UI adoption (separate authorization)

- **Change files:** only after approval: architecture/trace registries, data loaders, UI query adapters.
- **Reason:** replace duplicate hardcoded page data with graph projections.
- **Preserve:** all `IMPLEMENTED` reconciliation items and current player flows.
- **Risk:** release-blocking UX or semantic regression.
- **Regression:** typecheck, lint, full automated suite, manual Page 1–4 inspection, Actual-only/OBSERVED/interface limitation/notes-return/root-cause-leak checks.
- **Done when:** graph-backed views are behaviorally equivalent and the reconciliation matrix remains entirely satisfied.

## Stage 7 — archival cleanup (separate destructive approval)

- **Change files:** MANIFEST and only explicitly approved duplicate/superseded/transfer artifacts.
- **Reason:** reduce ambiguity after canonical adoption.
- **Preserve:** immutable archive or external archival copy, hashes, history, and crosswalks.
- **Risk:** irreversible loss of provenance or broken links.
- **Regression:** hash verification, link scan, fresh clone/read test.
- **Done when:** the user approves exact paths and recovery location; no bulk deletion is implied.

## Decisions required before any actual code/registry migration

1. Confirm `docs/reference_vehicle/` as the sole canonical path and whether the full archive stays in-place or moves to immutable `archive/` storage.
2. Approve the runtime display role **Propulsion Torque Generation** for the existing `Trackback_VMC` symbol while full Motion Coordination remains DESIGN_ONLY.
3. Decide the owner/classification of brake-over-drive: game host policy versus future vehicle reference requirement.
4. Confirm `VehicleReady` and `PropulsionEnable` remain host assumptions until a real Vehicle State Manager is implemented.
5. Approve whether the eDrive-to-adapter cloned endpoint pair may remain an educational `INTERFACE_COMPARABLE` capability, with the explicit non-CAN/non-independent limitation.
6. Decide which simulation calibration values, if any, may become an approved TRACKBACK game reference oracle; none may be called OEM/production calibration.
7. Approve the lossless resolution of duplicated reviewed CSV audit columns after inspecting whether paired values are identical.
8. Choose whether English originals remain maintained translations or historical provenance after the Korean canonical merge.
9. Approve the Phase 08 storage form (recommended JSON graph plus CSV authoring catalogs) and stable ID namespace.
10. Separately authorize any future registry/UI adoption or deletion; this audit grants neither.
