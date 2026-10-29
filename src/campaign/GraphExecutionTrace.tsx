import type {ExecutionEvent,Value} from './domainTraining'

const show=(value:Value|undefined)=>value===undefined?'—':typeof value==='boolean'?value?'TRUE':'FALSE':typeof value==='number'?Number(value.toFixed(2)).toString():typeof value==='string'?value:JSON.stringify(value)
const equal=(a:Value|undefined,b:Value)=>typeof a==='number'&&typeof b==='number'?Math.abs(a-b)<1e-7:a===b

/** One evaluated input case. The order is the evaluator's dependency order, not elapsed vehicle time. */
export function GraphExecutionTrace({events,index,onStep,expected}:{events:ExecutionEvent[];index:number;onStep:(index:number)=>void;expected:Record<string,Value>}){
 if(!events.length)return <section className="d16-execution-trace"><p>계산할 블록이 없습니다. 입력과 출력을 연결해 보세요.</p></section>
 const current=Math.max(0,Math.min(index,events.length-1)),event=events[current],outputKey=event.nodeId.startsWith('out-')?event.nodeId.slice(4):null,expectedValue=outputKey?expected[outputKey]:undefined,mismatch=expectedValue!==undefined&&!equal(event.value,expectedValue)
 return <section className="d16-execution-trace" aria-label="현재 시험 입력의 블록 계산 순서">
  <header><div><small>현재 시험 입력 · 블록 계산 순서</small><b>{current+1}/{events.length} · {event.scope?event.scope+' / ':''}{event.name}</b></div><div className="d16-execution-actions"><button disabled={current===0} onClick={()=>onStep(current-1)} aria-label="이전 계산 블록">←</button><button disabled={current===events.length-1} onClick={()=>onStep(current+1)} aria-label="다음 계산 블록">→</button></div></header>
  <div className="d16-execution-strip">{events.map((item,i)=><button key={`${item.scope}${item.nodeId}-${i}`} aria-pressed={i===current} className={item.errors.length?'has-error':''} onClick={()=>onStep(i)}><small>{i+1} · {item.scope||'Logic'}</small><b>{item.name}</b><output>{show(item.value)}</output></button>)}</div>
  <div className="d16-execution-readout"><p><b>입력선</b>{event.inputs.length?event.inputs.map(link=><span key={link.port}>{link.fromName??'연결 없음'} → {link.portName}: <strong>{show(link.value)}</strong></span>):<span>이 사례의 원시 입력</span>}</p><p className={mismatch||event.errors.length?'fail':'pass'}><b>현재 블록 출력</b><strong>{show(event.value)}</strong>{expectedValue!==undefined&&<span>요구 출력 {show(expectedValue)} {mismatch?'· 불일치':'· 일치'}</span>}{event.errors.map(error=><span key={error}>{error}</span>)}</p></div>
 </section>
}
