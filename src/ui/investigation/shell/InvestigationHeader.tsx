import type { InvestigationPage } from '../presentation/InvestigationPresentationModel'
import type { Difficulty } from '../../../domain/session/SessionConfig.ts'
import { formatInvestigationTime, investigationDifficultyLabel } from '../../../runtime/investigation/InvestigationChallenge.ts'

interface HeaderProps {
  currentPage: InvestigationPage
  onSelectPage: (page: InvestigationPage) => void
  difficulty: Difficulty
  remainingSeconds: number
  timeExpired: boolean
}

const steps = [
  { page: 1 as InvestigationPage, label: '1. 현상 파악', icon: '🔍' },
  { page: 2 as InvestigationPage, label: '2. 원인 추적', icon: '🌲' },
  { page: 3 as InvestigationPage, label: '3. 가설 검증', icon: '🧪' },
  { page: 4 as InvestigationPage, label: '4. 결론 제출', icon: '📋' }
]

export function InvestigationHeader({ currentPage, onSelectPage, difficulty, remainingSeconds, timeExpired }: HeaderProps) {
  return (
    <header className="investigation-top-header">
      <div className="brand-section">
        <img src="..\..\..\public\assets\investigation\cat-face.png" alt="TRACKBACK" className="logo-image" />
        <div className="brand-title-wrap">
          <b className="brand-title">TRACKBACK</b>
          <small className="brand-subtitle">고장 원인 조사실</small>
        </div>
      </div>

      <div className={`investigation-challenge-clock ${timeExpired ? 'expired' : ''}`} role="timer" aria-label="고장 원인 조사 남은 시간">
        <span>{investigationDifficultyLabel[difficulty]} 조사</span>
        <strong>{timeExpired ? 'TIME OUT' : formatInvestigationTime(remainingSeconds)}</strong>
      </div>

      <nav className="stepper-nav" aria-label="조사 사고 단계">
        {steps.map((step, idx) => (
          <span key={step.page} style={{ display: 'inline-flex', alignItems: 'center', gap: '8px' }}>
            {idx > 0 && <span className="stepper-arrow">›</span>}
            <button
              type="button"
              className={`step-btn ${currentPage === step.page ? 'active' : ''}`}
              onClick={() => onSelectPage(step.page)}
            >
              <span className="step-icon">{step.icon}</span>
              <span>{step.label}</span>
            </button>
          </span>
        ))}
      </nav>
    </header>
  )
}
