import test from 'node:test'
import assert from 'node:assert/strict'
import { executionCoverageSummary, functionExecutionCoverage, getExecutionImplementationQueue, getFunctionExecutionCoverage } from '../src/runtime/investigation/ExecutionCoverage.ts'

test('all 74 canonical logical functions have exactly one honest execution classification',()=>{
  assert.equal(functionExecutionCoverage.length,74)
  assert.equal(new Set(functionExecutionCoverage.map(item=>item.functionId)).size,74)
  assert.equal(functionExecutionCoverage.filter(item=>item.coverage==='INDEPENDENT_EXECUTABLE').length+functionExecutionCoverage.filter(item=>item.coverage==='VEHICLE_SCENARIO_OBSERVABLE').length+executionCoverageSummary.partialRuntimeNotIndependent+executionCoverageSummary.modelNotImplemented,74)
  assert.equal(executionCoverageSummary.vehicleScenarioObservable,74)
})

test('current independent runners are explicit and do not promote whole reference Areas',()=>{
  assert.equal(getFunctionExecutionCoverage('LF-GEAR-ACQ').runnerTarget,'GearLogic')
  assert.equal(getFunctionExecutionCoverage('LF-GEAR-INTERLOCK').runnerTarget,'GearLogic')
  assert.equal(getFunctionExecutionCoverage('LF-GEAR-STATE').runnerTarget,'GearLogic')
  assert.equal(getFunctionExecutionCoverage('LF-PROP-ACQ').runnerTarget,'PropulsionFunction')
  assert.equal(getFunctionExecutionCoverage('LF-PROP-INTERP').runnerTarget,'PropulsionFunction')
  assert.equal(getFunctionExecutionCoverage('LF-PROP-GEN').runnerTarget,'VMC')
  assert.equal(getFunctionExecutionCoverage('LF-PROP-EDRV').runnerTarget,'eDrive')
  assert.equal(getFunctionExecutionCoverage('LF-ACT-DRIVE').runnerTarget,'DriveAdapterExecution')
  assert.equal(getFunctionExecutionCoverage('LF-BRK-CMD').runnerTarget,'BrakingExecution')
  assert.equal(getFunctionExecutionCoverage('LF-STR-ACT').runnerTarget,'SteeringExecution')
  assert.equal(getFunctionExecutionCoverage('LF-STB-ABS').coverage,'VEHICLE_SCENARIO_OBSERVABLE')
  assert.equal(getFunctionExecutionCoverage('LF-ADAS-AEB').coverage,'VEHICLE_SCENARIO_OBSERVABLE')
  assert.equal(getFunctionExecutionCoverage('LF-GEAR-REACT').coverage,'VEHICLE_SCENARIO_OBSERVABLE')
  assert.equal(getFunctionExecutionCoverage('LF-SEN-QUALITY').coverage,'VEHICLE_SCENARIO_OBSERVABLE')
})

test('implementation queue includes every non-complete function and no function remains without a scenario model',()=>{
  const queue=getExecutionImplementationQueue()
  assert.equal(queue.length,functionExecutionCoverage.filter(item=>item.phase!=='COMPLETE').length)
  assert.equal(executionCoverageSummary.modelNotImplemented,0)
  assert.ok(queue.every(item=>item.phase==='FORMALIZE_PARTIAL_MODEL'))
})

