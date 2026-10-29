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
for(const key of ['window','document','localStorage','sessionStorage','Element','HTMLElement','HTMLCanvasElement','Node','Event','MouseEvent'])globalThis[key]=dom.window[key]
globalThis.IS_REACT_ACT_ENVIRONMENT=true;globalThis.self=dom.window
globalThis.__campaignWasm=await WebAssembly.compile(readFileSync(join(rootPath,'simulation/src/runtime/c/generated/vehicle-sw.wasm')))
const rafs=new Map();let nextRaf=0,now=performance.now()
globalThis.requestAnimationFrame=callback=>{rafs.set(++nextRaf,callback);return nextRaf};globalThis.cancelAnimationFrame=id=>rafs.delete(id)
globalThis.ResizeObserver=class{observe(){}disconnect(){}}
dom.window.HTMLElement.prototype.setPointerCapture=function(){};dom.window.HTMLElement.prototype.scrollTo=function(x,y){this.scrollLeft=x;this.scrollTop=y}
dom.window.HTMLElement.prototype.getBoundingClientRect=function(){return{x:0,y:0,left:0,top:0,right:810,bottom:500,width:810,height:500}}
const server=await createServer({root:rootPath,configFile:false,cacheDir:mkdtempSync(join(tmpdir(),'momo-campaign-ui-')),plugins:[{name:'campaign-test-only-renderer',enforce:'pre',transform(code,id){const path=id.replaceAll('\\','/');if(path.endsWith('/game/WorldBackdrop.tsx'))return 'export const WorldBackdrop=()=>null;export const ClickFeedback=()=>null';if(path.endsWith('/game/driving/DrivingAssets.ts'))return 'export const compileDrivingSw=()=>Promise.resolve(globalThis.__campaignWasm)';if(path.endsWith('/campaign/PartExhibit.tsx'))return "import React from 'react';export function PartExhibit(p){return React.createElement('div',{'data-part-viewer':p.id},'part GPU mocked')}";if(path.endsWith('/campaign/MarketIntro.tsx'))return "import React,{useEffect} from 'react';export function MarketIntro(p){useEffect(()=>{if(p.buying)p.onDone()},[p.buying]);return React.createElement('div',null,'market GPU mocked')}";if(path.endsWith('/campaign/CinemaIntro.tsx'))return "import React from 'react';export function CinemaIntro(){return React.createElement('div',null,'cinema GPU mocked')}";if(path.endsWith('/workshop/WorkshopScene.tsx'))return "import React from 'react';export function WorkshopScene(p){const step=React.useRef(0);p.onMechanicReady?.();return React.createElement('div',null,React.createElement('canvas',{'data-campaign-test-canvas':true,'data-ready':p.controls.ready,'data-brake':p.controls.brake,'data-gear':p.controls.gear,'data-accelerator':p.controls.accelerator,'data-suspended':p.suspended,'data-road':p.road}),React.createElement('button',{'data-ui-test-frame':true,onClick(){step.current++;Object.defineProperty(p.engine.runtime.clock,'currentTime',{configurable:true,get:()=>step.current/60});p.onTick?.({x:0,z:-step.current*.5,speed:30,dt:1/60})}},'test drive frame'))}"}},react()],server:{middlewareMode:true},optimizeDeps:{noDiscovery:true,include:[],entries:[]},appType:'custom'})
const {createRoot}=await import('react-dom/client'),host=document.getElementById('root');let root,errors=[]
const advance=ms=>{now=Math.max(now,performance.now());const end=now+ms;while(now<end){now+=20;const callbacks=[...rafs.values()];rafs.clear();for(const callback of callbacks)callback(now)}}
const button=text=>[...host.querySelectorAll('button')].find(b=>b.textContent.includes(text))
const waitForModern=async()=>{for(let n=0;n<40&&!host.querySelector('.d16-dream');n++)await act(async()=>{await new Promise(r=>setTimeout(r,50))})}
const click=async element=>{assert.ok(element,'missing button');assert.equal(element.disabled,false,element.textContent);await act(()=>element.dispatchEvent(new dom.window.MouseEvent('click',{bubbles:true})));assert.equal(errors.length,0,errors.join('\n'))}
const pointer=(element,type,options={})=>{const e=new dom.window.MouseEvent(type,{bubbles:true,...options});Object.defineProperty(e,'pointerId',{value:1});element.dispatchEvent(e)}
const port=label=>host.querySelector(`[aria-label="${label}"]`)
const mount=async Component=>{if(root)await act(()=>root.unmount());host.replaceChildren();root=createRoot(host,{onUncaughtError:e=>errors.push(String(e)),onCaughtError:e=>errors.push(String(e))});await act(async()=>{root.render(React.createElement(React.StrictMode,null,React.createElement(Component,{paused:false,reduced:false,volume:0,onMenu(){},onResume(){},onExit(){},onVolume(){},onReduced(){}})));await new Promise(r=>setTimeout(r,40))})}
try{
 const {default:Campaign}=await server.ssrLoadModule('/src/campaign/MomoCampaign.tsx')
 const {ASSEMBLY_KITS}=await server.ssrLoadModule('/src/campaign/domains.ts')
 const {BUILD_PARTS}=await server.ssrLoadModule('/src/campaign/build.ts')
 const key='vehicle-logic-lab.momo-cup.v1',read=()=>JSON.parse(localStorage.getItem(key))
 localStorage.setItem('vehicle-logic-lab.story.v3','preserve-ready');localStorage.setItem('vehicle-logic-lab.workshop.v1','preserve-old-car')
 await mount(Campaign);await click(button('중고차 시장'));await click(button('내 첫 차 계약'))
 assert.equal(read().wallet,10);assert.equal(host.querySelectorAll('[role=switch][aria-label="브레이크"]').length,1,'shakedown must not duplicate controls');assert.ok(host.querySelector('.v13-start-flow'))
 const brake=port('브레이크');assert.equal(brake.getAttribute('aria-checked'),'false')
 await click(brake);assert.equal(port('브레이크').getAttribute('aria-checked'),'true');assert.equal(host.querySelector('canvas').dataset.brake,'1')
 await click(port('시동 START'));assert.equal(host.querySelector('canvas').dataset.ready,'true')
 await click(port('기어 D'));await click(port('브레이크'));assert.equal(host.querySelector('canvas').dataset.brake,'0');assert.equal(host.querySelector('canvas').dataset.gear,'D')
 assert.equal(host.querySelectorAll('.v13-start-flow .done').length,4)
 await click(button('정비 이야기로 바로'));await act(()=>advance(4600))
 assert.equal(host.querySelector('canvas').dataset.road,'true','incident remains on the same road');assert.ok(!host.textContent.includes('예정된 코믹'));await click(button('차 안을 열어'))
 const dock=()=>host.querySelector('.v15-action-dock>button')
 await click(dock())
 assert.equal(BUILD_PARTS.filter(p=>read().record.assembly[p.id]==='TRAY').length,15)
 let solved=0
 for(const kit of ASSEMBLY_KITS){
  assert.equal(read().stage,'repair');assert.equal(read().kitIndex,ASSEMBLY_KITS.indexOf(kit))
  await click(dock());for(let i=0;i<kit.parts.length;i++)await act(()=>advance(3400))
  for(const id of kit.parts)assert.equal(read().record.assembly[id],'FIXED',id)
  assert.equal(read().stage,'component');assert.ok(host.querySelector('[data-part-viewer]'))
  await click(dock());await click(dock())
  if(['control','brake','steer'].includes(kit.id)){
   assert.equal(read().stage,'puzzle');assert.ok(host.textContent.includes('System 차량'));assert.ok(host.textContent.includes('설계 참고도'))
   if(solved===0){
    assert.equal(read().record.assembly.brakes,'TRAY','first logic is before later hardware, not after all assembly')
    assert.ok(port('운전 상태 출력 페달 A'),'original inports remain visible')
    const block=port('Gain 블록 설명');await act(()=>block.dispatchEvent(new dom.window.MouseEvent('dblclick',{bubbles:true})));assert.ok(host.querySelector('[aria-label="블록 역할 설명"]'));await click(button('퍼즐로 돌아가기'))
    for(let i=0;i<5;i++){if(i===0)await click(dock());await click(dock());if(i<4)assert.ok(host.querySelector('.v15-run-failure'))}
    await click(button('해당 퍼즐로 돌아가 고치기'))
    assert.ok(host.textContent.includes('이 기능은 무엇을 하나요'))
    assert.ok(!host.textContent.includes('정답 지원:'),'concept explanation must not reveal solution')
   }else {if(solved===1){for(const[from,to]of [['운전 상태 출력 GearState','기어 비교 입력 GearState'],['기어 비교 출력 전진 조건','출발 허용 AND 입력 전진 조건']]){await click(port(from));await click(port(to))}assert.ok(dock().textContent.includes('다음 조건'));await click(dock());assert.ok(port('운전 상태 출력 브레이크'),'the same dock advances the small condition, not premature execution')}await click(button('개념 도움 보기'))}
   await click(button('정답 지원 열기'))
   let guard=0;while(button('이 한 연결 시범 적용')&&guard++<10)await click(button('이 한 연결 시범 적용'))
   assert.ok(guard<10);assert.equal(read().record.assisted,true)
   host.querySelector('.mc-activity').scrollTop=250;await click(dock());assert.equal(host.querySelector('.mc-activity').scrollTop,0,'run tab must reveal the graph, not retain help-panel scroll');await click(dock());await act(()=>advance(5000));assert.ok(host.querySelector('.v15-action-dock').textContent.includes('확인 완료'))
   assert.ok(host.querySelector('.mc-sockets button small').textContent,'run mode exposes actual block values')
   await click(dock());assert.equal(read().lessons.length,++solved)
  }
  assert.equal(read().stage,'restore');assert.equal(read().kitChecks.length,ASSEMBLY_KITS.indexOf(kit)+1)
  const snapshot=read();await mount(Campaign);assert.equal(read().stage,'restore');assert.deepEqual(read().record,snapshot.record)
  await click(dock())
 }
 assert.equal(read().stage,'bench');assert.equal(read().record.cables.length,6)
 await click(dock());for(let i=0;i<4;i++)await act(()=>advance(5000))
 assert.equal(host.querySelectorAll('.mc-trials button.passed').length,3)
 await click(dock());assert.ok(host.querySelector('.mc-stage-grid'),'single dock reaches grid without optional numeric prediction')
 const gridSnapshot=read()
 await click(port('브레이크'));await click(button('START'));await click(button('③ D'));await click(port('브레이크'));await click(dock())
 for(let i=0;i<3;i++)await act(async()=>{await new Promise(r=>setTimeout(r,1050))})
 assert.ok(host.querySelector('.mc-stage-race'));await click(button('완주 도우미'))
 for(let i=0;i<325&&read().stage==='race';i++)await click(host.querySelector('[data-ui-test-frame]'))
 assert.equal(read().stage,'finish','high-frequency renders must not erase un-published clock increments')
 assert.ok(read().lastRace.seconds>5.2&&read().lastRace.seconds<5.6,read().lastRace.seconds)
 assert.equal(read().wallet,150)
 localStorage.setItem(key,JSON.stringify(gridSnapshot));await mount(Campaign)
 const stored=read();assert.equal(stored.lessons.length,3);assert.ok(stored.bench)
 await mount(Campaign);await click(port('이전 단계로'));assert.ok(host.querySelector('.mc-stage-bench'));assert.deepEqual(read().record.graph,stored.record.graph)
 await click(port('이전 단계로'));assert.ok(host.querySelector('.mc-stage-puzzle'));assert.deepEqual(read().record.graph,stored.record.graph)
 assert.equal(localStorage.getItem('vehicle-logic-lab.story.v3'),'preserve-ready');assert.equal(localStorage.getItem('vehicle-logic-lab.workshop.v1'),'preserve-old-car')
 const {default:Game}=await server.ssrLoadModule('/src/game/Game.tsx')
 await mount(Game);assert.equal(host.querySelectorAll('.title-buttons button').length,1);const before=localStorage.getItem(key)
 await click(button('시작하기'));await act(async()=>{await new Promise(r=>setTimeout(r,80))});await waitForModern();assert.ok(host.querySelector('.d16-dream'));assert.equal(read().wallet,40)
 assert.ok(Object.keys(localStorage).some(k=>k.startsWith(key+'.backup.')&&localStorage.getItem(k)===before))
 await mount(Game);await waitForModern();assert.ok(host.querySelector('.d16-dream'),'refresh restores in-progress campaign instead of forcing title');await click(port('전체 플레이 목차 열기'));assert.ok(host.textContent.includes('모험 목차'));assert.ok(!host.textContent.includes('내보내기'));await click(button('타이틀로'))
 await click(button('시작하기'));await act(async()=>{await new Promise(r=>setTimeout(r,80))});await waitForModern();assert.ok(host.querySelector('.d16-dream'));await click(port('이전 단계로'));assert.ok(host.querySelector('.scene-title'))
 console.log('PASS v15: interleaved physical / ECU loops and restoration milestones, fixed primary action, input visibility, separate concept/answer help, block double-click, run values, sequential integration; v14 regressions retained: six automatic assembly kits; one-cursor ON/OFF and live start flow; fifteen real mounts and six automatic harnesses; correct supplied constants; EARS/domain hierarchy; five-failure tutor and actual assisted wire; all three behavioral puzzles; optional prediction never blocks bench approval; back and fresh-start backups. GPU mocked, physical course tested separately.')
}finally{if(root)await act(()=>root.unmount());await server.close();dom.window.close();delete globalThis.__campaignWasm}
