import type {DomainId} from './domainTraining'
import {MODEL_SPECS} from './domainTraining'
import './vehicleFlowIllustration.css'

type Props={domain:DomainId|'thermal'|'chassis'|'network';step?:number;choice?:string;focusId?:string;compact?:boolean;reduced?:boolean}
const nodeGroup:Record<string,DomainId|'thermal'|'chassis'|'network'>={bms:'power',start:'power',power:'power',hv:'power',ready:'power',packLimit:'power',charge:'power',request:'drive',drive:'drive',inverter:'drive',driveline:'drive',brake:'brake',blend:'brake',steer:'steer',eps:'steer',integration:'network',network:'network',thermal:'thermal',chassis:'chassis'}
export function domainForFunction(id:string){return nodeGroup[id]??'drive'}

/** One diagram is shared by the technology choices, function map and final atlas. */
export function VehicleFlowIllustration({domain,step=4,choice,focusId,compact=false,reduced=false}:Props){
 const model=focusId&&focusId in MODEL_SPECS?MODEL_SPECS[focusId as keyof typeof MODEL_SPECS]:null
 const frontDrive=choice==='fwd'||choice==='awd',rearDrive=choice!=='fwd',dual=choice==='awd',steerRear=choice==='rws',wireSteer=choice==='sbw',regen=choice==='blend',zone=choice==='zonal',integrated=choice==='domain'
 const energized=(at:number)=>step>=at
 const active=(group:Props['domain'])=>domain===group
 const wheel=(x:number,y:number,front:boolean)=>{const drive=front?frontDrive:rearDrive,steering=front||steerRear,lit=active('chassis')&&energized(3)||active('drive')&&drive&&energized(4)||active('steer')&&steering&&energized(3)||active('brake')&&energized(3);return <g key={`${x}-${y}`} className={'vfi-wheel '+(lit?'lit ':'')+(active('drive')&&drive&&energized(4)&&!reduced?'rolling':'')} transform={`translate(${x} ${y}) ${active('steer')&&steering&&energized(3)?'rotate(-14)':''}`}><rect x="-12" y="-24" width="24" height="48" rx="9"/><path d="M-7 -17H7M-7 17H7"/><circle r="5"/><path className="vfi-spokes" d="M-4 0H4M0-4V4"/></g>}
 return <figure className={'vfi '+(compact?'compact':'')} aria-label={`${domain} 장치와 신호 경로 그림`}>
  <svg viewBox="0 0 560 330" role="img" aria-label="차량을 위에서 본 단면: 입력 장치, ECU, 배터리, 모터, 조향과 제동 장치가 단계별로 켜집니다">
   <defs><linearGradient id="vfi-shell" x1="0" y1="0" x2="1" y2="1"><stop stopColor="#d3f4ef" stopOpacity=".78"/><stop offset="1" stopColor="#8cc4c8" stopOpacity=".35"/></linearGradient><linearGradient id="vfi-energy" x1="0" x2="1"><stop stopColor="#79d5bd"/><stop offset="1" stopColor="#efbd74"/></linearGradient></defs>
   <path className="vfi-shell" d="M160 22Q280 -12 400 22L423 80Q444 164 423 247L400 307Q280 337 160 307L137 247Q116 164 137 80Z"/>
   <path className="vfi-glass" d="M175 60Q280 37 385 60L397 99H163Z M163 236H397L385 273Q280 294 175 273Z"/>
   <path className={'vfi-wire '+(active('power')&&energized(2)?'lit':'')} d="M280 162V103H280V72"/>
   <path className={'vfi-wire '+(active('drive')&&energized(2)?'lit':'')} d="M280 180V240H280V266"/>
   <path className={'vfi-wire '+(active('brake')&&energized(2)?'lit':'')} d="M192 111H155V254H192M155 111H368V254H368"/>
   <path className={'vfi-wire '+(active('steer')&&energized(2)?'lit':'')} d="M369 115V73H280"/>
   {active('network')&&<path className={'vfi-wire '+(energized(2)?'lit':'')} d="M196 125H360V225H196Z"/>}
   {wheel(126,84,true)}{wheel(434,84,true)}{wheel(126,247,false)}{wheel(434,247,false)}
   <path className={'vfi-axle '+(active('drive')&&frontDrive&&energized(3)||active('steer')&&energized(3)?'lit':'')} d="M148 84H412"/>
   <path className={'vfi-axle '+(active('drive')&&rearDrive&&energized(3)?'lit':'')} d="M148 247H412"/>
   <g className={'vfi-part battery '+(active('power')&&energized(3)||active('drive')&&energized(3)?'lit':'')}><rect x="211" y="127" width="138" height="78" rx="10"/><path d="M239 135V197M266 135V197M294 135V197M321 135V197"/><text x="280" y="174">HV 배터리</text></g>
   <g className={'vfi-part ecu '+(active('network')||active('power')&&step===1||active('drive')&&step===1||active('brake')&&step===1||active('steer')&&step===1?'lit':'')}><rect x="172" y="108" width="54" height="32" rx="5"/><text x="199" y="128">{zone?'ZONE':integrated?'DCU':'VCU'}</text></g>
   {choice==='distributed'&&<g className="vfi-part ecu"><rect x="172" y="220" width="48" height="27" rx="5"/><text x="196" y="238">BMS</text><rect x="345" y="220" width="48" height="27" rx="5"/><text x="369" y="238">EPS</text></g>}
   {zone&&<g className="vfi-part ecu"><rect x="335" y="108" width="58" height="32" rx="5"/><text x="364" y="128">ZONE</text><rect x="241" y="50" width="78" height="26" rx="5"/><text x="280" y="68">CENTRAL</text></g>}
   {integrated&&<path className="vfi-wire lit" d="M225 125H335M199 140V220M364 140V220"/>}
   {(frontDrive||active('steer'))&&<g className={'vfi-part motor '+(active('drive')&&frontDrive&&energized(3)||active('steer')&&energized(3)?'lit':'')}><circle cx="280" cy="84" r="18"/><text x="280" y="89">{active('steer')?wireSteer?'SBW':'EPS':'M'}</text></g>}
   {rearDrive&&<g className={'vfi-part motor '+(active('drive')&&energized(3)?'lit':'')}><circle cx="280" cy="247" r="20"/><text x="280" y="252">M</text></g>}
   {steerRear&&<g className={'vfi-part motor '+(active('steer')&&energized(3)?'lit':'')}><circle cx="326" cy="247" r="16"/><text x="326" y="252">RWS</text></g>}
   {active('steer')&&<path className={wireSteer?'vfi-wire lit':'vfi-steer-column'} d="M365 150L365 102L300 84"/>}
   <g className={'vfi-part input '+(step===0?'lit':'')}><rect x="350" y="112" width="30" height="42" rx="8"/><text x="365" y="138">{focusId==='bms'?'S':focusId==='start'?'▶':active('brake')?'B':active('steer')?'↶':'P'}</text></g>
   {active('brake')&&[126,434].flatMap(x=>[84,247].map(y=><path key={`${x}-${y}`} className={'vfi-caliper '+(energized(3)?'lit':'')} d={`M${x-19} ${y-10}q-8 10 0 20M${x+19} ${y-10}q8 10 0 20`}/>))}
   {regen&&active('brake')&&<path className={'vfi-wire '+(energized(3)?'lit':'')} d="M280 245V212"/>}
   {active('thermal')&&<path className={'vfi-thermal '+(energized(3)?'lit':'')} d="M205 153C170 155 170 205 207 210M350 155C390 150 395 205 350 211"/>}
   {active('chassis')&&<g className={'vfi-suspension '+(energized(3)?'lit':'')}><path d="M149 82l12-8 8 16 8-16 8 16 8-12M411 82l-12-8-8 16-8-16-8 16-8-12M149 247l12-8 8 16 8-16 8 16 8-12M411 247l-12-8-8 16-8-16-8 16-8-12"/></g>}
   <g className="vfi-callouts"><text x="24" y="52">앞차축 · {frontDrive?'구동':'조향'}</text><path d="M112 52L146 80"/><text x="22" y="292">뒷차축 · {rearDrive?'구동':'비구동'}</text><path d="M112 286L146 251"/><text x="422" y="30">{dual?'앞·뒤 듀얼 모터':wireSteer?'전자식 조향':'차량 단면'}</text><path d="M423 39L394 56"/></g>
   {active('drive')&&energized(4)&&<path className={'vfi-motion '+(!reduced?'moving':'')} d="M460 118v90m-10-12 10 12 10-12"/>}
   {active('steer')&&energized(4)&&<path className="vfi-motion" d="M472 117c23 0 30 32 11 39l7-13m-7 13-14-4"/>}
   {active('power')&&energized(4)&&<path className="vfi-motion" d="M276 93l-10 20h12l-5 20 22-29h-13l8-11"/>}
   {active('brake')&&energized(4)&&<text className="vfi-motion-label" x="453" y="177">감속</text>}
  </svg>
  {model&&<div className="vfi-signal" aria-label={`${model.function} 신호 경로`}><span className={step===0?'lit':''}><small>입력</small>{model.inputs.map(item=>item.name).join(' · ')}</span><i>→</i><span className={step===1?'lit':''}><small>SW 계산</small>{model.steps.slice(0,2).join(' → ')}</span><i>→</i><span className={step>=2?'lit':''}><small>출력</small>{model.outputs.map(item=>item.name).join(' · ')}</span></div>}
  <figcaption>{choice==='awd'?'앞·뒤 모터와 네 바퀴가 함께 구동':choice==='fwd'?'앞 모터가 앞바퀴 한 쌍을 구동':choice==='rwd'?'뒤 모터가 뒷바퀴 한 쌍을 구동':choice==='rws'?'앞·뒷바퀴 모두 조향':choice==='sbw'?'조향 센서와 전동 액추에이터 사이에 기계 축 없음':choice==='blend'?'회생 토크와 마찰 제동력을 함께 배분':domain==='power'?'센서 → BMS·VCU → 접촉기·인버터':domain==='drive'?'페달 → VCU 계산 → 인버터·모터 → 구동륜':domain==='brake'?'페달 → 제동 제어 → 캘리퍼 → 바퀴 감속':domain==='steer'?'운전대 → EPS·기계 연결 → 앞바퀴 조향':'입력 → 제어기 → 액추에이터 → 차량 반응'}</figcaption>
 </figure>
}
