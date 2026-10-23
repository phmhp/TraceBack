# TRACKBACK 근거 출처 등록부

> 상태: 분석 기준선 — 구현 승인 아님  
> 작성일: 2026-10-15  
> 목적: 취급설명서 사실, 현재 실행 사실, 시뮬레이션 가정, 미확인 내부 사양을 추적 가능하게 분리한다.

## 1. 출처 식별

| ID | 출처 | 식별 정보 | 권위 범위 | 사용 제한 |
|---|---|---|---|---|
| SRC-MAN-001 | `docs/reference/JKEV_2027_ko_KR.pdf` | 594 PDF pages, SHA-256 `423397DE234E387B36B8C8AA027C1C1D34317C93BD9A78CF7DF219ED10E35D65` | 운전자에게 공개된 기능, 표시, 작동 조건, 제한, 경고, 조치 | ECU/SW 분할, CAN ID, 내부 signal, DTC, calibration, task timing의 근거로 사용하지 않음 |
| SRC-REPO-001 | 현재 TRACKBACK 실행 코드 | `src/`, `c/`, `tests/`, `package.json` | 현재 게임에서 실제 실행·관찰·시험되는 동작 | 실제 Genesis 내부 사양으로 승격하지 않음 |
| SRC-REF-001 | Reference Vehicle 문서/Registry | `docs/reference_vehicle/`, `src/referenceVehicle/generated/reference-vehicle-registry.json` | TRACKBACK의 검토 중 참조 설계와 ID 체계 | OEM 승인 설계로 주장하지 않음. 현재 상태는 `REVIEWED_DRAFT` |
| SRC-CASE-001 | CASE-PT-001 정의/ground truth | `src/runtime/investigation/CaseDefinition.ts`, `src/data/ground-truth/PropulsionGroundTruth.ts` | 현재 교육용 case의 정답·evidence 계약 | 실제 GV70 고장 이력이나 OEM root cause로 주장하지 않음 |
| SRC-CAL-001 | 시뮬레이션 calibration | `src/data/calibration/TrackbackSimulationCalibration.ts` | 현재 게임 physics adapter의 재현 가능한 설정 | 실제 차량 제원·제어 임계값으로 사용하지 않음 |

### 문서 식별 주의

- 사용자는 이 파일을 “2026년형 제네시스 GV70 취급설명서”로 지칭했다.
- 파일명은 `JKEV_2027_ko_KR.pdf`이며 첫 부분에는 Copyright 2026이 표시된다.
- 설명서는 모든 모델과 기본/선택 사양을 함께 다루며 실제 차량의 사양·이미지·메뉴가 다를 수 있다고 고지한다.
- 따라서 모델 연식, 시장, 파워트레인, 선택 사양의 정확한 적용성은 구현 전에 별도로 확인해야 한다.

## 2. 페이지 표기 규칙

- `매뉴얼`은 본문에 인쇄된 페이지 번호다.
- `PDF`는 파일 뷰어의 1-based 물리 페이지다.
- 본문 구간에서는 대체로 `PDF = 매뉴얼 + 8`이다.
- 한 레코드가 여러 페이지를 참조하면 각 페이지에서 확인되는 범위만 사실로 인정한다.
- 원문을 요약했으며, 수치·명칭을 원문보다 정밀하게 확장하지 않는다.

## 3. 취급설명서 Fact Register

