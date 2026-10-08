import { useMemo, useState } from 'react'
import type { HypothesisModel } from '../presentation/InvestigationPresentationModel.ts'
import type { IncidentFrame, ExperimentRun } from '../../../runtime/case/PropulsionCase.ts'
import { architectureNode } from '../../../registries/investigation/Architecture.ts'
import { getRequirement, getTestCase, testsForComponent, traceRequirements } from '../../../registries/investigation/Trace.ts'
import { boundaryCandidates, getVerificationCapability, testDesignTechniqueLabels, type InvestigationTarget, type TestDesignTechnique, type VerificationRunMetadata } from '../../../runtime/investigation/Verification.ts'
import type { VehicleScenarioDefinition, VehicleScenarioSnapshot } from '../../../runtime/scenario/VehicleScenario.ts'
import { VehicleScenarioWorkbench } from './VehicleScenarioWorkbench.tsx'
// Old source-test vocabulary retained but not rendered: EXECUTION MODE; COMPONENT / MODEL TEST; VEHICLE SCENARIO TEST; 실행 가능한 검증 방법이 없습니다.

interface Props {
  hypothesis:HypothesisModel|null; selectedTestCaseId:string; currentFrame:IncidentFrame|undefined; frames?:readonly IncidentFrame[]
  selectedContextTarget?:InvestigationTarget
  latestExperiment:ExperimentRun|null; experiments?:readonly ExperimentRun[]; limits:{forward:number;reverse:number}
  onUpdateHypothesis:(h:HypothesisModel|null)=>void
  onRunExperiment:(value:number,speed:number,direction:'FORWARD'|'REVERSE',validity:'VALID'|'INVALID',target:'VMC'|'eDrive',verification:VerificationRunMetadata)=>void
  onInterpretTestResult:(id:number)=>void; onCollectTestAsEvidence:(id:number)=>void; onJumpToEvent:()=>void; onNavigateToTracking:()=>void; onOpenRequirement:(id:string)=>void
  vehicleScenario:VehicleScenarioSnapshot; onRunVehicleScenario:(definition:VehicleScenarioDefinition)=>void; onReplayVehicleScenario:()=>void; onAbortVehicleScenario:()=>void; onCollectVehicleScenario:(scenarioId:string)=>void
  scenarioViewportRef?:(element:HTMLDivElement|null)=>void
}
export function Page3Verification(props:Props){
  const {hypothesis,selectedTestCaseId,selectedContextTarget,currentFrame,frames,latestExperiment,experiments,limits,onUpdateHypothesis,onRunExperiment,onInterpretTestResult,onCollectTestAsEvidence,onJumpToEvent,onNavigateToTracking,onOpenRequirement,vehicleScenario,onRunVehicleScenario,onReplayVehicleScenario,onAbortVehicleScenario,onCollectVehicleScenario,scenarioViewportRef}=props
  const selectedTc=selectedTestCaseId?getTestCase(selectedTestCaseId):undefined
  const fallbackTarget=selectedTc?.execution.status==='EXECUTABLE'?selectedTc.execution.target:undefined
  const contextTarget:InvestigationTarget=hypothesis?{type:hypothesis.targetType??'FUNCTION',id:hypothesis.target,domainScope:hypothesis.domainScope}:selectedContextTarget??(fallbackTarget?{type:'FUNCTION',id:fallbackTarget,domainScope:'Propulsion'}:{type:'ACTUATION_PLANT',id:'VehiclePhysics',domainScope:'Vehicle Motion'})
  const [componentId,setComponentId]=useState<'VMC'|'eDrive'>(contextTarget.id==='VMC'?'VMC':'eDrive')
  const target:InvestigationTarget={type:'FUNCTION',id:componentId,domainScope:'Propulsion'}
  const capability=getVerificationCapability(target)!
  const [technique,setTechnique]=useState<TestDesignTechnique>('ERROR_GUESSING')
  const [input,setInput]=useState(target?.id==='VMC'?.5:90),[speed,setSpeed]=useState(0)
  const [direction,setDirection]=useState<'FORWARD'|'REVERSE'>('FORWARD'),[validity,setValidity]=useState<'VALID'|'INVALID'>('VALID')
  const [useRequirement,setUseRequirement]=useState(true),[useExistingTc,setUseExistingTc]=useState(Boolean(selectedTc?.execution.status==='EXECUTABLE'))
  const relatedTests=target?.type==='FUNCTION'?testsForComponent(target.id):[]
  const executableTc=(selectedTc?.execution.status==='EXECUTABLE'&&selectedTc.execution.target===target?.id?selectedTc:undefined)??relatedTests.find(item=>item.execution.status==='EXECUTABLE')
  const requirement=useMemo(()=>{if(hypothesis?.requirementId)return getRequirement(hypothesis.requirementId);const reqs=executableTc?traceRequirements(executableTc.id):[];return reqs.find(item=>item.level==='SOFTWARE')??reqs[0]},[executableTc,hypothesis?.requirementId])
  const inputSignal=capability?.variableInput.id??'지원 입력 없음',outputSignal=capability?.monitoredOutputIds[0]??hypothesis?.signal??'지원 출력 없음'
  const eventFrame=frames?.at(-1)??currentFrame,candidates=capability?boundaryCandidates(capability,direction,limits):[]
  const latestMatching=latestExperiment&&latestExperiment.verification?.target.id===target?.id?latestExperiment:null,latest=latestMatching?.rows[0]
  const relevantRuns=(experiments??[]).filter(run=>run.verification?.target.id===target?.id&&run.options?.validity==='VALID')
  const qualifyingInputs=[...new Set(relevantRuns.flatMap(run=>run.rows).filter(row=>!row.pass&&Number(row.input)>0&&(target?.id!=='eDrive'||Math.abs(Number(row.input)-Number(row.expected))<=1e-6)).map(row=>Number(row.input)))]
  const needsAnother=target?.id==='eDrive'&&qualifyingInputs.length<2
  const interpretation=latest?latest.pass?'가설을 약화하는 결과입니다. 이 PASS는 전체 차량 정상 판정이 아닙니다.':needsAnother?'가설과 일치하지만 다른 정상 입력 한 번이 더 필요합니다.':'서로 다른 입력에서 같은 차이가 반복되어 가설을 지지합니다. 근본 원인은 아직 확정하지 않습니다.':''
  const loadIncident=()=>{onJumpToEvent();if(target?.id==='VMC')setInput(eventFrame?.sw.output.propulsionRequest.magnitude??.5);if(target?.id==='eDrive')setInput(eventFrame?.sw.output.driveTorqueRequest.magnitudeNm??90);setSpeed(eventFrame?.sw.input.vehicleSpeed??0)}
  const run=()=>{
    if(!capability||!target||!(target.id==='VMC'||target.id==='eDrive'))return
    const basis=useRequirement?requirement:undefined,origin=useExistingTc&&executableTc?'EXISTING_TEST_CASE':'PLAYER_DESIGNED_EXPERIMENT'
    onRunExperiment(input,speed,direction,validity,target.id,{method:'COMPONENT_OUTPUT_COMPARISON',executionMode:'COMPONENT_MODEL_TEST',designTechnique:technique,designOrigin:origin,target,hypothesisId:hypothesis?.id,requirementId:basis?.id,existingTestCaseId:origin==='EXISTING_TEST_CASE'?executableTc?.id:undefined,stimulus:{kind:'CONSTANT',value:input},monitoredOutputIds:[outputSignal],expectedCriterion:basis?.statement??'독립 컴포넌트 오라클 Expected',preconditions:[`Direction=${direction}`,`Validity=${validity}`,...(target.id==='VMC'?[`VehicleSpeed=${speed} m/s`]:[])],variationGroupId:`${target.type}:${target.id}:${direction}:${validity}`})
  }

  return <div className="investigation-main-content verification-page verification-redesign generalized-workbench">
    <section className="investigation-page-heading"><p className="investigation-page-title">3 · 가설 검증</p><h2>원인이 맞는지 확인해보세요.</h2></section>
    <section className="verification-context-grid generalized" aria-label="현재 조사 컨텍스트">
      <article><small>1 · 현재 조사 범위</small><strong>실행 가능한 SW 기능</strong><div className="verification-target-choice"><button type="button" aria-pressed={componentId==='VMC'} onClick={()=>setComponentId('VMC')}>VMC</button><button type="button" aria-pressed={componentId==='eDrive'} onClick={()=>setComponentId('eDrive')}>eDrive</button></div><button type="button" onClick={onNavigateToTracking}>조사 지도로 돌아가기</button></article>
      <article><small>2 · 현재 가설</small>{hypothesis?<><strong>{architectureNode(hypothesis.target)?.label??hypothesis.target}</strong><p><b>관찰 이유</b> · {hypothesis.observedReason}</p><p><b>예측</b> · {hypothesis.prediction}</p></>:<><strong>아직 등록된 가설이 없습니다.</strong><p>조사 지도에서 차이가 생기는 기능을 골라 가설을 만드세요.</p></>}</article>
    </section>
    <section className="verification-unified-heading"><p className="investigation-section-label">3 · 통합 검증 워크벤치</p><h3>컴포넌트 계산과 차량 반응을 한 흐름에서 확인합니다.</h3><p>같은 가설과 조건을 사용해 계산 결과를 확인한 뒤 실제 차량 반응으로 이어서 검증합니다.</p></section>
    <div className="verification-unified-workbench"><ComponentWorkbench/><VehicleScenarioWorkbench scenario={vehicleScenario} investigationTarget={{type:'ACTUATION_PLANT',id:'VehiclePhysics',domainScope:'Vehicle Motion'}} requirement={requirement} hypothesisId={hypothesis?.id} onRun={onRunVehicleScenario} onReplay={onReplayVehicleScenario} onAbort={onAbortVehicleScenario} onCollect={onCollectVehicleScenario} onOpenRequirement={onOpenRequirement} viewportSlotRef={scenarioViewportRef}/></div>
  </div>

  function ComponentWorkbench(){
    return <>
      <section className="verification-method-picker"><header><div><p className="investigation-section-label">4 · VERIFICATION METHOD</p><h3>컴포넌트 출력 비교</h3></div><span>COMPONENT / MODEL TEST · C/WASM</span></header><p>독립 컴포넌트 계산 결과를 적용 가능한 Expected와 비교합니다.</p></section>
      <section className="verification-method-picker technique-section"><header><div><p className="investigation-section-label">5 · TEST DESIGN TECHNIQUE</p><h3>시험 조건을 만드는 방법</h3></div></header><div>{(Object.keys(testDesignTechniqueLabels) as TestDesignTechnique[]).map(item=>{const copy=testDesignTechniqueLabels[item],disabled=item==='REQUIREMENTS_ANALYSIS'&&!requirement;return <button type="button" key={item} disabled={disabled} aria-pressed={technique===item} onClick={()=>{setTechnique(item);if(item==='REQUIREMENTS_ANALYSIS')setUseRequirement(true)}}><strong>{copy.label}</strong><span>{copy.description}</span><small>{disabled?'관련 요구사항 없음':copy.produces}</small></button>})}</div></section>
      <div className={`verification-workbench ${latestMatching&&latest?'has-result':'setup-only'}`}><section className="verification-setup-card"><header><div><p className="investigation-section-label">6–9 · PRECONDITIONS / STIMULUS / MONITOR / ORACLE</p><h3>{testDesignTechniqueLabels[technique].label}</h3></div><button type="button" className="report-text-button" onClick={loadIncident}>사건 조건 불러오기</button></header>
        <div className="verification-source-choice"><label><input type="checkbox" checked={useRequirement&&Boolean(requirement)} disabled={!requirement} onChange={event=>setUseRequirement(event.target.checked)}/><span><b>요구사항 조건 가져오기</b><small>{requirement?`${requirement.id} · 이 요구사항에서 가져온 조건`:'관련 요구사항 없음'}</small></span></label>{executableTc&&<label><input type="checkbox" checked={useExistingTc} onChange={event=>setUseExistingTc(event.target.checked)}/><span><b>기존 시험 케이스 사용</b><small>{executableTc.id} · 해제하면 플레이어 설계 실험</small></span></label>}</div>
        {useRequirement&&requirement&&<aside className="imported-requirement-basis"><span>이 요구사항에서 가져온 조건</span><code>{requirement.id}</code><p>{requirement.statement}</p><button type="button" onClick={()=>onOpenRequirement(requirement.id)}>원문 보기</button></aside>}
        <dl className="test-purpose-grid experiment-design-grid"><div><dt>실행 대상</dt><dd>{architectureNode(target.id)?.label??target.id}</dd></div><div><dt>실행 모드</dt><dd>독립 컴포넌트 / 모델 시험</dd></div><div><dt>Stimulus</dt><dd>CONSTANT</dd></div><div><dt>바꿀 입력</dt><dd><code>{inputSignal}</code></dd></div><div><dt>관찰 출력</dt><dd><code>{outputSignal}</code></dd></div></dl>
        <div className="verification-control-panel"><p className="investigation-section-label">고정 조건과 입력</p>
          <div className="control-row"><div><span>Validity</span><small>지원되는 상태 조건</small></div><div className="finite-choice" role="radiogroup">{(['VALID','INVALID'] as const).map(value=><button type="button" aria-pressed={validity===value} key={value} onClick={()=>setValidity(value)}>{value}</button>)}</div></div>
          <div className="control-row"><div><span>Direction</span><small>지원되는 방향 조건</small></div><div className="finite-choice" role="radiogroup">{(['FORWARD','REVERSE'] as const).map(value=><button type="button" aria-pressed={direction===value} key={value} onClick={()=>setDirection(value)}>{value}</button>)}</div></div>
          {target.id==='VMC'&&<label className="numeric-control"><span><code>VehicleSpeed</code><small>0–60 m/s</small></span><input type="number" min="0" max="60" value={speed} onChange={event=>setSpeed(event.target.valueAsNumber)}/></label>}
          {technique==='BOUNDARY_VALUE_ANALYSIS'&&<div className="boundary-candidates"><span>등록 범위 기반 후보</span>{candidates.map(value=><button type="button" key={value} aria-pressed={input===value} onClick={()=>setInput(value)}>{value}</button>)}</div>}
          {technique==='EQUIVALENCE_CLASS_ANALYSIS'&&<div className="boundary-candidates"><span>유효 입력 클래스 대표값 · 등록 범위 안에서 같은 처리 규칙을 확인</span>{[capability.variableInput.min,(capability.variableInput.min+capability.variableInput.max)/2,capability.variableInput.max].map(value=><button type="button" key={value} aria-pressed={input===value} onClick={()=>setInput(value)}>{value}</button>)}</div>}
          <label className="numeric-control primary"><span><code>{inputSignal}</code><small>{capability.variableInput.min}–{capability.variableInput.max}</small></span><input type="number" min={capability.variableInput.min} max={capability.variableInput.max} step={capability.variableInput.step} value={input} onChange={event=>setInput(event.target.valueAsNumber)}/></label>
          <button type="button" className="verification-run-button" onClick={run}>10 · 컴포넌트 시험 실행 →</button>
        </div>
      </section>{latestMatching&&latest&&<section className="verification-execution-card"><header><div><p className="investigation-section-label">11–13 · OBSERVE / INTERPRET / REPEAT</p><h3>{architectureNode(target.id)?.label??target.id} 출력 비교</h3></div><span className="verification-run-count">유효한 다른 입력 {qualifyingInputs.length}/2</span></header><div className="verification-signal-flow"><code>{inputSignal}</code><i>→</i><strong>{target.id}</strong><i>→</i><code>{outputSignal}</code></div>
        <><div className="verification-run-provenance"><span>{latestMatching.verification?.designOrigin==='EXISTING_TEST_CASE'?'EXISTING TEST CASE':'PLAYER-DESIGNED EXPERIMENT'}</span><code>{latestMatching.verification?.method??'COMPONENT_OUTPUT_COMPARISON'}</code></div><div className="verification-metric-grid"><article><small>EXPECTED</small><strong>{String(latest.expected)} <em>Nm</em></strong></article><article><small>ACTUAL</small><strong>{String(latest.actual)} <em>Nm</em></strong></article><article className={latest.pass?'pass':'fail'}><small>시험 판정</small><strong>{latest.pass?'PASS':'FAIL'}</strong></article></div><p className="verification-concise-result">{latest.pass?'이 조건에서는 기준을 만족했습니다.':needsAnother?'현재 가설과 일치하지만 다른 정상 입력 한 번이 더 필요합니다.':'서로 다른 입력에서 반복되는 차이가 확인됐습니다.'}</p><section className="verification-interpretation"><strong>{interpretation}</strong><small>PASS/FAIL은 이 컴포넌트 실행의 판정이며 근본 원인이나 전체 차량 판정이 아닙니다.</small></section><details className="verification-result-summary"><summary>Verification Evidence 상세</summary><dl><div><dt>Method</dt><dd>{latestMatching.verification?.method}</dd></div><div><dt>Technique</dt><dd>{latestMatching.verification?.designTechnique}</dd></div><div><dt>Monitor</dt><dd>{outputSignal}</dd></div></dl></details><div className="verification-result-actions"><button type="button" onClick={()=>onInterpretTestResult(latestMatching.id)}>시험 결과 해석</button><button type="button" className="save-comparison-button" onClick={()=>onCollectTestAsEvidence(latestMatching.id)}>검증 근거로 저장</button>{hypothesis&&<button type="button" onClick={()=>onUpdateHypothesis({...hypothesis,status:latest.pass?'REJECTED':'MAINTAINED'})}>{latest.pass?'가설 재검토':'가설 유지'}</button>}</div></>
      </section>}</div>
    </>
  }
}
