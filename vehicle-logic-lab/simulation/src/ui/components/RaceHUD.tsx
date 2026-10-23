import type { CSSProperties } from 'react'
import { useRaceHud } from '../state/raceHud'
import { useRecoveryHud } from '../state/recoveryHud'
import { useNavigation } from '../state/navigation'
import { useIncidentRace } from '../state/incidentRace.ts'

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toFixed(1).padStart(4, '0')}`
}

export function RaceTimerHUD() {
  const simulationTime = useRaceHud((s) => s.simulationTime)
  const recoveryTime=useRecoveryHud(s=>s.elapsedSeconds)
  const phase=useNavigation(s=>s.phase)
  const incidentStart=useIncidentRace(s=>s.incidentStartRaceSeconds),incidentLoss=useIncidentRace(s=>s.incidentTimeLossSeconds)
  const runMode=useRecoveryHud(s=>s.runMode)
  const time=phase==='RECOVERY_COUNTDOWN'||phase==='RECOVERY_DRIVE'||phase==='MISSION_FINISH'?(runMode==='CLEAN_REMATCH'?recoveryTime:incidentStart+incidentLoss+recoveryTime):simulationTime
  return <output className="race-timer" aria-label="Race time">{formatTime(time)}</output>
}

const emotionCopy={IDLE:'준비 중',FOCUSED:'집중!',HAPPY_DRIVING:'좋아!',SURPRISED:'어라?!',WORRIED:'괜찮을까…',THINKING:'생각 중',HOPEFUL:'이번엔 될 거야',RELIEVED:'고쳤다!',CELEBRATING:'해냈다!'} as const
export function RecoveryMissionHUD(){
  const phase=useNavigation(s=>s.phase),recovery=useRecoveryHud()
  if(!['RECOVERY_COUNTDOWN','RECOVERY_DRIVE','MISSION_FINISH'].includes(phase))return null
  const next=Math.min(recovery.checkpointIndex+1,recovery.checkpointCount)
  const sector=Math.min(recovery.sectorIndex+1,recovery.sectorCount),sectorElapsed=recovery.elapsedSeconds-recovery.sectorStartSeconds,last=recovery.lastSectorResult
  return <aside className="recovery-mission-hud" aria-label="회복 주행 미션"><div className="cat-reaction-portrait" data-emotion={recovery.reaction}><span aria-hidden="true">🐱</span><small>{emotionCopy[recovery.reaction]}</small></div><div><small>{recovery.runMode==='CLEAN_REMATCH'?'CLEAN REMATCH · 수리된 차량':'CONTROL RESTORED · 같은 레이스 복귀'}</small><strong>{recovery.checkpointIndex===recovery.checkpointCount?'FINISH로 이동':`CHECKPOINT ${next}`}</strong><p>SECTOR {sector}/{recovery.sectorCount} · {formatTime(sectorElapsed)} · CP {recovery.checkpointIndex}/{recovery.checkpointCount}</p>{recovery.penaltySeconds>0&&<p className="recovery-best">COLLISION PENALTY +{recovery.penaltySeconds.toFixed(1)} s</p>}{recovery.personalBestSeconds&&<p className="recovery-best">BEST {formatTime(recovery.personalBestSeconds)}</p>}</div>{last&&<i key={`${last.id}-${last.timeSeconds}`}>{last.id} {formatTime(last.timeSeconds)} {last.isNewBest?'NEW BEST':last.deltaSeconds===null?'':`${last.deltaSeconds>=0?'+':''}${last.deltaSeconds.toFixed(2)}`}</i>}</aside>
}

export function DrivingEventHUD(){
  const event=useRaceHud(state=>state.drivingEvent)
  const phase=useNavigation(state=>state.phase)
  if(!['RECOVERY_COUNTDOWN','RECOVERY_DRIVE'].includes(phase)||event.status==='IDLE')return null
  const distance=event.relativeDistanceM===null?'—':`${Math.max(0,event.relativeDistanceM).toFixed(0)} m`
  return <aside className={`driving-event-hud status-${event.status.toLowerCase()}`} aria-live="polite"><small>DRIVING EVENT</small><strong>{event.status==='CLEARED'?'안전하게 통과':event.status==='HIT'?'충돌 발생':event.title}</strong><span>{event.status==='ACTIVE'?`${event.objective} · ${distance}`:event.status==='HIT'?`기록 페널티 +${event.collisionPenaltySeconds.toFixed(1)} s`:'제동·조향 판단 완료'}</span></aside>
}

export function RaceDrivingHUD() {
  const speed = useRaceHud((s) => s.speedKmh)
  const accelerator = useRaceHud((s) => s.accelerator)
  const brake = useRaceHud((s) => s.brake)
  const steering = useRaceHud((s) => s.steering)
  const gear = useRaceHud((s) => s.gear)
  const vehicleReady=useRaceHud(s=>s.vehicleReady)
  const speedRatio = Math.min(speed, 180) / 180
  const speedAngle = -132 + speedRatio * 264

  return <div className="race-bottom">
    <div className="instrument-cluster" aria-label="주행 계기판" style={{
      '--speed-level': speedRatio,
      '--speed-angle': `${speedAngle}deg`,
      '--accelerator-level': accelerator,
      '--brake-level': brake,
    } as CSSProperties}>
      <div className="cluster-ring" aria-hidden="true" />
      <div className="cluster-tick-labels" aria-hidden="true">
        <span className="tick-0">0</span><span className="tick-40">40</span><span className="tick-80">80</span><span className="tick-120">120</span><span className="tick-160">160</span>
      </div>
      <i className="cluster-needle" aria-hidden="true" />
      <b className="cluster-needle-hub" aria-hidden="true" />
      <span className="cluster-speed-label">SPEED</span>
      <strong className="cluster-speed-value">{speed.toFixed(0)}</strong>
      <span className="cluster-speed-unit">km/h</span>
      <div className="cluster-gear"><small>GEAR</small><b aria-label={`Actual gear ${gear}`}>{gear}</b></div>
      <div className={`cluster-ready ${vehicleReady?'on':'off'}`} title="OWNER_MANUAL_FACT · GV70 취급설명서 p.143"><small>DRIVE</small><b>{vehicleReady?'READY':'NOT READY'}</b></div>
      <div className="cluster-pedals">
        <span className="cluster-accel">A <b>{Math.round(accelerator * 100)}</b></span>
        <span className="cluster-brake">B <b>{Math.round(brake * 100)}</b></span>
      </div>
      <div className="cluster-steering"><span>◀</span><b><i style={{ left: `${50 + steering * 44}%` }} /></b><span>▶</span></div>
    </div>
  </div>
}
