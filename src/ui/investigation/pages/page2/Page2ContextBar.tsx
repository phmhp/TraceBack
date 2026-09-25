import { architectureNodes, getArchitectureNode } from '../../../../registries/investigation/Architecture'
import { resolveInvestigationSelection } from '../../../../registries/investigation/Trace'
import type { InvestigationSelection } from '../../../../runtime/investigation/InvestigationSession'

const groupLabel = {
  DRIVER: '운전자 / 외부',
  SW: '차량 내부 기능',
  ADAPTER: '액추에이션 / 어댑터',
  PLANT: '차량 동역학',
  REFERENCE: '참조 영역',
} as const

interface Page2ContextBarProps {
  selection: InvestigationSelection
  relevantPath: readonly string[]
  onSelectComponent: (id: string) => void
  onOpenArchitecture: () => void
}

export function Page2ContextBar({ selection, relevantPath, onSelectComponent, onOpenArchitecture }: Page2ContextBarProps) {
  const resolved = resolveInvestigationSelection(selection)
  const context = [
    resolved.component && { kind: '기능', value: resolved.component.label, technical: resolved.component.id },
    resolved.signal && { kind: '신호', value: resolved.signal.label, technical: resolved.signal.id },
    resolved.interface && { kind: '인터페이스', value: `${getArchitectureNode(resolved.interface.sourceId)?.label} → ${getArchitectureNode(resolved.interface.targetId)?.label}`, technical: resolved.interface.id },
    resolved.requirement && { kind: '요구사항', value: resolved.requirement.id, technical: resolved.requirement.id },
    resolved.testCase && { kind: '시험', value: resolved.testCase.id, technical: resolved.testCase.id },
  ].filter(Boolean) as { kind: string; value: string; technical: string }[]

  return <section className="p2-context" aria-label="현재 조사 컨텍스트">
    <div className="p2-context-current">
      <div className="p2-context-heading">
        <span><small>현재 선택</small><b>{context[0]?.value ?? '선택 없음'}</b></span>
        <button type="button" className="timeline-btn" onClick={onOpenArchitecture}>현재 지원 구조 보기 ›</button>
      </div>
      <div className="p2-context-trail">
        {context.map((item, index) => <span className="p2-context-item" key={`${item.kind}:${item.technical}`}>
          {index > 0 && <i aria-hidden="true">›</i>}
          <small>{item.kind}</small><code>{item.value}</code>
        </span>)}
      </div>
    </div>

    <div className="p2-case-path">
      <div className="p2-case-path-label">
        <b>사건 관련 경로</b>
        <small>현재 지원 구조 {architectureNodes.length}개 중 이 사건과 관련된 안내 경로 · 순서대로 조사할 필요는 없습니다.</small>
      </div>
      <div className="p2-case-path-nodes">
        {relevantPath.map(id => {
          const node=getArchitectureNode(id)
          if(!node)return null
          return <button
            type="button"
            key={id}
            className={`p2-path-node kind-${node.kind.toLowerCase()} ${selection.componentId===id?'selected':''}`}
            onClick={()=>onSelectComponent(id)}
          >
            <small>{groupLabel[node.kind]}</small>
            <span>{node.label}</span>
          </button>
        })}
      </div>
    </div>
  </section>
}
