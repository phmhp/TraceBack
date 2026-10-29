# Simulation Runtime

SimulationRuntime은 단일 fixed-step 소유자입니다. 브라우저 render delta를 누적한 후 1/60초 단위로 주입된 VehiclePhysicsPort를 호출합니다.
Clock, mutable VehicleState, 임시 control intent, 10Hz HUD publish를 관리합니다. React, Three, Rapier 직접 의존은 없습니다.
직전/현재 pose만 읽어 렌더러가 보간할 수 있습니다. Snapshot 저장/녹화/Replay 기능이 아닙니다.
driver/DriverInputRuntime은 최신 DriverInput을 mutable plain object로 소유하며 setter에서 범위를 제한합니다.
control/SimpleVehicleControlAdapter는 TEMPORARY arcade DriverInput→force mapping이며 이후 VMC/Actuator 경로로 교체할 위치입니다.
Pause/Reset은 accumulator와 input을 초기화합니다. Resume은 다음 프레임의 오래된 delta를 버립니다.
