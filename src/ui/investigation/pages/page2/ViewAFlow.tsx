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
import {
  getReferenceEntity,
  getReferenceFocus,
  getReferenceFunctionsForArea,
  getReferenceStatus,
} from '../../referenceVehicle/ReferenceVehicleUIAdapter.ts'
import { TechnicalTerm } from '../../presentation/InvestigationTerminology.tsx'

interface ViewAFlowProps {
  model: InvestigationPresentationModel
  selectedComponent: string
  onSelectComponent: (id: string) => void
  onNavigateToSignal: (id: string) => void
  onNavigateToInterface: (id: string) => void
  onNavigateToRequirement: (id: string) => void
  onSetHypothesisTarget: (target: string) => void
}

const vehicleContextGroups = [
  { label: '입력·상태', areas: ['INPUT_ENV', 'SENSING', 'VEHICLE_STATE'] },
  { label: '주행 기능', areas: ['GEAR', 'PROPULSION', 'BRAKING', 'STEERING', 'ADAS', 'STABILITY'] },
  { label: '운동 조정', areas: ['MOTION_COORDINATION'] },
  { label: '실행·차량', areas: ['EXECUTION', 'ACTUATION_PLANT'] },
  { label: '지원 기능', areas: ['ENERGY', 'FAULT', 'COMMUNICATION', 'OCCUPANT'] },
] as const

function ReferenceVehicleContext({ selectedComponent, onSelectComponent }: { selectedComponent:string; onSelectComponent:(id:string)=>void }) {
  const selectedEntity=getReferenceEntity(selectedComponent)
  const selectedAreaId=selectedEntity?.entityKind==='LOGICAL_FUNCTION'?String(selectedEntity.metadata.areaId??''):''
  return <section className="reference-context-map" aria-label="Reference Vehicle 전체 구조 속 현재 조사 경로">
    <header><div><p className="investigation-section-label">WHOLE VEHICLE CONTEXT</p><h4>전체 차량에서 선택한 기능의 위치</h4></div></header>
    <div className="reference-context-flow">
      {vehicleContextGroups.map((group,index)=><div className="reference-context-layer" key={group.label}>
        <small>{group.label}</small>
        <div>{group.areas.map(areaId=>{const area=getReferenceEntity(areaId);if(!area)return null;const functions=getReferenceFunctionsForArea(areaId);const first=functions[0];const focus=getReferenceFocus(area);const selected=selectedAreaId===areaId;return <button type="button" key={areaId} className={`${selected?'selected ':''}focus-${focus.toLowerCase()}`} aria-pressed={selected} disabled={!first} onClick={()=>first&&onSelectComponent(first.id)}><strong>{area.name||area.id}</strong><span>{functions.length}개 기능</span></button>})}</div>
        {index<vehicleContextGroups.length-1&&<i aria-hidden="true">→</i>}
      </div>)}
    </div>
    <div className="reference-context-legend"><span><i className="primary"/>현재 사건 경로</span><span><i className="context"/>같은 기능 영역</span><span><i className="background"/>전체 차량 맥락</span><small>영역을 선택하면 Function Inspector에서 내부 기능과 연결 관계를 확인합니다.</small></div>
  </section>
}

const familiarFunctionNames:Record<string,string>={
  'LF-GEAR-INTERLOCK':'Gear',
  'LF-PROP-ACQ':'PropulsionFunction',
  'LF-PROP-GEN':'VMC',
  'LF-PROP-EDRV':'eDrive',
}
const functionKindLabels:Record<string,string>={REQUEST_PROCESSOR:'입력·요청 처리',CONTROLLER:'제어·계산',COORDINATOR:'기능 조정',MONITOR:'상태 감시',STATE_MANAGER:'상태·복구 관리'}

