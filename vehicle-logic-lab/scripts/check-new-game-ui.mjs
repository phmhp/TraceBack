import assert from 'node:assert/strict'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname,join,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
import TestRenderer from '@react-three/test-renderer'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const server=await createServer({root,configFile:false,cacheDir:mkdtempSync(join(tmpdir(),'momo-v7-ui-')),plugins:[react()],optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true},appType:'custom'})
globalThis.sessionStorage={getItem(){return null},setItem(){}}
globalThis.IS_REACT_ACT_ENVIRONMENT=true
globalThis.self={requestAnimationFrame(){return 0},cancelAnimationFrame(){}}
globalThis.localStorage={getItem(){return null},setItem(){}}
try {
  const {default:Game}=await server.ssrLoadModule('/src/game/Game.tsx')
  const title=renderToStaticMarkup(React.createElement(Game))
  assert.ok(title.includes('시작하기')&&!title.includes('이어하기')&&!title.includes('내보내기')&&!title.includes('<iframe'))
  assert.equal((title.match(/<button/g)??[]).length,1,'the main page has only Start')
  globalThis.localStorage={getItem(){return '{"version":1,"scene":"campaign"}'},setItem(){}}
  const savedTitle=renderToStaticMarkup(React.createElement(Game))
  assert.ok(savedTitle.includes('시작하기')&&!savedTitle.includes('이어하기'),'old navigation does not bypass the main page')
  globalThis.localStorage={getItem(){return null},setItem(){}}
  const {GuidedBoard}=await server.ssrLoadModule('/src/game/BoardV7.tsx')
  const {starter,MISSIONS}=await server.ssrLoadModule('/src/content/ready.ts')
  const {LESSONS}=await server.ssrLoadModule('/src/game/lessons.ts')
  const {LogicSimulation}=await server.ssrLoadModule('/src/engine/simulation.ts')
  const snapshot=new LogicSimulation('STANDBY','logic').step(starter(),{})
  const board=renderToStaticMarkup(React.createElement(GuidedBoard,{graph:starter(),lesson:LESSONS[0][0],snapshot,onChange(){},onSound(){}}))
  for(const value of ['data-socket','브레이크 페달','AND','되돌리기','선 빼기','전체 맞춤','100%','선택 경로'])assert.ok(board.includes(value),value)
  const {RequirementBrief}=await server.ssrLoadModule('/src/game/RequirementBrief.tsx')
  const requirement=renderToStaticMarkup(React.createElement(RequirementBrief,{mission:MISSIONS[0]}))
  assert.ok(requirement.includes(MISSIONS[0].goal)&&requirement.includes('<details open'))
  const {Cabin}=await server.ssrLoadModule('/src/game/DriveExperience.tsx')
  const {INITIAL_TELEMETRY}=await server.ssrLoadModule('/simulation/src/runtime/SimulationRuntime.ts')
  const events=[]
  const cabin=await TestRenderer.create(React.createElement(Cabin,{t:{...INITIAL_TELEMETRY,brake:1,accelerator:.7,steering:.5},gear(){},onPedal:(...args)=>events.push(args)}))
  try {
    await cabin.advanceFrames(30,1/60)
    const brake=cabin.scene.findByProps({name:'driver-brake'})
    assert.ok(brake.instance.rotation.x<-.5)
    assert.ok(cabin.scene.findByProps({name:'driver-accelerator'}).instance.rotation.x<-.25)
    assert.ok(cabin.scene.findByProps({name:'driver-wheel'}).instance.rotation.z<-.3)
    await cabin.fireEvent(brake,'pointerDown',{stopPropagation(){}})
    await cabin.fireEvent(brake,'pointerUp',{stopPropagation(){}})
    assert.deepEqual(events,[['brake',true],['brake',false]])
    await cabin.update(React.createElement(Cabin,{t:INITIAL_TELEMETRY,gear(){},onPedal(){},footwell:true}))
    assert.equal(cabin.scene.findByProps({name:'driver-wheel'}).instance.visible,false)
    assert.equal(cabin.scene.findByProps({name:'driver-brake'}).instance.visible,true)
  }finally{await cabin.unmount()}
  const {CockpitPaws}=await server.ssrLoadModule('/src/campaign/CockpitPaws.tsx')
 const paws=await TestRenderer.create(React.createElement(CockpitPaws,{t:{...INITIAL_TELEMETRY,steering:0,gearRequest:'P'}}))
 try{
   await paws.advanceFrames(5,1/60)
   const left=paws.scene.findByProps({name:'momo-left-driving-paw'}).instance
   const right=paws.scene.findByProps({name:'momo-right-driving-paw'}).instance
   assert.ok(left.position.x<-.45&&right.position.x<.08,'paws meet actual wheel rim, not empty air')
   await paws.update(React.createElement(CockpitPaws,{t:{...INITIAL_TELEMETRY,steering:.5,gearRequest:'D'}}))
   await paws.advanceFrames(12,1/60)
   assert.ok(right.position.x>.35,'gear request animates hand towards selector')
 }finally{await paws.unmount()}
 const {default:SystemStudio}=await server.ssrLoadModule('/src/game/SystemStudio.tsx')
  const {newStory}=await server.ssrLoadModule('/src/game/story.ts')
  const atlas=renderToStaticMarkup(React.createElement(SystemStudio,{story:newStory(),onReady(){},onClose(){}}))
  for(const label of ['16개 영역','system-atlas-v7.png','심화 설계','참고 설계 · 미션 미구현','AUTOSAR','전체 차량 100% 구현을 뜻하지'])assert.ok(atlas.includes(label),label)
  const {TorqueBoard}=await server.ssrLoadModule('/src/game/TorqueBoard.tsx')
  const {TorqueModel,NORMAL_TORQUE_INPUT,referenceTorqueGraph}=await server.ssrLoadModule('/src/engineering/torqueModel.ts')
  const {TorqueAssemblyScene}=await server.ssrLoadModule('/src/game/TorqueAssembly.tsx')
  const {LearningVehicle}=await server.ssrLoadModule('/src/game/LearningVehicle.tsx')
  const vehicle=await TestRenderer.create(React.createElement(LearningVehicle,{brake:1,ready:true,speedKmh:18,wheelAngleRad:.2,focus:1,showDriver:false}))
  try{
    await vehicle.advanceFrames(60,1/60)
    assert.ok(vehicle.scene.findByProps({name:'platform-brake-pedal'}).instance.rotation.x<-.59)
    assert.ok(vehicle.scene.findByProps({name:'platform-ecu-lid'}).instance.position.x>1.4)
    const rotor=vehicle.scene.findByProps({name:'platform-motor-rotor'}).instance
    assert.ok(rotor.rotation.x>1)
    await vehicle.update(React.createElement(LearningVehicle,{brake:1,ready:true,speedKmh:18,paused:true,showDriver:false}))
    const before=rotor.rotation.x;await vehicle.advanceFrames(30,1/60);assert.equal(rotor.rotation.x,before)
  }finally{await vehicle.unmount()}
  const torqueGraph=referenceTorqueGraph(),frame=new TorqueModel().step(torqueGraph,NORMAL_TORQUE_INPUT)
  const {ControlDesk}=await server.ssrLoadModule('/src/workshop/ControlDesk.tsx')
  const desk=renderToStaticMarkup(React.createElement(ControlDesk,{graph:torqueGraph,frame,onChange(){},onFocus(){}}))
  for(const label of ['data-iw-port','20ms','로직 확대','같은 제어기의 전체 맥락','증가 제한'])assert.ok(desk.includes(label),label)
  const {CatDriver}=await server.ssrLoadModule('/src/graphics/CatDriver.tsx')
  const mechanic=await TestRenderer.create(React.createElement(CatDriver,{working:true}))
  try{
    await mechanic.advanceFrames(30,1/60)
    const arm=mechanic.scene.findByProps({name:'momo-right-arm'}).instance
    assert.ok(arm.rotation.z>.1)
    assert.ok(mechanic.scene.findByProps({name:'momo-wrench'}))
    await mechanic.update(React.createElement(CatDriver,{working:false}))
    await mechanic.advanceFrames(90,1/60)
    assert.ok(Math.abs(arm.rotation.z)<.01)
  }finally{await mechanic.unmount()}
  const numeric=renderToStaticMarkup(React.createElement(TorqueBoard,{graph:torqueGraph,frame,onChange(){}}))
  for(const label of ['신호 품질','전체 맞춤','전체 설계','이중 채널','ms','engineering-port'])assert.ok(numeric.includes(label),label)
  const assembly=await TestRenderer.create(React.createElement(TorqueAssemblyScene,{frame,input:NORMAL_TORQUE_INPUT}))
  try {
    await assembly.advanceFrames(60,1/60)
    const rotor=assembly.scene.findByProps({name:'training-rotor'}).instance
    const reducer=assembly.scene.findByProps({name:'training-reduction'}).instance
    assert.ok(rotor.rotation.x>0);assert.ok(reducer.rotation.x<0)
    assert.ok(Math.abs(rotor.rotation.x/-reducer.rotation.x-2.5)<1e-6)
    assert.ok(assembly.scene.findByProps({name:'training-pedal'}).instance.rotation.x<-.3)
    await assembly.update(React.createElement(TorqueAssemblyScene,{frame,input:NORMAL_TORQUE_INPUT,paused:true}))
    const before=rotor.rotation.x,pulse=assembly.scene.findByProps({name:'torque-signal-pulse'}).instance
    const position=pulse.position.toArray();await assembly.advanceFrames(60,1/60)
    assert.equal(rotor.rotation.x,before);assert.deepEqual(pulse.position.toArray(),position)
  }finally{await assembly.unmount()}
  const {Breakdown}=await server.ssrLoadModule('/src/game/FaultCutscene.tsx')
  const scene=await TestRenderer.create(React.createElement(Breakdown,{paused:false,reduced:false}))
  try{
    const capture=()=>{const transforms=[];scene.scene.instance.traverse(object=>{transforms.push([...object.position.toArray(),object.rotation.x,object.rotation.y,object.rotation.z])});return JSON.stringify(transforms)}
    const initial=capture()
    await scene.advanceFrames(90,1/60)
    assert.notEqual(capture(),initial)
    await scene.update(React.createElement(Breakdown,{paused:true,reduced:false}))
    const stopped=capture();await scene.advanceFrames(60,1/60);assert.equal(capture(),stopped)
  }finally{await scene.unmount()}
  console.log('PASS: new title, orthogonal/focused zoomable board, normal requirements open, footwell wheel cutaway, atlas/scope labels, typed engineering board, motor/reduction/pedal animation and pause, pedal events, animated breakdown. Not browser screenshots or a visual playthrough.')
}finally{delete globalThis.localStorage;delete globalThis.self;delete globalThis.IS_REACT_ACT_ENVIRONMENT;await server.close()}
