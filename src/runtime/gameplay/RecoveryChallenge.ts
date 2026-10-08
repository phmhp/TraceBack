import type { MapPoint, RouteDefinition } from '../../domain/world/MapDefinition.ts'

export type GameplayPhase =
  | 'PRE_RACE' | 'NORMAL_DRIVE' | 'FAULT_EVENT' | 'INVESTIGATION'
  | 'DIAGNOSIS_RESULT' | 'REPAIR_SELECTION' | 'REPAIR_VERIFICATION'
  | 'RECOVERY_DRIVE' | 'MISSION_FINISH' | 'MISSION_RESULT'
  | 'ASSISTED_SOLUTION' | 'RETRY_REPAIR'

export type CatEmotion = 'IDLE' | 'FOCUSED' | 'HAPPY_DRIVING' | 'SURPRISED' | 'WORRIED' | 'THINKING' | 'HOPEFUL' | 'RELIEVED' | 'CELEBRATING'

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
  elapsedSeconds: number
  checkpointIndex: number
  checkpointCount: number
  lastCheckpointId: string | null
  finishTimeSeconds: number | null
  personalBestSeconds: number | null
  isNewBest: boolean
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
  private readonly key: string
  private listeners = new Set<() => void>()
  readonly track:TrackDefinition
  readonly mission:RaceMissionDefinition
  private readonly bestTimes:BestTimeStore
  constructor(track: TrackDefinition, mission: RaceMissionDefinition, bestTimes: BestTimeStore = createMemoryBestTimeStore()) {
    if (mission.trackId !== track.id) throw new Error('Recovery mission and track do not match')
    this.track=track;this.mission=mission;this.bestTimes=bestTimes
    this.key = `trackback:best:${track.id}:${track.version}:${mission.id}:${mission.version}:${mission.rulesVersion}`
    this.snapshot = this.initial('LOCKED')
  }
  private initial(status: RecoverySnapshot['status']): RecoverySnapshot { return { status, elapsedSeconds: 0, checkpointIndex: 0, checkpointCount: this.track.checkpoints.length, lastCheckpointId: null, finishTimeSeconds: null, personalBestSeconds: this.bestTimes.read(this.key), isNewBest: false, reaction: status === 'READY' ? 'HOPEFUL' : 'IDLE' } }
  readonly subscribe = (listener: () => void) => { this.listeners.add(listener); return () => { this.listeners.delete(listener) } }
  readonly getSnapshot = () => this.snapshot
  private update(patch: Partial<RecoverySnapshot>) { this.snapshot = { ...this.snapshot, ...patch }; this.listeners.forEach(listener => listener()) }
  lock(){this.snapshot=this.initial('LOCKED');this.listeners.forEach(listener=>listener())}
  unlock() { this.snapshot = this.initial('READY'); this.listeners.forEach(listener => listener()) }
  start() { if (this.snapshot.status === 'LOCKED') throw new Error('Repair verification must pass before recovery drive'); this.snapshot = this.initial('RUNNING'); this.snapshot.reaction = 'FOCUSED'; this.listeners.forEach(listener => listener()) }
  retry() { this.start() }
  advance(dt: number, position: Pick<MapPoint, 'x' | 'z'>) {
    if (this.snapshot.status !== 'RUNNING' || !Number.isFinite(dt) || dt <= 0) return { checkpoint: null as string | null, finished: false }
    let checkpoint: string | null = null
    const next = this.track.checkpoints[this.snapshot.checkpointIndex]
    if (next && within(position, next.position, next.radiusMeters)) {
      checkpoint = next.id
      this.update({ checkpointIndex: this.snapshot.checkpointIndex + 1, lastCheckpointId: next.id, reaction: 'HAPPY_DRIVING' })
    }
    const elapsedSeconds = this.snapshot.elapsedSeconds + dt
    this.update({ elapsedSeconds, reaction: checkpoint ? 'HAPPY_DRIVING' : 'FOCUSED' })
    const allCollected = this.snapshot.checkpointIndex === this.track.checkpoints.length
    if (!allCollected || !within(position, this.track.finish.position, this.track.finish.radiusMeters)) return { checkpoint, finished: false }
    const previous = this.snapshot.personalBestSeconds
    const isNewBest = previous === null || elapsedSeconds < previous
    if (isNewBest) this.bestTimes.write(this.key, elapsedSeconds)
    this.update({ status: 'FINISHED', finishTimeSeconds: elapsedSeconds, personalBestSeconds: isNewBest ? elapsedSeconds : previous, isNewBest, reaction: 'CELEBRATING' })
    return { checkpoint, finished: true }
  }
}
