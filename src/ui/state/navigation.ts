import { create } from 'zustand'
import { DEFAULT_SESSION_CONFIG } from '../../domain/session/SessionConfig.ts'
import type { SessionConfig } from '../../domain/session/SessionConfig.ts'
export type { Difficulty, RaceLength, SessionConfig } from '../../domain/session/SessionConfig.ts'

export type Screen = 'main' | 'setup' | 'race' | 'xray' | 'debrief'
export type GamePhase =
  | 'MAIN' | 'SESSION_SETUP' | 'PRE_RACE' | 'NORMAL_DRIVE' | 'PAUSE_MENU'
  | 'FAULT_EVENT' | 'INVESTIGATION' | 'DIAGNOSIS_RESULT' | 'REPAIR_SELECTION'
  | 'REPAIR_VERIFICATION' | 'RETRY_REPAIR' | 'ASSISTED_SOLUTION'
  | 'RECOVERY_COUNTDOWN' | 'RECOVERY_DRIVE' | 'MISSION_FINISH' | 'MISSION_RESULT'

interface GameFlowState {
  phase: GamePhase; screen: Screen; draftConfig: SessionConfig; sessionConfig: SessionConfig | null
  pausedFrom: 'NORMAL_DRIVE' | 'RECOVERY_DRIVE' | null
  diagnosisStatus:'NONE'|'CORRECT_SUPPORTED'|'CORRECT_INCOMPLETE'|'INCORRECT'|'ASSISTED'
  updateDraft: (patch: Partial<SessionConfig>) => void
  startSession: () => void; completeCountdown: () => void
  pauseRace: () => void; resumeRace: () => void; restartRace: () => void
  finishRace: () => void
  openDebrief: () => void
  markFaultEvent: () => void
  recordDiagnosis:(status:GameFlowState['diagnosisStatus'])=>void
  beginRepairSelection:()=>void
  beginRepairVerification:()=>void
  repairVerificationFailed:()=>void
  resumeInvestigation:()=>void
  beginRecovery: () => void
  completeRecoveryCountdown: () => void
  retryRecovery: () => void
  completeInvestigation: (destination: 'race' | 'debrief') => void
  enterDebugXRay: () => void; leaveXRay: () => void
  next: () => void; back: () => void; reset: () => void
}

