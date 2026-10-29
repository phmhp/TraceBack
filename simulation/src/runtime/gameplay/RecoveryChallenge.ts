import type { MapPoint, RouteDefinition } from '../../domain/world/MapDefinition.ts'

export type GameplayPhase =
  | 'PRE_RACE' | 'NORMAL_DRIVE' | 'FAULT_EVENT' | 'INVESTIGATION'
  | 'DIAGNOSIS_RESULT' | 'REPAIR_SELECTION' | 'REPAIR_VERIFICATION'
  | 'RECOVERY_DRIVE' | 'MISSION_FINISH' | 'MISSION_RESULT'
  | 'ASSISTED_SOLUTION' | 'RETRY_REPAIR'

export type CatEmotion = 'IDLE' | 'FOCUSED' | 'HAPPY_DRIVING' | 'SURPRISED' | 'WORRIED' | 'THINKING' | 'HOPEFUL' | 'RELIEVED' | 'CELEBRATING'
export type RecoveryRunMode = 'CASE_RECOVERY' | 'CLEAN_REMATCH'

export interface SectorResult {
  id:string
  index:number
  timeSeconds:number
  bestSeconds:number
  deltaSeconds:number|null
  comparisonDeltaSeconds:number|null
  isNewBest:boolean
}

export interface CheckpointDefinition {
  id: string
  trackId: string
  missionId: string
  order: number
  position: MapPoint
  radiusMeters: number
  label: string
}

export interface FinishTrigger {
  position: MapPoint
  radiusMeters: number
}

export interface TrackDefinition {
  id: string
  routeId: string
  version: string
  checkpoints: readonly CheckpointDefinition[]
  finish: FinishTrigger
}

export interface RaceMissionDefinition {
  id: string
  trackId: string
  version: string
  title: string
  rulesVersion: string
  medalThresholdsSeconds?: { gold: number; silver: number; bronze: number }
}

export interface RecoverySnapshot {
  status: 'LOCKED' | 'READY' | 'RUNNING' | 'FINISHED'
  runMode: RecoveryRunMode
  elapsedSeconds: number
  penaltySeconds:number
  checkpointIndex: number
  checkpointCount: number
  lastCheckpointId: string | null
  finishTimeSeconds: number | null
  personalBestSeconds: number | null
  isNewBest: boolean
  sectorIndex:number
  sectorCount:number
  sectorStartSeconds:number
  sectorResults:readonly SectorResult[]
  sectorBestSeconds:readonly (number|null)[]
  lastSectorResult:SectorResult|null
  reaction: CatEmotion
}

export interface BestTimeStore {
  read(key: string): number | null
  write(key: string, seconds: number): void
}

export const createMemoryBestTimeStore = (): BestTimeStore => {
  const records = new Map<string, number>()
  return { read: (key) => records.get(key) ?? null, write: (key, seconds) => { records.set(key, seconds) } }
}

export function createLocalBestTimeStore(storage: Pick<Storage, 'getItem' | 'setItem'>): BestTimeStore {
  return {
    read(key) { const value = Number(storage.getItem(key)); return Number.isFinite(value) && value > 0 ? value : null },
    write(key, seconds) { storage.setItem(key, String(seconds)) },
  }
}

export function createRecoveryTrack(mapId: string, route: RouteDefinition, missionId: string): TrackDefinition {
  const checkpoints = route.checkpoints.map((checkpoint, order) => {
    const position = route.orderedPoints[checkpoint.pointIndex]
    if (!position) throw new Error(`Checkpoint ${checkpoint.id} references missing route point ${checkpoint.pointIndex}`)
    return { id: checkpoint.id, trackId: mapId, missionId, order, position, radiusMeters: 15, label: `${order + 1}번째 체크포인트` }
  })
  return { id: mapId, routeId: route.routeId, version: 'map-v1', checkpoints, finish: { position: route.finishPoint, radiusMeters: 12 } }
}

const within = (position: Pick<MapPoint, 'x' | 'z'>, target: Pick<MapPoint, 'x' | 'z'>, radius: number) => Math.hypot(position.x - target.x, position.z - target.z) <= radius

