import type { LeadVehicleObservation } from '../../domain/vehicle/VehiclePhysicsPort.ts'

export type DrivingEventType='STOPPED_VEHICLE_AVOIDANCE'
export type DrivingEventStatus='IDLE'|'ACTIVE'|'CLEARED'|'HIT'

export interface DrivingEventDefinition {
  id:string
  type:DrivingEventType
  title:string
  objective:string
  activation:'RECOVERY_START'
  actor:{distanceAheadM:number;lateralOffsetM:number;speedMps:number;brakeAtSeconds?:number}
  clearBehindDistanceM:number
  collisionPenaltySeconds:number
  evidenceContext:{environment:string;driverDecision:string;vehicleFunctions:readonly string[]}
}

export interface DrivingEventSnapshot {
  id:string|null
  type:DrivingEventType|null
  title:string
  objective:string
  status:DrivingEventStatus
  relativeDistanceM:number|null
  relativeLateralDistanceM:number|null
  collisionPenaltySeconds:number
  penaltyApplied:boolean
}

export const EMPTY_DRIVING_EVENT:DrivingEventSnapshot={id:null,type:null,title:'',objective:'',status:'IDLE',relativeDistanceM:null,relativeLateralDistanceM:null,collisionPenaltySeconds:0,penaltyApplied:false}

/** Reproducible gameplay event state. It consumes real physics observation and never decides engineering PASS/FAIL. */
export class DrivingEventRuntime {
  private definition:DrivingEventDefinition|null=null
  private snapshot:DrivingEventSnapshot=EMPTY_DRIVING_EVENT
  configure(definition:DrivingEventDefinition){
    if(definition.actor.distanceAheadM<6||!Number.isFinite(definition.actor.lateralOffsetM)||definition.collisionPenaltySeconds<0)throw new Error('Driving event contract violated')
    this.definition=structuredClone(definition);this.reset()
  }
  reset(){this.snapshot=this.definition?{id:this.definition.id,type:this.definition.type,title:this.definition.title,objective:this.definition.objective,status:'IDLE',relativeDistanceM:null,relativeLateralDistanceM:null,collisionPenaltySeconds:this.definition.collisionPenaltySeconds,penaltyApplied:false}:EMPTY_DRIVING_EVENT}
  start(){if(!this.definition)throw new Error('Driving event is not configured');this.snapshot={...this.snapshot,status:'ACTIVE',relativeDistanceM:this.definition.actor.distanceAheadM,relativeLateralDistanceM:this.definition.actor.lateralOffsetM,penaltyApplied:false};return this.definition.actor}
  step(observation:Readonly<LeadVehicleObservation>){
    if(this.snapshot.status!=='ACTIVE'||!this.definition)return {snapshot:this.snapshot,applyPenaltySeconds:0,removeActor:false}
    const updated={...this.snapshot,relativeDistanceM:observation.available?observation.relativeLongitudinalDistanceM:this.snapshot.relativeDistanceM,relativeLateralDistanceM:observation.available?observation.relativeLateralDistanceM:this.snapshot.relativeLateralDistanceM}
    if(observation.collisionActive){
      this.snapshot={...updated,status:'HIT',penaltyApplied:true}
      return {snapshot:this.snapshot,applyPenaltySeconds:this.definition.collisionPenaltySeconds,removeActor:false}
    }
    if(observation.available&&observation.relativeLongitudinalDistanceM<this.definition.clearBehindDistanceM){
      this.snapshot={...updated,status:'CLEARED'}
      return {snapshot:this.snapshot,applyPenaltySeconds:0,removeActor:true}
    }
    this.snapshot=updated
    return {snapshot:this.snapshot,applyPenaltySeconds:0,removeActor:false}
  }
  getDefinition(){return this.definition?structuredClone(this.definition):null}
  getSnapshot(){return this.snapshot}
}
