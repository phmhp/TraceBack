# Codex / Antigravity에 전달할 소스코드 대조 감사 요청 (한글)

## 목적

TRACKBACK의 `PHASE03_DESIGN_AUDIT_KO.md`와 `04_SIGNAL_INTERFACE_ARCHITECTURE_KO.md`는 **문서 기반 초안**이다. 다음 단계에서는 현재 로컬 코드베이스를 직접 읽어, 설계가 실제 계산·관측·코드 타입과 맞는지 확인한다. 새로운 기능 개발은 하지 않는다.

## 감사 수행 지시

1. 전체 소스 중 `Architecture.ts`, `Trace.ts`, `PropulsionGroundTruth.ts`, `CaseDefinition.ts`, C/WASM VMC/eDrive 모든 소스/헤더/binding, `SimulationRuntime`, DriverInput, `VehicleSwPort`, adapter, RapierVehiclePhysics, scenario runner, evidence, Page 2 Function/Signal/Interface, Page 3 verifier, scheduler/clock을 실제 경로를 찾아 감사.
2. 출력마다 **소스 파일 및 줄 번호**를 붙이고, 실제 함수/타입/단위/값 범위/변환/시점/생산자/소비자를 증명. 정확한 근거가 없으면 `NOT_FOUND`, `UNVERIFIED`, `OPEN`.
3. 74 LF마다 실제 구현 함수 배치 여부와 관찰 가능성을 판정: `CODE_VERIFIED`, `PARTIALLY_MAPPED`, `REFERENCE_ONLY`, `MISSING_SOURCE`. **논리 LF=실제 Runnable**이라고 주장하지 말 것.
4. 기존 Signal/Port/Config와 `04_SIGNAL_CANDIDATE_CATALOG.csv` 항목을 비교: `EXACT_MATCH`, `CONCEPTUAL_MATCH`, `NAME_COLLISION_DIFFERENT_SEMANTICS`, `DRAFT_ONLY`, `UNRESOLVED` 구분. 비슷한 이름으로 alias 자동 승인 금지.
5. Source/Destination 실제 다른 observation hook 여부. Same object reuse / immutable clone / capture phase / tick alignment 확인.
6. `DriveTorqueRequest`와 `EDriveCommand`의 C/WASM 출력, adapter의 `DriveForce` 단위와 실제 변환식, saturation/clamping, magnitude/sign 처리를 실행 소스에서 확인.
7. `DriverInputRuntime.accelerator/brake/steering` 범위와 gear D 사전조건, invalid/gear mapping, neutral behavior 확인. Validation은 clamp와 다른지 구분.
8. Physics `1/60s`, SW 호출 시점/주기, publish observation timing, original incident replay vs scenario regenerated trace 구분. 10/20ms Task가 실제 구현됐는지 증빙.
9. 모든 Missing/unknown은 UI에서 실행 가능한 옵션으로 표시되지 않게 capability path를 확인. 참조 CAN-FD, ABS/ESC/ADAS, EPS/Brake Controller, BMS, Watchdog/Occupant 구현 주장을 금지.
10. 실제 코드와 출처 기반으로 P0/A01~A28 지적에 대해 `SUPPORTED`, `CONTRADICTED`, `STILL_OPEN`, `NOT_APPLICABLE` 및 구체적인 결정 권고를 기록.
11. **전 기능 설계 파일을 코드로 자동 변환하거나 새 Signal/Req/TC/Case를 만들지 않는다.** 원래 코드 수정 금지.
12. 테스트는 현재 실행 가능한 테스트만 수행하고 실행 명령/결과와 기초 sample 출력값을 보고. `npm test` 성공이 문서/물리 의미 검증 완료를 의미하지 않음.

## 결과 파일 3개

- `docs/audit/PHASE03_CODE_CONTRACT_AUDIT.md`: P0~P2 발견, source path + line + 현물 근거.
- `docs/audit/PHASE04_SIGNAL_SOURCE_MAPPING.csv`: 111개 후보/기존 항목과 코드 매핑, 타입·units, source/dest event, supported vs planned.
- `docs/audit/DECISION_GATE.md`: **승인할 수 있는 항목 / 승인 불가 / 사람 결정 필요**. 각 item마다 승인 전제 테스트와 제안 수정 1개 이상.

오류를 스스로 추측해 메우지 않고, 사용자가 모르는 상태에서도 **문서 근거와 반례로 차이를 검토할 수 있게** 작성한다. 완성 후 요약과 산출물을 공유하되, 이 작업에서 코드 수정은 하지 않는다.
