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
const server=await createServer({root,configFile:false,cacheDir:mkdtempSync(join(tmpdir(),'momo-v6-ui-')),plugins:[react()],optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true},appType:'custom'})
globalThis.IS_REACT_ACT_ENVIRONMENT=true
globalThis.self={requestAnimationFrame(){return 0},cancelAnimationFrame(){}}
globalThis.localStorage={getItem(){return null},setItem(){}}
try {
  const {default:Game}=await server.ssrLoadModule('/src/game/Game.tsx')
  const title=renderToStaticMarkup(React.createElement(Game))
  assert.ok(title.includes('새 모험 시작')&&!title.includes('<iframe'))
  const {GuidedBoard}=await server.ssrLoadModule('/src/game/ConnectionBoard.tsx')
  const {starter,MISSIONS}=await server.ssrLoadModule('/src/content/ready.ts')
  const {LESSONS}=await server.ssrLoadModule('/src/game/lessons.ts')
  const {LogicSimulation}=await server.ssrLoadModule('/src/engine/simulation.ts')
  const snapshot=new LogicSimulation('STANDBY','logic').step(starter(),{})
  const board=renderToStaticMarkup(React.createElement(GuidedBoard,{graph:starter(),lesson:LESSONS[0][0],snapshot,onChange(){},onSound(){}}))
  for(const value of ['data-socket','브레이크 페달','AND','되돌리기','선 빼기'])assert.ok(board.includes(value),value)
  const {RequirementBrief}=await server.ssrLoadModule('/src/game/RequirementBrief.tsx')
  assert.ok(renderToStaticMarkup(React.createElement(RequirementBrief,{mission:MISSIONS[0]})).includes(MISSIONS[0].goal))
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
  }finally{await cabin.unmount()}
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
  console.log('PASS: title, readable socket board, requirements, 3D pedal/steering transforms, 3D pedal events, animated breakdown. Not browser screenshots or a visual playthrough.')
}finally{delete globalThis.localStorage;delete globalThis.self;delete globalThis.IS_REACT_ACT_ENVIRONMENT;await server.close()}
