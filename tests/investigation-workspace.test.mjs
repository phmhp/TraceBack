import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { WasmVehicleSw } from '../src/runtime/c/WasmVehicleSw.ts'
import { PropulsionCase } from '../src/runtime/case/PropulsionCase.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'
import { inspectBoundary } from '../src/runtime/investigation/Boundary.ts'
import { assessEvidence } from '../src/runtime/investigation/Assessment.ts'
import { createInvestigationPresentationModel } from '../src/ui/investigation/presentation/InvestigationPresentationModel.ts'
import { deriveInvestigationMilestones, initialInvestigationSession } from '../src/runtime/investigation/InvestigationSession.ts'
import { getSignalObservation } from '../src/registries/investigation/Architecture.ts'
const module = await WebAssembly.compile(readFileSync(new URL('../src/runtime/c/generated/vehicle-sw.wasm', import.meta.url)))
const make = () => { const c = new PropulsionCase(()=>new WasmVehicleSw(module,cal),'test',{forward:180,reverse:130});c.reproduce();return c }
const collect = (c,value,options) => {c.runExperiment(value,undefined,'eDrive',options);c.collectTest(c.getSnapshot().experiment.id)}
const report = (c,type='LOGIC_CALCULATION',cause='INCORRECT_SCALING') => c.submitReport({faultLocation:'eDrive',failureType:type,detailedCause:cause,evidenceIds:c.getSnapshot().evidence.map(e=>e.id)})

test('workspace artifacts → two separate C experiments → RCA → corrective action → normal variant',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90)
 assert.equal(c.getSnapshot().evidence.length,3)
 report(c)
 const s=c.getSnapshot();assert.equal(s.diagnosis.correct,true);assert.equal(s.diagnosis.evidenceSufficient,true)
 assert.deepEqual(s.diagnosis.assessment.ratios,[.5,.5]);assert.ok(s.diagnosis.requirementIds.includes('SWR-EDR-001'))
 assert.equal(c.report().evidenceFrames.length,1)
 assert.equal(c.runRepair(2).rows.every(r=>r.pass),false)
 assert.equal(c.runRepair(3).rows.every(r=>r.pass),false)
 assert.equal(c.runRepair(0).rows.every(r=>r.pass),true)
 assert.equal(c.getSnapshot().phase,'RESOLVED')
 const f=s.frames.at(-1);assert.equal(c.beforeStep(f.sw.input,0,0,1/60),0)
 c.reset();assert.equal(c.getSnapshot().evidence.length,0)
})
test('correctness and sufficient evidence remain independent; calibration is not this cause',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90);report(c,'DATA_CALIBRATION','INCORRECT_CALIBRATION')
 assert.equal(c.getSnapshot().diagnosis.correct,false);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,true)
})
test('player hypothesis has one structured runtime synchronization boundary',()=>{
 const c=make();const hypothesis={target:'eDrive',signal:'DriveTorqueRequest',requirementId:'SWR-EDR-001',type:'계산 / 로직 오류'}
 c.setHypothesis(hypothesis);hypothesis.target='VMC'
 assert.equal(c.getSnapshot().hypothesis.target,'eDrive')
 assert.deepEqual(c.report().hypothesis,{target:'eDrive',signal:'DriveTorqueRequest',requirementId:'SWR-EDR-001',type:'계산 / 로직 오류'})
})
test('uncollected tests and unknown evidence cannot support report',()=>{
 const c=make();c.inspect('eDrive');c.runExperiment(45,90)
 assert.throws(()=>c.submitReport({faultLocation:'eDrive',failureType:'LOGIC_CALCULATION',detailedCause:'INCORRECT_SCALING',evidenceIds:['invented']}))
 report(c);assert.equal(c.getSnapshot().diagnosis.correct,true);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
})
for(const values of [[0,90],[45,45],[181,600]])test(`non-discriminating samples ${values} excluded`,()=>{
 const c=make();c.inspect('eDrive');for(const v of values)collect(c,v);report(c);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
})
test('different direction samples cannot establish same-direction repeated ratio',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90,{variable:'magnitude',magnitude:.5,speed:0,direction:'REVERSE',validity:'VALID'});report(c);assert.equal(c.getSnapshot().diagnosis.evidenceSufficient,false)
})
test('two FAIL values with inconsistent ratios are not sufficient',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90);const s=c.getSnapshot(),runs=structuredClone(s.experiments)
 runs[1].rows[0].actual=30
 assert.equal(assessEvidence(c.definition,[...s.evidence],s.frames,runs).sufficient,false)
})
test('local oracle distinguishes normal upstream from eDrive mismatch; missing previous gear is unknown',()=>{
 const c=make(),s=c.getSnapshot(),f=s.frames.at(-1),prev=s.frames.at(-2)
 assert.equal(inspectBoundary(f,'GearLogic',prev).status,'MATCH')
 assert.equal(inspectBoundary(f,'PropulsionFunction').status,'MATCH')
 assert.equal(inspectBoundary(f,'VMC').status,'MATCH')
 assert.equal(inspectBoundary(f,'eDrive').status,'MISMATCH')
 assert.equal(inspectBoundary(s.frames[0],'GearLogic').status,'OBSERVED')
})
test('oracle mismatch is not presented as player discovery before inspection',()=>{
 const c=make(),session=initialInvestigationSession(),milestones=deriveInvestigationMilestones(session)
 const hidden=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[])
 assert.equal(hidden.getNodeStatus('eDrive'),'UNINSPECTED')
 const discovered=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[{id:'finding:boundary:eDrive:300',kind:'BOUNDARY',subjectId:'eDrive',source:'INCIDENT_OBSERVATION',outcome:'MISMATCH'}])
 assert.equal(discovered.getNodeStatus('eDrive'),'DIFFERENCE_FOUND')
})

