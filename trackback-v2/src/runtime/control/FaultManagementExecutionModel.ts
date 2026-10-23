import type { InterfaceComparisonStatus } from '../scenario/FaultInjection.ts'

export type TrackbackFaultLifecycleState = 'CLEAR'|'OBSERVED'|'CONFIRMED'|'RECOVERED'

export interface FaultManagementExecutionInput {
  injectedFaultActive:boolean
  interfaceComparison:InterfaceComparisonStatus
  recoveryObserved:boolean
}

export interface FaultManagementExecutionOutput {
  lifecycleState:TrackbackFaultLifecycleState
  detection:'NO_FAULT_EVIDENCE'|'FAULT_EVIDENCE_OBSERVED'
  confirmed:boolean
  diagnosticEvent:'NONE'|'TRACKBACK_FAULT_CONFIRMED'|'TRACKBACK_FAULT_RECOVERED'
  reactionRequest:'NONE'|'PROPULSION_INHIBIT_REQUESTED'
  recovery:'NOT_REQUIRED'|'WAITING_FOR_RESTORE'|'RESTORED'
}

/**
 * TRACKBACK_EXECUTION_MODEL / SIMULATION_ASSUMPTION.
 *
 * Converts the existing fault-injection and endpoint-comparison telemetry into
 * a repeatable educational fault lifecycle. This is not an OEM diagnostic
 * manager, production DTC algorithm, or safety reaction specification.
 */
export class FaultManagementExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  private consecutiveEvidenceTicks=0
  private wasConfirmed=false

  reset(){this.consecutiveEvidenceTicks=0;this.wasConfirmed=false}

  step(input:Readonly<FaultManagementExecutionInput>):FaultManagementExecutionOutput {
    const evidence=input.injectedFaultActive||input.interfaceComparison==='MISMATCH'
    this.consecutiveEvidenceTicks=evidence?this.consecutiveEvidenceTicks+1:0
    const confirmed=this.consecutiveEvidenceTicks>=2
    const recovered=input.recoveryObserved&&this.wasConfirmed&&!evidence
    const lifecycleState:TrackbackFaultLifecycleState=recovered?'RECOVERED':confirmed?'CONFIRMED':evidence?'OBSERVED':'CLEAR'
    const output:FaultManagementExecutionOutput={
      lifecycleState,
      detection:evidence?'FAULT_EVIDENCE_OBSERVED':'NO_FAULT_EVIDENCE',
      confirmed,
      diagnosticEvent:recovered?'TRACKBACK_FAULT_RECOVERED':confirmed&&!this.wasConfirmed?'TRACKBACK_FAULT_CONFIRMED':'NONE',
      reactionRequest:confirmed?'PROPULSION_INHIBIT_REQUESTED':'NONE',
      recovery:recovered?'RESTORED':this.wasConfirmed||confirmed?'WAITING_FOR_RESTORE':'NOT_REQUIRED',
    }
    this.wasConfirmed=confirmed&&!recovered
    return output
  }
}
