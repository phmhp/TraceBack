import { useEffect, useMemo, useState } from 'react'
import type { TrackingView } from '../presentation/InvestigationPresentationModel.ts'
import type { ReferenceVehicleEntity } from '../../../referenceVehicle/index.ts'
import {
  getReferenceEntity,
  getReferenceFocus,
  getReferenceFunctionContext,
  getReferenceFunctionsForArea,
  getReferenceInterfaceContext,
  getReferenceRequirementContext,
  getReferenceSignalContext,
  getReferenceStatus,
  getReferenceTestContext,
  referenceVehicleAreas,
} from './ReferenceVehicleUIAdapter.ts'

interface NavigationProps {
  onSelectComponent: (id: string) => void
  onNavigateToSignal: (id: string) => void
  onNavigateToInterface: (id: string) => void
  onNavigateToRequirement: (id: string) => void
  onSelectTestCase?: (id: string) => void
}

const display = (entity: ReferenceVehicleEntity) => entity.name || entity.id

function StatusStrip({ entity }: { entity: ReferenceVehicleEntity }) {
  const status = getReferenceStatus(entity)
  return <span className="reference-status-strip">
    <b>{status.capability}</b><span>{status.scope}</span>{status.open&&<em>OPEN DECISION</em>}
  </span>
}

export function ReferenceVehicleArchitecture({ selectedComponent, onSelectComponent }: Pick<NavigationProps, 'onSelectComponent'> & { selectedComponent: string }) {
  const selectedEntity = getReferenceEntity(selectedComponent)
  const selectedFunctionArea = selectedEntity?.entityKind === 'LOGICAL_FUNCTION' ? String(selectedEntity.metadata.areaId ?? '') : ''
  const [areaId, setAreaId] = useState(selectedFunctionArea || 'PROPULSION')
  useEffect(() => { if (selectedFunctionArea) setAreaId(selectedFunctionArea) }, [selectedFunctionArea])
  const functions = useMemo(() => getReferenceFunctionsForArea(areaId), [areaId])
  return <section className="reference-vehicle-architecture" aria-labelledby="reference-vehicle-title">
    <header className="reference-vehicle-heading">
      <div><p className="investigation-section-label">WHOLE VEHICLE · REFERENCE ARCHITECTURE</p><h3 id="reference-vehicle-title">전체 차량에서 조사 위치 찾기</h3><p>16개 Area와 74개 Logical Function을 canonical Registry에서 표시합니다. Reference-only 영역도 숨기지 않습니다.</p></div>
      <div className="reference-layer-key" aria-label="표시 계층 설명"><span><b>PRIMARY</b> 현재 Case 관계</span><span><b>CONTEXT</b> 같은 Area</span><span><b>BACKGROUND</b> 전체 차량</span></div>
    </header>
    <div className="reference-scope-explainer">
      <span><b>Whole Vehicle</b> 전체 Reference Design</span><i>→</i><span><b>CASE-PT-001</b> Registry가 연결한 사건 경로</span><i>→</i><span><b>Current Runtime</b> 기존 실행·관측 가능 범위</span>
    </div>
    <div className="reference-area-grid" aria-label="Reference Vehicle Area 선택">
      {referenceVehicleAreas.map(area => {
        const focus=getReferenceFocus(area), count=getReferenceFunctionsForArea(area.id).length
        return <button type="button" key={area.id} className={`${areaId===area.id?'selected ':''}focus-${focus.toLowerCase()}`} aria-pressed={areaId===area.id} onClick={()=>setAreaId(area.id)}><strong>{display(area)}</strong><small>{area.id} · {count} Functions</small></button>
      })}
    </div>
    <section className="reference-function-browser" aria-label={`${areaId} Logical Functions`}>
      <header><div><p className="investigation-section-label">SELECTED AREA</p><h4>{areaId}</h4></div><small>{functions.length}개 canonical Logical Function</small></header>
      <div>{functions.map(fn => <button type="button" key={fn.id} className={`${selectedComponent===fn.id?'selected ':''}focus-${getReferenceFocus(fn).toLowerCase()}`} aria-pressed={selectedComponent===fn.id} onClick={()=>onSelectComponent(fn.id)}><span><strong>{display(fn)}</strong><code>{fn.id}</code></span><StatusStrip entity={fn}/></button>)}</div>
    </section>
  </section>
}

interface InspectorProps extends NavigationProps {
  view: TrackingView
  selectedComponent: string
  selectedSignal: string
  selectedInterface: string
  selectedRequirement: string
  selectedTestCase: string
}