test('symptom-driven case opens with vehicle response only and no oracle expected value',()=>{
 const c=make(),session=initialInvestigationSession(),milestones=deriveInvestigationMilestones(session)
 const model=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[])
 assert.equal(model.startingObservation.origin,'SYMPTOM_DRIVEN')
 assert.equal(model.startingObservation.kind,'VEHICLE_RESPONSE')
 assert.equal(model.startingObservation.signalId,'VehicleSpeed')
 assert.equal(model.startingObservation.expected,undefined)
 assert.ok(model.startingObservation.samples.every(sample=>sample.expected===null))
})

test('class-level conclusion is graded without inventing a detailed mechanism',()=>{
 const c=make();c.inspect('eDrive');collect(c,45);collect(c,90)
 c.submitReport({faultLocation:'eDrive',failureType:'LOGIC_CALCULATION',evidenceIds:c.getSnapshot().evidence.map(e=>e.id)})
 assert.equal(c.getSnapshot().diagnosis.correct,true)
 assert.equal(c.getSnapshot().diagnosis.mechanism,'LOGIC_CALCULATION')
})

test('interface status comes only from discovered interface or carried-signal comparisons',()=>{
 const c=make(),session=initialInvestigationSession(),milestones=deriveInvestigationMilestones(session)
 const hidden=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[])
 assert.equal(hidden.getInterfaceEdges().find(edge=>edge.id==='VMC->eDrive').status,'UNINSPECTED')
 const nodeOnly=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[{id:'finding:boundary:VMC:300',kind:'BOUNDARY',subjectId:'VMC',source:'INCIDENT_OBSERVATION',outcome:'MISMATCH'}])
 assert.equal(nodeOnly.getInterfaceEdges().find(edge=>edge.id==='VMC->eDrive').status,'UNINSPECTED')
 const compared=createInvestigationPresentationModel(c.getSnapshot(),c.definition,null,milestones,[{id:'finding:signal:DriveTorqueRequest:300',kind:'SIGNAL',subjectId:'DriveTorqueRequest',source:'INCIDENT_OBSERVATION',outcome:'MATCH'}])
 assert.equal(compared.getInterfaceEdges().find(edge=>edge.id==='VMC->eDrive').status,'NO_DIFFERENCE')
})
test('signal observation distinguishes incident actual, oracle expected and absent recorded reference',()=>{
 const c=make(),frames=c.getSnapshot().frames,frame=frames.at(-1),previous=frames.at(-2)
 const observation=getSignalObservation('EDriveCommand',frame,previous)
 assert.equal(observation.actual.semantics,'INCIDENT_ACTUAL')
 assert.equal(observation.expected.semantics,'ORACLE_EXPECTED')
 assert.equal(observation.recordedReference,undefined)
 assert.notEqual(observation.actual.value,observation.expected.value)
})

test('investigation viewport clipping only trims overflow outside the sidebar',()=>{
 const source=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
 assert.match(source,/const clipBottom = Math\.max\(0, rect\.bottom - box\.bottom\)/)
 assert.doesNotMatch(source,/const clipBottom = Math\.max\(0, box\.bottom - rect\.bottom\)/)
})

test('investigation Back control participates in main-content layout flow',()=>{
 const source=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
 const css=readFileSync(new URL('../src/ui/investigation/investigation-layout.css',import.meta.url),'utf8')
 assert.match(source,/className="investigation-main-stack"/)
 assert.match(source,/className="investigation-back-row"/)
 assert.match(css,/\.investigation-back-row\s*{[^}]*display:\s*flex/s)
 const buttonRule=css.match(/\.investigation-back-btn\s*{([^}]*)}/s)?.[1]??''
 assert.doesNotMatch(buttonRule,/position:\s*absolute/)
})

