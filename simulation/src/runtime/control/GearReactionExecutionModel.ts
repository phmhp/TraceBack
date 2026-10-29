import type { Gear } from '../../domain/driver/DriverInputTypes.ts'
import type { Validity } from '../../domain/propulsion/PropulsionTypes.ts'

export interface GearReactionExecutionInput {
  requestedGear:Gear
  actualGear:Gear
  requestValidity:Validity
  stateValidity:Validity
  transitionAccepted:boolean
}

export interface GearReactionExecutionOutput {
  reaction:'NONE'|'INVALID_REQUEST_REPORTED'|'TRANSITION_REJECTED_RETAIN_STATE'|'STATE_INVALID_REPORTED'
  retainedGear:Gear
  driverNoticeRequired:boolean
}

/** TRACKBACK execution classification of the existing C Gear result; not an OEM transmission diagnostic. */
export class GearReactionExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}
  step(input:Readonly<GearReactionExecutionInput>):GearReactionExecutionOutput {
    const reaction:GearReactionExecutionOutput['reaction']=input.requestValidity==='INVALID'?'INVALID_REQUEST_REPORTED':input.stateValidity==='INVALID'?'STATE_INVALID_REPORTED':!input.transitionAccepted?'TRANSITION_REJECTED_RETAIN_STATE':'NONE'
    return {reaction,retainedGear:input.actualGear,driverNoticeRequired:reaction!=='NONE'}
  }
}
