import type {Campaign} from './model.ts'
import {ASSEMBLY_KITS,kitComplete} from './domains.ts'
import {campaignReferenceGraph} from './design.ts'
import {LESSONS} from './model.ts'
import type {EGraph} from '../engineering/torqueModel.ts'

/** Physical assemblies and ECU software are related, not interchangeable completions. */
export const KIT_LESSON:Record<string,number>={control:0,brake:1,steer:2}
export const activeKit=(c:Campaign)=>ASSEMBLY_KITS[c.kitIndex??0]
export function inspectMountedKit(c:Campaign):Campaign{
 const kit=activeKit(c)
 if(c.stage!=='component'||!kitComplete(kit,c.record.assembly))return c
 const checks=[...new Set([...(c.kitChecks??[]),kit.id])],lesson=KIT_LESSON[kit.id]
 return {...c,kitChecks:checks,stage:lesson!==undefined&&c.lessons.length<=lesson?'puzzle':'restore'}
}
export function continueRestoration(c:Campaign):Campaign{
 if(c.stage!=='restore'||!c.kitChecks?.includes(activeKit(c).id))return c
 if((c.kitIndex??0)<ASSEMBLY_KITS.length-1)return {...c,kitIndex:(c.kitIndex??0)+1,stage:'repair'}
 return {...c,stage:c.lessons.length===3?'bench':'puzzle'}
}
export const restorationScore=(c:Campaign)=>({mounted:ASSEMBLY_KITS.filter(k=>kitComplete(k,c.record.assembly)).length,observed:c.kitChecks?.length??0,software:c.lessons.length})

/** On earlier edits, downstream modules return to supplied implementations, not learner awards. */
export function resumeLessonEdit(c:Campaign,graph:EGraph,index:number):Campaign{
 const next=structuredClone(graph),reference=campaignReferenceGraph()
 for(const lesson of LESSONS.slice(index+1))for(const[from,out,to,input]of lesson.edges)if(!next.edges.some(e=>e.to===to&&e.in===input)){const provided=reference.edges.find(e=>e.from===from&&e.out===out&&e.to===to&&e.in===input)!;next.edges.push({...provided})}
 return {...c,...(c.journey===2?{kitIndex:index+3}:{}),lessons:c.lessons.slice(0,index),record:{...c.record,graph:next,certificate:''},bench:''}
}

/** Wall-time in control, not physics distance: the opening must not trap slow devices. */
export function shakedownClock(elapsed:number,dt:number,moving:boolean,paused:boolean){return paused?elapsed:moving?Math.min(4,elapsed+Math.min(.2,Math.max(0,dt))):elapsed}
