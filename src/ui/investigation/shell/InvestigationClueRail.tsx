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
  normalCandidates:readonly Evidence[]
  abnormalCandidates:readonly Evidence[]
  lastNormalEvidenceId?:string
  firstAbnormalEvidenceId?:string
  onUseHint:()=>void
  onNavigate:()=>void
  onMarkBoundary:(kind:'LAST_NORMAL'|'FIRST_ABNORMAL',id:string)=>void
}

const formatLoss=(seconds:number)=>`+${seconds.toFixed(1)} s`

export function InvestigationClueRail({clues,evidenceList,active,suspects,incidentTimeLossSeconds,score,recommendedTools,hintLevel,normalCandidates,abnormalCandidates,lastNormalEvidenceId,firstAbnormalEvidenceId,onUseHint,onNavigate,onMarkBoundary}:Props){
  const current=clues.find(item=>item.id===active)??clues.at(-1)!
  const evidenceById=new Map(evidenceList.map(item=>[item.id,item]))
  const currentIndex=Math.max(0,clues.findIndex(item=>item.id===current.id))
  const unlockedCount=clues.filter(clue=>clue.unlocked).length
  const contextualTerms=current.id==='PHENOMENON'?['ACTUAL','VehicleSpeed']:current.id==='FAULT_BOUNDARY'?['DriveTorqueRequest','EDriveCommand','EXPECTED','ACTUAL']:['EXPECTED','ACTUAL','eDrive']
  return <section className="investigation-clue-rail" aria-label="현재 조사 목표">
    <div className="clue-rail-status">
      <span><small>레이스 손실 시간</small><strong>{formatLoss(incidentTimeLossSeconds)}</strong><em>조사 중 증가</em></span>
      <div>{clues.map((clue,index)=><details key={clue.id} className={`clue-evidence-chip ${clue.unlocked?'unlocked':clue.id===active?'active':'locked'}`}><summary><b aria-hidden="true">{clue.unlocked?'🔑':'🔒'}</b><small>{clue.label}</small></summary><div className="clue-evidence-proof"><b>{clue.unlocked?'확보한 실제 근거':'획득 조건'}</b><span>{index+1}. {clue.recommendedTools.join(' · ')}</span>{clue.evidenceIds.map(id=>{const evidence=evidenceById.get(id);return <button type="button" key={id} title={evidence?.claim}>{evidence?.details?.subjectId??evidence?.title??id}<small>{evidence?.status??'SAVED'}</small></button>})}{!clue.evidenceIds.length&&<small>아직 조건을 만족한 저장 근거가 없습니다.</small>}</div></details>)}</div>
      <span className={clues.every(clue=>clue.unlocked)?'root-unlocked':'root-locked'}><small>단서 {unlockedCount}/{clues.length} · {score}점</small><strong>{clues.every(clue=>clue.unlocked)?'결론 선택 가능':'결론 잠김'}</strong></span>
    </div>
    <article className="guided-investigation-card">
      <header><span>STEP {currentIndex+1}/{clues.length}</span><b>{current.label} 단서</b></header>
      <h3>{current.question}</h3>
      <p>{current.guidance}</p>
      <ul>{current.objectives.map(objective=><li key={objective.id} className={objective.completed?'completed':''}><span aria-hidden="true">{objective.completed?'✓':'○'}</span><b>{objective.label}</b><small>+{objective.points}</small></li>)}</ul>
      <footer><span><small>추천 도구</small>{recommendedTools.join(' · ')}</span><button type="button" onClick={onNavigate}>조사하러 가기 →</button></footer>
    </article>
    {active==='FAULT_BOUNDARY'&&<details className="boundary-assignment"><summary>저장한 근거를 경계로 지정</summary><div className="boundary-evidence-picker" aria-label="고장 경계 근거 지정">
      <label><span>LAST KNOWN NORMAL<small>마지막 정상 근거</small></span><select value={lastNormalEvidenceId??''} onChange={event=>event.target.value&&onMarkBoundary('LAST_NORMAL',event.target.value)}><option value="">저장한 MATCH 근거 선택</option>{normalCandidates.map(item=><option key={item.id} value={item.id}>{item.details?.subjectId??item.title}</option>)}</select></label>
      <i>→</i>
      <label><span>FIRST KNOWN ABNORMAL<small>첫 이상 근거</small></span><select value={firstAbnormalEvidenceId??''} onChange={event=>event.target.value&&onMarkBoundary('FIRST_ABNORMAL',event.target.value)}><option value="">저장한 MISMATCH 근거 선택</option>{abnormalCandidates.map(item=><option key={item.id} value={item.id}>{item.details?.subjectId??item.title}</option>)}</select></label>
    </div></details>}
    <div className="clue-rail-support">
      <details className="compact-term-guide"><summary>이 단계의 쉬운 용어</summary><div>{contextualTerms.map(id=>{const term=investigationTerm(id);return <span key={id} title={term.description}><b>{term.easy}</b><code>{term.technical}</code></span>})}</div></details>
      <div className="clue-hint"><button type="button" disabled={hintLevel>=3} onClick={onUseHint}>{hintLevel?`힌트 ${Math.min(3,hintLevel+1)} 보기`:'힌트 보기'}</button>{hintLevel>0&&<p><b>HINT {hintLevel}</b>{clueHints[active][hintLevel-1]}</p>}</div>
      <details className="suspect-strip"><summary>의심 후보 {suspects.filter(item=>item.status!=='ELIMINATED').length}개</summary><div>{suspects.map(item=><span key={item.id} className={item.status.toLowerCase()} title={item.evidenceIds.join(', ')||'아직 연결된 근거 없음'}><b>{item.label}</b><small>{item.status}</small></span>)}</div></details>
    </div>
  </section>
}

export function ClueUnlockToast({clue}:{clue:GameplayClueProgress|null}){
  return clue?<aside className="clue-key-toast" role="status" aria-live="polite"><span aria-hidden="true">🔑</span><div><small>CLUE UNLOCKED</small><strong>{clue.label} 단서를 확보했습니다.</strong></div></aside>:null
}
