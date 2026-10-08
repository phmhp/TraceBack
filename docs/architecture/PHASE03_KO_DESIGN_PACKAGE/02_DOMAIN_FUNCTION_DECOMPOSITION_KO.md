# TRACKBACK — Phase 02 도메인·기능·하위 기능 분해 (한글 검토판)

- 대응 문서: `02_DOMAIN_FUNCTION_DECOMPOSITION.md` v1.0.
- **성격:** 영어 원문에 들어 있는 **모든 Function ID와 Subfunction 기술 식별자**, 주요 역할 및 주의사항을 한국어로 재정리한 **검토용 의역본**. 원문을 문장 단위로 기계적 직역한 판본은 아니다. 빠진 의미나 정확한 용어는 두 문서를 대조해 최종 승인해야 한다.
- 상태: `PROPOSED` — 사람 승인 전 실행 Ground Truth가 아님. 이번 문서 작성으로 구현 코드 수정 없음.

## 0. 원문 출처와 상태

1. `TRACKBACK Propulsion Reference Requirements v0.1.md`: 기존 9개 Propulsion 기능/FR/SYS/SWR/TC의 **참조 초안**.
2. `Requirement.md`: 상위 차량 기능과 ADAS, VMC, CAN-FD, Physics의 **참조 설계**.
3. `00_TRACEBACK_MASTER.md`: 고장 사례 작성 시 실제 출처/참조 가정/승인 상태 분리.
4. `01_REFERENCE_ARCHITECTURE.md`: 동일 개념의 다중 관점과 다대다 관계 유지.
5. Codex 보고: VMC/eDrive 및 Physics 구간 실행. 직접 소스 감사 전까지 `CODEX_REPORTED`.

상태 표시: `SRC_DRAFT`=기존 참조 문서에 있음, `PROPOSED`=신규 세부 설계 제안, `CODEX_REPORTED`=코드 실행 보고가 있으나 직접 확인 안 됨, `REFERENCE_ONLY`=개념·교육용, `OPEN`=증거 부족. 이것들은 APPROVED와 구분한다.

## 1. 소유권 및 경계 결정 12개

1. Shared Driver Input은 실제 입력값 취득, Propulsion 등 도메인은 **도메인별 요청 해석**을 담당. 이중 샘플러 구현 금지.
2. GearRequest, 전이 허용 판단, 실제 보고 GearState를 분리.
3. Propulsion은 구동 토크 요구 책임, Motion Coordination은 복수 요구의 제어권·Arbitration·배분 책임. 실제 구현 위치는 별도 매핑.
4. 현재 VMC는 PropulsionRequest→DriveTorqueRequest로 보고됨. 참조 경로를 적용하려고 generator 두 개를 만들지 않음.
5. eDriveCommand는 명령이지 실측 모터 토크가 아니며 PhysicsAdapter/적용 DriveForce와 다름.
6. Driver 마찰제동, ABS, ESC, 회생제동, Brake Blending은 개별 책임이며 동작했다고 가정 금지.
7. normalized steering, EPS 조력, SbW 명령, LKA 요청, 실제 휠각, Yaw는 구분.
8. ABS/TCS/ESC는 조정/제약 요구를 생성하며 공통 직렬 단계로 처리하지 않음.
9. ADAS는 요구를 생성할 수 있어도 임의로 자동 제어 우선권을 취득하지 않음.
10. Sensor/Estimator와 실제 Physics state, UI 모니터 값은 다르다.
11. Fault Injection과 Fault Detect/Confirm/React/Recovery를 구분. HARA 없는 SG 강제 금지.
12. Motion CAN-FD는 참조 설계이고 실제 CAN telemetry로 취급하지 않음.

## 2. 기능 관계 큰 그림

```text
운전자 / 환경 → 입력 유효성 및 가용 상태
        ├→ Propulsion 요구 ─┐
        ├→ Braking 요구 ───┤
        ├→ Steering 요구 ──┤→ Motion Coordination (논리 그룹)
        ├→ Gear 요청/상태 ──┤         │
        └→ ADAS/Stability ──┘         ├→ eDrive SW → Adapter
                                     ├→ (미래) Brake SW
                                     └→ (미래) EPS SW
                                           ↓
                                     Rapier Plant
                                           ↓
                                      상태 관측 → Feedback
```

현 런타임에서는 브레이크/조향이 직접 Physics로 연결되는 다른 실행 경로가 있을 수 있다. 위 논리 연결은 모든 경로가 이미 VMC를 경유한다는 뜻이 아니다.

## 3. 공통 Function 정보 계약

각 Function은 `id`, `nameKo/nameEn`, 목적/책임, Parent/Subfunction, 입력·출력 역할, 상태·Guard, Upstream/Downstream, 실제 관련 Requirement/TC, 구현 위치, 관찰지점, 출처/지원 여부를 가진다.

- 기능과 SWC·Runnable·ECU는 1:1 구조가 아니다.
- 원문이 정의한 `LF-*`는 *임시 논리 기능 ID*이며 `FR-/SYS-/SWR-/TC-` ID로 변환하지 않는다.
- static range, contextual Expected, 관측 actual, recorded reference, hidden root cause는 분리된 정보다.

## 4. Function → Subfunction 검토 목록 (전체 ID 보존)


### 4A. Driver / Environment 입력 경계 (`DRIVER_ENV`)

#### `LF-DRV-ACQ` — 운전자 조작 취득

