export type ChassisSignalValidity = 'VALID' | 'INVALID'

/**
 * TRACKBACK execution-model input. This is not an OEM ECU or CAN contract.
 * The current game exposes one normalized service-brake request.
 */
export interface BrakeExecutionInput {
  driverBrakeRequest: number
  validity: ChassisSignalValidity
}

export type BrakeExecutionState = 'AVAILABLE' | 'SUPPRESSED_INVALID'

/** Command boundary consumed by the existing vehicle-physics port. */
export interface BrakeExecutionOutput {
  selectedBrakingRequest: number
  brakeForceN: number
  state: BrakeExecutionState
}

/**
 * TRACKBACK execution-model input. It represents the game's normalized driver
 * request and observed speed, not a production steering ECU interface.
 */
export interface SteeringExecutionInput {
  driverSteeringRequest: number
  vehicleSpeedMps: number
  validity: ChassisSignalValidity
}

export type SteeringExecutionState = 'AVAILABLE' | 'SUPPRESSED_INVALID'

/** Front-wheel command boundary consumed by the existing physics port. */
export interface SteeringExecutionOutput {
  selectedSteeringRequest: number
  frontWheelAngleRad: number
  state: SteeringExecutionState
}

