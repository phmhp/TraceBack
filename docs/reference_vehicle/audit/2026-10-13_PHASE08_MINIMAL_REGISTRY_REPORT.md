# Phase 08 — Minimal Unified Reference Vehicle Registry

## 1. Purpose

Phase 08 adds a small, typed, in-process registry over the accepted Reference Vehicle v0.3.1 canonical sources. It makes stable engineering IDs and proven relations queryable without copying canonical truth into a second hand-maintained architecture or changing the playable vehicle runtime.

Completion gate: `PHASE08_REGISTRY_READY_WITH_OPEN_ENGINEERING_DECISIONS`.

## 2. Canonical source files consumed

- `docs/reference_vehicle/architecture/02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md`
- `docs/reference_vehicle/interfaces/04_SIGNAL_CATALOG.csv`
- `docs/reference_vehicle/interfaces/04_INTERFACE_CATALOG.csv`
- `docs/reference_vehicle/requirements/05_REQUIREMENT_CATALOG.csv`
- `docs/reference_vehicle/requirements/05_TRACEABILITY.csv`
- `docs/reference_vehicle/verification/06_TEST_CASE_CATALOG.csv`
- `docs/reference_vehicle/verification/06_REQUIREMENT_TC_TRACEABILITY.csv`
- `docs/reference_vehicle/cases/07_CASE_CATALOG.csv`
- `docs/reference_vehicle/cases/07_CASE_REQUIREMENT_TC_TRACEABILITY.csv`

Machine-readable catalogs are preferred. The architecture Markdown is used only for Logical Function names, roles, and function-kind information not carried by the CSV catalogs.

## 3. Existing structures reused

- `src/registries/investigation/Architecture.ts` remains the current playable investigation/runtime presentation registry.
- `src/registries/investigation/Trace.ts` remains the current investigation trace and selection compatibility layer.
- `src/data/ground-truth/PropulsionGroundTruth.ts` remains the approved playable Propulsion requirement/test truth used by the current case.
- `src/runtime/investigation/CaseDefinition.ts` remains the current CASE-PT-001 gameplay definition and root truth.
- The existing Node test runner, TypeScript build, ESLint, and Vite build conventions are reused.

These structures were inspected but not migrated or modified. They remain intentionally separate until the later Reference UI integration pass.

## 4. New files created

- `scripts/build-reference-vehicle-registry.mjs`
- `src/referenceVehicle/types.ts`
- `src/referenceVehicle/registry.ts`
- `src/referenceVehicle/index.ts`
- `src/referenceVehicle/generated/reference-vehicle-registry.json` — generated; do not edit manually
- `tests/reference-vehicle-registry.test.mjs`
- `docs/reference_vehicle/audit/2026-10-13_PHASE08_MINIMAL_REGISTRY_REPORT.md`

## 5. Files modified

- `package.json` — adds `build:registry` and `check:registry` scripts only.

No Phase 08 change was made to runtime, physics, C/WASM, UI, canonical engineering catalogs, CASE-PT-001 truth, or `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`. Other pre-existing working-tree changes were left untouched.

## 6. Ingestion strategy

A deterministic build-time generator parses the nine accepted canonical sources, validates their required columns and IDs, and emits one stable JSON artifact. The output contains source SHA-256 values, provenance paths/rows, typed entities, normalized source-backed relations, explicit unresolved references, and accepted counts. It contains no generation timestamp, so identical canonical input produces byte-identical output.

`npm run build:registry` regenerates the artifact. `npm run check:registry` rebuilds in memory and fails when the committed/generated artifact has drifted.

No canonical row was manually copied into TypeScript. Missing ownership and external endpoints are not invented.

## 7. Entity counts

| Entity family | Count |
| --- | ---: |
| AREA | 16 |
| LOGICAL_FUNCTION | 74 |
| SIGNAL | 111 |
| INTERFACE | 50 |
| REQUIREMENT | 180 |
| TEST_CASE | 74 |
| CASE | 34 |
| **Total** | **539** |

