# Core

SimulationClock은 프레임/엔진 독립 fixed-time clock입니다. 초 단위 currentTime/deltaTime과 running/paused, start/pause/resume/reset/step을 제공합니다.
PHYSICS_TIMESTEP=1/60은 게임 물리용 기본값이며 ECU Task 또는 검증 기준이 아닙니다.
placeholder.ts는 UI fixture를 구분하는 타입입니다. Core는 React, Rapier 및 실행 계층을 참조하지 않습니다.
