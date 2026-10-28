import type { DriverInputState } from '../../domain/driver/DriverInputTypes.ts'
import type { VehiclePhysicsCommand } from '../../domain/vehicle/VehiclePhysicsPort.ts'
import { BrakeExecutionModel } from './BrakeExecutionModel.ts'
import { SteeringExecutionModel } from './SteeringExecutionModel.ts'

/** @deprecated Use BrakeExecutionModel. Retained as a compatibility seam. */
export function writeTemporaryBrakeCommand(input: Readonly<DriverInputState>, command: VehiclePhysicsCommand) {
  command.brakeForce = new BrakeExecutionModel().step({driverBrakeRequest:input.brake,validity:'VALID'}).brakeForceN
}
/** @deprecated Use SteeringExecutionModel. Retained as a compatibility seam. */
export function writeTemporarySteeringCommand(input: Readonly<DriverInputState>, vehicleSpeed: number, command: VehiclePhysicsCommand) {
  command.steering = new SteeringExecutionModel().step({driverSteeringRequest:input.steering,vehicleSpeedMps:vehicleSpeed,validity:'VALID'}).frontWheelAngleRad
}
