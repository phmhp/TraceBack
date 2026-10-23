import test from 'node:test'
import assert from 'node:assert/strict'
import { evaluatePropulsion } from '../src/runtime/propulsion/PropulsionFunction.ts'
import { GearLogic } from '../src/runtime/gear/GearLogic.ts'
import { createDriveTorqueRequest } from '../src/runtime/vmc/PropulsionVmc.ts'
import { createEDriveCommand } from '../src/runtime/edrive/EDrive.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'

const base = { acceleratorPedalPosition: .5, acceleratorPedalValidity: 'VALID', gearState: 'D', gearStateValidity: 'VALID', vehicleReady: true, propulsionEnable: true }
const metadata = {
  'TC-PROP-NORMAL-001': { requirementId: 'SYSR-PROP-001', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-002': { requirementId: 'SYSR-PROP-001', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-003': { requirementId: 'SYSR-PROP-002', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-004': { requirementId: 'SYSR-PROP-004', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-005': { requirementId: 'SYSR-PROP-003', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-006A': { requirementId: 'SYSR-PROP-005', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-006B': { requirementId: 'SYSR-PROP-006', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-007': { requirementId: 'SYSR-PROP-007', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-008': { requirementId: 'SYSR-PROP-008', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-009': { requirementId: 'SYSR-PROP-009', verificationLevel: 'SW_INTEGRATION' },
  'TC-PROP-NORMAL-010A': { requirementId: 'SYSR-PROP-009', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-010B': { requirementId: 'SYSR-PROP-009', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-013': { requirementId: 'SYSR-GEAR-001', verificationLevel: 'SW_COMPONENT' },
  'TC-PROP-NORMAL-014': { requirementId: 'SYSR-GEAR-001', verificationLevel: 'SW_COMPONENT' },
}

test('TC-PROP-NORMAL-001/002 disabled gating and enabled state', () => {
  assert.deepEqual(evaluatePropulsion({ ...base, vehicleReady: false }), { state: 'PROP_DISABLED', request: { magnitude: 0, direction: 'NONE', validity: 'VALID' } })
  assert.equal(evaluatePropulsion(base).state, 'PROP_ENABLED')
})
test('TC-PROP-NORMAL-003 invalid accelerator and gear are rejected', () => {
  for (const change of [{ acceleratorPedalValidity: 'INVALID' }, { gearStateValidity: 'INVALID' }])
    assert.deepEqual(evaluatePropulsion({ ...base, ...change }).request, { magnitude: 0, direction: 'NONE', validity: 'INVALID' })
})
test('TC-PROP-NORMAL-004/005 zero and pedal map', () => {
  assert.deepEqual(evaluatePropulsion({ ...base, acceleratorPedalPosition: 0 }).request, { magnitude: 0, direction: 'NONE', validity: 'VALID' })
  assert.equal(evaluatePropulsion({ ...base, acceleratorPedalPosition: .37 }).request.magnitude, .37)
})
test('TC-PROP-NORMAL-006A/006B P and N inhibit propulsion as valid states', () => {
  for (const gearState of ['P', 'N']) assert.deepEqual(evaluatePropulsion({ ...base, gearState }).request, { magnitude: 0, direction: 'NONE', validity: 'VALID' })
})
test('TC-PROP-NORMAL-007/008 D forward and R reverse', () => {
  assert.equal(evaluatePropulsion(base).request.direction, 'FORWARD')
  assert.equal(evaluatePropulsion({ ...base, gearState: 'R' }).request.direction, 'REVERSE')
})
test('TC-PROP-NORMAL-009 VMC preserves direction/validity and maps magnitude', () => {
  const value = createDriveTorqueRequest(evaluatePropulsion(base).request, 0, cal.vmcForwardTorqueMap, cal.vmcReverseTorqueMap)
  assert.deepEqual(value, { magnitudeNm: 90, direction: 'FORWARD', validity: 'VALID' })
  assert.deepEqual(createDriveTorqueRequest({ magnitude: 0, direction: 'NONE', validity: 'INVALID' }, 0, cal.vmcForwardTorqueMap, cal.vmcReverseTorqueMap), { magnitudeNm: 0, direction: 'NONE', validity: 'INVALID' })
})
test('TC-PROP-NORMAL-010A/010B eDrive applies direction-specific limits', () => {
  assert.equal(createEDriveCommand({ magnitudeNm: 999, direction: 'FORWARD', validity: 'VALID' }, 180, 130).magnitudeNm, 180)
  assert.equal(createEDriveCommand({ magnitudeNm: 999, direction: 'REVERSE', validity: 'VALID' }, 180, 130).magnitudeNm, 130)
})
test('TC-PROP-NORMAL-013/014 GearLogic accepts near-zero and rejects moving D/R changes', () => {
  const gear = new GearLogic()
  assert.equal(gear.update('R', 'VALID', cal.gearDirectionChangeMaxSpeedMps.value, cal.gearDirectionChangeMaxSpeedMps.value).gearState, 'R')
  gear.reset()
  const rejected = gear.update('R', 'VALID', cal.gearDirectionChangeMaxSpeedMps.value + .01, cal.gearDirectionChangeMaxSpeedMps.value)
  assert.deepEqual(rejected, { requestedGear: 'R', gearState: 'D', gearStateValidity: 'VALID', transitionAccepted: false })
})
test('trace metadata uses stable requirement and test IDs', () => {
  assert.equal(Object.keys(metadata).length, 14)
  assert.ok(Object.entries(metadata).every(([testCaseId, value]) => testCaseId.startsWith('TC-') && value.requirementId.startsWith('SYSR-')))
})
