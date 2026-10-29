import type { EDriveCommand } from '../../domain/propulsion/PropulsionTypes.ts'
import type { VehiclePhysicsCommand } from '../../domain/vehicle/VehiclePhysicsPort.ts'

/** The only logical direction to signed physical actuation boundary. */
export function writeEDrivePhysicsCommand(edrive: Readonly<EDriveCommand>, torqueToForce: number,
  brakeActive: boolean, command: VehiclePhysicsCommand) {
  const sign = edrive.direction === 'FORWARD' ? 1 : edrive.direction === 'REVERSE' ? -1 : 0
  command.driveForce = brakeActive || edrive.validity === 'INVALID' ? 0 : edrive.magnitudeNm * torqueToForce * sign
}
