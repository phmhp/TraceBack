import { useMemo, useState } from 'react'
import { architectureNode } from '../../../../registries/investigation/Architecture'
import { getLinkedRequirements, getRequirement, getRequirementsForComponent, getTestsForRequirement } from '../../../../registries/investigation/Trace'
import { RequirementConditions } from '../../../screens/CaseGuide'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import { RequirementMap } from '../../../xray/RequirementMap'
import { getReferenceFunctionContextForComponent, getReferenceStatus } from '../../referenceVehicle/ReferenceVehicleUIAdapter.ts'

interface Props { selectedComponent:string; selectedSignal:string; selectedRequirementId:string; onSelectRequirement:(id:string)=>void; onIdentifyExpectedBasis:(id:string)=>void; onSaveAsEvidence:(id:string)=>void; onOpenBenchWithTc?:(id:string)=>void; currentFrame?:IncidentFrame; onOpenSignals:()=>void }

export function ViewDStandards({selectedComponent,selectedRequirementId,onSelectRequirement,onIdentifyExpectedBasis,onSaveAsEvidence,onOpenBenchWithTc,currentFrame,onOpenSignals}:Props){
  const contextual=useMemo(()=>getRequirementsForComponent(selectedComponent),[selectedComponent])
  const referenceContext=useMemo(()=>getReferenceFunctionContextForComponent(selectedComponent),[selectedComponent])
  const requested=getRequirement(selectedRequirementId)
  const active=requested&&contextual.some(item=>item.id===requested.id)?requested:contextual.find(item=>item.level==='SOFTWARE')??contextual[0]
  const [saved,setSaved]=useState(''),[identified,setIdentified]=useState('')
  if(!active)return <section className="selection-required"><p className="investigation-section-label">관련 요구사항</p><h3><code className="investigation-tech-id">{selectedComponent}</code>에 할당된 요구사항이 없습니다.</h3><p>현재 등록된 관계만 표시합니다.</p></section>
  const linked=[active,...getLinkedRequirements(active.id)].filter((item,index,all)=>all.findIndex(other=>other.id===item.id)===index)
  const tests=getTestsForRequirement(active.id)
  const save=()=>{onSaveAsEvidence(active.id);setSaved(active.id)}
  return <div className="requirement-inspector">
    <details className="requirement-mind-map technical-detail-drawer" aria-label="관련 요구사항 마인드맵"><summary>요구사항 연결 지도 보기 · {linked.length}개</summary><header><div><p className="investigation-section-label">관련 요구사항 마인드맵</p><h3>{architectureNode(selectedComponent)?.label??selectedComponent} 추적 관계</h3></div></header><RequirementMap embedded componentFilter={selectedComponent} initialRequirement={active.id} onComponent={()=>{}} onRequirement={onSelectRequirement} onTest={id=>onOpenBenchWithTc?.(id)}/></details>
    <header className="context-inspector-heading"><div><p className="investigation-section-label">정상 동작 기준 · 요구사항</p><h3>{architectureNode(selectedComponent)?.label??selectedComponent}</h3><code className="investigation-tech-id">{active.id}</code></div></header>
    <div className="requirement-pedigree-strip" aria-label="요구사항 추적 요약"><span>{active.level==='SYSTEM'?'시스템 기준':'소프트웨어 기준'}</span><i aria-hidden="true">→</i><b>{architectureNode(active.allocatedComponent)?.label??active.allocatedComponent}</b><i aria-hidden="true">→</i><span>연결 시험 {tests.length}개</span></div>
    <section className="requirement-source-statement requirement-easy-first"><p className="investigation-section-label">원래 어떻게 동작해야 하나요?</p><h4>쉬운 의미</h4><p>{active.statement}</p><details className="technical-detail-drawer"><summary>기술 원문과 ID</summary><code>{active.id}</code><p>{active.statement}</p></details></section>
    {referenceContext?.requirements.length?<details className="requirement-reference-allocation technical-detail-drawer"><summary>Reference 연결 기준 {referenceContext.requirements.length}개</summary><header><div><p className="investigation-section-label">REFERENCE ALLOCATION</p><h4>{referenceContext.entity.name||referenceContext.entity.id}에 연결된 기준</h4></div><small>기존 요구사항 원문은 그대로 유지됩니다.</small></header><div>{referenceContext.requirements.map(requirement=>{const status=getReferenceStatus(requirement);return <article key={requirement.id}><code>{requirement.id}</code><span>{requirement.description||requirement.name}</span><small>{status.approval} · Reference trace</small></article>})}</div></details>:null}
    <details className="requirement-engineering-detail technical-detail-drawer"><summary>요구사항 기술 정보</summary><dl><div><dt>요구사항 ID</dt><dd><code>{active.id}</code></dd></div><div><dt>수준</dt><dd>{active.level==='SYSTEM'?'시스템':'소프트웨어'}</dd></div><div><dt>할당 기능</dt><dd>{architectureNode(active.allocatedComponent)?.label??active.allocatedComponent}</dd></div></dl></details>
    <section className="requirement-current-conditions"><p className="investigation-section-label">현재 조건 · 이 기준이 적용되는가?</p><RequirementConditions id={active.id} frame={currentFrame} inline/><p>이 조건은 선택한 신호의 Actual을 요구사항에서 도출한 Expected와 대조할 때 사용합니다.</p><button type="button" onClick={onOpenSignals}>연관 신호에서 비교 →</button></section>
    <details className="requirement-tests technical-detail-drawer"><summary>이 기준을 확인하는 시험 {tests.length}개</summary>{tests.length?tests.map(tc=><div className="requirement-test-row" key={tc.id}><div><code className="investigation-tech-id">{tc.id}</code><p>{tc.precondition??'상세 조건 미등록'} → {tc.observation??'관찰 항목 미등록'}</p></div>{onOpenBenchWithTc&&<button type="button" onClick={()=>onOpenBenchWithTc(tc.id)}>3. 가설 검증에서 보기 →</button>}</div>):<p>연결된 시험이 없습니다.</p>}</details>
    <div className="requirement-primary-actions"><button type="button" onClick={()=>{onIdentifyExpectedBasis(active.id);setIdentified(active.id)}}>{identified===active.id?'✓ Expected 기준 확인됨':'Expected 기준으로 확인'}</button><button type="button" className="primary" onClick={save}>조사 노트에 기록</button>{saved===active.id&&<small role="status">✓ 저장됨</small>}</div>
  </div>
}
