# TRACKBACK — Phase 03 문서 정합성 감사 v1.0

**감사 범위**: `Requirement.md`(통합 명세 v2.0), `00_TRACEBACK_MASTER.md`(사례 작성 규칙), `TRACKBACK Propulsion Reference Requirements v0.1.md`, `01_REFERENCE_ARCHITECTURE_KO.md`, `02_DOMAIN_FUNCTION_DECOMPOSITION_KO.md`, `03_INTERNAL_LOGIC_STATE_MACHINE_KO.md`, `03_B`~`03_G`, `03_PHASE03_COMPLETE_KO.md`, `VERIFICATION_WORKBENCH_CAPABILITY_AUDIT.md`, `PRODUCT_REQUIREMENTS_RECONCILIATION.md`.

**범위 제한**: 이 감사는 **제공 문서 간 정합성**과 공학적으로 검증이 필요한 설계 가정을 점검한다. 전체 로컬 저장소의 최신 C/WASM·TypeScript 코드, 헤더, 빌드 아티팩트, 실행 결과 원시 파일을 제공받지 않았으므로 **코드 정합성 감사/실차 적합성 검증은 아직 수행되지 않았다**. 이전 Codex 보고는 검증이 아니라 `CODEX_REPORTED`로 인용한다. 본 문서는 어떤 논리도 `APPROVED`로 승격하지 않는다.

## A. 감사 결론

- 16개 분석 영역, 74개 `LF-*` 기능 ID는 Phase 02/03에서 **목록·설계 책임 수준으로 대응**한다. **상세 실행 알고리즘 74개가 검증되었다는 뜻은 아니다.**
- 대부분의 문서는 Reference/Runtime의 구분, Fault Injection/Defect/Detection의 구분, 자동 Expected 금지를 적절히 지키고 있다.
- **조건 우선순위, 상태전이 누락, 단위·좌표계, alias 의미, 시스템 요구사항과 SW 요구사항의 추상화 차이, timebase와 물리적 관찰의 독립성**이 여전히 Open이다.
- Phase 04에서는 실제 코드로 재확인하기 전까지 기존 Signal 이름을 변경하거나, 제안 신호에 실제 수치·단위·Valid Range·CAN 속성을 단정하면 안 된다.

## B. 감사 기준

| 구분 | 의미 | 승인/조치 |
|---|---|---|
| `DOCUMENT_CONFIRMED` | 문서 원문에서 해당 문장/정의 존재 확인 | 문서 존재는 기술적 진실이나 코드 구현을 보증하지 않음 |
| `CODEX_REPORTED` | 이전 수행 보고에 나온 런타임 동작 | 실제 소스·데이터 대조 필요 |
| `PROPOSED` | TRACKBACK 참조 설계를 위해 새로 권고 | 승인 전 기대값·PASS/FAIL 금지 |
| `OPEN` | 출처·조건·구현 미확인 | 빈 값 유지, 검증 제한 |
| `CONTRADICTION` | 두 정의가 직접 충돌하거나 같은 단어를 상이하게 사용 | 명시적 소유권/정규화 의사결정 필요 |

**우선순위**: P0=Phase 04 승인·코드 연동의 선결 조건, P1=설계 충실도 및 확장 핵심, P2=이후 case·UX 확장 때 해결 가능.

## C. 핵심 발견 및 정정 권고

