import type { Gear } from '../../domain/driver/DriverInputTypes.ts'
import type { Validity } from '../../domain/propulsion/PropulsionTypes.ts'

export type TrackbackVehicleMode = 'NOT_READY'|'READY'|'DRIVE'|'DEGRADED'
export type TrackbackEnergyStatus = 'AVAILABLE'|'LIMIT_CANDIDATE'|'UNAVAILABLE'|'INVALID'

export interface VehicleSupportExecutionInput {
  physicsAttached:boolean
  hostRunAuthorized:boolean
  gearState:Gear
  confirmedFault:boolean
  energyAvailable:boolean
  energyValidity:Validity
  /** Scenario constraint candidate only. Allocation into the propulsion command is intentionally OPEN. */
  maxDriveTorqueCandidateNm?:number
}

export interface VehicleSupportExecutionOutput {
  vehicleMode:TrackbackVehicleMode
  vehicleReady:boolean
  propulsionPermission:boolean
  degradedAvailability:boolean
  energyStatus:TrackbackEnergyStatus
  drivePowerAvailable:boolean
  maxDriveTorqueCandidateNm?:number
  reason:'HOST_NOT_READY'|'FAULT_CONFIRMED'|'ENERGY_INVALID'|'ENERGY_UNAVAILABLE'|'LIMIT_CANDIDATE_PRESENT'|'AVAILABLE'
}

/**
 * TRACKBACK_EXECUTION_MODEL / SIMULATION_ASSUMPTION.
 *
 * This model makes the pre-existing host readiness/enable assumptions explicit
 * and gives vehicle scenarios an honest energy-availability condition. It is not
 * a Genesis GV70 Vehicle State Manager, BMS, HV controller, or torque allocator.
 * A numeric energy limit is only published as a constraint candidate because its
 * owner and application point remain OPEN in the canonical reference design.
 */
export class VehicleSupportExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const

  reset(){}

  step(input:Readonly<VehicleSupportExecutionInput>):VehicleSupportExecutionOutput {
    if(input.energyValidity!=='VALID'&&input.energyValidity!=='INVALID')throw new Error('Energy validity contract violated')
    if(input.maxDriveTorqueCandidateNm!==undefined&&(!Number.isFinite(input.maxDriveTorqueCandidateNm)||input.maxDriveTorqueCandidateNm<0))throw new Error('Energy torque-limit candidate must be finite and non-negative')
    const vehicleReady=input.physicsAttached&&input.hostRunAuthorized
    const energyStatus:TrackbackEnergyStatus=input.energyValidity==='INVALID'?'INVALID':!input.energyAvailable?'UNAVAILABLE':input.maxDriveTorqueCandidateNm!==undefined?'LIMIT_CANDIDATE':'AVAILABLE'
    const propulsionPermission=vehicleReady&&!input.confirmedFault&&energyStatus!=='INVALID'&&energyStatus!=='UNAVAILABLE'
    const degradedAvailability=vehicleReady&&(input.confirmedFault||energyStatus==='INVALID'||energyStatus==='UNAVAILABLE')
    const vehicleMode:TrackbackVehicleMode=!vehicleReady?'NOT_READY':degradedAvailability?'DEGRADED':input.gearState==='D'||input.gearState==='R'?'DRIVE':'READY'
    const reason:VehicleSupportExecutionOutput['reason']=!vehicleReady?'HOST_NOT_READY':input.confirmedFault?'FAULT_CONFIRMED':energyStatus==='INVALID'?'ENERGY_INVALID':energyStatus==='UNAVAILABLE'?'ENERGY_UNAVAILABLE':energyStatus==='LIMIT_CANDIDATE'?'LIMIT_CANDIDATE_PRESENT':'AVAILABLE'
    return {vehicleMode,vehicleReady,propulsionPermission,degradedAvailability,energyStatus,drivePowerAvailable:energyStatus==='AVAILABLE'||energyStatus==='LIMIT_CANDIDATE',maxDriveTorqueCandidateNm:input.maxDriveTorqueCandidateNm,reason}
  }
}
