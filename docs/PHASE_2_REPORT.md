# TRACKBACK Phase 2 구현 보고서

## 구현 범위

독립 SimulationClock, 60Hz Rapier World, 조작 가능한 Ego Vehicle 1대,
키보드 입력, 3인칭 Follow Camera, 10Hz HUD, Pause/Resume.
기어는 요청한 대로 D 고정이며 숫자 1/2/3/4는 처리하지 않습니다.

기존 캐릭터/차량 외형과 UI flow를 유지했습니다. RACE에는 단순 평지/직선 도로만 표시하며,
기존 나무·집 등은 메뉴 배경에서만 사용합니다. 새 장식이나 캐릭터 기능을 추가하지 않았습니다.

요청에서 참조한 docs/00_TRACKBACK_MASTER.md는 현재 프로젝트에 없었습니다.
실제로 존재하는 루트 00_TRACEBACK_MASTER.md 및 기존 Requirement.md를 참고했고,
이번 첨부 Phase 2 프롬프트를 구현 범위의 기준으로 사용했습니다. 원본 참고 문서는 수정하지 않았습니다.

## 1. 생성/수정 파일

### 생성

- src/app/GameApplication.tsx — composition root, 화면/세션 생명주기, 입력 바인딩
- src/app/GameViewport.tsx — 화면별 presentation과 Physics 조립, 오류 경계
- src/core/SimulationClock.ts — 독립 고정 시간 시계
- src/domain/vehicle/VehicleState.ts — 상태/입력/pose 계약
- src/domain/vehicle/VehiclePhysicsPort.ts — 엔진 독립 command 및 adapter 계약
- src/runtime/SimulationRuntime.ts — 단일 fixed-step 소유자와 HUD publish
- src/runtime/SimpleVehicleControl.ts — 임시 가속/제동/조향 명령 변환
- src/physics/RapierWorld.tsx — @react-three/rapier와 runtime bridge
- src/physics/rapier/RapierVehiclePhysics.ts — 실제 Raycast vehicle adapter
- src/physics/rapier/phase2Config.ts — 임시 물리 파라미터/좌표
- src/graphics/VehicleRenderer.tsx — 차량 mesh pose 보간
- src/graphics/FollowCamera.tsx — 동일 render pose를 추적하는 카메라
- src/graphics/RoadRenderer.tsx — 평지/직선 도로 표시
- src/ui/input/KeyboardDriverInput.ts — 키보드 → control intent
- src/ui/state/raceHud.ts — 저주기 telemetry Zustand store
- src/ui/state/RaceActionsContext.ts — Pause/Resume UI action
- src/ui/components/RaceHUD.tsx — Timer/Input/Speed/Status
- src/ui/components/RacePauseOverlay.tsx — Loading/Pause/Error 표시
- tests/clock-runtime.test.mjs
- tests/keyboard-input.test.mjs
- tests/vehicle-physics.test.mjs
- tests/r3f-integration.test.mjs
- docs/PHASE_2_REPORT.md

### 수정

- src/main.tsx — GameApplication을 진입점에 연결
- src/ui/App.tsx — scene 주입 및 live/placeholder 표시 구분
- src/ui/screens/RaceScreen.tsx — 실제 HUD와 Pause/Resume 연결
- src/ui/screens/MainScreen.tsx — 현재 조작 안내
- src/graphics/RaceViewport.tsx — Canvas에 실제 session scene 주입, RACE render loop
- src/ui/styles.css — Pause/Loading 카드
- package.json / package-lock.json — Rapier 직접 의존성, R3F test renderer, test script
- eslint.config.js — 테스트 환경 설정
- README.md 및 core/domain/runtime/physics/graphics/ui README — 현 단계 책임 반영

## 2. SimulationClock

core/SimulationClock.ts는 React/Three/Rapier/브라우저 API에 의존하지 않습니다.
currentTime/deltaTime은 초 단위이며 running/paused를 제공합니다.

