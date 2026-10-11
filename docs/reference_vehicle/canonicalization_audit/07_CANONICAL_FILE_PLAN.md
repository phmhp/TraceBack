# Canonical File Plan

## Decision

The proposed structure is sound with three adjustments:

1. Add machine-readable `graph/` and `provenance/`; otherwise Phase 08 would still rely on page-specific CSV joins.
2. Preserve dated audits and archived phase packages outside canonical registries rather than deleting them immediately.
3. Name catalogs by stable entity meaning, while retaining phase numbers only in narrative filenames for migration continuity.

## Proposed structure

```text
docs/reference_vehicle/
  README.md
  MANIFEST.md
  architecture/
    01_REFERENCE_ARCHITECTURE_KO.md
    02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md
    03_INTERNAL_LOGIC_STATE_MACHINE_KO.md
  interfaces/
    04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md
    04_SIGNAL_CATALOG.csv
    04_INTERFACE_CATALOG.csv
  requirements/
    05_REQUIREMENTS_ENGINEERING_KO.md
    05_REQUIREMENT_CATALOG.csv
    05_TRACEABILITY.csv
    05_OPEN_DECISIONS.csv
    05_SAFETY_TRACE_GATE_KO.md
  verification/
    06_TEST_VERIFICATION_ENGINEERING_KO.md
    06_TEST_CASE_CATALOG.csv
    06_REQUIREMENT_VERIFICATION_MATRIX.csv
    06_REQUIREMENT_TC_TRACEABILITY.csv
    06_VERIFICATION_CAPABILITY.csv
    06_ORACLE_VERDICT_POLICY_KO.md
  cases/
    07_FAULT_CASE_ENGINEERING_KO.md
    07_FAULT_FAMILY_CATALOG.csv
    07_CASE_CATALOG.csv
    07_SCENARIO_STIMULUS_CATALOG.csv
    07_CASE_REQUIREMENT_TC_TRACEABILITY.csv
    07_CASE_EVIDENCE_VISIBILITY_POLICY_KO.md
    07_REPAIR_REPLAY_ORACLE_POLICY_KO.md
  graph/
    entities.json
    relations.json
    schema.json
  provenance/
    sources.csv
    decisions.csv
  integration/
    08_INTEGRATED_DATA_MODEL_KO.md
    08_VALIDATION_RULES.md
  audit/
    YYYY-MM-DD/
  archive/
    phase01-07/  # optional later move; unchanged until approved
```

## Canonical seeds

- Architecture: reviewed v0.2 architecture and function decomposition, with current runtime overlay.
- Internal logic: Phase 03 detailed source merged with reviewed combined corrections; do not simply copy the monolith.
- Interfaces: reviewed Phase 04 documents and CSVs only after duplicate-column normalization.
- Requirements: Phase 05 narratives/catalogs, retaining candidate/approval/calibration axes.
- Verification: Phase 06 narratives/catalogs, retaining draft/executable/oracle distinctions.
- Cases: Phase 07 policies/catalogs, preserving one canonical case versus 33 AI drafts.
- Integration: the Phase 08 schema in this audit, after owner decisions.

## Files not to use as canonical seeds

- Outer ZIP, prompt files, handoff READMEs, rendered SVG, and archive manifest.
- Stale copies of current repository source documents.
- Historical audit reports as if they were live registries.
- Phase 01–04 originals where reviewed v0.2 exists, except to recover content demonstrably omitted from the reviewed file.

## Counts

- `CANONICAL_CANDIDATE`: **15** matrix rows.
- `SUPERSEDED`: **8** matrix rows.
- `DUPLICATE`: **1** matrix row.
- Therefore duplicate/superseded cleanup candidates: **9** rows, subject to preservation and migration approval.

## Deletion policy

No file is deleted in this pass. A delete candidate can be removed only after: canonical merge review, source hash recorded in MANIFEST, link/reference scan, generated artifact reproducibility where relevant, repository regression, and explicit user approval. Prefer keeping the original archive immutable outside the canonical query path.
