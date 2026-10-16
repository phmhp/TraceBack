import type { TrackingView, InvestigationPresentationModel } from '../presentation/InvestigationPresentationModel'
import type { IncidentFrame } from '../../../runtime/case/PropulsionCase'
import type { InvestigationSelection } from '../../../runtime/investigation/InvestigationSession'
import { ViewAFlow } from './page2/ViewAFlow'
import { ViewBSignals } from './page2/ViewBSignals'
import { ViewCInterfaces } from './page2/ViewCInterfaces'
import { ViewDStandards } from './page2/ViewDStandards'
import { Page2ContextBar } from './page2/Page2ContextBar'
import { FunctionInspector } from './page2/FunctionInspector'
import type { DiscoveredFinding } from '../../../runtime/investigation/InvestigationSession'
import type { Evidence } from '../../../runtime/investigation/Evidence.ts'
import { ReferenceVehicleInspector } from '../referenceVehicle/ReferenceVehiclePanels.tsx'
import { getReferenceEntity, getRuntimeComponentForReferenceFunction } from '../referenceVehicle/ReferenceVehicleUIAdapter.ts'
import { getOutputSignals } from '../../../registries/investigation/Architecture.ts'

interface Page2Props {
  model: InvestigationPresentationModel
  trackingView: TrackingView
  onSelectView: (view: TrackingView) => void
  selectedComponent: string
  onSelectComponent: (id: string) => void
  selectedSignal: string
  onSelectSignal: (sig: string) => void
  selectedInterface: string
  onSelectInterface: (id: string) => void
  selectedRequirement: string
  onSelectRequirement: (id: string) => void
  selectedTestCase: string
  onSelectTestCase: (id: string) => void
  currentFrame: IncidentFrame | undefined
  frames: readonly IncidentFrame[]
  onSelectFrameIndex: (idx: number) => void
  onSaveAsEvidence: (title: string) => void
  onCompareSignal: (id:string) => void
  onIdentifyExpectedBasis: (id:string) => void
  onInspectInterfaceCapability: (id:string) => void
  onSetHypothesisTarget: (target: string) => void
  onOpenBenchWithTc?: (tcId: string) => void
  onNavigateContext: (view: TrackingView, selection?: Partial<InvestigationSelection>, origin?: string) => void
  discoveredFindings: readonly DiscoveredFinding[]
  collectedEvidenceIds: readonly string[]
  boundaryActive:boolean
  normalCandidates:readonly Evidence[]
  abnormalCandidates:readonly Evidence[]
  lastNormalEvidenceId?:string
  firstAbnormalEvidenceId?:string
  onMarkBoundary:(kind:'LAST_NORMAL'|'FIRST_ABNORMAL',id:string)=>void
}

const views = [
  { id: 'FLOW' as TrackingView, label: '구조 및 기능' },
  { id: 'SIGNALS' as TrackingView, label: '연관 신호' },
  { id: 'INTERFACES' as TrackingView, label: '인터페이스' },
  { id: 'STANDARDS' as TrackingView, label: '요구사항' }
]

function BoundaryAssignmentPanel({normalCandidates,abnormalCandidates,lastNormalEvidenceId,firstAbnormalEvidenceId,onMarkBoundary}:{normalCandidates:readonly Evidence[];abnormalCandidates:readonly Evidence[];lastNormalEvidenceId?:string;firstAbnormalEvidenceId?:string;onMarkBoundary:(kind:'LAST_NORMAL'|'FIRST_ABNORMAL',id:string)=>void}){
  return <section className="guided-boundary-panel" aria-label="정상과 이상 경계 답안">
    <header><span>전체 3–4/7</span><div><b>정상은 어디까지였나요?</b><small>저장한 실제 신호 근거로 두 경계를 지정하세요.</small></div></header>
    <div className="boundary-evidence-picker">
      <label><span>마지막 정상<small>LAST KNOWN NORMAL</small></span><select value={lastNormalEvidenceId??''} onChange={event=>event.target.value&&onMarkBoundary('LAST_NORMAL',event.target.value)}><option value="">정상 근거 선택</option>{normalCandidates.map(item=><option key={item.id} value={item.id}>{item.details?.subjectId??item.title}</option>)}</select></label>
      <i aria-hidden="true">→</i>
      <label><span>첫 이상<small>FIRST KNOWN ABNORMAL</small></span><select value={firstAbnormalEvidenceId??''} onChange={event=>event.target.value&&onMarkBoundary('FIRST_ABNORMAL',event.target.value)}><option value="">이상 근거 선택</option>{abnormalCandidates.map(item=><option key={item.id} value={item.id}>{item.details?.subjectId??item.title}</option>)}</select></label>
    </div>
  </section>
}

