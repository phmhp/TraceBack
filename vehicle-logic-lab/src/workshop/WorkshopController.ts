import {WasmVehicleSw} from '../../simulation/src/runtime/c/WasmVehicleSw.ts'
import type {VehicleSwInput,VehicleSwOutput,VehicleSwPort} from '../../simulation/src/runtime/c/VehicleSwPort.ts'
import {SimulationRuntime} from '../../simulation/src/runtime/SimulationRuntime.ts'
import type {RaceTelemetry} from '../../simulation/src/runtime/SimulationRuntime.ts'
import {PHYSICS_TIMESTEP} from '../../simulation/src/core/SimulationClock.ts'
import {TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration} from '../../simulation/src/data/calibration/TrackbackSimulationCalibration.ts'
import {TorqueModel,torqueFingerprint} from '../engineering/torqueModel.ts'
import type {TorqueFrame,TorqueInput} from '../engineering/torqueModel.ts'
import {hardwareReady,MECHANICS} from './model.ts'
import {ecuReady} from './assembly.ts'
import type {WorkshopRecord} from './model.ts'
export type WorkshopControls={ready:boolean;brake:number;channelOffset:number;ageMs:number;capNm:number;ecuRequired?:boolean}
export class WorkshopController implements VehicleSwPort{
 readonly source='TRAINING_COMPOSED' as const
 readonly calibrationReference='TRAINING-DRIVE-1.0 / 7:1 / 0.9 / 0.425m'
 private model=new TorqueModel();private accumulator=0;private hash='';private c:VehicleSwPort
 frame:TorqueFrame={values:{},issues:[],torqueNm:0,targetNm:0,permitted:false}
 input:TorqueInput={pedalA:0,pedalB:0,ageMs:20,brakePct:0,ready:false,gear:'P',capNm:180}
 controlTicks=0;distance=0;brakeUsed=false
 private read:()=>{record:WorkshopRecord;controls:WorkshopControls}
 constructor(c:VehicleSwPort,read:()=>{record:WorkshopRecord;controls:WorkshopControls}){this.c=c;this.read=read}
 reset(){this.c.reset();this.model.reset();this.accumulator=0;this.hash='';this.controlTicks=0;this.distance=0;this.brakeUsed=false;this.frame={values:{},issues:[],torqueNm:0,targetNm:0,permitted:false}}
 step(input:VehicleSwInput):VehicleSwOutput{
  const {record,controls}=this.read(),allowed=hardwareReady(record)&&(!controls.ecuRequired||ecuReady(record.assembly,record.cables))&&controls.ready&&input.vehicleReady&&input.propulsionEnable&&input.acceleratorPedalValidity==='VALID'&&input.gearRequestValidity==='VALID'
  const baseline=this.c.step({...input,vehicleReady:allowed,propulsionEnable:allowed}),hash=torqueFingerprint(record.graph)+JSON.stringify(record.assembly)+[...record.cables].sort().join(',')
  if(this.hash!==hash){this.distance=0;this.brakeUsed=false;this.model.reset();this.accumulator=0;this.frame={values:{},issues:[],torqueNm:0,targetNm:0,permitted:false};this.hash=hash}
  const pedal=input.acceleratorPedalPosition*100
  this.input={pedalA:pedal,pedalB:pedal+controls.channelOffset,ageMs:controls.ageMs,brakePct:controls.brake*100,ready:allowed,gear:baseline.gearState,capNm:controls.capNm}
  // One owner: the existing 60Hz physics clock schedules a 20ms sample/hold controller.
  this.accumulator+=PHYSICS_TIMESTEP
  while(this.accumulator+1e-10>=.02){this.frame=this.model.step(record.graph,this.input,.02);this.controlTicks++;this.accumulator-=.02}
  // Hardware/READY loss is an explicit interlock, never a post-physics cosmetic gate.
  if(!allowed){this.model.reset();this.frame={...this.frame,values:{...this.frame.values,'permission.allow':false,'dynamics.torque':0,'command.torque':0},torqueNm:0,permitted:false}}
  const torque=this.frame.torqueNm,direction=torque>0?'FORWARD':'NONE',validity=this.frame.issues.length?'INVALID':'VALID'
  if(allowed&&torque>0&&controls.brake===0)this.distance+=Math.abs(input.longitudinalVelocity)*PHYSICS_TIMESTEP
  if(controls.brake>=.05&&Math.abs(input.longitudinalVelocity)>.2)this.brakeUsed=true
  return{...baseline,propulsionState:allowed?'PROP_ENABLED':'PROP_DISABLED',propulsionRequest:{magnitude:allowed?input.acceleratorPedalPosition:0,direction:allowed?'FORWARD':'NONE',validity},driveTorqueRequest:{magnitudeNm:Number(this.frame.values['request.torque']??0),direction,validity},eDriveCommand:{magnitudeNm:torque,direction,validity}}
 }
}
export function createWorkshopRuntime(module:WebAssembly.Module,read:()=>{record:WorkshopRecord;controls:WorkshopControls},publish:(t:RaceTelemetry)=>void){
 const config={...calibration,torqueToForce:{...calibration.torqueToForce,value:MECHANICS.ratio*MECHANICS.efficiency/MECHANICS.wheelRadiusM}}
 const controller=new WorkshopController(new WasmVehicleSw(module,config),read)
 const runtime=new SimulationRuntime(config,publish,undefined,controller)
 runtime.configureReadyGate(()=>read().controls.ready&&hardwareReady(read().record))
 return{runtime,controller}
}
