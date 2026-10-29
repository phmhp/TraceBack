import type { VehicleState } from './VehicleState.ts'

/** Total wheel drive/brake forces in newtons, front wheel steering in radians (+right). */
export interface VehiclePhysicsCommand {
  driveForce: number
  brakeForce: number
  steering: number
}
export interface WheelDynamicsObservation {
  index:number
  inContact:boolean
  rotationRad:number
  angularVelocityRadPerSecond:number
  wheelLinearSpeedMps:number
  forwardImpulseNs:number
  sideImpulseNs:number
  suspensionForceN:number
}
export interface CollisionObservation {
  active:boolean
  contactPairCount:number
  contactPointCount:number
  maximumNormalImpulseNs:number
}
export interface LeadVehicleObservation {
  available:boolean
  relativeLongitudinalDistanceM:number
  relativeLateralDistanceM:number
  leadSpeedMps:number
  closingSpeedMps:number
  collisionActive:boolean
}
export interface ScenarioActorPose {
  available:boolean
  position:{x:number;y:number;z:number}
  rotation:{x:number;y:number;z:number;w:number}
}
export interface VehiclePhysicsPort {
  step(command: Readonly<VehiclePhysicsCommand>, deltaSeconds: number): void
  readState(target: VehicleState): void
  /** Current physical surface under the vehicle. Optional for non-world test doubles. */
  readEnvironmentState?(): Readonly<{ surfaceType:string; friction:number; rollingResistance:number }>
  /** Rapier wheel telemetry from the actual ray-cast controller. */
  readWheelDynamicsState?(): readonly Readonly<WheelDynamicsObservation>[]
  /** Chassis contacts with non-ground world colliders after the latest physics step. */
  readCollisionState?(): Readonly<CollisionObservation>
  /** Deterministic physical obstacle used only by an explicit vehicle scenario. */
  setScenarioObstacle?(definition:Readonly<{distanceAheadM:number;halfWidthM:number}>|null):void
  setScenarioLeadVehicle?(definition:Readonly<{distanceAheadM:number;lateralOffsetM?:number;speedMps:number;brakeAtSeconds?:number}>|null):void
  readLeadVehicleState?():Readonly<LeadVehicleObservation>
  readScenarioLeadVehiclePose?():Readonly<ScenarioActorPose>
  reset(): void
}
