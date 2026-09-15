import { useEffect, useMemo, useRef, useState } from 'react'
import { RequirementMap } from '../xray/RequirementMap'
import type { XRayNodeId } from '../../data/ground-truth/PropulsionGroundTruth'
import { useRaceActions } from '../state/RaceActionsContext'
import { useRaceHud } from '../state/raceHud'
import { useNavigation } from '../state/navigation'
import { xrayNodeRegistry } from '../xray/XRayNodeRegistry'

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
  ['FUNCTION','Propulsion','Braking · FUTURE','Steering · FUTURE','Gear','Stability · FUTURE','ADAS / Active Safety · FUTURE'],
  ['VEHICLE MOTION CONTROL','VMC'],
  ['ACTUATOR / DOMAIN CONTROL','eDrive','Brake Controller · FUTURE','EPS · FUTURE','Active Suspension · FUTURE'],
  ['COMMUNICATION','CAN / CAN-FD · FUTURE'],
  ['MONITORING','Functional Monitoring · FUTURE'],
  ['PLATFORM SUPERVISION','Scheduler · FUTURE','Task / Tick · FUTURE','Watchdog · FUTURE','Fault Manager · FUTURE'],
  ['PLANT','Vehicle Dynamics','Suspension Dynamics','Tire / Road','Environment'],
] as const

function ArchitectureContext() {
  return <div className="architecture-context" aria-label="Reference vehicle architecture">
    {architectureGroups.map(([title,...items])=><section key={title}><b>{title}</b>{items.map(item=><span className={item.includes('FUTURE')?'future':''} key={item}>{item}</span>)}</section>)}
  </div>
}

