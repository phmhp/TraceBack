# TRACKBACK Phase 4 구현 보고서

## 1. 생성·수정 파일

- Domain/Data: `src/domain/world/MapDefinition.ts`, `src/data/maps/map-proving-01.json`, surface/environment JSON
- Registry/World: Map/Surface/Environment/Asset Registry, MapLoader, SurfaceSystem, TriggerZoneSystem, runtime schema, minimap projection
- Rendering/UI: `src/graphics/world/*`, `src/ui/minimap/Minimap.tsx`, WorldViewContext와 App/Race 연결
- Physics/Test: Rapier adapter/world, 기존 회귀 테스트, `tests/world-system.test.mjs`

## 2. MapDefinition Schema

엔진 독립 계약은 ID/표시 이름, Bounds, 기본 Surface, Capability, Spawn, Route, Road, Surface/Environment Zone, Static Object, Actor Spawn, Trigger Zone, Minimap 설정을 포함한다. `parseMapDefinition`은 시작 시 구조, 범위, 중복 ID, enum, Route/Asset/Preset/Surface 참조를 검증한다. 기존에 Zod가 없어 별도 의존성을 추가하지 않고 작은 Runtime Validator를 사용했다.

## 3. Map Loader

`MapRegistry → parseMapDefinition → createLoadedMap` 순서다. Loader는 `SurfaceSystem`, `TriggerZoneSystem`, 엔진 독립 `WorldPhysicsDefinition`을 조립하며 React나 Rapier 객체를 만들지 않는다.

## 4. Road Segment

각 Segment는 `id/type/points/width/surfaceType/tags`를 가진다. 범용 ribbon renderer가 모든 Segment를 렌더링한다. 첫 맵에는 긴 직선, 완만한 곡선, S 커브, 교차 형태, 흙길이 있다. Road Visual과 Main Route는 별도 데이터다.

## 5. Surface System

`SurfaceSystem.getSurfaceAt({x,z})`가 Surface Zone과 기본 Surface를 해석해 friction, rollingResistance, displayMaterial을 반환한다. 차량은 fixed tick마다 이를 조회해 wheel friction에 반영한다. 값은 실제 인증값이 아닌 Reference Simulation 값이다.

## 6. Static Object / Environment 분리

Static Object는 assetId, transform, collidable을 가진다. Visual은 assetId별 InstancedMesh로 묶고, Loader는 명시적으로 collidable인 일부만 collider로 만든다. Environment 나무는 Zone별 instancing하며 collider가 없다.

## 7. Actor Spawn Point

위치, 방향, routeId, allowedActorTypes, tags를 가진 Lead/Cross/Generic Traffic용 3개 지점이 데이터에 있다. Actor 행동은 구현하지 않았다.

## 8. Hidden Trigger Zone

Bounds, tags, allowedScenarioTypes를 가진 4개 Zone을 정의했다. 기본 렌더링은 없고 위치 및 Capability 조회만 제공한다. Debug 옵션은 모두 false다.

## 9. Main Route

`MAIN_ROUTE`는 orderedPoints, checkpoints, start/finish, closedLoop를 가진 약 1.5km 개방 경로다. 향후 Progress, AI Route, Scenario 위치와 Finish 판정이 재사용할 수 있다.

## 10. World → Minimap 변환

전용 utility가 Route Bounds에서 종횡비를 보존한 scale/padding을 계산한다. X는 좌우, World Z는 SVG Y로 반전한다. RaceHUD에는 좌표 수식이 없다.

## 11. Ego Marker Update

Route/finish는 SVG로 렌더링한다. Ego marker만 `requestAnimationFrame`에서 기존 `readVehicleState`를 읽어 SVG transform을 직접 변경한다. Zustand 60Hz 발행이나 React commit을 만들지 않는다.

## 12. Map Data / VehiclePhysics Boundary

흐름은 `Map JSON → Registry/Schema → MapLoader → WorldPhysicsDefinition + SurfaceInfoProvider → RapierVehiclePhysics`다. Physics는 Map ID, Theme, Tree, Trigger, Minimap, Actor Spawn, Case ID를 모른다. 기존 `Keyboard → DriverInput → SimpleVehicleControlAdapter → VehiclePhysics → Rapier`도 유지했다.

## 13. 두 번째 Map 추가

새 JSON 작성 후 MapRegistry에 ID와 raw data를 등록한다. 새 Surface/Preset/Asset만 각 Registry에 추가한다. 같은 schema로 표현 가능하면 VehiclePhysics, SimulationRuntime, RaceScreen은 수정하지 않는다. Map 선택 UI는 후속 단계다.

## 14. Scenario Engine 확장

향후 Engine은 Case ID로 맵을 분기하지 않고 필요한 capability로 Map/Zone 후보를 검색할 수 있다. `TriggerZoneSystem.findByCapabilities`가 기반을 제공하며 선택 정책과 실행은 후속 Scenario Runtime 책임이다.

## 15. Performance 주의점

반복 장식과 동일 asset은 instancing했고 collider는 소수만 만든다. 현재 월드를 한 번에 렌더링하므로 실제 자산이 늘면 chunking, frustum/LOD, geometry/material 공유가 필요하다. Rapier WASM 번들 크기 경고는 남는다.

## 16. Placeholder Visual

도로 ribbon, ground, 나무/바위/건물/콘/배리어는 Primitive다. Terrain 높이, 차선 decal, 정교한 교차로, GLB asset, Actor 동작, Trigger debug mesh는 남겨 두었다. Surface와 환경 색상도 Placeholder/Reference 데이터이며 Ground Truth가 아니다.

## 검증

`npm run typecheck`, `npm run lint`, `npm run build`, `npm test`를 통과했다. 19개 테스트가 기존 Clock/Input/Rapier/R3F 동작과 Map schema, 참조 오류, Surface/Trigger 위치 조회, Physics 경계, Minimap 투영을 검증한다. 브라우저에서 `Green Valley Circuit` Minimap과 방향 marker 표시도 확인했다.
