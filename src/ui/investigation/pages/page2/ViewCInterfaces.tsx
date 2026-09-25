import { useMemo } from 'react'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'
import { architectureNode, getSignalDefinition } from '../../../../registries/investigation/Architecture'

interface ViewCInterfacesProps {
  model: InvestigationPresentationModel
  selectedInterfaceId: string
  onSelectInterface: (id: string) => void
  selectedSignalId: string
  onSelectSignal: (id: string) => void
  onNavigateToComponent: (id: string) => void
}

function getSignalUnit(sigName: string): string {
  return getSignalDefinition(sigName)?.unit ?? '—'
}

export function ViewCInterfaces({
  model,
  selectedInterfaceId,
  onSelectInterface,
  selectedSignalId,
  onSelectSignal,
  onNavigateToComponent
}: ViewCInterfacesProps) {
  const edges = useMemo(() => model.getInterfaceEdges(), [model])
  const activeEdge = useMemo(
    () => edges.find((e) => e.id === selectedInterfaceId) ?? edges[0],
    [edges, selectedInterfaceId]
  )

  if (!activeEdge) return null
  const selectedSubSignal=activeEdge.signals.includes(selectedSignalId)?selectedSignalId:activeEdge.mainSignal

  const fromNode = architectureNode(activeEdge.from)
  const toNode = architectureNode(activeEdge.to)

  return (
    <div className="view-c-layout" style={{ gridTemplateColumns: 'minmax(280px, 340px) 1fr' }}>
      {/* 1열: 인터페이스 맵 & 전체 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        <section className="interface-map-panel">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>🕸️</span>
              <span>인터페이스 흐름</span>
            </h3>
          </div>
          <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>
            기능 사이의 연결을 클릭하여 전달되는 신호를 확인하세요.
          </p>

          <div className="vertical-flow-chain">
            {model.relevantFunctionPath.slice(0, 5).map((nodeId, idx, arr) => {
              const node = architectureNode(nodeId)
              const nextNodeId = arr[idx + 1]
              const edge = nextNodeId ? edges.find((e) => e.from === nodeId && e.to === nextNodeId) : null
              const isEdgeSelected = edge && edge.id === activeEdge.id

              return (
                <div key={nodeId} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                  <button
                    type="button"
                    className={`vertical-node-box ${nodeId === activeEdge.from || nodeId === activeEdge.to ? 'selected' : ''}`}
                    onClick={() => onNavigateToComponent(nodeId)}
                    style={{ width: '100%', cursor: 'pointer', textAlign: 'center' }}
                  >
                    {node.label}
                  </button>

                  {edge && (
                    <button
                      type="button"
                      className={`vertical-edge-arrow ${isEdgeSelected ? 'active-edge' : ''}`}
                      onClick={() => onSelectInterface(edge.id)}
                      style={{ margin: '4px 0', width: '100%', cursor: 'pointer', border: 'none', background: 'transparent' }}
                    >
                      <span className="edge-signal-tag">
                        {edge.mainSignal} ({edge.signalCount})
                      </span>
                      <span style={{ fontSize: '14px', color: isEdgeSelected ? '#ef4444' : '#64748b' }}>↓</span>
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        </section>

        {/* 인터페이스 목록 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>📋</span>
              <span>인터페이스 목록 ({edges.length})</span>
            </h3>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="signal-preview-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>경로</th>
                  <th>주요 신호</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {edges.map((e) => {
                  const isSelected = e.id === activeEdge.id
                  return (
                    <tr
                      key={e.id}
                      onClick={() => onSelectInterface(e.id)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : undefined,
                        borderLeft: isSelected ? '3px solid #3b82f6' : undefined
                      }}
                    >
                      <td>
                        <b>{architectureNode(e.from).label}</b> → <b>{architectureNode(e.to).label}</b>
                      </td>
                      <td><code>{e.mainSignal}</code></td>
                      <td>
                        {e.status === 'DIFFERENCE_FOUND' ? (
                          <span className="status-badge-pill badge-diff">차이 발견</span>
                        ) : e.status === 'NO_DIFFERENCE' ? (
                          <span className="status-badge-pill badge-nodiff">정상</span>
                        ) : (
                          <span className="status-badge-pill badge-uninspected">미조사</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      {/* 2열: 선택된 인터페이스 신호 목록 & 세부 정보 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        <section className="info-card">
          <div className="info-card-header">
            <div>
              <small style={{ color: '#64748b' }}>선택된 인터페이스</small>
              <h3 className="info-card-title" style={{ marginTop: '2px' }}>
                {fromNode.label} → {toNode.label}
              </h3>
            </div>
            {activeEdge.status === 'DIFFERENCE_FOUND' ? (
              <span className="status-badge-pill badge-diff">차이 발견</span>
            ) : (
              <span className="status-badge-pill badge-nodiff">정상</span>
            )}
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '6px', fontSize: '12px', margin: '8px 0 14px 0' }}>
            <span style={{ color: '#64748b' }}>송신 (Producer)</span>
            <b>{fromNode.label}</b>

            <span style={{ color: '#64748b' }}>수신 (Consumer)</span>
            <b>{toNode.label}</b>

            <span style={{ color: '#64748b' }}>포함 신호 수</span>
            <span>{activeEdge.signals.length}개 신호 전달</span>
          </div>

          <div className="info-card-header" style={{ borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
            <h4 style={{ fontSize: '12px', margin: 0, color: '#334155' }}>
              전달 신호 상세 목록
            </h4>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="signal-preview-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th>신호명</th>
                  <th>단위 / 형식</th>
                  <th>신호 역할</th>
                  <th>상태</th>
                </tr>
              </thead>
              <tbody>
                {activeEdge.signals.map((sig) => {
                  const isSelected = selectedSubSignal === sig
                  return (
                    <tr
                      key={sig}
                      onClick={() => onSelectSignal(sig)}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#f0f9ff' : undefined,
                        borderLeft: isSelected ? '3px solid #3b82f6' : undefined
                      }}
                    >
                      <td><code>{sig}</code></td>
                      <td>{getSignalUnit(sig)}</td>
                      <td>{sig === activeEdge.mainSignal ? '구동 제어 주 신호' : '상태 및 유효성 플래그'}</td>
                      <td>
                        {activeEdge.status === 'DIFFERENCE_FOUND' && sig === activeEdge.mainSignal ? (
                          <span className="status-badge-pill badge-diff">차이 관측</span>
                        ) : (
                          <span className="status-badge-pill badge-nodiff">정상</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>

          {/* 하단 바로가기 버튼 */}
          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <b style={{ fontSize: '12px', color: '#334155', display: 'block', marginBottom: '8px' }}>관련 기능 바로가기</b>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="timeline-btn"
                onClick={() => onNavigateToComponent(activeEdge.from)}
                style={{ fontSize: '11px', padding: '6px', justifyContent: 'center' }}
              >
                송신 기능 ({fromNode.label}) →
              </button>
              <button
                type="button"
                className="timeline-btn"
                onClick={() => onNavigateToComponent(activeEdge.to)}
                style={{ fontSize: '11px', padding: '6px', justifyContent: 'center' }}
              >
                수신 기능 ({toNode.label}) →
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
