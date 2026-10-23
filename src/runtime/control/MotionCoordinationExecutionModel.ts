export interface MotionCoordinationExecutionInput {
  propulsionRequest:number
  brakeRequest:number
  steeringRequest:number
  driveForceN:number
  brakeForceN:number
  frontWheelAngleRad:number
  longitudinalAccelerationMps2:number
}

export interface MotionCoordinationExecutionOutput {
  requestScope:'DRIVER_PROPULSION_BRAKE_STEERING'
  longitudinalRequest:{propulsion:number;brake:number}
  authority:'DRIVER_ONLY'|'DRIVER_PLUS_TRACKBACK_ADAS'
  longitudinalPolicy:'BRAKE_INPUT_INHIBITS_DRIVE_ADAPTER'
  lateralRequest:number
  lateralPolicy:'INDEPENDENT_MANUAL_STEERING'
  allocation:{driveForceN:number;brakeForceN:number;frontWheelAngleRad:number}
  monitorStatus:'OBSERVED_ONLY'
  observedLongitudinalAccelerationMps2:number
}

/** Current TRACKBACK runtime coordination only; not a complete Reference Motion Coordination implementation. */
export class MotionCoordinationExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}
  step(input:Readonly<MotionCoordinationExecutionInput&{authority?:MotionCoordinationExecutionOutput['authority']}>):MotionCoordinationExecutionOutput {
    return {
      requestScope:'DRIVER_PROPULSION_BRAKE_STEERING',
      longitudinalRequest:{propulsion:input.propulsionRequest,brake:input.brakeRequest},
      authority:input.authority??'DRIVER_ONLY',
      longitudinalPolicy:'BRAKE_INPUT_INHIBITS_DRIVE_ADAPTER',
      lateralRequest:input.steeringRequest,
      lateralPolicy:'INDEPENDENT_MANUAL_STEERING',
      allocation:{driveForceN:input.driveForceN,brakeForceN:input.brakeForceN,frontWheelAngleRad:input.frontWheelAngleRad},
      monitorStatus:'OBSERVED_ONLY',
      observedLongitudinalAccelerationMps2:input.longitudinalAccelerationMps2,
    }
  }
}
