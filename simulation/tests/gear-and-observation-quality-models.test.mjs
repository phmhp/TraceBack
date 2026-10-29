import test from 'node:test'
import assert from 'node:assert/strict'
import { GearReactionExecutionModel } from '../src/runtime/control/GearReactionExecutionModel.ts'
import { RuntimeObservationQualityModel } from '../src/runtime/control/RuntimeObservationQualityModel.ts'

test('gear reaction classifies the existing C gear result without replacing it',()=>{
  const model=new GearReactionExecutionModel()
  assert.deepEqual(model.step({requestedGear:'R',actualGear:'D',requestValidity:'VALID',stateValidity:'VALID',transitionAccepted:false}),{reaction:'TRANSITION_REJECTED_RETAIN_STATE',retainedGear:'D',driverNoticeRequired:true})
  assert.equal(model.step({requestedGear:'D',actualGear:'D',requestValidity:'INVALID',stateValidity:'VALID',transitionAccepted:false}).reaction,'INVALID_REQUEST_REPORTED')
  assert.equal(model.step({requestedGear:'D',actualGear:'D',requestValidity:'VALID',stateValidity:'VALID',transitionAccepted:true}).reaction,'NONE')
})

test('runtime observation quality rejects missing physics, invalid input and non-finite values',()=>{
  const model=new RuntimeObservationQualityModel()
  assert.equal(model.step({physicsAttached:true,values:[0,1,2],driverInputValid:true}).quality,'VALID')
  assert.equal(model.step({physicsAttached:false,values:[0],driverInputValid:true}).reason,'PHYSICS_UNAVAILABLE')
  assert.equal(model.step({physicsAttached:true,values:[Number.NaN],driverInputValid:true}).reason,'NON_FINITE_VALUE')
  assert.equal(model.step({physicsAttached:true,values:[0],driverInputValid:false}).reason,'DRIVER_INPUT_INVALID')
})
