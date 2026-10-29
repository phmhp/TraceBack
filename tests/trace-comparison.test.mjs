import test from 'node:test'
import assert from 'node:assert/strict'
import {emptyModel,executeVehicle,providedDesigns} from '../src/campaign/domainTraining.ts'
import {firstBoundaryDifference} from '../src/campaign/traceComparison.ts'

const input={ready:true,pack:true,pedal:50,brake:0,gear:'D',steer:.5,cap:180}

test('behaviorally correct drive has no false first boundary difference',()=>{
 assert.equal(firstBoundaryDifference(input,executeVehicle(providedDesigns(),input)),null)
})

test('first difference names the upstream functional boundary, not a block shape',()=>{
 const designs=providedDesigns();designs.power=emptyModel('power')
 const difference=firstBoundaryDifference(input,executeVehicle(designs,input))
 assert.equal(difference.model,'power')
 assert.equal(difference.signal,'enable')
 assert.equal(difference.expected,true)
 assert.equal(difference.actual,false)
})

test('START permission is the first boundary when the authored precharge request is missing',()=>{
 const request={...input,ready:false,gear:'P',brake:100,pedal:0,startEdge:true,plugged:false}
 const designs=providedDesigns();designs.start=emptyModel('start')
 const difference=firstBoundaryDifference(request,executeVehicle(designs,request))
 assert.equal(difference.model,'start')
 assert.equal(difference.signal,'startPermit')
 assert.equal(difference.expected,true)
 assert.equal(difference.actual,false)
})

test('brake and steering differences remain observable when drive is inhibited',()=>{
 const designs=providedDesigns();designs.brake=emptyModel('brake')
 const braking={...input,brake:50}
 const difference=firstBoundaryDifference(braking,executeVehicle(designs,braking))
 assert.equal(difference.model,'brake')
 assert.equal(difference.expected,2100)
})
