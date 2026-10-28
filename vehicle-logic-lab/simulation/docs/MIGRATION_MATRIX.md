# 기존 TRACKBACK → 독립 V2 이관표

판정 용어:

- **포함**: 새 프로젝트 내부에 복사 또는 다시 작성해 현재 사용
- **후속 이관**: 가치가 있지만 1주 수직 슬라이스에는 무거워 port 뒤에서 추후 이관
- **요약 포함**: 원본 전체 대신 필요한 claim/subgraph만 포함
- **제외**: 새 제품의 핵심 흐름에 불필요하거나 혼란을 유발

| 기존 정보·자산 | V2 판정 | 현재 반영 위치 | 게임 플레이 필수성 | 판단 이유 및 처리 |
|---|---|---|---|---|
| Drive → Incident → Investigation → Repair → Re-drive 구조 | 포함 | `GameApplication`, navigation state, investigation workspace | 필수 | 레이싱과 원인 분석을 하나의 사건으로 연결하는 핵심 loop |
| 검증 의뢰·운전자 제보·주행 계약 | 포함 | `VerificationMissions`, `SessionSetupScreen` | 필수 | 원인은 숨기고 재현 목적·관찰 항목·후속 조사를 먼저 이해시킴 |
| 고장 순간 cockpit 조작 상태 | 포함 | `IncidentDialogue`, live incident frame | 필수 | 조향·가속·브레이크·기어·속력을 동일 사건 frame으로 연결 |
| 요청/조건/반응 incident semantics | 포함 | `PropulsionCase`, incident frames, Page 1 | 필수 | 현상을 재현 가능한 사건으로 바꾸는 최소 정보 |
| Actual / Expected 비교 | 포함 | `SignalComparison`, Page 2, Test Bench | 필수 | 느낌이 아니라 oracle 기반으로 판단하게 함 |
| Last Known Normal / First Known Abnormal | 포함 | GameplayInvestigation, Page 2 boundary selection | 필수 | 고장 원인 추적의 핵심 학습 행동 |
| evidence ID/frame/run 개념 | 포함 | Evidence contracts, incident/experiment state | 필수 | frame/run identity와 저장·보고서 선택을 분리 |
| root cause 정확성 / evidence 충분성 분리 | 포함 | Assessment, Page 4 report | 필수 | 정답 맞히기와 근거 있는 결론을 구분 |
| repair regression + same-event re-drive | 포함 | PropulsionCase repair, RecoveryChallenge | 필수 | 수정이 실제로 유효한지 두 방식으로 확인 |
| 고양이 운전자·정비소 세계관 | 포함 | 선별 asset, UI tone | 게임성에 중요 | 고유 정체성과 감정 피드백 유지 |
| 베이지·민트·종이·스탬프 UI language | 포함 | `styles.css` | 게임성에 중요 | 디자인 정체성은 유지하되 게시판 layout은 폐기 |
| cat-face / vehicle-blueprint / paper-texture | 포함 | `public/assets` | 선택적 | 선별 복사. 제출 전 자산 권리 확인 필요 |
| 기존 Rapier vehicle physics | 포함 | `src/physics`, `src/runtime` | 필수 | full-fidelity production path로 이관 완료 |
| 기존 C/WASM propulsion scaling fault | 포함 | `c`, `src/runtime/c`, Case 02 기준선 | Case 02에 필수 | 실행·증거·수리 회귀를 보존하고 campaign 순서에서 재배치 |
| Pangyo map/route data | 포함 | `src/data/maps`, `src/world` | 필수 | collider, route, checkpoint, minimap 정보 보존 |
| 차량/월드 3D renderer | 포함 | `src/graphics`, `src/app/GameViewport` | 필수 | 원본 표현 품질 보존 |
| 전체 reference function registry | 포함하되 기본 노출 조절 | `src/referenceVehicle`, `docs/reference_vehicle` | 전문 학습에 필수 | 539 entity/2,195 relation을 유지하고 사건 subgraph부터 보여줌 |
| reference PDF 전체 파일 | 프로젝트 자료로 포함 | `docs/reference/JKEV_2027_ko_KR.pdf` | runtime에는 불필요, authoring에는 중요 | bundle에는 넣지 않고 case authoring source로 보존 |
| DRIVE READY·기어·TPMS·sensor limitation 운전자 관측 정보 | 요약 포함 | Case data/roadmap | 해당 case에 필수 | 운전자 관측 사실만 사용하고 ECU/CAN 내부 사양 근거로 과해석하지 않음 |
| 기존 Investigation Page 1~4 JSX | 기준선으로 포함, 단계적 재구성 | `src/ui/investigation/pages` | 정보는 필수, 현재 배치는 교체 대상 | 전문 도구·행동을 보존한 채 question-driven scene shell로 이동 |
| 조사 Page 1~4 진입 | 단계 해금 적용 | `InvestigationHeader`, `GameplayInvestigation` | 필수 | 방문 횟수가 아니라 사건 근거·경계 근거·구분 시험 충분성으로 다음 장을 해금 |
| 카드형 조사 덱 | 포함 | `InvestigationFocusDeck` | 필수 | 한 장면에서 한 질문만 처리하고 직접 판단·예측·설명해야 단서가 저장됨 |
| 기존 investigation 3열/게시판 layout | 임시 포함 | investigation CSS | 불필요한 배치 | full-fidelity 회귀 기준을 유지하면서 장면형 layout으로 단계 교체 |
| legacy CSS 약 1.1만+ 줄 | 임시 포함 | `src/ui/*.css`, investigation CSS | 정보 표현에는 필요, 구조는 부채 | 한 번에 제거해 UI를 붕괴시키지 않고 component 단위로 축소 |
| clue rail/timeline/scene preview | 조건부 포함 | InvestigationWorkspace | 해당 판단 장면에서 필수 | 이미 현상/신호 등 관련 화면에서만 노출하며 추가 정리 |
| canonical ID/source path/approval 상시 표시 | 상세로 이동 | source badge | 기본 플레이에는 불필요 | provenance는 중요하지만 기본 판단보다 시각적으로 뒤에 배치 |
| manual page 전체 탐색 UI | 제외 | future Atlas/detail | 본편에는 불필요 | 사건 해결을 막는 교과서형 탐색 방지 |
| 과거 설계안·완료보고서·prompt·중복 archive | 제외 | 없음 | 불필요 | 새 폴더에는 현재 source of truth만 유지 |
| 기존 테스트 전체 | 포함 | `tests/` 213개 | 필수 | simulation/evidence/UI semantics 회귀 기준 204개 + V2 품질·흐름 guard 9개 |
| 멀티플레이·아이템전·상점 | 제외 | 없음 | 불필요 | 1주 수직 슬라이스와 교육 목표 밖 |

## 독립성 완료 조건

- `trackback-v2` 내부에서 `../src`, `../public`, 절대 로컬 경로 import가 0개
- 새 위치로 폴더를 복사한 뒤 `npm install && npm run build` 성공
- runtime에 필요한 source claim과 asset이 폴더 내부에 존재
- 원본 Rapier/C-WASM/map/registry 실행 자산이 프로젝트 내부에 존재
- owner manual과 canonical authoring source가 프로젝트 내부에 존재하되 runtime bundle에서 분리
- production entry가 low-fidelity prototype을 참조하지 않음
- full-fidelity tests와 V2 fidelity boundary tests가 통과

