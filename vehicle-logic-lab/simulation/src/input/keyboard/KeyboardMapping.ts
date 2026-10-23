export type DrivingKey = 'ArrowUp' | 'ArrowDown' | 'ArrowLeft' | 'ArrowRight'

export interface KeyboardMappedState {
  accelerator: number
  brake: number
  steering: number
}

const drivingKeys = new Set<string>(['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'])

/** Pure key-state reducer. Left+Right => neutral; accelerator+brake remain independently active. */
export class KeyboardMapping {
  private readonly pressed = new Set<DrivingKey>()

  keyDown(code: string): boolean {
    if (!drivingKeys.has(code)) return false
    this.pressed.add(code as DrivingKey)
    return true
  }

  keyUp(code: string): boolean {
    if (!drivingKeys.has(code)) return false
    this.pressed.delete(code as DrivingKey)
    return true
  }

  reset() { this.pressed.clear() }

  read(target: KeyboardMappedState): KeyboardMappedState {
    target.accelerator = Number(this.pressed.has('ArrowUp'))
    target.brake = Number(this.pressed.has('ArrowDown'))
    target.steering = Number(this.pressed.has('ArrowRight')) - Number(this.pressed.has('ArrowLeft'))
    return target
  }
}

export function isEditableTarget(target: EventTarget | null): boolean {
  if (!target || typeof target !== 'object') return false
  const element = target as { tagName?: string; isContentEditable?: boolean }
  return Boolean(element.isContentEditable || (element.tagName && ['INPUT', 'TEXTAREA', 'SELECT'].includes(element.tagName)))
}