export function Page2Tracking({
  model,
  trackingView,
  onSelectView,
  selectedComponent,
  onSelectComponent,
  selectedSignal,
  onSelectSignal,
  selectedInterface,
  onSelectInterface,
  selectedRequirement,
  onSelectRequirement,
  selectedTestCase,
  onSelectTestCase,
  currentFrame,
  frames,
  onSelectFrameIndex,
  onSaveAsEvidence,
  onCompareSignal,
  onIdentifyExpectedBasis,
  onInspectInterfaceCapability,
  onSetHypothesisTarget,
  onOpenBenchWithTc,
  onNavigateContext,
  discoveredFindings,
  collectedEvidenceIds,
  boundaryActive,
  normalCandidates,
  abnormalCandidates,
  lastNormalEvidenceId,
  firstAbnormalEvidenceId,
  onMarkBoundary,
}: Page2Props) {
  const referenceFunction=getReferenceEntity(selectedComponent)?.entityKind==='LOGICAL_FUNCTION'
  const runtimeComponent=getRuntimeComponentForReferenceFunction(selectedComponent)
  const toolComponent=runtimeComponent??selectedComponent
  const toolOutputIds=getOutputSignals(toolComponent).map(signal=>signal.id)
  const hasMismatchEvidence=discoveredFindings.some(finding=>finding.outcome==='MISMATCH'&&toolOutputIds.includes(finding.subjectId))
  const referenceOnly=referenceFunction&&!runtimeComponent
  const requiresSelection=trackingView!=='FLOW'&&!selectedComponent
  const path=model.relevantFunctionPath
  const selectedPathIndex=path.indexOf(selectedComponent)
  const currentPath=selectedPathIndex>=0?[...path.slice(selectedPathIndex)].reverse():[]
  const previousFrame=currentFrame?frames[Math.max(0,frames.findIndex(frame=>frame.id===currentFrame.id)-1)]:undefined
  return (
    <div className="investigation-main-content">
      {/* PAGE 2 상단 헤더 컨테이너 */}
      <div className="p2-header-container">
        <div className="p2-top-bar">
          <div className="p2-title-box">
            <span className="p2-title-icon">🌲</span>
            <div>
              <h2>2. 조사 지도</h2>
              <p>주행 중 이상이 나타난 영역을 고른 뒤, 출력에서 입력 방향으로 흐름을 추적하세요.</p>
            </div>
          </div>

        </div>

        <div className="view-subtabs-bar inspector-mode-bar">
          <span className="tool-tabs-label">Inspector</span>
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`view-subtab-btn ${trackingView === v.id ? 'active' : ''}`}
              onClick={() => onSelectView(v.id)}
            >
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        {discoveredFindings.length>0&&<details className="reasoning-trace" aria-label="확인한 조사 사실"><summary>확인한 사실 {discoveredFindings.length}개 · 조사 노트 {collectedEvidenceIds.length}건</summary><div>{discoveredFindings.slice(-4).map(finding=><span key={finding.id} className={(finding.outcome??'observed').toLowerCase()}>{finding.outcome==='MATCH'?'✓':finding.outcome==='MISMATCH'?'!':finding.kind==='REQUIREMENT'?'▣':'·'} {finding.claim??finding.subjectId}</span>)}</div></details>}
      </div>

      <div className={`investigation-map-layout ${trackingView==='FLOW'?'flow-layout':'tool-layout'}`}>
        {trackingView==='FLOW'&&
        <aside className="investigation-map-pane" onClick={event=>{if(event.target===event.currentTarget)onSelectComponent('')}}>
          <ViewAFlow
          model={model}
          selectedComponent={selectedComponent}
          onSelectComponent={onSelectComponent}
          onNavigateToSignal={(signalId) => {
            onSelectSignal(signalId)
            onNavigateContext('SIGNALS', { signalId }, `기능에서 ${signalId} 신호 비교로 이동`)
          }}
          onNavigateToInterface={(interfaceId) => onNavigateContext('INTERFACES', { interfaceId }, `기능에서 ${interfaceId} 인터페이스로 이동`)}
          onNavigateToRequirement={(requirementId) => onNavigateContext('STANDARDS', { requirementId }, `기능에서 ${requirementId} 요구사항으로 이동`)}
          onSetHypothesisTarget={onSetHypothesisTarget}
          />
        </aside>}
        <div className="context-inspector-pane">
          <Page2ContextBar selection={{ componentId:selectedComponent, signalId:selectedSignal, interfaceId:selectedInterface, requirementId:selectedRequirement, testCaseId:selectedTestCase }} currentPath={currentPath}/>
          {trackingView === 'FLOW' && selectedComponent&&<details className="technical-detail-drawer function-inspector-drawer"><summary>선택 기능의 연결·출처 자세히</summary><FunctionInspector
            model={model}
            selectedComponent={toolComponent}
            selectedSignal={selectedSignal}
            hasMismatchEvidence={hasMismatchEvidence}
            currentFrame={currentFrame}
            previousFrame={previousFrame}
            onSelectSignal={onSelectSignal}
            onCompareSignal={onCompareSignal}
            onSaveAsEvidence={onSaveAsEvidence}
            onOpenSignalTimeline={(signalId)=>onNavigateContext('SIGNALS',{signalId},`${signalId} 시간 흐름 열기`)}
            onOpenInterface={(interfaceId)=>onNavigateContext('INTERFACES',{interfaceId},`${interfaceId} 경계 검사`)}
            onOpenRequirement={(requirementId)=>onNavigateContext('STANDARDS',{requirementId},`${requirementId} 기준 확인`)}
            onSetHypothesisTarget={onSetHypothesisTarget}
          /></details>}

          {referenceOnly&&trackingView!=='FLOW'&&<ReferenceVehicleInspector
            view={trackingView}
            selectedComponent={selectedComponent}
            selectedSignal={selectedSignal}
            selectedInterface={selectedInterface}
            selectedRequirement={selectedRequirement}
            selectedTestCase={selectedTestCase}
            onSelectComponent={(id)=>onNavigateContext('FLOW',{componentId:id},`${id} Reference Function으로 이동`)}
            onNavigateToSignal={(id)=>onNavigateContext('SIGNALS',{signalId:id},`${id} Reference Signal로 이동`)}
            onNavigateToInterface={(id)=>onNavigateContext('INTERFACES',{interfaceId:id},`${id} Reference Interface로 이동`)}
            onNavigateToRequirement={(id)=>onNavigateContext('STANDARDS',{requirementId:id},`${id} Reference Requirement로 이동`)}
            onSelectTestCase={onSelectTestCase}
          />}

      {requiresSelection&&<section className="selection-required"><p className="investigation-section-label">조사 컨텍스트 필요</p><h3>먼저 조사할 기능을 선택하세요.</h3><p>Signal Monitor, 인터페이스와 요구사항은 선택한 기능을 기준으로 정보를 보여줍니다.</p><button type="button" onClick={()=>onSelectView('FLOW')}>기능 흐름에서 선택 →</button></section>}

      {trackingView==='SIGNALS'&&boundaryActive&&!requiresSelection&&<BoundaryAssignmentPanel normalCandidates={normalCandidates} abnormalCandidates={abnormalCandidates} lastNormalEvidenceId={lastNormalEvidenceId} firstAbnormalEvidenceId={firstAbnormalEvidenceId} onMarkBoundary={onMarkBoundary}/>}

      {trackingView === 'SIGNALS' && !requiresSelection && !referenceOnly && (
        <ViewBSignals
          selectedComponent={toolComponent}
          selectedSignal={selectedSignal}
          onSelectSignal={onSelectSignal}
          currentFrame={currentFrame}
          frames={frames}
          onSelectFrameIndex={onSelectFrameIndex}
          onSaveAsEvidence={onSaveAsEvidence}
          onCompareSignal={onCompareSignal}
          onNavigateToStandards={() => onNavigateContext('STANDARDS', undefined, '신호에서 요구사항으로 이동')}
          onNavigateToInterfaces={() => onNavigateContext('INTERFACES', { signalId:selectedSignal }, '신호에서 전달 인터페이스로 이동')}
          onNavigateToComponent={(componentId) => onNavigateContext('FLOW', { componentId }, `신호에서 ${componentId} 기능으로 이동`)}
        />
      )}

      {trackingView === 'INTERFACES' && !requiresSelection && !referenceOnly && (
        <ViewCInterfaces
          model={model}
          selectedInterfaceId={selectedInterface}
          selectedComponentId={toolComponent}
          onSelectInterface={onSelectInterface}
          selectedSignalId={selectedSignal}
          onSelectSignal={onSelectSignal}
          onNavigateToComponent={(id) => onNavigateContext('FLOW', { componentId:id }, '인터페이스에서 기능으로 이동')}
          onNavigateToSignal={(id) => onNavigateContext('SIGNALS', { signalId:id }, `인터페이스에서 ${id} 신호 비교로 이동`)}
          onNavigateToRequirement={(id) => onNavigateContext('STANDARDS', { requirementId:id }, `인터페이스 연결 기능에서 ${id} 요구사항으로 이동`)}
          onInspectCapability={onInspectInterfaceCapability}
        />
      )}

      {trackingView === 'STANDARDS' && !requiresSelection && !referenceOnly && (
        <ViewDStandards
          selectedComponent={toolComponent}
          selectedSignal={selectedSignal}
          selectedRequirementId={selectedRequirement}
          onSelectRequirement={onSelectRequirement}
          onSaveAsEvidence={onSaveAsEvidence}
          onIdentifyExpectedBasis={onIdentifyExpectedBasis}
          onOpenBenchWithTc={onOpenBenchWithTc}
          currentFrame={currentFrame}
          onOpenSignals={()=>onNavigateContext('SIGNALS',{signalId:selectedSignal},'요구사항에서 연관 신호로 이동')}
        />
      )}
        </div>
      </div>
    </div>
  )
}
