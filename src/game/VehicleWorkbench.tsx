import {useState} from 'react'
import type {Graph,Mission,Snapshot} from '../engine/types'
import {VehiclePlatform} from './LearningVehicle'
import {ArchitectureTrail} from './ArchitectureTrail'
import {DriveExperience} from './DriveExperience'
import {driveGate} from './interaction'
import type {RaceTelemetry} from '../../simulation/src/runtime/SimulationRuntime'
import {normalScenarioTrace} from '../content/vehicleJourney'
export function VehicleWorkbench({snapshot,inputs,onPower,onToggle,paused=false,volume=.25,graph,mission}:{snapshot:Snapshot;inputs:Record<string,boolean>;onPower:()=>void;onToggle:(key:string)=>void;paused?:boolean;volume?:number;graph:Graph;mission:Mission}){
 const [drive,setDrive]=useState(false),[focus,setFocus]=useState(-1),[telemetry,setTelemetry]=useState<RaceTelemetry>(),[normal,setNormal]=useState(false),[index,setIndex]=useState(0)
 const frames=normalScenarioTrace(graph,mission),frame=normal?frames[Math.min(index,frames.length-1)]:undefined,shown=frame?.actual??snapshot,shownInputs=frame?.expected.inputs??inputs
 return <section className="vehicle-workbench"><header><div><small>같은 차량 · 같은 기능</small><b>{drive?'내 설계로 시험 주행':'차량 위에서 로직의 결과 보기'}</b></div><button onClick={()=>{setDrive(v=>!v);setNormal(false);setTelemetry(undefined)}}>{drive?'투시 모형으로':'그 상태로 직접 주행 →'}</button></header><div className="workbench-vehicle">{drive?<DriveExperience enabled={driveGate(snapshot)} paused={paused} volume={volume} cutaway onFrameTelemetry={setTelemetry}/>:<VehiclePlatform snapshot={shown} brake={shownInputs.brake} focus={focus} paused={paused} onInspect={setFocus}/>}</div><ArchitectureTrail snapshot={shown} inputs={shownInputs} telemetry={drive?telemetry:undefined} onFocus={setFocus}/>{!normal?<div className="vehicle-actions"><button onClick={()=>onToggle('brake')} aria-pressed={inputs.brake}>페달 {inputs.brake?'밟음':'놓음'}</button><button onClick={()=>onToggle('system')} aria-pressed={inputs.system}>시스템 {inputs.system?'준비':'대기'}</button><button onClick={onPower}>⏻ START</button><button onClick={()=>{setNormal(true);setDrive(false);setIndex(0)}}>정상 시나리오 따라가기</button></div>:<div className="normal-sequence"><span>정상 요구사항 · {index+1}/{frames.length} 입력</span><b>{frame!.expected.state} 기대 / {shown.state} 실제</b><div><button disabled={index===0} onClick={()=>setIndex(i=>i-1)}>이전 입력</button><button disabled={index===frames.length-1} onClick={()=>setIndex(i=>i+1)}>다음 입력</button><button onClick={()=>setNormal(false)}>직접 조작</button></div><small>기준 입력을 내 그래프에 적용해 재실행한 결과예요. 미완료 연결은 숨기지 않아요.</small></div>}</section>
}
