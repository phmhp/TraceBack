import { useState } from 'react'
import { useCase } from '../state/CaseContext'
import { defaultExperimentOptions } from '../../runtime/case/CaseExperiment'
import type { ExperimentRun } from '../../runtime/case/PropulsionCase'
import { propulsionRequirements } from '../../data/ground-truth/PropulsionGroundTruth'
import { componentRoles } from './CaseGuide'

export function ExperimentResults({ run }: { run: ExperimentRun }) {
  const signal=run.options?.variable==='speed'?'VehicleSpeed':run.testObject==='VMC'?'PropulsionRequest':'DriveTorqueRequest'
  const unit=run.options?.variable==='speed'?'m/s':run.testObject==='VMC'?'ratio':'Nm'
  return <article className="case-paper"><h3>시험 #{run.id} · <code>{run.testObject}</code> · {run.rows.filter(r=>r.pass).length}/{run.rows.length} PASS</h3>
    {run.options&&<p className="case-caption">변경 신호 <code>{signal}</code> ({unit}) · {run.options.direction} / {run.options.validity} · {run.testObject==='eDrive'?'토크 제한 기능 시험':run.options.variable==='speed'?'고정 요청 '+run.options.magnitude:'고정 속력 '+run.options.speed+' m/s'}</p>}
    <div className="case-result-row headings"><b>적용 값 / 조건</b><b>기대 출력</b><b>실제 출력</b><b>판정</b></div>
    {run.rows.map(r=><div className="case-result-row" key={r.id}><span>{r.input}<small>{r.id} · {r.direction}<br/><code>{r.requirement}</code></small></span><span>{typeof r.expected==='number'?r.expected.toFixed(3)+' Nm':r.expected}</span><span>{typeof r.actual==='number'?r.actual.toFixed(3)+' Nm':r.actual}</span><b className={r.pass?'case-pass':'case-fail'}>{r.pass?'PASS':'FAIL'}</b></div>)}
  </article>
}
export function CaseExperimentPanel({ onRequirement, initialTarget = 'VMC' }: { onRequirement: (id:string)=>void; initialTarget?: 'VMC' | 'eDrive' }) {
  const {controller,state}=useCase()
  const [target,setTarget]=useState(initialTarget)
  const [value,setValue]=useState(initialTarget==='VMC'?.5:90),[error,setError]=useState('')
  const reqId=target==='VMC'?'SWR-VMC-001':'SWR-EDR-001'
  const req=propulsionRequirements.find(r=>r.id===reqId)!
  const signal=target==='VMC'?'PropulsionRequest.magnitude':'DriveTorqueRequest.magnitudeNm'
  const choose=(t:'VMC'|'eDrive')=>{setTarget(t);setValue(t==='VMC'?.5:90);setError('');onRequirement(t==='VMC'?'SWR-VMC-001':'SWR-EDR-001')}
  return <>
    <article className="case-paper"><h3>어느 기능을 시험할까요?</h3><div className="case-actions">{(['VMC','eDrive'] as const).map(t=><button key={t} aria-pressed={target===t} onClick={()=>choose(t)}><code>{t}</code></button>)}</div><p>{componentRoles[target==='VMC'?3:4]}</p></article>
    <article className="case-paper"><h3>입력 신호</h3><p className="case-caption">요청 크기를 바꾸고 실행해 보세요. 나머지 조건은 문제에 주어진 값입니다.</p>
      <div className="case-signal-editor"><label><div><b><code>{signal}</code> <span className="condition-tag">편집 가능</span></b><small>{target==='VMC'?'추진을 얼마나 요청할지 정합니다. 0.5는 최대 요청의 절반입니다.':'전달할 토크를 요청합니다. Nm는 회전시키는 힘의 단위입니다.'}</small></div><input aria-label="요청 크기" type="number" min={0} max={target==='VMC'?1:600} step={target==='VMC'?.05:1} value={Number.isNaN(value)?'':value} onChange={e=>setValue(e.target.valueAsNumber)}/><span>{target==='VMC'?'0–1 ratio':'0–600 Nm'}</span></label>
      {[[target==='VMC'?'PropulsionRequest.direction':'DriveTorqueRequest.direction','FORWARD','전진 방향으로 요청합니다.'],[target==='VMC'?'PropulsionRequest.validity':'DriveTorqueRequest.validity','VALID','사용 가능한 입력으로 시험합니다.'],...(target==='VMC'?[['VehicleSpeed','0 m/s','정지 조건에서 토크 변환을 확인합니다.']]:[])].map(([name,value,description])=><div className="locked-signal" key={name}><div><b><code>{name}</code> <span className="condition-tag">PRE · 주어진 조건</span></b><small>{description}</small></div><input aria-label={name} value={value} readOnly/><span>고정</span></div>)}</div>
      {error&&<p role="alert" className="case-error">{error}</p>}<div className="case-actions"><button className="case-primary" disabled={state.phase!=='CAPTURED'} onClick={()=>{try{controller.runExperiment(value,undefined,target,defaultExperimentOptions());onRequirement(reqId);setError('')}catch(e){setError((e as Error).message)}}}>시험 실행</button><small><span className="condition-tag">TRIGGER</span> 입력 적용</small>{state.experiment?.testObject===target&&<output className="trial-immediate"><b>기대 {Number(state.experiment.rows[0]!.expected).toFixed(2)}</b><span>실제 {Number(state.experiment.rows[0]!.actual).toFixed(2)} Nm</span><strong className={state.experiment.rows[0]!.pass?'case-pass':'case-fail'}>{state.experiment.rows[0]!.pass?'PASS':'FAIL'}</strong></output>}</div>
      <details><summary>어떤 동작을 기대하나요?</summary><code>{reqId}</code><p>{req.statement}</p><p>값을 바꾸어 다시 시험하면, 입력 크기에 따라 출력 차이가 어떻게 달라지는지 비교할 수 있습니다.</p></details>
    </article>
    {state.experiments.length>0&&<article className="case-paper"><h3>시험 결과 · 비교할 행을 선택하세요</h3><div className="trial-history-head"><span>시험 / 입력</span><span>기대 → 실제 (Nm)</span><span>판정</span></div>{state.experiments.map(run=><button className="trial-history-row" key={run.id} aria-pressed={state.experiment?.id===run.id} disabled={!!state.diagnosis} onClick={()=>{controller.selectExperiment(run.id);onRequirement(run.rows[0]!.requirement)}}><span>#{run.id} <code>{run.testObject}</code> · {run.rows.map(r=>r.input).join(' / ')}</span><span>{run.rows.map(r=>Number(r.expected).toFixed(2)+' → '+Number(r.actual).toFixed(2)).join(' / ')}</span><b className={run.rows.every(r=>r.pass)?'case-pass':'case-fail'}>{run.rows.every(r=>r.pass)?'PASS':'FAIL'}</b></button>)}</article>}
  </>
}