| ID | 우선 | 문서 근거(확인 대상) | 점검 결과 | 정정·결정 요구 | 상태 |
|---|---|---|---|---|---|
| A01 | P0 | `01` §5~6, Propulsion v0.1 §4~6, `Requirement.md` §13 | 참조 v0.1은 Torque Generation 뒤에 Motion Arbitration을 두지만 현재 VMC 역할에는 Torque Generation도 포함. 책임/배치 경계 중복 위험 | `논리 기능 소유권`과 `실제 함수 책임`을 분리. 실제 VMC C 엔트리·I/O 확인 전 중복 계산 단계 삽입 금지 | OPEN |
| A02 | P0 | `01` §6, `03` §3.11, v0.1 §3~6 | `DriverDriveDemand`, `PropulsionRequest`, `RequestedDriveTorque`, `DriveTorqueRequest`, `LimitedDriveTorque`, `DriveTorqueCommand`는 의미·처리 단계가 달라 alias 규칙 부재 | **신호 ID별 정량 의미·단위·소유권**과 변환 경계 제시 전 동의어 금지 | OPEN |
| A03 | P0 | `03_F` F0/F1, `01` §6 | `EDriveCommand`와 `DriveForce`, `ActualDriveTorque` 혼동 가능. eDrive 출력이 실제 모터 토크의 독립 측정값이라는 근거 없음 | SW/adapter/Plant의 개별 Port 및 변환 규칙 구분. `ActualDriveTorque` 물리 계측 소스 확보 전 미지원 | OPEN |
| A04 | P0 | `Requirement.md` §24, `01` §10, `03_E` E3 | 60Hz physics =16.667ms, 참조 VMC/CAN 10ms·AEB20ms는 예시. 하나의 tick를 모두 task 실행으로 해석하면 물리·시간 오류 | multi-rate Scheduler 별도, event timestamp 정의, 현재는 60Hz 공통 tick 정보만 인정 | OPEN |
| A05 | P0 | v0.1 `SWR-PROP-STA-001/002`, `03` §3.1 | OFF→READY, READY→ACTIVE 조건은 명시됐으나 반대 방향·조건 해제·0 요구·기어 변경·동시 Fault 우선순위 없음 | 불명확한 ELSE/invalid 처리 전체 `OPEN`; State table을 완료로 표시 금지 | OPEN |
| A06 | P0 | v0.1 `SWR-PROP-IN-001/002`, `03` §3.2, `03_B` B1 | `AcceleratorPedalValid=FALSE`는 `DriverDriveRequestValid=FALSE` 요구까지만 근거. 출력 0/hold/torque inhibit은 미정 | 정상·invalid 입력 분기 뒤 downstream 정책은 별도 SWR·시뮬레이션 구현 검토 | OPEN |
| A07 | P0 | v0.1 §Monitoring, `03` §3.8, `03_E` E1 | `deviation <= tolerance` 시 NO_FAULT만 기술. `>`에서 pending/confirmed, debounce, 발생 시점, 복귀 트리거가 정의되지 않음 | 단순 편차 계산과 Fault Detection/Confirmation/Reaction/Recovery를 별개 객체로 분리 | OPEN |
| A08 | P0 | v0.1 `REA-001/002`, `03` §3.9 | Degraded 시 토크 `<= DegradedTorqueLimit`만으로 signed reverse torque, magnitude, negative limit 의미 미정. 50Nm은 예시 | 방향·부호·단위·물리 torque magnitude 정책과 fault reaction guard 승인 후 TC 구성 | OPEN |
| A09 | P1 | v0.1 SYS/SWR 전반, `01` §11 | SYS와 SWR이 사실상 동일 guard/상태값을 반복. System 관측 결과와 SW 구현 동작 할당 경계 모호 | Phase 05에서 SYS 차량수준 결과, SWR 할당된 처리·출력으로 단계별 refinement | OPEN |
| A10 | P0 | `Requirement.md` §53 `Case별 최소: SG/FSR/TSR/SSR`, 같은 문서 §8/§29, `00_TRACEBACK_MASTER.md` | **명세 내부 충돌**: 모든 Case에 안전 계보가 필수처럼 표기 vs HARA가 있는 사례만 안전 주장 가능 | 모든 Case 필수는 functional requirements/verification trace; SG/FSR/TSR은 HARA 관련 case 한정으로 정정 제안 | CONTRADICTION |
| A11 | P0 | `01` §9, `03_E` E2, Capability Audit §Still Unsupported | Source·Consumer 구조의 동일 객체 재독기는 독립 endpoint telemetry 아님. Runtime endpoint는 보고 기준 미지원 | Port ID, generated/received event, copied value, matched tick rule이 증명되어야 interface comparison 가능 | OPEN |
| A12 | P0 | `Requirement.md` §14·§26, `03_E` E2 | Virtual Motion CAN-FD가 참조 명세에 있으나 실제 메시지/전송 네트워크·DBC·버스 이벤트가 없음 | Network signal·CAN ID·cycle·timeout은 **미구현/미정**. 내부 SW Port에서 CAN TX/RX 생성 금지 | OPEN |
| A13 | P1 | `03_B` B2·B3, v0.1 §State | `GearRequest`, accepted state, applied `GearState`, eDrive direction, `DriveEnable`, VehicleReady 의미가 섞일 위험 | owner 분리, gear D enum/`DRIVE` 문서 표기 간 매핑 명시 전 동일시 금지 | OPEN |
| A14 | P1 | `03_B` B4, `03_C` C2/G, `03_G` G3 | 제동 요구 Arbitration이 Braking과 VMC 양측에, limiting이 Propulsion과 MC 양측에 있어 이중 제어·명령 합산 위험 | **request priority owner**와 **actuator limit owner** 단일 결정점을 정의. 출력 합산은 물리 의미 일치 때만 | OPEN |
| A15 | P1 | `03_B` B4/B5, `03_F` F1 | Driver brake/steering → physics 지원과 독립 Brake SW/EPS 존재가 구분되어 있지만 UI에서 실행 가능한 Function으로 잘못 승격될 가능성 | 실행/관측 능력은 per-boundary로 명시. physics path와 Brake/EPS SW path 분리 | OPEN |
| A16 | P0 | `03_D` D2, `03_F` F1 | 속력 `m/s` vs signed longitudinal velocity, world X/Z vs vehicle longitudinal, yaw/rad·steer normalized 혼동 위험 | 각 Signal에 coordinate frame, sign, measurement kind, conversion owner 필수 | OPEN |
| A17 | P1 | `03_C` C1, `03_D` D2, `03_F` F1 | ABS/TCS/ESC는 wheel/slip/yaw/steering 센서 등의 관측 근거가 없음 | reference-only. 실제 Plant 계산값을 독립 sensor feedback이라고 포장 금지 | OPEN |
| A18 | P1 | `03_D` D1, `03_F` F2 | AEB/ACC/LKA/Occupant에 입력 추정/가용성·판정 전이 후보는 있으나 기준·알고리즘·안전 근거 없음 | 실행 불가; AEB TTC 단순식은 직선 closing 등 제한된 개념일 뿐 일반 oracle 아님 | OPEN |
| A19 | P1 | `03_E` E0/E1, `Requirement.md` §28 | injected fault→observed deviation→detected fault→confirmed fault→degraded 상태를 한 플래그로 묶을 위험 | stimulus, hidden defect, observable failure, diagnostic detection, reaction, recovery 6축 분리 | DOCUMENT_CONFIRMED 지침 유지 |
| A20 | P1 | `03_E` E3, `Requirement.md` §40 | reset/replay는 물리만이 아니라 SW, held sample, traffic, logical scheduler, queue, injector까지 포함해야 함 | 실행된 domain에 대한 reset boundary 및 snapshot coverage 매트릭스 요구 | OPEN |
| A21 | P1 | `Requirement.md` §32/38/54, `03_G` G9 | 등록 TC는 참조 TC와 실제 executable C/WASM TC가 분리돼야 한다. 요구사항과 직접 연결했다고 Expected를 자동 생성할 수 없음 | TC authoring/approved oracle/runtime support 별 상태와 실제 근거 유지 | OPEN |
| A22 | P1 | `03_B` B1, `03_G` G8, `01` §8 | 입력 `validity`/`quality`/`freshness`/`applicability`/`expected`가 섞일 위험 | value validity ≠ time freshness ≠ requirement applicability ≠ behavioral correctness 별도 판정 | OPEN |
| A23 | P2 | `02` §4/§5, `03` 전편 | LF 목록의 74개 ID는 존재하나 많은 Subfunction은 책임 후보만 있고 IF/ELSE/표준 출처/수치 모델이 없다 | `목록 검토 완료`와 `구현 가능한 논리 완료`를 별개 완성도로 표기 | DOCUMENT_CONFIRMED |
| A24 | P2 | `03_G` G6, `Requirement.md` §33~35 | 같은 공통 graph로 UI를 제공하더라도 hidden fault cause, private case oracle, player discovery state를 분리해야 한다 | Projection/Query API에서 visibility entitlement 분리 | OPEN |
| A25 | P1 | `03_F` F1, `03_D` D2 | Rapier의 Force·Speed·Acceleration 관찰만으로 정상 차량 reference trajectory를 생성할 수 없음 | 차량-level no-oracle=OBSERVED 유지; case별 승인된 criterion 없으면 FAIL 금지 | DOCUMENT_CONFIRMED 지침 유지 |
| A26 | P1 | `03_C` arbitration, `03_B` braking, `03_D` ADAS | AEB 제동 요구, ABS 제동 제한, ESC 안정화 요구, 운전자 제동 요구가 동시 발생하는 경우 우선순위 정책 없음 | 상황별 권한·제약·fault 대응의 데이터 계약 필요, 특정 우선순위는 승인 전 미정 | OPEN |

