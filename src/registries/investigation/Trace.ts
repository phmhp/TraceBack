import { propulsionRequirements, propulsionTests } from '../../data/ground-truth/PropulsionGroundTruth.ts'
import { getArchitectureNode, getInterface, getSignalDefinition } from './Architecture.ts'
import type { CaseDefinition } from '../../runtime/investigation/CaseDefinition.ts'
import type { InvestigationSelection } from '../../runtime/investigation/InvestigationSession.ts'

export type TestExecution =
  | { status:'EXECUTABLE'; runner:'COMPONENT_C_WASM'; target:'VMC'|'eDrive'; direction?:'FORWARD'|'REVERSE' }
  | { status:'REFERENCE_ONLY' }

export interface CanonicalTestCaseDefinition {
  id:string
  verificationLevel?:string
  testObject?:string
  precondition?:string
  stimulus?:string
  observation?:string
  expectedResult?:string
  verifiedRequirementIds:string[]
  execution:TestExecution
}

const executionByTestId:Record<string,TestExecution> = {
  'TC-PROP-NORMAL-009':{status:'EXECUTABLE',runner:'COMPONENT_C_WASM',target:'VMC'},
  'TC-PROP-NORMAL-010A':{status:'EXECUTABLE',runner:'COMPONENT_C_WASM',target:'eDrive',direction:'FORWARD'},
  'TC-PROP-NORMAL-010B':{status:'EXECUTABLE',runner:'COMPONENT_C_WASM',target:'eDrive',direction:'REVERSE'},
}

export const requirementDefinitions = propulsionRequirements
const referencedTestIds=[...new Set(requirementDefinitions.flatMap(requirement => requirement.linkedTestCases))]
export const testCaseDefinitions:CanonicalTestCaseDefinition[] = referencedTestIds.map(id => {
  const test=propulsionTests.find(candidate => candidate.id===id)
  return {
    ...(test ?? {id}), id,
    verifiedRequirementIds:requirementDefinitions.filter(requirement => requirement.linkedTestCases.includes(id)).map(requirement => requirement.id),
    execution:executionByTestId[id] ?? {status:'REFERENCE_ONLY'},
  }
})

export const getRequirement = (id:string) => requirementDefinitions.find(requirement => requirement.id === id)
export const getTestCase = (id:string) => testCaseDefinitions.find(test => test.id === id)
export const getRequirementsForComponent = (id:string) => requirementDefinitions.filter(requirement => requirement.allocatedComponent === id)
export const getLinkedRequirements = (id:string) => {
  const requirement=getRequirement(id);if(!requirement)return []
  return requirementDefinitions.filter(candidate => requirement.linkedRequirements.includes(candidate.id) || candidate.linkedRequirements.includes(id))
}
export const getParentRequirement = (id:string) => {
  const requirement=getRequirement(id);if(!requirement)return undefined
  return getLinkedRequirements(id).find(candidate => candidate.level === 'SYSTEM' && requirement.level === 'SOFTWARE')
}
export const getTestsForRequirement = (id:string) => {
  const requirement=getRequirement(id);if(!requirement)return []
  return requirement.linkedTestCases.map(getTestCase).filter((test):test is CanonicalTestCaseDefinition => Boolean(test))
}
export const traceRequirements = (testCaseId:string) => {
  const test=getTestCase(testCaseId);if(!test)return []
  return test.verifiedRequirementIds.map(getRequirement).filter((requirement):requirement is NonNullable<ReturnType<typeof getRequirement>> => Boolean(requirement))
}
export const testsForComponent = (id:string) => {
  const ids=new Set(getRequirementsForComponent(id).flatMap(requirement => requirement.linkedTestCases))
  return testCaseDefinitions.filter(test => ids.has(test.id))
}
export const executableTest = (target:'VMC'|'eDrive',direction:string) => target==='VMC'?'TC-PROP-NORMAL-009':direction==='REVERSE'?'TC-PROP-NORMAL-010B':'TC-PROP-NORMAL-010A'
export const benchTarget = (testCaseId:string):'VMC'|'eDrive'|null => {
  const execution=getTestCase(testCaseId)?.execution
  return execution?.status==='EXECUTABLE'?execution.target:null
}

export function resolveInvestigationSelection(selection:{componentId?:string;signalId?:string;interfaceId?:string;requirementId?:string;testCaseId?:string}) {
  return {
    component:selection.componentId?getArchitectureNode(selection.componentId):undefined,
    signal:selection.signalId?getSignalDefinition(selection.signalId):undefined,
    interface:selection.interfaceId?getInterface(selection.interfaceId):undefined,
    requirement:selection.requirementId?getRequirement(selection.requirementId):undefined,
    testCase:selection.testCaseId?getTestCase(selection.testCaseId):undefined,
  }
}

const ownsSignal = (componentId:string|undefined, signalId:string|undefined) => {
  if(!componentId || !signalId)return false
  const signal=getSignalDefinition(signalId)
  return Boolean(signal && [...signal.producerIds,...signal.consumerIds].includes(componentId))
}
const touchesInterface = (componentId:string|undefined, interfaceId:string|undefined) => {
  if(!componentId || !interfaceId)return false
  const edge=getInterface(interfaceId)
  return Boolean(edge && (edge.sourceId===componentId || edge.targetId===componentId))
}
const allocatedTo = (componentId:string|undefined, requirementId:string|undefined) =>
  Boolean(componentId && requirementId && getRequirement(requirementId)?.allocatedComponent===componentId)

