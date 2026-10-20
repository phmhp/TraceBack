import type { ComponentTestTarget, ExperimentOptions } from '../case/CaseExperiment.ts'
import type { IncidentFrame } from '../case/PropulsionCase.ts'
import type { RootCauseReport } from './Evidence.ts'

export type GuidedSceneId='OBSERVE'|'DOMAIN'|'LOCALIZE'|'DISCRIMINATE'|'VERIFY'|'RESOLVE'
export type GuidedMetricId=string

export interface GuidedScopeItem {
  id:string
  label:string
  detail:string
}

export interface GuidedScopeDefinition {
  title:string
  include:readonly GuidedScopeItem[]
  defer:readonly string[]
}

export interface GuidedVisualNode {
  id:string
  label:string
  value:string
  state:'NORMAL'|'ABNORMAL'|'CONTEXT'
}

export interface GuidedVisualLayer {
  id:string
  label:string
  description:string
  nodes:readonly GuidedVisualNode[]
}

export interface GuidedObservationDefinition {
  id:string
  label:string
  metric:GuidedMetricId
  unit?:string
}

export interface GuidedChoiceDefinition {
  id:string
  label:string
  feedback:string
  correct?:boolean
}

export interface GuidedDomainDefinition {
  id:string
  label:string
  summary:string
  nodeIds:readonly string[]
  relevant:boolean
  feedback:string
}

export interface GuidedBoundaryDefinition {
  id:string
  kind:'LAST_NORMAL'|'FIRST_ABNORMAL'
  componentId:string
  signalId:string
  label:string
  question:string
  expectedMeaning:string
}

export interface GuidedHypothesisDefinition {
  id:string
  label:string
  category:'INTERNAL_LOGIC'|'INTERFACE'|'STATE_CALIBRATION'|'PHYSICAL_ENVIRONMENT'
  location:string
  prediction:string
  evidenceFit:'SUPPORTED'|'POSSIBLE'|'CONTRADICTED'
  feedback:string
  report:Omit<RootCauseReport,'evidenceIds'>
}

export interface GuidedTestPlanDefinition {
  id:string
  label:string
  rationale:string
  fixedConditions:readonly string[]
  changedInput:string
  observedOutput:string
  target:ComponentTestTarget
  first:number
  second?:number
  options:ExperimentOptions
  discriminating:boolean
}

export interface GuidedRepairDefinition {
  id:string
  label:string
  explanation:string
  variant:0|2|3
}

export interface GuidedCaseDefinition {
  caseId:string
  version:string
  driverStatement:string
  observe:{
    question:string
    context:string
    observations:readonly GuidedObservationDefinition[]
    choices:readonly GuidedChoiceDefinition[]
    expectedMetric:GuidedMetricId
    actualMetric:GuidedMetricId
    chartLabel:string
  }
  domain:{question:string;domains:readonly GuidedDomainDefinition[]}
  localize:{question:string;boundaries:readonly [GuidedBoundaryDefinition,GuidedBoundaryDefinition]}
  discriminate:{question:string;hypotheses:readonly GuidedHypothesisDefinition[];testPlans:readonly GuidedTestPlanDefinition[]}
  verify:{question:string;interpretations:readonly GuidedChoiceDefinition[]}
  resolve:{question:string;repairs:readonly GuidedRepairDefinition[]}
  scope:Record<GuidedSceneId,GuidedScopeDefinition>
  visualModel:{title:string;caption:string;layers:readonly GuidedVisualLayer[]}
  readMetric:(metricId:GuidedMetricId,frame:IncidentFrame)=>number|string|boolean
}

export function validateGuidedCase(definition:GuidedCaseDefinition){
  const problems:string[]=[]
  if(!definition.caseId)problems.push('caseId가 없습니다.')
  if(definition.observe.choices.filter(choice=>choice.correct).length!==1)problems.push('현상 선택지는 정답이 정확히 하나여야 합니다.')
  if(definition.domain.domains.filter(domain=>domain.relevant).length!==1)problems.push('관련 도메인은 정확히 하나여야 합니다.')
  if(definition.localize.boundaries[0].kind!=='LAST_NORMAL'||definition.localize.boundaries[1].kind!=='FIRST_ABNORMAL')problems.push('경계는 LAST_NORMAL → FIRST_ABNORMAL 순서여야 합니다.')
  if(!definition.discriminate.hypotheses.length)problems.push('경쟁 가설이 필요합니다.')
  if(!definition.discriminate.testPlans.some(plan=>plan.discriminating))problems.push('가설을 구별하는 시험이 하나 이상 필요합니다.')
  if(!definition.resolve.repairs.length)problems.push('수리 후보가 필요합니다.')
  for(const scene of ['OBSERVE','DOMAIN','LOCALIZE','DISCRIMINATE','VERIFY','RESOLVE'] as const){
    if(!definition.scope[scene]?.include.length)problems.push(`${scene} 확인 범위가 없습니다.`)
  }
  if(!definition.visualModel.layers.length||definition.visualModel.layers.some(layer=>!layer.nodes.length))problems.push('도메인 시각 모델에는 노드가 있는 레이어가 필요합니다.')
  if(typeof definition.readMetric!=='function')problems.push('사건 지표 reader가 필요합니다.')
  if(problems.length)throw new Error(`[${definition.caseId||'UNKNOWN'}] guided case authoring error: ${problems.join(' ')}`)
  return definition
}
