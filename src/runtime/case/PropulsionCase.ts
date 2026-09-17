import type { VehicleSwInput, VehicleSwSnapshot } from '../c/VehicleSwPort.ts'
import type { VehicleState } from '../../domain/vehicle/VehicleState.ts'
import type { VehiclePhysicsCommand } from '../../domain/vehicle/VehiclePhysicsPort.ts'
import type { WasmVehicleSw } from '../c/WasmVehicleSw.ts'

export type CaseVariant = 0 | 1 | 2 | 3
export interface IncidentFrame {
  id: number; sw: VehicleSwSnapshot; plant: VehicleState | null
  command: VehiclePhysicsCommand | null; brake: number; steering: number
}
export interface TestResult {
  id: string; input: number | string; direction: string; expected: number | string; actual: number | string
  pass: boolean; requirement: string
}
export interface ExperimentRun { id: number; title: string; rows: TestResult[]; source: 'C_WASM'; variant: CaseVariant; testObject: 'VMC' | 'eDrive' }
export interface Diagnosis { component: string; mechanism: string; requirement: string; frameId: number; testRunId: number; correct: boolean }
export interface CaseState {
  phase: 'DRIVING' | 'CAPTURED' | 'SUBMITTED' | 'RESOLVED'
  frames: readonly IncidentFrame[]; selected: number; pinned: number | null
  source: 'DRIVE_RECORDING' | 'STANDARD_TEST'; elapsed: number
  experiment: ExperimentRun | null; repairs: readonly ExperimentRun[]; diagnosis: Diagnosis | null
}
const initial = (): CaseState => ({ phase: 'DRIVING', frames: [], selected: 0, pinned: null, source: 'DRIVE_RECORDING', elapsed: 0, experiment: null, repairs: [], diagnosis: null })
const baseInput: VehicleSwInput = { acceleratorPedalPosition: .5, acceleratorPedalValidity: 'VALID', gearRequest: 'D', gearRequestValidity: 'VALID', vehicleReady: true, propulsionEnable: true, longitudinalVelocity: 0, vehicleSpeed: 0 }

