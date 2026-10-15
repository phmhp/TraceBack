import { create } from 'zustand'
import type { RecoverySnapshot } from '../../runtime/gameplay/RecoveryChallenge.ts'

export const INITIAL_RECOVERY_HUD: RecoverySnapshot = { status: 'LOCKED', runMode:'CASE_RECOVERY', elapsedSeconds: 0, checkpointIndex: 0, checkpointCount: 0, lastCheckpointId: null, finishTimeSeconds: null, personalBestSeconds: null, isNewBest: false, sectorIndex:0, sectorCount:4, sectorStartSeconds:0, sectorResults:[], sectorBestSeconds:[null,null,null,null], lastSectorResult:null, reaction: 'IDLE' }
export const useRecoveryHud = create<RecoverySnapshot>(() => ({ ...INITIAL_RECOVERY_HUD }))
export function publishRecoveryHud(snapshot: RecoverySnapshot) { useRecoveryHud.setState({ ...snapshot }) }
