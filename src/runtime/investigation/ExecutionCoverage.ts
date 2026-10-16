import { getEntitiesByKind } from '../../referenceVehicle/index.ts'
import type { ReferenceVehicleEntity } from '../../referenceVehicle/types.ts'

export type FunctionExecutionCoverage =
  | 'INDEPENDENT_EXECUTABLE'
  | 'VEHICLE_SCENARIO_OBSERVABLE'
  | 'PARTIAL_RUNTIME_NOT_INDEPENDENT'
  | 'MODEL_NOT_IMPLEMENTED'

export type ExecutionImplementationPhase =
  | 'COMPLETE'
  | 'CONNECT_EXISTING_RUNTIME'
  | 'FORMALIZE_PARTIAL_MODEL'
  | 'DEFINE_SOURCE_CONTRACT_AND_MODEL'

export interface FunctionExecutionCoverageEntry {
  functionId:string
  areaId:string
  name:string
  canonicalImplementationStatus:string
  coverage:FunctionExecutionCoverage
  independentExecutable:boolean
  vehicleScenarioObservable:boolean
  phase:ExecutionImplementationPhase
  runnerTarget?:string
  limitation:string
}

/**
 * Canonical functions currently backed by a repeatable runner and an explicit
 * Expected contract in Page 3. One runtime component may cover more than one
 * canonical responsibility; that does not make the remaining Area executable.
 */
const independentRunnerByFunctionId:Readonly<Record<string,string>>=Object.freeze({
  'LF-GEAR-ACQ':'GearLogic',
  'LF-GEAR-INTERLOCK':'GearLogic',
  'LF-GEAR-STATE':'GearLogic',
  'LF-PROP-ACQ':'PropulsionFunction',
  'LF-PROP-INTERP':'PropulsionFunction',
  'LF-PROP-GEN':'VMC',
  'LF-PROP-EDRV':'eDrive',
  'LF-ACT-DRIVE':'DriveAdapterExecution',
  'LF-BRK-CMD':'BrakingExecution',
  'LF-STR-ACT':'SteeringExecution',
})

/** Real full-vehicle paths that can be driven and observed but are not formal
 * component PASS/FAIL oracles. */
const vehicleScenarioFunctions=new Set([
  'LF-ACT-BRAKE','LF-ACT-STEER','LF-PLANT-MOTION','LF-PLANT-ENV',
  'LF-VS-MODE','LF-VS-FAULT','LF-EN-READY','LF-EN-LIMIT','LF-EN-MON',
  'LF-FM-DETECT','LF-FM-DIAG','LF-FM-REACT','LF-FM-REC',
  'LF-GEAR-REACT','LF-SEN-QUALITY',
  'LF-BRK-STATE','LF-BRK-DEMAND','LF-BRK-COORD','LF-BRK-BLEND','LF-BRK-FDBK',
  'LF-STR-STATE','LF-STR-COORD','LF-STR-MON',
  'LF-MC-REQ','LF-MC-AUTH','LF-MC-LAT','LF-MC-ALLOC','LF-MC-MON',
  'LF-EXE-SCHED','LF-EXE-SUP','LF-COM-NET','LF-COM-SUP',
  'LF-PROP-MON','LF-PROP-REACT','LF-PROP-REC',
  'LF-STB-ABS','LF-STB-TCS','LF-STB-ESC','LF-STB-COORD',
  'LF-OCC-IMPACT','LF-OCC-DECIDE','LF-OCC-DEPLOY',
  'LF-ADAS-COMMON','LF-ADAS-ACC','LF-ADAS-AEB','LF-ADAS-LKA',
])

