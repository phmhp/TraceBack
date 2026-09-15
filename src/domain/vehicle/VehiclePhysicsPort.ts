import type { VehicleState } from './VehicleState.ts'

/** Total wheel drive/brake forces in newtons, front wheel steering in radians (+right). */
export interface VehiclePhysicsCommand {
  driveForce: number
  brakeForce: number
  steering: number
}
export interface VehiclePhysicsPort {
  step(command: Readonly<VehiclePhysicsCommand>, deltaSeconds: number): void
  readState(target: VehicleState): void
  reset(): void
}
