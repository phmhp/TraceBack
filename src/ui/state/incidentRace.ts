import { create } from 'zustand'

interface IncidentRaceState {
  active:boolean
  incidentStartRaceSeconds:number
  incidentTimeLossSeconds:number
  diagnosisDurationSeconds:number
  lastTickMs:number|null
  highestHintLevel:0|1|2|3
  assisted:boolean
  start:(raceSeconds:number,nowMs:number)=>void
  tick:(nowMs:number)=>void
  stop:()=>void
  recordHint:(level:1|2|3)=>void
  reset:()=>void
}

const initial={active:false,incidentStartRaceSeconds:0,incidentTimeLossSeconds:0,diagnosisDurationSeconds:0,lastTickMs:null,highestHintLevel:0 as const,assisted:false}

/** Gameplay-only clock. It never mutates SimulationClock or vehicle telemetry. */
export const useIncidentRace=create<IncidentRaceState>((set)=>({
  ...initial,
  start:(raceSeconds,nowMs)=>set(state=>state.active||state.incidentTimeLossSeconds>0?{}:{active:true,incidentStartRaceSeconds:raceSeconds,lastTickMs:nowMs}),
  tick:(nowMs)=>set(state=>{
    if(!state.active||state.lastTickMs===null)return {}
    const delta=Math.max(0,Math.min(.5,(nowMs-state.lastTickMs)/1000))
    return {lastTickMs:nowMs,incidentTimeLossSeconds:state.incidentTimeLossSeconds+delta,diagnosisDurationSeconds:state.diagnosisDurationSeconds+delta}
  }),
  stop:()=>set({active:false,lastTickMs:null}),
  recordHint:(level)=>set(state=>({highestHintLevel:Math.max(state.highestHintLevel,level) as 0|1|2|3,assisted:state.assisted||level>=3})),
  reset:()=>set(initial),
}))
