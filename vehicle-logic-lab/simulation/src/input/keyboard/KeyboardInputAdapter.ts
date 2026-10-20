import type { DriverInputWriter } from '../../domain/driver/DriverInputTypes.ts'
import { isEditableTarget, KeyboardMapping } from './KeyboardMapping.ts'
import type { KeyboardMappedState } from './KeyboardMapping.ts'

interface KeyboardTarget {
  addEventListener(type: string, listener: EventListener): void
  removeEventListener(type: string, listener: EventListener): void
}

export interface SimulationInputLifecycle {
  acceptsDrivingInput(): boolean
  togglePause(): void
  pause(): void
}

/** Browser device adapter. It writes DriverInput only and never imports physics or graphics. */
export function bindKeyboardInput(
  target: KeyboardTarget,
  driverInput: DriverInputWriter,
  lifecycle: SimulationInputLifecycle,
) {
  const mapping = new KeyboardMapping()
  const mapped: KeyboardMappedState = { accelerator: 0, brake: 0, steering: 0 }
  const publish = () => {
    mapping.read(mapped)
    driverInput.setAccelerator(mapped.accelerator)
    driverInput.setBrake(mapped.brake)
    driverInput.setSteering(mapped.steering)
  }
  const clear = () => { mapping.reset(); driverInput.resetMotion() }

  const keydown: EventListener = (event) => {
    const key = event as KeyboardEvent
    if (isEditableTarget(key.target)) return
    if (key.code === 'Escape') {
      key.preventDefault()
      if (!key.repeat) { clear(); lifecycle.togglePause() }
      return
    }
    const gear = ({ Digit1: 'P', Digit2: 'R', Digit3: 'N', Digit4: 'D' } as const)[key.code as 'Digit1']
    if (gear) {
      key.preventDefault()
      if (!key.repeat && lifecycle.acceptsDrivingInput()) driverInput.setGearRequest(gear)
      return
    }
    if (key.repeat) return
    if (!mapping.keyDown(key.code)) return
    key.preventDefault()
    if (!lifecycle.acceptsDrivingInput()) { clear(); return }
    publish()
  }

  const keyup: EventListener = (event) => {
    const key = event as KeyboardEvent
    if (!mapping.keyUp(key.code)) return
    key.preventDefault()
    publish()
  }

  const blur: EventListener = () => { clear(); lifecycle.pause() }
  target.addEventListener('keydown', keydown)
  target.addEventListener('keyup', keyup)
  target.addEventListener('blur', blur)

  return {
    clear,
    dispose: () => {
      clear()
      target.removeEventListener('keydown', keydown)
      target.removeEventListener('keyup', keyup)
      target.removeEventListener('blur', blur)
    },
  }
}
