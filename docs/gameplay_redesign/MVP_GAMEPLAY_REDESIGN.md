# TRACKBACK Gameplay MVP Redesign — Corrected

## 1. Purpose and correction boundary

TRACKBACK's MVP is a racing game whose incident investigation changes the outcome of the same race. It is not a driving scene followed by a separate diagnostic quiz, and it is not an architecture browser with a race attached.

This correction preserves every implemented investigation, evidence, verification, vehicle, and canonical-data capability recorded in `docs/PRODUCT_REQUIREMENTS_RECONCILIATION.md`. It changes gameplay composition and presentation priorities only. It does not redefine Reference Vehicle truth, CASE-PT-001 truth, signals, requirements, C/WASM behavior, Rapier physics, or verification verdicts.

The following earlier directions are explicitly rejected:

- telling the player in advance to reproduce the known fault by holding the accelerator in a dedicated zone;
- adding a separate, large `WHOLE VEHICLE · REFERENCE ARCHITECTURE` content surface;
- duplicating Test Design Technique or component/vehicle verification explanations;
- hiding already implemented evidence behind new toggles;
- requiring a second full race merely to prove that the repair mattered;
- presenting a correct guess as a supported engineering conclusion.

Architecture integration means updating the labels, relationships, and explanations of the existing investigation map, Function Inspector, interface view, requirements view, and verification flow with canonical Registry data. It does not mean adding another architecture lesson or dashboard.

## 2. Actual implementation constraints

| Current behavior | Design consequence |
| --- | --- |
| `SimulationRuntime` pauses and captured incidents lock vehicle advancement during `FAULT_EVENT` and `INVESTIGATION`. | P0 must not pretend the vehicle is still moving. Use race-time continuity through an explicit incident-time cost. |
| Incident capture and CASE-PT-001 trace are real runtime records. | Investigation must enter only after valid capture and must not replace the trace with scripted evidence. |
| Pages 1–4 and their investigation tools already exist. | Rapid Diagnosis recomposes the existing pages; it does not replace them with a new minigame. |
| Repair/recovery, checkpoints, finish, personal best, and result foundations already exist. | Reuse them to return to the same mission; do not build a competing race loop. |
| Page 2 currently has an added whole-vehicle architecture panel. | Remove that presentation from the gameplay design; fold Registry-backed content into the existing map surfaces. |
| Page 3 exposes Test Design Technique more than once. | Keep one technique explanation/selection point in a single verification sequence. |

## 3. Corrected core loop

```text
RACE
  → real vehicle incident
  → short incident feedback and valid capture
  → RAPID DIAGNOSIS under visible race-time consequence
  → evidence-qualified conclusion
  → executable repair selection and verification
  → RETURN TO THE SAME RACE
  → ordered checkpoints and valid finish
  → RESULT
  → optional clean rematch
```

The player begins by racing normally. No technical clue, target signal, root-cause name, or reproduction recipe is shown before the incident. The actual vehicle response creates the question the player must investigate.

## 4. Selected continuity model: RACE-TIME CONTINUITY

P0 selects `RACE-TIME CONTINUITY`, not fake live motion.

- At valid incident capture, vehicle physics and the simulation clock remain paused exactly as the current runtime requires.
- A separate monotonic `INCIDENT TIME LOSS` clock begins and stays visible throughout investigation and repair.
- The race HUD makes the consequence understandable: the car is secured while the event remains part of the race result.
- Any captured viewport is clearly labelled as the incident frame, not a live vehicle feed.
- Investigation duration is added to the mission result using one documented formula. It is never hidden.
- No fake speed, trajectory, vehicle movement, telemetry, or degradation animation is generated.
- After successful repair verification, the player returns to the same mission context at a safe restart pose compatible with the current map/runtime contract.

P1 may evaluate a verified degraded/limp-driving continuity model. It may be adopted only if the real vehicle runtime can keep the vehicle controllable, preserve trace integrity, prevent incident recurrence, and avoid fabricated behavior. Until then it is deferred.

## 5. CASE-PT-001 end-to-end playthrough

