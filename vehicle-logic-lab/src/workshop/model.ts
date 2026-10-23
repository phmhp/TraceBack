import {assemblyParts,allCables,createAssembly,canDrive} from './assembly.ts'
import type {Assembly,CableId} from './assembly.ts'
import {referenceTorqueGraph,torqueFingerprint,validateTorqueGraph} from '../engineering/torqueModel.ts'
import type {EGraph} from '../engineering/torqueModel.ts'
import {verifyTorque,TORQUE_SPEC} from '../engineering/torqueSpec.ts'
export const WORKSHOP_KEY='vehicle-logic-lab.workshop.v1'
export const MECHANICS={ratio:7,efficiency:.9,wheelRadiusM:.425,massKg:1200} as const
export type WorkshopRecord={version:1;assembly:Assembly;cables:CableId[];graph:EGraph;certificate:string;assisted:boolean}
export function newWorkshop():WorkshopRecord{
 const graph=referenceTorqueGraph();graph.edges=graph.edges.filter(e=>!(e.from==='permission'&&e.to==='dynamics')&&!(e.from==='dynamics'&&e.to==='command'))
 graph.nodes.find(n=>n.id==='request')!.parameters.gain=1.2;graph.nodes.find(n=>n.id==='dynamics')!.parameters.rise=90
 return{version:1,assembly:createAssembly(),cables:[],graph,certificate:'',assisted:false}
}
export function readWorkshop(storage:{getItem:(key:string)=>string|null}):{record:WorkshopRecord;warning?:string}{
 try{const raw=storage.getItem(WORKSHOP_KEY);if(!raw)return{record:newWorkshop()};const r=JSON.parse(raw) as WorkshopRecord,base=newWorkshop();
 if(r.assembly&&r.assembly.vcu===undefined)r.assembly.vcu='TRAY'
 if(r.version!==1||!r.assembly||!Array.isArray(r.cables)||!Array.isArray(r.graph?.nodes)||!Array.isArray(r.graph?.edges)||![7,9].includes(r.graph.nodes.length)||r.graph.edges.length>100||Object.keys(base.assembly).some(id=>!['TRAY','SEATED','FIXED'].includes(r.assembly[id as keyof Assembly]))||base.graph.nodes.some(n=>r.graph.nodes.filter(x=>x?.id===n.id&&(x.kind===n.kind||n.id==='permission'&&x.kind==='all')).length!==1))throw Error('shape')
 if(r.graph.nodes.length===9&&(!['gearCheck','brakeCheck'].every((id,index)=>r.graph.nodes.filter(n=>n.id===id&&n.kind===(index?'brakeCompare':'gearCompare')).length===1)||r.graph.nodes.find(n=>n.id==='permission')?.kind!=='all'))throw Error('expanded shape')
 if(validateTorqueGraph(r.graph).some(i=>!i.message.includes('미연결')))throw Error('invalid model')
 r.cables=[...new Set(r.cables)].filter(id=>allCables.some(c=>c.id===id));if(r.certificate!==torqueFingerprint(r.graph)||!verifyTorque(r.graph).every(t=>t.pass))r.certificate='';return{record:r}
 }catch{return{record:newWorkshop(),warning:'이 공방의 저장을 읽지 못했어요. 기존 READY 기록은 유지됩니다.'}}
}
export const hardwareCount=(r:WorkshopRecord)=>assemblyParts.filter(p=>r.assembly[p.id]==='FIXED').length
export const hardwareReady=(r:WorkshopRecord)=>canDrive(r.assembly,r.cables)
export const certifyWorkshop=(r:WorkshopRecord):WorkshopRecord=>({...r,certificate:verifyTorque(r.graph).every(t=>t.pass)?torqueFingerprint(r.graph):''})
export const workshopComplete=(r:WorkshopRecord)=>hardwareReady(r)&&r.certificate===torqueFingerprint(r.graph)
export function workshopReport(r:WorkshopRecord){return{schema:'TRACKBACK_ASSEMBLY_CONTROL_1',spec:TORQUE_SPEC,mechanics:MECHANICS,hardware:{assembly:r.assembly,cables:r.cables},graph:r.graph,design:torqueFingerprint(r.graph),assisted:r.assisted,results:verifyTorque(r.graph),scope:{controller:'TRAINING_COMPOSED',gear:'C_WASM',plant:'RAPIER',energyModel:false,autosarRuntime:false,physicalPassAsserted:false}}}
