# v0.7 — 연결 퍼즐에서 차량 설계·검증 여정으로

## 1. 이번 결과와 진입

새 게임과 원래 흰둥를 유지했다. 기존 본편으로 보내지 않는다. 메인 화면의 **차량 시스템 지도 · 심화 설계** → 구동 선택 → **구동 심화 설계실**에서 새 모듈을 연다. 기존 READY 세 장과 저장도 유지한다. 독립 최상위 폴더 전체를 옮겨 실행할 수 있다.

이번 범위는 판정 의미와 학습 근거를 먼저 정리한 Phase A 확장이다. 정답 도장만 늘리거나 기존 조사/수리 구조를 삭제하지 않았다. 닌텐도 스위치 판매 수준·OEM/Tier1 교육 적합성은 목표이지 이번 빌드에서 달성·인증했다고 주장하지 않는다.

## 2. 선·확대·실패 진단

- 클릭 두 번/드래그 READY 연결을 보존하면서 직교 배선, 선택한 블록/신호의 상·하류 경로 강조, 관계없는 선 흐리기, 전체 표시를 추가했다. 심화 설계는 신호 품질/요청·상한/허용·동특성/전체 묶음으로 나눈다. 접힌 묶음에서 온 신호는 경계 표시가 있다.
- 고정 툴바의 전체 맞춤/100%/확대·축소, 포인터 기준 휠 줌, 빈 공간 드래그와 실제 스크롤 영역을 제공한다. 교차가 전혀 없는 자동 배선·완전한 장애물 회피 라우터는 아니다. 자유 편집기도 휠 줌·직교선·선택 경로를 사용한다.
- READY 검증은 구조 오류와 동작 불일치를 구분한다. 최초 실패 입력/시간, 기대·실제, 점검 경로를 보여준다. 리플레이와 판정은 같은 실제 평가 추적을 사용한다. 예측 퀴즈 답을 틀려도 올바른 로직을 FAIL로 만들지 않는다. FAIL은 근본 원인 확정이 아니다.
- 정상 요구사항은 기본 펼침이다. 정면/페달/기어 시점과 바깥 시점 중 기본은 바깥이며, 페달 보기는 카메라를 실제로 옮기고 운전대를 숨기는 절개 보기다.

## 3. 기술 깊이: 구동 제어 1개 단위

단순 참/거짓에서 %, ms, Nm, flag를 가진 수치 그래프로 확장했다. 이중 채널·범위·Freshness, 페달–토크 이득, 가용 토크 상한, 제동 우선·모드 허용, 상태를 가진 증가/감소 변화율, 즉시 차단·복구를 다룬다. 새 사양은 [TRAINING_DRIVE_SPEC_v1.md](TRAINING_DRIVE_SPEC_v1.md)의 명시적 가상 교육 사양이다.

19개 정상·경계·고장·복구 시험은 학습 그래프를 읽지 않는 독립 오라클과 비교한다. 이득 결함 주입, 실시간 입력 조작, 기대/실제 곡선, 틱별 재생·최초 실패, 단위/연결/파라미터 오류 표시가 있다. 시험 합격과 예제 사용 이력을 저장하고 변경 시 합격을 해제한다. 설계·사양·입력·출력·실패 틱·시험 추적을 JSON으로 내보낸다.

학습 가치: 정상 조건을 먼저 명세하기 → 신호의 단위와 유효성을 정의하기 → 상태/주기/우선순위를 구현하기 → 경계값과 결함을 시험하기 → 근거를 남기기 → 다른 기능과 경계 계약을 확인하기. 아직 한 구동 단위의 교육이며 자동차 전체 검증 실무를 모두 교육하지 않는다.

## 4. 그래픽과 물리 반응

밝은 청록·블루·화이트의 자체 세계관을 유지했다. 이미지 생성 스킬의 built-in 모드로 반투명 EV 단면 원화를 새로 제작해 전체 지도에 적용했다. 게임 캐릭터는 변경하지 않았다. 모터의 구리 회전자, 감속 기어, 입력 페달, 브레이크 캘리퍼/피스톤과 신호 펄스는 실시간 3D 모형으로 움직인다. 수치 블록에도 채널 바, 이득 다이얼, 제한 창, 허용 래치, 변화율 표시가 있다.