export function ReferenceVehicleInspector(props: InspectorProps) {
  const context=getReferenceFunctionContext(props.selectedComponent)
  if(!context)return null
  if(props.view==='SIGNALS')return <ReferenceSignals {...props} context={context}/>
  if(props.view==='INTERFACES')return <ReferenceInterfaces {...props} context={context}/>
  if(props.view==='STANDARDS')return <ReferenceRequirements {...props} context={context}/>
  return <section className="reference-entity-inspector" aria-label="Reference Logical Function 상세">
    <header><div><p className="investigation-section-label">REFERENCE LOGICAL FUNCTION</p><h3>{display(context.entity)}</h3><code>{context.entity.id}</code></div><StatusStrip entity={context.entity}/></header>
    <p className="investigation-prose">{context.entity.description || 'Canonical 설명이 등록되지 않았습니다.'}</p>
    <dl className="reference-identity-grid"><div><dt>Area</dt><dd>{context.area?.id ?? 'UNRESOLVED'}</dd></div><div><dt>Function kind</dt><dd>{String(context.entity.metadata.functionKind ?? 'NOT_RECORDED')}</dd></div><div><dt>Case relevance</dt><dd>{context.caseRelevant?'CASE-PT-001 관계 있음':'현재 Case 직접 관계 없음'}</dd></div><div><dt>Source</dt><dd>{context.entity.source.path}</dd></div></dl>
    <section className="reference-flow-summary"><div><small>INPUT SIGNALS</small>{context.inputs.map(signal=><button type="button" key={signal.id} onClick={()=>props.onNavigateToSignal(signal.id)}><code>{signal.id}</code><span>{String(signal.metadata.semanticKind??'SIGNAL')}</span></button>)}{!context.inputs.length&&<p>등록된 입력 없음</p>}</div><i>→</i><div className="reference-function-core"><b>{context.entity.id}</b><span>{context.entity.description}</span></div><i>→</i><div><small>OUTPUT SIGNALS</small>{context.outputs.map(signal=><button type="button" key={signal.id} onClick={()=>props.onNavigateToSignal(signal.id)}><code>{signal.id}</code><span>{String(signal.metadata.semanticKind??'SIGNAL')}</span></button>)}{!context.outputs.length&&<p>등록된 출력 없음</p>}</div></section>
    <div className="reference-related-columns"><section><h4>Interfaces</h4>{context.interfaces.map(entity=><button type="button" key={entity.id} onClick={()=>props.onNavigateToInterface(entity.id)}><code>{entity.id}</code><span>{entity.pathScope??entity.referenceStatus}</span></button>)}</section><section><h4>Requirements</h4>{context.requirements.map(entity=><button type="button" key={entity.id} onClick={()=>props.onNavigateToRequirement(entity.id)}><code>{entity.id}</code><span>{entity.approvalStatus}</span></button>)}</section></div>
  </section>
}

