import type { IncidentFrame } from '../../runtime/case/PropulsionCase.ts'
import { expectedTorque } from '../../runtime/case/CaseExperiment.ts'
export interface BoundaryObservation {
  inputs:Record<string,unknown>; expected:unknown; actual:unknown
  status:'OBSERVED'|'MATCH'|'MISMATCH'; note:string
}
export function inspectBoundary(frame:IncidentFrame, component:string, previous?:IncidentFrame):BoundaryObservation {
  const {input:i,output:o,calibration:c}=frame.sw
  const valid=i.acceleratorPedalValidity==='VALID'&&o.gearStateValidity==='VALID'
  const enabled=i.vehicleReady&&i.propulsionEnable
  let inputs:Record<string,unknown>={}, expected:unknown=null, actual:unknown=null
  let note='현재 입력이 주어졌을 때 이 기능이 정상이라면 내야 하는 출력입니다. 전체 정상 차량을 병렬 실행한 결과가 아닙니다.'
  if(component==='DriverInput') {inputs={AcceleratorPedalPosition:i.acceleratorPedalPosition,GearRequest:i.gearRequest,Brake:frame.brake,Steering:frame.steering};actual=inputs}
  if(component==='GearLogic') {
    inputs={GearRequest:i.gearRequest,GearRequestValidity:i.gearRequestValidity,LongitudinalVelocity:i.longitudinalVelocity,PreviousGearState:previous?.sw.output.gearState??'확인 불가'}
    actual={gearState:o.gearState,gearStateValidity:o.gearStateValidity,transitionAccepted:o.transitionAccepted}
    if(previous&&previous.id+1===frame.id){const old=previous.sw.output.gearState;const opposite=(old==='D'&&i.gearRequest==='R')||(old==='R'&&i.gearRequest==='D');const accepted=i.gearRequestValidity==='VALID'&&(!opposite||Math.abs(i.longitudinalVelocity)<=c[0]!);expected={gearState:accepted?i.gearRequest:old,gearStateValidity:i.gearRequestValidity,transitionAccepted:accepted}}
    else note='연속된 직전 호출이 없어 이전 GearState를 검증할 수 없습니다. 관측값만 표시합니다.'
  }
  if(component==='PropulsionFunction') {
    inputs={AcceleratorPedalPosition:i.acceleratorPedalPosition,AcceleratorPedalValidity:i.acceleratorPedalValidity,GearState:o.gearState,GearStateValidity:o.gearStateValidity,VehicleReady:i.vehicleReady,PropulsionEnable:i.propulsionEnable}
    const magnitude=valid&&enabled&&!['P','N'].includes(o.gearState)&&Number.isFinite(i.acceleratorPedalPosition)?Math.min(1,Math.max(0,i.acceleratorPedalPosition)):0
    expected={magnitude,direction:magnitude>0?(o.gearState==='D'?'FORWARD':'REVERSE'):'NONE',validity:valid?'VALID':'INVALID'};actual=o.propulsionRequest
  }
  if(component==='VMC'||component==='eDrive') {
    const r=component==='VMC'?o.propulsionRequest:o.driveTorqueRequest;const magnitude='magnitude' in r?r.magnitude:r.magnitudeNm
    inputs={magnitude,direction:r.direction,validity:r.validity,...(component==='VMC'?{VehicleSpeed:i.vehicleSpeed}:{DirectionalLimit:c[r.direction==='REVERSE'?6:5]})}
    expected=expectedTorque(component,magnitude,i.vehicleSpeed,r.direction,r.validity,c)
    actual=(component==='VMC'?o.driveTorqueRequest:o.eDriveCommand).magnitudeNm
    note+=' 판정 범위: 토크 크기(Nm).'
  }
  if(component==='VehiclePhysics'){inputs={...frame.command};actual=frame.plant?{VehicleSpeed:frame.plant.speed,LongitudinalVelocity:frame.plant.longitudinalVelocity,LongitudinalAcceleration:frame.plant.longitudinalAcceleration}:null;note='물리 응답 관측입니다. 이 프레임의 정상 차량 궤적 oracle은 없습니다.'}
  const match=typeof expected==='number'&&typeof actual==='number'?Math.abs(expected-actual)<=1e-6:JSON.stringify(expected)===JSON.stringify(actual)
  return {inputs,expected,actual,status:expected===null?'OBSERVED':match?'MATCH':'MISMATCH',note}
}
