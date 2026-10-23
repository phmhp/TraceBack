# 다른 사람에게 전달하기 — v0.16.0

현재 전달 파일은 **`release/Vehicle-Logic-Lab-v0.16.0.exe`**입니다. [36개 요청 추적표](docs/V16_REQUEST_CHECKLIST.md), [새 도메인 판과 기술 범위](docs/V16_DOMAIN_ROUNDS_AND_ARCHITECTURE.md), [QA](docs/qa-v16/RESULTS.md)를 먼저 봅니다. 한 대의 차에 전력·구동·제동·조향을 판마다 기계+SW+시험으로 완성하고 마지막에 통합합니다. 새 흐름은 타이틀의 시작하기에서 시작합니다. 기존 저장/실행파일/ZIP은 삭제하지 않으며 ZIP은 자동 갱신되지 않습니다.

## 이전 전달 이력 — v0.15.0

최신: `release/Vehicle-Logic-Lab-v0.15.0.exe`. [이번 변경과 한계](docs/V15_PLAYABILITY_AND_CRITICAL_REVIEW.md), [검사 기록](docs/qa-v15/RESULTS.md)를 먼저 봅니다. 새 플레이는 부품 전체 조립 후 퍼즐이 아니라 기능 묶음별 조립/관찰/관련 SW/복구입니다. 새 탭은 시작하기만, 같은 탭의 진행 중 새로고침은 복원합니다. 수동 타이틀 이동 뒤 시작하기는 백업 후 새 모험입니다. 다음 내용의 v0.14 파일/진행 설명은 이전 버전 안내입니다.

현재 요청별 반영·실행 모델·미구현 범위는 `docs/V14_DOMAIN_STUDIO_AND_ANIMATION.md`를 확인합니다. 메뉴 계약은 `docs/V12_1_START_AND_BACK.md`를 유지합니다. 이전 ZIP은 자동으로 갱신되지 않습니다.

## 무엇을 보내나요?

**이 `vehicle-logic-lab` 폴더만 압축하면 됩니다.** 부모 `TraceBack` 폴더나 다른 프로젝트를 함께 보낼 필요가 없습니다. 모든 런타임 소스·자료·이미지·WASM이 내부에 있습니다.

- 실행만 할 사람: `release/Vehicle-Logic-Lab-v0.16.0.exe` 하나만 전달합니다. Windows x64 portable이며 Node.js/개발 서버 설치가 필요 없습니다. 구버전 앱 창을 닫고 새 파일을 실행합니다. 서명되지 않은 개발용 실행파일입니다. 메인은 **시작하기** 하나만 표시합니다. 매번 프롤로그부터 시작하며 이전 모험은 앱 내부 저장소에 백업합니다. 상단 **← 뒤로**는 조립·배선을 유지한 채 앞 단계로 이동합니다. 이어하기·내보내기·불러오기는 노출하지 않습니다. 이전 READY/공방 저장과 소스는 삭제하지 않았지만 메인 자유 연습 메뉴는 제거했습니다. 첫 연습은 이미 준비된 차로 달리며, 전력 판에서 P+브레이크 ON 후 START를 조작합니다. 주요 주행 입력은 오른쪽 한 곳과 실제 운전석 조작계/방향키로 제공합니다.
- 소스 수정·개발도 할 사람: 이 폴더를 압축하여 전달합니다. `src`, `public`, `simulation`, `desktop`, `scripts`, `tests`, `docs`, 설정 파일, `package.json`, `package-lock.json`, 안내 문서를 유지합니다. `simulation`은 이름과 달리 선택 사항이 아니라 복사한 실행기·차량 자료가 들어 있는 필수 폴더입니다.
- 용량 절약: `node_modules`, `dist`, 로그·`*.tsbuildinfo`, `release` 안의 구버전 EXE와 임시 `win-unpacked.tmp`는 압축 대상에서 제외해도 됩니다. 파일을 실제로 삭제할 필요는 없습니다. `release`에서는 최신 EXE만 포함하면 됩니다. EXE 없이 소스만 전달해도 아래 명령으로 빌드할 수 있습니다.

## 받는 사람의 개발 실행

Node.js 22.18 이상을 설치한 뒤 압축을 풀고 `vehicle-logic-lab` 폴더에서 실행합니다.

```powershell
npm ci
npm run dev
```

브라우저에서 `http://localhost:5175/`를 엽니다. 5175 포트를 사용하는 다른 서버가 있으면 먼저 종료하거나 포트를 명시적으로 변경합니다.

```powershell
npm test
npm run test:simulation
npm run test:game-ui
npm run test:click-safety
npm run test:campaign-ui
npm run check:independence
npm run build
npm run package:win
```

`test:click-safety`와 `test:campaign-ui`는 DOM 이벤트 테스트이고 GPU는 대역 처리합니다. 실제 WebGL 화면·휴대용 EXE 전체 플레이 QA와는 구분합니다. 빌드 결과가 OEM 인증·전체 차량 검증 완료를 뜻하지 않습니다. 최신 범위·플레이 검증은 `docs/V10_MOMO_CUP_REPORT.md`, 재사용은 `docs/V9_INTEGRATED_WORKSHOP_REPORT.md`, 데이터 선별은 `docs/SOURCE_CURATION_v8.md`, 교육 사양은 `docs/TRAINING_DRIVE_SPEC_v1.md`를 확인합니다. 이전 ZIP은 자동 갱신되지 않으므로 최신 폴더를 다시 압축해야 합니다.

## 저장 진행은 별개예요

플레이 진행은 각 컴퓨터/브라우저의 로컬 저장소에 있습니다. 프로젝트 압축이나 EXE 복사만으로 다른 사람의 진행이 자동 이전되지는 않습니다. 현재 모험에는 진행 내보내기/불러오기를 노출하지 않습니다.

새 모모 모험은 별도 저장 키를 사용하며 기존 READY/자유 제작실 기록을 삭제하지 않습니다. 브라우저 5175/개발 5176/EXE는 서로 다른 저장 영역입니다. 기본 사용자 주소는 5175이고 5176은 개발 검수용입니다.
