import { useEffect, useMemo, useState } from 'react'
import type { IncidentFrame, ExperimentRun, Diagnosis } from '../../../runtime/case/PropulsionCase.ts'
import type { Evidence, RootCauseReport } from '../../../runtime/investigation/Evidence.ts'
import type { GameplayClueId } from '../../../runtime/investigation/GameplayInvestigation.ts'
import type { GuidedCaseDefinition, GuidedMetricId, GuidedSceneId } from '../../../runtime/investigation/GuidedCase.ts'
import { architectureNode } from '../../../registries/investigation/Architecture.ts'
import './investigation-focus-deck.css'

type BoundaryKind='LAST_NORMAL'|'FIRST_ABNORMAL'

interface Props{
  definition:GuidedCaseDefinition
  incidentPath:readonly string[]
  active:GameplayClueId
  rootCauseUnlocked:boolean
  frame:IncidentFrame|undefined
  frames:readonly IncidentFrame[]
  selectedFrameIndex:number
  evidence:readonly Evidence[]
  collectedEvidenceIds:readonly string[]
  lastNormalEvidenceId?:string
  firstAbnormalEvidenceId?:string
  latestExperiment:ExperimentRun|null
  diagnosis:Diagnosis|null
  latestRepair:ExperimentRun|undefined
  resolved:boolean
  onSelectFrameIndex:(index:number)=>void
  onCapturePhenomenon:()=>void
  onCollectBoundary:(componentId:string,signalId:string,kind:BoundaryKind)=>void
  onSetHypothesis:(hypothesisId:string)=>void
  onRunExperiment:(planId:string)=>void
  onCollectExperiment:(runId:number)=>void
  onSubmitReport:(report:RootCauseReport)=>void
  onRetryDiagnosis:()=>void
  onRunRepair:(variant:0|2|3)=>void
  onOpenExpert:()=>void
}

const sceneOrder:GuidedSceneId[]=['OBSERVE','DOMAIN','LOCALIZE','DISCRIMINATE','VERIFY','RESOLVE']
const sceneMeta:Record<GuidedSceneId,{number:number;label:string;thinking:string}>={
  OBSERVE:{number:1,label:'현상 확정',thinking:'현상 파악 · 관찰'},
  DOMAIN:{number:2,label:'도메인 찾기',thinking:'원인 추적 · 전체 차량'},
  LOCALIZE:{number:3,label:'경계 좁히기',thinking:'원인 추적 · 기능과 신호'},
  DISCRIMINATE:{number:4,label:'가설 구별',thinking:'가설 검증 · 시험 설계'},
  VERIFY:{number:5,label:'비교 검증',thinking:'가설 검증 · 결과 해석'},
  RESOLVE:{number:6,label:'수리·재검증',thinking:'결론 · 회귀 확인'},
}

function metricNumber(definition:GuidedCaseDefinition,metric:GuidedMetricId,frame:IncidentFrame|undefined){
  if(!frame)return 0
  const value=definition.readMetric(metric,frame)
  return typeof value==='number'&&Number.isFinite(value)?value:0
}

function metricText(definition:GuidedCaseDefinition,metric:GuidedMetricId,frame:IncidentFrame|undefined){
  if(!frame)return '—'
  const raw=definition.readMetric(metric,frame)
  if(typeof raw==='string')return raw
  if(typeof raw==='boolean')return raw?'ON':'OFF'
  return metric==='EXECUTION_TIME'?raw.toFixed(2):metric==='SPEED_KPH'?raw.toFixed(1):String(Math.round(raw))
}

function EvidenceNotebook({evidence,ids}:{evidence:readonly Evidence[];ids:readonly string[]}){
  const collected=useMemo(()=>new Set(ids),[ids])
  const items=evidence.filter(item=>collected.has(item.id))
  return <details className="focus-notebook"><summary>조사 노트 <b>{items.length}</b></summary><div>{items.length?items.map(item=><span key={item.id} className={item.status.toLowerCase()}><i>{item.status==='MATCH'?'✓':item.status==='MISMATCH'?'!':'•'}</i><span><b>{item.details?.subjectId??item.title}</b><small>{item.claim}</small></span></span>):<p>확정한 판단과 근거가 여기에 쌓입니다.</p>}</div></details>
}

