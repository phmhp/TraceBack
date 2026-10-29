import {useEffect,useId,useState} from 'react'
import {NEW_SYSTEM_STATE,NORMAL_SYSTEM_INPUT,stepVehicleSystems} from './vehicleSystems'

const stages=[
 {name:'배터리 상태',detail:'BMS가 배터리 상태와 사용 가능 전력을 확인합니다.',part:'battery'},
 {name:'고전압 연결',detail:'프리차지 뒤 접촉기가 닫히면 인버터까지 전력 경로가 이어집니다.',part:'contactors'},
 {name:'전류와 토크',detail:'인버터가 모터에 필요한 전류를 만들고 축 토크를 냅니다.',part:'motor'},
 {name:'바퀴로 전달',detail:'감속기·차동기어가 모터 회전을 좌우 뒤 바퀴로 보냅니다.',part:'wheel'},
 {name:'제동·회생',detail:'감속 중 모터가 발전기로 작동할 수 있을 때 전력이 배터리로 돌아옵니다.',part:'regen'},
] as const
const regenSample=stepVehicleSystems({...NEW_SYSTEM_STATE,hv:'READY'}, {...NORMAL_SYSTEM_INPUT,gear:'D',brakePct:60,speedKmh:35},.02)
export function EvOperatingCycle({torqueNm,reduced}:{torqueNm:number;reduced?:boolean}){
 const [stage,setStage]=useState(0),[playing,setPlaying]=useState(false)
 const uid=useId().replaceAll(':',''),bodyId=`${uid}-body`,glassId=`${uid}-glass`
 useEffect(()=>{if(!playing||reduced)return;const timer=window.setInterval(()=>setStage(current=>(current+1)%stages.length),2300);return()=>window.clearInterval(timer)},[playing,reduced])
 const active=stages[stage].part
 return <section className="d16-ev-cycle" aria-label="전기차 구동 원리 단계별 그림">
  <header><div><small>EV 구동 원리 · 하나의 에너지 경로</small><h3>배터리에서 바퀴까지, 감속하면 다시</h3></div><button onClick={()=>setPlaying(value=>!value)}>{playing?'일시정지':'▶ 순서 재생'}</button></header>
  <svg viewBox="0 0 820 270" role="img" aria-label={`${stages[stage].name}: ${stages[stage].detail}`}>
   <defs><linearGradient id={bodyId} x1="0" x2="1" y1="0" y2="1"><stop stopColor="#a7e2df"/><stop offset=".5" stopColor="#54abb5"/><stop offset="1" stopColor="#25778b"/></linearGradient><linearGradient id={glassId} x1="0" x2="0" y1="0" y2="1"><stop stopColor="#dffaff"/><stop offset="1" stopColor="#97cbd5"/></linearGradient></defs>
   <path className="d16-cycle-ground" d="M35 235H785"/>
   <path className="d16-cycle-body" d="M88 181L115 145Q138 128 193 127L255 81Q275 64 329 64H491Q526 64 558 91L623 128H692Q733 128 748 156L761 191Q764 208 746 209H90Q72 209 78 190Z" fill={`url(#${bodyId})`}/>
   <path d="M211 127L268 84Q279 75 317 75H382V127ZM397 75H486Q514 75 542 99L582 127H397Z" fill={`url(#${glassId})`} stroke="#daffff" strokeWidth="3"/>
   <path d="M396 75V126M200 132H586" stroke="#1b6b79" strokeWidth="5"/>
   {[168,657].map(x=><g key={x}><circle cx={x} cy="205" r="48" fill="#203744" stroke="#f5ffff" strokeWidth="7"/><circle cx={x} cy="205" r="30" fill="#a1bec3" stroke="#4f6974" strokeWidth="4"/><circle cx={x} cy="205" r="11" fill="#e8f7f5"/></g>)}
   <g className={['battery','contactors','regen'].includes(active)?'active':''}><rect x="246" y="157" width="212" height="49" rx="10" fill="#173e58" stroke="#8eece9" strokeWidth="3"/>{[0,1,2,3,4,5].map(i=><rect key={i} x={258+i*32} y="166" width="25" height="31" rx="3" fill="#68c9ba" stroke="#d4ffff" strokeWidth="1"/>)}<text x="352" y="226" textAnchor="middle">고전압 배터리 · BMS</text></g>
   <g className={['contactors','motor','regen'].includes(active)?'active':''}><rect x="473" y="145" width="65" height="56" rx="10" fill="#30516a" stroke="#b3e6e9" strokeWidth="3"/><path d="M482 175h45m-35-12 9 12-9 12m19-24 9 12-9 12" stroke="#76e2e3" strokeWidth="3" fill="none"/><text x="506" y="226" textAnchor="middle">인버터</text></g>
   <g className={['motor','wheel','regen'].includes(active)?'active':''}><circle cx="580" cy="173" r="29" fill="#24445f" stroke="#bde9e9" strokeWidth="3"/><circle cx="580" cy="173" r="13" fill="#76cdce"/><path d="M565 173q14-25 29 0q-15 25-29 0" fill="none" stroke="#dbffff" strokeWidth="2"/><text x="580" y="226" textAnchor="middle">모터</text></g>
   <g className={active==='wheel'?'active':''}><rect x="613" y="158" width="31" height="31" rx="6" fill="#b5c7c6" stroke="#315d66" strokeWidth="3"/><path d="M611 173h42" stroke="#e9ffff" strokeWidth="4"/></g>
   <path className={'d16-cycle-flow '+(active==='contactors'||active==='motor'?'active':'')} d="M458 175H473M539 175H548"/>
   <path className={'d16-cycle-flow '+(active==='wheel'?'active':'')} d="M609 173H651"/>
   <path className={'d16-cycle-return '+(active==='regen'?'active':'')} d="M649 249H579Q566 249 566 236H527Q510 236 510 249H381Q362 249 362 235"/>
   <text x="90" y="39" className="d16-cycle-annotation">기준 차량 · 단일 모터 후륜구동</text>
   <text x="725" y="39" textAnchor="end" className="d16-cycle-annotation">모터 명령 {Math.max(0,torqueNm).toFixed(0)} Nm</text>
  </svg>
  <div className="d16-cycle-steps">{stages.map((item,index)=><button key={item.name} aria-current={stage===index?'step':undefined} onClick={()=>{setPlaying(false);setStage(index)}}><span>{index+1}</span>{item.name}</button>)}</div>
  <p><b>{stages[stage].name}</b> · {stages[stage].detail}{stage===4&&` · 현재 예시 조건에서 회생 ${regenSample.brake.regenNm.toFixed(0)} Nm`}</p>
 </section>
}
