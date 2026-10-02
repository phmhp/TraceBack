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
  assert.deepEqual(verificationCapabilities.map(item=>item.targetId),['VMC','eDrive'])
  for(const capability of verificationCapabilities){
    assert.equal(capability.targetType,'FUNCTION')
    assert.equal(capability.runner,'COMPONENT_C_WASM')
    assert.deepEqual(capability.stimulusProfiles,['CONSTANT'])
    assert.equal(capability.supportsFaultInjection,false)
    assert.equal(capability.supportsEndpointTelemetry,false)
    assert.equal(capability.supportsVehicleReplay,false)
    assert.ok(capability.methods.includes('INPUT_VARIATION'))
    assert.ok(capability.methods.includes('REQUIREMENTS_BASED_TEST'))
    assert.ok(capability.methods.includes('BOUNDARY_VALUE_ANALYSIS'))
  }
})

test('boundary candidates come only from registered runtime range and calibration boundary',()=>{
  const capability=getVerificationCapability({type:'FUNCTION',id:'eDrive'})
  const values=boundaryCandidates(capability,'FORWARD',{forward:180,reverse:130})
  assert.deepEqual(values,[0,5,175,180,185,600])
  assert.ok(values.every(value=>value>=capability.variableInput.min&&value<=capability.variableInput.max))
})
