import { useState } from 'react'
import type { Evidence, RootCauseReport } from '../../../runtime/investigation/Evidence'
import type { Diagnosis, ExperimentRun, IncidentFrame } from '../../../runtime/case/PropulsionCase'
import type { CaseDefinition } from '../../../runtime/investigation/CaseDefinition'
import type { HypothesisModel } from '../presentation/InvestigationPresentationModel'
import { failureTypes } from '../../../runtime/investigation/CaseDefinition'
import { architectureNode, architectureNodes } from '../../../registries/investigation/Architecture'
import { ExperimentResults } from '../../screens/CaseExperimentPanel'
import { formatInvestigationTime } from '../../../runtime/investigation/InvestigationChallenge'

interface Props {
  definition:CaseDefinition
  hypothesis:HypothesisModel|null
  evidenceList:readonly Evidence[]
  frames:readonly IncidentFrame[]
  experiments:readonly ExperimentRun[]
  diagnosis:Diagnosis|null
  repairs:readonly ExperimentRun[]
  resolved:boolean
  onSelectEvidenceForReport:(id:string,selected:boolean)=>void
  onSubmitReport:(report:RootCauseReport)=>void
  onRunRepair:(variant:0|2|3)=>void
  onStartRecovery?:()=>void
  onStartGuidedReview:()=>void
  onRetryInvestigation:()=>void
  onNavigateToActiveClue:()=>void
  guidedReviewAvailable:boolean
  remainingInvestigationSeconds:number
  rootCauseUnlocked:boolean
  reportEvidenceIds:readonly string[]
}

const targets=['GearLogic','PropulsionFunction','VMC','eDrive','DriveAdapter','VehiclePhysics']
const failureCopy:Record<string,{title:string;description:string}>={
  LOGIC_CALCULATION:{title:'계산 방식 문제',description:'계산식, 제한값 또는 방향 처리가 잘못됨'},
  STATE_MODE:{title:'상태 전환 문제',description:'상태가 바뀌는 조건이나 활성 판단이 잘못됨'},
  INTERFACE_SIGNAL:{title:'신호 전달 문제',description:'기능 사이 값 전달이나 연결이 잘못됨'},
  TIMING_EXECUTION:{title:'실행 시점 문제',description:'호출 시점, 주기 또는 실행 순서가 잘못됨'},
  DATA_CALIBRATION:{title:'설정값 문제',description:'보정 데이터나 기준값이 잘못 설정됨'},
  FAULT_HANDLING_MONITORING:{title:'고장 감시 문제',description:'고장을 알아채거나 대응하는 조건이 잘못됨'},
}

