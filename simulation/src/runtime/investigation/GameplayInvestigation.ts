import type { CaseDefinition } from './CaseDefinition.ts'
import type { Evidence } from './Evidence.ts'
import type { InvestigationSessionState } from './InvestigationSession.ts'
import type { ExperimentRun, IncidentFrame } from '../case/PropulsionCase.ts'
import { assessEvidence } from './Assessment.ts'
import { architectureNode } from '../../registries/investigation/Architecture.ts'
import { casePt001InvestigationRecipe, clueSteps, recipeForCase, type GameplayClueId } from './InvestigationRecipe.ts'

export type { GameplayClueId } from './InvestigationRecipe.ts'
export type SuspectStatus='POSSIBLE'|'ELIMINATED'|'SUPPORTED'

export interface GameplayClueProgress {
  id:GameplayClueId
  label:string
  unlocked:boolean
  evidenceIds:string[]
  question:string
  guidance:string
  recommendedTools:readonly string[]
  objectives:readonly {id:string;label:string;points:number;completed:boolean}[]
}

export interface GameplaySuspect {id:string;label:string;status:SuspectStatus;evidenceIds:string[]}

const boundaryEvidence=(evidence:Evidence|undefined,status:'MATCH'|'MISMATCH')=>Boolean(evidence&&evidence.status===status&&['SIGNAL_COMPARISON','SIGNAL_BOUNDARY'].includes(evidence.type))

export function deriveGameplayInvestigation(session:InvestigationSessionState,evidence:readonly Evidence[],definition:CaseDefinition,frames:readonly IncidentFrame[],runs:readonly ExperimentRun[]){
  const recipe=recipeForCase(definition.id)??casePt001InvestigationRecipe
  const collected=new Set(session.collectedEvidenceIds)
  const selected=evidence.filter(item=>collected.has(item.id))
  const phenomenon=selected.find(item=>item.type==='INCIDENT_FRAME')
  const normal=evidence.find(item=>item.id===session.boundarySelection.lastNormalEvidenceId)
  const abnormal=evidence.find(item=>item.id===session.boundarySelection.firstAbnormalEvidenceId)
  const normalValid=boundaryEvidence(normal,'MATCH')&&collected.has(normal!.id)
  const abnormalValid=boundaryEvidence(abnormal,'MISMATCH')&&collected.has(abnormal!.id)
  const proofAssessment=assessEvidence(definition,selected,frames,runs)
  const proofEvidenceIds=selected.filter(item=>item.type==='TEST_RESULT'&&item.details?.executionMode==='COMPONENT_MODEL_TEST').map(item=>item.id)
  const completion:Record<GameplayClueId,{unlocked:boolean;evidenceIds:string[]}>= {
    PHENOMENON:{unlocked:Boolean(phenomenon),evidenceIds:phenomenon?[phenomenon.id]:[]},
    FAULT_BOUNDARY:{unlocked:normalValid&&abnormalValid,evidenceIds:[normalValid?normal!.id:'',abnormalValid?abnormal!.id:''].filter(Boolean)},
    PROOF:{unlocked:proofAssessment.sufficient,evidenceIds:proofAssessment.sufficient?proofEvidenceIds:[]},
  }
  const objectiveCompleted=(completionKind:string)=>completionKind==='INCIDENT_EVIDENCE'?Boolean(phenomenon):completionKind==='BOUNDARY_PAIR'?normalValid&&abnormalValid:completionKind==='FORMAL_PROOF'?proofAssessment.sufficient:false
  const clues:GameplayClueProgress[]=clueSteps(recipe).map(step=>({id:step.clue,label:step.label,question:step.question,guidance:step.id==='PROOF'&&!proofAssessment.sufficient?(proofAssessment.reasons[0]??step.guidance):step.guidance,recommendedTools:step.recommendedTools,objectives:step.objectives.map(objective=>({...objective,completed:objectiveCompleted(objective.completion)})),...completion[step.clue]}))
  const active=clues.find(item=>!item.unlocked)?.id??'PROOF'
  const suspects:GameplaySuspect[]=definition.incidentPath
    .filter(id=>['SW','STATE'].includes(architectureNode(id)?.kind??''))
    .map(id=>{
      const references=selected.filter(item=>item.relatedComponent===id)
      const mismatch=references.filter(item=>item.status==='MISMATCH')
      const match=references.filter(item=>item.status==='MATCH')
      const status:SuspectStatus=proofAssessment.sufficient&&mismatch.some(item=>item.type==='TEST_RESULT')?'SUPPORTED':match.length&&!mismatch.length?'ELIMINATED':'POSSIBLE'
      return {id,label:architectureNode(id)?.label??id,status,evidenceIds:(status==='ELIMINATED'?match:mismatch).map(item=>item.id)}
    })
  const completedObjectiveIds=clueSteps(recipe).flatMap(step=>completion[step.clue].unlocked?step.objectives.map(objective=>objective.id):[])
  const baseScore=recipe.steps.flatMap(step=>step.objectives).filter(objective=>completedObjectiveIds.includes(objective.id)).reduce((sum,objective)=>sum+objective.points,0)
  const hintPenalty=Object.values(session.hintLevels).reduce<number>((sum,level)=>sum+level*recipe.score.hintLevelPenalty,0)
  const activeStep=clueSteps(recipe).find(step=>step.clue===active)!
  return {recipe,clues,active,activeStep,score:Math.max(0,baseScore-hintPenalty),completedObjectiveIds,rootCauseUnlocked:clues.every(item=>item.unlocked),proofAssessment,suspects,normalCandidates:selected.filter(item=>boundaryEvidence(item,'MATCH')),abnormalCandidates:selected.filter(item=>boundaryEvidence(item,'MISMATCH'))}
}

export const clueHints=Object.fromEntries(clueSteps(casePt001InvestigationRecipe).map(step=>[step.clue,step.hintLevels])) as unknown as Record<GameplayClueId,readonly string[]>

