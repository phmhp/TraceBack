# TRACKBACK — Phase 4.1

React + TypeScript + Vite 기반 차량 SW 고장 추적 게임입니다. Phase 4.1은 기존 Simulation/Data Architecture를 유지하면서 Race HUD와 데이터 기반 Proving Ground 표현을 개선합니다. VMC, CAN, Fault, Verification, Traffic Behavior는 아직 구현하지 않습니다.

## 실행

프로젝트 폴더 `C:\\Users\\user\\Desktop\\Traceback`에서 실행합니다.

```sh
npm ci
npm run dev
npm test
npm run lint
npm run build
```

조작은 ↑ 가속, ↓ 제동, ←/→ 조향, Esc 일시정지/재개입니다. Gear는 현재 D 고정이며 숫자키 변속은 지원하지 않습니다.

## 현재 구조

- `src/data/maps`: MapDefinition JSON. 현재 `MAP_PROVING_01` / `Green Valley Circuit` 한 개.
- `src/domain/world`: 엔진 독립 Map, Route, Surface, Object, Spawn, Trigger 계약.
- `src/registries`: Map/Surface/Environment/Asset ID 해석.
- `src/world`: Runtime schema, MapLoader, Surface/Trigger 조회, Minimap 투영.
- `src/graphics/world`: Road, Environment, Static Object 범용 렌더러.
- `src/ui/minimap`: Route SVG와 ref 기반 Ego marker.
- `src/physics/rapier`: World collider와 Surface provider를 주입받는 Rapier 어댑터.

RACE에는 긴 직선, 완만한 곡선, S 커브, 교차 형태, 흙길이 포함된 약 1.5km Main Route와 Minimap이 표시됩니다. 정적 오브젝트, 환경 장식, Actor Spawn, Trigger Zone은 데이터로 정의되며 Trigger Zone은 기본 화면에 노출되지 않습니다.

표면 계수와 차량 파라미터는 승인된 Ground Truth가 아닌 **TRACKBACK Reference Simulation / Placeholder 값**입니다. World 기반은 [Phase 4 보고서](docs/PHASE_4_REPORT.md), 최종 기본 맵 품질 기준은 [Map Refinement 보고서](docs/MAP_REFINEMENT_REPORT.md)를 참고하세요.
