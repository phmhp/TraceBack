# EV 기준 차량과 기술 선택 지도

## 이번 차량의 기준

- 단일 모터 후륜구동 BEV. 전륜 두 바퀴는 조향, 후륜 두 바퀴는 구동한다.
- 운전대와 전륜 랙이 기계적으로 연결된 EPS. 운전자 조향각과 EPS의 보조 토크·모터 전류는 별도 신호다. 현재 조향 블록의 `FrontWheelAngle`은 차량 운동 모형의 각도 입력이다. 이를 EPS 모터 제어 구현으로 세지 않는다.
- 기능별 분산 E/E 배치: VCU, BMS, 인버터 제어, 제동 제어, EPS 제어. `Domain`은 기능 분해 이름이며 도메인 통합 ECU라는 뜻이 아니다.
- BEV의 충전/OBC, DC/DC·12V, 열관리, 회생·마찰 제동 협조, ABS/ESC, EPS 보조, 통신·진단은 `vehicleSystems.ts`의 상태 모형 또는 기능 목록에 있으나, 이번 도메인 게임에서 플레이어가 직접 완성하는 미션과 동일하지 않다. 제동 퍼즐은 차량 수준의 회생·마찰 협조 가운데 마찰 제동력 요청 계산이다.

## 게임에서의 경로

| 관점 | 질문 | 화면 |
| --- | --- | --- |
| System → Domain → Function | 차가 무엇을 하는가? | 로직 작업대 상단 경로, 기술 지도 |
| 물리 | 어떤 장치가 에너지를 전달하고 힘을 내는가? | 부품 조립, 3D 차량, 복구 추적 |
| E/E 할당 | 기능이 어느 제어기에서 실행되고 어디로 통신하는가? | 기술 지도 ECU 표, 설계 지도 |
| Application SWC → Runnable | 제어기 안에서 무엇을 언제 계산하는가? | 로직 작업대 상단 경로와 블록 계산 |
| RTE / BSW | SWC와 기반 서비스를 어떻게 연결하는가? | 기술 지도 개념 안내. 실제 AUTOSAR 산출물은 아님 |
| 검증 | 요구 출력과 실제 결과가 일치하는가? | 각 로직 동작 확인, 통합 시험 |

이 경로는 학습을 위한 **기능 분해 + SW 할당 예시**다. 기능 트리의 자식으로 ECU가 존재하는 구조가 아니다. 실제 제어기 할당은 차량과 업체에 따라 달라진다.

## 이번 변경의 구현 상태

1. 헤더의 **EV 기술 선택 지도**에서 BEV 구동계, 조향, 제동, E/E 대안을 눌러 부품·신호·시험 영향과 약어를 비교한다. 비교 카드는 현재 세이브 차량을 바꾸지 않는다.
2. 각 기능의 로직 작업대에 `System / Domain / Function / SWC / Runnable` 경로와 담당 ECU를 분리해 표시한다. 이름은 대표적인 할당 예시이며 실행 스케줄·RTE를 생성하지 않는다.
3. 기능 복구 뒤 실제 저장된 그래프를 다시 실행한 값을 신호 경로에 표시하고, 입력 → SW 계산 → 장치 경계 → 기계 반응을 단계 재생한다. EPS 구간은 각도 계산과 보조 토크의 차이를 표시한다.
4. 중고차 장면에서 고양이가 차에 탑승한 뒤 주행하고, 표정은 눈 모양으로 나타낸다.

## 아직 구현해야 하는 범위

- EPS 보조 토크·전류 SWC/Runnable, 센서·모터·전원·고장 대응 및 독립 시험. 기존 `FrontWheelAngle` 퍼즐을 보조 토크 퍼즐로 이름만 바꾸지 않는다.
- 회생·마찰 협조, ABS/ESC, BMS·충전·열관리·12V 등 각 기능을 부품→신호→SW→검증→물리 반응으로 만드는 연속 미션.
- E/E 아키텍처 카드의 선택을 실제 차량 변형으로 저장하고, 배선·제어기·SW 할당·시험을 일관되게 재구성하는 다차량 차고지.
- 원화 수준의 전용 차량·고양이 3D 리그와 구매 탑승·충돌·조립 장면의 GPU 시각 승인.

## 다음 작업 요청문

> 현재 분산 ECU·기계 연결 EPS 기준 차량을 유지하며 EPS 보조 토크·전류 미션을 추가해줘. 운전자 토크·조향각·차속·전원/고장 입력, EPS 전류 또는 보조 토크 출력, 기계식 랙/전륜 반응을 분리하고 독립 정상·경계·고장 시험으로 검증해줘. 기존 전륜 각도 운동 표현과 저장된 설계의 호환을 보존하고, 복구 추적에서 두 경로가 합쳐지는 위치를 보여줘.

## 근거 자료

- [DOE AFDC, BEV 구성 요소](https://afdc.energy.gov/vehicles/how-do-all-electric-cars-work)
- [Bosch, EPS 동작 원리](https://www.bosch-mobility.com/en/solutions/steering/electric-power-steering-systems/)
- [Bosch, Steer-by-Wire 구조](https://www.bosch-mobility.com/en/solutions/steering-systems/steer-by-wire/)
- [Bosch, E/E 아키텍처 변화](https://www.bosch-mobility.com/en/mobility-topics/ee-architecture/)
- [AUTOSAR, Classic Platform](https://www.autosar.org/standards/classic-platform/)
