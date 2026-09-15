import type Rapier from '@dimforge/rapier3d-compat'
import type { DynamicRayCastVehicleController, RigidBody, World } from '@dimforge/rapier3d-compat'
import type { VehiclePhysicsCommand, VehiclePhysicsPort } from '../../domain/vehicle/VehiclePhysicsPort.ts'
import type { VehicleState } from '../../domain/vehicle/VehicleState.ts'
import type { SurfaceInfoProvider, WorldPhysicsDefinition } from '../../domain/world/MapDefinition.ts'
import { phase2Physics as config } from './phase2Config.ts'

/** Rapier-only adapter. Commands and output state contain no engine objects. */
export class RapierVehiclePhysics implements VehiclePhysicsPort {
  private readonly world: World
  private readonly stepWorld: (delta: number) => void
  private readonly ground: RigidBody
  private readonly staticBodies: RigidBody[] = []
  private readonly chassis: RigidBody
  private readonly worldDefinition: Readonly<WorldPhysicsDefinition>
  private readonly surfaces: SurfaceInfoProvider
  private controller: DynamicRayCastVehicleController
  private disposed = false

  constructor(rapier: typeof Rapier, world: World, stepWorld: (delta: number) => void,
    worldDefinition: Readonly<WorldPhysicsDefinition>, surfaces: SurfaceInfoProvider) {
    this.world = world
    this.stepWorld = stepWorld
    this.worldDefinition = worldDefinition
    this.surfaces = surfaces
    this.ground = world.createRigidBody(rapier.RigidBodyDesc.fixed().setTranslation(
      worldDefinition.groundPosition.x, worldDefinition.groundPosition.y, worldDefinition.groundPosition.z,
    ))
    world.createCollider(rapier.ColliderDesc.cuboid(
      worldDefinition.groundHalfExtents.x, worldDefinition.groundHalfExtents.y, worldDefinition.groundHalfExtents.z,
    ).setFriction(2.2).setRestitution(0), this.ground)
    for (const item of worldDefinition.staticColliders) {
      const body = world.createRigidBody(rapier.RigidBodyDesc.fixed().setTranslation(item.position.x, item.position.y, item.position.z).setRotation(item.rotation))
      world.createCollider(rapier.ColliderDesc.cuboid(item.halfExtents.x, item.halfExtents.y, item.halfExtents.z).setFriction(item.friction).setRestitution(0), body)
      this.staticBodies.push(body)
    }
    this.chassis = world.createRigidBody(
      rapier.RigidBodyDesc.dynamic()
        .setTranslation(worldDefinition.vehicleSpawn.position.x, worldDefinition.vehicleSpawn.position.y, worldDefinition.vehicleSpawn.position.z)
        .setRotation(worldDefinition.vehicleSpawn.rotation)
        .setLinearDamping(0.12).setAngularDamping(2).setCcdEnabled(true).setCanSleep(false),
    )
    world.createCollider(rapier.ColliderDesc.cuboid(
      config.chassisHalfExtents.x, config.chassisHalfExtents.y, config.chassisHalfExtents.z,
    ).setMass(config.massKg).setFriction(0.2).setRestitution(0), this.chassis)
    // Explicit arcade stabilization: yaw is free, pitch/roll are locked. Gravity/Y translation remain real.
    this.chassis.setEnabledRotations(false, true, false, true)
    this.controller = this.createController()
  }
  private createController() {
    const controller = this.world.createVehicleController(this.chassis)
    controller.indexUpAxis = 1
    controller.setIndexForwardAxis = 2
    for (const z of [-0.91, 0.91]) {
      for (const x of [-0.93, 0.93]) {
        controller.addWheel({ x, y: -0.08, z }, { x: 0, y: -1, z: 0 }, { x: -1, y: 0, z: 0 },
          config.suspensionRestLength, config.wheelRadius)
        const i = controller.numWheels() - 1
        controller.setWheelSuspensionStiffness(i, 35)
        controller.setWheelSuspensionCompression(i, 4.4)
        controller.setWheelSuspensionRelaxation(i, 5.2)
        controller.setWheelMaxSuspensionTravel(i, 0.15)
        controller.setWheelMaxSuspensionForce(i, 4500)
        controller.setWheelFrictionSlip(i, 2.2)
        controller.setWheelSideFrictionStiffness(i, 1.4)
      }
    }
    return controller
  }
  step(command: Readonly<VehiclePhysicsCommand>, deltaSeconds: number) {
    if (this.disposed) throw new Error('Physics adapter is disposed')
    const surface = this.surfaces.getSurfaceAt(this.chassis.translation())
    for (let i = 0; i < 4; i++) {
      // Rapier axle convention drives +Z for positive force; our visual/domain forward is -Z.
      this.controller.setWheelEngineForce(i, -command.driveForce / 4)
      // Rapier brake API expects impulse, while the public command is a force (N).
      this.controller.setWheelBrake(i, command.brakeForce * deltaSeconds / 4)
      this.controller.setWheelSteering(i, i < 2 ? -command.steering : 0)
      this.controller.setWheelFrictionSlip(i, surface.friction)
      this.controller.setWheelSideFrictionStiffness(i, Math.max(0.4, surface.friction * 0.64))
    }
    this.controller.updateVehicle(deltaSeconds, undefined, undefined,
      (collider) => collider.parent()?.handle !== this.chassis.handle)
    this.stepWorld(deltaSeconds)
  }
  readState(target: VehicleState) {
    Object.assign(target.position, this.chassis.translation())
    Object.assign(target.rotation, this.chassis.rotation())
    Object.assign(target.linearVelocity, this.chassis.linvel())
    Object.assign(target.angularVelocity, this.chassis.angvel())
    target.speed = Math.hypot(target.linearVelocity.x, target.linearVelocity.y, target.linearVelocity.z)
    const q = target.rotation
    const forwardX = -2 * (q.x * q.z + q.w * q.y)
    const forwardY = 2 * (q.w * q.x - q.y * q.z)
    const forwardZ = 2 * (q.x * q.x + q.y * q.y) - 1
    target.longitudinalVelocity = target.linearVelocity.x * forwardX
      + target.linearVelocity.y * forwardY + target.linearVelocity.z * forwardZ
  }
  reset() {
    this.world.removeVehicleController(this.controller)
    this.chassis.setTranslation(this.worldDefinition.vehicleSpawn.position, true)
    this.chassis.setRotation(this.worldDefinition.vehicleSpawn.rotation, true)
    this.chassis.setLinvel({ x: 0, y: 0, z: 0 }, true)
    this.chassis.setAngvel({ x: 0, y: 0, z: 0 }, true)
    this.chassis.resetForces(true)
    this.chassis.resetTorques(true)
    this.controller = this.createController()
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.world.removeVehicleController(this.controller)
    this.world.removeRigidBody(this.chassis)
    for (const body of this.staticBodies) this.world.removeRigidBody(body)
    this.world.removeRigidBody(this.ground)
  }
}
