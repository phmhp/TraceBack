import { useMemo } from 'react'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import { architectureNode, getIncomingInterfaces, getInputSignals, getOutgoingInterfaces, getOutputSignals, normalFunctionFlows } from '../../../../registries/investigation/Architecture'
import { getRequirementsForComponent } from '../../../../registries/investigation/Trace'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'
import {
  getReferenceFocus,
  getReferenceFunctionContextForComponent,
  getReferenceInterfaceContext,
  getReferenceStatus,
} from '../../referenceVehicle/ReferenceVehicleUIAdapter.ts'

interface Props { model:InvestigationPresentationModel; selectedComponent:string; selectedSignal:string; hasMismatchEvidence?:boolean; currentFrame:IncidentFrame|undefined; previousFrame:IncidentFrame|undefined; onSelectSignal:(id:string)=>void; onCompareSignal:(id:string)=>void; onSaveAsEvidence:(id:string)=>void; onOpenSignalTimeline:(id:string)=>void; onOpenInterface:(id:string)=>void; onOpenRequirement:(id:string)=>void; onSetHypothesisTarget:(id:string)=>void }

const unique=(items:string[])=>[...new Set(items)]

export function FunctionInspector({model,selectedComponent,selectedSignal,hasMismatchEvidence=false,onOpenSignalTimeline,onOpenInterface,onOpenRequirement,onSetHypothesisTarget}:Props){
  const node=selectedComponent?architectureNode(selectedComponent):undefined
  const reference=useMemo(()=>getReferenceFunctionContextForComponent(selectedComponent),[selectedComponent])
  const inputs=useMemo(()=>node?getInputSignals(node.id):[],[node])
  const outputs=useMemo(()=>node?getOutputSignals(node.id):[],[node])
  const requirements=useMemo(()=>node?getRequirementsForComponent(node.id):[],[node])
  const incoming=useMemo(()=>node?getIncomingInterfaces(node.id):[],[node])
  const outgoing=useMemo(()=>node?getOutgoingInterfaces(node.id):[],[node])
  if(!node&&!reference)return <section className="context-inspector-empty"><p className="investigation-section-label">전체 구조</p><h3>운전자 요청부터 차량 반응까지</h3><p>전체 차량 맥락은 유지한 채 CASE 경로를 따라가세요. 기능을 선택하면 입력·처리·출력과 연결 경계가 이 Inspector에 이어집니다.</p></section>

  const referenceInterfaces=reference?.interfaces??[]
  const referenceNeighbors=referenceInterfaces.map(item=>getReferenceInterfaceContext(item.id)).filter(Boolean)
  const referenceUpstream=unique(referenceNeighbors.flatMap(context=>context!.producers.map(entity=>entity.id)).filter(id=>id!==reference?.entity.id))
  const referenceDownstream=unique(referenceNeighbors.flatMap(context=>context!.consumers.map(entity=>entity.id)).filter(id=>id!==reference?.entity.id))
  const upstream=node?incoming.map(edge=>architectureNode(edge.sourceId)?.label??edge.sourceId):referenceUpstream
  const downstream=node?outgoing.map(edge=>architectureNode(edge.targetId)?.label??edge.targetId):referenceDownstream
  const focusSignal=selectedSignal||outputs[0]?.id||inputs[0]?.id||reference?.outputs[0]?.id||reference?.inputs[0]?.id
  const mismatch=node?(model.getNodeStatus(node.id)==='DIFFERENCE_FOUND'||hasMismatchEvidence):false
  const displayName=node?.label??reference?.entity.name??selectedComponent
  const role=node?.role??reference?.entity.description??'Canonical 설명이 등록되지 않았습니다.'
  const area=node?.area??reference?.area?.name??reference?.area?.id??'영역 미등록'
  const status=reference?getReferenceStatus(reference.entity):undefined
  const focus=reference?getReferenceFocus(reference.entity):undefined
  const inputItems=node?inputs.map(signal=>({id:signal.id,label:signal.description??signal.id})):reference?.inputs.map(signal=>({id:signal.id,label:signal.description||signal.name||signal.id}))??[]
  const outputItems=node?outputs.map(signal=>({id:signal.id,label:signal.description??signal.id})):reference?.outputs.map(signal=>({id:signal.id,label:signal.description||signal.name||signal.id}))??[]
  const interfaceItems=node?[...incoming,...outgoing].map(edge=>({id:edge.id,label:`${edge.sourceId} → ${edge.targetId}`})):referenceInterfaces.map(entity=>({id:entity.id,label:entity.name||entity.id}))
  const requirementItems=node?requirements.map(item=>({id:item.id,label:item.level})):reference?.requirements.map(entity=>({id:entity.id,label:entity.approvalStatus??'상태 미등록'}))??[]
  const firstInterface=interfaceItems[0]
  const firstRequirement=requirementItems[0]
  const processing=node?(normalFunctionFlows[node.id]??[role]):[role]

  return <section className="function-context-inspector" aria-labelledby="function-inspector-title">
    <header className="context-inspector-heading"><div><p className="investigation-section-label">FUNCTION INSPECTOR · {focus??'CURRENT RUNTIME'}</p><h3 id="function-inspector-title">{displayName}</h3><span className="reference-id-explainer" title="Reference Vehicle 문서에서 이 논리 기능을 추적하기 위한 고유 식별자입니다."><b>{reference?'Reference 논리 기능 ID':'현재 실행 기능 ID'}</b><code className="investigation-tech-id">{reference?.entity.id??node?.id}</code></span></div><div className="function-context-status">{status&&<><span>{status.capability}</span><span>{status.scope}</span></>}<span className={`node-investigation-status ${mismatch?'difference_found':'unexplored'}`}>{mismatch?'차이 발견':reference?.caseRelevant?'CASE 관련':'구조 확인'}</span></div></header>
    <section className="function-responsibility-card"><div><span>차량 안의 위치</span><strong>{area}</strong></div><p>{role}</p><dl><div><dt>앞에서 들어오는 것</dt><dd>{upstream.length?upstream.join(' · '):'운전자·환경 또는 공통 차량 상태'}</dd></div><div><dt>뒤로 전달하는 것</dt><dd>{downstream.length?downstream.join(' · '):'차량 반응 또는 다음 기능 경계'}</dd></div></dl>{reference&&<small className="reference-provenance">Canonical source · {reference.entity.source.path}</small>}</section>
    <section className="inspector-logic-flow" aria-label={`${displayName} 기능 흐름`}><div><small>입력</small>{inputItems.length?inputItems.map(item=><button type="button" key={item.id} onClick={()=>onOpenSignalTimeline(item.id)}><code>{item.id}</code><span>{item.label}</span></button>):<strong>등록된 입력 없음</strong>}</div><i>→</i><div className="processing"><small>기능 책임</small>{processing.map(step=><span key={step}>{step}</span>)}</div><i>→</i><div><small>출력</small>{outputItems.length?outputItems.map(item=><button type="button" key={item.id} onClick={()=>onOpenSignalTimeline(item.id)}><code>{item.id}</code><span>{item.label}</span></button>):<strong>등록된 출력 없음</strong>}</div></section>
    <div className="context-inspector-actions"><button type="button" disabled={!focusSignal} onClick={()=>focusSignal&&onOpenSignalTimeline(focusSignal)}>연관 신호 보기</button>{firstInterface&&<button type="button" onClick={()=>onOpenInterface(firstInterface.id)}>인터페이스 보기</button>}{firstRequirement&&<button type="button" onClick={()=>onOpenRequirement(firstRequirement.id)}>요구사항 보기</button>}{mismatch&&node&&<button type="button" className="primary" onClick={()=>onSetHypothesisTarget(node.id)}>이 기능으로 가설 만들기 →</button>}</div>
  </section>
}
