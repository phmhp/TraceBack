import { getArchitectureNode } from '../../../../registries/investigation/Architecture'
import { resolveInvestigationSelection } from '../../../../registries/investigation/Trace'
import type { InvestigationSelection } from '../../../../runtime/investigation/InvestigationSession'

export function Page2ContextBar({ selection }: { selection: InvestigationSelection }) {
  const resolved=resolveInvestigationSelection(selection)
  return <section className="p2-compact-context" aria-label="현재 조사 컨텍스트">
    <span>현재 조사</span>
    {resolved.component?<div className="context-strip-items">
      <span><small>기능</small><code>{resolved.component.label}</code></span>
      {resolved.signal&&<span><small>선택 신호</small><code>{resolved.signal.label}</code></span>}
      {resolved.interface&&<span><small>전달 경계</small><code>{getArchitectureNode(resolved.interface.sourceId)?.label} → {getArchitectureNode(resolved.interface.targetId)?.label}</code></span>}
      {resolved.requirement&&<span><small>관련 요구사항</small><code>{resolved.requirement.id}</code></span>}
      {resolved.testCase&&<span><small>시험</small><code>{resolved.testCase.id}</code></span>}
    </div>:<p>기능 흐름에서 조사할 기능을 선택하세요.</p>}
  </section>
}
