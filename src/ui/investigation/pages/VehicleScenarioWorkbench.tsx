import { useMemo, useState, type Ref } from 'react'
import { supportedVehicleScenarioMonitors, techniqueCandidates, type VehicleScenarioDefinition, type VehicleScenarioMonitorId, type VehicleScenarioSnapshot, type VehicleStimulusProfile, type VehicleStimulusTargetId } from '../../../runtime/scenario/VehicleScenario.ts'
import { testDesignTechniqueLabels, verificationMethodLabels, type InvestigationTarget, type TestDesignTechnique, type VerificationMethod } from '../../../runtime/investigation/Verification.ts'

interface Props{
  scenario:VehicleScenarioSnapshot
  investigationTarget:InvestigationTarget
  requirement?:{id:string;statement:string}
  hypothesisId?:string
  onRun:(definition:VehicleScenarioDefinition)=>void
  onReplay:()=>void
  onAbort:()=>void
  onCollect:(scenarioId:string)=>void
  onOpenRequirement:(id:string)=>void
  viewportSlotRef?:Ref<HTMLDivElement>
}
const targetCopy:Record<VehicleStimulusTargetId,{label:string;description:string}>={
  accelerator:{label:'Accelerator',description:'실제 DriverInput 가속 페달 목표값'},
  brake:{label:'Brake',description:'실제 DriverInput 브레이크 목표값'},
  steering:{label:'Steering',description:'실제 DriverInput 조향 목표값'},
}
const numeric=(value:number|string|undefined)=>typeof value==='number'&&Number.isFinite(value)?value:undefined

function Trace({id,snapshot}:{id:VehicleScenarioMonitorId;snapshot:VehicleScenarioSnapshot}){
  const meta=supportedVehicleScenarioMonitors.find(item=>item.id===id)!
  const points=snapshot.samples.map(item=>({t:item.timeSeconds,v:numeric(item.values[id])})).filter((item):item is {t:number;v:number}=>item.v!==undefined)
  if(!points.length)return <article className="scenario-trace-row"><span><b>{meta.label}</b><small>{meta.group}</small></span><p>숫자 trace 없음</p></article>
  const min=Math.min(...points.map(item=>item.v)),max=Math.max(...points.map(item=>item.v)),duration=snapshot.definition?.durationSeconds??1,span=max-min||1
  const path=points.map((item,index)=>`${index?'L':'M'} ${(item.t/duration)*100} ${28-((item.v-min)/span)*24}`).join(' ')
  return <article className="scenario-trace-row"><span><b>{meta.label}</b><small>{meta.group} · {min.toFixed(2)}–{max.toFixed(2)} {meta.unit??''}</small></span><svg viewBox="0 0 100 32" preserveAspectRatio="none" aria-label={`${meta.label} synchronized trace`}><path d={path}/></svg></article>
}

