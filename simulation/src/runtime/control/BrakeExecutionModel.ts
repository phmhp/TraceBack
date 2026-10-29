import type { BrakeExecutionInput, BrakeExecutionOutput } from '../../domain/vehicle/ChassisExecutionTypes.ts'
import { TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1 } from './ChassisExecutionCalibration.ts'

const clamp = (value:number, minimum:number, maximum:number) =>
  Number.isFinite(value) ? Math.max(minimum, Math.min(maximum, value)) : minimum

const initial = ():BrakeExecutionOutput => ({selectedBrakingRequest:0,brakeForceN:0,state:'AVAILABLE'})

/**
 * Executable TraceBack service-brake path.
 * Scope: request validation, request selection, and conversion to the existing
 * physics brake-force command. ABS/EBD/ESC/hydraulics are outside this model.
 */
export class BrakeExecutionModel {
  readonly authority = 'TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance = 'SIMULATION_ASSUMPTION' as const
  private output:BrakeExecutionOutput=initial()

  step(input:Readonly<BrakeExecutionInput>):Readonly<BrakeExecutionOutput>{
    const request=clamp(input.driverBrakeRequest,0,1)
    const selected=input.validity==='VALID'?request:0
    this.output={
      selectedBrakingRequest:selected,
      brakeForceN:selected*TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1.serviceBrakeMaximumForceN.value,
      state:input.validity==='VALID'?'AVAILABLE':'SUPPRESSED_INVALID',
    }
    return this.output
  }

  reset(){this.output=initial()}
  getSnapshot(){return this.output}
}