| Record ID | 기능/주제 | 문서가 직접 지지하는 사실 | 운전자 관측/조건 | 매뉴얼 / PDF 페이지 | 문서가 지지하지 않는 내부 정보 |
|---|---|---|---|---|---|
| MAN-EV-001 | 고전압·12 V 전원 역할 | 고전압 배터리는 구동 모터와 공조 등에 전원을 공급하고, 12 V 배터리는 조명·와이퍼·오디오 등 저전압 장치를 구동한다. 12 V 배터리는 DRIVE READY 또는 고전압 충전 중 자동 충전된다. | READY/충전 상태와 저전압 전장 동작 | 1 / PDF 9 | 배터리 ECU 구조, DC/DC 토폴로지, 전압 threshold, CAN signal |
| MAN-EV-002 | 전기차 제어 시스템 경고 | 전기차 제어 관련 센서·액추에이터·압축기 등에 이상이 있으면 서비스 경고가 표시될 수 있다. | 서비스 경고 표시 | 137 / PDF 145 | 어떤 ECU/DTC가 경고를 세우는지, 진단 주기, fault isolation logic |
| MAN-EV-003 | 고전압 저충전 | 주행 가능 거리가 약 30–40 km 수준일 때 저충전 경고가 표시될 수 있으며 실제 조건에 따라 달라진다. | 저충전 경고 및 남은 주행 가능 거리 | 137 / PDF 145 | 고정 SOC threshold, exact hysteresis, battery estimator algorithm |
| MAN-BRK-001 | 회생 제동/브레이크 이상 | 관련 이상 시 회생 제동이 작동하지 않을 수 있고, 브레이크 페달이 깊게 느껴지거나 제동거리가 길어질 수 있다. | 제동감 변화, 경고등, 회생 제한 | 138 / PDF 146 | brake ECU owner, hydraulic pressure signal, DTC, failure threshold |
| MAN-LV-001 | 12 V 충전 계통 경고 | 12 V 충전 경고는 충전 장치 이상 가능성을 알리며, 계속 주행하면 모터 과열 또는 배터리 방전이 발생할 수 있다. | 12 V 충전 경고등 | 139 / PDF 147 | 실제 전압 기준, monitor debounce, owner ECU, DTC |
| MAN-STR-001 | 전동 파워 스티어링 경고 | POWER ON self-check 뒤에도 EPS 경고가 지속되면 시스템 이상 가능성이 있다. | EPS 경고등 | 139 / PDF 147 | assist map, torque sensor data, steering ECU, CAN ID |
| MAN-TPMS-001 | 저압 경고 | TPMS는 각 휠 센서로 공기압을 감시하며 저압 시 경고 및 위치/압력 정보를 제공한다. 주행 시작 후 표시까지 약 1–2분 걸릴 수 있다. | 저압 경고등, 개별 위치/압력 | 139–140, 517–518 / PDF 147–148, 525–526 | 무선 protocol, sensor ID, sampling rate, 저압 판정 수치 |
| MAN-TPMS-002 | 저압의 영향과 조치 | 현저한 저압은 차량 안정성을 떨어뜨리고 제동거리를 늘리며 타이어 과열을 일으킬 수 있다. 속도를 줄이고 급조향을 피하며 압력을 조정해야 한다. | 차량 거동과 경고 | 140, 518 / PDF 148, 526 | tyre model parameter, slip threshold, exact risk curve |
| MAN-TPMS-003 | 온도에 따른 저압 표시 | 추운 날씨 등 온도 변화로 공기압이 낮아져 경고가 켜질 수 있으며 이것만으로 TPMS 시스템 고장이라고 할 수 없다. | 저압 경고등 | 518 / PDF 526 | 온도 보정 algorithm, 압력/온도 transfer function |
| MAN-TPMS-004 | TPMS 시스템 이상 패턴 | TPMS 자체 이상 시 경고등이 약 1분간 깜빡인 뒤 계속 켜질 수 있고 개별 위치 표시가 사라질 수 있다. | 점멸 후 지속 점등, 위치 표시 소실 | 519 / PDF 527 | blink command owner, diagnostic event memory, DTC |
| MAN-TPMS-005 | TPMS 방해·대체 휠 | RF 간섭, 체인, 외부 전자기기, 비호환 센서/휠, 실런트 등이 TPMS 동작을 방해할 수 있다. spare wheel 사용 시 경고가 나타날 수 있고 정상 휠 복원 후 주행하면 해제될 수 있다. | 시스템 이상 경고 및 위치 정보 변화 | 519 / PDF 527 | RF frequency/channel, pairing protocol, exact clear counter |
| MAN-TPMS-006 | 급격한 타이어 손상 | 갑작스러운 외부 요인에 의한 타이어 손상은 TPMS가 즉시 감지하지 못할 수 있다. | 지연 또는 미검출 가능 | 520 / PDF 528 | detection latency guarantee, sensor update rate |
| MAN-LGT-001 | LED 전조등 이상 | LED 전조등 이상 경고가 표시될 수 있으며 계속 주행하면 LED 수명이 줄 수 있다. 관련 점검 메시지도 제공된다. | 경고등/메시지 | 141, 151 / PDF 149, 159 | lamp driver 회로, current threshold, DTC, owner ECU |
| MAN-EV-004 | DRIVE READY | READY 표시는 차량이 주행 가능한 상태임을 의미한다. 표시가 꺼지거나 깜빡일 때 이상 가능성이 있다. | READY indicator | 143 / PDF 151 | internal state enum, transition timeout, inverter enable signal |
| MAN-EV-005 | 파워다운 | 저충전, 전압 저하, 고/저온, 구동계 보호 등에 의해 출력 제한이 발생할 수 있다. 단독 표시는 반드시 고장이 아니며 서비스 경고 동반 여부를 함께 봐야 한다. | power-down 표시, 속도/등판 성능 제한 | 143 / PDF 151 | torque limit map, thermal thresholds, fault owner, DTC |
| MAN-BRK-002 | Auto Hold 표시 | Auto Hold는 white standby, green active, yellow anomaly 상태로 표시된다. 조건 불충족이나 이상 시 운전자가 직접 brake를 사용해야 한다. | white/green/yellow indicator | 143, 346, 348–349 / PDF 151, 354, 356–357 | hydraulic state machine, pressure target, timing, ECU owner |
| MAN-EV-006 | 12 V 리튬 보조 배터리 메시지 | 온도나 충전 상태 관련 이상 메시지가 표시될 수 있다. | cluster message | 151 / PDF 159 | battery chemistry calibration, threshold, BMS topology, DTC |
| MAN-GEAR-001 | 시동/주행 준비 절차 | P, brake, 키/인증 등의 조건을 거쳐 DRIVE READY로 진입하며 전원 상태와 주행 가능 상태가 구분된다. | OFF/POWER ON/DRIVE READY | 321–324 / PDF 329–332 | actual ECU sequence, task timing, interlock threshold |
| MAN-GEAR-002 | 전자식 변속 다이얼 | brake를 밟고 P/R/N/D를 선택하며 방향 변경 전 완전 정차해야 한다. 선택 위치는 cluster/selector로 확인한다. | shift position과 운전자 입력 | 327–331 / PDF 335–339 | `GearLogic` 명칭, 0.5 m/s interlock, internal signal/API |
| MAN-GEAR-003 | 자동 P 사례 | D 정차 중 운전석 문이 열리는 등 일부 조건에서는 P로 자동 전환될 수 있다. | 변속 위치 변화 | 327 / PDF 335 | condition evaluation owner, message sequence, debounce |
| MAN-REGEN-001 | 회생 제동 기본 | 회생 제동은 감속 에너지를 전기 에너지로 바꾸며 paddle로 단계를 조절하고 cluster에서 level을 확인할 수 있다. | 감속 변화, regen level | 332–335 / PDF 340–343 | torque blending signal, motor command, exact map/rate |
| MAN-REGEN-002 | 회생 제동 제한 | SCC 사용, 배터리 충전 상태, terrain/DBC 등 조건에서 단계 변경이 제한될 수 있으며 노면·차량 상태에 따라 회생만으로 정차하지 못할 수 있다. | level 변경 제한, 직접 brake 필요 | 332–335 / PDF 340–343 | SOC=100% 내부 처리, blending thresholds, control period |
| MAN-REGEN-003 | 스마트 회생 | 경사, 주행 습관, 선행차와 도로 정보를 이용해 회생량을 조절하며 AUTO 표시와 기능 제한 조건이 있다. | AUTO 표시, 감속량 변화 | 336–343 / PDF 344–351 | sensor fusion algorithm, ECU partition, CAN messages |
| MAN-ADAS-001 | 센서 가림/기상 제한 | 눈·비·안개·폭우·오염 등으로 센서 인식이 제한되어 경고 또는 기능 제한이 발생할 수 있으며, 장애물 제거 후 회복될 수 있다. 이것만으로 실제 센서 고장이라고 단정할 수 없다. | 경고문, 기능 제한/미작동 | 386 / PDF 394 | obstruction threshold, fusion confidence, diagnostic code |
| MAN-ADAS-002 | FCA 인식 한계 | 센서 가림이나 환경 조건에서 FCA가 제한될 수 있으며 기능이 운전자 책임을 대체하지 않는다. | 경고 및 기능 제한 | 396–397 / PDF 404–405 | perception model, object list signal, TTC threshold, ECU/CAN |

