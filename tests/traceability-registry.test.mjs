import test from 'node:test'
import assert from 'node:assert/strict'
import {
  architectureNodes, getIncomingInterfaces, getInputSignals, getInterface, getOutgoingInterfaces,
  getOutputSignals, getSignalDefinition, getSignalInterfaces, interfaceEdges, signalDefinitions,
} from '../src/registries/investigation/Architecture.ts'
import {
  benchTarget, getRequirement, getRequirementsForComponent, getTestCase, getTestsForRequirement,
  reconcileInvestigationSelection, requirementDefinitions, resolveCaseSubgraph, resolveInvestigationSelection, testCaseDefinitions,
  unresolvedCaseReferences,
} from '../src/registries/investigation/Trace.ts'
import { propulsionCaseDefinition } from '../src/runtime/investigation/CaseDefinition.ts'
import { initialInvestigationSession, investigationSessionReducer } from '../src/runtime/investigation/InvestigationSession.ts'

const unique = values => new Set(values).size === values.length

test('canonical architecture, signal, interface, requirement and test IDs are unique', () => {
  assert.ok(unique(architectureNodes.map(item => item.id)))
  assert.ok(unique(signalDefinitions.map(item => item.id)))
  assert.ok(unique(interfaceEdges.map(item => item.id)))
  assert.ok(unique(requirementDefinitions.map(item => item.id)))
  assert.ok(unique(testCaseDefinitions.map(item => item.id)))
})

test('signal producer, consumer and carrying-interface queries share one relationship source', () => {
  const signal=getSignalDefinition('DriveTorqueRequest')
  assert.deepEqual(signal.producerIds,['VMC'])
  assert.deepEqual(signal.consumerIds,['eDrive'])
  assert.deepEqual(getSignalInterfaces(signal.id).map(edge => edge.id),['VMC->eDrive'])
  assert.deepEqual(getOutputSignals('VMC').map(item => item.id),['DriveTorqueRequest'])
  assert.ok(getInputSignals('eDrive').some(item => item.id==='DriveTorqueRequest'))
})

test('canonical interfaces resolve valid endpoints and carried signals consistently', () => {
  for(const edge of interfaceEdges){
    assert.ok(architectureNodes.some(node=>node.id===edge.sourceId))
    assert.ok(architectureNodes.some(node=>node.id===edge.targetId))
    assert.ok(edge.signalIds.every(id=>getSignalDefinition(id)))
    assert.ok(getOutgoingInterfaces(edge.sourceId).includes(edge))
    assert.ok(getIncomingInterfaces(edge.targetId).includes(edge))
    assert.equal(getInterface(edge.id),edge)
  }
})

test('requirement allocations and requirement-to-test links resolve canonically', () => {
  for(const requirement of requirementDefinitions){
    assert.ok(architectureNodes.some(node=>node.id===requirement.allocatedComponent))
    assert.ok(getRequirementsForComponent(requirement.allocatedComponent).includes(requirement))
    assert.equal(getTestsForRequirement(requirement.id).length,requirement.linkedTestCases.length)
    assert.ok(getTestsForRequirement(requirement.id).every(tc=>tc.verifiedRequirementIds.includes(requirement.id)))
  }
  assert.equal(getRequirement('SWR-EDR-001').allocatedComponent,'eDrive')
})

test('case relevance resolves as a canonical subgraph without exposing root-cause discovery', () => {
  assert.deepEqual(unresolvedCaseReferences(propulsionCaseDefinition),{nodes:[],requirements:[],tests:[]})
  const graph=resolveCaseSubgraph(propulsionCaseDefinition)
  assert.ok(graph.containsNode('eDrive'))
  assert.ok(graph.tests.some(tc=>tc.id==='TC-PROP-NORMAL-010A'))
  assert.equal(initialInvestigationSession().discoveredFindings.length,0)
})

test('InvestigationSession IDs resolve through the canonical registries', () => {
  const selection={componentId:'VMC',signalId:'DriveTorqueRequest',interfaceId:'VMC->eDrive',requirementId:'SWR-VMC-001',testCaseId:'TC-PROP-NORMAL-009'}
  const resolved=resolveInvestigationSelection(selection)
  assert.equal(resolved.component.id,selection.componentId)
  assert.equal(resolved.signal.id,selection.signalId)
  assert.equal(resolved.interface.id,selection.interfaceId)
  assert.equal(resolved.requirement.id,selection.requirementId)
  assert.equal(resolved.testCase.id,selection.testCaseId)
})

