import { create } from 'zustand'
import { DEFAULT_SESSION_CONFIG } from '../../domain/session/SessionConfig.ts'
import type { SessionConfig } from '../../domain/session/SessionConfig.ts'
export type { Difficulty, RaceLength, SessionConfig } from '../../domain/session/SessionConfig.ts'

export type Screen = 'main' | 'setup' | 'race' | 'xray' | 'debrief'
export type GamePhase =
  | 'MAIN' | 'SESSION_SETUP' | 'RACE_COUNTDOWN' | 'RACE_NORMAL' | 'PAUSE_MENU'
  | 'FAULT_DETECTED' | 'INCIDENT_RECORDING' | 'INCIDENT_FREEZE' | 'XRAY_MODE'
  | 'ROOT_CAUSE_SELECTION' | 'CORRECTIVE_ACTION' | 'VERIFICATION_REPLAY'
  | 'VERIFICATION_PASS' | 'VERIFICATION_FAIL' | 'RACE_RESUME' | 'FINISH' | 'DEBRIEF'

interface GameFlowState {
  phase: GamePhase; screen: Screen; draftConfig: SessionConfig; sessionConfig: SessionConfig | null
  updateDraft: (patch: Partial<SessionConfig>) => void
  startSession: () => void; completeCountdown: () => void
  pauseRace: () => void; resumeRace: () => void; restartRace: () => void
  finishRace: () => void
  openDebrief: () => void
  completeInvestigation: (destination: 'race' | 'debrief') => void
  enterDebugXRay: () => void; leaveXRay: () => void
  next: () => void; back: () => void; reset: () => void
}

// One low-frequency state machine owns navigation and lifecycle. Simulation data never enters this store.
export const useNavigation = create<GameFlowState>((set) => ({
  phase: 'MAIN', screen: 'main', draftConfig: DEFAULT_SESSION_CONFIG, sessionConfig: null,
  updateDraft: (patch) => set(({ draftConfig }) => ({ draftConfig: { ...draftConfig, ...patch } })),
  startSession: () => set(({ draftConfig }) => ({ sessionConfig: { ...draftConfig }, phase: 'RACE_COUNTDOWN', screen: 'race' })),
  completeCountdown: () => set(({ phase }) => phase === 'RACE_COUNTDOWN' ? { phase: 'RACE_NORMAL' } : {}),
  pauseRace: () => set(({ phase }) => phase === 'RACE_NORMAL' ? { phase: 'PAUSE_MENU' } : {}),
  resumeRace: () => set(({ phase }) => phase === 'PAUSE_MENU' ? { phase: 'RACE_NORMAL' } : {}),
  restartRace: () => set(({ sessionConfig }) => sessionConfig
    ? { draftConfig: { ...sessionConfig }, phase: 'RACE_COUNTDOWN', screen: 'race' }
    : { phase: 'SESSION_SETUP', screen: 'setup' }),
  finishRace: () => set(({ phase }) => phase === 'RACE_NORMAL' ? { phase: 'FINISH' } : {}),
  openDebrief: () => set(({ phase }) => phase === 'FINISH' ? { phase: 'DEBRIEF', screen: 'debrief' } : {}),
  completeInvestigation: (destination) => set(({ phase }) => phase === 'XRAY_MODE'
    ? destination === 'debrief' ? { phase: 'DEBRIEF', screen: 'debrief' } : { phase: 'RACE_NORMAL', screen: 'race' }
    : {}),
  enterDebugXRay: () => set(({ phase }) => phase === 'RACE_NORMAL' || phase === 'PAUSE_MENU' ? { phase: 'XRAY_MODE', screen: 'xray' } : {}),
  leaveXRay: () => set(({ phase }) => phase === 'XRAY_MODE' ? { phase: 'RACE_NORMAL', screen: 'race' } : {}),
  next: () => set(({ screen, draftConfig }) => screen === 'main'
    ? { sessionConfig: { ...draftConfig }, phase: 'RACE_COUNTDOWN', screen: 'race' }
    : screen === 'setup' ? { sessionConfig: { ...draftConfig }, phase: 'RACE_COUNTDOWN', screen: 'race' } : {}),
  back: () => set(({ screen, phase }) => screen === 'setup'
    ? { phase: 'MAIN', screen: 'main' }
    : screen === 'xray' && phase === 'XRAY_MODE' ? { phase: 'RACE_NORMAL', screen: 'race' } : {}),
  reset: () => set({ phase: 'MAIN', screen: 'main', sessionConfig: null }),
}))
