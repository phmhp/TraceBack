import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import {normalScenarioTrace,READY_REGIONS,CURATED_SOURCES,VEHICLE_AREAS} from '../src/content/vehicleJourney.ts'
import {referenceGraph,starter,MISSIONS} from '../src/content/ready.ts'

test('normal scenario is replayed through the actual design, never an answer animation',()=>{
 for(const mission of MISSIONS){
  const frames=normalScenarioTrace(referenceGraph(mission.mode==='machine'),mission)
  assert.ok(frames.length>0)
  assert.ok(frames.every(f=>f.actual.state===f.expected.state&&!f.actual.issues.length))
  for(const frame of frames)for(const [key,value]of Object.entries(frame.expected.outputs))assert.equal(frame.actual.outputs[key],value)
 }
 assert.ok(normalScenarioTrace(starter(),MISSIONS[0])[0].actual.issues.length)
 const machine=normalScenarioTrace(referenceGraph(true),MISSIONS[1])
 assert.deepEqual(machine.map(f=>f.actual.state),['STANDBY','STANDBY','READY'])
 assert.deepEqual(machine.map(f=>f.actual.pulse),[true,false,true])
})
test('lesson location is a region of the same READY graph, not an unrelated domain',()=>{
 for(const [mission,regions]of READY_REGIONS.entries()){
  const g=referenceGraph(mission>0)
  for(const region of regions)assert.ok(region.nodes.every(id=>g.nodes.some(n=>n.id===id)),region.name)
 }
 assert.equal(new Set(VEHICLE_AREAS.map(a=>a.id)).size,6)
 assert.equal(VEHICLE_AREAS.find(a=>a.id==='energy').status,'참고만 · 모델 미구현')
})
test('curated source IDs exist; unavailable actual torque and regen remain deferred',async()=>{
 const data=JSON.parse(await readFile(new URL('../simulation/src/referenceVehicle/generated/reference-vehicle-registry.json',import.meta.url),'utf8'))
 for(const s of CURATED_SOURCES)assert.ok(data.entities.some(e=>e.id===s.id),s.id)
 assert.equal(CURATED_SOURCES.find(s=>s.id==='ActualDriveTorque').decision,'DEFER')
 assert.equal(CURATED_SOURCES.find(s=>s.id==='LF-BRK-BLEND').decision,'DEFER')
 assert.equal(CURATED_SOURCES.find(s=>s.id==='IFC-DESIGN-003').decision,'REFERENCE_ONLY')
 assert.ok(!CURATED_SOURCES.some(s=>s.id==='AcceleratorPedalPosition'&&s.decision==='REUSE_RUNTIME'))
})
test('new journey stays in the game; no standalone atlas or verifier-role claim',async()=>{
 const source=await readFile(new URL('../src/game/Game.tsx',import.meta.url),'utf8')
 assert.ok(source.includes('<VehicleWorkbench'))
 assert.ok(source.includes('<SystemStudio embedded readySnapshot={snapshot}'))
 assert.ok(source.includes('같은 기능의 다음 부분'))
 assert.ok(source.includes('TC를 직접 설계하는 훈련이 아니라'))
 assert.ok(!source.includes('검증자의 모자'))
 assert.ok(!source.includes('if(systems)return'))
})
