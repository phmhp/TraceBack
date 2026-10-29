import { Component, useEffect } from 'react'
import type { ReactNode } from 'react'
import { Canvas, useThree } from '@react-three/fiber'
import { PlaceholderVehicle } from '../graphics/PlaceholderVehicle'
function Camera() {
  const { camera, invalidate } = useThree()
  useEffect(() => { camera.lookAt(0, .85, 0); camera.updateProjectionMatrix(); invalidate() }, [camera, invalidate])
  return null
}
class Boundary extends Component<{ children: ReactNode }, { failed: boolean }> {
  state = { failed: false }
  static getDerivedStateFromError() { return { failed: true } }
  render() { return this.state.failed ? <p className="webgl-fallback">3D 미리보기를 표시할 수 없습니다. 아래 계기판에서 실제 상태를 확인할 수 있어요.</p> : this.props.children }
}
export function VehicleView({ ready, powered }: { ready: boolean; powered: boolean }) {
  return <div className={`vehicle-view ${ready ? 'vehicle-ready' : ''}`} role="img" aria-label={`TRACKBACK 차량 모델 · ${ready ? '주행 준비 완료' : powered ? '시동 대기' : '전원 꺼짐'}`}>
    <span className="vehicle-caption">LAB EV / 01</span>
    <Boundary><Canvas frameloop="demand" dpr={[1, 1.5]} camera={{ position: [5, 3.2, -6], fov: 38 }} fallback={<p>계기판 모드로 표시합니다.</p>}>
      <Camera/><ambientLight intensity={powered ? 1.7 : .7}/><directionalLight position={[3, 5, -4]} intensity={2.5} color="#d2eaff"/><directionalLight position={[-4, 3, 2]} intensity={ready ? 2.5 : .7} color="#68ebbd"/>
      <PlaceholderVehicle showDriver={false}/><gridHelper args={[10, 20, '#2b514c', '#213035']} position={[0, .03, 0]}/>
    </Canvas></Boundary>
    <span className="vehicle-note">정적 모델 · 상태는 아래 계기판에 반영</span>
  </div>
}
