import test from 'node:test'
import assert from 'node:assert/strict'
import { ChassisDomainExecutionModel } from '../src/runtime/control/ChassisDomainExecutionModel.ts'

test('braking domain remains driver-only and friction-only without inventing regen',()=>{
  const output=new ChassisDomainExecutionModel().braking({driverBrakeRequest:.4,validity:'VALID',execution:{selectedBrakingRequest:.4,brakeForceN:2600,state:'AVAILABLE'},longitudinalAccelerationMps2:-1.2})
  assert.equal(output.coordinationSource,'DRIVER_ONLY')
  assert.equal(output.blendMode,'FRICTION_ONLY_TRACKBACK_MODEL')
  assert.equal(output.regenContribution,'UNAVAILABLE')
  assert.equal(output.feedbackStatus,'OBSERVED_ONLY')
})

test('steering domain remains driver-only and monitoring stays observation-only',()=>{
  const output=new ChassisDomainExecutionModel().steering({validity:'VALID',execution:{selectedSteeringRequest:.5,frontWheelAngleRad:.18,state:'AVAILABLE'},vehicleSpeedMps:8})
  assert.equal(output.coordinationSource,'DRIVER_ONLY')
  assert.equal(output.frontWheelAngleRad,.18)
  assert.equal(output.monitoringStatus,'OBSERVED_ONLY')
})
