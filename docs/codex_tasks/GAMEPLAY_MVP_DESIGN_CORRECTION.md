IMPORTANT:
Preserve every IMPLEMENTED item in docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md.
Any regression against that reconciliation matrix is a release blocker.

# TRACKBACK
# Gameplay MVP Design Correction
# Race-Incident-Rapid Diagnosis-Repair-Return
# DESIGN ONLY — NO IMPLEMENTATION

Repository:
Use the currently opened TraceBack repository.

This is a DESIGN CORRECTION task.

Do NOT implement gameplay yet.

The previous Gameplay MVP design contains an outdated concept:

the player is explicitly instructed to drive under a known fault-reproduction
condition such as:

D
→ route
→ acceleration check zone
→ hold acceleration
→ observe response

This direction is no longer accepted.

The gameplay must be redesigned so that:

THE PLAYER RACES FIRST.

THE INCIDENT OCCURS DURING NATURAL DRIVING.

THE PLAYER DOES NOT RECEIVE THE FAULT-ACTIVATION ANSWER IN ADVANCE.

THE INCIDENT CREATES URGENCY.

DIAGNOSIS BECOMES A GAMEPLAY MECHANIC INSIDE THE RACE FLOW.

==================================================
1. PRIMARY PRODUCT FANTASY
==================================================

The target fantasy is:

"I was racing.
The car suddenly developed a problem.
I am losing time.
I need to quickly figure out what went wrong,
repair it,
and get back into the race."

TRACKBACK should not feel like:

- a driving test procedure
- a worksheet with a vehicle
- a long engineering dashboard session after the fun is over
- a quiz that interrupts driving every few seconds

The desired identity is:

INCIDENT RACING
+
ENGINEERING MYSTERY

==================================================
2. NEW CORE LOOP
==================================================

Replace the previous:

RACE
→ FINISH
→ INVESTIGATION
→ REPAIR
→ SECOND RACE

as the primary loop.

Target:

RACE
→ INCIDENT
→ DEGRADED / LIMP STATE
→ RAPID DIAGNOSIS
→ REPAIR
→ RETURN TO RACE
→ FINISH

Optional after Finish:

CLEAN REMATCH
or
FAULT-RUN GHOST CHALLENGE

but this is not required for the main case completion loop.

==================================================
3. RACE MUST REMAIN A GAME
==================================================

The race itself should have a simple independent goal.

For CASE-PT-001:

- countdown
- route
- ordered checkpoints
- race timer
- finish
- personal best where already supported

The player should not begin the race with engineering instructions such as:

"hold accelerator"
"do not brake"
"enter this diagnostic zone"
"reproduce the fault"

The player should simply race.

The track/environment may naturally contain situations that expose the fault.

Do not tell the player the activation condition as an answer.

==================================================
4. INCIDENT MUST FEEL UNEXPECTED
==================================================

CASE-PT-001 already contains a real runtime defect.

Use the actual current fault behavior.

Do not create a fake UI-triggered incident.

When the fault becomes observable:

the player should first experience the symptom.

Only then may a short generic warning appear, for example:

VEHICLE ISSUE
POWER RESPONSE DEGRADED

Do not show:

eDrive scaling fault
root location
failure type
exact internal cause

during the incident.

==================================================
5. RACE CONTINUITY
==================================================

The incident should not feel like:

"the game stopped and now class begins."

The design must preserve race pressure.

Investigate the current runtime/navigation/state behavior and design the
smallest feasible continuity model.

Preferred options, in order:

A. LIVE DEGRADED CONTINUITY
If technically safe and semantically valid:
the vehicle remains in the real degraded/faulted runtime while diagnosis UI is
active and race time continues.

B. RACE-TIME CONTINUITY
If live vehicle simulation cannot safely remain active:
the race time/incident loss clock continues while diagnosis is active, while
the vehicle presentation clearly indicates it remains disabled/degraded.

