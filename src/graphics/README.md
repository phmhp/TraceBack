# Graphics

Presentation 전용입니다. Runtime이나 Rapier를 직접 import하지 않습니다.

- RaceViewport: 공통 Canvas/조명, 메뉴 또는 engineering 배경. app에서 live race children을 주입합니다.
- VehicleRenderer: 직전/현재 물리 pose를 보간하여 mesh를 갱신하고 카메라와 동일한 render pose를 공유합니다.
- FollowCamera: 보간된 차량에서 뒤 7m/위 3.1m 거리 유지, yaw만 부드럽게 추적합니다.
- RoadRenderer: Phase 2용 단순 평지/직선 도로. collision 크기는 composition root에서 전달합니다.
- PlaceholderVehicle: 실제 주행에 재사용하는 민트색 차량 외형. 파일명은 기존 자산 이름이며 physics를 소유하지 않습니다.
- CatDriver: 최신 참고 이미지의 크림색 인형 고양이. 작은 검은 타원 눈, 둥근 귀/얼굴/앞발.
- SoftShapes: 공통 둥근 geometry/material.
- PlaceholderTrack: 기존 파스텔 마을. 메뉴에서만 사용하며 live RACE에는 표시하지 않습니다.

외형 geometry는 collider나 차량 calibration을 정의하지 않습니다. 캐릭터 자체 행동/animation은 없습니다.
Render pose는 Physics로 되돌려 쓰지 않으며, 기록/Replay 기능도 아닙니다.
