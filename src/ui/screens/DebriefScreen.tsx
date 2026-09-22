import { useRaceHud } from '../state/raceHud'
import { useNavigation } from '../state/navigation'
import { useCase } from '../state/CaseContext'

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toFixed(1).padStart(4, '0')}`
}

export function DebriefScreen() {
  const {controller,state}=useCase()
  const diagnosis=state.diagnosis,verified=state.repairs.at(-1)
  const time = useRaceHud((state) => state.simulationTime)
  const config = useNavigation((state) => state.sessionConfig)
  const reset = useNavigation((state) => state.reset)
  return <section className="report-screen"><article className="verification-report">
    <header><div><small>TRACKBACK · SESSION EVIDENCE</small><h1 tabIndex={-1}>주행 및 검증 결과 보고서</h1></div><span className="report-stamp">SESSION<br/>COMPLETE</span></header>
    <div className="report-meta"><p><b>MAP</b>Pangyo 2nd Techno Valley</p><p><b>RACE TIME</b>{formatTime(time)}</p><p><b>DIFFICULTY</b>{config?.difficulty ?? '—'}</p><p><b>INCIDENT PLAN</b>{config?.incidentCount ?? '—'}</p></div>
    <section><h2>SESSION RESULT</h2><p>선택된 주행 경로를 완주했습니다. 완주 시점에 Race Clock이 고정되었으며 차량은 제어된 감속 절차를 수행했습니다.</p></section>
    <section><h2>{state.phase==='RESOLVED'?'MISSION COMPLETE':'FINISH LINE REACHED'}</h2><dl><div><dt>Incident</dt><dd>{controller.definition.id} · {state.frames.length?'CAPTURED':'NOT CAPTURED'}</dd></div><div><dt>Case Status</dt><dd>{state.phase==='RESOLVED'?'RESOLVED':'UNRESOLVED'}</dd></div><div><dt>Root Cause</dt><dd>{diagnosis?`${diagnosis.component} · ${diagnosis.mechanism} · 판단 ${diagnosis.correct?'일치':'불일치'}`:'미제출'}</dd></div><div><dt>Evidence</dt><dd>{diagnosis?`${diagnosis.report?.evidenceIds.length??0}개 선택 · 충분성 ${diagnosis.evidenceSufficient?'충족':'미충족'}`:'평가 전'}</dd></div><div><dt>Verification</dt><dd>{verified?`${verified.rows.filter(r=>r.pass).length}/${verified.rows.length} PASS`:'미실행'}</dd></div><div><dt>Resolution</dt><dd>{state.phase==='RESOLVED'?'Corrective action verified':'사건 미해결 상태로 완주'}</dd></div></dl></section>
    <section><h2>VERIFICATION VERDICT</h2><div className="report-verdict">{verified?(verified.rows.every(r=>r.pass)?'PASS':'FAIL'):'NOT EXECUTED'}</div><p>원인 판단·근거 충분성·수정 검증을 각각 기록합니다. 완주선 통과와 사건 해결은 별도로 평가합니다.</p></section>
    <footer><span>Generated from local TRACKBACK session data</span><button type="button" onClick={reset}>RETURN TO MAIN →</button></footer>
  </article></section>
}
