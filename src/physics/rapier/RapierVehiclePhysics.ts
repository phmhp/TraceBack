import type Rapier from '@dimforge/rapier3d-compat'
import type { Collider, DynamicRayCastVehicleController, RigidBody, World } from '@dimforge/rapier3d-compat'
import type { VehiclePhysicsCommand, VehiclePhysicsPort } from '../../domain/vehicle/VehiclePhysicsPort.ts'
import type { VehicleState } from '../../domain/vehicle/VehicleState.ts'
import type { SurfaceInfoProvider, WorldPhysicsDefinition } from '../../domain/world/MapDefinition.ts'
import { phase2Physics as config } from './phase2Config.ts'

/** Rapier-only adapter. Commands and output state contain no engine objects. */
export class RapierVehiclePhysics implements VehiclePhysicsPort {
  private readonly rapier:typeof Rapier
  private readonly world: World
  private readonly stepWorld: (delta: number) => void
  private readonly ground: RigidBody
  private readonly groundCollider:Collider
  private readonly staticBodies: RigidBody[] = []
  private readonly chassis: RigidBody
  private scenarioObstacle:RigidBody|null=null
  private scenarioLeadVehicle:RigidBody|null=null
  private scenarioLeadState:{timeSeconds:number;speedMps:number;brakeAtSeconds?:number;forwardX:number;forwardZ:number}|null=null
  private readonly worldDefinition: Readonly<WorldPhysicsDefinition>
  private readonly surfaces: SurfaceInfoProvider
  private controller: DynamicRayCastVehicleController
  private previousWheelRotations=[0,0,0,0]
  private wheelDynamics=Array.from({length:4},(_,index)=>({index,inContact:false,rotationRad:0,angularVelocityRadPerSecond:0,wheelLinearSpeedMps:0,forwardImpulseNs:0,sideImpulseNs:0,suspensionForceN:0}))
  private disposed = false

