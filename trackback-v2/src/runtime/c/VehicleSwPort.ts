import type { Gear } from '../../domain/driver/DriverInputTypes.ts'
import type { Validity, PropulsionState, PropulsionRequest, DriveTorqueRequest, EDriveCommand } from '../../domain/propulsion/PropulsionTypes.ts'
import type { SimulationPropulsionCalibration } from '../SimulationRuntime.ts'

export interface VehicleSwInput {
  acceleratorPedalPosition: number
  acceleratorPedalValidity: Validity
  gearRequest: Gear
  gearRequestValidity: Validity
  vehicleReady: boolean
  propulsionEnable: boolean
  longitudinalVelocity: number
  vehicleSpeed: number
}
export interface VehicleSwOutput {
  gearState: Gear
  gearStateValidity: Validity
  transitionAccepted: boolean
  propulsionState: PropulsionState
  propulsionRequest: PropulsionRequest
  driveTorqueRequest: DriveTorqueRequest
  eDriveCommand: EDriveCommand
}
export interface VehicleSwPort {
  readonly source: 'C_WASM' | 'TS_LEGACY_REFERENCE'
  reset(): void
  setCaseVariant?(variant: 0 | 1 | 2 | 3): void
  step(input: VehicleSwInput): VehicleSwOutput
}
export interface VehicleSwSnapshot {
  source: VehicleSwPort['source']
  step: number
  executionTime: number
  periodSeconds: number
  input: VehicleSwInput
  output: VehicleSwOutput
  calibrationReference: string
  calibration: readonly number[]
}
// Future consumers are intentionally interfaces only, not simulated ECU observations.
export interface FunctionalMonitorPort {
  observe(snapshot: Readonly<VehicleSwSnapshot>): { verdict: 'CONSISTENT' | 'MISMATCH'; requirementId: string; reason: string }
}
export interface PlatformExecutionEvent {
  taskId: string; scheduledTime: number; actualTime: number; period: number; executionCount: number; completed: boolean
}
export interface PlatformSupervisionPort { observe(event: Readonly<PlatformExecutionEvent>): void }
export const RUNTIME_LAYERS = { FUNCTION: 'AVAILABLE', MONITORING: 'NOT AVAILABLE', PLATFORM: 'NOT AVAILABLE' } as const
export const calibrationSlots = (c: Readonly<SimulationPropulsionCalibration>) => [
  c.gearDirectionChangeMaxSpeedMps.value, c.vmcForwardTorqueMap.maximumTorqueNm, c.vmcForwardTorqueMap.zeroTorqueSpeedMps,
  c.vmcReverseTorqueMap.maximumTorqueNm, c.vmcReverseTorqueMap.zeroTorqueSpeedMps, c.maxForwardTorqueNm.value, c.maxReverseTorqueNm.value,
]
export function validateInput(input: VehicleSwInput) {
  if (!['P','R','N','D'].includes(input.gearRequest) || !['VALID','INVALID'].includes(input.gearRequestValidity) ||
    !['VALID','INVALID'].includes(input.acceleratorPedalValidity) || typeof input.acceleratorPedalPosition !== 'number' ||
    typeof input.vehicleReady !== 'boolean' || typeof input.propulsionEnable !== 'boolean' ||
    !Number.isFinite(input.longitudinalVelocity) || !Number.isFinite(input.vehicleSpeed) || input.vehicleSpeed < 0)
    throw new Error('Vehicle SW input contract violated')
}
