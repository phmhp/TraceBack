import test from 'node:test'
import assert from 'node:assert/strict'
import {
  deriveInvestigationMilestones,
  initialInvestigationSession,
  investigationSessionReducer,
} from '../src/runtime/investigation/InvestigationSession.ts'

const reduce = (state, action) => investigationSessionReducer(state, action)

test('investigation shortcut history restores page, view and shared selection together', () => {
  let state = initialInvestigationSession()
  state = reduce(state, {
    type: 'NAVIGATE',
    context: { page: 2, view: 'SIGNALS', selection: { componentId: 'eDrive', signalId: 'DriveTorqueRequest' } },
    origin: 'function to signal',
  })
  state = reduce(state, {
    type: 'NAVIGATE',
    context: { page: 3, selection: { requirementId: 'SWR-EDR-001', testCaseId: 'TC-PROP-NORMAL-010A' } },
    origin: 'requirement to verification',
  })
  assert.equal(state.history.length, 2)
  state = reduce(state, { type: 'BACK' })
  assert.deepEqual(state.context, {
    page: 2,
    view: 'SIGNALS',
    selection: {
      componentId: 'eDrive', signalId: 'DriveTorqueRequest', frameIndex: 0,
    },
  })
})

test('duplicate navigation is ignored and frame selection does not create history', () => {
  let state = initialInvestigationSession()
  state = reduce(state, { type: 'NAVIGATE', context: { page: 1 }, origin: 'duplicate' })
  state = reduce(state, { type: 'NAVIGATE', context: { selection: { frameIndex: 12 } }, origin: 'timeline', remember: false })
  assert.equal(state.history.length, 0)
  assert.equal(state.context.selection.frameIndex, 12)
})

test('milestones require meaningful player actions rather than defaults or frame movement', () => {
  let state = initialInvestigationSession()
  assert.deepEqual(deriveInvestigationMilestones(state), {
    phenomenonConfirmed: false, boundaryTracked: false, hypothesisFormulated: false,
    hypothesisVerified: false, conclusionSubmitted: false,
  })
  state = reduce(state, { type: 'NAVIGATE', context: { selection: { frameIndex: 20 } }, origin: 'timeline', remember: false })
  assert.equal(deriveInvestigationMilestones(state).boundaryTracked, false)
  state = reduce(state, { type: 'RECORD', actionType: 'REVIEW_PHENOMENON' })
  state = reduce(state, { type: 'DISCOVER', finding: { id: 'finding:1', kind: 'BOUNDARY', subjectId: 'eDrive', source: 'INCIDENT_OBSERVATION' } })
  state = reduce(state, { type: 'SET_HYPOTHESIS', hypothesis: { target: 'eDrive', signal: 'DriveTorqueRequest', type: '계산 / 로직 오류' } })
  state = reduce(state, { type: 'RECORD', actionType: 'INTERPRET_VERIFICATION', subjectId: 'TC-PROP-NORMAL-010A' })
  state = reduce(state, { type: 'RECORD', actionType: 'SUBMIT_DIAGNOSIS', subjectId: 'eDrive' })
  assert.deepEqual(deriveInvestigationMilestones(state), {
    phenomenonConfirmed: true, boundaryTracked: true, hypothesisFormulated: true,
    hypothesisVerified: true, conclusionSubmitted: true,
  })
})

test('discovered findings and explicitly collected evidence remain separate', () => {
  let state = initialInvestigationSession()
  state = reduce(state, { type: 'DISCOVER', finding: { id: 'finding:boundary', kind: 'BOUNDARY', subjectId: 'VMC', source: 'INCIDENT_OBSERVATION' } })
  assert.equal(state.discoveredFindings.length, 1)
  assert.equal(state.collectedEvidenceIds.length, 0)
  state = reduce(state, { type: 'COLLECT_EVIDENCE', evidenceId: 'boundary:VMC:10' })
  assert.deepEqual(state.collectedEvidenceIds, ['boundary:VMC:10'])
})
