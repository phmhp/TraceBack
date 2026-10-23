IMPORTANT:
Preserve every IMPLEMENTED item in docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md.
Any regression against that reconciliation matrix is a release blocker.

# TRACKBACK
# Gameplay MVP Redesign — Fun + Investigation + Learning
# DESIGN ONLY / CURRENT CASE VERTICAL SLICE

Repository:
Use the currently opened TraceBack repository.

This task is a GAMEPLAY/UX DESIGN PASS only.
Do NOT implement changes yet.

The implementation period is limited.
Avoid large systems and unnecessary redesign.

The goal is simple:

TRACKBACK must feel like a game,
must contain real fault investigation,
and must teach vehicle embedded-SW verification.

Use the current playable canonical case CASE-PT-001 as the MVP vertical slice.

==================================================
1. PRODUCT GOAL
==================================================

Target player experience:

DRIVE
→ EXPERIENCE A FAILURE
→ IDENTIFY THE PHENOMENON
→ NARROW THE FAULT PATH
→ VERIFY A HYPOTHESIS
→ IDENTIFY ROOT CAUSE
→ REPAIR
→ REPLAY THE RELEVANT CONDITION
→ CASE CLEAR

The player should feel:

"I drove the failure, investigated it, proved the cause, fixed it, and saw the result."

Do NOT turn TRACKBACK into:

- a textbook with a car attached
- a large engineering dashboard with no gameplay
- a multiple-choice quiz
- a generic racing game with educational text added afterward

==================================================
2. STRICT MVP SCOPE
==================================================

Do NOT propose for the MVP:

- large Engineer Notebook/collection system
- skill tree
- career mode
- complex difficulty modes
- open world
- multiple route system
- complex economy
- large achievement system
- multiplayer
- new ABS/ESC/AEB implementation
- new CAN/network simulation
- new sensor architecture
- major physics rewrite
- large Phase 08 gameplay framework

Reuse the existing game and components as much as possible.

==================================================
3. PRESERVE CURRENT STRENGTHS
==================================================

Preserve conceptually:

- current driving simulation
- real C/WASM execution
- Rapier physics
- CASE-PT-001 canonical truth
- current fault behavior
- Function Inspector
- Signal Monitor
- Requirement information
- Workbench
- Fault Injection
- Repair / Replay
- traceability
- Notes / bookmarks / page history where implemented
- whole-vehicle architecture and active-case path distinction

Do not delete valuable engineering information.

==================================================
4. CORE GAME LOOP
==================================================

Design CASE-PT-001 around four short phases.

PHASE A — DRIVE

The player receives one or a few simple driving objectives using current capabilities.

Examples:

- accelerate through a marked zone
- reach a speed/checkpoint gate
- follow the route
- reproduce the condition that exposes the fault

Driving must make the abnormal behavior noticeable.
Driving must not merely exist to reach the investigation screen.

PHASE B — INVESTIGATE

The player uses existing engineering views to answer:

"Where does normal behavior stop and abnormal behavior begin?"

Use a small number of relevant Functions/Signals/Requirements first,
while keeping surrounding engineering context visible.

PHASE C — VERIFY

The player uses the existing Workbench or supported experiment path to distinguish competing hypotheses.

Do not fabricate PASS/FAIL if no deterministic oracle exists.

PHASE D — RESOLVE

The player:

- selects the root cause
- chooses/performs the supported repair
- repeats the relevant scenario condition
- sees before/after evidence
- clears the case

==================================================
5. THREE EVIDENCE GATES ONLY
==================================================

Use only three investigation progression gates.
Do not build an inventory-heavy key system.

Gate 1 — PHENOMENON
Question:
"What went wrong?"

Gate 2 — FAULT PATH
Question:
"Where in the functional/data path did the abnormality begin?"

Gate 3 — PROOF
Question:
"What evidence distinguishes the likely root cause from the alternatives?"

After all three gates are satisfied:
ROOT CAUSE selection becomes available.

Opening a page alone must NOT satisfy a gate.
Each gate requires a meaningful player action or evidence state.

The visual metaphor may be simple progress markers rather than literal keys.

==================================================
6. SIMPLE SUSPECT SYSTEM
==================================================

For CASE-PT-001 present approximately 3–5 plausible suspect regions based on actual canonical architecture and case evidence.

Each suspect may be only:

POSSIBLE
ELIMINATED
SUPPORTED

Do NOT implement statistical confidence percentages.
Do NOT reveal canonical root cause directly.

Evidence should reduce the suspect set.
The core deduction pattern should be:

LAST KNOWN NORMAL
→ UNKNOWN REGION
→ FIRST KNOWN ABNORMAL

