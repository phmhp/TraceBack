import { createContext, useContext, useSyncExternalStore } from 'react'
import type { SimulationRuntime } from '../../runtime/SimulationRuntime.ts'

export const SimulationRuntimeContext=createContext<SimulationRuntime|null>(null)
export function useSimulationRuntime(){
  const runtime=useContext(SimulationRuntimeContext)
  if(!runtime)throw new Error('Simulation runtime provider missing')
  const scenario=useSyncExternalStore(runtime.subscribeScenario,runtime.getScenarioSnapshot)
  return {runtime,scenario}
}
