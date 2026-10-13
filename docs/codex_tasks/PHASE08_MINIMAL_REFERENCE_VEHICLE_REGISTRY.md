IMPORTANT:
Preserve every IMPLEMENTED item in docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md.
Any regression against that reconciliation matrix is a release blocker.

# TRACKBACK
# Phase 08 — Minimal Unified Reference Vehicle Registry
# Canonical Engineering Data → Game-Usable Typed Registry

Repository:
Use the currently opened TraceBack repository.

This is an IMPLEMENTATION task.

The implementation period is limited.

Do NOT build a large automotive data platform.

The purpose of this phase is narrowly defined:

Convert the already-created canonical Reference Vehicle engineering model into
a small, typed, queryable registry that the existing TRACKBACK game can use
without duplicating engineering truth.

This phase does NOT redesign the vehicle architecture.

This phase does NOT implement missing vehicle functions.

This phase does NOT yet perform a large UI migration.

==================================================
0. CURRENT ENGINEERING BASELINE
==================================================

The canonical engineering source is:

docs/reference_vehicle/

The latest accepted control-flow baseline is v0.3.1.

Expected canonical counts after normalization:

Areas: 16
Logical Functions: 74
Signals: 111
Interfaces: 50
Requirements: 180
Reference LF Test Cases: 74
Cases: 34

Current capability baseline:

VERIFIED: 5
PARTIAL: 27
DESIGN_ONLY: 42

Current normalization gate:

NORMALIZED_READY_WITH_OPEN_DOMAIN_DECISIONS

Current recommendation:

PROCEED_TO_PHASE08_WITH_OPEN_DOMAIN_DECISIONS

There are unresolved engineering decisions.

They MUST remain unresolved.

Do not convert:

OPEN
EXTERNAL_VALIDATION_REQUIRED
OPEN_EXTERNAL_VALIDATION_REQUIRED
DESIGN_ONLY
DRAFT_NOT_APPROVED
SW_OWNER_TBD

into approved or implemented truth.

==================================================
1. PURPOSE
==================================================

Today, much of the Reference Vehicle truth exists in canonical Markdown and CSV
documents.

The game should eventually be able to ask questions such as:

- What Functions belong to this vehicle Area?
- What Signals are produced or consumed by this Function?
- What Interfaces connect these Functions?
- What Requirements allocate to this Function?
- What Test Cases trace to this Requirement?
- What engineering entities are related to this Case?
- Is this entity CURRENT_RUNTIME, REFERENCE_DESIGN, BOTH, DESIGN_ONLY, OPEN, etc.?
- What is the provenance/status of this information?

Phase 08 shall provide the smallest reusable software layer that makes these
queries possible.

The target concept is:

CANONICAL ENGINEERING SOURCES
        ↓
Reference Vehicle Registry
        ↓
stable typed query API
        ↓
future game/UI integration

The canonical engineering sources remain the engineering source of truth.

Do not create a second independent vehicle architecture inside src/.

==================================================
2. SOURCE-OF-TRUTH RULE
==================================================

Primary truth:

docs/reference_vehicle/

Use the latest canonical files only.

Do not treat:

archives
old phase exports
review copies
superseded documents
task prompts
temporary audit material

as equivalent engineering truth.

Within the canonical root:

Prefer machine-readable canonical CSV/catalog data when it contains the
required information.

Use canonical Markdown only for information not available in machine-readable
form.

Do not silently infer missing facts.

If a relationship cannot be proven from canonical data:

leave it unresolved.

Do not generate a relationship merely because it would make the graph look
complete.

==================================================
3. FIRST TASK — INSPECT CURRENT PROJECT DATA ARCHITECTURE
==================================================

Before adding new files:

inspect the existing repository for:

- existing architecture registries
- case registries
- traceability structures
- Ground Truth structures
- signal/function/requirement types
- existing data loaders
- generated data
- game-state registries
- architecture UI data
- current CASE-PT-001 references

Do not create a parallel system if an existing suitable abstraction can be
extended safely.

Document briefly in the Phase 08 report:

1. existing relevant structures
2. what can be reused
3. what must be introduced
4. what should remain untouched

==================================================
4. MINIMAL ENTITY MODEL
==================================================

The registry must support these entity families at minimum:

AREA
LOGICAL_FUNCTION
SIGNAL
INTERFACE
REQUIREMENT
TEST_CASE
CASE

Do not create additional top-level entity families unless current canonical
data or actual game usage requires them.

Examples of possible future entities such as:

ECU
Runnable
Harness
Stub
CoverageArtifact
SafetyGoal
FSR
TSR
DTC

must NOT be invented merely for completeness.

If canonical data references a concept that is not yet a first-class registry
entity, preserve that reference as metadata or an unresolved external
reference.

