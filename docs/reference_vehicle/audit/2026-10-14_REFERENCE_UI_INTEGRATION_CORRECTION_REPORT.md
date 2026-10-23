# Reference Vehicle UI Integration Correction Report

Date: 2026-10-14  
Completion gate: **REFERENCE_UI_CORRECTION_READY_WITH_LEGACY_ADAPTERS**

## 1. Previous misunderstanding

The previous integration treated the Reference Vehicle Registry as a reason to add a separate Whole Vehicle Architecture experience. That produced a large standalone architecture panel and a flat Area/Logical Function catalog beside the existing investigation tools. The task intent was instead to improve the accuracy and depth of the existing Structure/Function, Signal, Interface, Requirement, and verification content without adding a parallel investigation product.

## 2. Redundant UI removed or folded

- `ViewAFlow` no longer imports or renders the standalone `ReferenceVehicleArchitecture` panel.
- Whole-vehicle context is folded into the existing Structure/Function sheet as a compact five-layer context map.
- The existing CASE-PT-001 executable path remains the primary detailed diagram.
- Canonical and runtime functions now share the existing Function Inspector in the FLOW view.
- The duplicate Test Design Technique picker/explanation was removed from `VehicleScenarioWorkbench`; Page 3 retains one selection source.

## 3. Registry-backed data preserved

- The generated Registry remains the source for Area, Logical Function, Signal, Interface, Requirement, Test Case, focus, capability, scope, approval, and relationship data.
- CASE relevance is presented as `PRIMARY_FOCUS`, `CONTEXT`, or `BACKGROUND`; background Reference Vehicle content is not hidden.
- Runtime observations remain separate from Reference Design definitions.
- `DESIGN_ONLY`, draft, open-decision, and reference-only states are not presented as executable runtime facts.
- Trackback_VMC remains explicitly described as a narrow propulsion torque-generation role, not the full Motion Coordination reference architecture.

## 4. Structure and Function improvements

- The existing vehicle architecture sheet now places the CASE path within five whole-vehicle layers: input/state, driving functions, motion coordination, execution/vehicle, and support functions.
- Selecting a canonical Area routes into the existing Function Inspector instead of opening a separate catalog.
- The Function Inspector resolves canonical ID, Area, role, responsibility, upstream/downstream functions, input/function/output flow, connected interfaces, related requirements, provenance, capability, and scope.
- Legacy runtime components map to their nearest canonical Reference Function only through an explicit adapter table; the UI does not claim identity where only a correspondence exists.

## 5. Interface improvements

- The existing Interface tab retains its source → boundary/signal → destination flow.
- When a runtime edge has a verified Registry mapping, the inspector adds canonical interface ID, boundary kind, runtime transfer status, observation availability, comparison capability, capability/scope, and related requirements.
- Copy explicitly avoids claiming CAN, Ethernet, or any other physical transport from a logical interface alone.
- No network communication or unobserved transfer is fabricated.

## 6. Signal improvements

- The existing Signal Monitor separates `SIGNAL DEFINITION` from `RUNTIME OBSERVATION`.
- Canonical semantic kind and unit are added only when a same-ID Registry signal exists.
- Runtime observation availability is stated independently; no synthetic live value or reference run is introduced.

## 7. Requirement and Test improvements

- The existing requirement inspector keeps the current executable requirement and evidence flow intact.
- Registry-backed requirement allocations are shown as compact contextual records rather than a new parallel browser.
- Requirement-to-test identity remains canonical and selection-safe where the existing navigation contract supports it.
- Canonical Reference requirements are not silently converted to legacy runtime requirement IDs.

## 8. Duplicate Test Design Technique correction

- Page 3 owns the single `TestDesignTechnique` state.
- `VehicleScenarioWorkbench` receives that selected technique as a prop and uses it to construct the executable scenario.
- Its duplicate technique picker and duplicate explanatory block were removed.
- A regression test asserts that the workbench no longer contains a second `TEST DESIGN TECHNIQUE` or `technique-picker`.

## 9. Remaining legacy adapter usage

- `ReferenceVehicleUIAdapter.ts` still bridges legacy runtime component IDs to canonical Reference Function IDs and three audited runtime edges to canonical interface IDs.
- `ReferenceVehicleInspector` remains in use for canonical Signal/Interface/Requirement views while the existing legacy views continue serving executable runtime components.
- This retained compatibility layer is why the completion gate is `REFERENCE_UI_CORRECTION_READY_WITH_LEGACY_ADAPTERS` rather than the adapter-free gate.
- Removing it safely requires a later shared inspector data contract; that refactor was outside this correction and would risk existing implemented behavior.

## 10. Browser validation

- The application target remains `http://localhost:5173/` and the current in-app browser is pointed at that URL.
- Source-level UI assertions confirm the standalone architecture component is absent from `ViewAFlow`, the integrated context map is present, canonical/runtime functions share the existing Function Inspector, and Page 3 has one technique source.
- Automated browser clicking and screenshot inspection could not be completed in this session because the Windows computer-use/browser automation runtime was not exposed to the agent. No visual result is claimed from compilation alone.
- Manual follow-up should inspect Page 2 at desktop and narrow widths, switch Structure/Function → Signal → Interface → Requirement for both a runtime component and canonical function, and confirm the Page 3 technique selection remains stable while editing inputs.

## 11. Automated validation

- `npm run check:registry`: PASS — generated Registry current, 539 entities and 2,195 relations.
- `npm run typecheck`: PASS.
- `npm run lint`: PASS.
- `npm test`: PASS — 148/148.
- `npm run build`: PASS.
- Targeted Reference UI correction tests: PASS — 10/10.
- The first sandboxed full-test attempt produced six `EPERM` write failures under the actual OneDrive worktree; rerunning the identical suite with repository-scoped write permission passed 148/148. These were environment permission failures, not product regressions.

## 12. Remaining UI issues

- Visual density of the whole-vehicle context map still needs manual browser review at the actual target resolution.
- Canonical non-FLOW inspection still uses `ReferenceVehicleInspector`, so some presentation differences remain between canonical and runtime selections.
- Canonical requirement allocations in the legacy requirement view are contextual records rather than fully selectable navigation targets, preventing an invalid legacy-ID reconciliation.
- Existing large production chunks remain a Vite build warning and were not introduced or addressed by this UI correction.
- No gameplay, C/WASM, Rapier, vehicle behavior, canonical engineering truth, CASE-PT-001 truth, or reconciliation matrix behavior was changed.
