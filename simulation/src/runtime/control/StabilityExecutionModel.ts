export const TRACKBACK_STABILITY_CALIBRATION_V0_1={
  provenance:'SIMULATION_ASSUMPTION',authority:'TRACKBACK_EXECUTION_MODEL',status:'REVIEW_REQUIRED',
  minimumControlSpeedMps:2,longitudinalSlipThreshold:0.25,releaseScale:0.6,wheelbaseM:1.82,yawDeviationThresholdRadPerSecond:0.5,
} as const

export interface StabilityExecutionOutput {
  abs:{status:'INACTIVE'|'MONITORING'|'INTERVENING';brakeScale:number}
  tcs:{status:'INACTIVE'|'MONITORING'|'INTERVENING';driveScale:number}
  esc:{status:'INACTIVE'|'OBSERVED_WITHIN_THRESHOLD'|'DEVIATION_OBSERVED';expectedYawRateRadPerSecond:number;yawDeviationRadPerSecond:number;intervention:'UNAVAILABLE_NO_INDIVIDUAL_WHEEL_CONTROL'}
  coordination:{interventionEnabled:boolean;driveScale:number;brakeScale:number}
}

/** Educational stability model over real Rapier wheel/yaw telemetry; not OEM ABS/TCS/ESC logic. */
export class StabilityExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}
  step(input:{speedMps:number;maxLongitudinalSlipEstimate:number;brakeRequest:number;driveRequest:number;frontWheelAngleRad:number;yawRateRadPerSecond:number;interventionEnabled:boolean}):StabilityExecutionOutput {
    const c=TRACKBACK_STABILITY_CALIBRATION_V0_1,controllable=input.speedMps>=c.minimumControlSpeedMps
    const absRisk=controllable&&input.brakeRequest>0&&input.maxLongitudinalSlipEstimate>c.longitudinalSlipThreshold
    const tcsRisk=controllable&&input.driveRequest>0&&input.maxLongitudinalSlipEstimate>c.longitudinalSlipThreshold
    const absIntervening=absRisk&&input.interventionEnabled,tcsIntervening=tcsRisk&&input.interventionEnabled
    const expectedYawRateRadPerSecond=controllable?input.speedMps*Math.tan(input.frontWheelAngleRad)/c.wheelbaseM:0
    const yawDeviationRadPerSecond=input.yawRateRadPerSecond-expectedYawRateRadPerSecond
    const escStatus:StabilityExecutionOutput['esc']['status']=!controllable||Math.abs(input.frontWheelAngleRad)<1e-4?'INACTIVE':Math.abs(yawDeviationRadPerSecond)>c.yawDeviationThresholdRadPerSecond?'DEVIATION_OBSERVED':'OBSERVED_WITHIN_THRESHOLD'
    return {
      abs:{status:absIntervening?'INTERVENING':absRisk?'MONITORING':'INACTIVE',brakeScale:absIntervening?c.releaseScale:1},
      tcs:{status:tcsIntervening?'INTERVENING':tcsRisk?'MONITORING':'INACTIVE',driveScale:tcsIntervening?c.releaseScale:1},
      esc:{status:escStatus,expectedYawRateRadPerSecond,yawDeviationRadPerSecond,intervention:'UNAVAILABLE_NO_INDIVIDUAL_WHEEL_CONTROL'},
      coordination:{interventionEnabled:input.interventionEnabled,driveScale:tcsIntervening?c.releaseScale:1,brakeScale:absIntervening?c.releaseScale:1},
    }
  }
}
