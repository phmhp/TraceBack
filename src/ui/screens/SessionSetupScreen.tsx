import { NavigationButton } from '../components/NavigationButton'
import { ScreenHeading } from '../components/ScreenHeading'
import { useNavigation } from '../state/navigation'
import type { Difficulty, RaceLength } from '../state/navigation'

export function SessionSetupScreen() {
  const config = useNavigation((state) => state.draftConfig)
  const update = useNavigation((state) => state.updateDraft)
  return <section className="menu-screen"><div className="menu-sheet">
    <ScreenHeading step="PRE-RACE" title="SESSION SETUP" description="주행 세션을 설정하세요" />
    <dl className="setup-options">
      <div><dt>RACE LENGTH</dt><dd><select aria-label="Race length" value={config.raceLength} onChange={(event) => update({ raceLength: event.target.value as RaceLength })}><option value="SHORT">SHORT · 1 LAP</option><option value="MEDIUM">MEDIUM · 2 LAPS</option><option value="LONG">LONG · 3 LAPS</option></select></dd></div>
      <div><dt>INCIDENT COUNT</dt><dd><select aria-label="Incident count" value={config.incidentCount} onChange={(event) => update({ incidentCount: Number(event.target.value) as 1 | 2 | 3 })}><option value={1}>1</option><option value={2}>2</option><option value={3}>3</option></select></dd></div>
      <div><dt>DIFFICULTY</dt><dd><select aria-label="Difficulty" value={config.difficulty} onChange={(event) => update({ difficulty: event.target.value as Difficulty })}><option value="GUIDED">GUIDED</option><option value="STANDARD">STANDARD</option><option value="EXPERT">EXPERT</option></select></dd></div>
    </dl>
    <p className="menu-note">난이도는 향후 Engineering Mode에서 제공되는 단서의 양을 조절합니다.</p>
    <div className="actions"><NavigationButton>START RACE →</NavigationButton><NavigationButton action="back" secondary>BACK</NavigationButton></div>
  </div></section>
}
