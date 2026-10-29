# TRACKBACK 취급설명서 대비 기술 정합성 Gap 분석

> 기준 문서: `docs/reference/JKEV_2027_ko_KR.pdf`  
> 작성일: 2026-10-15  
> 주의: 본 분석은 운전자 취급설명서와 현재 게임 구현의 비교다. 취급설명서는 ECU/SW/네트워크 상세 설계서가 아니다.

## 1. 분류 규칙

| 분류 | 의미 |
|---|---|
| VERIFIED | 취급설명서가 해당 운전자 관측 사실 또는 작동 조건을 직접 설명함 |
| CONSISTENT | 문서 사실과 모순되지 않지만 내부 구조·수치·인과는 문서로 확인되지 않음 |
| ASSUMED | 게임 실행을 위해 프로젝트가 명시적으로 만든 설계·calibration·fault 가정 |
| CONFLICT | 취급설명서의 명시적 설명과 현재 주장이 양립할 수 없음 |
| UNKNOWN | 판단 가능한 외부 근거가 부족함 |

문서에 없다는 이유만으로 `CONFLICT`로 분류하지 않는다. `VERIFIED`는 claim 단위로만 사용하며, 한 기능의 운전자 표시가 VERIFIED여도 관련 ECU·신호명·진단 알고리즘까지 VERIFIED가 되지는 않는다.

## 2. 취급설명서에서 확인된 게임 활용 기능

PDF 물리 페이지는 뷰어 기준이며, 매뉴얼 페이지는 본문 하단 인쇄 페이지다.

| 기능 | 목적 | 운전자 인지 동작 | 작동 조건·제한 | 경고·증상 | 페이지 | 확인되지 않은 내부 정보 |
|---|---|---|---|---|---|---|
| DRIVE READY / 전원 상태 | 주행 가능 상태와 전원 상태 구분 | READY 표시 후 주행 가능 | P, 브레이크, 키/인증 등 사용자 절차; 사양에 따라 차이 | READY가 꺼지거나 깜빡이면 차량 이상 가능 | 매뉴얼 321–324 / PDF 329–332 | 상태 owner ECU, 내부 state ID, transition timing |
| 전자식 변속 다이얼 | P/R/N/D 선택 | 클러스터/다이얼에 실제 변속 위치 표시 | 브레이크를 밟고 조작; 완전 정차 후 방향 변속; D 정차 중 운전석 문 열림 시 자동 P | 선택 위치 확인 필요 | 327–331 / PDF 335–339 | D↔R 0.5 m/s 문턱, `GearLogic`, signal/API 이름 |
| 회생 제동 | 감속 에너지를 전기 에너지로 변환 | 패들로 단계 증감, cluster level 표시 | SCC, SOC 100%, terrain/DBC 등에서 변경 제한; 노면/차량 상태에 따라 정차 불가 가능 | 제한 조건에서 직접 브레이크 필요 | 332–335 / PDF 340–343 | blending SW, torque signal, exact map/timing |
| 스마트 회생 | 경사·주행 습관·선행차 등에 맞춰 회생량 조절 | AUTO 표시와 감속 변화 | 기능 조건 및 센서 인식 한계 존재 | 센서 오염 시 일시 중지될 수 있음 | 336–343 / PDF 344–351 | 레이더/ECU 배치, CAN, control algorithm |
| 회생 제동/브레이크 이상 | 브레이크 이상 시 운전자에게 위험 고지 | 회생 제동 미작동, pedal이 깊게 느껴지거나 제동거리 증가 가능 | 경고등 상태에 따라 안전 감속·점검 | 회생/브레이크 경고등 | 138 / PDF 146 | failure detector, DTC, fault threshold |
| 12 V 충전 계통 | 저전압 전장 공급/충전 이상 고지 | 12 V 충전 경고등 | 경고 지속 시 충전 계통 점검 | 계속 주행 시 모터 과열 또는 방전 가능 | 1, 139, 151 / PDF 9, 147, 159 | 배터리 ECU, 센서·전압 threshold, DTC |
| 고전압 저충전/파워다운 | 고전압 부품 보호 및 출력 제한 | charge warning, power-down 표시, 속도/등판 성능 제한 가능 | 저SOC·전압강하·고/저온·구동계 보호 | power-down 단독은 반드시 고장이 아님; service warning 동시 표시는 점검 대상 | 137, 143 / PDF 145, 151 | SOC threshold 외 내부 limit logic, thermal model, ECU |
| TPMS 저압 | 타이어별 공기압 감시 | 저압 경고등, 개별 위치/압력 표시 | 주행 후 1–2분 뒤 표시 가능; 온도 영향 | 저압 시 속도 감소·급조향 회피·공기압 조정 | 139–140, 517–518 / PDF 147–148, 525–526 | 저압 기준 수치, radio protocol, sensor ID |
| TPMS 시스템 이상 | 감시 시스템 자체 이상 구분 | 경고등이 약 1분 깜빡인 후 켜짐; 위치 표시 소실 가능 | 간섭·체인·외부 전자기기·센서/휠/실런트 영향 가능 | 즉시 점검 권고 | 519–520 / PDF 527–528 | diagnostic algorithm, DTC, RF protocol |
| 전동 파워 스티어링 이상 | 조향 보조 이상 고지 | EPS 경고등 | POWER ON self-check 후 꺼지는 정상 패턴 | 지속 점등 시 점검 | 139 / PDF 147 | steering ECU, assist map, torque sensor signal |
| LED 전조등 이상 | 조명 이상 고지 | LED 전조등 경고등/메시지 | POWER ON 및 lamp 상태 | 계속 주행 시 LED 수명 단축 가능 | 141, 151 / PDF 149, 159 | lamp driver topology, current threshold, DTC |
| 운전자 보조 센서 가림 | 센서 인식 저하와 실제 고장 구분 | 경고문·통합/기능 경고등, 기능 제한 또는 미작동 | 눈·비·안개·폭우·오염; 제거 후 복구 가능 | 센서 가림은 고장이 아닐 수 있음 | 386, 396–397 / PDF 394, 404–405 | sensor fusion, ECU, CAN, detection thresholds |
| Auto Hold | 브레이크 해제 후 정차 유지 | white standby, green active, yellow fault | 정차, door/hood/tailgate 등 조건; P/EPB 중 미작동 | yellow은 이상; 조건 불충족 시 직접 brake 필요 | 143, 346, 348–349 / PDF 151, 354, 356–357 | brake ECU state machine, timing, pressure target |

