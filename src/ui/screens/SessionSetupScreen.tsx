import { NavigationButton } from '../components/NavigationButton'
import { ScreenHeading } from '../components/ScreenHeading'
import { useNavigation } from '../state/navigation'
import type { RaceLength } from '../state/navigation'

export function SessionSetupScreen() {
  const config = useNavigation((state) => state.draftConfig)
  const update = useNavigation((state) => state.updateDraft)
  return <section className="menu-screen"><div className="menu-sheet">
    <ScreenHeading step="PRE-RACE" title="SESSION SETUP" description="주행 세션을 설정하세요" />
    <dl className="setup-options">
      <div><dt>RACE LENGTH</dt><dd><select aria-label="Race length" value={config.raceLength} onChange={(event) => update({ raceLength: event.target.value as RaceLength })}><option value="SHORT">SHORT · 1 LAP</option><option value="MEDIUM">MEDIUM · 2 LAPS</option><option value="LONG">LONG · 3 LAPS</option></select></dd></div>
      <div><dt>INCIDENT COUNT</dt><dd>1 · CASE-PT-001</dd></div>
      <div><dt>DIFFICULTY</dt><dd>GUIDED · 첫 사건</dd></div>
    </dl>
    <p className="menu-note">첫 사건: 추진 SW 계산 오류. 주행 중 상황을 기록한 뒤 X-Ray에서 신호와 요구사항을 따라 조사합니다.</p>
    <div className="actions"><NavigationButton>START RACE →</NavigationButton><NavigationButton action="back" secondary>BACK</NavigationButton></div>
  </div></section>
}
