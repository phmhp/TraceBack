import type { Difficulty } from '../../domain/session/SessionConfig.ts'

export const investigationTimeLimitSeconds: Record<Difficulty, number> = {
  GUIDED: 12 * 60,
  STANDARD: 8 * 60,
  EXPERT: 5 * 60,
}

export const investigationDifficultyLabel: Record<Difficulty, string> = {
  GUIDED: '가이드',
  STANDARD: '표준',
  EXPERT: '전문가',
}

export function formatInvestigationTime(totalSeconds: number) {
  const seconds = Math.max(0, Math.ceil(totalSeconds))
  return `${String(Math.floor(seconds / 60)).padStart(2, '0')}:${String(seconds % 60).padStart(2, '0')}`
}
