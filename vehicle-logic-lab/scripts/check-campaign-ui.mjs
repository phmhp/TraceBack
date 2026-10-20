import assert from 'node:assert/strict'
import {dirname,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import React from 'react'
import {renderToStaticMarkup} from 'react-dom/server'
const root=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const server=await createServer({configFile:false,root,plugins:[react()],server:{middlewareMode:true},appType:'custom'})
try{
  const {KnowledgeAtlas}=await server.ssrLoadModule('/simulation/src/ui/components/KnowledgeAtlas.tsx')
  const atlas=renderToStaticMarkup(React.createElement(KnowledgeAtlas,{onClose(){}}))
  for(const value of ['74','111','50','180','DRAFT','LF-PROP-EDRV','SIGNAL','INTERFACE'])assert.ok(atlas.includes(value),value)
  const {SessionSetupScreen}=await server.ssrLoadModule('/simulation/src/ui/screens/SessionSetupScreen.tsx')
  const setup=renderToStaticMarkup(React.createElement(SessionSetupScreen))
  for(const value of ['조사 난이도','STANDARD','EXPERT','시험 주행 시작','momo-garage-v5.png'])assert.ok(setup.includes(value),value)
  const {DriveControlsPanel}=await server.ssrLoadModule('/simulation/src/ui/components/DriveControls.tsx')
  const {INITIAL_TELEMETRY}=await server.ssrLoadModule('/simulation/src/runtime/SimulationRuntime.ts')
  const controls=renderToStaticMarkup(React.createElement(DriveControlsPanel,{runtime:{driverInput:{resetMotion(){}}},phase:'NORMAL_DRIVE',telemetry:INITIAL_TELEMETRY}))
  for(const value of ['브레이크 압력','가속 페달 압력','연속 조향','role="slider"'])assert.ok(controls.includes(value),value)
  console.log('Static component contracts: knowledge graph, continuous controls, difficulty and campaign brief PASS. Not a browser visual/play test.')
}finally{await server.close()}
