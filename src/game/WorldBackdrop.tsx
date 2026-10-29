import type { CSSProperties } from 'react'
import { useRef, useState } from 'react'
export function WorldBackdrop({scene,reduced}:{scene:string;reduced:boolean}) {
  const root=useRef<HTMLDivElement>(null)
  return <div ref={root} className={`world-backdrop world-${scene}`} aria-hidden="true" onPointerMove={e=>{if(reduced||!root.current)return;const bounds=root.current.getBoundingClientRect();root.current.style.setProperty('--parallax-x',`${(e.clientX/bounds.width-.5)*8}px`);root.current.style.setProperty('--parallax-y',`${(e.clientY/bounds.height-.5)*5}px`)}}><img src="./art/momo-garage-v5.png" alt=""/><div className="world-wash"/><div className="world-dust"><i/><i/><i/></div>{scene==='reward'&&<div className="world-ready-glow"/>}</div>
}
export function ClickFeedback() {
  const [burst,setBurst]=useState({x:0,y:0,id:0})
  return <div className="interaction-layer" onPointerDownCapture={()=>{}} ref={element=>{
    // A single game-local listener also covers keyboard-generated button clicks.
    if(!element)return
    const parent=element.parentElement
    if(!parent)return
    const handler=(event:MouseEvent)=>{
      const button=(event.target as Element).closest('button');if(!button||button.disabled)return
      const r=button.getBoundingClientRect();setBurst({x:event.detail?event.clientX:r.left+r.width/2,y:event.detail?event.clientY:r.top+r.height/2,id:performance.now()})
    }
    parent.addEventListener('click',handler)
    return()=>parent.removeEventListener('click',handler)
  }} aria-hidden="true">{burst.id>0&&<span key={burst.id} className="click-burst" style={{left:burst.x,top:burst.y} as CSSProperties}><i/><i/><i/><i/></span>}</div>
}
