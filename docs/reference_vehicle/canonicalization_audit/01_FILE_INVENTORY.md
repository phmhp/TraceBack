# Reference Vehicle Canonicalization File Inventory

- Audit date: 2026-10-10
- Repository inspected: current workspace, not the historical path embedded in prompts
- Archive inspected: `docs/reference_vehicle/TRACKBACK_REFERENCE_VEHICLE_FULL_ARCHIVE_2026-10-10/`
- Archive payload root: nested directory of the same name
- Scope: 71 extracted payload files plus the outer delivery ZIP
- Method: current source was re-read; historical audit line references were not accepted as current fact

## Authority order used in this audit

1. Repository instructions and current `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`.
2. Current executable source, registries, Ground Truth, calibration, and automated-test source.
3. Reviewed v0.2 corrections, but only where confirmed against current source.
4. Phase 05–07 proposals and catalogs as candidate engineering data.
5. Phase 01–04 originals and past audits as history/evidence, not current runtime truth.

Every post-implementation `IMPLEMENTED` item in `PRODUCT_REQUIREMENTS_RECONCILIATION.md` is a release invariant. This audit proposes no change to those behaviors.

## Physical inventory

| Group | Files | Purpose | Freshness / authority | Disposition |
|---|---:|---|---|---|
| `00_source_references` | 5 | Snapshot of source-of-truth inputs | Three exact-current; reconciliation and workbench audit snapshots are stale | Historical/provenance only |
| `01_phase01` | 2 | Whole-vehicle reference architecture | Pre-review | Merge; retain language provenance |
| `02_phase02` | 2 | 16 domains and 74 logical functions | Pre-review; counts remain valid | Merge; reviewed KO is preferred correction source |
| `03_phase03` | 10 | Internal logic, state, cross-domain map, DOT/SVG | Pre-review | Merge; DOT is relationship source, SVG is rendered derivative |
| `04_phase04` | 5 | Signal/interface candidates and phase audit | Pre-review | Superseded by reviewed v0.2 where present; retain audit evidence |
| `05_phase05` | 8 | Requirements proposals, trace candidates, decisions | Current archive proposal, not approved canonical truth | Merge after normalization and approval |
| `06_phase06` | 10 | Test/verification proposals and runtime crosswalk | Current archive proposal, not executable as a whole | Merge after capability/oracle normalization |
| `07_phase07` | 11 | Fault/case proposals and policies | Current archive proposal; 33 of 34 cases are AI drafts | Merge policies; do not promote draft cases |
| `audit/2026-10-07` | 5 | Historical source/code audit evidence | Useful but paths/line numbers may be stale | Preserve as dated audit evidence |
| `review_v0.2` | 9 | Corrections to Phase 01–04 | Best archive semantic baseline, now revalidated selectively | Canonical candidate / merge source |
| `dev_prompts` | 2 | Workflow prompts | Not engineering truth | Transfer artifact |
| archive root metadata | 2 | Manifest and archive README | Accurate delivery metadata | Transfer artifact |
| outer ZIP | 1 | Delivery package | Binary transport copy | Transfer artifact; never canonical source |

## Data-set inventory and integrity observations

| Dataset | Rows | Key result |
|---|---:|---|
| Phase 04 signals | 111 | Candidate signals, not 111 runtime-observable signals |
| Phase 04 interfaces | 49 | Candidate boundaries, not independently captured endpoints |
| Phase 05 LF review | 74 | 5 VERIFIED / 27 PARTIAL / 42 DESIGN_ONLY reproduced |
| Phase 05 requirements | 180 | 32 FR / 74 SYSR / 62 SWR / 12 SIMR; all candidates |
| Phase 05 trace links | 222 | Draft links; direction and approval must remain explicit |
| Phase 06 LF test cases | 74 | All `DRAFT_NOT_APPROVED`; all lack an approved candidate oracle |
| Phase 06 requirement matrix | 180 | Strategy proposals, not proof of execution |
| Phase 07 cases | 34 | 1 existing canonical game case, 33 `AI_DRAFT` |
| Phase 07 fault families | 20 | Taxonomy, not implemented detection/reaction functions |

No duplicate primary IDs were found within the Phase 05 requirement catalog, Phase 06 LF TC catalog, or Phase 07 case catalog. That does not make their cross-file semantics canonical.

## Exact duplicates and structural defects

- Exact duplicate: `dev_prompts/CODEX_G0_RECONCILIATION_PROMPT_KO.md` and `review_v0.2/CODEX_G0_RECONCILIATION_PROMPT_KO.md` have the same SHA-256.
- Both reviewed Phase 04 CSV files repeat the four appended audit column names twice. Importers may silently overwrite one set; these files must be normalized before canonical use.
- The archive copy of `PRODUCT_REQUIREMENTS_RECONCILIATION.md` is not byte-identical to the current repository document. The current document wins.
- The archive copy of `VERIFICATION_WORKBENCH_CAPABILITY_AUDIT.md` is not byte-identical to the current repository document. The current document wins.
- `Requirement.md`, `TRACKBACK Propulsion Reference Requirements v0.1.md`, and `00_TRACEBACK_MASTER.md` are byte-identical to their archive snapshots.
- DOT is the editable relationship source for the whole-vehicle diagram. SVG is a render artifact and must not be parsed as an independent architecture authority.

## Current implementation inspected

The audit directly inspected the DriverInput runtime, SimulationRuntime, C/WASM ABI and Gear/Propulsion/VMC/eDrive implementations, adapters, Rapier physics, architecture and trace registries, Verification Workbench capability model, fault injection, case runtime/definition, Ground Truth, calibration, and automated-test source. The current runtime conclusion is recorded in `04_RUNTIME_REFERENCE_MODEL_GAP.md`.

## Classification key

- `CANONICAL_CANDIDATE`: suitable base after explicit review and normalization.
- `MERGE_INTO_CANONICAL`: contains data needed by a canonical artifact but is not independently authoritative.
- `AUDIT_EVIDENCE`: dated evidence or decision record.
- `HISTORICAL`: retained for provenance only.
- `TRANSFER_ARTIFACT`: delivery/readme/prompt/render/package, not engineering truth.
- `SUPERSEDED`: replaced semantically by a reviewed version.
- `DUPLICATE`: byte-identical redundant copy.
- `DELETE_CANDIDATE`: may be removed only after canonical migration, checksum, and user approval.
- `UNRESOLVED`: disposition requires an owner decision.

The row-level disposition for every file is in `02_CANONICALIZATION_MATRIX.csv`.
