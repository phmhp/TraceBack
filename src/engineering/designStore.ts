import {referenceTorqueGraph,starterTorqueGraph,torqueFingerprint} from './torqueModel.ts'
import type {EGraph} from './torqueModel.ts'
import {verifyTorque,TORQUE_SPEC} from './torqueSpec.ts'
export const DESIGN_KEY='vehicle-logic-lab.engineering.v1'
type Store={getItem:(key:string)=>string|null;setItem:(key:string,value:string)=>void}
export type DesignRecord={version:1;graph:EGraph;verified:string;assisted:boolean;spec:string}
export function newDesign():DesignRecord{return{version:1,graph:starterTorqueGraph(),verified:'',assisted:false,spec:TORQUE_SPEC.id}}
export function loadDesign(storage:Pick<Store,'getItem'>):{record:DesignRecord;warning?:string} {
 try{const raw=storage.getItem(DESIGN_KEY);if(!raw)return{record:newDesign()};const r=JSON.parse(raw) as DesignRecord,template=referenceTorqueGraph();if(r.version!==1||r.spec!==TORQUE_SPEC.id||typeof r.assisted!=='boolean'||!Array.isArray(r.graph?.nodes)||!Array.isArray(r.graph.edges)||r.graph.nodes.length!==template.nodes.length||r.graph.edges.length>120||!template.nodes.every(n=>r.graph.nodes.filter(candidate=>candidate?.id===n.id&&candidate.kind===n.kind&&typeof candidate.label==='string').length===1))throw new Error('shape');if(r.verified!==torqueFingerprint(r.graph)||!verifyTorque(r.graph).every(t=>t.pass))r.verified='';return{record:r}}
 catch{return{record:newDesign(),warning:'설계 저장을 읽지 못했어요. 편집하기 전까지 기존 원본은 덮어쓰지 않습니다.'}}
}
export function certifyDesign(record:DesignRecord):DesignRecord {return{...record,verified:verifyTorque(record.graph).every(r=>r.pass)?torqueFingerprint(record.graph):''}}
export function saveDesign(storage:Store,record:DesignRecord){const old=storage.getItem(DESIGN_KEY);if(old){try{JSON.parse(old)}catch{storage.setItem(`${DESIGN_KEY}.backup`,old)}}storage.setItem(DESIGN_KEY,JSON.stringify(record))}