/**
 * Shared Page 2 selection policy.
 * - Component anchors keep only signals, interfaces and requirements related to that component.
 * - Signal anchors preserve a related component and resolve their carrying interface.
 * - Interface anchors preserve an endpoint component and one signal carried by the edge.
 * - Requirement anchors resolve their allocated component and retain only context related to it.
 * - Test anchors keep a verified requirement (preferring its executable target) and allocation.
 * Frame selection is independent. No selection is gated by visit order or discovery state.
 */
export function reconcileInvestigationSelection(current:InvestigationSelection, patch:Partial<InvestigationSelection>):InvestigationSelection {
  const next={...current,...patch}
  const has=(key:keyof InvestigationSelection)=>Object.prototype.hasOwnProperty.call(patch,key)

  if(has('componentId') && patch.componentId){
    const componentId=patch.componentId
    if(!ownsSignal(componentId,next.signalId))next.signalId=undefined
    if(!touchesInterface(componentId,next.interfaceId))next.interfaceId=undefined
    if(!allocatedTo(componentId,next.requirementId))next.requirementId=undefined
    if(next.testCaseId && !next.requirementId)next.testCaseId=undefined
  }else if(has('signalId') && patch.signalId){
    const signal=getSignalDefinition(patch.signalId)
    if(signal){
      if(!ownsSignal(next.componentId,signal.id))next.componentId=signal.producerIds[0] ?? signal.consumerIds[0]
      if(!signal.interfaceIds.includes(next.interfaceId ?? ''))next.interfaceId=signal.interfaceIds[0]
      if(!allocatedTo(next.componentId,next.requirementId))next.requirementId=undefined
      if(next.testCaseId && !next.requirementId)next.testCaseId=undefined
    }
  }else if(has('interfaceId') && patch.interfaceId){
    const edge=getInterface(patch.interfaceId)
    if(edge){
      if(next.componentId!==edge.sourceId && next.componentId!==edge.targetId)next.componentId=edge.sourceId
      if(!edge.signalIds.includes(next.signalId ?? ''))next.signalId=edge.signalIds[0]
      if(!allocatedTo(next.componentId,next.requirementId))next.requirementId=undefined
      if(next.testCaseId && !next.requirementId)next.testCaseId=undefined
    }
  }else if(has('requirementId') && patch.requirementId){
    const requirement=getRequirement(patch.requirementId)
    if(requirement){
      next.componentId=requirement.allocatedComponent
      if(!ownsSignal(next.componentId,next.signalId))next.signalId=undefined
      if(!touchesInterface(next.componentId,next.interfaceId))next.interfaceId=undefined
      if(next.testCaseId && !requirement.linkedTestCases.includes(next.testCaseId))next.testCaseId=undefined
    }
  }else if(has('testCaseId') && patch.testCaseId){
    const test=getTestCase(patch.testCaseId)
    if(test){
      const executionTarget=test.execution.status==='EXECUTABLE'?test.execution.target:undefined
      const targetRequirement=executionTarget
        ? test.verifiedRequirementIds.map(getRequirement).find(requirement=>requirement?.allocatedComponent===executionTarget)?.id
        : undefined
      const requirementId=test.verifiedRequirementIds.includes(next.requirementId ?? '')?next.requirementId:targetRequirement ?? test.verifiedRequirementIds[0]
      next.requirementId=requirementId
      const requirement=requirementId?getRequirement(requirementId):undefined
      if(requirement)next.componentId=requirement.allocatedComponent
      if(!ownsSignal(next.componentId,next.signalId))next.signalId=undefined
      if(!touchesInterface(next.componentId,next.interfaceId))next.interfaceId=undefined
    }
  }
  return next
}

export function unresolvedCaseReferences(definition:CaseDefinition) {
  return {
    nodes:definition.incidentPath.filter(id => !getArchitectureNode(id)),
    requirements:definition.relatedRequirements.filter(id => !getRequirement(id)),
    tests:definition.relatedTestCases.filter(id => !getTestCase(id)),
  }
}

export function resolveCaseSubgraph(definition:CaseDefinition) {
  const nodes=definition.incidentPath.map(getArchitectureNode).filter((node):node is NonNullable<ReturnType<typeof getArchitectureNode>> => Boolean(node))
  const nodeIds=new Set(nodes.map(node => node.id))
  const interfaces=definition.incidentPath.slice(0,-1).map((sourceId,index) => getInterface(`${sourceId}->${definition.incidentPath[index+1]}`)).filter((edge):edge is NonNullable<ReturnType<typeof getInterface>> => Boolean(edge))
  return {
    nodes,
    signals:[...new Set(interfaces.flatMap(edge => edge.signalIds))].map(getSignalDefinition).filter((signal):signal is NonNullable<ReturnType<typeof getSignalDefinition>> => Boolean(signal)),
    interfaces,
    requirements:definition.relatedRequirements.map(getRequirement).filter((requirement):requirement is NonNullable<ReturnType<typeof getRequirement>> => Boolean(requirement)),
    tests:definition.relatedTestCases.map(getTestCase).filter((test):test is CanonicalTestCaseDefinition => Boolean(test)),
    containsNode:(id:string)=>nodeIds.has(id),
  }
}
