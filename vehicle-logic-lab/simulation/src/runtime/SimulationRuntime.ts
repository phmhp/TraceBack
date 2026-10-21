import { PHYSICS_TIMESTEP, SimulationClock } from '../core/SimulationClock.ts'
import { createVehiclePose, createVehicleState } from '../domain/vehicle/VehicleState.ts'
import type { VehiclePoseReader, VehicleStateReader } from '../domain/vehicle/VehicleState.ts'
import type { VehiclePhysicsCommand, VehiclePhysicsPort } from '../domain/vehicle/VehiclePhysicsPort.ts'
import { BrakeExecutionModel } from './control/BrakeExecutionModel.ts'
import { SteeringExecutionModel } from './control/SteeringExecutionModel.ts'
import { VehicleSupportExecutionModel } from './control/VehicleSupportExecutionModel.ts'
import type { VehicleSupportExecutionOutput } from './control/VehicleSupportExecutionModel.ts'
import { FaultManagementExecutionModel } from './control/FaultManagementExecutionModel.ts'
import type { FaultManagementExecutionOutput } from './control/FaultManagementExecutionModel.ts'
import { GearReactionExecutionModel } from './control/GearReactionExecutionModel.ts'
import type { GearReactionExecutionOutput } from './control/GearReactionExecutionModel.ts'
import { RuntimeObservationQualityModel } from './control/RuntimeObservationQualityModel.ts'
import type { RuntimeObservationQualityOutput } from './control/RuntimeObservationQualityModel.ts'
import { ChassisDomainExecutionModel } from './control/ChassisDomainExecutionModel.ts'
import type { BrakingDomainExecutionOutput, SteeringDomainExecutionOutput } from './control/ChassisDomainExecutionModel.ts'
import { MotionCoordinationExecutionModel } from './control/MotionCoordinationExecutionModel.ts'
import type { MotionCoordinationExecutionOutput } from './control/MotionCoordinationExecutionModel.ts'
import { PlatformExecutionModel } from './control/PlatformExecutionModel.ts'
import type { PlatformExecutionOutput } from './control/PlatformExecutionModel.ts'
import { CommunicationExecutionModel } from './control/CommunicationExecutionModel.ts'
import type { CommunicationExecutionOutput } from './control/CommunicationExecutionModel.ts'
import { PropulsionSupervisionExecutionModel } from './control/PropulsionSupervisionExecutionModel.ts'
import type { PropulsionSupervisionExecutionOutput } from './control/PropulsionSupervisionExecutionModel.ts'
import { StabilityExecutionModel } from './control/StabilityExecutionModel.ts'
import type { StabilityExecutionOutput } from './control/StabilityExecutionModel.ts'
import { OccupantProtectionExecutionModel } from './control/OccupantProtectionExecutionModel.ts'
import type { OccupantProtectionExecutionOutput } from './control/OccupantProtectionExecutionModel.ts'
import { AdasExecutionModel } from './control/AdasExecutionModel.ts'
import type { AdasExecutionOutput } from './control/AdasExecutionModel.ts'
import { writeEDrivePhysicsCommand } from './control/EDriveToVehiclePhysicsAdapter.ts'
import { DriverInputRuntime } from './driver/DriverInputRuntime.ts'
import type { Gear } from '../domain/driver/DriverInputTypes.ts'
import type { SessionConfig } from '../domain/session/SessionConfig.ts'
import type { DriveTorqueRequest, EDriveCommand, PropulsionRequest, PropulsionState } from '../domain/propulsion/PropulsionTypes.ts'
import { LegacyVehicleSw } from './c/LegacyVehicleSw.ts'
import { calibrationSlots } from './c/VehicleSwPort.ts'
import type { VehicleSwPort, VehicleSwSnapshot } from './c/VehicleSwPort.ts'
import type { PropulsionCase } from './case/PropulsionCase.ts'
import { EMPTY_VEHICLE_SCENARIO, scenarioPhaseAt, scheduledStimulusValue, validateVehicleScenario } from './scenario/VehicleScenario.ts'
import type { VehicleFunctionObservation, VehicleScenarioDefinition, VehicleScenarioRun, VehicleScenarioSample, VehicleScenarioSnapshot } from './scenario/VehicleScenario.ts'
import { FaultInjectionRuntime, summarizeInterfaceComparison } from './scenario/FaultInjection.ts'
import type { FaultInjectionTelemetry, InterfaceEndpointTelemetry } from './scenario/FaultInjection.ts'
import type { RecoveryChallenge, RecoveryRunMode, RecoverySnapshot } from './gameplay/RecoveryChallenge.ts'
import { DrivingEventRuntime, EMPTY_DRIVING_EVENT } from './gameplay/DrivingEvent.ts'
import type { DrivingEventDefinition, DrivingEventSnapshot } from './gameplay/DrivingEvent.ts'

export interface SimulationPropulsionCalibration {
  keyboardPedalResponse: {
    acceleratorRisePerSecond: number
    acceleratorFallPerSecond: number
    brakeRisePerSecond: number
    brakeFallPerSecond: number
    steeringRisePerSecond: number
    steeringReturnPerSecond: number
  }
  gearDirectionChangeMaxSpeedMps: { value: number }
  vmcForwardTorqueMap: { maximumTorqueNm: number; zeroTorqueSpeedMps: number }
  vmcReverseTorqueMap: { maximumTorqueNm: number; zeroTorqueSpeedMps: number }
  maxForwardTorqueNm: { value: number }
  maxReverseTorqueNm: { value: number }
  torqueToForce: { value: number }
}

