# 기존 프로젝트 분석·재사용 및 데이터 검수

> v0.5.1 정정: 아래 본편 연결은 철회했습니다. 재사용 자산은 보존하되 새 게임 진입은 운전자 시점 인트로와 단계별 게임 흐름입니다. 원래 고양이를 유지하며, 전체 앱 전환을 기능 재사용의 대체물로 삼지 않습니다.

## v0.5 변경 (아래 초기 감사표보다 우선)

기존 미사용이던 정식 주행·C/WASM·Rapier·추리·회귀/재주행과 canonical 자료를 `simulation/`으로 로컬 복사해 본편으로 연결했다. 원본은 변경하지 않았다. 등록 539개 엔티티/2,195개 관계를 탐색할 수 있으나 DRAFT/AI_DRAFT/DESIGN_ONLY 상태는 유지한다. 기존 drift 실패는 JSON 직렬화 CRLF/LF 차이였고, 복사본의 내용 변경 없이 생성 형식만 맞춰 해결했다. 자세한 범위·검증·한계는 [V5 보고서](V5_CAMPAIGN_REPORT.md) 참고. 아래 표는 v2 시점의 이력이다.

기준: dev_v2 / 55234d2db6da975f84da53d37588990ca3983c6c. 원본은 저장소의 `trackback-v2/` 및 루트 앱에 보존했습니다. 신규 런타임이 이 경로를 import하거나 원본 서버에 접근하지 않습니다. 아래 원본 경로는 개발자용 출처이며 런타임 의존성이 아닙니다.

사용자 신규 지시서는 이 독립 교육용 분기의 방향입니다. 기존 `docs/TRACKBACK_GAMIFICATION_REDESIGN_v1.md`를 확인했으며, 기존 조사·수리 흐름은 원본에 보존하고 신규 핵심 루프는 사용자 지시에 따라 로직 조립으로 분리했습니다.

| 조사 항목 | 기존 구현 | 판정과 적용 |
|---|---|---|
| 3D Canvas | graphics/RaceViewport.tsx, R3F | 일부 수정: demand 렌더링, 카메라 조정, WebGL 실패 시 계기판 유지 |
| 노드·연결선 | ui/xray/RequirementMap.tsx | 일부 수정: 좌표 기반 HTML 노드+SVG 곡선, transform zoom, pointer capture·빈 공간 pan 패턴 재사용. 원본은 탐색 전용이므로 포트 편집·삭제·이력은 신규 |
| 블록 로직 엔진 | 기존 요구사항 지도에는 없음 | 새로 구현: 레지스트리, 타입 검사, 순환 차단, 그래프 실행, 상태 전이 |
| 입력 | input/keyboard/KeyboardInputAdapter.ts | 보존하되 미사용: 레이싱 키 입력은 READY 버튼 이벤트와 목적이 다름 |
| 상태 관리 | ui/state/navigation.ts, Zustand | 보존하되 미사용: 기존 레이싱 상태 구조를 덮어쓰지 않고 신규 진행 저장 분리 |
| 시간 | core/SimulationClock.ts | 그대로 사용: 로컬 복사, 결정론적 고정 틱 |
| 차량 그래픽 | PlaceholderVehicle, SoftShapes, CatDriver | 그대로 사용: 세 파일 로컬 복사. 차량 모델은 정적 시각화에 사용하며 고양이는 기존 코드만 보존, 현재 표시하지 않음 |
| 차량 도면 | public/assets/vehicle-blueprint.png | 그대로 사용: 시스템 지도용 로컬 복사 |
| 물리·차량 런타임 | runtime/SimulationRuntime.ts, Rapier, C/WASM | 어댑터로 추후 연결: 신규 교육 엔진을 실차 물리 시뮬레이션인 것처럼 대체하지 않음 |
| 레이싱 | app/GameApplication, RaceScreen, RecoveryChallenge | 보존하되 현재 사용하지 않음. 추가 예정 — 테스트 트랙 통합 |
| 추리 | ui/investigation, runtime/investigation, PropulsionCase | 보존하되 현재 사용하지 않음. 추가 예정 — 문제 해결 챌린지 |
| 요구사항·신호·인터페이스 | docs/reference_vehicle, referenceVehicle/generated | 검수 대기. 신규 채점·기대값에는 연결하지 않음 |
| 시험 | node:test 기반 tests | 방식 재사용, 신규 순수 엔진 회귀 시험 작성 |
| 저장 | RecoveryChallenge의 local best store | 보존하되 미사용. 신규 버전 키와 JSON 내보내기·복원 구현 |
| 오디오·애니메이션 | 기존 UI/CatDriver 표현 코드 | 보존. 오디오 미도입, 신호 흐름·상태 전환 CSS만 신규 구현 |

## 실제 복사 원본 SHA-256

| 파일 | SHA-256 |
|---|---|
| SimulationClock.ts | 732A3CF2FEEAEDCF4082BDF2ECC3AEF312BB7CC8DC40E4D0C964667951C8E50D |
| PlaceholderVehicle.tsx | 6309C460C518A1BE4CACDF81D818E968E8A7B8E5C6522110FB69E00249F4D428 |
| SoftShapes.tsx | 9EB0B79C255972DC0B256A1D2501ED9F354B0983D22CDD3369D026DB4322A4BB |
| CatDriver.tsx | C50AB7366FD482469CC943687DE4AC52A9D112845529EBEDA5F9E40F64E2D397 |
| vehicle-blueprint.png | EA03C70200D55855B910129CE98207568671E65F602CAF5EBF9FCC3C1C698362 |

## 차량 데이터 검수 상태

| 자료 | 목록 범위 | 상태 |
|---|---|---|
| 신규 READY 가상 사양·독립 기대값 | READY_SPEC.md / content/ready.ts | 가상 사양으로 정의·구현 대조·행동 시험 완료. 실제 자동차 기술 검수 완료라는 뜻이 아님 |
| 기능·시스템·SW 아키텍처 | reference_vehicle/architecture 3파일 | 검수 대기 |
| 신호·인터페이스 | reference_vehicle/interfaces 3파일 | 검수 대기 |
| 요구사항·추적성·열린 결정 | reference_vehicle/requirements 5파일 | 검수 대기 |
| 검증 행렬·카탈로그 | reference_vehicle/verification 6파일 | 검수 대기 |
| 사례·고장·복구 정책 | reference_vehicle/cases 7파일 | 검수 대기 |
| 엔지니어링 validation 자료 | reference_vehicle/validation 12파일 | 검수 대기 |
| docs/knowledge의 중복·정리본, 매뉴얼·PDF | 원본 보존 | 검수 대기. 전체 내용 대조 및 출처 확인 미완료 |
| 사용 부적합 자료 | 이번 범위에서 특정 자료 확정 안 함 | 미판정. 임의로 오류라고 단정하거나 삭제하지 않음 |

기존 registry 생성물과 canonical source 간 drift 시험 1건이 실패했습니다. 원본 내용을 변경하지 않았고 재생성하지 않았습니다. 이것만으로 자동차 기술 정보가 틀렸다고 판정하지 않습니다. 후속 검수에서 생성환경·정렬·개행·원본 변경 여부를 조사해야 합니다. 전체 목록화 수준의 감사이며 전체 자동차 지식의 사실 검수는 **추가 예정 — 기존 차량 데이터 검수**입니다.

새 폴더를 분리한 뒤 기존 게임을 연동하려면 원래 저장소의 해당 모듈과 에셋을 검토 후 새 프로젝트 내부로 포팅해야 합니다. 외부 형제 폴더 import로 연결해서는 안 됩니다.
