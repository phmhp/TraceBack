// React progression smoke test. The 3D canvas is mocked; C/Rapier is tested separately.
import assert from 'node:assert/strict'
import {mkdtempSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve,dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {JSDOM} from 'jsdom'
import React,{act} from 'react'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dom=new JSDOM('<div id="root"></div>',{url:'http://domain.test/'})
for(const key of ['window','document','localStorage','sessionStorage','Element','HTMLElement','HTMLCanvasElement','Node','Event','MouseEvent'])globalThis[key]=dom.window[key]
globalThis.self=dom.window;globalThis.IS_REACT_ACT_ENVIRONMENT=true
globalThis.__domainWasm=await WebAssembly.compile(readFileSync(join(project,'simulation/src/runtime/c/generated/vehicle-sw.wasm')))
globalThis.requestAnimationFrame=()=>0;globalThis.cancelAnimationFrame=()=>{}
dom.window.HTMLElement.prototype.scrollTo=function(){}
dom.window.HTMLElement.prototype.scrollIntoView=function(){}
dom.window.HTMLElement.prototype.setPointerCapture=function(){}
dom.window.SVGElement.prototype.setPointerCapture=function(){}
dom.window.SVGElement.prototype.getBoundingClientRect=function(){return{x:0,y:0,left:0,top:0,width:1000,height:560,right:1000,bottom:560}}
const mockScene="import React from 'react';export function WorkshopScene(p){return React.createElement('div',{'data-scene':true,'data-finish':!!p.finishLine,'data-garage':!!p.garageFinale},React.createElement('canvas',{'data-view':p.view}))}"
const server=await createServer({root:project,configFile:false,cacheDir:mkdtempSync(join(tmpdir(),'momo-domain-ui-')),plugins:[{name:'domain-test-gpu',enforce:'pre',transform(code,id){const p=id.replaceAll('\\','/');if(p.endsWith('/game/driving/DrivingAssets.ts'))return'export const compileDrivingSw=()=>Promise.resolve(globalThis.__domainWasm)';if(p.endsWith('/workshop/WorkshopScene.tsx'))return mockScene;if(p.endsWith('/campaign/MechanismView.tsx'))return"import React from 'react';export function MechanismView(p){return React.createElement('div',{'data-mechanism':p.domain},'3D scene mocked')}";if(p.endsWith('/campaign/CinemaIntro.tsx'))return"import React from 'react';export function CinemaIntro(){return React.createElement('div',null,'film mocked')}";if(p.endsWith('/campaign/MarketIntro.tsx'))return"import React from 'react';export function MarketIntro(){return React.createElement('div',null,'market mocked')}"}},react()],server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[],entries:[]},appType:'custom'})
const {createRoot}=await import('react-dom/client'),host=document.getElementById('root');let root,exits=0
const errors=[];window.addEventListener('error',event=>errors.push(String(event.error)))
const button=text=>[...host.querySelectorAll('button')].find(item=>item.textContent.includes(text)),action=()=>host.querySelector('.d16-action>button'),read=()=>JSON.parse(localStorage.getItem('vehicle-logic-lab.momo-cup.v1')).adventure
async function click(element){assert.ok(element,'missing action');assert.ok(!element.disabled,element.textContent);await act(()=>element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));assert.deepEqual(errors,[])}
async function mount(Component,reduced=false){if(root)await act(()=>root.unmount());host.replaceChildren();root=createRoot(host,{onUncaughtError:error=>errors.push(String(error)),onCaughtError:error=>errors.push(String(error))});await act(async()=>{root.render(React.createElement(Component,{paused:false,reduced,volume:0,onMenu(){},onResume(){},onExit(){exits++},onVolume(){},onReduced(){}}));await new Promise(done=>setTimeout(done,35))});assert.deepEqual(errors,[])}

