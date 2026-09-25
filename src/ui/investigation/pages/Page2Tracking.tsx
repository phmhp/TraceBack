import type { TrackingView, InvestigationPresentationModel } from '../presentation/InvestigationPresentationModel'
import type { IncidentFrame } from '../../../runtime/case/PropulsionCase'
import { architectureNode } from '../../../registries/investigation/Architecture'
import { ViewAFlow } from './page2/ViewAFlow'
import { ViewBSignals } from './page2/ViewBSignals'
import { ViewCInterfaces } from './page2/ViewCInterfaces'
import { ViewDStandards } from './page2/ViewDStandards'

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
  currentFrame: IncidentFrame | undefined
  frames: readonly IncidentFrame[]
  onSelectFrameIndex: (idx: number) => void
  onSaveAsEvidence: (title: string) => void
  onSetHypothesisTarget: (target: string, type: string) => void
  onOpenFullArch: () => void
  onOpenBenchWithTc?: (tcId: string) => void
}

const views = [
  { id: 'FLOW' as TrackingView, label: '기능 흐름', icon: '🌲' },
  { id: 'SIGNALS' as TrackingView, label: '신호 비교', icon: '📈' },
  { id: 'INTERFACES' as TrackingView, label: '인터페이스', icon: '🔗' },
  { id: 'STANDARDS' as TrackingView, label: '정상 기준', icon: '📄' }
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
  currentFrame,
  frames,
  onSelectFrameIndex,
  onSaveAsEvidence,
  onSetHypothesisTarget,
  onOpenFullArch,
  onOpenBenchWithTc
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
              <p>정상 주행과 비교했을 때 어디서 처음 이상이 나타나는지 추적해보세요.</p>
            </div>
          </div>

          <div className="p2-guide-box">
            💡 각 기능의 입출력 신호를 정상 주행과 비교하여 차이가 처음 나타나는 지점을 찾고, 의심되는 신호와 기능을 선택해보세요.
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

        {/* 공통 기능 선택기 및 경로 체인 */}
        <div className="component-path-selector-bar">
          <div className="component-dropdown-wrap">
            <small>현재 조사 대상 기능:</small>
            <select
              className="component-select"
              value={selectedComponent}
              onChange={(e) => onSelectComponent(e.target.value)}
            >
              {model.relevantFunctionPath.map((id) => (
                <option key={id} value={id}>
                  {architectureNode(id).label} ({id})
                </option>
              ))}
            </select>
          </div>

          <div className="chain-breadcrumb">
            <small style={{ color: '#64748b', fontWeight: 600, marginRight: '4px' }}>관련 기능 경로:</small>
            {model.relevantFunctionPath.map((id, idx) => (
              <span key={id} style={{ display: 'inline-flex', alignItems: 'center', gap: '4px' }}>
                {idx > 0 && <span style={{ color: '#94a3b8', fontSize: '11px' }}>→</span>}
                <button
                  type="button"
                  className={`chain-node-btn ${selectedComponent === id ? 'selected' : ''}`}
                  onClick={() => onSelectComponent(id)}
                >
                  {architectureNode(id).label}
                </button>
              </span>
            ))}
          </div>

          {trackingView !== 'FLOW' && (
            <button
              type="button"
              className="timeline-btn"
              onClick={() => onSelectView('FLOW')}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              기능 흐름으로 이동 →
            </button>
          )}
        </div>
      </div>

      {/* VIEW CONTENT */}
      {trackingView === 'FLOW' && (
        <ViewAFlow
          model={model}
          selectedComponent={selectedComponent}
          onSelectComponent={onSelectComponent}
          onNavigateToSignals={() => onSelectView('SIGNALS')}
          onSetHypothesisTarget={onSetHypothesisTarget}
          onOpenFullArch={onOpenFullArch}
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
          onNavigateToStandards={() => onSelectView('STANDARDS')}
          onNavigateToInterfaces={() => onSelectView('INTERFACES')}
        />
      )}

      {trackingView === 'INTERFACES' && (
        <ViewCInterfaces
          model={model}
          selectedInterfaceId={selectedInterface}
          onSelectInterface={onSelectInterface}
          onNavigateToComponent={onSelectComponent}
        />
      )}

      {trackingView === 'STANDARDS' && (
        <ViewDStandards
          selectedComponent={selectedComponent}
          selectedRequirementId={selectedRequirement}
          onSelectRequirement={onSelectRequirement}
          onSaveAsEvidence={onSaveAsEvidence}
          onOpenBenchWithTc={onOpenBenchWithTc}
        />
      )}
    </div>
  )
}