export function Page4Conclusion({definition,hypothesis,diagnosis,repairs,resolved,onSubmitReport,onRunRepair,onStartRecovery,onStartGuidedReview,onRetryInvestigation,onNavigateToActiveClue,guidedReviewAvailable,remainingInvestigationSeconds,rootCauseUnlocked,reportEvidenceIds}:Props){
  const [target,setTarget]=useState('')
  const [failureType,setFailureType]=useState('')
  const [cause,setCause]=useState('')
  const [error,setError]=useState('')
  const [repair,setRepair]=useState<0|2|3>(0)
  const failure=failureTypes.find(item=>item.id===failureType)
  const nodes=architectureNodes.filter(node=>targets.includes(node.id))
  const step=!target?1:!failureType?2:3

  const submit=()=>{
    if(!rootCauseUnlocked){setError('현상·경계·증명 단서를 먼저 확보하세요.');return}
    if(!target||!failureType){setError('원인 위치와 문제 유형을 골라주세요.');return}
    try{
      onSubmitReport({faultLocation:target,failureType,detailedCause:cause||undefined,evidenceIds:[...reportEvidenceIds]})
      setError('')
    }catch(reason){setError(String(reason))}
  }

  if(diagnosis){
    const solved=diagnosis.correct&&diagnosis.evidenceSufficient
    const latest=repairs.at(-1)
    const repairPassed=Boolean(latest?.rows.every(row=>row.pass))
    return <div className="investigation-main-content conclusion-result-page">
      <section className={`diagnosis-result-stamp ${solved?'correct':'wrong'}`}><small>{solved?'CASE SOLVED':'RECHECK'}</small><strong>{solved?'진단 완료':'확인할 지점이 남았습니다'}</strong></section>
      <section className="diagnosis-submission-summary"><p className="investigation-section-label">제출 결론</p><dl><div><dt>원인 위치</dt><dd>{architectureNode(diagnosis.component)?.label??diagnosis.component}</dd></div><div><dt>문제 유형</dt><dd>{failureCopy[diagnosis.report?.failureType??'']?.title??diagnosis.mechanism}</dd></div><div><dt>근거</dt><dd>{diagnosis.evidenceSufficient?'충분함':'더 필요함'}</dd></div></dl>{solved&&<p>{definition.rootCause.explanation}</p>}</section>
      {solved?<section className="post-diagnosis-actions repair-decision"><p className="investigation-section-label">수리 · 같은 조건에서 다시 확인</p><h3>근거가 가리키는 수정안을 골라 실제 C 계산을 다시 실행하세요.</h3><div className="optional-repair"><select value={repair} disabled={resolved} onChange={event=>setRepair(Number(event.target.value) as 0|2|3)}><option value={0}>비율 감소 제거 · 방향별 제한 유지</option><option value={2}>입력 요청 두 배 보상</option><option value={3}>출력 상한 제한 해제</option></select><button type="button" disabled={resolved} onClick={()=>onRunRepair(repair)}>{resolved?'수리 검증 PASS':'수정안 적용 · 회귀시험 실행'}</button>{latest&&<div className={`repair-verdict ${repairPassed?'pass':'fail'}`}><strong>{repairPassed?'PASS · 정상 동작 복구':'FAIL · 이 수정안으로는 복구되지 않음'}</strong><span>{latest.rows.filter(row=>row.pass).length} / {latest.rows.length} 검증 항목 통과</span></div>}{repairs.map(run=><details key={run.id} className="technical-detail-drawer"><summary>회귀 시험 #{run.id} · {run.rows.every(row=>row.pass)?'PASS':'FAIL'} 상세</summary><ExperimentResults run={run}/></details>)}</div>{resolved&&<button type="button" className="p1-cta-btn recovery-start-button" onClick={onStartRecovery}>회복 주행 시작 →</button>}</section>
      :<section className="wrong-answer-actions"><p>{diagnosis.correct?'원인 선택은 맞지만 결론을 지지할 검증 근거가 더 필요합니다.':'조사 흐름을 다시 보고 근거를 보강해보세요.'}</p><div><button type="button" className="p1-cta-btn" onClick={onRetryInvestigation}>다시 조사하기</button>{guidedReviewAvailable&&<button type="button" onClick={onStartGuidedReview}>포기하고 해설 보기</button>}</div></section>}
    </div>
  }

  const chooseLocked=()=>setError('아직 실제 근거가 부족합니다. 현재 단서의 저장 근거를 먼저 확보하세요.')
  return <div className={`investigation-main-content conclusion-page conclusion-redesign ${rootCauseUnlocked?'root-cause-unlocked':'root-cause-locked'}`}>
    <section className="investigation-page-heading"><p className="investigation-page-title">4 · 결론 제출</p><h2>{rootCauseUnlocked?'한 단계씩 최종 원인을 정리하세요.':'현상·경계·증명 단서를 확보하면 결론을 제출할 수 있습니다.'}</h2>{hypothesis&&<p className="conclusion-hypothesis-inline"><b>현재 가설</b> · {architectureNode(hypothesis.target)?.label??hypothesis.target} — {hypothesis.prediction}</p>}</section>
    <nav className="conclusion-stepper" aria-label="결론 제출 단계"><span className={step===1?'current':step>1?'done':''}>1 원인 위치</span><span className={step===2?'current':step>2?'done':''}>2 문제 유형</span><span className={step===3?'current':''}>3 근거 확인</span></nav>
    {!rootCauseUnlocked&&<section className="root-cause-lock-message"><span>🔒 세 단서의 실제 저장 근거가 모두 필요합니다.</span><button type="button" onClick={onNavigateToActiveClue}>현재 단서 찾으러 가기 →</button></section>}
    <div className="conclusion-workspace progressive-conclusion">
      <div className="conclusion-decisions">
        <section className={`conclusion-decision-card ${step===1?'active-step':'completed-step'}`}><header><div><p className="investigation-section-label">1 · 원인 위치</p><h3>차이가 처음 시작된 기능은?</h3></div></header><div className="cause-location-tree cause-location-cards">{nodes.map(node=><button type="button" key={node.id} aria-disabled={!rootCauseUnlocked} aria-pressed={target===node.id} onClick={()=>rootCauseUnlocked?(setTarget(node.id),setFailureType(''),setCause('')):chooseLocked()}><strong>{node.label}</strong><small>{node.role}</small></button>)}</div></section>
        {target&&<section className={`conclusion-decision-card ${step===2?'active-step':'completed-step'}`}><header><div><p className="investigation-section-label">2 · 문제 유형</p><h3>{architectureNode(target)?.label??target}에서 무엇이 잘못됐나요?</h3></div></header><div className="conclusion-failure-types">{failureTypes.map(item=>{const copy=failureCopy[item.id];return <button type="button" key={item.id} aria-pressed={failureType===item.id} onClick={()=>{setFailureType(item.id);setCause('')}}><strong>{copy?.title??item.label}</strong><small>{copy?.description}</small></button>})}</div>{failure&&<details className="detailed-cause-options technical-detail-drawer"><summary>세부 원인까지 선택하기 (선택)</summary>{failure.causes.map(item=><label key={item.id}><input type="radio" name="cause" checked={cause===item.id} onChange={()=>setCause(item.id)}/><span>{item.label}</span></label>)}</details>}</section>}
      </div>
      {failureType&&<aside className="conclusion-submit evidence-first-submit"><div><p className="investigation-section-label">3 · 근거 확인</p><dl><div><dt>원인 위치</dt><dd>{architectureNode(target)?.label??target}</dd></div><div><dt>문제 유형</dt><dd>{failureCopy[failureType]?.title??failure?.label}</dd></div><div><dt>연결된 조사 기록</dt><dd>{reportEvidenceIds.length}건</dd></div></dl></div>{error&&<p role="alert">{error}</p>}<button type="button" className="submit-cta-btn" disabled={!rootCauseUnlocked} onClick={submit}>결론 제출 →</button>{guidedReviewAvailable?<button type="button" className="give-up-button" onClick={onStartGuidedReview}>포기하고 해설 보기</button>:<small className="guided-review-locked">해설은 조사 시간 종료 후 열립니다 · {formatInvestigationTime(remainingInvestigationSeconds)}</small>}<button type="button" className="report-text-button" onClick={onRetryInvestigation}>추가 검증으로 돌아가기</button></aside>}
    </div>
  </div>
}
