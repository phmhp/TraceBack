# TRACKBACK Architecture Correction Revalidation

> Version: 0.3  
> Status: REVIEWED_DRAFT  
> Canonical: NO — canonical v0.3 audit evidence  
> Date: 2026-10-10  
> Gate: ENGINEERING_READY_WITH_REWORK  
> Phase 08 Recommendation: PROCEED_WITH_CONSTRAINTS

## 1. 재검증 범위와 판정

Corrected canonical documents를 기준으로 74 LF, critical authority conflicts, 111 signal semantics, 49 interface semantics, 148 architecture-affected requirements, Phase 07.6 48 scenarios, 기존 18 counterexamples, 34 cases를 논리 재검증했다. runtime test와 runtime source는 실행하거나 변경하지 않았다.

| 항목 | 결과 |
|---|---|
| LF | `VALIDATED 10 / VALID_WITH_OPEN_DECISION 30 / REWORK_REQUIRED 9 / UNVERIFIED 25` |
| Architecture issues | active `P0 0 / P1 22 / P2 6`; 10개 issue는 architecture correction으로 closed |
| CORE_ARCHITECTURE_BLOCKER | **0** |
| Remaining DOMAIN_DESIGN_BLOCKER | **9** — 모두 P1 open/external-validation gate |
| Signal | 111/111 `semanticKind` review 완료; ID change 0 |
| Interface | 49/49 relation review 완료; ID change 0 |
| Requirement | 180/180 parse, 148 affected review, 53 statement correction, owner TBD 62 |
| Scenario | 48/48 re-evaluated |
| Counterexample | 18/18 re-evaluated |
| Case | 34/34 architecture compatibility review; approval promotion 0 |

## 2. 74 LF 재판정

### VALIDATED — 10

`LF-GEAR-INTERLOCK`, `LF-GEAR-STATE`, `LF-PROP-ACQ`, `LF-PROP-INTERP`, `LF-PROP-GEN`, `LF-PROP-OUT`, `LF-PROP-EDRV`, `LF-EXE-CLOCK`, `LF-ACT-DRIVE`, `LF-PLANT-MOTION`.

### VALID_WITH_OPEN_DECISION — 30

`LF-DRV-ACQ`, `LF-DRV-VALID`, `LF-ENV-STATE`, `LF-VS-INIT`, `LF-VS-PERM`, `LF-GEAR-ACQ`, `LF-PROP-STA`, `LF-PROP-LIM`, `LF-BRK-ACQ`, `LF-BRK-DEMAND`, `LF-BRK-COORD`, `LF-BRK-CMD`, `LF-STR-ACQ`, `LF-STR-DEMAND`, `LF-STR-ACT`, `LF-STB-COORD`, `LF-ADAS-ACC`, `LF-ADAS-LKA`, `LF-MC-REQ`, `LF-MC-AUTH`, `LF-MC-LON`, `LF-MC-ALLOC`, `LF-SEN-MOTION`, `LF-SEN-ACT`, `LF-FM-OBS`, `LF-COM-PORT`, `LF-EXE-RECORD`, `LF-ACT-BRAKE`, `LF-ACT-STEER`, `LF-PLANT-ENV`.

### REWORK_REQUIRED — 9

`LF-BRK-BLEND`, `LF-STR-COORD`, `LF-STB-ABS`, `LF-STB-TCS`, `LF-STB-ESC`, `LF-ADAS-AEB`, `LF-MC-LAT`, `LF-EN-LIMIT`, `LF-FM-REACT`.

이 9개는 공통 hierarchy/owner 모순이 아니라 domain freeze 전에 필요한 external engineering decision이다. Phase 08 schema는 이를 `OPEN/EXTERNAL_VALIDATION_REQUIRED`로 표현해야 한다.

### UNVERIFIED — 25

