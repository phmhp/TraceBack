import { useEffect, useMemo, useRef } from 'react'
import { createVehicleState, type VehicleState, type VehicleStateReader } from '../../domain/vehicle/VehicleState.ts'
import type { MapDefinition } from '../../domain/world/MapDefinition.ts'
import { createMinimapProjection } from '../../world/minimap/MinimapProjection.ts'

export function Minimap({ map, readVehicleState }: { map: Readonly<MapDefinition>; readVehicleState: VehicleStateReader }) {
  const marker = useRef<SVGGElement>(null); const scratch = useRef<VehicleState>(createVehicleState())
  const route = map.routes.find((candidate) => candidate.routeId === map.minimapConfig.routeId)!
  const projection = useMemo(() => createMinimapProjection(route, map.minimapConfig), [route, map.minimapConfig])
  const outline = route.orderedPoints.map((point) => { const p = projection.project(point); return `${p.x},${p.y}` }).join(' ')
  const finish = projection.project(route.finishPoint)
  const start = projection.project(route.startPoint)
  useEffect(() => { let frame = 0; const update = () => { const state = readVehicleState(); Object.assign(scratch.current.position, state.position); Object.assign(scratch.current.rotation, state.rotation); const p = projection.project(scratch.current.position); marker.current?.setAttribute('transform', `translate(${p.x} ${p.y}) rotate(${projection.heading(scratch.current.rotation)})`); frame = requestAnimationFrame(update) }; frame = requestAnimationFrame(update); return () => cancelAnimationFrame(frame) }, [projection, readVehicleState])
  return <aside className="minimap" aria-label={`${map.displayName} minimap`}><svg viewBox={`0 0 ${map.minimapConfig.width} ${map.minimapConfig.height}`} role="img">
    <polyline className="minimap-route-shadow" points={outline} /><polyline className="minimap-route" points={outline} />
    <g transform={`translate(${start.x} ${start.y})`}><circle className="minimap-start" r="3.5" fill="#79bd88" stroke="#fff7df" strokeWidth="1.5"/></g>
    <g transform={`translate(${finish.x} ${finish.y})`}><rect className="minimap-finish" x="-4" y="-4" width="8" height="8" /></g>
    <g ref={marker} className="minimap-ego"><path d="M 0 -8 L 6 7 L 0 4 L -6 7 Z" /></g>
  </svg></aside>
}
