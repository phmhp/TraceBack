import { RequirementMap } from '../xray/RequirementMap'
import { CaseScope, componentRoles } from './CaseGuide'
import { CaseExperimentPanel, ExperimentResults } from './CaseExperimentPanel'
import { CaseSignalComparison } from './CaseSignalComparison'
import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCase } from '../state/CaseContext'
import { useNavigation } from '../state/navigation'
import { propulsionRequirements } from '../../data/ground-truth/PropulsionGroundTruth'
import { CaseRequirementReference } from './CaseRequirementReference'
import '../case.css'

const tabs = ['고장 현상', '신호 비교', '요구사항', '재현 시험', '원인 제출']
const names = ['Driver Input', 'GearLogic', 'PropulsionFunction', 'VMC', 'eDrive', 'Vehicle Dynamics']
const reqIds = ['SWR-PROP-002', 'SWR-GEAR-001', 'SWR-PROP-003', 'SWR-VMC-001', 'SWR-EDR-001', 'SWR-PHY-002']
const tasks = ['현상 확인 → 신호에서 차이 찾기 → 요구사항 대조 → 입력을 바꿔 재시험 → 원인 제출', '위 기능을 선택하고 같은 출력의 정상 기대와 이번 주행 값을 비교하십시오.', '휠로 확대하고 빈 공간을 드래그하세요. 요구사항을 선택하면 연관된 항목만 모아 보여줍니다.', '의심한 기능의 입력을 바꿔도 같은 차이가 나타나는지 확인하십시오.', '원인과 오류 유형을 선택하십시오. 시험에 사용한 판단 기준과 결과는 자동 첨부됩니다.']
const help = [
 '가속이 약해진 순간의 입력과 제어 출력을 살펴보고 원인을 밝혀주세요! 시간 커서를 움직이면 해당 시점의 신호값과 차량 위치를 함께 확인할 수 있습니다.',
 '정상 기대는 이번 주행과 동일한 입력·속력·방향을 요구사항 및 보정값에 대입한 출력입니다. ▼는 선택 시점, ▽는 선택 신호에서 처음 기대와 달라진 시점입니다. 시간 커서를 앞뒤로 옮기며, 앞선 기능의 출력에서부터 차이가 시작됐는지 확인해 보세요.',
 'SYSR는 시스템의 기대 동작, SWR는 소프트웨어의 기대 동작입니다. TC는 그 동작을 확인하는 조건·입력·기대 결과를 정한 시험 정의입니다. 도메인은 POWERTRAIN 같은 차량 기능 분류입니다. SW 구성요소는 VMC처럼 기능 구현을 담당하는 소프트웨어 묶음입니다. 클릭하면 상위·하위 요구사항과 관련 TC에 집중할 수 있습니다. 전체 보기로 돌아가 다른 항목을 탐색하세요.',
 '추진 요청 ratio 0.5는 최대 요청의 절반입니다. Nm는 회전시키는 힘인 토크의 단위입니다. 편집 가능한 요청 크기를 바꾸고 시험을 실행하세요. PRE는 문제에서 주어진 사전 조건입니다. TRIGGER는 시험 실행 버튼을 눌러 입력을 적용하는 동작입니다. 결과가 기대와 다른지 확인하고, 필요하면 다른 요청 크기로 다시 시험하세요. 수정 후 복구 확인은 원인 제출 뒤에 진행합니다.',
 '요구사항에서 기대하는 동작과 시험 결과를 비교해 원인을 설명해 주세요. 선택한 시험의 요구사항과 결과가 자동으로 첨부됩니다. 이상이 나타난 시점과 시험을 선택하면 판단을 뒷받침할 수 있습니다.'
]

