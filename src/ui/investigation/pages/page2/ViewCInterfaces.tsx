import { useMemo } from 'react'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'
import { architectureNode, getIncomingInterfaces, getOutgoingInterfaces, getSignalDefinition, getSignalInterfaces } from '../../../../registries/investigation/Architecture'
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
  const selectedNode=architectureNode(selectedComponentId)
  const incoming=getIncomingInterfaces(selectedComponentId)
  const outgoing=getOutgoingInterfaces(selectedComponentId)
  const relatedRequirements = [activeEdge.from, activeEdge.to].flatMap(componentId => {
    const allocated = getRequirementsForComponent(componentId)
    return allocated.find(requirement => requirement.level === 'SOFTWARE') ?? allocated[0] ?? []
  }).filter((requirement, index, all) => all.findIndex(item => item.id === requirement.id) === index)

  return (
    <div className="interface-investigation">
      <section className="interface-primary-sheet" aria-labelledby="interface-flow-title">
        <header className="interface-sheet-heading">
          <div>
            <p className="investigation-section-label">인터페이스 · 전달 경계</p>
            <h3 id="interface-flow-title">현재 기능 · <code className="investigation-tech-id">{selectedNode?.label??selectedComponentId}</code></h3>
          </div>
          <span className={`interface-discovery-state ${activeEdge.status === 'DIFFERENCE_FOUND' ? 'has-concern' : ''}`}>
            {activeEdge.status === 'DIFFERENCE_FOUND' ? '발견한 차이' : activeEdge.status === 'NO_DIFFERENCE' ? '비교 일치' : '조사 전'}
          </span>
        </header>

        <p className="interface-concept-note"><b>신호</b>는 전달되는 값이고, <b>인터페이스</b>는 Source 기능의 출력과 Destination 기능의 입력을 잇는 연결 경계입니다.</p>

        <div className="function-port-diagram" aria-label={`${selectedNode?.label??selectedComponentId} 입력과 출력 포트`}>
          <div className="function-port-column incoming"><small>입력 신호</small>{incoming.length?incoming.flatMap(edge=>edge.signalIds.map(signalId=><button type="button" key={`${edge.id}:${signalId}`} className={edge.id===activeEdge.id&&signalId===activeSignalId?'selected':''} onClick={()=>{onSelectInterface(edge.id);onSelectSignal(signalId)}}><code>{signalId}</code><span>← {nodeLabel(edge.sourceId)}</span></button>)):<p>등록된 입력 경계 없음</p>}</div>
          <div className="function-boundary-block"><small>FUNCTION BOUNDARY</small><strong>{selectedNode?.label??selectedComponentId}</strong><code>{selectedComponentId}</code></div>
          <div className="function-port-column outgoing"><small>출력 신호</small>{outgoing.length?outgoing.flatMap(edge=>edge.signalIds.map(signalId=><button type="button" key={`${edge.id}:${signalId}`} className={edge.id===activeEdge.id&&signalId===activeSignalId?'selected':''} onClick={()=>{onSelectInterface(edge.id);onSelectSignal(signalId)}}><code>{signalId}</code><span>→ {nodeLabel(edge.targetId)}</span></button>)):<p>등록된 출력 경계 없음</p>}</div>
        </div>

        <div className="interface-direction-diagram">
          <button type="button" className="interface-function-node sender" onClick={() => onNavigateToComponent(activeEdge.from)}>
            <small>Source 기능 · 출력</small><strong>{source.label}</strong><span>{source.area}</span>
          </button>
          <div className="interface-connector" aria-label={`${source.label}에서 ${target.label}로 전달`}>
            <span className="interface-arrow-line" aria-hidden="true" />
            <button type="button" className="selected-interface-edge" onClick={() => onSelectInterface(activeEdge.id)}>
              <small>전달 경계 · {activeEdge.id}</small><code className="investigation-tech-id">{activeSignalId}</code>
              {activeSignal?.description && <span>{activeSignal.description}</span>}
            </button>
            <span className="interface-arrow-head" aria-hidden="true">▶</span>
          </div>
          <button type="button" className="interface-function-node receiver" onClick={() => onNavigateToComponent(activeEdge.to)}>
            <small>Destination 기능 · 입력</small><strong>{target.label}</strong><span>{target.area}</span>
          </button>
        </div>

        <div className="interface-carried-signals" aria-label="선택한 연결을 통해 전달되는 신호">
          <div className="interface-carried-heading"><strong>이 연결을 통해 전달되는 신호</strong><span>표시 기준 · 시스템 구조 정의의 <code>{activeEdge.id}</code> 연결에 포함된 신호만 표시합니다.</span></div>
          <div className="interface-carried-list">
            {activeEdge.signals.map(signalId => {
              const definition = getSignalDefinition(signalId)
              return <button type="button" key={signalId} aria-pressed={signalId === activeSignalId}
                onClick={() => onSelectSignal(signalId)} title={definition?.description}>
                <code>{signalId}</code><span>{definition?.description??'등록된 신호 설명 없음'}</span><small>{definition?.producerIds.map(nodeLabel).join(', ')||'—'} → {definition?.consumerIds.map(nodeLabel).join(', ')||'—'}</small>
              </button>
            })}
          </div>
        </div>
      </section>

      <div className="interface-secondary-grid">
        <section className="interface-propagation-sheet">
          <header><div><p className="investigation-section-label">선택 신호 경로</p>
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
            <div><dt>Source 기능</dt><dd>{activeSignal?.producerIds.map(nodeLabel).join(', ') || '—'}</dd></div>
            <div><dt>Destination 기능</dt><dd>{activeSignal?.consumerIds.map(nodeLabel).join(', ') || '—'}</dd></div>
            <div><dt>방향</dt><dd>{source.label} → {target.label}</dd></div>
          </dl>
        </section>

        <aside className="interface-actions-sheet">
          <p className="investigation-section-label">조사 노트</p><h4>전달 경계에서 값이 달라지는가?</h4>
          <p>Source 출력과 Destination 입력을 비교하면 전달 경계에서 값이 달라지는지 확인할 수 있습니다.</p>
          <div className="interface-direction-actions">
            <button type="button" onClick={() => onNavigateToComponent(activeEdge.from)}>← Source 기능 <small>{source.label}</small></button>
            <button type="button" onClick={() => onNavigateToComponent(activeEdge.to)}>Destination 기능 → <small>{target.label}</small></button>
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
