# TRACKBACK Phase 4.1 Race Presentation / World Rework

## 1. Race HUD Before / After

Before는 좌측 상단 Minimap/Timer 카드, 우측 상단 Navigation 버튼, 넓은 하단 입력 패널과 원형 속도계가 World를 가렸다. After는 상단 중앙 Timer, 우측 상단 작은 Minimap, 좌측 하단 3행 Input gauge, 우측 하단 숫자 Speed만 남긴다. 중앙은 Pause/Incident가 없을 때 비어 있다.

## 2. 삭제한 Player HUD 요소

SESSION SETUP, PAUSE, ENTER X-RAY 버튼과 ROUTE DATA, TIME label, 상태/Gear 문장, 조작 설명, Reference Simulation footer를 Race에서 제거했다. Pause는 Esc만 사용한다. X-Ray 개발 진입도 Production HUD에서 제거했다.

## 3. Debug 정보

빌드 label과 상태/source 문자열은 Race에서 숨겼다. 기존 X-Ray와 비 Race placeholder 표시만 유지하며 별도 Debug Overlay 활성화는 후속 작업이다.

## 4. Font

CSS token `--font-game`, `--font-hud`, `--font-engineering`을 분리했다. 한글 fallback은 Pretendard/Noto Sans KR/Malgun Gothic 순이며 HUD 숫자는 둥글고 읽기 쉬운 Latin/Korean fallback을 사용한다.

## 5. Overflow

전역 border-box, Corner absolute layout, clamp 크기, min-width 0, nowrap/overflow-wrap 정책, 작은 화면 전용 규칙을 적용했다. 실제 현재 브라우저 폭에서도 Korean/English 문자열이 경계를 넘지 않음을 확인했다. 1280/1440/1920은 같은 clamp 범위 안에서 고정 Corner를 유지한다.

## 6. Minimap

우측 상단 `104~150px` 크기다. Title/Card를 제거하고 Route, Ego heading, Finish만 표시한다. Trigger/Fault Zone은 표시하지 않는다.

## 7. Driver Input

ACCEL/BRAKE는 5 segment gauge, STEER는 중심선 위 이동 dot으로 표현한다. 설명 문장과 키 가이드는 없다.

## 8. Speed

우측 하단에 숫자와 km/h만 표시한다. 큰 card, 원형 배경, source footer를 제거했다.

## 9. Pause Flow

Esc가 Input neutral과 Simulation/Physics pause를 수행한다. 메뉴는 CONTINUE, SETTINGS placeholder, RESTART RACE, QUIT TO MAIN을 제공한다. Restart/Quit은 별도 modal confirmation을 거친다.

## 10. Road Layout

기존 Long Straight, Gentle/Wide Curve, S-Curve, Intersection, Dirt 구성을 유지했다. 범용 RoadSegment renderer가 shoulder, center line, 양쪽 edge line을 데이터의 path/width로 생성한다.

## 11. Environment Zone

MEADOW, FOREST, URBAN, DIRT_FIELD에 시작부 MEADOW cluster, CONSTRUCTION, SERVICE_AREA Zone을 데이터로 추가했다. 범용 renderer가 Zone type에 따라 tree/flower/building 밀도를 바꾼다.

## 12. Service Facility

`ENV_SERVICE_AREA`가 road start 우측에 배치된다. 현재 garage/control building 역할의 low-poly building cluster이며 parking/equipment/parked vehicle은 Placeholder다.

## 13. Terrain / Horizon

월드 bounds에서 계산한 far edge에 low-poly hill silhouette를 배치하고 fog 범위를 늘렸다. 주행 collider/road 높이는 변경하지 않았다.

## 14. Motion Cue

Center/edge/shoulder marking, Zone cluster와 Horizon을 추가했다. 속도에 따라 wheel spin, camera distance, FOV가 소폭 변한다. Shake와 motion blur는 없다.

## 15. Lighting / Shadow

Warm hemisphere/daylight와 기존 directional shadow를 유지한다. 차량과 가까운 주요 object만 shadow를 만들고 flower/다수 decoration에는 고비용 shadow를 적용하지 않는다.

## 16. Wheel Visual

속도/반지름으로 wheel spin angle을 frame마다 계산한다. 앞바퀴 outer group은 DriverInput steering으로 최대 약 0.45rad 회전한다. 이 값은 Presentation이며 Physics에 쓰지 않는다.

## 17. Instancing

Zone tree trunk/crown, flower, building/roof와 Asset ID별 Static Object를 InstancedMesh로 묶는다.

## 18. MapDefinition Data

기존 핵심 계약은 보존했다. EnvironmentType에 additive `SERVICE_AREA`를 추가하고 MAP_PROVING_01에 시작 Meadow, Service, Construction Environment Zone과 두 visual preset을 추가했다.

## 19. Placeholder Asset

Low-poly tree, flower sphere, box building, cone roof, hill sphere, barrier/cone/rock/building Primitive가 Placeholder다. GLB facility, lamp, sidewalk, crosswalk, delineator, equipment, parked vehicle는 후속 asset 교체 대상이다.

## 20. VMC Boundary

`Keyboard → DriverInput → SimpleVehicleControlAdapter → VehiclePhysics → Rapier`는 변경하지 않았다. HUD, wheel, camera는 reader만 소비하며 VehiclePhysics에 값을 쓰지 않는다. 향후 VMC는 기존 SimpleVehicleControlAdapter 교체 지점에 연결할 수 있다.

## 검증

Typecheck, ESLint, production build와 기존 19개 테스트를 통과했다. 브라우저에서 Production HUD, 중앙 빈 영역, Pause Menu와 Restart confirm dialog, 새 road marking과 environment/horizon을 직접 확인했다.
