import type { Evidence } from '../../../runtime/investigation/Evidence.ts'
import { clueHints, type GameplayClueId, type GameplayClueProgress, type GameplaySuspect } from '../../../runtime/investigation/GameplayInvestigation.ts'

interface Props{
  clues:GameplayClueProgress[]
  evidenceList:readonly Evidence[]
  active:GameplayClueId
  suspects:GameplaySuspect[]
  incidentTimeLossSeconds:number
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

export function InvestigationClueRail({clues,evidenceList,active,suspects,incidentTimeLossSeconds,hintLevel,normalCandidates,abnormalCandidates,lastNormalEvidenceId,firstAbnormalEvidenceId,onUseHint,onNavigate,onMarkBoundary}:Props){
  const current=clues.find(item=>item.id===active)??clues.at(-1)!
  const evidenceById=new Map(evidenceList.map(item=>[item.id,item]))
  const sourceLabel:Record<GameplayClueId,string>={PHENOMENON:'1. 현상 파악 · 사건 관찰 저장',FAULT_BOUNDARY:'2. 원인 추적 · MATCH/MISMATCH 근거 지정',PROOF:'3. 가설 검증 · 정식 컴포넌트 근거 저장'}
  return <section className="investigation-clue-rail" aria-label="현재 조사 목표">
    <div className="clue-rail-status">
      <span><small>INCIDENT LOSS</small><strong>{formatLoss(incidentTimeLossSeconds)}</strong><em>gameplay penalty</em></span>
      <div>{clues.map(clue=><details key={clue.id} className={`clue-evidence-chip ${clue.unlocked?'unlocked':clue.id===active?'active':'locked'}`}><summary><b aria-hidden="true">{clue.unlocked?'🔑':'🔒'}</b><small>{clue.label}</small></summary><div className="clue-evidence-proof"><b>{clue.unlocked?'확보한 실제 근거':'획득 조건'}</b><span>{sourceLabel[clue.id]}</span>{clue.evidenceIds.map(id=>{const evidence=evidenceById.get(id);return <button type="button" key={id} title={evidence?.claim}>{evidence?.details?.subjectId??evidence?.title??id}<small>{evidence?.status??'SAVED'}</small></button>})}{!clue.evidenceIds.length&&<small>아직 조건을 만족한 저장 근거가 없습니다.</small>}</div></details>)}</div>
      <span className={clues.every(clue=>clue.unlocked)?'root-unlocked':'root-locked'}><small>ROOT CAUSE</small><strong>{clues.every(clue=>clue.unlocked)?'UNLOCKED':'LOCKED'}</strong></span>
    </div>
    <div className="clue-current-question"><span><small>현재 질문</small><strong>{current.question}</strong><p>{current.guidance}</p></span><button type="button" onClick={onNavigate}>이 단서 찾기 →</button></div>
    {active==='FAULT_BOUNDARY'&&<details className="boundary-assignment"><summary>저장한 근거를 경계로 지정</summary><div className="boundary-evidence-picker" aria-label="고장 경계 근거 지정">
      <label><span>LAST KNOWN NORMAL<small>마지막 정상 근거</small></span><select value={lastNormalEvidenceId??''} onChange={event=>event.target.value&&onMarkBoundary('LAST_NORMAL',event.target.value)}><option value="">저장한 MATCH 근거 선택</option>{normalCandidates.map(item=><option key={item.id} value={item.id}>{item.details?.subjectId??item.title}</option>)}</select></label>
      <i>→</i>
      <label><span>FIRST KNOWN ABNORMAL<small>첫 이상 근거</small></span><select value={firstAbnormalEvidenceId??''} onChange={event=>event.target.value&&onMarkBoundary('FIRST_ABNORMAL',event.target.value)}><option value="">저장한 MISMATCH 근거 선택</option>{abnormalCandidates.map(item=><option key={item.id} value={item.id}>{item.details?.subjectId??item.title}</option>)}</select></label>
    </div></details>}
    <div className="clue-rail-support">
      <details className="compact-term-guide"><summary>쉬운 용어</summary><div><span><b>REQUEST</b> 요청값</span><span><b>COMMAND</b> 실행 명령값</span><span><b>ACTUAL</b> 실제 기록</span><span><b>VALIDITY</b> 신호 유효 여부</span><span><b>DriveTorqueRequest</b> 구동계에 요구하는 토크</span><span><b>EDriveCommand</b> eDrive가 하류에 전달하는 명령</span></div></details>
      <div className="clue-hint"><button type="button" disabled={hintLevel>=3} onClick={onUseHint}>{hintLevel?`힌트 ${Math.min(3,hintLevel+1)} 보기`:'힌트 보기'}</button>{hintLevel>0&&<p><b>HINT {hintLevel}</b>{clueHints[active][hintLevel-1]}</p>}</div>
      <details className="suspect-strip"><summary>의심 후보 {suspects.filter(item=>item.status!=='ELIMINATED').length}개</summary><div>{suspects.map(item=><span key={item.id} className={item.status.toLowerCase()} title={item.evidenceIds.join(', ')||'아직 연결된 근거 없음'}><b>{item.label}</b><small>{item.status}</small></span>)}</div></details>
    </div>
  </section>
}

export function ClueUnlockToast({clue}:{clue:GameplayClueProgress|null}){
  return clue?<aside className="clue-key-toast" role="status" aria-live="polite"><span aria-hidden="true">🔑</span><div><small>CLUE UNLOCKED</small><strong>{clue.label} 단서를 확보했습니다.</strong></div></aside>:null
}
