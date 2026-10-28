import test from 'node:test'
import assert from 'node:assert/strict'
import { PlatformExecutionModel } from '../src/runtime/control/PlatformExecutionModel.ts'
import { CommunicationExecutionModel } from '../src/runtime/control/CommunicationExecutionModel.ts'

test('platform model reports the actual Trackback fixed-step schedule only',()=>{
  const output=new PlatformExecutionModel().step({releaseIndex:3,scheduledTimeSeconds:2/60,actualTimeSeconds:2/60,periodSeconds:1/60,completed:true})
  assert.equal(output.taskId,'TRACKBACK_FIXED_VEHICLE_STEP')
  assert.equal(output.supervision,'ON_TIME')
  assert.equal(output.timingErrorSeconds,0)
})

test('communication model clones and delivers the eDrive command in the same tick',()=>{
  const model=new CommunicationExecutionModel(),source={magnitudeNm:90,direction:'FORWARD',validity:'VALID'}
  const output=model.step(source,.5)
  assert.equal(output.transport,'TRACKBACK_DIRECT_PORT_BUS')
  assert.equal(output.ageSeconds,0)
  assert.equal(output.freshness,'FRESH')
  assert.deepEqual(output.deliveredValue,source)
  assert.notEqual(output.deliveredValue,source)
})