부품 모형과 원화는 개념 시각화다. 실제 기구학·응력·전자기 모터·유압 모델이나 양산 배선도는 아니다. 회전이 실제 RPM이라는 주장을 하지 않는다. 자동차 전체 3D 아트 리깅/최적화·정식 표정·환경/서킷 제작은 남아 있다.

차량 보기에서는 학습 토크를 기존 C/WASM의 추가 상한으로 적용한다. 원본 C 명령과 적용 추진력을 분리했다. 판정은 논리 단위 시험이며 물리 관찰과 혼동하지 않는다. 화면 논리 20ms/표시 100ms/기존 물리 실행은 아직 단일 시계로 동기화된 통합 시험이 아니다. 상세 경계는 사양 5절을 따른다.

## 5. 전체 차량 지도와 누적 산출물

기존 참조 구조의 16개 영역을 기능·부품, 요구사항·시험 추적, SW·AUTOSAR 관점으로 본다. 현재 READY와 새 구동 모듈만 직접 제작·검증할 수 있고, 나머지는 실행기 재사용 또는 참고 설계/미션 미구현으로 구분한다. 완료 수는 2개 제공 모듈에 대한 값이지 전체 차량 완성률이 아니다.

두 모듈 완료 시 READY→구동의 정상/차단 세 가지 기능 경계 계약을 검사한다. 출처/검수 상태를 보존한 기존 전체 차량 아키텍처·신호·인터페이스·요구사항 자료 탐색기를 지도에서도 열 수 있다. AUTOSAR 화면은 SWC/Runnable/포트/RTE/BSW의 개념 매핑이며 실제 AUTOSAR 생성·실행 환경이 아니다.

## 6. 재사용한 것과 새로 만든 것

| 자산 | 적용 상태 |
|---|---|
| 기존 C/WASM 제어·Rapier 물리·캘리브레이션 | 독립 복사본을 계속 실행. 선택적 추가 토크 상한과 적용력 관찰만 복사본 런타임에 추가. 원본 C 명령 보존. |
| 차량·원래 CatDriver·크림색 고양이 자산 | 유지. 캐릭터 교체 없음. |
| 기존 canonical 차량 자료·요구사항/신호/인터페이스 | 로컬 자료 탐색에서 재사용. DRAFT/DESIGN_ONLY/AI_DRAFT 등 상태를 유지. 검수 없이 새 채점 정답으로 쓰지 않음. |
| 기존 READY 로직·상태·저장·독립 오라클 | 보존/회귀. 최초 실패 추적과 진단을 추가. |
| 구동 수치 사양·평가기·독립 오라클·시험·기능 계약 | 신규. 기존 양산 데이터나 C 코드의 공식 사양이라고 주장하지 않음. |
| 직교/포커스/그룹/줌, 단면 지도, 실시간 부품/블록 시각화 | 신규 또는 기존 새 게임 UX 확장. 완성된 전체 차량 CAD/Simulink/AUTOSAR IDE가 아님. |

이전 세부 자료 목록은 [REUSE_AUDIT.md](REUSE_AUDIT.md), 직전 버전의 기능은 [V6_EXPERIENCE_REPORT.md](V6_EXPERIENCE_REPORT.md)에 이력으로 남겼다. 이번 변경은 `vehicle-logic-lab/` 내부에 한정한다.

## 7. 검증 범위

- 새 게임/엔진/저장/구동/줌/수치 모델 52개 자동 테스트 통과. 독립 19개 시나리오, 9가지 파라미터 변이 검출, 1,000틱 입력 시퀀스 대조, READY 경계 계약, 인증 재검사/손상 저장 보존, 실제 Rapier 추진력 상한과 원본 C 텔레메트리 보존을 포함한다.
- 보존한 시뮬레이션 221개 회귀 통과. 합계 273개다. 별도 UI 계약 검사는 정상 요구사항 펼침, 새 보드/지도/고지 렌더링, 운전대 절개 보기, 모터/감속기·페달·펄스 동작과 일시정지를 검사한다.
- 타입 검사·프로덕션 빌드·독립성 검사 통과. Windows portable v0.7.0(133,021,651바이트)을 생성했다. 패키지 `app.asar`의 58개 dist 파일이 현재 빌드와 바이트 단위로 일치했다. 개발 서버 의존 모듈 109개와 새 원화를 두 차례 조회해 모두 HTTP 200을 확인했다. `scripts/check-delivery.mjs`로 재검사할 수 있다. 기존 실행파일을 지우지 않는다.
- 브라우저 제어의 기존 차단 때문에 실제 GPU 화면 캡처, 확대/포트 조작의 실플레이, 해상도별 레이아웃·실행파일 전체 플레이 QA는 미완료다. 렌더러/HTTP/패키지 검사는 실제 플레이를 대신하지 않는다. 빌드의 큰 번들 경고도 남아 있다.

