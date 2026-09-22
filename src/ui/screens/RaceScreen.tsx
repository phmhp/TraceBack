import { IncidentDialogue } from '../components/IncidentDialogue'
import { RaceTimerHUD, RaceDrivingHUD } from '../components/RaceHUD'
import { RacePauseOverlay } from '../components/RacePauseOverlay'
import { useRaceActions } from '../state/RaceActionsContext'
import { useWorldView } from '../state/WorldViewContext'
import { Minimap } from '../minimap/Minimap'
import { RaceFinishOverlay } from '../components/RaceFinishOverlay'
import { useNavigation } from '../state/navigation'
import { useCase } from '../state/CaseContext'

export function RaceScreen() {
  const { state } = useCase()
  const investigate = useNavigation(s => s.enterDebugXRay)
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
    {state.phase !== 'DRIVING' && phase !== 'RACE_COUNTDOWN' && <button className="case-investigate-button" onClick={investigate}>고장 원인 조사실 <kbd>F9</kbd></button>}
    {state.phase === 'CAPTURED' && phase === 'RACE_NORMAL' && <IncidentDialogue investigate={investigate}/>}
    {state.phase !== 'DRIVING' && phase === 'RACE_NORMAL' && <p className="case-driving-hint">{state.phase==='RESOLVED'?'Corrective action verified · 정상 주행':'주행 잠금 · 원인 조사와 수정 검증을 완료해 주세요'}</p>}
  </section>
}
