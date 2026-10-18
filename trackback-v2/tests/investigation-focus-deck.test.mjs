import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const deck=readFileSync(new URL('../src/ui/investigation/focus/InvestigationFocusDeck.tsx',import.meta.url),'utf8')
const workspace=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
const guidedCase=readFileSync(new URL('../src/data/investigation/GuidedCases.ts',import.meta.url),'utf8')
const contract=readFileSync(new URL('../src/runtime/investigation/GuidedCase.ts',import.meta.url),'utf8')

test('default investigation keeps the six reasoning scenes inside the original investigation shell',()=>{
  assert.match(workspace,/useState\(true\)/)
  assert.match(workspace,/InvestigationFocusDeck/)
  for(const label of ['현상 확정','도메인 찾기','경계 좁히기','가설 구별','비교 검증','수리·재검증'])assert.match(deck,new RegExp(label))
  assert.match(deck,/전체 조사 도구/)
  assert.match(workspace,/<InvestigationHeader/)
})

test('the open-book flow scopes the current question while retaining architecture context',()=>{
  assert.match(deck,/지금 보면 되는 범위/)
  assert.match(deck,/이번에는 보지 않아도 되는 것/)
  assert.match(deck,/focus-open-book/)
  assert.match(deck,/ArchitecturePath/)
  assert.match(deck,/LayeredSystemVisual/)
  assert.match(workspace,/incidentPath=\{definition\.incidentPath\}/)
  assert.match(deck,/activeBoundary/)
})

test('evidence requires retrieval, prediction and explanation rather than reveal clicks',()=>{
  assert.match(guidedCase,/운전자의 말을 측정 가능한 현상/)
  assert.match(deck,/confirmPhenomenon/)
  assert.match(deck,/confirmDomain/)
  assert.match(deck,/disabled=\{!activePlan\|\|!activeHypothesis\}/)
  assert.match(deck,/이 결과가 말할 수 있는 범위는/)
  assert.match(guidedCase,/비슷한 비율 차이가 반복되어 스케일링 가설을 지지/)
  assert.match(deck,/evidenceIds:collectedEvidence\.map/)
})

test('future fault cases share one validated authoring contract instead of cloning the UI',()=>{
  assert.match(contract,/export interface GuidedCaseDefinition/)
  assert.match(contract,/validateGuidedCase/)
  assert.match(contract,/경쟁 가설이 필요합니다/)
  assert.match(contract,/GuidedScopeDefinition/)
  assert.match(contract,/GuidedVisualLayer/)
  assert.match(guidedCase,/guidedCaseFor/)
  assert.match(workspace,/guidedCaseFor\(definition\.id\)/)
  assert.doesNotMatch(deck,/DriveTorqueRequest['"],kind/)
})
