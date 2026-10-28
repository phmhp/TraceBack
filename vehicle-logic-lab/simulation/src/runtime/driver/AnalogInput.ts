import type {DriverInputWriter} from '../../domain/driver/DriverInputTypes.ts'
export function pedalPressure(clientY:number,top:number,height:number){
  if(![clientY,top,height].every(Number.isFinite)||height<=0)return 0
  return Math.max(0,Math.min(1,(top+height-clientY)/height))
}
const clamp=(value:number,min:number,max:number)=>Number.isFinite(value)?Math.max(min,Math.min(max,value)):0
export function gamepadTargets(pad:{axes:readonly number[];buttons:readonly {value:number}[]}){
  const steering=clamp(pad.axes[0]??0,-1,1)
  return {accelerator:clamp(pad.buttons[7]?.value??0,0,1),brake:clamp(pad.buttons[6]?.value??0,0,1),steering:Math.abs(steering)>.12?steering:0}
}
export class AnalogGamepadDriver {
  private owned=false
  private readonly input:Pick<DriverInputWriter,'setAccelerator'|'setBrake'|'setSteering'>
  constructor(input:Pick<DriverInputWriter,'setAccelerator'|'setBrake'|'setSteering'>){this.input=input}
  update(pad:{axes:readonly number[];buttons:readonly {value:number}[]}|null){
    if(!pad){this.reset();return}
    const values=gamepadTargets(pad),active=!!(values.accelerator||values.brake||values.steering)
    if(active||this.owned){this.input.setAccelerator(values.accelerator);this.input.setBrake(values.brake);this.input.setSteering(values.steering)}
    this.owned=active
  }
  reset(){if(this.owned){this.input.setAccelerator(0);this.input.setBrake(0);this.input.setSteering(0)}this.owned=false}
}