function ReferenceSignals({ context, selectedSignal, onNavigateToSignal, onNavigateToInterface, onSelectComponent }: InspectorProps & { context: NonNullable<ReturnType<typeof getReferenceFunctionContext>> }) {
  const available=[...context.inputs,...context.outputs]
  const signalContext=getReferenceSignalContext(available.some(item=>item.id===selectedSignal)?selectedSignal:available[0]?.id??'')
  const stateKinds=new Set(['STATE','STATUS','VALIDITY','MODE','CONDITION'])
  const states=context.inputs.filter(signal=>stateKinds.has(String(signal.metadata.semanticKind??'')))
  const inputs=context.inputs.filter(signal=>!states.includes(signal))
  const group=(title:string,items:typeof available)=><section className="monitor-signal-group always-open"><header><b>{title}</b><span>{items.length}개</span></header>{items.length?items.map(signal=><button type="button" key={signal.id} aria-pressed={signalContext?.entity.id===signal.id} onClick={()=>onNavigateToSignal(signal.id)}><code>{signal.id}</code><small>{signal.description||String(signal.metadata.semanticKind??'SIGNAL')}</small></button>):<p>등록된 신호 없음</p>}</section>
  return <div className="signal-monitor-workspace reference-tool-compatible"><header className="monitor-heading"><div><p className="investigation-section-label">연관 신호</p><h3>{display(context.entity)}의 전제조건·입력·출력</h3><p>신호 역할을 구분해 기능이 무엇을 받고 무엇을 내보내는지 확인합니다.</p></div><span className="reference-count">{available.length} SIGNALS</span></header><div className="monitor-signal-groups">{group('A. 전제조건 / 상태',states)}{group('B. 기능 입력',inputs)}{group('C. 기능 출력',context.outputs)}</div>{signalContext&&<section className="signal-identity-card"><header><div><p className="investigation-section-label">선택 신호의 역할</p><h3>{signalContext.entity.description||signalContext.entity.name}</h3></div><code>{signalContext.entity.id}</code></header><div className="signal-path-strip"><span><small>생성</small>{signalContext.producers.map(display).join(' · ')||'외부 입력 / 상태'}</span><i>→</i><span><small>신호 의미</small><code>{signalContext.entity.id}</code><em>{String(signalContext.entity.metadata.semanticKind??'SIGNAL')} · {String(signalContext.entity.metadata.unit??'unit not recorded')}</em></span><i>→</i><span><small>사용</small>{signalContext.consumers.map(display).join(' · ')||'차량 반응'}</span></div><div className="signal-definition-runtime"><span><b>SIGNAL DEFINITION</b>{signalContext.entity.referenceStatus}</span><span><b>RUNTIME OBSERVATION</b>{signalContext.runtimeObservable?'현재 incident trace에서 실제 값 관측 가능':'Reference definition only · live 값 없음'}</span></div><div className="reference-related-columns"><section><h4>생성 / 사용 기능</h4>{[...signalContext.producers,...signalContext.consumers].map(entity=><button type="button" key={entity.id} onClick={()=>onSelectComponent(entity.id)}><code>{entity.id}</code><span>{display(entity)}</span></button>)}</section><section><h4>전달 인터페이스</h4>{signalContext.interfaces.map(entity=><button type="button" key={entity.id} onClick={()=>onNavigateToInterface(entity.id)}><code>{entity.id}</code><span>{entity.pathScope}</span></button>)}</section></div></section>}</div>
}

function ReferenceInterfaces({ context, selectedInterface, onNavigateToInterface, onNavigateToSignal }: InspectorProps & { context: NonNullable<ReturnType<typeof getReferenceFunctionContext>> }) {
  const interfaceContext=getReferenceInterfaceContext(context.interfaces.some(item=>item.id===selectedInterface)?selectedInterface:context.interfaces[0]?.id??'')
  const contexts=context.interfaces.map(entity=>getReferenceInterfaceContext(entity.id)).filter((item):item is NonNullable<ReturnType<typeof getReferenceInterfaceContext>>=>Boolean(item))
  const incoming=contexts.filter(item=>item.consumers.some(entity=>entity.id===context.entity.id)),outgoing=contexts.filter(item=>item.producers.some(entity=>entity.id===context.entity.id))
  const port=(direction:'input'|'output',items:typeof contexts)=><div className={`function-port-column ${direction==='input'?'incoming':'outgoing'}`}><small>{direction==='input'?'입력 포트':'출력 포트'}</small>{items.length?items.map(item=><button type="button" key={item.entity.id} className={interfaceContext?.entity.id===item.entity.id?'selected':''} onClick={()=>onNavigateToInterface(item.entity.id)}><code>{item.entity.id}</code><span>{item.signals.map(signal=>signal.id).join(' · ')||'신호 미등록'}</span><small>{direction==='input'?`← ${item.producers.map(display).join(' · ')}`:`→ ${item.consumers.map(display).join(' · ')}`}</small></button>):<p>등록된 포트 없음</p>}</div>
  return <div className="interface-investigation reference-tool-compatible"><section className="interface-primary-sheet"><header className="interface-sheet-heading"><div><p className="investigation-section-label">인터페이스</p><h3>현재 기능 · <code>{display(context.entity)}</code></h3></div><span className="reference-count">{context.interfaces.length} INTERFACES</span></header><p className="tool-question">어떤 신호가 이 기능으로 들어오고, 처리 뒤 어디로 전달되나요?</p><div className="function-port-diagram">{port('input',incoming)}<div className="function-boundary-block"><small>기능 경계</small><strong>{display(context.entity)}</strong><code>{context.entity.id}</code></div>{port('output',outgoing)}</div>{interfaceContext&&<><div className="interface-direction-diagram"><div className="interface-function-node sender"><small>생성 기능 · 출력</small><strong>{interfaceContext.producers.map(display).join(' · ')||'미등록'}</strong></div><div className="interface-connector"><span className="interface-arrow-line"/><button type="button" className="selected-interface-edge"><small>{interfaceContext.entity.id}</small><span>{interfaceContext.entity.description}</span></button><span className="interface-arrow-head">▶</span></div><div className="interface-function-node receiver"><small>사용 기능 · 입력</small><strong>{interfaceContext.consumers.map(display).join(' · ')||'미등록'}</strong></div></div><section className="interface-carried-signals"><div className="interface-carried-heading"><strong>이 인터페이스가 전달하는 신호</strong></div><div className="reference-selector-list">{interfaceContext.signals.map(entity=><button type="button" key={entity.id} onClick={()=>onNavigateToSignal(entity.id)}><code>{entity.id}</code><span>{String(entity.metadata.semanticKind??'SIGNAL')}</span></button>)}</div></section><section className="interface-reference-context"><header><div><p className="investigation-section-label">BOUNDARY CONTEXT</p><h4>{interfaceContext.entity.name||interfaceContext.entity.id}</h4></div><StatusStrip entity={interfaceContext.entity}/></header><dl><div><dt>경계 종류</dt><dd>{String(interfaceContext.entity.metadata.boundaryKind??'NOT_RECORDED')}</dd></div><div><dt>현재 전달</dt><dd>{String(interfaceContext.entity.metadata.runtimeTransferStatus??'NOT_RECORDED')}</dd></div><div><dt>관찰 가능</dt><dd>{String(interfaceContext.entity.metadata.observationPointStatus??'NOT_RECORDED')}</dd></div><div><dt>양단 비교</dt><dd>{String(interfaceContext.entity.metadata.comparisonCapabilityStatus??'NOT_RECORDED')}</dd></div></dl><small>Logical Interface는 특정 물리 통신 방식을 자동으로 의미하지 않습니다.</small></section></>}</section></div>
}

