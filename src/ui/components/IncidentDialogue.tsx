import { useEffect, useState } from 'react'

export function IncidentDialogue({ investigate }: { investigate: () => void }) {
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
  return <div className="incident-dialog" role="dialog" aria-label="사건 안내"><div><small className="incident-generic-label">VEHICLE ISSUE · 출력 반응 이상</small><p>{step === 0 ? '입력에 비해 차량의 반응이 약합니다.' : '주행 기록에서 현상과 경계를 확인해주세요.'}</p><p>{step === 0 ? '유효한 사건 기록을 확보해 차량을 안전하게 정지했습니다.' : '원인을 증명하고 수리하면 같은 레이스로 복귀합니다.'}</p></div><button onClick={() => step === 0 ? setStep(1) : investigate()}>{step === 0 ? '다음' : '긴급 진단 시작'} <kbd>Enter</kbd></button></div>
}
