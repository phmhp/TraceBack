import { propulsionRequirements, propulsionTests } from '../../data/ground-truth/PropulsionGroundTruth'
import type { IncidentFrame } from '../../runtime/case/PropulsionCase'
import { RequirementConditions } from './CaseGuide'

export function CaseRequirementReference({ id, onOpenMap, frame }: { id: string; onSelect: (id: string) => void; onOpenMap: () => void; frame?: IncidentFrame }) {
  const req = propulsionRequirements.find(r => r.id === id)!
  const tests = propulsionTests.filter(t => req.linkedTestCases.includes(t.id))
  return <section className="case-reference" aria-label="요구사항 기준">
    <header><strong>요구사항 상세</strong><button onClick={onOpenMap}>큰 계층 지도 ↗</button></header>
    <article className="case-contract"><h3><code>{req.id}</code></h3><p>{req.statement}</p><small>{req.allocatedComponent}</small></article>
    <RequirementConditions id={id} frame={frame}/>
    <details><summary>관련 검증 정의 · TC {req.linkedTestCases.length}개</summary><p className="case-caption">TC(Test Case)는 동작을 확인할 조건·입력·기대 결과를 정한 시험입니다. 이 기준을 참고해 재현 시험의 입력을 골라보세요.</p>{tests.map(t => <article key={t.id}><b>{t.id}</b><p>조건: {t.precondition}<br/>입력: {t.stimulus}<br/>기대: {t.expectedResult}</p></article>)}{req.linkedTestCases.filter(id => !tests.some(t => t.id === id)).map(id => <p key={id}>{id} · 상세는 Ground Truth 문서 참조</p>)}</details>

  </section>
}