function ScopeGuide({definition,scene}:{definition:GuidedCaseDefinition;scene:GuidedSceneId}){
  const scope=definition.scope[scene]
  return <section className="focus-scope-guide" aria-label="현재 확인 범위">
    <header><span>✓</span><div><small>지금 보면 되는 범위</small><strong>{scope.title}</strong></div></header>
    <ul>{scope.include.map(item=><li key={item.id}><i>□</i><span><b>{item.label}</b><small>{item.detail}</small></span></li>)}</ul>
    <details><summary>이번에는 보지 않아도 되는 것</summary>{scope.defer.map(item=><p key={item}>{item}</p>)}</details>
  </section>
}

function LayeredSystemVisual({definition}:{definition:GuidedCaseDefinition}){
  return <section className="guided-system-visual" aria-label={definition.visualModel.title}>
    <header><div><small>SYNCHRONIZED SYSTEM VIEW</small><strong>{definition.visualModel.title}</strong></div><span>사건 시점</span></header>
    <p>{definition.visualModel.caption}</p>
    <div className="guided-system-layers">{definition.visualModel.layers.map(layer=><div className="guided-system-layer" key={layer.id}>
      <aside><b>{layer.label}</b><small>{layer.description}</small></aside>
      <div>{layer.nodes.map(node=><span key={node.id} className={node.state.toLowerCase()}><b>{node.label}</b><small>{node.value}</small></span>)}</div>
    </div>)}</div>
    <footer><span className="normal">정상 전달</span><span className="abnormal">첫 차이·결과 이상</span><span className="context">맥락 정보</span><em>교육용 참조 구조 · 사건 recorder 연계</em></footer>
  </section>
}

function ResponseTimeline({definition,frames,index,onSelect}:{definition:GuidedCaseDefinition;frames:readonly IncidentFrame[];index:number;onSelect:(index:number)=>void}){
  const points=useMemo(()=>{
    if(!frames.length)return {expected:'',actual:'',firstDifference:-1}
    const expected=frames.map(frame=>metricNumber(definition,definition.observe.expectedMetric,frame))
    const actual=frames.map(frame=>metricNumber(definition,definition.observe.actualMetric,frame))
    const max=Math.max(1,...expected,...actual)
    const point=(value:number,i:number)=>`${(i/Math.max(1,frames.length-1))*800},${146-(value/max)*118}`
    return {expected:expected.map(point).join(' '),actual:actual.map(point).join(' '),firstDifference:expected.findIndex((value,i)=>Math.abs(value-actual[i]!)>Math.max(1,value*.08))}
  },[definition,frames])
  const markerX=(Math.max(0,index)/Math.max(1,frames.length-1))*800
  const differenceX=points.firstDifference<0?0:(points.firstDifference/Math.max(1,frames.length-1))*800
  return <div className="response-timeline">
    <header><div><small>NORMAL BASELINE vs INCIDENT</small><b>{definition.observe.chartLabel}</b></div><div className="chart-legend"><span className="expected">정상 기준</span><span className="actual">사건 Actual</span></div></header>
    <svg viewBox="0 0 800 160" preserveAspectRatio="none" role="img" aria-label={definition.observe.chartLabel}>
      <path className="chart-grid" d="M0 28H800 M0 87H800 M0 146H800"/>
      {points.firstDifference>=0&&<><rect className="difference-zone" x={differenceX} y="20" width={Math.max(0,800-differenceX)} height="128"/><line className="difference-line" x1={differenceX} x2={differenceX} y1="18" y2="150"/></>}
      <polyline className="expected-line" points={points.expected}/><polyline className="actual-line" points={points.actual}/><line className="selected-line" x1={markerX} x2={markerX} y1="18" y2="150"/>
    </svg>
    <input aria-label="사건 시점 이동" type="range" min={0} max={Math.max(0,frames.length-1)} value={Math.min(index,Math.max(0,frames.length-1))} onChange={event=>onSelect(Number(event.target.value))}/>
    <footer><span>사건 전</span><b>{points.firstDifference>=0?'최초 기준 이탈 표시됨':'기준 이탈 탐색 중'}</b><span>사건 후</span></footer>
  </div>
}

function ArchitecturePath({path,focusIds=[]}:{path:readonly string[];focusIds?:readonly string[]}){
  return <div className="guided-architecture-path" aria-label="운전자 입력에서 차량 반응까지의 전체 기능 경로">{path.map((id,index)=>{const node=architectureNode(id);return <span key={id} className={focusIds.includes(id)?'focused':''}><i>{index+1}</i><b>{node?.label??id}</b><small>{node?.area??'Architecture'}</small></span>})}</div>
}