const entryFor=(entity:ReferenceVehicleEntity):FunctionExecutionCoverageEntry=>{
  const areaId=String(entity.metadata.areaId??'UNKNOWN')
  const canonicalImplementationStatus=entity.implementationStatus??'STATUS_NOT_RECORDED'
  const runnerTarget=independentRunnerByFunctionId[entity.id]
  if(runnerTarget)return {
    functionId:entity.id,areaId,name:entity.name??entity.id,canonicalImplementationStatus,
    coverage:'INDEPENDENT_EXECUTABLE',independentExecutable:true,vehicleScenarioObservable:true,phase:'COMPLETE',runnerTarget,
    limitation:'등록된 입력 범위에서는 독립 Expected 검증이 가능하고 실제 차량 시나리오에서는 같은 실행 경로가 관찰됩니다.',
  }
  if(vehicleScenarioFunctions.has(entity.id))return {
    functionId:entity.id,areaId,name:entity.name??entity.id,canonicalImplementationStatus,
    coverage:'VEHICLE_SCENARIO_OBSERVABLE',independentExecutable:false,vehicleScenarioObservable:true,phase:'COMPLETE',runnerTarget:'VehicleScenarioRuntime',
    limitation:entity.id==='LF-EN-LIMIT'
      ?'TRACKBACK 실행 모델이 제약 후보를 계산·기록하지만 canonical allocation 위치가 OPEN이므로 추진 명령에는 적용하지 않습니다. 독립 oracle도 아직 없습니다.'
      :entity.id==='LF-FM-REACT'
        ?'TRACKBACK fault lifecycle이 반응 요청을 계산·기록하지만 OEM safety reaction 정책으로 실행하지 않습니다. 독립 oracle도 아직 없습니다.'
      :entity.id==='LF-BRK-BLEND'
        ?'현재 TRACKBACK 제동은 DRIVER_ONLY·FRICTION_ONLY이며 회생제동은 UNAVAILABLE로 명시됩니다. 독립 oracle은 아직 없습니다.'
      :entity.id==='LF-BRK-FDBK'||entity.id==='LF-STR-MON'
        ?'명령과 차량 반응을 같은 tick에서 관찰하지만 승인된 응답 oracle이 없어 OBSERVED_ONLY입니다.'
      :entity.id.startsWith('LF-MC-')
        ?'현재 TRACKBACK의 DRIVER_ONLY 구동·제동·수동 조향 command를 조정 관점으로 실행·관찰합니다. 전체 Reference Motion Coordination 또는 ADAS arbitration이 아닙니다.'
      :entity.id.startsWith('LF-EXE-')
        ?'TRACKBACK host simulation fixed-step schedule/supervision이며 실제 ECU RTOS·AUTOSAR task가 아닙니다.'
      :entity.id.startsWith('LF-COM-')
        ?'eDrive command를 전달하는 TRACKBACK same-tick direct-port transport이며 CAN-FD·Ethernet·OEM network가 아닙니다.'
      :entity.id==='LF-PROP-MON'
        ?'현재 추진 신호와 validity를 같은 tick에서 관찰하지만 승인된 deviation oracle이 없어 OBSERVED_ONLY입니다.'
      :entity.id==='LF-PROP-REACT'
        ?'fault lifecycle의 propulsion inhibit request를 기록하지만 OEM safety reaction으로 명령에 강제 적용하지 않습니다.'
      :entity.id.startsWith('LF-STB-')
        ?'실제 Rapier wheel/yaw telemetry를 쓰는 TRACKBACK 교육 모델입니다. ABS/TCS는 시나리오 opt-in global scale이고 ESC는 개별 휠 제어가 없어 관찰만 합니다. OEM 로직이 아닙니다.'
      :entity.id.startsWith('LF-OCC-')
        ?'실제 Rapier chassis contact를 입력으로 하는 opt-in TRACKBACK 데모입니다. OEM crash sensing·airbag threshold·물리 restraint 모델이 아닙니다.'
      :entity.id.startsWith('LF-ADAS-')
        ?'실제 scenario lead collider와 configured route 오차를 입력으로 하는 opt-in TRACKBACK 데모입니다. OEM ACC/AEB/LKA·perception stack이 아닙니다.'
      :'실제 차량 런타임 반응은 관찰할 수 있지만 독립 컴포넌트 oracle은 아직 없습니다.',
  }
  if(canonicalImplementationStatus==='PARTIAL'||canonicalImplementationStatus==='VERIFIED')return {
    functionId:entity.id,areaId,name:entity.name??entity.id,canonicalImplementationStatus,
    coverage:'PARTIAL_RUNTIME_NOT_INDEPENDENT',independentExecutable:false,vehicleScenarioObservable:true,phase:'FORMALIZE_PARTIAL_MODEL',
    limitation:'실제 차량 시나리오의 host/runtime 경계 값은 관찰하지만 독립 입력 계약·runner·Expected가 모두 연결되지는 않았습니다.',
  }
  return {
    functionId:entity.id,areaId,name:entity.name??entity.id,canonicalImplementationStatus,
    coverage:'MODEL_NOT_IMPLEMENTED',independentExecutable:false,vehicleScenarioObservable:false,phase:'DEFINE_SOURCE_CONTRACT_AND_MODEL',
    limitation:'Reference Design만 존재합니다. 공개 근거와 명시적 SIMULATION_ASSUMPTION 계약 없이 실행 로직을 만들 수 없습니다.',
  }
}

export const functionExecutionCoverage:readonly FunctionExecutionCoverageEntry[]=Object.freeze(
  getEntitiesByKind('LOGICAL_FUNCTION').map(entryFor),
)

export const getFunctionExecutionCoverage=(functionId:string)=>functionExecutionCoverage.find(item=>item.functionId===functionId)

export const getExecutionImplementationQueue=()=>Object.freeze(
  functionExecutionCoverage.filter(item=>item.phase!=='COMPLETE').sort((a,b)=>{
    const order:Record<ExecutionImplementationPhase,number>={COMPLETE:0,CONNECT_EXISTING_RUNTIME:1,FORMALIZE_PARTIAL_MODEL:2,DEFINE_SOURCE_CONTRACT_AND_MODEL:3}
    return order[a.phase]-order[b.phase]||a.areaId.localeCompare(b.areaId)||a.functionId.localeCompare(b.functionId)
  }),
)

export const executionCoverageSummary=Object.freeze({
  total:functionExecutionCoverage.length,
  independentExecutable:functionExecutionCoverage.filter(item=>item.independentExecutable).length,
  vehicleScenarioObservable:functionExecutionCoverage.filter(item=>item.vehicleScenarioObservable).length,
  partialRuntimeNotIndependent:functionExecutionCoverage.filter(item=>item.coverage==='PARTIAL_RUNTIME_NOT_INDEPENDENT').length,
  modelNotImplemented:functionExecutionCoverage.filter(item=>item.coverage==='MODEL_NOT_IMPLEMENTED').length,
})