C. PRESENTATION BACKDROP
If the UI cannot keep the full race viewport active:
show a lightweight visual representation of the stranded/crawling vehicle,
but do NOT present a cosmetic animation as engineering evidence or actual
physics state.

The design document must inspect current implementation and select the smallest
honest option.

Do not redesign Rapier merely to achieve this effect.

==================================================
6. VEHICLE MOTION DURING INCIDENT
==================================================

For CASE-PT-001, the current fault produces degraded propulsion rather than an
invented catastrophic failure.

If actual runtime supports continued slow movement:

use that behavior.

If it does not:

do not invent a fake physical claim.

The visual concept may still communicate urgency through:

- disabled/degraded vehicle pose
- slow presentation movement
- hazard/reaction animation
- race timer
- time-loss counter

but presentation-only elements must remain presentation-only.

Future cases may legitimately have different incident states:

DEGRADED
LIMP
STOPPED
INTERMITTENT
RECOVERABLE

Do not implement these states now.

Only make the design extensible enough to name the concept.

==================================================
7. RAPID DIAGNOSIS, NOT LONG STUDY SESSION
==================================================

The investigation during the race should be short and decision-oriented.

The player should feel pressure to:

identify
narrow
prove
repair

rather than read every engineering document.

Use the existing three conceptual gates:

PHENOMENON
FAULT PATH
PROOF

but redesign their presentation for Rapid Diagnosis.

The player may still inspect deeper information.

Deep information remains available.

It must not be required to read every detail for the standard CASE-PT-001
completion path.

==================================================
8. RAPID DIAGNOSIS FLOW
==================================================

Target interaction:

ROUND 1 — PHENOMENON

Question:

"What actually went wrong?"

Use actual incident evidence.

Player confirms the observed symptom.

This should be quick.

ROUND 2 — FAULT PATH

Question:

"Where does normal behavior become abnormal?"

Use:

LAST KNOWN NORMAL
→ UNKNOWN REGION
→ FIRST KNOWN ABNORMAL

This remains the main deduction mechanic.

ROUND 3 — PROOF

Question:

"What test distinguishes the remaining suspect?"

Use the existing supported C/WASM component experiment.

Only valid formal evidence may satisfy PROOF.

Do not fabricate shortcuts.

==================================================
9. DO NOT TURN RAPID DIAGNOSIS INTO MULTIPLE CHOICE TRIVIA
==================================================

The player should not simply answer:

A
B
C
D

based on memorized facts.

Prefer interactions such as:

- choose which part of the path to inspect next
- compare two boundary observations
- mark LAST KNOWN NORMAL
- mark FIRST KNOWN ABNORMAL
- eliminate a suspect using evidence
- select the useful component experiment
- run and store actual evidence

The player is making diagnostic decisions.

They are not taking a quiz.

==================================================
10. SUSPECT MODEL
==================================================

Keep the simple suspect model:

POSSIBLE
ELIMINATED
SUPPORTED

For CASE-PT-001, use only the smallest useful suspect set supported by current
architecture/runtime.

Current candidate concept:

Gear/input state
Propulsion request generation
narrow VMC/torque calculation path
eDrive
downstream application/vehicle response

But use canonical Registry IDs and actual current engineering relations when
available.

Do not duplicate engineering truth.

Every suspect state change requires evidence.

==================================================
11. URGENCY / TIME PRESSURE
==================================================

Time pressure should come primarily from the race context.

Prefer:

RACE TIME CONTINUES

and/or:

INCIDENT TIME LOSS

Do not immediately add a separate bomb-style countdown.

The player should feel:

"Every second I spend diagnosing costs race time."

rather than:

"I die in 10 seconds if I don't click something."

This preserves tension without making engineering investigation impossible.

==================================================
12. PENALTIES
==================================================

Design penalties carefully.

Potential MVP penalty concepts:

wrong unsupported diagnosis
→ time loss

