import test from 'node:test'
import assert from 'node:assert/strict'
import { PropulsionSupervisionExecutionModel } from '../src/runtime/control/PropulsionSupervisionExecutionModel.ts'

test('propulsion supervision observes the live chain without inventing a deviation oracle',()=>{
  const output=new PropulsionSupervisionExecutionModel().step({propulsionRequest:{magnitude:.5,direction:'FORWARD',validity:'VALID'},driveTorqueRequest:{magnitudeNm:120,direction:'FORWARD',validity:'VALID'},eDriveCommand:{magnitudeNm:90,direction:'FORWARD',validity:'VALID'},fault:{lifecycleState:'CLEAR',detection:'NO_FAULT_EVIDENCE',confirmed:false,diagnosticEvent:'NONE',reactionRequest:'NONE',recovery:'NOT_REQUIRED'}})
  assert.equal(output.monitorStatus,'OBSERVED_ONLY')
  assert.equal(output.validityChain,'VALID')
  assert.equal(output.reaction,'NONE')
})

test('propulsion reaction remains an unapplied request and recovery follows fault lifecycle',()=>{
  const output=new PropulsionSupervisionExecutionModel().step({propulsionRequest:{magnitude:.5,direction:'FORWARD',validity:'VALID'},driveTorqueRequest:{magnitudeNm:120,direction:'FORWARD',validity:'VALID'},eDriveCommand:{magnitudeNm:90,direction:'FORWARD',validity:'VALID'},fault:{lifecycleState:'CONFIRMED',detection:'FAULT_EVIDENCE_OBSERVED',confirmed:true,diagnosticEvent:'TRACKBACK_FAULT_CONFIRMED',reactionRequest:'PROPULSION_INHIBIT_REQUESTED',recovery:'WAITING_FOR_RESTORE'}})
  assert.equal(output.reaction,'INHIBIT_REQUESTED')
  assert.equal(output.reactionApplication,'NOT_APPLIED_SAFETY_POLICY_OPEN')
  assert.equal(output.recovery,'WAITING_FOR_RESTORE')
})
