import test from 'node:test'
import assert from 'node:assert/strict'
import {makeAtlasTrace} from '../src/campaign/atlasTrace.ts'

const output={torqueNm:90,brakeForceN:2100,frontAngleRad:.24}

test('the design atlas connects each final function step to its physical parts',()=>{
 const drive=makeAtlasTrace('drive',4,'axle','감속기','차축 전달',output)
 assert.deepEqual(drive.activeParts,['motor','gearbox','axle','rearLeft','rearRight'])
 assert.equal(drive.torqueNm,90)
 assert.equal(drive.kind,'mechanical')
 const steer=makeAtlasTrace('steer',3,'frontLeft','앞바퀴','조향',output)
 assert.deepEqual(steer.activeParts,['steeringRack','frontLeft','frontRight'])
 assert.equal(steer.frontAngleRad,.24)
 const brake=makeAtlasTrace('brake',2,'brakes','캘리퍼','제동',output)
 assert.equal(brake.brakeForceN,2100)
 assert.equal(brake.kind,'actuator')
})

test('atlas step and physical outputs stay within the display contract',()=>{
 const trace=makeAtlasTrace('power',99,'motor','준비','완료',{torqueNm:NaN,brakeForceN:-1,frontAngleRad:5})
 assert.equal(trace.step,6)
 assert.equal(trace.torqueNm,0)
 assert.equal(trace.brakeForceN,0)
 assert.equal(trace.frontAngleRad,.48)
})
