import { useState } from 'react'
import { useRaceHud } from '../state/raceHud'
import { useRaceActions } from '../state/RaceActionsContext'

type Confirmation = 'restart' | 'quit' | null
export function RacePauseOverlay({ onResume }: { onResume: () => void }) {
  const status = useRaceHud((s) => s.status); const error = useRaceHud((s) => s.error)
  const { restart, quitToMain } = useRaceActions(); const [confirmation, setConfirmation] = useState<Confirmation>(null)
  const [settings, setSettings] = useState(false)
  if (status !== 'paused' && status !== 'error' && status !== 'loading') return null
  if (confirmation) return <div className="race-pause" role="dialog" aria-modal="true" aria-label="Confirm action"><div className="pause-card confirm-card">
    <p>{confirmation === 'restart' ? '현재 주행을 처음부터 다시 시작할까요?' : '주행을 종료하고 메인 화면으로 이동할까요?'}</p>
    <div className="pause-actions"><button type="button" onClick={() => setConfirmation(null)}>CANCEL</button><button type="button" className="danger-action" onClick={confirmation === 'restart' ? restart : quitToMain}>CONFIRM</button></div>
  </div></div>
  return <div className="race-pause" role="dialog" aria-modal="true" aria-label="Pause menu"><div className="pause-card">
    <small>TRACKBACK</small><h2>{status === 'paused' ? 'PAUSED' : status === 'error' ? 'PHYSICS ERROR' : 'LOADING'}</h2>
    {status === 'paused' ? <div className="pause-menu">
      <button type="button" autoFocus onClick={onResume}>CONTINUE</button>
      <button type="button" onClick={() => setSettings((value) => !value)}>SETTINGS</button>
      {settings && <p className="settings-placeholder">설정은 다음 단계에서 연결됩니다.</p>}
      <button type="button" onClick={() => setConfirmation('restart')}>RESTART RACE</button>
      <button type="button" onClick={() => setConfirmation('quit')}>QUIT TO MAIN</button>
    </div> : <p>{error ?? '물리 엔진을 준비하고 있습니다.'}</p>}
  </div></div>
}