==================================================
5. STABLE IDENTITY
==================================================

Every registry entity must use its canonical stable ID.

Examples:

LF-...
SIG-...
IFC-...
SYSR-...
SWR-...
TC-...
CASE-...

Do not create UI-generated replacement IDs for engineering entities.

Do not use display names as identity.

Display names may change.

Canonical IDs must remain stable.

==================================================
6. MINIMAL COMMON METADATA
==================================================

Create the smallest common metadata contract practical for the repository.

Each entity should expose where supported by source data:

id
entityKind
name/title
description/summary
source/provenance
implementationStatus
reference/design status
approval/maturity status
pathScope
canonical source reference

Do not force every entity to have fields that do not semantically apply.

Prefer optional typed metadata over fake placeholder values.

Never fill missing values with invented defaults such as:

APPROVED
IMPLEMENTED
VALID
ASIL_QM
CURRENT_RUNTIME

unless the canonical source explicitly supports them.

==================================================
7. CURRENT RUNTIME VS REFERENCE DESIGN
==================================================

This distinction is mandatory.

The registry must preserve the semantic difference between:

CURRENT_RUNTIME

and:

REFERENCE_DESIGN

where canonical data supports it.

The current executable Propulsion path remains conceptually:

Driver Input
→ Propulsion C/WASM
→ Trackback_VMC
→ eDrive C/WASM
→ host adapter
→ Rapier plant

Trackback_VMC must NOT become implementation evidence for full Reference Motion
Coordination.

Reference Motion Coordination remains DESIGN_ONLY unless canonical evidence
states otherwise.

Do not collapse runtime and design graphs.

==================================================
8. PATH SCOPE
==================================================

Reuse existing canonical path-scope semantics.

Where source data supports it, preserve values equivalent to:

CURRENT_RUNTIME
REFERENCE_DESIGN
BOTH
FEEDBACK
OBSERVATION_ONLY
OPEN_DESIGN

Do not invent CURRENT_RUNTIME path scope for DESIGN_ONLY Reference edges.

==================================================
9. RELATION MODEL
==================================================

The registry must support relationships between entities.

However:

Do not invent a new automotive ontology.

Inspect the relation types already present in canonical traceability,
signal/interface catalogs, requirement allocation and case data.

Normalize only what is required to query the existing relationships
consistently.

The relation representation should support at minimum:

source entity ID
target entity ID
relation kind
source/provenance
optional path scope
optional status

The software API must be able to query:

relations from entity
relations to entity
relations by kind

If canonical relation vocabularies already exist, reuse them.

If several source files use equivalent wording, create the smallest documented
mapping necessary.

Do not silently merge relations with materially different meanings.

==================================================
10. SIGNAL SEMANTICS
==================================================

Preserve canonical signal semantic distinctions.

Where present, retain concepts such as:

DEMAND
REQUEST
CONSTRAINT
SETPOINT
COMMAND
ACTUAL
FEEDBACK
STATE
STATUS
VALIDITY
QUALITY
AVAILABILITY
PERMISSION
GROUND_TRUTH
ESTIMATE

Do not collapse them into a generic "signal" meaning in the query layer.

The exact canonical values should remain source-driven.

==================================================
11. INTERFACE SEMANTICS
==================================================

Preserve the normalized Interface distinctions.

An Interface may represent concepts such as:

LOGICAL_REFERENCE_INTERFACE
CURRENT_RUNTIME_TRANSFER
TRANSPORT_MAPPING
OBSERVATION_POINT
COMPARISON_CAPABILITY
FEEDBACK
OPEN_DESIGN

Do not infer:

CAN
Ethernet
network latency
independent ECU communication

from a logical Interface or direct function call.

The current eDrive → DriveAdapter boundary remains the known instrumented
same-tick endpoint pair unless repository evidence proves otherwise.

==================================================
12. REQUIREMENT STATUS
==================================================

Requirements must retain their real maturity and ownership state.

Do not assign the unresolved SW_OWNER_TBD requirements.

Do not upgrade draft requirements.

Do not rewrite requirement statements during Phase 08.

Phase 08 is a registry/data-access task.

==================================================
13. TEST CASE / VERIFICATION SEMANTICS
==================================================

Preserve the distinction between:

formal executable verdict
reference-only test
observation
blocked/open test design

Do not convert a Reference Test Case into executable capability.

Do not convert OBSERVED into PASS.

Do not create new oracles.

==================================================
14. CASE SEMANTICS
==================================================

Load the current canonical Case relationships needed for traceability.

Do not promote AI_DRAFT cases.

Do not modify CASE-PT-001 canonical root cause.

Do not create new fault cases.

Gameplay presentation and investigation progression are outside the core
engineering Registry.

