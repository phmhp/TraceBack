import type {LogicId,Value} from './domainTraining'
import type {executeVehicle} from './domainTraining'

export type VehicleCaseInput={ready:boolean;pack:boolean;pedal:number;brake:number;gear:string;steer:number;cap:number;soc?:number;packTempC?:number;isolationOk?:boolean;startEdge?:boolean;plugged?:boolean}
export type BoundaryDifference={model:LogicId;signal:string;expected:Value;actual:Value;error?:string}
const clamp=(value:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,Number.isFinite(value)?value:lo))
const equal=(a:Value,b:Value)=>typeof a==='number'&&typeof b==='number'?Number.isFinite(a)&&Math.abs(a-b)<1e-6:a===b

/** Compare functional boundaries, not block IDs or graph geometry. Equivalent graphs pass. */
export function firstBoundaryDifference(input:VehicleCaseInput,actual:ReturnType<typeof executeVehicle>):BoundaryDifference|null{
 const packSafe=(input.soc??65)>5&&(input.packTempC??25)<60&&(input.isolationOk??true)
 const startPermit=(input.startEdge??false)&&input.gear==='P'&&input.brake>=5&&!(input.plugged??false)&&packSafe
 const enable=input.ready&&input.pack&&packSafe
 const request=Math.min(clamp(input.pedal,0,100)*1.8,Math.max(0,input.cap))
 const allow=enable&&input.gear==='D'&&input.brake<5
 const force=clamp(input.brake,0,100)*42
 const angle=clamp(input.steer,-1,1)*.48
 const expected:{model:LogicId;signal:string;value:Value}[]=[
  {model:'bms',signal:'safe',value:packSafe},
  {model:'start',signal:'startPermit',value:startPermit},
  {model:'power',signal:'enable',value:enable},
  {model:'request',signal:'request',value:request},
  {model:'drive',signal:'allow',value:allow},
  {model:'brake',signal:'force',value:force},
  {model:'steer',signal:'angle',value:angle},
  {model:'integration',signal:'torque',value:allow?request:0},
  {model:'integration',signal:'brakeForce',value:force},
  {model:'integration',signal:'wheelAngle',value:angle},
 ]
 const results={bms:actual.bms,start:actual.start,power:actual.power,request:actual.request,drive:actual.drive,brake:actual.brake,steer:actual.steer,integration:actual.integrated}
 for(const item of expected){const result=results[item.model],value=result.output[item.signal];if(result.errors.length||!equal(value,item.value))return{model:item.model,signal:item.signal,expected:item.value,actual:value,error:result.errors[0]}}
 return null
}