- **역할:** 가속·브레이크·조향·기어 요청을 읽어 시뮬레이션 시각과 함께 전달한다.
- **원문 하위 기능 식별자:** `ACQ-ACCEL`, `ACQ-BRAKE`, `ACQ-STEER`, `ACQ-GEAR`, `ACQ-TIME`
- **주의·미정:** UI 조작값을 곧바로 차량 전체의 승인 신호로 간주하지 말고 실제 입력 변환을 확인한다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-DRV-VALID` — 입력 품질·정규화

- **역할:** 전달된 조작값의 유효성과 정규화 여부를 구분해 소비 기능에 알린다.
- **원문 하위 기능 식별자:** `VALID-RANGE`, `VALID-STATUS`, `VALID-CONVERT`, `VALID-AGE`
- **주의·미정:** 물리 센서 이중화·고장 감시 로직을 임의 가정하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-ENV-STATE` — 환경 상태 제공

- **역할:** 시뮬레이터 환경 및 Traffic 정보를 ADAS가 소비할 수 있는 추상 정보로 나타낸다.
- **원문 하위 기능 식별자:** `ENV-ROAD`, `ENV-TRAFFIC`, `ENV-REL`, `ENV-LANE`
- **주의·미정:** 실제 Camera/Radar 인지나 센서 오류 모델이 있음을 뜻하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4B. Vehicle State & Mode 공유 서비스 (`VEHICLE_STATE`)

#### `LF-VS-INIT` — 초기화·준비 상태

- **역할:** 차량 기능의 준비 및 구동 가용 상태를 표현한다.
- **원문 하위 기능 식별자:** `INIT-START`, `INIT-READY`, `INIT-RESET`, `INIT-EXPOSE`
- **주의·미정:** VehicleReady와 각 도메인 준비 상태가 동일한 것은 아니다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-VS-PERM` — 주행 허용·인터록

- **역할:** Gear·Ready·기능 허용 등의 정보를 구동 허용 정책에 연결한다.
- **원문 하위 기능 식별자:** `PERM-READY`, `PERM-GEAR`, `PERM-FAULT`, `PERM-FINAL`
- **주의·미정:** 필요조건을 완전한 충분조건으로 오해하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-VS-MODE` — 운용 모드 조정

- **역할:** 차량 운용 모드와 관련 기능의 적용 가능한 상태를 전달한다.
- **원문 하위 기능 식별자:** `MODE-REQUEST`, `MODE-GUARD`, `MODE-PUBLISH`, `MODE-TRANSITION-REPORT`
- **주의·미정:** 모드별 토크/조향 mapping 수치는 문서에 없음.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-VS-FAULT` — 고장 시 가용성

- **역할:** 기능 제한·가용성을 차량 수준에서 설명하고 각 도메인과 조정한다.
- **원문 하위 기능 식별자:** `FAULT-AGGREGATE`, `FAULT-PERMISSION`, `FAULT-RECOVERABILITY`
- **주의·미정:** 개별 고장 확정이 차량 전체 OFF를 뜻하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4C. Gear / Direction (`GEAR`)

#### `LF-GEAR-ACQ` — 변속 요청 취득

- **역할:** 운전자 기어 선택을 유효한 요청으로 처리한다.
- **원문 하위 기능 식별자:** `GEAR-REQUEST`, `GEAR-VALID`, `GEAR-AGE`
- **주의·미정:** GearRequest는 실제 선택/적용된 GearState와 다르다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-GEAR-INTERLOCK` — 기어 전환 허용 판단

- **역할:** 상태·조건을 검사해 전환 요청의 허용 여부를 정한다.
- **원문 하위 기능 식별자:** `GEAR-SPEED-GUARD`, `GEAR-BRAKE-GUARD`, `GEAR-DIRECTION-GUARD`, `GEAR-INHIBIT-REASON`
- **주의·미정:** 속도 임계치와 정확한 P/R/N/D 정책은 미확정이다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-GEAR-STATE` — 기어 상태 추적

- **역할:** 수락/전환/적용 상태를 구별하여 필요한 기능에 배포한다.
- **원문 하위 기능 식별자:** `GEAR-PENDING`, `GEAR-TRANSITION`, `GEAR-ENGAGED`, `GEAR-REPORT`
- **주의·미정:** 현재 지원된 Gear D 전제조건만으로 full gear state machine을 주장 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-GEAR-REACT` — 변속 실패 처리

- **역할:** 전환 실패 또는 상태 불일치에 대한 후속 판단 지점을 정의한다.
- **원문 하위 기능 식별자:** `GEAR-FAIL-DETECT`, `GEAR-INHIBIT`, `GEAR-RECOVER`
- **주의·미정:** Timeout·고장반응은 근거 없으면 비운다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4D. Propulsion (`PROPULSION`)

#### `LF-PROP-STA` — 구동 상태 관리

- **역할:** 구동 OFF/READY/ACTIVE/DEGRADED의 참조 전이 조건을 관리한다.
- **원문 하위 기능 식별자:** `STA-READY-GUARD`, `VehicleReady`, `GearState`, `DriveEnable`, `STA-REQUEST-GUARD`, `STA-TRANSITION`, `PROP_OFF/READY/ACTIVE`, `STA-PUBLISH`
- **주의·미정:** 기존 Propulsion v0.1의 상태와 TC는 초안이며 실제 SW 상태와 별개다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-ACQ` — 구동 입력 수용

- **역할:** 가속페달 유효성을 활용해 운전자 구동 요구 입력의 사용 가능 여부를 판단한다.
- **원문 하위 기능 식별자:** `ACQ-PEDAL-READ`, `ACQ-VALIDITY`, `ACQ-REJECT-INVALID`, `ACQ-STATUS`
- **주의·미정:** Raw 입력 취득과 Propulsion의 유효성 해석을 두 번 수행한다고 가정하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-INTERP` — 운전자 구동 의도 해석

