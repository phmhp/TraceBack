import { Canvas } from '@react-three/fiber'
import { PlaceholderVehicle } from '../../graphics/PlaceholderVehicle'

/** Reuses the actual driving scene roadster and CatDriver, without simulation state. */
export function DriverPortrait() {
  return <div className="driver-portrait" role="img" aria-label="기존 주행 화면의 고양이 운전자와 민트색 차량 사건 사진">
    <Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [3.8, 2.9, -6], fov: 34 }}
      onCreated={({ camera }) => camera.lookAt(0, 1.3, 0)}>
      <ambientLight intensity={1.6}/>
      <directionalLight position={[-3, 6, -4]} intensity={2.8} color="#fff0d7"/>
      <hemisphereLight args={['#e6f0ec', '#aaa079', 1]}/>
      <PlaceholderVehicle/>
    </Canvas>
  </div>
}
