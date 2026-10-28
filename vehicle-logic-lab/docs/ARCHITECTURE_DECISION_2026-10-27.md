# 차량 아키텍처 학습 범위 결정

## 선택 기준

첨부된 다섯 관점은 경쟁하는 레이어가 아니다. 같은 차량에 던지는 질문이 다르다.

| 관점 | 질문 | 게임의 현재 표현 |
| --- | --- | --- |
| 기능 | 차량이 무엇을 해야 하는가? | System → Domain → Function → Logic 기능 트리와 요구 사례 |
| 물리 | 어떤 장치로 구현하는가? | 배터리·인버터·모터·제동기·조향기·바퀴의 조립 및 차량 동역학 |
| E/E | 제어기와 신호를 어디에 배치·연결하는가? | 교육용 VCU/도메인 제어기와 배선 경계. 실제 CAN/Ethernet 스택은 없음 |
| SW | 기능을 어떤 계산으로 구현하는가? | `MODEL_SPECS`의 Inport → 연산 → Outport Application 기능 모델 |
| 검증 | 요구 동작을 어디에서 확인하는가? | 기능별 독립 입출력 사례 + 통합 차량 모형 주행. 양산용 HIL/차량 시험 아님 |

메인 탐색축은 **기능 분해(System/Domain/Function/Logic)**로 선택한다. 학습자는 구동에 필요한 한 기능을 만들고 바로 기계 동작을 보면서 반복한다. 물리·E/E·SW·검증은 기능 트리의 부모/자식 레벨이 아니라, 선택한 기능을 옆에서 보는 관점이다. `MODEL_SPECS: Record<LogicId, ModelSpec>`는 **Function 내부의 Application SW 계산 경계**다. E/E 전체, AUTOSAR 패키지, 모터 전류 루프 전체를 뜻하지 않는다.

## AUTOSAR와의 관계

AUTOSAR Classic의 Application SW / RTE / BSW는 ECU 내부 플랫폼 구분이다. 이 프로젝트는 학습자가 Application 기능을 블록 연결로 표현하지만 RTE·BSW·드라이버·ARXML을 생성하지 않는다. Adaptive의 서비스 지향 컴퓨팅과도 다르다. 교육용 E/E는 VCU와 기능별 제어기를 단순화한 도메인 지향 개념도이며, 실제 도메인 ECU 제품 아키텍처나 zonal 할당이 아니다.

참고: [AUTOSAR Classic Platform](https://www.autosar.org/standards/classic-platform/), [AUTOSAR Adaptive Platform](https://www.autosar.org/standards/adaptive-platform), [Simulink 모델 계층 이동](https://www.mathworks.com/help/simulink/ug/navigate-model-hierarchies.html).

## 현재 제작/제공/미구현

- 학습자가 제작·검증: 전력 사용 허용, 운전자 토크 요청, 전진 구동 인터록, 마찰 제동력 요청, 앞바퀴 각도 요청, 도메인 출력 통합.
- 제공되는 기반: READY 상태기, 기어 상태, 페달 센서 입력, BMS 사용 가능 신호, 인버터/모터 내부 응답, 액추에이터, 수동 현가, 차량 동역학.
- 아직 직접 제작하지 않음: 충전/OBC/DC-DC/12V, BMS·열관리, 회생 제동·ABS·ESC, EPS 보조 토크, 통신·진단·고장 대응, 조명·차체·안전 시스템. 따라서 ‘주행 핵심 신호의 교육용 부분 모델’이지 ‘필수 차량 기능 모두 제작’은 아니다.

## 확장 순서

1. 같은 기능 트리 안에 상태·시간축(READY/충전·지연)을 직접 제작 가능한 기능으로 승격한다.
2. 에너지(BMS·충전·12V), 제동(회생·ABS/ESC), 조향(EPS), 열관리, 차체·조명 기능을 독립 요구사항과 테스트로 추가한다.
3. 기능-물리-E/E-SW-검증 간 추적 링크를 확장하고 네트워크/진단·고장 상태를 모델링한다.
4. 그 뒤 AUTOSAR Classic 개념 실습은 별도 플랫폼 학습 모드로 분리한다. 블록 모델을 실제 ARXML이라고 표시하지 않는다.

사용자 요청의 ‘필수 기능 모두 만들기’는 이 확장 순서의 목표이며 현재 완료 판정이 아니다.
