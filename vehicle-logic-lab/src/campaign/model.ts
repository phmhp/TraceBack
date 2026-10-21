import {assemblyParts,cables,createAssembly,ecuReady} from '../workshop/assembly.ts'
import {hardwareReady as baseHardwareReady,readWorkshop,WORKSHOP_KEY} from '../workshop/model.ts'
import type {WorkshopRecord} from '../workshop/model.ts'
import {referenceTorqueGraph,torqueFingerprint} from '../engineering/torqueModel.ts'
import type {EGraph} from '../engineering/torqueModel.ts'
import {verifyTorque} from '../engineering/torqueSpec.ts'
import type {RaceState} from './race.ts'

export const CAMPAIGN_KEY='vehicle-logic-lab.momo-cup.v1'
export const STAGES=['dream','purchase','shakedown','fault','inspect','repair','principle','puzzle','bench','grid','race','finish','garage'] as const
export const campaignHardwareReady=(record:WorkshopRecord)=>baseHardwareReady(record)&&ecuReady(record.assembly,record.cables)
const hardwareReady=campaignHardwareReady
export type Stage=typeof STAGES[number]
export type Paint='scrap'|'mint'
export type Campaign={version:1;stage:Stage;record:WorkshopRecord;clue:boolean;lessons:EGraph[];bench:string;wallet:number;owned:Paint[];paint:Paint;rewarded:boolean;best:number|null;lastRace:{seconds:number;stars:number}|null}
export const LESSONS=[
 {title:'페달의 부탁을 전달하자',short:'페달 → 요청',goal:'정상 상태에서 페달 50%는 90 Nm를 요청해야 해요.',hint:'센서의 %를 요청 블록에, 요청한 Nm를 제한 블록에 이어요.',nodes:['quality','request','ceiling'],edges:[['quality','pedal','request','pedal'],['request','torque','ceiling','request']],tests:['normal-50','full','zero'],parameter:{node:'request',key:'gain',choices:[1.2,1.8,2.4],unit:'Nm/%',label:'페달 1%당 요청',correct:1.8}},
 {title:'멈추고 싶을 땐 힘을 끊자',short:'조건 → 허용',goal:'READY · D · 정상 신호일 때만 구동. 브레이크 5% 이상이면 구동 명령은 0이에요.',hint:'운전 상태를 AND 판단에 연결하고, 허용 결과를 구동 제어에 보내요. 구동 명령 0과 차가 즉시 멈추는 것은 달라요.',nodes:['input','permission','dynamics'],edges:[['input','ready','permission','ready'],['input','forward','permission','forward'],['input','brake','permission','brake'],['permission','allow','dynamics','allow']],tests:['brake-edge','not-ready','park'],parameter:{node:'permission',key:'brakeAt',choices:[0,5,10],unit:'%',label:'구동 차단을 시작할 제동량',correct:5}},
 {title:'툭! 대신 부드럽게 출발',short:'목표 → 명령',goal:'20ms마다 최대 1.2 Nm씩 증가하도록 명령을 전달해요.',hint:'목표 토크 → 변화율 → 모터 명령. 초당 증가량과 20ms의 관계를 살펴봐요.',nodes:['ceiling','dynamics','command'],edges:[['ceiling','torque','dynamics','target'],['dynamics','torque','command','torque']],tests:['rise','fall','recover'],parameter:{node:'dynamics',key:'rise',choices:[30,60,90],unit:'Nm/s',label:'초당 증가 제한',correct:60}},
] as const
export function assembledRecord():WorkshopRecord{const assembly=createAssembly();for(const p of assemblyParts)assembly[p.id]='FIXED';assembly.vcu='FIXED';return{version:1,assembly,cables:[...cables.map(c=>c.id),'sensorLink'],graph:referenceTorqueGraph(),certificate:'',assisted:false}}
export function prepareLesson(graph:EGraph,index:number):EGraph{const g=structuredClone(graph),lesson=LESSONS[index];if(!lesson)throw Error('Unknown lesson');g.edges=g.edges.filter(e=>!lesson.edges.some(([from,out,to,input])=>e.from===from&&e.out===out&&e.to===to&&e.in===input));const p=lesson.parameter;g.nodes.find(n=>n.id===p.node)!.parameters[p.key]=index===0?1.2:index===1?10:90;return g}
export function newCampaign():Campaign{return{version:1,stage:'dream',record:assembledRecord(),clue:false,lessons:[],bench:'',wallet:40,owned:[],paint:'scrap',rewarded:false,best:null,lastRace:null}}
export function buyStarter(c:Campaign):Campaign{if(c.stage!=='purchase'||c.owned.length||c.wallet<30)return c;return{...c,wallet:c.wallet-30,owned:['scrap'],stage:'shakedown'}}
export function breakDown(c:Campaign):Campaign{if(c.stage!=='shakedown')return c;const r=assembledRecord();r.assembly.battery='TRAY';r.assembly.pedal='TRAY';r.assembly.vcu='TRAY';r.cables=['motorPower'];r.graph=prepareLesson(r.graph,0);return{...c,stage:'fault',record:r,clue:false,lessons:[],bench:''}}
export function lessonPass(graph:EGraph,index:number){const lesson=LESSONS[index];if(!lesson)return false;return verifyTorque(graph).filter(r=>(lesson.tests as readonly string[]).includes(r.id)).every(r=>r.pass)}
export function advanceLesson(c:Campaign):Campaign{const index=c.lessons.length;if(c.stage!=='puzzle'||!hardwareReady(c.record)||!lessonPass(c.record.graph,index))return c;const lessons=[...c.lessons,structuredClone(c.record.graph)];return{...c,lessons,bench:'',stage:lessons.length===3?'bench':'puzzle',record:{...c.record,certificate:'',graph:lessons.length<3?prepareLesson(c.record.graph,lessons.length):c.record.graph}}}
export function approve(c:Campaign):Campaign{if(c.stage!=='bench'||c.lessons.length!==3||!hardwareReady(c.record)||!verifyTorque(c.record.graph).every(r=>r.pass))return c;const hash=torqueFingerprint(c.record.graph);return{...c,stage:'grid',bench:hash,record:{...c.record,certificate:hash}}}
export function canRace(c:Campaign){return c.lessons.length===3&&hardwareReady(c.record)&&c.bench===torqueFingerprint(c.record.graph)&&verifyTorque(c.record.graph).every(r=>r.pass)}
export function awardRace(c:Campaign,run:RaceState):Campaign{const seconds=run.time,stars=run.stars.filter(Boolean).length;if(c.stage!=='race'||!canRace(c)||!run.finished||run.gate!==4||run.lastZ>-160||run.missed||run.stars.length!==3||run.stars.some(v=>typeof v!=='boolean')||!Number.isFinite(seconds)||seconds<5||seconds>3600)return c;return{...c,stage:'finish',lastRace:{seconds,stars},best:c.best===null?seconds:Math.min(c.best,seconds),wallet:c.wallet+(c.rewarded?0:140+stars*10),rewarded:true}}
export function buyMint(c:Campaign):Campaign{if(c.stage!=='garage'||!c.rewarded||c.wallet<150||c.owned.includes('mint'))return c;return{...c,wallet:c.wallet-150,owned:[...c.owned,'mint'],paint:'mint'}}
export function loadCampaign(storage:{getItem:(key:string)=>string|null}):{save:Campaign;warning:string}{
 try{
  const raw=storage.getItem(CAMPAIGN_KEY);if(!raw)return{save:newCampaign(),warning:''}
  const c=JSON.parse(raw) as Campaign
  if(c.version!==1||!STAGES.includes(c.stage)||!Array.isArray(c.lessons)||c.lessons.length>3||!Array.isArray(c.owned)||new Set(c.owned).size!==c.owned.length||c.owned.some(v=>!['scrap','mint'].includes(v))||!['scrap','mint'].includes(c.paint)||!Number.isInteger(c.wallet)||c.wallet<0||c.wallet>1000000||typeof c.rewarded!=='boolean'||typeof c.clue!=='boolean'||typeof c.bench!=='string'||c.best!==null&&(!Number.isFinite(c.best)||c.best<5||c.best>3600))throw Error('shape')
  if(c.lastRace!==null&&(!c.lastRace||!Number.isFinite(c.lastRace.seconds)||c.lastRace.seconds<5||c.lastRace.seconds>3600||!Number.isInteger(c.lastRace.stars)||c.lastRace.stars<0||c.lastRace.stars>3))throw Error('race record')
  const legacyEcu=c.record?.assembly?.vcu===undefined;const record=readWorkshop({getItem:k=>k===WORKSHOP_KEY?JSON.stringify(c.record):null});if(record.warning)throw Error('record');c.record=record.record;if(legacyEcu){c.record.assembly.vcu='FIXED';c.record.cables.push('sensorLink')}
  if(!c.owned.length)c.paint='scrap';else if(!c.owned.includes(c.paint))c.paint=c.owned[0]
  let valid=0;for(const graph of c.lessons){if(!lessonPass(graph,valid))break;valid++}c.lessons=c.lessons.slice(0,valid)
  if(c.bench!==torqueFingerprint(c.record.graph)||valid!==3||!verifyTorque(c.record.graph).every(r=>r.pass))c.bench=''
  const afterRepair=['principle','puzzle','bench','grid','race','finish','garage'].includes(c.stage)
  if(afterRepair&&!hardwareReady(c.record)){c.stage='repair';c.bench=''}
  else if(['grid','race','finish','garage'].includes(c.stage)&&!canRace(c)){c.stage=valid<3?'puzzle':'bench'}
  else if(c.stage==='race'||c.stage==='finish'&&(!c.lastRace||!c.rewarded))c.stage='grid'
  if(c.stage==='bench'&&valid<3)c.stage='puzzle'
  if(c.stage==='puzzle'&&valid===3){c.lessons=c.lessons.slice(0,2);c.bench=''}
  return{save:c,warning:''}
 }catch{return{save:newCampaign(),warning:'이 모험의 기록을 읽지 못했어요. 이전 저장은 지우지 않았고, 기존 자유 제작실과 READY 기록도 유지돼요.'}}
}

