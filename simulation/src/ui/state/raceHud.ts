import { create } from 'zustand'
import { INITIAL_TELEMETRY } from '../../runtime/SimulationRuntime'
import type { RaceTelemetry } from '../../runtime/SimulationRuntime'

// 10 Hz telemetry + immediate lifecycle events only. No vehicle transform is stored here.
export const useRaceHud = create<RaceTelemetry>(() => ({ ...INITIAL_TELEMETRY }))
export function publishRaceHud(telemetry: RaceTelemetry) { useRaceHud.setState(telemetry) }
