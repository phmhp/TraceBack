IMPORTANT:
Preserve every IMPLEMENTED item in docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md.
Any regression against that reconciliation matrix is a release blocker.

# TRACKBACK
# Reference Vehicle UI Integration
# Phase 08 Registry → Existing Investigation UI
# IMPLEMENTATION TASK

Repository:
Use the currently opened TraceBack repository.

This is an IMPLEMENTATION task.

The implementation period is limited.

Do NOT redesign the entire UI.
Do NOT replace all legacy registries in one pass.
Do NOT perform gameplay redesign in this task.

The purpose is:

Make the already-completed Phase 08 Reference Vehicle Registry visibly usable
inside the existing investigation UI, starting with Page 2 and preserving all
current playable behavior.

==================================================
0. ACCEPTED BASELINE
==================================================

Phase 08 is complete.

Expected Registry state:

Completion gate:
PHASE08_REGISTRY_READY_WITH_OPEN_ENGINEERING_DECISIONS

Next recommendation:
PROCEED_TO_REFERENCE_UI_INTEGRATION_WITH_OPEN_ENGINEERING_DECISIONS

Registry module:

src/referenceVehicle/

Canonical source:

docs/reference_vehicle/

Expected entity counts:

AREA: 16
LOGICAL_FUNCTION: 74
SIGNAL: 111
INTERFACE: 50
REQUIREMENT: 180
TEST_CASE: 74
CASE: 34

Total entities:
539

Resolved relations:
2195

Open/unresolved source-backed references:
17

Existing Phase 08 query API includes equivalents of:

getEntity(id)
getEntitiesByKind(kind)
getRelationsFrom(id)
getRelationsTo(id)
getRelations(id)
getFunctionsForArea(areaId)
getSignalsForFunction(functionId)
getInterfacesForFunction(functionId)
getRequirementsForEntity(id)
getTestsForRequirement(requirementId)
getCaseRelations(caseId)

Do NOT rebuild Phase 08.

==================================================
1. PURPOSE
==================================================

The Reference Vehicle architecture currently exists as:

canonical engineering data
→ generated Registry
→ query API

but the current investigation UI still relies primarily on:

src/registries/investigation/Architecture.ts
src/registries/investigation/Trace.ts
src/data/ground-truth/PropulsionGroundTruth.ts
current CASE-PT-001 compatibility structures

This pass shall make the Reference Vehicle visible in the game UI without
breaking the existing playable investigation.

The target relationship is:

ReferenceVehicleRegistry
        ↓
Whole Vehicle Architecture
        ↓
Active Case Path
        ↓
Function Inspector
        ↓
Signal / Interface context
        ↓
Requirement / Test trace

==================================================
2. SCOPE — PAGE 2 FIRST
==================================================

Prioritize Page 2.

Do NOT migrate all Pages 1–4 at once.

P0 scope:

1. Whole Vehicle Architecture view
2. Active Case Path view
3. Area → Logical Function navigation
4. Function → Signal / Interface lookup
5. Function / Signal / Interface → Requirement lookup
6. Requirement → Test Case trace where supported
7. CURRENT_RUNTIME / REFERENCE_DESIGN / DESIGN_ONLY / OPEN distinction
8. Compatibility with current CASE-PT-001 investigation

Page 1, Page 3 and Page 4 may receive only minimal integration needed to keep
navigation/context consistent.

Do not redesign gameplay progression here.

==================================================
3. FIRST TASK — AUDIT CURRENT UI DATA FLOW
==================================================

Before modifying code, inspect:

- Page 2 component tree
- current architecture map source
- current active case path source
- Function Inspector data source
- Signal Monitor data source
- Interface analysis data source
- Requirements view data source
- Test trace data source
- current selected-domain/function/signal state
- compatibility registries
- CASE-PT-001 current runtime path mapping

Produce a short implementation note in the final report explaining:

1. what currently reads legacy registries
2. what can directly read ReferenceVehicleRegistry
3. what still requires a compatibility adapter
4. what must remain untouched in this pass

Do not create duplicate UI state if current selection state can be reused.

==================================================
4. CORE UI PRINCIPLE
==================================================

The UI must distinguish:

A. WHOLE VEHICLE REFERENCE ARCHITECTURE

