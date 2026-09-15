import { createContext, useContext } from 'react'
import type { VehicleStateReader } from '../../domain/vehicle/VehicleState.ts'
import type { LoadedMap } from '../../world/MapLoader.ts'

export interface WorldView { map: LoadedMap; readVehicleState: VehicleStateReader }
export const WorldViewContext = createContext<WorldView | null>(null)
export function useWorldView() { const value = useContext(WorldViewContext); if (!value) throw new Error('WorldViewContext is unavailable'); return value }
