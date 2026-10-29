/** The fixed single-motor RWD / front-steer BEV used by the campaign. */
export type HvState='OFF'|'PRECHARGE'|'READY'|'FAULT'
export type SystemInput={startEdge:boolean;stopEdge:boolean;gear:'P'|'R'|'N'|'D';brakePct:number;pedalPct:number;steer:number;speedKmh:number;packSoc:number;packTempC:number;motorTempC:number;inverterTempC:number;packVoltage:number;dcLinkVoltage:number;isolationOk:boolean;plugged:boolean;chargerLimitA:number;wheelSlip:[number,number,number,number];yawError:number;signalAgeMs:number}
export type SystemState={hv:HvState;prechargeSec:number;motorTorqueNm:number;soc:number;fault?:string}
export const NEW_SYSTEM_STATE:SystemState={hv:'OFF',prechargeSec:0,motorTorqueNm:0,soc:65}
export const NORMAL_SYSTEM_INPUT:SystemInput={startEdge:false,stopEdge:false,gear:'P',brakePct:0,pedalPct:0,steer:0,speedKmh:0,packSoc:65,packTempC:25,motorTempC:35,inverterTempC:35,packVoltage:380,dcLinkVoltage:360,isolationOk:true,plugged:false,chargerLimitA:32,wheelSlip:[0,0,0,0],yawError:0,signalAgeMs:20}
const clamp=(n:number,lo:number,hi:number)=>Math.min(hi,Math.max(lo,Number.isFinite(n)?n:lo))
export type SystemOutput={state:SystemState;contactors:{precharge:boolean;main:boolean};packAvailable:boolean;availableTorqueNm:number;dcDc:{active:boolean;voltageV:number};charging:{active:boolean;currentA:number;soc:number};thermal:{pump:boolean;fan:boolean;derate:number};drive:{requestNm:number;allowed:boolean;commandNm:number;actualNm:number;rearWheelNm:[number,number]};brake:{regenNm:number;frictionN:number;frontN:[number,number];rearN:[number,number];absActive:boolean;escActive:boolean};steering:{frontAngleRad:number;assistNm:number};diagnostics:string[]}
export function stepVehicleSystems(previous:SystemState,input:SystemInput,dt=.02):SystemOutput{
 if(!Number.isFinite(dt)||dt<=0||dt>.1)throw Error('실행 간격은 0초 초과, 0.1초 이하여야 합니다.')
 const diagnostic:string[]=[],soc=clamp(input.packSoc,0,100),brake=clamp(input.brakePct,0,100),pedal=clamp(input.pedalPct,0,100),speed=Math.abs(input.speedKmh)
 if(!input.isolationOk)diagnostic.push('절연 이상')
 if(input.signalAgeMs>100)diagnostic.push('제어 신호 지연')
 if(input.packTempC>=60)diagnostic.push('배터리 과열')
 if(soc<=3)diagnostic.push('배터리 잔량 부족')
 const critical=diagnostic.length>0
 let hv:HvState=critical?'FAULT':previous.hv,prechargeSec=previous.prechargeSec,fault=critical?diagnostic[0]:previous.fault
 if(!critical){
  if(input.plugged&&hv!=='OFF'){hv='OFF';prechargeSec=0}
  else if(hv==='FAULT'&&input.stopEdge&&speed<.5){hv='OFF';prechargeSec=0;fault=undefined}
  else if(hv==='OFF'&&input.startEdge&&input.gear==='P'&&brake>=5&&soc>5&&!input.plugged){hv='PRECHARGE';prechargeSec=0}
  else if(hv==='PRECHARGE'){
   prechargeSec+=dt
   if(prechargeSec>=.3&&input.dcLinkVoltage>=input.packVoltage*.9)hv='READY'
   else if(prechargeSec>2){hv='FAULT';fault='프리차지 시간 초과';diagnostic.push(fault)}
  }else if(hv==='READY'&&input.stopEdge&&speed<.5){hv='OFF';prechargeSec=0}
 }
 const packAvailable=hv==='READY'&&!critical
 const highTemp=Math.max(input.packTempC,input.motorTempC,input.inverterTempC)
 const thermalDerate=clamp((85-highTemp)/20,.15,1)*clamp((soc-3)/12,.15,1)
 const availableTorqueNm=packAvailable?180*thermalDerate:0
 const pump=highTemp>38||input.plugged,fan=highTemp>55
 const chargeActive=input.plugged&&input.gear==='P'&&hv==='OFF'&&diagnostic.length===0&&soc<95&&input.packTempC>0&&input.packTempC<45
 const chargeCurrentA=chargeActive?clamp(input.chargerLimitA,0,32):0
 const nextSoc=clamp(soc+chargeCurrentA*input.packVoltage*dt/3600/50000*100,0,100)
 const dcDcActive=packAvailable||chargeActive
 const requestNm=Math.min(availableTorqueNm,pedal*1.8)
 const allowed=packAvailable&&input.gear==='D'&&brake<5&&input.signalAgeMs<=100
 const commandNm=allowed?requestNm:0
 const actualNm=previous.motorTorqueNm+(commandNm-previous.motorTorqueNm)*clamp(dt/.12,0,1)
 const motorTorqueNm=allowed?actualNm:0
 const slip=input.wheelSlip.map(value=>clamp(Math.abs(value),0,1))
 const absActive=brake>0&&slip.some(value=>value>.2)
 const regenNm=packAvailable&&input.gear==='D'&&speed>5&&!absActive?Math.min(brake*1.2,60,availableTorqueNm*.45):0
 const requestedFrictionN=Math.max(0,brake*42-regenNm*7*.9/.425)
 const frontBase=requestedFrictionN*.6/2,rearBase=requestedFrictionN*.4/2
 const frontN:[number,number]=[frontBase*(slip[0]>.2?.35:1),frontBase*(slip[1]>.2?.35:1)]
 const rearN:[number,number]=[rearBase*(slip[2]>.2?.35:1),rearBase*(slip[3]>.2?.35:1)]
 const escActive=speed>20&&Math.abs(input.yawError)>.15
 if(escActive){const side=input.yawError>0?0:1;rearN[side]+=Math.min(350,Math.abs(input.yawError)*900)}
 const steer=clamp(input.steer,-1,1),frontAngleRad=steer*.48,assistNm=Math.abs(steer)*Math.max(1,7-speed*.075)
 const state={hv,prechargeSec,motorTorqueNm,soc:nextSoc,fault}
 return{state,contactors:{precharge:hv==='PRECHARGE',main:hv==='READY'},packAvailable,availableTorqueNm,dcDc:{active:dcDcActive,voltageV:dcDcActive?13.8:Math.max(10.5,12.6-(1-soc/100)*1.2)},charging:{active:chargeActive,currentA:chargeCurrentA,soc:nextSoc},thermal:{pump,fan,derate:thermalDerate},drive:{requestNm,allowed,commandNm,actualNm:motorTorqueNm,rearWheelNm:[motorTorqueNm*7*.9/2,motorTorqueNm*7*.9/2]},brake:{regenNm,frictionN:frontN[0]+frontN[1]+rearN[0]+rearN[1],frontN,rearN,absActive,escActive},steering:{frontAngleRad,assistNm},diagnostics:diagnostic.length?diagnostic:hv==='FAULT'&&fault?[fault]:[]}
}
