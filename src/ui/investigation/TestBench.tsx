import { useState } from 'react'
import { useCase } from '../state/CaseContext'
import { defaultExperimentOptions } from '../../runtime/case/CaseExperiment'
import { executableTest, benchTarget } from '../../registries/investigation/Trace'
import { propulsionRequirements } from '../../data/ground-truth/PropulsionGroundTruth'
import { TestCard } from './RequirementsExplorer'
import { ExperimentResults } from '../screens/CaseExperimentPanel'

function SelectedBench({initialTc}:{initialTc:string}) {
 const {controller,state}=useCase();const target=benchTarget(initialTc)??'VMC'
 const [value,setValue]=useState(target==='VMC'?.5:90),[speed,setSpeed]=useState(0),[direction,setDirection]=useState<'FORWARD'|'REVERSE'>(initialTc.endsWith('010B')?'REVERSE':'FORWARD'),[validity,setValidity]=useState<'VALID'|'INVALID'>('VALID'),[advanced,setAdvanced]=useState(false),[error,setError]=useState('')
 const tcId=executableTest(target,direction),latest=state.experiment
 const run=()=>{try{controller.runExperiment(value,undefined,target,{...defaultExperimentOptions(),speed,direction,validity});setError('')}catch(e){setError(String(e))}}
 return <><div className="bench-grid"><TestCard id={tcId}/><article className="desk-paper"><small>독립 SW 기능 시험</small><h2>시험 입력</h2><p>시험 대상 기능 · <code>{target}</code></p><label><code>{target==='VMC'?'PropulsionRequest.magnitude':'DriveTorqueRequest.magnitudeNm'}</code><input aria-label="시험 요청 크기" type="number" min="0" max={target==='VMC'?1:600} step={target==='VMC'?.05:1} value={Number.isNaN(value)?'':value} onChange={e=>setValue(e.target.valueAsNumber)}/><small>{target==='VMC'?'0–1 ratio · 정규화 추진 요청':'0–600 Nm · 토크 요청'}</small></label><button aria-expanded={advanced} onClick={()=>setAdvanced(!advanced)}>상세 조건 {advanced?'접기':'열기'}</button>{advanced?<><label>Direction<select value={direction} onChange={e=>setDirection(e.target.value as typeof direction)}><option>FORWARD</option><option>REVERSE</option></select></label><label>Validity<select value={validity} onChange={e=>setValidity(e.target.value as typeof validity)}><option>VALID</option><option>INVALID</option></select></label>{target==='VMC'&&<label>VehicleSpeed (m/s)<input type="number" min="0" max="60" value={speed} onChange={e=>setSpeed(e.target.valueAsNumber)}/></label>}</>:<p className="desk-badge">PRE · {direction} / {validity}{target==='VMC'?` / ${speed} m/s`:''}</p>}<p>TC를 참고한 입력 표본 시험입니다. INVALID 조건은 정상 valid TC의 전제 밖 baseline probe입니다.</p><button className="primary" disabled={state.phase!=='CAPTURED'} onClick={run}>시험 실행</button>{state.phase!=='CAPTURED'&&<p>사건 데이터 확보 후, 최초 RCA 제출 전까지 실행할 수 있습니다.</p>}{error&&<p role="alert">{error}</p>}<h3>판정 범위</h3><p>토크 크기 비교 · 허용 오차 0.000001 Nm. 차량 전체를 재실행하지 않습니다.</p></article><article className="desk-paper"><small>시험 결과</small><h2>기대 출력 · 실제 출력</h2>{latest?<><ExperimentResults run={latest}/><button onClick={()=>controller.collectTest(latest.id)}>시험 #{latest.id}을 보고서 근거로 보관</button><p>서로 다른 요청 크기로 다시 시험해 결과 패턴을 비교하십시오.</p></>:<p>입력을 적용하면 실제 C 함수의 결과가 표시됩니다.</p>}</article></div><article className="desk-paper"><h3>시험 기록</h3>{state.experiments.map(r=><div className="history-row" key={r.id}><code>#{r.id} {r.testObject}</code><span>{r.options?.direction} / {r.options?.validity}</span><span>{r.rows.map(row=>`${row.input} → 기대 ${row.expected} / 실제 ${row.actual} Nm`).join(', ')}</span><span>{r.rows.map(row=>Number(row.expected)>1e-6?`실제 / 기대 = ${(Number(row.actual)/Number(row.expected)).toFixed(3)}`:'').join(' · ')}</span><b>{r.rows.every(row=>row.pass)?'PASS':'FAIL'}</b><button onClick={()=>controller.collectTest(r.id)}>근거 추가</button></div>)}</article></>
}



export function TestBench({initialTc}:{initialTc:string}){
 const [chosen,setChosen]=useState(benchTarget(initialTc)?initialTc:'')
 return <><article className="desk-paper bench-selector"><h3>시험할 기능과 정상 기준</h3><small>기능 영역: POWERTRAIN · 추진</small><div className="choice-grid">{[['TC-PROP-NORMAL-009','VMC · 추진 요청을 토크로 변환','SWR-VMC-001'],['TC-PROP-NORMAL-010A','eDrive · 전진 토크 제한','SWR-EDR-001'],['TC-PROP-NORMAL-010B','eDrive · 후진 토크 제한','SWR-EDR-001']].map(([id,label,req])=><button key={id} aria-pressed={chosen===id} onClick={()=>setChosen(id!)}><b>{label}</b><small>{propulsionRequirements.find(r=>r.id===req)?.statement}</small><code>{id}</code></button>)}</div></article>{chosen?<SelectedBench key={chosen} initialTc={chosen}/>:<p className="sheet-caption">확인할 동작을 선택하면 입력과 시험 기준이 열립니다.</p>}</>
}



