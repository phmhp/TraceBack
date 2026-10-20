# v0.5 — 실제 주행·추리·검증 본편 연결

> 철회된 진입 방식의 기록입니다. 사용자 정정에 따라 v0.5.1에서는 본편 전환을 제거하고 새 게임 진행 + 원래 고양이를 유지합니다. 최신 내용: [진입 흐름 정정](V5_1_ENTRY_CORRECTION.md).

## 1. 구현 완료

메인 「본편 시작」은 이 폴더에 복사한 TRACKBACK의 정식 C/WASM + Rapier 실행 경로를 연다. 과거 READY 3개 챕터는 「선택 학습 · READY 로직 입문」으로 남긴다. 별도 원본 서버나 형제 프로젝트를 열지 않는다.

본편 루프: 의뢰/조사 방식 선택 → 체크포인트 주행 → 가속 응답 이상 재현 → 사건 recorder → 현상/도메인/기능 경계 조사 → 경쟁 가설 → 시험 → 보고/수리 → 동일 로직 회귀 검증 → 회복 주행/장애물 회피/기록.

- W/↑ 가속, S/↓ 제동, A/D 또는 좌우 조향, 1–4 P/R/N/D, Esc 일시정지.
- 화면 페달은 버튼 토글이 아니라 포인터 높이를 0–100% 연속 목표값으로 바꾼다. 놓음/캡처 상실/일시정지에서 해제한다. DriverInputRuntime의 고정 틱 상승·하강 응답을 거쳐 기존 물리 명령에 도달한다.
- 조향 슬라이더와 게임패드 RT/LT/스틱도 같은 DriverInput 경계에 연결한다. 게임패드가 끊어지면 소유한 입력을 0으로 해제한다. 게임패드 하드웨어 실기 시험은 미수행.
- 「가이드」는 6개 의미 기반 조사 장면. 「자유 조사/자율 검증」은 전체 조사 도구로 진입하고 페이지를 직접 선택할 수 있다. 페이지 열람 자체는 단서·판정·수리 완료가 아니다.
- 전체 도구의 차량 시나리오 작업대는 일정/계단/램프 입력, 제동·조향, 인터페이스 결함 주입, 정해진 조건 재실행과 동기화 기록을 제공한다. 독립 오라클 없는 시나리오는 관찰로만 표시한다.
- 「차량 아키텍처·자료」에서 현재 사건의 기능/신호/인터페이스/요구사항/TC 관계를 따라가고, 전체 차량 자료를 선택적으로 탐색한다.
- 「입체 부품·실행값」은 기존 모형을 유지하면서 라이브/사건 기록의 브레이크, 가속 입력, 요청 토크, 출력 토크, 차량 속도를 표시한다. 3D 페달도 연속 브레이크 값에 맞춘다.

현재 완전한 본편 사건은 구동 출력 이상 CASE-PT-001이다. 등록된 34개 case가 모두 플레이 가능한 에피소드라는 뜻은 아니다. 교육용 Rapier/C 모델이며 실차 동역학, 양산 ECU, HIL, 기능안전 인증을 주장하지 않는다.

## 2. 기존 자산 재사용

원본 `trackback-v2`는 수정하지 않고 `simulation/` 안으로 src, C 소스/생성 WASM, tests, scripts, canonical docs와 출처 PDF를 복사했다. 필요 원화/폰트는 독립 프로젝트 public 안에 둔다. production bundle은 같은 exe 안에 들어간다.

- SimulationRuntime: 고정 틱, 입력 처리, 실제 제어/물리 명령, 사건 기록, 차량 시나리오.
- WasmVehicleSw + C core: GearLogic, PropulsionFunction, VMC, eDrive. 전원·에너지·차량 권한 등 실행 모델도 원래 계약을 유지.
- RapierVehiclePhysics + map/world: 중력/접촉, 서스펜션/휠, 전후진, 제동·조향, 도로/경로, 실제 선행차/장애물 충돌.
- PropulsionCase + InvestigationWorkspace/FocusDeck: 신호 비교, 인터페이스, 요구사항, 시험, 근거 평가, 잘못된 수리, 회귀, 회복 주행.
- ReferenceVehicle registry 및 canonical 자료: 16 영역, 74 기능, 111 신호, 50 인터페이스, 180 요구사항, 74 TC, 34 case. 총 539 엔티티/2,195 관계.
- 기존 CatDriver 모델과 원래 cat-face.png를 사용. v4에 새로 생긴 파란 눈/작업복 캐릭터는 사용 경로에서 제외.