  constructor(rapier: typeof Rapier, world: World, stepWorld: (delta: number) => void,
    worldDefinition: Readonly<WorldPhysicsDefinition>, surfaces: SurfaceInfoProvider) {
    this.rapier=rapier
    this.world = world
    this.stepWorld = stepWorld
    this.worldDefinition = worldDefinition
    this.surfaces = surfaces
    this.ground = world.createRigidBody(rapier.RigidBodyDesc.fixed().setTranslation(
      worldDefinition.groundPosition.x, worldDefinition.groundPosition.y, worldDefinition.groundPosition.z,
    ))
    this.groundCollider=world.createCollider(rapier.ColliderDesc.cuboid(
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
    if(this.scenarioLeadVehicle&&this.scenarioLeadState){
      this.scenarioLeadState.timeSeconds+=deltaSeconds
      const speed=this.scenarioLeadState.brakeAtSeconds!==undefined&&this.scenarioLeadState.timeSeconds>=this.scenarioLeadState.brakeAtSeconds?0:this.scenarioLeadState.speedMps
      const position=this.scenarioLeadVehicle.translation()
      this.scenarioLeadVehicle.setNextKinematicTranslation({x:position.x+this.scenarioLeadState.forwardX*speed*deltaSeconds,y:position.y,z:position.z+this.scenarioLeadState.forwardZ*speed*deltaSeconds})
    }
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
    this.wheelDynamics=Array.from({length:this.controller.numWheels()},(_,index)=>{
      const rotationRad=this.controller.wheelRotation(index)??this.previousWheelRotations[index]??0
      const previous=this.previousWheelRotations[index]??rotationRad
      this.previousWheelRotations[index]=rotationRad
      const angularVelocityRadPerSecond=(rotationRad-previous)/deltaSeconds
      return {index,inContact:this.controller.wheelIsInContact(index),rotationRad,angularVelocityRadPerSecond,wheelLinearSpeedMps:angularVelocityRadPerSecond*config.wheelRadius,forwardImpulseNs:this.controller.wheelForwardImpulse(index)??0,sideImpulseNs:this.controller.wheelSideImpulse(index)??0,suspensionForceN:this.controller.wheelSuspensionForce(index)??0}
    })
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
  readEnvironmentState() {
    const surface=this.surfaces.getSurfaceAt(this.chassis.translation())
    return {surfaceType:surface.surfaceType,friction:surface.friction,rollingResistance:surface.rollingResistance}
  }
  readWheelDynamicsState(){return this.wheelDynamics.map(item=>({...item}))}
  readCollisionState(){
    const chassisCollider=this.chassis.collider(0)
    if(!chassisCollider)return {active:false,contactPairCount:0,contactPointCount:0,maximumNormalImpulseNs:0}
    let contactPairCount=0,contactPointCount=0,maximumNormalImpulseNs=0
    this.world.contactPairsWith(chassisCollider,(other)=>{
      if(other.handle===this.groundCollider.handle)return
      contactPairCount++
      this.world.contactPair(chassisCollider,other,(manifold)=>{
        contactPointCount+=manifold.numContacts()
        for(let index=0;index<manifold.numContacts();index++)maximumNormalImpulseNs=Math.max(maximumNormalImpulseNs,Math.abs(manifold.contactImpulse(index)))
      })
    })
    return {active:contactPairCount>0,contactPairCount,contactPointCount,maximumNormalImpulseNs}
  }
  setScenarioObstacle(definition:Readonly<{distanceAheadM:number;halfWidthM:number}>|null){
    if(this.scenarioObstacle){this.world.removeRigidBody(this.scenarioObstacle);this.scenarioObstacle=null}
    if(!definition)return
    if(!Number.isFinite(definition.distanceAheadM)||definition.distanceAheadM<4||!Number.isFinite(definition.halfWidthM)||definition.halfWidthM<=0)throw new Error('Scenario obstacle contract violated')
    const position=this.chassis.translation(),rotation=this.chassis.rotation()
    const forwardX=-2*(rotation.x*rotation.z+rotation.w*rotation.y)
    const forwardZ=2*(rotation.x*rotation.x+rotation.y*rotation.y)-1
    this.scenarioObstacle=this.world.createRigidBody(this.rapier.RigidBodyDesc.fixed().setTranslation(position.x+forwardX*definition.distanceAheadM,position.y,position.z+forwardZ*definition.distanceAheadM).setRotation(rotation))
    this.world.createCollider(this.rapier.ColliderDesc.cuboid(definition.halfWidthM,1,.35).setFriction(1.4).setRestitution(0),this.scenarioObstacle)
  }
  setScenarioLeadVehicle(definition:Readonly<{distanceAheadM:number;speedMps:number;brakeAtSeconds?:number}>|null){
    if(this.scenarioLeadVehicle){this.world.removeRigidBody(this.scenarioLeadVehicle);this.scenarioLeadVehicle=null;this.scenarioLeadState=null}
    if(!definition)return
    if(!Number.isFinite(definition.distanceAheadM)||definition.distanceAheadM<6||!Number.isFinite(definition.speedMps)||definition.speedMps<0||definition.brakeAtSeconds!==undefined&&(!Number.isFinite(definition.brakeAtSeconds)||definition.brakeAtSeconds<0))throw new Error('Scenario lead vehicle contract violated')
    const position=this.chassis.translation(),rotation=this.chassis.rotation()
    const forwardX=-2*(rotation.x*rotation.z+rotation.w*rotation.y),forwardZ=2*(rotation.x*rotation.x+rotation.y*rotation.y)-1
    this.scenarioLeadVehicle=this.world.createRigidBody(this.rapier.RigidBodyDesc.kinematicPositionBased().setTranslation(position.x+forwardX*definition.distanceAheadM,position.y,position.z+forwardZ*definition.distanceAheadM).setRotation(rotation).setCcdEnabled(true))
    this.world.createCollider(this.rapier.ColliderDesc.cuboid(config.chassisHalfExtents.x,config.chassisHalfExtents.y,config.chassisHalfExtents.z).setFriction(.9).setRestitution(0),this.scenarioLeadVehicle)
    this.scenarioLeadState={timeSeconds:0,speedMps:definition.speedMps,brakeAtSeconds:definition.brakeAtSeconds,forwardX,forwardZ}
  }
  readLeadVehicleState(){
    if(!this.scenarioLeadVehicle||!this.scenarioLeadState)return {available:false,relativeLongitudinalDistanceM:0,relativeLateralDistanceM:0,leadSpeedMps:0,closingSpeedMps:0}
    const player=this.chassis.translation(),lead=this.scenarioLeadVehicle.translation(),rotation=this.chassis.rotation()
    const forwardX=-2*(rotation.x*rotation.z+rotation.w*rotation.y),forwardZ=2*(rotation.x*rotation.x+rotation.y*rotation.y)-1
    const rightX=-forwardZ,rightZ=forwardX,dx=lead.x-player.x,dz=lead.z-player.z
    const speed=this.scenarioLeadState.brakeAtSeconds!==undefined&&this.scenarioLeadState.timeSeconds>=this.scenarioLeadState.brakeAtSeconds?0:this.scenarioLeadState.speedMps
    const velocity=this.chassis.linvel(),playerLongitudinalSpeed=velocity.x*forwardX+velocity.z*forwardZ
    return {available:true,relativeLongitudinalDistanceM:dx*forwardX+dz*forwardZ,relativeLateralDistanceM:dx*rightX+dz*rightZ,leadSpeedMps:speed,closingSpeedMps:playerLongitudinalSpeed-speed}
  }
  readScenarioLeadVehiclePose(){
    if(!this.scenarioLeadVehicle)return {available:false,position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1}}
    const position=this.scenarioLeadVehicle.translation(),rotation=this.scenarioLeadVehicle.rotation()
    return {available:true,position:{x:position.x,y:position.y,z:position.z},rotation:{x:rotation.x,y:rotation.y,z:rotation.z,w:rotation.w}}
  }
  reset() {
    if(this.scenarioObstacle){this.world.removeRigidBody(this.scenarioObstacle);this.scenarioObstacle=null}
    if(this.scenarioLeadVehicle){this.world.removeRigidBody(this.scenarioLeadVehicle);this.scenarioLeadVehicle=null;this.scenarioLeadState=null}
    this.world.removeVehicleController(this.controller)
    this.chassis.setTranslation(this.worldDefinition.vehicleSpawn.position, true)
    this.chassis.setRotation(this.worldDefinition.vehicleSpawn.rotation, true)
    this.chassis.setLinvel({ x: 0, y: 0, z: 0 }, true)
    this.chassis.setAngvel({ x: 0, y: 0, z: 0 }, true)
    this.chassis.resetForces(true)
    this.chassis.resetTorques(true)
    this.controller = this.createController()
    this.previousWheelRotations=[0,0,0,0]
    this.wheelDynamics=Array.from({length:4},(_,index)=>({index,inContact:false,rotationRad:0,angularVelocityRadPerSecond:0,wheelLinearSpeedMps:0,forwardImpulseNs:0,sideImpulseNs:0,suspensionForceN:0}))
  }
  dispose() {
    if (this.disposed) return
    this.disposed = true
    this.world.removeVehicleController(this.controller)
    this.world.removeRigidBody(this.chassis)
    if(this.scenarioObstacle){this.world.removeRigidBody(this.scenarioObstacle);this.scenarioObstacle=null}
    if(this.scenarioLeadVehicle){this.world.removeRigidBody(this.scenarioLeadVehicle);this.scenarioLeadVehicle=null;this.scenarioLeadState=null}
    for (const body of this.staticBodies) this.world.removeRigidBody(body)
    this.world.removeRigidBody(this.ground)
  }
}
