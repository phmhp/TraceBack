export type Gear = 'P' | 'R' | 'N' | 'D'

/** Serializable driver intent. Values contain no DOM, React, Three or Rapier objects. */
export interface DriverInputState {
  accelerator: number
  acceleratorValidity: 'VALID' | 'INVALID'
  brake: number
  steering: number
  gearRequest: Gear
  gearRequestValidity: 'VALID' | 'INVALID'
}

/** Shape reserved for future recording boundaries; Phase 3 does not record instances. */
export interface TimedDriverInputState extends DriverInputState {
  time: number
}

export interface DriverInputWriter {
  setAccelerator(value: number): void
  setBrake(value: number): void
  setSteering(value: number): void
  setGearRequest(gear: Gear): void
  resetMotion(): void
  reset(): void
}

export type DriverInputReader = () => Readonly<DriverInputState>

export const INITIAL_GEAR_REQUEST: Gear = 'D'

export function createNeutralDriverInput(): DriverInputState {
  return { accelerator: 0, acceleratorValidity: 'VALID', brake: 0, steering: 0, gearRequest: INITIAL_GEAR_REQUEST, gearRequestValidity: 'VALID' }
}
