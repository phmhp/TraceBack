IMPORTANT:
Preserve every IMPLEMENTED item in docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md.
Any regression against that reconciliation matrix is a release blocker.

# TRACKBACK
# v0.3.1 Control-Flow Normalization Pass
# Reference Architecture Path / Authority / Signal / Interface Consistency

Repository:
Use the currently opened TraceBack repository.

Canonical engineering root:
docs/reference_vehicle/

Relevant audit evidence:

docs/reference_vehicle/audit/
2026-10-10_ARCHITECTURE_CORRECTION_REPORT.md

docs/reference_vehicle/audit/
2026-10-10_ARCHITECTURE_CORRECTION_REVALIDATION.md

If available, also read:

docs/reference_vehicle/validation/
docs/reference_vehicle/engineering_review/

But the corrected canonical documents under:

docs/reference_vehicle/

are the PRIMARY source for this pass.

==================================================
0. PURPOSE
==================================================

This is NOT another architecture redesign.

The previous Architecture Correction Pass successfully removed the common
architecture blocker and produced:

ENGINEERING_READY_WITH_REWORK

with:

P0 = 0
CORE_ARCHITECTURE_BLOCKER = 0

However, the corrected canonical model may still contain residual inconsistencies
between:

- architecture prose
- Logical Function definitions
- Signal producer/consumer paths
- Interface definitions
- current-runtime path
- future Reference Vehicle control-authority path

The purpose of this pass is to NORMALIZE the control-flow graph before Phase 08
schema/registry design.

Do NOT reopen already-stable architectural decisions unless an actual
contradiction is found.

Do NOT start Phase 08.

Do NOT modify runtime behavior.

==================================================
1. CURRENT BASELINE TO PRESERVE
==================================================

Preserve the following baseline unless current repository evidence directly
contradicts it.

Logical Functions:
74

Signals:
111

Requirements:
180

Current runtime capability:

VERIFIED: 5
PARTIAL: 27
DESIGN_ONLY: 42

Current Engineering Gate:

ENGINEERING_READY_WITH_REWORK

Current runtime code remains behaviorally unchanged.

No runtime migration to the new Motion Coordination architecture has occurred.

==================================================
2. CORE SEMANTIC DECISIONS ALREADY APPROVED
==================================================

These are authoritative for this normalization pass.

--------------------------------------------------
2.1 Trackback_VMC
--------------------------------------------------

The current runtime C symbol:

Trackback_VMC

is NOT the implementation of the full Reference Vehicle Motion Coordination
architecture.

Its semantic role is the narrow current propulsion path, primarily:

Propulsion Torque Generation

and, where directly supported by implementation semantics, local propulsion
constraint/attenuation behavior.

Do NOT classify current Trackback_VMC as implementation evidence for:

LF-MC-REQ
LF-MC-AUTH
LF-MC-LON
LF-MC-LAT
LF-MC-ALLOC

unless source evidence explicitly proves such responsibility.

In particular:

speed-dependent torque attenuation inside current Trackback_VMC

must NOT automatically be interpreted as implementation of cross-domain
Reference Motion Coordination.

Reference Motion Coordination remains DESIGN_ONLY unless independently proven
otherwise.

--------------------------------------------------
2.2 Vehicle-level authority vs domain command ownership
--------------------------------------------------

Reference Vehicle rule:

Vehicle-level authority / selection / feasible target / actuator-domain
allocation

belongs to Reference Motion Coordination.

Final domain command generation remains owned by the corresponding domain.

Therefore:

Motion Coordination
!=
low-level propulsion command owner

Motion Coordination
!=
final braking actuator implementation

Motion Coordination
!=
EPS implementation

Propulsion owns propulsion-domain command processing.

Braking owns braking-domain command processing.

Steering owns steering-domain command processing.

--------------------------------------------------
2.3 Current runtime path vs Reference path
--------------------------------------------------

The current executable runtime may remain a narrower path.

Example:

current runtime:
Propulsion
→ Trackback_VMC
→ eDrive
→ simulation adapter
→ Rapier

This is valid as:

CURRENT_RUNTIME_PATH

It is NOT proof that the future Reference Motion Coordination path is already
implemented.

The canonical model must explicitly distinguish:

