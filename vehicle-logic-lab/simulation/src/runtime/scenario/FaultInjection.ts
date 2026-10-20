import type { EDriveCommand } from '../../domain/propulsion/PropulsionTypes.ts'

export type FaultInjectionPointId =
  | 'DRIVER_INPUT.ACCELERATOR_PEDAL'
  | 'INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND'
export type FaultInjectionType = 'OVERRIDE_VALUE' | 'DROP_UPDATE'
export type FaultRecoveryMode = 'RESTORE_ORIGINAL_PATH'
export type FaultRecoveryState = 'NORMAL' | 'INJECTING' | 'RESTORED'
export type InterfaceComparisonStatus = 'MATCH' | 'MISMATCH' | 'UNAVAILABLE'
export type TelemetryValue = number | string | boolean | EDriveCommand | Record<string, number | string | boolean>

export interface FaultInjectionDefinition {
  id:string
  name:string
  injectionPointId:FaultInjectionPointId
  targetType:'DRIVER_INPUT'|'INTERFACE_BOUNDARY'
  targetId:string
  faultType:FaultInjectionType
  activationStartSeconds:number
  activationEndSeconds:number
  injectedValue?:number
  recoveryMode:FaultRecoveryMode
  enabled:boolean
}

export interface FaultInjectionTelemetry {
  timestampSeconds:number
  injectionPointId:FaultInjectionPointId
  faultType:FaultInjectionType
  active:boolean
  originalValue:TelemetryValue
  deliveredValue:TelemetryValue
  deliveryOccurred:boolean
  recoveryState:FaultRecoveryState
}

export interface InterfaceEndpointTelemetry {
  timestampSeconds:number
  boundaryId:'eDrive->DriveAdapter'
  signalId:'EDriveCommand'
  sourceEndpointId:'eDrive.output.EDriveCommand'
  destinationEndpointId:'DriveAdapter.input.EDriveCommand'
  sourceFunctionId:'eDrive'
  destinationFunctionId:'DriveAdapter'
  sourceValue:EDriveCommand
  destinationValue:EDriveCommand
  sourceTimestampSeconds:number
  destinationTimestampSeconds:number
  comparisonStatus:Exclude<InterfaceComparisonStatus,'UNAVAILABLE'>
}

export interface FaultInjectionPointCapability {
  id:FaultInjectionPointId
  targetType:FaultInjectionDefinition['targetType']
  targetId:string
  signalId:string
  supportedFaultTypes:readonly FaultInjectionType[]
  sourceEndpointId:string
  destinationEndpointId:string
}

export const faultInjectionPoints:readonly FaultInjectionPointCapability[] = [
  {
    id:'DRIVER_INPUT.ACCELERATOR_PEDAL',targetType:'DRIVER_INPUT',targetId:'DriverInput',signalId:'AcceleratorPedalPosition',
    supportedFaultTypes:['OVERRIDE_VALUE'],sourceEndpointId:'DriverInput.output.AcceleratorPedalPosition',destinationEndpointId:'VehicleSw.input.AcceleratorPedalPosition',
  },
  {
    id:'INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND',targetType:'INTERFACE_BOUNDARY',targetId:'eDrive->DriveAdapter',signalId:'EDriveCommand',
    supportedFaultTypes:['OVERRIDE_VALUE','DROP_UPDATE'],sourceEndpointId:'eDrive.output.EDriveCommand',destinationEndpointId:'DriveAdapter.input.EDriveCommand',
  },
]

export const getFaultInjectionPoint=(id:FaultInjectionPointId)=>faultInjectionPoints.find(point=>point.id===id)
export const isFaultActive=(definition:FaultInjectionDefinition|undefined,timeSeconds:number)=>Boolean(definition?.enabled&&timeSeconds+1e-9>=definition.activationStartSeconds&&timeSeconds<definition.activationEndSeconds-1e-9)

export function validateFaultInjection(definition:FaultInjectionDefinition,scenarioDurationSeconds:number){
  const point=getFaultInjectionPoint(definition.injectionPointId)
  if(!point)throw new Error('등록되지 않은 fault injection point입니다.')
  if(point.targetType!==definition.targetType||point.targetId!==definition.targetId)throw new Error('Fault injection target과 injection point가 일치하지 않습니다.')
  if(!point.supportedFaultTypes.includes(definition.faultType))throw new Error('선택한 injection point가 이 fault type을 지원하지 않습니다.')
  if(definition.recoveryMode!=='RESTORE_ORIGINAL_PATH')throw new Error('지원되지 않는 recovery mode입니다.')
  if(definition.activationStartSeconds<0||definition.activationEndSeconds>scenarioDurationSeconds||definition.activationStartSeconds>=definition.activationEndSeconds)throw new Error('Fault activation window가 시나리오 범위를 벗어났습니다.')
  if(definition.faultType==='OVERRIDE_VALUE'&&!Number.isFinite(definition.injectedValue))throw new Error('OVERRIDE_VALUE에는 injected value가 필요합니다.')
}

