# 외부 공학 검증 대상

Repository evidence만으로 다음 결정을 신뢰성 있게 확정할 수 없다. 아래 항목은 외부 표준을 임의 해석해 닫지 않는다.

| ID | 설계 질문 | Repository 근거가 부족한 이유 | 필요한 권위 자료 | OPEN으로 남길 결정 |
|---|---|---|---|---|
| EXT-01 | ABS는 request, constraint, modulator 중 무엇인가 | wheel slip sensor/개별 wheel actuator/brake architecture 없음 | 승인된 brake/stability functional architecture와 supplier/OEM interface contract | ABS placement와 final command owner |
| EXT-02 | TCS/ESC의 torque와 brake 요청 순서는 무엇인가 | 실제 stability controller/actuator allocation 없음 | vehicle dynamics control architecture와 arbitration specification | constraint order와 allocation |
| EXT-03 | Brake blending owner는 누구인가 | regen/energy/friction 모델 없음 | brake-by-wire/regen blending concept와 actuator capability | total brake target과 split owner |
| EXT-04 | Steering 공통 request는 angle/torque/curvature 중 무엇인가 | host wheel-angle mapping만 존재 | EPS/SbW interface specification 및 lateral-control concept | lateral request type |
| EXT-05 | Driver/LKA/ESC authority는 어떻게 정하는가 | driver override/EPS torque sensing/ESC output 없음 | approved lateral authority and HMI/override requirements | priority와 transition guards |
| EXT-06 | ADAS는 motion request 또는 actuator request를 내는가 | perception/ODD/coordination runtime 없음 | system architecture and ADAS feature interface requirements | ACC/AEB/LKA output contracts |
| EXT-07 | Real Vehicle State owner와 readiness 조건은 무엇인가 | host physics attachment/enable assumption뿐 | vehicle state/mode management specification | readiness/permission owner |
| EXT-08 | Diagnostic confirmation/recovery semantics는 무엇인가 | injection telemetry만 있고 DTC/debounce/rearm 없음 | diagnostic concept, fault lifecycle, service requirements | detection/confirmation/clear/rearm rules |
| EXT-09 | Future multi-rate scheduler timing은 무엇인가 | 60 Hz integrated loop 외 runnable scheduler 없음 | platform timing budget, task/runnable schedule, network timing contract | sample/hold/age/order/delay model |
| EXT-10 | Calibration과 tolerance를 어떤 근거로 승인하는가 | 값이 game simulation assumption이며 REVIEW_REQUIRED | model validation, engineering calibration review, numerical resolution/uncertainty analysis | verdict-authorizing calibration/tolerance |
| EXT-11 | Rapier plant fidelity claim 범위는 어디까지인가 | arcade force gain과 제한된 tire/sensor model | plant validation plan, parameter source, correlation evidence | educational vs engineering fidelity claim |
| EXT-12 | Safety architecture와 ASIL은 무엇인가 | Item Definition/HARA/S-E-C/SG/FSR/TSR 없음 | formally reviewed Item Definition and HARA/safety lifecycle artifacts | 모든 safety allocation/classification |

총 외부 검증 대상은 **12개**다. 이 결정들은 필요한 자료와 승인자를 확보하기 전까지 OPEN이다.
