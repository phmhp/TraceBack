# Reference Vehicle UI Integration Report

Date: 2026-10-13  
Completion gate: `REFERENCE_UI_INTEGRATION_READY_WITH_LEGACY_ADAPTERS`  
Next recommendation: `PROCEED_TO_GAMEPLAY_DESIGN_CORRECTION_WITH_UI_FOLLOWUP`

## 1. UI slices migrated

- Page 2 now exposes all Registry-backed Vehicle Areas and their Logical Functions.
- The whole-vehicle reference architecture, CASE-PT-001 active path, and current executable runtime path are presented as separate scopes.
- Canonical Logical Function selection drives an in-place Function Inspector with Signal, Interface, Requirement, and Test Case context.
- Page 2's existing selection/history state is reused; no competing global selection store was added.
- Pages 1, 3, and 4 were not redesigned. Their existing navigation and behavior remain active.

## 2. Legacy sources still active

- `src/registries/investigation/Architecture.ts` remains the current executable CASE map and Signal Monitor capability source.
- `src/registries/investigation/Trace.ts` remains the shared Page 2 selection/compatibility policy and now contains a small canonical-ID branch.
- `src/data/ground-truth/PropulsionGroundTruth.ts` remains the current CASE-PT-001 runtime/verification truth source.
- Existing Page 2 `FunctionInspector`, `ViewBSignals`, `ViewCInterfaces`, and `ViewDStandards` remain active for legacy executable component selections.
- Current Workbench, C/WASM execution, incident evidence, oracle behavior, and report assessment remain untouched.

## 3. Registry queries used

The UI adapter uses the existing `src/referenceVehicle/` query layer for:

- entity lookup and entities by kind;
- relations around an entity;
- Area to Logical Function lookup;
- Function to Signal lookup;
- Function to Interface lookup;
- entity to Requirement lookup;
- Requirement to Test Case lookup;
- CASE-PT-001 relations.

No second Registry or duplicate vehicle ontology was created.

## 4. Files created

- `src/ui/investigation/referenceVehicle/ReferenceVehicleUIAdapter.ts`
- `src/ui/investigation/referenceVehicle/ReferenceVehiclePanels.tsx`
- `tests/reference-vehicle-ui-integration.test.mjs`
- `docs/reference_vehicle/audit/2026-10-13_REFERENCE_UI_INTEGRATION_REPORT.md`

## 5. Files modified

- `src/registries/investigation/Trace.ts`
- `src/ui/investigation/InvestigationWorkspace.tsx`
- `src/ui/investigation/investigation-layout.css`
- `src/ui/investigation/pages/Page2Tracking.tsx`
- `src/ui/investigation/pages/page2/Page2ContextBar.tsx`
- `src/ui/investigation/pages/page2/ViewAFlow.tsx`

## 6. Canonical IDs now exposed in UI

- All 16 canonical Area IDs are selectable.
- All 74 canonical Logical Function IDs are reachable through their Areas.
- Related canonical Signal, Interface, Requirement, Test Case, and CASE IDs are displayed as engineering identity rather than display-name-derived identity.
- CASE-PT-001 Registry relations determine case focus; graph adjacency is not guessed visually.

## 7. Runtime/reference distinction behavior

- `WHOLE VEHICLE · REFERENCE ARCHITECTURE` is separate from `ACTIVE CASE PATH`.
- Canonical Signal definitions display identity, semantic kind, unit, source-backed capability, and scope.
- A Signal is described as runtime-observable only when the existing runtime Signal registry has a real reader for that same ID.
- Reference-only Signals never receive fabricated live values.
- Actual values and Expected comparisons remain owned by the existing Current Runtime Signal Monitor.
- Interface detail keeps logical boundary, runtime transfer, transport mapping, observation/comparison capability, and feedback semantics distinct.

## 8. Open-status presentation

- Source-backed `CURRENT_RUNTIME`, `REFERENCE_DESIGN`, `BOTH`, `VERIFIED`, `PARTIAL`, `DESIGN_ONLY`, and open decision status are visible.
- DESIGN_ONLY and Reference Design entities remain visible, readable, clickable, and keyboard-accessible without being presented as executable.
- Open engineering decisions remain labelled `OPEN DECISION`; no gaps were filled for presentation convenience.
- Requirement/Test detail preserves approval, owner, oracle, implementation, and verdict-policy status. Registry linkage is explicitly not presented as executable PASS/FAIL.

## 9. CASE-PT-001 compatibility

- Existing CASE-PT-001 compatibility path and executable inspection tools remain intact.
- Canonical selection uses the current Page 2 selection object and preserves related canonical IDs.
- Legacy component selection still follows the prior ownership/allocation reconciliation rules.
- A regression where a legacy component plus an overlapping canonical Signal could be remapped was found and fixed by applying canonical anchor fallback only when no component is already selected.
- Trackback_VMC is described only as the current narrow Propulsion torque-generation/local-attenuation role. The UI explicitly states that LF-MC-REQ/AUTH/LON/LAT/ALLOC remain separate DESIGN_ONLY Reference Design functions.

## 10. Automated validation

- `npm run check:registry`: PASS — 539 entities, 2195 relations, no drift.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS — 145/145.
- `npm run build`: PASS — Vite production build completed; the pre-existing large-chunk advisory remains non-blocking.
- Focused integration coverage verifies Area navigation, CASE focus, Function relations, canonical/legacy selection compatibility, runtime/reference Signal separation, DESIGN_ONLY/open status, and Trackback_VMC semantics.

## 11. Browser/manual validation

The Windows browser automation bridge was restored by enabling MXC preference while retaining the legacy elevated fallback. The official MXC probe returned `MXC_OK`, and the in-app browser exposed the live localhost DOM afterward.

Verified in the running application:

1. game startup and START transition;
2. real CASE-PT-001 incident capture;
3. Page 1 to Page 2 navigation;
4. all 16 Areas and 74 Logical Functions visible from Registry;
5. separate whole-vehicle, case-path, and runtime-path presentation;
6. Area selection, including BRAKING resolving seven Functions;
7. canonical Function Inspector selection;
8. Signal definition view and Reference-only/runtime-observation distinction;
9. Interface view and logical-boundary transport warning;
10. Requirement view and linked Test Case trace;
11. previous investigation-context navigation;
12. Page 3 opens and the existing Workbench remains present;
13. Page 4 opens;
14. no root-cause truth was exposed by the Reference UI.

## 12. Regressions found and fixed

- Fixed canonical selection reconciliation so legacy runtime selections are not remapped through an overlapping Reference Signal ID.
- Retained the established Page 2 architecture label contract required by existing regression tests while adding the more precise active-case-path label.
- Full regression suite passed after both fixes.

## 13. Remaining legacy UI dependencies

- Executable component capability, live Signal readers, boundary comparison, current requirements/oracles, and Workbench execution still depend on the compatibility registries and Propulsion ground truth.
- Canonical Reference selections use a thin adapter rather than replacing legacy executable semantics.
- Page 1, Page 3, and Page 4 have not been migrated to canonical Reference detail surfaces.
- The complete 74-Function graph is intentionally presented as Area-to-Function browsing rather than a new large graph engine.

## 14. Next recommended migration slice

Proceed to gameplay design correction while retaining a UI follow-up for small, evidence-led migration of shared context handoffs into Pages 1, 3, and 4. Keep runtime observation, verification execution, and CASE truth behind the existing compatibility adapters until each replacement has direct executable evidence and dedicated regression coverage.

No canonical engineering data, generated Registry artifact, C/WASM behavior, Rapier behavior, fault injection, CASE-PT-001 root truth, or reconciliation matrix entry was changed.