export class RecoveryChallenge {
  private snapshot: RecoverySnapshot
  private readonly keyPrefix: string
  private listeners = new Set<() => void>()
  readonly track:TrackDefinition
  readonly mission:RaceMissionDefinition
  private readonly bestTimes:BestTimeStore
  constructor(track: TrackDefinition, mission: RaceMissionDefinition, bestTimes: BestTimeStore = createMemoryBestTimeStore()) {
    if (mission.trackId !== track.id) throw new Error('Recovery mission and track do not match')
    this.track=track;this.mission=mission;this.bestTimes=bestTimes
    this.keyPrefix = `trackback:best:${track.id}:${track.version}:${mission.id}:${mission.version}:${mission.rulesVersion}`
    this.snapshot = this.initial('LOCKED')
  }
  private bestKey(mode:RecoveryRunMode){return `${this.keyPrefix}:${mode}`}
  private sectorKey(mode:RecoveryRunMode,index:number){return `${this.keyPrefix}:${mode}:sector:${index+1}`}
  private sectorCount(){return Math.max(2,Math.min(4,this.track.checkpoints.length))}
  private initial(status: RecoverySnapshot['status'],runMode:RecoveryRunMode='CASE_RECOVERY'): RecoverySnapshot {
    const sectorCount=this.sectorCount()
    return { status, runMode, elapsedSeconds: 0, penaltySeconds:0, checkpointIndex: 0, checkpointCount: this.track.checkpoints.length, lastCheckpointId: null, finishTimeSeconds: null, personalBestSeconds: this.bestTimes.read(this.bestKey(runMode)), isNewBest: false, sectorIndex:0, sectorCount, sectorStartSeconds:0, sectorResults:[], sectorBestSeconds:Array.from({length:sectorCount},(_,index)=>this.bestTimes.read(this.sectorKey(runMode,index))), lastSectorResult:null, reaction: status === 'READY' ? 'HOPEFUL' : 'IDLE' }
  }
  readonly subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  readonly getSnapshot = () => this.snapshot
  private update(patch: Partial<RecoverySnapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(listener => listener()) }
  lock(){this.snapshot=this.initial('LOCKED','CASE_RECOVERY');this.listeners.forEach(listener=>listener())}
  unlock() { this.prepare('CASE_RECOVERY') }
  prepare(runMode:RecoveryRunMode=this.snapshot.runMode){this.snapshot=this.initial('READY',runMode);this.listeners.forEach(listener=>listener())}
  start() { if (this.snapshot.status === 'LOCKED') throw new Error('Repair verification must pass before recovery drive'); this.snapshot = this.initial('RUNNING',this.snapshot.runMode); this.snapshot.reaction = 'FOCUSED'; this.listeners.forEach(listener => listener()) }
  retry() { this.start() }
  addPenalty(seconds:number){if(this.snapshot.status!=='RUNNING'||!Number.isFinite(seconds)||seconds<=0)return;this.update({elapsedSeconds:this.snapshot.elapsedSeconds+seconds,penaltySeconds:this.snapshot.penaltySeconds+seconds,reaction:'WORRIED'})}
  private completeSector(index:number,elapsedSeconds:number){
    if(index<0||index>=this.snapshot.sectorCount||this.snapshot.sectorResults.some(item=>item.index===index))return null
    const timeSeconds=elapsedSeconds-this.snapshot.sectorStartSeconds
    const previous=this.snapshot.sectorBestSeconds[index]??null
    const isNewBest=previous===null||timeSeconds<previous
    const bestSeconds=isNewBest?timeSeconds:previous
    if(isNewBest)this.bestTimes.write(this.sectorKey(this.snapshot.runMode,index),timeSeconds)
    const comparison=this.snapshot.runMode==='CLEAN_REMATCH'?this.bestTimes.read(this.sectorKey('CASE_RECOVERY',index)):null
    const result:SectorResult={id:`SECTOR_${index+1}`,index,timeSeconds,bestSeconds,deltaSeconds:previous===null?null:timeSeconds-previous,comparisonDeltaSeconds:comparison===null?null:timeSeconds-comparison,isNewBest}
    return result
  }
  advance(dt: number, position: Pick<MapPoint, 'x' | 'z'>) {
    if (this.snapshot.status !== 'RUNNING' || !Number.isFinite(dt) || dt <= 0) return { checkpoint: null as string | null, finished: false }
    const elapsedSeconds = this.snapshot.elapsedSeconds + dt
    let checkpoint: string | null = null
    const next = this.track.checkpoints[this.snapshot.checkpointIndex]
    if (next && within(position, next.position, next.radiusMeters)) {
      checkpoint = next.id
      const nextCheckpointIndex=this.snapshot.checkpointIndex+1
      const sectorBoundary=next.order<this.snapshot.sectorCount-1
      const sector=sectorBoundary?this.completeSector(next.order,elapsedSeconds):null
      this.update({ checkpointIndex:nextCheckpointIndex, lastCheckpointId: next.id, elapsedSeconds, reaction: 'HAPPY_DRIVING', ...(sector?{sectorIndex:sector.index+1,sectorStartSeconds:elapsedSeconds,sectorResults:[...this.snapshot.sectorResults,sector],sectorBestSeconds:this.snapshot.sectorBestSeconds.map((value,index)=>index===sector.index?sector.bestSeconds:value),lastSectorResult:sector}:{}) })
    }
    if(!checkpoint)this.update({ elapsedSeconds, reaction:'FOCUSED' })
    const allCollected = this.snapshot.checkpointIndex === this.track.checkpoints.length
    if (!allCollected || !within(position, this.track.finish.position, this.track.finish.radiusMeters)) return { checkpoint, finished: false }
    const finalSector=this.completeSector(this.snapshot.sectorCount-1,elapsedSeconds)
    const previous = this.snapshot.personalBestSeconds
    const isNewBest = previous === null || elapsedSeconds < previous
    if (isNewBest) this.bestTimes.write(this.bestKey(this.snapshot.runMode), elapsedSeconds)
    this.update({ status: 'FINISHED', finishTimeSeconds: elapsedSeconds, personalBestSeconds: isNewBest ? elapsedSeconds : previous, isNewBest, sectorIndex:this.snapshot.sectorCount, ...(finalSector?{sectorStartSeconds:elapsedSeconds,sectorResults:[...this.snapshot.sectorResults,finalSector],sectorBestSeconds:this.snapshot.sectorBestSeconds.map((value,index)=>index===finalSector.index?finalSector.bestSeconds:value),lastSectorResult:finalSector}:{}), reaction: 'CELEBRATING' })
    return { checkpoint, finished: true }
  }
}
