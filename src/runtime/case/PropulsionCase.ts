import { defaultExperimentOptions, executeExperiment, validateExperiment, type ExperimentOptions } from './CaseExperiment.ts'
import type { VehicleSwInput, VehicleSwSnapshot } from '../c/VehicleSwPort.ts'
import type { VehicleState } from '../../domain/vehicle/VehicleState.ts'
import type { VehiclePhysicsCommand } from '../../domain/vehicle/VehiclePhysicsPort.ts'
import type { WasmVehicleSw } from '../c/WasmVehicleSw.ts'
import { propulsionCaseDefinition } from '../../runtime/investigation/CaseDefinition.ts'
import type { Evidence, RootCauseReport, EvidenceAssessment } from '../../runtime/investigation/Evidence.ts'
import { architectureNodes } from '../../registries/investigation/Architecture.ts'
import { getRequirementsForComponent, getTestCase, traceRequirements } from '../../registries/investigation/Trace.ts'
import { inspectBoundary } from '../../runtime/investigation/Boundary.ts'
import { assessEvidence } from '../../runtime/investigation/Assessment.ts'
import type { PlayerHypothesis } from '../../runtime/investigation/InvestigationSession.ts'
import { compareSignalAtFrame } from '../../runtime/investigation/SignalComparison.ts'
import type { VerificationRunMetadata } from '../../runtime/investigation/Verification.ts'
import type { VehicleScenarioRun } from '../scenario/VehicleScenario.ts'

export type CaseVariant = 0 | 1 | 2 | 3
export interface IncidentFrame {
  id: number; sw: VehicleSwSnapshot; plant: VehicleState | null
  command: VehiclePhysicsCommand | null; brake: number; steering: number
}
export interface TestResult {
  id: string; input: number | string; direction: string; expected: number | string; actual: number | string
  pass: boolean; requirement: string
}
export interface ExperimentRun { id: number; title: string; rows: TestResult[]; source: 'C_WASM'; variant: CaseVariant; testObject: 'VMC' | 'eDrive'; options?: ExperimentOptions; testCaseId?:string; assertionScope?:'MAGNITUDE'; verification?:VerificationRunMetadata }
export interface Diagnosis { component: string; mechanism: string; requirement: string; frameId: number; testRunId: number; correct: boolean; evidenceSufficient: boolean; report?:RootCauseReport; assessment?:EvidenceAssessment; requirementIds?:string[] }
export interface CaseState {
  phase: 'DRIVING' | 'CAPTURED' | 'SUBMITTED' | 'RESOLVED'
  frames: readonly IncidentFrame[]; selected: number; pinned: number | null
  source: 'DRIVE_RECORDING' | 'STANDARD_TEST'; elapsed: number
  experiments: readonly ExperimentRun[]; experiment: ExperimentRun | null; repairs: readonly ExperimentRun[]; diagnosis: Diagnosis | null
  diagnosisHistory:readonly Diagnosis[]
  evidence: readonly Evidence[]; hypothesis:PlayerHypothesis|null; vehicleScenarioRuns:readonly VehicleScenarioRun[]
  assisted:boolean
}
const initial = (): CaseState => ({ phase: 'DRIVING', frames: [], selected: 0, pinned: null, source: 'DRIVE_RECORDING', elapsed: 0, experiments: [], experiment: null, repairs: [], diagnosis: null, diagnosisHistory:[], evidence:[],hypothesis:null,vehicleScenarioRuns:[],assisted:false })
const baseInput: VehicleSwInput = { acceleratorPedalPosition: .5, acceleratorPedalValidity: 'VALID', gearRequest: 'D', gearRequestValidity: 'VALID', vehicleReady: true, propulsionEnable: true, longitudinalVelocity: 0, vehicleSpeed: 0 }

