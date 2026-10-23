import type { Placeholder } from '../../core/placeholder'
import session from './session.json'

interface SessionDisplay {
  readonly raceLength: string
  readonly incidentCount: string
  readonly difficulty: string
  readonly speed: string
  readonly raceTimer: string
}

// JSON literals widen to string on import; validate the marker without a type assertion.
if (session.kind !== 'PLACEHOLDER') {
  throw new Error('UI fixtures must be explicitly marked PLACEHOLDER')
}
export const mockSession: Placeholder<SessionDisplay> = {
  kind: session.kind,
  value: Object.freeze(session.value),
}
