import type { SteeringExecutionInput, SteeringExecutionOutput } from '../../domain/vehicle/ChassisExecutionTypes.ts'
import { TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1 } from './ChassisExecutionCalibration.ts'

const clamp = (value:number, minimum:number, maximum:number) =>
  Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : minimum

const initial = ():SteeringExecutionOutput => ({selectedSteeringRequest:0,frontWheelAngleRad:0,state:'AVAILABLE'})

/**
 * Executable TraceBack manual-steering path.
 * Scope: request validation and a speed-sensitive front-wheel command for the
 * existing physics port. EPS/LKA/ESC and OEM steering maps are outside it.
 */
export class SteeringExecutionModel {
  readonly authority = 'TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance = 'SIMULATION_ASSUMPTION' as const
  private output:SteeringExecutionOutput=initial()

  step(input:Readonly<SteeringExecutionInput>):Readonly<SteeringExecutionOutput>{
    const request=clamp(input.driverSteeringRequest,-1,1)
    const speed=Math.max(0,Number.isFinite(input.vehicleSpeedMps)?input.vehicleSpeedMps:0)
    const selected=input.validity==='VALID'?request:0
    const calibration=TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1
    this.output={
      selectedSteeringRequest:selected,
      frontWheelAngleRad:selected*(calibration.steeringMaximumAngleRad.value/(1+speed*calibration.steeringSpeedAttenuationPerMps.value)),
      state:input.validity==='VALID'?'AVAILABLE':'SUPPRESSED_INVALID',
    }
    return this.output
  }

  reset(){this.output=initial()}
  getSnapshot(){return this.output}
}