unnecessary diagnostic experiment
→ small time loss

hint / assisted guidance
→ assisted status and/or time cost

random guessing
→ time loss or investigation rating loss

Do NOT finalize exact penalty numbers yet.

Do NOT punish opening engineering information.

The player should never avoid learning because reading costs excessive penalty.

Penalty should target:

careless guessing
unsupported decisions
inefficient diagnosis

not curiosity.

==================================================
13. POSITIVE FEEDBACK
==================================================

Provide positive game feedback for good diagnostic play.

Possible examples:

FIRST TRACE
BOUNDARY FOUND
EVIDENCE LOCKED
SUSPECT ELIMINATED
FAST DIAGNOSIS
NO HINT
CLEAN EVIDENCE
REPAIR READY

Do not turn them into engineering verdicts.

They are gameplay feedback only.

==================================================
14. INFORMATION PRESENTATION
==================================================

Preserve the previously accepted principle:

DO NOT HIDE ENGINEERING CONTEXT.

Use:

PRIMARY_FOCUS
CONTEXT
BACKGROUND

The player should see the whole relevant architecture while the current action
is visually emphasized.

Background remains:

visible
readable
interactive

Do not lock unrelated tools.

Collapse only long secondary metadata.

==================================================
15. REFERENCE VEHICLE REGISTRY
==================================================

The new Reference Vehicle Registry now exists.

Gameplay must reference canonical IDs through the Registry.

Do not hardcode independent vehicle truth into gameplay.

Examples:

Suspect
→ architectureRefs

Evidence
→ canonical entity reference

FocusTarget
→ canonical entity/UI target reference

Requirement context
→ Registry query

Test context
→ Registry query

The gameplay layer may own:

progression
presentation
time pressure
focus state
race state
incident state
hint state

It must not own:

engineering meaning
requirement truth
root cause truth
oracle truth
signal definition
implementation status

==================================================
16. PAGE / UI STRUCTURE DURING INCIDENT
==================================================

Re-evaluate the current Pages 1–4.

The old model may be too slow for Rapid Diagnosis if the player must feel that
the race is still active.

Do NOT automatically delete Pages 1–4.

Instead design the smallest presentation change that makes them feel like one
incident workflow.

Possible concept:

INCIDENT WORKSPACE

top or side:
Race/incident status

center:
current diagnostic question

existing Page tools:
still available

progress:
PHENOMENON
→ FAULT PATH
→ PROOF
→ REPAIR

Determine whether existing Pages should remain explicit tabs or become
progressive steps within the same workspace.

Preserve every implemented capability.

Do not remove:

Function Inspector
Signal Monitor
Interface
Requirement
Workbench
Notes
Bookmarks
History
formal evidence

==================================================
17. RACE VISIBILITY DURING DIAGNOSIS
==================================================

Design a way for the race context to remain perceptually present.

Examples to evaluate:

- small live race viewport
- degraded vehicle strip
- incident camera
- timer always visible
- track progress still visible
- vehicle crawling/stranded presentation
- cat-driver reaction

Do not let the diagnosis UI feel like an unrelated desktop application.

Do not require major new 3D assets.

Use existing visual assets where possible.

==================================================
18. HUMOR / CHARACTER
==================================================

Humor should come from presentation, not fake engineering.

Potential tone:

- driver cat visibly struggling with the degraded vehicle
- cat reaction when the car barely moves
- pit/engineer reaction
- repair success reaction
- sarcastic but short incident comments

Do NOT add:

unrelated rival characters whose only purpose is to mock the player
long comedy cinematics
random jokes that break the technical problem

The vehicle problem remains credible.

Character reaction keeps the tone light.

==================================================
19. ENVIRONMENTAL CONTEXT
==================================================

Future cases should use realistic driving situations to make different vehicle
functions relevant.

Examples:

Propulsion:
straight / hill / load

Braking:
traffic signal / stop line / downhill

Gear:
parking / forward-reverse transition

