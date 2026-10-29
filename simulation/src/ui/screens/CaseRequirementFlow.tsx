import { useState } from 'react'
import type { IncidentFrame } from '../../runtime/case/PropulsionCase'
import { propulsionRequirements } from '../../data/ground-truth/PropulsionGroundTruth'

const choices = [
  ['SWR-PROP-002', '입력을 사용해도 되는가?'],
  ['SWR-PROP-001', '추진 기능을 활성화해도 되는가?'],
  ['SWR-PROP-004', '어느 방향으로 추진해야 하는가?'],
  ['SWR-EDR-001', '요청한 토크를 얼마나 전달해야 하는가?'],
] as const
export function CaseRequirementFlow({ frame, onRequirement }: { frame?: IncidentFrame; onRequirement: (id: string) => void }) {
  const [id,setId]=useState<string>('SWR-PROP-002')
  const req=propulsionRequirements.find(r=>r.id===id)!
  const input=frame?.sw.input, out=frame?.sw.output
  const valid=!!input&&input.acceleratorPedalValidity==='VALID'&&out?.gearStateValidity==='VALID'
  const enabled=!!input&&input.vehicleReady&&input.propulsionEnable
  let condition: string, context: string, active: number | null = null
  let paths: { label: string; result: string;  }[]
  if(id==='SWR-PROP-002') {
    context='페달 입력과 실제 기어 상태의 유효성을 먼저 확인합니다.'
    condition='페달과 기어 상태가 모두 VALID인가요?'
    paths=[{label:'예 · 모두 유효',result:'무효 입력에 의한 요청 차단 조건에 해당하지 않음'}, {label:'아니오 · 하나라도 무효',result:'추진 요청 0 · 방향 NONE · 유효성 INVALID'}]
    if(frame) active=valid?0:1
  } else if(id==='SWR-PROP-001') {
    context='유효성 검사를 통과한 입력에서 추진 허용 상태를 확인합니다.'
    condition='VehicleReady와 PropulsionEnable이 모두 true인가요?'
    paths=[{label:'예 · 추진 허용',result:'PROP_ENABLED · 추진 기능 활성화'},{label:'아니오 · 추진 억제',result:'PROP_DISABLED → 추진 요청 0'}]
    if(frame&&valid)active=enabled?0:1
  } else if(id==='SWR-PROP-004') {
    context='유효한 입력이고 추진이 활성화된 상태에서 실제 기어를 확인합니다. 페달이 0이면 방향은 NONE입니다.'
    condition='GearState는 어느 기어인가요?'
    paths=[{label:'P / N',result:'추진 억제 → 요청 0 · 방향 NONE'},{label:'D',result:'가속 입력 > 0 → FORWARD 요청'},{label:'R',result:'가속 입력 > 0 → REVERSE 요청'}]
    if(frame&&valid&&enabled)active=out?.gearState==='D'?1:out?.gearState==='R'?2:0
  } else {
    context='유효하고 방향이 지정된 0보다 큰 토크 요청에서, 해당 방향의 한계를 적용합니다.'
    condition='요청 토크가 방향별 한계 이하인가요?'
    paths=[{label:'예 · 한계 이하',result:'요청한 토크 크기 유지'},{label:'아니오 · 한계 초과',result:'해당 방향의 한계값으로 제한'}]
    const r=out?.driveTorqueRequest
    if(frame&&r?.validity==='VALID'&&r.direction!=='NONE'&&r.magnitudeNm>0)active=r.magnitudeNm<=frame.sw.calibration[r.direction==='REVERSE'?6:5]!?0:1
  }
  return <details className="case-requirement-flow"><summary>한 요구사항의 조건과 결과</summary>
    <label>살펴볼 요구사항<select aria-label="조건 흐름 요구사항" value={id} onChange={e=>{setId(e.target.value);onRequirement(e.target.value)}}>{choices.map(([value,label])=><option key={value} value={value}>{label} · {value}</option>)}</select></label>
    <button className="case-inline" onClick={()=>onRequirement(id)}><code>{id}</code> 요구사항 원문 보기</button>
    <p className="case-caption"><code>{req.allocatedComponent}</code> · {context}</p>
    <div className="requirement-flowchart" role="group" aria-label={id+' 조건 흐름도'}>
      <div className="flow-question"><b>◇ {condition}</b></div>
      <div className="flow-paths">{paths.map((path,i)=><div key={path.label} className={'flow-path'+(active===i?' expected-path':'')}><span className="flow-arrow">↓</span><b>{path.label}</b><div className="flow-result">{path.result}</div>{active===i&&<small>선택 시점의 기대 경로</small>}</div>)}</div>
    </div>
    <p className="case-caption">{active===null?'선행 조건을 확인하고 해당하는 경로를 따라가 보세요.':'초록색 경로의 기대 동작과 실제 출력을 비교해 원인을 밝혀주세요!'}</p>
  </details>
}
