import {readSessionPlay,rememberSessionPlay} from '../campaign/navigation'
import {startNewCampaign} from '../campaign/menu'
import { lazy,Suspense,useEffect, useRef, useState } from 'react'
import type { CSSProperties } from 'react'
import { DEFAULT_INPUTS, MISSIONS, referenceGraph, withStates } from '../content/ready.ts'
import { LogicSimulation } from '../engine/simulation.ts'
import { verify } from '../engine/verification.ts'
import type { Graph, Snapshot, TestResult } from '../engine/types.ts'
import { fingerprint } from '../progress/storage.ts'
import { award, newStory, readStory, STORY_KEY } from './story.ts'
import type { Scene, Story } from './story.ts'
import { CHAPTER_NAMES, LESSONS, lessonComplete, TRIALS } from './lessons.ts'
import { Cockpit } from './CockpitV4'
import { Dialogue, CatFace } from './Characters'
import { GuidedBoard } from './BoardV7'
import { InsideVehicle } from './VehicleExploration'
import { SignalBench } from './SignalBench'
import { WorldBackdrop, ClickFeedback } from './WorldBackdrop'
import { LogicEditor } from '../ui/LogicEditor'
import { sound } from './audio.ts'
import { DriveExperience } from './DriveExperience'
import type { DriveSample } from './DriveExperience'
import { FaultCutscene } from './FaultCutscene'
import {VehicleWorkbench} from './VehicleWorkbench'
import {VehicleAtlas} from './VehicleAtlas'
import {JourneyContext} from './JourneyContext'
import { RequirementBrief } from './RequirementBrief'
import { driveGate } from './interaction'
import {FailurePanel} from './FailurePanel'
const SystemStudio=lazy(()=>import('./SystemStudio'))
const MomoCampaign=lazy(()=>import('../campaign/CampaignEntry'))
const IntegratedWorkshop=lazy(()=>import('../workshop/IntegratedWorkshop'))

