# TRACKBACK 기본 Map Refinement 보고서

## 1. Road Gap 원인

기존 renderer는 각 RoadSegment가 자기 첫/끝 접선으로 좌우 edge를 계산했다. Straight 끝 normal과 Curve 시작 normal이 달라 같은 center point에서도 양쪽 vertex가 일치하지 않았고, 좁아지는 S-Curve와 Intersection에서 gap과 꺾인 joint가 두드러졌다.

## 2. Road Geometry 수정

Main Route orderedPoints를 centripetal Catmull-Rom curve로 샘플링하고 Asphalt 부분을 하나의 연속 centerline ribbon으로 생성한다. Shoulder, surface, center line, 양쪽 edge line은 같은 sample과 normal을 공유한다. Dirt 시작점은 `surfaceType === DIRT`인 Segment data에서 찾고 별도 연속 ribbon으로 전환한다.

## 3. Curve / Intersection Joint

Curve는 segment별 rectangle 대신 continuous sampled tangent를 사용한다. Intersection에는 center point 기반 원형 asphalt patch를 두고 cross-route ribbon을 겹쳐 진입/이탈 seam을 가린다. Asphalt/Dirt는 동일 center point를 공유하고 shoulder가 약간 겹쳐 틈을 방지한다.

## 4. Roadside Placement Rule

범용 RoadsideInfrastructureRenderer가 RoadSegment path를 약 24m 간격으로 샘플한다. HIGH_SPEED tag에는 post/guardrail, CURVE에는 tree/rock, INTERSECTION에는 lamp, DIRT에는 rock, non-straight 진입에는 sign을 배치한다. 위치는 tangent의 normal과 road width로 계산하므로 Map 고유 좌표 배열을 renderer에 넣지 않는다.

## 5. Near / Mid / Background

- Near: route-derived post, rail, lamp, sign, rock, tree.
- Mid: Environment Zone의 tree/flower/building cluster와 Map static facility/warehouse/wall.
- Background: world bounds 기반 hill mass, apartment/office silhouette, forest zone.

## 6. Environment Zone

MEADOW, FOREST, URBAN, CONSTRUCTION, DIRT_FIELD, SERVICE_AREA를 사용한다. 시작부 Meadow와 Service/Construction Zone도 Map JSON에 명시되어 있다.

## 7. Apartment / Urban Cluster

Map data에 Apartment A 3동, Apartment B 2동, Office 1동, Shop 1동을 intersection/urban bounds 양쪽 setback에 배치했다. 개별 detail보다 서로 다른 높이 22~28m와 warm gray/cream/muted blue accent로 단지 silhouette와 scale을 만든다.

## 8. Highway 구간

Long Straight의 HIGH_SPEED capability가 넓은 asphalt/shoulder, center/edge marking, route-derived roadside post/guardrail, Sound Barrier, Highway Barrier, Large Sign과 연결된다. Open proving/service building은 road 밖 setback에 배치했다.

## 9. Mountain Road

Wide Curve/S-Curve에서는 Tree/Rock 밀도를 높이고 Retaining Wall 2개와 curve sign을 배치한다. 원경 hill/forest mass가 valley 경계를 만든다. 주행 surface와 physics elevation은 안정성을 위해 이번 refinement에서 변경하지 않았다.

## 10. Large Asset

AssetRegistry에 APARTMENT_BLOCK_A/B, OFFICE_OR_COMMERCIAL_A, SMALL_BUILDING_A, WAREHOUSE_A, GARAGE_OR_TEST_FACILITY_A, RETAINING_WALL, SOUND_BARRIER, LARGE_ROAD_SIGN, HIGHWAY_BARRIER를 추가했다. Map은 path 대신 assetId만 참조한다.

## 11. Instancing

Roadside post/rail/tree/rock/lamp/sign은 종류별 InstancedMesh다. Zone tree trunk/crown, flower, building/roof 및 동일 assetId Static Object도 instancing한다. background에는 collider가 없다.

## 12. 성능 변화

추가 반복물은 object별 React component 대신 6개 roadside batch와 기존 Zone/Asset batch에 합쳤다. Production main JS는 이전 약 1,103kB에서 약 1,112kB로 약 9kB 증가했다. Rapier chunk는 동일하다. Background large object와 새 static object는 `collidable:false`라 physics body 수는 증가하지 않는다.

## 13. Placeholder Asset

건물은 box body와 accent roof band, 산은 low-poly sphere mass, rail/post/sign/lamp는 단순 geometry다. Window grid, entrance, parking line, sidewalk/crosswalk, proper lamp head, chevron texture, dust와 detailed GLB는 후속 asset 교체 범위다.

## 14. Map Quality Check

- Road: Main Route가 하나의 sampled ribbon으로 연결되며 curve normal discontinuity를 제거했다. Intersection/Surface transition에는 overlap patch가 있다.
- Environment: 시작 직선에서 post, guardrail, facility mass가 계속 보이며 Curve/Dirt는 type별 near object가 생성된다.
- Zone: Highway, Urban/Apartment, Mountain/Forest, Open Facility, Dirt의 palette와 silhouette가 구분된다.
- Scale: 22~28m apartment, warehouse, sound barrier와 hill mass가 mid/background scale을 만든다.
- Performance: typecheck/lint/build와 19개 tests 통과. Production build 증가량은 약 9kB이며 physics body 수는 그대로다.

## 15. 남은 Critical Issue

Vehicle Software Architecture Phase로 넘어가는 것을 막는 Critical Issue는 없다. 현재 Route는 open route라 실제 lap/finish 시스템이 없고 브라우저 자동 한 바퀴 검증은 불가능하다. 세밀한 차선 dash, texture, parking/crosswalk, 실제 elevation collider, GLB asset과 dust는 Placeholder polish이며 다음 VMC/Communication/Fault 작업의 선행 조건이 아니다.
