import type { CollisionObservation } from '../../domain/vehicle/VehiclePhysicsPort.ts'

export interface OccupantProtectionExecutionOutput {
  impactObservation:'NO_CONTACT'|'NON_GROUND_CONTACT_OBSERVED'
  contactPairCount:number
  maximumNormalImpulseNs:number
  decision:'DEMO_DISABLED'|'NO_DEPLOY'|'TRACKBACK_DEMO_DEPLOY_REQUESTED'
  deployCommand:'NONE'|'TRACKBACK_DEMO_RESTRAINT_COMMAND'
  physicalRestraintModel:'NOT_IMPLEMENTED'
}

/**
 * Collision-driven Trackback demonstration only. It does not model OEM crash
 * sensing, severity thresholds, airbags, pretensioners, or occupant injury.
 */
export class OccupantProtectionExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}
  step(collision:Readonly<CollisionObservation>,demoEnabled:boolean):OccupantProtectionExecutionOutput {
    const observed=collision.active&&collision.contactPairCount>0
    const decision:OccupantProtectionExecutionOutput['decision']=!demoEnabled?'DEMO_DISABLED':observed?'TRACKBACK_DEMO_DEPLOY_REQUESTED':'NO_DEPLOY'
    return {impactObservation:observed?'NON_GROUND_CONTACT_OBSERVED':'NO_CONTACT',contactPairCount:collision.contactPairCount,maximumNormalImpulseNs:collision.maximumNormalImpulseNs,decision,deployCommand:decision==='TRACKBACK_DEMO_DEPLOY_REQUESTED'?'TRACKBACK_DEMO_RESTRAINT_COMMAND':'NONE',physicalRestraintModel:'NOT_IMPLEMENTED'}
  }
}
