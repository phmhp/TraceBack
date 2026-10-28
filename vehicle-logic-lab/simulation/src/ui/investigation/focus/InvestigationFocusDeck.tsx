import { useEffect, useMemo, useState, type ReactNode } from 'react'
import type { IncidentFrame, ExperimentRun, Diagnosis } from '../../../runtime/case/PropulsionCase.ts'
import type { Evidence, RootCauseReport } from '../../../runtime/investigation/Evidence.ts'
import type { GameplayClueId } from '../../../runtime/investigation/GameplayInvestigation.ts'
import type { GuidedCaseDefinition, GuidedMetricId, GuidedSceneId } from '../../../runtime/investigation/GuidedCase.ts'
import { architectureNode, getIncomingInterfaces, getInputSignals, getOutputSignals, getOutgoingInterfaces, normalFunctionFlows } from '../../../registries/investigation/Architecture.ts'
import { getRequirementsForComponent, getTestsForRequirement } from '../../../registries/investigation/Trace.ts'
import './investigation-focus-deck.css'

type BoundaryKind='LAST_NORMAL'|'FIRST_ABNORMAL'
type BoundaryCollectionResult={ok:boolean;status?:'MATCH'|'MISMATCH'|'OBSERVED';message:string}
type SimulationExperimentInput={first:number;second:number;direction:'FORWARD'|'REVERSE';validity:'VALID'|'INVALID'}

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
  onCollectBoundary:(componentId:string,signalId:string,kind:BoundaryKind)=>BoundaryCollectionResult
  onSetHypothesis:(hypothesisId:string)=>void
  onRunExperiment:(planId:string)=>void
  onRunSimulationExperiment:(input:SimulationExperimentInput)=>void
  onCollectExperiment:(runId:number)=>void
  onSubmitReport:(report:RootCauseReport)=>void
  onRetryDiagnosis:()=>void
  onRunRepair:(variant:0|2|3)=>void
  onOpenExpert:()=>void
  videoSlotRef:(node:HTMLDivElement|null)=>void
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
    <footer><span className="normal">정상 전달</span><span className="abnormal">첫 차이·결과 이상</span><span className="context">맥락 정보</span><em>참조 구조 · 사건 recorder 연계</em></footer>
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

interface BookPage {id:string;label:string;hint:string;content:ReactNode}

function OpenBookReference({title,pages}:{title:string;pages:readonly BookPage[]}){
  const [activeId,setActiveId]=useState(pages[0]?.id??'')
  const active=pages.find(page=>page.id===activeId)??pages[0]
  return <section className="reference-book" aria-label={`${title} 오픈북 자료`}>
    <header className="reference-book-heading"><div><small>OPEN BOOK / 시각 자료집</small><strong>{title}</strong></div><span>{pages.findIndex(page=>page.id===active?.id)+1} / {pages.length}</span></header>
    <nav className="reference-book-tabs" aria-label="자료 탭">{pages.map(page=><button type="button" key={page.id} className={page.id===active?.id?'active':''} onClick={()=>setActiveId(page.id)}><b>{page.label}</b><small>{page.hint}</small></button>)}</nav>
    {active&&<div key={active.id} className="reference-book-page"><i className="book-spine" aria-hidden="true"/>{active.content}</div>}
    <footer><span>탭을 눌러 필요한 자료만 펼쳐보세요.</span><b aria-hidden="true">⌁</b></footer>
  </section>
}

function RecordedDriveReplay({definition,frame,frames,index,onSelect,videoSlotRef}:{definition:GuidedCaseDefinition;frame:IncidentFrame|undefined;frames:readonly IncidentFrame[];index:number;onSelect:(index:number)=>void;videoSlotRef:(node:HTMLDivElement|null)=>void}){
  const speed=metricText(definition,'SPEED_KPH',frame)
  const pedal=metricText(definition,'ACCELERATOR_PERCENT',frame)
  const expected=metricText(definition,definition.observe.expectedMetric,frame)
  const actual=metricText(definition,definition.observe.actualMetric,frame)
  return <section className="blackbox-replay recorded-drive-replay" aria-label="고양이 운전자가 주행한 실제 3D 사건 화면">
    <div className="recorded-drive-viewport">
      <div ref={videoSlotRef} className="focus-video-slot viewport-projection-host"/>
      <div className="blackbox-hud"><span><small>EVENT RECORDER</small><b>{frame?.sw.executionTime.toFixed(2)??'—'} s</b></span><span><small>SPEED</small><b>{speed} km/h</b></span><span><small>GEAR</small><b>{frame?.sw.output.gearState??'—'}</b></span></div>
      <div className="recorded-drive-caption"><span>실제 주행 씬 · 고양이 운전자 · 판교 맵</span><b>사건 종료 시점 3D 화면</b></div>
    </div>
    <div className="recorded-cockpit-data"><span><small>ACCEL</small><b>{pedal}%</b></span><span><small>EXPECTED</small><b>{expected} Nm</b></span><span className="abnormal"><small>ACTUAL</small><b>{actual} Nm</b></span></div>
    <input aria-label="블랙박스 시점 이동" type="range" min={0} max={Math.max(0,frames.length-1)} value={Math.min(index,Math.max(0,frames.length-1))} onChange={event=>onSelect(Number(event.target.value))}/>
    <p className="recorded-drive-note">화면은 실제 플레이에 사용한 3D 주행 씬이며, 아래 슬라이더는 사건 recorder의 입력·출력 프레임을 이동합니다.</p>
  </section>
}

