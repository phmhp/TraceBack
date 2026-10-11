# 권고 수정안

이 문서는 후속 구현 순서를 제안한다. 이번 감사에서는 어떤 코드, 요구사항, Ground Truth, runtime도 변경하지 않았다.

## 1. 의사결정 요약

| 영역 | 권고 | 이유 |
|---|---|---|
| 현재 C/WASM propulsion chain | **유지** | 실제 실행·시험 근거가 가장 강함 |
| Rapier arcade plant | **유지** | 게임 vehicle response와 current TC에 필요; 실차 plant claim만 제한 |
| 60 Hz fixed simulation loop | **유지** | deterministic game runtime으로 유효 |
| 74 LF reference model | **유지** | coverage/확장 방향으로 유용; 구현 catalog와 분리 필요 |
| VMC 명칭·책임 표시 | **수정** | propulsion torque generation과 motion coordination 혼동 제거 |
| VehicleReady/PropulsionEnable ownership | **수정** | host lifecycle을 vehicle permission으로 오인 방지 |
| brake-over-drive priority | **수정** | adapter의 숨은 control authority 제거 |
| requirement/calibration 승인 metadata | **수정** | TRACKBACK internal approval와 engineering approval 분리 |
| signal/interface capability metadata | **수정** | candidate/registry/observed/executable 구분 |
| TC canonical detail | **수정** | TC-001~005 placeholder와 automation 이원화 해소 |
| timestamp contract | **수정** | pre/post tick 시점 불일치 제거 |
| 독립 Brake/Steering/Stability/ADAS/Energy/Occupant SW | **보류** | 현재 episode 범위와 근거가 부족함 |
| multi-rate ECU/network scheduler | **보류** | task/network 요구사항과 timing contract가 먼저 필요 |
| 실제 차량 안전/양산 claim | **보류** | HARA, calibration provenance, validated plant가 없음 |

## 2. Correction Gate 0 — Ground Truth와 capability 의미 고정

**우선순위:** P0  
**목표:** 이후 기능 추가 전에 “무엇이 실제인가”를 machine-readable하게 고정한다.

### 권고 작업

1. 요구사항 승인 상태를 최소 다음 축으로 분리한다.
   - statement status: TRACKBACK model 내 승인 여부
   - calibration status: review/approved
   - implementation status: design-only/partial/implemented
   - verification status: reference/automated/workbench-executable
2. 74 LF에 `runtimeCapability`와 actual owner를 부여하되 본 감사의 5/27/42 판정을 초기 baseline으로 사용한다.
3. `Architecture.ts`의 registry edge를 `STRUCTURAL`로 명명하고 endpoint capability를 별도 필드로 둔다.
4. TC-001~005의 canonical precondition/stimulus/observation/expected를 Ground Truth에 완성하거나 링크를 제거한다.
5. TC-011/012는 repository automated test와 player workbench status를 별도 표시한다.

### 완료 기준

- `APPROVED`라는 한 단어로 statement, calibration, implementation, verification을 동시에 표현하지 않는다.
- UI와 report export가 `DESIGN_ONLY` LF를 executable로 표시하지 않는다.
- 모든 linked TC가 canonical detail을 갖거나 명시적 unresolved 상태다.
- 111 signal/49 interface candidate의 status가 현재 source와 자동 대조 가능하다.

## 3. Correction Gate 1 — 제어권과 Function allocation 정리

**우선순위:** P0  
**목표:** torque generation, limitation, arbitration, plant conversion의 owner를 겹치지 않게 한다.

### 권고 구조

```text
Propulsion Interpretation
  -> Propulsion Torque Generation (현재 Trackback_VMC 계산)
  -> eDrive Directional Limitation
  -> Host Arbitration Policy (현재 brake-over-drive 정책의 명시적 owner)
  -> Simulation Torque-to-Force Adapter
  -> Rapier Plant
```

### 권고 작업

- 실행 `VMC`의 semantic label을 `Propulsion Torque Generation`으로 제한한다.
- 전체 `Vehicle Motion Coordination`은 계속 `DESIGN_ONLY`로 둔다.
- brake active 시 drive suppression 정책을 named policy/function으로 승격하고 입력·출력·우선순위·근거 requirement를 명시한다.
- `SYSR-PROP-009`의 allocation을 VMC generation과 eDrive limitation chain으로 분리한다.
- VehicleReady/PropulsionEnable은 host assumption이라는 technical name을 사용하거나 실제 state owner를 도입한다. 단순 rename과 state-machine 신설 중 선택은 별도 설계 결정으로 남긴다.

