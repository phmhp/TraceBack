# TRACKBACK Phase 3 구현 보고서

## 구현 결과

Keyboard와 Physics 사이에 독립적인 DriverInput Layer를 추가했습니다. Phase 2의 Rapier 차량,
고정 시간 물리, HUD, Pause, 카메라 보간 및 화면 Flow는 유지됩니다.

```text
Keyboard
→ KeyboardInputAdapter
→ DriverInputRuntime
→ SimpleVehicleControlAdapter (TEMPORARY)
→ VehiclePhysicsCommand
→ RapierVehiclePhysics
→ Rapier
```

Gear는 `D` 고정입니다. 숫자 키 및 Gear Shift UI/Logic은 구현하지 않았습니다.

## 1. 생성/수정 파일

### 생성

- `src/domain/driver/DriverInputTypes.ts` — Gear, DriverInputState, writer/reader 계약
- `src/runtime/driver/DriverInputRuntime.ts` — mutable DriverInput 저장소
- `src/input/keyboard/KeyboardMapping.ts` — DOM 없는 순수 키 상태 변환
- `src/input/keyboard/KeyboardInputAdapter.ts` — 브라우저 이벤트 Adapter
- `src/runtime/control/SimpleVehicleControlAdapter.ts` — 임시 DriverInput → Physics Command 변환
- `tests/driver-input.test.mjs` — DriverInput/키 매핑/Adapter/Command/HUD sampling Test
- `docs/PHASE_3_REPORT.md`

### 수정

- `src/runtime/SimulationRuntime.ts` — DriverInputRuntime 주입/샘플링, 10Hz HUD 발행
- `src/domain/vehicle/VehicleState.ts` — DriverInput 중복 필드 제거
- `src/app/GameApplication.tsx` — Keyboard Adapter와 DriverInputRuntime 조립
- `src/ui/components/RaceHUD.tsx` — Runtime의 Gear 표시
- `tests/clock-runtime.test.mjs`
- `tests/vehicle-physics.test.mjs`
- `tests/r3f-integration.test.mjs`
- `eslint.config.js` — Input↔Physics import 경계 검사
- `README.md`, `src/domain/README.md`, `src/runtime/README.md`, `src/ui/README.md`

### 제거

- `src/ui/input/KeyboardDriverInput.ts` — UI 위치에 있던 Phase 2 입력 결합 코드
- `src/runtime/SimpleVehicleControl.ts` — 새 임시 Adapter로 대체
- `tests/keyboard-input.test.mjs` — 더 구체적인 DriverInput Test로 대체

## 2. Keyboard Input Flow

`KeyboardMapping`은 pressed key set만 관리하는 Pure TypeScript Class입니다.

- ArrowUp down/up → accelerator 1/0
- ArrowDown down/up → brake 1/0
- ArrowLeft → steering -1
- ArrowRight → steering +1
- Left + Right → steering 0
- Up + Down → accelerator 1과 brake 1을 각각 유지
- Digit1/2/3/4 및 기타 키 → 무시

`KeyboardInputAdapter`만 DOM Event를 압니다. 매핑 결과를 DriverInputWriter에 쓰며 Rapier,
VehiclePhysics, speed, mesh transform을 import하거나 수정하지 않습니다.

INPUT/TEXTAREA/SELECT/contentEditable target의 keydown은 무시합니다. Arrow keyup은 항상 처리해
편집 UI로 Focus가 이동하는 과정에서도 기존 pressed key가 남지 않게 합니다.

## 3. DriverInput State

```ts
interface DriverInputState {
  accelerator: number // 0..1
  brake: number       // 0..1
  steering: number    // -1..1
  gear: 'P' | 'R' | 'N' | 'D'
}
```

현재 Runtime은 Gear를 D로 강제합니다. 숫자 키가 Gear에 영향을 주지 않습니다.
모든 필드는 primitive이므로 JSON serialization이 가능하며 엔진/DOM 객체를 포함하지 않습니다.
향후 기록 경계를 표현할 `TimedDriverInputState` 타입은 `{ time, accelerator, brake, steering, gear }`
형태만 정의했습니다. 실제 Record, Black Box, Snapshot, Replay는 구현하지 않았습니다.

## 4. DriverInput 저장 위치

`runtime/driver/DriverInputRuntime`의 mutable object 한 곳이 최신 DriverInput을 소유합니다.
setter에서 accelerator/brake는 0..1, steering은 -1..1로 clamp하며 NaN은 neutral로 처리합니다.

`getState()`는 다음 변경까지 유효한 읽기 전용 live view를 반환합니다. Physics Tick마다 객체를
생성하지 않고 React state/Zustand를 거치지 않습니다. `GameApplication`은 이 Runtime을
`SimulationRuntime`과 Keyboard Adapter 사이에 조립합니다.