Steering:
curved road / maneuver

Stability:
low-friction or disturbed vehicle behavior

ACC:
lead-vehicle following

AEB:
sudden hazard / lead vehicle braking

LKA:
lane curve / drift

Energy:
power limitation context

However:

DO NOT implement unsupported environments or vehicle functions now.

Do not add pedestrian/cyclist/traffic actors to CASE-PT-001 merely for variety.

The design should only reserve a reusable concept such as:

DrivingContext
IncidentContext
EnvironmentEvent

if truly needed later.

==================================================
20. FUTURE CASE VARIETY
==================================================

The game must not assume all future incidents are:

"accelerator pressed, acceleration weak."

Future Case framework should eventually support different symptom families:

weak output
excessive output
no output
wrong direction
state transition failure
delay
intermittent behavior
validity fault
constraint failure
recovery failure
actuation mismatch
communication/interface issue

But DO NOT implement them now.

The current task only ensures the gameplay design does not structurally prevent
them.

==================================================
21. REPAIR
==================================================

Repair must remain evidence-driven.

Do not allow the player to spam repairs from the start.

Root-cause/repair availability should require sufficient investigation evidence.

Use actual supported repair variants.

Do not fake code editing.

Do not silently swap to healthy runtime after a failed repair.

==================================================
22. RETURN TO RACE
==================================================

After successful repair:

the player should return to racing quickly.

Avoid:

repair success
→ long report
→ menu
→ loading
→ new race

Prefer:

REPAIR VERIFIED
→ short feedback
→ CONTROL RESTORED
→ return to track

Continue the current race where practical.

If current architecture requires a short controlled restart:

design the smallest transition.

Do not require a full second race for main case completion.

==================================================
23. OPTIONAL REMATCH
==================================================

After Case completion, optional replay content may include:

CLEAN REMATCH
FAULT RUN GHOST
PERSONAL BEST

This is secondary.

Do not make Ghost implementation P0 unless repository inspection shows it is
very cheap.

The main loop must already work without it.

==================================================
24. RACE SCORING
==================================================

Do not create one opaque total score.

Keep separable concepts:

DRIVING
DIAGNOSIS
RESOLUTION

Possible examples:

DRIVING
- finish
- checkpoint progress
- race time

DIAGNOSIS
- incident diagnosis duration
- hints
- unsupported guesses
- evidence efficiency

RESOLUTION
- correct cause
- repair verification

Do not finalize weights.

==================================================
25. FAILURE / RETRY
==================================================

The game should recover quickly from mistakes.

Wrong hypothesis:
stay in diagnosis, lose some time or rating.

Wrong repair:
show failed regression, return to repair selection.

Insufficient evidence:
show what type of evidence is still missing.

No full-case restart for a normal diagnostic mistake.

Race failure may still occur if future game rules justify it, but do not make
the current MVP excessively punitive.

==================================================
26. CASE-PT-001 FULL PLAYTHROUGH
==================================================

Rewrite the CASE-PT-001 vertical slice completely under the new model.

It must specify:

1. race start
2. race goal
3. what the player knows before the incident
4. how the actual current fault becomes noticeable naturally
5. what visual/audio feedback appears
6. whether vehicle remains live/degraded/stopped during diagnosis based on
   actual current implementation
7. what race/timer context continues
8. how Rapid Diagnosis opens
9. PHENOMENON interaction
10. suspect set
11. FAULT PATH interaction
12. LAST KNOWN NORMAL
13. FIRST KNOWN ABNORMAL
14. PROOF experiment
15. penalties/feedback during diagnosis
16. root-cause availability
17. repair action
18. repair verification
19. return-to-race transition
20. finish
21. final result screen
22. optional rematch if recommended

Do not invent unsupported runtime numbers.

==================================================
27. IMPLEMENTATION FEASIBILITY
==================================================

The implementation period is limited.

For every proposed mechanic classify:

