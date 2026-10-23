# v0.16 — 한 대의 차, 네 도메인으로 재구성

## 플레이 계약

영화 → 빠른 중고차 계약 → 이미 준비된 차로 출전 연습 → 약 1초의 파손 → 앞/뒤 바퀴 세트 → 아래 네 판 → 시스템 연결/배선/카울 → 실제 통합 주행 → 항구 컵 → 내가 만든 자동차 지도.

각 판은 **운전자 정상 모델 조작 → 기능별 부품 모으기 → 한 부품 장착 후 관찰 → 해당 기능 SW 블록 구성 → 독립 요구사항 시험 → 기능 완성**이다. 하드웨어만 조립하고 완성 보상을 받지 않는다. 이미 배운 장치와 모델은 같은 차에 누적된다.

| 판 | 장착 장치 | 직접 구성하는 Application 기능 | 실제 출력 대상 |
|---|---|---|---|
| 전력 | 배터리·인버터·VCU | 제공 시동 상태기의 READY 상태와 BMS 상태의 전력 사용 허용 | 다음 구동 기능의 PowerEnable |
| 구동 | 모터·감속/차동·구동축·가속 센서 | 모터 축 요청 토크, 가용량 제한, D/제동/전력 구동 허용 | 시스템 통합을 거쳐 인버터/모터 |
| 제동 | 제동 입력/제어 모듈·디스크/캘리퍼 | 페달 유효 범위와 마찰 제동력 요청 | 제공 제동 액추에이터/실제 Rapier 제동력 |
| 조향 | 핸들 입력/제어 모듈·랙 | 입력 범위와 앞바퀴 각도 요청 | 제공 조향 액추에이터/실제 Rapier 조향각 |
| 최종 통합 | 하네스 정리와 카울 | 위 도메인 출력의 선택·액추에이터 할당 | 같은 차의 주행·제동·조향 |

바퀴는 앞·뒤 두 개씩 먼저 장착한다. 수동 현가/휠에 억지 SW 퍼즐을 붙이지 않는다. VCU와 제동/조향 제어 모듈은 정비소의 교육용 EV 개조 키트에서 공급받는 이야기다. 실제 중고차 개조 공정/인증을 재현하지 않는다.

## 기존과 달라진 점

- 예전 여섯 조립 묶음 뒤의 SW 3개는 모두 VCU 전진 구동의 다른 부분이었다. 제동 장착 뒤에 제동력 모델을 만들거나 조향 장착 뒤 조향각 모델을 만들지 못했다.
- 새 모험은 `domainTraining.ts`의 여섯 실행 모델과 네 도메인 라운드를 사용한다. 기존 `torqueModel.ts`/v15 모험은 이전 저장 재개와 회귀 검사 용도로 보존한다. 새 시작은 `CampaignEntry.tsx`를 통해 v16으로 들어간다.
- 신호를 장식으로 표시하지 않는다. `WorkshopController`가 학습자 모델의 모터 토크 출력을 사용하고, 선택적인 `SimulationRuntime.configureTrainingChassis` 어댑터가 제동력과 앞바퀴 각도를 물리 명령에 적용한다. 어댑터가 없는 기존 실행 경로는 그대로다.
- 시험 기대값은 플레이어 그래프에서 만들지 않는다. 별도 정상/부정/범위 조건 표에 정의하며, OR/AND 오선택·누락 연결·범위 제한 누락은 실패한다. 블록 위치나 와이어 순서로 정답을 판정하지 않는다.
- 새 여섯 기능에는 합계 27개 독립 요구 조건이 있다. 현재 모델은 상태 없는 교육용 연산이며 실제 주행에서는 60Hz 물리 소유 루프에서 계산한다. 이전 20ms VCU 모델은 호환 경로에 보존한다. 이를 AUTOSAR runnable 스케줄러 구현으로 표현하지 않는다.
- 퍼즐의 Inport/Outport만 먼저 주고, 연산 블록은 재료에서 선택한다. AND 입력은 u1/u2/u3이며 정답 신호명이 미리 박혀 있지 않다. 포트 설명은 단위/출처/현재 연결을 보여주고, 실행 화면은 각 블록 실제 값을 Display한다.
- 개념 도움은 연결 정답을 노출하지 않는다. 별도 명시적 시범 적용은 지원 사용으로 저장한다. 완성 지도에서 여는 모델은 읽기 전용이다.

## 아키텍처 질문에 대한 답

`System → Domain → Function → Logic`은 **기능 분해의 탐색 경로**다. 이 경로와 **기계/물리, E/E, SW라는 구현 관점**은 다른 축이다. 같은 제동 기능을 기계적으로는 패드/디스크, E/E로는 센서/제어기/액추에이터, SW로는 제동력 계산으로 보는 구성은 적절하다. 그러나 이를 기계→E/E→SW의 단일 상하 계층으로 표현하면 부정확하다.

