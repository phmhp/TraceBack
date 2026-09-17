import type { SimulationPropulsionCalibration } from '../SimulationRuntime.ts'
import { calibrationSlots, validateInput } from './VehicleSwPort.ts'
import type { VehicleSwInput, VehicleSwOutput, VehicleSwPort } from './VehicleSwPort.ts'

const gears = ['P','R','N','D'] as const
const directions = ['NONE','FORWARD','REVERSE'] as const
const validity = ['INVALID','VALID'] as const
interface Exports extends WebAssembly.Exports {
  memory: WebAssembly.Memory
  tb_abi: () => number
  tb_input_count: () => number
  tb_output_count: () => number
  tb_calibration_count: () => number
  tb_input: () => number
  tb_output: () => number
  tb_calibration: () => number
  tb_init: (gear: number) => void
  tb_reset: (gear: number) => void
  tb_step: () => void
  tb_case_variant: (variant: number) => void
  tb_test_vmc: (magnitude: number, direction: number, valid: number, speed: number) => void
  tb_test_edrive: (magnitude: number, direction: number, valid: number) => void
}
export class WasmVehicleSw implements VehicleSwPort {
  readonly source = 'C_WASM' as const
  private exports: Exports
  private input: Float64Array
  private output: Float64Array
  constructor(module: WebAssembly.Module, calibration: Readonly<SimulationPropulsionCalibration>) {
    const e = new WebAssembly.Instance(module, {}).exports as Exports
    if (e.tb_abi() !== 1 || e.tb_input_count() !== 8 || e.tb_output_count() !== 13 || e.tb_calibration_count() !== 7)
      throw new Error('Unsupported Vehicle SW WASM ABI')
    this.exports = e
    this.input = new Float64Array(e.memory.buffer, e.tb_input(), 8)
    this.output = new Float64Array(e.memory.buffer, e.tb_output(), 13)
    const slots = calibrationSlots(calibration)
    if (slots.some(v => !Number.isFinite(v) || v < 0) || slots[2]! <= 0 || slots[4]! <= 0) throw new Error('Invalid Vehicle SW calibration')
    new Float64Array(e.memory.buffer, e.tb_calibration(), 7).set(slots)
    e.tb_init(gears.indexOf('D')) // Session initial condition; not Gear Logic behavior.
  }
  reset() { this.exports.tb_reset(gears.indexOf('D')) }
  readCalibration() { return Array.from(new Float64Array(this.exports.memory.buffer, this.exports.tb_calibration(), 7)) }
  setCaseVariant(variant: 0 | 1 | 2 | 3) { this.exports.tb_case_variant(variant) }
  step(input: VehicleSwInput): VehicleSwOutput {
    validateInput(input)
    this.input.set([input.acceleratorPedalPosition, validity.indexOf(input.acceleratorPedalValidity), gears.indexOf(input.gearRequest),
      validity.indexOf(input.gearRequestValidity), Number(input.vehicleReady), Number(input.propulsionEnable), input.longitudinalVelocity, input.vehicleSpeed])
    this.exports.tb_step()
    return { gearState: this.enumAt(gears,0), gearStateValidity: this.enumAt(validity,1), transitionAccepted: this.slot(2) === 1,
      propulsionState: this.slot(3) === 1 ? 'PROP_ENABLED' : 'PROP_DISABLED',
      propulsionRequest: { magnitude: this.slot(4), direction: this.enumAt(directions,5), validity: this.enumAt(validity,6) },
      driveTorqueRequest: this.readTorque(7), eDriveCommand: this.readTorque(10) }
  }
  private readTorque(offset: number) {
    return { magnitudeNm: this.slot(offset), direction: this.enumAt(directions,offset+1), validity: this.enumAt(validity,offset+2) }
  }
  private slot(index: number): number {
    const value = this.output[index]
    if (value === undefined || !Number.isFinite(value)) throw new Error('Invalid C output value')
    return value
  }
  private enumAt<T extends string>(values: readonly T[], index: number): T {
    const value = values[this.slot(index)]
    if (value === undefined) throw new Error('Invalid C output enumeration')
    return value
  }
  /** Component test seam: runs the same C functions used by Trackback_Step. */
  verifyVmc(magnitude: number, direction: typeof directions[number], valid: typeof validity[number], speed: number) {
    this.exports.tb_test_vmc(magnitude, directions.indexOf(direction), validity.indexOf(valid), speed)
    return this.readTorque(7)
  }
  verifyEDrive(magnitude: number, direction: typeof directions[number], valid: typeof validity[number]) {
    this.exports.tb_test_edrive(magnitude, directions.indexOf(direction), validity.indexOf(valid))
    return this.readTorque(10)
  }
}