## 4. 해석 제약 레코드

| Constraint ID | 반드시 지킬 해석 | 금지되는 추론 |
|---|---|---|
| CST-001 | 경고등과 메시지는 운전자 관측 근거다. | 경고 표시만으로 특정 ECU·signal·DTC를 확정하지 않는다. |
| CST-002 | power-down은 여러 보호 조건에서 나타날 수 있다. | power-down 표시를 곧바로 부품 고장 또는 CASE-PT-001과 동일 원인으로 취급하지 않는다. |
| CST-003 | TPMS 저압과 TPMS 시스템 이상은 서로 다른 관측 패턴이다. | 저압 경고를 센서 고장으로, 시스템 이상 경고를 실제 저압으로 자동 변환하지 않는다. |
| CST-004 | 기상/오염에 의한 sensor obstruction은 정상적인 제한 상태일 수 있다. | obstruction을 곧바로 sensor failure로 판정하지 않는다. |
| CST-005 | 설명서의 “약 1분”, “1–2분”은 운전자 안내 범위다. | ECU task period, debounce counter, formal timing oracle로 직접 사용하지 않는다. |
| CST-006 | 설명서의 기능은 사양/옵션에 따라 다를 수 있다. | 대상 차량의 장착 여부를 확인하지 않고 모든 기능을 기본 장착으로 가정하지 않는다. |
| CST-007 | 설명서가 내부 구조를 언급하지 않는 것은 정보 부재다. | 미언급을 현재 TRACKBACK 모델과의 충돌로 분류하지 않는다. |

