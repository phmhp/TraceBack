import { useEffect, useState } from 'react'
import type { CSSProperties } from 'react'

export interface IncidentCockpitSnapshot {
  acceleratorPercent: number
  brakePercent: number
  steeringPercent: number
  gear: string
  speedKmh: number
  ready: boolean
  timeSeconds: number
  source: 'DRIVE_RECORDING' | 'STANDARD_TEST'
}

export function IncidentDialogue({ investigate, snapshot }: { investigate: () => void; snapshot: IncidentCockpitSnapshot | null }) {
  const [step, setStep] = useState(0)
  const [revealed, setRevealed] = useState(false)
  useEffect(() => { const timer = window.setTimeout(() => setRevealed(true), 1100); return () => window.clearTimeout(timer) }, [])
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!revealed || e.key !== 'Enter' || (e.target instanceof Element && e.target.closest('input,textarea,select,[contenteditable=true]'))) return
      e.preventDefault(); e.stopImmediatePropagation()
      if (e.repeat) return
      if (step === 0) setStep(1); else investigate()
    }
    window.addEventListener('keydown', onKey, true)
    return () => window.removeEventListener('keydown', onKey, true)
  }, [step, investigate, revealed])
  if (!revealed) return <div className="fault-focus-pulse" role="status">어라? 차가 이상해요…</div>
  return <div className={`incident-dialog incident-step-${step}`} role="dialog" aria-label="사건 안내">
    <div className="incident-driver-card">
      <small className="incident-generic-label">DRIVER VIEW · 고장 순간</small>
      <div className="incident-cockpit" aria-label="고장 순간 운전자 조작 상태">
        <span className="incident-wheel" style={{'--incident-steer': `${snapshot?.steeringPercent??0}deg`} as CSSProperties}><i aria-hidden="true">◯</i><small>STEER</small><b>{snapshot?.steeringPercent??0}%</b></span>
        <span className="incident-pedal accelerator"><small>ACCEL</small><i><b style={{height:`${snapshot?.acceleratorPercent??0}%`}} /></i><strong>{snapshot?.acceleratorPercent??0}%</strong></span>
        <span className="incident-pedal brake"><small>BRAKE</small><i><b style={{height:`${snapshot?.brakePercent??0}%`}} /></i><strong>{snapshot?.brakePercent??0}%</strong></span>
        <span className="incident-gear"><small>GEAR</small><strong>{snapshot?.gear??'—'}</strong><em>{snapshot?.ready?'READY':'NOT READY'}</em></span>
      </div>
    </div>
    <div className="incident-copy">
      <small className="incident-generic-label">{step===0?'DRIVER REPORT · 현상':'EVENT RECORDER · 확보된 사실'}</small>
      {step===0?<><p>“페달은 밟고 있는데 차가 기대만큼 나가지 않아요.”</p><p>차량을 안전하게 멈췄습니다. 원인은 아직 특정하지 않았습니다.</p></>:<><p>가속 입력 {snapshot?.acceleratorPercent??0}% · 차량 속력 {(snapshot?.speedKmh??0).toFixed(1)} km/h · Gear {snapshot?.gear??'—'}</p><p>{snapshot?.timeSeconds.toFixed(2)??'—'} s 사건 구간이 저장됐습니다. 이제 입력부터 실제 반응까지 어디서 차이가 시작됐는지 찾으세요.</p></>}
    </div>
    <button onClick={() => step === 0 ? setStep(1) : investigate()}>{step === 0 ? '사건 기록 확인' : '원인 조사 시작'} <kbd>Enter</kbd></button>
  </div>
}
