import { useMemo, useRef, useState } from 'react'
import './requirement-map.css'
import { propulsionRequirements as requirements, propulsionTests as tests } from '../../data/ground-truth/PropulsionGroundTruth'
import type { XRayNodeId } from '../../data/ground-truth/PropulsionGroundTruth'

type Node = { id: string; label: string; kind: string; x: number; y: number; caption: string }
type Edge = { from: string; to: string; kind: 'group' | 'trace' | 'test' }
const W = 206, H = 64

function buildMap(view: 'domain' | 'component') {
  const nodes: Node[] = [{ id: 'vehicle', label: 'Vehicle Motion', kind: 'SYSTEM CONTEXT', x: 20, y: 40, caption: '시스템 묶음 · 요구사항 아님' }]
  const edges: Edge[] = []
  const groups = view === 'domain' ? ['Propulsion', 'Gear'] : [...new Set(requirements.map(r => r.allocatedComponent))]
  let row = 0
  for (const group of groups) {
    const members = requirements.filter(r => view === 'domain' ? (r.id.includes('-GEAR-') ? 'Gear' : 'Propulsion') === group : r.allocatedComponent === group)
    const system = members.filter(r => r.level === 'SYSTEM')
    const software = members.filter(r => r.level === 'SOFTWARE')
    const size = Math.max(system.length, software.length, 1)
    const y = 40 + row * 86
    nodes.push({ id: group, label: group, kind: view === 'domain' ? 'DOMAIN' : group === 'VehiclePhysics' ? 'PLANT / ADAPTER' : 'COMPONENT', x: 280, y, caption: view === 'domain' ? '기능 도메인 묶음' : 'Allocated Component 기준' })
    edges.push({ from: 'vehicle', to: group, kind: 'group' })
    for (const [column, membersAtLevel] of [system, software].entries()) {
      membersAtLevel.forEach((r, i) => {
        nodes.push({ id: r.id, label: r.id, kind: column === 0 ? 'SYSR' : 'SWR', x: 570 + column * 310, y: 40 + (row + i) * 86, caption: r.statement })
        if (view === 'component' || column === 0) edges.push({ from: group, to: r.id, kind: 'group' })
      })
    }
    row += size + 1
  }
  const ids = [...new Set(requirements.flatMap(r => r.linkedTestCases))]
  ids.forEach((id, i) => nodes.push({ id, label: id, kind: 'TC', x: 1220, y: 40 + i * 86, caption: tests.find(t => t.id === id)?.testObject ?? '참조 ID · 상세 정의 미연결' }))
  for (const r of requirements) {
    if (r.level === 'SYSTEM') {
      for (const s of requirements.filter(s => s.level === 'SOFTWARE' && (r.linkedRequirements.includes(s.id) || s.linkedRequirements.includes(r.id)))) edges.push({ from: r.id, to: s.id, kind: 'trace' })
    }
    for (const id of r.linkedTestCases) edges.push({ from: r.id, to: id, kind: 'test' })
  }
  return { nodes, edges, width: 1470, height: Math.max(row * 86 + 80, ids.length * 86 + 110) }
}

export function RequirementMap({ onComponent }: { onComponent: (id: XRayNodeId) => void }) {
  const [view, setView] = useState<'domain' | 'component'>('domain')
  const [selected, setSelected] = useState('SYSR-PROP-007')
  const [zoom, setZoom] = useState(0.65)
  const [connectedOnly, setConnectedOnly] = useState(false)
  const viewport = useRef<HTMLDivElement>(null)
  const drag = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const graph = useMemo(() => buildMap(view), [view])
  const byId = new Map(graph.nodes.map(n => [n.id, n]))
  const related = new Set([selected])
  graph.edges.filter(e => e.from === selected || e.to === selected).forEach(e => { related.add(e.from); related.add(e.to) })
  const req = requirements.find(r => r.id === selected)
  const test = tests.find(t => t.id === selected)
  const node = byId.get(selected)
  const select = (n: Node) => { setSelected(n.id); const r = requirements.find(r => r.id === n.id); if (r) onComponent(r.allocatedComponent) }
  const locate = () => { const el = viewport.current; const n = byId.get(selected); if (el && n) el.scrollTo({ left: (n.x + W / 2) * zoom - el.clientWidth / 2, top: (n.y + H / 2) * zoom - el.clientHeight / 2 }) }
  return <div className="requirement-map">
    <div className="req-map-toolbar"><div aria-label="관점"><button aria-pressed={view === 'domain'} onClick={() => setView('domain')}>도메인별</button><button aria-pressed={view === 'component'} onClick={() => setView('component')}>제어기별</button></div><span>빈 공간 드래그 · 노드 선택</span><div><button aria-label="축소" onClick={() => setZoom(z => Math.max(.3, z - .1))}>−</button><output>{Math.round(zoom * 100)}%</output><button aria-label="확대" onClick={() => setZoom(z => Math.min(1.5, z + .1))}>+</button><button onClick={locate}>선택 위치</button><button onClick={() => { setZoom(.5); viewport.current?.scrollTo(0, 0) }}>처음 위치</button></div></div>
    <div className="req-map-legend"><span>점선: 소속</span><span>실선 →: SYSR/SWR 추적</span><span>보라색 →: 검증 연결</span><button aria-pressed={connectedOnly} onClick={() => setConnectedOnly(v => !v)}>선택 연결만 강조</button></div>
    <div className="req-map-viewport" ref={viewport} tabIndex={0} aria-label="요구사항 지도. 빈 공간을 드래그하거나 스크롤해 이동" onPointerDown={e => {
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
    <section className="req-map-detail" aria-live="polite"><header><b>{selected}</b><span>{node?.kind}</span></header>{req ? <><p>{req.statement}</p><div>할당: {req.allocatedComponent} · {req.provenance} · {req.status}</div><div>연결 시험: {req.linkedTestCases.join(' · ')}</div></> : test ? <><p>시험 정의 · 현재 주행의 PASS/FAIL 판정이 아닙니다.</p><dl>{[['검증 수준', test.verificationLevel], ['시험 대상', test.testObject], ['전제', test.precondition], ['자극', test.stimulus], ['관찰', test.observation], ['기대 결과', test.expectedResult]].map(([label, value]) => <div key={label}><dt>{label}</dt><dd>{value}</dd></div>)}</dl></> : <p>{node?.kind === 'TC' ? '이 ID의 연결은 등록되어 있지만 현재 UI 데이터에 시험 상세 정의가 없습니다.' : '탐색용 소속 묶음입니다. 승인된 최상위 요구사항을 의미하지 않습니다.'}</p>}</section>
  </div>
}

