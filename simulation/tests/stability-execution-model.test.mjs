import test from 'node:test'
import assert from 'node:assert/strict'
import { StabilityExecutionModel, TRACKBACK_STABILITY_CALIBRATION_V0_1 as calibration } from '../src/runtime/control/StabilityExecutionModel.ts'

test('stability model monitors real telemetry without changing default driving',()=>{
  const output=new StabilityExecutionModel().step({speedMps:10,maxLongitudinalSlipEstimate:.5,brakeRequest:1,driveRequest:.8,frontWheelAngleRad:.1,yawRateRadPerSecond:0,interventionEnabled:false})
  assert.equal(output.abs.status,'MONITORING')
  assert.equal(output.tcs.status,'MONITORING')
  assert.equal(output.coordination.brakeScale,1)
  assert.equal(output.coordination.driveScale,1)
  assert.equal(output.esc.intervention,'UNAVAILABLE_NO_INDIVIDUAL_WHEEL_CONTROL')
})

test('scenario opt-in enables Trackback global ABS/TCS scaling only',()=>{
  const output=new StabilityExecutionModel().step({speedMps:10,maxLongitudinalSlipEstimate:.5,brakeRequest:1,driveRequest:.8,frontWheelAngleRad:0,yawRateRadPerSecond:0,interventionEnabled:true})
  assert.equal(output.abs.status,'INTERVENING')
  assert.equal(output.tcs.status,'INTERVENING')
  assert.equal(output.coordination.brakeScale,calibration.releaseScale)
  assert.equal(calibration.provenance,'SIMULATION_ASSUMPTION')
})
