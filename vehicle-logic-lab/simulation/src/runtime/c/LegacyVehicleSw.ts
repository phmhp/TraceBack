import { GearLogic } from '../gear/GearLogic.ts'
import { evaluatePropulsion } from '../propulsion/PropulsionFunction.ts'
import { createDriveTorqueRequest } from '../vmc/PropulsionVmc.ts'
import { createEDriveCommand } from '../edrive/EDrive.ts'
import type { SimulationPropulsionCalibration } from '../SimulationRuntime.ts'
import type { VehicleSwInput, VehicleSwPort } from './VehicleSwPort.ts'

/** Migration oracle only. Browser composition explicitly supplies C/WASM. */
export class LegacyVehicleSw implements VehicleSwPort {
  readonly source = 'TS_LEGACY_REFERENCE' as const
  private gear = new GearLogic()
  private calibration: Readonly<SimulationPropulsionCalibration>
  constructor(calibration: Readonly<SimulationPropulsionCalibration>) { this.calibration = structuredClone(calibration) }
  reset() { this.gear.reset() }
  step(input: VehicleSwInput) {
    const c = this.calibration
    const gear = this.gear.update(input.gearRequest, input.gearRequestValidity, input.longitudinalVelocity, c.gearDirectionChangeMaxSpeedMps.value)
    const propulsion = evaluatePropulsion({ ...input, gearState: gear.gearState, gearStateValidity: gear.gearStateValidity })
    const driveTorqueRequest = createDriveTorqueRequest(propulsion.request, input.vehicleSpeed, c.vmcForwardTorqueMap, c.vmcReverseTorqueMap)
    return { gearState: gear.gearState, gearStateValidity: gear.gearStateValidity, transitionAccepted: gear.transitionAccepted,
      propulsionState: propulsion.state, propulsionRequest: propulsion.request, driveTorqueRequest,
      eDriveCommand: createEDriveCommand(driveTorqueRequest, c.maxForwardTorqueNm.value, c.maxReverseTorqueNm.value) }
  }
}
