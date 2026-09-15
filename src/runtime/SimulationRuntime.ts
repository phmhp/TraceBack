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
import { GearLogic } from './gear/GearLogic.ts'
import { evaluatePropulsion } from './propulsion/PropulsionFunction.ts'
import { createDriveTorqueRequest } from './vmc/PropulsionVmc.ts'
import { createEDriveCommand } from './edrive/EDrive.ts'

export interface SimulationPropulsionCalibration {
  keyboardPedalResponse: {
    acceleratorRisePerSecond: number
    acceleratorFallPerSecond: number
    brakeRisePerSecond: number
    brakeFallPerSecond: number
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
  private readonly gearLogic = new GearLogic()
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
  private raceFinished = false
  private finishElapsed = 0
  private sessionConfig: SessionConfig | null = null
  private readonly calibration: Readonly<SimulationPropulsionCalibration>

  constructor(
    calibration: Readonly<SimulationPropulsionCalibration>,
    publish: (telemetry: RaceTelemetry) => void = () => {},
    driverInput = new DriverInputRuntime(),
  ) {
    this.calibration = calibration
    this.publish = publish
    this.driverInput = driverInput
  }

  readonly readVehicleState: VehicleStateReader = () => this.vehicle
  readonly readPreviousPose: VehiclePoseReader = () => this.previousPose
  readonly readInterpolationAlpha = () => !this.clock.running || this.clock.paused ? 1 : Math.min(1, this.accumulator / PHYSICS_TIMESTEP)
  configureFinish(point: { x: number; z: number }, heading: number) { this.finish = { x: point.x, z: point.z, heading } }
  configureSession(config: SessionConfig) { this.sessionConfig = { ...config } }
  readSessionConfig() { return this.sessionConfig ? { ...this.sessionConfig } : null }
  private copyPreviousPose() {
    Object.assign(this.previousPose.position, this.vehicle.position)
    Object.assign(this.previousPose.rotation, this.vehicle.rotation)
  }
  private resetLogicalState() {
    this.driverInput.reset()
    this.gearLogic.reset()
    this.vehicle.gearState = 'D'
    this.vehicle.longitudinalAcceleration = 0
    this.previousLongitudinalVelocity = 0
    this.resetAccelerationOnNextState = true
    this.propulsionState = 'PROP_DISABLED'
    this.propulsionRequest = { magnitude: 0, direction: 'NONE', validity: 'VALID' }
    this.driveTorqueRequest = { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
    this.eDriveCommand = { magnitudeNm: 0, direction: 'NONE', validity: 'VALID' }
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
  acceptsDrivingInput() { return this.clock.running && !this.clock.paused && !this.error }
  /** Render elapsed time is accumulated; only fixed-size physics steps are issued. */
  advance(frameDeltaSeconds: number) {
    if (!this.physics || !this.clock.running || this.clock.paused || this.error) return
    if (!Number.isFinite(frameDeltaSeconds) || frameDeltaSeconds < 0) return
    if (this.skipResumeDelta) { this.skipResumeDelta = false; return }
    // Cap catch-up to 6 steps: do not fast-forward a suspended browser or spiral on a slow machine.
    this.accumulator += Math.min(frameDeltaSeconds, 0.1)
    while (this.accumulator + 1e-10 >= PHYSICS_TIMESTEP) {
      this.driverInput.advance(PHYSICS_TIMESTEP, this.calibration.keyboardPedalResponse)
      const input = this.driverInput.getState()
      const gear = this.gearLogic.update(input.gearRequest, input.gearRequestValidity, this.vehicle.longitudinalVelocity,
        this.calibration.gearDirectionChangeMaxSpeedMps.value)
      this.vehicle.gearState = gear.gearState
      const propulsion = evaluatePropulsion({
        acceleratorPedalPosition: input.accelerator,
        acceleratorPedalValidity: input.acceleratorValidity,
        gearState: gear.gearState,
        gearStateValidity: gear.gearStateValidity,
        vehicleReady: this.physics !== null,
        propulsionEnable: true,
      })
      this.propulsionState = propulsion.state
      this.propulsionRequest = propulsion.request
      this.driveTorqueRequest = createDriveTorqueRequest(propulsion.request, this.vehicle.speed,
        this.calibration.vmcForwardTorqueMap, this.calibration.vmcReverseTorqueMap)
      this.eDriveCommand = createEDriveCommand(this.driveTorqueRequest,
        this.calibration.maxForwardTorqueNm.value, this.calibration.maxReverseTorqueNm.value)
      writeEDrivePhysicsCommand(this.eDriveCommand, this.calibration.torqueToForce.value, input.brake > 0, this.command)
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
      if (!this.raceFinished && this.finish) {
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
      kind: 'LIVE_SIMULATION', speedKmh: this.vehicle.speed * 3.6,
      simulationTime: this.clock.currentTime,
      accelerator: input.accelerator, acceleratorValidity: input.acceleratorValidity, brake: input.brake, steering: input.steering,
      gear: this.vehicle.gearState, gearRequest: input.gearRequest, gearStateValidity: this.gearLogic.readState().gearStateValidity,
      transitionAccepted: this.gearLogic.readState().transitionAccepted,
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