### 완료 기준

- adapter에는 unit/sign 변환 외의 숨은 arbitration이 없다.
- 하나의 command 단계마다 owner가 하나이며 요구사항 allocation이 그 owner와 일치한다.
- `VMC`를 선택해도 UI가 Stability/Brake/Steering coordination 기능을 암시하지 않는다.

## 4. Correction Gate 2 — Signal·Interface 계약 확정

**우선순위:** P1

### 권고 작업

1. 실제 signal마다 다음 필드를 필수화한다.
   - technical ID와 display label
   - data type/shape
   - unit/signedness
   - accepted range와 source-clamped range
   - validity/quality semantics
   - producer/consumer runtime owner
   - clock basis와 sample age
   - endpoint observability
2. accelerator direct-port 정책을 결정한다: out-of-range reject 또는 robust saturation. source range와 component policy를 둘 다 기록한다.
3. `steering`을 normalized demand와 front wheel angle(rad)로 분리한다.
4. `VehicleSpeed(m/s)`와 `speedKmh` monitor를 conversion 관계로 등록한다.
5. eDrive→DriveAdapter 외 interface는 independent endpoint가 없음을 유지하고 “비교 가능”으로 표시하지 않는다.
6. candidate catalog의 확정 사실을 갱신한다: PropulsionRequest producer, EDriveCommand Nm/limits, BrakeForce nominal range. 다만 calibration은 `REVIEW_REQUIRED`를 유지한다.

### 완료 기준

- torque(Nm), force(N), ratio(1), angle(rad), speed(m/s, km/h)가 이름만 보고도 구분된다.
- structural edge와 measured endpoint가 별도 capability로 조회된다.
- `Actual`이라는 단어는 실제 endpoint/plant observation에만 쓰이고 command 또는 expected를 actual로 부르지 않는다.

## 5. Correction Gate 3 — 시간·실행 모델 정합화

**우선순위:** P1

### 현 구조 유지 조건

현재는 다음 하나의 clock만 실행 근거로 인정한다.

```text
SIM_FIXED_STEP_60HZ = 1/60 s
```

VMC 10 ms, AEB 20 ms, CAN 10 ms는 runtime evidence가 생기기 전까지 `DESIGN_ONLY`다.

### 권고 작업

- 각 tick에 monotonically increasing `tickId`, `tickStartTime`, `tickEndTime`을 정의한다.
- C input/output, FI event, endpoint transfer, plant observation이 어느 시점인지 명시한다.
- scenario sample 안에 pre-step event와 post-step plant observation을 함께 넣는 경우 각각 timestamp를 보존한다.
- HUD publish 10 Hz와 SW/physics execution 60 Hz를 분리해 표시한다.
- accelerator raw/source/delivered 값을 별도 signal ID로 기록한다.

### multi-rate를 도입할 경우의 선행 조건

- runnable별 period/phase/deadline/last-run time
- zero-order hold 또는 interpolation 정책
- network queue/latency/drop/timeout 계약
- fault injection event time과 diagnostic detection time 분리
- reset/replay에 scheduler queue와 held sample 포함

이 조건 없이 counter `% n`만 추가해 10/20 ms를 흉내 내는 방식은 권고하지 않는다.

## 6. Correction Gate 4 — Verification·Oracle 정합화

**우선순위:** P1

### 권고 작업

- component oracle 결과에 algorithm source, calibration profile/status, tolerance를 함께 저장한다.
- vehicle scenario의 requirement reference와 executable expected oracle를 분리한다.
- `supportsExpectedOracle:false`인 run은 PASS/FAIL을 만들지 않고 `OBSERVED`를 유지한다. interface equality처럼 실행 criterion이 있는 경우에만 좁은 verdict를 낸다.
- FAIL은 requirement/expected 위반으로만 표현하고 root cause 확정과 분리한다. 현재 문구는 유지한다.
- case answer oracle은 `CANONICAL_GAME_CASE_ORACLE`로 명시한다.
- repair variant 0/2/3은 “실제 수리 방법”이 아니라 candidate code mutation임을 표시한다. 특히 variant 2/3은 saturation 영역에서 baseline과 비동등할 수 있으므로 full regression 결과로만 승인한다 (`c/vehicle_sw/edrive.c:13-20`, `PropulsionCase.ts:206-242`).

