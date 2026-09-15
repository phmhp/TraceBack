import type { CSSProperties } from 'react'
import { useRaceHud } from '../state/raceHud'

function formatTime(seconds: number) {
  return `${Math.floor(seconds / 60).toString().padStart(2, '0')}:${(seconds % 60).toFixed(1).padStart(4, '0')}`
}

export function RaceTimerHUD() {
  const time = useRaceHud((s) => s.simulationTime)
  return <output className="race-timer" aria-label="Race time">{formatTime(time)}</output>
}

export function RaceDrivingHUD() {
  const speed = useRaceHud((s) => s.speedKmh)
  const accelerator = useRaceHud((s) => s.accelerator)
  const brake = useRaceHud((s) => s.brake)
  const steering = useRaceHud((s) => s.steering)
  const gear = useRaceHud((s) => s.gear)
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
      <div className="cluster-pedals">
        <span className="cluster-accel">A <b>{Math.round(accelerator * 100)}</b></span>
        <span className="cluster-brake">B <b>{Math.round(brake * 100)}</b></span>
      </div>
      <div className="cluster-steering"><span>◀</span><b><i style={{ left: `${50 + steering * 44}%` }} /></b><span>▶</span></div>
    </div>
  </div>
}
