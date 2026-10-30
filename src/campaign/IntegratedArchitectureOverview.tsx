import {useEffect,useState} from 'react'
import {MODEL_CONTEXT,MODEL_SPECS,evaluateModel} from './domainTraining'
import type {LogicId,Designs} from './domainTraining'
import {MODEL_ALLOCATION,SUPPORT_ALLOCATION,SUPPORT_ROUTES} from './vehicleArchitecture'
import {VehicleFlowIllustration,domainForFunction} from './VehicleFlowIllustration'
import {ArchitectureSlices} from './ArchitectureSlices'

type FunctionRef={id:LogicId|string;label:string}
const domains=[
 {name:'에너지·전원',purpose:'전력을 안전하게 준비하고 사용 가능한 양을 정한다',groups:[{name:'상태·접속',functions:[{id:'bms',label:'배터리 상태 판단'},{id:'start',label:'START 요청 허용'},{id:'hv',label:'프리차지·접촉기'},{id:'ready',label:'READY 상태 전이'}]},{name:'공급·제한',functions:[{id:'power',label:'전력 사용 허용'},{id:'packLimit',label:'출력 가용량'},{id:'charge',label:'충전·저전압 공급'}]}]},
 {name:'구동',purpose:'운전자 가속 의도를 바퀴의 구동력으로 바꾼다',groups:[{name:'요구·허용',functions:[{id:'request',label:'운전자 토크 요청'},{id:'drive',label:'전진 구동 허용'}]},{name:'실현',functions:[{id:'inverter',label:'인버터·모터 토크'},{id:'driveline',label:'감속기·구동축'}]}]},
 {name:'제동',purpose:'감속 요구를 바퀴의 제동력으로 바꾼다',groups:[{name:'요구',functions:[{id:'brake',label:'마찰 제동력 요청'}]},{name:'배분·안정',functions:[{id:'blend',label:'회생·마찰 협조와 휠 제어'}]}]},
 {name:'조향',purpose:'운전자 조향과 보조 힘으로 앞바퀴 방향을 바꾼다',groups:[{name:'운동 표현',functions:[{id:'steer',label:'앞바퀴 각도 변환'}]},{name:'보조',functions:[{id:'eps',label:'EPS 보조 토크'}]}]},
 {name:'차체·열·통합',purpose:'접지·온도·신호를 관리하고 기능 출력을 연결한다',groups:[{name:'물리·열',functions:[{id:'chassis',label:'차체·타이어·현가'},{id:'thermal',label:'열관리'}]},{name:'연결·감시',functions:[{id:'integration',label:'출력 라우팅'},{id:'network',label:'통신·진단'}]}]},
] satisfies {name:string;purpose:string;groups:{name:string;functions:FunctionRef[]}[]}[]

const actuator:Record<string,string>={bms:'배터리 접촉기 · 인버터 차단',start:'프리차지 회로 · 주 접촉기',power:'인버터 토크 허용 경계',request:'인버터 → 구동 모터',drive:'인버터 → 구동 모터',brake:'제동 액추에이터 → 캘리퍼·디스크',steer:'EPS 보조 모터 + 기계식 랙·타이로드',integration:'인버터·캘리퍼·EPS',ready:'프리차지 회로 · 주 접촉기',packLimit:'인버터 출력 제한',hv:'프리차지 회로 · 주 접촉기',charge:'OBC · DC/DC',inverter:'인버터 3상 전류 → 모터',driveline:'감속기 · 차동기어 · 뒷바퀴',blend:'인버터 회생 토크 + 캘리퍼',eps:'EPS 모터 · 랙',chassis:'타이어 · 현가',thermal:'냉각 펌프 · 팬',network:'연결된 ECU와 액추에이터'}
const isModel=(id:string):id is LogicId=>id in MODEL_SPECS

