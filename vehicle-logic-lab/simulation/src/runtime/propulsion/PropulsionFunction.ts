import type { Gear } from '../../domain/driver/DriverInputTypes.ts'
import type { PropulsionRequest, PropulsionState, Validity } from '../../domain/propulsion/PropulsionTypes.ts'

export interface PropulsionInputs {
  acceleratorPedalPosition: number
  acceleratorPedalValidity: Validity
  gearState: Gear
  gearStateValidity: Validity
  vehicleReady: boolean
  propulsionEnable: boolean
}

export interface PropulsionOutput { state: PropulsionState; request: PropulsionRequest }

export function evaluatePropulsion(input: Readonly<PropulsionInputs>): PropulsionOutput {
  const state: PropulsionState = input.vehicleReady && input.propulsionEnable ? 'PROP_ENABLED' : 'PROP_DISABLED'
  if (input.acceleratorPedalValidity === 'INVALID' || input.gearStateValidity === 'INVALID')
    return { state, request: { magnitude: 0, direction: 'NONE', validity: 'INVALID' } }
  if (state === 'PROP_DISABLED' || input.gearState === 'P' || input.gearState === 'N')
    return { state, request: { magnitude: 0, direction: 'NONE', validity: 'VALID' } }
  const magnitude = Number.isFinite(input.acceleratorPedalPosition) ? Math.max(0, Math.min(1, input.acceleratorPedalPosition)) : 0
  if (magnitude === 0) return { state, request: { magnitude: 0, direction: 'NONE', validity: 'VALID' } }
  return { state, request: { magnitude, direction: input.gearState === 'D' ? 'FORWARD' : 'REVERSE', validity: 'VALID' } }
}