### 완료 기준

- 각 PASS/FAIL에 실행 가능한 criterion과 provenance가 있다.
- observation-only run은 자동으로 root cause evidence가 되지 않는다.
- 동일 production C 함수 test seam은 유지되며 oracle 함수와 implementation 함수가 섞이지 않는다.

## 7. Correction Gate 5 — Fault/Recovery 의미 정리

**우선순위:** P1

### 권고 작업

- 현재 injection runtime을 test infrastructure로 유지한다.
- `NORMAL/INJECTING/RESTORED`를 injector lifecycle로 이름 붙인다.
- 향후 diagnostic 기능을 만들 경우 아래를 별도 상태로 추가한다.

```text
physical/injected deviation
→ observation
→ detection
→ confirmation
→ domain reaction
→ recovery guard satisfied
→ recovered
```

- 고장 주입 timestamp, first observable mismatch, diagnostic detection, reaction 적용 시간을 서로 다른 event로 기록한다.
- independent monitor가 없으면 `LF-PROP-MON`, `LF-FM-DETECT`, `LF-FM-REACT`, `LF-FM-REC`를 `DESIGN_ONLY`로 유지한다.

## 8. 보류해야 할 확장

다음은 문서 후보가 있다는 이유만으로 현재 correction pass에 넣지 않는다.

| 보류 항목 | 재개 조건 |
|---|---|
| ABS/TCS/ESC | wheel speed/slip/yaw sensing 및 tire/plant 적합성 |
| ACC/AEB/LKA | perception truth/sensor model, threat/lane criterion, authority policy |
| Energy limits/regen | battery/HV state, torque sign, same-tick dependency 정책 |
| Occupant protection | impact sensing, safety requirements, deployment abstraction |
| CAN/virtual network | message contract, timing/error model, supervision requirement |
| multi-rate ECU scheduler | runnable allocation과 timing requirements |
| full Brake/EPS SW | command shape, actuator feedback, fault/degraded states |

보류는 설계 삭제가 아니다. 현 코드가 해당 기능을 실행한다고 주장하지 않는다는 뜻이다.

## 9. 유지해야 할 회귀 기준

후속 correction에서 다음 현재 동작은 의도적 변경이 아니라면 보존한다.

- P/N propulsion inhibit와 D/R direction
- invalid accelerator/gear의 invalid zero request
- D↔R speed interlock의 현재 TRACKBACK 기준
- VMC direction/validity 보존과 non-negative torque
- eDrive 180/130 Nm directional saturation
- signed direction 변환이 plant adapter에서만 발생
- VehicleSpeed magnitude와 LongitudinalVelocity sign의 독립성
- deterministic fixed-step와 production C component seam
- evidence FAIL이 root cause를 자동 확정하지 않는 semantics

회귀 테스트 통과는 위 좁은 TRACKBACK 계약 보존을 뜻하며 일반 자동차 공학 적합성을 뜻하지 않는다.

## 10. 문서·repository 정리 권고

이번 입력 source는 `docs/reference_vehicle/`, 산출 요청은 `docs/reference-vehicle/audit/`였다. 후속 변경 작업에서 다음 중 하나를 명시적으로 선택해야 한다.

1. underscore 경로를 canonical로 하고 audit도 그 아래로 이동
2. hyphen 경로를 canonical로 migration
3. 두 경로를 유지하되 하나는 generated/read-only mirror로 표시

현재는 사용자의 정확한 산출 경로를 따르기 위해 hyphen path에 보고서를 생성했다. 자동 이동·삭제·rename은 하지 않았다.

## 11. 권고 실행 순서

```text
P0 Ground Truth/capability 분리
→ P0 control-authority 및 VMC allocation 정리
→ P1 signal/interface 계약
→ P1 time basis
→ P1 oracle/fault semantics
→ 기존 추진 회귀 확인
→ 이후에만 보류 도메인 확장 판단
```

이 순서는 TRACKBACK 게임화 설계의 Phase A(조사 의미 구조 안정화)를 우선한다. Mission/Clue/character/repair/reward 레이어보다 vehicle truth와 evidence provenance가 먼저 안정돼야 한다.
