import test from 'node:test'
import assert from 'node:assert/strict'
import { VehicleSupportExecutionModel } from '../src/runtime/control/VehicleSupportExecutionModel.ts'

const base={physicsAttached:true,hostRunAuthorized:true,gearState:'D',confirmedFault:false,energyAvailable:true,energyValidity:'VALID'}

test('vehicle support model preserves the existing ready and propulsion-enabled default',()=>{
  const output=new VehicleSupportExecutionModel().step(base)
  assert.deepEqual(output,{vehicleMode:'DRIVE',vehicleReady:true,propulsionPermission:true,degradedAvailability:false,energyStatus:'AVAILABLE',drivePowerAvailable:true,maxDriveTorqueCandidateNm:undefined,reason:'AVAILABLE'})
})

test('energy unavailable and invalid scenarios suppress propulsion without inventing battery data',()=>{
  const model=new VehicleSupportExecutionModel()
  assert.deepEqual(model.step({...base,energyAvailable:false}),{vehicleMode:'DEGRADED',vehicleReady:true,propulsionPermission:false,degradedAvailability:true,energyStatus:'UNAVAILABLE',drivePowerAvailable:false,maxDriveTorqueCandidateNm:undefined,reason:'ENERGY_UNAVAILABLE'})
  assert.equal(model.step({...base,energyValidity:'INVALID'}).reason,'ENERGY_INVALID')
})

test('energy torque limit remains an observable candidate until allocation ownership is defined',()=>{
  const output=new VehicleSupportExecutionModel().step({...base,maxDriveTorqueCandidateNm:90})
  assert.equal(output.energyStatus,'LIMIT_CANDIDATE')
  assert.equal(output.maxDriveTorqueCandidateNm,90)
  assert.equal(output.propulsionPermission,true)
  assert.throws(()=>new VehicleSupportExecutionModel().step({...base,maxDriveTorqueCandidateNm:-1}))
})

test('confirmed fault publishes degraded availability and removes propulsion permission',()=>{
  const output=new VehicleSupportExecutionModel().step({...base,confirmedFault:true})
  assert.equal(output.vehicleMode,'DEGRADED')
  assert.equal(output.propulsionPermission,false)
  assert.equal(output.reason,'FAULT_CONFIRMED')
})