const cloneCommand=(value:EDriveCommand):EDriveCommand=>({...value})
const commandMatches=(a:EDriveCommand,b:EDriveCommand)=>a.magnitudeNm===b.magnitudeNm&&a.direction===b.direction&&a.validity===b.validity

export class FaultInjectionRuntime {
  private previousEDriveCommand:EDriveCommand|undefined
  private activePoints=new Set<FaultInjectionPointId>()

  reset(){this.previousEDriveCommand=undefined;this.activePoints.clear()}

  applyAccelerator(definition:FaultInjectionDefinition|undefined,originalValue:number,timeSeconds:number){
    const applies=definition?.injectionPointId==='DRIVER_INPUT.ACCELERATOR_PEDAL'
    const active=applies&&isFaultActive(definition,timeSeconds)
    const wasActive=applies&&this.activePoints.has(definition.injectionPointId)
    const deliveredValue=active&&definition.faultType==='OVERRIDE_VALUE'?definition.injectedValue!:originalValue
    if(active)this.activePoints.add(definition.injectionPointId)
    else if(applies)this.activePoints.delete(definition.injectionPointId)
    const telemetry:FaultInjectionTelemetry|undefined=applies?{
      timestampSeconds:timeSeconds,injectionPointId:definition.injectionPointId,faultType:definition.faultType,active,
      originalValue,deliveredValue,deliveryOccurred:true,recoveryState:active?'INJECTING':wasActive?'RESTORED':'NORMAL',
    }:undefined
    return {deliveredValue,telemetry}
  }

  applyEDriveCommand(definition:FaultInjectionDefinition|undefined,originalValue:EDriveCommand,timeSeconds:number){
    const sourceValue=cloneCommand(originalValue)
    const applies=definition?.injectionPointId==='INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND'
    const active=applies&&isFaultActive(definition,timeSeconds)
    const wasActive=applies&&this.activePoints.has(definition.injectionPointId)
    let deliveredValue=cloneCommand(originalValue),deliveryOccurred=true
    if(active&&definition.faultType==='OVERRIDE_VALUE')deliveredValue={...sourceValue,magnitudeNm:definition.injectedValue!}
    else if(active&&definition.faultType==='DROP_UPDATE'){
      deliveredValue=this.previousEDriveCommand?cloneCommand(this.previousEDriveCommand):cloneCommand(sourceValue)
      deliveryOccurred=false
    }
    if(active)this.activePoints.add(definition.injectionPointId)
    else if(applies)this.activePoints.delete(definition.injectionPointId)
    if(deliveryOccurred||!this.previousEDriveCommand)this.previousEDriveCommand=cloneCommand(deliveredValue)
    const telemetry:FaultInjectionTelemetry|undefined=applies?{
      timestampSeconds:timeSeconds,injectionPointId:definition.injectionPointId,faultType:definition.faultType,active,
      originalValue:sourceValue,deliveredValue:cloneCommand(deliveredValue),deliveryOccurred,recoveryState:active?'INJECTING':wasActive?'RESTORED':'NORMAL',
    }:undefined
    const endpointTelemetry:InterfaceEndpointTelemetry={
      timestampSeconds:timeSeconds,boundaryId:'eDrive->DriveAdapter',signalId:'EDriveCommand',
      sourceEndpointId:'eDrive.output.EDriveCommand',destinationEndpointId:'DriveAdapter.input.EDriveCommand',sourceFunctionId:'eDrive',destinationFunctionId:'DriveAdapter',
      sourceValue,destinationValue:cloneCommand(deliveredValue),sourceTimestampSeconds:timeSeconds,destinationTimestampSeconds:timeSeconds,
      comparisonStatus:commandMatches(sourceValue,deliveredValue)?'MATCH':'MISMATCH',
    }
    return {deliveredValue,telemetry,endpointTelemetry}
  }
}

export function summarizeInterfaceComparison(samples:readonly InterfaceEndpointTelemetry[]):InterfaceComparisonStatus{
  if(!samples.length)return 'UNAVAILABLE'
  return samples.some(sample=>sample.comparisonStatus==='MISMATCH')?'MISMATCH':'MATCH'
}
