import {WasmVehicleSw} from '../../simulation/src/runtime/c/WasmVehicleSw.ts'
import type {VehicleSwInput,VehicleSwOutput,VehicleSwPort} from '../../simulation/src/runtime/c/VehicleSwPort.ts'
import {SimulationRuntime} from '../../simulation/src/runtime/SimulationRuntime.ts'
import type {RaceTelemetry,RuntimeTickObservation} from '../../simulation/src/runtime/SimulationRuntime.ts'
import {PHYSICS_TIMESTEP} from '../../simulation/src/core/SimulationClock.ts'
import {TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration} from '../../simulation/src/data/calibration/TrackbackSimulationCalibration.ts'
import {TorqueModel,torqueFingerprint} from '../engineering/torqueModel.ts'
import type {TorqueFrame,TorqueInput} from '../engineering/torqueModel.ts'
import {hardwareReady,MECHANICS} from './model.ts'
import {ecuReady} from './assembly.ts'
import type {WorkshopRecord} from './model.ts'
import {evaluateModel,executeVehicle} from '../campaign/domainTraining.ts'
import type {Designs,ExecutionEvent,LogicId} from '../campaign/domainTraining.ts'
import {firstBoundaryDifference} from '../campaign/traceComparison.ts'
import type {BoundaryDifference} from '../campaign/traceComparison.ts'
import {NEW_SYSTEM_STATE,NORMAL_SYSTEM_INPUT,stepVehicleSystems} from '../campaign/vehicleSystems.ts'
import type {SystemInput,SystemOutput,SystemState} from '../campaign/vehicleSystems.ts'
export type WorkshopControls={ready:boolean;brake:number;steering?:number;channelOffset:number;ageMs:number;capNm:number;ecuRequired?:boolean;requireStartSequence?:boolean;injected?:TorqueInput;domainDesigns?:Designs;systemInput?:Partial<SystemInput>}
export type VehicleActuation={brakeForceN:number;frontWheelAngleRad:number;regenNm:number;frictionN:number;assistNm:number;availableTorqueNm:number;packAvailable:boolean}
export type VehicleRunSample=RuntimeTickObservation&{system:{packAvailable:boolean;bmsSafe?:boolean;startRequestEdge?:boolean;startPermit?:boolean;hv?:string;prechargeContactor?:boolean;mainContactor?:boolean;powerEnable?:boolean;availableTorqueNm:number;regenNm:number;frictionN:number;assistNm:number;diagnostics:string[]};graph:Partial<Record<LogicId,ExecutionEvent[]>>;firstDifference:BoundaryDifference|null}
/** One sampled command is shared by the physics adapter and the scene readout. */
export function composeVehicleActuation(system:SystemOutput,authored:{brakeForce:number;wheelAngle:number},brakePct:number,record:WorkshopRecord):VehicleActuation{
 const requested=Math.max(0,Math.min(4200,Number.isFinite(authored.brakeForce)?authored.brakeForce:0))
 const systemRequested=Math.max(0,Math.min(4200,brakePct*42))
 const fraction=systemRequested>0?Math.min(1,requested/systemRequested):0
 const regenForce=system.brake.regenNm*MECHANICS.ratio*MECHANICS.efficiency/MECHANICS.wheelRadiusM
 const frictionN=system.brake.frictionN*fraction
 const brakeReady=record.assembly.brakes==='FIXED'&&record.cables.includes('brakeControl')
 const steerReady=record.assembly.steeringRack==='FIXED'&&record.cables.includes('steeringControl')
 const frontWheelAngleRad=steerReady&&Number.isFinite(authored.wheelAngle)?Math.max(-.48,Math.min(.48,authored.wheelAngle)):0
 return{brakeForceN:brakeReady?Math.min(4200,frictionN+regenForce*fraction):0,frontWheelAngleRad,regenNm:brakeReady?system.brake.regenNm*fraction:0,frictionN:brakeReady?frictionN:0,assistNm:steerReady?system.steering.assistNm:0,availableTorqueNm:system.availableTorqueNm,packAvailable:system.packAvailable}
}
export class WorkshopController implements VehicleSwPort{
 readonly source='TRAINING_COMPOSED' as const
 readonly calibrationReference='TRAINING-DRIVE-1.0 / 7:1 / 0.9 / 0.425m'
 private model=new TorqueModel();private accumulator=0;private hash='';private c:VehicleSwPort
 frame:TorqueFrame={values:{},issues:[],torqueNm:0,targetNm:0,permitted:false}
 systemFrame:SystemOutput|null=null
 actuation:VehicleActuation|null=null
 lastDomainExecution:ReturnType<typeof executeVehicle>|null=null
 lastDifference:BoundaryDifference|null=null
 lastStartRequestEdge=false
 lastStartPermit=false
 private systemState:SystemState={...NEW_SYSTEM_STATE}
 private previousReadyRequest=false
 private environment:()=>Partial<SystemInput>=()=>({})
 input:TorqueInput={pedalA:0,pedalB:0,ageMs:20,brakePct:0,ready:false,gear:'P',capNm:180}
 controlTicks=0;distance=0;brakeUsed=false
 private read:()=>{record:WorkshopRecord;controls:WorkshopControls}
 constructor(c:VehicleSwPort,read:()=>{record:WorkshopRecord;controls:WorkshopControls}){this.c=c;this.read=read}
 setEnvironmentReader(reader:()=>Partial<SystemInput>){this.environment=reader}
 reset(){this.c.reset();this.model.reset();this.accumulator=0;this.hash='';this.controlTicks=0;this.distance=0;this.brakeUsed=false;this.systemState={...NEW_SYSTEM_STATE};this.previousReadyRequest=false;this.systemFrame=null;this.actuation=null;this.lastDomainExecution=null;this.lastDifference=null;this.lastStartRequestEdge=false;this.lastStartPermit=false;this.frame={values:{},issues:[],torqueNm:0,targetNm:0,permitted:false}}
 step(input:VehicleSwInput):VehicleSwOutput{
  const {record,controls}=this.read(),allowed=hardwareReady(record)&&(!controls.ecuRequired||ecuReady(record.assembly,record.cables))&&controls.ready&&input.vehicleReady&&input.propulsionEnable&&input.acceleratorPedalValidity==='VALID'&&input.gearRequestValidity==='VALID'
  const baseline=this.c.step({...input,vehicleReady:allowed,propulsionEnable:allowed}),hash=torqueFingerprint(record.graph)+JSON.stringify(record.assembly)+[...record.cables].sort().join(',')
  if(this.hash!==hash){this.distance=0;this.brakeUsed=false;this.model.reset();this.accumulator=0;this.frame={values:{},issues:[],torqueNm:0,targetNm:0,permitted:false};this.hash=hash}
  const pedal=input.acceleratorPedalPosition*100
  const systemInput:SystemInput={...NORMAL_SYSTEM_INPUT,...this.environment(),...controls.systemInput,gear:baseline.gearState as SystemInput['gear'],brakePct:controls.brake*100,pedalPct:pedal,steer:controls.steering??0,speedKmh:Math.abs(input.longitudinalVelocity)*3.6,signalAgeMs:controls.ageMs}
  const requestRising=controls.ready&&!this.previousReadyRequest
  this.previousReadyRequest=controls.ready
  // Preset driving chapters begin with a previously authorized READY. Manual START chapters
  // must pass through the same precharge/contactor state machine that limits propulsion.
  if(requestRising&&!controls.requireStartSequence&&this.systemState.hv==='OFF')this.systemState={...this.systemState,hv:'READY'}
  const startRequestEdge=controls.systemInput?.startEdge??(requestRising&&controls.ready)
  this.lastStartRequestEdge=startRequestEdge
  if(controls.domainDesigns){const bms=evaluateModel(controls.domainDesigns.bms,{soc:systemInput.packSoc,temp:systemInput.packTempC,isolation:systemInput.isolationOk}),start=evaluateModel(controls.domainDesigns.start,{edge:startRequestEdge,gear:systemInput.gear,brake:systemInput.brakePct,plugged:systemInput.plugged,packSafe:bms.output.safe===true});this.lastStartPermit=start.errors.length===0&&start.output.startPermit===true}
  else this.lastStartPermit=startRequestEdge
  systemInput.startEdge=this.lastStartPermit
  systemInput.stopEdge=controls.systemInput?.stopEdge??!controls.ready
  this.systemFrame=stepVehicleSystems(this.systemState,systemInput,PHYSICS_TIMESTEP)
  this.systemState=this.systemFrame.state
  const systemCap=Math.min(controls.capNm,this.systemFrame.availableTorqueNm),systemAllowed=allowed&&this.systemFrame.packAvailable
  this.input=controls.injected?{...controls.injected,ready:systemAllowed&&controls.injected.ready,capNm:Math.min(controls.injected.capNm,systemCap)}:{pedalA:pedal,pedalB:pedal+controls.channelOffset,ageMs:controls.ageMs,brakePct:controls.brake*100,ready:systemAllowed,gear:baseline.gearState,capNm:systemCap}
  // One owner: the existing 60Hz physics clock schedules a 20ms sample/hold controller.
  this.accumulator+=PHYSICS_TIMESTEP
  while(this.accumulator+1e-10>=.02){this.frame=this.model.step(record.graph,this.input,.02);this.controlTicks++;this.accumulator-=.02}
  // Hardware/READY loss is an explicit interlock, never a post-physics cosmetic gate.
  if(!systemAllowed){this.model.reset();this.frame={...this.frame,values:{...this.frame.values,'permission.allow':false,'dynamics.torque':0,'command.torque':0},torqueNm:0,permitted:false}}
  if(controls.domainDesigns){const result=executeVehicle(controls.domainDesigns,{ready:systemAllowed,pack:record.assembly.battery==='FIXED',pedal,brake:controls.brake*100,gear:baseline.gearState,steer:0,cap:systemCap,soc:systemInput.packSoc,packTempC:systemInput.packTempC,isolationOk:systemInput.isolationOk,startEdge:startRequestEdge,plugged:systemInput.plugged}),command=result.integrated.output.torque;const value=systemAllowed&&typeof command==='number'&&Number.isFinite(command)?Math.max(0,Math.min(systemCap,command)):0;this.frame={values:{'command.torque':value,'request.torque':Number(result.request.output.request)||0,'permission.allow':result.drive.output.allow===true},torqueNm:value,targetNm:Number(result.request.output.request)||0,permitted:result.drive.output.allow===true,issues:[]}}
  const torque=this.frame.torqueNm,direction=torque>0?'FORWARD':'NONE',validity=this.frame.issues.length?'INVALID':'VALID'
  if(systemAllowed&&torque>0&&controls.brake===0)this.distance+=Math.abs(input.longitudinalVelocity)*PHYSICS_TIMESTEP
  if(controls.brake>=.05&&Math.abs(input.longitudinalVelocity)>.2)this.brakeUsed=true
  return{...baseline,propulsionState:systemAllowed?'PROP_ENABLED':'PROP_DISABLED',propulsionRequest:{magnitude:systemAllowed?input.acceleratorPedalPosition:0,direction:systemAllowed?'FORWARD':'NONE',validity},driveTorqueRequest:{magnitudeNm:Number(this.frame.values['request.torque']??0)||0,direction,validity},eDriveCommand:{magnitudeNm:torque,direction,validity}}
 }
}
export function createWorkshopRuntime(module:WebAssembly.Module,read:()=>{record:WorkshopRecord;controls:WorkshopControls},publish:(t:RaceTelemetry)=>void){
 const config={...calibration,torqueToForce:{...calibration.torqueToForce,value:MECHANICS.ratio*MECHANICS.efficiency/MECHANICS.wheelRadiusM}}
 const controller=new WorkshopController(new WasmVehicleSw(module,config),read)
 const runtime=new SimulationRuntime(config,publish,undefined,controller)
 const samples:VehicleRunSample[]=[];let lastTick=-1
 runtime.configurePostTickObserver(sample=>{
  if(sample.tickId<=lastTick)samples.length=0
  lastTick=sample.tickId
  if(!read().controls.domainDesigns||!controller.systemFrame)return
  const system=controller.systemFrame,actuation=controller.actuation
  const execution=controller.lastDomainExecution
  const graph:VehicleRunSample['graph']=execution?{bms:execution.bms.events,start:execution.start.events,power:execution.power.events,request:execution.request.events,drive:execution.drive.events,brake:execution.brake.events,steer:execution.steer.events,integration:execution.integrated.events}:{}
  samples.push({...sample,system:{packAvailable:system.packAvailable,bmsSafe:execution?.bms.output.safe===true,startRequestEdge:controller.lastStartRequestEdge,startPermit:controller.lastStartPermit,hv:system.state.hv,prechargeContactor:system.contactors.precharge,mainContactor:system.contactors.main,powerEnable:execution?.power.output.enable===true,availableTorqueNm:system.availableTorqueNm,regenNm:actuation?.regenNm??system.brake.regenNm,frictionN:actuation?.frictionN??system.brake.frictionN,assistNm:actuation?.assistNm??system.steering.assistNm,diagnostics:[...system.diagnostics]},graph,firstDifference:controller.lastDifference})
  if(samples.length>3600)samples.shift()
 })
 controller.setEnvironmentReader(()=>{const speed=runtime.readVehicleState().longitudinalVelocity,wheels=runtime.readWheelDynamicsState();const wheelSlip:[number,number,number,number]=[0,1,2,3].map(index=>{const wheel=wheels.find(item=>item.index===index);return wheel?.inContact&&Math.abs(speed)>3?Math.min(1,Math.abs(Math.abs(wheel.wheelLinearSpeedMps)-Math.abs(speed))/Math.max(3,Math.abs(speed))):0}) as [number,number,number,number];return{wheelSlip}})
 runtime.configureReadyGate(()=>read().controls.ready&&hardwareReady(read().record))
  runtime.configureTrainingChassis(input=>{const {record,controls}=read();if(!controls.domainDesigns)return undefined;const modelInput={ready:controller.input.ready,pack:controller.systemFrame?.packAvailable??false,pedal:controller.input.pedalA,brake:input.brake*100,gear:controller.input.gear,steer:input.steering,cap:controller.input.capNm,soc:controls.systemInput?.packSoc??65,packTempC:controls.systemInput?.packTempC??25,isolationOk:controls.systemInput?.isolationOk??true,startEdge:controller.lastStartRequestEdge,plugged:controls.systemInput?.plugged??false};const execution=executeVehicle(controls.domainDesigns,modelInput);controller.lastDomainExecution=execution;controller.lastDifference=firstBoundaryDifference(modelInput,execution);const result=execution.integrated.output,system=controller.systemFrame;if(!system)return undefined;const actuation=composeVehicleActuation(system,{brakeForce:Number(result.brakeForce),wheelAngle:Number(result.wheelAngle)},input.brake*100,record);controller.actuation=actuation;return{brakeForceN:actuation.brakeForceN,wheelAngleRad:actuation.frontWheelAngleRad}})
 return{runtime,controller,readRunTrace:()=>samples.slice()}
}
