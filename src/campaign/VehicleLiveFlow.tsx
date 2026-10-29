import type {RaceTelemetry} from '../../simulation/src/runtime/SimulationRuntime'
import type {SystemOutput} from './vehicleSystems'
import type {VehicleActuation} from '../workshop/WorkshopController'

export function VehicleLiveFlow({telemetry,system,actuation}:{telemetry:RaceTelemetry;system:SystemOutput|null;actuation:VehicleActuation|null}){
 const torque=telemetry.eDriveCommand.magnitudeNm,brake=telemetry.physicsCommand?.brakeForceN??0,angle=telemetry.physicsCommand?.frontWheelAngleRad??0
 const stages=[
  {name:'전력 경로',value:system?.state.hv??'OFF',active:system?.contactors.main??false},
  {name:'모터',value:`${torque.toFixed(0)} Nm`,active:torque>1},
  {name:'제동',value:`${brake.toFixed(0)} N`,active:brake>1},
  {name:'앞바퀴',value:`${(angle*180/Math.PI).toFixed(0)}°`,active:Math.abs(angle)>.01},
 ]
 return <div className="d16-live-flow" aria-label="현재 차량 시스템과 물리 반응"><div className="d16-live-flow-stages">{stages.map((stage,index)=><div key={stage.name} className={stage.active?'active':''}><small>{index+1} · {stage.name}</small><b>{stage.value}</b></div>)}</div>{actuation&&<small className="d16-live-flow-detail">회생 {actuation.regenNm.toFixed(0)} Nm · 마찰 {actuation.frictionN.toFixed(0)} N · EPS 보조 {actuation.assistNm.toFixed(1)} Nm</small>}</div>
}
