import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync, writeFileSync, mkdirSync } from 'node:fs'
import { createHash } from 'node:crypto'
import { WasmVehicleSw } from '../src/runtime/c/WasmVehicleSw.ts'
import { LegacyVehicleSw } from '../src/runtime/c/LegacyVehicleSw.ts'
import { TRACKBACK_SIMULATION_CALIBRATION_V0_1 as cal } from '../src/data/calibration/TrackbackSimulationCalibration.ts'

const bytes=readFileSync(new URL('../src/runtime/c/generated/vehicle-sw.wasm',import.meta.url))
const module=await WebAssembly.compile(bytes)
const build=JSON.parse(readFileSync(new URL('../src/runtime/c/generated/build.json',import.meta.url),'utf8'))
const base={acceleratorPedalPosition:.5,acceleratorPedalValidity:'VALID',gearRequest:'D',gearRequestValidity:'VALID',vehicleReady:true,propulsionEnable:true,longitudinalVelocity:0,vehicleSpeed:0}
const valid=(magnitude,direction='NONE')=>({magnitude,direction,validity:'VALID'})
const evidence=[]
const outDir=new URL('../docs/evidence/',import.meta.url)
mkdirSync(outDir,{recursive:true})
function record(tc,requirementIds,input,expected,actual,object='C normal flow') {
  let verdict='PASS'
  try { assert.deepEqual(actual,expected) } catch(error) { verdict='FAIL'; throw error }
  finally {
    evidence.push({testCaseId:`TC-PROP-NORMAL-${tc}`,requirementIds,testObject:object,input,expected,actual,verdict})
    writeFileSync(new URL('c-normal-evidence.json',outDir),JSON.stringify({kind:'REFERENCE_SW_VERIFICATION',binaryHash:build.binaryHash,evidence},null,2)+'\n')
  }
}
test('C binary provenance matches sources and has no host imports',()=>{
  const files=['gear.c','propulsion.c','vmc.c','edrive.c','core.c','wasm_bridge.c','trackback.h']
  const hash=data=>createHash('sha256').update(data).digest('hex')
  assert.equal(hash(bytes),build.binaryHash)
  assert.equal(hash(files.map(f=>readFileSync(new URL(`../c/vehicle_sw/${f}`,import.meta.url),'utf8').replaceAll('\r\n','\n')).join('')),build.sourceHash)
  assert.deepEqual(WebAssembly.Module.imports(module),[])
})
test('C requirements: gating, invalid handling, pedal mapping and direction',()=>{
  const cases=[
    ['001',['SYSR-PROP-001','SWR-PROP-001'],{vehicleReady:false},{state:'PROP_DISABLED',request:valid(0)}],
    ['001',['SYSR-PROP-001','SWR-PROP-001'],{propulsionEnable:false},{state:'PROP_DISABLED',request:valid(0)}],
    ['002',['SYSR-PROP-001','SWR-PROP-001'],{},{state:'PROP_ENABLED',request:valid(.5,'FORWARD')}],
    ['003',['SYSR-PROP-002','SWR-PROP-002'],{acceleratorPedalValidity:'INVALID'},{state:'PROP_ENABLED',request:{magnitude:0,direction:'NONE',validity:'INVALID'}}],
    ['003',['SYSR-PROP-002','SWR-PROP-002'],{gearRequestValidity:'INVALID'},{state:'PROP_ENABLED',request:{magnitude:0,direction:'NONE',validity:'INVALID'}}],
    ['004',['SYSR-PROP-004','SWR-PROP-003','SWR-PROP-004'],{acceleratorPedalPosition:0},{state:'PROP_ENABLED',request:valid(0)}],
    ['005',['SYSR-PROP-003','SWR-PROP-003'],{acceleratorPedalPosition:.37},{state:'PROP_ENABLED',request:valid(.37,'FORWARD')}],
    ['006A',['SYSR-PROP-005','SWR-PROP-004'],{gearRequest:'P'},{state:'PROP_ENABLED',request:valid(0)}],
    ['006B',['SYSR-PROP-006','SWR-PROP-004'],{gearRequest:'N'},{state:'PROP_ENABLED',request:valid(0)}],
    ['007',['SYSR-PROP-007','SWR-PROP-004'],{},{state:'PROP_ENABLED',request:valid(.5,'FORWARD')}],
    ['008',['SYSR-PROP-008','SWR-PROP-004'],{gearRequest:'R'},{state:'PROP_ENABLED',request:valid(.5,'REVERSE')}],
  ]
  for(const [tc,req,change,expected] of cases){
    const input={...base,...change};const output=new WasmVehicleSw(module,cal).step(input)
    record(tc,req,input,expected,{state:output.propulsionState,request:output.propulsionRequest})
  }
})
test('C component seams: VMC mapping and directional eDrive saturation',()=>{
  const core=new WasmVehicleSw(module,cal)
  record('009',['SYSR-PROP-009','SWR-VMC-001'],base,{magnitudeNm:90,direction:'FORWARD',validity:'VALID'},core.step(base).driveTorqueRequest,'C Propulsion Function → VMC integration')
  for(const [direction,speed,expected] of [['FORWARD',0,90],['FORWARD',12,45],['REVERSE',0,65],['REVERSE',6,32.5]])
    record('009',['SYSR-PROP-009','SWR-VMC-001'],{magnitude:.5,direction,speed},{magnitudeNm:expected,direction,validity:'VALID'},core.verifyVmc(.5,direction,'VALID',speed),'C VMC')
  for(const [tc,direction,expected] of [['010A','FORWARD',180],['010B','REVERSE',130]])
    record(tc,['SYSR-PROP-009','SWR-EDR-001'],{magnitudeNm:999,direction},{magnitudeNm:expected,direction,validity:'VALID'},core.verifyEDrive(999,direction,'VALID'),'C eDrive')
  for(const direction of ['NONE','FORWARD','REVERSE']) {
    assert.deepEqual(core.verifyVmc(999,direction,'INVALID',0),{magnitudeNm:0,direction:'NONE',validity:'INVALID'})
    assert.deepEqual(core.verifyEDrive(999,direction,'INVALID'),{magnitudeNm:0,direction:'NONE',validity:'INVALID'})
  }
})
test('C Gear previous-cycle state, invalid request and reset isolation',()=>{
  const core=new WasmVehicleSw(module,cal)
  for(const sign of [-1,1]) {
    core.reset()
    for(const [tc,speed,expected] of [['014',.51,{gearState:'D',transitionAccepted:false}],['013',.5,{gearState:'R',transitionAccepted:true}]]) {
      const input={...base,gearRequest:'R',longitudinalVelocity:speed*sign,vehicleSpeed:speed}
      const result=core.step(input)
      record(tc,['SYSR-GEAR-001','SWR-GEAR-001'],input,expected,{gearState:result.gearState,transitionAccepted:result.transitionAccepted},'C Gear Logic')
    }
    assert.equal(core.step({...base,gearRequestValidity:'INVALID'}).gearState,'R')
    assert.equal(new WasmVehicleSw(module,cal).step(base).gearState,'D')
    core.reset();assert.equal(core.step({...base,gearRequest:'R',longitudinalVelocity:1}).gearState,'D')
  }
})
function close(actual,expected,path='') {
  if(typeof actual==='number'){assert.ok(Math.abs(actual-expected)<=1e-10,`${path}: ${actual} != ${expected}`);return}
  if(actual&&typeof actual==='object'){for(const key of Object.keys(expected))close(actual[key],expected[key],`${path}.${key}`);return}
  assert.equal(actual,expected,path)
}
test('TS/C migration equivalence across stateful boundary sequences; not model/code B2B',()=>{
  let count=0
  for(const calibration of [cal,{...cal,maxForwardTorqueNm:{value:70},maxReverseTorqueNm:{value:30}}]) {
    const c=new WasmVehicleSw(module,calibration),ts=new LegacyVehicleSw(calibration)
    for(const gear of ['D','R','N','P','R','D'])for(const pedal of [NaN,Infinity,-Infinity,-1,0,.01,.37,1,2])
      for(const speed of [0,.5,.50001,12,24,40])for(const ready of [false,true])for(const invalid of [false,true]) {
        const input={...base,gearRequest:gear,acceleratorPedalPosition:pedal,vehicleSpeed:speed,longitudinalVelocity:count%2?-speed:speed,vehicleReady:ready,acceleratorPedalValidity:invalid?'INVALID':'VALID',gearRequestValidity:count%7===0?'INVALID':'VALID',propulsionEnable:count%3!==0}
        close(c.step(input),ts.step(input));count++
      }
  }
  writeFileSync(new URL('c-equivalence-evidence.json',outDir),JSON.stringify({kind:'MIGRATION_REGRESSION_EQUIVALENCE',binaryHash:build.binaryHash,comparisons:count,tolerance:1e-10,verdict:'PASS',notModelCodeB2B:true},null,2)+'\n')
})
test('C boundary rejects malformed physical signals and calibration',()=>{
  const core=new WasmVehicleSw(module,cal)
  for(const change of [{vehicleSpeed:-1},{vehicleSpeed:Infinity},{longitudinalVelocity:NaN},{gearRequest:'X'}])assert.throws(()=>core.step({...base,...change}))
  assert.throws(()=>new WasmVehicleSw(module,{...cal,vmcForwardTorqueMap:{maximumTorqueNm:180,zeroTorqueSpeedMps:0}}))
})
