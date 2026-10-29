import {useEffect,useState} from 'react'
import type {CSSProperties,PointerEvent} from 'react'
import type {SimulationRuntime} from '../../runtime/SimulationRuntime'
import {useRaceHud} from '../state/raceHud'
import {useNavigation} from '../state/navigation'
import type {RaceTelemetry} from '../../runtime/SimulationRuntime'

import {pedalPressure,AnalogGamepadDriver} from '../../runtime/driver/AnalogInput'
export function DriveControls({runtime}:{runtime:SimulationRuntime}) {
  const phase=useNavigation(s=>s.phase),telemetry=useRaceHud()
  return <DriveControlsPanel runtime={runtime} phase={phase} telemetry={telemetry}/>
}
export function DriveControlsPanel({runtime,phase,telemetry}:{runtime:SimulationRuntime;phase:string;telemetry:RaceTelemetry}) {
  const [expanded,setExpanded]=useState(true),[gamepad,setGamepad]=useState(false)
  const driving=phase==='NORMAL_DRIVE'||phase==='RECOVERY_DRIVE'
  useEffect(()=>{
    if(!driving)return
    let request=0
    const adapter=new AnalogGamepadDriver(runtime.driverInput)
    const read=()=>{
      try{const pad=navigator.getGamepads?.().find(p=>p?.connected)??null;adapter.update(pad);setGamepad(!!pad)}
      catch{adapter.reset();setGamepad(false)}
      request=requestAnimationFrame(read)
    }
    request=requestAnimationFrame(read)
    return()=>{cancelAnimationFrame(request);adapter.reset()}
  },[driving,runtime])
  useEffect(()=>{if(!driving)runtime.driverInput.resetMotion();return()=>runtime.driverInput.resetMotion()},[driving,runtime])
  if(!['PRE_RACE','NORMAL_DRIVE','RECOVERY_COUNTDOWN','RECOVERY_DRIVE','PAUSE_MENU'].includes(phase))return null
  const write=(key:'accelerator'|'brake',value:number)=>key==='accelerator'?runtime.driverInput.setAccelerator(value):runtime.driverInput.setBrake(value)
  const move=(e:PointerEvent<HTMLDivElement>,key:'accelerator'|'brake')=>{if(!driving||!e.currentTarget.hasPointerCapture(e.pointerId))return;const r=e.currentTarget.getBoundingClientRect();write(key,pedalPressure(e.clientY,r.top,r.height))}
  return <aside className={`drive-controls ${expanded?'expanded':'compact'}`} aria-label="연속 페달과 조향 조작"><button className="drive-control-toggle" onClick={()=>setExpanded(v=>!v)}>{gamepad?'게임패드 연결됨 · ':''}{expanded?'조작판 접기':'페달·조향 펼치기'}</button>{expanded&&<><div className="drive-inputs">{(['brake','accelerator'] as const).map(key=><div key={key} className={`pressure-pedal ${key}`} role="slider" tabIndex={driving?0:-1} aria-label={key==='brake'?'브레이크 압력':'가속 페달 압력'} aria-valuemin={0} aria-valuemax={100} aria-valuenow={Math.round(telemetry[key]*100)} aria-disabled={!driving} style={{'--pressure':telemetry[key]} as CSSProperties} onPointerDown={e=>{if(!driving)return;e.currentTarget.setPointerCapture(e.pointerId);move(e,key)}} onPointerMove={e=>move(e,key)} onPointerUp={e=>{write(key,0);if(e.currentTarget.hasPointerCapture(e.pointerId))e.currentTarget.releasePointerCapture(e.pointerId)}} onPointerCancel={()=>write(key,0)} onLostPointerCapture={()=>write(key,0)} onBlur={()=>write(key,0)} onKeyDown={e=>{if(driving&&['ArrowUp','ArrowDown'].includes(e.key)){e.preventDefault();e.stopPropagation();write(key,telemetry[key]+(e.key==='ArrowUp'?.1:-.1))}}}><span>{key==='brake'?'BRAKE':'ACCEL'}</span><i className="pressure-metal"><b/><b/><b/><b/></i><strong>{Math.round(telemetry[key]*100)}%</strong></div>)}<label className="analog-steering"><span>조향</span><i style={{transform:`rotate(${telemetry.steering*70}deg)`}}>◉</i><input aria-label="연속 조향" type="range" min="-1" max="1" step="0.01" value={telemetry.steering} disabled={!driving} onChange={e=>runtime.driverInput.setSteering(Number(e.target.value))} onPointerUp={()=>runtime.driverInput.setSteering(0)} onBlur={()=>runtime.driverInput.setSteering(0)}/></label></div><p>W/↑ 가속 · S/↓ 제동 · A/D 조향 · 1–4 P/R/N/D · Esc 일시정지<br/>페달 위로 드래그하면 압력 증가, 놓으면 해제 · 게임패드 RT/LT/스틱</p></>}</aside>
}
