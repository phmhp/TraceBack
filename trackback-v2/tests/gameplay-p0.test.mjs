import test from 'node:test'
import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { propulsionCaseDefinition } from '../src/runtime/investigation/CaseDefinition.ts'
import { deriveGameplayInvestigation } from '../src/runtime/investigation/GameplayInvestigation.ts'
import { initialInvestigationSession, investigationSessionReducer } from '../src/runtime/investigation/InvestigationSession.ts'
import { useIncidentRace } from '../src/ui/state/incidentRace.ts'

const evidence=[
 {id:'incident:1',type:'INCIDENT_FRAME',title:'incident',source:'DRIVE_RECORDING',relatedComponent:'VehiclePhysics',relatedRequirementIds:[],relatedTestCaseIds:[],reference:{frameId:1},discovered:true,selectedForReport:false,status:'OBSERVED',claim:'actual vehicle response'},
 {id:'signal:VMC:DriveTorqueRequest:1',type:'SIGNAL_COMPARISON',title:'normal',source:'DRIVE_RECORDING',relatedComponent:'VMC',relatedRequirementIds:[],relatedTestCaseIds:[],reference:{frameId:1},discovered:true,selectedForReport:false,status:'MATCH',claim:'last normal'},
 {id:'signal:eDrive:EDriveCommand:1',type:'SIGNAL_COMPARISON',title:'abnormal',source:'DRIVE_RECORDING',relatedComponent:'eDrive',relatedRequirementIds:[],relatedTestCaseIds:[],reference:{frameId:1},discovered:true,selectedForReport:false,status:'MISMATCH',claim:'first abnormal'},
 {id:'test:1',type:'TEST_RESULT',title:'proof 1',source:'C_WASM',relatedComponent:'eDrive',relatedRequirementIds:['SWR-EDR-001'],relatedTestCaseIds:[],reference:{runId:1},discovered:true,selectedForReport:false,status:'MISMATCH',claim:'formal mismatch',details:{executionMode:'COMPONENT_MODEL_TEST'}},
 {id:'test:2',type:'TEST_RESULT',title:'proof 2',source:'C_WASM',relatedComponent:'eDrive',relatedRequirementIds:['SWR-EDR-001'],relatedTestCaseIds:[],reference:{runId:2},discovered:true,selectedForReport:false,status:'MISMATCH',claim:'formal mismatch',details:{executionMode:'COMPONENT_MODEL_TEST'}},
]
const run=(id,input)=>({id,title:'run',source:'C_WASM',variant:1,testObject:'eDrive',options:{variable:'magnitude',direction:'FORWARD',validity:'VALID',speed:0},rows:[{id:`row-${id}`,input,direction:'FORWARD',expected:input,actual:input*.5,pass:false,requirement:'SWR-EDR-001'}]})

test('three gameplay clues require saved evidence, explicit boundary marks and formal sufficiency',()=>{
 let session=initialInvestigationSession()
 let progress=deriveGameplayInvestigation(session,evidence,propulsionCaseDefinition,[],[run(1,45),run(2,90)])
 assert.deepEqual(progress.clues.map(item=>item.unlocked),[false,false,false])
 for(const evidenceId of evidence.map(item=>item.id))session=investigationSessionReducer(session,{type:'COLLECT_EVIDENCE',evidenceId})
 progress=deriveGameplayInvestigation(session,evidence,propulsionCaseDefinition,[],[run(1,45),run(2,90)])
 assert.deepEqual(progress.clues.map(item=>item.unlocked),[true,false,true],'boundary cannot unlock from collection alone')
 session=investigationSessionReducer(session,{type:'MARK_BOUNDARY',kind:'LAST_NORMAL',evidenceId:evidence[1].id})
 session=investigationSessionReducer(session,{type:'MARK_BOUNDARY',kind:'FIRST_ABNORMAL',evidenceId:evidence[2].id})
 progress=deriveGameplayInvestigation(session,evidence,propulsionCaseDefinition,[],[run(1,45),run(2,90)])
 assert.equal(progress.rootCauseUnlocked,true)
 assert.equal(progress.suspects.find(item=>item.id==='VMC')?.status,'ELIMINATED')
 assert.equal(progress.suspects.find(item=>item.id==='eDrive')?.status,'SUPPORTED')
})

test('hint progression records assisted only for the strongest hint',()=>{
 useIncidentRace.getState().reset()
 useIncidentRace.getState().recordHint(1);useIncidentRace.getState().recordHint(2)
 assert.equal(useIncidentRace.getState().assisted,false)
 useIncidentRace.getState().recordHint(3)
 assert.equal(useIncidentRace.getState().assisted,true)
})

test('incident loss is a separate monotonic gameplay clock',()=>{
 useIncidentRace.getState().reset()
 useIncidentRace.getState().start(9.5,1000)
 useIncidentRace.getState().tick(1250)
 useIncidentRace.getState().tick(1500)
 useIncidentRace.getState().stop()
 assert.equal(useIncidentRace.getState().incidentStartRaceSeconds,9.5)
 assert.equal(useIncidentRace.getState().incidentTimeLossSeconds,.5)
 assert.equal(useIncidentRace.getState().diagnosisDurationSeconds,.5)
})

test('P0 UI keeps root cause gated and returns to race after verified repair',async()=>{
 const conclusion=await readFile(new URL('../src/ui/investigation/pages/Page4Conclusion.tsx',import.meta.url),'utf8')
 const workspace=await readFile(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
 const raceHud=await readFile(new URL('../src/ui/components/RaceHUD.tsx',import.meta.url),'utf8')
 assert.match(conclusion,/aria-disabled=\{!rootCauseUnlocked\}/)
 assert.match(conclusion,/chooseLocked/)
 assert.match(conclusion,/현재 단서 찾으러 가기/)
 assert.match(workspace,/deriveGameplayInvestigation/)
 assert.match(workspace,/window\.setTimeout\(\(\)=>completeInvestigation\('race'\),850\)/)
 assert.match(raceHud,/incidentStart\+incidentLoss\+recoveryTime/)
})

test('verified recovery uses the existing safe map spawn without resetting the submitted incident',async()=>{
 const runtime=await readFile(new URL('../src/runtime/SimulationRuntime.ts',import.meta.url),'utf8')
 const start=runtime.slice(runtime.indexOf('startRecoveryChallenge(){'),runtime.indexOf('retryRecoveryChallenge(){'))
 assert.match(start,/resetLogicalState\(false\)/,'submitted incident state must be preserved')
 assert.match(start,/physics\?\.reset\(\)/,'recovery must use the existing physics spawn contract')
 assert.doesNotMatch(start,/incident\?\.reset\(\)/,'the same incident must not be re-armed')
})

test('verification workspace keeps requirement-based TC setup left and vehicle observation right',async()=>{
 const page=await readFile(new URL('../src/ui/investigation/pages/Page3Verification.tsx',import.meta.url),'utf8')
 const scenario=await readFile(new URL('../src/ui/investigation/pages/VehicleScenarioWorkbench.tsx',import.meta.url),'utf8')
 assert.match(page,/verification-setup-column/)
 assert.match(page,/verification-result-column/)
 assert.match(page,/요구사항을 기준으로 정상·비정상 TC를 구성합니다/)
 assert.match(page,/테스트케이스 설계 방법/)
 assert.match(page,/useState<TestDesignTechnique>\('REQUIREMENTS_ANALYSIS'\)/)
 assert.ok(scenario.indexOf('scenario-live-viewport')<scenario.indexOf('차량 반응 결과'),'viewport must be the first result element')
})
