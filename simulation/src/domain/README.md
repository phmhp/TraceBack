# Domain

driver/DriverInputTypes.ts는 엔진 독립 DriverInput/Gear/writer-reader 타입입니다. 입력은 plain primitive이므로 JSON 직렬화가 가능합니다.
vehicle/VehicleState.ts는 차량 물리 상태/pose 타입입니다. DriverInput 중복 필드는 없습니다. Y-up, 전방 -Z, position(m), speed(m/s), velocity(m/s,rad/s), quaternion을 사용합니다.
VehiclePhysicsPort.ts는 force(N)/steering(rad) 명령과 step/readState/reset 계약입니다.
구체 physics, UI, runtime 또는 JSON을 참조하지 않습니다.
정식 DriverInput/VMC/Brake/Steering/AEB/Airbag/Watchdog 기능 logic은 아직 없으며 필요 시 기능별 순수 TypeScript로 추가합니다.