CURRENT_RUNTIME_PATH

from:

REFERENCE_DESIGN_PATH

They must not be silently merged into one graph.

==================================================
3. FIRST TASK — AUDIT THE CURRENT CONTROL-FLOW GRAPH
==================================================

Before modifying anything, reconstruct the current canonical control-flow graph
from:

architecture documents
LF definitions
Signal Catalog
Interface Catalog
requirements where ownership/path is encoded

Identify every flow involving:

Propulsion
Braking
Steering
Stability
Motion Coordination
ADAS
Energy
Vehicle State
Actuation

Classify every relevant edge as one of:

CURRENT_RUNTIME_PATH
REFERENCE_DESIGN_PATH
BOTH
FEEDBACK_PATH
OBSERVATION_ONLY
STRUCTURAL_ONLY
OPEN_DESIGN

If existing metadata already supports this distinction, reuse it.

Do not create duplicate sources of truth.

If a new metadata field is necessary, introduce the smallest possible field,
for example:

pathScope

with controlled values such as:

CURRENT_RUNTIME
REFERENCE_DESIGN
BOTH
FEEDBACK
OBSERVATION_ONLY
OPEN_DESIGN

Document the field meaning.

==================================================
4. NORMALIZE MOTION COORDINATION AREA KIND
==================================================

Current Motion Coordination must NOT remain classified as:

STATE_COORDINATION

if its primary responsibility is:

request collection
authority
selection
constraint integration
feasible target generation
drive-vs-brake / lateral allocation

Introduce or use:

CONTROL_COORDINATION

as the canonical areaKind for Motion Coordination.

Vehicle State / Mode may remain:

STATE_COORDINATION

Do not change the stable area ID merely to change areaKind.

==================================================
5. NORMALIZE REFERENCE LONGITUDINAL FLOW
==================================================

The Reference Vehicle longitudinal flow shall be represented conceptually as:

Request Sources
→ typed request acquisition / interpretation
→ LF-MC-REQ
→ LF-MC-AUTH
→ LF-MC-LON
→ LF-MC-ALLOC
→ Propulsion Domain OR Braking Domain
→ domain-specific command generation
→ Actuation Boundary
→ Plant

This is a logical Reference Vehicle flow.

Do NOT force current runtime to execute it.

==================================================
6. PROPULSION FLOW NORMALIZATION
==================================================

Review the current Propulsion catalog and interfaces.

The Reference design must clearly support:

Driver accelerator
→ Propulsion acquisition / interpretation
→ Propulsion torque generation
→ RequestedDriveTorque
→ LF-MC-REQ
→ LF-MC-AUTH
→ LF-MC-LON
→ LF-MC-ALLOC
→ Propulsion limiting / command path
→ eDrive
→ Actuation Boundary
→ Plant

Do NOT automatically use the exact signal names above if canonical IDs already
represent these semantics.

Reuse existing canonical signals and IDs whenever possible.

Important:

The current runtime path may still be:

Propulsion
→ Trackback_VMC
→ eDrive

without Reference Motion Coordination.

The catalogs must distinguish these two paths.

--------------------------------------------------
6.1 RequestedDriveTorque
--------------------------------------------------

If a canonical signal already represents:

RequestedDriveTorque
→ LF-MC-REQ

ensure the corresponding logical Reference interface/path is represented.

If an existing Interface can represent it correctly, reuse it.

If no Interface exists and an explicit Interface is required for referential
consistency, add the minimum DESIGN_ONLY logical Interface necessary.

Do NOT add duplicate signals solely to make an Interface.

Document any Interface-count change.

==================================================
7. BRAKING FLOW NORMALIZATION
==================================================

Normalize Braking so that Reference authority does not contain an accidental
cycle.

Preferred conceptual direction:

Driver Brake Input
→ LF-BRK-ACQ
→ LF-BRK-DEMAND
→ LF-MC-REQ

AEB braking request
→ LF-MC-REQ

other cross-domain braking intervention
→ LF-MC-REQ or typed constraint path as appropriate

then:

LF-MC-REQ
→ LF-MC-AUTH
→ LF-MC-LON
→ LF-MC-ALLOC
→ LF-BRK-COORD
→ LF-BRK-BLEND
→ LF-BRK-CMD
→ Brake Actuation Boundary
→ Plant

