import { useEffect, useState } from 'react'
import type { Evidence, RootCauseReport } from '../../../runtime/investigation/Evidence'
import type { Diagnosis, ExperimentRun } from '../../../runtime/case/PropulsionCase'
import type { CaseDefinition } from '../../../runtime/investigation/CaseDefinition'
import type { HypothesisModel } from '../presentation/InvestigationPresentationModel'
import { failureTypes } from '../../../runtime/investigation/CaseDefinition'
import { architectureNode, architectureNodes } from '../../../registries/investigation/Architecture'
import { ExperimentResults } from '../../screens/CaseExperimentPanel'

interface Props { definition:CaseDefinition; hypothesis:HypothesisModel|null; evidenceList:readonly Evidence[]; diagnosis:Diagnosis|null; repairs:readonly ExperimentRun[]; resolved:boolean; onSelectEvidenceForReport:(id:string,selected:boolean)=>void; onSubmitReport:(report:RootCauseReport)=>void; onRunRepair:(variant:0|2|3)=>void; onNavigateToDebrief?:()=>void; onStartGuidedReview:()=>void; onRetryInvestigation:()=>void }
const targets=['GearLogic','PropulsionFunction','VMC','eDrive','DriveAdapter','VehiclePhysics']
const failureCopy:Record<string,{title:string;description:string}>={LOGIC_CALCULATION:{title:'논리 / 계산',description:'계산식, 제한값 적용 또는 방향 처리 오류'},STATE_MODE:{title:'상태 / 모드',description:'상태 전이 또는 활성 조건 판단 오류'},INTERFACE_SIGNAL:{title:'인터페이스 / 신호',description:'기능 사이 신호 전달 또는 매핑 오류'},TIMING_EXECUTION:{title:'타이밍 / 실행',description:'호출 시점, 주기 또는 실행 누락 문제'},DATA_CALIBRATION:{title:'데이터 / Calibration',description:'보정 데이터 또는 기준값 설정 문제'},FAULT_HANDLING_MONITORING:{title:'감시 / 고장 처리',description:'진단 감시와 고장 반응 조건 문제'}}

