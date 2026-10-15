import type { CaseDefinition } from './CaseDefinition.ts'
import type { Evidence } from './Evidence.ts'
import type { InvestigationSessionState } from './InvestigationSession.ts'
import type { ExperimentRun, IncidentFrame } from '../case/PropulsionCase.ts'
import { assessEvidence } from './Assessment.ts'
import { architectureNode } from '../../registries/investigation/Architecture.ts'

export type GameplayClueId='PHENOMENON'|'FAULT_BOUNDARY'|'PROOF'
export type SuspectStatus='POSSIBLE'|'ELIMINATED'|'SUPPORTED'

export interface GameplayClueProgress {
  id:GameplayClueId
  label:string
  unlocked:boolean
  evidenceIds:string[]
  question:string
  guidance:string
}

export interface GameplaySuspect {id:string;label:string;status:SuspectStatus;evidenceIds:string[]}

const boundaryEvidence=(evidence:Evidence|undefined,status:'MATCH'|'MISMATCH')=>Boolean(evidence&&evidence.status===status&&['SIGNAL_COMPARISON','SIGNAL_BOUNDARY'].includes(evidence.type))

export function deriveGameplayInvestigation(session:InvestigationSessionState,evidence:readonly Evidence[],definition:CaseDefinition,frames:readonly IncidentFrame[],runs:readonly ExperimentRun[]){
  const collected=new Set(session.collectedEvidenceIds)
  const selected=evidence.filter(item=>collected.has(item.id))
  const phenomenon=selected.find(item=>item.type==='INCIDENT_FRAME')
  const normal=evidence.find(item=>item.id===session.boundarySelection.lastNormalEvidenceId)
  const abnormal=evidence.find(item=>item.id===session.boundarySelection.firstAbnormalEvidenceId)
  const normalValid=boundaryEvidence(normal,'MATCH')&&collected.has(normal!.id)
  const abnormalValid=boundaryEvidence(abnormal,'MISMATCH')&&collected.has(abnormal!.id)
  const proofAssessment=assessEvidence(definition,selected,frames,runs)
  const proofEvidenceIds=selected.filter(item=>item.type==='TEST_RESULT'&&item.details?.executionMode==='COMPONENT_MODEL_TEST').map(item=>item.id)
  const clues:GameplayClueProgress[]=[
    {id:'PHENOMENON',label:'현상',unlocked:Boolean(phenomenon),evidenceIds:phenomenon?[phenomenon.id]:[],question:'실제 차량 반응에서 무엇이 이상했나요?',guidance:'Page 1의 실제 사건 관찰을 조사 기록으로 저장하세요.'},
    {id:'FAULT_BOUNDARY',label:'경계',unlocked:normalValid&&abnormalValid,evidenceIds:[normalValid?normal!.id:'',abnormalValid?abnormal!.id:''].filter(Boolean),question:'정상 신호는 어디까지 전달됐고, 어디서 처음 달라졌나요?',guidance:'저장한 MATCH와 MISMATCH 근거를 마지막 정상·첫 이상으로 지정하세요.'},
    {id:'PROOF',label:'증명',unlocked:proofAssessment.sufficient,evidenceIds:proofAssessment.sufficient?proofEvidenceIds:[],question:'남은 후보를 구분할 수 있는 시험은 무엇인가요?',guidance:proofAssessment.reasons[0]??'서로 다른 입력의 정식 컴포넌트 근거를 저장하세요.'},
  ]
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
  return {clues,active,rootCauseUnlocked:clues.every(item=>item.unlocked),proofAssessment,suspects,normalCandidates:selected.filter(item=>boundaryEvidence(item,'MATCH')),abnormalCandidates:selected.filter(item=>boundaryEvidence(item,'MISMATCH'))}
}

export const clueHints:Record<GameplayClueId,readonly string[]>={
  PHENOMENON:['원인보다 먼저 실제 차량 반응을 확인하세요.','현상 파악의 ‘차량 반응’에서 사건 시점의 Actual을 살펴보세요.','VehicleSpeed 사건 관찰을 조사 노트에 기록하면 현상 단서를 확보할 수 있습니다.'],
  FAULT_BOUNDARY:['차량 반응에서 입력 방향으로 한 기능씩 거슬러 올라가세요.','같은 시점의 VMC 출력과 eDrive 출력을 비교해보세요.','정상으로 확인한 DriveTorqueRequest와 처음 다른 EDriveCommand 근거를 각각 경계로 지정하세요.'],
  PROOF:['남은 후보에 서로 다른 입력을 주고 결과가 반복되는지 확인하세요.','독립 Expected가 있는 컴포넌트 Workbench를 사용하세요.','eDrive의 같은 방향·서로 다른 양의 비포화 입력 결과를 정식 검증 근거로 저장하세요.'],
}

