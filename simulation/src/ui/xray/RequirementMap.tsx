import { requirementFocus } from './requirementFocus'
import { useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react'
import './requirement-map.css'
import { propulsionRequirements as requirements, propulsionTests as tests } from '../../data/ground-truth/PropulsionGroundTruth'
import type { XRayNodeId } from '../../data/ground-truth/PropulsionGroundTruth'
import normalEvidence from '../../../docs/evidence/c-normal-evidence.json'
import plantEvidence from '../../../docs/evidence/c-plant-evidence.json'
import buildInfo from '../../runtime/c/generated/build.json'

const benchEvidence = [...normalEvidence.evidence, ...plantEvidence.evidence]
function TestEvidence({selected}:{selected:string}) {
  const records=benchEvidence.filter(record=>record.testCaseId===selected||record.requirementIds.includes(selected))
  if(!records.length)return null
  const current=normalEvidence.binaryHash===buildInfo.binaryHash&&plantEvidence.binaryHash===buildInfo.binaryHash
  return <details className="c-test-evidence"><summary>C 검증 기록 · {records.length}건 · {current?'현재 빌드':'다른 빌드'}</summary><p>저장된 시험 실행 결과입니다. 현재 주행의 고장 판정이 아닙니다.</p>{records.map((record,i)=><details key={i}><summary>{record.testCaseId} · {record.verdict}</summary><p>{record.testObject}</p><p>{record.requirementIds.join(' · ')}</p><pre>{JSON.stringify({input:record.input,expected:record.expected,actual:record.actual},null,2)}</pre></details>)}</details>
}

type Node = { id: string; label: string; kind: string; x: number; y: number; caption: string }
type Edge = { from: string; to: string; kind: 'group' | 'trace' | 'test' }
const W = 206, H = 64

function buildMap(view: 'domain' | 'component') {
  const nodes: Node[] = [{ id: 'vehicle', label: 'Vehicle System', kind: 'SYSTEM', x: 20, y: 40, caption: '차량 시스템 · 탐색 분류' }]
  const edges: Edge[] = []
  for(const [i,id] of ['POWERTRAIN','PLANT'].entries()){nodes.push({id:'area:'+id,label:id,kind:'기능 영역',x:280,y:40+i*1200,caption:id==='PLANT'?'차량 물리':'기어 · 추진'});edges.push({from:'vehicle',to:'area:'+id,kind:'group'})}
  const groups = view === 'domain' ? ['POWERTRAIN', 'Vehicle Dynamics'] : [...new Set(requirements.map(r => r.allocatedComponent))]
  let row = 0
  for (const group of groups) {
    const members = requirements.filter(r => view === 'domain'
      ? (group === 'Vehicle Dynamics' ? r.allocatedComponent === 'VehiclePhysics' : r.allocatedComponent !== 'VehiclePhysics')
      : r.allocatedComponent === group)
    const system = members.filter(r => r.level === 'SYSTEM')
    const software = members.filter(r => r.level === 'SOFTWARE')
    const size = Math.max(system.length, software.length, 1)
    const y = 40 + row * 86
    nodes.push({ id: group, label: group, kind: group === 'Vehicle Dynamics' || group === 'VehiclePhysics' ? 'PLANT / ADAPTER' : view === 'domain' ? 'DOMAIN' : 'COMPONENT', x: 570, y, caption: view === 'domain' ? '탐색용 분류 · 요구사항 아님' : 'Allocated Component 기준' })
    edges.push({ from: group==='VehiclePhysics'?'area:PLANT':'area:POWERTRAIN', to: group, kind: 'group' })
    for (const [column, membersAtLevel] of [system, software].entries()) {
      membersAtLevel.forEach((r, i) => {
        nodes.push({ id: r.id, label: r.id, kind: column === 0 ? 'SYSR' : 'SWR', x: 860 + column * 310, y: 40 + (row + i) * 86, caption: r.statement })
        if (column === 1) {
          nodes.push({ id: `allocation:${r.id}`, label: r.allocatedComponent, kind: r.allocatedComponent === 'VehiclePhysics' ? 'PLANT / ADAPTER ALLOCATION' : 'SW ALLOCATION', x: 1480, y: 40 + (row + i) * 86, caption: r.id })
          edges.push({ from: r.id, to: `allocation:${r.id}`, kind: 'trace' })
        }
        if (view === 'component' || column === 0) edges.push({ from: group, to: r.id, kind: 'group' })
      })
    }
    row += size + 1
  }
  const ids = [...new Set(requirements.flatMap(r => r.linkedTestCases))]
  ids.forEach((id, i) => nodes.push({ id, label: id, kind: 'TC', x: 1790, y: 40 + i * 86, caption: tests.find(t => t.id === id)?.testObject ?? '참조 ID · 상세 정의 미연결' }))
  for (const r of requirements) {
    if (r.level === 'SYSTEM') {
      for (const s of requirements.filter(s => s.level === 'SOFTWARE' && (r.linkedRequirements.includes(s.id) || s.linkedRequirements.includes(r.id)))) edges.push({ from: r.id, to: s.id, kind: 'trace' })
    }
    for (const id of r.linkedTestCases) edges.push({ from: r.level === 'SOFTWARE' ? `allocation:${r.id}` : r.id, to: id, kind: 'test' })
  }
  return { nodes, edges, width: 2040, height: Math.max(row * 86 + 80, ids.length * 86 + 110) }
}

export function RequirementMap({ onComponent, embedded = false, initialRequirement = 'SYSR-PROP-007', onRequirement, onTest, componentFilter }: { componentFilter?: string; onComponent: (id: XRayNodeId) => void; embedded?: boolean; initialRequirement?: string; onRequirement?: (id: string) => void; onTest?: (id:string)=>void }) {
  const view = 'component' as const
  const [selected, setSelected] = useState(initialRequirement)
  const [zoom, setZoom] = useState(.3)
  const [connectedOnly, setConnectedOnly] = useState(false)
  useEffect(()=>{setSelected(initialRequirement)},[initialRequirement])
  const viewport = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const fullGraph = useMemo(() => buildMap(view), [view])
  const graph = useMemo(() => {
    if(!connectedOnly && !componentFilter) return fullGraph
    const related = componentFilter && !connectedOnly ? new Set(requirements.filter(r=>r.allocatedComponent===componentFilter).flatMap(r=>[...requirementFocus(r.id, fullGraph.edges)])) : requirementFocus(selected, fullGraph.edges)
    const nodes = fullGraph.nodes.filter(n=>related.has(n.id)).map(n=>({...n}))
    const columns=[...new Set(nodes.map(n=>n.x))].sort((a,b)=>a-b)
    for(const [column,x] of columns.entries()) nodes.filter(n=>n.x===x).sort((a,b)=>a.y-b.y).forEach((n,i)=>{n.x=20+column*280;n.y=40+i*94})
    return {nodes,edges:fullGraph.edges.filter(e=>related.has(e.from)&&related.has(e.to)&&e.kind!=='group'),width:columns.length*280+20,height:Math.max(220,...columns.map((_,i)=>nodes.filter(n=>n.x===20+i*280).length*94+60))}
  }, [fullGraph,connectedOnly,selected,componentFilter])
  const byId = new Map(graph.nodes.map(n => [n.id, n]))
  const related = requirementFocus(selected,fullGraph.edges)
  const req = requirements.find(r => r.id === selected)
  const test = tests.find(t => t.id === selected)
  const node = byId.get(selected)
  const select = (n: Node) => { setSelected(n.id); if(n.kind==='SYSR'||n.kind==='SWR'||n.kind==='TC')setConnectedOnly(true); if(n.kind==='TC')onTest?.(n.id); const r = requirements.find(r => r.id === n.id || `allocation:${r.id}` === n.id); if (r) { onComponent(r.allocatedComponent); if (n.id === r.id) onRequirement?.(r.id) } }
  const locate = () => { const el = viewport.current; const n = byId.get(selected); if (el && n) el.scrollTo({ left: (n.x + W / 2) * zoom - el.clientWidth / 2, top: (n.y + H / 2) * zoom - el.clientHeight / 2 }) }
  const pendingScroll=useRef<{left:number;top:number}|null>(null)
  const zoomRef=useRef(zoom); zoomRef.current=zoom
  const fit=()=>{ const el=viewport.current;if(el){setZoom(Math.max(.05,Math.min(1,(el.clientWidth-16)/graph.width,(el.clientHeight-16)/graph.height)));el.scrollTo(0,0)} }
  useLayoutEffect(()=>{
    const el=viewport.current;if(!el)return
    const resize=()=>{setZoom(Math.max(.05,Math.min(1,(el.clientWidth-16)/graph.width,(el.clientHeight-16)/graph.height)));el.scrollTo(0,0)}
    resize()
  },[graph])
  useLayoutEffect(()=>{const target=pendingScroll.current;if(target&&viewport.current){viewport.current.scrollTo(target.left,target.top);pendingScroll.current=null}},[zoom])
  useEffect(()=>{
    const el=viewport.current;if(!el)return
    const wheel=(e:WheelEvent)=>{e.preventDefault();const z=zoomRef.current;const next=Math.max(.05,Math.min(2,z*Math.exp(-e.deltaY*.002)));const r=el.getBoundingClientRect();const x=e.clientX-r.left,y=e.clientY-r.top;pendingScroll.current={left:(el.scrollLeft+x)/z*next-x,top:(el.scrollTop+y)/z*next-y};setZoom(next)}
    el.addEventListener('wheel',wheel,{passive:false});return()=>el.removeEventListener('wheel',wheel)
  },[])
  return <div className={`requirement-map ${embedded ? 'embedded' : ''}`}>
    <div className="req-map-toolbar"><b>차량 시스템 · 요구사항 지도</b><span>휠 확대/축소 · 빈 공간 드래그</span><div><button aria-label="축소" onClick={() => setZoom(z => Math.max(.05, z / 1.2))}>−</button><output>{Math.round(zoom * 100)}%</output><button aria-label="확대" onClick={() => setZoom(z => Math.min(2, z * 1.2))}>+</button><button onClick={locate}>선택 위치</button><button onClick={()=>{if(connectedOnly)setConnectedOnly(false);else fit()}}>전체 보기</button></div></div>
    <div className="req-map-legend"><span>점선: 기능 분류 · 실선: 요구사항 추적 · 보라색: 시험 연결</span><button aria-pressed={connectedOnly} onClick={() => setConnectedOnly(v => !v)}>선택 항목과 연결된 내용</button></div>
    <div className="req-map-viewport" ref={viewport} tabIndex={0} aria-label="요구사항 지도. 빈 공간 드래그로 이동, 마우스 휠로 확대 및 축소" onPointerDown={e => {
      if (e.button !== 0 || (e.target as Element).closest('button')) return
      const el = e.currentTarget; drag.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }; el.setPointerCapture(e.pointerId); el.classList.add('panning')
    }} onPointerMove={e => { const d = drag.current; if (d) { e.currentTarget.scrollLeft = d.left - (e.clientX - d.x); e.currentTarget.scrollTop = d.top - (e.clientY - d.y) } }} onPointerUp={e => { drag.current = null; e.currentTarget.classList.remove('panning'); if (e.currentTarget.hasPointerCapture(e.pointerId)) e.currentTarget.releasePointerCapture(e.pointerId) }} onPointerCancel={e => { drag.current = null; e.currentTarget.classList.remove('panning') }}>
      <div style={{ width: graph.width * zoom, height: graph.height * zoom }}><div className="req-map-world" style={{ width: graph.width, height: graph.height, transform: `scale(${zoom})` }}>
        <svg width={graph.width} height={graph.height} aria-hidden="true"><defs><marker id="req-arrow" markerWidth="7" markerHeight="7" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6" fill="none" stroke="context-stroke"/></marker></defs>{graph.edges.map(e => {
          const a = byId.get(e.from)!, b = byId.get(e.to)!, x = a.x + W, y = a.y + H / 2, endY = b.y + H / 2
          return <path key={`${e.from}:${e.to}:${e.kind}`} className={`edge-${e.kind} ${e.from === selected || e.to === selected ? 'highlight' : connectedOnly ? 'dim' : ''}`} d={`M${x},${y} C${x + 90},${y} ${b.x - 90},${endY} ${b.x},${endY}`} markerEnd={e.kind === 'group' ? undefined : 'url(#req-arrow)'}/>
        })}</svg>
        {graph.nodes.map(n => <button key={n.id} className={`req-map-node ${n.kind === 'TC' ? 'test' : ''} ${selected === n.id ? 'selected' : ''} ${connectedOnly && !related.has(n.id) ? 'dim' : ''}`} style={{ left: n.x, top: n.y, width: W, height: H }} title={`${n.label}\n${n.caption}`} onClick={() => select(n)}><small>{n.kind}</small><b>{n.label}</b><span>{n.caption}</span></button>)}
      </div></div>
    </div>
    {!embedded && <section className="req-map-detail" aria-live="polite"><header><b>{selected}</b><span>{node?.kind}</span></header>{req ? <><p>{req.statement}</p><div>할당: {req.allocatedComponent} · {req.provenance} · {req.status}</div><div>연결 시험: {req.linkedTestCases.join(' · ')}</div></> : test ? <><p>시험 정의 · 현재 주행의 PASS/FAIL 판정이 아닙니다.</p><dl>{[['검증 수준', test.verificationLevel], ['시험 대상', test.testObject], ['전제', test.precondition], ['자극', test.stimulus], ['관찰', test.observation], ['기대 결과', test.expectedResult]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></> : <p>{node?.kind === 'TC' ? '이 ID의 연결은 등록되어 있지만 현재 UI 데이터에 시험 상세 정의가 없습니다.' : '탐색용 소속 묶음입니다. 승인된 최상위 요구사항을 의미하지 않습니다.'}</p>}<TestEvidence selected={selected}/></section>}
  </div>
}



