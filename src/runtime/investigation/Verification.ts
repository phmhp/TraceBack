export type InvestigationTargetType =
  | 'DOMAIN_SCOPE'
  | 'FUNCTION'
  | 'SIGNAL'
  | 'INTERFACE_BOUNDARY'
  | 'STATE_MODE'
  | 'ACTUATION_PLANT'
  | 'TIMING_EXECUTION'

export interface InvestigationTarget {
  type: InvestigationTargetType
  id: string
  label?: string
  domainScope?: string
}

export interface StructuredInvestigationContext {
  domainScope?: string
  architectureNodeId?: string
  architectureEdgeId?: string
  target: InvestigationTarget
  observedReason?: string
  stateSignalIds: string[]
  inputSignalIds: string[]
  outputSignalIds: string[]
  interfaceIds: string[]
  requirementIds: string[]
  investigationNoteIds: string[]
  frameIndex?: number
}

export type VerificationMethod =
  | 'COMPONENT_OUTPUT_COMPARISON'
  | 'VEHICLE_RESPONSE_OBSERVATION'
  | 'REQUIREMENTS_BASED_TEST'
  | 'INPUT_VARIATION'
  | 'BOUNDARY_VALUE_ANALYSIS'
  | 'STATE_CONDITION_TEST'
  | 'INTERFACE_COMPARISON'
  | 'FAULT_INJECTION'
  | 'TIMING_EXECUTION_TEST'
  | 'BACK_TO_BACK_COMPARISON'
  | 'ERROR_GUESSING'

export type StimulusProfile =
  | { kind:'CONSTANT'; value:number|string|boolean }
  | { kind:'STEP'; from:number; to:number; atSeconds:number }
  | { kind:'RAMP_UP'|'RAMP_DOWN'; from:number; to:number; durationSeconds:number }
  | { kind:'PULSE'; value:number|string|boolean; durationSeconds:number }
  | { kind:'SEQUENCE'; values:readonly (number|string|boolean)[] }

export type ExecutionMode = 'COMPONENT_MODEL_TEST' | 'VEHICLE_SCENARIO_TEST'
export type TestDesignTechnique =
  | 'REQUIREMENTS_ANALYSIS'
  | 'EQUIVALENCE_CLASS_ANALYSIS'
  | 'BOUNDARY_VALUE_ANALYSIS'
  | 'ERROR_GUESSING'

export interface VerificationRunMetadata {
  method: VerificationMethod
  executionMode?:ExecutionMode
  designTechnique?:TestDesignTechnique
  designOrigin: 'EXISTING_TEST_CASE' | 'PLAYER_DESIGNED_EXPERIMENT'
  target: InvestigationTarget
  hypothesisId?: string
  requirementId?: string
  existingTestCaseId?: string
  stimulus: StimulusProfile
  monitoredOutputIds: string[]
  expectedCriterion: string
  preconditions: string[]
  variationGroupId?: string
}

export interface VerificationCapability {
  runner: 'COMPONENT_C_WASM'
  targetType: 'FUNCTION'
  targetId: 'VMC'|'eDrive'
  methods: readonly VerificationMethod[]
  variableInput: { id:string; kind:'NUMBER'; min:number; max:number; step:number }
  conditionInputs: readonly ('DIRECTION'|'VALIDITY'|'SPEED')[]
  monitoredOutputIds: readonly string[]
  supportsRepeatedRuns: true
  supportsExpectedOracle: true
  supportsTimeProfile: false
  supportsFaultInjection: false
  supportsEndpointTelemetry: false
  supportsStateOverride: true
  supportsVehicleReplay: false
  supportsComponentExecution: true
  stimulusProfiles: readonly ['CONSTANT']
}