function ArchitectureHierarchyGraphic({path,focusId}:{path:readonly string[];focusId:string}){
  const focus=architectureNode(focusId)
  const domainNodes=path.map(architectureNode).filter(node=>node?.area===focus?.area)
  const logic=normalFunctionFlows[focusId]??[]
  return <div className="architecture-hierarchy-graphic" aria-label="차량 아키텍처 계층">
    <header><small>위에서 아래로 범위를 좁혀 봅니다.</small><b>차량을 레이어로 나누는 관점</b></header>
    <div className="hierarchy-level vehicle"><span>ARCHITECTURE</span><b>TRACKBACK Vehicle</b><small>운전자 입력부터 물리 차량 반응까지</small></div>
    <i>↓</i><div className="hierarchy-level domain"><span>DOMAIN</span><b>{focus?.area??'Propulsion'}</b><small>{domainNodes.map(node=>node.label).join(' · ')}</small></div>
    <i>↓</i><div className="hierarchy-level function"><span>FUNCTION</span><b>{focus?.label??focusId}</b><small>{focus?.role}</small></div>
    <i>↓</i><div className="hierarchy-logic"><span>LOGIC</span>{logic.map((step,index)=><p key={step}><b>{index+1}</b>{step}</p>)}</div>
  </div>
}

function TraceabilityLayerGraphic({focusId}:{focusId:string}){
  const node=architectureNode(focusId)
  const incoming=getIncomingInterfaces(focusId),outgoing=getOutgoingInterfaces(focusId)
  const inputs=getInputSignals(focusId),outputs=getOutputSignals(focusId)
  const requirements=getRequirementsForComponent(focusId)
  const tests=[...new Map(requirements.flatMap(requirement=>getTestsForRequirement(requirement.id)).map(test=>[test.id,test])).values()]
  return <div className="traceability-layer-graphic" aria-label="시스템 인터페이스 신호 요구사항 추적 구조">
    <header><small>같은 기능을 다른 레이어에서 읽기</small><b>{node?.label??focusId} 추적성 지도</b></header>
    <div className="traceability-stack">
      <article className="system"><span>SYSTEM / FUNCTION</span><b>{node?.label??focusId}</b><small>{node?.implementation==='IMPLEMENTED'?'현재 실행 경로에 구현됨':'참조 설계'}</small></article>
      <article className="interface"><span>INTERFACE</span><div>{[...incoming,...outgoing].map(edge=><code key={edge.id}>{edge.id}</code>)}</div><small>기능 사이에서 값이 전달되는 경계</small></article>
      <article className="signal"><span>SIGNAL</span><div>{inputs.map(signal=><code key={`in-${signal.id}`}>IN · {signal.id}</code>)}{outputs.map(signal=><code key={`out-${signal.id}`}>OUT · {signal.id}</code>)}</div><small>경계를 통해 전달되는 관찰 가능한 값</small></article>
      <article className="requirement"><span>REQUIREMENT</span><div>{requirements.map(requirement=><code key={requirement.id}>{requirement.id}</code>)}</div><small>Expected와 판정 기준의 출처</small></article>
      <article className="test"><span>TEST</span><div>{tests.map(test=><code key={test.id}>{test.id}</code>)}</div><small>요구사항을 확인하는 검증 조건</small></article>
    </div>
  </div>
}

