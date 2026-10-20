import test from 'node:test'
import assert from 'node:assert/strict'
import { deriveInvestigationMissions } from '../src/runtime/investigation/Mission.ts'
import { initialInvestigationSession, investigationSessionReducer } from '../src/runtime/investigation/InvestigationSession.ts'
import { reactionForInvestigationEvent } from '../src/runtime/investigation/Reaction.ts'

const record=(state,actionType,subjectId)=>investigationSessionReducer(state,{type:'RECORD',actionType,subjectId})
const discover=(state,finding)=>investigationSessionReducer(state,{type:'DISCOVER',finding})

test('missions advance from semantic actions, not page visits',()=>{
  let state=initialInvestigationSession()
  state=investigationSessionReducer(state,{type:'NAVIGATE',context:{page:2,view:'SIGNALS'},origin:'tab'})
  assert.equal(deriveInvestigationMissions(state)[0].completed,false)
  state=record(state,'REVIEW_PHENOMENON')
  assert.equal(deriveInvestigationMissions(state)[0].completed,true)
  assert.equal(deriveInvestigationMissions(state)[1].current,true)
})

test('signal selection alone is not a clue or mission completion',()=>{
  let state=initialInvestigationSession()
  state=record(state,'INSPECT_SIGNAL','EDriveCommand')
  assert.equal(deriveInvestigationMissions(state)[2].completed,false)
  state=discover(state,{id:'finding:signal:eDrive:EDriveCommand:300',kind:'SIGNAL',subjectId:'EDriveCommand',source:'INCIDENT_OBSERVATION',outcome:'MISMATCH',clueType:'MISMATCH',claim:'출력이 판정 기준과 다릅니다.'})
  assert.equal(deriveInvestigationMissions(state)[2].completed,true)
  assert.equal(state.collectedEvidenceIds.length,0)
})

test('discovery, notebook save and report selection remain separate in Phase B',()=>{
  let state=initialInvestigationSession()
  state=discover(state,{id:'finding:signal:GearLogic:GearState:300',kind:'SIGNAL',subjectId:'GearState',source:'INCIDENT_OBSERVATION',outcome:'MATCH',clueType:'NORMAL_CONFIRMATION',claim:'상태 조건이 판정 기준을 만족합니다.'})
  assert.equal(state.discoveredFindings.length,1)
  assert.equal(state.collectedEvidenceIds.length,0)
  state=investigationSessionReducer(state,{type:'COLLECT_EVIDENCE',evidenceId:'signal:GearLogic:GearState:300'})
  assert.deepEqual(state.collectedEvidenceIds,['signal:GearLogic:GearState:300'])
  assert.ok(state.actions.some(action=>action.type==='EVIDENCE_SAVED'))
})

test('expected basis, hypothesis, repeated interpreted tests and conclusion complete their own missions',()=>{
  let state=initialInvestigationSession()
  state=record(state,'EXPECTED_BASIS_IDENTIFIED','SWR-EDR-001')
  state=investigationSessionReducer(state,{type:'SET_HYPOTHESIS',hypothesis:{target:'eDrive',prediction:'EDriveCommand가 Expected를 만족하지 않을 것이다.'}})
  state=discover(state,{id:'finding:test:1',kind:'TEST_RESULT',subjectId:'TC-PROP-NORMAL-010A',source:'EXPERIMENT',outcome:'MISMATCH'})
  state=discover(state,{id:'finding:test:2',kind:'TEST_RESULT',subjectId:'TC-PROP-NORMAL-010A',source:'EXPERIMENT',outcome:'MISMATCH'})
  state=record(state,'CONCLUSION_SUBMITTED','eDrive')
  const missions=deriveInvestigationMissions(state)
  assert.equal(missions[3].completed,true)
  assert.equal(missions[4].completed,true)
  assert.equal(missions[5].completed,true)
  assert.equal(missions[6].completed,true)
})

test('future cat reactions derive from the existing semantic event stream',()=>{
  assert.equal(reactionForInvestigationEvent('MEANINGFUL_DISCOVERY','MISMATCH'),'CAT_CLUE_FOUND')
  assert.equal(reactionForInvestigationEvent('TEST_RESULT_INTERPRETED'),'CAT_INVESTIGATING')
  assert.equal(reactionForInvestigationEvent('CONCLUSION_SUBMITTED',undefined,false),'CAT_WRONG')
  assert.equal(reactionForInvestigationEvent('CONCLUSION_CONFIRMED'),'CAT_SOLVED')
})
