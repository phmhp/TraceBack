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
  { id: 'SIGNALS' as TrackingView, label: '신호 비교', icon: '📈' },
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
  return (
    <div className="investigation-main-content">
      {/* PAGE 2 상단 헤더 컨테이너 */}
      <div className="p2-header-container">
        <div className="p2-top-bar">
          <div className="p2-title-box">
            <span style={{ fontSize: '24px' }}>🌲</span>
            <div>
              <h2>2. 원인 추적</h2>
              <p>같은 조건의 기대값과 사건 기록을 비교해 차이가 시작되는 경계를 추적해보세요.</p>
            </div>
          </div>

          <div className="p2-guide-box">
            💡 기대값은 같은 조건에서 계산한 모델 판정입니다. 별도의 정상 주행 기록과는 다릅니다.
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

      {trackingView === 'SIGNALS' && (
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

      {trackingView === 'INTERFACES' && (
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

      {trackingView === 'STANDARDS' && (
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