from:

B. CURRENT CASE PATH

from:

C. CURRENT EXECUTABLE RUNTIME PATH

These must not be visually or semantically merged.

The player should be able to understand:

"This is the whole reference vehicle."

"This is the path relevant to the current case."

"This subset is actually implemented/executable today."

==================================================
5. WHOLE VEHICLE ARCHITECTURE
==================================================

Use Registry Area entities as the source.

Show the full set of canonical Areas.

Do not hardcode Area labels independently if Registry data can provide them.

The view should support:

Area selection
→ contained Logical Functions
→ related engineering data

Reference-only Areas must remain visible.

Do not hide DESIGN_ONLY architecture simply because it is not executable.

Instead show capability/status clearly.

Possible visual status concepts:

CURRENT RUNTIME
PARTIAL
REFERENCE DESIGN
DESIGN ONLY
OPEN DECISION

Use actual source-backed status values or a documented UI mapping.

Do not invent implementation claims.

==================================================
6. ACTIVE CASE PATH
==================================================

CASE-PT-001 must highlight only engineering entities actually related to the
current case.

Use:

Registry Case relations
+
existing current CASE-PT-001 compatibility/runtime truth

Do not derive a path only by visually guessing graph adjacency.

The active case path must remain distinguishable from the entire Reference
Vehicle graph.

The CASE-PT-001 runtime path must not falsely imply that full Reference Motion
Coordination is implemented.

Current executable Propulsion path remains conceptually:

Driver/Input
→ Propulsion
→ Trackback_VMC narrow Propulsion role
→ eDrive
→ host adapter
→ Rapier

Reference design may show Motion Coordination separately.

==================================================
7. TRACKBACK_VMC RULE
==================================================

Trackback_VMC must NOT be presented as:

full Motion Coordination
LF-MC-REQ
LF-MC-AUTH
LF-MC-LON
LF-MC-LAT
LF-MC-ALLOC

unless future implementation evidence proves otherwise.

Current semantic presentation:

narrow current Propulsion torque generation/local attenuation role.

Reference Motion Coordination remains DESIGN_ONLY.

This distinction is release-critical.

==================================================
8. FUNCTION INSPECTOR
==================================================

Migrate or adapt Function Inspector so canonical Logical Function IDs can drive
the displayed engineering context.

When a Function is selected, support showing where source-backed:

- canonical ID
- name
- Area
- role/summary
- implementation capability/status
- path scope
- input/output Signals
- connected Interfaces
- Requirements
- related Test Cases
- current case relevance

Do not remove existing useful Function Inspector capabilities.

Do not duplicate canonical requirement text into new UI configuration.

==================================================
9. SIGNAL MONITOR INTEGRATION
==================================================

The Signal Monitor currently has runtime-specific behavior.

Do NOT replace runtime Signal Monitor semantics with Reference data.

Instead connect the two layers carefully.

For a canonical Signal:

show engineering identity and semantics from Registry.

For a runtime-observable Signal:

preserve actual runtime observation capability.

Clearly distinguish:

REFERENCE SIGNAL DEFINITION

from:

CURRENT RUNTIME OBSERVATION

A DESIGN_ONLY Signal must not suddenly appear live/observable.

Preserve semanticKind distinctions such as:

REQUEST
CONSTRAINT
COMMAND
ACTUAL
FEEDBACK
STATE
VALIDITY
etc.

Do not flatten these meanings.

==================================================
10. INTERFACE VIEW
==================================================

Interface UI must preserve distinctions such as:

LOGICAL_REFERENCE_INTERFACE
CURRENT_RUNTIME_TRANSFER
TRANSPORT_MAPPING
OBSERVATION_POINT
COMPARISON_CAPABILITY
FEEDBACK
OPEN_DESIGN

Do not visually imply that every Interface is:

CAN
Ethernet
independent ECU communication
asynchronous bus traffic

Only supported current endpoint comparison capability may be presented as such.

==================================================
11. REQUIREMENT / TEST TRACE
==================================================

Where an entity has related Requirements, allow navigation to them using the
Registry relation/query layer.

Where supported:

Requirement
→ Test Case

must also be navigable.

Preserve:

