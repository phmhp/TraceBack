import type {WorldPhysicsDefinition} from '../../simulation/src/domain/world/MapDefinition.ts'
import {drivingWorld} from '../game/driving/DrivingRuntime.ts'
export const GATES=[40,80,120,160] as const
export const STARS=[{x:-3,z:-50},{x:3,z:-95},{x:-3,z:-135}] as const
export function courseForSeed(seed:number){
 if(seed===0)return{gates:[...GATES],stars:STARS.map(star=>({...star}))}
 let state=(Math.trunc(seed)>>>0)||1
 const random=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state/4294967296}
 const gates=[Math.round(35+random()*10),Math.round(75+random()*10),Math.round(115+random()*10),160]
 const stars=[0,1,2].map((i)=>({x:[-4,0,4][Math.floor(random()*3)],z:-Math.round(gates[i]+7+random()*10)}))
 return{gates,stars}
}
export const RIVALS=[{name:'루루',lane:-4,finish:22,mint:true},{name:'보리',lane:4,finish:27,mint:false},{name:'토토',lane:6.7,finish:33,mint:true}] as const
// Deterministic virtual entrants, not networked players or a collision/strategy AI.
export const rivalDistance=(time:number,finish:number)=>160*Math.min(1,Math.pow(Math.max(0,time)/finish,1.35))
export const raceRank=(time:number,z:number)=>1+RIVALS.filter(r=>(-z>=160?r.finish<time:rivalDistance(time,r.finish)>Math.min(160,-z)+.01)).length
export const finishRank=(seconds:number)=>1+RIVALS.filter(r=>r.finish<seconds).length
export type RaceState={time:number;gate:number;stars:boolean[];finished:boolean;missed:boolean;lastZ:number;seed?:number}
export const newRace=(seed=0):RaceState=>({time:0,gate:0,stars:[false,false,false],finished:false,missed:false,lastZ:0,seed})
export function raceStep(s:RaceState,pose:{x:number;z:number},dt:number):RaceState{if(s.finished||!Number.isFinite(dt)||dt<=0||dt>.3||!Number.isFinite(pose.x)||!Number.isFinite(pose.z))return s;const course=courseForSeed(s.seed??0),next={...s,time:s.time+dt,stars:s.stars.map((hit,i)=>hit||Math.hypot(pose.x-course.stars[i].x,pose.z-course.stars[i].z)<2.1),lastZ:pose.z};const target=course.gates[s.gate];if(s.lastZ>-target&&pose.z<=-target){if(Math.abs(pose.x)<=9){next.gate++;next.finished=next.gate===course.gates.length}else next.missed=true}return next}
export const cupWorld:WorldPhysicsDefinition={...drivingWorld,staticColliders:[...drivingWorld.staticColliders,...[-205,65].map((z,i)=>({id:`cup-end-${i}`,position:{x:0,y:.6,z},rotation:{x:0,y:0,z:0,w:1},halfExtents:{x:11,y:.6,z:.25},friction:1.3}))]}