두 화면 모드는 같은 독립 패키지의 별도 entry를 사용하여 CSS·실행 루프를 격리한다. iframe은 `./simulation/index.html` 로컬 페이지이고, 다른 프로젝트나 서버를 링크한 것이 아니다.

## 3. 주요 변경 파일

- `src/game/Game.tsx`, `CampaignHost.tsx`: 본편 우선 메뉴, 로컬 본편 호스트, 사건 종료 경고.
- `src/game/Characters.tsx`, `WorldBackdrop.tsx`, `polish.css`: 원래 캐릭터 복원, v5 원화, 밝은 프레임 유지.
- `simulation/src/app/GameApplication.tsx`: 기존 정식 런타임에 자료/입체 도구와 연속 입력 UI 연결.
- `simulation/src/ui/components/DriveControls.tsx`, `runtime/driver/AnalogInput.ts`: 연속 페달·조향·게임패드 어댑터.
- `KnowledgeAtlas.tsx`, `referenceVehicle/CaseKnowledge.ts`: 사건 맥락과 전체 자료의 실제 관계 탐색.
- `CampaignTools.tsx`, `graphics/SignalBench.tsx`: 실제 기록/라이브 값과 입체 부품.
- `SessionSetupScreen.tsx`, `InvestigationWorkspace.tsx`, `campaign.css`: 조사 방식 선택, 전체 도구 접근, 밝은 UI.
- `simulation/src/main.tsx`: C WASM을 inline asset으로 포함, file URL fetch 없이 컴파일.
- `vite.config.ts`, `simulation/index.html`, `package.json`: 단일 패키지 안의 2개 로컬 entry, v0.5.0 빌드.

## 4. 검증 결과

- 기존 READY 회귀 25개 통과.
- 복사한 주행/추리/물리 회귀 및 새 연속 입력/자료 맥락 시험 221개 통과. 합계 246개.
- 실제 C + Rapier 양방향 추진/정지, 방향 전환 인터록, 조향, 일시정지, 리셋, 판교/시험장 사건 포착, 잘못된 수리 실패, 정상 수리/회귀 후 실제 재주행 포함.
- 차량 시나리오가 실제 물리 런타임을 실행하며 입력 스케줄/신호/인터페이스 결함/충돌/재실행을 기록하는 시험 통과.
- TypeScript 및 production 빌드 통과. 상위 import 없는 독립성 검사 통과.
- Windows app.asar의 dist 파일 54개를 최신 production 산출물과 전부 바이트 비교하여 일치를 확인했다. 두 HTML entry, 원래 고양이 이미지, 새 원화, 게임·시뮬레이션·Rapier 번들이 포함되며 C WASM은 data URL로 inline되어 있다.
- `node scripts/check-campaign-ui.mjs`: 자료 관계·난이도 선택·주행 의뢰·연속 페달 UI의 정적 React 렌더 계약 통과. 브라우저 스크린샷/실플레이 검증은 아니다.
- 브라우저 자동 관찰은 URL 정책으로 차단되어 우회하지 않았다. 따라서 v5 화면의 실제 레이아웃/키보드·포인터 실플레이 및 새 Windows 창 UI는 이번 작업에서 자동 확인하지 못했다. 원본 물리 테스트와 정적 UI 확인을 실플레이 확인으로 표현하지 않는다.

빌드 도구의 큰 번들 경고 및 dev dependency moderate 8건은 남아 있다. OS 서명 인증서 없는 Windows x64 로컬 개발 빌드다.

## 5. 그래픽

v4의 밝은 팔레트·투시도·실시간 입체 부품을 유지한다. 주행은 기존 3D 월드와 원래 고양이 모델을 사용한다. 정비소 원화의 캐릭터만 원래 크림색/타원 눈/입 없는 디자인으로 복원했다. 정식 차량 전체 모델과 원화의 차체 스타일은 아직 다르며 새 통합 3D 자산 제작은 남아 있다.

