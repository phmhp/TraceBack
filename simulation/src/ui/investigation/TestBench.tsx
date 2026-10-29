import { useMemo, useState } from 'react'
import { useCase } from '../state/CaseContext'
import { defaultExperimentOptions } from '../../runtime/case/CaseExperiment'
import { executableTest, benchTarget, traceRequirements } from '../../registries/investigation/Trace'
import { propulsionRequirements, propulsionTests } from '../../data/ground-truth/PropulsionGroundTruth'
import { ExperimentResults } from '../screens/CaseExperimentPanel'
import { FileIcon } from './FileIcon'

const supportedTests = ['TC-PROP-NORMAL-009','TC-PROP-NORMAL-010A','TC-PROP-NORMAL-010B'] as const

export function TestBench({initialTc}:{initialTc:string}){
 const {controller,state}=useCase()
 const [chosen,setChosen]=useState(benchTarget(initialTc)?initialTc:'TC-PROP-NORMAL-009')
 const target=benchTarget(chosen)??'VMC'
 const [value,setValue]=useState(target==='VMC'?.5:90)
 const [speed,setSpeed]=useState(0)
 const [direction,setDirection]=useState<'FORWARD'|'REVERSE'>(chosen.endsWith('010B')?'REVERSE':'FORWARD')
 const [validity,setValidity]=useState<'VALID'|'INVALID'>('VALID')
 const [error,setError]=useState('')
 const tcId=executableTest(target,direction)
 const tc=propulsionTests.find(item=>item.id===tcId)
 const requirement=traceRequirements(tcId).find(item=>item.level==='SOFTWARE')??propulsionRequirements.find(item=>item.id===(target==='VMC'?'SWR-VMC-001':'SWR-EDR-001'))
 const latest=state.experiment?.testObject===target?state.experiment:null
 const history=useMemo(()=>state.experiments.filter(run=>run.testObject===target),[state.experiments,target])
 const graphRuns=history.slice(-6)
 const graphMax=Math.max(1,...graphRuns.flatMap(run=>run.rows.flatMap(row=>[Number(row.expected),Number(row.actual)])))
 const graphPoints=(kind:'expected'|'actual')=>graphRuns.flatMap(run=>run.rows).map((row,index,rows)=>`${12+index/Math.max(1,rows.length-1)*276},${92-Number(row[kind])/graphMax*72}`).join(' ')
 const choose=(id:string)=>{const next=benchTarget(id)??'VMC';setChosen(id);setValue(next==='VMC'?.5:90);setDirection(id.endsWith('010B')?'REVERSE':'FORWARD');setValidity('VALID');setSpeed(0);setError('')}
 const run=()=>{try{controller.runExperiment(value,undefined,target,{...defaultExperimentOptions(),speed,direction,validity});setError('')}catch(reason){setError(String(reason))}}
 return <section className="bench-workspace">
  <header className="bench-trace-context"><div><small>1 · 대상 SW 기능</small><div className="bench-target-tabs"><button aria-pressed={target==='VMC'} onClick={()=>choose('TC-PROP-NORMAL-009')}>VMC</button><button aria-pressed={target==='eDrive'} onClick={()=>choose(direction==='REVERSE'?'TC-PROP-NORMAL-010B':'TC-PROP-NORMAL-010A')}>eDrive</button></div></div><i>→</i><div><small>2 · 검증 요구사항</small><b><code>{requirement?.id??'—'}</code></b><span>{requirement?.statement??'연결된 요구사항 없음'}</span></div><i>→</i><div><small>3 · 실행 가능한 시험</small><select aria-label="시험 케이스" value={tcId} onChange={event=>choose(event.target.value)}>{supportedTests.filter(id=>benchTarget(id)===target).map(id=><option key={id} value={id}>{id}</option>)}</select><span>{tc?.testObject}</span></div></header>
  <div className="bench-main-grid">
   <article className="bench-input-sheet"><header><FileIcon kind="bench"/><div><small>A · 시험 입력 설정</small><h3>전제조건과 변경 입력</h3></div></header><section className="bench-preconditions"><h4>전제조건 · 읽기 전용</h4><label><span>시험 대상</span><input value={target} readOnly/></label><label><span>검증 요구사항</span><input value={requirement?.id??'—'} readOnly/></label><p>{tc?.precondition}</p></section><section className="bench-stimulus"><h4>변경 가능한 시험 입력</h4><label><span><code>{target==='VMC'?'PropulsionRequest.magnitude':'DriveTorqueRequest.magnitudeNm'}</code><em>편집 가능</em></span><input aria-label="시험 요청 크기" type="number" min="0" max={target==='VMC'?1:600} step={target==='VMC'?.05:1} value={Number.isNaN(value)?'':value} onChange={event=>setValue(event.target.valueAsNumber)}/><small>{target==='VMC'?'0–1 ratio':'0–600 Nm'}</small></label></section><section className="bench-condition-row"><label>방향<select value={direction} onChange={event=>setDirection(event.target.value as typeof direction)}><option value="FORWARD">전진</option><option value="REVERSE">후진</option></select></label><label>유효성<select value={validity} onChange={event=>setValidity(event.target.value as typeof validity)}><option value="VALID">유효</option><option value="INVALID">무효</option></select></label>{target==='VMC'&&<label>차량 속도<input type="number" min="0" max="60" value={speed} onChange={event=>setSpeed(event.target.valueAsNumber)}/></label>}</section>{error&&<p role="alert" className="case-error">{error}</p>}<button className="primary navigation-action bench-run" disabled={state.phase!=='CAPTURED'} onClick={run}>시험 실행 →</button></article>
   <article className="bench-result-sheet"><header><small>B · 신호 결과</small><h3>기대 출력과 실제 출력</h3></header>{latest?<><div className="bench-result-summary"><div><small>기대 출력</small><strong>{Number(latest.rows[0]?.expected).toFixed(3)}</strong><span>Nm</span></div><div><small>실제 출력</small><strong>{Number(latest.rows[0]?.actual).toFixed(3)}</strong><span>Nm</span></div><b className={latest.rows.every(row=>row.pass)?'case-pass':'case-fail'}>{latest.rows.every(row=>row.pass)?'PASS':'FAIL'}</b></div><svg className="bench-result-graph" viewBox="0 0 300 110" role="img" aria-label="시험별 기대 출력과 실제 출력 비교"><path d="M12 12v80h276" fill="none" stroke="#b9c8c0"/>{graphRuns.length>0&&<><polyline points={graphPoints('expected')} fill="none" stroke="#25856d" strokeWidth="3" strokeDasharray="6 3"/><polyline points={graphPoints('actual')} fill="none" stroke="#d56c42" strokeWidth="3"/></>}</svg><div className="bench-graph-legend"><span>┄ 기대 출력</span><span>━ 실제 출력</span></div><ExperimentResults run={latest}/><button className="navigation-action" onClick={()=>controller.collectTest(latest.id)}>시험 결과를 근거로 보관 →</button></>:<div className="bench-empty-result"><span>⌁</span><b>시험을 실행하면 결과가 표시됩니다.</b><p>정상 요구사항으로 계산한 기대 출력과 실제 C/WASM 출력을 비교합니다.</p></div>}</article>
   <aside className="bench-record-sheet"><header><small>C · 차량 기록</small><h3>저장 주행 기록</h3></header><div className="bench-record-visual"><FileIcon kind="car"/><span>RECORDED</span></div><dl><div><dt>선택 시점</dt><dd>{state.frames[state.selected]?.sw.executionTime.toFixed(3)??'—'} s</dd></div><div><dt>차량 속도</dt><dd>{state.frames[state.selected]?.plant?.speed.toFixed(3)??'—'} m/s</dd></div><div><dt>기어 상태</dt><dd>{state.frames[state.selected]?.sw.output.gearState??'—'}</dd></div></dl><p>이 화면은 저장된 사건 기록입니다. 위 독립 SW 시험의 입력으로 차량 전체를 다시 시뮬레이션한 결과가 아닙니다.</p><small>하단의 ‘주행 기록 재생’과 시점 슬라이더로 확인할 수 있습니다.</small></aside>
  </div>
  {history.length>0&&<article className="bench-history"><header><h3>시험 이력</h3><span>서로 다른 입력에서 같은 패턴이 반복되는지 비교하세요.</span></header>{history.map(item=><button key={item.id} aria-pressed={state.experiment?.id===item.id} onClick={()=>controller.selectExperiment(item.id)}><code>#{item.id}</code><span>입력 {item.rows.map(row=>row.input).join(' / ')}</span><span>기대 {item.rows.map(row=>Number(row.expected).toFixed(2)).join(' / ')}</span><span>실제 {item.rows.map(row=>Number(row.actual).toFixed(2)).join(' / ')}</span><b className={item.rows.every(row=>row.pass)?'case-pass':'case-fail'}>{item.rows.every(row=>row.pass)?'PASS':'FAIL'}</b></button>)}</article>}
 </section>
}