## D. 단계 진입 게이트

### 현재 통과 가능한 항목

1. Domain/LF 16/74 카탈로그 *존재* 여부: 정적 문서 기준 확인 가능.
2. 정상·고장·검증 개념 구분을 위한 의도된 설계 경계: 대체로 정리됨.
3. Phase 04에서 사용할 후보 관계와 관심 포트: 목록 작성 가능.

### 통과 불가 / 아직 승인 보류

- 실제 LF별 producer/destination 포트 및 source source-level type, sample time, offset 계산식: **코드 직접 확인 전 보류**.
- 현재 `VMC`/`eDrive` source payload의 자료형, signedness, C/WASM port 변환: **최신 코드 필요**.
- reference states/transitions의 complete decision table: **missing-policy OPEN**.
- 실제 network, sensor, ECU, safety mechanism, physical `ActualTorque`: **근거 없음**.
- 새로운 full vehicle `PASS/FAIL`, fault-detection/recovery·timing 성능 보증: **oracle 없음**.

## E. 정정 제안 (원문 임의 수정하지 않음)

- `Requirement.md` 53절 'Case별 최소 SG/FSR/TSR/SSR' 문구를 **Safety-relevant Case에서 수행된 HARA에 따른 추적성**으로 제한할 것.
- v0.1의 `50 Nm`, `120 Nm`, `300 Nm`, `20%`는 예시 TC Calibration으로 유지하고 런타임 calibration/검증 expected에 자동 반영하지 말 것.
- `Vehicle State` 등 공통 상태를 모든 domain의 mandatory serial stage로 취급하지 않을 것.
- UI 용어는 **사용자 설명명**과 **canonical technical signal ID**를 분리. `GearState` 설명 추가하더라도 이름 바꾸지 말 것.
- `Source→Boundary→Destination` 관계는 구조 데이터로 표시 가능. 비교/판정은 별도 ObservedEndpointPair + comparison criterion가 필요.

