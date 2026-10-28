import { useLayoutEffect, useRef, useState } from 'react'
import { connect } from '../engine/graph.ts'
import { BLOCKS, valueKey } from '../engine/registry.ts'
import type { BlockKind, Graph, Snapshot } from '../engine/types.ts'
import type { Lesson } from './lessons.ts'
export function BlockSymbol({ kind }: {kind:BlockKind}) {
  return <svg viewBox="0 0 80 60" aria-hidden="true">{
    kind==='and'?<><path d="M15 8H37A22 22 0 0 1 37 52H15Z"/><text x="33" y="37">&amp;</text></>:
    kind==='or'?<><path d="M10 7Q35 30 10 53Q53 55 70 30Q52 6 10 7Z"/><text x="37" y="36">≥1</text></>:
    kind==='not'?<><path d="m15 7 43 23-43 23Z"/><circle cx="64" cy="30" r="5"/><text x="29" y="36">!</text></>:
    kind==='state'?<><circle cx="40" cy="30" r="24"/><circle cx="40" cy="30" r="18"/><text x="40" y="36">S</text></>:
    kind==='transition'?<><path d="m40 4 33 26-33 26L7 30Z"/><text x="40" y="36">→</text></>:
    kind==='input'?<><rect x="7" y="12" width="66" height="36" rx="18"/><text x="40" y="37">↗</text></>:
    <><path d="M12 10H58L73 30 58 50H12Z"/><text x="38" y="37">◉</text></>
  }</svg>
}
export function GuidedBoard({ graph, lesson, snapshot, onChange, onSound }: {graph:Graph;lesson:Lesson;snapshot:Snapshot;onChange:(g:Graph)=>void;onSound:()=>void}) {
  const [pending,setPending]=useState<{node:string;port:string}>()
  const [message,setMessage]=useState('오른쪽 동그라미 → 연결할 왼쪽 동그라미를 눌러요.')
  const [scale,setScale]=useState(1)
  const viewport=useRef<HTMLDivElement>(null)
  const nodes=graph.nodes.filter(n=>lesson.visible.includes(n.id))
  const planned=[...graph.edges,...lesson.connections]
  const depth=(id:string,seen=new Set<string>()):number=>{
    if(seen.has(id))return 0
    const next=new Set(seen).add(id),parents=planned.filter(e=>e.to===id&&nodes.some(n=>n.id===e.from))
    return Math.min(3,parents.length?Math.max(...parents.map(e=>depth(e.from,next)))+1:0)
  }
  const columns=new Map<number,number>()
  const positions=new Map(nodes.map(n=>{const col=depth(n.id),row=columns.get(col)??0;columns.set(col,row+1);return[n.id,{x:45+col*300,y:20+row*125}]}))
  const width=Math.max(800,...[...positions.values()].map(p=>p.x+275)),height=Math.max(280,...[...positions.values()].map(p=>p.y+180))
  useLayoutEffect(()=>{const el=viewport.current;if(!el)return;const resize=()=>setScale(Math.min(1,Math.max(.76,(el.clientWidth-12)/width)));resize();const observer=new ResizeObserver(resize);observer.observe(el);return()=>observer.disconnect()},[width])
  const link=(to:string,input:string)=>{
    if(!pending){setMessage('먼저 블록 오른쪽의 출력 포트를 눌러 주세요.');return}
    try{onChange(connect(graph,{id:crypto.randomUUID(),from:pending.node,out:pending.port,to,in:input}));onSound();setMessage('찰칵! 연결했어요. 조건을 모으면 차량에 보낼 신호가 돼요.')}catch(e){setMessage(e instanceof Error?e.message:'연결을 확인해 주세요.')}
    setPending(undefined)
  }
  return <section className="guided-board"><div className="board-wood-label">흰둥의 로직 작업대 <span>출력 → 입력</span></div><div ref={viewport} className="guided-viewport"><div style={{width:width*scale,height:height*scale,minHeight:height*scale}}><div className="guided-world" style={{width,height,transform:`scale(${scale})`}}><svg className="guided-wires" width={width} height={height} aria-hidden="true">{graph.edges.filter(e=>positions.has(e.from)&&positions.has(e.to)).map(e=>{const a=positions.get(e.from)!,b=positions.get(e.to)!,from=nodes.find(n=>n.id===e.from)!,to=nodes.find(n=>n.id===e.to)!;const out=BLOCKS[from.kind].outputs.findIndex(p=>p.id===e.out),input=BLOCKS[to.kind].inputs.findIndex(p=>p.id===e.in);return <path key={e.id} className={snapshot.values[valueKey(e.from,e.out)]===true?'on':''} d={`M${a.x+220} ${a.y+85+out*32}C${a.x+270} ${a.y+85+out*32},${b.x-50} ${b.y+85+input*32},${b.x} ${b.y+85+input*32}`}/>})}</svg>
      {nodes.map(node=>{const p=positions.get(node.id)!,reg=BLOCKS[node.kind],inputPorts=lesson.connections.some(e=>e.to===node.id)?reg.inputs:[];return <article key={node.id} className={`puzzle-block block-${node.kind} ${snapshot.values[valueKey(node.id,node.kind==='state'?'active':'value')]===true?'block-on':''}`} style={{left:p.x,top:p.y}}><div className="block-head"><BlockSymbol kind={node.kind}/><div><small>{reg.name}</small><b>{node.label}</b></div></div><div className="puzzle-ports" style={{height:Math.max(inputPorts.length,reg.outputs.length)*32+14}}><div>{inputPorts.map(port=><button key={port.id} className={`puzzle-port p-input ${port.type}`} aria-label={`${node.label} 입력 ${port.label}`} onClick={()=>link(node.id,port.id)}><i/>{port.label}</button>)}</div><div>{reg.outputs.map(port=><button key={port.id} className={`puzzle-port p-output ${port.type} ${pending?.node===node.id&&pending.port===port.id?'is-pending':''}`} aria-label={`${node.label} 출력 ${port.label}`} aria-pressed={pending?.node===node.id&&pending.port===port.id} onClick={()=>{setPending({node:node.id,port:port.id});setMessage(`${node.label}에서 출발! 연결할 입력을 눌러 주세요.`)}}>{port.label}<i/></button>)}</div></div></article>})}
    </div></div></div><p className="board-message" role="status">{message}</p></section>
}
