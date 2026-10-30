import test from 'node:test'
import assert from 'node:assert/strict'
import {readFile} from 'node:fs/promises'
import Rapier from '@dimforge/rapier3d-compat'
import {MODEL_SPECS,ROUNDS,referenceModel,emptyModel,providedDesigns,addBlock,addLibraryBlock,connectModel,evaluateModel,verifyModel,executeVehicle,wrapBlockAsSubsystem} from '../src/campaign/domainTraining.ts'
test('subsystem preserves behavior, exposes typed ports and executes its nested graph',()=>{
 const original=referenceModel('request'),nested=wrapBlockAsSubsystem(original,'b2')
 assert.equal(nested.nodes.find(n=>n.id==='b2').kind,'subsystem')
 assert.ok(verifyModel('request',nested).every(item=>item.pass))
 const broken=structuredClone(nested);broken.nodes.find(n=>n.id==='b2').subgraph.wires=[]
 assert.ok(verifyModel('request',broken).some(item=>!item.pass))
})
test('nested and library blocks survive a saved campaign reload without losing earlier progress',()=>{
 const a=initialAdventure();let graph=referenceModel('power');graph=wrapBlockAsSubsystem(graph,'b1');a.designs.power=graph
 assert.equal(loadAdventure(JSON.parse(JSON.stringify(a))).recovery,undefined)
 let library=addLibraryBlock(emptyModel('power'),'logical','Logical Operator',{operation:'AND'},2)
 const node=library.nodes.find(n=>n.kind==='library')
 library=connectModel(library,'in-ready',node.id,0).graph
 library=connectModel(library,'in-pack',node.id,1).graph
 library=connectModel(library,node.id,'out-enable',0).graph
 a.designs.power=library
 assert.equal(loadAdventure(JSON.parse(JSON.stringify(a))).recovery,undefined)
 assert.ok(verifyModel('power',loadAdventure(JSON.parse(JSON.stringify(a))).designs.power).every(c=>c.pass))
})
import {initialAdventure,assembleAdventurePart,assembleWheelPair,confirmModel,completeModel,nextRound,editAdventure,canEnterCup,loadAdventure,graphStamp} from '../src/campaign/adventure.ts'
import {assembledRecord} from '../src/campaign/model.ts'
import {allAssemblyParts,chassisCables} from '../src/workshop/assembly.ts'
import {BUILD_LINKS} from '../src/campaign/build.ts'
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
test('v16 exploratory connections remain drawable; evaluation reports type mismatch and cycles stay blocked',()=>{
 let g=referenceModel('request');const mismatch=connectModel(g,'in-cap','b1',0);assert.equal(mismatch.error,'');assert.equal(mismatch.graph.wires.find(w=>w.to==='b1'&&w.port===0)?.from,'in-cap');assert.ok(evaluateModel(mismatch.graph,{pedal:50,cap:180}).errors.length)
 assert.match(connectModel(g,'b1','b1',0).error,/순환/)
 const power=referenceModel('power'),changed=connectModel(power,'in-ready','b1',1).graph;assert.equal(changed.wires.filter(w=>w.to==='b1'&&w.port===1).length,1);assert.ok(verifyModel('power',changed).some(c=>!c.pass))
})
test('v16 wheels are front/rear pairs first; each domain includes physical and software completion before the next round',()=>{
 let a=initialAdventure();a.phase='base';a=assembleAdventurePart(a,'motor');assert.equal(a.record.assembly.motor,'TRAY');a=assembleAdventurePart(a,'frontLeft');assert.equal(a.record.assembly.frontRight,'TRAY','왼쪽 바퀴를 장착해도 오른쪽은 별도 조립해야 한다');a=assembleAdventurePart(a,'frontRight');assert.equal(a.record.assembly.rearLeft,'TRAY');a.wheelPairs=1;a=assembleAdventurePart(a,'rearLeft');assert.equal(a.record.assembly.rearRight,'TRAY','뒤 바퀴도 한 쪽씩 장착한다');a=assembleAdventurePart(a,'rearRight');a.wheelPairs=2
 for(let i=0;i<ROUNDS.length;i++){
  a.phase='assemble';const round=ROUNDS[i];for(const part of round.parts)a=assembleAdventurePart(a,part)
  assert.equal(assembleAdventurePart(a,'frontLeft').record.assembly.frontLeft,'FIXED')
  for(let j=0;j<round.models.length;j++){a.phase='logic';a.model=j;const id=round.models[j];assert.equal(completeModel(a).completed.includes(id),false);a=editAdventure(a,id,referenceModel(id));a=completeModel(confirmModel(a));assert.ok(a.completed.includes(id))}
  assert.equal(a.phase,'reward');assert.equal(a.record.cables.length,0,'final cross-domain harness is not silently installed early');a=nextRound(a)
  assert.equal(a.phase,i===3?'seal':'experience');assert.equal(a.round,Math.min(i+1,3))
 }
 assert.ok(allAssemblyParts.every(p=>a.record.assembly[p.id]==='FIXED'));assert.equal(canEnterCup(a),false);a.bodyClosed=true;a.record.cables=BUILD_LINKS.map(link=>link.id);a.phase='integrate';a=editAdventure(a,'integration',referenceModel('integration'));a=completeModel(confirmModel(a));assert.equal(a.phase,'trial');assert.equal(a.record.cables.length,6);assert.equal(canEnterCup(a),false);a.trialChecks=['accelerate','brake','steer'];assert.ok(canEnterCup(a));assert.deepEqual(loadAdventure(JSON.parse(JSON.stringify(a))),a)
 const moved=structuredClone(a.designs.drive);moved.nodes[0].x+=40;assert.equal(graphStamp(moved),graphStamp(a.designs.drive));const old=a.completed.length;a=editAdventure(a,'drive',emptyModel('drive'));assert.ok(a.completed.length<old);assert.equal(canEnterCup(a),false)
})
test('v16 guided wheel action installs both members of each pair in one operation',()=>{
 let a=initialAdventure();a.phase='base';a=assembleWheelPair(a);assert.equal(a.record.assembly.frontLeft,'FIXED');assert.equal(a.record.assembly.frontRight,'FIXED');assert.equal(a.record.assembly.rearLeft,'TRAY');a.wheelPairs=1;a=assembleWheelPair(a);assert.equal(a.record.assembly.rearLeft,'FIXED');assert.equal(a.record.assembly.rearRight,'FIXED')
})
test('v16 domain outputs compose into actual drive, brake force and steering requests, not decoration',()=>{
 const designs=providedDesigns(),normal={ready:true,pack:true,pedal:50,cap:180,brake:0,gear:'D',steer:.5}
 assert.deepEqual(executeVehicle(designs,normal).integrated.output,{torque:90,brakeForce:0,wheelAngle:.24})
 assert.deepEqual(executeVehicle(designs,{...normal,brake:100}).integrated.output,{torque:0,brakeForce:4200,wheelAngle:.24})
 designs.brake=emptyModel('brake');assert.equal(executeVehicle(designs,{...normal,brake:100}).integrated.output.brakeForce,0)
})
test('BMS block decision feeds VCU power permission without accepting unsafe cases',()=>{
 const designs=providedDesigns(),base={ready:true,pack:true,pedal:50,cap:180,brake:0,gear:'D',steer:0}
 assert.equal(executeVehicle(designs,base).bms.output.safe,true)
 assert.equal(executeVehicle(designs,{...base,soc:5}).integrated.output.torque,0)
 assert.equal(executeVehicle(designs,{...base,packTempC:60}).integrated.output.torque,0)
 assert.equal(executeVehicle(designs,{...base,isolationOk:false}).integrated.output.torque,0)
 designs.bms=emptyModel('bms')
 assert.equal(executeVehicle(designs,base).integrated.output.torque,0)
})
test('older six-model finish keeps its car and gains a reviewed BMS graph on load',()=>{
 const save=initialAdventure();save.phase='atlas';save.round=3;save.designs=providedDesigns();delete save.designs.bms;delete save.designs.start;save.completed=['power','request','drive','brake','steer','integration'];save.bodyClosed=true;save.trialChecks=['accelerate','brake','steer'];save.lastRace={seconds:30,stars:2};save.record.cables=BUILD_LINKS.map(link=>link.id);for(const part of allAssemblyParts)save.record.assembly[part.id]='FIXED'
 const loaded=loadAdventure(JSON.parse(JSON.stringify(save)))
 assert.equal(loaded.phase,'atlas');assert.equal(loaded.lastRace.seconds,30);for(const id of ['bms','start']){assert.ok(loaded.completed.includes(id));assert.ok(loaded.assisted.includes(id),'migration must not claim the player authored the supplied graph');assert.ok(verifyModel(id,loaded.designs[id]).every(result=>result.pass))}assert.ok(canEnterCup(loaded))
})
test('v16 learner brake/steering/drive models change real C/Rapier commands; malformed graph cannot create force',async()=>{
 await Rapier.init();const wasm=await WebAssembly.compile(await readFile(new URL('../simulation/src/runtime/c/generated/vehicle-sw.wasm',import.meta.url))),record=assembledRecord();record.cables.push(...chassisCables.map(c=>c.id));for(const part of allAssemblyParts)record.assembly[part.id]='FIXED';const designs=providedDesigns(),controls={ready:true,brake:0,channelOffset:0,ageMs:20,capNm:180,ecuRequired:true,domainDesigns:designs};let telemetry
 const e=createWorkshopRuntime(wasm,()=>({record,controls}),t=>telemetry=t),world=new Rapier.World({x:0,y:-9.81,z:0}),adapter=new RapierVehiclePhysics(Rapier,world,()=>world.step(),cupWorld,drivingSurfaces);const detach=e.runtime.attach(adapter);e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);for(let i=0;i<180;i++)e.runtime.advance(1/60)
 assert.equal(e.controller.frame.torqueNm,180);assert.ok(telemetry.speedKmh>10);assert.ok(e.runtime.readVehicleState().position.z<-3)
 const runTrace=e.readRunTrace(),last=runTrace.at(-1);assert.ok(runTrace.length>=170);assert.equal(last.tickId,runTrace.at(-2).tickId+1);assert.equal(last.sw.motorTorqueCmdNm,180);assert.equal(last.actuator.driveForceN,telemetry.physicsCommand.driveForceN);assert.ok(Math.abs(last.vehicle.speedKmh-e.runtime.readVehicleState().speed*3.6)<.01);assert.equal(last.system.packAvailable,true);assert.ok(last.graph.request.some(event=>event.nodeId==='out-request'&&event.value===180));assert.ok(last.graph.integration.some(event=>event.nodeId==='out-torque'&&event.value===180))
 controls.brake=.049;e.runtime.driverInput.setBrake(.049);for(let i=0;i<30;i++)e.runtime.advance(1/60);assert.equal(e.controller.frame.torqueNm,180);assert.ok(telemetry.physicsCommand.driveForceN>0,'an invisible second raw-brake gate must not contradict the authored 5% interlock');controls.brake=0;e.runtime.driverInput.setBrake(0)
 e.runtime.driverInput.setSteering(.5);for(let i=0;i<45;i++)e.runtime.advance(1/60);assert.ok(telemetry.physicsCommand.frontWheelAngleRad>.15,JSON.stringify({steer:telemetry.steering,command:telemetry.physicsCommand}))
 controls.brake=1;e.runtime.driverInput.setBrake(1);e.runtime.driverInput.setAccelerator(0);for(let i=0;i<60;i++)e.runtime.advance(1/60);assert.equal(telemetry.physicsCommand.brakeForceN,4200);assert.equal(e.controller.frame.torqueNm,0)
 controls.brake=0;e.runtime.reset();e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);let ticks=0;while(ticks<1800&&e.runtime.readVehicleState().position.z>-160){e.runtime.advance(1/60);ticks++}assert.ok(ticks/60>5&&ticks/60<22,'new composed car must finish the straight sprint quickly enough to compete');assert.ok(e.runtime.readVehicleState().position.z<=-160)
 assert.equal(e.readRunTrace()[0].tickId,1,'reset starts a fresh trace instead of mixing old and new runs')
 controls.domainDesigns={...designs,steer:emptyModel('steer'),brake:emptyModel('brake')};for(let i=0;i<30;i++)e.runtime.advance(1/60);assert.equal(telemetry.physicsCommand.brakeForceN,0);assert.equal(telemetry.physicsCommand.frontWheelAngleRad,0)
 controls.domainDesigns=designs;controls.systemInput={isolationOk:false};controls.brake=0;e.runtime.reset();e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);for(let i=0;i<60;i++)e.runtime.advance(1/60);assert.equal(e.controller.frame.torqueNm,0);assert.equal(telemetry.physicsCommand.driveForceN,0);assert.ok(e.controller.systemFrame.diagnostics.includes('절연 이상'))
 controls.systemInput={packSoc:5};e.runtime.reset();e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);for(let i=0;i<60;i++)e.runtime.advance(1/60);assert.equal(e.controller.lastDomainExecution.bms.output.safe,false);assert.equal(telemetry.physicsCommand.driveForceN,0);assert.equal(e.readRunTrace().at(-1).system.bmsSafe,false)
 controls.systemInput={packTempC:60};e.runtime.reset();e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);for(let i=0;i<60;i++)e.runtime.advance(1/60);assert.equal(e.controller.lastDomainExecution.bms.output.safe,false);assert.equal(telemetry.physicsCommand.driveForceN,0)
 controls.systemInput={motorTempC:78};e.runtime.reset();e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);for(let i=0;i<60;i++)e.runtime.advance(1/60);assert.ok(e.controller.frame.torqueNm>0&&e.controller.frame.torqueNm<180);assert.equal(e.controller.systemFrame.thermal.fan,true)
 controls.systemInput={};controls.domainDesigns={...designs,bms:emptyModel('bms')};e.runtime.reset();e.runtime.start();e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1);for(let i=0;i<60;i++)e.runtime.advance(1/60);assert.equal(e.controller.frame.torqueNm,0);assert.equal(telemetry.physicsCommand.driveForceN,0)
 e.runtime.pause();detach();adapter.dispose();world.free()
})
test('manual START passes through precharge before READY and fault inhibits the same car',async()=>{
 await Rapier.init()
 const wasm=await WebAssembly.compile(await readFile(new URL('../simulation/src/runtime/c/generated/vehicle-sw.wasm',import.meta.url)))
 const record=assembledRecord();record.cables.push(...chassisCables.map(c=>c.id));for(const part of allAssemblyParts)record.assembly[part.id]='FIXED'
 const controls={ready:false,brake:1,channelOffset:0,ageMs:20,capNm:180,ecuRequired:true,requireStartSequence:true,domainDesigns:providedDesigns(),systemInput:{isolationOk:true}}
 const e=createWorkshopRuntime(wasm,()=>({record,controls}),()=>{}),world=new Rapier.World({x:0,y:-9.81,z:0}),adapter=new RapierVehiclePhysics(Rapier,world,()=>world.step(),cupWorld,drivingSurfaces),detach=e.runtime.attach(adapter)
 try{
  e.runtime.start();e.runtime.driverInput.setGearRequest('P');e.runtime.driverInput.setBrake(1);for(let i=0;i<3;i++)e.runtime.advance(1/60)
  controls.ready=true;for(let i=0;i<5;i++)e.runtime.advance(1/60)
  assert.equal(e.controller.systemFrame.state.hv,'PRECHARGE');assert.equal(e.controller.systemFrame.contactors.main,false);assert.equal(e.readRunTrace().at(-1).actuator.driveForceN,0)
  for(let i=0;i<25;i++)e.runtime.advance(1/60)
  assert.equal(e.controller.systemFrame.state.hv,'READY');assert.equal(e.controller.systemFrame.contactors.main,true)
  controls.brake=0;e.runtime.driverInput.setBrake(0);e.runtime.driverInput.setGearRequest('D');e.runtime.driverInput.setAccelerator(1)
  for(let i=0;i<90;i++)e.runtime.advance(1/60)
  assert.ok(e.runtime.readVehicleState().speed>1)
  controls.systemInput.isolationOk=false;for(let i=0;i<3;i++)e.runtime.advance(1/60)
  assert.equal(e.controller.systemFrame.state.hv,'FAULT');assert.equal(e.readRunTrace().at(-1).actuator.driveForceN,0)
 }finally{e.runtime.pause();detach();adapter.dispose();world.free()}
})

