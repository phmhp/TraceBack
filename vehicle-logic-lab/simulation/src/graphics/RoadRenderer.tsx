import type { Vector3Value } from '../domain/vehicle/VehicleState'

/** Flat Phase 2 driving surface. No trees, buildings or new decoration. */
export function RoadRenderer({ halfExtents, position }: { halfExtents: Vector3Value; position: Vector3Value }) {
  const top = position.y + halfExtents.y
  return <group>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[position.x, top, position.z]} receiveShadow>
      <planeGeometry args={[halfExtents.x * 2, halfExtents.z * 2]} /><meshStandardMaterial color="#c9d3c6" />
    </mesh>
    <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, top + 0.01, position.z]} receiveShadow>
      <planeGeometry args={[9, halfExtents.z * 2]} /><meshStandardMaterial color="#b6b9b4" />
    </mesh>
    {[-4.3, 4.3].map((x) => <mesh key={x} rotation={[-Math.PI / 2, 0, 0]} position={[x, top + 0.02, position.z]}>
      <planeGeometry args={[0.1, halfExtents.z * 2]} /><meshBasicMaterial color="#fff2d6" />
    </mesh>)}
    {Array.from({ length: 200 }, (_, i) => <mesh key={i} rotation={[-Math.PI / 2, 0, 0]} position={[0, top + 0.02, 490 - i * 10]}>
      <planeGeometry args={[0.12, 3]} /><meshBasicMaterial color="#fff2d6" />
    </mesh>)}
  </group>
}
