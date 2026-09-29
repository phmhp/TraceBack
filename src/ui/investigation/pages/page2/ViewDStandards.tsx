import { useMemo, useState } from 'react'
import { architectureNode } from '../../../../registries/investigation/Architecture'
import { getLinkedRequirements, getRequirement, getRequirementsForComponent, getTestsForRequirement } from '../../../../registries/investigation/Trace'
import { RequirementConditions } from '../../../screens/CaseGuide'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'

interface Props { selectedComponent:string; selectedRequirementId:string; onSelectRequirement:(id:string)=>void; onSaveAsEvidence:(id:string)=>void; onOpenBenchWithTc?:(id:string)=>void; onOpenReqMap?:()=>void; currentFrame?:IncidentFrame }

export function ViewDStandards({selectedComponent,selectedRequirementId,onSelectRequirement,onSaveAsEvidence,onOpenBenchWithTc,onOpenReqMap,currentFrame}:Props){
  const contextual=useMemo(()=>getRequirementsForComponent(selectedComponent),[selectedComponent])
  const requested=getRequirement(selectedRequirementId)
  const active=requested&&contextual.some(item=>item.id===requested.id)?requested:contextual[0]
  const [saved,setSaved]=useState('')
  if(!active)return <section className="selection-required"><p className="investigation-section-label">관련 요구사항</p><h3><code className="investigation-tech-id">{selectedComponent}</code>에 할당된 요구사항이 없습니다.</h3><p>지원되지 않는 관계를 만들지 않고 현재 registry에 등록된 정보만 표시합니다.</p></section>
  const linked=getLinkedRequirements(active.id),tests=getTestsForRequirement(active.id)
  const system=active.level==='SYSTEM'?active:linked.find(item=>item.level==='SYSTEM')
  const software=active.level==='SOFTWARE'?active:linked.find(item=>item.level==='SOFTWARE')
  const save=()=>{onSaveAsEvidence(active.id);setSaved(active.id)}
  return <div className="requirement-workspace">
    <section className="requirement-heading"><div><p className="investigation-section-label">요구사항 · 기준 동작</p><h3>현재 기능 · <code className="investigation-tech-id">{architectureNode(selectedComponent)?.label??selectedComponent}</code></h3><p className="investigation-prose">이 기능은 어떤 조건에서 어떻게 동작해야 하는가?</p></div>{onOpenReqMap&&<button type="button" className="report-text-button" onClick={onOpenReqMap}>전체 요구사항 구조 보기 →</button>}</section>
    <div className="requirement-main-grid">
      <nav className="requirement-context-list" aria-label="이 기능에 할당된 요구사항"><p className="investigation-section-label">이 기능에 할당된 요구사항</p>{contextual.map(req=><button type="button" key={req.id} aria-pressed={req.id===active.id} onClick={()=>onSelectRequirement(req.id)}><span>{req.statement}</span><code className="investigation-tech-id">{req.id}</code></button>)}</nav>
      <article className="requirement-detail">
        <header><div><p className="investigation-section-label">선택 요구사항 · {active.level}</p><h3>{active.statement}</h3><code className="investigation-tech-id">{active.id}</code></div><div className="evidence-save-control"><button type="button" className="save-comparison-button" onClick={save}>근거에 추가</button>{saved===active.id&&<small role="status">✓ 조사 노트에 기록됨</small>}</div></header>
        <div className="requirement-player-questions">
          <section><p className="investigation-section-label">WHEN · 적용 조건</p><RequirementConditions id={active.id} frame={currentFrame}/></section>
          <section><p className="investigation-section-label">WHAT · 기대 동작</p><p>{active.statement}</p></section>
          <section><p className="investigation-section-label">WHERE · 할당 기능</p><strong>{architectureNode(active.allocatedComponent)?.label??active.allocatedComponent}</strong></section>
          <section><p className="investigation-section-label">HOW VERIFIED · 관련 TC</p>{tests.length?tests.map(tc=><div className="requirement-test-row" key={tc.id}><div><code className="investigation-tech-id">{tc.id}</code><span className={tc.execution.status==='EXECUTABLE'?'executable':'reference'}>{tc.execution.status}</span><p>{tc.precondition??'상세 조건 미등록'} → {tc.observation??'관찰 항목 미등록'}</p></div>{onOpenBenchWithTc&&<button type="button" onClick={()=>onOpenBenchWithTc(tc.id)}>검증 계획에서 보기 →</button>}</div>):<p className="investigation-annotation">연결된 시험이 없습니다.</p>}</section>
        </div>
        <section className="requirement-pedigree"><p className="investigation-section-label">요구사항 계보 · 등록된 관계</p><div className="requirement-tree">
          {system&&<div><code>{system.id}</code><span>{system.statement}</span></div>}
          {system&&software&&<i aria-hidden="true">└──</i>}
          {software&&<div><code>{software.id}</code><span>{software.statement}</span></div>}
          {(system||software)&&<i aria-hidden="true">└──</i>}
          <div><small>Allocated to</small><strong>{architectureNode(active.allocatedComponent)?.label??active.allocatedComponent}</strong></div>
        </div><p className="investigation-annotation">부모·자식 및 기능 할당은 canonical registry에 등록된 관계만 표시합니다.</p></section>
        <dl className="requirement-facts secondary"><div><dt>상태</dt><dd>{active.status}</dd></div><div><dt>출처</dt><dd>{active.provenance}</dd></div></dl>
      </article>
    </div>
  </div>
}