test('Page 2 uses one canonical shared context instead of duplicate target controls',()=>{
 const page=readFileSync(new URL('../src/ui/investigation/pages/Page2Tracking.tsx',import.meta.url),'utf8')
 const context=readFileSync(new URL('../src/ui/investigation/pages/page2/Page2ContextBar.tsx',import.meta.url),'utf8')
 assert.match(page,/Page2ContextBar/)
 assert.doesNotMatch(page,/현재 조사 대상 기능/)
 assert.doesNotMatch(page,/component-path-selector-bar/)
 assert.match(context,/resolveInvestigationSelection/)
 assert.match(context,/현재 조사/)
 assert.doesNotMatch(context,/현재 지원 구조 보기/)
 assert.doesNotMatch(context,/사건 관련 경로/)
})

test('Page 1 follows phenomenon → testimony → context → recorded response without false abnormality',()=>{
 const page=readFileSync(new URL('../src/ui/investigation/pages/Page1Phenomenon.tsx',import.meta.url),'utf8')
 const sidebar=readFileSync(new URL('../src/ui/investigation/shell/InvestigationSidebar.tsx',import.meta.url),'utf8')
 const css=readFileSync(new URL('../src/ui/investigation/investigation-layout.css',import.meta.url),'utf8')
 assert.match(page,/FAULT REPORT/)
 assert.ok(page.indexOf('고장 현상')<page.indexOf('운전자 진술'))
 assert.ok(page.indexOf('운전자 진술')<page.indexOf('report-semantics-flow'))
 assert.ok(page.indexOf('report-semantics-flow')<page.indexOf('사건 당시 무엇을 요청했는가'))
 assert.match(page,/관찰된 차량 반응/)
 assert.match(page,/Expected가 없으므로 차이 크기와 첫 차이 발생 시점을 판단하지 않습니다/)
 assert.match(page,/createPortal/)
 assert.match(page,/signal-help-portal/)
 assert.doesNotMatch(page,/확인된 이상 신호|확인된 이상 관찰/)
 assert.match(page,/입력과 차량 반응 사이에서 어떤 기능부터 확인해야 할까요\?/)
 assert.equal((page.match(/원인 추적 시작 →/g)??[]).length,1)
 assert.doesNotMatch(page,/high-level-flow-chain/)
 assert.match(sidebar,/고장 시점/)
 assert.match(sidebar,/고장 현상/)
 assert.doesNotMatch(sidebar,/model\.symptomSummary/)
 assert.match(css,/\.fault-report \{[\s\S]*width: min\(100%, 840px\)/)
 assert.match(css,/font-variant-numeric: tabular-nums/)
})

test('function flow separates whole-vehicle architecture from selected canonical function detail',()=>{
 const view=readFileSync(new URL('../src/ui/investigation/pages/page2/ViewAFlow.tsx',import.meta.url),'utf8')
 const page=readFileSync(new URL('../src/ui/investigation/pages/Page2Tracking.tsx',import.meta.url),'utf8')
 assert.match(view,/LEVEL 1 · VEHICLE FUNCTIONAL ARCHITECTURE/)
 assert.match(view,/Vehicle State \/ Mode/)
 assert.match(view,/Propulsion/)
 assert.match(view,/Braking/)
 assert.match(view,/Steering/)
 assert.match(view,/ACTUATION BOUNDARY/)
 assert.match(view,/Vehicle Dynamics \/ Response/)
 assert.match(view,/shared-context-fanout/)
 assert.match(view,/상세 미지원/)
 assert.match(view,/LEVEL 2 · SELECTED FUNCTION FLOW/)
 assert.match(view,/getInputSignals\(node\.id\)/)
 assert.match(view,/getOutputSignals\(node\.id\)/)
 assert.doesNotMatch(view,/미조사/)
 assert.doesNotMatch(view,/구현 상태/)
 assert.doesNotMatch(view,/분류/)
 assert.match(page,/onNavigateToSignal=\{\(signalId\) => \{/)
 assert.match(page,/onNavigateToInterface=\{\(interfaceId\) => onNavigateContext\('INTERFACES'/)
 assert.match(page,/onNavigateToRequirement=\{\(requirementId\) => onNavigateContext\('STANDARDS'/)
})

test('signal comparison uses actual and expected semantics without fabricating a reference run',()=>{
 const view=readFileSync(new URL('../src/ui/investigation/pages/page2/ViewBSignals.tsx',import.meta.url),'utf8')
 assert.match(view,/통합 신호 분석/)
 assert.match(view,/Actual · 사건 기록/)
 assert.match(view,/판정 기준 미지원/)
 assert.match(view,/전체 선택/)
 assert.match(view,/monitor-hover-readout/)
 assert.match(view,/단위별 독립 스케일/)
 assert.match(view,/difference-region/)
 assert.match(view,/event-marker/)
 assert.match(view,/selected-time-marker/)
 assert.match(view,/onNavigateToComponent/)
 assert.match(view,/근거에 추가/)
 assert.doesNotMatch(view,/정상 주행/)
 assert.doesNotMatch(view,/참조 기록/)
})

test('interface tracing is graphical, signal-oriented and uses honest component requirement handoff',()=>{
 const view=readFileSync(new URL('../src/ui/investigation/pages/page2/ViewCInterfaces.tsx',import.meta.url),'utf8')
 const page=readFileSync(new URL('../src/ui/investigation/pages/Page2Tracking.tsx',import.meta.url),'utf8')
 assert.match(view,/function-port-diagram/)
 assert.match(view,/Source 기능 · 출력/)
 assert.match(view,/Destination 기능 · 입력/)
 assert.match(view,/선택 신호 경로/)
 assert.match(view,/getSignalInterfaces\(activeSignal\.id\)/)
 assert.match(view,/activeEdge\.signals\.map/)
 assert.match(view,/신호.*전달되는 값.*인터페이스.*연결 경계/s)
 assert.match(view,/이 연결 기능과 관련된 요구사항/)
 assert.doesNotMatch(view,/CAN|CAN ID|protocol|프로토콜|메시지/)
 assert.match(page,/onNavigateToSignal=\{\(id\) => onNavigateContext\('SIGNALS', \{ signalId:id \}/)
 assert.match(page,/onNavigateToRequirement=\{\(id\) => onNavigateContext\('STANDARDS', \{ requirementId:id \}/)
})

test('case path overlay remains separate from player-discovered mismatch styling',()=>{
 const view=readFileSync(new URL('../src/ui/investigation/pages/page2/ViewAFlow.tsx',import.meta.url),'utf8')
 assert.match(view,/relevantPath\.has\(id\) \? 'case-path-node'/)
 assert.match(view,/model\.getNodeStatus\(node\.id\) === 'DIFFERENCE_FOUND'/)
 assert.doesNotMatch(view,/relevantPath[^\n]*DIFFERENCE_FOUND/)
})

test('requirements, verification and conclusion are player-selectable and evidence-centered',()=>{
 const requirement=readFileSync(new URL('../src/ui/investigation/pages/page2/ViewDStandards.tsx',import.meta.url),'utf8')
 const verification=readFileSync(new URL('../src/ui/investigation/pages/Page3Verification.tsx',import.meta.url),'utf8')
 const conclusion=readFileSync(new URL('../src/ui/investigation/pages/Page4Conclusion.tsx',import.meta.url),'utf8')
 const workspace=readFileSync(new URL('../src/ui/investigation/InvestigationWorkspace.tsx',import.meta.url),'utf8')
 assert.match(requirement,/WHEN · 적용 조건/)
 assert.match(requirement,/WHAT · 기대 동작/)
 assert.match(requirement,/WHERE · 할당 기능/)
 assert.match(requirement,/HOW VERIFIED · 관련 TC/)
 assert.match(requirement,/requirement-tree/)
 assert.match(requirement,/tc\.execution\.status==='EXECUTABLE'\?'executable':'reference'/)
 assert.match(verification,/관련 요구사항 \/ Expected basis/)
 assert.match(verification,/role="radiogroup"/)
 assert.doesNotMatch(verification,/<select value=\{validity\}/)
 assert.match(verification,/REFERENCE_ONLY · 실행 불가/)
 assert.match(conclusion,/원인 확인 · 진단 성공/)
 assert.match(conclusion,/진단 불일치 · 재조사 필요/)
 assert.match(conclusion,/detailedCause:detailedUnlocked\?cause:undefined/)
 assert.match(conclusion,/cause-location-tree/)
 assert.doesNotMatch(conclusion,/<select value=\{target\}/)
 assert.match(workspace,/controller\.retryDiagnosis\(\)/)
 assert.match(workspace,/const guidedReview = \[/)
})

test('investigation starts without silently selecting a function and dependent tools explain selection',()=>{
 const session=initialInvestigationSession()
 const page=readFileSync(new URL('../src/ui/investigation/pages/Page2Tracking.tsx',import.meta.url),'utf8')
 assert.equal(session.context.selection.componentId,undefined)
 assert.match(page,/기능 흐름에서 선택/)
 assert.match(page,/requiresSelection/)
})
