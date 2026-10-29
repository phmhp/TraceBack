import type { Gear } from '../../domain/driver/DriverInputTypes.ts'
import type { Validity } from '../../domain/propulsion/PropulsionTypes.ts'

export interface GearLogicResult {
  requestedGear: Gear
  gearState: Gear
  gearStateValidity: Validity
  transitionAccepted: boolean
}

export class GearLogic {
  private state: Gear = 'D'
  private result: GearLogicResult = { requestedGear: 'D', gearState: 'D', gearStateValidity: 'VALID', transitionAccepted: true }

  reset() { this.state = 'D'; this.result = { requestedGear: 'D', gearState: 'D', gearStateValidity: 'VALID', transitionAccepted: true } }

  update(request: Gear, requestValidity: Validity, longitudinalVelocity: number, maximumDirectionChangeSpeed: number): Readonly<GearLogicResult> {
    if (requestValidity === 'INVALID') {
      this.result = { requestedGear: request, gearState: this.state, gearStateValidity: 'INVALID', transitionAccepted: false }
      return this.result
    }
    const oppositeDirection = (this.state === 'D' && request === 'R') || (this.state === 'R' && request === 'D')
    const accepted = !oppositeDirection || Math.abs(longitudinalVelocity) <= maximumDirectionChangeSpeed
    if (accepted) this.state = request
    this.result = { requestedGear: request, gearState: this.state, gearStateValidity: 'VALID', transitionAccepted: accepted }
    return this.result
  }

  readState() { return this.result }
}
