import test from 'node:test'
import assert from 'node:assert/strict'
import {NORMAL_SYSTEM_INPUT,NEW_SYSTEM_STATE,stepVehicleSystems} from '../src/campaign/vehicleSystems.ts'
const run=(state,input={},dt=.02)=>stepVehicleSystems(state,{...NORMAL_SYSTEM_INPUT,...input},dt)
function ready(){let value=run(NEW_SYSTEM_STATE,{startEdge:true,brakePct:20});for(let i=0;i<20;i++)value=run(value.state,{brakePct:20});return value}
test('high-voltage path precharges before main contactor closes and rejects isolation fault',()=>{
 let result=run(NEW_SYSTEM_STATE,{startEdge:true,brakePct:20})
 assert.equal(result.state.hv,'PRECHARGE');assert.equal(result.contactors.precharge,true);assert.equal(result.contactors.main,false)
 for(let i=0;i<20;i++)result=run(result.state,{brakePct:20})
 assert.equal(result.state.hv,'READY');assert.equal(result.contactors.main,true)
 result=run(result.state,{isolationOk:false});assert.equal(result.state.hv,'FAULT');assert.equal(result.drive.commandNm,0);assert.equal(result.contactors.main,false)
})
test('precharge timeout does not authorize propulsion',()=>{let result=run(NEW_SYSTEM_STATE,{startEdge:true,brakePct:20,dcLinkVoltage:0});for(let i=0;i<102;i++)result=run(result.state,{dcLinkVoltage:0,brakePct:20});assert.equal(result.state.hv,'FAULT');assert.ok(result.diagnostics.includes('프리차지 시간 초과'))})
test('motor torque reaches only rear wheels with brake and gear interlocks',()=>{
 let result=run(ready().state,{gear:'D',pedalPct:50})
 assert.equal(result.drive.commandNm,90);assert.ok(result.drive.actualNm>0);assert.deepEqual(result.drive.rearWheelNm,[result.drive.actualNm*7*.9/2,result.drive.actualNm*7*.9/2])
 result=run(result.state,{gear:'D',pedalPct:50,brakePct:10});assert.equal(result.drive.commandNm,0);assert.equal(result.drive.actualNm,0)
})
test('charging, DC/DC and thermal derating are state-dependent',()=>{
 const charge=run(NEW_SYSTEM_STATE,{plugged:true,chargerLimitA:20})
 assert.equal(charge.charging.currentA,20);assert.equal(charge.dcDc.voltageV,13.8);assert.ok(charge.charging.soc>65)
 assert.equal(run(NEW_SYSTEM_STATE,{plugged:true,gear:'D'}).charging.active,false)
 const hot=run(ready().state,{gear:'D',pedalPct:100,motorTempC:78})
 assert.equal(hot.thermal.pump,true);assert.equal(hot.thermal.fan,true);assert.ok(hot.availableTorqueNm<180)
})
test('regen/friction blend, ABS, ESC and front-wheel EPS are observable',()=>{
 const state=ready().state
 const normal=run(state,{gear:'D',speedKmh:45,brakePct:30,steer:.5})
 assert.ok(normal.brake.regenNm>0);assert.ok(normal.brake.frictionN>0);assert.equal(normal.steering.frontAngleRad,.24);assert.ok(normal.steering.assistNm>0)
 const slip=run(state,{gear:'D',speedKmh:45,brakePct:30,wheelSlip:[.3,0,0,0]})
 assert.equal(slip.brake.regenNm,0);assert.equal(slip.brake.absActive,true);assert.ok(slip.brake.frontN[0]<slip.brake.frontN[1])
 const yaw=run(state,{gear:'D',speedKmh:45,brakePct:30,yawError:.3})
 assert.equal(yaw.brake.escActive,true);assert.ok(yaw.brake.rearN[0]>yaw.brake.rearN[1])
})
test('stale signal and low state of charge create explicit diagnostic/inhibit outputs',()=>{const stale=run(ready().state,{gear:'D',pedalPct:100,signalAgeMs:200});assert.equal(stale.state.hv,'FAULT');assert.equal(stale.drive.commandNm,0);assert.ok(stale.diagnostics.includes('제어 신호 지연'));const low=run(NEW_SYSTEM_STATE,{packSoc:2,startEdge:true,brakePct:20});assert.equal(low.state.hv,'FAULT');assert.equal(low.packAvailable,false)})
