import { useState } from 'react'
import { createRoot } from 'react-dom/client'
import { IncidentDialogue } from './src/ui/components/IncidentDialogue'
import { InvestigationWorkspace } from './src/ui/investigation/InvestigationWorkspace'
import { CaseContext } from './src/ui/state/CaseContext'
import { WasmVehicleSw } from './src/runtime/c/WasmVehicleSw'
import { PropulsionCase } from './src/runtime/case/PropulsionCase'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration } from './src/data/calibration/TrackbackSimulationCalibration'
import './src/ui/styles.css'
import url from './src/runtime/c/generated/vehicle-sw.wasm?url'
const module = await WebAssembly.compile(await (await fetch(url)).arrayBuffer())
const incident = new PropulsionCase(()=>new WasmVehicleSw(module,calibration),'visual-qa',{forward:calibration.maxForwardTorqueNm.value,reverse:calibration.maxReverseTorqueNm.value})
incident.reproduce()
function Preview(){const [office,setOffice]=useState(false);return <CaseContext.Provider value={incident}><div className={'game-shell '+(office?'mode-xray':'mode-race')}>{office?<InvestigationWorkspace/>:<IncidentDialogue investigate={()=>setOffice(true)}/>}</div></CaseContext.Provider>}
createRoot(document.getElementById('root')!).render(<Preview/>)