This should become the main investigation learning mechanic.

==================================================
7. INFORMATION PRESENTATION — DO NOT HIDE CONTEXT
==================================================

Do NOT solve information overload primarily by collapsing or hiding engineering information.

Prefer:

FULL CONTEXT VISIBLE
+ CURRENT TASK EMPHASIS
+ CONTEXT DIMMING
+ RELEVANT PATH HIGHLIGHTING

Use three visual priority levels:

PRIMARY_FOCUS
- current evidence or item the player should inspect now
- strongest visual emphasis

CONTEXT
- directly related surrounding Functions/Signals/Requirements
- normal readability

BACKGROUND
- currently lower-priority information
- visually dimmed but still readable and interactive

Background information must not become disabled merely because it is not recommended.

Use collapse/expand only for genuinely long secondary material such as:

- very long provenance
- raw technical metadata
- large trace tables
- developer-oriented details

Normal Function, Signal, Requirement, Interface and Test information should remain available in-place whenever practical.

The UX goal is:

GUIDE ATTENTION WITHOUT REMOVING CONTEXT.

==================================================
8. CURRENT QUESTION / SPOTLIGHT GUIDANCE
==================================================

Every investigation page should have one clear current question.

Examples:

"어떤 현상이 발생했나요?"
"정상 신호는 어디까지 전달됐나요?"
"최초 편차는 어디에서 나타났나요?"
"이 가설을 어떤 실험으로 구분할 수 있나요?"

Use spotlight-like visual guidance:

- emphasize relevant cards/signals/functions
- dim unrelated regions
- highlight the relevant path
- allow the user to inspect anything at any time

Do not auto-navigate through all answers.
Do not give away root cause.

==================================================
9. PAGE 1–4 ROLES
==================================================

Preserve the four-page structure.
Give each page one clear gameplay role.

PAGE 1 — INCIDENT
Question:
"What happened?"

Show:
- run summary
- mission/driving condition
- symptom
- small timeline
- relevant observed evidence

Gameplay goal:
complete PHENOMENON gate.

PAGE 2 — INVESTIGATE
Question:
"Where did the fault begin?"

Use:
- Function Inspector
- Signal Monitor
- Requirement information when useful
- Interface evidence where supported
- ACTIVE CASE PATH
- whole-vehicle context in the background
- suspect elimination

Gameplay goal:
complete FAULT PATH gate.

PAGE 3 — VERIFY
Question:
"Can I prove this hypothesis?"

Use:
- existing Workbench
- supported controlled stimulus/observation
- test evidence

Gameplay goal:
complete PROOF gate.

PAGE 4 — RESOLVE

Show:
- collected evidence
- remaining suspects
- root-cause selection
- repair
- replay
- before/after summary

Gameplay goal:
CASE CLEAR.

==================================================
10. RACING FUN — MINIMUM VIABLE CHANGE
==================================================

Do NOT redesign the physics.

Improve racing mainly through:

- clear short objectives
- checkpoints
- readable route
- feedback for objective completion
- fault symptom exposure
- fast retry
- replay payoff

For CASE-PT-001 propose a short track sequence using only current capabilities.

Possible primitives:

START
CHECKPOINT
ACCELERATION ZONE
SPEED GATE
BRAKE/TURN ZONE
FINISH

Every driving element must serve at least one purpose:

FUN
FAULT ACTIVATION
SYMPTOM EXPOSURE
EVIDENCE GENERATION
REPLAY COMPARISON

Avoid unrelated arcade gimmicks.

==================================================
11. DRIVING FEEDBACK
==================================================

Keep driving HUD simple.

Possible lightweight messages:

CHECKPOINT
OBJECTIVE COMPLETE
FAULT OBSERVED
EVIDENCE CAPTURED
CLEAN SECTION

Do not display deep engineering tables while steering.

==================================================
12. REPLAY PAYOFF
==================================================

Replay is a major gameplay and learning payoff.

After Repair, repeat the relevant condition.

Compare:

FAULT RUN
vs
REPAIRED RUN

Use only real available evidence.

Possible presentation:

- route/ghost comparison if already practical
- checkpoint result
- speed difference
- selected signal difference
- symptom present/absent

Do not call the replay VERIFIED unless a valid oracle supports that verdict.

==================================================
13. SIMPLE SCORE
==================================================

Do not create a complex economy.

Use at most three score dimensions:

DRIVING
INVESTIGATION
RESOLUTION

Do not finalize precise weights yet.

Driving skill must not prevent educational completion.
Fast driving alone must not produce maximum diagnostic score.

==================================================
14. FAST RETRY
==================================================