1. The mission opens with a concise race objective and controls.
2. The player starts driving normally.
3. The real CASE-PT-001 trigger conditions emerge through ordinary play.
4. The vehicle shows the real degraded response.
5. A short, skippable attention effect and surprised cat reaction acknowledge the incident without naming its cause.
6. The runtime validates and captures the incident trace.
7. Vehicle advancement pauses; `INCIDENT TIME LOSS` begins.
8. The investigation opens on Page 1 with the symptom and captured observations.
9. The guide asks the player to identify the affected driving behavior before looking inside the architecture.
10. Page 1 establishes what was requested, what state applied, and how the vehicle actually responded.
11. Page 2 opens the existing investigation map at the relevant driving-function context.
12. The player traces response → processing → input using existing functions, signals, interfaces, requirements, and notes.
13. Suspects move between `POSSIBLE`, `ELIMINATED`, and `SUPPORTED` only when linked evidence justifies the change.
14. The guide highlights the next reasoning question without hiding surrounding information.
15. The player forms a hypothesis from the narrowed fault path.
16. Page 3 shows one continuous verification workflow: basis → conditions → stimulus → monitors → expected → run → observe → interpret.
17. Test Design Technique appears once in that workflow.
18. Real component and vehicle observations remain clearly distinguished; neither overclaims whole-vehicle certification.
19. Page 4 accepts only a conclusion whose location, failure type, and evidence scope are supported.
20. The player selects an executable repair and runs actual repair verification.
21. A successful result stops incident time loss and returns the repaired vehicle to the same race mission.
22. The player completes ordered checkpoints, crosses the valid finish, and receives separate diagnostic and driving results.

Assisted solution and retry paths use the same loop. They never dead-end the session and remain visibly distinct from an independently supported conclusion.

## 6. Rapid Diagnosis using existing Pages 1–4

Rapid Diagnosis is a pacing and guidance layer, not a fifth page and not a simplified multiple-choice quiz.

### PHENOMENON — Page 1

Player question: “무엇을 요청했고, 차는 실제로 어떻게 반응했지?”

Keep the existing incident report, driver statement, operating conditions, requirement basis, signals, and observations. Translate difficult headings into first-time-player language while retaining canonical IDs and technical details as supporting context. Before Page 2, the guide connects the symptom to a driving capability such as propulsion, braking, steering, or direction/state control without revealing the root cause.

### FAULT PATH — Page 2

Player question: “정상 반응을 만드는 흐름에서 어디부터 차이가 생기지?”

Use the existing investigation map. Domain-level context is selectable within the same map and explains how its functions connect. Input, processing, and output are drawn as one readable flow with non-breaking technical labels. Registry-backed architecture details update existing nodes, Inspector content, interface relationships, and requirement links in place.

Do not add a separate whole-vehicle architecture panel. The complete context remains visible, but visual hierarchy distinguishes:

- `PRIMARY_FOCUS`: the current reasoning target;
- `CONTEXT`: directly connected evidence;
- `BACKGROUND`: the rest of the visible system context.

### PROOF — Pages 3 and 4

Player question: “어떤 controlled test가 이 가설을 지지하거나 반박하지?”

Page 3 presents a single test-design and execution flow. Requirement analysis, equivalence partitioning, boundary analysis, and error guessing are explained once. Component calculation and vehicle observation may use different runtimes, but their role and limits are explained in the same sequence without duplicate cards.

Page 4 reports exactly what the selected formal evidence supports. Diagnosis correctness, evidence sufficiency, component verdict, repair verification, and whole-vehicle behavior stay separate.

## 7. Guidance without hiding information

The player should learn a repeatable verification thought process, not follow an autoplay tour.

- Keep existing evidence visible; do not convert it into a sequence of collapsed toggles.
- Place a short “current question” beside the existing content: observe → compare → trace → test → conclude.
- Emphasize the smallest exact target with a restrained red-pencil mark and dim only unrelated context.
- Scroll the focused target fully into view before drawing the mark.
- Never cover the target with the help card.
- Advance only when the player presses `다음`; do not rush through steps on timers.
- Move the tutorial cursor to the real control before a tab/page change and show the click.
- Always clear blur, dimming, cursor, and annotations on exit, skip, navigation, and unmount.
- Guidance text explains why the target matters and what question to answer; it does not disclose hidden fault truth.

## 8. Evidence-backed suspect mechanic

Suspect status belongs in the existing hypothesis/progress area, not in a new large panel.

| State | Meaning | Allowed transition |
| --- | --- | --- |
| `POSSIBLE` | The observed path makes the function worth checking. | Requires a linked observation or path relationship. |
| `ELIMINATED` | Available evidence contradicts this suspect under the tested condition. | Requires contradictory signal, interface, requirement, or test evidence. |
| `SUPPORTED` | Current evidence supports this suspect within an explicit scope. | Requires linked formal evidence; it is not equivalent to final root-cause certification. |

