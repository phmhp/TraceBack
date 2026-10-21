// Real React event/save/progression regression. GPU is mocked; physical course has separate tests.
import assert from 'node:assert/strict'
import {mkdtempSync,readFileSync} from 'node:fs'
import {tmpdir} from 'node:os'
import {join,resolve,dirname} from 'node:path'
import {fileURLToPath} from 'node:url'
import {JSDOM} from 'jsdom'
import React,{act} from 'react'
import {createServer} from 'vite'
import react from '@vitejs/plugin-react'
const rootPath=resolve(dirname(fileURLToPath(import.meta.url)),'..'),dom=new JSDOM('<div id="root"></div>',{url:'http://campaign.test/'})
for(const key of ['window','document','localStorage','Element','HTMLElement','HTMLCanvasElement','Node','Event','MouseEvent'])globalThis[key]=dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.self=dom.window
globalThis.__campaignWasm=await WebAssembly.compile(readFileSync(join(rootPath,'simulation/src/runtime/c/generated/vehicle-sw.wasm')))
const rafs=new Map();let nextRaf=0,now=performance.now()
globalThis.requestAnimationFrame=callback=>{rafs.set(++nextRaf,callback);return nextRaf};globalThis.cancelAnimationFrame=id=>rafs.delete(id)
globalThis.ResizeObserver=class{observe(){}disconnect(){}}
dom.window.HTMLElement.prototype.setPointerCapture=function(){};dom.window.HTMLElement.prototype.scrollTo=function(x,y){this.scrollLeft=x;this.scrollTop=y}
dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return{x:0,y:0,left:0,top:0,right:810,bottom:500,width:810,height:500}}
const server=await createServer({root:rootPath,configFile:false,cacheDir:mkdtempSync(join(tmpdir(),'momo-campaign-ui-')),plugins:[{name:'campaign-test-only-renderer',enforce:'pre',transform(code,id){const path=id.replaceAll('\\','/');if(path.endsWith('/game/driving/DrivingAssets.ts'))return 'export const compileDrivingSw=()=>Promise.resolve(globalThis.__campaignWasm)';if(path.endsWith('/campaign/CinemaIntro.tsx'))return "import React from 'react';export function CinemaIntro(){return React.createElement('div',null,'cinema GPU mocked')}";if(path.endsWith('/workshop/WorkshopScene.tsx'))return "import React from 'react';export function WorkshopScene(p){p.onMechanicReady?.();return React.createElement('canvas',{'data-campaign-test-canvas':true,'data-ready':p.controls.ready,'data-brake':p.controls.brake,'data-gear':p.controls.gear,'data-accelerator':p.controls.accelerator,'data-suspended':p.suspended})}"}},react()],server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[],entries:[]},appType:'custom'})
const {createRoot}=await import('react-dom/client'),host=document.getElementById('root');let root,errors=[]
const advance=ms=>{now=Math.max(now,performance.now());const end=now+ms;while(now<end){now+=20;const callbacks=[...rafs.values()];rafs.clear();for(const callback of callbacks)callback(now)}}
const button=text=>[...host.querySelectorAll('button')].find(b=>b.textContent.includes(text))
const click=async element=>{assert.ok(element,'missing button');assert.equal(element.disabled,false,element.textContent);await act(()=>element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));assert.equal(errors.length,0,errors.join('\n'))}
const pointer=(element,type,options={})=>{const e=new dom.window.MouseEvent(type,{bubbles:true,...options});Object.defineProperty(e,'pointerId',{value:1});element.dispatchEvent(e)}
const port=label=>host.querySelector(`[aria-label="${label}"]`)
const mount=async Component=>{if(root)await act(()=>root.unmount());host.replaceChildren();root=createRoot(host,{onUncaughtError:e=>errors.push(String(e)),onCaughtError:e=>errors.push(String(e))});await act(async()=>{root.render(React.createElement(React.StrictMode,null,React.createElement(Component,{paused:false,reduced:false,volume:0,onMenu(){},onResume(){},onExit(){},onVolume(){},onReduced(){}})));await new Promise(r=>setTimeout(r,40))})}
try{
 const {default:Campaign}=await server.ssrLoadModule('/src/campaign/MomoCampaign.tsx')
 localStorage.setItem('vehicle-logic-lab.story.v3','preserve-ready');localStorage.setItem('vehicle-logic-lab.workshop.v1','preserve-old-car')
 await mount(Campaign);assert.ok(host.textContent.includes('포드 v 페라리'))
 await click(button('중고차 시장'));await click(button('내 첫 차 계약'));assert.ok(host.textContent.includes('10냥'))
 await click(button('브레이크 유지'));assert.equal(host.querySelector('canvas').dataset.brake,'1')
 await click(button('START'));assert.equal(host.querySelector('canvas').dataset.ready,'true','one mouse can release brake click and then click START')
 await click(button('③ D'));await click(button('브레이크 해제'));assert.equal(host.querySelector('canvas').dataset.brake,'0');assert.equal(host.querySelector('canvas').dataset.gear,'D')
 await click(button('시운전 연출 건너뛰기'));await act(()=>advance(1500));await click(button('차 안을 열어'))
 await click(button('배터리 팩'));await click(button('가속페달 센서'));await click(button('VCU · 차량 제어 ECU'));await click(button('부품부터 복구'))
 for(let i=0;i<3;i++){await click(button('모모와 위치 맞춤'));await act(()=>advance(3300));await act(()=>pointer(button('꾹 눌러'),'pointerdown'));await act(()=>advance(1600));assert.ok(host.textContent.includes('고정 완료'))}
 for(const pair of [['배터리 전원','인버터 전원'],['페달 센서','VCU 센서 입력'],['VCU 명령','인버터 요청']]){for(const text of pair)await click([...host.querySelectorAll('.mc-cables button')].find(b=>b.textContent.includes(text)));await act(()=>advance(3300))}
 const repaired=JSON.parse(localStorage.getItem('vehicle-logic-lab.momo-cup.v1')).record
 assert.equal(repaired.assembly.vcu,'FIXED');assert.ok(repaired.cables.includes('sensorLink'),JSON.stringify(repaired.cables));assert.ok(repaired.cables.includes('control'),JSON.stringify(repaired.cables));assert.ok(repaired.cables.includes('power'),JSON.stringify(repaired.cables))
 await click(button('하드웨어 복구 완료'))
 assert.ok(host.querySelector('.mc-stage-principle'));assert.equal(host.querySelector('canvas').dataset.suspended,'false','principle view runs the same real plant, not a frozen hose animation')
 await click(button('다음 원리 관찰'));await click(button('다음 원리 관찰'));await click(button('내 VCU 퍼즐'))
 assert.ok(host.querySelector('.mc-lab'));assert.ok(host.querySelector('.mc-puzzle'))
 const puzzleViewport=host.querySelector('.mc-puzzle-viewport'),firstBlock=host.querySelector('.mc-block')
 await act(()=>pointer(firstBlock.querySelector('header'),'pointerdown',{button:2,clientX:10,clientY:10}))
 await act(()=>pointer(puzzleViewport,'pointermove',{clientX:2000,clientY:2000}));await act(()=>pointer(puzzleViewport,'pointerup'))
 assert.equal(firstBlock.style.left,'570px');assert.equal(firstBlock.style.top,'130px','dragged blocks stay inside the zoomable world')
 await click(button('전체 맞춤'));assert.equal(firstBlock.style.left,'30px')
 for(const [from,to] of [['페달 센서 출력 유효 페달','요청량 만들기 입력 페달'],['요청량 만들기 출력 요청 토크','가용량 안에서 입력 요청']]){await click(port(from));await click(port(to))}
 await click(button('이 연결 확인'));assert.equal(JSON.parse(localStorage.getItem('vehicle-logic-lab.momo-cup.v1')).lessons.length,0)
 await click([...host.querySelectorAll('.mc-tuning button')].find(b=>b.textContent.startsWith('1.8')));await click(button('이 연결 확인'))
 assert.equal(JSON.parse(localStorage.getItem('vehicle-logic-lab.momo-cup.v1')).lessons.length,1)
 await mount(Campaign);assert.ok(host.textContent.includes('멈추고 싶을 땐'))
 for(const [from,to] of [['운전 상태 출력 READY','출발 허용 AND 입력 READY'],['운전 상태 출력 D 기어','출발 허용 AND 입력 D 기어'],['운전 상태 출력 브레이크','출발 허용 AND 입력 브레이크'],['출발 허용 AND 출력 구동 허용','부드럽게 보내기 입력 구동 허용']]){await click(port(from));await click(port(to))}
 await click([...host.querySelectorAll('.mc-tuning button')].find(b=>b.textContent.startsWith('5 ')))
 await click(button('이 연결 확인'))
 for(const [from,to] of [['가용량 안에서 출력 제한 토크','부드럽게 보내기 입력 목표 토크'],['부드럽게 보내기 출력 최종 명령','모터 명령 입력 토크 명령']]){await click(port(from));await click(port(to))}
 await click([...host.querySelectorAll('.mc-tuning button')].find(b=>b.textContent.startsWith('60')));await click(button('내 연결로 동작 시험'))
 for(const name of ['반페달로 출발','브레이크가 먼저','늦은 신호는 멈춤']){await click([...host.querySelectorAll('.mc-trials button')].find(b=>b.textContent.includes(name)));await act(()=>advance(2500))}
 assert.equal(host.querySelectorAll('.mc-trials button.passed').length,3)
 await click(button('정상 기준 전체 대조'));assert.ok(host.querySelector('.mc-stage-grid'))
 const stored=JSON.parse(localStorage.getItem('vehicle-logic-lab.momo-cup.v1'));assert.ok(stored.bench);assert.equal(stored.lessons.length,3)
 await mount(Campaign);assert.ok(host.querySelector('.mc-stage-grid'))
 assert.equal(localStorage.getItem('vehicle-logic-lab.story.v3'),'preserve-ready');assert.equal(localStorage.getItem('vehicle-logic-lab.workshop.v1'),'preserve-old-car')
 console.log('PASS: dream → purchase → comic event → actual clues → seat/fasten/cables → progressive left puzzle; wrong gain rejected; all three bench runs; independent approval; checkpoint remount; old saves untouched. GPU mocked, not a visual or physical race verdict.')
}finally{if(root)await act(()=>root.unmount());await server.close();dom.window.close();delete globalThis.__campaignWasm}
