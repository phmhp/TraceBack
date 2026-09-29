import type { TrackingView, InvestigationPresentationModel } from '../presentation/InvestigationPresentationModel'
import type { IncidentFrame } from '../../../runtime/case/PropulsionCase'
import type { InvestigationSelection } from '../../../runtime/investigation/InvestigationSession'
import { ViewAFlow } from './page2/ViewAFlow'
import { ViewBSignals } from './page2/ViewBSignals'
import { ViewCInterfaces } from './page2/ViewCInterfaces'
import { ViewDStandards } from './page2/ViewDStandards'
import { Page2ContextBar } from './page2/Page2ContextBar'

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
  onSetHypothesisTarget: (target: string, type: string) => void
  onOpenBenchWithTc?: (tcId: string) => void
  onOpenReqMap?: () => void
  onNavigateContext: (view: TrackingView, selection?: Partial<InvestigationSelection>, origin?: string) => void
}

const views = [
  { id: 'FLOW' as TrackingView, label: '기능 흐름', icon: '🌲' },
  { id: 'SIGNALS' as TrackingView, label: 'Signal Monitor', icon: '📈' },
  { id: 'INTERFACES' as TrackingView, label: '인터페이스', icon: '🔗' },
  { id: 'STANDARDS' as TrackingView, label: '요구사항', icon: '📄' }
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
  onSetHypothesisTarget,
  onOpenBenchWithTc,
  onOpenReqMap,
  onNavigateContext
}: Page2Props) {
  const requiresSelection=trackingView!=='FLOW'&&!selectedComponent
  return (
    <div className="investigation-main-content">
      {/* PAGE 2 상단 헤더 컨테이너 */}
      <div className="p2-header-container">
        <div className="p2-top-bar">
          <div className="p2-title-box">
            <span style={{ fontSize: '24px' }}>🌲</span>
            <div>
              <h2>2. 원인 추적</h2>
              <p>확인된 값에서 인접 관측점을 따라가며 차이가 처음 나타나는 위치를 좁혀보세요.</p>
            </div>
          </div>

          <div className="p2-guide-box">
            현재 값의 한 단계 앞쪽을 확인하세요. 앞 단계부터 다르면 상류를, 같다면 이 경계 이후를 살펴볼 수 있습니다.
          </div>
        </div>

        {/* 4개 서브탭 바 */}
        <div className="view-subtabs-bar">
          {views.map((v) => (
            <button
              key={v.id}
              type="button"
              className={`view-subtab-btn ${trackingView === v.id ? 'active' : ''}`}
              onClick={() => onSelectView(v.id)}
            >
              <span>{v.icon}</span>
              <span>{v.label}</span>
            </button>
          ))}
        </div>

        <Page2ContextBar
          selection={{ componentId:selectedComponent, signalId:selectedSignal, interfaceId:selectedInterface, requirementId:selectedRequirement, testCaseId:selectedTestCase }}
        />
      </div>

      {/* VIEW CONTENT */}
      {trackingView === 'FLOW' && (
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
      )}

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
        />
      )}

      {trackingView === 'STANDARDS' && !requiresSelection && (
        <ViewDStandards
          selectedComponent={selectedComponent}
          selectedRequirementId={selectedRequirement}
          onSelectRequirement={onSelectRequirement}
          onSaveAsEvidence={onSaveAsEvidence}
          onOpenBenchWithTc={onOpenBenchWithTc}
          onOpenReqMap={onOpenReqMap}
          currentFrame={currentFrame}
        />
      )}
    </div>
  )
}
