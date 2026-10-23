import {getCaseRelations,getEntity,getRelations,getEntitiesByKind} from './registry.ts'
import type {ReferenceVehicleEntityKind} from './types.ts'
export function caseKnowledgeIds(caseId:string){
  const ids=new Set([caseId,...getCaseRelations(caseId).map(r=>r.targetId)])
  for(const id of [...ids])if(getEntity(id)?.entityKind==='LOGICAL_FUNCTION')for(const relation of getRelations(id)){ids.add(relation.sourceId);ids.add(relation.targetId)}
  return ids
}
export function caseKnowledgeItems(caseId:string,kind:ReferenceVehicleEntityKind){const ids=caseKnowledgeIds(caseId);return getEntitiesByKind(kind).filter(e=>ids.has(e.id))}