// One low-frequency state machine owns navigation and lifecycle. Simulation data never enters this store.
export const useNavigation = create<GameFlowState>((set) => ({
  phase: 'MAIN', screen: 'main', draftConfig: DEFAULT_SESSION_CONFIG, sessionConfig: null, pausedFrom:null,diagnosisStatus:'NONE',
  updateDraft: (patch) => set(({ draftConfig }) => ({ draftConfig: { ...draftConfig, ...patch } })),
  startSession: () => set(({ draftConfig }) => ({ sessionConfig: { ...draftConfig }, phase: 'PRE_RACE', screen: 'race' })),
  completeCountdown: () => set(({ phase }) => phase === 'PRE_RACE' ? { phase: 'NORMAL_DRIVE' } : phase === 'RECOVERY_COUNTDOWN' ? { phase: 'RECOVERY_DRIVE' } : {}),
  pauseRace: () => set(({ phase }) => phase === 'NORMAL_DRIVE' || phase === 'RECOVERY_DRIVE' ? { phase: 'PAUSE_MENU', pausedFrom:phase } : {}),
  resumeRace: () => set(({ phase,pausedFrom }) => phase === 'PAUSE_MENU' ? { phase: pausedFrom??'NORMAL_DRIVE', pausedFrom:null } : {}),
  restartRace: () => set(({ sessionConfig }) => sessionConfig
    ? { draftConfig: { ...sessionConfig }, phase: 'PRE_RACE', screen: 'race' }
    : { phase: 'SESSION_SETUP', screen: 'setup' }),
  finishRace: () => set(({ phase }) => phase === 'RECOVERY_DRIVE' ? { phase: 'MISSION_FINISH' } : {}),
  openDebrief: () => set(({ phase }) => phase === 'MISSION_FINISH' ? { phase: 'MISSION_RESULT', screen: 'debrief' } : {}),
  markFaultEvent: () => set(({phase})=>phase==='NORMAL_DRIVE'?{phase:'FAULT_EVENT'}:{}),
  recordDiagnosis:(status)=>set(({phase})=>phase==='INVESTIGATION'?{phase:status==='ASSISTED'?'ASSISTED_SOLUTION':'DIAGNOSIS_RESULT',diagnosisStatus:status}:{}),
  beginRepairSelection:()=>set(({phase})=>['DIAGNOSIS_RESULT','ASSISTED_SOLUTION','RETRY_REPAIR'].includes(phase)?{phase:'REPAIR_SELECTION'}:{}),
  beginRepairVerification:()=>set(({phase})=>phase==='REPAIR_SELECTION'||phase==='RETRY_REPAIR'?{phase:'REPAIR_VERIFICATION'}:{}),
  repairVerificationFailed:()=>set(({phase})=>phase==='REPAIR_VERIFICATION'?{phase:'RETRY_REPAIR'}:{}),
  resumeInvestigation:()=>set(({phase})=>['DIAGNOSIS_RESULT','REPAIR_SELECTION','REPAIR_VERIFICATION','RETRY_REPAIR','ASSISTED_SOLUTION'].includes(phase)?{phase:'INVESTIGATION'}:{}),
  beginRecovery: () => set(({phase})=>['INVESTIGATION','DIAGNOSIS_RESULT','REPAIR_SELECTION','REPAIR_VERIFICATION','ASSISTED_SOLUTION','RETRY_REPAIR'].includes(phase)?{phase:'RECOVERY_COUNTDOWN',screen:'race'}:{}),
  completeRecoveryCountdown: () => set(({phase})=>phase==='RECOVERY_COUNTDOWN'?{phase:'RECOVERY_DRIVE'}:{}),
  retryRecovery: () => set(({phase})=>phase==='MISSION_RESULT'||phase==='MISSION_FINISH'?{phase:'RECOVERY_COUNTDOWN',screen:'race'}:{}),
  completeInvestigation: (destination) => set(({ phase }) => phase === 'INVESTIGATION' || phase === 'REPAIR_SELECTION' || phase === 'REPAIR_VERIFICATION' || phase === 'ASSISTED_SOLUTION'
    ? destination === 'debrief' ? { phase: 'MISSION_RESULT', screen: 'debrief' } : { phase: 'RECOVERY_COUNTDOWN', screen: 'race' }
    : {}),
  enterDebugXRay: () => set(({ phase }) => phase === 'NORMAL_DRIVE' || phase === 'PAUSE_MENU' || phase === 'FAULT_EVENT' ? { phase: 'INVESTIGATION', screen: 'xray' } : {}),
  leaveXRay: () => set(({ phase }) => phase === 'INVESTIGATION' ? { phase: 'NORMAL_DRIVE', screen: 'race' } : {}),
  next: () => set(({ screen, draftConfig }) => screen === 'main'
    ? { sessionConfig: { ...draftConfig }, phase: 'PRE_RACE', screen: 'race' }
    : screen === 'setup' ? { sessionConfig: { ...draftConfig }, phase: 'PRE_RACE', screen: 'race' } : {}),
  back: () => set(({ screen, phase }) => screen === 'setup'
    ? { phase: 'MAIN', screen: 'main' }
    : screen === 'xray' && phase === 'INVESTIGATION' ? { phase: 'NORMAL_DRIVE', screen: 'race' } : {}),
  reset: () => set({ phase: 'MAIN', screen: 'main', sessionConfig: null, pausedFrom:null,diagnosisStatus:'NONE' }),
}))