test('player START graph decides whether a button edge may start physical precharge',async()=>{
 await Rapier.init()
 const wasm=await WebAssembly.compile(await readFile(new URL('../simulation/src/runtime/c/generated/vehicle-sw.wasm',import.meta.url)))
 const record=assembledRecord();record.cables.push(...chassisCables.map(c=>c.id));for(const part of allAssemblyParts)record.assembly[part.id]='FIXED'
 const controls={ready:false,brake:1,channelOffset:0,ageMs:20,capNm:180,ecuRequired:true,requireStartSequence:true,domainDesigns:{...providedDesigns(),start:emptyModel('start')}}
 const e=createWorkshopRuntime(wasm,()=>({record,controls}),()=>{}),world=new Rapier.World({x:0,y:-9.81,z:0}),adapter=new RapierVehiclePhysics(Rapier,world,()=>world.step(),cupWorld,drivingSurfaces),detach=e.runtime.attach(adapter)
 try{
  e.runtime.start();e.runtime.driverInput.setGearRequest('P');e.runtime.driverInput.setBrake(1);e.runtime.advance(1/60)
  controls.ready=true;for(let i=0;i<35;i++)e.runtime.advance(1/60)
  assert.equal(e.controller.systemFrame.state.hv,'OFF');assert.equal(e.controller.lastStartPermit,false);assert.equal(e.readRunTrace().at(-1).system.mainContactor,false)
  controls.ready=false;e.runtime.advance(1/60);controls.domainDesigns.start=referenceModel('start');controls.ready=true
  for(let i=0;i<35;i++)e.runtime.advance(1/60)
  assert.equal(e.controller.systemFrame.state.hv,'READY');assert.equal(e.controller.systemFrame.contactors.main,true)
 }finally{e.runtime.pause();detach();adapter.dispose();world.free()}
})
test('v16 malformed saves fail safely; stale graph approvals cannot restore later race access',()=>{assert.equal(loadAdventure({version:16,phase:'atlas'}).phase,'dream');const a=initialAdventure();a.phase='race';a.completed=Object.keys(MODEL_SPECS);assert.equal(loadAdventure(a).phase,'integrate');a.designs.power.nodes.push({...a.designs.power.nodes[0]});assert.equal(loadAdventure(a).phase,'dream')})
test('v16 long request-cap wire uses a bottom lane instead of cutting through Gain/Saturation bodies',()=>{const graph=referenceModel('request'),wire=graph.wires.find(w=>w.from==='in-cap'),a=graph.nodes.find(n=>n.id===wire.from),b=graph.nodes.find(n=>n.id===wire.to);const route=signalRoute(graph,a,b,wire.port,3,true);assert.match(route,/V\d+H/);const bus=Number(route.match(/V(\d+)/)[1]);assert.ok(bus>250,route)})
