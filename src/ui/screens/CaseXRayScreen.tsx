import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useCase } from '../state/CaseContext'
import { useNavigation } from '../state/navigation'
import { propulsionRequirements } from '../../data/ground-truth/PropulsionGroundTruth'
import type { ExperimentRun } from '../../runtime/case/PropulsionCase'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration } from '../../data/calibration/TrackbackSimulationCalibration'
import { CaseRequirementReference } from './CaseRequirementReference'
import '../case.css'

const tabs = ['사건', '신호 추적', '요구사항', '확인 시험', '원인 제출']
const names = ['Driver Input', 'GearLogic', 'PropulsionFunction', 'VMC', 'eDrive', 'Vehicle Dynamics']
const reqIds = ['SWR-PROP-002', 'SWR-GEAR-001', 'SWR-PROP-003', 'SWR-VMC-001', 'SWR-EDR-001', 'SWR-PHY-002']
const tasks = ['기록을 열고 현상을 확인하세요.', '컴포넌트를 선택하고 시간 커서로 전후 값을 비교하세요.', 'SYSR와 SWR를 연결해 적용 조건과 기대 동작을 확인하세요.', '의심되는 대상을 골라 다른 입력에서도 요구사항을 만족하는지 시험하세요.', '기록과 시험 결과를 근거로 원인을 제출하세요.']
const f = (v: number | string | boolean | undefined) => typeof v === 'number' ? v.toFixed(2) : v === undefined ? '—' : String(v)
function Results({ run }: { run: ExperimentRun }) {
  return <div className="case-results"><p><b>{run.testObject}</b> · 시험 #{run.id} · {run.rows.filter(r => r.pass).length}/{run.rows.length} PASS</p><div className="case-result-row headings"><span>입력 / 시험</span><span>기대 Nm</span><span>실제 Nm</span><span>판정</span></div>{run.rows.map(r => <div className="case-result-row" key={r.id}><span>{r.input}<small>{r.direction} · {r.requirement}</small></span><span>{f(r.expected)}</span><span>{f(r.actual)}</span><b className={r.pass ? 'case-pass' : 'case-fail'}>{r.pass ? 'PASS' : 'FAIL'}</b></div>)}</div>
}
export function CaseXRayScreen() {
  const { controller, state } = useCase()
  const leave = useNavigation(s => s.leaveXRay)
  const [tab, setTab] = useState(0), [node, setNode] = useState(0)
  const [reqId, setReqId] = useState(reqIds[0]!)
  const [playing, setPlaying] = useState(false), [hint, setHint] = useState(false)
  const [first, setFirst] = useState(45), [second, setSecond] = useState(90)
  const [testTarget, setTestTarget] = useState<'VMC' | 'eDrive' | null>(null)
  const [component, setComponent] = useState(''), [mechanism, setMechanism] = useState(''), [requirement, setRequirement] = useState('')
  const [repair, setRepair] = useState<0 | 2 | 3>(0), [error, setError] = useState('')
  const videoSlot = useRef<HTMLDivElement>(null), workspace = useRef<HTMLElement>(null)
  const frame = state.frames[state.selected], output = frame?.sw.output, input = frame?.sw.input
  const ready = state.frames.length > 0
  const selectNode = (index: number) => { setNode(index); setReqId(reqIds[index]!) }
  const go = (index: number) => { setTab(index); setError(''); setHint(false); workspace.current?.scrollTo(0,0); if(index === 3) { if(node === 3 || node === 4) chooseTest(node === 3 ? 'VMC' : 'eDrive'); else setTestTarget(null) } }
  const chooseTest = (target: 'VMC' | 'eDrive') => {
    setTestTarget(target); selectNode(target === 'VMC' ? 3 : 4)
    setFirst(target === 'VMC' ? .25 : 45); setSecond(target === 'VMC' ? .5 : 90)
  }
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
  const pairs: [string, number | string | boolean | undefined, string][] = node === 0
    ? [['AcceleratorPedalPosition',input?.acceleratorPedalPosition,'ratio'],['GearRequest',input?.gearRequest,'input']]
    : node === 1 ? [['GearRequest',input?.gearRequest,'input'],['GearState',output?.gearState,'output']]
    : node === 2 ? [['AcceleratorPedalPosition',input?.acceleratorPedalPosition,'ratio'],['PropulsionRequest',output?.propulsionRequest.magnitude,'ratio']]
    : node === 3 ? [['PropulsionRequest',output?.propulsionRequest.magnitude,'ratio'],['DriveTorqueRequest',output?.driveTorqueRequest.magnitudeNm,'Nm']]
    : node === 4 ? [['DriveTorqueRequest',output?.driveTorqueRequest.magnitudeNm,'Nm'],['EDriveCommand',output?.eDriveCommand.magnitudeNm,'Nm']]
    : [['DriveForce',frame?.command?.driveForce,'N'],['VehicleSpeed',frame?.plant?.speed,'m/s · post-step']]
  const values = state.frames.map(r => node === 0 ? r.sw.input.acceleratorPedalPosition : node === 1 ? ['P','R','N','D'].indexOf(r.sw.output.gearState) : node === 2 ? r.sw.output.propulsionRequest.magnitude : node === 3 ? r.sw.output.driveTorqueRequest.magnitudeNm : node === 4 ? r.sw.output.eDriveCommand.magnitudeNm : r.plant?.speed ?? 0)
  const maximum=Math.max(1,...values)
  const points=values.map((v,i)=>i/Math.max(1,values.length-1)*800+','+(100-v/maximum*85)).join(' ')
  const download=()=>{ const url=URL.createObjectURL(new Blob([JSON.stringify(controller.report(),null,2)],{type:'application/json'})); const a=document.createElement('a');a.href=url;a.download='TRACKBACK-CASE-PT-001-report.json';a.click();URL.revokeObjectURL(url) }
  const architectureButton=(index:number)=><button key={index} aria-pressed={node===index} onClick={()=>{ selectNode(index); if(tab===3) { if(index===3||index===4) chooseTest(index===3?'VMC':'eDrive'); else setTestTarget(null) } }}>{names[index]}</button>
  return <section className="case-screen">
    <header className="case-header"><h1 tabIndex={-1}>X-RAY <em>CASE 01 · 가속 응답 이상</em></h1><button onClick={leave}>주행으로 <kbd>F9</kbd></button></header>
    <section className="case-flow-group"><h2>게임 진행 흐름</h2><nav className="case-tabs" aria-label="조사 단계">{tabs.map((t,i)=><button key={t} aria-current={tab===i?'step':undefined} onClick={()=>go(i)}><small>0{i+1}</small>{state.diagnosis&&i===4?'해설 · 수정':t}</button>)}</nav></section>
    <section className="case-flow-group"><h2>차량 제어 소프트웨어 실행 흐름</h2><div className="case-architecture" aria-label="현재 구현의 실행 구조">
      <div className="case-external"><small>입력 경계</small>{architectureButton(0)}</div><span>→</span>
      <div className="case-ecu"><small>통합제어기 모델 · Application SW / POWERTRAIN · 1회 호출의 실행 순서</small><div>{[1,2,3,4].map((i)=><span key={i}>{architectureButton(i)}{i<4&&<i>→</i>}</span>)}</div></div><span>→</span>
      <div className="case-external"><small>제어기 외부 · Plant</small>{architectureButton(5)}</div>
    </div></section>
    <div className="case-layout"><main ref={workspace} className="case-workspace">
      <div className="case-task"><b>도움말</b><span>{tasks[tab]}</span></div>
      {error&&<p role="alert" className="case-error">{error}</p>}
      {tab===0&&<><article className="case-paper"><h2>가속 입력 대비 차량 응답 저하</h2><p>{ready?'기록이 준비됐습니다. 원인은 아직 확인하지 않았습니다.':'D 기어로 직선 구간에서 가속하거나, 표준 입력으로 사건을 재현하세요.'}</p><div className="case-actions">{ready?<span>기록 준비 완료 · 상단의 신호 추적 탭에서 확인할 수 있습니다.</span>:<button className="case-primary" onClick={()=>attempt(()=>controller.reproduce())}>표준 재현 시험 실행</button>}</div></article><div className="case-checklist"><span>1. 기록에서 차이 찾기</span><span>2. 요구사항으로 판단하기</span><span>3. 재시험으로 확인하기</span></div><details className="case-paper"><summary>조사 범위 / 실행 구조</summary><p>이번 사건은 추진 Application SW의 단일 계산 결함입니다. 통신·Task·Monitor는 원인 후보에서 제외합니다.</p><p>운전자 입력은 제어기 경계로 전달됩니다. 내부에서는 GearLogic, PropulsionFunction, VMC, eDrive를 한 Step 안에서 순서대로 호출합니다. 추진 요청과 토크 요청은 그 사이의 신호입니다.</p><p>현재 eDrive는 토크 제한을 담당하는 SW 모델이며, 별도 ECU나 실제 인버터 제어를 구현한 것은 아닙니다. Vehicle Dynamics는 외부 Plant입니다.</p></details></>}
      {tab===1&&(!ready?<p>사건 탭에서 기록을 먼저 확보하십시오.</p>:<><div className="case-signals">{pairs.map(([label,value,unit])=><article key={label}><code>{label}</code><strong>{f(value)}</strong><small>{unit}</small></article>)}</div><dl className="case-conditions">{[
  ['GearState',output?.gearState],['VehicleReady',input?.vehicleReady],['PropulsionEnable',input?.propulsionEnable],
  ['AcceleratorPedalValidity',input?.acceleratorPedalValidity],['GearStateValidity',output?.gearStateValidity],
  ['VehicleSpeed',input?.vehicleSpeed===undefined?'—':f(input.vehicleSpeed)+' m/s'],
  ['BrakeInput',frame?.brake],['EDriveDirection',output?.eDriveCommand.direction]
].map(([label,value])=><div key={String(label)}><dt><code>{label}</code></dt><dd>{f(value)}</dd></div>)}</dl><article className="case-paper case-trend"><div className="case-caption">{names[node]} · {node===0?'페달 입력':node===1?'기어 상태 (P=0 / R=1 / N=2 / D=3)':'출력'} 이력 · 0–{f(maximum)}</div><svg viewBox="0 0 800 110" role="img" aria-label="선택 컴포넌트의 신호 이력"><polyline points={points} fill="none" stroke="#237b68" strokeWidth="2"/><path d={'M'+state.selected/Math.max(1,state.frames.length-1)*800+' 0v110'} stroke="#bd6144" strokeDasharray="4 3"/></svg></article></>)}
      {tab===2&&<><p className="case-caption">실제 등록된 SYSR {propulsionRequirements.filter(r=>r.level==='SYSTEM').length}개 · SWR {propulsionRequirements.filter(r=>r.level==='SOFTWARE').length}개. 선택하면 오른쪽에 원문과 연결 관계가 표시됩니다.</p><div className="case-catalog">{['GearLogic','PropulsionFunction','VMC','eDrive','VehiclePhysics'].map(c=><section key={c}><b>{c}</b><div>{propulsionRequirements.filter(r=>r.allocatedComponent===c).map(r=><button key={r.id} aria-pressed={reqId===r.id} onClick={()=>setReqId(r.id)}>{r.id}</button>)}</div></section>)}</div></>}
      {tab===3&&<><article className="case-paper"><div className="case-actions"><b>① 시험 대상</b>{(['VMC','eDrive'] as const).map(t=><button key={t} aria-pressed={testTarget===t} onClick={()=>chooseTest(t)}>{t}</button>)}</div><p className="case-caption" hidden={!!testTarget}>기록에서 의심한 대상을 직접 선택하세요. 현재 개별 재시험은 이 두 컴포넌트를 지원합니다.</p>{testTarget&&<><p><b>② 정상 기준</b> · <button className="case-inline" onClick={()=>setReqId(testTarget==='VMC'?'SWR-VMC-001':'SWR-EDR-001')}>{testTarget==='VMC'?'SWR-VMC-001':'SWR-EDR-001'} ↗</button></p><p>{testTarget==='VMC'?'FORWARD / VALID / 속력 0 m/s · 기대 토크 = 요청 × 전진 map 최대값':'FORWARD / VALID · 기대 토크 = min(입력, 전진 한계)'}<br/><small>현재 모델 기준: {testTarget==='VMC'?'전진 map 최대값 '+calibration.vmcForwardTorqueMap.maximumTorqueNm+' Nm':'전진 한계 '+controller.limits.forward+' Nm'} · 허용 오차 0.000001 Nm</small></p><div className="case-actions"><b>③ 입력 바꾸기</b>{[['첫 입력',first,setFirst],['둘째 입력',second,setSecond]].map(([label,value,setter])=><label key={String(label)}>{String(label)}<select aria-label={String(label)} value={Number(value)} onChange={e=>(setter as (v:number)=>void)(Number(e.target.value))}>{(testTarget==='VMC'?[.25,.5,.75]:[45,90,120]).map(v=><option key={v} value={v}>{v} {testTarget==='VMC'?'ratio':'Nm'}</option>)}</select></label>)}<button className="case-primary" disabled={!ready||!!state.diagnosis} onClick={()=>attempt(()=>controller.runExperiment(first,second,testTarget))}>④ 실행 · 기대값과 비교</button></div></>}{!ready&&<p>먼저 사건 기록을 확보하세요.</p>}</article>{state.experiment&&<><Results run={state.experiment}/><div className="case-actions"><span>요구사항 {state.experiment.rows.every(r=>r.pass)?'일치':'불일치'} · 이 두 입력의 결과</span></div></>}</>}
      {tab === 4 && <>{!state.diagnosis ? <article className="case-paper"><h3>내 판단 제출</h3><p>이상 동작을 확인한 시점으로 시간 커서를 이동하십시오. 제출 시 해당 신호 기록과 마지막 시험 결과를 판단 근거로 첨부합니다.</p><div className="case-form"><label>원인 컴포넌트<select aria-label="원인 컴포넌트" value={component} onChange={e => setComponent(e.target.value)}><option value="">선택하세요</option>{['DriverInput', 'GearLogic', 'PropulsionFunction', 'VMC', 'eDrive'].map(v => <option key={v}>{v}</option>)}</select></label><label>오류 유형<select aria-label="오류 유형" value={mechanism} onChange={e => setMechanism(e.target.value)}><option value="">선택하세요</option><option value="scaling">입력에 비례하는 불필요한 크기 감소</option><option value="limit">잘못된 고정 상한</option><option value="direction">추진 방향 선택 오류</option></select></label><label>직접 근거 요구사항<select aria-label="직접 근거 요구사항" value={requirement} onChange={e => setRequirement(e.target.value)}><option value="">선택하세요</option>{['SYSR-PROP-009', 'SWR-PROP-004', 'SWR-VMC-001', 'SWR-EDR-001'].map(v => <option key={v}>{v}</option>)}</select></label></div><p>첨부 시점: {f(frame?.sw.executionTime)} s · 확인 시험: {state.experiment ? `#${state.experiment.id}` : '미실행'}</p><button className="case-primary" disabled={!component || !mechanism || !requirement || !ready || !state.experiment} onClick={() => attempt(() => { controller.pin(); controller.submit(component, mechanism, requirement) })}>최종 제출하고 해설 보기</button></article> : <><article className="case-paper"><span className="case-kicker">진단 해설</span><h3>{state.diagnosis.correct ? '제출 근거가 실제 원인과 일치합니다.' : '제출 내용과 실제 원인을 비교하십시오.'}</h3><p>첫 제출: {state.diagnosis.component} · {state.diagnosis.mechanism} · {state.diagnosis.requirement}</p><p>원인은 eDrive의 불필요한 비율 감소입니다. 정상 토크 요청을 받은 뒤 Clamp 결과에 0.5가 적용됐습니다. SWR-EDR-001의 한계 이하 입력 보존 동작과 일치하지 않습니다.</p><p>45 → 22.5, 90 → 45처럼 두 입력에서 같은 비율이 유지됩니다. 고정 상한 45 Nm라면 45 → 45, 90 → 45이므로 결과가 다릅니다.</p><p>코드 위치를 맞히는 문제는 아닙니다. 유효한 입력과 출력 차이, 조건, 확인 시험이 근거입니다.</p></article><article className="case-paper"><h3>수정안을 선택하고 실제 재시험</h3><p>작은 입력 하나만 맞추면 충분할까요? 큰 입력·후진·추진 억제도 확인합니다.</p><select aria-label="수정안" value={repair} disabled={state.phase === 'RESOLVED'} onChange={e => setRepair(Number(e.target.value) as 0 | 2 | 3)}><option value={0}>비율 감소 제거 · 방향별 제한 유지</option><option value={2}>입력 요청을 두 배로 보상</option><option value={3}>출력 상한 제한 해제</option></select><button className="case-primary" disabled={state.phase === 'RESOLVED'} onClick={() => attempt(() => { controller.runRepair(repair) })}>수정안 적용 · 재시험 실행</button></article>{state.repairs.map(run => <details className="case-paper" key={run.id}><summary>수정 시험 #{run.id} · {run.rows.every(r => r.pass) ? 'PASS' : 'FAIL — 수정안 재검토'}</summary><Results run={run}/></details>)}{state.phase === 'RESOLVED' && <article className="case-paper"><h3>사건 해결 · 정상 계약 복구</h3><p>같은 재현 조건과 관련 회귀시험을 통과했습니다. 주행 복귀 시 검증한 정상 C 경로를 적용합니다.</p><div className="case-actions"><button onClick={download}>검증 보고서 JSON 저장</button><button className="case-primary" onClick={leave}>수정 후 주행으로 →</button></div></article>}</>}</>}

    </main><aside className="case-side">
      <div className="case-observation"><div><div className="case-video-label">{frame?.plant?'기록 위치 재구성':'현재 정지 위치 · 시험 영상 아님'}</div><div ref={videoSlot} className="case-video-slot"/></div><div className="case-note"><b>{state.phase==='RESOLVED'?'해결 완료':'조사 기록'}</b><span>시점 {f(frame?.sw.executionTime)} s</span><span>{state.diagnosis?'첨부 기록 #'+state.pinned:'첨부 예정: 현재 커서'}</span><span>시험 {state.experiment?'#'+state.experiment.id:'미실행'}</span></div></div>
      <CaseRequirementReference id={reqId} onSelect={setReqId}/>
      <button className="case-help-button" onClick={()=>setHint(v=>!v)}>{hint?'도움말 접기':'추가 도움말'}</button>
      {hint&&<p className="case-caption">입력이 유효한지 먼저 확인한 뒤, 선택한 컴포넌트의 출력이 요구사항과 맞는지 비교하세요. 단위가 다른 입력·출력은 숫자만 직접 비교하지 마세요.</p>}
    </aside></div>
    <footer className="case-timeline"><button disabled={!ready} onClick={()=>{if(state.selected>=state.frames.length-1)controller.select(0);setPlaying(v=>!v)}}>{playing?'기록 정지':'기록 재생'}</button><label>시간 커서<input aria-label="사건 시간 커서" type="range" min={0} max={Math.max(0,state.frames.length-1)} value={state.selected} disabled={!ready} onChange={e=>{setPlaying(false);controller.select(Number(e.target.value))}}/></label><output>{f(frame?.sw.executionTime)} s</output><small>{state.source==='STANDARD_TEST'?'TEST RECORD':'DRIVE RECORD'} · 주행 정지</small></footer>
  </section>
}
