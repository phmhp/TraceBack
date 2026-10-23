import test from 'node:test'
import assert from 'node:assert/strict'
import { OccupantProtectionExecutionModel } from '../src/runtime/control/OccupantProtectionExecutionModel.ts'

test('occupant demo stays disabled by default even when a real collision is observed',()=>{
  const output=new OccupantProtectionExecutionModel().step({active:true,contactPairCount:1,contactPointCount:2,maximumNormalImpulseNs:120},false)
  assert.equal(output.impactObservation,'NON_GROUND_CONTACT_OBSERVED')
  assert.equal(output.decision,'DEMO_DISABLED')
  assert.equal(output.deployCommand,'NONE')
})

test('opt-in occupant demo creates only a non-physical Trackback restraint command',()=>{
  const output=new OccupantProtectionExecutionModel().step({active:true,contactPairCount:1,contactPointCount:2,maximumNormalImpulseNs:120},true)
  assert.equal(output.decision,'TRACKBACK_DEMO_DEPLOY_REQUESTED')
  assert.equal(output.deployCommand,'TRACKBACK_DEMO_RESTRAINT_COMMAND')
  assert.equal(output.physicalRestraintModel,'NOT_IMPLEMENTED')
})