`LF-VS-MODE`, `LF-VS-FAULT`, `LF-GEAR-REACT`, `LF-PROP-MON`, `LF-PROP-REACT`, `LF-PROP-REC`, `LF-BRK-STATE`, `LF-BRK-FDBK`, `LF-STR-STATE`, `LF-STR-MON`, `LF-ADAS-COMMON`, `LF-MC-MON`, `LF-SEN-QUALITY`, `LF-EN-READY`, `LF-EN-MON`, `LF-OCC-IMPACT`, `LF-OCC-DECIDE`, `LF-OCC-DEPLOY`, `LF-FM-DETECT`, `LF-FM-REC`, `LF-FM-DIAG`, `LF-COM-NET`, `LF-COM-SUP`, `LF-EXE-SCHED`, `LF-EXE-SUP`.

## 3. Architecture issue 재판정

기존 38개 architecture issue 기준에서 active severity는 `P0 0 / P1 22 / P2 6`이다. P0를 단순 삭제하지 않고 다음과 같이 해소 또는 명시적 gate로 전환했다.

- `P0-01` common final longitudinal authority: **CLOSED**. Reference Motion Coordination owner와 domain command owner가 분리됨.
- `P0-07` ACC/AEB/LKA output-level mixing: **CLOSED AT COMMON SCHEMA LEVEL**. `controlOutputKind` 도입; feature priority는 별도 OPEN.
- 나머지 9개 former domain blockers는 P1 `OPEN/EXTERNAL_VALIDATION_REQUIRED`로 유지: `P0-02`, `P0-03`, `P0-04`, `P0-05`, `P0-06`, `P0-08`, `P0-09`, `P0-10`, `P0-11`.
- Requirement maturity, oracle, safety lifecycle blocker는 gate가 명시되어 P1이며 registry approval/runtime adoption은 계속 차단.
- Actual actuator feedback 부재는 P2 implementation gap이며 architecture schema 자체를 막지 않음.

따라서 `CORE_ARCHITECTURE_BLOCKER=0`, `Remaining DOMAIN_DESIGN_BLOCKER=9`다.

## 4. Signal semantic 재검증 — 111

| semanticKind | 수 |
|---|---:|
| ACTUAL | 1 |
| AVAILABILITY | 9 |
| COMMAND | 8 |
| CONSTRAINT | 10 |
| DEMAND | 6 |
| ESTIMATE | 6 |
| FEEDBACK | 15 |
| GROUND_TRUTH | 6 |
| PERMISSION | 3 |
| QUALITY | 2 |
| REQUEST | 13 |
| SETPOINT | 7 |
| STATE | 8 |
| STATUS | 10 |
| VALIDITY | 7 |
| **합계** | **111** |

모든 signal ID는 보존됐다. 33개는 external validation, 12개는 exact quantity open, 95개는 reference design-only다. 이는 semantic class가 없다는 뜻이 아니라 physical realization 또는 domain policy가 미승인이라는 뜻이다.

## 5. Interface semantic 재검증 — 49

- logical interface review: 49/49.
- current runtime transfer: 7.
- endpoint observation point: 1.
- comparison capable: 1 (`IFC-DESIGN-005`).
- external validation required: 16.
- CAN/independent ECU/network timing claim: 0.
- duplicate/dangling interface ID: 0.

`IFC-DESIGN-033`은 `LF-MC-ALLOC → LF-PROP-OUT;LF-BRK-COORD`의 vehicle-level domain allocation이며 final actuator command가 아니다. `IFC-DESIGN-017`은 braking-domain allocated objective, `IFC-DESIGN-024`는 typed stability constraint, `IFC-DESIGN-035`는 Energy constraint다.

## 6. Requirement 재검증

- 180/180 CSV parse 성공.
- 148 architecture-affected requirements에 v0.3 decision metadata 적용.
- 53 statements를 responsibility/level 관점에서 교정.
- stable Propulsion/Gear 32개 baseline 보존.
- `SW_OWNER_TBD 62`: `BLOCKED_BY_OPEN_DECISION`; approved/frozen 0.
- safety lifecycle: 전부 `PENDING_NOT_APPROVED`; Fault Case로 safety approval를 생성한 relation 0.
- Trace ID, relation 및 TC endpoint는 보존.

