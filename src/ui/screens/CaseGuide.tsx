import { CaseRequirementFlow } from './CaseRequirementFlow'
import type { IncidentFrame } from '../../runtime/case/PropulsionCase'
import { propulsionRequirements } from '../../data/ground-truth/PropulsionGroundTruth'
import { architectureNode, componentIds } from '../../registries/investigation/Architecture'

export const componentNames = componentIds.map(id=>architectureNode(id).label)
export const componentRoles = componentIds.map(id=>architectureNode(id).role)
export function CaseScope({ frame, onRequirement }: { frame?: IncidentFrame; onRequirement: (id:string)=>void }) {
  return <article className="case-paper case-scope"><h3>차량 안에서 어디를 조사하나요?</h3>
    <div className="case-scope-flow"><div><b>운전자</b><small>가속 페달 · 기어 조작</small></div><span>→</span><div className="scope-target"><b>통합제어기 · Application SW</b><small>POWERTRAIN · 이번 사건의 조사 범위</small></div><span>→</span><div><b>구동 / 차량</b><small>힘 · 움직임 · 속도</small></div></div>
    <h3 className="case-component-heading">통합제어기 내부의 논리적 SW 구성요소</h3><p className="case-caption">아래 네 항목은 역할에 따라 나눈 Software Component입니다. 각 구성요소가 입력 신호를 받아 기능을 수행하고, 출력 신호를 다음 구성요소에 전달합니다.</p>
    <div className="case-function-flow">{componentNames.slice(1,5).map((name,i)=><div key={name}><b>{i+1}. <code>{name}</code></b><p>{componentRoles[i+1]}</p>{i<3&&<span aria-hidden="true">↓</span>}</div>)}</div>
    <p className="case-caption">추진 요청 → 토크 요청 → 최종 토크 명령 → 차량 응답. 제동·조향·통신은 이번 문제의 원인 후보에 포함하지 않습니다.</p>
    <CaseRequirementFlow frame={frame} onRequirement={onRequirement}/>
  </article>
}
export function RequirementConditions({ id, frame }: { id: string; frame?: IncidentFrame }) {
  const req = propulsionRequirements.find(r=>r.id===id)
  const input=frame?.sw.input, out=frame?.sw.output
  const component=req?.allocatedComponent
  let explanation: string
  let values: [string, unknown][]
  if (component==='GearLogic') {
    explanation='D↔R 요청 → 종방향 속도가 전환 한계 이하인지 확인 → 허용 시 기어 변경, 아니면 이전 기어 유지.'
    values=[['GearRequest',input?.gearRequest],['LongitudinalVelocity',input?.longitudinalVelocity],['DirectionChangeMaxSpeed',frame?.sw.calibration[0]],['TransitionAccepted',out?.transitionAccepted]]
  } else if(component==='VMC') {
    explanation='유효한 추진 요청 → 방향별 토크 맵 선택 → 현재 속력에 따른 토크 계산. 출력 크기와 함께 방향·유효성을 확인합니다.'
    values=[['PropulsionRequest',out?.propulsionRequest.magnitude],['RequestDirection',out?.propulsionRequest.direction],['RequestValidity',out?.propulsionRequest.validity],['VehicleSpeed',input?.vehicleSpeed]]
  } else if(component==='eDrive') {
    explanation='유효한 토크 요청 → 방향별 한계와 비교 → 한계 이하는 크기 유지, 초과는 제한. 무효 요청은 0으로 처리합니다.'
    values=[['DriveTorqueRequest',out?.driveTorqueRequest.magnitudeNm],['DriveDirection',out?.driveTorqueRequest.direction],['DriveValidity',out?.driveTorqueRequest.validity],['TorqueLimit',frame?.sw.calibration[out?.driveTorqueRequest.direction==='REVERSE'?6:5]]]
  } else if(component==='VehiclePhysics') {
    explanation='최종 명령 → 힘 적용 → 차량 운동. 속력은 전체 속도 벡터 크기이고 종방향 속도는 전후진 부호를 가집니다. 이 패널은 물리 궤적의 정상 판정을 제공하지 않습니다.'
    values=[['VehicleSpeed',frame?.plant?.speed],['LongitudinalVelocity',frame?.plant?.longitudinalVelocity]]
  } else {
    explanation=id.endsWith('001')?'Ready와 Enable 확인 → 추진 허용/억제 상태 결정 → 억제 상태의 추진 요청은 0.':id.endsWith('002')?'페달·기어 유효성 확인 → 하나라도 INVALID이면 0 / NONE / INVALID 요청.':'유효성 확인 → 추진 허용 확인 → 실제 기어 P/N이면 억제, D/R이면 방향 선택 → 페달을 0~1 요청으로 변환.'
    values=id.endsWith('001')?[['VehicleReady',input?.vehicleReady],['PropulsionEnable',input?.propulsionEnable],['PropulsionState',out?.propulsionState]]:id.endsWith('002')?[['AcceleratorPedalValidity',input?.acceleratorPedalValidity],['GearStateValidity',out?.gearStateValidity]]:[['GearState',out?.gearState],['AcceleratorPedalPosition',input?.acceleratorPedalPosition],['PropulsionState',out?.propulsionState]]
  }
  return <details className="case-rule-conditions"><summary><b>적용 조건과 동작 순서</b> · <code>{id}</code></summary><p>{explanation}</p>{frame?<dl className="case-conditions">{values.map(([name,value])=><div key={name}><dt><code>{name}</code></dt><dd>{typeof value==='number'?value.toFixed(3):String(value??'—')}</dd></div>)}</dl>:<p>주행 데이터 확보 후 선택 시점의 값을 함께 확인할 수 있습니다.</p>}</details>
}
