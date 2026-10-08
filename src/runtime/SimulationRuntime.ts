import { PHYSICS_TIMESTEP, SimulationClock } from '../core/SimulationClock.ts'
import { createVehiclePose, createVehicleState } from '../domain/vehicle/VehicleState.ts'
import type { VehiclePoseReader, VehicleStateReader } from '../domain/vehicle/VehicleState.ts'
import type { VehiclePhysicsCommand, VehiclePhysicsPort } from '../domain/vehicle/VehiclePhysicsPort.ts'
import { writeTemporaryBrakeCommand, writeTemporarySteeringCommand } from './control/TemporaryBrakeSteeringAdapters.ts'
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
import type { VehicleScenarioDefinition, VehicleScenarioRun, VehicleScenarioSample, VehicleScenarioSnapshot } from './scenario/VehicleScenario.ts'
import { FaultInjectionRuntime, summarizeInterfaceComparison } from './scenario/FaultInjection.ts'
import type { FaultInjectionTelemetry, InterfaceEndpointTelemetry } from './scenario/FaultInjection.ts'
import type { RecoveryChallenge, RecoverySnapshot } from './gameplay/RecoveryChallenge.ts'

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
}
export const INITIAL_TELEMETRY: RaceTelemetry = {
  vehicleSw: null,
  kind: 'LIVE_SIMULATION', speedKmh: 0, simulationTime: 0,
  accelerator: 0, acceleratorValidity: 'VALID', brake: 0, steering: 0, gear: 'D', gearRequest: 'D', gearStateValidity: 'VALID', transitionAccepted: true,
  propulsionState: 'PROP_DISABLED', propulsionRequest: { magnitude: 0, direction: 'NONE', validity: 'VALID' },
  driveTorqueRequest: { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' },
  eDriveCommand: { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' },
  longitudinalVelocity: 0, longitudinalAcceleration: 0, vehicleReady: false, propulsionEnable: false,
  status: 'idle', error: null, raceFinished: false,
}

/** Single fixed-step owner. No React, browser events, Rapier objects or SW task scheduler. */
export class SimulationRuntime {
  readonly clock = new SimulationClock()
  readonly driverInput: DriverInputRuntime
  private readonly vehicle = createVehicleState()
  private readonly previousPose = createVehiclePose()
  private readonly command: VehiclePhysicsCommand = { driveForce: 0, brakeForce: 0, steering: 0 }
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
  readonly readInterpolationAlpha = () => !this.clock.running || this.clock.paused ? 1 : Math.min(1, this.accumulator / PHYSICS_TIMESTEP)
  configureFinish(point: { x: number; z: number }, heading: number) { this.finish = { x: point.x, z: point.z, heading } }
  configureRecoveryChallenge(challenge:RecoveryChallenge,publish:(snapshot:RecoverySnapshot)=>void){this.recoveryChallenge=challenge;this.publishRecovery=publish;publish(challenge.getSnapshot())}
  unlockRecoveryChallenge(){this.recoveryChallenge?.unlock();if(this.recoveryChallenge)this.publishRecovery(this.recoveryChallenge.getSnapshot())}
  startRecoveryChallenge(){if(!this.recoveryChallenge)throw new Error('Recovery challenge is not configured');this.raceFinished=false;this.finishElapsed=0;this.recoveryChallenge.start();this.publishRecovery(this.recoveryChallenge.getSnapshot())}
  retryRecoveryChallenge(){if(!this.recoveryChallenge)throw new Error('Recovery challenge is not configured');this.clock.pause();this.driverInput.reset();this.vehicleSw.reset();this.physics?.reset();if(this.physics)this.physics.readState(this.vehicle);this.copyPreviousPose();this.accumulator=0;this.skipResumeDelta=true;this.raceFinished=false;this.finishElapsed=0;this.error=null;this.recoveryChallenge.retry();this.clock.resume();this.publishRecovery(this.recoveryChallenge.getSnapshot());this.publishNow()}
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
    const available:Record<string,number|string>={
      accelerator:input.accelerator,brake:input.brake,steering:input.steering,gearState:this.vehicle.gearState,
      propulsionRequest:this.propulsionRequest.magnitude,driveTorqueRequest:this.driveTorqueRequest.magnitudeNm,eDriveCommand:this.eDriveCommand.magnitudeNm,
      driveForce:this.command.driveForce,brakeForce:this.command.brakeForce,speedKmh:this.vehicle.speed*3.6,longitudinalVelocity:this.vehicle.longitudinalVelocity,
      longitudinalAcceleration:this.vehicle.longitudinalAcceleration,positionX:this.vehicle.position.x,positionZ:this.vehicle.position.z,
    }
    const sample:VehicleScenarioSample={
      timeSeconds,phase:scenarioPhaseAt(definition,timeSeconds),values:Object.fromEntries(definition.monitors.map(id=>[id,available[id]!])),
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
  isInvestigationLocked() { if(this.scenario.status==='RUNNING')return false;const phase = this.incident?.getSnapshot().phase; return phase === 'CAPTURED' || phase === 'SUBMITTED' }
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
      const acceleratorDelivery=this.faultInjection.applyAccelerator(this.scenario.status==='RUNNING'?this.scenario.definition?.faultInjection:undefined,input.accelerator,tickTime)
      this.currentFaultTelemetry=acceleratorDelivery.telemetry
      const swInput = {
        acceleratorPedalPosition: acceleratorDelivery.deliveredValue,
        acceleratorPedalValidity: input.acceleratorValidity,
        gearRequest: input.gearRequest,
        gearRequestValidity: input.gearRequestValidity,
        vehicleReady: this.physics !== null,
        propulsionEnable: true,
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
        calibrationReference: 'TRACKBACK_SIMULATION_CALIBRATION_V0_1', calibration: calibrationSlots(this.calibration),
      }
      this.vehicle.gearState = swOutput.gearState
      this.propulsionState = swOutput.propulsionState
      this.propulsionRequest = swOutput.propulsionRequest
      this.driveTorqueRequest = swOutput.driveTorqueRequest
      this.eDriveCommand = swOutput.eDriveCommand
      const eDriveDelivery=this.faultInjection.applyEDriveCommand(this.scenario.status==='RUNNING'?this.scenario.definition?.faultInjection:undefined,this.eDriveCommand,tickTime)
      if(eDriveDelivery.telemetry)this.currentFaultTelemetry=eDriveDelivery.telemetry
      this.currentInterfaceTelemetry=this.scenario.status==='RUNNING'?eDriveDelivery.endpointTelemetry:undefined
      writeEDrivePhysicsCommand(eDriveDelivery.deliveredValue, this.calibration.torqueToForce.value, input.brake > 0, this.command)
      writeTemporaryBrakeCommand(input, this.command)
      writeTemporarySteeringCommand(input, this.vehicle.speed, this.command)
      if (this.raceFinished) {
        this.finishElapsed += PHYSICS_TIMESTEP
        this.command.driveForce = 0
        this.command.brakeForce = Math.min(4200, Math.max(0, this.finishElapsed - 0.75) * 1500)
      }
      this.copyPreviousPose()
      this.physics.step(this.command, PHYSICS_TIMESTEP)
      // Keep post-finish coast/braking physical, but freeze the official race time at the crossing tick.
      if (!this.raceFinished) this.clock.step()
      this.physics.readState(this.vehicle)
      if (this.resetAccelerationOnNextState) {
        this.vehicle.longitudinalAcceleration = 0
        this.resetAccelerationOnNextState = false
      } else {
        this.vehicle.longitudinalAcceleration = (this.vehicle.longitudinalVelocity - this.previousLongitudinalVelocity) / PHYSICS_TIMESTEP
      }
      this.previousLongitudinalVelocity = this.vehicle.longitudinalVelocity
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
      kind: 'LIVE_SIMULATION', speedKmh: this.vehicle.speed * 3.6,
      simulationTime: this.clock.currentTime,
      accelerator: input.accelerator, acceleratorValidity: input.acceleratorValidity, brake: input.brake, steering: input.steering,
      gear: this.vehicle.gearState, gearRequest: input.gearRequest, gearStateValidity: this.swSnapshot?.output.gearStateValidity ?? 'VALID',
      transitionAccepted: this.swSnapshot?.output.transitionAccepted ?? true,
      propulsionState: this.propulsionState, propulsionRequest: { ...this.propulsionRequest },
      driveTorqueRequest: { ...this.driveTorqueRequest }, eDriveCommand: { ...this.eDriveCommand },
      longitudinalVelocity: this.vehicle.longitudinalVelocity,
      longitudinalAcceleration: this.vehicle.longitudinalAcceleration,
      vehicleReady: this.physics !== null, propulsionEnable: this.clock.running && !this.error,
      status: this.error ? 'error' : !this.clock.running ? 'idle' : this.clock.paused ? 'paused' : !this.physics ? 'loading' : 'running',
      error: this.error,
      raceFinished: this.raceFinished,
    })
  }
}