export function Page4Conclusion({definition,hypothesis,evidenceList,diagnosis,repairs,resolved,onSelectEvidenceForReport,onSubmitReport,onRunRepair,onNavigateToDebrief,onStartGuidedReview,onRetryInvestigation}:Props){
  const [target,setTarget]=useState(hypothesis?.target&&targets.includes(hypothesis.target)?hypothesis.target:'')
  const [failureType,setFailureType]=useState(hypothesis?.type==='계산 / 로직 오류'?'LOGIC_CALCULATION':'')
  const [cause,setCause]=useState('')
  const [error,setError]=useState('')
  const [showRepair,setShowRepair]=useState(false)
  const [repair,setRepair]=useState<0|2|3>(0)
  useEffect(()=>{if(hypothesis?.target&&targets.includes(hypothesis.target))setTarget(hypothesis.target)},[hypothesis?.target])
  const selected=evidenceList.filter(item=>item.selectedForReport)
  const detailedUnlocked=evidenceList.some(item=>item.type==='SIGNAL_BOUNDARY'&&item.status==='MISMATCH')&&evidenceList.filter(item=>item.type==='TEST_RESULT'&&item.status==='MISMATCH').length>=2
  const failure=failureTypes.find(item=>item.id===failureType)
  const candidateNodes=architectureNodes.filter(node=>targets.includes(node.id))
  const submit=()=>{if(!target||!failureType||detailedUnlocked&&!cause||!selected.length){setError('원인 위치, 문제 유형, 확보한 근거를 확인하세요.');return}try{onSubmitReport({faultLocation:target,failureType,detailedCause:detailedUnlocked?cause:undefined,evidenceIds:selected.map(item=>item.id)});setError('')}catch(reason){setError(String(reason))}}

  if(diagnosis){const correct=diagnosis.correct;return <div className="investigation-main-content conclusion-result-page">
    <section className={`diagnosis-result-stamp ${correct?'correct':'wrong'}`}><small>{correct?'ROOT CAUSE CONFIRMED':'DIAGNOSIS MISMATCH'}</small><strong>{correct?'원인 확인 · 진단 성공':'진단 불일치 · 재조사 필요'}</strong></section>
    <div className="diagnosis-two-results"><section><p className="investigation-section-label">진단 정확성</p><b className={correct?'pass':'fail'}>{correct?'원인 위치 및 유형 일치':'제출한 원인과 실제 고장 불일치'}</b></section><section><p className="investigation-section-label">근거 충분성</p><b className={diagnosis.evidenceSufficient?'pass':'warn'}>{diagnosis.evidenceSufficient?'충분':'부족'}</b>{!diagnosis.evidenceSufficient&&diagnosis.assessment?.reasons.map(reason=><p key={reason}>{reason}</p>)}</section></div>
    <section className="diagnosis-submission-summary"><p className="investigation-section-label">제출 결론</p><dl><div><dt>원인 위치</dt><dd>{architectureNode(diagnosis.component)?.label??diagnosis.component}</dd></div><div><dt>문제 유형</dt><dd>{diagnosis.report?.failureType??diagnosis.mechanism}</dd></div><div><dt>핵심 근거</dt><dd>{selected.length}건</dd></div></dl>{correct&&<p>{definition.rootCause.explanation}</p>}</section>
    {correct?<section className="post-diagnosis-actions"><p>진단은 완료되었습니다. 사건을 종료하거나 선택적으로 수정안 회귀 검증을 진행할 수 있습니다.</p><div><button type="button" className="p1-cta-btn" onClick={onNavigateToDebrief}>사건 종료</button><button type="button" onClick={()=>setShowRepair(value=>!value)}>수정안 검증</button></div>{showRepair&&<div className="optional-repair"><p className="investigation-section-label">FAULT → REPAIR → REGRESSION</p><select value={repair} onChange={event=>setRepair(Number(event.target.value) as 0|2|3)}><option value={0}>비율 감소 제거 · 방향별 제한 유지</option><option value={2}>입력 요청 두 배 보상</option><option value={3}>출력 상한 제한 해제</option></select><button type="button" disabled={resolved} onClick={()=>onRunRepair(repair)}>{resolved?'회귀 검증 완료':'수정안 시험 실행'}</button>{repairs.map(run=><details key={run.id}><summary>회귀 시험 #{run.id} · {run.rows.every(row=>row.pass)?'PASS':'FAIL'}</summary><ExperimentResults run={run}/></details>)}</div>}</section>:<section className="wrong-answer-actions"><p>정답을 바로 공개하지 않습니다. 실제 조사 화면을 따라 해설을 보거나, 확보한 근거를 유지한 채 다시 조사할 수 있습니다.</p><div><button type="button" onClick={onStartGuidedReview}>조사 해설 보기</button><button type="button" className="p1-cta-btn" onClick={onRetryInvestigation}>다시 조사하기</button></div></section>}
  </div>}

  return <div className="investigation-main-content conclusion-page conclusion-redesign">
    <section className="investigation-page-heading"><p className="investigation-page-title">4 · 결론 제출</p><h2>어디에서 무엇이 잘못됐고, 어떤 근거가 이를 지지하는가?</h2><p className="investigation-prose">위치와 오류 유형을 고른 뒤, 그 판단을 직접 뒷받침하는 근거만 선택하세요.</p></section>
    <div className="conclusion-workspace">
      <div className="conclusion-decisions">
        <section className="conclusion-decision-card"><header><div><p className="investigation-section-label">1 · 원인 위치</p><h3>문제가 발생한 기능 선택</h3></div><span>하나 선택</span></header><div className="cause-location-tree cause-location-cards">{candidateNodes.map(node=><button type="button" key={node.id} aria-pressed={target===node.id} onClick={()=>setTarget(node.id)}><strong>{node.label}</strong><code>{node.id}</code><small>{node.role}</small></button>)}</div>{target&&<div className="selected-decision-detail"><small>선택한 위치</small><strong>{architectureNode(target)?.label??target}</strong><p>{architectureNode(target)?.role}</p></div>}</section>
        <section className="conclusion-decision-card"><header><div><p className="investigation-section-label">2 · 오류 유형</p><h3>근거가 설명하는 문제 선택</h3></div><span>하나 선택</span></header><div className="conclusion-failure-types">{failureTypes.map(item=>{const copy=failureCopy[item.id];return <button type="button" key={item.id} aria-pressed={failureType===item.id} onClick={()=>{setFailureType(item.id);setCause('')}}><strong>{copy?.title??item.label}</strong><small>{copy?.description}</small></button>})}</div>{detailedUnlocked&&failure&&<fieldset className="detailed-cause-options"><legend>반복 시험으로 확인 가능한 세부 원인</legend>{failure.causes.map(item=><label key={item.id}><input type="radio" name="cause" checked={cause===item.id} onChange={()=>setCause(item.id)}/><span>{item.label}</span></label>)}</fieldset>}</section>
      </div>
      <aside className="conclusion-evidence-column">
        <section className="conclusion-evidence-card"><header><div><p className="investigation-section-label">3 · 판단 근거</p><h3>결론에 포함할 근거 선택</h3></div><span>{selected.length}건 선택</span></header><p>체크한 항목만 최종 분석 보고서에 포함됩니다.</p><div className="compact-evidence-list">{evidenceList.length?evidenceList.map(item=><label key={item.id}><input type="checkbox" checked={item.selectedForReport} onChange={event=>onSelectEvidenceForReport(item.id,event.target.checked)}/><span><b>{item.type==='SIGNAL_BOUNDARY'?'신호 / 경계 비교':item.type==='REQUIREMENT'?'요구사항 기준':item.type==='TEST_RESULT'?'재현 시험':item.type==='INCIDENT_FRAME'?'사건 시점 기록':item.type}</b><code>{item.title}</code><small>{item.status==='MISMATCH'?'Expected와 차이 확인':item.status==='MATCH'?'비교 결과 일치':item.status==='REFERENCE'?'판정 기준 자료':'관찰 기록'} · {item.relatedComponent}</small></span></label>):<p className="conclusion-empty-evidence">아직 저장한 근거가 없습니다. Page 2의 비교 결과 또는 Page 3의 시험 결과에서 ‘근거에 추가’를 선택하세요.</p>}</div></section>
        <section className="conclusion-submit"><div><p className="investigation-section-label">4 · 제출 요약</p><dl><div><dt>원인 위치</dt><dd>{target?(architectureNode(target)?.label??target):'미선택'}</dd></div><div><dt>오류 유형</dt><dd>{failureType?(failureCopy[failureType]?.title??failure?.label):'미선택'}</dd></div><div><dt>선택 근거</dt><dd>{selected.length}건</dd></div></dl></div>{error&&<p role="alert">{error}</p>}<button type="button" className="submit-cta-btn" disabled={!target||!failureType||!selected.length||detailedUnlocked&&!cause} onClick={submit}>최종 분석 제출 →</button></section>
      </aside>
    </div>
  </div>
}
