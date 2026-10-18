import test from 'node:test'
import assert from 'node:assert/strict'
import { FaultManagementExecutionModel } from '../src/runtime/control/FaultManagementExecutionModel.ts'

test('Trackback fault lifecycle requires repeated evidence before confirmation',()=>{
  const model=new FaultManagementExecutionModel()
  const observed=model.step({injectedFaultActive:true,interfaceComparison:'MISMATCH',recoveryObserved:false})
  assert.equal(observed.lifecycleState,'OBSERVED')
  assert.equal(observed.confirmed,false)
  const confirmed=model.step({injectedFaultActive:true,interfaceComparison:'MISMATCH',recoveryObserved:false})
  assert.equal(confirmed.lifecycleState,'CONFIRMED')
  assert.equal(confirmed.diagnosticEvent,'TRACKBACK_FAULT_CONFIRMED')
  assert.equal(confirmed.reactionRequest,'PROPULSION_INHIBIT_REQUESTED')
})

test('Trackback fault lifecycle publishes recovery without claiming an OEM DTC',()=>{
  const model=new FaultManagementExecutionModel()
  model.step({injectedFaultActive:true,interfaceComparison:'MISMATCH',recoveryObserved:false})
  model.step({injectedFaultActive:true,interfaceComparison:'MISMATCH',recoveryObserved:false})
  const recovered=model.step({injectedFaultActive:false,interfaceComparison:'MATCH',recoveryObserved:true})
  assert.equal(recovered.lifecycleState,'RECOVERED')
  assert.equal(recovered.diagnosticEvent,'TRACKBACK_FAULT_RECOVERED')
  assert.equal(recovered.recovery,'RESTORED')
  assert.equal(model.authority,'TRACKBACK_EXECUTION_MODEL')
})
