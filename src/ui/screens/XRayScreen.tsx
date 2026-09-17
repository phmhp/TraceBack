import { useEffect, useMemo, useRef, useState } from 'react'
import { RequirementMap } from '../xray/RequirementMap'
import type { XRayNodeId } from '../../data/ground-truth/PropulsionGroundTruth'
import { useRaceActions } from '../state/RaceActionsContext'
import { useRaceHud } from '../state/raceHud'
import { useNavigation } from '../state/navigation'
import { xrayNodeRegistry } from '../xray/XRayNodeRegistry'
import buildInfo from '../../runtime/c/generated/build.json'

type Signal = [string,string,string?]
type SignalGroup = { input:Signal[]; state?:Signal[]; output:Signal[] }
const n=(value:number,digits=3)=>Number.isFinite(value)?value.toFixed(digits):'UNAVAILABLE'

function LiveValue({value,unit}:{value:string;unit?:string}) {
  const previous=useRef(value); const [changed,setChanged]=useState(false)
  useEffect(()=>{if(previous.current===value)return;previous.current=value;setChanged(true);const timer=window.setTimeout(()=>setChanged(false),420);return()=>window.clearTimeout(timer)},[value])
  const status=/INVALID|FAIL|CRITICAL/.test(value)?'fail':/VALID|ENABLED|true|FORWARD|REVERSE/.test(value)?'normal':'neutral'
  return <dd title={value} className={`${changed?'value-changed ':''}${status}${value.length>11?' long-value':''}`}><b>{value}</b>{unit&&<small>{unit}</small>}</dd>
}

const architectureGroups = [
  ['DOMAIN','POWERTRAIN / PROPULSION'],
  ['FUNCTION','Propulsion'],
  ['LOGICAL SW COMPONENT','Gear Logic','Propulsion Function','VMC','eDrive'],
  ['EXECUTION UNIT','C functions · sequential fixed step'],
  ['COMPUTING PLATFORM','Browser WebAssembly · reference environment'],
  ['MONITORING','NOT AVAILABLE'],
  ['PLATFORM SUPERVISION','NOT AVAILABLE'],
  ['PLANT','Rapier Vehicle Physics'],
] as const

function ArchitectureContext() {
  return <div className="architecture-context" aria-label="Reference vehicle architecture">
    {architectureGroups.map(([title,...items])=><section key={title}><b>{title}</b>{items.map(item=><span className={item.includes('FUTURE')?'future':''} key={item}>{item}</span>)}</section>)}
  </div>
}

