import { propulsionRequirements, propulsionTests } from '../../data/ground-truth/PropulsionGroundTruth.ts'
export const traceRequirements = (tc:string) => propulsionRequirements.filter(r=>r.linkedTestCases.includes(tc))
export const testsForComponent = (id:string) => {
  const ids = new Set(propulsionRequirements.filter(r=>r.allocatedComponent===id).flatMap(r=>r.linkedTestCases))
  return propulsionTests.filter(t=>ids.has(t.id))
}
export function executableTest(target:'VMC'|'eDrive', direction:string) {
  return target==='VMC'?'TC-PROP-NORMAL-009':direction==='REVERSE'?'TC-PROP-NORMAL-010B':'TC-PROP-NORMAL-010A'
}
export const benchTarget = (tc:string):'VMC'|'eDrive'|null => tc==='TC-PROP-NORMAL-009'?'VMC':['TC-PROP-NORMAL-010A','TC-PROP-NORMAL-010B'].includes(tc)?'eDrive':null
