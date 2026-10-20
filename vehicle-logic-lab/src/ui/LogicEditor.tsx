import { useRef, useState } from 'react'
import type { PointerEvent } from 'react'
import { BLOCKS, valueKey } from '../engine/registry.ts'
import { connect } from '../engine/graph.ts'
import type { Block, BlockKind, Graph, Snapshot } from '../engine/types.ts'
import { INPUTS, OUTPUTS, STATES } from '../content/ready.ts'
import { BlockSymbol } from '../game/GuidedBoard'

const WIDTH = 192
const portY = (i: number) => 67 + i * 30
type Drag = { id: string; mouseX: number; mouseY: number; x: number; y: number; left: number; top: number }
export function LogicEditor({ graph, snapshot, allowed, onChange, failedNodes }: {
  graph: Graph; snapshot: Snapshot; allowed: BlockKind[]; onChange: (graph: Graph) => void; failedNodes: string[]
}) {
  const [selected, setSelected] = useState<string>()
  const [pending, setPending] = useState<{ node: string; port: string }>()
  const [zoom, setZoom] = useState(.7)
  const [drag, setDrag] = useState<Drag>()
  const [message, setMessage] = useState('출력 포트를 선택한 뒤 입력 포트를 누르세요.')
  const history = useRef<{ past: Graph[]; future: Graph[] }>({ past: [], future: [] })
  const viewport = useRef<HTMLDivElement>(null)
  const pan = useRef<{ x: number; y: number; left: number; top: number } | null>(null)
  const maxX = Math.max(1200, ...graph.nodes.map(n => n.x + WIDTH + 60))
  const maxY = Math.max(700, ...graph.nodes.map(n => n.y + 210))
  const position = (node: Block) => drag?.id === node.id ? { x: drag.left, y: drag.top } : node
  const commit = (next: Graph) => {
    history.current.past.push(structuredClone(graph)); history.current.future = []
    onChange(next)
  }
  const undo = () => {
    const previous = history.current.past.pop()
    if (previous) { history.current.future.push(structuredClone(graph)); onChange(previous); setPending(undefined) }
  }
  const redo = () => {
    const next = history.current.future.pop()
    if (next) { history.current.past.push(structuredClone(graph)); onChange(next); setPending(undefined) }
  }
  const add = (kind: BlockKind) => {
    if (graph.nodes.length >= 100) { setMessage('이 작업 공간은 블록 100개까지 지원합니다. 사용하지 않는 블록을 삭제하세요.'); return }
    const id = crypto.randomUUID()
    const key = kind === 'input' ? 'brake' : kind === 'state' ? 'STANDBY' : kind === 'output' ? 'request' : undefined
    const x = Math.round(((viewport.current?.scrollLeft ?? 0) + 140) / zoom)
    const y = Math.round(((viewport.current?.scrollTop ?? 0) + 160) / zoom)
    commit({ ...graph, nodes: [...graph.nodes, { id, kind, label: BLOCKS[kind].name, x, y, key }] })
    setSelected(id); setMessage('블록을 추가했습니다. 제목을 드래그해 이동할 수 있어요.')
  }
  const remove = () => {
    if (!selected) return
    commit({ nodes: graph.nodes.filter(n => n.id !== selected), edges: graph.edges.filter(e => e.id !== selected && e.from !== selected && e.to !== selected) })
    setSelected(undefined); setPending(undefined)
  }
  const link = (node: string, port: string) => {
    if (!pending) { setMessage('먼저 오른쪽의 출력 포트를 선택하세요.'); return }
    try {
      commit(connect(graph, { id: crypto.randomUUID(), from: pending.node, out: pending.port, to: node, in: port }))
      setMessage('연결했습니다. 같은 입력에 다시 연결하면 교체됩니다.'); setPending(undefined)
    } catch (error) { setMessage(error instanceof Error ? error.message : '연결할 수 없습니다.'); setPending(undefined) }
  }
  const dragStart = (e: PointerEvent, node: Block) => {
    if (e.button !== 0) return
    e.stopPropagation(); e.currentTarget.setPointerCapture(e.pointerId)
    setSelected(node.id); setDrag({ id: node.id, mouseX: e.clientX, mouseY: e.clientY, x: node.x, y: node.y, left: node.x, top: node.y })
  }
  const selectedNode = graph.nodes.find(n => n.id === selected)
  return <div className="editor-shell">
    <aside className="toolbox"><div className="panel-label">블록 라이브러리</div><p>클릭해서 추가</p>
      {allowed.map(kind => <button className={`tool tool-${kind}`} key={kind} onClick={() => add(kind)}><span className="tool-icon">{({ input: '↗', and: '&', or: '≥1', not: '!', state: '◉', transition: '⇢', output: '↘' })[kind]}</span><span><b>{BLOCKS[kind].name}</b><small>{BLOCKS[kind].help}</small></span><i>+</i></button>)}
      <div className="tool-legend"><span><i className="bool-dot"/> 조건 신호</span><span><i className="state-dot"/> 상태 값</span></div>
      <p className="tool-tip">같은 색 포트끼리 연결해요.<br/>선이나 블록을 선택하면 삭제할 수 있어요.</p>
    </aside>
    <section className="canvas-panel" aria-label="로직 편집기" onKeyDown={e => {
      if ((e.target as HTMLElement).matches('input,select,textarea')) return
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') { e.preventDefault(); if (e.shiftKey) redo(); else undo() }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); remove() }
      if (e.key === 'Escape') { setPending(undefined); setSelected(undefined) }
    }}>
      <header className="canvas-toolbar"><span><i className="status-dot"/> LOGIC CANVAS</span><div><button onClick={undo} disabled={!history.current.past.length} title="되돌리기 Ctrl+Z" aria-label="되돌리기">↶</button><button onClick={redo} disabled={!history.current.future.length} title="다시 실행 Ctrl+Shift+Z" aria-label="다시 실행">↷</button><em/>
        <button onClick={() => setZoom(z => Math.max(.25, z - .1))} aria-label="축소">−</button><output>{Math.round(zoom * 100)}%</output><button onClick={() => setZoom(z => Math.min(1.5, z + .1))} aria-label="확대">+</button>
        <button onClick={() => { const el = viewport.current!; setZoom(Math.max(.25, Math.min(1, (el.clientWidth - 30) / maxX, (el.clientHeight - 30) / maxY))); el.scrollTo(0, 0) }}>화면 맞춤</button></div></header>
      <div className="logic-viewport" ref={viewport} tabIndex={0} aria-label="블록 작업 공간. 빈 공간 드래그로 이동" onPointerDown={e => {
        if ((e.target as Element).closest('.logic-node,.wire-hit')) return
        if (e.button !== 0) return
        const el = e.currentTarget; pan.current = { x: e.clientX, y: e.clientY, left: el.scrollLeft, top: el.scrollTop }; el.setPointerCapture(e.pointerId); setSelected(undefined)
      }} onPointerMove={e => { if (pan.current) { e.currentTarget.scrollLeft = pan.current.left - (e.clientX - pan.current.x); e.currentTarget.scrollTop = pan.current.top - (e.clientY - pan.current.y) } }} onPointerUp={() => { pan.current = null }} onPointerCancel={() => { pan.current = null }}>
        <div style={{ width: maxX * zoom, height: maxY * zoom }}><div className="logic-world" style={{ width: maxX, height: maxY, transform: `scale(${zoom})` }}>
          <svg className="wires" width={maxX} height={maxY} aria-label="로직 연결선" role="group">
            {graph.edges.map(edge => {
              const from = graph.nodes.find(n => n.id === edge.from), to = graph.nodes.find(n => n.id === edge.to)
              if (!from || !to) return null
              const a = position(from), b = position(to)
              const outIndex = BLOCKS[from.kind]?.outputs.findIndex(p => p.id === edge.out) ?? -1, inIndex = BLOCKS[to.kind]?.inputs.findIndex(p => p.id === edge.in) ?? -1
              const x = a.x + WIDTH, y = a.y + portY(outIndex), endY = b.y + portY(inIndex)
              const d = `M ${x} ${y} C ${x + 100} ${y}, ${b.x - 100} ${endY}, ${b.x} ${endY}`
              const active = snapshot.values[valueKey(from.id, edge.out)] === true
              return <g key={edge.id} className={`${active ? 'energized' : ''} ${selected === edge.id ? 'selected-wire' : ''}`}>
                <path className="wire" d={d}/><path className="wire-hit" d={d} tabIndex={0} role="button" aria-label={`${from.label}에서 ${to.label} ${BLOCKS[to.kind].inputs[inIndex]?.label} 연결선 선택`} onClick={() => setSelected(edge.id)} onKeyDown={e => { if (e.key === 'Enter') setSelected(edge.id) }}/>
              </g>
            })}
          </svg>
          {graph.nodes.map(node => {
            const pos = position(node), registry = BLOCKS[node.kind]
            if (!registry) return null
            const active = node.kind === 'output' ? snapshot.outputs[node.key!] === true : snapshot.values[valueKey(node.id, node.kind === 'state' ? 'active' : 'value')] === true
            return <article key={node.id} className={`logic-node kind-${node.kind} ${active ? 'active-node' : ''} ${selected === node.id ? 'selected-node' : ''} ${failedNodes.includes(node.id) ? 'failed-node' : ''}`} style={{ left: pos.x, top: pos.y, width: WIDTH }}>
              <header onPointerDown={e => dragStart(e, node)} onPointerMove={e => { if (drag?.id === node.id) setDrag({ ...drag, left: Math.min(9800, Math.max(15, drag.x + (e.clientX - drag.mouseX) / zoom)), top: Math.min(9800, Math.max(15, drag.y + (e.clientY - drag.mouseY) / zoom)) }) }} onPointerUp={() => { if (drag?.id === node.id) { if (drag.left !== node.x || drag.top !== node.y) commit({ ...graph, nodes: graph.nodes.map(n => n.id === node.id ? { ...n, x: drag.left, y: drag.top } : n) }); setDrag(undefined) } }} onPointerCancel={() => setDrag(undefined)}>
                <BlockSymbol kind={node.kind}/><small>{registry.name}</small><b>{node.label}</b><span aria-hidden="true">⠿</span></header>
              <div className="node-ports" style={{ height: Math.max(registry.inputs.length, registry.outputs.length) * 30 + 18 }}>
                <div>{registry.inputs.map(port => <button key={port.id} className={`port input-port type-${port.type}`} aria-label={`${node.label} 입력 ${port.label}`} onClick={() => link(node.id, port.id)}><i/><span>{port.label}</span></button>)}</div>
                <div>{registry.outputs.map(port => <button key={port.id} className={`port output-port type-${port.type} ${pending?.node === node.id && pending?.port === port.id ? 'pending-port' : ''}`} aria-label={`${node.label} 출력 ${port.label}`} aria-pressed={pending?.node === node.id && pending.port === port.id} onClick={() => { setPending({ node: node.id, port: port.id }); setMessage(`${node.label} → 연결할 입력 포트를 선택하세요.`) }}><span>{port.label}</span><i/></button>)}</div>
              </div>
            </article>
          })}
        </div></div>
      </div>
      <footer className="canvas-status"><span role="status">{message}</span><small>{graph.nodes.length} 블록 · {graph.edges.length} 연결</small></footer>
      <div className="inspector">
        {selectedNode ? <><span>선택 블록</span><input aria-label="블록 이름" value={selectedNode.label} maxLength={26} onChange={e => commit({ ...graph, nodes: graph.nodes.map(n => n.id === selectedNode.id ? { ...n, label: e.target.value } : n) })}/>
          {selectedNode.key !== undefined && <select aria-label="블록 신호 또는 상태" value={selectedNode.key} onChange={e => commit({ ...graph, nodes: graph.nodes.map(n => n.id === selectedNode.id ? { ...n, key: e.target.value } : n) })}>{Object.entries(selectedNode.kind === 'input' ? INPUTS : selectedNode.kind === 'output' ? OUTPUTS : STATES).map(([key, label]) => <option key={key} value={key}>{label}</option>)}</select>}
          <button className="delete-button" onClick={remove}>블록 삭제</button></> : graph.edges.some(e => e.id === selected) ? <><span>연결선 선택됨</span><button className="delete-button" onClick={remove}>연결선 삭제</button></> : <span>블록 선택: 이름·신호 변경 / Delete: 삭제 / Ctrl+Z: 되돌리기</span>}
        <select aria-label="연결선 선택" value={graph.edges.some(e => e.id === selected) ? selected : ''} onChange={e => setSelected(e.target.value || undefined)}><option value="">연결선 선택…</option>{graph.edges.map(edge => <option key={edge.id} value={edge.id}>{graph.nodes.find(n => n.id === edge.from)?.label} → {graph.nodes.find(n => n.id === edge.to)?.label} · {BLOCKS[graph.nodes.find(n => n.id === edge.to)?.kind ?? 'output'].inputs.find(p => p.id === edge.in)?.label}</option>)}</select>
      </div>
    </section>
  </div>
}