export const STAGE_TEXT:Record<Stage,{chapter:string;title:string;goal:string}>={
 dream:{chapter:'프롤로그',title:'영화가 끝나고, 모모의 꿈이 시작됐다',goal:'언젠가 내 차고를 멋진 EV로 가득 채울 거야.'},
 purchase:{chapter:'첫 번째 차',title:'30냥짜리 꼬마차, 꿈은 슈퍼카',goal:'먼저 작은 차로 항구 컵에 도전하자.'},
 shakedown:{chapter:'첫 시운전',title:'내 차로 달려보자!',goal:'브레이크 유지 → START → D → 브레이크 해제. 한 번씩 클릭하고 ↑로 출발해요.'},
 fault:{chapter:'예정된 코믹 사건',title:'와르르… 싸다고 덥석 샀더니!',goal:'모모는 무사해요. 충격으로 빠진 부품과 레이스용 제어 설정을 따로 복구해요.'},
 inspect:{chapter:'EP.01 · 작은 차의 반격',title:'겉이 아니라, 안에서 무슨 일이?',goal:'배터리·가속페달 센서·VCU를 눌러 빠진 부품과 끊긴 연결을 확인해요.'},
 repair:{chapter:'기계·전력 복구',title:'내 손으로 다시 달릴 준비',goal:'배터리·센서·VCU를 놓고 고정한 뒤, 전력선과 신호선을 따로 이어요.'},
 principle:{chapter:'03 · 부품에서 소프트웨어로',title:'내가 고친 차는 어떻게 달릴까?',goal:'전력과 제어 신호는 달라요. 정상 구동·제동을 움직이는 차 안에서 먼저 관찰해요.'},
 puzzle:{chapter:'같은 차 · 구동 제어',title:'모모의 신호 길 작업대',goal:'왼쪽에서 연결하고, 오른쪽 같은 차량에서 반응을 확인해요.'},
 bench:{chapter:'정비소 시험대',title:'정말 고쳐졌는지 확인하자',goal:'정상 가속·제동 우선·신호 지연을 차례로 시험해요. 차체 위치만 관찰용으로 고정하며 바퀴 회전과 실제 속도는 물리 모델로 봐요.'},
 grid:{chapter:'항구 컵 · 160m 스프린트',title:'수리한 내 차로, 드디어 출전!',goal:'4개 게이트를 순서대로 통과해요. 별은 조향으로 모으는 추가 도전이에요.'},
 race:{chapter:'항구 컵 · 실시간 타임어택',title:'달려, 모모!',goal:'↑ 가속 · ↓ 브레이크 · ←→ 조향. 기록을 줄이고 별 3개에도 도전해요.'},
 finish:{chapter:'첫 완주',title:'구닥다리가 아니라, 내가 만든 차!',goal:'정상 요구사항을 통과한 같은 설계로 실제 코스를 완주했어요.'},
 garage:{chapter:'모모의 차고',title:'작은 차고, 커다란 야망',goal:'완성한 구동 설계도를 간직하고, 대회 상금으로 다음 EV를 모아요.'},
}