/** Case orchestration only: all observed component results execute in isolated C instances. */
export class PropulsionCase {
  readonly definition = propulsionCaseDefinition
  private state = initial()
  private listeners = new Set<() => void>()
  private ring: IncidentFrame[] = []
  private elapsed = 0
  private qualifying = 0
  private normalExposure = 0
  private post = 0
  private active = false
  private serial = 0
  private factory: () => WasmVehicleSw
  readonly buildHash: string
  readonly limits: { forward: number; reverse: number }
  constructor(factory: () => WasmVehicleSw, buildHash: string, limits: { forward: number; reverse: number }) {
    this.factory = factory; this.buildHash = buildHash; this.limits = { ...limits }
  }
  readonly subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  readonly getSnapshot = () => this.state
  /** Current case behavior for a live vehicle scenario; this is execution state, not a player-visible oracle. */
  vehicleScenarioVariant():CaseVariant{return this.active&&this.state.phase!=='RESOLVED'?1:0}
  private update(patch: Partial<CaseState>) { this.state = { ...this.state, ...patch }; this.listeners.forEach(fn => fn()) }
  reset() { this.ring = []; this.normalExposure = this.elapsed = this.qualifying = this.post = this.serial = 0; this.active = false; this.state = initial(); this.listeners.forEach(fn => fn()) }
  /** Assisted walkthrough records a real executable test and supported diagnosis; repair remains a separate player decision. */
  completeGuidedResolution() {
    if(this.state.phase==='SUBMITTED')this.update({phase:'CAPTURED',diagnosis:null,repairs:[]})
    if(this.state.phase!=='CAPTURED')return
    this.select(this.state.frames.length-1);this.pin()
    this.runExperiment(45,90,'eDrive')
    this.collectTest(this.state.experiment!.id)
    this.submit('eDrive','scaling','SWR-EDR-001')
    this.update({assisted:true})
  }
  beforeStep(input: VehicleSwInput, brake: number, steering: number, dt: number): CaseVariant {
    if (this.state.phase === 'RESOLVED') return 0
    if (this.state.phase !== 'DRIVING') return this.active ? 1 : 0
    this.elapsed += dt
    // Full keyboard pedal is allowed: no hidden 0.8 upper bound preventing the incident.
    const eligible = input.gearRequest === 'D' && input.vehicleReady && input.propulsionEnable && input.acceleratorPedalValidity === 'VALID'
      && input.gearRequestValidity === 'VALID' && input.acceleratorPedalPosition >= .2 && brake <= .01 && Math.abs(steering) <= .35 && input.vehicleSpeed >= .3
    this.qualifying = eligible ? this.qualifying + dt : 0
    if (!this.active && eligible) this.normalExposure += dt
    if (!this.active && this.normalExposure >= 5 && this.qualifying >= .75) this.active = true
    if (this.active) this.post += dt
    return this.active ? 1 : 0
  }
  afterStep(sw: VehicleSwSnapshot, plant: VehicleState, command: VehiclePhysicsCommand, brake: number, steering: number): boolean {
    if (this.state.phase !== 'DRIVING') return false
    this.ring.push(structuredClone({ id: sw.step, sw, plant, command, brake, steering }))
    if (this.ring.length > 900) this.ring.shift()
    if (this.active && this.post >= 2) {
      const frames = this.ring.slice(-420)
      this.update({ phase: 'CAPTURED', frames, selected: frames.length - 1, elapsed: this.elapsed })
      return true
    }
    if (sw.step % 60 === 0) this.update({ elapsed: this.elapsed })
    return false
  }
  select(index: number) { if (this.state.frames.length) this.update({ selected: Math.max(0, Math.min(this.state.frames.length - 1, Math.round(index))) }) }
  pin() { const frame = this.state.frames[this.state.selected]; if (frame && !this.state.diagnosis) this.update({ pinned: frame.id }) }
  /** Explicit fallback fixture: no invented vehicle video, no mutation of driving physics. */
  reproduce() {
    if (this.state.phase !== 'DRIVING') return
    const core = this.factory(); const frames: IncidentFrame[] = []
    for (let i = 0; i < 300; i++) {
      core.setCaseVariant(i < 180 ? 0 : 1)
      const input = { ...baseInput }
      const output = core.step(input)
      frames.push({ id: i + 1, sw: { source: 'C_WASM', step: i + 1, executionTime: i / 60, periodSeconds: 1 / 60, input, output,
        calibrationReference: 'TRACKBACK_SIMULATION_CALIBRATION_V0_1', calibration: core.readCalibration() }, plant: null, command: null, brake: 0, steering: 0 })
    }
    this.active = true
    this.update({ phase: 'CAPTURED', frames, selected: frames.length - 1, source: 'STANDARD_TEST' })
  }
  runExperiment(first: number, second: number | undefined, testObject: 'VMC' | 'eDrive' = 'eDrive', options = defaultExperimentOptions(), verification?:VerificationRunMetadata) {
    if (this.state.phase !== 'CAPTURED') throw new Error('주행 데이터를 먼저 확보하십시오.')
    const values = second === undefined ? [first] : [first, second]
    validateExperiment(testObject, values, options)
    const core = this.factory(); core.setCaseVariant(1)
    const rows = values.map((input, i): TestResult => ({
      id: 'PAIR-' + (i + 1), input, direction: options.direction,
      ...executeExperiment(core, testObject, input, options),
      requirement: testObject === 'VMC' ? 'SWR-VMC-001' : 'SWR-EDR-001',
    }))
    const experiment: ExperimentRun = { id: ++this.serial, title: verification?.designOrigin==='EXISTING_TEST_CASE'?'기존 시험 케이스 실행':'플레이어 설계 실험', rows, source: 'C_WASM', variant: 1, testObject, options: { ...options }, testCaseId:verification?.existingTestCaseId,assertionScope:'MAGNITUDE',verification:verification?structuredClone(verification):undefined }
    this.update({ experiment, experiments: [...this.state.experiments, experiment] })
  }
  selectExperiment(id: number) {
    if (this.state.diagnosis) return
    const experiment = this.state.experiments.find(run => run.id === id)
    if (experiment) this.update({ experiment })
  }
  private discover(e:Evidence) {
    if(this.state.diagnosis)return
    if(!this.state.evidence.some(old=>old.id===e.id))this.update({evidence:[...this.state.evidence,e]})
  }
  inspect(component:string) {
    if(!architectureNodes.some(n=>n.id===component&&n.implementation==='IMPLEMENTED'))return
    const index=this.state.selected,frame=this.state.frames[index];if(!frame)return
    const observation=inspectBoundary(frame,component,this.state.frames[index-1])
    const reqs=getRequirementsForComponent(component)
    this.discover({id:`boundary:${component}:${frame.id}`,type:'SIGNAL_BOUNDARY',title:`${component} 경계 · ${frame.sw.executionTime.toFixed(3)} s`,source:this.state.source,relatedComponent:component,relatedRequirementIds:reqs.map(r=>r.id),relatedTestCaseIds:[...new Set(reqs.flatMap(r=>r.linkedTestCases))],reference:{frameId:frame.id},discovered:true,selectedForReport:false,status:observation.status,claim:observation.status==='MISMATCH'?'이 기능의 입력으로 계산한 Expected와 실제 출력이 다릅니다.':observation.status==='MATCH'?'이 기능의 출력이 계산 가능한 Expected와 일치합니다.':'이 기능 경계는 관찰했지만 현재 정보만으로 정상/이상을 판정할 수 없습니다.',details:{subjectId:component,role:'OBSERVATION',timestamp:frame.sw.executionTime,actual:JSON.stringify(observation.actual),criterionKind:observation.expected===null?'NONE':'EXPECTED',criterionLabel:observation.expected===null?'판정 기준 없음':'기능 Expected',criterionValue:observation.expected===null?'—':JSON.stringify(observation.expected),interpretation:observation.note}})
    return observation
  }
  saveSignalEvidence(component:string,signalId:string) {
    if(this.state.diagnosis)return
    const index=this.state.selected,frame=this.state.frames[index];if(!frame)return
    const comparison=compareSignalAtFrame(signalId,component,frame,this.state.frames[index-1]);if(!comparison)return
    const type=comparison.status==='OBSERVED'?'SIGNAL_OBSERVATION':'SIGNAL_COMPARISON'
    const id=`signal:${component}:${signalId}:${frame.id}`
    this.discover({id,type,title:`${signalId} · ${frame.sw.executionTime.toFixed(3)} s`,source:this.state.source,relatedComponent:component,relatedRequirementIds:comparison.requirementIds,relatedTestCaseIds:[],reference:{frameId:frame.id},discovered:true,selectedForReport:false,status:comparison.status,claim:comparison.interpretation,details:{subjectId:signalId,role:comparison.role,timestamp:comparison.timestamp,actual:comparison.actual,criterionKind:comparison.criterionKind,criterionLabel:comparison.criterionLabel,criterionValue:comparison.criterionValue,interpretation:comparison.interpretation,returnContext:{page:2,view:'SIGNALS',componentId:component,signalId,frameIndex:index}}})
    return {id,comparison}
  }
  saveIncidentObservation() {
    if(this.state.diagnosis)return
    const index=this.state.selected,frame=this.state.frames[index];if(!frame)return
    const id=`incident:${frame.id}`
    this.discover({id,type:'INCIDENT_FRAME',title:`사건 차량 반응 · ${frame.sw.executionTime.toFixed(3)} s`,source:this.state.source,relatedComponent:'VehiclePhysics',relatedRequirementIds:this.definition.incidentRequirementIds,relatedTestCaseIds:[],reference:{frameId:frame.id},discovered:true,selectedForReport:false,status:'OBSERVED',claim:'가속 입력에 비해 차량 반응이 약하다는 Actual 사건 기록입니다. Expected trajectory가 없어 정상/이상과 첫 차이 시점은 판정하지 않습니다.',details:{subjectId:'VehicleSpeed',role:'OBSERVATION',timestamp:frame.sw.executionTime,actual:String(frame.plant?.speed??frame.sw.input.vehicleSpeed),criterionKind:'NONE',criterionLabel:'Expected trajectory 미등록',criterionValue:'판정 불가',interpretation:'원인 위치가 아니라 조사의 출발점인 차량 반응 관찰입니다.',returnContext:{page:1,frameIndex:index}}})
    return id
  }
  collectTest(runId:number) {
    const run=this.state.experiments.find(r=>r.id===runId);if(!run)return
    const passed=run.rows.every(r=>r.pass)
    const testCaseId=run.testCaseId
    const requirementIds=testCaseId?traceRequirements(testCaseId).map(r=>r.id):run.verification?.requirementId?[run.verification.requirementId]:getRequirementsForComponent(run.testObject).filter(item=>item.level==='SOFTWARE').map(item=>item.id)
    const subjectId=testCaseId??`EXPERIMENT-${runId}`
    this.discover({id:`test:${runId}`,type:'TEST_RESULT',title:`${testCaseId??'PLAYER EXPERIMENT'} · 시험 #${runId}`,source:'C_WASM',relatedComponent:run.testObject,relatedRequirementIds:requirementIds,relatedTestCaseIds:testCaseId?[testCaseId]:[],reference:{runId,...(testCaseId?{testCaseId}:{})},discovered:true,selectedForReport:false,status:passed?'MATCH':'MISMATCH',claim:passed?'선택한 조건에서 시험 출력이 Expected를 만족했습니다.':'선택한 조건에서 시험 출력이 Expected를 만족하지 않았습니다.',details:{subjectId,role:'OUTPUT',actual:run.rows.map(row=>String(row.actual)).join(' / '),criterionKind:'EXPECTED',criterionLabel:'시험 Expected',criterionValue:run.rows.map(row=>String(row.expected)).join(' / '),interpretation:passed?'이 시험 범위의 동작은 합격 기준과 일치합니다.':'이 시험은 해당 동작의 요구사항 위반을 보여주지만 근본 원인을 확정하지는 않습니다.',hypothesisId:run.verification?.hypothesisId,targetType:run.verification?.target.type??'FUNCTION',targetId:run.verification?.target.id??run.testObject,verificationMethod:run.verification?.method??'INPUT_VARIATION',executionMode:run.verification?.executionMode??'COMPONENT_MODEL_TEST',designTechnique:run.verification?.designTechnique,designOrigin:run.verification?.designOrigin??'PLAYER_DESIGNED_EXPERIMENT',preconditions:run.verification?.preconditions,stimulus:run.verification?.stimulus,monitoredOutputIds:run.verification?.monitoredOutputIds??[run.testObject==='eDrive'?'EDriveCommand':'DriveTorqueRequest'],expectedCriterion:run.verification?.expectedCriterion??'컴포넌트 오라클 Expected',verdict:passed?'PASS':'FAIL',runIndex:run.id,variationGroupId:run.verification?.variationGroupId}})
  }
  recordVehicleScenario(run:VehicleScenarioRun){
    if(this.state.vehicleScenarioRuns.some(item=>item.runId===run.runId))return
    this.update({vehicleScenarioRuns:[...this.state.vehicleScenarioRuns,structuredClone(run)]})
  }
  collectVehicleScenario(scenarioId:string){
    const run=this.state.vehicleScenarioRuns.find(item=>item.runId===scenarioId);if(!run)return
    const definition=run.definition
    const final=run.samples.at(-1)
    const hasFault=Boolean(definition.faultInjection)
    const isInterface=definition.verification?.method==='INTERFACE_COMPARISON'||definition.scope.targetType==='INTERFACE_BOUNDARY'
    this.discover({id:`scenario:${scenarioId}`,type:'TEST_RESULT',title:`${definition.name} · ${scenarioId}`,source:'LIVE_VEHICLE_SCENARIO',relatedComponent:definition.scope.targetId,relatedRequirementIds:definition.expectedCriterion?.requirementId?[definition.expectedCriterion.requirementId]:[],relatedTestCaseIds:[],reference:{scenarioId},discovered:true,selectedForReport:false,status:run.verdict==='PASS'?'MATCH':run.verdict==='FAIL'?'MISMATCH':'OBSERVED',claim:hasFault?`실제 차량 런타임의 ${definition.faultInjection!.injectionPointId}에서 ${definition.faultInjection!.faultType}을 적용하고 원본값·전달값·복구를 관찰했습니다.`:isInterface?`실제 ${definition.scope.targetId} 경계의 독립 Source/Destination endpoint를 같은 fixed tick에서 비교했습니다.`:`실제 차량 런타임에 ${definition.stimuli.map(item=>item.target.label).join(', ')} 입력을 적용하고 ${definition.monitors.length}개 값을 동일 시간축에서 관찰했습니다.`,details:{subjectId:definition.scope.targetId,role:isInterface?'INTERFACE':'OBSERVATION',interval:{start:definition.observationWindow.startSeconds,end:definition.observationWindow.endSeconds},actual:final?JSON.stringify(final.values):'기록 없음',criterionKind:isInterface?'SOURCE_DESTINATION':definition.expectedCriterion?.kind==='REQUIREMENT'?'REQUIREMENT_CONDITION':'NONE',criterionLabel:isInterface?'동일 fixed tick 양단 비교':definition.expectedCriterion?.kind==='REQUIREMENT'?'요구사항 기반':'관찰 전용',criterionValue:isInterface?run.interfaceComparison:definition.expectedCriterion?.description??'Expected trajectory 없음',interpretation:run.interpretation,hypothesisId:definition.verification?.hypothesisId,targetType:definition.scope.targetType,targetId:definition.scope.targetId,verificationMethod:definition.verification?.method??'VEHICLE_RESPONSE_OBSERVATION',executionMode:'VEHICLE_SCENARIO_TEST',designTechnique:definition.verification?.designTechnique,designOrigin:'VEHICLE_SCENARIO_TEST',preconditions:[`Gear=${definition.preconditions.gear}`,definition.preconditions.vehicleAtRest?'Vehicle at rest':'Current vehicle state'],stimulus:definition.stimuli,monitoredOutputIds:definition.monitors,expectedCriterion:definition.expectedCriterion?.description??'관찰 전용 — 판정 없음',verdict:run.verdict,scenarioId,timing:{durationSeconds:definition.durationSeconds,observationStartSeconds:definition.observationWindow.startSeconds,observationEndSeconds:definition.observationWindow.endSeconds,fixedTimestepSeconds:run.fixedTimestepSeconds},faultInjection:definition.faultInjection?structuredClone(definition.faultInjection):undefined,faultTelemetry:structuredClone(run.faultTelemetry),interfaceTelemetry:structuredClone(run.interfaceTelemetry),interfaceComparison:run.interfaceComparison,replayContext:{definition:structuredClone(definition)}}})
  }
  discoverReference(type:'REQUIREMENT'|'TEST_CASE',id:string,component:string,reqs:string[],tests:string[]) {
    const requirement=type==='REQUIREMENT'?getRequirementsForComponent(component).find(item=>item.id===id):undefined
    const conditions=tests.map(getTestCase).map(test=>test?.precondition).filter(Boolean).join(' / ')
    this.discover({id:`${type}:${id}`,type,title:id,source:'GROUND_TRUTH',relatedComponent:component,relatedRequirementIds:reqs,relatedTestCaseIds:tests,reference:type==='REQUIREMENT'?{requirementId:id}:{testCaseId:id},discovered:true,selectedForReport:false,status:'REFERENCE',claim:requirement?`${requirement.statement}`:`${id} 검증 기준`,details:{subjectId:id,role:'OBSERVATION',criterionKind:'REQUIREMENT_CONDITION',criterionLabel:'요구사항 기준',criterionValue:requirement?.statement??id,condition:conditions||'등록된 적용 조건은 요구사항 상세에서 확인',expectedBehavior:requirement?.statement,allocatedFunction:component,relatedTestCaseIds:tests,interpretation:'이 조건에서 원래 어떻게 동작해야 하는지 정의하는 기준입니다.',returnContext:{page:2,view:'STANDARDS',componentId:component,requirementId:type==='REQUIREMENT'?id:undefined}}})
  }
  selectEvidence(id:string,selectedForReport:boolean) {if(!this.state.diagnosis)this.update({evidence:this.state.evidence.map(e=>e.id===id?{...e,selectedForReport}:e)})}
  setHypothesis(hypothesis:PlayerHypothesis|null) {if(!this.state.diagnosis)this.update({hypothesis:hypothesis?structuredClone(hypothesis):null})}
  submitReport(report:RootCauseReport) {
    if(this.state.diagnosis)throw new Error('첫 제출은 보존됩니다.')
    const selected=this.state.evidence.filter(e=>report.evidenceIds.includes(e.id)&&e.discovered)
    if(!selected.length||selected.length!==new Set(report.evidenceIds).size)throw new Error('직접 확보한 근거를 선택하십시오.')
    const root=this.definition.rootCause
    const assessment=assessEvidence(this.definition,selected,this.state.frames,this.state.experiments)
    const correct=report.faultLocation===root.location&&report.failureType===root.failureType&&(!report.detailedCause||report.detailedCause===root.detailedCause)
    const formalEvidence=selected.filter(e=>e.type==='TEST_RESULT'||e.type==='TEST_CASE')
    const requirementIds=[...new Set(formalEvidence.flatMap(e=>[...e.relatedRequirementIds,...e.relatedTestCaseIds.flatMap(id=>traceRequirements(id).map(r=>r.id))]))]
    const frameId=selected.find(e=>e.type==='SIGNAL_BOUNDARY')?.reference.frameId??0
    const testRunId=selected.find(e=>e.type==='TEST_RESULT')?.reference.runId??0
    const diagnosis={component:report.faultLocation,mechanism:report.detailedCause??report.failureType,requirement:requirementIds.join(', '),frameId,testRunId,correct,evidenceSufficient:assessment.sufficient,report:structuredClone(report),assessment,requirementIds}
    this.update({phase:'SUBMITTED',evidence:this.state.evidence.map(e=>({...e,selectedForReport:report.evidenceIds.includes(e.id)})),pinned:frameId,diagnosis,diagnosisHistory:[...this.state.diagnosisHistory,diagnosis]})
  }
  retryDiagnosis() {
    if (!this.state.diagnosis || (this.state.diagnosis.correct&&this.state.diagnosis.evidenceSufficient)) return
    this.update({ phase:'CAPTURED', diagnosis:null, repairs:[] })
  }
  submit(component: string, mechanism: string, requirement: string) {
    if (this.state.diagnosis) throw new Error('첫 제출은 보존됩니다.')
    const frame = this.state.frames.find(f => f.id === this.state.pinned)
    const experiment = this.state.experiment
    if (!frame || !experiment) throw new Error('주행 시점을 선택하고 재현 시험을 실행하세요.')
    // Compatibility seam for the previous screen/tests. All verdicts use the case definition.
    const compatibilityBoundary=this.inspect(component)
    for(const run of this.state.experiments.filter(run=>run.testObject===experiment.testObject&&JSON.stringify(run.options)===JSON.stringify(experiment.options)))this.collectTest(run.id)
    const evidenceIds=this.state.evidence.filter(e=>e.type==='TEST_RESULT'||(e.type==='SIGNAL_BOUNDARY'&&e.reference.frameId===frame.id&&e.relatedComponent===component)).map(e=>e.id)
    for(const id of evidenceIds)this.selectEvidence(id,true)
    this.submitReport({faultLocation:component,failureType:'LOGIC_CALCULATION',detailedCause:({scaling:'INCORRECT_SCALING',limit:'INCORRECT_LIMIT',direction:'INCORRECT_DIRECTION'} as Record<string,string>)[mechanism]??mechanism,evidenceIds})
    this.update({diagnosis:{...this.state.diagnosis!,requirement,frameId:frame.id,testRunId:experiment.id,correct:this.state.diagnosis!.correct&&this.definition.rootCause.requirementIds.includes(requirement),evidenceSufficient:this.state.diagnosis!.evidenceSufficient&&compatibilityBoundary?.status==='MISMATCH'}})
  }
  runRepair(variant: 0 | 2 | 3) {
    if (!this.state.diagnosis || this.state.phase === 'RESOLVED') throw new Error('원인 제출 후 수정안을 시험하세요.')
    const core = this.factory(); core.setCaseVariant(variant)
    const rows: TestResult[] = []
    const evidenceRunIds=this.state.diagnosis.report?new Set(this.state.evidence.filter(e=>this.state.diagnosis!.report!.evidenceIds.includes(e.id)).map(e=>e.reference.runId)):null
    const previousRuns=evidenceRunIds?this.state.experiments.filter(r=>evidenceRunIds.has(r.id)):(this.state.experiment?[this.state.experiment]:[])
    for (const previous of previousRuns) for (const row of previous.rows) {
      const value = Number(row.input)
      const actual = executeExperiment(core, previous.testObject, value, previous.options ?? defaultExperimentOptions()).actual
      rows.push({ ...row, id: 'RECHECK-' + previous.testObject + '-' + previous.id + '-' + row.id, actual, pass: Math.abs(actual - Number(row.expected)) <= 1e-6 })
    }
    for (const [direction, inputs, limit] of [
      ['FORWARD', [0, 45, 90, 179, 180, 181, 600], this.limits.forward],
      ['REVERSE', [129, 130, 131, 400], this.limits.reverse],
    ] as const) for (const input of inputs) {
      const actual = core.verifyEDrive(input, direction, 'VALID')
      const expected = Math.min(input, limit)
      rows.push({ id: `${direction}-${input}`, input, direction, expected, actual: actual.magnitudeNm,
        pass: Math.abs(actual.magnitudeNm - expected) <= 1e-6 && actual.direction === (input === 0 ? 'NONE' : direction) && actual.validity === 'VALID', requirement: 'SWR-EDR-001' })
    }
    const invalid = core.verifyEDrive(90, 'FORWARD', 'INVALID')
    rows.push({ id: 'INVALID', input: '90 Nm / INVALID', direction: 'FORWARD', expected: '0 / NONE / INVALID', actual: `${invalid.magnitudeNm} / ${invalid.direction} / ${invalid.validity}`, pass: invalid.magnitudeNm === 0 && invalid.direction === 'NONE' && invalid.validity === 'INVALID', requirement: '정상 baseline' })
    for (const gear of ['P', 'N', 'D', 'R'] as const) {
      core.reset(); core.setCaseVariant(variant)
      const result = core.step({ ...baseInput, gearRequest: gear })
      const expected = gear === 'D' ? 90 : gear === 'R' ? 65 : 0
      rows.push({ id: `GEAR-${gear}`, input: `pedal 0.5 / ${gear}`, direction: gear, expected, actual: result.eDriveCommand.magnitudeNm, pass: Math.abs(result.eDriveCommand.magnitudeNm - expected) <= 1e-6 && result.eDriveCommand.direction === (gear === 'D' ? 'FORWARD' : gear === 'R' ? 'REVERSE' : 'NONE'), requirement: 'SWR-PROP-004' })
    }
    core.reset(); core.setCaseVariant(variant)
    const disabled = core.step({ ...baseInput, propulsionEnable: false })
    rows.push({ id: 'DISABLED', input: 'PropulsionEnable=false', direction: 'NONE', expected: 0, actual: disabled.eDriveCommand.magnitudeNm, pass: disabled.eDriveCommand.magnitudeNm === 0, requirement: 'SWR-PROP-001' })
    core.reset(); core.setCaseVariant(variant)
    const rejected = core.step({ ...baseInput, gearRequest: 'R', longitudinalVelocity: 1, vehicleSpeed: 1 })
    rows.push({ id: 'INTERLOCK', input: 'D → R / 1 m/s', direction: 'D', expected: 'D', actual: rejected.gearState, pass: rejected.gearState === 'D' && !rejected.transitionAccepted, requirement: 'SWR-GEAR-001' })
    const run: ExperimentRun = { id: ++this.serial, title: '수정 후 재현·회귀시험', rows, source: 'C_WASM', variant, testObject: 'eDrive' }
    this.update({ repairs: [...this.state.repairs, run], phase: rows.every(r => r.pass) ? 'RESOLVED' : 'SUBMITTED' })
    return run
  }
  report() { return { caseId: this.definition.id, version: this.definition.version, hypothesis:this.state.hypothesis, buildHash: this.buildHash, calibration: this.limits, recordSource: this.state.source, diagnosis: this.state.diagnosis, evidence:this.state.evidence, evidenceFrames:this.state.frames.filter(f=>this.state.evidence.some(e=>e.selectedForReport&&e.reference.frameId===f.id)), evidenceFrame: this.state.frames.find(f => f.id === this.state.pinned), experiment: this.state.experiment, experiments: this.state.experiments, repairs: this.state.repairs, phase: this.state.phase } }
}


