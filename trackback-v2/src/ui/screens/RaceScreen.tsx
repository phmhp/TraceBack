import { IncidentDialogue } from '../components/IncidentDialogue'
import { RaceTimerHUD, RaceDrivingHUD, RecoveryMissionHUD, DrivingEventHUD } from '../components/RaceHUD'
import { RacePauseOverlay } from '../components/RacePauseOverlay'
import { useRaceActions } from '../state/RaceActionsContext'
import { useWorldView } from '../state/WorldViewContext'
import { Minimap } from '../minimap/Minimap'
import { RaceFinishOverlay } from '../components/RaceFinishOverlay'
import { useNavigation } from '../state/navigation'
import { useCase } from '../state/CaseContext'
import { PROPULSION_RESPONSE_MISSION as mission } from '../../data/gameplay/VerificationMissions'

export function RaceScreen() {
  const { state } = useCase()
  const investigate = useNavigation(s => s.enterDebugXRay)
  const { resume } = useRaceActions()
  const { map, readVehicleState } = useWorldView()
  const phase = useNavigation((state) => state.phase)
  const route=map.definition.routes.find(candidate=>candidate.routeId===map.definition.minimapConfig.routeId)
  const incidentFrame=state.frames.at(-1)
  const incidentSnapshot=incidentFrame?{
    acceleratorPercent:Math.round(incidentFrame.sw.input.acceleratorPedalPosition*100),
    brakePercent:Math.round(incidentFrame.brake*100),
    steeringPercent:Math.round(incidentFrame.steering*100),
    gear:incidentFrame.sw.output.gearState,
    speedKmh:(incidentFrame.plant?.speed??incidentFrame.sw.input.vehicleSpeed)*3.6,
    ready:incidentFrame.sw.input.vehicleReady,
    timeSeconds:incidentFrame.sw.executionTime,
    source:state.source,
  }:null
  return <section className="race-screen">
    <h1 tabIndex={-1} className="sr-only">RACE</h1>
    <RaceTimerHUD />
    <RecoveryMissionHUD />
    <DrivingEventHUD />
    {['PRE_RACE','NORMAL_DRIVE'].includes(phase)&&<aside className="initial-race-objective" aria-label="현재 시험 주행 목표"><small>{mission.caseId} · 가속 응답 재현</small><strong>CHECKPOINT 1 / {route?.checkpoints.length??0}</strong><span>직선 구간에서 조향을 안정시키고 가속 입력과 차량 반응을 비교하세요.</span><em>안전 주행 + 사건 기록 확보</em></aside>}
    <Minimap map={map.definition} readVehicleState={readVehicleState} />
    {phase !== 'FAULT_EVENT' && <RacePauseOverlay onResume={resume} />}
    <RaceFinishOverlay />
    {(phase === 'PRE_RACE'||phase==='RECOVERY_COUNTDOWN') && <div className="race-countdown" role="status" aria-live="assertive">
      <span className="sr-only">3, 2, 1, 출발</span>
      <div aria-hidden="true"><strong>3</strong><strong>2</strong><strong>1</strong><strong>GO!</strong></div>
    </div>}
    <RaceDrivingHUD />

    {state.phase === 'CAPTURED' && phase === 'FAULT_EVENT' && (<IncidentDialogue investigate={investigate} snapshot={incidentSnapshot} />)}  </section>
}
