import { CatDriver } from './CatDriver'
import { Blob, SoftBox } from './SoftShapes'

/** Art-only toy roadster. No chassis, colliders, or vehicle domain state. */
export function PlaceholderVehicle({ engineering = false, celebrating = false }: { engineering?: boolean; celebrating?: boolean }) {
  const paint = engineering ? '#6dccd1' : '#76c9c1'
  return <group>
    <SoftBox size={[1.88, 0.58, 2.95]} position={[0, 0.64, 0]} radius={0.28} color={paint} wireframe={engineering} />
    <SoftBox size={[1.8, 0.38, 1.05]} position={[0, 0.99, -0.97]} radius={0.18} color={paint} wireframe={engineering} />
    <SoftBox size={[1.66, 0.23, 0.6]} position={[0, 0.91, 1.08]} radius={0.1} color={paint} wireframe={engineering} />
    <SoftBox size={[1.36, 0.2, 1.36]} position={[0, 0.89, 0.15]} radius={0.09} color="#42585b" />
    <SoftBox size={[1.13, 0.63, 0.24]} position={[0, 1.11, 0.7]} radius={0.1} color="#f4dfb9" />
    <SoftBox size={[1.77, 0.17, 0.23]} position={[0, 0.47, -1.49]} radius={0.07} color="#fff3d6" />
    <SoftBox size={[1.77, 0.17, 0.23]} position={[0, 0.47, 1.48]} radius={0.07} color="#fff3d6" />
    <SoftBox size={[0.74, 0.23, 0.06]} position={[0, 0.72, -1.491]} radius={0.03} color="#36565b" />
    {[0, 1, 2].map((i) => <SoftBox key={i} size={[0.6, 0.018, 0.026]} position={[0, 0.65 + i * 0.06, -1.53]} radius={0.005} color="#d8e9dc" />)}
    {[-1, 1].map((side) => <group key={side}>
      {[-0.91, 0.91].map((z) => <group key={z} name={z < 0 ? `front-wheel-${side}` : `rear-wheel-${side}`} position={[side * 0.93, 0.43, z]}><group name="wheel-spin" rotation={[0, Math.PI / 2, 0]}>
        <mesh castShadow><torusGeometry args={[0.3, 0.125, 16, 40]} /><meshStandardMaterial color="#354b54" roughness={0.9} /></mesh>

        <mesh rotation={[Math.PI / 2, 0, 0]} position={[0, 0, side * 0.11]}><cylinderGeometry args={[0.21, 0.21, 0.05, 32]} /><meshStandardMaterial color="#fff0cc" metalness={0.25} roughness={0.35} /></mesh>
        <Blob position={[0, 0, side * 0.15]} scale={[0.09, 0.09, 0.035]} color="#e9ac73" metalness={0.35} />
      </group></group>)}
      <Blob position={[side * 0.62, 0.99, -1.39]} scale={[0.24, 0.25, 0.11]} color="#faf0cf" metalness={0.15} roughness={0.2} />
      <Blob position={[side * 0.62, 0.99, -1.48]} scale={[0.175, 0.18, 0.045]} color="#fffbdc" roughness={0.14} />
      <Blob position={[side * 0.68, 0.78, 1.41]} scale={[0.17, 0.11, 0.06]} color="#ee9b8c" />
      <Blob position={[side * 1.01, 1.16, -0.44]} scale={[0.17, 0.1, 0.13]} color={paint} roughness={0.25} />
    </group>)}
    <SoftBox size={[0.2, 0.016, 0.7]} position={[0, 1.185, -0.98]} radius={0.007} color="#fff1d1" />
    {!engineering && <mesh position={[0, 1.08, -0.43]} rotation={[0.55, 0, 0]} castShadow>
      <torusGeometry args={[0.3, 0.04, 12, 40]} /><meshStandardMaterial color="#6c9188" roughness={0.55} />
    </mesh>}
    {!engineering && <CatDriver celebrating={celebrating} />}
  </group>
}
