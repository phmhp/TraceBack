import test from 'node:test'
import assert from 'node:assert/strict'
import { boundaryCandidates, getAvailableVerificationMethods, getVehicleVerificationCapability, getVerificationCapability, verificationCapabilities } from '../src/runtime/investigation/Verification.ts'

test('investigation target types are independent from executable capability',()=>{
  const interfaceTarget={type:'INTERFACE_BOUNDARY',id:'VMC->eDrive',domainScope:'Propulsion'}
  const stateTarget={type:'STATE_MODE',id:'Gear/Drive Enable',domainScope:'Vehicle State / Mode'}
  assert.equal(getVerificationCapability(interfaceTarget),undefined)
  assert.deepEqual(getAvailableVerificationMethods(interfaceTarget),[])
  assert.equal(getVerificationCapability(stateTarget),undefined)
})

test('only the audited eDrive to DriveAdapter boundary exposes endpoint comparison and fault injection',()=>{
  const supported={type:'INTERFACE_BOUNDARY',id:'eDrive->DriveAdapter',domainScope:'Propulsion'}
  const unsupported={type:'INTERFACE_BOUNDARY',id:'VMC->eDrive',domainScope:'Propulsion'}
  const capability=getVehicleVerificationCapability(supported)
  assert.deepEqual(getAvailableVerificationMethods(supported),['INTERFACE_COMPARISON','FAULT_INJECTION'])
  assert.equal(capability.runner,'VEHICLE_SCENARIO_RUNTIME')
  assert.equal(capability.supportsEndpointTelemetry,true)
  assert.deepEqual(getAvailableVerificationMethods(unsupported),[])
})

test('current executable capability is honest and component-only',()=>{
  assert.deepEqual(verificationCapabilities.map(item=>item.targetId),['GearLogic','PropulsionFunction','VMC','eDrive','DriveAdapterExecution','BrakingExecution','SteeringExecution'])
  for(const capability of verificationCapabilities){
    assert.equal(capability.targetType,'FUNCTION')
    assert.equal(capability.runner,capability.targetId==='DriveAdapterExecution'?'RUNTIME_ADAPTER':['BrakingExecution','SteeringExecution'].includes(capability.targetId)?'TRACKBACK_EXECUTION_MODEL':'COMPONENT_C_WASM')
    assert.deepEqual(capability.stimulusProfiles,['CONSTANT'])
    assert.equal(capability.supportsFaultInjection,false)
    assert.equal(capability.supportsEndpointTelemetry,false)
    assert.equal(capability.supportsVehicleReplay,false)
    assert.ok(capability.methods.includes('INPUT_VARIATION'))
    assert.ok(capability.methods.includes('REQUIREMENTS_BASED_TEST'))
    assert.ok(capability.methods.includes('BOUNDARY_VALUE_ANALYSIS'))
  }
})

test('new chassis capabilities expose only the implemented model inputs and outputs',()=>{
  const brake=getVerificationCapability({type:'FUNCTION',id:'BrakingExecution'})
  const steering=getVerificationCapability({type:'FUNCTION',id:'SteeringExecution'})
  assert.deepEqual(brake.variableInput,{id:'DriverBrakeRequest',kind:'NUMBER',min:0,max:1,step:.05})
  assert.deepEqual(brake.monitoredOutputIds,['brakeForce'])
  assert.deepEqual(steering.variableInput,{id:'DriverSteeringRequest',kind:'NUMBER',min:-1,max:1,step:.1})
  assert.deepEqual(steering.conditionInputs,['VALIDITY','SPEED'])
  assert.deepEqual(steering.monitoredOutputIds,['steering'])
})

test('drive adapter capability exposes the actual runtime boundary contract',()=>{
  const adapter=getVerificationCapability({type:'FUNCTION',id:'DriveAdapterExecution'})
  assert.equal(adapter.runner,'RUNTIME_ADAPTER')
  assert.deepEqual(adapter.variableInput,{id:'EDriveCommand',kind:'NUMBER',min:0,max:180,step:5})
  assert.deepEqual(adapter.monitoredOutputIds,['driveForce'])
})

test('boundary candidates come only from registered runtime range and calibration boundary',()=>{
  const capability=getVerificationCapability({type:'FUNCTION',id:'eDrive'})
  const values=boundaryCandidates(capability,'FORWARD',{forward:180,reverse:130})
  assert.deepEqual(values,[0,5,175,180,185,600])
  assert.ok(values.every(value=>value>=capability.variableInput.min&&value<=capability.variableInput.max))
})

test('GearLogic boundary candidates expose only the configured Trackback simulation threshold',()=>{
  const capability=getVerificationCapability({type:'FUNCTION',id:'GearLogic'})
  assert.deepEqual(boundaryCandidates(capability,'FORWARD',{forward:180,reverse:130,gear:.5}),[0,.1,.4,.5,.6,2])
})
