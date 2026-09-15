import type { ReactNode } from 'react'
import { useNavigation } from '../state/navigation'

export function NavigationButton({ children, action = 'next', secondary = false }: {
  children: ReactNode; action?: 'next' | 'back' | 'reset'; secondary?: boolean
}) {
  const navigate = useNavigation((state) => state[action])
  return <button type="button" className={secondary ? 'button-secondary' : 'button-primary'}
    onClick={navigate}>{children}</button>
}
