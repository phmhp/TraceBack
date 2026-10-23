import test from 'node:test'
import assert from 'node:assert/strict'
import {pedalPressure,gamepadTargets,AnalogGamepadDriver} from '../src/runtime/driver/AnalogInput.ts'
import {DriverInputRuntime} from '../src/runtime/driver/DriverInputRuntime.ts'
import {TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal} from '../src/data/calibration/TrackbackSimulationCalibration.ts'
import {caseKnowledgeIds,caseKnowledgeItems} from '../src/referenceVehicle/CaseKnowledge.ts'
import {getEntitiesByKind} from '../src/referenceVehicle/registry.ts'

test('continuous pedal pressure is proportional, clamped and invalid geometry fails closed',()=>{
  assert.equal(pedalPressure(125,100,100),.75)
  assert.equal(pedalPressure(150,100,100),.5)
  assert.equal(pedalPressure(200,100,100),0)
  assert.equal(pedalPressure(99,100,100),1)
  assert.equal(pedalPressure(400,100,100),0)
  assert.equal(pedalPressure(NaN,100,100),0)
  assert.equal(pedalPressure(100,100,0),0)
})
test('analog brake reaches the real DriverInputRuntime and releases progressively',()=>{
  const driver=new DriverInputRuntime()
  driver.setBrake(pedalPressure(120,100,100))
  for(let i=0;i<60;i++)driver.advance(1/60,cal.keyboardPedalResponse)
  assert.equal(driver.getState().brake,.8)
  driver.setBrake(0)
  driver.advance(1/60,cal.keyboardPedalResponse)
  assert.ok(driver.getState().brake<.8&&driver.getState().brake>0)
  driver.resetMotion();assert.equal(driver.getState().brake,0)
})
test('gamepad RT LT and steering stay analog, apply deadzone and reject nonfinite values',()=>{
  const buttons=Array.from({length:8},()=>({value:0}));buttons[7].value=.45;buttons[6].value=.7
  assert.deepEqual(gamepadTargets({axes:[-.38],buttons}),{accelerator:.45,brake:.7,steering:-.38})
  buttons[7].value=Infinity;buttons[6].value=-2
  assert.deepEqual(gamepadTargets({axes:[.1],buttons}),{accelerator:0,brake:0,steering:0})
})
test('current incident exposes architecture, signals, interfaces, requirements and tests together',()=>{
  const ids=caseKnowledgeIds('CASE-PT-001');assert.ok(ids.has('LF-PROP-EDRV'))
  for(const kind of ['LOGICAL_FUNCTION','SIGNAL','INTERFACE','REQUIREMENT','TEST_CASE'])assert.ok(caseKnowledgeItems('CASE-PT-001',kind).length>0,kind)
  assert.equal(getEntitiesByKind('REQUIREMENT').filter(e=>e.approvalStatus==='DRAFT_NOT_APPROVED').length,180)
  assert.ok(getEntitiesByKind('LOGICAL_FUNCTION').some(e=>e.implementationStatus==='DESIGN_ONLY'))
})
test('gamepad disconnect releases owned commands and an idle pad never overwrites keyboard intent',()=>{
  const writes=[]
  const adapter=new AnalogGamepadDriver({setAccelerator:v=>writes.push(['accelerator',v]),setBrake:v=>writes.push(['brake',v]),setSteering:v=>writes.push(['steering',v])})
  const buttons=Array.from({length:8},()=>({value:0}))
  adapter.update({axes:[0],buttons});assert.deepEqual(writes,[])
  buttons[7].value=.8;adapter.update({axes:[.2],buttons});assert.deepEqual(writes.slice(0,3),[['accelerator',.8],['brake',0],['steering',.2]])
  adapter.update(null);assert.deepEqual(writes.slice(-3),[['accelerator',0],['brake',0],['steering',0]])
  const length=writes.length;adapter.update(null);assert.equal(writes.length,length)
})
