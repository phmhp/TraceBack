import {
  architectureNode,
  getIncomingInterfaces,
  getInputSignals,
  getOutgoingInterfaces,
  getOutputSignals,
  normalFunctionFlows,
} from '../../../../registries/investigation/Architecture'
import { getRequirementsForComponent } from '../../../../registries/investigation/Trace'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'

interface ViewAFlowProps {
  model: InvestigationPresentationModel
  selectedComponent: string
  onSelectComponent: (id: string) => void
  onNavigateToSignal: (id: string) => void
  onNavigateToInterface: (id: string) => void
  onNavigateToRequirement: (id: string) => void
  onSetHypothesisTarget: (target: string, type: string) => void
}

const propulsionNodes = ['GearLogic', 'PropulsionFunction', 'VMC', 'eDrive'] as const

function ArchitectureNodeButton({
  id,
  selectedComponent,
  relevantPath,
  onSelect,
}: {
  id: string
  selectedComponent: string
  relevantPath: ReadonlySet<string>
  onSelect: (id: string) => void
}) {
  const node = architectureNode(id)
  const selected = selectedComponent === id
  return (
    <button
      type="button"
      className={`vehicle-architecture-node investigation-target ${selected ? 'selected' : ''} ${relevantPath.has(id) ? 'case-path-node' : ''}`}
      aria-pressed={selected}
      onClick={() => onSelect(id)}
    >
      <b>{node.label}</b>
      <code>{node.id}</code>
    </button>
  )
}

function ContextNode({
  id,
  label,
  kind,
  selectedComponent,
  relevantPath,
  onSelect,
}: {
  id: string
  label: string
  kind: 'observation' | 'actuation'
  selectedComponent: string
  relevantPath: ReadonlySet<string>
  onSelect: (id: string) => void
}) {
  return (
    <button
      type="button"
      className={`vehicle-architecture-node ${kind} ${selectedComponent === id ? 'selected' : ''} ${relevantPath.has(id) ? 'case-path-node' : ''}`}
      aria-pressed={selectedComponent === id}
      onClick={() => onSelect(id)}
    >
      <span>{kind === 'observation' ? 'OBSERVATION' : 'ACTUATION'}</span>
      <b>{label}</b>
    </button>
  )
}

