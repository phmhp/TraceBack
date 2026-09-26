import type { InvestigationPresentationModel } from '../presentation/InvestigationPresentationModel'

interface Page1Props {
  model: InvestigationPresentationModel
  onStartTracking: () => void
  onOpenStateModal?: () => void
}

function SignalTable({ rows }: { rows: InvestigationPresentationModel['inputSignalsSnapshot'] }) {
  return (
    <div className="fault-report-table-wrap">
      <table className="fault-report-table">
        <colgroup><col /><col className="value-column" /><col className="unit-column" /><col /></colgroup>
        <thead><tr><th>신호</th><th>값</th><th>단위</th><th>설명</th></tr></thead>
        <tbody>
          {rows.map(row => (
            <tr key={row.name}>
              <td><code className="investigation-tech-id">{row.name}</code></td>
              <td className="investigation-number">{row.currentValue}</td>
              <td>{row.unit}</td>
              <td className="investigation-prose">{row.description}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

export function Page1Phenomenon({ model, onStartTracking, onOpenStateModal }: Page1Props) {
  return (
    <main className="investigation-main-content fault-report-desk">
      <article className="fault-report" aria-labelledby="fault-report-title">
        <header className="fault-report-header">
          <div>
            <p className="investigation-page-title">현상 파악 · FAULT REPORT</p>
            <h1 id="fault-report-title">고장 현상 기록</h1>
            <p className="fault-report-case-title investigation-prose">{model.caseTitle}</p>
          </div>
          <dl className="fault-report-meta">
            <div><dt>CASE</dt><dd><code className="investigation-tech-id">{model.caseId}</code></dd></div>
            <div><dt>고장 시점</dt><dd className="investigation-number">{model.eventTimeSeconds.toFixed(3)} s</dd></div>
            <div><dt>기록 상태</dt><dd>조사 중</dd></div>
          </dl>
        </header>

        <section className="fault-report-lead" aria-labelledby="phenomenon-heading">
          <p className="investigation-section-label">01 · REPORTED PHENOMENON</p>
          <h2 id="phenomenon-heading">{model.symptomName}</h2>
          <p className="investigation-prose fault-report-description">{model.symptomSummary}</p>
        </section>

        <section className="driver-testimony" aria-labelledby="driver-statement-heading">
          <div className="driver-placeholder" aria-hidden="true"><span>운전자</span></div>
          <div>
            <p id="driver-statement-heading" className="investigation-section-label">DRIVER STATEMENT</p>
            <blockquote>“{model.driverQuote}”</blockquote>
            <p className="investigation-annotation">운전자 진술 원문 · 원인 판단 전 기록</p>
          </div>
        </section>

        <section className="fault-report-section" aria-labelledby="condition-heading">
          <div className="fault-report-section-heading">
            <div><p className="investigation-section-label">02 · OPERATING CONDITION</p><h2 id="condition-heading">고장 시점 운행 조건</h2></div>
            {onOpenStateModal && <button type="button" className="report-text-button" onClick={onOpenStateModal}>전체 상태 보기 →</button>}
          </div>
          <dl className="operating-condition-grid">
            {model.relevantContextSignals.map(signal => (
              <div key={signal.key}>
                <dt><code className="investigation-tech-id">{signal.label}</code></dt>
                <dd className="investigation-number">{signal.value}{signal.unit ? <small> {signal.unit}</small> : null}</dd>
                {(signal.description || signal.relatedFunctions) && <details className="condition-help">
                  <summary aria-label={`${signal.label} 설명 보기`}>?</summary>
                  {signal.description&&<p>{signal.description}</p>}
                  {signal.relatedFunctions&&<small>관련 기능 · {signal.relatedFunctions}</small>}
                </details>}
              </div>
            ))}
          </dl>
        </section>

        <figure className="report-semantics-flow" aria-label="입력과 운행 조건, 차량 반응의 관계">
          <div><span>INPUT</span><b>운전자 / 시스템 입력</b></div>
          <strong aria-hidden="true">+</strong>
          <div><span>SHARED STATE</span><b>운행 조건</b></div>
          <i aria-hidden="true">↓</i>
          <div><span>PROCESS</span><b>차량 기능 처리</b></div>
          <i aria-hidden="true">↓</i>
          <div><span>OUTPUT</span><b>차량 반응</b></div>
        </figure>

        <section className="fault-report-section" aria-labelledby="input-heading">
          <p className="investigation-section-label">03 · DRIVER / SYSTEM INPUT</p>
          <h2 id="input-heading">운전자 및 시스템 입력</h2>
          <p className="investigation-annotation">고장 시점에 기록된 입력 신호입니다.</p>
          <SignalTable rows={model.inputSignalsSnapshot} />
        </section>

        <section className="fault-report-section" aria-labelledby="response-heading">
          <p className="investigation-section-label">04 · VEHICLE RESPONSE</p>
          <h2 id="response-heading">차량 반응</h2>
          <p className="investigation-annotation">고장 시점에 기록된 차량 거동 신호입니다.</p>
          <SignalTable rows={model.outputSignalsSnapshot} />
        </section>

        <figure className="investigation-scope-strip" aria-label="조사 범위 개요">
          <figcaption>조사 범위</figcaption>
          <span>입력</span><i aria-hidden="true">→</i><span>차량 기능</span><i aria-hidden="true">→</i><span>차량 반응</span>
        </figure>

        <aside className="investigation-note">
          <span className="investigation-note-mark" aria-hidden="true">?</span>
          <div><p className="investigation-section-label">INVESTIGATION QUESTION</p><p>입력과 차량 반응 사이에서 어떤 기능부터 확인해야 할까요?</p></div>
        </aside>

        <footer className="fault-report-footer">
          <p className="investigation-annotation">보고서 검토를 마치면 원인 추적 기록이 시작됩니다.</p>
          <button type="button" className="p1-cta-btn" onClick={onStartTracking}>원인 추적 시작 →</button>
        </footer>
      </article>
    </main>
  )
}
