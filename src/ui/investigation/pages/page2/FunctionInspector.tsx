import { useMemo } from 'react'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import { architectureNode, getIncomingInterfaces, getInputSignals, getOutgoingInterfaces, getOutputSignals, normalFunctionFlows } from '../../../../registries/investigation/Architecture'
import { getRequirementsForComponent } from '../../../../registries/investigation/Trace'
import type { InvestigationPresentationModel } from '../../presentation/InvestigationPresentationModel'

interface Props { model:InvestigationPresentationModel; selectedComponent:string; selectedSignal:string; currentFrame:IncidentFrame|undefined; previousFrame:IncidentFrame|undefined; onSelectSignal:(id:string)=>void; onCompareSignal:(id:string)=>void; onSaveAsEvidence:(id:string)=>void; onOpenSignalTimeline:(id:string)=>void; onOpenInterface:(id:string)=>void; onOpenRequirement:(id:string)=>void; onSetHypothesisTarget:(id:string)=>void }

export function FunctionInspector({model,selectedComponent,selectedSignal,onOpenSignalTimeline,onOpenInterface,onOpenRequirement,onSetHypothesisTarget}:Props){
  const node=selectedComponent?architectureNode(selectedComponent):undefined
  const inputs=useMemo(()=>node?getInputSignals(node.id):[],[node])
  const outputs=useMemo(()=>node?getOutputSignals(node.id):[],[node])
  const requirements=useMemo(()=>node?getRequirementsForComponent(node.id):[],[node])
  const incoming=useMemo(()=>node?getIncomingInterfaces(node.id):[],[node])
  const outgoing=useMemo(()=>node?getOutgoingInterfaces(node.id):[],[node])
  if(!node)return <section className="context-inspector-empty"><p className="investigation-section-label">전체 구조</p><h3>운전자 요청부터 차량 반응까지</h3><p>운전자의 입력은 기어와 추진 요청으로 변환되고, 구동계와 차량 물리를 거쳐 실제 반응으로 이어집니다. 이상 반응에서 위쪽으로 하나씩 선택해 흐름을 확인하세요.</p></section>
  const upstream=incoming.map(edge=>architectureNode(edge.sourceId)?.label??edge.sourceId)
  const downstream=outgoing.map(edge=>architectureNode(edge.targetId)?.label??edge.targetId)
  const focusSignal=selectedSignal||outputs[0]?.id||inputs[0]?.id
  const mismatch=model.getNodeStatus(node.id)==='DIFFERENCE_FOUND'
  return <section className="function-context-inspector" aria-labelledby="function-inspector-title">
    <header className="context-inspector-heading"><div><p className="investigation-section-label">선택한 기능</p><h3 id="function-inspector-title">{node.label}</h3><code className="investigation-tech-id">{node.id}</code></div><span className={`node-investigation-status ${mismatch?'difference_found':'unexplored'}`}>{mismatch?'차이 발견':'구조 확인'}</span></header>
    <section className="function-responsibility-card"><div><span>기능 영역</span><strong>{node.area}</strong></div><p>{node.role}</p><dl><div><dt>위쪽에서 받는 것</dt><dd>{upstream.length?`${upstream.join(' · ')}에서 처리할 요청과 조건을 받습니다.`:'운전자 또는 차량 환경에서 조건을 받습니다.'}</dd></div><div><dt>아래로 넘기는 것</dt><dd>{downstream.length?`처리한 결과를 ${downstream.join(' · ')}으로 넘깁니다.`:'최종 차량 반응으로 연결됩니다.'}</dd></div></dl></section>
    <section className="inspector-logic-flow" aria-label={`${node.label} 기능 흐름`}><div><small>입력</small><strong>{inputs.map(s=>s.description??s.id).join(' · ')||'외부 조건'}</strong></div><i>→</i><div className="processing"><small>처리</small>{(normalFunctionFlows[node.id]??[node.role]).map(step=><span key={step}>{step}</span>)}</div><i>→</i><div><small>출력</small><strong>{outputs.map(s=>s.description??s.id).join(' · ')||'차량 반응'}</strong></div></section>
    <div className="context-inspector-actions"><button type="button" disabled={!focusSignal} onClick={()=>focusSignal&&onOpenSignalTimeline(focusSignal)}>연관 신호 보기</button>{incoming[0]||outgoing[0]?<button type="button" onClick={()=>onOpenInterface((incoming[0]??outgoing[0])!.id)}>인터페이스 보기</button>:null}{requirements[0]&&<button type="button" onClick={()=>onOpenRequirement(requirements[0]!.id)}>요구사항 보기</button>}{mismatch&&<button type="button" className="primary" onClick={()=>onSetHypothesisTarget(node.id)}>이 기능으로 가설 만들기 →</button>}</div>
  </section>
}
