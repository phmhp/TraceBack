import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { IncidentDialogue } from './src/ui/components/IncidentDialogue'
import { InvestigationWorkspace } from './src/ui/investigation/InvestigationWorkspace'
import { CaseContext } from './src/ui/state/CaseContext'
import { WasmVehicleSw } from './src/runtime/c/WasmVehicleSw'
import { PropulsionCase } from './src/runtime/case/PropulsionCase'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration } from './src/data/calibration/TrackbackSimulationCalibration'
import { SimulationRuntime } from './src/runtime/SimulationRuntime'
import { GameViewport } from './src/app/GameViewport'
import { PANGYO2_MAP_ID, loadMapDefinition } from './src/registries/MapRegistry'
import { createLoadedMap } from './src/world/MapLoader'
import './src/ui/styles.css'
import url from './src/runtime/c/generated/vehicle-sw.wasm?url'
const module = await WebAssembly.compile(await (await fetch(url)).arrayBuffer())
const incident = new PropulsionCase(()=>new WasmVehicleSw(module,calibration),'visual-qa',{forward:calibration.maxForwardTorqueNm.value,reverse:calibration.maxReverseTorqueNm.value})
incident.reproduce()
const runtime = new SimulationRuntime(calibration,undefined,undefined,new WasmVehicleSw(module,calibration))
runtime.configureCase(incident)
const map = createLoadedMap(loadMapDefinition(PANGYO2_MAP_ID))
function Preview(){const [office,setOffice]=useState(false);const screen=office?'xray':'race';return <CaseContext.Provider value={incident}><div className={'game-shell mode-'+screen}><GameViewport screen={screen} runtime={runtime} map={map}/><main className="game-overlay">{office?<InvestigationWorkspace/>:<IncidentDialogue investigate={()=>setOffice(true)}/>}</main></div></CaseContext.Provider>}
createRoot(document.getElementById('root')!).render(<Preview/>)