- **역할:** PedalDemandMap을 통해 정규화된 DriverDriveDemand를 만든다.
- **원문 하위 기능 식별자:** `INT-NORMALIZE`, `INT-PEDAL-MAP`, `INT-VALID-GATE`, `INT-DEMAND-PUBLISH`
- **주의·미정:** 20%→0.20은 문서의 참조 Calibration 예시다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-GEN` — 토크 요구 생성

- **역할:** 유효한 요청과 vehicle state에서 RequestedDriveTorque를 계산하는 책임이다.
- **원문 하위 기능 식별자:** `GEN-ENABLE`, `GEN-SELECT-MAP`, `GEN-LOOKUP/COMPUTE`, `GEN-UNIT-CHECK`, `GEN-PUBLISH`
- **주의·미정:** 실제 VMC 계산식/출력에 중복 기능을 생성하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-LIM` — 토크 제한

- **역할:** ArbitratedDriveTorque와 MaxAllowedDriveTorque 사이의 제한 규칙을 적용한다.
- **원문 하위 기능 식별자:** `LIM-SELECT`, `LIM-COMPARE`, `LIM-SATURATE`, `LIM-STATUS`
- **주의·미정:** 300Nm 한계는 참고 예시. 음수/Reverse/Invalid 처리 미정.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-OUT` — 구동 명령 제공

- **역할:** 정의된 상태와 유효성 조건에서 최종 구동 명령과 Validity를 발행한다.
- **원문 하위 기능 식별자:** `OUT-GATE`, `OUT-MAP`, `OUT-VALID`, `OUT-PUBLISH`
- **주의·미정:** LimitedDriveTorque·DriveTorqueCommand·EDriveCommand는 별개 식별자로 둔다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-MON` — 구동 일관성 감시

- **역할:** 명령과 제한값 차이를 계산해 지정 허용오차로 판단하도록 설계한다.
- **원문 하위 기능 식별자:** `MON-SAMPLE`, `MON-DEVIATION`, `MON-TOLERANCE`, `MON-STATUS`, `MON-CONFIRM`
- **주의·미정:** 독립 샘플 관측과 확인 조건이 없으면 FaultConfirmed를 자동 산출하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-REACT` — 구동 고장 대응

- **역할:** 확정된 Fault에 따른 제한 상태/명령 동작을 결정한다.
- **원문 하위 기능 식별자:** `REA-CONFIRM-GUARD`, `REA-STATE`, `REA-OUTPUT-LIMIT`, `REA-PUBLISH`
- **주의·미정:** 50Nm는 참조 TC 예시이고 실제 안전 상태 검증의 근거가 아니다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-REC` — 구동 복귀

- **역할:** Fault 해제 외에 RecoveryConditionsSatisfied를 확인해 복귀한다.
- **원문 하위 기능 식별자:** `REC-FAULT-CLEAR`, `REC-CONDITION`, `REC-REARM`, `REC-READY-TRANSITION`, `REC-REACTIVATE-GUARD`
- **주의·미정:** 고장 주입 종료가 회복 허용과 같지 않다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PROP-EDRV` — eDrive 명령 처리

- **역할:** DriveTorqueRequest와 Direction/Validity로 EDriveCommand를 생성한다.
- **원문 하위 기능 식별자:** `EDRV-INPUT`, `DriveTorqueRequest`, `EDRV-STATE`, `EDRV-CALC`, `EDRV-OUTPUT`, `EDriveCommand`, `EDRV-ADAPTER`
- **주의·미정:** 명령 수치는 실제 Motor Torque 피드백이 아니다. 현재 C/WASM 실행은 Codex 보고 사항이다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4E. Braking (`BRAKING`)

#### `LF-BRK-ACQ` — 제동 요구 취득

- **역할:** Driver Brake, 향후 AEB·Stability 개입 요구를 출처별로 수집한다.
- **원문 하위 기능 식별자:** `BRK-PEDAL`, `BRK-ADASSRC`, `BRK-STABSRC`, `BRK-VALID`
- **주의·미정:** 현재 BrakePhysics 결과만으로 Brake SW Controller가 있다는 뜻이 아니다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-BRK-STATE` — 제동 상태/가용성

- **역할:** 제동 가용성, 모드, 장애 상태에 따라 요구 수용 조건을 만든다.
- **원문 하위 기능 식별자:** `BRK-ENABLE`, `BRK-MODE`, `BRK-FAULT-STATE`, `BRK-PUBLISH`
- **주의·미정:** Braking을 Propulsion DriveEnable이나 Gear D에 종속시키지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-BRK-DEMAND` — 감속 요구 해석

- **역할:** 제동 입력을 명시된 제동 요구량 또는 목표 감속으로 해석한다.
- **원문 하위 기능 식별자:** `BRK-INTENT`, `BRK-REQUEST-MAP`, `BRK-COAST/DISABLE`, `BRK-DEMAND-PUBLISH`
- **주의·미정:** Pedal 값과 유압/감속의 선형성을 가정하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-BRK-COORD` — 제동 요구 조정

- **역할:** 여러 제동 요구의 권한·제약·허용치를 조정하고 MotionCoord와 연계한다.
- **원문 하위 기능 식별자:** `BRK-ARB-REQUEST`, `BRK-PROP-INTERLOCK`, `BRK-LIMIT`, `BRK-PRIORITY`
- **주의·미정:** AEB 우선순위 등을 임의 지정하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-BRK-BLEND` — 마찰·회생제동 배분

- **역할:** 실제 Energy/regen 제약이 있을 때 회생과 마찰 제동의 분할 후보를 다룬다.
- **원문 하위 기능 식별자:** `BLEND-ELIGIBLE`, `BLEND-REGEN-LIMIT`, `BLEND-FRICTION-REMAINDER`, `BLEND-TRANSITION`
- **주의·미정:** 현재는 참고 기능. 임의로 regen torque를 Physics에 중복 적용 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-BRK-CMD` — 제동 명령 생성

