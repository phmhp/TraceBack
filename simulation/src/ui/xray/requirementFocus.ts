export interface TraceEdge { from: string; to: string; kind: 'group' | 'trace' | 'test' }
/** Walk upwards and downwards independently: do not expand an ancestor's sibling branches. */
export function requirementFocus(selected: string, edges: readonly TraceEdge[]) {
  const links=edges.filter(e=>e.kind!=='group')
  const walk=(up:boolean)=>{
    const found=new Set([selected]), queue=[selected]
    while(queue.length){const id=queue.shift()!;for(const edge of links){
      if((up?edge.to:edge.from)!==id)continue
      const next=up?edge.from:edge.to
      if(!found.has(next)){found.add(next);queue.push(next)}
    }}
    return found
  }
  const found=new Set([...walk(true),...walk(false)])
  // Verification leaves attached to ancestors are evidence for those requirements.
  for(const e of links)if(e.kind==='test'&&found.has(e.from))found.add(e.to)
  return found
}
