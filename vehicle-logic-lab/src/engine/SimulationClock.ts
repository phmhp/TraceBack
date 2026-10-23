/** Seconds. 60 Hz is a game-physics setting, not an ECU or safety-standard period. */
export const PHYSICS_TIMESTEP = 1 / 60

export class SimulationClock {
  currentTime = 0
  deltaTime = 0
  running = false
  paused = false
  private ticks = 0
  readonly fixedDeltaTime: number

  constructor(fixedDeltaTime = PHYSICS_TIMESTEP) {
    if (!Number.isFinite(fixedDeltaTime) || fixedDeltaTime <= 0) throw new Error('Invalid fixed timestep')
    this.fixedDeltaTime = fixedDeltaTime
  }
  start() {
    this.reset()
    this.running = true
  }
  pause() {
    if (this.running) this.paused = true
    this.deltaTime = 0
  }
  resume() {
    if (this.running) this.paused = false
  }
  reset() {
    this.ticks = 0
    this.currentTime = 0
    this.deltaTime = 0
    this.running = false
    this.paused = false
  }
  /** Advances exactly one fixed tick; stopped/paused clocks never advance. */
  step(): boolean {
    if (!this.running || this.paused) return false
    this.deltaTime = this.fixedDeltaTime
    this.currentTime = ++this.ticks * this.fixedDeltaTime
    return true
  }
}
