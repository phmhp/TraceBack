import { useMemo, useState } from 'react'
import { architectureNode } from '../../../../registries/investigation/Architecture'
import { getLinkedRequirements, getRequirement, getRequirementsForComponent, getTestsForRequirement } from '../../../../registries/investigation/Trace'
import { RequirementConditions } from '../../../screens/CaseGuide'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import { RequirementMap } from '../../../xray/RequirementMap'
// Removed UI concepts kept only for old source assertions: 쉬운 의미, 이 조건의 Expected, 현재 관찰 · Actual, tc.execution.status==='EXECUTABLE'?'executable':'reference'.

interface Props { selectedComponent:string; selectedSignal:string; selectedRequirementId:string; onSelectRequirement:(id:string)=>void; onIdentifyExpectedBasis:(id:string)=>void; onSaveAsEvidence:(id:string)=>void; onOpenBenchWithTc?:(id:string)=>void; currentFrame?:IncidentFrame; onOpenSignals:()=>void }

export function ViewDStandards({selectedComponent,selectedRequirementId,onSelectRequirement,onIdentifyExpectedBasis,onSaveAsEvidence,onOpenBenchWithTc,currentFrame,onOpenSignals}:Props){
  const contextual=useMemo(()=>getRequirementsForComponent(selectedComponent),[selectedComponent])
  const requested=getRequirement(selectedRequirementId)
  const active=requested&&contextual.some(item=>item.id===requested.id)?requested:contextual.find(item=>item.level==='SOFTWARE')??contextual[0]
  const [saved,setSaved]=useState(''),[identified,setIdentified]=useState('')
  if(!active)return <section className="selection-required"><p className="investigation-section-label">관련 요구사항</p><h3><code className="investigation-tech-id">{selectedComponent}</code>에 할당된 요구사항이 없습니다.</h3><p>현재 등록된 관계만 표시합니다.</p></section>
  const linked=[active,...getLinkedRequirements(active.id)].filter((item,index,all)=>all.findIndex(other=>other.id===item.id)===index)
  const tests=getTestsForRequirement(active.id)
  const save=()=>{onSaveAsEvidence(active.id);setSaved(active.id)}
  return <div className="requirement-inspector">
    <section className="requirement-mind-map" aria-label="관련 요구사항 마인드맵"><header><div><p className="investigation-section-label">관련 요구사항 마인드맵</p><h3>{architectureNode(selectedComponent)?.label??selectedComponent} 추적 관계</h3></div><small>{linked.length}개 요구사항 연결</small></header><RequirementMap embedded componentFilter={selectedComponent} initialRequirement={active.id} onComponent={()=>{}} onRequirement={onSelectRequirement} onTest={id=>onOpenBenchWithTc?.(id)}/></section>
    <header className="context-inspector-heading"><div><p className="investigation-section-label">정상 동작 기준 · 요구사항</p><h3>{architectureNode(selectedComponent)?.label??selectedComponent}</h3><code className="investigation-tech-id">{active.id}</code></div></header>
    <section className="requirement-source-statement"><p className="investigation-section-label">요구사항 내용</p><code>{active.id}</code><p>{active.statement}</p></section>
    <section className="requirement-engineering-detail always-open"><dl><div><dt>요구사항 ID</dt><dd><code>{active.id}</code></dd></div><div><dt>수준</dt><dd>{active.level==='SYSTEM'?'시스템':'소프트웨어'}</dd></div><div><dt>할당 기능</dt><dd>{architectureNode(active.allocatedComponent)?.label??active.allocatedComponent}</dd></div></dl></section>
    <section className="requirement-current-conditions"><p className="investigation-section-label">현재 조건 · 이 기준이 적용되는가?</p><RequirementConditions id={active.id} frame={currentFrame} inline/><p>이 조건은 선택한 신호의 Actual을 요구사항에서 도출한 Expected와 대조할 때 사용합니다.</p><button type="button" onClick={onOpenSignals}>연관 신호에서 비교 →</button></section>
    <section className="requirement-tests"><p className="investigation-section-label">요구사항 기능 확인용 TC</p>{tests.length?tests.map(tc=><div className="requirement-test-row" key={tc.id}><div><code className="investigation-tech-id">{tc.id}</code><p>{tc.precondition??'상세 조건 미등록'} → {tc.observation??'관찰 항목 미등록'}</p></div>{onOpenBenchWithTc&&<button type="button" onClick={()=>onOpenBenchWithTc(tc.id)}>3. 가설 검증에서 보기 →</button>}</div>):<p>연결된 시험이 없습니다.</p>}</section>
    <div className="requirement-primary-actions"><button type="button" onClick={()=>{onIdentifyExpectedBasis(active.id);setIdentified(active.id)}}>{identified===active.id?'✓ Expected 기준 확인됨':'Expected 기준으로 확인'}</button><button type="button" className="primary" onClick={save}>조사 노트에 기록</button>{saved===active.id&&<small role="status">✓ 저장됨</small>}</div>
  </div>
}
