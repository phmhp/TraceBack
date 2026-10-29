import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluate, connect, validateGraph } from '../src/engine/graph.ts'
import { LogicSimulation } from '../src/engine/simulation.ts'
import { verify, rating } from '../src/engine/verification.ts'
import { referenceGraph, starter, MISSIONS, DEFAULT_INPUTS, wire } from '../src/content/ready.ts'
import { doorGraph, doorMission } from '../src/content/door-sample.ts'
import { emptySave, loadSave, persist, fingerprint, SAVE_KEY } from '../src/progress/storage.ts'

test('mission one runs all eight truth combinations without changing vehicle state', () => {
  const rows = verify(referenceGraph(), MISSIONS[0])
  assert.equal(rows.length, 8)
  assert.ok(rows.every(r => r.pass && r.actual.state === 'STANDBY'))
  assert.equal(rating(rows), 3)
})
test('disconnected starter never produces a successful or drive-enabled result', () => {
  const rows = verify(starter(), MISSIONS[0])
  assert.ok(rows.every(r => !r.pass))
  assert.equal(rating(rows), 0)
  assert.deepEqual(evaluate(starter(), DEFAULT_INPUTS, 'STANDBY').outputs, {})
})
test('omitting brake or replacing AND with OR fails behavior verification', () => {
  const graph = referenceGraph()
  graph.edges = graph.edges.map(e => e.to === 'both' && e.in === 'b' ? wire('power', 'both', 'b') : e)
  assert.equal(verify(graph, MISSIONS[0]).find(r => r.id === 'logic-5').pass, false)
  graph.nodes.find(n => n.id === 'both').kind = 'or'
  assert.ok(verify(graph, MISSIONS[0]).some(r => !r.pass))
})
test('equivalent Boolean design with NOT and OR is accepted regardless of shape', () => {
  const graph = referenceGraph()
  graph.nodes = graph.nodes.filter(n => !['both', 'allow'].includes(n.id))
  for (const [id, kind] of [['np', 'not'], ['nb', 'not'], ['ns', 'not'], ['or1', 'or'], ['or2', 'or'], ['inv', 'not']]) graph.nodes.push({ id, kind, label: id, x: 0, y: 0 })
  graph.edges = [wire('power','np','a'), wire('brake','nb','a'), wire('system','ns','a'), wire('np','or1','a'), wire('nb','or1','b'), wire('or1','or2','a'), wire('ns','or2','b'), wire('or2','inv','a'), wire('inv','request')]
  assert.ok(verify(graph, MISSIONS[0]).every(r => r.pass))
})
test('connecting checks port type and combinational cycles before commit', () => {
  assert.throws(() => connect(referenceGraph(true), wire('ready','both','a')), /상태 값/)
  assert.throws(() => connect(referenceGraph(), wire('allow','both','a')), /순환/)
  assert.throws(() => connect(referenceGraph(), wire('power','unknown')), /포트/)
})
test('single socket reconnection is a replacement, no parallel drivers', () => {
  const graph = connect(referenceGraph(), wire('system', 'both', 'a'))
  assert.equal(graph.edges.filter(e => e.to === 'both' && e.in === 'a').length, 1)
  assert.equal(graph.edges.find(e => e.to === 'both' && e.in === 'a').from, 'system')
})
test('duplicate output keys and stale ports produce explicit validation errors', () => {
  const graph = referenceGraph()
  graph.nodes.push({ id: 'duplicate', kind: 'output', key: 'request', label: 'duplicate', x: 0, y: 0 })
  graph.edges.push(wire('power', 'duplicate'))
  assert.ok(validateGraph(graph).some(i => i.message.includes('같은 출력')))
  graph.edges[0].out = 'nonexistent'
  assert.ok(validateGraph(graph).some(i => i.message.includes('포트')))
})
test('machine passes normal, abnormal, 48 boundary combinations and held-button sequences', () => {
  const results = verify(referenceGraph(true), MISSIONS[2])
  assert.equal(results.length, 57)
  assert.deepEqual(results.filter(r => !r.pass), [])
})
test('one rising edge causes at most one transition; release and repress is required', () => {
  const sim = new LogicSimulation('OFF', 'machine')
  const graph = referenceGraph(true), held = { ...DEFAULT_INPUTS, power: true }
  assert.equal(sim.step(graph, held).state, 'STANDBY')
  assert.equal(sim.step(graph, held).state, 'STANDBY')
  sim.step(graph, DEFAULT_INPUTS)
  const ready = sim.step(graph, held)
  assert.equal(ready.state, 'READY'); assert.equal(ready.outputs.ready, true); assert.equal(ready.outputs.drive, true)
  assert.equal(sim.step(graph, held).state, 'READY')
})
test('shutdown requires stopped condition and a fresh event', () => {
  const sim = new LogicSimulation('READY', 'machine'), graph = referenceGraph(true)
  assert.equal(sim.step(graph, { ...DEFAULT_INPUTS, stopped: false, power: true }).state, 'READY')
  sim.step(graph, DEFAULT_INPUTS)
  assert.equal(sim.step(graph, { ...DEFAULT_INPUTS, power: true }).state, 'OFF')
})
test('wrong shutdown logic fails the moving vehicle test', () => {
  const graph = referenceGraph(true)
  graph.nodes.find(n => n.id === 'shutdown').kind = 'or'
  assert.equal(verify(graph, MISSIONS[1]).find(r => r.id === 'moving').pass, false)
})
test('simultaneous outgoing transitions are an error, never chosen by array ordering', () => {
  const graph = referenceGraph(true)
  graph.nodes.push({ id: 'ambiguous', kind: 'transition', label: '두 번째 전이', x: 0, y: 0 })
  graph.edges.push(wire('off','ambiguous','from'),wire('ready','ambiguous','to'),wire('power','ambiguous','when'))
  const row = new LogicSimulation('OFF','machine').step(graph, { ...DEFAULT_INPUTS,power:true })
  assert.equal(row.state, 'OFF'); assert.match(row.issues[0].message, /동시에/)
})
test('same initial state and samples produce identical time, outputs and transitions', () => {
  const run = () => { const sim = new LogicSimulation('OFF','machine'); return MISSIONS[1].scenarios[0].steps.map(s => sim.step(referenceGraph(true), s.inputs)) }
  assert.deepEqual(run(), run())
})
test('state feedback is explicit memory and needs no cyclic combinational graph', () => {
  const graph = referenceGraph(true)
  assert.deepEqual(validateGraph(graph), [])
  assert.equal(evaluate(graph, DEFAULT_INPUTS, 'READY').values['ready:active'], true)
})
test('new door content uses the same evaluator, simulator and verifier', () => {
  assert.ok(verify(doorGraph, doorMission).every(r => r.pass))
  const wrong = structuredClone(doorGraph); wrong.nodes.find(n => n.id === 'gate').kind = 'or'
  assert.ok(verify(wrong, doorMission).some(r => !r.pass))
})
test('failed required tests cannot unlock a mission even if challenge passes', () => {
  const rows = verify(referenceGraph(), MISSIONS[0])
  rows.find(r => !r.challenge).pass = false
  assert.equal(rating(rows), 1)
})
test('missing required output never passes tests whose expected value is false', () => {
  const graph = referenceGraph(true)
  graph.nodes = graph.nodes.filter(n => n.id !== 'drive'); graph.edges = graph.edges.filter(e => e.to !== 'drive')
  assert.ok(verify(graph, MISSIONS[1]).every(r => !r.pass))
})
test('save roundtrip, corrupt JSON and unavailable browser storage are handled', () => {
  let record
  const store = { getItem: key => key === SAVE_KEY ? record : null, setItem: (_key, value) => { record = value } }
  const save = emptySave()
  assert.equal(persist(store, save), undefined)
  assert.deepEqual(loadSave(store).save, JSON.parse(JSON.stringify(save)))
  assert.equal(fingerprint(loadSave(store).save.graphs.conditions), fingerprint(save.graphs.conditions))
  record = '{bad json'
  assert.ok(loadSave(store).warning)
  assert.equal(record, '{bad json')
  assert.ok(persist({ setItem: () => { throw new Error('quota') } }, save))
})
test('layout changes retain verification identity, wiring edits revoke it', () => {
  const graph = referenceGraph(), before = fingerprint(graph)
  graph.nodes[0].x += 50
  assert.equal(fingerprint(graph), before)
  graph.edges.pop()
  assert.notEqual(fingerprint(graph), before)
})
test('a permanently false request cannot complete mission one', () => {
  const graph = referenceGraph()
  graph.nodes.push({ id: 'invert', kind: 'not', label: '반전', x: 0, y: 0 })
  graph.edges.push(wire('power', 'invert', 'a'))
  graph.edges = graph.edges.map(e => e.to === 'both' && e.in === 'b' ? wire('invert','both','b') : e)
  const rows = verify(graph, MISSIONS[0])
  assert.equal(rows.find(r => r.id === 'logic-7').pass, false)
  assert.ok(rating(rows) < 2)
})
