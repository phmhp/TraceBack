# TRACKBACK V2 — Full-fidelity Fork

기존 TRACKBACK의 3D/Rapier/C-WASM 차량 시뮬레이션과 검증 정보를 보존하면서, 게임성과 조사 학습 흐름을 재구성하는 **독립 프로젝트**입니다.

이 폴더는 상위 `TraceBack` 소스를 runtime import하지 않습니다. 폴더만 복사해 설치·빌드할 수 있습니다.

## 현재 기준선

현재 production entry는 저충실도 Canvas prototype이 아니라 기존 full-fidelity 실행 경로입니다.

- React Three Fiber + Rapier 3D 차량/월드 simulation
- C/WASM vehicle control software와 binary provenance
- Pangyo Overture map/route와 physical collider
- 조향·가속·제동·기어, 정지 차량 회피 event
- incident frame capture와 replay
- Actual / Expected signal comparison
- architecture, signal, interface, requirement, test trace
- player hypothesis와 controlled experiment
- evidence sufficiency와 root-cause correctness 분리
- repair regression과 physical re-drive
- canonical registry 539 entities / 2,195 relations
- 자동 테스트 214개
- 시작 전 검증 의뢰 브리핑과 원인을 숨긴 mission contract
- 고장 순간 운전자 조작 상태(조향·가속·브레이크·기어)와 사건 기록 recap
- 실제 근거 확보로만 열리는 4단계 조사 chapter
- 기존 4개 조사 chapter 안에서 `현상 → 도메인 → 기능 경계 → 가설 → 비교 시험 → 수리`를 세부 판단으로 재구성
- 기본 조사실을 왼쪽 자료·오른쪽 판단의 2열 오픈북으로 구성하고, 각 질문마다 확인 범위와 보류 범위를 표시
- 기존 신호·인터페이스·요구사항·시험 UI는 `전체 조사 도구`에서 그대로 보존

이전 2D concept은 production path와 독립 제출 폴더에서 제거했습니다.

## 실행

Node.js 22.12 이상에서, 저장소를 받은 뒤 `trackback-v2` 폴더 안에서 실행합니다.

```bash
npm ci
npm run dev
```

Vite가 출력한 `Local` 주소로 접속합니다. `127.0.0.1`은 현재 실행 중인 컴퓨터 자신을 뜻하고, `5175`는 고정 주소가 아닙니다. 다른 개발 서버가 포트를 사용 중이면 `5173`, `5174`, `5175` 순으로 달라질 수 있습니다.

항상 5175를 사용하려면:

```bash
npm run dev -- --port 5175
```

같은 네트워크의 다른 기기에서도 접속해야 할 때만 다음처럼 실행하고, 실행 컴퓨터의 IP와 방화벽 설정을 사용합니다.

```bash
npm run dev -- --host 0.0.0.0 --port 5175
```

검증:

```bash
npm run check:independence
npm run check:registry
npm run typecheck
npm run lint
npm test
npm run build
```

## 프로젝트 구조

```text
trackback-v2/
  c/                       C vehicle control source
  public/                  fonts and investigation assets
  src/app/                 simulation composition root
  src/runtime/             vehicle runtime, gameplay, evidence, scenarios
  src/physics/             Rapier bridge
  src/world/               map and route loading
  src/referenceVehicle/    canonical registry runtime
  src/ui/investigation/    investigation tools and learning interactions
  docs/reference_vehicle/  canonical generation inputs
  docs/knowledge/          curated architecture/requirement/test/case knowledge
  docs/reference/          owner manual source
  tests/                   204 baseline + V2 quality/flow guards
```

## V2 재구성 원칙

1. 시뮬레이션과 전문 정보의 품질을 줄이지 않습니다.
2. progressive disclosure는 정보를 삭제하는 것이 아니라 필요한 순간에 꺼내는 방식입니다.
3. 단서는 Next 클릭이나 페이지 방문으로 얻지 않습니다.
4. signal 비교, 정상/이상 경계 선택, requirement 근거 선택, hypothesis, discriminating test, evidence report가 실제 진행 조건입니다.
5. 기존 propulsion case는 full-fidelity port 기준선으로 보존하고, 신규 campaign은 공개 빈도 근거에 따라 12V → 구동/HV → 전장 → 타이어 순으로 authoring합니다.

## 현재 상태를 정확히 표현하면

- 완료: 독립 full-fidelity fork, 원본 simulation/information 복원, 검증 의뢰 → 3D 시험 주행 → 사건 recap 연결, build/test 검증
- 진행 중: 게시판형 조사실을 장면형 investigation chapter로 재구성
- 미완료: 12V full-fidelity case, driving mission 재미 강화, cockpit visual, 전체 case campaign

즉, 현재는 완성된 V2가 아니라 **품질을 보존한 올바른 개발 기준선**입니다.
