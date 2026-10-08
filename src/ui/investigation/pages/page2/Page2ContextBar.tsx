import { resolveInvestigationSelection } from '../../../../registries/investigation/Trace'
import type { InvestigationSelection } from '../../../../runtime/investigation/InvestigationSession'

interface Page2ContextBarProps {
  selection: InvestigationSelection
  currentPath: readonly string[]
}

const pathLabel = (id:string) => id==='VehiclePhysics'?'Vehicle Response':id

export function Page2ContextBar({ selection, currentPath }: Page2ContextBarProps) {
  const resolved=resolveInvestigationSelection(selection)
  return <section className="p2-compact-context" aria-label="현재 조사 컨텍스트">
    <div className="p2-context-column">
      <small>현재 조사 기능</small>
      {resolved.component?<code>{resolved.component.label}</code>:<span>기능을 선택하세요</span>}
    </div>
    <div className="p2-context-column">
      <small>선택 신호</small>
      {resolved.signal?<code>{resolved.signal.label}</code>:<span>선택된 신호 없음</span>}
    </div>
    <div className="p2-context-column p2-context-path">
      <small>현재 조사 경로</small>
      {currentPath.length>0?<div>{currentPath.map((id,index)=><span key={id}>{index>0&&<i>←</i>}<code>{pathLabel(id)}</code></span>)}</div>:<span>기능을 선택하면 경로가 표시됩니다</span>}
    </div>
  </section>
}
