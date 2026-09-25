import { architectureNode, normalFunctionFlows } from '../../../../registries/investigation/Architecture'
import type { InvestigationPresentationModel, InspectionStatus } from '../../presentation/InvestigationPresentationModel'

interface ViewAFlowProps {
  model: InvestigationPresentationModel
  selectedComponent: string
  onSelectComponent: (id: string) => void
  onNavigateToSignals: () => void
  onSetHypothesisTarget: (target: string, type: string) => void
  onOpenFullArch: () => void
}

function getStatusBadge(status: InspectionStatus) {
  switch (status) {
    case 'DIFFERENCE_FOUND':
      return <span className="status-badge-pill badge-diff">차이 발견</span>
    case 'NO_DIFFERENCE':
      return <span className="status-badge-pill badge-nodiff">차이 없음</span>
    case 'COMPARED':
      return <span className="status-badge-pill badge-nodiff">비교 완료</span>
    case 'INSPECTING':
      return <span className="status-badge-pill badge-inspecting">조사 중</span>
    case 'HYPOTHESIS_TARGET':
      return <span className="status-badge-pill" style={{ background: '#fef3c7', color: '#92400e' }}>가설 대상</span>
    default:
      return <span className="status-badge-pill badge-uninspected">미조사</span>
  }
}