- **역할:** 선택된 제동 요구를 소프트웨어/어댑터 출력 명령으로 변환한다.
- **원문 하위 기능 식별자:** `BRK-CMD-CONVERT`, `BRK-CMD-VALID`, `BRK-CMD-SATURATE`, `BRK-CMD-PORT`
- **주의·미정:** SW 명령, brake force, 실제 차량 감속을 따로 관리.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-BRK-FDBK` — 제동 반응 감시

- **역할:** 명령과 독립 응답 비교, 고장 반응/복귀를 위한 관측을 정의한다.
- **원문 하위 기능 식별자:** `BRK-OBSERVE`, `BRK-COMPARE`, `BRK-FAULT`, `BRK-RECOVER`
- **주의·미정:** 존재하지 않는 압력센서/피드백을 만들지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4F. Steering (`STEERING`)

#### `LF-STR-ACQ` — 조향 요구 취득

- **역할:** 운전자 조향과 향후 LKA 요구의 유효성/권한 출처를 구분한다.
- **원문 하위 기능 식별자:** `STR-DRIVER`, `STR-ASSIST`, `STR-VALID`, `STR-AUTHORITY`
- **주의·미정:** normalized steering -1..1을 도로 휠각도와 동일시 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STR-STATE` — 조향 상태 관리

- **역할:** EPS assist/steer-by-wire 등 제어 방식에 따른 상태·가용성을 정의할 자리다.
- **원문 하위 기능 식별자:** `STR-AVAIL`, `STR-ASSIST-MODE`, `STR-FAULT-STATE`, `STR-PUBLISH`
- **주의·미정:** 실제 조향 구성을 아직 선택하지 않았다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STR-DEMAND` — 요구 조향 해석

- **역할:** 운전자 입력/속도를 실제 채택할 목표 조향량으로 변환할 후보 처리.
- **원문 하위 기능 식별자:** `STR-MAP`, `STR-LIMIT`, `STR-OPTIONAL-FILTER`, `STR-REQUEST`
- **주의·미정:** 핸들각, 타이어각, 목표 yaw 모두 다른 물리량이다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STR-COORD` — 조향 요구 조정

- **역할:** Driver와 LKA의 요구/override/권한을 비교하는 기능 후보.
- **원문 하위 기능 식별자:** `STR-REQUEST-TYPES`, `STR-DRIVER-OVERRIDE`, `STR-PRIORITY`, `STR-FINAL-DEMAND`
- **주의·미정:** Driver 우선순위·ADAS 개입 전이 조건 미정.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STR-ACT` — 조향 구동 제어

- **역할:** 최종 조향 요구를 EPS/Physics 적용 명령으로 전달한다.
- **원문 하위 기능 식별자:** `STR-ACT-CONVERT`, `STR-ACT-GUARD`, `STR-ACT-SEND`, `STR-ACT-APPLIED`
- **주의·미정:** Player Steering 입력이 동작해도 EPS SW 검증이라고 할 수 없다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STR-MON` — 조향 반응 감시

- **역할:** 명령과 실제 관측 각도/yaw를 비교할 조건을 마련한다.
- **원문 하위 기능 식별자:** `STR-FEEDBACK`, `STR-DEVIATION`, `STR-MON-STATUS`, `STR-RESPONSE`
- **주의·미정:** 실제 독립 feedback과 Fault Reaction 기준 미정.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4G. Stability / Traction (`STABILITY`)

#### `LF-STB-ABS` — ABS

- **역할:** 휠 잠김 경향을 감지해 마찰제동을 조절할 논리 역할.
- **원문 하위 기능 식별자:** `ABS-WHEEL-SLIP-ESTIMATE`, `ABS-LOCK-TREND`, `ABS-MODULATE`, `ABS-RELEASE/RECOVER`, `ABS-MONITOR`
- **주의·미정:** 휠속/슬립 모델과 controller 주기가 없으면 실행 불가.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STB-TCS` — TCS

- **역할:** 구동륜 미끄럼을 관찰해 토크 제한·필요시 제동 개입을 요청한다.
- **원문 하위 기능 식별자:** `TCS-DRIVE-SLIP`, `TCS-DEMAND-LIMIT`, `TCS-BRAKE-REQUEST`, `TCS-EXIT`
- **주의·미정:** VehicleSpeed만으로 구동휠 slip을 계산하면 안 된다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STB-ESC` — ESC

- **역할:** 차량 yaw/lateral 상태와 목표 상태의 차이로 안정화 개입을 판단한다.
- **원문 하위 기능 식별자:** `ESC-DESIRED-YAW`, `ESC-STATE-ESTIMATE`, `ESC-YAW-ERROR`, `ESC-INTERVENTION`, `ESC-RECOVERY`
- **주의·미정:** 타이어·제동륜별 구동력/안정화 조건 미정.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-STB-COORD` — 안정화 요구 전달

- **역할:** ABS/ESC/TCS 결과를 조정/구동·제동 영역의 제약으로 전달한다.
- **원문 하위 기능 식별자:** `STB-REQUEST-PRIORITY`, `STB-LIMIT-PROP`, `STB-REQUEST-BRAKE`, `STB-TRACE`
- **주의·미정:** CAN 실송신을 전제하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4H. ADAS (`ADAS`)

#### `LF-ADAS-AEB` — 자동 긴급 제동

- **역할:** 객체/상황 유효성, 위험 판단, 제동 요청/해제의 기능 후보.
- **원문 하위 기능 식별자:** `AEB-TARGET-VALIDITY`, `AEB-THREAT-EVALUATION`, `AEB-ACTIVATION`, `AEB-BRAKE-REQUEST`, `AEB-RELEASE`
- **주의·미정:** TTC·거리 임계치와 실제 센서 신뢰도를 임의 생성하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-ADAS-ACC` — 적응형 순항 제어