function ReferenceDomainFlow({areaId,label,technicalLabel,selectedComponent,onSelectComponent}:{areaId:'GEAR'|'PROPULSION'|'BRAKING'|'STEERING';label:string;technicalLabel:string;selectedComponent:string;onSelectComponent:(id:string)=>void}){
  const functions=getReferenceFunctionsForArea(areaId)
  const groups=[...new Set(functions.map(item=>String(item.metadata.functionKind??'OTHER')))]
  return <section className="vehicle-domain reference-domain" aria-label={`${label} Reference Vehicle 기능 흐름`}>
    <header><span>차량 기능 영역</span><h4>{label}<code>{technicalLabel}</code></h4><small>{functions.length}개 기능</small></header>
    <div className="reference-domain-chain">
      {groups.map(kind=><section className="reference-function-group" key={kind}><h5>{functionKindLabels[kind]??'기타 기능'}</h5>{functions.filter(item=>String(item.metadata.functionKind??'OTHER')===kind).map(item=>{const status=getReferenceStatus(item),familiar=familiarFunctionNames[item.id];return <div key={item.id} className="reference-domain-step">
        <button type="button" aria-pressed={selectedComponent===item.id} onClick={()=>onSelectComponent(item.id)} title={`${item.id} · ${item.description}`}>
          <strong>{familiar?<TechnicalTerm id={familiar} fallback={item.name} compact/>:<><b>{item.name}</b><code>{item.id}</code></>} </strong><small>{status.capability==='CURRENT'?'현재 지원':status.capability==='PARTIAL'?'부분 지원':'Reference 설계'}</small>
        </button>
      </div>})}</section>)}
    </div>
  </section>
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
      title={architectureNode(id)?.role??`${label}의 차량 기능 역할`}
    >
      <span>{kind === 'observation' ? '관찰' : '실행 경계'}</span>
      <TechnicalTerm id={id} fallback={label} compact/>
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
            <h3 id="vehicle-architecture-title">차량 기능 아키텍처</h3>
            <p>Reference Vehicle의 주행 기능을 동일한 형식으로 비교합니다. 이 도식은 TRACKBACK 논리 교육 아키텍처이며 GV70 실제 ECU·CAN 내부 구조가 아닙니다. 현재 실행 범위와 설계 범위는 각 기능의 상태로 구분합니다.</p>
          </div>
          <div className="architecture-legend" aria-label="다이어그램 범례">
            <span><i className="legend-line case" />현재/부분 실행</span>
            <span><i className="legend-box selectable" />선택 가능</span>
            <span><i className="legend-box unavailable" />Reference 설계</span>
          </div>
        </header>

        <div className="vehicle-architecture-diagram">
          <div className="architecture-context-column">
            <ContextNode
              id="DriverInput"
              label="운전자·환경 입력"
              kind="observation"
              selectedComponent={selectedComponent}
              relevantPath={relevantPath}
              onSelect={onSelectComponent}
              status={model.getNodeStatus('DriverInput')}
            />
            <div className="driver-demand-split" aria-hidden="true"><span /><span /><span /></div>
          </div>

          <div className="shared-context-node">
            <span>공통 주행 조건</span>
            <b>차량 상태·운행 모드</b>
            <code>Vehicle State / Mode</code>
            <small>모든 기능의 공통 조건</small>
            <div className="shared-context-fanout" aria-hidden="true"><i /><i /><i /></div>
          </div>

          <div className="functional-domains">
            <ReferenceDomainFlow areaId="GEAR" label="변속" technicalLabel="Gear" selectedComponent={selectedComponent} onSelectComponent={onSelectComponent}/>
            <ReferenceDomainFlow areaId="PROPULSION" label="추진" technicalLabel="Propulsion" selectedComponent={selectedComponent} onSelectComponent={onSelectComponent}/>
            <ReferenceDomainFlow areaId="BRAKING" label="제동" technicalLabel="Braking" selectedComponent={selectedComponent} onSelectComponent={onSelectComponent}/>
            <ReferenceDomainFlow areaId="STEERING" label="조향" technicalLabel="Steering" selectedComponent={selectedComponent} onSelectComponent={onSelectComponent}/>
          </div>

          <div className="domain-to-actuation" aria-hidden="true"><i /><i /><i /></div>

          <section className="actuation-band" aria-label="액추에이션 경계">
            <p>차량 물리로 전달되는 실행 경계 · ACTUATION</p>
            <div>
              <ContextNode id="DriveAdapter" label="구동력 변환" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} status={model.getNodeStatus('DriveAdapter')} />
              <ContextNode id="BrakeAdapter" label="제동력 변환" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} status={model.getNodeStatus('BrakeAdapter')} />
              <ContextNode id="SteeringAdapter" label="조향각 변환" kind="actuation" selectedComponent={selectedComponent} relevantPath={relevantPath} onSelect={onSelectComponent} status={model.getNodeStatus('SteeringAdapter')} />
            </div>
          </section>

          <span className="diagram-arrow plant-arrow" aria-hidden="true">↓</span>
          <ContextNode
            id="VehiclePhysics"
            label="실제 차량 반응"
            kind="observation"
            selectedComponent={selectedComponent}
            relevantPath={relevantPath}
            onSelect={onSelectComponent}
            status={model.getNodeStatus('VehiclePhysics')}
          />
        </div>
        <ReferenceVehicleContext selectedComponent={selectedComponent} onSelectComponent={onSelectComponent}/>
      </section>

      {!node?<section className="selection-required function-selection-prompt"><p className="investigation-section-label">기능 선택</p><h3>위 구조에서 조사할 기능을 선택하세요.</h3><p>선택한 기능의 상태·입력·출력과 연결된 인터페이스, 요구사항을 여기에서 확인할 수 있습니다.</p></section>:<section className="selected-function-sheet" aria-labelledby="selected-function-title">
        <header className="selected-function-header">
          <div>
            <p className="investigation-section-label">LEVEL 2 · SELECTED FUNCTION FLOW</p>
            <h3 id="selected-function-title"><TechnicalTerm id={node.id} fallback={node.label}/></h3>
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
                  <TechnicalTerm id={signal.id} fallback={signal.description} compact/>
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
                  <TechnicalTerm id={signal.id} fallback={signal.description} compact/>
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