## 5. VehiclePhysics까지 전달

1. Keyboard Adapter가 DriverInputRuntime setter 호출
2. SimulationRuntime이 fixed Physics Tick 직전에 `getState()` 호출
3. SimpleVehicleControlAdapter가 현재 speed와 DriverInput으로 기존 VehiclePhysicsCommand 작성
4. SimulationRuntime이 VehiclePhysicsPort.step(command, 1/60) 호출
5. RapierVehiclePhysics가 Raycast wheel/차체에 최종 force, brake impulse, steering 적용

VehiclePhysicsPort와 RapierVehiclePhysics는 DriverInput/Keyboard 의미를 해석하지 않으며
`driveForce`, `brakeForce`, `steering`만 받습니다.

## 6. Temporary SimpleVehicleControlAdapter

위치: `src/runtime/control/SimpleVehicleControlAdapter.ts`

기존 Phase 2 Arcade mapping을 그대로 이전했습니다. 실제 VMC/eDrive/Brake/EPS Logic 또는
Calibration Ground Truth가 아닙니다. Up+Down 입력의 두 상태는 보존되며, 이 임시 Adapter에서만
brake를 우선해 driveForce를 0으로 만듭니다.

## 7. React/Zustand 분리

Keyboard → Zustand → Physics 경로는 없습니다. DriverInputRuntime은 React/DOM/Zustand에
의존하지 않으며 Physics가 60Hz로 직접 읽습니다.

Zustand `raceHud`에는 6 Physics Tick마다 약 10Hz로 accelerator/brake/steering/gear와 speed/time을
발행합니다. Start/Pause/Resume/Reset/Error lifecycle은 즉시 발행합니다. Transform/velocity/wheel
state는 Zustand에 저장하지 않습니다. R3F Test에서 240 Physics Tick 동안 React commit이
추가되지 않음을 계속 확인합니다.

## 8. Pause Input Reset

Pause, Resume, Start, Reset 모두 DriverInputRuntime.reset()을 호출합니다. Neutral policy는
accelerator=0, brake=0, steering=0, gear=D입니다. Escape, Pause 버튼, X-RAY 진입,
visibilitychange, window blur와 listener dispose에서도 Keyboard pressed set을 지웁니다.

재개 직후 사용자는 방향키를 다시 눌러야 하므로 멈추기 전 입력이 차량을 다시 움직이지 않습니다.

## 9. Test

총 15개 Test가 통과합니다.

- DriverInput clamp/NaN/Reset/D 고정/JSON serialization
- Up press/release, Down, Left, Right, Left+Right neutral, Up+Down 독립 유지
- 지원하지 않는 Digit1 무시
- Pause/blur neutral reset 및 repeat key의 stale input 방지
- 편집 가능한 target 판별
- Temporary Adapter의 brake 우선과 원본 DriverInput 보존
- 10Hz HUD sampling 및 fixed tick에서 DriverInput 반영
- 실제 Rapier 가속/제동/좌우 조향/Pause/Reset
- 30/60/144fps fixed-step 일관성
- 실제 R3F 연결/StrictMode cleanup/React re-render 방지/카메라 보간

ESLint는 `src/input`에서 physics/graphics/Three/Rapier import를 금지하고,
`src/physics`에서 input import를 금지합니다.

## 10. 다음 Phase VMC 삽입 위치

현재:

```text
DriverInputRuntime
→ SimpleVehicleControlAdapter
→ VehiclePhysicsCommand
```

다음 Phase:

```text
DriverInputRuntime
→ VMC
→ eDrive / Brake / EPS Controller
→ VehiclePhysicsCommand
```

`SimulationRuntime.advance()` 안의 `writeSimpleVehiclePhysicsCommand(...)` 호출을 새로운 Coordinator에
위임하는 지점이 삽입 경계입니다. Keyboard Adapter, DriverInputRuntime, VehiclePhysicsPort와
RapierVehiclePhysics는 바꿀 필요가 없습니다.

## 구현하지 않은 것

VMC, eDrive/Brake/EPS Controller, CAN-FD, Fault, Software Defect, Requirement, Oracle,
Black Box, Replay, AEB/ACC/LKA, Gear Shift, EPB, Gamepad, AI Driver는 구현하지 않았습니다.

참고 요청의 `docs/00_TRACKBACK_MASTER.md`는 현재 프로젝트에 없으며, 루트의
`00_TRACKBACK_MASTER.md`와 기존 Phase 2 구조를 참고했습니다. 참고 문서는 수정하지 않았습니다.