const f = (v: number | string | boolean | undefined) => typeof v === 'number' ? v.toFixed(2) : v === undefined ? '—' : String(v)
export function CaseXRayScreen() {
  const { controller, state } = useCase()
  const leave = useNavigation(s => s.leaveXRay)
  const [tab, setTab] = useState(0), [node, setNode] = useState(2)
  const [reqId, setReqId] = useState(reqIds[2]!)
  const [playing, setPlaying] = useState(false), [hint, setHint] = useState(false)
  const [component, setComponent] = useState(''), [mechanism, setMechanism] = useState('')
  const [repair, setRepair] = useState<0 | 2 | 3>(0), [error, setError] = useState('')
  const videoSlot = useRef<HTMLDivElement>(null), workspace = useRef<HTMLElement>(null)
  const frame = state.frames[state.selected]
  const requirement = state.experiment?.rows[0]?.requirement ?? ''
  const evidenceRequirement = propulsionRequirements.find(r => r.id === requirement)
  const ready = state.frames.length > 0
  const selectNode = (index: number) => { setNode(index); setReqId(reqIds[index]!) }
  const go = (index: number) => { setTab(index); setError(''); setHint(false); if(index===3) setReqId(node===4?'SWR-EDR-001':'SWR-VMC-001'); workspace.current?.scrollTo(0,0) }
  const attempt = (action: () => void) => { try { action(); setError('') } catch(e) { setError(e instanceof Error ? e.message : '시험 실행 실패') } }
  useLayoutEffect(() => {
    const el = videoSlot.current
    if (!el) return
    const resize = () => { const r=el.getBoundingClientRect(); for (const [n,v] of Object.entries({left:r.left,top:r.top,width:r.width,height:r.height})) document.documentElement.style.setProperty('--case-video-'+n,v+'px') }
    resize(); const observer=new ResizeObserver(resize); observer.observe(el)
    window.addEventListener('resize',resize); window.addEventListener('scroll',resize,true)
    return () => { observer.disconnect(); window.removeEventListener('resize',resize); window.removeEventListener('scroll',resize,true) }
  }, [])
  useEffect(() => {
    if (!playing) return
    const timer=window.setInterval(() => { const s=controller.getSnapshot(); if(s.selected>=s.frames.length-1) {setPlaying(false);return} controller.select(s.selected+3) },50)
    return () => window.clearInterval(timer)
  },[controller,playing])
  const download=()=>{ const url=URL.createObjectURL(new Blob([JSON.stringify(controller.report(),null,2)],{type:'application/json'})); const a=document.createElement('a');a.href=url;a.download='TRACKBACK-CASE-PT-001-report.json';a.click();URL.revokeObjectURL(url) }
  const architectureButton=(index:number)=><button key={index} title={componentRoles[index]} aria-pressed={node===index} onClick={()=>selectNode(index)}><code>{names[index]}</code></button>
  return <section className="case-screen">
    <header className="case-header"><h1 tabIndex={-1}>X-RAY <em>CASE 01 · 가속 응답 이상</em></h1><button onClick={leave}>주행으로 <kbd>F9</kbd></button></header>
    <section className="case-flow-group"><h2>게임 진행 흐름</h2><nav className="case-tabs" aria-label="조사 단계">{tabs.map((t,i)=><button key={t} aria-current={tab===i?'step':undefined} onClick={()=>go(i)}><small>0{i+1}</small>{state.diagnosis&&i===4?'해설 · 수정':t}</button>)}</nav></section>
    <section className="case-flow-group"><h2>차량 제어 소프트웨어 실행 흐름</h2><div className="case-architecture" aria-label="현재 구현의 실행 구조">
      <div className="case-external"><small>입력 경계</small>{architectureButton(0)}</div><span>→</span>
      <div className="case-ecu"><small>통합제어기 모델 · Application SW / POWERTRAIN · 1회 호출의 실행 순서</small><div>{[1,2,3,4].map((i)=><span key={i}>{architectureButton(i)}{i<4&&<i>→</i>}</span>)}</div></div><span>→</span>
      <div className="case-external"><small>제어기 외부 · Plant</small>{architectureButton(5)}</div>
    </div></section>
    <div className="case-layout"><main ref={workspace} className={'case-workspace'+(tab===2?' map-workspace':'')}>
      <div className="case-task"><b>도움말</b><span>{tasks[tab]}</span><button aria-expanded={hint} onClick={()=>setHint(v=>!v)}>{hint?'접기':'자세히'}</button></div>{hint&&<div className="case-help-text"><strong>{tabs[tab]} 도움말</strong>{help[tab]!.split(/(?<=[.!?])\s+/).map((line,i)=><p key={i}>{line}</p>)}</div>}
      {error&&<p role="alert" className="case-error">{error}</p>}
      {tab===0&&<><article className="case-paper"><h2>고장 현상: 가속 페달을 밟아도 차량의 반응이 약합니다.</h2><p>가속 요청이 전달되는 과정을 따라가며, 어느 기능에서 출력이 달라졌는지 원인을 밝혀주세요!</p>{!ready&&<button className="case-primary" onClick={()=>attempt(()=>controller.reproduce())}>표준 입력으로 현상 재현</button>}</article><CaseScope frame={frame} onRequirement={setReqId}/></>}
      {tab===1&&(frame?<CaseSignalComparison frame={frame} node={node} frames={state.frames} onSelect={i=>{setPlaying(false);controller.select(i)}}/>:<p>주행 중 현상이 발생한 뒤 확인하거나, 고장 현상 탭에서 표준 입력으로 재현하십시오.</p>)}
      {tab===2&&<div className="case-large-map"><RequirementMap embedded initialRequirement={reqId} onComponent={id=>{const i=names.indexOf(id==='VehiclePhysics'?'Vehicle Dynamics':id==='DriverInput'?'Driver Input':id);if(i>=0)setNode(i)}} onRequirement={setReqId}/></div>}
      {tab===3&&<CaseExperimentPanel initialTarget={node===4?'eDrive':'VMC'} onRequirement={setReqId}/>}
      {tab === 4 && <>{!state.diagnosis ? <article className="case-paper"><h3>고장 원인 제출</h3><p>이상 동작을 확인한 시점으로 시간 커서를 이동하십시오. 제출 시 해당 주행 데이터와 선택한 시험 결과를 판단 근거로 첨부합니다.</p><div className="case-form"><h3>1. 어느 구성요소가 원인일까요?</h3><div className="case-quiz-grid" role="group" aria-label="원인 컴포넌트">{['DriverInput','GearLogic','PropulsionFunction','VMC','eDrive'].map((v,i)=><button key={v} aria-pressed={component===v} onClick={()=>{setComponent(v);setMechanism('')}}><b><code>{v}</code></b><small>{componentRoles[i]}</small></button>)}</div>{component&&<><h3>2. 어떤 오류가 나타났나요?</h3><div className="case-quiz-grid" role="group" aria-label="오류 유형">{[['scaling','일정 비율로 감소','요청 크기가 달라도 출력이 같은 비율로 작아집니다.'],['limit','잘못된 상한값','특정 크기 이상에서 출력이 더 커지지 않습니다.'],['direction','방향 선택 오류','전진·후진 요청과 출력 방향이 다릅니다.']].map(([value,title,description])=><button key={value} aria-pressed={mechanism===value} onClick={()=>setMechanism(value!)}><b>{title}</b><small>{description}</small></button>)}</div></>}<div className="case-evidence-rule"><b>시험에서 사용한 판단 기준 · 자동 연결</b>{evidenceRequirement?<><code>{requirement}</code><p>{evidenceRequirement.statement}</p><small>선택한 시험 #{state.experiment?.id} · {state.experiment?.rows.every(r=>r.pass)?'기준 충족 (PASS)':'기준 불충족 (FAIL)'}</small></>:<p>재현 시험에서 입력을 적용하면 판단 기준이 연결됩니다.</p>}</div></div><p>첨부 시점: {f(frame?.sw.executionTime)} s · 재현 시험: {state.experiment ? `#${state.experiment.id}` : '미실행'}</p><button className="case-primary" disabled={!component || !mechanism || !requirement || !ready || !state.experiment} onClick={() => attempt(() => { controller.pin(); controller.submit(component, mechanism, requirement) })}>최종 제출하고 해설 보기</button></article> : <><article className="case-paper"><span className="case-kicker">진단 해설</span><h3>{state.diagnosis.correct ? '원인 판단이 정답과 일치합니다.' : '제출 내용과 실제 원인을 비교하십시오.'}</h3><p>증거 평가: {state.diagnosis.evidenceSufficient ? '선택 기록과 시험이 판단을 뒷받침합니다.' : '근거가 부족합니다. 이상이 나타난 시점을 선택하고, 서로 다른 요청 크기에서도 같은 비율의 차이가 나타나는지 시험해 보세요.'}</p><p>첫 제출: {state.diagnosis.component} · {state.diagnosis.mechanism} · {state.diagnosis.requirement}</p><p>원인은 eDrive의 불필요한 비율 감소입니다. 정상 토크 요청을 받은 뒤 Clamp 결과에 0.5가 적용됐습니다. SWR-EDR-001의 한계 이하 입력 보존 동작과 일치하지 않습니다.</p><p>45 → 22.5, 90 → 45처럼 두 입력에서 같은 비율이 유지됩니다. 고정 상한 45 Nm라면 45 → 45, 90 → 45이므로 결과가 다릅니다.</p><p>입력이 유효한 상태에서 기대 출력과 실제 출력이 달라졌는지 확인한 과정이 원인을 뒷받침합니다.</p></article><article className="case-paper"><h3>수정안을 선택하고 실제 재시험</h3><p>작은 입력 하나만 맞추면 충분할까요? 큰 입력·후진·추진 억제도 확인합니다.</p><select aria-label="수정안" value={repair} disabled={state.phase === 'RESOLVED'} onChange={e => setRepair(Number(e.target.value) as 0 | 2 | 3)}><option value={0}>비율 감소 제거 · 방향별 제한 유지</option><option value={2}>입력 요청을 두 배로 보상</option><option value={3}>출력 상한 제한 해제</option></select><button className="case-primary" disabled={state.phase === 'RESOLVED'} onClick={() => attempt(() => { controller.runRepair(repair) })}>수정안 적용 · 재시험 실행</button></article>{state.repairs.map(run => <details className="case-paper" key={run.id}><summary>수정 시험 #{run.id} · {run.rows.every(r => r.pass) ? 'PASS' : 'FAIL — 수정안 재검토'}</summary><ExperimentResults run={run}/></details>)}{state.phase === 'RESOLVED' && <article className="case-paper"><h3>사건 해결 · 정상 동작 복구</h3><p>선택한 확인 시험의 동일 입력·조건과 관련 회귀시험을 통과했습니다. 주행 복귀 시 검증한 정상 C 경로를 적용합니다.</p><div className="case-actions"><button onClick={download}>검증 보고서 JSON 저장</button><button className="case-primary" onClick={leave}>수정 후 주행으로 →</button></div></article>}</>}</>}

    </main><aside className="case-side">
      <div className="case-observation"><div><div className="case-video-label">{frame?.plant?'주행 위치 재구성':'현재 차량 위치'}</div><div ref={videoSlot} className="case-video-slot"/></div><div className="case-note"><b>{state.phase==='RESOLVED'?'해결 완료':'저장된 주행 데이터'}</b><span>시점 {f(frame?.sw.executionTime)} s</span><span>{state.diagnosis?'첨부 데이터 #'+state.pinned:'첨부 예정: 현재 커서'}</span><span>시험 {state.experiment?'#'+state.experiment.id:'미실행'}</span></div></div>
      <CaseRequirementReference id={reqId} onSelect={setReqId} onOpenMap={()=>go(2)} frame={frame}/>
    </aside></div>
    <footer className="case-timeline"><button disabled={!ready} onClick={()=>{if(state.selected>=state.frames.length-1)controller.select(0);setPlaying(v=>!v)}}>{playing?'데이터 재생 정지':'주행 데이터 재생'}</button><label>선택 시점 ▼<input aria-label="주행 데이터 시간 커서" type="range" min={0} max={Math.max(0,state.frames.length-1)} value={state.selected} disabled={!ready} onChange={e=>{setPlaying(false);controller.select(Number(e.target.value))}}/></label><output>{f(frame?.sw.executionTime)} s</output><small>◇ {state.source==='STANDARD_TEST'?'시험 종료':'현상 알림'} {f(state.frames.at(-1)?.sw.executionTime)} s</small><small>{state.source==='STANDARD_TEST'?'표준 시험 데이터':'저장된 주행 데이터'} · 주행 정지</small></footer>
  </section>
}