## 3. 현재 구현과 문서의 정합성 매트릭스

| 현재 구현/주장 | 분류 | 근거와 해석 | 조치 |
|---|---|---|---|
| 속도, 기어, 페달 입력을 driver-observable 정보로 표시 | CONSISTENT | 매뉴얼도 speed/shift/driver controls를 운전자 정보로 다룸 | source label만 추가 |
| `P/N/D/R` 상태와 D/R 방향 주행 | CONSISTENT | 매뉴얼에 선택 위치와 용도가 있음 | 게임이 전체 변속기 구현이라고 주장하지 않기 |
| 시작부터 GearState D, `vehicleReady=true`, `propulsionEnable=true` | ASSUMED | race 세션을 이미 DRIVE READY 이후로 모델링한 것으로 볼 수 있음 | scenario precondition으로 명시; start-state 재현으로 표현 금지 |
| D↔R 전환 허용 기준 0.5 m/s | ASSUMED | 매뉴얼은 완전 정차 후 변속을 지시하지만 0.5 m/s 내부 문턱은 제시하지 않음 | 실차 수치처럼 표시 금지 |
| `PropulsionFunction → VMC → eDrive` 내부 체인 | ASSUMED | 취급설명서는 이 SW 분할이나 owner를 설명하지 않음 | TRACKBACK_LOGICAL_MODEL 라벨 유지 |
| `PropulsionRequest`, `DriveTorqueRequest`, `EDriveCommand` | ASSUMED | 매뉴얼에 해당 내부 signal 명칭/단위/전송이 없음 | 프로젝트 신호임을 명시 |
| 방향별 180/130 Nm, torque-to-force 10 N/Nm | ASSUMED | 소스도 simulation assumption이라고 명시 | OEM calibration과 분리 유지 |
| CASE-PT-001 가속 반응 저하 증상 | CONSISTENT | 매뉴얼은 power-down에서 출력/등판 제한 가능성을 설명하지만 현재 사건은 별도 SW defect | 유사 증상일 뿐 동일 원인으로 매핑 금지 |
| CASE-PT-001의 eDrive 0.5 scaling root cause | ASSUMED | 교육용 C variant이며 매뉴얼 내부 근거 없음 | case provenance를 `TRACKBACK_MODEL`로 유지 |
| 사건 후 SimulationClock/physics 정지 | ASSUMED | gameplay/investigation transition이며 차량 거동 사실이 아님 | gameplay layer로만 기술 |
| incident time loss | ASSUMED | 실제 telemetry가 아닌 게임 penalty로 분리되어 있음 | 현재 분리 유지 |
| Last Normal / First Abnormal | CONSISTENT | 일반적인 검증·추론 기법으로 문서와 모순되지 않음 | 근거는 runtime evidence로 한정 |
| VMC/eDrive 독립 C/WASM PASS/FAIL | CONSISTENT | TRACKBACK 모델 자체의 요구사항·oracle에 대해서는 유효 | 실차/OEM PASS로 확대 금지 |
| vehicle scenario 기본 verdict `OBSERVED` | VERIFIED(저장소 정책) / CONSISTENT(문서) | 승인 expected가 없다는 한계를 올바르게 보존 | 유지 |
| 74개 reference LF를 동일 수준으로 실행 가능하게 표시 | CONFLICT(현재 정책과) | registry와 canonical docs는 VERIFIED/PARTIAL/DESIGN_ONLY를 구분함 | UI/문서에서 capability를 항상 표시 |
| sensor obstruction을 곧바로 센서 고장으로 판정 | CONFLICT(향후 구현 시) | 매뉴얼 386, 396은 오염/기상으로 일시 제한되며 고장이 아닐 수 있다고 명시 | obstruction/fault 별도 상태 필요 |
| power-down 표시를 곧바로 차량 고장으로 판정 | CONFLICT(향후 구현 시) | 매뉴얼 143은 단독 표시는 고장이 아닐 수 있다고 명시 | service warning 동반 여부 등 관측 분기 필요 |
| TPMS 저압과 TPMS system fault를 같은 사건으로 처리 | CONFLICT(향후 구현 시) | steady low-pressure warning과 blink-then-on system fault가 구분됨 | 두 case family 분리 |
| 실제 CAN ID, DTC, ECU owner가 존재한다는 주장 | UNKNOWN | 저장소와 매뉴얼 모두 근거 없음 | 외부 service/engineering source 전에는 생성 금지 |

