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
  currentFrame: IncidentFrame | undefined
  frames: readonly IncidentFrame[]
  onSelectFrameIndex: (idx: number) => void
  onSaveAsEvidence: (title: string) => void
  onCompareSignal: (id:string) => void
  onIdentifyExpectedBasis: (id:string) => void
  onInspectInterfaceCapability: (id:string) => void
  onSetHypothesisTarget: (target: string) => void
  onOpenBenchWithTc?: (tcId: string) => void
  onOpenReqMap?: () => void
  onNavigateContext: (view: TrackingView, selection?: Partial<InvestigationSelection>, origin?: string) => void
  discoveredFindings: readonly DiscoveredFinding[]
  collectedEvidenceIds: readonly string[]
}

const views = [
  { id: 'FLOW' as TrackingView, label: '기능 판독' },
  { id: 'SIGNALS' as TrackingView, label: '시간 흐름' },
  { id: 'INTERFACES' as TrackingView, label: '전달 경계' },
  { id: 'STANDARDS' as TrackingView, label: '정상 기준' }
]

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
  currentFrame,
  frames,
  onSelectFrameIndex,
  onSaveAsEvidence,
  onCompareSignal,
  onIdentifyExpectedBasis,
  onInspectInterfaceCapability,
  onSetHypothesisTarget,
  onOpenBenchWithTc,
  onOpenReqMap,
  onNavigateContext,
  discoveredFindings,
  collectedEvidenceIds,
}: Page2Props) {
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
              <p>차량 반응에서 상류로 거슬러 올라가며 처음 달라지는 지점을 찾으세요.</p>
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

        <Page2ContextBar
          selection={{ componentId:selectedComponent, signalId:selectedSignal, interfaceId:selectedInterface, requirementId:selectedRequirement, testCaseId:selectedTestCase }}
        />
        {currentPath.length>0&&<div className="current-investigation-path"><span>현재 조사 경로</span><div>{currentPath.map((id,index)=><span key={id}>{index>0&&<i>←</i>}<code>{id==='VehiclePhysics'?'Vehicle Response':id}</code></span>)}</div></div>}
        {discoveredFindings.length>0&&<div className="reasoning-trace" aria-label="확인한 조사 사실"><span>확인한 사실</span><div>{discoveredFindings.slice(-4).map(finding=><span key={finding.id} className={(finding.outcome??'observed').toLowerCase()}>{finding.outcome==='MATCH'?'✓':finding.outcome==='MISMATCH'?'!':finding.kind==='REQUIREMENT'?'▣':'·'} {finding.claim??finding.subjectId}</span>)}</div>{collectedEvidenceIds.length>0&&<small>조사 노트 {collectedEvidenceIds.length}건</small>}</div>}
      </div>

      <div className="investigation-map-layout">
        <aside className="investigation-map-pane">
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
        </aside>
        <div className="context-inspector-pane">
          {trackingView === 'FLOW' && <FunctionInspector
            model={model}
            selectedComponent={selectedComponent}
            selectedSignal={selectedSignal}
            currentFrame={currentFrame}
            previousFrame={previousFrame}
            onSelectSignal={onSelectSignal}
            onCompareSignal={onCompareSignal}
            onSaveAsEvidence={onSaveAsEvidence}
            onOpenSignalTimeline={(signalId)=>onNavigateContext('SIGNALS',{signalId},`${signalId} 시간 흐름 열기`)}
            onOpenInterface={(interfaceId)=>onNavigateContext('INTERFACES',{interfaceId},`${interfaceId} 경계 검사`)}
            onOpenRequirement={(requirementId)=>onNavigateContext('STANDARDS',{requirementId},`${requirementId} 기준 확인`)}
            onSetHypothesisTarget={onSetHypothesisTarget}
          />}

      {requiresSelection&&<section className="selection-required"><p className="investigation-section-label">조사 컨텍스트 필요</p><h3>먼저 조사할 기능을 선택하세요.</h3><p>Signal Monitor, 인터페이스와 요구사항은 선택한 기능을 기준으로 정보를 보여줍니다.</p><button type="button" onClick={()=>onSelectView('FLOW')}>기능 흐름에서 선택 →</button></section>}

      {trackingView === 'SIGNALS' && !requiresSelection && (
        <ViewBSignals
          selectedComponent={selectedComponent}
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

      {trackingView === 'INTERFACES' && !requiresSelection && (
        <ViewCInterfaces
          model={model}
          selectedInterfaceId={selectedInterface}
          selectedComponentId={selectedComponent}
          onSelectInterface={onSelectInterface}
          selectedSignalId={selectedSignal}
          onSelectSignal={onSelectSignal}
          onNavigateToComponent={(id) => onNavigateContext('FLOW', { componentId:id }, '인터페이스에서 기능으로 이동')}
          onNavigateToSignal={(id) => onNavigateContext('SIGNALS', { signalId:id }, `인터페이스에서 ${id} 신호 비교로 이동`)}
          onNavigateToRequirement={(id) => onNavigateContext('STANDARDS', { requirementId:id }, `인터페이스 연결 기능에서 ${id} 요구사항으로 이동`)}
          onInspectCapability={onInspectInterfaceCapability}
        />
      )}

      {trackingView === 'STANDARDS' && !requiresSelection && (
        <ViewDStandards
          selectedComponent={selectedComponent}
          selectedSignal={selectedSignal}
          selectedRequirementId={selectedRequirement}
          onSelectRequirement={onSelectRequirement}
          onSaveAsEvidence={onSaveAsEvidence}
          onIdentifyExpectedBasis={onIdentifyExpectedBasis}
          onOpenBenchWithTc={onOpenBenchWithTc}
          onOpenReqMap={onOpenReqMap}
          currentFrame={currentFrame}
        />
      )}
        </div>
      </div>
    </div>
  )
}
