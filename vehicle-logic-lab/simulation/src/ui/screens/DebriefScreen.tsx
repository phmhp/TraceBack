import { useNavigation } from '../state/navigation'
import { useCase } from '../state/CaseContext'
import { useRecoveryHud } from '../state/recoveryHud'
import { useSimulationRuntime } from '../state/SimulationRuntimeContext'
import { useIncidentRace } from '../state/incidentRace.ts'

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
  const incident=useIncidentRace()
  const cleanRematch=recovery.runMode==='CLEAN_REMATCH'
  const drivingTime=cleanRematch?finishTime:incident.incidentStartRaceSeconds+finishTime
  const totalRaceTime=cleanRematch?finishTime:drivingTime+incident.incidentTimeLossSeconds
  // G1 records completion only. Tier thresholds remain mission-configurable and are intentionally unset until playtesting.
  const medal=recovery.finishTimeSeconds?'COMPLETE':'—'
  return <section className="report-screen"><article className="verification-report">
    <header><div><small>TRACKBACK · SESSION EVIDENCE</small><h1 tabIndex={-1}>주행 및 검증 결과 보고서</h1></div><span className="report-stamp">SESSION<br/>COMPLETE</span></header>
    <div className="mission-result-hero"><span className="result-cat" aria-hidden="true">🐱🎉</span><div><small>{cleanRematch?'CLEAN REMATCH · RACE FINISH':'CASE CLOSED · RACE FINISH'}</small><h2>{recovery.isNewBest?'NEW BEST!':cleanRematch?'CLEAN RUN COMPLETE':'BACK ON TRACK!'}</h2><strong>{formatTime(totalRaceTime)}</strong></div><b className="driving-medal">{medal}</b></div>
    <div className="report-meta"><p><b>MAP</b>Pangyo 2nd Techno Valley</p><p><b>{cleanRematch?'CLEAN TIME':'RACE TOTAL'}</b>{formatTime(totalRaceTime)}</p><p><b>INCIDENT LOSS</b>{cleanRematch?'NOT INCLUDED':`+${incident.incidentTimeLossSeconds.toFixed(1)} s`}</p><p><b>CHECKPOINTS</b>{recovery.checkpointIndex}/{recovery.checkpointCount}</p></div>
    <section><h2>SESSION RESULT</h2><p>선택된 주행 경로를 완주했습니다. 완주 시점에 Race Clock이 고정되었으며 차량은 제어된 감속 절차를 수행했습니다.</p></section>
    <section id="case-summary"><h2>DIAGNOSIS</h2><dl><div><dt>Incident</dt><dd>{controller.definition.id} · {state.frames.length?'CAPTURED':'NOT CAPTURED'}</dd></div><div><dt>Diagnosis duration</dt><dd>{formatTime(incident.diagnosisDurationSeconds)}</dd></div><div><dt>Solve Path</dt><dd>{state.assisted||incident.assisted?'ASSISTED':'INDEPENDENT'}</dd></div><div><dt>Hint</dt><dd>{incident.highestHintLevel?`LEVEL ${incident.highestHintLevel}`:'NO HINT'}</dd></div><div><dt>Evidence</dt><dd>{diagnosis?`${diagnosis.report?.evidenceIds.length??0}개 선택 · 충분성 ${diagnosis.evidenceSufficient?'충족':'미충족'}`:'평가 전'}</dd></div></dl></section><section><h2>DRIVING</h2><dl><div><dt>Run</dt><dd>{cleanRematch?'CLEAN REMATCH':'CASE RECOVERY'}</dd></div><div><dt>Valid Finish</dt><dd>{recovery.status==='FINISHED'?'YES':'NO'}</dd></div><div><dt>Checkpoints</dt><dd>{recovery.checkpointIndex}/{recovery.checkpointCount}</dd></div><div><dt>Driving time</dt><dd>{formatTime(drivingTime)}</dd></div><div><dt>Mode best</dt><dd>{recovery.personalBestSeconds?formatTime(recovery.personalBestSeconds):'—'}</dd></div></dl><div className="sector-result-grid">{recovery.sectorResults.map(sector=><article key={sector.id}><small>{sector.id}</small><strong>{formatTime(sector.timeSeconds)}</strong><span>{sector.comparisonDeltaSeconds===null?(sector.isNewBest?'NEW BEST':'FIRST RUN'):`CASE RETURN ${sector.comparisonDeltaSeconds>=0?'+':''}${sector.comparisonDeltaSeconds.toFixed(2)} s`}</span></article>)}</div></section><section><h2>RESOLUTION</h2><dl><div><dt>Diagnosis result</dt><dd>{diagnosis?`${diagnosis.correct?'CORRECT':'RECHECK'} · ${diagnosis.evidenceSufficient?'SUPPORTED':'INCOMPLETE'}`:'미제출'}</dd></div><div><dt>Repair verification</dt><dd>{verified?`${verified.rows.filter(r=>r.pass).length}/${verified.rows.length} PASS`:'미실행'}</dd></div></dl></section>
    <section><h2>VERIFICATION VERDICT</h2><div className="report-verdict">{verified?(verified.rows.every(r=>r.pass)?'PASS':'FAIL'):'NOT EXECUTED'}</div><p>원인 판단·근거 충분성·수정 검증을 각각 기록합니다. 완주선 통과와 사건 해결은 별도로 평가합니다.</p></section>
    <footer><span>Case Recovery와 Clean Rematch 기록은 서로 다른 규칙으로 저장됩니다.</span><div><button type="button" onClick={()=>{runtime.prepareRecoveryChallenge(recovery.runMode);retryRecovery()}}>RETRY</button><button type="button" onClick={()=>{runtime.prepareRecoveryChallenge('CLEAN_REMATCH');retryRecovery()}}>CLEAN REMATCH</button><button type="button" onClick={()=>document.getElementById('case-summary')?.scrollIntoView({behavior:'smooth',block:'start'})}>CASE SUMMARY</button><button type="button" onClick={reset}>메인으로 →</button></div></footer>
  </article></section>
}