export type RaceStatus = 'idle' | 'loading' | 'running' | 'paused' | 'error'
export interface RaceTelemetry {
  physicsCommand?:{driveForceN:number;brakeForceN:number;frontWheelAngleRad:number}
  appliedDriveForceN?:number
  vehicleSw: VehicleSwSnapshot | null
  kind: 'LIVE_SIMULATION'
  speedKmh: number
  simulationTime: number
  accelerator: number
  acceleratorValidity: 'VALID' | 'INVALID'
  brake: number
  steering: number
  gear: Gear
  gearRequest: Gear
  gearStateValidity: 'VALID' | 'INVALID'
  transitionAccepted: boolean
  propulsionState: PropulsionState
  propulsionRequest: PropulsionRequest
  driveTorqueRequest: DriveTorqueRequest
  eDriveCommand: EDriveCommand
  longitudinalVelocity: number
  longitudinalAcceleration: number
  vehicleReady: boolean
  propulsionEnable: boolean
  status: RaceStatus
  error: string | null
  raceFinished: boolean
  drivingEvent:DrivingEventSnapshot
}
export const INITIAL_TELEMETRY: RaceTelemetry = {
  vehicleSw: null,
  kind: 'LIVE_SIMULATION', speedKmh: 0, simulationTime: 0,
  accelerator: 0, acceleratorValidity: 'VALID', brake: 0, steering: 0, gear: 'D', gearRequest: 'D', gearStateValidity: 'VALID', transitionAccepted: true,
  propulsionState: 'PROP_DISABLED', propulsionRequest: { magnitude: 0, direction: 'NONE', validity: 'VALID' },
  driveTorqueRequest: { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' },
  eDriveCommand: { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' },
  longitudinalVelocity: 0, longitudinalAcceleration: 0, vehicleReady: false, propulsionEnable: false,
  status: 'idle', error: null, raceFinished: false, drivingEvent:EMPTY_DRIVING_EVENT,
}

/** Single fixed-step owner. No React, browser events, Rapier objects or SW task scheduler. */
export class SimulationRuntime {
  readonly clock = new SimulationClock()
  readonly driverInput: DriverInputRuntime
  private readonly vehicle = createVehicleState()
  private readonly previousPose = createVehiclePose()
  private readonly command: VehiclePhysicsCommand = { driveForce: 0, brakeForce: 0, steering: 0 }
  private readonly brakeExecution = new BrakeExecutionModel()
  private readonly steeringExecution = new SteeringExecutionModel()
  private readonly vehicleSupportExecution = new VehicleSupportExecutionModel()
  private vehicleSupportOutput:VehicleSupportExecutionOutput|null=null
  private readonly faultManagementExecution=new FaultManagementExecutionModel()
  private faultManagementOutput:FaultManagementExecutionOutput|null=null
  private readonly gearReactionExecution=new GearReactionExecutionModel()
  private gearReactionOutput:GearReactionExecutionOutput|null=null
  private readonly observationQualityExecution=new RuntimeObservationQualityModel()
  private observationQualityOutput:RuntimeObservationQualityOutput|null=null
  private readonly chassisDomainExecution=new ChassisDomainExecutionModel()
  private brakingDomainOutput:BrakingDomainExecutionOutput|null=null
  private steeringDomainOutput:SteeringDomainExecutionOutput|null=null
  private readonly motionCoordinationExecution=new MotionCoordinationExecutionModel()
  private motionCoordinationOutput:MotionCoordinationExecutionOutput|null=null
  private readonly platformExecution=new PlatformExecutionModel()
  private platformExecutionOutput:PlatformExecutionOutput|null=null
  private readonly communicationExecution=new CommunicationExecutionModel()
  private communicationExecutionOutput:CommunicationExecutionOutput|null=null
  private readonly propulsionSupervisionExecution=new PropulsionSupervisionExecutionModel()
  private propulsionSupervisionOutput:PropulsionSupervisionExecutionOutput|null=null
  private readonly stabilityExecution=new StabilityExecutionModel()
  private stabilityOutput:StabilityExecutionOutput|null=null
  private readonly occupantProtectionExecution=new OccupantProtectionExecutionModel()
  private occupantProtectionOutput:OccupantProtectionExecutionOutput|null=null
  private readonly adasExecution=new AdasExecutionModel()
  private adasOutput:AdasExecutionOutput|null=null
  private readonly vehicleSw: VehicleSwPort
  private swSnapshot: VehicleSwSnapshot | null = null
  private executionStep = 0
  private incident: PropulsionCase | null = null
  private propulsionState: PropulsionState = 'PROP_DISABLED'
  private propulsionRequest: PropulsionRequest = { magnitude: 0, direction: 'NONE', validity: 'VALID' }
  private driveTorqueRequest: DriveTorqueRequest = { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
  private eDriveCommand: EDriveCommand = { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
  private previousLongitudinalVelocity = 0
  private resetAccelerationOnNextState = true
  private physics: VehiclePhysicsPort | null = null
  private accumulator = 0
  private ticksSincePublish = 0
  private skipResumeDelta = false
  private error: string | null = null
  private readonly publish: (telemetry: RaceTelemetry) => void
  private readyGate: (()=>boolean) | null = null
  /** Optional educational adapter. Defaults preserve the original runtime path. */
  configureReadyGate(reader: ()=>boolean) { this.readyGate = reader }
  private teachingTorqueCeiling:(()=>number|undefined)|null=null
  configureTeachingTorqueCeiling(reader:()=>number|undefined){this.teachingTorqueCeiling=reader}
  private finish: { x: number; z: number; heading: number } | null = null
  private route: readonly {x:number;z:number}[] = []
  configureRoute(points: readonly {x:number;z:number}[]) { this.route = points }
  private outsideRoute() {
    const p=this.vehicle.position
    return this.route.length>1 && !this.route.slice(1).some((b,i)=>{const a=this.route[i]!;const dx=b.x-a.x,dz=b.z-a.z;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.z-a.z)*dz)/(dx*dx+dz*dz||1)));return Math.hypot(p.x-a.x-t*dx,p.z-a.z-t*dz)<=20})
  }
  private raceFinished = false
  private finishElapsed = 0
  private sessionConfig: SessionConfig | null = null
  private readonly calibration: Readonly<SimulationPropulsionCalibration>
  private scenario:VehicleScenarioSnapshot=EMPTY_VEHICLE_SCENARIO
  private scenarioListeners=new Set<()=>void>()
  private scenarioSerial=0
  private readonly faultInjection=new FaultInjectionRuntime()
  private currentFaultTelemetry:FaultInjectionTelemetry|undefined
  private currentInterfaceTelemetry:InterfaceEndpointTelemetry|undefined
  private recoveryChallenge:RecoveryChallenge|null=null
  private publishRecovery:(snapshot:RecoverySnapshot)=>void=()=>{}
  private readonly drivingEvent=new DrivingEventRuntime()

  constructor(
    calibration: Readonly<SimulationPropulsionCalibration>,
    publish: (telemetry: RaceTelemetry) => void = () => {},
    driverInput = new DriverInputRuntime(),
    vehicleSw: VehicleSwPort = new LegacyVehicleSw(calibration),
  ) {
    this.calibration = structuredClone(calibration)
    this.publish = publish
    this.driverInput = driverInput
    this.vehicleSw = vehicleSw
  }

  readonly readVehicleState: VehicleStateReader = () => this.vehicle
  readonly readPreviousPose: VehiclePoseReader = () => this.previousPose
  readonly readScenarioLeadVehiclePose=()=>this.physics?.readScenarioLeadVehiclePose?.()??{available:false,position:{x:0,y:0,z:0},rotation:{x:0,y:0,z:0,w:1}}
  readonly readInterpolationAlpha = () => !this.clock.running || this.clock.paused ? 1 : Math.min(1, this.accumulator / PHYSICS_TIMESTEP)
  configureFinish(point: { x: number; z: number }, heading: number) { this.finish = { x: point.x, z: point.z, heading } }
  configureRecoveryChallenge(challenge:RecoveryChallenge,publish:(snapshot:RecoverySnapshot)=>void){this.recoveryChallenge=challenge;this.publishRecovery=publish;publish(challenge.getSnapshot())}
  configureDrivingEvent(definition:DrivingEventDefinition){this.drivingEvent.configure(definition)}
  unlockRecoveryChallenge(){this.recoveryChallenge?.unlock();if(this.recoveryChallenge)this.publishRecovery(this.recoveryChallenge.getSnapshot())}
  prepareRecoveryChallenge(runMode:RecoveryRunMode){if(!this.recoveryChallenge)throw new Error('Recovery challenge is not configured');this.recoveryChallenge.prepare(runMode);this.publishRecovery(this.recoveryChallenge.getSnapshot())}
  private startConfiguredDrivingEvent(){const definition=this.drivingEvent.getDefinition();if(!definition||definition.activation!=='RECOVERY_START')return;const actor=this.drivingEvent.start();this.physics?.setScenarioLeadVehicle?.(actor)}
  startRecoveryChallenge(){
    if(!this.recoveryChallenge)throw new Error('Recovery challenge is not configured')
    // The incident can be captured on the edge of the drivable corridor.  Begin the
    // repaired run from the map's existing safe spawn instead of resuming into an
    // immediate off-route failure.  Preserve the submitted incident/repair state so
    // the same fault cannot be armed again.
    this.clock.pause()
    this.resetLogicalState(false)
    this.physics?.reset()
    this.startConfiguredDrivingEvent()
    if(this.physics)this.physics.readState(this.vehicle)
    this.copyPreviousPose()
    this.accumulator=0
    this.skipResumeDelta=true
    this.error=null
    this.raceFinished=false
    this.finishElapsed=0
    this.recoveryChallenge.start()
    this.publishRecovery(this.recoveryChallenge.getSnapshot())
    this.publishNow()
  }
  retryRecoveryChallenge(){if(!this.recoveryChallenge)throw new Error('Recovery challenge is not configured');this.clock.pause();this.driverInput.reset();this.vehicleSw.reset();this.physics?.reset();this.drivingEvent.reset();this.startConfiguredDrivingEvent();if(this.physics)this.physics.readState(this.vehicle);this.copyPreviousPose();this.accumulator=0;this.skipResumeDelta=true;this.raceFinished=false;this.finishElapsed=0;this.error=null;this.recoveryChallenge.retry();this.clock.resume();this.publishRecovery(this.recoveryChallenge.getSnapshot());this.publishNow()}
  configureSession(config: SessionConfig) { this.sessionConfig = { ...config } }
  configureCase(incident: PropulsionCase) {
    if (!this.vehicleSw.setCaseVariant) throw new Error('Case requires a C case-capable backend')
    this.incident = incident
  }
  readonly subscribeScenario=(listener:()=>void)=>{this.scenarioListeners.add(listener);return()=>{this.scenarioListeners.delete(listener)}}
  readonly getScenarioSnapshot=()=>this.scenario
  private publishScenario(){this.scenarioListeners.forEach(listener=>listener())}
  private setScenario(patch:Partial<VehicleScenarioSnapshot>){this.scenario={...this.scenario,...patch};this.publishScenario()}
  readSessionConfig() { return this.sessionConfig ? { ...this.sessionConfig } : null }
  private copyPreviousPose() {
    Object.assign(this.previousPose.position, this.vehicle.position)
    Object.assign(this.previousPose.rotation, this.vehicle.rotation)
  }
  private readRouteLaneContext(){
    if(this.route.length<2)return {available:false,offsetM:0,headingErrorRad:0}
    const position=this.vehicle.position,rotation=this.vehicle.rotation
    const vehicleHeading=Math.atan2(-2*(rotation.x*rotation.z+rotation.w*rotation.y),2*(rotation.x*rotation.x+rotation.y*rotation.y)-1)
    let bestDistance=Infinity,bestOffset=0,bestHeading=0
    for(let index=1;index<this.route.length;index++){
      const start=this.route[index-1]!,end=this.route[index]!,dx=end.x-start.x,dz=end.z-start.z,lengthSquared=dx*dx+dz*dz
      if(!lengthSquared)continue
      const t=Math.max(0,Math.min(1,((position.x-start.x)*dx+(position.z-start.z)*dz)/lengthSquared)),closestX=start.x+t*dx,closestZ=start.z+t*dz
      const lateralX=position.x-closestX,lateralZ=position.z-closestZ,distance=Math.hypot(lateralX,lateralZ)
      if(distance<bestDistance){const length=Math.sqrt(lengthSquared);bestDistance=distance;bestOffset=(dx*lateralZ-dz*lateralX)/length;bestHeading=Math.atan2(dx,dz)}
    }
    return {available:Number.isFinite(bestDistance),offsetM:bestOffset,headingErrorRad:Math.atan2(Math.sin(vehicleHeading-bestHeading),Math.cos(vehicleHeading-bestHeading))}
  }
  private resetLogicalState(resetIncident=true) {
    this.driverInput.reset()
    this.vehicleSw.reset()
    if(resetIncident)this.incident?.reset()
    this.swSnapshot = null
    this.executionStep = 0
    this.vehicle.gearState = 'D'
    this.vehicle.longitudinalAcceleration = 0
    this.previousLongitudinalVelocity = 0
    this.resetAccelerationOnNextState = true
    this.propulsionState = 'PROP_DISABLED'
    this.propulsionRequest = { magnitude: 0, direction: 'NONE', validity: 'VALID' }
    this.driveTorqueRequest = { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
    this.eDriveCommand = { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
    this.brakeExecution.reset()
    this.steeringExecution.reset()
    this.vehicleSupportExecution.reset()
    this.vehicleSupportOutput=null
    this.faultManagementExecution.reset()
    this.faultManagementOutput=null
    this.gearReactionExecution.reset();this.gearReactionOutput=null
    this.observationQualityExecution.reset();this.observationQualityOutput=null
    this.chassisDomainExecution.reset();this.brakingDomainOutput=null;this.steeringDomainOutput=null
    this.motionCoordinationExecution.reset();this.motionCoordinationOutput=null
    this.platformExecution.reset();this.platformExecutionOutput=null
    this.communicationExecution.reset();this.communicationExecutionOutput=null
    this.propulsionSupervisionExecution.reset();this.propulsionSupervisionOutput=null
    this.stabilityExecution.reset();this.stabilityOutput=null
    this.occupantProtectionExecution.reset();this.occupantProtectionOutput=null
    this.adasExecution.reset();this.adasOutput=null
    this.drivingEvent.reset()
    this.faultInjection.reset()
    this.currentFaultTelemetry=undefined
    this.currentInterfaceTelemetry=undefined
  }

  startVehicleScenario(definition:VehicleScenarioDefinition){
    if(!this.physics)throw new Error('차량 물리 런타임이 준비되지 않았습니다.')
    validateVehicleScenario(definition)
    this.clock.reset();this.error=null;this.raceFinished=false;this.finishElapsed=0;this.accumulator=0;this.ticksSincePublish=0
    this.resetLogicalState(false)
    this.physics.reset();this.physics.readState(this.vehicle);this.copyPreviousPose()
    this.physics.setScenarioObstacle?.(definition.environment?.collisionObstacle??null)
    this.physics.setScenarioLeadVehicle?.(definition.environment?.leadVehicle??null)
    this.driverInput.setGearRequest(definition.preconditions.gear)
    const runId=`vehicle-scenario-${++this.scenarioSerial}`
    this.scenario={status:'RUNNING',phase:'PRECONDITION',runId,elapsedSeconds:0,definition:structuredClone(definition),samples:[]}
    this.clock.start();this.skipResumeDelta=true;this.publishScenario();this.publishNow()
    return runId
  }
  replayVehicleScenario(){
    const definition=this.scenario.definition
    if(!definition)throw new Error('재실행할 차량 시나리오가 없습니다.')
    return this.startVehicleScenario(definition)
  }
  reviewVehicleScenario(run:VehicleScenarioRun){
    this.clock.pause();this.driverInput.resetMotion()
    this.scenario={status:run.status,phase:'RESULT',runId:run.runId,elapsedSeconds:run.events.end,definition:structuredClone(run.definition),samples:structuredClone(run.samples),completedRun:structuredClone(run)}
    this.publishScenario();this.publishNow()
  }
  abortVehicleScenario(reason='사용자가 실행을 중단했습니다.'){
    if(this.scenario.status!=='RUNNING')return
    this.clock.pause();this.driverInput.resetMotion()
    this.setScenario({status:'ABORTED',phase:'RESULT',error:reason})
    this.publishNow()
  }
  private applyVehicleScenario(timeSeconds:number){
    const definition=this.scenario.definition
    if(this.scenario.status!=='RUNNING'||!definition)return
    this.driverInput.setAccelerator(0);this.driverInput.setBrake(0);this.driverInput.setSteering(0)
    for(const stimulus of definition.stimuli){
      const value=scheduledStimulusValue(stimulus,timeSeconds)
      if(stimulus.target.id==='accelerator')this.driverInput.setAccelerator(value)
      else if(stimulus.target.id==='brake')this.driverInput.setBrake(value)
      else this.driverInput.setSteering(value)
    }
  }
  private recordVehicleScenarioSample(timeSeconds:number){
    const definition=this.scenario.definition
    if(this.scenario.status!=='RUNNING'||!definition)return
    const input=this.driverInput.getState()
    const environment=this.physics?.readEnvironmentState?.()
    const wheelDynamics=this.physics?.readWheelDynamicsState?.()??[]
    const collision=this.physics?.readCollisionState?.()
    const lead=this.physics?.readLeadVehicleState?.()
    const lane=this.readRouteLaneContext()
    const contactWheels=wheelDynamics.filter(item=>item.inContact)
    const denominator=Math.max(1,Math.abs(this.vehicle.longitudinalVelocity))
    const maxWheelSlipEstimate=contactWheels.length?Math.max(...contactWheels.map(item=>Math.abs(Math.abs(item.wheelLinearSpeedMps)-Math.abs(this.vehicle.longitudinalVelocity))/denominator)):0
    const available:Record<string,number|string>={
      accelerator:input.accelerator,brake:input.brake,steering:input.steering,gearState:this.vehicle.gearState,
      propulsionRequest:this.propulsionRequest.magnitude,driveTorqueRequest:this.driveTorqueRequest.magnitudeNm,eDriveCommand:this.eDriveCommand.magnitudeNm,
      driveForce:this.command.driveForce,brakeForce:this.command.brakeForce,speedKmh:this.vehicle.speed*3.6,longitudinalVelocity:this.vehicle.longitudinalVelocity,
      longitudinalAcceleration:this.vehicle.longitudinalAcceleration,positionX:this.vehicle.position.x,positionZ:this.vehicle.position.z,
      surfaceType:environment?.surfaceType??'UNAVAILABLE',surfaceFriction:environment?.friction??0,
      vehicleMode:this.vehicleSupportOutput?.vehicleMode??'UNAVAILABLE',propulsionPermission:String(this.vehicleSupportOutput?.propulsionPermission??false),
      energyStatus:this.vehicleSupportOutput?.energyStatus??'UNAVAILABLE',maxDriveTorqueCandidate:this.vehicleSupportOutput?.maxDriveTorqueCandidateNm??'NOT_CONFIGURED',
      wheelContactCount:contactWheels.length,maxWheelSlipEstimate,yawRate:this.vehicle.angularVelocity.y,
      collisionActive:String(collision?.active??false),collisionImpulse:collision?.maximumNormalImpulseNs??0,
      leadDistance:lead?.available?lead.relativeLongitudinalDistanceM:'UNAVAILABLE',leadClosingSpeed:lead?.available?lead.closingSpeedMps:'UNAVAILABLE',
      laneOffset:lane.available?lane.offsetM:'UNAVAILABLE',headingError:lane.available?lane.headingErrorRad:'UNAVAILABLE',
      accStatus:this.adasOutput?.acc.status??'UNAVAILABLE',aebStatus:this.adasOutput?.aeb.status??'UNAVAILABLE',lkaStatus:this.adasOutput?.lka.status??'UNAVAILABLE',
    }
    const executed=(functionId:string,actual:Record<string,number|string|boolean>):VehicleFunctionObservation=>({functionId,status:'EXECUTED',basis:'FUNCTION_EXECUTION',actual})
    const observed=(functionId:string,actual:Record<string,number|string|boolean>):VehicleFunctionObservation=>({functionId,status:'OBSERVED_PARTIAL',basis:'HOST_RUNTIME_OBSERVATION',actual})
    const functionObservations:VehicleFunctionObservation[]=[
      executed('LF-GEAR-ACQ',{GearRequest:input.gearRequest,GearRequestValidity:input.gearRequestValidity}),
      executed('LF-GEAR-INTERLOCK',{GearRequest:input.gearRequest,LongitudinalVelocity:this.vehicle.longitudinalVelocity,TransitionAccepted:this.swSnapshot?.output.transitionAccepted??false}),
      executed('LF-GEAR-STATE',{GearState:this.vehicle.gearState,GearStateValidity:this.swSnapshot?.output.gearStateValidity??'INVALID'}),
      executed('LF-PROP-ACQ',{AcceleratorPedalPosition:input.accelerator,AcceleratorPedalValidity:input.acceleratorValidity}),
      executed('LF-PROP-INTERP',{PropulsionRequest:this.propulsionRequest.magnitude,Direction:this.propulsionRequest.direction,Validity:this.propulsionRequest.validity}),
      executed('LF-PROP-GEN',{DriveTorqueRequest:this.driveTorqueRequest.magnitudeNm,Direction:this.driveTorqueRequest.direction,Validity:this.driveTorqueRequest.validity}),
      executed('LF-PROP-EDRV',{EDriveCommand:this.eDriveCommand.magnitudeNm,Direction:this.eDriveCommand.direction,Validity:this.eDriveCommand.validity}),
      executed('LF-ACT-DRIVE',{driveForce:this.command.driveForce}),
      executed('LF-BRK-CMD',{DriverBrakeRequest:input.brake,brakeForce:this.command.brakeForce}),
      executed('LF-ACT-BRAKE',{brakeForce:this.command.brakeForce}),
      executed('LF-STR-ACT',{DriverSteeringRequest:input.steering,steering:this.command.steering}),
      executed('LF-ACT-STEER',{steering:this.command.steering}),
      executed('LF-PLANT-MOTION',{VehicleSpeed:this.vehicle.speed,LongitudinalVelocity:this.vehicle.longitudinalVelocity,LongitudinalAcceleration:this.vehicle.longitudinalAcceleration,PositionX:this.vehicle.position.x,PositionZ:this.vehicle.position.z}),
      ...(environment?[executed('LF-PLANT-ENV',{SurfaceType:environment.surfaceType,Friction:environment.friction,RollingResistance:environment.rollingResistance})]:[]),
      observed('LF-BRK-ACQ',{DriverBrakeRequest:input.brake,Validity:'VALID'}),
      observed('LF-COM-PORT',{TransferMode:'DIRECT_SW_PORT',ExecutionStep:this.executionStep}),
      observed('LF-EXE-CLOCK',{SimulationTimeSeconds:timeSeconds,FixedStepSeconds:PHYSICS_TIMESTEP}),
      observed('LF-EXE-RECORD',{Recorder:'VEHICLE_SCENARIO',ConfiguredMonitorCount:definition.monitors.length}),
      observed('LF-FM-OBS',{FaultActive:this.currentFaultTelemetry?.active??false,InjectionPoint:this.currentFaultTelemetry?.injectionPointId??'NONE'}),
      observed('LF-DRV-ACQ',{Accelerator:input.accelerator,Brake:input.brake,Steering:input.steering,GearRequest:input.gearRequest}),
      observed('LF-DRV-VALID',{AcceleratorValidity:input.acceleratorValidity,GearRequestValidity:input.gearRequestValidity}),
      ...(environment?[observed('LF-ENV-STATE',{SurfaceType:environment.surfaceType,Friction:environment.friction})]:[]),
      observed('LF-MC-LON',{Scope:'TRACKBACK_PROPULSION_ONLY',PropulsionRequest:this.propulsionRequest.magnitude,DriveTorqueRequest:this.driveTorqueRequest.magnitudeNm}),
      observed('LF-PROP-LIM',{RequestedTorque:this.driveTorqueRequest.magnitudeNm,LimitedCommand:this.eDriveCommand.magnitudeNm}),
      observed('LF-PROP-OUT',{EDriveCommand:this.eDriveCommand.magnitudeNm,driveForce:this.command.driveForce}),
      observed('LF-PROP-STA',{PropulsionState:this.propulsionState,PropulsionEnable:this.swSnapshot?.input.propulsionEnable??false}),
      observed('LF-SEN-ACT',{driveForce:this.command.driveForce,brakeForce:this.command.brakeForce,steering:this.command.steering}),
      observed('LF-SEN-MOTION',{VehicleSpeed:this.vehicle.speed,LongitudinalVelocity:this.vehicle.longitudinalVelocity,LongitudinalAcceleration:this.vehicle.longitudinalAcceleration}),
      observed('LF-STR-ACQ',{DriverSteeringRequest:input.steering,Validity:'VALID'}),
      observed('LF-STR-DEMAND',{DriverSteeringRequest:input.steering,FrontWheelAngle:this.command.steering}),
      observed('LF-VS-INIT',{VehicleReady:this.swSnapshot?.input.vehicleReady??false,PhysicsAttached:Boolean(this.physics)}),
      observed('LF-VS-PERM',{PropulsionEnable:this.swSnapshot?.input.propulsionEnable??false,GearState:this.vehicle.gearState}),
      ...(this.vehicleSupportOutput?[
        executed('LF-VS-MODE',{VehicleMode:this.vehicleSupportOutput.vehicleMode,VehicleReady:this.vehicleSupportOutput.vehicleReady,PropulsionPermission:this.vehicleSupportOutput.propulsionPermission}),
        executed('LF-VS-FAULT',{DegradedAvailability:this.vehicleSupportOutput.degradedAvailability,Reason:this.vehicleSupportOutput.reason}),
        executed('LF-EN-READY',{DrivePowerAvailable:this.vehicleSupportOutput.drivePowerAvailable,EnergyStatus:this.vehicleSupportOutput.energyStatus}),
        executed('LF-EN-LIMIT',{MaxDriveTorqueCandidateNm:this.vehicleSupportOutput.maxDriveTorqueCandidateNm??'NOT_CONFIGURED',Application:'OPEN_NOT_APPLIED'}),
        executed('LF-EN-MON',{EnergyStatus:this.vehicleSupportOutput.energyStatus,ConstraintCandidatePresent:this.vehicleSupportOutput.maxDriveTorqueCandidateNm!==undefined}),
      ]:[]),
      ...(this.faultManagementOutput?[
        executed('LF-FM-DETECT',{Detection:this.faultManagementOutput.detection,LifecycleState:this.faultManagementOutput.lifecycleState}),
        executed('LF-FM-DIAG',{DiagnosticEvent:this.faultManagementOutput.diagnosticEvent,Authority:'TRACKBACK_EXECUTION_MODEL'}),
        executed('LF-FM-REACT',{ReactionRequest:this.faultManagementOutput.reactionRequest,Application:'REQUEST_ONLY_NOT_SAFETY_POLICY'}),
        executed('LF-FM-REC',{Recovery:this.faultManagementOutput.recovery}),
      ]:[]),
      ...(this.gearReactionOutput?[executed('LF-GEAR-REACT',{Reaction:this.gearReactionOutput.reaction,RetainedGear:this.gearReactionOutput.retainedGear,DriverNoticeRequired:this.gearReactionOutput.driverNoticeRequired})]:[]),
      ...(this.observationQualityOutput?[executed('LF-SEN-QUALITY',{Quality:this.observationQualityOutput.quality,Reason:this.observationQualityOutput.reason,FiniteValues:this.observationQualityOutput.finiteValueCount,ExpectedValues:this.observationQualityOutput.expectedValueCount,Scope:'TRACKBACK_RUNTIME_OBSERVATION'})]:[]),
      ...(this.brakingDomainOutput?[
        executed('LF-BRK-STATE',{Availability:this.brakingDomainOutput.availability,Scope:'TRACKBACK_SERVICE_BRAKE'}),
        executed('LF-BRK-DEMAND',{NormalizedBrakeDemand:this.brakingDomainOutput.normalizedDemand,Mapping:'IDENTITY_NORMALIZED_TRACKBACK'}),
        executed('LF-BRK-COORD',{Source:this.brakingDomainOutput.coordinationSource,SelectedRequest:this.brakingDomainOutput.selectedRequest,OtherSources:'NOT_IMPLEMENTED'}),
        executed('LF-BRK-BLEND',{Mode:this.brakingDomainOutput.blendMode,RegenContribution:this.brakingDomainOutput.regenContribution,FrictionRequest:this.brakingDomainOutput.frictionRequest}),
        executed('LF-BRK-FDBK',{Status:this.brakingDomainOutput.feedbackStatus,CommandedBrakeForceN:this.brakingDomainOutput.commandedBrakeForceN,ObservedLongitudinalAccelerationMps2:this.brakingDomainOutput.observedLongitudinalAccelerationMps2}),
      ]:[]),
      ...(this.steeringDomainOutput?[
        executed('LF-STR-STATE',{Availability:this.steeringDomainOutput.availability,Scope:'TRACKBACK_MANUAL_STEERING'}),
        executed('LF-STR-COORD',{Source:this.steeringDomainOutput.coordinationSource,SelectedRequest:this.steeringDomainOutput.selectedRequest,AssistSources:'NOT_IMPLEMENTED'}),
        executed('LF-STR-MON',{Status:this.steeringDomainOutput.monitoringStatus,FrontWheelAngleRad:this.steeringDomainOutput.frontWheelAngleRad,ObservedVehicleSpeedMps:this.steeringDomainOutput.observedVehicleSpeedMps,YawOracle:'UNAVAILABLE'}),
      ]:[]),
      ...(this.motionCoordinationOutput?[
        executed('LF-MC-REQ',{Scope:this.motionCoordinationOutput.requestScope,PropulsionRequest:this.motionCoordinationOutput.longitudinalRequest.propulsion,BrakeRequest:this.motionCoordinationOutput.longitudinalRequest.brake,SteeringRequest:this.motionCoordinationOutput.lateralRequest}),
        executed('LF-MC-AUTH',{Authority:this.motionCoordinationOutput.authority,LongitudinalPolicy:this.motionCoordinationOutput.longitudinalPolicy,OtherRequestSources:'NOT_IMPLEMENTED'}),
        executed('LF-MC-LAT',{LateralRequest:this.motionCoordinationOutput.lateralRequest,Policy:this.motionCoordinationOutput.lateralPolicy}),
        executed('LF-MC-ALLOC',{DriveForceN:this.motionCoordinationOutput.allocation.driveForceN,BrakeForceN:this.motionCoordinationOutput.allocation.brakeForceN,FrontWheelAngleRad:this.motionCoordinationOutput.allocation.frontWheelAngleRad,Scope:'CURRENT_TRACKBACK_COMMANDS'}),
        executed('LF-MC-MON',{Status:this.motionCoordinationOutput.monitorStatus,ObservedLongitudinalAccelerationMps2:this.motionCoordinationOutput.observedLongitudinalAccelerationMps2}),
      ]:[]),
      ...(this.platformExecutionOutput?[
        executed('LF-EXE-SCHED',{TaskId:this.platformExecutionOutput.taskId,ReleaseIndex:this.platformExecutionOutput.releaseIndex,ScheduledTimeSeconds:this.platformExecutionOutput.scheduledTimeSeconds,ActualTimeSeconds:this.platformExecutionOutput.actualTimeSeconds,PeriodSeconds:this.platformExecutionOutput.periodSeconds}),
        executed('LF-EXE-SUP',{Completed:this.platformExecutionOutput.completed,Supervision:this.platformExecutionOutput.supervision,TimingErrorSeconds:this.platformExecutionOutput.timingErrorSeconds,Scope:'TRACKBACK_HOST_RUNTIME'}),
      ]:[]),
      ...(this.communicationExecutionOutput?[
        executed('LF-COM-NET',{Transport:this.communicationExecutionOutput.transport,Sequence:this.communicationExecutionOutput.sequence,SourceTimestampSeconds:this.communicationExecutionOutput.sourceTimestampSeconds,DestinationTimestampSeconds:this.communicationExecutionOutput.destinationTimestampSeconds,Scope:'NOT_CAN_FD'}),
        executed('LF-COM-SUP',{AgeSeconds:this.communicationExecutionOutput.ageSeconds,Freshness:this.communicationExecutionOutput.freshness}),
      ]:[]),
      ...(this.propulsionSupervisionOutput?[
        executed('LF-PROP-MON',{Status:this.propulsionSupervisionOutput.monitorStatus,PropulsionRequest:this.propulsionSupervisionOutput.propulsionRequest,DriveTorqueRequestNm:this.propulsionSupervisionOutput.driveTorqueRequestNm,EDriveCommandNm:this.propulsionSupervisionOutput.eDriveCommandNm,ValidityChain:this.propulsionSupervisionOutput.validityChain}),
        executed('LF-PROP-REACT',{Reaction:this.propulsionSupervisionOutput.reaction,Application:this.propulsionSupervisionOutput.reactionApplication}),
        executed('LF-PROP-REC',{Recovery:this.propulsionSupervisionOutput.recovery}),
      ]:[]),
      ...(this.stabilityOutput?[
        executed('LF-STB-ABS',{Status:this.stabilityOutput.abs.status,BrakeScale:this.stabilityOutput.abs.brakeScale,Scope:'TRACKBACK_GLOBAL_BRAKE_SCALE'}),
        executed('LF-STB-TCS',{Status:this.stabilityOutput.tcs.status,DriveScale:this.stabilityOutput.tcs.driveScale,Scope:'TRACKBACK_GLOBAL_DRIVE_SCALE'}),
        executed('LF-STB-ESC',{Status:this.stabilityOutput.esc.status,ExpectedYawRateRadPerSecond:this.stabilityOutput.esc.expectedYawRateRadPerSecond,YawDeviationRadPerSecond:this.stabilityOutput.esc.yawDeviationRadPerSecond,Intervention:this.stabilityOutput.esc.intervention}),
        executed('LF-STB-COORD',{InterventionEnabled:this.stabilityOutput.coordination.interventionEnabled,DriveScale:this.stabilityOutput.coordination.driveScale,BrakeScale:this.stabilityOutput.coordination.brakeScale}),
      ]:[]),
      ...(this.occupantProtectionOutput?[
        executed('LF-OCC-IMPACT',{Observation:this.occupantProtectionOutput.impactObservation,ContactPairCount:this.occupantProtectionOutput.contactPairCount,MaximumNormalImpulseNs:this.occupantProtectionOutput.maximumNormalImpulseNs}),
        executed('LF-OCC-DECIDE',{Decision:this.occupantProtectionOutput.decision,Criterion:'TRACKBACK_DEMO_ANY_NON_GROUND_CONTACT'}),
        executed('LF-OCC-DEPLOY',{Command:this.occupantProtectionOutput.deployCommand,PhysicalRestraintModel:this.occupantProtectionOutput.physicalRestraintModel}),
      ]:[]),
      ...(this.adasOutput?[
        executed('LF-ADAS-COMMON',{DemoEnabled:this.adasOutput.common.demoEnabled,LongitudinalPerceptionAvailable:this.adasOutput.common.longitudinalPerceptionAvailable,LanePerceptionAvailable:this.adasOutput.common.lanePerceptionAvailable,Authority:'TRACKBACK_EXECUTION_MODEL'}),
        executed('LF-ADAS-ACC',{Status:this.adasOutput.acc.status,DriveScale:this.adasOutput.acc.driveScale,DistanceM:this.adasOutput.acc.distanceM??'UNAVAILABLE'}),
        executed('LF-ADAS-AEB',{Status:this.adasOutput.aeb.status,TtcSeconds:this.adasOutput.aeb.ttcSeconds??'UNAVAILABLE',BrakeOverride:this.adasOutput.aeb.brakeOverride}),
        executed('LF-ADAS-LKA',{Status:this.adasOutput.lka.status,LaneOffsetM:this.adasOutput.lka.laneOffsetM??'UNAVAILABLE',HeadingErrorRad:this.adasOutput.lka.headingErrorRad??'UNAVAILABLE',SteeringCorrection:this.adasOutput.lka.steeringCorrection}),
      ]:[]),
    ]
    const sample:VehicleScenarioSample={
      timeSeconds,phase:scenarioPhaseAt(definition,timeSeconds),values:Object.fromEntries(definition.monitors.map(id=>[id,available[id]!])),
      functionObservations,
      faultTelemetry:this.currentFaultTelemetry?structuredClone(this.currentFaultTelemetry):undefined,
      interfaceTelemetry:this.currentInterfaceTelemetry?structuredClone(this.currentInterfaceTelemetry):undefined,
    }
    const samples=[...this.scenario.samples,sample]
    if(timeSeconds+1e-9>=definition.durationSeconds){
      this.driverInput.resetMotion();this.clock.pause()
      const firstStimulus=Math.min(...definition.stimuli.map(item=>item.startTimeSeconds))
      const faultTelemetry=samples.flatMap(item=>item.faultTelemetry?[item.faultTelemetry]:[])
      const interfaceTelemetry=samples.flatMap(item=>item.interfaceTelemetry?[item.interfaceTelemetry]:[])
      const fault=definition.faultInjection
      const run:VehicleScenarioRun={
        runId:this.scenario.runId!,definition:structuredClone(definition),status:'COMPLETED',phase:'RESULT',fixedTimestepSeconds:PHYSICS_TIMESTEP,samples,
        observedFunctionIds:[...new Set(samples.flatMap(item=>item.functionObservations.map(observation=>observation.functionId)))],
        events:{precondition:0,stimulusStart:firstStimulus,faultStart:fault?.activationStartSeconds,faultEnd:fault?.activationEndSeconds,observationStart:definition.observationWindow.startSeconds,end:definition.durationSeconds},
        faultTelemetry,interfaceTelemetry,interfaceComparison:summarizeInterfaceComparison(interfaceTelemetry),verdict:'OBSERVED',
        interpretation:fault
          ?'설정한 고장 주입이 실제 fixed-step 경로에 적용되었고 원본값·전달값·복구 상태와 차량 반응이 기록되었습니다. 이 관찰만으로 근본 원인을 확정하지 않습니다.'
          :'선택한 입력이 실제 차량 런타임에 적용되었고 지원되는 값들이 동일한 fixed-step 시간축으로 기록되었습니다.',
      }
      this.scenario={...this.scenario,status:'COMPLETED',phase:'RESULT',elapsedSeconds:definition.durationSeconds,samples,completedRun:run}
      this.publishScenario();this.publishNow()
    }else{
      this.scenario={...this.scenario,phase:sample.phase,elapsedSeconds:timeSeconds,samples}
      if(samples.length%6===0)this.publishScenario()
    }
  }

  attach(physics: VehiclePhysicsPort) {
    if (this.physics) throw new Error('Only one physics adapter may own the session')
    this.physics = physics
    physics.readState(this.vehicle)
    this.copyPreviousPose()
    this.publishNow()
    return () => {
      if (this.physics === physics) {
        this.physics = null
        this.accumulator = 0
      }
    }
  }
  start() {
    this.error = null
    this.raceFinished = false
    this.finishElapsed = 0
    this.resetLogicalState()
    this.accumulator = 0
    this.ticksSincePublish = 0
    this.skipResumeDelta = true
    this.physics?.reset()
    this.physics?.readState(this.vehicle)
    this.copyPreviousPose()
    this.clock.start()
    this.publishNow()
  }
  pause() {
    this.clock.pause()
    this.copyPreviousPose()
    this.accumulator = 0
    this.driverInput.resetMotion()
    this.publishNow()
  }
  resume() {
    if (!this.clock.running || !this.clock.paused || this.error) return
    this.driverInput.resetMotion()
    this.clock.resume()
    this.copyPreviousPose()
    this.accumulator = 0
    // The next render delta may include paused/hidden-tab wall time.
    this.skipResumeDelta = true
    this.publishNow()
  }
  togglePause() {
    if (this.clock.paused) this.resume()
    else this.pause()
  }
  reset() {
    this.clock.reset()
    this.error = null
    this.raceFinished = false
    this.finishElapsed = 0
    this.accumulator = 0
    this.ticksSincePublish = 0
    this.resetLogicalState()
    this.recoveryChallenge?.lock();if(this.recoveryChallenge)this.publishRecovery(this.recoveryChallenge.getSnapshot())
    this.physics?.reset()
    if (this.physics) this.physics.readState(this.vehicle)
    else Object.assign(this.vehicle, createVehicleState())
    this.copyPreviousPose()
    this.publishNow()
  }
  fail(message: string) {
    this.error = message
    this.pause()
  }
  isInvestigationLocked() { if(this.scenario.status==='RUNNING')return false;const phase=this.incident?.getSnapshot().phase;return phase === 'CAPTURED' || phase === 'SUBMITTED' }
  acceptsDrivingInput() { return this.clock.running && !this.clock.paused && !this.error && !this.isInvestigationLocked() }
  /** Render elapsed time is accumulated; only fixed-size physics steps are issued. */
  advance(frameDeltaSeconds: number) {
    if (!this.physics || !this.clock.running || this.clock.paused || this.error || this.isInvestigationLocked()) return
    if (!Number.isFinite(frameDeltaSeconds) || frameDeltaSeconds < 0) return
    if (this.skipResumeDelta) { this.skipResumeDelta = false; return }
    // Cap catch-up to 6 steps: do not fast-forward a suspended browser or spiral on a slow machine.
    this.accumulator += Math.min(frameDeltaSeconds, 0.1)
    while (this.accumulator + 1e-10 >= PHYSICS_TIMESTEP) {
      const tickTime=this.clock.currentTime
      this.applyVehicleScenario(tickTime)
      this.driverInput.advance(PHYSICS_TIMESTEP, this.calibration.keyboardPedalResponse)
      const input = this.driverInput.getState()
      const adasDemoEnabled=this.scenario.status==='RUNNING'&&(this.scenario.definition?.supportConditions?.adasDemoEnabled??false)
      this.adasOutput=this.adasExecution.step({lead:this.physics.readLeadVehicleState?.()??{available:false,relativeLongitudinalDistanceM:0,relativeLateralDistanceM:0,leadSpeedMps:0,closingSpeedMps:0,collisionActive:false},lane:this.readRouteLaneContext(),demoEnabled:adasDemoEnabled})
      const acceleratorDelivery=this.faultInjection.applyAccelerator(this.scenario.status==='RUNNING'?this.scenario.definition?.faultInjection:undefined,input.accelerator,tickTime)
      this.currentFaultTelemetry=acceleratorDelivery.telemetry
      const supportConditions=this.scenario.status==='RUNNING'?this.scenario.definition?.supportConditions:undefined
      const energyAvailability=supportConditions?.energy?.availability??'AVAILABLE'
      this.vehicleSupportOutput=this.vehicleSupportExecution.step({
        physicsAttached:this.physics!==null,
        hostRunAuthorized:this.clock.running&&!this.error,
        gearState:this.vehicle.gearState,
        confirmedFault:supportConditions?.confirmedFault??false,
        energyAvailable:energyAvailability==='AVAILABLE',
        energyValidity:energyAvailability==='INVALID'?'INVALID':'VALID',
        maxDriveTorqueCandidateNm:supportConditions?.energy?.maxDriveTorqueCandidateNm,
      })
      const swInput = {
        acceleratorPedalPosition: acceleratorDelivery.deliveredValue,
        acceleratorPedalValidity: input.acceleratorValidity,
        gearRequest: input.gearRequest,
        gearRequestValidity: input.gearRequestValidity,
        vehicleReady: this.vehicleSupportOutput.vehicleReady && (this.readyGate?.() ?? true),
        propulsionEnable: this.vehicleSupportOutput.propulsionPermission && (this.readyGate?.() ?? true),
        longitudinalVelocity: this.vehicle.longitudinalVelocity,
        vehicleSpeed: this.vehicle.speed,
      }
      let swOutput
      if (this.incident&&this.scenario.status!=='RUNNING') this.vehicleSw.setCaseVariant?.(this.incident.beforeStep(swInput, input.brake, input.steering, PHYSICS_TIMESTEP))
      else if(this.scenario.status==='RUNNING')this.vehicleSw.setCaseVariant?.(this.incident?.vehicleScenarioVariant()??0)
      try { swOutput = this.vehicleSw.step(swInput) }
      catch (error) { this.fail(error instanceof Error ? error.message : 'Vehicle SW failed'); return }
      this.swSnapshot = {
        source: this.vehicleSw.source, step: ++this.executionStep,
        executionTime: (this.executionStep - 1) * PHYSICS_TIMESTEP, periodSeconds: PHYSICS_TIMESTEP,
        input: swInput, output: swOutput,
        calibrationReference: this.vehicleSw.calibrationReference ?? 'TRACKBACK_SIMULATION_CALIBRATION_V0_1', calibration: calibrationSlots(this.calibration),
      }
      this.platformExecutionOutput=this.platformExecution.step({releaseIndex:this.executionStep,scheduledTimeSeconds:this.swSnapshot.executionTime,actualTimeSeconds:tickTime,periodSeconds:PHYSICS_TIMESTEP,completed:true})
      this.gearReactionOutput=this.gearReactionExecution.step({requestedGear:input.gearRequest,actualGear:swOutput.gearState,requestValidity:input.gearRequestValidity,stateValidity:swOutput.gearStateValidity,transitionAccepted:swOutput.transitionAccepted})
      this.vehicle.gearState = swOutput.gearState
      this.propulsionState = swOutput.propulsionState
      this.propulsionRequest = swOutput.propulsionRequest
      this.driveTorqueRequest = swOutput.driveTorqueRequest
      this.eDriveCommand = swOutput.eDriveCommand
      this.communicationExecutionOutput=this.communicationExecution.step(this.eDriveCommand,tickTime)
      const eDriveDelivery=this.faultInjection.applyEDriveCommand(this.scenario.status==='RUNNING'?this.scenario.definition?.faultInjection:undefined,this.communicationExecutionOutput.deliveredValue,tickTime)
      if(eDriveDelivery.telemetry)this.currentFaultTelemetry=eDriveDelivery.telemetry
      this.currentInterfaceTelemetry=this.scenario.status==='RUNNING'?eDriveDelivery.endpointTelemetry:undefined
      this.faultManagementOutput=this.faultManagementExecution.step({
        injectedFaultActive:this.currentFaultTelemetry?.active??false,
        interfaceComparison:this.currentInterfaceTelemetry?.comparisonStatus??'UNAVAILABLE',
        recoveryObserved:this.currentFaultTelemetry?.recoveryState==='RESTORED',
      })
      this.propulsionSupervisionOutput=this.propulsionSupervisionExecution.step({propulsionRequest:this.propulsionRequest,driveTorqueRequest:this.driveTorqueRequest,eDriveCommand:this.eDriveCommand,fault:this.faultManagementOutput})
      writeEDrivePhysicsCommand(eDriveDelivery.deliveredValue, this.calibration.torqueToForce.value, input.brake > 0, this.command)
      this.command.driveForce*=this.adasOutput.acc.driveScale
      const effectiveBrakeRequest=Math.max(input.brake,this.adasOutput.aeb.brakeOverride)
      const effectiveSteeringRequest=Math.max(-1,Math.min(1,input.steering+this.adasOutput.lka.steeringCorrection))
      const brakeOutput=this.brakeExecution.step({driverBrakeRequest:effectiveBrakeRequest,validity:'VALID'})
      const steeringOutput=this.steeringExecution.step({driverSteeringRequest:effectiveSteeringRequest,vehicleSpeedMps:this.vehicle.speed,validity:'VALID'})
      this.command.brakeForce=brakeOutput.brakeForceN
      this.command.steering=steeringOutput.frontWheelAngleRad
      const previousWheelDynamics=this.physics.readWheelDynamicsState?.()??[]
      const previousContactWheels=previousWheelDynamics.filter(item=>item.inContact)
      const slipDenominator=Math.max(1,Math.abs(this.vehicle.longitudinalVelocity))
      const maxLongitudinalSlipEstimate=previousContactWheels.length?Math.max(...previousContactWheels.map(item=>Math.abs(Math.abs(item.wheelLinearSpeedMps)-Math.abs(this.vehicle.longitudinalVelocity))/slipDenominator)):0
      this.stabilityOutput=this.stabilityExecution.step({speedMps:this.vehicle.speed,maxLongitudinalSlipEstimate,brakeRequest:input.brake,driveRequest:this.propulsionRequest.magnitude,frontWheelAngleRad:this.command.steering,yawRateRadPerSecond:this.vehicle.angularVelocity.y,interventionEnabled:this.scenario.status==='RUNNING'&&(this.scenario.definition?.supportConditions?.stabilityInterventionEnabled??false)})
      this.command.driveForce*=this.stabilityOutput.coordination.driveScale
      this.command.brakeForce*=this.stabilityOutput.coordination.brakeScale
      if (this.raceFinished) {
        this.finishElapsed += PHYSICS_TIMESTEP
        this.command.driveForce = 0
        this.command.brakeForce = Math.min(4200, Math.max(0, this.finishElapsed - 0.75) * 1500)
      }
      this.copyPreviousPose()
      const trainingCeiling=this.teachingTorqueCeiling?.()
      if(trainingCeiling!==undefined){const cap=Number.isFinite(trainingCeiling)?Math.max(0,Math.min(180,trainingCeiling)):0;this.command.driveForce=Math.sign(this.command.driveForce)*Math.min(Math.abs(this.command.driveForce),cap*this.calibration.torqueToForce.value)}
      this.physics.step(this.command, PHYSICS_TIMESTEP)
      // Keep post-finish coast/braking physical, but freeze the official race time at the crossing tick.
      if (!this.raceFinished) this.clock.step()
      this.physics.readState(this.vehicle)
      const collisionObservation=this.physics.readCollisionState?.()??{active:false,contactPairCount:0,contactPointCount:0,maximumNormalImpulseNs:0}
      this.occupantProtectionOutput=this.occupantProtectionExecution.step(collisionObservation,this.scenario.status==='RUNNING'&&(this.scenario.definition?.supportConditions?.occupantDemoEnabled??false))
      const drivingEventResult=this.drivingEvent.step(this.physics.readLeadVehicleState?.()??{available:false,relativeLongitudinalDistanceM:0,relativeLateralDistanceM:0,leadSpeedMps:0,closingSpeedMps:0,collisionActive:false})
      if(drivingEventResult.applyPenaltySeconds>0)this.recoveryChallenge?.addPenalty(drivingEventResult.applyPenaltySeconds)
      if(drivingEventResult.removeActor)this.physics.setScenarioLeadVehicle?.(null)
      if (this.resetAccelerationOnNextState) {
        this.vehicle.longitudinalAcceleration = 0
        this.resetAccelerationOnNextState = false
      } else {
        this.vehicle.longitudinalAcceleration = (this.vehicle.longitudinalVelocity - this.previousLongitudinalVelocity) / PHYSICS_TIMESTEP
      }
      this.previousLongitudinalVelocity = this.vehicle.longitudinalVelocity
      this.observationQualityOutput=this.observationQualityExecution.step({
        physicsAttached:this.physics!==null,
        values:[this.vehicle.speed,this.vehicle.longitudinalVelocity,this.vehicle.longitudinalAcceleration,this.command.driveForce,this.command.brakeForce,this.command.steering],
        driverInputValid:input.acceleratorValidity==='VALID'&&input.gearRequestValidity==='VALID',
      })
      this.brakingDomainOutput=this.chassisDomainExecution.braking({driverBrakeRequest:effectiveBrakeRequest,validity:'VALID',execution:brakeOutput,longitudinalAccelerationMps2:this.vehicle.longitudinalAcceleration,coordinationSource:this.adasOutput.aeb.brakeOverride>0?'DRIVER_PLUS_TRACKBACK_AEB':'DRIVER_ONLY'})
      this.steeringDomainOutput=this.chassisDomainExecution.steering({validity:'VALID',execution:steeringOutput,vehicleSpeedMps:this.vehicle.speed,coordinationSource:this.adasOutput.lka.steeringCorrection!==0?'DRIVER_PLUS_TRACKBACK_LKA':'DRIVER_ONLY'})
      this.motionCoordinationOutput=this.motionCoordinationExecution.step({propulsionRequest:this.propulsionRequest.magnitude,brakeRequest:effectiveBrakeRequest,steeringRequest:effectiveSteeringRequest,driveForceN:this.command.driveForce,brakeForceN:this.command.brakeForce,frontWheelAngleRad:this.command.steering,longitudinalAccelerationMps2:this.vehicle.longitudinalAcceleration,authority:adasDemoEnabled?'DRIVER_PLUS_TRACKBACK_ADAS':'DRIVER_ONLY'})
      // Captured incidents lock movement until repair verification.
      if(this.scenario.status!=='RUNNING')this.incident?.afterStep(this.swSnapshot, this.vehicle, this.command, input.brake, input.steering)
      else this.recordVehicleScenarioSample(this.clock.currentTime)
      if (this.isInvestigationLocked()) { this.copyPreviousPose(); this.accumulator = 0; this.driverInput.resetMotion(); this.publishNow(); return }
      if (!this.raceFinished && this.outsideRoute()) { this.fail('주행 경로를 벗어났습니다. 레이스를 다시 시작해 주세요.'); return }
      if(!this.raceFinished&&this.recoveryChallenge?.getSnapshot().status==='RUNNING'){
        const result=this.recoveryChallenge.advance(PHYSICS_TIMESTEP,this.vehicle.position)
        this.publishRecovery(this.recoveryChallenge.getSnapshot())
        if(result.finished){this.raceFinished=true;this.finishElapsed=0;this.publishNow()}
      }
      if (!this.raceFinished && !this.recoveryChallenge && this.finish) {
        const dx = this.vehicle.position.x - this.finish.x; const dz = this.vehicle.position.z - this.finish.z
        const forward = dx * Math.sin(this.finish.heading) + dz * Math.cos(this.finish.heading)
        const lateral = Math.abs(dx * Math.cos(this.finish.heading) - dz * Math.sin(this.finish.heading))
        if (forward >= 0 && forward < 12 && lateral < 8) { this.raceFinished = true; this.finishElapsed = 0; this.publishNow() }
      }
      this.accumulator = Math.max(0, this.accumulator - PHYSICS_TIMESTEP)
      if (++this.ticksSincePublish === 6) {
        this.ticksSincePublish = 0
        this.publishNow()
      }
    }
  }
  private publishNow() {
    const input = this.driverInput.getState()
    this.publish({
      vehicleSw: this.swSnapshot ? structuredClone(this.swSnapshot) : null,
      physicsCommand:{driveForceN:this.command.driveForce,brakeForceN:this.command.brakeForce,frontWheelAngleRad:this.command.steering},
      ...(this.teachingTorqueCeiling?{appliedDriveForceN:this.command.driveForce}:{}),
      kind: 'LIVE_SIMULATION', speedKmh: this.vehicle.speed * 3.6,
      simulationTime: this.clock.currentTime,
      accelerator: input.accelerator, acceleratorValidity: input.acceleratorValidity, brake: input.brake, steering: input.steering,
      gear: this.vehicle.gearState, gearRequest: input.gearRequest, gearStateValidity: this.swSnapshot?.output.gearStateValidity ?? 'VALID',
      transitionAccepted: this.swSnapshot?.output.transitionAccepted ?? true,
      propulsionState: this.propulsionState, propulsionRequest: { ...this.propulsionRequest },
      driveTorqueRequest: { ...this.driveTorqueRequest }, eDriveCommand: { ...this.eDriveCommand },
      longitudinalVelocity: this.vehicle.longitudinalVelocity,
      longitudinalAcceleration: this.vehicle.longitudinalAcceleration,
      vehicleReady: this.readyGate ? (this.swSnapshot?.input.vehicleReady ?? false) : this.physics !== null,
      propulsionEnable: this.readyGate ? (this.swSnapshot?.input.propulsionEnable ?? false) : this.clock.running && !this.error,
      status: this.error ? 'error' : !this.clock.running ? 'idle' : this.clock.paused ? 'paused' : !this.physics ? 'loading' : 'running',
      error: this.error,
      raceFinished: this.raceFinished,
      drivingEvent:this.drivingEvent.getSnapshot(),
    })
  }
}

