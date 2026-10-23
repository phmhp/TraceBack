# Traceability Gap Report

## Intended chain

```text
Domain -> Function -> Subfunction -> Signal / Interface
       -> Requirement -> Test Case -> Fault Case -> Evidence
       -> Repair -> Replay
```

This is not one homogeneous chain. Each arrow must have a typed direction and provenance.

## Coverage by link

| Link | Current material | Gap / rule |
|---|---|---|
| Domain → Function | 16 domains / 74 LFs | Preserve hierarchy; do not interpret as allocation or implementation |
| Function → Subfunction | Phase 03 narratives | IDs and granularity are not uniformly machine-readable |
| Function/Subfunction → Signal | 111 candidates | Producers/consumers may be design-only; runtime owner must be separate |
| Signal → Interface | 49 candidate boundaries | Boundary existence does not imply endpoint observability |
| Function → Component/SWC/Runnable/ECU | Partial prose/audit mapping | Allocation layers are incomplete; do not collapse SWC, runnable, ECU, or runtime owner |
| Function → Requirement | 222 candidate traces include LF links | Links are draft and require approval/status |
| Requirement → Requirement | FR/SYSR/SWR/SIMR candidate hierarchy | SYSR/SWR near-clones need abstraction/allocation review |
| Requirement → Test Case | 222 draft links | `VERIFIED_BY` design link is not execution evidence |
| Test Case → Evidence | Repository tests and player workbench produce different evidence classes | Runner, oracle, build/calibration, time, and verdict authority are mandatory |
| Fault → Case | Phase 07 taxonomy and candidates | Fault stimulus, defect, activation, deviation, propagation, and symptom must remain separate |
| Case → Evidence | CASE-PT-001 runtime plus policies | Player-visible evidence must not expose hidden ground truth |
| Case → Repair | Candidate corrective actions | Only canonical case truth can authorize a repair; injection disable is not repair |
| Repair → Replay | Policy exists; narrow current recovery behavior exists | Preserve scenario/input/oracle invariants and do not claim broad Phase D completion |

## Requirement audit

- Candidate counts are 32 FR, 74 SYSR, 62 SWR, and 12 SIMR.
- These levels must remain separate. A SYSR states system behavior/responsibility; an SWR must add software allocation/contract detail rather than repeat it verbatim.
- Similar SYSR/SWR statements are `DECOMPOSITION_REVIEW_REQUIRED`, not automatic duplicates.
- The current Ground Truth contains approved TRACKBACK model statements for the narrow propulsion slice. That status must not be propagated to the 180 reference candidates by ID/text similarity.
- No safety lifecycle artifacts have sufficient source evidence for ASIL or safety-requirement approval.

## Test and evidence audit

Canonical `TestCase.kind` must distinguish:

- `REFERENCE_TC`: authored engineering test design, possibly non-executable.
- `AUTOMATED_REPOSITORY_TEST`: Node test source executed outside the player workbench.
- `PLAYER_WORKBENCH_EXECUTABLE`: selectable and runnable with declared capability.
- `OBSERVATION_ONLY`: runner produces measurements but no authorized verdict.
- `INTERFACE_COMPARABLE`: narrow endpoint comparison with explicit capture limits.

Coverage claims (`statement`, `branch`, `MC/DC`) remain unsupported unless an instrumentation result is attached as evidence. Pairwise stays an input-combination technique. Fault injection stays a stimulus facility.

## Fault/case audit

The graph must represent this sequence with separate nodes/edges:

```text
Fault Stimulus -> Fault Activation -> Software Defect exercised
-> First Observable Deviation -> Propagation -> Vehicle Symptom
-> Evidence -> Diagnosis -> Corrective Action -> Replay -> Oracle result
```

CASE-PT-001 is the only archive row marked `EXISTING_CANONICAL_GAME_CASE`. The other 33 candidates remain `AI_DRAFT`. Neither an AI draft nor its proposed corrective action may become hidden canonical truth without review.

## Referential-integrity gates for Phase 08

1. Every ID is unique within an entity type and has a stable namespace.
2. Every edge endpoint exists and the relation permits its source/target types.
3. Hierarchy edges cannot substitute for allocation edges.
4. `PRODUCES`/`CONSUMES` cannot imply requirement satisfaction.
5. `VERIFIED_BY` cannot imply a run or verdict; evidence must identify a runner and oracle.
6. A PASS/FAIL evidence record must reference an executable oracle and its provenance.
7. OBSERVED evidence cannot be upgraded by UI presentation.
8. A runtime status claim must cite current source or execution evidence, with `asOf`.
9. Design-only timing/CAN/sensor claims must be rejected from runtime-capability views.
10. Hidden case truth must never be returned by player-visible Page 1–3 queries.
