import {useEffect,useState} from 'react'
import {MODEL_SPECS,ROUNDS} from './domainTraining'
import type {DomainId,LogicId} from './domainTraining'
import {MODEL_ALLOCATION} from './vehicleArchitecture'
import {VehicleFlowIllustration} from './VehicleFlowIllustration'
import './logicHierarchyPanel.css'

type Level='system'|'domain'|'function'
export function LogicHierarchyPanel({level,id,onLevel}:{level:Level;id:LogicId;onLevel:(level:Level|'logic')=>void}){
 const round=ROUNDS.find(item=>item.models.includes(id))
 const [selectedDomain,setSelectedDomain]=useState<DomainId>(round?.id??'drive'),[selectedModel,setSelectedModel]=useState<LogicId>(id)
 useEffect(()=>{setSelectedDomain(round?.id??'drive');setSelectedModel(id)},[id])
 const shownRound=ROUNDS.find(item=>item.id===selectedDomain)!,shownSpec=MODEL_SPECS[selectedModel]
 return <section className="d16-hierarchy-panel" aria-label={`${level} 서브시스템`}>
  <header><small>System / {shownRound.name} / {shownSpec.function}</small><h2>{level==='system'?'흰둥의 EV 차량 시스템':level==='domain'?`${shownRound.name} 도메인`:`${shownSpec.function} 기능`}</h2></header>
  {level==='system'?<div className="d16-hierarchy-grid">{ROUNDS.map(item=><button key={item.id} className={selectedDomain===item.id?'active':''} onClick={()=>{setSelectedDomain(item.id);setSelectedModel(item.models[0]);onLevel('domain')}}><span>Domain</span><b>{item.name}</b><small>{item.models.map(model=>MODEL_SPECS[model].function).join(' · ')}</small></button>)}</div>:level==='domain'?<div className="d16-hierarchy-grid">{shownRound.models.map(model=><button key={model} className={model===selectedModel?'active':''} onClick={()=>{setSelectedModel(model);onLevel('function')}}><span>Function</span><b>{MODEL_SPECS[model].function}</b><small>{MODEL_SPECS[model].inputs.map(port=>port.name).join(' · ')} → {MODEL_SPECS[model].outputs.map(port=>port.name).join(' · ')}</small></button>)}</div>:<><VehicleFlowIllustration domain={shownRound.id} focusId={selectedModel}/><div className="d16-hierarchy-flow"><span>입력 센서</span><i>→</i><span>{MODEL_ALLOCATION[selectedModel].ecu}<small>{MODEL_ALLOCATION[selectedModel].swc}</small></span><i>→</i><span>출력·액추에이터</span></div></>}
  <button className="d16-hierarchy-open" onClick={()=>onLevel(level==='system'?'domain':level==='domain'?'function':'logic')}>한 단계 안으로 들어가기 →</button>
 </section>
}