## 4. 아키텍처 Gap

| Gap | 현황 | 영향 |
|---|---|---|
| 사용자 기능 vs 내부 논리 기능 | 매뉴얼은 driver-facing function, registry는 74 logical function | 1:1 매핑하면 허위 정밀도 발생 |
| 논리 기능 vs ECU | 현재 ECU allocation 없음 | ECU 단위 원인 선택을 제공할 근거 없음 |
| 전체 차량 reference vs runtime | 5 verified/27 partial/42 design-only | 대부분의 영역에 실제 계산/관찰/repair oracle 없음 |
| 실차 state model | READY, warning, limited operation facts는 있으나 구현은 narrow propulsion state | 실제 vehicle state를 재현한다고 주장할 수 없음 |
| physical plant | Rapier arcade model | 실제 GV70 dynamics/tyre/thermal/energy behavior와 비교 불가 |

## 5. 인터페이스·신호 Gap

- 실행 신호는 TypeScript/C 구조체의 함수 호출 데이터이며 차량 bus signal이 아니다.
- `eDrive → DriveAdapter`만 same-tick source/destination pair를 계측한다. 이는 독립 ECU/network 송수신 검증이 아니다.
- Reference signal 111개는 후보·logical semantics 중심이다. production names/ranges/freshness/timing이 아니다.
- 취급설명서는 경고등, 표시값, 운전자 조작, 기능 상태를 알려 주지만 내부 port, CAN ID, byte layout, update period를 제공하지 않는다.
- 향후 manual-derived observation은 `cluster warning state`, `displayed tyre position`, `driver input`, `vehicle response`처럼 운전자 관측 언어로 먼저 정의해야 한다.

## 6. 요구사항·상태 전이 Gap

- 현재 21개 Propulsion GroundTruth 요구사항은 프로젝트 모델에 대해 실행 가능하지만 manual citation이 없다.
- Reference requirement 180개는 모두 candidate이며 approved candidate oracle이 없다.
- 매뉴얼은 READY, AUTO HOLD, warning lamp self-check, TPMS warning pattern 등 일부 observable state transition을 제공한다.
- 매뉴얼은 내부 debounce, monitor cycle, runnable period, hysteresis를 제공하지 않는다. 해당 값은 `OPEN`으로 유지해야 한다.
- `POWER ON 후 약 3초`와 같은 self-check 표시 시간은 해당 표시 행동에만 적용해야 하며 ECU task period나 fault confirmation time으로 재사용하면 안 된다.

