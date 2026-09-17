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
    {phase !== 'RACE_COUNTDOWN' && <button className="case-investigate-button" onClick={investigate}>X-RAY · 사건 조사 <kbd>F9</kbd></button>}
    {state.phase === 'DRIVING' && phase === 'RACE_NORMAL' && <p className="case-driving-hint">D 기어로 직선 구간에서 가속하십시오. X-RAY에서 표준 재현 시험도 사용할 수 있습니다.</p>}
    {state.phase === 'CAPTURED' && <div className="incident-dialog" role="dialog" aria-label="사건 기록 안내"><b className="incident-speaker">주행 기록 안내</b><div><p>가속 입력에 비해 차량의 반응이 약합니다.</p><p>해당 상황을 기록했습니다.</p></div><button onClick={investigate}>기록 확인 →</button></div>}
  </section>
}
