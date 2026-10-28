import {referenceTorqueGraph} from '../engineering/torqueModel.ts'
import type {EGraph,EWire} from '../engineering/torqueModel.ts'

/** Lossless expansion of the legacy permit operator. Do not auto-complete missing player wires. */
export function expandDriveConditions(graph:EGraph):EGraph{
 const g=structuredClone(graph),permit=g.nodes.find(n=>n.id==='permission')
 if(permit?.kind!=='permit')return g
 const threshold=permit.parameters.brakeAt
 permit.kind='all';permit.label='네 조건 AND';permit.parameters={}
 g.nodes.push({id:'gearCheck',kind:'gearCompare',label:'GearState == D',parameters:{equals:3}},{id:'brakeCheck',kind:'brakeCompare',label:'BrakePct < 경계',parameters:{brakeAt:threshold}})
 const wire=(from:string,out:string,to:string,input:string):EWire=>({id:`${from}.${out}-${to}.${input}`,from,out,to,in:input})
 g.edges=g.edges.flatMap(e=>{
  if(e.to==='permission'&&e.in==='forward'&&e.from==='input'&&e.out==='forward')return[wire('input','gear','gearCheck','gear'),wire('gearCheck','forward','permission','forward')]
  if(e.to==='permission'&&e.in==='brake')return[wire(e.from,e.out,'brakeCheck','brake'),wire('brakeCheck','clear','permission','clear')]
  return[e]
 })
 return g
}
export const campaignReferenceGraph=()=>expandDriveConditions(referenceTorqueGraph())
