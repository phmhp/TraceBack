import { useState, useMemo } from 'react'
import type { InvestigationPresentationModel, InterfaceEdgeModel } from '../../presentation/InvestigationPresentationModel'
import { architectureNode } from '../../../../registries/investigation/Architecture'

interface ViewCInterfacesProps {
  model: InvestigationPresentationModel
  selectedInterfaceId: string
  onSelectInterface: (id: string) => void
  onNavigateToComponent: (id: string) => void
}

const defaultFallbackEdge: InterfaceEdgeModel = {
  id: 'PropulsionFunction->VMC',
  from: 'PropulsionFunction',
  to: 'VMC',
  signals: ['PropulsionRequest', 'PropulsionState', 'PropulsionEnable'],
  mainSignal: 'PropulsionRequest',
  signalCount: 3,
  status: 'DIFFERENCE_FOUND',
  communicationInfo: {
    messageName: 'VMC_Command',
    protocol: 'CAN',
    cycleMs: 10,
    timeoutMs: 30,
    crc: 'PASS',
    aliveCounter: 'NORMAL'
  }
}

export function ViewCInterfaces({
  model,
  selectedInterfaceId,
  onSelectInterface,
  onNavigateToComponent
}: ViewCInterfacesProps) {
  const edges = useMemo(() => model.getInterfaceEdges(), [model])
  const activeEdge = useMemo(
    () => edges.find((e) => e.id === selectedInterfaceId) ?? edges[0] ?? defaultFallbackEdge,
    [edges, selectedInterfaceId]
  )

  const [selectedSubSignal, setSelectedSubSignal] = useState<string>(activeEdge?.mainSignal ?? 'PropulsionRequest')

  const fromNode = architectureNode(activeEdge.from)
  const toNode = architectureNode(activeEdge.to)

  return (
    <div className="view-c-layout">
      {/* 1열: 인터페이스 맵 */}
      <section className="interface-map-panel">
        <div className="info-card-header">
          <h3 className="info-card-title">
            <span>🕸️</span>
            <span>인터페이스 맵</span>
          </h3>
        </div>
        <p style={{ fontSize: '11px', color: '#64748b', margin: '0 0 10px 0' }}>
          기능 사이의 화살표(인터페이스)를 선택하면 상세 정보를 볼 수 있습니다.
        </p>

        <div className="vertical-flow-chain">
          {model.relevantFunctionPath.slice(0, 5).map((nodeId, idx, arr) => {
            const node = architectureNode(nodeId)
            const nextNodeId = arr[idx + 1]
            const edge = nextNodeId ? edges.find((e) => e.from === nodeId && e.to === nextNodeId) : null
            const isEdgeSelected = edge && edge.id === activeEdge.id

            return (
              <div key={nodeId} style={{ width: '100%', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
                <div
                  className={`vertical-node-box ${nodeId === activeEdge.from || nodeId === activeEdge.to ? 'selected' : ''}`}
                  onClick={() => onNavigateToComponent(nodeId)}
                >
                  {node.label}
                </div>

                {edge && (
                  <div
                    className={`vertical-edge-arrow ${isEdgeSelected ? 'active-edge' : ''}`}
                    onClick={() => onSelectInterface(edge.id)}
                    style={{ margin: '4px 0' }}
                  >
                    <span className="edge-signal-tag">
                      {edge.mainSignal} ({edge.signalCount})
                    </span>
                    <span style={{ fontSize: '14px', color: isEdgeSelected ? '#ef4444' : '#64748b' }}>↓</span>
                  </div>
                )}
              </div>
            )
          })}
        </div>
      </section>

      {/* 2열: 인터페이스 목록 & 신호 목록 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 인터페이스 목록 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>📋</span>
              <span>인터페이스 목록 ({edges.length})</span>
            </h3>
          </div>

          <table className="signal-preview-table">
            <thead>
              <tr>
                <th>No</th>
                <th>송신 (Producer)</th>
                <th>수신 (Consumer)</th>
                <th>주요 신호</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {edges.map((e, idx) => (
                <tr
                  key={e.id}
                  onClick={() => onSelectInterface(e.id)}
                  style={{
                    cursor: 'pointer',
                    background: e.id === activeEdge.id ? '#eff6ff' : undefined
                  }}
                >
                  <td>{idx + 1}</td>
                  <td><b>{architectureNode(e.from).label}</b></td>
                  <td><b>{architectureNode(e.to).label}</b></td>
                  <td><code>{e.mainSignal}</code> 외 {e.signalCount - 1}개</td>
                  <td>
                    {e.status === 'DIFFERENCE_FOUND' ? (
                      <span className="status-badge-pill badge-diff">차이 발견</span>
                    ) : e.status === 'NO_DIFFERENCE' ? (
                      <span className="status-badge-pill badge-nodiff">차이 없음</span>
                    ) : e.status === 'COMPARED' ? (
                      <span className="status-badge-pill badge-nodiff">비교 완료</span>
                    ) : (
                      <span className="status-badge-pill badge-uninspected">미조사</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 인터페이스 신호 목록 */}
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>📡</span>
              <span>인터페이스 신호 목록 ({activeEdge.signals.length})</span>
            </h3>
          </div>

          <table className="signal-preview-table">
            <thead>
              <tr>
                <th>신호명</th>
                <th>설명</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {activeEdge.signals.map((sig) => (
                <tr
                  key={sig}
                  onClick={() => setSelectedSubSignal(sig)}
                  style={{
                    cursor: 'pointer',
                    background: selectedSubSignal === sig ? '#f0f9ff' : undefined
                  }}
                >
                  <td><code>{sig}</code></td>
                  <td>{sig === activeEdge.mainSignal ? '구동 제어 주 신호' : '상태 및 유효성 플래그'}</td>
                  <td>
                    {activeEdge.status === 'DIFFERENCE_FOUND' && sig === activeEdge.mainSignal ? (
                      <span className="status-badge-pill badge-diff">차이 발견</span>
                    ) : (
                      <span className="status-badge-pill badge-nodiff">정상</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* 3열: 선택된 인터페이스 상세 & 통신 정보(조건부) */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
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

          <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '6px', fontSize: '12px', marginTop: '6px' }}>
            <span style={{ color: '#64748b' }}>신호명</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace' }}>{selectedSubSignal}</span>

            <span style={{ color: '#64748b' }}>송신 (Producer)</span>
            <span>{fromNode.label}</span>

            <span style={{ color: '#64748b' }}>수신 (Consumer)</span>
            <span>{toNode.label}</span>

            <span style={{ color: '#64748b' }}>단위</span>
            <span>ratio</span>

            <span style={{ color: '#64748b' }}>정상 범위</span>
            <span>0 ~ 1</span>

            <span style={{ color: '#64748b' }}>유효성</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>VALID</span>

            <span style={{ color: '#64748b' }}>업데이트 주기</span>
            <span>10 ms</span>

            <span style={{ color: '#64748b' }}>설명</span>
            <span style={{ color: '#475569' }}>운전자 구동 요구를 기반으로 생성된 구동 요청 비율 신호입니다.</span>
          </div>

          {/* 통신 정보 (CAN) - 조건부 렌더링 (communicationInfo 존재 시에만) */}
          {activeEdge.communicationInfo && (
            <div style={{ marginTop: '14px', borderTop: '1px solid #e2e8f0', paddingTop: '10px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '8px' }}>
                <span style={{ fontSize: '13px' }}>📡</span>
                <b style={{ fontSize: '12px', color: '#1e293b' }}>
                  통신 정보 ({activeEdge.communicationInfo.protocol})
                </b>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '110px 1fr', rowGap: '6px', fontSize: '12px' }}>
                <span style={{ color: '#64748b' }}>메시지명</span>
                <span style={{ fontFamily: 'monospace' }}>{activeEdge.communicationInfo.messageName}</span>

                <span style={{ color: '#64748b' }}>통신 방식</span>
                <span>{activeEdge.communicationInfo.protocol}</span>

                <span style={{ color: '#64748b' }}>주기 (Cycle)</span>
                <span>{activeEdge.communicationInfo.cycleMs} ms</span>

                <span style={{ color: '#64748b' }}>타임아웃</span>
                <span>{activeEdge.communicationInfo.timeoutMs} ms</span>

                <span style={{ color: '#64748b' }}>CRC</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{activeEdge.communicationInfo.crc}</span>

                <span style={{ color: '#64748b' }}>Alive Counter</span>
                <span style={{ color: '#16a34a', fontWeight: 600 }}>{activeEdge.communicationInfo.aliveCounter}</span>
              </div>
            </div>
          )}

          {/* 관련 기능으로 이동 */}
          <div style={{ marginTop: '16px', borderTop: '1px solid #e2e8f0', paddingTop: '12px' }}>
            <b style={{ fontSize: '12px', color: '#334155', display: 'block', marginBottom: '8px' }}>관련 기능으로 이동</b>
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
