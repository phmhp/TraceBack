import test from 'node:test'
import assert from 'node:assert/strict'
import { RecoveryChallenge, createMemoryBestTimeStore, createRecoveryTrack } from '../src/runtime/gameplay/RecoveryChallenge.ts'

const route={routeId:'ROUTE',orderedPoints:[{x:0,y:0,z:0},{x:40,y:0,z:0},{x:80,y:0,z:0},{x:120,y:0,z:0}],checkpoints:[{id:'CP_A',pointIndex:1},{id:'CP_B',pointIndex:2}],startPoint:{x:0,y:0,z:0},finishPoint:{x:120,y:0,z:0},closedLoop:false}
const mission={id:'MISSION',trackId:'TRACK',version:'g1',title:'Recovery',rulesVersion:'rules-1'}
const make=(store=createMemoryBestTimeStore())=>new RecoveryChallenge(createRecoveryTrack('TRACK',route,'MISSION'),mission,store)

test('track contract resolves checkpoint positions from route geometry, not screen coordinates',()=>{
 const track=createRecoveryTrack('TRACK',route,'MISSION')
 assert.deepEqual(track.checkpoints.map(item=>[item.id,item.order,item.position.x]),[['CP_A',0,40],['CP_B',1,80]])
 assert.equal(track.finish.position.x,120)
})

test('repair verification unlocks recovery; ordered checkpoints cannot skip or duplicate',()=>{
 const challenge=make();assert.throws(()=>challenge.start(),/Repair verification/)
 challenge.unlock();challenge.start()
 challenge.advance(1,{x:80,z:0});assert.equal(challenge.getSnapshot().checkpointIndex,0)
 challenge.advance(1,{x:40,z:0});assert.equal(challenge.getSnapshot().checkpointIndex,1)
 challenge.advance(1,{x:40,z:0});assert.equal(challenge.getSnapshot().checkpointIndex,1)
 challenge.advance(1,{x:120,z:0});assert.equal(challenge.getSnapshot().status,'RUNNING','finish is rejected while a checkpoint is missing')
 challenge.advance(1,{x:80,z:0});assert.equal(challenge.getSnapshot().checkpointIndex,2)
 const result=challenge.advance(1,{x:120,z:0});assert.equal(result.finished,true);assert.equal(challenge.getSnapshot().status,'FINISHED')
 assert.equal(challenge.getSnapshot().reaction,'CELEBRATING')
})

test('retry resets timer/checkpoints and personal best is scoped and persisted',()=>{
 const store=createMemoryBestTimeStore(),first=make(store);first.unlock();first.start()
 first.advance(2,{x:40,z:0});first.advance(2,{x:80,z:0});first.advance(2,{x:120,z:0})
 assert.equal(first.getSnapshot().personalBestSeconds,6);assert.equal(first.getSnapshot().isNewBest,true)
 const replay=make(store);assert.equal(replay.getSnapshot().personalBestSeconds,6);replay.unlock();replay.start();assert.equal(replay.getSnapshot().elapsedSeconds,0);assert.equal(replay.getSnapshot().checkpointIndex,0)
 const otherMission={...mission,id:'OTHER'};const other=new RecoveryChallenge(createRecoveryTrack('TRACK',route,'OTHER'),otherMission,store);assert.equal(other.getSnapshot().personalBestSeconds,null)
})