Do NOT blindly impose this naming if existing LF responsibilities indicate a
more precise equivalent structure.

The important invariant is:

No braking-domain coordination stage may both:

1. feed the Reference Motion Coordination authority decision

and

2. receive the result of that same authority decision

in the same logical decision step,

unless one edge is explicitly:

FEEDBACK
STATE
PREVIOUS_CYCLE
OBSERVATION

with temporal semantics.

==================================================
8. REMOVE OR RECLASSIFY BRAKING CYCLES
==================================================

Specifically inspect any current path equivalent to:

LF-BRK-COORD
→ LF-MC-LON

while also having:

LF-MC-ALLOC
→ LF-BRK-COORD

This creates a potential logical cycle.

For each such edge determine whether it is actually:

A. pre-authority brake demand
B. post-allocation brake command input
C. feedback/status
D. previous-cycle state
E. erroneous duplicated path

Correct it accordingly.

Do NOT simply delete an edge without preserving the intended semantic
relationship.

If a value sent from Braking back to Motion Coordination is feedback or
availability, rename/reclassify its semantic role rather than treating it as a
new demand.

==================================================
9. TOTAL BRAKE DEMAND VS FINAL BRAKE COMMAND
==================================================

Ensure the canonical model clearly distinguishes:

BrakeDemand
or equivalent requested braking objective

from:

AllocatedBrakeDemand

from:

FinalBrakeCommand

from:

BrakeForce at the simulation plant boundary

These must not be conflated.

The exact real production physical quantity may remain OPEN.

Semantic kinds must reflect the distinction.

==================================================
10. ABS NORMALIZATION
==================================================

Do NOT resolve the production ABS architecture in this pass.

Preserve:

EXTERNAL_VALIDATION_REQUIRED

for exact ABS placement.

However, ensure ABS does NOT appear simultaneously as:

high-level normal brake request source

and

low-level wheel modulation

without explicit typed semantics.

Canonical design may represent ABS as:

Stability modulation / constraint capability

with exact production placement OPEN.

Do not introduce a direct bypass to the final actuator merely to close the
graph.

==================================================
11. TCS / ENERGY / FAULT CONSTRAINT PATH
==================================================

Normalize constraint-provider semantics.

Conceptually:

TCS
Energy / Power
Fault Reaction
Actuator Capability

may provide typed constraints to:

ConstraintSet
/ EffectiveControlEnvelope
/ LF-MC-LON

depending on current canonical terminology.

They must NOT be represented as ordinary competing motion requests unless that
is explicitly intended.

Preserve distinction between:

REQUEST
CONSTRAINT
COMMAND

Do not impose a universal:

min(allLimits)

algorithm.

Keep exact aggregation algorithm OPEN where required.

==================================================
12. STEERING / LATERAL FLOW NORMALIZATION
==================================================

Normalize the Reference lateral flow in the same architectural direction.

Preferred conceptual pattern:

Driver steering
→ steering input acquisition / interpretation
→ LF-MC-REQ

LKA
→ LF-MC-REQ

ESC lateral intervention
→ LF-MC-REQ or typed lateral constraint path

then:

LF-MC-AUTH
→ LF-MC-LAT
→ LF-MC-ALLOC
→ LF-STR-COORD
→ steering-domain command generation
→ Steering Actuation Boundary
→ Plant

The exact lateral reference quantity remains:

OPEN_EXTERNAL_VALIDATION_REQUIRED

Do NOT choose one of:

CURVATURE_REQUEST
YAW_RATE_REQUEST
STEERING_ANGLE_REQUEST
STEERING_TORQUE_REQUEST

as universally approved truth in this pass.

The purpose here is only to normalize ownership direction.

==================================================
13. REMOVE LATERAL AUTHORITY BYPASS
==================================================

Inspect signals such as:

LKA request
ESC lateral request
Driver steering request

or equivalent canonical IDs.

A feature request must not simultaneously:

enter Reference Motion Coordination

and

directly enter LF-STR-COORD

unless the direct edge is explicitly documented as:

CURRENT_RUNTIME_PATH
legacy path
safety override path
feedback
or another intentional exception.

