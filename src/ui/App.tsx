import { useEffect } from 'react'
import type { ComponentType, ReactNode } from 'react'
import { useNavigation } from './state/navigation'
import type { Screen } from './state/navigation'
import { MainScreen } from './screens/MainScreen'
import { SessionSetupScreen } from './screens/SessionSetupScreen'
import { RaceScreen } from './screens/RaceScreen'
import { InvestigationWorkspace } from './investigation/InvestigationWorkspace'
import { DebriefScreen } from './screens/DebriefScreen'


const screens: Record<Screen, { label: string; component: ComponentType }> = {
  main: { label: 'MAIN', component: MainScreen },
  setup: { label: 'SESSION SETUP', component: SessionSetupScreen },
  race: { label: 'RACE', component: RaceScreen },
  xray: { label: '고장 원인 조사실', component: InvestigationWorkspace },
  debrief: { label: 'DEBRIEF', component: DebriefScreen },
}

export function App({ scene }: { scene: ReactNode }) {
  const screen = useNavigation((state) => state.screen)
  const ActiveScreen = screens[screen].component

  useEffect(() => {
    document.title = `TRACKBACK / ${screens[screen].label}`
    document.querySelector<HTMLElement>('h1')?.focus()
  }, [screen])

  return <div className={`game-shell mode-${screen}`}>
    {scene}
    <div className="scene-shade" aria-hidden="true" />
    <a href="#main-content" className="skip-link">본문으로 이동</a>
    <main id="main-content" className="game-overlay"><ActiveScreen /></main>
    {screen !== 'race' && screen !== 'xray' && <div className="build-label">PHASE 4.1 · PRESENTATION / ENGINEERING PLACEHOLDERS</div>}
  </div>
}

