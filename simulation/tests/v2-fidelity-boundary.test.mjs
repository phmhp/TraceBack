import test from 'node:test'
import assert from 'node:assert/strict'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = path => readFileSync(resolve(root, path), 'utf8')

test('production entry keeps the full vehicle simulation instead of the low-fidelity prototype', () => {
  const main = read('src/main.tsx')
  assert.match(main, /GameApplication/)
  assert.match(main, /vehicle-sw\.wasm/)
  assert.doesNotMatch(main, /prototypes\/lowfi|DriveScene/)

  const application = read('src/app/GameApplication.tsx')
  for (const required of ['SimulationRuntime', 'WasmVehicleSw', 'PropulsionCase', 'GameViewport', 'RecoveryChallenge']) {
    assert.match(application, new RegExp(required), `${required} must remain in the production composition root`)
  }
})

test('standalone fork retains simulation, evidence, canonical knowledge and source material', () => {
  const requiredPaths = [
    'c/vehicle_sw/core.c',
    'src/physics/RapierWorld.tsx',
    'src/runtime/investigation/Evidence.ts',
    'src/ui/investigation/InvestigationWorkspace.tsx',
    'src/referenceVehicle/generated/reference-vehicle-registry.json',
    'docs/reference_vehicle/requirements/05_REQUIREMENT_CATALOG.csv',
    'docs/reference_vehicle/verification/06_TEST_CASE_CATALOG.csv',
    'docs/reference/JKEV_2027_ko_KR.pdf',
  ]
  for (const path of requiredPaths) assert.equal(existsSync(resolve(root, path)), true, `${path} must exist in the standalone project`)
})

test('investigation progress remains semantic and cannot be reduced to page visits', () => {
  const investigation = read('src/runtime/investigation/InvestigationSession.ts')
  const gameplay = read('src/runtime/investigation/GameplayInvestigation.ts')
  const workspace = read('src/ui/investigation/InvestigationWorkspace.tsx')

  for (const required of ['MEANINGFUL_DISCOVERY', 'EXPECTED_BASIS_IDENTIFIED', 'TEST_RESULT_INTERPRETED', 'CONCLUSION_SUBMITTED']) {
    assert.match(investigation, new RegExp(required))
  }
  for (const required of ['FAULT_BOUNDARY', 'rootCauseUnlocked', 'proofAssessment']) {
    assert.match(gameplay, new RegExp(required))
  }
  for (const required of ['handleCompareSignal', 'handleIdentifyExpectedBasis', 'handleRunExperiment', 'handleSubmitReport']) {
    assert.match(workspace, new RegExp(required))
  }
})
