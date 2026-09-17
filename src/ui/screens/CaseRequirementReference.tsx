import { propulsionRequirements, propulsionTests } from '../../data/ground-truth/PropulsionGroundTruth'
import { useState } from 'react'
import { RequirementMap } from '../xray/RequirementMap'

export function CaseRequirementReference({ id, onSelect }: { id: string; onSelect: (id: string) => void }) {
  const [graph, setGraph] = useState(false)
  const req = propulsionRequirements.find(r => r.id === id)!
  const related = propulsionRequirements.filter(r => r.allocatedComponent === req.allocatedComponent && r.level === req.level)
  const tests = propulsionTests.filter(t => req.linkedTestCases.includes(t.id))
  return <section className={`case-reference ${graph ? 'show-hierarchy' : ''}`} aria-label="요구사항 기준">
    <header><strong>요구사항 기준</strong><button onClick={() => setGraph(v => !v)}>{graph ? '상세 보기' : '계층 구조 보기'}</button></header>
    {graph ? <><p className="case-map-hint">빈 공간 드래그 · 요구사항 선택 시 상세 표시</p><RequirementMap embedded initialRequirement={id} onComponent={() => {}} onRequirement={id => { onSelect(id); setGraph(false) }}/></> : <>
    <div className="case-req-switch">{related.map(r => <button key={r.id} aria-pressed={r.id === id} onClick={() => onSelect(r.id)}>{r.id}</button>)}</div>
    <article className="case-contract"><h3>{req.id}</h3><p>{req.statement}</p><small>{req.allocatedComponent} · TRACKBACK_MODEL</small></article>
    <div className="case-req-links"><span>{req.level === 'SOFTWARE' ? '상위 SYSR' : '하위 SWR'}</span>{req.linkedRequirements.map(link => <button key={link} onClick={() => onSelect(link)}>{link}</button>)}</div>
    <details><summary>관련 검증 정의 · TC {req.linkedTestCases.length}개</summary><p className="case-caption">TC는 조건·입력·기대 결과를 정한 시험 정의입니다. 현재 기록의 판정 결과가 아닙니다.</p>{tests.map(t => <article key={t.id}><b>{t.id}</b><p>조건: {t.precondition}<br/>입력: {t.stimulus}<br/>기대: {t.expectedResult}</p></article>)}{req.linkedTestCases.filter(id => !tests.some(t => t.id === id)).map(id => <p key={id}>{id} · 상세는 Ground Truth 문서 참조</p>)}</details>
    </>}
  </section>
}
