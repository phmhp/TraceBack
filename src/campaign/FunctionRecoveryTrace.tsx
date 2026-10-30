import {useEffect,useMemo,useState} from 'react'
import type {Adventure} from './adventure'
import {executeVehicle,ROUNDS} from './domainTraining'
import type {DomainId} from './domainTraining'
import type {AssemblyPartId} from '../workshop/assembly'
import {MODEL_ALLOCATION} from './vehicleArchitecture'
import {makeAtlasTrace} from './atlasTrace'
import type {AtlasTrace} from './atlasTrace'
import {VehicleFlowIllustration} from './VehicleFlowIllustration'

type Step={stage:string;signal:string;meaning:string;part:AssemblyPartId}
function stepsFor(domain:DomainId,a:Adventure):Step[]{
 const sample=executeVehicle(a.designs,{ready:true,pack:true,pedal:domain==='drive'?50:0,brake:domain==='power'?100:domain==='brake'?60:0,gear:domain==='power'?'P':'D',steer:domain==='steer'?.5:0,cap:180,startEdge:domain==='power'})
 switch(domain){
  case 'power':return[
   {stage:'BMS 센서·SW',signal:`PackSafe = ${String(sample.bms.output.safe??'미연결')}`,meaning:'SOC·온도·절연을 내가 구성한 BMS 로직이 비교합니다.',part:'battery'},
   {stage:'운전자 START',signal:'START 상승 · P · 브레이크',meaning:'버튼의 새 입력과 현재 기어·브레이크·충전 플러그 상태를 읽습니다.',part:'vcu'},
   {stage:'내 시작 판단',signal:`StartPermit = ${String(sample.start.output.startPermit??'미연결')}`,meaning:`${MODEL_ALLOCATION.start.swc}가 BMS PackSafe와 운전자 시작 조건을 결합합니다.`,part:'vcu'},
   {stage:'고전압 준비',signal:'프리차지 → 접촉기 → READY',meaning:'허용된 요청 뒤 DC 링크 전압과 시간을 확인해 주 접촉기를 닫습니다.',part:'battery'},
   {stage:'내 SW 계산',signal:`PowerEnable = ${String(sample.power.output.enable??'미연결')}`,meaning:`${MODEL_ALLOCATION.power.swc} / ${MODEL_ALLOCATION.power.runnable}이 두 조건을 결합합니다.`,part:'vcu'},
   {stage:'전력전자 경계',signal:'VCU → 인버터',meaning:'허용 신호가 전달됩니다. 실제 모터 토크는 구동 요청과 인터록을 더 거쳐야 합니다.',part:'inverter'},
  ]
  case 'drive':return[
   {stage:'운전자 입력',signal:'가속페달 50%',meaning:'페달 센서가 가속 의도를 전기 신호로 읽습니다.',part:'pedal'},
   {stage:'내 SW 계산',signal:`DriverTorqueReq = ${String(sample.request.output.request??'미연결')} Nm`,meaning:`${MODEL_ALLOCATION.request.swc}가 모터 축 토크 요청과 가용 상한을 계산합니다.`,part:'vcu'},
   {stage:'허용 조건',signal:`DriveAllow = ${String(sample.drive.output.allow??'미연결')}`,meaning:'READY·D·브레이크 미개입을 확인합니다.',part:'vcu'},
   {stage:'전기 액추에이터',signal:`MotorTorqueCmd = ${String(sample.integrated.output.torque??'미연결')} Nm`,meaning:'VCU 명령 → 인버터 전류 제어 → 모터 회전으로 이어집니다.',part:'motor'},
   {stage:'기계 전달',signal:'감속기 → 축 → 뒷바퀴',meaning:'전기모터의 회전이 감속·차동 경로를 거쳐 좌우 뒷바퀴로 전달됩니다.',part:'axle'},
  ]
  case 'brake':return[
   {stage:'운전자 입력',signal:'브레이크 60%',meaning:'브레이크 페달 센서가 운전자 감속 요구를 읽습니다.',part:'brakePedal'},
   {stage:'내 SW 계산',signal:`BrakeForceReq = ${String(sample.brake.output.force??'미연결')} N`,meaning:`${MODEL_ALLOCATION.brake.swc}가 페달 입력을 제동력 요청으로 환산합니다.`,part:'vcu'},
   {stage:'액추에이터 경계',signal:'제동 제어 → 캘리퍼',meaning:'제동 요구가 마찰 제동 장치로 전달됩니다.',part:'brakes'},
   {stage:'물리 반응',signal:'패드·디스크 → 감속',meaning:'패드와 디스크의 마찰이 바퀴 회전을 줄입니다.',part:'brakes'},
  ]
  case 'steer':return[
   {stage:'운전자 입력',signal:'운전대 +0.5',meaning:'운전대와 앞바퀴는 기계적으로 연결되어 있습니다.',part:'steeringWheel'},
   {stage:'운동 표현',signal:`앞바퀴 각도 ≈ ${String(sample.steer.output.angle??'미연결')} rad`,meaning:'현재 블록은 운전자 조향을 전륜 각도로 나타냅니다. EPS 보조 토크 계산과는 구분합니다.',part:'vcu'},
   {stage:'EPS 보조',signal:'조향 토크 센서 → EPS 모터',meaning:'실제 EPS에서는 운전자 토크에 따른 보조 토크·전류를 별도로 제어합니다.',part:'steeringRack'},
   {stage:'기계·노면',signal:'랙·타이로드 → 앞바퀴',meaning:'앞바퀴 좌우 한 쌍의 방향이 바뀌며 차량이 회전합니다.',part:'frontLeft'},
  ]
 }
}
export function FunctionRecoveryTrace({a,reduced,onPart,onTrace,onCue}:{a:Adventure;reduced:boolean;onPart:(id:AssemblyPartId)=>void;onTrace?:(trace:AtlasTrace)=>void;onCue?:(text:string)=>void}){
 const domain=ROUNDS[a.round].id,steps=useMemo(()=>stepsFor(domain,a),[domain,a.designs])
 const [step,setStep]=useState(0),[playing,setPlaying]=useState(!reduced),[visible,setVisible]=useState(reduced)
 useEffect(()=>{setStep(0);setPlaying(!reduced);setVisible(reduced);if(reduced)return;const timer=window.setTimeout(()=>setVisible(true),900);return()=>window.clearTimeout(timer)},[domain,reduced])
 useEffect(()=>{if(!visible||!playing)return;const timer=window.setInterval(()=>setStep(i=>(i+1)%steps.length),3000);return()=>window.clearInterval(timer)},[visible,playing,steps.length])
 useEffect(()=>{if(visible)onCue?.(`${steps[step].stage} · ${steps[step].meaning}`)},[visible,step,steps,onCue])
 useEffect(()=>{if(!visible)return;onPart(steps[step].part);const activeParts=[...new Set([steps[Math.max(0,step-1)].part,steps[step].part])];onTrace?.(makeAtlasTrace(domain,step,steps[step].part,steps[step].signal,steps[step].meaning,{torqueNm:domain==='drive'&&step>=3?Number(executeVehicle(a.designs,{ready:true,pack:true,pedal:50,brake:0,gear:'D',steer:0,cap:180}).integrated.output.torque)||0:0,brakeForceN:domain==='brake'&&step>=2?Number(executeVehicle(a.designs,{ready:true,pack:true,pedal:0,brake:60,gear:'D',steer:0,cap:180}).brake.output.force)||0:0,frontAngleRad:domain==='steer'&&step>=2?Number(executeVehicle(a.designs,{ready:true,pack:true,pedal:0,brake:0,gear:'D',steer:.5,cap:180}).steer.output.angle)||0:0},activeParts))},[visible,step,steps,onPart,onTrace,domain,a.designs])
 if(!visible)return <p className="d16-recovery-wait" role="status">복구한 기능의 신호 경로를 여는 중…</p>
 return <section className="d16-recovery-trace" aria-label="복구 기능 실행 추적">
  <header><div><small>복구 완료 · 실행 추적</small><h2>{ROUNDS[a.round].name}은 어떻게 움직일까?</h2></div><button onClick={()=>setPlaying(v=>!v)}>{playing?'일시정지':'▶ 재생'}</button></header>
  <div className="d16-recovery-rail">{steps.map((item,i)=><button key={i} aria-pressed={step===i} onClick={()=>{setStep(i);setPlaying(false)}}><span>{i+1}</span><small>{item.stage}</small></button>)}</div>
  <VehicleFlowIllustration domain={domain} step={Math.min(step,4)} focusId={domain==='power'?step===0?'bms':step<=3?'start':'power':domain==='drive'?step<=1?'request':'drive':domain==='brake'?'brake':'steer'} compact reduced={reduced}/>
  <div className="d16-recovery-detail" role="status"><b>{steps[step].signal}</b><p>{steps[step].meaning}</p></div>
  <p className="d16-recovery-path">System / 흰둥's EV Car / {ROUNDS[a.round].name} / Function / ECU · {a.round===0?'BMS → VCU':a.round===1?'VCU':a.round===2?'제동 제어기':'EPS 제어기'}</p>
 </section>
}
