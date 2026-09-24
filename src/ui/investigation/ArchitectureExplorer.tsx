import { architectureNode, normalFunctionFlows } from '../../registries/investigation/Architecture'
import { useCase } from '../state/CaseContext'

const runtimePath = ['GearLogic', 'PropulsionFunction', 'VMC', 'eDrive']

export function ArchitectureExplorer({ selected, onSelect, onTrace, onRequirements }: { selected: string; onSelect: (id: string) => void; onTrace: () => void; onRequirements: (id?: string) => void }) {
    const { controller } = useCase(), node = architectureNode(selected), active = controller.definition.incidentPath

    const tile = (id: string, showKind = true) => {
        const item = architectureNode(id),
            isActive = active.includes(id);

        return (
            <button
                key={id}
                className={`architecture-node ${isActive ? 'incident-node' : ''}`}
                aria-pressed={id === selected}
                onClick={() => onSelect(id)}
            >
                {showKind && (
                    <small>
                        {item.kind === 'DRIVER'
                            ? '운전자 입력'
                            : item.kind === 'PLANT'
                                ? '차량 거동'
                                : '차량 내부 SW'}
                    </small>
                )}

                <b>{item.label}</b>
            </button>
        )
    }

    const flow = normalFunctionFlows[node.id] ?? [node.role]
    return <section className="architecture-workspace"><article className="logical-architecture"><header><div><small>Logical Vehicle Function Architecture</small><h3>운전자 요구에서 차량 거동까지</h3></div><p>이번 사건과 연결된 경로는 강조되어 있습니다.</p></header><div className="architecture-lanes"><section className="architecture-boundary"><h4>Driver Demand</h4>{tile('DriverInput')}</section><i>→</i><section className="architecture-internal"><h4>Vehicle Internal SW</h4>
        <div className="architecture-chain">
            {runtimePath.map((id, index) =>
                <span key={id}>
                    {index > 0 && <i>→</i>}
                    {tile(id, false)}
                </span>
            )}
        </div>
    </section><i>→</i><section className="architecture-boundary"><h4>Vehicle Action</h4>{tile('VehiclePhysics')}</section></div><div className="architecture-feedback">↶ <code>VehicleSpeed</code> · <code>LongitudinalVelocity</code> 피드백이 <code>GearLogic</code>과 <code>VMC</code>의 입력으로 사용됩니다.</div></article><article className="architecture-detail"><header><div><small>선택한 기능</small><h3>{node.label}</h3></div><span className="selection-marker">{node.kind === 'SW' ? 'SW 기능' : '경계 영역'}</span></header><p>{node.role}</p><div className="function-detail-grid"><section><h4>입력</h4>{node.inputs.map(value => <code key={value}>{value}</code>)}</section><section><h4>처리</h4>{flow.map((step, index) => <p key={step}>{index > 0 && <i>↓</i>}{step}</p>)}</section><section><h4>출력</h4>{node.outputs.map(value => <code key={value}>{value}</code>)}</section></div>{node.kind === 'SW' && <div className="document-actions"><button className="primary navigation-action" onClick={onTrace}>주행 신호 바로가기 →</button><button className="navigation-action" onClick={() => onRequirements()}>관련 요구사항 바로가기 →</button></div>}</article></section>
}
