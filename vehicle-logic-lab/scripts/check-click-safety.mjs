// DOM interaction regression, not a real browser/GPU playthrough.
import assert from 'node:assert/strict'
import {mkdtempSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {dirname,join,resolve} from 'node:path'
import {fileURLToPath} from 'node:url'
import {JSDOM} from 'jsdom'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
import React,{act} from 'react'

const dom=new JSDOM('<!doctype html><html><body><div id="root"></div></body></html>',{url:'http://unit.test/'})
for(const key of ['window','document','localStorage','Element','HTMLElement','HTMLCanvasElement','Node','Event','MouseEvent'])globalThis[key]=dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT=true
globalThis.self=dom.window
globalThis.requestAnimationFrame=callback=>{callback(0);return 1}
globalThis.cancelAnimationFrame=()=>{}
globalThis.ResizeObserver=class{observe(){}disconnect(){}}
dom.window.HTMLElement.prototype.scrollTo=function(x,y){this.scrollLeft=x;this.scrollTop=y}
dom.window.HTMLElement.prototype.scrollIntoView=function(){}
dom.window.HTMLElement.prototype.setPointerCapture=function(){}
dom.window.HTMLElement.prototype.releasePointerCapture=function(){}
dom.window.HTMLElement.prototype.getBoundingClientRect=function(){const width=parseFloat(this.style.width)||1024,height=parseFloat(this.style.height)||600;return{x:0,y:0,left:0,top:0,right:width,bottom:height,width,height}}
const {createRoot}=await import('react-dom/client')
const rootPath=resolve(dirname(fileURLToPath(import.meta.url)),'..')
const server=await createServer({root:rootPath,configFile:false,cacheDir:mkdtempSync(join(tmpdir(),'momo-click-test-')),plugins:[{
 name:'dom-test-only-canvas-stub',enforce:'pre',
 resolveId(id){if(id==='/@unit/fiber')return '\0unit-fiber'},
 load(id){if(id==='\0unit-fiber')return "import React from 'react'; export {useFrame} from '@react-three/fiber'; export function Canvas(){return React.createElement('canvas',{'data-unit-canvas':true})}"},
 transform(code,id){if(/\/src\/(game\/(DriveExperience|SignalBench|TorqueAssembly|LearningVehicle)|workshop\/WorkshopScene)\.tsx$/.test(id.replaceAll('\\','/')))return code.replaceAll("from '@react-three/fiber'","from '/@unit/fiber'")},
},react()],optimizeDeps:{noDiscovery:true,include:[],entries:[]},server:{middlewareMode:true},appType:'custom'})
let root,errors=[]
const host=document.getElementById('root')
dom.window.addEventListener('error',event=>errors.push(event.error??new Error(event.message)))
const mount=async(Component,props={})=>{if(root)await act(()=>root.unmount());host.replaceChildren();errors=[];root=createRoot(host,{onUncaughtError:error=>errors.push(error),onCaughtError(){}});await act(async()=>{root.render(React.createElement(React.StrictMode,null,React.createElement(Component,props)));await new Promise(r=>setTimeout(r,25))})}
const click=async element=>{assert.ok(element,'missing click target');await act(()=>element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true,detail:1,clientX:100,clientY:120})));assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'));assert.ok(host.textContent.trim()||host.querySelector('canvas'),'blank root')}
const button=text=>[...host.querySelectorAll('button')].find(b=>b.textContent.includes(text))
const waitFor=async selector=>{for(let i=0;i<120;i++){if(host.querySelector(selector))return;await act(()=>new Promise(r=>setTimeout(r,25)))}assert.fail(`UI did not load: ${selector}`)}
const pointer=(element,type,x,y,button=0)=>{const event=new dom.window.MouseEvent(type,{bubbles:true,clientX:x,clientY:y,button});Object.defineProperty(event,'pointerId',{value:1});element.dispatchEvent(event)}
try{
 const {DriveExperience}=await server.ssrLoadModule('/src/game/DriveExperience.tsx')
 await mount(DriveExperience,{enabled:false,volume:0})
 await act(()=>new Promise(r=>setTimeout(r,50)))
 await click(button('정면'))
 const canvas=host.querySelector('canvas')
 assert.ok(canvas,'drive canvas stub')
 for(let i=0;i<12;i++)await act(()=>{
  pointer(canvas,'pointerdown',100,100)
  pointer(canvas,'pointermove',120+i,115)
  pointer(canvas,'pointermove',135+i,122)
  pointer(canvas,'pointerup',135+i,122)
  pointer(canvas,'pointermove',200,200)
 })
 assert.equal(errors.length,0,errors.map(e=>e.stack).join('\n'))
 assert.ok(host.querySelector('.drive-experience'),'rapid drag/release unmounted the screen')
 console.log('PASS: real DriveExperience DOM handlers, rapid move/release under StrictMode (GPU mocked).')
 const {default:Game}=await server.ssrLoadModule('/src/game/Game.tsx')
 await mount(Game)
 await click(host.querySelector('.title-vignette'))
 await click(host.querySelector('.game-wordmark h1'))
 await click(button('자유 제작실 열기'))
 await waitFor('.iw-mode-assembly')
 assert.ok(host.querySelector('.iw-mode-assembly'))
 const originalRaf=globalThis.requestAnimationFrame,originalCancel=globalThis.cancelAnimationFrame,callbacks=new Map();let rafId=0
 globalThis.requestAnimationFrame=cb=>{callbacks.set(++rafId,cb);return rafId};globalThis.cancelAnimationFrame=id=>callbacks.delete(id)
 for(let i=0;i<10;i++){
  await click(button('위치 맞춤 도움'))
  await act(()=>pointer(button('꾹 눌러'),'pointerdown',100,100))
  assert.ok(host.querySelector('.iw-fasten'))
  await act(()=>{const pending=[...callbacks.values()];callbacks.clear();pending.forEach(cb=>cb(performance.now()+1200))})
  await act(()=>pointer(host,'pointerup',100,100))
 }
 globalThis.requestAnimationFrame=originalRaf;globalThis.cancelAnimationFrame=originalCancel
 for(const labels of [['배터리 · 전원','인버터 · 전원 입력'],['인버터 · 모터 출력','모터 · 전력 입력'],['제어기 · 구동 요청','인버터 · 요청 입력']])for(const label of labels)await click([...host.querySelectorAll('button')].find(b=>b.textContent===label))
 await click(button('같은 차의 제어기'))
 assert.ok(host.querySelector('.iw-control-desk'))
 const port=label=>[...host.querySelectorAll('button')].find(b=>b.getAttribute('aria-label')===label)
 await click(port('조건과 제동 우선 출력 구동 허용'));await click(port('변화율·즉시 차단 입력 구동 허용'))
 await click(port('변화율·즉시 차단 출력 최종 명령'));await click(port('명령 토크 입력 토크 명령'))
 await click(button('내 설계 19개'))
 assert.ok(host.querySelector('.iw-result.fail'),'wrong gain/rise should really fail')
 await click(button('해당 설계'))
 await click(button('정상 예제 적용'));await click(button('내 설계 19개'))
 assert.ok(host.querySelector('.iw-result.pass'))
 assert.ok(JSON.parse(localStorage.getItem('vehicle-logic-lab.workshop.v1')).certificate)
 const certifiedCar=localStorage.getItem('vehicle-logic-lab.workshop.v1')
 dom.window.confirm=()=>false;await click([...host.querySelectorAll('button')].find(b=>b.textContent==='새 차'))
 assert.equal(localStorage.getItem('vehicle-logic-lab.workshop.v1'),certifiedCar)
 dom.window.confirm=()=>true;await click([...host.querySelectorAll('button')].find(b=>b.textContent==='새 차'))
 assert.equal(JSON.parse(localStorage.getItem('vehicle-logic-lab.workshop.v1')).assembly.motor,'TRAY')
 assert.ok(Object.keys(localStorage).some(key=>key.startsWith('vehicle-logic-lab.workshop.v1.backup.')&&localStorage.getItem(key)===certifiedCar))
 console.log('PASS: integrated hardware seating/fastening, cable endpoints, typed puzzle wiring, real failure then passing numeric regression, saved certificate.')
 await click(button('READY 수첩'))
 await waitFor('.vehicle-islands')
 for(const island of [...host.querySelectorAll('.map-island')]){await click(island);await act(()=>new Promise(r=>setTimeout(r,60)))}
 await click(host.querySelector('[aria-label="구동 동작 보기"]'))
 await click(button('같은 차량의 구동 로직'))
 await waitFor('.embedded-studio .torque-board')
 assert.equal(host.querySelector('.systems-atlas'),null)
 for(const value of ['request','control','all','quality']){const select=host.querySelector('[aria-label="심화 기능 묶음"]');await act(()=>{select.value=value;select.dispatchEvent(new dom.window.Event('change',{bubbles:true}))});await click(host.querySelector('.workspace-world svg'))}
 await click(button('학습용 정상 설계'))
 await click(button('19개 정상'))
 for(const b of [...host.querySelectorAll('.engineering-test-list button')])await click(b)
 await click(button('이득 결함'))
 await click(button('19개 정상'))
 await click(button('차량 동작 지도'))
 await click(button('READY 의뢰'))
 await click(button('운전석에 앉아'))
 await click(button('브레이크 입력'))
 await click(button('START'))
 await click(button('차 안으로'))
 for(const b of [...host.querySelectorAll('.inspection-checkpoints button')])await click(b)
 await click(button('로직 작업대로'))
 await waitFor('.board-v7')
 assert.ok(host.querySelector('.journey-context'))
 const header=host.querySelector('[data-move-block]'),block=header.closest('.cable-block'),before=block.style.left
 await act(()=>{pointer(header,'pointerdown',200,200,2);pointer(header,'pointermove',255,240,2);pointer(header,'pointerup',255,240,2)})
 assert.notEqual(block.style.left,before,'right drag should move the block')
 const viewport=host.querySelector('.workspace-scroll')
 viewport.scrollLeft=400;viewport.scrollTop=200
 await act(()=>{pointer(viewport,'pointerdown',200,200,2);pointer(viewport,'pointermove',170,175,2);pointer(viewport,'pointerup',170,175,2)})
 assert.equal(viewport.scrollLeft,430);assert.equal(viewport.scrollTop,225)
 await click(button('작업대 크게'))
 assert.ok(host.querySelector('.workbench-expanded'))
 await click(button('차량과 함께'))
 console.log('PASS: integrated map/workshop, live exploration, region context, right-drag block movement and viewport pan.')
 const {KnowledgeAtlas}=await server.ssrLoadModule('/simulation/src/ui/components/KnowledgeAtlas.tsx')
 await mount(KnowledgeAtlas,{wholeVehicle:true,onClose(){}})
 let referenceSelections=0
 for(const tab of [...host.querySelectorAll('.knowledge-atlas>nav button')]){
  await click(tab)
  for(const item of [...host.querySelectorAll('.atlas-body>aside>button')]){await click(item);referenceSelections++}
 }
 assert.equal(referenceSelections,539)
 console.log('PASS: all 539 archived source entries still selectable; archive is not the default learning screen.')
 const {GameRecovery,LAST_CRASH_KEY}=await server.ssrLoadModule('/src/game/GameRecovery.tsx')
 localStorage.setItem('vehicle-logic-lab.story.v3','keep-story')
 localStorage.setItem('vehicle-logic-lab.engineering.v1','keep-design')
 let shouldThrow=true
 const Faulty=()=>{if(shouldThrow)throw new Error('intentional recovery regression');return React.createElement('h1',null,'메인 복구 완료')}
 const Recoverable=()=>React.createElement(GameRecovery,null,React.createElement(Faulty))
 await mount(Recoverable)
 assert.ok(host.querySelector('[role="alert"]'))
 assert.equal(JSON.parse(localStorage.getItem(LAST_CRASH_KEY)).message,'intentional recovery regression')
 assert.equal(localStorage.getItem('vehicle-logic-lab.story.v3'),'keep-story')
 assert.equal(localStorage.getItem('vehicle-logic-lab.engineering.v1'),'keep-design')
 shouldThrow=false;await click(button('하던 게임 다시 열기'))
 assert.ok(host.textContent.includes('메인 복구 완료'))
 console.log('PASS: render failure shows a recoverable screen, logs locally, retries without deleting story or engineering saves.')
}finally{if(root)await act(()=>root.unmount());await server.close();dom.window.close()}