Clicking a function alone never changes the state. Random guessing consumes time/attempt cost but never fabricates evidence. The UI keeps the evidence link and reasoning visible so the player can explain each transition.

## 9. Urgency, penalties, and rewards

Urgency comes from a visible race consequence, not from inaccessible technical reading speed.

- `INCIDENT TIME LOSS` is visible and paused only during system-controlled transitions.
- Unsupported submission adds a configurable time penalty and returns the player to the missing reasoning step.
- Incorrect executable repair shows its real verification result and allows retry; it never silently heals the vehicle.
- Hints and solution viewing remain usable but record `ASSISTED` completion separately.
- Diagnostic achievement measures evidence quality and independent/assisted status.
- Driving achievement measures checkpoint-valid finish and time.
- The two achievements are never collapsed into a misleading engineering score.

Exact penalty values and medal thresholds require playtest data and remain mission configuration, not canonical engineering requirements.

## 10. Repair and return to race

After a supported or explicitly assisted diagnosis:

1. Show only genuine executable repair variants already backed by the runtime.
2. Explain the suspected behavior each option changes without revealing unverified truth.
3. Run actual repair verification.
4. Distinguish diagnosis outcome, test verdict, repair verification, and expected post-repair behavior.
5. On success, restore the mission at a safe return point with the repaired runtime variant.
6. Prevent the captured incident from unintentionally recurring.
7. Give a short countdown and resume ordered checkpoint play.

The return is to the same race result. Investigation time is part of that result under the selected continuity model.

## 11. Optional clean rematch

After mission completion, offer an optional `CLEAN REMATCH` using the verified repaired variant. It is not required for case resolution. It provides a clean driving-time challenge without investigation interruption and stores records in a separate rules/version scope from the incident race.

## 12. Environmental and future-case strategy

P0 uses the current map and CASE-PT-001. Future episodes may vary route, weather, visibility, traffic context, or mission objective only when the runtime and assets honestly support them. Environmental presentation must never imply nonexistent sensors, signals, requirements, or fault behavior. Track geometry, checkpoint definitions, mission rules, camera settings, and map decoration remain separable.

## 13. Priority plan

### P0 — MVP correction

- Natural race start with no reproduction recipe.
- Real incident capture followed by `RACE-TIME CONTINUITY`.
- Rapid Diagnosis composed from existing Pages 1–4.
- Remove the separate architecture-content concept; update existing surfaces in place.
- One Test Design Technique presentation and one verification flow.
- Evidence-backed suspect states in the existing hypothesis/progress area.
- Player-paced focus guidance with safe cleanup.
- Executable repair verification and return to the same race.
- Separate diagnostic/driving result summary.
- Assisted and retry paths that do not dead-end.

### P1

- Playtest-tuned incident penalties and target times.
- Optional clean rematch and compatible personal-best scoping.
- More expressive but event-driven cat reactions and repair-shop feedback using existing assets.
- Evaluate genuine degraded/limp continuity only after runtime proof.

### P2

- Additional missions backed by canonical cases.
- Configurable environmental variety backed by real runtime capability.
- Medal/reward expansion and lightweight cosmetic progression.

### Deferred

- New vehicle fault cases without canonical truth.
- Complete map replacement.
- Online leaderboard, garage/store, and large art pipeline.
- Fake live vehicle motion during investigation.
- A separate whole-vehicle architecture dashboard.
- Any broad investigation UI redesign that duplicates existing capabilities.

## 14. Success criteria

The corrected MVP succeeds when:

- the player races before receiving technical clues;
- the actual fault affects the actual vehicle and produces a valid captured trace;
- investigation creates an explicit, honest race consequence;
- the player can state what happened, trace where it diverged, and prove the hypothesis;
- all implemented investigation capabilities remain available and semantically unchanged;
- canonical architecture enriches existing content rather than creating a parallel content surface;
- verification technique and execution information is not duplicated;
- unsupported guesses, supported conclusions, assisted solutions, test verdicts, and repair results remain distinct;
- a verified repair returns the player to the same race and a valid position-based finish;
- the final result separates diagnostic achievement from driving achievement;
- no fake telemetry, evidence, requirement, verdict, or vehicle behavior is introduced.

## 15. Design gate

`GAMEPLAY_MVP_CORRECTED_WITH_IMPLEMENTATION_DECISIONS`

The design direction is corrected and implementable, but P0 still requires explicit implementation decisions for the incident-time clock source, final-time composition, safe return pose, configurable penalty values, and clean-rematch record scope.
