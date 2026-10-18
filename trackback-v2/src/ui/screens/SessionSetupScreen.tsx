import { NavigationButton } from '../components/NavigationButton'
import { ScreenHeading } from '../components/ScreenHeading'
import { useNavigation } from '../state/navigation'
import type { RaceLength } from '../state/navigation'
import { PROPULSION_RESPONSE_MISSION as mission } from '../../data/gameplay/VerificationMissions'

export function SessionSetupScreen() {
  const config = useNavigation((state) => state.draftConfig)
  const update = useNavigation((state) => state.updateDraft)
  return <section className="menu-screen"><div className="menu-sheet mission-brief-sheet">
    <ScreenHeading step={`검증 의뢰 · ${mission.caseId}`} title={mission.title} description={`${mission.requestFrom}에서 도착한 첫 번째 의뢰입니다.`} />
    <section className="mission-brief" aria-labelledby="mission-symptom-title">
      <div className="mission-request">
        <small id="mission-symptom-title">DRIVER REPORT · 아직 원인은 알 수 없음</small>
        <blockquote>“가속 페달을 밟아도 차가 기대만큼 나가지 않아요.”</blockquote>
        <p>{mission.playerGoal}</p>
      </div>
      <div className="mission-contract-grid">
        <article><small>DRIVE · 주행 임무</small><ol>{mission.routeContract.map(item=><li key={item}>{item}</li>)}</ol></article>
        <article><small>OBSERVE · 확보할 정보</small><ul>{mission.observationContract.map(item=><li key={item}>{item}</li>)}</ul></article>
      </div>
      <p className="mission-success"><b>다음 단계</b>{mission.successCondition}</p>
    </section>
    <dl className="setup-options">
      <div><dt>RACE LENGTH</dt><dd><select aria-label="Race length" value={config.raceLength} onChange={(event) => update({ raceLength: event.target.value as RaceLength })}><option value="SHORT">SHORT · 1 LAP</option><option value="MEDIUM">MEDIUM · 2 LAPS</option><option value="LONG">LONG · 3 LAPS</option></select></dd></div>
      <div><dt>INCIDENT COUNT</dt><dd>1 · CASE-PT-001</dd></div>
      <div><dt>DIFFICULTY</dt><dd>GUIDED · 첫 사건</dd></div>
    </dl>
    <div className="actions"><NavigationButton>시험 주행 시작 →</NavigationButton><NavigationButton action="back" secondary>BACK</NavigationButton></div>
  </div></section>
}
