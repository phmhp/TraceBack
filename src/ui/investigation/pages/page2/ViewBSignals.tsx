import { useMemo } from 'react'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import { architectureNode } from '../../../../registries/investigation/Architecture'
import { inspectBoundary } from '../../../../runtime/investigation/Boundary'

interface ViewBSignalsProps {
  selectedComponent: string
  selectedSignal: string
  onSelectSignal: (sig: string) => void
  currentFrame: IncidentFrame | undefined
  frames: readonly IncidentFrame[]
  onSelectFrameIndex: (idx: number) => void
  onSaveAsEvidence: (signalName: string) => void
  onNavigateToStandards: () => void
  onNavigateToInterfaces: () => void
}

interface SignalComparisonItem {
  name: string
  normal: string
  current: string
  unit: string
  diff: string
  isDiff: boolean
  range?: string
  validity?: string
  period?: string
  desc?: string
  producer?: string
  consumer?: string
}

export function ViewBSignals({
  selectedComponent,
  selectedSignal,
  onSelectSignal,
  currentFrame,
  frames,
  onSaveAsEvidence,
  onNavigateToStandards,
  onNavigateToInterfaces
}: Omit<ViewBSignalsProps, 'onSelectFrameIndex'> & { onSelectFrameIndex?: (idx: number) => void }) {
  const node = architectureNode(selectedComponent)

  // Compute input and output comparisons based on inspectBoundary or runtime data
  const comparisonData = useMemo(() => {
    if (!currentFrame) {
      return { inputs: [], outputs: [] }
    }

    const obs = inspectBoundary(currentFrame, selectedComponent)
    const inputs: SignalComparisonItem[] = []
    const outputs: SignalComparisonItem[] = []

    // Helper for input signals
    node.inputs.forEach((sig) => {
      let val = '—'
      let exp = '—'
      let unit = '-'
      let diff = '-'
      let isDiff = false

      if (sig === 'AcceleratorPedalPosition') {
        val = (currentFrame.sw.input.acceleratorPedalPosition ?? 1).toFixed(3)
        exp = '1.000'
        unit = 'ratio'
      } else if (sig === 'GearState' || sig === 'GearRequest') {
        val = String(currentFrame.sw.output.gearState ?? 'D')
        exp = 'D'
      } else if (sig === 'VehicleReady') {
        val = currentFrame.sw.input.vehicleReady ? 'TRUE' : 'FALSE'
        exp = 'TRUE'
      } else if (sig === 'PropulsionRequest') {
        val = (currentFrame.sw.output.propulsionRequest.magnitude ?? 1).toFixed(3)
        exp = '1.000'
        unit = 'ratio'
      } else if (sig === 'VehicleSpeed') {
        val = (currentFrame.plant?.speed ?? (currentFrame.sw.input.vehicleSpeed ?? 15.635)).toFixed(3)
        exp = '15.634'
        unit = 'm/s'
      } else {
        const raw = (obs.inputs as Record<string, unknown>)[sig]
        val = raw !== undefined ? String(raw) : '—'
        exp = val
      }

      inputs.push({
        name: sig,
        normal: exp,
        current: val,
        unit,
        diff,
        isDiff,
        range: '0 ~ 1',
        validity: 'VALID',
        period: '10 ms',
        desc: `${sig} 입력 신호`,
        producer: 'Driver Demand / Upstream',
        consumer: node.label
      })
    })

    // Helper for output signals
    node.outputs.forEach((sig) => {
      let val = '—'
      let exp = '—'
      let unit = '-'
      let diff = '-'
      let isDiff = false

      if (sig === 'DriveTorqueRequest' || sig === 'eDriveMagnitude' || sig === 'EDriveCommand') {
        const actualNm = currentFrame.sw.output.eDriveCommand?.magnitudeNm ?? 31.342
        val = actualNm.toFixed(3)
        exp = '62.684'
        unit = 'Nm'
        diff = '▼ 31.342'
        isDiff = true
      } else if (sig === 'eDriveDirection') {
        val = currentFrame.sw.output.eDriveCommand?.direction ?? 'FORWARD'
        exp = 'FORWARD'
      } else if (sig === 'PropulsionState' || sig === 'eDriveState') {
        val = 'ACTIVE'
        exp = 'ACTIVE'
      } else {
        val = 'VALID'
        exp = 'VALID'
      }

      outputs.push({
        name: sig,
        normal: exp,
        current: val,
        unit,
        diff,
        isDiff,
        range: '0 ~ 200',
        validity: 'VALID',
        period: '10 ms',
        desc: `${node.label}에서 출력되는 ${sig} 제어 명령 신호`,
        producer: node.label,
        consumer: 'Downstream / Actuation'
      })
    })

    return { inputs, outputs }
  }, [currentFrame, selectedComponent, node])

  // Active signal detail
  const activeDetail = useMemo(() => {
    const all = [...comparisonData.outputs, ...comparisonData.inputs]
    return all.find((s) => s.name === selectedSignal) ?? comparisonData.outputs[0] ?? comparisonData.inputs[0]
  }, [comparisonData, selectedSignal])

  // Chart computation
  const chartData = useMemo(() => {
    if (!frames.length) return null
    const eventIdx = frames.length - 1
    const eventTime = frames[eventIdx]?.sw.executionTime ?? 24.783
    const divergenceIdx = Math.floor(frames.length * 0.6) // First divergence sample
    const divergenceTime = frames[divergenceIdx]?.sw.executionTime ?? 22.410

    // Construct curve points
    const width = 640
    const height = 140
    const padding = 20

    // Simulate normal curve vs current curve
    const normalPoints: string[] = []
    const currentPoints: string[] = []

    frames.forEach((_, idx) => {
      const x = padding + (idx / Math.max(1, frames.length - 1)) * (width - padding * 2)
      // Normal rises from ~30 to ~80
      const normalY = height - padding - Math.min(100, 30 + (idx / frames.length) * 50)
      // Current drops after divergence
      const curY = idx < divergenceIdx
        ? normalY
        : height - padding - Math.min(100, 30 + (divergenceIdx / frames.length) * 50 * 0.5)

      normalPoints.push(`${x.toFixed(1)},${normalY.toFixed(1)}`)
      currentPoints.push(`${x.toFixed(1)},${curY.toFixed(1)}`)
    })

    const eventX = padding + (eventIdx / Math.max(1, frames.length - 1)) * (width - padding * 2)
    const divergenceX = padding + (divergenceIdx / Math.max(1, frames.length - 1)) * (width - padding * 2)

    return {
      normalPoly: normalPoints.join(' '),
      currentPoly: currentPoints.join(' '),
      eventX,
      eventTime,
      divergenceX,
      divergenceTime,
      width,
      height
    }
  }, [frames])

  return (
    <div className="view-b-layout">
      {/* LEFT COLUMN: Tables + Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {/* 입력 / 출력 신호 테이블 2열 그리드 */}
        <div className="view-b-tables-grid">
          {/* 입력 신호 테이블 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>📥</span>
                <span>입력 신호 ({comparisonData.inputs.length}개)</span>
              </h3>
            </div>

            <table className="signal-preview-table">
              <thead>
                <tr>
                  <th>신호명</th>
                  <th>정상</th>
                  <th>현재</th>
                  <th>단위</th>
                  <th>차이</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.inputs.map((row) => (
                  <tr
                    key={row.name}
                    onClick={() => onSelectSignal(row.name)}
                    style={{ cursor: 'pointer', background: selectedSignal === row.name ? '#eff6ff' : undefined }}
                  >
                    <td><code>{row.name}</code></td>
                    <td className="val-col">{row.normal}</td>
                    <td className="val-col">{row.current}</td>
                    <td>{row.unit}</td>
                    <td>{row.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>

          {/* 출력 신호 테이블 */}
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>📤</span>
                <span>출력 신호 ({comparisonData.outputs.length}개)</span>
              </h3>
            </div>

            <table className="signal-preview-table">
              <thead>
                <tr>
                  <th>신호명</th>
                  <th>정상</th>
                  <th>현재</th>
                  <th>단위</th>
                  <th>차이</th>
                </tr>
              </thead>
              <tbody>
                {comparisonData.outputs.map((row) => (
                  <tr
                    key={row.name}
                    onClick={() => onSelectSignal(row.name)}
                    className={row.isDiff ? 'difference-row' : ''}
                    style={{
                      cursor: 'pointer',
                      borderLeft: selectedSignal === row.name ? '3px solid #3b82f6' : undefined
                    }}
                  >
                    <td>
                      {row.isDiff && <span style={{ marginRight: '4px' }}>⚠️</span>}
                      <code>{row.name}</code>
                    </td>
                    <td className="val-col">{row.normal}</td>
                    <td className="val-col">{row.current}</td>
                    <td>{row.unit}</td>
                    <td style={{ color: row.isDiff ? '#dc2626' : undefined, fontWeight: 700 }}>{row.diff}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </section>
        </div>

        {/* 신호 시계열 그래프 카드 */}
        <section className="signal-chart-card">
          <div className="chart-header">
            <div>
              <b style={{ fontSize: '13px', color: '#1e293b' }}>
                신호 시계열 그래프 · <code>{activeDetail?.name ?? selectedSignal}</code>
              </b>
              <small style={{ color: '#64748b', marginLeft: '6px' }}>({activeDetail?.unit ?? 'Nm'})</small>
            </div>

            <div className="chart-legend-row">
              <span style={{ color: '#2563eb' }}>● 정상 기록</span>
              <span style={{ color: '#dc2626' }}>● 현재 기록</span>
              <span style={{ color: '#eab308' }}>┄ 차이 발생 (22.41s)</span>
              <span style={{ color: '#ef4444' }}>┄ 사건 시점 (24.78s)</span>
            </div>
          </div>

          {/* SVG Line Chart */}
          {chartData && (
            <div className="chart-svg-container">
              <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} style={{ width: '100%', height: '100%' }}>
                {/* Horizontal reference grid lines */}
                <line x1="20" y1="30" x2={chartData.width - 20} y2="30" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="20" y1="70" x2={chartData.width - 20} y2="70" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="20" y1="110" x2={chartData.width - 20} y2="110" stroke="#e2e8f0" strokeDasharray="3 3" />

                {/* Normal Polyline (Blue) */}
                <polyline
                  points={chartData.normalPoly}
                  fill="none"
                  stroke="#3b82f6"
                  strokeWidth="2.5"
                />

                {/* Current Polyline (Red) */}
                <polyline
                  points={chartData.currentPoly}
                  fill="none"
                  stroke="#ef4444"
                  strokeWidth="2.5"
                />

                {/* First Divergence Line (Yellow) */}
                <line
                  x1={chartData.divergenceX}
                  y1="15"
                  x2={chartData.divergenceX}
                  y2={chartData.height - 15}
                  stroke="#eab308"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <circle cx={chartData.divergenceX} cy="65" r="3.5" fill="#eab308" />
                <text x={chartData.divergenceX} y="12" fill="#ca8a04" fontSize="9" fontWeight="bold" textAnchor="middle">
                  차이 발생 ({chartData.divergenceTime.toFixed(1)}s)
                </text>

                {/* Event Time Line (Red) */}
                <line
                  x1={chartData.eventX}
                  y1="15"
                  x2={chartData.eventX}
                  y2={chartData.height - 15}
                  stroke="#ef4444"
                  strokeWidth="1.5"
                  strokeDasharray="4 3"
                />
                <circle cx={chartData.eventX} cy="92" r="3.5" fill="#ef4444" />
                <text x={chartData.eventX} y="12" fill="#dc2626" fontSize="9" fontWeight="bold" textAnchor="middle">
                  사건 시점 ({chartData.eventTime.toFixed(1)}s)
                </text>
              </svg>
            </div>
          )}
        </section>
      </div>

      {/* RIGHT COLUMN: Signal Detail & Tracing */}
      <div>
        <section className="signal-detail-card">
          <div className="info-card-header">
            <div>
              <small style={{ color: '#64748b', fontWeight: 600 }}>선택 신호 상세 정보</small>
              <h3 className="info-card-title" style={{ marginTop: '2px' }}>
                <code>{activeDetail?.name ?? selectedSignal}</code>
              </h3>
            </div>

            <button
              type="button"
              className="p1-cta-btn"
              onClick={() => onSaveAsEvidence(activeDetail?.name ?? selectedSignal)}
              style={{ padding: '6px 12px', fontSize: '11px' }}
            >
              근거로 저장 +
            </button>
          </div>

          <p style={{ fontSize: '12px', color: '#475569', margin: '0' }}>
            {activeDetail?.desc}
          </p>

          <div style={{ display: 'grid', gridTemplateColumns: '90px 1fr', rowGap: '8px', fontSize: '12px' }}>
            <span style={{ color: '#64748b' }}>현재 값</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: activeDetail?.isDiff ? '#dc2626' : '#111827' }}>
              {activeDetail?.current} {activeDetail?.unit}
            </span>

            <span style={{ color: '#64748b' }}>정상 값</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#2563eb' }}>
              {activeDetail?.normal} {activeDetail?.unit}
            </span>

            <span style={{ color: '#64748b' }}>정상 범위</span>
            <span>{activeDetail?.range}</span>

            <span style={{ color: '#64748b' }}>유효성</span>
            <span style={{ color: '#16a34a', fontWeight: 600 }}>{activeDetail?.validity}</span>

            <span style={{ color: '#64748b' }}>업데이트 주기</span>
            <span>{activeDetail?.period}</span>
          </div>

          {/* 신호 추적 (Producer / Consumer) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <b style={{ fontSize: '12px', color: '#334155' }}>신호 추적</b>

            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
              <div style={{ color: '#64748b' }}>이 신호는 어디서 만들어졌나요? (Producer)</div>
              <b style={{ color: '#1e293b', marginTop: '2px', display: 'block' }}>→ {activeDetail?.producer}</b>
            </div>

            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
              <div style={{ color: '#64748b' }}>이 신호는 어디에 사용되나요? (Consumer)</div>
              <b style={{ color: '#1e293b', marginTop: '2px', display: 'block' }}>→ {activeDetail?.consumer}</b>
            </div>
          </div>

          {/* 관련 정보 바로가기 */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
            <b style={{ fontSize: '12px', color: '#334155' }}>관련 정보 바로가기</b>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
              <button
                type="button"
                className="timeline-btn"
                onClick={onNavigateToStandards}
                style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center' }}
              >
                📄 정상 기준 확인
              </button>
              <button
                type="button"
                className="timeline-btn"
                onClick={onNavigateToInterfaces}
                style={{ fontSize: '11px', padding: '6px 8px', justifyContent: 'center' }}
              >
                🔗 인터페이스 정보 보기
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
