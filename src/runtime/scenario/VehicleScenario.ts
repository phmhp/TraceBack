import type { Gear } from '../../domain/driver/DriverInputTypes.ts'
import { validateFaultInjection, type FaultInjectionDefinition, type FaultInjectionTelemetry, type InterfaceComparisonStatus, type InterfaceEndpointTelemetry } from './FaultInjection.ts'

export type VehicleScenarioPhase = 'PRECONDITION' | 'STIMULUS' | 'OBSERVATION' | 'RESULT'
export type VehicleScenarioStatus = 'IDLE' | 'RUNNING' | 'COMPLETED' | 'ABORTED'
export type VehicleStimulusTargetId = 'accelerator' | 'brake' | 'steering'
export type VehicleScenarioMonitorId =
  | 'accelerator' | 'brake' | 'steering' | 'gearState'
  | 'propulsionRequest' | 'driveTorqueRequest' | 'eDriveCommand'
  | 'driveForce' | 'brakeForce' | 'speedKmh' | 'longitudinalVelocity'
  | 'longitudinalAcceleration' | 'positionX' | 'positionZ'

export type VehicleStimulusProfile =
  | { kind:'CONSTANT'; value:number }
  | { kind:'STEP'; from:number; to:number; atSeconds:number }
  | { kind:'LINEAR_RAMP'; from:number; to:number; durationSeconds:number }

export interface VehicleScenarioStimulus {
  target:{ category:'DRIVER_INPUT'; id:VehicleStimulusTargetId; label:string }
  profile:VehicleStimulusProfile
  startTimeSeconds:number
  durationSeconds:number
}

export interface VehicleScenarioDefinition {
  id:string
  name:string
  scope:{ domain:string; targetType:'FUNCTION'|'INTERFACE_BOUNDARY'|'ACTUATION_PLANT'; targetId:string }
  preconditions:{ gear:Gear; vehicleAtRest:boolean }
  stimuli:VehicleScenarioStimulus[]
  monitors:VehicleScenarioMonitorId[]
  expectedCriterion?:{ kind:'REQUIREMENT'|'OBSERVATION_ONLY'; description:string; requirementId?:string }
  durationSeconds:number
  observationWindow:{ startSeconds:number; endSeconds:number }
  reset:{ resetVehicle:true; resetDriverInputs:true; replayable:true }
  verification?:{ hypothesisId?:string; method?:string; designTechnique?:string; executionMode:'VEHICLE_SCENARIO_TEST' }
  faultInjection?:FaultInjectionDefinition
}

export interface VehicleScenarioSample {
  timeSeconds:number
  phase:Exclude<VehicleScenarioPhase,'RESULT'>
  values:Partial<Record<VehicleScenarioMonitorId,number|string>>
  faultTelemetry?:FaultInjectionTelemetry
  interfaceTelemetry?:InterfaceEndpointTelemetry
}

export interface VehicleScenarioRun {
  runId:string
  definition:VehicleScenarioDefinition
  status:Exclude<VehicleScenarioStatus,'IDLE'|'RUNNING'>
  phase:'RESULT'
  fixedTimestepSeconds:number
  samples:VehicleScenarioSample[]
  events:{ precondition:number; stimulusStart:number; faultStart?:number; faultEnd?:number; observationStart:number; end:number }
  faultTelemetry:FaultInjectionTelemetry[]
  interfaceTelemetry:InterfaceEndpointTelemetry[]
  interfaceComparison:InterfaceComparisonStatus
  interpretation:string
  verdict:'OBSERVED'|'PASS'|'FAIL'
}

export interface VehicleScenarioSnapshot {
  status:VehicleScenarioStatus
  phase:VehicleScenarioPhase
  runId?:string
  elapsedSeconds:number
  definition?:VehicleScenarioDefinition
  samples:readonly VehicleScenarioSample[]
  completedRun?:VehicleScenarioRun
  error?:string
}

export const EMPTY_VEHICLE_SCENARIO:VehicleScenarioSnapshot = {
  status:'IDLE', phase:'PRECONDITION', elapsedSeconds:0, samples:[],
}

const clamp=(value:number,min:number,max:number)=>Math.max(min,Math.min(max,value))
export const stimulusRange=(target:VehicleStimulusTargetId)=>target==='steering'?{min:-1,max:1}:{min:0,max:1}

