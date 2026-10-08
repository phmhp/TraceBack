import { create } from 'zustand'
import type { RecoverySnapshot } from '../../runtime/gameplay/RecoveryChallenge.ts'

export const INITIAL_RECOVERY_HUD: RecoverySnapshot = { status: 'LOCKED', elapsedSeconds: 0, checkpointIndex: 0, checkpointCount: 0, lastCheckpointId: null, finishTimeSeconds: null, personalBestSeconds: null, isNewBest: false, reaction: 'IDLE' }
export const useRecoveryHud = create<RecoverySnapshot>(() => ({ ...INITIAL_RECOVERY_HUD }))
export function publishRecoveryHud(snapshot: RecoverySnapshot) { useRecoveryHud.setState({ ...snapshot }) }
