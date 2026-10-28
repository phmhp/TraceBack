import { useEffect, useMemo, useRef, useState } from 'react'
import type { Graph, Mission } from '../engine/types'
import { trialTrace, driveGate } from './interaction'
import { DriveExperience } from './DriveExperience'
import { SignalBench } from './SignalBench'
export function TestReplay({ graph, mission, trial, run, paused, volume }: { graph: Graph; mission: Mission; trial: string; run: number; paused: boolean; volume: number }) {
  const trace = useMemo(() => trialTrace(graph, mission, trial), [graph, mission, trial])
  const root=useRef<HTMLElement>(null)
  const [index, setIndex] = useState(0), [playing, setPlaying] = useState(true), [replay, setReplay] = useState(0)
  useEffect(() => { const failure=trace.findIndex(s=>!s.pass);setIndex(failure<0?0:failure);setPlaying(failure<0) }, [run, trial,trace])
  useEffect(()=>{if(trace.every(s=>s.pass))root.current?.scrollIntoView({block:'nearest',behavior:'smooth'})},[run,trace])
  useEffect(() => { if (paused || !playing || !trace.length) return; const timer = window.setTimeout(() => { if (index < trace.length - 1) setIndex(i => i + 1); else setPlaying(false) }, index === trace.length - 1 ? 4500 : 1600); return () => window.clearTimeout(timer) }, [paused, playing, index, trace])
  const step = trace[index]
  if (!step) return null
  return <section ref={root} className="test-replay">
    <header><b>시뮬레이션 리플레이</b><span>입력 {index+1}/{trace.length} · {step.pass?'기준과 일치':'최초 실패 시점'}</span><button onClick={()=>{setReplay(n=>n+1);setIndex(0);setPlaying(true)}}>↻ 처음부터 재생</button></header>
    <div className="test-replay-scene">
      <DriveExperience key={`${run}-${trial}-${replay}`} enabled={driveGate(step.actual)} cockpit={false} automatic brake={!!step.expected.inputs.brake&&index<trace.length-1} paused={paused||!playing} volume={volume}/>
      <div className="replay-instruments"><SignalBench snapshot={step.actual} brake={!!step.expected.inputs.brake} focus={-1} reduced={paused||!playing}/></div>
    </div>
    <div className="replay-timeline">{trace.map((s,i)=><button key={i} aria-pressed={i===index} onClick={()=>{setIndex(i);setPlaying(false)}}><i className={s.pass?'trace-pass':'trace-fail'}/>{i+1} · {s.actual.state}</button>)}</div>
    <div className="playback-controls"><button onClick={()=>{setPlaying(false);setIndex(i=>Math.max(0,i-1))}}>이전 입력</button><button onClick={()=>{setPlaying(false);setIndex(i=>Math.min(trace.length-1,i+1))}}>다음 입력</button><button onClick={()=>{setPlaying(false);setIndex(Math.max(0,trace.findIndex(s=>!s.pass)))}}>판정 시점</button></div>
    <p>실제 로직: {step.actual.state} · 기대: {step.expected.state} · 요청 {step.actual.outputs.request?'1':'0'} · 구동 {step.actual.outputs.drive?'1':'0'}</p>
    <small>SW 조건을 순서대로 평가한 뒤, 마지막 출력에서 브레이크를 놓고 일정 가속으로 구동 허용을 확인해요. 정지/이동 조건은 SW 시험 입력이며 물리 차량의 전제 상태를 재현한 것은 아니에요. 물리 주행은 별도 시연이고 합격 기준은 독립 요구사항입니다. 1장은 요청만 계산하므로 차가 움직이지 않아요.</small>
  </section>
}
