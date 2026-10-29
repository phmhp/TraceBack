import test from 'node:test'
import assert from 'node:assert/strict'
import { MotionCoordinationExecutionModel } from '../src/runtime/control/MotionCoordinationExecutionModel.ts'

test('motion coordination exposes only the policies already present in Trackback runtime',()=>{
  const output=new MotionCoordinationExecutionModel().step({propulsionRequest:.6,brakeRequest:.2,steeringRequest:-.3,driveForceN:0,brakeForceN:1300,frontWheelAngleRad:-.1,longitudinalAccelerationMps2:-.8})
  assert.equal(output.authority,'DRIVER_ONLY')
  assert.equal(output.longitudinalPolicy,'BRAKE_INPUT_INHIBITS_DRIVE_ADAPTER')
  assert.equal(output.lateralPolicy,'INDEPENDENT_MANUAL_STEERING')
  assert.deepEqual(output.allocation,{driveForceN:0,brakeForceN:1300,frontWheelAngleRad:-.1})
  assert.equal(output.monitorStatus,'OBSERVED_ONLY')
})
