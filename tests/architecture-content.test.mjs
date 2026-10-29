import test from 'node:test'
import assert from 'node:assert/strict'
import {MODEL_CONTEXT, MODEL_SPECS, ROUNDS, VEHICLE_FUNCTIONS} from '../src/campaign/domainTraining.ts'
import {PART_CLASS, VEHICLE_CONFIGURATION, ASSEMBLY_KITS} from '../src/campaign/domains.ts'
import {allAssemblyParts} from '../src/workshop/assembly.ts'
import {SUPPORT_ALLOCATION,SUPPORT_ROUTES} from '../src/campaign/vehicleArchitecture.ts'

test('every support function has a separate execution allocation or an explicit mechanical path',()=>{
 assert.deepEqual(Object.keys(SUPPORT_ALLOCATION).sort(),SUPPORT_ROUTES.map(route=>route.id).sort())
 assert.equal(new Set(SUPPORT_ROUTES.map(route=>route.id)).size,SUPPORT_ROUTES.length)
 assert.ok(SUPPORT_ROUTES.every(route=>!(route.id in MODEL_SPECS)),'a support route must not shadow a player-made model')
 for(const route of SUPPORT_ROUTES){const allocation=SUPPORT_ALLOCATION[route.id];assert.ok(allocation.ecu);assert.ok(allocation.episode>=1&&allocation.episode<=7);assert.equal(Boolean(allocation.swc),Boolean(allocation.runnable));if(route.id==='driveline'||route.id==='chassis')assert.equal(allocation.swc,null);else assert.ok(allocation.swc)}
})

test('every playable model has an explicit application, controller and physical boundary', () => {
  assert.deepEqual(Object.keys(MODEL_CONTEXT).sort(), Object.keys(MODEL_SPECS).sort())
  for (const [id, context] of Object.entries(MODEL_CONTEXT)) {
    assert.match(context.softwareLevel, /Application/)
    for (const field of ['controller', 'inputBoundary', 'outputBoundary', 'physicalEffect', 'logicFamily']) {
      assert.ok(context[field]?.length >= 3, `${id}.${field}`)
    }
    assert.ok(MODEL_SPECS[id].parts.every(part => PART_CLASS[part]))
  }
})

test('one vehicle variant is specified consistently across physical and function views', () => {
  assert.match(VEHICLE_CONFIGURATION.powertrain, /후륜구동/)
  assert.match(VEHICLE_CONFIGURATION.steering, /앞바퀴 2륜 조향/)
  assert.match(ROUNDS.find(round => round.id === 'drive').mechanical, /뒷바퀴/)
  assert.match(ROUNDS.find(round => round.id === 'steer').observe, /앞바퀴 두 개/)
  assert.doesNotMatch(ROUNDS.find(round => round.id === 'brake').observe, /페달 놓기.*정차/)
  assert.equal(ASSEMBLY_KITS.find(kit => kit.id === 'wheels').parts.length, 4)
  assert.deepEqual(Object.keys(PART_CLASS).sort(), allAssemblyParts.map(part => part.id).sort())
})

test('vehicle function inventory does not silently count future work as completed puzzles', () => {
  const roles = new Set(VEHICLE_FUNCTIONS.map(item => item.role))
  assert.deepEqual([...roles].sort(), ['다음 설계', '직접 구성', '차량 기반'].sort())
  for (const name of ['고전압 접촉기', '충전/OBC', '회생제동', 'EPS', '냉각', '진단']) {
    assert.ok(VEHICLE_FUNCTIONS.some(item => item.function.includes(name) && item.role === '다음 설계'), name)
  }
  assert.ok(VEHICLE_FUNCTIONS.some(item => item.function.includes('토크 요청') && item.role === '직접 구성'))
  assert.ok(VEHICLE_FUNCTIONS.some(item => item.function.includes('배터리') && item.role === '직접 구성'))
})