- start(): 0초부터 새 실행
- pause(): 시간 진행 중지, deltaTime=0
- resume(): 같은 시점에서 재개
- reset(): stopped 상태, 시간/카운터 초기화
- step(): running && !paused일 때만 정확히 1/60초 진행

정수 tick count에서 currentTime을 계산하여 누적 오차를 줄입니다.
60Hz는 TRACKBACK 게임 Physics 설정이며 ECU Task 주기나 ISO 검증 기준이 아닙니다.

## 3. Physics Loop

R3F render delta
→ Runtime accumulator
→ 1/60초 이상 쌓인 만큼 fixed-step 반복
→ Temporary Command 생성
→ Raycast Vehicle updateVehicle
→ @react-three/rapier context.step(1/60)
→ Clock step / VehicleState 읽기
→ 6 tick마다 HUD publish
→ 렌더링 시 pose 보간

Physics의 paused prop은 항상 true로 두어 라이브러리의 자동 stepping을 끕니다.
RuntimeBridge가 공급한 context.step만 Runtime의 fixed loop에서 호출합니다.

한 render delta는 0.1초로 제한하므로 최대 6 step을 처리합니다.
Pause/Resume에서는 accumulator를 비우고, 재개 직후 오래된 wall-clock delta를 버립니다.
UI/시뮬레이션 일시정지 중 world.step은 호출하지 않습니다.
SW Task/VMC/CAN scheduler는 구현하거나 이 주기에 묶지 않았습니다.

## 4. Vehicle Input → Physics

KeyboardDriverInput
→ DriverControlState { accelerator, brake, steering }
→ SimpleVehicleControl
→ VehiclePhysicsCommand { driveForce, brakeForce, steering }
→ RapierVehiclePhysics
→ DynamicRayCastVehicleController / RigidBody

입력은 가속/제동 0..1, 조향 -1(left)..1(right)입니다.
Command는 전체 바퀴 구동력/제동력 N, 조향각 rad입니다.
Rapier brake API는 impulse이므로 adapter에서 N × fixedDelta / wheelCount로 변환합니다.
차량 전방은 -Z, 위쪽은 +Y, rotation은 quaternion입니다.

키 입력은 Physics 객체나 mesh를 직접 수정하지 않습니다.
키 반복, 서로 반대 방향 입력, blur, visibilitychange, keyup 및 listener 해제를 처리합니다.
Pause 전 입력이 Resume 후 남지 않도록 입력 집합과 runtime intent를 초기화합니다.

## 5. High-frequency state

Rapier world는 차체와 raycast wheel의 물리 상태를 소유합니다.
SimulationRuntime의 mutable VehicleState는 position/rotation/linearVelocity/angularVelocity/speed 및 input 값을 제공합니다.
readVehicleState()는 다음 tick까지 유효한 읽기 전용 live view이며 저장된 Snapshot이 아닙니다.

렌더러를 위해 직전 tick pose 하나만 추가로 유지합니다. 현재/직전 pose와 accumulator 비율을 사용해
position 선형 보간 / quaternion slerp를 수행합니다. 녹화, history, Snapshot 저장/복원 또는 Replay 기능은 없습니다.
표시에 쓰는 보간 pose는 Physics에 되돌려 쓰지 않습니다.

## 6. React/Zustand publish

- navigation store: 화면 ID 및 이동 action
- raceHud store: 약 10Hz speedKmh/time/accelerator/brake/steering/status/error
- 상태 전환: Loading, Running, Pause, Reset, Error 즉시 발행

position/rotation/velocity/wheel transform은 Zustand에 저장하지 않습니다.
Timer/Input HUD는 필요한 필드만 selector로 구독합니다. App은 HUD store를 구독하지 않습니다.
실제 R3F 통합 테스트에서 240 Physics Tick 동안 추가 React commit이 없음을 확인했습니다.

## 7. Camera Follow 및 떨림 보정