## 8. 다음 개발 순서와 완료 조건

1. 실제 1280×720/1440×960/1920×1080 플레이 QA. 확대·이동·연결·실패 패널·절개 카메라·실행파일/저장 로딩 증거를 남겨야 한다. 상용 그래픽 품질은 이를 거쳐 별도로 평가한다.
2. 단일 시계의 입력/초기조건/상한/주행 로그로 제어기와 플랜트를 연결하고 속도·거리·제동 독립 오라클을 추가한다. 논리 PASS와 물리 PASS를 분리한 통합 시험으로 발전시킨다.
3. 이 기술 모듈을 현재 사건/단서/가설/수리/재주행에 편입한다. 방문 횟수가 아닌 정상·이상 판단 근거를 모으며 기존 조사 의미 구조를 유지한다.
4. 원본 데이터 검수 후 제동 우선/기어 인터록/에너지 가용성, 통신 지연·유효성, 진단 디바운스·복구를 하나씩 모듈화한다. 각 모듈은 요구사항·단위·사전조건·시험·명시적 기능 경계 계약을 가져야 한다.
5. 검증된 모듈을 상위 차량 시스템 구성과 실제 스케줄/인터페이스 계약으로 통합한다. AUTOSAR 학습은 검수된 SWC/포트/Runnable/모드→RTE/BSW/OS 할당 예제를 별도 정의하고 미구현과 구분한다. 이후 캐릭터/수리/보상·환경 품질을 확장한다.

구체 후속 요청문은 [FOLLOW_UPS.md](FOLLOW_UPS.md)의 v0.7 항목을 사용한다.

## 9. 생성 원화 기록

실제 저장 경로: `public/art/system-atlas-v7.png`. 생성 방식: **built-in image generation**, fallback CLI 미사용. 기존 자산은 덮어쓰지 않았다. 개념 원화로 표기하고 기술 판정과 분리한 것이 이미지 생성 스킬을 적용한 범위다.

원화 SHA-256: `0EBED9B2D9C225D2F2755DA269E36011AC0EFC6B9D32C997B7CE9FC1A6355170`.

최종 프롬프트:

```text
Use case: stylized-concept. Asset type: high-quality wide background artwork for TRACKBACK's original bright cozy vehicle-engineering game, a vehicle system atlas. Primary request: polished 3D-rendered engineering diorama of a compact rounded teal electric prototype roadster in an airy white and ice-blue automotive laboratory. Wide 16:9 composition, car centered with ample clean negative space around it for interactive overlays. The car body is semi-transparent, showing clearly organized but deliberately educational mechanical groups: front steering rack and pedal linkage, four detailed wheels with brake discs and calipers, flat underfloor battery modules with orange high-voltage cabling, rear electric motor with copper rotor and short reduction gear/differential, small silver electronics enclosure near the dashboard. High three-quarter overhead view, front points lower left, rear upper right. Parts occupy plausible separate regions, coherent axles and wheels; attractive softly bevelled surfaces, glass transparency, fine brushed aluminium, rubber, copper and teal enamel, realistic ambient occlusion and soft directional shadows. Premium original console-game art, clean daylight white balance, sky-blue/teal/lavender accents, high detail with readable silhouettes. No characters, no text, no letters, no labels, no arrows or interface panels, no logos, no watermark. No Nintendo or third-party game identity. No yellow/sepia filter, no dark background. This is a conceptual educational EV cutaway, not a claim of production architecture; the actual simulation values and labels will be provided in code.
```
