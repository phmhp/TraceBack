import { useMemo, useState } from 'react'
import { architectureNode, getOutputSignals, getSignalDefinition } from '../../../../registries/investigation/Architecture'
import { compareSignalAtFrame } from '../../../../runtime/investigation/SignalComparison'
import { getLinkedRequirements, getRequirement, getRequirementsForComponent, getTestsForRequirement } from '../../../../registries/investigation/Trace'
import { RequirementConditions } from '../../../screens/CaseGuide'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'

interface Props { selectedComponent:string; selectedSignal:string; selectedRequirementId:string; onSelectRequirement:(id:string)=>void; onIdentifyExpectedBasis:(id:string)=>void; onSaveAsEvidence:(id:string)=>void; onOpenBenchWithTc?:(id:string)=>void; onOpenReqMap?:()=>void; currentFrame?:IncidentFrame }

function easyMeaning(requirementId:string,statement:string){
  if(requirementId==='SWR-EDR-001')return '유효한 토크 요청은 방향별 한계를 넘지 않도록 제한하고, 요청의 방향과 유효 상태는 그대로 전달해야 합니다.'
  if(requirementId==='SWR-VMC-001')return '운전자의 페달 입력을 차량이 사용할 수 있는 토크 요청으로 바꾸고, 요청이 유효한지도 함께 알려야 합니다.'
  if(requirementId==='SWR-PTC-001')return '차량이 요구한 토크를 구동계가 실행할 수 있는 명령으로 전달해야 합니다.'
  return statement
}

export function ViewDStandards({selectedComponent,selectedSignal,selectedRequirementId,onSelectRequirement,onIdentifyExpectedBasis,onSaveAsEvidence,onOpenBenchWithTc,onOpenReqMap,currentFrame}:Props){
  const contextual=useMemo(()=>getRequirementsForComponent(selectedComponent),[selectedComponent])
  const requested=getRequirement(selectedRequirementId)
  const active=requested&&contextual.some(item=>item.id===requested.id)?requested:contextual.find(item=>item.level==='SOFTWARE')??contextual[0]
  const [saved,setSaved]=useState('')
  const [identified,setIdentified]=useState('')
  if(!active)return <section className="selection-required"><p className="investigation-section-label">관련 요구사항</p><h3><code className="investigation-tech-id">{selectedComponent}</code>에 할당된 요구사항이 없습니다.</h3><p>지원되지 않는 관계를 만들지 않고 현재 registry에 등록된 정보만 표시합니다.</p></section>
  const linked=getLinkedRequirements(active.id),tests=getTestsForRequirement(active.id)
  const system=active.level==='SYSTEM'?active:linked.find(item=>item.level==='SYSTEM')
  const outputs=getOutputSignals(selectedComponent)
  const signal=(selectedSignal&&getSignalDefinition(selectedSignal)?.producerIds.includes(selectedComponent)?getSignalDefinition(selectedSignal):undefined)??outputs.find(item=>item.readOracleExpected)??outputs[0]
  const comparison=currentFrame&&signal?compareSignalAtFrame(signal.id,selectedComponent,currentFrame):undefined
  const save=()=>{onSaveAsEvidence(active.id);setSaved(active.id)}
  return <div className="requirement-inspector">
    <header className="context-inspector-heading"><div><p className="investigation-section-label">정상 동작 기준 · REQUIREMENT</p><h3>{architectureNode(selectedComponent)?.label??selectedComponent}</h3><code className="investigation-tech-id">{active.id}</code></div>{contextual.length>1&&<select aria-label="관련 요구사항" value={active.id} onChange={event=>onSelectRequirement(event.target.value)}>{contextual.map(item=><option key={item.id} value={item.id}>{item.id}</option>)}</select>}</header>
    <section className="requirement-easy-meaning"><p className="investigation-section-label">PLAYER-FACING INTERPRETATION · 쉬운 의미</p><blockquote>{easyMeaning(active.id,active.statement)}</blockquote></section>
    <section className="requirement-source-statement"><p className="investigation-section-label">TECHNICAL / SOURCE REQUIREMENT · 원문</p><code>{active.id}</code><p>{active.statement}</p><small>{active.provenance}</small></section>
    <section className="requirement-pedigree" aria-label="요구사항 추적 계보"><p className="investigation-section-label">TRACE PEDIGREE</p><div><span>{system?<><b>SYSTEM</b><code>{system.id}</code></>:<><b>SYSTEM</b><em>연결 없음</em></>}</span><i>→</i><span><b>{active.level}</b><code>{active.id}</code></span><i>→</i><span><b>ALLOCATION</b><code>{active.allocatedComponent}</code></span><i>→</i><span><b>TEST CASE</b><code>{tests.map(test=>test.id).join(' · ')||'연결 없음'}</code></span></div>{onOpenReqMap&&<button type="button" className="report-text-button" onClick={onOpenReqMap}>전체 추적 구조 보기 →</button>}</section>
    <details className="requirement-runtime-comparison"><summary>현재 사건값과 이 기준 비교</summary><section className="requirement-current-conditions"><p className="investigation-section-label">현재 조건 · 이 기준이 적용되는가?</p><RequirementConditions id={active.id} frame={currentFrame} inline/></section>
    <div className="requirement-observation-comparison">
      <article><small>이 조건의 Expected</small><strong>{comparison?.criterionKind==='NONE'?'직접 수치 기준 없음':comparison?.criterionValue??'—'}</strong><code className="investigation-tech-id">{signal?.id??'—'}</code></article>
      <i aria-hidden="true">↔</i>
      <article><small>현재 관찰 · Actual</small><strong>{comparison?.actual??'—'}</strong><span className={comparison?.status?.toLowerCase()}>{comparison?.status==='MISMATCH'?'기준과 차이 있음':comparison?.status==='MATCH'?'기준과 일치':'판단 기준 확인 필요'}</span></article>
    </div>
    </details>
    <div className="requirement-primary-actions"><button type="button" onClick={()=>{onIdentifyExpectedBasis(active.id);setIdentified(active.id)}}>{identified===active.id?'✓ Expected 근거 확인됨':'Expected 근거로 확인'}</button><button type="button" className="primary" onClick={save}>기준을 조사 노트에 기록</button>{saved===active.id&&<small role="status">✓ 저장됨 · 보고서에는 아직 미포함</small>}</div>
    <details className="requirement-technical-details"><summary>Engineering detail</summary><div className="requirement-engineering-detail"><dl><div><dt>Requirement ID</dt><dd><code>{active.id}</code></dd></div><div><dt>Level / Status</dt><dd>{active.level} · {active.status}</dd></div><div><dt>Allocated to</dt><dd>{active.allocatedComponent}</dd></div><div><dt>Source</dt><dd>{active.provenance}</dd></div></dl>{system&&system.id!==active.id&&<p><b>상위 기준</b> · <code>{system.id}</code> {system.statement}</p>}<section><p className="investigation-section-label">연결된 시험</p>{tests.length?tests.map(tc=><div className="requirement-test-row" key={tc.id}><div><code className="investigation-tech-id">{tc.id}</code><span className={tc.execution.status==='EXECUTABLE'?'executable':'reference'}>{tc.execution.status}</span><p>{tc.precondition??'상세 조건 미등록'} → {tc.observation??'관찰 항목 미등록'}</p></div>{onOpenBenchWithTc&&<button type="button" onClick={()=>onOpenBenchWithTc(tc.id)}>검증 계획에서 보기 →</button>}</div>):<p>연결된 시험이 없습니다.</p>}</section></div></details>
  </div>
}
