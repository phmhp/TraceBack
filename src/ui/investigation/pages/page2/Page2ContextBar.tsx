import { getArchitectureNode } from '../../../../registries/investigation/Architecture'
import { resolveInvestigationSelection } from '../../../../registries/investigation/Trace'
import type { InvestigationSelection } from '../../../../runtime/investigation/InvestigationSession'

export function Page2ContextBar({ selection }: { selection: InvestigationSelection }) {
  const resolved=resolveInvestigationSelection(selection)
  const trail=[
    resolved.component?.label,
    resolved.signal?.label,
    resolved.interface&&`${getArchitectureNode(resolved.interface.sourceId)?.label} → ${getArchitectureNode(resolved.interface.targetId)?.label}`,
    resolved.requirement?.id,
    resolved.testCase?.id,
  ].filter(Boolean)
  return <section className="p2-compact-context" aria-label="현재 조사 컨텍스트">
    <span>현재 조사</span>
    <div>{trail.map((item,index)=><span key={String(item)}>{index>0&&<i aria-hidden="true">›</i>}<code>{item}</code></span>)}</div>
  </section>
}