## 7. Fault 원인·증상 인과 Gap

현재 CASE-PT-001은 원인→신호 편차→차량 반응이 코드로 닫혀 있어 게임으로는 검증 가능하다. 그러나 그 인과는 GV70 실차의 eDrive fault model이 아니다.

취급설명서 기반 새 case에서는 다음 세 계층을 분리해야 한다.

1. **문서 사실:** 예: 저압이면 경고등과 타이어 위치/공기압이 표시될 수 있다.
2. **게임에서 관찰할 수 있는 결과:** 예: 특정 tyre pressure state, cluster warning, handling modifier.
3. **설계 가정:** pressure 감소율, sensor sampling, fault injection point, repair verification threshold.

원인 후보를 ECU·CAN·DTC 수준으로 내리려면 취급설명서 외의 승인된 정비 매뉴얼, 회로도, 진단 절차 또는 인터페이스 명세가 필요하다.

## 8. 플레이어 추론 Gap

- 현재 증거 체계는 실제 runtime frame/run ID에 연결되어 있어 강점이 있다.
- 그러나 플레이어가 보는 용어가 `VMC`, `eDrive`, `EDriveCommand` 등 프로젝트 내부 모델 중심이라 실제 차량 기능 학습과 혼동될 수 있다.
- 취급설명서 기반 case는 먼저 driver-observable symptom과 정상/제한/고장 구분을 학습시키고, 내부 원인은 “게임 모델의 추론 계층”임을 명시해야 한다.
- Page 2의 Reference Vehicle 전체 구조는 탐색 context이지 CASE-PT-001의 executable truth가 아니다.
- 요구사항 기반 TC, boundary/equivalence/fault injection은 서로 대체 관계가 아니다. 요구사항이 test basis이고, 설계 기법은 정상·비정상 input selection 방법이어야 한다.

## 9. 테스트·검증 Gap

| 대상 | 현재 가능 | 부족한 근거 |
|---|---|---|
| TRACKBACK C/WASM Propulsion | formal PASS/FAIL | 실차 SW 등가성 |
| Rapier vehicle scenario | 실제 runtime 관찰 | 승인 expected trajectory |
| Reference LF 74개 | 설계 TC 열람 | 실행 코드, approved oracle, tolerance |
| TPMS/lamps/battery/ADAS cases | manual-based observation 설계 | runtime model, injection, repair oracle |
| ECU/CAN/DTC | 없음 | OEM/service engineering source |

## 10. 우선 활용 가치가 높은 case 후보

| 우선 | 후보 | 이유 | 현재 준비도 |
|---|---|---|---|
| P0 | TPMS 저압 vs TPMS 시스템 이상 | 증상 패턴과 운전자 조치가 명확하고 둘을 구분하는 추리가 가능 | 매뉴얼 근거 강함, runtime 없음 |
| P0 | 센서 가림 vs 실제 운전자 보조 고장 | “경고가 곧 고장은 아님”을 가르치기 좋음 | 매뉴얼 근거 강함, sensor/environment actor 없음 |
| P1 | 12 V 충전 계통 경고 | 빈번·중요, observable warning 명확 | energy/electrical runtime 없음 |
| P1 | LED 전조등 이상 | 운전자 메시지와 단순 repair loop 구성 가능 | lighting runtime 없음 |
| P1 | 회생 제동/브레이크 이상 | 차량 반응과 경고 인과가 풍부 | 안전·brake model 위험 높음 |
| P2 | Auto Hold 상태/이상 | 조건 기반 상태 추론에 적합 | door/hood/EPB/pressure state 없음 |
| 보류 | FCA/AEB 작동 결함 | 문서가 풍부하지만 환경 actor와 safety behavior가 복잡 | 현재 runtime 범위 밖 |

## 11. 결론

직접 확인된 것은 **운전자 관측 수준의 기능과 경고 의미**다. 현재 게임의 내부 아키텍처·신호·정답은 대부분 **TRACKBACK 내부 모델로는 일관되지만 실차 내부 사양으로는 미검증**이다. 따라서 재설계는 기존 실행 case를 폐기하는 방식이 아니라, provenance를 명시하고 manual-backed observation layer를 추가한 뒤 case별로 실행 모델과 oracle을 별도 승인하는 순서가 안전하다.
