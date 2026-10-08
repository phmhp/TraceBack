import { useNavigation } from '../state/navigation'
import { useCase } from '../state/CaseContext'
import { useRecoveryHud } from '../state/recoveryHud'
import { useSimulationRuntime } from '../state/SimulationRuntimeContext'

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toFixed(1).padStart(4, '0')}`
}

export function DebriefScreen() {
  const {controller,state}=useCase()
  const diagnosis=state.diagnosis,verified=state.repairs.at(-1)
  const reset = useNavigation((state) => state.reset)
  const retryRecovery=useNavigation(state=>state.retryRecovery)
  const recovery=useRecoveryHud()
  const {runtime}=useSimulationRuntime()
  const finishTime=recovery.finishTimeSeconds??recovery.elapsedSeconds
  // G1 records completion only. Tier thresholds remain mission-configurable and are intentionally unset until playtesting.
  const medal=recovery.finishTimeSeconds?'COMPLETE':'—'
  return <section className="report-screen"><article className="verification-report">
    <header><div><small>TRACKBACK · SESSION EVIDENCE</small><h1 tabIndex={-1}>주행 및 검증 결과 보고서</h1></div><span className="report-stamp">SESSION<br/>COMPLETE</span></header>
    <div className="mission-result-hero"><span className="result-cat" aria-hidden="true">🐱🎉</span><div><small>RECOVERY MISSION RESULT</small><h2>{recovery.isNewBest?'NEW PERSONAL BEST!':'BACK ON TRACK!'}</h2><strong>{formatTime(finishTime)}</strong></div><b className="driving-medal">{medal}</b></div>
    <div className="report-meta"><p><b>MAP</b>Pangyo 2nd Techno Valley</p><p><b>RECOVERY TIME</b>{formatTime(finishTime)}</p><p><b>PERSONAL BEST</b>{recovery.personalBestSeconds?formatTime(recovery.personalBestSeconds):'—'}</p><p><b>CHECKPOINTS</b>{recovery.checkpointIndex}/{recovery.checkpointCount}</p></div>
    <section><h2>SESSION RESULT</h2><p>선택된 주행 경로를 완주했습니다. 완주 시점에 Race Clock이 고정되었으며 차량은 제어된 감속 절차를 수행했습니다.</p></section>
    <section><h2>DIAGNOSTIC ACHIEVEMENT</h2><dl><div><dt>Incident</dt><dd>{controller.definition.id} · {state.frames.length?'CAPTURED':'NOT CAPTURED'}</dd></div><div><dt>Case Status</dt><dd>{state.phase==='RESOLVED'?'RESOLVED':'UNRESOLVED'}</dd></div><div><dt>Root Cause</dt><dd>{diagnosis?`${diagnosis.component} · ${diagnosis.mechanism} · 판단 ${diagnosis.correct?'일치':'불일치'}`:'미제출'}</dd></div><div><dt>Solve Path</dt><dd>{state.assisted?'ASSISTED':'INDEPENDENT'}</dd></div><div><dt>Evidence</dt><dd>{diagnosis?`${diagnosis.report?.evidenceIds.length??0}개 선택 · 충분성 ${diagnosis.evidenceSufficient?'충족':'미충족'}`:'평가 전'}</dd></div><div><dt>Repair Verification</dt><dd>{verified?`${verified.rows.filter(r=>r.pass).length}/${verified.rows.length} PASS`:'미실행'}</dd></div></dl></section><section><h2>DRIVING ACHIEVEMENT</h2><dl><div><dt>Valid Finish</dt><dd>{recovery.status==='FINISHED'?'YES':'NO'}</dd></div><div><dt>Checkpoints</dt><dd>{recovery.checkpointIndex}/{recovery.checkpointCount}</dd></div><div><dt>Finish Time</dt><dd>{formatTime(finishTime)}</dd></div><div><dt>Record</dt><dd>{recovery.isNewBest?'NEW PERSONAL BEST':recovery.personalBestSeconds?'COMPLETED':'NO RECORD'}</dd></div></dl></section>
    <section><h2>VERIFICATION VERDICT</h2><div className="report-verdict">{verified?(verified.rows.every(r=>r.pass)?'PASS':'FAIL'):'NOT EXECUTED'}</div><p>원인 판단·근거 충분성·수정 검증을 각각 기록합니다. 완주선 통과와 사건 해결은 별도로 평가합니다.</p></section>
    <footer><span>진단 성취와 주행 성취는 별도로 기록됩니다.</span><div><button type="button" onClick={()=>{runtime.retryRecoveryChallenge();retryRecovery()}}>회복 타임어택 다시 도전</button><button type="button" onClick={reset}>메인으로 →</button></div></footer>
  </article></section>
}