function DecisionHeader({eyebrow,question,description}:{eyebrow:string;question:string;description:string}){
  return <header className="focus-question"><small>{eyebrow}</small><h3>{question}</h3><p>{description}</p></header>
}

export function InvestigationFocusDeck(props:Props){
  const [domainConfirmed,setDomainConfirmed]=useState(false)
  const [selectedChoice,setSelectedChoice]=useState('')
  const [selectedDomain,setSelectedDomain]=useState('')
  const [selectedHypothesis,setSelectedHypothesis]=useState('')
  const [selectedPlan,setSelectedPlan]=useState('')
  const [selectedInterpretation,setSelectedInterpretation]=useState('')
  const [selectedReportHypothesis,setSelectedReportHypothesis]=useState('')
  const [selectedRepair,setSelectedRepair]=useState('')
  const [reviewScene,setReviewScene]=useState<GuidedSceneId|null>(null)
  const [notice,setNotice]=useState('')
  const collected=useMemo(()=>new Set(props.collectedEvidenceIds),[props.collectedEvidenceIds])
  const collectedEvidence=props.evidence.filter(item=>collected.has(item.id))
  const liveScene:GuidedSceneId=props.active==='PHENOMENON'?'OBSERVE':props.active==='FAULT_BOUNDARY'?(domainConfirmed?'LOCALIZE':'DOMAIN'):!props.latestExperiment?'DISCRIMINATE':props.rootCauseUnlocked?'RESOLVE':'VERIFY'
  const scene=reviewScene??liveScene
  const meta=sceneMeta[scene]
  const sceneIndex=sceneOrder.indexOf(scene)
  const reviewing=scene!==liveScene
  const activeBoundary=!props.lastNormalEvidenceId?props.definition.localize.boundaries[0]:props.definition.localize.boundaries[1]
  const activeHypothesis=props.definition.discriminate.hypotheses.find(item=>item.id===selectedHypothesis)
  const activePlan=props.definition.discriminate.testPlans.find(item=>item.id===selectedPlan)
  const reportHypothesisId=selectedReportHypothesis||selectedHypothesis
  const repair=props.definition.resolve.repairs.find(item=>item.id===selectedRepair)

  useEffect(()=>setReviewScene(null),[liveScene])

  const selectWithDraft=(setter:(id:string)=>void,id:string,label:string)=>{setter(id);setNotice(`“${label}”을 선택했습니다. 아직 확정되지 않았습니다.`)}
  const confirmPhenomenon=()=>{const choice=props.definition.observe.choices.find(item=>item.id===selectedChoice);if(!choice){setNotice('왼쪽 자료를 보고 현상을 한 문장으로 먼저 선택하세요.');return}setNotice(choice.feedback);if(choice.correct)props.onCapturePhenomenon()}
  const confirmDomain=()=>{const domain=props.definition.domain.domains.find(item=>item.id===selectedDomain);if(!domain){setNotice('전체 기능 경로와 도메인 카드를 보고 조사 영역을 선택하세요.');return}setNotice(domain.feedback);if(domain.relevant)setDomainConfirmed(true)}
  const choosePlan=(id:string)=>{const plan=props.definition.discriminate.testPlans.find(item=>item.id===id)!;setSelectedPlan(id);setNotice(`“${plan.label}”을 선택했습니다. 고정 조건과 변경 변수를 확인한 뒤 실행하세요.`)}
  const runPlan=()=>{if(!activePlan?.discriminating){setNotice(activePlan?.rationale??'가설을 구별할 시험을 선택하세요.');return}if(!activeHypothesis){setNotice('시험 전에 현재 가장 가능성이 높은 가설과 그 예측을 선택하세요.');return}props.onSetHypothesis(activeHypothesis.id);props.onRunExperiment(activePlan.id)}
  const confirmInterpretation=()=>{const choice=props.definition.verify.interpretations.find(item=>item.id===selectedInterpretation);if(!choice){setNotice('시험 행을 비교한 뒤 결과가 말할 수 있는 범위를 선택하세요.');return}setNotice(choice.feedback);if(choice.correct&&props.latestExperiment)props.onCollectExperiment(props.latestExperiment.id)}
  const submitReport=()=>{const hypothesis=props.definition.discriminate.hypotheses.find(item=>item.id===reportHypothesisId);if(!hypothesis){setNotice('현재 근거를 가장 잘 설명하는 가설을 하나 선택하세요.');return}props.onSubmitReport({...hypothesis.report,evidenceIds:collectedEvidence.map(item=>item.id)})}
  const confirmRepair=()=>{if(!repair){setNotice('보고서의 실패 방식에 직접 대응하는 수리안을 선택하세요.');return}setNotice(`${repair.label}을 적용하고 동일 조건 회귀시험을 실행합니다.`);props.onRunRepair(repair.variant)}
  const actionTrail=[
    props.active!=='PHENOMENON'?'현상 확정':selectedChoice&&`선택: ${props.definition.observe.choices.find(item=>item.id===selectedChoice)?.label}`,
    domainConfirmed?'추진·구동 도메인':selectedDomain&&`선택: ${props.definition.domain.domains.find(item=>item.id===selectedDomain)?.label}`,
    props.lastNormalEvidenceId&&'VMC까지 정상',props.firstAbnormalEvidenceId&&'eDrive부터 이상',
    selectedHypothesis&&`가설: ${activeHypothesis?.label}`,selectedPlan&&`시험: ${activePlan?.label}`,
  ].filter(Boolean) as string[]

  return <main className="investigation-focus-deck">
    <header className="focus-deck-heading"><div><small>{props.definition.caseId} · {meta.thinking}</small><h2>{meta.label}</h2><p>{props.definition.driverStatement}</p></div><div className="focus-heading-actions"><EvidenceNotebook evidence={props.evidence} ids={props.collectedEvidenceIds}/><button type="button" onClick={props.onOpenExpert}>전체 조사 도구<span>신호·인터페이스·요구사항·시험</span></button></div></header>

    <div className="focus-navigation-row">
      <button type="button" className="focus-back" disabled={sceneIndex===0} onClick={()=>setReviewScene(sceneOrder[sceneIndex-1]!)}>← 이전 판단</button>
      <nav className="focus-scene-progress" aria-label="사건 조사 세부 흐름">{sceneOrder.map(id=>{const item=sceneMeta[id];const available=item.number<=sceneMeta[liveScene].number;return <button type="button" key={id} disabled={!available} onClick={()=>setReviewScene(id===liveScene?null:id)} className={id===scene?'current':item.number<sceneMeta[liveScene].number?'done':'locked'}><i>{item.number<sceneMeta[liveScene].number?'✓':item.number}</i><b>{item.label}</b></button>})}</nav>
      {reviewing?<button type="button" className="focus-current" onClick={()=>setReviewScene(null)}>현재 단계로 →</button>:<span className="focus-current-label">현재 판단</span>}
    </div>

    {scene==='OBSERVE'&&<section className="focus-object-stage focus-open-book">
      <div className="focus-reference-pane"><div className="focus-pane-label"><span>자료</span><b>사건 기록과 정상 기준</b></div><ResponseTimeline definition={props.definition} frames={props.frames} index={props.selectedFrameIndex} onSelect={props.onSelectFrameIndex}/><div className="observation-strip">{props.definition.observe.observations.map(item=><span key={item.id}><small>{item.label}</small><b>{metricText(props.definition,item.metric,props.frame)}{item.unit&&<em>{item.unit}</em>}</b></span>)}</div></div>
      <aside className="focus-decision-pane"><ScopeGuide definition={props.definition} scene={scene}/><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.observe.question} description={props.definition.observe.context}/><div className="single-decision"><small>선택 후 확인해야 다음 단계로 넘어갑니다.</small>{props.definition.observe.choices.map(choice=><button key={choice.id} className={selectedChoice===choice.id?'selected':''} onClick={()=>selectWithDraft(setSelectedChoice,choice.id,choice.label)}>{choice.label}</button>)}</div><button className="focus-primary" disabled={!selectedChoice} onClick={confirmPhenomenon}>선택한 현상 확인하기</button></aside>
    </section>}

    {scene==='DOMAIN'&&<section className="focus-object-stage focus-open-book domain-stage">
      <div className="focus-reference-pane"><div className="focus-pane-label"><span>자료</span><b>전체 차량에서 관련 영역 찾기</b></div><LayeredSystemVisual definition={props.definition}/><ArchitecturePath path={props.incidentPath}/></div>
      <aside className="focus-decision-pane"><ScopeGuide definition={props.definition} scene={scene}/><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.domain.question} description="전체 구조는 남겨둔 채 사건과 직접 연결된 도메인만 선택하세요."/><div className="domain-atlas">{props.definition.domain.domains.map(domain=><button type="button" key={domain.id} className={selectedDomain===domain.id?'selected':''} onClick={()=>selectWithDraft(setSelectedDomain,domain.id,domain.label)}><span>{domain.nodeIds.length}</span><b>{domain.label}</b><small>{domain.summary}</small></button>)}</div><button className="focus-primary" disabled={!selectedDomain} onClick={confirmDomain}>이 도메인을 조사 범위로 확정</button></aside>
    </section>}

    {scene==='LOCALIZE'&&<section className="focus-object-stage focus-open-book localize-stage">
      <div className="focus-reference-pane"><div className="focus-pane-label"><span>자료</span><b>전체 경로와 동기화된 물리 흐름</b></div><LayeredSystemVisual definition={props.definition}/><ArchitecturePath path={props.incidentPath} focusIds={[activeBoundary.componentId]}/><div className="boundary-status"><span className={props.lastNormalEvidenceId?'done':''}>마지막 정상 {props.lastNormalEvidenceId?'확인됨':'미확인'}</span><i>→</i><span className={props.firstAbnormalEvidenceId?'done abnormal':''}>첫 이상 {props.firstAbnormalEvidenceId?'확인됨':'미확인'}</span></div></div>
      <aside className="focus-decision-pane"><ScopeGuide definition={props.definition} scene={scene}/><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.localize.question} description="기능 하나만 보지 말고 바로 위 입력과 현재 출력을 같은 시점에서 비교하세요."/><article className={`boundary-focus-object ${activeBoundary.kind==='FIRST_ABNORMAL'?'abnormal':''}`}><small>{activeBoundary.kind==='LAST_NORMAL'?'LAST KNOWN NORMAL':'FIRST KNOWN ABNORMAL'}</small><h4>{activeBoundary.label}</h4><p>{activeBoundary.question}</p><aside>{activeBoundary.expectedMeaning}</aside><button type="button" onClick={()=>props.onCollectBoundary(activeBoundary.componentId,activeBoundary.signalId,activeBoundary.kind)}>이 범위의 기준과 Actual 비교</button></article></aside>
    </section>}

    {scene==='DISCRIMINATE'&&<section className="focus-object-stage focus-open-book hypothesis-stage">
      <div className="focus-reference-pane"><div className="focus-pane-label"><span>자료</span><b>경쟁 가설과 예측 비교</b></div><ArchitecturePath path={props.incidentPath} focusIds={['eDrive']}/><div className="hypothesis-board">{props.definition.discriminate.hypotheses.map(hypothesis=><button type="button" key={hypothesis.id} className={selectedHypothesis===hypothesis.id?'selected':''} onClick={()=>selectWithDraft(setSelectedHypothesis,hypothesis.id,hypothesis.label)}><small>{hypothesis.category.replaceAll('_',' ')}</small><b>{hypothesis.label}</b><p>{hypothesis.prediction}</p></button>)}</div></div>
      <aside className="focus-decision-pane"><ScopeGuide definition={props.definition} scene={scene}/><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.discriminate.question} description="가설 이름보다 맞다면 무엇이 반복되어야 하는지를 먼저 비교하세요."/><div className="test-plan-selector"><small>선택한 가설을 다른 후보와 구별할 시험</small>{props.definition.discriminate.testPlans.map(plan=><button key={plan.id} className={selectedPlan===plan.id?'selected':''} onClick={()=>choosePlan(plan.id)}><b>{plan.label}</b><span>{plan.changedInput}</span>{selectedPlan===plan.id&&<em>{plan.fixedConditions.length?`고정: ${plan.fixedConditions.join(' · ')}`:'고정 조건 없음'}</em>}</button>)}<button className="focus-primary" disabled={!activePlan||!activeHypothesis} onClick={runPlan}>예측을 기록하고 비교 시험 실행</button></div></aside>
    </section>}

    {scene==='VERIFY'&&<section className="focus-object-stage focus-open-book verify-stage">
      <div className="focus-reference-pane"><div className="focus-pane-label"><span>자료</span><b>동일 조건 비교 시험 결과</b></div>{props.latestExperiment&&<div className="paired-verification"><header><span>정상 기준 EXPECTED</span><i>동일 조건</i><span>고장 실행 ACTUAL</span></header>{props.latestExperiment.rows.map(row=><div key={row.id}><b>INPUT {String(row.input)}</b><span>{String(row.expected)}</span><i className={row.pass?'pass':'fail'}>{row.pass?'MATCH':'DIFFERENCE'}</i><span>{String(row.actual)}</span></div>)}</div>}</div>
      <aside className="focus-decision-pane"><ScopeGuide definition={props.definition} scene={scene}/><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.verify.question} description="FAIL은 이 시험 범위의 기준 불만족입니다. 원인 확정과 구분하세요."/><div className="single-decision"><small>이 결과가 말할 수 있는 범위는?</small>{props.definition.verify.interpretations.map(choice=><button key={choice.id} className={selectedInterpretation===choice.id?'selected':''} onClick={()=>selectWithDraft(setSelectedInterpretation,choice.id,choice.label)}>{choice.label}</button>)}</div><button className="focus-primary" disabled={!selectedInterpretation} onClick={confirmInterpretation}>결과 해석을 근거로 저장</button></aside>
    </section>}

    {scene==='RESOLVE'&&<section className="focus-object-stage focus-open-book resolve-stage">
      <div className="focus-reference-pane"><div className="focus-pane-label"><span>자료</span><b>현상→경계→시험 근거 연결</b></div><ArchitecturePath path={props.incidentPath} focusIds={[props.diagnosis?.component??props.definition.discriminate.hypotheses.find(item=>item.id===reportHypothesisId)?.location??'']}/>{!props.diagnosis&&<div className="hypothesis-board report">{props.definition.discriminate.hypotheses.map(hypothesis=><button type="button" key={hypothesis.id} className={reportHypothesisId===hypothesis.id?'selected':''} onClick={()=>selectWithDraft(setSelectedReportHypothesis,hypothesis.id,hypothesis.label)}><small>{hypothesis.location}</small><b>{hypothesis.label}</b><p>{hypothesis.prediction}</p></button>)}</div>}{props.diagnosis&&<LayeredSystemVisual definition={props.definition}/>}</div>
      <aside className="focus-decision-pane"><ScopeGuide definition={props.definition} scene={scene}/><DecisionHeader eyebrow="지금 답할 질문" question={props.diagnosis?props.definition.resolve.question:'경계와 비교 시험을 함께 설명하는 가설은 무엇인가요?'} description={props.diagnosis?'같은 재현 조건과 정상 조건을 모두 통과해야 수리가 완료됩니다.':'확보한 근거만 사용해 원인 위치와 실패 방식을 제출합니다.'}/>{!props.diagnosis?<button className="focus-primary report-submit" disabled={!reportHypothesisId} onClick={submitReport}>조사 노트 근거와 함께 보고서 제출</button>:<div className={`resolution-verdict ${props.diagnosis.correct&&props.diagnosis.evidenceSufficient?'correct':'retry'}`}><small>REPORT REVIEW</small><h4>{props.diagnosis.correct&&props.diagnosis.evidenceSufficient?'근거가 결론을 지지합니다':'아직 설명되지 않는 단서가 있습니다'}</h4><p>{props.diagnosis.correct&&props.diagnosis.evidenceSufficient?'마지막 정상, 첫 이상, 반복 시험 결과가 하나의 설명으로 연결됩니다.':props.diagnosis.assessment?.reasons.join(' ')||'원인 후보와 근거의 연결을 다시 확인하세요.'}</p>{!props.diagnosis.correct?<button onClick={props.onRetryDiagnosis}>가설 비교로 돌아가기</button>:<><div className="repair-selector">{props.definition.resolve.repairs.map(item=><button key={item.id} className={selectedRepair===item.id?'selected':''} onClick={()=>selectWithDraft(setSelectedRepair,item.id,item.label)}><b>{item.label}</b><span>{item.explanation}</span></button>)}</div><button className="focus-primary" disabled={!repair} onClick={confirmRepair}>선택한 수리 적용 후 회귀시험</button></>}{props.latestRepair&&<p className={props.latestRepair.rows.every(row=>row.pass)?'repair-pass':'repair-fail'}>{props.latestRepair.rows.every(row=>row.pass)?'재현·회귀시험 통과 · 동일 사건 재주행으로 이동합니다.':'회귀시험 실패 · 현재 근거와 직접 연결된 수리인지 다시 확인하세요.'}</p>}</div>}</aside>
    </section>}

    <footer className="focus-action-trail"><b>방금 한 판단</b><div>{actionTrail.length?actionTrail.map((item,index)=><span key={`${item}-${index}`}>{item}</span>):<span>아직 확정한 판단이 없습니다.</span>}</div><em>{reviewing?'이전 기록을 다시 보는 중':'선택은 확인 전까지 언제든 바꿀 수 있습니다.'}</em></footer>
    {notice&&<aside className="focus-feedback" role="status"><span aria-hidden="true">🐾</span><p>{notice}</p><button type="button" aria-label="안내 닫기" onClick={()=>setNotice('')}>×</button></aside>}
  </main>
}
