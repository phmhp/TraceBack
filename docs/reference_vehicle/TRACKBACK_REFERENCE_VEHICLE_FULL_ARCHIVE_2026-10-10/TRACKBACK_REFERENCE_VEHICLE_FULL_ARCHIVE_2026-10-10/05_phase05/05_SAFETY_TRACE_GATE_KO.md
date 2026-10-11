# TRACKBACK — Phase 05 Safety Trace 분리 및 HARA 시작 Gate

> 상태: **HARA 미수행 / SG·ASIL·FSR·TSR 미승인**. 아래 표는 위험 분석 워크숍에서 물을 질문일 뿐, 실제 차량 위험 분석이나 안전 요구사항이 아니다.

## 1. 일반 기능 Requirement와 기능안전 Requirement의 차이

| 일반 기능 경로 | 안전 관련 분석을 거친 경로 |
|---|---|
| 사용자 기능 FR → 차량 SYSR → SWR/SIMR → TC | Item Definition → malfunctioning behavior/operational situation → hazardous event → S/E/C 기반 HARA 분류 → SG → FSR → TSR → HW/SW safety req → verification |

- 일반 SYSR이 위 경로의 SG/FSR/TSR로 자동 승격되는 게 아니다.
- 특정 기능에 고장 가능성이 있다는 사실만으로 Safety Goal 및 ASIL을 부여할 수 없다.
- ISO 26262를 참고해 교육 목적으로 구조를 설계하되 실제 ASIL 등급/안전 목표는 관련 Item Definition, HARA, 안전 메커니즘·검증 근거가 있어야만 승인된다.

## 2. 16개 영역: 위험 상황을 위한 질문 목록

| 영역 | 분석 후보 질문 (결론 아님) | 분석 전제·필요 자료 |
|---|---|
| 운전자·환경 | 가속·제동 입력을 잘못 인식하거나 환경 상태가 다른 것으로 제공되는 상황 | 운용 상황·입력원·sensor assumptions |
| 차량 상태·모드 | 구동 허용이 아닌데 구동이 허용되거나 주행 가능 상태가 잘못 표시되는 상황 | Item permission owner 및 실제 vehicle-ready 조건 |
| Gear | 의도하지 않은 방향 요구가 구동계에 반영되는 상황 | 전환 상황·차량 속도·gear actuator 모델 |
| Propulsion | 의도하지 않은 추진 토크 또는 요구 토크 손실 상황 | 토크 변환·상황·운전자 개입·실제 output |
| Braking | 필요 제동 부족 또는 의도하지 않은 제동이 발생하는 상황 | brake-by-wire 유무·제동 성능·실차 관련 제어 범위 |
| Steering | 의도하지 않은 조향 또는 조향 요구 불이행 상황 | EPS/SbW 장치 타입·운전자 기계적 제어 능력 |
| Stability | 슬립·횡거동 상황에서 부적절한 개입 또는 미개입 상황 | wheel speed/yaw sensing·tire dynamics |
| ADAS | 필요하지 않은 보조 제동 또는 유효 위험에서 기능 미작동 상황 | 인지 성능·ODD·driver authority |
| Motion Coordination | 동시에 들어온 차량 운동 요구가 충돌하여 잘못된 명령을 내는 상황 | arbitration 정책·actuator allocation·failure modes |
| Sensing | 차량 속도·상태를 잘못 추정해 제어기의 판단이 달라지는 상황 | sensor 구성·고장 감지·timestamp |
| Power/Energy | 전력 한계 또는 HV 가용성 판단 오류가 추진/회생 동작에 영향을 주는 상황 | battery/inverter architecture·HV safety 분석 |
| Occupant Safety | 충돌과 무관하게 전개하거나 전개 필요 상황에서 작동하지 않는 상황 | impact severity·restraint models·승인된 deployment criteria |
| Fault/Diagnostics | 확정 고장을 잘못 무시하거나 잘못된 제한 반응으로 이어지는 상황 | 진단 감시 대상·고장 지속·Fault Tolerant Time Interval |
| Communication | 중요 제어 메시지가 지연·누락·변조되어 소비될 수 있는 상황 | network topology·message timing·error model |
| Execution | 태스크 정지 또는 순서·기한 위반으로 명령이 제때 제공되지 않는 상황 | runtime timing budget·supervision |
| Actuation/Plant | 제어 명령과 실제 작동 효과가 다르거나 환경 상태를 잘못 반영하는 상황 | 실물 작동계/plant 검증 범위 |

## 3. Case 기반 Safety Trace 입력 계약

```text
Case Source Fact (공개 NHTSA/TSB 등)
   ↘ 실제 자료에서 확인된 malfunctioning behavior / 상황
TrackBack synthetic design decision
   ↘ reference operational situation / scenario assumptions
          ↘ HARA WORKSHEET (separate, pending)
                ↘ SG [only after reviewed HARA]
                  ↘ FSR [functional safety concept]
                    ↘ TSR [technical safety concept]
                      ↘ SW/HW Safety Requirements
                        ↘ Safety Verification Evidence
```

**절대 혼합하지 않을 것:** `REAL-WORLD SOURCE`, `STANDARD REFERENCE`, `TRACKBACK MODEL`, `SIMULATION EVIDENCE`를 각각 표시한다. 공개 사례의 고장 명칭만으로 실제 OEM Safety Goal/ASIL을 역설계했다고 주장하지 않는다.

## 4. 안전 분석 워크시트 필수 필드

| 필드 | 설명 | 현재 상태 |
|---|---|
| Item/Boundary | 대상 vehicle feature, physical ECU, plant/driver/environment 경계 | OPEN |
| Malfunctioning Behavior | 기능 오작동의 정확한 현상. defect/injection 방식과 분리 | Case별 작성 가능, 승인 전 |
| Operational Situation | 노면·속도·교통·운전자 상태 등 운용 맥락 | OPEN |
| Hazardous Event | Malfunctioning Behavior + Operational Situation에 의해 발생 가능한 위험 상황 | OPEN |
| S/E/C Evidence | 심각도·노출 가능성·제어 가능성 근거 및 자료 출처 | OPEN |
| ASIL/QM Rationale | 적용 분류의 근거와 승인자 | NOT ASSESSED |
| Safety Goal | 예방/제어할 위험과 안전 상태 목표 | NOT CREATED |
| Safe State/FTTI | 목표 안전 상태, 허용 반응 시각의 근거 | NOT ASSESSED |
| FSR/TSR/SW Allocation | 안전 메커니즘과 설계·독립성 할당 | NOT CREATED |
| Verification Evidence | 요구사항별 적용 시험과 실제 관측·오라클 | NOT AVAILABLE |

## 5. Safety Trace가 필요한 실제 예시인지 평가할 Gate

1. 차량 Item/ODD와 현실적 작동 구성 확정
2. 고장/오작동과 외부 상황을 구체적으로 기술하고 공개 사실·재구성 분리
3. HARA의 S/E/C, ASIL 분류 및 내부 승인 완료
4. Safety Goal 및 허용 가능한 Safe State 도출
5. Safety Mechanism/FSR/TSR/분할 SW/HW 안전 요구사항 할당 승인
6. 추적성과 독립적 검증, 리뷰 이력 저장

> **현재 이 Gate를 통과한 안전 요구사항은 없음.** Phase 05의 후보 FR/SYSR/SWR/SIMR에 임의 SG 연결을 하지 않았다.
