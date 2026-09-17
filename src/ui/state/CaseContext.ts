import { createContext, useContext, useSyncExternalStore } from 'react'
import type { PropulsionCase } from '../../runtime/case/PropulsionCase'
export const CaseContext = createContext<PropulsionCase | null>(null)
export function useCase() {
  const controller = useContext(CaseContext)
  if (!controller) throw new Error('Case provider missing')
  const state = useSyncExternalStore(controller.subscribe, controller.getSnapshot)
  return { controller, state }
}
