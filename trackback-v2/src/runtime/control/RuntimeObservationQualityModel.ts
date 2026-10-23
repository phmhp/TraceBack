export interface RuntimeObservationQualityInput {
  physicsAttached:boolean
  values:readonly number[]
  driverInputValid:boolean
}

export interface RuntimeObservationQualityOutput {
  quality:'VALID'|'INVALID'
  finiteValueCount:number
  expectedValueCount:number
  reason:'AVAILABLE_FINITE_RUNTIME_OBSERVATION'|'PHYSICS_UNAVAILABLE'|'NON_FINITE_VALUE'|'DRIVER_INPUT_INVALID'
}

/** Quality of TRACKBACK host/runtime observations only; not a real-vehicle sensor diagnostic. */
export class RuntimeObservationQualityModel {
  readonly authority='TRACKBACK_EXECUTION_MODEL' as const
  readonly provenance='SIMULATION_ASSUMPTION' as const
  reset(){}
  step(input:Readonly<RuntimeObservationQualityInput>):RuntimeObservationQualityOutput {
    const finiteValueCount=input.values.filter(Number.isFinite).length
    const reason:RuntimeObservationQualityOutput['reason']=!input.physicsAttached?'PHYSICS_UNAVAILABLE':finiteValueCount!==input.values.length?'NON_FINITE_VALUE':!input.driverInputValid?'DRIVER_INPUT_INVALID':'AVAILABLE_FINITE_RUNTIME_OBSERVATION'
    return {quality:reason==='AVAILABLE_FINITE_RUNTIME_OBSERVATION'?'VALID':'INVALID',finiteValueCount,expectedValueCount:input.values.length,reason}
  }
}