Avoid full-case restarts where possible.

Prefer:

- retry driving section
- retry experiment
- return to investigation

for mistakes such as:

- missed objective
- wrong experiment
- wrong hypothesis

==================================================
15. CASE-PT-001 VERTICAL SLICE
==================================================

Create one concrete step-by-step redesigned playthrough for CASE-PT-001.

Specify:

1. Mission briefing
2. Exact driving objective using current runtime capabilities
3. Fault symptom experienced by the player
4. What Page 1 emphasizes
5. Player action that satisfies PHENOMENON
6. 3–5 initial suspect regions
7. What Page 2 emphasizes
8. Which evidence eliminates/supports each suspect
9. Last Known Normal
10. First Known Abnormal
11. What Page 3 experiment is used
12. What evidence satisfies PROOF
13. How root-cause selection unlocks
14. Repair interaction
15. What Replay repeats
16. Before/after evidence shown
17. Case-clear condition

Do not invent unsupported runtime values, signals, expected values, or physics.

==================================================
16. CURRENT UI AUDIT
==================================================

Inspect current UI/source and classify each major panel as:

KEEP
KEEP_AND_HIGHLIGHT
SIMPLIFY_LAYOUT
DIM_WHEN_NOT_RELEVANT
MOVE_WITHIN_PAGE
REMOVE_ONLY_IF_DUPLICATE

Do NOT use COLLAPSE_BY_DEFAULT as the primary recommendation.

Identify:

- what should be emphasized for each current question
- what should remain visible as context
- what is truly duplicate
- what leaks root cause
- what interrupts gameplay unnecessarily

==================================================
17. IMPLEMENTATION PRIORITY
==================================================

The implementation period is limited.

Prioritize:

P0 — required for one playable vertical slice
P1 — strong improvement if time remains
P2 — polish/later

P0 should be deliberately small.

Prefer reusing existing components and state over creating new systems.

Likely P0 themes:

- driving objective/checkpoint feedback
- three evidence gates
- current-question/focus guidance
- 3–5 suspect states
- Page 1–4 progression lock/unlock
- repair/replay completion feedback

Do not assume all are missing; inspect existing implementation first.

==================================================
18. MINIMAL GAMEPLAY DATA
==================================================

Avoid CASE-PT-001-only hardcoded UI when a tiny reusable structure is enough.

Use the smallest reusable concepts needed, such as:

DrivingObjective
EvidenceGate
Suspect
EvidenceReference
FocusTarget
RepairReplayStep

These gameplay records must REFERENCE canonical engineering IDs.

They must not copy or redefine engineering truth.

Do NOT start the full Phase 08 registry implementation in this task.

==================================================
19. REFERENCE VEHICLE RELATIONSHIP
==================================================

The Reference Vehicle architecture will continue to be completed and later integrated into the game.

Gameplay redesign must remain compatible with that direction.

Do not create a separate vehicle truth model inside gameplay code.

The gameplay layer may control:

- presentation
- current question
- focus/highlight state
- progression gates
- mission objectives
- suspect presentation

It must not redefine:

- signal meaning
- requirement truth
- root cause truth
- oracle truth
- architecture ownership

==================================================
20. DO NOT IMPLEMENT
==================================================

This is DESIGN ONLY.

Do not modify:

src/
c/
tests/
WASM
Rapier
runtime behavior
Reference Vehicle canonical engineering data
CASE-PT-001 root cause
Fault Injection behavior
calibration
docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md

Do not commit automatically.

==================================================
21. OUTPUT
==================================================

Create only:

docs/gameplay_redesign/MVP_GAMEPLAY_REDESIGN.md

docs/gameplay_redesign/MVP_IMPLEMENTATION_TASKS.md

MVP_GAMEPLAY_REDESIGN.md must include:

- current gameplay problem
- simplified core loop
- three evidence gates
- suspect system
- focus-guidance information presentation
- Page 1–4 roles
- racing objective design
- CASE-PT-001 complete vertical slice
- repair/replay payoff
- simple score/retry design

MVP_IMPLEMENTATION_TASKS.md must include:

- P0 / P1 / P2 tasks
- existing components to reuse
- likely files/components affected
- smallest gameplay-state/data additions
- regression risks
- explicit DO NOT BUILD NOW list

==================================================
22. FINAL RESPONSE
==================================================

Return only:

1. Simplified core loop
2. CASE-PT-001 driving objective
3. Three evidence gates
4. Suspect-system summary
5. Page 1–4 role summary
6. Focus-guidance UX summary
7. P0 implementation tasks
8. Existing features reused
9. Features explicitly deferred
10. Main implementation risks

Do not implement yet.