import { useState, useMemo } from 'react'
import { propulsionRequirements, propulsionTests } from '../../../../data/ground-truth/PropulsionGroundTruth'
import { architectureNode } from '../../../../registries/investigation/Architecture'

interface ViewDStandardsProps {
  selectedComponent: string
  selectedRequirementId: string
  onSelectRequirement: (id: string) => void
  onSaveAsEvidence: (reqId: string) => void
  onOpenBenchWithTc?: (tcId: string) => void
}

export function ViewDStandards({
  selectedComponent,
  selectedRequirementId,
  onSelectRequirement,
  onSaveAsEvidence,
  onOpenBenchWithTc
}: ViewDStandardsProps) {
  const [subTab, setSubTab] = useState<'RAW' | 'FORMAL' | 'FLOW' | 'TRACE'>('RAW')
  const [filterComponent, setFilterComponent] = useState<string>(selectedComponent)

  // Filtered requirements list
  const filteredList = useMemo(() => {
    return propulsionRequirements.filter((r) => {
      if (filterComponent === 'ALL') return true
      return r.allocatedComponent === filterComponent
    })
  }, [filterComponent])

  const activeReq = useMemo(() => {
    return (
      propulsionRequirements.find((r) => r.id === selectedRequirementId) ??
      filteredList[0] ??
      propulsionRequirements[0]!
    )
  }, [selectedRequirementId, filteredList])

  const relatedTc = useMemo(() => {
    return propulsionTests.find((t) => activeReq.linkedTestCases.includes(t.id))
  }, [activeReq])

  return (
    <div className="view-d-layout">
      {/* 1열: 관련 요구사항 목록 */}
      <section className="info-card">
        <div className="info-card-header">
          <h3 className="info-card-title">
            <span>📄</span>
            <span>관련 요구사항 목록 ({filteredList.length})</span>
          </h3>
        </div>

        {/* 필터 바 */}
        <div className="req-filter-bar">
          <small style={{ fontSize: '11px', color: '#64748b' }}>Function:</small>
          <select
            className="component-select"
            value={filterComponent}
            onChange={(e) => setFilterComponent(e.target.value)}
            style={{ fontSize: '11px', padding: '3px 8px' }}
          >
            <option value="ALL">전체 보기</option>
            <option value="PropulsionFunction">PropulsionFunction</option>
            <option value="GearLogic">GearLogic</option>
            <option value="VMC">VMC</option>
            <option value="eDrive">eDrive</option>
            <option value="VehiclePhysics">VehicleDynamics</option>
          </select>
        </div>

        <div className="req-list-group">
          {filteredList.map((req) => (
            <div
              key={req.id}
              className={`req-card-item ${req.id === activeReq.id ? 'selected' : ''}`}
              onClick={() => onSelectRequirement(req.id)}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <b style={{ fontSize: '12px', color: '#1e293b', fontFamily: 'monospace' }}>{req.id}</b>
                <span className="sidebar-badge badge-active">{req.level === 'SOFTWARE' ? 'Software' : 'System'}</span>
              </div>
              <div style={{ fontSize: '11px', color: '#475569', lineHeight: 1.3 }}>
                {req.statement.slice(0, 50)}...
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* 2열: 요구사항 상세 */}
      <section className="info-card">
        <div className="info-card-header">
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <h3 className="info-card-title" style={{ fontFamily: 'monospace' }}>
                {activeReq.id}
              </h3>
              <span className="sidebar-badge badge-active">
                {activeReq.level === 'SOFTWARE' ? 'Software Requirement' : 'System Requirement'}
              </span>
            </div>
          </div>

          <button
            type="button"
            className="p1-cta-btn"
            onClick={() => onSaveAsEvidence(activeReq.id)}
            style={{ padding: '6px 12px', fontSize: '11px' }}
          >
            근거로 저장 +
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '100px 1fr', rowGap: '6px', fontSize: '12px', margin: '8px 0 14px 0' }}>
          <span style={{ color: '#64748b' }}>적용 대상</span>
          <b>{architectureNode(activeReq.allocatedComponent).label}</b>

          <span style={{ color: '#64748b' }}>관련 신호</span>
          <span><code>PropulsionRequest</code>, <code>eDriveCommand</code></span>

          <span style={{ color: '#64748b' }}>상위 요구사항</span>
          <span style={{ fontFamily: 'monospace' }}>{activeReq.linkedRequirements[0] ?? 'SYSR-PROP-009'}</span>

          <span style={{ color: '#64748b' }}>관련 시험</span>
          <span style={{ fontFamily: 'monospace' }}>{activeReq.linkedTestCases.join(', ') || 'TC-PROP-NORMAL-009'}</span>
        </div>

        {/* 서브 탭: 원문 / 정형 조건 / 흐름 / Trace */}
        <div className="view-subtabs-bar" style={{ marginBottom: '12px' }}>
          <button
            type="button"
            className={`view-subtab-btn ${subTab === 'RAW' ? 'active' : ''}`}
            onClick={() => setSubTab('RAW')}
            style={{ fontSize: '11px', padding: '4px 12px' }}
          >
            원문
          </button>
          <button
            type="button"
            className={`view-subtab-btn ${subTab === 'FORMAL' ? 'active' : ''}`}
            onClick={() => setSubTab('FORMAL')}
            style={{ fontSize: '11px', padding: '4px 12px' }}
          >
            정형 조건
          </button>
          <button
            type="button"
            className={`view-subtab-btn ${subTab === 'FLOW' ? 'active' : ''}`}
            onClick={() => setSubTab('FLOW')}
            style={{ fontSize: '11px', padding: '4px 12px' }}
          >
            흐름
          </button>
          <button
            type="button"
            className={`view-subtab-btn ${subTab === 'TRACE' ? 'active' : ''}`}
            onClick={() => setSubTab('TRACE')}
            style={{ fontSize: '11px', padding: '4px 12px' }}
          >
            Trace
          </button>
        </div>

        {/* 탭 본문 */}
        <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: '8px', padding: '14px', fontSize: '12px', lineHeight: 1.6, minHeight: '140px' }}>
          {subTab === 'RAW' && (
            <div>
              <b style={{ color: '#1e293b', display: 'block', marginBottom: '6px' }}>원문 (원문서 발췌)</b>
              <p style={{ margin: 0, color: '#334155' }}>{activeReq.statement}</p>
            </div>
          )}

          {subTab === 'FORMAL' && (
            <div>
              <b style={{ color: '#1e293b', display: 'block', marginBottom: '6px' }}>정형 조건 (Formalized)</b>
              <p style={{ margin: '0 0 4px 0', color: '#0369a1' }}><b>WHEN:</b></p>
              <ul style={{ margin: '0 0 8px 16px', padding: 0 }}>
                <li>PropulsionRequest &gt;= 0</li>
                <li>Validity == VALID</li>
              </ul>
              <p style={{ margin: '0 0 4px 0', color: '#0369a1' }}><b>THEN:</b></p>
              <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
                <li>eDriveCommand = f(PropulsionRequest, VehicleState)</li>
                <li>보정된 범위 내의 토크가 10ms 이내에 생성되어야 함</li>
              </ul>
            </div>
          )}

          {subTab === 'FLOW' && (
            <div>
              <b style={{ color: '#1e293b', display: 'block', marginBottom: '8px' }}>기능 흐름 (요구사항 관점)</b>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '6px', alignItems: 'center' }}>
                <div className="flow-step-node" style={{ width: '80%', padding: '6px' }}>입력: PropulsionRequest</div>
                <span>↓</span>
                <div className="flow-step-node" style={{ width: '80%', padding: '6px' }}>유효성 확인 및 상태 검사</div>
                <span>↓</span>
                <div className="flow-step-node" style={{ width: '80%', padding: '6px' }}>토크 변환 및 보정 (Calibration)</div>
                <span>↓</span>
                <div className="flow-step-node" style={{ width: '80%', padding: '6px' }}>출력: eDriveCommand</div>
              </div>
            </div>
          )}

          {subTab === 'TRACE' && (
            <div>
              <b style={{ color: '#1e293b', display: 'block', marginBottom: '8px' }}>Trace (관련 요구사항 및 시험)</b>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="flow-step-node" style={{ padding: '8px' }}>
                  <small>상위 요구사항</small>
                  <b>{activeReq.linkedRequirements[0] ?? 'SYSR-PROP-009'}</b>
                </div>
                <span>→</span>
                <div className="flow-step-node active-node" style={{ padding: '8px' }}>
                  <small>현재 SW 요구사항</small>
                  <b>{activeReq.id}</b>
                </div>
                <span>→</span>
                <div className="flow-step-node" style={{ padding: '8px' }}>
                  <small>검증 시험 (TC)</small>
                  <b>{activeReq.linkedTestCases[0] ?? 'TC-PROP-NORMAL-009'}</b>
                </div>
              </div>
            </div>
          )}
        </div>
      </section>

      {/* 3열: 정형 조건 / 기능 흐름 / Trace 서브패널 */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
        <section className="info-card">
          <div className="info-card-header">
            <h3 className="info-card-title">
              <span>⚙️</span>
              <span>정형 조건 (Formalized)</span>
            </h3>
          </div>

          <div className="req-formal-box">
            <b style={{ color: '#0369a1' }}>WHEN</b>
            <ul style={{ margin: '0 0 4px 16px', padding: 0 }}>
              <li>PropulsionRequest &gt;= 0</li>
              <li>Validity == VALID</li>
            </ul>

            <b style={{ color: '#0369a1' }}>THEN</b>
            <ul style={{ margin: '0 0 0 16px', padding: 0 }}>
              <li>eDriveCommand = f(PropulsionRequest, VehicleState)</li>
              <li>출력 토크가 보정 범위 내에 있어야 함</li>
            </ul>
          </div>
        </section>

        {relatedTc && (
          <section className="info-card">
            <div className="info-card-header">
              <h3 className="info-card-title">
                <span>🧪</span>
                <span>연결된 시험 (TC)</span>
              </h3>
            </div>

            <div style={{ fontSize: '12px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '6px' }}>
                <b style={{ fontFamily: 'monospace' }}>{relatedTc.id}</b>
                <span className="sidebar-badge badge-active">{relatedTc.verificationLevel}</span>
              </div>
              <p style={{ margin: '0 0 6px 0', color: '#475569' }}>{relatedTc.stimulus} → {relatedTc.expectedResult}</p>

              {onOpenBenchWithTc && (
                <button
                  type="button"
                  className="timeline-btn"
                  onClick={() => onOpenBenchWithTc(relatedTc.id)}
                  style={{ width: '100%', justifyContent: 'center', marginTop: '6px' }}
                >
                  재현 시험에서 검증하기 →
                </button>
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  )
}