/** Case orchestration only: all observed component results execute in isolated C instances. */
export class PropulsionCase {
  private state = initial()
  private listeners = new Set<() => void>()
  private ring: IncidentFrame[] = []
  private elapsed = 0
  private qualifying = 0
  private post = 0
  private active = false
  private serial = 0
  private factory: () => WasmVehicleSw
  readonly buildHash: string
  readonly limits: { forward: number; reverse: number }
  constructor(factory: () => WasmVehicleSw, buildHash: string, limits: { forward: number; reverse: number }) {
    this.factory = factory; this.buildHash = buildHash; this.limits = { ...limits }
  }
  readonly subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  readonly getSnapshot = () => this.state
  private update(patch: Partial<CaseState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()) }
  reset() { this.ring = []; this.elapsed = this.qualifying = this.post = this.serial = 0; this.active = false; this.state = initial(); this.listeners.forEach(fn => fn()) }
  beforeStep(input: VehicleSwInput, brake: number, steering: number, dt: number): CaseVariant {
    if (this.state.phase === 'RESOLVED') return 0
    if (this.state.phase !== 'DRIVING') return this.active ? 1 : 0
    this.elapsed += dt
    // Full keyboard pedal is allowed: no hidden 0.8 upper bound preventing the incident.
    const eligible = input.gearRequest === 'D' && input.vehicleReady && input.propulsionEnable && input.acceleratorPedalValidity === 'VALID'
      && input.gearRequestValidity === 'VALID' && input.acceleratorPedalPosition >= .2 && brake <= .01 && Math.abs(steering) <= .35 && input.vehicleSpeed >= .3
    this.qualifying = eligible ? this.qualifying + dt : 0
    if (!this.active && this.elapsed >= 3 && this.qualifying >= .75) this.active = true
    if (this.active) this.post = eligible ? this.post + dt : 0
    return this.active ? 1 : 0
  }
  afterStep(sw: VehicleSwSnapshot, plant: VehicleState, command: VehiclePhysicsCommand, brake: number, steering: number): boolean {
    if (this.state.phase !== 'DRIVING') return false
    this.ring.push(structuredClone({ id: sw.step, sw, plant, command, brake, steering }))
    if (this.ring.length > 900) this.ring.shift()
    if (this.active && this.post >= 2) {
      const frames = this.ring.slice(-420)
      this.update({ phase: 'CAPTURED', frames, selected: frames.length - 1, elapsed: this.elapsed })
      return true
    }
    if (sw.step % 60 === 0) this.update({ elapsed: this.elapsed })
    return false
  }
  select(index: number) { if (this.state.frames.length) this.update({ selected: Math.max(0, Math.min(this.state.frames.length - 1, Math.round(index))) }) }
  pin() { const frame = this.state.frames[this.state.selected]; if (frame && !this.state.diagnosis) this.update({ pinned: frame.id }) }
  /** Explicit fallback fixture: no invented vehicle video, no mutation of driving physics. */
  reproduce() {
    if (this.state.phase !== 'DRIVING') return
    const core = this.factory(); const frames: IncidentFrame[] = []
    for (let i = 0; i < 300; i++) {
      core.setCaseVariant(i < 180 ? 0 : 1)
      const input = { ...baseInput }
      const output = core.step(input)
      frames.push({ id: i + 1, sw: { source: 'C_WASM', step: i + 1, executionTime: i / 60, periodSeconds: 1 / 60, input, output,
        calibrationReference: 'TRACKBACK_SIMULATION_CALIBRATION_V0_1', calibration: core.readCalibration() }, plant: null, command: null, brake: 0, steering: 0 })
    }
    this.active = true
    this.update({ phase: 'CAPTURED', frames, selected: frames.length - 1, source: 'STANDARD_TEST' })
  }
  runExperiment(first: number, second: number, testObject: 'VMC' | 'eDrive' = 'eDrive') {
    if (this.state.phase !== 'CAPTURED') throw new Error('사건 기록을 먼저 확보하세요.')
    const allowed = testObject === 'VMC' ? [.25, .5, .75] : [45, 90, 120]
    if (first === second || !allowed.includes(first) || !allowed.includes(second)) throw new Error('서로 다른 두 입력을 선택하세요.')
    const core = this.factory(); core.setCaseVariant(1)
    const rows = [first, second].map((input, i): TestResult => {
      const actual = (testObject === 'VMC' ? core.verifyVmc(input, 'FORWARD', 'VALID', 0) : core.verifyEDrive(input, 'FORWARD', 'VALID')).magnitudeNm
      const expected = testObject === 'VMC' ? input * core.readCalibration()[1]! : Math.min(input, this.limits.forward)
      return { id: `PAIR-${i + 1}`, input, direction: 'FORWARD', expected, actual, pass: Math.abs(actual - expected) <= 1e-6, requirement: testObject === 'VMC' ? 'SWR-VMC-001' : 'SWR-EDR-001' }
    })
    this.update({ experiment: { id: ++this.serial, title: '두 입력 비교', rows, source: 'C_WASM', variant: 1, testObject } })
  }
  submit(component: string, mechanism: string, requirement: string) {
    if (this.state.diagnosis) throw new Error('첫 제출은 보존됩니다.')
    const frame = this.state.frames.find(f => f.id === this.state.pinned)
    const experiment = this.state.experiment
    if (!frame || !experiment) throw new Error('기록 증거를 저장하고 두 입력 확인 시험을 실행하세요.')
    const request = frame.sw.output.driveTorqueRequest
    const expected = Math.min(request.magnitudeNm, request.direction === 'REVERSE' ? this.limits.reverse : this.limits.forward)
    const mismatch = request.validity === 'VALID' && request.direction !== 'NONE' && Math.abs(frame.sw.output.eDriveCommand.magnitudeNm - expected) > 1e-6
    const correct = component === 'eDrive' && mechanism === 'scaling' && requirement === 'SWR-EDR-001' && mismatch && experiment.testObject === 'eDrive' && experiment.rows.every(r => !r.pass)
    this.update({ phase: 'SUBMITTED', diagnosis: { component, mechanism, requirement, frameId: frame.id, testRunId: experiment.id, correct } })
  }
  runRepair(variant: 0 | 2 | 3) {
    if (!this.state.diagnosis || this.state.phase === 'RESOLVED') throw new Error('원인 제출 후 수정안을 시험하세요.')
    const core = this.factory(); core.setCaseVariant(variant)
    const rows: TestResult[] = []
    for (const [direction, inputs, limit] of [
      ['FORWARD', [0, 45, 90, 179, 180, 181, 600], this.limits.forward],
      ['REVERSE', [129, 130, 131, 400], this.limits.reverse],
    ] as const) for (const input of inputs) {
      const actual = core.verifyEDrive(input, direction, 'VALID')
      const expected = Math.min(input, limit)
      rows.push({ id: `${direction}-${input}`, input, direction, expected, actual: actual.magnitudeNm,
        pass: Math.abs(actual.magnitudeNm - expected) <= 1e-6 && actual.direction === (input === 0 ? 'NONE' : direction) && actual.validity === 'VALID', requirement: 'SWR-EDR-001' })
    }
    const invalid = core.verifyEDrive(90, 'FORWARD', 'INVALID')
    rows.push({ id: 'INVALID', input: '90 Nm / INVALID', direction: 'FORWARD', expected: '0 / NONE / INVALID', actual: `${invalid.magnitudeNm} / ${invalid.direction} / ${invalid.validity}`, pass: invalid.magnitudeNm === 0 && invalid.direction === 'NONE' && invalid.validity === 'INVALID', requirement: '정상 baseline' })
    for (const gear of ['P', 'N', 'D', 'R'] as const) {
      core.reset(); core.setCaseVariant(variant)
      const result = core.step({ ...baseInput, gearRequest: gear })
      const expected = gear === 'D' ? 90 : gear === 'R' ? 65 : 0
      rows.push({ id: `GEAR-${gear}`, input: `pedal 0.5 / ${gear}`, direction: gear, expected, actual: result.eDriveCommand.magnitudeNm, pass: Math.abs(result.eDriveCommand.magnitudeNm - expected) <= 1e-6 && result.eDriveCommand.direction === (gear === 'D' ? 'FORWARD' : gear === 'R' ? 'REVERSE' : 'NONE'), requirement: 'SWR-PROP-004' })
    }
    core.reset(); core.setCaseVariant(variant)
    const disabled = core.step({ ...baseInput, propulsionEnable: false })
    rows.push({ id: 'DISABLED', input: 'PropulsionEnable=false', direction: 'NONE', expected: 0, actual: disabled.eDriveCommand.magnitudeNm, pass: disabled.eDriveCommand.magnitudeNm === 0, requirement: 'SWR-PROP-001' })
    core.reset(); core.setCaseVariant(variant)
    const rejected = core.step({ ...baseInput, gearRequest: 'R', longitudinalVelocity: 1, vehicleSpeed: 1 })
    rows.push({ id: 'INTERLOCK', input: 'D → R / 1 m/s', direction: 'D', expected: 'D', actual: rejected.gearState, pass: rejected.gearState === 'D' && !rejected.transitionAccepted, requirement: 'SWR-GEAR-001' })
    const run: ExperimentRun = { id: ++this.serial, title: '수정 후 재현·회귀시험', rows, source: 'C_WASM', variant, testObject: 'eDrive' }
    this.update({ repairs: [...this.state.repairs, run], phase: rows.every(r => r.pass) ? 'RESOLVED' : 'SUBMITTED' })
    return run
  }
  report() { return { caseId: 'CASE-PT-001', version: '0.2.0', buildHash: this.buildHash, calibration: this.limits, recordSource: this.state.source, diagnosis: this.state.diagnosis, evidenceFrame: this.state.frames.find(f => f.id === this.state.pinned), experiment: this.state.experiment, repairs: this.state.repairs, phase: this.state.phase } }
}