export function validateVehicleScenario(definition:VehicleScenarioDefinition){
  if(!definition.id||!definition.name)throw new Error('시나리오 ID와 이름이 필요합니다.')
  if(!Number.isFinite(definition.durationSeconds)||definition.durationSeconds<1||definition.durationSeconds>12)throw new Error('차량 시나리오 시간은 1–12초 범위여야 합니다.')
  if(definition.observationWindow.startSeconds<0||definition.observationWindow.endSeconds>definition.durationSeconds||definition.observationWindow.startSeconds>=definition.observationWindow.endSeconds)throw new Error('관찰 구간이 시나리오 시간 범위를 벗어났습니다.')
  if(!definition.stimuli.length)throw new Error('실행 가능한 운전자 입력이 하나 이상 필요합니다.')
  for(const stimulus of definition.stimuli){
    const range=stimulusRange(stimulus.target.id)
    if(stimulus.startTimeSeconds<0||stimulus.durationSeconds<=0||stimulus.startTimeSeconds+stimulus.durationSeconds>definition.durationSeconds+1e-9)throw new Error('Stimulus 시간이 시나리오 범위를 벗어났습니다.')
    const values=stimulus.profile.kind==='CONSTANT'?[stimulus.profile.value]:[stimulus.profile.from,stimulus.profile.to]
    if(values.some(value=>!Number.isFinite(value)||value<range.min||value>range.max))throw new Error(`${stimulus.target.id} 값이 실행 범위를 벗어났습니다.`)
    if(stimulus.profile.kind==='STEP'&&(stimulus.profile.atSeconds<0||stimulus.profile.atSeconds>=stimulus.durationSeconds))throw new Error('STEP 시점이 stimulus 구간을 벗어났습니다.')
    if(stimulus.profile.kind==='LINEAR_RAMP'&&(stimulus.profile.durationSeconds<=0||stimulus.profile.durationSeconds>stimulus.durationSeconds))throw new Error('Ramp 시간이 stimulus 구간을 벗어났습니다.')
  }
  if(definition.faultInjection)validateFaultInjection(definition.faultInjection,definition.durationSeconds)
}

export function scenarioPhaseAt(definition:VehicleScenarioDefinition,timeSeconds:number):Exclude<VehicleScenarioPhase,'RESULT'>{
  const firstStimulus=Math.min(...definition.stimuli.map(item=>item.startTimeSeconds))
  if(timeSeconds<firstStimulus)return 'PRECONDITION'
  if(definition.stimuli.some(item=>timeSeconds>=item.startTimeSeconds&&timeSeconds<item.startTimeSeconds+item.durationSeconds))return 'STIMULUS'
  return 'OBSERVATION'
}

export function scheduledStimulusValue(stimulus:VehicleScenarioStimulus,timeSeconds:number){
  const local=timeSeconds-stimulus.startTimeSeconds
  if(local<0||local>=stimulus.durationSeconds)return 0
  const profile=stimulus.profile
  if(profile.kind==='CONSTANT')return clamp(profile.value,stimulusRange(stimulus.target.id).min,stimulusRange(stimulus.target.id).max)
  if(profile.kind==='STEP')return local<profile.atSeconds?profile.from:profile.to
  const progress=clamp(local/profile.durationSeconds,0,1)
  return profile.from+(profile.to-profile.from)*progress
}

export const supportedVehicleScenarioMonitors:readonly {id:VehicleScenarioMonitorId;label:string;unit?:string;group:'INPUT'|'SW'|'ACTUATION'|'PLANT'}[] = [
  {id:'accelerator',label:'Accelerator',unit:'0–1',group:'INPUT'},
  {id:'brake',label:'Brake',unit:'0–1',group:'INPUT'},
  {id:'steering',label:'Steering',unit:'-1–1',group:'INPUT'},
  {id:'gearState',label:'Gear State',group:'SW'},
  {id:'propulsionRequest',label:'Propulsion Request',group:'SW'},
  {id:'driveTorqueRequest',label:'Drive Torque Request',unit:'Nm',group:'SW'},
  {id:'eDriveCommand',label:'eDrive Command',unit:'Nm',group:'ACTUATION'},
  {id:'driveForce',label:'Drive Force',unit:'N',group:'ACTUATION'},
  {id:'brakeForce',label:'Brake Force',unit:'N',group:'ACTUATION'},
  {id:'speedKmh',label:'Vehicle Speed',unit:'km/h',group:'PLANT'},
  {id:'longitudinalVelocity',label:'Longitudinal Velocity',unit:'m/s',group:'PLANT'},
  {id:'longitudinalAcceleration',label:'Longitudinal Acceleration',unit:'m/s²',group:'PLANT'},
  {id:'positionX',label:'Position X',unit:'m',group:'PLANT'},
  {id:'positionZ',label:'Position Z',unit:'m',group:'PLANT'},
]

export function techniqueCandidates(target:VehicleStimulusTargetId,technique:'EQUIVALENCE_CLASS_ANALYSIS'|'BOUNDARY_VALUE_ANALYSIS'){
  if(technique==='EQUIVALENCE_CLASS_ANALYSIS')return target==='steering'?[-.5,0,.5]:[0,.5]
  return target==='steering'?[-1,-.95,-.05,0,.05,.95,1]:[0,.05,.95,1]
}
