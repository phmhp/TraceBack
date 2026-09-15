import { RaceTimerHUD, RaceDrivingHUD } from '../components/RaceHUD'
import { RacePauseOverlay } from '../components/RacePauseOverlay'
import { useRaceActions } from '../state/RaceActionsContext'
import { useWorldView } from '../state/WorldViewContext'
import { Minimap } from '../minimap/Minimap'
import { RaceFinishOverlay } from '../components/RaceFinishOverlay'
import { useNavigation } from '../state/navigation'

export function RaceScreen() {
  const { resume } = useRaceActions()
  const { map, readVehicleState } = useWorldView()
  const phase = useNavigation((state) => state.phase)
  return <section className="race-screen">
    <h1 tabIndex={-1} className="sr-only">RACE</h1>
    <RaceTimerHUD />
    <Minimap map={map.definition} readVehicleState={readVehicleState} />
    <RacePauseOverlay onResume={resume} />
    <RaceFinishOverlay />
    {phase === 'RACE_COUNTDOWN' && <div className="race-countdown" role="status" aria-live="assertive">
      <span className="sr-only">3, 2, 1, 출발</span>
      <div aria-hidden="true"><strong>3</strong><strong>2</strong><strong>1</strong><strong>GO!</strong></div>
    </div>}
    <RaceDrivingHUD />
  </section>
}