- **역할:** 목표 속도/차간거리와 선행차 정보를 고려해 종방향 제어 요구를 낸다.
- **원문 하위 기능 식별자:** `ACC-MODE`, `ACC-TARGET-SELECTION`, `ACC-SPEED/GAP-CONTROL`, `ACC-LONGITUDINAL-REQUEST`, `ACC-DRIVER-OVERRIDE`
- **주의·미정:** Radar 실측·Driver Override 정책 미확정.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-ADAS-LKA` — 차로 유지 보조

- **역할:** 차로 편차·주행 상태로 조향 개입 요구를 만든다.
- **원문 하위 기능 식별자:** `LKA-AVAIL`, `LKA-LANE-STATE`, `LKA-INTERVENTION`, `LKA-STEER-REQUEST`, `LKA-RELEASE`
- **주의·미정:** 차선 offset, steering angle, yaw 목표 혼동 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-ADAS-COMMON` — ADAS 가용성

- **역할:** 입력 품질·활성화 guard·취소/상태 보고를 통합한다.
- **원문 하위 기능 식별자:** `ADAS-INPUT-QUALITY`, `ADAS-ENGAGE-GUARD`, `ADAS-CANCEL`, `ADAS-STATUS`
- **주의·미정:** ADAS 공통 ECU가 있다는 뜻이 아니다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4I. Motion Coordination / VMC 논리 역할 (`MOTION_COORDINATION`)

#### `LF-MC-REQ` — 차량 운동 요구 수용

- **역할:** Propulsion, Brake, Steering, ADAS, Stability 요구를 유형별로 수집한다.
- **원문 하위 기능 식별자:** `MC-LONGITUDINAL`, `MC-LATERAL`, `MC-CONSTRAINT`, `MC-PROVENANCE`
- **주의·미정:** 현재 VMC가 전체 요구를 실제 처리한다는 근거 없음.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-MC-AUTH` — 제어권·요구 Arbitration

- **역할:** 복수 요구의 권한·충돌·최종 선택을 다룬다.
- **원문 하위 기능 식별자:** `MC-PRIORITY`, `MC-CONFLICT`, `MC-FALLBACK`, `MC-SELECT`, `MC-REASON`
- **주의·미정:** AEB>Driver 등 자동 우선순위 금지. v0.1 Arbitration과 중복 구현 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-MC-LON` — 종방향 요구 조정

- **역할:** 선택된 가속/감속 요구와 상태 제약을 함께 고려한다.
- **원문 하위 기능 식별자:** `MC-LONG-INTERPRET`, `MC-TORQUE/DECEL-MODE`, `MC-LIMITS`, `MC-COUPLING`
- **주의·미정:** 실제 VMC TorqueGeneration과 중복하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-MC-LAT` — 횡방향 요구 조정

- **역할:** Driver/LKA/ESC 관련 요구와 속도·상태 제약을 조합할 책임.
- **원문 하위 기능 식별자:** `MC-LAT-REQUEST`, `MC-LAT-LIMIT`, `MC-LAT-COUPLING`, `MC-LAT-HANDOFF`
- **주의·미정:** 실제 lateral controller는 확인되지 않음.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-MC-ALLOC` — Actuator 명령 배분

- **역할:** 운동 요구를 구동·제동·조향 컨트롤러 또는 어댑터로 나눠 전달한다.
- **원문 하위 기능 식별자:** `MC-ASSIGN-DRIVE`, `MC-ASSIGN-BRAKE`, `MC-ASSIGN-STEER`, `MC-PUBLISH`, `MC-STATUS`
- **주의·미정:** 중앙 ECU가 반드시 필요하다고 정하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-MC-MON` — 조정 결과 감시

- **역할:** 요구·선택·제한 결과의 모순 또는 제약 위반을 관측한다.
- **원문 하위 기능 식별자:** `MC-CHECK-CONSISTENCY`, `MC-CHECK-CONSTRAINT`, `MC-DETECT-CONFLICT`, `MC-FAULT-HANDOFF`
- **주의·미정:** HARA 없이 임의 SG/ASIL 할당 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4J. Sensing & State Estimation (`SENSING_ESTIMATION`)

#### `LF-SEN-MOTION` — 차량 운동 관측

- **역할:** 속도·가속도·위치·가능한 방향/yaw의 모니터 값을 제공한다.
- **원문 하위 기능 식별자:** `SEN-SPEED`, `SEN-LONG-VELOCITY`, `SEN-LONG-ACCEL`, `SEN-YAW/HEADING`, `SEN-TIMESTAMP`, `SEN-QUALITY`
- **주의·미정:** Rapier ground truth와 실차 센서 측정치 구분.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-SEN-ACT` — 작동계 반응 계측

- **역할:** 소프트웨어 명령·적용 힘·Plant 응답을 각 위치별로 관측한다.
- **원문 하위 기능 식별자:** `SEN-COMMAND`, `SEN-APPLIED-FORCE`, `SEN-ACTUAL-RESPONSE`, `SEN-DISCREPANCY`
- **주의·미정:** Nm/force N 간 차이를 무시하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-SEN-QUALITY` — 관측 품질

- **역할:** 신호의 누락, 시간 경과, 출처, 유효성을 관리하는 후보.
- **원문 하위 기능 식별자:** `SEN-MISSING`, `SEN-TIME-AGE`, `SEN-SOURCE`, `SEN-CONFIDENCE`
- **주의·미정:** 없는 timestamp 정확도나 센서 품질 flag 추정 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4K. Power / Energy (`POWER_ENERGY`)

#### `LF-EN-READY` — 전력 가용성

- **역할:** 모델에 실제 존재하는 전원/에너지 상태로 구동 가능 여부를 정한다.
- **원문 하위 기능 식별자:** `EN-AVAILABLE`, `EN-INHIBIT`, `EN-STATE-PUBLISH`
- **주의·미정:** HV/BMS 구성과 contactor 가정 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-EN-LIMIT` — 구동/회생제동 가용 한계

