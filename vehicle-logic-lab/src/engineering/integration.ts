import {LogicSimulation} from '../engine/simulation.ts'
import {DEFAULT_INPUTS} from '../content/ready.ts'
import type {Graph} from '../engine/types.ts'
import {TorqueModel,NORMAL_TORQUE_INPUT} from './torqueModel.ts'
import type {EGraph} from './torqueModel.ts'
import {expectedTorque} from './torqueSpec.ts'
/** Function-boundary contract, not a multi-rate ECU or full-vehicle timing proof. */
export function readyTorqueContract(ready:Graph,torque:EGraph){return[{name:'정상 시동 → 구동',brake:true,system:true,expectedReady:true},{name:'브레이크 없는 시동 → 차단',brake:false,system:true,expectedReady:false},{name:'시스템 미준비 → 차단',brake:true,system:false,expectedReady:false}].map(c=>{const sim=new LogicSimulation('OFF','machine');let snapshot=sim.step(ready,{...DEFAULT_INPUTS,brake:c.brake,system:c.system,power:true});sim.step(ready,{...DEFAULT_INPUTS,brake:c.brake,system:c.system,power:false});snapshot=sim.step(ready,{...DEFAULT_INPUTS,brake:c.brake,system:c.system,power:true});const gate=snapshot.state==='READY'&&snapshot.outputs.drive===true&&!snapshot.issues.length,model=new TorqueModel();let expected=0,pass=gate===c.expectedReady,actual=0;for(let k=0;k<100;k++){expected=expectedTorque({...NORMAL_TORQUE_INPUT,ready:c.expectedReady},expected);const frame=model.step(torque,{...NORMAL_TORQUE_INPUT,ready:gate});actual=frame.torqueNm;if(frame.issues.length||Math.abs(actual-expected)>1e-6)pass=false}return{name:c.name,pass,actualReady:gate,expectedReady:c.expectedReady,expectedTorque:expected,actualTorque:actual}})}
