import type { WasmVehicleSw } from '../c/WasmVehicleSw.ts'
import { BrakeExecutionModel } from '../control/BrakeExecutionModel.ts'
import { SteeringExecutionModel } from '../control/SteeringExecutionModel.ts'
import { TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1 } from '../control/ChassisExecutionCalibration.ts'
import { writeEDrivePhysicsCommand } from '../control/EDriveToVehiclePhysicsAdapter.ts'

export interface ExperimentOptions {
  variable: 'magnitude' | 'speed'
  magnitude: number
  speed: number
  direction: 'FORWARD' | 'REVERSE'
  validity: 'VALID' | 'INVALID'
  previousGear?:'D'|'R'
  requestedGear?:'D'|'R'
  torqueToForce?:number
}
export type ComponentTestTarget = 'GearLogic'|'PropulsionFunction'|'VMC'|'eDrive'|'DriveAdapterExecution'|'BrakingExecution'|'SteeringExecution'
export const defaultExperimentOptions = (): ExperimentOptions => ({ variable: 'magnitude', magnitude: .5, speed: 0, direction: 'FORWARD', validity: 'VALID' })
export function validateExperiment(target: ComponentTestTarget, values: number[], o: ExperimentOptions) {
  if (!['GearLogic','PropulsionFunction','VMC','eDrive','DriveAdapterExecution','BrakingExecution','SteeringExecution'].includes(target) || !['magnitude', 'speed'].includes(o.variable) || !['FORWARD', 'REVERSE'].includes(o.direction) || !['VALID', 'INVALID'].includes(o.validity)) throw new Error('지원하지 않는 시험 조건입니다.')
  if(target==='GearLogic'&&(o.variable!=='speed'||!['D','R'].includes(o.previousGear??'')||!['D','R'].includes(o.requestedGear??'')))throw new Error('기어 시험 조건을 확인하십시오.')
  if (['eDrive','DriveAdapterExecution','BrakingExecution','SteeringExecution'].includes(target) && o.variable === 'speed') throw new Error('선택한 모델은 값을 주 입력으로 사용합니다.')
  const bounded = (n: number, min:number, max: number) => Number.isFinite(n) && n >= min && n <= max
  const range=target==='PropulsionFunction'||target==='VMC'||target==='BrakingExecution'?{min:0,max:1}:target==='SteeringExecution'?{min:-1,max:1}:target==='eDrive'?{min:0,max:600}:target==='DriveAdapterExecution'?{min:0,max:180}:{min:0,max:60}
  if(target==='DriveAdapterExecution'&&(!Number.isFinite(o.torqueToForce)||o.torqueToForce!<=0))throw new Error('드라이브 어댑터 보정값이 없습니다.')
  if (values.length < 1 || values.length > 2 || !bounded(o.speed,0,60) || !bounded(o.magnitude,range.min,range.max) || values.some(v => !bounded(v,o.variable==='speed'?0:range.min,o.variable==='speed'?60:range.max)) || values[0] === values[1]) throw new Error('표시된 범위 안의 값을 입력하십시오. 비교 시험에는 서로 다른 값을 사용하십시오.')
}
/** Independent requirement oracle, not a second controller implementation. */
export function expectedTorque(target: 'VMC' | 'eDrive', magnitude: number, speed: number, direction: string, validity: string, c: readonly number[]) {
  if (validity !== 'VALID' || direction === 'NONE' || magnitude === 0) return 0
  if (target === 'eDrive') return Math.min(magnitude, c[direction === 'REVERSE' ? 6 : 5]!)
  const i = direction === 'REVERSE' ? 3 : 1
  return Math.max(0, magnitude * c[i]! * Math.max(0, 1 - speed / c[i + 1]!))
}
export function executeExperiment(core: WasmVehicleSw|null, target: ComponentTestTarget, value: number, options: ExperimentOptions) {
  if(target==='DriveAdapterExecution'){
    const command={driveForce:0,brakeForce:0,steering:0}
    const direction=value===0?'NONE':options.direction
    writeEDrivePhysicsCommand({magnitudeNm:value,direction,validity:options.validity},options.torqueToForce!,false,command)
    const sign=options.direction==='REVERSE'?-1:1
    const expected=options.validity==='VALID'?value*options.torqueToForce!*sign:0
    return {actual:command.driveForce,expected,pass:Math.abs(command.driveForce-expected)<=1e-6}
  }
  if(target==='BrakingExecution'){
    const actual=new BrakeExecutionModel().step({driverBrakeRequest:value,validity:options.validity})
    const expected=options.validity==='VALID'?value*TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1.serviceBrakeMaximumForceN.value:0
    return {actual:actual.brakeForceN,expected,pass:Math.abs(actual.brakeForceN-expected)<=1e-6}
  }
  if(target==='SteeringExecution'){
    const actual=new SteeringExecutionModel().step({driverSteeringRequest:value,vehicleSpeedMps:options.speed,validity:options.validity})
    const calibration=TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1
    const expected=options.validity==='VALID'?value*(calibration.steeringMaximumAngleRad.value/(1+options.speed*calibration.steeringSpeedAttenuationPerMps.value)):0
    return {actual:actual.frontWheelAngleRad,expected,pass:Math.abs(actual.frontWheelAngleRad-expected)<=1e-9}
  }
  if(!core)throw new Error('C/WASM 실행 코어가 준비되지 않았습니다.')
  if(target==='GearLogic'){
    const previous=options.previousGear??'D',requested=options.requestedGear??'R'
    const actual=core.verifyGear(previous,requested,options.validity,value)
    const expected=options.validity==='VALID'&&Math.abs(value)<=core.readCalibration()[0]! ? requested : previous
    return {actual:actual.gearState,expected,pass:actual.gearState===expected&&actual.transitionAccepted===(expected===requested)}
  }
  if(target==='PropulsionFunction'){
    const actual=core.verifyPropulsion(value,options.direction,options.validity)
    const expectedMagnitude=options.validity==='VALID'?value:0
    const expectedDirection=expectedMagnitude===0?'NONE':options.direction
    const expectedValidity=options.validity
    const pass=actual.state==='PROP_ENABLED'&&Math.abs(actual.request.magnitude-expectedMagnitude)<=1e-9&&actual.request.direction===expectedDirection&&actual.request.validity===expectedValidity
    return {actual:actual.request.magnitude,expected:expectedMagnitude,pass}
  }
  const magnitude = options.variable === 'magnitude' ? value : options.magnitude
  const speed = options.variable === 'speed' ? value : options.speed
  const actual = target === 'VMC' ? core.verifyVmc(magnitude, options.direction, options.validity, speed) : core.verifyEDrive(magnitude, options.direction, options.validity)
  const expected = expectedTorque(target, magnitude, speed, options.direction, options.validity, core.readCalibration())
  return { actual: actual.magnitudeNm, expected, pass: Math.abs(actual.magnitudeNm - expected) <= 1e-6 }
}
