import type { FaultManagementExecutionOutput } from './FaultManagementExecutionModel.ts'
import type { DriveTorqueRequest, EDriveCommand, PropulsionRequest } from '../../domain/propulsion/PropulsionTypes.ts'

export interface PropulsionSupervisionExecutionOutput {
  monitorStatus:'OBSERVED_ONLY'
  propulsionRequest:number
  driveTorqueRequestNm:number
  eDriveCommandNm:number
  validityChain:'VALID'|'INVALID'
  reaction:'NONE'|'INHIBIT_REQUESTED'
  reactionApplication:'NOT_APPLIED_SAFETY_POLICY_OPEN'
  recovery:'NOT_REQUIRED'|'WAITING_FOR_RESTORE'|'RESTORED'
}

/** Narrow Trackback propulsion supervision; no approved diagnostic deviation oracle or OEM safety reaction. */
export class PropulsionSupervisionExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}
  step(input:{propulsionRequest:Readonly<PropulsionRequest>;driveTorqueRequest:Readonly<DriveTorqueRequest>;eDriveCommand:Readonly<EDriveCommand>;fault:Readonly<FaultManagementExecutionOutput>}):PropulsionSupervisionExecutionOutput {
    const validityChain=input.propulsionRequest.validity==='VALID'&&input.driveTorqueRequest.validity==='VALID'&&input.eDriveCommand.validity==='VALID'?'VALID':'INVALID'
    return {monitorStatus:'OBSERVED_ONLY',propulsionRequest:input.propulsionRequest.magnitude,driveTorqueRequestNm:input.driveTorqueRequest.magnitudeNm,eDriveCommandNm:input.eDriveCommand.magnitudeNm,validityChain,reaction:input.fault.reactionRequest==='PROPULSION_INHIBIT_REQUESTED'?'INHIBIT_REQUESTED':'NONE',reactionApplication:'NOT_APPLIED_SAFETY_POLICY_OPEN',recovery:input.fault.recovery}
  }
}
