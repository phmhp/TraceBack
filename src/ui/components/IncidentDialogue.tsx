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
  return <div className="incident-dialog" role="dialog" aria-label="사건 안내"><b className="incident-speaker">주행 안내</b><div><p>{step === 0 ? '가속 입력에 비해 차량의 반응이 약합니다.' : '주행 데이터를 살펴보고 원인을 밝혀주세요!'}</p><p>{step === 0 ? '고장 원인 조사실에서 주행 기록을 확인할 수 있습니다.' : '원인을 찾아내면 다시 주행할 수 있습니다.'}</p></div><button onClick={() => step === 0 ? setStep(1) : investigate()}>{step === 0 ? '다음' : '조사하러 가기'} <kbd>Enter</kbd></button></div>
}
