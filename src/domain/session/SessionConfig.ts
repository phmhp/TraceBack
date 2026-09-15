export type Difficulty = 'GUIDED' | 'STANDARD' | 'EXPERT'
export type RaceLength = 'SHORT' | 'MEDIUM' | 'LONG'
export interface SessionConfig {
  raceLength: RaceLength
  incidentCount: 1 | 2 | 3
  difficulty: Difficulty
}

export const DEFAULT_SESSION_CONFIG: SessionConfig = {
  raceLength: 'MEDIUM', incidentCount: 1, difficulty: 'STANDARD',
}