The Registry provides engineering references only.

==================================================
15. INGESTION STRATEGY
==================================================

Choose the smallest strategy compatible with the current build system.

Preferred order:

A. directly consume canonical machine-readable data if the current build can do
   so safely;

otherwise:

B. deterministically generate a runtime-friendly registry artifact from
   canonical sources;

otherwise:

C. add the smallest explicit adapter necessary.

Do NOT manually copy hundreds of canonical rows into TypeScript.

If a generated artifact is required:

- clearly mark it GENERATED
- create one deterministic generator
- ensure regeneration is reproducible
- add an up-to-date validation
- do not edit generated output manually

The canonical source remains docs/reference_vehicle/.

==================================================
16. DIRECTORY / FILE PLACEMENT
==================================================

Inspect existing repository conventions before choosing exact paths.

Prefer a single coherent module such as:

src/referenceVehicle/

or the nearest existing equivalent.

A possible minimal structure is:

types
registry
loaders/adapters
queries
validation
index

Do NOT create:

src/referenceVehicle2/
src/newArchitecture/
src/phase08/
src/vehicleDataNew/

if an appropriate existing module already exists.

Avoid unnecessary file fragmentation.

A small number of cohesive files is preferred.

==================================================
17. QUERY API
==================================================

Provide a minimal stable API sufficient for later UI/game integration.

At minimum, support equivalents of:

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

The exact function names may follow current repository conventions.

Do not expose raw internal indexes unnecessarily.

Do not build a general graph database.

==================================================
18. INDEXING
==================================================

The Registry may internally maintain small indexes for fast lookup, for example:

entityById
relationsFrom
relationsTo
entitiesByKind

Do not add an external database.

Do not add a server.

Do not add persistence infrastructure.

This is an in-process game data registry.

==================================================
19. GAMEPLAY COMPATIBILITY
==================================================

The recently designed Gameplay MVP will later use references such as:

EvidenceReference
Suspect architectureRefs
FocusTarget
DrivingObjective
RepairReplayStep

Phase 08 must make stable canonical engineering IDs queryable so gameplay can
reference engineering truth.

However:

DO NOT implement Gameplay MVP in this task.

DO NOT add Evidence Gates.

DO NOT add suspect UI.

DO NOT add spotlight/dimming behavior.

DO NOT change Pages 1–4 yet.

Only provide the engineering Registry foundation they can reference later.

==================================================
20. COMPATIBILITY WITH CURRENT GAME
==================================================

The current playable game must continue to work unchanged.

Do not remove old data structures merely because the Registry exists.

Where useful, create a thin compatibility adapter.

Do not perform a big-bang migration.

A later integration pass will migrate existing architecture / Function /
Signal / Requirement UI onto the new registry gradually.

==================================================
21. NO VEHICLE BEHAVIOR CHANGES
==================================================

Phase 08 must not change:

VehicleSW
C/WASM
Rapier
physics
fault injection
calibrations
repair behavior
incident conditions
checkpoint behavior
timer behavior
oracle behavior

No runtime vehicle behavior change is allowed.

==================================================
22. VALIDATION — COUNTS
==================================================

Validate the resulting Registry against the accepted canonical baseline.

Expected:

Areas = 16
Logical Functions = 74
Signals = 111
Interfaces = 50
Requirements = 180
Reference Test Cases = 74
Cases = 34

If actual current canonical data differs:

STOP and investigate.

Do not silently force the expected count.

Document the discrepancy.

==================================================
23. VALIDATION — REFERENTIAL INTEGRITY
==================================================

Validate at minimum:

duplicate canonical IDs = 0

dangling relation endpoints = 0
unless explicitly represented as external/unresolved references

unknown entity kinds = 0

invalid relation direction where source contract defines direction = 0

generated registry drift = 0 if generation is used

canonical source resolution failures = 0

==================================================
24. VALIDATION — SEMANTIC INTEGRITY
==================================================

Check at minimum:

Trackback_VMC is not mapped to full Motion Coordination.

CURRENT_RUNTIME and REFERENCE_DESIGN paths remain distinguishable.

DESIGN_ONLY entities do not become IMPLEMENTED.

OPEN decisions remain OPEN.

SW_OWNER_TBD remains unresolved.

No Interface becomes CAN/Ethernet by inference.

No Reference Test becomes executable PASS/FAIL capability.

No no-oracle vehicle scenario becomes PASS.

CASE-PT-001 root truth remains unchanged.

==================================================
25. AUTOMATED TESTS
==================================================

Add focused tests for the Registry.

At minimum test:

- accepted entity counts
- canonical ID uniqueness
- lookup by ID
- lookup by kind
- forward relation query
- reverse relation query
- no dangling internal relations
- current-runtime/reference distinction
- known CASE-PT-001 reference resolution
- known Propulsion path reference resolution
- open-status preservation