## 5. 현재 프로젝트 Claim Register

| Claim ID | 현재 프로젝트 주장 | 근거 출처 | 현재 분류 | 필요한 표시/조치 |
|---|---|---|---|---|
| PRJ-001 | `DriverInput → GearLogic → PropulsionFunction → VMC → eDrive → DriveAdapter → VehiclePhysics` 실행 경로 | SRC-REPO-001 | TRACKBACK_RUNTIME_FACT | 실행 가능한 게임 모델임을 표시 |
| PRJ-002 | `PropulsionFunction → VMC → eDrive`가 Reference Vehicle의 실제 내부 ECU 분할이다 | 해당 근거 없음 | ASSUMED / UNVERIFIED_INTERNAL | 실제 차량 구조로 표현 금지 |
| PRJ-003 | D/R 전환 허용 속도는 0.5 m/s다 | SRC-CAL-001 | SIMULATION_ASSUMPTION | GV70 임계값으로 표현 금지 |
| PRJ-004 | `PropulsionRequest`, `DriveTorqueRequest`, `EDriveCommand`가 실제 차량 신호다 | SRC-CASE-001, SRC-REPO-001 | TRACKBACK_MODEL_SIGNAL | 실제 bus signal로 표현 금지 |
| PRJ-005 | CASE-PT-001의 root cause는 eDrive incorrect scaling이다 | SRC-CASE-001 | TRACKBACK_CASE_TRUTH | 실제 GV70 고장 원인으로 표현 금지 |
| PRJ-006 | CASE-PT-001에서 출력 반응 저하가 관찰된다 | SRC-REPO-001, SRC-CASE-001 | TRACKBACK_RUNTIME_FACT | 매뉴얼의 power-down과 “유사 증상” 이상으로 동일시 금지 |
| PRJ-007 | Reference Vehicle Registry의 74 functions/111 signals/50 interfaces는 실제 OEM architecture다 | SRC-REF-001만 존재 | REVIEWED_DRAFT / ASSUMED | 검토 중 논리 참조 설계로 표시 |
| PRJ-008 | Registry의 candidate requirements/tests가 승인된 oracle이다 | SRC-REF-001 | UNKNOWN / NOT_APPROVED | 승인 전 formal PASS oracle로 사용 금지 |
| PRJ-009 | Fault Injection의 override/drop이 실제 차량 failure mechanism이다 | SRC-REPO-001 | SIMULATION_ASSUMPTION | 교육용 주입 모델로 표시 |
| PRJ-010 | 60 Hz simulation step이 ECU runnable timing이다 | SRC-REPO-001 | SIMULATION_ASSUMPTION | game physics step으로만 표시 |
| PRJ-011 | Braking/Steering/Stability/ADAS/Occupant의 새 시나리오 계산이 GV70 OEM 제어 로직이다 | 해당 근거 없음 | SIMULATION_ASSUMPTION / TRACKBACK_EXECUTION_MODEL | 교육용 실행 모델임을 표시하고 기본 레이스 동작은 opt-in 없이 바꾸지 않음 |
| PRJ-012 | 시나리오 앞차의 상대거리·속도와 route lane error가 실제 센서/perception 출력이다 | SRC-REPO-001 | TRACKBACK_RUNTIME_FACT | Rapier actor와 configured route의 직접 계산값이며 센서 모델·CAN signal로 표현 금지 |
| PRJ-013 | 74개 canonical function이 모두 독립 검증 가능하다 | 해당 근거 없음 | FALSE CLAIM | 74개는 차량 시나리오 관찰 가능, 독립 Expected/PASS·FAIL runner는 10개로 분리 표시 |