- **역할:** 모델링된 에너지·온도·용량 정보로 토크 제한을 제공하는 후보.
- **원문 하위 기능 식별자:** `EN-DRIVE-LIMIT`, `EN-REGEN-LIMIT`, `EN-VALIDITY`, `EN-PUBLISH`
- **주의·미정:** 실제 power/thermal envelope 없음.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-EN-MON` — 에너지 제약 감시

- **역할:** 현재 요구와 가용 범위 관계를 감시한다.
- **원문 하위 기능 식별자:** `EN-OBSERVE`, `EN-CONSTRAINT-STATUS`, `EN-DEGRADE-HANDOFF`
- **주의·미정:** 향후 안전 반응이 필요한지는 별도 요구사항으로 결정.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4L. Occupant Safety (`OCCUPANT_SAFETY`)

#### `LF-OCC-IMPACT` — 충돌 이벤트 관측

- **역할:** 명시적으로 모델링된 충돌 이벤트 입력을 수집한다.
- **원문 하위 기능 식별자:** `OCC-EVENT`, `OCC-VALIDITY`, `OCC-CONTEXT`
- **주의·미정:** 실제 Crash Sensor/가속도계 동작으로 주장 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-OCC-DECIDE` — 보호 장치 전개 판단

- **역할:** 승인된 충돌 조건에서 전개 여부를 판단하는 논리 영역.
- **원문 하위 기능 식별자:** `OCC-CLASSIFY`, `OCC-GUARD`, `OCC-DECISION`, `OCC-LOG`
- **주의·미정:** 실제 에어백 전개 기준은 없음.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-OCC-DEPLOY` — 보호 명령

- **역할:** Airbag/Pretensioner 명령 및 이벤트를 모델링하는 미래 기능.
- **원문 하위 기능 식별자:** `OCC-AIRBAG-OUTPUT`, `OCC-PRETENSIONER-OUTPUT`, `OCC-EVENT-REPORT`
- **주의·미정:** VMC 토크 체인과 별도.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4M. Fault Detection / Diagnostics / Recovery (`FAULT_DIAGNOSTICS`)

#### `LF-FM-OBS` — 진단 감시 수집

- **역할:** 관측 지점에서 상태/불일치/이벤트를 받는다.
- **원문 하위 기능 식별자:** `FM-RANGE`, `FM-CONSISTENCY`, `FM-HEARTBEAT`, `FM-EVENT-CONTEXT`
- **주의·미정:** 주입 시각=ECU 검출 시각 아님.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-FM-DETECT` — 고장 검출·확정

- **역할:** 편차/지속 시간/확정 기준으로 Fault 상태를 판단할 영역.
- **원문 하위 기능 식별자:** `FM-CONDITION`, `FM-FILTER/DEBOUNCE`, `FM-CONFIRM`, `FM-REPORT`
- **주의·미정:** Debounce, DTC, timeout 기준 임의 생성 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-FM-REACT` — 고장 대응 조정

- **역할:** 확정 Fault를 기능별 제한 반응 요구로 연결한다.
- **원문 하위 기능 식별자:** `FM-SELECT-REACTION`, `FM-DOMAIN-HANDOFF`, `FM-AVAILABILITY`, `FM-PUBLISH`
- **주의·미정:** 도메인별 실제 반응은 각 소유 도메인 책임.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-FM-REC` — 오류 해제·복귀

- **역할:** 고장 상태 해제와 재활성 guard를 검토한다.
- **원문 하위 기능 식별자:** `FM-CLEAR-OBS`, `FM-RECOVERY-GUARDS`, `FM-REARM`, `FM-LOG`
- **주의·미정:** fault injection이 끝났다고 자동 recover 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-FM-DIAG` — 진단 인터페이스

- **역할:** 필요시 event/DTC/UDS service를 통한 진단 정보 공개.
- **원문 하위 기능 식별자:** `FM-EVENT-RECORD`, `FM-STATE-EXPOSE`, `FM-SERVICE-BRIDGE`
- **주의·미정:** 별도 UDS 프로젝트 경험이 현재 TRACKBACK Runtime 지원 증거는 아니다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4N. Communication & Interface (`COMMUNICATION_INTERFACES`)

#### `LF-COM-PORT` — 내부 SW 포트 전달

- **역할:** 생산 포트 출력에서 소비 포트 입력으로 데이터를 전달한다.
- **원문 하위 기능 식별자:** `COM-SOURCE-ENDPOINT`, `COM-TRANSFER`, `COM-CONSUMER-ENDPOINT`, `COM-OBSERVE-BOTH-ENDS`
- **주의·미정:** 독립 Source/Destination 관찰 없으면 실제 Interface Comparison 미지원.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-COM-NET` — 가상 Motion CAN-FD

