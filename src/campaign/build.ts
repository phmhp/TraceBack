import {allAssemblyParts,chassisCables,cables,sensorCable,connectCable,seatPart,fastenPart,partById} from '../workshop/assembly.ts'
import type {AssemblyPartId} from '../workshop/assembly.ts'
import type {Campaign} from './model.ts'

export const BUILD_PARTS=allAssemblyParts.slice().sort((a,b)=>a.stage-b.stage)
export const BUILD_GROUPS=['모터·감속기·구동축','네 바퀴','배터리·인버터·센서·VCU','마찰 제동 장치','조향 장치']
export const BUILD_LINKS=[cables[0],cables[1],sensorCable,{...cables[2],from:'vcuOut' as const},...chassisCables]
export const buildParts=(c:Campaign)=>c.assemblyScope===2?BUILD_PARTS:BUILD_PARTS.filter(p=>['battery','pedal','vcu'].includes(p.id))
export const buildReady=(c:Campaign)=>c.assemblyScope!==2||BUILD_PARTS.every(p=>c.record.assembly[p.id]==='FIXED')&&BUILD_LINKS.every(l=>c.record.cables.includes(l.id))
export function mountAndConnect(c:Campaign,id:AssemblyPartId):Campaign{
 const part=partById(id),assembly=fastenPart(seatPart(c.record.assembly,id,part.position,part.angle,c.assemblyScope===2?4:2),id)
 if(assembly[id]!=='FIXED')return c
 let connected=c.record.cables
 for(const link of BUILD_LINKS)connected=connectCable(assembly,connected,link.from,link.to)??connected
 return {...c,record:{...c.record,assembly,cables:connected,certificate:''},bench:''}
}
