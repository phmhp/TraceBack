import { useEffect, useMemo, useState } from 'react'
import { propulsionRequirements, propulsionTests } from '../../data/ground-truth/PropulsionGroundTruth'
import { traceRequirements, benchTarget } from '../../registries/investigation/Trace'
import { architectureNode } from '../../registries/investigation/Architecture'
import { useCase } from '../state/CaseContext'
import { RequirementMap } from '../xray/RequirementMap'
import { CaseRequirementReference } from '../screens/CaseRequirementReference'

const swComponents = ['GearLogic','PropulsionFunction','VMC','eDrive']

export function TestCard({id}:{id:string}) {
  const tc=propulsionTests.find(t=>t.id===id)
  return <article className="test-card"><small>시험 기준 · TC</small><h3><code>{id}</code></h3>{tc?<dl>{[['전제 조건',tc.precondition],['시험 입력',tc.stimulus],['관측 신호',tc.observation],['기대 결과',tc.expectedResult]].map(([label,value])=><div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl>:<p>현재 화면에서 실행 가능한 상세 시험 정의가 없습니다.</p>}</article>
}

export function RequirementsExplorer({component,tcId:_tcId,initialRequirement,onTc,onBench,onComponent}:{component:string;tcId:string;initialRequirement?:string;onComponent?:(id:string)=>void;onTc:(id:string)=>void;onBench:(id:string)=>void}) {
  const {controller,state}=useCase()
  const validComponent=swComponents.includes(component)?component:'PropulsionFunction'
  const [reqId,setReqId]=useState(initialRequirement||propulsionRequirements.find(r=>r.allocatedComponent===validComponent)?.id||'SYSR-PROP-001')
  const [showAll,setShowAll]=useState(false)
  useEffect(()=>{if(initialRequirement)setReqId(initialRequirement)},[initialRequirement])
  useEffect(()=>{if(!showAll){const first=propulsionRequirements.find(r=>r.allocatedComponent===validComponent);if(first)setReqId(first.id)}},[validComponent,showAll])
  const selected=propulsionRequirements.find(r=>r.id===reqId)??propulsionRequirements[0]!
  const relatedTests=useMemo(()=>[...new Set(selected.linkedTestCases)], [selected])
  const selectReq=(id:string)=>{const req=propulsionRequirements.find(r=>r.id===id);if(!req)return;setReqId(id);controller.discoverReference('REQUIREMENT',id,req.allocatedComponent,[id],req.linkedTestCases)}
  const selectTc=(id:string)=>{onTc(id);const refs=traceRequirements(id);controller.discoverReference('TEST_CASE',id,refs.find(r=>r.level==='SOFTWARE')?.allocatedComponent??validComponent,refs.map(r=>r.id),[id])}
  return <section className="requirements-workspace">
    <aside className="requirement-component-tabs" aria-label="대상 SW 구성요소">
      <small>1 · 대상 SW 구성요소</small><h3>조사 기능</h3>
      {swComponents.map(id=><button key={id} aria-pressed={validComponent===id} onClick={()=>onComponent?.(id)}><b>{architectureNode(id).label}</b><span>{id==='PropulsionFunction'?'추진 요청 생성':id==='VMC'?'토크 계산':id==='eDrive'?'토크 제한':'기어 상태 결정'}</span></button>)}
      <button className="scope-toggle" aria-pressed={showAll} onClick={()=>setShowAll(value=>!value)}>{showAll?'전체 요구사항을 보는 중':'선택 기능 기준 보기'}</button>
    </aside>
    <section className="requirement-map-column">
      <header><div><small>2 · 요구사항 계층 구조</small><h3>{architectureNode(validComponent).label} 관련 trace</h3></div><button className="text-action" onClick={()=>setShowAll(value=>!value)}>{showAll?'선택 기능만 보기':'전체 구조 보기'} →</button></header>
      <div className="requirement-breadcrumb"><code>Vehicle</code><span>›</span><code>{architectureNode(validComponent).area}</code><span>›</span><code>{selected.id}</code></div>
      <div className="requirement-map-frame"><RequirementMap key={`${validComponent}:${showAll}`} componentFilter={showAll?undefined:validComponent} embedded onComponent={id=>onComponent?.(id)} initialRequirement={reqId} onRequirement={selectReq} onTest={id=>selectTc(id)}/></div>
    </section>
    <aside className="requirement-detail-panel">
      <small>3 · 요구사항 상세</small><CaseRequirementReference id={reqId} onSelect={selectReq} onOpenMap={()=>undefined} frame={state.frames[state.selected]}/>
      <section className="requirement-linked-tests"><h3>연결된 시험</h3>{relatedTests.length?relatedTests.map(id=><button key={id} onClick={()=>selectTc(id)}><code>{id}</code><span>{benchTarget(id)?'시험 기준 선택':'문서 참조'}</span></button>):<p>연결된 시험이 없습니다.</p>}</section>
      <button className="primary navigation-action" disabled={!relatedTests.some(benchTarget)} onClick={()=>{const id=relatedTests.find(benchTarget);if(id)onBench(id)}}>재현 시험 바로가기 →</button>
    </aside>
  </section>
}