export function ViewAFlow({
  model,
  selectedComponent,
  onSelectComponent,
  onNavigateToSignals,
  onSetHypothesisTarget,
  onOpenFullArch
}: ViewAFlowProps) {
  const node = architectureNode(selectedComponent)
  const flow = normalFunctionFlows[selectedComponent] ?? [node.role]
  const currentStatus = model.getNodeStatus(selectedComponent)

  // Sub/Super functions in chain
  const chain = model.relevantFunctionPath
  const currentIdx = chain.indexOf(selectedComponent)
  const parentId = currentIdx > 0 ? chain[currentIdx - 1] : undefined
  const childId = currentIdx < chain.length - 1 ? chain[currentIdx + 1] : undefined
  const parentFunc = parentId ? architectureNode(parentId).label : '—'
  const childFunc = childId ? architectureNode(childId).label : '—'

  return (
    <div className="view-a-layout">
      {/* LEFT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 차량 기능 흐름 (관련 기능 경로) */}
        <section className="flow-diagram-card">
          <div className="info-card-header">
            <div>
              <h3 className="info-card-title">
                <span>🔄</span>
                <span>차량 기능 흐름 (관련 기능 경로)</span>
              </h3>
              <small style={{ color: '#64748b' }}>이 사건과 관련된 기능 경로와 각 기능의 조사 상태를 확인할 수 있습니다.</small>
            </div>
            <button
              type="button"
              className="timeline-btn"
              onClick={onOpenFullArch}
              style={{ fontSize: '11px', padding: '4px 8px' }}
            >
              전체 구조 보기 ›
            </button>
          </div>

          {/* 범례 */}
          <div className="flow-legend-bar">
            <span className="legend-pill"><span className="legend-dot" style={{ background: '#cbd5e1' }} /> 미조사</span>
            <span className="legend-pill"><span className="legend-dot" style={{ background: '#3b82f6' }} /> 조사 중</span>
            <span className="legend-pill"><span className="legend-dot" style={{ background: '#10b981' }} /> 비교 완료</span>
            <span className="legend-pill"><span className="legend-dot" style={{ background: '#059669' }} /> 차이 없음</span>
            <span className="legend-pill"><span className="legend-dot" style={{ background: '#ef4444' }} /> 차이 발견</span>
            <span className="legend-pill"><span className="legend-dot" style={{ background: '#eab308' }} /> 가설 대상</span>
          </div>

          {/* 노드 체인 캔버스 */}
          <div className="flow-canvas-box">
            {chain.map((id, index) => {
              const item = architectureNode(id)
              const status = model.getNodeStatus(id)
              const isSelected = id === selectedComponent

              return (
                <div key={id} style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {index > 0 && <span className="flow-chain-arrow">→</span>}
                  <button
                    type="button"
                    className={`flow-step-node ${isSelected ? 'active-node' : ''}`}
                    onClick={() => onSelectComponent(id)}
                  >
                    <b style={{ fontSize: '12px', color: '#1e293b' }}>{item.label}</b>
                    {getStatusBadge(status)}
                  </button>
                </div>
              )
            })}
          </div>
        </section>

        {/* 선택 기능 요약 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>📋</span>
              <span>선택 기능 요약</span>
            </h3>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1.2fr 1fr 1fr 2fr', gap: '12px', fontSize: '12px' }}>
            <div>
              <small style={{ color: '#64748b', fontWeight: 600 }}>기능명</small>
              <div style={{ fontWeight: 700, marginTop: '2px' }}>{node.label}</div>
              <small style={{ color: '#94a3b8' }}>{node.id}</small>
            </div>
            <div>
              <small style={{ color: '#64748b', fontWeight: 600 }}>상위 기능</small>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{parentFunc}</div>
            </div>
            <div>
              <small style={{ color: '#64748b', fontWeight: 600 }}>하위 기능</small>
              <div style={{ fontWeight: 600, marginTop: '2px' }}>{childFunc}</div>
            </div>
            <div>
              <small style={{ color: '#64748b', fontWeight: 600 }}>주요 역할</small>
              <div style={{ color: '#334155', marginTop: '2px' }}>{node.role}</div>
            </div>
          </div>
        </section>
      </div>

      {/* RIGHT COLUMN */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 선택 기능 상세 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>🔍</span>
              <span>선택 기능 상세</span>
            </h3>
            {getStatusBadge(currentStatus)}
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
            <span style={{ fontSize: '20px' }}>⚙️</span>
            <div>
              <b style={{ fontSize: '15px' }}>{node.label}</b>
              <small style={{ marginLeft: '6px', color: '#64748b' }}>({node.id})</small>
            </div>
          </div>

          <p style={{ fontSize: '12px', color: '#475569', lineHeight: 1.5, margin: '0 0 14px 0' }}>
            {node.role}
          </p>

          {/* 입/출력 신호 리스트 그리드 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <b style={{ fontSize: '12px', color: '#334155' }}>입력 신호 ({node.inputs.length}개)</b>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {node.inputs.map((sig) => (
                  <div key={sig} style={{ background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'monospace' }}>
                    {sig}
                  </div>
                ))}
              </div>
            </div>

            <div style={{ background: '#f8fafc', padding: '10px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <b style={{ fontSize: '12px', color: '#334155' }}>출력 신호 ({node.outputs.length}개)</b>
              </div>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {node.outputs.map((sig) => (
                  <div key={sig} style={{ background: '#ffffff', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', fontSize: '11px', fontFamily: 'monospace' }}>
                    {sig}
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* 내부 기능 흐름 (개요) */}
          <div style={{ marginTop: '14px' }}>
            <b style={{ fontSize: '12px', color: '#334155' }}>내부 기능 흐름 (개요)</b>
            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', overflowX: 'auto', marginTop: '6px', padding: '6px 0' }}>
              {flow.map((step, idx) => (
                <div key={step} style={{ display: 'flex', alignItems: 'center', gap: '6px', flexShrink: 0 }}>
                  {idx > 0 && <span style={{ color: '#94a3b8', fontSize: '12px' }}>→</span>}
                  <div style={{ background: '#f1f5f9', border: '1px solid #cbd5e1', borderRadius: '6px', padding: '6px 10px', fontSize: '11px', fontWeight: 600, color: '#334155' }}>
                    {step}
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* 액션 버튼 그룹 */}
          <div style={{ display: 'flex', gap: '8px', marginTop: '16px' }}>
            <button
              type="button"
              className="p1-cta-btn"
              onClick={onNavigateToSignals}
              style={{ flex: 1, padding: '8px 12px', fontSize: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}
            >
              <span>📊</span>
              <span>신호 비교로 이동 →</span>
            </button>

            <button
              type="button"
              className="timeline-btn"
              onClick={() => onSetHypothesisTarget(node.id, '계산 / 로직 오류')}
              style={{ padding: '8px 12px', fontSize: '12px' }}
            >
              💡 가설로 설정
            </button>
          </div>
        </section>
      </div>
    </div>
  )
}
