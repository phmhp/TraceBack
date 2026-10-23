import type {DGraph,DNode} from './domainTraining.ts'
/** Orthogonal lanes avoid intermediate block bodies, labels and run-time Displays. */
export function signalRoute(graph:DGraph,a:DNode,b:DNode,port:number,index:number,readOnly=false){
 const x=a.x+145,y=a.y+35,ex=b.x,ey=b.y+24+port*26,lane=x+18+index%3*8
 const middle=graph.nodes.filter(n=>n.id!==a.id&&n.id!==b.id&&n.x+145>lane&&n.x<ex&&ey>=n.y-10&&ey<=n.y+(readOnly?155:125))
 if(ex<x+15||middle.length){const obstacles=ex<x+15?graph.nodes:middle,bus=Math.max(y,ey,...obstacles.map(n=>n.y+(readOnly?160:130)))+22+index%3*9,entry=ex-18;return`M${x} ${y}H${lane}V${bus}H${entry}V${ey}H${ex}`}
 return`M${x} ${y}H${lane}V${ey}H${ex}`
}
