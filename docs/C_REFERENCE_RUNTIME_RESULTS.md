# C Reference Vehicle SW — 구현 및 검증 결과

2026-09-15. Architecture plan: C_REFERENCE_RUNTIME_PLAN.md.

1. **C Source Structure** — c/vehicle_sw/trackback.h, gear.c, propulsion.c, vmc.c, edrive.c, core.c, wasm_bridge.c. 네 논리 SW 컴포넌트와 구성 함수, ABI 변환을 분리했다. 실제 코드 생성기로 생성한 코드라는 주장은 하지 않는다.
2. **Public Interface** — Trackback_Init(Context*, Calibration*, initialGear), Trackback_Reset(Context*, initialGear), Trackback_Step(Context*, Input*, Output*). 명시적 Context로 인스턴스를 격리한다. WASM은 인스턴스마다 하나의 Context와 고정 크기 binary64 입출력 버퍼를 갖는다.
3. **State / Calibration** — Gear Logic만 이전에 수락한 GearState를 유지한다. 나머지 함수는 조합 로직이다. Session 초기값 D를 전달한다. 기존 calibration을 초기화 시 복사하며, 키보드 응답과 torque-to-force는 TS에 남는다. 상태/승인 문서를 재승인하지 않았다.
4. **WASM Build** — Zig 0.14.1의 C 컴파일러, wasm32-freestanding, C11, O2, Wall/Wextra/Werror. npm run build:c. 외부 host import 0개, WASM 약 13 KB. 로컬 자산으로 배포된다. generated/build.json에 ABI, source hash, binary hash, 빌드 인수를 보관한다.
5. **TS Adapter** — WasmVehicleSw가 enum/배열 ABI를 변환하고 물리 입력/Calibration 계약을 검사한다. C 제어 결과를 TS에서 다시 계산하지 않는다. LegacyVehicleSw는 기존 TS 함수를 호출하는 비교용 backend다.
6. **호출 흐름** — DriverInput → SimulationRuntime 고정 스텝 → C Gear → C Propulsion → C VMC → C eDrive → TS force/brake/steering adapter → Rapier → telemetry/X-Ray. GameApplication은 반드시 WASM backend를 주입한다. 로딩 실패 시 오류를 표시하며 TS로 자동 fallback하지 않는다.
7. **TS 대비 차이** — 정상 계약 입력의 제어 결과와 테스트한 주행 응답은 동일하다. 신규 경계에서는 malformed enum, nonfinite physical speed/velocity, 잘못된 calibration을 거부한다. 기존 pedal nonfinite→zero, saturation, P/N inhibit, direct D↔R interlock, brake inhibit, 완주 후 coast/brake를 보존했다. race time과 별도로 C execution step/time을 기록한다.
8. **Normal TC** — TC001–014의 A/B 분기 포함 16개 ID 실행. gating/invalid/pedal/P/N/D/R/torque mapping/limit/interlock은 C, TC011/012는 C+adapter+Rapier. near-stationary에서 1초 뒤 전진 longitudinal velocity +5.07144 m/s, 후진 −3.48076 m/s. 양쪽 VehicleSpeed는 vector magnitude로 nonnegative. 상세 입력/기대/실제/판정은 evidence/c-normal-evidence.json, c-plant-evidence.json.
9. **X-Ray source** — 실제 C 호출 입력·출력, C_WASM, invocation step/time/period, ABI/binary 식별, Calibration reference. Plant 상태는 별도의 post-step 관측값이다. 저장된 TC evidence는 현재 주행의 PASS/FAIL이 아님을 표시한다. SYSR→SWR→allocation→TC를 추적할 수 있다.
10. **Monitoring 확장** — immutable snapshot을 소비하는 FunctionalMonitorPort 계약만 준비했다. independent expectation, mismatch와 reaction 정책은 다음 설계 대상이다. 현재 NOT AVAILABLE.
11. **Platform 확장** — simulation-time execution event 계약만 준비했다. scheduler/task release/completion/alive/watchdog/fault manager는 구현되지 않았다. 현재 16.67 ms 호출 주기는 Physics에 맞춘 Reference invocation이며 ECU 10 ms Task나 WCET가 아니다.
12. **Regression** — 전체 45/45 테스트 통과. 2,592 TS/C stateful 입력 비교 통과(허용 오차 1e-10). C/TS 실제 Rapier 주행·제동·조향·기어 인터록·pause/resume/reset 비교 통과. TypeScript check, ESLint, production build 통과. 기존 R3F/Vite 검증은 sandbox 상위 폴더 접근 제한 때문에 권한을 허용받아 실행했다. production bundle의 기존 대형 chunk 경고 및 Rapier initialization deprecation 경고는 남아 있다.
13. **다음 Phase** — C Normal Runtime 기준 READY_FOR_NEXT_PHASE. 다음 구현 대상은 simulation-time logical scheduler와 기록/관찰 계약이다. Monitoring/Watchdog/Fault/CAN/HIL 완료를 뜻하지 않는다. 실제 임베디드 타깃, 하드웨어 시간, 레지스터, WCET 또는 HIL 검증 결과로 해석하면 안 된다.

브라우저에서 MAIN→SESSION SETUP→RACE→LIVE X-RAY로 진입하고 C_WASM 실행 순번이 증가하는 것을 확인했다. REQUIREMENT TRACE는 별도 관점이며 Runtime layer가 아니다. 기존 TS 코어는 회귀 기준으로 보존했고 README 및 승인 Ground Truth 원문은 변경하지 않았다.
