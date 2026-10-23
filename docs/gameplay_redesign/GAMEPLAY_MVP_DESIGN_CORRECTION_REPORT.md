# TRACKBACK Gameplay MVP Design Correction Report

## 1. Previous concept summary

The previous MVP draft tried to make the fault legible by instructing the player to enter a dedicated acceleration-check segment, select Drive, avoid braking, and hold accelerator input. It also treated the investigation as a broad content surface, introduced a separate whole-vehicle Reference Architecture presentation, repeated verification-technique content, and leaned on a post-repair recovery run as the main gameplay payoff.

## 2. Why the previous concept was rejected

That model disclosed the reproduction logic before the incident, turning discovery into compliance with instructions. The added architecture surface duplicated rather than clarified the existing investigation map, pushed the active CASE path out of focus, and made the investigation feel like a technical portal instead of a deductive game. Repeated Test Design Technique content further delayed the actual test. A mandatory second race also weakened the causal feeling that the repair saved the race already in progress.

## 3. Corrected core loop

```text
RACE
→ real incident and valid trace capture
→ RAPID DIAGNOSIS
→ evidence-qualified conclusion
→ executable repair and real verification
→ return to the same race
→ ordered checkpoints and finish
→ separated diagnostic/driving result
→ optional clean rematch
```

The race begins naturally. Investigation is caused by actual vehicle behavior, and its outcome changes the continuation of the same mission.

## 4. Selected race-continuity model

P0 selects `RACE-TIME CONTINUITY`.

The current implementation pauses `SimulationRuntime` and locks vehicle advancement after incident capture. The corrected design therefore does not fake a slowly moving vehicle or live telemetry. Physics and simulation time remain paused while a separate, visible `INCIDENT TIME LOSS` clock continues. The final mission result transparently composes driving time, incident time, and configured penalties. A verified repair returns the player to the same mission at a safe runtime-compatible pose.

Real degraded/limp continuity is a P1 evaluation only. It must not ship until executable vehicle behavior, trace validity, controllability, and recurrence prevention are demonstrated.

## 5. Urgency model

Urgency comes from a visible race consequence and clear progress, not forced reading speed or hidden scoring. The player sees incident time accumulate, understands when it stops, and sees any unsupported-submission or failed-repair penalty before confirming. System transitions do not secretly consume time.

## 6. Rapid Diagnosis structure

Rapid Diagnosis recomposes the existing four pages:

- `PHENOMENON` — Page 1: compare request, conditions, and actual response.
- `FAULT PATH` — Page 2: trace the first meaningful divergence through the existing map.
- `PROOF` — Pages 3–4: design one controlled test, interpret real evidence, and state only the supported conclusion.

It is not a fifth page, a trivia quiz, or a replacement for the Function Inspector, interfaces, requirements, notes, component execution, vehicle observations, or formal evidence.

## 7. Suspect mechanic

Suspects use `POSSIBLE`, `ELIMINATED`, and `SUPPORTED`. Each transition requires linked evidence and a reason. Node selection alone does nothing. `SUPPORTED` remains scoped to the available evidence and never means automatic whole-vehicle certification. The presentation belongs in the existing hypothesis/progress area rather than a new large panel.

## 8. Information-presentation correction

The design no longer proposes a separate `WHOLE VEHICLE · REFERENCE ARCHITECTURE` surface. Canonical Registry content updates the existing investigation map, nodes, Inspector, interfaces, requirements, and path explanations in place.

Existing information remains visible. Guidance uses `PRIMARY_FOCUS`, `CONTEXT`, and `BACKGROUND` hierarchy instead of hiding material behind toggles. It scrolls an exact target into view, marks it precisely, avoids covering it, and waits for the player's `다음` action. The guide asks the reasoning question and explains why the information matters without exposing the answer.

Page 3 contains one Test Design Technique presentation and one ordered verification workflow. Duplicated explanation/picker content is removed from the intended design.

## 9. Penalty and reward structure

- Unsupported conclusions: explicit configurable time penalty plus return to the missing reasoning step.
- Incorrect repair: real failed verification plus retry; no silent healthy variant.
- Hints/solution: completion remains possible but is recorded as `ASSISTED`.
- Diagnostic achievement: conclusion support, evidence sufficiency, independent/assisted status.
- Driving achievement: checkpoint-valid finish, time, and separately scoped personal best.

No game threshold is presented as an engineering requirement.

## 10. Repair and return-to-race behavior

Only executable repair variants may be offered. Selecting a button is not success: the actual variant must be applied and verified. On success, incident time stops, the same mission is restored using a safe-return contract, the captured incident stays consumed, and the player resumes with a short countdown. On failure, the vehicle is not silently healed and the player can retry.

## 11. Optional clean rematch

After the incident race is completed, the player may choose a clean rematch using the verified repaired variant. This is optional and uses a different mode/rules-version record so its personal best is not compared with an incident-interrupted mission.

## 12. Environmental and future-case strategy

P0 keeps the current map and CASE-PT-001. Future route, weather, visibility, or objective variation is allowed only when executable runtime behavior and assets support it. No environmental dressing may imply nonexistent sensors, requirements, signals, or faults. New cases require canonical engineering truth and are outside this MVP correction.

## 13. Priority summary

### P0

- Natural race opening without reproduction instructions.
- Valid incident capture and visible race-time continuity.
- Rapid Diagnosis using existing Pages 1–4.
- Existing architecture content updated in place; no extra overview panel.
- Evidence-backed suspects.
- One verification-technique presentation and one workflow.
- Player-paced focus guidance with complete cleanup.
- Executable repair verification and same-race return.
- Position-based finish and separated result.
- Assisted/retry paths and full regression/browser validation.

### P1

- Playtest tuning, optional clean rematch, richer event-driven reactions, and honest evaluation of real degraded continuity.

### P2

- Canonical additional cases, supported environment variety, and reward/cosmetic foundation.

### Deferred

- Invented faults/signals, fake live motion, complete map replacement, large art pipeline, online systems, new investigation pages, parallel architecture dashboards, and duplicate verification content.

## 14. Actual implementation constraints and open decisions

Observed constraints:

- Current runtime pauses and locks the vehicle after capture.
- Current incident trace and evidence are real and must remain unchanged.
- Existing Pages 1–4 already contain the required engineering tools.
- Existing recovery/checkpoint/result foundations should be reused.
- The currently added architecture panel and duplicate technique presentation are implementation defects to correct only in a separately authorized implementation pass.

Open implementation decisions:

1. Which monotonic source owns `incidentElapsedMs`, including background-tab semantics?
2. What exact formula and labels compose final mission time without changing simulation time?
3. Which safe pose, orientation, and velocity restore the same mission after repair?
4. What configurable penalties survive playtesting?
5. How are clean-rematch records versioned separately from incident-race records?

Final gate: `GAMEPLAY_MVP_CORRECTED_WITH_IMPLEMENTATION_DECISIONS`.