const scenarios=[
 {name:'시동 후 가속',path:['에너지·전원','구동','차체·열·통합'],cue:'고전압 준비 → 토크 허용 → 모터·구동륜 → 차량 운동'},
 {name:'가속 후 감속',path:['에너지·전원','구동','제동','차체·열·통합'],cue:'구동 토크 감소 → 회생·마찰 제동 요청 → 바퀴 감속'},
 {name:'시동 후 조향',path:['에너지·전원','조향','차체·열·통합'],cue:'READY → 운전자 조향·EPS 보조 → 앞바퀴 방향 → 진로 변경'},
 {name:'정차·전원 OFF',path:['제동','에너지·전원','차체·열·통합'],cue:'제동으로 정차 → 토크 차단 → 접촉기 개방·전원 종료'},
]
export function IntegratedArchitectureOverview({focusId,initialLevel='function',designs}:{focusId:LogicId;initialLevel?:'system'|'domain'|'function';designs?:Designs}){
 const [selected,setSelected]=useState<string>(focusId),[treeOpen,setTreeOpen]=useState(false),[step,setStep]=useState(0),[playing,setPlaying]=useState(false),[caseIndex,setCaseIndex]=useState(0)
 const [level,setLevel]=useState(initialLevel),[scenario,setScenario]=useState(0)
 useEffect(()=>{setStep(0);setPlaying(false);setCaseIndex(0)},[selected])
 useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setStep(value=>{if(value===4){setPlaying(false);return value}return value+1}),2200);return()=>window.clearInterval(timer)},[playing])
 const route=SUPPORT_ROUTES.find(item=>item.id===selected)
 const model=isModel(selected)?MODEL_SPECS[selected]:null
 const context=isModel(selected)?MODEL_CONTEXT[selected]:null
 const allocation=isModel(selected)?MODEL_ALLOCATION[selected]:route?SUPPORT_ALLOCATION[route.id]:null
 const location=domains.find(domain=>domain.groups.some(group=>group.functions.some(item=>item.id===selected)))!
 const group=location.groups.find(group=>group.functions.some(item=>item.id===selected))!
 const name=model?.function??route?.name??selected
 const testCase=model?.cases[caseIndex%model.cases.length]
 const actual=isModel(selected)&&designs&&testCase?evaluateModel(designs[selected],testCase.input):null
 const actualText=actual?Object.entries(actual.output).map(([key,value])=>`${key} = ${String(value)}`).join(' · '):''
 const input=context?.inputBoundary??route?.input??''
 const logic=context?.logicFamily??route?.software??''
 const output=context?.outputBoundary??route?.output??''
 const effect=context?.physicalEffect??route?.effect??''
 const stages=[
  {title:'입력 · 센서/운전자',detail:input,icon:'◉'},
  {title:allocation?.swc?'SW 기능 계산':'기계 전달',detail:allocation?.swc?`${allocation.ecu} / ${allocation.swc} · ${logic}${actualText?' · 내 출력: '+actualText:''}`:route?.software??'차체·현가·타이어의 힘 전달',icon:'▣'},
  {title:'출력 신호',detail:output,icon:'⇢'},
  {title:'액추에이터·기계',detail:actuator[selected]??'차량 장치',icon:'⚙'},
  {title:'차량 반응',detail:effect,icon:'↗'},
 ]
 return <section className="vla-integrated">
  <header><small>System / 흰둥's EV Car / Domain / {location.name} / Function / {name}</small><h2>{level==='system'?'한 대의 차가 움직이는 순서':level==='domain'?`${location.name} 안의 기능 흐름`:'입력에서 차량 반응까지'}</h2><p>도메인 흐름을 먼저 보고, 기능을 선택해 입력·SW 계산·출력 장치가 이어지는 모습을 살펴보세요.</p></header>
  <nav className="vla-level-tabs" aria-label="아키텍처 확대 수준"><button aria-pressed={level==='system'} onClick={()=>setLevel('system')}>System · 전체 흐름</button><button aria-pressed={level==='domain'} onClick={()=>setLevel('domain')}>Domain · {location.name}</button><button aria-pressed={level==='function'} onClick={()=>setLevel('function')}>Function · {name}</button></nav>
  {level==='system'&&<ArchitectureSlices/>}
  {level==='system'&&<section className="vla-scenario-map" aria-label="주행 상황별 도메인 흐름"><div className="vla-scenario-choices">{scenarios.map((item,index)=><button key={item.name} aria-pressed={scenario===index} onClick={()=>setScenario(index)}>{item.name}</button>)}</div><div className="vla-system-spine" aria-label="차량 기능의 필수 기반과 주행 상황별 경로"><div className="required"><small>공통 기반</small><b>에너지·전원</b><span>HV 준비 · 사용 가능량</span></div><i>→</i><div className="branches"><small>상황에 따라 함께 작동</small>{['구동','제동','조향'].map(domain=><button key={domain} className={scenarios[scenario].path.includes(domain)?'lit':''} onClick={()=>{const next=domains.find(item=>item.name===domain)!;setSelected(next.groups[0].functions[0].id);setLevel('domain')}}>{domain}</button>)}</div><i>→</i><div className="required"><small>공통 물리·통합 기반</small><b>차체·열·통합</b><span>접지 · 온도 · 출력 라우팅</span></div></div><div className="vla-domain-flow">{scenarios[scenario].path.map((domain,index)=><button key={`${domain}-${index}`} className={domain===location.name?'current':''} onClick={()=>{const next=domains.find(item=>item.name===domain);if(next){setSelected(next.groups[0].functions[0].id);setLevel('domain')}}}><span>{index+1}</span><b>{domain}</b><small>{domains.find(item=>item.name===domain)?.purpose}</small></button>)}</div><p>{scenarios[scenario].cue}</p><div className="vla-system-illustrations">{scenarios[scenario].path.map((domain,index)=>{const item=domains.find(entry=>entry.name===domain)!;return <button key={domain} onClick={()=>{setSelected(item.groups[0].functions[0].id);setLevel('domain')}}><VehicleFlowIllustration domain={domainForFunction(item.groups[0].functions[0].id)} step={index===0?2:4} compact/><b>{domain} 기능 살펴보기 →</b></button>})}</div></section>}
  {level==='domain'&&<section className="vla-domain-inspection"><header><small>Domain / {location.name}</small><h3>{location.purpose}</h3><p>아래 기능들이 함께 동작해 {location.name} 도메인의 출력을 만듭니다. 기능을 고르면 실제 입력·계산·출력 경로가 열려요.</p></header><div className="vla-domain-functions">{location.groups.flatMap(branch=>branch.functions.map(item=><button key={item.id} onClick={()=>{setSelected(item.id);setLevel('function')}}><VehicleFlowIllustration domain={domainForFunction(item.id)} focusId={item.id} compact/><small>{branch.name}</small><b>{item.label}</b><span>{item.id==='chassis'?'현가·타이어 기계 경로 보기 ↗':'입력 → 계산 → 출력 보기 ↗'}</span></button>))}</div></section>}
  {level==='function'&&<div className="vla-integrated-layout">
   <nav className="vla-integrated-tree" aria-label="차량 기능 계층"><button aria-expanded={treeOpen} onClick={()=>setTreeOpen(value=>!value)}>▣ System · 흰둥's EV Car <span>{treeOpen?'접기 ▴':'기능 트리 펼치기 ▾'}</span></button>{treeOpen&&domains.map(domain=><details key={domain.name} open={domain===location}><summary>Domain · {domain.name}<small>{domain.purpose}</small></summary>{domain.groups.map(branch=><div key={branch.name}><strong>{branch.name}</strong>{branch.functions.map(item=><button key={item.id} aria-current={selected===item.id?'step':undefined} onClick={()=>{setSelected(item.id);setLevel('function')}}>Function · {item.label}</button>)}</div>)}</details>)}</nav>
   <div className="vla-integrated-main"><div className="vla-integrated-heading"><div><small>{location.name} / {group.name}</small><h3>{name}</h3></div><button onClick={()=>{setStep(0);setPlaying(true)}}>▶ 흐름 재생</button></div><VehicleFlowIllustration domain={domainForFunction(selected)} focusId={selected} step={step}/>{model&&<div className="vla-integrated-cases" aria-label="기능 시험 조건">{model.cases.map((item,index)=><button key={item.name} aria-pressed={caseIndex===index} onClick={()=>{setCaseIndex(index);setStep(0);setPlaying(false)}}>{item.name}</button>)}</div>}<div className="vla-integrated-flow" aria-label="입력에서 차량 반응까지 이어지는 경로">{stages.map((stage,index)=><button key={stage.title} className={step===index?'active':step>index?'passed':''} aria-current={step===index?'step':undefined} onClick={()=>{setPlaying(false);setStep(index)}}><span>{stage.icon}</span><small>{index+1} / 5</small><b>{stage.title}</b><em>{stage.detail}</em></button>)}</div><div className="vla-integrated-focus" role="status"><strong>{stages[step].title}</strong><span>{stages[step].detail}</span><button onClick={()=>{setPlaying(false);setStep(value=>Math.min(4,value+1))}} disabled={step===4}>다음 단계 →</button></div>{model&&<div className="vla-integrated-computation"><b>이 조건에서 실제 계산</b><div>{model.steps.map((item,index)=><span key={item}>{index+1}. {item}</span>)}</div><p>입력: {Object.entries(testCase!.input).map(([key,value])=>`${key} ${String(value)}`).join(' · ')}</p><p className={actual&&Object.entries(testCase!.expected).every(([key,value])=>actual.output[key]===value)&&actual.errors.length===0?'pass':'fail'}>기대: {Object.entries(testCase!.expected).map(([key,value])=>`${key} ${String(value)}`).join(' · ')} / 내 출력: {actualText||'연결 전'}</p></div>}{allocation?.swc&&allocation.runnable&&<details className="vla-integrated-allocation"><summary>이 기능의 실행 배치 · ECU / SWC / Runnable</summary><p>기능 경로: System / {location.name} / {group.name} / {name}</p><p>실행 배치: {allocation.ecu} / {allocation.swc} / {allocation.runnable}</p></details>}</div>
  </div>}
 </section>
}