const insideNotes = [
  '브레이크 페달은 기계적인 조작이야. 여기서는 센서가 「밟았음 / 안 밟았음」이라는 참·거짓 입력으로 전달한다고 단순화했어.',
  '제어 프로그램은 입력을 읽고 조건을 판단해. 실제 ECU 회로를 재현한 건 아니야. 우리가 만드는 건 그 안에서 동작할 교육용 로직이야.',
  '판단 결과는 표시와 구동 허용으로 나와. READY가 켜져도 자동차가 이동하는 건 아니야. 가속 제어는 또 다른 기능이지!',
]
function initialSnapshot(mission=0) { const m=MISSIONS[mission]; return new LogicSimulation(m.initial,m.mode).step(referenceGraph(m.mode==='machine'),DEFAULT_INPUTS) }
function openingSnapshot() { const sim=new LogicSimulation('OFF','machine'),g=referenceGraph(true);sim.step(g,{...DEFAULT_INPUTS,power:true});sim.step(g,DEFAULT_INPUTS);return sim.step(g,{...DEFAULT_INPUTS,power:true}) }
export default function Game() {
  const [loaded]=useState(()=>readStory(localStorage))
  const [story,setStory]=useState<Story>(loaded.story??newStory())
  const [started]=useState(!!loaded.story)
  const [scene,setScene]=useState<Scene>(()=>readSessionPlay(sessionStorage,localStorage))
  const [paused,setPaused]=useState(false)
  const [wide,setWide]=useState(false)
  const [faultNodes,setFaultNodes]=useState<string[]>([])
  const [notice,setNotice]=useState(loaded.warning??'')
  const [intro,setIntro]=useState(0)
  const [driveSample,setDriveSample]=useState<DriveSample>({speedKmh:0,distance:0,torqueNm:0})
  const [full,setFull]=useState(false)
  const [visited,setVisited]=useState<number[]>([])
  const [insideFocus,setInsideFocus]=useState(-1)
  const [inputs,setInputs]=useState<Record<string,boolean>>({...DEFAULT_INPUTS,brake:false})
  const [snapshot,setSnapshot]=useState<Snapshot>(()=>initialSnapshot())
  const [hint,setHint]=useState(false)
  const [trial,setTrial]=useState('')
  const [result,setResult]=useState<TestResult>()
  const [tested,setTested]=useState<string[]>([])
  const [suite,setSuite]=useState<TestResult[]>([])
  const engine=useRef(new LogicSimulation('STANDBY','logic'))
  const mission=MISSIONS[story.mission], graph=story.lab.graphs[mission.id]
  const lesson=LESSONS[story.mission][Math.min(story.lesson,LESSONS[story.mission].length-1)]
  const requiredTrials=TRIALS[story.mission]
  const done=MISSIONS.filter(m=>(story.lab.grades[m.id]??0)>=2).length
  const activeGraph=scene==='observe'||scene==='inside'?referenceGraph(mission.mode==='machine'):graph
  useEffect(()=>{if(!started)return;try{localStorage.setItem(STORY_KEY,JSON.stringify(story))}catch{setNotice('기록을 저장하지 못했어요. 저장 공간을 확인해 주세요.')}},[story,started])
  useEffect(()=>{
    if(!['observe','build','test'].includes(scene))return
    engine.current=new LogicSimulation(mission.initial,mission.mode)
    const initial={...DEFAULT_INPUTS,brake:scene==='observe'&&story.mission===0?false:true}
    setInputs(initial);setSnapshot(engine.current.step(scene==='observe'?referenceGraph(mission.mode==='machine'):graph,initial));setFull(scene==='build'&&faultNodes.length>0);setHint(false)
    if(scene==='test'){setTrial(TRIALS[story.mission][0]);setResult(undefined);setTested([]);setSuite([])}
    // Scene entry is the reset boundary; graph edits are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scene,story.mission])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape'&&scene!=='powertrain'&&scene!=='title')setPaused(v=>!v)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[scene])
  const go=(next:Scene)=>{setScene(next);setStory(s=>({...s,scene:next}));setNotice('')}
  const start=()=>{
    try{startNewCampaign(localStorage);setPaused(false);setNotice('');setScene('campaign')}
    catch{setNotice('이전 기록을 안전하게 보관하지 못해 새 게임을 시작하지 않았어요. 저장 공간을 확인해 주세요.')}
  }
  const press=()=>{const row=engine.current.step(activeGraph,{...inputs,power:true});engine.current.step(activeGraph,{...inputs,power:false});setSnapshot(row);sound(row.state==='READY'&&snapshot.state!=='READY'?'start':row.outputs.request?'link':'tap',story.volume)}
  const toggle=(key:string)=>{const next={...inputs,[key]:!inputs[key],power:false};setInputs(next);setSnapshot(engine.current.step(activeGraph,next));}
  const edit=(next:Graph)=>{
    const changed=fingerprint(next)!==fingerprint(graph)
    setStory(s=>({...s,lab:{...s.lab,graphs:{...s.lab.graphs,[mission.id]:next},grades:{...s.lab.grades,...(changed?{[mission.id]:0}:{})},verified:{...s.lab.verified,...(changed?{[mission.id]:''}:{})}},stickers:changed?s.stickers.filter(id=>id!==mission.id):s.stickers}))
    if(changed){setTested([]);setSuite([]);setResult(undefined);setFaultNodes([]);engine.current.reset(mission.initial);setSnapshot(engine.current.step(next,DEFAULT_INPUTS))}
  }
  const openMission=(index:number)=>{
    if(MISSIONS.slice(0,index).some(m=>(story.lab.grades[m.id]??0)<2))return
    setStory(s=>{const m=MISSIONS[index];const next=s.lab.graphs[m.id]??(index===1?withStates(s.lab.graphs.conditions):structuredClone(s.lab.graphs.states));return{...s,mission:index,lesson:0,scene:'garage',lab:{...s.lab,graphs:{...s.lab.graphs,[m.id]:next}}}})
    setScene('garage');setVisited([]);setInsideFocus(-1);setTested([]);setSuite([]);setResult(undefined);setTrial('');setFaultNodes([])
  }
  const runTrial=()=>{
    if(!trial)return
    const row=verify(graph,mission).find(r=>r.id===trial)!
    setResult(row);setSnapshot(row.actual);engine.current.reset(row.actual.state);setInputs({...row.expected.inputs,power:false});
    setFaultNodes(row.inspectNodes??[])
    if(row.pass)setTested(t=>[...new Set([...t,trial])])
    sound(row.pass?'success':'oops',story.volume)
  }
  const allTests=()=>{
    const rows=verify(graph,mission);setSuite(rows);const next=award(story,rows);setStory(next)
    if(next.scene==='reward'){setScene('reward');sound('success',story.volume);const sim=new LogicSimulation(mission.initial,mission.mode);sim.step(graph,{...DEFAULT_INPUTS,power:true});sim.step(graph,DEFAULT_INPUTS);setSnapshot(sim.step(graph,{...DEFAULT_INPUTS,power:true}))}
    else{const failed=rows.find(r=>!r.pass);setResult(failed);if(failed){setTrial(failed.id);setSnapshot(failed.actual);setFaultNodes(failed.inspectNodes??[]);}sound('oops',story.volume)}
  }
  const observeDone=story.mission===0?snapshot.outputs.request===true:snapshot.state==='READY'
  useEffect(()=>rememberSessionPlay(sessionStorage,scene),[scene])
  const title=scene==='title'

  return <div className={`game scene-${scene} ${wide?'workbench-expanded':''} ${story.reducedMotion?'reduce-motion':''} ${paused?'is-paused':''}`} onClick={e=>{if((e.target as Element).closest('button'))sound('tap',story.volume)}}>
    <WorldBackdrop scene={scene==='intro'&&intro===2?'fault':scene} reduced={story.reducedMotion||paused}/><ClickFeedback/>
    {scene!=='campaign'&&scene!=='title'&&<button className="systems-launch" onClick={()=>go('workshop')}>◈ 차량 제작 공방</button>}
    {scene==='reward'&&<section className="reward-drive-panel"><header>{story.mission===0?'진입 요청은 완성! 실제 구동은 다음 장에서.':'내가 만든 READY가 차량 구동을 허용해요. 방향키로 확인해 봐요.'}</header>{story.mission===0?<SignalBench snapshot={snapshot} brake={true} focus={-1} reduced={paused||story.reducedMotion}/>:<DriveExperience enabled={driveGate(snapshot)} cockpit={false} paused={paused} volume={story.volume}/>}</section>}
    {title?<>
      <div className="title-vignette"/><div className="title-badge">작은 정비소에서 시작하는 커다란 발견</div>
      <section className="title-menu"><div className="game-wordmark"><span>모모의</span><h1>꼬마차<br/><em>정비소</em></h1><p>Vehicle Logic Lab</p><div className="wordmark-doodle">✦ ⚙ ✦</div></div><p className="title-tagline">30냥짜리 꼬마차에서 시작하는,<br/>한 대를 되살려 항구 컵에 도전하는 모모의 꿈.</p><div className="title-buttons"><button className="big-button" onClick={start}>시작하기 <span aria-hidden="true">▶</span></button></div></section><div className="garage-sign">MOMO'S GARAGE<small>오늘도 잘 부탁해!</small></div><div className="title-version">운전석에서 시작하는 · 차량 로직 모험 · v0.16.0</div>
    </>:<>
      {scene!=='campaign'&&<header className="game-hud"><button className="menu-button" aria-label="게임 메뉴" onClick={()=>setPaused(true)}>☰</button><div className="chapter-tag"><small>{scene==='intro'?'프롤로그':scene==='workshop'?'제작 01':`이야기 ${story.mission+1}`}</small><b>{scene==='intro'?'어느 맑은 날, 시험 주행':(scene==='workshop'?'내 EV · 통합 제작':scene==='powertrain'?'구동 제어 · 같은 차량의 다음 기능':CHAPTER_NAMES[story.mission])}</b></div><button className="journey-button" onClick={()=>go('map')}>READY 수첩 <span>{done}/3</span></button></header>}
      {scene==='intro'&&<>
        {intro<2?<div className="intro-drive-shell"><DriveExperience enabled={intro===1&&driveGate(openingSnapshot())} paused={paused} reduced={story.reducedMotion} volume={story.volume} onTelemetry={setDriveSample} onDistance={distance=>{if(intro===1&&distance>=75)setIntro(2)}}/><div className="intro-progress"><span>MISSION 00 · 첫 시험 주행</span><b>{intro===0?'시선을 움직여 운전석을 둘러봐요':`75m 시험 표지까지 · ${Math.min(75,Math.floor(driveSample.distance))}m`}</b><progress max={75} value={driveSample.distance}/></div></div>:<FaultCutscene paused={paused} reduced={story.reducedMotion} volume={story.volume}/>}
        <Dialogue text={intro===0?'오늘은 꼬마차의 첫 시험 날! 페달과 기어를 내려다봐. 출발을 누르면 시동을 켜 줄게. 방향키로 직접 달려보자!':intro===1?'↑로 가속, ↓로 브레이크, ← →로 방향을 바꿔 봐. 75m 표지까지 달려보자. 운전자 시점과 페달 보기도 눌러 봐!':'으앙, 꼬마차가 와르르…! 나는 무사해. 외관은 정비소에서 고치고, 차 안의 제어 프로그램은 네가 함께 만들어 줄래?'}><button className="soft-button" onClick={()=>go('arrival')}>주행 건너뛰기</button><button className="big-button" disabled={intro===1} onClick={()=>{if(intro===0){setIntro(1);sound('start',story.volume)}else go('arrival')}}>{intro===0?'시동 켜고 출발!':intro===1?'방향키로 직접 주행 중':'정비소로 가기'} →</button></Dialogue>
      </>}
      {scene==='arrival'&&<><div className="scene-caption">어서 와, 작은 엔지니어!</div><div className="arrival-card"><CatFace thinking/><h2>우리의 첫 의뢰</h2><p>꼬마차가 주행할 준비를<br/>다시 할 수 있게 도와주세요.</p><span>외관 수리: 모모 담당<br/>제어 프로그램: 나와 함께!</span></div><Dialogue text="부품 수리와 프로그램 수리는 달라. 나는 외관을 정리할게. 너는 차가 ‘주행 준비 완료’인지 판단하는 기능을 만들어 주면 돼."><button className="big-button" onClick={()=>go('garage')}>내 첫 작업 확인하기 →</button></Dialogue></>}
      {scene==='garage'&&<><div className="scene-caption">모모의 정비소 <span>오늘의 할 일 하나만, 천천히.</span></div><section className="quest-card"><span className="quest-pin">✦ 오늘의 의뢰</span><h2>{mission.title}</h2><p>{story.mission===0?'운전자가 시동을 걸고 싶을 때, 무엇을 확인해야 할까요?':story.mission===1?'버튼을 누를 때마다 차량은 자기 상태를 기억해야 해요.':'만든 기능이 엉뚱한 상황에서 켜지지 않는지 확인해요.'}</p><div className="quest-mini-path"><span>운전석</span><i>→</i><span>차 안쪽</span><i>→</i><span>작업대</span><i>→</i><span>시험</span></div><button className="big-button" onClick={()=>go('observe')}>운전석에 앉아 보기 →</button></section><button className="workbench-hotspot" onClick={()=>go('observe')}><span>✦</span>꼬마차를 살펴보자</button><Dialogue text={done===3?'세 가지 의뢰를 모두 끝냈어! 수첩에서 다시 살펴보거나 원하는 챕터를 다시 해 볼 수 있어.':'먼저 정상 동작을 직접 느껴보자. 운전석에서 시작해서, 차 안의 신호를 따라 작업대로 들어갈 거야.'}/></>}
      {scene==='observe'&&<><Cockpit snapshot={snapshot} brake={inputs.brake} system={inputs.system} onBrake={()=>toggle('brake')} onSystem={()=>toggle('system')} onPower={press} onStopped={value=>{if(value!==inputs.stopped)toggle('stopped')}} paused={paused} volume={story.volume}/><div className="lesson-ribbon"><span>1. 운전자 시점 · 정상 동작 관찰</span><b>{story.mission===0?'브레이크 조건을 켜고 START를 눌러 봐요.':'버튼을 한 번씩 눌러, OFF → STANDBY → READY를 확인해요.'}</b><small>정상 기준 로직으로 관찰 · 내 설계는 다음 작업대와 시험에서 실행해요</small></div><Dialogue text={observeDone?(story.mission===0?'진입 요청이 참이 됐네! 이번 장은 조건만 계산해서 차는 아직 못 달려. 안쪽에서는 어떻게 판단할까?':'READY가 켜졌어! 이제 D에서 ↑로 달릴 수 있어. 페달·기어를 내려다보고 움직여 봐.'):'시선을 움직여 페달과 기어를 찾아봐. 브레이크 조건과 시스템 준비를 바꾼 뒤 START를 눌러보자.'}><button className="soft-button" onClick={()=>go('garage')}>← 정비소</button><button className="big-button" disabled={!observeDone} onClick={()=>{setVisited([]);setInsideFocus(-1);go('inside')}}>차 안으로 들어가기 →</button></Dialogue></>}
      {scene==='inside'&&<><div className="lesson-ribbon"><span>2. 차 안쪽 탐험</span><b>페달에서 나온 정보는 어디로 갈까요?</b><small>① → ② → ③ 을 눌러 신호의 여행을 따라가요.</small></div><InsideVehicle snapshot={snapshot} brake={inputs.brake} visited={visited} focus={insideFocus} reduced={story.reducedMotion||paused} onBrake={()=>toggle('brake')} onPower={press} onInspect={i=>{setInsideFocus(i);setVisited(v=>[...new Set([...v,i])])}}/><Dialogue text={insideFocus<0?'차가 생각하는 과정을 세 부분으로 나눠 보자. 아래 페달과 입력부터 하나씩 눌러 봐.':insideNotes[insideFocus]}><button className="soft-button" onClick={()=>go('observe')}>← 운전석</button><button className="big-button" disabled={visited.length<3} onClick={()=>{setStory(s=>({...s,lesson:0}));go('build')}}>로직 작업대로 →</button></Dialogue></>}
      {scene==='build'&&<>
        <section className="build-shell"><JourneyContext mission={story.mission} lesson={story.lesson} onMap={()=>go('map')}/><header className="build-heading"><div><small>READY의 같은 기능 · {story.lesson+1}/{LESSONS[story.mission].length} 부분</small><h2>{lesson.title}</h2><p>{lesson.why}</p></div><div><button onClick={()=>setWide(v=>!v)}>{wide?'차량과 함께 보기':'작업대 크게'}</button><button onClick={()=>setFull(v=>!v)}>{full?'현재 부분만':'전체 READY 로직'}</button><button onClick={()=>setHint(v=>!v)}>힌트</button></div></header><div className="build-layout"><div className="build-canvas-pane">{full?<div className="full-editor"><LogicEditor graph={graph} snapshot={snapshot} allowed={mission.allowedBlocks} onChange={edit} failedNodes={faultNodes}/></div>:<GuidedBoard key={`${story.mission}-${story.lesson}`} graph={graph} lesson={lesson} snapshot={snapshot} onChange={edit} onSound={()=>sound('link',story.volume)} highlightNodes={faultNodes}/>}</div><aside className="build-live-pane"><RequirementBrief mission={mission} compact/><VehicleWorkbench snapshot={snapshot} inputs={inputs} onPower={press} onToggle={toggle} paused={paused||story.reducedMotion} volume={story.volume} graph={graph} mission={mission}/></aside></div></section>
        {hint&&<aside className="hint-bubble">{mission.hints[Math.min(story.lesson+1,3)]}</aside>}
        <Dialogue text={hint?mission.hints[Math.min(story.lesson+1,3)]:lesson.say}><button className="soft-button" onClick={()=>story.lesson>0?setStory(s=>({...s,lesson:s.lesson-1})):go('inside')}>← 이전 부분</button>{story.lesson<LESSONS[story.mission].length-1?<button className="big-button" disabled={!lessonComplete(graph,lesson)&&!full} onClick={()=>setStory(s=>({...s,lesson:s.lesson+1}))}>같은 기능의 다음 부분 →</button>:<button className="big-button" disabled={!lessonComplete(graph,lesson)&&!full} onClick={()=>go('test')}>정상 시나리오로 확인 →</button>}</Dialogue>
      </>}
      {scene==='test'&&<>
        <section className="scenario-shell"><JourneyContext mission={story.mission} lesson={story.lesson} onMap={()=>go('map')}/><header className="scenario-heading"><small>로직 이해 · 제공된 요구사항과 대조</small><h2>정상 흐름에서 내 차는 어떻게 판단할까요?</h2><p>TC를 직접 설계하는 훈련이 아니라, 입력·판단·상태·출력의 관계를 이해하는 단계예요.</p></header><div className="scenario-layout"><VehicleWorkbench snapshot={snapshot} inputs={inputs} graph={graph} mission={mission} onPower={()=>{setResult(undefined);press()}} onToggle={key=>{setResult(undefined);toggle(key)}} paused={paused||story.reducedMotion} volume={story.volume}/><section className="scenario-control"><RequirementBrief mission={mission}/><div className="provided-scenarios"><small>정상 요구사항을 먼저 보고, 조건을 하나씩 바꿔봐요.</small>{requiredTrials.map(id=>{const s=mission.scenarios.find(s=>s.id===id)!;return <button key={id} aria-pressed={trial===id} onClick={()=>{setTrial(id);setResult(undefined)}}>{tested.includes(id)?'✓':'○'} {s.name}</button>})}</div><button className="big-button run-trial" onClick={runTrial}>이 입력 흐름으로 로직 실행</button>{result&&<><FailurePanel result={result} prediction={undefined} predictionSignal={mission.mode==='logic'?'request':'ready'} onInspect={()=>{setFaultNodes(result.inspectNodes??[]);go('build')}}/><div className="scenario-step-trace">{result.trace?.map(frame=><button key={frame.index} onClick={()=>{setSnapshot(frame.actual);engine.current.reset(frame.actual.state);setInputs({...frame.expected.inputs,power:false})}}><span>입력 {frame.index+1}</span><b>{frame.actual.state}</b><small>기대 {frame.expected.state} · {frame.pass?'일치':'차이 발견'}</small></button>)}</div></>}{suite.some(r=>!r.pass)&&<p className="suite-failure">제공된 전체 시나리오 중 {suite.filter(r=>!r.pass).length}개에서 기준과 달랐어요. 실패한 경로를 다시 살펴봐요.</p>}</section></div></section><Dialogue name="모모 · 로직 관찰" text={result&&!result.pass?'요구사항과 다른 첫 입력을 찾았어. 어느 판단에서 달라졌는지 연결과 차량 반응을 함께 보자.':'READY가 됐다는 것과 바퀴가 움직인다는 것은 달라. 정상 입력을 순서대로 적용하고, 같은 설계로 직접 주행해 보자.'}><button className="soft-button" onClick={()=>go('build')}>← 로직으로 돌아가기</button><button className="big-button" onClick={allTests}>제공된 전체 시나리오 대조 →</button></Dialogue>
      </>}
      {scene==='reward'&&<><div className="reward-burst" aria-hidden="true">{Array.from({length:10},(_,i)=><span key={i} style={{'--i':i} as CSSProperties}>✦</span>)}</div><section className="reward-card"><div className="reward-stamp">✓ 검증 완료</div><h2>{story.mission===0?'첫 번째 연결, 완성!':story.mission===1?'꼬마차가 기억해요!':'꼬마차의 READY, 복구 완료!'}</h2><p>{mission.concept}</p><div className="sticker"><span>{['✦','◉','✓'][story.mission]}</span><b>{['첫 연결 엔지니어','차량의 기억 지킴이','꼼꼼한 검증 친구'][story.mission]}</b></div><span className="suite-score">{story.evidence.at(-1)?.results.filter(r=>r.pass).length}개 시험 통과 · {story.lab.grades[mission.id]===3?'추가 조건까지 확인':'필수 검증 완료'}</span><button className="big-button" onClick={()=>story.mission<2?openMission(story.mission+1):go('map')}>{story.mission<2?'다음 의뢰 받기':'모험 수첩에 기록하기'} →</button></section><Dialogue happy text={story.mission===0?'이번에는 시동을 허용할 조건을 완성했어. 다음엔 이 조건으로 실제 차량 상태를 바꿔 보자.':'반짝! 프로그램이 준비 상태를 올바르게 판단해. 외관 수리는 내가 따로 마쳤어. 함께 꼬마차를 도운 거야.'}/></>}
      {scene==='campaign'&&<Suspense fallback={<div className="mc-engine-loading">모모의 모험을 준비하고 있어요…</div>}><MomoCampaign paused={paused} volume={story.volume} reduced={story.reducedMotion} onMenu={()=>setPaused(true)} onResume={()=>setPaused(false)} onExit={()=>{setPaused(false);setScene('title')}} onVolume={volume=>setStory(s=>({...s,volume}))} onReduced={reducedMotion=>setStory(s=>({...s,reducedMotion}))}/></Suspense>}
      {scene==='workshop'&&<Suspense fallback={<div className="iw-root">통합 차량 공방을 준비하고 있어요…</div>}><IntegratedWorkshop paused={paused} reduced={story.reducedMotion} volume={story.volume} onBack={()=>go('title')} onReady={()=>openMission(0)}/></Suspense>}
      {scene==='map'&&<section className="journal journal-v8"><VehicleAtlas snapshot={snapshot} brake={inputs.brake} completed={done} onReady={()=>openMission(Math.min(done,2))} onPowertrain={()=>go('powertrain')}/><nav className="journal-chapter-strip" aria-label="READY 모험 수첩">{MISSIONS.map((m,i)=><button key={m.id} disabled={MISSIONS.slice(0,i).some(prior=>(story.lab.grades[prior.id]??0)<2)} onClick={()=>openMission(i)}><span>{(story.lab.grades[m.id]??0)>=2?'✓':i+1}</span><b>{m.title}</b><small>{(story.lab.grades[m.id]??0)>=2?'완료':'같은 READY 기능의 단계'}</small></button>)}</nav><button className="journal-back" onClick={()=>go('garage')}>← 정비소로</button></section>}
      {scene==='powertrain'&&<section className="integrated-powertrain"><header><button onClick={()=>go('map')}>← 차량 동작 지도</button><div><small>같은 자동차 → 구동 → 입력 품질·요구·제한·동특성</small><b>READY 뒤에 이어지는 구동 기능을 만들어요.</b></div></header><Suspense fallback={<div className="studio-loading">구동 로직을 열고 있어요…</div>}><SystemStudio embedded readySnapshot={snapshot} story={story} onClose={()=>go('map')} onReady={()=>openMission(0)}/></Suspense></section>}

    </>}
    {notice&&<div className="game-notice" role="status">{notice}<button onClick={()=>setNotice('')}>닫기</button></div>}
    {paused&&scene!=='campaign'&&<div className="pause-backdrop"><section className="pause-menu" role="dialog" aria-modal="true" aria-label="게임 메뉴"><CatFace/><h2>잠깐 쉬어갈까요?</h2><label>효과음 크기<input aria-label="효과음 크기" type="range" min="0" max="0.6" step="0.05" value={story.volume} onChange={e=>setStory(s=>({...s,volume:Number(e.target.value)}))}/></label><label><input type="checkbox" checked={story.reducedMotion} onChange={e=>setStory(s=>({...s,reducedMotion:e.target.checked}))}/>움직임 줄이기</label><button className="big-button" onClick={()=>setPaused(false)}>게임으로 돌아가기</button><button onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>setNotice('Windows 게임에서는 F11로 전체 화면을 전환할 수 있어요.'))}}>전체 화면 전환</button><button onClick={()=>{setScene('title');setPaused(false)}}>메인 화면으로</button><small>진행은 자동으로 저장돼요.<br/>새 모험은 이전 기록을 백업한 뒤 시작해요.</small></section></div>}
  </div>
}
