import test from 'node:test'
import assert from 'node:assert/strict'
import { AdasExecutionModel, TRACKBACK_ADAS_CALIBRATION_V0_1 as calibration } from '../src/runtime/control/AdasExecutionModel.ts'

const lead={available:true,relativeLongitudinalDistanceM:8,relativeLateralDistanceM:0,leadSpeedMps:2,closingSpeedMps:8}

test('ADAS model observes scenario truth without controlling the car by default',()=>{
  const output=new AdasExecutionModel().step({lead,lane:{available:true,offsetM:.6,headingErrorRad:.2},demoEnabled:false})
  assert.equal(output.acc.status,'MONITORING')
  assert.equal(output.acc.driveScale,1)
  assert.equal(output.aeb.status,'MONITORING')
  assert.equal(output.aeb.brakeOverride,0)
  assert.equal(output.lka.status,'MONITORING')
  assert.equal(output.lka.steeringCorrection,0)
})

test('scenario opt-in applies deterministic Trackback ACC, AEB, and LKA demonstration behavior',()=>{
  const output=new AdasExecutionModel().step({lead,lane:{available:true,offsetM:.6,headingErrorRad:.2},demoEnabled:true})
  assert.equal(output.acc.status,'ACTIVE')
  assert.equal(output.acc.driveScale,calibration.accCloseGapDriveScale)
  assert.equal(output.aeb.status,'INTERVENING')
  assert.equal(output.aeb.brakeOverride,1)
  assert.equal(output.lka.status,'ACTIVE')
  assert.notEqual(output.lka.steeringCorrection,0)
  assert.equal(calibration.provenance,'SIMULATION_ASSUMPTION')
  assert.equal(calibration.authority,'TRACKBACK_EXECUTION_MODEL')
})