## 7. 48 cross-domain scenario 재검증

| Post-correction status | 수 | 의미 |
|---|---:|---|
| VALIDATED / CURRENT_NARROW_SCOPE | 10 | 기존 narrow runtime 또는 명시된 stimulus/clock 범위에서 유효 |
| VALID_WITH_OPEN_DECISION | 18 | common owner/schema는 일관되며 exact domain policy가 OPEN |
| REWORK_REQUIRED | 12 | ABS/blending/lateral/AEB/fault-reaction 등 domain decision 필요 |
| UNVERIFIED | 8 | runtime/sensing/diagnostic/multi-rate/network capability 부재 |
| **합계** | **48** | |

재분류는 runtime 동작 변경을 뜻하지 않는다. 특히 current host brake-over-drive scenario는 `CURRENT_RUNTIME_POLICY` characterisation으로만 남는다.

## 8. 18 counterexample 재검증

| 결과 | 수 | 주요 항목 |
|---|---:|---|
| RESOLVED_ARCHITECTURALLY | 8 | authority/allocation, typed constraints, readiness/permission, command/actual, truth/estimate, diagnostic state separation, transport non-claim, unique brake command owner |
| VALID_WITH_OPEN_DECISION | 6 | AEB/ABS/lateral priority, gear applied semantics, SWR allocation 등 |
| UNRESOLVED_NON_CORE | 4 | executable oracle, actual actuator feedback, multi-rate timing, repair/replay oracle |
| **합계** | **18** | |

남은 항목은 common schema contradiction이 아니라 domain approval, implementation 또는 oracle gate다.

## 9. 34 case compatibility 재검증

| Status | 수 |
|---|---:|
| COMPATIBLE_CURRENT_CANONICAL | 1 (`CASE-PT-001`) |
| BLOCKED_BY_DOMAIN_DESIGN | 19 |
| BLOCKED_BY_ORACLE | 13 |
| BLOCKED_BY_IMPLEMENTATION | 1 |
| NEEDS_REWORK | 0 |
| **합계** | **34** |

33개 candidate case는 계속 `AI_DRAFT`다. Case approval, root-cause provenance, oracle authority, playable behavior를 새로 만들지 않았다.

## 10. Repository safety / integrity

Canonical interface/requirement/verification/case 디렉터리의 CSV 13개를 파싱했다.

| Check | Result |
|---|---:|
| CSV parse error | 0 |
| Duplicate primary ID | 0 |
| Dangling LF/Requirement/TC/Case reference | 0 |
| Orphan LF | 0 |
| Orphan Requirement | 0 |
| Orphan TC | 0 |
| Orphan Case | 0 |
| Invalid requirement relation direction | 0 |
| Missing local Markdown link | 0 |
| README/MANIFEST count mismatch | 0 |
| Runtime files changed by this pass | 0 |

74개 `functionKind` mapping은 baseline 74 LF와 exact set match하며 missing/extra가 0이다.

## 11. Final gate

**Final Engineering Gate: `ENGINEERING_READY_WITH_REWORK`**

근거:

- common hierarchy와 area/entity kind가 명시됨.
- vehicle-level final longitudinal authority와 domain final-command owner가 명시됨.
- Vehicle State availability/permission/reset/recovery contract가 분리됨.
- critical signals가 typed semantic vocabulary를 사용함.
- unresolved domains를 truth로 고정하지 않고 OPEN/external-validation로 표현 가능함.
- SWR owner gate가 존재함.
- runtime/reference distinction이 유지됨.
- Phase 08 schema가 unresolved design을 승인된 behavior로 오인하지 않고 표현할 수 있음.

**Phase 08 Recommendation: `PROCEED_WITH_CONSTRAINTS`**

제약: Phase 08은 schema/registry representation에 한정해 시작할 수 있다. 9개 domain blocker, 62개 SW owner, oracle/safety/implementation gate를 자동 승인하거나 runtime adoption으로 해석하면 안 된다. 이번 pass에서는 Phase 08을 시작하지 않았다.