For each duplicate route decide:

REFERENCE DESIGN route

versus:

CURRENT RUNTIME route.

Do not leave both as indistinguishable canonical flow.

==================================================
14. ADAS OUTPUT NORMALIZATION
==================================================

Review:

ACC
AEB
LKA

Ensure each canonical output has explicit:

controlOutputKind

or equivalent semantic classification.

Use existing field if already available.

Possible semantics include:

MOTION_REQUEST
CONSTRAINT
SAFETY_PRIORITY_REQUEST
DIRECT_ACTUATOR_REQUEST
OBSERVATION

Do not approve:

DIRECT_ACTUATOR_REQUEST

as default Reference Vehicle behavior.

If exact AEB priority or LKA authority remains unresolved, retain:

OPEN
EXTERNAL_VALIDATION_REQUIRED

but ensure the structural path is non-ambiguous.

==================================================
15. STABILITY OUTPUT NORMALIZATION
==================================================

Review:

ABS
TCS
ESC

Ensure their outputs are not all generically represented as the same:

StabilityConstraintRequest

if their physical/control semantics materially differ.

If the same envelope signal is intentionally used for abstraction, document:

what semantic information it carries
what it does NOT mean
what remains externally unresolved

If one generic signal would mislead the learner, prefer typed metadata or
separate logical semantics rather than duplicating arbitrary physical signals.

==================================================
16. VEHICLE STATE / PERMISSION FLOW
==================================================

This pass does not redesign Vehicle State.

However, ensure control-flow edges distinguish:

OperationalState
Availability
Permission
Validity
DegradedState
RecoveryAuthorization

Current:

HOST_SIMULATION_READY
HOST_PROPULSION_ENABLE_ASSUMPTION

must remain CURRENT_RUNTIME / HOST assumptions.

They must not become Reference Vehicle State Manager outputs merely because
they feed current runtime C inputs.

==================================================
17. ACTUATION BOUNDARY
==================================================

Ensure all Reference control paths end in a clearly typed:

ACTUATION_BOUNDARY

before entering:

PLANT_MODEL.

Do not let:

Motion Coordination
ADAS
Stability
Energy

appear to directly manipulate Plant physics unless explicitly documented as
CURRENT_RUNTIME simulation infrastructure.

Current:

DriveAdapter
BrakeAdapter
SteeringAdapter

may remain simulation adapters.

They must not be presented as production actuator controllers.

==================================================
18. CURRENT RUNTIME PATH MUST REMAIN VISIBLE
==================================================

Do NOT "clean up" the Reference graph by erasing current executable truth.

The canonical architecture must preserve both:

A. CURRENT EXECUTABLE PATH

and

B. REFERENCE TARGET PATH

For example:

CURRENT:
Propulsion
→ Trackback_VMC
→ eDrive
→ DriveAdapter
→ Rapier

REFERENCE:
Propulsion request
→ Motion Coordination
→ Propulsion domain
→ Actuation Boundary
→ Plant

These are allowed to coexist.

They must simply be distinguishable.

==================================================
19. TRACKBACK_VMC ALLOCATION NORMALIZATION
==================================================

Search all canonical documents and catalogs for statements linking:

Trackback_VMC

to:

LF-MC-LON
LF-MC-AUTH
LF-MC-ALLOC
full Motion Coordination

Remove or correct such statements unless direct implementation evidence proves
the relationship.

Expected correction:

Trackback_VMC
→ current Propulsion Torque Generation role

and potentially local Propulsion-domain attenuation/limit semantics where
supported.

Reference:

LF-MC-LON
→ DESIGN_ONLY

Do NOT rename the C symbol.

Do NOT modify C code.

==================================================
20. SIGNAL CATALOG NORMALIZATION
==================================================

Review all 111 Signals, but modify only those affected by flow normalization.

For every affected Signal verify:

ID
name
semanticKind
producer
consumer(s)
unit
validity semantics
pathScope
implementation status
reference status

Ensure no signal has consumers that create an unintended authority bypass.

Examples to inspect carefully include canonical equivalents of:

RequestedDriveTorque
PropulsionRequest
DriveTorqueRequest
EDriveCommand

