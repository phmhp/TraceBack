import {assemblyParts,allAssemblyParts,chassisCables,cables,createAssembly,ecuReady} from '../workshop/assembly.ts'
import {hardwareReady as baseHardwareReady,readWorkshop,WORKSHOP_KEY} from '../workshop/model.ts'
import type {WorkshopRecord} from '../workshop/model.ts'
import {torqueFingerprint} from '../engineering/torqueModel.ts'
import type {EGraph} from '../engineering/torqueModel.ts'
import {verifyTorque} from '../engineering/torqueSpec.ts'
import {campaignReferenceGraph,expandDriveConditions} from './design.ts'
import type {RaceState} from './race.ts'
import {buildReady} from './build.ts'
import {ASSEMBLY_KITS,kitComplete} from './domains.ts'

export const CAMPAIGN_KEY='vehicle-logic-lab.momo-cup.v1'
export const STAGES=['dream','purchase','shakedown','fault','inspect','repair','principle','component','restore','puzzle','bench','grid','race','finish','garage'] as const
export const campaignHardwareReady=(record:WorkshopRecord)=>baseHardwareReady(record)&&ecuReady(record.assembly,record.cables)
const hardwareReady=campaignHardwareReady
export type Stage=typeof STAGES[number]
export type Paint='scrap'|'mint'
export type Campaign={version:1;journey?:2;kitIndex?:number;kitChecks?:string[];assemblyScope?:2;stage:Stage;record:WorkshopRecord;clue:boolean;lessons:EGraph[];bench:string;wallet:number;owned:Paint[];paint:Paint;rewarded:boolean;best:number|null;lastRace:{seconds:number;stars:number}|null}
export const LESSONS=[
 {title:'구동 요청 · 페달 신호를 목표 토크로 변환',short:'구동 요청 계산',goal:'정상 상태에서 페달 50%는 90 Nm를 요청해야 해요.',hint:'센서의 %를 요청 블록에, 요청한 Nm를 제한 블록에 이어요.',nodes:['quality','request','ceiling'],edges:[['quality','pedal','request','pedal'],['request','torque','ceiling','request']],tests:['normal-50','full','zero','cap45'],parameter:{node:'request',key:'gain',choices:[1.2,1.8,2.4],unit:'Nm/%',label:'페달 1%당 요청',correct:1.8}},
 {title:'구동 인터록 · 전진 허용 조건을 만들자',short:'구동 허용 조건',goal:'READY · D · 정상 신호일 때만 구동. 브레이크 5% 이상이면 구동 명령은 0이에요.',hint:'GearState == D와 BrakePct < 5%를 각각 비교해 참/거짓으로 만들어요. 센서 정상·READY·전진·제동 미개입, 네 조건 모두 참일 때만 AND가 허용해요. 마찰 제동을 만드는 로직은 아니에요.',nodes:['input','gearCheck','brakeCheck','permission','dynamics'],edges:[['input','gear','gearCheck','gear'],['gearCheck','forward','permission','forward'],['input','brake','brakeCheck','brake'],['brakeCheck','clear','permission','clear'],['input','ready','permission','ready'],['permission','allow','dynamics','allow']],tests:['normal-50','brake-edge','not-ready','park','delta-fault'],parameter:{node:'brakeCheck',key:'brakeAt',choices:[0,5,10],unit:'%',label:'구동 차단을 시작할 제동량',correct:5}},
 {title:'토크 명령 · 변화율을 제한해 인버터로 전달',short:'명령 동특성',goal:'20ms마다 최대 1.2 Nm씩 증가하도록 명령을 전달해요.',hint:'목표 토크 → 변화율 → 모터 명령. 초당 증가량과 20ms의 관계를 살펴봐요.',nodes:['ceiling','dynamics','command'],edges:[['ceiling','torque','dynamics','target'],['dynamics','torque','command','torque']],tests:['rise','fall','recover'],parameter:{node:'dynamics',key:'rise',choices:[30,60,90],unit:'Nm/s',label:'초당 증가 제한',correct:60}},
] as const
export function assembledRecord():WorkshopRecord{const assembly=createAssembly();for(const p of assemblyParts)assembly[p.id]='FIXED';assembly.vcu='FIXED';return{version:1,assembly,cables:[...cables.map(c=>c.id),'sensorLink'],graph:campaignReferenceGraph(),certificate:'',assisted:false}}
export function prepareLesson(graph:EGraph,index:number):EGraph{const g=expandDriveConditions(graph),lesson=LESSONS[index];if(!lesson)throw Error('Unknown lesson');g.edges=g.edges.filter(e=>!lesson.edges.some(([from,out,to,input])=>e.from===from&&e.out===out&&e.to===to&&e.in===input));const p=lesson.parameter;g.nodes.find(n=>n.id===p.node)!.parameters[p.key]=p.correct;return g}
export function newCampaign():Campaign&{edition:16}{const record=assembledRecord();for(const p of allAssemblyParts)record.assembly[p.id]='FIXED';record.cables.push(...chassisCables.map(c=>c.id));return{edition:16,version:1,journey:2,kitIndex:0,kitChecks:[],assemblyScope:2,stage:'dream',record,clue:false,lessons:[],bench:'',wallet:40,owned:[],paint:'scrap',rewarded:false,best:null,lastRace:null}}
export function buyStarter(c:Campaign):Campaign{if(c.stage!=='purchase')return c;if(c.owned.length)return{...c,stage:'shakedown'};if(c.wallet<30)return c;return{...c,wallet:c.wallet-30,owned:['scrap'],stage:'shakedown'}}
export function breakDown(c:Campaign):Campaign{if(c.stage!=='shakedown')return c;if(c.clue||c.record.assembly.battery!=='FIXED')return{...c,stage:'fault'};const r=assembledRecord();if(c.assemblyScope===2){for(const p of allAssemblyParts)r.assembly[p.id]='TRAY';r.cables=[];r.graph=prepareLesson(r.graph,0);return{...c,stage:'fault',record:r,clue:false,lessons:[],bench:''}}r.assembly.battery='TRAY';r.assembly.pedal='TRAY';r.assembly.vcu='TRAY';r.cables=['motorPower'];r.graph=prepareLesson(r.graph,0);return{...c,stage:'fault',record:r,clue:false,lessons:[],bench:''}}
export function lessonPass(graph:EGraph,index:number){const lesson=LESSONS[index];if(!lesson)return false;return verifyTorque(graph).filter(r=>(lesson.tests as readonly string[]).includes(r.id)).every(r=>r.pass)}
export function advanceLesson(c:Campaign):Campaign{const index=c.lessons.length;if(c.stage!=='puzzle'||!hardwareReady(c.record)||(!buildReady(c)&&c.journey!==2)||(c.journey===2&&(c.kitIndex!==index+3||!c.kitChecks?.includes(ASSEMBLY_KITS[index+3]?.id)||!ASSEMBLY_KITS.slice(0,index+4).every(k=>kitComplete(k,c.record.assembly))))||!lessonPass(c.record.graph,index))return c;const lessons=[...c.lessons,structuredClone(c.record.graph)];return{...c,lessons,bench:'',stage:c.journey===2?'restore':lessons.length===3?'bench':'puzzle',record:{...c.record,certificate:'',graph:lessons.length<3?prepareLesson(c.record.graph,lessons.length):c.record.graph}}}
export function approve(c:Campaign):Campaign{if(c.stage!=='bench'||c.lessons.length!==3||!hardwareReady(c.record)||!buildReady(c)||!verifyTorque(c.record.graph).every(r=>r.pass))return c;const hash=torqueFingerprint(c.record.graph);return{...c,stage:'grid',bench:hash,record:{...c.record,certificate:hash}}}
export function canRace(c:Campaign){return c.lessons.length===3&&hardwareReady(c.record)&&buildReady(c)&&c.bench===torqueFingerprint(c.record.graph)&&verifyTorque(c.record.graph).every(r=>r.pass)}
export function awardRace(c:Campaign,run:RaceState):Campaign{const seconds=run.time,stars=run.stars.filter(Boolean).length;if(c.stage!=='race'||!canRace(c)||!run.finished||run.gate!==4||run.lastZ>-160||run.missed||run.stars.length!==3||run.stars.some(v=>typeof v!=='boolean')||!Number.isFinite(seconds)||seconds<5||seconds>3600)return c;return{...c,stage:'finish',lastRace:{seconds,stars},best:c.best===null?seconds:Math.min(c.best,seconds),wallet:c.wallet+(c.rewarded?0:140+stars*10),rewarded:true}}
export function buyMint(c:Campaign):Campaign{if(c.stage!=='garage'||!c.rewarded||c.wallet<150||c.owned.includes('mint'))return c;return{...c,wallet:c.wallet-150,owned:[...c.owned,'mint'],paint:'mint'}}
export function loadCampaign(storage:{getItem:(key:string)=>string|null}):{save:Campaign;warning:string}{
 try{
  const raw=storage.getItem(CAMPAIGN_KEY);if(!raw)return{save:newCampaign(),warning:''}
  const c=JSON.parse(raw) as Campaign
  if(c.assemblyScope!==undefined&&c.assemblyScope!==2||c.version!==1||!STAGES.includes(c.stage)||!Array.isArray(c.lessons)||c.lessons.length>3||!Array.isArray(c.owned)||new Set(c.owned).size!==c.owned.length||c.owned.some(v=>!['scrap','mint'].includes(v))||!['scrap','mint'].includes(c.paint)||!Number.isInteger(c.wallet)||c.wallet<0||c.wallet>1000000||typeof c.rewarded!=='boolean'||typeof c.clue!=='boolean'||typeof c.bench!=='string'||c.best!==null&&(!Number.isFinite(c.best)||c.best<5||c.best>3600))throw Error('shape')
  if(c.lastRace!==null&&(!c.lastRace||!Number.isFinite(c.lastRace.seconds)||c.lastRace.seconds<5||c.lastRace.seconds>3600||!Number.isInteger(c.lastRace.stars)||c.lastRace.stars<0||c.lastRace.stars>3))throw Error('race record')
  const legacyEcu=c.record?.assembly?.vcu===undefined;const record=readWorkshop({getItem:k=>k===WORKSHOP_KEY?JSON.stringify(c.record):null});if(record.warning)throw Error('record');c.record=record.record;if(legacyEcu){c.record.assembly.vcu='FIXED';c.record.cables.push('sensorLink')}
  const priorApproved=c.bench===torqueFingerprint(c.record.graph)&&!!c.bench
  c.record.graph=expandDriveConditions(c.record.graph);c.lessons=c.lessons.map(expandDriveConditions)
  if(priorApproved&&verifyTorque(c.record.graph).every(r=>r.pass)){c.bench=torqueFingerprint(c.record.graph);c.record.certificate=c.bench}
  if(!c.owned.length)c.paint='scrap';else if(!c.owned.includes(c.paint))c.paint=c.owned[0]
  let valid=0;for(const graph of c.lessons){if(!lessonPass(graph,valid))break;valid++}c.lessons=c.lessons.slice(0,valid)
  if(c.bench!==torqueFingerprint(c.record.graph)||valid!==3||!verifyTorque(c.record.graph).every(r=>r.pass))c.bench=''
  if(c.journey!==undefined&&c.journey!==2||c.kitIndex!==undefined&&(!Number.isInteger(c.kitIndex)||c.kitIndex<0||c.kitIndex>5)||c.kitChecks!==undefined&&(!Array.isArray(c.kitChecks)||c.kitChecks.some(id=>!ASSEMBLY_KITS.some(k=>k.id===id))))throw Error('journey')
  if(c.journey===2){c.kitIndex??=0;c.kitChecks=[...new Set(c.kitChecks??[])].filter(id=>kitComplete(ASSEMBLY_KITS.find(k=>k.id===id)!,c.record.assembly))}
  const afterRepair=['principle','puzzle','bench','grid','race','finish','garage'].includes(c.stage)
  if(afterRepair&&(!hardwareReady(c.record)||!buildReady(c))&&!(c.journey===2&&['component','restore','puzzle','principle'].includes(c.stage))){c.stage='repair';c.bench=''}
  else if(['grid','race','finish','garage'].includes(c.stage)&&!canRace(c)){c.stage=valid<3?'puzzle':'bench'}
  else if(c.stage==='race'||c.stage==='finish'&&(!c.lastRace||!c.rewarded))c.stage='grid'
  if(c.stage==='bench'&&valid<3)c.stage='puzzle'
  if(c.stage==='puzzle'&&valid===3){c.lessons=c.lessons.slice(0,2);c.bench=''}
  return{save:c,warning:''}
 }catch{return{save:newCampaign(),warning:'이 모험의 기록을 읽지 못했어요. 이전 저장은 지우지 않았고, 기존 자유 제작실과 READY 기록도 유지돼요.'}}
}

