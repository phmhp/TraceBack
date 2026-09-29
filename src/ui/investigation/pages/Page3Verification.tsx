import { useEffect, useState } from 'react'
import type { HypothesisModel } from '../presentation/InvestigationPresentationModel'
import type { IncidentFrame, ExperimentRun } from '../../../runtime/case/PropulsionCase'
import { architectureNode } from '../../../registries/investigation/Architecture'
import { executableTest, getRequirement, getTestCase, traceRequirements } from '../../../registries/investigation/Trace'

interface Props { hypothesis:HypothesisModel|null; selectedTestCaseId:string; onUpdateHypothesis:(h:HypothesisModel|null)=>void; currentFrame:IncidentFrame|undefined; frames?:readonly IncidentFrame[]; latestExperiment:ExperimentRun|null; experiments?:readonly ExperimentRun[]; onRunExperiment:(value:number,speed:number,direction:'FORWARD'|'REVERSE',validity:'VALID'|'INVALID',target:'VMC'|'eDrive')=>void; onCollectTestAsEvidence:(id:number)=>void; onJumpToEvent:()=>void; onNavigateToTracking:()=>void; onOpenRequirement:(id:string)=>void }
type HypothesisTarget='VMC'|'eDrive'

export function Page3Verification({hypothesis,selectedTestCaseId,onUpdateHypothesis,currentFrame,latestExperiment,onRunExperiment,onCollectTestAsEvidence,onJumpToEvent,onNavigateToTracking,onOpenRequirement}:Props){
  const selectedTc=selectedTestCaseId?getTestCase(selectedTestCaseId):undefined
  const hypothesisTarget:HypothesisTarget=hypothesis?.target==='eDrive'?'eDrive':'VMC'
  const tc=selectedTc??getTestCase(executableTest(hypothesisTarget,'FORWARD'))
  const execution=tc?.execution
  const executable=execution?.status==='EXECUTABLE'
  const target:HypothesisTarget=executable?execution.target:hypothesisTarget
  const requirements=tc?traceRequirements(tc.id):[]
  const requirement=requirements.find(item=>item.level==='SOFTWARE')??requirements[0]??getRequirement(target==='VMC'?'SWR-VMC-001':'SWR-EDR-001')
  const [input,setInput]=useState(target==='VMC'?.5:90)
  const [speed,setSpeed]=useState(0)
  const [direction,setDirection]=useState<'FORWARD'|'REVERSE'>(executable&&execution.direction?execution.direction:'FORWARD')
  const [validity,setValidity]=useState<'VALID'|'INVALID'>('VALID')
  useEffect(()=>{if(executable&&execution.direction)setDirection(execution.direction)},[executable,execution])
  const inputSignal=target==='VMC'?'PropulsionRequest':'DriveTorqueRequest'
  const outputSignal=target==='VMC'?'DriveTorqueRequest':'EDriveCommand'
  const latest=latestExperiment?.rows[0]
  const loadIncident=()=>{onJumpToEvent();setInput(target==='VMC'?(currentFrame?.sw.output.propulsionRequest.magnitude??.5):(currentFrame?.sw.output.driveTorqueRequest.magnitudeNm??90));setSpeed(currentFrame?.sw.input.vehicleSpeed??0)}

  if(!hypothesis&&!selectedTc)return <div className="investigation-main-content verification-page"><section className="investigation-page-heading"><p className="investigation-page-title">가설 검증</p><h2>검증할 가설 또는 시험을 먼저 선택하세요.</h2><p className="investigation-prose">기능 흐름에서 가설 대상을 정하거나 요구사항에서 관련 TC를 검증 계획으로 가져올 수 있습니다.</p><button type="button" className="report-text-button" onClick={onNavigateToTracking}>원인 추적으로 돌아가기 →</button></section></div>

  return <div className="investigation-main-content verification-page verification-redesign">
    <section className="investigation-page-heading"><p className="investigation-page-title">3 · 가설 검증</p><h2>조건을 바꾸면 같은 이상이 다시 나타나는가?</h2><p className="investigation-prose">시험 목적과 합격 기준을 먼저 확인하고, 한 번에 하나의 입력 조건을 바꿔 가설을 검증합니다.</p></section>
    <section className="verification-context-grid" aria-label="현재 검증 맥락">
      <article><small>현재 가설</small><strong>{architectureNode(hypothesis?.target??target)?.label??target}</strong><p>{hypothesis?.type??'기능 처리 이상 여부'}</p><button type="button" onClick={onNavigateToTracking}>가설 수정</button></article>
      <article><small>관련 요구사항 / Expected basis</small><code>{requirement?.id??'—'}</code><p>{requirement?.statement??'연결된 요구사항 없음'}</p>{requirement&&<button type="button" onClick={()=>onOpenRequirement(requirement.id)}>요구사항 보기</button>}</article>
      <article><small>선택한 시험 케이스</small><code>{tc?.id??'—'}</code><p>{tc?.testObject??target}의 {tc?.observation??outputSignal} 동작을 확인합니다.</p><span className={executable?'executable':'reference'}>{execution?.status??'REFERENCE_ONLY'}</span></article>
    </section>
    <div className="verification-workbench">
      <section className="verification-setup-card">
        <header><div><p className="investigation-section-label">1 · 시험 정의</p><h3>무엇을 확인하는 시험인가?</h3></div><button type="button" className="report-text-button" onClick={loadIncident}>사건 조건 불러오기</button></header>
        <dl className="test-purpose-grid"><div><dt>시험 대상</dt><dd>{tc?.testObject??target}</dd></div><div><dt>전제조건</dt><dd>{tc?.precondition??'등록된 전제조건 없음'}</dd></div><div><dt>가할 자극</dt><dd>{tc?.stimulus??`${inputSignal} 값 변경`}</dd></div><div><dt>관찰 신호</dt><dd><code>{tc?.observation??outputSignal}</code></dd></div><div className="acceptance"><dt>합격 기준</dt><dd>{tc?.expectedResult??requirement?.statement??'등록된 합격 기준 없음'}</dd></div></dl>
        <div className="verification-control-panel"><p className="investigation-section-label">2 · 시험 조건 설정</p><div className="control-row"><div><span>Validity</span><small>입력 유효 상태</small></div><div className="finite-choice" role="radiogroup" aria-label="Validity">{(['VALID','INVALID'] as const).map(value=><button type="button" role="radio" aria-checked={validity===value} key={value} onClick={()=>setValidity(value)}>{value}</button>)}</div></div><div className="control-row"><div><span>Direction</span><small>요청 방향</small></div><div className="finite-choice" role="radiogroup" aria-label="Direction">{(['FORWARD','REVERSE'] as const).map(value=><button type="button" role="radio" aria-checked={direction===value} disabled={Boolean(executable&&execution.direction&&execution.direction!==value)} key={value} onClick={()=>setDirection(value)}>{value}</button>)}</div></div>{target==='VMC'&&<label className="numeric-control"><span><code>VehicleSpeed</code><small>고정 조건 · m/s</small></span><input type="number" min="0" max="60" value={speed} onChange={event=>setSpeed(event.target.valueAsNumber)}/></label>}<label className="numeric-control primary"><span><code>{inputSignal}</code><small>이번 시험에서 바꿀 입력</small></span><input type="number" min="0" max={target==='VMC'?1:600} step={target==='VMC'?.05:5} value={input} onChange={event=>setInput(event.target.valueAsNumber)}/></label></div>
      </section>
      <section className="verification-execution-card">
        <header><div><p className="investigation-section-label">3 · 시험 실행 및 결과</p><h3>{architectureNode(target)?.label??target} 출력 비교</h3></div><button type="button" className="verification-run-button" disabled={!executable} onClick={()=>onRunExperiment(input,speed,direction,validity,target)}>{executable?'시험 실행 →':'REFERENCE_ONLY · 실행 불가'}</button></header>
        <div className="verification-signal-flow"><code>{inputSignal}</code><i>→</i><strong>{target}</strong><i>→</i><code>{outputSignal}</code></div>
        {latestExperiment&&latest?<><div className="verification-metric-grid"><article><small>EXPECTED</small><strong>{String(latest.expected)} <em>Nm</em></strong></article><article><small>ACTUAL</small><strong>{String(latest.actual)} <em>Nm</em></strong></article><article className={latest.pass?'pass':'fail'}><small>RESULT</small><strong>{latest.pass?'PASS':'FAIL'}</strong></article></div><div className="verification-result-summary"><header><strong>시험 #{latestExperiment.id} 결과 해석</strong><span>{latest.direction} · {latestExperiment.options?.validity??validity}</span></header><p>{latest.pass?'선택한 조건에서 실제 출력이 합격 기준과 일치했습니다.':'선택한 조건에서 실제 출력이 Expected와 달랐습니다. 동일 패턴이 다른 입력에서도 반복되는지 추가 확인하세요.'}</p><dl><div><dt>시험 입력</dt><dd>{String(latest.input)}</dd></div><div><dt>관찰 신호</dt><dd><code>{outputSignal}</code></dd></div><div><dt>차이</dt><dd>{typeof latest.actual==='number'&&typeof latest.expected==='number'?`${(latest.actual-latest.expected).toFixed(3)} Nm`:'—'}</dd></div></dl></div><div className="verification-result-actions"><button type="button" className="save-comparison-button" onClick={()=>onCollectTestAsEvidence(latestExperiment.id)}>이 결과를 근거에 추가</button><div className="verification-judgement"><button type="button" onClick={()=>hypothesis&&onUpdateHypothesis({...hypothesis,status:'MAINTAINED'})}>가설 유지 · 추가 검증</button><button type="button" onClick={()=>hypothesis&&onUpdateHypothesis({...hypothesis,status:'REJECTED'})}>가설 기각 · 다른 후보 조사</button></div></div></>:<div className="verification-empty-state"><strong>아직 실행한 시험이 없습니다.</strong><p>왼쪽에서 조건을 확인한 뒤 시험을 실행하면 Expected와 Actual이 여기에 함께 표시됩니다.</p></div>}
        <p className="investigation-annotation verification-runtime-note">현재 컴포넌트 TC는 C/WASM 수치 결과로 실행됩니다. 왼쪽 viewport는 사건 재생 화면이며 이 시험의 영상 시뮬레이션이 아닙니다.</p>
      </section>
    </div>
  </div>
}