export function VehicleScenarioWorkbench({scenario,requirement,hypothesisId,onRun,onReplay,onAbort,onCollect,onOpenRequirement,viewportSlotRef}:Props){
  const [target,setTarget]=useState<VehicleStimulusTargetId>('accelerator')
  const [profileKind,setProfileKind]=useState<VehicleStimulusProfile['kind']>('STEP')
  const [value,setValue]=useState(.65)
  const [technique,setTechnique]=useState<TestDesignTechnique>('ERROR_GUESSING')
  const [useRequirement,setUseRequirement]=useState(false)
  const method:VerificationMethod='VEHICLE_RESPONSE_OBSERVATION'
  const [monitors,setMonitors]=useState<VehicleScenarioMonitorId[]>(['accelerator','driveTorqueRequest','eDriveCommand','driveForce','speedKmh','longitudinalAcceleration'])
  const candidates=useMemo(()=>technique==='BOUNDARY_VALUE_ANALYSIS'||technique==='EQUIVALENCE_CLASS_ANALYSIS'?techniqueCandidates(target,technique):[],[target,technique])
  const running=scenario.status==='RUNNING',complete=scenario.status==='COMPLETED'
  const definition=scenario.definition
  const endpointSample=scenario.completedRun?.interfaceTelemetry.find(item=>item.comparisonStatus==='MISMATCH')??scenario.completedRun?.interfaceTelemetry.at(-1)
  const faultSample=scenario.completedRun?.faultTelemetry.find(item=>item.active)
  const formatValue=(value:unknown)=>typeof value==='object'?JSON.stringify(value):String(value??'—')
  const stimulusStart=.75,stimulusDuration=2.25,totalDuration=4
  const toggleMonitor=(id:VehicleScenarioMonitorId)=>setMonitors(items=>items.includes(id)?items.filter(item=>item!==id):[...items,id])
  const run=()=>{
    const profile:VehicleStimulusProfile=profileKind==='CONSTANT'?{kind:'CONSTANT',value}:profileKind==='STEP'?{kind:'STEP',from:0,to:value,atSeconds:.25}:{kind:'LINEAR_RAMP',from:0,to:value,durationSeconds:1.5}
    const scope={domain:'Vehicle Motion',targetType:'ACTUATION_PLANT' as const,targetId:'VehiclePhysics'}
    onRun({id:`scenario-${Date.now()}`,name:`${verificationMethodLabels[method].label} · ${targetCopy[target].label} ${profileKind}`,scope,preconditions:{gear:'D',vehicleAtRest:true},stimuli:[{target:{category:'DRIVER_INPUT',id:target,label:targetCopy[target].label},profile,startTimeSeconds:stimulusStart,durationSeconds:stimulusDuration}],monitors,expectedCriterion:useRequirement&&requirement?{kind:'REQUIREMENT',description:requirement.statement,requirementId:requirement.id}:{kind:'OBSERVATION_ONLY',description:'Expected trajectory를 만들지 않는 차량 반응 관찰'},durationSeconds:totalDuration,observationWindow:{startSeconds:stimulusStart,endSeconds:totalDuration},reset:{resetVehicle:true,resetDriverInputs:true,replayable:true},verification:{hypothesisId,method,designTechnique:technique,executionMode:'VEHICLE_SCENARIO_TEST'}})
  }
  return <div className="vehicle-scenario-workbench">
    <section className="verification-method-picker scenario-method"><header><div><p className="investigation-section-label">4 · 차량 반응 관찰</p><h3>실제 차량 런타임</h3></div><span>LIVE VEHICLE RUNTIME · RAPIER</span></header><p>선택한 입력을 차량에 적용하고 실시간으로 반응을 관찰합니다.</p></section>
    <div className="verification-workbench scenario-grid"><section className="verification-setup-card"><header><div><p className="investigation-section-label">5 · TEST DESIGN TECHNIQUE</p><h3>시험 조건을 만드는 방법</h3></div></header>
      <div className="technique-picker">{(Object.keys(testDesignTechniqueLabels) as TestDesignTechnique[]).map(item=>{const copy=testDesignTechniqueLabels[item],disabled=item==='REQUIREMENTS_ANALYSIS'&&!requirement;return <button type="button" key={item} disabled={disabled} aria-pressed={technique===item} onClick={()=>{setTechnique(item);if(item==='REQUIREMENTS_ANALYSIS')setUseRequirement(true)}}><strong>{copy.label}</strong><span>{copy.description}</span><small>{disabled?'관련 요구사항 없음':copy.produces}</small></button>})}</div>
      {technique==='REQUIREMENTS_ANALYSIS'&&requirement&&<aside className="imported-requirement-basis"><span>실제 요구사항에서 가져온 시험 기준 후보</span><code>{requirement.id}</code><p>{requirement.statement}</p><button type="button" onClick={()=>onOpenRequirement(requirement.id)}>원문 보기</button></aside>}
      <div className="scenario-config"><p className="investigation-section-label">6–9 · PRECONDITIONS / STIMULUS / MONITORS / ORACLE</p><dl className="test-purpose-grid"><div><dt>Precondition</dt><dd>Gear D · vehicle reset · at rest</dd></div><div><dt>Runtime step</dt><dd>1/60 s fixed step</dd></div><div><dt>Duration</dt><dd>{totalDuration.toFixed(2)} s</dd></div><div><dt>Observation</dt><dd>{stimulusStart.toFixed(2)}–{totalDuration.toFixed(2)} s</dd></div></dl>
        <label className="scenario-field"><span>Stimulus target</span><select value={target} onChange={event=>{setTarget(event.target.value as VehicleStimulusTargetId);setValue(event.target.value==='steering'?.5:.65)}}>{(Object.keys(targetCopy) as VehicleStimulusTargetId[]).map(id=><option key={id} value={id}>{targetCopy[id].label} · {targetCopy[id].description}</option>)}</select></label>
        <div className="scenario-profile"><span>Time profile</span>{(['CONSTANT','STEP','LINEAR_RAMP'] as const).map(item=><button type="button" key={item} aria-pressed={profileKind===item} onClick={()=>setProfileKind(item)}>{item}</button>)}</div>
        {candidates.length>0&&<div className="boundary-candidates"><span>{technique==='BOUNDARY_VALUE_ANALYSIS'?'실제 입력 범위 기반 후보':'등록 입력 구간 대표값'}</span>{candidates.map(candidate=><button type="button" key={candidate} aria-pressed={value===candidate} onClick={()=>setValue(candidate)}>{candidate}</button>)}</div>}
        <label className="numeric-control primary"><span><code>{target}</code><small>{target==='steering'?'-1–1':'0–1'} 실제 DriverInput 목표값</small></span><input type="number" min={target==='steering'?-1:0} max="1" step="0.05" value={value} onChange={event=>setValue(event.target.valueAsNumber)}/></label>
        <fieldset className="scenario-monitors"><legend>동일 시간축 monitor</legend>{supportedVehicleScenarioMonitors.map(item=><label key={item.id}><input type="checkbox" checked={monitors.includes(item.id)} onChange={()=>toggleMonitor(item.id)}/><span><b>{item.label}</b><small>{item.group}{item.unit?` · ${item.unit}`:''}</small></span></label>)}</fieldset>
        {requirement&&<label className="scenario-requirement-toggle"><input type="checkbox" checked={useRequirement} onChange={event=>setUseRequirement(event.target.checked)}/><span><b>Requirement를 test basis로 첨부</b><small>Expected trajectory는 자동 생성하지 않습니다.</small></span></label>}
        <button type="button" className="verification-run-button" disabled={running||!monitors.length} onClick={run}>10 · 실제 차량 시나리오 실행 →</button>{running&&<button type="button" className="report-text-button" onClick={onAbort}>실행 중단</button>}
      </div>
    </section><section className="verification-execution-card scenario-result"><header><div><p className="investigation-section-label">11–13 · RUN / OBSERVE / INTERPRET</p><h3>{running?'실제 차량 런타임 실행 중':complete?'차량 시나리오 결과':'실행 대기'}</h3></div><span className="verification-run-count">{scenario.elapsedSeconds.toFixed(2)} s</span></header>
      <div className="scenario-phase-track" data-phase={scenario.phase}><span>PRECONDITION</span><span>STIMULUS</span><span>OBSERVATION</span><span>RESULT</span></div>
      <div ref={viewportSlotRef} className="scenario-live-viewport" aria-label="실시간 차량 화면"/>
      <div className="scenario-viewport-note"><b>LIVE VEHICLE VIEWPORT</b><span>{running?'이 화면은 현재 시나리오가 구동하는 실제 Rapier 상태입니다.':'실행하면 위 차량 화면이 실제 런타임 상태로 전환됩니다.'}</span></div>
      {definition&&<div className="scenario-timeline"><span style={{left:'0%'}}>PRECONDITION</span><i style={{left:`${(Math.min(...definition.stimuli.map(item=>item.startTimeSeconds))/definition.durationSeconds)*100}%`}}>STIMULUS START</i>{definition.faultInjection&&<><i style={{left:`${(definition.faultInjection.activationStartSeconds/definition.durationSeconds)*100}%`}}>FAULT START</i><i style={{left:`${(definition.faultInjection.activationEndSeconds/definition.durationSeconds)*100}%`}}>FAULT END</i></>}<i style={{left:`${(definition.observationWindow.startSeconds/definition.durationSeconds)*100}%`}}>OBSERVATION</i><span style={{right:0}}>END</span></div>}
      {scenario.samples.length?<div className="scenario-traces">{(definition?.monitors??[]).map(id=><Trace key={id} id={id} snapshot={scenario}/>)}</div>:<div className="verification-empty-state"><strong>아직 차량 시나리오 기록이 없습니다.</strong><p>실행하면 선택한 monitor가 같은 1/60초 시간축으로 기록됩니다.</p></div>}
      {scenario.completedRun&&<><dl className="test-purpose-grid"><div><dt>Interface comparison</dt><dd>{scenario.completedRun.interfaceComparison}</dd></div><div><dt>Fault samples</dt><dd>{scenario.completedRun.faultTelemetry.filter(item=>item.active).length}</dd></div><div><dt>Recovery</dt><dd>{scenario.completedRun.faultTelemetry.some(item=>item.recoveryState==='RESTORED')?'RESTORED':'해당 없음'}</dd></div><div><dt>Verdict</dt><dd>OBSERVED</dd></div>{endpointSample&&<><div><dt><code>{endpointSample.sourceEndpointId}</code> · {endpointSample.sourceTimestampSeconds.toFixed(3)} s</dt><dd><code>{formatValue(endpointSample.sourceValue)}</code></dd></div><div><dt><code>{endpointSample.destinationEndpointId}</code> · {endpointSample.destinationTimestampSeconds.toFixed(3)} s</dt><dd><code>{formatValue(endpointSample.destinationValue)}</code></dd></div></>}{faultSample&&<><div><dt>Original · {faultSample.timestampSeconds.toFixed(3)} s</dt><dd><code>{formatValue(faultSample.originalValue)}</code></dd></div><div><dt>Injected / delivered</dt><dd><code>{formatValue(faultSample.deliveredValue)}</code></dd></div></>}</dl><section className="verification-interpretation"><p className="investigation-section-label">해석 경계</p><strong>{scenario.completedRun.interpretation}</strong><small>양단 MATCH/MISMATCH는 전달 비교 상태이며 근본 원인 또는 차량 PASS/FAIL 판정이 아닙니다.</small></section><div className="verification-result-actions"><button type="button" onClick={onReplay}>RESET · REPLAY</button><button type="button" className="save-comparison-button" onClick={()=>onCollect(scenario.completedRun!.runId)}>Vehicle Scenario Evidence 저장</button></div></>}
    </section></div>
  </div>
}