본 게임은 **도메인 지향 교육용 E/E 구성**을 선택한다. VCU와 기능별 제동/조향 제어를 단순화해 보여준다. 공간별 Zone ECU, 중앙 HPC와 해당 지역의 I/O 할당, 버스 프레임/지연을 구현하지 않았으므로 **Zonal이라고 부르지 않는다**. 중앙 VCU가 있다고 Zonal이 되는 것도 아니다.

SW 퍼즐은 Application 내부 기능 모델이다. AUTOSAR Classic의 Application/RTE/BSW는 ECU 내부 플랫폼 계층이며, 여기의 기능 분해 경로와 동일한 개념이 아니다. 실제 RTE/BSW, ARXML, runnable 스케줄러, 생산 ECU 코드를 생성하지 않는다.

근거:

- [MathWorks — Ports and Subsystems](https://www.mathworks.com/help/simulink/ports-and-subsystems.html): 독립 입출력과 계층적 기능 구조.
- [MathWorks — Architecture allocations](https://www.mathworks.com/help/systemcomposer/ug/allocations-interactive-example.html): 기능/논리/물리 구조의 할당 관계.
- [AUTOSAR Classic](https://www.autosar.org/standards/classic-platform/): Application/RTE/BSW 구분.
- [Bosch E/E architecture](https://www.bosch-mobility.com/en/mobility-topics/ee-architecture/): 도메인/중앙/공간 기반 구성의 구분.
- [DOE — EV 주요 구성](https://afdc.energy.gov/vehicles/how-do-all-electric-cars-work): 전기 구동 외 충전/보조 전원/열관리도 필요함.
- [Genesis GV70](https://www.genesis.com/worldwide/en/models/gv70), [2025 실내 조작계](https://ownersmanual.genesis.com/full_webhelp/JK/2025/en_GN/picture_index_interior_overview.html): 대시보드·도어·콘솔의 연속성, 매립 디스플레이, 변속 조작 배치 참고. 사진/CAD/로고를 복사하지 않은 자체 실내다. 특정 GV70 연식을 그대로 재현한 것은 아니다.

## 필수 도메인이 충분한가?

**‘전진 주행 핵심 부분 모델’로는** 에너지/전력, 운전자 입력, 구동/동력 전달, 마찰 제동, 조향, 휠/접지 및 제공 수동 현가를 연결했다. 이전처럼 구동 인터록 하나를 제동/조향 학습으로 대체하지 않는다.

**‘완전한 EV’로는 부족하다.** 충전/OBC, DC/DC와 12V 전원 상세, 셀/BMS 알고리즘과 HV 프리차지, 열관리, ABS/ESC·회생 협조, EPS 모터 보조 토크, 네트워크 타이밍/진단/고장 내성은 직접 구현하지 않는다. BMS 사용 허용과 가용량은 제공 인터페이스이고 인버터의 전류 제어는 제공 모형이다. 회전속도·전력 바는 원리 표현이지 측정 전류/전압/유압이 아니다.

## 학습/포트폴리오 가치와 품질 한계

설명할 수 있는 것: 입력/계수의 구분, Boolean과 Enum 비교, 수치 변환과 포화, 요청과 허용의 분리, 제동력과 구동 차단의 차이, 조건별 실제 출력, 도메인 간 할당, 독립 판정과 회귀, 모델 출력→물리 명령의 연결.

상용 Switch 게임/기업 정규 교육재 수준이 완성되었다고 주장하지 않는다. 현재는 원리 학습과 검증 사고를 연결한 데스크톱 교육용 게임 프로토타입이다. 전문 차량 엔지니어 검수, 처음 보는 학습자의 전이 평가, 장시간/다양한 장치 접근성 테스트, 아트/캐릭터 애니메이션 제작과 최적화가 더 필요하다. UI 검수와 자동 테스트 통과가 교육 효과나 양산 검증 적합성을 보증하지 않는다.

## 실행·호환

- 새 시작: v0.16 네 도메인 라운드. 메인은 시작하기 하나.
- 같은 탭 새로고침: 현재 판과 장착/모델을 복원. 주행 도중 재개는 안전한 출발선.
- v15 이전 저장: 삭제하지 않으며 이전 흐름으로 재개 가능. 새 시작은 기존처럼 백업 후 생성.
- 독립 전달 단위: `vehicle-logic-lab` 폴더. v0.16 실행파일은 `release/Vehicle-Logic-Lab-v0.16.0.exe`.
- 테스트: `npm test`, `npm run test:simulation`, `npm run test:domain-ui`, `npm run test:campaign-ui`, `npm run test:game-ui`, `npm run test:click-safety`, `npm run check:independence`, `npm run build`.
