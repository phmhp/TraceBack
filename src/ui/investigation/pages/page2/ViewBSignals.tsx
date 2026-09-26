import { useMemo } from 'react'
import type { MouseEvent } from 'react'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import {
  architectureNode, getInputSignals, getOutputSignals, getSignalDefinition,
  getSignalInterfaces, getSignalObservation,
} from '../../../../registries/investigation/Architecture'

interface ViewBSignalsProps {
  selectedComponent: string
  selectedSignal: string
  onSelectSignal: (sig: string) => void
  currentFrame: IncidentFrame | undefined
  frames: readonly IncidentFrame[]
  onSelectFrameIndex: (idx: number) => void
  onSaveAsEvidence: (signalName: string) => void
  onNavigateToStandards: () => void
  onNavigateToInterfaces: () => void
  onNavigateToComponent: (id: string) => void
}

const formatValue=(value:unknown)=>{
  if(value===null||value===undefined)return '—'
  if(typeof value==='number')return value.toFixed(3)
  if(typeof value==='boolean')return value?'TRUE':'FALSE'
  return String(value)
}

export function ViewBSignals({
  selectedComponent, selectedSignal, onSelectSignal, currentFrame, frames, onSelectFrameIndex,
  onSaveAsEvidence, onNavigateToStandards, onNavigateToInterfaces, onNavigateToComponent,
}:ViewBSignalsProps){
  const nearbySignals=useMemo(()=>{
    const values=[...getOutputSignals(selectedComponent),...getInputSignals(selectedComponent)]
    return [...new Map(values.map(signal=>[signal.id,signal])).values()]
  },[selectedComponent])
  const signal=getSignalDefinition(selectedSignal)??nearbySignals[0]
  const signalId=signal?.id??''
  const selectedIndex=Math.max(0,currentFrame?frames.findIndex(frame=>frame.id===currentFrame.id):0)
  const observation=currentFrame&&signalId?getSignalObservation(signalId,currentFrame,frames[selectedIndex-1]):undefined
  const actual=observation?.actual.value
  const expected=observation?.expected?.value
  const numeric=typeof actual==='number'&&typeof expected==='number'
  const delta=numeric?actual-expected:undefined
  const interfaces=signal?getSignalInterfaces(signal.id):[]

  const plot=useMemo(()=>{
    if(!signalId||!frames.length)return null
    const actualSeries=frames.map((frame,index)=>getSignalObservation(signalId,frame,frames[index-1]).actual.value)
    const expectedSeries=frames.map((frame,index)=>getSignalObservation(signalId,frame,frames[index-1]).expected?.value)
    const numericActual=actualSeries.map(value=>typeof value==='number'?value:null)
    const numericExpected=expectedSeries.map(value=>typeof value==='number'?value:null)
    if(!numericActual.some(value=>value!==null))return null
    const values=[...numericActual,...numericExpected].filter((value):value is number=>value!==null)
    const rawMin=Math.min(...values),rawMax=Math.max(...values)
    const span=Math.max(1e-6,rawMax-rawMin)
    const min=rawMin-span*.12,max=rawMax+span*.12
    const width=760,height=230,left=54,right=18,top=24,bottom=36
    const x=(index:number)=>left+(index/Math.max(1,frames.length-1))*(width-left-right)
    const y=(value:number)=>top+(max-value)/(max-min)*(height-top-bottom)
    const points=(series:(number|null)[])=>series.map((value,index)=>value===null?null:`${x(index).toFixed(1)},${y(value).toFixed(1)}`).filter(Boolean).join(' ')
    const firstDifference=frames.findIndex((_,index)=>{
      const a=numericActual[index],e=numericExpected[index]
      return typeof a==='number'&&typeof e==='number'&&Math.abs(a-e)>1e-4
    })
    return {
      width,height,left,right,top,bottom,min,max,x,
      actualPoints:points(numericActual),
      expectedPoints:numericExpected.some(value=>value!==null)?points(numericExpected):null,
      firstDifference,
      firstDifferenceX:firstDifference>=0?x(firstDifference):null,
      eventX:x(frames.length-1),
      selectedX:x(selectedIndex),
      firstDifferenceTime:firstDifference>=0?frames[firstDifference]?.sw.executionTime:undefined,
    }
  },[frames,selectedIndex,signalId])

  const chooseTime=(event:MouseEvent<SVGSVGElement>)=>{
    if(!plot)return
    const rect=event.currentTarget.getBoundingClientRect()
    const viewX=(event.clientX-rect.left)/rect.width*plot.width
    const ratio=Math.max(0,Math.min(1,(viewX-plot.left)/(plot.width-plot.left-plot.right)))
    onSelectFrameIndex(Math.round(ratio*Math.max(0,frames.length-1)))
  }

  return <div className="signal-investigation-workspace">
    <section className="signal-context-strip">
      <div>
        <p className="investigation-section-label">SIGNAL INVESTIGATION</p>
        <h3><code>{signalId||'신호를 선택하세요'}</code></h3>
        <p>{signal?.description??'등록된 설명 없음'}</p>
      </div>
      <div className="signal-route-summary">
        <span>{signal?.producerIds.map(id=>architectureNode(id)?.label??id).join(', ')||'외부 / 미등록'}</span>
        <i>→</i>
        <span>{signal?.consumerIds.map(id=>architectureNode(id)?.label??id).join(', ')||'소비자 미등록'}</span>
      </div>
    </section>

    <nav className="nearby-signal-list" aria-label="선택 기능의 관련 신호">
      <span>관련 신호</span>
      {nearbySignals.map(item=><button type="button" key={item.id} aria-pressed={item.id===signalId} onClick={()=>onSelectSignal(item.id)}>
        <code>{item.id}</code>
      </button>)}
    </nav>

    <section className="investigation-plot-sheet" aria-labelledby="signal-plot-title">
      <header>
        <div><p className="investigation-section-label">ACTUAL vs EXPECTED</p><h3 id="signal-plot-title">기대값과 실제값이 처음 달라지는 시점을 찾아보세요.</h3></div>
        <div className="plot-legend"><span className="expected">기대값 · 동일 조건의 모델 판정</span><span className="actual">실제값 · 사건 기록</span></div>
      </header>
      {plot?<div className="technical-signal-plot">
        <svg viewBox={`0 0 ${plot.width} ${plot.height}`} onClick={chooseTime} role="img" aria-label={`${signalId} 실제값과 기대값 시계열`}>
          {[0,.25,.5,.75,1].map(ratio=><line key={ratio} x1={plot.left} x2={plot.width-plot.right} y1={plot.top+ratio*(plot.height-plot.top-plot.bottom)} y2={plot.top+ratio*(plot.height-plot.top-plot.bottom)} className="plot-grid-line"/>)}
          {plot.firstDifferenceX!==null&&<rect x={plot.firstDifferenceX} y={plot.top} width={Math.max(0,plot.eventX-plot.firstDifferenceX)} height={plot.height-plot.top-plot.bottom} className="difference-region"/>}
          {plot.expectedPoints&&<polyline points={plot.expectedPoints} className="expected-series"/>}
          <polyline points={plot.actualPoints} className="actual-series"/>
          <line x1={plot.eventX} x2={plot.eventX} y1={plot.top} y2={plot.height-plot.bottom} className="event-marker"/>
          <text x={plot.eventX-4} y={plot.top+10} textAnchor="end" className="event-label">고장 시점</text>
          {plot.firstDifferenceX!==null&&<><line x1={plot.firstDifferenceX} x2={plot.firstDifferenceX} y1={plot.top} y2={plot.height-plot.bottom} className="difference-marker"/><text x={plot.firstDifferenceX+4} y={plot.top+22} className="difference-label">차이 관찰 시작</text></>}
          <line x1={plot.selectedX} x2={plot.selectedX} y1={plot.top} y2={plot.height-plot.bottom} className="selected-time-marker"/>
          <circle cx={plot.selectedX} cy={plot.height-plot.bottom} r="4" className="selected-time-handle"/>
          <text x={plot.left} y={plot.height-9} className="axis-label">0.00 s</text>
          <text x={plot.width-plot.right} y={plot.height-9} textAnchor="end" className="axis-label">{(frames.at(-1)?.sw.executionTime??0).toFixed(2)} s</text>
        </svg>
        <div className="plot-caption">
          <span>선택 시점 <b className="investigation-number">{(currentFrame?.sw.executionTime??0).toFixed(3)} s</b></span>
          {plot.firstDifference>=0&&<button type="button" onClick={()=>onSelectFrameIndex(plot.firstDifference)}>관찰된 첫 차이 시점으로 이동 →</button>}
        </div>
      </div>:<p className="plot-unavailable">이 신호는 현재 숫자 시계열 비교 대상이 아닙니다.</p>}
    </section>

    <section className="signal-investigation-detail">
      <div className="timestamp-reading">
        <p className="investigation-section-label">SELECTED TIMESTAMP</p>
        <dl>
          <div><dt>실제값</dt><dd className="actual investigation-number">{formatValue(actual)}</dd></div>
          <div><dt>기대값</dt><dd className="expected investigation-number">{formatValue(expected)}</dd></div>
          <div><dt>차이</dt><dd className="investigation-number">{delta===undefined?'—':delta.toFixed(3)}</dd></div>
          <div><dt>단위</dt><dd>{signal?.unit??'—'}</dd></div>
        </dl>
        <p className="comparison-guidance">{expected===undefined?'이 신호에는 계산 가능한 기대값이 등록되어 있지 않습니다.':numeric&&Math.abs(delta??0)>1e-4?'이 시점에는 기대값과 실제값의 차이가 관찰됩니다.':'이 시점에는 기대값과 실제값이 일치합니다.'}</p>
        <button type="button" className="save-comparison-button" onClick={()=>onSaveAsEvidence(signalId)}>이 비교를 근거로 기록</button>
      </div>
      <div className="signal-canonical-detail">
        <p className="investigation-section-label">SIGNAL CONTEXT</p>
        <h3><code>{signalId}</code></h3>
        <p>{signal?.description??'등록된 설명 없음'}</p>
        <dl>
          <div><dt>생성</dt><dd>{signal?.producerIds.map(id=>architectureNode(id)?.label??id).join(', ')||'—'}</dd></div>
          <div><dt>전달</dt><dd>{signal?.consumerIds.map(id=>architectureNode(id)?.label??id).join(', ')||'—'}</dd></div>
          <div><dt>인터페이스</dt><dd>{interfaces.map(edge=>edge.id).join(', ')||'—'}</dd></div>
        </dl>
        <div className="trace-direction-actions">
          {signal?.producerIds.map(id=><button type="button" key={`up:${id}`} onClick={()=>onNavigateToComponent(id)}>← 생성 기능 · {architectureNode(id)?.label??id}</button>)}
          {signal?.consumerIds.map(id=><button type="button" key={`down:${id}`} onClick={()=>onNavigateToComponent(id)}>전달 기능 · {architectureNode(id)?.label??id} →</button>)}
        </div>
        <p className="investigation-annotation">이미 차이가 있다면 생성한 쪽을, 아직 같다면 다음 전달 지점을 확인해볼 수 있습니다.</p>
        <div className="signal-secondary-actions">
          <button type="button" onClick={onNavigateToInterfaces}>인터페이스에서 보기</button>
          <button type="button" onClick={onNavigateToStandards}>관련 요구사항 보기</button>
        </div>
      </div>
    </section>
  </div>
}
