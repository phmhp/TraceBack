import type { DriverInputState } from '../../domain/driver/DriverInputTypes.ts'
import type { VehiclePhysicsCommand } from '../../domain/vehicle/VehiclePhysicsPort.ts'

/** Temporary paths outside the approved Propulsion slice. */
export function writeTemporaryBrakeCommand(input: Readonly<DriverInputState>, command: VehiclePhysicsCommand) {
  command.brakeForce = input.brake * 6500
}
export function writeTemporarySteeringCommand(input: Readonly<DriverInputState>, vehicleSpeed: number, command: VehiclePhysicsCommand) {
  command.steering = input.steering * (0.42 / (1 + vehicleSpeed * 0.07))
}
