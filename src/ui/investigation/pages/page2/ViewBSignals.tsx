import { useEffect, useMemo, useState } from 'react'
import type { CSSProperties, MouseEvent } from 'react'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import type { SignalDefinition, SignalValue } from '../../../../registries/investigation/Architecture'
import { architectureNode, getInputSignals, getOutputSignals, getSignalDefinition, getSignalInterfaces, getSignalObservation, getSignalTimelineCapability } from '../../../../registries/investigation/Architecture'
import { compareSignalAtFrame } from '../../../../runtime/investigation/SignalComparison'

interface Props { selectedComponent:string; selectedSignal:string; onSelectSignal:(id:string)=>void; currentFrame:IncidentFrame|undefined; frames:readonly IncidentFrame[]; onSelectFrameIndex:(i:number)=>void; onCompareSignal:(id:string)=>void; onSaveAsEvidence:(id:string)=>void; onNavigateToStandards:()=>void; onNavigateToInterfaces:()=>void; onNavigateToComponent:(id:string)=>void }
const format=(v:SignalValue|undefined)=>v==null?'—':typeof v==='number'?v.toFixed(3):typeof v==='boolean'?(v?'TRUE':'FALSE'):typeof v==='object'?JSON.stringify(v):String(v)
const seriesColors=['#b45c37','#315d8a','#7a5b99','#7a6b24','#2f7664','#9a4b67']