DRAFT_NOT_APPROVED
SW_OWNER_TBD
DESIGN_ONLY
OPEN
EXTERNAL_VALIDATION_REQUIRED
REFERENCE_ONLY
OBSERVED

semantics.

Do not convert Reference Test Cases into executable tests.

Do not display OBSERVED as PASS.

==================================================
12. CURRENT CASE VS WHOLE VEHICLE VISUAL EMPHASIS
==================================================

Do not hide unrelated Reference Vehicle structure.

Use visual emphasis.

Preferred visual model:

PRIMARY_FOCUS
CONTEXT
BACKGROUND

For CASE-PT-001:

active case path:
PRIMARY_FOCUS

neighboring relevant context:
CONTEXT

unrelated vehicle architecture:
BACKGROUND

BACKGROUND remains:

visible
readable
clickable
keyboard-accessible

Do not disable unrelated Areas.

Do not collapse the whole vehicle merely to simplify the case view.

==================================================
13. INFORMATION SHOULD REMAIN VISIBLE
==================================================

Do not solve complexity primarily with hidden panels and collapsed sections.

Prefer:

full context visible
+
active path highlighting
+
context dimming
+
status labels

Collapse only genuinely large secondary material such as:

raw metadata
long provenance
large trace lists
developer-oriented details

Normal:

Function
Signal
Interface
Requirement
Test

context should remain accessible in-place.

==================================================
14. LEGACY COMPATIBILITY
==================================================

Do NOT delete these merely because the new Registry exists:

src/registries/investigation/Architecture.ts
src/registries/investigation/Trace.ts
src/data/ground-truth/PropulsionGroundTruth.ts

unless this task can prove a specific portion is fully superseded and removing
it is both safe and within scope.

Preferred approach:

ReferenceVehicleRegistry
        ↓
thin adapter / mapped view where necessary
        ↓
existing UI

This is a gradual migration.

No big-bang replacement.

==================================================
15. CANONICAL ID USE
==================================================

New UI integration state must prefer canonical engineering IDs.

Do not create duplicate identities such as:

"propulsion-card-2"
"edrive-node-copy"

as engineering identity.

UI DOM IDs are fine where needed, but engineering selection must resolve to
canonical IDs.

Display name is not identity.

==================================================
16. CURRENT RUNTIME STATUS
==================================================

The UI must not imply all 74 Logical Functions are implemented.

Capability baseline remains:

VERIFIED 5
PARTIAL 27
DESIGN_ONLY 42

Use source-backed capability/status.

Do not invent runtime implementations for:

Braking SW
Steering SW
ABS
TCS
ESC
ACC
AEB
LKA
Energy coordination
Reference Motion Coordination

==================================================
17. OPEN ENGINEERING DECISIONS
==================================================

Open decisions must remain visible as unresolved.

Do not fill gaps for UI neatness.

Examples include:

ABS/TCS/ESC exact production placement
brake blending
EPS authority
lateral reference quantity
ADAS priority
Energy/regen coordination
production diagnostics
multi-rate execution
plant fidelity
functional safety lifecycle
occupant protection

Represent OPEN honestly.

==================================================
18. PAGE 2 UX GOAL
==================================================

A player entering Page 2 should be able to answer:

1. Where am I in the whole vehicle?
2. Which path is relevant to this incident?
3. Which parts are actually executable today?
4. What Function am I inspecting?
5. What Signals enter/leave it?
6. What Interface connects it?
7. What Requirement defines expected behavior?
8. What Test Case is linked?
9. What information is Reference-only vs runtime-observed?

This should not require navigating multiple disconnected screens.

==================================================
19. DO NOT IMPLEMENT GAMEPLAY REDESIGN
==================================================

Do NOT implement in this task:

Evidence Gates
Rapid Diagnosis
race timer penalties
limp-state gameplay
suspect deduction progression
repair race return
Ghost race
new driving objectives
new incident mechanics

Those belong to the subsequent Gameplay task.

This task only creates the engineering UI foundation those mechanics will later
use.

==================================================
20. REGISTRY DRIFT
==================================================

Do not manually edit:

src/referenceVehicle/generated/reference-vehicle-registry.json

If canonical data has not changed:

npm run check:registry

must continue to pass.

If any change unexpectedly requires regeneration, investigate why before
proceeding.