Capability status remains `VERIFIED: 5`, `PARTIAL: 27`, `DESIGN_ONLY: 42` for the 74 Reference LF Test Cases.

## 8. Relation count

The Registry contains **2,195 resolved relations**. All resolved relation endpoints are registry entities. A further **17 references** are deliberately separated as unresolved provenance because the canonical producer/consumer field is literally `OPEN`; they are not treated as graph relations or silently assigned to a Function.

## 9. Query API

The public module `src/referenceVehicle/index.ts` exposes:

- `getEntity(id)`
- `getEntitiesByKind(kind)`
- `getRelationsFrom(id)`
- `getRelationsTo(id)`
- `getRelations(id)`
- `getRelationsByKind(kind)`
- `getFunctionsForArea(areaId)`
- `getSignalsForFunction(functionId)`
- `getInterfacesForFunction(functionId)`
- `getRequirementsForEntity(id)`
- `getTestsForRequirement(requirementId)`
- `getCaseRelations(caseId)`
- `validateReferenceVehicleRegistry()`

Internal indexes remain private and in-process. No database, server, persistence layer, or general graph framework was added.

## 10. Validation results

- Accepted counts: PASS (16 / 74 / 111 / 50 / 180 / 74 / 34)
- Duplicate canonical IDs: 0
- Dangling internal relation endpoints: 0
- Explicit external/unresolved references: 17, all source-backed `OPEN`
- Unknown entity kinds: 0
- Generated registry drift: 0
- Canonical source resolution failures: 0
- Lookup by ID/kind, forward/reverse relation queries, CASE-PT-001 resolution, Propulsion references, and open-status preservation: PASS
- `Trackback_VMC` is not promoted to full Reference Motion Coordination.
- `CURRENT_RUNTIME` and `REFERENCE_DESIGN` remain distinguishable.
- `DESIGN_ONLY`, `DRAFT_NOT_APPROVED`, `SW_OWNER_TBD`, and open external decisions are preserved.
- No Interface transport was inferred as CAN or Ethernet.
- Reference-only tests were not promoted to executable verdict capability.
- CASE-PT-001 gameplay root truth was not changed.

## 11. Compatibility behavior

The new Registry is not imported by the current runtime or UI. Existing registries and gameplay data continue to serve the playable case unchanged. This is a compatibility-first foundation for gradual later migration, not a big-bang replacement.

Validation completed:

- `npm run check:registry`: PASS
- `npm run typecheck`: PASS
- `npm run lint`: PASS
- `npm test`: PASS, 138/138
- `npm run build`: PASS
- Local Vite start: PASS (`HTTP 200`, root application mount present)
- Existing CASE-PT-001/C/WASM/Rapier/investigation paths: PASS through the full automated regression suite

The desktop browser automation bridge could not attach because its Windows sandbox helper exited during validation; no manual claim beyond startup is made. The application startup response and existing end-to-end runtime regressions were nevertheless verified independently.

## 12. Open engineering decisions preserved

The Registry retains source values including `OPEN`, `EXTERNAL_VALIDATION_REQUIRED`, `OPEN_EXTERNAL_VALIDATION_REQUIRED`, `DESIGN_ONLY`, `DRAFT_NOT_APPROVED`, and `SW_OWNER_TBD`. The 17 `OPEN` external/design-owner references remain explicit unresolved records. No external-domain owner, transport, implementation, oracle, maturity, or approval was inferred.

## 13. Runtime behavior changed

**NO.** Runtime files whose behavior changed in Phase 08: **0**.

## 14. Reconciliation regression

**NO.** `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md` was not changed, and the complete existing test/build suite passed.

## 15. Remaining integration work

The current investigation UI still reads its existing compatibility registries. A later, separately scoped integration should migrate one UI slice at a time to canonical Registry IDs, retain the current executable-vs-reference capability boundaries, and add UI-level verification before removing any legacy adapter. The recommended next gate is `PROCEED_TO_REFERENCE_UI_INTEGRATION_WITH_OPEN_ENGINEERING_DECISIONS`.