export function ViewBSignals(p:Props) {
  const inputs=useMemo(()=>getInputSignals(p.selectedComponent),[p.selectedComponent])
  const outputs=useMemo(()=>getOutputSignals(p.selectedComponent),[p.selectedComponent])
  const states=inputs.filter(signal=>signal.semanticRole==='STATE_OR_PRECONDITION')
  const valueInputs=inputs.filter(signal=>signal.semanticRole!=='STATE_OR_PRECONDITION')
  const available=useMemo(()=>[...new Map([...states,...valueInputs,...outputs].map(signal=>[signal.id,signal])).values()],[states,valueInputs,outputs])
  const selected=getSignalDefinition(p.selectedSignal)??outputs[0]??inputs[0]
  const [visibleIds,setVisibleIds]=useState<string[]>([])
  const [savedSignal,setSavedSignal]=useState('')
  const [openGroups,setOpenGroups]=useState<string[]>(['output'])

  useEffect(()=>{
    const defaults=[states[0]?.id,valueInputs[0]?.id,selected?.id,outputs[0]?.id].filter((id):id is string=>Boolean(id))
    setVisibleIds(previous=>{
      const retained=previous.filter(id=>available.some(signal=>signal.id===id))
      return [...new Set(retained.length?retained:defaults)]
    })
  },[p.selectedComponent]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    const relevant=states.some(signal=>signal.id===selected?.id)?'state':valueInputs.some(signal=>signal.id===selected?.id)?'input':'output'
    setOpenGroups([relevant])
  },[p.selectedComponent,selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(()=>{
    if(selected&&!visibleIds.includes(selected.id))setVisibleIds(ids=>[...ids,selected.id])
  },[selected?.id]) // eslint-disable-line react-hooks/exhaustive-deps

  const selectedIndex=Math.max(0,p.currentFrame?p.frames.findIndex(frame=>frame.id===p.currentFrame?.id):0)
  const observation=p.currentFrame&&selected?getSignalObservation(selected.id,p.currentFrame,p.frames[selectedIndex-1]):undefined
  const interfaces=selected?getSignalInterfaces(selected.id):[]
  const toggle=(id:string)=>setVisibleIds(ids=>ids.includes(id)?ids.filter(item=>item!==id):[...ids,id])
  const select=(id:string)=>p.onSelectSignal(id)
  const setGroup=(items:SignalDefinition[],visible:boolean)=>setVisibleIds(ids=>visible?[...new Set([...ids,...items.map(item=>item.id)])]:ids.filter(id=>!items.some(item=>item.id===id)))
  const group=(key:string,title:string,items:SignalDefinition[])=><details className="monitor-signal-group" open={openGroups.includes(key)} onToggle={event=>{const isOpen=event.currentTarget.open;setOpenGroups(groups=>isOpen?[...new Set([...groups,key])]:groups.filter(item=>item!==key))}}><summary><b>{title}</b><span>{items.length}개</span></summary><header>{items.length>0&&<span><button type="button" onClick={()=>setGroup(items,true)}>전체 선택</button><button type="button" onClick={()=>setGroup(items,false)}>전체 해제</button></span>}</header>{items.length?items.map(signal=><label key={signal.id} title={signal.description}><input type="checkbox" checked={visibleIds.includes(signal.id)} onChange={()=>toggle(signal.id)}/><button type="button" aria-pressed={selected?.id===signal.id} onClick={()=>select(signal.id)}><code className="investigation-tech-id">{signal.id}</code></button></label>):<p>등록된 관측 신호 없음</p>}</details>
  const visibleSignals=available.filter(signal=>visibleIds.includes(signal.id))

  return <div className="signal-monitor-workspace">
    <section className="monitor-heading">
      <div><p className="investigation-section-label">Signal Monitor · 사건 신호 비교</p><h3>현재 기능 · <code className="investigation-tech-id">{architectureNode(p.selectedComponent)?.label??p.selectedComponent}</code></h3></div>
      <p className="tool-question">상태·입력·출력 중 어디서부터 차이가 생기나요?</p>
    </section>
    <div className="monitor-selection-note"><span>모니터링 대상 기능은 기능 흐름에서 선택할 수 있습니다.</span><button type="button" onClick={()=>p.onNavigateToComponent(p.selectedComponent)}>기능 흐름에서 선택</button></div>

    <div className="monitor-signal-groups">{group('state','A. 전제조건 / 상태',states)}{group('input','B. 기능 입력',valueInputs)}{group('output','C. 기능 출력',outputs)}</div>

    {selected&&<section className="signal-identity-card" aria-label="선택 신호 의미와 위치"><header><div><p className="investigation-section-label">SELECTED SIGNAL IDENTITY</p><h3>{selected.description??selected.label}</h3></div><code className="investigation-tech-id">{selected.id}</code></header><dl><div><dt>역할</dt><dd>{selected.semanticRole==='STATE_OR_PRECONDITION'?'상태 / 전제조건':'기능 값'}</dd></div><div><dt>Domain</dt><dd>{architectureNode(p.selectedComponent)?.area??'—'}</dd></div><div><dt>단위</dt><dd>{selected.unit??'상태값'}</dd></div><div><dt>등록 기준</dt><dd>{selected.comparisonBasis.kind==='EXPECTED_TRAJECTORY'?'현재 조건의 Expected trajectory':selected.comparisonBasis.kind==='VALID_RANGE'?`${selected.comparisonBasis.min}–${selected.comparisonBasis.max} ${selected.unit??''}`:selected.comparisonBasis.kind==='ALLOWED_STATE'?selected.comparisonBasis.allowed.join(' / '):selected.comparisonBasis.kind==='REQUIREMENT_CONDITION'?selected.comparisonBasis.requirementIds.join(', '):'Actual observation only · Expected 미등록'}</dd></div></dl><div className="signal-path-strip"><span>{selected.producerIds.map(id=>architectureNode(id)?.label??id).join(' · ')||'외부/관찰 Source'}</span><i>→</i><code>{selected.id}</code><i>→</i><span>{selected.consumerIds.map(id=>architectureNode(id)?.label??id).join(' · ')||'등록된 Destination 없음'}</span><i>→</i><span>downstream behavior</span></div></section>}

    <SynchronizedTimeline frames={p.frames} signals={visibleSignals} selectedIndex={selectedIndex} onSelectFrame={p.onSelectFrameIndex}/>

    <section className="monitor-selected-summaries compact"><p className="investigation-section-label">선택 신호 요약</p><div>{visibleSignals.map(signal=>{const comparison=p.currentFrame?compareSignalAtFrame(signal.id,p.selectedComponent,p.currentFrame,p.frames[selectedIndex-1]):undefined;return <article key={signal.id}><code className="investigation-tech-id">{signal.id}</code><span><b>Actual</b> {comparison?.actual??'—'}</span><span className={`signal-summary-status ${comparison?.status?.toLowerCase()}`}>{comparison?.status==='MATCH'?'기준과 일치':comparison?.status==='MISMATCH'?'차이 확인':'판단 불가'}</span></article>})}</div></section>

    <div className="monitor-lower-grid">
      <section className="monitor-signal-detail">
        <p className="investigation-section-label">선택 신호</p><h3><code className="investigation-tech-id">{selected?.id??'—'}</code></h3>
        {(()=>{const comparison=p.currentFrame&&selected?compareSignalAtFrame(selected.id,p.selectedComponent,p.currentFrame,p.frames[selectedIndex-1]):undefined;return <dl><div><dt>Actual · 사건 기록</dt><dd>{comparison?.actual??`${format(observation?.actual.value)} ${selected?.unit??''}`}</dd></div><div><dt>판정 기준</dt><dd>{comparison?.criterionKind==='NONE'?'판정 기준 미지원':`${comparison?.criterionLabel} · ${comparison?.criterionValue}`}</dd></div><div><dt>관찰 결과</dt><dd>{comparison?.status==='MATCH'?'기준과 일치':comparison?.status==='MISMATCH'?'차이 확인':'판단 불가'}</dd></div></dl>})()}
        <section className="monitor-signal-meaning"><p className="investigation-prose">{selected?.description??'등록된 설명 없음'}</p><dl className="monitor-signal-facts"><div><dt>Source 기능</dt><dd>{selected?.producerIds.map(id=>architectureNode(id)?.label??id).join(', ')||'—'}</dd></div><div><dt>Destination 기능</dt><dd>{selected?.consumerIds.map(id=>architectureNode(id)?.label??id).join(', ')||'—'}</dd></div><div><dt>단위</dt><dd>{selected?.unit??'상태값'}</dd></div></dl></section>
        <div className="evidence-save-control"><span className="comparison-actions"><button type="button" onClick={()=>selected&&p.onCompareSignal(selected.id)}>비교 결과 확인</button><button type="button" className="save-comparison-button" onClick={()=>{if(selected){p.onSaveAsEvidence(selected.id);setSavedSignal(selected.id)}}}>이 관찰을 근거에 추가</button></span>{savedSignal===selected?.id&&<small role="status">✓ 조사 노트에 기록됨 · 보고서에는 아직 미포함</small>}</div>
      </section>
      <aside className="adjacent-observation-guide"><p className="investigation-section-label">다음 조사</p><h3>인접 값 확인</h3><div>{selected?.producerIds.map(id=><button type="button" key={`producer:${id}`} onClick={()=>p.onNavigateToComponent(id)}>Source 기능 · {architectureNode(id)?.label??id}</button>)}{selected?.consumerIds.map(id=><button type="button" key={`consumer:${id}`} onClick={()=>p.onNavigateToComponent(id)}>Destination 기능 · {architectureNode(id)?.label??id}</button>)}{interfaces.length>0&&<button type="button" onClick={p.onNavigateToInterfaces}>전달 경계 비교</button>}<button type="button" onClick={p.onNavigateToStandards}>관련 요구사항 확인</button></div></aside>
    </div>
  </div>
}

function SynchronizedTimeline({frames,signals,selectedIndex,onSelectFrame}:{frames:readonly IncidentFrame[];signals:SignalDefinition[];selectedIndex:number;onSelectFrame:(index:number)=>void}) {
  const [hoverIndex,setHoverIndex]=useState<number|null>(null)
  const width=820,left=150,right=18,rowHeight=78,top=18,bottom=30,height=Math.max(156,top+signals.length*rowHeight+bottom)
  const x=(index:number)=>left+(index/Math.max(1,frames.length-1))*(width-left-right)
  const indexAt=(event:MouseEvent<SVGSVGElement>)=>{const rect=event.currentTarget.getBoundingClientRect(),svgX=(event.clientX-rect.left)/rect.width*width,ratio=Math.max(0,Math.min(1,(svgX-left)/(width-left-right)));return Math.round(ratio*Math.max(0,frames.length-1))}
  const choose=(event:MouseEvent<SVGSVGElement>)=>onSelectFrame(indexAt(event))
  const hoverFrame=hoverIndex===null?undefined:frames[hoverIndex]
  return <section className="monitor-timeline-sheet"><header><div><p className="investigation-section-label">통합 신호 분석</p><h3>하나의 시간축에서 비교</h3><details className="monitor-reading-help"><summary>그래프 읽는 법</summary><small>각 행은 단위별 독립 스케일을 사용하며 물리 크기를 서로 직접 비교하지 않습니다.</small></details><div className="monitor-series-key">{signals.map((signal,index)=><span key={signal.id} style={{'--series-color':seriesColors[index%seriesColors.length]} as CSSProperties}><i aria-hidden="true"/><code>{signal.id}</code></span>)}</div></div><div className="monitor-legend"><span className="actual">Actual</span><span className="expected">Expected</span><span className="cursor">재생 커서</span></div></header>
    {signals.length?<div className="monitor-plot-wrap"><svg viewBox={`0 0 ${width} ${height}`} onClick={choose} onMouseMove={event=>setHoverIndex(indexAt(event))} onMouseLeave={()=>setHoverIndex(null)} role="img" aria-label="선택 신호의 동기화 시간 흐름">
      {signals.map((signal,row)=><SignalTrack key={signal.id} signal={signal} frames={frames} row={row} x={x} left={left} right={right} width={width} top={top} rowHeight={rowHeight}/>)}
      <line className="monitor-event-marker event-marker" x1={x(frames.length-1)} x2={x(frames.length-1)} y1={top} y2={height-bottom}/><text className="monitor-event-label" x={x(frames.length-1)-4} y={12} textAnchor="end">사건</text>
      <line className="monitor-cursor selected-time-marker" x1={x(selectedIndex)} x2={x(selectedIndex)} y1={top} y2={height-bottom}/>
      <text className="monitor-axis-label" x={left} y={height-8}>{frames[0]?.sw.executionTime.toFixed(2)??'0.00'} s</text><text className="monitor-axis-label" x={width-right} y={height-8} textAnchor="end">{frames.at(-1)?.sw.executionTime.toFixed(2)??'0.00'} s</text>
      {hoverIndex!==null&&<line className="monitor-hover-line" x1={x(hoverIndex)} x2={x(hoverIndex)} y1={top} y2={height-bottom}/>}</svg>{hoverFrame&&<div className="monitor-hover-readout"><b>{hoverFrame.sw.executionTime.toFixed(3)} s</b>{signals.map(signal=>{const value=getSignalObservation(signal.id,hoverFrame,frames[Math.max(0,hoverIndex!-1)]);return <span key={signal.id}><code>{signal.id}</code> Actual {format(value.actual.value)}{value.expected&&<> · Expected {format(value.expected.value)}</>}</span>})}</div>}</div>:<div className="monitor-empty-track">왼쪽에서 표시할 신호를 선택하세요.</div>}
  </section>
}

function SignalTrack({signal,frames,row,x,left,right,width,top,rowHeight}:{signal:SignalDefinition;frames:readonly IncidentFrame[];row:number;x:(index:number)=>number;left:number;right:number;width:number;top:number;rowHeight:number}) {
  const observations=frames.map((frame,index)=>getSignalObservation(signal.id,frame,frames[index-1]))
  const actual=observations.map(item=>item.actual.value)
  const expected=observations.map(item=>item.expected?.value)
  const capability=getSignalTimelineCapability(signal.id,frames)
  const yTop=top+row*rowHeight+13,yBottom=yTop+42
  const numeric=actual.some(item=>typeof item==='number')
  const values=[...actual,...expected].filter((item):item is number=>typeof item==='number')
  const rawMin=values.length?Math.min(...values):0,rawMax=values.length?Math.max(...values):1,span=Math.max(1e-6,rawMax-rawMin)
  const y=(value:number)=>yTop+(rawMax-value)/span*(yBottom-yTop)
  const numericPoints=(series:(SignalValue|undefined)[])=>series.map((item,index)=>typeof item==='number'?`${x(index).toFixed(1)},${y(item).toFixed(1)}`:null).filter((item):item is string=>typeof item==='string').join(' ')
  const firstDifference=observations.findIndex(item=>typeof item.actual.value==='number'&&typeof item.expected?.value==='number'&&Math.abs(item.actual.value-item.expected.value)>1e-6)
  const categories=[...new Set([...actual,...expected].filter((item):item is string|boolean=>typeof item==='string'||typeof item==='boolean').map(String))]
  const stateY=(item:SignalValue|undefined)=>{const index=categories.indexOf(String(item));return yTop+(Math.max(0,index)/Math.max(1,categories.length-1))*(yBottom-yTop)}
  const stepPath=(series:(SignalValue|undefined)[])=>series.reduce<string>((path,item,index)=>{if(item==null)return path;const px=x(index),py=stateY(item);if(!path)return `M ${px} ${py}`;return `${path} H ${px} V ${py}`},'')
  return <g className="monitor-track" style={{'--series-color':seriesColors[row%seriesColors.length]} as CSSProperties}>
    <rect x={0} y={top+row*rowHeight} width={width} height={rowHeight-4}/><text className="monitor-track-id" x={8} y={yTop+4}>{signal.id}</text><text className="monitor-track-unit" x={8} y={yTop+19}>{signal.unit??(capability==='STATE_TIMELINE'?'상태':'')}</text>
    <line className="monitor-track-baseline" x1={left} x2={width-right} y1={yBottom} y2={yBottom}/>
    {firstDifference>=0&&<rect className="difference-region" x={x(firstDifference)} y={yTop} width={Math.max(0,width-right-x(firstDifference))} height={yBottom-yTop}/>} 
    {numeric?<><polyline className="monitor-actual-line actual-series" points={numericPoints(actual)}/>{capability==='COMPARE_TIMELINE'&&<polyline className="monitor-expected-line expected-series" points={numericPoints(expected)}/>}</>:<><path className="monitor-state-line" d={stepPath(actual)}/>{capability==='COMPARE_TIMELINE'&&<path className="monitor-expected-state" d={stepPath(expected)}/>}<text className="monitor-state-label" x={width-right} y={yTop+8} textAnchor="end">{format(actual.at(-1))}</text></>}
  </g>
}
