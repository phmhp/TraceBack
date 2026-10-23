import test from 'node:test'
import assert from 'node:assert/strict'
import { award, newStory, readStory, STORY_KEY } from '../src/game/story.ts'
import { LESSONS, lessonComplete, TRIALS } from '../src/game/lessons.ts'
import { starter, withStates, referenceGraph, MISSIONS } from '../src/content/ready.ts'
import { connect } from '../src/engine/graph.ts'
import { verify } from '../src/engine/verification.ts'

test('guided lessons build the real graph; both suites pass without an answer animation',()=>{
  let graph=starter()
  for(const lesson of LESSONS[0]){
    assert.equal(lessonComplete(graph,lesson),false)
    for(const target of lesson.connections)graph=connect(graph,{...target,id:crypto.randomUUID()})
    assert.equal(lessonComplete(graph,lesson),true)
  }
  assert.ok(verify(graph,MISSIONS[0]).every(r=>r.pass))
  graph=withStates(graph)
  for(const lesson of LESSONS[1])for(const target of lesson.connections)graph=connect(graph,{...target,id:crypto.randomUUID()})
  assert.ok(verify(graph,MISSIONS[2]).every(r=>r.pass))
})
test('story rewards require an independently re-executed suite, not a forged pass',()=>{
  const story=newStory(), rows=verify(referenceGraph(),MISSIONS[0])
  const rejected=award(story,rows)
  assert.equal(rejected.scene,'test');assert.deepEqual(rejected.stickers,[])
  story.lab.graphs.conditions=referenceGraph()
  const accepted=award(story,rows)
  assert.equal(accepted.scene,'reward');assert.equal(accepted.lab.grades.conditions,3)
  assert.deepEqual(accepted.stickers,['conditions']);assert.ok(accepted.evidence[0].design)
})
test('load revalidates completed graph, removes stale award and locks later chapters',()=>{
  let story=newStory();story.lab.graphs.conditions=referenceGraph();story=award(story,verify(story.lab.graphs.conditions,MISSIONS[0]))
  const valid=readStory({getItem:()=>JSON.stringify(story),setItem:()=>{}})
  assert.equal(valid.story.lab.grades.conditions,3)
  story.lab.graphs.conditions.edges.pop();story.scene='reward'
  const invalid=readStory({getItem:()=>JSON.stringify(story),setItem:()=>{}})
  assert.equal(invalid.story.lab.grades.conditions,0);assert.deepEqual(invalid.story.stickers,[])
  assert.equal(invalid.story.scene,'build')
})
test('story uses a separate key, preserves v2 and rejects corrupted checkpoints',()=>{
  assert.notEqual(STORY_KEY,'vehicle-logic-lab.v1')
  let writes=0
  assert.ok(readStory({getItem:()=>'{',setItem:()=>{writes++}}).warning)
  assert.equal(writes,0)
  const story=newStory();story.mission=100
  assert.ok(readStory({getItem:()=>JSON.stringify(story),setItem:()=>{}}).warning)
})
test('each prediction trial points to a real requirement-driven scenario',()=>{
  for(const [i,ids] of TRIALS.entries())for(const id of ids)assert.ok(MISSIONS[i].scenarios.some(s=>s.id===id))
})