## 6. 향후 Case별 필수 Source Binding

새 case는 구현 전에 최소한 다음 연결을 가져야 한다.

| 필드 | 요구 사항 |
|---|---|
| `source_record_ids` | 위 `MAN-*` 또는 추가 승인 출처의 안정 ID |
| `driver_observable_claim` | warning, message, vehicle behavior처럼 문서가 직접 지지하는 관측 |
| `applicability` | 모델/시장/옵션 확인 상태 |
| `runtime_model_source` | TRACKBACK 실행 코드/모델 위치 |
| `simulation_assumptions` | threshold, timing, physics, fault mechanism의 별도 목록 |
| `unknown_internals` | ECU, CAN, DTC, internal signal 등 미확인 항목 |
| `evidence_contract` | 플레이어가 실제로 관찰할 수 있는 evidence와 sufficiency |
| `oracle_authority` | owner manual fact, approved engineering source, 또는 game-model oracle 구분 |

## 7. 추가 근거가 필요한 항목

다음은 이 취급설명서만으로 확정할 수 없다.

- 실제 ECU 이름, 개수, 배치, 책임 분할
- CAN/CAN-FD/Ethernet topology, CAN ID, payload, endianness, update period
- 내부 software component와 runnable/task 구조
- 내부 signal 명칭, 단위, range, validity encoding
- DTC 번호, setting/clearing condition, freeze frame
- monitor debounce, hysteresis, exact fault threshold
- 실제 propulsion/brake/steering torque·force·angle calibration
- 정비 진단 절차와 부품 교환 판정

이 항목을 게임의 사실 계층으로 올리려면 승인된 service manual, wiring diagram, diagnostic manual, interface specification 또는 동등한 기술 출처가 추가로 필요하다. 근거가 없으면 `UNVERIFIED_INTERNAL` 또는 `SIMULATION_ASSUMPTION`으로 유지한다.

## 8. 변경 관리

- 원문 PDF가 바뀌면 hash와 페이지 mapping을 다시 확인한다.
- source record의 의미가 바뀌면 기존 ID를 덮어쓰지 말고 새 ID와 supersedes 관계를 만든다.
- 설명서 fact를 runtime 구현으로 바꿀 때는 별도의 설계 승인과 test oracle 승인을 거친다.
- 이 등록부 작성만으로 기존 Reference Vehicle Registry, CASE-PT-001, C/WASM 또는 gameplay truth는 변경되지 않는다.
