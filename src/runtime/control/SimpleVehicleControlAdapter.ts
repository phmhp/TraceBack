import type { DriverInputState } from '../../domain/driver/DriverInputTypes.ts'
import type { VehiclePhysicsCommand } from '../../domain/vehicle/VehiclePhysicsPort.ts'

/** @deprecated Propulsion moved to PropulsionFunction/VMC/eDrive. Retained only as a migration guard. */
export function writeSimpleVehiclePhysicsCommand(
  input: Readonly<DriverInputState>, speed: number, command: VehiclePhysicsCommand,
) {
  // Driver intent stays intact when both pedals are pressed; this temporary adapter gives brake priority.
  command.driveForce = 0
  command.brakeForce = input.brake * 6500
  command.steering = input.steering * (0.42 / (1 + speed * 0.07))
}
