import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'

const deck=readFileSync(new URL('../src/ui/investigation/focus/InvestigationFocusDeck.tsx',import.meta.url),'utf8')
const workspace=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
const guidedCase=readFileSync(new URL('../src/data/investigation/GuidedCases.ts',import.meta.url),'utf8')
const contract=readFileSync(new URL('../src/runtime/investigation/GuidedCase.ts',import.meta.url),'utf8')
const deckCss=readFileSync(new URL('../src/ui/investigation/focus/investigation-focus-deck.css',import.meta.url),'utf8')

test('default investigation keeps the six reasoning scenes inside the original investigation shell',()=>{
  assert.match(workspace,/useState\(difficulty==='GUIDED'\)/)
  assert.match(workspace,/difficulty==='GUIDED'\?unlockedPage:4/)
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
  assert.match(deck,/OpenBookReference/)
  assert.match(deck,/블랙박스/)
  assert.match(deck,/EV 기계 흐름/)
  assert.ok(deck.indexOf('focus-decision-pane')<deck.indexOf('focus-reference-pane'),'decision pane must precede the reference pane')
  assert.match(deckCss,/book-page-turn/)
  assert.match(deckCss,/grid-template-columns:minmax\(330px,.82fr\) minmax\(0,1.48fr\)/)
})

test('guided boundary collection finds a valid recorded frame and explains why it advances',()=>{
  assert.match(workspace,/expectedStatus=kind==='LAST_NORMAL'\?'MATCH':'MISMATCH'/)
  assert.match(workspace,/for\(let index=state\.frames\.length-1;index>=0;index--\)/)
  assert.match(workspace,/saved\.comparison\.status!==expectedStatus/)
  assert.match(workspace,/첫 이상 경계를 확보해 다음 단계로 이동합니다/)
})

test('evidence requires retrieval, prediction and explanation rather than reveal clicks',()=>{
  assert.match(guidedCase,/운전자의 말을 측정 가능한 현상/)
  assert.match(deck,/confirmPhenomenon/)
  assert.match(deck,/confirmDomain/)
  assert.match(deck,/onRunSimulationExperiment/)
  assert.match(deck,/eDrive C\/WASM 비교 시험/)
  assert.match(deck,/가설은 틀려도 감점되지 않으며 결과로 수정합니다/)
  assert.match(deck,/이 결과가 말할 수 있는 범위는/)
  assert.match(guidedCase,/비슷한 비율 차이가 반복되어 스케일링 가설을 지지/)
  assert.match(deck,/evidenceIds:collectedEvidence\.map/)
})

test('guided references reuse the real drive viewport and preserve vehicle-layer depth',()=>{
  assert.match(deck,/viewport-projection-host/)
  assert.match(workspace,/videoSlotRef=\{setVideoSlot\}/)
  for(const label of ['ARCHITECTURE','DOMAIN','FUNCTION','LOGIC','INTERFACE','SIGNAL','REQUIREMENT','TEST'])assert.match(deck,new RegExp(label))
  assert.match(deck,/getRequirementsForComponent/)
  assert.match(deck,/getTestsForRequirement/)
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
