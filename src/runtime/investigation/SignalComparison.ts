import type { IncidentFrame } from '../case/PropulsionCase.ts'
import { getSignalDefinition, getSignalObservation, type SignalValue } from '../../registries/investigation/Architecture.ts'
import type { EvidenceStatus } from './Evidence.ts'

export type SignalRole = 'STATE'|'INPUT'|'OUTPUT'|'OBSERVATION'

export interface SignalComparisonResult {
  signalId:string
  componentId:string
  role:SignalRole
  timestamp:number
  actual:string
  criterionKind:'EXPECTED'|'VALID_RANGE'|'ALLOWED_STATE'|'REQUIREMENT_CONDITION'|'NONE'
  criterionLabel:string
  criterionValue:string
  status:Exclude<EvidenceStatus,'REFERENCE'>
  interpretation:string
  requirementIds:string[]
}

export const formatSignalValue = (value:SignalValue|undefined) => value==null
  ? '—'
  : typeof value==='number'
    ? Number.isInteger(value)?String(value):value.toFixed(3)
    : typeof value==='boolean'
      ? value?'TRUE':'FALSE'
      : typeof value==='object'?JSON.stringify(value):String(value)

const equal = (a:SignalValue|undefined,b:SignalValue|undefined) => {
  if(typeof a==='number'&&typeof b==='number')return Math.abs(a-b)<=1e-6
  return JSON.stringify(a)===JSON.stringify(b)
}

export function compareSignalAtFrame(signalId:string,componentId:string,frame:IncidentFrame,previous?:IncidentFrame):SignalComparisonResult|undefined {
  const signal=getSignalDefinition(signalId)
  if(!signal)return undefined
  const observation=getSignalObservation(signalId,frame,previous)
  const unit=signal.unit?` ${signal.unit}`:''
  const actualValue=observation.actual.value
  const role:SignalRole=signal.semanticRole==='STATE_OR_PRECONDITION'?'STATE':signal.producerIds.includes(componentId)?'OUTPUT':signal.consumerIds.includes(componentId)?'INPUT':'OBSERVATION'
  let criterionKind:SignalComparisonResult['criterionKind']='NONE'
  let criterionLabel='판정 기준 없음'
  let criterionValue='—'
  let status:SignalComparisonResult['status']='OBSERVED'
  let requirementIds:string[]=[]

  if(observation.expected&&observation.expected.value!==null&&observation.expected.value!==undefined){
    criterionKind='EXPECTED';criterionLabel='Expected · 이 조건에서 나와야 하는 값';criterionValue=`${formatSignalValue(observation.expected.value)}${unit}`
    status=equal(actualValue,observation.expected.value)?'MATCH':'MISMATCH'
  }else if(signal.comparisonBasis.kind==='VALID_RANGE'){
    criterionKind='VALID_RANGE';criterionLabel='유효 범위';criterionValue=`${signal.comparisonBasis.min}–${signal.comparisonBasis.max}${unit}`
    status=typeof actualValue==='number'&&actualValue>=signal.comparisonBasis.min&&actualValue<=signal.comparisonBasis.max?'MATCH':'MISMATCH'
  }else if(signal.comparisonBasis.kind==='ALLOWED_STATE'){
    criterionKind='ALLOWED_STATE';criterionLabel='허용 상태';criterionValue=signal.comparisonBasis.allowed.map(String).join(' / ')
    status=signal.comparisonBasis.allowed.some(value=>equal(value,actualValue))?'MATCH':'MISMATCH'
  }else if(signal.comparisonBasis.kind==='REQUIREMENT_CONDITION'){
    criterionKind='REQUIREMENT_CONDITION';criterionLabel='요구사항 조건 확인 필요';criterionValue=signal.comparisonBasis.requirementIds.join(' · ')
    requirementIds=[...signal.comparisonBasis.requirementIds]
  }

  const interpretation=status==='MISMATCH'
    ? role==='OUTPUT'?'출력이 판정 기준과 다릅니다.':'실제값이 판정 기준과 다릅니다.'
    : status==='MATCH'
      ? role==='STATE'?'상태 조건이 판정 기준을 만족합니다.':role==='INPUT'?'입력이 판정 기준을 만족합니다.':'실제값이 판정 기준과 일치합니다.'
      : '현재 정보만으로 정상/이상을 판정할 수 없습니다.'

  return {signalId,componentId,role,timestamp:frame.sw.executionTime,actual:`${formatSignalValue(actualValue)}${unit}`,criterionKind,criterionLabel,criterionValue,status,interpretation,requirementIds}
}