This task should normally not change canonical engineering data.

==================================================
21. TESTING
==================================================

Add focused UI/data integration tests where practical.

At minimum verify:

- whole vehicle Areas resolve from Registry
- Area → Function navigation works
- selected Function resolves Signal relations
- selected Function resolves Interface relations
- Requirement trace works
- Test Case trace works where supported
- CASE-PT-001 active path resolves
- CURRENT_RUNTIME and REFERENCE_DESIGN remain distinguishable
- DESIGN_ONLY does not appear executable
- open status remains open
- Trackback_VMC is not displayed as full Motion Coordination
- existing current Signal Monitor runtime behavior remains intact

Do not overbuild snapshot tests for decorative layout.

==================================================
22. BROWSER VALIDATION
==================================================

A successful production build is not enough.

Perform a real browser/manual playthrough if the available environment permits.

At minimum inspect:

1. game startup
2. CASE-PT-001 incident
3. Page 1 → Page 2 navigation
4. whole vehicle architecture
5. case path highlighting
6. Area selection
7. Function Inspector
8. Signal Monitor
9. Interface view
10. Requirement view
11. Requirement → TC trace where available
12. return navigation/history
13. Page 3 still opens
14. current Workbench still functions
15. Page 4 still opens
16. no unexpected root-cause leakage

If browser automation cannot run:

state that explicitly.

Do not claim visual verification that was not performed.

==================================================
23. BUILD / REGRESSION
==================================================

Run:

npm run check:registry
npm run typecheck
npm run lint
npm test
npm run build

Verify:

docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md unchanged

canonical engineering data unchanged unless explicitly required

C/WASM behavior unchanged

Rapier behavior unchanged

Fault Injection unchanged

CASE-PT-001 root truth unchanged

current playable behavior still works

==================================================
24. IMPLEMENTATION SIZE
==================================================

Keep this pass small.

Prefer:

adapters
selectors
view models
small component changes

over:

new architecture framework
large graph engine
new global state system
new page system

Do not create another Registry.

Do not create a duplicate vehicle ontology.

==================================================
25. REPORT
==================================================

Create exactly one report:

docs/reference_vehicle/audit/
2026-10-13_REFERENCE_UI_INTEGRATION_REPORT.md

Include:

1. UI slices migrated
2. legacy sources still active
3. Registry queries used
4. files created
5. files modified
6. canonical IDs now exposed in UI
7. runtime/reference distinction behavior
8. open-status presentation
9. CASE-PT-001 compatibility
10. automated validation
11. browser/manual validation
12. regressions found/fixed
13. remaining legacy UI dependencies
14. next recommended migration slice

==================================================
26. COMPLETION GATE
==================================================

Return exactly one:

REFERENCE_UI_INTEGRATION_READY

REFERENCE_UI_INTEGRATION_READY_WITH_LEGACY_ADAPTERS

REFERENCE_UI_INTEGRATION_BLOCKED

The expected acceptable result is:

REFERENCE_UI_INTEGRATION_READY_WITH_LEGACY_ADAPTERS

because gradual compatibility migration is intentional.

==================================================
27. NEXT RECOMMENDATION
==================================================

Return exactly one:

PROCEED_TO_GAMEPLAY_DESIGN_CORRECTION

PROCEED_TO_GAMEPLAY_DESIGN_CORRECTION_WITH_UI_FOLLOWUP

STOP_BEFORE_GAMEPLAY

Do not implement Gameplay redesign in this task.

==================================================
28. FINAL CHAT RESPONSE
==================================================

Return:

1. completion gate
2. next recommendation
3. UI components migrated
4. Registry queries now used by UI
5. remaining compatibility registries
6. whole vehicle architecture behavior
7. active case path behavior
8. Function/Signal/Interface/Requirement/Test navigation behavior
9. CURRENT_RUNTIME vs REFERENCE_DESIGN presentation
10. DESIGN_ONLY/open presentation
11. Trackback_VMC final UI treatment
12. files created/modified
13. registry drift result
14. typecheck/lint/tests/build result
15. browser validation result
16. reconciliation regression:
    MUST be NO
17. runtime behavior changed:
    MUST be NO
18. main remaining integration work

Do not start Gameplay implementation.