## F. 독립 검증을 위한 증빙 요청 최소셋

`PROJECT_CODE_SNAPSHOT.zip` 하나에 소스/문서/테스트를 압축한다. `.git`, `node_modules`, `dist`, `build`, `.cache`, 비밀키·토큰·자격증명·고객사 기밀은 제외한다. `package.json`, lockfile, 관련 TS/C/C header, `src/runtime`, `src/ui`의 관련 파일, `docs`, `test(s)` 포함. 보안·권리 확인 후 보내고, 소스 공유가 어렵다면 Codex가 로컬에서 독립 감사해 **코드 경로·줄 번호·실측 테스트 로그**를 산출하도록 한다. 원본 전체를 다시 보내는 것은 필요하지 않다.

## G. 완료 판정

**문서 간 정합성 감사: 1차 완료(조건부). 최신 실행코드 검증: 미완료.** 이 상태에서 Phase 04는 **설계 초안**으로 진행할 수 있으나 정규 Signal Dictionary 승인·실제 Interface Comparison 활성화·고장 주입 경계 코딩은 후속 코드 감사 후 진행해야 한다.

## H. 추가 검토 — 순환 호출·제약 산출 구조

| ID | 우선 | 관찰 | 위험 | 해결 방향 |
|---|---|---|---|---|
| A27 | P0 | `03_B` Steering coordination ↔ `03_C` Motion lateral coordination에 양방향 결과 전달 후보 | 같은 시각에 서로 결과를 입력하는 **algebraic loop** 및 제어권 소유권 중복 가능 | 현 Phase 04는 Steering 요구→Motion coordination→Allocation의 단방향 결정을 택하고, 별도 feedback을 원하면 *다음 tick 관측 데이터*로 모델링. 특정 Control Request의 최종 owner는 승인 전 OPEN |
| A28 | P1 | Braking Regen Blend의 요청이 Energy Limit의 입력이며 limit이 다시 Blend에 돌아올 수 있음 | capability 공급자와 request consumer 구별 실패 시 순환 참조·시간 일관성 붕괴 | Energy capability limit은 외생적인 battery/motor state에서 산출하고, Regen Request는 downstream allocation/actuator에서 검증; 같은 tick 직접 요구/한계순환 금지 |