- **역할:** 명시적 메시지 정의·주기·송수신·검증의 미래 네트워크.
- **원문 하위 기능 식별자:** `NET-TX`, `NET-SCHEDULE`, `NET-RX`, `NET-VALIDATE`, `NET-DECODE`, `NET-UPDATE-STATUS`
- **주의·미정:** 현재 Virtual CAN-FD 실행 지원 근거 없음.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-COM-SUP` — 전달 최신성·시간 감시

- **역할:** 마지막 수신 시각 및 missing/timeout을 판단하는 기능 후보.
- **원문 하위 기능 식별자:** `COM-AGE`, `COM-MISSING-UPDATE`, `COM-TIMEOUT`, `COM-RECOVERY`
- **주의·미정:** 60Hz physics tick으로 ECU timeout 증명 불가.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4O. Execution & Platform (`EXECUTION_PLATFORM`)

#### `LF-EXE-CLOCK` — 시뮬레이션 시간

- **역할:** 고정 Physics Tick, reset, scenario time, event 시각을 정의한다.
- **원문 하위 기능 식별자:** `CLK-TICK`, `CLK-RESET`, `CLK-SCENARIO-TIME`, `CLK-TIMESTAMP`
- **주의·미정:** 현재 1/60s ≠ SW Task 실행 주기.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-EXE-SCHED` — Task/Runnable 스케줄

- **역할:** 주기·이벤트 Task의 실행·순서를 관리할 미래 기능.
- **원문 하위 기능 식별자:** `SCHED-RELEASE`, `SCHED-PERIOD`, `SCHED-ORDER`, `SCHED-HOLD`, `SCHED-LOG`
- **주의·미정:** 가상의 10ms VMC task를 실제 실행으로 주장 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-EXE-SUP` — 실행 감시

- **역할:** Alive/Watchdog/Reset을 감시할 후보.
- **원문 하위 기능 식별자:** `SUP-ALIVE`, `SUP-TIME-BUDGET`, `SUP-WATCHDOG`, `SUP-RESET`, `SUP-REACTION`
- **주의·미정:** 특정 MCU HW watchdog과 동일하지 않다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-EXE-RECORD` — Blackbox/Replay

- **역할:** 증상 이전/이후 데이터 캡처와 동일 시험의 재실행.
- **원문 하위 기능 식별자:** `REC-SAMPLE`, `REC-BUFFER`, `REC-CAPTURE`, `REC-RESTORE`, `REC-REPLAY`, `REC-PROVENANCE`
- **주의·미정:** cross-device bitwise 결정론 및 자동 Expected 생성 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


### 4P. Actuation & Plant (`ACTUATION_PLANT`)

#### `LF-ACT-DRIVE` — 구동 명령 물리 적용

- **역할:** EDriveCommand를 adapter로 변환해 physics DriveForce에 반영한다.
- **원문 하위 기능 식별자:** `ACT-DRIVE-CONVERT`, `ACT-DRIVE-VALIDATE`, `ACT-DRIVE-APPLY`, `ACT-DRIVE-TRACE`
- **주의·미정:** eDriveCommand magnitude, DriveForce, VehicleAcceleration은 다른 관측 지점.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-ACT-BRAKE` — 제동 명령 물리 적용

- **역할:** Brake input을 적용 제동력으로 바꾸고 Plant에 반영한다.
- **원문 하위 기능 식별자:** `ACT-BRAKE-INPUT`, `ACT-BRAKE-CONVERT`, `ACT-BRAKE-APPLY`, `ACT-BRAKE-TRACE`
- **주의·미정:** BrakeController 소프트웨어 존재를 증명하지 않는다.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-ACT-STEER` — 조향 명령 물리 적용