export function XRayScreen() {
  const leaveXRay=useNavigation(s=>s.leaveXRay); const {pause,resume}=useRaceActions(); const telemetry=useRaceHud()
  const [selectedNode,setSelectedNode]=useState<XRayNodeId>('PropulsionFunction')
  const snapshot=telemetry.vehicleSw
  const observed=useMemo(()=>snapshot?{...telemetry,
    accelerator:snapshot.input.acceleratorPedalPosition,acceleratorValidity:snapshot.input.acceleratorPedalValidity,
    gearRequest:snapshot.input.gearRequest,gear:snapshot.output.gearState,
    vehicleReady:snapshot.input.vehicleReady,propulsionEnable:snapshot.input.propulsionEnable,
    ...snapshot.output,
  }:telemetry,[snapshot,telemetry])
  const [architectureView,setArchitectureView]=useState<'PATH'|'ALL'>('PATH')
  const values=useMemo<Record<XRayNodeId,SignalGroup>>(()=>({
    DriverInput:{input:[],output:[['AcceleratorPedalPosition',n(telemetry.accelerator*100,1),'%'],['AcceleratorPedalValidity',telemetry.acceleratorValidity],['GearRequest',telemetry.gearRequest],['Brake',n(telemetry.brake*100,1),'%'],['Steering',n(telemetry.steering*100,1),'%']]},
    GearLogic:{input:[['GearRequest',observed.gearRequest],['GearRequestValidity',snapshot?.input.gearRequestValidity??'NOT SAMPLED'],['LongitudinalVelocity',snapshot?n(snapshot.input.longitudinalVelocity):'NOT SAMPLED','m/s']],state:[['TransitionAccepted',String(observed.transitionAccepted)]],output:[['GearState',observed.gear],['GearStateValidity',observed.gearStateValidity]]},
    PropulsionFunction:{input:[['AcceleratorPedalPosition',n(observed.accelerator*100,1),'%'],['AcceleratorPedalValidity',observed.acceleratorValidity],['GearState',observed.gear],['GearStateValidity',observed.gearStateValidity],['VehicleReady',String(observed.vehicleReady)],['PropulsionEnable',String(observed.propulsionEnable)]],state:[['PropulsionState',observed.propulsionState]],output:[['PropulsionRequestMagnitude',n(observed.propulsionRequest.magnitude)],['PropulsionRequestDirection',observed.propulsionRequest.direction],['PropulsionRequestValidity',observed.propulsionRequest.validity]]},
    VMC:{input:[['VehicleSpeed',snapshot?n(snapshot.input.vehicleSpeed):'NOT SAMPLED','m/s'],['PropulsionRequestMagnitude',n(observed.propulsionRequest.magnitude)],['Direction',observed.propulsionRequest.direction],['Validity',observed.propulsionRequest.validity]],output:[['DriveTorqueRequestMagnitude',n(observed.driveTorqueRequest.magnitudeNm,1),'Nm'],['DriveDirection',observed.driveTorqueRequest.direction],['DriveValidity',observed.driveTorqueRequest.validity]]},
    eDrive:{input:[['DriveTorqueRequestMagnitude',n(observed.driveTorqueRequest.magnitudeNm,1),'Nm'],['Direction',observed.driveTorqueRequest.direction],['Validity',observed.driveTorqueRequest.validity]],output:[['EDriveTorqueCommandMagnitude',n(observed.eDriveCommand.magnitudeNm,1),'Nm'],['EDriveDirection',observed.eDriveCommand.direction],['EDriveCommandValidity',observed.eDriveCommand.validity]]},
    VehiclePhysics:{input:[['EDriveTorqueCommandMagnitude',n(telemetry.eDriveCommand.magnitudeNm,1),'Nm'],['Direction',telemetry.eDriveCommand.direction],['Validity',telemetry.eDriveCommand.validity]],output:[['VehicleSpeed',n(telemetry.speedKmh,1),'km/h'],['LongitudinalVelocity',n(telemetry.longitudinalVelocity),'m/s'],['VehicleLongitudinalAcceleration',n(telemetry.longitudinalAcceleration),'m/s²']]},
  }),[telemetry,observed,snapshot])
  const inspector=values[selectedNode]; const time=telemetry.simulationTime
  const signals=(title:string,items:Signal[])=>items.length?<section className="signal-group"><h3>{title}</h3><dl>{items.map(([name,value,unit])=><div key={name}><dt>{name}</dt><LiveValue value={value} unit={unit}/></div>)}</dl></section>:null
  const nodeActive=(id:XRayNodeId)=>id==='DriverInput'?telemetry.accelerator>0||telemetry.brake>0||Math.abs(telemetry.steering)>.01:id==='GearLogic'?telemetry.transitionAccepted:id==='PropulsionFunction'?telemetry.propulsionState==='PROP_ENABLED':id==='VMC'?telemetry.driveTorqueRequest.magnitudeNm>0:id==='eDrive'?telemetry.eDriveCommand.magnitudeNm>0:telemetry.speedKmh>.1||Math.abs(telemetry.longitudinalAcceleration)>.01

  return <section className="xray-screen">
    <header className="xray-header"><div><p>TRACKBACK · 실시간 모니터링 기능</p><h1>LIVE X-RAY</h1></div><div className="xray-actions"><span className={`xray-state ${telemetry.status==='paused'?'paused':'live'}`}>{telemetry.status==='paused'?'PAUSED':'LIVE'}</span><button onClick={telemetry.status==='paused'?resume:pause}>{telemetry.status==='paused'?'RESUME':'PAUSE'}</button><button onClick={leaveXRay}>RETURN TO DRIVE <kbd>F9</kbd></button></div></header>
    <nav className={`runtime-flow ${architectureView==='ALL'?'show-architecture':''}`} aria-label="Active Function Path"><span><b>{architectureView==='PATH'?'ACTIVE FUNCTION PATH':'ALL ARCHITECTURE'}</b><small>{architectureView==='PATH'?'Current executable path':'Reference vehicle context'}</small><span className="architecture-toggle"><button className={architectureView==='PATH'?'on':''} onClick={()=>setArchitectureView('PATH')}>ACTIVE PATH</button><button className={architectureView==='ALL'?'on':''} onClick={()=>setArchitectureView('ALL')}>ALL</button></span></span>{architectureView==='PATH'?xrayNodeRegistry.map((node,index)=><div className={`runtime-flow-item domain-${node.domain.toLowerCase()} ${nodeActive(node.id)?'active':''}`} key={node.id}><button className={`${selectedNode===node.id?'selected ':''}${node.domain==='PLANT'?'plant-node':''}`} onClick={()=>setSelectedNode(node.id)}><small>{node.domainLabel}</small><b>{node.label}</b></button>{index<xrayNodeRegistry.length-1&&<i>→</i>}</div>):<ArchitectureContext/>}</nav>
    <div className="xray-main">
      <aside className="instrument-panel signal-monitor"><header><span>SIGNAL MONITOR</span><small>신호값 모니터링</small></header><h2>{xrayNodeRegistry.find(item=>item.id===selectedNode)?.label}</h2><div className="sw-evidence"><b>{snapshot?.source??'NOT SAMPLED'}</b><span>{snapshot?`Step ${snapshot.step} · ${snapshot.executionTime.toFixed(3)} s · ${(snapshot.periodSeconds*1000).toFixed(2)} ms`:'첫 제어 호출 대기'}</span><span>C ABI {buildInfo.abi} · {buildInfo.binaryHash.slice(0,12)}</span><span>MONITORING / PLATFORM: NOT AVAILABLE</span><details><summary>Calibration reference</summary><p>{snapshot?.calibrationReference??'NOT SAMPLED'}</p>{snapshot?.calibration.map((value,index)=><p key={index}>{['Gear threshold (m/s)','Forward map maximum (Nm)','Forward zero torque speed (m/s)','Reverse map maximum (Nm)','Reverse zero torque speed (m/s)','Forward limit (Nm)','Reverse limit (Nm)'][index]}: {value}</p>)}</details><small>{selectedNode==='VehiclePhysics'?'Plant: post-step 관측값':selectedNode==='DriverInput'?'현재 운전자 입력':snapshot?'동일 C 호출의 입력 / 출력':'실행 전 초기값 · 실행 증거 없음'}</small></div>{signals('INPUT',inspector.input)}{inspector.state&&signals('STATE',inspector.state)}{signals('OUTPUT',inspector.output)}</aside>
      <main className="instrument-panel requirement-trace requirement-map-panel"><header><span>REQUIREMENT TRACE</span><small>Vehicle Motion · 요구사항 연결 지도</small></header><RequirementMap onComponent={setSelectedNode}/></main>
      <aside className="instrument-panel driving-view"><header><span>LIVE DRIVING VIEW</span><small>VEHICLE BEHAVIOR</small></header><div className="driving-view-slot"/><dl><div><dt>SIMULATION TIME</dt><dd>{time.toFixed(2)} s</dd></div><div><dt>VEHICLE SPEED</dt><dd>{telemetry.speedKmh.toFixed(1)} km/h</dd></div><div><dt>GEAR STATE</dt><dd>{telemetry.gear}</dd></div><div><dt>MODE</dt><dd>LIVE_MONITOR</dd></div></dl><p>실시간 관찰 전용 · 고장 및 테스트 판정 없음</p></aside>
    </div>
    <footer className="xray-timeline"><div><span>TIMELINE</span><small>LIVE_MONITOR · HISTORY SOURCE NOT CONNECTED</small></div><div className="timeline-track"><span>{Math.max(0,time-.8).toFixed(2)}</span><span>{Math.max(0,time-.6).toFixed(2)}</span><span>{Math.max(0,time-.4).toFixed(2)}</span><span>{Math.max(0,time-.2).toFixed(2)}</span><span>{time.toFixed(2)}</span><i/><b>CURRENT</b></div><button disabled title="Runtime history source is not implemented">SCRUB LIVE ONLY</button></footer>
  </section>
}



