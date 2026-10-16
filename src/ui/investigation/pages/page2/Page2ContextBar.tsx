import { resolveInvestigationSelection } from '../../../../registries/investigation/Trace'
import type { InvestigationSelection } from '../../../../runtime/investigation/InvestigationSession'
import { getReferenceEntity } from '../../referenceVehicle/ReferenceVehicleUIAdapter.ts'
import { TechnicalTerm } from '../../presentation/InvestigationTerminology.tsx'

interface Page2ContextBarProps {
  selection: InvestigationSelection
  currentPath: readonly string[]
}

const pathLabel = (id:string) => id==='VehiclePhysics'?'실제 차량 반응':id

export function Page2ContextBar({ selection, currentPath }: Page2ContextBarProps) {
  const resolved=resolveInvestigationSelection(selection)
  const referenceComponent=selection.componentId?getReferenceEntity(selection.componentId):undefined
  const referenceSignal=selection.signalId?getReferenceEntity(selection.signalId):undefined
  return <section className="p2-compact-context" aria-label="현재 조사 컨텍스트">
    <div className="p2-context-column">
      <small>현재 조사 기능</small>
      {resolved.component?<TechnicalTerm id={resolved.component.id} fallback={resolved.component.label} compact/>:referenceComponent?.entityKind==='LOGICAL_FUNCTION'?<TechnicalTerm id={referenceComponent.id} fallback={referenceComponent.name} compact/>:<span>기능을 선택하세요</span>}
    </div>
    <div className="p2-context-column">
      <small>선택 신호</small>
      {resolved.signal?<TechnicalTerm id={resolved.signal.id} fallback={resolved.signal.description??resolved.signal.label} compact/>:referenceSignal?.entityKind==='SIGNAL'?<TechnicalTerm id={referenceSignal.id} fallback={referenceSignal.name} compact/>:<span>선택된 신호 없음</span>}
    </div>
    <div className="p2-context-column p2-context-path">
      <small>현재 조사 경로</small>
      {currentPath.length>0?<div>{currentPath.map((id,index)=><span key={id}>{index>0&&<i>←</i>}<TechnicalTerm id={id} fallback={pathLabel(id)} compact/></span>)}</div>:<span>기능을 선택하면 경로가 표시됩니다</span>}
    </div>
  </section>
}
