import test from 'node:test'
import assert from 'node:assert/strict'
import { DrivingEventRuntime } from '../src/runtime/gameplay/DrivingEvent.ts'
import { STOPPED_VEHICLE_AVOIDANCE_EVENT as definition } from '../src/data/gameplay/DrivingEvents.ts'

const observed=(overrides={})=>({available:true,relativeLongitudinalDistanceM:12,relativeLateralDistanceM:-1.8,leadSpeedMps:0,closingSpeedMps:4,collisionActive:false,...overrides})

test('stopped-vehicle event starts from reusable gameplay data and clears only after a physical pass',()=>{
  const event=new DrivingEventRuntime();event.configure(definition)
  assert.equal(event.getSnapshot().status,'IDLE')
  assert.deepEqual(event.start(),definition.actor)
  assert.equal(event.step(observed()).snapshot.status,'ACTIVE')
  const clear=event.step(observed({relativeLongitudinalDistanceM:-5}))
  assert.equal(clear.snapshot.status,'CLEARED')
  assert.equal(clear.removeActor,true)
  assert.equal(clear.applyPenaltySeconds,0)
})

test('real lead-vehicle contact applies the configured gameplay penalty only once',()=>{
  const event=new DrivingEventRuntime();event.configure(definition);event.start()
  const hit=event.step(observed({collisionActive:true}))
  assert.equal(hit.snapshot.status,'HIT')
  assert.equal(hit.applyPenaltySeconds,3)
  assert.equal(event.step(observed({collisionActive:true})).applyPenaltySeconds,0)
})
