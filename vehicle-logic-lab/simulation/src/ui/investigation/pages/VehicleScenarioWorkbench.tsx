import { useEffect, useMemo, useState, type Ref } from 'react'
import { createPortal } from 'react-dom'
import { supportedVehicleScenarioMonitors, techniqueCandidates, type VehicleScenarioDefinition, type VehicleScenarioMonitorId, type VehicleScenarioSnapshot, type VehicleStimulusProfile, type VehicleStimulusTargetId } from '../../../runtime/scenario/VehicleScenario.ts'
import { verificationMethodLabels, type InvestigationTarget, type TestDesignTechnique, type VerificationMethod } from '../../../runtime/investigation/Verification.ts'

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
  technique:TestDesignTechnique
  setupHost?:Element|null
  resultHost?:Element|null
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

export function VehicleScenarioWorkbench({scenario,investigationTarget,requirement,hypothesisId,onRun,onReplay,onAbort,onCollect,viewportSlotRef,technique,setupHost,resultHost}:Props){
  const [target,setTarget]=useState<VehicleStimulusTargetId>('accelerator')
  const [preconditionGear,setPreconditionGear]=useState<'P'|'R'|'N'|'D'>('D')
  const [profileKind,setProfileKind]=useState<VehicleStimulusProfile['kind']>('STEP')
  const [value,setValue]=useState(.65)
  const [energyAvailability,setEnergyAvailability]=useState<'AVAILABLE'|'UNAVAILABLE'|'INVALID'>('AVAILABLE')
  const [energyLimitEnabled,setEnergyLimitEnabled]=useState(false)
  const [energyLimit,setEnergyLimit]=useState(90)
  const [confirmedFault,setConfirmedFault]=useState(false)
  const [faultInjectionEnabled,setFaultInjectionEnabled]=useState(false)
  const [stabilityInterventionEnabled,setStabilityInterventionEnabled]=useState(false)
  const [collisionObstacleEnabled,setCollisionObstacleEnabled]=useState(false)
  const [collisionObstacleDistance,setCollisionObstacleDistance]=useState(8)
  const [occupantDemoEnabled,setOccupantDemoEnabled]=useState(false)
  const [leadVehicleEnabled,setLeadVehicleEnabled]=useState(false)
  const [leadVehicleDistance,setLeadVehicleDistance]=useState(18)
  const [leadVehicleSpeed,setLeadVehicleSpeed]=useState(4)
  const [adasDemoEnabled,setAdasDemoEnabled]=useState(false)
  const [useRequirement,setUseRequirement]=useState(false)
  const method:VerificationMethod='VEHICLE_RESPONSE_OBSERVATION'
  const [monitors,setMonitors]=useState<VehicleScenarioMonitorId[]>(['accelerator','vehicleMode','propulsionPermission','energyStatus','driveTorqueRequest','eDriveCommand','driveForce','speedKmh','longitudinalAcceleration'])
  useEffect(()=>{
    const clue=`${investigationTarget.domainScope??''} ${investigationTarget.id}`.toLowerCase()
    setPreconditionGear('D');setConfirmedFault(false);setFaultInjectionEnabled(false);setStabilityInterventionEnabled(false);setCollisionObstacleEnabled(false);setOccupantDemoEnabled(false);setLeadVehicleEnabled(false);setAdasDemoEnabled(false);setEnergyAvailability('AVAILABLE')
    if(/adas|\bacc\b|\baeb\b|\blka\b/.test(clue)){
      setTarget('accelerator');setValue(.65);setLeadVehicleEnabled(true);setAdasDemoEnabled(true);setMonitors(['accelerator','leadDistance','leadClosingSpeed','laneOffset','headingError','accStatus','aebStatus','lkaStatus','brakeForce','speedKmh'])
    }else if(/occupant|lf-occ/.test(clue)){
      setTarget('accelerator');setValue(1);setCollisionObstacleEnabled(true);setOccupantDemoEnabled(true);setMonitors(['accelerator','speedKmh','collisionActive','collisionImpulse'])
    }else if(/stability|lf-stb/.test(clue)){
      setTarget('brake');setValue(1);setStabilityInterventionEnabled(true);setMonitors(['brake','brakeForce','wheelContactCount','maxWheelSlipEstimate','yawRate','speedKmh'])
    }else if(/fault|lf-fm/.test(clue)){
      setTarget('accelerator');setValue(.75);setFaultInjectionEnabled(true);setMonitors(['accelerator','driveTorqueRequest','eDriveCommand','driveForce','speedKmh','longitudinalAcceleration'])
    }else if(/energy|lf-en/.test(clue)){
      setTarget('accelerator');setValue(.75);setEnergyAvailability('UNAVAILABLE');setMonitors(['accelerator','vehicleMode','propulsionPermission','energyStatus','maxDriveTorqueCandidate','driveForce','speedKmh'])
    }else if(/vehicle state|lf-vs/.test(clue)){
      setTarget('accelerator');setValue(.65);setConfirmedFault(true);setMonitors(['accelerator','gearState','vehicleMode','propulsionPermission','energyStatus','driveForce','speedKmh'])
    }else if(/gear|lf-gear/.test(clue)){
      setTarget('accelerator');setValue(.3);setPreconditionGear('R');setMonitors(['accelerator','gearState','propulsionRequest','driveTorqueRequest','driveForce','speedKmh','longitudinalVelocity'])
    }else if(clue.includes('brak')){
      setTarget('brake');setValue(.65);setMonitors(['brake','gearState','brakeForce','speedKmh','longitudinalAcceleration'])
    }else if(clue.includes('steer')){
      setTarget('steering');setValue(.5);setMonitors(['steering','speedKmh','positionX','positionZ','laneOffset','headingError','yawRate'])
    }else if(/communication|lf-com/.test(clue)){
      setTarget('accelerator');setValue(.65);setMonitors(['accelerator','driveTorqueRequest','eDriveCommand','driveForce','speedKmh'])
    }else if(/execution|lf-exe/.test(clue)){
      setTarget('accelerator');setValue(.65);setMonitors(['accelerator','propulsionRequest','eDriveCommand','driveForce','speedKmh','longitudinalAcceleration'])
    }else if(/sensing|lf-sen|environment|lf-env/.test(clue)){
      setTarget('steering');setValue(.25);setMonitors(['steering','surfaceType','surfaceFriction','wheelContactCount','speedKmh','positionX','positionZ','yawRate'])
    }else if(/motion coordination|lf-mc/.test(clue)){
      setTarget('accelerator');setValue(.65);setMonitors(['accelerator','brake','steering','propulsionRequest','driveForce','brakeForce','speedKmh','longitudinalAcceleration','yawRate'])
    }else{
      setTarget('accelerator');setValue(.65);setMonitors(['accelerator','gearState','vehicleMode','propulsionPermission','energyStatus','propulsionRequest','driveTorqueRequest','eDriveCommand','driveForce','speedKmh','longitudinalAcceleration'])
    }
  },[investigationTarget.domainScope,investigationTarget.id])
  const candidates=useMemo(()=>technique==='BOUNDARY_VALUE_ANALYSIS'||technique==='EQUIVALENCE_CLASS_ANALYSIS'?techniqueCandidates(target,technique):[],[target,technique])
  const running=scenario.status==='RUNNING',complete=scenario.status==='COMPLETED'
  const definition=scenario.definition
  const functionObservations=scenario.completedRun?.samples.at(-1)?.functionObservations??[]
  const executedFunctions=functionObservations.filter(item=>item.status==='EXECUTED').map(item=>item.functionId)
  const partialObservations=functionObservations.filter(item=>item.status==='OBSERVED_PARTIAL').map(item=>item.functionId)
  const endpointSample=scenario.completedRun?.interfaceTelemetry.find(item=>item.comparisonStatus==='MISMATCH')??scenario.completedRun?.interfaceTelemetry.at(-1)
  const faultSample=scenario.completedRun?.faultTelemetry.find(item=>item.active)
  const formatValue=(value:unknown)=>typeof value==='object'?JSON.stringify(value):String(value??'—')
  const stimulusStart=.75,stimulusDuration=2.25,totalDuration=4
  const toggleMonitor=(id:VehicleScenarioMonitorId)=>setMonitors(items=>items.includes(id)?items.filter(item=>item!==id):[...items,id])
  const run=()=>{
    const profile:VehicleStimulusProfile=profileKind==='CONSTANT'?{kind:'CONSTANT',value}:profileKind==='STEP'?{kind:'STEP',from:0,to:value,atSeconds:.25}:{kind:'LINEAR_RAMP',from:0,to:value,durationSeconds:1.5}
    const targetType:'FUNCTION'|'INTERFACE_BOUNDARY'|'ACTUATION_PLANT'=investigationTarget.type==='INTERFACE_BOUNDARY'||investigationTarget.type==='ACTUATION_PLANT'?investigationTarget.type:'FUNCTION'
    const scope={domain:investigationTarget.domainScope??'Vehicle Motion',targetType,targetId:investigationTarget.id}
    onRun({id:`scenario-${Date.now()}`,name:`${verificationMethodLabels[method].label} · ${targetCopy[target].label} ${profileKind}`,scope,preconditions:{gear:preconditionGear,vehicleAtRest:true},stimuli:[{target:{category:'DRIVER_INPUT',id:target,label:targetCopy[target].label},profile,startTimeSeconds:stimulusStart,durationSeconds:stimulusDuration}],monitors,expectedCriterion:useRequirement&&requirement?{kind:'REQUIREMENT',description:requirement.statement,requirementId:requirement.id}:{kind:'OBSERVATION_ONLY',description:'Expected trajectory를 만들지 않는 차량 반응 관찰'},durationSeconds:totalDuration,observationWindow:{startSeconds:stimulusStart,endSeconds:totalDuration},reset:{resetVehicle:true,resetDriverInputs:true,replayable:true},supportConditions:{confirmedFault,energy:{availability:energyAvailability,maxDriveTorqueCandidateNm:energyLimitEnabled?energyLimit:undefined},stabilityInterventionEnabled,occupantDemoEnabled,adasDemoEnabled},environment:collisionObstacleEnabled||leadVehicleEnabled?{collisionObstacle:collisionObstacleEnabled?{distanceAheadM:collisionObstacleDistance,halfWidthM:4}:undefined,leadVehicle:leadVehicleEnabled?{distanceAheadM:leadVehicleDistance,speedMps:leadVehicleSpeed,brakeAtSeconds:1.5}:undefined}:undefined,faultInjection:faultInjectionEnabled?{id:'ui-edrive-override',name:'eDrive interface override',injectionPointId:'INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND',targetType:'INTERFACE_BOUNDARY',targetId:'eDrive->DriveAdapter',faultType:'OVERRIDE_VALUE',activationStartSeconds:.9,activationEndSeconds:1.6,injectedValue:5,recoveryMode:'RESTORE_ORIGINAL_PATH',enabled:true}:undefined,verification:{hypothesisId,method,designTechnique:technique,executionMode:'VEHICLE_SCENARIO_TEST'}})
  }
  const setupPanel=<section className="verification-setup-card scenario-setup">
      <details className="scenario-config technical-detail-drawer"><summary><span><b>자유 차량 실험 설정</b><small>전체 차량 반응을 다른 조건으로 관찰할 때만 펼치세요.</small></span></summary><p className="investigation-section-label">6–9 · 전제조건 / 입력 / 관찰값 / 판정 기준</p><dl className="test-purpose-grid"><div><dt>시작 조건</dt><dd>기어 D · 차량 초기화 · 정지</dd></div><div><dt>계산 간격</dt><dd>1/60초 고정 간격</dd></div><div><dt>실행 시간</dt><dd>{totalDuration.toFixed(2)}초</dd></div><div><dt>관찰 구간</dt><dd>{stimulusStart.toFixed(2)}–{totalDuration.toFixed(2)}초</dd></div></dl>
        <label className="scenario-field"><span>Stimulus target</span><select value={target} onChange={event=>{setTarget(event.target.value as VehicleStimulusTargetId);setValue(event.target.value==='steering'?.5:.65)}}>{(Object.keys(targetCopy) as VehicleStimulusTargetId[]).map(id=><option key={id} value={id}>{targetCopy[id].label} · {targetCopy[id].description}</option>)}</select></label>
        <div className="scenario-profile"><span>Time profile</span>{(['CONSTANT','STEP','LINEAR_RAMP'] as const).map(item=><button type="button" key={item} aria-pressed={profileKind===item} onClick={()=>setProfileKind(item)}>{item}</button>)}</div>
        {candidates.length>0&&<div className="boundary-candidates"><span>{technique==='BOUNDARY_VALUE_ANALYSIS'?'실제 입력 범위 기반 후보':'등록 입력 구간 대표값'}</span>{candidates.map(candidate=><button type="button" key={candidate} aria-pressed={value===candidate} onClick={()=>setValue(candidate)}>{candidate}</button>)}</div>}
        <label className="numeric-control primary"><span><code>{target}</code><small>{target==='steering'?'-1–1':'0–1'} 실제 DriverInput 목표값</small></span><input type="number" min={target==='steering'?-1:0} max="1" step="0.05" value={value} onChange={event=>setValue(event.target.valueAsNumber)}/></label>
        <fieldset className="scenario-monitors"><legend>차량 지원 상태 · TRACKBACK 실행 모델</legend><label className="scenario-field"><span>시작 기어</span><select value={preconditionGear} onChange={event=>setPreconditionGear(event.target.value as 'P'|'R'|'N'|'D')}>{(['P','R','N','D'] as const).map(gear=><option key={gear}>{gear}</option>)}</select></label><label><input type="radio" name="energy-availability" checked={energyAvailability==='AVAILABLE'} onChange={()=>setEnergyAvailability('AVAILABLE')}/><span><b>Energy available</b><small>기존 기본 주행 조건</small></span></label><label><input type="radio" name="energy-availability" checked={energyAvailability==='UNAVAILABLE'} onChange={()=>setEnergyAvailability('UNAVAILABLE')}/><span><b>Energy unavailable</b><small>추진 허용을 제거하는 조건</small></span></label><label><input type="radio" name="energy-availability" checked={energyAvailability==='INVALID'} onChange={()=>setEnergyAvailability('INVALID')}/><span><b>Energy invalid</b><small>가용 상태 자체를 신뢰할 수 없는 조건</small></span></label><label><input type="checkbox" checked={confirmedFault} onChange={event=>setConfirmedFault(event.target.checked)}/><span><b>Confirmed fault condition</b><small>Vehicle State의 degraded availability 관찰</small></span></label><label><input type="checkbox" checked={faultInjectionEnabled} onChange={event=>setFaultInjectionEnabled(event.target.checked)}/><span><b>Interface fault injection</b><small>실제 eDrive 전달값 override와 recovery 관찰</small></span></label><label><input type="checkbox" checked={stabilityInterventionEnabled} onChange={event=>setStabilityInterventionEnabled(event.target.checked)}/><span><b>Stability intervention</b><small>실제 wheel slip 기반 TRACKBACK global scale · OEM ABS/TCS 아님</small></span></label><label><input type="checkbox" checked={collisionObstacleEnabled} onChange={event=>setCollisionObstacleEnabled(event.target.checked)}/><span><b>Physical collision obstacle</b><small>차량 전방의 실제 Rapier collider</small></span></label>{collisionObstacleEnabled&&<label className="numeric-control"><span><code>Obstacle distance</code><small>4 m 이상</small></span><input type="number" min="4" step="1" value={collisionObstacleDistance} onChange={event=>setCollisionObstacleDistance(event.target.valueAsNumber)}/></label>}<label><input type="checkbox" checked={occupantDemoEnabled} onChange={event=>setOccupantDemoEnabled(event.target.checked)}/><span><b>Occupant protection demo</b><small>실제 충돌 입력 · 물리 restraint/OEM threshold 없음</small></span></label><label><input type="checkbox" checked={energyLimitEnabled} onChange={event=>setEnergyLimitEnabled(event.target.checked)}/><span><b>Torque-limit candidate</b><small>배분 위치 OPEN · 명령에는 아직 적용하지 않음</small></span></label>{energyLimitEnabled&&<label className="numeric-control"><span><code>MaxDriveTorqueCandidate</code><small>Nm · simulation assumption</small></span><input type="number" min="0" step="5" value={energyLimit} onChange={event=>setEnergyLimit(event.target.valueAsNumber)}/></label>}</fieldset>
        <fieldset className="scenario-monitors"><legend>실도로 앞차 · ADAS 모델</legend><label><input type="checkbox" checked={leadVehicleEnabled} onChange={event=>setLeadVehicleEnabled(event.target.checked)}/><span><b>Physical lead vehicle</b><small>플레이어 앞의 실제 Rapier collider · 충돌 가능</small></span></label>{leadVehicleEnabled&&<><label className="numeric-control"><span><code>Initial distance</code><small>6 m 이상</small></span><input type="number" min="6" step="1" value={leadVehicleDistance} onChange={event=>setLeadVehicleDistance(event.target.valueAsNumber)}/></label><label className="numeric-control"><span><code>Lead speed</code><small>m/s · 1.5초 뒤 정지</small></span><input type="number" min="0" step="0.5" value={leadVehicleSpeed} onChange={event=>setLeadVehicleSpeed(event.target.valueAsNumber)}/></label></>}<label><input type="checkbox" checked={adasDemoEnabled} onChange={event=>setAdasDemoEnabled(event.target.checked)}/><span><b>TRACKBACK ACC / AEB / LKA demo</b><small>실제 앞차·경로 관측을 쓰는 모델 · GV70 OEM 로직 아님</small></span></label></fieldset>
        <fieldset className="scenario-monitors"><legend>동일 시간축 monitor</legend>{supportedVehicleScenarioMonitors.map(item=><label key={item.id}><input type="checkbox" checked={monitors.includes(item.id)} onChange={()=>toggleMonitor(item.id)}/><span><b>{item.label}</b><small>{item.group}{item.unit?` · ${item.unit}`:''}</small></span></label>)}</fieldset>
        {requirement&&<label className="scenario-requirement-toggle"><input type="checkbox" checked={useRequirement} onChange={event=>setUseRequirement(event.target.checked)}/><span><b>Requirement를 test basis로 첨부</b><small>Expected trajectory는 자동 생성하지 않습니다.</small></span></label>}
        <button type="button" className="verification-run-button" disabled={running||!monitors.length} onClick={run}>10 · 실제 차량 시나리오 실행 →</button>{running&&<button type="button" className="report-text-button" onClick={onAbort}>실행 중단</button>}
      </details>
    </section>
  const resultPanel=<section className="verification-execution-card scenario-result">
      <div ref={viewportSlotRef} className="scenario-live-viewport" aria-label="실시간 차량 화면"/>
      <header><div><p className="investigation-section-label">차량 반응 결과</p><h3>{running?'실제 차량 런타임 실행 중':complete?'차량 시나리오 결과':'실행 대기'}</h3></div><span className="verification-run-count">{scenario.elapsedSeconds.toFixed(2)} s</span></header>
      <p className="scenario-active-target"><small>선택 가설의 차량 시험 범위</small><strong>{investigationTarget.id}</strong><span>선택 기능을 포함한 실제 차량 경로의 반응을 관찰합니다.</span></p>
      <div className="scenario-phase-track" data-phase={scenario.phase}><span>PRECONDITION</span><span>STIMULUS</span><span>OBSERVATION</span><span>RESULT</span></div>
      <div className="scenario-viewport-note"><b>LIVE VEHICLE VIEWPORT</b><span>{running?'이 화면은 현재 시나리오가 구동하는 실제 Rapier 상태입니다.':'실행하면 위 차량 화면이 실제 런타임 상태로 전환됩니다.'}</span></div>
      {definition&&<div className="scenario-timeline"><span style={{left:'0%'}}>PRECONDITION</span><i style={{left:`${(Math.min(...definition.stimuli.map(item=>item.startTimeSeconds))/definition.durationSeconds)*100}%`}}>STIMULUS START</i>{definition.faultInjection&&<><i style={{left:`${(definition.faultInjection.activationStartSeconds/definition.durationSeconds)*100}%`}}>FAULT START</i><i style={{left:`${(definition.faultInjection.activationEndSeconds/definition.durationSeconds)*100}%`}}>FAULT END</i></>}<i style={{left:`${(definition.observationWindow.startSeconds/definition.durationSeconds)*100}%`}}>OBSERVATION</i><span style={{right:0}}>END</span></div>}
      {scenario.samples.length?<div className="scenario-traces">{(definition?.monitors??[]).map(id=><Trace key={id} id={id} snapshot={scenario}/>)}</div>:<div className="verification-empty-state"><strong>아직 차량 시나리오 기록이 없습니다.</strong><p>실행하면 선택한 monitor가 같은 1/60초 시간축으로 기록됩니다.</p></div>}
      {scenario.completedRun&&<><dl className="test-purpose-grid"><div><dt>기능 계산 실행</dt><dd>{executedFunctions.length} canonical functions</dd></div><div><dt>런타임 부분 관측</dt><dd>{partialObservations.length} canonical functions</dd></div><div><dt>Interface comparison</dt><dd>{scenario.completedRun.interfaceComparison}</dd></div><div><dt>Fault samples</dt><dd>{scenario.completedRun.faultTelemetry.filter(item=>item.active).length}</dd></div><div><dt>Recovery</dt><dd>{scenario.completedRun.faultTelemetry.some(item=>item.recoveryState==='RESTORED')?'RESTORED':'해당 없음'}</dd></div><div><dt>Verdict</dt><dd>OBSERVED</dd></div>{endpointSample&&<><div><dt><code>{endpointSample.sourceEndpointId}</code> · {endpointSample.sourceTimestampSeconds.toFixed(3)} s</dt><dd><code>{formatValue(endpointSample.sourceValue)}</code></dd></div><div><dt><code>{endpointSample.destinationEndpointId}</code> · {endpointSample.destinationTimestampSeconds.toFixed(3)} s</dt><dd><code>{formatValue(endpointSample.destinationValue)}</code></dd></div></>}{faultSample&&<><div><dt>Original · {faultSample.timestampSeconds.toFixed(3)} s</dt><dd><code>{formatValue(faultSample.originalValue)}</code></dd></div><div><dt>Injected / delivered</dt><dd><code>{formatValue(faultSample.deliveredValue)}</code></dd></div></>}</dl><details className="verification-result-summary"><summary>실행·관측한 canonical Function 구분</summary><p><b>실제 기능 계산:</b> {executedFunctions.join(' · ')||'없음'}</p><p><b>호스트 런타임 부분 관측:</b> {partialObservations.join(' · ')||'없음'}</p></details><section className="verification-interpretation"><p className="investigation-section-label">해석 경계</p><strong>{scenario.completedRun.interpretation}</strong><small>부분 관측은 해당 Function의 완전한 독립 모델·Expected가 아닙니다. 양단 MATCH/MISMATCH도 전달 비교 상태이며 근본 원인 또는 차량 PASS/FAIL 판정이 아닙니다.</small></section><div className="verification-result-actions"><button type="button" onClick={onReplay}>RESET · REPLAY</button><button type="button" className="save-comparison-button" onClick={()=>onCollect(scenario.completedRun!.runId)}>Vehicle Scenario Evidence 저장</button></div></>}
    </section>
  return <>{setupHost?createPortal(setupPanel,setupHost):setupPanel}{resultHost?createPortal(resultPanel,resultHost):resultPanel}</>
}