BrakeDemand
SelectedBrakingRequest
AllocatedBrakeDemand
BrakeCommand
BrakeForce

LKA request
Steering request
Steering command

Stability constraint
TCS torque constraint
Energy torque constraint
Fault constraint

VehicleReady
PropulsionEnable

Do NOT invent new runtime producer/consumer claims.

==================================================
21. INTERFACE CATALOG NORMALIZATION
==================================================

Review all 49 current Interfaces.

Preserve IDs whenever possible.

Each Interface must clearly state whether it represents:

LOGICAL_REFERENCE_INTERFACE
CURRENT_RUNTIME_TRANSFER
TRANSPORT_MAPPING
OBSERVATION_POINT
COMPARISON_CAPABILITY
FEEDBACK
OPEN_DESIGN

Do NOT use:

direct function call

as evidence of:

CAN
Ethernet
network latency
independent ECU transfer

Current:

eDrive → DriveAdapter

remains the only known:

INSTRUMENTED_SAME_TICK_ENDPOINT_PAIR

unless repository evidence proves more.

==================================================
22. CYCLE DETECTION
==================================================

Construct a directed Reference control-decision graph.

Ignore:

pure hierarchy
traceability
verification relation

for this cycle check.

Detect cycles among:

REQUEST
CONSTRAINT
AUTHORITY
ALLOCATION
COMMAND

edges.

A same-decision-cycle loop is invalid unless explicitly justified.

Allowed cycles require clear semantics such as:

FEEDBACK_NEXT_CYCLE
STATE_FEEDBACK
OBSERVATION
PLANT_FEEDBACK
PREVIOUS_SAMPLE

For every detected cycle classify:

VALID_FEEDBACK_LOOP
TEMPORAL_FEEDBACK_LOOP
ACCIDENTAL_CONTROL_CYCLE
AMBIGUOUS

Resolve all:

ACCIDENTAL_CONTROL_CYCLE

before finishing.

==================================================
23. REFERENCE VS FEEDBACK SEMANTICS
==================================================

Do not remove legitimate closed-loop vehicle control.

Instead distinguish forward command flow:

Request
→ Authority
→ Allocation
→ Command
→ Plant

from feedback flow:

Plant / Actuator
→ Actual / Feedback / Estimate
→ Controller

Feedback must not look like another same-step competing request.

Where temporal semantics matter, state:

same tick
next simulation tick
previous sample
unspecified future execution timing

Do not invent task periods.

==================================================
24. REQUIREMENT ALIGNMENT
==================================================

Do not rewrite all 180 requirements.

Only review requirements whose semantics depend on normalized control ownership.

Focus on:

Motion Coordination
Propulsion-to-MC boundary
Braking
Steering
Stability
ADAS
Energy constraints
Vehicle State permission

Correct requirements only when:

owner is now wrong
input/output path is now wrong
request/command terminology is inconsistent
Reference path is confused with current runtime path

Do not resolve the 62 SW_OWNER_TBD items arbitrarily.

The SWR owner gate remains active.

==================================================
25. TEST / VERIFICATION ALIGNMENT
==================================================

Do not invent new executable tests.

Review only verification metadata affected by the new flow.

For example:

a TC claiming direct AEB → BrakeController behavior

must not remain authoritative if the Reference architecture now routes it
through Motion Coordination.

Classify such TCs as appropriate:

REFERENCE_ONLY
BLOCKED_BY_OPEN_DECISION
OBSERVATION_ONLY
NEEDS_ALIGNMENT

Do not convert them to PASS/FAIL without an executable oracle.

==================================================
26. CASE ALIGNMENT
==================================================

Do not promote any AI_DRAFT Case.

Check whether any Case propagation path relies on:

direct ADAS bypass
incorrect Motion Coordination ownership
incorrect braking cycle
incorrect lateral route

If so:

update only the architectural path metadata

or mark:

NEEDS_REWORK
BLOCKED_BY_DOMAIN_DESIGN

Do not change canonical root cause truth for CASE-PT-001 unless repository
evidence proves an error.

==================================================
27. EXTERNAL VALIDATION MUST REMAIN OPEN
==================================================

Do NOT close these topics:

