import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import Rapier from '@dimforge/rapier3d-compat'
import {MODEL_SPECS,ROUNDS,referenceModel,emptyModel,providedDesigns,addBlock,connectModel,evaluateModel,verifyModel,executeVehicle} from '../src/campaign/domainTraining.ts'
import {initialAdventure,assembleAdventurePart,confirmModel,completeModel,nextRound,editAdventure,canEnterCup,loadAdventure,graphStamp} from '../src/campaign/adventure.ts'
import {assembledRecord} from '../src/campaign/model.ts'
import {allAssemblyParts,chassisCables} from '../src/workshop/assembly.ts'
import {createWorkshopRuntime} from '../src/workshop/WorkshopController.ts'
import {RapierVehiclePhysics} from '../simulation/src/physics/rapier/RapierVehiclePhysics.ts'
import {cupWorld} from '../src/campaign/race.ts'
import {drivingSurfaces} from '../src/game/driving/DrivingRuntime.ts'
import {signalRoute} from '../src/campaign/domainLayout.ts'
for(const id of Object.keys(MODEL_SPECS))test(`v16 ${id}: empty graph cannot pass, all independent requirements accept actual composed model`,()=>{
 assert.ok(verifyModel(id,emptyModel(id)).some(c=>!c.pass))
 const graph=referenceModel(id);assert.ok(verifyModel(id,graph).every(c=>c.pass),JSON.stringify(verifyModel(id,graph)))
})
test('v16 OR instead of AND fails negative conditions; topology and port order do not define the answer',()=>{
 const g=referenceModel('power');g.nodes.find(n=>n.id==='b1').kind='or';assert.ok(verifyModel('power',g).some(c=>!c.pass));g.nodes.find(n=>n.id==='b1').kind='and';g.wires.filter(w=>w.to==='b1').forEach(w=>w.port=1-w.port);assert.ok(verifyModel('power',g).every(c=>c.pass))
})
test('v16 unconnected Inports still display their actual injected values without pretending the output is connected',()=>{const r=evaluateModel(emptyModel('power'),{ready:true,pack:true});assert.equal(r.values['in-ready'],true);assert.equal(r.values['in-pack'],true);assert.equal(r.output.enable,false);assert.ok(r.errors.length)})
test('v16 typed connection rejects Nm→Boolean and algebraic cycles, and replaces one socket',()=>{
 let g=referenceModel('request');assert.match(connectModel(g,'b3','b1',0).error,/불일치/)
 assert.match(connectModel(g,'b1','b1',0).error,/순환/)
 const power=referenceModel('power'),changed=connectModel(power,'in-ready','b1',1).graph;assert.equal(changed.wires.filter(w=>w.to==='b1'&&w.port===1).length,1);assert.ok(verifyModel('power',changed).some(c=>!c.pass))
})
test('v16 wheels are front/rear pairs first; each domain includes physical and software completion before the next round',()=>{
 let a=initialAdventure();a.phase='base';a=assembleAdventurePart(a,'motor');assert.equal(a.record.assembly.motor,'TRAY');for(const id of ['frontLeft','frontRight'])a=assembleAdventurePart(a,id);assert.equal(a.record.assembly.rearLeft,'TRAY');a.wheelPairs=1;for(const id of ['rearLeft','rearRight'])a=assembleAdventurePart(a,id);a.wheelPairs=2
 for(let i=0;i<ROUNDS.length;i++){
  a.phase='assemble';const round=ROUNDS[i];for(const part of round.parts)a=assembleAdventurePart(a,part)
  assert.equal(assembleAdventurePart(a,'frontLeft').record.assembly.frontLeft,'FIXED')
  for(let j=0;j<round.models.length;j++){a.phase='logic';a.model=j;const id=round.models[j];assert.equal(completeModel(a).completed.includes(id),false);a=editAdventure(a,id,referenceModel(id));a=completeModel(confirmModel(a));assert.ok(a.completed.includes(id))}
  assert.equal(a.phase,'reward');assert.equal(a.record.cables.length,0,'final cross-domain harness is not silently installed early');a=nextRound(a)
  assert.equal(a.phase,i===3?'integrate':'experience');assert.equal(a.round,Math.min(i+1,3))
 }
 assert.ok(allAssemblyParts.every(p=>a.record.assembly[p.id]==='FIXED'));a=editAdventure(a,'integration',referenceModel('integration'));a=completeModel(confirmModel(a));assert.equal(a.phase,'seal');assert.equal(a.record.cables.length,6);assert.equal(canEnterCup(a),false);a.bodyClosed=true;a.trialChecks=['accelerate','brake','steer'];assert.ok(canEnterCup(a));assert.deepEqual(loadAdventure(JSON.parse(JSON.stringify(a))),a)
 const moved=structuredClone(a.designs.drive);moved.nodes[0].x+=40;assert.equal(graphStamp(moved),graphStamp(a.designs.drive));const old=a.completed.length;a=editAdventure(a,'drive',emptyModel('drive'));assert.ok(a.completed.length<old);assert.equal(canEnterCup(a),false)
})
test('v16 domain outputs compose into actual drive, brake force and steering requests, not decoration',()=>{
 const designs=providedDesigns(),normal={ready:true,pack:true,pedal:50,cap:180,brake:0,gear:'D',steer:.5}
 assert.deepEqual(executeVehicle(designs,normal).integrated.output,{torque:90,brakeForce:0,wheelAngle:.24})
 assert.deepEqual(executeVehicle(designs,{...normal,brake:100}).integrated.output,{torque:0,brakeForce:4200,wheelAngle:.24})
 designs.brake=emptyModel('brake');assert.equal(executeVehicle(designs,{...normal,brake:100}).integrated.output.brakeForce,0)
})
test('v16 learner brake/steering/drive models change real C/Rapier commands; malformed graph cannot create force',async()=>{
 await Rapier.init();const wasm=await WebAssembly.compile(await readFile(new URL('../simulation/src/runtime/c/generated/vehicle-sw.wasm',import.meta.url))),record=assembledRecord();record.cables.push(...chassisCables.map(c=>c.id));for(const part of allAssemblyParts)record.assembly[part.id]='FIXED';const designs=providedDesigns(),controls={ready:true,brake:0,channelOffset:0,ageMs:20,capNm:180,ecuRequired:true,domainDesigns:designs};let telemetry
 const e=createWorkshopRuntime(wasm,()=>({record,controls}),t=>telemetry=t),world=new Rapier.World({x:0,y:-9.81,z:0}),adapter=new RapierVehiclePhysics(Rapier,world,()=>world.step(),cupWorld,drivingSurfaces);const detach=e.runtime.attach(adapter);e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);for(let i=0;i<180;i++)e.runtime.advance(1/60)
 assert.equal(e.controller.frame.torqueNm,180);assert.ok(telemetry.speedKmh>10);assert.ok(e.runtime.readVehicleState().position.z<-3)
 controls.brake=.049;e.runtime.driverInput.setBrake(.049);for(let i=0;i<30;i++)e.runtime.advance(1/60);assert.equal(e.controller.frame.torqueNm,180);assert.ok(telemetry.physicsCommand.driveForceN>0,'an invisible second raw-brake gate must not contradict the authored 5% interlock');controls.brake=0;e.runtime.driverInput.setBrake(0)
 e.runtime.driverInput.setSteering(.5);for(let i=0;i<45;i++)e.runtime.advance(1/60);assert.ok(telemetry.physicsCommand.frontWheelAngleRad>.15,JSON.stringify({steer:telemetry.steering,command:telemetry.physicsCommand}))
 controls.brake=1;e.runtime.driverInput.setBrake(1);e.runtime.driverInput.setAccelerator(0);for(let i=0;i<60;i++)e.runtime.advance(1/60);assert.equal(telemetry.physicsCommand.brakeForceN,4200);assert.equal(e.controller.frame.torqueNm,0)
 controls.brake=0;e.runtime.reset();e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);let ticks=0;while(ticks<1800&&e.runtime.readVehicleState().position.z>-160){e.runtime.advance(1/60);ticks++}assert.ok(ticks/60>5&&ticks/60<22,'new composed car must finish the straight sprint quickly enough to compete');assert.ok(e.runtime.readVehicleState().position.z<=-160)
 controls.domainDesigns={...designs,steer:emptyModel('steer'),brake:emptyModel('brake')};for(let i=0;i<30;i++)e.runtime.advance(1/60);assert.equal(telemetry.physicsCommand.brakeForceN,0);assert.equal(telemetry.physicsCommand.frontWheelAngleRad,0)
 e.runtime.pause();detach();adapter.dispose();world.free()
})
test('v16 malformed saves fail safely; stale graph approvals cannot restore later race access',()=>{assert.equal(loadAdventure({version:16,phase:'atlas'}).phase,'dream');const a=initialAdventure();a.phase='race';a.completed=Object.keys(MODEL_SPECS);assert.equal(loadAdventure(a).phase,'integrate');a.designs.power.nodes.push({...a.designs.power.nodes[0]});assert.equal(loadAdventure(a).phase,'dream')})
test('v16 long request-cap wire uses a bottom lane instead of cutting through Gain/Saturation bodies',()=>{const graph=referenceModel('request'),wire=graph.wires.find(w=>w.from==='in-cap'),a=graph.nodes.find(n=>n.id===wire.from),b=graph.nodes.find(n=>n.id===wire.to);const route=signalRoute(graph,a,b,wire.port,3,true);assert.match(route,/V\d+H/);const bus=Number(route.match(/V(\d+)/)[1]);assert.ok(bus>250,route)})