- **역할:** 정규화 제어값 등을 Physics Steering에 적용한다.
- **원문 하위 기능 식별자:** `ACT-STEER-INPUT`, `ACT-STEER-APPLY`, `ACT-STEER-TRACE`
- **주의·미정:** 실제 steering angle map은 미확정.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PLANT-MOTION` — 차량 종·횡방향 거동

- **역할:** 구동/제동/조향/노면을 이용해 속도·가속도·위치 등을 계산한다.
- **원문 하위 기능 식별자:** `PLANT-FORCE-INTEGRATION`, `PLANT-BRAKE-EFFECT`, `PLANT-STEERING-EFFECT`, `PLANT-CONTACT`, `PLANT-STATE`, `PLANT-OBSERVATION`
- **주의·미정:** 고정 wheel·tire 고정밀모델이나 독립 Expected 없는 상태.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.

#### `LF-PLANT-ENV` — 도로·교통 환경

- **역할:** 도로·마찰·교통 및 트리거 영역을 시나리오에 제공한다.
- **원문 하위 기능 식별자:** `ROAD-SEGMENT`, `ROAD-FRICTION`, `TRAFFIC-ACTOR-UPDATE`, `SCENARIO-ZONE`
- **주의·미정:** 미지원 Traffic/road 변수 추정 금지.
- **분류:** `SRC_DRAFT` 표기는 원문 기능 수준만 확인을 뜻함. 기존 설계만 있는 경우 `PROPOSED / REFERENCE_ONLY`; 실제 실행 여부는 코드·TC로 별도 확인.


## 5. 도메인 간 경로 — 신호의 역할 수준(값 아님)

- **가속:** 현재 실행 보고에서는 Accelerator/Speed/Direction/Validity→PropulsionRequest→VMC→DriveTorqueRequest→eDrive→EDriveCommand→Adapter→DriveForce→Rapier. 참조 설계는 State/Request→Torque Generation→Arbitration→Limitation→Command→eDrive로 더 상세하지만 같은 실신호 목록이라고 가정 불가.
- **제동:** Driver Brake + 미래 AEB/ESC 요구→제동 요구·권한 판단→Controller 또는 직접 물리 명령→힘→차량 감속. Regen Blending 별도 미래 기능.
- **조향:** Driver Steering + 미래 LKA→권한/상태→요구 조향→Controller 또는 Physics→Yaw·방향. normalized input과 wheel angle을 동일시하지 않음.
- **기어:** Selector Request→Validity/Interlock→Accepted State→GearState/Drive Permission. 요청 D와 적용 D 분리.
- **ADAS:** 환경/차량 상태→AEB/ACC/LKA 의사결정→동일한 Type의 Motion Request→조정/Actuator→Plant.
- **Stability:** 차량/휠 상태→ABS/TCS/ESC 판단→Drive/Brake 개입→Plant→Feedback.
- **고장 대응:** 독립적인 관측→지정 Fault Detection/Confirmation→도메인 Fault Reaction→복구 guard. 외부 Fault 주입 여부와 ECU Fault 상태가 자동으로 같은 것은 아님.

## 6. 기존 Requirement/TC 매핑 정책

| Function | 연결되는 v0.1 식별자 계열 | 주의 |
|---|---|---|
| `LF-PROP-STA` | `FR/SYS/SWR-PROP-STA-001/002`, 각 TC | 초안 기능·조건 |
| `LF-PROP-ACQ` | `FR/SYS/SWR-PROP-IN-001/002`, 각 TC | 입력 유효성 |
| `LF-PROP-INTERP` | `FR/SYS/SWR-PROP-REQ-001`, TC | PedalMap 예시는 실제 Calibration 아님 |
| `LF-PROP-GEN` | `FR/SYS/SWR-PROP-GEN-001`, TC | 실제 VMC 매핑 미정 |
| `LF-PROP-LIM` | `FR/SYS/SWR-PROP-LIM-001/002`, 각 TC | 300Nm 예시 |
| `LF-PROP-OUT` | `FR/SYS/SWR-PROP-OUT-001`, TC | eDriveCommand와 같다고 가정 불가 |
| `LF-PROP-MON` | `FR/SYS/SWR-PROP-MON-001`, TC | 독립 관측 여부 미정 |
| `LF-PROP-REACT` | `FR/SYS-PROP-REA-001`, `SWR-PROP-REA-001/002`, TC | 50Nm은 예시 |
| `LF-PROP-REC` | `FR/SYS/SWR-PROP-REC-001`, TC | Recovery guard 미정 |

표 안의 패턴은 읽기용 약기이며 실제 canonical ID는 문서 원문에 존재하는 완전한 ID만 사용. 현재 실제 실행 TC로 보고된 `TC-PROP-NORMAL-009`, `TC-PROP-NORMAL-010A`, `TC-PROP-NORMAL-010B`와 위 문서 TC들을 별도 자료로 유지한다.

기능안전 추적은 실제 HARA가 있는 기능에 대해서만 `Hazard→SG→FSR→TSR→안전 관련 HW/SW 요구사항`을 추가. Safety Case의 공개 Fact와 참조 모델의 Assumption을 혼합하지 않는다.

## 7. 실행·교육용 UI 계약

- Function 선택→같은 canonical ID에서 기능 설명, 차량 위치, 상태/입력/출력, 내부 하위 처리, Upstream/Downstream, Req/TC, 관찰·실행 가능 여부를 표시한다.
- Reference-only 기능도 설명과 추적성은 조회 가능하되 실행 버튼은 사용할 수 없게 표시한다.
- `GearState` 등 초보자에게 낯선 신호는 '무엇이고 왜 필요한지, 누가 생산/소비하는지, 언제 정상인지'를 기능 경로와 함께 설명한다.
- 외부 자료에 없는 Expected/실제 CAN 시간/독립 모니터 값을 UI가 채워 넣지 않는다.

## 8. Phase 03~06으로 넘길 미정 항목

- Phase 03: 정확한 IF/ELSE, state transition, arbitration priority, validity/fallback, timing, 계산식.
- Phase 04: 각 신호의 정확한 ID·타입·단위·producer/consumer endpoint·clock, alias 해소.
- Phase 05: FR/SYSR/SWR의 추상화 수준 정리, 조건/Expected, Safety Trace의 HARA 근거.
- Phase 06: verification method vs test design technique vs coverage, Oracle/OBSERVED, runtime target 가능 범위.
- Phase 07: case-specific hidden defect, observable symptom, stimulus, corrective action 분리.

## 9. 검토 결정 항목 10개

1. Motion Coordination을 독립 ECU가 아닌 공통 논리 그룹으로 둘지.
2. Shared Pedal acquisition과 Propulsion input interpretation의 소유권 구분.
3. VMC의 실제 계산 역할과 향후 Arbitration/Allocation의 소유권.
4. Brake SW가 없는 현재 경로를 Controller 테스트라고 표시하지 않을 것.
5. EPS 조력/SbW/직접 Physics 방식 가운데 어떤 조향 모델을 구현할지.
6. 회생제동 배분 기능을 MVP에 포함할지.
7. 요청 Gear와 적용 Gear를 분리할 데이터·전이/유효성 구조.
8. 실제 Software Port를 기본으로 하고 Network는 별도 구현할지.
9. 감시·고장확정·복귀와 기능안전 요구사항을 분리할 것.
10. 기능 목록을 canonical로 승인할 때 실제 출처·실행 지원을 재검증할 것.

## 10. 문서 인수 검토

- 원문에 있던 전 기능 식별자/하위 기능명을 빠뜨리지 않았는가?
- Reference vs Executable을 구분했는가?
- Mission/CAN/Task/Actuator/ASIL을 임의 실행/승인으로 처리하지 않았는가?
- 실제 Signal·Requirement·TC의 완전한 ID와 Producer/Consumer 관계만 등록할 것인가?
- Propulsion에만 맞춘 공통 경로를 나머지 Domain에 강제하지 않았는가?
- 내부 Fault mechanism을 UI가 조사 전에 공개하지 않는가?

**상태:** 아래 74개 기능에 대한 설계·검토 자료이지 실제 차량 소프트웨어 74개 Function/Task의 구현 또는 검증이 완료된 문서가 아님.
