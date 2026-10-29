# 블록 실행 계약 (2026-10-28)

참조 이미지의 블록 39종은 `src/campaign/signalBlocks.ts`에 모두 등록되어 있으며, SW 설계 화면의 전체 블록 라이브러리에서 입력·설정을 바꿔 실행하거나 설계도에 추가할 수 있다. 한 번 실행은 이산시간 한 샘플이다. 기존 여섯 기능의 독립 요구 출력은 기존 `MODEL_SPECS.cases`로 계속 채점한다.

| 블록 | 현재 실행 의미 |
| --- | --- |
| In1, Out1, Display, Terminator | 입력 신호 통과. Display는 결과를 보여주고 Terminator는 경로의 값을 소비한다. |
| Constant, Ground | 설정 값 또는 0을 출력한다. |
| From, Goto | 태그 이름으로 같은 Subsystem 경로의 신호를 게시/읽는다. `visibility: global`이면 경로 간 공유한다. |
| Sum, Product, Gain | 부호별 합, 연속 곱, 제공 계수 곱. |
| MinMax, Relational Operator, Logical Operator | 최솟값/최댓값, 비교, AND/OR/NOT/XOR. |
| Saturation, Abs, Sqrt, Data Type Conversion | 상·하한 제한, 절댓값, 제곱근, boolean/double/int32/string 변환. |
| Switch, Multiport Switch | 조건 또는 선택 인덱스로 입력을 선택한다. |
| Bus Creator, Bus Selector | 이름 있는 신호 객체를 만들고 지정한 필드들을 순서대로 꺼낸다. |
| Mux, Demux | 벡터를 합치거나 원소별로 나눈다. |
| Subsystem | 내부 블록 그래프를 같은 실행기에서 평가한다. 미션 편집기에서는 선택한 연산을 내부 그래프로 감싸고 계층 경로로 들어갈 수 있다. |
| Delay, Unit Delay, Memory | 초기값을 출력한 뒤 이전 샘플/설정된 샘플 수의 값을 유지한다. 입력 갱신은 현재 샘플의 모든 출력 평가 뒤에 이루어져 지연 피드백을 허용한다. |
| Enable, Trigger | Enable은 참일 때 갱신·거짓일 때 보유, Trigger는 거짓→참 상승 에지에서 갱신한다. |
| Scope | 해당 블록의 샘플 이력을 런타임 상태에 쌓고 현재 값을 통과시킨다. |
| 1-D, 2-D, n-D Lookup Table | 주어진 축/표에서 다중 선형 보간하고 범위 밖 입력을 끝값으로 제한한다. |
| Direct Lookup Table (n-D) | 정수 인덱스로 표의 항목을 직접 선택한다. |
| Data Store Memory, Read, Write | 이름 있는 공유 값을 초기화하고 읽거나 쓴다. 같은 틱에서는 선언·쓰기 블록을 출력 평가 전에 실행한다. |
| Chart | 상태별 하나의 임계조건을 평가해 다음 상태로 전이한다. |

이 계약은 **이 게임의 고정된 이산시간 블록 프로파일**이다. MathWorks Simulink는 블록마다 포트/자료형/크기/샘플타임/설정 옵션이 다양하다. 예를 들어 [Lookup Table](https://www.mathworks.com/help/simulink/lookup-tables.html)은 여러 보간·외삽 방식을 제공하며 [Direct Lookup Table](https://www.mathworks.com/help/simulink/ug/guidelines-for-choosing-a-lookup-table.html)은 보간 없이 색인한다. [Data Store Memory](https://www.mathworks.com/help/simulink/slref/datastorememory.html)는 읽기/쓰기 실행 순서가 중요하고, [Stateflow Chart](https://www.mathworks.com/help/stateflow/ref/chart.html)는 계층 상태·이벤트·동작·전이 우선순위를 가진다. 현재 구현은 그 모든 설정/의미를 그대로 재현하지 않는다. 특히 다중 출력 포트·복잡한 Stateflow, 다양한 lookup 보간/외삽, 연속시간 Solver, 행렬/고정소수점 연산은 완료 판정하지 않는다.

인수 기준은 각 블록별 원본 옵션에 대응하는 포트·자료형·시간 상태·수치 경계 테스트와 게임 편집기/저장/검증/주행 회귀를 통과하는 것이다. 차이가 남아 있는 상태에서는 “Simulink와 동일”이라고 표시하지 않는다.
## 추가 실행 보장

출력으로 이어지지 않은 Display, Scope, Terminator도 매 샘플 입력을 받는다. 중첩 Subsystem은 바깥 샘플 시계를 공유하며 전역 틱을 추가로 증가시키지 않는다. From/Goto의 기본 태그는 해당 Subsystem 경로에만 속한다. `tests/signal-blocks.test.mjs`에서 확인한다.

