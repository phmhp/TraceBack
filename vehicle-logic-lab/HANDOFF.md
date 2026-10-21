# 다른 사람에게 전달하기 — v0.11.0

최신 수정·학습 흐름·검수 범위는 `docs/V11_INTERACTION_AND_PRINCIPLES.md`를 확인합니다. 이전 ZIP은 자동으로 갱신되지 않습니다.

## 무엇을 보내나요?

**이 `vehicle-logic-lab` 폴더만 압축하면 됩니다.** 부모 `TraceBack` 폴더나 다른 프로젝트를 함께 보낼 필요가 없습니다. 모든 런타임 소스·자료·이미지·WASM이 내부에 있습니다.

- 실행만 할 사람: `release/Vehicle-Logic-Lab-v0.11.0.exe` 하나만 전달합니다. Windows x64 portable이며 Node.js/개발 서버 설치가 필요 없습니다. 구버전 앱 창을 닫고 새 파일을 실행합니다. 서명되지 않은 개발용 실행파일입니다. 메인 **모모의 첫 대회 시작**이 새 스토리입니다. 기존 READY/공방은 접힌 자유 연습에 남아 있습니다. 시동은 브레이크 유지→START→D→브레이크 해제를 각각 클릭합니다. 메뉴에서 진행을 유지하며 새 인트로를 다시 볼 수 있습니다.
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

플레이 진행·심화 설계는 각 컴퓨터/브라우저의 로컬 저장소에 있습니다. 프로젝트 압축이나 EXE 복사만으로 다른 사람의 진행이 자동 이전되지는 않습니다. 필요한 경우 게임의 진행 내보내기와 설계·검증 근거 내보내기를 별도 파일로 전달합니다. 구동 설계의 JSON 근거 보고서는 현재 자동 가져오기 기능이 아닙니다.

새 모모 모험은 별도 저장 키를 사용하며 기존 READY/자유 제작실 기록을 삭제하지 않습니다. 모험 메뉴의 내보내기는 근거 보고서이며 자동 가져오기 기능은 아닙니다. 브라우저 5175/개발 5176/EXE는 서로 다른 저장 영역입니다. 기본 사용자 주소는 5175이고 5176은 개발 검수용입니다.
