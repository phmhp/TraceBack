import type { InvestigationMission } from '../../../runtime/investigation/Mission'
import type { DiscoveredFinding } from '../../../runtime/investigation/InvestigationSession'
import type { CatReactionState } from '../../../runtime/investigation/Reaction'
import { useEffect, useRef } from 'react'

export interface DialogueBeat { id:string; speaker:string; line:string }

export function MissionStrip({mission}:{mission:InvestigationMission}) {
  return <section className={`mission-strip ${mission.completed?'completed':''}`} aria-label="현재 조사 미션">
    <div className="mission-strip-index"><small>MISSION</small><strong>{String(mission.number).padStart(2,'0')}</strong></div>
    <div className="mission-strip-copy"><b>{mission.completed?'✓ ':''}{mission.title}</b><p>{mission.objective}</p></div>
    {mission.hint&&<details className="mission-hint"><summary>힌트</summary><p>{mission.hint}</p></details>}
  </section>
}

const clueLabels:Record<NonNullable<DiscoveredFinding['clueType']>,string>={
  NORMAL_CONFIRMATION:'✓ 정상 확인',
  MISMATCH:'🔎 차이 단서',
  EXPECTED_BASIS:'📘 기준 발견',
  TEST_RESULT:'🧪 시험 결과',
  OBSERVATION:'◇ 관찰 기록',
}

export function ClueToast({finding}:{finding:DiscoveredFinding|null}) {
  if(!finding)return null
  const type=finding.clueType??(finding.outcome==='MATCH'?'NORMAL_CONFIRMATION':finding.outcome==='MISMATCH'?'MISMATCH':'OBSERVATION')
  return <aside className={`clue-toast ${type.toLowerCase()}`} role="status" aria-live="polite">
    <small>CLUE FOUND!</small><strong>{clueLabels[type]}</strong><p>{finding.claim??finding.subjectId}</p>
  </aside>
}

export function NotebookToast({visible}:{visible:boolean}) {
  return visible?<div className="notebook-toast" role="status" aria-live="polite"><span>📁</span><b>조사 노트에 추가했습니다.</b></div>:null
}

export function MissionCompleteToast({mission}:{mission:InvestigationMission|null}) {
  return mission?<div className="mission-complete-toast" role="status" aria-live="polite"><span>✓</span><div><small>MISSION COMPLETE</small><b>{mission.title}</b></div></div>:null
}

export function DriverDialogue({beat,reaction,remaining,onNext,onSkip}:{beat:DialogueBeat|null;reaction:CatReactionState;remaining:number;onNext:()=>void;onSkip:()=>void}) {
  const nextRef=useRef<HTMLButtonElement>(null)
  useEffect(()=>{
    if(!beat)return
    nextRef.current?.focus()
    const onKeyDown=(event:KeyboardEvent)=>{
      if(event.key==='Escape'){event.preventDefault();onSkip()}
      if(event.key==='Enter'||event.key===' '){event.preventDefault();onNext()}
    }
    window.addEventListener('keydown',onKeyDown)
    return()=>window.removeEventListener('keydown',onKeyDown)
  },[beat,onNext,onSkip])
  if(!beat)return null
  return <div className="driver-dialogue-layer" role="presentation">
    <div className="driver-dialogue-backdrop" aria-hidden="true"/>
    <aside className="driver-dialogue" data-reaction={reaction} role="dialog" aria-modal="true" aria-label="고양이 운전자 대화">
      <img src="/assets/investigation/cat-face.png" alt="고양이 운전자"/>
      <div><small>{beat.speaker}</small><p>“{beat.line}”</p><span><button type="button" onClick={onSkip}>건너뛰기 <kbd>Esc</kbd></button><button ref={nextRef} type="button" className="dialogue-next" onClick={onNext}>{remaining>1?'다음':'계속'} <kbd>Enter</kbd></button></span></div>
    </aside>
  </div>
}