export interface VehicleVerificationCapability {
  runner:'VEHICLE_SCENARIO_RUNTIME'
  targetType:'INTERFACE_BOUNDARY'|'ACTUATION_PLANT'
  targetId:'eDrive->DriveAdapter'|'VehiclePhysics'
  methods:readonly VerificationMethod[]
  monitoredOutputIds:readonly string[]
  injectionPointIds:readonly string[]
  supportsRepeatedRuns:true
  supportsExpectedOracle:false
  supportsTimeProfile:true
  supportsFaultInjection:true
  supportsEndpointTelemetry:boolean
  supportsStateOverride:false
  supportsVehicleReplay:true
  supportsComponentExecution:false
  stimulusProfiles:readonly ['CONSTANT','STEP','LINEAR_RAMP']
}

export const verificationMethodLabels:Record<VerificationMethod,{label:string;description:string}> = {
  COMPONENT_OUTPUT_COMPARISON:{label:'컴포넌트 출력 비교',description:'독립 컴포넌트 계산 결과를 적용 가능한 Expected와 비교합니다.'},
  VEHICLE_RESPONSE_OBSERVATION:{label:'차량 반응 관찰',description:'실제 차량 런타임에 입력을 적용하고 동기화된 반응을 관찰합니다.'},
  REQUIREMENTS_BASED_TEST:{label:'요구사항 기반 시험',description:'등록된 요구사항의 조건과 Expected를 시험 기준으로 사용합니다.'},
  INPUT_VARIATION:{label:'입력 변화 시험',description:'고정 조건에서 입력값을 바꾸며 출력 관계를 비교합니다.'},
  BOUNDARY_VALUE_ANALYSIS:{label:'경계값 분석',description:'런타임에 등록된 입력 범위와 동작 경계 주변 값을 시험합니다.'},
  STATE_CONDITION_TEST:{label:'상태 조건 시험',description:'지원되는 유효성·방향 조건을 바꾸어 동작을 확인합니다.'},
  INTERFACE_COMPARISON:{label:'인터페이스 양단 비교',description:'Source와 Destination의 독립 관찰값을 비교합니다.'},
  FAULT_INJECTION:{label:'Fault Injection',description:'런타임 동작을 의도적으로 교란해 고장 처리를 확인합니다.'},
  TIMING_EXECUTION_TEST:{label:'타이밍·실행 시험',description:'주기, 지연과 실행 누락을 관찰합니다.'},
  BACK_TO_BACK_COMPARISON:{label:'Back-to-back 비교',description:'독립 구현 또는 모델의 결과를 비교합니다.'},
  ERROR_GUESSING:{label:'오류 추정 시험',description:'플레이어가 의심 조건을 직접 골라 확인합니다.'},
}

export const testDesignTechniqueLabels:Record<TestDesignTechnique,{label:string;description:string;produces:string}> = {
  REQUIREMENTS_ANALYSIS:{label:'요구사항 분석',description:'실제 요구사항에서 적용 조건과 판단 기준 후보를 찾습니다.',produces:'요구사항에 명시된 조건과 Expected 후보'},
  EQUIVALENCE_CLASS_ANALYSIS:{label:'동등 분할',description:'같은 방식으로 처리되는 입력 구간에서 대표값을 고릅니다.',produces:'등록된 입력 구간의 대표값'},
  BOUNDARY_VALUE_ANALYSIS:{label:'경계값 분석',description:'입력 범위의 경계와 그 주변에서 오류가 발생하는지 확인합니다.',produces:'실제 최소·최대값과 내부 인접값'},
  ERROR_GUESSING:{label:'오류 추정',description:'조사 중 의심한 지원 조건이나 값을 직접 시험합니다.',produces:'플레이어가 선택한 실행 가능한 조건'},
}

