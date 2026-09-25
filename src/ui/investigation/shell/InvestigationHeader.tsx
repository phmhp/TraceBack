import type { InvestigationPage } from '../presentation/InvestigationPresentationModel'

interface HeaderProps {
  currentPage: InvestigationPage
  onSelectPage: (page: InvestigationPage) => void
}

const steps = [
  { page: 1 as InvestigationPage, label: '1. 현상 파악', icon: '🔍' },
  { page: 2 as InvestigationPage, label: '2. 원인 추적', icon: '🌲' },
  { page: 3 as InvestigationPage, label: '3. 가설 검증', icon: '🧪' },
  { page: 4 as InvestigationPage, label: '4. 결론 제출', icon: '📋' }
]

export function InvestigationHeader({ currentPage, onSelectPage }: HeaderProps) {
  return (
    <header className="investigation-top-header">
      <div className="brand-section">
        <img
          src="/assets/investigation/cat-face.png"
          alt="TRACKBACK Logo"
          className="brand-cat-icon"
          onError={(e) => {
            // Fallback if image not found
            (e.target as HTMLElement).style.display = 'none'
          }}
        />
        <div className="brand-title-wrap">
          <span className="brand-title">TRACKBACK</span>
          <span className="brand-subtitle">/ 고장 원인 조사</span>
        </div>
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
