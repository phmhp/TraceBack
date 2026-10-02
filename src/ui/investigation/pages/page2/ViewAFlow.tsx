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
  onSetHypothesisTarget: (target: string) => void
}

const propulsionNodes = ['GearLogic', 'PropulsionFunction', 'VMC', 'eDrive'] as const

function ArchitectureNodeButton({
  id,
  selectedComponent,
  relevantPath,
  onSelect,
  status,
}: {
  id: string
  selectedComponent: string
  relevantPath: ReadonlySet<string>
  onSelect: (id: string) => void
  status: string
}) {
  const node = architectureNode(id)
  const selected = selectedComponent === id
  return (
    <button
      type="button"
      className={`vehicle-architecture-node investigation-target ${selected ? 'selected' : ''} ${relevantPath.has(id) ? 'case-path-node' : ''} status-${status.toLowerCase()}`}
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
  status,
}: {
  id: string
  label: string
  kind: 'observation' | 'actuation'
  selectedComponent: string
  relevantPath: ReadonlySet<string>
  onSelect: (id: string) => void
  status: string
}) {
  return (
    <button
      type="button"
      className={`vehicle-architecture-node ${kind} ${selectedComponent === id ? 'selected' : ''} ${relevantPath.has(id) ? 'case-path-node' : ''} status-${status.toLowerCase()}`}
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
  const node = selectedComponent?architectureNode(selectedComponent):undefined
  const inputSignals = node?getInputSignals(node.id):[]
  const stateSignals = inputSignals.filter(signal => signal.semanticRole === 'STATE_OR_PRECONDITION')
  const valueInputSignals = inputSignals.filter(signal => signal.semanticRole !== 'STATE_OR_PRECONDITION')
  const outputSignals = node?getOutputSignals(node.id):[]
  const incomingInterfaces = node?getIncomingInterfaces(node.id):[]
  const outgoingInterfaces = node?getOutgoingInterfaces(node.id):[]
  const requirements = node?getRequirementsForComponent(node.id):[]
  const processing = node?(normalFunctionFlows[node.id] ?? [node.role]):[]
  const relevantPath = new Set(model.relevantFunctionPath)
  const discoveredMismatch = node?model.getNodeStatus(node.id) === 'DIFFERENCE_FOUND':false

  return (
    <div className="function-flow-workspace">
      <section className="vehicle-architecture-sheet" aria-labelledby="vehicle-architecture-title">
        <header className="diagram-heading">
          <div>
            <p className="investigation-section-label">LEVEL 1 · VEHICLE FUNCTIONAL ARCHITECTURE</p>
            <h3 id="vehicle-architecture-title">이 반응과 연결된 기능은 어디인가요?</h3>
          </div>
          <div className="architecture-legend" aria-label="다이어그램 범례">
            <span><i className="legend-line case" />현재 차량 흐름</span>
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
              status={model.getNodeStatus('DriverInput')}
            />
            <div className="driver-demand-split" aria-hidden="true"><span /><span /><span /></div>
          </div>

          <div className="shared-context-node">
            <span>SHARED CONTEXT</span>
            <b>Vehicle State / Mode</b>
            <small>모든 기능의 공통 조건</small>
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
                      status={model.getNodeStatus(id)}
                    />
                  </div>
                ))}
              </div>
            </section>

            <section className="vehicle-domain unavailable-domain" aria-label="Braking 상세 미지원">
              <header><span>VEHICLE DOMAIN</span><h4>Braking</h4></header>
              <div className="unavailable-domain-body"><b>Brake control</b><span aria-hidden="true">× × ×</span><small>상세 미지원</small></div>
            </section>

            <section className="vehicle-domain unavailable-domain" aria-label="Steering 상세 미지원">
              <header><span>VEHICLE DOMAIN</span><h4>Steering</h4></header>
              <div className="unavailable-domain-body"><b>Steering control</b><span aria-hidden="true">× × ×</span><small>상세 미지원</small></div>
            </section>
          </div>

          <div className="domain-to-actuation" aria-hidden="true"><i /><i /><i /></div>

          <section className="actuation-band" aria-label="액추에이션 경계">
            <p>ACTUATION BOUNDARY</p>
            <div>
              <ContextNode id="DriveAdapter" label="Drive Force" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} status={model.getNodeStatus('DriveAdapter')} />
              <ContextNode id="BrakeAdapter" label="Brake Force" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} status={model.getNodeStatus('BrakeAdapter')} />
              <ContextNode id="SteeringAdapter" label="Steering Angle" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} status={model.getNodeStatus('SteeringAdapter')} />
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
            status={model.getNodeStatus('VehiclePhysics')}
          />
        </div>
      </section>

      {!node?<section className="selection-required function-selection-prompt"><p className="investigation-section-label">기능 선택</p><h3>위 구조에서 조사할 기능을 선택하세요.</h3><p>선택한 기능의 상태·입력·출력과 연결된 인터페이스, 요구사항을 여기에서 확인할 수 있습니다.</p></section>:<section className="selected-function-sheet" aria-labelledby="selected-function-title">
        <header className="selected-function-header">
          <div>
            <p className="investigation-section-label">LEVEL 2 · SELECTED FUNCTION FLOW</p>
            <h3 id="selected-function-title">{node.label} <code>{node.id}</code></h3>
            <details className="selected-function-description"><summary>기능 설명</summary><p className="selected-function-role investigation-prose">{node.role}</p></details>
          </div>
          <div className="selected-function-actions">
            {discoveredMismatch && <span className="discovered-mismatch">확인된 차이</span>}
            <button type="button" className="report-text-button" onClick={() => onSetHypothesisTarget(node.id)}>이 기능으로 가설 만들기</button>
          </div>
        </header>

        <div className="selected-function-flow">
          <section className="function-flow-stage signal-stage">
            <header><span>STATE + INPUT</span><b>전제조건 / 입력</b></header>
            <div className="actionable-signal-list">
              {[...stateSignals,...valueInputSignals].length ? [...stateSignals,...valueInputSignals].map(signal => (
                <div className="function-signal-node" key={signal.id}>
                  <code>{signal.id}</code>
                  {signal.description&&<details><summary>설명</summary><p>{signal.description}</p></details>}
                  <button type="button" onClick={() => onNavigateToSignal(signal.id)}>{signal.semanticRole==='STATE_OR_PRECONDITION'?'전제조건 시간 흐름 보기':'기능 입력 시간 흐름 보기'} →</button>
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
                  {signal.description&&<details><summary>설명</summary><p>{signal.description}</p></details>}
                  <button type="button" onClick={() => onNavigateToSignal(signal.id)}>신호 비교에서 보기 →</button>
                </div>
              )) : <p>등록된 출력 신호 없음</p>}
            </div>
          </section>
        </div>

        <details className="function-handoffs-details"><summary>연결 정보 자세히</summary><footer className="function-handoffs">
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
        </footer></details>
      </section>}
    </div>
  )
}
