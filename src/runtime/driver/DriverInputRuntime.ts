import { createNeutralDriverInput, INITIAL_GEAR_REQUEST } from '../../domain/driver/DriverInputTypes.ts'
import type { DriverInputReader, DriverInputState, DriverInputWriter, Gear } from '../../domain/driver/DriverInputTypes.ts'

const clamp = (value: number, minimum: number, maximum: number) =>
  Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : minimum

/** Mutable simulation input boundary. It is read every physics tick without React renders. */
export class DriverInputRuntime implements DriverInputWriter {
  private readonly state: DriverInputState = createNeutralDriverInput()
  private acceleratorTarget = 0
  private brakeTarget = 0
  private steeringTarget = 0

  readonly getState: DriverInputReader = () => this.state

  setAccelerator(value: number) { this.acceleratorTarget = clamp(value, 0, 1) }
  setBrake(value: number) { this.brakeTarget = clamp(value, 0, 1) }
  setSteering(value: number) { this.steeringTarget = clamp(value, -1, 1) }

  advance(deltaSeconds: number, response: {
    acceleratorRisePerSecond: number
    acceleratorFallPerSecond: number
    brakeRisePerSecond: number
    brakeFallPerSecond: number
    steeringRisePerSecond: number
    steeringReturnPerSecond: number
  }) {
    const moveTowards = (current: number, target: number, maximumDelta: number) =>
      Math.abs(target - current) <= maximumDelta ? target : current + Math.sign(target - current) * maximumDelta
    const acceleratorRate = this.acceleratorTarget > this.state.accelerator
      ? response.acceleratorRisePerSecond : response.acceleratorFallPerSecond
    const brakeRate = this.brakeTarget > this.state.brake
      ? response.brakeRisePerSecond : response.brakeFallPerSecond
    const steeringRate = Math.abs(this.steeringTarget) > Math.abs(this.state.steering)
      ? response.steeringRisePerSecond : response.steeringReturnPerSecond
    this.state.accelerator = moveTowards(this.state.accelerator, this.acceleratorTarget, acceleratorRate * deltaSeconds)
    this.state.brake = moveTowards(this.state.brake, this.brakeTarget, brakeRate * deltaSeconds)
    this.state.steering = moveTowards(this.state.steering, this.steeringTarget, steeringRate * deltaSeconds)
  }

  setGearRequest(gear: Gear) { this.state.gearRequest = gear; this.state.gearRequestValidity = 'VALID' }

  resetMotion() {
    this.acceleratorTarget = 0
    this.brakeTarget = 0
    this.steeringTarget = 0
    this.state.accelerator = 0
    this.state.brake = 0
    this.state.steering = 0
  }

  reset() {
    this.resetMotion()
    this.state.acceleratorValidity = 'VALID'
    this.state.gearRequest = INITIAL_GEAR_REQUEST
    this.state.gearRequestValidity = 'VALID'
  }
}
