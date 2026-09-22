import type { WasmVehicleSw } from '../c/WasmVehicleSw.ts'

export interface ExperimentOptions {
  variable: 'magnitude' | 'speed'
  magnitude: number
  speed: number
  direction: 'FORWARD' | 'REVERSE'
  validity: 'VALID' | 'INVALID'
}
export const defaultExperimentOptions = (): ExperimentOptions => ({ variable: 'magnitude', magnitude: .5, speed: 0, direction: 'FORWARD', validity: 'VALID' })
export function validateExperiment(target: 'VMC' | 'eDrive', values: number[], o: ExperimentOptions) {
  if (!['VMC', 'eDrive'].includes(target) || !['magnitude', 'speed'].includes(o.variable) || !['FORWARD', 'REVERSE'].includes(o.direction) || !['VALID', 'INVALID'].includes(o.validity)) throw new Error('지원하지 않는 시험 조건입니다.')
  if (target === 'eDrive' && o.variable === 'speed') throw new Error('eDrive 모델은 속력을 입력받지 않습니다.')
  const bounded = (n: number, max: number) => Number.isFinite(n) && n >= 0 && n <= max
  const maxMagnitude = target === 'VMC' ? 1 : 600
  if (values.length < 1 || values.length > 2 || !bounded(o.speed, 60) || !bounded(o.magnitude, maxMagnitude) || values.some(v => !bounded(v, o.variable === 'speed' ? 60 : maxMagnitude)) || values[0] === values[1]) throw new Error('표시된 범위 안의 값을 입력하십시오. 비교 시험에는 서로 다른 값을 사용하십시오.')
}
/** Independent requirement oracle, not a second controller implementation. */
export function expectedTorque(target: 'VMC' | 'eDrive', magnitude: number, speed: number, direction: string, validity: string, c: readonly number[]) {
  if (validity !== 'VALID' || direction === 'NONE' || magnitude === 0) return 0
  if (target === 'eDrive') return Math.min(magnitude, c[direction === 'REVERSE' ? 6 : 5]!)
  const i = direction === 'REVERSE' ? 3 : 1
  return Math.max(0, magnitude * c[i]! * Math.max(0, 1 - speed / c[i + 1]!))
}
export function executeExperiment(core: WasmVehicleSw, target: 'VMC' | 'eDrive', value: number, options: ExperimentOptions) {
  const magnitude = options.variable === 'magnitude' ? value : options.magnitude
  const speed = options.variable === 'speed' ? value : options.speed
  const actual = target === 'VMC' ? core.verifyVmc(magnitude, options.direction, options.validity, speed) : core.verifyEDrive(magnitude, options.direction, options.validity)
  const expected = expectedTorque(target, magnitude, speed, options.direction, options.validity, core.readCalibration())
  return { actual: actual.magnitudeNm, expected, pass: Math.abs(actual.magnitudeNm - expected) <= 1e-6 }
}
