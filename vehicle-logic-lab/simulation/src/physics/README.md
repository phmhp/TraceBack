# Physics

RapierWorld는 @react-three/rapier provider와 RuntimeBridge입니다. 자동 stepping은 paused=true로 끄고 context.step만 Runtime에 전달합니다.
rapier/RapierVehiclePhysics는 ground와 dynamic chassis, 4-wheel DynamicRayCastVehicleController를 생성하고 VehiclePhysicsPort를 구현합니다.
중력/접촉/차량 이동을 담당하며 domain 명령(N/rad)과 state(m/s/quaternion)만 경계에 노출합니다.
시각 mesh로 collider를 만들지 않습니다. pitch/roll lock은 Phase 2 arcade stabilization입니다.
Rapier의 world 해제 전 layout cleanup에서 adapter를 분리·해제하여 StrictMode/화면 전환 자원 누수를 방지합니다.
phase2Config 값은 게임용 임시 calibration이며 실제 차량 Ground Truth가 아닙니다.
