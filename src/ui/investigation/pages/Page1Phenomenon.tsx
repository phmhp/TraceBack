import type { InvestigationPresentationModel } from '../presentation/InvestigationPresentationModel'

interface Page1Props {
  model: InvestigationPresentationModel
  onStartTracking: () => void
  onOpenStateModal?: () => void
}

export function Page1Phenomenon({ model, onStartTracking, onOpenStateModal }: Page1Props) {
  return (
    <div className="investigation-main-content">
      {/* 5. 고장 현상 배너 */}
      <section className="phenomenon-banner">
        <div className="phenomenon-title-wrap">
          <div className="phenomenon-header-row">
            <span>⚠️</span>
            <span>고장 현상</span>
          </div>
          <h1 className="phenomenon-title">{model.symptomName}</h1>
          <p className="phenomenon-desc">{model.symptomSummary}</p>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '20px' }}>
          <div className="driver-statement-bubble">
            <small>운전자 진술</small>
            <b>“{model.driverQuote}”</b>
          </div>

          <div className="event-time-badge-box">
            <div>
              <div style={{ fontSize: '11px', color: '#64748b', fontWeight: 600 }}>사건 발생 시점</div>
              <div className="time-val">{model.eventTimeSeconds.toFixed(3)} s</div>
            </div>
          </div>
        </div>
      </section>

      {/* 6 & 7. 사건 시점 차량 상태 & 전체 흐름 */}
      <div className="p1-two-col-grid">
        {/* 6. 사건 시점 차량 상태 */}
        <section className="info-card">
          <div className="info-card-header">
            <h2 className="info-card-title">
              <span>🚗</span>
              <span>사건 시점 차량 상태</span>
            </h2>
            {onOpenStateModal && (
              <button
                type="button"
                className="timeline-btn"
                onClick={onOpenStateModal}
                style={{ fontSize: '11px', padding: '4px 8px' }}
              >
                전체 상태 보기 →
              </button>
            )}
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 10px 0' }}>
            사건 발생 시점({model.eventTimeSeconds.toFixed(3)} s)의 주요 차량 상태입니다.
          </p>

          <div className="vehicle-state-grid">
            {model.relevantContextSignals.map((sig) => (
              <div key={sig.key} className="vehicle-state-card">
                <span className="vehicle-state-label">{sig.label}</span>
                <span className="vehicle-state-val">
                  {sig.value} {sig.unit ? <small style={{ fontSize: '11px', color: '#64748b' }}>{sig.unit}</small> : null}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* 7. 상위 레벨 전체 흐름 */}
        <section className="info-card">
          <div className="info-card-header">
            <h2 className="info-card-title">
              <span>⚡</span>
              <span>입력 → 기능 처리 → 차량 거동</span>
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
            운전자의 요구가 차량 내부 기능을 거쳐 차량 거동으로 이어지는 전체 흐름입니다.
          </p>

          <div className="high-level-flow-chain">
            <div className="high-level-node">
              <span className="node-icon">👞</span>
              <b>운전자 / 환경 입력</b>
              <small>Driver Demand</small>
            </div>
            <span className="flow-chain-arrow">→</span>

            <div className="high-level-node highlighted">
              <span className="node-icon">⚙️</span>
              <b>차량 기능 처리</b>
              <small>Vehicle Functions</small>
            </div>
            <span className="flow-chain-arrow">→</span>

            <div className="high-level-node">
              <span className="node-icon">🔋</span>
              <b>액추에이션</b>
              <small>Actuation</small>
            </div>
            <span className="flow-chain-arrow">→</span>

            <div className="high-level-node">
              <span className="node-icon">🚗</span>
              <b>차량 거동</b>
              <small>Vehicle Dynamics</small>
            </div>
          </div>

          <div
            style={{
              background: '#f8fafc',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '10px 12px',
              marginTop: '12px',
              fontSize: '12px',
              color: '#475569',
              textAlign: 'center'
            }}
          >
            차량 기능 처리 영역은 여러 SW 기능으로 구성되어 있습니다. 다음 단계(원인 추적)에서 각 기능의 신호와 동작을 자세히 확인할 수 있습니다.
          </div>
        </section>
      </div>

      {/* 8 & 9. 입력 신호 및 차량 반응 스냅샷 테이블 */}
      <div className="p1-two-col-grid">
        {/* 8. 입력 신호 (사건 시점) */}
        <section className="info-card">
          <div className="info-card-header">
            <h2 className="info-card-title">
              <span>🕹️</span>
              <span>입력 신호 (사건 시점)</span>
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
            사건 발생 시점의 주요 운전자/환경 입력 신호입니다.
          </p>

          <table className="signal-preview-table">
            <thead>
              <tr>
                <th>신호명</th>
                <th>값</th>
                <th>단위</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {model.inputSignalsSnapshot.map((row) => (
                <tr key={row.name}>
                  <td><code>{row.name}</code></td>
                  <td className="val-col">{row.currentValue}</td>
                  <td>{row.unit}</td>
                  <td>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>

        {/* 9. 차량 반응 (사건 시점) */}
        <section className="info-card">
          <div className="info-card-header">
            <h2 className="info-card-title">
              <span>💡</span>
              <span>차량 반응 (사건 시점)</span>
            </h2>
          </div>
          <p style={{ fontSize: '12px', color: '#64748b', margin: '0 0 8px 0' }}>
            사건 발생 시점의 차량 거동 관련 출력 신호입니다.
          </p>

          <table className="signal-preview-table">
            <thead>
              <tr>
                <th>신호명</th>
                <th>값</th>
                <th>단위</th>
                <th>설명</th>
              </tr>
            </thead>
            <tbody>
              {model.outputSignalsSnapshot.map((row) => (
                <tr key={row.name} className={row.hasDifference ? 'difference-row' : ''}>
                  <td>
                    {row.hasDifference && <span style={{ marginRight: '4px' }}>⚠️</span>}
                    <code>{row.name}</code>
                  </td>
                  <td className="val-col">{row.currentValue}</td>
                  <td>{row.unit}</td>
                  <td>{row.description}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      </div>

      {/* 10. 다음 조사 안내 & CTA */}
      <section className="p1-cta-bar">
        <div className="p1-cta-msg">
          <span style={{ fontSize: '24px' }}>💬</span>
          <div>
            <div><b>정상 주행에서는 같은 입력에 차량이 어떻게 반응했을까요?</b></div>
            <div style={{ fontSize: '12px', color: '#15803d', fontWeight: 'normal' }}>
              정상 기록과 현재 기록을 비교해 <b>처음 차이가 나타나는 위치</b>를 찾아보세요.
            </div>
          </div>
        </div>

        <button
          type="button"
          className="p1-cta-btn"
          onClick={onStartTracking}
        >
          원인 추적 시작 →
        </button>
      </section>
    </div>
  )
}
