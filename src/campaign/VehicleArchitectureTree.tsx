import {useEffect,useState} from 'react'
import {MODEL_CONTEXT,MODEL_SPECS,ROUNDS} from './domainTraining'
import type {DomainId,LogicId} from './domainTraining'
import {MODEL_ALLOCATION,SUPPORT_ALLOCATION,SUPPORT_ROUTES,TOPOLOGY_PATHS} from './vehicleArchitecture'

const domainIcon:Record<DomainId,string>={power:'⚡',drive:'↗',brake:'◉',steer:'↶'}
const domainTitle:Record<DomainId,string>={power:'에너지·전원',drive:'구동',brake:'제동',steer:'조향'}

export function ArchitectureCompass({activeDomain,activeModel,stage,onOpen}:{activeDomain:DomainId|'system'|'chassis';activeModel:LogicId;stage:string;onOpen:()=>void}){
 const [open,setOpen]=useState(false)
 const [expanded,setExpanded]=useState<DomainId|'system'|'chassis'>(activeDomain)
 useEffect(()=>{setExpanded(activeDomain);setOpen(false)},[activeDomain])
 const location=activeDomain==='chassis'?'섀시·차체 / 바퀴·현가':activeDomain==='system'?'차량 통합 / 도메인 출력':`${domainTitle[activeDomain]} / ${MODEL_SPECS[activeModel].function}`
 return <section className="d16-compass" aria-label="현재 차량 기능 위치">
  <header><div><small>차량 기능 트리 · 현재 위치</small><b>{location}</b></div><button aria-expanded={open} onClick={()=>setOpen(v=>!v)}>{open?'접기 ▴':'펼치기 ▾'}</button></header>
  {open&&<><button className="d16-compass-full" onClick={onOpen}>전체 구조에서 보기 ↗</button>
  <div className="d16-compass-root"><span className="d16-tree-node system">System</span><b>흰둥's EV Car</b></div>
  <div className="d16-compass-branches">
   {ROUNDS.map(round=><div className={'d16-compass-domain '+(activeDomain===round.id?'current':'')} key={round.id}>
    <button aria-expanded={expanded===round.id} aria-current={activeDomain===round.id?'step':undefined} onClick={()=>setExpanded(expanded===round.id?'system':round.id)}><span>{domainIcon[round.id]}</span><b>{domainTitle[round.id]}</b><small>{expanded===round.id?'▾':'▸'}</small></button>
    {expanded===round.id&&<div className="d16-compass-functions">{round.models.map(model=><div className={activeModel===model&&activeDomain===round.id?'current':''} key={model}><span>Function</span><b>{MODEL_SPECS[model].function}</b>{activeModel===model&&activeDomain===round.id&&<div className="d16-compass-depth"><span>ECU · {MODEL_ALLOCATION[model].ecu}</span><span>SWC · {MODEL_ALLOCATION[model].swc}</span><strong>Runnable · {MODEL_ALLOCATION[model].runnable}</strong></div>}</div>)}</div>}
   </div>)}
   <div className={'d16-compass-domain '+(activeDomain==='chassis'?'current':'')}><button aria-expanded={expanded==='chassis'} aria-current={activeDomain==='chassis'?'step':undefined} onClick={()=>setExpanded('chassis')}><span>◌</span><b>섀시·차체</b><small>{expanded==='chassis'?'▾':'▸'}</small></button>{expanded==='chassis'&&<div className="d16-compass-functions"><div className={activeDomain==='chassis'?'current':''}><span>물리 구조</span><b>앞·뒤 바퀴와 수동 현가</b><div className="d16-compass-depth"><span>차체 → 현가 → 허브 → 타이어 → 노면</span></div></div></div>}</div>
   <div className={'d16-compass-domain '+(activeDomain==='system'?'current':'')}><button aria-expanded={expanded==='system'} aria-current={activeDomain==='system'?'step':undefined} onClick={()=>setExpanded('system')}><span>◇</span><b>차량 시스템 통합</b><small>▸</small></button>{expanded==='system'&&<div className="d16-compass-functions"><div className={activeDomain==='system'?'current':''}><span>Function</span><b>{MODEL_SPECS.integration.function}</b>{activeDomain==='system'&&<div className="d16-compass-depth"><span>ECU · {MODEL_ALLOCATION.integration.ecu}</span><span>SWC · {MODEL_ALLOCATION.integration.swc}</span><strong>Runnable · {MODEL_ALLOCATION.integration.runnable}</strong></div>}</div></div>}</div>
  </div>
  <div className="d16-compass-stage"><span>현재 작업</span><b>{stage}</b></div></>}
 </section>
}