export const verificationCapabilities:readonly VerificationCapability[] = [
  {runner:'COMPONENT_C_WASM',targetType:'FUNCTION',targetId:'VMC',methods:['REQUIREMENTS_BASED_TEST','INPUT_VARIATION','BOUNDARY_VALUE_ANALYSIS','STATE_CONDITION_TEST'],variableInput:{id:'PropulsionRequest',kind:'NUMBER',min:0,max:1,step:.05},conditionInputs:['DIRECTION','VALIDITY','SPEED'],monitoredOutputIds:['DriveTorqueRequest'],supportsRepeatedRuns:true,supportsExpectedOracle:true,supportsTimeProfile:false,supportsFaultInjection:false,supportsEndpointTelemetry:false,supportsStateOverride:true,supportsVehicleReplay:false,supportsComponentExecution:true,stimulusProfiles:['CONSTANT']},
  {runner:'COMPONENT_C_WASM',targetType:'FUNCTION',targetId:'eDrive',methods:['REQUIREMENTS_BASED_TEST','INPUT_VARIATION','BOUNDARY_VALUE_ANALYSIS','STATE_CONDITION_TEST'],variableInput:{id:'DriveTorqueRequest',kind:'NUMBER',min:0,max:600,step:5},conditionInputs:['DIRECTION','VALIDITY'],monitoredOutputIds:['EDriveCommand'],supportsRepeatedRuns:true,supportsExpectedOracle:true,supportsTimeProfile:false,supportsFaultInjection:false,supportsEndpointTelemetry:false,supportsStateOverride:true,supportsVehicleReplay:false,supportsComponentExecution:true,stimulusProfiles:['CONSTANT']},
]

export const vehicleVerificationCapabilities:readonly VehicleVerificationCapability[] = [
  {
    runner:'VEHICLE_SCENARIO_RUNTIME',targetType:'INTERFACE_BOUNDARY',targetId:'eDrive->DriveAdapter',
    methods:['INTERFACE_COMPARISON','FAULT_INJECTION'],monitoredOutputIds:['EDriveCommand'],
    injectionPointIds:['INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND'],supportsRepeatedRuns:true,supportsExpectedOracle:false,
    supportsTimeProfile:true,supportsFaultInjection:true,supportsEndpointTelemetry:true,supportsStateOverride:false,supportsVehicleReplay:true,supportsComponentExecution:false,
    stimulusProfiles:['CONSTANT','STEP','LINEAR_RAMP'],
  },
  {
    runner:'VEHICLE_SCENARIO_RUNTIME',targetType:'ACTUATION_PLANT',targetId:'VehiclePhysics',
    methods:['VEHICLE_RESPONSE_OBSERVATION','FAULT_INJECTION'],monitoredOutputIds:['driveForce','speedKmh','longitudinalAcceleration'],
    injectionPointIds:['DRIVER_INPUT.ACCELERATOR_PEDAL','INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND'],supportsRepeatedRuns:true,supportsExpectedOracle:false,
    supportsTimeProfile:true,supportsFaultInjection:true,supportsEndpointTelemetry:true,supportsStateOverride:false,supportsVehicleReplay:true,supportsComponentExecution:false,
    stimulusProfiles:['CONSTANT','STEP','LINEAR_RAMP'],
  },
]

export const getVerificationCapability = (target:InvestigationTarget|undefined) =>
  target?.type==='FUNCTION' ? verificationCapabilities.find(item=>item.targetId===target.id) : undefined

export const getVehicleVerificationCapability = (target:InvestigationTarget|undefined) =>
  target?.type==='INTERFACE_BOUNDARY'||target?.type==='ACTUATION_PLANT'
    ? vehicleVerificationCapabilities.find(item=>item.targetType===target.type&&item.targetId===target.id)
    : undefined

export const getAvailableVerificationMethods = (target:InvestigationTarget|undefined) =>
  getVerificationCapability(target)?.methods ?? getVehicleVerificationCapability(target)?.methods ?? []

export function boundaryCandidates(capability:VerificationCapability,direction:'FORWARD'|'REVERSE',limits:{forward:number;reverse:number}){
  const {min,max}=capability.variableInput
  const nearMin=Math.min(max,min+capability.variableInput.step)
  const limit=capability.targetId==='eDrive'?(direction==='REVERSE'?limits.reverse:limits.forward):undefined
  const candidates=limit===undefined
    ? [min,nearMin,(min+max)/2,Math.max(min,max-capability.variableInput.step),max]
    : [min,nearMin,Math.max(min,limit-capability.variableInput.step),limit,Math.min(max,limit+capability.variableInput.step),max]
  return [...new Set(candidates.map(value=>Number(value.toFixed(6))))]
}

export const isVerificationEvidenceType = (type:string) => type==='TEST_RESULT'
