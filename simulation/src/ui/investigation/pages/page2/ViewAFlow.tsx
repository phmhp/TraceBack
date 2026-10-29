import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties } from 'react'
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
  const primaryContextGroups=vehicleContextGroups.slice(0,4)
  const supportContextGroup=vehicleContextGroups[4]
  const visibleInputs=inputItems.slice(0,3)
  const visibleOutputs=outputItems.slice(0,3)

  const chooseArea=(areaId:string)=>{setSelectedAreaId(areaId);if(areaForComponent(selectedComponent)!==areaId)onSelectComponent('')}

  return <div className="function-flow-workspace architecture-drilldown">
    <nav className="architecture-breadcrumb" aria-label="아키텍처 확대 단계">
      <button type="button" className={!selectedAreaId?'current':''} onClick={()=>{setSelectedAreaId('');onSelectComponent('')}}>전체 차량</button><i aria-hidden="true">›</i>
      <button type="button" disabled={!selectedAreaId} className={selectedAreaId&&!selectedComponent?'current':''} onClick={()=>onSelectComponent('')}>{selectedAreaId?(areaEasyNames[selectedAreaId]??selectedArea?.name??selectedAreaId):'도메인'}</button><i aria-hidden="true">›</i>
      <span className={selectedComponent?'current':''}>{selectedComponent?selectedName:'기능'}</span>
    </nav>

    {!selectedAreaId&&<section className="vehicle-architecture-sheet architecture-level architecture-domain-level" aria-labelledby="vehicle-architecture-title">
      <header className="diagram-heading simple-heading"><div><p className="investigation-section-label">1단계 · 전체 차량 지도</p><h3 id="vehicle-architecture-title">차량의 정보가 반응으로 이어지는 길</h3><p>왼쪽의 입력부터 오른쪽의 실제 반응까지 흐릅니다. 궁금한 도메인을 누르면 내부 기능이 열립니다.</p></div><span className="architecture-level-badge">도메인 수준</span></header>
      <div className="vehicle-architecture-diagram vehicle-domain-architecture" aria-label="전체 차량 도메인 연결 구조">
        <div className="vehicle-domain-main-flow">
          {primaryContextGroups.map((group,index)=><div className="vehicle-domain-stage-wrap" key={group.label}>
            <section className="vehicle-domain-stage"><header><span>{index+1}</span><b>{group.label}</b></header><div>{group.areas.map(areaId=>{const area=getReferenceEntity(areaId);if(!area)return null;const functions=getReferenceFunctionsForArea(areaId);const focus=getReferenceFocus(area);return <button type="button" key={areaId} className={`architecture-domain-card focus-${focus.toLowerCase()}`} onClick={()=>chooseArea(areaId)}><strong>{areaEasyNames[areaId]??area.name??areaId}</strong><span>{functions.length}개 기능 · 내부 보기</span><code>{areaId}</code></button>})}</div></section>
            {index<primaryContextGroups.length-1&&<span className="architecture-flow-arrow" aria-hidden="true">→</span>}
          </div>)}
        </div>
        <section className="vehicle-support-bus"><header><span>↕</span><b>{supportContextGroup.label}</b><small>각 단계의 상태를 돕고 감시합니다.</small></header><div>{supportContextGroup.areas.map(areaId=>{const area=getReferenceEntity(areaId);if(!area)return null;const functions=getReferenceFunctionsForArea(areaId);return <button type="button" key={areaId} className="architecture-domain-card" onClick={()=>chooseArea(areaId)}><strong>{areaEasyNames[areaId]??area.name??areaId}</strong><span>{functions.length}개 기능</span><code>{areaId}</code></button>})}</div></section>
      </div>
      <div className="architecture-reading-key"><span><b>읽는 법</b> 입력·상태 → 주행 기능 → 움직임 조정 → 실제 반응</span><span>지원 기능은 전체 흐름을 감시·보조</span></div>
    </section>}

    {selectedAreaId&&!selectedComponent&&<section className="vehicle-architecture-sheet architecture-level architecture-function-level" aria-label={`${selectedArea?.name??selectedAreaId} 기능 수준 아키텍처`}>
      <header className="diagram-heading simple-heading"><div><p className="investigation-section-label">2단계 · 도메인 서브시스템</p><h3>{areaEasyNames[selectedAreaId]??selectedArea?.name??selectedAreaId} <code>{selectedAreaId}</code></h3><p>도메인 안에서 요청이 판단과 상태 관리를 거쳐 전달되는 순서입니다. 기능을 누르면 내부 로직만 확대합니다.</p></div><span className="architecture-level-badge">기능 수준</span></header>
      <div className="domain-function-architecture" style={{'--function-stage-count':Math.max(1,functionGroups.length)} as CSSProperties}>
        <span className="subsystem-port input-port"><small>IN</small><b>도메인 입력</b></span>
        <div className="domain-function-pipeline">
          {functionGroups.map((kind,index)=><div className="reference-function-stage-wrap" key={kind}><section className="reference-function-group"><h4><span>{index+1}</span>{functionKindLabels[kind]??'기타 기능'}</h4><div>{areaFunctions.filter(item=>String(item.metadata.functionKind??'OTHER')===kind).map(item=>{const status=getReferenceStatus(item);const familiar=familiarFunctionNames[item.id];const casePath=getReferenceFocus(item)==='PRIMARY_FOCUS'||relevantPath.has(familiar??item.id);return <button type="button" key={item.id} className={`${casePath?'case-path-node ':''}${selectedComponent===item.id?'selected':''}`} aria-pressed={selectedComponent===item.id} onClick={()=>onSelectComponent(item.id)}><TechnicalTerm id={familiar??item.id} fallback={item.name} compact/><small>{status.capability==='CURRENT'?'실행·관찰 가능':status.capability==='PARTIAL'?'일부 관찰 가능':'설계 정보'}</small></button>})}</div></section>{index<functionGroups.length-1&&<span className="architecture-flow-arrow" aria-hidden="true">→</span>}</div>)}
        </div>
        <span className="subsystem-port output-port"><small>OUT</small><b>다음 도메인</b></span>
      </div>
      <p className="architecture-level-help">이 화면에서는 <b>어떤 기능을 거치는지</b>만 봅니다. 값은 기능을 고른 뒤 ‘연결 → 신호’에서 확인하세요.</p>
    </section>}

    {selectedComponent&&(node||reference)&&<section className="selected-function-sheet architecture-level architecture-logic-level" aria-labelledby="selected-function-title">
      <header className="selected-function-header"><div><p className="investigation-section-label">3단계 · 기능 내부 확대</p><h3 id="selected-function-title"><TechnicalTerm id={node?.id??reference?.entity.id??selectedComponent} fallback={selectedName}/></h3><p className="selected-function-role">지금은 <b>무엇을 받아서 무엇을 내보내는지</b>만 확인하세요.</p></div><div className="selected-function-actions">{discoveredMismatch&&<span className="discovered-mismatch">확인된 차이</span>}<button type="button" className="report-text-button" onClick={()=>onSetHypothesisTarget(selectedComponent)}>이 기능으로 가설 만들기</button></div></header>
      <div className="selected-function-flow logic-architecture-flow">
        <section className="function-flow-stage signal-stage"><header><span>IN PORT</span><b>들어오는 값</b></header><div className="actionable-signal-list">{visibleInputs.length?visibleInputs.map(item=><button type="button" className="function-signal-node" key={item.id} onClick={()=>onNavigateToSignal(item.id)}><small>{item.kind}</small><TechnicalTerm id={item.id} fallback={item.label} compact/></button>):<p>등록된 입력 없음</p>}{inputItems.length>visibleInputs.length&&<small className="hidden-item-count">외 {inputItems.length-visibleInputs.length}개 · 기술 상세에서 확인</small>}</div></section>
        <span className="fan-in-arrow" aria-hidden="true">→</span>
        <section className="function-flow-stage processing-stage subsystem-process"><header><span>SUBSYSTEM</span><b>{selectedName}</b></header><div className="simple-logic-story"><span>입력 받기</span><i>→</i><span>기능 처리</span><i>→</i><span>출력 만들기</span></div><p>{selectedRole||'입력과 상태를 확인해 다음 단계에 전달할 출력을 만듭니다.'}</p></section>
        <span className="fan-in-arrow" aria-hidden="true">→</span>
        <section className="function-flow-stage signal-stage"><header><span>OUT PORT</span><b>나가는 값</b></header><div className="actionable-signal-list">{visibleOutputs.length?visibleOutputs.map(item=><button type="button" className="function-signal-node" key={item.id} onClick={()=>onNavigateToSignal(item.id)}><TechnicalTerm id={item.id} fallback={item.label} compact/></button>):<p>등록된 출력 없음</p>}{outputItems.length>visibleOutputs.length&&<small className="hidden-item-count">외 {outputItems.length-visibleOutputs.length}개 · 기술 상세에서 확인</small>}</div></section>
      </div>
      <div className="function-neighbor-strip" aria-label="선택 기능의 앞뒤 연결">
        <span><small>앞에서 오는 기능</small><b>{incoming.map(item=>architectureNode(item.sourceId)?.label??item.sourceId).join(' · ')||'Reference 연결 확인'}</b></span>
        <i aria-hidden="true">→</i>
        <strong>{selectedName}</strong>
        <i aria-hidden="true">→</i>
        <span><small>다음으로 가는 기능</small><b>{outgoing.map(item=>architectureNode(item.targetId)?.label??item.targetId).join(' · ')||'Reference 연결 확인'}</b></span>
      </div>
      <details className="function-handoffs-details technical-detail-drawer"><summary>전체 내부 설명과 기술 상세</summary><div className="function-logic-details"><p>{processing.join(' → ')}</p><div className="function-technical-links"><button type="button" onClick={()=>reference?.interfaces[0]&&onNavigateToInterface(reference.interfaces[0].id)} disabled={!reference?.interfaces.length}>연결 인터페이스 보기</button><button type="button" onClick={()=>reference?.requirements[0]&&onNavigateToRequirement(reference.requirements[0].id)} disabled={!reference?.requirements.length}>관련 요구사항 보기</button><small>Reference ID · {reference?.entity.id??node?.id}</small></div></div></details>
    </section>}

    {!selectedAreaId&&<p className="architecture-start-hint">도메인 → 기능 → 내부 로직 순으로 한 단계씩 확대됩니다.</p>}
  </div>
}
