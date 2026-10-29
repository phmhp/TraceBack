import type { BrakeExecutionOutput, SteeringExecutionOutput } from '../../domain/vehicle/ChassisExecutionTypes.ts'
import type { Validity } from '../../domain/propulsion/PropulsionTypes.ts'

export interface BrakingDomainExecutionOutput {
  availability:'AVAILABLE'|'SUPPRESSED_INVALID'
  normalizedDemand:number
  coordinationSource:'DRIVER_ONLY'|'DRIVER_PLUS_TRACKBACK_AEB'
  selectedRequest:number
  blendMode:'FRICTION_ONLY_TRACKBACK_MODEL'
  regenContribution:'UNAVAILABLE'
  frictionRequest:number
  feedbackStatus:'OBSERVED_ONLY'
  commandedBrakeForceN:number
  observedLongitudinalAccelerationMps2:number
}

export interface SteeringDomainExecutionOutput {
  availability:'AVAILABLE'|'SUPPRESSED_INVALID'
  coordinationSource:'DRIVER_ONLY'|'DRIVER_PLUS_TRACKBACK_LKA'
  selectedRequest:number
  frontWheelAngleRad:number
  monitoringStatus:'OBSERVED_ONLY'
  observedVehicleSpeedMps:number
}

/**
 * Narrow decomposition of the already executable TRACKBACK brake/steering path.
 * No ABS, regen, hydraulic, EPS, LKA, yaw oracle, or OEM control policy is implied.
 */
export class ChassisDomainExecutionModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}

  braking(input:{driverBrakeRequest:number;validity:Validity;execution:Readonly<BrakeExecutionOutput>;longitudinalAccelerationMps2:number;coordinationSource?:BrakingDomainExecutionOutput['coordinationSource']}):BrakingDomainExecutionOutput {
    return {
      availability:input.execution.state,
      normalizedDemand:input.validity==='VALID'?Math.max(0,Math.min(1,input.driverBrakeRequest)):0,
      coordinationSource:input.coordinationSource??'DRIVER_ONLY',
      selectedRequest:input.execution.selectedBrakingRequest,
      blendMode:'FRICTION_ONLY_TRACKBACK_MODEL',
      regenContribution:'UNAVAILABLE',
      frictionRequest:input.execution.selectedBrakingRequest,
      feedbackStatus:'OBSERVED_ONLY',
      commandedBrakeForceN:input.execution.brakeForceN,
      observedLongitudinalAccelerationMps2:input.longitudinalAccelerationMps2,
    }
  }

  steering(input:{validity:Validity;execution:Readonly<SteeringExecutionOutput>;vehicleSpeedMps:number;coordinationSource?:SteeringDomainExecutionOutput['coordinationSource']}):SteeringDomainExecutionOutput {
    return {
      availability:input.execution.state,
      coordinationSource:input.coordinationSource??'DRIVER_ONLY',
      selectedRequest:input.execution.selectedSteeringRequest,
      frontWheelAngleRad:input.execution.frontWheelAngleRad,
      monitoringStatus:'OBSERVED_ONLY',
      observedVehicleSpeedMps:input.vehicleSpeedMps,
    }
  }
}