export const STAGE_TEXT:Record<Stage,{chapter:string;title:string;goal:string}>={
 dream:{chapter:'프롤로그',title:'영화가 끝나고, 흰둥의 꿈이 시작됐다',goal:'언젠가 내 차고를 멋진 EV로 가득 채울 거야.'},
 purchase:{chapter:'첫 번째 차',title:'30냥짜리 꼬마차, 꿈은 슈퍼카',goal:'먼저 작은 차로 AI Playground 컵에 도전하자.'},
 shakedown:{chapter:'첫 시운전',title:'내 차로 달려보자!',goal:'브레이크 ON → START → D → 브레이크 OFF. 한 번씩 클릭하고 ↑로 출발해요.'},
 fault:{chapter:'첫 시운전 · 멈춰 버린 꼬마차',title:'꼬마차가 멈췄어요',goal:'흰둥는 무사해요. 충격으로 빠진 부품과 레이스용 제어 설정을 따로 복구해요.'},
 inspect:{chapter:'EP.01 · 작은 차의 반격',title:'겉이 아니라, 안에서 무슨 일이?',goal:'구동·전력·입력/ECU·제동·조향을 기능 묶음으로 살펴보고 같은 차에 조립해요.'},
 repair:{chapter:'기계·전력 복구',title:'내 손으로 다시 달릴 준비',goal:'기능 묶음을 시작하면 흰둥가 부품을 순서대로 장착해요. 같은 도식과 차량이 함께 완성됩니다.'},
 component:{chapter:'기능별 작업대',title:'방금 조립한 장치의 움직임',goal:'개별 부품을 돌려 보고 입력과 반응을 연결해요.'},
 restore:{chapter:'한 걸음 복구 완료',title:'꼬마차가 다시 살아나는 중!',goal:'완성한 기능이 같은 차량에 남아요. 다음 장치로 이어가거나 잠깐 쉬어요.'},
 principle:{chapter:'03 · 부품에서 소프트웨어로',title:'내가 고친 차는 어떻게 달릴까?',goal:'전력과 제어 신호는 달라요. 정상 구동·제동을 움직이는 차 안에서 먼저 관찰해요.'},
 puzzle:{chapter:'같은 차 · 구동 제어',title:'EV 구동 도메인 · VCU 소프트웨어',goal:'설계 참고도를 보며 왼쪽 퍼즐을 연결하고, 실행 탭에서 입력과 출력을 확인해요.'},
 bench:{chapter:'정비소 시험대',title:'구동 시스템 통합 · 내 입력으로 검증',goal:'센서 입력 → VCU 판단 → 인버터 명령 → 차량 반응. 파형과 기대값을 확인한 뒤 같은 설계로 실차 모형을 주행해요.'},
 grid:{chapter:'AI Playground 컵 · 160m 스프린트',title:'수리한 내 차로, 드디어 출전!',goal:'4개 게이트를 순서대로 통과해요. 별은 조향으로 모으는 추가 도전이에요.'},
 race:{chapter:'AI Playground 컵 · 실시간 타임어택',title:'달려, 흰둥!',goal:'↑ 가속 · ↓ 브레이크 · ←→ 조향. 기록을 줄이고 별 3개에도 도전해요.'},
 finish:{chapter:'첫 완주',title:'구닥다리가 아니라, 내가 만든 차!',goal:'정상 요구사항을 통과한 같은 설계로 실제 코스를 완주했어요.'},
 garage:{chapter:'흰둥의 차고',title:'작은 차고, 커다란 야망',goal:'완성한 구동 설계도를 간직하고, 대회 상금으로 다음 EV를 모아요.'},
}