try{
 const {default:Campaign}=await server.ssrLoadModule('/src/campaign/DomainCampaign.tsx')
 const {initialAdventure,graphStamp}=await server.ssrLoadModule('/src/campaign/adventure.ts')
 const {PLAY_MODELS,ROUNDS,referenceModel}=await server.ssrLoadModule('/src/campaign/domainTraining.ts')
 const {BUILD_LINKS}=await server.ssrLoadModule('/src/campaign/build.ts')
 const {allAssemblyParts}=await server.ssrLoadModule('/src/workshop/assembly.ts')
 function seed(phase,round=0){const a=initialAdventure();a.phase=phase;a.round=round;a.bodyClosed=true;a.record.cables=BUILD_LINKS.map(item=>item.id);for(const part of allAssemblyParts)a.record.assembly[part.id]='FIXED';localStorage.setItem('vehicle-logic-lab.momo-cup.v1',JSON.stringify({adventure:a}));return a}
 for(let index=0;index<ROUNDS.length;index++){
  const id=PLAY_MODELS[ROUNDS[index].id],a=seed('logic',index);a.designs[id]=referenceModel(id);a.checked=graphStamp(a.designs[id]);localStorage.setItem('vehicle-logic-lab.momo-cup.v1',JSON.stringify({adventure:a}))
  await mount(Campaign)
  assert.ok(host.querySelector('.d16-device-signal'),'right panel device and signal path')
  assert.ok(host.querySelector('.d16-function-pieces'),'system/domain/function puzzle placement')
  assert.ok(host.querySelector('.d16-flow-chart'),'visible function flow')
  await click(action());assert.ok(host.querySelector('.d16-cases'),'next opens the run view')
  assert.ok(host.querySelector('.d16-device-signal'),'run keeps the device and signal path')
  await click(action());assert.equal(read().phase,'reward','one authored function per domain');assert.ok(read().completed.includes(id));assert.ok(host.querySelector('.d16-stage-signal'),'reward keeps the right-side device path')
 }
 seed('experience');await mount(Campaign)
 assert.ok(host.querySelector('.d16-driving-signal'),'driver view device path')
 assert.ok(host.textContent.includes('에너지·전원 경계 조건 확인'),'BMS boundary tests in energy domain')
 assert.ok(host.querySelector('.d16-signal-help'),'live flow is inline toggle')
 seed('trial');await mount(Campaign)
 assert.ok(host.querySelector('.d16-device-signal'),'system trial integrated path')
 assert.ok(!host.textContent.includes('SOC 5% 경계'),'system trial excludes BMS cases')
 const final=seed('finishLine');final.trialChecks=['accelerate','brake','steer'];final.completed=[...Object.values(PLAY_MODELS),'integration'];for(const id of final.completed)final.designs[id]=referenceModel(id);final.lastRace={seconds:30,stars:2};localStorage.setItem('vehicle-logic-lab.momo-cup.v1',JSON.stringify({adventure:final}))
 await mount(Campaign,true);assert.equal(read().phase,'finishLine');assert.ok(host.querySelector('.d16-finish-banner'));assert.ok(host.querySelector('.d16-stage-signal'));assert.equal(host.querySelector('.d16-action'),null,'finish celebration runs before podium without a skip button');assert.equal(host.querySelector('[data-scene]').dataset.finish,'true')
 await act(async()=>{await new Promise(done=>setTimeout(done,950))});assert.equal(read().phase,'finish','finish-line celebration precedes podium')
 final.phase='atlas';localStorage.setItem('vehicle-logic-lab.momo-cup.v1',JSON.stringify({adventure:final}));await mount(Campaign,true)
 await click(button('전시 마치기'));assert.ok(host.textContent.includes('차고지 · 새 자동차 1대 추가'));assert.ok(host.textContent.includes('그리스 고양이섬'));assert.equal(host.querySelector('[data-scene]').dataset.garage,'true');await click(button('메인 화면으로 돌아가기'));assert.equal(exits,1)
 console.log('PASS: four single-function domains, device paths, energy BMS cases, inline flow toggle, system trial, FINISH before podium, garage goodbye.')
}finally{if(root)await act(()=>root.unmount());await server.close();dom.window.close();delete globalThis.__domainWasm}
