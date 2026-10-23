/* global WebAssembly */
import assert from 'node:assert/strict'
import { URL } from 'node:url'
import { readFileSync, writeFileSync } from 'node:fs'
import { createHash } from 'node:crypto'
import console from 'node:console'
import { WasmVehicleSw } from '../src/runtime/c/WasmVehicleSw.ts'
import { propulsionRequirements } from '../src/data/ground-truth/PropulsionGroundTruth.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as calibration } from '../src/data/calibration/TrackbackSimulationCalibration.ts'

const read = path => readFileSync(new URL(path, import.meta.url), 'utf8')
const json = path => JSON.parse(read(path))
const player = json('../docs/cases/CASE-PT-001.player.json')
const author = json('../docs/cases/CASE-PT-001.author-only.json')
const groundTruth = read('../docs/ground-truth/PROPULSION_NORMAL_FLOW_GROUND_TRUTH_v0.3.md')
const build = json('../src/runtime/c/generated/build.json')
const bytes = readFileSync(new URL('../src/runtime/c/generated/vehicle-sw.wasm', import.meta.url))
assert.equal(createHash('sha256').update(bytes).digest('hex'), build.binaryHash)
const core = new WasmVehicleSw(await WebAssembly.compile(bytes), calibration)
assert.equal(player.caseId, author.caseId)
assert.equal(player.version, author.version)
assert.equal(player.runtimeImplemented, true)
assert.equal(author.runtimeImplemented, true)
assert.equal(player.sourceCodeVisible, false)
assert.equal(player.calibrationReference, calibration.profileId)
assert.equal(player.calibrationStatus, calibration.status)
assert.equal(player.calibrationValues.forwardLimitNm, calibration.maxForwardTorqueNm.value)
assert.equal(player.calibrationValues.reverseLimitNm, calibration.maxReverseTorqueNm.value)
for (const id of player.requirementRefs) {
  assert.ok(propulsionRequirements.some(r => r.id === id), `Missing requirement ${id}`)
  assert.ok(groundTruth.includes(id))
}
for (const id of author.regressionRefs) assert.ok(groundTruth.includes(id), `Missing TC ${id}`)
assert.ok(player.requirementRefs.includes(author.answer.requirementId))
assert.ok(player.componentPath.includes(author.answer.component))
assert.equal(new Set(player.tabs.map(t => t.id)).size, 5)
assert.equal(new Set(author.vectors.map(v => v.id)).size, author.vectors.length)

const normalCResults = []
const variantCResults = []
for (const vector of author.vectors) {
  const limit = vector.direction === 'FORWARD' ? calibration.maxForwardTorqueNm.value : calibration.maxReverseTorqueNm.value
  // Independent explicit expected vectors; these expressions validate spec arithmetic only.
  assert.equal(vector.normalNm, Math.min(vector.inputNm, limit))
  assert.equal(vector.faultNm, .5 * Math.min(vector.inputNm, limit))
  assert.equal(vector.compensatedNm, .5 * Math.min(2 * vector.inputNm, limit))
  assert.equal(vector.limitRemovedNm, .5 * vector.inputNm)
  const actual = core.verifyEDrive(vector.inputNm, vector.direction, 'VALID')
  assert.deepEqual(actual, { magnitudeNm: vector.normalNm, direction: vector.direction, validity: 'VALID' })
  normalCResults.push({ id: vector.id, inputNm: vector.inputNm, direction: vector.direction, expectedNm: vector.normalNm, actualNm: actual.magnitudeNm, verdict: 'PASS' })
  for (const [variant, field] of [[1,'faultNm'],[2,'compensatedNm'],[3,'limitRemovedNm']]) {
    core.setCaseVariant(variant)
    const observed = core.verifyEDrive(vector.inputNm, vector.direction, 'VALID')
    assert.deepEqual(observed, { magnitudeNm: vector[field], direction: vector.direction, validity: 'VALID' })
    variantCResults.push({ id: vector.id, variant, expectedNm: vector[field], actualNm: observed.magnitudeNm, verdict:'PASS' })
  }
  core.setCaseVariant(0)
}
const experiments = player.experiments
const paired = experiments.find(t => t.id.endsWith('-PAIR'))
for (const x of paired.editableInputs.torqueMagnitudeNm) assert.ok(author.vectors.some(v => v.direction === 'FORWARD' && v.inputNm === x))
for (const x of experiments.find(t => t.id.endsWith('-LIMIT')).inputsNm) assert.ok(author.vectors.some(v => v.direction === 'FORWARD' && v.inputNm === x))
const a = author.vectors.find(v => v.id === 'PAIR-45')
const b = author.vectors.find(v => v.id === 'PAIR-90')
assert.equal(a.faultNm / a.inputNm, b.faultNm / b.inputNm)
assert.notEqual(a.faultNm, Math.min(a.inputNm, author.answer.fixedCapAlternativeNm))
assert.ok(author.vectors.some(v => v.compensatedNm !== v.normalNm), 'Compensation must fail a regression vector')
assert.ok(author.vectors.some(v => v.limitRemovedNm > (v.direction === 'FORWARD' ? 180 : 130)), 'Limit removal must be distinguishable')

const report = {
  kind: 'CASE_SPECIFICATION_AND_NORMAL_BASELINE_CHECK', caseId: player.caseId,
  specVersion: player.version, binaryHash: build.binaryHash,
  verdict: 'PASS', normalCResults, variantCResults,
  referencesValidated: true, designArithmeticValidated: true,
  faultAndRepairRuntimeExecuted: true,
  note: 'PASS validates references and actual normal/fault/repair C component samples. Gameplay lifecycle is verified separately in tests/case-gameplay.test.mjs; this script does not test the browser UI.',
}
writeFileSync(new URL('../docs/cases/CASE-PT-001_CHECK.json', import.meta.url), JSON.stringify(report, null, 2) + '\n')
console.log(`CASE-PT-001: ${normalCResults.length} normal and ${variantCResults.length} fault/repair C samples verified.`)