ABS / TCS / ESC production placement
brake blending implementation
EPS / steering authority
exact lateral reference quantity
ADAS priority policy
energy / regen production coordination
production diagnostics architecture
multi-rate ECU execution model
plant fidelity for stability/ADAS
functional safety lifecycle
occupant protection architecture

Use:

EXTERNAL_VALIDATION_REQUIRED

or existing equivalent status.

==================================================
28. FILES THAT MAY BE MODIFIED
==================================================

Modify canonical files IN PLACE only where required.

Likely affected:

docs/reference_vehicle/README.md
docs/reference_vehicle/MANIFEST.md

docs/reference_vehicle/architecture/
01_REFERENCE_ARCHITECTURE_KO.md
02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md
03_INTERNAL_LOGIC_STATE_MACHINE_KO.md

docs/reference_vehicle/interfaces/
04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md
04_SIGNAL_CATALOG.csv
04_INTERFACE_CATALOG.csv

docs/reference_vehicle/requirements/
05_REQUIREMENTS_ENGINEERING_KO.md
05_REQUIREMENT_CATALOG.csv
05_TRACEABILITY.csv
05_OPEN_DECISIONS.csv

docs/reference_vehicle/verification/
only files whose path/ownership metadata is affected

docs/reference_vehicle/cases/
only files whose architecture-path metadata is affected

Do not modify unrelated canonical files merely to bump versions.

==================================================
29. VERSIONING
==================================================

For canonical documents actually changed in this pass:

Version:
0.3.1

Status:
REVIEWED_DRAFT

Canonical:
YES

Do not update untouched files solely for cosmetic version consistency if the
repository's current versioning policy does not require it.

README / MANIFEST must clearly state the active Reference Vehicle baseline.

==================================================
30. NEW AUDIT OUTPUTS
==================================================

Create exactly these new audit files:

docs/reference_vehicle/audit/
2026-10-13_CONTROL_FLOW_NORMALIZATION_REPORT.md

docs/reference_vehicle/audit/
2026-10-13_CONTROL_FLOW_NORMALIZATION_REVALIDATION.md

Do NOT create another large review directory.

==================================================
31. NORMALIZATION REPORT CONTENT
==================================================

The normalization report must include:

1. original inconsistency
2. affected IDs
3. old flow
4. corrected flow
5. current-runtime path
6. reference-design path
7. signal changes
8. interface changes
9. requirement changes
10. unresolved external decision
11. whether runtime behavior changed

Runtime behavior changed must always be:

NO

for this pass.

==================================================
32. REVALIDATION
==================================================

After normalization, validate at minimum:

A. Trackback_VMC allocation

No false full Motion Coordination allocation remains.

B. Propulsion Reference path

Reference Propulsion request reaches Motion Coordination explicitly.

C. Braking Reference path

No accidental:

BRK-COORD
→ MC
→ BRK-COORD

same-step cycle remains.

D. Lateral Reference path

Driver / LKA / ESC do not have indistinguishable duplicate authority paths.

E. ADAS

Outputs have typed semantics and no accidental direct actuator ownership.

F. Constraints

TCS / Energy / Fault constraints remain constraints, not ordinary commands.

G. Current Runtime

Existing executable path remains documented.

H. areaKind

Motion Coordination uses:

CONTROL_COORDINATION

or a clearly equivalent dedicated kind.

I. Actuation / Plant

Actuation Boundary and Plant remain distinct.

==================================================
33. GRAPH INVARIANTS
==================================================

Validate these invariants.

INVARIANT 1

Each Reference vehicle-level control request has one identifiable authority path.

INVARIANT 2

A request source does not simultaneously bypass and enter the same authority
layer unless the bypass is explicitly classified.

INVARIANT 3

Each final domain command has one logical owner.

INVARIANT 4

Constraints are not mislabeled as commands.

INVARIANT 5

Actual / Feedback does not masquerade as Request.

INVARIANT 6

CURRENT_RUNTIME_PATH is not automatically REFERENCE_DESIGN_PATH.

INVARIANT 7

No same-cycle accidental control loop exists.

INVARIANT 8

Transport/network claims are not inferred from logical Interfaces.

INVARIANT 9

DESIGN_ONLY remains DESIGN_ONLY unless implementation evidence exists.

INVARIANT 10

