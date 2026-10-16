import { useEffect, useMemo, useState } from 'react'
import { architectureNode, getIncomingInterfaces, getInputSignals, getOutgoingInterfaces, getOutputSignals, normalFunctionFlows } from '../../../../registries/investigation/Architecture'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'
import {
  getReferenceEntity,
  getReferenceFocus,
  getReferenceFunctionContextForComponent,
  getReferenceFunctionsForArea,
  getReferenceStatus,
  getRuntimeComponentForReferenceFunction,
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

const familiarFunctionNames:Record<string,string>={
  'LF-GEAR-INTERLOCK':'Gear',
  'LF-PROP-ACQ':'PropulsionFunction',
  'LF-PROP-GEN':'VMC',
  'LF-PROP-EDRV':'eDrive',
}
const functionKindLabels:Record<string,string>={REQUEST_PROCESSOR:'입력·요청',CONTROLLER:'판단·계산',COORDINATOR:'기능 조정',MONITOR:'상태 감시',STATE_MANAGER:'상태·복구'}
const areaEasyNames:Record<string,string>={INPUT_ENV:'운전자·환경 입력',SENSING:'차량 감지',VEHICLE_STATE:'차량 상태',GEAR:'기어',PROPULSION:'구동',BRAKING:'제동',STEERING:'조향',ADAS:'주행 보조',STABILITY:'자세 안정화',MOTION_COORDINATION:'차량 움직임 조정',EXECUTION:'명령 실행',ACTUATION_PLANT:'실제 차량 반응',ENERGY:'에너지',FAULT:'고장 관리',COMMUNICATION:'신호 통신',OCCUPANT:'탑승자 보호'}
const runtimeArea:Record<string,string>={DriverInput:'INPUT_ENV',GearLogic:'GEAR',PropulsionFunction:'PROPULSION',VMC:'PROPULSION',eDrive:'PROPULSION',DriveAdapter:'EXECUTION',BrakeAdapter:'EXECUTION',SteeringAdapter:'EXECUTION',VehiclePhysics:'ACTUATION_PLANT'}

function areaForComponent(id:string){
  const entity=getReferenceEntity(id)
  if(entity?.entityKind==='LOGICAL_FUNCTION')return String(entity.metadata.areaId??'')
  return runtimeArea[id]??''
}

function FullVehicleReference({selectedAreaId,onSelectArea}:{selectedAreaId:string;onSelectArea:(id:string)=>void}){
  return <details className="reference-context-map technical-detail-drawer" aria-label="Reference Vehicle 전체 구조 속 현재 조사 경로">
    <summary>전체 Reference Vehicle 지도 보기</summary>
    <div className="reference-context-flow">
      {vehicleContextGroups.map((group,index)=><div className="reference-context-layer" key={group.label}>
        <small>{group.label}</small>
        <div>{group.areas.map(areaId=>{const area=getReferenceEntity(areaId);const functions=getReferenceFunctionsForArea(areaId);return area?<button type="button" key={areaId} className={selectedAreaId===areaId?'selected':''} aria-pressed={selectedAreaId===areaId} onClick={()=>onSelectArea(areaId)}><strong>{areaEasyNames[areaId]??area.name??area.id}</strong><code>{areaId}</code><span>{functions.length}개 기능</span></button>:null})}</div>
        {index<vehicleContextGroups.length-1&&<i aria-hidden="true">→</i>}
      </div>)}
    </div>
    <div className="reference-context-legend"><span><i className="primary"/>현재 사건 경로</span><span><i className="context"/>같은 기능 영역</span><span><i className="background"/>전체 차량 맥락</span></div>
  </details>
}

export function ViewAFlow({model,selectedComponent,onSelectComponent,onNavigateToSignal,onNavigateToInterface,onNavigateToRequirement,onSetHypothesisTarget}:ViewAFlowProps){
  const [selectedAreaId,setSelectedAreaId]=useState(()=>areaForComponent(selectedComponent))
  const componentAreaId=areaForComponent(selectedComponent)
  useEffect(()=>{if(componentAreaId)setSelectedAreaId(componentAreaId)},[componentAreaId])

  const selectedArea=getReferenceEntity(selectedAreaId)
  const areaFunctions=useMemo(()=>selectedAreaId?getReferenceFunctionsForArea(selectedAreaId):[],[selectedAreaId])
  const functionGroups=useMemo(()=>[...new Set(areaFunctions.map(item=>String(item.metadata.functionKind??'OTHER')))],[areaFunctions])
  const reference=getReferenceFunctionContextForComponent(selectedComponent)
  const runtimeId=getRuntimeComponentForReferenceFunction(selectedComponent)??selectedComponent
  const node=architectureNode(runtimeId)
  const runtimeInputs=node?getInputSignals(node.id):[]
  const runtimeOutputs=node?getOutputSignals(node.id):[]
  const incoming=node?getIncomingInterfaces(node.id):[]
  const outgoing=node?getOutgoingInterfaces(node.id):[]
  const inputItems=node?runtimeInputs.map(signal=>({id:signal.id,label:signal.description??signal.id,kind:signal.semanticRole==='STATE_OR_PRECONDITION'?'상태':'입력'})):reference?.inputs.map(signal=>({id:signal.id,label:signal.description||signal.name||signal.id,kind:'입력'}))??[]
  const outputItems=node?runtimeOutputs.map(signal=>({id:signal.id,label:signal.description??signal.id})):reference?.outputs.map(signal=>({id:signal.id,label:signal.description||signal.name||signal.id}))??[]
  const processing=node?(normalFunctionFlows[node.id]??[node.role]):reference?[reference.entity.description||reference.entity.name||reference.entity.id]:[]
  const selectedName=node?.label??reference?.entity.name??selectedComponent
  const selectedRole=node?.role??reference?.entity.description
  const relevantPath=new Set(model.relevantFunctionPath)
  const discoveredMismatch=node?model.getNodeStatus(node.id) === 'DIFFERENCE_FOUND':false

  const chooseArea=(areaId:string)=>{setSelectedAreaId(areaId);if(areaForComponent(selectedComponent)!==areaId)onSelectComponent('')}

  return <div className="function-flow-workspace architecture-drilldown">
    <nav className="architecture-breadcrumb" aria-label="아키텍처 확대 단계">
      <button type="button" className={!selectedAreaId?'current':''} onClick={()=>{setSelectedAreaId('');onSelectComponent('')}}>전체 차량</button><i aria-hidden="true">›</i>
      <button type="button" disabled={!selectedAreaId} className={selectedAreaId&&!selectedComponent?'current':''} onClick={()=>onSelectComponent('')}>{selectedAreaId?(areaEasyNames[selectedAreaId]??selectedArea?.name??selectedAreaId):'도메인'}</button><i aria-hidden="true">›</i>
      <span className={selectedComponent?'current':''}>{selectedComponent?selectedName:'기능'}</span>
    </nav>

    {!selectedAreaId&&<section className="vehicle-architecture-sheet architecture-level architecture-domain-level" aria-labelledby="vehicle-architecture-title">
      <header className="diagram-heading simple-heading"><div><p className="investigation-section-label">1단계 · 전체 차량</p><h3 id="vehicle-architecture-title">어느 기능 영역을 볼까요?</h3><p>사건과 관련 있어 보이는 영역을 선택하세요. 전체 기능 이름은 다음 단계에서 보여줍니다.</p></div><span className="architecture-level-badge">도메인</span></header>
      <div className="vehicle-architecture-diagram architecture-domain-grid functional-domains">
        {vehicleContextGroups.flatMap(group=>group.areas.map(areaId=>{const area=getReferenceEntity(areaId);if(!area)return null;const functions=getReferenceFunctionsForArea(areaId);const focus=getReferenceFocus(area);return <button type="button" key={areaId} className={`architecture-domain-card focus-${focus.toLowerCase()} ${selectedAreaId===areaId?'selected':''}`} aria-pressed={selectedAreaId===areaId} onClick={()=>chooseArea(areaId)}><small>{group.label}</small><strong>{areaEasyNames[areaId]??area.name??areaId}</strong><code>{areaId}</code><span>{functions.length}개 기능</span><em>{focus==='PRIMARY_FOCUS'?'현재 사건과 가까움':'선택해서 기능 보기'}</em></button>}))}
      </div>
      <FullVehicleReference selectedAreaId={selectedAreaId} onSelectArea={chooseArea}/>
    </section>}

    {selectedAreaId&&!selectedComponent&&<section className="vehicle-architecture-sheet architecture-level architecture-function-level" aria-label={`${selectedArea?.name??selectedAreaId} 기능 수준 아키텍처`}>
      <header className="diagram-heading simple-heading"><div><p className="investigation-section-label">2단계 · 도메인 안 기능</p><h3>{areaEasyNames[selectedAreaId]??selectedArea?.name??selectedAreaId} <code>{selectedAreaId}</code></h3><p>이 영역 안에서 값이 들어오고 나가는 기능을 골라보세요.</p></div><span className="architecture-level-badge">기능</span></header>
      <div className="domain-function-architecture">
        {functionGroups.map((kind,index)=><section className="reference-function-group" key={kind}><h4><span>{index+1}</span>{functionKindLabels[kind]??'기타 기능'}</h4><div>{areaFunctions.filter(item=>String(item.metadata.functionKind??'OTHER')===kind).map(item=>{const status=getReferenceStatus(item);const familiar=familiarFunctionNames[item.id];const casePath=getReferenceFocus(item)==='PRIMARY_FOCUS'||relevantPath.has(familiar??item.id);return <button type="button" key={item.id} className={`${casePath?'case-path-node ':''}${selectedComponent===item.id?'selected':''}`} aria-pressed={selectedComponent===item.id} onClick={()=>onSelectComponent(item.id)}><TechnicalTerm id={familiar??item.id} fallback={item.name} compact/><small>{status.capability==='CURRENT'?'실행 가능':status.capability==='PARTIAL'?'부분 관찰':'설계 정보'}</small></button>})}</div></section>)}
      </div>
    </section>}

    {selectedComponent&&(node||reference)&&<section className="selected-function-sheet architecture-level architecture-logic-level" aria-labelledby="selected-function-title">
      <header className="selected-function-header"><div><p className="investigation-section-label">3단계 · 기능 안 로직</p><h3 id="selected-function-title"><TechnicalTerm id={node?.id??reference?.entity.id??selectedComponent} fallback={selectedName}/></h3><p className="selected-function-role">{selectedRole}</p></div><div className="selected-function-actions">{discoveredMismatch&&<span className="discovered-mismatch">확인된 차이</span>}<button type="button" className="report-text-button" onClick={()=>onSetHypothesisTarget(selectedComponent)}>이 기능으로 가설 만들기</button></div></header>
      <div className="selected-function-flow logic-architecture-flow">
        <section className="function-flow-stage signal-stage"><header><span>STATE + INPUT</span><b>들어오는 값</b></header><div className="actionable-signal-list">{inputItems.length?inputItems.map(item=><button type="button" className="function-signal-node" key={item.id} onClick={()=>onNavigateToSignal(item.id)}><small>{item.kind}</small><TechnicalTerm id={item.id} fallback={item.label} compact/></button>):<p>등록된 입력 없음</p>}</div></section>
        <span className="fan-in-arrow" aria-hidden="true">→</span>
        <section className="function-flow-stage processing-stage"><header><span>PROCESS</span><b>기능이 하는 일</b></header><div className="processing-flow">{processing.map((step,index)=><div key={`${index}:${step}`}><span>{step}</span></div>)}</div></section>
        <span className="fan-in-arrow" aria-hidden="true">→</span>
        <section className="function-flow-stage signal-stage"><header><span>OUTPUT</span><b>다음으로 보내는 값</b></header><div className="actionable-signal-list">{outputItems.length?outputItems.map(item=><button type="button" className="function-signal-node" key={item.id} onClick={()=>onNavigateToSignal(item.id)}><TechnicalTerm id={item.id} fallback={item.label} compact/></button>):<p>등록된 출력 없음</p>}</div></section>
      </div>
      <div className="function-neighbor-strip" aria-label="선택 기능의 앞뒤 연결">
        <span><small>앞에서 오는 기능</small><b>{incoming.map(item=>architectureNode(item.sourceId)?.label??item.sourceId).join(' · ')||'Reference 연결 확인'}</b></span>
        <i aria-hidden="true">→</i>
        <strong>{selectedName}</strong>
        <i aria-hidden="true">→</i>
        <span><small>다음으로 가는 기능</small><b>{outgoing.map(item=>architectureNode(item.targetId)?.label??item.targetId).join(' · ')||'Reference 연결 확인'}</b></span>
      </div>
      <details className="function-handoffs-details technical-detail-drawer"><summary>인터페이스·요구사항 기술 상세</summary><div className="function-technical-links"><button type="button" onClick={()=>reference?.interfaces[0]&&onNavigateToInterface(reference.interfaces[0].id)} disabled={!reference?.interfaces.length}>연결 인터페이스 보기</button><button type="button" onClick={()=>reference?.requirements[0]&&onNavigateToRequirement(reference.requirements[0].id)} disabled={!reference?.requirements.length}>관련 요구사항 보기</button><small>Reference ID · {reference?.entity.id??node?.id}</small></div></details>
    </section>}

    {!selectedAreaId&&<p className="architecture-start-hint">도메인 → 기능 → 내부 로직 순으로 한 단계씩 확대됩니다.</p>}
  </div>
}