export function XRayScreen() {
  const leaveXRay=useNavigation(s=>s.leaveXRay); const {pause,resume}=useRaceActions(); const telemetry=useRaceHud()
  const [selectedNode,setSelectedNode]=useState<XRayNodeId>('PropulsionFunction')
  const [architectureView,setArchitectureView]=useState<'PATH'|'ALL'>('PATH')
  const values=useMemo<Record<XRayNodeId,SignalGroup>>(()=>({
    DriverInput:{input:[],output:[['AcceleratorPedalPosition',n(telemetry.accelerator*100,1),'%'],['AcceleratorPedalValidity',telemetry.acceleratorValidity],['GearRequest',telemetry.gearRequest],['Brake',n(telemetry.brake*100,1),'%'],['Steering',n(telemetry.steering*100,1),'%']]},
    GearLogic:{input:[['GearRequest',telemetry.gearRequest],['LongitudinalVelocity',n(telemetry.longitudinalVelocity),'m/s']],state:[['TransitionAccepted',String(telemetry.transitionAccepted)]],output:[['GearState',telemetry.gear],['GearStateValidity',telemetry.gearStateValidity]]},
    PropulsionFunction:{input:[['AcceleratorPedalPosition',n(telemetry.accelerator*100,1),'%'],['AcceleratorPedalValidity',telemetry.acceleratorValidity],['GearState',telemetry.gear],['GearStateValidity',telemetry.gearStateValidity],['VehicleReady',String(telemetry.vehicleReady)],['PropulsionEnable',String(telemetry.propulsionEnable)]],state:[['PropulsionState',telemetry.propulsionState]],output:[['PropulsionRequestMagnitude',n(telemetry.propulsionRequest.magnitude)],['PropulsionRequestDirection',telemetry.propulsionRequest.direction],['PropulsionRequestValidity',telemetry.propulsionRequest.validity]]},
    VMC:{input:[['PropulsionRequestMagnitude',n(telemetry.propulsionRequest.magnitude)],['Direction',telemetry.propulsionRequest.direction],['Validity',telemetry.propulsionRequest.validity]],output:[['DriveTorqueRequestMagnitude',n(telemetry.driveTorqueRequest.magnitudeNm,1),'Nm'],['DriveDirection',telemetry.driveTorqueRequest.direction],['DriveValidity',telemetry.driveTorqueRequest.validity]]},
    eDrive:{input:[['DriveTorqueRequestMagnitude',n(telemetry.driveTorqueRequest.magnitudeNm,1),'Nm'],['Direction',telemetry.driveTorqueRequest.direction],['Validity',telemetry.driveTorqueRequest.validity]],output:[['EDriveTorqueCommandMagnitude',n(telemetry.eDriveCommand.magnitudeNm,1),'Nm'],['EDriveDirection',telemetry.eDriveCommand.direction],['EDriveCommandValidity',telemetry.eDriveCommand.validity]]},
    VehiclePhysics:{input:[['EDriveTorqueCommandMagnitude',n(telemetry.eDriveCommand.magnitudeNm,1),'Nm'],['Direction',telemetry.eDriveCommand.direction],['Validity',telemetry.eDriveCommand.validity]],output:[['VehicleSpeed',n(telemetry.speedKmh,1),'km/h'],['LongitudinalVelocity',n(telemetry.longitudinalVelocity),'m/s'],['VehicleLongitudinalAcceleration',n(telemetry.longitudinalAcceleration),'m/s²']]},
  }),[telemetry])
  const inspector=values[selectedNode]; const time=telemetry.simulationTime
  const signals=(title:string,items:Signal[])=>items.length?<section className="signal-group"><h3>{title}</h3><dl>{items.map(([name,value,unit])=><div key={name}><dt>{name}</dt><LiveValue value={value} unit={unit}/></div>)}</dl></section>:null
  const nodeActive=(id:XRayNodeId)=>id==='DriverInput'?telemetry.accelerator>0||telemetry.brake>0||Math.abs(telemetry.steering)>.01:id==='GearLogic'?telemetry.transitionAccepted:id==='PropulsionFunction'?telemetry.propulsionState==='PROP_ENABLED':id==='VMC'?telemetry.driveTorqueRequest.magnitudeNm>0:id==='eDrive'?telemetry.eDriveCommand.magnitudeNm>0:telemetry.speedKmh>.1||Math.abs(telemetry.longitudinalAcceleration)>.01

  return <section className="xray-screen">
    <header className="xray-header"><div><p>TRACKBACK · 실시간 모니터링 기능</p><h1>LIVE X-RAY</h1></div><div className="xray-actions"><span className={`xray-state ${telemetry.status==='paused'?'paused':'live'}`}>{telemetry.status==='paused'?'PAUSED':'LIVE'}</span><button onClick={telemetry.status==='paused'?resume:pause}>{telemetry.status==='paused'?'RESUME':'PAUSE'}</button><button onClick={leaveXRay}>RETURN TO DRIVE <kbd>F9</kbd></button></div></header>
    <nav className={`runtime-flow ${architectureView==='ALL'?'show-architecture':''}`} aria-label="Active Function Path"><span><b>{architectureView==='PATH'?'ACTIVE FUNCTION PATH':'ALL ARCHITECTURE'}</b><small>{architectureView==='PATH'?'Current executable path':'Reference vehicle context'}</small><span className="architecture-toggle"><button className={architectureView==='PATH'?'on':''} onClick={()=>setArchitectureView('PATH')}>ACTIVE PATH</button><button className={architectureView==='ALL'?'on':''} onClick={()=>setArchitectureView('ALL')}>ALL</button></span></span>{architectureView==='PATH'?xrayNodeRegistry.map((node,index)=><div className={`runtime-flow-item domain-${node.domain.toLowerCase()} ${nodeActive(node.id)?'active':''}`} key={node.id}><button className={`${selectedNode===node.id?'selected ':''}${node.domain==='PLANT'?'plant-node':''}`} onClick={()=>setSelectedNode(node.id)}><small>{node.domainLabel}</small><b>{node.label}</b></button>{index<xrayNodeRegistry.length-1&&<i>→</i>}</div>):<ArchitectureContext/>}</nav>
    <div className="xray-main">
      <aside className="instrument-panel signal-monitor"><header><span>SIGNAL MONITOR</span><small>신호값 모니터링</small></header><h2>{xrayNodeRegistry.find(item=>item.id===selectedNode)?.label}</h2>{signals('INPUT',inspector.input)}{inspector.state&&signals('STATE',inspector.state)}{signals('OUTPUT',inspector.output)}</aside>
      <main className="instrument-panel requirement-trace requirement-map-panel"><header><span>REQUIREMENT TRACE</span><small>Vehicle Motion · 요구사항 연결 지도</small></header><RequirementMap onComponent={setSelectedNode}/></main>
      <aside className="instrument-panel driving-view"><header><span>LIVE DRIVING VIEW</span><small>VEHICLE BEHAVIOR</small></header><div className="driving-view-slot"/><dl><div><dt>SIMULATION TIME</dt><dd>{time.toFixed(2)} s</dd></div><div><dt>VEHICLE SPEED</dt><dd>{telemetry.speedKmh.toFixed(1)} km/h</dd></div><div><dt>GEAR STATE</dt><dd>{telemetry.gear}</dd></div><div><dt>MODE</dt><dd>LIVE_MONITOR</dd></div></dl><p>실시간 관찰 전용 · 고장 및 테스트 판정 없음</p></aside>
    </div>
    <footer className="xray-timeline"><div><span>TIMELINE</span><small>LIVE_MONITOR · HISTORY SOURCE NOT CONNECTED</small></div><div className="timeline-track"><span>{Math.max(0,time-.8).toFixed(2)}</span><span>{Math.max(0,time-.6).toFixed(2)}</span><span>{Math.max(0,time-.4).toFixed(2)}</span><span>{Math.max(0,time-.2).toFixed(2)}</span><span>{time.toFixed(2)}</span><i/><b>CURRENT</b></div><button disabled title="Runtime history source is not implemented">SCRUB LIVE ONLY</button></footer>
  </section>
}