VehicleRenderer는 -50 priority에서 보간된 pose를 표시하고 같은 pose를 presentation buffer에 씁니다.
FollowCamera는 -10 priority에서 그 pose를 읽어 뒤쪽 7m/위쪽 3.1m를 유지합니다.
방향(yaw)만 지수 보간으로 부드럽게 바꾸며, 위치에 별도 추적 지연을 더하지 않습니다.

기존 방식은 60Hz mesh 이동과 별도 camera position lerp가 서로 다른 위치를 사용하여
프레임 사이 카메라 거리가 흔들릴 수 있었습니다. 공통 render pose와 고정 거리로 이 원인을 제거했습니다.
30/60/144fps 혼합 테스트에서 camera-to-vehicle 거리 오차 < 1e-6m, 차량 scale=[1,1,1]을 확인했습니다.
브라우저에서의 시각적 결과를 자동 스크린샷으로 판정하지는 않았습니다.

## 8. Temporary Control 위치

runtime/SimpleVehicleControl.ts: 실제 ECU/VMC 제어가 아닌 TEMPORARY arcade mapping.
최대 구동력 1800N, 속도에 따른 구동력 감소, 브레이크 우선, 최대 제동력 6500N,
속도 증가 시 최대 조향각 감소를 적용합니다.

physics/rapier/phase2Config.ts: 임시 질량 220kg, 바퀴 반경 0.425m, suspension 길이/스폰/접촉 치수.
Rapier adapter의 suspension/friction 설정 역시 게임용 tuning입니다.
Collider는 시각 mesh에서 자동 생성하지 않으므로 캐릭터/외형 교체가 물리를 바꾸지 않습니다.

## 9. 다음 Phase 확장 지점

현재 runtime의 writeSimpleVehicleCommand 호출 지점을 DriverInput → VMC → Actuator Controller 경로로 교체하면 됩니다.
최종 출력은 VehiclePhysicsCommand 계약으로 adapter에 전달하므로 입력 장치/UI/physics adapter를 다시 결합할 필요가 없습니다.
SW/통신 주기는 별도의 Simulation Time scheduler로 추가하며 physics 60Hz에 하드코딩하지 않습니다.
현재는 관련 scheduler/registry/framework를 선행 구현하지 않았습니다.

## 10. 검증 및 알려진 한계

검증: 11개 자동 테스트, TypeScript build, ESLint 통과.

- 실제 Rapier: 약 4초 가속 후 53.8km/h, -Z 38.8m 이동; 2초 제동 구간 내 정지 확인.
- 좌/우 방향과 지속 선회 중 유한한 속도/안정된 높이 확인.
- Pause 중 600회 render advance에도 pose/velocity/time 변화 없음.
- 30/60/144fps 모두 10초에 600 Physics Tick / 100 HUD publish.
- 실제 R3F Physics component에서 단일 step, mesh/camera 연결, StrictMode cleanup 검증.
- 창/키보드 입력 해제 및 재개 후 stale input 방지 검증.

한계:

- Arcade 안정화를 위해 pitch/roll은 잠그고 yaw만 허용합니다. 정밀 차량 dynamics가 아닙니다.
- speed는 수평 linear velocity 크기의 km/h 변환이며 vertical suspension velocity는 HUD 속도에서 제외합니다.
- wheel spin/개별 suspension mesh 변환, gear shift, EPB, camera 변경, track finish/lap/traffic는 미구현입니다.
- 도로/평지는 유한하며 경계 복귀나 낙하 복구 기능은 없습니다.
- 메뉴/X-RAY/DEBRIEF의 engineering 정보는 Placeholder입니다. 검증 판정을 생성하지 않습니다.
- 실제 브라우저 키보드/화면 시각 QA는 미실시입니다. 대신 Node에서 실제 Rapier와 R3F 연결을 테스트했습니다.
- Rapier WASM 번들 크기 경고, upstream init deprecation 경고가 남아 있습니다.