Do not duplicate all canonical engineering validation logic if equivalent tests
already exist.

Reuse existing test infrastructure.

==================================================
26. BUILD / REGRESSION
==================================================

Run the repository's existing relevant checks.

At minimum where available:

typecheck
lint
unit tests
integration tests
production build

Also verify:

docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md unchanged

VehicleSW/C/WASM behavior unchanged

current browser game still starts

existing CASE-PT-001 flow still works

==================================================
27. DOCUMENTATION
==================================================

Do not create a large Phase 08 documentation tree.

Create exactly one implementation report:

docs/reference_vehicle/audit/
2026-10-13_PHASE08_MINIMAL_REGISTRY_REPORT.md

The report must include:

1. purpose
2. source files consumed
3. existing structures reused
4. new files created
5. files modified
6. ingestion strategy
7. entity counts
8. relation count
9. query API
10. validation results
11. compatibility behavior
12. open engineering decisions preserved
13. runtime behavior changed: YES/NO
14. reconciliation regression: YES/NO
15. remaining integration work

Runtime behavior changed must be:

NO

unless an unexpected regression is discovered, in which case the task is NOT
complete.

==================================================
28. REPOSITORY HYGIENE
==================================================

Do not add duplicate exports, backup copies or temporary conversion files.

Do not commit:

debug dumps
temporary CSV conversions
scratch JSON
one-off scripts that are no longer needed
generated test output
screenshots
local logs

If a deterministic generator is required, keep only:

the generator
the canonical source
the required generated runtime artifact

and document them clearly.

==================================================
29. ABSOLUTELY DO NOT IMPLEMENT
==================================================

Do NOT implement:

Motion Coordination runtime
ABS
TCS
ESC
AEB
ACC
LKA
EPS
CAN
Ethernet
new sensors
new physical plant behavior
new safety lifecycle artifacts
new HARA
new ASIL assignments
new diagnostics runtime
new ECU scheduling
new calibration values

Do not resolve the existing external-domain open decisions.

==================================================
30. DO NOT MODIFY
==================================================

Do not intentionally change:

docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md

canonical engineering meaning

CASE-PT-001 root truth

C/WASM behavior

Rapier behavior

Fault Injection semantics

repair semantics

vehicle scenario oracle semantics

Gameplay MVP UI

Do not commit automatically.

==================================================
31. IMPLEMENTATION APPROACH
==================================================

Work in this order:

1. inspect current data structures and repository conventions
2. identify canonical machine-readable sources
3. define minimal Registry types
4. implement canonical ingestion
5. implement indexes and query API
6. add validation
7. add focused tests
8. run existing regression/build checks
9. create the single Phase 08 report
10. inspect git diff for unintended changes

Do not skip directly to UI integration.

==================================================
32. PHASE 08 COMPLETION GATE
==================================================

Classify the final result as exactly one:

PHASE08_REGISTRY_READY

PHASE08_REGISTRY_READY_WITH_OPEN_ENGINEERING_DECISIONS

PHASE08_REGISTRY_BLOCKED

The expected successful outcome is:

PHASE08_REGISTRY_READY_WITH_OPEN_ENGINEERING_DECISIONS

because unresolved external-domain engineering decisions are intentionally
preserved.

The result may still be PHASE08_REGISTRY_READY if current canonical data proves
all relevant registry-level concerns are closed, but do not artificially close
engineering decisions to achieve that status.

==================================================
33. NEXT-PHASE RECOMMENDATION
==================================================

Return exactly one:

PROCEED_TO_REFERENCE_UI_INTEGRATION

PROCEED_TO_REFERENCE_UI_INTEGRATION_WITH_OPEN_ENGINEERING_DECISIONS

STOP_BEFORE_UI_INTEGRATION

Do NOT perform that UI integration in this task.

==================================================
34. FINAL CHAT RESPONSE
==================================================

Return a concise summary containing:

1. Phase 08 completion gate

2. Next-phase recommendation

3. Canonical source files consumed

4. Registry module/files created

5. Existing modules reused

6. Entity counts:
   - Areas
   - Logical Functions
   - Signals
   - Interfaces
   - Requirements
   - Test Cases
   - Cases

7. Total Registry relation count

8. Query API summary

9. Whether deterministic generation was used

10. Duplicate ID count

11. Dangling internal relation count

12. Open engineering decisions preserved

13. Runtime files whose behavior changed
    MUST be 0

14. PRODUCT_REQUIREMENTS_RECONCILIATION.md changed
    MUST be NO

15. Tests/build result

16. Main remaining work before the Reference Vehicle is visibly used by the
    game UI

Do not start the next integration phase.