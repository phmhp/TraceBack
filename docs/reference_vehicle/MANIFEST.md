# TRACKBACK Reference Vehicle Manifest

> Canonical Root: `docs/reference_vehicle/`  
> Version: 0.3.1
> Status: REVIEWED_DRAFT  
> Canonical: YES  
> Last Reviewed: 2026-10-13

## Truth priority

1. Current executable runtime/code
2. Approved TRACKBACK canonical data
3. Reviewed reference-vehicle design
4. Historical/audit material
5. Drafts

## v0.3.1 control-flow normalization baseline

- Counts: 16 areas, 74 LF, 111 signals, 50 interfaces, 180 requirements, 74 reference LF test cases, 34 cases. `IFC-DESIGN-050`은 기존 catalog에 빠져 있던 Propulsion request → Motion Coordination 논리 경계를 명시하기 위해 추가했다.
- Common architecture decision: Reference Motion Coordination owns vehicle-level longitudinal authority/selection/feasible-target/drive-vs-brake allocation; domain functions retain final domain command ownership.
- Runtime compatibility: current host brake-over-drive behavior remains `CURRENT_RUNTIME_POLICY`; no runtime file or calibration was changed.
- Open by design: detailed ABS/TCS/ESC placement, brake blending, EPS authority, lateral reference quantity, ADAS authority, energy/regen coordination, production diagnostics, multi-rate execution, plant fidelity, safety lifecycle, occupant protection.
- Correction evidence: `audit/2026-10-10_ARCHITECTURE_CORRECTION_REPORT.md` and `audit/2026-10-10_ARCHITECTURE_CORRECTION_REVALIDATION.md`.
- Normalization evidence: `audit/2026-10-13_CONTROL_FLOW_NORMALIZATION_REPORT.md` and `audit/2026-10-13_CONTROL_FLOW_NORMALIZATION_REVALIDATION.md`.

`audit/`는 evidence와 historical snapshot을 보존하며 현재 canonical vehicle definition을 정의하지 않는다. `DESIGN_ONLY`는 invalid가 아니라 current runtime baseline에 미구현이라는 뜻이다. Canonical engineering documents are Korean; identifiers and technical terms remain English where useful.

## Canonical files

| File | Purpose |
|---|---|
| `README.md` | 모델 범위, runtime 경계, 기여 절차 |
| `MANIFEST.md` | authority와 canonical 파일 목록 |
| `architecture/01_REFERENCE_ARCHITECTURE_KO.md` | 16-area whole-vehicle architecture |
| `architecture/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md` | 74 LF decomposition and status baseline |
| `architecture/03_INTERNAL_LOGIC_STATE_MACHINE_KO.md` | merged Phase 03 logic/state design and runtime semantic overlay |
| `interfaces/04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md` | signal/interface semantics and limitations |
| `interfaces/04_SIGNAL_CATALOG.csv` | normalized 111-signal catalog |
| `interfaces/04_INTERFACE_CATALOG.csv` | normalized 50-interface catalog and observability axes |
| `requirements/05_REQUIREMENTS_ENGINEERING_KO.md` | FR/SYSR/SWR/SIMR method and candidates |
| `requirements/05_REQUIREMENT_CATALOG.csv` | 180 requirement candidates |
| `requirements/05_TRACEABILITY.csv` | 222 draft requirement trace links |
| `requirements/05_OPEN_DECISIONS.csv` | unresolved engineering decisions |
| `requirements/05_SAFETY_TRACE_GATE_KO.md` | no-HARA/no-ASIL safety gate |
| `verification/06_TEST_VERIFICATION_ENGINEERING_KO.md` | test/verification reference model |
| `verification/06_TEST_CASE_CATALOG.csv` | 74 LF test-design candidates |
| `verification/06_REQUIREMENT_VERIFICATION_MATRIX.csv` | 180 requirement verification dispositions |
| `verification/06_REQUIREMENT_TC_TRACEABILITY.csv` | draft requirement-to-TC relations |
| `verification/06_VERIFICATION_CAPABILITY.csv` | technique/runtime capability limits |
| `verification/06_ORACLE_VERDICT_POLICY_KO.md` | oracle and verdict authority |
| `cases/07_FAULT_CASE_ENGINEERING_KO.md` | fault/case engineering model |
| `cases/07_FAULT_FAMILY_CATALOG.csv` | 20 fault-family candidates |
| `cases/07_CASE_CATALOG.csv` | 1 canonical game case plus 33 AI drafts |
| `cases/07_SCENARIO_STIMULUS_CATALOG.csv` | reusable scenario stimuli |
| `cases/07_CASE_REQUIREMENT_TC_TRACEABILITY.csv` | draft case-to-LF/requirement/TC relations |
| `cases/07_CASE_EVIDENCE_VISIBILITY_POLICY_KO.md` | player-visible/hidden truth policy |
| `cases/07_REPAIR_REPLAY_ORACLE_POLICY_KO.md` | repair/replay invariants and oracle policy |

## Non-canonical preserved material

- `audit/2026-10-07/`: migrated historical code-audit evidence.
- `audit/2026-10-10_ARCHIVE_DISPOSITION.md`: archive accounting.
- `audit/2026-10-10_CANONICALIZATION_VALIDATION.md`: canonical validation record.
- `canonicalization_audit/`: pre-apply inventory, gap reports, and Phase 08 proposal.
- `TRACKBACK_REFERENCE_VEHICLE_FULL_ARCHIVE_2026-10-10/` and the ZIP: preservation/transfer archive only.
- Root-level pre-canonical Phase 01–04 files: superseded working copies pending cleanup disposition.

Phase-specific README files, prompts, `_REVIEWED_v0.2` names, crosswalks, and review matrices inside the preservation archive are not parallel canonical sources.