export function ViewAFlow({
  model,
  selectedComponent,
  onSelectComponent,
  onNavigateToSignal,
  onNavigateToInterface,
  onNavigateToRequirement,
  onSetHypothesisTarget,
}: ViewAFlowProps) {
  const node = architectureNode(selectedComponent) ?? architectureNode('PropulsionFunction')
  const inputSignals = getInputSignals(node.id)
  const outputSignals = getOutputSignals(node.id)
  const incomingInterfaces = getIncomingInterfaces(node.id)
  const outgoingInterfaces = getOutgoingInterfaces(node.id)
  const requirements = getRequirementsForComponent(node.id)
  const processing = normalFunctionFlows[node.id] ?? [node.role]
  const relevantPath = new Set(model.relevantFunctionPath)
  const discoveredMismatch = model.getNodeStatus(node.id) === 'DIFFERENCE_FOUND'

  return (
    <div className="function-flow-workspace">
      <section className="vehicle-architecture-sheet" aria-labelledby="vehicle-architecture-title">
        <header className="diagram-heading">
          <div>
            <p className="investigation-section-label">LEVEL 1 · VEHICLE FUNCTIONAL ARCHITECTURE</p>
            <h3 id="vehicle-architecture-title">차량 기능 구조에서 어디를 먼저 조사할 것인가?</h3>
          </div>
          <div className="architecture-legend" aria-label="다이어그램 범례">
            <span><i className="legend-line case" />사건 우선 경로</span>
            <span><i className="legend-box selectable" />선택 가능</span>
            <span><i className="legend-box unavailable" />상세 미지원</span>
          </div>
        </header>

        <div className="vehicle-architecture-diagram">
          <div className="architecture-context-column">
            <ContextNode
              id="DriverInput"
              label="Driver / Environment"
              kind="observation"
              selectedComponent={selectedComponent}
              relevantPath={relevantPath}
              onSelect={onSelectComponent}
            />
            <div className="driver-demand-split" aria-hidden="true"><span /><span /><span /></div>
          </div>

          <div className="shared-context-node">
            <span>SHARED CONTEXT</span>
            <b>Vehicle State / Mode</b>
            <small>상태·모드는 각 기능 영역에 공통으로 작용합니다.</small>
            <div className="shared-context-fanout" aria-hidden="true"><i /><i /><i /></div>
          </div>

          <div className="functional-domains">
            <section className="vehicle-domain propulsion-domain">
              <header><span>VEHICLE DOMAIN</span><h4>Propulsion</h4></header>
              <div className="propulsion-function-chain">
                {propulsionNodes.map((id, index) => (
                  <div className="domain-chain-step" key={id}>
                    {index > 0 && <span className="diagram-arrow" aria-hidden="true">↓</span>}
                    <ArchitectureNodeButton
                      id={id}
                      selectedComponent={selectedComponent}
                      relevantPath={relevantPath}
                      onSelect={onSelectComponent}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="vehicle-domain unavailable-domain" aria-label="Braking 상세 미지원">
              <header><span>VEHICLE DOMAIN</span><h4>Braking</h4></header>
              <div className="unavailable-domain-body"><b>Brake control</b><span aria-hidden="true">× × ×</span><small>구조상 주요 영역 · 상세 미지원</small></div>
            </section>

            <section className="vehicle-domain unavailable-domain" aria-label="Steering 상세 미지원">
              <header><span>VEHICLE DOMAIN</span><h4>Steering</h4></header>
              <div className="unavailable-domain-body"><b>Steering control</b><span aria-hidden="true">× × ×</span><small>구조상 주요 영역 · 상세 미지원</small></div>
            </section>
          </div>

          <div className="domain-to-actuation" aria-hidden="true"><i /><i /><i /></div>

          <section className="actuation-band" aria-label="액추에이션 경계">
            <p>ACTUATION BOUNDARY</p>
            <div>
              <ContextNode id="DriveAdapter" label="Drive Force" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} />
              <ContextNode id="BrakeAdapter" label="Brake Force" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} />
              <ContextNode id="SteeringAdapter" label="Steering Angle" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} />
            </div>
          </section>

          <span className="diagram-arrow plant-arrow" aria-hidden="true">↓</span>
          <ContextNode
            id="VehiclePhysics"
            label="Vehicle Dynamics / Response"
            kind="observation"
            selectedComponent={selectedComponent}
            relevantPath={relevantPath}
            onSelect={onSelectComponent}
          />
        </div>
      </section>

      <section className="selected-function-sheet" aria-labelledby="selected-function-title">
        <header className="selected-function-header">
          <div>
            <p className="investigation-section-label">LEVEL 2 · SELECTED FUNCTION FLOW</p>
            <h3 id="selected-function-title">{node.label} <code>{node.id}</code></h3>
            <p className="selected-function-role investigation-prose">{node.role}</p>
          </div>
          <div className="selected-function-actions">
            {discoveredMismatch && <span className="discovered-mismatch">확인된 차이</span>}
            <button type="button" className="report-text-button" onClick={() => onSetHypothesisTarget(node.id, '계산 / 로직 오류')}>가설 대상으로 설정</button>
          </div>
        </header>

        <p className="function-investigation-question">입력과 출력 사이에서 어떤 신호를 비교해볼까요?</p>

        <div className="selected-function-flow">
          <section className="function-flow-stage signal-stage">
            <header><span>INPUT</span><b>입력 / 공유 상태</b></header>
            <div className="actionable-signal-list">
              {inputSignals.length ? inputSignals.map(signal => (
                <div className="function-signal-node" key={signal.id}>
                  <code>{signal.id}</code>
                  {signal.description&&<p>{signal.description}</p>}
                  <button type="button" onClick={() => onNavigateToSignal(signal.id)}>신호 비교에서 보기 →</button>
                </div>
              )) : <p>등록된 입력 신호 없음</p>}
            </div>
          </section>

          <span className="fan-in-arrow" aria-hidden="true">⟫</span>

          <section className="function-flow-stage processing-stage">
            <header><span>PROCESSING</span><b>처리 개요</b></header>
            <div className="processing-flow">{processing.map((step,index) => <div key={step}>
              {index>0&&<i aria-hidden="true">↓</i>}<span>{step}</span>
            </div>)}</div>
          </section>

          <span className="fan-in-arrow" aria-hidden="true">⟫</span>

          <section className="function-flow-stage signal-stage">
            <header><span>OUTPUT</span><b>출력 / 다음 경계</b></header>
            <div className="actionable-signal-list">
              {outputSignals.length ? outputSignals.map(signal => (
                <div className="function-signal-node" key={signal.id}>
                  <code>{signal.id}</code>
                  {signal.description&&<p>{signal.description}</p>}
                  <button type="button" onClick={() => onNavigateToSignal(signal.id)}>신호 비교에서 보기 →</button>
                </div>
              )) : <p>등록된 출력 신호 없음</p>}
            </div>
          </section>
        </div>

        <footer className="function-handoffs">
          <div>
            <p className="investigation-section-label">CONNECTED INTERFACES</p>
            <div className="handoff-links">
              {[...incomingInterfaces, ...outgoingInterfaces].map(edge => (
                <button type="button" key={edge.id} onClick={() => onNavigateToInterface(edge.id)}>
                  <code>{edge.sourceId} → {edge.targetId}</code>
                </button>
              ))}
              {!incomingInterfaces.length && !outgoingInterfaces.length && <span>연결된 인터페이스 없음</span>}
            </div>
          </div>
          <div>
            <p className="investigation-section-label">RELATED REQUIREMENTS</p>
            <div className="handoff-links">
              {requirements.map(requirement => (
                <button type="button" key={requirement.id} onClick={() => onNavigateToRequirement(requirement.id)}>
                  <code>{requirement.id}</code>
                </button>
              ))}
              {!requirements.length && <span>연결된 요구사항 없음</span>}
            </div>
          </div>
        </footer>
      </section>
    </div>
  )
}
