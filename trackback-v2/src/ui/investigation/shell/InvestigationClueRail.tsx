import type { Evidence } from '../../../runtime/investigation/Evidence.ts'
import { clueHints, type GameplayClueId, type GameplayClueProgress, type GameplaySuspect } from '../../../runtime/investigation/GameplayInvestigation.ts'
import { investigationTerm } from '../presentation/InvestigationTerminology.tsx'

interface Props{
  clues:GameplayClueProgress[]
  evidenceList:readonly Evidence[]
  active:GameplayClueId
  suspects:GameplaySuspect[]
  incidentTimeLossSeconds:number
  score:number
  recommendedTools:readonly string[]
  hintLevel:0|1|2|3
  overallStep:number
  overallLabel:string
  onUseHint:()=>void
  onNavigate:()=>void
}

const formatLoss=(seconds:number)=>`+${seconds.toFixed(1)} s`

export function InvestigationClueRail({clues,evidenceList,active,suspects,incidentTimeLossSeconds,score,recommendedTools,hintLevel,overallStep,overallLabel,onUseHint,onNavigate}:Props){
  const current=clues.find(item=>item.id===active)??clues.at(-1)!
  const evidenceById=new Map(evidenceList.map(item=>[item.id,item]))
  const unlockedCount=clues.filter(clue=>clue.unlocked).length
  const nextObjective=current.objectives.find(objective=>!objective.completed)??current.objectives.at(-1)
  const contextualTerms=current.id==='PHENOMENON'?['ACTUAL','VehicleSpeed']:current.id==='FAULT_BOUNDARY'?['DriveTorqueRequest','EDriveCommand','EXPECTED','ACTUAL']:['EXPECTED','ACTUAL','eDrive']
  return <section className="investigation-clue-rail" aria-label="현재 조사 목표">
    <div className="clue-rail-status">
      <span><small>레이스 손실</small><strong>{formatLoss(incidentTimeLossSeconds)}</strong><em>조사 중 증가</em></span>
      <div>{clues.map((clue,index)=><details key={clue.id} className={`clue-evidence-chip ${clue.unlocked?'unlocked':clue.id===active?'active':'locked'}`}><summary><b aria-hidden="true">{clue.unlocked?'🔑':'🔒'}</b><small>{clue.label}</small></summary><div className="clue-evidence-proof"><b>{clue.unlocked?'확보한 실제 근거':'획득 조건'}</b><span>{index+1}. {clue.recommendedTools.join(' · ')}</span>{clue.evidenceIds.map(id=>{const evidence=evidenceById.get(id);return <button type="button" key={id} title={evidence?.claim}>{evidence?.details?.subjectId??evidence?.title??id}<small>{evidence?.status??'SAVED'}</small></button>})}{!clue.evidenceIds.length&&<small>아직 조건을 만족한 저장 근거가 없습니다.</small>}</div></details>)}</div>
      <span className={clues.every(clue=>clue.unlocked)?'root-unlocked':'root-locked'}><small>단서 {unlockedCount}/{clues.length} · {score}점</small><strong>{clues.every(clue=>clue.unlocked)?'결론 가능':'결론 잠김'}</strong></span>
    </div>
    <article className="guided-investigation-card">
      <header><span>전체 {overallStep}/7</span><b>{overallLabel}</b></header>
      <h3>{current.question}</h3>
      {nextObjective&&<p className="guided-next-objective"><b>{nextObjective.completed?'✓':'○'}</b>{nextObjective.label}</p>}
      <footer><details className="guided-objectives"><summary>완료 조건 · 추천 도구</summary><p>{current.guidance}</p><ul>{current.objectives.map(objective=><li key={objective.id} className={objective.completed?'completed':''}><span aria-hidden="true">{objective.completed?'✓':'○'}</span><b>{objective.label}</b><small>+{objective.points}</small></li>)}</ul><small>{recommendedTools.join(' · ')}</small></details><button type="button" onClick={onNavigate}>현재 단서 찾기 →</button></footer>
    </article>
    <div className="clue-rail-support">
      <details className="compact-term-guide"><summary>이 단계의 쉬운 용어</summary><div>{contextualTerms.map(id=>{const term=investigationTerm(id);return <span key={id} title={term.description}><b>{term.easy}</b><code>{term.technical}</code></span>})}</div></details>
      <details className="clue-hint"><summary>힌트 {hintLevel>0?`${hintLevel}/3`:''}</summary><button type="button" disabled={hintLevel>=3} onClick={onUseHint}>{hintLevel?`다음 힌트 보기`:'힌트 보기'}</button>{hintLevel>0&&<p><b>HINT {hintLevel}</b>{clueHints[active][hintLevel-1]}</p>}</details>
      {active!=='PHENOMENON'&&<details className="suspect-strip"><summary>의심 후보 {suspects.filter(item=>item.status!=='ELIMINATED').length}개</summary><div>{suspects.map(item=><span key={item.id} className={item.status.toLowerCase()} title={item.evidenceIds.join(', ')||'아직 연결된 근거 없음'}><b>{item.label}</b><small>{item.status}</small></span>)}</div></details>}
    </div>
  </section>
}

export function ClueUnlockToast({clue}:{clue:GameplayClueProgress|null}){
  return clue?<aside className="clue-key-toast" role="status" aria-live="polite"><span aria-hidden="true">🔑</span><div><small>CLUE UNLOCKED</small><strong>{clue.label} 단서를 확보했습니다.</strong></div></aside>:null
}