function ProvenanceGraphic(){
  return <div className="provenance-graphic" aria-label="정보 출처와 신뢰 범위">
    <article><span>RUNTIME FACT</span><b>사건 recorder</b><p>실제 플레이에서 C/WASM과 Rapier가 만든 입력·출력·차량 반응입니다.</p></article>
    <article><span>REFERENCE DESIGN</span><b>차량 아키텍처</b><p>도메인·기능·인터페이스·신호의 관계를 이해하기 위한 참조 구조입니다.</p></article>
    <article><span>REQUIREMENT / TEST</span><b>검증 기준</b><p>Expected와 PASS/FAIL을 만드는 요구사항 및 실행 가능한 시험입니다.</p></article>
    <article><span>SIMULATION ASSUMPTION</span><b>모델 범위</b><p>TRACKBACK 보정값과 단순화는 OEM 내부 사양과 구분해서 표시합니다.</p></article>
  </div>
}

function SimulationBenchGraphic({first,second,direction,validity,running}:{first:number;second:number;direction:string;validity:string;running:boolean}){
  return <div className={`simulation-bench-graphic ${running?'running':''}`} aria-label="C WASM 시뮬레이션 검증 흐름">
    <header><small>실제 주행과 같은 차량 SW 계산 경로</small><b>C → WebAssembly COMPONENT MODEL TEST</b></header>
    <div><span><i>INPUT A</i><b>{first} Nm</b></span><span><i>INPUT B</i><b>{second} Nm</b></span><em>→</em><span className="core"><i>eDrive</i><b>C/WASM</b></span><em>→</em><span><i>MONITOR</i><b>EDriveCommand</b></span></div>
    <footer><span>{direction}</span><span>{validity}</span><span>Expected vs Actual</span></footer>
  </div>
}

function BoundaryFlowGraphic({definition,frame,focusId}:{definition:GuidedCaseDefinition;frame:IncidentFrame|undefined;focusId:string}){
  const expected=metricText(definition,definition.observe.expectedMetric,frame)
  const actual=metricText(definition,definition.observe.actualMetric,frame)
  const items=[
    {id:'pedal',label:'가속 페달',value:`${metricText(definition,'ACCELERATOR_PERCENT',frame)}%`,state:'normal'},
    {id:'VMC',label:'VMC 요청',value:`${expected} Nm`,state:'normal'},
    {id:'eDrive',label:'eDrive 출력',value:`${actual} Nm`,state:expected===actual?'normal':'abnormal'},
    {id:'wheel',label:'구동륜 반응',value:`${metricText(definition,'SPEED_KPH',frame)} km/h`,state:'context'},
  ]
  return <div className="boundary-flow-graphic" aria-label="신호에서 기계 반응까지의 경계 흐름">{items.map((item,index)=><span key={item.id} className={`${item.state} ${item.id===focusId?'focused':''}`}><i>{index+1}</i><b>{item.label}</b><small>{item.value}</small></span>)}</div>
}

function ExperimentGraphic({experiment}:{experiment:ExperimentRun|null}){
  if(!experiment)return <div className="empty-visual">시험을 실행하면 입력별 Expected와 Actual이 여기에 그려집니다.</div>
  const values=experiment.rows.flatMap(row=>[Number(row.expected)||0,Number(row.actual)||0])
  const max=Math.max(1,...values)
  return <div className="experiment-graphic" aria-label="시험 결과 막대 그래프">{experiment.rows.map(row=><article key={row.id}><header><b>INPUT {String(row.input)}</b><span className={row.pass?'pass':'fail'}>{row.pass?'MATCH':'DIFFERENCE'}</span></header><div><span><small>Expected</small><i style={{width:`${(Number(row.expected)||0)/max*100}%`}}/><b>{String(row.expected)}</b></span><span className="actual"><small>Actual</small><i style={{width:`${(Number(row.actual)||0)/max*100}%`}}/><b>{String(row.actual)}</b></span></div></article>)}</div>
}

function DecisionStatus({notice,trail,reviewing,onClose}:{notice:string;trail:readonly string[];reviewing:boolean;onClose:()=>void}){
  return <div className="decision-status">
    {notice&&<aside className="focus-feedback" role="status"><span aria-hidden="true">🐾</span><p>{notice}</p><button type="button" aria-label="안내 닫기" onClick={onClose}>×</button></aside>}
    <details className="focus-action-trail"><summary>내 판단 기록 <b>{trail.length}</b></summary><div>{trail.length?trail.map((item,index)=><span key={`${item}-${index}`}>{item}</span>):<span>아직 확정한 판단이 없습니다.</span>}</div><em>{reviewing?'이전 기록을 다시 보는 중':'확정 전에는 선택을 바꿀 수 있습니다.'}</em></details>
  </div>
}

