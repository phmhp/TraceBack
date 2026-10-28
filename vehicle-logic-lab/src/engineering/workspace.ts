export type Point = { x:number; y:number }
export type Bounds = Point & { width:number; height:number }
export type Edge = { id:string; from:string; to:string }
export function clampZoom(value:number) { return Math.max(.3,Math.min(1.8,value)) }
export function fitZoom(view: {width:number;height:number}, world:{width:number;height:number}) { return clampZoom(Math.min(1.15,(view.width-36)/world.width,(view.height-36)/world.height)) }
export function anchoredZoom(oldZoom:number,newZoom:number,scroll:Point,anchor:Point):Point { return {x:(scroll.x+anchor.x)/oldZoom*newZoom-anchor.x,y:(scroll.y+anchor.y)/oldZoom*newZoom-anchor.y} }
/** Ancestors plus descendants of one selected signal, not unrelated side branches. */
export function signalCone(edges:readonly Edge[],selected:string) {
  const edge=edges.find(e=>e.id===selected),seed=edge?[edge.from,edge.to]:[selected]
  const nodes=new Set(seed)
  for(const direction of ['up','down'] as const){const seen=new Set(seed),queue=[...seed];while(queue.length){const id=queue.shift()!;for(const e of edges){const match=direction==='up'?e.to===id:e.from===id;const next=direction==='up'?e.from:e.to;if(match&&!seen.has(next)){seen.add(next);nodes.add(next);queue.push(next)}}}}
  return {nodes,edges:new Set(edges.filter(e=>nodes.has(e.from)&&nodes.has(e.to)).map(e=>e.id))}
}
/** Orthogonal lanes: long/back links travel around block rows instead of through them. */
export function routedWire(a:Point,b:Point,track:number,worldHeight:number) {
  const lane=20+(track%6)*10
  if(b.x-a.x<380&&b.x>a.x) {const x=a.x+Math.max(25,(b.x-a.x)/2)+(track%3-1)*10;return `M${a.x} ${a.y} H${x} V${b.y} H${b.x}`}
  const y=worldHeight-18-(track%8)*11
  return `M${a.x} ${a.y} H${a.x+lane} V${y} H${b.x-lane} V${b.y} H${b.x}`
}
