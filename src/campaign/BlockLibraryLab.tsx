import {useRef,useState} from 'react'
import {createPortal} from 'react-dom'
import {BLOCK_GROUPS,BLOCK_LABELS,executeBlock,newRuntime} from './signalBlocks'
import type {BlockConfig,BlockKind,Runtime,Signal} from './signalBlocks'
import './blockLibrary.css'

const examples:Partial<Record<BlockKind,{input:Signal[];config:BlockConfig}>>={
 from:{input:[],config:{tag:'A'}},goto:{input:[42],config:{tag:'A'}},sum:{input:[4,2],config:{signs:'+-'}},display:{input:[42],config:{}},enable:{input:[42,true],config:{}},trigger:{input:[42,true],config:{}},lookupND:{input:[5,5,5],config:{breakpoints:[[0,10],[0,10],[0,10]],table:[[[0,10],[10,20]],[[10,20],[20,30]]]}},busCreator:{input:[42,true],config:{inputKeys:['speed','ready']}},busSelector:{input:[{speed:42,ready:true}],config:{outputKeys:['speed','ready']}},product:{input:[4,2],config:{}},minMax:{input:[4,2],config:{operation:'min'}},relational:{input:[4,2],config:{operation:'>'}},saturation:{input:[1.2],config:{lower:0,upper:1}},lookup1D:{input:[5],config:{breakpoints:[[0,10]],table:[0,100]}},constant:{input:[],config:{value:1}},convert:{input:[2.8],config:{dataType:'int32'}},sqrt:{input:[9],config:{}},scope:{input:[42],config:{}},logical:{input:[true,false],config:{operation:'AND'}},delay:{input:[42],config:{delay:2,initial:0}},unitDelay:{input:[42],config:{initial:0}},memory:{input:[42],config:{initial:0}},lookup2D:{input:[5,5],config:{breakpoints:[[0,10],[0,10]],table:[[0,10],[10,20]]}},gain:{input:[4],config:{gain:2}},demux:{input:[[1,2,3]],config:{}},mux:{input:[1,2,3],config:{}},subsystem:{input:[4,2],config:{program:{blocks:[{id:'sum',kind:'sum',inputs:['u1','u2']}],outputs:['sum']}}},directLookup:{input:[1,0],config:{table:[[1,2],[3,4]]}},inport:{input:[42],config:{}},outport:{input:[42],config:{}},dataRead:{input:[],config:{tag:'A',initial:0}},dataMemory:{input:[],config:{tag:'A',initial:7}},dataWrite:{input:[42],config:{tag:'A'}},chart:{input:[1],config:{initialState:'idle',transitions:{idle:{when:1,to:'ready'}}}},ground:{input:[],config:{}},terminator:{input:[42],config:{}},abs:{input:[-4],config:{}},switch:{input:[10,true,20],config:{}},multiportSwitch:{input:[2,10,20,30],config:{indexBase:1}}
}
const docs:Partial<Record<BlockKind,string>>={
 from:'같은 태그의 Goto 신호를 읽습니다.',goto:'입력 신호를 태그에 게시합니다.',sum:'각 입력을 +/− 부호대로 더합니다.',enable:'조건이 켜진 동안 입력을 통과시키고, 꺼지면 마지막 값을 유지합니다.',trigger:'조건의 FALSE→TRUE 상승 에지에서만 입력을 갱신합니다.',lookupND:'각 축의 이웃 점 사이를 선형 보간합니다. 범위 밖은 끝값으로 제한합니다.',busCreator:'이름을 가진 신호들을 버스 객체로 묶습니다.',busSelector:'버스에서 지정한 이름의 신호를 꺼냅니다.',delay:'설정한 샘플 수만큼 값을 지연합니다.',unitDelay:'이전 샘플 값을 출력합니다.',memory:'이전 실행 틱의 값을 출력합니다.',scope:'실행 기록을 상태에 쌓습니다.',subsystem:'내부 그래프를 같은 실행기에서 평가합니다.',dataMemory:'이름이 있는 공유 값을 선언합니다.',dataRead:'이름이 있는 공유 값을 읽습니다.',dataWrite:'이름이 있는 공유 값에 씁니다.',chart:'상태별 임계 조건에 따라 상태를 전이합니다.',directLookup:'입력 정수 인덱스로 표 항목을 직접 선택합니다.'}
