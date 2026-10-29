import type { LeadVehicleObservation } from '../../domain/vehicle/VehiclePhysicsPort.ts'

export const TRACKBACK_ADAS_CALIBRATION_V0_1={
  provenance:'SIMULATION_ASSUMPTION',authority:'TRACKBACK_EXECUTION_MODEL',status:'REVIEW_REQUIRED',
  desiredGapM:12,aebTtcSeconds:1.5,accCloseGapDriveScale:.3,laneOffsetThresholdM:.3,headingErrorThresholdRad:.1,lkaOffsetGain:.18,lkaHeadingGain:.35,lkaMaxCorrection:.35,
} as const

export interface AdasExecutionOutput {
  common:{demoEnabled:boolean;longitudinalPerceptionAvailable:boolean;lanePerceptionAvailable:boolean}
  acc:{status:'UNAVAILABLE'|'MONITORING'|'ACTIVE';driveScale:number;distanceM?:number}
  aeb:{status:'UNAVAILABLE'|'MONITORING'|'INTERVENING';ttcSeconds?:number;brakeOverride:number}
  lka:{status:'UNAVAILABLE'|'MONITORING'|'ACTIVE';laneOffsetM?:number;headingErrorRad?:number;steeringCorrection:number}
}

/** Deterministic Trackback ADAS demonstration over scenario actor/route truth; not OEM ACC/AEB/LKA. */
export class AdasExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}
  step(input:{lead:Readonly<LeadVehicleObservation>;lane:{available:boolean;offsetM:number;headingErrorRad:number};demoEnabled:boolean}):AdasExecutionOutput {
    const c=TRACKBACK_ADAS_CALIBRATION_V0_1,leadAvailable=input.lead.available&&input.lead.relativeLongitudinalDistanceM>0
    const closeGap=leadAvailable&&input.lead.relativeLongitudinalDistanceM<c.desiredGapM
    const ttc=leadAvailable&&input.lead.closingSpeedMps>0?input.lead.relativeLongitudinalDistanceM/input.lead.closingSpeedMps:undefined
    const aebRisk=ttc!==undefined&&ttc>=0&&ttc<c.aebTtcSeconds
    const laneCorrection=input.lane.available?Math.max(-c.lkaMaxCorrection,Math.min(c.lkaMaxCorrection,-input.lane.offsetM*c.lkaOffsetGain-input.lane.headingErrorRad*c.lkaHeadingGain)):0
    const laneDeviation=input.lane.available&&(Math.abs(input.lane.offsetM)>c.laneOffsetThresholdM||Math.abs(input.lane.headingErrorRad)>c.headingErrorThresholdRad)
    return {
      common:{demoEnabled:input.demoEnabled,longitudinalPerceptionAvailable:leadAvailable,lanePerceptionAvailable:input.lane.available},
      acc:{status:!leadAvailable?'UNAVAILABLE':input.demoEnabled&&closeGap?'ACTIVE':'MONITORING',driveScale:input.demoEnabled&&closeGap?c.accCloseGapDriveScale:1,distanceM:leadAvailable?input.lead.relativeLongitudinalDistanceM:undefined},
      aeb:{status:!leadAvailable?'UNAVAILABLE':input.demoEnabled&&aebRisk?'INTERVENING':'MONITORING',ttcSeconds:ttc,brakeOverride:input.demoEnabled&&aebRisk?1:0},
      lka:{status:!input.lane.available?'UNAVAILABLE':input.demoEnabled&&laneDeviation?'ACTIVE':'MONITORING',laneOffsetM:input.lane.available?input.lane.offsetM:undefined,headingErrorRad:input.lane.available?input.lane.headingErrorRad:undefined,steeringCorrection:input.demoEnabled&&laneDeviation?laneCorrection:0},
    }
  }
}