test('requirement-to-TC navigation preserves the chosen Page 3 test ID', () => {
  let state=initialInvestigationSession()
  state=investigationSessionReducer(state,{type:'NAVIGATE',context:{page:3,selection:{requirementId:'SWR-EDR-001',testCaseId:'TC-PROP-NORMAL-010B'}},origin:'requirement to verification'})
  assert.equal(state.context.selection.testCaseId,'TC-PROP-NORMAL-010B')
  assert.equal(resolveInvestigationSelection(state.context.selection).testCase.id,'TC-PROP-NORMAL-010B')
})

test('reference-only tests retain identity and are never mapped to another executable target', () => {
  const reference=getTestCase('TC-PROP-NORMAL-011')
  assert.equal(reference.execution.status,'REFERENCE_ONLY')
  assert.equal(benchTarget(reference.id),null)
  const unresolvedDetail=getTestCase('TC-PROP-NORMAL-001')
  assert.equal(unresolvedDetail.execution.status,'REFERENCE_ONLY')
  assert.equal(unresolvedDetail.precondition,undefined)
})

test('shared selection clears only dependents invalid for a newly selected component', () => {
  const current={componentId:'eDrive',signalId:'DriveTorqueRequest',interfaceId:'VMC->eDrive',requirementId:'SWR-EDR-001',testCaseId:'TC-PROP-NORMAL-010A',frameIndex:12}
  const next=reconcileInvestigationSelection(current,{componentId:'GearLogic'})
  assert.deepEqual(next,{componentId:'GearLogic',signalId:undefined,interfaceId:undefined,requirementId:undefined,testCaseId:undefined,frameIndex:12})
})

test('related signal, interface and requirement retain and resolve canonical context', () => {
  let selection=reconcileInvestigationSelection(initialInvestigationSession().context.selection,{componentId:'eDrive'})
  selection=reconcileInvestigationSelection(selection,{signalId:'DriveTorqueRequest'})
  assert.equal(selection.componentId,'eDrive')
  assert.equal(selection.interfaceId,'VMC->eDrive')
  selection=reconcileInvestigationSelection(selection,{interfaceId:'VMC->eDrive'})
  assert.equal(selection.signalId,'DriveTorqueRequest')
  selection=reconcileInvestigationSelection(selection,{requirementId:'SWR-EDR-001'})
  assert.equal(selection.componentId,'eDrive')
  assert.equal(selection.signalId,'DriveTorqueRequest')
  assert.equal(selection.interfaceId,'VMC->eDrive')
})

test('direct case-path selection is not gated and cross-view Back restores selection', () => {
  let state=initialInvestigationSession()
  const direct=reconcileInvestigationSelection(state.context.selection,{componentId:'eDrive'})
  state=investigationSessionReducer(state,{type:'NAVIGATE',context:{page:2,view:'FLOW',selection:direct},origin:'direct case path'})
  const signal=reconcileInvestigationSelection(state.context.selection,{signalId:'DriveTorqueRequest'})
  state=investigationSessionReducer(state,{type:'NAVIGATE',context:{view:'SIGNALS',selection:signal},origin:'function to signal'})
  const carrying=reconcileInvestigationSelection(state.context.selection,{signalId:'DriveTorqueRequest'})
  state=investigationSessionReducer(state,{type:'NAVIGATE',context:{view:'INTERFACES',selection:carrying},origin:'signal to interface'})
  assert.equal(state.context.selection.componentId,'eDrive')
  assert.equal(state.context.selection.interfaceId,'VMC->eDrive')
  state=investigationSessionReducer(state,{type:'BACK'})
  assert.equal(state.context.view,'SIGNALS')
  assert.equal(state.context.selection.signalId,'DriveTorqueRequest')
  assert.equal(state.context.selection.componentId,'eDrive')
})

test('selected test resolves requirement and allocated component without losing identity', () => {
  const selection=reconcileInvestigationSelection(initialInvestigationSession().context.selection,{testCaseId:'TC-PROP-NORMAL-010B'})
  assert.equal(selection.testCaseId,'TC-PROP-NORMAL-010B')
  assert.equal(selection.requirementId,'SWR-EDR-001')
  assert.equal(selection.componentId,'eDrive')
})
