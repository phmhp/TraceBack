import type {AssemblyPartId} from '../workshop/assembly'
import type {DomainId} from './domainTraining'

export type AtlasTrace={domain:DomainId;step:number;part:AssemblyPartId;activeParts:AssemblyPartId[];kind:'input'|'logic'|'signal'|'actuator'|'mechanical';label:string;value:string;torqueNm:number;brakeForceN:number;frontAngleRad:number;source?:'run';driver?:{accelerator:number;brake:number;steering:number};links?:{from:AssemblyPartId;to:AssemblyPartId}[]}

const paths:Record<DomainId,{kind:AtlasTrace['kind'];parts:AssemblyPartId[]}[]>={
 power:[{kind:'input',parts:['battery']},{kind:'logic',parts:['battery']},{kind:'input',parts:['brakePedal','vcu']},{kind:'logic',parts:['vcu']},{kind:'signal',parts:['battery','inverter']},{kind:'logic',parts:['vcu','inverter']},{kind:'actuator',parts:['inverter','motor']}],
 drive:[{kind:'input',parts:['pedal']},{kind:'logic',parts:['pedal','vcu']},{kind:'logic',parts:['vcu']},{kind:'actuator',parts:['inverter','motor']},{kind:'mechanical',parts:['motor','gearbox','axle','rearLeft','rearRight']}],
 brake:[{kind:'input',parts:['brakePedal']},{kind:'logic',parts:['brakePedal','vcu']},{kind:'actuator',parts:['brakes']},{kind:'mechanical',parts:['brakes','rearLeft','rearRight']}],
 steer:[{kind:'input',parts:['steeringWheel']},{kind:'logic',parts:['steeringWheel','vcu']},{kind:'actuator',parts:['steeringRack']},{kind:'mechanical',parts:['steeringRack','frontLeft','frontRight']}],
}

export function makeAtlasTrace(domain:DomainId,step:number,part:AssemblyPartId,label:string,value:string,outputs:{torqueNm:number;brakeForceN:number;frontAngleRad:number}):AtlasTrace{
 const path=paths[domain],index=Math.max(0,Math.min(path.length-1,Math.trunc(step))),node=path[index]
 return{domain,step:index,part,activeParts:node.parts,kind:node.kind,label,value,torqueNm:Number.isFinite(outputs.torqueNm)?Math.max(0,outputs.torqueNm):0,brakeForceN:Number.isFinite(outputs.brakeForceN)?Math.max(0,outputs.brakeForceN):0,frontAngleRad:Number.isFinite(outputs.frontAngleRad)?Math.max(-.48,Math.min(.48,outputs.frontAngleRad)):0}
}