원화: `public/art/momo-garage-v5.png`. imagegen 내장 편집 도구 사용, API/CLI 미사용. 편집 대상 v4 정비소 원화와 원래 `cat-face.png`를 동일성 참고로 사용했다. 프로젝트 파일로 복사했으며 원본은 보존했다.

사용 프롬프트:

```text
Edit target: first image, the garage scene. Identity reference: second image, the original cream plush cat face. Change ONLY the cat character in the first garage image to restore the original character identity from image 2. Preserve garage, turquoise roadster, lighting, composition, camera, materials and all background details exactly. The restored character has a very round cream plush head, two small rounded triangular ears with pink inner ears, two simple shiny vertical black oval eyes spaced widely apart, NO visible nose, NO mouth, NO eyebrows, NO whiskers, NO realistic blue irises and NO realistic fur. Match the smooth soft cream plush material and distinctive minimal face of image 2 very faithfully. Small pear-shaped cream body, short rounded cream arms and legs, original simplistic toy character, no denim overalls and no clothing. Position the cute original character beside the car at the same place as the existing cat, one arm resting on the door and a simple small wrench nearby. Keep beautiful high-quality dimensional rendering, neutral daylight, vivid clean teal and blue, no yellow filter. No text or branding. Do not change the car or overall scene.
```

## 6. 자료 검수

복사한 원본 registry와 canonical 원본의 내용/행 관계/개수는 일치했다. 실패하던 drift 시험은 JSON 파일의 CRLF와 생성기의 LF 문자열 비교 차이였다. `simulation/docs/review/registry-before-v5.json`에 이전 파일을 보존하고 복사본의 생성기만 실행했다. JSON.parse 구조 완전 동일, 원문 CRLF→LF 변환 후 바이트 문자열 동일을 확인했다. 원본 프로젝트의 파일은 수정하지 않았다.

데이터 등록과 차량 기술 승인/실행은 구분한다. 180 요구사항은 DRAFT_NOT_APPROVED, 42 기능은 DESIGN_ONLY, 33 case는 AI_DRAFT 상태를 유지한다. 이를 검수 완료 사양이나 실행 완료로 승격하지 않는다. C/TS 실행 모델 계약과 독립 기대값이 있는 기능만 그 범위에서 판정한다. 외부 실차 지식 전체의 기술 검수 완료를 주장하지 않는다.

## 7. 추가 예정

본편 사건 중간 저장/복원, 다른 case의 full-fidelity 저작, 원화와 일치하는 정식 3D 차량/캐릭터, 실제 게임패드 하드웨어/여러 해상도/저시력 UX 시험, BGM, 서명 배포. 현재 본편은 종료 시 진행 중 사건을 잃을 수 있어 종료 경고를 제공한다. 기존 입문 저장/최고 기록은 보존한다.

## 8. 후속 개발 프롬프트

> docs/V5_CAMPAIGN_REPORT.md와 simulation/docs/CASE_ROADMAP.md를 읽고 첫 본편의 실제 입력/화면 UX를 검증하라. 주행→사건→근거→시험→수리→같은 조건 재주행을 사용자 3명 이상이 직접 완료하도록 관찰하고, 억지 Next 반복이나 자료를 숨긴 단계는 개선하라. C/WASM/Rapier 실행, canonical 출처 상태, 독립 오라클과 의미 기반 단서는 유지한다. 중간 사건 저장은 원본 불변 기록과 입력 재생을 검증하는 방식으로 추가하고, 34개 case를 완성이라고 부르지 않는다. 기존 246개 회귀, UI 정적 계약, 독립성과 Windows 패키징을 확인하고 실제 수행한 검증만 보고한다.

## 9. 실행

`release/Vehicle-Logic-Lab-v0.5.0.exe`. 기존 게임 창을 닫은 뒤 새 파일을 실행한다. 메인의 「본편 시작」 → 조사 방식 → 「시험 주행 시작」. 깊은 도구를 바로 쓰려면 「자유 조사」를 선택한다. 「전체 조사 도구」의 검증 화면에는 차량 시나리오 자유 실험이 있다.

개발 서버 `npm run dev`, 접속 5175. `npm test`, `npm run test:simulation`, `node scripts/check-campaign-ui.mjs`, `npm run check:independence`, `npm run build`, `npm run package:win`. 폴더 전체를 떼어내 실행/개발할 수 있고 exe는 개발 서버 없이 실행한다.
