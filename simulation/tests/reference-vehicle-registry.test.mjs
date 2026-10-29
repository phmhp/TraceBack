import test from 'node:test'
import assert from 'node:assert/strict'
import { spawnSync } from 'node:child_process'
import {
  EXPECTED_REFERENCE_VEHICLE_COUNTS,
  getCaseRelations,
  getEntitiesByKind,
  getEntity,
  getFunctionsForArea,
  getInterfacesForFunction,
  getRelationsFrom,
  getRelationsTo,
  getRequirementsForEntity,
  getSignalsForFunction,
  getTestsForRequirement,
  referenceVehicleRegistryData,
  validateReferenceVehicleRegistry,
} from '../src/referenceVehicle/index.ts'

test('generated registry matches accepted canonical entity counts', () => {
  for (const [kind, expected] of Object.entries(EXPECTED_REFERENCE_VEHICLE_COUNTS)) {
    assert.equal(getEntitiesByKind(kind).length, expected, kind)
  }
  assert.deepEqual(referenceVehicleRegistryData.counts, EXPECTED_REFERENCE_VEHICLE_COUNTS)
})

test('canonical IDs are unique and all internal relation endpoints resolve', () => {
  const validation = validateReferenceVehicleRegistry()
  assert.deepEqual(validation.duplicateIds, [])
  assert.deepEqual(validation.danglingRelations, [])
  assert.deepEqual(validation.invalidRelationDirections, [])
  assert.deepEqual(validation.unknownEntityKinds, [])
  assert.deepEqual(validation.countMismatches, [])
  assert.equal(validation.valid, true)
})

test('lookup and directional relation indexes are stable', () => {
  assert.equal(getEntity('LF-PROP-EDRV')?.entityKind, 'LOGICAL_FUNCTION')
  assert.ok(getFunctionsForArea('PROPULSION').some(entity => entity.id === 'LF-PROP-EDRV'))
  assert.ok(getSignalsForFunction('LF-PROP-EDRV').length > 0)
  assert.ok(getInterfacesForFunction('LF-PROP-EDRV').length > 0)
  assert.ok(getRelationsFrom('LF-PROP-EDRV').length > 0)
  assert.ok(getRelationsTo('LF-PROP-EDRV').length > 0)
})

test('known Propulsion path references retain their canonical identities', () => {
  for (const id of ['LF-PROP-INTERP', 'LF-PROP-GEN', 'LF-PROP-EDRV']) {
    assert.equal(getEntity(id)?.entityKind, 'LOGICAL_FUNCTION')
    assert.ok(getFunctionsForArea('PROPULSION').some(entity => entity.id === id))
  }
})

test('requirement, test and case trace queries resolve canonical IDs', () => {
  const requirements = getRequirementsForEntity('LF-PROP-EDRV')
  assert.ok(requirements.some(entity => entity.id === 'CAND-SWR-PROP-EDRV'))
  assert.ok(getTestsForRequirement('CAND-SWR-PROP-EDRV').some(entity => entity.id === 'TC-CAND-PROP-EDRV-001'))
  const caseRelations = getCaseRelations('CASE-PT-001')
  assert.ok(caseRelations.some(relation => relation.targetId === 'LF-PROP-EDRV'))
  assert.ok(caseRelations.some(relation => relation.targetId === 'CAND-SWR-PROP-EDRV'))
  assert.equal(getEntity('CASE-PT-001')?.approvalStatus, 'EXISTING_CANONICAL_GAME_CASE')
})

test('runtime evidence and reference design remain distinct', () => {
  assert.equal(getEntity('LF-PROP-EDRV')?.implementationStatus, 'VERIFIED')
  assert.equal(getEntity('LF-PROP-EDRV')?.pathScope, 'BOTH')
  assert.equal(getEntity('LF-MC-AUTH')?.implementationStatus, 'DESIGN_ONLY')
  assert.equal(getEntity('LF-MC-AUTH')?.pathScope, 'REFERENCE_DESIGN')
  assert.equal(getEntity('LF-MC-ALLOC')?.implementationStatus, 'DESIGN_ONLY')
  assert.equal(getEntity('LF-MC-ALLOC')?.pathScope, 'REFERENCE_DESIGN')
  assert.equal(getEntity('LF-PROP-GEN')?.implementationStatus, 'PARTIAL')
  assert.equal(getEntity('Trackback_VMC'), undefined)
})

test('open and draft engineering status is preserved', () => {
  const requirements = getEntitiesByKind('REQUIREMENT')
  assert.ok(requirements.every(entity => entity.approvalStatus === 'DRAFT_NOT_APPROVED'))
  assert.ok(requirements.some(entity => entity.metadata.owner === 'SW_OWNER_TBD'))
  assert.equal(getEntitiesByKind('CASE').filter(entity => entity.approvalStatus === 'AI_DRAFT').length, 33)
  assert.equal(getEntitiesByKind('LOGICAL_FUNCTION').filter(entity => entity.implementationStatus === 'DESIGN_ONLY').length, 42)
})

test('generated registry has no drift from canonical sources', () => {
  const result = spawnSync(process.execPath, ['scripts/build-reference-vehicle-registry.mjs', '--check'], {
    cwd: process.cwd(), encoding: 'utf8',
  })
  assert.equal(result.status, 0, `${result.stdout}\n${result.stderr}`)
})
