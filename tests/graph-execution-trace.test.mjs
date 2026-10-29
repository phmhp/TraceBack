import test from 'node:test'
import assert from 'node:assert/strict'
import {emptyModel,evaluateModel,referenceModel,wrapBlockAsSubsystem} from '../src/campaign/domainTraining.ts'

test('one input case records actual dependency order, wire values and output',()=>{
 const result=evaluateModel(referenceModel('request'),{pedal:50,cap:180})
 assert.deepEqual(result.errors,[])
 assert.equal(result.output.request,90)
 assert.equal(result.events.at(-1).nodeId,'out-request')
 assert.equal(result.events.at(-1).value,90)
 assert.deepEqual(result.events.at(-1).inputs,[{port:0,portName:'u',from:'b3',fromName:'가용 토크 제한',value:90}])
 const positions=new Map(result.events.map((event,index)=>[event.nodeId,index]))
 for(const event of result.events)for(const link of event.inputs)if(link.from)assert.ok(positions.get(link.from)<positions.get(event.nodeId),`${link.from} precedes ${event.nodeId}`)
})

test('nested subsystem steps retain a navigable relative scope',()=>{
 const graph=wrapBlockAsSubsystem(referenceModel('power'),'b1')
 const result=evaluateModel(graph,{ready:true,pack:true})
 assert.equal(result.output.enable,true)
 assert.ok(result.events.some(event=>event.scope==='b1/'&&event.nodeId==='output'))
 assert.ok(result.events.some(event=>event.scope===''&&event.nodeId==='b1'))
})

test('a disconnected graph records the missing boundary without inventing a passing output',()=>{
 const result=evaluateModel(emptyModel('power'),{ready:true,pack:true})
 assert.equal(result.output.enable,false)
 assert.ok(result.errors.length>0)
 assert.ok(result.events.some(event=>event.nodeId==='out-enable'&&event.errors.length>0))
})
