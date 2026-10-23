# Phase 08 Integrated Data Model Proposal

## Recommendation

Use a versioned, typed property graph backed by source-controlled JSON/CSV registries. Pages, reports, and diagrams should query generated read models; they should not own duplicate engineering data. Preserve the current runtime registries until a compatibility adapter and regression gate prove equivalent behavior.

## Entity envelope

Every entity uses this common envelope:

```ts
interface EntityEnvelope {
  id: string
  type: EntityType
  name: { ko?: string; en?: string }
  lifecycle: 'CANONICAL' | 'CANDIDATE' | 'AI_DRAFT' | 'HISTORICAL' | 'SUPERSEDED'
  runtimeStatus: 'VERIFIED' | 'PARTIAL' | 'DESIGN_ONLY' | 'NOT_APPLICABLE'
  approvalStatus: 'APPROVED' | 'REVIEW_REQUIRED' | 'NOT_APPROVED' | 'NOT_ASSESSED'
  visibility: 'PLAYER_INCIDENT' | 'PLAYER_INVESTIGATION' | 'DISCOVERABLE' | 'HIDDEN_TRUTH' | 'AUTHOR_ONLY'
  provenanceIds: string[]
  asOf: string
}
```

Lifecycle, runtime status, approval, visibility, and provenance are independent axes.

## Minimum entities

| Entity | Required domain fields |
|---|---|
| Domain | scope, responsibilities |
| Function | logical role, domainId, completion criteria |
| Subfunction | parentFunctionId, responsibility |
| Component | componentKind (`SWC`, `ADAPTER`, `PLANT_COMPONENT`, etc.) |
| RuntimeOwner | language, artifact, symbol, process/module, current transport |
| Signal | semantic role, data type, unit, range/allowed set, time basis, source class |
| Interface | boundary kind, transport, endpoint observability, comparison capability |
| Requirement | level (`FR`, `SYSR`, `SWR`, `SIMR`), statement, statement status, calibration status |
| TestCase | kind, level, method, techniqueIds, preconditions, stimulus, monitors, oracleId, capabilityId |
| FaultFamily | stimulus/defect/activation category and supported injection points |
| Case | approval, public incident, hidden truth reference, primary/secondary functions |
| Evidence | runner, build, timestamps, actual values, verdict, oracle/provenance, return context |
| Repair | corrected defect, allowed mutations, invariant set |
| Scenario | initial snapshot, environment, driver stimuli, duration, sample period, monitors |
| Oracle | kind, executable rule/reference, tolerance rationale, verdict authority |
| Capability | runner, selectable targets, available methods, instrumentation limits |
| Provenance | source path/URI, hash, revision, authoring class, extractedAt, notes |

Recommended additional entities: `Runnable`, `ECU`, `Calibration`, `ExecutionRun`, `Observation`, and `Decision`. They prevent Component/RuntimeOwner and Evidence from becoming overloaded.

## Typed relations

| Relation | Allowed source → target | Meaning |
|---|---|---|
| CONTAINS | Domain/Function → Function/Subfunction | hierarchy only |
| ALLOCATED_TO | Function/Subfunction/Requirement → Component/Runnable/ECU | responsibility allocation |
| PRODUCES | Function/Component/RuntimeOwner → Signal | semantic production |
| CONSUMES | Function/Component/RuntimeOwner → Signal | semantic consumption |
| TRANSFERS_TO | Interface/Signal endpoint → endpoint | transfer boundary/data flow |
| SATISFIES | Component/Function → Requirement | approved design claim, not test proof |
| DERIVES_TO | Requirement → Requirement | requirement decomposition |
| VERIFIED_BY | Requirement/TestCase → TestCase/Evidence | design link or executed verification, distinguished by target type |
| VIOLATES | Fault/Case/Evidence → Requirement | scoped violation claim |
| PROPAGATES_TO | Fault/Deviation/Symptom → downstream node | causal candidate with provenance |
| OBSERVED_BY | Signal/Interface/Symptom → Evidence/Capability | observation relationship |
| REPAIRED_BY | Defect/Case → Repair | corrective action relation |
| REPLAY_VALIDATED_BY | Repair → Evidence/ExecutionRun | post-repair validation |

Add `CALLS` for actual runtime calls and `DEPLOYED_TO` for RuntimeOwner→ECU/platform. Do not overload `TRANSFERS_TO` or `ALLOCATED_TO`.

## Edge envelope

```ts
interface RelationEdge {
  id: string
  relation: RelationType
  from: string
  to: string
  lifecycle: 'CANONICAL' | 'CANDIDATE' | 'HISTORICAL'
  approvalStatus: 'APPROVED' | 'REVIEW_REQUIRED' | 'NOT_APPROVED'
  runtimeEvidenceIds: string[]
  provenanceIds: string[]
  validFrom?: string
  validTo?: string
}
```

## Command/request/response example

The propulsion chain must use separate IDs, for example:

```text
SIG.PropulsionRequest
SIG.DriveTorqueRequest
SIG.EDriveCommand
SIG.DriveForceCommand
OBS.PlantLongitudinalResponse
```

No alias relation should equate these. `EDriveCommand` may be transformed by an adapter into `DriveForceCommand`; actual response is observed from the plant.

## Timing and transport representation

- `Signal.timeBasis`: `FIXED_SIM_TICK`, `EVENT`, `REFERENCE_PERIOD`, or `UNKNOWN`.
- `RuntimeOwner.period`: current evidence supports `1/60 s` for the integrated loop.
- `Interface.transport`: `DIRECT_TS_CALL`, `WASM_ABI`, `SIMULATION_ADAPTER`, or reference-only `CAN_CANDIDATE`.
- A reference period does not populate runtime period fields.

## Player-visible projections

| Page | Query projection | Excluded data |
|---|---|---|
| Page 1 | incident, public evidence, inputs, conditions, Actual response, high-level requirement | defect/root cause/repair answer; fabricated Expected |
| Page 2 | architecture hierarchy, typed flow, signals, interfaces, requirements, capability limits | hidden case truth; design-only capability presented as available |
| Page 3 | selected context, executable capabilities, TC design, execution evidence | PASS/FAIL without oracle; unexecuted test result |
| Page 4 | player diagnosis, selected evidence, assessment; post-solve disclosure according to policy | pre-solve hidden truth |

Visibility filtering must occur in the query/service layer, not only in UI CSS.

## Validation outputs

Phase 08 should generate: ID uniqueness report, orphan report, illegal-edge report, capability/oracle report, hidden-data leak test, runtime-status report, and a diff against the `PRODUCT_REQUIREMENTS_RECONCILIATION.md` invariants.