function ReferenceRequirements({ context, selectedRequirement, selectedTestCase, onNavigateToRequirement, onSelectTestCase }: InspectorProps & { context: NonNullable<ReturnType<typeof getReferenceFunctionContext>> }) {
  const requirementContext=getReferenceRequirementContext(context.requirements.some(item=>item.id===selectedRequirement)?selectedRequirement:context.requirements[0]?.id??'')
  const selectedTest=getReferenceTestContext(selectedTestCase)
  return <div className="requirement-inspector reference-tool-compatible"><section className="requirement-mind-map" aria-label="관련 요구사항 마인드맵"><header><div><p className="investigation-section-label">관련 요구사항 마인드맵</p><h3>{display(context.entity)} 추적 관계</h3></div><small>{context.requirements.length}개 요구사항 연결</small></header><div className="reference-requirement-map"><article className="function"><small>선택 기능</small><strong>{display(context.entity)}</strong><code>{context.entity.id}</code></article><i aria-hidden="true">→</i><section><small>할당 요구사항</small>{context.requirements.map(entity=><button type="button" key={entity.id} className={requirementContext?.entity.id===entity.id?'selected':''} onClick={()=>onNavigateToRequirement(entity.id)}><code>{entity.id}</code><span>{entity.description||entity.name}</span></button>)}{!context.requirements.length&&<p>연결된 요구사항 없음</p>}</section><i aria-hidden="true">→</i><section><small>검증 시험</small>{context.tests.map(test=><button type="button" key={test.id} className={selectedTest?.id===test.id?'selected':''} onClick={()=>onSelectTestCase?.(test.id)}><code>{test.id}</code><span>{test.referenceStatus}</span></button>)}{!context.tests.length&&<p>연결된 시험 없음</p>}</section></div></section>{requirementContext&&<><header className="context-inspector-heading"><div><p className="investigation-section-label">정상 동작 기준 · 요구사항</p><h3>{display(context.entity)}</h3><code className="investigation-tech-id">{requirementContext.entity.id}</code></div></header><section className="requirement-source-statement"><p className="investigation-section-label">요구사항 내용</p><code>{requirementContext.entity.id}</code><p>{requirementContext.entity.description}</p></section><section className="requirement-engineering-detail always-open"><dl><div><dt>수준</dt><dd>{String(requirementContext.entity.metadata.level??'NOT_RECORDED')}</dd></div><div><dt>담당</dt><dd>{String(requirementContext.entity.metadata.owner??'NOT_RECORDED')}</dd></div><div><dt>승인 상태</dt><dd>{requirementContext.entity.approvalStatus}</dd></div><div><dt>Expected / Oracle</dt><dd>{String(requirementContext.entity.metadata.expectedOracleStatus??'NOT_RECORDED')}</dd></div></dl></section>{selectedTest&&<p className="reference-runtime-note"><b>{selectedTest.id}</b>는 {selectedTest.referenceStatus}이며, Registry 연결만으로 실행 가능한 PASS/FAIL을 의미하지 않습니다.</p>}</>}</div>
}
