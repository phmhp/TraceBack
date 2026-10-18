import test from 'node:test'
import assert from 'node:assert/strict'
import { BrakeExecutionModel } from '../src/runtime/control/BrakeExecutionModel.ts'
import { SteeringExecutionModel } from '../src/runtime/control/SteeringExecutionModel.ts'
import { executeExperiment, validateExperiment } from '../src/runtime/case/CaseExperiment.ts'
import { TRACKBACK_CHASSIS_EXECUTION_CALIBRATION_V0_1 as calibration } from '../src/runtime/control/ChassisExecutionCalibration.ts'

const options=(overrides={})=>({variable:'magnitude',magnitude:.5,speed:0,direction:'FORWARD',validity:'VALID',...overrides})

test('braking execution model validates, selects and converts the request used by physics',()=>{
  const model=new BrakeExecutionModel()
  assert.equal(model.authority,'TRACKBACK_EXECUTION_MODEL')
  assert.deepEqual(model.step({driverBrakeRequest:.4,validity:'VALID'}),{selectedBrakingRequest:.4,brakeForceN:2600,state:'AVAILABLE'})
  assert.deepEqual(model.step({driverBrakeRequest:.8,validity:'INVALID'}),{selectedBrakingRequest:0,brakeForceN:0,state:'SUPPRESSED_INVALID'})
  assert.equal(model.step({driverBrakeRequest:2,validity:'VALID'}).brakeForceN,calibration.serviceBrakeMaximumForceN.value)
  model.reset();assert.equal(model.getSnapshot().brakeForceN,0)
})

test('steering execution model preserves signed input and attenuates wheel angle with speed',()=>{
  const model=new SteeringExecutionModel()
  assert.equal(model.authority,'TRACKBACK_EXECUTION_MODEL')
  assert.equal(model.step({driverSteeringRequest:.5,vehicleSpeedMps:0,validity:'VALID'}).frontWheelAngleRad,.21)
  const moving=model.step({driverSteeringRequest:-.5,vehicleSpeedMps:10,validity:'VALID'})
  assert.ok(moving.frontWheelAngleRad<0)
  assert.ok(Math.abs(moving.frontWheelAngleRad)<.21)
  assert.deepEqual(model.step({driverSteeringRequest:.5,vehicleSpeedMps:10,validity:'INVALID'}),{selectedSteeringRequest:0,frontWheelAngleRad:0,state:'SUPPRESSED_INVALID'})
})

test('braking and steering expose independently executable workbench contracts',()=>{
  const brakeOptions=options()
  validateExperiment('BrakingExecution',[.4],brakeOptions)
  assert.deepEqual(executeExperiment(null,'BrakingExecution',.4,brakeOptions),{actual:2600,expected:2600,pass:true})
  const steeringOptions=options({speed:10})
  validateExperiment('SteeringExecution',[-.5,.5],steeringOptions)
  const steering=executeExperiment(null,'SteeringExecution',-.5,steeringOptions)
  assert.equal(steering.pass,true)
  assert.ok(steering.actual<0)
  assert.throws(()=>validateExperiment('BrakingExecution',[-.1],brakeOptions))
  assert.throws(()=>validateExperiment('SteeringExecution',[-1.1],steeringOptions))
})

test('chassis calibration is disclosed as a simulation assumption, not OEM truth',()=>{
  assert.equal(calibration.provenance,'SIMULATION_ASSUMPTION')
  assert.equal(calibration.modelAuthority,'TRACKBACK_EXECUTION_MODEL')
  assert.equal(calibration.status,'REVIEW_REQUIRED')
})

