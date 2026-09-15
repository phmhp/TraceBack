import { useRaceHud } from '../state/raceHud'
import { useNavigation } from '../state/navigation'

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toFixed(1).padStart(4, '0')}`
}

export function DebriefScreen() {
  const time = useRaceHud((state) => state.simulationTime)
  const config = useNavigation((state) => state.sessionConfig)
  const reset = useNavigation((state) => state.reset)
  return <section className="report-screen"><article className="verification-report">
    <header><div><small>TRACKBACK · SESSION EVIDENCE</small><h1 tabIndex={-1}>주행 및 검증 결과 보고서</h1></div><span className="report-stamp">SESSION<br/>COMPLETE</span></header>
    <div className="report-meta"><p><b>MAP</b>Pangyo 2nd Techno Valley</p><p><b>RACE TIME</b>{formatTime(time)}</p><p><b>DIFFICULTY</b>{config?.difficulty ?? '—'}</p><p><b>INCIDENT PLAN</b>{config?.incidentCount ?? '—'}</p></div>
    <section><h2>SESSION RESULT</h2><p>선택된 주행 경로를 완주했습니다. 완주 시점에 Race Clock이 고정되었으며 차량은 제어된 감속 절차를 수행했습니다.</p></section>
    <section><h2>FAULT / ROOT CAUSE</h2><dl><div><dt>Scenario</dt><dd>NOT ASSIGNED</dd></div><div><dt>Root Cause</dt><dd>NOT INVESTIGATED</dd></div><div><dt>Corrective Action</dt><dd>NOT APPLIED</dd></div></dl></section>
    <section><h2>VERIFICATION VERDICT</h2><div className="report-verdict">NOT EXECUTED</div><p>현재 세션에는 Fault 시나리오와 Verification Oracle이 할당되지 않았으므로 PASS/FAIL을 판정하지 않습니다.</p></section>
    <footer><span>Generated from local TRACKBACK session data</span><button type="button" onClick={reset}>RETURN TO MAIN →</button></footer>
  </article></section>
}