export function ArchitectureOverview({focusId}:{focusId:LogicId}){
 const [selected,setSelected]=useState<string>(focusId)
 const [treeOpen,setTreeOpen]=useState(false)
 const [motionStep,setMotionStep]=useState(0),[playing,setPlaying]=useState(false),[routeView,setRouteView]=useState<'전력'|'신호'|'기계'>('신호')
 useEffect(()=>{setMotionStep(0);setPlaying(false)},[selected])
 useEffect(()=>{if(!playing)return;const timer=window.setInterval(()=>setMotionStep(step=>{if(step>=4){setPlaying(false);return 4}return step+1}),1400);return()=>window.clearInterval(timer)},[playing])
 const id=(selected in MODEL_SPECS?selected:focusId) as LogicId
 const support=SUPPORT_ROUTES.find(route=>route.id===selected)
 const spec=MODEL_SPECS[id],allocation=MODEL_ALLOCATION[id],context=MODEL_CONTEXT[id]
 const stages=[
  {icon:'◉',name:'입력',value:support?support.input:context.inputBoundary},
  {icon:'▣',name:'제어기',value:support?SUPPORT_ALLOCATION[support.id].ecu:allocation.ecu},
  {icon:'◇',name:support&&!SUPPORT_ALLOCATION[support.id].swc?'기계 전달':'SWC · Runnable',value:support?SUPPORT_ALLOCATION[support.id].swc?`${SUPPORT_ALLOCATION[support.id].swc} / ${SUPPORT_ALLOCATION[support.id].runnable}`:'모터·축·바퀴 사이의 물리 경로':`${allocation.swc} / ${allocation.runnable}`},
  {icon:'⇢',name:'출력',value:support?support.output:context.outputBoundary},
  {icon:'◌',name:'차량 반응',value:support?support.effect:context.physicalEffect},
 ]
 const groups=[
  {name:'에너지·전원',icon:'⚡',models:['bms','start','power'] as LogicId[]},
  {name:'구동',icon:'↗',models:['request','drive'] as LogicId[]},
  {name:'제동',icon:'◉',models:['brake'] as LogicId[]},
  {name:'조향',icon:'↶',models:['steer'] as LogicId[]},
  {name:'섀시',icon:'◌',models:[] as LogicId[]},
  {name:'열관리',icon:'♨',models:[] as LogicId[]},
  {name:'차량 통합·진단',icon:'◇',models:['integration'] as LogicId[]},
 ]
 return <div className="vla-architecture">
  <div className="vla-architecture-intro"><small>기능 구조 × 제어기 배치</small><h2>차량 기능이 장치에 닿는 길</h2><p>기능을 선택하면 운전자·센서 입력에서 제어기, 출력, 물리 장치까지 연결 경로가 나타나요. 청록 점은 지금 만드는 로직입니다.</p></div>
  <div className={'vla-architecture-layout'+(treeOpen?'':' tree-collapsed')}>
   <nav className="vla-tree" aria-label="차량 기능 계층">
    <button className="vla-tree-toggle" aria-expanded={treeOpen} onClick={()=>setTreeOpen(value=>!value)}><span>▣ System / 흰둥's EV Car</span><b>{treeOpen?'접기 ▴':'차량 기능 트리 펼치기 ▾'}</b></button>
    {treeOpen&&groups.map(group=><div className="vla-tree-domain" key={group.name}><h3><span>{group.icon}</span> Domain · {group.name}</h3>{group.models.map(model=><button key={model} aria-current={selected===model?'step':undefined} onClick={()=>setSelected(model)}><span className="vla-mission-dot"/> {MODEL_SPECS[model].function}</button>)}{SUPPORT_ROUTES.filter(route=>route.domain===group.name).map(route=><button key={route.id} aria-current={selected===route.id?'step':undefined} onClick={()=>setSelected(route.id)}>└ {route.name}</button>)}</div>)}
   </nav>
   <section className="vla-architecture-detail" aria-live="polite"><small>{support?support.domain:spec.domain} / {support?support.name:spec.function}</small><h3>{support?support.name:spec.function}</h3><div className="vla-motion-head"><b>한 기능을 끝까지 따라가기</b><div><button onClick={()=>{setMotionStep(0);setPlaying(true)}} aria-label="기능 흐름 처음부터 재생">▶ 재생</button><button onClick={()=>{setPlaying(false);setMotionStep(0)}} aria-label="기능 흐름 처음으로">↺</button></div></div><div className="vla-motion-track" role="group" aria-label="입력에서 차량 반응까지 다섯 단계">{stages.map((stage,index)=><button key={stage.name} className={(index===motionStep?'active ':index<motionStep?'passed ':'')+'vla-motion-node'} aria-current={index===motionStep?'step':undefined} onClick={()=>{setPlaying(false);setMotionStep(index)}}><span className="vla-motion-icon">{stage.icon}</span><small>{String(index+1).padStart(2,'0')}</small><b>{stage.name}</b></button>)}</div><div className="vla-motion-scene" aria-label="선택한 단계의 차량 구조 그림"><div className={'vla-motion-pulse step-'+motionStep}/><span className={'sensor '+(motionStep===0?'lit':'')}>센서</span><span className={'controller '+(motionStep===1||motionStep===2?'lit':'')}>ECU<br/><small>SWC</small></span><span className={'actuator '+(motionStep===3?'lit':'')}>액추에이터</span><span className={'vehicle '+(motionStep===4?'lit':'')} aria-label="차량"><i className="car-body"/><i className="wheel left"/><i className="wheel right"/></span><i className="line one"/><i className="line two"/><i className="line three"/></div><div className="vla-motion-caption"><span>{motionStep+1} / 5 · {stages[motionStep].name}</span><strong>{stages[motionStep].value}</strong></div><details className="vla-allocation-note"><summary>이 경로의 계층 읽기</summary><p>System / Domain / Function은 차량의 일을 나눕니다. ECU는 실행 장치이고, SWC 안의 Runnable이 계산을 수행합니다. 출력은 액추에이터를 거쳐 차량 움직임으로 이어집니다.</p></details></section>
  </div>
  <section className="vla-topology"><header><small>전력 × 신호 × 기계 경로</small><h3>한 대의 차에서 이어지는 연결</h3></header><nav className="vla-route-tabs" aria-label="연결 경로 종류">{(['전력','신호','기계'] as const).map(view=><button key={view} aria-pressed={routeView===view} onClick={()=>setRouteView(view)}>{view==='전력'?'⚡ ':view==='신호'?'◇ ':'⚙ '}{view}</button>)}</nav><div className="vla-topology-grid">{TOPOLOGY_PATHS.filter(path=>path.view===routeView).map(path=><article className={'vla-topology-card '+(path.view==='전력'?'energy':path.view==='신호'?'signal':'mechanical')} key={path.id}><header><span>{path.view}</span><b>{path.title}</b></header><div>{path.steps.map((step,index)=><div key={step}><span>{String(index+1).padStart(2,'0')}</span><b>{step}</b></div>)}</div></article>)}</div></section>
 </div>
}

