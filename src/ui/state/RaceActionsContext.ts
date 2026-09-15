import { createContext, useContext } from 'react'

export interface RaceActions { pause: () => void; resume: () => void; restart: () => void; quitToMain: () => void }
export const RaceActionsContext = createContext<RaceActions | null>(null)
export function useRaceActions() {
  const actions = useContext(RaceActionsContext)
  if (!actions) throw new Error('RaceActions provider is missing')
  return actions
}
