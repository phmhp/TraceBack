import type { EDriveCommand } from '../../domain/propulsion/PropulsionTypes.ts'

export interface CommunicationExecutionOutput {
  transport:'TRACKBACK_DIRECT_PORT_BUS'
  sequence:number
  sourceTimestampSeconds:number
  destinationTimestampSeconds:number
  ageSeconds:number
  freshness:'FRESH'|'STALE'
  sourceValue:EDriveCommand
  deliveredValue:EDriveCommand
}

/** Same-tick Trackback signal transport; not CAN-FD, Ethernet, or an OEM network stack. */
export class CommunicationExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  private sequence=0
  reset(){this.sequence=0}
  step(value:Readonly<EDriveCommand>,timestampSeconds:number):CommunicationExecutionOutput {
    const sourceValue=structuredClone(value),deliveredValue=structuredClone(value)
    return {transport:'TRACKBACK_DIRECT_PORT_BUS',sequence:++this.sequence,sourceTimestampSeconds:timestampSeconds,destinationTimestampSeconds:timestampSeconds,ageSeconds:0,freshness:'FRESH',sourceValue,deliveredValue}
  }
}