P0
P1
P2
DEFER

P0 must be small enough to implement for CASE-PT-001.

Prefer reuse of:

existing RaceScreen
RaceHUD
GamePhase
incident capture
investigation workspace
Function Inspector
Signal Monitor
Requirement/Interface views
component Workbench
repair variant system
recovery/checkpoint/timer system
current cat assets

Do not propose a new engine.

==================================================
28. P0 SHOULD PROBABLY CENTER ON
==================================================

Evaluate, do not blindly assume, the following P0 candidate set:

- ordinary race start
- actual incident during natural driving
- persistent race/incident pressure
- compact incident status presentation
- Rapid Diagnosis progression
- three evidence gates
- simple suspect states
- focus guidance
- supported component proof
- repair
- fast return to race
- finish/debrief
- regression protection

If something already exists, reuse it.

If something is expensive and not essential, move it out of P0.

==================================================
29. REMOVE / CORRECT OLD DESIGN
==================================================

Explicitly identify and correct obsolete sections in:

docs/gameplay_redesign/MVP_GAMEPLAY_REDESIGN.md

docs/gameplay_redesign/MVP_IMPLEMENTATION_TASKS.md

In particular remove or rewrite concepts equivalent to:

- "drive specifically to reproduce the fault"
- "acceleration check zone as an explicit diagnostic instruction"
- "hold accelerator because the mission tells you the activation condition"
- mandatory full race completion before investigation
- mandatory second full race as the only payoff

Do not leave contradictory old/new design text in the documents.

==================================================
30. OUTPUT FILES
==================================================

Modify in place:

docs/gameplay_redesign/MVP_GAMEPLAY_REDESIGN.md

docs/gameplay_redesign/MVP_IMPLEMENTATION_TASKS.md

Create exactly one additional correction report:

docs/gameplay_redesign/
GAMEPLAY_MVP_DESIGN_CORRECTION_REPORT.md

Do not create another large documentation package.

==================================================
31. CORRECTION REPORT
==================================================

Include:

1. old concept
2. why it was rejected
3. new core loop
4. race continuity model selected
5. urgency mechanism
6. Rapid Diagnosis interaction
7. penalty/reward model
8. information presentation
9. repair/return-to-race
10. optional rematch
11. future environmental Case strategy
12. P0/P1/P2/DEFER summary
13. actual implementation constraints discovered
14. remaining open design decisions

==================================================
32. ABSOLUTELY DO NOT MODIFY
==================================================

Do NOT modify:

src/
c/
tests/
WASM
Rapier
Reference Vehicle canonical engineering data
Reference Vehicle Registry
CASE-PT-001 canonical root cause
Fault Injection behavior
calibration
PRODUCT_REQUIREMENTS_RECONCILIATION.md

This pass is DESIGN ONLY.

Do not commit automatically.

==================================================
33. FINAL DESIGN GATE
==================================================

Return exactly one:

GAMEPLAY_MVP_CORRECTED_READY

GAMEPLAY_MVP_CORRECTED_WITH_IMPLEMENTATION_DECISIONS

GAMEPLAY_MVP_CORRECTION_BLOCKED

The expected result is:

GAMEPLAY_MVP_CORRECTED_READY

or:

GAMEPLAY_MVP_CORRECTED_WITH_IMPLEMENTATION_DECISIONS

if live-race continuity requires implementation choices.

==================================================
34. FINAL CHAT RESPONSE
==================================================

Return:

1. corrected core loop
2. why the old driving-objective model was removed
3. CASE-PT-001 race structure
4. incident behavior
5. selected race continuity model
6. Rapid Diagnosis structure
7. suspect mechanic
8. urgency/time-pressure model
9. penalty/reward model
10. repair-to-race transition
11. optional rematch decision
12. environmental/future Case strategy
13. P0 implementation scope
14. P1/P2/deferred features
15. main technical risks
16. final design gate

Do not implement gameplay.