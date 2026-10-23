export interface PlatformExecutionOutput {
  taskId:'TRACKBACK_FIXED_VEHICLE_STEP'
  releaseIndex:number
  scheduledTimeSeconds:number
  actualTimeSeconds:number
  periodSeconds:number
  completed:boolean
  supervision:'ON_TIME'|'LATE'|'INCOMPLETE'
  timingErrorSeconds:number
}

/** TRACKBACK host simulation scheduler, not an ECU RTOS/AUTOSAR task model. */
export class PlatformExecutionModel {
  readonly authority='TRACKBACK_HOST_RUNTIME' as const
  readonly provenance='IMPLEMENTED_RUNTIME' as const
  reset(){}
  step(input:{releaseIndex:number;scheduledTimeSeconds:number;actualTimeSeconds:number;periodSeconds:number;completed:boolean}):PlatformExecutionOutput {
    const timingErrorSeconds=input.actualTimeSeconds-input.scheduledTimeSeconds
    const supervision:PlatformExecutionOutput['supervision']=!input.completed?'INCOMPLETE':Math.abs(timingErrorSeconds)<=input.periodSeconds*1e-6?'ON_TIME':'LATE'
    return {taskId:'TRACKBACK_FIXED_VEHICLE_STEP',...input,supervision,timingErrorSeconds}
  }
}