export function InvestigationFocusDeck(props:Props){
  const [domainConfirmed,setDomainConfirmed]=useState(false)
  const [selectedChoice,setSelectedChoice]=useState('')
  const [selectedDomain,setSelectedDomain]=useState('')
  const [selectedHypothesis,setSelectedHypothesis]=useState('')
  const [simulationFirst,setSimulationFirst]=useState(45)
  const [simulationSecond,setSimulationSecond]=useState(90)
  const [simulationDirection,setSimulationDirection]=useState<'FORWARD'|'REVERSE'>('FORWARD')
  const [simulationValidity,setSimulationValidity]=useState<'VALID'|'INVALID'>('VALID')
  const [simulating,setSimulating]=useState(false)
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
  const reportHypothesisId=selectedReportHypothesis||selectedHypothesis
  const repair=props.definition.resolve.repairs.find(item=>item.id===selectedRepair)

  useEffect(()=>setReviewScene(null),[liveScene])

  const selectWithDraft=(setter:(id:string)=>void,id:string,label:string)=>{setter(id);setNotice(`“${label}”을 선택했습니다. 아직 확정되지 않았습니다.`)}
  const confirmPhenomenon=()=>{const choice=props.definition.observe.choices.find(item=>item.id===selectedChoice);if(!choice){setNotice('왼쪽 자료를 보고 현상을 한 문장으로 먼저 선택하세요.');return}setNotice(choice.feedback);if(choice.correct)props.onCapturePhenomenon()}
  const confirmDomain=()=>{const domain=props.definition.domain.domains.find(item=>item.id===selectedDomain);if(!domain){setNotice('전체 기능 경로와 도메인 카드를 보고 조사 영역을 선택하세요.');return}setNotice(domain.feedback);if(domain.relevant)setDomainConfirmed(true)}
  const runSimulation=()=>{
    if(!activeHypothesis){setNotice('시험 전에 현재 가장 가능성이 높은 가설과 그 예측을 선택하세요.');return}
    if(!Number.isFinite(simulationFirst)||!Number.isFinite(simulationSecond)||simulationFirst===simulationSecond){setNotice('가설을 구별하려면 서로 다른 두 입력을 설정하세요.');return}
    props.onSetHypothesis(activeHypothesis.id)
    setSimulating(true)
    setNotice('같은 주행 로직의 eDrive C/WASM 모델에 두 조건을 적용하고 있습니다.')
    window.setTimeout(()=>{props.onRunSimulationExperiment({first:simulationFirst,second:simulationSecond,direction:simulationDirection,validity:simulationValidity});setSimulating(false)},900)
  }
  const confirmInterpretation=()=>{const choice=props.definition.verify.interpretations.find(item=>item.id===selectedInterpretation);if(!choice){setNotice('시험 행을 비교한 뒤 결과가 말할 수 있는 범위를 선택하세요.');return}setNotice(choice.feedback);if(choice.correct&&props.latestExperiment)props.onCollectExperiment(props.latestExperiment.id)}
  const collectBoundary=()=>{const result=props.onCollectBoundary(activeBoundary.componentId,activeBoundary.signalId,activeBoundary.kind);setNotice(result.message)}
  const submitReport=()=>{const hypothesis=props.definition.discriminate.hypotheses.find(item=>item.id===reportHypothesisId);if(!hypothesis){setNotice('현재 근거를 가장 잘 설명하는 가설을 하나 선택하세요.');return}props.onSubmitReport({...hypothesis.report,evidenceIds:collectedEvidence.map(item=>item.id)})}
  const confirmRepair=()=>{if(!repair){setNotice('보고서의 실패 방식에 직접 대응하는 수리안을 선택하세요.');return}setNotice(`${repair.label}을 적용하고 동일 조건 회귀시험을 실행합니다.`);props.onRunRepair(repair.variant)}
  const actionTrail=[
    props.active!=='PHENOMENON'?'현상 확정':selectedChoice&&`선택: ${props.definition.observe.choices.find(item=>item.id===selectedChoice)?.label}`,
    domainConfirmed?'추진·구동 도메인':selectedDomain&&`선택: ${props.definition.domain.domains.find(item=>item.id===selectedDomain)?.label}`,
    props.lastNormalEvidenceId&&'VMC까지 정상',props.firstAbnormalEvidenceId&&'eDrive부터 이상',
    selectedHypothesis&&`가설: ${activeHypothesis?.label}`,props.latestExperiment&&`시험 #${props.latestExperiment.id}`,
  ].filter(Boolean) as string[]
  const decisionStatus=<DecisionStatus notice={notice} trail={actionTrail} reviewing={reviewing} onClose={()=>setNotice('')}/>

  return <main className="investigation-focus-deck">
    <header className="focus-deck-heading"><div><small>{props.definition.caseId} · {meta.thinking}</small><h2>{meta.label}</h2><p>{props.definition.driverStatement}</p></div><div className="focus-heading-actions"><EvidenceNotebook evidence={props.evidence} ids={props.collectedEvidenceIds}/><button type="button" onClick={props.onOpenExpert}>전체 조사 도구<span>신호·인터페이스·요구사항·시험</span></button></div></header>

    <div className="focus-navigation-row">
      <button type="button" className="focus-back" disabled={sceneIndex===0} onClick={()=>setReviewScene(sceneOrder[sceneIndex-1]!)}>← 이전 판단</button>
      <nav className="focus-scene-progress" aria-label="사건 조사 세부 흐름">{sceneOrder.map(id=>{const item=sceneMeta[id];const available=item.number<=sceneMeta[liveScene].number;return <button type="button" key={id} disabled={!available} onClick={()=>setReviewScene(id===liveScene?null:id)} className={id===scene?'current':item.number<sceneMeta[liveScene].number?'done':'locked'}><i>{item.number<sceneMeta[liveScene].number?'✓':item.number}</i><b>{item.label}</b></button>})}</nav>
      {reviewing?<button type="button" className="focus-current" onClick={()=>setReviewScene(null)}>현재 단계로 →</button>:<span className="focus-current-label">현재 판단</span>}
    </div>

    {scene==='OBSERVE'&&<section className="focus-object-stage focus-open-book">
      <aside className="focus-decision-pane"><div className="focus-pane-label"><span>문제</span><b>현상을 원인과 분리하기</b></div><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.observe.question} description={props.definition.observe.context}/><div className="single-decision"><small>자료를 넘겨본 뒤 가장 정확한 문장을 고르세요.</small>{props.definition.observe.choices.map(choice=><button key={choice.id} className={selectedChoice===choice.id?'selected':''} onClick={()=>selectWithDraft(setSelectedChoice,choice.id,choice.label)}>{choice.label}</button>)}</div><button className="focus-primary" disabled={!selectedChoice} onClick={confirmPhenomenon}>선택한 현상 확인하기</button><ScopeGuide definition={props.definition} scene={scene}/>{decisionStatus}</aside>
      <div className="focus-reference-pane"><OpenBookReference key={scene} title="사건 기록과 정상 기준" pages={[
        {id:'blackbox',label:'주행 블랙박스',hint:'실제 3D 주행',content:<RecordedDriveReplay definition={props.definition} frame={props.frame} frames={props.frames} index={props.selectedFrameIndex} onSelect={props.onSelectFrameIndex} videoSlotRef={props.videoSlotRef}/>},
        {id:'timeline',label:'신호 그래프',hint:'기준과 Actual',content:<ResponseTimeline definition={props.definition} frames={props.frames} index={props.selectedFrameIndex} onSelect={props.onSelectFrameIndex}/>},
        {id:'snapshot',label:'계기판',hint:'선택 시점 값',content:<div className="observation-strip visual-dashboard">{props.definition.observe.observations.map(item=><span key={item.id}><small>{item.label}</small><b>{metricText(props.definition,item.metric,props.frame)}{item.unit&&<em>{item.unit}</em>}</b></span>)}</div>},
      ]}/></div>
    </section>}

    {scene==='DOMAIN'&&<section className="focus-object-stage focus-open-book domain-stage">
      <aside className="focus-decision-pane"><div className="focus-pane-label"><span>문제</span><b>차량 전체에서 조사 영역 찾기</b></div><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.domain.question} description="전체 구조는 남겨둔 채 사건과 직접 연결된 도메인만 선택하세요."/><div className="domain-atlas">{props.definition.domain.domains.map(domain=><button type="button" key={domain.id} className={selectedDomain===domain.id?'selected':''} onClick={()=>selectWithDraft(setSelectedDomain,domain.id,domain.label)}><span>{domain.nodeIds.length}</span><b>{domain.label}</b><small>{domain.summary}</small></button>)}</div><button className="focus-primary" disabled={!selectedDomain} onClick={confirmDomain}>이 도메인을 조사 범위로 확정</button><ScopeGuide definition={props.definition} scene={scene}/>{decisionStatus}</aside>
      <div className="focus-reference-pane"><OpenBookReference key={scene} title="차량 아키텍처 자료집" pages={[
        {id:'whole-path',label:'전체 차량 지도',hint:'입력→반응',content:<><ArchitecturePath path={props.incidentPath}/><LayeredSystemVisual definition={props.definition}/></>},
        {id:'hierarchy',label:'구조 계층',hint:'Architecture→Logic',content:<ArchitectureHierarchyGraphic path={props.incidentPath} focusId="eDrive"/>},
        {id:'traceability',label:'추적성 레이어',hint:'Interface→Test',content:<TraceabilityLayerGraphic focusId="eDrive"/>},
        {id:'mechanics',label:'EV 기계 흐름',hint:'명령→구동륜',content:<BoundaryFlowGraphic definition={props.definition} frame={props.frame} focusId="eDrive"/>},
        {id:'provenance',label:'정보 출처',hint:'사실·참조·가정',content:<ProvenanceGraphic/>},
      ]}/></div>
    </section>}

    {scene==='LOCALIZE'&&<section className="focus-object-stage focus-open-book localize-stage">
      <aside className="focus-decision-pane"><div className="focus-pane-label"><span>문제</span><b>정상과 이상의 경계 찾기</b></div><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.localize.question} description="같은 사건 시점에서 바로 위 입력과 현재 출력을 비교하세요."/><article className={`boundary-focus-object ${activeBoundary.kind==='FIRST_ABNORMAL'?'abnormal':''}`}><small>{activeBoundary.kind==='LAST_NORMAL'?'LAST KNOWN NORMAL':'FIRST KNOWN ABNORMAL'}</small><h4>{activeBoundary.label}</h4><p>{activeBoundary.question}</p><aside>{activeBoundary.expectedMeaning}</aside><button type="button" onClick={collectBoundary}>이 범위의 기준과 Actual 비교</button></article><div className="boundary-status"><span className={props.lastNormalEvidenceId?'done':''}>마지막 정상 {props.lastNormalEvidenceId?'확인됨':'미확인'}</span><i>→</i><span className={props.firstAbnormalEvidenceId?'done abnormal':''}>첫 이상 {props.firstAbnormalEvidenceId?'확인됨':'미확인'}</span></div><ScopeGuide definition={props.definition} scene={scene}/>{decisionStatus}</aside>
      <div className="focus-reference-pane"><OpenBookReference key={scene} title="기능 경계 조사 자료집" pages={[
        {id:'boundary-flow',label:'경계 흐름',hint:'값과 위치',content:<BoundaryFlowGraphic definition={props.definition} frame={props.frame} focusId={activeBoundary.componentId}/>},
        {id:'architecture',label:'구조 계층',hint:'Domain→Logic',content:<ArchitectureHierarchyGraphic path={props.incidentPath} focusId={activeBoundary.componentId}/>},
        {id:'traceability',label:'추적성',hint:'Interface→Test',content:<TraceabilityLayerGraphic focusId={activeBoundary.componentId}/>},
        {id:'event',label:'사건 시점',hint:'동일 시간축',content:<ResponseTimeline definition={props.definition} frames={props.frames} index={props.selectedFrameIndex} onSelect={props.onSelectFrameIndex}/>},
      ]}/></div>
    </section>}

    {scene==='DISCRIMINATE'&&<section className="focus-object-stage focus-open-book hypothesis-stage">
      <aside className="focus-decision-pane"><div className="focus-pane-label"><span>문제</span><b>가설을 실제 모델로 시험하기</b></div><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.discriminate.question} description="정답을 고르는 단계가 아닙니다. 현재 가설을 기록하고 직접 조건을 바꿔 반증 가능한 시험을 만드세요."/><div className="hypothesis-picker">{props.definition.discriminate.hypotheses.map(hypothesis=><button type="button" key={hypothesis.id} className={selectedHypothesis===hypothesis.id?'selected':''} onClick={()=>selectWithDraft(setSelectedHypothesis,hypothesis.id,hypothesis.label)}><small>{hypothesis.category.replaceAll('_',' ')}</small><b>{hypothesis.label}</b></button>)}</div><section className="focus-simulation-controls"><header><small>SIMULATION VERIFICATION</small><b>eDrive C/WASM 비교 시험</b><span>가설은 틀려도 감점되지 않으며 결과로 수정합니다.</span></header><div className="simulation-number-grid"><label><span>입력 A · Nm</span><input type="number" min="1" max="180" value={simulationFirst} onChange={event=>setSimulationFirst(event.target.valueAsNumber)}/></label><label><span>입력 B · Nm</span><input type="number" min="1" max="180" value={simulationSecond} onChange={event=>setSimulationSecond(event.target.valueAsNumber)}/></label></div><div className="simulation-toggle"><span>고정 조건</span>{(['FORWARD','REVERSE'] as const).map(value=><button type="button" key={value} aria-pressed={simulationDirection===value} onClick={()=>setSimulationDirection(value)}>{value}</button>)}</div><div className="simulation-toggle"><span>입력 유효성</span>{(['VALID','INVALID'] as const).map(value=><button type="button" key={value} aria-pressed={simulationValidity===value} onClick={()=>setSimulationValidity(value)}>{value}</button>)}</div><button className="focus-primary simulation-run" disabled={!activeHypothesis||simulating} onClick={runSimulation}>{simulating?'3 · 2 · 1 · TEST…':'가설 기록 후 시뮬레이션 실행'}</button></section><ScopeGuide definition={props.definition} scene={scene}/>{decisionStatus}</aside>
      <div className="focus-reference-pane"><OpenBookReference key={scene} title="경쟁 가설 오픈북" pages={[
        {id:'suspects',label:'가설 보드',hint:'예측 비교',content:<div className="hypothesis-board">{props.definition.discriminate.hypotheses.map(hypothesis=><article key={hypothesis.id} className={selectedHypothesis===hypothesis.id?'selected':''}><small>{hypothesis.category.replaceAll('_',' ')}</small><b>{hypothesis.label}</b><p>{hypothesis.prediction}</p></article>)}</div>},
        {id:'location',label:'원인 위치',hint:'경계 맥락',content:<><ArchitecturePath path={props.incidentPath} focusIds={['eDrive']}/><BoundaryFlowGraphic definition={props.definition} frame={props.frame} focusId="eDrive"/></>},
        {id:'design',label:'시험 설계',hint:'고정·변경·관찰',content:<div className="test-design-graphic"><span><i>LOCK</i><b>고정 조건</b><small>Direction · Validity</small></span><em>+</em><span><i>CHANGE</i><b>입력 한 가지</b><small>{simulationFirst} → {simulationSecond} Nm</small></span><em>→</em><span><i>WATCH</i><b>출력 비교</b><small>Expected / Actual</small></span></div>},
        {id:'runner',label:'실행 모델',hint:'C/WASM 경로',content:<SimulationBenchGraphic first={simulationFirst} second={simulationSecond} direction={simulationDirection} validity={simulationValidity} running={simulating}/>},
        {id:'trace',label:'검증 추적성',hint:'Req→Test',content:<TraceabilityLayerGraphic focusId="eDrive"/>},
      ]}/></div>
    </section>}

    {scene==='VERIFY'&&<section className="focus-object-stage focus-open-book verify-stage">
      <aside className="focus-decision-pane"><div className="focus-pane-label"><span>문제</span><b>시험이 말하는 범위 해석하기</b></div><DecisionHeader eyebrow="지금 답할 질문" question={props.definition.verify.question} description="FAIL은 이 시험 범위의 기준 불만족입니다. 원인 확정과 구분하세요."/><div className="single-decision"><small>이 결과가 말할 수 있는 범위는?</small>{props.definition.verify.interpretations.map(choice=><button key={choice.id} className={selectedInterpretation===choice.id?'selected':''} onClick={()=>selectWithDraft(setSelectedInterpretation,choice.id,choice.label)}>{choice.label}</button>)}</div><button className="focus-primary" disabled={!selectedInterpretation} onClick={confirmInterpretation}>결과 해석을 근거로 저장</button><ScopeGuide definition={props.definition} scene={scene}/>{decisionStatus}</aside>
      <div className="focus-reference-pane"><OpenBookReference key={scene} title="비교 시험 결과집" pages={[
        {id:'graph',label:'결과 그래프',hint:'패턴 보기',content:<ExperimentGraphic experiment={props.latestExperiment}/>},
        {id:'table',label:'시험 원본',hint:'행별 값',content:props.latestExperiment?<div className="paired-verification"><header><span>정상 기준 EXPECTED</span><i>동일 조건</i><span>고장 실행 ACTUAL</span></header>{props.latestExperiment.rows.map(row=><div key={row.id}><b>INPUT {String(row.input)}</b><span>{String(row.expected)}</span><i className={row.pass?'pass':'fail'}>{row.pass?'MATCH':'DIFFERENCE'}</i><span>{String(row.actual)}</span></div>)}</div>:<div className="empty-visual">실행된 시험이 없습니다.</div>},
        {id:'scope',label:'판정 범위',hint:'말할 수 있는 것',content:<div className="claim-scope-graphic"><span className="yes"><b>확인 가능</b><small>선택 입력에서의 기준 불만족 · 반복 패턴</small></span><i>≠</i><span className="no"><b>자동 확정 불가</b><small>관찰하지 않은 인터페이스 · 모든 조건의 원인</small></span></div>},
      ]}/></div>
    </section>}

    {scene==='RESOLVE'&&<section className="focus-object-stage focus-open-book resolve-stage">
      <aside className="focus-decision-pane"><div className="focus-pane-label"><span>문제</span><b>근거로 결론을 묶고 재검증하기</b></div><DecisionHeader eyebrow="지금 답할 질문" question={props.diagnosis?props.definition.resolve.question:'경계와 비교 시험을 함께 설명하는 가설은 무엇인가요?'} description={props.diagnosis?'같은 재현 조건과 정상 조건을 모두 통과해야 수리가 완료됩니다.':'확보한 근거만 사용해 원인 위치와 실패 방식을 제출합니다.'}/>{!props.diagnosis?<><div className="hypothesis-picker">{props.definition.discriminate.hypotheses.map(hypothesis=><button type="button" key={hypothesis.id} className={reportHypothesisId===hypothesis.id?'selected':''} onClick={()=>selectWithDraft(setSelectedReportHypothesis,hypothesis.id,hypothesis.label)}><small>{hypothesis.location}</small><b>{hypothesis.label}</b></button>)}</div><button className="focus-primary report-submit" disabled={!reportHypothesisId} onClick={submitReport}>조사 노트 근거와 함께 보고서 제출</button></>:<div className={`resolution-verdict ${props.diagnosis.correct&&props.diagnosis.evidenceSufficient?'correct':'retry'}`}><small>REPORT REVIEW</small><h4>{props.diagnosis.correct&&props.diagnosis.evidenceSufficient?'근거가 결론을 지지합니다':'아직 설명되지 않는 단서가 있습니다'}</h4><p>{props.diagnosis.correct&&props.diagnosis.evidenceSufficient?'마지막 정상, 첫 이상, 반복 시험 결과가 하나의 설명으로 연결됩니다.':props.diagnosis.assessment?.reasons.join(' ')||'원인 후보와 근거의 연결을 다시 확인하세요.'}</p>{!props.diagnosis.correct?<button onClick={props.onRetryDiagnosis}>가설 비교로 돌아가기</button>:<><div className="repair-selector">{props.definition.resolve.repairs.map(item=><button key={item.id} className={selectedRepair===item.id?'selected':''} onClick={()=>selectWithDraft(setSelectedRepair,item.id,item.label)}><b>{item.label}</b><span>{item.explanation}</span></button>)}</div><button className="focus-primary" disabled={!repair} onClick={confirmRepair}>선택한 수리 적용 후 회귀시험</button></>}{props.latestRepair&&<p className={props.latestRepair.rows.every(row=>row.pass)?'repair-pass':'repair-fail'}>{props.latestRepair.rows.every(row=>row.pass)?'재현·회귀시험 통과 · 동일 사건 재주행으로 이동합니다.':'회귀시험 실패 · 현재 근거와 직접 연결된 수리인지 다시 확인하세요.'}</p>}</div>}<ScopeGuide definition={props.definition} scene={scene}/>{decisionStatus}</aside>
      <div className="focus-reference-pane"><OpenBookReference key={scene} title="근거 연결과 수리 자료집" pages={[
        {id:'chain',label:'근거 연결',hint:'현상→결론',content:<div className="evidence-chain-graphic"><span><i>1</i><b>현상</b><small>가속 요청 대비 반응 부족</small></span><em>→</em><span><i>2</i><b>경계</b><small>VMC 정상 · eDrive 이상</small></span><em>→</em><span><i>3</i><b>시험</b><small>입력별 비율 차이 반복</small></span><em>→</em><span><i>4</i><b>결론</b><small>eDrive 비율 계산</small></span></div>},
        {id:'system',label:'시스템 위치',hint:'전체 맥락',content:<><ArchitecturePath path={props.incidentPath} focusIds={[props.diagnosis?.component??props.definition.discriminate.hypotheses.find(item=>item.id===reportHypothesisId)?.location??'']}/><LayeredSystemVisual definition={props.definition}/></>},
        {id:'regression',label:'수리 전후',hint:'재현·정상 조건',content:<ExperimentGraphic experiment={props.latestRepair??props.latestExperiment}/>},
      ]}/></div>
    </section>}
  </main>
}
