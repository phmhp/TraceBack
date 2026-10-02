import test from 'node:test'
import assert from 'node:assert/strict'
import { FaultInjectionRuntime, summarizeInterfaceComparison, validateFaultInjection } from '../src/runtime/scenario/FaultInjection.ts'

const interfaceOverride={
  id:'fi-interface',name:'Override EDrive command',injectionPointId:'INTERFACE.EDRIVE_TO_DRIVE_ADAPTER.EDRIVE_COMMAND',
  targetType:'INTERFACE_BOUNDARY',targetId:'eDrive->DriveAdapter',faultType:'OVERRIDE_VALUE',activationStartSeconds:1,activationEndSeconds:2,
  injectedValue:12,recoveryMode:'RESTORE_ORIGINAL_PATH',enabled:true,
}
const command=value=>({magnitudeNm:value,direction:'FORWARD',validity:'VALID'})

test('fault injection activates only inside its window and explicitly restores the original path',()=>{
  const runtime=new FaultInjectionRuntime()
  const before=runtime.applyEDriveCommand(interfaceOverride,command(80),.5)
  const active=runtime.applyEDriveCommand(interfaceOverride,command(90),1)
  const restored=runtime.applyEDriveCommand(interfaceOverride,command(100),2)
  assert.equal(before.deliveredValue.magnitudeNm,80)
  assert.equal(before.telemetry.active,false)
  assert.equal(active.deliveredValue.magnitudeNm,12)
  assert.equal(active.telemetry.recoveryState,'INJECTING')
  assert.equal(restored.deliveredValue.magnitudeNm,100)
  assert.equal(restored.telemetry.recoveryState,'RESTORED')
  assert.equal(active.endpointTelemetry.comparisonStatus,'MISMATCH')
  assert.notEqual(active.endpointTelemetry.sourceValue,active.endpointTelemetry.destinationValue)
})

test('reset clears retained delivery state and replay starts from a clean interceptor',()=>{
  const runtime=new FaultInjectionRuntime()
  const drop={...interfaceOverride,faultType:'DROP_UPDATE',injectedValue:undefined}
  runtime.applyEDriveCommand(drop,command(20),.5)
  const held=runtime.applyEDriveCommand(drop,command(70),1.25)
  assert.equal(held.deliveredValue.magnitudeNm,20)
  assert.equal(held.telemetry.deliveryOccurred,false)
  runtime.reset()
  const clean=runtime.applyEDriveCommand(drop,command(70),1.25)
  assert.equal(clean.deliveredValue.magnitudeNm,70)
  assert.equal(clean.telemetry.deliveryOccurred,false)
})

test('driver override records original and delivered values independently from normal stimulus',()=>{
  const runtime=new FaultInjectionRuntime()
  const definition={id:'driver-fi',name:'Pedal override',injectionPointId:'DRIVER_INPUT.ACCELERATOR_PEDAL',targetType:'DRIVER_INPUT',targetId:'DriverInput',faultType:'OVERRIDE_VALUE',activationStartSeconds:.5,activationEndSeconds:1.5,injectedValue:.1,recoveryMode:'RESTORE_ORIGINAL_PATH',enabled:true}
  const applied=runtime.applyAccelerator(definition,.8,1)
  assert.equal(applied.telemetry.originalValue,.8)
  assert.equal(applied.telemetry.deliveredValue,.1)
  assert.equal(applied.deliveredValue,.1)
  assert.doesNotThrow(()=>validateFaultInjection(definition,2))
})

test('interface summary reports MATCH, MISMATCH, and UNAVAILABLE without root-cause inference',()=>{
  const runtime=new FaultInjectionRuntime()
  const match=runtime.applyEDriveCommand(undefined,command(25),0).endpointTelemetry
  const mismatch=runtime.applyEDriveCommand(interfaceOverride,command(25),1.25).endpointTelemetry
  assert.equal(summarizeInterfaceComparison([]),'UNAVAILABLE')
  assert.equal(summarizeInterfaceComparison([match]),'MATCH')
  assert.equal(summarizeInterfaceComparison([match,mismatch]),'MISMATCH')
})
