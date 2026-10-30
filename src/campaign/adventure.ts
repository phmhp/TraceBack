import {createAssembly,allAssemblyParts} from '../workshop/assembly.ts'
import type {AssemblyPartId} from '../workshop/assembly.ts'
import {assembledRecord} from './model.ts'
import type {WorkshopRecord} from '../workshop/model.ts'
import {BUILD_LINKS} from './build.ts'
import {MODEL_SPECS,ROUNDS,PLAY_MODELS,newDesigns,emptyModel,referenceModel,ports,verifyModel} from './domainTraining.ts'
import type {Designs,DGraph,LogicId} from './domainTraining.ts'
import {BLOCK_LABELS} from './signalBlocks.ts'
export const ADVENTURE_PHASES=['dream','purchase','opening','crash','base','experience','group','assemble','logic','validate','reward','integrate','seal','trial','grid','race','finishLine','finish','atlas'] as const
export type AdventurePhase=typeof ADVENTURE_PHASES[number]
export type Adventure={version:16;recovery?:string;phase:AdventurePhase;round:number;model:number;record:WorkshopRecord;designs:Designs;completed:LogicId[];groups:AssemblyPartId[];wheelPairs:number;wallet:number;checked:string;assisted:LogicId[];trialChecks:string[];bodyClosed:boolean;lastRace:{seconds:number;stars:number}|null;rewarded:boolean}
export function initialAdventure():Adventure{const record=assembledRecord();record.assembly=createAssembly();record.cables=[];const designs=newDesigns();for(const id of ['bms','start','drive'] as const)designs[id]=referenceModel(id);return{version:16,phase:'dream',round:0,model:0,record,designs,completed:[],groups:[],wheelPairs:0,wallet:40,checked:'',assisted:['bms','start','drive'],trialChecks:[],bodyClosed:false,lastRace:null,rewarded:false}}
export const modelId=(a:Adventure):LogicId=>['integrate','seal','trial','grid','race','finishLine','finish','atlas'].includes(a.phase)?'integration':PLAY_MODELS[ROUNDS[a.round].id]
export const graphStamp=(g:DGraph)=>JSON.stringify({nodes:g.nodes.map(({x:_,y:__,...n})=>n).sort((a,b)=>a.id.localeCompare(b.id)),wires:[...g.wires].sort((a,b)=>(a.to+a.port).localeCompare(b.to+b.port))})
export function editAdventure(a:Adventure,id:LogicId,g:DGraph):Adventure{if(graphStamp(g)===graphStamp(a.designs[id]))return{...a,designs:{...a.designs,[id]:g}};const i=(Object.keys(MODEL_SPECS) as LogicId[]).indexOf(id);return{...a,checked:'',trialChecks:[],record:{...a.record,certificate:''},designs:{...a.designs,[id]:g},completed:a.completed.filter(k=>(Object.keys(MODEL_SPECS) as LogicId[]).indexOf(k)<i)}}
export function assembleAdventurePart(a:Adventure,id:AssemblyPartId):Adventure{const allowed=a.phase==='base'?a.wheelPairs===0?['frontLeft','frontRight']:['rearLeft','rearRight']:a.phase==='assemble'?ROUNDS[a.round].parts:[];if(!allowed.includes(id))return a;return{...a,record:{...a.record,assembly:{...a.record.assembly,[id]:'FIXED'},certificate:''}}}
export function assembleWheelPair(a:Adventure):Adventure{if(a.phase!=='base'||a.wheelPairs>1)return a;const pair:AssemblyPartId[]=a.wheelPairs===0?['frontLeft','frontRight']:['rearLeft','rearRight'];return pair.reduce(assembleAdventurePart,a)}
export function confirmModel(a:Adventure):Adventure{const id=modelId(a),g=a.designs[id];if(!verifyModel(id,g).every(c=>c.pass))return{...a,checked:''};return{...a,checked:graphStamp(g)}}
export function completeModel(a:Adventure):Adventure{const id=modelId(a);if(a.checked!==graphStamp(a.designs[id])||!verifyModel(id,a.designs[id]).every(c=>c.pass))return a;const completed=[...new Set([...a.completed,id])];if(id==='integration'){if(!a.bodyClosed||!allAssemblyParts.every(p=>a.record.assembly[p.id]==='FIXED'))return a;return{...a,completed,phase:'trial'}}const round=ROUNDS[a.round];if(!round.parts.every(p=>a.record.assembly[p]==='FIXED'))return a;return{...a,completed,checked:'',phase:'reward',model:0}}
export function nextRound(a:Adventure):Adventure{if(a.phase!=='reward'||!a.completed.includes(PLAY_MODELS[ROUNDS[a.round].id])||!verifyModel(PLAY_MODELS[ROUNDS[a.round].id],a.designs[PLAY_MODELS[ROUNDS[a.round].id]]).every(c=>c.pass))return a;return a.round===ROUNDS.length-1?{...a,phase:'seal',checked:''}:{...a,round:a.round+1,model:0,groups:[],phase:'experience',checked:''}}
export const canEnterCup=(a:Adventure)=>a.bodyClosed&&a.trialChecks.includes('accelerate')&&a.trialChecks.includes('brake')&&a.trialChecks.includes('steer')&&allAssemblyParts.every(p=>a.record.assembly[p.id]==='FIXED')&&BUILD_LINKS.every(c=>a.record.cables.includes(c.id))&&([...Object.values(PLAY_MODELS),'integration'] as LogicId[]).every(id=>a.completed.includes(id)&&verifyModel(id,a.designs[id]).every(c=>c.pass))&&(['bms','start','drive'] as LogicId[]).every(id=>verifyModel(id,a.designs[id]).every(c=>c.pass))
const validUnits=['bool','%','°C','Nm','N','rad','ratio','gear','any']
function validGraph(g:DGraph,depth=0):boolean{
 if(depth>4||!Array.isArray(g?.nodes)||g.nodes.length>64||new Set(g.nodes.map(n=>n.id)).size!==g.nodes.length||!Array.isArray(g.wires)||g.wires.length>160)return false
 const byId=new Map(g.nodes.map(n=>[n.id,n]))
 for(const n of g.nodes){
  if(typeof n.id!=='string'||n.id.length>100||typeof n.name!=='string'||n.name.length>100||!Number.isFinite(n.x)||Math.abs(n.x)>6000||!Number.isFinite(n.y)||Math.abs(n.y)>6000||!['in','out','and','or','gain','limit','min','gearD','brakeClear','gate','subsystem','library'].includes(n.kind)||!validUnits.includes(n.unit)||n.k!==undefined&&(!Number.isFinite(n.k)||Math.abs(n.k)>10000)||['and','or'].includes(n.kind)&&n.k!==undefined&&(!Number.isInteger(n.k)||n.k<2||n.k>4)||n.kind==='limit'&&(!Number.isFinite(n.low)||!Number.isFinite(n.high)||n.low!>n.high!))return false
  if(n.kind==='library'&&(!n.libraryKind||!(n.libraryKind in BLOCK_LABELS)||!Array.isArray(n.portUnits)||n.portUnits.length>8||n.portUnits.some(unit=>!validUnits.includes(unit))||!n.config||typeof n.config!=='object'||JSON.stringify(n.config).length>10000))return false
  if(n.kind==='subsystem'&&(!n.subgraph||!validGraph(n.subgraph,depth+1)))return false
 }
 return g.wires.every(w=>typeof w.from==='string'&&typeof w.to==='string'&&Number.isInteger(w.port)&&w.port>=0&&w.port<8&&!!byId.get(w.from)&&!!byId.get(w.to)&&w.port<ports(byId.get(w.to)!).length)
}
export function loadAdventure(value:unknown):Adventure{
 const a=structuredClone(value) as Adventure
 try{
  // Preserve finished cars when new energy functions are introduced. A supplied
  // graph is marked assisted so it is never represented as player-authored work.
  if(a?.version===16&&a.designs&&!a.designs.bms){const finishedPower=a.completed?.includes('power')||a.round>0||['seal','integrate','trial','grid','race','finish','atlas'].includes(a.phase);a.designs={...a.designs,bms:finishedPower?referenceModel('bms'):emptyModel('bms')};if(finishedPower){a.completed=['bms',...a.completed];a.assisted=['bms',...a.assisted]}}
  if(a?.version===16&&a.designs&&!a.designs.start){const finishedPower=a.completed?.includes('power')||a.round>0||['seal','integrate','trial','grid','race','finish','atlas'].includes(a.phase);a.designs={...a.designs,start:finishedPower?referenceModel('start'):emptyModel('start')};if(finishedPower){a.completed=['start',...a.completed];a.assisted=['start',...a.assisted]}}
  const ids=Object.keys(MODEL_SPECS) as LogicId[]
  if(a?.version===16&&Number.isInteger(a.round)&&a.round>=0&&a.round<ROUNDS.length){a.model=0;for(const id of ['bms','start','drive'] as const){if(!a.designs?.[id]||a.designs[id].nodes.length===MODEL_SPECS[id].inputs.length+MODEL_SPECS[id].outputs.length){a.designs[id]=referenceModel(id);a.assisted=[...new Set([...(a.assisted??[]),id])]}}}
  if(a.version!==16||!ADVENTURE_PHASES.includes(a.phase)||!Number.isInteger(a.round)||a.round<0||a.round>3||!Number.isInteger(a.model)||a.model!==0||!Number.isInteger(a.wheelPairs)||a.wheelPairs<0||a.wheelPairs>2||!Number.isInteger(a.wallet)||a.wallet<0||a.wallet>1000000000||!Array.isArray(a.completed)||a.completed.some(id=>!ids.includes(id))||!Array.isArray(a.groups)||a.groups.some(id=>!allAssemblyParts.some(p=>p.id===id))||!Array.isArray(a.trialChecks)||a.trialChecks.some(id=>!['accelerate','brake','steer'].includes(id))||!Array.isArray(a.assisted)||a.assisted.some(id=>!ids.includes(id))||!a.record?.assembly||allAssemblyParts.some(p=>!['TRAY','SEATED','FIXED'].includes(a.record.assembly[p.id]))||!Array.isArray(a.record.cables)||a.record.cables.some(id=>!BUILD_LINKS.some(c=>c.id===id))||typeof a.bodyClosed!=='boolean'||typeof a.rewarded!=='boolean'||!a.designs)throw Error('shape')
  for(const id of ids)if(!validGraph(a.designs[id]))throw Error('graph')
  a.completed=[...new Set(a.completed)].filter(id=>verifyModel(id,a.designs[id]).every(c=>c.pass))
  if(['logic','validate'].includes(a.phase)&&a.completed.includes(PLAY_MODELS[ROUNDS[a.round].id])){a.phase='reward';a.checked=''}
  if(a.checked!==graphStamp(a.designs[modelId(a)])||!verifyModel(modelId(a),a.designs[modelId(a)]).every(c=>c.pass))a.checked=''
  if(a.lastRace!==null&&(!Number.isFinite(a.lastRace?.seconds)||a.lastRace.seconds<5||a.lastRace.seconds>3600||!Number.isInteger(a.lastRace.stars)||a.lastRace.stars<0||a.lastRace.stars>3))throw Error('race')
  if(['grid','race','finishLine','finish','atlas'].includes(a.phase)&&!canEnterCup(a))return{...a,phase:'integrate',checked:''}
  if(a.phase==='race')return{...a,phase:'grid'}
  if(a.phase==='reward'&&!a.completed.includes(PLAY_MODELS[ROUNDS[a.round].id]))return{...a,phase:'logic',model:0,checked:''}
  return a
 }catch{return {...initialAdventure(),recovery:'진행 기록 일부를 읽지 못했어요. 원본을 별도 보관한 뒤 새 모험을 저장합니다.'}}
}
