import assert from 'node:assert/strict'
import {mkdtempSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {resolve,dirname,join} from 'node:path'
import {fileURLToPath} from 'node:url'
import {JSDOM} from 'jsdom'
import React,{act} from 'react'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'

const project=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const dom=new JSDOM('<div id="root"></div>',{url:'http://bms.test/'})
for(const key of ['window','document','localStorage','sessionStorage','Element','HTMLElement','HTMLCanvasElement','SVGElement','Node','Event','MouseEvent'])globalThis[key]=dom.window[key]
globalThis.self=dom.window
globalThis.IS_REACT_ACT_ENVIRONMENT=true
globalThis.__domainWasm=await WebAssembly.compile(readFileSync(join(project,'simulation/src/runtime/c/generated/vehicle-sw.wasm')))
dom.window.HTMLElement.prototype.scrollTo=function(){}
const server=await createServer({root:project,configFile:false,cacheDir:mkdtempSync(join(tmpdir(),'vehicle-bms-ui-')),plugins:[{name:'bms-ui-gpu-stub',enforce:'pre',transform(code,id){const path=id.replaceAll('\\','/');if(path.endsWith('/game/driving/DrivingAssets.ts'))return'export const compileDrivingSw=()=>Promise.resolve(globalThis.__domainWasm)';if(path.endsWith('/workshop/WorkshopScene.tsx'))return"import React from 'react';export function WorkshopScene(){return React.createElement('div',{'data-scene':'stub'})}";if(path.endsWith('/campaign/MechanismView.tsx'))return"import React from 'react';export function MechanismView(){return React.createElement('div',{'data-mechanism':'stub'})}"}},react()],server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[],entries:[]},appType:'custom'})
const {createRoot}=await import('react-dom/client'),host=document.getElementById('root')
let root
const errors=[]
window.addEventListener('error',event=>errors.push(String(event.error)))
const click=async element=>{assert.ok(element,'missing action');assert.equal(element.disabled,false,element.textContent);await act(()=>element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));assert.deepEqual(errors,[])}
const button=text=>[...host.querySelectorAll('button')].find(element=>element.textContent.includes(text))
const saved=()=>JSON.parse(localStorage.getItem('vehicle-logic-lab.momo-cup.v1')).adventure
try{
 const {default:Campaign}=await server.ssrLoadModule('/src/campaign/DomainCampaign.tsx')
 const {initialAdventure}=await server.ssrLoadModule('/src/campaign/adventure.ts')
 const {MODEL_SPECS,ROUNDS,providedDesigns,verifyModel}=await server.ssrLoadModule('/src/campaign/domainTraining.ts')
 const {BUILD_LINKS}=await server.ssrLoadModule('/src/campaign/build.ts')
 const {allAssemblyParts}=await server.ssrLoadModule('/src/workshop/assembly.ts')
 const {CAMPAIGN_KEY,newCampaign}=await server.ssrLoadModule('/src/campaign/model.ts')
 const mount=async adventure=>{if(root)await act(()=>root.unmount());host.replaceChildren();localStorage.setItem(CAMPAIGN_KEY,JSON.stringify({...newCampaign(),adventure}));root=createRoot(host,{onUncaughtError:e=>errors.push(String(e))});await act(async()=>{root.render(React.createElement(Campaign,{paused:false,reduced:false,volume:0,onMenu(){},onResume(){},onExit(){},onVolume(){},onReduced(){}}));await new Promise(done=>setTimeout(done,60))});assert.deepEqual(errors,[])}
 const lesson=initialAdventure();lesson.phase='logic';lesson.round=0;lesson.model=0;for(const part of ROUNDS[0].parts)lesson.record.assembly[part]='FIXED'
 await mount(lesson)
 assert.ok(host.textContent.includes('배터리 사용 가능 판단'))
 assert.ok(host.querySelector('[aria-label="현재 로직 계층 경로"]').textContent.includes('BMS'))
 await click(button('EV 기술 선택 지도'))
 await click(button('기능 트리 · E/E 연결'))
 assert.ok(host.textContent.includes('내 출력:'),'the architecture map evaluates the current authored graph')
 await click(button('게임으로 돌아가기'))
 await click(button('전체 블록 라이브러리'))
 assert.ok(document.body.querySelector('.d16-library-overlay'),'library opens above the game root')
 assert.equal(document.body.querySelectorAll('.d16-block-lab-palette button').length,39)
 await click(document.body.querySelector('[aria-label="블록 라이브러리 닫기"]'))
 assert.equal(document.body.querySelector('.d16-library-overlay'),null)
 assert.deepEqual([...host.querySelectorAll('.d16-palette button')].slice(0,5).map(element=>element.querySelector('b').textContent),['5','>','60','<','AND'])
 await click(button('이 기능 시범 모델 적용'))
 assert.ok(verifyModel('bms',saved().designs.bms).every(item=>item.pass))
 await click(host.querySelector('.d16-action>button'))
 assert.ok(host.textContent.includes('PackSafe'))
 await click(host.querySelector('.d16-action>button'))
 assert.ok(saved().completed.includes('bms'))
 assert.equal(ROUNDS[0].models[saved().model],'start')
 assert.ok(host.textContent.includes('START 요청 허용'))
 assert.deepEqual([...host.querySelectorAll('.d16-palette button')].slice(0,5).map(element=>element.querySelector('b').textContent),['P','==','5','>=','NOT'])
 await click(button('이 기능 시범 모델 적용'))
 assert.ok(verifyModel('start',saved().designs.start).every(item=>item.pass))
 await click(host.querySelector('.d16-action>button'))
 await click(host.querySelector('.d16-action>button'))
 assert.ok(saved().completed.includes('start'))
 assert.equal(ROUNDS[0].models[saved().model],'power')
 const trial=initialAdventure();trial.phase='trial';trial.round=3;trial.designs=providedDesigns();trial.completed=Object.keys(MODEL_SPECS);trial.bodyClosed=true;trial.record.cables=BUILD_LINKS.map(link=>link.id);for(const part of allAssemblyParts)trial.record.assembly[part.id]='FIXED'
 await mount(trial)
 await click(button('SOC 5% 경계'))
 assert.equal(host.querySelector('[aria-label="배터리 상태별 차량 시험"] [aria-pressed="true"]').textContent,'SOC 5% 경계')
 assert.ok(host.textContent.includes('잔량 경계에서 BMS가 사용을 막고 구동력이 0인지 확인해요.'))
 await click(button('정상 팩'))
 assert.ok(host.textContent.includes('BMS PackSafe → VCU 허용'))
 console.log('PASS: BMS and START mission paths, visible block symbols, run verification, next VCU model, and trial condition controls. GPU is stubbed; physical response is covered by npm test.')
}finally{if(root)await act(()=>root.unmount());await server.close();dom.window.close();delete globalThis.__domainWasm}
