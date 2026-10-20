import { useEffect, useRef, useState } from 'react'
import type { ChangeEvent, CSSProperties } from 'react'
import { DEFAULT_INPUTS, MISSIONS, referenceGraph, withStates, STATES } from '../content/ready.ts'
import { LogicSimulation } from '../engine/simulation.ts'
import { verify } from '../engine/verification.ts'
import type { Graph, Snapshot, TestResult } from '../engine/types.ts'
import { fingerprint } from '../progress/storage.ts'
import { award, newStory, readStory, STORY_KEY } from './story.ts'
import type { Scene, Story } from './story.ts'
import { CHAPTER_NAMES, LESSONS, lessonComplete, TRIALS } from './lessons.ts'
import { Cockpit } from './CockpitV4'
import { Dialogue, CatFace } from './Characters'
import { GuidedBoard } from './ConnectionBoard'
import { InsideVehicle } from './VehicleExploration'
import { SignalBench } from './SignalBench'
import { WorldBackdrop, ClickFeedback } from './WorldBackdrop'
import { LogicEditor } from '../ui/LogicEditor'
import { sound } from './audio.ts'
import { DriveExperience } from './DriveExperience'
import type { DriveSample } from './DriveExperience'
import { FaultCutscene } from './FaultCutscene'
import { TestReplay } from './TestReplay'
import { RequirementBrief } from './RequirementBrief'
import { driveGate } from './interaction'

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
  const [started,setStarted]=useState(!!loaded.story)
  const [scene,setScene]=useState<Scene>('title')
  const [paused,setPaused]=useState(false)
  const [notice,setNotice]=useState(loaded.warning??'')
  const [intro,setIntro]=useState(0)
  const [driveSample,setDriveSample]=useState<DriveSample>({speedKmh:0,distance:0,torqueNm:0})
  const [replayRun,setReplayRun]=useState(0)
  const [full,setFull]=useState(false)
  const [visited,setVisited]=useState<number[]>([])
  const [insideFocus,setInsideFocus]=useState(-1)
  const [labFocus,setLabFocus]=useState(1)
  const [inputs,setInputs]=useState<Record<string,boolean>>({...DEFAULT_INPUTS,brake:false})
  const [snapshot,setSnapshot]=useState<Snapshot>(()=>initialSnapshot())
  const [hint,setHint]=useState(false)
  const [trial,setTrial]=useState('')
  const [prediction,setPrediction]=useState<boolean>()
  const [result,setResult]=useState<TestResult>()
  const [tested,setTested]=useState<string[]>([])
  const [suite,setSuite]=useState<TestResult[]>([])
  const engine=useRef(new LogicSimulation('STANDBY','logic'))
  const fileInput=useRef<HTMLInputElement>(null)
  const mission=MISSIONS[story.mission], graph=story.lab.graphs[mission.id]
  const lesson=LESSONS[story.mission][Math.min(story.lesson,LESSONS[story.mission].length-1)]
  const requiredTrials=TRIALS[story.mission]
  const done=MISSIONS.filter(m=>(story.lab.grades[m.id]??0)>=2).length
  const activeGraph=scene==='observe'||scene==='inside'?referenceGraph(mission.mode==='machine'):graph
  useEffect(()=>{if(!started)return;try{localStorage.setItem(STORY_KEY,JSON.stringify(story))}catch{setNotice('기록을 저장하지 못했어요. 메뉴에서 진행 내보내기를 이용하세요.')}},[story,started])
  useEffect(()=>{
    if(!['observe','build','test'].includes(scene))return
    engine.current=new LogicSimulation(mission.initial,mission.mode)
    const initial={...DEFAULT_INPUTS,brake:scene==='observe'&&story.mission===0?false:true}
    setInputs(initial);setSnapshot(engine.current.step(scene==='observe'?referenceGraph(mission.mode==='machine'):graph,initial));setFull(false);setHint(false)
    if(scene==='test'){setTrial(TRIALS[story.mission][0]);setPrediction(undefined);setResult(undefined);setTested([]);setSuite([])}
    // Scene entry is the reset boundary; graph edits are handled below.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  },[scene,story.mission])
  useEffect(()=>{const key=(e:KeyboardEvent)=>{if(e.key==='Escape')setPaused(v=>!v)};window.addEventListener('keydown',key);return()=>window.removeEventListener('keydown',key)},[])
  const go=(next:Scene)=>{setScene(next);setStory(s=>({...s,scene:next}));setNotice('')}
  const start=()=>{
    try{const prior=localStorage.getItem(STORY_KEY);if(prior)localStorage.setItem(`${STORY_KEY}.backup`,prior)}catch{/* optional backup */}
    const fresh=newStory();fresh.volume=story.volume;fresh.reducedMotion=story.reducedMotion
    setStory(fresh);setStarted(true);setIntro(0);setVisited([]);setScene('intro');setPaused(false);setTested([]);setSuite([])
  }
  const press=()=>{const row=engine.current.step(activeGraph,{...inputs,power:true});engine.current.step(activeGraph,{...inputs,power:false});setSnapshot(row);setLabFocus(2);sound(row.state==='READY'&&snapshot.state!=='READY'?'start':row.outputs.request?'link':'tap',story.volume)}
  const toggle=(key:string)=>{const next={...inputs,[key]:!inputs[key],power:false};setInputs(next);setSnapshot(engine.current.step(activeGraph,next));setLabFocus(key==='brake'?0:1)}
  const edit=(next:Graph)=>{
    setLabFocus(1)
    const changed=fingerprint(next)!==fingerprint(graph)
    setStory(s=>({...s,lab:{...s.lab,graphs:{...s.lab.graphs,[mission.id]:next},grades:{...s.lab.grades,...(changed?{[mission.id]:0}:{})},verified:{...s.lab.verified,...(changed?{[mission.id]:''}:{})}},stickers:changed?s.stickers.filter(id=>id!==mission.id):s.stickers}))
    if(changed){setTested([]);setSuite([]);setResult(undefined);engine.current.reset(mission.initial);setSnapshot(engine.current.step(next,DEFAULT_INPUTS))}
  }
  const openMission=(index:number)=>{
    if(MISSIONS.slice(0,index).some(m=>(story.lab.grades[m.id]??0)<2))return
    setStory(s=>{const m=MISSIONS[index];const next=s.lab.graphs[m.id]??(index===1?withStates(s.lab.graphs.conditions):structuredClone(s.lab.graphs.states));return{...s,mission:index,lesson:0,scene:'garage',lab:{...s.lab,graphs:{...s.lab.graphs,[m.id]:next}}}})
    setScene('garage');setVisited([]);setInsideFocus(-1);setTested([]);setSuite([]);setResult(undefined);setTrial('')
  }
  const runTrial=()=>{
    if(prediction===undefined||!trial)return
    const row=verify(graph,mission).find(r=>r.id===trial)!
    setResult(row);setSnapshot(row.actual);setReplayRun(n=>n+1)
    if(row.pass&&prediction===Object.values(row.expected.outputs).some(Boolean))setTested(t=>[...new Set([...t,trial])])
    sound(row.pass&&prediction===Object.values(row.expected.outputs).some(Boolean)?'success':'oops',story.volume)
  }
  const allTests=()=>{
    const rows=verify(graph,mission);setSuite(rows);const next=award(story,rows);setStory(next)
    if(next.scene==='reward'){setScene('reward');sound('success',story.volume);const sim=new LogicSimulation(mission.initial,mission.mode);sim.step(graph,{...DEFAULT_INPUTS,power:true});sim.step(graph,DEFAULT_INPUTS);setSnapshot(sim.step(graph,{...DEFAULT_INPUTS,power:true}))}
    else{const failed=rows.find(r=>!r.pass);setResult(failed);if(failed)setSnapshot(failed.actual);sound('oops',story.volume)}
  }
  const exportSave=()=>{const url=URL.createObjectURL(new Blob([JSON.stringify(story,null,2)],{type:'application/json'}));const a=document.createElement('a');a.href=url;a.download='꼬마차-정비소-진행.json';a.click();URL.revokeObjectURL(url)}
  const importSave=async(e:ChangeEvent<HTMLInputElement>)=>{
    const file=e.target.files?.[0];if(!file)return
    try{if(file.size>3_000_000)throw new Error('size');const raw=await file.text();const read=readStory({getItem:()=>raw,setItem:()=>{}});if(!read.story)throw new Error('shape');setStory(read.story);setStarted(true);setScene('title');setPaused(false);setNotice('진행 기록을 불러왔어요. 이어하기를 눌러 주세요.')}catch{setNotice('진행 파일을 읽지 못했어요. 현재 기록은 유지됩니다.')}
    e.target.value=''
  }
  const observeDone=story.mission===0?snapshot.outputs.request===true:snapshot.state==='READY'
  const title=scene==='title'
  const trialSample=mission.scenarios.find(s=>s.id===trial)?.steps.find(s=>s.inputs.power)??mission.scenarios.find(s=>s.id===trial)?.steps[0]
  return <div className={`game scene-${scene} ${story.reducedMotion?'reduce-motion':''} ${paused?'is-paused':''}`} onClick={e=>{if((e.target as Element).closest('button'))sound('tap',story.volume)}}>
    <WorldBackdrop scene={scene==='intro'&&intro===2?'fault':scene} reduced={story.reducedMotion||paused}/><ClickFeedback/>
    {scene==='reward'&&<section className="reward-drive-panel"><header>{story.mission===0?'진입 요청은 완성! 실제 구동은 다음 장에서.':'내가 만든 READY가 차량 구동을 허용해요. 방향키로 확인해 봐요.'}</header>{story.mission===0?<SignalBench snapshot={snapshot} brake={true} focus={-1} reduced={paused||story.reducedMotion}/>:<DriveExperience enabled={driveGate(snapshot)} cockpit={false} paused={paused} volume={story.volume}/>}</section>}
    {title?<>
      <div className="title-vignette"/><div className="title-badge">작은 정비소에서 시작하는 커다란 발견</div>
      <section className="title-menu"><div className="game-wordmark"><span>모모의</span><h1>꼬마차<br/><em>정비소</em></h1><p>Vehicle Logic Lab</p><div className="wordmark-doodle">✦ ⚙ ✦</div></div><p className="title-tagline">꼬마차 속 작은 신호를 따라,<br/>모모와 한 걸음씩 만들어 가는 모험.</p><div className="title-buttons"><button className="big-button" onClick={start}>새 모험 시작 <span>▶</span></button><button disabled={!started} onClick={()=>{setScene(story.scene==='title'?'garage':story.scene);setPaused(false)}}>모험 이어하기 <small>{started?`구동 준비 · ${done}/3`:'아직 저장된 모험이 없어요'}</small></button><button onClick={()=>setPaused(true)}>소리와 화면 설정</button></div></section><div className="garage-sign">MOMO'S GARAGE<small>오늘도 잘 부탁해!</small></div><div className="title-version">운전석에서 시작하는 · 차량 로직 모험</div>
    </>:<>
      <header className="game-hud"><button className="menu-button" aria-label="게임 메뉴" onClick={()=>setPaused(true)}>☰</button><div className="chapter-tag"><small>{scene==='intro'?'프롤로그':`이야기 ${story.mission+1}`}</small><b>{scene==='intro'?'어느 맑은 날, 시험 주행':CHAPTER_NAMES[story.mission]}</b></div><button className="journey-button" onClick={()=>go('map')}>모험 수첩 <span>{done}/3</span></button></header>
      {scene==='intro'&&<>
        {intro<2?<div className="intro-drive-shell"><DriveExperience enabled={intro===1&&driveGate(openingSnapshot())} paused={paused} reduced={story.reducedMotion} volume={story.volume} onTelemetry={setDriveSample} onDistance={distance=>{if(intro===1&&distance>=75)setIntro(2)}}/><div className="intro-progress"><span>MISSION 00 · 첫 시험 주행</span><b>{intro===0?'시선을 움직여 운전석을 둘러봐요':`75m 시험 표지까지 · ${Math.min(75,Math.floor(driveSample.distance))}m`}</b><progress max={75} value={driveSample.distance}/></div></div>:<FaultCutscene paused={paused} reduced={story.reducedMotion} volume={story.volume}/>}
        <Dialogue text={intro===0?'오늘은 꼬마차의 첫 시험 날! 페달과 기어를 내려다봐. 출발을 누르면 시동을 켜 줄게. 방향키로 직접 달려보자!':intro===1?'↑로 가속, ↓로 브레이크, ← →로 방향을 바꿔 봐. 75m 표지까지 달려보자. 바깥 시점으로 바꾸면 나도 보여!':'으앙, 꼬마차가 와르르…! 나는 무사해. 외관은 정비소에서 고치고, 차 안의 제어 프로그램은 네가 함께 만들어 줄래?'}><button className="soft-button" onClick={()=>go('arrival')}>주행 건너뛰기</button><button className="big-button" disabled={intro===1} onClick={()=>{if(intro===0){setIntro(1);sound('start',story.volume)}else go('arrival')}}>{intro===0?'시동 켜고 출발!':intro===1?'방향키로 직접 주행 중':'정비소로 가기'} →</button></Dialogue>
      </>}
      {scene==='arrival'&&<><div className="scene-caption">어서 와, 작은 엔지니어!</div><div className="arrival-card"><CatFace thinking/><h2>우리의 첫 의뢰</h2><p>꼬마차가 주행할 준비를<br/>다시 할 수 있게 도와주세요.</p><span>외관 수리: 모모 담당<br/>제어 프로그램: 나와 함께!</span></div><Dialogue text="부품 수리와 프로그램 수리는 달라. 나는 외관을 정리할게. 너는 차가 ‘주행 준비 완료’인지 판단하는 기능을 만들어 주면 돼."><button className="big-button" onClick={()=>go('garage')}>내 첫 작업 확인하기 →</button></Dialogue></>}
      {scene==='garage'&&<><div className="scene-caption">모모의 정비소 <span>오늘의 할 일 하나만, 천천히.</span></div><section className="quest-card"><span className="quest-pin">✦ 오늘의 의뢰</span><h2>{mission.title}</h2><p>{story.mission===0?'운전자가 시동을 걸고 싶을 때, 무엇을 확인해야 할까요?':story.mission===1?'버튼을 누를 때마다 차량은 자기 상태를 기억해야 해요.':'만든 기능이 엉뚱한 상황에서 켜지지 않는지 확인해요.'}</p><div className="quest-mini-path"><span>운전석</span><i>→</i><span>차 안쪽</span><i>→</i><span>작업대</span><i>→</i><span>시험</span></div><button className="big-button" onClick={()=>go('observe')}>운전석에 앉아 보기 →</button></section><button className="workbench-hotspot" onClick={()=>go('observe')}><span>✦</span>꼬마차를 살펴보자</button><Dialogue text={done===3?'세 가지 의뢰를 모두 끝냈어! 수첩에서 다시 살펴보거나 원하는 챕터를 다시 해 볼 수 있어.':'먼저 정상 동작을 직접 느껴보자. 운전석에서 시작해서, 차 안의 신호를 따라 작업대로 들어갈 거야.'}/></>}
      {scene==='observe'&&<><Cockpit snapshot={snapshot} brake={inputs.brake} system={inputs.system} onBrake={()=>toggle('brake')} onSystem={()=>toggle('system')} onPower={press} onStopped={value=>{if(value!==inputs.stopped)toggle('stopped')}} paused={paused} volume={story.volume}/><div className="lesson-ribbon"><span>1. 운전자 시점 · 정상 동작 관찰</span><b>{story.mission===0?'브레이크 조건을 켜고 START를 눌러 봐요.':'버튼을 한 번씩 눌러, OFF → STANDBY → READY를 확인해요.'}</b><small>정상 기준 로직으로 관찰 · 내 설계는 다음 작업대와 시험에서 실행해요</small></div><Dialogue text={observeDone?(story.mission===0?'진입 요청이 참이 됐네! 이번 장은 조건만 계산해서 차는 아직 못 달려. 안쪽에서는 어떻게 판단할까?':'READY가 켜졌어! 이제 D에서 ↑로 달릴 수 있어. 페달·기어를 내려다보고 움직여 봐.'):'시선을 움직여 페달과 기어를 찾아봐. 브레이크 조건과 시스템 준비를 바꾼 뒤 START를 눌러보자.'}><button className="soft-button" onClick={()=>go('garage')}>← 정비소</button><button className="big-button" disabled={!observeDone} onClick={()=>{setVisited([]);setInsideFocus(-1);go('inside')}}>차 안으로 들어가기 →</button></Dialogue></>}
      {scene==='inside'&&<><div className="lesson-ribbon"><span>2. 차 안쪽 탐험</span><b>페달에서 나온 정보는 어디로 갈까요?</b><small>① → ② → ③ 을 눌러 신호의 여행을 따라가요.</small></div><InsideVehicle snapshot={snapshot} brake={inputs.brake} visited={visited} focus={insideFocus} reduced={story.reducedMotion||paused} onBrake={()=>toggle('brake')} onInspect={i=>{setInsideFocus(i);setVisited(v=>[...new Set([...v,i])])}}/><Dialogue text={insideFocus<0?'차가 생각하는 과정을 세 부분으로 나눠 보자. 아래 페달과 입력부터 하나씩 눌러 봐.':insideNotes[insideFocus]}><button className="soft-button" onClick={()=>go('observe')}>← 운전석</button><button className="big-button" disabled={visited.length<3} onClick={()=>{setStory(s=>({...s,lesson:0}));go('build')}}>로직 작업대로 →</button></Dialogue></>}
      {scene==='build'&&<>
        {!full&&<aside className="build-preview"><RequirementBrief mission={mission}/><div className="preview-heading"><span>LIVE MODEL</span><b>내 연결 → 실제 부품 반응</b></div><SignalBench snapshot={snapshot} brake={inputs.brake} focus={labFocus} revision={graph.edges.length} reduced={story.reducedMotion||paused}/><div className="preview-controls"><button aria-pressed={inputs.brake} onClick={()=>toggle('brake')}>▥ 브레이크 {inputs.brake?'밟음':'놓음'}</button><button aria-pressed={inputs.system} onClick={()=>toggle('system')}>⚙ 시스템 {inputs.system?'준비':'대기'}</button><button onClick={press}>⏻ 시동 시험</button></div><div className="preview-readout"><i className={snapshot.outputs.ready||snapshot.outputs.request?'active':''}/><b>{snapshot.outputs.ready?'READY':snapshot.outputs.request?'진입 요청 참':'출력 대기'}</b><span>{snapshot.state} · 연결 {graph.edges.length}개</span></div></aside>}
        <div className="lesson-ribbon"><span>3. 로직 만들기 · {story.lesson+1}/{LESSONS[story.mission].length}</span><b>{lesson.title}</b><small>{lesson.why}</small></div><div className="build-tools"><button onClick={()=>setFull(v=>!v)}>{full?'지금 배우는 부분만':'전체 흐름·자유 편집'}</button><button onClick={()=>setHint(v=>!v)}>✦ {hint?'힌트 접기':'도움 받기'}</button><button onClick={()=>go('inside')}>차 안쪽 다시 보기</button></div>
        {full?<div className="full-editor"><LogicEditor graph={graph} snapshot={snapshot} allowed={mission.allowedBlocks} onChange={edit} failedNodes={result&&!result.pass?result.actual.issues.flatMap(i=>i.nodes):[]}/></div>:<GuidedBoard key={`${story.mission}-${story.lesson}`} graph={graph} lesson={lesson} snapshot={snapshot} onChange={edit} onSound={()=>sound('link',story.volume)}/>}
        {hint&&<aside className="hint-bubble">{mission.hints[Math.min(story.lesson+1,3)]}</aside>}
        <Dialogue text={hint?mission.hints[Math.min(story.lesson+1,3)]:lesson.say}><button className="soft-button" onClick={()=>story.lesson>0?setStory(s=>({...s,lesson:s.lesson-1})):go('inside')}>← 이전 단계</button>{story.lesson<LESSONS[story.mission].length-1?<button className="big-button" disabled={!lessonComplete(graph,lesson)&&!full} onClick={()=>setStory(s=>({...s,lesson:s.lesson+1}))}>다음 연결 배우기 →</button>:<button className="big-button" disabled={!lessonComplete(graph,lesson)&&!full} onClick={()=>go('test')}>테스트 담당으로 바꾸기 →</button>}</Dialogue>
      </>}
      {scene==='test'&&<>
        <div className="lesson-ribbon"><span>4. 내가 테스트 담당!</span><b>조건을 고르고, 결과를 예상하고, 직접 시험해요.</b><small>내 예상과 공식 기준, 실제 로직 결과는 따로 비교해요.</small></div>
        <div className="trial-room"><section className="trial-picker"><div className="role-badge">⌁ 검증자의 모자</div><h2>어떤 상황을 시험할까요?</h2>{requiredTrials.map(id=>{const s=mission.scenarios.find(s=>s.id===id)!;return <button key={id} className={trial===id?'selected-trial':''} onClick={()=>{setTrial(id);setPrediction(undefined);setResult(undefined)}}><span>{tested.includes(id)?'✓':'○'}</span>{s.name}</button>})}<div className="trial-visual"><SignalBench snapshot={result?.actual??{...snapshot,outputs:{}}} brake={!!trialSample?.inputs.brake} focus={result?2:0} reduced={story.reducedMotion||paused} prediction={result?undefined:prediction}/><div className="trial-visual-label">{result?'실제 출력 관찰':prediction===undefined?'조건을 고르고 결과를 예상해요':`점선 구체 = 내 예상 · ${prediction?'켜짐':'꺼짐'}`}</div></div><p>반투명 점선은 예상, 녹색 램프는 실제 출력이에요.</p></section><section className="trial-machine"><h2>{mission.scenarios.find(s=>s.id===trial)?.name??'왼쪽에서 조건을 골라 주세요.'}</h2><div className="trial-conditions">{(()=>{const sample=mission.scenarios.find(s=>s.id===trial)?.steps.find(s=>s.inputs.power)??mission.scenarios.find(s=>s.id===trial)?.steps[0];return sample&&<><span>브레이크 <b>{sample.inputs.brake?'밟음':'안 밟음'}</b></span><span>시스템 <b>{sample.inputs.system?'준비 완료':'준비 전'}</b></span><span>차량 정지 <b>{sample.inputs.stopped?'맞음':'아님'}</b></span></>})()}</div><p className="prediction-question">{story.mission===0?'진입 요청은 참이 될까요?':'시험 마지막에 READY가 켜져 있을까요?'}</p><div className="prediction-options"><button aria-pressed={prediction===true} onClick={()=>setPrediction(true)}>☀ {story.mission===0?'참':'켜짐'}</button><button aria-pressed={prediction===false} onClick={()=>setPrediction(false)}>☁ {story.mission===0?'거짓':'꺼짐'}</button></div><button className="big-button run-trial" disabled={prediction===undefined} onClick={runTrial}>▷ 이 조건으로 시험하기</button>
          <RequirementBrief mission={mission}/>
          {result&&<TestReplay graph={graph} mission={mission} trial={result.id} run={replayRun} paused={paused} volume={story.volume}/>}
          {result&&<div className={`trial-result ${result.pass?'trial-pass':'trial-fail'}`} role="status"><b>{result.pass?'✓ 로직 동작은 기준과 같아요':'! 로직을 다시 확인해요'}</b><p>{result.message}</p><div><span>기대 상태 <strong>{STATES[result.expected.state as keyof typeof STATES]}</strong></span><span>실제 상태 <strong>{STATES[result.actual.state as keyof typeof STATES]}</strong></span></div><p>{prediction===Object.values(result.expected.outputs).some(Boolean)?'예상도 맞았어요!':'예상은 달랐어요. 공식 기대 결과를 보고 한 번 더 골라 봐요.'}</p><small>{Object.entries(result.expected.outputs).map(([key,v])=>`${key==='request'?'진입 요청':key==='ready'?'READY 표시':'구동 허용'}: 기대 ${v?'참':'거짓'} / 실제 ${result.actual.outputs[key]===undefined?'미연결':result.actual.outputs[key]?'참':'거짓'}`).join(' · ')}</small></div>}
          {suite.some(r=>!r.pass)&&<p className="suite-failure">전체 시험 중 {suite.filter(r=>!r.pass).length}개를 다시 확인해야 해요. 연결을 고친 뒤 전에 통과한 조건도 다시 시험해요.</p>}
        </section></div><Dialogue name="모모 · 지금은 테스트 담당" text={result&&!result.pass?'실패는 힌트야. 어떤 입력에서 기대와 달랐는지 보고 작업대에서 고쳐 보자.':tested.length>=requiredTrials.length?'좋아! 나머지 조건도 한꺼번에 다시 시험하자. 이 회귀 시험까지 통과해야 기능을 승인할 수 있어.':'정상 작동만 보면 놓치는 것이 있어. 켜지면 안 되는 상황도 예상하고 시험해 보자.'}><button className="soft-button" onClick={()=>go('build')}>← 연결 수정하기</button><button className="big-button" disabled={tested.length<requiredTrials.length} onClick={allTests}>전체 회귀 시험 · {tested.length}/{requiredTrials.length} →</button></Dialogue>
      </>}
      {scene==='reward'&&<><div className="reward-burst" aria-hidden="true">{Array.from({length:10},(_,i)=><span key={i} style={{'--i':i} as CSSProperties}>✦</span>)}</div><section className="reward-card"><div className="reward-stamp">✓ 검증 완료</div><h2>{story.mission===0?'첫 번째 연결, 완성!':story.mission===1?'꼬마차가 기억해요!':'꼬마차의 READY, 복구 완료!'}</h2><p>{mission.concept}</p><div className="sticker"><span>{['✦','◉','✓'][story.mission]}</span><b>{['첫 연결 엔지니어','차량의 기억 지킴이','꼼꼼한 검증 친구'][story.mission]}</b></div><span className="suite-score">{story.evidence.at(-1)?.results.filter(r=>r.pass).length}개 시험 통과 · {story.lab.grades[mission.id]===3?'추가 조건까지 확인':'필수 검증 완료'}</span><button className="big-button" onClick={()=>story.mission<2?openMission(story.mission+1):go('map')}>{story.mission<2?'다음 의뢰 받기':'모험 수첩에 기록하기'} →</button></section><Dialogue happy text={story.mission===0?'이번에는 시동을 허용할 조건을 완성했어. 다음엔 이 조건으로 실제 차량 상태를 바꿔 보자.':'반짝! 프로그램이 준비 상태를 올바르게 판단해. 외관 수리는 내가 따로 마쳤어. 함께 꼬마차를 도운 거야.'}/></>}
      {scene==='map'&&<><section className="journal"><div className="journal-title"><small>나의 모험 수첩</small><h2>작은 연결들이 모이면.</h2><p>여기서 전체 여정을 한눈에 볼 수 있어요.</p></div><div className="journal-chapters">{MISSIONS.map((m,i)=><button key={m.id} disabled={MISSIONS.slice(0,i).some(prior=>(story.lab.grades[prior.id]??0)<2)} onClick={()=>openMission(i)}><div className={`chapter-art chapter-art-${i}`}><img src={i===0?'./art/coastal-cockpit-v4.png':'./art/momo-garage-v5.png'} alt={['운전석에서 조건 발견','정비소의 꼬마차','모모와 함께 검증'][i]}/></div><span>{(story.lab.grades[m.id]??0)>=2?'✓':`0${i+1}`}</span><small>{CHAPTER_NAMES[i]}</small><b>{m.title}</b><em>{(story.lab.grades[m.id]??0)>=2?'검증 완료 · 다시 하기':'이야기 시작'}</em></button>)}</div><div className="journal-system"><span className={done===3?'feature-complete':''}>구동 준비 {done===3?'✓ 복구 완료':`${done}/3`}</span>{['가속 로직 제작','제동 로직 제작','충전','열관리'].map(x=><span key={x}>{x} · 추가 예정</span>)}</div><p className="journal-note">READY 출력은 C/WASM·Rapier 주행에 연결돼요. 가속·제동은 보존된 엔진을 사용하며 해당 로직을 직접 만드는 챕터는 추가 예정이에요.</p><button className="big-button" onClick={()=>go('garage')}>정비소로 돌아가기 →</button></section></>}
    </>}
    {notice&&<div className="game-notice" role="status">{notice}<button onClick={()=>setNotice('')}>닫기</button></div>}
    {paused&&<div className="pause-backdrop"><section className="pause-menu" role="dialog" aria-modal="true" aria-label="게임 메뉴"><CatFace/><h2>잠깐 쉬어갈까요?</h2><label>효과음 크기<input aria-label="효과음 크기" type="range" min="0" max="0.6" step="0.05" value={story.volume} onChange={e=>setStory(s=>({...s,volume:Number(e.target.value)}))}/></label><label><input type="checkbox" checked={story.reducedMotion} onChange={e=>setStory(s=>({...s,reducedMotion:e.target.checked}))}/>움직임 줄이기</label><button className="big-button" onClick={()=>setPaused(false)}>계속하기</button><button onClick={()=>{if(document.fullscreenElement)void document.exitFullscreen();else void document.documentElement.requestFullscreen().catch(()=>setNotice('Windows 게임에서는 F11로 전체 화면을 전환할 수 있어요.'))}}>전체 화면 전환</button><button onClick={exportSave}>진행 내보내기</button><button onClick={()=>fileInput.current?.click()}>진행 불러오기</button><button onClick={()=>{setScene('title');setPaused(false)}}>메인 화면으로</button><small>진행은 자동으로 저장돼요.<br/>새 모험은 이전 기록을 백업한 뒤 시작해요.</small></section></div>}
    <input type="file" hidden accept=".json,application/json" ref={fileInput} onChange={importSave}/>
  </div>
}
