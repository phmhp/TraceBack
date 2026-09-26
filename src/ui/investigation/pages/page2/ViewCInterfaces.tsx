import { useMemo } from 'react'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'
import { architectureNode, getSignalDefinition, getSignalInterfaces } from '../../../../registries/investigation/Architecture'
import { getRequirementsForComponent } from '../../../../registries/investigation/Trace'

interface ViewCInterfacesProps {
  model: InvestigationPresentationModel
  selectedInterfaceId: string
  selectedComponentId: string
  onSelectInterface: (id: string) => void
  selectedSignalId: string
  onSelectSignal: (id: string) => void
  onNavigateToComponent: (id: string) => void
  onNavigateToSignal: (id: string) => void
  onNavigateToRequirement: (id: string) => void
}

const nodeLabel = (id: string) => architectureNode(id)?.label ?? id

export function ViewCInterfaces({
  model, selectedInterfaceId, selectedComponentId, onSelectInterface, selectedSignalId, onSelectSignal,
  onNavigateToComponent, onNavigateToSignal, onNavigateToRequirement,
}: ViewCInterfacesProps) {
  const edges = useMemo(() => model.getInterfaceEdges(), [model])
  const activeEdge = useMemo(() => (
    edges.find(edge => edge.id === selectedInterfaceId)
    ?? edges.find(edge => getSignalInterfaces(selectedSignalId).some(candidate => candidate.id === edge.id))
    ?? edges.find(edge => edge.from === selectedComponentId)
    ?? edges.find(edge => edge.to === selectedComponentId)
    ?? edges[0]
  ), [edges, selectedInterfaceId, selectedSignalId, selectedComponentId])

  if (!activeEdge) return null

  const activeSignalId = activeEdge.signals.includes(selectedSignalId) ? selectedSignalId : activeEdge.mainSignal
  const activeSignal = getSignalDefinition(activeSignalId)
  const propagationEdges = activeSignal ? getSignalInterfaces(activeSignal.id) : []
  const source = architectureNode(activeEdge.from)
  const target = architectureNode(activeEdge.to)
  const relatedRequirements = [activeEdge.from, activeEdge.to].flatMap(componentId => {
    const allocated = getRequirementsForComponent(componentId)
    return allocated.find(requirement => requirement.level === 'SOFTWARE') ?? allocated[0] ?? []
  }).filter((requirement, index, all) => all.findIndex(item => item.id === requirement.id) === index)

  return (
    <div className="interface-investigation">
      <section className="interface-primary-sheet" aria-labelledby="interface-flow-title">
        <header className="interface-sheet-heading">
          <div>
            <p className="investigation-section-label">FUNCTIONAL INTERFACE TRACE</p>
            <h3 id="interface-flow-title">{source.label}에서 {target.label}로 전달</h3>
          </div>
          <span className={`interface-discovery-state ${activeEdge.status === 'DIFFERENCE_FOUND' ? 'has-concern' : ''}`}>
            {activeEdge.status === 'DIFFERENCE_FOUND' ? '발견한 차이' : activeEdge.status === 'NO_DIFFERENCE' ? '비교 일치' : '조사 전'}
          </span>
        </header>

        <p className="interface-concept-note">
          <b>신호</b>는 전달되는 값이고, <b>인터페이스</b>는 그 값이 기능 사이를 오가는 연결 경계입니다.
        </p>

        <div className="interface-direction-diagram">
          <button type="button" className="interface-function-node sender" onClick={() => onNavigateToComponent(activeEdge.from)}>
            <small>SENDER · 생성</small><strong>{source.label}</strong><span>{source.area}</span>
          </button>
          <div className="interface-connector" aria-label={`${source.label}에서 ${target.label}로 전달`}>
            <span className="interface-arrow-line" aria-hidden="true" />
            <button type="button" className="selected-interface-edge" onClick={() => onSelectInterface(activeEdge.id)}>
              <small>INTERFACE · {activeEdge.id}</small><code>{activeSignalId}</code>
              {activeSignal?.description && <span>{activeSignal.description}</span>}
            </button>
            <span className="interface-arrow-head" aria-hidden="true">▶</span>
          </div>
          <button type="button" className="interface-function-node receiver" onClick={() => onNavigateToComponent(activeEdge.to)}>
            <small>RECEIVER · 소비</small><strong>{target.label}</strong><span>{target.area}</span>
          </button>
        </div>

        <div className="interface-carried-signals" aria-label="이 인터페이스가 전달하는 신호">
          <span>전달 신호 {activeEdge.signalCount}</span>
          <div>
            {activeEdge.signals.map(signalId => {
              const definition = getSignalDefinition(signalId)
              return <button type="button" key={signalId} aria-pressed={signalId === activeSignalId}
                onClick={() => onSelectSignal(signalId)} title={definition?.description}>
                <code>{signalId}</code>{definition?.description && <small>{definition.description}</small>}
              </button>
            })}
          </div>
        </div>
      </section>

      <div className="interface-secondary-grid">
        <section className="interface-propagation-sheet">
          <header><div><p className="investigation-section-label">SELECTED SIGNAL PROPAGATION</p>
            <h4><code>{activeSignalId}</code> 전달 경로</h4></div><small>등록된 canonical 관계만 표시</small></header>
          <div className="signal-propagation-path">
            {propagationEdges.length ? propagationEdges.map((edge, index) => <div className="propagation-segment" key={edge.id}>
              {index === 0 && <button type="button" onClick={() => onNavigateToComponent(edge.sourceId)}>{nodeLabel(edge.sourceId)}</button>}
              <button type="button" className={edge.id === activeEdge.id ? 'selected' : ''} onClick={() => onSelectInterface(edge.id)}>
                <span>→</span><code>{edge.id}</code><span>→</span>
              </button>
              <button type="button" onClick={() => onNavigateToComponent(edge.targetId)}>{nodeLabel(edge.targetId)}</button>
            </div>) : <p className="interface-empty-copy">이 신호에 등록된 기능 간 인터페이스가 없습니다.</p>}
          </div>
          <dl className="interface-facts">
            <div><dt>생성</dt><dd>{activeSignal?.producerIds.map(nodeLabel).join(', ') || '—'}</dd></div>
            <div><dt>소비</dt><dd>{activeSignal?.consumerIds.map(nodeLabel).join(', ') || '—'}</dd></div>
            <div><dt>방향</dt><dd>{source.label} → {target.label}</dd></div>
          </dl>
        </section>

        <aside className="interface-actions-sheet">
          <p className="investigation-section-label">NEXT INVESTIGATION STEP</p><h4>조사 방향 선택</h4>
          <p>차이의 위치를 단정하지 않습니다. 어느 쪽을 계속 확인할지 선택하세요.</p>
          <div className="interface-direction-actions">
            <button type="button" onClick={() => onNavigateToComponent(activeEdge.from)}>← 송신측 기능 보기 <small>{source.label}</small></button>
            <button type="button" onClick={() => onNavigateToComponent(activeEdge.to)}>수신측 기능 보기 → <small>{target.label}</small></button>
          </div>
          <button type="button" className="interface-signal-handoff" onClick={() => onNavigateToSignal(activeSignalId)}>
            <code>{activeSignalId}</code> 신호 비교에서 보기 →
          </button>
          <div className="interface-requirement-handoff">
            <span>이 연결 기능과 관련된 요구사항</span>
            {relatedRequirements.length ? relatedRequirements.map(requirement => <button type="button" key={requirement.id}
              onClick={() => onNavigateToRequirement(requirement.id)}><code>{requirement.id}</code> 보기 →</button>)
              : <small>현재 연결된 기능 할당 요구사항이 없습니다.</small>}
          </div>
        </aside>
      </div>
    </div>
  )
}
