TRACKBACK Map Import Phase를 진행한다.

이번 목표는 판교 제2테크노밸리를 첫 실제 지도 기반 Sample Map으로 가져오는 것이다.

Overture Maps를 1차 데이터 소스로 사용한다.
게임 Runtime에서 지도 API/타일을 직접 호출하지 않는다.
개발 시 Overture 데이터를 다운로드하고 Local Map Data로 변환한다.

[핵심 범위]
- transportation/segment
- transportation/connector
- buildings/building
- 필요 시 places/place

초기 Sample bbox는 다음 값을 시작점으로 사용한다.
(공식 사업지 경계가 아니라 Import 테스트용이며, Overture Explorer에서 시각적으로 확인 후 조정한다.)

west=127.076
south=37.398
east=127.098
north=37.415

[다운로드 예]

overturemaps download --bbox=127.076,37.398,127.098,37.415 -f geojson --type=segment -o pangyo2_segments.geojson

overturemaps download --bbox=127.076,37.398,127.098,37.415 -f geojson --type=connector -o pangyo2_connectors.geojson

overturemaps download --bbox=127.076,37.398,127.098,37.415 -f geojson --type=building -o pangyo2_buildings.geojson

필요 시 place도 별도 다운로드한다.

[구현 방향]
GeoJSON
→ CRS/좌표 변환
→ TRACKBACK Local X/Z
→ Road Network 생성
→ Continuous Road Mesh 생성
→ Building Footprint Extrusion
→ Rapier Collider 생성
→ TRACKBACK Visual Style 적용
→ Minimap Route Overlay

[중요]
1. Overture 도로 전체를 Race Route로 사용하지 않는다.
2. 실제 Road Network와 게임용 Race Route를 분리한다.
3. ImportedBaseMap과 TRACKBACK Scenario Overlay를 분리한다.
4. Case/Fault/Trigger를 실제 지도 데이터에 하드코딩하지 않는다.
5. 실제 Building 외관을 복제하지 않는다. Footprint와 높이 정보만 공간 기준으로 사용한다.
6. height가 없으면 TRACKBACK fallback rule을 사용하고 source를 기록한다.
7. Curve/Intersection에서 Road gap이 생기지 않도록 centerline buffer 방식 또는 동등한 continuous mesh 생성 방식을 사용한다.
8. 실제 지도 Geometry는 preprocessing 단계에서 simplify한다.
9. Attribution metadata를 generated map에 포함한다.

[판교 제2테크노밸리 스타일]
실제 공간 구조는 Overture에서 가져오되 Visual은 다음처럼 재해석한다.
- modern tech/business district
- broad roads
- office building clusters
- nearby highway / ramps
- landscaped roadside
- distant apartment skyline
- surrounding hills
- low-poly / rounded / warm pastel

[완료 기준]
- 판교 제2테크노밸리 영역의 road/building import 성공
- 도로 연결성 확보
- building cluster가 실제 위치관계를 반영
- Ego 차량 주행 가능
- Minimap에서 route 표시 가능
- 외부 API 없이 Local Data로 실행
- 기존 Vehicle/Simulation Architecture 변경 없음

작업 전 먼저 현재 MapDefinition과 이 Import Pipeline의 연결 설계를 보고하고, 승인 가능한 구조라고 판단되면 구현을 진행한다.
