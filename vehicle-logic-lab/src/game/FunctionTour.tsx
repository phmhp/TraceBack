import {useState} from 'react'
import type {Snapshot} from '../engine/types'
import type {RaceTelemetry} from '../../simulation/src/runtime/SimulationRuntime'
import type {Gear} from '../../simulation/src/domain/driver/DriverInputTypes'
import {DriveExperience} from './DriveExperience'
import {ArchitectureTrail} from './ArchitectureTrail'
export function FunctionTour({area,snapshot}:{area:string;snapshot:Snapshot}){
 const [pedal,setPedal]=useState(.3),[brake,setBrake]=useState(false),[steering,setSteering]=useState(0),[gear,setGear]=useState<Gear>('D'),[paused,setPaused]=useState(true),[telemetry,setTelemetry]=useState<RaceTelemetry>()
 return <section className="function-tour"><div className="tour-scope">정상 기준 모델 시연 · 내 설계와 진행에는 반영하지 않아요.</div><div className="workbench-vehicle"><DriveExperience enabled automatic cutaway paused={paused} acceleratorTarget={pedal} brake={brake} gearTarget={gear} steeringTarget={steering} onFrameTelemetry={setTelemetry} volume={0}/></div><div className="tour-controls"><button onClick={()=>setPaused(v=>!v)}>{paused?'▶ 정상 동작 실행':'Ⅱ 멈춰서 살펴보기'}</button><button aria-pressed={brake} onClick={()=>setBrake(v=>!v)}>제동 {brake?'밟음':'놓음'}</button><label>가속<input aria-label="기준 모델 가속 요구" type="range" min="0" max="1" step=".05" value={pedal} onChange={e=>setPedal(Number(e.target.value))}/><output>{Math.round(pedal*100)}%</output></label>{area==='gear'&&<label>요청 기어<select aria-label="기준 모델 기어" value={gear} onChange={e=>setGear(e.target.value as Gear)}>{['P','R','N','D'].map(g=><option key={g}>{g}</option>)}</select></label>}{area==='steering'&&<label>핸들<input aria-label="기준 모델 조향" type="range" min="-1" max="1" step=".1" value={steering} onChange={e=>setSteering(Number(e.target.value))}/></label>}</div><ArchitectureTrail snapshot={snapshot} inputs={{brake,power:false,system:true}} telemetry={telemetry} area={area}/><small>같은 기존 C/TS·Rapier 실행기에서 읽은 입력·명령·피드백입니다. 소프트웨어 명령을 실제 센서 측정값으로 바꾸어 부르지 않습니다.</small></section>
}
