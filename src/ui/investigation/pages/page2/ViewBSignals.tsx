import { useState, useMemo } from 'react'
import type { IncidentFrame } from '../../../../runtime/case/PropulsionCase'
import { architectureNode, getInputSignals, getOutputSignals, getSignalObservation } from '../../../../registries/investigation/Architecture'

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
  desc?: string
  producer?: string
  consumer?: string
  nodeIndex: number
}

const formatVal = (v: unknown): string => {
  if (v === null || v === undefined) return '—'
  if (typeof v === 'number') return v.toFixed(3)
  return String(v)
}

export function ViewBSignals({
  selectedComponent,
  selectedSignal,
  onSelectSignal,
  currentFrame,
  frames,
  onSelectFrameIndex,
  onSaveAsEvidence,
  onNavigateToStandards,
  onNavigateToInterfaces
}: ViewBSignalsProps) {
  const [signalTab, setSignalTab] = useState<'OUTPUT' | 'INPUT'>('OUTPUT')
  const node = architectureNode(selectedComponent)

  // Compute input and output comparisons based on actual frame data and ground truth
  const comparisonData = useMemo(() => {
    if (!currentFrame) {
      return { inputs: [], outputs: [] }
    }

    const inputs: SignalComparisonItem[] = []
    const outputs: SignalComparisonItem[] = []

    getInputSignals(selectedComponent).forEach((signal) => {
      const sig=signal.id
      const unit=signal.unit ?? '—'
      const observation=getSignalObservation(sig,currentFrame)
      const actualVal=observation.actual.value
      const currentStr = formatVal(actualVal)
      const expected=observation.expected?.value
      const normalStr=expected===undefined?currentStr:formatVal(expected)
      const isDiff=typeof actualVal==='number'&&typeof expected==='number'&&Math.abs(actualVal-expected)>1e-4
      const diffStr=isDiff?`차이 (${(actualVal-expected).toFixed(3)})`:'일치'

      inputs.push({
        name: sig,
        normal: normalStr,
        current: currentStr,
        unit,
        diff: diffStr,
        isDiff,
        desc: `${sig} 입력 신호`,
        producer: signal.producerIds.map(id => architectureNode(id)?.label ?? id).join(', ') || '—',
        consumer: node.label,
        nodeIndex: 0
      })
    })

    // Helper for output signals
    getOutputSignals(selectedComponent).forEach((signal) => {
      const sig=signal.id
      const unit=signal.unit ?? '—'
      const observation=getSignalObservation(sig,currentFrame)
      const actualVal=observation.actual.value
      const currentStr = formatVal(actualVal)
      const expVal = observation.expected?.value

      let normalStr = '—'
      let diffStr = '일치'
      let isDiff = false

      if (expVal !== null && expVal !== undefined) {
        normalStr = formatVal(expVal)
        if (typeof actualVal === 'number' && typeof expVal === 'number') {
          const delta = actualVal - expVal
          if (Math.abs(delta) > 1e-4) {
            diffStr = delta > 0 ? `▲ ${delta.toFixed(3)}` : `▼ ${Math.abs(delta).toFixed(3)}`
            isDiff = true
          }
        }
      } else {
        normalStr = currentStr
      }

      outputs.push({
        name: sig,
        normal: normalStr,
        current: currentStr,
        unit,
        diff: isDiff ? diffStr : '일치',
        isDiff,
        desc: `${node.label}에서 출력되는 ${sig} 제어 명령 신호`,
        producer: node.label,
        consumer: signal.consumerIds.map(id => architectureNode(id)?.label ?? id).join(', ') || '—',
        nodeIndex: 0
      })
    })

    return { inputs, outputs }
  }, [currentFrame, node, selectedComponent])

  // Active signal detail
  const activeDetail = useMemo(() => {
    const all = [...comparisonData.outputs, ...comparisonData.inputs]
    return all.find((s) => s.name === selectedSignal) ?? comparisonData.outputs[0] ?? comparisonData.inputs[0]
  }, [comparisonData, selectedSignal])

  // Chart computation from canonical incident/oracle accessors. No recorded reference series exists.
  const chartData = useMemo(() => {
    if (!frames.length || !currentFrame) return null

    const series = frames.map((f,i) => {
      const v = getSignalObservation(activeDetail?.name ?? selectedSignal,f,frames[i-1]).actual.value
      return typeof v === 'number' ? v : 0
    })

    const normal = frames.map((f,i) => {
      const value=getSignalObservation(activeDetail?.name ?? selectedSignal,f,frames[i-1]).expected?.value
      return typeof value==='number'?value:null
    })
    const maxVal = Math.max(1, ...series, ...normal.map((v) => v ?? 0))

    const width = 640
    const height = 130
    const padX = 24
    const padY = 20

    const xPos = (i: number) => padX + (i / Math.max(1, frames.length - 1)) * (width - padX * 2)
    const yPos = (v: number) => height - padY - (v / maxVal) * (height - padY * 2)

    const actualPoints = series.map((v, i) => `${xPos(i).toFixed(1)},${yPos(v).toFixed(1)}`).join(' ')
    const hasNormal = normal.some((v) => v !== null)
    const normalPoints = hasNormal
      ? normal.map((v, i) => `${xPos(i).toFixed(1)},${yPos(v ?? 0).toFixed(1)}`).join(' ')
      : null

    const selectedIdx = frames.findIndex((f) => f.id === currentFrame.id)
    const mismatchIdx = frames.findIndex(
      (_, i) => normal[i] !== null && series[i] !== undefined && Math.abs((series[i] ?? 0) - (normal[i] ?? 0)) > 1e-4
    )

    return {
      width,
      height,
      actualPoints,
      normalPoints,
      hasNormal,
      maxVal,
      selectedIdx: selectedIdx >= 0 ? selectedIdx : 0,
      selectedX: xPos(selectedIdx >= 0 ? selectedIdx : 0),
      selectedTime: frames[selectedIdx >= 0 ? selectedIdx : 0]?.sw.executionTime ?? 0,
      mismatchIdx,
      mismatchX: mismatchIdx >= 0 ? xPos(mismatchIdx) : -1,
      mismatchTime: mismatchIdx >= 0 ? frames[mismatchIdx]?.sw.executionTime ?? 0 : 0
    }
  }, [frames, currentFrame, activeDetail, selectedSignal])

  const activeRows = signalTab === 'OUTPUT' ? comparisonData.outputs : comparisonData.inputs

  return (
    <div className="view-b-layout">
      {/* LEFT COLUMN: Tables + Chart */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', minWidth: 0 }}>
        {/* 입력 / 출력 신호 탭 선택 및 테이블 */}
        <section className="info-card">
          <div className="info-card-header" style={{ flexWrap: 'wrap', gap: '8px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <button
                type="button"
                className={`view-subtab-btn ${signalTab === 'OUTPUT' ? 'active' : ''}`}
                onClick={() => setSignalTab('OUTPUT')}
                style={{ fontSize: '11px', padding: '4px 12px' }}
              >
                📤 출력 신호 ({comparisonData.outputs.length})
              </button>
              <button
                type="button"
                className={`view-subtab-btn ${signalTab === 'INPUT' ? 'active' : ''}`}
                onClick={() => setSignalTab('INPUT')}
                style={{ fontSize: '11px', padding: '4px 12px' }}
              >
                📥 입력 신호 ({comparisonData.inputs.length})
              </button>
            </div>
            <small style={{ color: '#64748b' }}>
              신호를 클릭하여 시계열 추이 및 세부 사항을 확인하세요
            </small>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table className="signal-preview-table" style={{ width: '100%' }}>
              <thead>
                <tr>
                  <th style={{ width: '40%' }}>신호명</th>
                  <th style={{ width: '20%' }}>이번 주행</th>
                  <th style={{ width: '20%' }}>정상 기대</th>
                  <th style={{ width: '20%' }}>상태</th>
                </tr>
              </thead>
              <tbody>
                {activeRows.map((row) => {
                  const isSelected = selectedSignal === row.name || activeDetail?.name === row.name
                  return (
                    <tr
                      key={row.name}
                      onClick={() => onSelectSignal(row.name)}
                      className={row.isDiff ? 'difference-row' : ''}
                      style={{
                        cursor: 'pointer',
                        background: isSelected ? '#eff6ff' : undefined,
                        borderLeft: isSelected ? '3px solid #3b82f6' : undefined
                      }}
                    >
                      <td>
                        {row.isDiff && <span style={{ marginRight: '4px' }}>⚠️</span>}
                        <code>{row.name}</code>
                        {row.unit !== '—' && (
                          <small style={{ color: '#64748b', marginLeft: '4px' }}>({row.unit})</small>
                        )}
                      </td>
                      <td className="val-col" style={{ fontWeight: 600 }}>{row.current}</td>
                      <td className="val-col" style={{ color: '#2563eb' }}>{row.normal}</td>
                      <td>
                        {row.isDiff ? (
                          <span className="status-badge-pill badge-diff">{row.diff}</span>
                        ) : (
                          <span className="status-badge-pill badge-nodiff">정상 일치</span>
                        )}
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>

        {/* 신호 시계열 그래프 카드 */}
        <section className="signal-chart-card">
          <div className="chart-header">
            <div>
              <b style={{ fontSize: '13px', color: '#1e293b' }}>
                시간에 따른 동일 신호 비교 · <code>{activeDetail?.name ?? selectedSignal}</code>
              </b>
              {activeDetail?.unit && activeDetail.unit !== '—' && (
                <small style={{ color: '#64748b', marginLeft: '6px' }}>({activeDetail.unit})</small>
              )}
            </div>

            <div className="chart-legend-row">
              <span style={{ color: '#25856d' }}>┄ 정상 기대 (동일 입력)</span>
              <span style={{ color: '#bd683d' }}>━ 이번 주행</span>
              {chartData?.mismatchIdx !== undefined && chartData.mismatchIdx >= 0 && (
                <span style={{ color: '#a84664' }}>▽ 첫 불일치 ({chartData.mismatchTime.toFixed(2)}s)</span>
              )}
            </div>
          </div>

          {/* SVG Line Chart */}
          {chartData && (
            <div className="chart-svg-container" style={{ padding: '8px 4px' }}>
              <svg viewBox={`0 0 ${chartData.width} ${chartData.height}`} style={{ width: '100%', height: '120px' }}>
                {/* Horizontal reference lines */}
                <line x1="20" y1="20" x2={chartData.width - 20} y2="20" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="20" y1="65" x2={chartData.width - 20} y2="65" stroke="#e2e8f0" strokeDasharray="3 3" />
                <line x1="20" y1="110" x2={chartData.width - 20} y2="110" stroke="#cbd5e1" />

                {/* Normal Polyline */}
                {chartData.hasNormal && chartData.normalPoints && (
                  <polyline
                    points={chartData.normalPoints}
                    fill="none"
                    stroke="#25856d"
                    strokeWidth="2.5"
                    strokeDasharray="6 3"
                  />
                )}

                {/* Actual Polyline */}
                <polyline
                  points={chartData.actualPoints}
                  fill="none"
                  stroke="#bd683d"
                  strokeWidth="2.5"
                />

                {/* Mismatch Line */}
                {chartData.mismatchIdx >= 0 && (
                  <g>
                    <line
                      x1={chartData.mismatchX}
                      y1="18"
                      x2={chartData.mismatchX}
                      y2="110"
                      stroke="#a84664"
                      strokeDasharray="3 3"
                      strokeWidth="1.5"
                    />
                    <text x={chartData.mismatchX} y="14" fill="#a84664" fontSize="10" fontWeight="bold" textAnchor="middle">
                      ▽
                    </text>
                  </g>
                )}

                {/* Selected Time Marker */}
                <line
                  x1={chartData.selectedX}
                  y1="18"
                  x2={chartData.selectedX}
                  y2="110"
                  stroke="#1e3a5f"
                  strokeWidth="2"
                />
                <text x={chartData.selectedX} y="12" fill="#1e3a5f" fontSize="10" fontWeight="bold" textAnchor="middle">
                  ▼
                </text>
              </svg>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '6px', fontSize: '11px', color: '#64748b' }}>
                <span>▼ 선택 시점: <b>{chartData.selectedTime.toFixed(2)}s</b></span>
                {chartData.mismatchIdx >= 0 ? (
                  <button
                    type="button"
                    className="timeline-btn"
                    onClick={() => onSelectFrameIndex(chartData.mismatchIdx)}
                    style={{ fontSize: '11px', padding: '2px 8px', color: '#a84664' }}
                  >
                    ▽ 첫 불일치 시점 ({chartData.mismatchTime.toFixed(2)}s)으로 이동
                  </button>
                ) : (
                  <span>{chartData.hasNormal ? '이 신호에서 불일치 없음' : '자동 판정 대상 아님'}</span>
                )}
              </div>
            </div>
          )}
        </section>
      </div>

      {/* RIGHT COLUMN: Signal Detail & Tracing */}
      <div style={{ minWidth: 0 }}>
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
            <span style={{ color: '#64748b' }}>현재 관측값</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: activeDetail?.isDiff ? '#dc2626' : '#111827' }}>
              {activeDetail?.current} {activeDetail?.unit !== '—' ? activeDetail?.unit : ''}
            </span>

            <span style={{ color: '#64748b' }}>정상 기대값</span>
            <span style={{ fontWeight: 700, fontFamily: 'monospace', color: '#25856d' }}>
              {activeDetail?.normal} {activeDetail?.unit !== '—' ? activeDetail?.unit : ''}
            </span>

            <span style={{ color: '#64748b' }}>상태 판정</span>
            <span>
              {activeDetail?.isDiff ? (
                <b style={{ color: '#dc2626' }}>{activeDetail?.diff}</b>
              ) : (
                <span style={{ color: '#16a34a', fontWeight: 600 }}>정상 일치</span>
              )}
            </span>
          </div>

          {/* 신호 추적 (Producer / Consumer) */}
          <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '12px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
            <b style={{ fontSize: '12px', color: '#334155' }}>신호 흐름 추적</b>

            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
              <div style={{ color: '#64748b' }}>생성 위치 (Producer)</div>
              <b style={{ color: '#1e293b', marginTop: '2px', display: 'block' }}>→ {activeDetail?.producer}</b>
            </div>

            <div style={{ background: '#f8fafc', padding: '8px 10px', borderRadius: '6px', border: '1px solid #e2e8f0', fontSize: '11px' }}>
              <div style={{ color: '#64748b' }}>전달 위치 (Consumer)</div>
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
                🔗 인터페이스 정보
              </button>
            </div>
          </div>
        </section>
      </div>
    </div>
  )
}