OPEN external engineering decisions remain OPEN.

==================================================
34. CROSS-DOMAIN SCENARIO RECHECK
==================================================

Recheck at minimum these scenarios against the normalized graph:

1. Driver accelerator only

2. Driver accelerator + brake

3. Driver accelerator + ACC

4. Driver accelerator + AEB

5. Driver accelerator + TCS constraint

6. Driver accelerator + Energy torque constraint

7. Driver accelerator + Fault torque constraint

8. AEB + ABS conceptual intervention

9. Driver brake + regenerative braking availability

10. Driver brake + regen unavailable

11. Driver steering only

12. Driver steering + LKA

13. LKA + ESC lateral intervention

14. invalid Gear while drive request exists

15. Vehicle domain unavailable while request exists

For each ensure:

request source
authority owner
constraint path
allocation owner
domain command owner
feedback path

are not contradictory.

Do NOT invent exact physical outputs.

==================================================
35. COUNT PRESERVATION POLICY
==================================================

Prefer preserving:

74 LF
111 Signals
180 Requirements

Do not add entities solely to improve diagram appearance.

Interface count may change ONLY if:

an explicit logical Reference interface is semantically required

AND

no existing Interface can represent the relationship without distortion.

If any count changes:

document exactly why.

Do not silently repurpose unrelated IDs.

==================================================
36. PHASE 08 NORMALIZATION GATE
==================================================

After normalization classify the result as exactly one:

NORMALIZED_READY
NORMALIZED_READY_WITH_OPEN_DOMAIN_DECISIONS
NOT_NORMALIZED

NORMALIZED_READY_WITH_OPEN_DOMAIN_DECISIONS is acceptable for Phase 08 schema
design if:

- no common control-flow contradiction remains
- no accidental authority bypass remains
- no same-cycle accidental control loop remains
- current-runtime and Reference paths are distinct
- Trackback_VMC is not falsely mapped to full Motion Coordination
- Motion Coordination area kind is semantically correct
- final Reference authority direction is unambiguous
- unresolved ABS/EPS/ADAS/etc. policies remain explicitly OPEN
- runtime behavior remains unchanged

==================================================
37. PHASE 08 RECOMMENDATION
==================================================

Return exactly one:

PROCEED_TO_PHASE08
PROCEED_TO_PHASE08_WITH_OPEN_DOMAIN_DECISIONS
STOP_BEFORE_PHASE08

Do NOT start Phase 08.

==================================================
38. REPOSITORY SAFETY
==================================================

Before finishing:

parse all modified CSV files
check duplicate IDs
check dangling references
check orphan endpoints
check invalid relation directions
check broken Markdown references
check README / MANIFEST consistency
run control-flow cycle validation
run git status

Do not commit automatically.

==================================================
39. ABSOLUTELY DO NOT MODIFY
==================================================

Do NOT modify:

src/
c/
tests/
WASM
Rapier runtime behavior
UI
game runtime registries
calibration numeric values
Fault Injection implementation
current playable behavior
docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md

Do NOT implement Motion Coordination.

Do NOT migrate runtime to Phase 08 structures.

Do NOT implement CAN.

Do NOT add fake sensors.

Do NOT invent safety approval.

==================================================
40. FINAL CHAT RESPONSE
==================================================

Return a concise summary containing:

1. Canonical files modified

2. LF count before/after

3. Signal count before/after

4. Interface count before/after

5. Requirement count before/after

6. Trackback_VMC final canonical allocation

7. Reference longitudinal path after normalization

8. Reference braking path after normalization

9. Reference lateral path after normalization

10. Number of authority bypasses before/after

11. Number of accidental control cycles before/after

12. Number of unresolved external-domain decisions

13. Runtime files changed
    MUST be 0

14. Duplicate / orphan / dangling counts

15. Normalization Gate:
    NORMALIZED_READY
    NORMALIZED_READY_WITH_OPEN_DOMAIN_DECISIONS
    NOT_NORMALIZED

16. Phase 08 recommendation:
    PROCEED_TO_PHASE08
    PROCEED_TO_PHASE08_WITH_OPEN_DOMAIN_DECISIONS
    STOP_BEFORE_PHASE08

Do not start Phase 08 in this pass.