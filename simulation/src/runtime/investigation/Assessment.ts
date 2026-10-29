import type { CaseDefinition } from './CaseDefinition.ts'
import type { Evidence, EvidenceAssessment } from './Evidence.ts'
import type { ExperimentRun, IncidentFrame } from '../../runtime/case/PropulsionCase.ts'
/** Only selected, discovered artifacts count. Saturated, zero, invalid and mixed-direction samples cannot establish the ratio pattern. */
export function assessEvidence(def:CaseDefinition, selected:Evidence[], frames:readonly IncidentFrame[], runs:readonly ExperimentRun[]):EvidenceAssessment {
  const rule=def.evidenceRules
  void frames
  const ids=new Set(selected.filter(e=>e.type==='TEST_RESULT').map(e=>e.reference.runId))
  const groups=new Map<string,{input:number;ratio:number;runId:number}[]>()
  for(const run of runs){if(!ids.has(run.id)||run.testObject!==def.rootCause.location||run.options?.validity!=='VALID')continue
    for(const row of run.rows){const input=Number(row.input),expected=Number(row.expected),actual=Number(row.actual)
      if(!Number.isFinite(input)||!Number.isFinite(actual)||expected<=rule.numericTolerance||row.pass||!['FORWARD','REVERSE'].includes(row.direction))continue
      if(rule.unsaturatedOnly&&Math.abs(input-expected)>rule.numericTolerance)continue
      const key=row.direction;const samples=groups.get(key)??[];samples.push({input,ratio:actual/expected,runId:run.id});groups.set(key,samples)
    }
  }
  const pattern=[...groups.values()].find(samples=>new Set(samples.map(s=>s.input)).size>=rule.minimumInputs&&samples.every(s=>Math.abs(s.ratio-rule.expectedRatio)<=rule.ratioTolerance)&&Math.max(...samples.map(s=>s.ratio))-Math.min(...samples.map(s=>s.ratio))<=rule.ratioTolerance)
  const reasons=[]
  if(!pattern)reasons.push('같은 방향의 서로 다른 양의 비포화 입력 두 개 이상에서 반복되는 출력 비율을 확인해야 합니다. 비율 허용 차이는 0.01입니다.')
  return {sufficient:!!pattern,reasons,ratios:pattern?.map(s=>s.ratio)??[],supportingRunIds:[...new Set(pattern?.map(s=>s.runId)??[])]}
}