const show=(v:unknown)=>JSON.stringify(v,null,2)
function glyph(kind:BlockKind){
 if(kind==='gain')return <path d="M8 7 59 30 8 53Z"/>
 if(kind==='inport'||kind==='outport')return <rect x="8" y="17" width="50" height="25" rx="13"/>
 if(kind==='busCreator'||kind==='busSelector'||kind==='mux'||kind==='demux')return <path d="M25 6 31 6 31 53 25 53Z"/>
 if(kind==='goto'||kind==='from')return <path d="M8 8 50 8 59 30 50 52 8 52Z"/>
 if(kind==='display')return <><rect x="3" y="8" width="60" height="43"/><rect x="8" y="13" width="48" height="17"/></>
 if(kind==='scope')return <><rect x="8" y="7" width="50" height="46"/><rect x="15" y="14" width="36" height="27" rx="5"/></>
 if(kind==='subsystem')return <><rect x="2" y="9" width="62" height="42"/><path d="M9 30 H57"/><circle cx="11" cy="30" r="2"/><circle cx="55" cy="30" r="2"/></>
 if(kind==='lookup1D'||kind==='lookup2D'||kind==='lookupND'||kind==='directLookup')return <><rect x="8" y="5" width="50" height="50"/><path d="M14 46 H52 M14 46 V12 M16 43 Q30 39 34 25 T52 13" fill="none"/></>
 if(kind==='chart')return <><rect x="8" y="7" width="50" height="46" rx="9"/><circle cx="24" cy="25" r="5"/><circle cx="43" cy="36" r="5"/><path d="M29 27 38 33"/></>
 if(kind==='switch'||kind==='multiportSwitch')return <><rect x="8" y="7" width="50" height="46"/><path d="M13 18 H28 L48 30 M13 43 H28 L48 30 M48 30 H54" fill="none"/></>
 return <rect x="8" y="7" width="50" height="46" rx="1"/>
}
export function BlockLibraryLab({onAdd}:{onAdd?:(kind:BlockKind,config:BlockConfig,inputCount:number)=>void}){
 const [kind,setKind]=useState<BlockKind>('sum')
 const [inputText,setInputText]=useState(show(examples.sum!.input))
 const [configText,setConfigText]=useState(show(examples.sum!.config))
 const [result,setResult]=useState('실행을 누르면 한 샘플의 출력이 표시됩니다.')
 const [tick,setTick]=useState(0)
 const [open,setOpen]=useState(false)
 const [query,setQuery]=useState('')
 const runtime=useRef<Runtime>(newRuntime())
 const select=(next:BlockKind)=>{setKind(next);setInputText(show(examples[next]?.input??[]));setConfigText(show(examples[next]?.config??{}));setResult('실행을 누르면 한 샘플의 출력이 표시됩니다.');runtime.current=newRuntime();setTick(0)}
 const run=()=>{try{const input=JSON.parse(inputText) as Signal[],config=JSON.parse(configText) as BlockConfig;if(!Array.isArray(input))throw Error('입력은 JSON 배열이어야 합니다.');const value=executeBlock(kind,input,config,runtime.current,'selected');runtime.current.tick++;setTick(runtime.current.tick);setResult(show(value)??'null')}catch(e){setResult('입력 오류: '+(e instanceof Error?e.message:String(e)))}}
 const add=()=>{if(!onAdd)return;try{const inputs=JSON.parse(inputText) as Signal[],config=JSON.parse(configText) as BlockConfig;if(!Array.isArray(inputs))throw Error('입력은 배열이어야 합니다.');onAdd(kind,config,inputs.length);setOpen(false)}catch(e){setResult('입력 오류: '+String(e))}}
 const filtered=BLOCK_GROUPS.map(group=>({name:group.name,blocks:group.blocks.filter(block=>(BLOCK_LABELS[block]+' '+block).toLowerCase().includes(query.trim().toLowerCase()))})).filter(group=>group.blocks.length>0)
 return <>
  <button className="d16-library-launch" onClick={()=>setOpen(true)}>▦ 전체 블록 라이브러리 <b>39종</b><span>열기 ↗</span></button>
  {open&&createPortal(<div className="d16-library-overlay" onMouseDown={e=>{if(e.target===e.currentTarget)setOpen(false)}}>
   <section className="d16-block-lab" role="dialog" aria-modal="true" aria-label="전체 블록 라이브러리" onKeyDown={e=>{if(e.key==='Escape')setOpen(false)}}>
    <header className="d16-library-header"><div><small>블록 선택 · 실행 · 설계도에 추가</small><h2>전체 블록 라이브러리 <span>39종</span></h2></div><button onClick={()=>setOpen(false)} aria-label="블록 라이브러리 닫기">닫기 ×</button></header>
    <div className="d16-library-search"><label>블록 찾기 <input autoFocus type="search" value={query} onChange={e=>setQuery(e.target.value)} placeholder="이름 또는 종류 검색"/></label><span>{filtered.reduce((count,group)=>count+group.blocks.length,0)}개 표시</span></div>
    <div className="d16-block-lab-layout">
     <div className="d16-block-lab-palette">{filtered.length===0?<p>일치하는 블록이 없어요.</p>:filtered.map(group=><section key={group.name}><h3>{group.name}</h3><div>{group.blocks.map(block=><button key={block} aria-pressed={block===kind} onClick={()=>select(block)}><svg viewBox="0 0 66 60" aria-hidden="true">{glyph(block)}<text x="33" y="33" textAnchor="middle" dominantBaseline="middle">{block==='logical'?'AND':block==='gain'?'1':block==='sqrt'?'√u':block==='sum'?'++':block==='product'?'×':block==='constant'?'1':block==='unitDelay'?'1/z':block==='delay'?'z⁻²':block==='abs'?'|u|':block==='switch'?'>0':block==='busCreator'||block==='busSelector'||block==='mux'||block==='demux'?'':block==='from'||block==='goto'?'[A]':block==='subsystem'?'▣':block==='chart'?'↔':''}</text></svg><span>{BLOCK_LABELS[block]}</span></button>)}</div></section>)}</div>
     <div className="d16-block-lab-run"><h3>{BLOCK_LABELS[kind]}</h3><p>{docs[kind]??'설정과 입력에 따라 출력 신호를 계산합니다.'}</p><label>입력 배열<textarea spellCheck={false} value={inputText} onChange={e=>setInputText(e.target.value)}/></label><label>블록 설정<textarea spellCheck={false} value={configText} onChange={e=>setConfigText(e.target.value)}/></label><div className="d16-block-lab-actions"><button onClick={run}>한 샘플 실행</button>{onAdd&&<button className="d16-library-add" onClick={add}>설계도에 추가</button>}<button onClick={()=>select(kind)}>상태 초기화</button><span>{tick} tick</span></div><output aria-live="polite">{result}</output></div>
    </div>
   </section>
  </div>,document.body)}
 </>
}
