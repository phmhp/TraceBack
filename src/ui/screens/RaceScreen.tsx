import { IncidentDialogue } from '../components/IncidentDialogue'
import { RaceTimerHUD, RaceDrivingHUD, RecoveryMissionHUD, DrivingEventHUD } from '../components/RaceHUD'
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
  const route=map.definition.routes.find(candidate=>candidate.routeId===map.definition.minimapConfig.routeId)
  return <section className="race-screen">
    <h1 tabIndex={-1} className="sr-only">RACE</h1>
    <RaceTimerHUD />
    <RecoveryMissionHUD />
    <DrivingEventHUD />
    {['PRE_RACE','NORMAL_DRIVE'].includes(phase)&&<aside className="initial-race-objective" aria-label="현재 레이스 목표"><small>RACE · SECTOR 1</small><strong>NEXT CHECKPOINT 1 / {route?.checkpoints.length??0}</strong><span>도로 흐름을 따라 다음 구간까지 빠르고 안전하게 주행하세요.</span></aside>}
    <Minimap map={map.definition} readVehicleState={readVehicleState} />
    {phase !== 'FAULT_EVENT' && <RacePauseOverlay onResume={resume} />}
    <RaceFinishOverlay />
    {(phase === 'PRE_RACE'||phase==='RECOVERY_COUNTDOWN') && <div className="race-countdown" role="status" aria-live="assertive">
      <span className="sr-only">3, 2, 1, 출발</span>
      <div aria-hidden="true"><strong>3</strong><strong>2</strong><strong>1</strong><strong>GO!</strong></div>
    </div>}
    <RaceDrivingHUD />

    {state.phase === 'CAPTURED' && phase === 'FAULT_EVENT' && (<IncidentDialogue investigate={investigate} />)}  </section>
}
